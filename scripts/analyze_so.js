#!/usr/bin/env node
/**
 * analyze_so.js — Sales Office 收货策略分析
 *
 * 用法:
 *   node scripts/analyze_so.js [contract_records.json] [crude_data]
 *
 * 输入:
 *   contract_records.json  — 从浏览器 📋 面板导出的合约历史 JSON
 *   crude_data             — 聊天室报价数据（tampermonkey 收集）
 *
 * 输出:
 *   - 各产品 base price 和 bonus% 的实测分布
 *   - 基于实测数据的 bonus* 临界值
 *   - 推荐收货质量
 *   - Q0–Q12 收货参考价表
 */

const fs   = require('fs');
const path = require('path');

// ── 参数处理 ──────────────────────────────────────────────
const contractFile = process.argv[2] || findLatestContractFile();
const crudeFile    = process.argv[3] || path.join(__dirname, '../data/crude_data');

function findLatestContractFile() {
  // 在 data/ 目录里找最新的 contract_records_*.json
  const dir = path.join(__dirname, '../data');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('contract_records_') && f.endsWith('.json'))
    .map(f => ({ f, mtime: fs.statSync(path.join(dir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? path.join(dir, files[0].f) : null;
}

// ── 产品名称映射（中英文 → 标准 key）────────────────────
const NAME_MAP = {
  // 中文
  '单引擎飞机': 'SEP', '单发飞机': 'SEP',
  '卫星':       'SAT',
  '豪华喷气机': 'LUX', '豪华飞机': 'LUX', '喷气客机': 'LUX',
  '亚轨道火箭': 'SOR', '次轨道火箭': 'SOR',
  '巨型飞机':   'JUM', '宽体飞机': 'JUM',
  'BFR':        'BFR', '大猎鹰火箭': 'BFR',
  // 英文
  'Single Engine Plane': 'SEP', 'Single engine plane': 'SEP',
  'Satellite':           'SAT',
  'Luxury Jet':          'LUX', 'Luxury jet': 'LUX',
  'Sub Orbital Rocket':  'SOR', 'Sub-orbital Rocket': 'SOR',
  'Jumbo Jet':           'JUM',
};

const PROD_LABELS = {
  SEP: 'Single Engine Plane',
  SAT: 'Satellite',
  LUX: 'Luxury Jet',
  SOR: 'Sub Orbital Rocket',
  JUM: 'Jumbo Jet',
  BFR: 'BFR',
};

function normProd(name) {
  if (!name) return null;
  const n = name.trim();
  return NAME_MAP[n] || null;
}

// ── 读取合约记录 ──────────────────────────────────────────
function loadContracts(file) {
  if (!file || !fs.existsSync(file)) {
    console.warn(`[warn] 合约文件未找到: ${file || '(无)'}`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  // 支持两种格式：直接数组 或 {records: [...]}
  const records = Array.isArray(raw) ? raw : (raw.records || []);
  console.log(`加载合约记录: ${records.length} 条  (${file})`);
  return records;
}

// 从合约记录提取每个产品的 (bonus, base_price) 样本
function extractContractSamples(records) {
  const samples = {}; // prod_key -> [{bonus, base}]

  for (const rec of records) {
    const bonus = rec.bonus;
    if (!bonus || isNaN(bonus)) continue;

    for (const item of (rec.items || [])) {
      const key = normProd(item.name);
      if (!key) continue;
      const base = item.unitPrice;
      if (!base || isNaN(base) || base <= 0) continue;

      if (!samples[key]) samples[key] = [];
      samples[key].push({ bonus, base });
    }
  }
  return samples;
}

// ── 读取聊天室报价数据 ────────────────────────────────────
function loadCrude(file) {
  if (!file || !fs.existsSync(file)) {
    console.warn(`[warn] crude_data 未找到: ${file || '(无)'}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function wavg(priceLevels) {
  if (!priceLevels) return null;
  const valid = priceLevels.filter(p => p.price && p.price > 0);
  if (!valid.length) return null;
  const total = valid.reduce((s, p) => s + p.count, 0);
  return Math.round(valid.reduce((s, p) => s + p.price * p.count, 0) / total);
}

// 从 crude_data 提取 Q3 基准价和实测步长
function extractMarketPrices(crude) {
  const result = {};
  if (!crude) return result;

  const PROD_KEYS = ['SEP', 'SAT', 'LUX', 'SOR', 'JUM', 'BFR'];
  for (const key of PROD_KEYS) {
    const prod = crude.summary?.[key];
    if (!prod) continue;

    // Q3 加权均值买价作为基准
    const q3buy = wavg(prod.Q3?.buy);
    if (!q3buy) continue;

    // 用 Q0–Q9 计算实测步长（线性回归斜率）
    const pts = [];
    for (let q = 0; q <= 9; q++) {
      const v = wavg(prod[`Q${q}`]?.buy);
      if (v) pts.push({ q, v });
    }

    let step = null;
    if (pts.length >= 2) {
      // 线性回归
      const n  = pts.length;
      const sx = pts.reduce((s, p) => s + p.q, 0);
      const sy = pts.reduce((s, p) => s + p.v, 0);
      const sxy= pts.reduce((s, p) => s + p.q * p.v, 0);
      const sx2= pts.reduce((s, p) => s + p.q * p.q, 0);
      step = Math.round((n * sxy - sx * sy) / (n * sx2 - sx * sx));
    }

    // 各 Q 实测价（有则用，无则按步长推算）
    const prices = {};
    for (let q = 0; q <= 12; q++) {
      const actual = wavg(prod[`Q${q}`]?.buy);
      prices[q] = actual || (q3buy + (q - 3) * step);
    }

    result[key] = { q3buy, step, prices };
  }
  return result;
}

// ── 主分析 ────────────────────────────────────────────────
const records  = loadContracts(contractFile);
const crude    = loadCrude(crudeFile);
const samples  = extractContractSamples(records);
const market   = extractMarketPrices(crude);

console.log('');

// 如果没有合约数据，用 Excel 历史值作为后备
const FALLBACK_BASE = { SEP: 40889, SAT: 60753, LUX: 83418, SOR: 119211, JUM: 221794, BFR: 831276 };
const FALLBACK_STEP = { SEP: 939,   SAT: 1000,  LUX: 1400,  SOR: 1900,  JUM: 4100,  BFR: 12400  };

const PRODS = ['SEP', 'SAT', 'LUX', 'SOR', 'JUM', 'BFR'];

// ── 输出1：合约样本统计 ───────────────────────────────────
console.log('═'.repeat(72));
console.log('  合约数据统计');
console.log('═'.repeat(72));
console.log('产品   '.padEnd(7) + '样本'.padStart(5) + '  ' + 'base均值'.padStart(9) + '  ' + 'base范围'.padStart(20) + '  ' + 'bonus均值'.padStart(9) + '  ' + 'bonus范围'.padStart(16));
console.log('─'.repeat(72));

const baseStats = {};
for (const key of PRODS) {
  const s = samples[key] || [];
  const label = PROD_LABELS[key];
  if (!s.length) {
    const fb = FALLBACK_BASE[key];
    baseStats[key] = { avg: fb, n: 0, fallback: true };
    console.log(`${key.padEnd(5)}  ${'—'.padStart(5)}  ${fb.toLocaleString().padStart(9)}  ${'(Excel历史后备)'.padStart(20)}`);
    continue;
  }
  const bases   = s.map(x => x.base);
  const bonuses = s.map(x => x.bonus);
  const baseAvg = Math.round(bases.reduce((a, b) => a + b, 0) / bases.length);
  const bonusAvg = bonuses.reduce((a, b) => a + b, 0) / bonuses.length;
  baseStats[key] = { avg: baseAvg, n: s.length, fallback: false, samples: s };

  console.log(
    `${key.padEnd(5)}  ${s.length.toString().padStart(5)}` +
    `  ${baseAvg.toLocaleString().padStart(9)}` +
    `  [${Math.min(...bases).toLocaleString()}–${Math.max(...bases).toLocaleString()}]`.padStart(20) +
    `  ${(bonusAvg * 100).toFixed(2)}%`.padStart(9) +
    `  [${(Math.min(...bonuses) * 100).toFixed(2)}%–${(Math.max(...bonuses) * 100).toFixed(2)}%]`.padStart(16)
  );
}

// ── 输出2：bonus* 分析 ────────────────────────────────────
console.log('');
console.log('═'.repeat(72));
console.log('  bonus* 临界值分析');
console.log('═'.repeat(72));
console.log('产品   '.padEnd(7) + 'base均值'.padStart(9) + '  ' + '步长'.padStart(7) + '  ' + 'bonus*'.padStart(7) + '  ' + '偏Q0%'.padStart(7) + '  ' + '偏Q12%'.padStart(7) + '  推荐质量  数据来源');
console.log('─'.repeat(72));

const recommendations = {};
for (const key of PRODS) {
  const { avg: base, fallback } = baseStats[key];
  const step  = market[key]?.step || FALLBACK_STEP[key];
  const bstar = step / base;

  // 用实测 bonus 分布（或均匀假设）计算概率
  const s = samples[key] || [];
  let pLow, pHigh;
  if (s.length >= 10) {
    const bonuses = s.map(x => x.bonus);
    pLow  = bonuses.filter(b => b < bstar).length / bonuses.length;
    pHigh = 1 - pLow;
  } else {
    // 均匀分布 1%–3% 假设
    pLow  = Math.max(0, Math.min(1, (bstar - 0.01) / 0.02));
    pHigh = 1 - pLow;
  }

  const rec = pHigh > 0.5 ? 'Q12' : 'Q0';
  const src = fallback ? 'Excel后备' : `实测${s.length}条`;
  recommendations[key] = { rec, bstar, step, base };

  console.log(
    `${key.padEnd(5)}  ${base.toLocaleString().padStart(9)}  ${step.toLocaleString().padStart(7)}` +
    `  ${(bstar * 100).toFixed(2)}%`.padStart(8) +
    `  ${(pLow * 100).toFixed(1)}%`.padStart(9) +
    `  ${(pHigh * 100).toFixed(1)}%`.padStart(9) +
    `  ${rec.padStart(8)}  ${src}`
  );
}

// ── 输出3：收货价表 ────────────────────────────────────────
console.log('');
console.log('═'.repeat(72));
console.log('  收货参考价表（推荐质量用 * 标注）');
console.log('═'.repeat(72));

const header = ' Q  │' + PRODS.map(p => p.padStart(8)).join(' │');
console.log(header);
console.log('────┼' + PRODS.map(() => '─'.repeat(8)).join('─┼'));

for (let q = 0; q <= 12; q++) {
  const row = PRODS.map(key => {
    const m = market[key];
    if (!m) return '       —';
    const p = m.prices[q];
    const rec = recommendations[key]?.rec;
    const star = (rec === 'Q0' && q === 0) || (rec === 'Q12' && q === 12) ? '*' : ' ';
    return (star + Math.round(p / 100) * 100).padStart(8);  // 取整到 100
  });
  console.log(` ${String(q).padStart(2)} │${row.join(' │')}`);
}

console.log('');
console.log('推荐质量：' + PRODS.map(k => `${k}→${recommendations[k]?.rec}`).join('  '));
console.log('');

if (contractFile) console.log(`合约文件: ${contractFile}`);
if (crudeFile)    console.log(`报价文件: ${crudeFile}`);
if (crude)        console.log(`报价总数: ${crude.total_quotes}`);
console.log(`合约样本: ${Object.values(samples).reduce((s, a) => s + a.length, 0)} 条`);
