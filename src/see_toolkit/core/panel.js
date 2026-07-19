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
