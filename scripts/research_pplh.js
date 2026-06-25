#!/usr/bin/env node
/**
 * research_pplh.js — 研究产品每5天VWAP下的PPLH（100%科研加成）
 *
 * PPLH = rate × (1 + bonus) × VWAP × 0.96 − wages
 * 100%科研加成: rate × 2 × VWAP × 0.96 − wages
 *
 * 用法: node scripts/research_pplh.js
 */

const fs = require('fs');
const path = require('path');

const CANDLES = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/candlestick_data.json')));
const BONUS = 1.0;  // 100% 科研加成

const PRODUCTS = [
  { id: 29,  name: 'Plant Research',       rate: 5.2147, wages: 448.5 },
  { id: 30,  name: 'Energy Research',      rate: 3.6989, wages: 586.5 },
  { id: 31,  name: 'Mining Research',      rate: 3.3627, wages: 586.5 },
  { id: 32,  name: 'Electronics Research', rate: 2.6901, wages: 586.5 },
  { id: 33,  name: 'Breeding Research',    rate: 4.1700, wages: 414.0 },
  { id: 34,  name: 'Chemistry Research',   rate: 5.0967, wages: 414.0 },
  { id: 35,  name: 'Software',             rate: 6.3890, wages: 586.5 },
  { id: 58,  name: 'Automotive Research',  rate: 4.6609, wages: 552.0 },
  { id: 59,  name: 'Fashion Research',     rate: 7.3875, wages: 448.5 },
  { id: 100, name: 'Aerospace Research',   rate: 0.3823, wages: 517.5 },
  { id: 113, name: 'Materials Research',   rate: 3.7067, wages: 414.0 },
  { id: 145, name: 'Recipes',              rate: 4.2049, wages: 517.5 },
];

function calcVwap(candles) {
  const totalVol = candles.reduce((a, c) => a + (c.volume || 0), 0);
  if (!totalVol) return null;
  return candles.reduce((s, c) => s + (c.vwap || 0) * (c.volume || 0), 0) / totalVol;
}

function calcPplh(rate, wages, vwap, bonus) {
  return rate * (1 + bonus) * vwap * 0.96 - wages;
}

// 按每5天分窗口
function getWindows(candles) {
  const windows = [];
  for (let i = 0; i + 4 < candles.length; i += 5) {
    const slice = candles.slice(i, i + 5);
    const vwap = calcVwap(slice);
    const startDate = slice[0].date.slice(0, 10);
    const endDate = slice[slice.length - 1].date.slice(0, 10);
    windows.push({ startDate, endDate, vwap });
  }
  return windows;
}

// 收集所有时间窗口（以第一个产品的日期为基准）
const baseCandles = CANDLES[String(PRODUCTS[0].id)];
const windows = getWindows(baseCandles);

// 输出表格
console.log('\n═══════════════════════════════════════════════════════════════════════════════════════');
console.log(`  研究产品 PPLH — 科研加成 100%，每5天VWAP`);
console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');

// 表头
const header = '日期区间         | ' + PRODUCTS.map(p => p.name.slice(0, 10).padStart(10)).join(' | ');
console.log(header);
console.log('─'.repeat(header.length));

// 每个5天窗口
for (const win of windows) {
  const row = [`${win.startDate}~${win.endDate.slice(5)}`.padEnd(17)];
  for (const prod of PRODUCTS) {
    const candles = CANDLES[String(prod.id)];
    const idx = candles.findIndex(c => c.date.slice(0, 10) === win.startDate);
    if (idx === -1) { row.push('       N/A'); continue; }
    const slice = candles.slice(idx, idx + 5);
    const vwap = calcVwap(slice);
    if (!vwap) { row.push('       N/A'); continue; }
    const pplh = calcPplh(prod.rate, prod.wages, vwap, BONUS);
    row.push((pplh >= 0 ? '+' : '') + pplh.toFixed(0).padStart(9));
  }
  console.log(row.join(' | '));
}

// 最新5天排名
console.log('\n\n══════════════════════════════════════════');
console.log('  最新5天 PPLH 排名（科研加成 100%）');
console.log('══════════════════════════════════════════\n');

const lastWin = windows[windows.length - 1];
const ranking = [];
for (const prod of PRODUCTS) {
  const candles = CANDLES[String(prod.id)];
  const idx = candles.findIndex(c => c.date.slice(0, 10) === lastWin.startDate);
  if (idx === -1) continue;
  const slice = candles.slice(idx, idx + 5);
  const vwap = calcVwap(slice);
  if (!vwap) continue;
  const pplh = calcPplh(prod.rate, prod.wages, vwap, BONUS);
  const breakeven = prod.wages / (prod.rate * (1 + BONUS) * 0.96);
  ranking.push({ name: prod.name, pplh, vwap, breakeven });
}
ranking.sort((a, b) => b.pplh - a.pplh);

console.log('排名 | 产品                     | PPLH/hr  | VWAP     | 保本价');
console.log('─'.repeat(68));
ranking.forEach((r, i) => {
  const flag = r.pplh > 0 ? ' ●' : ' ✗';
  console.log(
    String(i + 1).padStart(4) + ' | ' +
    r.name.padEnd(24) + ' | ' +
    ((r.pplh >= 0 ? '+' : '') + r.pplh.toFixed(0)).padStart(8) + ' | ' +
    ('$' + r.vwap.toFixed(2)).padStart(8) + ' | ' +
    ('$' + r.breakeven.toFixed(2)).padStart(8) + flag
  );
});

// 趋势：最近vs早期
console.log('\n\n══════════════════════════════════════════');
console.log('  趋势：最新5天 vs 最早5天 PPLH 变化');
console.log('══════════════════════════════════════════\n');

const firstWin = windows[0];
console.log('产品                     | 最早期     | 最新期     | 变化');
console.log('─'.repeat(60));
for (const prod of PRODUCTS) {
  const candles = CANDLES[String(prod.id)];
  const getWinPplh = (win) => {
    const idx = candles.findIndex(c => c.date.slice(0, 10) === win.startDate);
    if (idx === -1) return null;
    const vwap = calcVwap(candles.slice(idx, idx + 5));
    if (!vwap) return null;
    return calcPplh(prod.rate, prod.wages, vwap, BONUS);
  };
  const early = getWinPplh(firstWin);
  const late = getWinPplh(lastWin);
  if (early == null || late == null) continue;
  const delta = late - early;
  const arrow = delta > 50 ? '↑↑' : delta > 0 ? '↑' : delta < -50 ? '↓↓' : '↓';
  console.log(
    prod.name.padEnd(24) + ' | ' +
    ((early >= 0 ? '+' : '') + early.toFixed(0)).padStart(9) + ' | ' +
    ((late >= 0 ? '+' : '') + late.toFixed(0)).padStart(9) + ' | ' +
    ((delta >= 0 ? '+' : '') + delta.toFixed(0)).padStart(6) + ' ' + arrow
  );
}
