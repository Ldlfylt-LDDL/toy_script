// 输出各产品市场数据到 markdown，按类别分组
// node dump_market.js  →  Simcompanies-production-relationships/market_data.md

const https = require('https');
const fs = require('fs');

const ALL_N = [
  {id:1,n:"Power",zh:"电力",c:"energy"},{id:2,n:"Water",zh:"水",c:"resource"},{id:66,n:"Seeds",zh:"种子",c:"agriculture"},
  {id:10,n:"Crude Oil",zh:"原油",c:"refinery"},{id:14,n:"Minerals",zh:"矿石",c:"mining"},{id:15,n:"Bauxite",zh:"铝土矿",c:"mining"},
  {id:16,n:"Silicon",zh:"硅",c:"mining"},{id:42,n:"Iron Ore",zh:"铁矿石",c:"mining"},{id:44,n:"Sand",zh:"沙子",c:"mining"},
  {id:68,n:"Gold Ore",zh:"金矿石",c:"mining"},{id:104,n:"Clay",zh:"黏土",c:"quarry"},{id:105,n:"Limestone",zh:"石灰石",c:"quarry"},
  {id:106,n:"Wood",zh:"木材",c:"quarry"},
  {id:3,n:"Apples",zh:"苹果",c:"agriculture"},{id:4,n:"Oranges",zh:"橙子",c:"agriculture"},{id:5,n:"Grapes",zh:"葡萄",c:"agriculture"},
  {id:6,n:"Grain",zh:"谷物",c:"agriculture"},{id:72,n:"Sugarcane",zh:"甘蔗",c:"agriculture"},{id:40,n:"Cotton",zh:"棉花",c:"agriculture"},
  {id:118,n:"Coffee Beans",zh:"咖啡豆",c:"agriculture"},{id:120,n:"Vegetables",zh:"蔬菜",c:"agriculture"},{id:136,n:"Cocoa",zh:"可可",c:"agriculture"},
  {id:9,n:"Eggs",zh:"鸡蛋",c:"agriculture"},{id:115,n:"Cows",zh:"奶牛",c:"agriculture"},{id:116,n:"Pigs",zh:"猪",c:"agriculture"},
  {id:7,n:"Steak",zh:"牛排",c:"agriculture"},{id:8,n:"Sausages",zh:"香肠",c:"agriculture"},{id:117,n:"Milk",zh:"牛奶",c:"agriculture"},
  {id:17,n:"Chemicals",zh:"化学品",c:"mining"},{id:18,n:"Aluminium",zh:"铝",c:"intermediate"},{id:43,n:"Steel",zh:"钢铁",c:"intermediate"},
  {id:45,n:"Glass",zh:"玻璃",c:"intermediate"},{id:69,n:"Golden Bars",zh:"金条",c:"intermediate"},
  {id:19,n:"Plastic",zh:"塑料",c:"intermediate"},{id:41,n:"Fabric",zh:"织物",c:"intermediate"},
  {id:75,n:"Carbon Fibers",zh:"碳纤维",c:"intermediate"},{id:46,n:"Leather",zh:"皮革",c:"intermediate"},
  {id:76,n:"Carbon Composite",zh:"碳复合材料",c:"intermediate"},
  {id:73,n:"Ethanol",zh:"乙醇",c:"refinery"},{id:74,n:"Methane",zh:"甲烷",c:"refinery"},
  {id:12,n:"Diesel",zh:"柴油",c:"refinery"},{id:11,n:"Petrol",zh:"汽油",c:"refinery"},
  {id:13,n:"Transport",zh:"运输",c:"refinery"},{id:83,n:"Rocket Fuel",zh:"火箭燃料",c:"aerospace"},
  {id:108,n:"Planks",zh:"木板",c:"construction"},{id:103,n:"Cement",zh:"水泥",c:"construction"},
  {id:102,n:"Bricks",zh:"砖块",c:"construction"},{id:107,n:"Steel Beams",zh:"钢梁",c:"construction"},
  {id:101,n:"Reinforced Concrete",zh:"钢筋混凝土",c:"construction"},{id:110,n:"Tools",zh:"工具",c:"construction"},
  {id:109,n:"Windows",zh:"玻璃窗",c:"construction"},{id:111,n:"Construction Units",zh:"建筑单元",c:"construction"},
  {id:112,n:"Bulldozer",zh:"推土机",c:"construction"},
  {id:20,n:"Processors",zh:"处理器",c:"factory"},{id:21,n:"Electronic Comps",zh:"电子元件",c:"factory"},
  {id:22,n:"Batteries",zh:"电池",c:"factory"},{id:23,n:"Displays",zh:"显示屏",c:"factory"},
  {id:52,n:"Combustion Engine",zh:"内燃机",c:"factory"},{id:48,n:"Electric Motor",zh:"电动机",c:"factory"},
  {id:50,n:"Basic Interior",zh:"基础内饰",c:"factory"},{id:49,n:"Luxury Interior",zh:"豪华内饰",c:"factory"},
  {id:47,n:"On-board Computer",zh:"车载电脑",c:"factory"},{id:51,n:"Car Body",zh:"车身",c:"factory"},
  {id:114,n:"Robots",zh:"机器人",c:"factory"},
  {id:135,n:"Sugar",zh:"糖",c:"food"},{id:133,n:"Flour",zh:"面粉",c:"food"},{id:139,n:"Fodder",zh:"饲料",c:"food"},
  {id:141,n:"Veg Oil",zh:"植物油",c:"food"},{id:119,n:"Coffee Powder",zh:"咖啡粉",c:"food"},
  {id:134,n:"Butter",zh:"黄油",c:"food"},{id:137,n:"Dough",zh:"面团",c:"food"},{id:138,n:"Sauce",zh:"酱料",c:"food"},
  {id:122,n:"Cheese",zh:"奶酪",c:"food"},{id:140,n:"Chocolate",zh:"巧克力",c:"food"},
  {id:121,n:"Bread",zh:"面包",c:"food"},{id:123,n:"Apple Pie",zh:"苹果派",c:"food"},
  {id:129,n:"Hamburger",zh:"汉堡",c:"food"},{id:131,n:"Meat Balls",zh:"肉丸",c:"food"},
  {id:127,n:"Frozen Pizza",zh:"冷冻披萨",c:"food"},{id:130,n:"Lasagna",zh:"千层面",c:"food"},
  {id:124,n:"Orange Juice",zh:"橙汁",c:"food"},{id:125,n:"Apple Cider",zh:"苹果酒",c:"food"},
  {id:126,n:"Ginger Beer",zh:"姜汁啤酒",c:"food"},{id:128,n:"Pasta",zh:"意大利面",c:"food"},
  {id:132,n:"Cocktails",zh:"鸡尾酒",c:"food"},{id:143,n:"Samosa",zh:"炸三角",c:"food"},
  {id:142,n:"Salad",zh:"沙拉",c:"food"},
  {id:60,n:"Underwear",zh:"内衣",c:"consumer"},{id:61,n:"Gloves",zh:"手套",c:"consumer"},
  {id:62,n:"Dress",zh:"连衣裙",c:"consumer"},{id:63,n:"Stiletto Heel",zh:"细跟高跟鞋",c:"consumer"},
  {id:65,n:"Sneakers",zh:"运动鞋",c:"consumer"},{id:64,n:"Handbags",zh:"手提包",c:"consumer"},
  {id:71,n:"Necklace",zh:"项链",c:"consumer"},{id:70,n:"Luxury Watch",zh:"奢华手表",c:"consumer"},
  {id:24,n:"Smartphones",zh:"智能手机",c:"consumer"},{id:25,n:"Tablets",zh:"平板电脑",c:"consumer"},
  {id:27,n:"Monitors",zh:"显示器",c:"consumer"},{id:28,n:"Televisions",zh:"电视",c:"consumer"},
  {id:26,n:"Laptops",zh:"笔记本电脑",c:"consumer"},{id:53,n:"Economy E-Car",zh:"经济型电动车",c:"consumer"},
  {id:54,n:"Luxury E-Car",zh:"豪华电动车",c:"consumer"},{id:55,n:"Economy Car",zh:"经济型汽车",c:"consumer"},
  {id:56,n:"Luxury Car",zh:"豪华汽车",c:"consumer"},{id:57,n:"Truck",zh:"卡车",c:"consumer"},
  {id:79,n:"High Grade E-Comps",zh:"高级电子元件",c:"aerospace"},
  {id:77,n:"Fuselage",zh:"机身",c:"aerospace"},{id:78,n:"Wing",zh:"机翼",c:"aerospace"},
  {id:84,n:"Propellant Tank",zh:"推进剂罐",c:"aerospace"},{id:85,n:"Solid Fuel Booster",zh:"固体燃料助推器",c:"aerospace"},
  {id:86,n:"Rocket Engine",zh:"火箭发动机",c:"aerospace"},{id:87,n:"Heat Shield",zh:"隔热板",c:"aerospace"},
  {id:89,n:"Jet Engine",zh:"喷气发动机",c:"aerospace"},{id:80,n:"Flight Computer",zh:"飞行电脑",c:"aerospace"},
  {id:81,n:"Cockpit",zh:"驾驶舱",c:"aerospace"},{id:82,n:"Attitude Control",zh:"姿态控制系统",c:"aerospace"},
  {id:88,n:"Ion Drive",zh:"离子驱动",c:"aerospace"},{id:99,n:"Satellite",zh:"卫星",c:"aerospace"},
  {id:90,n:"Sub-orbital 2nd Stage",zh:"亚轨道二级",c:"aerospace"},{id:92,n:"Orbital Booster",zh:"轨道助推器",c:"aerospace"},
  {id:91,n:"Sub-orbital Rocket",zh:"亚轨道火箭",c:"aerospace"},
  {id:95,n:"Jumbo Jet",zh:"巨型客机",c:"aerospace"},{id:96,n:"Luxury Jet",zh:"豪华私人飞机",c:"aerospace"},
  {id:97,n:"Single Engine Plane",zh:"单引擎飞机",c:"aerospace"},
  {id:98,n:"Quadcopter",zh:"四旋翼无人机",c:"aerospace"},
  {id:93,n:"Starship",zh:"星舰",c:"aerospace"},{id:94,n:"BFR",zh:"超重型火箭",c:"aerospace"},
  {id:1,n:"Power",zh:"电力",c:"energy"},
  {id:35,n:"Software",zh:"软件",c:"research"},
  {id:29,n:"Plant Research",zh:"植物研究",c:"research"},{id:30,n:"Energy Research",zh:"能源研究",c:"research"},
  {id:31,n:"Mining Research",zh:"采矿研究",c:"research"},{id:32,n:"Electronics Research",zh:"电子研究",c:"research"},
  {id:33,n:"Breeding Research",zh:"育种研究",c:"research"},{id:34,n:"Chemistry Research",zh:"化学研究",c:"research"},
  {id:58,n:"Automotive Research",zh:"汽车研究",c:"research"},{id:59,n:"Fashion Research",zh:"时尚研究",c:"research"},
  {id:100,n:"Aerospace Research",zh:"航空研究",c:"research"},{id:113,n:"Materials Research",zh:"材料研究",c:"research"},
];

// deduplicate by id
const seenIds = new Set();
const NODES = ALL_N.filter(n => { if (seenIds.has(n.id)) return false; seenIds.add(n.id); return true; });

const ALL_E = [
  {s:1,t:2,a:0.2},{s:2,t:66,a:0.1},{s:1,t:10,a:25},{s:1,t:14,a:20},{s:2,t:14,a:1},{s:1,t:15,a:14},{s:2,t:15,a:0.5},{s:1,t:44,a:2},{s:1,t:16,a:3},{s:44,t:16,a:2},{s:1,t:42,a:7},{s:2,t:42,a:0.5},{s:1,t:68,a:80},{s:2,t:68,a:2},{s:1,t:104,a:1},{s:1,t:105,a:2},{s:2,t:106,a:4},{s:66,t:106,a:1},
  {s:2,t:3,a:3},{s:66,t:3,a:1},{s:2,t:4,a:3},{s:66,t:4,a:1},{s:2,t:5,a:4},{s:66,t:5,a:1},{s:2,t:6,a:0.5},{s:66,t:6,a:1},{s:2,t:9,a:0.4},{s:6,t:9,a:0.5},{s:2,t:40,a:1},{s:66,t:40,a:1},{s:2,t:72,a:3},{s:66,t:72,a:1},{s:2,t:118,a:0.5},{s:66,t:118,a:1},{s:2,t:120,a:2},{s:66,t:120,a:5},{s:2,t:136,a:1},{s:66,t:136,a:1},
  {s:115,t:7,a:0.125},{s:116,t:8,a:0.0625},{s:115,t:46,a:0.125},{s:2,t:115,a:16},{s:139,t:115,a:12},{s:2,t:116,a:4},{s:139,t:116,a:4},{s:2,t:117,a:2},{s:139,t:117,a:0.5},
  {s:1,t:11,a:15},{s:10,t:11,a:0.75},{s:73,t:11,a:0.25},{s:1,t:12,a:15},{s:10,t:12,a:0.75},{s:73,t:12,a:0.25},{s:12,t:13,a:0.005},{s:1,t:13,a:0.01},{s:1,t:19,a:5},{s:10,t:19,a:0.2},{s:1,t:73,a:20},{s:72,t:73,a:10},{s:1,t:74,a:20},{s:10,t:75,a:0.1},{s:1,t:75,a:0.5},{s:74,t:83,a:1},{s:1,t:83,a:5},
  {s:1,t:17,a:0.2},{s:14,t:17,a:1},{s:1,t:18,a:15},{s:15,t:18,a:1},{s:1,t:43,a:5},{s:42,t:43,a:1},{s:17,t:43,a:0.1},{s:1,t:45,a:2},{s:16,t:45,a:1},{s:1,t:69,a:40},{s:68,t:69,a:200},
  {s:103,t:101,a:15},{s:44,t:101,a:20},{s:2,t:101,a:20},{s:43,t:101,a:5},{s:104,t:102,a:0.5},{s:105,t:103,a:3},{s:43,t:107,a:1},{s:1,t:107,a:4},{s:106,t:108,a:0.5},{s:18,t:109,a:2},{s:45,t:109,a:1},{s:43,t:110,a:0.5},{s:108,t:110,a:0.5},{s:21,t:110,a:1},{s:22,t:110,a:1},{s:112,t:111,a:0.125},{s:12,t:111,a:5},{s:109,t:111,a:4},{s:107,t:111,a:8},{s:110,t:111,a:4},{s:43,t:112,a:4},{s:51,t:112,a:1},{s:52,t:112,a:2},
  {s:16,t:20,a:4},{s:17,t:20,a:1},{s:16,t:21,a:3},{s:17,t:21,a:1},{s:17,t:22,a:4},{s:16,t:23,a:5},{s:17,t:23,a:4},{s:16,t:79,a:4},{s:17,t:79,a:3},{s:69,t:79,a:0.0625},
  {s:20,t:24,a:2},{s:21,t:24,a:1},{s:22,t:24,a:1},{s:23,t:24,a:1},{s:18,t:24,a:2},{s:20,t:25,a:2},{s:21,t:25,a:1},{s:22,t:25,a:1},{s:23,t:25,a:2},{s:18,t:25,a:3},{s:20,t:26,a:4},{s:21,t:26,a:3},{s:22,t:26,a:2},{s:23,t:26,a:2},{s:19,t:26,a:3},{s:21,t:27,a:2},{s:23,t:27,a:3},{s:19,t:27,a:3},{s:20,t:28,a:1},{s:21,t:28,a:4},{s:23,t:28,a:4},{s:19,t:28,a:5},
  {s:40,t:41,a:2},{s:1,t:41,a:1},{s:20,t:47,a:2},{s:21,t:47,a:3},{s:43,t:48,a:2},{s:21,t:48,a:3},{s:23,t:49,a:6},{s:18,t:49,a:2},{s:46,t:49,a:5},{s:23,t:50,a:2},{s:19,t:50,a:2},{s:41,t:50,a:5},{s:18,t:51,a:30},{s:45,t:51,a:5},{s:43,t:51,a:5},{s:43,t:52,a:6},{s:17,t:52,a:5},{s:21,t:52,a:5},{s:75,t:76,a:8},
  {s:48,t:53,a:2},{s:50,t:53,a:1},{s:51,t:53,a:1},{s:22,t:53,a:15},{s:47,t:53,a:1},{s:48,t:54,a:4},{s:49,t:54,a:1},{s:51,t:54,a:1},{s:22,t:54,a:30},{s:47,t:54,a:2},{s:52,t:55,a:1},{s:50,t:55,a:1},{s:51,t:55,a:1},{s:47,t:55,a:1},{s:52,t:56,a:2},{s:49,t:56,a:1},{s:51,t:56,a:1},{s:47,t:56,a:2},{s:52,t:57,a:6},{s:50,t:57,a:1},{s:51,t:57,a:1},{s:43,t:57,a:10},{s:47,t:57,a:1},
  {s:41,t:60,a:1},{s:41,t:61,a:0.5},{s:46,t:61,a:0.5},{s:41,t:62,a:3},{s:19,t:62,a:0.5},{s:46,t:63,a:1},{s:19,t:63,a:0.2},{s:46,t:64,a:1.5},{s:19,t:65,a:1},{s:69,t:70,a:0.1},{s:21,t:70,a:2},{s:45,t:70,a:0.5},{s:69,t:71,a:0.25},
  {s:6,t:133,a:15},{s:117,t:134,a:0.5},{s:72,t:135,a:1},{s:1,t:135,a:0.5},{s:133,t:137,a:2},{s:9,t:137,a:1},{s:134,t:137,a:0.5},{s:120,t:138,a:2},{s:134,t:138,a:0.5},{s:2,t:138,a:0.5},{s:120,t:139,a:0.5},{s:6,t:139,a:10},{s:136,t:140,a:10},{s:117,t:140,a:0.5},{s:135,t:140,a:1},{s:120,t:141,a:10},{s:1,t:141,a:1},
  {s:137,t:121,a:1},{s:117,t:122,a:1},{s:137,t:123,a:1},{s:3,t:123,a:2},{s:135,t:123,a:2},{s:4,t:124,a:5},{s:135,t:124,a:1},{s:3,t:125,a:8},{s:2,t:126,a:1},{s:120,t:126,a:3},{s:135,t:126,a:2},{s:137,t:127,a:2},{s:120,t:127,a:2},{s:122,t:127,a:1},{s:8,t:127,a:1},{s:133,t:128,a:2},{s:9,t:128,a:2},{s:7,t:129,a:4},{s:120,t:129,a:3},{s:134,t:129,a:1},{s:121,t:129,a:0.5},{s:141,t:129,a:0.5},{s:7,t:130,a:1},{s:122,t:130,a:0.5},{s:128,t:130,a:1},{s:138,t:130,a:1},{s:8,t:131,a:2},{s:121,t:131,a:1},{s:138,t:131,a:1},{s:141,t:131,a:0.5},{s:124,t:132,a:1},{s:125,t:132,a:1},{s:126,t:132,a:2},{s:118,t:119,a:10},{s:119,t:132,a:8},{s:120,t:142,a:5},{s:141,t:142,a:0.5},{s:122,t:142,a:2},{s:120,t:143,a:5},{s:141,t:143,a:1},{s:133,t:143,a:4},
  {s:48,t:114,a:1},{s:20,t:114,a:2},{s:19,t:114,a:10},
  {s:76,t:77,a:40},{s:76,t:78,a:30},{s:18,t:78,a:5},{s:79,t:80,a:4},{s:47,t:80,a:2},{s:79,t:81,a:4},{s:23,t:81,a:8},{s:50,t:81,a:1},{s:43,t:82,a:3},{s:22,t:82,a:5},{s:48,t:82,a:3},{s:18,t:84,a:50},{s:83,t:84,a:250},{s:18,t:85,a:30},{s:83,t:85,a:100},{s:17,t:85,a:50},{s:43,t:86,a:20},{s:79,t:86,a:8},{s:18,t:86,a:10},{s:43,t:87,a:20},{s:16,t:87,a:30},{s:79,t:88,a:8},{s:22,t:88,a:30},{s:17,t:88,a:15},{s:79,t:89,a:4},{s:18,t:89,a:5},
  {s:77,t:90,a:8},{s:84,t:90,a:2},{s:80,t:90,a:2},{s:88,t:90,a:4},{s:82,t:90,a:2},{s:85,t:91,a:1},{s:90,t:91,a:1},{s:77,t:92,a:40},{s:84,t:92,a:16},{s:86,t:92,a:34},{s:81,t:93,a:2},{s:87,t:93,a:10},{s:82,t:93,a:4},{s:84,t:93,a:6},{s:86,t:93,a:7},{s:92,t:94,a:1},{s:93,t:94,a:1},{s:77,t:95,a:40},{s:78,t:95,a:10},{s:81,t:95,a:2},{s:50,t:95,a:140},{s:89,t:95,a:4},{s:77,t:96,a:14},{s:78,t:96,a:2},{s:81,t:96,a:1},{s:69,t:96,a:2},{s:89,t:96,a:2},{s:77,t:97,a:8},{s:78,t:97,a:2},{s:81,t:97,a:1},{s:52,t:97,a:1},{s:47,t:98,a:1},{s:22,t:98,a:1},{s:21,t:98,a:3},{s:19,t:98,a:2},{s:80,t:99,a:4},{s:88,t:99,a:1},{s:79,t:99,a:8},{s:82,t:99,a:2},
];

const CAT_LABEL = {
  energy:'⚡ Energy', resource:'💧 Resource', agriculture:'🌾 Agriculture',
  mining:'⛏ Mining', refinery:'🛢 Refinery', factory:'🏭 Factory',
  consumer:'🛍 Consumer', aerospace:'🚀 Aerospace', research:'🔬 Research',
  intermediate:'🔩 Intermediate', quarry:'🪨 Quarry', food:'🍽 Food',
  construction:'🏗 Construction',
};
const CAT_ORDER = ['mining','quarry','energy','resource','agriculture','refinery','intermediate','construction','factory','food','consumer','aerospace','research'];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: {'User-Agent':'simco-dump/1.0'} }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function fetchAllResources() {
  const all = [];
  let page = 1;
  while (true) {
    const d = await fetchJson(`https://api.simcotools.com/v1/realms/0/resources?page=${page}`);
    const items = d.resources || [];
    all.push(...items);
    if (items.length < 50) break;
    page++;
  }
  return all;
}

async function main() {
  process.stdout.write('Fetching data...\n');
  const [resources, vwapData] = await Promise.all([
    fetchAllResources(),
    fetchJson('https://api.simcotools.com/v1/realms/0/market/vwaps'),
  ]);

  const resMap = {};
  resources.forEach(r => { resMap[r.id] = { rate: r.producedAnHour || 0, wages: r.wages || 0, transport: r.transportation || 0 }; });

  const vwapMap = {};
  (vwapData.vwaps || []).forEach(v => { if (v.quality === 0) vwapMap[v.resourceId] = v.vwap; });

  const nameMap = {};
  NODES.forEach(n => { nameMap[n.id] = n.n; });

  const recipeMap = {};
  ALL_E.forEach(e => {
    if (!recipeMap[e.t]) recipeMap[e.t] = [];
    recipeMap[e.t].push({ sid: e.s, qty: e.a });
  });

  const FEE = 0.04;
  const TRANSPORT_VWAP = vwapMap[13] || 0.4075;  // Transport resource id=13
  const now = new Date().toISOString().slice(0,10);

  // compute results per node
  const byNode = {};
  for (const node of NODES) {
    const { rate, wages } = resMap[node.id] || { rate:0, wages:0 };
    if (!rate) continue;
    const selfVwap = vwapMap[node.id];
    if (!selfVwap) continue;
    const recipe = recipeMap[node.id] || [];
    let matCost = 0;
    let missing = false;
    const inputLines = [];
    for (const { sid, qty } of recipe) {
      const iv = vwapMap[sid];
      if (!iv) { missing = true; break; }
      const costHr = iv * qty * rate;
      matCost += costHr;
      inputLines.push({ name: nameMap[sid] || sid, qty, vwap: iv, costHr });
    }
    if (missing) continue;
    // 运输费：卖家卖出产品时支付，= 产量/hr × transportation × VWAP_transport
    const selfTransport = (resMap[node.id] || {}).transport || 0;
    const transportCost = rate * selfTransport * TRANSPORT_VWAP;
    const revenue = rate * selfVwap * (1 - FEE);
    const profit = revenue - matCost - transportCost - wages;
    const margin = (revenue - matCost - transportCost - wages) / revenue * 100;
    byNode[node.id] = { ...node, rate, wages, selfVwap, selfTransport, matCost, transportCost, revenue, profit, margin, inputLines };
  }

  // group by category, sort by profit desc within each
  const grouped = {};
  for (const node of NODES) {
    if (!byNode[node.id]) continue;
    const cat = node.c;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(byNode[node.id]);
  }
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a,b) => b.profit - a.profit);
  }

  // build markdown
  const lines = [];
  lines.push(`# SimCompanies 单步加工利润数据`);
  lines.push(`\n> 数据来源：SimcoTools API | 更新时间：${now} | 卖家手续费：4% | quality=0`);
  lines.push(`\n---\n`);

  // compute direct profit for all nodes
  const withDirect = Object.values(byNode).map(r => {
    const directRevenue = r.rate * r.selfVwap * 0.97;
    const directTransport = r.rate * r.selfTransport * 0.5 * TRANSPORT_VWAP;
    const directProfit = directRevenue - r.matCost - directTransport - r.wages;
    return { ...r, directProfit };
  });

  // top 20 by market profit
  const allSorted = [...withDirect].sort((a,b) => b.profit - a.profit);
  lines.push(`## 综合排名 Top 20（市场出售，净利润/hr）\n`);
  lines.push(`| 排名 | 产品 | 类别 | VWAP | 产量/hr | 原料成本/hr | 工资/hr | 净利润/hr | 毛利% |`);
  lines.push(`|------|------|------|------|---------|------------|--------|----------|-------|`);
  allSorted.slice(0,20).forEach((r,i) => {
    lines.push(`| ${i+1} | ${r.n} (${r.zh}) | ${r.c} | ${r.selfVwap.toFixed(4)} | ${r.rate.toFixed(1)} | ${r.matCost.toFixed(0)} | ${r.wages} | **${r.profit.toFixed(0)}** | ${r.margin.toFixed(1)}% |`);
  });

  lines.push(`\n---\n`);

  // top 20 by direct profit
  const directSorted = [...withDirect].sort((a,b) => b.directProfit - a.directProfit);
  lines.push(`## 综合排名 Top 20（直售 -3%，运输减半，净利润/hr）\n`);
  lines.push(`| 排名 | 产品 | 类别 | VWAP | 运输单元 | 产量/hr | 原料成本/hr | 工资/hr | 直售利润/hr | vs 市场 |`);
  lines.push(`|------|------|------|------|---------|---------|------------|--------|------------|--------|`);
  directSorted.slice(0,20).forEach((r,i) => {
    const diff = r.directProfit - r.profit;
    const diffStr = diff >= 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0);
    lines.push(`| ${i+1} | ${r.n} (${r.zh}) | ${r.c} | ${r.selfVwap.toFixed(4)} | ${r.selfTransport} | ${r.rate.toFixed(1)} | ${r.matCost.toFixed(0)} | ${r.wages} | **${r.directProfit.toFixed(0)}** | ${diffStr} |`);
  });

  lines.push(`\n---\n`);

  // per category
  for (const cat of CAT_ORDER) {
    const items = grouped[cat];
    if (!items || !items.length) continue;
    const label = CAT_LABEL[cat] || cat;
    lines.push(`## ${label}\n`);
    lines.push(`| 产品 | VWAP | 运输单元 | 产量/hr | 原料明细 (原料×用量 @ 单价) | 原料成本/hr | 单位原料成本 | 运输成本/hr | 单位运输成本 | 工资/hr | 单位工资 | 收入/hr | 净利润/hr | 毛利% | 直售利润/hr | 直售差值 |`);
    lines.push(`|------|------|---------|---------|--------------------------|------------|------------|-----------|------------|--------|--------|--------|----------|-------|------------|--------|`);
    for (const r of items) {
      const inputStr = r.inputLines.length
        ? r.inputLines.map(i => `${i.name}×${i.qty}@${i.vwap.toFixed(3)}`).join(', ')
        : '—';
      const profitStr = r.profit >= 0 ? `**+${r.profit.toFixed(0)}**` : `${r.profit.toFixed(0)}`;
      const unitMat = (r.matCost / r.rate).toFixed(3);
      const unitTrans = (r.transportCost / r.rate).toFixed(3);
      const unitWage = (r.wages / r.rate).toFixed(3);
      // 直售：市价-3%，无4%手续费，运输减半
      const directRevenue = r.rate * r.selfVwap * 0.97;
      const directTransport = r.rate * r.selfTransport * 0.5 * TRANSPORT_VWAP;
      const directProfit = directRevenue - r.matCost - directTransport - r.wages;
      const directDiff = directProfit - r.profit;
      const directStr = directProfit >= 0 ? `**+${directProfit.toFixed(0)}**` : `${directProfit.toFixed(0)}`;
      const diffStr = directDiff >= 0 ? `+${directDiff.toFixed(0)}` : `${directDiff.toFixed(0)}`;
      lines.push(`| ${r.n} (${r.zh}) | ${r.selfVwap.toFixed(4)} | ${r.selfTransport} | ${r.rate.toFixed(1)} | ${inputStr} | ${r.matCost.toFixed(0)} | ${unitMat} | ${r.transportCost.toFixed(0)} | ${unitTrans} | ${r.wages} | ${unitWage} | ${r.revenue.toFixed(0)} | ${profitStr} | ${r.margin.toFixed(1)}% | ${directStr} | ${diffStr} |`);
    }
    lines.push('');
  }

  const out = lines.join('\n');
  const outPath = '../Simcompanies-production-relationships/market_data.md';
  fs.writeFileSync(outPath, out, 'utf8');
  process.stdout.write(`Done: ${outPath} (${allSorted.length} products)\n`);
}

main().catch(console.error);
