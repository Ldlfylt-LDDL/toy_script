import { makeStore } from './core/store.js';
import { makeTickCache } from './core/cache.js';
import { makeGame } from './core/game.js';
import { fetchJSON as fetchJSONBase } from './core/api.js';
import { runModules } from './core/scheduler.js';
import { mountPanel } from './core/panel.js';
import { weatherModule } from './modules/weather.js';
import { solarUpgradeModule } from './modules/solarUpgrade.js';
import { maintenanceModule } from './modules/maintenance.js';
import { moneyPickupModule } from './modules/moneyPickup.js';
import { connectionsModule } from './modules/connections/index.js';

(function () {
  'use strict';

  const store = makeStore();
  const cache = makeTickCache();
  const originalFetch = window.fetch.bind(window);
  const fetchJSON = (url, opts) => fetchJSONBase(url, opts, originalFetch);
  const game = makeGame({ fetchJSON, cache });

  const weather = weatherModule(store);
  window.fetch = weather.install(window.fetch); // passive capture on all traffic

  const solar = solarUpgradeModule({ fetchJSON, cache });
  // maintenance skips solar plants that solar-upgrade will repair this night
  const maintenance = maintenanceModule({
    fetchJSON, cache,
    upgradeTargets: (state) => new Set((state.buildings || [])
      .filter((b) => b.kind === 'SolarPowerPlant').map((b) => b.id)),
  });
  const money = moneyPickupModule({ fetchJSON });
  const connections = connectionsModule({ fetchJSON, store, cache });

  const modules = [solar, maintenance, money, connections, weather];

  const RUN_INTERVAL_MS = 60 * 60 * 1000;
  let running = false;

  async function runOnce(panel) {
    if (running) return;
    running = true;
    try {
      const dryRun = store.get('dryRun', '0') === '1';
      const auto = store.get('connAuto', '0') === '1';
      panel.setBadges([
        dryRun ? { text: 'DRY-RUN', color: '#ff9800' } : null,
        auto ? { text: 'connAuto', color: '#4caf50' } : { text: 'read-only', color: '#888' },
      ].filter(Boolean));
      panel.setStatus('Checking tick…');

      // Tick gate: a tick lasts 4h, so nothing changes within one. Cost one cheap
      // app-data request; if the tick has not advanced since the last completed run
      // (and no manual force), skip the whole ~50-request burst. This makes page
      // refreshes within a tick nearly free and removes the periodic bot-like bursts.
      const tick = await game.getTick();
      const lastRunTick = store.get('lastRunTick', null);
      const force = store.get('forceRun', '0') === '1';
      const lastViews = store.get('lastViews', null);
      if (!force && tick === lastRunTick && lastViews) {
        // Same tick, nothing new to compute: re-render the last run's results from
        // cache (zero requests) instead of hiding the data panel.
        for (const mod of modules) {
          const sec = panel.section(mod.id, mod.title);
          try { mod.render && mod.render(lastViews[mod.id], sec); } catch {}
        }
        panel.setStatus(`Tick ${tick} · showing last run (cached) · Run now to refresh`);
        return;
      }
      if (force) store.set('forceRun', '0');

      panel.setStatus('Loading game state…');
      for (const mod of modules) panel.section(mod.id, mod.title); // pre-create sections
      const state = await game.loadState();
      let done = 0;
      panel.setStatus(`Tick ${state.lastComputedTick} · running 0/${modules.length}…`);
      const res = await runModules({
        modules, state, dryRun, delay: 400 + Math.random() * 400,
        // Render each module the moment it finishes, instead of after the whole run.
        onModule(mod, view, err) {
          done++;
          panel.setStatus(`Tick ${state.lastComputedTick} · running ${done}/${modules.length}…`);
          const sec = panel.section(mod.id, mod.title);
          if (err) { sec.setDot('error'); sec.setSummary('error — see console'); return; }
          try { mod.render && mod.render(view, sec); } catch {}
        },
        // Live feedback during long serial write sequences (e.g. money pickup).
        onWrite(mod, label, i, total) {
          const sec = panel.section(mod.id, mod.title);
          sec.setDot('busy');
          sec.setSummary(`${i}/${total} — ${label}`);
        },
      });
      store.set('lastRunTick', state.lastComputedTick);
      store.set('lastViews', res.views); // cache for zero-request re-render on same-tick refreshes
      panel.setStatus(`Tick ${state.lastComputedTick}${dryRun ? ' · DRY-RUN' : ''} · ${res.executed.length} write(s) · ${new Date().toLocaleTimeString()}`);
      console.log(`[see-toolkit] tick ${state.lastComputedTick}: ${dryRun ? 'DRY-RUN ' : ''}${res.executed.length} write(s)`, res.planned);
    } catch (e) {
      panel.setStatus('Run failed — see console.');
      console.error('[see-toolkit] run failed', e);
    } finally {
      running = false;
    }
  }

  function toggle(key) { store.set(key, store.get(key, '0') === '1' ? '0' : '1'); }

  function exportLegacyWeather() {
    const raw = localStorage.getItem('see_weather_log');
    if (!raw) { alert('No legacy weather data (see_weather_log) found.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    a.download = `see_weather_legacy_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function start() {
    const panel = mountPanel();
    panel.setControls([
      { label: 'Dry-run', get: () => store.get('dryRun', '0') === '1', on: () => toggle('dryRun') },
      { label: 'Conn auto', get: () => store.get('connAuto', '0') === '1', on: () => toggle('connAuto') },
      { label: '▶ Run now', on: () => { store.set('forceRun', '1'); runOnce(panel); } },
      { label: '⭳ Export weather', on: exportLegacyWeather },
    ]);
    runOnce(panel);
    setInterval(() => runOnce(panel), RUN_INTERVAL_MS);
    console.log('[see-toolkit] active. Use the panel buttons (Dry-run / Conn auto / Run now / Export weather).');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 4000));
  else setTimeout(start, 4000);
})();
