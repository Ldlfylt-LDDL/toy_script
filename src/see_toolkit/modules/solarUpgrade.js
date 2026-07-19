import { nextTickWithPhase } from '../core/time.js';
import { gameHeaders } from '../core/api.js';
import { normalizeActivities, stateAt, buildingActivityPayload } from './activities.js';

// Pure: which solar plants need an upgrade scheduled, and at which tick.
// activityAt(buildingId, tick) -> state string | undefined.
export function planSolarUpgrades({ solarPlants, k, activityAt }) {
  const target = nextTickWithPhase(k, 2); // next night start; 4-tick upgrade loses 1 daytime tick
  const out = [];
  for (const b of solarPlants) {
    if (activityAt(b.id, target) === 'Upgrade') continue; // idempotent
    out.push({ buildingId: b.id, tick: target });
  }
  return out;
}

export function solarUpgradeModule({ fetchJSON, fetchImpl = fetch, cache }) {
  async function activitiesFor(playerId, buildingId, k) {
    const raw = await cache.get(`bact:${buildingId}`, async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || []);
    return normalizeActivities(raw, k);
  }
  return {
    id: 'solar', title: 'Solar Night Upgrade',
    async plan(state) {
      const solar = (state.buildings || []).filter((b) => b.kind === 'SolarPowerPlant');
      const norm = {};
      for (const b of solar) norm[b.id] = await activitiesFor(state.playerId, b.id, state.k);
      const activityAt = (id, tick) => stateAt(norm[id] || [], tick);
      const decisions = planSolarUpgrades({ solarPlants: solar, k: state.k, activityAt });
      const writes = decisions.map((d) => ({
        label: `solar#${d.buildingId}→Upgrade@T${d.tick}`,
        send: async () => {
          const act = (norm[d.buildingId] || []).find((a) => a.timeTick === d.tick);
          if (!act) throw new Error(`no editable activity at T${d.tick}`);
          const url = `/api/v1/players/${state.playerId}/buildings/${d.buildingId}/activities/`;
          const resp = await fetchImpl(url, {
            method: 'PUT', credentials: 'same-origin',
            headers: gameHeaders(url, { extra: { 'Content-Type': 'application/json' } }),
            body: JSON.stringify(buildingActivityPayload(act, 'Upgrade')),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
        },
      }));
      return { writes, view: { scheduled: decisions.length, target: nextTickWithPhase(state.k, 2) } };
    },
    render(view, el) { if (el) el.textContent = `Solar: ${view.scheduled} scheduled for night T${view.target}`; },
  };
}
