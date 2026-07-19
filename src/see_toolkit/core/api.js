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
