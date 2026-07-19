export function makeTickCache() {
  let tick = null;
  let entries = new Map(); // key -> Promise
  function setTick(t) { if (t !== tick) { tick = t; entries = new Map(); } }
  function get(key, fetcher) {
    if (!entries.has(key)) entries.set(key, Promise.resolve().then(fetcher));
    return entries.get(key);
  }
  return { get, setTick };
}
