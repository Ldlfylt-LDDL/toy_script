// analyze_gov_orders.js
// 分析 data/goven_order.json 中的政府订单
// 用法: node scripts/analyze_gov_orders.js [--json]

const fs     = require('fs');
const path   = require('path');
const orders = require('../data/goven_order.json');
const asJson = process.argv.includes('--json');
const toMd   = process.argv.includes('--md');

// ── 基础统计 ────────────────────────────────────────────────────────────────

const totalOrders = orders.length;

// 每个 resource+quality 组合的需求频次
const demandMap = new Map(); // key: "resourceName|Q{quality}"
for (const order of orders) {
  for (const r of order.resources) {
    const key = `${r.resourceName}|Q${r.quality}`;
    if (!demandMap.has(key)) {
      demandMap.set(key, { resourceId: r.resourceId, name: r.resourceName, quality: r.quality, count: 0, orderIds: [] });
    }
    const entry = demandMap.get(key);
    entry.count++;
    entry.orderIds.push(order.id);
  }
}

// 按资源名聚合（忽略品质）
const resourceTotals = new Map();
for (const [, v] of demandMap) {
  if (!resourceTotals.has(v.name)) resourceTotals.set(v.name, { name: v.name, resourceId: v.resourceId, total: 0, qualities: {} });
  const e = resourceTotals.get(v.name);
  e.total += v.count;
  e.qualities[v.quality] = (e.qualities[v.quality] || 0) + v.count;
}

// 按需求数降序
const topResources = [...resourceTotals.values()].sort((a, b) => b.total - a.total);
const topCombos    = [...demandMap.values()].sort((a, b) => b.count - a.count);

// daysToFulfill 分布
const urgencyBuckets = { '1-3天': 0, '4-6天': 0, '7-10天': 0, '10天+': 0 };
for (const o of orders) {
  const d = o.daysToFulfill;
  if (d <= 3)       urgencyBuckets['1-3天']++;
  else if (d <= 6)  urgencyBuckets['4-6天']++;
  else if (d <= 10) urgencyBuckets['7-10天']++;
  else              urgencyBuckets['10天+']++;
}

// 按创建日期聚合（按周）
const weekMap = new Map();
for (const o of orders) {
  const date = new Date(o.created);
  // ISO week start (Monday)
  const day  = date.getUTCDay() || 7;
  const mon  = new Date(date);
  mon.setUTCDate(date.getUTCDate() - day + 1);
  const wk   = mon.toISOString().slice(0, 10);
  weekMap.set(wk, (weekMap.get(wk) || 0) + 1);
}
const weeklyOrders = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

// 品质分布（所有资源项目的品质要求）
const qualDist = {};
for (const o of orders) {
  for (const r of o.resources) {
    qualDist[r.quality] = (qualDist[r.quality] || 0) + 1;
  }
}

// ── 输出 ────────────────────────────────────────────────────────────────────

if (asJson) {
  console.log(JSON.stringify({
    totalOrders,
    topResources,
    topCombos: topCombos.slice(0, 30),
    urgencyBuckets,
    weeklyOrders,
    qualityDistribution: qualDist,
  }, null, 2));
  process.exit(0);
}

const pct = (n, total) => `${(n / total * 100).toFixed(1)}%`;

// ── 构建 Markdown ────────────────────────────────────────────────────────────

function buildMd() {
  const totalItems = Object.values(qualDist).reduce((a, b) => a + b, 0);
  const lines = [];

  lines.push('# 政府订单分析报告');
  lines.push('');
  lines.push(`> 数据来源: \`data/goven_order.json\` · 总订单数: **${totalOrders}**`);
  lines.push('');

  // 交货期分布
  lines.push('## 交货期分布');
  lines.push('');
  lines.push('| 范围 | 订单数 | 占比 |');
  lines.push('|------|--------|------|');
  for (const [label, cnt] of Object.entries(urgencyBuckets)) {
    lines.push(`| ${label} | ${cnt} | ${pct(cnt, totalOrders)} |`);
  }
  lines.push('');

  // 品质需求分布
  lines.push('## 品质需求分布');
  lines.push('');
  lines.push('| 品质 | 需求次数 | 占比 |');
  lines.push('|------|----------|------|');
  for (const q of Object.keys(qualDist).sort((a, b) => +a - +b)) {
    const cnt = qualDist[q];
    lines.push(`| Q${q} | ${cnt} | ${pct(cnt, totalItems)} |`);
  }
  lines.push('');

  // 所有资源需求排名
  lines.push(`## 资源需求排名（全部 ${topResources.length} 种）`);
  lines.push('');
  lines.push('| 排名 | 资源 | 总需求次数 | 品质明细 |');
  lines.push('|------|------|------------|----------|');
  topResources.forEach((r, i) => {
    const qualStr = Object.entries(r.qualities)
      .sort((a, b) => +a[0] - +b[0])
      .map(([q, c]) => `Q${q}×${c}`)
      .join(' ');
    lines.push(`| ${i + 1} | ${r.name} | ${r.total} | ${qualStr} |`);
  });
  lines.push('');

  // 所有资源×品质组合排名
  lines.push(`## 资源×品质组合排名（全部 ${topCombos.length} 种）`);
  lines.push('');
  lines.push('| 排名 | 资源 | 品质 | 需求次数 |');
  lines.push('|------|------|------|----------|');
  topCombos.forEach((c, i) => {
    lines.push(`| ${i + 1} | ${c.name} | Q${c.quality} | ${c.count} |`);
  });
  lines.push('');

  // 每周订单数
  lines.push('## 每周订单数');
  lines.push('');
  lines.push('| 周（周一） | 订单数 |');
  lines.push('|------------|--------|');
  for (const [wk, cnt] of weeklyOrders) {
    lines.push(`| ${wk} | ${cnt} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ── 输出 ────────────────────────────────────────────────────────────────────

if (asJson) {
  console.log(JSON.stringify({
    totalOrders,
    topResources,
    topCombos: topCombos.slice(0, 30),
    urgencyBuckets,
    weeklyOrders,
    qualityDistribution: qualDist,
  }, null, 2));
  process.exit(0);
}

const md = buildMd();

if (toMd) {
  const outPath = path.join(__dirname, '../Simcompanies-production-relationships/gov_order_analysis.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`已写入: ${outPath}`);
} else {
  console.log(md);
}
