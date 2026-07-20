import { nextTickWithPhase } from '../core/time.js';
import { gameHeaders } from '../core/api.js';
import { miniTable } from '../core/ui.js';
import { normalizeActivities, stateAt, buildingActivityPayload } from './activities.js';

export const MAINT_THRESHOLD = 50;

// Pure: which buildings need maintenance and at which tick.
//  - Solar plants: schedule at the next night start (phase 2); a 4-tick job then
//    costs only one daytime tick. Skipped entirely if an upgrade already repairs it.
//  - Always-on plants (gas/coal/wind): no free window exists, and every tick spent
//    running degraded loses output, so maintain ASAP (the next editable tick `k`).
export function planMaintenance({ buildings, k, threshold = MAINT_THRESHOLD, hasUpgrade }) {
  const out = [];
  for (const b of buildings) {
    if (b.condition == null || b.condition >= threshold) continue;
    const isSolar = b.kind === 'SolarPowerPlant';
    if (isSolar && hasUpgrade(b.id)) continue; // nightly upgrade will repair it
    const tick = isSolar ? nextTickWithPhase(k, 2) : k;
    out.push({ buildingId: b.id, tick });
  }
  return out;
}

export function maintenanceModule({ fetchJSON, fetchImpl = fetch, cache, upgradeTargets = () => new Set() }) {
  async function activitiesFor(playerId, buildingId, k) {
    const raw = await cache.get(`bact:${buildingId}`, async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || []);
    return normalizeActivities(raw, k);
  }
  return {
    id: 'maintenance', title: 'Maintenance Backstop',
    async plan(state) {
      const upgrades = upgradeTargets(state); // Set of building ids getting upgraded this night
      const decisions = planMaintenance({
        buildings: state.buildings || [],
        k: state.k,
        hasUpgrade: (id) => upgrades.has(id),
      });
      const norm = {};
      await Promise.all(decisions.map(async (d) => { norm[d.buildingId] = await activitiesFor(state.playerId, d.buildingId, state.k); }));
      const decMap = new Map(decisions.map((d) => [d.buildingId, d.tick]));
      const items = (state.buildings || [])
        .filter((b) => b.condition != null && b.condition < MAINT_THRESHOLD)
        .sort((a, b) => a.condition - b.condition)
        .map((b) => ({
          name: (b.name || `#${b.id}`),
          condition: b.condition,
          action: decMap.has(b.id) ? `→ T${decMap.get(b.id)}` : 'skip (upgrade repairs)',
        }));
      const writes = decisions
        .filter((d) => stateAt(norm[d.buildingId] || [], d.tick) !== 'Maintenance')
        .map((d) => ({
          label: `maint#${d.buildingId}→Maintenance@T${d.tick}`,
          send: async () => {
            const act = (norm[d.buildingId] || []).find((a) => a.timeTick === d.tick);
            if (!act) throw new Error(`no editable activity at T${d.tick}`);
            const url = `/api/v1/players/${state.playerId}/buildings/${d.buildingId}/activities/`;
            const resp = await fetchImpl(url, {
              method: 'PUT', credentials: 'same-origin',
              headers: gameHeaders(url, { extra: { 'Content-Type': 'application/json' } }),
              body: JSON.stringify(buildingActivityPayload(act, 'Maintenance')),
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
          },
        }));
      return { writes, view: { candidates: decisions.length, threshold: MAINT_THRESHOLD, items } };
    },
    render(view, sec) {
      if (!sec) return;
      sec.setDot(view.candidates > 0 ? 'warn' : 'ok');
      sec.setSummary(`${view.candidates} to fix (<${view.threshold}%)`);
      sec.body.replaceChildren(view.items.length
        ? miniTable(['Building', 'Cond', 'Action'],
          view.items.map((i) => [i.name, { text: i.condition + '%', color: i.condition < 50 ? '#ff5252' : '#d6d6d6' }, i.action]))
        : document.createTextNode(`All buildings at or above ${view.threshold}% condition.`));
    },
  };
}
