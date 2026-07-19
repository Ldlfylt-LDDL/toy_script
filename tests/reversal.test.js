import { test } from 'node:test';
import assert from 'node:assert';
import { isReversed, directionHubs } from '../src/see_toolkit/modules/connections/reversal.js';

test('reversed = paying more at source(T) than received at dest(T+1)', () => {
  assert.equal(isReversed({ srcPriceAtT: 295, dstPriceAtNext: 200 }), true);
  assert.equal(isReversed({ srcPriceAtT: 175, dstPriceAtNext: 295 }), false);
});
test('capacity sign maps to direction', () => {
  const edge = { hub1Id: 10, hub2Id: 20 };
  assert.deepEqual(directionHubs(edge, 30), { srcHubId: 10, dstHubId: 20 });
  assert.deepEqual(directionHubs(edge, -30), { srcHubId: 20, dstHubId: 10 });
});
