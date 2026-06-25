> 属于 电子与机器人类 分析文件，主索引见 product_analysis.md

# SimCompanies 电子与机器人类产品分析

电子类产品以 Silicon、Chemicals、Processors、Electronic Comps 为核心中间节点，处于 L6-L7 深度。这类产品的核心共享链路为 `Sand → Silicon → (Chemicals → ...) → Processors/EC`，多个产品可共享同一批中间节点建筑。

---

## Quadcopter（四旋翼无人机）`id:98`

**分析日期**：2026-03-12

### 基本参数


| 指标       | 值                            |
| -------- | ---------------------------- |
| 层级深度     | L6（Power L0 → Quadcopter L6） |
| 完整依赖树节点数 | 12（含 Power）                  |
| 自产节点数    | 9                            |
| 外购节点数    | 3（Plastic、Crude Oil、Water）   |


### 生产配方

```
Quadcopter ← On-board Computer×1 + Batteries×1 + Electronic Comps×3 + Plastic×2
On-board Computer ← Processors×2 + Electronic Comps×3
Batteries ← Chemicals×4
Electronic Comps ← Silicon×3 + Chemicals×1
Processors ← Silicon×4 + Chemicals×1
Chemicals ← Minerals×1
Silicon ← Sand×2
Minerals ← Water×1
Sand ← (原料)
Water ← (原料)
Plastic ← Crude Oil×0.2
```

### 层级结构

```
L0  Power
L1  Minerals   Sand
L2  Chemicals  Silicon
L3  Batteries  Electronic Comps  Processors
L4  On-board Computer
L5  Quadcopter
（L1 also: Water → Minerals; 外购: Plastic via Crude Oil L2）
```

### 利用率分析（迭代收敛，共3轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。
> 第1轮剔除：Water(0.072)、Plastic(0.128)
> 第2轮剔除：Crude Oil(0.000)——Plastic外购后Crude Oil失去唯一消费者，级联剔除
> 第3轮收敛

**最终稳定状态**：

| 节点                | 产量/hr  | 利用率   | 决策        | 消耗来源                    |
| ----------------- | ------ | ----- | --------- | ----------------------- |
| Water             | 1738.2 | 0.072 | ⚠️ **外购** | Minerals                |
| Plastic           | 224.2  | 0.128 | ⚠️ **外购** | Quadcopter              |
| Crude Oil         | 45.9   | 0.000 | ⚠️ **外购** | （Plastic外购后级联剔除）        |
| Sand              | 1496.9 | 0.223 | ✓ 自产      | Silicon                 |
| Batteries         | 27.2   | 0.527 | ✓ 自产      | Quadcopter              |
| Chemicals         | 231.7  | 0.704 | ✓ 自产      | Batteries+EC+Processors |
| On-board Computer | 14.8   | 0.966 | ✓ 自产      | Quadcopter              |
| Silicon           | 166.8  | 1.037 | ✓ 自产      | EC+Processors           |
| Minerals          | 125.7  | 1.842 | ✓ 自产      | Chemicals               |
| Electronic Comps  | 44.5   | 1.966 | ✓ 自产      | Quadcopter+OBC          |
| Processors        | 9.9    | 3.000 | ✓ 自产      | OBC                     |


### 结论

**自产 9 个节点**（9 栋建筑）：
Power → Minerals → Chemicals → Batteries / EC / Processors → On-board Computer → Quadcopter
Power → Sand → Silicon → EC / Processors

**外购 3 项**：Water（0.072）、Plastic（0.128）、Crude Oil（0.000，Plastic外购后级联外购）

> 修正说明：旧分析将Crude Oil计为自产（单轮利用率0.977），但迭代收敛后，Plastic被外购 → Crude Oil失去唯一消费者 → 应改为外购。

**链条特点**：

- Chemicals 是核心枢纽，被 Batteries、EC、Processors 三路消耗，总利用率 0.704，**升级 Chemicals 建筑的收益最高**
- Silicon 利用率 1.037，几乎满载，是隐性瓶颈
- Processors 利用率 3.0，需要 Processors 建筑升至 OBC 建筑约 3 倍等级才能匹配
- 核心链条（Sand→Silicon→EC/Processors→OBC 以及 Minerals→Chemicals→Batteries）**流量匹配极好**

**当前玩家布局（2026-03-12）**：已按此链完整布局，共 10 栋建筑，Chemicals 为升级优先级最高节点。

---

## Robots（机器人）`id:114`

**分析日期**：2026-03-15

### 基本参数


| 指标       | 值                                      |
| -------- | -------------------------------------- |
| 层级深度     | L6（Power L0 → Robots L6）               |
| 完整依赖树节点数 | 14（含 Power）                            |
| 推荐自产节点数  | 4（Robots、Processors、Silicon、Sand）      |
| 外购节点数    | 9                                      |


### 生产配方

```
Robot ← Electric Motor×1 + Processors×2 + Plastic×10
Electric Motor ← Electronic Comps×3 + Steel×2
Steel ← Power×5 + Chemicals×0.1 + Iron Ore×1
Iron Ore ← Power×7 + Water×0.5
Processors ← Silicon×4 + Chemicals×1
Electronic Comps ← Silicon×3 + Chemicals×1
Plastic ← Power×5 + Crude Oil×0.2
Chemicals ← Power×0.2 + Minerals×1
Silicon ← Power×3 + Sand×2
Minerals ← Power×20 + Water×1
Sand ← Power×2
```

### 层级结构

```
L0  Power
L1  Sand    Iron Ore    Minerals
L2  Silicon   Chemicals   Plastic (← Crude Oil 外购)
L3  Electronic Comps   Steel   Processors
L4  Electric Motor
L5  Robot
（Water 外购 → Minerals / Iron Ore）
```

### 利用率分析（迭代收敛，共5轮）

> 采用迭代收敛方法：每轮剔除利用率<0.2的节点后重算，直到稳定。
> 第1轮剔除：Electric Motor(0.071)、Plastic(0.110)、Water(0.127)
> 第2轮剔除：Steel(0.000)、Electronic Comps(0.000)、Crude Oil(0.000)——失去Electric Motor消费者
> 第3轮剔除：Chemicals(0.043)、Iron Ore(0.000)——Steel外购后级联
> 第4轮剔除：Minerals(0.000)——Chemicals外购后级联
> 第5轮收敛

**最终稳定状态**：

| 节点               | 产量/hr  | 利用率   | 决策        | 备注                 |
| ---------------- | ------ | ----- | --------- | ------------------ |
| Electric Motor   | 34.7   | 0.071 | ⚠️ **外购** | 原始低利用率             |
| Plastic          | 224.2  | 0.110 | ⚠️ **外购** | 原始低利用率             |
| Water            | 1738.2 | 0.127 | ⚠️ **外购** | 原始低利用率             |
| Steel            | 208.5  | 0.000 | ⚠️ **外购** | 级联：Electric Motor外购 |
| Electronic Comps | 44.5   | 0.000 | ⚠️ **外购** | 级联：Electric Motor外购 |
| Crude Oil        | 45.9   | 0.000 | ⚠️ **外购** | 级联：Plastic外购       |
| Chemicals        | 231.7  | 0.043 | ⚠️ **外购** | 级联：Steel/EC外购后骤降   |
| Iron Ore         | 191.6  | 0.000 | ⚠️ **外购** | 级联：Steel外购         |
| Minerals         | 125.7  | 0.000 | ⚠️ **外购** | 级联：Chemicals外购     |
| Sand             | 1496.9 | 0.223 | ✓ 自产      | Silicon消耗          |
| Silicon          | 166.8  | 0.237 | ✓ 自产      | Processors消耗       |
| Processors       | 9.9    | 0.500 | ✓ 自产      | Robots消耗           |

**自产（4项）**：Robots + Processors + Silicon + Sand
**外购（9项）**：Electric Motor、Plastic、Steel、Electronic Comps、Chemicals、Crude Oil、Iron Ore、Minerals、Water

> **修正说明**：旧分析基于单轮计算，将Electric Motor(0.078)视为"低利用率但值得自产"。
> 迭代收敛后，Electric Motor外购导致Steel/EC/Crude Oil等6个节点级联外购。
> 最终只剩 Sand→Silicon→Processors→Robots 这条极简链合格。

### 推荐策略（迭代收敛后）

**简化建筑方案（5 栋建筑）**：

```
自产：Sand + Silicon + Processors + Robots（+ Power）
外购：Electric Motor、Plastic（×10/Robot，需大量购买）、Steel、EC等
```

- Sand(0.223) → Silicon(0.237) → Processors(0.500) 是内部链条
- Robots 直接消耗 Processors×2（自产供应）
- Electric Motor 外购（利用率仅0.071，且外购后Steel/EC级联也省去）
- Plastic×10/Robot 是最大外购成本项（Robot需求量最高）

> 注：旧分析的 3,984/hr 系统利润计算基于11栋全自产方案，迭代后应重新计算（需VWAP数据）。

### 链条特点

- **迭代收敛后极度精简**：仅 Sand→Silicon→Processors→Robots 4节点自产，与旧分析的11节点自产差异巨大
- **Electric Motor 是关键分支点**：利用率0.071，外购后导致Steel/EC/Chemicals等6个节点级联外购
- **与 Quadcopter 的差异**：Quadcopter 有 Sand/Silicon/Chemicals/Minerals/EC/Processors/OBC 自产链；Robot 迭代后仅保留 Sand/Silicon/Processors，大幅缩减
- **Plastic 高用量问题**（×10/Robot）：Plastic 利用率0.110也低于阈值，应外购。Robot是全游戏Plastic需求最高产品，意味着需要大量采购Plastic
- **实际竞争力**：Robot 独立链极简，优势在于 Processors 利用率0.500合理，链条干净低风险

### 与 Quadcopter 对比（迭代修正后）


| 指标      | Quadcopter（9自产）           | Robots（4自产，迭代后）       |
| ------- | ------------------------- | ---------------------- |
| 深度      | L6                        | L6                     |
| 自产节点数   | 9（含Quadcopter）            | 4（含Robots）             |
| 自产链条    | Sand→Silicon→Chemicals→EC/Proc→OBC→QC | Sand→Silicon→Processors→Robots |
| 外购节点数   | 3（Water、Plastic、Crude Oil）| 9（Electric Motor等）     |
| 最低自产利用率 | Sand=0.223                | Sand=0.223             |

> **关键差异**：Quadcopter 的 Chemicals/OBC/Batteries/EC 多路自产链在迭代后仍然合格；
> Robots 的 Electric Motor 子链在迭代后全部外购，导致自产范围大幅缩小。
> Robots 链比 Quadcopter 链更"浅"，垂直整合程度更低。

---

## Satellite（卫星）`id:99`

**分析日期**：2026-03-30
**数据来源**：SimcoTools API（产量/工资）+ 30天K线成交量加权均价

### 基本参数


| 指标 | 值 |
|---|---|
| 建筑 | Aerospace Electronics |
| 产量/hr（单栋） | 0.113 |
| 工资/hr | $724.5 |
| 销售方式 | Sales Offices（零售合同，非交易所） |
| 零售均价（Q0） | $72,322 |
| 市场饱和度 | 0.975 |
| 层级深度 | L7（Power L0 → Satellite L7）|
| 完整依赖树节点数 | 20（含 Power）|
| 推荐自产节点数 | 6（含 Satellite 本身）|
| 推荐外购节点数 | 13 |


### 生产配方

```
Satellite           ← Flight Computer×4 + Ion Drive×1 + High Grade E-Comps×8 + Attitude Control×2
Flight Computer     ← High Grade E-Comps×4 + On-board Computer×2     [外购]
Ion Drive           ← High Grade E-Comps×8 + Batteries×30 + Chemicals×15
Attitude Control    ← Steel×3 + Batteries×5 + Electric Motor×3       [外购]
High Grade E-Comps  ← Silicon×4 + Chemicals×3 + Golden Bars×0.0625
On-board Computer   ← Processors×2 + Electronic Comps×3              [外购，级联]
Electric Motor      ← Steel×2 + Electronic Comps×3                   [外购，级联]
Batteries           ← Chemicals×4
Steel               ← Iron Ore×1 + Chemicals×0.1                     [外购，级联]
Chemicals           ← Minerals×1
Golden Bars         ← Gold Ore×200                                    [外购]
Silicon             ← Sand×2                                          [外购，级联]
Minerals            ← Water×1
```

### 层级结构

```
L0  Power
L1  Sand  Water
L2  Silicon  Minerals  Gold Ore  Iron Ore
L3  Chemicals  Golden Bars
L4  High Grade E-Comps  Batteries  Steel  Processors  Electronic Comps
L5  Ion Drive  On-board Computer  Electric Motor
L6  Flight Computer  Attitude Control
L7  Satellite
```

### 利用率分析（迭代收敛，共 6 轮）

> 采用迭代收敛方法：每轮剔除利用率 < 0.2 的节点后重算，直到稳定。

**收敛过程**：

| 轮次 | 剔除节点 | 原因 |
|---|---|---|
| 第1轮 | Flight Computer(0.200)、Attitude Control(0.083)、Golden Bars(0.004) | 利用率不足 |
| 第2轮 | On-board Computer(0.000)、Electric Motor(0.000)、Gold Ore(0.000) | FC/AC 外购后上游失去消耗者 |
| 第3轮 | Steel(0.000)、Processors(0.000)、Electronic Comps(0.000) | EM/OBC 外购的级联 |
| 第4轮 | Iron Ore(0.000)、Silicon(0.047) | Steel外购后铁矿归零；Silicon剩余利用率过低 |
| 第5轮 | Sand(0.000) | Silicon 外购后 Sand 失去唯一消耗者 |
| 第6轮 | 收敛 | — |

**最终稳定状态**（自产节点）：


| 节点 | 产量/hr | 工资/hr | 利用率 | 决策 |
|---|---|---|---|---|
| Ion Drive（离子推进器） | 0.560 | $621 | 0.206 | ✓ 自产 |
| Chemicals（化学品） | 213.9 | $414 | 0.536 | ✓ 自产 |
| Batteries（电池） | 25.3 | $379.5 | 0.696 | ✓ 自产 |
| Minerals（矿石） | 119.2 | $276 | 1.842 | ✓ 自产 |
| High Grade E-Comps | 1.837 | $379.5 | 3.080 | ✓ 自产（需3栋）|

**外购（13项）**：Flight Computer、Attitude Control、On-board Computer、Electric Motor、Steel、Processors、Electronic Comps、Sand、Silicon、Iron Ore、Golden Bars、Gold Ore、Water

---

### 成本驱动分析（2026-03-30，30天均价）

**每颗 Satellite 直接原料成本**（合计 $46,455）：


| 组件 | 数量 | 30天均价 | 合计成本 | 占比 | VI决策 |
|---|---|---|---|---|---|
| Flight Computer | 4 | $5,252 | $21,008 | **45.2%** | ✗ 外购（PPLH=-$223，亏损）|
| Ion Drive | 1 | $13,939 | $13,939 | **30.0%** | ✓ 自产（PPLH=$948）|
| High Grade E-Comps | 8 | $1,004 | $8,033 | **17.3%** | ✓ 自产（PPLH=$552）|
| Attitude Control | 2 | $1,738 | $3,476 | 7.5% | ✗ 外购（利用率0.083）|


**成本树展开**：

```
Satellite 原料 $46,455
├── Flight Computer ×4  $21,008 (45.2%) [外购]
│   └── HGE×4 + OBC×2 → 自产FC亏损（PPLH=-$223），因OBC无处卖
├── Ion Drive ×1  $13,939 (30.0%) [自产节省≈$6,662]
│   ├── HGE×8  $8,033 (57.6%的ID成本) [自产进一步降低]
│   ├── Batteries×30  $2,861 (20.5%)  [自产]
│   └── Chemicals×15  $243 (1.7%)    [自产]
├── HGE ×8  $8,033 (17.3%) [自产，原料$497 → 节省$507/件]
│   ├── Golden Bars×0.0625  $412 (41.0%的HGE成本) [外购，必须]
│   ├── Silicon×4  $36 (3.6%)  [外购]
│   └── Chemicals×3  $49 (4.9%)  [自产]
└── Attitude Control ×2  $3,476 (7.5%) [外购]
    └── PPLH=$613 但利用率仅0.083 → 83%产能闲置
```

> **HGE 关键数据**：Golden Bars 30天均价 **$6,596**，每件 HGE 需 0.0625 枚 = **$412**（占 HGE 原料成本 83%）。
> 16件 HGE/颗卫星 × $412 = **$6,592 的 Golden Bars 成本**，占整机成本 14.2%——必须外购，无法规避。

---

### 自产 PPLH 排名（每栋建筑/hr，以市场价计算原料）


| 排名 | 节点 | 产量/hr | 市场均价 | 原料成本/件 | PPLH | 备注 |
|---|---|---|---|---|---|---|
| 1 | Ion Drive | 0.560 | $13,939 | $11,138 | **$948** | HGE×8+Bat×30+Chem×15 |
| 2 | High Grade E-Comps | 1.837 | $1,004 | $497 | **$552** | Si×4+Chem×3+GB×0.0625 |
| 3 | Minerals | 119.2 | $12.49 | $5.99 | **$499** | Water+Power |
| 4 | Batteries | 25.3 | $95.37 | $64.88 | **$390** | Chemicals×4 |
| 5 | Chemicals | 213.9 | $16.22 | $12.49 | **$384** | Minerals×1 |
| — | Attitude Control | 2.716 | $1,738 | $1,245 | **$613** | ⚠️ 利用率仅0.083，不纳入自产 |
| — | Flight Computer | 2.263 | $5,252 | $5,030 | **-$223** | ❌ 亏损，坚决外购 |


---

### 结论与建议

**自产（6 节点）**：Satellite、Ion Drive、High Grade E-Comps、Batteries、Chemicals、Minerals
**外购（13 项）**：Flight Computer、Attitude Control、On-board Computer、Electric Motor、Steel、Processors、Electronic Comps、Sand、Silicon、Iron Ore、Golden Bars、Gold Ore、Water

**固定外购成本/颗**：FC×4 + AC×2 = **$24,484**（52.7% 的原料成本无法通过 VI 消除）

**建筑槽位建议（共6栋）**：

| 槽位 | 建筑 | 理由 |
|---|---|---|
| 1 | Aerospace Electronics | 终端产品 |
| 2 | High Grade E-Comps 厂 ×3 | 利用率3.08，需3栋；16件/颗卫星 |
| 5 | Ion Drive 工厂 | 30%成本，PPLH $948 |
| 6 | Chemicals → Batteries 联动 | Minerals→Chemicals→Batteries 三级串联，共节省约$3,100/颗 |

> **关键发现**：
> - 第一轮看似仅外购4节点，链式反应最终导致 **13节点外购，自产比例从75%崩塌至30%**
> - Flight Computer 自产 PPLH **-$223**（亏损），是迭代收敛中罕见的"高成本占比却必须外购"案例
> - Attitude Control PPLH $613（可盈利），但因 Satellite 链消耗仅8.3%，若不配合其他产品，建设后83%产能空置
> - HGE 中 Golden Bars 占原料成本41%（$412/件），是整机中唯一无法通过上游VI降低的刚性成本项

---

### Q4 卫星分析（2026-03-30，零售价 $57,500）

> Q4 卫星零售均价 $57,500，略高于 Q0 的 $55,500，但 Q3 组件成本同样更高，导致整机利润空间基本持平。

#### 直接零件成本（全部外购 Q3 组件）

| 组件 | 数量 | Q3 均价 | 小计 | 占比 |
|------|------|---------|------|------|
| Flight Computer Q3 | ×4 | $5,639.85 | $22,559.40 | 46.2% |
| Ion Drive Q3 | ×1 | $14,301.07 | $14,301.07 | 29.3% |
| High Grade E-Comps Q3 | ×8 | $1,048.16 | $8,385.28 | 17.2% |
| Attitude Control Q3 | ×2 | $1,789.93 | $3,579.86 | 7.3% |
| **合计直接零件成本** | | | **$48,825.61** | 84.9% of 零售 |

**全外购 Q3 时 Satellite PPLH**：
```
PPLH = 0.11316 × (57,500 × 0.96 − 48,825.61) − 724.5
     = 0.11316 × 6,374.39 − 724.5
     = 721.3 − 724.5 = −$3/hr（本质上盈亏平衡）
```

结论：Q4 卫星几乎不需要 VI 即可达到盈亏平衡，但单栋 Aerospace Electronics 本身亏损 $3/hr，**必须自产至少一项组件才能净盈利**。

#### 各建筑 PPLH（Q3 输出，使用 Q2 市场价原料）

| 建筑 | 产量/hr | 工资/hr | 原料成本/件 | PPLH | 建议 |
|------|---------|---------|------------|------|------|
| Satellite（全外购Q3） | 0.113 | $724.5 | $48,826 | **−$3** | 必建（终端产品）|
| Ion Drive Q3 | 0.560 | $621 | $11,409 | **+$678** ★ | 优先自产 |
| HGE Q3 | 1.837 | $379.5 | $512 | **+$528** | 自产 |
| Attitude Control Q3 | 2.716 | $724.5 | $1,264 | **+$509** | 自产（91.7%卖市场）|
| Flight Computer Q3 | 2.263 | $724.5 | $5,165 | **−$161** | ❌ 亏损，继续外购 |

Ion Drive Q3 原料明细（Q2 价）：HGE×8=$8,271 + Batteries×30=$2,892 + Chemicals×15=$246 = **$11,409**
HGE Q3 原料明细（Q2/Q1 价）：Silicon×4=$37 + Chemicals×3=$49 + Golden Bars×0.0625=$426 = **$512**
AC Q3 原料明细（Q2 价）：Steel×3=$40 + Batteries×5=$482 + Electric Motor×3=$743 = **$1,264**
FC Q3 原料明细（Q2 价）：HGE×4=$4,135 + OBC×2=$1,030 = **$5,165**

> **关键发现**：Flight Computer 在 Q4 下自产 PPLH 仍为 **−$161/hr**（Q0 时 −$223/hr），质量溢价不足以弥补 HGE Q2 + OBC Q2 的高昂原料成本，坚决外购。

#### Q2 级深度 VI 建筑

| 建筑 | 产量/hr | 工资/hr | 原料成本/件 | PPLH | 用途 |
|------|---------|---------|------------|------|------|
| HGE Q2 | 1.837 | $379.5 | $512 | **+$503** | 供 Ion Drive 工厂 |
| Batteries Q2 | 25.255 | $379.5 | $65 | **+$308** | 供 Ion Drive & AC |

Ion Drive 工厂每小时需 HGE Q2 × 8 = **4.48 件**，1栋 HGE Q2 工厂（1.837/hr）利用率 243.8%，**需 2–3 栋**才能完全自给。

#### 供应链利用率（以 Satellite 链为锚点）

| 组件工厂 | Satellite 链需求/hr | 工厂产量/hr | Satellite 链占比 | 说明 |
|---------|-------------------|-----------|----------------|------|
| Ion Drive Q3 | 0.113 | 0.560 | 20.2% | 79.8% 卖市场 |
| HGE Q3 | 0.905 | 1.837 | 49.3% | 供 Satellite 直接用 |
| HGE Q2 | 4.478* | 1.837 | 243.8% | *Ion Drive 消耗，需多栋 |
| AC Q3 | 0.226 | 2.716 | 8.3% | 91.7% 卖市场 |
| FC Q3 | 0.453 | 2.263 | 20.0% | 亏损，不自产 |

*Ion Drive 工厂（0.560/hr）×8 HGE Q2 per unit = 4.478 HGE Q2/hr 需求

#### 链式经济汇总

| 建筑组合 | 合计 PPLH/hr |
|---------|------------|
| Satellite 单栋（全外购 Q3） | −$3 |
| + Ion Drive Q3 | +$675 |
| + HGE Q3 | +$1,203 |
| + Attitude Control Q3 | **+$1,712（4栋推荐基准）** |
| + 第2栋 HGE Q3 | +$2,239 |
| + HGE Q2 | +$2,743 |
| + Batteries Q2 | +$3,051 |

**与 Q0 Satellite 对比**

| 指标 | Q0 Satellite | Q4 Satellite |
|------|-------------|-------------|
| 零售价 | $55,500 | $57,500 |
| Satellite 建筑单栋 PPLH | **+$48/hr**（全外购Q0组件） | **−$3/hr**（全外购Q3组件）|
| Ion Drive PPLH | $948/hr | $678/hr |
| HGE PPLH | $552/hr | $528/hr |
| AC PPLH | $613/hr | $509/hr |
| FC PPLH | −$223/hr | −$161/hr |
| FC 结论 | 坚决外购 | 坚决外购 |
| 推荐 4 栋链 PPLH | 约 $2,161/hr | $1,712/hr |

Q0 单个组件工厂 PPLH 更高，但 Q4 总链更容易组织（零件定价透明，Q3 交易量充足）。

> **Q4 备注**：Q4 零售价 $57,500 > Q0 $55,500，但 Q4 Satellite 建筑 PPLH 反而为 −$3/hr（Q0 为 +$48/hr），原因是 Q3 组件市场价已充分反映品质溢价，导致 Q4 整机利润空间被压缩。

#### 推荐建筑扩建顺序

```
Slot 1:  Aerospace Electronics（Satellite）    −$3/hr（终端产品，必建）
Slot 2:  Ion Drive 工厂                        +$678/hr ★ 最高 PPLH 支撑
Slot 3:  HGE 工厂（Q3 输出）                   +$528/hr，供 Satellite 直接 HGE Q3 需求
Slot 4:  Attitude Control 工厂                 +$509/hr，91.7% 产能卖市场
Slot 5:  第2栋 HGE（Q3 或 Q2）                +$528/$503/hr，供 Ion Drive 的 HGE Q2 缺口
Slot 6:  第3栋 HGE（Q2 优先）                  +$503/hr，Ion Drive 需 4.48 HGE Q2/hr，需补充
Slot 7+: Batteries Q2 工厂                     +$308/hr，Ion Drive 需 Bat Q2 × 30/unit
```

---

## 综合比较（电子与机器人类）


| 产品         | 层级  | 节点数 | 自产数（迭代后）| 最低自产利用率      | 评分              | 特点                              |
| ---------- | --- | --- | --------- | ------------ | --------------- | --------------------------------- |
| Quadcopter | L6  | 12  | 9         | 0.223(Sand)  | 6×(9/12)=**4.5**| 电子链，3轮迭代后仍保留9节点                  |
| Robots     | L6  | 13  | 4         | 0.223(Sand)  | 6×(4/13)=**1.8**| 迭代后仅Sand→Silicon→Processors→Robots |
| Satellite  | L7  | 19  | 6         | 0.206(Ion Drive)| 7×(6/19)=**2.2**| 6轮迭代，自产比例从75%崩塌至30%            |
