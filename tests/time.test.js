import { test } from 'node:test';
import assert from 'node:assert';
import { phase, isNight, isDay, nextNightStart, MAX_FUTURE_TICKS } from '../src/see_toolkit/core/time.js';

test('phase wraps modulo 6', () => {
  assert.equal(phase(146), 2);
  assert.equal(phase(-1), 5);
});
test('isNight = phase 2,3,4', () => {
  assert.equal(isNight(146), true);   // 146%6=2
  assert.equal(isNight(139), false);  // 139%6=1 (midday)
  assert.equal(isDay(139), true);
});
test('nextNightStart = smallest t>=k with phase 2', () => {
  assert.equal(nextNightStart(146), 146);
  assert.equal(nextNightStart(147), 152);
  assert.equal(nextNightStart(150), 152);
});
test('MAX_FUTURE_TICKS is 12', () => assert.equal(MAX_FUTURE_TICKS, 12));
