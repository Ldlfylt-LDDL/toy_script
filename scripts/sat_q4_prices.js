#!/usr/bin/env node
/**
 * sat_q4_prices.js — 获取Q4卫星所需各品质中间件价格
 *
 * Q4 Satellite 品质级联：
 *   Q4 Satellite ← Q3 直接组件
 *   Q3 组件 ← Q2 输入
 *   Q2 组件 ← Q1 输入
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

const FETCHES = [
  // Q3 直接组件 (Satellite直接消耗)
  { id: 80, q: 3, name: 'Flight Computer Q3',   role: 'direct_q3' },
  { id: 88, q: 3, name: 'Ion Drive Q3',          role: 'direct_q3' },
  { id: 79, q: 3, name: 'HGE Q3',               role: 'direct_q3' },
  { id: 82, q: 3, name: 'Attitude Control Q3',   role: 'direct_q3' },

  // Q2 中间件 (输入到Q3组件)
  // HGE Q3 inputs: Silicon×4, Chemicals×3, Golden Bars×0.0625
  { id: 16, q: 2, name: 'Silicon Q2',            role: 'mid_q2' },
  { id: 17, q: 2, name: 'Chemicals Q2',          role: 'mid_q2' },
  { id: 69, q: 1, name: 'Golden Bars Q1',        role: 'mid_q2' }, // GB usually Q1 only
  // Ion Drive Q3 inputs: HGE×8, Batteries×30, Chemicals×15
  { id: 79, q: 2, name: 'HGE Q2',               role: 'mid_q2' },
  { id: 22, q: 2, name: 'Batteries Q2',          role: 'mid_q2' },
  // FC Q3 inputs: HGE×4, On-board Computer×2
  { id: 47, q: 2, name: 'On-board Computer Q2',  role: 'mid_q2' },
  // AC Q3 inputs: Steel×3, Batteries×5, Electric Motor×3
  { id: 43, q: 2, name: 'Steel Q2',              role: 'mid_q2' },
  { id: 48, q: 2, name: 'Electric Motor Q2',     role: 'mid_q2' },
  // OBC inputs: Processors×2, EC×3
  { id: 20, q: 2, name: 'Processors Q2',         role: 'mid_q2' },
  { id: 21, q: 2, name: 'Electronic Comps Q2',   role: 'mid_q2' },
  // EM inputs: Steel×2, EC×3 (already listed)

  // Q1 原料
  { id: 16, q: 1, name: 'Silicon Q1',            role: 'raw_q1' },
  { id: 17, q: 1, name: 'Chemicals Q1',          role: 'raw_q1' },
  { id: 42, q: 1, name: 'Iron Ore Q1',           role: 'raw_q1' },
  { id: 14, q: 1, name: 'Minerals Q1',           role: 'raw_q1' },

  // Q0 原料
  { id: 44, q: 0, name: 'Sand Q0',               role: 'raw_q0' },
];

(async () => {
  console.log('获取 Q4 Satellite 各品质中间件30天均价...\n');
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
  console.log('品名                        | 价格      | 日均量');
  console.log('-'.repeat(58));
  for (const r of results) {
    const pStr = r.price ? `$${r.price.toFixed(2)}` : 'N/A';
    const vStr = r.vol ? `${r.vol.toFixed(0)}/day` : '-';
    console.log(`${r.name.padEnd(28)}| ${pStr.padEnd(10)}| ${vStr}`);
  }
})();
