> 属于 奢侈品类 分析文件，主索引见 product_analysis.md

# SimCompanies 奢侈品类产品分析

奢侈品类产品包括高端服装、珠宝、手表、豪华汽车等。这类产品通常以 Leather、Fabric、Golden Bars 为核心原料，产量较高但利用率参差不齐。代表性产品如 Handbags（手提包）、Luxury Watch（奢华手表）等。


## Handbags（手提包）`id:64`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Handbags L7） |
| 完整依赖树节点数 | 9（含 Power） |
| 推荐自产节点数 | 2 |
| 推荐外购节点数 | 6（肉牛、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 69.64/hr |

### 生产配方

```
Handbags <- Leatherx1.5
Leather <- Cowsx0.125
```

### 层级结构

```
L0  Power
L6  Leather
L7  Handbags
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Leather（皮革） | 31.0 | 3.375 | ✓ 自产 |

### 结论

- **自产**（2 节点）：Handbags、Leather
- **外购**（6 项）：Cows、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：Leather（3.375）

---

## Gloves（手套）`id:61`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Gloves L7） |
| 完整依赖树节点数 | 11（含 Power） |
| 推荐自产节点数 | 6 |
| 推荐外购节点数 | 4（肉牛、饲料、蔬菜、谷物） |
| 全服务器产量 | 147.02/hr |

### 生产配方

```
Gloves <- Fabricx0.5 + Leatherx0.5
Fabric <- Cottonx2 + Powerx1
Leather <- Cowsx0.125
Cotton <- Waterx1 + Seedsx1
Water <- Powerx0.2
Seeds <- Waterx0.1
```

### 层级结构

```
L0  Power
L1  Water
L2  Seeds
L3  Cotton
L4  Fabric
L6  Leather
L7  Gloves
```

### 利用率分析（迭代收敛，共 4 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Water（水） | 1738.2 | 0.204 | ✓ 自产 |
| Seeds（种子） | 907.5 | 0.291 | ✓ 自产 |
| Fabric（布料） | 247.6 | 0.297 | ✓ 自产 |
| Cotton（棉花） | 264.0 | 1.876 | ✓ 自产 |
| Leather（皮革） | 31.0 | 2.375 | ✓ 自产 |

### 结论

- **自产**（6 节点）：Gloves、Fabric、Leather、Cotton、Water、Seeds
- **外购**（4 项）：Cows、Fodder、Vegetables、Grain
- 链底最低利用率：Water（0.204）

---

## Stiletto Heel（细跟高跟鞋）`id:63`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Stiletto Heel L7） |
| 完整依赖树节点数 | 11（含 Power） |
| 推荐自产节点数 | 2 |
| 推荐外购节点数 | 8（塑料、肉牛、原油、水、饲料等） |
| 全服务器产量 | 100.59/hr |

### 生产配方

```
Stiletto Heel <- Leatherx1 + Plasticx0.2
Leather <- Cowsx0.125
```

### 层级结构

```
L0  Power
L6  Leather
L7  Stiletto Heel
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Leather（皮革） | 31.0 | 3.250 | ✓ 自产 |

### 结论

- **自产**（2 节点）：Stiletto Heel、Leather
- **外购**（8 项）：Plastic、Cows、Crude Oil、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：Leather（3.250）

---

## Luxury Interior（豪华内饰）`id:49`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L7（Power L0 → Luxury Interior L7） |
| 完整依赖树节点数 | 16（含 Power） |
| 推荐自产节点数 | 9 |
| 推荐外购节点数 | 6（肉牛、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 21.73/hr |

### 生产配方

```
Luxury Interior <- Displaysx6 + Aluminiumx2 + Leatherx5
Displays <- Siliconx5 + Chemicalsx4
Aluminium <- Powerx15 + Bauxitex1
Leather <- Cowsx0.125
Silicon <- Powerx3 + Sandx2
Chemicals <- Powerx0.2 + Mineralsx1
Bauxite <- Powerx14 + Waterx0.5
Sand <- Powerx2
Minerals <- Powerx20 + Waterx1
```

### 层级结构

```
L0  Power
L1  Sand
L2  Silicon  Bauxite  Minerals
L3  Aluminium  Chemicals
L4  Displays
L6  Leather
L7  Luxury Interior
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Sand（沙） | 1496.9 | 0.223 | ✓ 自产 |
| Aluminium（铝） | 129.7 | 0.335 | ✓ 自产 |
| Chemicals（化学品） | 231.7 | 0.597 | ✓ 自产 |
| Silicon（硅） | 166.8 | 1.037 | ✓ 自产 |
| Bauxite（铝土矿） | 101.8 | 1.275 | ✓ 自产 |
| Minerals（矿物质） | 125.7 | 1.842 | ✓ 自产 |
| Leather（皮革） | 31.0 | 3.510 | ✓ 自产 |
| Displays（显示屏） | 34.6 | 3.770 | ✓ 自产 |

### 结论

- **自产**（9 节点）：Luxury Interior、Displays、Aluminium、Leather、Silicon、Chemicals、Bauxite、Sand、Minerals
- **外购**（6 项）：Cows、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：Sand（0.223）

---

## Leather（皮革）`id:46`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L6（Power L0 → Leather L6） |
| 完整依赖树节点数 | 8（含 Power） |
| 推荐自产节点数 | 1 |
| 推荐外购节点数 | 6（肉牛、水、饲料、蔬菜、谷物等） |
| 全服务器产量 | 30.95/hr |

### 生产配方

```
Leather <- Cowsx0.125
```

### 层级结构

```
L0  Power
L6  Leather
```

### 利用率分析（迭代收敛，共 5 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |

### 结论

- **自产**（1 节点）：Leather
- **外购**（6 项）：Cows、Water、Fodder、Vegetables、Grain、Seeds
- 链底最低利用率：（单节点）

---

## Necklace（项链）`id:71`

**分析日期**：2026-03-16

### 基本参数

| 指标 | 值 |
| --- | --- |
| 层级深度 | L4（Power L0 → Necklace L4） |
| 完整依赖树节点数 | 5（含 Power） |
| 推荐自产节点数 | 3 |
| 推荐外购节点数 | 1（水） |
| 全服务器产量 | 42.56/hr |

### 生产配方

```
Necklace <- Golden Barsx0.25
Golden Bars <- Powerx40 + Gold Orex200
Gold Ore <- Powerx80 + Waterx2
```

### 层级结构

```
L0  Power
L2  Gold Ore
L3  Golden Bars
L4  Necklace
```

### 利用率分析（迭代收敛，共 2 轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。

**最终稳定状态**（自产节点，按利用率排序）：

| 节点 | 产量/hr | 利用率 | 决策 |
| --- | --- | --- | --- |
| Golden Bars（金条） | 32.4 | 0.328 | ✓ 自产 |
| Gold Ore（金矿） | 59.9 | 108.333 | ✓ 自产 |

### 结论

- **自产**（3 节点）：Necklace、Golden Bars、Gold Ore
- **外购**（1 项）：Water
- 链底最低利用率：Golden Bars（0.328）

---


## 综合比较（奢侈品类）

> 迭代收敛方法，2026-03-16

| 产品             | 层级  | 节点数 | 自产数 | 全服产量/hr | 最低自产利用率       | 评分  | 特点                        |
| -------------- | --- | --- | --- | ------- | ------------- | --- | ------------------------- |
| Luxury Interior| L7  | 16  | 9   | 21.7    | 0.223(Sand)   | 3.9 | 9节点自产，电子+铝+皮革链，外购Cows系列   |
| Gloves         | L7  | 11  | 6   | 147.0   | 0.204(Water)  | 3.8 | 6节点自产，全链几乎合格，Fabric+Leather |
| Necklace       | L4  | 5   | 3   | 42.6    | 0.328(GoldBars)| 2.4| 简单金条链，受金矿产量制约             |
| Handbags       | L7  | 9   | 2   | 69.6    | 3.375(Leather)| 1.6 | 仅自产Handbags+Leather，外购Cows系列 |
| Salad          | L7  | 10  | 2   | 2.4     | 0.798(Cheese) | 1.4 | 仅自产Salad+Cheese（见food文件）   |
| Stiletto Heel  | L7  | 11  | 2   | 100.6   | 3.250(Leather)| 1.3 | 仅自产Stiletto+Leather，外购Plastic |
| Leather        | L6  | 8   | 1   | 31.0    | —（仅终端）        | 0.8 | 终端产品，Cows系列全外购             |
