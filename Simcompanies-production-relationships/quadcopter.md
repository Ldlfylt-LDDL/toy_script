## Quadcopter（四旋翼无人机）`id:98`

**分析日期**：2026-03-12

### 基本参数

| 指标 | 值 |
|------|-----|
| 层级深度 | L6（Power L0 → Quadcopter L6） |
| 完整依赖树节点数 | 12（含 Power） |
| 自产节点数 | 10 |
| 外购节点数 | 2（Water、Plastic） |

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

### 利用率分析

| 节点 | 产量/hr | 链内消耗/hr | 利用率 | 决策 | 消耗来源 |
|------|---------|------------|--------|------|---------|
| Water | 1738.2 | 125.7 | 0.072 | ⚠️ **外购** | Minerals |
| Plastic | 224.2 | 28.6 | 0.128 | ⚠️ **外购** | Quadcopter |
| Sand | 1496.9 | 333.6 | 0.223 | ✓ 自产 | Silicon |
| Batteries | 27.2 | 14.3 | 0.527 | ✓ 自产 | Quadcopter |
| Chemicals | 231.7 | 163.0 | 0.704 | ✓ 自产 | Batteries+EC+Processors |
| On-board Computer | 14.8 | 14.3 | 0.966 | ✓ 自产 | Quadcopter |
| Silicon | 166.8 | 172.9 | 1.037 | ✓ 自产 | EC+Processors |
| Minerals | 125.7 | 231.7 | 1.842 | ✓ 自产 | Chemicals |
| Electronic Comps | 44.5 | 87.4 | 1.966 | ✓ 自产 | Quadcopter+OBC |
| Processors | 9.9 | 29.6 | 3.000 | ✓ 自产 | OBC |

### Quality 分析
q4：无人机
q3：车载电脑 电池 电子元件 “塑料”
q2：处理器 化学品 硅
q1：矿石 沙子
q0：“水” 电

### 结论

**自产 10 个节点**（10 栋建筑）：
Power → Minerals → Chemicals → Batteries / EC / Processors → On-board Computer → Quadcopter
Power → Sand → Silicon → EC / Processors

**外购 2 项**：Water（利用率 0.072，全服务器产量足，价格稳定）、Plastic（0.128）

**链条特点**：
- Chemicals 是核心枢纽，被 Batteries、EC、Processors 三路消耗，总利用率 0.704，**升级 Chemicals 建筑的收益最高**
- Silicon 利用率 1.037，几乎满载，是隐性瓶颈
- Processors 利用率 3.0，需要 Processors 建筑升至 OBC 建筑约 3 倍等级才能匹配
- 核心链条（Sand→Silicon→EC/Processors→OBC 以及 Minerals→Chemicals→Batteries）**流量匹配极好**