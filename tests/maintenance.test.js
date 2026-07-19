import { test } from 'node:test';
import assert from 'node:assert';
import { planMaintenance, startPhaseFor, MAINT_THRESHOLD } from '../src/see_toolkit/modules/maintenance.js';

const startPhaseOf = (b) => startPhaseFor(b, { 3: 5 }); // fossil #3 lowest output at phase 5

test('only buildings below threshold are scheduled', () => {
  const buildings = [
    { id: 1, kind: 'GasPowerPlant', condition: 48 },
    { id: 2, kind: 'GasPowerPlant', condition: 80 },
  ];
  const out = planMaintenance({ buildings, k: 147, startPhaseOf, hasUpgrade: () => false });
  assert.equal(out.length, 1);
  assert.equal(out[0].buildingId, 1);
});
test('solar plant skipped when an upgrade already repairs it', () => {
  const buildings = [{ id: 5, kind: 'SolarPowerPlant', condition: 40 }];
  const withUpgrade = planMaintenance({ buildings, k: 147, startPhaseOf, hasUpgrade: () => true });
  assert.equal(withUpgrade.length, 0);
  const without = planMaintenance({ buildings, k: 147, startPhaseOf, hasUpgrade: () => false });
  assert.deepEqual(without, [{ buildingId: 5, tick: 152 }]); // solar → night start phase 2
});
test('fossil maintenance starts at its lowest-output phase', () => {
  const buildings = [{ id: 3, kind: 'GasPowerPlant', condition: 30 }];
  const out = planMaintenance({ buildings, k: 147, startPhaseOf, hasUpgrade: () => false });
  assert.equal(out[0].tick, 149); // phase 5 next from 147 (147%6=3,148=4,149=5)
});
test('threshold constant is 50', () => assert.equal(MAINT_THRESHOLD, 50));
