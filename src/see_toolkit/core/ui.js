// Tiny DOM builder helpers (adapter layer, not unit-tested).

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'style') e.style.cssText = v;
    else if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}

export const DOT = { ok: '#4caf50', busy: '#ff9800', warn: '#ff5252', error: '#f44336', idle: '#666' };

// Compact table: headers = ['A','B'], rows = [[c1,c2], ...]. Cell can be string
// or { text, color }.
export function miniTable(headers, rows) {
  const cell = (c, tag) => {
    const o = c && typeof c === 'object' ? c : { text: c };
    return h(tag, { style: `text-align:left;padding:1px 8px 1px 0;white-space:nowrap;${o.color ? 'color:' + o.color : ''}` }, o.text);
  };
  return h('table', { style: 'border-collapse:collapse;width:100%;font:11px monospace;margin-top:3px' },
    h('thead', {}, h('tr', {}, ...headers.map((x) => h('th', { style: 'text-align:left;padding:1px 8px 2px 0;color:#888;font-weight:normal;border-bottom:1px solid #333' }, x)))),
    h('tbody', {}, ...rows.map((r) => h('tr', {}, ...r.map((c) => cell(c, 'td'))))),
  );
}

export function badge(text, color) {
  return h('span', { style: `display:inline-block;padding:1px 6px;margin-left:4px;border-radius:3px;font-size:10px;background:${color}22;color:${color};border:1px solid ${color}66` }, text);
}
