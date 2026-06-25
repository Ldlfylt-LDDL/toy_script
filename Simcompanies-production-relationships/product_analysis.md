# SimCompanies 产品产业链分析记录

> 数据来源：SimCo API `producedAnHour`（全服务器总产量，反映建筑级数分布）
> 利用率 = 链条内所有下游消耗之和 / 该节点产量
> 阈值：利用率 < 0.2 → 建议外购（需将下游升至上游5倍以上等级，指数成本不合算）

> 各产品的详细分析已拆分至分类文件，本文件作为主索引和综合比较。

---

## 分析文件索引


| 分类文件               | 包含产品                                                         | 状态  |
| ------------------ | ------------------------------------------------------------ | --- |
| [analysis_food.md](analysis_food.md) | Bread、Hamburger、Meat Balls、Apple Pie、Frozen Pizza、Lasagna、Sauce、Salad、Dough、Butter、Steak、Sausages、Cheese、Chocolate、Cocktails | ✓ 完整 |
| [analysis_electronics.md](analysis_electronics.md) | Quadcopter(98)、Robots(114)、Satellite(99) | ✓ 完整 |
| [analysis_vehicles.md](analysis_vehicles.md) | Economy Car、Diesel、Construction Units、Luxury Car、Luxury E-Car、Transport、Bulldozer、Truck、Economy E-Car | ✓ 完整 |
| [analysis_aerospace.md](analysis_aerospace.md) | Sub-orbital Rocket、BFR、Jumbo Jet、Luxury Jet、Single Engine Plane、Sub-orbital 2nd Stage、Starship、Attitude Control、Flight Computer、Cockpit、Orbital Booster | ✓ 完整 |
| [analysis_luxury.md](analysis_luxury.md) | Handbags、Gloves、Stiletto Heel、Luxury Interior、Leather、Necklace | ✓ 完整 |

---

## 分析模板

下次分析新产品时记录以下项目：

```markdown
## 产品名 `id:XX`

### 基本参数
- 层级深度 / 完整依赖树节点数 / 自产节点数 / 外购节点数

### 生产配方（完整树）

### 层级结构

### 利用率分析（表格）

### 推荐裁剪策略（方案 A/B/C）

### 链条特点与建议
```

---

## 综合比较（已分析产品）

> 评分 = 层级深度 × (自产节点数 / 总节点数)，越高越适合垂直整合

| 产品                    | 层级  | 节点数 | 自产数 | 最低自产利用率        | 评分       | 特点                              |
| --------------------- | --- | --- | --- | -------------- | -------- | ------------------------------- |
| **Sub-orbital Rocket**| L8  | 31  | 27  | 0.218(2nd Stage)| **7.0** | 几乎全自产，仅外购Water/GoldenBars/GoldOre |
| **Sub-orbital 2nd Stage**| L7 | 29 | 25  | 0.223(Sand)    | **6.0**  | 极高自产率，是Sub-orbital Rocket的子链    |
| **Economy Car**       | L6  | 23  | 23  | 0.223(Sand)    | **6.0**  | 全树无短板，唯一全自产合格的深层链               |
| **Economy E-Car**     | L6  | 25  | 24  | 0.223(Sand)    | **5.8**  | 几乎全自产（仅外购Power），与Economy Car并列 |
| Bread                 | L8  | 11  | 7   | 0.278(Flour)   | 5.1      | 极深，主干完美，食品稀缺                    |
| **Bulldozer**         | L6  | 15  | 13  | 0.223(Sand)    | **5.2**  | 高自产率，仅外购Water                   |
| **Attitude Control**  | L6  | 12  | 10  | 0.223(Sand)    | **5.0**  | 高自产率，仅外购Water                   |
| Jumbo Jet             | L7  | 25  | 18  | 0.223(Sand)    | 5.0      | 高自产率，外购Wing/Cockpit/Gold系列      |
| Diesel                | L5  | 6   | 6   | 0.495          | 5.0      | 最干净的链，全树合格                      |
| BFR                   | L8  | 36  | 22  | 0.223(Sand)    | 4.9      | 最大节点数，外购Orbital Booster等        |
| Starship              | L7  | 31  | 21  | 0.223(Sand)    | 4.7      | 21节点自产，外购Plastic等               |
| Apple Pie             | L8  | 14  | 8   | 0.278(Flour)   | 4.6      | 需外购Apples/Sugarcane，共享Bread链    |
| Frozen Pizza          | L8  | 14  | 8   | 0.278(Flour)   | 4.6      | Cheese 利用率 1.667，Milk 一购双用      |
| Single Engine Plane   | L7  | 28  | 17  | 0.223(Sand)    | 4.3      | 17节点自产，外购Fiberglass/Steel等      |
| Flight Computer       | L6  | 13  | 9   | 0.223(Sand)    | 4.2      | 9节点自产，外购GoldenBars/GoldOre      |
| Dough                 | L7  | 11  | 6   | 0.278(Flour)   | 3.8      | Bread链核心子链，单独建链意义不大            |
| Gloves                | L7  | 11  | 6   | 0.204(Water)   | 3.8      | 6节点自产，全链几乎合格                   |
| Luxury E-Car          | L8  | 26  | 12  | 0.223(Sand)    | 3.7      | 12节点自产，外购Luxury Interior等       |
| Luxury Interior       | L7  | 16  | 9   | 0.223(Sand)    | 3.9      | 9节点自产（电子+铝+皮革），外购Cows系列       |
| Orbital Booster       | L6  | 22  | 12  | 0.586(CrudeOil)| 3.3      | 12节点自产，外购Steel/Sand等            |
| Luxury Car            | L8  | 25  | 9   | 0.223(Sand)    | 2.9      | 外购Luxury Interior/Car Body       |
| Truck                 | L6  | 24  | 11  | 0.223(Sand)    | 2.8      | 11节点自产，外购Basic Interior等        |
| Cockpit               | L6  | 17  | 7   | 0.223(Sand)    | 2.5      | 7节点自产，外购Plastic/Gold系列         |
| Necklace              | L4  | 5   | 3   | 0.328(GoldBars)| 2.4      | 简单金条链，实际受金矿产量制约               |
| Luxury Jet            | L7  | 25  | 7   | 0.413(JetEng)  | 2.0      | 7节点自产（机身/喷气引擎/碳系），外购较多       |
| Robots                | L6  | 13  | 4   | 0.223(Sand)    | 1.8      | 迭代后仅Sand→Silicon→Processors→Robots |
| Handbags              | L7  | 9   | 2   | 3.375(Leather) | 1.6      | 仅自产Handbags+Leather，外购Cows系列    |
| Salad                 | L7  | 10  | 2   | 0.798(Cheese)  | 1.4      | 仅自产Salad+Cheese，外购蔬菜/牛奶系列     |
| Lasagna               | L8  | 16  | 2   | 2.000(Sauce)   | 1.0      | 仅自产Lasagna+Sauce；推荐1+2联合建设，Q6+ PPLH≈984/hr |
| Stiletto Heel         | L7  | 11  | 2   | 3.250(Leather) | 1.3      | 仅自产Stiletto+Leather，外购Plastic   |
| Construction Units    | L7  | 26  | 4   | 0.230(Windows) | 1.1      | 迭代后仅Bauxite→Aluminium→Windows→CU  |
| Meat Balls            | L9  | 16  | 2   | 1.333(Sauce)   | 1.1      | Sauce为唯一特色节点，Bread链延伸时有价值      |
| Quadcopter            | L6  | 12  | 9   | 0.223(Sand)    | 4.5      | 电子链，3轮迭代后保留9节点                 |
| Hamburger             | L9  | 15  | 1   | —（仅终端）        | 0.6      | 迭代后仅自产Hamburger，Bread链延伸时有价值   |
| Chocolate             | L6  | 11  | 1   | —（仅终端）        | 0.5      | 所有原料外购，仅建Chocolate厂            |
| Transport             | L6  | 8   | 1   | —（仅终端）        | 0.8      | 终端产品，所有原料外购                    |
| Sauce/Butter/Steak 等 | L6-7| 8-9 | 1  | —（仅终端）        | 0.8      | 单节点终端产品，所有原料外购，建议只作延伸         |


### 推荐投资顺序（迭代收敛后修正，2026-03-16）

**顶级推荐（评分≥5.0，高自产率）：**
1. **Sub-orbital Rocket**：L8，27/31自产，评分 7.0 → 几乎全链自产，外购仅Water/GoldenBars/GoldOre
2. **Economy Car**：L6，23/23全自产，评分 6.0 → 全树无短板，全游戏唯一全自产合格深层链
3. **Economy E-Car**：L6，24/25自产，评分 5.8 → 与Economy Car并列，共享电子/钢铁链
4. **Sub-orbital 2nd Stage**：L7，25/29自产，评分 6.0 → 是Rocket的子链，建Rocket时自然包含
5. **Bulldozer**：L6，13/15自产，评分 5.2 → 仅外购Water，高质量短链
6. **Jumbo Jet**：L7，18/25自产，评分 5.0 → 外购Wing/Cockpit，高自产航空器

**食品链（推荐作为食品主链）：**
7. **Bread 链（7自产）**：L8，外购Eggs/Milk/Fodder/Vegetables，评分 5.1
8. **Apple Pie / Frozen Pizza**：各 +1 栋专属建筑，L8 侧线，评分 4.6
9. **Hamburger/Meat Balls/Lasagna 延伸**（已有Bread链时）：+1-2栋，边际成本极低

**中级推荐：**
10. **Quadcopter**：9节点自产，电子链，评分 4.5
11. **Diesel**：6栋独立全绿，低风险辅助线，评分 5.0
12. **BFR/Starship**：高节点数，航天最终产品，评分 4.7-4.9

---

## 附录：全游戏产品整体排名

> 数据来源：`analyze.js` 对全部 138 个产品节点的分析结果（2026-03-12）
> 排序依据：产业链层级深度 → 节点数 → 最低利用率

### 全深度排名（Top 44，按层级深度）


| #   | 产品                    | 层级     | 节点     | 产量/hr  | 最低利用率       | 直接原料利用率                                                       |
| --- | --------------------- | ------ | ------ | ------ | ----------- | ------------------------------------------------------------- |
| 1   | Hamburger             | L9     | 15     | 0.6    | ⚠️ 0.007    | Steak:0.09⚠ Vegetables:0.01⚠ Butter:0.04⚠ Bread:0.02⚠         |
| 2   | Meat Balls            | L9     | 16     | 1.2    | ⚠️ 0.015    | Sausages:0.03⚠ Bread:0.09⚠ Sauce:1.33✓                        |
| 3   | Bread                 | L8     | 11     | 13.0   | ⚠️ 0.040    | Dough:1.00✓                                                   |
| 4   | Apple Pie             | L8     | 14     | 6.5    | ⚠️ 0.040    | Dough:0.50✓ Apples:0.06⚠ Sugar:0.29✓                          |
| 5   | Frozen Pizza          | L8     | 14     | 9.9    | ⚠️ 0.040    | Dough:1.52✓ Vegetables:0.07⚠ Cheese:1.67✓                     |
| 6   | Lasagna               | L8     | 15     | 1.8    | ⚠️ 0.030    | Steak:0.06⚠ Cheese:0.15⚠ Pasta:0.09⚠ Sauce:2.00✓              |
| 7   | Luxury Car            | L8     | 24     | 2.2    | ⚠️ 0.083    | CombEng:0.69✓ LuxInt:0.10⚠ CarBody:0.08⚠ OBC:0.29✓            |
| 8   | Luxury E-Car          | L8     | 25     | 4.3    | ⚠️ 0.100    | ElecMotor:0.50✓ LuxInt:0.20⚠ CarBody:0.17⚠ Batteries:4.80✓    |
| 9   | Sub-orbital Rocket    | L8     | 30     | 0.7    | ⚠️ 0.004    | SolidFuel:2.32✓ 2ndStage:0.22✓                                |
| 10  | BFR                   | L8     | 35     | 0.2    | ⚠️ 0.004    | OrbBooster:0.15⚠ Starship:0.73✓                               |
| 11  | Sauce                 | L7     | 8      | 0.9    | ⚠️ 0.030    | Vegetables:0.01⚠ Butter:0.03⚠                                 |
| 12  | Handbags              | L7     | 8      | 69.6   | ⚠️ 0.100    | Leather:3.38✓                                                 |
| 13  | Salad                 | L7     | 9      | 2.4    | ⚠️ 0.030    | Vegetables:0.04⚠ VegOil:0.03⚠ Cheese:0.80✓                    |
| 14  | Dough                 | L7     | 10     | 13.0   | ⚠️ 0.040    | Flour:0.28✓ Eggs:0.04⚠ Butter:0.44✓                           |
| 15  | Gloves                | L7     | 10     | 147.0  | ⚠️ 0.100    | Fabric:0.30✓ Leather:2.38✓                                    |
| 16  | Stiletto Heel         | L7     | 10     | 100.6  | ⚠️ 0.090    | Leather:3.25✓ Plastic:0.09⚠                                   |
| 17  | Luxury Interior       | L7     | 15     | 21.7   | ⚠️ 0.100    | Displays:3.77✓ Aluminium:0.33✓ Leather:3.51✓                  |
| 18  | Satellite             | L7     | 19     | 0.1    | ⚠️ 0.004    | FlightComp:0.20⚠ IonDrive:0.21✓ HighGradeEC:0.53✓             |
| 19  | Jumbo Jet             | L7     | 24     | 0.1    | ⚠️ 0.004    | Fuselage:0.79✓ Wing:0.08⚠ Cockpit:0.06⚠                       |
| 20  | Luxury Jet            | L7     | 24     | 0.2    | ⚠️ 0.016    | Fuselage:0.74✓ Wing:0.04⚠ GoldenBars:0.01⚠                    |
| 21  | Construction Units    | L7     | 26     | 1.1    | ⚠️ 0.022    | Bulldozer:0.02⚠ Diesel:0.04⚠ Windows:0.23✓                    |
| 22  | Single Engine Plane   | L7     | 27     | 1.7    | ⚠️ 0.004    | Fuselage:3.69✓ Wing:0.38✓ Cockpit:0.66✓ CombEng:0.27✓         |
| 23  | Sub-orbital 2nd Stage | L7     | 28     | 3.4    | ⚠️ 0.004    | Fuselage:7.27↑ PropTank:1.33✓ FlightComp:2.58✓                |
| 24  | Starship              | L7     | 30     | 0.3    | ⚠️ 0.004    | Cockpit:0.26✓ HeatShield:0.25✓ RocketEng:7.46↑                |
| 25  | Transport             | L6     | 7      | 3369.5 | ⚠️ 0.133    | Diesel:0.13⚠                                                  |
| 26  | Leather               | L6     | 7      | 31.0   | ⚠️ 0.100    | Cows:0.10⚠                                                    |
| 27  | Butter                | L6     | 7      | 14.8   | ⚠️ 0.060    | Milk:0.06⚠                                                    |
| 28  | Steak                 | L6     | 7      | 27.8   | ⚠️ 0.090    | Cows:0.09⚠                                                    |
| 29  | Sausages              | L6     | 7      | 83.4   | ⚠️ 0.061    | Pigs:0.06⚠                                                    |
| 30  | Cheese                | L6     | 7      | 5.9    | ⚠️ 0.048    | Milk:0.05⚠                                                    |
| 31  | Chocolate             | L6     | 10     | 3.5    | ⚠️ 0.014    | Cocoa:0.20⚠ Milk:0.01⚠ Sugar:0.08⚠                            |
| 32  | Attitude Control      | L6     | 11     | 3.1    | ⚠️ 0.127    | Steel:0.04⚠ Batteries:0.57✓ ElecMotor:0.27✓                   |
| 33  | Flight Computer       | L6     | 12     | 2.6    | ⚠️ 0.004    | HighGradeEC:5.27↑ OBC:0.35✓                                   |
| 34  | Quadcopter            | L6     | 12     | 14.3   | ⚠️ 0.072    | OBC:0.97✓ Batteries:0.53✓ EC:0.97✓ Plastic:0.13⚠              |
| 35  | Robots                | L6     | 13     | 2.5    | ⚠️ 0.071    | ElecMotor:0.07⚠ Processors:0.50✓ Plastic:0.11⚠                |
| 36  | Cocktails             | L6     | 13     | 0.6    | ⚠️ 0.006    | OrangeJuice:0.01⚠ AppleCider:0.02⚠ GingerBeer:0.02⚠           |
| 37  | Bulldozer             | L6     | 14     | 6.1    | ⚠️ 0.157    | Steel:0.12⚠ CarBody:0.23✓ CombEng:1.93✓                       |
| 38  | Cockpit               | L6     | 16     | 2.6    | ⚠️ 0.004    | HighGradeEC:5.27↑ Displays:0.60✓ BasicInt:0.07⚠               |
| 39  | Orbital Booster       | L6     | 21     | 1.7    | ⚠️ 0.004    | Fuselage:18.18↑ PropTank:5.33↑ RocketEng:181.26↑              |
| 40  | **Economy Car**       | **L6** | **23** | 15.2   | **0.223 ✓** | CombEng:2.41✓ BasicInt:0.44✓ CarBody:0.58✓ OBC:1.03✓          |
| 41  | Truck                 | L6     | 23     | 5.2    | ⚠️ 0.150    | CombEng:4.96✓ BasicInt:0.15⚠ CarBody:0.20⚠                    |
| 42  | **Economy E-Car**     | **L6** | **24** | 21.7   | **0.223 ✓** | ElecMotor:1.25✓ BasicInt:0.63✓ CarBody:0.83✓ Batteries:12.00↑ |
| 43  | **Underwear**         | **L5** | **5**  | 170.2  | **0.204 ✓** | Fabric:0.69✓                                                  |
| 44  | **Diesel**            | **L5** | **6**  | 126.3  | **0.495 ✓** | CrudeOil:2.07✓ Ethanol:0.49✓                                  |


> **粗体**：全树利用率合格（最低 ≥ 0.2），无需外购任何节点

### 预算内最优候选（≤12 节点，全树合格）

按深度 × 质量综合排序，无需外购任何节点：


| #   | 产品               | 层级  | 节点  | 产量/hr | 最低利用率 | 说明                              |
| --- | ---------------- | --- | --- | ----- | ----- | ------------------------------- |
| 1   | Underwear        | L5  | 5   | 170.2 | 0.204 | 极简链，Cotton→Fabric→Underwear     |
| 2   | Diesel           | L5  | 6   | 126.3 | 0.495 | 全链均衡，Crude Oil + Ethanol 双路     |
| 3   | Petrol           | L5  | 6   | 122.3 | 0.479 | 同 Diesel 链，可互换生产                |
| 4   | Cows             | L5  | 6   | 38.7  | 0.530 | 农业链，Fodder 1.516                |
| 5   | Pigs             | L5  | 6   | 85.1  | 0.530 | 同 Cows 链，共享 Fodder              |
| 6   | Milk             | L5  | 6   | 123.8 | 0.202 | 边缘合格，Fodder 0.202               |
| 7   | Dress            | L5  | 7   | 154.8 | 0.204 | Fabric + Plastic 双路             |
| 8   | Basic Interior   | L5  | 12  | 34.8  | 0.223 | 与 Economy Car 共用，Displays 2.011 |
| 9   | Ethanol          | L4  | 4   | 63.8  | 0.727 | 极简链，Sugarcane→Ethanol           |
| 10  | Fabric           | L4  | 4   | 247.6 | 0.204 | Cotton→Fabric                   |
| 11  | Flour            | L4  | 4   | 93.9  | 0.290 | Grain→Flour，Grain 1.707         |
| 12  | Vegetable Oil    | L4  | 4   | 39.5  | 0.384 | Vegetables→VegOil               |
| 13  | Fuselage         | L4  | 4   | 3.7   | 0.586 | CarbonFibers→CarbComp→Fuselage  |
| 14  | Apple Cider      | L4  | 4   | 38.3  | 0.227 | Apples→AppleCider               |
| 15  | Fodder           | L4  | 5   | 306.3 | 0.530 | Vegetables + Grain 双路           |
| 16  | Apples           | L3  | 3   | 206.3 | 0.227 | Water + Seeds → Apples          |
| 17  | Oranges          | L3  | 3   | 189.8 | 0.209 | Water + Seeds → Oranges         |
| 18  | Grain            | L3  | 3   | 825.0 | 0.290 | Water + Seeds → Grain           |
| 19  | Sugarcane        | L3  | 3   | 660.0 | 0.727 | Water + Seeds → Sugarcane       |
| 20  | Cotton           | L3  | 3   | 264.0 | 0.204 | Water + Seeds → Cotton          |
| 21  | Vegetables       | L3  | 3   | 288.8 | 0.384 | Water + Seeds → Vegetables      |
| 22  | Glass            | L3  | 3   | 139.0 | 0.223 | Sand → Silicon → Glass          |
| 23  | Carbon Composite | L3  | 3   | 74.1  | 0.586 | CarbonFibers → CarbComp         |
| 24  | Sneakers         | L3  | 3   | 178.0 | 0.794 | Plastic → Sneakers              |
| 25  | Silicon          | L2  | 2   | 166.8 | 0.223 | Sand → Silicon                  |

### 预算内候选（≤12 节点，含需外购节点）

按深度排序，括号内为需要外购的原因：


| #   | 产品               | 层级  | 节点  | 最低利用率 | 需外购                |
| --- | ---------------- | --- | --- | ----- | ------------------ |
| 1   | Bread            | L8  | 11  | 0.040 | Eggs、Milk          |
| 2   | Sauce            | L7  | 8   | 0.030 | Vegetables、Butter  |
| 3   | Handbags         | L7  | 8   | 0.100 | Cows               |
| 4   | Salad            | L7  | 9   | 0.030 | Veg Oil、Milk       |
| 5   | Dough            | L7  | 10  | 0.040 | Eggs、Milk          |
| 6   | Gloves           | L7  | 10  | 0.100 | Cows               |
| 7   | Stiletto Heel    | L7  | 10  | 0.090 | Plastic、Cows       |
| 8   | Transport        | L6  | 7   | 0.133 | Diesel             |
| 9   | Leather          | L6  | 7   | 0.100 | Cows               |
| 10  | Butter           | L6  | 7   | 0.060 | Milk               |
| 11  | Steak            | L6  | 7   | 0.090 | Cows               |
| 12  | Sausages         | L6  | 7   | 0.061 | Pigs               |
| 13  | Cheese           | L6  | 7   | 0.048 | Milk               |
| 14  | Chocolate        | L6  | 10  | 0.014 | Cocoa、Milk、Sugar 等 |
| 15  | Attitude Control | L6  | 11  | 0.127 | Water              |
| 16  | Flight Computer  | L6  | 12  | 0.004 | Golden Bars、Water  |
| 17  | Quadcopter       | L6  | 12  | 0.072 | Plastic、Water      |
| 18  | Steel Beams      | L5  | 6   | 0.090 | Chemicals、Water    |
| 19  | Orange Juice     | L5  | 6   | 0.067 | Sugarcane（直接买更便宜）  |
| 20  | Ginger Beer      | L5  | 6   | 0.067 | Sugarcane          |
| 21  | Pasta            | L5  | 6   | 0.122 | Eggs               |
| 22  | Samosa           | L5  | 7   | 0.052 | Veg Oil、Flour      |


> **关键发现**：预算内（≤12 节点）中，能做到全树合格（无需外购）的深层链仅有 Diesel/Petrol（L5）。所有 L7/L8 产品都有至少 1 个必须外购的节点（通常是 Eggs 或 Milk）。
