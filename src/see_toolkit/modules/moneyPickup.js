import { gameHeaders } from '../core/api.js';
import { miniTable } from '../core/ui.js';

// Pure: distinct hub ids that have collectable money (collection is per-hub).
export function distinctPickupHubs(transactions) {
  const set = new Set();
  for (const t of transactions || []) if (t.hubId != null && t.pickedUp !== true) set.add(t.hubId);
  return [...set];
}

export function moneyPickupModule({ fetchJSON, fetchImpl = fetch }) {
  return {
    id: 'money', title: 'Auto Money Pickup',
    async plan(state) {
      const data = await fetchJSON(`/api/v1/players/${state.playerId}/money-transactions/for-pick-up/`);
      const txs = data.moneyTransactions || [];
      const hubs = distinctPickupHubs(txs);
      const total = txs.reduce((s, t) => s + (t.money || 0), 0);
      const byHub = {};
      for (const t of txs) if (t.pickedUp !== true) byHub[t.hubId] = (byHub[t.hubId] || 0) + (t.money || 0);
      const items = Object.entries(byHub).map(([hubId, amount]) => ({ hubId: +hubId, amount })).sort((a, b) => b.amount - a.amount);
      const writes = hubs.map((hubId) => ({
        label: `pickup hub ${hubId}`,
        send: async () => {
          const url = `/api/v1/players/${state.playerId}/money-transactions/`;
          const resp = await fetchImpl(url, {
            method: 'PATCH', credentials: 'same-origin',
            headers: gameHeaders(url, { extra: { 'Content-Type': 'application/json' } }),
            body: JSON.stringify({ pickUpHubId: hubId }),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
        },
      }));
      return { writes, view: { hubs: hubs.length, total, items } };
    },
    render(view, sec) {
      if (!sec) return;
      sec.setDot(view.hubs > 0 ? 'busy' : 'ok');
      sec.setSummary(view.hubs === 0 ? 'nothing pending' : `$${view.total.toLocaleString()} · ${view.hubs} hub(s)`);
      const kids = [];
      if (view.items.length) {
        kids.push(miniTable(['Hub', 'Amount'], view.items.map((i) => [i.hubId, { text: '$' + i.amount.toLocaleString(), color: '#4caf50' }])));
      }
      // The game frontend doesn't know about background pickups; its map bubbles and
      // cash header refresh on the next page navigation / tick.
      kids.push(document.createElement('div'));
      kids[kids.length - 1].style.cssText = 'margin-top:4px;color:#7f8794;font-size:10px';
      kids[kids.length - 1].textContent = 'Note: game map/cash refresh on next page switch.';
      sec.body.replaceChildren(...kids);
    },
  };
}
