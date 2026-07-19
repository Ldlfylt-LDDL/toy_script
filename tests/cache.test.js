import { test } from 'node:test';
import assert from 'node:assert';
import { makeTickCache } from '../src/see_toolkit/core/cache.js';

test('dedupes concurrent gets for the same key (stampede fix)', async () => {
  const cache = makeTickCache();
  let calls = 0;
  const fetcher = async () => { calls++; await new Promise(r => setTimeout(r, 5)); return 'v'; };
  const [a, b] = await Promise.all([cache.get('k', fetcher), cache.get('k', fetcher)]);
  assert.equal(a, 'v'); assert.equal(b, 'v');
  assert.equal(calls, 1);
});
test('setTick to a new tick clears the cache', async () => {
  const cache = makeTickCache();
  let calls = 0;
  const fetcher = async () => { calls++; return calls; };
  cache.setTick(146);
  await cache.get('k', fetcher);
  await cache.get('k', fetcher);
  assert.equal(calls, 1);
  cache.setTick(147);
  await cache.get('k', fetcher);
  assert.equal(calls, 2);
});
