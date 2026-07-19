const WEATHER_RE = /\/api\/v1\/weather\/countries\/(\d+)\/ticks\/(\d+)\//;

export function weatherModule(store) {
  function install(originalFetch) {
    return async function (...args) {
      const resp = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      const m = url.match(WEATHER_RE);
      if (m) resp.clone().json().then((d) => {
        if (d?.weatherRecords?.length) store.appendCapped('weather', { countryId: m[1], at: Date.now(), records: d.weatherRecords }, 200);
      }).catch(() => {});
      return resp;
    };
  }
  return {
    id: 'weather', title: 'Weather Logger',
    install,
    plan: () => ({ writes: [], view: { count: (store.get('weather', []) || []).length } }),
    render(view, el) { if (el) el.textContent = `Captured batches: ${view.count}`; },
  };
}
