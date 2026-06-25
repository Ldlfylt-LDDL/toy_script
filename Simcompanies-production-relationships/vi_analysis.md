# 垂直整合（VI）分析汇总

> 分析方法：迭代收敛法，2026-03-16
> 数据来源：SimcoTools API + SimCompanies Encyclopedia API

---

## 方法论

### 迭代收敛算法

单次计算利用率不准确，必须迭代：

1. 计算当前自产集所有节点的**利用率** = 下游总消耗 / 全服producedAnHour
2. 剔除利用率 < 0.2 的节点（改为外购）
3. 重新计算剩余节点的利用率（因消费者减少，上游利用率可能级联下降）
4. 重复直到稳定

典型案例：Plastic 被剔除 → Crude Oil 失去所有消费者 → Crude Oil 也被剔除（级联效应）

### 评分公式

```
VI评分 = 层级深度 × (自产节点数 / 总节点数)
```

- **层级深度**（L0 Power 到终端产品）：越深说明生产链越复杂
- **自产比例**：迭代稳定后仍能自产的节点占总节点的比例
- 理论上限：Economy Car = 6 × (23/23) = **6.0**（唯一全自产合格链）

### 外购决策门槛

| 利用率 | 决策 |
|---|---|
| ≥ 0.2 | 自产（建筑利用率合格） |
| < 0.2 | 外购（建筑太空闲，不值得自建） |

---

## 全产品 VI 评分汇总

### 车辆 & 建筑类

| 产品 | 层级 | 节点数 | 自产数 | 最低利用率 | VI评分 | 结论 |
|---|---|---|---|---|---|---|
| Economy Car | L6 | 23 | 23 | 0.223(Sand) | **6.0** | 全树无短板，唯一全自产合格链 |
| Economy E-Car | L6 | 25 | 24 | 0.223(Sand) | **5.8** | 几乎全自产，仅外购Water |
| Bulldozer | L6 | 15 | 13 | 0.223(Sand) | **5.2** | 高自产率，仅外购Water |
| Diesel | L5 | 6 | 6 | 0.495 | 5.0 | 最干净的链，全树合格 |
| Luxury E-Car | L8 | 26 | 12 | 0.223(Sand) | 3.7 | 外购Luxury Interior/Car Body |
| Luxury Car | L8 | 25 | 9 | 0.223(Sand) | 2.9 | 外购Luxury Interior/Car Body/Steel |
| Truck | L6 | 24 | 11 | 0.223(Sand) | 2.8 | 外购Basic Interior等 |
| Construction Units | L7 | 26 | 4 | 0.230(Windows) | 1.1 | 仅Bauxite→Aluminium→Windows→CU |
| Transport | L6 | 8 | 1 | —（仅终端） | 0.8 | 终端产品，所有原料外购 |

### 食品类

| 产品 | 层级 | 节点数 | 自产数 | 最低利用率 | VI评分 | 结论 |
|---|---|---|---|---|---|---|
| Bread | L8 | 11 | 7 | 0.278(Flour) | **5.1** | 极深，主干完美 |
| Apple Pie | L8 | 14 | 8 | 0.278(Flour) | **4.6** | 共享Bread链，侧线产品 |
| Frozen Pizza | L8 | 14 | 8 | 0.278(Flour) | **4.6** | Cheese 1.667，共享Bread链 |
| Dough | L7 | 11 | 6 | 0.278(Flour) | 3.8 | Bread子链，单独建链意义不大 |
| Salad | L7 | 10 | 2 | 0.798(Cheese) | 1.4 | 仅自产Salad+Cheese |
| Lasagna | L8 | 16 | 2 | 2.000(Sauce) | 1.0 | 仅自产Lasagna+Sauce |
| Meat Balls | L9 | 16 | 2 | 1.333(Sauce) | 1.1 | Bread链延伸时有价值 |
| Sauce | L7 | 9 | 1 | —（仅终端） | 0.8 | 终端单节点 |
| Hamburger | L9 | 15 | 1 | —（仅终端） | 0.6 | Bread链延伸时有价值 |
| Butter/Steak/Sausages/Cheese | L6 | 8 | 1 | —（仅终端） | 0.8 | 农业原料全外购 |
| Chocolate | L6 | 11 | 1 | —（仅终端） | 0.5 | 可可/牛奶/糖全外购 |
| Cocktails | L6 | 14 | 1 | —（仅终端） | 0.4 | 12项原料全外购 |

### 电子 & 机器人类

| 产品 | 层级 | 节点数 | 自产数 | 最低利用率 | VI评分 | 结论 |
|---|---|---|---|---|---|---|
| Quadcopter | L6 | 12 | 9 | 0.223(Sand) | **4.5** | 电子链，3轮迭代保留9节点 |
| Satellite | L7 | 19 | 6 | 0.206(Ion Drive) | 2.2 | 6轮迭代自产比例从75%崩塌至30% |
| Robots | L6 | 13 | 4 | 0.223(Sand) | 1.8 | 迭代后仅Sand→Silicon→Processors→Robots |

### 奢侈品类

| 产品 | 层级 | 节点数 | 自产数 | 全服产量/hr | 最低利用率 | VI评分 | 结论 |
|---|---|---|---|---|---|---|---|
| Luxury Interior | L7 | 16 | 9 | 21.7 | 0.223(Sand) | 3.9 | 电子+铝+皮革链 |
| Gloves | L7 | 11 | 6 | 147.0 | 0.204(Water) | 3.8 | 全链几乎合格，Fabric+Leather |
| Necklace | L4 | 5 | 3 | 42.6 | 0.328(GoldBars) | 2.4 | 简单金条链 |
| Handbags | L7 | 9 | 2 | 69.6 | 3.375(Leather) | 1.6 | 仅自产Handbags+Leather |
| Stiletto Heel | L7 | 11 | 2 | 100.6 | 3.250(Leather) | 1.3 | 仅自产Stiletto+Leather |
| Leather | L6 | 8 | 1 | 31.0 | —（仅终端） | 0.8 | 终端单节点 |

### 航空航天类

| 产品 | 层级 | 节点数 | 自产数 | 全服产量/hr | 最低利用率 | VI评分 | 结论 |
|---|---|---|---|---|---|---|---|
| Sub-orbital Rocket | L8 | 31 | 27 | 0.73 | 0.218(2ndStg) | **7.0** | 几乎全自产，外购Water/GoldenBars/GoldOre |
| Sub-orbital 2nd Stage | L7 | 29 | 25 | 3.36 | 0.223(Sand) | **6.0** | 高自产率，是Rocket的核心子链 |
| Jumbo Jet | L7 | 25 | 18 | 0.07 | 0.223(Sand) | 5.0 | 外购Wing/Cockpit，自产率最高的飞机 |
| Attitude Control | L6 | 12 | 10 | 3.12 | 0.223(Sand) | **5.0** | 高自产率，仅外购Water |
| BFR | L8 | 36 | 22 | 0.24 | 0.223(Sand) | 4.9 | 最大节点数 |
| Starship | L7 | 31 | 21 | 0.34 | 0.223(Sand) | 4.7 | 21节点自产 |
| Single Engine Plane | L7 | 28 | 17 | 1.71 | 0.223(Sand) | 4.3 | 外购Fiberglass/Steel等 |
| Flight Computer | L6 | 13 | 9 | 2.60 | 0.223(Sand) | 4.2 | 外购GoldenBars/GoldOre |
| Orbital Booster | L6 | 22 | 12 | 1.68 | 0.586(CrudeOil) | 3.3 | 外购Steel/Sand等 |
| Cockpit | L6 | 17 | 7 | 2.60 | 0.223(Sand) | 2.5 | 外购Plastic/Gold系列 |
| Luxury Jet | L7 | 25 | 7 | 0.20 | 0.413(JetEng) | 2.0 | 仅7节点自产 |

---

## 跨类别 TOP 排名

| 排名 | 产品 | 类别 | VI评分 | 备注 |
|---|---|---|---|---|
| 1 | Sub-orbital Rocket | 航天 | **7.0** | 全游戏最高，但需要 Sales Office 销售 |
| 2 | Economy Car | 车辆 | **6.0** | 唯一全自产交易行产品，VWAP 可追踪 |
| 2 | Sub-orbital 2nd Stage | 航天 | **6.0** | Rocket 的子链，本身无法单独销售 |
| 4 | Economy E-Car | 车辆 | **5.8** | 接近 Economy Car，近年新品 |
| 5 | Bread | 食品 | **5.1** | 食品类最优，交易量大 |
| 5 | Bulldozer | 车辆 | **5.2** | 高 VI，建筑类利基市场 |

---

## 关键结论

### VI 高分 ≠ 利润高
- Sub-orbital Rocket VI=7.0，但销售机制完全不同（Sales Office），无法简单对比利润
- Economy Car VI=6.0，全自产但市场竞争激烈，利润取决于市场价格

### 为什么 Quadcopter VI 仅 4.5
- Water（利用率 0.072）、Plastic（0.128）、Crude Oil（级联归零）三个节点被迭代剔除
- 剩余 9/12 节点，评分 = 6×(9/12) = 4.5
- 对比 Economy Car 的 6.0，差距来自这 3 个外购节点

### VI 适合什么场景
- 适合：已有相关建筑基础、产品 VWAP 稳定、市场有深度
- 不适合：终端产品价格波动大（如特殊订单驱动）、初期资金不足建全链

### Sand（沙子）是隐性瓶颈
- 几乎所有链的最低利用率都是 Sand（0.223）
- Sand 是 Silicon 的原料，而 Silicon 是电子产业链的底层
- 如果全力做垂直整合，Sand 建筑会是最薄弱的一环
