import { test } from 'node:test';
import assert from 'node:assert';
import { distinctPickupHubs } from '../src/see_toolkit/modules/moneyPickup.js';

test('collapses transactions to distinct hub ids', () => {
  const txs = [
    { hubId: 8166, money: 100 }, { hubId: 8166, money: 50 }, { hubId: 8080, money: 200 },
  ];
  assert.deepEqual(distinctPickupHubs(txs).sort(), [8080, 8166]);
});
test('ignores already-picked-up transactions', () => {
  const txs = [{ hubId: 1, pickedUp: true }, { hubId: 2, pickedUp: false }];
  assert.deepEqual(distinctPickupHubs(txs), [2]);
});
