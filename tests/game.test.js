import { test } from 'node:test';
import assert from 'node:assert';
import { makeGame } from '../src/see_toolkit/core/game.js';
import { makeTickCache } from '../src/see_toolkit/core/cache.js';

function fakeFetchJSON(routes) {
  return async (url) => {
    for (const [re, val] of routes) if (re.test(url)) return typeof val === 'function' ? val(url) : val;
    throw new Error('no route ' + url);
  };
}

test('loadState assembles tick + player + buildings + connections via cache', async () => {
  let buildingCalls = 0;
  const fetchJSON = fakeFetchJSON([
    [/app-data/, { era: { lastComputedTick: 146 } }],
    [/players\/me\//, { id: 2689 }],
    [/players\/2689\/buildings\//, () => { buildingCalls++; return { buildings: [{ id: 1, kind: 'SolarPowerPlant' }] }; }],
    [/players\/2689\/connections\//, { connections: [{ id: 9, kind: 'Power' }] }],
  ]);
  const game = makeGame({ fetchJSON, cache: makeTickCache() });
  const s1 = await game.loadState();
  const s2 = await game.loadState();
  assert.equal(s1.lastComputedTick, 146);
  assert.equal(s1.k, 147);
  assert.equal(s1.playerId, 2689);
  assert.deepEqual(s1.buildings, [{ id: 1, kind: 'SolarPowerPlant' }]);
  assert.deepEqual(s1.connections, [{ id: 9, kind: 'Power' }]);
  assert.equal(buildingCalls, 1); // cached within the same tick
  assert.deepEqual(s2.buildings, s1.buildings);
});
