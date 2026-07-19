import { test } from 'node:test';
import assert from 'node:assert';
import { scoreConnection, DECOMMISSION_GRADIENT } from '../src/see_toolkit/modules/connections/evaluate.js';

test('flags decommission when gradient is tiny (endpoints move together)', () => {
  const r = scoreConnection({ realizedPerTick: 500, gradientAmplitude: 5, undersupplyRate: 0 });
  assert.equal(r.decommission, true);
});
test('flags decommission on chronic undersupply with no profit', () => {
  const r = scoreConnection({ realizedPerTick: -50, gradientAmplitude: 100, undersupplyRate: 0.8 });
  assert.equal(r.decommission, true);
});
test('healthy connection is not flagged and scores higher', () => {
  const good = scoreConnection({ realizedPerTick: 5000, gradientAmplitude: 200, undersupplyRate: 0.1 });
  assert.equal(good.decommission, false);
  assert.ok(good.score > 0);
});
test('threshold constant exported', () => assert.equal(DECOMMISSION_GRADIENT, 20));
