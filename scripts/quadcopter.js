const https = require('https');

const N = [
  {id:1,n:"Power"},{id:2,n:"Water"},{id:66,n:"Seeds"},
  {id:10,n:"Crude Oil"},{id:14,n:"Minerals"},{id:15,n:"Bauxite"},
  {id:16,n:"Silicon"},{id:42,n:"Iron Ore"},{id:44,n:"Sand"},
  {id:17,n:"Chemicals"},{id:18,n:"Aluminium"},{id:43,n:"Steel"},
  {id:19,n:"Plastic"},{id:20,n:"Processors"},{id:21,n:"Electronic Comps"},
  {id:22,n:"Batteries"},{id:47,n:"On-board Computer"},{id:98,n:"Quadcopter"},
];

const E = [
  // L1
  {s:1,t:10,a:25},{s:1,t:14,a:20},{s:2,t:14,a:1},
  {s:1,t:15,a:14},{s:2,t:15,a:0.5},
  {s:1,t:16,a:3},{s:44,t:16,a:2},{s:1,t:44,a:2},
  {s:1,t:42,a:7},{s:2,t:42,a:0.5},
  // L2
  {s:1,t:17,a:0.2},{s:14,t:17,a:1},
  {s:1,t:18,a:15},{s:15,t:18,a:1},
  {s:1,t:43,a:5},{s:42,t:43,a:1},{s:17,t:43,a:0.1},
  {s:1,t:19,a:5},{s:10,t:19,a:0.2},
  // L3
  {s:16,t:20,a:4},{s:17,t:20,a:1},
  {s:16,t:21,a:3},{s:17,t:21,a:1},
  {s:17,t:22,a:4},
  // L4
  {s:20,t:47,a:2},{s:21,t:47,a:3},
  // L5
  {s:47,t:98,a:1},{s:22,t:98,a:1},{s:21,t:98,a:3},{s:19,t:98,a:2},
  // Water edges
  {s:1,t:2,a:0.2},{s:2,t:66,a:0.1},
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

  // Quadcopter的完整依赖树（不含Power）
  const TARGET = 98;
  const treeNodes = new Set();
  const q = [TARGET];
  while (q.length) {
    const cur = q.shift();
    if (treeNodes.has(cur)) continue;
    treeNodes.add(cur);
    (parents[cur]||[]).forEach(p => { if(p.s !== 1) q.push(p.s); });
  }

  console.log('=== Quadcopter 完整依赖树 ===\n');
  console.log('节点列表（不含Power）:');
  for (const id of treeNodes) {
    const r = rates[id] || 0;
    const ps = (parents[id]||[]).filter(p => p.s !== 1);
    const recipe = ps.map(p => `${nameMap[p.s]}×${p.a}`).join(' + ') || '(原料)';
    console.log(`  L? ${nameMap[id].padEnd(20)} ${String(r.toFixed(1)).padStart(8)}/hr  ←  ${recipe}`);
  }

  console.log(`\n总节点数（不含Power）: ${treeNodes.size}`);

  // 每个节点的总利用率
  console.log('\n=== 各节点在Quadcopter链中的总利用率 ===\n');
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
  console.log(`自产节点数: ${good.length + 1}（含Quadcopter本身）`);
  console.log(`最低利用率: ${nodeUtils[0].name} = ${nodeUtils[0].totalUtil.toFixed(3)}`);
}

main().catch(console.error);
