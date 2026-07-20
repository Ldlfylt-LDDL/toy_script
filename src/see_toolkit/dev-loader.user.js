// ==UserScript==
// @name         SEE Toolkit (DEV loader)
// @namespace    https://www.simenergyempire.com/
// @version      1.0
// @description  Loads the latest local build of see_toolkit on every page load. Install ONCE; run `npm run dev` while developing.
// @match        https://www.simenergyempire.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// @run-at       document-start
// ==/UserScript==

// One-time install. With `npm run dev` running, edit source → save → refresh the
// game page and the newest build runs — no copy/paste, no Tampermonkey updates.
// When you're not developing, this loader simply does nothing (server unreachable),
// so you can leave it installed. For daily play, install dist/see_toolkit.user.js
// as a normal userscript instead (or in addition, but don't run both at once).
(function () {
  'use strict';
  const URL = 'http://localhost:8127/see_toolkit.user.js?_=' + Date.now();
  GM_xmlhttpRequest({
    method: 'GET',
    url: URL,
    onload: (r) => {
      if (r.status < 200 || r.status >= 300) { console.warn('[see-dev-loader] HTTP', r.status); return; }
      try { (0, eval)(r.responseText); console.log('[see-dev-loader] loaded local build'); }
      catch (e) { console.error('[see-dev-loader] eval failed', e); }
    },
    onerror: () => console.warn('[see-dev-loader] localhost:8127 unreachable — run `npm run dev` (or ignore if not developing)'),
  });
})();
