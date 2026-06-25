#!/usr/bin/env node
/**
 * Analyze crude_data: per-quality buy/sell price distribution for aerospace products.
 * Usage: node scripts/analyze_crude.js [path/to/crude_data]
 *
 * Output:
 *   - Per-product, per-quality: weighted avg buy price, price range, quote count
 *   - Implied step (Qn+1 - Qn) for buy prices
 *   - Seller pricing table
 */

const fs = require('fs');
const path = require('path');

const dataPath = process.argv[2] || path.join(__dirname, '../data/crude_data');
const raw = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(raw);

const PRODUCTS = ['SEP', 'SAT', 'LUX', 'SOR', 'JUM', 'BFR'];
const PRODUCT_LABELS = {
  SEP: 'Single Engine Plane',
  SAT: 'Satellite',
  LUX: 'Luxury Jet',
  SOR: 'Sub-orbital Rocket',
  JUM: 'Jumbo Jet',
  BFR: 'BFR',
};

// Weighted average of prices by count, excluding null prices
function weightedStats(priceLevels) {
  const valid = priceLevels.filter(p => p.price != null && p.price > 0);
  if (!valid.length) return null;

  const totalCount = valid.reduce((s, p) => s + p.count, 0);
  const weightedSum = valid.reduce((s, p) => s + p.price * p.count, 0);
  const prices = valid.map(p => p.price);
  const allCompanies = new Set(valid.flatMap(p => p.companies));

  return {
    wavg: Math.round(weightedSum / totalCount),
    min: Math.min(...prices),
    max: Math.max(...prices),
    count: totalCount,
    levels: valid.length,
    companies: allCompanies.size,
    // Most quoted price
    mode: valid.reduce((best, p) => p.count > best.count ? p : best, valid[0]).price,
  };
}

// Format number with k suffix
function fmt(n) {
  if (n == null) return '  —  ';
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

function fmtDiff(n) {
  if (n == null) return '  —  ';
  const s = n >= 0 ? '+' : '';
  return n >= 1000 || n <= -1000 ? s + (n / 1000).toFixed(1) + 'k' : s + String(n);
}

const summary = data.summary;

for (const prod of PRODUCTS) {
  if (!summary[prod]) continue;
  const qdata = summary[prod];

  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  ${PRODUCT_LABELS[prod]} (${prod})`);
  console.log('═'.repeat(72));
  console.log(
    ' Q  │' +
    '      BUY      (wavg / mode / range / coy / quotes) │' +
    '   SELL  (wavg / coy)'
  );
  console.log('────┼' + '─'.repeat(51) + '┼' + '─'.repeat(20));

  const buyByQ = {};
  const sellByQ = {};

  for (let q = 0; q <= 12; q++) {
    const qkey = `Q${q}`;
    const qobj = qdata[qkey];
    if (!qobj) continue;

    const buyStats = qobj.buy ? weightedStats(qobj.buy) : null;
    const sellStats = qobj.sell ? weightedStats(qobj.sell) : null;

    buyByQ[q] = buyStats;
    sellByQ[q] = sellStats;

    const buyStr = buyStats
      ? `${fmt(buyStats.wavg).padStart(7)} / ${fmt(buyStats.mode).padStart(7)} / [${fmt(buyStats.min)}–${fmt(buyStats.max)}] / ${buyStats.companies}coy / ${buyStats.count}q`
      : '—';
    const sellStr = sellStats
      ? `${fmt(sellStats.wavg).padStart(7)} / ${sellStats.companies}coy`
      : '—';

    console.log(` ${String(q).padStart(2)} │ ${buyStr.padEnd(50)}│ ${sellStr}`);
  }

  // Implied step table (buy wavg difference between adjacent Qs)
  console.log('\n  Implied buy step (Qn+1 − Qn):');
  const steps = [];
  for (let q = 0; q < 12; q++) {
    const a = buyByQ[q], b = buyByQ[q + 1];
    if (a && b) {
      const diff = b.wavg - a.wavg;
      steps.push({ q, diff });
      process.stdout.write(`  Q${q}→Q${q + 1}: ${fmtDiff(diff).padStart(7)}   `);
      if ((q + 1) % 4 === 0) process.stdout.write('\n');
    }
  }
  if (steps.length) {
    process.stdout.write('\n');
    const avg = Math.round(steps.reduce((s, x) => s + x.diff, 0) / steps.length);
    const min = Math.min(...steps.map(x => x.diff));
    const max = Math.max(...steps.map(x => x.diff));
    console.log(`  Avg step: ${fmtDiff(avg)}  Min: ${fmtDiff(min)}  Max: ${fmtDiff(max)}`);
  }
}

// Summary: comparison table across products for a reference quality (Q3, Q6)
console.log(`\n${'═'.repeat(72)}`);
console.log('  CROSS-PRODUCT BUY PRICE SUMMARY (weighted avg)');
console.log('═'.repeat(72));
const refQs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const header = ' Q  │' + PRODUCTS.map(p => p.padStart(8)).join(' │');
console.log(header);
console.log('────┼' + PRODUCTS.map(() => '─'.repeat(8)).join('─┼'));

for (const q of refQs) {
  const qkey = `Q${q}`;
  const row = PRODUCTS.map(prod => {
    const qobj = summary[prod]?.[qkey];
    const stats = qobj?.buy ? weightedStats(qobj.buy) : null;
    return stats ? fmt(stats.wavg).padStart(8) : '       —';
  });
  // Only print row if at least one product has data
  if (row.some(r => !r.includes('—'))) {
    console.log(` ${String(q).padStart(2)} │${row.join(' │')}`);
  }
}

console.log(`\nData file: ${dataPath}`);
console.log(`Total raw quotes: ${data.total_quotes}`);
