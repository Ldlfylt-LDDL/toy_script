import { test } from 'node:test';
import assert from 'node:assert';
import { recordPrice, priceAt, spreadSamples, hubPriceSamples } from '../src/see_toolkit/modules/connections/priceStore.js';
import { phase } from '../src/see_toolkit/core/time.js';

test('recordPrice appends, dedupes by tick, caps length', () => {
  let p = {};
  recordPrice(p, 1, 140, 100);
  recordPrice(p, 1, 140, 999); // duplicate tick ignored
  recordPrice(p, 1, 141, 200);
  assert.equal(priceAt(p, 1, 140), 100);
  assert.equal(priceAt(p, 1, 141), 200);
  for (let t = 200; t < 210; t++) recordPrice(p, 1, t, t, 3);
  assert.equal(p[1].length, 3);
});
test('recordPrice maps a 0 (blackout) to the $300 cap, not a $0 price', () => {
  let p = {};
  recordPrice(p, 1, 140, 0);        // full blackout — most extreme scarcity, reads as >=300
  recordPrice(p, 1, 141, 135);      // genuine low price is kept as-is
  assert.equal(priceAt(p, 1, 140), 300);
  assert.equal(priceAt(p, 1, 141), 135);
});
test('spreadSamples = dst[T+1] - src[T] at matching phase', () => {
  // src hub 1, dst hub 2. T=139 (phase1): dst[140]-src[139]
  const p = {
    1: [{ t: 139, price: 30 }, { t: 145, price: 40 }],   // phase(139)=1, phase(145)=1
    2: [{ t: 140, price: 295 }, { t: 146, price: 300 }],
  };
  const s = spreadSamples(p, 1, 2, 1, phase);
  assert.deepEqual(s, [265, 260]); // 295-30, 300-40
});
test('hubPriceSamples filters by phase', () => {
  const p = { 9: [{ t: 139, price: 30 }, { t: 140, price: 250 }, { t: 145, price: 40 }] };
  assert.deepEqual(hubPriceSamples(p, 9, 1, phase), [30, 40]); // phase 1 ticks
});
