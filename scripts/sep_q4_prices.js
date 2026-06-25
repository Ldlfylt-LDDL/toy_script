#!/usr/bin/env node
/**
 * sep_q4_prices.js — 获取Q4单引擎飞机所需各品质中间件价格
 *
 * Q4 SEP 品质级联：
 *   Q4 SEP ← Q3 直接组件
 *   Q3 组件 ← Q2 输入
 *   Q2 组件 ← Q1 输入
 *   Q1 组件 ← Q0 原料
 */

const DELAY_MS = 500;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetch30DayAvg(id, q) {
  try {
    const res = await fetch(
      `https://api.simcotools.com/v1/realms/0/market/resources/${id}/${q}/candlesticks`
    );
    await sleep(DELAY_MS);
    const data = await res.json();
    const candles = data.candlesticks;
    if (!candles || !candles.length) return null;
    const recent = candles.slice(-30);
    const totalVol = recent.reduce((a, d) => a + (d.volume || 0), 0);
    if (!totalVol) return null;
    const wavg = recent.reduce((s, d) => s + (d.vwap || 0) * (d.volume || 0), 0) / totalVol;
    const dailyVol = totalVol / recent.length;
    return { price: wavg, vol: dailyVol };
  } catch (e) {
    return null;
  }
}

// (id, quality, name, role)
const FETCHES = [
  // Q3 直接组件 (SEP直接消耗)
  { id: 77, q: 3, name: 'Fuselage Q3',          role: 'direct_q3' },
  { id: 78, q: 3, name: 'Wing Q3',               role: 'direct_q3' },
  { id: 81, q: 3, name: 'Cockpit Q3',            role: 'direct_q3' },
  { id: 52, q: 3, name: 'Combustion Engine Q3',  role: 'direct_q3' },

  // Q2 中间件 (输入到Q3组件)
  { id: 76, q: 2, name: 'Carbon Composite Q2',   role: 'mid_q2' },
  { id: 18, q: 2, name: 'Aluminium Q2',          role: 'mid_q2' },
  { id: 79, q: 2, name: 'HGE Q2',               role: 'mid_q2' },
  { id: 23, q: 2, name: 'Displays Q2',           role: 'mid_q2' },
  { id: 17, q: 2, name: 'Chemicals Q2',          role: 'mid_q2' },
  { id: 21, q: 2, name: 'Electronic Comps Q2',   role: 'mid_q2' },
  { id: 50, q: 2, name: 'Basic Interior Q2',     role: 'bought' },  // 外购

  // Q1 原料 (输入到Q2组件)
  { id: 75, q: 1, name: 'Carbon Fibers Q1',      role: 'raw_q1' },
  { id: 15, q: 1, name: 'Bauxite Q1',            role: 'raw_q1' },
  { id: 16, q: 1, name: 'Silicon Q1',            role: 'raw_q1' },
  { id: 14, q: 1, name: 'Minerals Q1',           role: 'raw_q1' },

  // Q0 原料 (已知，仅作对比)
  { id: 10, q: 0, name: 'Crude Oil Q0',          role: 'raw_q0' },
  { id: 44, q: 0, name: 'Sand Q0',               role: 'raw_q0' },

  // 外购参考价（Golden Bars Q1, Steel Q2）
  { id: 69, q: 1, name: 'Golden Bars Q1',        role: 'bought' },
];

(async () => {
  console.log('获取 Q4 SEP 各品质中间件30天均价...\n');
  const results = [];

  for (const item of FETCHES) {
    process.stdout.write(`  ${item.name}...`);
    const p = await fetch30DayAvg(item.id, item.q);
    if (p) {
      console.log(` $${p.price.toFixed(2)} (vol ${p.vol.toFixed(0)}/day)`);
      results.push({ ...item, price: p.price, vol: p.vol });
    } else {
      console.log(' N/A');
      results.push({ ...item, price: null, vol: null });
    }
  }

  console.log('\n===== 汇总表 =====');
  console.log('品名                      | 价格      | 日均量');
  console.log('-'.repeat(55));
  for (const r of results) {
    const pStr = r.price ? `$${r.price.toFixed(2)}` : 'N/A';
    const vStr = r.vol ? `${r.vol.toFixed(0)}/day` : '-';
    console.log(`${r.name.padEnd(26)}| ${pStr.padEnd(10)}| ${vStr}`);
  }
})();
