# SimEnergyEmpire Toolkit — Automation Modules (Plans 2 & 3)

> Builds on the foundation (Plan 1). REQUIRED SUB-SKILL: executing-plans / subagent-driven-development.

**Goal:** Add the four automation modules on the core: solar night upgrade, maintenance backstop, money pickup (Plan 2), and the connection manager — price accumulator, evaluation, forecast, auto-direction + purchase-price stop-loss (Plan 3). Wire all modules into a single scheduled run loop in `main.js`. Retire the old `scripts/see_toolkit.user.js` once parity is reached.

**Architecture:** Each module exposes `plan(state) -> { writes, view }` with pure decision helpers (unit-tested) and thin live-write adapters. Connection forecasting models the observable price spread per (hub-pair, phase) using a recency-capped median + lower-quartile gate, never a causal model.

## Global Constraints
- Same as Plan 1 (signing, night phase `t%6∈{2,3,4}`, MAX_FUTURE_TICKS=12, injected effects, serialized idempotent writes).
- Connection writes set both `capacity` (direction) and `purchasePrice` (stop-loss) in one PUT to `/api/v1/edges/{edgeId}/connections/{connId}/activities/`.
- Money pickup: `PATCH /api/v1/players/{id}/money-transactions/` body `{pickUpHubId}` per distinct hub.
- Maintenance threshold constant `MAINT_THRESHOLD = 50`.

---

## Plan 2 — Scheduling automations

- **T2.1 time.nextTickWithPhase(k, p)** — generalize `nextNightStart`. Tests.
- **T2.2 modules/solarUpgrade.js** — pure `planSolarUpgrades({solarPlants,k,activityAt})` → `[{buildingId,tick}]`, target `nextTickWithPhase(k,2)`, idempotent skip if already `Upgrade`. Adapter builds writes (PUT state=Upgrade). Tests.
- **T2.3 modules/maintenance.js** — pure `planMaintenance({buildings,k,threshold,startPhaseOf,hasUpgrade})` → candidates; solar skipped if an upgrade already repairs it that night; tick = `nextTickWithPhase(k, startPhaseOf(b))`. Tests.
- **T2.4 modules/moneyPickup.js** — pure `distinctPickupHubs(transactions)`; adapter PATCHes per hub. Tests.

## Plan 3 — Connection manager

- **T3.1 core/stats.js** — pure `median`, `lowerQuartile`, `recentN`. Tests.
- **T3.2 modules/connections/priceStore.js** — record hub prices per tick (store-backed, capped); `spreadSamples(prices, h1, h2, phase, phaseOf)` → `[dst[T+1]-src[T]]`. Tests.
- **T3.3 modules/connections/forecast.js** — `forecastSpread(samples)` → `{median, lowerQuartile, n}`. Tests.
- **T3.4 modules/connections/direction.js** — `decideDirection({current, forward, reverse, threshold})`; `bumpStreak(prev,desired,current)` hysteresis. Tests.
- **T3.5 modules/connections/stopLoss.js** — `purchaseCap({forecastDstNext, perUnitCost, buffer})`. Tests.
- **T3.6 modules/connections/evaluate.js** — `scoreConnection({realizedPerTick, gradientAmplitude, undersupplyRate})` → `{score, decommission}`. Tests.
- **T3.7 modules/connections/index.js** — wires the above into a `plan(state)` module (live adapter, not unit-tested).

## Integration
- **T4.1 main.js** — build core (api/game/cache/store/scheduler), register modules, single on-load + hourly run loop, dry-run flag via `localStorage['see:dryRun']`.
- **T4.2** — delete `scripts/see_toolkit.user.js` (parity reached). Final `npm test` + `npm run build`.
