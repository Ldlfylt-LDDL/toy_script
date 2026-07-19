const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runModules({ modules, state, dryRun = false, delay = 500 }) {
  const planned = [];
  const executed = [];
  const views = {};
  for (const mod of modules) {
    let result;
    try { result = await mod.plan(state); } catch (e) { console.error(`[${mod.id}] plan failed`, e); continue; }
    views[mod.id] = result.view;
    for (const w of result.writes || []) {
      planned.push(w.label);
      if (dryRun) continue;
      try { await w.send(); executed.push(w.label); } catch (e) { console.error(`[${mod.id}] write "${w.label}" failed`, e); }
      if (delay) await sleep(delay);
    }
  }
  return { planned, executed, views };
}
