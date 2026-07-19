import { test } from 'node:test';
import assert from 'node:assert';
import { evaluateConnection } from '../src/see_toolkit/modules/connections/index.js';

// Build prices: hub 1 always cheap (30), hub 2 always expensive (295), ticks 0..45.
function fixture() {
  const prices = { 1: [], 2: [] };
  for (let t = 0; t <= 45; t++) { prices[1].push({ t, price: 30 }); prices[2].push({ t, price: 295 }); }
  return prices;
}
const edge = { hub1Id: 1, hub2Id: 2 };

test('keeps forward when source(hub1) is cheap and dest(hub2) expensive', () => {
  const ev = evaluateConnection({ prices: fixture(), edge, capacity: 30, k: 44 }); // phase(44)=2
  assert.equal(ev.desired, 'forward');
  assert.ok(ev.gradientAmplitude > 200);
});
test('flips a reversed connection toward the profitable direction', () => {
  const ev = evaluateConnection({ prices: fixture(), edge, capacity: -30, k: 44 });
  assert.equal(ev.current, 'reverse');
  assert.equal(ev.desired, 'forward');
});
