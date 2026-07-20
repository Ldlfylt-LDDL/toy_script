import { gameHeaders } from '../core/api.js';

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
      const hubs = distinctPickupHubs(data.moneyTransactions || []);
      const total = (data.moneyTransactions || []).reduce((s, t) => s + (t.money || 0), 0);
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
      return { writes, view: { hubs: hubs.length, total } };
    },
    render(view, el) {
      if (!el) return;
      el.textContent = view.hubs === 0
        ? 'Money: nothing to collect'
        // The game frontend doesn't know about background pickups; its map bubbles
        // and cash header refresh on the next page navigation / tick.
        : `Money: collected $${view.total.toLocaleString()} from ${view.hubs} hub(s) — game UI updates on next page switch`;
    },
  };
}
