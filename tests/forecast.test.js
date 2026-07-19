import { test } from 'node:test';
import assert from 'node:assert';
import { forecast } from '../src/see_toolkit/modules/connections/forecast.js';

test('forecast summarizes recent samples', () => {
  const f = forecast([100, 200, 300, 400]);
  assert.equal(f.median, 250);
  assert.equal(f.lowerQuartile, 175);
  assert.equal(f.n, 4);
});
test('forecast caps to recent N', () => {
  const many = Array.from({ length: 40 }, (_, i) => i);
  const f = forecast(many, 10);
  assert.equal(f.n, 10);
  assert.equal(f.median, 34.5); // last 10 are 30..39
});
test('empty samples yield null stats', () => {
  const f = forecast([]);
  assert.equal(f.median, null);
  assert.equal(f.n, 0);
});
