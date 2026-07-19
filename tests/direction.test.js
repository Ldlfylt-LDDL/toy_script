import { test } from 'node:test';
import assert from 'node:assert';
import { decideDirection, bumpStreak, shouldFlip } from '../src/see_toolkit/modules/connections/direction.js';

const S = (median, lq, n = 20) => ({ median, lowerQuartile: lq, n });

test('cold start keeps current when too few samples', () => {
  assert.equal(decideDirection({ current: 'forward', forward: S(-10, -20, 2), reverse: S(200, 150, 2) }), 'forward');
});
test('flips to reverse when it is safely positive and much better', () => {
  assert.equal(decideDirection({ current: 'forward', forward: S(-50, -80), reverse: S(200, 150), threshold: 20 }), 'reverse');
});
test('does not flip when best is not safely positive (lowerQuartile <= 0)', () => {
  assert.equal(decideDirection({ current: 'forward', forward: S(-50, -80), reverse: S(30, -5), threshold: 0 }), 'forward');
});
test('does not flip when improvement below threshold', () => {
  assert.equal(decideDirection({ current: 'forward', forward: S(100, 50), reverse: S(110, 60), threshold: 20 }), 'forward');
});
test('hysteresis streak accumulates then flips', () => {
  let st = bumpStreak(null, 'reverse', 'forward');
  assert.deepEqual(st, { dir: 'reverse', streak: 1 });
  assert.equal(shouldFlip(st.streak, 2), false);
  st = bumpStreak(st, 'reverse', 'forward');
  assert.equal(st.streak, 2);
  assert.equal(shouldFlip(st.streak, 2), true);
});
test('streak resets when desired matches current', () => {
  const st = bumpStreak({ dir: 'reverse', streak: 3 }, 'forward', 'forward');
  assert.deepEqual(st, { dir: 'forward', streak: 0 });
});
