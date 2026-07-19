// Accumulates each hub's powerPrice per tick across sessions (store-backed, capped).
// Shape in store: { [hubId]: [{ t, price }, ...] } sorted by tick.

export function recordPrice(prices, hubId, tick, price, cap = 200) {
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
