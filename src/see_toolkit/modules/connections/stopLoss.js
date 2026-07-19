// Maximum Purchase Price cap (the `purchasePrice` field): only buy at source if
// the delivered unit can still be sold profitably next tick. If source spot
// exceeds this, the connection sources nothing that tick instead of buying at a loss.
export function purchaseCap({ forecastDstNext, perUnitCost = 0, buffer = 0 }) {
  if (forecastDstNext == null) return null;
  return Math.max(0, Math.round(forecastDstNext - perUnitCost - buffer));
}
