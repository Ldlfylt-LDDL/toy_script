import { test } from 'node:test';
import assert from 'node:assert';
import { planSolarUpgrades } from '../src/see_toolkit/modules/solarUpgrade.js';

test('schedules an upgrade at next night start for each solar plant', () => {
  const solarPlants = [{ id: 1 }, { id: 2 }];
  const out = planSolarUpgrades({ solarPlants, k: 147, activityAt: () => undefined });
  assert.deepEqual(out, [{ buildingId: 1, tick: 152 }, { buildingId: 2, tick: 152 }]);
});
test('skips a plant already scheduled to Upgrade at the target tick (idempotent)', () => {
  const solarPlants = [{ id: 1 }, { id: 2 }];
  const activityAt = (id, tick) => (id === 1 && tick === 152 ? 'Upgrade' : undefined);
  const out = planSolarUpgrades({ solarPlants, k: 147, activityAt });
  assert.deepEqual(out, [{ buildingId: 2, tick: 152 }]);
});
