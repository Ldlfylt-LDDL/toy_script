# SimEnergyEmpire Toolkit — Automation Design

Date: 2026-07-19
Target file: `scripts/see_toolkit.user.js` (Tampermonkey userscript, `@match https://www.simenergyempire.com/*`)
Player context: id 2689, "LDDL Corp.", primary country Cimmeria (8006).

## 1. Overview

Four automation modules added to the existing userscript. All operate by sending
the game's own signed API requests directly (no UI automation). All writes are
idempotent, serialized, and only take effect on the next tick (the game defers
execution), so misfires cost at most one tick.

1. **Solar night upgrade** — pre-schedule solar upgrades into the next night so
   they never span daytime (fixes the original bug).
2. **Maintenance backstop** — repair degraded buildings (and solar plants damaged
   by overload) during low-output windows.
3. **Auto money pickup** — collect all floating map money every run.
4. **Connection manager** — evaluate connections, auto-set direction per phase,
   and set a purchase-price stop-loss, all forecast-driven.

A prior "carbon countdown monitor" idea was **dropped** at the user's request
(they are already committed to the solar strategy — see memory `simee-solar-strategy`).

**This is a full rewrite** of the existing single-file userscript into a
core + modules architecture with a build step (see §10). The existing Weather
Logger and Connection Checker become modules under the new core. The four
automations above are added as further modules. Rationale: the current two-IIFE
structure has no shared core, so each new feature would duplicate signing/player
/panel code and re-fetch the same data — redundant fetching scales
*multiplicatively* with module count (a naive add of all four could balloon a
single tick's run to 100+ requests vs ~65 with a shared per-tick cache).

## 2. Shared foundations

### 2.1 Time / tick model
- 1 tick = 4 real hours; tick boundaries align to 00:00/04:00/08:00/12:00/16:00/20:00.
- One day/night cycle = 6 ticks. **Night = `((t % 6) + 6) % 6 ∈ {2,3,4}`**, day = `{5,0,1}`.
  Midday solar peak (deepest price crash) is at phase `1`.
- The game allows editing activities up to **12 ticks ahead** (`MAX_FUTURE_TICKS`),
  which is what makes pre-scheduling possible.
- `k = lastComputedTick + 1` is the next editable tick, from
  `GET /api/v1/app-data/` → `era.lastComputedTick`.
- **Do not use `lastComputedTick` to decide day/night** — it lags server settlement
  and was the root cause of the original solar bug. Day/night is derived purely
  from `t % 6`.

### 2.2 Request signing
- GET: cookie auth only, no special headers.
- Writes (PUT/PATCH/POST): use existing `gameHeaders(url, extra)` →
  `X-Prot: md5(url + timestampMs)`, `X-Ts`, `X-tz-offset`, `X-CSRFToken` (from cookie).

### 2.3 Write discipline (applies to every module)
- **Serialize** all writes: `for … await`, never `Promise.all`. Random
  300–800 ms delay between writes. Purpose: avoid concurrent-PUT 400 conflicts
  (the cause of the observed "7 failed" batch) and reduce server load. Not for
  anti-detection.
- **Idempotent**: before writing, read the current server state; skip if the
  desired state is already scheduled. Repeated runs must have zero side effects.
- **Verify after write** where cheap: re-read and confirm the scheduled state.

### 2.4 Triggers
- Run on page load (after the existing 4 s settle delay), then on a
  `setInterval` every 60 minutes. Guard with a busy flag to prevent overlap.
  This survives a tab left open for days without reload.

## 3. Module 1 — Solar night upgrade

Replaces `autoUpgradeSolarIfNight`.

- Compute target tick `t` = smallest `t ≥ k` with `t % 6 === 2` (night start).
- An upgrade takes **4 ticks**; starting at phase 2 occupies phases 2,3,4,5 →
  exactly **one daytime tick lost** (the mathematical minimum). Never start an
  upgrade mid-night (phase 3/4) — that spans more daytime; defer to the next
  phase-2 instead.
- For each solar plant: read `buildingActivitySet`; if tick `t` is already
  `Upgrade`, skip (idempotent). Otherwise
  `PUT /api/v1/players/{id}/buildings/{bid}/activities/` with `state:"Upgrade"`,
  payload mirroring the game form (`id, purchasePrice, state, timeTick:t,
  firstInChain, isBoosted`).
- **On-load future verification**: scan the next 12 ticks of every solar plant's
  schedule; if the expected night upgrade is missing or mis-placed (spanning
  daytime), correct it. This is what makes the automation robust to a tab that
  was asleep / hot-reloaded and missed a cycle.
- localStorage `see_solar_upgrade_done_tick` remains only as a short-lived
  anti-spam cache; correctness comes from the server-state check, not this key.

## 4. Module 2 — Maintenance backstop

- Config constant at top: `MAINT_CONDITION_THRESHOLD = 50`.
- Each run: read all buildings. For any with `condition < 50`, schedule
  `state:"Maintenance"` (same activities PUT, also 4 ticks, restores condition
  to 100).
- **Timing** = the tick with lowest forecast output:
  - Solar-kind → night (phase 2 start), same as upgrades.
  - Always-on fossil (gas/coal/wind) → the phase (`t % 6`) with the lowest
    average recent output for that building (from its activity/history), to
    minimize lost production. There is no zero-cost window for these; pick the
    cheapest.
- **Solar overload backstop**: overload damage is rare (empirically ~1 event
  per 7 plants × 14 ticks) and normally self-heals via the nightly upgrade. But
  a plant damaged on a night it is *not* being upgraded (cash limits mean not
  all 7 upgrade every night) would stay degraded. So: if a solar plant's
  condition dropped below threshold and it has no upgrade scheduled that night,
  schedule a (cheaper) maintenance instead. Maintenance of a solar plant costs
  only ~1 daytime tick (3 of its 4 ticks are zero-value night), far cheaper than
  maintaining an always-on generator.
- Idempotent: skip if the building already has Upgrade or Maintenance at the
  target tick.

## 5. Module 3 — Auto money pickup

- `GET /api/v1/players/{id}/money-transactions/for-pick-up/` → `moneyTransactions[]`,
  each with `hubId`, `money`, `pickedUp:false`.
- **Collection is per-hub, not per-transaction.** Dedupe to distinct `hubId`s.
- For each distinct hub: `PATCH /api/v1/players/{id}/money-transactions/` with
  body `{"pickUpHubId": <hubId>}` (signed). Serialize with delay.
- Trigger every run. Number of writes = distinct hubs with money (e.g. 16
  transactions collapsed to 13 hubs in one sample).

## 6. Module 4 — Connection manager

### 6.0 Verified connection mechanics
- `capacity` is signed: **positive = hub1→hub2, negative = hub2→hub1**.
- **1-tick transport lag**: power sourced at tick `T` is delivered at `T+1`
  (`delivered[T] == sourced[T-1]`). Confirmed by UI ("Leaves X at T+0 · Arrives
  Y at T+1").
- Real prices come from each hub's `powerPrice` history, **not** from
  `purchasePrice`/`meritPrice1` on the activity.
- Transport PUT payload (verified live):
  `{id, state, timeTick, capacity, purchasePrice, isBoosted, firstInChain}` to
  `PUT /api/v1/edges/{edgeId}/connections/{connId}/activities/`.
  **One PUT sets both direction (`capacity` sign) and buy cap (`purchasePrice`)
  for a given future tick**, and different future ticks can hold different values.
- `purchasePrice` = "Maximum Purchase Price" (source buy cap / stop-loss),
  confirmed by setting the UI field to 137 and reading `purchasePrice:137` in the
  PUT. `meritPrice1` = "Offer price" (destination sell price) and is **not** in
  this payload — it is set on the power-pricing page (out of scope here).

### 6.A Price-history accumulator
- localStorage store of `powerPrice` per (hub, tick), appended each run from
  `GET /api/v1/hubs/{hubId}/history/` (12 ticks/call) for every hub involved in
  the player's connections.
- Rationale: the 12-tick API window is too short for robust statistics; accumulate
  across sessions (like the existing WeatherLogger) to build distributions.
- Derived tables: for each **(hub, phase)** and each **(hub-pair, phase)**, keep
  a recency-weighted distribution (median + inter-quartile spread) of price and of
  the directional spread `dest[T+1] − source[T]`.

### 6.B Evaluation / scoring (read-only panel)
Score each connection on two axes (per the user's choice of both):
- **Realized profit**: recent `spread × delivered − wages − loss`.
- **Gradient opportunity**: the cycle amplitude of the (hub-pair, phase) spread
  distribution — potential even if the current fixed direction isn't capturing it.
Plus reliability signals: undersupply frequency (`problemInput`/`sourced<|capacity|`),
reversed fraction, condition. Note: `problemInput:"Power"` is near-constant market
noise, so use *chronic* rates, not per-tick flags.

Output: ranked list; flag **decommission candidates** — low opportunity (both
endpoints move together, e.g. two solar cities) or chronic undersupply. For freed
quota, scan hub-pairs (including unconnected ones) for the largest cycle-aware
spread and **suggest** rebuild targets. Decommission/rebuild are done manually by
the user; the tool only advises.

### 6.C Auto direction (per phase, forecast-driven)
- Forecast `source[T]` and `dest[T+1]` from the recency-weighted (hub-pair, phase)
  spread distribution — **model the observable price/spread, not causes**
  (solar/imports/upgrades/player-behavior are unobservable and already priced in).
- **Decision gate** for setting a tick's direction:
  - Flip only when the median edge > 0 **and** the pessimistic (lower-quartile)
    edge > 0 **and** it exceeds a threshold (≈ wages + safety buffer).
  - **Hysteresis**: require the signal to persist across several ticks before
    flipping, to avoid thrashing at the crossover.
  - **Instability detector**: if a hub's same-phase variance spikes (someone is
    upgrading / dumping there), widen its threshold or mark it untrusted.
  - **Cold-start**: when accumulated data is thin, stay conservative / do nothing.
- Execute by setting the `capacity` sign per editable future tick in the PUT.

### 6.D Purchase-price stop-loss
- Set `purchasePrice = forecast dest[T+1] − per-unit transport/wage cost − safety
  buffer`. Effect: if source spot exceeds the cap, the connection sources 0 that
  tick instead of buying into a loss. This is the hard stop-loss that backs the
  probabilistic direction decision — "don't predict the shock, survive it".
- Combined into the **same PUT** as 6.C (both `capacity` and `purchasePrice` per
  tick). Tradeoff: too tight → frequent zero-sourcing; size the buffer from the
  spread distribution.

### 6.E Fix existing reversal-logic bugs
- **Tick mismatch**: current `checkConnection` compares source vs dest prices at
  the *same* `lastComputedTick`. Correct to the phase-aligned
  `dest[T+1] − source[T]`.
- **Cache stampede**: `getHubPriceMap` under `Promise.allSettled` issues duplicate
  GETs for the same (country, tick). Add in-flight de-duplication (store the
  promise, not just the resolved value).

## 7. Non-goals
- Carbon monitor (dropped).
- Automatic decommission / rebuild of connections (manual).
- Tuning connection capacity magnitude, or offer price (`meritPrice1`).
- Any automated futures/CFD trading — monitor-only if ever added.

## 8. Testing / verification
- The game defers all scheduled actions to the next tick (except amp-Boost, which
  is never used here), so behavior can be verified by reading back the scheduled
  activities before the tick executes.
- Each module gets a dry-run/log mode that prints intended writes without sending,
  for validation against a manual reading of the game state.
- Reuse the confirmed payloads from this doc as fixtures.

## 10. Architecture & build (full rewrite)

### 10.1 Repo / build
- Source split under `src/see_toolkit/`; bundled to
  `dist/see_toolkit.user.js` (the artifact loaded into Tampermonkey).
- Bundler: **esbuild** (single dev dependency, fast, zero-config IIFE output).
  `npm run build` → one self-contained `.user.js`; `npm run watch` for dev.
- The userscript metadata block (`==UserScript==`) is a banner prepended by the
  build (esbuild `banner.js`), so `@match`/`@version` live in one source file.
- `npm test` runs Node unit tests (node:test + node:assert, no framework) over
  the pure-logic modules. Target: all decision/forecast/scheduling logic is
  pure and tested; only the thin adapters touch `fetch`/DOM/localStorage.

### 10.2 Layers
```
src/see_toolkit/
  core/
    api.js         # signed request helpers (md5, gameHeaders, getCookie, fetchJSON)
    game.js        # playerId, app-data/tick provider
    cache.js       # per-tick request cache (buildings/connections/hub-histories fetched once/tick)
    store.js       # localStorage helper: keyed, pruned/ring-buffer, no full-blob re-parse
    time.js        # tick math: phase = t%6, isNight, nextNightStart, MAX_FUTURE_TICKS
    scheduler.js   # single run loop: refresh shared state once, then run modules
    panel.js       # one panel host with collapsible per-module sections + shared drag/toggle
    module.js      # Module interface contract
  modules/
    weather.js        # ported Weather Logger (passive capture → store)
    solarUpgrade.js   # Module 1
    maintenance.js    # Module 2
    moneyPickup.js    # Module 3
    connections/      # Module 4: evaluate.js, forecast.js, direction.js, priceStore.js, reversalFix.js
  main.js          # wires core + registers modules
tests/             # node:test unit tests for pure logic
```

### 10.3 Module interface
Each module implements:
```
{
  id: string,
  title: string,
  // pure: given the shared per-tick state, return intended writes (no side effects)
  plan(state) -> { writes: Request[], view: RenderModel },
  // optional: how to render its panel section
  render(view, sectionEl),
}
```
The scheduler calls `plan(state)` for every module, then either **executes** the
returned writes (serialized, 300–800 ms apart, idempotent) or, in **dry-run
mode**, logs them. This makes every module unit-testable (feed a state fixture,
assert the writes) and satisfies §8.

### 10.4 Shared per-tick cache (kills redundant fetching)
`cache.js` memoizes, keyed by current tick:
`appData`, `buildings` (+ details on demand), `connections` (+ details),
`hubHistory(hubId)`. All modules read through it, so buildings/connections/hub
histories are fetched **once per tick** regardless of how many modules need them.
Cache is invalidated when `lastComputedTick` advances. Fixes the current
`getHubPriceMap` stampede (in-flight promise dedup) and unbounded growth
(per-tick scope, dropped on tick change).

### 10.5 Storage helper (kills full-blob re-parse)
`store.js` replaces the WeatherLogger pattern of parse-entire-log-per-write.
Namespaced keys, append via bounded ring buffer (cap N ticks/records), batched
writes, and a size guard against the ~5 MB localStorage cap. The connection
price-history accumulator (§6.A) and the weather log both use it.

## 9. Open questions / risks
- Forecast quality is inherently limited by unobservable transient shocks; the
  design mitigates via distribution-based gating + stop-loss, not better prediction.
- Cold-start period (thin price history) yields conservative/no connection action
  until enough cycles accumulate.
- Exact per-unit transport/wage cost for the stop-loss formula must be read from
  each connection's own history (wages/loss per delivered MWh) at implementation.
