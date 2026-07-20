import { test } from 'node:test';
import assert from 'node:assert';
import { expectedByPhase, expectedAt, productionExpected, roundToStep, hedgeQuantity, passesFloor, fee } from '../src/see_toolkit/modules/hedge/sizing.js';
import { applyReserveCap } from '../src/see_toolkit/modules/hedge/reserve.js';

test('expectedByPhase averages delivered output per phase', () => {
  // ticks 138(phase0),144(phase0) delivered 100,200 -> phase0 avg 150
  const hist = [{ timeTick: 138, delivered: 100 }, { timeTick: 144, delivered: 200 }, { timeTick: 140, delivered: 0 }];
  const bp = expectedByPhase(hist);
  assert.equal(bp[0], 150);
  assert.equal(expectedAt(bp, 150), 150); // 150%6=0
  assert.equal(expectedAt(bp, 146), 0);   // phase 2 not present
});
test('productionExpected zeroes output when the plant is scheduled non-Production', () => {
  const bp = { 1: 130 }; // 130 MWh at phase 1 (midday)
  assert.equal(productionExpected(bp, 'Production', 139), 130); // 139%6=1
  assert.equal(productionExpected(bp, 'Upgrade', 139), 0);      // upgrading → no output
  assert.equal(productionExpected(bp, 'Maintenance', 139), 0);
  assert.equal(productionExpected(bp, undefined, 139), 130);    // unknown → assume it runs
});
test('roundToStep rounds down to multiple of 5', () => {
  assert.equal(roundToStep(224), 220);
  assert.equal(roundToStep(225), 225);
});
test('hedgeQuantity caps at expected and never goes negative', () => {
  assert.equal(hedgeQuantity({ expected: 30, fraction: 0.5 }), 15);
  assert.equal(hedgeQuantity({ expected: 30, fraction: 0.5, alreadyHedged: 10 }), 5);
  assert.equal(hedgeQuantity({ expected: 30, fraction: 0.5, alreadyHedged: 20 }), 0); // no negative
  assert.equal(hedgeQuantity({ expected: 10, fraction: 2 }), 10); // capped at expected
});
test('passesFloor and fee', () => {
  assert.equal(passesFloor(225, 150), true);
  assert.equal(passesFloor(120, 150), false);
  assert.equal(fee(100, 225), 1125);
});
test('applyReserveCap keeps best-priced candidates within budget', () => {
  const cands = [
    { tick: 1, qty: 100, price: 225 }, // lock 30000
    { tick: 2, qty: 100, price: 200 }, // lock 30000
    { tick: 3, qty: 100, price: 150 }, // lock 30000
  ];
  const { kept, used, budget } = applyReserveCap(cands, 81825, 0.6); // budget ~49095 → fits one
  assert.equal(kept.length, 1);
  assert.equal(kept[0].price, 225); // highest kept
  assert.equal(used, 30000);
  assert.ok(budget > 49000 && budget < 49100);
});
