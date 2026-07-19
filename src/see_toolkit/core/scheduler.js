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
