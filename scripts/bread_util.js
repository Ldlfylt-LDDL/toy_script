const https = require('https');

const N = [
  {id:1,n:"Power"},{id:2,n:"Water"},{id:66,n:"Seeds"},
  {id:6,n:"Grain"},{id:9,n:"Eggs"},{id:117,n:"Milk"},
  {id:139,n:"Fodder"},{id:120,n:"Vegetables"},{id:141,n:"Veg Oil"},
  {id:115,n:"Cows"},{id:133,n:"Flour"},{id:134,n:"Butter"},
  {id:137,n:"Dough"},{id:121,n:"Bread"},
];

const E = [
  {s:1,t:2,a:0.2},{s:2,t:66,a:0.1},
  {s:2,t:6,a:0.5},{s:66,t:6,a:1},
  {s:2,t:9,a:0.4},{s:6,t:9,a:0.5},
  {s:2,t:115,a:16},{s:139,t:115,a:12},
  {s:2,t:117,a:2},{s:139,t:117,a:0.5},
  {s:120,t:139,a:0.5},{s:6,t:139,a:10},
  {s:120,t:141,a:10},{s:1,t:141,a:1},
  {s:2,t:120,a:2},{s:66,t:120,a:5},
  {s:6,t:133,a:15},
  {s:117,t:134,a:0.5},
  {s:133,t:137,a:2},{s:9,t:137,a:1},{s:134,t:137,a:0.5},
  {s:137,t:121,a:1},
];

const nameMap = {};
N.forEach(n => nameMap[n.id] = n.n);
const parents = {};
N.forEach(n => parents[n.id] = []);
E.forEach(e => { if(!parents[e.t]) parents[e.t]=[]; parents[e.t].push({s:e.s,a:e.a}); });

function fetchRate(id) {
  return new Promise((resolve) => {
    const url = `https://www.simcompanies.com/api/v4/en/0/encyclopedia/resources/0/${id}/`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { const j = JSON.parse(data); resolve({ id, rate: j.producedAnHour || 0 }); }
        catch(e) { resolve({ id, rate: 0 }); }
      });
    }).on('error', () => resolve({ id, rate: 0 }));
  });
}

async function main() {
  const rates = {};
  const results = await Promise.all(N.map(n => fetchRate(n.id)));
  results.forEach(r => rates[r.id] = r.rate);

  const TARGET = 121;
  const treeNodes = new Set();
  const q = [TARGET];
  while (q.length) {
    const cur = q.shift();
    if (treeNodes.has(cur)) continue;
    treeNodes.add(cur);
    (parents[cur]||[]).forEach(p => { if(p.s !== 1) q.push(p.s); });
  }
  treeNodes.add(1); // include Power

  console.log('=== Bread 完整依赖树 ===\n');
  for (const id of treeNodes) {
    const r = rates[id] || 0;
    const ps = (parents[id]||[]).filter(p => p.s !== 1);
    const recipe = ps.map(p => `${nameMap[p.s]}×${p.a}`).join(' + ') || '(原料)';
    console.log(`  ${(nameMap[id]||id).padEnd(20)} ${String(r.toFixed(1)).padStart(8)}/hr  ←  ${recipe}`);
  }

  console.log(`\n总节点数（含Power）: ${treeNodes.size}`);

  console.log('\n=== 各节点在Bread链中的总利用率 ===\n');
  const nodeUtils = [];
  for (const a of treeNodes) {
    if (a === 1) continue;
    const rateA = rates[a] || 0;
    if (rateA === 0) continue;
    let totalConsumed = 0;
    const consumedBy = [];
    for (const b of treeNodes) {
      for (const p of (parents[b]||[])) {
        if (p.s === a) {
          const rateB = rates[b] || 0;
          const consumed = rateB * p.a;
          totalConsumed += consumed;
          consumedBy.push(`${nameMap[b]}(${consumed.toFixed(1)})`);
        }
      }
    }
    const totalUtil = totalConsumed / rateA;
    nodeUtils.push({ id: a, name: nameMap[a], rateA, totalConsumed, totalUtil, consumedBy });
  }

  nodeUtils.sort((a, b) => a.totalUtil - b.totalUtil);
  for (const u of nodeUtils) {
    const flag = u.totalUtil < 0.2 ? ' ⚠️ 外购' : u.totalUtil > 5 ? ' ↑超载' : ' ✓';
    console.log(`${u.name.padEnd(22)} 产量:${String(u.rateA.toFixed(1)).padStart(8)}/hr  总消耗:${String(u.totalConsumed.toFixed(1)).padStart(7)}/hr  利用率:${u.totalUtil.toFixed(3)}${flag}`);
    console.log(`  被消耗于: ${u.consumedBy.join(', ')}`);
  }

  console.log('\n=== 结论 ===');
  const bad = nodeUtils.filter(u => u.totalUtil < 0.2);
  const good = nodeUtils.filter(u => u.totalUtil >= 0.2);
  console.log(`需外购（利用率<0.2）: ${bad.map(u=>u.name).join(', ') || '无'}`);
  console.log(`自产节点数: ${good.length + 1}（含Bread本身）`);
  console.log(`最低有效利用率（自产）: ${good[0]?.name} = ${good[0]?.totalUtil.toFixed(3)}`);
}

main().catch(console.error);
