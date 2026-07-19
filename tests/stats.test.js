import { test } from 'node:test';
import assert from 'node:assert';
import { median, quantile, lowerQuartile, recentN } from '../src/see_toolkit/core/stats.js';

test('median of odd and even length', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
});
test('quantile interpolates', () => {
  assert.equal(quantile([0, 10], 0.5), 5);
  assert.equal(lowerQuartile([0, 4, 8, 12]), 3);
});
test('recentN takes the tail', () => {
  assert.deepEqual(recentN([1, 2, 3, 4, 5], 2), [4, 5]);
  assert.deepEqual(recentN([1], 5), [1]);
});
