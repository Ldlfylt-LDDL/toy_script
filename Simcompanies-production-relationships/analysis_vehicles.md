> 属于 车辆与建筑类 分析文件，主索引见 product_analysis.md

# SimCompanies 车辆与建筑类产品分析

车辆类产品以 Steel、Aluminium、Combustion Engine、Car Body、On-board Computer 为核心组件，建筑类产品则依赖 Cement、Steel Beams、Windows 等大宗建材。这类产品通常链条宽广，节点数多（20-27个），但利用率分化明显。

Economy Car 是全游戏唯一"全树无短板"的深层链条；Diesel 是最简洁高效的燃料链；Construction Units 则是全游戏利用率最低的产品之一。

---

## Economy Car（经济型汽车）`id:55`

**分析日期**：2026-03-12

### 基本参数


| 指标                | 值                                                         |
| ----------------- | --------------------------------------------------------- |
| 层级深度              | L6                                                        |
| 完整依赖树节点数          | 24（含 Power）                                               |
| 全树最低利用率           | **0.223（Sand）**，全部节点 ≥ 0.2 ✓                              |
| 全服务器产量            | 15.2/hr                                                   |
| 与 Quadcopter 共享节点 | Minerals、Chemicals、Silicon、EC、Processors、OBC（6 个核心节点完全共享） |


### 生产配方

```
Economy Car ← Combustion Engine×1 + Basic Interior×1 + Car Body×1 + On-board Computer×1
Combustion Engine ← Steel×6 + Chemicals×5 + Electronic Comps×5
Basic Interior ← Displays×2 + Plastic×2 + Fabric×5
Car Body ← Aluminium×30 + Glass×5 + Steel×5
On-board Computer ← Processors×2 + Electronic Comps×3
Steel ← Iron Ore×1 + Chemicals×0.1
Electronic Comps ← Silicon×3 + Chemicals×1
Displays ← Silicon×5 + Chemicals×4
Fabric ← Cotton×2
Processors ← Silicon×4 + Chemicals×1
Chemicals ← Minerals×1
Aluminium ← Bauxite×1
Glass ← Silicon×1
Cotton ← Water×1 + Seeds×1
Plastic ← Crude Oil×0.2
Iron Ore ← Water×0.5
Minerals ← Water×1
Silicon ← Sand×2
Bauxite ← Water×0.5
```

### 层级结构

```
L0  Power
L1  Water       Sand        Crude Oil
L2  Seeds       Plastic     Iron Ore    Minerals    Silicon     Bauxite
L3  Cotton      Chemicals   Aluminium   Glass
L4  Fabric      Steel       EC          Displays    Processors
L5  Basic Int.  Car Body    Comb.Eng.   On-board Computer
L6  Economy Car
```

### 利用率分析（全 23 节点）


| 节点                | 产量/hr  | 链内消耗/hr | 利用率       | 状态   |
| ----------------- | ------ | ------- | --------- | ---- |
| Sand              | 1496.9 | 333.6   | 0.223     | ✓    |
| Seeds             | 907.5  | 264.0   | 0.291     | ✓    |
| Plastic           | 224.2  | 69.5    | 0.310     | ✓    |
| Water             | 1738.2 | 627.2   | 0.361     | ✓    |
| Basic Interior    | 34.8   | 15.2    | 0.438     | ✓    |
| Car Body          | 26.1   | 15.2    | 0.583     | ✓    |
| Fabric            | 247.6  | 173.8   | 0.702     | ✓    |
| Steel             | 208.5  | 168.2   | 0.807     | ✓    |
| Glass             | 139.0  | 130.4   | 0.938     | ✓    |
| Crude Oil         | 45.9   | 44.8    | 0.977     | ✓    |
| On-board Computer | 14.8   | 15.2    | 1.026     | ✓    |
| Chemicals         | 231.7  | 245.1   | 1.058     | ✓    |
| Iron Ore          | 191.6  | 208.5   | 1.088     | ✓    |
| Bauxite           | 101.8  | 129.7   | 1.275     | ✓    |
| Electronic Comps  | 44.5   | 76.0    | 1.709     | ✓    |
| Minerals          | 125.7  | 231.7   | 1.842     | ✓    |
| Cotton            | 264.0  | 495.2   | 1.876     | ✓    |
| Displays          | 34.6   | 69.5    | 2.011     | ✓    |
| Combustion Engine | 6.3    | 15.2    | 2.411     | ✓    |
| Silicon           | 166.8  | 484.8   | 2.907     | ✓    |
| Processors        | 9.9    | 29.6    | 3.000     | ✓    |
| Aluminium         | 129.7  | 782.2   | **6.029** | ↑ 超载 |


> **全树 22 个自产节点，没有一个利用率低于 0.2**——这是目前分析的所有产品中唯一做到全树合格的。

### 推荐裁剪策略

**完整链（24 节点，23 自产）**：

- Aluminium 超载 6x，需 Aluminium 建筑升到其他建筑的约 6 倍等级
- 全链无需外购（除 Economy Car 本身）
- 建筑需求：23 栋（远超预算上限 12~16）

**裁剪到 12 节点（最优子集）**：

```
自产：Power + Sand + Minerals + Silicon + Chemicals + EC + Processors + OBC + Economy Car
外购：Combustion Engine、Basic Interior、Car Body（三大直接原料全买）
建筑：9 栋
```

- 本质上是 **Quadcopter 链换了终端产品**（同样的 Minerals→Chemicals→EC/Processors→OBC 主干）
- Economy Car 利用 OBC 更多（OBC 利用率 1.026 > Quadcopter 的 0.966）
- 缺点：买 Combustion Engine、Basic Interior、Car Body 三大组件，垂直整合程度低

**裁剪到 16 节点（扩展版，加 Combustion Engine 链）**：

```
自产：Power + Sand + Iron Ore + Minerals + Silicon + Chemicals + EC + Steel +
      Processors + OBC + Combustion Engine + Economy Car（+4个节点）
外购：Basic Interior、Car Body（两大组件外购）
建筑：12 栋
```

- 增加了 Steel 和 Combustion Engine，利用率 2.411（良好）
- Steel 利用率 0.807，Combustion Engine 利用率 2.411

### 链条特点

- **全游戏唯一"全树无短板"的深层链条（L6 以上）**：23 个节点，没有一个利用率低于 0.2
- **与 Quadcopter 高度重叠**：Minerals/Chemicals/Silicon/EC/Processors/OBC 六个核心节点完全共用 → 如果已建 Quadcopter 链，过渡到 Economy Car 成本极低
- **Aluminium 超载（6x）** 是唯一弱点，Car Body 对 Aluminium 需求极大（×30/辆）
- **建筑宽度宽**：完整链需 23 栋，远超预算；但可以根据预算灵活外购部分组件
- **策略价值**：最适合作为 Quadcopter 链的 **平行替代终端**——共享基础设施，不同最终产品，分散市场风险

---

## Diesel（柴油）`id:12`

**分析日期**：2026-03-12

### 基本参数


| 指标       | 值                               |
| -------- | ------------------------------- |
| 层级深度     | L5                              |
| 完整依赖树节点数 | 7（含 Power）                      |
| 自产节点数    | 6（全树合格）                         |
| 全服务器产量   | 126.3/hr                        |
| 全树最低利用率  | **0.495（Ethanol）**，全部节点 ≥ 0.2 ✓ |


### 生产配方

```
Diesel ← Crude Oil×0.75 + Ethanol×0.25
Ethanol ← Sugarcane×10
Sugarcane ← Water×3 + Seeds×1
Seeds ← Water×0.1
Crude Oil ← (原料，直接采集)
```

### 层级结构

```
L0  Power
L1  Water     Crude Oil
L2  Seeds
L3  Sugarcane
L4  Ethanol
L5  Diesel
```

### 利用率分析


| 节点        | 产量/hr  | 链内消耗/hr | 利用率   | 决策   |
| --------- | ------ | ------- | ----- | ---- |
| Ethanol   | 63.8   | 31.6    | 0.495 | ✓ 自产 |
| Seeds     | 907.5  | 660.0   | 0.727 | ✓ 自产 |
| Sugarcane | 660.0  | 638.4   | 0.967 | ✓ 自产 |
| Water     | 1738.2 | 2070.8  | 1.191 | ✓ 自产 |
| Crude Oil | 45.9   | 94.8    | 2.066 | ✓ 自产 |


> 全链 5 个自产节点，**无任何节点需外购**，最低利用率 0.495——全游戏最平衡的链条之一。

### 链条特点

- **最简洁的全合格链条**：L5 深度，仅 6 栋建筑，全树 0.495~2.066 利用率区间，极度均衡
- **Crude Oil 超载 2.066×**：意味着需要 Diesel 建筑约 2 倍于 Crude Oil 建筑等级，可接受
- **Water 多路汇聚**：Water 利用率 1.191（Sugarcane 消耗为主），是链条隐性需求最大的节点
- **适合作为辅助链**：Diesel 是 Transport 和 Construction Units 的原料，可以向上延伸
- **进入门槛低**：只需 6 栋建筑，适合初期布局或预算紧张时的高效选项
- **Petrol（汽油）几乎相同**：配方 Crude Oil×0.75 + Ethanol×0.25，同等链条，可同时生产

### Diesel 与 Petrol 对比


| 指标    | Diesel | Petrol   |
| ----- | ------ | -------- |
| 产量/hr | 126.3  | 122.3    |
| 最低利用率 | 0.495  | 0.479    |
| 配方差异  | 无      | 无（同配方）   |
| 节点数   | 7      | 7（完全相同链） |


> Diesel 和 Petrol 共用同一条链（Sugarcane→Ethanol + Crude Oil），同一组建筑可以生产两种产品（切换），市场灵活性高。

---

## Construction Units（建筑单元）`id:111`

**分析日期**：2026-03-14

### 基本参数


| 指标       | 值                                           |
| -------- | ------------------------------------------- |
| 层级深度     | L7                                          |
| 完整依赖树节点数 | 27（含 Power）                                 |
| 全服务器产量   | 1.1/hr（极低，全链严重低利用）                          |
| 自产节点数    | 4（CU、Windows、Aluminium、Bauxite）             |
| 外购节点数    | 22                                          |
| 链条特性     | 横跨建筑、制造、精炼三大产业；含完整 Bulldozer 子链             |


### 生产配方

```
Construction Units ← Bulldozer×0.125 + Diesel×5 + Windows×4 + Steel Beams×8 + Tools×4

Bulldozer ← Steel×4 + Car Body×1 + Combustion Engine×2
  Car Body ← Aluminium×30 + Glass×5 + Steel×5
  Combustion Engine ← Steel×6 + Chemicals×5 + Electronic Comps×5

Diesel ← Crude Oil×0.75 + Ethanol×0.25
  Ethanol ← Sugarcane×10
  Sugarcane ← Water×3 + Seeds×1

Windows ← Aluminium×2 + Glass×1
  Aluminium ← Bauxite×1
  Glass ← Silicon×1

Steel Beams ← Steel×1
Tools ← Steel×0.5 + Planks×0.5 + Electronic Comps×1 + Batteries×1
  Planks ← Wood×0.5
  Batteries ← Chemicals×4

Steel ← Iron Ore×1 + Chemicals×0.1
Electronic Comps ← Silicon×3 + Chemicals×1
Chemicals ← Minerals×1
Silicon ← Sand×2
```

### 层级结构

```
L0  Power
L1  Water      Sand       Crude Oil
L2  Seeds      Silicon    Iron Ore   Minerals   Bauxite
L3  Sugarcane  Wood       Chemicals  Glass      Aluminium
L4  Ethanol    Planks     Steel      EC         Batteries  Windows
L5  Diesel     Steel Beams  Tools    Car Body   Combustion Engine
L6  Bulldozer
L7  Construction Units
```

> Windows 在 L4（Aluminium(L3)+Glass(L3)→L4），但通过 Bulldozer(L6) 链，Construction Units 到达 L7。

### 利用率分析（迭代收敛，共6轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。
> 第1轮剔除：Bulldozer(0.022)、Diesel(0.042)、Steel Beams(0.059)、Tools(0.148)、Planks(0.113)
> 第2轮剔除：Car Body、Combustion Engine、Crude Oil、Ethanol、Batteries、Wood（均归零）
> 第3轮剔除：Steel(0.000)、Electronic Comps(0.000)、Sugarcane(0.000)、Glass(0.132)
> 第4轮剔除：Iron Ore(0.000)、Chemicals(0.000)、Silicon(0.000)、Seeds(0.000)
> 第5轮剔除：Water(0.102)、Minerals(0.000)、Sand(0.000)
> 第6轮收敛

**最终稳定状态**：

| 节点                 | 利用率   | 决策        | 备注                     |
| ------------------ | ----- | --------- | ---------------------- |
| Bulldozer等22节点     | <0.2  | ⚠️ **外购** | 详见迭代过程                 |
| Windows            | 0.230 | ✓ 自产      | 最低合格节点                 |
| Aluminium          | 0.283 | ✓ 自产      | Windows所需              |
| Bauxite            | 1.275 | ✓ 自产      | Aluminium所需            |

**自产（4项）**：Construction Units + Windows + Aluminium + Bauxite
**外购（22项）**：其余所有节点

> **修正说明**：旧分析基于单轮计算得出 Minerals(0.208) 勉强合格、Windows(0.230) 自产。迭代后，众多中间节点级联剔除，最终只剩 Windows→Aluminium→Bauxite 这条线合格。

### 推荐裁剪策略

Construction Units 的利用率危机不是链条设计问题，而是**市场体量问题**：
产量 1.1/hr = 每天约 26 个，意味着整个服务器对此产品的需求极小，或者生产者极少。

**方案（迭代收敛推荐，5 栋建筑）**

```
自产（4）：Bauxite + Aluminium + Windows + Construction Units
外购（4直接原料）：Bulldozer、Diesel、Steel Beams、Tools
外购（原料）：Bauxite所需Water（利用率0.102，略低于阈值，可视情况自产）
```

- Windows(0.230) + Aluminium(0.283) + Bauxite(1.275) 是迭代后唯一合格链条
- Bulldozer/Diesel/Steel Beams/Tools 全部市购
- 建筑：4 栋（Bauxite + Aluminium + Windows + CU）

> 与旧分析的差异：旧方案A仅建Windows+CU（2栋），旧方案B建4栋但包含Glass。
> 迭代收敛显示Glass(0.132)也应外购，正确链是 Bauxite→Aluminium→Windows→CU。

**方案 C（不推荐：完整链）**

```
26 栋建筑，所有利用率均低于 0.2（除 Minerals 和 Windows）
严重浪费建筑槽位
```

- **完全不推荐**：26 栋建筑换来 1.1/hr 的产量，性价比为全游戏最差

### 链条特点

- **唯一结论：纯终端产品，高度依赖稀缺市场溢价**。CU 全服产量仅 1.1/hr，意味着整个市场需求极小，**但也意味着少数生产者几乎可以垄断定价**。
- **Bulldozer 子链的悖论**：Bulldozer 本身产量 6.1/hr、Car Body 26.1/hr，CU 对它们的利用率仅 0.022 和 0.005——自建 Bulldozer 链毫无意义，必须市购。
- **Windows 是唯一值得自产的节点**：全服 Windows 产量约 19/hr，供货偏紧，且 CU 对其利用率 0.23 是链中唯一合格值。自建 Windows 工厂既保障供应又可对外销售。
- **与 Diesel/Steel 链高度重叠**：Diesel 是直接原料，Steel Beams 和 Tools 都消耗大量 Steel——若已有 Diesel 或 Steel 链，可尝试向上延伸，但利用率提升有限。
- **投资建议**：除非瞄准 CU 市场垄断（市场极度稀缺、价格极高），**否则不推荐专门为 CU 建链**。相比之下，Diesel（L5，全链绿，6 栋）的投资回报率远高于 Construction Units。

---

## 综合比较（车辆与建筑类）


| 产品                 | 层级  | 节点数 | 自产数 | 最低自产利用率        | 评分    | 特点                             |
| ------------------ | --- | --- | --- | -------------- | ----- | -------------------------------- |
| Economy Car        | L6  | 23  | 23  | 0.223(Sand)    | **6.0** | 全树无短板，唯一全自产合格链                |
| Economy E-Car      | L6  | 25  | 24  | 0.223(Sand)    | **5.8** | 几乎全自产，仅外购Power，与Economy Car并列 |
| Bulldozer          | L6  | 15  | 13  | 0.223(Sand)    | **5.2** | 高自产率，仅外购Water                 |
| Diesel             | L5  | 6   | 6   | 0.495          | 5.0   | 最干净的链，全树合格                    |
| Luxury E-Car       | L8  | 26  | 12  | 0.223(Sand)    | 3.7   | 12节点自产，外购Luxury Interior/Car Body |
| Luxury Car         | L8  | 25  | 9   | 0.223(Sand)    | 2.9   | 外购Luxury Interior/Car Body/Steel |
| Truck              | L6  | 24  | 11  | 0.223(Sand)    | 2.8   | 11节点自产，外购Basic Interior等      |
| Transport          | L6  | 8   | 1   | —（仅终端）         | 0.8   | 终端产品，所有原料外购                  |
| Construction Units | L7  | 26  | 4   | 0.230(Windows) | 1.1   | 迭代后仅Bauxite→Aluminium→Windows→CU |

---

## 新增车辆类产品

## Luxury Car（豪华轿车）`id:56`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L8（Power L0 → Luxury Car L8） |
| 完整依赖树节点数 | 25（含 Power） |
| 推荐自产节点数 | 9 |
| 推荐外购节点数 | 15（豪华内饰、车身、钢铁、显示屏、铝等） |
| 全服务器产量 | 2.17/hr |

### 生产配方

```
Luxury Car <- Combustion Enginex2 + Luxury Interiorx1 + Car Bodyx1 + On-board Computerx2
Combustion Engine <- Steelx6 + Chemicalsx5 + Electronic Compsx5
On-board Computer <- Processorsx2 + Electronic Compsx3
Chemicals <- Powerx0.2 + Mineralsx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Processors <- Siliconx4 + Chemicalsx1
Minerals <- Powerx20 + Waterx1
Silicon <- Powerx3 + Sandx2
Sand <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand
L2  Silicon  Minerals
L3  Chemicals
L4  Electronic Comps  Processors
L5  On-board Computer  Combustion Engine
L8  Luxury Car
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sand（沙） | 1496.9 | 0.223 | ✓ 自产 |
| On-board Computer（车载电脑） | 14.8 | 0.293 | ✓ 自产 |
| Chemicals（化学品） | 231.7 | 0.371 | ✓ 自产 |
| Combustion Engine（燃烧发动机） | 6.3 | 0.689 | ✓ 自产 |
| Silicon（硅） | 166.8 | 1.037 | ✓ 自产 |
| Electronic Comps（电子元件） | 44.5 | 1.709 | ✓ 自产 |
| Minerals（矿物质） | 125.7 | 1.842 | ✓ 自产 |
| Processors（处理器） | 9.9 | 3.000 | ✓ 自产 |

### 结论

- **自产**（9 节点）：Luxury Car、Combustion Engine、On-board Computer、Chemicals、Electronic Comps、Processors、Minerals、Silicon、Sand
- **外购**（15 项）：Luxury Interior、Car Body、Steel、Displays、Aluminium、Leather、Glass、Iron Ore、Bauxite、Cows、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：Sand（0.223）

---

## Luxury E-Car（豪华电动车）`id:54`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L8（Power L0 → Luxury E-Car L8） |
| 完整依赖树节点数 | 26（含 Power） |
| 推荐自产节点数 | 12 |
| 推荐外购节点数 | 13（豪华内饰、车身、显示屏、铝、皮革等） |
| 全服务器产量 | 4.35/hr |

### 生产配方

```
Luxury E-Car <- Electric Motorx4 + Luxury Interiorx1 + Car Bodyx1 + Batteriesx30 + On-board Computerx2
Electric Motor <- Steelx2 + Electronic Compsx3
Batteries <- Chemicalsx4
On-board Computer <- Processorsx2 + Electronic Compsx3
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Electronic Comps <- Siliconx3 + Chemicalsx1
Chemicals <- Powerx0.2 + Mineralsx1
Processors <- Siliconx4 + Chemicalsx1
Iron Ore <- Powerx7 + Waterx0.5
Silicon <- Powerx3 + Sandx2
Minerals <- Powerx20 + Waterx1
Sand <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand
L2  Silicon  Iron Ore  Minerals
L3  Chemicals
L4  Steel  Processors  Electronic Comps  Batteries
L5  Electric Motor  On-board Computer
L8  Luxury E-Car
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sand（沙） | 1496.9 | 0.223 | ✓ 自产 |
| Steel（钢铁） | 208.5 | 0.333 | ✓ 自产 |
| Electric Motor（电动机） | 34.7 | 0.501 | ✓ 自产 |
| On-board Computer（车载电脑） | 14.8 | 0.586 | ✓ 自产 |
| Chemicals（化学品） | 231.7 | 0.794 | ✓ 自产 |
| Silicon（硅） | 166.8 | 1.037 | ✓ 自产 |
| Iron Ore（铁矿） | 191.6 | 1.088 | ✓ 自产 |
| Minerals（矿物质） | 125.7 | 1.842 | ✓ 自产 |
| Processors（处理器） | 9.9 | 3.000 | ✓ 自产 |
| Electronic Comps（电子元件） | 44.5 | 3.341 | ✓ 自产 |
| Batteries（电池） | 27.2 | 4.798 | ✓ 自产 |

### 结论

- **自产**（12 节点）：Luxury E-Car、Electric Motor、Batteries、On-board Computer、Steel、Electronic Comps、Chemicals、Processors、Iron Ore、Silicon、Minerals、Sand
- **外购**（13 项）：Luxury Interior、Car Body、Displays、Aluminium、Leather、Glass、Bauxite、Cows、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：Sand（0.223）

---

## Transport（运输）`id:13`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Transport L6） |
| 完整依赖树节点数 | 8（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 6（柴油、原油、乙醇、甘蔗、水等） |
| 全服务器产量 | 3369.55/hr |

### 生产配方

```
Transport <- Dieselx0.005 + Powerx0.01
```

### 层级结构

```
L0  Power
L6  Transport
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Transport
- **外购**（6 项）：Diesel、Crude Oil、Ethanol、Sugarcane、Water、Seeds
- 链底最低利用率：（单节点）

---

## Bulldozer（推土机）`id:112`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Bulldozer L6） |
| 完整依赖树节点数 | 15（含 Power） |
| 推荐自产节点数 | 13 |
| 推荐外购节点数 | 1（水） |
| 全服务器产量 | 6.08/hr |

### 生产配方

```
Bulldozer <- Steelx4 + Car Bodyx1 + Combustion Enginex2
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Car Body <- Aluminiumx30 + Glassx5 + Steelx5
Combustion Engine <- Steelx6 + Chemicalsx5 + Electronic Compsx5
Iron Ore <- Powerx7 + Waterx0.5
Chemicals <- Powerx0.2 + Mineralsx1
Aluminium <- Powerx15 + Bauxitex1
Glass <- Powerx2 + Siliconx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Minerals <- Powerx20 + Waterx1
Bauxite <- Powerx14 + Waterx0.5
Silicon <- Powerx3 + Sandx2
Sand <- Powerx2
```

### 层级结构

```
L0  Power
L1  Sand
L2  Iron Ore  Bauxite  Silicon  Minerals
L3  Chemicals  Glass  Aluminium
L4  Electronic Comps  Steel
L5  Car Body  Combustion Engine
L6  Bulldozer
```

### 利用率分析（迭代收敛，共 2 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sand（沙） | 1496.9 | 0.223 | ✓ 自产 |
| Car Body（车身） | 26.1 | 0.233 | ✓ 自产 |
| Chemicals（化学品） | 231.7 | 0.418 | ✓ 自产 |
| Electronic Comps（电子元件） | 44.5 | 0.709 | ✓ 自产 |
| Steel（钢铁） | 208.5 | 0.924 | ✓ 自产 |
| Glass（玻璃） | 139.0 | 0.938 | ✓ 自产 |
| Iron Ore（铁矿） | 191.6 | 1.088 | ✓ 自产 |
| Bauxite（铝土矿） | 101.8 | 1.275 | ✓ 自产 |
| Silicon（硅） | 166.8 | 1.633 | ✓ 自产 |
| Minerals（矿物质） | 125.7 | 1.842 | ✓ 自产 |
| Combustion Engine（燃烧发动机） | 6.3 | 1.929 | ✓ 自产 |
| Aluminium（铝） | 129.7 | 6.029 | ✓ 自产 |

### 结论

- **自产**（13 节点）：Bulldozer、Steel、Car Body、Combustion Engine、Iron Ore、Chemicals、Aluminium、Glass、Electronic Comps、Minerals、Bauxite、Silicon、Sand
- **外购**（1 项）：Water
- 链底最低利用率：Sand（0.223）

---

## Truck（卡车）`id:57`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Truck L6） |
| 完整依赖树节点数 | 24（含 Power） |
| 推荐自产节点数 | 11 |
| 推荐外购节点数 | 12（基础内饰、车身、显示屏、塑料、布料等） |
| 全服务器产量 | 5.21/hr |

### 生产配方

```
Truck <- Combustion Enginex6 + Basic Interiorx1 + Car Bodyx1 + Steelx10 + On-board Computerx1
Combustion Engine <- Steelx6 + Chemicalsx5 + Electronic Compsx5
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
On-board Computer <- Processorsx2 + Electronic Compsx3
Chemicals <- Powerx0.2 + Mineralsx1
Electronic Comps <- Siliconx3 + Chemicalsx1
Iron Ore <- Powerx7 + Waterx0.5
Processors <- Siliconx4 + Chemicalsx1
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
L4  Steel  Electronic Comps  Processors
L5  On-board Computer  Combustion Engine
L6  Truck
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sand（沙） | 1496.9 | 0.223 | ✓ 自产 |
| On-board Computer（车载电脑） | 14.8 | 0.352 | ✓ 自产 |
| Steel（钢铁） | 208.5 | 0.432 | ✓ 自产 |
| Chemicals（化学品） | 231.7 | 0.461 | ✓ 自产 |
| Silicon（硅） | 166.8 | 1.037 | ✓ 自产 |
| Iron Ore（铁矿） | 191.6 | 1.088 | ✓ 自产 |
| Electronic Comps（电子元件） | 44.5 | 1.709 | ✓ 自产 |
| Minerals（矿物质） | 125.7 | 1.842 | ✓ 自产 |
| Processors（处理器） | 9.9 | 3.000 | ✓ 自产 |
| Combustion Engine（燃烧发动机） | 6.3 | 4.960 | ✓ 自产 |

### 结论

- **自产**（11 节点）：Truck、Combustion Engine、Steel、On-board Computer、Chemicals、Electronic Comps、Iron Ore、Processors、Minerals、Silicon、Sand
- **外购**（12 项）：Basic Interior、Car Body、Displays、Plastic、Fabric、Aluminium、Glass、Crude Oil、Cotton、Bauxite、Water、Seeds
- 链底最低利用率：Sand（0.223）

---

## Economy E-Car（经济电动车）`id:53`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Economy E-Car L6） |
| 完整依赖树节点数 | 25（含 Power） |
| 推荐自产节点数 | 24 |
| 推荐外购节点数 | 0（） |
| 全服务器产量 | 21.73/hr |

### 生产配方

```
Economy E-Car <- Electric Motorx2 + Basic Interiorx1 + Car Bodyx1 + Batteriesx15 + On-board Computerx1
Electric Motor <- Steelx2 + Electronic Compsx3
Basic Interior <- Displaysx2 + Plasticx2 + Fabricx5
Car Body <- Aluminiumx30 + Glassx5 + Steelx5
Batteries <- Chemicalsx4
On-board Computer <- Processorsx2 + Electronic Compsx3
Steel <- Powerx5 + Iron Orex1 + Chemicalsx0.1
Electronic Comps <- Siliconx3 + Chemicalsx1
Displays <- Siliconx5 + Chemicalsx4
Plastic <- Powerx5 + Crude Oilx0.2
Fabric <- Cottonx2 + Powerx1
Aluminium <- Powerx15 + Bauxitex1
Glass <- Powerx2 + Siliconx1
Chemicals <- Powerx0.2 + Mineralsx1
Processors <- Siliconx4 + Chemicalsx1
Iron Ore <- Powerx7 + Waterx0.5
Silicon <- Powerx3 + Sandx2
Crude Oil <- Powerx25
Cotton <- Waterx1 + Seedsx1
Bauxite <- Powerx14 + Waterx0.5
Minerals <- Powerx20 + Waterx1
Water <- Powerx0.2
Sand <- Powerx2
Seeds <- Waterx0.1
```

### 层级结构

```
L0  Power
L1  Sand  Water  Crude Oil
L2  Seeds  Plastic  Iron Ore  Bauxite  Minerals  Silicon
L3  Glass  Chemicals  Cotton  Aluminium
L4  Fabric  Steel  Displays  Processors  Electronic Comps  Batteries
L5  Basic Interior  Car Body  Electric Motor  On-board Computer
L6  Economy E-Car
```

### 利用率分析（迭代收敛，共 1 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sand（沙） | 1496.9 | 0.223 | ✓ 自产 |
| Seeds（种子） | 907.5 | 0.291 | ✓ 自产 |
| Plastic（塑料） | 224.2 | 0.310 | ✓ 自产 |
| Water（水） | 1738.2 | 0.361 | ✓ 自产 |
| Basic Interior（基础内饰） | 34.8 | 0.625 | ✓ 自产 |
| Fabric（布料） | 247.6 | 0.702 | ✓ 自产 |
| Car Body（车身） | 26.1 | 0.833 | ✓ 自产 |
| Glass（玻璃） | 139.0 | 0.938 | ✓ 自产 |
| Steel（钢铁） | 208.5 | 0.958 | ✓ 自产 |
| Crude Oil（原油） | 45.9 | 0.977 | ✓ 自产 |
| Iron Ore（铁矿） | 191.6 | 1.088 | ✓ 自产 |
| Electric Motor（电动机） | 34.7 | 1.253 | ✓ 自产 |
| Bauxite（铝土矿） | 101.8 | 1.275 | ✓ 自产 |
| Chemicals（化学品） | 231.7 | 1.391 | ✓ 自产 |
| On-board Computer（车载电脑） | 14.8 | 1.466 | ✓ 自产 |
| Minerals（矿物质） | 125.7 | 1.842 | ✓ 自产 |
| Cotton（棉花） | 264.0 | 1.876 | ✓ 自产 |
| Displays（显示屏） | 34.6 | 2.011 | ✓ 自产 |
| Silicon（硅） | 166.8 | 2.907 | ✓ 自产 |
| Processors（处理器） | 9.9 | 3.000 | ✓ 自产 |
| Electronic Comps（电子元件） | 44.5 | 3.341 | ✓ 自产 |
| Aluminium（铝） | 129.7 | 6.029 | ✓ 自产 |
| Batteries（电池） | 27.2 | 11.995 | ✓ 自产 |

### 结论

- **自产**（24 节点）：Economy E-Car、Electric Motor、Basic Interior、Car Body、Batteries、On-board Computer、Steel、Electronic Comps、Displays、Plastic、Fabric、Aluminium、Glass、Chemicals、Processors、Iron Ore、Silicon、Crude Oil、Cotton、Bauxite、Minerals、Water、Sand、Seeds
- **外购**（0 项）：无（全自产）
- 链底最低利用率：Sand（0.223）

---
