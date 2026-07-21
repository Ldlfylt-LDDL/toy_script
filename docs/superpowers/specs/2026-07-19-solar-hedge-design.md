# Solar Revenue Hedge — Design

Date: 2026-07-19
Target: new module in `src/see_toolkit/modules/hedge/` on the existing core.
Player: id 2689, Cimmeria, marketLicense "PowerCFD" (certification held).

## 1. Overview

Solar plants get killed by the midday price crash: at the solar peak the spot
price collapses (observed to ~$30) because every solar operator offers cheap.
The Power CFD market lets us **sell expected output forward at a good price and
lock in revenue**, immune to the crash. This is hedging (insurance), not
speculation. A power short position always auto-closes at the tick's spot price,
so: if solar runs, the physical sale + short settlement net to the locked price;
if solar doesn't run (spot crashed), the short still profits. Either way, revenue
is fixed at the price we hedged at.

Chosen posture (user): **semi-automatic** (the module prepares suggested sell
orders; the user confirms the final placement) and **conservative ~50%** of
expected output. Pure speculation is a later, separate feature.

## 2. Verified market mechanics (SEG wiki + live UI)

- **Merit-order spot**: cheapest offers dispatched first; spot = the offer price
  of the most-expensive dispatched plant; everyone dispatched is paid spot. Unmet
  demand → spot = $300.
- **Power CFD**: per-tick order book (`Max Buy` = best bid, `Min Offer` = best ask).
  Selling forward = a short; it AUTO-CLOSES at that tick's spot at tick time.
- **Collateral**: a short locks Market Reserve ≈ $300 × quantity (worst-case
  buyback at the $300 ceiling). Reserve is finite (~$81,825 now → ~270 MWh of
  shorts max). Managed at `/market-credit/`.
- **Fee**: 5% of notional on execution.
- **Order types**: market order (trade at market) vs limit order (rests on book).
- Endpoints: book `GET /api/v1/hubs/{hubId}/orders/power/{tick}`; positions
  `GET /api/v1/players/{id}/positions/`; SELL placement + cancel — **payload to be
  reverse-engineered** (see §6).

## 3. Per-city markets (critical)

**Each city (hub) has its OWN Power CFD market with its own order book and
prices.** Hedging is therefore per-city: each solar plant is hedged in the market
of the city it sits in, using that city's book and that city's expected solar
output. The module groups the player's solar plants by `hubId` and runs the logic
per hub. The **Market Reserve is player-global** (one pool at `/market-credit/`),
so the reserve cap (§3.4) applies across ALL cities' hedges combined.

Solar hubs (current): Abyss 8166, Modoc 8080, Gladefort 8186, Narniaborough 7936,
Echo Borough 8153, Jirstcrest 8224, Breeze City 8055.

## 3. Module logic (per run, on tick advance)

For **each solar city (hub `h`)** independently:
1. **Expected sellable solar output per upcoming tick** `E[h,t]`: for each editable
   tick `t` (T..T+11), estimate that city's solar deliverable MWh. Estimate
   empirically = recent average *delivered* solar output at that tick's phase
   (`t%6`) from that hub's solar building history — folds in daylight, weather, and
   capacity, ~0 at night. Reuse the per-phase-from-observation pattern.
2. **Read that city's CFD buy book** `GET /hubs/{h}/orders/power/{t}`; `bid[h,t]` = best Max Buy.
3. **Candidate hedge** for `(h,t)` when `E[h,t] > 0` (daytime) and `bid[h,t] ≥ floor`:
   - `q[h,t] = round(HEDGE_FRACTION × E[h,t] − alreadyHedged[h,t])`,
     default 0.5, never exceeding `E[h,t]` (no naked short).
   - `alreadyHedged[h,t]` from `/positions/` filtered to hub `h` + tick `t` (idempotent).
4. **Global reserve cap**: sum of `$300 × q[h,t]` across ALL candidate hubs/ticks must
   stay under `RESERVE_CAP_FRACTION` (default 0.6) of available Market Reserve; trim
   the lowest-price candidates first if over.
5. **Output**: suggested sell orders `{hubId, cityName, tick, qty, price=bid[h,t], reserveLocked, fee}`.
   In **semi-auto**, render grouped by city with per-order and "confirm all" controls;
   only a user click places an order.

## 4. Pure decision layer (unit-tested)

- `expectedOutputByPhase(historyByPhase)` → `E[t]` estimate.
- `hedgeQuantity({expected, fraction, alreadyHedged})` → non-negative qty, capped at expected.
- `passesFloor(bid, floor)`.
- `applyReserveCap(candidates, availableReserve, capFraction)` → trimmed list.
- `fee(qty, price)` = 0.05 × qty × price.
These are pure and injectable; the order placement + `/positions/` reads are thin adapters.

## 5. Risk controls (real money)
- Never short more than expected output (hedge, not speculation).
- Reserve cap (default 60% of available) — never lock the whole reserve.
- Price floor (default: only hedge if `bid ≥ $150`, i.e. above the midday crash;
  configurable) — never lock in a bad price.
- Daytime ticks with real expected output only.
- Semi-auto: nothing is placed without an explicit user confirmation click.
- Default fully OFF; a dry-run/preview shows suggestions without any order UI arming.
- Idempotent against existing positions.
- Config constants at module top: `HEDGE_FRACTION=0.5`, `RESERVE_CAP_FRACTION=0.6`,
  `PRICE_FLOOR=150`.

## 6. Order endpoint (reverse-engineered 2026-07-19; corrected 2026-07-21)
- **Place order**: `POST /api/v1/hubs/{hubId}/orders/power/{tick}` (NO trailing
  slash) with body `{"quantity":N, "price":P, "side":"Sell"}` (side
  "Buy"|"Sell"), signed with `gameHeaders`. To hedge, `side:"Sell"` at
  `price = best bid` (rounded to a multiple of 5). URL confirmed against the
  client route builder `api_orders:(hubId,kind,tick)=>`.../hubs/${hubId}/orders/${kind}/${tick}``.
- **Trailing-slash gotcha**: a trailing slash on the POST makes the server
  reject with 400 `{"message":"Incorrect resource kind supplied"}`. The original
  "verified" note was incomplete — the $999 price probe was rejected on price
  before the path/kind check, masking this. Fixed via a shared `orderUrl()`
  helper (see `endpoints.js`, unit-tested).
- **Validation**: **price must be a multiple of 5** (server rejects otherwise —
  learned via a $999 test that was cleanly rejected, placing nothing). The
  placement adapter must round to a multiple of 5.
- **Fee**: 5% of notional. **Collateral**: locks ≈ $300 × quantity of Market Reserve.
- Reads: order book `GET /api/v1/hubs/{hubId}/orders/power/{tick}` (Buy-side =
  bids), positions `GET /api/v1/players/{id}/positions/` (filter kind=Power, hubId,
  timeTick). Cancel/withdraw endpoint not needed for v1 (place-on-confirm only;
  power positions auto-settle at spot).

## 7. Panel / UX (more detailed than existing modules)
New "Solar Hedge" section, richer than the other modules:
- **Header summary**: e.g. "3 cities · suggest short 60 MWh · lock $18k / $49k free".
- **Reserve meter**: a small bar showing Market Reserve used vs available, so the
  collateral impact is visible at a glance.
- **Grouped by city**: each solar city is a sub-group with its name and current
  best bid, then a per-tick table: `Tick · Expected MWh · Suggest qty · Price ·
  Reserve · Fee · [Confirm]`.
- **Per-order Confirm button** + a **Confirm all** button per city and globally.
  Confirmed orders show a ✓ and the resulting locked-in price.
- Colour cues: bid ≥ floor green, below floor greyed (not hedgeable); already-hedged
  ticks shown as covered.
- Respects dry-run (shows suggestions but disarms the Confirm buttons).

## 8. Non-goals
- Pure directional speculation (separate later feature).
- Fully automatic execution (semi-auto only for now).
- Hedging non-solar generation (start with solar; generalizable later).
- Auto-closing/rolling positions before maturity (positions auto-settle at spot).

## 9. Open questions / risks
- Forecast error: conservative fraction + floor + reserve cap bound the downside;
  worst case a hedged tick where solar over-produces leaves some output unhedged
  (fine) or spot ends high and the short settles at a slight loss vs spot (bounded).
- Reserve contention with connection shorts / other locks — read available reserve
  live each run.
