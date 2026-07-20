import { phase } from '../../core/time.js';

// Expected sellable output by phase, from a building's recent delivered-output
// history. history: [{ timeTick, delivered }]. Returns { [phase]: avgDelivered }.
export function expectedByPhase(history) {
  const sums = {}, counts = {};
  for (const h of history || []) {
    if (h.delivered == null) continue;
    const p = phase(h.timeTick);
    sums[p] = (sums[p] || 0) + h.delivered;
    counts[p] = (counts[p] || 0) + 1;
  }
  const out = {};
  for (const p of Object.keys(sums)) out[p] = sums[p] / counts[p];
  return out;
}

export function expectedAt(byPhase, tick) {
  const v = byPhase[phase(tick)];
  return v == null ? 0 : v;
}

// Expected output only counts if the plant is scheduled to PRODUCE at that tick.
// If it is scheduled to Upgrade/Maintenance/Sleep, it delivers nothing that tick,
// so hedging its output there would be a naked short. (We know our own schedule.)
export function productionExpected(byPhase, scheduledState, tick) {
  if (scheduledState && scheduledState !== 'Production') return 0;
  return expectedAt(byPhase, tick);
}

// Prices must be a multiple of 5 (server validation). Round DOWN for a sell so it
// still crosses the bid it was derived from.
export function roundToStep(price, step = 5) {
  return Math.floor(price / step) * step;
}

// Non-negative hedge quantity, never exceeding expected output (no naked short).
export function hedgeQuantity({ expected, fraction = 0.5, alreadyHedged = 0 }) {
  const target = fraction * expected;
  const q = Math.round(target - alreadyHedged);
  return Math.max(0, Math.min(q, Math.floor(expected)));
}

export const passesFloor = (bid, floor) => bid != null && bid >= floor;

export const fee = (qty, price) => Math.round(0.05 * qty * price);
