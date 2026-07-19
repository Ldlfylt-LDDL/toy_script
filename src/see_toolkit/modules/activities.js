import { MAX_FUTURE_TICKS } from '../core/time.js';

const ACTIVE_STATES = ['Production', 'Sleep'];

// Replicates the game's activity normalization: builds the activity list from the
// first recorded tick up to k+MAX_FUTURE_TICKS, carrying the last Production/Sleep
// activity forward into gaps with a negative placeholder id (the server treats a
// negative id as "schedule a new activity").
export function normalizeActivities(acts, k) {
  const sorted = [...acts].sort((a, b) => a.timeTick - b.timeTick);
  if (sorted.length === 0) return [];
  const first = sorted[0].timeTick;
  const out = [];
  let placeholderId = -1, deleted = false;
  for (let l = first; l < k + MAX_FUTURE_TICKS; l++) {
    const exact = sorted.find((u) => u.timeTick === l);
    if (exact) {
      out.push(exact);
      if (exact.state === 'Delete') deleted = true;
    } else {
      if (deleted) break;
      let carry;
      for (let d = first; d < l; d++) {
        const p = sorted.find((f) => f.timeTick === d);
        if (p && ACTIVE_STATES.includes(p.state)) carry = p;
      }
      if (!carry) break;
      out.push({ ...carry, timeTick: l, id: placeholderId-- });
    }
  }
  return out;
}

export function stateAt(normalized, tick) {
  const a = normalized.find((x) => x.timeTick === tick);
  return a ? a.state : undefined;
}

// Payload for PUT .../buildings/{id}/activities/ — mirrors the game's edit form.
export function buildingActivityPayload(activity, newState) {
  return {
    id: activity.id,
    purchasePrice: activity.purchasePrice,
    state: newState,
    timeTick: activity.timeTick,
    firstInChain: activity.firstInChain,
    isBoosted: activity.isBoosted,
  };
}
