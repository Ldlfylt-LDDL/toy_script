# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A SimCompanies browser game analysis toolkit covering:
1. **VI (Vertical Integration) chain analysis** — iterative convergence to find optimal own/buy splits
2. **Single-building profit analysis** — per-product PPLH with VWAP from SimcoTools API
3. **Research product analysis** — profit vs research bonus, daily volume trends
4. **Interactive visualizers** — D3 graph of all chains, Chart.js research dashboard

## Directory Structure

```
scripts/          — JS analysis scripts (run from project root or scripts/)
data/             — cached API data (candlestick_data.json)
visualizers/      — HTML dashboards (open directly in browser)
Simcompanies-production-relationships/  — markdown analysis outputs + simco_tree.html
```

## Scripts

```bash
# Analyze a product's VI chain with iterative convergence (by resource ID)
node scripts/chain_util.js <resource_id>
# e.g. node scripts/chain_util.js 98   → Quadcopter
# e.g. node scripts/chain_util.js 55   → Economy Car

# Batch-analyze all L6+ products with iterative convergence
node scripts/batch_analyze.js          # human-readable report
node scripts/batch_analyze.js --json   # structured JSON

# Rank all ~138 products by depth × node count × utilization
node scripts/analyze.js

# Dump per-building profit for all products → market_data.md
node scripts/dump_market.js

# Check mines under construction (requires browser cookie as CLI arg)
node scripts/mine_check.js "<cookie_string>"
```

Open HTML files directly in browser — no build step needed:
- `Simcompanies-production-relationships/simco_tree.html` — D3 interactive chain graph
- `visualizers/research_profit.html` — Chart.js research profit & volume dashboard

## Architecture

### Shared Data Layer
Node/edge data is **duplicated** across `chain_util.js`, `analyze.js`, `batch_analyze.js`, and `simco_tree.html`. All use the same format:
- Nodes: `{id, n}` (resource ID + English name)
- Edges: `{s, t, a}` (source ID → target ID, amount per unit of target)
- Power (id:1) is the universal root of all chains

When adding a new product, update **all four files**.

### chain_util.js
Iterative convergence VI analysis for a single product:
1. Walks full dependency tree (BFS, excluding Power)
2. Fetches `producedAnHour` from SimcoTools API
3. Iterates: calculates utilization for active set, removes nodes with util < 0.2, repeats until stable
4. Outputs own/buy split and final utilization table

### batch_analyze.js
Runs iterative convergence for all 33 L6+ products in parallel batches.
- `TARGETS` array: `{id, cat, zh}` for each product
- Output: per-product `{own[], buy[], rounds, finalUtils[], minUtil}`

### analyze.js
Bulk scoring: `depth × intermediate_node_count × utilization_score` for all ~138 products.

### dump_market.js
Fetches VWAP + producedAnHour from SimcoTools for all products, computes per-building profit (market sell and direct sell), outputs to `market_data.md`.

### simco_tree.html
Self-contained D3 v7 interactive graph:
- `getData()` — inline node/edge arrays
- `CHAINS` object — own/buy Sets per named chain + highlight color
- `assignLayers()` — longest-path column layout
- Floating `#chainpanel` with category groups (食品类, 电子&机器人, 车辆&建筑) toggles chain highlights

To add a chain: (1) add `.cp-item` in the panel HTML, (2) add entry to `CHAINS` with `own` and `buy` Sets.

### research_profit.html
Chart.js dashboard with two tabs:
- **Tab 1**: PPLH vs research bonus (0–200%, step 5%) — draggable/zoomable line chart
- **Tab 2**: 89-day daily trading volume with 7-day MA — candlestick data from SimcoTools

VWAP and rate data are **hardcoded** (fetched via Node.js at build time to avoid browser CORS issues). Update by re-running the fetch commands in comments at top of script block.

## APIs

### SimcoTools API
Base URL: `https://api.simcotools.com` · Realm: always `0`

| Endpoint | Returns |
|----------|---------|
| `GET /v1/realms/0/resources/{id}` | `producedAnHour`, `wages`, `inputs`, `isResearch` |
| `GET /v1/realms/0/market/vwaps/{id}/0` | Current VWAP (quality 0) |
| `GET /v1/realms/0/market/vwaps` | All VWAPs (today only) |
| `GET /v1/realms/0/market/resources/{id}/0/candlesticks` | 89-day OHLCV + vwap history |
| `GET /v1/realms/0/market/resources/{id}/0` | Current price, volume, 5-min candlestick |

### SimCompanies Encyclopedia API
`https://www.simcompanies.com/api/v4/en/0/encyclopedia/resources/0/{id}/`
Returns: `producedAnHour`, `baseSalary`, `producedFrom[]`, `research`, `improvesQualityOf[]`

### SimCompanies Market API (v3)
`https://www.simcompanies.com/api/v3/market/0/{id}/`
Returns: current sell orders with `quantity`, `price`, `quality`, `posted` — rate-limited to ~1 req/min

## Key Analysis Concepts

**Iterative Convergence (VI)**: Single-pass utilization is wrong. Must iterate: calculate utils for active self-produce set → remove nodes with util < 0.2 → recalculate → repeat until stable. Cascade effects matter (e.g. Plastic external → Crude Oil loses all consumers → also external).

**Utilization** = `total downstream consumption / producedAnHour`. < 0.2 → buy from market; > 1 → bottleneck.

**PPLH formula**: `rate × (1 + research_bonus) × VWAP × 0.96 − wages`
- 0.96 = 1 − 4% seller fee
- wages are fixed (do not scale with research bonus)
- Research buildings have no material inputs → bonus purely dilutes fixed wage cost

**VI scoring**: `depth × (own_nodes / total_nodes)` — higher = more vertically integrated value

**Direct sell vs market**: Direct sell = −3% (vs −4% fee) + transport halved. High-transport products benefit more from direct sell.

**Price validity check**: Always verify if a price spike is driven by government/special orders before using it in projections. Check `/v1/realms/0/government-orders` or compare vs 90-day VWAP history.

## Analysis Outputs

| File | Contents |
|------|----------|
| `Simcompanies-production-relationships/product_analysis.md` | Index + cross-product comparison table + game ranking appendix |
| `Simcompanies-production-relationships/analysis_food.md` | Bread, Hamburger, Meat Balls, Apple Pie, Frozen Pizza |
| `Simcompanies-production-relationships/analysis_electronics.md` | Quadcopter, Robots, Satellite |
| `Simcompanies-production-relationships/analysis_vehicles.md` | Economy Car, Diesel, Construction Units |
| `Simcompanies-production-relationships/analysis_aerospace.md` | Stub (future products) |
| `Simcompanies-production-relationships/analysis_luxury.md` | Stub (future products) |
| `Simcompanies-production-relationships/market_data.md` | Per-building profit table (all products, last run 2026-03-18) |
| `Simcompanies-production-relationships/strategy.md` | VI theory, scoring framework, API reference |
| `data/candlestick_data.json` | 89-day OHLCV for all 12 research products (fetched 2026-03-25) |
