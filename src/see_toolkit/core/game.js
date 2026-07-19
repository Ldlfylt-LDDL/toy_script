export function makeGame({ fetchJSON, cache }) {
  let cachedPlayerId = null;
  async function getPlayerId() {
    if (cachedPlayerId != null) return cachedPlayerId;
    const me = await fetchJSON('/api/v1/players/me/');
    if (me?.id == null) throw new Error('players/me returned no id');
    cachedPlayerId = me.id;
    return cachedPlayerId;
  }
  async function getTick() {
    const data = await fetchJSON('/api/v1/app-data/');
    const last = data?.era?.lastComputedTick;
    if (last == null) throw new Error('no lastComputedTick');
    cache.setTick(last);
    return last;
  }
  async function loadState() {
    const lastComputedTick = await getTick();
    const playerId = await getPlayerId();
    const buildings = await cache.get('buildings', async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/buildings/`)).buildings || []);
    const connections = await cache.get('connections', async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/connections/`)).connections || []);
    return { lastComputedTick, k: lastComputedTick + 1, playerId, buildings, connections };
  }
  return { getPlayerId, getTick, loadState };
}
