# SimEnergyEmpire Toolkit — Foundation Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `scripts/see_toolkit.user.js` into a `src/see_toolkit/` core+modules codebase with an esbuild build step and Node unit tests, at feature parity with today (Weather Logger + Connection reversal checker/fixer), including the two known reversal bug fixes.

**Architecture:** Pure-logic core (`time`, `api`, `game`, `store`, `cache`, `scheduler`, `module`) plus a thin DOM `panel` adapter and feature modules. esbuild bundles `src/see_toolkit/main.js` into `dist/see_toolkit.user.js` with a userscript banner. All decision logic is pure and injectable (fetch/storage/now passed in), so it runs under `node:test` without a browser.

**Tech Stack:** Vanilla ES modules, esbuild (build), node:test + node:assert (tests). No runtime dependencies.

## Global Constraints

- Target artifact: `dist/see_toolkit.user.js`, `@match https://www.simenergyempire.com/*`, `@grant none`, `@run-at document-start`.
- No runtime npm dependencies; esbuild is a devDependency only.
- Writes (PUT/PATCH/POST) must carry `gameHeaders`: `X-Prot: md5(url+timestampMs)`, `X-Ts`, `X-tz-offset`, `X-CSRFToken`. GET carries none.
- Night phase = `((t%6)+6)%6 ∈ {2,3,4}`; `MAX_FUTURE_TICKS = 12`.
- Pure modules take their effects (`fetch`, `storage`, `now`) as injected parameters — never reference globals directly — so they are unit-testable.
- md5 implementation is ported **verbatim** from the current script (lines 614–708); do not re-derive it.

---

### Task 1: Build scaffold

**Files:**
- Create: `package.json`
- Create: `build.mjs`
- Create: `src/see_toolkit/banner.txt`
- Create: `src/see_toolkit/main.js` (temporary smoke content)
- Create: `.gitignore`

**Interfaces:**
- Produces: `npm run build` → `dist/see_toolkit.user.js`; `npm test` runs node:test over `tests/`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "see-toolkit",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "watch": "node build.mjs --watch",
    "test": "node --test"
  },
  "devDependencies": {
    "esbuild": "^0.24.0"
  }
}
```

- [ ] **Step 2: Create `src/see_toolkit/banner.txt`**

```
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
```

- [ ] **Step 3: Create `build.mjs`**

```js
import esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const banner = readFileSync('src/see_toolkit/banner.txt', 'utf8');
const opts = {
  entryPoints: ['src/see_toolkit/main.js'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/see_toolkit.user.js',
  banner: { js: banner },
  legalComments: 'none',
  target: 'es2020',
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  console.log('watching…');
} else {
  await esbuild.build(opts);
  console.log('built dist/see_toolkit.user.js');
}
```

- [ ] **Step 4: Create `src/see_toolkit/main.js` (temporary)**

```js
console.log('[see-toolkit] loaded');
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 6: Install and build**

Run: `npm install && npm run build`
Expected: prints `built dist/see_toolkit.user.js`; file exists and starts with the `// ==UserScript==` banner.

- [ ] **Step 7: Commit**

```bash
git add package.json build.mjs src/see_toolkit/banner.txt src/see_toolkit/main.js .gitignore
git commit -m "build: esbuild scaffold for see-toolkit userscript"
```

---

### Task 2: core/time.js — tick math

**Files:**
- Create: `src/see_toolkit/core/time.js`
- Test: `tests/time.test.js`

**Interfaces:**
- Produces: `phase(t)`, `isNight(t)`, `isDay(t)`, `nextNightStart(k)`, `MAX_FUTURE_TICKS`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { phase, isNight, isDay, nextNightStart, MAX_FUTURE_TICKS } from '../src/see_toolkit/core/time.js';

test('phase wraps modulo 6', () => {
  assert.equal(phase(146), 2);
  assert.equal(phase(-1), 5);
});
test('isNight = phase 2,3,4', () => {
  assert.equal(isNight(146), true);   // 146%6=2
  assert.equal(isNight(139), false);  // 139%6=1 (midday)
  assert.equal(isDay(139), true);
});
test('nextNightStart = smallest t>=k with phase 2', () => {
  assert.equal(nextNightStart(146), 146);
  assert.equal(nextNightStart(147), 152);
  assert.equal(nextNightStart(150), 152);
});
test('MAX_FUTURE_TICKS is 12', () => assert.equal(MAX_FUTURE_TICKS, 12));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/time.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
export const MAX_FUTURE_TICKS = 12;
export const phase = (t) => ((t % 6) + 6) % 6;
export const isNight = (t) => { const p = phase(t); return p >= 2 && p <= 4; };
export const isDay = (t) => !isNight(t);
export function nextNightStart(k) {
  let t = k;
  while (phase(t) !== 2) t++;
  return t;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/time.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/core/time.js tests/time.test.js
git commit -m "feat(core): tick/phase math with tests"
```

---

### Task 3: core/api.js — signing + fetch

**Files:**
- Create: `src/see_toolkit/core/api.js`
- Test: `tests/api.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `md5hex(str)`, `getCookie(name, cookieStr)`, `gameHeaders(url, {now, csrf, tzOffset, extra})`, `fetchJSON(url, opts, fetchImpl)`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { md5hex, getCookie, gameHeaders } from '../src/see_toolkit/core/api.js';

test('md5 known vectors', () => {
  assert.equal(md5hex(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(md5hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
});
test('getCookie parses from a cookie string', () => {
  assert.equal(getCookie('csrftoken', 'a=1; csrftoken=XYZ; b=2'), 'XYZ');
  assert.equal(getCookie('missing', 'a=1'), null);
});
test('gameHeaders signs X-Prot = md5(url+now) and includes CSRF', () => {
  const h = gameHeaders('/api/v1/x/', { now: 1000, csrf: 'TOK', tzOffset: -120 });
  assert.equal(h['X-Prot'], md5hex('/api/v1/x/1000'));
  assert.equal(h['X-Ts'], '1000');
  assert.equal(h['X-tz-offset'], '-120');
  assert.equal(h['X-CSRFToken'], 'TOK');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/api.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

Port the md5 IIFE verbatim from the current script (lines 614–708) as `md5hex`, then add the helpers:

```js
export const md5hex = (function () {
  const add = (e, t) => { const r = (e & 65535) + (t & 65535); return (((e >> 16) + (t >> 16) + (r >> 16)) << 16) | (r & 65535); };
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
  const bin2str = (e) => { let t = ''; for (let r = 0; r < e.length * 32; r += 8) t += String.fromCharCode((e[r >> 5] >>> (r % 32)) & 255); return t; };
  const str2bin = (e) => { const t = Array(e.length >> 2); for (let r = 0; r < t.length; r++) t[r] = 0; for (let r = 0; r < e.length * 8; r += 8) t[r >> 5] |= (e.charCodeAt(r / 8) & 255) << (r % 32); return t; };
  const utf8 = (e) => {
    let t = '', r = -1, n, i;
    while (++r < e.length) {
      n = e.charCodeAt(r); i = r + 1 < e.length ? e.charCodeAt(r + 1) : 0;
      if (55296 <= n && n <= 56319 && 56320 <= i && i <= 57343) { n = 65536 + ((n & 1023) << 10) + (i & 1023); r++; }
      if (n <= 127) t += String.fromCharCode(n);
      else if (n <= 2047) t += String.fromCharCode(192 | ((n >>> 6) & 31), 128 | (n & 63));
      else if (n <= 65535) t += String.fromCharCode(224 | ((n >>> 12) & 15), 128 | ((n >>> 6) & 63), 128 | (n & 63));
      else if (n <= 2097151) t += String.fromCharCode(240 | ((n >>> 18) & 7), 128 | ((n >>> 12) & 63), 128 | ((n >>> 6) & 63), 128 | (n & 63));
    }
    return t;
  };
  const toHex = (e) => { const t = '0123456789abcdef'; let r = ''; for (let i = 0; i < e.length; i++) { const n = e.charCodeAt(i); r += t.charAt((n >>> 4) & 15) + t.charAt(n & 15); } return r; };
  return (input) => { const s = utf8(input); return toHex(bin2str(core(str2bin(s), s.length * 8))); };
})();

export function getCookie(name, cookieStr = (typeof document !== 'undefined' ? document.cookie : '')) {
  const m = cookieStr.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m.pop() : null;
}

export function gameHeaders(url, { now = Date.now(), csrf = getCookie('csrftoken'), tzOffset = new Date().getTimezoneOffset(), extra = {} } = {}) {
  const headers = {
    'X-tz-offset': String(tzOffset),
    'X-Ts': String(now),
    'X-Prot': md5hex(url + now),
    ...extra,
  };
  if (csrf) headers['X-CSRFToken'] = csrf;
  return headers;
}

export async function fetchJSON(url, opts = {}, fetchImpl = fetch) {
  const resp = await fetchImpl(url, opts);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/api.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/core/api.js tests/api.test.js
git commit -m "feat(core): api signing (md5/gameHeaders/getCookie/fetchJSON) with tests"
```

---

### Task 4: core/store.js — bounded localStorage

**Files:**
- Create: `src/see_toolkit/core/store.js`
- Test: `tests/store.test.js`

**Interfaces:**
- Produces: `makeStore(backend, prefix)` → `{ get(key), set(key, val), appendCapped(key, item, cap), sizeKB() }`. `backend` defaults to `localStorage`; injectable for tests.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { makeStore } from '../src/see_toolkit/core/store.js';

function fakeBackend() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('get/set round-trips JSON, namespaced', () => {
  const b = fakeBackend();
  const s = makeStore(b, 'see');
  s.set('x', { a: 1 });
  assert.deepEqual(s.get('x'), { a: 1 });
  assert.equal(b.getItem('see:x') !== null, true);
});
test('appendCapped keeps only the last N items', () => {
  const b = fakeBackend();
  const s = makeStore(b, 'see');
  for (let i = 0; i < 5; i++) s.appendCapped('log', i, 3);
  assert.deepEqual(s.get('log'), [2, 3, 4]);
});
test('get returns fallback on missing/corrupt', () => {
  const b = fakeBackend();
  const s = makeStore(b, 'see');
  assert.deepEqual(s.get('missing', []), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/store.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
export function makeStore(backend = localStorage, prefix = 'see') {
  const k = (key) => `${prefix}:${key}`;
  function get(key, fallback = null) {
    try { const raw = backend.getItem(k(key)); return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  }
  function set(key, val) { backend.setItem(k(key), JSON.stringify(val)); }
  function appendCapped(key, item, cap) {
    const arr = get(key, []);
    arr.push(item);
    if (arr.length > cap) arr.splice(0, arr.length - cap);
    set(key, arr);
  }
  function sizeKB() {
    let total = 0;
    for (const key in backend) if (key.startsWith(prefix + ':')) total += (backend.getItem(key) || '').length;
    return +(total / 1024).toFixed(1);
  }
  return { get, set, appendCapped, sizeKB };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/store.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/core/store.js tests/store.test.js
git commit -m "feat(core): bounded namespaced store with tests"
```

---

### Task 5: core/cache.js — per-tick request cache

**Files:**
- Create: `src/see_toolkit/core/cache.js`
- Test: `tests/cache.test.js`

**Interfaces:**
- Produces: `makeTickCache()` → `{ get(key, fetcher), setTick(tick) }`. `get` dedupes concurrent calls (in-flight promise) and caches results until `setTick` advances the tick, which clears the cache.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { makeTickCache } from '../src/see_toolkit/core/cache.js';

test('dedupes concurrent gets for the same key (stampede fix)', async () => {
  const cache = makeTickCache();
  let calls = 0;
  const fetcher = async () => { calls++; await new Promise(r => setTimeout(r, 5)); return 'v'; };
  const [a, b] = await Promise.all([cache.get('k', fetcher), cache.get('k', fetcher)]);
  assert.equal(a, 'v'); assert.equal(b, 'v');
  assert.equal(calls, 1);
});
test('setTick to a new tick clears the cache', async () => {
  const cache = makeTickCache();
  let calls = 0;
  const fetcher = async () => { calls++; return calls; };
  cache.setTick(146);
  await cache.get('k', fetcher);
  await cache.get('k', fetcher);
  assert.equal(calls, 1);
  cache.setTick(147);
  await cache.get('k', fetcher);
  assert.equal(calls, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/cache.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
export function makeTickCache() {
  let tick = null;
  let entries = new Map(); // key -> Promise
  function setTick(t) { if (t !== tick) { tick = t; entries = new Map(); } }
  function get(key, fetcher) {
    if (!entries.has(key)) entries.set(key, Promise.resolve().then(fetcher));
    return entries.get(key);
  }
  return { get, setTick };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/cache.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/core/cache.js tests/cache.test.js
git commit -m "feat(core): per-tick request cache with in-flight dedup"
```

---

### Task 6: core/game.js — player id + shared state loader

**Files:**
- Create: `src/see_toolkit/core/game.js`
- Test: `tests/game.test.js`

**Interfaces:**
- Consumes: `fetchJSON` (Task 3), `makeTickCache` (Task 5).
- Produces: `makeGame({ fetchJSON, cache })` → `{ getPlayerId(), getTick(), loadState() }`. `getTick()` reads `/api/v1/app-data/` → `era.lastComputedTick` and calls `cache.setTick(last)`. `loadState()` returns `{ lastComputedTick, k, playerId, buildings, connections }`, each fetched through the cache.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { makeGame } from '../src/see_toolkit/core/game.js';
import { makeTickCache } from '../src/see_toolkit/core/cache.js';

function fakeFetchJSON(routes) {
  return async (url) => {
    for (const [re, val] of routes) if (re.test(url)) return typeof val === 'function' ? val(url) : val;
    throw new Error('no route ' + url);
  };
}

test('loadState assembles tick + player + buildings + connections via cache', async () => {
  let buildingCalls = 0;
  const fetchJSON = fakeFetchJSON([
    [/app-data/, { era: { lastComputedTick: 146 } }],
    [/players\/me\//, { id: 2689 }],
    [/players\/2689\/buildings\//, () => { buildingCalls++; return { buildings: [{ id: 1, kind: 'SolarPowerPlant' }] }; }],
    [/players\/2689\/connections\//, { connections: [{ id: 9, kind: 'Power' }] }],
  ]);
  const game = makeGame({ fetchJSON, cache: makeTickCache() });
  const s1 = await game.loadState();
  const s2 = await game.loadState();
  assert.equal(s1.lastComputedTick, 146);
  assert.equal(s1.k, 147);
  assert.equal(s1.playerId, 2689);
  assert.deepEqual(s1.buildings, [{ id: 1, kind: 'SolarPowerPlant' }]);
  assert.deepEqual(s1.connections, [{ id: 9, kind: 'Power' }]);
  assert.equal(buildingCalls, 1); // cached within the same tick
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/game.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
export function makeGame({ fetchJSON, cache }) {
  let cachedPlayerId = null;
  async function getPlayerId() {
    if (cachedPlayerId != null) return cachedPlayerId;
    const me = await fetchJSON('/api/v1/players/me/');
    if (me?.id == null) throw new Error('players/me returned no id');
    cachedPlayerId = me.id;
    return cachedPlayerId;
  }
  async function getTick() {
    const data = await fetchJSON('/api/v1/app-data/');
    const last = data?.era?.lastComputedTick;
    if (last == null) throw new Error('no lastComputedTick');
    cache.setTick(last);
    return last;
  }
  async function loadState() {
    const lastComputedTick = await getTick();
    const playerId = await getPlayerId();
    const buildings = await cache.get('buildings', async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/buildings/`)).buildings || []);
    const connections = await cache.get('connections', async () =>
      (await fetchJSON(`/api/v1/players/${playerId}/connections/`)).connections || []);
    return { lastComputedTick, k: lastComputedTick + 1, playerId, buildings, connections };
  }
  return { getPlayerId, getTick, loadState };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/game.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/core/game.js tests/game.test.js
git commit -m "feat(core): game state loader (player/tick/buildings/connections)"
```

---

### Task 7: core/scheduler.js — run loop with dry-run

**Files:**
- Create: `src/see_toolkit/core/module.js`
- Create: `src/see_toolkit/core/scheduler.js`
- Test: `tests/scheduler.test.js`

**Interfaces:**
- Consumes: modules implementing `{ id, title, plan(state) -> { writes, view } }`, where each write is `{ label, send: () => Promise }`.
- Produces: `runModules({ modules, state, dryRun, delay })` → `{ executed: string[], planned: string[] }`. Executes writes serially with `delay` between them; in `dryRun` collects labels without calling `send`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { runModules } from '../src/see_toolkit/core/scheduler.js';

test('dry-run collects planned writes without sending', async () => {
  let sent = 0;
  const mod = { id: 'm', title: 'M', plan: () => ({ writes: [{ label: 'w1', send: async () => { sent++; } }], view: {} }) };
  const res = await runModules({ modules: [mod], state: {}, dryRun: true, delay: 0 });
  assert.deepEqual(res.planned, ['w1']);
  assert.equal(sent, 0);
});
test('executes writes serially', async () => {
  const order = [];
  const mk = (id) => ({ id, title: id, plan: () => ({ writes: [{ label: id, send: async () => { order.push(id); } }], view: {} }) });
  const res = await runModules({ modules: [mk('a'), mk('b')], state: {}, dryRun: false, delay: 0 });
  assert.deepEqual(order, ['a', 'b']);
  assert.deepEqual(res.executed, ['a', 'b']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/scheduler.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

`src/see_toolkit/core/module.js`:

```js
// Module contract (documentation + optional runtime guard):
//   { id: string, title: string,
//     plan(state) -> { writes: {label, send}[], view: object },
//     render?(view, sectionEl) }
export function isModule(m) {
  return m && typeof m.id === 'string' && typeof m.plan === 'function';
}
```

`src/see_toolkit/core/scheduler.js`:

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runModules({ modules, state, dryRun = false, delay = 500 }) {
  const planned = [];
  const executed = [];
  for (const mod of modules) {
    let result;
    try { result = mod.plan(state); } catch (e) { console.error(`[${mod.id}] plan failed`, e); continue; }
    for (const w of result.writes || []) {
      planned.push(w.label);
      if (dryRun) continue;
      try { await w.send(); executed.push(w.label); } catch (e) { console.error(`[${mod.id}] write "${w.label}" failed`, e); }
      if (delay) await sleep(delay);
    }
    if (mod.render && result.view) try { mod.render(result.view); } catch {}
  }
  return { planned, executed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/scheduler.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/core/module.js src/see_toolkit/core/scheduler.js tests/scheduler.test.js
git commit -m "feat(core): module contract + serial/dry-run scheduler"
```

---

### Task 8: connection reversal — pure decision (with bug fix)

**Files:**
- Create: `src/see_toolkit/modules/connections/reversal.js`
- Test: `tests/reversal.test.js`

**Interfaces:**
- Consumes: nothing (pure).
- Produces: `isReversed({ srcPriceAtT, dstPriceAtNext })` → boolean (compares source price at T vs destination price at T+1, the transport-lag-correct comparison — fixes the current same-tick bug); `directionHubs(edge, capacity)` → `{ srcHubId, dstHubId }` (positive capacity = hub1→hub2).

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { isReversed, directionHubs } from '../src/see_toolkit/modules/connections/reversal.js';

test('reversed = paying more at source(T) than received at dest(T+1)', () => {
  assert.equal(isReversed({ srcPriceAtT: 295, dstPriceAtNext: 200 }), true);
  assert.equal(isReversed({ srcPriceAtT: 175, dstPriceAtNext: 295 }), false);
});
test('capacity sign maps to direction', () => {
  const edge = { hub1Id: 10, hub2Id: 20 };
  assert.deepEqual(directionHubs(edge, 30), { srcHubId: 10, dstHubId: 20 });
  assert.deepEqual(directionHubs(edge, -30), { srcHubId: 20, dstHubId: 10 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/reversal.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
export function isReversed({ srcPriceAtT, dstPriceAtNext }) {
  return srcPriceAtT > dstPriceAtNext;
}
export function directionHubs(edge, capacity) {
  return capacity >= 0
    ? { srcHubId: edge.hub1Id, dstHubId: edge.hub2Id }
    : { srcHubId: edge.hub2Id, dstHubId: edge.hub1Id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/reversal.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/see_toolkit/modules/connections/reversal.js tests/reversal.test.js
git commit -m "feat(connections): transport-lag-correct reversal decision (bug fix)"
```

---

### Task 9: panel host + weather module + wiring (integration, no unit test)

**Files:**
- Create: `src/see_toolkit/core/panel.js`
- Create: `src/see_toolkit/modules/weather.js`
- Modify: `src/see_toolkit/main.js` (replace smoke content)

**Interfaces:**
- Consumes: `makeStore` (Task 4). `panel.js` produces `mountPanel()` → `{ section(id, title) -> HTMLElement }`. `weather.js` produces `weatherModule(store)` matching the module contract, capturing weather responses passively and rendering counts into a panel section.

- [ ] **Step 1: Write `src/see_toolkit/core/panel.js`**

```js
export function mountPanel() {
  const host = document.createElement('div');
  host.id = 'see-panel';
  host.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:99999;font:12px monospace;background:rgba(20,20,30,0.92);color:#ccc;border:1px solid #444;border-radius:6px;padding:8px 12px;max-width:420px;';
  document.body.appendChild(host);
  const sections = new Map();
  function section(id, title) {
    if (sections.has(id)) return sections.get(id);
    const el = document.createElement('div');
    el.innerHTML = `<div style="color:#ff9800;font-weight:bold;margin:6px 0 2px">${title}</div><div class="see-body"></div>`;
    host.appendChild(el);
    const body = el.querySelector('.see-body');
    sections.set(id, body);
    return body;
  }
  return { section };
}
```

- [ ] **Step 2: Write `src/see_toolkit/modules/weather.js`**

```js
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
```

- [ ] **Step 3: Write `src/see_toolkit/main.js`**

```js
import { makeStore } from './core/store.js';
import { mountPanel } from './core/panel.js';
import { weatherModule } from './modules/weather.js';

(function () {
  'use strict';
  const store = makeStore();
  const weather = weatherModule(store);
  window.fetch = weather.install(window.fetch);

  function start() {
    const panel = mountPanel();
    const view = weather.plan(null).view;
    weather.render(view, panel.section('weather', weather.title));
    console.log('[see-toolkit] active');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 3000));
  else setTimeout(start, 3000);
})();
```

- [ ] **Step 4: Build and sanity-check**

Run: `npm run build`
Expected: `built dist/see_toolkit.user.js`; grep the file for `see-toolkit` and `X-Prot` (from bundled api.js if imported — note api is not yet imported by main; that's fine for this task).

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all tests from Tasks 2–8 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/see_toolkit/core/panel.js src/see_toolkit/modules/weather.js src/see_toolkit/main.js
git commit -m "feat: panel host + weather module ported onto core, wired in main"
```

---

## Self-Review

**Spec coverage (foundation portion of §2, §10, §6.E):**
- §10.1 build → Task 1. §10.2 layers (time/api/store/cache/game/scheduler/module/panel) → Tasks 2–9. §10.3 module interface + dry-run → Task 7. §10.4 per-tick cache + stampede fix → Tasks 5–6. §10.5 bounded store → Task 4. §2.2 signing → Task 3. §2.1 time model → Task 2. §6.E reversal tick-mismatch fix → Task 8. §6.E cache stampede fix → Task 5.
- Deferred to later plans (correctly out of this plan's scope): solar upgrade, maintenance, money pickup (Plan 2); connection evaluate/forecast/direction/stop-loss/price-accumulator (Plan 3); full port of the old Connection Checker panel UI and "Fix All" button (folded into Plan 3 where the connection module is built — Task 8 here delivers the corrected decision logic they depend on).

**Placeholder scan:** No TBD/TODO; every code step contains real code and exact commands.

**Type consistency:** `makeStore(backend, prefix)`, `makeTickCache()→{get,setTick}`, `makeGame({fetchJSON,cache})→{loadState}`, `runModules({modules,state,dryRun,delay})`, module shape `{id,title,plan(state)→{writes:{label,send}[],view}}` are used consistently across Tasks 4–9.

**Note:** Task 9 wires only the weather module (feature parity increment); the scheduler/game/api wiring into `main.js` lands in Plan 2 when the first scheduled automation needs it. This keeps Plan 1 shippable (weather capture works) without dead code.
