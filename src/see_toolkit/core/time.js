export const MAX_FUTURE_TICKS = 12;
export const phase = (t) => ((t % 6) + 6) % 6;
export const isNight = (t) => { const p = phase(t); return p >= 2 && p <= 4; };
export const isDay = (t) => !isNight(t);
export function nextNightStart(k) {
  let t = k;
  while (phase(t) !== 2) t++;
  return t;
}
