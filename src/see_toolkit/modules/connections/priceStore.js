// Accumulates each hub's powerPrice per tick across sessions (store-backed, capped).
// Shape in store: { [hubId]: [{ t, price }, ...] } sorted by tick.

// ── A powerPrice of 0 is NOT a $0 price. ──────────────────────────────────────
// In this game the merit-order clearing price is always strictly positive; a
// shortage merely pins it at the $300 cap, it never falls to 0. A value of 0 is
// the rare marker that the city received NO power at all this tick (full
// blackout). Even a sliver of unmet demand already pins the price at the $300
// cap, so "no power" is the most extreme scarcity there is — a 0 effectively
// means ">= 300", NOT cheap. We therefore normalise 0 up to the cap: the hub
// then reads as the priciest node in the grid and a connection correctly flows
// power TOWARD it, instead of mistaking the blackout for a bargain and turning
// away from a city that desperately needs power.
export const SHORTAGE_PRICE = 300; // merit-order price cap; a shortage pins here
export const isBlackoutPrice = (price) => price === 0;

export function recordPrice(prices, hubId, tick, price, cap = 200) {
  if (price == null) return prices;
  if (isBlackoutPrice(price)) price = SHORTAGE_PRICE; // blackout → max scarcity, see note
  const arr = prices[hubId] || [];
  if (!arr.some((x) => x.t === tick)) arr.push({ t: tick, price });
  arr.sort((a, b) => a.t - b.t);
  if (arr.length > cap) arr.splice(0, arr.length - cap);
  prices[hubId] = arr;
  return prices;
}

export function priceAt(prices, hubId, tick) {
  const arr = prices[hubId];
  if (!arr) return undefined;
  const e = arr.find((x) => x.t === tick);
  return e ? e.price : undefined;
}

// Spread samples for "source srcHub -> dest dstHub" at a given phase:
// dst price at T+1 minus src price at T, for ticks T where phaseOf(T)===ph.
export function spreadSamples(prices, srcHub, dstHub, ph, phaseOf) {
  const src = prices[srcHub] || [];
  const dstMap = new Map((prices[dstHub] || []).map((x) => [x.t, x.price]));
  const out = [];
  for (const { t, price } of src) {
    if (phaseOf(t) !== ph) continue;
    const d = dstMap.get(t + 1);
    if (d != null) out.push(d - price);
  }
  return out;
}

// Absolute price samples for a hub at a given phase (for stop-loss forecasting).
export function hubPriceSamples(prices, hubId, ph, phaseOf) {
  return (prices[hubId] || []).filter((x) => phaseOf(x.t) === ph).map((x) => x.price);
}
