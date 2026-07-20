const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// onModule(mod, view, err) fires as soon as each module's plan+writes finish,
// so the UI can render progressively instead of waiting for the whole run.
export async function runModules({ modules, state, dryRun = false, delay = 500, onModule, onWrite }) {
  const planned = [];
  const executed = [];
  const views = {};
  for (const mod of modules) {
    let result;
    try { result = await mod.plan(state); }
    catch (e) {
      console.error(`[${mod.id}] plan failed`, e);
      if (onModule) try { onModule(mod, null, e); } catch {}
      continue;
    }
    views[mod.id] = result.view;
    const list = result.writes || [];
    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      planned.push(w.label);
      if (dryRun) continue;
      if (onWrite) try { onWrite(mod, w.label, i + 1, list.length); } catch {}
      try { await w.send(); executed.push(w.label); } catch (e) { console.error(`[${mod.id}] write "${w.label}" failed`, e); }
      if (delay) await sleep(delay);
    }
    if (onModule) try { onModule(mod, result.view, null); } catch {}
  }
  return { planned, executed, views };
}
