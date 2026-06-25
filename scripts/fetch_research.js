#!/usr/bin/env node
/**
 * fetch_research.js — 刷新研究产品 candlestick 数据
 * 结果保存到 data/candlestick_data.json
 *
 * 用法: node scripts/fetch_research.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '../data/candlestick_data.json');
const DELAY_MS = 400;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const RESEARCH_IDS = [29, 30, 31, 32, 33, 34, 35, 58, 59, 100, 113, 145];

const NAMES = {
  29: 'Plant Research', 30: 'Energy Research', 31: 'Mining Research',
  32: 'Electronics Research', 33: 'Breeding Research', 34: 'Chemistry Research',
  35: 'Software', 58: 'Automotive Research', 59: 'Fashion Research',
  100: 'Aerospace Research', 113: 'Materials Research', 145: 'Recipes',
};

async function fetchCandles(id) {
  try {
    // 研究产品只有 Q0
    const res = await fetch(
      `https://api.simcotools.com/v1/realms/0/market/resources/${id}/0/candlesticks`
    );
    await sleep(DELAY_MS);
    const data = await res.json();
    return (data.candlesticks || []).map(c => ({
      date: c.date,
      volume: c.volume,
      vwap: c.vwap,
    }));
  } catch (e) {
    return [];
  }
}

(async () => {
  console.log(`\n📊 刷新 ${RESEARCH_IDS.length} 种研究产品 candlestick...\n`);
  const result = {};

  for (const id of RESEARCH_IDS) {
    process.stdout.write(`  [${id}] ${NAMES[id].padEnd(24)}`);
    const candles = await fetchCandles(id);
    if (candles.length) {
      const latest = candles[candles.length - 1];
      console.log(`${candles.length} 根  最新: ${latest.date.slice(0,10)}  VWAP: $${latest.vwap?.toFixed(2)}`);
      result[id] = candles;
    } else {
      console.log('N/A');
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`\n✅ 已保存至 ${OUTPUT}`);
})();
