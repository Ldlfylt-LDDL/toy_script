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

## 3. Module logic (per run, on tick advance)

1. **Expected sellable solar output per upcoming tick** `E[t]`: for each editable
   tick `t` (T..T+11), estimate the solar fleet's deliverable MWh. Estimate
   empirically = recent average *delivered* solar output at that tick's phase
   (`t%6`) from building history — this naturally folds in daylight, weather, and
   capacity, and is ~0 at night. Reuse the per-phase-from-observation pattern used
   by the connection forecaster.
2. **Read the CFD buy book** for those ticks; `bid[t]` = best Max Buy.
3. **Candidate hedge** for tick `t` when `E[t] > 0` (daytime) and `bid[t] ≥ floor`:
   - quantity `q[t] = round(HEDGE_FRACTION × E[t] − alreadyHedged[t])`,
     `HEDGE_FRACTION` default 0.5, never exceeding `E[t]` (no naked short).
   - `alreadyHedged[t]` from `/positions/` (idempotent — don't double-hedge).
4. **Reserve cap**: sum of `$300 × q[t]` across candidates must stay under
   `RESERVE_CAP_FRACTION` (default 0.6) of available Market Reserve; trim lowest-
   value candidates first if over.
5. **Output**: a list of suggested sell orders `{tick, qty, price=bid[t], reserveLocked, fee}`.
   In **semi-auto**, render them in the panel with a per-order and a
   "confirm all" control; only on the user's click does the module place the order.

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

## 6. Reverse-engineering the order endpoints (first implementation task)
Capture the SELL-order POST and the cancel/close request **safely**, with the
user present and approving: place a **limit sell above the market** (e.g. price
$999 when best bid is $225) so it CANNOT match any buyer and rests unfilled →
captures the POST payload with no trade executed; then cancel it → captures the
cancel payload. No position is taken and no money changes hands. Record the exact
endpoint + payload shape; only then wire the placement adapter.

## 7. Panel / UX
New "Solar Hedge" section: summary (e.g. "3 ticks · suggest short 60 MWh · lock
$18k") and an expandable table (Tick, Expected, Suggest qty, Price, Reserve, Fee)
with confirm controls. Uses the existing section-handle + miniTable UI.

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
