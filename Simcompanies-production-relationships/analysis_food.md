> 属于 食品类 分析文件，主索引见 product_analysis.md

# SimCompanies 食品类产品分析

食品类产品涵盖所有以农业资源为主要原料的食品加工链。这类产品通常具有较深的生产层级（L7-L9），但由于全服务器 Eggs、Milk 等农业产品产量极高，利用率普遍偏低，需大量外购中间农业品。

核心共享链路：`Power → Water → Seeds → Grain → Flour → Dough`，所有面包系产品均复用此链。

---

## Bread（面包）`id:121`

**分析日期**：2026-03-12

### 基本参数


| 指标        | 值                                   |
| --------- | ----------------------------------- |
| 层级深度      | L8（Power L0 → Bread L8）             |
| 完整依赖树节点数  | 12（含 Power）                         |
| 自产节点数（推荐） | 7                                   |
| 外购节点数（推荐） | 4（Eggs、Milk、Fodder、Vegetables）      |


### 生产配方

```
Bread ← Dough×1
Dough ← Flour×2 + Eggs×1 + Butter×0.5
Butter ← Milk×0.5
Milk ← Water×2 + Fodder×0.5
Flour ← Grain×15
Fodder ← Vegetables×0.5 + Grain×10
Vegetables ← Water×2 + Seeds×5
Grain ← Water×0.5 + Seeds×1
Seeds ← Water×0.1
Water ← Power×0.2
```

### 层级结构

```
L0  Power
L1  Water
L2  Seeds
L3  Grain  Vegetables
L4  Flour  Eggs  Fodder
L5  Milk
L6  Butter
L7  Dough
L8  Bread
```

### 利用率分析（迭代收敛，共4轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。
> 第1轮剔除：Eggs(0.040)、Milk(0.060)
> 第2轮剔除：Fodder(0.000)——Milk外购后Fodder失去唯一消费者
> 第3轮剔除：Vegetables(0.000)——Fodder外购后Vegetables失去唯一消费者
> 第4轮收敛

**最终稳定状态**：

| 节点         | 产量/hr  | 利用率   | 决策        | 消耗来源          |
| ---------- | ------ | ----- | --------- | ------------- |
| Eggs       | 325.0  | 0.040 | ⚠️ **外购** | Dough         |
| Milk       | 123.8  | 0.060 | ⚠️ **外购** | Butter        |
| Fodder     | 306.3  | 0.000 | ⚠️ **外购** | （Milk外购级联剔除）  |
| Vegetables | 288.8  | 0.000 | ⚠️ **外购** | （Fodder外购级联剔除）|
| Flour      | 93.9   | 0.278 | ✓ 自产      | Dough         |
| Water      | 1738.2 | 0.290 | ✓ 自产      | Seeds+Grain   |
| Butter     | 14.8   | 0.440 | ✓ 自产      | Dough         |
| Seeds      | 907.5  | 0.909 | ✓ 自产      | Grain         |
| Dough      | 13.0   | 1.000 | ✓ 自产      | Bread         |
| Grain      | 825.0  | 1.707 | ✓ 自产      | Flour         |


> **关键级联效应**：Milk外购 → Fodder失去消费者(util=0) → Fodder外购 → Vegetables失去消费者(util=0) → Vegetables也外购。
> 旧分析将Fodder(0.202边缘)和Vegetables(0.530)列为自产，但迭代后均应外购。

### 推荐裁剪策略

**迭代收敛结果（推荐，8 栋建筑）**：

```
自产（7节点）：Power + Water + Seeds + Grain + Flour + Butter（买Milk）+ Dough + Bread
外购（4项）：Eggs（0.040）、Milk（0.060）、Fodder（级联）、Vegetables（级联）
```

- Grain 只需供 Flour，利用率 1.707（良好）
- Butter 用买来的 Milk 加工，利用率 0.440
- Dough 精确匹配，利用率 1.000
- 整个 Fodder/Vegetables/Milk/Cows 子链全部省去

### 链条特点

- **最大亮点**：L8 深度，是食品类链条中深度最高的之一
- **核心主干**（Grain → Flour → Dough → Bread）流量完美匹配，Dough 利用率精确 1.000
- **Grain 是最大瓶颈**：三路消耗（Flour、Eggs、Fodder），需要优先升级 Grain 建筑
- **Eggs 和 Milk** 自产性价比极差（全服务器产量远超需求），坚决外购
- Water 在完整链中利用率高达 0.839（多路汇聚），若选方案 A/B，Water 利用率会大幅下降，建议也考虑外购

---

## Hamburger（汉堡）`id:129`

**分析日期**：2026-03-12

### 基本参数


| 指标       | 值                                        |
| -------- | ---------------------------------------- |
| 层级深度     | L9（全游戏食品类最深）                             |
| 完整依赖树节点数 | 16（含 Power）                              |
| 推荐自产节点数  | 1（Hamburger 本身）                          |
| 外购节点数    | 14（所有原料均外购）                              |
| 全服务器产量   | 0.6/hr（极低，说明市场上此产品极其稀缺）                  |


### 生产配方

```
Hamburger ← Steak×4 + Vegetables×3 + Butter×1 + Bread×0.5 + Veg Oil×0.5
Bread ← Dough×1
Dough ← Flour×2 + Eggs×1 + Butter×0.5
Steak ← Cows×0.125
Butter ← Milk×0.5
Cows ← Water×16 + Fodder×12
Milk ← Water×2 + Fodder×0.5
Veg Oil ← Vegetables×10
Fodder ← Vegetables×0.5 + Grain×10
Flour ← Grain×15
Eggs ← Water×0.4 + Grain×0.5
Vegetables ← Water×2 + Seeds×5
Grain ← Water×0.5 + Seeds×1
Seeds ← Water×0.1
```

### 层级结构

```
L0  Power
L1  Water
L2  Seeds
L3  Grain     Vegetables
L4  Flour     Eggs      Fodder    Veg Oil
L5  Milk      Cows
L6  Butter    Steak
L7  Dough
L8  Bread
L9  Hamburger
```

### 利用率分析（迭代收敛，共6轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。
> 第1轮剔除：Steak(0.085)、Bread(0.023)、Veg Oil(0.007)、Cows(0.090)、Milk(0.060)、Eggs(0.040)
> 第2轮剔除：Dough(0.000)、Fodder(0.000)——Bread/Milk外购后失去消费者
> 第3轮剔除：Vegetables(0.006)、Butter(0.040)、Flour(0.000)
> 第4轮剔除：Grain(0.000)
> 第5轮剔除：Seeds(0.000)、Water(0.052)
> 第6轮收敛

**最终稳定状态**：

| 节点       | 利用率   | 决策        | 备注               |
| -------- | ----- | --------- | ---------------- |
| Steak    | 0.085 | ⚠️ **外购** | 直接原料，低利用率        |
| Bread    | 0.023 | ⚠️ **外购** | 直接原料，极低利用率       |
| Veg Oil  | 0.007 | ⚠️ **外购** | 直接原料，极低利用率       |
| Cows     | 0.090 | ⚠️ **外购** | 级联：Steak外购       |
| Milk     | 0.060 | ⚠️ **外购** | 原始低利用率           |
| Eggs     | 0.040 | ⚠️ **外购** | 原始低利用率           |
| Dough    | 0.000 | ⚠️ **外购** | 级联：Bread外购       |
| Fodder   | 0.000 | ⚠️ **外购** | 级联：Milk外购        |
| Vegetables| 0.006| ⚠️ **外购** | 级联：Fodder外购后极低   |
| Butter   | 0.040 | ⚠️ **外购** | 级联：Dough外购后极低    |
| Flour    | 0.000 | ⚠️ **外购** | 级联：Dough外购       |
| Grain    | 0.000 | ⚠️ **外购** | 级联：Flour/Fodder外购 |
| Seeds    | 0.000 | ⚠️ **外购** | 级联：Grain/Veg外购   |
| Water    | 0.052 | ⚠️ **外购** | 级联：最终也低于阈值       |

**外购（14项）**：所有原料，仅 Hamburger 本身自产。

### 推荐裁剪策略

**迭代收敛结论**：Hamburger 独立链条**不适合垂直整合**。

全服产量仅 0.6/hr，导致6轮迭代后所有14个原料节点均应外购，仅 Hamburger 本身自产。

```
自产（1）：Hamburger
外购（14）：Steak×4, Vegetables×3, Butter×1, Bread×0.5, Veg Oil×0.5
           以及所有间接原料（Dough, Flour, Grain, Seeds, Water, 等）
```

**如何生产 Hamburger（实际策略）**：

Hamburger 不应作为独立产业链目标，而应作为**Bread 链的自然延伸**：

- 已建 Bread 链（Power→Water→Seeds→Grain→Flour→Butter→Dough→Bread）的玩家
- 只需额外增加 Hamburger 一栋建筑
- Bread 的所有中间品直接复用，几乎零边际成本
- 仍需外购：Steak、Veg Oil（利用率过低）

> 关键区别：Hamburger 利用率低不是因为链条设计差，而是全服产量基数太低（0.6/hr）。
> 如果你是服务器上唯一的Hamburger生产者，定价权极大，高溢价可弥补低利用率。

### 链条特点

- **L9 全游戏最深食品链**，终端产品稀缺（0.6/hr），理论上售价极高
- **迭代收敛后：仅 Hamburger 自产，14 项全外购**——这是所有分析产品中垂直整合度最低的
- **不适合独立建链**：Steak/Cows/Veg Oil 利用率极低（<10%），是 Bread 链的自然上层延伸
- **正确玩法**：先建完整 Bread 链，再加一栋 Hamburger 建筑作为延伸，边际成本极低
- Grain 是核心瓶颈（Bread 链内 5.6x 超载），但Hamburger独立看时Grain也应外购

---

## Meat Balls（肉丸）`id:131`

**分析日期**：2026-03-12

### 基本参数


| 指标       | 值                             |
| -------- | ----------------------------- |
| 层级深度     | L9（与 Hamburger 并列食品最深）        |
| 完整依赖树节点数 | 17（含 Power）                   |
| 推荐自产节点数  | 2（Meat Balls + Sauce）         |
| 外购节点数    | 14（所有原料级联外购）                  |
| 全服务器产量   | 极低（约 1–2/hr）                  |


### 生产配方

```
Meat Balls ← Bread×X + Sauce×X + Sausages×X
Sauce ← Vegetables×X + Butter×X + Water×X      （L7 唯一特色节点）
Bread ← Dough×1
Dough ← Flour×2 + Eggs×1 + Butter×0.5
Butter ← Milk×0.5
Flour ← Grain×15
Vegetables ← Water×2 + Seeds×5
Grain ← Water×0.5 + Seeds×1
Seeds ← Water×0.1
Water ← Power×0.2
```

### 层级结构

```
L0  Power
L1  Water
L2  Seeds
L3  Grain      Vegetables
L4  Flour      Eggs       Fodder
L5  Milk       Cows
L6  Butter     Steak
L7  Dough      Sauce      ← Sauce 是本链唯一特色中间品
L8  Bread
L9  Meat Balls
```

> Sauce（酱汁）是 Meat Balls 链中唯一不出现在其他分析产品中的中间节点，由 Vegetables + Butter + Water 合成。

### 利用率分析（迭代收敛，共6轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。
> 第1轮剔除：Sausages(0.028)、Bread(0.091)、Veg Oil(0.015)、Pigs(0.061)、Eggs(0.040)、Milk(0.060)
> 第2轮剔除：Dough(0.000)、Fodder(0.000)
> 第3轮剔除：Vegetables(0.006)、Butter(0.030)、Flour(0.000)
> 第4轮剔除：Grain(0.000)
> 第5轮剔除：Seeds(0.000)、Water(0.052)
> 第6轮收敛

**最终稳定状态**：

| 节点       | 利用率   | 决策        | 备注                |
| -------- | ----- | --------- | ----------------- |
| Veg Oil  | 0.015 | ⚠️ **外购** | 原始低利用率            |
| Sausages | 0.028 | ⚠️ **外购** | 原始低利用率            |
| Eggs     | 0.040 | ⚠️ **外购** | 原始低利用率            |
| Milk     | 0.060 | ⚠️ **外购** | 原始低利用率            |
| Pigs     | 0.061 | ⚠️ **外购** | 级联：Sausages外购     |
| Bread    | 0.091 | ⚠️ **外购** | 原始低利用率            |
| Dough    | 0.000 | ⚠️ **外购** | 级联：Bread外购        |
| Fodder   | 0.000 | ⚠️ **外购** | 级联：Milk外购         |
| Vegetables|0.006 | ⚠️ **外购** | 级联：Fodder外购后极低    |
| Butter   | 0.030 | ⚠️ **外购** | 级联：Dough外购后极低     |
| Flour    | 0.000 | ⚠️ **外购** | 级联：Dough外购        |
| Grain    | 0.000 | ⚠️ **外购** | 级联：Flour/Fodder外购 |
| Seeds    | 0.000 | ⚠️ **外购** | 级联：Grain/Veg外购    |
| Water    | 0.052 | ⚠️ **外购** | 级联：最终也低于阈值        |
| Sauce    | 1.333 | ✓ **自产**  | 链内唯一合格节点          |

**自产（2项）**：Meat Balls + Sauce
**外购（14项）**：所有其他节点均外购

### 推荐裁剪策略

**迭代收敛结论（2 栋建筑）**：

```
自产（2）：Sauce + Meat Balls
外购（14）：Sausages、Bread（直接买）、Veg Oil、以及Sauce原料（Vegetables、Butter、Water）
```

- Sauce 是链条的核心竞争力（利用率 1.333），必须自产
- Bread 直接外购（作为Meat Balls的原料），不建 Bread 子链
- Sauce 的原料 Vegetables/Butter/Water 也外购

**如何生产 Meat Balls（实际策略）**：

与 Hamburger 类似，Meat Balls 不应作为独立链目标，而应作为 **Bread 链 + Sauce 建筑的延伸**：
- 已有 Bread 链 → 直接用自产的 Bread 作为原料
- 增加 Sauce 建筑（Vegetables + Butter 原料可从 Bread 链共享）
- 增加 Meat Balls 建筑

### 链条特点

- **Sauce 是唯一合格的自产节点**（利用率 1.333），是 Meat Balls 链的核心差异化竞争力
- **迭代收敛后：仅 Meat Balls+Sauce 自产，14 项全外购**
- **与 Bread 链的关系**：独立看 Meat Balls 时 Bread 链不值得建，但若已有 Bread 链，扩展 Meat Balls 的边际成本极低（仅需 +Sauce 一栋）
- **适合 Bread 链玩家扩展**：已建 Bread 链时，仅需 +Sauce 和 +Meat Balls 两栋即可产出

---

## Apple Pie（苹果派）`id:123`

**分析日期**：2026-03-12

### 基本参数


| 指标       | 值                                     |
| -------- | ------------------------------------- |
| 层级深度     | L8                                    |
| 完整依赖树节点数 | 15（含 Power）                           |
| 推荐自产节点数  | 8                                     |
| 外购节点数    | 6（Apples、Eggs、Sugarcane、Milk、Fodder、Vegetables）|
| 全服务器产量   | 极低                                    |


### 生产配方

```
Apple Pie ← Dough×X + Apples×X + Sugar×X + Butter×X
Sugar ← Sugarcane×X                               （外购 Sugarcane，自产 Sugar）
Dough ← Flour×2 + Eggs×1 + Butter×0.5
Butter ← Milk×0.5
Flour ← Grain×15
Grain ← Water×0.5 + Seeds×1
Seeds ← Water×0.1
Water ← Power×0.2
```

> Apples 和 Sugarcane 均为原料，直接市购；Milk 利用率 0.060，同样外购。

### 层级结构

```
L0  Power
L1  Water
L2  Seeds       Sugarcane（外购）    Apples（外购）
L3  Grain       Sugar
L4  Flour       Eggs（外购）
L5  Milk（外购）
L6  Butter
L7  Dough
L8  Apple Pie
```

> 完整链中存在 Fodder/Vegetables/Milk/Cows 子链，但 Milk 利用率 0.060 → 决定外购 Milk，整个 Fodder/Vegetables 子链随之省去。

### 利用率分析（迭代收敛，共4轮）

> 第1轮剔除：Apples(0.063)、Eggs(0.040)、Sugarcane(0.067)、Milk(0.060)
> 第2轮剔除：Fodder(0.000)——Milk外购后失去消费者
> 第3轮剔除：Vegetables(0.000)——Fodder外购后失去消费者
> 第4轮收敛

**最终稳定状态**：

| 节点        | 利用率   | 决策        | 备注               |
| --------- | ----- | --------- | ---------------- |
| Apples    | 0.063 | ⚠️ **外购** | 原始低利用率           |
| Eggs      | 0.040 | ⚠️ **外购** | 原始低利用率           |
| Sugarcane | 0.067 | ⚠️ **外购** | 原始低利用率（买Sugar原料） |
| Milk      | 0.060 | ⚠️ **外购** | 原始低利用率           |
| Fodder    | 0.000 | ⚠️ **外购** | 级联：Milk外购        |
| Vegetables| 0.000 | ⚠️ **外购** | 级联：Fodder外购      |
| Flour     | 0.278 | ✓ 自产      | 主干必要节点           |
| Water     | 0.290 | ✓ 自产      | Seeds+Grain      |
| Sugar     | 0.293 | ✓ 自产      | 买Sugarcane自产Sugar|
| Butter    | 0.440 | ✓ 自产      | 买Milk自产Butter    |
| Dough     | 0.500 | ✓ 自产      | Apple Pie核心      |
| Seeds     | 0.909 | ✓ 自产      | Grain消耗          |
| Grain     | 1.707 | ✓ 自产      | Flour唯一消耗        |


### 推荐裁剪策略

**迭代收敛结果（推荐，9 栋建筑）**：

```
自产（8节点）：Power + Water + Seeds + Grain + Flour + Sugar（买Sugarcane）+ Butter（买Milk）+ Dough + Apple Pie
外购（6项）：Apples(0.063)、Eggs(0.040)、Sugarcane(0.067)、Milk(0.060)、Fodder(级联)、Vegetables(级联)
```

- 外购 Sugarcane 后仍自产 Sugar（Sugarcane→Sugar 加工溢价合理）
- Butter 用买来的 Milk 加工，利用率 0.440
- 整个 Fodder/Vegetables/Cows 子链全部省去（Milk外购级联剔除）

### 链条特点

- **与 Bread 链的最大差异**：多了 Sugar（Sugarcane 加工）和 Apples，去掉了 Dough→Bread 路径
- Apples 和 Sugarcane 是两个"必买"的特殊原料，制约了链条的完整性
- **共享 Bread 链核心**：Grain→Flour→Butter→Dough 与 Bread 完全相同，适合 Bread 玩家侧线发展
- **比 Bread 少 1 栋**（9 vs 8，含 Bread 是 8+1=9），边际成本低

---

## Frozen Pizza（冻披萨）`id:127`

**分析日期**：2026-03-12

### 基本参数


| 指标       | 值                                         |
| -------- | ----------------------------------------- |
| 层级深度     | L8                                        |
| 完整依赖树节点数 | 15（含 Power）                               |
| 推荐自产节点数  | 8                                         |
| 外购节点数    | 6（Vegetables、Sausages、Eggs、Milk、Pigs、Fodder）|
| 全服务器产量   | 极低                                        |


### 生产配方

```
Frozen Pizza ← Dough×X + Cheese×X + Sausages×X + Vegetables×X + Sauce×X
Cheese ← Milk×X                                  （外购 Milk，自产 Cheese）
Dough ← Flour×2 + Eggs×1 + Butter×0.5
Butter ← Milk×0.5                                （外购 Milk 也供 Butter）
Flour ← Grain×15
Grain ← Water×0.5 + Seeds×1
Seeds ← Water×0.1
Water ← Power×0.2
```

### 层级结构

```
L0  Power
L1  Water
L2  Seeds       Milk（外购）         Sausages（外购）
L3  Grain       Vegetables（外购）
L4  Flour       Eggs（外购）         Cheese
L5  Milk（外购）
L6  Butter
L7  Dough
L8  Frozen Pizza
```

### 利用率分析（迭代收敛，共4轮）

> 第1轮剔除：Eggs(0.040)、Pigs(0.061)、Milk(0.108)、Sausages(0.118)
> 第2轮剔除：Fodder(0.000)——Milk外购后失去消费者
> 第3轮剔除：Vegetables(0.068)——Fodder外购后利用率骤降至不合格
> 第4轮收敛

**最终稳定状态**：

| 节点        | 利用率   | 决策        | 备注               |
| --------- | ----- | --------- | ---------------- |
| Eggs      | 0.040 | ⚠️ **外购** | 原始低利用率           |
| Pigs      | 0.061 | ⚠️ **外购** | 原始低利用率           |
| Milk      | 0.108 | ⚠️ **外购** | 原始低利用率           |
| Sausages  | 0.118 | ⚠️ **外购** | 原始低利用率           |
| Fodder    | 0.000 | ⚠️ **外购** | 级联：Milk外购        |
| Vegetables| 0.068 | ⚠️ **外购** | 级联：Fodder外购后骤降   |
| Flour     | 0.278 | ✓ 自产      | 主干               |
| Water     | 0.290 | ✓ 自产      |                  |
| Butter    | 0.440 | ✓ 自产      | 买Milk自产Butter    |
| Seeds     | 0.909 | ✓ 自产      |                  |
| Dough     | 1.516 | ✓ 自产      | 高利用率，Pizza核心     |
| Cheese    | 1.667 | ✓ 自产      | 买Milk自产Cheese    |
| Grain     | 1.707 | ✓ 自产      |                  |

### 推荐裁剪策略

**迭代收敛结果（推荐，9 栋建筑）**：

```
自产（8节点）：Power + Water + Seeds + Grain + Flour + Butter（买Milk）+ Cheese（买Milk）+ Dough + Frozen Pizza
外购（6项）：Vegetables(0.068)、Sausages(0.118)、Eggs(0.040)、Milk(0.108)、Pigs(级联)、Fodder(级联)
```

- 买 Milk 后同时供 Butter(0.440) 和 Cheese(1.667) 两路，高效共享采购
- Vegetables/Sausages/Pigs/Fodder 全部外购（迭代后均不合格）
- Dough(1.516) + Cheese(1.667) 主链极度高效

### 链条特点

- **Cheese 是本链核心竞争力**：利用率 1.667，是整个披萨链中效率最高的自产节点
- **Dough 超载**（1.516）：Frozen Pizza 对 Dough 的消耗高于 Bread/Hamburger，意味着 Dough 建筑等级需达到 Flour 建筑的 1.5 倍
- **Milk 一购双用**：买来的 Milk 同时供给 Butter 和 Cheese 两栋建筑，资金利用效率高
- **Vegetables 强制外购**：这是与 Hamburger 链的关键差异——在 Pizza 链中，Vegetables 只为 Pizza 直接使用（无 Fodder 路径），导致利用率太低
- **与 Bread 链共享**：Grain→Flour→Butter→Dough 核心路径完全相同，适合作为 Bread 链延伸

---

## 综合比较（食品类）


| 产品           | 层级  | 节点数 | 自产数 | 最低自产利用率      | 评分    | 特点                          |
| ------------ | --- | --- | --- | ------------ | ----- | --------------------------- |
| Bread        | L8  | 11  | 7   | 0.278(Flour) | **5.1** | 极深，主干完美，食品稀缺              |
| Apple Pie    | L8  | 14  | 8   | 0.278(Flour) | **4.6** | 需外购Apples/Sugarcane，共享Bread链 |
| Frozen Pizza | L8  | 14  | 8   | 0.278(Flour) | **4.6** | Cheese 1.667，Milk一购双用     |
| Lasagna      | L8  | 16  | 2   | 2.000(Sauce) | 1.0   | 推荐1+2联合建设；Q0-Q1均利387/hr，Q6+ ≈984/hr |
| Dough        | L7  | 11  | 6   | 0.278(Flour) | 3.8   | Bread链核心子链，单独建链意义不大       |
| Salad        | L7  | 10  | 2   | 0.798(Cheese)| 1.4   | 仅自产Salad+Cheese，外购蔬菜/牛奶   |
| Sauce        | L7  | 9   | 1   | —（仅终端）       | 0.8   | 终端产品，所有原料外购               |
| Meat Balls   | L9  | 16  | 2   | 1.333(Sauce) | 1.1   | Sauce为唯一特色节点，Bread链延伸时有价值 |
| Hamburger    | L9  | 15  | 1   | —（仅终端）       | 0.6   | 迭代后仅自产Hamburger，Bread链延伸时 |
| Butter/Steak/Sausages/Cheese | L6 | 8 | 1 | —（仅终端） | 0.8 | 单节点终端，所有农业原料外购           |
| Chocolate    | L6  | 11  | 1   | —（仅终端）       | 0.5   | 可可/牛奶/糖全外购，仅建Chocolate厂  |
| Cocktails    | L6  | 14  | 1   | —（仅终端）       | 0.4   | 12项原料全外购，仅建Cocktails厂     |


### 食品链对比（Bread 系列）


| 产品           | 与 Bread 的差异                   | 迭代后额外外购                            | 额外建筑   | 是否推荐       |
| ------------ | ----------------------------- | ---------------------------------- | ------ | ---------- |
| Bread        | —                             | Eggs、Milk、Fodder、Vegetables        | 基准 8 栋 | ✓ 首选       |
| Hamburger    | +Vegetables；用Steak、VegOil     | Steak、VegOil（+所有原料，独立建链不合算）         | +1 栋   | ✓ Bread延伸  |
| Meat Balls   | +Sauce                        | Sausages、VegOil、Bread（独立建链仅2节点自产）  | +1 栋   | ✓ Bread延伸  |
| Apple Pie    | +Sugar；用Apples、Sugarcane      | Apples、Sugarcane、Fodder、Vegetables | +1 栋   | ✓ 侧线       |
| Frozen Pizza | +Cheese；买Vegetables、Sausages  | Vegetables、Sausages、Pigs、Fodder   | +1 栋   | ✓ 侧线       |
| Lasagna      | 完全不同链（牛排/奶酪/意面）；Sauce 利用率 2.000 | Steak、Cheese、Pasta 等 13 项全外购 | +3 栋（1Las+2Sauce）| ✓ 独立链，Q6+ PPLH≈984/hr |

---

## 新增食品类产品

## Lasagna（千层面）`id:130`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L8（Power L0 → Lasagna L8） |
| 完整依赖树节点数 | 16（含 Power） |
| 推荐自产节点数 | 2 |
| 推荐外购节点数 | 13（牛排、奶酪、意面、肉牛、牛奶等） |
| 全服务器产量 | 1.77/hr |

### 生产配方

```
Lasagna <- Steakx1 + Cheesex0.5 + Pastax1 + Saucex1
Sauce <- Vegetablesx2 + Butterx0.5 + Waterx0.5
```

### 层级结构

```
L0  Power
L7  Sauce
L8  Lasagna
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sauce（酱料） | 0.9 | 2.000 | ✓ 自产 |

### 结论

- **自产**（2 节点）：Lasagna、Sauce
- **外购**（13 项）：Steak、Cheese、Pasta、Cows、Milk、Flour、Eggs、Vegetables、Butter、Water、Fodder、Grain、Seeds
- 链底最低利用率：Sauce（2.000）

---

## Sauce（酱料）`id:138`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Sauce L7） |
| 完整依赖树节点数 | 9（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 7（蔬菜、黄油、水、种子、牛奶等） |
| 全服务器产量 | 0.89/hr |

### 生产配方

```
Sauce <- Vegetablesx2 + Butterx0.5 + Waterx0.5
```

### 层级结构

```
L0  Power
L7  Sauce
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Sauce
- **外购**（7 项）：Vegetables、Butter、Water、Seeds、Milk、Fodder、Grain
- 链底最低利用率：（单节点）

---

## Salad（沙拉）`id:142`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Salad L7） |
| 完整依赖树节点数 | 10（含 Power） |
| 推荐自产节点数 | 2 |
| 推荐外购节点数 | 7（蔬菜、植物油、水、种子、牛奶等） |
| 全服务器产量 | 2.37/hr |

### 生产配方

```
Salad <- Vegetablesx5 + Veg Oilx0.5 + Cheesex2
Cheese <- Milkx1
```

### 层级结构

```
L0  Power
L6  Cheese
L7  Salad
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Cheese（奶酪） | 5.9 | 0.798 | ✓ 自产 |

### 结论

- **自产**（2 节点）：Salad、Cheese
- **外购**（7 项）：Vegetables、Veg Oil、Water、Seeds、Milk、Fodder、Grain
- 链底最低利用率：Cheese（0.798）

---

## Dough（面团）`id:137`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Dough L7） |
| 完整依赖树节点数 | 11（含 Power） |
| 推荐自产节点数 | 6 |
| 推荐外购节点数 | 4（鸡蛋、牛奶、饲料、蔬菜） |
| 全服务器产量 | 13.04/hr |

### 生产配方

```
Dough <- Flourx2 + Eggsx1 + Butterx0.5
Flour <- Grainx15
Butter <- Milkx0.5
Grain <- Waterx0.5 + Seedsx1
Water <- Powerx0.2
Seeds <- Waterx0.1
```

### 层级结构

```
L0  Power
L1  Water
L2  Seeds
L3  Grain
L4  Flour
L6  Butter
L7  Dough
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Flour（面粉） | 93.9 | 0.278 | ✓ 自产 |
| Water（水） | 1738.2 | 0.290 | ✓ 自产 |
| Butter（黄油） | 14.8 | 0.440 | ✓ 自产 |
| Seeds（种子） | 907.5 | 0.909 | ✓ 自产 |
| Grain（谷物） | 825.0 | 1.707 | ✓ 自产 |

### 结论

- **自产**（6 节点）：Dough、Flour、Butter、Grain、Water、Seeds
- **外购**（4 项）：Eggs、Milk、Fodder、Vegetables
- 链底最低利用率：Flour（0.278）

---

## Butter（黄油）`id:134`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Butter L6） |
| 完整依赖树节点数 | 8（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 6（牛奶、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 14.82/hr |

### 生产配方

```
Butter <- Milkx0.5
```

### 层级结构

```
L0  Power
L6  Butter
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Butter
- **外购**（6 项）：Milk、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：（单节点）

---

## Steak（牛排）`id:7`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Steak L6） |
| 完整依赖树节点数 | 8（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 6（肉牛、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 27.80/hr |

### 生产配方

```
Steak <- Cowsx0.125
```

### 层级结构

```
L0  Power
L6  Steak
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Steak
- **外购**（6 项）：Cows、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：（单节点）

---

## Sausages（香肠）`id:8`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Sausages L6） |
| 完整依赖树节点数 | 8（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 6（猪、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 83.40/hr |

### 生产配方

```
Sausages <- Pigsx0.0625
```

### 层级结构

```
L0  Power
L6  Sausages
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Sausages
- **外购**（6 项）：Pigs、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：（单节点）

---

## Cheese（奶酪）`id:122`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Cheese L6） |
| 完整依赖树节点数 | 8（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 6（牛奶、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 5.93/hr |

### 生产配方

```
Cheese <- Milkx1
```

### 层级结构

```
L0  Power
L6  Cheese
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Cheese
- **外购**（6 项）：Milk、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：（单节点）

---

## Chocolate（巧克力）`id:140`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Chocolate L6） |
| 完整依赖树节点数 | 11（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 9（可可、牛奶、糖、水、种子等） |
| 全服务器产量 | 3.46/hr |

### 生产配方

```
Chocolate <- Cocoax10 + Milkx0.5 + Sugarx1
```

### 层级结构

```
L0  Power
L6  Chocolate
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Chocolate
- **外购**（9 项）：Cocoa、Milk、Sugar、Water、Seeds、Fodder、Sugarcane、Vegetables、Grain
- 链底最低利用率：（单节点）

---

## Cocktails（鸡尾酒）`id:132`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Cocktails L6） |
| 完整依赖树节点数 | 14（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 12（橙汁、苹果酒、姜汁啤酒、咖啡粉、橙子等） |
| 全服务器产量 | 0.59/hr |

### 生产配方

```
Cocktails <- Orange Juicex1 + Apple Ciderx1 + Ginger Beerx2 + Coffee Powderx8
```

### 层级结构

```
L0  Power
L6  Cocktails
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Cocktails
- **外购**（12 项）：Orange Juice、Apple Cider、Ginger Beer、Coffee Powder、Oranges、Sugar、Apples、Water、Vegetables、Coffee Beans、Seeds、Sugarcane
- 链底最低利用率：（单节点）

---

## 千层面 × 酱汁 联合生产深度分析 `Lasagna id:130 + Sauce id:138`

**分析日期**：2026-04-13

### 背景与推荐策略

千层面是 L8 深链食品，每件产品需消耗 **1 份酱汁（Sauce）**。由于酱汁全服务器产量仅 0.89/hr，市场供应极为有限，Q4+ 酱汁市场几乎无货。有经验的玩家建议：**同时建设千层面 + 酱汁工厂**，以保证酱汁供应并最大化利润。

### 联合生产配方

```
Lasagna ← Steak×1 + Cheese×0.5 + Pasta×1 + Sauce×1    （仅 Sauce 自产，其余全外购）
Sauce   ← Vegetables×2 + Butter×0.5 + Water×0.5        （原材料全外购）
```

**建筑配比**：1 栋千层面 + 2 栋酱汁（供需平衡）
- 千层面产量：1.77/hr，对酱汁需求 1.77/hr
- 单栋酱汁产量：0.887/hr × 2 栋 = 1.774/hr ≈ 恰好满足

### VI 迭代收敛结论

千层面链 5 轮迭代后仅剩 **2 节点自产**：

| 节点 | 利用率 | 决策 |
| --- | --- | --- |
| Sauce（酱汁） | 2.000 | ✓ 自产 |

- **自产**（2 节点）：Lasagna、Sauce
- **外购**（13 项）：Steak、Cheese、Pasta、Cows、Milk、Flour、Eggs、Vegetables、Butter、Water、Fodder、Grain、Seeds

酱汁链独立迭代后同样所有中间节点均外购，仅剩 Sauce 本身自产。

---

### PPLH 分析（品质 Q0–Q10）

> 数据来源：SimCoTools API VWAP，计算日期 2026-04-13
> PPLH 公式：`产量/hr × VWAP_Q × 0.96 − 工资 − 原材料成本/hr`

#### 方案 A：千层面独立运营（酱汁外购）

| 品质 | PPLH（/栋千层面） | 说明 |
| --- | --- | --- |
| Q0 | **-53/hr** | 亏损 |
| Q1 | **-98/hr** | 亏损（酱汁市价偏高） |
| Q2 | **742/hr** | 盈利 |
| Q3 | **722/hr** | 盈利 |
| Q4 | **639/hr** | 盈利，但酱汁 Q4 市场极稀缺 |
| Q5 | **831/hr** | 盈利，但酱汁 Q5 几乎无市场供应 |
| Q6+ | — | 市场无高品质酱汁，方案不可行 |

> ⚠ Q0–Q1 **亏损**：酱汁价格相对千层面售价过高。Q4+ 酱汁市场极稀缺，此方案实际难以为继。

#### 方案 B：1 栋千层面 + 2 栋酱汁联合生产（推荐）

| 品质 | PPLH（每栋均值，3 栋合计÷3） | 说明 |
| --- | --- | --- |
| Q0 | **387/hr** | 低质量起步可行 |
| Q1 | **390/hr** | 与 Q0 接近 |
| Q2 | **675/hr** | 品质提升显著 |
| Q3 | **700/hr** | 稳定提升 |
| Q4 | **712/hr** | |
| Q5 | **785/hr** | |
| Q6 | **988/hr** | ⚠ Pasta Q6 VWAP=89 异常（Q5=152），此值存疑 |
| Q7 | **984/hr** | |
| Q8 | **1,035/hr** | ※ Steak/Pasta 含估算价格 |
| Q9 | — | 无可用数据 |
| Q10 | **973/hr** | ※ 含估算价格 |

#### 酱汁独立建设参考 PPLH（/栋 Sauce）

| 品质 | PPLH |
| --- | --- |
| Q0 | **556/hr** |
| Q2 | **588/hr** |
| Q3 | **634/hr** |
| Q4 | **691/hr** |
| Q5 | **704/hr** |

---

### 策略建议

1. **Q0–Q1 起步**：联合生产是唯一可行方案（千层面独立运营亏损）。1+2 组合可获 387–390/hr 均利，可接受。
2. **Q2–Q5 成长期**：理论上外购酱汁每千层面栋 PPLH 略高（742–831 vs 675–785），但酱汁 Q4+ 市场几乎无货——**推荐联合生产**，稳定性远高于依赖市场。
3. **Q6+ 高品质阶段**：市场无高品质酱汁，**只能联合生产**。PPLH 达 984–1,035/hr，竞争力强。
4. **与 Bread 链对比**：联合策略下 Q5+ 可超 785/hr，优于纯 Bread 链，适合已有 Bread 链后的扩展侧线。

### 数据质量说明

- **Pasta Q6 VWAP = 89**（对比 Q5=152 明显偏低），疑为市场低价期或特殊订单影响，Q6 利润数据需谨慎使用，参考 Q5/Q7 趋势。
- **Q8–Q10 Steak/Pasta** 价格为 SimCoTools 估算值，实际市价可能有较大偏差。
- 所有 VWAP 均为 2026-04-13 实时快照，市场价格持续变动，建议定期重算。

---
