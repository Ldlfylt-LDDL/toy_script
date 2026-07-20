import { phase } from '../../core/time.js';
import { gameHeaders } from '../../core/api.js';
import { median } from '../../core/stats.js';
import { miniTable } from '../../core/ui.js';
import { normalizeActivities, connectionActivityPayload } from '../activities.js';
import { recordPrice, spreadSamples, hubPriceSamples } from './priceStore.js';
import { forecast } from './forecast.js';
import { decideDirection, bumpStreak, shouldFlip } from './direction.js';
import { purchaseCap } from './stopLoss.js';
import { scoreConnection } from './evaluate.js';

const AUTO_KEY = 'connAuto';   // '1' to enable live direction/stop-loss writes
const FLIP_THRESHOLD = 30;     // $ edge over current before flipping
const HYSTERESIS = 2;          // consecutive evals pointing the same way
const COST_FALLBACK = 5;       // per-MWh transport/wage estimate
const CAP_BUFFER = 15;         // safety margin under forecast dest price

// Pure-ish evaluation for one connection given accumulated prices and current state.
export function evaluateConnection({ prices, edge, capacity, k, phaseOf = phase }) {
  const fwdSamples = spreadSamples(prices, edge.hub1Id, edge.hub2Id, phaseOf(k), phaseOf);
  const revSamples = spreadSamples(prices, edge.hub2Id, edge.hub1Id, phaseOf(k), phaseOf);
  const forward = forecast(fwdSamples);
  const reverse = forecast(revSamples);
  const current = capacity >= 0 ? 'forward' : 'reverse';
  const desired = decideDirection({ current, forward, reverse, threshold: FLIP_THRESHOLD });
  // gradient amplitude: how far the best-direction median sits above zero
  const gradientAmplitude = Math.max(0, forward.median ?? 0, reverse.median ?? 0);
  return { forward, reverse, current, desired, gradientAmplitude };
}

export function connectionsModule({ fetchJSON, fetchImpl = fetch, store, cache }) {
  async function connDetail(edgeId, connId) {
    return cache.get(`conn:${edgeId}:${connId}`, () =>
      fetchJSON(`/api/v1/edges/${edgeId}/connections/${connId}/`));
  }
  async function hubHistory(hubId) {
    return cache.get(`hubhist:${hubId}`, async () =>
      (await fetchJSON(`/api/v1/hubs/${hubId}/history/`)).hubHistory || []);
  }

  return {
    id: 'connections', title: 'Connection Manager',
    async plan(state) {
      const auto = store.get(AUTO_KEY, '0') === '1';
      const power = (state.connections || []).filter((c) => c.kind === 'Power');
      const prices = store.get('prices', {});
      const streaks = store.get('connStreak', {});
      const writes = [];
      const rows = [];
      let flagged = 0, flips = 0;

      // Read phase in parallel — the per-tick cache dedupes overlapping hub fetches.
      // (Only writes must be serialized; reads mirror what the game client does itself.)
      const fetched = await Promise.all(power.map(async (c) => {
        const edgeId = c.edge?.id ?? c.edgeId;
        try {
          const detail = await connDetail(edgeId, c.id);
          const edge = {
            hub1Id: detail.edge?.hub1Id ?? detail.edge?.hub1?.id, hub2Id: detail.edge?.hub2Id ?? detail.edge?.hub2?.id,
            hub1Name: detail.edge?.hub1?.name, hub2Name: detail.edge?.hub2?.name,
          };
          const histories = await Promise.all([hubHistory(edge.hub1Id), hubHistory(edge.hub2Id)]);
          return { c, edgeId, detail, edge, histories };
        } catch (e) {
          console.warn(`[connections] #${c.id} read failed:`, e.message);
          return null;
        }
      }));

      for (const item of fetched) {
        if (!item) continue;
        const { c, edgeId, detail, edge, histories } = item;
        try {
          for (let i = 0; i < 2; i++) {
            const hid = i === 0 ? edge.hub1Id : edge.hub2Id;
            for (const h of histories[i]) if (h.powerPrice != null) recordPrice(prices, hid, h.timeTick, h.powerPrice);
          }
          const acts = normalizeActivities(detail.connectionActivitySet || [], state.k);
          const act = acts.find((a) => a.timeTick === state.k);
          if (!act) continue;
          const ev = evaluateConnection({ prices, edge, capacity: act.capacity, k: state.k });

          const score = scoreConnection({ gradientAmplitude: ev.gradientAmplitude });
          if (score.decommission) flagged++;

          // hysteresis on the desired direction
          const st = bumpStreak(streaks[c.id], ev.desired, ev.current);
          streaks[c.id] = st;
          const willFlip = ev.desired !== ev.current && shouldFlip(st.streak, HYSTERESIS);
          if (willFlip) flips++;

          const src = ev.current === 'forward' ? (edge.hub1Name || edge.hub1Id) : (edge.hub2Name || edge.hub2Id);
          const dst = ev.current === 'forward' ? (edge.hub2Name || edge.hub2Id) : (edge.hub1Name || edge.hub1Id);
          rows.push({
            id: c.id,
            route: `${String(src).slice(0, 8)}→${String(dst).slice(0, 8)}`,
            n: Math.min(ev.forward.n || 0, ev.reverse.n || 0),
            edge: ev.forward.median == null ? null : Math.round(Math.max(ev.forward.median ?? -Infinity, ev.reverse.median ?? -Infinity)),
            willFlip, decommission: score.decommission,
          });

          if (auto) {
            const newSign = ev.desired === 'forward' ? 1 : -1;
            const capacity = Math.abs(act.capacity) * newSign;
            const dstHub = newSign >= 0 ? edge.hub2Id : edge.hub1Id;
            const dstForecast = median(hubPriceSamples(prices, dstHub, phase(state.k + 1), phase));
            const cap = purchaseCap({ forecastDstNext: dstForecast, perUnitCost: COST_FALLBACK, buffer: CAP_BUFFER });
            const needFlip = willFlip;
            const needCap = cap != null && cap !== act.purchasePrice;
            if (needFlip || needCap) {
              const payload = connectionActivityPayload(act, {
                capacity: needFlip ? capacity : act.capacity,
                purchasePrice: needCap ? cap : act.purchasePrice,
              });
              writes.push({
                label: `conn#${c.id} ${needFlip ? 'flip→' + ev.desired + ' ' : ''}${needCap ? 'cap=' + cap : ''}`.trim(),
                send: async () => {
                  const url = `/api/v1/edges/${edgeId}/connections/${c.id}/activities/`;
                  const resp = await fetchImpl(url, {
                    method: 'PUT', credentials: 'same-origin',
                    headers: gameHeaders(url, { extra: { 'Content-Type': 'application/json' } }),
                    body: JSON.stringify(payload),
                  });
                  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
                },
              });
            }
          }
        } catch (e) {
          console.warn(`[connections] #${c.id} skipped:`, e.message);
        }
      }

      store.set('prices', prices);
      store.set('connStreak', streaks);
      const coldStart = rows.length && rows.every((r) => r.n < 6);
      return { writes, view: { total: power.length, flagged, flips, auto, coldStart, rows } };
    },
    render(view, sec) {
      if (!sec) return;
      sec.setDot(view.flagged > 0 ? 'warn' : 'ok');
      sec.setSummary(`${view.total} · ${view.flagged} flag · ${view.auto ? view.flips + ' flip' : 'auto off'}`);
      const kids = [];
      const badgeLine = document.createElement('div');
      badgeLine.style.cssText = 'margin-bottom:3px;color:#7f8794;font-size:10px';
      badgeLine.textContent = (view.auto ? 'Auto writes ON' : 'Auto writes OFF (evaluation only — set see:connAuto=1)') +
        (view.coldStart ? ' · cold start: still gathering price history' : '');
      kids.push(badgeLine);
      if (view.rows.length) {
        kids.push(miniTable(['Conn', 'Route', 'Edge$', 'n', ''],
          view.rows.map((r) => [
            '#' + r.id,
            r.route,
            { text: r.edge == null ? '—' : '$' + r.edge, color: r.edge > 0 ? '#4caf50' : '#ff5252' },
            { text: r.n, color: r.n < 6 ? '#888' : '#d6d6d6' },
            { text: (r.willFlip ? '⇄' : '') + (r.decommission ? '✂' : ''), color: '#ff9800' },
          ])));
      }
      sec.body.replaceChildren(...kids);
    },
  };
}
