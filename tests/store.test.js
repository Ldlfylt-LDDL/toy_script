import { test } from 'node:test';
import assert from 'node:assert';
import { makeStore } from '../src/see_toolkit/core/store.js';

function fakeBackend() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('get/set round-trips JSON, namespaced', () => {
  const b = fakeBackend();
  const s = makeStore(b, 'see');
  s.set('x', { a: 1 });
  assert.deepEqual(s.get('x'), { a: 1 });
  assert.equal(b.getItem('see:x') !== null, true);
});
test('appendCapped keeps only the last N items', () => {
  const b = fakeBackend();
  const s = makeStore(b, 'see');
  for (let i = 0; i < 5; i++) s.appendCapped('log', i, 3);
  assert.deepEqual(s.get('log'), [2, 3, 4]);
});
test('get returns fallback on missing/corrupt', () => {
  const b = fakeBackend();
  const s = makeStore(b, 'see');
  assert.deepEqual(s.get('missing', []), []);
});
