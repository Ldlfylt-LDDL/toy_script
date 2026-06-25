const https = require('https');

// ── 节点和边数据（来自 simco_tree.html）──
const N = [
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
  {id:133,n:"Flour"},{id:139,n:"Fodder"},{id:141,n:"Vegetable Oil"},
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
  {id:29,n:"Plant Research"},{id:30,n:"Energy Research"},
  {id:31,n:"Mining Research"},{id:32,n:"Electronics Research"},
  {id:33,n:"Breeding Research"},{id:34,n:"Chemistry Research"},
  {id:58,n:"Automotive Research"},{id:59,n:"Fashion Research"},
  {id:100,n:"Aerospace Research"},{id:113,n:"Materials Research"},
];

const E = [
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

// ── 图结构 ──
const nameMap = {};
N.forEach(n => nameMap[n.id] = n.n);

// 入边：parents[t] = [{s, a}]
const parents = {};
N.forEach(n => parents[n.id] = []);
E.forEach(e => { if (!parents[e.t]) parents[e.t] = []; parents[e.t].push({s: e.s, a: e.a}); });

// 出边：children[s] = [t, ...]
const children = {};
N.forEach(n => children[n.id] = []);
E.forEach(e => { if (!children[e.s]) children[e.s] = []; children[e.s].push(e.t); });

// ── API 获取 producedAnHour ──
function fetchRate(id) {
  return new Promise((resolve) => {
    const url = `https://www.simcompanies.com/api/v4/en/0/encyclopedia/resources/0/${id}/`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          resolve({ id, rate: j.producedAnHour || 0, name: j.name || nameMap[id] });
        } catch(e) {
          resolve({ id, rate: 0, name: nameMap[id] });
        }
      });
    }).on('error', () => resolve({ id, rate: 0, name: nameMap[id] }));
  });
}

// ── 依赖树（BFS，返回所有祖先节点集合，排除Power=1） ──
function getDeps(rootId) {
  const visited = new Set();
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    (parents[cur] || []).forEach(p => {
      if (!visited.has(p.s)) queue.push(p.s);
    });
  }
  visited.delete(rootId); // 不含自身
  visited.delete(1);      // 不含 Power（唯一L0）
  return visited;
}

// ── 最长路径深度（从Power出发） ──
const depthCache = {};
function getDepth(id) {
  if (id === 1) return 0; // Power = L0
  if (depthCache[id] !== undefined) return depthCache[id];
  const ps = parents[id] || [];
  if (ps.length === 0) { depthCache[id] = 0; return 0; }
  const d = 1 + Math.max(...ps.map(p => getDepth(p.s)));
  depthCache[id] = d;
  return d;
}

// ── 主程序 ──
async function main() {
  const allIds = N.map(n => n.id);
  console.log(`正在拉取 ${allIds.length} 个产品的产量数据...`);

  // 并发拉取，每批20个
  const rates = {};
  for (let i = 0; i < allIds.length; i += 20) {
    const batch = allIds.slice(i, i + 20);
    const results = await Promise.all(batch.map(fetchRate));
    results.forEach(r => { rates[r.id] = r.rate; });
    process.stdout.write(`  ${Math.min(i+20, allIds.length)}/${allIds.length}\r`);
    await new Promise(r => setTimeout(r, 300)); // 避免限速
  }
  console.log('\n数据拉取完成。\n');

  // ── 对所有非Power节点分析 ──
  const results = [];
  for (const node of N) {
    if (node.id === 1) continue; // 跳过Power

    const depth = getDepth(node.id);
    const depSet = getDeps(node.id);
    const nodeCount = depSet.size + 1; // 含自身，不含Power
    const nodeRate = rates[node.id] || 0;

    // 直接父节点的利用率（用于展示）
    const utilRatios = [];
    for (const p of (parents[node.id] || [])) {
      const parentRate = rates[p.s] || 0;
      if (parentRate > 0 && nodeRate > 0) {
        const util = (nodeRate * p.a) / parentRate;
        utilRatios.push({ from: nameMap[p.s], util });
      }
    }

    // 遍历依赖树，收集所有节点集合
    const treeNodes = new Set();
    const bfsQ = [node.id];
    while (bfsQ.length) {
      const cur = bfsQ.shift();
      if (treeNodes.has(cur)) continue;
      treeNodes.add(cur);
      (parents[cur] || []).forEach(p => { if (p.s !== 1) bfsQ.push(p.s); });
    }

    // 对树中每个非Power节点，计算其产出被树内下游节点消耗的总利用率
    // total_util[A] = Σ (rate_B × q_AB) / rate_A，对所有 B∈tree 且 A→B 的边求和
    const nodeUtils = [];
    for (const a of treeNodes) {
      if (a === 1) continue;
      const rateA = rates[a] || 0;
      if (rateA === 0) continue;
      let totalConsumed = 0;
      // 找所有以a为输入、且目标在树中的边
      for (const b of treeNodes) {
        for (const p of (parents[b] || [])) {
          if (p.s === a) {
            const rateB = rates[b] || 0;
            totalConsumed += rateB * p.a;
          }
        }
      }
      if (totalConsumed > 0) {
        nodeUtils.push({ node: a, name: nameMap[a], totalUtil: totalConsumed / rateA });
      }
    }

    // 最小总利用率（整棵树中最薄弱的节点）
    const minUtil = nodeUtils.length > 0 ? Math.min(...nodeUtils.map(u => u.totalUtil)) : null;
    const minUtilEdge = nodeUtils.length > 0 ? nodeUtils.reduce((a, b) => a.totalUtil < b.totalUtil ? a : b) : null;
    const allTreeUtils = nodeUtils; // 兼容后续代码

    results.push({
      id: node.id,
      name: node.n,
      depth,
      nodeCount,
      rate: nodeRate,
      utilRatios,
      minUtil,
      minUtilEdge,
      allTreeUtils,
    });
  }

  // ── 按 depth DESC, nodeCount ASC 排序 ──
  results.sort((a, b) => b.depth - a.depth || a.nodeCount - b.nodeCount);

  // ── 输出所有节点 ──
  console.log('=== 全节点产业链分析（按深度排序）===\n');
  console.log('排名  产品名                      深度  节点数  产量/hr   最低利用率  各入边利用率');
  console.log('----  --------------------------  ----  ------  --------  ----------  -----');

  let rank = 1;
  for (const r of results) {
    const minStr = r.minUtil !== null
      ? (r.minUtil < 0.2 ? `⚠️ ${r.minUtil.toFixed(3)}` : r.minUtil.toFixed(3))
      : '  -   ';
    const utilStr = r.utilRatios.map(u => {
      const flag = u.util < 0.2 ? '⚠' : u.util > 5 ? '↑' : '✓';
      return `${u.from}:${u.util.toFixed(2)}${flag}`;
    }).join('  ');
    console.log(`${String(rank).padStart(3)}   ${r.name.padEnd(26)}  L${String(r.depth).padStart(2)}   ${String(r.nodeCount).padStart(4)}   ${String(r.rate.toFixed(1)).padStart(8)}/hr  ${String(minStr).padStart(10)}  ${utilStr}`);
    rank++;
  }

  // ── 预算内最优（nodeCount ≤ 12，depth最大，minUtil ≥ 0.2） ──
  console.log('\n\n=== 预算内最优候选（节点数 ≤ 12，所有入边利用率 ≥ 0.2）===\n');
  const budget12 = results.filter(r => r.nodeCount <= 12 && (r.minUtil === null || r.minUtil >= 0.2));
  budget12.slice(0, 25).forEach((r, i) => {
    console.log(`${i+1}. ${r.name} — L${r.depth}，${r.nodeCount}个节点，${r.rate.toFixed(1)}/hr，树中最低利用率: ${r.minUtil !== null ? r.minUtil.toFixed(3) : '-'} (${r.minUtilEdge ? r.minUtilEdge.edge : '-'})`);
    r.utilRatios.forEach(u => {
      const flag = u.util < 0.2 ? ' ⚠️ 外购' : u.util > 5 ? ' ↑瓶颈' : ' ✓';
      console.log(`   直接: ${u.from.padEnd(20)} 利用率 ${u.util.toFixed(3)}${flag}`);
    });
    // 显示树中总利用率最低的5个节点
    const worst = [...r.allTreeUtils].sort((a,b) => a.totalUtil - b.totalUtil).slice(0, 5);
    worst.forEach(u => {
      const flag = u.totalUtil < 0.2 ? ' ⚠️' : u.totalUtil > 5 ? ' ↑' : ' ✓';
      console.log(`   树中节点: ${u.name.padEnd(25)} 总利用率 ${u.totalUtil.toFixed(3)}${flag}`);
    });
  });

  // ── 节点数 ≤ 12，允许有低利用率边（标注需外购） ──
  console.log('\n\n=== 预算内候选（节点数 ≤ 12，含需外购的边）===\n');
  const budget12All = results.filter(r => r.nodeCount <= 12);
  budget12All.slice(0, 30).forEach((r, i) => {
    const badNodes = r.allTreeUtils.filter(u => u.totalUtil < 0.2).map(u => u.name);
    const tag = badNodes.length > 0 ? ` [总利用率不足: ${badNodes.slice(0,3).join(', ')}${badNodes.length>3?'...':''}]` : ' [全树合格]';
    console.log(`${i+1}. ${r.name} — L${r.depth}，${r.nodeCount}节点，最低总利用率${r.minUtil !== null ? r.minUtil.toFixed(3) : '-'}${tag}`);
  });
}

main().catch(console.error);
