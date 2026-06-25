// 通用产业链利用率分析脚本
// 用法: node chain_util.js <产品ID>
const https = require('https');

const ALL_E = [
  {s:1,t:2,a:0.2},{s:2,t:66,a:0.1},{s:1,t:10,a:25},{s:1,t:14,a:20},{s:2,t:14,a:1},{s:1,t:15,a:14},{s:2,t:15,a:0.5},{s:1,t:44,a:2},{s:1,t:16,a:3},{s:44,t:16,a:2},{s:1,t:42,a:7},{s:2,t:42,a:0.5},{s:1,t:68,a:80},{s:2,t:68,a:2},{s:1,t:104,a:1},{s:1,t:105,a:2},{s:2,t:106,a:4},{s:66,t:106,a:1},
  {s:2,t:3,a:3},{s:66,t:3,a:1},{s:2,t:4,a:3},{s:66,t:4,a:1},{s:2,t:5,a:4},{s:66,t:5,a:1},{s:2,t:6,a:0.5},{s:66,t:6,a:1},{s:2,t:9,a:0.4},{s:6,t:9,a:0.5},{s:2,t:40,a:1},{s:66,t:40,a:1},{s:2,t:72,a:3},{s:66,t:72,a:1},{s:2,t:118,a:0.5},{s:66,t:118,a:1},{s:2,t:120,a:2},{s:66,t:120,a:5},{s:2,t:136,a:1},{s:66,t:136,a:1},
  {s:115,t:7,a:0.125},{s:116,t:8,a:0.0625},{s:115,t:46,a:0.125},{s:2,t:115,a:16},{s:139,t:115,a:12},{s:2,t:116,a:4},{s:139,t:116,a:4},{s:2,t:117,a:2},{s:139,t:117,a:0.5},
  {s:1,t:11,a:15},{s:10,t:11,a:0.75},{s:73,t:11,a:0.25},{s:1,t:12,a:15},{s:10,t:12,a:0.75},{s:73,t:12,a:0.25},{s:12,t:13,a:0.005},{s:1,t:13,a:0.01},{s:1,t:19,a:5},{s:10,t:19,a:0.2},{s:1,t:73,a:20},{s:72,t:73,a:10},{s:1,t:74,a:20},{s:10,t:75,a:0.1},{s:1,t:75,a:0.5},{s:74,t:83,a:1},{s:1,t:83,a:5},
  {s:1,t:17,a:0.2},{s:14,t:17,a:1},{s:1,t:18,a:15},{s:15,t:18,a:1},{s:1,t:43,a:5},{s:42,t:43,a:1},{s:17,t:43,a:0.1},{s:1,t:45,a:2},{s:16,t:45,a:1},{s:1,t:69,a:40},{s:68,t:69,a:200},
  {s:103,t:101,a:15},{s:44,t:101,a:20},{s:2,t:101,a:20},{s:43,t:101,a:5},{s:104,t:102,a:0.5},{s:105,t:103,a:3},{s:43,t:107,a:1},{s:1,t:107,a:4},{s:106,t:108,a:0.5},{s:18,t:109,a:2},{s:45,t:109,a:1},{s:43,t:110,a:0.5},{s:108,t:110,a:0.5},{s:21,t:110,a:1},{s:22,t:110,a:1},{s:112,t:111,a:0.125},{s:12,t:111,a:5},{s:109,t:111,a:4},{s:107,t:111,a:8},{s:110,t:111,a:4},{s:43,t:112,a:4},{s:51,t:112,a:1},{s:52,t:112,a:2},
  {s:16,t:20,a:4},{s:17,t:20,a:1},{s:16,t:21,a:3},{s:17,t:21,a:1},{s:17,t:22,a:4},{s:16,t:23,a:5},{s:17,t:23,a:4},{s:16,t:79,a:4},{s:17,t:79,a:3},{s:69,t:79,a:0.0625},
  {s:20,t:24,a:2},{s:21,t:24,a:1},{s:22,t:24,a:1},{s:23,t:24,a:1},{s:18,t:24,a:2},{s:20,t:25,a:2},{s:21,t:25,a:1},{s:22,t:25,a:1},{s:23,t:25,a:2},{s:18,t:25,a:3},{s:20,t:26,a:4},{s:21,t:26,a:3},{s:22,t:26,a:2},{s:23,t:26,a:2},{s:19,t:26,a:3},{s:21,t:27,a:2},{s:23,t:27,a:3},{s:19,t:27,a:3},{s:20,t:28,a:1},{s:21,t:28,a:4},{s:23,t:28,a:4},{s:19,t:28,a:5},
  {s:40,t:41,a:2},{s:1,t:41,a:1},{s:20,t:47,a:2},{s:21,t:47,a:3},{s:43,t:48,a:2},{s:21,t:48,a:3},{s:23,t:49,a:6},{s:18,t:49,a:2},{s:46,t:49,a:5},{s:23,t:50,a:2},{s:19,t:50,a:2},{s:41,t:50,a:5},{s:18,t:51,a:30},{s:45,t:51,a:5},{s:43,t:51,a:5},{s:43,t:52,a:6},{s:17,t:52,a:5},{s:21,t:52,a:5},{s:75,t:76,a:8},
  {s:48,t:53,a:2},{s:50,t:53,a:1},{s:51,t:53,a:1},{s:22,t:53,a:15},{s:47,t:53,a:1},{s:48,t:54,a:4},{s:49,t:54,a:1},{s:51,t:54,a:1},{s:22,t:54,a:30},{s:47,t:54,a:2},{s:52,t:55,a:1},{s:50,t:55,a:1},{s:51,t:55,a:1},{s:47,t:55,a:1},{s:52,t:56,a:2},{s:49,t:56,a:1},{s:51,t:56,a:1},{s:47,t:56,a:2},{s:52,t:57,a:6},{s:50,t:57,a:1},{s:51,t:57,a:1},{s:43,t:57,a:10},{s:47,t:57,a:1},
  {s:41,t:60,a:1},{s:41,t:61,a:0.5},{s:46,t:61,a:0.5},{s:41,t:62,a:3},{s:19,t:62,a:0.5},{s:46,t:63,a:1},{s:19,t:63,a:0.2},{s:46,t:64,a:1.5},{s:19,t:65,a:1},{s:69,t:70,a:0.1},{s:21,t:70,a:2},{s:45,t:70,a:0.5},{s:69,t:71,a:0.25},
  {s:6,t:133,a:15},{s:117,t:134,a:0.5},{s:72,t:135,a:1},{s:1,t:135,a:0.5},{s:133,t:137,a:2},{s:9,t:137,a:1},{s:134,t:137,a:0.5},{s:120,t:138,a:2},{s:134,t:138,a:0.5},{s:2,t:138,a:0.5},{s:120,t:139,a:0.5},{s:6,t:139,a:10},{s:136,t:140,a:10},{s:117,t:140,a:0.5},{s:135,t:140,a:1},{s:120,t:141,a:10},{s:1,t:141,a:1},
  {s:137,t:121,a:1},{s:117,t:122,a:1},{s:137,t:123,a:1},{s:3,t:123,a:2},{s:135,t:123,a:2},{s:4,t:124,a:5},{s:135,t:124,a:1},{s:3,t:125,a:8},{s:2,t:126,a:1},{s:120,t:126,a:3},{s:135,t:126,a:2},{s:137,t:127,a:2},{s:120,t:127,a:2},{s:122,t:127,a:1},{s:8,t:127,a:1},{s:133,t:128,a:2},{s:9,t:128,a:2},{s:7,t:129,a:4},{s:120,t:129,a:3},{s:134,t:129,a:1},{s:121,t:129,a:0.5},{s:141,t:129,a:0.5},{s:7,t:130,a:1},{s:122,t:130,a:0.5},{s:128,t:130,a:1},{s:138,t:130,a:1},{s:8,t:131,a:2},{s:121,t:131,a:1},{s:138,t:131,a:1},{s:141,t:131,a:0.5},{s:124,t:132,a:1},{s:125,t:132,a:1},{s:126,t:132,a:2},{s:118,t:119,a:10},{s:119,t:132,a:8},{s:120,t:142,a:5},{s:141,t:142,a:0.5},{s:122,t:142,a:2},{s:120,t:143,a:5},{s:141,t:143,a:1},{s:133,t:143,a:4},
  {s:48,t:114,a:1},{s:20,t:114,a:2},{s:19,t:114,a:10},
  {s:76,t:77,a:40},{s:76,t:78,a:30},{s:18,t:78,a:5},{s:79,t:80,a:4},{s:47,t:80,a:2},{s:79,t:81,a:4},{s:23,t:81,a:8},{s:50,t:81,a:1},{s:43,t:82,a:3},{s:22,t:82,a:5},{s:48,t:82,a:3},{s:18,t:84,a:50},{s:83,t:84,a:250},{s:18,t:85,a:30},{s:83,t:85,a:100},{s:17,t:85,a:50},{s:43,t:86,a:20},{s:79,t:86,a:8},{s:18,t:86,a:10},{s:43,t:87,a:20},{s:16,t:87,a:30},{s:79,t:88,a:8},{s:22,t:88,a:30},{s:17,t:88,a:15},{s:79,t:89,a:4},{s:18,t:89,a:5},
  {s:77,t:90,a:8},{s:84,t:90,a:2},{s:80,t:90,a:2},{s:88,t:90,a:4},{s:82,t:90,a:2},{s:85,t:91,a:1},{s:90,t:91,a:1},{s:77,t:92,a:40},{s:84,t:92,a:16},{s:86,t:92,a:34},{s:81,t:93,a:2},{s:87,t:93,a:10},{s:82,t:93,a:4},{s:84,t:93,a:6},{s:86,t:93,a:7},{s:92,t:94,a:1},{s:93,t:94,a:1},{s:77,t:95,a:40},{s:78,t:95,a:10},{s:81,t:95,a:2},{s:50,t:95,a:140},{s:89,t:95,a:4},{s:77,t:96,a:14},{s:78,t:96,a:2},{s:81,t:96,a:1},{s:69,t:96,a:2},{s:89,t:96,a:2},{s:77,t:97,a:8},{s:78,t:97,a:2},{s:81,t:97,a:1},{s:52,t:97,a:1},{s:47,t:98,a:1},{s:22,t:98,a:1},{s:21,t:98,a:3},{s:19,t:98,a:2},{s:80,t:99,a:4},{s:88,t:99,a:1},{s:79,t:99,a:8},{s:82,t:99,a:2},
];

const ALL_N = [
  {id:1,n:"Power"},{id:2,n:"Water"},{id:66,n:"Seeds"},
  {id:10,n:"Crude Oil"},{id:14,n:"Minerals"},{id:15,n:"Bauxite"},
  {id:16,n:"Silicon"},{id:42,n:"Iron Ore"},{id:44,n:"Sand"},
  {id:68,n:"Gold Ore"},{id:104,n:"Clay"},{id:105,n:"Limestone"},{id:106,n:"Wood"},
  {id:3,n:"Apples"},{id:4,n:"Oranges"},{id:5,n:"Grapes"},
  {id:6,n:"Grain"},{id:72,n:"Sugarcane"},{id:40,n:"Cotton"},
  {id:118,n:"Coffee Beans"},{id:120,n:"Vegetables"},{id:136,n:"Cocoa"},
  {id:17,n:"Chemicals"},{id:18,n:"Aluminium"},{id:43,n:"Steel"},
  {id:45,n:"Glass"},{id:69,n:"Golden Bars"},{id:73,n:"Ethanol"},
  {id:74,n:"Methane"},{id:12,n:"Diesel"},{id:108,n:"Planks"},
  {id:103,n:"Cement"},{id:102,n:"Bricks"},
  {id:11,n:"Petrol"},{id:19,n:"Plastic"},{id:41,n:"Fabric"},
  {id:20,n:"Processors"},{id:75,n:"Carbon Fibers"},{id:135,n:"Sugar"},
  {id:133,n:"Flour"},{id:139,n:"Fodder"},{id:141,n:"Veg Oil"},
  {id:119,n:"Coffee Powder"},{id:107,n:"Steel Beams"},
  {id:101,n:"Reinforced Concrete"},{id:110,n:"Tools"},
  {id:109,n:"Windows"},{id:9,n:"Eggs"},{id:13,n:"Transport"},
  {id:46,n:"Leather"},
  {id:21,n:"Electronic Comps"},{id:22,n:"Batteries"},
  {id:76,n:"Carbon Composite"},{id:35,n:"Software"},
  {id:115,n:"Cows"},{id:116,n:"Pigs"},{id:134,n:"Butter"},
  {id:137,n:"Dough"},{id:138,n:"Sauce"},{id:60,n:"Underwear"},
  {id:62,n:"Dress"},{id:83,n:"Rocket Fuel"},{id:85,n:"Solid Fuel Booster"},
  {id:142,n:"Salad"},
  {id:23,n:"Displays"},{id:7,n:"Steak"},{id:8,n:"Sausages"},
  {id:117,n:"Milk"},{id:52,n:"Combustion Engine"},
  {id:48,n:"Electric Motor"},{id:50,n:"Basic Interior"},
  {id:79,n:"High Grade E-Comps"},{id:77,n:"Fuselage"},
  {id:78,n:"Wing"},{id:84,n:"Propellant Tank"},
  {id:86,n:"Rocket Engine"},{id:87,n:"Heat Shield"},
  {id:89,n:"Jet Engine"},{id:111,n:"Construction Units"},
  {id:114,n:"Robots"},{id:61,n:"Gloves"},{id:63,n:"Stiletto Heel"},
  {id:65,n:"Sneakers"},{id:49,n:"Luxury Interior"},
  {id:124,n:"Orange Juice"},{id:125,n:"Apple Cider"},{id:126,n:"Ginger Beer"},
  {id:128,n:"Pasta"},{id:132,n:"Cocktails"},{id:143,n:"Samosa"},
  {id:121,n:"Bread"},
  {id:24,n:"Smartphones"},{id:25,n:"Tablets"},{id:27,n:"Monitors"},
  {id:28,n:"Televisions"},{id:47,n:"On-board Computer"},
  {id:51,n:"Car Body"},{id:80,n:"Flight Computer"},
  {id:88,n:"Ion Drive"},{id:82,n:"Attitude Control"},
  {id:112,n:"Bulldozer"},{id:122,n:"Cheese"},{id:140,n:"Chocolate"},
  {id:71,n:"Necklace"},{id:64,n:"Handbags"},{id:70,n:"Luxury Watch"},
  {id:123,n:"Apple Pie"},{id:129,n:"Hamburger"},{id:131,n:"Meat Balls"},
  {id:26,n:"Laptops"},{id:81,n:"Cockpit"},
  {id:90,n:"Sub-orbital 2nd Stage"},{id:92,n:"Orbital Booster"},
  {id:53,n:"Economy E-Car"},{id:54,n:"Luxury E-Car"},
  {id:55,n:"Economy Car"},{id:56,n:"Luxury Car"},
  {id:57,n:"Truck"},{id:99,n:"Satellite"},
  {id:127,n:"Frozen Pizza"},{id:130,n:"Lasagna"},
  {id:97,n:"Single Engine Plane"},{id:98,n:"Quadcopter"},
  {id:91,n:"Sub-orbital Rocket"},{id:95,n:"Jumbo Jet"},
  {id:96,n:"Luxury Jet"},{id:93,n:"Starship"},{id:94,n:"BFR"},
];

const nameMap = {};
ALL_N.forEach(n => nameMap[n.id] = n.n);
const parents = {};
ALL_N.forEach(n => parents[n.id] = []);
ALL_E.forEach(e => { if(!parents[e.t]) parents[e.t]=[]; parents[e.t].push({s:e.s,a:e.a}); });

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

const depthCache = {};
function getDepth(id) {
  if (id === 1) return 0;
  if (depthCache[id] !== undefined) return depthCache[id];
  const ps = parents[id] || [];
  if (!ps.length) { depthCache[id] = 0; return 0; }
  const d = 1 + Math.max(...ps.map(p => getDepth(p.s)));
  depthCache[id] = d; return d;
}

async function analyzeChain(TARGET) {
  const treeNodes = new Set();
  const q = [TARGET];
  while (q.length) {
    const cur = q.shift();
    if (treeNodes.has(cur)) continue;
    treeNodes.add(cur);
    (parents[cur]||[]).forEach(p => { if(p.s !== 1) q.push(p.s); });
  }
  treeNodes.add(1);

  const allIds = [...treeNodes];
  const rates = {};
  const results = await Promise.all(allIds.map(fetchRate));
  results.forEach(r => rates[r.id] = r.rate);

  const name = nameMap[TARGET];
  const depth = getDepth(TARGET);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`=== ${name}（id:${TARGET}）完整依赖树 ===`);
  console.log(`${'='.repeat(50)}\n`);
  console.log(`层级深度: L${depth}  节点数（含Power）: ${treeNodes.size}\n`);

  console.log('节点列表:');
  const sorted = [...treeNodes].sort((a,b) => getDepth(b)-getDepth(a));
  for (const id of sorted) {
    const r = rates[id] || 0;
    const ps = (parents[id]||[]).filter(p => p.s !== 1);
    const recipe = ps.map(p => `${nameMap[p.s]}×${p.a}`).join(' + ') || '(原料)';
    console.log(`  L${getDepth(id)} ${(nameMap[id]||id).padEnd(22)} ${String(r.toFixed(1)).padStart(8)}/hr  ←  ${recipe}`);
  }

  // 迭代收敛：反复剔除利用率<0.2的节点直到稳定
  function calcUtils(activeSet) {
    const result = [];
    for (const a of activeSet) {
      if (a === 1) continue;
      const rateA = rates[a] || 0;
      if (rateA === 0) continue;
      let totalConsumed = 0;
      const consumedBy = [];
      for (const b of activeSet) {
        for (const p of (parents[b]||[])) {
          if (p.s === a) {
            const consumed = (rates[b]||0) * p.a;
            totalConsumed += consumed;
            consumedBy.push(`${nameMap[b]}(${consumed.toFixed(1)})`);
          }
        }
      }
      const util = totalConsumed / rateA;
      result.push({ id: a, name: nameMap[a], depth: getDepth(a), rateA, totalConsumed, util, consumedBy });
    }
    return result;
  }

  let active = new Set(treeNodes);
  let iter = 0;
  const history = [];
  while (true) {
    iter++;
    const utils = calcUtils(active);
    // 排除最终产品自身（TARGET）不参与外购判断
    const toBuy = utils.filter(u => u.id !== TARGET && u.util < 0.2);
    history.push({ iter, removed: toBuy.map(u => u.name), utils });
    if (toBuy.length === 0) break;
    toBuy.forEach(u => active.delete(u.id));
    if (iter > 30) break; // 安全上限
  }

  // 打印迭代过程
  console.log('\n=== 迭代收敛分析 ===\n');
  for (const h of history) {
    if (h.iter === 1) {
      console.log(`【第1轮】全部自产，利用率：`);
    } else {
      console.log(`【第${h.iter}轮】上轮剔除后重算：`);
    }
    h.utils.sort((a,b) => a.util - b.util);
    for (const u of h.utils) {
      const flag = u.id === TARGET ? ' ← 目标产品' : u.util < 0.2 ? ' ⚠️ → 外购' : u.util > 5 ? ' ↑超载' : ' ✓';
      console.log(`  L${u.depth} ${u.name.padEnd(22)} 利用率:${u.util.toFixed(3)}${flag}`);
    }
    if (h.removed.length) console.log(`  → 本轮剔除: ${h.removed.join(', ')}\n`);
    else console.log(`  → 收敛，无新外购节点\n`);
  }

  // 最终结论
  const finalUtils = history[history.length-1].utils;
  const nodeUtils = finalUtils;
  console.log('=== 最终结论 ===');
  const bad = [...treeNodes].filter(id => id !== 1 && !active.has(id)).map(id => nameMap[id]);
  const good = finalUtils.filter(u => u.id !== TARGET);
  console.log(`自产节点（${active.size - 1}个，含${name}）: ${[...active].filter(id=>id!==1).map(id=>nameMap[id]).join(', ')}`);
  console.log(`外购节点（${bad.length}个）: ${bad.join(', ') || '无'}`);
  if (good.length) console.log(`最低自产利用率: ${good.sort((a,b)=>a.util-b.util)[0].name} = ${good[0].util.toFixed(3)}`);

  return { name, depth, treeNodes, nodeUtils, rates };
}

const TARGET = parseInt(process.argv[2]) || 129;
analyzeChain(TARGET).catch(console.error);
