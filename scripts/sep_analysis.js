#!/usr/bin/env node
/**
 * sep_analysis.js — Q4 SEP 每栋建筑PPLH分析（使用缓存价格）
 *
 * 依赖: data/vwap_cache.json （先运行 node scripts/fetch_prices.js）
 *
 * 用法:
 *   node scripts/sep_analysis.js           # 使用30天VWAP（默认）
 *   node scripts/sep_analysis.js --89d     # 使用89天VWAP
 *   node scripts/sep_analysis.js --today   # 使用今日现价（需要API）
 *
 * PPLH = rate × sell_price × (1-0.04) − input_costs_per_hour − wages
 * 但对于链内消耗，sell_price = 该材料市场买价（节省外购成本）
 */

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../data/vwap_cache.json');
const USE_89D = process.argv.includes('--89d');
const LABEL = USE_89D ? '89天' : '30天';

// ─── 加载缓存 ──────────────────────────────────────────────────────────────

if (!fs.existsSync(CACHE_FILE)) {
  console.error('❌ 找不到价格缓存，请先运行: node scripts/fetch_prices.js');
  process.exit(1);
}

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
console.log(`\n📂 价格数据: ${cache.fetched_at}  (使用 ${LABEL} VWAP)\n`);

function getPrice(id, q) {
  const key = `${id}_${q}`;
  const r = cache.prices[key];
  if (!r) return null;
  return USE_89D ? r.vwap89 : r.vwap30;
}

function getBuilding(id) {
  return cache.buildings[id] || null;
}

// ─── SEP Q4 链路定义 ────────────────────────────────────────────────────────
// 每个节点: id, quality, name, 以及用于PPLH计算的信息
// inputs: 从市场买的输入材料 { id, q, qty_per_unit }
// 如果自产，则用自产成本（递归）；此处简化为买市场价计算"节省多少"

// SEP Q4 质量级联: Q4←Q3←Q2←Q1←Q0
// quality_offset: 该节点在级联中的层级（决定其输入应为什么品质）

const SEP_NODES = [
  // ── 终端 ──
  {
    id: 97, q: 4, name: 'SEP Hangar', layer: 0,
    // 直接输入（外购时的市场价格）
    inputs: [
      { id: 77, q: 3, qty: 8   },   // Fuselage
      { id: 78, q: 3, qty: 2   },   // Wing
      { id: 81, q: 3, qty: 1   },   // Cockpit
      { id: 52, q: 3, qty: 1   },   // Combustion Engine
    ],
  },
  // ── Q3 组件 ──
  {
    id: 77, q: 3, name: 'Fuselage', layer: 1,
    inputs: [{ id: 76, q: 2, qty: 40 }],  // Carbon Composite
  },
  {
    id: 78, q: 3, name: 'Wing', layer: 1,
    inputs: [
      { id: 76, q: 2, qty: 30 },  // Carbon Composite
      { id: 18, q: 2, qty: 5  },  // Aluminium
    ],
  },
  {
    id: 81, q: 3, name: 'Cockpit', layer: 1,
    inputs: [
      { id: 79, q: 2, qty: 4  },  // HGE
      { id: 23, q: 2, qty: 8  },  // Displays
      { id: 50, q: 2, qty: 1  },  // Basic Interior（外购）
    ],
  },
  {
    id: 52, q: 3, name: 'Combustion Engine', layer: 1,
    inputs: [
      { id: 43, q: 2, qty: 6  },  // Steel
      { id: 17, q: 2, qty: 5  },  // Chemicals
      { id: 21, q: 2, qty: 5  },  // Electronic Comps
    ],
  },
  // ── Q2 中间件 ──
  {
    id: 76, q: 2, name: 'Carbon Composite', layer: 2,
    inputs: [{ id: 75, q: 1, qty: 8 }],  // Carbon Fibers
  },
  {
    id: 18, q: 2, name: 'Aluminium', layer: 2,
    inputs: [{ id: 15, q: 1, qty: 1 }],  // Bauxite （+ Power，忽略）
  },
  {
    id: 79, q: 2, name: 'High Grade E-Comps', layer: 2,
    inputs: [
      { id: 16, q: 1, qty: 4    },  // Silicon
      { id: 17, q: 1, qty: 3    },  // Chemicals
      { id: 69, q: 1, qty: 0.0625}, // Golden Bars
    ],
  },
  {
    id: 23, q: 2, name: 'Displays', layer: 2,
    inputs: [
      { id: 16, q: 1, qty: 5 },  // Silicon
      { id: 17, q: 1, qty: 4 },  // Chemicals
    ],
  },
  {
    id: 43, q: 2, name: 'Steel', layer: 2,
    inputs: [
      { id: 42, q: 1, qty: 1   },  // Iron Ore
      { id: 17, q: 1, qty: 0.1 },  // Chemicals
    ],
  },
  {
    id: 21, q: 2, name: 'Electronic Comps', layer: 2,
    inputs: [
      { id: 16, q: 1, qty: 3 },  // Silicon
      { id: 17, q: 1, qty: 1 },  // Chemicals
    ],
  },
  // ── Q1 原料 ──
  {
    id: 75, q: 1, name: 'Carbon Fibers', layer: 3,
    inputs: [{ id: 10, q: 0, qty: 0.1 }],  // Crude Oil Q0
  },
  {
    id: 15, q: 1, name: 'Bauxite', layer: 3,
    inputs: [],  // 纯矿山
  },
  {
    id: 16, q: 1, name: 'Silicon', layer: 3,
    inputs: [{ id: 44, q: 0, qty: 2 }],  // Sand Q0
  },
  {
    id: 17, q: 1, name: 'Chemicals', layer: 3,
    inputs: [{ id: 14, q: 0, qty: 1 }],  // Minerals Q0
  },
  {
    id: 42, q: 1, name: 'Iron Ore', layer: 3,
    inputs: [],  // 纯矿山
  },
  {
    id: 14, q: 0, name: 'Minerals', layer: 4,
    inputs: [],  // 纯矿山（PPLH = rate × price - wages）
  },
  {
    id: 10, q: 0, name: 'Crude Oil', layer: 4,
    inputs: [],  // 纯矿山
  },
  {
    id: 44, q: 0, name: 'Sand', layer: 4,
    inputs: [],  // 纯矿山
  },
];

// 外购节点（不计算PPLH，但需要市场买价）
const EXTERNAL_BUY = new Set([
  '50_2',   // Basic Interior Q2
  '69_1',   // Golden Bars Q1
]);

// ─── PPLH 计算 ─────────────────────────────────────────────────────────────

function calcPPLH(node) {
  const b = getBuilding(node.id);
  if (!b || !b.rate) {
    return { pplh: null, note: '无建筑数据' };
  }

  const rate = b.rate;
  const wages = b.wages || 0;

  // 输出售价（市场出售时）
  const sellPrice = getPrice(node.id, node.q);

  // 输入成本（每小时）
  let inputCostPerHr = 0;
  const inputDetails = [];

  for (const inp of node.inputs) {
    const key = `${inp.id}_${inp.q}`;
    const isExternal = EXTERNAL_BUY.has(key);
    const price = getPrice(inp.id, inp.q);
    if (price == null) {
      inputDetails.push({ key, qty: inp.qty, price: null, cost: null, note: '无价格' });
      continue;
    }
    const costPerHr = inp.qty * price * rate;
    inputCostPerHr += costPerHr;
    inputDetails.push({ key, name: cache.prices[key]?.name || key, qty: inp.qty, price, cost: costPerHr, external: isExternal });
  }

  const revenuePerHr = sellPrice ? sellPrice * 0.96 * rate : null;
  const pplh = revenuePerHr != null ? revenuePerHr - inputCostPerHr - wages : null;

  return {
    pplh,
    rate,
    wages,
    sellPrice,
    revenuePerHr,
    inputCostPerHr,
    inputDetails,
  };
}

// ─── 主输出 ───────────────────────────────────────────────────────────────

console.log('══════════════════════════════════════════════════════════════');
console.log(`  Q4 Single Engine Plane — 每栋建筑 PPLH 分析`);
console.log(`  价格基准: ${LABEL} VWAP  |  数据日期: ${cache.fetched_at}`);
console.log('══════════════════════════════════════════════════════════════\n');

const results = [];

for (const node of SEP_NODES) {
  if (EXTERNAL_BUY.has(`${node.id}_${node.q}`)) continue;
  const r = calcPPLH(node);
  results.push({ node, ...r });
}

// 排序（Hangar放第一，其余按PPLH降序）
const hangar = results.find(r => r.node.id === 97);
const others = results.filter(r => r.node.id !== 97).sort((a, b) => (b.pplh || 0) - (a.pplh || 0));
const sorted = [hangar, ...others].filter(Boolean);

// 输出详细表
console.log('建筑名                     | Q | PPLH/hr   | 产率/hr  | 售价      | 输入成本/hr | 工资/hr');
console.log('─'.repeat(90));

let cumulative = 0;
for (const r of sorted) {
  const pplhStr = r.pplh != null ? (r.pplh >= 0 ? '+' : '') + r.pplh.toFixed(0) : 'N/A';
  const rateStr = r.rate != null ? r.rate.toFixed(3) : '-';
  const sellStr = r.sellPrice != null ? `$${r.sellPrice.toFixed(0)}` : 'N/A';
  const inputStr = `$${r.inputCostPerHr.toFixed(0)}`;
  const wageStr = `$${(r.wages || 0).toFixed(0)}`;
  const marker = r.pplh != null && r.pplh > 0 ? ' ●' : (r.pplh != null && r.pplh > -100 ? ' ◑' : '');

  console.log(
    `${r.node.name.padEnd(26)} | Q${r.node.q} | ${pplhStr.padStart(9)} | ${rateStr.padStart(8)} | ${sellStr.padStart(9)} | ${inputStr.padStart(11)} | ${wageStr}${marker}`
  );
  if (r.pplh != null) cumulative += r.pplh;
}

console.log('─'.repeat(90));
console.log(`${'完全VI 链总PPLH'.padEnd(26)} |   | ${('+' + cumulative.toFixed(0)).padStart(9)} |`);

// ─── 槽位推荐 ─────────────────────────────────────────────────────────────

console.log('\n\n══════════════════════════════════════════════════════════════');
console.log('  建筑槽位优先级推荐');
console.log('══════════════════════════════════════════════════════════════\n');

const ranked = [...others].sort((a, b) => (b.pplh || -9999) - (a.pplh || -9999));

const positive = ranked.filter(r => r.pplh != null && r.pplh > 0);
const marginal = ranked.filter(r => r.pplh != null && r.pplh >= -200 && r.pplh <= 0);
const negative = ranked.filter(r => r.pplh != null && r.pplh < -200);

console.log('【必建 - 正收益】');
let cumulPplh = (hangar?.pplh || 0);
console.log(`  [强制] SEP Hangar  ${(hangar?.pplh || 0) >= 0 ? '+' : ''}${(hangar?.pplh || 0).toFixed(0)}/hr  (产品终端，必建)`);
for (const r of positive) {
  cumulPplh += r.pplh;
  console.log(`  [+${String(positive.indexOf(r) + 1).padStart(2)}] ${r.node.name.padEnd(22)} ${('+' + r.pplh.toFixed(0)).padStart(8)}/hr  累计: ${cumulPplh.toFixed(0)}/hr`);
}

console.log('\n【条件建 - 小幅亏损，波动后可能转正】');
for (const r of marginal) {
  cumulPplh += r.pplh;
  const sellP = r.sellPrice || 0;
  // 保本价 = (inputCostPerHr + wages) / (rate * 0.96)
  const breakeven = r.rate ? (r.inputCostPerHr + r.wages) / (r.rate * 0.96) : null;
  const beStr = breakeven != null ? `保本价: $${breakeven.toFixed(0)}  (现价: $${sellP.toFixed(0)})` : '';
  console.log(`  [?] ${r.node.name.padEnd(22)} ${(r.pplh >= 0 ? '+' : '') + r.pplh.toFixed(0)}/hr  ${beStr}`);
}

if (negative.length > 0) {
  console.log('\n【暂不建 - 亏损超$200/hr】');
  for (const r of negative) {
    console.log(`  [✗] ${r.node.name.padEnd(22)} ${r.pplh.toFixed(0)}/hr`);
  }
}

// ─── 11-13槽方案 ──────────────────────────────────────────────────────────

console.log('\n\n══════════════════════════════════════════════════════════════');
console.log('  11 → 12 → 13 槽扩展方案');
console.log('══════════════════════════════════════════════════════════════\n');

const allRanked = [hangar, ...ranked].filter(Boolean);
for (let slots = 11; slots <= 13; slots++) {
  const chosen = allRanked.slice(0, slots);
  const total = chosen.reduce((s, r) => s + (r.pplh || 0), 0);
  const added = allRanked[slots - 1];
  const addedStr = added ? `${added.node.name} (${(added.pplh >= 0 ? '+' : '')}${added.pplh.toFixed(0)}/hr)` : '-';
  console.log(`${slots}槽:  累计 PPLH ${total.toFixed(0)}/hr  |  新增: ${addedStr}`);
}

console.log('\n💡 注意事项:');
console.log('   - Golden Bars (id:69) 是不可VI的外购成本，已计入输入成本');
console.log('   - Basic Interior 标记为外购，已计入 Cockpit 输入成本');
console.log('   - 价格波动较大的节点：Wing、Cockpit（查看今日价格后决定）');
console.log('   - Power/电力成本未计入（对纯矿山节点有影响）\n');
