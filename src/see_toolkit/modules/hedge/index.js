import { phase, MAX_FUTURE_TICKS } from '../../core/time.js';
import { gameHeaders } from '../../core/api.js';
import { h } from '../../core/ui.js';
import { expectedByPhase, expectedAt, productionExpected, solarEfficiency, roundToStep, hedgeQuantity, passesFloor, fee } from './sizing.js';
import { applyReserveCap } from './reserve.js';
import { normalizeActivities, stateAt } from '../activities.js';

const ARM_KEY = 'hedgeArmed';      // '1' shows live Confirm buttons (semi-auto)
const HEDGE_FRACTION = 0.5;        // conservative: hedge half of expected output
const RESERVE_BUDGET = 30000;      // max $ of Market Reserve to lock across all hedges
const PRICE_FLOOR = 150;           // don't hedge below this bid (avoid locking a bad price)

export function hedgeModule({ fetchJSON, fetchImpl = fetch, cache, store }) {
  // Returns { byPhase, scheduledAt } for a solar plant: byPhase = avg delivered
  // output per phase (from past Production ticks); scheduledAt(tick) = the plant's
  // scheduled state at a future tick (so we can exclude ticks it will be upgrading).
  async function solarData(playerId, buildingId, k) {
    return cache.get(`sdata:${buildingId}`, async () => {
      const acts = (await fetchJSON(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || [];
      const history = acts
        .filter((a) => a.state === 'Production' && a.productionOutput != null)
        .map((a) => ({ timeTick: a.timeTick, delivered: a.productionOutput }));
      const caps = acts.filter((a) => a.productionCapacity != null).map((a) => a.productionCapacity);
      const capacity = caps.length ? Math.max(...caps) : 0; // current (highest) rated capacity
      const norm = normalizeActivities(acts, k);
      return { byPhase: expectedByPhase(history), scheduledAt: (t) => stateAt(norm, t), capacity };
    });
  }
  // Weather forecast for a country: tick -> { clouds, daylight }. The weather
  // timeTick equals the game tick; request N=k+11 to cover the forward window.
  async function forecast(countryId, k) {
    return cache.get(`wx:${countryId}`, async () => {
      const w = await fetchJSON(`/api/v1/weather/countries/${countryId}/ticks/${k + 11}/`);
      const map = {};
      for (const r of (w.weatherRecords || [])) map[r.timeTick] = { clouds: r.clouds, daylight: r.daylight };
      return map;
    });
  }
  async function hubCountry(hubId) {
    return cache.get(`hubcountry:${hubId}`, async () =>
      (await fetchJSON(`/api/v1/hubs/${hubId}/`)).countryId);
  }
  async function bestBid(hubId, tick) {
    return cache.get(`pbid:${hubId}:${tick}`, async () => {
      const j = await fetchJSON(`/api/v1/hubs/${hubId}/orders/power/${tick}`);
      const bids = (j.orders || []).filter((o) => o.side === 'Buy').map((o) => o.price);
      return bids.length ? Math.max(...bids) : null;
    });
  }
  async function myPowerPositions(playerId) {
    return cache.get('positions', async () =>
      ((await fetchJSON(`/api/v1/players/${playerId}/positions/`)).positions || [])
        .filter((p) => p.kind === 'Power'));
  }

  async function placeSell(playerId, hubId, tick, quantity, price) {
    const url = `/api/v1/hubs/${hubId}/orders/power/${tick}/`;
    const resp = await fetchImpl(url, {
      method: 'POST', credentials: 'same-origin',
      headers: gameHeaders(url, { extra: { 'Content-Type': 'application/json' } }),
      body: JSON.stringify({ quantity, price: roundToStep(price), side: 'Sell' }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
  }

  return {
    id: 'hedge', title: 'Solar Hedge',
    async plan(state) {
      const armed = store.get(ARM_KEY, '0') === '1';
      const solar = (state.buildings || []).filter((b) => b.kind === 'SolarPowerPlant');
      // group by city
      const byHub = {};
      for (const b of solar) (byHub[b.hubId] = byHub[b.hubId] || []).push(b);

      const positions = await myPowerPositions(state.playerId);
      const hedgedAt = (hubId, tick) => positions
        .filter((p) => p.hubId === hubId && p.timeTick === tick && p.position < 0)
        .reduce((s, p) => s + Math.abs(p.position), 0);

      const cities = [];
      const allCandidates = [];
      const formulaCheck = []; // our computed efficiency for a couple of ticks, to compare vs the game's Weather page
      for (const hubId of Object.keys(byHub).map(Number)) {
        const plants = byHub[hubId];
        // per-plant data + the city's weather forecast (this hub's country).
        const perPlant = await Promise.all(plants.map((b) => solarData(state.playerId, b.id, state.k)));
        const wx = await forecast(await hubCountry(hubId), state.k);
        if (!formulaCheck.length) {
          for (let t = state.k; t < state.k + 12 && formulaCheck.length < 2; t++) {
            const w = wx[t];
            if (w && w.daylight) formulaCheck.push({ tick: t, clouds: w.clouds, eff: solarEfficiency(w.clouds, w.daylight) });
          }
        }
        // Expected output at a tick = capacity × solar efficiency (from forecast
        // clouds/daylight), zeroed for plants scheduled to upgrade/maintain then.
        // Falls back to the historical per-phase estimate if no forecast for the tick.
        const cityExpectedAt = (tick) => perPlant.reduce((s, p) => {
          const sc = p.scheduledAt(tick);
          if (sc && sc !== 'Production') return s;
          const w = wx[tick];
          if (w) return s + p.capacity * (solarEfficiency(w.clouds, w.daylight) / 100);
          return s + productionExpected(p.byPhase, sc, tick);
        }, 0);

        const rows = [];
        for (let t = state.k; t < state.k + MAX_FUTURE_TICKS; t++) {
          const expected = Math.round(cityExpectedAt(t));
          if (expected <= 0) continue; // night / no output
          const bid = await bestBid(hubId, t);
          const already = hedgedAt(hubId, t);
          const qty = hedgeQuantity({ expected, fraction: HEDGE_FRACTION, alreadyHedged: already });
          const ok = passesFloor(bid, PRICE_FLOOR) && qty > 0;
          const row = { hubId, tick: t, expected, bid, already, qty, hedgeable: ok };
          rows.push(row);
          if (ok) allCandidates.push({ ...row, price: roundToStep(bid) });
        }
        if (rows.length) cities.push({ hubId, name: plants[0].name?.replace('Solar Plant in ', '') || String(hubId), rows });
      }

      const { kept } = applyReserveCap(allCandidates, RESERVE_BUDGET, 1);
      const keptSet = new Set(kept.map((c) => `${c.hubId}:${c.tick}`));
      const suggestions = kept.map((c) => ({ ...c, fee: fee(c.qty, c.price) }));
      const totalQty = suggestions.reduce((s, c) => s + c.qty, 0);
      const totalLock = suggestions.reduce((s, c) => s + (c.reserveLock || 0), 0);

      // mark which city rows are in the final suggestion set
      for (const city of cities) for (const r of city.rows) r.suggested = keptSet.has(`${r.hubId}:${r.tick}`);

      return {
        writes: [], // semi-auto: nothing auto-executes
        view: { armed, playerId: state.playerId, cities, suggestions, totalQty, totalLock, budget: RESERVE_BUDGET, floor: PRICE_FLOOR, formulaCheck },
      };
    },

    render(view, sec) {
      if (!sec) return;
      sec.setDot(view.suggestions.length ? 'busy' : 'ok');
      sec.setSummary(`${view.suggestions.length} order(s) · ${view.totalQty} MWh · lock $${view.totalLock.toLocaleString()}`);

      const kids = [];
      const note = (t, extra = '') => h('div', { style: `margin-bottom:3px;color:#7f8794;font-size:10px;${extra}` }, t);
      kids.push(note(view.armed ? '● ARMED — Confirm places a real sell order' : '○ Read-only — click "Arm hedge" below to enable Confirm'));
      // reserve meter
      const pct = Math.min(100, Math.round((view.totalLock / view.budget) * 100));
      kids.push(h('div', { style: 'margin:2px 0 5px' },
        h('div', { style: 'font-size:10px;color:#7f8794;margin-bottom:2px' }, `Reserve to lock: $${view.totalLock.toLocaleString()} / $${view.budget.toLocaleString()} budget`),
        h('div', { style: 'height:5px;background:#232833;border-radius:3px;overflow:hidden' },
          h('div', { style: `height:100%;width:${pct}%;background:${pct > 90 ? '#ff5252' : '#4caf50'}` }))));
      kids.push(note(`Hedge ${Math.round(HEDGE_FRACTION * 100)}% of expected solar output · only bids ≥ $${view.floor}`));
      // Formula self-check: our computed solar efficiency for a couple of ticks, so
      // you can compare against the game's Weather page and catch a formula change.
      if (view.formulaCheck && view.formulaCheck.length) {
        kids.push(note('⌖ solar-eff check (vs game Weather page): ' +
          view.formulaCheck.map((f) => `T${f.tick} clouds ${f.clouds} → ${f.eff}%`).join('  ·  '), 'color:#6ab0ff'));
      }

      for (const city of view.cities) {
        kids.push(h('div', { style: 'margin-top:6px;color:#cfd3da;font-size:11px' }, `${city.name}`));
        const table = h('table', { style: 'border-collapse:collapse;width:100%;font:11px monospace;margin-top:2px' },
          h('thead', {}, h('tr', {}, ...['Tick', 'Exp', 'Bid', 'Hedge', ''].map((x) =>
            h('th', { style: 'text-align:left;padding:1px 8px 2px 0;color:#888;font-weight:normal;border-bottom:1px solid #333' }, x)))),
          h('tbody', {}, ...city.rows.map((r) => {
            const cells = [
              h('td', { style: 'padding:1px 8px 1px 0' }, 'T' + r.tick),
              h('td', { style: 'padding:1px 8px 1px 0' }, r.expected),
              h('td', { style: `padding:1px 8px 1px 0;color:${r.hedgeable ? '#4caf50' : '#888'}` }, r.bid == null ? '—' : '$' + r.bid),
              h('td', { style: 'padding:1px 8px 1px 0' }, r.suggested ? r.qty + ' MWh' : (r.hedgeable ? '—' : 'skip')),
              h('td', { style: 'padding:1px 8px 1px 0' }, r.suggested ? confirmCell(view, r) : ''),
            ];
            return h('tr', {}, ...cells);
          })));
        kids.push(table);
      }

      // arm toggle
      const armBtn = h('button', {
        style: 'margin-top:6px;font:11px monospace;background:#232833;color:' + (view.armed ? '#4caf50' : '#9aa0ac') + ';border:1px solid #3a3f4b;border-radius:4px;padding:3px 8px;cursor:pointer',
        onclick: () => { store.set(ARM_KEY, view.armed ? '0' : '1'); armBtn.textContent = 'Arm hedge: ' + (store.get(ARM_KEY, '0') === '1' ? 'ON' : 'OFF'); },
      }, 'Arm hedge: ' + (view.armed ? 'ON' : 'OFF'));
      kids.push(armBtn);

      sec.body.replaceChildren(...kids);
    },
  };

  // Confirm cell factory (closes over placeSell)
  function confirmCell(view, r) {
    const btn = h('button', {
      style: 'font:10px monospace;background:#2a1f2a;color:#ff5252;border:1px solid #ff5252;border-radius:3px;padding:1px 6px;cursor:pointer' + (view.armed ? '' : ';opacity:.4;pointer-events:none'),
      title: `Sell ${r.qty} MWh @ $${roundToStep(r.bid)} (locks $${(r.reserveLock || 0).toLocaleString()}, fee $${fee(r.qty, roundToStep(r.bid))})`,
    }, 'Confirm');
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = '…';
      try { await placeSell(view.playerId, r.hubId, r.tick, r.qty, r.bid); btn.textContent = '✓ sold'; btn.style.color = '#4caf50'; btn.style.borderColor = '#4caf50'; }
      catch (e) { btn.textContent = 'err'; btn.title = e.message; btn.disabled = false; }
    });
    return btn;
  }
}
