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
    const status = panel.section('status', 'SEE Toolkit');
    try {
      const dryRun = store.get('dryRun', '0') === '1';
      status.textContent = 'Checking tick…';

      // Tick gate: a tick lasts 4h, so nothing changes within one. Cost one cheap
      // app-data request; if the tick has not advanced since the last completed run
      // (and no manual force), skip the whole ~50-request burst. This makes page
      // refreshes within a tick nearly free and removes the periodic bot-like bursts.
      const tick = await game.getTick();
      const lastRunTick = store.get('lastRunTick', null);
      const force = store.get('forceRun', '0') === '1';
      if (!force && tick === lastRunTick) {
        status.textContent = `Tick ${tick} · up to date — no new tick, skipped (set see:forceRun=1 to run anyway)`;
        return;
      }
      if (force) store.set('forceRun', '0');

      status.textContent = 'Loading game state…';
      // Pre-create every module section so the panel shows structure immediately.
      for (const mod of modules) {
        const el = panel.section(mod.id, mod.title);
        if (!el.textContent) el.textContent = '…';
      }
      const state = await game.loadState();
      let done = 0;
      status.textContent = `Tick ${state.lastComputedTick}${dryRun ? ' · DRY-RUN' : ''} · running 0/${modules.length}…`;
      const res = await runModules({
        modules, state, dryRun, delay: 400 + Math.random() * 400,
        // Render each module the moment it finishes, instead of after the whole run.
        onModule(mod, view, err) {
          done++;
          status.textContent = `Tick ${state.lastComputedTick}${dryRun ? ' · DRY-RUN' : ''} · running ${done}/${modules.length}…`;
          const el = panel.section(mod.id, mod.title);
          if (err) { el.textContent = 'Error — see console.'; return; }
          try { mod.render && mod.render(view, el); } catch {}
        },
        // Live feedback during long serial write sequences (e.g. money pickup).
        onWrite(mod, label, i, total) {
          panel.section(mod.id, mod.title).textContent = `${mod.title}: ${i}/${total} — ${label}`;
        },
      });
      store.set('lastRunTick', state.lastComputedTick);
      status.textContent = `Tick ${state.lastComputedTick}${dryRun ? ' · DRY-RUN' : ''} · ${res.executed.length} write(s) · ${new Date().toLocaleTimeString()}`;
      console.log(`[see-toolkit] tick ${state.lastComputedTick}: ${dryRun ? 'DRY-RUN ' : ''}${res.executed.length} write(s)`, res.planned);
    } catch (e) {
      status.textContent = 'Run failed — see console.';
      console.error('[see-toolkit] run failed', e);
    } finally {
      running = false;
    }
  }

  function start() {
    const panel = mountPanel();
    runOnce(panel);
    setInterval(() => runOnce(panel), RUN_INTERVAL_MS);
    console.log('[see-toolkit] active. localStorage see:dryRun=1 to preview, see:connAuto=1 to enable connection writes.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 4000));
  else setTimeout(start, 4000);
})();
