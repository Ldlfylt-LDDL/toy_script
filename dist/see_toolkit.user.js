// ==UserScript==
// @name         SimEnergyEmpire Toolkit
// @namespace    https://www.simenergyempire.com/
// @version      2.1.20260720.220151
// @description  Weather logger + connection/solar automation for Sim Energy Empire
// @author       LDDL
// @match        https://www.simenergyempire.com/*
// @grant        none
// @run-at       document-start
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/Ldlfylt-LDDL/toy_script/main/dist/see_toolkit.user.js
// @downloadURL  https://raw.githubusercontent.com/Ldlfylt-LDDL/toy_script/main/dist/see_toolkit.user.js
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
    function flag(key) {
      const v = get(key, "0");
      return v === "1" || v === 1 || v === true;
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
    return { get, set, flag, appendCapped, sizeKB };
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

  // src/see_toolkit/core/ui.js
  function h(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "style") e.style.cssText = v;
      else if (k === "class") e.className = v;
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  }
  var DOT = { ok: "#4caf50", busy: "#ff9800", warn: "#ff5252", error: "#f44336", idle: "#666" };
  function miniTable(headers, rows) {
    const cell = (c, tag) => {
      const o = c && typeof c === "object" ? c : { text: c };
      return h(tag, { style: `text-align:left;padding:1px 8px 1px 0;white-space:nowrap;${o.color ? "color:" + o.color : ""}` }, o.text);
    };
    return h(
      "table",
      { style: "border-collapse:collapse;width:100%;font:11px monospace;margin-top:3px" },
      h("thead", {}, h("tr", {}, ...headers.map((x) => h("th", { style: "text-align:left;padding:1px 8px 2px 0;color:#888;font-weight:normal;border-bottom:1px solid #333" }, x)))),
      h("tbody", {}, ...rows.map((r) => h("tr", {}, ...r.map((c) => cell(c, "td")))))
    );
  }
  function badge(text, color) {
    return h("span", { style: `display:inline-block;padding:1px 6px;margin-left:4px;border-radius:3px;font-size:10px;background:${color}22;color:${color};border:1px solid ${color}66` }, text);
  }

  // src/see_toolkit/core/panel.js
  function mountPanel() {
    const style = h("style", {}, `
    #see-panel { position:fixed; bottom:12px; left:12px; z-index:99999; width:340px; max-width:90vw;
      font:12px/1.5 monospace; color:#d6d6d6; background:rgba(18,20,28,0.96);
      border:1px solid #3a3f4b; border-radius:8px; box-shadow:0 4px 18px rgba(0,0,0,0.5); }
    #see-panel.see-collapsed .see-main { display:none; }
    #see-hdr { display:flex; align-items:center; gap:6px; padding:7px 10px; cursor:move;
      border-bottom:1px solid #2c313c; user-select:none; }
    #see-hdr .see-title { color:#ff9800; font-weight:bold; }
    #see-hdr .see-badges { margin-left:auto; display:flex; align-items:center; }
    #see-hdr .see-toggle { margin-left:6px; cursor:pointer; color:#888; width:16px; text-align:center; }
    #see-status { padding:5px 10px; color:#9aa0ac; border-bottom:1px solid #2c313c; font-size:11px; }
    .see-sec { border-bottom:1px solid #232833; }
    .see-sec:last-child { border-bottom:none; }
    .see-sec-hdr { display:flex; align-items:center; gap:7px; padding:6px 10px; cursor:pointer; }
    .see-sec-hdr:hover { background:rgba(255,255,255,0.03); }
    .see-dot { width:8px; height:8px; border-radius:50%; flex:none; background:#666; }
    .see-sec-title { color:#cfd3da; }
    .see-sec-sum { margin-left:auto; color:#7f8794; font-size:11px; text-align:right; max-width:200px;
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .see-sec-body { padding:0 10px 8px 25px; display:none; }
    .see-sec.see-open .see-sec-body { display:block; }
    .see-sec.see-open .see-caret { transform:rotate(90deg); }
    .see-caret { color:#5a616e; font-size:9px; transition:transform .1s; }
    #see-foot { display:flex; flex-wrap:wrap; gap:5px; padding:7px 10px; border-top:1px solid #2c313c; }
    .see-btn { font:11px monospace; background:#232833; color:#9aa0ac; border:1px solid #3a3f4b;
      border-radius:4px; padding:3px 8px; cursor:pointer; }
    .see-btn:hover { border-color:#5a616e; color:#d6d6d6; }
    .see-btn.on { color:#4caf50; border-color:#356b3a; background:#1f2a20; }
  `);
    const badges = h("span", { class: "see-badges" });
    const toggle = h("span", { class: "see-toggle", title: "collapse" }, "\u25BE");
    const header = h("div", { id: "see-hdr" }, h("span", { class: "see-title" }, "\u26A1 SEE Toolkit"), badges, toggle);
    const statusBar = h("div", { id: "see-status" }, "starting\u2026");
    const main = h("div", { class: "see-main" }, statusBar);
    const host = h("div", { id: "see-panel" }, style, header, main);
    document.body.appendChild(host);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      host.classList.toggle("see-collapsed");
      toggle.textContent = host.classList.contains("see-collapsed") ? "\u25B8" : "\u25BE";
    });
    let dragging = false, dx = 0, dy = 0;
    header.addEventListener("mousedown", (e) => {
      if (e.target === toggle) return;
      dragging = true;
      dx = e.clientX - host.offsetLeft;
      dy = e.clientY - host.offsetTop;
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      host.style.left = e.clientX - dx + "px";
      host.style.top = e.clientY - dy + "px";
      host.style.right = "auto";
      host.style.bottom = "auto";
    });
    document.addEventListener("mouseup", () => {
      dragging = false;
    });
    const sections = /* @__PURE__ */ new Map();
    function section(id, title) {
      if (sections.has(id)) return sections.get(id);
      const dot = h("span", { class: "see-dot" });
      const sum = h("span", { class: "see-sec-sum" }, "\u2026");
      const body = h("div", { class: "see-sec-body" });
      const sec = h(
        "div",
        { class: "see-sec" },
        h(
          "div",
          { class: "see-sec-hdr", onclick: () => sec.classList.toggle("see-open") },
          h("span", { class: "see-caret" }, "\u25B6"),
          dot,
          h("span", { class: "see-sec-title" }, title),
          sum
        ),
        body
      );
      main.appendChild(sec);
      const handle = {
        body,
        setDot: (s) => {
          dot.style.background = DOT[s] || DOT.idle;
        },
        setSummary: (t) => {
          sum.textContent = t;
          sum.title = t;
        },
        open: () => sec.classList.add("see-open")
      };
      sections.set(id, handle);
      return handle;
    }
    function setStatus(text) {
      statusBar.textContent = text;
    }
    function setBadges(list) {
      badges.replaceChildren(...(list || []).map((b) => badge(b.text, b.color)));
    }
    const footer = h("div", { id: "see-foot" });
    main.appendChild(footer);
    function setControls(defs) {
      footer.replaceChildren(...defs.map((d) => {
        const label = () => d.get ? `${d.label}: ${d.get() ? "ON" : "OFF"}` : d.label;
        const btn = h("button", { class: "see-btn" }, label());
        const paint = () => {
          btn.textContent = label();
          btn.classList.toggle("on", !!(d.get && d.get()));
        };
        btn.addEventListener("click", () => {
          d.on();
          paint();
        });
        paint();
        return btn;
      }));
    }
    return { section, setStatus, setBadges, setControls, host };
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
      render(view, sec) {
        if (!sec) return;
        sec.setDot("ok");
        sec.setSummary(`${view.count} batch(es)`);
        sec.body.textContent = `Passively captured weather batches in storage: ${view.count}`;
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
        const target = nextTickWithPhase(state.k, 2);
        const decisions = planSolarUpgrades({ solarPlants: solar, k: state.k, activityAt });
        const queued = new Set(decisions.map((d) => d.buildingId));
        const items = solar.map((b) => ({
          name: (b.name || `#${b.id}`).replace("Solar Plant in ", ""),
          level: b.level,
          condition: b.condition,
          status: activityAt(b.id, target) === "Upgrade" ? "scheduled" : queued.has(b.id) ? "queued" : "ok"
        }));
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
        return { writes, view: { scheduled: decisions.length, target, items } };
      },
      render(view, sec) {
        if (!sec) return;
        sec.setDot(view.scheduled > 0 ? "busy" : "ok");
        sec.setSummary(`${view.scheduled} queued \xB7 night T${view.target}`);
        const color = (s) => s === "queued" ? "#ff9800" : s === "scheduled" ? "#4caf50" : "#888";
        sec.body.replaceChildren(miniTable(
          ["Plant", "Lv", "Cond", "State"],
          view.items.map((i) => [i.name, i.level, i.condition + "%", { text: i.status, color: color(i.status) }])
        ));
      }
    };
  }

  // src/see_toolkit/modules/maintenance.js
  var MAINT_THRESHOLD = 50;
  function planMaintenance({ buildings, k, threshold = MAINT_THRESHOLD, hasUpgrade }) {
    const out = [];
    for (const b of buildings) {
      if (b.condition == null || b.condition >= threshold) continue;
      const isSolar = b.kind === "SolarPowerPlant";
      if (isSolar && hasUpgrade(b.id)) continue;
      const tick = isSolar ? nextTickWithPhase(k, 2) : k;
      out.push({ buildingId: b.id, tick });
    }
    return out;
  }
  function maintenanceModule({ fetchJSON: fetchJSON2, fetchImpl = fetch, cache, upgradeTargets = () => /* @__PURE__ */ new Set() }) {
    async function activitiesFor(playerId, buildingId, k) {
      const raw = await cache.get(`bact:${buildingId}`, async () => (await fetchJSON2(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || []);
      return normalizeActivities(raw, k);
    }
    return {
      id: "maintenance",
      title: "Maintenance Backstop",
      async plan(state) {
        const upgrades = upgradeTargets(state);
        const decisions = planMaintenance({
          buildings: state.buildings || [],
          k: state.k,
          hasUpgrade: (id) => upgrades.has(id)
        });
        const norm = {};
        await Promise.all(decisions.map(async (d) => {
          norm[d.buildingId] = await activitiesFor(state.playerId, d.buildingId, state.k);
        }));
        const decMap = new Map(decisions.map((d) => [d.buildingId, d.tick]));
        const items = (state.buildings || []).filter((b) => b.condition != null && b.condition < MAINT_THRESHOLD).sort((a, b) => a.condition - b.condition).map((b) => ({
          name: b.name || `#${b.id}`,
          condition: b.condition,
          action: decMap.has(b.id) ? `\u2192 T${decMap.get(b.id)}` : "skip (upgrade repairs)"
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
        return { writes, view: { candidates: decisions.length, threshold: MAINT_THRESHOLD, items } };
      },
      render(view, sec) {
        if (!sec) return;
        sec.setDot(view.candidates > 0 ? "warn" : "ok");
        sec.setSummary(`${view.candidates} to fix (<${view.threshold}%)`);
        sec.body.replaceChildren(view.items.length ? miniTable(
          ["Building", "Cond", "Action"],
          view.items.map((i) => [i.name, { text: i.condition + "%", color: i.condition < 50 ? "#ff5252" : "#d6d6d6" }, i.action])
        ) : document.createTextNode(`All buildings at or above ${view.threshold}% condition.`));
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
        const txs = data.moneyTransactions || [];
        const hubs = distinctPickupHubs(txs);
        const total = txs.reduce((s, t) => s + (t.money || 0), 0);
        const byHub = {};
        for (const t of txs) if (t.pickedUp !== true) byHub[t.hubId] = (byHub[t.hubId] || 0) + (t.money || 0);
        const items = Object.entries(byHub).map(([hubId, amount]) => ({ hubId: +hubId, amount })).sort((a, b) => b.amount - a.amount);
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
        return { writes, view: { hubs: hubs.length, total, items } };
      },
      render(view, sec) {
        if (!sec) return;
        sec.setDot(view.hubs > 0 ? "busy" : "ok");
        sec.setSummary(view.hubs === 0 ? "nothing pending" : `$${view.total.toLocaleString()} \xB7 ${view.hubs} hub(s)`);
        const kids = [];
        if (view.items.length) {
          kids.push(miniTable(["Hub", "Amount"], view.items.map((i) => [i.hubId, { text: "$" + i.amount.toLocaleString(), color: "#4caf50" }])));
        }
        kids.push(document.createElement("div"));
        kids[kids.length - 1].style.cssText = "margin-top:4px;color:#7f8794;font-size:10px";
        kids[kids.length - 1].textContent = "Note: game map/cash refresh on next page switch.";
        sec.body.replaceChildren(...kids);
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
  var MIN_SAMPLES = 3;
  function evaluateConnection({ prices, edge, capacity, k, phaseOf = phase }) {
    const fwdSamples = spreadSamples(prices, edge.hub1Id, edge.hub2Id, phaseOf(k), phaseOf);
    const revSamples = spreadSamples(prices, edge.hub2Id, edge.hub1Id, phaseOf(k), phaseOf);
    const forward = forecast(fwdSamples);
    const reverse = forecast(revSamples);
    const current = capacity >= 0 ? "forward" : "reverse";
    const desired = decideDirection({ current, forward, reverse, threshold: FLIP_THRESHOLD, minSamples: MIN_SAMPLES });
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
        const auto = store.flag(AUTO_KEY);
        const power = (state.connections || []).filter((c) => c.kind === "Power");
        const prices = store.get("prices", {});
        const streaks = store.get("connStreak", {});
        const writes = [];
        const rows = [];
        let flagged = 0, flips = 0;
        const fetched = await Promise.all(power.map(async (c) => {
          const edgeId = c.edge?.id ?? c.edgeId;
          try {
            const detail = await connDetail(edgeId, c.id);
            const edge = {
              hub1Id: detail.edge?.hub1Id ?? detail.edge?.hub1?.id,
              hub2Id: detail.edge?.hub2Id ?? detail.edge?.hub2?.id,
              hub1Name: detail.edge?.hub1?.name,
              hub2Name: detail.edge?.hub2?.name
            };
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
              for (const h2 of histories[i]) if (h2.powerPrice != null) recordPrice(prices, hid, h2.timeTick, h2.powerPrice);
            }
            const acts = normalizeActivities(detail.connectionActivitySet || [], state.k);
            const act = acts.find((a) => a.timeTick === state.k);
            if (!act) continue;
            const ev = evaluateConnection({ prices, edge, capacity: act.capacity, k: state.k });
            const samples = Math.min(ev.forward.n || 0, ev.reverse.n || 0);
            const enough = samples >= MIN_SAMPLES;
            const decommission = enough && scoreConnection({ gradientAmplitude: ev.gradientAmplitude }).decommission;
            if (decommission) flagged++;
            const st = bumpStreak(streaks[c.id], ev.desired, ev.current);
            streaks[c.id] = st;
            const willFlip = ev.desired !== ev.current && shouldFlip(st.streak, HYSTERESIS);
            if (willFlip) flips++;
            const src = ev.current === "forward" ? edge.hub1Name || edge.hub1Id : edge.hub2Name || edge.hub2Id;
            const dst = ev.current === "forward" ? edge.hub2Name || edge.hub2Id : edge.hub1Name || edge.hub1Id;
            rows.push({
              id: c.id,
              route: `${String(src).slice(0, 9)}\u2192${String(dst).slice(0, 9)}`,
              n: samples,
              edge: ev.forward.median == null ? null : Math.round(Math.max(ev.forward.median ?? -Infinity, ev.reverse.median ?? -Infinity)),
              willFlip,
              decommission
            });
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
        const coldStart = rows.length && rows.every((r) => r.n < MIN_SAMPLES);
        return { writes, view: { total: power.length, flagged, flips, auto, coldStart, rows } };
      },
      render(view, sec) {
        if (!sec) return;
        sec.setDot(view.flagged > 0 ? "warn" : "ok");
        sec.setSummary(`${view.total} lines \xB7 ${view.auto ? view.flips + " to flip" : "read-only"}`);
        const line = (txt, extra = "") => {
          const d = document.createElement("div");
          d.style.cssText = "margin-bottom:3px;color:#7f8794;font-size:10px;" + extra;
          d.textContent = txt;
          return d;
        };
        const kids = [];
        kids.push(line(view.auto ? "\u25CF Auto trading ON \u2014 will flip direction & set stop-loss" : '\u25CB Read-only (turn on "Conn auto" to let it trade)'));
        if (view.coldStart) kids.push(line(`Cold start: gathering price history \u2014 needs ~${MIN_SAMPLES} samples before it acts or judges.`));
        kids.push(line(`Profit = best-case $/MWh next tick \xB7 Samples = price history (\u2265${MIN_SAMPLES} to trust) \xB7 \u2702 low value \xB7 \u21C4 will flip`));
        if (view.rows.length) {
          kids.push(miniTable(
            ["Conn", "Route", "Profit/MWh", "Samples", "Flags"],
            view.rows.map((r) => [
              "#" + r.id,
              r.route,
              { text: r.edge == null ? "\u2014" : r.edge >= 0 ? "+$" + r.edge : "\u2212$" + Math.abs(r.edge), color: r.edge > 0 ? "#4caf50" : "#ff5252" },
              { text: r.n < MIN_SAMPLES ? `${r.n} (low)` : r.n, color: r.n < MIN_SAMPLES ? "#888" : "#d6d6d6" },
              { text: (r.willFlip ? "\u21C4 flip " : "") + (r.decommission ? "\u2702 cut" : "") || "\u2014", color: r.decommission ? "#ff9800" : "#6ab0ff" }
            ])
          ));
        }
        sec.body.replaceChildren(...kids);
      }
    };
  }

  // src/see_toolkit/modules/hedge/sizing.js
  function expectedByPhase(history) {
    const sums = {}, counts = {};
    for (const h2 of history || []) {
      if (h2.delivered == null) continue;
      const p = phase(h2.timeTick);
      sums[p] = (sums[p] || 0) + h2.delivered;
      counts[p] = (counts[p] || 0) + 1;
    }
    const out = {};
    for (const p of Object.keys(sums)) out[p] = sums[p] / counts[p];
    return out;
  }
  function expectedAt(byPhase, tick) {
    const v = byPhase[phase(tick)];
    return v == null ? 0 : v;
  }
  function solarEfficiency(clouds, daylight) {
    if (!daylight) return 0;
    return Math.max(0, Math.min(100, Math.round(100 * (9 - clouds) / 9)));
  }
  function productionExpected(byPhase, scheduledState, tick) {
    if (scheduledState && scheduledState !== "Production") return 0;
    return expectedAt(byPhase, tick);
  }
  function roundToStep(price, step = 5) {
    return Math.floor(price / step) * step;
  }
  function hedgeQuantity({ expected, fraction = 0.5, alreadyHedged = 0 }) {
    const target = fraction * expected;
    const q = Math.round(target - alreadyHedged);
    return Math.max(0, Math.min(q, Math.floor(expected)));
  }
  var passesFloor = (bid, floor) => bid != null && bid >= floor;
  var fee = (qty, price) => Math.round(0.05 * qty * price);

  // src/see_toolkit/modules/hedge/reserve.js
  var PER_MWH_LOCK = 300;
  function applyReserveCap(candidates, availableReserve, capFraction = 0.6, perMwhLock = PER_MWH_LOCK) {
    const budget = capFraction * (availableReserve || 0);
    const ranked = [...candidates].sort((a, b) => b.price - a.price);
    const kept = [];
    let used = 0;
    for (const c of ranked) {
      const lock = perMwhLock * c.qty;
      if (used + lock > budget) continue;
      used += lock;
      kept.push({ ...c, reserveLock: lock });
    }
    return { kept, used, budget };
  }

  // src/see_toolkit/modules/hedge/endpoints.js
  function orderUrl(hubId, tick) {
    return `/api/v1/hubs/${hubId}/orders/power/${tick}`;
  }

  // src/see_toolkit/modules/hedge/index.js
  var ARM_KEY = "hedgeArmed";
  var HEDGE_FRACTION = 0.5;
  var RESERVE_BUDGET = 3e4;
  var PRICE_FLOOR = 150;
  function hedgeModule({ fetchJSON: fetchJSON2, fetchImpl = fetch, cache, store }) {
    async function solarData(playerId, buildingId, k) {
      return cache.get(`sdata:${buildingId}`, async () => {
        const acts = (await fetchJSON2(`/api/v1/players/${playerId}/buildings/${buildingId}/`)).buildingActivitySet || [];
        const history = acts.filter((a) => a.state === "Production" && a.productionOutput != null).map((a) => ({ timeTick: a.timeTick, delivered: a.productionOutput }));
        const caps = acts.filter((a) => a.productionCapacity != null).map((a) => a.productionCapacity);
        const capacity = caps.length ? Math.max(...caps) : 0;
        const norm = normalizeActivities(acts, k);
        return { byPhase: expectedByPhase(history), scheduledAt: (t) => stateAt(norm, t), capacity };
      });
    }
    async function forecast2(countryId, k) {
      return cache.get(`wx:${countryId}`, async () => {
        const w = await fetchJSON2(`/api/v1/weather/countries/${countryId}/ticks/${k + 11}/`);
        const map = {};
        for (const r of w.weatherRecords || []) map[r.timeTick] = { clouds: r.clouds, daylight: r.daylight };
        return map;
      });
    }
    async function hubCountry(hubId) {
      return cache.get(`hubcountry:${hubId}`, async () => (await fetchJSON2(`/api/v1/hubs/${hubId}/`)).countryId);
    }
    async function bestBid(hubId, tick) {
      return cache.get(`pbid:${hubId}:${tick}`, async () => {
        const j = await fetchJSON2(orderUrl(hubId, tick));
        const bids = (j.orders || []).filter((o) => o.side === "Buy").map((o) => o.price);
        return bids.length ? Math.max(...bids) : null;
      });
    }
    async function myPowerPositions(playerId) {
      return cache.get("positions", async () => ((await fetchJSON2(`/api/v1/players/${playerId}/positions/`)).positions || []).filter((p) => p.kind === "Power"));
    }
    async function placeSell(playerId, hubId, tick, quantity, price) {
      const url = orderUrl(hubId, tick);
      const resp = await fetchImpl(url, {
        method: "POST",
        credentials: "same-origin",
        headers: gameHeaders(url, { extra: { "Content-Type": "application/json" } }),
        body: JSON.stringify({ quantity, price: roundToStep(price), side: "Sell" })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
    }
    return {
      id: "hedge",
      title: "Solar Hedge",
      async plan(state) {
        const armed = store.flag(ARM_KEY);
        const solar = (state.buildings || []).filter((b) => b.kind === "SolarPowerPlant");
        const byHub = {};
        for (const b of solar) (byHub[b.hubId] = byHub[b.hubId] || []).push(b);
        const positions = await myPowerPositions(state.playerId);
        const hedgedAt = (hubId, tick) => positions.filter((p) => p.hubId === hubId && p.timeTick === tick && p.position < 0).reduce((s, p) => s + Math.abs(p.position), 0);
        const cities = [];
        const allCandidates = [];
        const formulaCheck = [];
        for (const hubId of Object.keys(byHub).map(Number)) {
          const plants = byHub[hubId];
          const perPlant = await Promise.all(plants.map((b) => solarData(state.playerId, b.id, state.k)));
          const wx = await forecast2(await hubCountry(hubId), state.k);
          if (!formulaCheck.length) {
            for (let t = state.k; t < state.k + 12 && formulaCheck.length < 2; t++) {
              const w = wx[t];
              if (w && w.daylight) formulaCheck.push({ tick: t, clouds: w.clouds, eff: solarEfficiency(w.clouds, w.daylight) });
            }
          }
          const cityExpectedAt = (tick) => perPlant.reduce((s, p) => {
            const sc = p.scheduledAt(tick);
            if (sc && sc !== "Production") return s;
            const w = wx[tick];
            if (w) return s + p.capacity * (solarEfficiency(w.clouds, w.daylight) / 100);
            return s + productionExpected(p.byPhase, sc, tick);
          }, 0);
          const rows = [];
          for (let t = state.k; t < state.k + MAX_FUTURE_TICKS; t++) {
            const expected = Math.round(cityExpectedAt(t));
            if (expected <= 0) continue;
            const bid = await bestBid(hubId, t);
            const already = hedgedAt(hubId, t);
            const qty = hedgeQuantity({ expected, fraction: HEDGE_FRACTION, alreadyHedged: already });
            const ok = passesFloor(bid, PRICE_FLOOR) && qty > 0;
            const row = { hubId, tick: t, expected, bid, already, qty, hedgeable: ok };
            rows.push(row);
            if (ok) allCandidates.push({ ...row, price: roundToStep(bid) });
          }
          if (rows.length) cities.push({ hubId, name: plants[0].name?.replace("Solar Plant in ", "") || String(hubId), rows });
        }
        const { kept } = applyReserveCap(allCandidates, RESERVE_BUDGET, 1);
        const keptSet = new Set(kept.map((c) => `${c.hubId}:${c.tick}`));
        const suggestions = kept.map((c) => ({ ...c, fee: fee(c.qty, c.price) }));
        const totalQty = suggestions.reduce((s, c) => s + c.qty, 0);
        const totalLock = suggestions.reduce((s, c) => s + (c.reserveLock || 0), 0);
        for (const city of cities) for (const r of city.rows) r.suggested = keptSet.has(`${r.hubId}:${r.tick}`);
        return {
          writes: [],
          // semi-auto: nothing auto-executes
          view: { armed, playerId: state.playerId, cities, suggestions, totalQty, totalLock, budget: RESERVE_BUDGET, floor: PRICE_FLOOR, formulaCheck }
        };
      },
      render(view, sec) {
        if (!sec) return;
        sec.setDot(view.suggestions.length ? "busy" : "ok");
        sec.setSummary(`${view.suggestions.length} order(s) \xB7 ${view.totalQty} MWh \xB7 lock $${view.totalLock.toLocaleString()}`);
        const kids = [];
        const note = (t, extra = "") => h("div", { style: `margin-bottom:3px;color:#7f8794;font-size:10px;${extra}` }, t);
        kids.push(note(view.armed ? "\u25CF ARMED \u2014 Confirm places a real sell order" : '\u25CB Read-only \u2014 click "Arm hedge" below to enable Confirm'));
        const pct = Math.min(100, Math.round(view.totalLock / view.budget * 100));
        kids.push(h(
          "div",
          { style: "margin:2px 0 5px" },
          h("div", { style: "font-size:10px;color:#7f8794;margin-bottom:2px" }, `Reserve to lock: $${view.totalLock.toLocaleString()} / $${view.budget.toLocaleString()} budget`),
          h(
            "div",
            { style: "height:5px;background:#232833;border-radius:3px;overflow:hidden" },
            h("div", { style: `height:100%;width:${pct}%;background:${pct > 90 ? "#ff5252" : "#4caf50"}` })
          )
        ));
        kids.push(note(`Hedge ${Math.round(HEDGE_FRACTION * 100)}% of expected solar output \xB7 only bids \u2265 $${view.floor}`));
        if (view.formulaCheck && view.formulaCheck.length) {
          kids.push(note("\u2316 solar-eff check (vs game Weather page): " + view.formulaCheck.map((f) => `T${f.tick} clouds ${f.clouds} \u2192 ${f.eff}%`).join("  \xB7  "), "color:#6ab0ff"));
        }
        for (const city of view.cities) {
          kids.push(h("div", { style: "margin-top:6px;color:#cfd3da;font-size:11px" }, `${city.name}`));
          const table = h(
            "table",
            { style: "border-collapse:collapse;width:100%;font:11px monospace;margin-top:2px" },
            h("thead", {}, h("tr", {}, ...["Tick", "Exp", "Bid", "Hedge", ""].map((x) => h("th", { style: "text-align:left;padding:1px 8px 2px 0;color:#888;font-weight:normal;border-bottom:1px solid #333" }, x)))),
            h("tbody", {}, ...city.rows.map((r) => {
              const cells = [
                h("td", { style: "padding:1px 8px 1px 0" }, "T" + r.tick),
                h("td", { style: "padding:1px 8px 1px 0" }, r.expected),
                h("td", { style: `padding:1px 8px 1px 0;color:${r.hedgeable ? "#4caf50" : "#888"}` }, r.bid == null ? "\u2014" : "$" + r.bid),
                h("td", { style: "padding:1px 8px 1px 0" }, r.suggested ? r.qty + " MWh" : r.hedgeable ? "\u2014" : "skip"),
                h("td", { style: "padding:1px 8px 1px 0" }, r.suggested ? confirmCell(view, r) : "")
              ];
              return h("tr", {}, ...cells);
            }))
          );
          kids.push(table);
        }
        const armBtn = h("button", {
          style: "margin-top:6px;font:11px monospace;background:#232833;color:#9aa0ac;border:1px solid #3a3f4b;border-radius:4px;padding:3px 8px;cursor:pointer"
        }, "");
        const paintArm = (on) => {
          armBtn.textContent = "Arm hedge: " + (on ? "ON" : "OFF");
          armBtn.style.color = on ? "#4caf50" : "#9aa0ac";
        };
        paintArm(view.armed);
        armBtn.addEventListener("click", () => {
          const on = !store.flag(ARM_KEY);
          store.set(ARM_KEY, on ? "1" : "0");
          paintArm(on);
          sec.body.querySelectorAll(".see-hedge-confirm").forEach((b) => setConfirmEnabled(b, on));
        });
        kids.push(armBtn);
        sec.body.replaceChildren(...kids);
      }
    };
    function setConfirmEnabled(btn, on) {
      btn.style.opacity = on ? "1" : ".4";
      btn.style.pointerEvents = on ? "auto" : "none";
    }
    function confirmCell(view, r) {
      const btn = h("button", {
        class: "see-hedge-confirm",
        style: "font:10px monospace;background:#2a1f2a;color:#ff5252;border:1px solid #ff5252;border-radius:3px;padding:1px 6px;cursor:pointer",
        title: `Sell ${r.qty} MWh @ $${roundToStep(r.bid)} (locks $${(r.reserveLock || 0).toLocaleString()}, fee $${fee(r.qty, roundToStep(r.bid))})`
      }, "Confirm");
      setConfirmEnabled(btn, view.armed);
      btn.addEventListener("click", async () => {
        if (!store.flag(ARM_KEY)) return;
        btn.disabled = true;
        btn.textContent = "\u2026";
        try {
          await placeSell(view.playerId, r.hubId, r.tick, r.qty, r.bid);
          btn.textContent = "\u2713 sold";
          btn.style.color = "#4caf50";
          btn.style.borderColor = "#4caf50";
        } catch (e) {
          btn.textContent = "err";
          btn.title = e.message;
          btn.disabled = false;
        }
      });
      return btn;
    }
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
    const hedge = hedgeModule({ fetchJSON: fetchJSON2, cache, store });
    const modules = [solar, maintenance, money, connections, hedge, weather];
    const RUN_INTERVAL_MS = 60 * 60 * 1e3;
    const BUILD_VERSION = true ? "2.1.20260720.220151" : "dev";
    const DOWNLOAD_URL = "https://raw.githubusercontent.com/Ldlfylt-LDDL/toy_script/main/dist/see_toolkit.user.js";
    let running = false;
    function cmpVersion(a, b) {
      const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d) return d > 0 ? 1 : -1;
      }
      return 0;
    }
    async function checkUpdate(panel, { quiet = false } = {}) {
      if (!quiet) panel.setStatus("Checking for updates\u2026");
      try {
        const r = await fetch(DOWNLOAD_URL + "?t=" + Date.now(), { cache: "no-store" });
        const txt = await r.text();
        const m = txt.match(/@version\s+([\d.]+)/);
        const remote = m && m[1];
        if (!remote) {
          if (!quiet) panel.setStatus("Update check failed \u2014 could not read remote version.");
          return;
        }
        if (cmpVersion(remote, BUILD_VERSION) > 0) {
          if (quiet) {
            panel.setStatus(`\u2913 Update available: v${remote} \u2014 click "\u27F3 Update" to install.`);
          } else {
            panel.setStatus(`\u2913 Update v${remote} \u2014 opening installer\u2026`);
            window.open(DOWNLOAD_URL, "_blank");
          }
        } else if (!quiet) {
          panel.setStatus(`\u2713 Up to date (v${BUILD_VERSION}).`);
        }
      } catch (e) {
        if (!quiet) panel.setStatus("Update check failed \u2014 see console.");
        console.error("[see-toolkit] update check failed", e);
      }
    }
    async function runOnce(panel) {
      if (running) return;
      running = true;
      try {
        const dryRun = store.flag("dryRun");
        const auto = store.flag("connAuto");
        panel.setBadges([
          dryRun ? { text: "DRY-RUN", color: "#ff9800" } : null,
          auto ? { text: "connAuto", color: "#4caf50" } : { text: "read-only", color: "#888" }
        ].filter(Boolean));
        panel.setStatus("Checking tick\u2026");
        const tick = await game.getTick();
        const lastRunTick = store.get("lastRunTick", null);
        const force = store.flag("forceRun");
        const lastViews = store.get("lastViews", null);
        if (!force && tick === lastRunTick && lastViews) {
          for (const mod of modules) {
            const sec = panel.section(mod.id, mod.title);
            try {
              mod.render && mod.render(lastViews[mod.id], sec);
            } catch {
            }
          }
          panel.setStatus(`Tick ${tick} \xB7 showing last run (cached) \xB7 Run now to refresh`);
          return;
        }
        if (force) store.set("forceRun", "0");
        panel.setStatus("Loading game state\u2026");
        for (const mod of modules) panel.section(mod.id, mod.title);
        const state = await game.loadState();
        let done = 0;
        panel.setStatus(`Tick ${state.lastComputedTick} \xB7 running 0/${modules.length}\u2026`);
        const res = await runModules({
          modules,
          state,
          dryRun,
          delay: 400 + Math.random() * 400,
          // Render each module the moment it finishes, instead of after the whole run.
          onModule(mod, view, err) {
            done++;
            panel.setStatus(`Tick ${state.lastComputedTick} \xB7 running ${done}/${modules.length}\u2026`);
            const sec = panel.section(mod.id, mod.title);
            if (err) {
              sec.setDot("error");
              sec.setSummary("error \u2014 see console");
              return;
            }
            try {
              mod.render && mod.render(view, sec);
            } catch {
            }
          },
          // Live feedback during long serial write sequences (e.g. money pickup).
          onWrite(mod, label, i, total) {
            const sec = panel.section(mod.id, mod.title);
            sec.setDot("busy");
            sec.setSummary(`${i}/${total} \u2014 ${label}`);
          }
        });
        store.set("lastRunTick", state.lastComputedTick);
        store.set("lastViews", res.views);
        panel.setStatus(`Tick ${state.lastComputedTick}${dryRun ? " \xB7 DRY-RUN" : ""} \xB7 ${res.executed.length} write(s) \xB7 ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`);
        console.log(`[see-toolkit] tick ${state.lastComputedTick}: ${dryRun ? "DRY-RUN " : ""}${res.executed.length} write(s)`, res.planned);
        const collected = res.executed.some((l) => l.startsWith("pickup"));
        if (collected && !dryRun && reloadEnabled() && /\/countries/.test(location.pathname) && store.get("lastReloadTick", null) !== String(state.lastComputedTick)) {
          store.set("lastReloadTick", String(state.lastComputedTick));
          panel.setStatus("Collected money \u2014 refreshing game view\u2026");
          setTimeout(() => location.reload(), 900);
        }
      } catch (e) {
        panel.setStatus("Run failed \u2014 see console.");
        console.error("[see-toolkit] run failed", e);
      } finally {
        running = false;
      }
    }
    function toggle(key) {
      store.set(key, store.flag(key) ? "0" : "1");
    }
    function reloadEnabled() {
      const v = store.get("autoReload", "1");
      return v === "1" || v === 1 || v === true;
    }
    function exportLegacyWeather() {
      const raw = localStorage.getItem("see_weather_log");
      if (!raw) {
        alert("No legacy weather data (see_weather_log) found.");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
      a.download = `see_weather_legacy_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
      a.click();
    }
    function start() {
      const panel = mountPanel();
      if (store.get("autoReload", null) === null) store.set("autoReload", "1");
      panel.setControls([
        { label: "Dry-run", get: () => store.flag("dryRun"), on: () => toggle("dryRun") },
        { label: "Conn auto", get: () => store.flag("connAuto"), on: () => toggle("connAuto") },
        { label: "Auto-reload", get: () => reloadEnabled(), on: () => toggle("autoReload") },
        { label: "\u25B6 Run now", on: () => {
          store.set("forceRun", "1");
          runOnce(panel);
        } },
        { label: `\u27F3 Update (v${BUILD_VERSION})`, on: () => checkUpdate(panel) },
        { label: "\u2B73 Export weather", on: exportLegacyWeather }
      ]);
      runOnce(panel);
      setInterval(() => runOnce(panel), RUN_INTERVAL_MS);
      setTimeout(() => checkUpdate(panel, { quiet: true }), 8e3);
      console.log("[see-toolkit] active. Use the panel buttons (Dry-run / Conn auto / Run now / Export weather).");
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 4e3));
    else setTimeout(start, 4e3);
  })();
})();
