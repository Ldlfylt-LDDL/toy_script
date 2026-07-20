import { test } from 'node:test';
import assert from 'node:assert';
import { planMaintenance, MAINT_THRESHOLD } from '../src/see_toolkit/modules/maintenance.js';

test('only buildings below threshold are scheduled', () => {
  const buildings = [
    { id: 1, kind: 'GasPowerPlant', condition: 48 },
    { id: 2, kind: 'GasPowerPlant', condition: 80 },
  ];
  const out = planMaintenance({ buildings, k: 147, hasUpgrade: () => false });
  assert.equal(out.length, 1);
  assert.equal(out[0].buildingId, 1);
});
test('fossil/always-on plants are maintained ASAP (next editable tick k)', () => {
  const buildings = [{ id: 3, kind: 'GasPowerPlant', condition: 30 }, { id: 4, kind: 'WindTurbine', condition: 42 }];
  const out = planMaintenance({ buildings, k: 147, hasUpgrade: () => false });
  assert.deepEqual(out, [{ buildingId: 3, tick: 147 }, { buildingId: 4, tick: 147 }]);
});
test('solar plants are maintained at next night start, skipped if an upgrade repairs them', () => {
  const buildings = [{ id: 5, kind: 'SolarPowerPlant', condition: 40 }];
  assert.equal(planMaintenance({ buildings, k: 147, hasUpgrade: () => true }).length, 0);
  assert.deepEqual(planMaintenance({ buildings, k: 147, hasUpgrade: () => false }), [{ buildingId: 5, tick: 152 }]);
});
test('threshold constant is 50', () => assert.equal(MAINT_THRESHOLD, 50));
