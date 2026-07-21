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
import { hedgeModule } from './modules/hedge/index.js';

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
  const hedge = hedgeModule({ fetchJSON, cache, store });

  const modules = [solar, maintenance, money, connections, hedge, weather];

  // Baked in at build time (esbuild define). 'dev' when run unbundled.
  const BUILD_VERSION = typeof __SEE_VERSION__ !== 'undefined' ? __SEE_VERSION__ : 'dev';
  const DOWNLOAD_URL = 'https://raw.githubusercontent.com/Ldlfylt-LDDL/toy_script/main/dist/see_toolkit.user.js';
  let running = false;

  // Numeric tuple compare for versions like "2.1.20260720.205515".
  function cmpVersion(a, b) {
    const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d > 0 ? 1 : -1;
    }
    return 0;
  }

  // Fetch the published userscript, read its @version, and compare. On a newer
  // build, open the raw .user.js — Tampermonkey intercepts it and shows its
  // reinstall page (one click there installs the update). @grant none, so this
  // uses a plain CORS fetch (raw.githubusercontent.com allows it).
  async function checkUpdate(panel, { quiet = false } = {}) {
    if (!quiet) panel.setStatus('Checking for updates…');
    try {
      const r = await fetch(DOWNLOAD_URL + '?t=' + Date.now(), { cache: 'no-store' });
      const txt = await r.text();
      const m = txt.match(/@version\s+([\d.]+)/);
      const remote = m && m[1];
      if (!remote) { if (!quiet) panel.setStatus('Update check failed — could not read remote version.'); return; }
      if (cmpVersion(remote, BUILD_VERSION) > 0) {
        if (quiet) {
          // Auto-open on load would be popup-blocked (no user gesture); just flag it.
          panel.setStatus(`⤓ Update available: v${remote} — click "⟳ Update" to install.`);
        } else {
          panel.setStatus(`⤓ Update v${remote} — opening installer…`);
          window.open(DOWNLOAD_URL, '_blank');
        }
      } else if (!quiet) {
        panel.setStatus(`✓ Up to date (v${BUILD_VERSION}).`);
      }
    } catch (e) {
      if (!quiet) panel.setStatus('Update check failed — see console.');
      console.error('[see-toolkit] update check failed', e);
    }
  }

  async function runOnce(panel) {
    if (running) return;
    running = true;
    try {
      const dryRun = store.flag('dryRun');
      const auto = store.flag('connAuto');
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
      const force = store.flag('forceRun');
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

      // After money was actually collected, the game's own map/cash won't update
      // (no clean in-place refresh hook — it's a React Router SPA that caches route
      // data). The only reliable refresh is a full reload. Do it once, only when
      // money was collected AND the user is on a world/map page (where the stale
      // bubbles show), and de-duped by tick so it can't loop.
      const collected = res.executed.some((l) => l.startsWith('pickup'));
      if (collected && !dryRun && reloadEnabled() && /\/countries/.test(location.pathname)
          && store.get('lastReloadTick', null) !== String(state.lastComputedTick)) {
        store.set('lastReloadTick', String(state.lastComputedTick));
        panel.setStatus('Collected money — refreshing game view…');
        setTimeout(() => location.reload(), 900);
      }
    } catch (e) {
      panel.setStatus('Run failed — see console.');
      console.error('[see-toolkit] run failed', e);
    } finally {
      running = false;
    }
  }

  function toggle(key) { store.set(key, store.flag(key) ? '0' : '1'); }
  // Auto-reload defaults ON (unset → on); user can turn it off via the panel toggle.
  function reloadEnabled() { const v = store.get('autoReload', '1'); return v === '1' || v === 1 || v === true; }

  // Poll once an hour, anchored to the :30 (half past) of each clock hour. Ticks
  // advance on the hour, so a check at half past reliably lands just after the
  // boundary — instead of a free-running hourly timer that fires at whatever
  // minute the page happened to load. Self-reschedules off the wall clock (no
  // setInterval drift), so it stays on the half-hour indefinitely.
  function msToNextHalfHour() {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(30, 0, 0);
    if (next <= now) next.setHours(next.getHours() + 1);
    return next - now;
  }
  function scheduleHourlyOnHalfHour(panel) {
    setTimeout(function fire() {
      runOnce(panel);
      setTimeout(fire, msToNextHalfHour());
    }, msToNextHalfHour());
  }

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
    if (store.get('autoReload', null) === null) store.set('autoReload', '1'); // default on
    panel.setControls([
      { label: 'Dry-run', get: () => store.flag('dryRun'), on: () => toggle('dryRun') },
      { label: 'Conn auto', get: () => store.flag('connAuto'), on: () => toggle('connAuto') },
      { label: 'Auto-reload', get: () => reloadEnabled(), on: () => toggle('autoReload') },
      { label: '▶ Run now', on: () => { store.set('forceRun', '1'); runOnce(panel); } },
      { label: `⟳ Update (v${BUILD_VERSION})`, on: () => checkUpdate(panel) },
      { label: '⭳ Export weather', on: exportLegacyWeather },
    ]);
    runOnce(panel);                  // immediate populate on page load
    scheduleHourlyOnHalfHour(panel); // recurring check, anchored to :30 each hour
    // Quiet check on load: only surfaces (and opens the installer) if newer.
    setTimeout(() => checkUpdate(panel, { quiet: true }), 8000);
    console.log('[see-toolkit] active. Use the panel buttons (Dry-run / Conn auto / Run now / Export weather).');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 4000));
  else setTimeout(start, 4000);
})();
