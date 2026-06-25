#!/usr/bin/env node
/**
 * food_verify.js — 核实并重算食品产品 PPLH（30天均价）
 *
 * 用法：
 *   node scripts/food_verify.js 142         # 单个产品（沙拉 id:142）
 *   node scripts/food_verify.js 142 143     # 多个产品
 *   node scripts/food_verify.js all         # 所有食品产品
 *
 * 价格来源优先级：
 *   1. 30天K线成交量加权均价（avg）
 *   2. 当日VWAP（spot，标注~）
 *   3. 无数据（标注 N/A）
 *
 * API限速：每次请求间隔 DELAY_MS（默认120ms），串行执行
 */

const DELAY_MS = 500;
const SELL_FEE = 0.04; // 4% 交易行手续费

// 所有食品终端产品 ID（参考 simco_tree.html food 类别节点）
const FOOD_PRODUCTS = [
  // Dairy Farm
  { id: 117, name: '牛奶 Milk' },
  // Bakery
  { id: 121, name: '面包 Bread' },
  { id: 134, name: '黄油 Butter' },
  { id: 122, name: '芝士 Cheese' },
  { id: 123, name: '苹果派 Apple pie' },
  // Beverage Factory
  { id: 124, name: '橙汁 OJ' },
  { id: 125, name: '苹果汁 Apple cider' },
  { id: 126, name: '姜汁啤酒 Ginger beer' },
  { id: 119, name: '咖啡粉 Coffee powder' },
  // Restaurant
  { id: 129, name: '汉堡包 Hamburger' },
  { id: 130, name: '千层面 Lasagna' },
  { id: 131, name: '肉丸 Meatballs' },
  { id: 142, name: '沙拉 Salad' },
  { id: 143, name: '咖喱角 Samosa' },
  { id: 127, name: '冻披萨 Frozen pizza' },
  { id: 132, name: '鸡尾酒 Cocktails' },
  // Chocolate Factory
  { id: 140, name: '巧克力 Chocolate' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 价格缓存，避免重复请求
const priceCache = new Map();

async function fetchJson(url) {
  const res = await fetch(url);
  await sleep(DELAY_MS);
  return res.json();
}

// 获取30天K线均价（失败时自动重试一次）
async function get30DayAvg(id, q) {
  const key = `avg:${id}:${q}`;
  if (priceCache.has(key)) return priceCache.get(key);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await sleep(500); // 重试前等待500ms
      const data = await fetchJson(
        `https://api.simcotools.com/v1/realms/0/market/resources/${id}/${q}/candlesticks`
      );
      const candles = data.candlesticks;
      if (!candles || !candles.length) break;

      const recent = candles.slice(-30);
      const totalVol = recent.reduce((a, d) => a + (d.volume || 0), 0);
      if (!totalVol) break;

      const wavg = recent.reduce((s, d) => s + (d.vwap || 0) * (d.volume || 0), 0) / totalVol;
      const dailyVol = totalVol / recent.length;
      const result = { price: wavg, vol: dailyVol, source: 'avg' };
      priceCache.set(key, result);
      return result;
    } catch (e) {
      // 网络错误时重试
    }
  }
  priceCache.set(key, null);
  return null;
}

// 获取当日VWAP（备用）
async function getVwap(id, q) {
  const key = `vwap:${id}:${q}`;
  if (priceCache.has(key)) return priceCache.get(key);

  try {
    const data = await fetchJson(
      `https://api.simcotools.com/v1/realms/0/market/vwaps/${id}/${q}`
    );
    if (!data.vwaps || !data.vwaps.length) { priceCache.set(key, null); return null; }
    const result = { price: data.vwaps[0].vwap, vol: null, source: 'spot~' };
    priceCache.set(key, result);
    return result;
  } catch (e) {
    priceCache.set(key, null);
    return null;
  }
}

// 获取价格：优先30天均价，备用当日VWAP
async function getPrice(id, q) {
  const avg = await get30DayAvg(id, q);
  if (avg) return avg;
  return getVwap(id, q);
}

// 获取输入原料在目标品质的价格，找不到则向两侧扩展寻找最近品质
async function getInputPrice(id, targetQ) {
  // 先尝试精确品质
  const exact = await getPrice(id, targetQ);
  if (exact) return { ...exact, approx: false };

  // 向两侧扩展（优先降品质方向）
  for (let d = 1; d <= 4; d++) {
    const lower = targetQ - d;
    const upper = targetQ + d;
    if (lower >= 0) {
      const p = await getPrice(id, lower);
      if (p) return { ...p, approx: true, fallbackQ: lower };
    }
    if (upper <= 5) {
      const p = await getPrice(id, upper);
      if (p) return { ...p, approx: true, fallbackQ: upper };
    }
  }
  return null;
}

// 格式化价格显示
function fmt(p, decimals = 2) {
  if (p === null || p === undefined) return 'N/A';
  return '$' + p.toFixed(decimals);
}

// 对齐列宽的 pad
function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

// 分析单个产品
async function analyzeProduct(id) {
  // 用 SimcoTools resources 获取正确的 producedAnHour 和 wages
  // （encyclopedia API 的 producedAnHour 与游戏实际数值不符）
  let simco = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(600);
    const data = await fetchJson(`https://api.simcotools.com/v1/realms/0/resources/${id}`);
    if (data.resource) { simco = data; break; }
  }
  if (!simco) {
    console.error(`  ⚠ SimcoTools 多次重试后仍无数据 (id:${id})，跳过`);
    return null;
  }
  const rate = simco.resource.producedAnHour;
  const wage = simco.resource.wages;

  // 用 encyclopedia 获取中文名和输入原料列表
  const enc = await fetchJson(
    `https://www.simcompanies.com/api/v4/en/0/encyclopedia/resources/0/${id}/`
  );
  const { name } = enc;
  const inputs = enc.producedFrom.map(i => ({
    id: Number(i.resource.db_letter),
    name: i.resource.name,
    amount: i.amount,
  }));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name} (id:${id}) | rate=${rate.toFixed(3)}/hr | wage=${fmt(wage, 0)}/hr`);
  console.log(`输入: ${inputs.map(i => `${i.name}(${i.id})×${i.amount}`).join(' + ')}`);
  console.log('='.repeat(60));

  // 预取所有输出价格 Q0-Q5
  process.stdout.write('获取售价数据');
  const outputPrices = [];
  for (let q = 0; q <= 5; q++) {
    const p = await getPrice(id, q);
    outputPrices.push(p);
    process.stdout.write('.');
  }
  console.log();

  // 预取所有输入原料价格（Q0-Q4，因为最高输出Q5需要Q4输入）
  process.stdout.write('获取原料价格');
  const inputPriceMap = {}; // id -> q -> priceInfo
  for (const inp of inputs) {
    inputPriceMap[inp.id] = {};
    for (let q = 0; q <= 4; q++) {
      inputPriceMap[inp.id][q] = await getPrice(inp.id, q);
      process.stdout.write('.');
    }
  }
  console.log();

  // 计算各品质 PPLH
  const rows = [];
  let bestPplh = -Infinity, bestQ = -1;

  for (let qout = 0; qout <= 5; qout++) {
    const outP = outputPrices[qout];
    if (!outP) {
      rows.push({ qout, pplh: null, sell: null, vol: null, inputCost: null, approx: false, notes: [] });
      continue;
    }

    const qin = Math.max(qout - 1, 0);
    let inputCost = 0;
    let hasApprox = outP.source === 'spot~';
    const notes = [];

    for (const inp of inputs) {
      // 找最接近 qin 的价格
      let inpP = inputPriceMap[inp.id][qin];
      let usedQ = qin;
      let approxUsed = false;

      if (!inpP) {
        // 向两侧扩展
        for (let d = 1; d <= 4; d++) {
          const lo = qin - d, hi = qin + d;
          if (lo >= 0 && inputPriceMap[inp.id][lo]) { inpP = inputPriceMap[inp.id][lo]; usedQ = lo; approxUsed = true; break; }
          if (hi <= 4 && inputPriceMap[inp.id][hi]) { inpP = inputPriceMap[inp.id][hi]; usedQ = hi; approxUsed = true; break; }
        }
      }
      if (inpP && inpP.source === 'spot~') approxUsed = true;

      if (inpP) {
        inputCost += inp.amount * inpP.price;
        if (approxUsed) {
          hasApprox = true;
          if (usedQ !== qin) notes.push(`${inp.name} Q${usedQ}代Q${qin}`);
        }
      } else {
        notes.push(`${inp.name} Q${qin} 无价格`);
        hasApprox = true;
      }
    }

    const pplh = rate * (outP.price * (1 - SELL_FEE) - inputCost) - wage;
    if (pplh > bestPplh) { bestPplh = pplh; bestQ = qout; }

    rows.push({
      qout,
      pplh,
      sell: outP.price,
      vol: outP.vol,
      inputCost,
      approx: hasApprox,
      notes,
    });
  }

  // 打印结果表格
  console.log(
    pad('品质', 4) + pad('售价(avg/spot)', 16) + pad('原料成本', 10) +
    pad('PPLH/hr', 10) + pad('日均交易量', 12) + '备注'
  );
  console.log('-'.repeat(70));

  for (const r of rows) {
    if (r.sell === null) {
      console.log(`Q${r.qout}    ${'—'.padEnd(15)} ${'—'.padEnd(9)} ${'—'.padEnd(9)} —`);
      continue;
    }
    const mark = r.approx ? '~' : '';
    const isBest = r.qout === bestQ ? ' ★' : '';
    const volStr = r.vol ? `${r.vol.toFixed(0)}/day` : 'spot only';
    const noteStr = r.notes.length ? r.notes.join(', ') : '';
    console.log(
      pad(`Q${r.qout}`, 4) +
      pad(`${fmt(r.sell)}`, 16) +
      pad(`${fmt(r.inputCost)}`, 10) +
      pad(`${fmt(r.pplh, 0)}${mark}${isBest}`, 10) +
      pad(volStr, 12) +
      noteStr
    );
  }

  return { id, name, rows, bestQ, bestPplh };
}

// 主程序
(async () => {
  const args = process.argv.slice(2);

  if (!args.length) {
    console.log('用法:');
    console.log('  node scripts/food_verify.js 142          # 单产品');
    console.log('  node scripts/food_verify.js 142 143      # 多产品');
    console.log('  node scripts/food_verify.js all          # 全部');
    console.log('\n可用产品:');
    for (const p of FOOD_PRODUCTS) console.log(`  ${p.id}  ${p.name}`);
    process.exit(0);
  }

  let targets;
  if (args[0] === 'all') {
    targets = FOOD_PRODUCTS.map(p => p.id);
  } else {
    targets = args.map(a => parseInt(a)).filter(n => !isNaN(n));
    if (!targets.length) {
      console.error('错误：请输入有效的产品 ID 或 "all"');
      process.exit(1);
    }
  }

  const summary = [];
  for (const id of targets) {
    const result = await analyzeProduct(id);
    summary.push(result);
  }

  // 汇总表（多产品时显示）
  if (summary.length > 1) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('汇总排名（按最优PPLH）');
    console.log('='.repeat(60));
    summary
      .filter(r => r && r.bestPplh > -Infinity)
      .sort((a, b) => b.bestPplh - a.bestPplh)
      .forEach((r, i) => {
        const best = r.rows[r.bestQ];
        const mark = best?.approx ? '~' : '';
        const vol = best?.vol ? `${best.vol.toFixed(0)}/day` : 'spot only';
        console.log(
          `${String(i + 1).padStart(2)}. ${pad(r.name, 22)} Q${r.bestQ}  PPLH=${fmt(r.bestPplh, 0)}${mark}  vol=${vol}`
        );
      });
  }
})();
