// ==UserScript==
// @name         SimEnergyEmpire Toolkit
// @namespace    https://www.simenergyempire.com/
// @version      2.0
// @description  Weather logger + connection/solar automation for Sim Energy Empire
// @author       LDDL
// @match        https://www.simenergyempire.com/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
  // src/see_toolkit/core/store.js
  function makeStore(backend = localStorage, prefix = "see") {
    const k = (key) => `${prefix}:${key}`;
    function get(key, fallback = null) {
      try {
        const raw = backend.getItem(k(key));
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    }
    function set(key, val) {
      backend.setItem(k(key), JSON.stringify(val));
    }
    function appendCapped(key, item, cap) {
      const arr = get(key, []);
      arr.push(item);
      if (arr.length > cap) arr.splice(0, arr.length - cap);
      set(key, arr);
    }
    function sizeKB() {
      let total = 0;
      for (const key in backend) if (key.startsWith(prefix + ":")) total += (backend.getItem(key) || "").length;
      return +(total / 1024).toFixed(1);
    }
    return { get, set, appendCapped, sizeKB };
  }

  // src/see_toolkit/core/cache.js
  function makeTickCache() {
    let tick = null;
    let entries = /* @__PURE__ */ new Map();
    function setTick(t) {
      if (t !== tick) {
        tick = t;
        entries = /* @__PURE__ */ new Map();
      }
    }
    function get(key, fetcher) {
      if (!entries.has(key)) entries.set(key, Promise.resolve().then(fetcher));
      return entries.get(key);
    }
    return { get, setTick };
  }

  // src/see_toolkit/core/game.js
  function makeGame({ fetchJSON: fetchJSON2, cache }) {
    let cachedPlayerId = null;
    async function getPlayerId() {
      if (cachedPlayerId != null) return cachedPlayerId;
      const me = await fetchJSON2("/api/v1/players/me/");
      if (me?.id == null) throw new Error("players/me returned no id");
      cachedPlayerId = me.id;
      return cachedPlayerId;
    }
    async function getTick() {
      const data = await fetchJSON2("/api/v1/app-data/");
      const last = data?.era?.lastComputedTick;
      if (last == null) throw new Error("no lastComputedTick");
      cache.setTick(last);
      return last;
    }
    async function loadState() {
      const lastComputedTick = await getTick();
      const playerId = await getPlayerId();
      const buildings = await cache.get("buildings", async () => (await fetchJSON2(`/api/v1/players/${playerId}/buildings/`)).buildings || []);
      const connections = await cache.get("connections", async () => (await fetchJSON2(`/api/v1/players/${playerId}/connections/`)).connections || []);
      return { lastComputedTick, k: lastComputedTick + 1, playerId, buildings, connections };
    }
    return { getPlayerId, getTick, loadState };
  }

  // src/see_toolkit/core/api.js
  var md5hex = /* @__PURE__ */ function() {
    const add = (e, t) => {
      const r = (e & 65535) + (t & 65535);
      return (e >> 16) + (t >> 16) + (r >> 16) << 16 | r & 65535;
    };
    const rol = (e, t) => e << t | e >>> 32 - t;
    const cmn = (q, a, b, x, s, t) => add(rol(add(add(a, q), add(x, t)), s), b);
    const ff = (a, b, c, d, x, s, t) => cmn(b & c | ~b & d, a, b, x, s, t);
    const gg = (a, b, c, d, x, s, t) => cmn(b & d | c & ~d, a, b, x, s, t);
    const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
    const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);
    const core = (e, t) => {
      e[t >> 5] |= 128 << t % 32;
      e[(t + 64 >>> 9 << 4) + 14] = t;
      let r = 1732584193, n = -271733879, i = -1732584194, o = 271733878;
      for (let a = 0; a < e.length; a += 16) {
        const s = r, l = n, c = i, u = o;
        r = ff(r, n, i, o, e[a + 0], 7, -680876936);
        o = ff(o, r, n, i, e[a + 1], 12, -389564586);
        i = ff(i, o, r, n, e[a + 2], 17, 606105819);
        n = ff(n, i, o, r, e[a + 3], 22, -1044525330);
        r = ff(r, n, i, o, e[a + 4], 7, -176418897);
        o = ff(o, r, n, i, e[a + 5], 12, 1200080426);
        i = ff(i, o, r, n, e[a + 6], 17, -1473231341);
        n = ff(n, i, o, r, e[a + 7], 22, -45705983);
        r = ff(r, n, i, o, e[a + 8], 7, 1770035416);
        o = ff(o, r, n, i, e[a + 9], 12, -1958414417);
        i = ff(i, o, r, n, e[a + 10], 17, -42063);
        n = ff(n, i, o, r, e[a + 11], 22, -1990404162);
        r = ff(r, n, i, o, e[a + 12], 7, 1804603682);
        o = ff(o, r, n, i, e[a + 13], 12, -40341101);
        i = ff(i, o, r, n, e[a + 14], 17, -1502002290);
        n = ff(n, i, o, r, e[a + 15], 22, 1236535329);
        r = gg(r, n, i, o, e[a + 1], 5, -165796510);
        o = gg(o, r, n, i, e[a + 6], 9, -1069501632);
        i = gg(i, o, r, n, e[a + 11], 14, 643717713);
        n = gg(n, i, o, r, e[a + 0], 20, -373897302);
        r = gg(r, n, i, o, e[a + 5], 5, -701558691);
        o = gg(o, r, n, i, e[a + 10], 9, 38016083);
        i = gg(i, o, r, n, e[a + 15], 14, -660478335);
        n = gg(n, i, o, r, e[a + 4], 20, -405537848);
        r = gg(r, n, i, o, e[a + 9], 5, 568446438);
        o = gg(o, r, n, i, e[a + 14], 9, -1019803690);
        i = gg(i, o, r, n, e[a + 3], 14, -187363961);
        n = gg(n, i, o, r, e[a + 8], 20, 1163531501);
        r = gg(r, n, i, o, e[a + 13], 5, -1444681467);
        o = gg(o, r, n, i, e[a + 2], 9, -51403784);
        i = gg(i, o, r, n, e[a + 7], 14, 1735328473);
        n = gg(n, i, o, r, e[a + 12], 20, -1926607734);
        r = hh(r, n, i, o, e[a + 5], 4, -378558);
        o = hh(o, r, n, i, e[a + 8], 11, -2022574463);
        i = hh(i, o, r, n, e[a + 11], 16, 1839030562);
        n = hh(n, i, o, r, e[a + 14], 23, -35309556);
        r = hh(r, n, i, o, e[a + 1], 4, -1530992060);
        o = hh(o, r, n, i, e[a + 4], 11, 1272893353);
        i = hh(i, o, r, n, e[a + 7], 16, -155497632);
        n = hh(n, i, o, r, e[a + 10], 23, -1094730640);
        r = hh(r, n, i, o, e[a + 13], 4, 681279174);
        o = hh(o, r, n, i, e[a + 0], 11, -358537222);
        i = hh(i, o, r, n, e[a + 3], 16, -722521979);
        n = hh(n, i, o, r, e[a + 6], 23, 76029189);
        r = hh(r, n, i, o, e[a + 9], 4, -640364487);
        o = hh(o, r, n, i, e[a + 12], 11, -421815835);
        i = hh(i, o, r, n, e[a + 15], 16, 530742520);
        n = hh(n, i, o, r, e[a + 2], 23, -995338651);
        r = ii(r, n, i, o, e[a + 0], 6, -198630844);
        o = ii(o, r, n, i, e[a + 7], 10, 1126891415);
        i = ii(i, o, r, n, e[a + 14], 15, -1416354905);
        n = ii(n, i, o, r, e[a + 5], 21, -57434055);
        r = ii(r, n, i, o, e[a + 12], 6, 1700485571);
        o = ii(o, r, n, i, e[a + 3], 10, -1894986606);
        i = ii(i, o, r, n, e[a + 10], 15, -1051523);
        n = ii(n, i, o, r, e[a + 1], 21, -2054922799);
        r = ii(r, n, i, o, e[a + 8], 6, 1873313359);
        o = ii(o, r, n, i, e[a + 15], 10, -30611744);
        i = ii(i, o, r, n, e[a + 6], 15, -1560198380);
        n = ii(n, i, o, r, e[a + 13], 21, 1309151649);
        r = ii(r, n, i, o, e[a + 4], 6, -145523070);
        o = ii(o, r, n, i, e[a + 11], 10, -1120210379);
        i = ii(i, o, r, n, e[a + 2], 15, 718787259);
        n = ii(n, i, o, r, e[a + 9], 21, -343485551);
        r = add(r, s);
        n = add(n, l);
        i = add(i, c);
        o = add(o, u);
      }
      return [r, n, i, o];
    };
    const bin2str = (e) => {
      let t = "";
      for (let r = 0; r < e.length * 32; r += 8) t += String.fromCharCode(e[r >> 5] >>> r % 32 & 255);
      return t;
    };
    const str2bin = (e) => {
      const t = Array(e.length >> 2);
      for (let r = 0; r < t.length; r++) t[r] = 0;
      for (let r = 0; r < e.length * 8; r += 8) t[r >> 5] |= (e.charCodeAt(r / 8) & 255) << r % 32;
      return t;
    };
    const utf8 = (e) => {
      let t = "", r = -1, n, i;
      while (++r < e.length) {
        n = e.charCodeAt(r);
        i = r + 1 < e.length ? e.charCodeAt(r + 1) : 0;
        if (55296 <= n && n <= 56319 && 56320 <= i && i <= 57343) {
          n = 65536 + ((n & 1023) << 10) + (i & 1023);
          r++;
        }
        if (n <= 127) t += String.fromCharCode(n);
        else if (n <= 2047) t += String.fromCharCode(192 | n >>> 6 & 31, 128 | n & 63);
        else if (n <= 65535) t += String.fromCharCode(224 | n >>> 12 & 15, 128 | n >>> 6 & 63, 128 | n & 63);
        else if (n <= 2097151) t += String.fromCharCode(240 | n >>> 18 & 7, 128 | n >>> 12 & 63, 128 | n >>> 6 & 63, 128 | n & 63);
      }
      return t;
    };
    const toHex = (e) => {
      const t = "0123456789abcdef";
      let r = "";
      for (let i = 0; i < e.length; i++) {
        const n = e.charCodeAt(i);
        r += t.charAt(n >>> 4 & 15) + t.charAt(n & 15);
      }
      return r;
    };
    return (input) => {
      const s = utf8(input);
      return toHex(bin2str(core(str2bin(s), s.length * 8)));
    };
  }();
  function getCookie(name, cookieStr = typeof document !== "undefined" ? document.cookie : "") {
    const m = cookieStr.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : null;
  }
  function gameHeaders(url, { now = Date.now(), csrf = getCookie("csrftoken"), tzOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset(), extra = {} } = {}) {
    const headers = {
      "X-tz-offset": String(tzOffset),
      "X-Ts": String(now),
      "X-Prot": md5hex(url + now),
      ...extra
    };
    if (csrf) headers["X-CSRFToken"] = csrf;
    return headers;
  }
  async function fetchJSON(url, opts = {}, fetchImpl = fetch) {
    const resp = await fetchImpl(url, opts);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
    return resp.json();
  }

  // src/see_toolkit/core/scheduler.js
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function runModules({ modules, state, dryRun = false, delay = 500, onModule, onWrite }) {
    const planned = [];
    const executed = [];
    const views = {};
    for (const mod of modules) {
      let result;
      try {
        result = await mod.plan(state);
      } catch (e) {
        console.error(`[${mod.id}] plan failed`, e);
        if (onModule) try {
          onModule(mod, null, e);
        } catch {
        }
        continue;
      }
      views[mod.id] = result.view;
      const list = result.writes || [];
      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        planned.push(w.label);
        if (dryRun) continue;
        if (onWrite) try {
          onWrite(mod, w.label, i + 1, list.length);
        } catch {
        }
        try {
          await w.send();
          executed.push(w.label);
        } catch (e) {
          console.error(`[${mod.id}] write "${w.label}" failed`, e);
        }
        if (delay) await sleep(delay);
      }
      if (onModule) try {
        onModule(mod, result.view, null);
      } catch {
      }
    }
    return { planned, executed, views };
  }

  // src/see_toolkit/core/panel.js
  function mountPanel() {
    const host = document.createElement("div");
    host.id = "see-panel";
    host.style.cssText = "position:fixed;bottom:10px;left:10px;z-index:99999;font:12px monospace;background:rgba(20,20,30,0.92);color:#ccc;border:1px solid #444;border-radius:6px;padding:8px 12px;max-width:420px;";
    document.body.appendChild(host);
    const sections = /* @__PURE__ */ new Map();
    function section(id, title) {
      if (sections.has(id)) return sections.get(id);
      const el = document.createElement("div");
      el.innerHTML = `<div style="color:#ff9800;font-weight:bold;margin:6px 0 2px">${title}</div><div class="see-body"></div>`;
      host.appendChild(el);
      const body = el.querySelector(".see-body");
      sections.set(id, body);
      return body;
    }
    return { section };
  }

  // src/see_toolkit/modules/weather.js
  var WEATHER_RE = /\/api\/v1\/weather\/countries\/(\d+)\/ticks\/(\d+)\//;
  function weatherModule(store) {
    function install(originalFetch) {
      return async function(...args) {
        const resp = await originalFetch.apply(this, args);
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        const m = url.match(WEATHER_RE);
        if (m) resp.clone().json().then((d) => {
          if (d?.weatherRecords?.length) store.appendCapped("weather", { countryId: m[1], at: Date.now(), records: d.weatherRecords }, 200);
        }).catch(() => {
        });
        return resp;
      };
    }
    return {
      id: "weather",
      title: "Weather Logger",
      install,
      plan: () => ({ writes: [], view: { count: (store.get("weather", []) || []).length } }),
      render(view, el) {
        if (el) el.textContent = `Captured batches: ${view.count}`;
      }
    };
  }

  // src/see_toolkit/core/time.js
  var MAX_FUTURE_TICKS = 12;
  var phase = (t) => (t % 6 + 6) % 6;
  function nextTickWithPhase(k, p) {
    let t = k;
    while (phase(t) !== p) t++;
    return t;
  }

  // src/see_toolkit/modules/activities.js
  var ACTIVE_STATES = ["Production", "Sleep"];
  function normalizeActivities(acts, k) {
    const sorted = [...acts].sort((a, b) => a.timeTick - b.timeTick);
    if (sorted.length === 0) return [];
    const first = sorted[0].timeTick;
    const out = [];
    let placeholderId = -1, deleted = false;
    for (let l = first; l < k + MAX_FUTURE_TICKS; l++) {
      const exact = sorted.find((u) => u.timeTick === l);
      if (exact) {
        out.push(exact);
        if (exact.state === "Delete") deleted = true;
      } else {
        if (deleted) break;
        let carry;
        for (let d = first; d < l; d++) {
          const p = sorted.find((f) => f.timeTick === d);
          if (p && ACTIVE_STATES.includes(p.state)) carry = p;
        }
        if (!carry) break;
        out.push({ ...carry, timeTick: l, id: placeholderId-- });
      }
    }
    return out;
  }
  function connectionActivityPayload(activity, { capacity, purchasePrice, state } = {}) {
    return {
      id: activity.id,
      state: state ?? activity.state,
      timeTick: activity.timeTick,
      capacity: capacity ?? activity.capacity,
      purchasePrice: purchasePrice ?? activity.purchasePrice,
      isBoosted: activity.isBoosted,
      firstInChain: activity.firstInChain
    };
  }
  function stateAt(normalized, tick) {
    const a = normalized.find((x) => x.timeTick === tick);
    return a ? a.state : void 0;
  }
  function buildingActivityPayload(activity, newState) {
    return {
      id: activity.id,
      purchasePrice: activity.purchasePrice,
      state: newState,
      timeTick: activity.timeTick,
      firstInChain: activity.firstInChain,
      isBoosted: activity.isBoosted
    };
  }

  // src/see_toolkit/modules/solarUpgrade.js
  function planSolarUpgrades({ solarPlants, k, activityAt }) {
    const target = nextTickWithPhase(k, 2);
    const out = [];
    for (const b of solarPlants) {
      if (activityAt(b.id, target) === "Upgrade") continue;
      out.push({ buildingId: b.id, tick: target });
    }
    return out;
  }
  function solarUpgradeModule({ fetchJSON: fetchJSON2, fetchImpl = fetch, cache }) {
    async function activitiesFor(playerId, buildingId, k) {
      const raw = await cache.get(`bact:${buildingId}`, async () => (await fetchJSON2(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || []);
      return normalizeActivities(raw, k);
    }
    return {
      id: "solar",
      title: "Solar Night Upgrade",
      async plan(state) {
        const solar = (state.buildings || []).filter((b) => b.kind === "SolarPowerPlant");
        const norm = {};
        await Promise.all(solar.map(async (b) => {
          norm[b.id] = await activitiesFor(state.playerId, b.id, state.k);
        }));
        const activityAt = (id, tick) => stateAt(norm[id] || [], tick);
        const decisions = planSolarUpgrades({ solarPlants: solar, k: state.k, activityAt });
        const writes = decisions.map((d) => ({
          label: `solar#${d.buildingId}\u2192Upgrade@T${d.tick}`,
          send: async () => {
            const act = (norm[d.buildingId] || []).find((a) => a.timeTick === d.tick);
            if (!act) throw new Error(`no editable activity at T${d.tick}`);
            const url = `/api/v1/players/${state.playerId}/buildings/${d.buildingId}/activities/`;
            const resp = await fetchImpl(url, {
              method: "PUT",
              credentials: "same-origin",
              headers: gameHeaders(url, { extra: { "Content-Type": "application/json" } }),
              body: JSON.stringify(buildingActivityPayload(act, "Upgrade"))
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
          }
        }));
        return { writes, view: { scheduled: decisions.length, target: nextTickWithPhase(state.k, 2) } };
      },
      render(view, el) {
        if (el) el.textContent = `Solar: ${view.scheduled} scheduled for night T${view.target}`;
      }
    };
  }

  // src/see_toolkit/modules/maintenance.js
  var MAINT_THRESHOLD = 50;
  function planMaintenance({ buildings, k, threshold = MAINT_THRESHOLD, startPhaseOf, hasUpgrade }) {
    const out = [];
    for (const b of buildings) {
      if (b.condition == null || b.condition >= threshold) continue;
      if (b.kind === "SolarPowerPlant" && hasUpgrade(b.id)) continue;
      const tick = nextTickWithPhase(k, startPhaseOf(b));
      out.push({ buildingId: b.id, tick });
    }
    return out;
  }
  function startPhaseFor(building, lowestOutputPhase) {
    if (building.kind === "SolarPowerPlant") return 2;
    const p = lowestOutputPhase && lowestOutputPhase[building.id];
    return p == null ? 2 : p;
  }
  function maintenanceModule({ fetchJSON: fetchJSON2, fetchImpl = fetch, cache, upgradeTargets = () => /* @__PURE__ */ new Set(), lowestOutputPhase = () => ({}) }) {
    async function activitiesFor(playerId, buildingId, k) {
      const raw = await cache.get(`bact:${buildingId}`, async () => (await fetchJSON2(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || []);
      return normalizeActivities(raw, k);
    }
    return {
      id: "maintenance",
      title: "Maintenance Backstop",
      async plan(state) {
        const upgrades = upgradeTargets(state);
        const phases = lowestOutputPhase(state);
        const decisions = planMaintenance({
          buildings: state.buildings || [],
          k: state.k,
          startPhaseOf: (b) => startPhaseFor(b, phases),
          hasUpgrade: (id) => upgrades.has(id)
        });
        const norm = {};
        await Promise.all(decisions.map(async (d) => {
          norm[d.buildingId] = await activitiesFor(state.playerId, d.buildingId, state.k);
        }));
        const writes = decisions.filter((d) => stateAt(norm[d.buildingId] || [], d.tick) !== "Maintenance").map((d) => ({
          label: `maint#${d.buildingId}\u2192Maintenance@T${d.tick}`,
          send: async () => {
            const act = (norm[d.buildingId] || []).find((a) => a.timeTick === d.tick);
            if (!act) throw new Error(`no editable activity at T${d.tick}`);
            const url = `/api/v1/players/${state.playerId}/buildings/${d.buildingId}/activities/`;
            const resp = await fetchImpl(url, {
              method: "PUT",
              credentials: "same-origin",
              headers: gameHeaders(url, { extra: { "Content-Type": "application/json" } }),
              body: JSON.stringify(buildingActivityPayload(act, "Maintenance"))
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
          }
        }));
        return { writes, view: { candidates: decisions.length } };
      },
      render(view, el) {
        if (el) el.textContent = `Maintenance: ${view.candidates} building(s) below condition ${MAINT_THRESHOLD}`;
      }
    };
  }

  // src/see_toolkit/modules/moneyPickup.js
  function distinctPickupHubs(transactions) {
    const set = /* @__PURE__ */ new Set();
    for (const t of transactions || []) if (t.hubId != null && t.pickedUp !== true) set.add(t.hubId);
    return [...set];
  }
  function moneyPickupModule({ fetchJSON: fetchJSON2, fetchImpl = fetch }) {
    return {
      id: "money",
      title: "Auto Money Pickup",
      async plan(state) {
        const data = await fetchJSON2(`/api/v1/players/${state.playerId}/money-transactions/for-pick-up/`);
        const hubs = distinctPickupHubs(data.moneyTransactions || []);
        const total = (data.moneyTransactions || []).reduce((s, t) => s + (t.money || 0), 0);
        const writes = hubs.map((hubId) => ({
          label: `pickup hub ${hubId}`,
          send: async () => {
            const url = `/api/v1/players/${state.playerId}/money-transactions/`;
            const resp = await fetchImpl(url, {
              method: "PATCH",
              credentials: "same-origin",
              headers: gameHeaders(url, { extra: { "Content-Type": "application/json" } }),
              body: JSON.stringify({ pickUpHubId: hubId })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
          }
        }));
        return { writes, view: { hubs: hubs.length, total } };
      },
      render(view, el) {
        if (!el) return;
        el.textContent = view.hubs === 0 ? "Money: nothing to collect" : `Money: collected $${view.total.toLocaleString()} from ${view.hubs} hub(s) \u2014 game UI updates on next page switch`;
      }
    };
  }

  // src/see_toolkit/core/stats.js
  function median(nums) {
    if (!nums.length) return null;
    const s = [...nums].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function quantile(nums, q) {
    if (!nums.length) return null;
    const s = [...nums].sort((a, b) => a - b);
    const pos = (s.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }
  var lowerQuartile = (nums) => quantile(nums, 0.25);
  var recentN = (arr, n) => arr.slice(Math.max(0, arr.length - n));

  // src/see_toolkit/modules/connections/priceStore.js
  function recordPrice(prices, hubId, tick, price, cap = 200) {
    const arr = prices[hubId] || [];
    if (!arr.some((x) => x.t === tick)) arr.push({ t: tick, price });
    arr.sort((a, b) => a.t - b.t);
    if (arr.length > cap) arr.splice(0, arr.length - cap);
    prices[hubId] = arr;
    return prices;
  }
  function spreadSamples(prices, srcHub, dstHub, ph, phaseOf) {
    const src = prices[srcHub] || [];
    const dstMap = new Map((prices[dstHub] || []).map((x) => [x.t, x.price]));
    const out = [];
    for (const { t, price } of src) {
      if (phaseOf(t) !== ph) continue;
      const d = dstMap.get(t + 1);
      if (d != null) out.push(d - price);
    }
    return out;
  }
  function hubPriceSamples(prices, hubId, ph, phaseOf) {
    return (prices[hubId] || []).filter((x) => phaseOf(x.t) === ph).map((x) => x.price);
  }

  // src/see_toolkit/modules/connections/forecast.js
  function forecast(samples, n = 24) {
    const s = recentN(samples || [], n);
    return { median: median(s), lowerQuartile: lowerQuartile(s), n: s.length };
  }

  // src/see_toolkit/modules/connections/direction.js
  function decideDirection({ current, forward, reverse, threshold = 0, minSamples = 6 }) {
    if ((forward.n || 0) < minSamples || (reverse.n || 0) < minSamples) return current;
    const fm = forward.median ?? -Infinity, rm = reverse.median ?? -Infinity;
    const best = fm >= rm ? "forward" : "reverse";
    if (best === current) return current;
    const bestStat = best === "forward" ? forward : reverse;
    const curStat = current === "forward" ? forward : reverse;
    if (bestStat.median > 0 && bestStat.lowerQuartile > 0 && bestStat.median - (curStat.median ?? 0) > threshold) return best;
    return current;
  }
  function bumpStreak(prev, desired, current) {
    if (desired === current) return { dir: current, streak: 0 };
    if (prev && prev.dir === desired) return { dir: desired, streak: prev.streak + 1 };
    return { dir: desired, streak: 1 };
  }
  var shouldFlip = (streak, needed = 2) => streak >= needed;

  // src/see_toolkit/modules/connections/stopLoss.js
  function purchaseCap({ forecastDstNext, perUnitCost = 0, buffer = 0 }) {
    if (forecastDstNext == null) return null;
    return Math.max(0, Math.round(forecastDstNext - perUnitCost - buffer));
  }

  // src/see_toolkit/modules/connections/evaluate.js
  var DECOMMISSION_GRADIENT = 20;
  function scoreConnection({ realizedPerTick = 0, gradientAmplitude = 0, undersupplyRate = 0 }) {
    const score = Math.round(realizedPerTick + gradientAmplitude * 10 - undersupplyRate * 500);
    const decommission = gradientAmplitude < DECOMMISSION_GRADIENT || undersupplyRate > 0.6 && realizedPerTick <= 0;
    return { score, decommission };
  }

  // src/see_toolkit/modules/connections/index.js
  var AUTO_KEY = "connAuto";
  var FLIP_THRESHOLD = 30;
  var HYSTERESIS = 2;
  var COST_FALLBACK = 5;
  var CAP_BUFFER = 15;
  function evaluateConnection({ prices, edge, capacity, k, phaseOf = phase }) {
    const fwdSamples = spreadSamples(prices, edge.hub1Id, edge.hub2Id, phaseOf(k), phaseOf);
    const revSamples = spreadSamples(prices, edge.hub2Id, edge.hub1Id, phaseOf(k), phaseOf);
    const forward = forecast(fwdSamples);
    const reverse = forecast(revSamples);
    const current = capacity >= 0 ? "forward" : "reverse";
    const desired = decideDirection({ current, forward, reverse, threshold: FLIP_THRESHOLD });
    const gradientAmplitude = Math.max(0, forward.median ?? 0, reverse.median ?? 0);
    return { forward, reverse, current, desired, gradientAmplitude };
  }
  function connectionsModule({ fetchJSON: fetchJSON2, fetchImpl = fetch, store, cache }) {
    async function connDetail(edgeId, connId) {
      return cache.get(`conn:${edgeId}:${connId}`, () => fetchJSON2(`/api/v1/edges/${edgeId}/connections/${connId}/`));
    }
    async function hubHistory(hubId) {
      return cache.get(`hubhist:${hubId}`, async () => (await fetchJSON2(`/api/v1/hubs/${hubId}/history/`)).hubHistory || []);
    }
    return {
      id: "connections",
      title: "Connection Manager",
      async plan(state) {
        const auto = store.get(AUTO_KEY, "0") === "1";
        const power = (state.connections || []).filter((c) => c.kind === "Power");
        const prices = store.get("prices", {});
        const streaks = store.get("connStreak", {});
        const writes = [];
        let flagged = 0, flips = 0;
        const fetched = await Promise.all(power.map(async (c) => {
          const edgeId = c.edge?.id ?? c.edgeId;
          try {
            const detail = await connDetail(edgeId, c.id);
            const edge = { hub1Id: detail.edge?.hub1Id ?? detail.edge?.hub1?.id, hub2Id: detail.edge?.hub2Id ?? detail.edge?.hub2?.id };
            const histories = await Promise.all([hubHistory(edge.hub1Id), hubHistory(edge.hub2Id)]);
            return { c, edgeId, detail, edge, histories };
          } catch (e) {
            console.warn(`[connections] #${c.id} read failed:`, e.message);
            return null;
          }
        }));
        for (const item of fetched) {
          if (!item) continue;
          const { c, edgeId, detail, edge, histories } = item;
          try {
            for (let i = 0; i < 2; i++) {
              const hid = i === 0 ? edge.hub1Id : edge.hub2Id;
              for (const h of histories[i]) if (h.powerPrice != null) recordPrice(prices, hid, h.timeTick, h.powerPrice);
            }
            const acts = normalizeActivities(detail.connectionActivitySet || [], state.k);
            const act = acts.find((a) => a.timeTick === state.k);
            if (!act) continue;
            const ev = evaluateConnection({ prices, edge, capacity: act.capacity, k: state.k });
            const score = scoreConnection({ gradientAmplitude: ev.gradientAmplitude });
            if (score.decommission) flagged++;
            const st = bumpStreak(streaks[c.id], ev.desired, ev.current);
            streaks[c.id] = st;
            const willFlip = ev.desired !== ev.current && shouldFlip(st.streak, HYSTERESIS);
            if (willFlip) flips++;
            if (auto) {
              const newSign = ev.desired === "forward" ? 1 : -1;
              const capacity = Math.abs(act.capacity) * newSign;
              const dstHub = newSign >= 0 ? edge.hub2Id : edge.hub1Id;
              const dstForecast = median(hubPriceSamples(prices, dstHub, phase(state.k + 1), phase));
              const cap = purchaseCap({ forecastDstNext: dstForecast, perUnitCost: COST_FALLBACK, buffer: CAP_BUFFER });
              const needFlip = willFlip;
              const needCap = cap != null && cap !== act.purchasePrice;
              if (needFlip || needCap) {
                const payload = connectionActivityPayload(act, {
                  capacity: needFlip ? capacity : act.capacity,
                  purchasePrice: needCap ? cap : act.purchasePrice
                });
                writes.push({
                  label: `conn#${c.id} ${needFlip ? "flip\u2192" + ev.desired + " " : ""}${needCap ? "cap=" + cap : ""}`.trim(),
                  send: async () => {
                    const url = `/api/v1/edges/${edgeId}/connections/${c.id}/activities/`;
                    const resp = await fetchImpl(url, {
                      method: "PUT",
                      credentials: "same-origin",
                      headers: gameHeaders(url, { extra: { "Content-Type": "application/json" } }),
                      body: JSON.stringify(payload)
                    });
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
                  }
                });
              }
            }
          } catch (e) {
            console.warn(`[connections] #${c.id} skipped:`, e.message);
          }
        }
        store.set("prices", prices);
        store.set("connStreak", streaks);
        return { writes, view: { total: power.length, flagged, flips, auto } };
      },
      render(view, el) {
        if (!el) return;
        el.textContent = `Connections: ${view.total} \xB7 ${view.flagged} decommission candidate(s)` + (view.auto ? ` \xB7 ${view.flips} flip(s) pending` : " \xB7 auto OFF (evaluation only)");
      }
    };
  }

  // src/see_toolkit/main.js
  (function() {
    "use strict";
    const store = makeStore();
    const cache = makeTickCache();
    const originalFetch = window.fetch.bind(window);
    const fetchJSON2 = (url, opts) => fetchJSON(url, opts, originalFetch);
    const game = makeGame({ fetchJSON: fetchJSON2, cache });
    const weather = weatherModule(store);
    window.fetch = weather.install(window.fetch);
    const solar = solarUpgradeModule({ fetchJSON: fetchJSON2, cache });
    const maintenance = maintenanceModule({
      fetchJSON: fetchJSON2,
      cache,
      upgradeTargets: (state) => new Set((state.buildings || []).filter((b) => b.kind === "SolarPowerPlant").map((b) => b.id))
    });
    const money = moneyPickupModule({ fetchJSON: fetchJSON2 });
    const connections = connectionsModule({ fetchJSON: fetchJSON2, store, cache });
    const modules = [solar, maintenance, money, connections, weather];
    const RUN_INTERVAL_MS = 60 * 60 * 1e3;
    let running = false;
    async function runOnce(panel) {
      if (running) return;
      running = true;
      const status = panel.section("status", "SEE Toolkit");
      try {
        const dryRun = store.get("dryRun", "0") === "1";
        status.textContent = "Checking tick\u2026";
        const tick = await game.getTick();
        const lastRunTick = store.get("lastRunTick", null);
        const force = store.get("forceRun", "0") === "1";
        if (!force && tick === lastRunTick) {
          status.textContent = `Tick ${tick} \xB7 up to date \u2014 no new tick, skipped (set see:forceRun=1 to run anyway)`;
          return;
        }
        if (force) store.set("forceRun", "0");
        status.textContent = "Loading game state\u2026";
        for (const mod of modules) {
          const el = panel.section(mod.id, mod.title);
          if (!el.textContent) el.textContent = "\u2026";
        }
        const state = await game.loadState();
        let done = 0;
        status.textContent = `Tick ${state.lastComputedTick}${dryRun ? " \xB7 DRY-RUN" : ""} \xB7 running 0/${modules.length}\u2026`;
        const res = await runModules({
          modules,
          state,
          dryRun,
          delay: 400 + Math.random() * 400,
          // Render each module the moment it finishes, instead of after the whole run.
          onModule(mod, view, err) {
            done++;
            status.textContent = `Tick ${state.lastComputedTick}${dryRun ? " \xB7 DRY-RUN" : ""} \xB7 running ${done}/${modules.length}\u2026`;
            const el = panel.section(mod.id, mod.title);
            if (err) {
              el.textContent = "Error \u2014 see console.";
              return;
            }
            try {
              mod.render && mod.render(view, el);
            } catch {
            }
          },
          // Live feedback during long serial write sequences (e.g. money pickup).
          onWrite(mod, label, i, total) {
            panel.section(mod.id, mod.title).textContent = `${mod.title}: ${i}/${total} \u2014 ${label}`;
          }
        });
        store.set("lastRunTick", state.lastComputedTick);
        status.textContent = `Tick ${state.lastComputedTick}${dryRun ? " \xB7 DRY-RUN" : ""} \xB7 ${res.executed.length} write(s) \xB7 ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`;
        console.log(`[see-toolkit] tick ${state.lastComputedTick}: ${dryRun ? "DRY-RUN " : ""}${res.executed.length} write(s)`, res.planned);
      } catch (e) {
        status.textContent = "Run failed \u2014 see console.";
        console.error("[see-toolkit] run failed", e);
      } finally {
        running = false;
      }
    }
    function start() {
      const panel = mountPanel();
      runOnce(panel);
      setInterval(() => runOnce(panel), RUN_INTERVAL_MS);
      console.log("[see-toolkit] active. localStorage see:dryRun=1 to preview, see:connAuto=1 to enable connection writes.");
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 4e3));
    else setTimeout(start, 4e3);
  })();
})();
