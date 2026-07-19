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

  // src/see_toolkit/main.js
  (function() {
    "use strict";
    const store = makeStore();
    const weather = weatherModule(store);
    window.fetch = weather.install(window.fetch);
    function start() {
      const panel = mountPanel();
      const view = weather.plan(null).view;
      weather.render(view, panel.section("weather", weather.title));
      console.log("[see-toolkit] active");
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 3e3));
    else setTimeout(start, 3e3);
  })();
})();
