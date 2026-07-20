import { nextTickWithPhase } from '../core/time.js';
import { gameHeaders } from '../core/api.js';
import { normalizeActivities, stateAt, buildingActivityPayload } from './activities.js';

export const MAINT_THRESHOLD = 50;

// Pure: which buildings need maintenance and at which tick.
// startPhaseOf(building) -> phase 0..5 to begin maintenance (solar: 2 = night start;
//   fossil: the lowest-output phase). hasUpgrade(id) -> bool (an upgrade already repairs it).
export function planMaintenance({ buildings, k, threshold = MAINT_THRESHOLD, startPhaseOf, hasUpgrade }) {
  const out = [];
  for (const b of buildings) {
    if (b.condition == null || b.condition >= threshold) continue;
    if (b.kind === 'SolarPowerPlant' && hasUpgrade(b.id)) continue; // nightly upgrade will repair it
    const tick = nextTickWithPhase(k, startPhaseOf(b));
    out.push({ buildingId: b.id, tick });
  }
  return out;
}

// Lowest-output phase for a building: solar plants are lowest at night start (2);
// fossil/always-on use the injected recent-output phase map, defaulting to 2.
export function startPhaseFor(building, lowestOutputPhase) {
  if (building.kind === 'SolarPowerPlant') return 2;
  const p = lowestOutputPhase && lowestOutputPhase[building.id];
  return p == null ? 2 : p;
}

export function maintenanceModule({ fetchJSON, fetchImpl = fetch, cache, upgradeTargets = () => new Set(), lowestOutputPhase = () => ({}) }) {
  async function activitiesFor(playerId, buildingId, k) {
    const raw = await cache.get(`bact:${buildingId}`, async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || []);
    return normalizeActivities(raw, k);
  }
  return {
    id: 'maintenance', title: 'Maintenance Backstop',
    async plan(state) {
      const upgrades = upgradeTargets(state); // Set of building ids getting upgraded this night
      const phases = lowestOutputPhase(state);
      const decisions = planMaintenance({
        buildings: state.buildings || [],
        k: state.k,
        startPhaseOf: (b) => startPhaseFor(b, phases),
        hasUpgrade: (id) => upgrades.has(id),
      });
      const norm = {};
      await Promise.all(decisions.map(async (d) => { norm[d.buildingId] = await activitiesFor(state.playerId, d.buildingId, state.k); }));
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
      return { writes, view: { candidates: decisions.length } };
    },
    render(view, el) { if (el) el.textContent = `Maintenance: ${view.candidates} building(s) below condition ${MAINT_THRESHOLD}`; },
  };
}
