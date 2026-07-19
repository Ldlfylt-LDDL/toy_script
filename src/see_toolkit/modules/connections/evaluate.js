export const DECOMMISSION_GRADIENT = 20;

// Score a connection on realized profit + cycle price-gradient opportunity, and
// flag decommission candidates (tiny gradient = endpoints move together, or
// chronic undersupply with no profit).
export function scoreConnection({ realizedPerTick = 0, gradientAmplitude = 0, undersupplyRate = 0 }) {
  const score = Math.round(realizedPerTick + gradientAmplitude * 10 - undersupplyRate * 500);
  const decommission =
    gradientAmplitude < DECOMMISSION_GRADIENT || (undersupplyRate > 0.6 && realizedPerTick <= 0);
  return { score, decommission };
}
