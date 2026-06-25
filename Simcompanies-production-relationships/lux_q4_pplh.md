# Q4 Luxury Jet — 每栋建筑 PPLH 分析

**数据日期**: 2026-03-31
**分析工具**: `scripts/sep_analysis.js` 同逻辑，手动计算
**价格基准**: 30天及89天成交量加权均价（VWAP）
**约束条件**: **矿山/农场不纳入建造计划**（Sand、Minerals、Crude Oil、Bauxite、Iron Ore、Gold Ore、Cotton、Seeds、Water 均从市场外购）

---

## 链路结构

```
Luxury Jet (Q4)
├── Fuselage    ×14  [自产]
│   └── Carbon Composite ×40
│       └── Carbon Fibers ×8  (Crude Oil Q0 外购)
├── Wing        ×2   [条件自产]
│   ├── Carbon Composite ×30
│   └── Aluminium ×5  (Bauxite Q1 外购)
├── Cockpit     ×1   [自产]
│   ├── High Grade E-Comps ×4
│   ├── Displays ×8
│   └── Basic Interior ×1
│       ├── Displays ×2
│       ├── Plastic ×2  (Crude Oil Q0 外购)
│       └── Fabric ×5   (Cotton Q1 外购)
├── Golden Bars ×2   [永久外购，不可VI]
└── Jet Engine  ×2   [自产]
    ├── High Grade E-Comps ×4
    └── Aluminium ×5

High Grade E-Comps: Silicon×4 + Chemicals×3 + Golden Bars×0.0625
Chemicals: Minerals Q0 外购
Silicon:   Sand Q0 外购
Aluminium: Bauxite Q1 外购
```

---

## 全链路 PPLH 表（仅工厂，矿山全部外购）

| 建筑 | Q | 产率/hr | 30天 PPLH | 89天 PPLH | 30天售价 |
|------|---|---------|-----------|-----------|---------|
| **LJ Hangar** | Q4 | 0.195 | N/A | N/A | — （SO定价） |
| Plastic 工厂 | Q2 | 224.2 | **+$969** | **+$936** | $13.89 |
| Aluminium 冶炼 | Q2 | 129.7 | **+$943** | **+$878** | $24.37 |
| Silicon 工厂 | Q1 | 166.8 | **+$611** | **+$522** | $9.15 |
| High Grade E-Comps | Q2 | 1.976 | **+$574** | **+$484** | $1,036 |
| Jet Engine | Q3 | 0.946 | **+$521** | **+$429** | $5,703 |
| Carbon Fibers 工厂 | Q1 | 269.0 | +$471 | +$483 | $7.26 |
| Fabric 工厂 | Q2 | 247.6 | +$444 | +$394 | $6.22 |
| Cockpit | Q3 | 2.602 | +$425 | +$188 | $6,307 |
| Displays 工厂 | Q2 | 34.6 | +$336 | +$272 | $137.37 |
| Chemicals 工厂 | Q1 | 231.7 | +$328 | +$279 | $16.36 |
| Basic Interior | Q2 | 34.8 | +$269 | +$187 | $368.98 |
| Carbon Composite | Q2 | 74.1 | +$187 | +$157 | $68.97 |
| Fuselage | Q3 | 3.699 | +$129 | +$117 | $3,075 |
| **Wing** | Q3 | 9.079 | **-$14** ⚠️ | **+$217** | $2,348 |
| **全链路合计** | | | **+$6,207** | **+$5,543** | （不含Hangar） |

> 矿山外购成本已计入对应工厂的输入成本中（如 Bauxite Q1 $12.94 → Aluminium 输入成本）

---

## Golden Bars：不可消除的结构性成本

| 来源 | GB数量/架 | 30天成本/架 | 成本/hr |
|------|----------|------------|--------|
| 直接消耗（LJ配方） | 2.000 GB | $13,656 | **$2,666/hr** |
| 间接（HGE中 0.0625×12） | 0.750 GB | $5,121 | **$1,000/hr** |
| **合计** | **2.750 GB** | **$18,777** | **$3,665/hr** |

**GB 占 Hangar 总输入成本的 23.7%**（$3,665 / $15,447），且完全无法通过VI消除。
这是 LJ 区别于 SEP 的核心结构风险：GB 价格波动直接击穿 Hangar 利润。

---

## Hangar 盈亏平衡

LJ Q4 通过 Sales Office 销售，不在交易所定价。

| 项目（30天均价） | 数值 |
|----------------|------|
| 外购全套Q3组件成本/架 | $79,258 |
| Hangar 输入成本/hr | $15,447 |
| Hangar 工资/hr | $759 |
| **盈亏平衡售价（Q3全外购）** | **$86,467/架** |
| 盈亏平衡售价（89天均价） | $84,116/架 |

> GB 直接贡献 $13,656（$86,467 的 15.8%）到每架 LJ 的保本价中。

---

## 11 → 12 → 13 槽扩展方案

| 方案 | 建筑数 | 新增建筑 | 累计链路 PPLH/hr |
|------|--------|---------|-----------------|
| **11槽** | 10+Hangar | Cockpit (+$425) | **$5,622** |
| **12槽** | 11+Hangar | Displays (+$336) | **$5,957** |
| **13槽** | 12+Hangar | Chemicals (+$328) | **$6,256** |

11槽推荐建筑（按优先级）：

```
Hangar（强制）
① Plastic 工厂       +$969/hr  （Crude Oil Q0 外购）
② Aluminium 冶炼     +$943/hr  （Bauxite Q1 外购）
③ Silicon 工厂       +$611/hr  （Sand Q0 外购）
④ High Grade E-Comps +$574/hr
⑤ Jet Engine         +$521/hr
⑥ Carbon Fibers 工厂 +$471/hr  （Crude Oil Q0 外购）
⑦ Fabric 工厂        +$444/hr  （Cotton Q1 外购）
⑧ Cockpit            +$425/hr
⑨ Displays 工厂      +$336/hr
⑩ Chemicals 工厂     +$328/hr  （Minerals Q0 外购）
```

---

## Wing 波动性分析

| 指标 | 数值 |
|------|------|
| Wing Q3 保本价 | **$2,350** |
| 30天均价 | $2,348（-$14/hr，近零） |
| 89天均价 | $2,329（+$217/hr，正收益） |
| 价格敏感度 | **$9.1/hr per $1** |

Wing 在 LJ 链中消耗量仅 2×0.195 = 0.39 架翅膀/hr，利用率极低，是否自产取决于当前价格是否超过保本价 $2,350。

---

## LJ vs SEP 关键差异

| 指标 | LJ Q4 | SEP Q4 |
|------|-------|--------|
| Hangar 产率 | 0.195/hr | 1.708/hr（9×更快） |
| 全链路 PPLH（仅工厂，30d） | +$6,207/hr | +$5,407/hr |
| GB 不可VI成本/hr | **$3,665/hr** | ~$400/hr（仅HGE中） |
| 直接输入 GB | 2/架 | 0 |
| Jet Engine vs CE | 使用 JE（复杂） | 使用 CE（简单） |
| Wing/Cockpit 自产可行性 | 低利用率，条件性 | 高利用率，推荐自产 |
| Hangar 盈亏平衡（全外购） | **$86,467** | $38,290 |

> **LJ 全链路 PPLH 略高于 SEP（仅计工厂）**，但 GB 结构性成本使 Hangar 的盈亏平衡价高出一倍以上。LJ 的利润空间更依赖 SO 定价是否有溢价。

---

## 更新价格缓存

```bash
node scripts/fetch_prices.js   # 重新抓取（约3-5分钟）
```
