// 检查建造中矿场是否已有丰度数据
// 用法: node mine_check.js <your_cookie_or_token>
//
// 获取 cookie: 浏览器登录 SimCo -> F12 -> Network -> 任意 API 请求 -> 复制 Cookie 请求头

const COOKIE = process.argv[2] || '';

if (!COOKIE) {
  console.log('用法: node mine_check.js "<your_cookie_string>"');
  console.log('从浏览器 DevTools -> Network -> 找任意 /api/ 请求 -> 复制 Cookie 头');
  process.exit(1);
}

const headers = {
  'Cookie': COOKIE,
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0',
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function main() {
  console.log('拉取公司建筑列表...');
  // 常见端点，按顺序尝试
  const endpoints = [
    'https://www.simcompanies.com/api/v4/company/buildings/',
    'https://www.simcompanies.com/api/v3/company/buildings/',
    'https://www.simcompanies.com/api/v2/company/buildings/',
  ];

  let buildings = null;
  for (const url of endpoints) {
    try {
      buildings = await fetchJSON(url);
      console.log(`成功: ${url}`);
      break;
    } catch (e) {
      console.log(`失败: ${url} — ${e.message}`);
    }
  }

  if (!buildings) {
    console.log('\n所有端点失败，尝试用浏览器手动查看:');
    console.log('  登录后访问: https://www.simcompanies.com/api/v4/company/buildings/');
    return;
  }

  // 找矿场类建筑（通常 kind/type 含 mine 或 特定 ID）
  const all = Array.isArray(buildings) ? buildings : Object.values(buildings).flat();

  console.log(`\n共 ${all.length} 栋建筑`);
  console.log('\n=== 建造中的建筑 ===');
  const underConstruction = all.filter(b => b.constructing || b.underConstruction ||
    b.completionTime || b.completion || b.constructionCompletion);

  if (underConstruction.length === 0) {
    console.log('（当前没有建造中的建筑）');
    console.log('\n所有建筑字段示例（第一栋）:');
    if (all[0]) console.log(JSON.stringify(all[0], null, 2));
  } else {
    underConstruction.forEach(b => {
      console.log(`\n建筑 ID: ${b.id || b.dbId}`);
      console.log(`  类型: ${b.kind || b.type || b.building}`);
      // 重点字段
      const fields = ['abundance', 'richness', 'naturalResources', 'resource',
        'yield', 'quality', 'amount', 'completionTime', 'constructionCompletion'];
      fields.forEach(f => {
        if (b[f] !== undefined) console.log(`  ${f}: ${JSON.stringify(b[f])}`);
      });
      // 打印全部字段
      console.log('  完整数据:');
      console.log(JSON.stringify(b, null, 4).split('\n').map(l => '    ' + l).join('\n'));
    });
  }

  // 也显示矿场类建筑（即使已完工）
  console.log('\n=== 所有矿/井类建筑 ===');
  const mines = all.filter(b => {
    const t = String(b.kind || b.type || b.building || '').toLowerCase();
    return t.includes('mine') || t.includes('well') || t.includes('drill') ||
      t.includes('quarr') || t.includes('extract');
  });
  mines.slice(0, 3).forEach(b => {
    console.log(JSON.stringify(b, null, 2));
  });
  if (mines.length === 0) {
    console.log('（未找到，建筑类型字段名可能不同）');
  }
}

main().catch(console.error);
