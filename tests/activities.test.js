import { test } from 'node:test';
import assert from 'node:assert';
import { normalizeActivities, stateAt, buildingActivityPayload } from '../src/see_toolkit/modules/activities.js';

test('normalizeActivities carries Production forward with negative placeholder ids', () => {
  const acts = [{ timeTick: 140, state: 'Production', id: 1, purchasePrice: 0, firstInChain: true, isBoosted: false }];
  const norm = normalizeActivities(acts, 147); // fills up to 147+12
  const at146 = norm.find((a) => a.timeTick === 146);
  assert.equal(at146.state, 'Production');
  assert.ok(at146.id < 0, 'carried activity has a negative placeholder id');
});
test('stateAt returns the scheduled state or undefined', () => {
  const norm = [{ timeTick: 152, state: 'Upgrade' }];
  assert.equal(stateAt(norm, 152), 'Upgrade');
  assert.equal(stateAt(norm, 153), undefined);
});
test('buildingActivityPayload sets new state, keeps the rest', () => {
  const a = { id: 9, purchasePrice: 100, timeTick: 152, firstInChain: true, isBoosted: false, extra: 'x' };
  assert.deepEqual(buildingActivityPayload(a, 'Upgrade'), {
    id: 9, purchasePrice: 100, state: 'Upgrade', timeTick: 152, firstInChain: true, isBoosted: false,
  });
});
