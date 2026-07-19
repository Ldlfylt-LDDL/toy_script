import { test } from 'node:test';
import assert from 'node:assert';
import { purchaseCap } from '../src/see_toolkit/modules/connections/stopLoss.js';

test('cap = forecast dest price minus cost minus buffer', () => {
  assert.equal(purchaseCap({ forecastDstNext: 295, perUnitCost: 5, buffer: 10 }), 280);
});
test('never negative; null forecast yields null (leave cap unset)', () => {
  assert.equal(purchaseCap({ forecastDstNext: 3, perUnitCost: 5, buffer: 10 }), 0);
  assert.equal(purchaseCap({ forecastDstNext: null }), null);
});
