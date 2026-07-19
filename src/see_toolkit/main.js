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
      const state = await game.loadState();
      const res = await runModules({ modules, state, dryRun, delay: 400 + Math.random() * 400 });
      for (const mod of modules) {
        try { mod.render && mod.render(res.views[mod.id], panel.section(mod.id, mod.title)); }
        catch { /* render best-effort */ }
      }
      console.log(`[see-toolkit] tick ${state.lastComputedTick}: ${dryRun ? 'DRY-RUN ' : ''}${res.executed.length} write(s)`, res.planned);
    } catch (e) {
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
