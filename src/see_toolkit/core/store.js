export function makeStore(backend = localStorage, prefix = 'see') {
  const k = (key) => `${prefix}:${key}`;
  function get(key, fallback = null) {
    try { const raw = backend.getItem(k(key)); return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  }
  function set(key, val) { backend.setItem(k(key), JSON.stringify(val)); }
  // Boolean flag read tolerant of both the store's JSON form ("1") and a raw
  // localStorage set (1 or "1") a user might do by hand.
  function flag(key) { const v = get(key, '0'); return v === '1' || v === 1 || v === true; }
  function appendCapped(key, item, cap) {
    const arr = get(key, []);
    arr.push(item);
    if (arr.length > cap) arr.splice(0, arr.length - cap);
    set(key, arr);
  }
  function sizeKB() {
    let total = 0;
    for (const key in backend) if (key.startsWith(prefix + ':')) total += (backend.getItem(key) || '').length;
    return +(total / 1024).toFixed(1);
  }
  return { get, set, flag, appendCapped, sizeKB };
}
