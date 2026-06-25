#!/usr/bin/env node
/**
 * fetch_prices.js — 获取航空/电子链路所有材料的长期VWAP + 建筑产率/工资
 * 结果保存到 data/vwap_cache.json
 *
 * 用法: node scripts/fetch_prices.js
 *
 * 输出格式:
 *   {
 *     fetched_at: "YYYY-MM-DD",
 *     prices: {
 *       "id_q": { id, q, name, vwap30, vwap89, vol30 }
 *     },
 *     buildings: {
 *       "id": { id, name, rate, wages, inputs: [{id, qty}] }
 *     }
 *   }
 */

const fs = require('fs');
const path = require('path');

const DELAY_MS = 350;
const OUTPUT = path.join(__dirname, '../data/vwap_cache.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── 价格抓取 ──────────────────────────────────────────────────────────────

async function fetchCandles(id, q) {
  try {
    const res = await fetch(
      `https://api.simcotools.com/v1/realms/0/market/resources/${id}/${q}/candlesticks`
    );
    await sleep(DELAY_MS);
    const data = await res.json();
    return data.candlesticks || [];
  } catch (e) {
    return [];
  }
}

function calcVwap(candles, days) {
  if (!candles || !candles.length) return null;
  const recent = candles.slice(-days);
  const totalVol = recent.reduce((a, d) => a + (d.volume || 0), 0);
  if (!totalVol) return null;
  const price = recent.reduce((s, d) => s + (d.vwap || 0) * (d.volume || 0), 0) / totalVol;
  const vol = totalVol / recent.length;
  return { price, vol };
}

// ─── 建筑数据抓取 ──────────────────────────────────────────────────────────

async function fetchBuilding(id) {
  try {
    const res = await fetch(
      `https://www.simcompanies.com/api/v4/en/0/encyclopedia/resources/0/${id}/`
    );
    await sleep(DELAY_MS);
    const d = await res.json();
    // 统一字段名
    d.wages = d.baseSalary || 0;
    d.inputs = (d.producedFrom || []).map(pf => ({
      id: pf.resource?.db_letter,
      qty: pf.amount,
    }));
    return d;
  } catch (e) {
    return null;
  }
}

// ─── 材料列表 ──────────────────────────────────────────────────────────────
// 格式: { id, q, name }
// 覆盖: SEP / JJ / Satellite / 电子链路

const MATERIALS = [
  // === Q4 终端产品 ===
  { id: 97, q: 4, name: 'Single Engine Plane' },
  { id: 95, q: 4, name: 'Jumbo Jet' },
  { id: 96, q: 4, name: 'Luxury Jet' },
  { id: 99, q: 4, name: 'Satellite' },

  // === Q3 航空中间件 ===
  { id: 77, q: 3, name: 'Fuselage' },
  { id: 78, q: 3, name: 'Wing' },
  { id: 81, q: 3, name: 'Cockpit' },
  { id: 52, q: 3, name: 'Combustion Engine' },
  { id: 89, q: 3, name: 'Jet Engine' },
  { id: 79, q: 3, name: 'High Grade E-Comps' },  // HGE Q3 (用于Satellite链)
  { id: 80, q: 3, name: 'Flight Computer' },
  { id: 82, q: 3, name: 'Attitude Control' },
  { id: 88, q: 3, name: 'Ion Drive' },

  // === Q2 中间件 ===
  { id: 76, q: 2, name: 'Carbon Composite' },
  { id: 18, q: 2, name: 'Aluminium' },
  { id: 79, q: 2, name: 'High Grade E-Comps' },  // HGE Q2 (用于SEP/JJ链)
  { id: 23, q: 2, name: 'Displays' },
  { id: 50, q: 2, name: 'Basic Interior' },
  { id: 43, q: 2, name: 'Steel' },
  { id: 17, q: 2, name: 'Chemicals' },
  { id: 21, q: 2, name: 'Electronic Comps' },
  { id: 19, q: 2, name: 'Plastic' },
  { id: 41, q: 2, name: 'Fabric' },
  { id: 22, q: 2, name: 'Batteries' },
  { id: 20, q: 2, name: 'Processors' },
  { id: 47, q: 2, name: 'On-board Computer' },
  { id: 48, q: 2, name: 'Electric Motor' },

  // === Q1 原料 ===
  { id: 75, q: 1, name: 'Carbon Fibers' },
  { id: 15, q: 1, name: 'Bauxite' },
  { id: 16, q: 1, name: 'Silicon' },
  { id: 17, q: 1, name: 'Chemicals' },
  { id: 69, q: 1, name: 'Golden Bars' },
  { id: 42, q: 1, name: 'Iron Ore' },
  { id: 14, q: 1, name: 'Minerals' },
  { id: 40, q: 1, name: 'Cotton' },

  // === Q0 原料 ===
  { id: 10, q: 0, name: 'Crude Oil' },
  { id: 44, q: 0, name: 'Sand' },
  { id: 2,  q: 0, name: 'Water' },
  { id: 14, q: 0, name: 'Minerals' },
  { id: 66, q: 0, name: 'Seeds' },
  { id: 68, q: 0, name: 'Gold Ore' },
  { id: 42, q: 0, name: 'Iron Ore' },
];

// ─── 建筑列表 (需要获取产率和工资的资源ID) ───────────────────────────────────

const BUILDING_IDS = [
  // 航空终端
  97, 95, 96,
  // Q3 组件
  77, 78, 81, 52, 89, 79, 80, 82, 88,
  // Q2 中间件
  76, 18, 23, 50, 43, 17, 21, 19, 41, 22, 20, 47, 48,
  // Q1 原料
  75, 15, 16, 42, 14, 40, 69,
  // Q0 原料
  10, 44, 2, 66, 68,
];

// ─── 主流程 ───────────────────────────────────────────────────────────────

(async () => {
  const startTime = Date.now();

  // 1. 抓取价格
  console.log(`\n📊 抓取 ${MATERIALS.length} 种材料价格...\n`);
  const prices = {};

  for (const m of MATERIALS) {
    const key = `${m.id}_${m.q}`;
    process.stdout.write(`  [${key.padEnd(6)}] ${m.name.padEnd(28)}`);
    const candles = await fetchCandles(m.id, m.q);
    const v30 = calcVwap(candles, 30);
    const v89 = calcVwap(candles, 89);

    if (v30) {
      process.stdout.write(`$${v30.price.toFixed(2).padStart(10)}  (30d)  $${(v89 ? v89.price : 0).toFixed(2).padStart(10)}  (89d)  vol:${v30.vol.toFixed(1)}/day\n`);
    } else {
      process.stdout.write('N/A\n');
    }

    prices[key] = {
      id: m.id, q: m.q, name: m.name,
      vwap30: v30 ? v30.price : null,
      vwap89: v89 ? v89.price : null,
      vol30:  v30 ? v30.vol  : null,
    };
  }

  // 2. 抓取建筑数据
  console.log(`\n🏭 抓取 ${BUILDING_IDS.length} 栋建筑产率/工资...\n`);
  const buildings = {};

  for (const id of BUILDING_IDS) {
    process.stdout.write(`  [id:${String(id).padEnd(4)}] `);
    const data = await fetchBuilding(id);
    if (data && data.producedAnHour != null) {
      const name = data.name || data.shortName || `Resource ${id}`;
      console.log(`${name.padEnd(30)} rate:${String(data.producedAnHour).padStart(8)}/hr  wages:$${data.wages || 0}`);
      buildings[id] = {
        id,
        name,
        rate: data.producedAnHour,
        wages: data.wages || 0,
        inputs: (data.inputs || []).map(inp => ({ id: inp.id || inp.resourceId, qty: inp.amount || inp.qty || 0 })),
      };
    } else {
      console.log('N/A');
      buildings[id] = { id, name: `Resource ${id}`, rate: null, wages: null, inputs: [] };
    }
  }

  // 3. 保存
  const output = {
    fetched_at: new Date().toISOString().split('T')[0],
    elapsed_s: Math.round((Date.now() - startTime) / 1000),
    prices,
    buildings,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

  // 4. 摘要表
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  价格摘要（30天 vs 89天 VWAP）');
  console.log('═══════════════════════════════════════════════════════');
  console.log('品名                         Q  | 30天均价    | 89天均价    | 日均量');
  console.log('─'.repeat(70));

  for (const [, r] of Object.entries(prices)) {
    const p30 = r.vwap30 != null ? `$${r.vwap30.toFixed(2)}` : 'N/A';
    const p89 = r.vwap89 != null ? `$${r.vwap89.toFixed(2)}` : 'N/A';
    const vol = r.vol30  != null ? `${r.vol30.toFixed(1)}/day` : '-';
    const drift = (r.vwap30 && r.vwap89)
      ? ((r.vwap30 - r.vwap89) / r.vwap89 * 100).toFixed(1) + '%'
      : '';
    const flag = Math.abs(parseFloat(drift)) > 15 ? ' ⚠️' : '';
    console.log(
      `${r.name.padEnd(28)} Q${r.q} | ${p30.padEnd(11)} | ${p89.padEnd(11)} | ${vol.padEnd(10)} ${drift}${flag}`
    );
  }

  console.log(`\n✅ 保存至 ${OUTPUT}  (共 ${Object.keys(prices).length} 条价格, ${Object.keys(buildings).length} 栋建筑)`);
  console.log(`   用时 ${output.elapsed_s}s`);
})();
