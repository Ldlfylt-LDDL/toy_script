import { h, DOT, badge } from './ui.js';

// Rich, collapsible, draggable panel. Each module gets a section with a status
// dot, a one-line summary, and an expandable detail body.
export function mountPanel() {
  const style = h('style', {}, `
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

  const badges = h('span', { class: 'see-badges' });
  const toggle = h('span', { class: 'see-toggle', title: 'collapse' }, '▾');
  const header = h('div', { id: 'see-hdr' }, h('span', { class: 'see-title' }, '⚡ SEE Toolkit'), badges, toggle);
  const statusBar = h('div', { id: 'see-status' }, 'starting…');
  const main = h('div', { class: 'see-main' }, statusBar);
  const host = h('div', { id: 'see-panel' }, style, header, main);
  document.body.appendChild(host);

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    host.classList.toggle('see-collapsed');
    toggle.textContent = host.classList.contains('see-collapsed') ? '▸' : '▾';
  });

  // drag by header
  let dragging = false, dx = 0, dy = 0;
  header.addEventListener('mousedown', (e) => {
    if (e.target === toggle) return;
    dragging = true; dx = e.clientX - host.offsetLeft; dy = e.clientY - host.offsetTop;
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    host.style.left = (e.clientX - dx) + 'px'; host.style.top = (e.clientY - dy) + 'px';
    host.style.right = 'auto'; host.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  const sections = new Map();
  function section(id, title) {
    if (sections.has(id)) return sections.get(id);
    const dot = h('span', { class: 'see-dot' });
    const sum = h('span', { class: 'see-sec-sum' }, '…');
    const body = h('div', { class: 'see-sec-body' });
    const sec = h('div', { class: 'see-sec' },
      h('div', { class: 'see-sec-hdr', onclick: () => sec.classList.toggle('see-open') },
        h('span', { class: 'see-caret' }, '▶'), dot,
        h('span', { class: 'see-sec-title' }, title), sum),
      body);
    main.appendChild(sec);
    const handle = {
      body,
      setDot: (s) => { dot.style.background = DOT[s] || DOT.idle; },
      setSummary: (t) => { sum.textContent = t; sum.title = t; },
      open: () => sec.classList.add('see-open'),
    };
    sections.set(id, handle);
    return handle;
  }

  function setStatus(text) { statusBar.textContent = text; }
  function setBadges(list) { badges.replaceChildren(...(list || []).map((b) => badge(b.text, b.color))); }

  // Controls footer. defs: { label, on(), get?() } — get present ⇒ toggle styling.
  const footer = h('div', { id: 'see-foot' });
  main.appendChild(footer);
  function setControls(defs) {
    footer.replaceChildren(...defs.map((d) => {
      const label = () => (d.get ? `${d.label}: ${d.get() ? 'ON' : 'OFF'}` : d.label);
      const btn = h('button', { class: 'see-btn' }, label());
      const paint = () => { btn.textContent = label(); btn.classList.toggle('on', !!(d.get && d.get())); };
      btn.addEventListener('click', () => { d.on(); paint(); });
      paint();
      return btn;
    }));
  }

  return { section, setStatus, setBadges, setControls, host };
}
