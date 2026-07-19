export const MAX_FUTURE_TICKS = 12;
export const phase = (t) => ((t % 6) + 6) % 6;
export const isNight = (t) => { const p = phase(t); return p >= 2 && p <= 4; };
export const isDay = (t) => !isNight(t);
export function nextTickWithPhase(k, p) {
  let t = k;
  while (phase(t) !== p) t++;
  return t;
}
export const nextNightStart = (k) => nextTickWithPhase(k, 2);
