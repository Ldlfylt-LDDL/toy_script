// ==UserScript==
// @name         SimEnergyEmpire Toolkit
// @namespace    https://www.simenergyempire.com/
// @version      1.0
// @description  Weather data logger + power connection reversal checker/fixer for Sim Energy Empire
// @author       LDDL
// @match        https://www.simenergyempire.com/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

/*
 * Two independent tools bundled into one userscript:
 *
 *   1. Weather Logger  (panel: "W", bottom-right)
 *      Auto-fetches and stores weather data for ALL countries every session.
 *      Console API: WeatherLogger.stats() / .compare(tick) / .fetchAll(ticks)
 *                   .exportJSON() / .exportCSV() / .clear()
 *
 *   2. Connection Checker  (panel: "⚡", bottom-right, above W)
 *      Detects "reversed" power connections (buying from a high-price city and
 *      selling into a low-price one = loss) and offers a free one-click fix that
 *      flips the flow direction via PUT (no rebuild cost). "Fix All Reversed"
 *      repairs every reversed connection at once.
 *
 * Each tool is a self-contained IIFE with its own scope and panel.
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 1 — Weather Logger
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const STORAGE_KEY = 'see_weather_log';
  const COUNTRIES_KEY = 'see_countries';
  const WEATHER_URL_PATTERN = /\/api\/v1\/weather\/countries\/(\d+)\/ticks\/(\d+)\//;
  const FETCH_TICKS = 50;

  function loadLog() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLog(log) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  }

  function loadCountries() {
    try {
      return JSON.parse(localStorage.getItem(COUNTRIES_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCountries(countries) {
    localStorage.setItem(COUNTRIES_KEY, JSON.stringify(countries));
  }

  function processWeatherData(countryId, data) {
    if (!data || !data.weatherRecords || data.weatherRecords.length === 0) return;

    const log = loadLog();
    const entry = {
      fetchedAt: new Date().toISOString(),
      countryId: String(countryId),
      records: data.weatherRecords,
    };

    log.push(entry);
    saveLog(log);

    const ticks = data.weatherRecords.map((r) => r.timeTick);
    console.log(
      `%c[WeatherLogger] Country ${countryId}: saved ${data.weatherRecords.length} records (ticks ${Math.min(...ticks)}-${Math.max(...ticks)})`,
      'color: #4fc3f7'
    );
  }

  // --- Hook fetch (passive capture) ---
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    if (WEATHER_URL_PATTERN.test(url)) {
      const match = url.match(WEATHER_URL_PATTERN);
      const clone = response.clone();
      clone
        .json()
        .then((data) => processWeatherData(match[1], data))
        .catch(() => {});
    }

    return response;
  };

  // --- Hook XMLHttpRequest (passive capture) ---
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._weatherLoggerUrl = url;
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (WEATHER_URL_PATTERN.test(this._weatherLoggerUrl)) {
      const match = this._weatherLoggerUrl.match(WEATHER_URL_PATTERN);
      this.addEventListener('load', function () {
        try {
          processWeatherData(match[1], JSON.parse(this.responseText));
        } catch {}
      });
    }
    return originalSend.apply(this, args);
  };

  // --- Active: fetch all countries then their weather ---
  async function fetchAllCountries() {
    try {
      const resp = await originalFetch('/api/v1/countries/');
      const data = await resp.json();
      if (!data.countries) return [];
      const countries = data.countries.map((c) => ({
        id: c.id,
        name: c.name,
        weatherType: c.weatherType,
      }));
      saveCountries(countries);
      console.log(
        `%c[WeatherLogger] Found ${countries.length} countries: ${countries.map((c) => `${c.name}(${c.id}, ${c.weatherType})`).join(', ')}`,
        'color: #81c784; font-weight: bold'
      );
      return countries;
    } catch (e) {
      console.warn('[WeatherLogger] Failed to fetch countries:', e);
      return loadCountries();
    }
  }

  async function fetchAllWeather(ticks) {
    const countries = await fetchAllCountries();
    if (countries.length === 0) {
      console.warn('[WeatherLogger] No countries found, skipping weather fetch');
      return;
    }

    const t = ticks || FETCH_TICKS;
    console.log(
      `%c[WeatherLogger] Fetching weather (${t} ticks) for ${countries.length} countries...`,
      'color: #81c784'
    );

    const results = await Promise.allSettled(
      countries.map(async (c) => {
        const resp = await originalFetch(
          `/api/v1/weather/countries/${c.id}/ticks/${t}/`
        );
        const data = await resp.json();
        processWeatherData(c.id, data);
        return { countryId: c.id, count: data.weatherRecords?.length || 0 };
      })
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    const fail = results.filter((r) => r.status === 'rejected');
    console.log(
      `%c[WeatherLogger] Done: ${ok.length} succeeded, ${fail.length} failed`,
      'color: #81c784; font-weight: bold'
    );
  }

  // --- Status panel ---
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'wl-panel';
    panel.innerHTML = `
      <style>
        #wl-panel {
          position: fixed; bottom: 10px; left: 10px; z-index: 99999;
          font: 12px monospace; user-select: none;
          display: flex; flex-direction: column; align-items: flex-start;
        }
        #wl-panel .wl-toggle {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(20,20,30,0.85); border: 1px solid #444;
          color: #4fc3f7; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        #wl-panel .wl-toggle:hover { border-color: #4fc3f7; }
        #wl-panel .wl-card {
          display: none; background: rgba(20,20,30,0.92); color: #ccc;
          padding: 10px 14px; border-radius: 6px; border: 1px solid #444;
          min-width: 200px; margin-bottom: 6px; cursor: move;
        }
        #wl-panel.wl-open .wl-card { display: block; }
        #wl-panel .wl-title { color: #4fc3f7; font-weight: bold; margin-bottom: 6px; }
        #wl-panel .wl-dot { display: inline-block; width: 8px; height: 8px;
          border-radius: 50%; margin-right: 6px; vertical-align: middle; }
        #wl-panel .wl-row { line-height: 1.7; }
        #wl-panel .wl-fetch-row { margin-top: 6px; display: flex; gap: 4px; align-items: center; }
        #wl-panel .wl-input {
          width: 60px; background: #2a2a3a; border: 1px solid #555; color: #eee;
          border-radius: 3px; padding: 2px 6px; font: 12px monospace; text-align: center;
        }
        #wl-panel .wl-btn {
          background: #2a2a3a; border: 1px solid #555; color: #4fc3f7;
          border-radius: 3px; padding: 2px 8px; cursor: pointer; font: 12px monospace;
        }
        #wl-panel .wl-btn:hover { border-color: #4fc3f7; }
        #wl-panel .wl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      </style>
      <div class="wl-card">
        <div class="wl-title">WeatherLogger</div>
        <div class="wl-row"><span class="wl-dot" id="wl-status"></span><span id="wl-msg">Starting...</span></div>
        <div class="wl-row" id="wl-countries"></div>
        <div class="wl-row" id="wl-records"></div>
        <div class="wl-row" id="wl-size"></div>
        <div class="wl-fetch-row">
          <span>Ticks:</span>
          <input class="wl-input" id="wl-ticks" type="number" value="50" min="1">
          <button class="wl-btn" id="wl-fetch-btn">Fetch</button>
        </div>
      </div>
      <div class="wl-toggle" title="WeatherLogger">W</div>`;
    document.body.appendChild(panel);

    panel.querySelector('.wl-toggle').addEventListener('click', () => {
      panel.classList.toggle('wl-open');
    });

    panel.querySelector('#wl-fetch-btn').addEventListener('click', async () => {
      const btn = panel.querySelector('#wl-fetch-btn');
      const ticks = parseInt(panel.querySelector('#wl-ticks').value) || FETCH_TICKS;
      btn.disabled = true;
      btn.textContent = '...';
      updatePanel('busy', 'Fetching...');
      try {
        await fetchAllWeather(ticks);
        updatePanel('ok', `Last: ${new Date().toLocaleTimeString()}`);
      } catch (e) {
        updatePanel('error', 'Fetch failed');
      }
      btn.disabled = false;
      btn.textContent = 'Fetch';
    });

    // Dragging (on card only)
    const card = panel.querySelector('.wl-card');
    let dragging = false, dx, dy;
    card.addEventListener('mousedown', (e) => {
      if (e.target.closest('.wl-input, .wl-btn')) return;
      dragging = true;
      dx = e.clientX - panel.offsetLeft;
      dy = e.clientY - panel.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = (e.clientX - dx) + 'px';
      panel.style.top = (e.clientY - dy) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });

    return panel;
  }

  let panelEl = null;
  function getPanel() {
    if (!panelEl && document.body) panelEl = createPanel();
    return panelEl;
  }

  function updatePanel(status, msg) {
    const p = getPanel();
    if (!p) return;
    const dot = p.querySelector('#wl-status');
    const colors = { ok: '#4caf50', busy: '#ff9800', error: '#f44336' };
    dot.style.background = colors[status] || '#888';
    p.querySelector('#wl-msg').textContent = msg;

    const records = getAllDeduplicated();
    const countries = loadCountries();
    const byCountry = {};
    for (const r of records) {
      byCountry[r.countryId] = (byCountry[r.countryId] || 0) + 1;
    }
    p.querySelector('#wl-countries').textContent =
      `Countries: ${countries.length} (${countries.map(c => c.name).join(', ') || '—'})`;
    p.querySelector('#wl-records').textContent = `Records: ${records.length}`;
    const kb = (localStorage.getItem(STORAGE_KEY)?.length / 1024 || 0).toFixed(1);
    p.querySelector('#wl-size').textContent = `Storage: ${kb} KB`;
  }

  function getAllDeduplicated() {
    const log = loadLog();
    const seen = new Map();
    for (const entry of log) {
      for (const r of entry.records) {
        const key = `${entry.countryId}_${r.timeTick}`;
        if (!seen.has(key) || entry.fetchedAt > seen.get(key).fetchedAt) {
          seen.set(key, { ...r, countryId: entry.countryId, fetchedAt: entry.fetchedAt });
        }
      }
    }
    return [...seen.values()];
  }

  // --- Auto-fetch on page load (wait for session to be ready) ---
  const origFetchAllWeather = fetchAllWeather;
  async function autoFetch() {
    updatePanel('busy', 'Fetching...');
    try {
      await origFetchAllWeather();
      updatePanel('ok', `Last: ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      updatePanel('error', 'Fetch failed');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(autoFetch, 3000));
  } else {
    setTimeout(autoFetch, 3000);
  }

  // --- Console utilities ---
  window.WeatherLogger = {
    getLog() {
      return loadLog();
    },

    getCountries() {
      return loadCountries();
    },

    async fetchAll(ticks) {
      updatePanel('busy', 'Fetching...');
      try {
        await fetchAllWeather(ticks);
        updatePanel('ok', `Last: ${new Date().toLocaleTimeString()}`);
      } catch (e) {
        updatePanel('error', 'Fetch failed');
      }
    },

    getAllRecords() {
      return getAllDeduplicated().sort(
        (a, b) => a.countryId.localeCompare(b.countryId) || a.timeTick - b.timeTick
      );
    },

    compare(tick) {
      const records = this.getAllRecords();
      const countries = loadCountries();
      const nameMap = Object.fromEntries(countries.map((c) => [String(c.id), c.name]));

      const atTick = records.filter((r) => r.timeTick === tick);
      if (atTick.length === 0) {
        console.log(`No data for tick ${tick}`);
        return;
      }
      console.log(`%c=== Tick ${tick} across countries ===`, 'font-weight: bold');
      console.table(
        atTick.map((r) => ({
          Country: `${nameMap[r.countryId] || r.countryId} (${r.countryId})`,
          Temp: r.temperature,
          Clouds: r.clouds,
          Rain: r.rainfall,
          Wind: r.wind,
          Water: r.water,
          Month: r.month,
          Day: r.daylight,
        }))
      );
    },

    exportJSON() {
      const records = this.getAllRecords();
      const blob = new Blob([JSON.stringify(records, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `see_weather_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log(
        `%c[WeatherLogger] Exported ${records.length} deduplicated records`,
        'color: #4fc3f7'
      );
    },

    exportCSV() {
      const records = this.getAllRecords();
      const header =
        'countryId,countryName,timeTick,month,temperature,clouds,rainfall,water,wind,daylight,fetchedAt';
      const countries = loadCountries();
      const nameMap = Object.fromEntries(countries.map((c) => [String(c.id), c.name]));
      const rows = records.map(
        (r) =>
          `${r.countryId},${nameMap[r.countryId] || ''},${r.timeTick},${r.month},${r.temperature},${r.clouds},${r.rainfall},${r.water},${r.wind},${r.daylight},${r.fetchedAt}`
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `see_weather_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      console.log(
        `%c[WeatherLogger] Exported ${records.length} records as CSV`,
        'color: #4fc3f7'
      );
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUNTRIES_KEY);
      console.log('%c[WeatherLogger] Log cleared', 'color: #ff8a65');
    },

    stats() {
      const records = this.getAllRecords();
      const countries = loadCountries();
      const byCountry = {};
      for (const r of records) {
        if (!byCountry[r.countryId]) byCountry[r.countryId] = [];
        byCountry[r.countryId].push(r);
      }

      console.log('%c=== WeatherLogger Stats ===', 'font-weight: bold');
      console.table(
        countries.map((c) => {
          const recs = byCountry[String(c.id)] || [];
          const ticks = recs.map((r) => r.timeTick);
          return {
            Country: `${c.name} (${c.id})`,
            Type: c.weatherType,
            Records: recs.length,
            'Tick range': recs.length
              ? `${Math.min(...ticks)} - ${Math.max(...ticks)}`
              : 'none',
          };
        })
      );
      console.log(
        `Storage: ${(localStorage.getItem(STORAGE_KEY)?.length / 1024).toFixed(1)} KB`
      );
    },
  };

  console.log(
    '%c[WeatherLogger] Active. Auto-fetching all countries on load.\n' +
      'Commands: .stats() .compare(tick) .fetchAll(ticks) .exportJSON() .exportCSV() .clear()',
    'color: #4fc3f7; font-weight: bold'
  );
})();

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 2 — Connection Checker
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Panel ─────────────────────────────────────────────────────────────────

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'cc-panel';
    panel.innerHTML = `
      <style>
        #cc-panel {
          position: fixed; bottom: 50px; left: 10px; z-index: 99999;
          font: 12px monospace; user-select: none;
          display: flex; flex-direction: column; align-items: flex-start;
        }
        #cc-panel .cc-toggle {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(20,20,30,0.85); border: 1px solid #444;
          color: #ff9800; font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        #cc-panel .cc-toggle:hover { border-color: #ff9800; }
        #cc-panel .cc-card {
          display: none; background: rgba(20,20,30,0.92); color: #ccc;
          padding: 10px 14px; border-radius: 6px; border: 1px solid #444;
          min-width: 280px; max-width: 400px; margin-bottom: 6px; cursor: move;
        }
        #cc-panel.cc-open .cc-card { display: block; }
        #cc-panel .cc-title { color: #ff9800; font-weight: bold; margin-bottom: 6px; }
        #cc-panel .cc-dot { display: inline-block; width: 8px; height: 8px;
          border-radius: 50%; margin-right: 6px; vertical-align: middle; }
        #cc-panel .cc-row { line-height: 1.7; }
        #cc-panel .cc-results { margin-top: 6px; max-height: 240px; overflow-y: auto; }
        #cc-panel .cc-ok   { color: #81c784; }
        #cc-panel .cc-warn { color: #ff5252; font-weight: bold; }
        #cc-panel .cc-skip { color: #888; }
        #cc-panel .cc-warn-block { margin-bottom: 4px; }
        #cc-panel .cc-fix-btn {
          margin-left: 6px; background: #2a1a1a; border: 1px solid #ff5252;
          color: #ff5252; border-radius: 3px; padding: 1px 7px;
          cursor: pointer; font: 11px monospace;
        }
        #cc-panel .cc-fix-btn:hover { background: #ff5252; color: #fff; }
        #cc-panel .cc-fix-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        #cc-panel .cc-btn {
          margin-top: 8px; background: #2a2a3a; border: 1px solid #555;
          color: #ff9800; border-radius: 3px; padding: 3px 10px;
          cursor: pointer; font: 12px monospace; width: 100%;
        }
        #cc-panel .cc-btn:hover { border-color: #ff9800; }
        #cc-panel .cc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        #cc-panel .cc-fixall-btn {
          margin-top: 8px; background: #2a1a1a; border: 1px solid #ff5252;
          color: #ff5252; border-radius: 3px; padding: 3px 10px;
          cursor: pointer; font: 12px monospace; width: 100%; font-weight: bold;
          display: none;
        }
        #cc-panel .cc-fixall-btn:hover { background: #ff5252; color: #fff; }
        #cc-panel .cc-fixall-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        #cc-panel .cc-solar {
          display: none; margin-top: 8px; padding-top: 8px;
          border-top: 1px solid #444; line-height: 1.6;
        }
      </style>
      <div class="cc-card">
        <div class="cc-title">⚡ Connection Checker</div>
        <div class="cc-row"><span class="cc-dot" id="cc-status"></span><span id="cc-msg">Waiting...</span></div>
        <div class="cc-results" id="cc-results"></div>
        <button class="cc-fixall-btn" id="cc-fixall-btn">Fix All Reversed</button>
        <button class="cc-btn" id="cc-run-btn">Check Now</button>
        <div class="cc-solar" id="cc-solar">
          <span class="cc-dot" id="cc-solar-dot"></span><span id="cc-solar-msg"></span>
        </div>
      </div>
      <div class="cc-toggle" title="Connection Checker">⚡</div>`;
    document.body.appendChild(panel);

    panel.querySelector('.cc-toggle').addEventListener('click', () => {
      panel.classList.toggle('cc-open');
    });
    panel.querySelector('#cc-run-btn').addEventListener('click', () => runCheck());
    panel.querySelector('#cc-fixall-btn').addEventListener('click', () => fixAll());

    // Fix button delegation (single)
    panel.querySelector('#cc-results').addEventListener('click', (e) => {
      const btn = e.target.closest('.cc-fix-btn');
      if (!btn) return;
      const idx = parseInt(btn.dataset.fixIdx, 10);
      if (isNaN(idx) || !pendingFixes[idx]) return;
      applyFixToButton(btn, idx);
    });

    // Drag
    const card = panel.querySelector('.cc-card');
    let dragging = false, dx, dy;
    card.addEventListener('mousedown', (e) => {
      if (e.target.closest('.cc-btn') || e.target.closest('.cc-fix-btn')) return;
      dragging = true;
      dx = e.clientX - panel.offsetLeft;
      dy = e.clientY - panel.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = (e.clientX - dx) + 'px';
      panel.style.top  = (e.clientY - dy) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
    return panel;
  }

  let panelEl = null;
  function getPanel() {
    if (!panelEl && document.body) panelEl = createPanel();
    return panelEl;
  }

  function setStatus(status, msg) {
    const p = getPanel();
    if (!p) return;
    const colors = { ok: '#4caf50', busy: '#ff9800', error: '#f44336', warn: '#ff5252' };
    p.querySelector('#cc-status').style.background = colors[status] || '#888';
    p.querySelector('#cc-msg').textContent = msg;
  }

  function setResults(html) {
    getPanel().querySelector('#cc-results').innerHTML = html;
  }

  // ── Fix data store ─────────────────────────────────────────────────────────

  // Each entry: { edgeId, connId, activity }
  let pendingFixes = [];

  function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : null;
  }

  // MD5 — ported verbatim from the game bundle (functions qke/Jke/Qke/eCe/tCe/
  // rCe/nCe). Used to reproduce the game's X-Prot request signature.
  const md5hex = (function () {
    const add = (e, t) => {
      const r = (e & 65535) + (t & 65535);
      return (((e >> 16) + (t >> 16) + (r >> 16)) << 16) | (r & 65535);
    };
    const rol = (e, t) => (e << t) | (e >>> (32 - t));
    const cmn = (q, a, b, x, s, t) => add(rol(add(add(a, q), add(x, t)), s), b);
    const ff = (a, b, c, d, x, s, t) => cmn((b & c) | (~b & d), a, b, x, s, t);
    const gg = (a, b, c, d, x, s, t) => cmn((b & d) | (c & ~d), a, b, x, s, t);
    const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
    const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);
    const core = (e, t) => {
      e[t >> 5] |= 128 << (t % 32);
      e[(((t + 64) >>> 9) << 4) + 14] = t;
      let r = 1732584193, n = -271733879, i = -1732584194, o = 271733878;
      for (let a = 0; a < e.length; a += 16) {
        const s = r, l = n, c = i, u = o;
        r = ff(r, n, i, o, e[a + 0], 7, -680876936); o = ff(o, r, n, i, e[a + 1], 12, -389564586);
        i = ff(i, o, r, n, e[a + 2], 17, 606105819); n = ff(n, i, o, r, e[a + 3], 22, -1044525330);
        r = ff(r, n, i, o, e[a + 4], 7, -176418897); o = ff(o, r, n, i, e[a + 5], 12, 1200080426);
        i = ff(i, o, r, n, e[a + 6], 17, -1473231341); n = ff(n, i, o, r, e[a + 7], 22, -45705983);
        r = ff(r, n, i, o, e[a + 8], 7, 1770035416); o = ff(o, r, n, i, e[a + 9], 12, -1958414417);
        i = ff(i, o, r, n, e[a + 10], 17, -42063); n = ff(n, i, o, r, e[a + 11], 22, -1990404162);
        r = ff(r, n, i, o, e[a + 12], 7, 1804603682); o = ff(o, r, n, i, e[a + 13], 12, -40341101);
        i = ff(i, o, r, n, e[a + 14], 17, -1502002290); n = ff(n, i, o, r, e[a + 15], 22, 1236535329);
        r = gg(r, n, i, o, e[a + 1], 5, -165796510); o = gg(o, r, n, i, e[a + 6], 9, -1069501632);
        i = gg(i, o, r, n, e[a + 11], 14, 643717713); n = gg(n, i, o, r, e[a + 0], 20, -373897302);
        r = gg(r, n, i, o, e[a + 5], 5, -701558691); o = gg(o, r, n, i, e[a + 10], 9, 38016083);
        i = gg(i, o, r, n, e[a + 15], 14, -660478335); n = gg(n, i, o, r, e[a + 4], 20, -405537848);
        r = gg(r, n, i, o, e[a + 9], 5, 568446438); o = gg(o, r, n, i, e[a + 14], 9, -1019803690);
        i = gg(i, o, r, n, e[a + 3], 14, -187363961); n = gg(n, i, o, r, e[a + 8], 20, 1163531501);
        r = gg(r, n, i, o, e[a + 13], 5, -1444681467); o = gg(o, r, n, i, e[a + 2], 9, -51403784);
        i = gg(i, o, r, n, e[a + 7], 14, 1735328473); n = gg(n, i, o, r, e[a + 12], 20, -1926607734);
        r = hh(r, n, i, o, e[a + 5], 4, -378558); o = hh(o, r, n, i, e[a + 8], 11, -2022574463);
        i = hh(i, o, r, n, e[a + 11], 16, 1839030562); n = hh(n, i, o, r, e[a + 14], 23, -35309556);
        r = hh(r, n, i, o, e[a + 1], 4, -1530992060); o = hh(o, r, n, i, e[a + 4], 11, 1272893353);
        i = hh(i, o, r, n, e[a + 7], 16, -155497632); n = hh(n, i, o, r, e[a + 10], 23, -1094730640);
        r = hh(r, n, i, o, e[a + 13], 4, 681279174); o = hh(o, r, n, i, e[a + 0], 11, -358537222);
        i = hh(i, o, r, n, e[a + 3], 16, -722521979); n = hh(n, i, o, r, e[a + 6], 23, 76029189);
        r = hh(r, n, i, o, e[a + 9], 4, -640364487); o = hh(o, r, n, i, e[a + 12], 11, -421815835);
        i = hh(i, o, r, n, e[a + 15], 16, 530742520); n = hh(n, i, o, r, e[a + 2], 23, -995338651);
        r = ii(r, n, i, o, e[a + 0], 6, -198630844); o = ii(o, r, n, i, e[a + 7], 10, 1126891415);
        i = ii(i, o, r, n, e[a + 14], 15, -1416354905); n = ii(n, i, o, r, e[a + 5], 21, -57434055);
        r = ii(r, n, i, o, e[a + 12], 6, 1700485571); o = ii(o, r, n, i, e[a + 3], 10, -1894986606);
        i = ii(i, o, r, n, e[a + 10], 15, -1051523); n = ii(n, i, o, r, e[a + 1], 21, -2054922799);
        r = ii(r, n, i, o, e[a + 8], 6, 1873313359); o = ii(o, r, n, i, e[a + 15], 10, -30611744);
        i = ii(i, o, r, n, e[a + 6], 15, -1560198380); n = ii(n, i, o, r, e[a + 13], 21, 1309151649);
        r = ii(r, n, i, o, e[a + 4], 6, -145523070); o = ii(o, r, n, i, e[a + 11], 10, -1120210379);
        i = ii(i, o, r, n, e[a + 2], 15, 718787259); n = ii(n, i, o, r, e[a + 9], 21, -343485551);
        r = add(r, s); n = add(n, l); i = add(i, c); o = add(o, u);
      }
      return [r, n, i, o];
    };
    const bin2str = (e) => {
      let t = '';
      for (let r = 0; r < e.length * 32; r += 8)
        t += String.fromCharCode((e[r >> 5] >>> (r % 32)) & 255);
      return t;
    };
    const str2bin = (e) => {
      const t = Array(e.length >> 2);
      for (let r = 0; r < t.length; r++) t[r] = 0;
      for (let r = 0; r < e.length * 8; r += 8)
        t[r >> 5] |= (e.charCodeAt(r / 8) & 255) << (r % 32);
      return t;
    };
    const utf8 = (e) => {
      let t = '', r = -1, n, i;
      while (++r < e.length) {
        n = e.charCodeAt(r);
        i = r + 1 < e.length ? e.charCodeAt(r + 1) : 0;
        if (55296 <= n && n <= 56319 && 56320 <= i && i <= 57343) {
          n = 65536 + ((n & 1023) << 10) + (i & 1023); r++;
        }
        if (n <= 127) t += String.fromCharCode(n);
        else if (n <= 2047) t += String.fromCharCode(192 | ((n >>> 6) & 31), 128 | (n & 63));
        else if (n <= 65535) t += String.fromCharCode(224 | ((n >>> 12) & 15), 128 | ((n >>> 6) & 63), 128 | (n & 63));
        else if (n <= 2097151) t += String.fromCharCode(240 | ((n >>> 18) & 7), 128 | ((n >>> 12) & 63), 128 | ((n >>> 6) & 63), 128 | (n & 63));
      }
      return t;
    };
    const toHex = (e) => {
      const t = '0123456789abcdef';
      let r = '';
      for (let i = 0; i < e.length; i++) {
        const n = e.charCodeAt(i);
        r += t.charAt((n >>> 4) & 15) + t.charAt(n & 15);
      }
      return r;
    };
    return (input) => {
      const s = utf8(input);
      return toHex(bin2str(core(str2bin(s), s.length * 8)));
    };
  })();

  // Build the full custom header set the game attaches to every request, so an
  // unsafe write is indistinguishable from clicking the in-game button:
  //   X-CSRFToken  — Django CSRF (required for PUT/POST/DELETE)
  //   X-tz-offset  — timezone offset in minutes
  //   X-Ts         — request timestamp in ms
  //   X-Prot       — md5(url + timestamp)  (game's request signature)
  function gameHeaders(url, extra) {
    const ts = new Date().getTime();
    const headers = {
      'X-tz-offset': String(new Date().getTimezoneOffset()),
      'X-Ts': String(ts),
      'X-Prot': md5hex(url + ts),
      ...extra,
    };
    const csrf = getCookie('csrftoken');
    if (csrf) headers['X-CSRFToken'] = csrf;
    return headers;
  }

  async function fixConnection({ edgeId, connId, activity }) {
    const payload = {
      id:            activity.id,
      state:         activity.state,
      timeTick:      activity.timeTick,
      capacity:      -activity.capacity,   // flip direction
      purchasePrice: activity.purchasePrice,
      isBoosted:     activity.isBoosted,
      firstInChain:  activity.firstInChain,
    };
    const url = `/api/v1/edges/${edgeId}/connections/${connId}/activities/`;
    const resp = await fetch(url, {
      method: 'PUT',
      headers: gameHeaders(url, { 'Content-Type': 'application/json' }),
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  // Apply a fix and reflect result on its inline button element
  async function applyFixToButton(btn, idx) {
    const fix = pendingFixes[idx];
    if (!fix || fix.done) return true;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      await fixConnection(fix);
      fix.done = true;
      btn.textContent = 'Done';
      btn.style.color = '#81c784';
      btn.style.borderColor = '#81c784';
      return true;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Err';
      btn.title = err.message;
      console.error('[ConnectionChecker] fix failed', err);
      return false;
    }
  }

  // Fix every reversed connection in sequence
  async function fixAll() {
    const fixAllBtn = getPanel().querySelector('#cc-fixall-btn');
    fixAllBtn.disabled = true;
    fixAllBtn.textContent = 'Fixing...';
    let ok = 0, fail = 0;
    for (let i = 0; i < pendingFixes.length; i++) {
      if (pendingFixes[i].done) continue;
      const btn = getPanel().querySelector(`.cc-fix-btn[data-fix-idx="${i}"]`);
      let success;
      if (btn) {
        success = await applyFixToButton(btn, i);
      } else {
        // No inline button (shouldn't happen) — fix directly
        try { await fixConnection(pendingFixes[i]); pendingFixes[i].done = true; success = true; }
        catch (e) { success = false; }
      }
      success ? ok++ : fail++;
    }
    fixAllBtn.textContent = 'Fix All Reversed';
    fixAllBtn.disabled = false;
    if (fail === 0) {
      setStatus('ok', `Fixed all ${ok} reversed connection(s).`);
      fixAllBtn.style.display = 'none';
    } else {
      setStatus('warn', `Fixed ${ok}, ${fail} failed. See console.`);
    }
  }

  // ── Core logic ─────────────────────────────────────────────────────────────

  async function runCheck() {
    const btn = getPanel().querySelector('#cc-run-btn');
    btn.disabled = true;
    btn.textContent = 'Checking...';
    setStatus('busy', 'Fetching connections...');
    setResults('');
    pendingFixes = [];

    try {
      const conns = await fetchPlayerConnections();
      const powerConns = conns.filter(c => c.kind === 'Power');

      if (powerConns.length === 0) {
        setStatus('ok', 'No power connections found.');
        setResults('');
        return;
      }

      setStatus('busy', `Checking ${powerConns.length} power connections...`);

      const results = await Promise.allSettled(
        powerConns.map(c => checkConnection(c))
      );

      const rows = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
      const warnings = rows.filter(r => r.reversed);

      let html = rows.map(r => {
        if (r.noData) {
          return `<div class="cc-skip">— ${r.src} → ${r.dst}: no recent data</div>`;
        }
        if (r.reversed) {
          const fixIdx = pendingFixes.length;
          pendingFixes.push({ edgeId: r.edgeId, connId: r.connId, activity: r.fixActivity });
          const fixBtn = r.fixActivity
            ? `<button class="cc-fix-btn" data-fix-idx="${fixIdx}" title="Reverse direction via PUT (free)">Fix</button>`
            : '';
          return `<div class="cc-warn-block cc-warn">⚠ ${r.src} → ${r.dst}${fixBtn}<br>
            &nbsp;&nbsp;buy ${r.buyPrice}/MWh &gt; sell ${r.sellPrice}/MWh</div>`;
        }
        return `<div class="cc-ok">✓ ${r.src} → ${r.dst} (${r.buyPrice}→${r.sellPrice}/MWh)</div>`;
      }).join('');

      const fixAllBtn = getPanel().querySelector('#cc-fixall-btn');
      const fixableCount = pendingFixes.filter(f => f.activity).length;
      if (warnings.length > 0) {
        setStatus('warn', `⚠ ${warnings.length} reversed connection(s)!`);
        getPanel().classList.add('cc-open');
        if (fixableCount > 1) {
          fixAllBtn.style.display = 'block';
          fixAllBtn.disabled = false;
          fixAllBtn.textContent = `Fix All Reversed (${fixableCount})`;
        } else {
          fixAllBtn.style.display = 'none';
        }
      } else {
        setStatus('ok', `All ${powerConns.length} connections OK`);
        fixAllBtn.style.display = 'none';
      }

      setResults(html || '<div class="cc-skip">No results.</div>');
    } catch (e) {
      setStatus('error', 'Check failed: ' + e.message);
      console.error('[ConnectionChecker]', e);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Check Now';
    }
  }

  // The connections sub-resource does NOT accept the "me" alias (server 500s
  // trying to parse "me" as a numeric id). Only /api/v1/players/me/ (the player
  // object itself) supports it — so resolve the real player id first, then use
  // it for /api/v1/players/{id}/connections/, exactly like the game does.
  let cachedPlayerId = null;
  async function getPlayerId() {
    if (cachedPlayerId != null) return cachedPlayerId;
    const resp = await fetch('/api/v1/players/me/');
    if (!resp.ok) throw new Error(`players/me HTTP ${resp.status}`);
    const data = await resp.json();
    if (data?.id == null) throw new Error('players/me returned no id');
    cachedPlayerId = data.id;
    return cachedPlayerId;
  }

  async function fetchPlayerConnections() {
    const playerId = await getPlayerId();
    const resp = await fetch(`/api/v1/players/${playerId}/connections/`);
    if (!resp.ok) throw new Error(`connections HTTP ${resp.status}`);
    const data = await resp.json();
    return data.connections || [];
  }

  // Replicates the game's activity normalization (hoe/UIe in the bundle):
  // builds the activity list from the first recorded tick up to k+maxFutureTicks,
  // carrying the last Production/Sleep activity forward into gaps with a negative
  // placeholder id (which the server treats as "schedule a new activity").
  const MAX_FUTURE_TICKS = 12;
  const ACTIVE_STATES = ['Production', 'Sleep'];

  function normalizeActivities(acts, k) {
    const sorted = [...acts].sort((a, b) => a.timeTick - b.timeTick);
    if (sorted.length === 0) return [];
    const first = sorted[0].timeTick;
    const out = [];
    let placeholderId = -1, deleted = false;
    for (let l = first; l < k + MAX_FUTURE_TICKS; l++) {
      const exact = sorted.find(u => u.timeTick === l);
      if (exact) {
        out.push(exact);
        if (exact.state === 'Delete') deleted = true;
      } else {
        if (deleted) break;
        let carry;
        for (let d = first; d < l; d++) {
          const p = sorted.find(f => f.timeTick === d);
          if (p && ACTIVE_STATES.includes(p.state)) carry = p;
        }
        if (!carry) break;
        out.push({ ...carry, timeTick: l, id: placeholderId-- });
      }
    }
    return out;
  }

  // Real per-city electricity price ("powerPrice") comes from each hub's history,
  // NOT from a connection's flow record. Deriving price from flow (cost/quantity)
  // breaks whenever a city isn't transmitting that tick — quantity is 0, so the
  // price reads 0. powerPrice exists regardless of flow. The batch endpoint
  // returns every hub in a country for one tick, so cache per (country, tick).
  const hubPriceCache = new Map(); // `${countryId}_${tick}` -> Map(hubId -> powerPrice)
  async function getHubPriceMap(countryId, tick) {
    const key = `${countryId}_${tick}`;
    if (hubPriceCache.has(key)) return hubPriceCache.get(key);
    const resp = await fetch(`/api/v1/countries/${countryId}/hubs/histories/ticks/${tick}/`);
    if (!resp.ok) throw new Error(`histories HTTP ${resp.status}`);
    const data = await resp.json();
    const map = new Map();
    for (const h of (data.hubHistories || [])) map.set(h.hubId, h.powerPrice);
    hubPriceCache.set(key, map);
    return map;
  }

  async function checkConnection(conn) {
    const edgeId = conn.edge.id;
    const connId = conn.id;

    const resp = await fetch(`/api/v1/edges/${edgeId}/connections/${connId}/`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const acts = data.connectionActivitySet || [];
    const lastComputedTick = data.edge?.hub1?.lastComputedTick ?? 0;
    const k = lastComputedTick + 1; // next editable tick (game's e9())

    // The fix targets the activity scheduled at the next editable tick k —
    // either a real scheduled activity or a synthesized carry-forward (negative
    // id) — exactly what the game's edit form operates on.
    const normalized = normalizeActivities(acts, k);
    const fixActivity = normalized.find(a => a.timeTick === k) || null;

    const hub1 = conn.edge.hub1;
    const hub2 = conn.edge.hub2;
    const hub1Id = hub1?.id ?? conn.edge.hub1Id;
    const hub2Id = hub2?.id ?? conn.edge.hub2Id;

    // Direction from the currently scheduled capacity sign:
    // positive = hub1 → hub2, negative = hub2 → hub1.
    const cap = fixActivity?.capacity
      ?? acts.find(a => a.quantitySourced > 0 || a.quantityDelivered > 0)?.capacity
      ?? acts[0]?.capacity ?? 0;
    const srcHub = cap >= 0 ? hub1 : hub2;
    const dstHub = cap >= 0 ? hub2 : hub1;
    const srcHubId = cap >= 0 ? hub1Id : hub2Id;
    const dstHubId = cap >= 0 ? hub2Id : hub1Id;
    const src = srcHub?.name;
    const dst = dstHub?.name;

    // Read the real electricity price at each city at the last computed tick.
    let buyPrice = 0, sellPrice = 0, havePrices = false;
    try {
      const srcMap = await getHubPriceMap(srcHub.countryId, lastComputedTick);
      const dstMap = dstHub.countryId === srcHub.countryId
        ? srcMap
        : await getHubPriceMap(dstHub.countryId, lastComputedTick);
      const sp = srcMap.get(srcHubId);
      const dp = dstMap.get(dstHubId);
      if (sp != null && dp != null) {
        buyPrice = Math.round(sp);   // price paid at the source city
        sellPrice = Math.round(dp);  // price received at the destination city
        havePrices = true;
      }
    } catch (e) {
      console.warn('[ConnectionChecker] price lookup failed', e);
    }

    if (!havePrices) {
      return { src, dst, noData: true, edgeId, connId };
    }

    // Reversed = buying from a more expensive city than the one we sell into.
    const reversed = buyPrice > sellPrice;

    return { src, dst, buyPrice, sellPrice, reversed, edgeId, connId, fixActivity };
  }

  // ── Solar auto-upgrade ──────────────────────────────────────────────────────

  const SOLAR_KIND = 'SolarPowerPlant';
  const SOLAR_DONE_KEY = 'see_solar_upgrade_done_tick';

  function setSolar(status, msg) {
    const p = getPanel();
    if (!p) return;
    p.querySelector('#cc-solar').style.display = 'block';
    const colors = { ok: '#4caf50', busy: '#ff9800', error: '#f44336', warn: '#ff5252', skip: '#888' };
    p.querySelector('#cc-solar-dot').style.background = colors[status] || '#888';
    p.querySelector('#cc-solar-msg').textContent = msg;
  }

  // Night is fixed by time-of-day: tick % 6 ∈ {2,3,4}. Derived empirically from
  // 536 weather records across 9 countries — daylight is 100% day at tick%6 ∈
  // {0,1,5} and 100% night at {2,3,4}, identical for every country. Solar panels
  // produce nothing at night, so an upgrade started then loses no daytime output.
  function isNightTick(t) {
    const r = ((t % 6) + 6) % 6;
    return r >= 2 && r <= 4;
  }

  async function getLastComputedTick() {
    const resp = await fetch('/api/v1/app-data/');
    if (!resp.ok) throw new Error(`app-data HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.era?.lastComputedTick ?? null;
  }

  async function fetchSolarBuildings(playerId) {
    const resp = await fetch(`/api/v1/players/${playerId}/buildings/`);
    if (!resp.ok) throw new Error(`buildings HTTP ${resp.status}`);
    const data = await resp.json();
    return (data.buildings || []).filter(b => b.kind === SOLAR_KIND);
  }

  async function fetchBuildingActivities(playerId, buildingId) {
    const resp = await fetch(`/api/v1/players/${playerId}/buildings/${buildingId}/`);
    if (!resp.ok) throw new Error(`building HTTP ${resp.status}`);
    const data = await resp.json();
    return data.buildingActivitySet || [];
  }

  async function upgradeBuilding(playerId, buildingId, activity) {
    // Building activity PUT payload mirrors the game's edit form exactly (minus
    // the connection-only `capacity`): { id, purchasePrice, state, timeTick,
    // firstInChain, isBoosted }. state="Upgrade" schedules a one-level upgrade.
    const payload = {
      id:            activity.id,
      purchasePrice: activity.purchasePrice,
      state:         'Upgrade',
      timeTick:      activity.timeTick,
      firstInChain:  activity.firstInChain,
      isBoosted:     activity.isBoosted,
    };
    const url = `/api/v1/players/${playerId}/buildings/${buildingId}/activities/`;
    const resp = await fetch(url, {
      method: 'PUT',
      headers: gameHeaders(url, { 'Content-Type': 'application/json' }),
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  // Runs once per page load. If the next tick is night, schedule an upgrade on
  // every solar plant. Server validates affordability / max-level and rejects
  // ones that can't upgrade (reported as failures — no client-side cost math).
  async function autoUpgradeSolarIfNight() {
    try {
      const lastComputedTick = await getLastComputedTick();
      if (lastComputedTick == null) { setSolar('error', 'Could not read game tick.'); return; }
      const k = lastComputedTick + 1;

      if (!isNightTick(k)) {
        setSolar('skip', `☀ Next tick T${k} is daytime — solar upgrade skipped.`);
        return;
      }
      // Avoid re-scheduling (and re-spamming the API) on repeated reloads
      // during the same night tick.
      if (localStorage.getItem(SOLAR_DONE_KEY) === String(k)) {
        setSolar('ok', `☀ Solar already scheduled to upgrade at night T${k}.`);
        return;
      }

      const playerId = await getPlayerId();
      const solar = await fetchSolarBuildings(playerId);
      if (solar.length === 0) { setSolar('skip', 'No solar power plants found.'); return; }

      setSolar('busy', `☀ Night T${k}: upgrading ${solar.length} solar plant(s)...`);
      let ok = 0, fail = 0;
      const errs = [];
      for (const b of solar) {
        try {
          const acts = await fetchBuildingActivities(playerId, b.id);
          const norm = normalizeActivities(acts, k);
          const act = norm.find(a => a.timeTick === k);
          if (!act) { fail++; errs.push(`#${b.id}: no editable activity at T${k}`); continue; }
          await upgradeBuilding(playerId, b.id, act);
          ok++;
        } catch (e) {
          fail++;
          errs.push(`#${b.id}: ${e.message}`);
        }
      }
      if (ok > 0) localStorage.setItem(SOLAR_DONE_KEY, String(k));
      if (fail === 0) {
        setSolar('ok', `☀ Upgraded all ${ok} solar plant(s) at night T${k}.`);
      } else {
        setSolar('warn', `☀ Solar: ${ok} upgraded, ${fail} failed (see console).`);
        console.warn('[SolarUpgrader] failures:', errs);
      }
      getPanel().classList.add('cc-open');
    } catch (e) {
      setSolar('error', 'Solar upgrade failed: ' + e.message);
      console.error('[SolarUpgrader]', e);
    }
  }

  // ── Auto-run after login ───────────────────────────────────────────────────

  async function autoRun() {
    await new Promise(r => setTimeout(r, 4000));
    setStatus('busy', 'Auto-checking...');
    await runCheck();
    // Auto-upgrade runs ONLY here (page load), never on manual "Check Now",
    // so re-checking connections never spends money unexpectedly.
    await autoUpgradeSolarIfNight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRun);
  } else {
    autoRun();
  }

  console.log('%c[ConnectionChecker] Active. Panel bottom-right (⚡).', 'color: #ff9800; font-weight: bold');
})();
