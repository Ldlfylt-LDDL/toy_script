> 属于 航空航天类 分析文件，主索引见 product_analysis.md

# SimCompanies 航空航天类产品分析

航空航天类产品（飞机、火箭、航天器等）是游戏中生产链最复杂的一类，通常需要 Carbon Composite、Fuselage、Wing、Flight Computer 等高级中间件。由于全服产量极低（0.1-3.4/hr），大部分节点利用率不合格，需要大量外购。

## 游戏机制

> 来源：Aerospace industry guide (The Center)

### 建筑与产品对应


| 建筑                                    | 生产的产品                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Aerospace Electronics（航空电子）           | Flight Computer、Cockpit、Attitude Control、Quadcopter、Satellite                            |
| Aerospace Factory（航空工厂）               | Fuselage、Wing、Propellant Tank、Heat Shield、Sub-orbital 2nd Stage、Orbital Booster、Starship |
| Propulsion Factory（推进工厂）              | Electric Motor、Combustion Engine、Solid Fuel Booster、Rocket Engine、Ion Drive、Jet Engine   |
| Hangar（机库）                            | Jumbo Jet、Luxury Jet、Single Engine Plane                                                 |
| Vertical Integration Facility（垂直整合设施） | Sub-orbital Rocket、BFR                                                                   |
| Launch Pad（发射台）                       | 生产 Aerospace Research（发射火箭获得研究点）                                                         |
| Sales Offices（销售办公室）                  | **零售建筑**：Sub-orbital Rocket、BFR、Jumbo Jet、Luxury Jet、Single Engine Plane、Satellite       |


> Quadcopter 是唯一可在普通 Electronic Stores 销售的航空产品，其余终端产品只能通过 Sales Offices。

### Sales Offices 销售机制

航空产品**不通过交易行**，而是通过 Sales Offices 寻找企业买家：

- **每级建筑 = 1个并发订单槽**（L2 同时找2个，L3 同时找3个，以此类推）
- **搜索时间：约 47 小时**，期间持续支付工资（搜索费用）
- 找到订单后**无时间限制**，可随时选择履行或拒绝
- 订单通常要求交付 **1~2 种终端产品，数量较少**
- 质量无硬性要求，但**高品质 = 更高报酬**
- **搜索费用计入收入表的"销售"行**（下期 IS 中扣除），并非 COGS
- **拒绝订单** = 损失全部搜索费用（例如$30k）；即使亏损$10k 接单也比拒绝合算
- 订单需求**基于全服该产品的交付量建模**（非纯随机）
- 销售速度加成 (Sales Speed Bonus) 可降低搜索工资

**收入表示例**（产品卖$200k，制造成本$100k，启动2个SO各$25k搜索费）：


| 项目     | 无SO          | 有2个SO                 |
| ------ | ------------ | --------------------- |
| Sales  | $200,000     | $150,000（扣除2×$25k搜索费） |
| COGS   | $100,000     | $100,000              |
| **利润** | **$100,000** | **$50,000**           |


### Aerospace Research（航空科研）机制

与其他科研类型完全不同：

- **通过发射火箭获得研究点**，而非持续生产
- 可用火箭：**BFR** 和 **Sub-orbital Rocket**
- 必须建造 **Launch Pad（发射台）**
- **有失败概率**：任务失败 = 损失火箭 + 不获得研究点
- 失败概率取决于**火箭品质**（品质越高，失败率越低）
- 发射队列上限：**30 枚火箭**

> 这意味着 Aerospace Research 的成本 = 火箭制造成本 × 失败率，不能像普通科研一样简单计算 PPLH。

---

## Sub-orbital Rocket（亚轨道火箭）`id:91`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                                    |
| -------- | ------------------------------------ |
| 层级深度     | L8（Power L0 → Sub-orbital Rocket L8） |
| 完整依赖树节点数 | 31（含 Power）                          |
| 推荐自产节点数  | 27                                   |
| 推荐外购节点数  | 3（水、金条、金矿）                           |
| 全服务器产量   | 0.73/hr                              |


### 生产配方

```
Sub-orbital Rocket <- Solid Fuel Boosterx1 + Sub-orbital 2nd Stagex1
Solid Fuel Booster <- Aluminiumx30 + Rocket Fuelx100 + Chemicalsx50
Sub-orbital 2nd Stage <- Fuselagex8 + Propellant Tankx2 + Flight Computerx2 + Ion Drivex4 + Attitude Controlx2
Aluminium <- Powerx15 + Bauxitex1
Rocket Fuel <- Methanex1 + Powerx5
Chemicals <- Powerx0.2 + Mineralsx1
Fuselage <- Carbon Compositex40
Propellant Tank <- Aluminiumx50 + Rocket Fuelx250
Flight Computer <- High Grade E-Compsx4 + On-board Computerx2
Ion Drive <- High Grade E-Compsx8 + Batteriesx30 + Chemicalsx15
Attitude Control <- Steelx3 + Batteriesx5 + Electric Motorx3
Bauxite <- Powerx14 + Waterx0.5
Methane <- Powerx20
Minerals <- Powerx20 + Waterx1
Carbon Composite <- Carbon Fibersx8
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
On-board Computer <- Processorsx2 + Electronic Compsx3
Batteries <- Chemicalsx4
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Electric Motor <- Steelx2 + Electronic Compsx3
Carbon Fibers <- Crude Oilx0.1 + Powerx0.5
Silicon <- Powerx3 + Sandx2
Processors <- Siliconx4 + Chemicalsx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Iron Ore <- Powerx7 + Waterx0.5
Crude Oil <- Powerx25
Sand <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand  Crude Oil  Methane
L2  Silicon  Iron Ore  Bauxite  Minerals  Carbon Fibers  Rocket Fuel
L3  Chemicals  Carbon Composite  Aluminium
L4  Steel  Batteries  Propellant Tank  Solid Fuel Booster  Processors  Electronic Comps  Fuselage  High Grade E-Comps
L5  Electric Motor  On-board Computer  Ion Drive
L6  Attitude Control  Flight Computer
L7  Sub-orbital 2nd Stage
L8  Sub-orbital Rocket
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                           | 产量/hr  | 利用率    | 决策   |
| ---------------------------- | ------ | ------ | ---- |
| Sub-orbital 2nd Stage（亚轨道二级） | 3.4    | 0.218  | ✓ 自产 |
| Sand（沙）                      | 1496.9 | 0.223  | ✓ 自产 |
| Electric Motor（电动机）          | 34.7   | 0.270  | ✓ 自产 |
| On-board Computer（车载电脑）      | 14.8   | 0.351  | ✓ 自产 |
| Steel（钢铁）                    | 208.5  | 0.378  | ✓ 自产 |
| Crude Oil（原油）                | 45.9   | 0.586  | ✓ 自产 |
| Chemicals（化学品）               | 231.7  | 0.928  | ✓ 自产 |
| Silicon（硅）                   | 166.8  | 1.084  | ✓ 自产 |
| Iron Ore（铁矿）                 | 191.6  | 1.088  | ✓ 自产 |
| Batteries（电池）                | 27.2   | 1.271  | ✓ 自产 |
| Bauxite（铝土矿）                 | 101.8  | 1.275  | ✓ 自产 |
| Propellant Tank（推进剂罐）        | 5.0    | 1.333  | ✓ 自产 |
| Methane（甲烷）                  | 61.2   | 1.399  | ✓ 自产 |
| Minerals（矿物质）                | 125.7  | 1.842  | ✓ 自产 |
| Carbon Composite（碳复合材料）      | 74.1   | 1.996  | ✓ 自产 |
| Aluminium（铝）                 | 129.7  | 2.017  | ✓ 自产 |
| Attitude Control（姿态控制）       | 3.1    | 2.154  | ✓ 自产 |
| Carbon Fibers（碳纤维）           | 269.0  | 2.205  | ✓ 自产 |
| Solid Fuel Booster（固体燃料助推器）  | 0.3    | 2.321  | ✓ 自产 |
| Flight Computer（飞行计算机）       | 2.6    | 2.585  | ✓ 自产 |
| Processors（处理器）              | 9.9    | 3.000  | ✓ 自产 |
| Electronic Comps（电子元件）       | 44.5   | 3.341  | ✓ 自产 |
| Fuselage（机身）                 | 3.7    | 7.273  | ✓ 自产 |
| High Grade E-Comps（高品质电子元件）  | 2.0    | 7.821  | ✓ 自产 |
| Rocket Fuel（火箭燃料）            | 85.6   | 15.101 | ✓ 自产 |
| Ion Drive（离子推进器）             | 0.6    | 21.324 | ✓ 自产 |


### 结论

- **自产**（27 节点）：Sub-orbital Rocket、Solid Fuel Booster、Sub-orbital 2nd Stage、Aluminium、Rocket Fuel、Chemicals、Fuselage、Propellant Tank、Flight Computer、Ion Drive、Attitude Control、Bauxite、Methane、Minerals、Carbon Composite、High Grade E-Comps、On-board Computer、Batteries、Steel、Electric Motor、Carbon Fibers、Silicon、Processors、Electronic Comps、Iron Ore、Crude Oil、Sand
- **外购**（3 项）：Water、Golden Bars、Gold Ore
- 链底最低利用率：Sub-orbital 2nd Stage（0.218）

---

## BFR（BFR）`id:94`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                            |
| -------- | ---------------------------- |
| 层级深度     | L8（Power L0 → BFR L8）        |
| 完整依赖树节点数 | 36（含 Power）                  |
| 推荐自产节点数  | 22                           |
| 推荐外购节点数  | 13（轨道助推器、机身、碳复合材料、基础内饰、碳纤维等） |
| 全服务器产量   | 0.24/hr                      |


### 生产配方

```
BFR <- Orbital Boosterx1 + Starshipx1
Starship <- Cockpitx2 + Heat Shieldx10 + Attitude Controlx4 + Propellant Tankx6 + Rocket Enginex7
Propellant Tank <- Aluminiumx50 + Rocket Fuelx250
Rocket Engine <- Steelx20 + High Grade E-Compsx8 + Aluminiumx10
Cockpit <- High Grade E-Compsx4 + Displaysx8 + Basic Interiorx1
Heat Shield <- Steelx20 + Siliconx30
Attitude Control <- Steelx3 + Batteriesx5 + Electric Motorx3
Aluminium <- Powerx15 + Bauxitex1
Rocket Fuel <- Methanex1 + Powerx5
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
Displays <- Siliconx5 + Chemicalsx4
Silicon <- Powerx3 + Sandx2
Batteries <- Chemicalsx4
Electric Motor <- Steelx2 + Electronic Compsx3
Bauxite <- Powerx14 + Waterx0.5
Methane <- Powerx20
Iron Ore <- Powerx7 + Waterx0.5
Chemicals <- Powerx0.2 + Mineralsx1
Sand <- Powerx2
Electronic Comps <- Siliconx3 + Chemicalsx1
Minerals <- Powerx20 + Waterx1
```

### 层级结构

```
L0  Power
L1  Sand  Methane
L2  Iron Ore  Bauxite  Minerals  Silicon  Rocket Fuel
L3  Chemicals  Aluminium
L4  Propellant Tank  Batteries  Displays  Steel  Electronic Comps  High Grade E-Comps
L5  Heat Shield  Electric Motor  Rocket Engine
L6  Cockpit  Attitude Control
L7  Starship
L8  BFR
```

### 利用率分析（迭代收敛，共 6 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr  | 利用率    | 决策   |
| --------------------------- | ------ | ------ | ---- |
| Sand（沙）                     | 1496.9 | 0.223  | ✓ 自产 |
| Heat Shield（热防护层）           | 13.5   | 0.250  | ✓ 自产 |
| Cockpit（驾驶舱）                | 2.6    | 0.258  | ✓ 自产 |
| Electric Motor（电动机）         | 34.7   | 0.270  | ✓ 自产 |
| Propellant Tank（推进剂罐）       | 5.0    | 0.400  | ✓ 自产 |
| Attitude Control（姿态控制）      | 3.1    | 0.431  | ✓ 自产 |
| Batteries（电池）               | 27.2   | 0.575  | ✓ 自产 |
| Displays（显示屏）               | 34.6   | 0.602  | ✓ 自产 |
| Starship（飞船）                | 0.3    | 0.726  | ✓ 自产 |
| Iron Ore（铁矿）                | 191.6  | 1.088  | ✓ 自产 |
| Bauxite（铝土矿）                | 101.8  | 1.275  | ✓ 自产 |
| Chemicals（化学品）              | 231.7  | 1.374  | ✓ 自产 |
| Methane（甲烷）                 | 61.2   | 1.399  | ✓ 自产 |
| Steel（钢铁）                   | 208.5  | 1.698  | ✓ 自产 |
| Minerals（矿物质）               | 125.7  | 1.842  | ✓ 自产 |
| Aluminium（铝）                | 129.7  | 1.968  | ✓ 自产 |
| Electronic Comps（电子元件）      | 44.5   | 2.341  | ✓ 自产 |
| Silicon（硅）                  | 166.8  | 4.303  | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0    | 6.544  | ✓ 自产 |
| Rocket Engine（火箭发动机）        | 0.3    | 7.463  | ✓ 自产 |
| Rocket Fuel（火箭燃料）           | 85.6   | 14.733 | ✓ 自产 |


### 结论

- **自产**（22 节点）：BFR、Starship、Propellant Tank、Rocket Engine、Cockpit、Heat Shield、Attitude Control、Aluminium、Rocket Fuel、Steel、High Grade E-Comps、Displays、Silicon、Batteries、Electric Motor、Bauxite、Methane、Iron Ore、Chemicals、Sand、Electronic Comps、Minerals
- **外购**（13 项）：Orbital Booster、Fuselage、Carbon Composite、Basic Interior、Carbon Fibers、Golden Bars、Plastic、Fabric、Crude Oil、Water、Gold Ore、Cotton、Seeds
- 链底最低利用率：Sand（0.223）

---

## Jumbo Jet（巨型客机）`id:95`

**分析日期**：2026-03-30
**数据来源**：SimcoTools API（产量/工资）+ 30天K线成交量加权均价

### 基本参数


| 指标        | 值                                                      |
| --------- | ------------------------------------------------------ |
| 建筑        | Hangar（机库）                                             |
| 产量/hr（单栋） | 0.0633                                                 |
| 工资/hr     | $759                                                   |
| 零售均价（合同价） | $282,924                                               |
| 层级深度      | L7（Power L0 → Jumbo Jet L7）                            |
| 完整依赖树节点数  | 25（含 Power）                                            |
| 推荐自产节点数   | 18                                                     |
| 推荐外购节点数   | 6（Wing、Cockpit、Aluminium、Bauxite、Golden Bars、Gold Ore） |


### 生产配方

```
Jumbo Jet      <- Fuselagex40 + Wingx10 + Cockpitx2 + Basic Interiorx140 + Jet Enginex4
Fuselage       <- Carbon Compositex40
Wing           <- Carbon Compositex30 + Aluminiumx5          [外购]
Cockpit        <- High Grade E-Compsx4 + Displaysx8 + Basic Interiorx1  [外购]
Basic Interior <- Displaysx2 + Plasticx2 + Fabricx5
Jet Engine     <- High Grade E-Compsx4 + Aluminiumx5
Carbon Composite  <- Carbon Fibersx8
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
Displays       <- Siliconx5 + Chemicalsx4
Plastic        <- Powerx5 + Crude Oilx0.2
Fabric         <- Cottonx2 + Powerx1
Carbon Fibers  <- Crude Oilx0.1 + Powerx0.5
Silicon        <- Powerx3 + Sandx2
Chemicals      <- Powerx0.2 + Mineralsx1
Crude Oil      <- Powerx25
Cotton         <- Waterx1 + Seedsx1
Minerals       <- Powerx20 + Waterx1
Water          <- Powerx0.2
Sand           <- Powerx2
Seeds          <- Waterx0.1
```

### 层级结构

```
L0  Power
L1  Sand  Water  Crude Oil
L2  Seeds  Plastic  Silicon  Minerals  Carbon Fibers
L3  Chemicals  Cotton  Carbon Composite
L4  Fabric  Fuselage  High Grade E-Comps  Displays
L5  Basic Interior  Jet Engine
L7  Jumbo Jet
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率 < 0.2 的节点后重算，直到稳定。
> 产量/hr = SimcoTools API 单栋建筑实际产量（非全服合计）。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                         | 产量/hr   | 工资/hr  | 利用率   | 决策   |
| -------------------------- | ------- | ------ | ----- | ---- |
| Sand（沙）                    | 1,419.4 | $276   | 0.223 | ✓ 自产 |
| Water（水）                   | 1,626.4 | $345   | 0.276 | ✓ 自产 |
| Seeds（种子）                  | 889.6   | $103.5 | 0.291 | ✓ 自产 |
| Basic Interior（基础内饰）       | 31.9    | $448.5 | 0.295 | ✓ 自产 |
| Jet Engine（喷气发动机）          | 0.84    | $621   | 0.310 | ✓ 自产 |
| Plastic（塑料）                | 204.3   | $483   | 0.310 | ✓ 自产 |
| Chemicals（化学品）             | 213.9   | $414   | 0.623 | ✓ 自产 |
| Fabric（织物）                 | 241.1   | $138   | 0.702 | ✓ 自产 |
| Fuselage（机身）               | 3.30    | $586.5 | 0.792 | ✓ 自产 |
| Silicon（硅）                 | 154.0   | $414   | 1.084 | ✓ 自产 |
| Crude Oil（原油）              | 41.5    | $517.5 | 1.564 | ✓ 自产 |
| Minerals（矿石）               | 119.2   | $276   | 1.842 | ✓ 自产 |
| Cotton（棉花）                 | 258.8   | $103.5 | 1.876 | ✓ 自产 |
| High Grade E-Comps（高级电子元件） | 1.84    | $379.5 | 1.915 | ✓ 自产 |
| Carbon Composite（碳复合材料）    | 68.5    | $414   | 1.996 | ✓ 自产 |
| Displays（显示屏）              | 32.1    | $379.5 | 2.011 | ✓ 自产 |
| Carbon Fibers（碳纤维）         | 245.1   | $483   | 2.205 | ✓ 自产 |


**剔除节点**（利用率过低）：Wing（0.081）、Cockpit（0.056）、Golden Bars（0.004）→ 联动剔除 Aluminium（0.036）、Bauxite（0.000）、Gold Ore（0.000）

---

### 成本驱动分析（2026-03-30，30天均价）

> 按直接组件成本拆解，辅助判断 VI 优先级（参考"成本占比"启发法）。

**每架 Jumbo Jet 直接原料成本**（合计 $222,198）：


| 组件             | 数量  | 30天均价  | 合计成本     | 占比        | VI决策          |
| -------------- | --- | ------ | -------- | --------- | ------------- |
| Fuselage       | 40  | $2,956 | $118,241 | **53.2%** | ✓ 自产          |
| Basic Interior | 140 | $362   | $50,638  | **22.8%** | ✓ 自产          |
| Wing           | 10  | $2,083 | $20,833  | 9.4%      | ✗ 外购（利用率0.08） |
| Jet Engine     | 4   | $5,109 | $20,437  | 9.2%      | ✓ 自产          |
| Cockpit        | 2   | $6,025 | $12,050  | 5.4%      | ✗ 外购（利用率0.06） |


**成本树展开**：

```
Jumbo Jet 原料 $222,198
├── Fuselage ×40  $118,241 (53.2%)
│   └── Carbon Composite ×40  $2,682/件 (90.7%的Fuselage成本)
│       └── Carbon Fibers ×8  $56.6/件 → Crude Oil ×0.1
├── Basic Interior ×140  $50,638 (22.8%)
│   ├── Displays ×2  $270/件 (74.6%的BI成本)
│   │   └── Silicon×5 + Chemicals×4
│   ├── Fabric ×5  $30/件 (8.3%)
│   └── Plastic ×2  $27/件 (7.5%)
├── Wing ×10  $20,833 (9.4%) [外购]
├── Jet Engine ×4  $20,437 (9.2%)
│   ├── High Grade E-Comps ×4  $4,017 (78%的JE成本)
│   │   └── Silicon×4 + Chemicals×3 + Golden Bars×0.0625 [外购]
│   └── Aluminium ×5  $119 [外购]
└── Cockpit ×2  $12,050 (5.4%) [外购]
```

> **关键结论（成本占比视角）**：Fuselage 占53%是第一优先级，追溯到 Carbon Composite → Carbon Fibers → Crude Oil 链。Basic Interior 占22.8%第二，其中 Displays 是瓶颈。Wing 和 Cockpit 虽占14.8%，但因产量不足而外购。

---

### 自产 PPLH 排名（每栋建筑/hr，以市场价计算原料）

> 公式：`PPLH = producedAnHour × (市场均价 - 单件原料成本) - 工资/hr`
> 原料均按当前30天均价购入计算（保守估计，实际级联自产后更高）。


| 排名  | 节点                 | 产量/hr | 市场均价   | 原料成本/件 | PPLH     | 备注                           |
| --- | ------------------ | ----- | ------ | ------ | -------- | ---------------------------- |
| 1   | Plastic（塑料）        | 204.3 | $13.58 | $6.83  | **$896** | Crude Oil×0.2                |
| 2   | Sand（沙）            | 1,419 | $1.31  | $0.56  | **$788** | 仅Power；利用率22%，大量闲置           |
| 3   | Basic Interior     | 31.9  | $362   | $327   | **$651** | 含Displays+Plastic+Fabric     |
| 4   | Crude Oil          | 41.5  | $34.17 | $7.00  | **$610** | Power×25；级联降低下游成本            |
| 5   | Silicon（硅）         | 154.0 | $9.00  | $2.62  | **$569** | Sand×2                       |
| 6   | High Grade E-Comps | 1.84  | $1,004 | $497   | **$552** | Si×4+Chem×3+GB×0.0625@$6,596 |
| 7   | Minerals（矿石）       | 119.2 | $12.49 | $5.99  | **$499** | Water×1                      |
| 8   | Fabric（织物）         | 241.1 | $5.97  | $3.56  | **$443** | Cotton×2                     |
| 9   | Displays（显示屏）      | 32.1  | $135   | $110   | **$430** | Silicon×5+Chemicals×4        |
| 10  | Carbon Fibers      | 245.1 | $7.07  | $3.42  | **$412** | Crude Oil×0.1                |
| 11  | Chemicals（化学品）     | 213.9 | $16.22 | $12.49 | **$384** | Minerals×1                   |
| 12  | Fuselage（机身）       | 3.30  | $2,956 | $2,682 | **$317** | CC×40；成本占比53%                |
| 13  | Carbon Composite   | 68.5  | $67.06 | $56.56 | **$305** | CF×8                         |
| 14  | Water（水）           | 1,626 | $0.39  | $0.056 | **$192** | 仅Power                       |
| 15  | Jet Engine         | 0.84  | $5,109 | $4,136 | **$196** | HGE×4+Al×5（Al外购）             |
| 16  | Cotton（棉花）         | 258.8 | $1.78  | $0.69  | **$178** | Water+Seeds                  |
| 17  | Seeds（种子）          | 889.6 | $0.30  | $0.039 | **$128** | Water×0.1                    |


> ⚠️ **Sand 悖论**：PPLH $788 但利用率仅22%——矿山建完后78%产能无法被此链消化，需配合其他产品才有意义。
> ⚠️ **Fuselage 悖论**：成本占比53%（最大驱动因子），但PPLH仅$317（倒数）——因为 Carbon Composite 已将大部分溢价吸走，Fuselage 加工本身利润薄。真正应优先的是 CC→CF→Crude Oil 链。

---

### VI 建筑槽位分配建议

**核心逻辑**：1栋 Hangar + 按PPLH排序依次填槽，考虑供需平衡。


| 槽位  | 建议建筑                   | 理由                         |
| --- | ---------------------- | -------------------------- |
| 1   | Hangar（机库）             | 终端产品，固定                    |
| 2   | Fuselage 工厂            | 覆盖53%成本，利用率0.79            |
| 3   | Carbon Composite 厂     | Fuselage的90%原料来源           |
| 4   | Carbon Fibers 厂        | CC的上游，PPLH $412            |
| 5   | Basic Interior 厂       | 覆盖22.8%成本，利用率0.30          |
| 6   | Displays 厂             | BI的75%原料；利用率2.0+           |
| 7   | Crude Oil 矿            | 同时喂 CF 和 Plastic，级联降本      |
| 8   | Plastic 厂              | PPLH最高 $896，BI原料           |
| 9   | Silicon 矿              | 喂 Displays+HGE，利用率1.08+    |
| 10  | Chemicals 矿            | 喂 Displays+HGE+Silicon上游   |
| 11  | High Grade E-Comps 厂   | Jet Engine 78%成本，PPLH~$505 |
| 12  | Jet Engine 工厂          | 利用率0.31，PPLH $196（低但完整）    |
| 13+ | Fabric/Cotton/Minerals | 补全 Basic Interior 原料链      |


> **槽位5-10注意**：Basic Interior、Displays、Silicon、Chemicals 之间有强供需依存，建议成组添加而非单独建设。

---

### 结论

- **自产**（17 节点）：Fuselage、Basic Interior、Jet Engine、Carbon Composite、High Grade E-Comps、Displays、Plastic、Fabric、Carbon Fibers、Silicon、Chemicals、Crude Oil、Cotton、Water、Sand、Minerals、Seeds
- **外购**（6 项）：Wing（$2,083×10=$20,833）、Cockpit（$6,025×2=$12,050）、Aluminium、Bauxite、Golden Bars、Gold Ore
- **固定外购成本/架**：Wing+Cockpit = **$32,883**（14.8%总成本，无法通过VI消除）
- **最低利用率节点**：Sand（0.223）——链的弱点，配合其他产品可提升

---

## Luxury Jet（豪华私人飞机）`id:96`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                            |
| -------- | ---------------------------- |
| 层级深度     | L7（Power L0 → Luxury Jet L7） |
| 完整依赖树节点数 | 25（含 Power）                  |
| 推荐自产节点数  | 7                            |
| 推荐外购节点数  | 17（机翼、驾驶舱、金条、铝、显示屏等）         |
| 全服务器产量   | 0.20/hr                      |


### 生产配方

```
Luxury Jet <- Fuselagex14 + Wingx2 + Cockpitx1 + Golden Barsx2 + Jet Enginex2
Fuselage <- Carbon Compositex40
Jet Engine <- High Grade E-Compsx4 + Aluminiumx5
Carbon Composite <- Carbon Fibersx8
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
Carbon Fibers <- Crude Oilx0.1 + Powerx0.5
Crude Oil <- Powerx25
```

### 层级结构

```
L0  Power
L1  Crude Oil
L2  Carbon Fibers
L3  Carbon Composite
L4  Fuselage  High Grade E-Comps
L5  Jet Engine
L7  Luxury Jet
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr | 利用率   | 决策   |
| --------------------------- | ----- | ----- | ---- |
| Jet Engine（喷气发动机）           | 0.9   | 0.413 | ✓ 自产 |
| Crude Oil（原油）               | 45.9  | 0.586 | ✓ 自产 |
| Fuselage（机身）                | 3.7   | 0.739 | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0   | 1.915 | ✓ 自产 |
| Carbon Composite（碳复合材料）     | 74.1  | 1.996 | ✓ 自产 |
| Carbon Fibers（碳纤维）          | 269.0 | 2.205 | ✓ 自产 |


### 结论

- **自产**（7 节点）：Luxury Jet、Fuselage、Jet Engine、Carbon Composite、High Grade E-Comps、Carbon Fibers、Crude Oil
- **外购**（17 项）：Wing、Cockpit、Golden Bars、Aluminium、Displays、Basic Interior、Gold Ore、Bauxite、Silicon、Chemicals、Plastic、Fabric、Water、Sand、Minerals、Cotton、Seeds
- 链底最低利用率：Jet Engine（0.413）

---

## Single Engine Plane（单引擎飞机）`id:97`

**分析日期**：2026-03-30
**数据来源**：SimcoTools API（产量/工资）+ 30天K线成交量加权均价

### 基本参数


| 指标        | 值                                                                                        |
| --------- | ---------------------------------------------------------------------------------------- |
| 建筑        | Hangar（机库）                                                                               |
| 产量/hr（单栋） | 1.476                                                                                    |
| 工资/hr     | $759                                                                                     |
| 零售均价（合同价） | $32,500                                                                                  |
| 层级深度      | L7（Power L0 → Single Engine Plane L7）                                                    |
| 完整依赖树节点数  | 28（含 Power）                                                                              |
| 推荐自产节点数   | 17                                                                                       |
| 推荐外购节点数   | 10（Basic Interior、Steel、Golden Bars、Plastic、Fabric、Iron Ore、Water、Gold Ore、Cotton、Seeds） |


### 生产配方

```
Single Engine Plane <- Fuselagex8 + Wingx2 + Cockpitx1 + Combustion Enginex1
Fuselage       <- Carbon Compositex40
Wing           <- Carbon Compositex30 + Aluminiumx5          [自产]
Cockpit        <- High Grade E-Compsx4 + Displaysx8 + Basic Interiorx1  [自产；BI外购]
Combustion Engine <- Steelx6 + Chemicalsx5 + Electronic Compsx5  [自产；Steel外购]
Carbon Composite  <- Carbon Fibersx8
Aluminium      <- Powerx15 + Bauxitex1
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625  [GB外购]
Displays       <- Siliconx5 + Chemicalsx4
Chemicals      <- Powerx0.2 + Mineralsx1
Electronic Comps  <- Siliconx3 + Chemicalsx1
Carbon Fibers  <- Crude Oilx0.1 + Powerx0.5
Bauxite        <- Powerx14 + Waterx0.5  [Water外购]
Silicon        <- Powerx3 + Sandx2
Minerals       <- Powerx20 + Waterx1    [Water外购]
Crude Oil      <- Powerx25
Sand           <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand  Crude Oil
L2  Bauxite  Minerals  Silicon  Carbon Fibers
L3  Aluminium  Chemicals  Carbon Composite
L4  Wing  Displays  Electronic Comps  Fuselage  High Grade E-Comps
L5  Combustion Engine
L6  Cockpit
L7  Single Engine Plane
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率 < 0.2 的节点后重算，直到稳定。
> 产量/hr = SimcoTools API 单栋建筑实际产量（非全服合计）。
> 利用率 > 1 表示单链需多栋同类建筑。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                         | 产量/hr   | 工资/hr   | 利用率   | 决策   |
| -------------------------- | ------- | ------- | ----- | ---- |
| Sand（沙）                    | 1,419.4 | $276    | 0.223 | ✓ 自产 |
| Combustion Engine（燃烧发动机）   | 5.597   | $621    | 0.264 | ✓ 自产 |
| Aluminium（铝）               | 119.791 | $414†   | 0.350 | ✓ 自产 |
| Wing（机翼）                   | 8.109   | $586.5  | 0.376 | ✓ 自产 |
| Crude Oil（原油）              | 41.521  | $517.5  | 0.586 | ✓ 自产 |
| Displays（显示屏）              | 32.143  | $379.5  | 0.602 | ✓ 自产 |
| Cockpit（驾驶舱）               | 2.263   | $379.5  | 0.657 | ✓ 自产 |
| Electronic Comps（电子元件）     | 41.327  | $379.5† | 0.709 | ✓ 自产 |
| Chemicals（化学品）             | 213.912 | $414    | 0.951 | ✓ 自产 |
| Bauxite（铝土矿）               | 96.522  | $276†   | 1.275 | ✓ 自产 |
| Minerals（矿石）               | 119.233 | $276    | 1.842 | ✓ 自产 |
| Silicon（硅）                 | 154.017 | $414    | 1.884 | ✓ 自产 |
| Carbon Fibers（碳纤维）         | 245.106 | $483    | 2.205 | ✓ 自产 |
| Fuselage（机身）               | 3.304   | $586.5  | 3.695 | ✓ 自产 |
| High Grade E-Comps（高级电子元件） | 1.837   | $379.5  | 5.267 | ✓ 自产 |
| Carbon Composite（碳复合材料）    | 68.452  | $414    | 5.670 | ✓ 自产 |


† 工资按同类建筑推断（Aluminium Smelter、Electronics Factory、Bauxite Mine）

**剔除节点**：Basic Interior（util≈0.05）→ 级联剔除 Plastic、Fabric、Cotton、Seeds；Steel（util≈0.04）→ 级联剔除 Iron Ore；Golden Bars（util<0.01）→ 级联剔除 Gold Ore；Water（util≈0.05）

---

### 成本驱动分析（2026-03-30，30天均价）

> 按直接组件成本拆解，辅助判断 VI 优先级。

**每架 SEP 直接原料成本**（合计 $34,506）：


| 组件                | 数量  | 30天均价  | 合计成本    | 占比        | VI决策       |
| ----------------- | --- | ------ | ------- | --------- | ---------- |
| Fuselage          | 8   | $2,956 | $23,648 | **68.5%** | ✓ 自产       |
| Cockpit           | 1   | $6,025 | $6,025  | **17.5%** | ✓ 自产（JJ外购） |
| Wing              | 2   | $2,083 | $4,166  | **12.1%** | ✓ 自产（JJ外购） |
| Combustion Engine | 1   | $666   | $666    | 1.9%      | ✓ 自产       |


**零售定价结构**：

```
零售价 $32,500
├── 直接原料成本 $34,506 (106.2%，超出零售价)
│   ├── Fuselage×8  $23,648 (68.5%)
│   │   └── CC×40  $2,682/件 → CF×8 → Crude Oil×0.1
│   ├── Cockpit×1   $6,025  (17.5%)  [自产，JJ为外购]
│   │   ├── HGE×4  $4,016 (66.7%的Cockpit)
│   │   ├── Displays×8  $1,081 (17.9%)
│   │   └── Basic Interior×1  $362 (6.0%) [外购]
│   ├── Wing×2      $4,166  (12.1%)  [自产，JJ为外购]
│   │   └── CC×30 + Al×5 (市价原料成本>Wing卖价，依赖级联自产)
│   └── Combustion Engine×1  $666 (1.9%)
│       ├── Steel×6  $78 [外购]
│       ├── Electronic Comps×5  $316 (47.4%)
│       └── Chemicals×5  $81
└── 毛利润 -$2,006 (-6.2%) [外购Q0组件则产生亏损，必须 VI]
```

> **与 Jumbo Jet 关键差异**：SEP 自产 Wing + Cockpit（JJ 均外购），因为 SEP 产量 23× 更快（1.476 vs 0.063/hr），Wing 和 Cockpit 的利用率足以支撑自产。JJ 无此条件。

---

### 自产 PPLH 排名（每栋建筑/hr，以市场价计算原料）

> 公式：`PPLH = producedAnHour × (市场均价 - 单件原料成本) - 工资/hr`
> Power 仅对"纯电力矿山"（Sand、Crude Oil、Minerals、Bauxite）计入成本（$0.28/单位）。
> 原料按30天均价购入（保守估计，级联自产后实际更高）。
> Wing 的原料成本基于 CC+Al 市价，若 CC+Al 自产则 Wing PPLH 转正。


| 排名  | 节点                 | 产量/hr   | 市场均价    | 原料成本/件  | PPLH      | 备注                             |
| --- | ------------------ | ------- | ------- | ------- | --------- | ------------------------------ |
| 1   | Aluminium（铝）       | 119.791 | $23.80  | $12.60  | **$928**† | Bauxite×1；高效冶炼                 |
| 2   | Cockpit（驾驶舱）       | 2.263   | $6,025  | $5,459  | **$902**  | HGE×4+Disp×8+BI×1（BI外购$362）    |
| 3   | Sand（沙）            | 1,419.4 | $1.31   | $0.56   | **$789**  | 仅Power；利用率22%，大量闲置             |
| 4   | Crude Oil（原油）      | 41.521  | $34.17  | $7.00   | **$611**  | Power×25                       |
| 5   | Silicon（硅）         | 154.017 | $9.00   | $2.62   | **$569**  | Sand×2                         |
| 6   | High Grade E-Comps | 1.837   | $1,004  | $497    | **$552**  | Si×4+Chem×3+GB×0.0625@$6,596   |
| 7   | Bauxite（铝土矿）       | 96.522  | $12.60  | $4.12   | **$543**† | Power×14+Water×0.5；Water外购     |
| 8   | Minerals（矿石）       | 119.233 | $12.49  | $5.99   | **$499**  | Power×20+Water×1；Water外购       |
| 9   | Combustion Engine  | 5.597   | $666    | $475    | **$448**  | Steel×6（外购$13）+Chem×5+EC×5     |
| 10  | Electronic Comps   | 41.327  | $63.20  | $43.22  | **$446**† | Si×3+Chem×1                    |
| 11  | Displays（显示屏）      | 32.143  | $135.08 | $109.88 | **$430**  | Silicon×5+Chemicals×4          |
| 12  | Carbon Fibers（碳纤维） | 245.106 | $7.07   | $3.42   | **$412**  | Crude Oil×0.1                  |
| 13  | Chemicals（化学品）     | 213.912 | $16.22  | $12.49  | **$384**  | Minerals×1                     |
| 14  | Fuselage（机身）       | 3.304   | $2,956  | $2,682  | **$317**  | CC×40；成本占比68.5%                |
| 15  | Carbon Composite   | 68.452  | $67.06  | $56.56  | **$305**  | CF×8                           |
| 16  | Wing（机翼）           | 8.109   | $2,083  | $2,131  | **-$974** | CC×30+Al×5 市价原料>售价；级联自产后≈+$651 |


† 工资按同类建筑推断

> ⚠️ **Wing 悖论**：市价原料成本 ($2,131) > Wing 市价 ($2,083)，独立 PPLH 为负。但由于 Fuselage 链已经运行 CC + Aluminium 工厂，Wing 实际上"免费"获得原料，级联后 PPLH ≈ **+$651**。这是 VI 的核心逻辑：孤立看亏损，整体看盈利。
> ⚠️ **Aluminium 高 PPLH**：$928 但利用率仅 0.35——1 栋 Aluminium Smelter 有65%产能可卖市场或供给其他链。

---

### VI 建筑槽位分配建议

**与 Jumbo Jet 的规模差异**：SEP 产量 1.476/hr（JJ 为 0.063/hr），同等 VI 深度需要约 23× 更多工厂配套。一条完整 SEP 链理论需要 ~35 栋建筑。实际按资金/槽位逐步扩张：


| 阶段                    | 建议建筑                   | 所需槽位 | 理由                      |
| --------------------- | ---------------------- | ---- | ----------------------- |
| **Phase 1：核心骨架**      | 1× Hangar              | 1    | 终端产品                    |
|                       | 4× Fuselage 工厂         | 4    | util 3.7，需4栋            |
|                       | 6× Carbon Composite 厂  | 6    | util 5.7，需6栋            |
|                       | 3× Carbon Fibers 厂     | 3    | util 2.2，需3栋            |
|                       | 1× Crude Oil 井         | 1    | 喂 CF；util 0.59          |
| **Phase 2：电子链**       | 6× HGE 工厂              | 6    | util 5.3，需6栋；PPLH $552  |
|                       | 2× Silicon 矿           | 2    | util 1.9，需2栋            |
|                       | 2× Minerals 矿          | 2    | util 1.8，需2栋            |
|                       | 1× Chemicals 厂         | 1    | util 0.95               |
|                       | 1× Cockpit 工厂          | 1    | util 0.66，PPLH $902     |
|                       | 1× Displays 厂          | 1    | util 0.60               |
|                       | 1× Electronic Comps 厂  | 1    | util 0.71，PPLH $446     |
| **Phase 3：Wing+Al 链** | 1× Wing 工厂             | 1    | util 0.38；CC 已有，Wing 为正 |
|                       | 1× Aluminium Smelter   | 1    | util 0.35，PPLH $928     |
|                       | 2× Bauxite 矿           | 2    | util 1.3，需2栋            |
|                       | 1× Combustion Engine 厂 | 1    | util 0.26，PPLH $448     |
|                       | 1× Sand 矿              | 1    | util 0.22，大量闲置          |


> Phase 1 完成后即可运营，Fuselage/Wing/Cockpit/CE 均从市场购入缺口部分。Phase 3 的 Aluminium→Wing 链是 SEP 独有的 VI 机会（JJ 没有此链），优先级取决于 Wing 市场供应稳定性。

---

### 结论

- **自产**（17 节点）：SEP、Fuselage、Wing、Cockpit、Combustion Engine、Carbon Composite、Aluminium、HGE、Displays、Chemicals、Electronic Comps、Carbon Fibers、Bauxite、Silicon、Minerals、Crude Oil、Sand
- **外购**（10 项）：Basic Interior（$362×1=$362）、Steel（×6 per CE）、Golden Bars、Plastic、Fabric、Iron Ore、Water、Gold Ore、Cotton、Seeds
- **固定外购成本/架**：Basic Interior = **$362**（仅0.7%总成本，可接受）
- **最低利用率节点**：Sand（0.223）
- **SEP vs JJ 核心差异**：SEP 自产 Wing + Cockpit + Aluminium（JJ 全部外购），因为更高产量（23×）使这些节点利用率达到 0.35–0.66；SEP 使用 Combustion Engine 而非 Jet Engine（更简单，Steel 外购代替 HGE+Al）；SEP Hangar 单独外购Q0组件 PPLH ≈ **-$3,720/hr**（外购Q0组件产生亏损，必须VI）；完全VI链净利 ≈ $33,087/hr（vs JJ Hangar $3,085）。

---

### Q4品质分析（2026-03-30）

> Q4 SEP 零售合同价：**$35,000**（用户提供）
> 数据来源：simcotools candlesticks 30天成交量加权均价（`sep_q4_prices.js`）
> 品质级联：Q4 SEP ← Q3直接组件 ← Q2中间件 ← Q1原料 ← Q0基础资源

#### 直接组件成本对比（Q3 市价 vs Q4 零售）


| 组件                | 数量  | Q3 30天均价  | 合计成本          | Q0 参考价                 |
| ----------------- | --- | --------- | ------------- | ---------------------- |
| Fuselage          | 8   | $3,070.86 | $24,567       | $2,956                 |
| Cockpit           | 1   | $6,309.01 | $6,309        | $6,025                 |
| Wing              | 2   | $2,346.26 | $4,693        | $2,083                 |
| Combustion Engine | 1   | $683.25   | $683          | $666                   |
| **Q3组件合计**        |     |           | **$36,252**   | Q0: $34,506            |
| **SEP零售价**        |     |           | **$35,000**   | Q0: $32,500            |
| **Hangar 独立利润/架** |     |           | **-$1,252 ❌** | Q0: -$3,720 ❌（同样必须 VI） |


> ⚠️ **必须VI才能盈利**：Q3组件市价 $36,252 > Q4零售价 $35,000，Hangar 单栋外购原料则亏损 $1,252/架。Q0 无此问题（有 29% 毛利）。Q4 SEP 必须通过垂直整合，以生产成本（远低于市价）取代市场采购才能盈利。

#### Q4 链各建筑 PPLH

> 公式同 Q0：`PPLH = producedAnHour × (产出品质市价 - 输入品质市价) - 工资/hr`
> Q1 Chemicals ≈ $16.30（Q0/Q2 内插估算）；Steel Q2 ≈ $14（估算）；Golden Bars Q1 = $6,819


| 排名  | 节点            | 产出/买入品质 | 产量/hr   | 产出市价    | 原料成本/件  | PPLH       | vs Q0      |
| --- | ------------- | ------- | ------- | ------- | ------- | ---------- | ---------- |
| 1   | Cockpit       | Q3/Q2   | 2.263   | $6,309  | $5,601  | **$1,222** | ↑+$320     |
| 2   | Aluminium     | Q2/Q1   | 119.791 | $24.35  | $12.89  | **$959**   | ↑+$31      |
| 3   | Sand          | Q0/—    | 1,419.4 | $1.31   | $0.56   | **$789**   | ≈ 同        |
| 4   | Wing          | Q3/Q2   | 8.109   | $2,346  | $2,190  | **$684**   | ↑↑从-$974转正 |
| 5   | Crude Oil     | Q0/—    | 41.521  | $34.17  | $7.00   | **$610**   | ≈ 同        |
| 6   | Silicon       | Q1/Q0   | 154.017 | $9.15   | $2.62   | **$592**   | ↑+$23      |
| 7   | HGE           | Q2/Q1   | 1.837   | $1,034  | $512†   | **$580**   | ↑+$28      |
| 8   | Bauxite       | Q1/Q0   | 96.522  | $12.89  | $4.12   | **$571**   | ↑+$28      |
| 9   | Minerals      | Q1/Q0   | 119.233 | $12.62  | $5.99   | **$515**   | ↑+$16      |
| 10  | CE            | Q3/Q2   | 5.597   | $683    | $486    | **$483**   | ↑+$35      |
| 11  | Carbon Fibers | Q1/Q0   | 245.106 | $7.25   | $3.42   | **$457**   | ↑+$45      |
| 12  | EC            | Q2/Q1   | 41.327  | $64.03  | $43.75  | **$459**   | ↑+$13      |
| 13  | Displays      | Q2/Q1   | 32.143  | $137.21 | $110.95 | **$465**   | ↑+$35      |
| 14  | Fuselage      | Q3/Q2   | 3.304   | $3,071  | $2,757  | **$450**   | ↑+$133     |
| 15  | Chemicals     | Q2/Q1   | 213.912 | $16.39  | $12.62  | **$392**   | ↑+$8       |
| 16  | CC            | Q2/Q1   | 68.452  | $68.93  | $58.00  | **$334**   | ↑+$29      |


† HGE Q2 原料：Si Q1×4@$9.15 + Chem Q1×3@$16.30 + GB Q1×0.0625@$6,819 = $512

#### Q4 vs Q0 关键对比


| 维度            | Q0            | Q4                   |
| ------------- | ------------- | -------------------- |
| SEP 零售价       | $32,500       | $35,000（高 7.7%，Q4溢价） |
| 直接组件合计        | $34,506       | $36,252（高 5.1%）      |
| Hangar 独立利润/架 | +$14,224 ✓    | **-$1,252 ❌（必须VI）**  |
| Wing PPLH     | -$974（亏损，外购）  | **+$684**（品质溢价覆盖成本）  |
| Cockpit PPLH  | $902          | **$1,222**（最大受益者）    |
| Fuselage PPLH | $317          | **$450**（+42%）       |
| VI 必要性        | **强制（与Q4相同）** | **强制**               |


#### Q0 链经济小结（完全VI估算）

- **收入**：1.476/hr × $32,500 = **$47,970/hr**
- **工资**：≈ **$11,800/hr**
- **外购材料**：GB×0.369@$6,596=$2,434 + BI×1.476@$362=$534 + Steel×8.86@$13=$115 ≈ **$3,083/hr**
- **净利润**：$47,970 - $11,800 - $3,083 ≈ **$33,087/hr**

#### Q4 链经济可行性（完全VI估算）

- **收入**：1.476/hr × $35,000 = **$51,660/hr**
- **工资（全链≈18栋建筑，按利用率加权）**：≈ **$11,800/hr**
- **外购材料**：GB×0.369/hr@$6,819=$2,517 + BI×1.476/hr@$368=$543 + Steel×8.86/hr@$14=$124 ≈ **$3,184/hr**
- **净利润**：$51,660 - $11,800 - $3,184 ≈ **$36,676/hr**
- **每建筑槽位均摊**（~18栋）：≈ **$2,037/hr**

> Golden Bars 是最大外购成本（$2,517/hr = 79% 的外购总额），建议优先锁定稳定供应。Q4 Wing 转正（+$684）且利用率仅0.376，约64%产能可对外卖出 Wing Q3，额外创收。

---

## Sub-orbital 2nd Stage（亚轨道二级）`id:90`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                                       |
| -------- | --------------------------------------- |
| 层级深度     | L7（Power L0 → Sub-orbital 2nd Stage L7） |
| 完整依赖树节点数 | 29（含 Power）                             |
| 推荐自产节点数  | 25                                      |
| 推荐外购节点数  | 3（金条、水、金矿）                              |
| 全服务器产量   | 3.36/hr                                 |


### 生产配方

```
Sub-orbital 2nd Stage <- Fuselagex8 + Propellant Tankx2 + Flight Computerx2 + Ion Drivex4 + Attitude Controlx2
Fuselage <- Carbon Compositex40
Propellant Tank <- Aluminiumx50 + Rocket Fuelx250
Flight Computer <- High Grade E-Compsx4 + On-board Computerx2
Ion Drive <- High Grade E-Compsx8 + Batteriesx30 + Chemicalsx15
Attitude Control <- Steelx3 + Batteriesx5 + Electric Motorx3
Carbon Composite <- Carbon Fibersx8
Aluminium <- Powerx15 + Bauxitex1
Rocket Fuel <- Methanex1 + Powerx5
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
On-board Computer <- Processorsx2 + Electronic Compsx3
Batteries <- Chemicalsx4
Chemicals <- Powerx0.2 + Mineralsx1
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Electric Motor <- Steelx2 + Electronic Compsx3
Carbon Fibers <- Crude Oilx0.1 + Powerx0.5
Bauxite <- Powerx14 + Waterx0.5
Methane <- Powerx20
Silicon <- Powerx3 + Sandx2
Processors <- Siliconx4 + Chemicalsx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Minerals <- Powerx20 + Waterx1
Iron Ore <- Powerx7 + Waterx0.5
Crude Oil <- Powerx25
Sand <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand  Crude Oil  Methane
L2  Silicon  Iron Ore  Bauxite  Minerals  Carbon Fibers  Rocket Fuel
L3  Chemicals  Aluminium  Carbon Composite
L4  Steel  Batteries  Propellant Tank  Processors  Electronic Comps  Fuselage  High Grade E-Comps
L5  Electric Motor  On-board Computer  Ion Drive
L6  Attitude Control  Flight Computer
L7  Sub-orbital 2nd Stage
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr  | 利用率    | 决策   |
| --------------------------- | ------ | ------ | ---- |
| Sand（沙）                     | 1496.9 | 0.223  | ✓ 自产 |
| Electric Motor（电动机）         | 34.7   | 0.270  | ✓ 自产 |
| On-board Computer（车载电脑）     | 14.8   | 0.351  | ✓ 自产 |
| Steel（钢铁）                   | 208.5  | 0.378  | ✓ 自产 |
| Crude Oil（原油）               | 45.9   | 0.586  | ✓ 自产 |
| Chemicals（化学品）              | 231.7  | 0.860  | ✓ 自产 |
| Silicon（硅）                  | 166.8  | 1.084  | ✓ 自产 |
| Iron Ore（铁矿）                | 191.6  | 1.088  | ✓ 自产 |
| Batteries（电池）               | 27.2   | 1.271  | ✓ 自产 |
| Bauxite（铝土矿）                | 101.8  | 1.275  | ✓ 自产 |
| Propellant Tank（推进剂罐）       | 5.0    | 1.333  | ✓ 自产 |
| Methane（甲烷）                 | 61.2   | 1.399  | ✓ 自产 |
| Minerals（矿物质）               | 125.7  | 1.842  | ✓ 自产 |
| Aluminium（铝）                | 129.7  | 1.944  | ✓ 自产 |
| Carbon Composite（碳复合材料）     | 74.1   | 1.996  | ✓ 自产 |
| Attitude Control（姿态控制）      | 3.1    | 2.154  | ✓ 自产 |
| Carbon Fibers（碳纤维）          | 269.0  | 2.205  | ✓ 自产 |
| Flight Computer（飞行计算机）      | 2.6    | 2.585  | ✓ 自产 |
| Processors（处理器）             | 9.9    | 3.000  | ✓ 自产 |
| Electronic Comps（电子元件）      | 44.5   | 3.341  | ✓ 自产 |
| Fuselage（机身）                | 3.7    | 7.273  | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0    | 7.821  | ✓ 自产 |
| Rocket Fuel（火箭燃料）           | 85.6   | 14.733 | ✓ 自产 |
| Ion Drive（离子推进器）            | 0.6    | 21.324 | ✓ 自产 |


### 结论

- **自产**（25 节点）：Sub-orbital 2nd Stage、Fuselage、Propellant Tank、Flight Computer、Ion Drive、Attitude Control、Carbon Composite、Aluminium、Rocket Fuel、High Grade E-Comps、On-board Computer、Batteries、Chemicals、Steel、Electric Motor、Carbon Fibers、Bauxite、Methane、Silicon、Processors、Electronic Comps、Minerals、Iron Ore、Crude Oil、Sand
- **外购**（3 项）：Golden Bars、Water、Gold Ore
- 链底最低利用率：Sand（0.223）

---

## Starship（飞船）`id:93`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                          |
| -------- | -------------------------- |
| 层级深度     | L7（Power L0 → Starship L7） |
| 完整依赖树节点数 | 31（含 Power）                |
| 推荐自产节点数  | 21                         |
| 推荐外购节点数  | 9（基础内饰、金条、塑料、布料、金矿等）       |
| 全服务器产量   | 0.34/hr                    |


### 生产配方

```
Starship <- Cockpitx2 + Heat Shieldx10 + Attitude Controlx4 + Propellant Tankx6 + Rocket Enginex7
Cockpit <- High Grade E-Compsx4 + Displaysx8 + Basic Interiorx1
Heat Shield <- Steelx20 + Siliconx30
Attitude Control <- Steelx3 + Batteriesx5 + Electric Motorx3
Propellant Tank <- Aluminiumx50 + Rocket Fuelx250
Rocket Engine <- Steelx20 + High Grade E-Compsx8 + Aluminiumx10
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
Displays <- Siliconx5 + Chemicalsx4
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Silicon <- Powerx3 + Sandx2
Batteries <- Chemicalsx4
Electric Motor <- Steelx2 + Electronic Compsx3
Aluminium <- Powerx15 + Bauxitex1
Rocket Fuel <- Methanex1 + Powerx5
Chemicals <- Powerx0.2 + Mineralsx1
Iron Ore <- Powerx7 + Waterx0.5
Sand <- Powerx2
Electronic Comps <- Siliconx3 + Chemicalsx1
Bauxite <- Powerx14 + Waterx0.5
Methane <- Powerx20
Minerals <- Powerx20 + Waterx1
```

### 层级结构

```
L0  Power
L1  Sand  Methane
L2  Iron Ore  Bauxite  Minerals  Silicon  Rocket Fuel
L3  Chemicals  Aluminium
L4  Propellant Tank  Batteries  Displays  Steel  Electronic Comps  High Grade E-Comps
L5  Heat Shield  Electric Motor  Rocket Engine
L6  Cockpit  Attitude Control
L7  Starship
```

### 利用率分析（迭代收敛，共 6 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr  | 利用率    | 决策   |
| --------------------------- | ------ | ------ | ---- |
| Sand（沙）                     | 1496.9 | 0.223  | ✓ 自产 |
| Heat Shield（热防护层）           | 13.5   | 0.250  | ✓ 自产 |
| Cockpit（驾驶舱）                | 2.6    | 0.258  | ✓ 自产 |
| Electric Motor（电动机）         | 34.7   | 0.270  | ✓ 自产 |
| Propellant Tank（推进剂罐）       | 5.0    | 0.400  | ✓ 自产 |
| Attitude Control（姿态控制）      | 3.1    | 0.431  | ✓ 自产 |
| Batteries（电池）               | 27.2   | 0.575  | ✓ 自产 |
| Displays（显示屏）               | 34.6   | 0.602  | ✓ 自产 |
| Iron Ore（铁矿）                | 191.6  | 1.088  | ✓ 自产 |
| Bauxite（铝土矿）                | 101.8  | 1.275  | ✓ 自产 |
| Chemicals（化学品）              | 231.7  | 1.374  | ✓ 自产 |
| Methane（甲烷）                 | 61.2   | 1.399  | ✓ 自产 |
| Steel（钢铁）                   | 208.5  | 1.698  | ✓ 自产 |
| Minerals（矿物质）               | 125.7  | 1.842  | ✓ 自产 |
| Aluminium（铝）                | 129.7  | 1.968  | ✓ 自产 |
| Electronic Comps（电子元件）      | 44.5   | 2.341  | ✓ 自产 |
| Silicon（硅）                  | 166.8  | 4.303  | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0    | 6.544  | ✓ 自产 |
| Rocket Engine（火箭发动机）        | 0.3    | 7.463  | ✓ 自产 |
| Rocket Fuel（火箭燃料）           | 85.6   | 14.733 | ✓ 自产 |


### 结论

- **自产**（21 节点）：Starship、Cockpit、Heat Shield、Attitude Control、Propellant Tank、Rocket Engine、High Grade E-Comps、Displays、Steel、Silicon、Batteries、Electric Motor、Aluminium、Rocket Fuel、Chemicals、Iron Ore、Sand、Electronic Comps、Bauxite、Methane、Minerals
- **外购**（9 项）：Basic Interior、Golden Bars、Plastic、Fabric、Gold Ore、Crude Oil、Cotton、Water、Seeds
- 链底最低利用率：Sand（0.223）

---

## Attitude Control（姿态控制）`id:82`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                                  |
| -------- | ---------------------------------- |
| 层级深度     | L6（Power L0 → Attitude Control L6） |
| 完整依赖树节点数 | 12（含 Power）                        |
| 推荐自产节点数  | 10                                 |
| 推荐外购节点数  | 1（水）                               |
| 全服务器产量   | 3.12/hr                            |


### 生产配方

```
Attitude Control <- Steelx3 + Batteriesx5 + Electric Motorx3
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Batteries <- Chemicalsx4
Electric Motor <- Steelx2 + Electronic Compsx3
Iron Ore <- Powerx7 + Waterx0.5
Chemicals <- Powerx0.2 + Mineralsx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Minerals <- Powerx20 + Waterx1
Silicon <- Powerx3 + Sandx2
Sand <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand
L2  Silicon  Iron Ore  Minerals
L3  Chemicals
L4  Steel  Batteries  Electronic Comps
L5  Electric Motor
L6  Attitude Control
```

### 利用率分析（迭代收敛，共 2 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                     | 产量/hr  | 利用率   | 决策   |
| ---------------------- | ------ | ----- | ---- |
| Sand（沙）                | 1496.9 | 0.223 | ✓ 自产 |
| Electric Motor（电动机）    | 34.7   | 0.270 | ✓ 自产 |
| Steel（钢铁）              | 208.5  | 0.378 | ✓ 自产 |
| Batteries（电池）          | 27.2   | 0.575 | ✓ 自产 |
| Chemicals（化学品）         | 231.7  | 0.751 | ✓ 自产 |
| Silicon（硅）             | 166.8  | 0.800 | ✓ 自产 |
| Iron Ore（铁矿）           | 191.6  | 1.088 | ✓ 自产 |
| Minerals（矿物质）          | 125.7  | 1.842 | ✓ 自产 |
| Electronic Comps（电子元件） | 44.5   | 2.341 | ✓ 自产 |


### 结论

- **自产**（10 节点）：Attitude Control、Steel、Batteries、Electric Motor、Iron Ore、Chemicals、Electronic Comps、Minerals、Silicon、Sand
- **外购**（1 项）：Water
- 链底最低利用率：Sand（0.223）

---

## Flight Computer（飞行计算机）`id:80`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                                 |
| -------- | --------------------------------- |
| 层级深度     | L6（Power L0 → Flight Computer L6） |
| 完整依赖树节点数 | 13（含 Power）                       |
| 推荐自产节点数  | 9                                 |
| 推荐外购节点数  | 3（金条、金矿、水）                        |
| 全服务器产量   | 2.60/hr                           |


### 生产配方

```
Flight Computer <- High Grade E-Compsx4 + On-board Computerx2
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
On-board Computer <- Processorsx2 + Electronic Compsx3
Silicon <- Powerx3 + Sandx2
Chemicals <- Powerx0.2 + Mineralsx1
Processors <- Siliconx4 + Chemicalsx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Sand <- Powerx2
Minerals <- Powerx20 + Waterx1
```

### 层级结构

```
L0  Power
L1  Sand
L2  Silicon  Minerals
L3  Chemicals
L4  Electronic Comps  Processors  High Grade E-Comps
L5  On-board Computer
L6  Flight Computer
```

### 利用率分析（迭代收敛，共 3 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr  | 利用率   | 决策   |
| --------------------------- | ------ | ----- | ---- |
| Sand（沙）                     | 1496.9 | 0.223 | ✓ 自产 |
| Chemicals（化学品）              | 231.7  | 0.260 | ✓ 自产 |
| On-board Computer（车载电脑）     | 14.8   | 0.351 | ✓ 自产 |
| Electronic Comps（电子元件）      | 44.5   | 1.000 | ✓ 自产 |
| Silicon（硅）                  | 166.8  | 1.084 | ✓ 自产 |
| Minerals（矿物质）               | 125.7  | 1.842 | ✓ 自产 |
| Processors（处理器）             | 9.9    | 3.000 | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0    | 5.267 | ✓ 自产 |


### 结论

- **自产**（9 节点）：Flight Computer、High Grade E-Comps、On-board Computer、Silicon、Chemicals、Processors、Electronic Comps、Sand、Minerals
- **外购**（3 项）：Golden Bars、Gold Ore、Water
- 链底最低利用率：Sand（0.223）

---

## Cockpit（驾驶舱）`id:81`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                         |
| -------- | ------------------------- |
| 层级深度     | L6（Power L0 → Cockpit L6） |
| 完整依赖树节点数 | 17（含 Power）               |
| 推荐自产节点数  | 7                         |
| 推荐外购节点数  | 9（基础内饰、金条、塑料、布料、金矿等）      |
| 全服务器产量   | 2.60/hr                   |


### 生产配方

```
Cockpit <- High Grade E-Compsx4 + Displaysx8 + Basic Interiorx1
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
Displays <- Siliconx5 + Chemicalsx4
Silicon <- Powerx3 + Sandx2
Chemicals <- Powerx0.2 + Mineralsx1
Sand <- Powerx2
Minerals <- Powerx20 + Waterx1
```

### 层级结构

```
L0  Power
L1  Sand
L2  Silicon  Minerals
L3  Chemicals
L4  Displays  High Grade E-Comps
L6  Cockpit
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr  | 利用率   | 决策   |
| --------------------------- | ------ | ----- | ---- |
| Sand（沙）                     | 1496.9 | 0.223 | ✓ 自产 |
| Displays（显示屏）               | 34.6   | 0.602 | ✓ 自产 |
| Chemicals（化学品）              | 231.7  | 0.623 | ✓ 自产 |
| Silicon（硅）                  | 166.8  | 1.084 | ✓ 自产 |
| Minerals（矿物质）               | 125.7  | 1.842 | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0    | 5.267 | ✓ 自产 |


### 结论

- **自产**（7 节点）：Cockpit、High Grade E-Comps、Displays、Silicon、Chemicals、Sand、Minerals
- **外购**（9 项）：Basic Interior、Golden Bars、Plastic、Fabric、Gold Ore、Crude Oil、Cotton、Water、Seeds
- 链底最低利用率：Sand（0.223）

---

## Orbital Booster（轨道助推器）`id:92`

**分析日期**：2026-03-16

### 基本参数


| 指标       | 值                                 |
| -------- | --------------------------------- |
| 层级深度     | L6（Power L0 → Orbital Booster L6） |
| 完整依赖树节点数 | 22（含 Power）                       |
| 推荐自产节点数  | 12                                |
| 推荐外购节点数  | 9（钢铁、铁矿、化学品、硅、金条等）                |
| 全服务器产量   | 1.68/hr                           |


### 生产配方

```
Orbital Booster <- Fuselagex40 + Propellant Tankx16 + Rocket Enginex34
Fuselage <- Carbon Compositex40
Propellant Tank <- Aluminiumx50 + Rocket Fuelx250
Rocket Engine <- Steelx20 + High Grade E-Compsx8 + Aluminiumx10
Carbon Composite <- Carbon Fibersx8
Aluminium <- Powerx15 + Bauxitex1
Rocket Fuel <- Methanex1 + Powerx5
High Grade E-Comps <- Siliconx4 + Chemicalsx3 + Golden Barsx0.0625
Carbon Fibers <- Crude Oilx0.1 + Powerx0.5
Bauxite <- Powerx14 + Waterx0.5
Methane <- Powerx20
Crude Oil <- Powerx25
```

### 层级结构

```
L0  Power
L1  Crude Oil  Methane
L2  Bauxite  Carbon Fibers  Rocket Fuel
L3  Aluminium  Carbon Composite
L4  High Grade E-Comps  Propellant Tank  Fuselage
L5  Rocket Engine
L6  Orbital Booster
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：


| 节点                          | 产量/hr | 利用率     | 决策   |
| --------------------------- | ----- | ------- | ---- |
| Crude Oil（原油）               | 45.9  | 0.586   | ✓ 自产 |
| Bauxite（铝土矿）                | 101.8 | 1.275   | ✓ 自产 |
| High Grade E-Comps（高品质电子元件） | 2.0   | 1.277   | ✓ 自产 |
| Methane（甲烷）                 | 61.2  | 1.399   | ✓ 自产 |
| Aluminium（铝）                | 129.7 | 1.968   | ✓ 自产 |
| Carbon Composite（碳复合材料）     | 74.1  | 1.996   | ✓ 自产 |
| Carbon Fibers（碳纤维）          | 269.0 | 2.205   | ✓ 自产 |
| Propellant Tank（推进剂罐）       | 5.0   | 5.333   | ✓ 自产 |
| Rocket Fuel（火箭燃料）           | 85.6  | 14.733  | ✓ 自产 |
| Fuselage（机身）                | 3.7   | 18.182  | ✓ 自产 |
| Rocket Engine（火箭发动机）        | 0.3   | 181.255 | ✓ 自产 |


### 结论

- **自产**（12 节点）：Orbital Booster、Fuselage、Propellant Tank、Rocket Engine、Carbon Composite、Aluminium、Rocket Fuel、High Grade E-Comps、Carbon Fibers、Bauxite、Methane、Crude Oil
- **外购**（9 项）：Steel、Iron Ore、Chemicals、Silicon、Golden Bars、Water、Minerals、Sand、Gold Ore
- 链底最低利用率：Crude Oil（0.586）

---

## 综合比较（航空航天类）

> 迭代收敛方法，2026-03-16


| 产品                    | 层级  | 节点数 | 自产数 | 全服产量/hr | 最低自产利用率         | 评分      | 特点                               |
| --------------------- | --- | --- | --- | ------- | --------------- | ------- | -------------------------------- |
| Sub-orbital Rocket    | L8  | 31  | 27  | 0.73    | 0.218(2ndStg)   | **7.0** | 几乎全自产，外购Water/GoldenBars/GoldOre |
| Sub-orbital 2nd Stage | L7  | 29  | 25  | 3.36    | 0.223(Sand)     | **6.0** | 高自产率，是Rocket的核心子链                |
| Jumbo Jet             | L7  | 25  | 18  | 0.07    | 0.223(Sand)     | 5.0     | 外购Wing/Cockpit，自产率最高的飞机          |
| Attitude Control      | L6  | 12  | 10  | 3.12    | 0.223(Sand)     | **5.0** | 高自产率，仅外购Water，电子链                |
| BFR                   | L8  | 36  | 22  | 0.24    | 0.223(Sand)     | 4.9     | 最大节点数，外购Orbital Booster等         |
| Starship              | L7  | 31  | 21  | 0.34    | 0.223(Sand)     | 4.7     | 21节点自产，外购Fiberglass/Plastic等     |
| Single Engine Plane   | L7  | 28  | 17  | 1.71    | 0.223(Sand)     | 4.3     | 17节点自产，外购Fiberglass/Steel等       |
| Flight Computer       | L6  | 13  | 9   | 2.60    | 0.223(Sand)     | 4.2     | 9节点自产，外购GoldenBars/GoldOre       |
| Orbital Booster       | L6  | 22  | 12  | 1.68    | 0.586(CrudeOil) | 3.3     | 12节点自产，外购Steel/Sand等             |
| Cockpit               | L6  | 17  | 7   | 2.60    | 0.223(Sand)     | 2.5     | 7节点自产，外购Plastic/Gold系列           |
| Luxury Jet            | L7  | 25  | 7   | 0.20    | 0.413(JetEng)   | 2.0     | 仅7节点自产（机身/喷气/碳系），外购较多            |


