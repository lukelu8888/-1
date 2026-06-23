# ERP 全链路总挂接树定案稿 V1

## 1. 定位

本稿作为当前 ERP 宏观架构的阶段性定案底稿。

目标不是罗列分散模块，而是以一条统一经营主线为牵引，把：

- 公司总目标
- 业务总主线
- 客户经营模型
- 角色责任
- 页面与模块
- 节点动作、提醒、统计

统一挂接为一棵树，形成从顶层到基层、从目标到动作、从角色到系统的一体化承接结构。

后续如需删减、新增、重排，统一在本底稿上修订。

## 1.1 源头规则（主稿优先）

本稿已经进入“主稿 + 专题展开枝”结构。

为避免后续继续补充时前后打架，统一采用以下源头规则：

- `12. 关键销售与交付节点细化树` 中的主版本总树，作为当前 V1 的主稿源头。
- `13-39` 各章节，视为对主稿的专题展开、字段补充、控制规则补充、代码对照补充。
- 如果专题展开枝与主稿出现冲突，默认以 `12` 中主版本口径为准，再回头修专题枝。
- 任何新增业务规则，先补进主稿主轴，再决定是否需要同步到专题枝。
- 任何审批、状态、阻断、放行规则，先查现有代码，再写入主稿，再决定是否落代码。
- 任何新增功能或对象，先查当前 ERP 是否已有稳定落点、现成对象或可复用 service：
  - 如果已有稳定落点，优先做真实桥接和小步代码落地；
  - 如果没有稳定落点，或现有 ERP 无法安全挂接，先写回主稿对应分支，明确 `现有无稳定落点 / 需新增对象或 service / 先轻量挂接暂不真实桥接`；
  - 待主稿把对象落点、挂接边界、实现顺序写清楚后，再按主稿进入 ERP 代码开发；
  - 不允许因为主稿里写了目标能力，就直接跨过“现状核对和落点设计”去硬做大页面或硬接旧模块。

## 1.2 完整性检查结论（本轮）

当前文档已经具备这些核心层：

- 顶层目标、主线、角色、页面、节点、动作、提醒、统计
- 一张图主轴主稿
- 控制总枝
- 审批、异常、事件、权限、审计、三端联动、KPI、字段口径与字段变更
- 代码现状校验、术语统一、模块动作角色表

当前最小代价、最高收益的源头补齐，不是继续新增专题枝，而是先固定这 4 条源头原则：

- 主稿优先：主轴规则先写进 `12`，专题枝后跟
- 代码优先：审批、状态、阻断、放行先查代码
- 术语优先：主稿统一术语后，专题枝逐步跟进
- 差距显式：凡未落代码的口径，必须标注 `V1目标规则 / 部分具备 / 剩余差距`

## 1.3 后续修订顺序（最小代价原则）

后续如果继续补文档，统一按这个顺序推进：

1. 先改 `12` 主稿主轴
2. 再改 `12` 的控制总枝
3. 再改 `代码现状校验 / 术语统一 / 模块动作角色表`
4. 最后才改 `13-39` 专题展开枝

这样可以保证：

- 先把源头讲对
- 再把专题讲细
- 不会出现后面补得很细，但源头口径还旧着的情况

---

## 2. 顶层总树

```text
公司总目标
└── 建立以目标为中心的全链路经营系统
    ├── 增长
    ├── 转化
    ├── 交付
    ├── 回款
    └── 组织效率
        └── 经营总主线
            └── 客户开发 -> 销售转化 -> 采购履约 -> 出运交付 -> 回款反馈 -> 复购转介绍
```

---

## 3. 客户经营模型树

```text
客户经营模型
└── 主流程模板
    ├── trade
    │   ├── 零售商
    │   ├── 进口商
    │   └── 批发商
    ├── agency
    │   └── 代理采购型买家
    ├── project
    │   └── 项目承包商
    └── service_to_trade
        └── 验货/出运服务客户
```

说明：

- `进口商` 和 `批发商` 在流程上并入 `trade`，仅在客户对象类型与统计维度上区分。
- `service_to_trade` 的经营目标不是停留在服务，而是转化为商品客户。

## 3.1 客户类型适用范围说明

本稿当前的主轴，默认以 `trade` 成交链作为标准骨架。

这意味着：

- `trade` 客户：最适合完整走主轴，默认按 `客户开发 -> ING -> QR/QT -> SC -> PR -> CG -> Shipment -> Docs -> Payment -> Feedback -> Repeat` 理解。
- `project` 客户：继续复用主轴底座，但应优先按项目主轴理解，重点强化 `设计/规格冻结 / FAT / 发货前检查 / SAT / 最终移交 / 里程碑收款`，不宜简化成普通贸易翻单链。
- `service_to_trade` 客户：不应强套完整贸易主轴，应先走 `验货 / 出运 / 单证 / 协调` 服务主轴，出现明确商品采购信号后再切入 `trade` 主轴。
- `agency` 客户：不适合被理解为“普通贸易客户的一个标签”，而应理解为“委托范围可配置的服务型客户”。

因此，本稿对 `agency` 的正式口径是：

- `agency` 继续复用当前 ERP 主轴作为底座；
- 但不强制完整经过全部贸易成交节点；
- 应允许按委托范围，选择性进入 `供应商筛选 / 询价支持 / 下单支持 / 跟单 / QC支持 / 订舱支持 / 单证支持`；
- 客户侧应能看到“当前由谁执行、当前做到哪一步、下一步是否等待客户确认”。

## 3.2 Agency 客户适配原则

`agency` 客户的核心特征，不是“客户类型不同”，而是“每个业务环节谁来执行并不固定”。

在同一个 agency 客户上，可能同时存在这三种责任模式：

- `our_team_execute`：由我方执行
- `client_self_execute`：由客户自行执行
- `co_execute`：双方协同执行

因此，Agency 客户不能只靠 `customer_segment = agency` 一个字段表达完整业务差异，主稿建议在源头上补齐两类控制信息：

- `agency_service_scope`
  - `supplier_sourcing`
  - `rfq_support`
  - `quotation_comparison`
  - `order_placement_support`
  - `follow_up`
  - `qc_support`
  - `booking_support`
  - `shipping_docs_support`
  - `full_service`
- `responsibility_mode`
  - `our_team_execute`
  - `client_self_execute`
  - `co_execute`

源头控制口径是：

- 是否进入某节点，不只看客户类型，还要看 `agency_service_scope`
- 某节点由谁执行，不只看部门职责，还要看 `responsibility_mode`
- 客户侧看到的是“服务链进度”，内部侧看到的是“与现有主轴挂接后的执行明细”

## 3.3 Agency 服务主轴（挂接现有主轴）

Agency 客户建议采用单独的服务主轴，再按节点挂接当前贸易主轴。

```text
Agency 服务主轴
└── 客户委托
    ├── 需求澄清
    ├── 供应商筛选
    ├── 推荐供应商包待客户确认
    ├── 询价支持（可选）
    ├── 下单支持（可选）
    ├── 跟单支持（可选）
    ├── QC支持（可选）
    ├── 订舱/出运支持（可选）
    ├── 单证/收尾支持（可选）
    └── 服务反馈
```

Agency 服务主轴与现有贸易主轴的挂接原则：

- 只委托 `供应商筛选`
  - 走到 `推荐供应商包待客户确认`
  - 不强制进入 `QT / SC / PR / CG`
- 委托 `筛供应商 + 询价支持`
  - 可在客户确认候选供应商后，挂接到 `QR / XJ / BJ`
- 委托 `下单支持`
  - 可在客户确认下单方案后，挂接到 `SC / PR / CG`
- 委托 `跟单 / QC支持`
  - 挂接到 `CG -> 打样 / 封样 / 量产 / QC`
- 委托 `订舱 / 出运 / 单证支持`
  - 挂接到 `订舱前决策 / Shipment / Docs`

控制规则：

- Agency 客户不应被强制完整穿过全部贸易主轴；
- 但一旦挂接进入某节点，就应接受该节点对应的审批、阻断、审计、角色边界；
- Customer Portal 面向 Agency 客户时，应优先展示“服务阶段”，而不是直接暴露全部内部单据名。

## 3.4 供应商推荐包（Agency 客户侧可见对象）

当我方为 Agency 客户执行 `supplier_sourcing` 时，ERP 主稿建议以“供应商推荐包”作为客户可见对象，而不是只在内部备注里保留筛选过程。

推荐包至少应包含：

- 基本信息
  - 推荐包编号
  - 客户
  - 对应需求
  - 创建人
  - 当前状态
- 候选供应商
  - 供应商名称
  - 地区
  - 主营能力
  - 相关品类经验
  - 历史合作情况
  - 产能
  - 起订量
  - 响应速度
  - 合规或认证情况
- 筛选标准
  - 价格
  - 质量
  - 交期
  - 配合度
  - 产能
  - 认证
  - 历史表现
- 推荐理由
  - 为什么推荐
  - 风险点
  - 适用场景
  - 不适用场景
- 附件
  - 工厂资料
  - 对比表
  - 认证文件
  - 样品图或参考资料

客户侧动作建议：

- `确认进入询价`
- `要求补充供应商`
- `淘汰某候选`
- `指定某家供应商进入下一步`

控制规则：

- 推荐包应进入 Customer Portal；
- 客户侧看到的是“筛选标准 + 推荐理由 + 候选清单 + 待确认动作”；
- 内部部门仍按现有 ERP 主轴继续协同执行。

## 3.5 Project 客户适配原则

`project` 客户不应只被理解为“trade 的一个大单版本”，而应被理解为“项目制节点更重、规格与交付控制更强”的客户类型。

Project 客户的源头特征通常包括：

- 需求规格复杂，前置澄清更重
- 单次项目金额高、审批更重
- 打样 / 封样 / QC / 交付里程碑的重要性更高
- 可能按项目批次、项目阶段、站点或包段推进
- 翻单逻辑弱于贸易型老客户，项目阶段推进逻辑强于常规补货逻辑
- 交付对象可能不是单品，而是模组、产线、成套设备、整厂或交钥匙工程
- 回款常常依赖项目里程碑，而不只是简单定金与尾款
- 项目验收通常不是单一 QC，而是包含 FAT、发货前检查、到场验收、SAT、最终移交等多级节点

因此，Project 客户建议补一条独立的项目型服务主轴，再按需要挂接现有贸易主轴：

```text
Project 服务主轴
└── 项目立项
    ├── 需求澄清
    ├── 方案与供应商筛选
    ├── 项目报价
    ├── 客户确认
    ├── 合同与项目启动
    ├── 设计/规格冻结
    ├── 采购与制造执行
    ├── FAT与发货前检查
    ├── Shipment与现场交付
    ├── 安装调试与SAT
    └── 最终验收与项目复盘
```

Project 服务主轴与现有贸易主轴的挂接原则：

- `方案与供应商筛选`
  - 可挂接到 `QR / XJ / BJ`
- `项目报价`
  - 可挂接到 `QT`
- `合同与项目启动`
  - 可挂接到 `SC`
- `采购与制造执行`
  - 可挂接到 `PR / CG / 打样 / 封样 / 量产`
- `FAT与发货前检查`
  - 是项目型订单特有强化节点，不应被普通 `QC` 简化替代
- `Shipment与现场交付`
  - 可挂接到 `订舱前决策 / Shipment / Docs`
- `安装调试与SAT`
  - 是项目到场后的现场验收节点，位于普通贸易主轴之后
- Customer Portal 面向 Project 客户时，应优先展示“项目阶段、项目批次、待确认里程碑、计划与实际偏差”，而不是仅展示内部单据编号

控制规则：

- Project 客户不应被简化成普通翻单贸易主轴；
- 但一旦进入采购、履约、出运节点，仍应遵守现有审批、阻断、审计、角色边界；
- 项目型客户的关键控制点应前置到 `需求澄清 / 规格冻结 / 验收标准确认 / FAT放行 / SAT完成 / 最终移交`；
- 对于模组、整厂、交钥匙工程，ERP 应优先支持里程碑视图与甘特图视图，而不是只靠普通单据状态串联。

### 3.5.0 与现有代码对照说明（本轮）

- 代码落地层级：`部分已落库`
- 当前已具备的真实基础：
  - 现有代码已经存在 `projectId / projectCode / projectName / projectRevisionId / projectRevisionCode / projectRevisionStatus / finalRevisionId` 这一组项目修订基线字段；
  - `QT / XJ / BJ / SC / PR / CG` 相关服务层与上下文对象，已能沿链路携带项目修订基线；
  - 客户产品库已支持 `recordType = project`、项目修订链、当前修订、最终修订锁定、技术附件包。
- 当前已具备但仍偏“技术基线”的部分：
  - `projectRevisionWorkflow`
  - `projectRevisionEnabled`
  - `projectRevisions`
  - `currentRevisionId / finalRevisionId`
- 当前尚未形成完整主对象的部分：
  - `FAT / SAT / 最终移交` 尚未形成独立项目型执行主对象；
  - `项目会议纪要 / 行动项 / 风险台账 / 问题清单 / 项目移交文件包` 尚未看到完整落库链；
  - 甘特图、计划/实际偏差、项目里程碑收款也尚未形成统一项目对象。
- 本稿口径：
  - `project` 的“修订基线、技术包、报价/合同贯通”应视为 `部分已落库`；
  - `FAT / SAT / 项目会议纪要 / 行动项 / 项目移交文件包 / 甘特图项目控制` 当前仍属于 `V1目标规则`；
  - 后续代码对照时，不应把“已有项目修订字段”误写成“完整项目主轴已实现”。

### 3.5.0.1 Project 可复用现有模块清单（本轮）

- `客户产品库 / Project Revision`
  - 当前最适合作为 Project 主轴的技术基线底座；
  - 已支持项目记录、修订链、当前修订、最终修订锁定、技术附件包。
- `My Products / MyProductsSelector`
  - 已支持客户侧按项目修订选择版本，并将修订快照带入询价；
  - 适合作为“项目图纸/技术包版本选择”的现有入口底座。
- `QT / XJ / SC / PR / CG` 现有服务层
  - 已能沿链路携带 `projectRevision` 基线；
  - 适合作为 Project 主轴挂接统一贸易主轴时的现有承接链。
- `customerBusinessMode`
  - 已有 `projectRevisionEnabled / project_enabled` 开关口径；
  - 可作为后续 Project 客户模式切换的轻量控制入口。
- 当前未看到可直接复用的独立模块：
  - `项目会议纪要`
  - `项目行动项`
  - `项目风险台账`
  - `项目问题清单`
  - `FAT / SAT / 最终移交`
  - 甘特图计划/实际对象
- 结论：
  - Project 后续最小实现，不应从零开始重做“项目产品与修订”；
  - 应优先复用“客户产品库 + 修订链 + 报价合同采购贯通”，再补会议、行动项、FAT/SAT、移交四类新对象。

### 3.5.0.2 Project 最小改造清单（本轮）

按照“最小代价、最大复用”的原则，Project 建议分三步改造：

#### 第一步：直接复用现有底座

- 复用 `客户产品库 / Project Revision`
  - 作为项目图纸、技术包、规格修订的统一基线；
- 复用 `My Products / MyProductsSelector`
  - 作为客户侧选择项目版本、带入询价/报价的现有入口；
- 复用 `QT / XJ / SC / PR / CG`
  - 作为项目从报价到采购执行的统一贸易底座。

#### 第二步：补最少的新对象

- `项目会议纪要`
- `项目行动项`
- `项目里程碑`

这三个对象优先级高于：

- `项目风险台账`
- `项目问题清单`
- `FAT / SAT / 最终移交专属对象`

原因：

- 会议纪要 + 行动项 + 里程碑，已经能先支撑真实项目推进；
- FAT / SAT / 移交可在第二阶段再细化成专属对象。

#### 第三步：再补工程化控制对象

- `FAT主对象`
- `SAT主对象`
- `项目移交文件包`
- `风险台账`
- `问题清单`
- 甘特图计划/实际偏差

Project 最小落地建议：

- 第一阶段先把 `project revision + 项目会议纪要 + 行动项 + 里程碑` 接起来；
- 第二阶段再做 `FAT / SAT / 最终移交 / 风险 / 问题 / 甘特图`。

### 3.5.0.3 Project 主稿口径 vs 现有 ERP 对照表（本轮）

| Project 主稿口径 | 现有 ERP 情况 | 当前判断 | 剩余差距 |
|---|---|---|---|
| `项目立项 / 项目编号 / 项目基线` | 已有 `projectId / projectCode / projectName` 在报价、合同、采购链中传递 | `部分已落库` | 缺统一的项目主对象首页与项目立项工作台 |
| `图纸/技术包版本主线` | 已有 `projectRevisionId / projectRevisionCode / projectRevisionStatus / finalRevisionId / projectRevisions`，客户产品库支持项目修订链 | `部分已落库` | 缺按阶段锁版、按 FAT/Shipment/Installation 切版本的主控制对象 |
| `客户侧选择项目版本进入询价/报价` | 已有 `MyProducts / MyProductsSelector` 与项目修订快照带入询价 | `部分已落库` | 缺项目客户侧里程碑总览、待确认节点、计划/实际偏差视图 |
| `Project 挂接统一贸易主轴` | `QT / XJ / SC / PR / CG` 相关服务层与上下文已沿链路携带项目修订基线 | `已具备底座` | 缺项目专属节点对统一主轴的可视化桥接 |
| `项目会议纪要` | 未看到独立主对象 | `V1目标规则` | 需新增 `项目会议纪要` 对象与项目挂接关系 |
| `项目行动项闭环` | 未看到独立主对象 | `V1目标规则` | 需新增行动项、负责人、截止时间、状态、关闭说明 |
| `项目里程碑 / 甘特图` | 未看到统一项目里程碑对象 | `V1目标规则` | 需新增里程碑对象，以及 `planned/actual/dependency` 结构 |
| `FAT / 发货前检查 / SAT / 最终移交` | 未看到完整独立项目执行主对象 | `V1目标规则` | 需新增 FAT、SAT、移交文件包与放行逻辑 |
| `项目风险台账 / 问题清单` | 未看到完整落库链 | `V1目标规则` | 需新增风险与问题对象，并可挂接会议纪要/行动项 |
| `项目里程碑收款` | 现有 Payment 更偏贸易单与后段控制 | `部分具备` | 需补项目型里程碑收款与验收节点联动 |

Project 对照结论：

- 现有 ERP 对 `Project` 最大的真实基础，不在“项目管理界面”，而在“项目修订基线 + 技术包 + 报价合同采购贯通”；
- 第一阶段最省代价的路径，不是重做一套项目系统，而是承接现有 `project revision` 底座，补 `会议纪要 / 行动项 / 里程碑` 三个最小对象；
- `FAT / SAT / 项目移交 / 风险 / 问题 / 甘特图` 应作为第二阶段工程化增强，而不应在第一阶段一次性做全。

### 3.5.0.4 Project 第一阶段实现准备（本轮）

基于本轮代码复核，Project 第一阶段建议直接按“强基线 + 轻对象”的方式进入实现准备。

#### A. 本轮代码复核结论

- 已确认可直接复用的强底座：
  - `customerProductLibrary`
    - 已支持 `recordType = project`
    - 已支持 `projectCode / projectName / projectRevisions / currentRevisionId / finalRevisionId`
    - 已支持技术附件包与修订链；
  - `ProjectProductForm`
    - 已支持项目根信息、当前修订、修订摘要、修订说明、修订文件上传；
  - `QT / XJ / SC / PR / CG` 相关服务层与上下文
    - 已能沿链路携带 `projectRevision` 执行基线。

- 已确认目前仍缺的项目管理层对象：
  - `项目会议纪要`
  - `项目行动项`
  - `项目里程碑`

- 已确认当前不适合第一阶段直接做重的部分：
  - 完整 FAT/SAT 工作面
  - 项目移交文件包工作面
  - 风险台账与问题清单独立中枢
  - 完整甘特图引擎

#### B. 第一阶段最小落点建议

第一阶段建议只补 3 个轻量对象：

1. `项目会议纪要`
- 作为项目沟通主对象；
- 用来承接周会、图纸评审会、FAT准备会、SAT问题会、最终验收会。

2. `项目行动项`
- 作为纪要中的决定项/整改项的执行对象；
- 用来承接负责人、截止日期、状态、关闭说明。

3. `项目里程碑`
- 作为项目主轴节点的轻量控制对象；
- 先支持计划/实际、责任人、依赖、是否关键里程碑；
- 第一阶段不直接等于完整甘特图。

#### C. 与现有底座的挂接建议

- `项目会议纪要`
  - 必须能挂接：
    - `projectId`
    - `projectCode`
    - `projectName`
    - `projectRevisionId`
    - `projectRevisionCode`
- `项目行动项`
  - 必须能挂接：
    - `meeting_id`
    - `projectId`
    - `projectRevisionId`
    - 可选挂接 `正式业务对象`
- `项目里程碑`
  - 必须能挂接：
    - `projectId`
    - `projectRevisionId`
    - 项目主轴阶段

挂接原则：

- 第一阶段一律以现有 `project revision` 为技术基线源头；
- 不单独再造一套“项目版本管理”；
- 会议、行动项、里程碑都围绕现有 `projectId + projectRevisionId` 展开。

#### D. 第一阶段建议字段最小集

`项目会议纪要`

- `meeting_id`
- `projectId`
- `projectCode`
- `projectName`
- `projectRevisionId`
- `projectRevisionCode`
- `meeting_type`
- `meeting_time`
- `host`
- `participants`
- `summary`
- `decision_items`
- `minutes_status`
- `created_by`
- `created_at`

`项目行动项`

- `action_item_id`
- `projectId`
- `projectRevisionId`
- `meeting_id`
- `action_title`
- `action_description`
- `owner_user_id`
- `due_at`
- `action_status`
- `closed_note`
- `closed_at`

`项目里程碑`

- `milestone_id`
- `projectId`
- `projectRevisionId`
- `milestone_name`
- `milestone_stage`
- `owner_user_id`
- `planned_start`
- `planned_end`
- `actual_start`
- `actual_end`
- `dependency`
- `risk_level`
- `milestone_status`
- `is_key_milestone`

#### E. 第一阶段实现准备结论

- Project 第一阶段现在已经具备进入实现准备的条件；
- 最小实现不应从 UI 或甘特图开始，而应先从 `会议纪要 / 行动项 / 里程碑` 三个对象落点开始；
- 这三个对象必须统一挂在现有 `project revision` 底座上；
- 第一阶段完成后，再进入 `FAT / SAT / 项目移交 / 风险 / 问题 / 甘特图` 的第二阶段增强。

#### F. 本轮代码进展补充

- 本轮已新增 3 个轻量独立 service：
  - `projectMeetingService`
  - `projectActionItemService`
  - `projectMilestoneService`
- 这 3 个 service 当前统一采用：
  - 小对象
  - 独立 service
  - 共享轻量存储工具
  的方式实现；
- 当前已具备的最小能力：
  - 按 `projectId / projectRevisionId` 查询
  - 创建记录
  - 更新记录
- 当前仍然明确未做的部分：
  - 未形成正式 UI 工作面
  - 未扩展成第二阶段的 `FAT / SAT / 甘特图 / 风险台账 / 问题清单`
- 本轮已完成的最小挂接：
  - 已将 `项目会议纪要 / 项目行动项 / 项目里程碑` 的轻量工作面挂接到现有 `MyProducts` 的项目 revision 详情；
  - 当前入口遵循“先挂现有强底座，不先新开重项目中心”的原则；
- 因此，Project 第一阶段当前状态应更新为：
  - `产品定义与实现准备已完成第一轮收口`
  - `最小 service 骨架已落代码`
  - `最小挂接已完成`
  - `下一步进入入口收口与后续增强边界控制`

### 3.5.0.5 Project 第一阶段收口结论（本轮）

截至本轮，Project 第一阶段在主稿中的产品定义与实现准备层，建议视为 `已完成第一轮收口`。

已完成收口的内容包括：

- Project 客户适配原则
- Project 简单工作节点
- FAT / 发货前检查 / SAT / 最终移交口径
- 项目里程碑收款节点
- 项目变更、风险、问题三件套
- 项目客户侧可见内容与待确认节点
- 图纸版本主线
- 项目会议纪要
- 项目行动项闭环
- 项目文件包与移交文件包
- 可复用现有模块清单
- 最小改造清单
- 主稿口径 vs 现有 ERP 对照表
- 第一阶段实现准备

收口判断：

- 当前不建议继续在“纯产品概念层”继续扩写 Project；
- 后续如继续推进 Project，应转入：
  - `对象落库设计`
  - `入口挂载设计`
  - `会议纪要 / 行动项 / 里程碑` 三对象的实现准备
  - 再之后才进入 `FAT / SAT / 甘特图` 第二阶段工程化增强

后续推进建议：

1. `Project 第一阶段`
   - 已可进入实现准备；
2. 主稿重心可切到 `借抬头出口服务第一阶段`；
3. 如后续再回到 Project，应以“对象设计和实现方案”为主，而不是继续抽象扩写项目概念。

补充判断（本轮代码现状）：

- `项目会议纪要 / 项目行动项 / 项目里程碑` 三个对象，现已具备最小 service 骨架；
- 当前已完成最小正式入口挂接，因此现阶段应判断为：
  - `实现准备已进入代码落点阶段`
  - `最小挂接已完成`
  - `独立项目中心尚未开始`

## 3.5.1 Project 简单工作节点（第一版）

为了先支撑项目型客户的进度追踪、里程碑管理与甘特图展示，主稿建议 Project 客户先采用这 12 个简单工作节点：

1. `项目立项`
2. `需求澄清`
3. `方案与供应商筛选`
4. `项目报价`
5. `客户确认`
6. `合同与项目启动`
7. `设计/规格冻结`
8. `采购与制造执行`
9. `FAT与发货前检查`
10. `Shipment与现场交付`
11. `安装调试与SAT`
12. `最终验收与项目复盘`

建议每个项目节点统一带这些基础字段，用于列表视图与甘特图：

- `node_name`
- `owner`
- `planned_start`
- `planned_end`
- `actual_start`
- `actual_end`
- `status`
- `dependency`
- `risk_level`
- `milestone_flag`

## 3.5.2 FAT、发货前检查、SAT 的项目口径

对于模组、成套设备、整厂、交钥匙工程，Project 客户不应只保留普通 `QC` 节点，还应显式区分：

- `FAT`
  - 出厂验收测试
  - 关注机械、电气、软件、联机、性能、报警、文件齐套
- `发货前检查`
  - 包装、铭牌、备件、随机文件、装箱清单、发货批准
- `SAT`
  - 现场验收测试
  - 关注安装、调试、联机、试运行、现场性能达成
- `最终移交`
  - 培训、移交资料、最终验收、质保起算点

控制规则：

- `FAT通过` 不等于项目完成，只代表具备发货前放行基础；
- `SAT完成` 才更接近项目现场交付完成；
- `最终移交` 才代表项目从“工程执行”转入“质保与售后阶段”；
- 对交钥匙工程，应允许里程碑收款与里程碑放行绑定，而不是只按普通贸易尾款控制。

## 3.5.3 Project 里程碑收款节点（第一版）

Project 客户的收款，不应默认简化成“定金 + 尾款”，而应允许与项目里程碑绑定。

主稿建议 Project 客户先采用一版简单但够用的里程碑收款节点：

1. `合同生效款`
2. `设计/规格冻结款`
3. `开工款`
4. `FAT前款`
5. `发货款`
6. `到货款`
7. `SAT通过款`
8. `最终验收款`
9. `质保尾款`

如果是交钥匙工程，还应允许扩展：

- `预付款保函`
- `履约保函`
- `保留金`
- `质保金`
- `延期违约金`
- `性能违约责任`

Project 收款节点与现有 `Payment` 主轴的挂接原则：

- `合同生效款`
  - 挂接到 `SC生效 -> Payment`
- `设计/规格冻结款`
  - 挂接到 `设计/规格冻结 -> Payment里程碑收款`
- `FAT前款`
  - 影响 `FAT放行 / 发货前检查`
- `发货款`
  - 影响 `Shipment放行`
- `SAT通过款`
  - 影响 `项目现场交付闭环`
- `最终验收款 / 质保尾款`
  - 影响 `最终移交 / 项目复盘 / 售后转段`

控制规则：

- 对 Project 客户，应允许“里程碑收款条件”成为节点放行前置，而不只依赖普通贸易定金与尾款；
- `FAT前款` 未满足时，可阻断发货前放行；
- `发货款` 未满足时，可阻断发货或放单；
- `SAT通过款` 与 `最终验收款` 应允许进入项目现场闭环判断；
- `质保尾款` 不应阻断项目移交，但应继续保留财务跟踪与风险提示。

建议最小字段：

- `project_payment_milestone_name`
- `project_payment_milestone_status`
- `planned_due_date`
- `actual_received_at`
- `milestone_release_dependency`
- `milestone_risk_note`

## 3.5.4 Project 变更、风险、问题三件套

对于模组、成套设备、整厂、交钥匙工程，Project 客户不应只靠“项目节点状态”推进，还应在源头上补齐这三类项目控制对象：

- `项目变更单`
- `项目风险台账`
- `项目问题清单`

### A. 项目变更单

项目变更单用于承接这些典型场景：

- 客户需求变更
- 规格参数变更
- 图纸/BOM变更
- 交付范围变更
- 交付时间变更
- 安装/调试范围变更
- 付款节点变更

建议最小字段：

- `project_change_no`
- `change_type`
- `change_description`
- `impact_scope`
- `impact_cost`
- `impact_schedule`
- `impact_quality`
- `requested_by`
- `approved_by`
- `change_status`

控制规则：

- 任何影响 `成本 / 工期 / 交付范围 / 验收标准 / 收款节点` 的事项，不应只写备注，应进入项目变更单；
- 项目变更单未关闭时，相关里程碑应允许挂“变更处理中”提示；
- 重大变更应影响 `QT / SC / Payment / 甘特计划` 的基线口径。

### B. 项目风险台账

项目风险台账用于提前记录和跟踪这类风险：

- 需求边界不清
- 客户频繁变更
- 设计冻结过晚
- 关键供应商交期不稳
- FAT通过但 SAT 风险高
- 现场条件不满足
- 安装调试责任不清
- 文件移交不完整
- 回款节点风险

建议最小字段：

- `project_risk_no`
- `risk_type`
- `risk_description`
- `risk_level`
- `risk_owner`
- `mitigation_action`
- `target_close_date`
- `risk_status`

控制规则：

- 项目风险不应散落在邮件和群消息里，应进入可持续跟踪的风险台账；
- `高风险` 项应在项目阶段视图和甘特图旁可见；
- 涉及 `FAT / Shipment / SAT / 最终验收` 的高风险，应能挂接为里程碑阻断或预警。

### C. 项目问题清单

项目问题清单用于承接执行中已发生的问题，而不是潜在风险，例如：

- 图纸错误
- 部件缺失
- 现场条件不符
- FAT整改项
- SAT整改项
- 文件不齐
- 培训未完成
- 客户验收问题未关闭

建议最小字段：

- `project_issue_no`
- `issue_type`
- `issue_description`
- `current_stage`
- `issue_owner`
- `due_date`
- `issue_status`
- `close_note`

控制规则：

- 风险和问题应分开：风险是“可能发生”，问题是“已经发生”；
- `FAT`、`SAT`、`最终验收` 中出现的问题，应进入问题清单闭环，而不是只留在报告备注；
- 未关闭的问题清单，应能影响项目节点状态与客户侧可见进度说明。

### D. 三件套与项目主轴的挂接关系

- `项目变更单`
  - 挂接 `需求澄清 / 项目报价 / 合同与项目启动 / 设计冻结 / Payment`
- `项目风险台账`
  - 挂接 `项目立项` 起始，并持续贯穿到 `最终移交`
- `项目问题清单`
  - 重点挂接 `采购与制造执行 / FAT与发货前检查 / 安装调试与SAT / 最终验收`

源头建议：

- 项目型客户进入 ERP 后，不只展示“项目节点”，还应展示“项目节点 + 变更 + 风险 + 问题”四条并行控制线；
- 甘特图展示的是计划推进；
- 风险台账与问题清单展示的是计划偏差和执行阻力；
- 项目变更单展示的是“为什么计划被改写”。

## 3.5.5 Project 客户侧可见内容（Portal 第一版）

Project 客户在 Customer Portal 中，不应主要看到内部单据树，而应优先看到“项目进度 + 里程碑 + 待客户确认事项”。

主稿建议第一版客户侧展示这 5 类内容：

- `项目总览`
  - 项目名称
  - 当前阶段
  - 项目负责人
  - 计划开始/计划完成
  - 当前风险级别
- `项目里程碑`
  - 项目立项
  - 需求澄清
  - 报价确认
  - 合同启动
  - 设计/规格冻结
  - FAT与发货前检查
  - Shipment与现场交付
  - 安装调试与SAT
  - 最终验收与项目复盘
- `待客户确认事项`
  - 需求边界确认
  - 规格/图纸确认
  - 报价确认
  - 变更确认
  - FAT安排确认
  - 发货批准
  - SAT结果确认
  - 最终验收确认
- `客户可见文件包`
  - 方案资料
  - 报价资料
  - FAT报告
  - 发货前检查资料
  - 装箱/随机文件
  - SAT资料
  - 最终移交资料
- `问题与风险摘要`
  - 只显示与客户相关或需要客户确认的风险/问题

## 3.5.6 Project 客户侧动作边界（可见 / 可确认 / 不可直接改）

Project 客户在 Portal 中，建议动作边界分成 3 层：

### A. 客户可直接确认

- 确认需求边界
- 确认规格/图纸版本
- 确认报价方案
- 确认项目变更
- 确认 FAT 计划或参加安排
- 确认发货批准
- 确认 SAT 结果
- 确认最终验收

### B. 客户可见但不可直接修改

- 项目甘特计划
- 项目风险台账
- 项目问题清单
- 内部责任人
- 内部审批流
- 内部采购与制造执行细节

### C. 客户不应直接暴露内部对象名或底层执行口径

- 不默认直接暴露 `QR / XJ / BJ / PR / CG`
- 不默认直接暴露内部审批人、审批历史明细
- 不默认直接暴露内部供应商完整比价底稿

控制规则：

- Portal 应优先展示“客户关心的项目阶段”，而不是把 ERP 内部单据原样铺给客户；
- 客户侧能确认的事项，应形成明确的“待客户确认节点”；
- 客户侧能看到风险和问题，但默认不能直接改内部状态，只能反馈意见或补充信息。

## 3.5.7 Project 待客户确认节点（第一版）

为了让项目型订单在客户侧更可执行，建议把以下内容统一抽成“待客户确认节点”：

1. `需求澄清确认`
2. `规格/图纸确认`
3. `报价确认`
4. `项目变更确认`
5. `FAT计划确认`
6. `发货批准确认`
7. `SAT结果确认`
8. `最终验收确认`

建议最小字段：

- `customer_confirmation_node`
- `customer_confirmation_status`
- `customer_confirmation_due_at`
- `customer_confirmation_comment`
- `customer_confirmed_at`

控制规则：

- 项目型订单不应只靠内部推进，应明确哪些里程碑在等客户；
- 甘特图应能标出“内部执行中”与“待客户确认”两类节点；
- 超时未确认的客户节点，应进入项目风险台账或问题清单。

## 3.5.8 Project 图纸版本主线

对于模组、成套设备、整厂、交钥匙工程，图纸和技术文件不应只作为附件存在，而应作为项目主对象之一进行版本管理。

Project 图纸版本通常至少会经历：

- 初版
- 客户评论版
- 内部修订版
- 冻结执行版
- FAT版
- 发货版
- 现场安装版
- SAT整改版
- 最终竣工版

建议最小字段：

- `drawing_no`
- `drawing_name`
- `drawing_category`
- `revision_no`
- `revision_status`
- `issued_for`
- `issued_at`
- `issued_by`
- `supersedes_revision`
- `customer_ack_status`

建议最小状态：

- `draft`
- `internal_review`
- `submitted_to_customer`
- `customer_commented`
- `revised`
- `frozen_for_execution`
- `issued_for_fat`
- `issued_for_shipment`
- `issued_for_installation`
- `as_built`

阶段挂接规则：

- `需求澄清`
  - 可使用草稿版或评审版
- `项目报价 / 合同阶段`
  - 可使用报价参考版
- `采购与制造执行`
  - 应以 `frozen_for_execution` 版本作为执行基线
- `FAT与发货前检查`
  - 应以 `issued_for_fat` 和 `issued_for_shipment` 版本作为检查依据
- `安装调试与SAT`
  - 应以 `issued_for_installation` 版本作为现场执行依据
- `最终验收与项目复盘`
  - 应输出 `as_built` 版本

控制规则：

- 阶段切换时，应能明确“当前哪个版本在驱动执行”；
- `FAT / Shipment / SAT` 不应混用未冻结图纸；
- 客户确认过的图纸版本，应保留清晰版本链，而不是只覆盖当前附件。

## 3.5.9 Project 项目会议纪要

Project 客户在执行期间通常会有多轮项目进度沟通、评审会、三方视频会议与验收会议，这些会议不应只停留在邮件、微信或聊天工具中。

建议至少支持这些会议类型：

- `需求澄清会`
- `方案评审会`
- `图纸评审会`
- `项目例会`
- `FAT准备会`
- `发货协调会`
- `现场安装协调会`
- `SAT问题会`
- `最终验收会`

建议最小字段：

- `meeting_no`
- `meeting_type`
- `meeting_time`
- `host`
- `internal_participants`
- `customer_participants`
- `supplier_participants`
- `external_participants`
- `meeting_summary`
- `decision_items`
- `action_items`
- `meeting_minutes_url`

控制规则：

- 会议纪要的价值不只是留痕，而是沉淀“决定项”和“行动项”；
- 对 `需求澄清 / 图纸确认 / FAT准备 / 发货协调 / SAT整改 / 最终验收` 这类关键会议，应允许回挂到对应项目节点；
- 三方会议应能区分内部参与人、客户参与人、供应商参与人和其他外部参与人。

## 3.5.10 Project 行动项闭环

项目会议、FAT、SAT、现场整改、客户反馈等过程中产生的行动项，不应只停留在纪要正文里，应形成可跟踪、可关闭的行动项清单。

建议最小字段：

- `action_item_no`
- `source_type`
- `source_ref`
- `action_description`
- `owner`
- `due_date`
- `action_status`
- `close_note`

建议最小状态：

- `open`
- `in_progress`
- `blocked`
- `done`
- `closed_with_note`

挂接关系建议：

- 行动项可来自 `会议纪要`
- 行动项可挂到 `项目节点`
- 行动项可挂到 `项目风险台账`
- 行动项可挂到 `项目问题清单`
- 行动项可挂到 `图纸版本`

控制规则：

- 会议纪要中的行动项应有明确责任人与截止日期；
- 超期未完成的行动项，应能反向进入项目风险台账或问题清单；
- `FAT / SAT / 最终验收` 的整改项，应优先按行动项闭环，而不是只写在报告备注里。

## 3.5.11 Project 三条并行对象主线

因此，Project 客户在主稿源头上，不应只有“项目阶段主轴”，还应明确这三条并行对象主线：

- `图纸版本主线`
- `项目会议纪要主线`
- `项目行动项闭环主线`

它们与项目阶段主轴的关系是：

- `项目阶段主轴`
  - 解决“项目做到哪一步”
- `图纸版本主线`
  - 解决“当前哪一版文件驱动执行”
- `项目会议纪要主线`
  - 解决“这次会议定了什么”
- `项目行动项闭环主线`
  - 解决“谁在什么时间前完成什么”

源头建议：

- Project 客户在 ERP 中应同时看到“阶段推进 + 文件版本 + 会议纪要 + 行动项闭环”；
- 甘特图展示的是时间和依赖；
- 图纸版本主线展示的是技术基线；
- 会议纪要与行动项展示的是沟通推进和责任闭环。

## 3.5.12 Project 文件包与项目移交文件包

对于模组、成套设备、整厂、交钥匙工程，项目文件不应只散落在附件和聊天记录里，而应至少形成两层对象：

- `项目执行文件包`
- `项目移交文件包`

### A. 项目执行文件包

项目执行文件包用于支撑项目推进过程中的评审、制造、验收与出运，建议至少包含：

- 技术协议
- 规格书
- 图纸与版本文件
- BOM或关键物料清单
- 供应商方案资料
- FAT计划
- FAT报告
- 发货前检查记录
- 装箱清单
- 备件清单
- 随机文件清单

建议最小字段：

- `project_doc_pack_no`
- `project_doc_pack_type`
- `doc_category`
- `doc_status`
- `doc_owner`
- `linked_project_stage`
- `linked_revision_no`
- `visible_to_customer`

### B. 项目移交文件包

项目移交文件包用于承接现场交付、最终验收和质保起算前的正式移交资料，建议至少包含：

- 最终版图纸或竣工图
- SAT报告
- 安装调试记录
- 培训记录
- 操作手册
- 维护手册
- 备件建议清单
- 设备铭牌/序列号清单
- 最终验收文件
- 移交清单
- 质保起算确认资料

建议最小字段：

- `handover_pack_no`
- `handover_pack_status`
- `handover_owner`
- `handover_ready_at`
- `handover_completed_at`
- `handover_accepted_by_customer_at`
- `handover_archive_ref`

### C. 文件包与项目主轴的挂接关系

- `技术协议 / 规格书 / 图纸版本`
  - 挂接 `需求澄清 / 设计与规格冻结`
- `FAT计划 / FAT报告 / 发货前检查记录`
  - 挂接 `FAT与发货前检查`
- `装箱清单 / 备件清单 / 随机文件`
  - 挂接 `Shipment与现场交付`
- `SAT报告 / 培训记录 / 移交清单 / 最终验收文件`
  - 挂接 `安装调试与SAT / 最终验收与项目复盘`

### D. 客户侧可见规则

Project 客户在 Portal 中，文件包不应默认全部暴露，应按阶段分层展示：

- 可在前期展示
  - 技术协议
  - 已确认规格文件
  - 已确认图纸版本
- 可在 FAT 阶段展示
  - FAT计划
  - FAT报告
  - 发货前检查资料
- 可在 Shipment 阶段展示
  - 装箱清单
  - 随机文件
- 可在 SAT / 最终移交阶段展示
  - SAT报告
  - 培训记录
  - 移交清单
  - 最终验收资料

控制规则：

- 文件包应按项目阶段组织，而不是只按文件名堆放；
- `FAT与发货前检查` 不应缺少对应文件包；
- `最终移交` 不应在移交文件包未齐套时直接标记完成；
- 客户侧看到的是“当前阶段应查看和确认的文件包”，而不是内部全部底层资料。

## 3.5.13 Project 最终移交闭环

Project 客户，尤其是交钥匙工程，不应把“发货完成”视为项目终点，源头上应明确最终移交闭环。

最终移交闭环建议至少包含：

- `移交条件确认`
  - SAT完成
  - 整改项关闭
  - 移交文件包齐套
  - 培训完成
- `客户签收移交`
  - 客户确认已接收项目成果、文件与培训
- `质保起算`
  - 记录质保开始时间
- `项目转售后`
  - 从项目执行转入质保/售后支持

建议最小字段：

- `handover_status`
- `handover_block_reason`
- `warranty_start_at`
- `project_aftercare_owner`
- `project_close_note`

控制规则：

- `Shipment完成` 不等于 `项目完成`
- `SAT完成` 不等于 `最终移交完成`
- `最终移交完成` 之后，项目应进入 `质保/售后阶段`
- 只有在移交条件满足时，项目才应从“执行中”切换为“已移交”

## 3.6 Service_to_Trade 客户适配原则

`service_to_trade` 客户不应被理解为已经进入完整商品贸易链，而应被理解为“当前以服务委托为主、未来可能转商品采购”的客户类型。

源头特征通常包括：

- 当前委托重点是 `验货 / 出运 / 单证 / 协调`
- 不一定天然拥有 `ING / QR / QT / SC / PR / CG`
- 客户与我方的合作先从服务开始，再逐步出现商品采购机会

因此，Service_to_Trade 客户建议先走独立的服务主轴，再在出现采购信号时切入贸易主轴：

```text
Service_to_Trade 服务主轴
└── 服务委托接收
    ├── 服务需求澄清
    ├── 验货支持（可选）
    ├── 出运协调（可选）
    ├── 单证支持（可选）
    ├── 反馈与服务复盘
    └── 商品采购信号识别
```

Service_to_Trade 服务主轴与现有贸易主轴的挂接原则：

- 只委托验货：挂接到 `QC`
- 委托出运协调：挂接到 `订舱前决策 / Shipment`
- 委托单证支持：挂接到 `Docs`
- 出现明确商品采购需求后，再切入 `客户开发 -> ING -> trade 主轴`

控制规则：

- Service_to_Trade 客户当前不强制完整进入贸易成交链；
- 但一旦挂接进入 `QC / Shipment / Docs / Payment` 等节点，就应接受该节点对应的控制规则；
- Customer Portal 面向这类客户时，应优先展示“服务进度、待客户确认事项、是否出现商品采购机会”。

## 3.7 三类服务型客户统一原则

为避免后续只把 `agency` 做成特殊分支，而忽略 `project` 与 `service_to_trade`，源头统一采用下面的总原则：

- `agency / project / service_to_trade` 都不能只靠一个客户类型标签表达完整业务差异；
- 三者都应有各自的服务主轴；
- 三者都应允许按委托范围或项目阶段，选择性挂接现有贸易主轴；
- Customer Portal 应优先展示“服务阶段/项目阶段/待确认事项”，而不是直接把内部单据树原样暴露给客户；
- 内部 ERP 继续复用现有主轴底座、审批规则、阻断规则、审计规则，不另起一套孤立系统。

## 3.8 客户类型与业务流程模板分层规则

主稿源头统一采用“两层表达”：

- `customer_segment`
  - 表达客户本身的经营属性
- `business_flow_template`
  - 表达本次具体业务按什么流程执行

控制原则：

- 客户类型不应因为个别业务而频繁切换；
- 同一个客户，可以在不同业务中使用不同流程模板；
- ERP 应优先保持客户主档稳定，再按单次业务切换流程模板；
- 后续统计时，应能同时看到“客户属于什么类型”和“这次业务走了什么模板”。

示例口径：

- 同一客户 A
  - 主档：`customer_segment = trade`
  - 平时普通卖货：`business_flow_template = trade_standard`
  - 个别借抬头文件+订舱委托：`business_flow_template = export_document_and_booking_service`

这意味着：

- `trade` 客户并不只能走普通贸易模板；
- `agency / project / service_to_trade` 也不应只靠客户类型字段决定所有流程；
- 主档与流程模板必须分层。

### 3.8.1 与现有代码对照说明（本轮）

- 代码落地层级：`部分具备`
- 当前已具备的真实基础：
  - 现有 CRM、客户管理、采购分析、财务分析、验货模块中，已经存在 `trading / inspection / agency / project` 这一组业务类型或客户类型口径；
  - `project_contractor / agency_seeker / inspection_seeker` 等客户获取与经营标签已存在。
- 当前尚未统一落库的部分：
  - 尚未看到明确的一等字段 `business_flow_template` 被现有运行时代码统一驱动；
  - 尚未看到“同一客户主档稳定，但单次业务切换模板”的统一执行入口；
  - `agency_service_scope / responsibility_mode` 仍主要是主稿源头设计，不是现有代码统一字段。
- 本稿口径：
  - `customer_segment` 在现有代码中可视为 `部分具备`；
  - `business_flow_template` 当前应视为 `V1目标规则`；
  - 后续全盘对照与改造时，应优先判断现有哪些模块可以承接“客户主档不变、单次业务模板切换”的能力，而不是假设系统已经具备。

## 3.9 借抬头出口服务模板（Export Document And Booking Service）

存在一类真实业务：客户本身是我司的 `trade` 客户，但个别订单并不是从我司采购货物，而是客户从第三方供应商采购、借用我司抬头生成文件、并可能委托我司订舱与出运协调。

这类业务不应混入普通贸易卖货主轴，建议单独采用：

- `business_flow_template = export_document_and_booking_service`

### 3.9.1 适用场景

- 客户从第三方供应商采购货物
- 货款不经过我司
- 客户借用我司抬头生成 `Proforma / Sales Contract` 等文件
- 客户可能委托我司订舱
- 客户可能自己买保险
- FOB 起运港下，报关出口相关费用由供应商承担
- 我司收入主要来自 `服务费`，并可能发生 `海运费代收代付`

### 3.9.2 简版服务主轴

```text
借抬头出口服务主轴
└── 客户邮件委托
    ├── 出货资料接收
    ├── 供应商与FOB条件校验
    ├── 我司抬头文件生成
    ├── 客户确认文件
    ├── 海运费询价（可选）
    ├── 客户确认海运费与船期（可选）
    ├── 正式订舱（可选）
    ├── 出运协调
    ├── 文件交付
    └── 服务费与代收代付结算
```

### 3.9.3 源头字段建议

- `service_order_type = export_document_and_booking_service`
- `cargo_owner`
- `external_supplier_name`
- `supplier_trade_term = FOB`
- `goods_payment_handled_by_us = false`
- `service_fee_amount`
- `freight_collect_amount`
- `freight_payable_amount`
- `insurance_handled_by_customer`
- `customs_export_cost_borne_by_supplier = true`

### 3.9.4 控制规则

- 该类业务的货款不进入我司普通贸易应收应付链；
- 我司的核心收入是服务费，不是货值差价；
- 如委托订舱，则仍应遵守 `海运费询价 -> 客户确认海运费与船期 -> 正式订舱` 的控制规则；
- 如客户自己买保险，则保险费用不进入我司代收代付；
- 如供应商承担 FOB 起运港下的报关出口费用，则该部分不应计入我司成本。

### 3.9.5 与现有代码对照说明（本轮）

- 代码落地层级：`前段为V1目标规则，后段部分已具备`
- 当前已具备的真实基础：
  - 现有后合同执行代码已具备 `订舱责任 / 海运费确认 / 收款控制 / 银行交单 / 放单状态 / L/C不符点` 等底座；
  - 现有系统已能区分 `collectionControlMode / bookingResponsibility / bankSubmissionStatus / documentReleaseStatus`；
  - 订舱前客户确认运费与船期、L/C 与 D/P 放单控制、例外放单审批都已有真实代码基础。
- 当前尚未形成独立主对象的部分：
  - 尚未看到独立的 `export_document_and_booking_service` 服务单主对象；
  - 尚未看到一等字段 `goods_payment_handled_by_us / service_fee_amount / freight_collect_amount / freight_payable_amount` 形成统一业务模板驱动；
  - 尚未看到“借抬头文件生成 -> 客户确认 -> 服务费结算”的前段主链被系统独立建模。
- 本稿口径：
  - `借抬头出口服务模板` 当前不应写成“系统已具备完整主轴”；
  - 其后段 `海运费询价 / 客户确认海运费与船期 / 订舱 / 出运 / 交单 / 放单控制` 可视为 `部分已具备，可复用现有执行底座`；
  - 其前段 `服务委托接收 / 抬头文件生成 / 服务费独立建模` 当前仍属于 `V1目标规则`。

### 3.9.6 借抬头出口服务可复用现有模块清单（本轮）

- `InspectionManagementComplete`
  - 已具备 `collectionControlMode / bookingResponsibility / freightConfirmationRequired / customerConfirmedFreight / booking quote options / shipping order` 等后段执行控制；
  - 适合作为“海运费询价 -> 客户确认海运费与船期 -> 正式订舱”的现有底座。
- `postContractExecutionServices / purchaseOrderQuoteRequirementServices`
  - 已具备 `bankSubmissionStatus / documentReleaseStatus / L/C不符点 / 放单阻断` 等后段执行与财务控制字段；
  - 适合作为“交单/放单/银行议付/托收”底座。
- `ServiceProviderManagement`
  - 已具备 `forwarder / customs / inspection / warehouse` 服务商主数据与服务订单口径；
  - 可复用为借抬头服务中的货代、报关、仓配服务商池。
- `PaymentRecordManagement / PayableManagement`
  - 已具备服务商付款、货代付款、报关付款等付款记录口径；
  - 可作为 `freight_payable_to_forwarder` 的现有承接底座。
- `InspectionServiceFeeManagement`
  - 已具备“服务费账单/同步财务”的轻量示例口径；
  - 可作为 `service_fee_receivable` 的最小实现参考，但当前口径更偏验货服务费，不应直接等同借抬头服务费。
- 当前未看到可直接复用的独立主对象：
  - `借抬头服务委托单`
  - `抬头文件生成与客户确认`
  - `服务费 + 海运费代收代付 + 非我司货款` 的统一业务模板对象
- 结论：
  - 借抬头出口服务后段不必重做；
  - 应优先复用现有“订舱/交单/放单/服务商付款”底座，再补一个轻量前段服务委托对象。

### 3.9.7 借抬头出口服务最小改造清单（本轮）

按照“后段复用、前段补轻量对象”的原则，建议分两步落地：

#### 第一步：复用现有后段执行与财务底座

- 复用 `InspectionManagementComplete`
  - 承接海运费询价、客户确认海运费与船期、正式订舱；
- 复用 `postContractExecutionServices / purchaseOrderQuoteRequirementServices`
  - 承接银行交单、放单、L/C 与 D/P 控制；
- 复用 `ServiceProviderManagement`
  - 承接货代、报关、仓配等服务商主数据；
- 复用 `PaymentRecordManagement / PayableManagement`
  - 承接海运费付货代、报关费、服务商付款。

#### 第二步：补最少的新前段对象

- `借抬头服务委托单`
  - 作为这类业务的主对象；
- `抬头文件记录`
  - 记录 `Proforma / Sales Contract` 生成与客户确认；
- `服务费应收记录`
  - 区别于普通贸易货款；
- `代收代付运费记录`
  - 区别于普通贸易收入和采购成本。

最小字段建议：

- `service_order_type`
- `customer_id`
- `cargo_owner`
- `external_supplier_name`
- `supplier_trade_term`
- `goods_payment_handled_by_us`
- `service_fee_amount`
- `freight_collect_amount`
- `freight_payable_amount`
- `customer_file_confirmed_at`

借抬头出口服务最小落地建议：

- 第一阶段不做复杂独立系统；
- 先补一个“服务委托单”前段对象，再把后段复用到现有订舱/放单/付款底座；
- 财务侧先把 `服务费 / 海运费代收代付 / 非我司货款` 三条线分开显示即可。

### 3.9.7.1 借抬头出口服务主稿口径 vs 现有 ERP 对照表（本轮）

| 借抬头出口服务主稿口径 | 现有 ERP 情况 | 当前判断 | 剩余差距 |
|---|---|---|---|
| `客户主档仍为 trade，单次业务切换服务模板` | 现有有 `trading / inspection / agency / project` 类型口径，但未见统一 `business_flow_template` 运行时驱动 | `部分具备` | 缺“客户主档不变、单次业务切模板”的统一入口 |
| `客户邮件委托 -> 服务委托单` | 未见独立服务委托单主对象 | `V1目标规则` | 需新增 `借抬头服务委托单` |
| `出货资料接收 / 供应商与 FOB 条件校验` | 现有后段执行模块可承接出运数据，但未见专属前段资料校验对象 | `部分具备` | 需在服务委托单中补资料接收与 FOB 校验字段 |
| `我司抬头文件生成 / 客户确认文件` | 未见独立“抬头文件生成与确认”对象 | `V1目标规则` | 需新增 `抬头文件记录` 与客户确认状态 |
| `海运费询价 -> 客户确认海运费与船期 -> 正式订舱` | `InspectionManagementComplete` 已具备 `bookingResponsibility / freightConfirmationRequired / booking quote options / shipping order` 等后段能力 | `部分已落库` | 可直接复用；仅需前段服务对象把数据挂进来 |
| `交单 / 放单 / L/C / D/P 控制` | `postContractExecutionServices / purchaseOrderQuoteRequirementServices` 已具备 `bankSubmissionStatus / documentReleaseStatus / L/C不符点 / 放单阻断` | `部分已落库` | 可直接复用；无需重做底座 |
| `服务费收入` | 现有有部分服务费管理示例，如 `InspectionServiceFeeManagement`，但不是借抬头统一口径 | `部分具备` | 需新增 `服务费应收记录` 并与该模板关联 |
| `海运费代收代付` | 现有 `PaymentRecordManagement / PayableManagement` 能承接付款与应付 | `部分具备` | 需补 `代收代付运费记录` 与客户收款关联 |
| `非我司货款` | 现有后段收款/放单控制能区分模式，但未见统一字段明确“货款不经我司” | `V1目标规则` | 需补 `goods_payment_handled_by_us = false` 一等口径 |
| `客户侧可见服务状态` | 未见专属客户侧服务状态页 | `V1目标规则` | 后续可在第二阶段补客户侧可见服务链 |

借抬头出口服务对照结论：

- 现有 ERP 对这类业务最强的真实基础在后段，而不在前段；
- `订舱 / 交单 / 放单 / 货代付款 / 收款模式控制` 已有较强执行底座，可直接复用；
- 第一阶段不应重做后段，而应只补 `服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` 四个轻量前段对象；
- 财务上必须坚持三条线分开：`服务费收入 / 海运费代收代付 / 非我司货款`。
- 若进入第二阶段，宜先在现有服务委托详情里补“客户侧可见服务状态摘要”，而不是直接开新门户。
- 当前第二阶段轻量摘要除“客户当前动作”外，也宜同步显示“内部下一步动作”，让内外状态在同一详情中同时可见。
- 当前第二阶段轻量摘要还宜同步显示“当前阻断点/等待点”，让内外双方都能一眼看出当前主要卡在客户确认、订舱、后段执行还是结算收口。
- 当前第二阶段轻量摘要中的“阻断点/等待点”还宜继续下沉到具体引用层，直接提示当前应优先盯哪条抬头文件记录、订舱桥接引用、后段桥接引用或结算识别键。
- 当前第二阶段轻量摘要中的“阻断点/等待点”在下沉到具体引用层后，还宜继续翻译成内部可直接执行的追办动作提示，避免只看见引用号却不知道下一步该推什么。
- 当前第二阶段轻量摘要中的“内部追办动作”在可执行化后，还宜继续补“责任归口”口径，直接提示当前更偏销售前段、单证执行还是财务收口责任。
- 若正式进入借抬头出口服务第二阶段 UI 落地，宜先把同一套服务状态口径沉成 `UI要吃的骨架结构`，再分成 `我方侧推进视图` 与 `客户侧状态视图` 分别挂到现有入口，而不是先做大而全的新门户。
- `客户侧状态视图` 不应直接照搬我方侧口径，而应把同一套状态骨架翻译成客户看得懂的服务语言，只保留客户真正需要知道的状态、当前动作和进度说明。
- `借抬头出口服务` 在我方侧的挂载位置应归入 `订单管理` 口径，而不应长期作为 `业务流程中心` 的平行一级业务入口。
- `我方侧推进视图` 与 `客户侧状态视图` 在标题和状态文案上也应继续分流，避免客户侧仍带内部状态感，或我方侧标题仍像客户门户。

### 3.9.7.2 借抬头出口服务第一阶段实现准备（本轮）

基于本轮代码复核，借抬头出口服务第一阶段建议按“后段强复用、前段补轻对象”的方式进入实现准备。

#### A. 本轮代码复核结论

- 已确认可直接复用的后段执行底座：
  - `InspectionManagementComplete`
    - 已具备 `bookingResponsibility`
    - 已具备 `collectionControlMode`
    - 已具备 `海运费询价 / 客户确认海运费与船期 / Shipping Order`
  - `postContractExecutionServices / purchaseOrderQuoteRequirementServices`
    - 已具备 `bankSubmissionStatus`
    - 已具备 `documentReleaseStatus`
    - 已具备 L/C 与 D/P 放单控制
  - `ServiceProviderManagement`
    - 已具备货代、报关、仓储、验货等服务商主数据；
  - `PaymentRecordManagement / PayableManagement`
    - 已具备服务商付款、货代付款、应付记录底座；
  - `InspectionServiceFeeManagement`
    - 已提供服务费同步财务的轻量参考口径。

- 已确认当前仍缺的前段对象：
  - `借抬头服务委托单`
  - `抬头文件记录`
  - `服务费应收记录`
  - `代收代付运费记录`
- 本轮代码进展补充：
  - 四个前段对象的最小 service 骨架已落代码；
  - 已挂到 `BusinessProcessCenter` 的独立轻量入口；
  - 当前入口只承担前段对象创建与查看，不替代后段 `Shipment / Docs / Payment` 底座。

- 已确认当前不适合第一阶段直接做重的部分：
  - 独立复杂的服务订单引擎
  - 完整客户侧服务门户
  - 多账簿级别的代收代付专项会计模型

#### B. 第一阶段最小落点建议

第一阶段建议只补 4 个轻量对象：

1. `借抬头服务委托单`
- 承接客户邮件委托；
- 记录供应商、FOB 条件、是否订舱、是否客户自保等前段事实。

2. `抬头文件记录`
- 承接 `Proforma / Sales Contract` 的生成与客户确认；
- 记录文件类型、版本、客户确认状态。

3. `服务费应收记录`
- 承接我司真正收入；
- 区别于普通贸易货款。

4. `代收代付运费记录`
- 承接客户向我司支付的运费以及我司向货代付款；
- 区别于普通营业收入和采购成本。

#### C. 与现有底座的挂接建议

- `借抬头服务委托单`
  - 必须能挂接：
    - `customer_id`
    - `external_supplier_name`
    - `supplier_trade_term`
    - `goods_payment_handled_by_us`
    - 是否进入订舱后段
- `抬头文件记录`
  - 必须能挂接：
    - `service_order_id`
    - 文件类型
    - 客户确认状态
- `服务费应收记录`
  - 必须能挂接：
    - `service_order_id`
    - 金额
    - 收款状态
    - 是否已开服务类票据
- `代收代付运费记录`
  - 必须能挂接：
    - `service_order_id`
    - `ServiceProvider / 货代`
    - 客户收款
    - 货代付款

挂接原则：

- 第一阶段后段一律复用现有：
  - `订舱前决策`
  - `Shipment`
  - `Docs`
  - `Payment` 后段控制
- 前段新对象只负责把“服务委托与财务口径”挂到后段执行链；
- 第一阶段不新造完整独立履约系统。

#### D. 第一阶段建议字段最小集

`借抬头服务委托单`

- `service_order_id`
- `customer_id`
- `service_order_type`
- `cargo_owner`
- `external_supplier_name`
- `supplier_trade_term`
- `goods_payment_handled_by_us`
- `booking_required`
- `insurance_handled_by_customer`
- `customs_export_cost_borne_by_supplier`
- `service_order_status`
- `created_by`
- `created_at`

`抬头文件记录`

- `document_record_id`
- `service_order_id`
- `document_type`
- `document_version`
- `document_status`
- `customer_confirmation_status`
- `customer_confirmed_at`
- `generated_by`
- `generated_at`

`服务费应收记录`

- `service_fee_record_id`
- `service_order_id`
- `service_fee_amount`
- `currency`
- `receivable_status`
- `invoice_status`
- `received_at`
- `notes`

`代收代付运费记录`

- `freight_settlement_id`
- `service_order_id`
- `forwarder_id`
- `freight_collect_amount`
- `freight_collected_at`
- `freight_payable_amount`
- `freight_paid_at`
- `settlement_status`
- `notes`

#### E. 第一阶段实现准备结论

- 借抬头出口服务第一阶段现在已经具备进入实现准备的条件；
- 最小实现不应重做后段订舱、交单、放单、付款底座；
- 第一阶段只应补 `服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` 四个前段轻量对象；
- 第一阶段完成后，再考虑客户侧服务状态视图、复杂财务模板和更完整的服务链增强。

#### F. 本轮代码进展补充

- 本轮已新增 4 个轻量独立 service：
  - `exportServiceOrderService`
  - `exportHeaderDocumentService`
  - `exportServiceFeeService`
  - `exportFreightSettlementService`
- 同时已补齐：
  - `exportServiceTypes`
  - `exportServiceStorage`
- 当前已具备的最小能力：
  - 创建记录
  - 更新记录
  - 按 `serviceOrderId` 查询从属对象
- 当前仍然明确未做的部分：
  - 当时尚未挂接到正式入口
  - 当时尚未形成前段工作面
  - 当时尚未与现有 `Shipment / Docs / PaymentRecordManagement / PayableManagement` 建立真实桥接
- 因此，借抬头出口服务第一阶段当前状态应更新为：
  - `产品定义与实现准备已完成第一轮收口`
  - `最小 service 骨架已落代码`
  - `下一步进入最小入口挂接准备`

### 3.9.7.3 借抬头出口服务第一阶段收口结论（本轮）

截至本轮，借抬头出口服务第一阶段在主稿中的产品定义与实现准备层，建议视为 `已完成第一轮收口`。

已完成收口的内容包括：

- 客户类型与业务流程模板分层规则
- 借抬头出口服务模板
- 借抬头出口服务的财务口径
- 可复用现有模块清单
- 最小改造清单
- 主稿口径 vs 现有 ERP 对照表
- 第一阶段实现准备

收口判断：

- 当前不建议继续在“纯产品概念层”继续扩写借抬头出口服务；
- 后续如继续推进，应转入：
  - `服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` 的对象设计
  - 与现有后段执行底座的挂接设计
  - 财务显示口径与台账落点设计
- 客户侧服务状态页、复杂财务模板、完整服务门户，应留在后续增强阶段。

后续推进建议：

1. `借抬头出口服务第一阶段`
   - 已可进入实现准备；
2. 三条主线现阶段都已完成第一轮收口：
   - `邮件工作台第一阶段`
   - `Project 第一阶段`
   - `借抬头出口服务第一阶段`
3. 后续主稿可从“继续扩写”切换到“实现准备排序与对象落点设计”。

### 3.9.7.4 第一阶段剩余事项清单（本轮）

为避免后续线程继续横向发散，本稿将第一阶段剩余事项压成两档：

#### A. 第一阶段必须继续完成

1. `repeat_direct_order` 后续摘要继续收口
   - 目前已做到 `邮件候选 -> 直下单草稿 -> CreateOrder -> OrderContext`；
   - 下一步应把正式订单后续 `财务 / 交付 / 签收` 关键节点继续收成统一摘要；
   - 并继续反写到 `直下单草稿 / MailThreadDetail`。
2. `翻单快捷入口` 统一收口
   - 当前已在 `MyOrdersOverview` 增加轻量统一概览卡；
   - 现已把 `repeat_quote / repeat_direct_order / 历史订单回查` 收成同一入口层；
   - 并明确“历史订单回查 / 历史产品回填 / 价格继承”属于同一复用锚点，分别下沉到 `customer_inquiry_drafts` 与 `directOrderDraftService`；
   - 后续只需继续补细节规则，不再属于“入口关系未落稳”问题。
3. 三条主线母稿状态统一收口
   - 需把“已完成 / 仍待继续 / 明确后移第二阶段”三类判断继续压实；
   - 避免后面新线程重复回到同一问题上再做口头判断。

#### B. 可明确后移到第二阶段

1. `邮件工作台` 真实企业邮箱同步
   - 属于系统接入层，不是第一阶段轻对象挂接必需项。
2. `邮件附件清单` 完整存储与检索链
   - 第一阶段只需保留骨架判断，不必现在扩成完整文件系统。
3. `责任人待处理箱 / 部门待处理箱 / 升级件` 完整责任链治理
   - 当前轻量实现已足够支撑第一阶段对象挂接。
4. `Project` 的 `FAT / SAT / 甘特图 / 风险台账 / 问题清单`
   - 已在主稿中明确属于第二阶段工程化增强。
5. `借抬头出口服务` 的客户侧服务状态页、复杂财务模板、完整服务门户
   - 已明确不应在第一阶段展开。

#### C. 当前阶段完成度判断

- 若按“对象设计 / 挂接 / 实现准备”口径评估：
  - 第一阶段当前整体可判断为 `约 75% - 85% 已完成`。
- 若按“还需几个中等回合可宣布基本收口”评估：
  - 当前建议预估为 `3 - 5 个中等回合`。
- 后续每轮继续时，应优先处理 `A档`，不应再跳回 `B档` 做重功能扩写。

### 3.9.7.5 三条主线统一状态总表（本轮）

为避免后续线程在三条主线上重复做口头判断，本稿将当前状态统一压成 `已完成 / 仍待继续 / 明确后移第二阶段` 三档。

#### A. 已完成

1. `邮件工作台第一阶段`
   - 第一阶段骨架对象已落地：
     - `邮件线程`
     - `邮件候选业务对象`
     - `邮件分发记录`
     - `mail_links`
   - 已真实接上的业务桥包括：
     - `ing -> Inquiry`
     - `repeat_quote -> customer_inquiry_drafts`
     - `repeat_direct_order -> directOrderDraftService -> CreateOrder -> OrderContext`
     - `project_meeting -> projectMeetingService`
     - `project_action_item -> projectActionItemService`
     - `document_task -> documentTaskService`
     - `export_service_order -> 借抬头服务委托单`
   - 邮件线程详情已可回看 `直下单草稿 / 正式订单摘要 / 借抬头服务委托单桥接摘要`；
   - 邮件线程与分发记录已开始随正式对象关键收口状态轻量自动收口。
2. `Project 第一阶段`
   - `项目会议纪要 / 项目行动项 / 项目里程碑` 最小对象已落地；
   - 已挂入现有 `project revision` 工作面；
   - 邮件工作台已可真实创建 `project_meeting / project_action_item`。
3. `借抬头出口服务第一阶段`
   - `借抬头服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` 最小对象已落地；
   - 邮件工作台与销售入口都已可真实创建正式委托单；
   - 已开始真实并入 `Payment / Payable / Shipment / Docs` 现有工作面；
   - 根对象 `serviceStatus` 已可随桥接摘要自动抬升，并已回看到邮件工作台。
4. `翻单快捷入口` 的入口关系
   - 已在 `MyOrdersOverview` 补轻量统一概览卡；
   - 已把 `repeat_quote / repeat_direct_order / 历史订单回查` 收成同一入口层；
   - 已明确 `历史订单回查 / 历史产品回填 / 价格继承` 属于同一复用锚点，不再属于入口关系缺失。

#### B. 仍待继续

1. `repeat_direct_order`
   - 仍需继续把正式订单后续更深的 `财务 / 交付 / 签收` 节点收成更稳的阶段映射；
   - 当前属于“已有轻量闭环，但仍可继续压实摘要规则”。
2. `三条主线母稿收尾`
   - 虽已形成统一总表，但后续如再推进代码，应同步回写“完成判断”与“边界判断”，避免状态漂移。
3. `翻单快捷入口` 的细规则
   - 入口关系已落稳；
   - 但历史产品回填、价格继承、翻单询价到正式链的细规则仍可后续继续补齐。

#### C. 明确后移第二阶段

1. `邮件工作台`
   - 真实企业邮箱同步
   - 附件清单完整存储与检索链
   - 完整责任箱 / 部门箱 / 升级件治理
2. `Project`
   - `FAT / SAT / 甘特图 / 风险台账 / 问题清单`
3. `借抬头出口服务`
   - 客户侧服务状态页
   - 复杂财务模板
   - 完整服务门户

统一判断：

- 第一阶段当前已不再缺少主轴级最小正式底座；
- 后续应以“压实已落对象的收尾规则”为主，不应回头再做大块新对象扩写；
- 若无新的高优先主轴变化，第一阶段后续推进应优先处理 `repeat_direct_order` 摘要收口与母稿状态同步。

### 3.9.7.6 第一阶段当前总收口判断（本轮）

截至当前代码现状，可统一判断为：

1. `第一阶段主轴级对象底座`
   - 已基本收齐。
   - 邮件工作台、Project、借抬头出口服务、翻单快捷入口，均已不再缺少最小正式落点。
2. `第一阶段真实桥接`
   - 已基本成型。
   - 当前已从“对象设计准备”推进到“主轴入口已真实咬住正式对象，并开始轻量回看/轻量反写”的阶段。
3. `第一阶段剩余工作`
   - 已主要收敛为规则压实，而不是继续补大对象。
   - 后续如继续，应优先处理：
     - `repeat_direct_order` 更深执行摘要的边界规则
     - 母稿与代码状态同步回写
     - 少量入口/摘要展示口径统一
4. `第一阶段停止线`
   - 若没有新的主轴级业务变化，当前不宜再继续横向扩写：
     - 新的大页面
     - 新的独立系统
     - 第二阶段邮箱/附件/责任链重治理
     - Project 的工程化增强
     - 借抬头服务的客户侧门户化

收口结论：

- 当前第一阶段已可判断为 `接近基本收口`；
- 后续线程应以“最后几轮规则压实与文档同步”为目标；
- 若再继续新增内容，必须先判断是否仍属于第一阶段，不可把第二阶段事项重新带回本轮。

### 3.9.7.7 第一阶段封板口径（本轮）

为避免后续线程继续在第一阶段与第二阶段之间来回摇摆，本稿补充正式封板口径如下：

#### A. 第一阶段做到这里即可视为可封板

1. 三条主线均已有最小正式底座
   - `邮件工作台第一阶段`
   - `Project 第一阶段`
   - `借抬头出口服务第一阶段`
2. 主轴入口均已具备真实桥接或稳定轻量落点
   - 邮件候选不再只是占位对象
   - 翻单快捷入口不再只是散点能力
3. 关键回看链已形成
   - 邮件线程可回看正式对象
   - `repeat_direct_order` 可回看正式订单执行摘要
   - `export_service_order` 可回看后段桥接摘要
4. 母稿已明确写出
   - 什么已完成
   - 什么仍待继续
   - 什么明确后移第二阶段

#### B. 第一阶段封板后仍允许的小范围动作

1. 小的规则压实
   - 例如状态映射、摘要文案、边界兼容
2. 母稿同步回写
   - 仅限与已落代码保持一致
3. 极小的展示收口
   - 仅限不新增大页面、不新增大系统的概览或回看补丁

#### C. 第一阶段封板后不应再做的事

1. 新开重页面或新系统
2. 把第二阶段事项重新拉回当前线程
3. 为追求“看起来完整”而硬接没有稳定底座的旧模块
4. 在未重新做主轴判断前，再横向扩主线对象数量

#### D. 第二阶段接手口径

后续如正式进入第二阶段，应按以下方式接手，而不是继续沿用第一阶段思路硬补：

1. `邮件工作台`
   - 从“轻量桥接”转向“真实邮箱接入 / 附件链 / 责任链治理”
2. `Project`
   - 从“最小项目控制层”转向“FAT / SAT / 风险 / 问题 / 甘特图”的工程化增强
3. `借抬头出口服务`
   - 从“前段对象 + 后段桥接”转向“客户侧可见状态、复杂财务模板、服务门户”
4. `翻单快捷入口`
   - 从“入口统一”转向“更完整的历史继承、价格继承、复购工作面”

最终判断：

- 若后续没有新的一级主轴变化，当前线程可以把第一阶段视为 `可封板状态`；
- 继续推进时，原则上应按“第二阶段接手口径”另开思路，而不是继续把第一阶段无限拉长。

### 3.9.7.8 第二阶段启动点（本轮）

为提高推进速度，第二阶段建议优先从 `Project` 线启动，而不是先碰邮箱接入或服务门户。

本轮已启动的第二阶段落点：

1. `Project 风险台账`
   - 已新增独立 `projectRiskLedgerService`；
   - 当前先落最小字段：
     - `riskTitle`
     - `riskCategory`
     - `riskLevel`
     - `owner`
     - `status`
     - `linkedMeetingId / linkedActionItemId`
2. `Project 问题清单`
   - 已新增独立 `projectIssueListService`；
   - 当前先落最小字段：
     - `issueTitle`
     - `issueStage`
     - `severity`
     - `owner`
     - `status`
     - `linkedMeetingId / linkedActionItemId`
3. `Project 第二阶段最小挂载`
   - 已直接挂入现有 `ProjectControlPanel`；
   - 当前采用与 `会议纪要 / 行动项 / 里程碑` 同口径的小面板模式；
   - 不新开独立项目系统，不从甘特图或完整 FAT/SAT 页面起步。

当前判断：

- `Project` 第二阶段已经开始从“工程化增强”进入真实对象落地；
- 当前最适合继续的顺序应是：
  - 先补 `风险台账 / 问题清单`
  - 再补 `FAT / SAT` 专属对象
  - 最后再考虑甘特图与偏差引擎

补充判断（本轮代码现状）：

- `Project 风险台账` 已具备最小正式对象底座：
  - `projectRiskLedgerService`
  - 已挂入 `ProjectControlPanel`
- `Project 问题清单` 已具备最小正式对象底座：
  - `projectIssueListService`
  - 已挂入 `ProjectControlPanel`
- `Project FAT` 已具备最小正式对象底座：
  - `projectFatService`
  - 当前先落 `fatTitle / fatScope / owner / status / linkedMilestoneId / linkedRiskId`
  - 已挂入 `ProjectControlPanel`
- `Project SAT` 已具备最小正式对象底座：
  - `projectSatService`
  - 当前先落 `satTitle / siteName / owner / status / linkedMilestoneId / linkedIssueId`
  - 已挂入 `ProjectControlPanel`
- `Project` 已开始补控制链摘要层：
  - 新增 `projectControlSummaryService`
  - 已把 `里程碑 / 风险 / 问题 / FAT / SAT` 收成统一摘要
  - 并在 `ProjectControlPanel` 顶部形成 `FAT / Shipment / SAT / Final Acceptance` 四段控制视图
- `Project` 已开始补最小联动规则：
  - 新增 `syncProjectControlState`
  - 当前会把 `风险 / 问题` 反作用到 `FAT / SAT / 里程碑` 状态
  - 先形成轻量同步，不急着做完整状态机
- `Project` 已开始补甘特图前置数据层：
  - 新增 `projectScheduleVarianceService`
  - 当前先落 `nodeName / nodeStage / owner / plannedStart / plannedEnd / actualStart / actualEnd / dependency / riskLevel / status`
  - 已挂入 `ProjectControlPanel`
  - 当前定位是 `计划/实际/偏差` 的最小正式对象底座，不是完整甘特图页面
- `Project` 已开始补偏差原因与依赖阻断规则：
  - `schedule variance` 已可自动回写 `varianceReasonSummary`
  - 当前会把 `风险 / 问题 / 里程碑状态 / dependency` 一并压成偏差原因摘要
  - 当前已支持最小 `dependency` 阻断判断，不再只是展示依赖字段
  - 当前 `FAT / Shipment / SAT / Final Acceptance` 四段控制摘要已开始吸收 `dependency` 阻断影响，不再只在节点明细里可见
  - 当前后续控制段已开始吸收前序控制段的阻断传导，形成最小 `attention / blocked` 级联判断
  - 当前控制摘要已开始给出 `Recommended Action`，用于指出最优先应解除的 blocker
  - 当前 `Recommended Action` 已开始落到具体对象层，可指向 `schedule node / risk / issue / FAT / SAT`
  - 当前 `Recommended Action` 已开始与对象列表高亮联动，不再只是顶部摘要提示
  - 当前推荐对象已可在现有控制面内直接推进一步，开始形成最小操作闭环
  - 当前推荐动作已开始留下最近触达记录，控制层已具备最小留痕能力
  - 当前最近触达记录已开始判断“是否真正推进”，不再只是静态操作日志
  - 当前 `Pending` 触达结果已开始反推到顶部摘要，可直接提示“最近处理过但尚未解除”的 blocker
  - 当前顶部建议已开始优先吸收“最近处理过但仍未解除”的 pending blocker，不再被新 blocker 直接覆盖
  - 当前 `pending blocker` 在下方对象列表里已具备比普通推荐项更高的视觉优先级，便于直接定位继续跟进对象
  - 当前 `pending blocker` 的动作按钮已统一切换为 `Follow Up Again` 语义，便于直接做二次跟进
  - 当前顶部摘要已开始直接显示“本次跟进相比上次是否更前进”的结果提示，便于快速判断二次跟进是否有效
  - 当前 `Follow-up Result` 已进一步压成 `已推进 / 有变化 / 首次跟进 / 无明显进展` 的直观结果状态，降低理解门槛
  - 当前若 `Follow-up Result = 无明显进展`，顶部建议会继续上提该对象，按更高优先级做升级跟进
  - 当前 `stalled follow-up` 在下方对象卡片里已与普通 `follow-up` 分层显示，并使用 `Escalate First / Escalate` 语义单独标识
  - 当前升级处理已开始留下 `Escalation Trace`，并在最近触达记录中单独标成 `Escalated`
  - 当前 `Escalation Trace` 已开始直接带出升级原因，如 `Still blocked by ...` 或 `连续跟进后仍未解除`
  - 当前被升级盯住的对象卡片内，也已可直接看到 `Escalation reason`，不必只回顶部查看
  - 当前升级原因已开始稳定分为 `依赖阻断 / 连续无进展 / 状态异常 / 未解除待升级` 四类口径，便于下一批次继续联动责任与建议动作
- 因此当前 `Project` 第二阶段已不再只是规则准备，而是已进入：
  - `会议纪要 / 行动项 / 里程碑 / 风险 / 问题 / FAT / SAT`
  - `计划/实际偏差`
  八类对象并行存在，并开始形成联动摘要的轻量工程化控制层。

- `Project` 第二阶段当前批次收口判断（本轮）：
  - 当前这一批次已基本完成从 `对象底座 -> 联动摘要 -> 跟进动作 -> 跟进结果 -> 升级处理 -> 升级留痕` 的闭环搭建；
  - 当前已可满足 `项目负责人快速判断哪里卡住 / 先处理谁 / 是否推进 / 是否需要升级` 的轻量控制需求；
  - 因此当前批次已接近 `可阶段封板`，不宜继续在这一批次内横向扩写大页面、完整甘特图、完整状态机或复杂审批流；
  - 当前若继续推进，原则上只应做两类小动作：
    - `收口类`：少量文案统一、展示颗粒度统一、少量规则补齐；
    - `交接类`：为下一批次明确对象边界、入口边界和实现顺序；
  - 当前不建议在本批次继续展开：
    - 完整甘特图绘制器；
    - 完整项目审批链；
    - 大型门户式项目总览页面；
    - 复杂跨模块自动化事件总线；
  - 下一批次若继续沿 `Project` 线推进，建议顺序为：
    - 先补 `升级原因分类` 的更稳定口径；
    - 再补 `下一步建议动作` 与责任人的更细联动；
    - 最后再评估是否值得进入更完整的项目总览或甘特图工作面。

- `Project` 第二阶段当前批次封板口径（本轮）：
  - 结合当前代码现状与母稿落点，现可将本批次判断为 `可封板状态`；
  - 所谓 `可封板状态`，是指当前已达到：
    - 有稳定对象底座；
    - 有最小控制摘要；
    - 有最小动作闭环；
    - 有最小升级判断与留痕；
    - 有足够支撑项目负责人日常盯办的控制信息；
  - 自本条写回后，当前批次不再建议继续新增：
    - 新对象大类；
    - 新的大型展示页；
    - 完整甘特图绘制能力；
    - 跨模块复杂自动化流；
  - 自本条写回后，若仍需在本批次内补动，仅允许：
    - 极小文案统一；
    - 极小展示对齐；
    - 已落逻辑的母稿同步；
  - 若后续继续沿 `Project` 线推进，应默认视为进入 `下一批次`，而不是继续拖长当前批次。

- `Project` 下一批次启动点（本轮）：
  - 已开始补 `下一步建议动作` 与责任人的最小联动；
  - 当前顶部 `Recommended Action` 已开始直接带出对应对象的 `Owner`，便于项目负责人先知道该找谁推进；
  - 当前 `Pending Follow-up / Escalation Trace` 也已开始直接带出对应对象责任人，且高亮对象卡片内已同步显示 `Owner` 提示，便于从顶部提醒直接落到具体处理人；
  - 当前顶部摘要已开始把责任人信息继续压成 `Owner Action` 式提示，不只显示“是谁”，也开始直接提示“这个人现在该继续跟进 / 推动 / 升级处理什么”；
  - 当前 `Owner Action` 已开始与 `Follow-up Result` 做最小闭环对照，顶部可直接看到“该责任人跟进后当前结果如何”，不再只停留在动作提示；
  - 当前 `Owner Result` 也已进一步压成直观状态标签，项目负责人不看长句也能快速判断责任人跟进后是 `已推进 / 有变化 / 首次跟进 / 无明显进展`；
  - 当前顶部摘要已开始补 `Owner Focus`，可直接看到当前重点责任人手上共有多少待推进项、其中多少已处于卡点或高风险状态，以及最近有多少项属于“跟进后仍未推进”；
  - 当前仍保持轻量控制层做法，不新开责任管理大页面。

- `Project` 下一批次当前轮次收口判断（本轮）：
  - 结合当前代码现状，当前轮次已基本完成从 `推荐对象 -> 责任人 -> 动作提示 -> 跟进结果 -> 责任人结果` 的最小责任闭环；
  - 当前已可满足项目负责人在轻量控制层内快速判断：
    - 当前最该找谁；
    - 这个人现在该做什么；
    - 这个人跟进后是否真正推进；
  - 因此当前轮次已接近 `可阶段收住`，不宜继续在本轮内横向扩写新的责任管理大页、复杂升级流或完整责任待办体系；
  - 当前轮次若还继续补动，原则上只应限于：
    - 极小文案统一；
    - 极小展示收口；
    - 已落逻辑的母稿同步；
  - 若后续仍需沿 `Project` 下一批次继续推进，应默认转入下一轮，而不是继续拖长当前轮次。

- `Project` 下一批次当前轮次封板口径（本轮）：
  - 结合当前代码现状与母稿落点，现可将当前轮次判断为 `可封板状态`；
  - 所谓 `可封板状态`，是指当前已经具备：
    - `推荐对象`
    - `责任人`
    - `责任动作提示`
    - `跟进结果`
    - `责任结果`
    - `责任人负载摘要`
    这一条最小责任控制链；
  - 当前已经够项目负责人在轻量控制层内完成：
    - 快速判断先找谁；
    - 快速判断该人现在该做什么；
    - 快速判断跟进后是否有推进；
    - 快速判断该责任人手上当前负载是否已偏重；
  - 自本条写回后，当前轮次不再建议继续新增：
    - 新责任对象大类；
    - 新责任管理工作面；
    - 复杂责任待办箱体系；
    - 跨模块责任自动分发流；
  - 自本条写回后，若仍需在当前轮次内补动，仅允许：
    - 极小文案统一；
    - 极小展示对齐；
    - 已落逻辑的母稿同步；
  - 若后续仍需沿 `Project` 下一批次推进，应默认视为进入 `再下一轮`，而不是继续拖长当前轮次。

- `Project` 再下一轮收口判断（本轮）：
  - 结合当前代码现状，`再下一轮` 已基本完成从 `责任人 -> 责任动作 -> 责任结果 -> 责任人负载 -> 连续催办无进展识别` 的轻量责任控制补强；
  - 当前已可满足项目负责人在顶部轻量控制层内快速判断：
    - 当前最该盯的责任人是谁；
    - 这个人现在该做什么；
    - 跟进后是否真的往前推进；
    - 这个人手上当前是否已经堆积过多待推进项；
    - 最近是否已经出现连续催办但仍未推进的信号；
  - 因此当前这一轮也已接近 `可阶段收住`，不宜继续在本轮内横向扩写：
    - 新责任工作面；
    - 复杂责任待办体系；
    - 责任自动分发引擎；
    - 更大的项目指挥门户；
  - 当前这一轮若还继续补动，原则上只应限于：
    - 极小文案统一；
    - 极小展示对齐；
    - 已落逻辑的母稿同步；
  - 若后续仍需沿 `Project` 线继续推进，应默认进入 `再下一轮后的下一轮`，而不是继续拖长当前这一轮。

- `Project` 再下一轮封板口径（本轮）：
  - 结合当前母稿落点与代码现状，现可将 `再下一轮` 判断为 `可封板状态`；
  - 所谓 `可封板状态`，是指当前已经具备：
    - `推荐对象`
    - `责任人`
    - `责任动作提示`
    - `跟进结果`
    - `责任结果`
    - `责任人负载摘要`
    - `连续催办未推进识别`
    这一条更完整的轻量责任控制链；
  - 当前已经够项目负责人在现有 `ProjectControlPanel` 内完成日常轻量盯办，不应在这一轮继续扩成新系统；
  - 自本条写回后，当前这一轮不再建议继续新增：
    - 新责任对象大类；
    - 新责任工作台；
    - 跨模块自动催办与升级流；
    - 更重的项目总览门户；
  - 自本条写回后，若仍需在当前这一轮内补动，仅允许：
    - 极小文案统一；
    - 极小展示收口；
    - 已落逻辑的母稿同步；
  - 若后续仍要继续推进 `Project` 线，默认应进入下一轮新目标，而不是继续拖长当前轮次。

补充判断（本轮代码现状）：

- `借抬头服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` 四个对象，现已具备最小 service 骨架；
- 当前已挂接正式入口：
  - `Sales_Rep` 侧可手工创建服务委托单；
  - 邮件工作台中的 `export_service_order` 候选已可真实创建服务委托单；
  - 邮件工作台中的 `repeat_direct_order` 候选已可真实创建 `直下单草稿`，并进入现有 `CreateOrder` 工作面；
  - `CreateOrder` 提交时已可通过 `OrderContext` 进入正式订单执行链，并保留旧 `activeOrders` 兼容镜像；
  - 正式订单状态已可反写到 `直下单草稿` 摘要，并在邮件线程详情里回看；
  - 邮件工作台线程详情 / 候选面板已可回看正式借抬头服务委托单状态与桥接摘要；
  - 当借抬头服务委托单进入关键收口状态时，邮件线程与分发记录已可按轻量规则自动收口；
- 当前已补第一层后段桥接台账：
  - 新建服务委托单时会同步初始化 `Shipment / Docs / Payment / Payable` 四类桥接槽位；
  - `服务费应收记录 / 代收代付运费记录` 已同步生成可供后续财务工作面识别的引用键；
- 当前已开始并入现有财务工作面：
  - 新建服务委托单时会同步生成可被 `PayableManagement` 读取的应付桥接记录；
  - 新建服务委托单时会同步生成可被 `PaymentRecordManagement` 读取的付款桥接记录；
- 当前已开始并入现有交付/单证工作面：
  - 新建服务委托单时会同步生成可被 `ShipmentManagement` 读取的发货桥接记录；
  - 新建服务委托单时会同步生成可被 `DocumentationWorkbenchUltimate` 总览统计读取的单证桥接记录；
  - `DocumentationWorkbenchUltimate` 已补最小桥接推进面板，可在现有单证工作面内逐步推进 `Docs` 桥接状态，并回写服务委托桥接摘要；
  - `ShipmentManagement / PaymentRecordManagement / PayableManagement` 的桥接推进动作已开始自动带动 `Docs` 关键节点对齐，不再完全依赖手工逐步推进；
  - 服务委托根对象 `serviceStatus` 已开始随 `Shipment / Docs / Payment / Payable` 的桥接汇总自动抬升，不再只停留在创建时前段手填状态；
- 因此当前更适合判断为：
  - `第一阶段最小入口已完成`
  - `Payment / Payable 已进入现有工作面桥接阶段`
  - `Shipment / Docs 已进入现有工作面桥接阶段`

## 4.7 三条新线的实现准备排序与对象落点总表（本轮）

在本稿已完成第一轮收口后，后续推进建议不再继续扩写概念，而是直接进入“实现准备排序与对象落点设计”。

### 4.7.1 总排序建议

建议后续实现准备按如下顺序推进：

1. `邮件工作台第一阶段`
2. `Project 第一阶段`
3. `借抬头出口服务第一阶段`

排序原因：

- `邮件工作台` 是入口增强层，会影响询价、翻单、项目纪要、服务委托等多个入口；
- `Project` 已有较强 `project revision` 底座，补三对象后能较快形成项目管理最小闭环；
- `借抬头出口服务` 后段底座也已较强，但前段对象更专用、业务频次相对更窄，适合排在第三步。

### 4.7.2 三条线对象落点总表

| 线别 | 第一阶段最小对象 | 主要挂接现有模块 | 主要使用角色 | 第一阶段目标 |
|---|---|---|---|---|
| `邮件工作台第一阶段` | `邮件线程 / 邮件附件清单 / 邮件候选业务对象 / 邮件分发记录 / mail_links` | `AdminDashboard / Workbench入口 / SalesTodoCenter风格工作箱 / 现有正式业务对象` | 全员内部用户，重点为 `Sales_Rep / Procurement / QC / Order_Coordinator / Documentation_Officer / Finance / Manager / CEO` | 把外部邮件吸入 ERP，并进入责任链与业务链 |
| `Project 第一阶段` | `项目会议纪要 / 项目行动项 / 项目里程碑` | `customerProductLibrary / ProjectProductForm / MyProducts / MyProductsSelector / QT-XJ-SC-PR-CG 项目修订基线链` | `Sales_Rep / 项目Owner / Regional_Manager / QC / Documentation_Officer` | 在现有 project revision 底座上形成项目推进最小闭环 |
| `借抬头出口服务第一阶段` | `借抬头服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` | `InspectionManagementComplete / postContractExecutionServices / purchaseOrderQuoteRequirementServices / ServiceProviderManagement / PaymentRecordManagement / PayableManagement` | `Sales_Rep / Order_Coordinator / Finance / Documentation_Officer` | 不重做后段执行底座，只补前段服务对象与财务口径 |

### 4.7.3 三条线的落点原则

`邮件工作台第一阶段`

- 作为 ERP 入口增强层；
- 不替代正式业务模块；
- 先形成 `责任链 + 候选对象 + 关联正式业务对象`。

`Project 第一阶段`

- 先承接现有 `project revision` 强底座；
- 不重做项目技术版本管理；
- 先补项目管理层 3 个轻量对象，再考虑工程化增强。

`借抬头出口服务第一阶段`

- 先复用后段订舱、交单、放单、付款控制；
- 不把它混入普通贸易卖货链；
- 只补前段服务委托与财务口径对象。

### 4.7.4 对象设计推进顺序建议

建议后续对象设计按下面顺序推进：

1. `邮件线程 / 邮件候选业务对象 / 邮件分发记录`
2. `项目会议纪要 / 项目行动项 / 项目里程碑`
3. `借抬头服务委托单 / 抬头文件记录`
4. `服务费应收记录 / 代收代付运费记录`

排序原因：

- 先做入口和责任链；
- 再做项目管理最小闭环；
- 再做服务型前段对象；
- 最后做服务型财务拆分对象。

### 4.7.5 现阶段结论

- 本稿当前已足够支撑“实现准备排序与对象落点设计”；
- 若后续进入实现准备，不建议再继续纯文档扩写；
- 后续应切换到：
  - `对象设计`
  - `现有模块挂接设计`
  - `入口放置设计`
  - `实现优先级排期`

## 4.8 邮件工作台第一阶段对象设计（第一版）

本节只讨论对象设计，不讨论 UI 设计。

这里的“对象设计”指：

- 要落哪些主对象
- 每个对象最小字段是什么
- 对象之间怎么关联
- 对象如何挂接到现有 ERP 正式业务对象

### 4.8.1 对象设计范围

邮件工作台第一阶段建议只先落 3 个核心对象：

1. `邮件线程`
2. `邮件候选业务对象`
3. `邮件分发记录`

另配一个轻量关联对象：

4. `mail_links`

第一阶段不建议单独扩成更多对象，例如：

- 自动摘要对象
- AI 回复对象
- 独立 SLA 对象
- 附件结构化抽取对象

这些都应留在第二阶段或后续增强阶段。

### 4.8.2 对象一：邮件线程

`邮件线程` 是第一阶段根对象。

建议职责：

- 承接企业邮箱同步进来的线程；
- 作为所有后续动作的源头对象；
- 统一挂接客户、项目、订单、候选对象、分发记录。

建议最小字段：

- `mail_thread_id`
- `provider_name`
- `provider_thread_key`
- `subject`
- `latest_message_at`
- `first_message_at`
- `latest_sender_email`
- `latest_sender_name`
- `participant_emails`
- `mailbox_account`
- `thread_status`
- `has_attachments`
- `attachment_count`
- `linked_customer_id`
- `linked_project_id`
- `linked_order_id`
- `current_dispatch_id`
- `created_at`
- `updated_at`

建议说明：

- `provider_thread_key`
  - 用于和 Gmail / Outlook / IMAP 线程对应；
- `thread_status`
  - 用于表达线程整体状态；
- `linked_customer_id / linked_project_id / linked_order_id`
  - 是线程级快速关联，不替代更细粒度 `mail_links`。

### 4.8.3 对象二：邮件候选业务对象

`邮件候选业务对象` 是第一阶段的中间对象，不是正式业务对象。

建议职责：

- 承接“这封邮件看起来像什么业务”的判断；
- 支持人工确认；
- 支持转成正式业务对象或挂接已有业务对象。

建议最小字段：

- `mail_candidate_id`
- `source_thread_id`
- `mail_candidate_type`
- `suggested_target_object_type`
- `candidate_summary`
- `candidate_note`
- `candidate_status`
- `suggested_owner_user_id`
- `confirmed_target_object_id`
- `confirmed_target_object_type`
- `confirmed_by`
- `confirmed_at`
- `rejected_reason`
- `created_at`
- `updated_at`

建议候选类型第一阶段先只支持：

- `ing`
- `reorder_inquiry`
- `reorder_direct_order`
- `project_meeting_minutes`
- `project_action_item`
- `export_service_order`
- `docs_task`

关键边界：

- `confirmed`
  - 表示邮件应该进入某条业务链；
- `converted`
  - 表示已挂接或已生成正式业务对象；
- 不应把 `候选对象确认` 写成正式业务审批。

### 4.8.4 对象三：邮件分发记录

`邮件分发记录` 是责任链对象。

建议职责：

- 承接分发、签收、转派、升级；
- 记录当前谁在处理；
- 形成邮件内部协同责任链。

建议最小字段：

- `mail_dispatch_id`
- `mail_thread_id`
- `dispatch_type`
- `from_user_id`
- `to_user_id`
- `to_role`
- `to_department`
- `dispatch_status`
- `priority`
- `reason`
- `due_at`
- `accepted_by`
- `accepted_at`
- `escalated_to_user_id`
- `escalated_at`
- `resolved_at`
- `closed_at`
- `created_at`
- `updated_at`

建议分发类型：

- `direct_assign`
- `department_queue`
- `reassign`
- `escalation`
- `cc_watch`

关键边界：

- 同一线程允许有多条历史分发记录；
- 同一时间只应有一条当前有效责任记录；
- `resolved` 不等于线程关闭；
- `closed` 表示该条分发责任链闭环。

### 4.8.5 对象四：mail_links

`mail_links` 是轻量关联对象，用于把邮件线程或候选对象与现有 ERP 正式业务对象挂接。

建议职责：

- 统一管理邮件与客户/项目/订单/正式业务对象的关系；
- 支持一封线程同时挂多个对象；
- 支持正式业务对象反查原始线程。

建议最小字段：

- `mail_link_id`
- `mail_thread_id`
- `mail_candidate_id`
- `linked_object_type`
- `linked_object_id`
- `link_scope`
- `linked_by`
- `linked_at`
- `is_primary`

建议 `linked_object_type` 第一阶段先支持：

- `customer`
- `project`
- `inquiry`
- `quotation`
- `contract`
- `shipment`
- `docs_task`
- `service_order`

建议 `link_scope`：

- `thread_level`
- `candidate_level`
- `final_object_level`

### 4.8.6 四个对象之间的关系

建议关系如下：

```text
邮件线程
├── 邮件分发记录（1对多）
├── 邮件候选业务对象（1对多）
└── mail_links（1对多）

邮件候选业务对象
└── mail_links（0到多）
```

关系结论：

- `邮件线程` 是根；
- `邮件分发记录` 负责责任链；
- `邮件候选业务对象` 负责转业务判断；
- `mail_links` 负责把线程/候选对象挂到正式业务链。

### 4.8.7 与现有 ERP 正式业务对象的挂接规则

第一阶段建议只支持这些挂接：

- 邮件线程 -> `客户开发 / ING`
- 邮件线程 -> `翻单询价`
- 邮件线程 -> `翻单直下单`
- 邮件线程 -> `项目会议纪要`
- 邮件线程 -> `项目行动项`
- 邮件线程 -> `借抬头服务委托单`
- 邮件线程 -> `单证任务`

挂接原则：

- 邮件工作台不自己发明新的正式主链；
- 只把邮件接入已定义的业务对象；
- 若对应正式对象还未实现，则先停在候选对象层，不强行建空对象。

### 4.8.8 第一阶段对象设计结论

- 邮件工作台第一阶段不需要大对象体系；
- 只要把 `邮件线程 / 邮件候选业务对象 / 邮件分发记录 / mail_links` 4 个对象设计稳，就足以支撑第一阶段实现准备；
- 后续不管是不是 Codex 来做 UI，都应该先以这 4 个对象为实现基础。

## 4.9 Project 第一阶段对象设计（第一版）

本节只讨论对象设计，不讨论 UI 设计。

这里的“对象设计”指：

- `项目会议纪要`
- `项目行动项`
- `项目里程碑`

这 3 个对象如何建立、如何关联、如何挂接到现有 `project revision` 底座和统一贸易主轴。

### 4.9.1 对象设计范围

Project 第一阶段建议只先落 3 个核心对象：

1. `项目会议纪要`
2. `项目行动项`
3. `项目里程碑`

第一阶段不建议单独扩成更多对象，例如：

- `FAT 主对象`
- `SAT 主对象`
- `项目移交文件包主对象`
- `项目风险台账`
- `项目问题清单`
- 完整甘特图对象体系

这些都应留在第二阶段或后续增强阶段。

### 4.9.2 对象一：项目会议纪要

`项目会议纪要` 是 Project 第一阶段的沟通主对象。

建议职责：

- 承接项目型客户在执行期间的正式沟通记录；
- 记录会议摘要、决定项、行动项来源、与项目修订版本的关系；
- 作为行动项和后续问题闭环的源头对象。

建议最小字段：

- `meeting_id`
- `projectId`
- `projectCode`
- `projectName`
- `projectRevisionId`
- `projectRevisionCode`
- `meeting_type`
- `meeting_title`
- `meeting_time`
- `host`
- `internal_participants`
- `customer_participants`
- `supplier_participants`
- `summary`
- `decision_items`
- `meeting_status`
- `minutes_url`
- `created_by`
- `created_at`
- `updated_at`

建议 `meeting_type` 第一阶段先支持：

- `requirement_clarification`
- `drawing_review`
- `project_weekly`
- `fat_preparation`
- `shipment_coordination`
- `sat_issue_review`
- `final_acceptance`

关键边界：

- 会议纪要是项目沟通对象，不等于项目状态本身；
- 会议纪要中的决定项，应进一步转成 `项目行动项`；
- 第一阶段不要求会议纪要自动改变项目主轴状态。

### 4.9.3 对象二：项目行动项

`项目行动项` 是 Project 第一阶段的执行对象。

建议职责：

- 承接会议决定项、整改项、客户待确认项；
- 用于跟踪负责人、截止时间、完成情况；
- 形成会议纪要到项目推进的最小闭环。

建议最小字段：

- `action_item_id`
- `projectId`
- `projectCode`
- `projectRevisionId`
- `projectRevisionCode`
- `meeting_id`
- `action_type`
- `action_title`
- `action_description`
- `owner_user_id`
- `owner_role`
- `due_at`
- `action_status`
- `priority`
- `related_object_type`
- `related_object_id`
- `closed_note`
- `closed_at`
- `created_by`
- `created_at`
- `updated_at`

建议 `action_type` 第一阶段先支持：

- `decision_followup`
- `drawing_revision`
- `customer_confirmation`
- `fat_rectification`
- `sat_rectification`
- `document_completion`
- `shipment_coordination`

关键边界：

- `项目行动项` 不替代正式业务单据；
- 行动项是项目推进的执行细胞，不是采购单、合同单、Shipment 单；
- 第一阶段行动项允许挂接已有正式对象，但不强制所有行动项都必须挂正式对象。

### 4.9.4 对象三：项目里程碑

`项目里程碑` 是 Project 第一阶段的进度控制对象。

建议职责：

- 承接项目简单工作节点的计划/实际控制；
- 支撑列表视图与后续甘特图增强；
- 为项目阶段总结、偏差分析、关键路径识别提供底座。

建议最小字段：

- `milestone_id`
- `projectId`
- `projectCode`
- `projectName`
- `projectRevisionId`
- `projectRevisionCode`
- `milestone_name`
- `milestone_stage`
- `owner_user_id`
- `owner_role`
- `planned_start`
- `planned_end`
- `actual_start`
- `actual_end`
- `milestone_status`
- `dependency`
- `risk_level`
- `is_key_milestone`
- `customer_confirmation_required`
- `customer_confirmation_status`
- `created_by`
- `created_at`
- `updated_at`

建议 `milestone_stage` 第一阶段先对齐主稿已有项目主轴，例如：

- `project_setup`
- `requirement_clarification`
- `solution_and_sourcing`
- `quotation`
- `customer_confirmation`
- `contract_kickoff`
- `spec_freeze`
- `procurement_and_manufacturing`
- `fat_and_pre_shipment_check`
- `shipment_and_site_delivery`
- `installation_and_sat`
- `final_acceptance`

关键边界：

- 第一阶段里程碑不等于完整甘特图；
- 里程碑对象先解决“计划/实际/责任/依赖/关键节点”；
- 第二阶段再扩成更复杂的时间轴、偏差分析和视图引擎。

### 4.9.5 三个对象与现有底座的关系

Project 第一阶段必须统一挂在现有 `project revision` 底座上。

建议关系如下：

```text
project revision
├── 项目会议纪要（1对多）
├── 项目行动项（1对多）
└── 项目里程碑（1对多）

项目会议纪要
└── 项目行动项（1对多）
```

关系结论：

- `projectId + projectRevisionId` 是第一阶段统一技术基线；
- `项目会议纪要` 是沟通源头；
- `项目行动项` 是执行闭环；
- `项目里程碑` 是进度控制对象；
- 三者都不应另起一套项目版本体系。

### 4.9.6 与统一主轴的挂接规则

第一阶段建议先支持这些挂接：

- `项目会议纪要`
  - 可挂：
    - `QT`
    - `SC`
    - `CG`
    - `Shipment`
    - `Docs`
- `项目行动项`
  - 可挂：
    - `QT`
    - `SC`
    - `CG`
    - `QC`
    - `Shipment`
    - `Docs`
- `项目里程碑`
  - 对齐项目主稿的 12 个简单工作节点
  - 但不直接替代统一主轴里的正式对象状态

挂接原则：

- Project 第一阶段对象是“项目控制层”，不是“贸易单据层”；
- 挂接到统一主轴时，应作为增强层存在；
- 不应反过来修改现有 `QT / SC / PR / CG / Shipment / Docs` 的核心主对象结构。

### 4.9.7 Project 第一阶段对象设计结论

- Project 第一阶段也不需要大而全的项目系统；
- 只要把 `项目会议纪要 / 项目行动项 / 项目里程碑` 3 个对象设计稳，就足以支撑第一阶段实现准备；
- 后续无论是不是 Codex 来做 UI，都应先以这 3 个对象为实现基础，再谈 FAT、SAT、风险、问题、甘特图等第二阶段增强。

补充（本轮代码现状）：

- 这 3 个对象对应的最小 service 骨架已经落代码；
- 当前采用独立文件拆分：
  - `projectMeetingService`
  - `projectActionItemService`
  - `projectMilestoneService`
  - `projectStorage`
  - `projectTypes`
- 这一步说明对象设计已从“纯文档层”进入“代码骨架层”；
- 本轮已完成与现有 `project revision` 详情面的最小挂接；
- 下一步重点不应继续扩对象，而应先做好：
  - 当前入口收口
  - 第二阶段边界控制
  - 是否需要新增独立项目中心入口的后续判断。

## 4.10 借抬头出口服务第一阶段对象设计（第一版）

本节只讨论对象设计，不讨论 UI 设计。

这里的“对象设计”指：

- `借抬头服务委托单`
- `抬头文件记录`
- `服务费应收记录`
- `代收代付运费记录`

这 4 个对象如何建立、如何关联、如何挂接到现有订舱、单证、放单、付款底座。

### 4.10.1 对象设计范围

借抬头出口服务第一阶段建议只先落 4 个核心对象：

1. `借抬头服务委托单`
2. `抬头文件记录`
3. `服务费应收记录`
4. `代收代付运费记录`

第一阶段不建议单独扩成更多对象，例如：

- 完整服务门户对象
- 复杂服务型项目计划对象
- 多账簿会计对象
- 客户侧服务过程可视化对象

这些都应留在第二阶段或后续增强阶段。

### 4.10.2 对象一：借抬头服务委托单

`借抬头服务委托单` 是这条线的前段主对象。

建议职责：

- 承接客户邮件或线下提出的借抬头服务委托；
- 记录第三方供应商、FOB 条件、是否订舱、是否客户自保、是否进入后段执行；
- 作为抬头文件、服务费、代收代付运费三类对象的根对象。

建议最小字段：

- `service_order_id`
- `customer_id`
- `customer_segment`
- `business_flow_template`
- `service_order_type`
- `cargo_owner`
- `external_supplier_name`
- `supplier_trade_term`
- `goods_payment_handled_by_us`
- `booking_required`
- `insurance_handled_by_customer`
- `customs_export_cost_borne_by_supplier`
- `service_order_status`
- `source_mail_thread_id`
- `owner_user_id`
- `created_by`
- `created_at`
- `updated_at`

关键边界：

- 该对象不是普通贸易销售单；
- 它承接的是“服务委托事实”，不是货款销售事实；
- 第一阶段不应把这类对象直接混进普通 `SC / PO` 口径。

### 4.10.3 对象二：抬头文件记录

`抬头文件记录` 是借抬头服务中的文件控制对象。

建议职责：

- 记录我司抬头生成的 `Proforma / Sales Contract / 其他辅助文件`；
- 记录版本、状态、客户确认情况；
- 为后段订舱与单证链提供前段文件依据。

建议最小字段：

- `document_record_id`
- `service_order_id`
- `document_type`
- `document_version`
- `document_title`
- `document_status`
- `customer_confirmation_status`
- `customer_confirmation_comment`
- `customer_confirmed_at`
- `generated_by`
- `generated_at`
- `updated_at`

建议 `document_type` 第一阶段先支持：

- `proforma`
- `sales_contract`
- `shipping_instruction_support`
- `other_supporting_doc`

关键边界：

- 这类记录是“借抬头文件控制对象”，不是正式贸易合同主对象；
- 第一阶段先解决文件版本与客户确认，不直接接复杂模板中心能力。

### 4.10.4 对象三：服务费应收记录

`服务费应收记录` 是借抬头服务中的收入对象。

建议职责：

- 独立记录我司真正服务收入；
- 区别于普通贸易货款；
- 支撑财务侧“服务费收入”单独识别。

建议最小字段：

- `service_fee_record_id`
- `service_order_id`
- `customer_id`
- `service_fee_amount`
- `currency`
- `receivable_status`
- `invoice_status`
- `invoice_no`
- `received_at`
- `created_by`
- `created_at`
- `updated_at`

关键边界：

- 服务费记录不应被误记为货款应收；
- 第一阶段先支持最基本的应收与开票状态，不必扩成复杂财务引擎。

### 4.10.5 对象四：代收代付运费记录

`代收代付运费记录` 是借抬头服务中的代收代付对象。

建议职责：

- 记录客户向我司支付的运费；
- 记录我司向货代支付的运费；
- 将该部分和服务收入、货款彻底区分。

建议最小字段：

- `freight_settlement_id`
- `service_order_id`
- `customer_id`
- `forwarder_id`
- `freight_collect_amount`
- `freight_collected_at`
- `freight_payable_amount`
- `freight_paid_at`
- `settlement_status`
- `booking_quote_reference`
- `created_by`
- `created_at`
- `updated_at`

关键边界：

- 代收代付运费不应直接并入服务费收入；
- 代收代付运费也不应误并入普通贸易货款。

### 4.10.6 四个对象之间的关系

建议关系如下：

```text
借抬头服务委托单
├── 抬头文件记录（1对多）
├── 服务费应收记录（1对多）
└── 代收代付运费记录（1对多）
```

关系结论：

- `借抬头服务委托单` 是根；
- `抬头文件记录` 负责文件链；
- `服务费应收记录` 负责收入链；
- `代收代付运费记录` 负责运费往来链。

### 4.10.7 与现有后段执行底座的挂接规则

第一阶段建议先支持这些挂接：

- `借抬头服务委托单`
  - 挂接：
    - `InspectionManagementComplete` 的订舱与运费确认链
    - `Shipment`
    - `Docs`
- `代收代付运费记录`
  - 挂接：
    - `ServiceProviderManagement`
    - `PaymentRecordManagement / PayableManagement`
- `服务费应收记录`
  - 挂接：
    - 财务侧服务费应收口径
- `抬头文件记录`
  - 挂接：
    - 前段客户确认
    - 后段出运与单证支持

挂接原则：

- 第一阶段后段一律复用现有：
  - `订舱前决策`
  - `Shipment`
  - `Docs`
  - `Payment` 控制
- 第一阶段新对象不替代现有后段控制，只提供前段服务事实和财务拆分口径。

### 4.10.8 借抬头出口服务第一阶段对象设计结论

- 借抬头出口服务第一阶段同样不需要大而全的独立系统；
- 只要把 `借抬头服务委托单 / 抬头文件记录 / 服务费应收记录 / 代收代付运费记录` 4 个对象设计稳，就足以支撑第一阶段实现准备；
- 后续无论是不是 Codex 来做 UI，都应先以这 4 个对象为实现基础，再谈客户侧服务链、复杂财务模板或完整服务门户。

补充（本轮代码现状）：

- 这 4 个对象对应的最小 service 骨架已经落代码；
- 当前采用独立文件拆分：
  - `exportServiceOrderService`
  - `exportHeaderDocumentService`
  - `exportServiceFeeService`
  - `exportFreightSettlementService`
  - `exportServiceStorage`
  - `exportServiceTypes`
- 这一步说明对象设计已从“纯文档层”进入“代码骨架层”；
- 下一步重点不应继续扩对象，而应先完成与现有销售可触达入口或邮件工作台入口的最小挂接。

## 4.11 第一阶段对象设计总表（本轮）

本节用于把三条第一阶段主线的对象设计压成一张统一总表，便于后续做实现排序、依赖判断和最小闭环判断。

### 4.11.1 三条线对象总表

| 线别 | 第一阶段对象 | 对象角色 | 主要依赖现有底座 | 第一阶段必要性 |
|---|---|---|---|---|
| `邮件工作台第一阶段` | `邮件线程` | 根对象 | 企业邮箱接入、ERP 入口、现有正式业务对象 | 必做 |
| `邮件工作台第一阶段` | `邮件候选业务对象` | 转业务中间对象 | `邮件线程`、现有正式业务对象 | 必做 |
| `邮件工作台第一阶段` | `邮件分发记录` | 责任链对象 | `邮件线程`、现有待办中心工作方式 | 必做 |
| `邮件工作台第一阶段` | `mail_links` | 关联对象 | `邮件线程`、`邮件候选业务对象`、正式业务对象 | 必做 |
| `Project 第一阶段` | `项目会议纪要` | 沟通源头对象 | `project revision`、客户产品库、项目修订链 | 必做 |
| `Project 第一阶段` | `项目行动项` | 执行闭环对象 | `项目会议纪要`、`project revision` | 必做 |
| `Project 第一阶段` | `项目里程碑` | 进度控制对象 | `project revision`、统一主轴阶段 | 必做 |
| `借抬头出口服务第一阶段` | `借抬头服务委托单` | 根对象 | 客户主档、业务模板切换、后段执行底座 | 必做 |
| `借抬头出口服务第一阶段` | `抬头文件记录` | 文件控制对象 | `借抬头服务委托单` | 必做 |
| `借抬头出口服务第一阶段` | `服务费应收记录` | 收入对象 | `借抬头服务委托单`、财务口径 | 必做 |
| `借抬头出口服务第一阶段` | `代收代付运费记录` | 运费往来对象 | `借抬头服务委托单`、服务商与付款底座 | 必做 |

### 4.11.2 对象依赖顺序

建议按下面顺序理解依赖关系：

#### A. 邮件工作台

```text
邮件线程
-> 邮件分发记录
-> 邮件候选业务对象
-> mail_links
-> 正式业务对象
```

依赖结论：

- 没有 `邮件线程`，其他对象无从挂接；
- 没有 `邮件分发记录`，第一阶段责任链不成立；
- 没有 `邮件候选业务对象`，邮件无法进入业务链；
- `mail_links` 是挂接层，排在候选对象之后。

#### B. Project 第一阶段

```text
project revision
-> 项目会议纪要
-> 项目行动项
-> 项目里程碑
```

依赖结论：

- `project revision` 是第一阶段技术基线；
- `项目会议纪要` 先于 `项目行动项`；
- `项目里程碑` 可与会议纪要并行设计，但实现上可稍后于纪要对象。

#### C. 借抬头出口服务第一阶段

```text
借抬头服务委托单
-> 抬头文件记录
-> 服务费应收记录
-> 代收代付运费记录
```

依赖结论：

- `借抬头服务委托单` 是根；
- `抬头文件记录` 最贴近前段业务事实；
- `服务费应收记录` 和 `代收代付运费记录` 都应依附服务委托单；
- `代收代付运费记录` 还依赖现有服务商与付款底座。

### 4.11.3 最小闭环判断

建议后续实现时，用“是否形成最小闭环”来判断第一阶段是否完成，而不是用“做了多少页面”来判断。

`邮件工作台第一阶段` 最小闭环：

- 有 `邮件线程`
- 有 `邮件分发记录`
- 有 `邮件候选业务对象`
- 可通过 `mail_links` 挂接正式业务对象

`Project 第一阶段` 最小闭环：

- 有 `项目会议纪要`
- 有 `项目行动项`
- 有 `项目里程碑`
- 三者统一挂在 `project revision` 底座上

`借抬头出口服务第一阶段` 最小闭环：

- 有 `借抬头服务委托单`
- 有 `抬头文件记录`
- 有 `服务费应收记录`
- 有 `代收代付运费记录`
- 能挂接现有后段订舱、单证、付款底座

### 4.11.4 对象设计总判断

- 三条线的第一阶段对象，现在都已经清楚到可以进入实现准备；
- 后续若继续推进，不建议再先补 UI 细节；
- 更合理的下一步，是开始做：
  - `对象落点设计`
  - `与现有模块挂接设计`
  - `实现顺序排期`

## 4.12 第一阶段对象落点设计总表（本轮）

本节用于明确：第一阶段对象准备挂在哪些现有模块、服务层、上下文或数据通道上。

这里的“对象落点设计”不是 UI 设计，而是：

- 对象先落在哪一层
- 由哪个现有模块承接入口
- 由哪个 service/context 承接数据流
- 与哪个正式业务对象或底座建立关系

### 4.12.1 邮件工作台第一阶段对象落点

| 对象 | 建议入口落点 | 建议数据落点 | 建议挂接对象 | 说明 |
|---|---|---|---|---|
| `邮件线程` | `AdminDashboard` 新增 `邮件工作台` 入口 | 新增独立 `mailThreadService` | 客户、项目、订单、正式业务对象 | 线程是第一阶段根对象，不适合挂在现有某个单一业务 context 下 |
| `邮件候选业务对象` | `邮件工作台` 线程详情内 | 新增独立 `mailCandidateService` | `ING / 翻单询价 / 翻单直下单草稿 / 项目会议纪要 / 借抬头服务委托单 / 单证任务` | 属于中间对象，应独立于正式业务对象保存 |
| `邮件分发记录` | `邮件工作台` 工作箱模块 | 新增独立 `mailDispatchService` | 责任人待处理箱、部门待处理箱 | 更接近 `SalesTodoCenter` 的责任链模式，但不应直接塞进销售待办 service |
| `mail_links` | `邮件工作台` 关联面板 | 新增独立 `mailLinkService` | 客户、项目、订单、正式业务对象 | 建议做轻量关联表，不要散落到各正式对象里各存一套 |
| `直下单草稿对象` | `CustomerDashboard -> CreateOrder` / 后续可由邮件工作台转入 | 新增独立 `directOrderDraftService` | `source_mail_thread_id / source_order_id / customer_email / draftNumber / status` | 第一阶段先形成可持久化草稿底座，并保持对旧 `draftOrders` 链的兼容同步 |
| `单证任务对象` | `DocumentationWorkbenchUltimate` 顶部轻量任务面板 / 后续可由邮件工作台转入 | 新增独立 `documentTaskService` | `source_mail_thread_id / doc_code / owner / dueAt / status` | 第一阶段先形成独立任务对象底座，不直接把邮件候选硬塞进 `document_instances` 结果层 |

邮件工作台挂接结论：

- 入口应挂在 `AdminDashboard / Workbench` 层；
- 数据不建议硬塞进现有 `InquiryContext / SalesQuotationContext`；
- 第一阶段更适合新增独立的 `mail* service` 轻量层；
- 与现有正式业务对象的关系通过 `mail_links` 统一处理。

### 4.12.2 Project 第一阶段对象落点

| 对象 | 建议入口落点 | 建议数据落点 | 建议挂接对象 | 说明 |
|---|---|---|---|---|
| `项目会议纪要` | `客户产品库详情 / 项目详情工作面` | 新增独立 `projectMeetingService` | `projectId / projectRevisionId` | 应首先挂在现有 `project revision` 底座上，不单独造项目版本体系 |
| `项目行动项` | `项目会议纪要` 详情内 + 项目详情工作面 | 新增独立 `projectActionItemService` | `meeting_id / projectId / projectRevisionId` | 行动项先由纪要派生，再可选挂到正式业务对象 |
| `项目里程碑` | `项目详情工作面` | 新增独立 `projectMilestoneService` | `projectId / projectRevisionId / 项目主轴阶段` | 先作为进度控制对象，不直接塞进现有合同或订单对象里 |

Project 挂接结论：

- 第一阶段应以 `customerProductLibrary + project revision` 为统一技术基线；
- 建议新增轻量 `projectMeetingService / projectActionItemService / projectMilestoneService`；
- 入口上优先考虑挂在现有项目产品/项目详情工作面，而不是先造独立大项目模块。

### 4.12.3 借抬头出口服务第一阶段对象落点

| 对象 | 建议入口落点 | 建议数据落点 | 建议挂接对象 | 说明 |
|---|---|---|---|---|
| `借抬头服务委托单` | `Sales_Rep` 侧服务入口 / 后续可由邮件工作台转入 | 新增独立 `exportServiceOrderService` | 客户主档、后段执行链 | 这是前段根对象，不应落到普通合同或普通订单对象里 |
| `抬头文件记录` | `借抬头服务委托单` 详情内 | 新增独立 `exportServiceDocumentService` | `service_order_id` | 属于文件控制对象，应依附服务委托单 |
| `服务费应收记录` | `借抬头服务委托单` 财务页签 / Finance 管理入口 | 新增独立 `exportServiceFeeService` | `service_order_id / customer_id` | 建议与普通贸易货款分开，不直接塞进普通 AR 对象 |
| `代收代付运费记录` | `借抬头服务委托单` 结算页签 / Finance 管理入口 | 新增独立 `exportFreightSettlementService` | `service_order_id / forwarder_id / PaymentRecordManagement` | 依附服务委托单，同时挂接现有服务商与付款底座 |
| `服务委托财务桥接记录` | `Finance` 现有 `PayableManagement / PaymentRecordManagement` | 新增独立 `exportPayableBridgeService / exportPaymentRecordBridgeService` | `service_order_id / payable_reference / payment_record_reference` | 第一阶段先把借抬头服务记录并入现有财务工作面，不重做财务中心 |
| `服务委托交付/单证桥接记录` | `ShipmentManagement / DocumentationWorkbenchUltimate` | 新增独立 `exportShipmentBridgeService / exportDocumentationBridgeService` | `service_order_id / shipment_reference / docs_reference` | 第一阶段先把借抬头服务记录并入现有交付与单证工作面，不重做后段中枢 |
| `单证桥接推进规则` | `DocumentationWorkbenchUltimate` 内桥接面板 | 新增独立 `exportDocumentationBridgeWorkflowService` | `service_order_id / docs_reference / execution_bridge` | 第一阶段先做单证侧最小推进与摘要回写，不重做完整单证流程引擎 |
| `单证桥接自动对齐规则` | `ShipmentManagement / PayableManagement / PaymentRecordManagement` 现有推进动作 | 复用 `exportDocumentationBridgeWorkflowService` | `service_order_id / D05 / D11 / D12 / D13` | 第一阶段先让现有工作面动作自动带动 Docs 核心节点，不重做事件中枢 |
| `服务委托状态抬升规则` | `借抬头服务委托单` 根对象 | 新增独立 `syncExportServiceOrderStatus` | `service_order_id / serviceStatus / execution_bridge` | 第一阶段先根据桥接汇总自动抬升根对象状态，不重做完整状态机中心 |
| `邮件回看服务委托桥接视图` | `MailThreadDetail / MailCandidatePanel` | 新增独立 `exportServiceMailBridgeLookup` | `source_mail_thread_id / service_order_number / execution_bridge` | 第一阶段先让邮件工作台能回看正式服务委托结果，不重做统一消息中心 |
| `服务委托反推邮件收口规则` | `MailThread / MailDispatch` | 新增独立 `syncMailThreadFromExportService` | `source_mail_thread_id / serviceStatus / dispatch_status` | 第一阶段先按正式服务委托收口状态轻量反推邮件线程与分发记录，不重做邮件状态机中心 |

借抬头出口服务挂接结论：

- 前段对象应独立；
- 后段继续复用：
  - `InspectionManagementComplete`
  - `Shipment`
  - `Docs`
  - `PaymentRecordManagement / PayableManagement`
- 不建议把这类对象硬塞进普通贸易对象。

### 4.12.4 第一阶段 service / context 设计建议

基于现有代码结构，第一阶段建议采用“新增轻量 service，尽量少改旧 context”的方式。

建议新增 service：

- `mailThreadService`
- `mailCandidateService`
- `mailDispatchService`
- `mailLinkService`
- `projectMeetingService`
- `projectActionItemService`
- `projectMilestoneService`
- `exportServiceOrderService`
- `exportServiceDocumentService`
- `exportServiceFeeService`
- `exportFreightSettlementService`

建议原则：

- 第一阶段优先新增 service，不急着新增很多全局 context；
- 如某条线需要页面态共享，可在后续第二步再补对应 context；
- 先保证对象能独立读写、独立挂接、独立留痕。

### 4.12.5 对象落点设计结论

- 三条线的第一阶段对象，现在已经不只是“该做什么”，而是已经明确到“建议挂在哪一层”；
- 后续若进入真正的实现准备，下一步最自然的是：
  - `实现顺序排期`
  - `对象/service 创建顺序`
  - `与现有入口挂载顺序`

## 4.13 第一阶段实现顺序排期（第一版）

本节用于把前面已经收好的三条线，转成一个可执行的实现顺序。

这里的“排期”不是项目日历，而是：

- 先做哪一批对象与 service
- 再挂哪个入口
- 哪些能力必须等前一批稳定后再开始

### 4.13.1 总体顺序

建议总体顺序如下：

1. `邮件工作台第一阶段`
2. `Project 第一阶段`
3. `借抬头出口服务第一阶段`

总体原因：

- `邮件工作台` 是外部需求进入 ERP 的增强入口；
- `Project` 建立在现有强底座之上，补 3 个对象后最容易形成最小闭环；
- `借抬头出口服务` 前段对象较专用，适合在前两条稳定后再落。

### 4.13.2 第一步：邮件工作台第一阶段

建议内部顺序：

#### Step 1A：先建 service 层

- `mailThreadService`
- `mailDispatchService`
- `mailCandidateService`
- `mailLinkService`

目标：

- 先把 4 个对象的最小读写能力建立起来；
- 不急着先做复杂入口。

#### Step 1B：再建核心对象

- `邮件线程`
- `邮件分发记录`
- `邮件候选业务对象`
- `mail_links`

目标：

- 先形成“线程 -> 分发 -> 候选 -> 挂接”的最小数据闭环。

#### Step 1C：再挂入口

- `AdminDashboard / Workbench` 增加 `邮件工作台` 入口；
- 接入最小工作箱：
  - `待我处理`
  - `待本部门处理`
  - `我已分发`
  - `升级件`

目标：

- 先让内部用户能看、能分发、能签收、能转候选对象。

#### Step 1D：最后挂正式业务对象

第一阶段优先挂接：

- `ING`
- `翻单询价`
- `翻单直下单`
- `项目会议纪要`
- `项目行动项`
- `借抬头服务委托单`
- `单证任务`

邮件工作台第一阶段完成判断：

- 4 个对象已能读写；
- 有统一入口；
- 有责任链；
- 候选对象能挂正式对象。

### 4.13.3 第二步：Project 第一阶段

建议内部顺序：

#### Step 2A：先建 service 层

- `projectMeetingService`
- `projectActionItemService`
- `projectMilestoneService`

目标：

- 不改现有 `project revision` 底座；
- 先补 3 个轻量对象的独立 service。

#### Step 2B：再建核心对象

- `项目会议纪要`
- `项目行动项`
- `项目里程碑`

目标：

- 统一挂在 `projectId + projectRevisionId` 上；
- 建立“沟通 -> 执行 -> 进度”的最小闭环。

#### Step 2C：再挂入口

建议优先挂：

- `客户产品库详情 / 项目详情工作面`
- 与 `MyProducts / MyProductsSelector` 形成项目侧统一入口感

目标：

- 不单独新造一个大项目系统入口；
- 先挂在现有项目修订相关工作面附近。

#### Step 2D：最后挂主轴增强点

第一阶段优先挂接：

- `QT`
- `SC`
- `CG`
- `Shipment`
- `Docs`

Project 第一阶段完成判断：

- 3 个对象已能读写；
- 全部挂在现有项目修订底座；
- 能从项目会议纪要形成行动项；
- 能按项目里程碑看计划/实际。

### 4.13.4 第三步：借抬头出口服务第一阶段

建议内部顺序：

#### Step 3A：先建 service 层

- `exportServiceOrderService`
- `exportServiceDocumentService`
- `exportServiceFeeService`
- `exportFreightSettlementService`

目标：

- 先把前段 4 个对象的读写能力建立起来；
- 不碰后段执行底座。

#### Step 3B：再建核心对象

- `借抬头服务委托单`
- `抬头文件记录`
- `服务费应收记录`
- `代收代付运费记录`

目标：

- 形成“服务委托 -> 文件 -> 服务费 -> 运费代收代付”的最小闭环。

#### Step 3C：再挂入口

建议优先挂：

- `Sales_Rep` 侧服务入口
- 并允许后续由 `邮件工作台` 转入

目标：

- 先让服务单可建立；
- 后续再和邮件入口打通。

#### Step 3D：最后挂后段执行底座

优先挂接：

- `InspectionManagementComplete`
- `Shipment`
- `Docs`
- `PaymentRecordManagement / PayableManagement`

借抬头出口服务第一阶段完成判断：

- 4 个前段对象已能读写；
- 后段可挂现有订舱/单证/付款底座；
- 财务上能区分：
  - `服务费收入`
  - `代收代付运费`
  - `非我司货款`

### 4.13.5 并行与串行建议

建议总体上：

- `邮件工作台第一阶段` 先行；
- `Project 第一阶段` 可在邮件工作台稳定后尽快启动；
- `借抬头出口服务第一阶段` 可在 `Project` 进行中后半段启动，但前提是邮件工作台入口设计已稳定。

建议不要一开始三条线完全并行，原因：

- 入口层、责任链和挂接方式需要先稳定；
- 否则三个新对象体系会同时争夺入口与命名口径。

### 4.13.6 实现顺序排期结论

- 现在主稿已经足够支撑从“文档定义层”切到“实现准备层”；
- 后续如果继续推进，最合理的顺序是：
  - 先 `邮件工作台`
  - 再 `Project`
  - 再 `借抬头出口服务`
- 每条线都建议遵守同一种内部顺序：
  - `先 service`
  - `再对象`
  - `再入口`
  - `最后挂现有正式业务链`

## 4.14 第一阶段代码挂载与文件拆分规则（本轮）

本节用于把实现准备再往前推一层，明确：

- 第一阶段代码应该挂在哪
- 文件应该怎么拆
- 如何避免单个文件无限膨胀

### 4.14.1 邮件工作台第一阶段挂载建议

结合现有代码结构，邮件工作台第一阶段建议采用：

- 在 `AdminDashboard` 中新增一个独立模块入口，例如：
  - `mail-workbench`
- 不替换现有：
  - `messaging`
  - `sales-todo-center`
- 而是与之并列存在。

原因：

- 现有 `messaging`
  - 更偏内部消息中心
- 现有 `sales-todo-center`
  - 更偏销售待办中心
- `邮件工作台`
  - 是 ERP 的业务邮件中枢，不应强塞进现有两者任一模块

建议第一阶段挂载关系：

- `AdminDashboard`
  - 新增 `mail-workbench` 入口
- `permissionCenterService`
  - 新增 `mail-workbench` 模块定义与角色权限口径
- `mail* service`
  - 独立服务层
- `mail-workbench` 入口组件
  - 只做入口容器，不堆业务逻辑

### 4.14.2 Project 第一阶段挂载建议

Project 第一阶段不建议先在 `AdminDashboard` 新开一个很重的独立“项目系统”入口。

建议优先挂载在：

- `客户产品库详情`
- `ProjectProductForm` 所在链路
- `My Products / MyProductsSelector`

原因：

- 现有 `project revision` 强底座已经在这些链路里；
- 第一阶段对象应围绕现有项目修订底座生长；
- 不宜先人为造出一个脱离底座的大型项目中心。

### 4.14.3 借抬头出口服务第一阶段挂载建议

借抬头出口服务第一阶段建议：

- 前段入口先挂在 `Sales_Rep` 侧可触达入口；
- 后续允许由 `邮件工作台` 直接转入；
- 后段继续挂在现有：
  - `InspectionManagementComplete`
  - `Shipment`
  - `Docs`
  - `PaymentRecordManagement / PayableManagement`

当前代码进展补充：

- 第一阶段已采用该建议；
- 入口挂在 `BusinessProcessCenter` 的独立标签页；
- 仍保持为轻量前段入口，不新建重型中心。

原因：

- 前段服务委托需要业务承接；
- 后段执行底座已成熟，不应复制。

### 4.14.4 文件拆分规则

为避免单文件无限膨胀，第一阶段建议明确采用“小对象、小 service、小入口组件”的拆分原则。

建议规则：

- 一个新对象，优先对应一个独立 service；
- 复杂对象定义，优先抽到独立 `types` 文件；
- 工作台入口组件只负责：
  - 组合
  - 路由
  - 状态承接
- 列表、详情、分发面板、候选确认面板，优先拆成独立组件；
- 不应把：
  - service
  - types
  - 状态流转
  - 业务规则
  - 页面渲染  
  全堆在一个 TSX 文件里。

### 4.14.5 邮件工作台第一阶段建议文件结构

第一阶段建议优先采用类似如下的结构：

```text
src/components/admin/mail-workbench/
├── MailWorkbench.tsx
├── MailWorkbenchShell.tsx
├── MailThreadList.tsx
├── MailThreadDetail.tsx
├── MailCandidatePanel.tsx
├── MailDispatchPanel.tsx
└── types.ts

src/lib/services/
├── mailThreadService.ts
├── mailCandidateService.ts
├── mailDispatchService.ts
└── mailLinkService.ts
```

说明：

- `MailWorkbench.tsx`
  - 只做模块入口
- `MailWorkbenchShell.tsx`
  - 只做主布局与组合
- 列表、详情、候选、分发各自拆开
- service 独立，避免业务逻辑堆进组件

### 4.14.6 Project 第一阶段建议文件结构

第一阶段建议优先采用类似如下的结构：

```text
src/components/dashboard/project-control/
├── ProjectControlPanel.tsx
├── ProjectMeetingList.tsx
├── ProjectMeetingDetail.tsx
├── ProjectActionItemList.tsx
├── ProjectMilestoneList.tsx
└── types.ts

src/lib/services/
├── projectMeetingService.ts
├── projectActionItemService.ts
└── projectMilestoneService.ts
```

说明：

- 先做轻量控制面板
- 不急着上大项目门户
- 3 个 service 各自独立

### 4.14.7 借抬头出口服务第一阶段建议文件结构

第一阶段建议优先采用类似如下的结构：

```text
src/components/salesperson/export-service/
├── ExportServiceWorkbench.tsx
├── ExportServiceOrderList.tsx
├── ExportServiceOrderDetail.tsx
├── ExportServiceDocumentPanel.tsx
├── ExportServiceFinancePanel.tsx
└── types.ts

src/lib/services/
├── exportServiceOrderService.ts
├── exportServiceDocumentService.ts
├── exportServiceFeeService.ts
└── exportFreightSettlementService.ts
```

说明：

- 前段工作面和后段执行底座分离；
- 前段对象集中在一个小型模块下；
- 后段继续走现有交付与财务模块。

### 4.14.8 文件拆分结论

- 后续开始写代码时，应明确避免“一个新模块只靠一个超大 TSX 文件承载”；
- 第一阶段推荐优先新增：
  - 独立 service
  - 独立 types
  - 小入口组件
  - 小列表/详情/面板组件
- 这条规则应视为本稿后续实现阶段的默认约束。

## 3.10 借抬头出口服务的财务口径

这类服务型业务，在财务侧不应按普通贸易单处理，至少要拆成 3 条线：

### A. 服务费

服务费是我司真正的收入，应单独识别：

- `service_fee_receivable`
- `service_fee_invoice_status`
- `service_fee_received_at`

财务含义：

- 形成我司服务收入
- 可形成服务类发票
- 可计入该服务单利润

### B. 海运费代收代付

如果客户委托我司订舱并由我司代付货代费用，则海运费应单独识别为代收代付：

- `freight_collect_amount`
- `freight_collected_at`
- `freight_payable_to_forwarder`
- `freight_paid_at`

财务含义：

- 客户付给我司
- 我司再付给货代
- 原则上不直接计入我司营业收入
- 不应与服务费混成同一收入科目

### C. 货款

对于该类业务，应明确：

- `goods_payment_handled_by_us = false`

财务含义：

- 不形成我司销售收入
- 不形成我司采购成本
- 不进入普通贸易应收应付链

### D. 建议的 Payment 表达

这类模板下，`Payment` 不应默认显示为普通贸易的“定金 / 尾款”，建议优先采用：

- `服务费待收`
- `服务费已收`
- `海运费待收`
- `海运费已收`
- `海运费待付货代`
- `海运费已付货代`
- `服务结算关闭`

### E. 利润口径

这类业务的利润，原则上应按：

- `服务费收入 - 我司承担的实际服务成本`

海运费如属于代收代付，原则上不直接进入服务利润口径。

### 3.10.1 与现有代码对照说明（本轮）

- 代码落地层级：`部分具备`
- 当前已具备的真实基础：
  - 现有系统已经具备 `银行交单 / 放单 / 运费 / 服务商付款` 等后段财务控制基础；
  - `inspection-only / agency` 场景中，已经存在部分 `inspectionFee / service revenue / payable serviceType` 的分析和管理口径。
- 当前尚未统一落库的部分：
  - 尚未看到“借抬头出口服务”被作为独立财务模板处理；
  - 尚未看到“服务费收入 / 海运费代收代付 / 非我司货款”三条财务线被统一建模；
  - 尚未看到 `Payment` 在该模板下切换成 `服务费待收 / 海运费待收 / 海运费待付货代` 的专属状态模型。
- 本稿口径：
  - 本节财务拆分原则当前主要属于 `V1目标规则`；
  - 但其后段可优先复用现有 `放单 / 交单 / 运费支付` 的底层控制逻辑。

## 3.11 邮件接入与邮件转业务执行

主稿源头建议把“邮件”视为真实业务入口之一，而不是要求客户或业务员放弃邮件改用 ERP 原生录入。

源头原则：

- 客户可以继续发邮件；
- 业务员可以继续收邮件和附件；
- ERP 的作用不是替代邮箱，而是把具体邮件转成可执行的业务对象；
- 邮件工作台应作为 ERP 内的一部分，而不是独立跳到 Gmail/Outlook 页面。

## 3.11.1 邮件工作台定位

邮件接入建议采用：

- 真实邮箱继续作为收发通道
  - `Microsoft 365 / Gmail / IMAP`
- ERP 内提供 `邮件工作台`
  - 展示邮件线程
  - 展示正文和附件
  - 识别客户、联系人、项目、订单
  - 一键转业务对象

控制规则：

- 邮件系统不应只做“收件箱搬运”，而应面向业务执行；
- 邮件工作台应优先展示“邮件 -> 业务候选 -> 人工确认 -> 正式建单”的路径；
- 业务员仍可继续用原邮箱沟通，但 ERP 中应沉淀与业务执行相关的邮件链路。
- 邮件工作台还应承担 `内部分发中枢` 的职责：
  - 将邮件线程分发到具体责任人；
  - 将邮件线程分发到角色或部门待处理箱；
  - 支持内部转派、加签关注、升级处理；
  - 支持“待我处理 / 待本部门处理 / 我已分发 / 我被抄送”四类内部视图。

### 3.11.1.1 与现有代码对照说明（本轮）

- 代码落地层级：`V1目标规则`
- 当前已具备的真实基础：
  - 现有系统里广泛存在 `email` 作为身份、客户归属、通知、文档输出等字段；
  - 存在若干邮件模板、通知、`email-routes` 等散点能力。
- 当前尚未看到的完整能力：
  - 尚未看到 ERP 内独立的 `邮件工作台 / Inbox / 邮件线程 / 附件归档 / 候选对象转单` 主模块；
  - 尚未看到“从具体邮件生成候选 ING / 候选翻单询价 / 候选项目纪要 / 候选借抬头服务委托单”的统一入口；
  - 尚未看到邮件与业务对象的统一线程关联模型；
  - 尚未看到统一的“内部分发 / 转派 / 升级 / 部门待处理箱”主模型。
- 本稿口径：
  - `邮件接入与邮件转业务执行` 当前应明确视为 `V1目标规则`；
  - 后续代码改造时，应优先采用“真实邮箱继续收发，ERP 内提供业务邮件工作台”的模式；
  - 在未形成统一工作台前，不应把现有零散 email 字段误判为“邮件工作台已具备”。

### 3.11.1.2 邮件接入的最小落地建议（本轮）

- 第一阶段不建议直接做完整邮箱客户端；
- 建议优先形成以下最小对象：
  - `邮件线程`
  - `邮件附件清单`
  - `邮件候选业务对象`
  - `邮件分发记录`
- 第一阶段建议先只支持这些转化动作：
  - `转询价`
  - `转翻单询价`
  - `转翻单直下单`
  - `转项目会议纪要`
  - `转项目行动项`
  - `转借抬头出口服务委托单`
  - `分发到责任人`
  - `分发到部门待处理箱`
  - `转派`
  - `升级`
- 第一阶段实现原则：
  - 真实邮箱继续收发；
  - ERP 内只做“邮件工作台 + 归类 + 人工确认 + 转候选对象 + 内部分发”；
  - 不建议第一阶段直接自动生成正式业务单据。

### 3.11.1.3 邮件工作台最小改造清单（本轮）

第一阶段不建议做“完整邮箱客户端”，建议只补 3 个最小对象：

- `邮件线程`
- `邮件附件清单`
- `邮件候选业务对象`
- `邮件分发记录`

第一阶段建议只支持最小动作集：

- `转询价`
- `转翻单询价`
- `转翻单直下单`
- `转项目会议纪要`
- `转项目行动项`
- `转借抬头出口服务委托单`
- `分发到责任人`
- `分发到部门待处理箱`
- `转派`
- `升级`
- `标记已处理`

第一阶段实现原则：

- 真实邮箱继续收发；
- ERP 内只做：
  - 邮件工作台
  - 邮件归类
  - 人工确认
  - 转候选对象
  - 内部分发与转派
- 第一阶段不直接自动创建正式业务单据。

第二阶段再补：

- 邮件线程与客户/项目/订单自动关联；
- 附件结构化提取；
- 候选对象自动回填字段；
- 角色/部门自动分发建议；
- 分发 SLA 与升级提醒；
- 邮件到正式业务单据的半自动建单。

### 3.11.1.4 邮件工作台主稿口径 vs 现有 ERP 对照表（本轮）

| 邮件工作台主稿口径 | 现有 ERP 情况 | 当前判断 | 剩余差距 |
|---|---|---|---|
| `ERP 内邮件工作台` | 现有系统广泛存在 email 字段、通知、模板、email-routes 等散点能力，但未见统一工作台模块 | `V1目标规则` | 需新增 ERP 内 `邮件工作台` 主入口 |
| `邮件线程` | 未见统一 thread 主对象 | `V1目标规则` | 需新增 `邮件线程` 与线程归档模型 |
| `邮件附件清单` | 现有很多业务对象有附件字段，但未见“邮件附件 -> 业务候选对象”的统一承接对象 | `部分具备` | 需新增 `邮件附件清单` 对象和与业务候选对象的关联 |
| `从具体邮件生成候选业务对象` | 未见统一入口 | `V1目标规则` | 需新增 `邮件候选业务对象` 主对象 |
| `邮件转新询价 / 翻单询价 / 翻单直下单` | 现有已有 `Inquiry / QT / SC / PR` 等业务对象，但未见邮件触发入口 | `部分具备` | 需做“邮件 -> 候选对象 -> 人工确认 -> 正式建单”桥接 |
| `邮件转项目会议纪要 / 行动项` | 现有尚无项目会议纪要与行动项主对象 | `V1目标规则` | 需与 `Project` 第一阶段新增对象一起建设 |
| `邮件转借抬头出口服务委托单` | 现有尚无借抬头服务委托单主对象 | `V1目标规则` | 需与借抬头服务前段对象一起建设 |
| `邮件与客户/项目/订单自动关联` | 现有部分业务对象能按 email 查客户或客户业务，如询价/报价/合同部分 `customer_email` 查询 | `部分具备` | 需补统一的“邮件对象 -> 客户/项目/订单”关联规则 |
| `邮件内部分发 / 转派 / 部门待处理箱` | 现有未见统一邮件分发主对象，也未见 ERP 内邮件待处理箱模型 | `V1目标规则` | 需新增 `邮件分发记录`、责任人待处理箱、部门待处理箱、升级规则 |
| `真实邮箱继续收发，ERP 只做业务吸收` | 现有系统没有内建邮箱客户端，也没有证据表明已要替代 Gmail/Outlook | `符合目标方向` | 第一阶段应坚持不重做邮箱客户端 |

邮件工作台对照结论：

- 现有 ERP 对邮件的真实基础，主要是 `email 字段 / 通知 / 模板 / 按 email 查业务对象`，而不是一套可执行的邮件工作台；
- 因此邮件工作台不应被误判为“已有散点能力就等于已具备”；
- 第一阶段最小实现应坚持：
  - 真实邮箱继续收发；
  - ERP 只新增 `邮件线程 / 邮件附件清单 / 邮件候选业务对象 / 邮件分发记录`；
  - 再通过人工确认把邮件转进正式业务对象；
- 邮件工作台既是邮件入口，也是内部协同分发入口；
- 对内部分发来说，第一阶段至少要先形成：
  - 责任人待处理箱；
  - 部门待处理箱；
  - 转派与升级留痕；
- 邮件工作台与 `Project`、`借抬头出口服务` 的第一阶段建设应联动，而不是孤立建设。

### 3.11.1.5 三条新源头线的实施优先级总表（本轮）

为避免后续一边查代码、一边临时扩散实现范围，本稿先将 `Project / 借抬头出口服务 / 邮件工作台` 三条新源头线的实施顺序统一如下。

#### 第一阶段：先做最小可用闭环

- `Project`
  - 直接复用 `客户产品库 / Project Revision / MyProducts / MyProductsSelector / QT / XJ / SC / PR / CG`；
  - 先补：
    - `项目会议纪要`
    - `项目行动项`
    - `项目里程碑`
- `借抬头出口服务`
  - 直接复用 `InspectionManagementComplete / postContractExecutionServices / purchaseOrderQuoteRequirementServices / ServiceProviderManagement / PaymentRecordManagement / PayableManagement`；
  - 先补：
    - `借抬头服务委托单`
    - `抬头文件记录`
    - `服务费应收记录`
    - `代收代付运费记录`
- `邮件工作台`
  - 先补最小对象：
    - `邮件线程`
    - `邮件附件清单`
    - `邮件候选业务对象`
    - `邮件分发记录`
  - 先只支持最小动作：
    - `转询价`
    - `转翻单询价`
    - `转翻单直下单`
    - `转项目会议纪要`
    - `转项目行动项`
    - `转借抬头出口服务委托单`
    - `分发到责任人`
    - `分发到部门待处理箱`
    - `转派`
    - `升级`

#### 第二阶段：再补工程化和自动化能力

- `Project`
  - 再补：
    - `FAT主对象`
    - `SAT主对象`
    - `项目移交文件包`
    - `项目风险台账`
    - `项目问题清单`
    - 甘特图 `计划/实际/偏差`
- `借抬头出口服务`
  - 再补：
    - 抬头文件生成与客户确认闭环；
    - 更完整的 `服务费收入 / 海运费代收代付 / 非我司货款` 财务模板；
    - 客户侧可见的服务状态与文件确认界面。
- `邮件工作台`
  - 再补：
    - 邮件线程与客户/项目/订单自动关联；
    - 附件结构化提取；
    - 候选对象自动回填；
    - 邮件到正式业务单据的半自动建单。

#### 可直接复用的现有底座

- `Project Revision` 修订基线链；
- `客户产品库 / MyProducts / MyProductsSelector`；
- `QT / XJ / SC / PR / CG` 的项目修订贯通；
- 后段 `订舱 / 运费确认 / 放单 / 交单 / L/C / D/P` 控制；
- 服务商主数据；
- 服务商付款 / 货代付款 / 应付记录。

#### 必须新增的一等对象

- `项目会议纪要`
- `项目行动项`
- `项目里程碑`
- `借抬头服务委托单`
- `抬头文件记录`
- `服务费应收记录`
- `代收代付运费记录`
- `邮件线程`
- `邮件附件清单`
- `邮件候选业务对象`
- `邮件分发记录`

#### 本轮结论

- 第一阶段优先目标不是“做全”，而是“先让三条新源头线都能进入 ERP 并形成最小闭环”；
- 第二阶段再补自动化、工程化、客户侧可见增强；
- 后续所有代码对照与开发排期，默认以上述优先级总表为准。

## 3.11.2 邮件识别与业务归类

邮件进入 ERP 后，建议先进入“识别与归类”层，而不是直接自动创建正式业务单据。

建议至少识别这些类型：

- `新询价邮件`
- `翻单询价邮件`
- `翻单直下单邮件`
- `项目沟通邮件`
- `项目会议纪要候选`
- `项目行动项候选`
- `借抬头出口服务委托邮件`
- `单证/出运沟通邮件`
- `投诉/售后邮件`

建议至少关联这些对象：

- `customer_id`
- `contact_id`
- `project_id`
- `order_id`
- `thread_id`
- `attachment_refs`

控制规则：

- 邮件先归类，再转业务，不应直接自动落正式主数据；
- 邮件识别结果应允许人工修正；
- 同一客户、同一线程、同一附件链应尽量聚合，而不是拆成孤立任务。

### 3.11.2.1 第一阶段最小对象字段：邮件线程

建议第一阶段的 `邮件线程` 先具备以下字段：

- `mail_thread_id`
- `mail_provider`
- `provider_thread_key`
- `subject`
- `normalized_subject`
- `latest_message_at`
- `latest_from_email`
- `latest_from_name`
- `direction`
- `thread_status`
- `linked_customer_id`
- `linked_contact_id`
- `linked_project_id`
- `linked_order_id`
- `has_attachments`
- `attachment_count`
- `unread_for_internal`
- `last_synced_at`

建议第一阶段状态：

- `new`
- `triaged`
- `dispatched`
- `in_progress`
- `converted`
- `archived`

控制规则：

- `邮件线程` 是邮件工作台的根对象，不应直接等同正式业务对象；
- 线程状态主要服务于内部分发与业务承接，不替代正式业务单据状态；
- 同一会话应尽量收敛为同一线程，避免重复承接。

## 3.11.3 邮件转业务候选对象

邮件不建议直接转成正式单据，建议先形成“候选对象”，由业务在 ERP 中确认后再落正式执行对象。

建议至少支持这些候选对象：

- `候选 ING`
- `候选 翻单询价`
- `候选 翻单直下单`
- `候选 QT草稿`
- `候选 项目会议纪要`
- `候选 项目行动项`
- `候选 借抬头出口服务委托单`
- `候选 单证任务`

建议最小字段：

- `mail_candidate_type`
- `source_mail_id`
- `source_thread_id`
- `linked_customer_id`
- `linked_project_id`
- `candidate_status`
- `confirmed_by`
- `confirmed_at`

控制规则：

- 候选对象确认前，不应直接污染正式主数据；
- 候选对象应能回看原始邮件、附件、发件人与线程上下文；
- 候选对象确认后，应保留“邮件 -> 业务对象”的可追溯关系。

### 3.11.3.0 第一阶段最小对象字段：邮件候选业务对象

建议第一阶段的 `邮件候选业务对象` 先具备以下字段：

- `mail_candidate_id`
- `source_thread_id`
- `source_mail_id`
- `mail_candidate_type`
- `suggested_target_object_type`
- `linked_customer_id`
- `linked_contact_id`
- `linked_project_id`
- `linked_order_id`
- `candidate_title`
- `candidate_summary`
- `candidate_status`
- `owner_user_id`
- `confirmed_target_object_id`
- `confirmed_target_object_type`
- `confirmed_by`
- `confirmed_at`
- `rejected_by`
- `rejected_at`

建议第一阶段状态：

- `draft`
- `pending_confirmation`
- `confirmed`
- `rejected`
- `cancelled`

控制规则：

- 一个线程可产生多个候选对象，但同一封邮件不应重复生成同类型候选对象；
- 候选对象一旦确认，应记录所落到的正式对象；
- 候选对象被拒绝后，仍应保留来源邮件和处理痕迹。

## 3.11.3.1 邮件内部分发与内部待处理箱

邮件工作台除了“转业务”，还应承担全员可用的内部协同分发功能。

建议至少支持这些分发目标：

- `分发到具体责任人`
- `分发到角色待处理箱`
- `分发到部门待处理箱`
- `加签关注人`
- `升级到主管或跨部门`

建议至少支持这些待处理视图：

- `待我处理`
- `待本部门处理`
- `我已分发`
- `我被抄送`
- `升级件`

建议最小字段：

- `mail_dispatch_id`
- `source_thread_id`
- `dispatch_type`
- `assigned_user_id`
- `assigned_role`
- `assigned_department`
- `dispatch_status`
- `dispatched_by`
- `dispatched_at`
- `accepted_by`
- `accepted_at`
- `escalated_to`
- `escalated_at`

控制规则：

- 邮件分发不应替代正式业务责任归属，但可作为正式建单前的内部承接机制；
- 分发、转派、升级都应留痕；
- 同一线程允许多次分发，但应能区分当前有效责任人；
- 邮件一旦转成正式业务对象，应保留“原始邮件责任链 -> 正式业务责任链”的追溯关系。

### 3.11.3.1.1 第一阶段最小对象字段：邮件分发记录

建议第一阶段的 `邮件分发记录` 先具备以下字段：

- `mail_dispatch_id`
- `source_thread_id`
- `source_mail_id`
- `dispatch_type`
- `dispatch_reason`
- `assigned_user_id`
- `assigned_role`
- `assigned_department`
- `dispatch_status`
- `priority`
- `due_at`
- `dispatched_by`
- `dispatched_at`
- `accepted_by`
- `accepted_at`
- `resolved_by`
- `resolved_at`
- `escalated_to_user_id`
- `escalated_to_role`
- `escalated_at`
- `closed_note`

建议第一阶段状态：

- `pending_pickup`
- `accepted`
- `reassigned`
- `escalated`
- `resolved`
- `closed`

控制规则：

- 第一阶段应允许“部门待处理箱 -> 签收为具体责任人”的流转；
- `resolved` 表示处理动作完成，`closed` 表示该次分发闭环完成；
- 一个线程允许存在历史分发记录，但同一时刻应能识别当前有效待处理记录。

## 3.11.3.1.2 第一阶段 ERP 邮件模块结构（第一版）

第一阶段建议按专业 ERP 的邮件模块结构来定义，而不是按消费级邮箱客户端来拆页面。

建议第一阶段先形成以下 5 个模块。

### A. 邮件接入与同步模块

职责：

- 接入 `Microsoft 365 / Gmail / IMAP`
- 拉取邮件头、正文、附件索引、线程键
- 维护同步时间、同步状态、失败重试

最小输出对象：

- `邮件线程`
- `邮件附件清单`

第一阶段边界：

- 负责“收进来”
- 不负责业务判断与正式建单

### B. 邮件队列与工作箱模块

职责：

- 按责任人、角色、部门形成工作队列
- 提供：
  - `待我处理`
  - `待本部门处理`
  - `我已分发`
  - `我被抄送`
  - `升级件`
  - `全部线程`
- 支持签收、转派、关闭当前待处理记录

最小输出对象：

- `邮件分发记录`
- `责任人待处理箱`
- `部门待处理箱`

第一阶段边界：

- 负责“谁来接”
- 不替代正式业务 Owner 机制

### C. 邮件识别与业务候选模块

职责：

- 对邮件做人工主导的归类
- 形成：
  - `候选 ING`
  - `候选 翻单询价`
  - `候选 翻单直下单`
  - `候选 项目会议纪要`
  - `候选 项目行动项`
  - `候选 借抬头出口服务委托单`
  - `候选 单证任务`

最小输出对象：

- `邮件候选业务对象`

第一阶段边界：

- 负责“这封邮件应该转成什么”
- 不直接生成正式业务单据

### D. 邮件业务关联模块

职责：

- 将线程与客户、联系人、项目、订单建立关联
- 允许人工修正错误关联
- 支持从正式业务对象反查原始邮件线程

最小输出对象：

- `mail_links`

第一阶段边界：

- 先支持人工关联和人工修正
- 第二阶段再补自动关联建议

### E. 邮件审计与升级模块

职责：

- 记录：
  - 分发
  - 转派
  - 升级
  - 候选确认
  - 已处理
- 跟踪升级件
- 记录责任链变化

最小输出对象：

- `邮件分发记录`
- `候选对象确认日志`
- `升级记录`

第一阶段边界：

- 先做留痕与升级件视图
- 第二阶段再补 SLA 计时与自动催办

控制规则：

- 第一阶段的 ERP 邮件系统应优先做成“接入模块 + 工作队列 + 业务候选 + 业务关联 + 审计升级”五段结构；
- 第一阶段主工作面应围绕“队列承接、线程查看、候选确认、分发升级”展开；
- 不应把第一阶段目标理解成“做一个 ERP 版 Gmail/Outlook”；
- 第一阶段模块结构应优先服务业务承接和内部协同，而不是追求邮箱客户端体验。

### 3.11.3.1.2.1 第一阶段 ERP 邮件模块数据流（第一版）

第一阶段建议按下列专业 ERP 数据流推进，而不是按“收件箱 -> 查看邮件 -> 回复邮件”的消费级邮箱路径理解。

```text
企业邮箱
-> 邮件接入与同步模块
-> 邮件线程
-> 邮件队列与工作箱模块
-> 部门待处理箱 / 责任人待处理箱
-> 邮件识别与业务候选模块
-> 邮件候选业务对象
-> 邮件业务关联模块
-> 正式业务对象
-> 邮件审计与升级模块
```

按动作拆解如下：

1. `收件`
- 企业邮箱的新邮件先进入 `邮件接入与同步模块`；
- 接入模块负责生成或更新 `邮件线程`，并同步附件索引。

2. `入箱`
- 新线程或线程新消息进入 `邮件队列与工作箱模块`；
- 先进入：
  - `责任人待处理箱`
  - 或 `部门待处理箱`
  - 或二者之一加 `抄送箱`

3. `承接`
- 责任人签收；
- 如责任不清，先留在部门待处理箱；
- 如需跨部门处理，可执行转派或升级。

4. `识别`
- 当前责任人对线程进行人工主导归类；
- 形成一个或多个 `邮件候选业务对象`。

5. `确认`
- 当前责任人确认候选对象是否成立；
- 确认后进入 `邮件业务关联模块`，与客户、项目、订单、正式业务对象建立关联。

6. `落地`
- 候选对象经人工确认后，转为正式业务对象或挂接到已有业务对象；
- 原始线程继续保留，不因正式建单而消失。

7. `留痕`
- 整个过程中的分发、签收、转派、升级、候选确认、已处理，都进入 `邮件审计与升级模块`。

数据流控制规则：

- `邮件线程` 是第一阶段根对象；
- `邮件候选业务对象` 是中间对象，不应直接等同正式业务对象；
- `分发记录` 和 `候选确认` 应并行留痕；
- 正式业务对象必须能反查原始线程；
- 同一线程允许对应多个候选对象，但每个候选对象都必须有确认结果。

### 3.11.3.1.2.2 第一阶段 ERP 邮件模块动作边界（第一版）

为避免把邮件模块做成“谁都能随便改”的协同页，第一阶段应先把动作边界写清楚。

#### A. 邮件接入与同步模块

允许动作：

- 配置邮箱接入
- 手动触发同步
- 查看同步日志
- 重试失败同步

不承担：

- 分发责任
- 业务归类
- 正式建单

#### B. 邮件队列与工作箱模块

允许动作：

- 分发到部门待处理箱
- 签收为具体责任人
- 转派到其他责任人
- 标记优先级
- 标记当前处理状态

不承担：

- 候选对象确认
- 正式业务对象生成

#### C. 邮件识别与业务候选模块

允许动作：

- 创建候选对象
- 修改候选类型
- 补充候选摘要
- 标记“无法识别/暂不转业务”

不承担：

- 替代正式业务审批
- 绕过人工确认直接建单

#### D. 邮件业务关联模块

允许动作：

- 关联客户
- 关联项目
- 关联订单
- 关联已有正式业务对象
- 将候选对象转为正式业务对象

不承担：

- 修改原始邮件内容
- 擅自删除既有责任链

#### E. 邮件审计与升级模块

允许动作：

- 记录签收
- 记录分发
- 记录转派
- 记录升级
- 记录关闭
- 记录候选确认结果

不承担：

- 直接替代业务审批中心
- 直接改变正式业务状态

边界结论：

- 第一阶段邮箱系统的关键动作，不是“发信/回信”，而是“承接/分发/确认/挂接/留痕”；
- 回复邮件能力即使存在，也不应成为第一阶段的中心；
- 第一阶段应优先把“邮件如何进入责任链、如何进入业务链”做稳。

### 3.11.3.1.2.3 第一阶段责任链口径（第一版）

邮件工作台第一阶段建议明确区分 5 个责任角色：

- `当前处理人`
  - 当前对线程负责的人
- `原始分发人`
  - 最初把线程分发出去的人
- `部门负责人`
  - 当线程停留在部门待处理箱时的管理责任人
- `升级接收人`
  - 重大异常或超时升级后的接收人
- `正式业务Owner`
  - 该线程最终挂接的正式业务对象负责人

责任链规则：

- 同一时刻，线程必须有一个明确的 `当前处理人` 或明确停留在某个 `部门待处理箱`；
- 一旦签收，不应再处于“无人负责”状态；
- 转派后，前一责任人不可被覆盖，应保留历史痕迹；
- 升级不应抹掉当前处理链，只是在其上增加更高层关注链；
- 当线程已挂接正式业务对象后，邮件责任链仍保留，但应能看到对应 `正式业务Owner`；
- 线程关闭不等于正式业务关闭，二者需要分开。

### 3.11.3.1.2.4 第一阶段角色权限矩阵（第一版）

第一阶段邮件工作台不应采用“只要能看见就都能操作”的松散模式，建议按 ERP 内部责任链定义明确角色权限。

#### A. 角色分组

- `一线处理角色`
  - `Sales_Rep`
  - `Procurement`
  - `QC`
  - `Order_Coordinator`
  - `Warehouse_Ops`
  - `Documentation_Officer`
  - `Finance`
- `管理角色`
  - `Regional_Manager`
  - `Procurement_Manager`
  - `CFO`
  - `Sales_Director`
- `高管与兜底角色`
  - `CEO`
- `系统与配置角色`
  - `Admin`

#### B. 模块级权限建议

| 模块 | 查看线程 | 分发到部门待处理箱 | 签收为责任人 | 转派 | 升级 | 创建候选对象 | 确认候选对象 | 关联正式业务对象 | 查看审计链 |
|---|---|---|---|---|---|---|---|---|---|
| `Sales_Rep` | 可查看与自己相关线程 | 可分发到销售相关待处理箱 | 可签收 | 可转派同链相关角色 | 重大异常时可发起升级 | 可创建 | 可确认销售类候选对象 | 可关联销售类正式对象 | 可查看与自己相关审计链 |
| `Procurement` | 可查看采购相关线程 | 可分发到采购待处理箱 | 可签收 | 可转派采购链角色 | 可发起升级 | 可创建 | 可确认采购类候选对象 | 可关联采购类正式对象 | 可查看采购链相关审计链 |
| `QC` | 可查看质量相关线程 | 可分发到质量待处理箱 | 可签收 | 可转派质量链角色 | 可发起升级 | 可创建 | 可确认质量类候选对象 | 可关联验货/FAT/SAT类对象 | 可查看质量链相关审计链 |
| `Order_Coordinator / Warehouse_Ops` | 可查看交付相关线程 | 可分发到交付待处理箱 | 可签收 | 可转派交付链角色 | 可发起升级 | 可创建 | 可确认订舱/出运/清关类候选对象 | 可关联 Shipment / Docs 类对象 | 可查看交付链相关审计链 |
| `Documentation_Officer` | 可查看单证相关线程 | 可分发到单证待处理箱 | 可签收 | 可转派单证/财务相关角色 | 可发起升级 | 可创建 | 可确认单证/交单类候选对象 | 可关联 Docs / L-C / D-P 类对象 | 可查看单证链相关审计链 |
| `Finance` | 可查看财务相关线程 | 可分发到财务待处理箱 | 可签收 | 可转派 Finance / CFO | 可发起升级 | 可创建 | 可确认付款/放单/服务费类候选对象 | 可关联 Payment / 服务费对象 | 可查看财务链相关审计链 |
| `Regional_Manager / Procurement_Manager / CFO / Sales_Director` | 可查看本线团队线程 | 可分发到本线待处理箱 | 必要时可签收 | 可跨人转派本线角色 | 可升级到更高层 | 可补建候选对象 | 可复核确认候选对象 | 可关联本线正式对象 | 可查看本线完整审计链 |
| `CEO` | 可查看升级件与关键线程 | 可分发 | 可签收 | 可转派 | 可升级/终审 | 可补建 | 可最终确认 | 可关联关键正式对象 | 可查看全量审计链 |
| `Admin` | 可查看配置与系统线程 | 仅系统调试时使用 | 原则上不参与日常签收 | 原则上不参与业务转派 | 原则上不参与业务升级 | 不作为日常业务确认者 | 不作为日常业务确认者 | 不作为日常业务Owner | 可查看系统级审计链 |

#### C. 候选对象确认边界

为避免邮件工作台绕过正式业务责任链，候选对象确认建议按业务类型限制：

- `候选 ING / 候选 翻单询价 / 候选 翻单直下单`
  - `Sales_Rep` 可确认
  - `Regional_Manager` 可复核
- `候选 项目会议纪要 / 候选 项目行动项`
  - `项目Owner` 可确认
  - `Regional_Manager / Sales_Director` 可复核
- `候选 借抬头出口服务委托单`
  - `Sales_Rep` 可初步确认
  - 涉及服务费、代收代付时 `Finance` 可复核
- `候选 单证任务 / 交单任务 / 放单任务`
  - `Documentation_Officer / Finance` 可确认
- `候选 FAT / SAT / 质量整改项`
  - `QC` 可确认
  - 项目型订单下 `项目Owner` 可共同确认

#### D. 升级权限边界

- 一线处理角色
  - 可发起升级
  - 不可直接终止升级链
- 管理角色
  - 可接收升级
  - 可要求回退重处理
  - 可继续升级
- `CEO`
  - 可作为终局升级接收人
  - 可作最终责任指派
- `Admin`
  - 仅维护系统，不承担业务升级判定

权限结论：

- 第一阶段必须坚持“谁处理、谁确认、谁升级”分离；
- `查看权限` 不等于 `确认权限`，`确认权限` 也不等于 `正式业务审批权限`；
- 邮件工作台中的候选对象确认，只是将邮件挂接进业务链，不应替代该业务对象原有审批流；
- 管理角色和高管角色更多承担“复核、升级、兜底”责任，而不是代替一线长期处理普通线程。

### 3.11.3.1.2.5 第一阶段状态流转规则（第一版）

第一阶段邮件工作台建议至少定义 3 套状态流转规则：

- `邮件线程状态`
- `邮件分发状态`
- `邮件候选业务对象状态`

这样可以把“线程有没有被处理”“分发有没有被承接”“候选对象有没有被确认”三件事分开。

#### A. 邮件线程状态流转

建议状态：

- `new`
  - 新进入 ERP 的线程
- `triaging`
  - 正在归类或等待初步分发
- `assigned`
  - 已有明确当前处理人
- `linked`
  - 已关联至少一个正式业务对象
- `escalated`
  - 当前存在有效升级链
- `resolved`
  - 当前邮件问题已处理完成
- `closed`
  - 该线程当前轮次处理闭环

建议流转：

```text
new
-> triaging
-> assigned
-> linked
-> resolved
-> closed
```

允许分支：

- `triaging -> escalated`
- `assigned -> escalated`
- `linked -> escalated`
- `escalated -> assigned`
- `resolved -> assigned`
  - 当同一线程出现新邮件或新问题时可重新打开

控制规则：

- `new` 不应长期停留；
- `triaging` 表示“已进入工作台但还未确定明确处理链”；
- `assigned` 表示已有当前处理人，不一定已经形成候选对象；
- `linked` 表示已挂接正式业务对象，但不等于业务本身已结束；
- `resolved` 表示当前邮件问题已处理；
- `closed` 表示当前轮次邮件闭环；
- 如同一线程后续收到新邮件，应允许从 `closed/resolved` 回到 `assigned` 或 `triaging`。

#### B. 邮件分发状态流转

建议状态：

- `pending_department_pickup`
  - 已分发到部门待处理箱
- `accepted`
  - 已被具体责任人签收
- `reassigned`
  - 已转派给其他责任人
- `escalated`
  - 已进入升级链
- `resolved`
  - 当前分发事项已完成
- `closed`
  - 分发闭环结束

建议流转：

```text
pending_department_pickup
-> accepted
-> resolved
-> closed
```

允许分支：

- `accepted -> reassigned`
- `accepted -> escalated`
- `reassigned -> accepted`
- `escalated -> accepted`
- `resolved -> accepted`
  - 当同一线程再次派回当前链时

控制规则：

- 分发记录是责任链对象，不是线程对象本身；
- 同一线程可有多条历史分发记录，但同一时间应有一条“当前有效分发记录”；
- `resolved` 表示当前责任动作已完成；
- `closed` 表示该条分发记录不再作为当前有效责任链。

#### C. 邮件候选业务对象状态流转

建议状态：

- `draft`
  - 候选对象刚创建，还在补充摘要
- `pending_confirmation`
  - 等待责任人确认
- `confirmed`
  - 已确认成立
- `converted`
  - 已转为正式业务对象或已挂接正式对象
- `rejected`
  - 确认不成立
- `cancelled`
  - 因后续判断变化而取消

建议流转：

```text
draft
-> pending_confirmation
-> confirmed
-> converted
```

允许分支：

- `pending_confirmation -> rejected`
- `confirmed -> cancelled`
- `draft -> cancelled`

控制规则：

- `候选对象确认` 不等于 `正式业务审批通过`；
- `confirmed` 仅表示“这封邮件应当进入某条业务链”；
- `converted` 才表示“已生成正式业务对象或已挂接到现有正式对象”；
- `rejected` 应记录原因，例如：
  - 误判类型
  - 信息不足
  - 重复线程
  - 不进入 ERP 业务链

#### D. 三套状态流转之间的联动口径

- 当线程进入 `assigned` 时，不要求候选对象一定已存在；
- 当至少一个候选对象进入 `confirmed`，线程可继续保持 `assigned` 或进入 `linked`；
- 当候选对象进入 `converted` 且已挂接正式业务对象，线程状态建议进入 `linked`；
- 当当前分发记录进入 `resolved` 且线程已完成本轮业务处理，线程可进入 `resolved`；
- 当线程进入 `closed` 时，当前有效分发记录应同步 `closed`，但历史记录保留；
- 升级状态优先体现为“叠加控制状态”，不应覆盖候选对象确认结果。

状态流转结论：

- 第一阶段邮件工作台必须把 `线程状态 / 分发状态 / 候选对象状态` 分开；
- 不应只用一个“已处理/未处理”状态糊在一起；
- 后续进入代码实现时，优先保证状态流转清楚，再考虑页面表现形式。

## 3.11.3.1.5 邮件工作台第一阶段实施说明（第一版）

本节用于把前面已经定义的模块、对象、动作、权限、状态流转规则，收成一份真正可执行的第一阶段实施摘要。

### 3.11.3.1.5.1 第一阶段交付范围

第一阶段应交付以下内容：

- `邮件接入与同步模块`
  - 接入真实企业邮箱
  - 同步线程、正文、附件索引、同步状态
- `邮件队列与工作箱模块`
  - `待我处理`
  - `待本部门处理`
  - `我已分发`
  - `我被抄送`
  - `升级件`
- `邮件识别与业务候选模块`
  - 创建候选对象
  - 人工确认候选对象
- `邮件业务关联模块`
  - 关联客户、项目、订单、正式业务对象
- `邮件审计与升级模块`
  - 分发、签收、转派、升级、关闭留痕

第一阶段的最小对象为：

- `邮件线程`
- `邮件附件清单`
- `邮件候选业务对象`
- `邮件分发记录`
- `mail_links`

### 3.11.3.1.5.2 第一阶段明确不做

第一阶段不应纳入以下内容：

- 完整邮箱客户端替代
- 自动正式建单
- 复杂自动分发引擎
- AI 自动回信
- AI 自动发信
- AI 自动关闭任务
- 全自动附件结构化抽取
- 自动替代责任人确认

边界结论：

- 第一阶段目标是“把邮件拉进 ERP，并进入责任链和业务链”；
- 不是做一个功能很多但业务不落地的邮箱产品。

### 3.11.3.1.5.3 第一阶段与现有 ERP 的挂接方式

第一阶段建议与现有 ERP 按以下方式挂接：

- 在 ERP 内提供统一 `邮件工作台` 入口；
- 复用现有：
  - `SalesTodoCenter` 的待办中心工作方式；
  - 现有 Dashboard / Workbench 的模块挂载方式；
  - 现有正式业务对象作为候选对象落地方。

第一阶段优先挂接的正式业务对象：

- `ING`
- `翻单询价`
- `翻单直下单`
- `项目会议纪要`
- `项目行动项`
- `借抬头出口服务委托单`
- `单证任务`

第一阶段挂接原则：

- 邮件工作台不替代正式业务模块；
- 邮件工作台只负责：
  - 入口承接
  - 分发协同
  - 候选确认
  - 关联留痕
- 正式业务审批仍在各自业务模块完成。

### 3.11.3.1.5.4 第一阶段上线后的使用方式

上线后建议按下列方式使用：

1. 新邮件进入 ERP
- 先形成线程
- 再进入责任人或部门待处理箱

2. 当前处理人承接
- 签收
- 判断是否需要分发、转派、升级

3. 当前处理人确认邮件性质
- 形成候选业务对象
- 必要时补充摘要和备注

4. 候选对象确认后挂接业务
- 生成正式对象
- 或挂接到已有正式对象

5. 留痕并闭环
- 所有关键动作进入审计链
- 当前轮次处理完成后，线程进入 `resolved / closed`

### 3.11.3.1.5.5 第一阶段上线验收口径

第一阶段建议以是否形成“最小闭环”作为验收标准，而不是以页面数量作为验收标准。

建议最小验收口径：

- 内部用户可在 ERP 内看到与自己有关的业务邮件；
- 新邮件可进入责任人待处理箱或部门待处理箱；
- 可执行签收、转派、升级；
- 可创建并确认候选业务对象；
- 可将候选对象挂接到正式业务对象；
- 可从正式业务对象反查原始邮件线程；
- 关键动作均有审计记录；
- 线程状态、分发状态、候选对象状态三套状态流转清楚。

实施说明结论：

- 第一阶段应先把“入口、责任、候选、挂接、留痕”这 5 件事做稳；
- 后续第二阶段 AI 能力，只能建立在第一阶段已经稳定运行的前提上；
- 若第一阶段未形成责任链与业务链闭环，不建议提前开发 AI 回复或自动建议功能。

## 3.11.3.1.6 邮件工作台第一阶段收口结论（本轮）

截至本轮，邮件工作台第一阶段在主稿中的产品定义层，建议视为 `已完成收口`。

已完成定义的内容包括：

- 模块定位
- 第一阶段与第二阶段边界
- 默认分发规则
- 必须升级场景
- 最小对象字段
- ERP 模块结构
- 模块数据流
- 动作边界
- 责任链
- 角色权限矩阵
- 状态流转规则
- 第一阶段实施说明
- 第一阶段上线验收口径

收口判断：

- 当前不建议继续在“纯产品定义层”无限细化邮件工作台；
- 后续如继续推进邮件模块，应转入：
  - `实现准备层`
  - `代码落点设计`
  - `对象落库设计`
  - `入口挂载设计`
  - `与现有 Workbench/Center 的整合方式`
- 若未进入实现准备层，不建议继续提前展开 UI 细节或第二阶段 AI 细节。

后续推进建议：

1. `邮件工作台第一阶段`
   - 已可进入实现准备；
2. 主稿重心应切回 `Project 第一阶段`；
3. 如后续需要再回到邮件模块，应以“实现方案”而不是“继续扩写产品定义”为主。

## 3.11.3.1.3 第二阶段 AI 增强能力（第一版）

在第一阶段稳定后，邮件工作台可进入第二阶段 AI 增强，但 AI 应定位为“辅助处理与辅助判断”，不应绕过责任人和正式业务确认流程。

建议第二阶段优先补以下 3 类 AI 能力。

### A. AI 回复建议

建议能力：

- 根据线程上下文生成回复草稿；
- 根据角色生成不同口径的回复建议：
  - `Sales_Rep` 客户沟通口径
  - `Procurement` 供应商沟通口径
  - `QC` 质量整改沟通口径
  - `Documentation / Finance` 单证与放单沟通口径
- 支持提炼附件内容后生成回复要点。

控制规则：

- AI 只生成建议稿，不应直接自动发送；
- 涉及报价、合同、付款承诺、放单承诺的邮件，必须人工确认后才能发出；
- AI 回复应保留“生成版本 -> 人工修改版 -> 实际发送版”的审计链。

### B. AI 阶段总结

建议能力：

- 对单个邮件线程生成阶段摘要；
- 对某客户、某项目、某订单生成最近阶段总结；
- 对待处理箱生成“本周新增 / 已关闭 / 升级件 / 超时件”总结。

可生成的摘要类型：

- `客户沟通摘要`
- `项目阶段摘要`
- `订舱与出运摘要`
- `交单与放单摘要`
- `服务委托执行摘要`

控制规则：

- AI 阶段总结应明确时间范围；
- 总结内容应可回溯到原始邮件线程；
- AI 总结是管理摘要，不应替代正式业务状态。

### C. AI 业务建议

建议能力：

- 建议该邮件应转成什么候选业务对象；
- 建议应分发到哪个责任人或部门；
- 建议是否需要升级；
- 建议是否存在风险：
  - `L/C 不符点风险`
  - `客户投诉风险`
  - `项目变更风险`
  - `交期承诺风险`
  - `付款与放单风险`

控制规则：

- AI 建议只能作为“建议”，不应自动替代分发、升级、正式建单；
- 高风险建议应要求人工确认；
- AI 建议结果应允许被人工修正，并保留“建议 -> 最终处理”的差异记录。

第二阶段边界：

- 先做“AI 回复建议 / AI 阶段总结 / AI 业务建议”；
- 暂不建议一开始就做“AI 自动发信 / AI 自动正式建单 / AI 自动关闭任务”；
- 所有 AI 能力都应建立在第一阶段的线程、分发、候选对象、责任链已经稳定的前提上。

## 3.11.3.1.4 邮件工作台第一阶段与第二阶段边界总表（第一版）

| 能力项 | 第一阶段 | 第二阶段 |
|---|---|---|
| 真实邮箱接入 | 接入并同步线程、正文、附件索引 | 增强同步稳定性、失败重试策略 |
| 邮件线程 | 建立统一线程对象 | 增强自动关联与线程质量优化 |
| 邮件附件清单 | 建立附件清单与查看能力 | 增强附件结构化提取与内容理解 |
| 邮件候选业务对象 | 人工确认后转候选对象 | 自动建议候选类型与字段回填 |
| 邮件分发记录 | 分发、签收、转派、升级、关闭留痕 | 增强分发建议、自动催办、SLA 提醒 |
| 责任人待处理箱 | 必做 | 优化排序、优先级推荐 |
| 部门待处理箱 | 必做 | 增强部门内自动路由建议 |
| 业务对象关联 | 先支持人工关联和人工修正 | 增强自动关联建议 |
| 转询价 / 转翻单 / 转项目对象 / 转服务委托 | 必做 | 增强半自动正式建单 |
| AI 回复建议 | 不做 | 做建议稿，不自动发送 |
| AI 阶段总结 | 不做 | 做线程、客户、项目、待处理箱摘要 |
| AI 业务建议 | 不做 | 做转单建议、分发建议、升级建议、风险建议 |
| AI 自动发信 | 不做 | 原则上仍不直接开放自动发送 |
| AI 自动正式建单 | 不做 | 原则上仍以人工确认后生成为主 |
| AI 自动关闭任务 | 不做 | 原则上不建议作为第二阶段默认能力 |

边界结论：

- 第一阶段必须先把“邮件进入 ERP、进入待处理箱、进入候选对象、进入责任链”做稳；
- 第二阶段再补“AI 建议、AI 总结、AI 风险提示”，而不是本末倒置；
- 后续如讨论 AI 自动发信、AI 自动建单，默认应视为第三阶段或专项审批能力，不应默认纳入第二阶段基础范围。

## 3.11.3.2 邮件工作台分阶段实施（从第一阶段开始）

### 第一阶段：先做全员可用的最小分发闭环

第一阶段范围：

- 接入真实企业邮箱；
- 形成 `邮件线程 / 邮件附件清单 / 邮件候选业务对象 / 邮件分发记录`；
- 支持内部用户在 ERP 内完成：
  - 查看线程；
  - 手动归类；
  - 分发到责任人；
  - 分发到部门待处理箱；
  - 转派；
  - 升级；
  - 标记已处理；
  - 转候选业务对象。

第一阶段不做：

- 完整邮箱客户端替代；
- 自动正式建单；
- 复杂自动分发引擎；
- AI 自动回信；
- 全自动附件结构化抽取。

第一阶段目标：

- 所有内部用户都能在 ERP 内看到与自己有关的业务邮件；
- 业务邮件可以先进入“待处理箱”而不是散落在个人邮箱；
- 邮件可在内部完成承接、转派、升级与转业务候选对象；
- 邮件线程一旦进入业务执行，应形成可追溯责任链。

### 第二阶段：再补自动化与工程化

- 自动识别客户、项目、订单；
- 自动建议分发对象；
- 自动建议候选业务对象；
- 附件结构化提取；
- 邮件 SLA 与超时提醒；
- 半自动正式建单。

## 3.11.3.3 第一阶段默认分发规则（第一版）

第一阶段建议先采用“人工主导、规则辅助”的默认分发口径。

### 默认待处理箱

- `Sales_Rep`
  - 默认查看：客户询价、翻单、报价前沟通、客户投诉初始邮件
- `Procurement`
  - 默认查看：供应商询价、供应商报价、成本澄清、供应商交期沟通
- `QC`
  - 默认查看：验货安排、FAT/SAT 质量沟通、整改沟通
- `Order_Coordinator / Warehouse_Ops`
  - 默认查看：订舱、发运、装柜、到港、清关、签收沟通
- `Documentation_Officer`
  - 默认查看：单证、信用证、交单、不符点沟通
- `Finance / CFO`
  - 默认查看：回款、放单、例外放单、服务费、代收代付、银行交单沟通
- `Regional_Manager`
  - 默认查看：团队客户关键线程、超时未处理线程、升级件
- `CEO`
  - 默认查看：重大异常、关键客户、例外审批、升级件摘要

### 默认分发建议

- `新询价 / 翻单询价 / 翻单直下单`
  - 默认分发到客户 Owner 或对应 `Sales_Rep`
- `项目沟通 / 项目周报 / 图纸评审 / FAT / SAT`
  - 默认分发到 `项目Owner`
  - 如无项目 Owner，则先入 `Sales_Rep` 待处理箱
- `供应商报价 / 供应商交期 / 采购澄清`
  - 默认分发到 `Procurement`
- `订舱 / 船期 / 到港 / 清关 / 签收`
  - 默认分发到 `Order_Coordinator / Warehouse_Ops`
- `L/C / D/P / 托收 / 放单 / 不符点`
  - 默认分发到 `Finance`
  - 同时抄送 `Documentation_Officer`
- `借抬头出口服务委托`
  - 默认先分发到 `Sales_Rep`
  - 确认后再挂接服务委托单并流转到 `Order_Coordinator / Finance`

### 分发口径

- 第一阶段不强制自动分发；
- 系统可以给出默认建议，但最终由当前处理人确认；
- 分发到部门待处理箱后，部门内应能“签收”成为具体责任人；
- 已签收后，再次转派应保留前一责任人痕迹。

## 3.11.3.4 第一阶段必须升级场景（第一版）

以下场景在第一阶段建议设为“必须升级”或“必须加签”：

- 关键客户邮件超过约定时限未被签收；
- 涉及 `L/C 不符点 / 放单阻断 / 例外放单`；
- 涉及客户投诉、质量重大异常、FAT/SAT 未通过；
- 涉及项目范围变更、关键图纸版本争议、交期重大变化；
- 涉及大额服务费争议、代收代付金额争议；
- 涉及跨部门责任不清，线程被多次转派仍无明确 Owner；
- 涉及 CEO、CFO、Regional_Manager 已在现有业务链中定义的例外审批场景。

建议升级路径：

- 一线处理人 -> 部门主管
- 部门主管 -> 跨部门协调责任人
- 跨部门重大事项 -> `Regional_Manager / CFO / CEO`

控制规则：

- 升级不等于转移责任，升级后仍需保留当前承办人与升级对象；
- 升级邮件应进入 `升级件` 视图；
- 已升级线程如超过处理时限未关闭，应允许继续二次升级；
- 涉及正式业务对象的升级，应同步回挂到对应业务对象的控制规则与审计链。

## 3.11.4 邮件转询价与翻单

### A. 新询价邮件

建议流程：

- 邮件进入
- 识别客户、产品、数量、附件
- 形成 `候选 ING`
- 人工确认后转正式 `ING`

### B. 翻单询价邮件

建议流程：

- 自动匹配历史客户、历史订单、历史产品
- 形成 `候选 翻单询价`
- 自动带出：
  - 历史产品清单
  - 最近报价
  - 历史供应商
  - 历史封样或付款条件
- 人工确认后：
  - 可直接转 `QT草稿`
  - 如需重新核成本，则回流 `QR`

### C. 翻单直下单邮件

建议流程：

- 自动匹配历史客户、历史订单、历史产品
- 识别是否属于标准复购、规格明确、价格机制稳定
- 形成 `候选 翻单直下单`
- 人工确认后：
  - 可转 `SC`
  - 或直接转 `PR`

控制规则：

- 翻单客户不应被强迫重新走完整客户开发前段；
- ERP 应支持“历史订单一键复制、历史产品清单回填、历史供应商/价格/封样/付款条件继承”；
- 邮件来的翻单，目标是减少重复录入，而不是减少控制规则。

## 3.11.5 邮件转项目执行对象

对于 Project 客户，邮件不只意味着询价，还可能直接承接项目执行。

建议支持从邮件转成这些项目对象：

- `项目会议纪要`
- `图纸评审记录`
- `项目行动项`
- `项目问题清单`
- `项目变更单`

典型邮件主题包括：

- `FAT meeting`
- `Drawing revision comments`
- `Project weekly update`
- `SAT issue list`
- `Final handover comments`

控制规则：

- 项目邮件不应只作为普通客户往来保存在邮箱里；
- 会议纪要里的决定项和行动项，应能从邮件直接转成项目对象；
- 项目邮件应优先挂接 `project_id`，再挂接具体节点、风险、问题、图纸版本。

## 3.11.6 邮件转借抬头出口服务委托

对于借抬头出口服务，邮件工作台应支持：

- `转借抬头出口服务委托单`

建议流程：

- 客户邮件进入
- 识别出货清单、供应商、FOB 条件、是否需订舱、是否客户自购保险
- 形成 `候选 借抬头出口服务委托单`
- 人工确认后转正式服务委托单

建议最小字段：

- `source_mail_id`
- `service_order_type`
- `cargo_owner`
- `external_supplier_name`
- `supplier_trade_term`
- `booking_required`
- `insurance_handled_by_customer`
- `service_fee_amount`

控制规则：

- 借抬头服务委托不应误入普通贸易销售单；
- 邮件转服务委托后，应直接挂接到 `export_document_and_booking_service` 模板；
- 同一客户仍可保持 `customer_segment = trade`，但本次业务模板切换为服务模板。

## 3.11.7 邮件工作台核心动作

为了让 ERP 真正吸收邮件，主稿建议邮件详情页至少提供这些动作按钮：

- `转询价`
- `转翻单询价`
- `转翻单直下单`
- `转项目会议纪要`
- `转项目行动项`
- `转借抬头出口服务委托单`
- `分发到责任人`
- `分发到部门待处理箱`
- `转派`
- `升级`
- `标记已处理`

控制规则：

- 邮件工作台应以“从具体邮件转成业务执行”为目标；
- 邮件线程、附件、客户、项目、订单的关联关系应可回溯；
- 邮件不是独立系统，而是 ERP 的真实业务入口之一；
- 对内部用户而言，邮件工作台也应是“邮件协同分发中枢”，而不只是个人收件展示页。

---

## 4. 经营总主线树

说明：

- 本章节的 `经营总主线` 继续作为 ERP 的统一底座主轴；
- `agency / project / service_to_trade` 三类服务型客户，应优先按各自服务主轴理解，再按委托范围或项目阶段选择性挂接到这条统一主轴；
- 因此，下面的主线不是要求三类服务型客户完整强穿，而是提供统一的内部节点底座与挂接骨架。

### 4.0 新源头线回挂主轴说明（本轮）

前文新增的 `agency / project / service_to_trade / 借抬头出口服务 / 邮件工作台`，不应被理解为与统一主轴并列的孤立系统。本稿在进入主轴时，统一采用“回挂主轴”的口径：

- `邮件工作台`
  - 是主轴的入口增强层；
  - 不单独形成一条业务主轴；
  - 主要回挂到 `客户开发 / ING / 翻单快捷入口 / 项目纪要入口 / 服务委托入口`。
- `agency`
  - 是服务型客户主轴；
  - 可按委托范围选择性挂接到 `QR / XJ / BJ / QT / SC / PR / CG / QC / 订舱前决策 / Shipment / Docs`；
  - 不强制完整穿过统一贸易主轴。
- `project`
  - 是项目型客户主轴；
  - 其 `项目报价 / 合同与项目启动 / 采购与制造执行 / Shipment与现场交付 / Payment` 等阶段，分别回挂统一主轴的对应节点；
  - 但 `FAT / SAT / 最终移交` 仍保留为项目特有强化节点。
- `service_to_trade`
  - 初期优先回挂 `QC / 订舱前决策 / Shipment / Docs`；
  - 一旦出现商品采购需求，再切入 `客户开发 -> ING -> trade 主轴`。
- `借抬头出口服务`
  - 不走普通贸易成交前段；
  - 其前段是 `服务委托 / 抬头文件 / 客户确认`；
  - 其后段回挂 `订舱前决策 / Shipment / Docs / Payment`，并采用服务费与代收代付的财务口径。

### 4.0.1 新源头线回挂主轴总表（本轮）

| 新源头线 | 从哪里进入主轴 | 主要复用哪一段 | 在哪里收口 |
|---|---|---|---|
| `邮件工作台` | `客户开发 / ING / 翻单快捷入口 / 项目纪要入口 / 服务委托入口` | 只复用既有正式业务对象，不单独替代主轴 | 进入对应正式对象后，按主轴正常推进 |
| `agency` | `供应商筛选 / 询价支持 / 下单支持 / 跟单 / QC支持 / 订舱支持 / 单证支持` | `QR / XJ / BJ / QT / SC / PR / CG / QC / Shipment / Docs` | 在客户确认结束、服务交付结束或后续转贸易时收口 |
| `project` | `项目报价 / 合同与项目启动 / 采购与制造执行 / Shipment与现场交付 / Payment` | `QT / SC / PR / CG / Shipment / Docs / Payment` | 在 `最终验收 / 项目复盘 / 质保跟踪` 收口 |
| `service_to_trade` | `QC / 订舱前决策 / Shipment / Docs` | 复用后段执行与交付主轴 | 在 `服务反馈` 收口，或转入 `客户开发 -> ING` |
| `借抬头出口服务` | `服务委托 / 抬头文件生成 / 客户确认文件` 之后 | `订舱前决策 / Shipment / Docs / Payment` | 在 `服务费与代收代付结算关闭` 收口 |

### 4.0.2 按主轴五段回挂（本轮）

#### A. 入口段

- 统一入口仍是：
  - `客户开发`
  - `ING`
  - `翻单快捷入口`
- 新增回挂：
  - `邮件工作台`
    - 可转 `候选 ING / 候选翻单询价 / 候选翻单直下单 / 候选项目纪要 / 候选借抬头服务委托单`
  - `service_to_trade`
    - 若出现明确商品需求，回挂到 `客户开发 -> ING`

#### B. 成交前段

- 主轴节点：
  - `QR / XJ / BJ / QT / SC`
- 新增回挂：
  - `agency`
    - 在客户委托“筛供应商 / 询价 / 下单支持”时，选择性挂接到该段；
  - `project`
    - `项目报价` 回挂 `QT`
    - `合同与项目启动` 回挂 `SC`
  - `邮件工作台`
    - 可把邮件转成 `询价 / 翻单询价 / QT草稿 / SC`

#### C. 执行前段

- 主轴节点：
  - `AR/定金`
  - `PR`
  - `CG`
  - `打样 / 封样 / 量产`
- 新增回挂：
  - `project`
    - `设计/规格冻结` 与 `采购与制造执行` 回挂到该段；
  - `agency`
    - 在客户委托“下单支持 / 跟单支持”时，可挂到 `PR / CG / 打样 / 封样 / 量产`

#### D. 履约与交付段

- 主轴节点：
  - `QC`
  - `订舱前决策`
  - `Shipment`
  - `Docs`
- 新增回挂：
  - `project`
    - `FAT与发货前检查` 挂接在 `QC` 之前与 `Shipment` 之前；
    - `Shipment与现场交付` 回挂 `Shipment / Docs`；
  - `service_to_trade`
    - 委托验货挂 `QC`
    - 委托出运协调挂 `订舱前决策 / Shipment`
    - 委托单证支持挂 `Docs`
  - `借抬头出口服务`
    - 后段直接复用 `订舱前决策 / Shipment / Docs`
  - `agency`
    - 在客户委托 `QC支持 / 订舱支持 / 单证支持` 时挂接该段

#### E. 财务与闭环段

- 主轴节点：
  - `Payment`
  - `开票归档`
  - `Feedback`
  - `Repeat`
- 新增回挂：
  - `project`
    - 以项目型 `里程碑收款` 回挂 `Payment`
    - 以 `最终验收 / 项目复盘 / 质保跟踪` 收口
  - `借抬头出口服务`
    - 以 `服务费 / 海运费代收代付 / 非我司货款` 的专属财务口径挂接 `Payment`
    - 在 `服务结算关闭` 收口
  - `service_to_trade`
    - 若只做服务，不一定进入普通 Repeat；
    - 若形成商品采购需求，再回挂 `客户开发 / ING`

```text
经营总主线
└── 客户开发 -> 销售转化 -> 采购履约 -> 出运交付 -> 回款反馈 -> 复购转介绍
    ├── 1. 市场获客段
    │   ├── 目标：获得高质量线索
    │   ├── 输出：可经营客户线索
    │   └── 下交：客户开发段
    ├── 2. 客户开发段
    │   ├── 目标：把线索变成有效客户与商机
    │   ├── 输出：客户建档、客户分类、主流程模板确认
    │   └── 下交：询价承接段
    ├── 3. 询价承接段
    │   ├── 核心节点：ING
    │   ├── 目标：形成正式询价单
    │   └── 下交：报价转化段
    ├── 4. 报价转化段
    │   ├── 核心节点：QR / QT / SC
    │   ├── 目标：形成报价、合同与定金启动
    │   └── 下交：采购履约段
    ├── 5. 采购履约段
    │   ├── 核心节点：PR / CG
    │   ├── 目标：先通过 PR 完成采购需求分发与供应商拆分，再通过 CG 完成正式采购承诺与供应商履约启动
    │   └── 下交：生产与质控段
    ├── 6. 生产与质控段
    │   ├── 核心节点：QC
    │   ├── 目标：确认质量与放行
    │   └── 下交：出运与单证段
    ├── 7. 出运与单证段
    │   ├── 核心节点：Shipment / Docs
    │   ├── 目标：按时发运、单证齐套
    │   └── 下交：财务回款段
    ├── 8. 财务回款段
    │   ├── 核心节点：Payment
    │   ├── 目标：完成应收应付、票据、利润闭环
    │   └── 下交：客户反馈与复购段
    └── 9. 客户反馈与复购段
        ├── 核心节点：Feedback / Repeat
        ├── 目标：问题闭环、复购、扩品、转介绍
        └── 回接：客户开发段 / ING
```

### 4.1 主轴第一段对照：客户开发 / 邮件入口 / ING / 翻单快捷入口（本轮）

本轮先对照主轴第一段，目的是确认“入口段”哪些已具备真实底座，哪些仍是 `V1目标规则`。

#### 4.1.1 客户开发

主稿口径：

- 承接市场获客后的可经营线索；
- 完成客户建档、客户分类、Owner 确认、流程模板确认；
- 输出到 `ING` 或继续经营。

现有 ERP 结论：

- `CustomerManagementEnhanced` 已具备客户主档维护、客户类型与部分业务口径维护基础；
- `InquiryContext` 已具备按区域、Owner、assignedTo 的分配与归属逻辑；
- `staffDirectoryService / resolveDefaultSalesRepAssignment / resolveRegionalManagerEmail` 等逻辑说明“客户开发后的责任归属”已有真实底座。

当前判断：

- `部分具备`

剩余差距：

- 还没有把“客户开发段”作为独立经营工作台清晰产品化；
- 还没有把“客户类型 + 本次业务模板 + 后续主轴入口”在同一个入口里统一起来；
- 邮件入口与客户开发段的衔接仍未成型。

#### 4.1.2 邮件入口

主稿口径：

- 邮件工作台是主轴入口增强层；
- 可从具体邮件进入：
  - `候选 ING`
  - `候选 翻单询价`
  - `候选 翻单直下单`
  - `候选 项目纪要`
  - `候选 借抬头服务委托单`
- 同时承担内部分发与升级。

现有 ERP 结论：

- 现有系统原本仅有大量 `email` 字段、通知、模板、按 `customer_email` 查询业务对象等散点能力；
- 本轮已新增 ERP 内独立 `mail-workbench` 模块骨架，具备：
  - `邮件线程`
  - `邮件候选业务对象`
  - `邮件分发记录`
  - `mail_links`
  四类第一阶段最小对象；
- 当前邮件工作台已能：
  - 查看邮件线程
  - 创建候选对象
  - 分发到部门待处理箱
  - 更新分发状态
  - 将候选对象挂接到正式对象或轻量正式落点；
- 目前仍未接入真实企业邮箱同步，线程与对象仍属于第一阶段本地/模块级骨架。

当前判断：

- `部分具备`

剩余差距：

- 真实企业邮箱接入与同步仍未开始；
- 缺稳定的 `邮件附件清单` 存储与检索链；
- 责任人待处理箱、部门待处理箱、升级件视图目前仍是第一阶段轻量实现；
- `repeat_direct_order` 已具备最小正式对象底座，并已可从邮件工作台真实创建直下单草稿；
- `export_service_order` 已可从邮件工作台真实创建 `借抬头服务委托单`，并自动初始化抬头文件、服务费、代收代付运费三类附属记录。
- `project_meeting / project_action_item` 已可从邮件工作台真实创建 `Project 第一阶段` 对象，并同步写入邮件挂接、候选状态和线程状态。
- `document_task` 已具备最小正式对象底座，并已可从邮件工作台真实创建单证任务对象。

#### 4.1.3 ING

主稿口径：

- `ING` 是正式询价承接节点；
- 承接客户需求、产品、数量、交期、附件与责任归属；
- 可下推 `QR`，也可在直报价场景直接下推 `QT`。

现有 ERP 结论：

- `inquiryService` 已形成较完整的 `inquiries` 持久化服务；
- `InquiryContext` 已具备：
  - 创建
  - 更新
  - 提交
  - 分配
  - 状态更新
  - 本地 pending/synced 缓存
  - Owner / assignedTo / region 归属
- `salesTodoCenterService` 已将 `ING` 作为正式待办文档类型；
- `InquiryManagement / AdminInquiryManagement / SalesTodoCenter / SalesQuotationManagement / PurchaseOrderManagementEnhanced` 等模块都在消费 `ING`。

当前判断：

- `已落库`

剩余差距：

- 主轴意义上的“邮件转 ING”入口已开始落库：
  - 邮件工作台中的 `ing` 候选已可通过现有 `InquiryContext` 创建真实 `Inquiry`；
  - 创建后会同步更新邮件挂接、候选状态、线程状态；
- `ING` 与“翻单快捷入口”的桥接仍不清晰；
- `ING` 前面的客户开发经营台还没有完全产品化。

#### 4.1.4 翻单快捷入口

主稿口径：

- 老客户可以通过邮件或历史产品清单快速形成：
  - `翻单询价`
  - `翻单直下单`
- 目标是减少重复录入，但不减少控制规则。

现有 ERP 结论：

- 现有代码里，按 `customer_email` 回查历史：
  - `inquiries`
  - `sales_quotations`
  - `sales_contracts`
  - `orders`
  已有基础；
- `customer_inquiry_drafts` 已存在轻量草稿表，可按 `customer_email + draft_type` 保存草稿产品清单；
- `customerProductLibrary / product mappings / inquiry snapshot` 也提供了历史产品回填基础。
- 本轮已把邮件工作台中的 `repeat_quote` 候选挂到 `customer_inquiry_drafts`：
  - 当前按 `customer_email + draft_type=repeat_quote` 生成轻量翻单询价草稿；
  - 并同步写入邮件正式挂接、候选状态和线程状态。
- 本轮已为 `repeat_direct_order` 补了可持久化 `直下单草稿` 底座：
  - 新增独立 `directOrderDraftService`；
  - 仍兼容同步旧 `CreateOrder` 使用的 `draftOrders` 本地链；
  - 邮件工作台中的 `repeat_direct_order` 候选已可真实创建直下单草稿，并进入现有 `CreateOrder` 工作面。
- `CreateOrder` 提交动作已开始复用统一 bridge helper：
  - 先把 `直下单草稿` 转成标准订单结构；
  - 再进入现有 `OrderContext / orderService` 正式订单链；
  - 同时继续保留旧 `activeOrders` 兼容镜像，避免旧客户侧页面断链。
- 正式订单链的状态推进已开始轻量反写：
  - `OrderContext.addOrder / updateOrder` 会同步刷新 `直下单草稿` 的订单状态摘要；
  - 若草稿来源于邮件线程，则会同步刷新邮件线程状态与回看摘要。
  - 当前摘要已开始覆盖 `付款状态 / 进度百分比 / 追踪号 / 交期` 等关键执行信息；
  - 并已开始识别 `定金审核 / 定金到账 / 定金退回 / 余款审核 / 余款退回 / 生产 / 质检 / 待发 / 在途 / 签收` 等更细阶段。
  - 当前阶段判断已开始兼容 `paymentStatus` 文案差异、`confirmed/pending/rejected/received` 等凭证状态差异，以及 `signedAt / receivedAt / receivedBy` 等签收信号。

当前判断：

- `部分具备`

剩余差距：

- 还没有成型的“翻单快捷入口”工作台；
- 还没有把 `customer_inquiry_drafts`、历史订单回查、历史产品回填、历史供应商/价格继承收成一条统一路径；
- 邮件转“翻单询价”已经开始具备轻量正式桥接，但仍未形成完整工作台路径；
- 邮件转“翻单直下单”已开始具备第一阶段正式桥接，并已能下推到正式订单执行链入口，但仍未形成完整客户侧快捷入口闭环；
- `repeat_direct_order` 目前已具备最小正式对象底座，后续仍需继续明确：
  - 订单进入正式链后，如何继续回写更深的执行状态与客户侧概览；
  - 如何把订单后续 `财务 / 交付 / 签收` 节点再进一步收成统一摘要；
  - 历史订单回查、历史产品回填、价格继承如何统一收口到同一入口。

#### 4.1.5 本轮结论

- 主轴第一段里，最成熟的是 `ING`；
- `客户开发` 已有责任归属和客户主档底座，但尚未形成清晰独立工作台；
- `翻单快捷入口` 已有草稿和历史数据底座，并已通过邮件工作台开始接入 `repeat_quote -> customer_inquiry_drafts` 的轻量桥接；
- `repeat_direct_order` 已补最小正式 `直下单草稿` 底座，并开始通过邮件工作台接入现有 `CreateOrder` 工作面与正式订单执行链入口；
- `repeat_direct_order` 已开始具备“正式订单状态 -> 草稿摘要 -> 邮件回看”的轻量反写闭环；
- `repeat_direct_order` 的回看摘要已从静态状态扩展为统一执行摘要；
- `repeat_direct_order` 的阶段规则已开始识别 `定金审核 / 定金到账 / 定金退回 / 余款审核 / 余款退回 / 生产 / 质检 / 待发 / 在途 / 签收`；
- `翻单快捷入口` 现已在 `MyOrdersOverview` 形成轻量统一概览入口，不再只是分散在历史订单、报价、草稿页里的散点能力；
- `邮件入口` 已从纯 `V1目标规则` 进入第一阶段轻量落地，但真实邮箱接入仍是后续重点；
- 因此，第一段的最省代价顺序应是：
  - 先复用现有 `ING` 与历史数据底座；
  - 再继续压实 `直下单草稿 -> 正式订单执行链` 的后续摘要；
  - 同步把母稿状态判断继续收口；
  - 真实邮箱同步与更重的入口工作面，后移第二阶段。

#### 4.1.6 第一段桥接收口（本轮）

已经真实接上的：

- `ing -> Inquiry`
  - 邮件工作台中的 `ing` 候选已可通过现有 `InquiryContext` 创建真实正式询价；
- `repeat_quote -> customer_inquiry_drafts`
  - 邮件工作台中的 `repeat_quote` 候选已可挂到现有轻量翻单询价草稿底座。
- `repeat_direct_order -> 直下单草稿对象`
  - 邮件工作台中的 `repeat_direct_order` 候选已可创建真实 `directOrderDraftService` 记录；
  - 当前先落最小草稿对象字段：`draftNumber / source_mail_thread_id / source_order_id / customer_email / status`；
  - 并复用现有 `CreateOrder` 工作面继续承接客户侧草稿编辑；
  - 草稿提交时已可通过统一 bridge helper 下推到 `OrderContext / orderService` 正式订单链；
  - 正式订单状态变更时，已可轻量反写到草稿摘要，并在 `MailThreadDetail` 回看；
  - 当前摘要已开始覆盖 `付款状态 / 进度 / 追踪号 / 交期` 等关键执行节点；
  - 并已开始把 `定金审核 / 定金到账 / 定金退回 / 余款审核 / 余款退回 / 生产 / 质检 / 待发 / 在途 / 签收` 收成统一阶段；
  - 同时兼容 `paymentStatus` 文案差异与 `signedAt / receivedAt / receivedBy` 等签收信号，不再只依赖单一 `status` 字段。
- `export_service_order -> 借抬头服务委托单`
  - 邮件工作台中的 `export_service_order` 候选已可创建真实服务委托单；
  - 创建时会同步初始化 `抬头文件记录 / 服务费应收记录 / 代收代付运费记录`；
  - 并同步写入邮件挂接、候选状态和线程状态。
- `project_meeting -> 项目会议纪要`
  - 邮件工作台中的 `project_meeting` 候选已可创建真实 `projectMeetingService` 记录；
  - 当前先复用邮件线程中的 `linkedProjectName` 或邮件锚点生成 `projectId / projectRevisionId`，并同步写入邮件挂接、候选状态和线程状态。
- `project_action_item -> 项目行动项`
  - 邮件工作台中的 `project_action_item` 候选已可创建真实 `projectActionItemService` 记录；
  - 若同项目锚点下已存在会议纪要，则会优先挂到最近一次会议纪要下。
- `document_task -> 单证任务对象`
  - 邮件工作台中的 `document_task` 候选已可创建真实 `documentTaskService` 记录；
  - 当前先落最小任务对象字段：`taskNumber / source_mail_thread_id / docCode / owner / dueAt / status`；
  - 并通过 `DocumentationWorkbenchUltimate` 顶部轻量任务面板进入单证工作面。

收口判断：

- 第一段当前已经做到“邮件工作台开始真实咬住主轴入口”，但仍是选择性桥接；
- 后续应优先坚持“有稳定底座才接、没有底座先保持轻量挂接”的原则，不为追求完整感而硬连。

### 4.2 主轴第二段对照：QR / XJ / BJ / QT / SC（本轮）

本轮对照主轴第二段，目的是确认“从正式询价到报价/合同”这一段在现有 ERP 中已经落到什么程度。

#### 4.2.1 QR

主稿口径：

- `QR` 是业务员创建、采购承接的报价请求单；
- 承接 `ING` 的成本询报需求；
- 可下推 `XJ`，并汇总回写后进入 `QT`。

现有 ERP 结论：

- 现有代码同时存在：
  - `QuoteRequirementContext`
  - `QuotationRequestContext`
  两层口径；
- `QuotationRequestContext` 明确把 `QR -> XJ -> BJ -> QT` 作为一条上下游链来处理；
- `xjQuotationRequestServices` 中已包含 `QR` 主承载行的序列化与反序列化逻辑，保留：
  - `request_number`
  - `source_inquiry_id / source_inquiry_number`
  - `customer_email`
  - `assigned_to`
  - `xj_ids / xj_count`
  - owner/operator/acting/authenticated user 字段。

当前判断：

- `部分已落库`

剩余差距：

- `QR` 当前存在“双层口径”，仍有语义并存感；
- `BJ 回写同一 QR` 的主轴表达已在部分代码和上下文中存在，但还需要继续统一到单一主承载；
- `QR` 与主轴控制规则的展示层还未完全收拢成统一工作面。

#### 4.2.2 XJ

主稿口径：

- `XJ` 是采购员发给供应商的采购询价；
- 承接 `QR`；
- 汇集供应商报价，形成 `BJ` 候选集。

现有 ERP 结论：

- `XJContext` 是独立的正式主对象上下文；
- `xjQuotationRequestServices` 已形成较完整的 `xj` 持久化服务；
- 已具备：
  - `sourceQRNumber`
  - `sourceInquiryId / sourceInquiryNumber`
  - 供应商信息
  - 报价截止期
  - 产品清单
  - `quotes`
  - 项目修订基线透传。

当前判断：

- `已落库`

剩余差距：

- `XJ -> BJ -> QR 回写` 的执行闭环虽然已有基础，但在业务工作面上的统一表达仍不够集中；
- `XJ` 与供应商侧门户、供应商回复体验仍可能有分散实现。

#### 4.2.3 BJ

主稿口径：

- `BJ` 是供应商报价；
- 进入比价、议价、推荐供应商选择；
- 完成后回写 `QR`。

现有 ERP 结论：

- 现有代码没有发现单独独立的 `BJ` 主表服务；
- 当前更多是作为：
  - `XJ.quotes`
  - 或 `QT` 里的 `selectedBJ`
  的承载方式存在；
- `SalesQuotationContext` 已明确存在 `selectedBJ` 字段，说明 `BJ` 已被销售报价环节消费。

当前判断：

- `部分具备`

剩余差距：

- 尚未看到独立统一的 `BJ` 主对象；
- 更像“嵌入在 XJ / QT 之间的供应商报价载荷”；
- 如果后续要做更强的比价分析、供应商推荐、AI 分析，仍可能需要进一步显式化。

#### 4.2.4 QT

主稿口径：

- `QT` 是销售报价单；
- 承接 `QR` 成本回写或 `ING` 直报价；
- 走审批后发给客户，客户反馈再进入 `SC` 或回流。

现有 ERP 结论：

- `salesQuotationService` 已形成完整的 `sales_quotations` 持久化服务；
- `SalesQuotationContext` / `QuotationContext` 已是成熟上下文；
- 已具备：
  - `approval_status`
  - `approval_chain`
  - `currentApprovalStep`
  - `currentApproverRole`
  - `requiresDirectorApproval`
  - `customer_status / customer_response`
  - `pushed_to_contract / pushed_contract_number`
  - `qr_number / inquiry_number`
  - 项目修订基线透传。

当前判断：

- `已落库`

剩余差距：

- `邮件转 QT 草稿` 入口还未形成；
- `翻单询价 -> QT 草稿` 的快捷承接还未形成统一入口；
- `QT` 与主轴整体展示仍有分散上下文问题，但主对象本身已经成熟。

#### 4.2.5 SC

主稿口径：

- `SC` 是销售合同；
- 承接客户确认后的报价；
- 走审批、签署、定金、后续 PR/CG 启动。

现有 ERP 结论：

- `contractOrderArServices` 已形成 `sales_contracts / orders / AR` 相关持久化服务；
- `SalesContractContext` 是成熟正式上下文；
- 已具备：
  - `approval_flow`
  - `approval_history`
  - `approval_notes`
  - `rejection_reason`
  - `currentApprovalStep / currentApproverRole / requiresDirectorApproval`
  - `customerPortalPaymentStatus`
  - `SC -> AR`
  - `SC -> PR`
  - `SC -> production / shipped / completed` 的后续反射逻辑；
- 已具备项目修订基线透传。

当前判断：

- `已落库`

剩余差距：

- `SC` 的客户签署反馈、条款异议、拒签复盘虽然在主稿里定义很清楚，但前台统一工作面表达仍可继续收口；
- `邮件转合同前沟通 / 合同签署前沟通` 仍未挂到正式入口。

#### 4.2.6 本轮结论

- 主轴第二段里，最成熟的是 `XJ / QT / SC`；
- `QR` 已有较强底座，但当前仍带有“双层口径”特点，需要后续继续统一；
- `BJ` 当前最像“嵌入式供应商报价载荷”，还不是完全独立主对象；
- 如果按最省代价顺序继续：
  - 不应重做 `QT / SC / XJ`；
  - 应优先统一 `QR` 承载口径；
  - 再决定 `BJ` 是否需要提升成更显式的主对象或分析对象；
  - 邮件入口只需挂接到已有 `QT / SC / QR` 主对象，不必重做成交前主链。

### 4.3 主轴第三段对照：AR/定金 / PR / CG / 打样/封样 / 量产（本轮）

本轮对照主轴第三段，目的是确认“合同生效后的执行前段”在现有 ERP 中已经落到什么程度，哪些节点已经有真实落库，哪些仍主要停留在控制口径或执行字段层。

#### 4.3.1 AR/定金

主稿口径：

- `AR/定金` 是 `SC` 生效后的财务启动节点；
- 承接应收创建、客户上传定金水单、财务核销、Portal 状态同步；
- 定金条件满足后进入 `PR`。

现有 ERP 结论：

- `SalesContractContext` 已存在明确的 `SC -> AR` 自动创建路径；
- `contractOrderArServices / FinanceContext / PaymentContext` 已形成：
  - `accounts_receivable`
  - 按订单号更新应收
  - 定金比例、定金金额、定金凭证、定金确认人/确认时间
  - `customerPortalPaymentStatus`
  的真实承接；
- `SalesContractManagement` 中也已把 `deposit_uploaded / deposit_confirmed` 作为合同推进门槛使用。

当前判断：

- `已落库`

剩余差距：

- `AR/定金` 作为独立财务工作面仍有分散感；
- 项目型里程碑收款、服务费应收、代收代付等新口径还未并入这一层；
- 邮件入口与“催定金 / 水单确认”之间还未打通。

#### 4.3.2 PR

主稿口径：

- `PR` 是合同生效后的内部采购需求校验/分发节点；
- 承接产品行、交期、质量要求、包装要求、供应商拆分与履约启动预判；
- 输出到 `CG`。

现有 ERP 结论：

- `SalesContractManagement` 已存在真实的 `requestProcurementFromContract` 触发路径；
- `SalesContractContext.markPRInitiated()` 已用于把 `SC -> PR` 关系回写到合同；
- `PurchaseOrderContext` 已把 `PR` 作为 `procurementRequestStatus` 的正式一层：
  - `pending_procurement_assignment`
  - `partial_allocated`
  - `allocated_completed`
- `purchaseOrderQuoteRequirementServices` 也已有 `toPRRow / fromPRRow` 这一层服务承接。

当前判断：

- `已落库`

剩余差距：

- `PR` 的业务工作面和“供应商拆分 / 打样预判 / 封样预判”还没完全收成同一张工作台；
- 主稿里定义的 `PR` 控制规则较完整，但系统前台表达仍偏分散；
- 邮件和项目类入口还没有直接挂进 `PR`。

#### 4.3.3 CG

主稿口径：

- `CG` 是正式采购合同与采购审批节点；
- 承接 `PR` 分发结果；
- 走采购主管一审、金额超过阈值时 CEO 二审；
- 审批通过后进入下单、打样/封样/量产/QC 等后续执行。

现有 ERP 结论：

- `PurchaseOrderContext` 已把 `CG` 生命周期写成正式状态链：
  - `draft_allocated`
  - `pending_manager_approval`
  - `pending_ceo_approval`
  - `approved_boss`
  - `rejected_boss`
  - `pushed_supplier`
- `PurchaseOrderManagementEnhanced / PurchaseOrdersTab / ApprovalCenter / purchaseOrderUtils` 已按这条状态链工作；
- 当前采购审批规则也已按主稿口径收口为：
  - 全部先过 `Procurement_Manager`
  - 采购金额 `> 100000 CNY` 时进入 `CEO` 二审。

当前判断：

- `已落库`

剩余差距：

- `CG` 后续执行和“采购合同正文/文件包”的统一产品化仍可继续增强；
- 与项目型订单的 `FAT / SAT / 项目文件包` 还未直接挂接；
- 借抬头服务这类非普通采购业务，不应强行走 `CG`，还需模板层区分。

#### 4.3.4 打样/封样

主稿口径：

- `打样/封样` 是 `CG` 之后、量产之前的标准冻结链；
- 支持“必须打样”“可跳过打样”“沿用历史封样”“免样免封样但保留审批记录”等控制口径；
- `封样` 的目标是锁定量产标准并向 `QC` 提供优先检验依据。

现有 ERP 结论：

- `InspectionManagementComplete` 已存在真实的打样推进逻辑：
  - `sampleRequired`
  - `preProductionSampleStatus`
  - `sampleConfirmedAt`
  - `sealConfirmedAt`
  - 并可从“进入产前样”推进到“直接进入正式生产”；
- `purchaseOrderQuoteRequirementServices` 已把以下字段真实落到 `purchase_order_execution`：
  - `sample_required`
  - `pre_production_sample_status`
  - `pre_production_sample_no`
  - `sample_round`
  - `sample_confirmed_at`
  - `seal_confirmed_at`
- 说明样品/封样并不是纯文档规则，而是已经有明确执行字段。

当前判断：

- `部分具备`

剩余差距：

- 还没有完全独立的“打样工作台 / 封样工作台”；
- `sealed_sample_ref`、样品附件、客户样品反馈等主稿里的部分细字段仍未标准化；
- 主稿里定义的“历史封样沿用 / 禁止无封样量产 / 封样失效”更多仍是控制口径收口。

#### 4.3.5 量产

主稿口径：

- `量产` 是样品或封样确认后的正式生产执行节点；
- 关注排产、进度、完工、延误异常，并向 `QC` 输出待验货货物。

现有 ERP 结论：

- `purchaseOrderQuoteRequirementServices` 已真实持久化：
  - `production_started_at`
  - `estimated_completion_date`
  - `production_completed_at`
- `InspectionManagementComplete` 已在“样品确认 / 封样确认”后推进：
  - `productionStartedAt`
  - `productionCompletedAt`
- `SalesContractContext` 也已存在依据 `CG/PO` 执行推进 `SC.production / shipped / completed` 的反射逻辑。

当前判断：

- `部分具备`

剩余差距：

- 还没有完整独立的量产排程/进度工作台；
- “量产异常 / 延误升级 / 风险说明”更多仍属于主稿控制规则；
- 项目型订单所需的制造里程碑、FAT 前状态、整厂/模组级装配进度还未单独产品化。

#### 4.3.6 本轮结论

- 主轴第三段里，最成熟的是 `AR/定金` 与 `CG`；
- `PR` 也已经有真实对象、真实触发路径和真实状态链，不再只是过渡节点；
- `打样/封样` 与 `量产` 已有明确执行字段和推进逻辑，但还未完全产品化成独立工作面；
- 如果按最省代价顺序继续：
  - 不应重做 `AR/定金 / PR / CG`；
  - 应继续复用现有 `purchase_order_execution` 与 `InspectionManagementComplete` 底座；
  - 再把 `打样 / 封样 / 量产` 从“字段已具备”提升为“工作面更完整”的执行链；
  - 项目型订单的 `FAT / SAT / 最终移交` 应在这段之后按项目主轴继续挂接，而不是强行塞进普通采购链。

### 4.4 主轴第四段对照：QC / 订舱前决策 / Shipment / Docs（本轮）

本轮对照主轴第四段，目的是确认“履约与交付段”在现有 ERP 中已经落到什么程度，尤其是 `QC -> 订舱前决策 -> Shipment -> Docs` 这一段的真实落库与控制边界。

#### 4.4.1 QC

主稿口径：

- `QC` 是量产后的正式验货与放行节点；
- 承接排期、验货、报告、整改、复验与放行判断；
- 通过后进入 `订舱前决策`，不通过则回流整改或升级。

现有 ERP 结论：

- `inspectionServices` 已形成：
  - `qc_inspection_orders`
  - `supplier_inspection_reports`
  两类正式服务对象；
- `PurchaseOrderContext / purchaseOrderQuoteRequirementServices` 已真实承接：
  - `qcInspectionStatus`
  - `inspectionExecutionMode`
  - `customerDesignatedInspectionAgency`
  - `customerDesignatedInspectionStatus`
  - `inspectionMethodNotifiedAt`
  - `qcReportSharedToCustomerAt`
- `InspectionManagementComplete` 已具备：
  - 验货任务创建
  - 验货模式选择
  - QC 结果回写
  - `qc_pending / qc_passed / qc_failed`
  - 客户指定第三方验货协同。

当前判断：

- `已落库`

剩余差距：

- `QC 例外放行` 仍未完全产品化成独立审批流；
- 主稿里“封样优先级、免样依据、最终放行阻断”的更细控制规则，仍有一部分属于控制口径收口；
- `QC` 与项目型 `FAT / SAT` 的关系尚未产品化区分。

#### 4.4.2 订舱前决策

主稿口径：

- `订舱前决策` 是 `Shipment` 前的综合放行节点；
- 需要同时判断：
  - `QC已放行`
  - 贸易条款/国际运费责任
  - 是否需商检
  - 是否需询运费
  - 客户是否确认运费与船期
  - `Payment` 放货条件是否满足；
- 满足条件后才可进入正式订舱。

现有 ERP 结论：

- `PurchaseOrderContext / purchaseOrderQuoteRequirementServices` 已真实落库：
  - `bookingResponsibility`
  - `freightConfirmationRequired`
  - `freightConfirmedByCustomerAt`
  - `bookingStatus`
  - `selectedBookingQuoteId`
  - `shippingOrderStatus`
  - `shipmentReadinessStatus`
- `InspectionManagementComplete` 已存在真实阻断逻辑：
  - 需客户确认运费但未确认时阻断
  - 非客户指定货代时未保存询价/比价记录时阻断
  - `blocked_by_payment`
  - `blocked_by_freight_confirmation`
- 已能承接你前面确认的业务口径：
  - “货比三家”在 V1 中定义为至少 `2` 个及以上货代询价留痕
  - 但当前代码最低门槛仍是至少有有效询价记录。

当前判断：

- `已落库`

剩余差距：

- `inspection_required / inspection_doc_status / freight_quote_valid_until / booking_decision_locked_at` 等更细字段仍主要停留在主稿口径；
- “至少 2 个货代询价留痕”的正式强门槛尚未完全产品化；
- 订舱前决策仍更多附着在执行模块中，尚未形成完全独立的专业工作面。

#### 4.4.3 Shipment

主稿口径：

- `Shipment` 承接订舱、装柜、报关、开船、在途、清关、到港、签收；
- 负责出运时间轴和交付执行闭环；
- 同时与 `Docs / Payment / Feedback` 联动。

现有 ERP 结论：

- `purchaseOrderQuoteRequirementServices` 已真实承接：
  - `booking_status`
  - `shipping_order_status`
  - `shipment_readiness_status`
  - 以及后续清关与交付相关执行字段；
- `InspectionManagementComplete` 已作为当前较强的执行工作面，承接：
  - 订舱推进
  - Shipping Order
  - 货代/船期协同
  - 后续交付推进；
- `ThirdPartyWarehouseModule` 也已承接发货执行、清关、签收、结案/发货执行归档等后段动作。

当前判断：

- `部分已落库`

剩余差距：

- `Shipment` 还没有完全作为单独统一主对象抽出来；
- 当前更多是执行字段 + 执行工作面组合，而不是一条完整独立的“Shipment 中枢”；
- 项目型订单的现场交付、安装调试、SAT 不能直接被普通 `Shipment` 全部覆盖，后面仍需按项目主轴增强。

#### 4.4.4 Docs

主稿口径：

- `Docs` 是出运单证、交单资料、信用证资料、开票归档支撑节点；
- 需要保证关键单证齐套，并与 `Payment / L/C / D/P / 放单` 联动；
- 对缺资料、单证不符、交单不符点等负责阻断和回流。

现有 ERP 结论：

- `purchaseOrderQuoteRequirementServices` 已真实承接：
  - `bank_submission_status`
  - `document_release_status`
  - 与交单/放单相关的执行字段；
- `postContractExecutionServices` 已具备：
  - `L/C` 不符点解析
  - 交单/放单阻断原因收口
  - `D05` 信息同步；
- `CompliancePacketsTab` 已形成较强的后段工作面，能够承接：
  - `D05 / D11 / D12 / D13 / D01`
  - 银行交单状态
  - 放单状态
  - `L/C` 不符点
  - 例外放单申请；
- 当前也已按角色收紧到 `Finance / CFO / CEO` 为主。

当前判断：

- `部分已落库`

剩余差距：

- `Docs` 仍然更像“财务包 / 合规包 + 执行字段”的组合，而不是一条完全统一的单证主对象；
- 更细的 `L/C` 审单审批、不符点独立审批模型、多方财务例外放单仍未完全产品化；
- 与项目型文件包、最终移交文件包之间还未统一成同一文件治理体系。

#### 4.4.5 本轮结论

- 主轴第四段里，`QC` 与 `订舱前决策` 的真实底座已经比较强；
- `Shipment` 与 `Docs` 也已经有真实执行链，但当前更偏“执行字段 + 工作面组合”，还不是完全独立统一的强主对象；
- 如果按最省代价顺序继续：
  - 不应重做 `QC` 或 `订舱前决策`；
  - 应继续复用 `inspectionServices / InspectionManagementComplete / purchase_order_execution / CompliancePacketsTab`；
  - 再把 `Shipment / Docs` 从“后段执行工作面”逐步收成更统一的交付中枢；
  - 项目型的 `FAT / SAT / 项目文件包 / 最终移交` 应在这一段之上做增强，不应破坏普通交付主链。

### 4.5 主轴第五段对照：Payment / 开票归档 / Feedback / Repeat（本轮）

本轮对照主轴第五段，目的是确认“财务与客户闭环段”在现有 ERP 中已经落到什么程度，并把 `Payment` 的财务收口与 `Feedback / Repeat` 的客户生命周期经营区分清楚。

#### 4.5.1 Payment

主稿口径：

- `Payment` 承接定金、尾款、信用证、托收、代收代付、应付处理与放货条件；
- 目标是完成财务结算收口，并为放单、开票归档、后续反馈提供依据；
- 对服务型模板，还需支持：
  - `服务费收入`
  - `海运费代收代付`
  - `非我司货款` 分线处理。

现有 ERP 结论：

- `SalesContractContext / contractOrderArServices / FinanceContext / PaymentContext` 已真实承接：
  - 定金
  - 余款
  - `balance_confirmed`
  - `customerPortalPaymentStatus`
  - `balancePaymentProof / balanceReceiptProof`
  - 应收账款
- `purchaseOrderQuoteRequirementServices / postContractExecutionServices / CompliancePacketsTab` 已真实承接：
  - `bank_submission_status`
  - `document_release_status`
  - `L/C` 不符点阻断
  - `D/P / 托收` 银行交单状态
  - 例外放单申请；
- `InspectionServiceFeeManagement / PaymentRecordManagement / AccountsPayableManagement` 也提供了服务费、付款、应付的部分底座，但还未统一成“借抬头出口服务”口径。

当前判断：

- `部分已落库`

剩余差距：

- 普通贸易 `Payment` 已较强，但 `服务费收入 / 海运费代收代付 / 非我司货款` 三条财务线还未统一建模；
- 项目型的里程碑收款尚未并入统一 `Payment` 工作面；
- 财务例外放货、多方会签、`L/C` 更细审批仍未完全产品化。

#### 4.5.2 开票归档

主稿口径：

- `开票归档` 是 `Payment` 收口后的发票与资料归档节点；
- 关注：
  - 待申请开票
  - 待开票
  - 已开票
  - 开票资料已归档；
- 注意它不等于客户生命周期结束。

现有 ERP 结论：

- `contractOrderArServices / supabase-db / database.types` 已存在：
  - `invoice_date`
  - 与发票编号、应收关联的底层承接；
- `postContractExecutionServices` 已能派生：
  - `invoiceNo`
  - `invoiceStatus`
  - `archiveStatus`
  - `archiveNo`
  并带到后段摘要；
- `ThirdPartyWarehouseModule` 当前已承接“发货执行归档”的后段动作；
- `CompliancePacketsTab` 与文档/财务包也已对接部分开票与归档材料。

当前判断：

- `部分具备`

剩余差距：

- “开票资料已归档” 目前更多是财务字段和派生摘要，并未形成独立统一的开票归档主工作面；
- 发货执行归档、发货单证归档、开票资料归档目前仍是分层分散状态；
- 项目型移交文件包与这里的发票/归档资料还未统一治理。

#### 4.5.3 Feedback

主稿口径：

- `Feedback` 承接客户回访、满意度、问题记录、投诉处理与服务复盘；
- 目标是把交付后的问题闭环清楚，而不是简单“订单完成”。

现有 ERP 结论：

- `postContractExecutionServices` 已真实承接：
  - `post_order_feedback`
  - `feedbackStatus`
  - `feedbackText`
  - `overallRating`
  - `reorderIntent`
  - `recommendIntent`
  - `internalSummary`
- 后段摘要里已经可以展示：
  - feedback 时间线
  - feedback 状态
  - 简要内容；
- `InspectionManagementComplete` 这类服务型执行面里也已有服务反馈与服务费闭环示例。

当前判断：

- `部分已落库`

剩余差距：

- 还没有统一的“客户反馈工作台”；
- 普通贸易反馈、项目型验收反馈、服务型反馈目前还未统一成同一反馈治理模型；
- 邮件工作台未来仍应与这一层挂接，承接邮件回访、投诉、整改沟通。

#### 4.5.4 Repeat

主稿口径：

- `Repeat` 是客户收到货后进入的复购、扩品、转介绍、转新 `ING` 节点；
- 目标是把客户经营从“已交付”转成“下一次机会”。

现有 ERP 结论：

- 现有系统已存在一定复购口径与历史回查基础：
  - 客户历史订单/报价/合同/询价回查
  - `CustomerDashboard` 中的 reorder 入口示意
  - 分析口径中的 `repeat_rate / repeat_clients`
- 但还没有一个统一显式的 `Repeat` 主工作面；
- “复购提醒 / 复购窗口 / 扩品机会 / 转新 ING” 目前更多仍是经营设计口径。

当前判断：

- `部分具备`

剩余差距：

- 缺统一复购经营工作台；
- 缺从 `Feedback -> Repeat -> 新ING` 的完整产品化桥接；
- 对 `agency / project / service_to_trade / 借抬头出口服务` 的再次经营路径还未统一产品化。

#### 4.5.5 本轮结论

- 主轴第五段里，`Payment` 的普通贸易底座已经较强，但服务费、代收代付、项目里程碑收款等新口径还未统一并入；
- `开票归档` 已有底层字段和后段派生能力，但还未形成独立统一工作面；
- `Feedback` 已有真实落库对象，`Repeat` 则更多仍停留在经营设计和历史回查底座层；
- 如果按最省代价顺序继续：
  - 不应重做普通贸易的 `Payment` 主底座；
  - 应先把服务型与项目型的财务口径挂进现有 `Payment`；
  - 再把 `开票归档 / Feedback / Repeat` 从分散字段和摘要，收成更完整的后段经营闭环。

### 4.6 主轴五段总判断表（本轮）

本表用于把 `4.1 ~ 4.5` 的分段对照压成一页高层判断，方便后续统一决定“哪些不该重做、哪些应先补工作面、哪些属于明确新增项”。

| 主轴段 | 核心节点 | 当前整体判断 | 最应复用 | 当前最大差距 | 后续优先方向 |
| --- | --- | --- | --- | --- | --- |
| 第一段：客户需求进入系统 | 客户开发 / 邮件入口 / ING / 翻单快捷入口 | `ING` 已成熟；入口层整体 `部分具备` | `InquiryContext`、`inquiryService`、历史订单回查、`customer_inquiry_drafts` | 缺统一邮件工作台；缺统一翻单快捷入口；客户开发还不是独立工作台 | 先补 `邮件线程 / 候选对象 / 分发记录`，再收口客户开发与翻单入口 |
| 第二段：成交前链 | QR / XJ / BJ / QT / SC | `XJ / QT / SC` 成熟；`QR / BJ` 仍需统一 | `xjQuotationRequestServices`、`salesQuotationService`、`contractOrderArServices` | `QR` 双层口径；`BJ` 仍偏嵌入式载荷 | 先统一 `QR` 承载口径，再决定 `BJ` 是否显式化 |
| 第三段：执行前链 | AR/定金 / PR / CG / 打样/封样 / 量产 | `AR/定金 / PR / CG` 已强落库；样品与量产 `部分具备` | `SalesContractContext`、`contractOrderArServices`、`PurchaseOrderContext`、`purchase_order_execution`、`InspectionManagementComplete` | 打样/封样/量产还不是完整独立工作面 | 不重做 PR/CG，优先把样品、封样、量产从字段层提升为更完整执行链 |
| 第四段：履约与交付 | QC / 订舱前决策 / Shipment / Docs | `QC / 订舱前决策` 强；`Shipment / Docs` 部分已落库 | `inspectionServices`、`InspectionManagementComplete`、`purchase_order_execution`、`CompliancePacketsTab` | `Shipment / Docs` 仍偏执行字段 + 工作面组合；L/C 更细审批未产品化 | 继续复用后段底座，逐步收成统一交付中枢与单证中枢 |
| 第五段：财务与客户闭环 | Payment / 开票归档 / Feedback / Repeat | `Payment` 普通贸易底座强；后三者部分具备 | `FinanceContext`、`PaymentContext`、`contractOrderArServices`、`postContractExecutionServices` | 服务费/代收代付/项目里程碑收款未并入；缺统一 Repeat 工作台 | 先把服务型与项目型财务口径并入 Payment，再补开票归档、反馈、复购经营工作面 |

#### 4.6.1 全局判断

- 现有 ERP **不是要重做主轴**，而是要在主轴上继续收口；
- 最不该重做的，是：
  - `ING`
  - `XJ`
  - `QT`
  - `SC`
  - `AR/定金`
  - `PR / CG`
  - `QC`
  - `订舱前决策`
- 最适合“补工作面、不重造底座”的，是：
  - `客户开发`
  - `翻单快捷入口`
  - `打样 / 封样 / 量产`
  - `Shipment`
  - `Docs`
  - `开票归档`
  - `Feedback / Repeat`
- 最明确的新增项，仍是：
  - `邮件工作台`
  - `Project` 的项目管理层对象（会议纪要 / 行动项 / 里程碑 / FAT / SAT / 移交）
  - `借抬头出口服务` 的前段四个轻量对象
  - `business_flow_template` 这类模板层驱动能力

#### 4.6.2 推荐实施顺序（基于主轴）

1. 入口增强：
   - 邮件工作台第一阶段
   - 翻单快捷入口
   - 客户开发入口收口
2. 执行前链增强：
   - 打样 / 封样 / 量产工作面
3. 服务型与项目型挂接：
   - 借抬头出口服务前段对象
   - Project 会议纪要 / 行动项 / 里程碑
4. 后段中枢增强：
   - Shipment / Docs 统一中枢
   - 开票归档 / Feedback / Repeat 收口
5. 第二阶段增强：
   - Project 的 FAT / SAT / 移交 / 风险 / 甘特图
   - 邮件工作台 AI 能力
   - 更细的财务例外审批与 L/C 审单控制

---

## 5. 组织与角色总树

```text
组织与角色
├── 战略决策层
│   ├── CEO
│   ├── Sales_Director
│   └── CFO
├── 经营管理层
│   ├── Regional_Manager
│   └── Procurement_Manager
├── 业务执行层
│   ├── Sales_Rep
│   ├── Sales_Assistant
│   ├── Procurement
│   ├── QC
│   ├── Order_Coordinator
│   ├── Warehouse_Ops
│   ├── Documentation_Officer
│   └── Finance
└── 增长与组织支持层
    ├── Marketing_Ops
    ├── HR_Admin
    ├── Admin_Ops
    └── External_Accountant
```

---

## 6. 角色挂接总树

```text
CEO
└── 经营驾驶舱中心
    ├── 战略经营驾驶舱
    ├── 区域对比中心
    ├── 客户结构中心
    ├── 大项目与风险中心
    └── 现金流与利润中心

Sales_Director
└── 销售总盘中心
    ├── 区域管理中心
    ├── 客户模式分析中心
    ├── 大单与重点客户中心
    ├── 团队绩效中心
    └── 丢单与复盘中心

Regional_Manager
└── 区域经营中枢
    ├── 区域驾驶舱
    ├── 分配与改派中心
    ├── 监督台
    ├── 团队绩效中心
    ├── 客户经营分析
    └── AI预警中心

Sales_Rep
└── 客户推进中枢
    ├── 我的待办中心
    ├── 我的客户池
    ├── 业务流程中心
    ├── 我的交付视图
    ├── 我的复购经营
    └── AI跟进助手

Sales_Assistant
└── 协同支撑中枢
    ├── 客户资料维护
    ├── 单据资料补齐
    ├── 提醒与催办
    └── 归档台账

Procurement_Manager
└── 采购管理中枢
    ├── 采购驾驶舱
    ├── PR校验中心
    ├── CG审批中心
    ├── 采购执行监督台
    ├── 供应商中心
    └── 异常决策中心

Procurement
└── 采购执行中枢
    ├── 待处理采购任务
    ├── 询比价台
    ├── CG执行台
    └── 供应商联络台

QC
└── 质量执行中枢
    ├── 验货订单中心
    ├── 验货报告中心
    ├── 整改复验中心
    ├── 标准模板中心
    └── 质量分析中心

Order_Coordinator
└── 履约节奏中枢
    ├── 履约时间轴中心
    ├── 进度跟催中心
    ├── 异常升级中心
    └── 协同日志中心

Warehouse_Ops
└── 发运执行中枢
    ├── 发货计划中心
    ├── 在途跟踪中心
    ├── 到港签收中心
    └── 发运异常中心

Documentation_Officer
└── 单证中枢
    ├── 单证矩阵中心
    ├── 文档库
    ├── 模板中心
    └── 单证报表中心

Finance
└── 资金执行中枢
    ├── 收款管理中心
    ├── 应付管理中心
    ├── 发票与票据中心
    ├── 利润分析中心
    └── 风险控制中心

CFO
└── 财务治理中枢
    ├── 财务驾驶舱
    ├── 应收应付控制中心
    ├── 现金流管理中心
    ├── 利润分析中心
    ├── 风险控制中心
    └── 合规资料与审计中心

Marketing_Ops
└── 增长前端中枢
    ├── 渠道线索池
    ├── 线索筛选台
    ├── 公海投放中心
    ├── 产品与内容推送
    └── 渠道效果分析
```

---

## 7. 页面与模块挂接树

```text
页面与模块
├── 经营驾驶舱中心
│   ├── CEO工作台
│   ├── Sales_Director工作台
│   ├── Regional_Manager工作台
│   ├── CFO工作台
│   ├── Finance工作台
│   └── Procurement_Manager工作台
├── 客户与商机中心
│   ├── CRM
│   ├── 运营工作台
│   ├── 客户分类与分层
│   ├── 公海池
│   └── 服务转贸易迁移台
├── 销售流程中心
│   ├── ING管理
│   ├── QR管理
│   ├── QT管理
│   ├── SC管理
│   ├── 销售待办中心
│   └── 区域主管监督台
├── 采购与供应链中心
│   ├── PR校验
│   ├── XJ/BJ询比价
│   ├── CG审批
│   ├── CG执行
│   └── 供应商中心
├── 履约与质控中心
│   ├── 生产进度
│   ├── QC验货
│   ├── 整改复验
│   └── 异常升级
├── 出运与单证中心
│   ├── 发货计划
│   ├── 在途跟踪
│   ├── 单证矩阵
│   ├── 文档库
│   └── 到港签收
├── 财务与回款中心
│   ├── 收款
│   ├── 应付
│   ├── 发票与票据
│   ├── 利润分析
│   └── 风险控制
└── 协同与AI中心
    ├── 超时提醒
    ├── 客户摘要
    ├── 下一步动作建议
    ├── 周报/月报
    └── 风险预测
```

---

## 8. 节点、动作、提醒、统计挂接树

```text
节点挂接
├── ING
│   ├── 动作：创建、澄清、补资料、下推
│   ├── 提醒：未首响、可下推未下推
│   └── 统计：新增ING、有效率、澄清时长
├── QR
│   ├── 动作：发起询报、回填成本、标异常
│   ├── 提醒：采购未响应、成本回传超时
│   └── 统计：回传时效、异常率
├── QT
│   ├── 动作：生成、发送、修订、谈判、下推SC
│   ├── 提醒：未反馈、即将过期
│   └── 统计：反馈率、采纳率、谈判周期
├── SC
│   ├── 动作：生成、发送、催签、催定金、下推PR
│   ├── 提醒：未签、未定金
│   └── 统计：签署时长、定金到账率
├── PR
│   ├── 动作：发起、校验、补充、拆分供应商、生成CG
│   ├── 提醒：待校验超时、供应商未分配完成
│   └── 统计：校验时长、补充率、PR转CG率
├── CG
│   ├── 动作：提交审批、审批、下单、催交、发起验货、关闭
│   ├── 提醒：待审批、交期临近、延误
│   └── 统计：审批时长、交期达成率、延误率
├── QC
│   ├── 动作：排期、验货、出报告、整改、复验、放行
│   ├── 提醒：报告超时、整改超时
│   └── 统计：首检通过率、复验率
├── Shipment
│   ├── 动作：订舱、装柜、报关、更新在途、签收
│   ├── 提醒：船期变化、到港未确认
│   └── 统计：出运准时率、在途异常率
├── Docs
│   ├── 动作：生成、上传、校验、归档
│   ├── 提醒：缺关键文档、退税资料缺失
│   └── 统计：完整率、差错率、归档及时率
├── Payment
│   ├── 动作：登记收款、登记付款、催款、核利润
│   ├── 提醒：定金未到、尾款到期、超账期
│   └── 统计：回款及时率、毛利率、账龄结构
├── Feedback
│   ├── 动作：回访、记问题、关闭问题
│   ├── 提醒：签收后未回访、问题未关闭
│   └── 统计：回访完成率、满意度、投诉率
└── Repeat
    ├── 动作：复购提醒、扩品、转新ING
    ├── 提醒：复购窗口、沉睡客户、服务转贸易机会
    └── 统计：复购率、扩品率、service_to_trade转化率
```

---

## 9. 现有模块保留与挂接

```text
现有模块保留并升级
├── 高层驾驶舱
│   ├── CEOWorkbench
│   ├── SalesDirectorDashboard
│   ├── RegionalManagerDashboard
│   ├── SalesRepDashboardExpert
│   ├── CFODashboardCompactWithHelp
│   ├── FinanceDashboardPro
│   └── ProcurementDashboard
├── 销售流程主干
│   ├── BusinessProcessCenter
│   ├── SalesTodoCenter
│   ├── AdminInquiryManagementNew
│   └── OrderManagementCenterPro
├── 采购与履约主干
│   ├── PurchaseOrderManagementEnhanced
│   ├── SupplierManagement
│   ├── InspectionManagementComplete
│   └── ShippingDocumentManagement
├── 单证与财务主干
│   ├── DocumentationWorkbenchUltimate
│   └── FinanceManagement
└── 增长前端主干
    └── MarketingOpsWorkbench
```

---

## 10. 待增强挂接

```text
待增强
├── 区域主管监督台
├── 跟单员履约协调台
├── 采购主管驾驶舱强化
├── 服务转贸易迁移台
├── 仓储/发运独立执行台
└── 全角色AI协同层
```

---

## 11. PR/CG 双节点细化树

```text
采购履约段
└── PR / CG 双节点细化
    ├── PR（采购需求分发节点）
    │   ├── 节点性质
    │   │   ├── 内部路由节点
    │   │   ├── 需求拆分节点
    │   │   ├── 供应商分配准备节点
    │   │   └── 非正式采购承诺节点
    │   ├── 节点目标
    │   │   ├── 把销售合同需求转成采购任务
    │   │   ├── 明确需由哪些供应商承接
    │   │   ├── 明确是否单供应商或多供应商拆分
    │   │   └── 为后续生成一个或多个CG做准备
    │   ├── 上承
    │   │   ├── SC已生效
    │   │   ├── 销售需求明确
    │   │   └── 客户交期与质量要求明确
    │   ├── 下交
    │   │   └── 一个或多个CG
    │   ├── 责任角色
    │   │   ├── 发起人：Sales_Rep / Sales_Assistant
    │   │   ├── 执行人：Procurement
    │   │   ├── 监督人：Procurement_Manager
    │   │   └── 协调人：Order_Coordinator
    │   ├── 状态树
    │   │   ├── 草稿
    │   │   ├── 待校验
    │   │   ├── 校验中
    │   │   ├── 待补充
    │   │   ├── 待分配供应商
    │   │   ├── 已分配供应商
    │   │   ├── 已生成部分CG
    │   │   ├── 已全部生成CG
    │   │   └── 关闭
    │   ├── 字段树
    │   │   ├── 基础字段
    │   │   │   ├── PR编号
    │   │   │   ├── 对应SC编号
    │   │   │   ├── 客户名称
    │   │   │   ├── 区域
    │   │   │   └── 申请人
    │   │   ├── 需求字段
    │   │   │   ├── 产品明细
    │   │   │   ├── 规格/材质
    │   │   │   ├── 数量
    │   │   │   ├── 包装要求
    │   │   │   ├── 目标交期
    │   │   │   └── 质量要求
    │   │   ├── 拆分字段
    │   │   │   ├── 是否拆单
    │   │   │   ├── 拆分数量
    │   │   │   ├── 拆分原因
    │   │   │   └── 各供应商承接份额
    │   │   ├── 供应商字段
    │   │   │   ├── 候选供应商
    │   │   │   ├── 已选供应商
    │   │   │   ├── 供应商分配完成度
    │   │   │   └── 是否允许新增供应商
    │   │   └── 校验字段
    │   │       ├── 是否信息完整
    │   │       ├── 是否已完成供应商分配
    │   │       ├── 是否可生成CG
    │   │       └── 校验备注
    │   ├── 动作树
    │   │   ├── 创建PR
    │   │   ├── 补充需求
    │   │   ├── 选择供应商
    │   │   ├── 拆分供应商份额
    │   │   ├── 完成校验
    │   │   ├── 生成单个CG
    │   │   ├── 批量生成多个CG
    │   │   └── 关闭PR
    │   ├── 校验规则树
    │   │   ├── 必填校验
    │   │   │   ├── 产品信息完整
    │   │   │   ├── 数量明确
    │   │   │   ├── 交期明确
    │   │   │   └── 质量要求明确
    │   │   ├── 供应商校验
    │   │   │   ├── 至少已分配一个供应商
    │   │   │   ├── 拆单数量合计正确
    │   │   │   └── 供应商状态可用
    │   │   └── CG生成校验
    │   │       ├── 每个供应商有独立采购范围
    │   │       ├── 每个供应商有独立数量
    │   │       └── 每个供应商可形成独立CG
    │   ├── 提醒树
    │   │   ├── PR待校验超时
    │   │   ├── PR信息不完整
    │   │   ├── 供应商未分配完成
    │   │   ├── PR已完成但未生成CG
    │   │   └── 多供应商拆单不平衡提醒
    │   ├── 统计树
    │   │   ├── PR创建量
    │   │   ├── 平均校验时长
    │   │   ├── 待补充率
    │   │   ├── 单PR平均生成CG数
    │   │   └── PR转CG完成率
    │   └── 回流树
    │       ├── 需求不清 -> 回流 Sales_Rep
    │       ├── 交期不合理 -> 回流 Sales_Rep / Regional_Manager
    │       ├── 供应商不可承接 -> 回流 Procurement 重新分配
    │       └── 拆单逻辑不成立 -> 回流 Procurement_Manager 决策
    └── CG（正式采购承诺与审批节点）
        ├── 节点性质
        │   ├── 正式采购合同节点
        │   ├── 正式采购承诺节点
        │   ├── 正式审批节点
        │   └── 供应商履约启动节点
        ├── 节点目标
        │   ├── 固化具体供应商采购条件
        │   ├── 固化价格、数量、交期、付款方式
        │   ├── 通过审批完成正式下单
        │   └── 启动生产与履约
        ├── 上承
        │   └── PR已校验完成并已分配供应商
        ├── 下交
        │   ├── 供应商履约
        │   ├── 生产进度
        │   ├── QC
        │   └── Shipment
        ├── 责任角色
        │   ├── 创建人：Procurement
        │   ├── 审批人：Procurement_Manager
        │   ├── 协同人：Finance / Order_Coordinator
        │   └── 监督人：必要时 CFO / Regional_Manager
        ├── 状态树
        │   ├── 草稿
        │   ├── 待审批
        │   ├── 审批中
        │   ├── 审批驳回
        │   ├── 审批通过
        │   ├── 已下单
        │   ├── 生产中
        │   ├── 待验货
        │   ├── 待出货
        │   ├── 已完成
        │   └── 关闭/取消
        ├── 字段树
        │   ├── 基础字段
        │   │   ├── CG编号
        │   │   ├── 来源PR编号
        │   │   ├── 对应SC编号
        │   │   ├── 供应商名称
        │   │   └── 创建人
        │   ├── 商务字段
        │   │   ├── 采购价格
        │   │   ├── 币种
        │   │   ├── 数量
        │   │   ├── 总金额
        │   │   ├── 付款条件
        │   │   └── 付款节点
        │   ├── 履约字段
        │   │   ├── 承诺交期
        │   │   ├── 生产周期
        │   │   ├── 验货要求
        │   │   ├── 包装要求
        │   │   ├── 发货要求
        │   │   └── 异常处理条款
        │   ├── 审批字段
        │   │   ├── 是否大额采购
        │   │   ├── 是否特殊供应商
        │   │   ├── 是否特殊付款条件
        │   │   ├── 是否特殊交期条款
        │   │   ├── 审批备注
        │   │   └── 驳回原因
        │   └── 执行字段
        │       ├── 下单日期
        │       ├── 当前状态
        │       ├── 最近跟催时间
        │       ├── 预计验货日期
        │       └── 预计出货日期
        ├── 动作树
        │   ├── 创建CG
        │   ├── 完善采购条件
        │   ├── 提交审批
        │   ├── 审批通过
        │   ├── 审批驳回
        │   ├── 正式下单
        │   ├── 更新生产进度
        │   ├── 发起验货
        │   └── 关闭CG
        ├── 审批规则树
        │   ├── 一级审批
        │   │   └── 所有采购合同均先由采购主管审批
        │   ├── 二级审批
        │   │   ├── 采购金额 > 100000 CNY
        │   │   └── 进入 CEO 二审
        │   ├── 特殊供应商审批
        │   │   ├── 新供应商
        │   │   ├── 观察名单供应商
        │   │   └── 黑名单恢复供应商
        │   ├── 特殊付款条件审批
        │   │   ├── 预付款比例异常
        │   │   ├── 账期异常
        │   │   └── 与常规条款不一致
        │   └── 特殊交期/例外条款审批
        │       ├── 极限交期
        │       ├── 风险交期
        │       └── 例外质量责任条款
        ├── 提醒树
        │   ├── CG待审批
        │   ├── 审批超时
        │   ├── 审批驳回未处理
        │   ├── 已审批未下单
        │   ├── 交期临近
        │   └── 延误风险
        ├── 统计树
        │   ├── CG审批时长
        │   ├── CG驳回率
        │   ├── 大额采购占比
        │   ├── 特殊供应商占比
        │   ├── 准时下单率
        │   └── CG关闭周期
        └── 回流树
            ├── 审批驳回 -> 回流 Procurement 修改条件
            ├── 价格不合理 -> 回流 Procurement 重新议价
            ├── 供应商不合格 -> 回流 PR 重选供应商
            ├── 付款条件不可接受 -> 回流 Finance / Procurement 调整
            └── 交期无法满足 -> 回流 Sales_Rep / Regional_Manager 协商客户预期
```

---

## 12. 关键销售与交付节点细化树

```text
销售转化与交付闭环
└── 关键节点细化
    ├── ING（询价节点）
    │   ├── 节点性质
    │   │   ├── 客户需求正式建单节点
    │   │   ├── 销售主链入口节点
    │   │   └── 后续QR/QT的源头节点
    │   ├── 节点目标
    │   │   ├── 固化客户需求
    │   │   ├── 固化客户与责任关系
    │   │   ├── 判断走QR还是直QT
    │   │   └── 为后续报价与合同提供来源依据
    │   ├── 上承
    │   │   ├── 客户建档完成
    │   │   ├── 已完成首次需求识别
    │   │   └── 已明确主流程模板
    │   ├── 下交
    │   │   ├── QR
    │   │   └── QT
    │   ├── 责任角色
    │   │   ├── 创建人：Sales_Rep
    │   │   ├── 协同人：Sales_Assistant
    │   │   └── 监督人：Regional_Manager
    │   ├── 状态树
    │   │   ├── 草稿
    │   │   ├── 新建
    │   │   ├── 待澄清
    │   │   ├── 信息补齐中
    │   │   ├── 可下推
    │   │   ├── 已下推QR
    │   │   ├── 已下推QT
    │   │   ├── 暂停
    │   │   └── 作废
    │   ├── 字段树
    │   │   ├── 客户字段
    │   │   │   ├── 客户名称
    │   │   │   ├── 国家/区域
    │   │   │   ├── 联系人
    │   │   │   ├── 联系方式
    │   │   │   ├── 客户对象类型
    │   │   │   └── 主流程模板
    │   │   ├── 需求字段
    │   │   │   ├── 产品/项目/服务名称
    │   │   │   ├── 规格/图纸/图片
    │   │   │   ├── 数量
    │   │   │   ├── 目标价格
    │   │   │   ├── 目标交期
    │   │   │   ├── OEM/ODM标记
    │   │   │   └── 附加要求
    │   │   └── 责任字段
    │   │       ├── owner_user_id
    │   │       ├── owner_email
    │   │       ├── owner_name
    │   │       ├── owner_role
    │   │       ├── assigned_to
    │   │       └── 区域主管
    │   ├── 动作树
    │   │   ├── 创建
    │   │   ├── 编辑
    │   │   ├── 澄清
    │   │   ├── 补附件
    │   │   ├── 改派
    │   │   ├── 下推QR
    │   │   ├── 直接下推QT
    │   │   ├── 暂停
    │   │   └── 作废
    │   ├── 提醒树
    │   │   ├── 24h未首响
    │   │   ├── 72h未更新
    │   │   ├── 缺关键需求项
    │   │   ├── 可下推未下推
    │   │   └── 重点客户ING停滞
    │   ├── 统计树
    │   │   ├── 新增ING数
    │   │   ├── 有效ING率
    │   │   ├── 澄清时长
    │   │   ├── 下推QR率
    │   │   └── 下推QT率
    │   └── 回流树
    │       ├── 需求不清 -> 回流客户沟通
    │       ├── 信息缺失 -> 回流Sales_Assistant补资料
    │       └── 责任不清 -> 回流Regional_Manager重新分配
    ├── QR / XJ / BJ（采购询价链节点组）
    │   ├── 节点组定位
    │   │   ├── 全链路位置：ING之后、QT之前
    │   │   ├── 目标：让QT建立在真实询价与比价结果之上
    │   │   └── 关系：QR为业务发起、采购承接的询报请求；XJ为采购创建并下推供应商；BJ为供应商回传并由采购承接
    │   ├── QR（成本询报发起节点）
    │   │   ├── 节点性质
    │   │   │   ├── 销售发起节点
    │   │   │   ├── 采购询价链入口节点
    │   │   │   └── 业务员创建、采购员承接并最终回填的询报请求单
    │   │   ├── 节点目标
    │   │   │   ├── 把客户需求正式交给采购端
    │   │   │   ├── 明确采购询价边界
    │   │   │   ├── 让采购员在“报价请求池”承接后续动作
    │   │   │   └── 承接 BJ 回写后的采购反馈与择优结果，作为 QT 的直接上游依据
    │   │   ├── 上承
    │   │   │   └── ING可下推
    │   │   ├── 下交
    │   │   │   └── XJ
    │   │   ├── 责任角色
    │   │   │   ├── 发起人：Sales_Rep
    │   │   │   ├── 承接人：Procurement
    │   │   │   └── 监督人：Regional_Manager / Procurement_Manager
    │   │   ├── 归属视图
    │   │   │   ├── 业务员侧
    │   │   │   │   ├── 模块：成本询报
    │   │   │   │   └── 行为：创建QR、查看采购反馈进度、读取已回填采购结论并下推QT
    │   │   │   ├── 采购员侧
    │   │   │   │   ├── 模块：报价请求池
    │   │   │   │   └── 行为：接收QR、创建XJ、接收BJ、回填QR
    │   │   │   └── 关键原则
    │   │   │       └── QR 虽由业务员创建，但采购侧既是执行承接池，也是BJ反馈回写池
    │   │   ├── 状态树
    │   │   │   ├── 草稿
    │   │   │   ├── 已发起
    │   │   │   ├── 待采购承接
    │   │   │   ├── 已下推XJ
    │   │   │   ├── 供应商询价中
    │   │   │   ├── 供应商报价回收中
    │   │   │   ├── 成本结论形成中
    │   │   │   ├── 待采购反馈回写
    │   │   │   ├── 成本已形成
    │   │   │   └── 已下推QT
    │   │   ├── 字段树
    │   │   │   ├── 对应ING
    │   │   │   ├── 产品明细
    │   │   │   ├── 目标数量
    │   │   │   ├── 目标交期
    │   │   │   ├── 指定采购员
    │   │   │   ├── 来源询价单号
    │   │   │   ├── ai_analysis_summary
    │   │   │   ├── recommended_supplier
    │   │   │   ├── recommended_cost
    │   │   │   ├── recommended_lead_time
    │   │   │   ├── supplier_comparison_snapshot
    │   │   │   └── 成本结果摘要
    │   │   ├── 动作树
    │   │   │   ├── 发起QR
    │   │   │   ├── 指定采购员
    │   │   │   ├── 查看采购员承接情况
    │   │   │   ├── 跟踪XJ/BJ进度
    │   │   │   ├── 接收采购反馈回写
    │   │   │   ├── 同步查看AI分析结果与择优价格
    │   │   │   └── 基于同一份QR下推QT
    │   │   ├── 提醒树
    │   │   │   ├── 待采购承接
    │   │   │   ├── XJ未创建
    │   │   │   ├── 询价链超时
    │   │   │   ├── 成本结果迟迟未形成
    │   │   │   └── BJ已齐但QR未回填
    │   │   ├── 统计树
    │   │   │   ├── QR发起量
    │   │   │   ├── QR承接时长
    │   │   │   ├── QR下推XJ时长
    │   │   │   ├── 成本形成时长
    │   │   │   ├── BJ回写QR时长
    │   │   │   └── QR转QT率
    │   │   └── 回流树
    │   │       ├── 需求不清 -> 回流ING
    │   │       ├── 采购无法理解 -> 回流Sales_Rep补充
    │   │       └── 客户要求变化 -> 回流ING重澄清
    │   ├── XJ（采购询价执行节点）
    │   │   ├── 节点性质
    │   │   │   ├── 采购向供应商发询价节点
    │   │   │   ├── 采购员创建的询价单
    │   │   │   └── 供应商 Portal【客户需求】上游节点
    │   │   ├── 节点目标
    │   │   │   ├── 将QR拆分成具体供应商询价任务
    │   │   │   ├── 把需求下推到供应商“客户需求池”
    │   │   │   └── 收集供应商后续BJ报价
    │   │   ├── 上承
    │   │   │   └── QR已发起
    │   │   ├── 下交
    │   │   │   └── BJ
    │   │   ├── 责任角色
    │   │   │   ├── 执行人：Procurement
    │   │   │   ├── 管理人：Procurement_Manager
    │   │   │   └── 协同人：Supplier
    │   │   ├── 归属视图
    │   │   │   ├── 采购员侧
    │   │   │   │   ├── 模块：询价管理
    │   │   │   │   └── 行为：创建XJ、追报价、补规格
    │   │   │   ├── 供应商侧
    │   │   │   │   ├── 模块：客户需求池
    │   │   │   │   └── 行为：看到XJ、进入报价
    │   │   │   └── 关键原则
    │   │   │       └── XJ 是采购员节点，不在业务员视图下作为主执行节点出现
    │   │   ├── 状态树
    │   │   │   ├── 待发询价
    │   │   │   ├── 已发询价
    │   │   │   ├── 已下推供应商客户需求
    │   │   │   ├── 待供应商回复
    │   │   │   ├── 已部分回复
    │   │   │   ├── 已全部回复
    │   │   │   └── 已形成BJ候选集
    │   │   ├── 字段树
    │   │   │   ├── xj_no
    │   │   │   ├── qr_reference
    │   │   │   ├── supplier
    │   │   │   ├── quotation_deadline
    │   │   │   ├── due_date
    │   │   │   ├── requirement_snapshot
    │   │   │   └── remarks
    │   │   ├── 动作树
    │   │   │   ├── 发询价
    │   │   │   ├── 补询价资料
    │   │   │   ├── 追报价
    │   │   │   ├── 记录供应商回复
    │   │   │   └── 转入BJ比价池
    │   │   ├── 提醒树
    │   │   │   ├── 供应商未回复
    │   │   │   ├── 有效供应商不足
    │   │   │   └── XJ超时
    │   │   ├── 统计树
    │   │   │   ├── 供应商响应率
    │   │   │   ├── 平均回复时长
    │   │   │   └── 有效报价覆盖率
    │   │   └── 回流树
    │   │       ├── 报价资料不足 -> 回流QR/ING
    │   │       ├── 供应商无有效报价 -> 回流采购重新扩供应商
    │   │       └── 交期都不满足 -> 回流Sales_Rep协商客户预期
    │   └── BJ（供应商报价回传与采购比价节点）
    │       ├── 节点性质
    │       │   ├── 供应商报价单节点
    │       │   ├── 采购比价分析节点
    │       │   └── QT直接上游节点
    │       ├── 节点目标
    │       │   ├── 接收供应商正式报价回传
    │       │   ├── 比较价格、交期、质量、付款条件
    │       │   ├── 形成 AI 分析后的择优建议
    │       │   └── 回写到原 QR，供业务员基于同一份 QR 制作 QT
    │       ├── 上承
    │       │   └── XJ已完成
    │       ├── 下交
    │       │   └── QT
    │       ├── 责任角色
    │       │   ├── 创建人：Supplier
    │       │   ├── 承接人：Procurement
    │       │   ├── 审视人：Procurement_Manager
    │       │   └── 使用人：Sales_Rep
    │       ├── 归属视图
    │       │   ├── 供应商侧
    │       │   │   ├── 模块：我的报价
    │       │   │   └── 行为：提交BJ
    │       │   ├── 采购员侧
    │       │   │   ├── 模块：供应商报价
    │       │   │   └── 行为：查看BJ、比价、反馈业务员
    │       │   └── 关键原则
    │       │       └── BJ 是供应商回传的报价单，采购侧承接、比价、AI分析，并回写原QR
    │       ├── 状态树
    │       │   ├── 草稿
    │       │   ├── 已提交
    │       │   ├── 待比价
    │       │   ├── 比价中
    │       │   ├── 待确认成本结论
    │       │   ├── 已确认成本结论
    │       │   └── 已反馈业务员
    │       ├── 字段树
    │       │   ├── bj_no
    │       │   ├── xj_reference
    │       │   ├── supplier_quote_price
    │       │   ├── supplier_lead_time
    │       │   ├── payment_terms
    │       │   ├── quality_commitment
    │       │   ├── recommended_supplier
    │       │   ├── recommended_cost
    │       │   └── risk_notes
    │       ├── 动作树
    │       │   ├── 供应商提交BJ
    │       │   ├── 采购员比价分析
    │       │   ├── 生成AI择优分析
    │       │   ├── 标记推荐供应商
    │       │   ├── 确认成本结论
    │       │   ├── 回写原QR表单
    │       │   └── 反馈业务员制作QT
    │       ├── 提醒树
    │       │   ├── 待比价超时
    │       │   ├── 成本结论未确认
    │       │   └── 成本异常需主管判断
    │       ├── 统计树
    │       │   ├── BJ时长
    │       │   ├── 成本波动率
    │       │   ├── 推荐供应商采纳率
    │       │   ├── BJ回写QR完成率
    │       │   └── BJ转QT率
    │       └── 回流树
    │           ├── 没有可接受成本 -> 回流XJ重询
    │           ├── 供应商结论不稳定 -> 回流Procurement_Manager判断
    │           └── 销售不可接受成本 -> 回流Sales_Rep重新谈需求/价格
    ├── QT（报价节点）
    │   ├── 节点性质
    │   │   ├── 销售正式报价节点
    │   │   ├── 客户决策推进节点
    │   │   └── SC前置节点
    │   ├── 节点目标
    │   │   ├── 形成客户可决策的报价
    │   │   ├── 在采购反馈成本基础上补利润与报价条件
    │   │   ├── 记录谈判与反馈
    │   │   └── 推动进入SC
    │   ├── 上承
    │   │   ├── ING
    │   │   └── QR已回填采购反馈结果或允许直报价
    │   ├── 下交
    │   │   ├── SC
    │   │   ├── 搁置
    │   │   └── 丢单
    │   ├── 责任角色
    │   │   ├── 创建人：Sales_Rep
    │   │   ├── 监督人：Regional_Manager
    │   │   └── 支持人：Sales_Director / Finance
    │   ├── 状态树
    │   │   ├── 草稿
    │   │   ├── 已发送
    │   │   ├── 待反馈
    │   │   ├── 谈判中
    │   │   ├── 已接受
    │   │   ├── 已拒绝
    │   │   ├── 已过期
    │   │   └── 已转SC
    │   ├── 客户反馈树
    │   │   ├── 接受
    │   │   │   └── 下推SC
    │   │   ├── 拒绝
    │   │   │   └── 进入丢单/搁置/复活池
    │   │   └── 议价
    │   │       └── 回流Sales_Rep修订报价或重新谈判
    │   ├── 字段树
    │   │   ├── 报价编号
    │   │   ├── 对应客户/ING
    │   │   ├── 对应QR
    │   │   ├── 产品与金额
    │   │   ├── source_cost_from_qr
    │   │   ├── profit_markup
    │   │   ├── domestic_additional_costs
    │   │   ├── 币种
    │   │   ├── 付款条款
    │   │   ├── 交货条款
    │   │   ├── 附加报价条件
    │   │   ├── 有效期
    │   │   ├── customerFeedback.status（accepted / rejected / negotiating）
    │   │   ├── customerFeedback.comment
    │   │   └── 丢单/搁置原因
    │   ├── 动作树
    │   │   ├── 生成报价
    │   │   ├── 从QR带入择优成本
    │   │   ├── 添加利润加成
    │   │   ├── 添加报价条件与附加信息
    │   │   ├── 发送报价
    │   │   ├── 修订报价
    │   │   ├── 记录谈判
    │   │   ├── 记录客户接受
    │   │   ├── 记录客户拒绝
    │   │   ├── 记录客户议价
    │   │   ├── 提交上级审批
    │   │   └── 下推SC
    │   ├── 提醒树
    │   │   ├── 已发送未反馈
    │   │   ├── 有效期即将到期
    │   │   ├── 谈判长期无推进
    │   │   └── 高价值QT待主管介入
    │   ├── 统计树
    │   │   ├── QT发送量
    │   │   ├── QT反馈率
    │   │   ├── QT接受率
    │   │   ├── 平均谈判周期
    │   │   └── 丢单原因分布
    │   └── 回流树
    │       ├── 成本不成立 -> 回流QR
    │       ├── 客户要改需求 -> 回流ING
    │       ├── 客户要改条款 -> 内部协同Finance
    │       └── 重大报价僵局 -> 回流Regional_Manager / Sales_Director介入
    ├── SC（销售合同节点）
    │   ├── 节点性质
    │   │   ├── 销售正式承诺节点
    │   │   ├── 履约启动节点
    │   │   └── PR上游源头节点
    │   ├── 节点目标
    │   │   ├── 确认成交
    │   │   ├── 锁定付款与交付条款
    │   │   └── 启动采购履约
    │   ├── 上承
    │   │   └── QT已接受
    │   ├── 下交
    │   │   ├── PR
    │   │   ├── 定金
    │   │   └── 履约启动
    │   ├── 责任角色
    │   │   ├── 创建人：Sales_Rep
    │   │   ├── 监督人：Regional_Manager
    │   │   ├── 财务承接：Finance
    │   │   └── 履约承接：Procurement / Order_Coordinator
    │   ├── 状态树
    │   │   ├── 草稿
    │   │   ├── 待签署
    │   │   ├── 条款异议
    │   │   ├── 已签署
    │   │   ├── 待定金
    │   │   ├── 已生效
    │   │   ├── 已拒签
    │   │   └── 取消
    │   ├── 客户反馈树
    │   │   ├── 接受并签署
    │   │   │   └── 下推AR / 定金 / 履约
    │   │   ├── 条款异议（退回修改）
    │   │   │   └── 回流Sales_Rep修订合同条款后重发
    │   │   └── 拒绝签署
    │   │       └── 进入合同拒签/复盘池
    │   ├── 字段树
    │   │   ├── SC编号
    │   │   ├── 客户与金额
    │   │   ├── 付款方式与比例
    │   │   ├── 交付条款
    │   │   ├── 交期要求
    │   │   ├── 特殊责任条款
    │   │   ├── 签署状态
    │   │   ├── contract_feedback_status
    │   │   └── contract_feedback_notes
    │   ├── 动作树
    │   │   ├── 生成SC
    │   │   ├── 发送签署
    │   │   ├── 催签
    │   │   ├── 确认签署
    │   │   ├── 催定金
    │   │   └── 下推PR
    │   ├── 提醒树
    │   │   ├── SC未签
    │   │   ├── 签后未收定金
    │   │   ├── 条款异常
    │   │   └── 已生效未发起PR
    │   ├── 统计树
    │   │   ├── QT转SC率
    │   │   ├── 签署时长
    │   │   ├── 定金到账率
    │   │   └── SC转PR率
    │   └── 回流树
    │       ├── 客户提条款异议 -> 回流Sales_Rep修订SC条款
    │       ├── 条款涉及付款/风险 -> 回流Finance协同
    │       ├── 拒绝签署 -> 进入合同拒签/复盘池
    │       ├── 定金迟迟不到 -> 回流Sales_Rep催款
    │       └── 履约条件不成立 -> 回流Regional_Manager介入
    ├── Shipment（出运节点）
    │   ├── 节点性质
    │   │   ├── 实货发运节点
    │   │   ├── 在途追踪节点
    │   │   └── 签收前主节点
    │   ├── 节点目标
    │   │   ├── 准时出运
    │   │   ├── 在途可见
    │   │   └── 到港可确认
    │   ├── 上承
    │   │   ├── QC放行
    │   │   └── Docs关键资料已就绪
    │   ├── 下交
    │   │   ├── 清关
    │   │   ├── 到港
    │   │   ├── 签收
    │   │   └── Feedback
    │   ├── 责任角色
    │   │   ├── 执行人：Warehouse_Ops / Order_Coordinator
    │   │   ├── 协同人：Documentation_Officer
    │   │   └── 客户同步：Sales_Rep
    │   ├── 状态树
    │   │   ├── 待订舱
    │   │   ├── 已订舱
    │   │   ├── 待装柜
    │   │   ├── 已装柜
    │   │   ├── 已报关
    │   │   ├── 已开船
    │   │   ├── 在途
    │   │   ├── 待清关
    │   │   ├── 清关中
    │   │   ├── 到港
    │   │   └── 已签收
    │   ├── 字段树
    │   │   ├── 船期
    │   │   ├── ETD/ETA
    │   │   ├── 港口
    │   │   ├── 箱型/箱量
    │   │   ├── 在途事件
    │   │   ├── 清关状态
    │   │   └── 签收状态
    │   ├── 动作树
    │   │   ├── 订舱
    │   │   ├── 装柜
    │   │   ├── 报关
    │   │   ├── 更新在途
    │   │   ├── 更新清关
    │   │   ├── 确认到港
    │   │   └── 确认签收
    │   ├── 提醒树
    │   │   ├── 船期变化
    │   │   ├── 装柜延误
    │   │   ├── 在途异常
    │   │   ├── 清关异常
    │   │   └── 到港未确认
    │   ├── 统计树
    │   │   ├── 出运准时率
    │   │   ├── 在途异常率
    │   │   ├── 清关异常率
    │   │   ├── 到港准时率
    │   │   └── 签收确认率
    │   └── 回流树
    │       ├── 船期异常 -> 回流Order_Coordinator协调
    │       ├── 客户改ETA预期 -> 回流Sales_Rep同步
    │       ├── 清关异常 -> 回流Documentation_Officer / Sales_Rep
    │       └── 文件不齐无法放行 -> 回流Docs
    ├── Docs（单证节点）
    │   ├── 节点性质
    │   │   ├── 文档归集节点
    │   │   ├── 合规与退税资料节点
    │   │   └── Shipment和Payment的支撑节点
    │   ├── 节点目标
    │   │   ├── 单证准确齐套
    │   │   ├── 出运资料齐套
    │   │   └── 财务资料可闭环
    │   ├── 上承
    │   │   ├── SC
    │   │   ├── Shipment
    │   │   └── Payment
    │   ├── 下交
    │   │   ├── 归档
    │   │   ├── 财务合规
    │   │   └── 退税资料包
    │   ├── 责任角色
    │   │   ├── 执行人：Documentation_Officer
    │   │   ├── 协同人：Finance / Warehouse_Ops / Sales_Rep
    │   │   └── 监督人：Order_Coordinator
    │   ├── 状态树
    │   │   ├── 待生成
    │   │   ├── 待补资料
    │   │   ├── 已生成
    │   │   ├── 待校验
    │   │   ├── 已齐套
    │   │   ├── 已归档
    │   │   └── 异常
    │   ├── 字段树
    │   │   ├── 文档类型
    │   │   ├── 对应订单/合同
    │   │   ├── 校验状态
    │   │   ├── 归档状态
    │   │   ├── 退税关联状态
    │   │   └── 缺失责任人
    │   ├── 动作树
    │   │   ├── 生成
    │   │   ├── 上传
    │   │   ├── 校验
    │   │   ├── 催补
    │   │   └── 归档
    │   ├── 提醒树
    │   │   ├── 出运前缺关键单证
    │   │   ├── 报关资料缺失
    │   │   ├── 收汇资料未补
    │   │   └── 退税资料未完成
    │   ├── 统计树
    │   │   ├── 单证完整率
    │   │   ├── 单证差错率
    │   │   ├── 齐套时长
    │   │   └── 归档及时率
    │   └── 回流树
    │       ├── 缺客户文档 -> 回流Sales_Rep
    │       ├── 缺出运资料 -> 回流Warehouse_Ops
    │       └── 缺收汇资料 -> 回流Finance
    ├── Payment（回款节点）
    │   ├── 节点性质
    │   │   ├── 资金闭环节点
    │   │   ├── 利润确认节点
    │   │   └── 风险暴露节点
    │   ├── 节点目标
    │   │   ├── 收回应收
    │   │   ├── 结清应付
    │   │   ├── 形成利润
    │   │   └── 完成财务闭环
    │   ├── 上承
    │   │   ├── SC
    │   │   ├── Shipment
    │   │   └── Docs
    │   ├── 下交
    │   │   ├── Feedback
    │   │   └── CFO风险/利润判断
    │   ├── 责任角色
    │   │   ├── 执行人：Finance
    │   │   ├── 协同人：Sales_Rep
    │   │   └── 监督人：CFO
    │   ├── 状态树
    │   │   ├── 待定金
    │   │   ├── 已收定金
    │   │   ├── 待尾款
    │   │   ├── 已收尾款
    │   │   ├── 超账期
    │   │   ├── 应付处理中
    │   │   └── 财务关闭
    │   ├── 字段树
    │   │   ├── 应收金额
    │   │   ├── 应付金额
    │   │   ├── 到期日
    │   │   ├── 水单
    │   │   ├── 毛利/毛利率
    │   │   └── 风险等级
    │   ├── 动作树
    │   │   ├── 登记收款
    │   │   ├── 登记付款
    │   │   ├── 催款
    │   │   ├── 标逾期
    │   │   └── 核利润
    │   ├── 提醒树
    │   │   ├── 定金未到
    │   │   ├── 尾款到期
    │   │   ├── 超账期升级
    │   │   └── 低毛利异常
    │   ├── 统计树
    │   │   ├── 定金及时率
    │   │   ├── 尾款及时率
    │   │   ├── 回款周期
    │   │   └── 毛利率
    │   └── 回流树
    │       ├── 客户迟迟不付 -> 回流Sales_Rep / Regional_Manager
    │       ├── 利润异常 -> 回流CFO
    │       └── 票据缺失 -> 回流Docs
    ├── Feedback（反馈节点）
    │   ├── 节点性质
    │   │   ├── 售后与满意度节点
    │   │   ├── 问题闭环节点
    │   │   └── Repeat上游节点
    │   ├── 节点目标
    │   │   ├── 完成交付回访
    │   │   ├── 闭环问题
    │   │   └── 挖掘下次需求
    │   ├── 上承
    │   │   ├── Shipment签收
    │   │   └── Payment完成或进入稳定状态
    │   ├── 下交
    │   │   └── Repeat
    │   ├── 责任角色
    │   │   ├── 执行人：Sales_Rep
    │   │   ├── 监督人：Regional_Manager
    │   │   └── 协同人：QC / Finance / Order_Coordinator
    │   ├── 状态树
    │   │   ├── 待回访
    │   │   ├── 已回访
    │   │   ├── 有问题待处理
    │   │   ├── 已关闭
    │   │   └── 待转复购
    │   ├── 字段树
    │   │   ├── 签收情况
    │   │   ├── 满意度
    │   │   ├── 问题分类
    │   │   ├── 严重程度
    │   │   ├── 下次需求时间
    │   │   └── 扩品信号
    │   ├── 动作树
    │   │   ├── 发起回访
    │   │   ├── 记问题
    │   │   ├── 指派处理
    │   │   ├── 关闭问题
    │   │   └── 转复购机会
    │   ├── 提醒树
    │   │   ├── 签收后未回访
    │   │   ├── 问题未关闭
    │   │   └── 满意度过低
    │   ├── 统计树
    │   │   ├── 回访完成率
    │   │   ├── 满意度
    │   │   ├── 投诉率
    │   │   └── 问题关闭时长
    │   └── 回流树
    │       ├── 质量问题 -> 回流QC / Procurement
    │       ├── 交付问题 -> 回流Order_Coordinator / Warehouse_Ops
    │       └── 收款争议 -> 回流Finance
    └── Repeat（复购节点）
        ├── 节点性质
        │   ├── 客户生命周期延续节点
        │   ├── 再开发节点
        │   └── 新一轮ING入口前节点
        ├── 节点目标
        │   ├── 促复购
        │   ├── 做扩品
        │   ├── 做转介绍
        │   └── 让服务客户转trade
        ├── 上承
        │   └── Feedback
        ├── 下交
        │   ├── 新ING
        │   └── 客户开发段
        ├── 责任角色
        │   ├── 执行人：Sales_Rep
        │   ├── 监督人：Regional_Manager
        │   └── 支持人：Marketing_Ops / Sales_Director
        ├── 状态树
        │   ├── 观察中
        │   ├── 复购窗口到期
        │   ├── 已触达
        │   ├── 形成新需求
        │   ├── 转新ING
        │   └── 沉睡客户
        ├── 字段树
        │   ├── 最近成交时间
        │   ├── 复购周期
        │   ├── 历史品类
        │   ├── 可扩品类
        │   ├── 年贡献
        │   └── 下次联系时间
        ├── 动作树
        │   ├── 发起复购提醒
        │   ├── 推荐新品
        │   ├── 标记扩品机会
        │   ├── 标记服务转贸易机会
        │   └── 转新ING
        ├── 提醒树
        │   ├── 复购窗口到期
        │   ├── 沉睡客户唤醒
        │   ├── 战略客户长期未下单
        │   └── 服务客户出现商品信号
        ├── 统计树
        │   ├── 复购率
        │   ├── 扩品率
        │   ├── 沉睡客户激活率
        │   └── service_to_trade转化率
        └── 回流树
            ├── 客户产生新需求 -> 回流ING
            ├── 客户类型变化 -> 回流客户建档重分类
            └── 重点客户经营升级 -> 回流Regional_Manager / Sales_Director
```

---

### 12.1 节点归属视图树（修正版）

```text
关键节点归属视图
├── QR
│   ├── 创建端：Sales_Rep
│   ├── 承接端：Procurement 报价请求池
│   ├── 执行端：Procurement
│   ├── 监督端：Regional_Manager / Procurement_Manager
│   └── 回流端：Sales_Rep / ING
├── XJ
│   ├── 创建端：Procurement
│   ├── 承接端：Supplier Portal【客户需求池】
│   ├── 执行端：Supplier
│   ├── 监督端：Procurement / Procurement_Manager
│   └── 回流端：Procurement / QR
├── BJ
│   ├── 创建端：Supplier
│   ├── 承接端：Procurement【供应商报价】
│   ├── 执行端：Procurement（比价/择优）
│   ├── 使用端：Sales_Rep（用于QT）
│   └── 回流端：Procurement_Manager / XJ / Sales_Rep
├── QT
│   ├── 创建端：Sales_Rep
│   ├── 承接端：Customer
│   ├── 执行端：Sales_Rep（跟进与谈判）
│   ├── 客户反馈端：接受 / 拒绝 / 议价
│   └── 回流端：QR / ING / Regional_Manager / Sales_Director
└── SC
    ├── 创建端：Sales_Rep
    ├── 承接端：Customer
    ├── 执行端：Sales_Rep / Finance / Procurement / Order_Coordinator
    ├── 客户反馈端：接受并签署 / 条款异议 / 拒绝签署
    └── 回流端：Sales_Rep / Finance / Regional_Manager
```

### 12.2 销售主链超详尽层（仍挂在同一总树上）

```text
销售主链超详尽层
└── 客户开发 -> ING -> QR -> XJ -> BJ -> QR回写 -> QT -> 客户反馈 -> SC -> 客户反馈
    ├── A. 客户开发
    │   ├── 发起端：Sales_Rep
    │   ├── 管理端：Regional_Manager
    │   ├── 输出
    │   │   ├── 客户建档完成
    │   │   ├── customer_segment 已确认
    │   │   ├── business_flow_template 已确认
    │   │   ├── owner 已确认
    │   │   └── 可转ING
    │   └── 决策十字路口
    │       ├── 信息不足
    │       │   └── 继续客户开发与资料补齐
    │       └── 信息足够
    │           └── 转ING
    ├── B. ING
    │   ├── 创建端：Sales_Rep
    │   ├── 协同端：Sales_Assistant
    │   ├── 管理端：Regional_Manager
    │   ├── 目标：形成正式需求单
    │   ├── 输出
    │   │   ├── 走QR
    │   │   └── 直走QT
    │   └── 决策十字路口
    │       ├── 客户需求不完整
    │       │   └── 回流客户沟通/补资料
    │       ├── 客户需求完整但必须先拿采购成本
    │       │   └── 下推QR
    │       └── 业务可直接报价
    │           └── 直接下推QT
    ├── C. QR
    │   ├── 节点性质：业务员创建的询报请求单
    │   ├── 创建端：Sales_Rep
    │   ├── 业务员侧视图
    │   │   ├── 模块：成本询报
    │   │   ├── 行为：创建QR
    │   │   ├── 行为：查看采购反馈进度
    │   │   └── 行为：读取回填结果并下推QT
    │   ├── 采购员侧视图
    │   │   ├── 模块：报价请求池
    │   │   ├── 行为：接收QR
    │   │   ├── 行为：基于QR创建XJ
    │   │   ├── 行为：接收BJ
    │   │   └── 行为：把BJ分析结果回写到原QR
    │   ├── 关键字段
    │   │   ├── qr_no
    │   │   ├── source_ing_no
    │   │   ├── product_snapshot
    │   │   ├── required_date
    │   │   ├── target_qty
    │   │   ├── ai_analysis_summary
    │   │   ├── recommended_supplier
    │   │   ├── recommended_cost
    │   │   ├── recommended_lead_time
    │   │   └── supplier_comparison_snapshot
    │   └── 决策十字路口
    │       ├── 采购未承接
    │       │   └── 停留在报价请求池，触发采购提醒
    │       ├── 已承接但资料不足
    │       │   └── 回流Sales_Rep补资料
    │       └── 可发供应商询价
    │           └── 创建XJ
    ├── D. XJ
    │   ├── 节点性质：采购员创建的询价单
    │   ├── 创建端：Procurement
    │   ├── 采购员侧视图
    │   │   ├── 模块：询价管理
    │   │   ├── 行为：选择供应商
    │   │   ├── 行为：补充规格和截止时间
    │   │   └── 行为：发送到供应商
    │   ├── 供应商侧视图
    │   │   ├── 模块：客户需求
    │   │   ├── 行为：查看客户需求
    │   │   └── 行为：准备并提交BJ
    │   ├── 关键字段
    │   │   ├── xj_no
    │   │   ├── qr_reference
    │   │   ├── supplier_id
    │   │   ├── quotation_deadline
    │   │   ├── due_date
    │   │   └── requirement_snapshot
    │   └── 决策十字路口
    │       ├── 供应商不接受/不回应
    │       │   └── 采购扩供应商或回流QR说明
    │       └── 供应商有效回应
    │           └── 形成BJ
    ├── E. BJ
    │   ├── 节点性质：供应商报价单
    │   ├── 创建端：Supplier
    │   ├── 供应商侧视图
    │   │   ├── 模块：我的报价
    │   │   └── 行为：提交报价、交期、付款条件
    │   ├── 采购员侧视图
    │   │   ├── 模块：供应商报价
    │   │   ├── 行为：查看BJ
    │   │   ├── 行为：比价/议价
    │   │   ├── 行为：生成AI分析
    │   │   └── 行为：确认择优结果
    │   ├── 关键字段
    │   │   ├── bj_no
    │   │   ├── xj_reference
    │   │   ├── supplier_quote_price
    │   │   ├── supplier_lead_time
    │   │   ├── payment_terms
    │   │   ├── quality_commitment
    │   │   └── risk_notes
    │   └── 决策十字路口
    │       ├── 报价不可用
    │       │   └── 回流XJ继续询价/补供应商
    │       ├── 报价可用但需人工议价
    │       │   └── 采购继续议价再确认BJ
    │       └── 报价可用且已择优
    │           └── 回写原QR
    ├── F. QR回写
    │   ├── 执行端：Procurement
    │   ├── 查看端：Sales_Rep
    │   ├── 回写内容
    │   │   ├── AI分析结果
    │   │   ├── 推荐供应商
    │   │   ├── 择优价格
    │   │   ├── 推荐交期
    │   │   └── 风险提示
    │   ├── 业务效果
    │   │   ├── 采购侧同一份QR完成反馈
    │   │   └── 业务员侧同一份QR同步看到更新
    │   └── 输出
    │       └── Sales_Rep 基于同一份QR下推QT
    ├── G. QT
    │   ├── 创建端：Sales_Rep
    │   ├── 输入来源
    │   │   ├── 直报价ING
    │   │   └── 已完成采购反馈回写的QR
    │   ├── 业务员侧动作
    │   │   ├── 读取QR择优价格
    │   │   ├── 添加利润加成
    │   │   ├── 添加报价条件
    │   │   ├── 添加附加信息
    │   │   └── 提交上级审批
    │   ├── 上级审批
    │   │   ├── 一审：Regional_Manager
    │   │   └── 二审：Sales_Director（按条件触发）
    │   ├── 客户侧反馈
    │   │   ├── 接受
    │   │   ├── 拒绝
    │   │   └── 议价
    │   └── 决策十字路口
    │       ├── 审批驳回
    │       │   └── 回流Sales_Rep修订QT
    │       ├── 客户接受
    │       │   └── 下推SC
    │       ├── 客户拒绝
    │       │   └── 进入丢单/搁置/复活池
    │       └── 客户议价
    │           └── 回流Sales_Rep继续谈判或修订QT
    └── H. SC
        ├── 创建端：Sales_Rep
        ├── 输入来源：QT已接受
        ├── 业务员侧动作
        │   ├── 生成合同
        │   ├── 添加合同条款
        │   ├── 发给客户签署
        │   └── 跟进签署与定金
        ├── 客户侧反馈
        │   ├── 接受并签署
        │   ├── 条款异议（退回修改）
        │   └── 拒绝签署
        └── 决策十字路口
            ├── 客户接受并签署
            │   └── 下推AR / 定金 / PR / 履约
            ├── 客户条款异议
            │   └── 回流Sales_Rep修订合同后重发
            └── 客户拒绝签署
                └── 进入合同拒签/复盘池
```

### 12.3 履约、交付、回款与闭环超详尽层（仍挂在同一总树上）

```text
履约、交付、回款与闭环超详尽层
└── SC生效 -> AR/定金 -> PR -> CG -> 打样 -> 封样 -> 量产 -> QC -> 订舱前决策 -> Shipment -> Docs -> Payment -> 开票归档 -> Feedback -> Repeat
    ├── A. SC生效与AR/定金启动
    │   ├── 触发条件：SC已接受并签署
    │   ├── 内部动作
    │   │   ├── 自动生成AR
    │   │   ├── 推送客户Portal付款状态
    │   │   ├── 标记Finance待核销
    │   │   └── 标记Sales_Rep待催定金
    │   ├── 客户侧动作
    │   │   ├── 查看应收
    │   │   ├── 上传定金水单
    │   │   └── 查看核销状态
    │   ├── 财务侧动作
    │   │   ├── 接收AR
    │   │   ├── 核对客户水单
    │   │   ├── 完成核销
    │   │   └── 同步Portal状态
    │   ├── 关键字段
    │   │   ├── ar_no
    │   │   ├── deposit_amount
    │   │   ├── deposit_due_date
    │   │   ├── deposit_proof / deposit_payment_proof
    │   │   ├── customerPortalPaymentStatus
    │   │   └── verified_at
    │   └── 决策十字路口
    │       ├── 定金未到
    │       │   └── Sales_Rep + Finance 持续催款
    │       ├── 客户上传水单但财务未核销
    │       │   └── 停留在待核销
    │       └── 定金已核销
    │           └── 进入PR
    ├── B. PR
    │   ├── 节点性质：内部采购需求校验/分发节点
    │   ├── 创建端：Sales_Rep / Sales_Assistant
    │   ├── 承接端：Procurement
    │   ├── 管理端：Procurement_Manager
    │   ├── 协调端：Order_Coordinator
    │   ├── 状态
    │   │   ├── 草稿
    │   │   ├── 待校验
    │   │   ├── 已校验
    │   │   ├── 待分配供应商
    │   │   ├── 待转CG
    │   │   ├── 已转CG
    │   │   └── 驳回补充
    │   ├── 字段
    │   │   ├── pr_no
    │   │   ├── source_sc_no
    │   │   ├── product_lines
    │   │   ├── target_qty
    │   │   ├── target_delivery_date
    │   │   ├── supplier_split_plan
    │   │   ├── quality_requirements
    │   │   ├── packing_requirements
    │   │   └── purchase_notes
    │   ├── 动作
    │   │   ├── 发起PR
    │   │   ├── 校验完整性
    │   │   ├── 拆分供应商
    │   │   ├── 标记需多供应商分单
    │   │   ├── 回退补充
    │   │   └── 生成一个或多个CG
    │   └── 决策十字路口
    │       ├── 信息不完整
    │       │   └── 回流Sales_Rep / Sales_Assistant补资料
    │       ├── 已完整但未确定供应商拆分
    │       │   └── 停留PR待校验/待分配
    │       └── 供应商拆分完成
    │           └── 转CG
    ├── C. CG
    │   ├── 节点性质：正式采购合同与采购审批节点
    │   ├── 创建端：Procurement
    │   ├── 审批端：Procurement_Manager
    │   ├── 协同端：Finance / Order_Coordinator
    │   ├── 状态
    │   │   ├── 草稿
    │   │   ├── 待审批
    │   │   ├── 已批准
    │   │   ├── 已下单
    │   │   ├── 生产准备中
    │   │   ├── 生产中
    │   │   ├── 待打样
    │   │   ├── 待封样
    │   │   ├── 待验货
    │   │   ├── 待关闭
    │   │   └── 异常
    │   ├── 字段
    │   │   ├── cg_no
    │   │   ├── source_pr_no
    │   │   ├── supplier_id
    │   │   ├── purchase_price
    │   │   ├── payment_terms
    │   │   ├── supplier_lead_time
    │   │   ├── qc_requirements
    │   │   ├── shipment_requirements
    │   │   └── approval_status
    │   ├── 动作
    │   │   ├── 创建CG
    │   │   ├── 提交审批
    │   │   ├── 审批通过/驳回
    │   │   ├── 正式下单
    │   │   ├── 更新生产进度
    │   │   ├── 发起打样
    │   │   ├── 发起验货
    │   │   └── 关闭CG
    │   └── 决策十字路口
    │       ├── 审批驳回
    │       │   └── 回流Procurement修订
    │       ├── 审批通过但未下单
    │       │   └── 停留已批准待执行
    │       ├── 下单后需打样
    │       │   └── 进入打样
    │       └── 下单后无需打样
    │           └── 直接量产/待验货
    ├── D. 打样
    │   ├── 创建端：Procurement / Supplier
    │   ├── 查看端：Sales_Rep / Customer（按需）
    │   ├── 状态
    │   │   ├── 待打样
    │   │   ├── 打样中
    │   │   ├── 待客户确认
    │   │   ├── 需修改
    │   │   └── 已确认
    │   ├── 字段
    │   │   ├── sample_required
    │   │   ├── sample_no
    │   │   ├── sample_round
    │   │   ├── sample_sent_at
    │   │   ├── sample_confirmed_at
    │   │   └── sample_feedback_notes
    │   └── 决策十字路口
    │       ├── 客户确认通过
    │       │   └── 进入封样
    │       └── 客户要求修改
    │           └── 回流继续打样
    ├── E. 封样
    │   ├── 目标：锁定量产标准
    │   ├── 状态
    │   │   ├── 待封样
    │   │   ├── 封样处理中
    │   │   ├── 已封样
    │   │   └── 待放量产
    │   ├── 字段
    │   │   ├── seal_confirmed_at
    │   │   ├── sealed_sample_ref
    │   │   └── mass_production_release_at
    │   └── 决策十字路口
    │       ├── 封样完成
    │       │   └── 放量产
    │       └── 封样不通过
    │           └── 回流打样
    ├── F. 量产
    │   ├── 执行端：Supplier
    │   ├── 管控端：Procurement / Order_Coordinator
    │   ├── 状态
    │   │   ├── 待排产
    │   │   ├── 已排产
    │   │   ├── 生产中
    │   │   ├── 完工待验货
    │   │   └── 延误/异常
    │   ├── 字段
    │   │   ├── production_start_at
    │   │   ├── planned_finish_at
    │   │   ├── actual_finish_at
    │   │   ├── production_progress
    │   │   └── production_risk_notes
    │   └── 决策十字路口
    │       ├── 正常完工
    │       │   └── 进入QC
    │       └── 延误
    │           └── 升级 Procurement / Order_Coordinator / Regional_Manager
    ├── G. QC
    │   ├── 创建端：Procurement / Order_Coordinator 发起
    │   ├── 执行端：QC
    │   ├── 协同端：Supplier / Procurement / Sales_Rep
    │   ├── 状态
    │   │   ├── 待排期
    │   │   ├── 已排期
    │   │   ├── 验货中
    │   │   ├── 报告草稿
    │   │   ├── 通过
    │   │   ├── 待整改
    │   │   ├── 待复验
    │   │   └── 关闭
    │   ├── 字段
    │   │   ├── qc_no
    │   │   ├── qc_standard
    │   │   ├── defect_level
    │   │   ├── qc_result
    │   │   ├── qc_report_url
    │   │   └── reinspection_required
    │   └── 决策十字路口
    │       ├── 首检通过
    │       │   └── 进入订舱前决策/Shipment
    │       ├── 可整改
    │       │   └── 回流Supplier整改后复验
    │       └── 严重不通过
    │           └── 升级采购/销售/主管
    ├── H. 订舱前决策
    │   ├── 目标：在正式订舱前把贸易术语、商检、运费、客户确认链走清楚
    │   ├── 责任角色
    │   │   ├── Sales_Rep
    │   │   ├── Order_Coordinator
    │   │   ├── Documentation_Officer
    │   │   └── Finance（若运费影响收款条件）
    │   ├── 决策树
    │   │   ├── incoterm 已确认？
    │   │   │   ├── 否 -> 回流Sales_Rep确认贸易条款
    │   │   │   └── 是 -> 下一步
    │   │   ├── 是否需商检？
    │   │   │   ├── 是 -> 先走商检资料与安排
    │   │   │   └── 否 -> 下一步
    │   │   ├── 是否需询运费？
    │   │   │   ├── 是 -> 询价货代 -> 客户确认运费
    │   │   │   └── 否 -> 下一步
    │   │   └── 客户已确认运费/发运安排？
    │   │       ├── 否 -> 停留待确认
    │   │       └── 是 -> 正式订舱
    │   ├── 关键字段
    │   │   ├── incoterm
    │   │   ├── inspection_required
    │   │   ├── freight_inquiry_status
    │   │   ├── freight_confirmed_by_customer
    │   │   ├── freight_confirmed_by_customer_at
    │   │   └── booking_status
    │   └── 输出
    │       └── Shipment
    ├── I. Shipment
    │   ├── 执行端：Warehouse_Ops / Order_Coordinator
    │   ├── 协同端：Forwarder / Truck Company / Driver / Customs Broker / Customs
    │   ├── 客户同步端：Sales_Rep
    │   ├── 状态
    │   │   ├── 待订舱
    │   │   ├── 已订舱
    │   │   ├── 待装柜
    │   │   ├── 已装柜
    │   │   ├── 已报关
    │   │   ├── 已开船
    │   │   ├── 在途
    │   │   ├── 待清关
    │   │   ├── 清关中
    │   │   ├── 到港
    │   │   └── 已签收
    │   ├── 字段
    │   │   ├── booking_status
    │   │   ├── etd
    │   │   ├── eta
    │   │   ├── port_of_loading
    │   │   ├── port_of_destination
    │   │   ├── container_info
    │   │   ├── customs_status
    │   │   ├── clearance_status
    │   │   └── shipmentReadinessStatus
    │   ├── 动作
    │   │   ├── 订舱
    │   │   ├── 安排拖车
    │   │   ├── 装柜
    │   │   ├── 报关
    │   │   ├── 更新在途
    │   │   ├── 更新清关状态
    │   │   ├── 确认到港
    │   │   └── 确认签收
    │   └── 决策十字路口
    │       ├── 船期变化
    │       │   └── 回流Sales_Rep同步客户 + Docs同步资料
    │       ├── 报关异常
    │       │   └── 回流Documentation_Officer / Customs Broker
    │       ├── 清关异常
    │       │   └── 回流客户 / Sales_Rep / Order_Coordinator
    │       └── 已签收
    │           └── 进入Feedback
    ├── J. Docs
    │   ├── 执行端：Documentation_Officer
    │   ├── 协同端：Finance / Order_Coordinator / Sales_Rep / Warehouse_Ops
    │   ├── 状态
    │   │   ├── 待生成
    │   │   ├── 待补资料
    │   │   ├── 已生成
    │   │   ├── 待校验
    │   │   ├── 已齐套
    │   │   ├── 已归档
    │   │   └── 异常
    │   ├── 文档树
    │   │   ├── CI
    │   │   ├── PL
    │   │   ├── BL
    │   │   ├── 报关单
    │   │   ├── 合同/发票/付款凭证
    │   │   ├── 收汇水单
    │   │   ├── 结汇水单
    │   │   └── 退税资料包
    │   ├── 字段
    │   │   ├── archiveStatus
    │   │   ├── archivedAt
    │   │   ├── archivedBy
    │   │   ├── archiveNo
    │   │   ├── invoiceNo
    │   │   └── invoiceStatus
    │   └── 决策十字路口
    │       ├── 出运前缺关键单证
    │       │   └── 阻断Shipment前进
    │       ├── 收汇资料缺失
    │       │   └── 回流Finance / Customer
    │       └── 资料齐套
    │           └── 进入Payment/归档闭环
    ├── K. Payment
    │   ├── 执行端：Finance
    │   ├── 管理端：CFO
    │   ├── 协同端：Sales_Rep / Documentation_Officer / Procurement
    │   ├── 状态
    │   │   ├── 待定金
    │   │   ├── 已收定金
    │   │   ├── 待尾款
    │   │   ├── 已收尾款
    │   │   ├── 超账期
    │   │   ├── 应付处理中
    │   │   └── 财务关闭
    │   ├── 字段
    │   │   ├── receivable_amount
    │   │   ├── payable_amount
    │   │   ├── due_date
    │   │   ├── payment_proof
    │   │   ├── invoice_status
    │   │   ├── profit_amount
    │   │   ├── profit_rate
    │   │   └── risk_level
    │   ├── 动作
    │   │   ├── 登记收款
    │   │   ├── 登记付款
    │   │   ├── 催款
    │   │   ├── 标记逾期
    │   │   ├── 录入水单
    │   │   └── 核算利润
    │   └── 决策十字路口
    │       ├── 定金未到
    │       │   └── 回流Sales_Rep催款
    │       ├── 尾款逾期
    │       │   └── 升级Finance / CFO / Regional_Manager
    │       ├── 低毛利
    │       │   └── 财务风险预警
    │       └── 财务关闭
    │           └── 进入开票归档 / Feedback
    ├── L. 开票归档
    │   ├── 执行端：Finance / Documentation_Officer
    │   ├── 状态
    │   │   ├── 待申请开票
    │   │   ├── 待开票
    │   │   ├── 已开票
    │   │   ├── 待归档
    │   │   └── 已归档
    │   ├── 字段
    │   │   ├── invoiceNo
    │   │   ├── invoiceStatus
    │   │   ├── archiveStatus
    │   │   ├── archiveNo
    │   │   ├── archivedAt
    │   │   └── archivedBy
    │   └── 输出
    │       └── Feedback
    ├── M. Feedback
    │   ├── 执行端：Sales_Rep
    │   ├── 管理端：Regional_Manager
    │   ├── 协同端：QC / Finance / Order_Coordinator
    │   ├── 状态
    │   │   ├── 待回访
    │   │   ├── 已回访
    │   │   ├── 有问题待处理
    │   │   └── 已关闭
    │   ├── 字段
    │   │   ├── delivery_feedback
    │   │   ├── satisfaction_score
    │   │   ├── complaint_type
    │   │   ├── complaint_level
    │   │   ├── next_demand_date
    │   │   └── upsell_opportunity
    │   └── 决策十字路口
    │       ├── 无问题
    │       │   └── 进入Repeat
    │       ├── 有问题可关闭
    │       │   └── 闭环后进入Repeat
    │       └── 有重大问题
    │           └── 回流QC / Finance / Shipment异常处理
    └── N. Repeat
        ├── 执行端：Sales_Rep
        ├── 管理端：Regional_Manager
        ├── 支持端：Marketing_Ops / Sales_Director
        ├── 状态
        │   ├── 观察中
        │   ├── 复购窗口到期
        │   ├── 已触达
        │   ├── 形成新需求
        │   ├── 转新ING
        │   └── 沉睡客户
        ├── 字段
        │   ├── last_order_at
        │   ├── reorder_cycle
        │   ├── purchased_categories
        │   ├── expandable_categories
        │   ├── annual_contribution
        │   ├── next_contact_at
        │   └── service_to_trade_signal
        └── 决策十字路口
            ├── 形成新需求
            │   └── 回流新ING
            ├── 客户变沉睡
            │   └── 进入唤醒池
            └── 服务客户出现商品采购信号
                └── service_to_trade -> trade
```

### 12.4 V1总树一撑到底版（目标层、主链层、节点层、角色层、治理层、字段层同树展开）

```text
V1总树一撑到底版
└── 公司总目标
    ├── 增长
    │   ├── 新线索增长
    │   ├── 新客户增长
    │   ├── 有效ING增长
    │   ├── 成交客户增长
    │   ├── 客单价增长
    │   └── 老客贡献增长
    ├── 转化
    │   ├── 首响效率提升
    │   ├── 客户转ING率提升
    │   ├── ING转QR/QT效率提升
    │   ├── QT转SC率提升
    │   ├── SC转履约率提升
    │   └── service_to_trade转trade提升
    ├── 交付
    │   ├── 采购更准
    │   ├── 打样更准
    │   ├── 封样更稳
    │   ├── QC更严
    │   ├── 出运更准时
    │   ├── 单证更完整
    │   └── 清关签收更顺畅
    ├── 回款
    │   ├── 定金及时
    │   ├── 尾款及时
    │   ├── 超账期更低
    │   ├── 利润更稳
    │   └── 风险更可控
    └── 组织效率
        ├── 分配及时
        ├── 跟进及时
        ├── 审批清晰
        ├── 异常可升级
        ├── 数据可下钻
        └── 三端可联动
        └── 经营总主线
            └── 市场获客 -> 客户开发 -> ING -> QR -> XJ -> BJ -> QR回写 -> QT -> 客户反馈 -> SC -> 客户反馈 -> AR/定金 -> PR -> CG -> 是否打样 -> 打样/跳过打样 -> 量产 -> QC -> 订舱前决策 -> Shipment -> Docs -> Payment -> 开票归档 -> Feedback -> Repeat
                ├── 1. 市场获客
                │   ├── 目标：获得高质量线索并转为可经营客户
                │   ├── 客户模型入口
                │   │   ├── trade：零售商 / 进口商 / 批发商
                │   │   ├── agency：代理采购型买家
                │   │   ├── project：项目承包商
                │   │   └── service_to_trade：验货/出运服务客户
                │   ├── 角色
                │   │   ├── Marketing_Ops：获客、筛选、投公海
                │   │   ├── Sales_Rep：认领、首触达
                │   │   ├── Sales_Director：渠道策略
                │   │   └── CEO：只看增长结构结果
                │   ├── 页面/模块
                │   │   ├── 渠道线索池
                │   │   │   ├── 字段：source_channel / source_campaign / country / customer_segment / lead_score
                │   │   │   ├── 动作：新建 / 导入 / 标无效 / 标高热度 / 投公海 / 指派销售
                │   │   │   └── 统计：新线索数 / 合格线索率 / 渠道ROI
                │   │   ├── 线索筛选台
                │   │   │   ├── 字段：渠道 / 国家 / 客户对象类型 / 产品线 / 热度
                │   │   │   ├── 动作：标合格 / 标不合格 / 待补资料 / 投公海
                │   │   │   └── 统计：筛选通过率 / 公海投放率
                │   │   └── 公海池
                │   │       ├── 状态：待认领 / 已认领 / 认领超时 / 高热度未认领
                │   │       ├── 动作：认领 / 退回 / 转直接客户
                │   │       └── 统计：认领率 / 认领时长 / 公海转客户率
                │   ├── 控制规则
                │   │   ├── 时限：高热度线索24h内认领
                │   │   ├── 线索认领异常：公海认领超时 -> Regional_Manager
                │   │   ├── 事件：线索新建 / 认领 / 退回
                │   │   ├── 权限：Marketing_Ops可投公海；Sales_Rep可认领
                │   │   └── 审计：source_channel、认领人、认领时间变更
                │   └── 输出：客户开发
                ├── 2. 客户开发
                │   ├── 目标：完成建档、分层、定责、定模板、形成可经营客户
                │   ├── 角色
                │   │   ├── Regional_Manager：分配 / 改派 / 介入
                │   │   ├── Sales_Rep：建档 / 首响 / 跟进 / 转ING
                │   │   ├── Sales_Assistant：补资料 / 设提醒 / 归档
                │   │   └── Marketing_Ops：补来源背景
                │   ├── 页面/模块
                │   │   ├── 客户建档台
                │   │   │   ├── 字段：customer_name / country / region / contact_name / contact_method / customer_segment / business_flow_template / customer_level / owner_user_id / owner_email / regional_manager_id
                │   │   │   ├── 动作：建档 / 完善资料 / 设客户类型 / 设流程模板 / 设owner / 转ING
                │   │   │   └── 统计：建档完成率 / 信息完整率
                │   │   ├── 首响与跟进台
                │   │   │   ├── 字段：first_contact_at / last_follow_up_at / next_follow_up_at / follow_up_method / follow_up_result
                │   │   │   ├── 动作：电话 / 邮件 / WhatsApp / 约下次 / 标无效
                │   │   │   └── 统计：首响时效 / 跟进及时率 / 转ING率
                │   │   ├── 客户分层台
                │   │   │   ├── 分层：新客 / 老客 / 重点 / 战略 / 沉睡 / 流失
                │   │   │   ├── 动作：升级重点 / 升级战略 / 转沉睡 / 标流失
                │   │   │   └── 统计：重点客户占比 / 战略客户贡献
                │   │   └── 主管分配台
                │   │       ├── 字段：current_manager / current_owner / assigned_at / reassignment_history
                │   │       ├── 动作：分配 / 改派 / 催办 / 主管介入
                │   │       └── 统计：分配时效 / 改派次数 / 未分配滞留数
                │   ├── 控制规则
                │   │   ├── 时限：24h首响 / 72h必须更新
                │   │   ├── 客户经营异常：未首响 / 未分配 / 高价值客户停滞
                │   │   ├── 事件：客户建档 / owner变更 / customer_segment变更 / business_flow_template变更
                │   │   ├── 权限：Regional_Manager可改派；Sales_Rep可维护自己客户；Sales_Assistant可补资料
                │   │   ├── 回写：owner_* / assigned_to / next_follow_up_at
                │   │   └── 审计：责任归属与客户类型变更
                │   └── 输出：ING
                ├── 3. ING
                │   ├── 目标：把客户需求沉淀成正式询价单
                │   ├── 角色
                │   │   ├── Sales_Rep：创建 / 澄清 / 下推
                │   │   ├── Sales_Assistant：补附件 / 补资料
                │   │   └── Regional_Manager：监督 / 改派
                │   ├── 状态：草稿 / 新建 / 待澄清 / 信息补齐中 / 可下推 / 已下推QR / 已下推QT / 暂停 / 作废
                │   ├── 字段
                │   │   ├── inquiry_no
                │   │   ├── customer_id / customer_segment / business_flow_template
                │   │   ├── product_name / product_spec / qty
                │   │   ├── target_price / target_delivery_date
                │   │   ├── oem_odm_flag / attachments
                │   │   └── owner_user_id / owner_email / assigned_to
                │   ├── 动作：创建 / 编辑 / 澄清 / 补附件 / 改派 / 下推QR / 直推QT / 暂停 / 作废
                │   ├── 决策十字路口
                │   │   ├── 需求不完整 -> 回流客户沟通
                │   │   ├── 需求完整但要真实采购成本 -> 下推QR
                │   │   └── 业务可直接报价 -> 直推QT
                │   ├── 控制规则
                │   │   ├── 时限：可下推后2个工作日内下推
                │   │   ├── ING推进异常：24h未首响 / 72h未更新 / 可下推未下推
                │   │   ├── 事件：ING创建 / 编辑 / 下推 / 作废
                │   │   ├── 权限：Sales_Rep可建；Regional_Manager可监督和改派
                │   │   └── 审计：需求字段变更 / 下推动作
                │   └── 输出：QR 或 QT
                ├── 4. QR
                │   ├── 节点性质：业务员创建的询报请求单，采购询价链入口，也是BJ回写容器
                │   ├── 创建端：Sales_Rep
                │   ├── 承接端：Procurement 报价请求池
                │   ├── 执行端：Procurement
                │   ├── 使用端：Sales_Rep（读取采购反馈并下推QT）
                │   ├── 页面泳道
                │   │   ├── Sales_Rep：成本询报
                │   │   └── Procurement：报价请求池
                │   ├── 状态：草稿 / 已发起 / 待采购承接 / 已下推XJ / 供应商询价中 / 供应商报价回收中 / 成本结论形成中 / 待采购反馈回写 / 成本已形成 / 已下推QT
                │   ├── 字段
                │   │   ├── qr_no / source_ing_no / product_snapshot / target_qty / required_date
                │   │   ├── assigned_procurement
                │   │   ├── ai_analysis_summary
                │   │   ├── recommended_supplier
                │   │   ├── recommended_cost
                │   │   ├── recommended_lead_time
                │   │   └── supplier_comparison_snapshot
                │   ├── 动作：发起QR / 指定采购员 / 跟踪XJ/BJ / 接收采购回写 / 下推QT
                │   ├── 决策十字路口
                │   │   ├── 采购未承接 -> 停留报价请求池并提醒
                │   │   ├── 资料不足 -> 回流Sales_Rep补信息
                │   │   ├── 可发询价 -> 创建XJ
                │   │   └── BJ已回齐 -> 回写QR并供QT使用
                │   ├── 控制规则
                │   │   ├── 时限：24h采购承接
                │   │   ├── QR承接异常：XJ未创建 / BJ已齐但QR未回填
                │   │   ├── 事件：QR发起 / 采购承接 / QR回写 / QT下推
                │   │   ├── 权限：Sales_Rep创建；Procurement回写
                │   │   ├── 回写：ai_analysis_summary / recommended_cost 等
                │   │   └── 审计：采购反馈与择优变更
                │   └── 输出：XJ / QT
                ├── 5. XJ
                │   ├── 节点性质：采购员创建的询价单，下推供应商客户需求池
                │   ├── 创建端：Procurement
                │   ├── 承接端：Supplier Portal【客户需求】
                │   ├── 页面泳道
                │   │   ├── Procurement：询价管理
                │   │   └── Supplier：客户需求
                │   ├── 状态：待发询价 / 已发询价 / 已下推供应商客户需求 / 待供应商回复 / 已部分回复 / 已全部回复 / 已形成BJ候选集
                │   ├── 字段：xj_no / qr_reference / supplier_id / quotation_deadline / due_date / requirement_snapshot / remarks
                │   ├── 动作：发询价 / 补规格 / 追报价 / 记录回复 / 转BJ池
                │   ├── 决策十字路口
                │   │   ├── 无供应商响应 -> 扩供应商或回流QR
                │   │   ├── 部分响应 -> 继续追报价
                │   │   └── 有效报价足够 -> 形成BJ集合
                │   ├── 控制规则
                │   │   ├── 时限：承接后24h发供应商
                │   │   ├── XJ询价异常：供应商未回复 / 有效供应商不足 / XJ超时
                │   │   ├── 事件：XJ创建 / 发送 / 供应商响应
                │   │   ├── 权限：Procurement创建；Supplier查看并回复
                │   │   └── 审计：供应商选择与截止时间变更
                │   └── 输出：BJ
                ├── 6. BJ
                │   ├── 节点性质：供应商报价单，采购比价节点，QR回写上游
                │   ├── 创建端：Supplier
                │   ├── 承接端：Procurement【供应商报价】
                │   ├── 页面泳道
                │   │   ├── Supplier：我的报价
                │   │   └── Procurement：供应商报价
                │   ├── 状态：草稿 / 已提交 / 待比价 / 比价中 / 待确认成本结论 / 已确认成本结论 / 已反馈业务员
                │   ├── 字段：bj_no / xj_reference / supplier_quote_price / supplier_lead_time / payment_terms / quality_commitment / risk_notes / recommended_supplier / recommended_cost
                │   ├── 动作：提交BJ / 比价 / 议价 / AI分析 / 标推荐供应商 / 确认结论 / 回写原QR
                │   ├── 决策十字路口
                │   │   ├── 报价不可用 -> 回流XJ
                │   │   ├── 报价可用但需议价 -> 继续议价
                │   │   └── 择优完成 -> 回写QR
                │   ├── 控制规则
                │   │   ├── 时限：BJ收齐后24h内形成比价结论
                │   │   ├── BJ比价异常：待比价超时 / 结论未确认 / QR未回写
                │   │   ├── 事件：BJ提交 / 比价完成 / QR回写完成
                │   │   ├── 权限：Supplier提交；Procurement比价；Procurement_Manager审视
                │   │   └── 审计：推荐供应商与推荐成本变更
                │   └── 输出：QR回写
                ├── 7. QT
                │   ├── 节点性质：销售报价单，客户价格与条件确认节点
                │   ├── 创建端：Sales_Rep
                │   ├── 审批端：Regional_Manager一审 / Sales_Director二审（按条件）
                │   ├── 客户反馈端：接受 / 拒绝 / 议价
                │   ├── 输入来源：直报价ING 或 已回写QR
                │   ├── 状态：草稿 / 待一审 / 待二审 / 已发送 / 待反馈 / 议价中 / 已接受 / 已拒绝 / 已过期
                │   ├── 字段
                │   │   ├── quotation_no / source_qr_no / source_cost_from_qr
                │   │   ├── profit_markup / domestic_additional_costs
                │   │   ├── trade_terms / delivery_terms / incoterm
                │   │   ├── quotation_conditions / extra_notes
                │   │   ├── approval_status / approval_chain / currentApprovalStep / requiresDirectorApproval
                │   │   └── customerFeedback.status / customerFeedback.comment
                │   ├── 动作：带入成本 / 加利润 / 加条件 / 提交审批 / 发送 / 记录反馈 / 下推SC
                │   ├── 决策十字路口
                │   │   ├── 审批驳回 -> 回流Sales_Rep
                │   │   ├── 客户接受 -> 下推SC
                │   │   ├── 客户拒绝 -> 丢单/搁置/复活池
                │   │   └── 客户议价 -> 回流Sales_Rep谈判/修订
                │   ├── 控制规则
                │   │   ├── 时限：成本结论明确后24h内生成QT；发出后7天内必须有反馈记录
                │   │   ├── QT推进异常：未发送 / 无反馈 / 议价停滞 / 审批超时
                │   │   ├── 事件：QT创建 / 审批 / 发送 / 客户反馈
                │   │   ├── 权限：Sales_Rep创建；Regional_Manager/Sales_Director审批
                │   │   ├── 回写：approval_status / approval_chain / 派生审批字段
                │   │   └── 审计：审批意见 / 客户反馈状态变更
                │   ├── 前置：ING已具备报价条件，或QR成本已回写且价格条件已明确
                │   ├── 代码落地层级：已落库（审批角色与二审判定含服务层派生）
                │   ├── 与现有代码对照说明：sales_quotations 主表与审批字段已稳定承接；金额 >= 20000 的二审规则已有代码基础
                │   └── 输出：SC 或 丢单/搁置
                ├── 8. SC
                │   ├── 节点性质：销售合同单，销售转履约锁单节点
                │   ├── 创建端：Sales_Rep
                │   ├── 承接端：Customer
                │   ├── 协同端：Finance / Procurement / Order_Coordinator
                │   ├── 客户反馈端：接受并签署 / 条款异议 / 拒绝签署
                │   ├── 状态：草稿 / 待签署 / 已签署 / 条款异议中 / 待定金 / 已生效 / 已拒签
                │   ├── 字段：contract_no / quotation_reference / contract_amount / deposit_ratio / payment_terms / delivery_terms / contract_feedback_status / contract_feedback_notes / approval_flow / approval_history / approval_notes / rejection_reason / approved_at
                │   ├── 动作：生成 / 发送 / 催签 / 修订条款 / 确认签署 / 催定金 / 下推AR / 下推PR
                │   ├── 决策十字路口
                │   │   ├── 客户接受并签署 -> 下推AR / 定金 / PR / 履约
                │   │   ├── 客户条款异议 -> 回流Sales_Rep修订合同重发
                │   │   └── 客户拒绝签署 -> 合同拒签/复盘池
                │   ├── 控制规则
                │   │   ├── 时限：QT接受后3个工作日内应发SC并推动签署
                │   │   ├── SC履约前异常：未签 / 条款异议未处理 / 未定金 / 已生效未PR
                │   │   ├── 事件：SC生成 / 客户签署 / 条款异议 / 拒签 / 生效
                │   │   ├── 权限：Sales_Rep维护；Finance / Procurement / Order_Coordinator只读承接
                │   │   └── 审计：条款、签署、生效变更
                │   ├── 前置：QT已接受，合同主体、关键条款与生效条件已明确
                │   ├── 代码落地层级：已落库（审批步骤与当前审批角色含服务层派生）
                │   ├── 与现有代码对照说明：合同主状态、approval_flow、approval_history 已真实落库；金额 >= 20000 的 supervisor -> director 规则已有代码基础
                │   └── 输出：AR / 定金 / PR
                ├── 9. AR/定金
                │   ├── 节点性质：SC生效后的财务启动与客户Portal联动节点
                │   ├── 角色：Finance / Sales_Rep / Customer
                │   ├── 状态：待生成AR / 已生成AR / 待上传水单 / 待核销 / 已核销
                │   ├── 字段：ar_no / deposit_amount / deposit_due_date / deposit_proof / customerPortalPaymentStatus / verified_at
                │   ├── 动作：生成AR / 上传水单 / 核销 / 同步Portal状态
                │   ├── 决策十字路口
                │   │   ├── 定金未到 -> 持续催款
                │   │   └── 定金已核销 -> 进入PR
                │   ├── 控制规则
                │   │   ├── 时限：SC签署后按约定周期收定金
                │   │   ├── 定金核销异常：定金超时 / 水单已上传未核销
                │   │   ├── 事件：AR创建 / 水单上传 / 核销
                │   │   ├── 权限：Customer上传水单；Finance核销
                │   │   └── 审计：核销状态与Portal状态变更
                │   └── 输出：PR
                ├── 10. PR
                │   ├── 节点性质：内部采购需求校验/分发节点
                │   ├── 角色：Sales_Rep / Sales_Assistant / Procurement / Procurement_Manager / Order_Coordinator
                │   ├── 状态：草稿 / 待校验 / 已校验 / 待分配供应商 / 待转CG / 已转CG / 驳回补充
                │   ├── 字段：pr_no / source_sc_no / product_lines / target_qty / target_delivery_date / supplier_split_plan / quality_requirements / packing_requirements / purchase_notes
                │   ├── 动作：发起PR / 校验 / 拆供应商 / 标多供应商 / 回退补充 / 生成CG
                │   ├── 决策十字路口
                │   │   ├── 信息不完整 -> 回流Sales_Rep / Sales_Assistant
                │   │   ├── 未确定供应商拆分 -> 停留PR
                │   │   └── 供应商拆分完成 -> 转CG
                │   ├── 控制规则
                │   │   ├── 时限：PR发起后24h内完成校验
                │   │   ├── PR校验异常：待校验超时 / 未分配供应商 / 未转CG
                │   │   ├── 事件：PR创建 / 校验 / 回退 / 转CG
                │   │   ├── 权限：Sales端发起；采购端校验
                │   │   └── 审计：supplier_split_plan与质量要求变更
                │   ├── 前置：SC已生效，采购需求、供应商拆分思路与履约启动条件已基本明确
                │   ├── 代码落地层级：部分具备
                │   ├── 与现有代码对照说明：采购需求与后合同执行字段已有真实承接；但打样/封样预判与部分拆分口径仍有一部分停留在 V1 目标规则
                │   └── 输出：CG
                ├── 11. CG
                │   ├── 节点性质：正式采购合同与采购审批节点
                │   ├── 角色：Procurement / Procurement_Manager / CEO / Finance / Order_Coordinator
                │   ├── 状态：草稿 / 待审批 / 已批准 / 已下单 / 生产准备中 / 生产中 / 待打样 / 待封样 / 待验货 / 待采购结案 / 采购执行异常
                │   ├── 字段：cg_no / source_pr_no / supplier_id / purchase_price / payment_terms / supplier_lead_time / qc_requirements / shipment_requirements / approval_status
                │   ├── 动作：创建CG / 提交采购主管审批 / 按条件提交CEO二审 / 审批 / 下单 / 更新生产进度 / 发起打样 / 发起验货 / 执行采购结案
                │   ├── 决策十字路口
                │   │   ├── 审批驳回 -> 回流Procurement
                │   │   ├── 审批通过未下单 -> 停留待执行
                │   │   ├── 需打样 -> 打样
                │   │   └── 无需打样 -> 量产 / QC
                │   ├── 控制规则
                │   │   ├── 时限：PR完成后24h内应生成并提交CG；审批通过后24h内下单
                │   │   ├── 采购执行异常：待审批 / 已批未下单 / 交期延误
                │   │   ├── 事件：CG创建 / 审批 / 下单 / 延误
                │   │   ├── 权限：Procurement创建；Procurement_Manager一审；采购金额 > 100000 CNY 时 CEO 二审
                │   │   └── 审计：采购价、交期、付款条件变更
                │   ├── 前置：PR已校验，供应商已锁定，是否打样/封样已完成预判，审批门槛已明确
                │   ├── 代码落地层级：已落库（审批规则本轮已按 V1 口径收口）
                │   ├── 与现有代码对照说明：采购单主状态与审批待办已具备；现状已从单步 CEO 审批收口为 Procurement_Manager 一审、金额 > 100000 CNY 时 CEO 二审
                │   └── 输出：打样 / 封样 / 量产 / QC
                ├── 12. 打样
                │   ├── 角色：Procurement / Supplier / Sales_Rep / Customer（按需）
                │   ├── 状态：待打样 / 打样中 / 待客户确认 / 需修改 / 已确认
                │   ├── 字段：sample_required / sample_no / sample_round / sample_sent_at / sample_confirmed_at / sample_feedback_notes
                │   ├── 动作：打样 / 发送确认 / 记录反馈 / 重打样
                │   ├── 决策十字路口：客户确认通过 -> 封样；客户要求修改 -> 回流继续打样
                │   ├── 控制规则：时限 / 样品确认提醒 / 样品轮次审计
                │   └── 输出：封样
                ├── 13. 封样
                │   ├── 角色：Procurement / Supplier / QC
                │   ├── 状态：待封样 / 封样处理中 / 已封样 / 待放量产
                │   ├── 字段：seal_confirmed_at / sealed_sample_ref / mass_production_release_at
                │   ├── 动作：封样 / 确认 / 放量产
                │   ├── 决策十字路口：封样完成 -> 量产；封样不通过 -> 回流打样
                │   ├── 控制规则：封样确认时限 / 放量产审计
                │   └── 输出：量产
                ├── 14. 量产
                │   ├── 角色：Supplier / Procurement / Order_Coordinator
                │   ├── 状态：待排产 / 已排产 / 生产中 / 完工待验货 / 延误异常
                │   ├── 字段：production_start_at / planned_finish_at / actual_finish_at / production_progress / production_risk_notes
                │   ├── 动作：更新进度 / 标记量产异常 / 升级
                │   ├── 决策十字路口：正常完工 -> QC；延误 -> 升级
                │   ├── 控制规则：交期时限 / 延误预警 / 交期变更审计
                │   └── 输出：QC
                ├── 15. QC
                │   ├── 角色：QC / Procurement / Order_Coordinator / Sales_Rep
                │   ├── 状态：待排期 / 已排期 / 验货中 / 报告草稿 / 通过 / 待整改 / 待复验 / 验货任务关闭
                │   ├── 字段：qc_no / qc_standard / defect_level / qc_result / qc_report_url / reinspection_required
                │   ├── 动作：排期 / 验货 / 报告 / 整改 / 复验 / 执行QC放行
                │   ├── 决策十字路口：首检通过 -> 订舱前决策；可整改 -> 复验；严重不通过 -> 升级
                │   ├── 控制规则：24h报告时限 / 整改超时 / 放行阻断 / 质量审计
                │   ├── 前置：货物完工待验，检验标准、封样或免样依据、包装与数量条件已明确
                │   ├── 代码落地层级：部分具备
                │   ├── 与现有代码对照说明：QC 主状态与检验字段已有真实承接；但例外放行、封样优先级与最终放行判断仍有一部分属于控制口径收口
                │   └── 输出：订舱前决策 / Shipment
                ├── 16. 订舱前决策
                │   ├── 角色：Sales_Rep / Order_Coordinator / Documentation_Officer / Finance
                │   ├── 决策
                │   │   ├── incoterm已确认？
                │   │   ├── 是否需商检？
                │   │   ├── 是否需询运费？
                │   │   └── 客户已确认运费/发运安排？
                │   ├── 字段：incoterm / inspection_required / freight_inquiry_status / freight_confirmed_by_customer / freight_confirmed_by_customer_at / booking_status
                │   ├── 动作：确认贸易术语 / 询运费 / 推客户确认 / 正式订舱
                │   ├── 控制规则：出运前决策时限 / 运费确认事件 / 订舱前阻断规则
                │   ├── 前置：QC已放行，发运方式与国际运费责任已明确，需客户确认时客户已点头
                │   ├── 代码落地层级：已落库（核心阻断字段已具备，货比两家为 V1 业务口径）
                │   ├── 与现有代码对照说明：bookingResponsibility / freightConfirmationRequired / bookingStatus 等字段已真实存在；当前界面最低校验仍是至少 1 条有效报价
                │   └── 输出：Shipment
                ├── 17. Shipment
                │   ├── 角色：Warehouse_Ops / Order_Coordinator / Sales_Rep / Forwarder / Truck Company / Driver / Customs Broker / Customs
                │   ├── 状态：待订舱 / 已订舱 / 待装柜 / 已装柜 / 已报关 / 已开船 / 在途 / 待清关 / 清关中 / 到港 / 已签收
                │   ├── 字段：booking_status / etd / eta / port_of_loading / port_of_destination / container_info / customs_status / clearance_status / shipmentReadinessStatus
                │   ├── 动作：订舱 / 安排拖车 / 装柜 / 报关 / 更新在途 / 更新清关 / 确认到港 / 确认签收
                │   ├── 决策十字路口
                │   │   ├── 船期变化 -> 回流Sales_Rep + Docs
                │   │   ├── 报关异常 -> 回流Documentation_Officer / Customs Broker
                │   │   ├── 清关异常 -> 回流Customer / Sales_Rep / Order_Coordinator
                │   │   └── 已签收 -> Feedback
                │   ├── 控制规则
                │   │   ├── 订舱时限 / 装柜时限 / 报关时限
                │   │   ├── 发运执行异常：船期变化 / 报关异常 / 清关异常 / 到港未确认
                │   │   ├── 事件：订舱 / 开船 / 在途 / 清关 / 签收
                │   │   ├── 权限：Warehouse_Ops更新在途；Sales_Rep查看客户同步
                │   │   └── 审计：Shipment状态与清关状态变更
                │   └── 输出：Docs / Payment / Feedback
                ├── 18. Docs
                │   ├── 角色：Documentation_Officer / Finance / Order_Coordinator / Sales_Rep / Warehouse_Ops
                │   ├── 状态：待生成 / 待补资料 / 已生成 / 待校验 / 已齐套 / 发货单证已归档 / 单证处理异常
                │   ├── 文档：CI / PL / BL / 报关单 / 合同/发票/付款凭证 / 收汇水单 / 结汇水单 / 退税资料
                │   ├── 字段：archiveStatus / archivedAt / archivedBy / archiveNo / invoiceNo / invoiceStatus
                │   ├── 动作：生成 / 上传 / 校验 / 追补 / 执行发货单证归档
                │   ├── 决策十字路口：出运前缺关键单证 -> 阻断Shipment；资料齐套 -> Payment/开票归档闭环
                │   ├── 控制规则
                │   │   ├── 单证齐套时限
                │   │   ├── 单证处理异常：缺关键单证 / 收汇资料缺失 / 退税资料缺失
                │   │   ├── 事件：文档生成 / 文档归档
                │   │   ├── 权限：Documentation_Officer维护；Finance查看票据资料
                │   │   └── 审计：archiveStatus / invoiceStatus / archiveNo变更
                │   ├── 前置：Shipment 已进入可出单或已出运阶段，单证来源与交单资料边界已明确
                │   ├── 代码落地层级：部分具备
                │   ├── 与现有代码对照说明：合规文件包、D05/D11/D12/D13 链路、L/C 不符点最小实现与归档动作已具备；独立信用证审单审批流仍未完全产品化
                │   └── 输出：Payment / 开票归档
                ├── 19. Payment
                │   ├── 角色：Finance / CFO / Sales_Rep / Documentation_Officer / Procurement
                │   ├── 状态：待定金 / 已收定金 / 待尾款 / 已收尾款 / 超账期 / 应付处理中 / 财务结算关闭
                │   ├── 字段：receivable_amount / payable_amount / due_date / payment_proof / invoice_status / profit_amount / profit_rate / risk_level
                │   ├── 动作：登记收款 / 登记付款 / 催款 / 标逾期 / 录水单 / 核利润
                │   ├── 决策十字路口：定金未到 -> 催款；尾款逾期 -> 升级；低毛利 -> 风险预警；财务结算关闭 -> 开票归档/Feedback
                │   ├── 前置：合同已生效，收款方式已明确，Docs 或银行交单条件可进入收款与放货判断
                │   ├── 代码落地层级：部分具备
                │   ├── 与现有代码对照说明：收款方式、放货阻断、L/C 与 D/P 交单状态、例外放单最小闭环已落库；完整财务审批层级与信用证不符点审批仍是后续增强项
                │   ├── 控制规则
                │   │   ├── 定金与尾款时限
                │   │   ├── 财务结算异常：超账期 / 低毛利 / 高风险客户
                │   │   ├── 事件：收款 / 付款 / 逾期 / 利润异常
                │   │   ├── 权限：Finance执行；CFO监督收口
                │   │   └── 审计：回款、利润、风险标签变更
                │   └── 输出：开票归档 / Feedback
                ├── 20. 开票归档
                │   ├── 角色：Finance / Documentation_Officer
                │   ├── 状态：待申请开票 / 待开票 / 已开票 / 待归档 / 开票资料已归档
                │   ├── 字段：invoiceNo / invoiceStatus / archiveStatus / archiveNo / archivedAt / archivedBy
                │   ├── 动作：申请开票 / 开票 / 执行开票资料归档 / 输出资料包
                │   ├── 控制规则：开票处理异常 / 开票资料归档异常 / 发票与归档审计
                │   └── 输出：Feedback
                ├── 21. Feedback
                │   ├── 角色：Sales_Rep / Regional_Manager / QC / Finance / Order_Coordinator
                │   ├── 状态：待回访 / 已回访 / 有问题待处理 / 反馈问题已关闭
                │   ├── 字段：delivery_feedback / satisfaction_score / complaint_type / complaint_level / next_demand_date / upsell_opportunity
                │   ├── 动作：回访 / 记录问题 / 指派处理 / 关闭反馈问题
                │   ├── 决策十字路口：无问题 -> Repeat；有重大问题 -> 回流问题升级处理
                │   ├── 控制规则：签收后回访时限 / 投诉关闭时限 / 满意度过低预警
                │   └── 输出：Repeat
                └── 22. Repeat
                    ├── 角色：Sales_Rep / Regional_Manager / Marketing_Ops / Sales_Director
                    ├── 状态：观察中 / 复购窗口到期 / 已触达 / 形成新需求 / 转新ING / 沉睡客户
                    ├── 字段：last_order_at / reorder_cycle / purchased_categories / expandable_categories / annual_contribution / next_contact_at / service_to_trade_signal
                    ├── 动作：复购提醒 / 推荐新品 / 标扩品 / 再开发 / 转新ING
                    ├── 决策十字路口
                    │   ├── 形成新需求 -> 新ING
                    │   ├── 客户变沉睡 -> 唤醒池
                    │   └── 服务客户出现商品采购信号 -> service_to_trade转trade
                    ├── 控制规则
                    │   ├── 复购窗口时限
                    │   ├── 沉睡客户唤醒规则
                    │   ├── 事件：复购提醒 / 扩品机会 / service_to_trade信号
                    │   ├── 权限：Sales_Rep经营；Regional_Manager监督
                    │   └── 审计：客户生命周期状态变更
                    └── 输出：新ING / 客户开发重新开始
                └── 同树控制总枝
                    ├── 经营口径
                    │   ├── 客户：新客 / 老客 / 重点 / 战略 / 沉睡 / 流失
                    │   ├── 商机：有效线索 / 有效ING / 有效QT / 已成交 / 搁置 / 丢单
                    │   ├── 复购：复购 / 扩品 / 转介绍 / 服务转贸易
                    │   └── 风险：高风险客户 / 高风险订单 / 重大异常 / 低毛利异常
                    ├── 节点时限规则
                    │   ├── 客户开发：24h首响 / 72h更新
                    │   ├── QR链：24h承接 / 24h发XJ / BJ收齐24h出结论
                    │   ├── QT链：24h出QT / 7天内必须有客户反馈记录
                    │   ├── SC链：签署 / 定金 / PR启动时限
                    │   ├── 采购链：PR 24h校验 / CG 24h审批 / 24h下单
                    │   ├── QC链：24h报告 / 整改时限
                    │   ├── Shipment/Docs链：订舱 / 报关 / 齐套 / 清关
                    │   ├── Payment链：定金 / 尾款 / 账期
                    │   └── Feedback/Repeat链：回访 / 复购窗口
                    ├── 异常升级
                    │   ├── 销售异常
                    │   ├── 采购异常
                    │   ├── 质量异常
                    │   ├── 出运与单证异常
                    │   ├── 财务异常
                    │   └── 经营异常
                    ├── 审批
                    │   ├── QT一审 / 二审
                    │   ├── SC一审 / 二审
                    │   ├── PR校验
                    │   ├── CG正式审批
                    │   ├── 大额付款审批
                    │   └── 特殊发货单证归档/开票审批
                    ├── 事件/通知
                    │   ├── 创建事件
                    │   ├── 状态变化事件
                    │   ├── 回流事件
                    │   ├── 超时事件
                    │   ├── 异常事件
                    │   └── 审批事件
                    ├── 权限
                    │   ├── 战略决策层
                    │   ├── 经营管理层
                    │   ├── 业务执行层
                    │   └── 客户端 / 供应商端
                    ├── 审计日志
                    │   ├── 责任归属审计
                    │   ├── 销售主链审计
                    │   ├── 审批审计
                    │   ├── 采购履约审计
                    │   ├── 质量与交付审计
                    │   └── 财务与归档审计
                    ├── 字段来源与回写
                    │   ├── 责任字段
                    │   ├── 跟进字段
                    │   ├── 审批字段
                    │   ├── 付款字段
                    │   ├── 订舱与出运字段
                    │   ├── 归档字段
                    │   └── 异常字段
                    ├── KPI
                    │   ├── 销售KPI
                    │   ├── 履约KPI
                    │   ├── 财务KPI
                    │   └── 生命周期KPI
                    └── 字段口径与字段变更
                        ├── 第一轮Supabase对齐盘点
                        ├── 字段口径对齐表V1
                        ├── Supabase变更回溯表
                        ├── 第二轮字段实施清单
                        │   ├── A类：直接沿用Supabase
                        │   ├── B类：服务层收口映射
                        │   └── C类：后续migration缺口
                        └── 已执行收口
                            ├── 第一波：owner / incoterm / 客户付款凭证
                            ├── 第二波：审批派生 / Portal付款状态 / shipment readiness
                            └── 第三波：外部参与方 / 开票归档 / 交付异常
```

### 12.5 V1全局连续式总树（按连续下挂样式重写）

```text
V1 全局连续式总树（一张图双主枝·超详尽版）
└── 公司总目标
    ├── 增长：新线索增长 / 新客户增长 / 有效ING增长 / 成交客户增长 / 客单价增长 / 重点客户增长 / 老客户贡献增长 / 服务客户转商品客户增长
    ├── 转化：首响效率提升 / 客户转ING率提升 / ING转QR效率提升 / QR转QT效率提升 / QT转SC率提升 / SC转履约率提升 / 复购率提升 / service_to_trade转trade提升
    ├── 交付：采购更准 / 打样更准 / 封样更稳 / 量产更稳 / QC更严 / 订舱更准 / 出运更准时 / 单证更完整 / 清关更顺畅 / 签收更闭环
    ├── 回款：定金及时 / 尾款及时 / 超账期更低 / 应付更可控 / 利润更稳 / 开票更清楚 / 归档更完整 / 风险更可控
    ├── 组织效率：分配及时 / 跟进及时 / 审批清晰 / 异常可升级 / 责任可追踪 / 事件可通知 / 数据可回写 / 权限可管控 / 审计可追溯 / 三端联动顺畅
    └── 一张图展开方式
        ├── 业务主链
        │   └── 市场获客
        │       ├── 目标：拿到可经营线索并形成客户开发起点
        │       ├── 角色：Marketing_Ops / Sales_Rep / Sales_Director / CEO
        │       ├── 页面：渠道线索池 / 线索筛选台 / 公海池 / 渠道效果分析
        │       ├── 字段：source_channel / source_campaign / country / region / customer_segment / contact_name / contact_method / product_interest / lead_score / source_notes
        │       ├── 动作：新建线索 / 批量导入 / 打标签 / 标无效 / 标高热度 / 投公海 / 指派销售 / 直转客户
        │       ├── 决策：无效关闭 / 有效待认领进公海 / 有效可跟进进客户开发
        │       └── 客户开发
        │           ├── 目标：建档 / 分层 / 定责 / 定模板 / 形成可经营客户
        │           ├── 客户模型：trade / agency / project / service_to_trade
        │           ├── 角色：Regional_Manager / Sales_Rep / Sales_Assistant / Marketing_Ops
        │           ├── 页面：客户建档台 / 首响与跟进台 / 客户分层台 / 主管分配台
        │           ├── 字段：customer_name / short_name / country / region / contact_name / contact_method / customer_segment / business_flow_template / customer_level / owner_user_id / owner_email / assigned_to / first_contact_at / last_follow_up_at / next_follow_up_at / customer_tags
        │           ├── 动作：建档 / 完善资料 / 分层 / 分配 / 改派 / 标重点 / 标战略 / 转ING / 关闭
        │           ├── 决策：信息不足回流补资料 / 责任不清回流主管 / 无效关闭 / 可经营进入ING
        │           └── ING
        │               ├── 性质：正式询价入口 / 销售主链第一业务单
        │               ├── 角色：Sales_Rep / Sales_Assistant / Regional_Manager
        │               ├── 状态：草稿 / 新建 / 待澄清 / 信息补齐中 / 可下推 / 已下推QR / 已下推QT / 暂停 / 作废
        │               ├── 字段：inquiry_no / customer_id / product_name / product_spec / qty / unit / target_price / target_delivery_date / oem_odm_flag / packaging_requirement / certification_requirement / attachments / owner_user_id / assigned_to
        │               ├── 动作：创建 / 编辑 / 澄清 / 补附件 / 改派 / 下推QR / 直接下推QT / 暂停 / 作废
        │               ├── 决策
        │               │   ├── 需求不完整：回流客户沟通
        │               │   ├── 需求完整且需采购成本：进入QR
        │               │   └── 业务可直接报价：直接进入QT
        │               ├── QR
        │               │   ├── 性质：业务员创建的询报请求单 / 采购询价链入口 / BJ回写容器
        │               │   ├── 创建端：Sales_Rep
        │               │   ├── 承接端：Procurement 报价请求池
        │               │   ├── 页面泳道：Sales_Rep 成本询报 / Procurement 报价请求池
        │               │   ├── 状态：草稿 / 已发起 / 待采购承接 / 已下推XJ / 供应商询价中 / 报价回收中 / 成本结论形成中 / 待采购回写 / 成本已形成 / 已下推QT
        │               │   ├── 字段：qr_no / source_ing_no / product_snapshot / target_qty / required_date / assigned_procurement / urgency_level / ai_analysis_summary / recommended_supplier / recommended_cost / recommended_lead_time / supplier_comparison_snapshot
        │               │   ├── 动作：发起QR / 指定采购员 / 查看进度 / 看BJ分析 / 接收回写 / 下推QT
        │               │   ├── 决策：采购未承接停留请求池 / 资料不足回流Sales / 可发询价进入XJ / BJ齐套进入QR回写
        │               │   └── XJ
        │               │       ├── 性质：采购员创建的询价单 / 下推到供应商客户需求
        │               │       ├── 创建端：Procurement
        │               │       ├── 承接端：Supplier Portal 客户需求
        │               │       ├── 页面：Procurement 询价管理 / Supplier 客户需求
        │               │       ├── 状态：待发询价 / 已发询价 / 已下推客户需求 / 待供应商回复 / 已部分回复 / 已全部回复 / 已形成BJ候选集
        │               │       ├── 字段：xj_no / qr_reference / supplier_id / quotation_deadline / due_date / requirement_snapshot / material_notes / quality_notes / remarks
        │               │       ├── 动作：发询价 / 补规格 / 追报价 / 记录回复 / 转BJ池
        │               │       ├── 决策：无响应扩供应商或回流QR / 部分响应继续追 / 报价足够进入BJ
        │               │       └── BJ
        │               │           ├── 性质：供应商报价单 / 采购比价节点 / QR回写上游
        │               │           ├── 创建端：Supplier
        │               │           ├── 承接端：Procurement 供应商报价
        │               │           ├── 页面：Supplier 我的报价 / Procurement 供应商报价
        │               │           ├── 状态：草稿 / 已提交 / 待比价 / 比价中 / 待确认成本结论 / 已确认成本结论 / 已反馈业务员
        │               │           ├── 字段：bj_no / xj_reference / supplier_quote_price / supplier_lead_time / payment_terms / quality_commitment / risk_notes / recommended_supplier / recommended_cost / comparison_rank
        │               │           ├── 动作：供应商提交BJ / 采购比价 / 采购议价 / AI分析 / 标推荐供应商 / 确认成本结论 / 回写原QR
        │               │           ├── 决策：报价不可用回流XJ / 可用但需议价继续议价 / 择优完成进入QR回写
        │               │           └── QR回写
        │               │               ├── 性质：采购对同一份QR的反馈回写动作
        │               │               ├── 执行端：Procurement
        │               │               ├── 查看端：Sales_Rep
        │               │               ├── 回写内容：ai_analysis_summary / recommended_supplier / recommended_cost / recommended_lead_time / supplier_comparison_snapshot / risk_notes
        │               │               ├── 效果：采购侧QR更新 / 业务侧同一QR同步更新
        │               │               └── QT
        │               │                   ├── 性质：销售报价单 / 客户价格与条件确认节点
        │               │                   ├── 创建端：Sales_Rep
        │               │                   ├── 审批端：Regional_Manager 一审 / Sales_Director 二审
        │               │                   ├── 客户反馈端：接受 / 拒绝 / 议价
        │               │                   ├── 输入来源：已回写QR
        │               │                   ├── 状态：草稿 / 待一审 / 待二审 / 已发送 / 待反馈 / 议价中 / 已接受 / 已拒绝 / 已过期
        │               │                   ├── 字段：quotation_no / source_qr_no / source_cost_from_qr / profit_markup / domestic_additional_costs / trade_terms / delivery_terms / incoterm / quotation_conditions / extra_notes / approval_status / approval_chain / currentApprovalStep / requiresDirectorApproval / sampling_expectation / sampling_notes / customerFeedback.status / customerFeedback.comment
        │               │                   ├── 动作：带入成本 / 加利润 / 加条件 / 记录客户样品要求 / 提交审批 / 发送客户 / 记录反馈 / 下推SC
        │               │                   ├── 决策：审批驳回回流修订 / 客户拒绝进丢单池 / 客户议价回流谈判 / 客户接受进入SC
        │               │                   └── SC
        │               │                       ├── 性质：销售合同单 / 锁单节点 / 销售转履约起点
        │               │                       ├── 创建端：Sales_Rep
        │               │                       ├── 承接端：Customer
        │               │                       ├── 协同端：Finance / Procurement / Order_Coordinator
        │               │                       ├── 客户反馈端：接受并签署 / 条款异议 / 拒绝签署
        │               │                       ├── 状态：草稿 / 待签署 / 已签署 / 条款异议中 / 待定金 / 已生效 / 已拒签
        │               │                       ├── 字段：contract_no / quotation_reference / contract_amount / deposit_ratio / payment_terms / delivery_terms / contract_feedback_status / contract_feedback_notes / sample_clause_required / sample_clause_notes / sample_waiver_confirmed_by_customer / approval_flow / approval_history / rejection_reason / approved_at
        │               │                       ├── 动作：生成 / 发送 / 催签 / 修订条款 / 固化样品条款 / 确认签署 / 催定金 / 下推AR / 下推PR
        │               │                       ├── 决策：条款异议回流修订 / 拒绝签署进拒签池 / 接受签署进入AR定金
        │               │                       └── AR定金
        │               │                           ├── 性质：SC生效后的财务启动与Portal联动节点
        │               │                           ├── 角色：Finance / Sales_Rep / Customer
        │               │                           ├── 状态：待生成AR / 已生成AR / 待上传水单 / 待核销 / 已核销
        │               │                           ├── 字段：ar_no / deposit_amount / deposit_due_date / deposit_proof / customerPortalPaymentStatus / verified_at
        │               │                           ├── 动作：生成AR / 上传水单 / 核销 / 同步Portal状态
        │               │                           ├── 决策：定金未到催款 / 定金已核销进入PR
        │               │                           └── PR
        │               │                               ├── 性质：采购需求校验分发节点
        │               │                               ├── 角色：Sales_Rep / Sales_Assistant / Procurement / Procurement_Manager / Order_Coordinator
        │               │                               ├── 状态：草稿 / 待校验 / 已校验 / 待分配供应商 / 待转CG / 已转CG / 驳回补充
        │               │                               ├── 字段：pr_no / source_sc_no / product_lines / target_qty / target_delivery_date / supplier_split_plan / quality_requirements / packing_requirements / purchase_notes / sampling_required_precheck / sampling_precheck_reason / sample_reference_source / sealing_required_precheck
        │               │                               ├── 动作：发起PR / 校验 / 拆供应商 / 预判是否打样 / 回退补充 / 生成CG
        │               │                               ├── 决策：信息不完整回流Sales / 未拆供应商停留PR / 打样条件不清回流Sales和Customer确认 / 完成拆分并完成打样预判进入CG
        │               │                               └── CG
        │               │                                   ├── 性质：正式采购合同与采购审批节点
        │               │                                   ├── 角色：Procurement / Procurement_Manager / CEO / Finance / Order_Coordinator / Sales_Rep / Customer
        │               │                                   ├── 状态：草稿 / 待审批 / 已批准 / 已下单 / 生产准备中 / 生产中 / 待打样（条件触发） / 待封样（条件触发） / 待验货 / 待采购结案 / 采购执行异常
        │               │                                   ├── 字段：cg_no / source_pr_no / supplier_id / purchase_price / payment_terms / supplier_lead_time / qc_requirements / shipment_requirements / approval_status / sampling_required / sampling_reason / sample_confirm_by / sample_skip_approved_by / sealing_required / seal_reference_source / seal_validity / no_seal_approved_by
        │               │                                   ├── 动作：创建CG / 提交采购主管审批 / 采购金额 > 100000 CNY 时提交 CEO 二审 / 审批 / 下单 / 更新生产进度 / 判定是否打样 / 按需发起打样 / 按需封样 / 发起验货 / 执行采购结案
        │               │                                   ├── 打样判定
        │               │                                   │   ├── 输入来源：优先承接QT客户样品要求 / SC合同样品条款 / PR打样预判，再由采购侧复核落地
        │               │                                   │   ├── 默认责任：Procurement提出 / Sales_Rep补充客户要求 / Customer最终确认样品要求 / Procurement_Manager对例外跳样负责
        │               │                                   │   ├── 必须打样：新品首单 / OEM或ODM / 新供应商首单 / 包装或印刷内容变化 / 关键材质颜色工艺变化 / 客户明确要求样品确认
        │               │                                   │   ├── 可跳过打样：标准品复购 / 同供应商同规格同包装无变化 / 历史封样仍有效 / 客户书面确认免样 / 风险等级低且主管批准
        │               │                                   │   ├── 跳过打样后的封样规则：若历史封样有效可直接沿用封样放量产；若无历史封样但客户同意免样，可直接放量产并保留免样审批记录
        │               │                                   │   └── 审计要求：必须记录sampling_required / sampling_reason / sample_skip_approved_by / sealing_required
        │               │                                   ├── 审批规则：所有采购合同先走 Procurement_Manager 一审；采购金额 > 100000 CNY 再走 CEO 二审；二审通过后才可下单
        │               │                                   ├── 决策：审批驳回回流Procurement / 需打样进打样 / 无需打样直接进量产 / 样品确认后封样放量产 / 免样但需沿用历史封样后放量产
        │               │                                   ├── 打样（条件分支）：待打样 / 打样中 / 待客户确认 / 需修改 / 已确认
        │               │                                   ├── 封样（条件分支）：待封样 / 封样处理中 / 已封样 / 待放量产
        │               │                                   ├── 封样规则
        │               │                                   │   ├── 必须有封样后才可量产：新品首单 / OEM或ODM / 客户明确要求样品确认 / 打样确认通过后需要冻结量产标准的订单
        │               │                                   │   ├── 可沿用历史封样：同供应商 / 同规格 / 同材质 / 同颜色 / 同包装 / 同工艺且历史封样仍有效
        │               │                                   │   ├── 可无封样直接量产：标准品低风险复购 / 客户书面确认免样免封样 / 主管批准免样且无历史争议记录
        │               │                                   │   ├── 禁止无封样量产：存在关键规格变化 / 包装印刷变化 / 客诉未闭环 / 历史封样已失效 / QC无法取得明确检验标准
        │               │                                   │   └── 审计要求：必须记录sealing_required / seal_reference_source / seal_validity / no_seal_approved_by
        │               │                                   ├── 量产：待排产 / 已排产 / 生产中 / 完工待验货 / 延误异常；可由封样后进入，也可在无需打样且允许免封样时直接进入
        │               │                                   ├── QC：待排期 / 已排期 / 验货中 / 报告草稿 / 通过 / 待整改 / 待复验 / 验货任务关闭；QC检验标准优先取当前有效封样，其次取客户书面免样免封样要求，再其次取合同与采购规格冻结版本
        │               │                                   ├── QC放行规则
        │               │                                   │   ├── 可直接放行：检验结果通过 / 关键缺陷为零 / 主要缺陷在客户允许范围内 / 数量齐套 / 包装标识正确 / 出运资料与货物一致
        │               │                                   │   ├── 必须整改复验：存在主要缺陷超限 / 包装或标签错误 / 数量短缺 / 关键工艺与确认标准不一致 / 客户要求复验
        │               │                                   │   ├── 即使检验通过也不得放行：无有效封样且本单要求封样 / 关键单证缺失 / 客户冻结出货 / 定金或放货条件未满足 / 重大客诉未关闭
        │               │                                   │   ├── 例外放行：仅允许低风险尾项问题在Sales_Rep、Procurement_Manager、Customer三方确认后有条件放行
        │               │                                   │   └── 审计要求：必须记录qc_release_status / qc_release_block_reason / reinspection_required / release_approved_by
        │               │                                   ├── 订舱前决策：incoterm已确认 / 是否需商检 / 是否需询运费 / 客户已确认运费或发运安排 / QC已放行 / Payment放货条件已满足
        │               │                                   │   ├── 订舱放行条件：货好 / 资料初齐 / 箱规件毛体明确 / 船期窗口匹配 / 客户发运要求已确认
        │               │                                   │   ├── 订舱责任枚举：our_company = 我方订舱 / customer_confirmed_freight = 客户确认运费后我方订舱 / customer_nominated_forwarder = 客户指定货代、我方代订
        │               │                                   │   ├── Incoterm默认责任：FOB / EXW / FCA 默认国际运费责任在客户侧；CIF / CFR / CNF / C&F / CPT / CIP 默认国际运费责任在我方侧；若业务改写，以 bookingResponsibility 为准
        │               │                                   │   ├── 现有代码已支持的订舱前置情况：共 3 种订舱责任场景 + 2 类显式阻断 + 3 个订舱请求推进状态
        │               │                                   │   │   ├── 场景1：our_company，我方订舱；需要先保存询价比价记录，再决定是否还需客户确认运费
        │               │                                   │   │   ├── 场景2：customer_confirmed_freight，客户确认运费后我方订舱；必须先拿到客户对海运费和船期的确认
        │               │                                   │   │   ├── 场景3：customer_nominated_forwarder，客户指定货代、我方代订；代码上可不强制先录入询价比价记录
        │               │                                   │   │   ├── 阻断1：blocked_by_payment，订舱前收款模式下客户款未确认
        │               │                                   │   │   ├── 阻断2：blocked_by_freight_confirmation，需要客户确认运费但尚未确认
        │               │                                   │   │   ├── 请求状态1：ready_to_book，订舱控制已满足
        │               │                                   │   │   ├── 请求状态2：customer_confirmation_pending，订舱询价已建但待客户确认运费/船期
        │               │                                   │   │   └── 请求状态3：shipping_order_issued，已下 Shipping Order
        │               │                                   │   ├── 海运费询价规则：当 bookingResponsibility 不是 customer_nominated_forwarder 时，必须先保存货代或船公司询价比价记录；现有界面校验至少 1 条有效报价；V1正式业务口径“货比三家”定义为至少 2 个及以上货代询价并留痕，同一家货代可附带多个船公司方案
        │               │                                   │   ├── 客户确认规则：当 freightConfirmationRequired = true 或 bookingResponsibility = customer_confirmed_freight 时，必须先取得客户对海运费和船期的确认，才可下 Shipping Order
        │               │                                   │   ├── 禁止订舱：QC未放行 / 放货条件未满足 / 客户发运方式未确认 / 关键出运资料缺失 / 商检前置条件未完成 / 需客户确认运费但客户未确认 / 需我方订舱但未保存询价比价记录
        │               │                                   │   ├── 报关放行条件：报关资料齐套 / 品名HS与申报要素确认 / 箱单发票一致 / 法检商检条件满足 / 船司仓位有效
        │               │                                   │   └── 禁止报关：单货不符 / 报关资料缺失 / 法检商检未完成 / 品名归类有争议 / 客户冻结出运
        │               │                                   ├── Shipment：待订舱 / 已订舱 / 待装柜 / 已装柜 / 已报关 / 已开船 / 在途 / 待清关 / 清关中 / 到港 / 已签收
        │               │                                   │   ├── 订舱关键点：船期 / 舱位 / 截关日 / 截补料日 / SO信息 / 拖车装柜安排
        │               │                                   │   ├── 装柜关键点：箱号封号 / 件数毛重体积 / 实装照片 / 装柜清单 / 实际装柜时间
        │               │                                   │   ├── 报关关键点：报关资料一致 / 海关申报要素完整 / 监管条件满足 / 报关行回执完整
        │               │                                   │   ├── 清关关键点：目的港资料齐套 / 客户收货主体信息正确 / 税费安排明确 / 提货授权齐备
        │               │                                   │   ├── 清关阻断：目的港单证缺失 / 收货人资料错误 / 税费未付 / 信用证放单条件未满足 / 海关查验或扣关
        │               │                                   │   └── 审计要求：必须记录booking_confirmed_at / customs_released_at / clearance_block_reason / delivered_at
        │               │                                   ├── Docs：待生成 / 待补资料 / 已生成 / 待校验 / 已齐套 / 待交单（信用证） / 已交单（信用证） / 发货单证已归档 / 单证处理异常
        │               │                                   │   ├── 常规单证：CI / PL / BL草稿或提单信息 / 报关资料 / 合同 / 发票 / 收款凭证 / 结汇与退税资料
        │               │                                   │   ├── 信用证交单单证：Commercial Invoice / Packing List / Bill of Lading / Certificate of Origin / Insurance Policy / Inspection Certificate / Beneficiary Statement / 其他L/C要求单证
        │               │                                   │   ├── 交单关键点：单证名称一致 / 金额一致 / 数量一致 / 船期与装运期一致 / 受益人一致 / 抬头与格式符合L/C条款 / 交单期未超期
        │               │                                   │   ├── 不符点类型：单单不一致 / 单证与信用证条款不一致 / 金额或数量差异 / 日期超期 / 单证缺失 / 签章不符 / 提单信息不符
        │               │                                   │   ├── 阻断规则：关键单证缺失不得报关或放货；L/C交单资料不齐不得进入已交单；重大不符点未解除不得进入待承兑或已承兑
        │               │                                   │   └── 审计要求：必须记录doc_set_type / lc_doc_check_status / discrepancy_notes / discrepancy_resolved_at / presented_at
        │               │                                   ├── Payment：待定金 / 已收定金 / 待尾款 / 已收尾款 / 信用证处理中 / 信用证已开立 / 待交单 / 已交单 / 待承兑 / 已承兑 / 超账期 / 应付处理中 / 财务结算关闭
        │               │                                   │   ├── 收款方式：TT / DP / DA / 信用证L/C / 混合付款
        │               │                                   │   ├── TT与常规收款规则：按SC付款条款执行，默认至少满足定金条件后才允许采购和生产启动
        │               │                                   │   ├── 信用证L/C规则
        │               │                                   │   │   ├── 信用证结构：有定金的信用证 / 100%信用证
        │               │                                   │   │   ├── 有定金的信用证：先收定金后开证，生产与放货同时受定金到账和信用证有效性约束
        │               │                                   │   │   ├── 100%信用证：无需另收定金，但必须先确认信用证已开立、条款可执行、受益人和单证要求无重大风险后才可放产
        │               │                                   │   │   ├── 常见信用证类型：L/C at sight / Usance L/C / Transferable L/C / Revolving L/C
        │               │                                   │   │   ├── L/C at sight：交单相符后即期付款，通常可替代尾款到账作为放货依据，但仍需Finance确认交单风险与银行风险
        │               │                                   │   │   ├── 与Docs联动：信用证相关状态推进必须以Docs完成交单校验、交单提交和不符点处理结果为前提
        │               │                                   │   │   ├── 信用证关键控制点：开证是否完成 / 条款是否可执行 / 最迟装运期 / 交单期 / 单证要求 / 银行风险 / 不符点风险 / Docs是否完成交单校验
        │               │                                   │   │   └── 信用证阻断条件：信用证未开立 / 条款无法执行 / 银行资信风险高 / 不符点未解决 / 交单资料不齐 / Docs未完成交单校验
        │               │                                   │   ├── 放货条件
        │               │                                   │   │   ├── 必须定金到账才可下单或放产：新客 / 高风险客户 / 大额订单 / 定制单 / OEM或ODM
        │               │                                   │   │   ├── 必须尾款到账才可放货或放单证：合同约定款到发货 / 款到放单 / 高风险客户 / 历史逾期客户
        │               │                                   │   │   ├── 信用证客户可放货：信用证已开立且可执行 / 或 L/C at sight 交单条件已满足并经Finance确认可放货
        │               │                                   │   │   ├── 可账期放货：老客户 / 信用额度内 / 历史回款良好 / 经Finance与业务主管批准
        │               │                                   │   │   ├── 禁止放货：应收逾期未清 / 信用额度超限 / 客户承诺函缺失 / 放货审批未完成 / 信用证不符点重大未解除
        │               │                                   │   │   └── 例外放货：仅允许在Finance、Sales_Director、业务Owner共同批准后执行，并保留风险说明
        │               │                                   │   ├── 应付联动：供应商预付款、尾款、发票状态影响采购付款，但不直接替代客户放货条件
        │               │                                   │   └── 审计要求：必须记录payment_method / lc_type / lc_status / lc_opened_at / lc_discrepancy_status / payment_release_status / release_block_reason / credit_release_approved_by / overdue_risk_level
        │               │                                   ├── 开票归档：待申请开票 / 待开票 / 已开票 / 待归档 / 开票资料已归档
        │               │                                   ├── Feedback：待回访 / 已回访 / 有问题待处理 / 反馈问题已关闭
        │               │                                   └── Repeat：观察中 / 复购窗口到期 / 已触达 / 形成新需求 / 转新ING / 沉睡客户
        │               ├── 业务可直接报价
        │               │   └── QT：创建端Sales_Rep / 输入来源直报价ING / 动作加利润加条件提交审批发送客户 / 客户反馈接受拒绝议价 / 其后链路与上方QT开始完全一致
        │               └── 止于：Repeat
        └── 控制总枝
            ├── 经营口径
            │   ├── 客户口径：新客 / 老客 / 重点 / 战略 / 沉睡 / 流失
            │   ├── 商机口径：有效线索 / 有效ING / 有效QT / 已成交 / 搁置 / 丢单
            │   ├── 成交口径：成交客户 / 成交订单 / 已发货订单 / 已回款订单 / 已闭环订单
            │   ├── 复购口径：复购 / 扩品 / 转介绍 / 服务转贸易
            │   └── 风险口径：高风险客户 / 高风险订单 / 重大异常 / 低毛利异常
            ├── 节点时限规则
            │   ├── 客户开发：24h首响 / 72h更新
            │   ├── QR链：24h承接 / 24h发XJ / BJ收齐24h出结论
            │   ├── QT链：24h出QT / 7天内客户反馈
            │   ├── SC链：签署 / 定金 / PR启动
            │   ├── 采购链：PR24h校验 / CG24h审批 / 24h下单
            │   ├── QC链：24h报告 / 整改时限
            │   ├── Shipment和Docs链：订舱 / 报关 / 齐套 / 清关
            │   ├── Payment链：定金 / 尾款 / 账期
            │   └── Feedback和Repeat链：回访 / 复购窗口
            ├── 异常升级
            │   ├── 销售异常：未首响 / 未跟进 / QT无反馈 / SC未签 / 客户抱怨
            │   ├── 采购异常：QR未承接 / XJ无响应 / BJ未结论 / CG审批超时 / 交期延误
            │   ├── 质量异常：首检不通过 / 整改超时 / 重复缺陷
            │   ├── 出运与单证异常：船期变化 / 报关异常 / 清关异常 / 缺关键单证
            │   ├── 财务异常：定金超时 / 尾款超账期 / 低毛利 / 高风险客户
            │   └── 经营异常：大额丢单 / 战略客户流失风险 / 区域整体掉速
            ├── 审批
            │   ├── QT：一审 / 二审
            │   ├── SC：一审 / 二审
            │   ├── PR：校验
            │   ├── CG：正式审批
            │   ├── Finance：大额付款 / 特殊账期 / 低毛利例外
            │   └── Docs和Archive：特殊归档 / 特殊开票
            ├── 事件通知：创建事件 / 状态变化事件 / 回流事件 / 超时事件 / 异常事件 / 审批事件
            ├── 权限：战略决策层 / 经营管理层 / 业务执行层 / Customer Portal / Supplier Portal
            ├── 三端动作边界
            │   ├── 内部端：创建和推进 QT / SC / PR / CG / QC / 订舱前决策 / Shipment / Docs / Payment / 开票归档
            │   ├── Customer Portal：上传付款水单 / 确认海运费和船期 / 确认样品或免样 / 提供清关与收货资料 / 确认到港与收货
            │   ├── Supplier Portal：响应 XJ / 提交 BJ / 提供样品与量产进度 / 配合整改与复验
            │   ├── Forwarder 货代：响应海运费询价 / 提供船期方案 / 确认订舱 / 回传 SO 与提单 / 提供到港与清关协同信息
            │   └── 原则：客户只能确认或上传属于客户侧责任的事项；供应商只能维护供应商交付事项；内部端负责锁定状态、审批、放行和回写
            ├── 文档写作规则（代码优先）
            │   ├── 审批条件、状态条件、阻断条件，必须先查现有代码与服务层，再决定是否写入本 md
            │   ├── 如代码已有真实字段或枚举，优先沿用真实命名，不凭空发明新状态
            │   ├── 如代码只有部分实现，文档必须明确标注为“部分具备 / 服务层派生 / 业务目标口径”
            │   ├── 如代码未实现，不得写成“系统已具备”，只能写成“建议口径 / 后续实现目标”
            │   └── 对审核条件的判断顺序：先查主表字段 -> 再查 service -> 再查 UI 按钮/阻断逻辑 -> 最后才参考 demo / blueprint / 历史文档
            ├── 字段-状态-动作映射（后段实施重点）
            │   ├── QT
            │   │   ├── 关键字段：quotation_no / source_qr_no / source_cost_from_qr / profit_markup / domestic_additional_costs / incoterm / quotation_conditions / approval_status / approval_chain / currentApprovalStep / customerFeedback.status / customerFeedback.comment / sampling_expectation / sampling_notes
            │   │   ├── 关键状态：草稿 / 待一审 / 待二审 / 已发送 / 待反馈 / 议价中 / 已接受 / 已拒绝 / 已过期
            │   │   └── 关键动作：生成报价 / 提交审批 / 审批通过 / 审批驳回 / 发送客户 / 记录客户反馈 / 记录客户样品要求 / 下推SC
            │   ├── SC
            │   │   ├── 关键字段：contract_no / quotation_reference / contract_amount / deposit_ratio / payment_terms / delivery_terms / contract_feedback_status / contract_feedback_notes / approval_flow / approval_history / approval_notes / rejection_reason / approved_at / sample_clause_required / sample_clause_notes / sample_waiver_confirmed_by_customer
            │   │   ├── 关键状态：草稿 / 待签署 / 已签署 / 条款异议中 / 待定金 / 已生效 / 已拒签
            │   │   └── 关键动作：生成合同 / 发送合同 / 催签 / 修订条款 / 确认签署 / 固化样品条款 / 确认免样免封样 / 下推AR / 下推PR
            │   ├── PR
            │   │   ├── 关键字段：pr_no / source_sc_no / product_lines / target_qty / target_delivery_date / supplier_split_plan / quality_requirements / packing_requirements / purchase_notes / sampling_required_precheck / sampling_precheck_reason / sample_reference_source / sealing_required_precheck
            │   │   ├── 关键状态：草稿 / 待校验 / 已校验 / 待分配供应商 / 待转CG / 已转CG / 驳回补充
            │   │   └── 关键动作：发起PR / 校验需求 / 回退补充 / 拆分供应商 / 预判是否打样 / 预判是否封样 / 生成CG
            │   ├── CG
            │   │   ├── 关键字段：cg_no / source_pr_no / supplier_id / purchase_price / payment_terms / supplier_lead_time / qc_requirements / shipment_requirements / approval_status / sampling_required / sampling_reason / sample_confirm_by / sample_skip_approved_by / sealing_required / seal_reference_source / seal_validity / no_seal_approved_by
            │   │   ├── 关键状态：草稿 / 待审批 / 已批准 / 已下单 / 生产准备中 / 生产中 / 待打样 / 待封样 / 待验货 / 待采购结案 / 采购执行异常
            │   │   └── 关键动作：创建CG / 提交审批 / 审批通过 / 审批驳回 / 正式下单 / 按需发起打样 / 按需封样 / 更新生产进度 / 发起验货 / 执行采购结案
            │   ├── QC
            │   │   ├── 关键字段：qc_no / qc_standard / defect_level / qc_result / qc_report_url / reinspection_required / qc_release_status / qc_release_block_reason / release_approved_by
            │   │   ├── 关键状态：待排期 / 已排期 / 验货中 / 报告草稿 / 通过 / 待整改 / 待复验 / QC已放行 / QC放行阻断 / 验货任务关闭
            │   │   └── 关键动作：排期 / 执行验货 / 出具报告 / 标记整改 / 发起复验 / 执行QC放行 / 阻断出运 / 例外放行审批 / 关闭验货任务
            │   ├── 订舱前决策
            │   │   ├── 关键字段：booking_responsibility / freight_confirmation_required / freight_confirmed_by_customer_at / freight_inquiry_status / booking_status / selected_booking_quote_id
            │   │   ├── 关键状态：blocked_by_payment / blocked_by_freight_confirmation / ready_to_book / customer_confirmation_pending / shipping_order_issued
            │   │   └── 关键动作：保存订舱控制 / 保存询价比价 / 客户确认运费 / 下 Shipping Order
            │   ├── Shipment
            │   │   ├── 关键字段：booking_no / booking_confirmed_at / booking_cutoff_at / customs_released_at / clearance_block_reason / delivered_at
            │   │   ├── 关键状态：待订舱 / 已订舱 / 待装柜 / 已装柜 / 已报关 / 已开船 / 在途 / 待清关 / 清关中 / 到港 / 已签收
            │   │   └── 关键动作：订舱确认 / 装柜回写 / 报关回写 / 在途更新 / 到港确认 / 签收确认
            │   ├── Docs
            │   │   ├── 关键字段：doc_set_type / lc_doc_check_status / discrepancy_notes / discrepancy_resolved_at / presented_at / archive_status
            │   │   ├── 关键状态：待生成 / 待补资料 / 已生成 / 待校验 / 已齐套 / 待交单 / 已交单 / 发货单证已归档 / 单证处理异常
            │   │   └── 关键动作：生成单证 / 校验单证 / 标记不符点 / 提交交单 / 执行发货单证归档
            │   └── Payment
            │       ├── 关键字段：payment_method / lc_type / lc_status / lc_opened_at / lc_discrepancy_status / payment_release_status / release_block_reason
            │       ├── 关键状态：待定金 / 已收定金 / 待尾款 / 已收尾款 / 信用证处理中 / 信用证已开立 / 待交单 / 已交单 / 待承兑 / 已承兑 / 财务结算关闭
            │       └── 关键动作：确认收款 / 推进开证 / 确认交单 / 标记承兑 / 执行放货批准 / 阻断放货
            ├── 阻断条件与放行条件（关键控制口径）
            │   ├── QT
            │   │   ├── 阻断条件：成本未形成 / 审批未通过 / 关键报价条件缺失 / 客户主体不明确
            │   │   └── 放行条件：价格条件完整 / 审批完成 / 客户接收对象明确 / 有效期已设置
            │   ├── SC
            │   │   ├── 阻断条件：QT未接受 / 条款未定稿 / 样品条款未明确 / 客户签署主体不清
            │   │   └── 放行条件：报价已接受 / 合同条款冻结 / 客户签署路径明确 / 生效条件可判定
            │   ├── PR
            │   │   ├── 阻断条件：SC未生效 / 产品行信息不完整 / 供应商拆分逻辑不清 / 打样预判未完成
            │   │   └── 放行条件：SC已生效 / 采购需求完整 / 供应商拆分明确 / 打样封样预判已记录
            │   ├── CG
            │   │   ├── 阻断条件：PR未校验 / 采购价或交期未确认 / 审批未通过 / 应下单前置付款条件未满足
            │   │   └── 放行条件：PR已校验 / 供应商已锁定 / 审批通过 / 采购付款条件满足 / 是否打样已判定
            │   ├── QC
            │   │   ├── 阻断条件：无明确检验标准 / 货未齐 / 包装标识不清 / 关键资料与实物不一致 / 重大缺陷未整改
            │   │   └── 放行条件：检验结果通过 / 关键缺陷为零 / 主要缺陷在允许范围 / 数量与包装正确 / 放行审批完成
            │   ├── 订舱前决策
            │   │   ├── 阻断条件：QC未放行 / 放货条件未满足 / 运费未确认 / 询价比价记录不足 / 商检前置条件未完成 / 客户冻结发运
            │   │   └── 放行条件：QC已放行 / bookingResponsibility 已确认 / freight 条件已满足 / Shipping Order 可下发
            │   ├── Shipment
            │   │   ├── 阻断条件：SO未下发 / 截关截补料不满足 / 报关资料缺失 / 单货不符 / 清关资料缺失
            │   │   └── 放行条件：订舱已确认 / 装柜信息齐 / 报关放行 / 船开确认 / 清关与签收可回写
            │   ├── Docs
            │   │   ├── 阻断条件：关键单证缺失 / 信用证单证不齐 / 不符点未解决 / archive 归档主索引缺失
            │   │   └── 放行条件：单证齐套 / 校验通过 / L/C 交单包完整 / 归档编号可生成
            │   └── Payment
            │       ├── 阻断条件：定金未到 / 尾款未到 / L/C 未开立或不可执行 / 不符点未解除 / 超账期未处理 / 放货审批未完成
            │       └── 放行条件：收款方式已确定 / 相应款项或信用证条件满足 / 风险审批完成 / payment_release_status 可放行
            ├── 角色端点映射（创建端 / 承接端 / 执行端 / 查看端）
            │   ├── QT
            │   │   ├── 创建端：Sales_Rep
            │   │   ├── 承接端：Regional_Manager / Sales_Director / Customer
            │   │   ├── 执行端：Sales_Rep 生成发送并记录反馈
            │   │   └── 查看端：Sales_Rep / Regional_Manager / Sales_Director / Sales_Assistant
            │   ├── SC
            │   │   ├── 创建端：Sales_Rep
            │   │   ├── 承接端：Customer / Finance / Procurement / Order_Coordinator
            │   │   ├── 执行端：Sales_Rep 发合同催签固化条款，Finance 承接定金，采购与跟单承接履约准备
            │   │   └── 查看端：Sales_Rep / Regional_Manager / Finance / Procurement / Order_Coordinator
            │   ├── PR
            │   │   ├── 创建端：Sales_Rep / Sales_Assistant
            │   │   ├── 承接端：Procurement
            │   │   ├── 执行端：Procurement 校验需求、拆分供应商、预判打样封样
            │   │   └── 查看端：Sales_Rep / Sales_Assistant / Procurement / Procurement_Manager / Order_Coordinator
            │   ├── CG
            │   │   ├── 创建端：Procurement
            │   │   ├── 承接端：Procurement_Manager / CEO（条件触发） / Supplier / Finance / QC
            │   │   ├── 执行端：Procurement 建单下单推进样品与生产，Procurement_Manager 完成一审，CEO 在采购金额 > 100000 CNY 时完成二审，Supplier 承接供货
            │   │   └── 查看端：Procurement / Procurement_Manager / CEO / Sales_Rep / Order_Coordinator / QC / Finance
            │   ├── QC
            │   │   ├── 创建端：QC 或 Procurement 发起验货任务
            │   │   ├── 承接端：QC / Supplier / Order_Coordinator
            │   │   ├── 执行端：QC 排期验货出报告，Supplier 配合整改，采购协同复验
            │   │   └── 查看端：QC / Procurement / Sales_Rep / Order_Coordinator / Customer（按需）
            │   ├── 订舱前决策
            │   │   ├── 创建端：Order_Coordinator 或 Procurement/跟单侧初始化
            │   │   ├── 承接端：Sales_Rep / Finance / Documentation_Officer / Forwarder
            │   │   ├── 执行端：Order_Coordinator 汇总条件、保存订舱控制、推进客户确认与 Shipping Order
            │   │   └── 查看端：Sales_Rep / Order_Coordinator / Finance / Documentation_Officer / Procurement / 管理层
            │   ├── Shipment
            │   │   ├── 创建端：Order_Coordinator
            │   │   ├── 承接端：Forwarder / Warehouse_Ops / Customs Broker / Customer
            │   │   ├── 执行端：货代订舱、仓储装柜、报关行报关、协调员更新在途与签收
            │   │   └── 查看端：Order_Coordinator / Sales_Rep / Documentation_Officer / Finance / Customer（部分）
            │   ├── Docs
            │   │   ├── 创建端：Documentation_Officer
            │   │   ├── 承接端：Finance / Order_Coordinator / Sales_Rep / Customer / 银行（L/C场景）
            │   │   ├── 执行端：Documentation_Officer 生成校验归档单证，Finance 校验票据与交单金融资料
            │   │   └── 查看端：Documentation_Officer / Finance / Sales_Rep / Order_Coordinator / 管理层
            │   └── Payment
            │       ├── 创建端：Finance
            │       ├── 承接端：Customer / 银行 / Sales_Rep / CFO
            │       ├── 执行端：Finance 记账核销推进开证承兑与放货判断，Sales_Rep 协同催款
            │       └── 查看端：Finance / CFO / Sales_Rep / Regional_Manager / Documentation_Officer / Order_Coordinator
            ├── 代码现状校验（审批与状态）
            │   ├── QT 现状
            │   │   ├── 主表：sales_quotations
            │   │   ├── 审批字段：approval_status / approval_chain
            │   │   ├── 客户反馈字段：customer_status / customer_response
            │   │   ├── 服务层派生：currentApprovalStep / currentApproverRole / requiresDirectorApproval
            │   │   └── 结论：QT 当前是“审批字段 + 客户反馈字段 + 服务层派生步骤”的组合模型，不是单一 status 模型
            │   ├── SC 现状
            │   │   ├── 主表：sales_contracts
            │   │   ├── 主状态字段：status
            │   │   ├── 审批字段：approval_flow / approval_history / approval_notes / rejection_reason / approved_at
            │   │   ├── 客户反馈字段：customer_feedback
            │   │   ├── 服务层派生：currentApprovalStep / currentApproverRole / requiresDirectorApproval / customerPortalPaymentStatus
            │   │   └── 结论：SC 当前是“合同主状态 + 审批流 JSON + 客户反馈 + 派生 Portal 状态”的组合模型
            │   ├── 审批中心现状
            │   │   ├── 主表：approval_records
            │   │   ├── 主状态字段：status
            │   │   ├── 历史字段：approval_history
            │   │   ├── 当前审批人字段：current_approver / current_approver_role / next_approver / next_approver_role
            │   │   └── 结论：approval_records 更像“审批待办与轨迹表”，不能直接替代 QT/SC 主业务状态
            │   ├── 后合同执行现状
            │   │   ├── 主表：purchase_order_execution
            │   │   ├── 打样封样：sample_required / pre_production_sample_status / sample_round / sample_confirmed_at / seal_confirmed_at
            │   │   ├── QC执行：supplier_self_inspection_status / qc_inspection_status / customer_designated_inspection_status
            │   │   ├── 付款放货：customer_balance_status / customer_balance_gate_status / bank_submission_status / document_release_status
            │   │   ├── 订舱发运：booking_status / freight_inquiry_status / shipping_order_status / shipment_readiness_status
            │   │   └── 结论：后段状态已大量落库，V1 文档应优先复用这些真实字段，而不是重新发明状态名
            │   ├── 审核条件具备性判断
            │   │   ├── QT：已具备
            │   │   │   ├── 代码现状：提交审批与复核都按金额判断是否需要总监二审
            │   │   │   ├── 实际门槛：amount >= 20000 触发 Sales_Director
            │   │   │   └── 判断：条件清晰且已接入 UI、service、approval center，属于可落地现状
            │   │   ├── SC：已具备
            │   │   │   ├── 代码现状：submitForApproval / approveContract / rejectContract 已完整处理 supervisor -> director 两级流
            │   │   │   ├── 实际门槛：totalAmount >= 20000 触发 director
            │   │   │   └── 判断：条件清晰、状态闭环较完整，文档可按真实现状写
            │   │   ├── CG / 采购审批：部分具备
            │   │   │   ├── 当前代码：已改造成 procurementRequestStatus = draft_allocated / pending_manager_approval / pending_ceo_approval / approved_boss / rejected_boss / pushed_supplier
            │   │   │   ├── 审批触发：采购员提交后先生成 Procurement_Manager 一审；当采购金额 > 100000 CNY 时，一审通过自动转 CEO 二审
            │   │   │   ├── 金额口径现状：`po.totalAmount > 100000` 触发 CEO 二审；`po.totalAmount >= 50000` 仍仅用于 urgency = high
            │   │   │   ├── 与 V1目标规则对照：已按“采购主管一审 + CEO 条件二审”落到现有审批中心与采购单状态回写
            │   │   │   └── 剩余差距：当前最终通过状态仍沿用 approved_boss 命名，后续如需统一语义可再做状态重命名
            │   │   ├── Payment / 放货：部分具备
            │   │   │   ├── 当前代码：已落库 customer_balance_status / customer_balance_gate_status / bank_submission_status / document_release_status / document_released_at / document_released_by
            │   │   │   ├── 当前代码：InspectionManagementComplete 已按 collectionControlMode 自动回写付款门控结果
            │   │   │   ├── 当前代码：ThirdPartyWarehouseModule 保存报关前准备时，已按 collectionControlMode 自动校正银行交单与放单状态组合，避免出现未满足条件却直接 released 的不合理状态
            │   │   │   ├── 当前代码：CompliancePacketsTab 已支持在 D05 阻断时提交“例外放单申请”，进入 approval_records，并由 ApprovalCenter 审批后把 document_release_status 从 blocked 调整为 ready_to_release
            │   │   │   ├── 已落地规则：前 T/T 收款确认后放开 booking；后 T/T 收款确认后 document_release_status -> ready_to_release；L/C 与 D/P 收款确认后保持 bank_submission_status = pending_submission、document_release_status 仍受银行交单结果控制
            │   │   │   ├── 与 V1目标规则对照：付款与放单已从“文字规则”进入真实状态回写，并已有最小版例外放单申请，但尚未形成 Finance + 业务Owner + Sales_Director 的多方会签模型
            │   │   │   └── 剩余差距：超账期例外放货 / 信用证不符点审批 / D/P 承兑例外放单仍未形成独立审批模型
            │   │   ├── QC 例外放行：未完整具备
            │   │   │   ├── 代码现状：已见 qc_inspection_status、QC结果回写与报告链
            │   │   │   ├── 未见：完整的“例外放行审批流”主表与审批节点
            │   │   │   └── 判断：当前只能写成业务控制口径，不能写成系统已完整实现
            │   │   └── Docs / L/C 交单审核：部分具备
            │   │       ├── 代码现状：已有 bank_submission_status / document_release_status / bank_submitted_at / bank_submitted_by / document_released_at / document_released_by 等后段状态
            │   │       ├── 代码现状：装柜模块已能回写 submitted_to_bank / negotiated / collected 与 ready_to_release / released 等里程碑，并自动记录操作者与时间
            │   │       ├── 代码现状：D05 sourceRef 与 notes 已开始同步收款规则、交单状态、放单状态与阻断原因，合规文件包详情可直接查看“为什么当前不能放单”
            │   │       ├── 代码现状：CompliancePacketsTab 已支持财务侧直接维护 D05 银行交单状态（pending_submission / submitted_to_bank / negotiated / collected），并按 L/C 或 D/P 规则联动放单状态；当前已收紧为仅 Finance / CFO / CEO 可编辑，其他角色只读
            │   │       ├── 代码现状：CompliancePacketsTab 已显式展示 D05 / D11 / D12 / D13 / D01 的阶段阻断，并已阻止“D11 未到位先传 D12”“D05 未齐套先维护交单状态”这类错序操作
            │   │       ├── 代码现状：D13 与 D01 当前没有人工上传入口，属于 syncByPurchaseOrderId 过程中的系统自动生成文件；因此真正需要受控的是“谁能触发 sync”，当前已收紧为仅 Finance / CFO / CEO 可执行
            │   │       ├── 代码现状：L/C 不符点已采用最小实现，复用 purchase_order_execution.remarks 的结构化片段落库，并同步到 D05 sourceRef 与合规文件包详情展示
            │   │       ├── 代码现状：当 L/C 不符点状态为 open 时，自动放单路径会继续保持 blocked，D05 阻断原因优先展示“不符点未解除”
            │   │       ├── 代码现状：如需越过 open 不符点放单，当前仍需走“例外放单申请 -> ApprovalCenter 审批”这条人工例外路径；例外申请入口已收紧为仅 Finance / CFO / CEO 可提交
            │   │       ├── 代码现状：ThirdPartyWarehouseModule 仍展示银行交单与放单状态，但已改为仓配侧只读；仓配继续维护运输、到港、清关、签收等执行里程碑
            │   │       ├── 代码现状：结案与发货执行归档当前仍发生在 ThirdPartyWarehouseModule，并直接写 purchase_order_execution；现已收紧为仅 Warehouse_Ops / CEO 可执行，且不再允许直接手改 caseCloseStatus / archiveStatus
            │   │       ├── 术语澄清：此处“发货执行归档”仅指 Shipment/Docs 执行层在到港、清关、签收后的发货执行闭环归档，不等于整单商业闭环结束
            │   │       ├── 术语澄清：客户回款完成属于 Payment 阶段；客户收到货后的使用/销售反馈、投诉、复购机会属于 Feedback / Repeat 阶段
            │   │       ├── 未见：独立的银行审单审批流主模型
            │   │       └── 判断：可写状态门控，不宜写成“银行审核流程已完整产品化”
            │   ├── 术语统一（本轮）
            │   │   ├── “发货执行归档” = Shipment / Docs 执行层在到港、清关、签收后的执行归档
            │   │   ├── “发货单证已归档” = Docs 阶段单证资料归档完成，不代表整单商业闭环结束
            │   │   ├── “财务结算关闭” = Payment 阶段收款、信用证、应付与放货条件已完成收口
            │   │   ├── “反馈问题已关闭” = Feedback 阶段投诉或问题处理闭环完成
            │   │   ├── “QC已放行” = 质量放行，仅表示允许进入订舱/出运前决策，不等于财务放货或海关放行
            │   │   ├── “开票资料已归档” = 发票与开票资料归档完成，不等于客户复购或生命周期结束
            │   │   ├── “单证处理异常” = Docs 阶段的资料缺失、单证不符、交单资料不齐等异常
            │   │   ├── “开票处理异常” = 开票申请、开票执行、票面信息或税务处理中的异常
            │   │   └── “关闭”在主版本中应尽量带阶段前缀，例如：财务结算关闭 / 反馈问题已关闭 / 验货任务关闭
            │   ├── 术语统一（第二轮）
            │   │   ├── “异常”在主版本中应尽量带阶段限定，例如：单证处理异常 / 开票处理异常 / 清关异常 / 财务异常
            │   │   ├── “放行”在主版本中应尽量带控制对象，例如：QC已放行 / 报关放行 / 放货批准 / 海关放行
            │   │   ├── “归档”在主版本中应尽量区分对象，例如：发货执行归档 / 发货单证已归档 / 开票资料已归档
            │   │   └── “反馈”在主版本中默认指客户回访与投诉处理；如指报价或合同回应，应写成“客户反馈端”或“采购反馈回写”
            │   ├── 术语统一（第三轮）
            │   │   ├── “量产异常” = 生产延期、排产偏差、供应商进度失控等量产执行异常
            │   │   ├── “采购执行异常” = CG 阶段审批、下单、交期、供应商履约等采购执行异常
            │   │   ├── “问题升级处理” = Feedback 阶段重大投诉或重大客诉转入跨部门处理，不与一般“异常处理”混用
            │   │   ├── “待采购结案” = CG 阶段采购执行收尾状态，不等于 Shipment / Payment / Feedback 全链路结束
            │   │   └── “控制规则” = 原先主版本里“治理”的更直白写法，主要指时限、异常、事件、权限、审计、阻断与放行规则
            │   ├── 模块动作角色表（现状）
            │   │   ├── 发货管理模块（ThirdPartyWarehouseModule 内部页） -> 运输、到港、清关、签收执行里程碑 -> Warehouse_Ops / CEO
            │   │   ├── 发货管理模块（ThirdPartyWarehouseModule 内部页） -> 结案、发货执行归档 -> Warehouse_Ops / CEO
            │   │   ├── 发货管理模块（ThirdPartyWarehouseModule 内部页） -> bankSubmissionStatus / documentReleaseStatus -> Finance / CFO / CEO（仓配侧只读）
            │   │   ├── 财务管理模块（CompliancePacketsTab） -> 同步后半段 / 上传 D09 D11 D12 / 维护 D05 银行交单状态 / 维护 L/C 不符点 / 提交例外放单申请 -> Finance / CFO / CEO
            │   │   └── 自动生成动作 -> D13 / D01 由 syncByPurchaseOrderId 触发，不存在人工上传角色
            │   ├── 代码对照结论（本轮）
            │   │   ├── 已一致：QT 审批门槛与审批中心联动 / SC 两级审批 / 订舱前 payment+freight 阻断 / 采购审批两级流（已按 V1 新规则改造）/ Payment 门控状态回写 / Docs-LC 基础交单放单状态收口
            │   │   ├── 部分一致：更细的 Docs-LC 交单审核 / 后合同执行状态门控 / Finance 例外放货的多方审批模型
            │   │   ├── 仍属目标口径：QC 例外放行审批 / 银行审单审批流 / 更细的财务例外放货审批 / L/C 不符点独立审批模型
            │   │   └── 写作原则：凡标“系统现状”的内容必须以当前代码与落库字段为准；凡超出现状者必须显式标记为“V1目标规则 / 剩余差距”
            │   └── 统一判断
            │       ├── 审批模型当前至少有三套：QT / SC / approval_records
            │       ├── 不宜强行把 QT 与 SC 改成同一 JSON 结构
            │       ├── 当前步骤与当前审批人更适合继续放在 service 层派生
            │       └── 文档里的“统一口径”应分为：已有落库字段 / 服务层派生口径 / 业务抽象口径
            ├── 审计日志：责任归属审计 / 销售主链审计 / 审批审计 / 采购履约审计 / 质量与交付审计 / 财务与归档审计
            ├── 字段来源与回写：责任字段 / 跟进字段 / 审批字段 / 付款字段 / 订舱与出运字段 / 归档字段 / 异常字段
            ├── KPI：销售KPI / 履约KPI / 财务KPI / 生命周期KPI
            └── 字段口径与字段变更：第一轮Supabase对齐盘点 / 字段口径对齐表V1 / Supabase变更回溯表 / 第二轮字段实施清单 / 已执行收口
```

## 13. 经营口径树

```text
经营口径
└── 统一经营定义
    ├── 客户口径
    │   ├── 新客户
    │   │   ├── 定义：首次进入系统且尚未成交的客户
    │   │   ├── 进入条件：完成建档
    │   │   └── 退出条件：形成首次成交或判定流失
    │   ├── 老客户
    │   │   ├── 定义：已有历史成交记录的客户
    │   │   ├── 进入条件：至少1次成交闭环
    │   │   └── 退出条件：长期无交易可转沉睡客户
    │   ├── 重点客户
    │   │   ├── 定义：对区域阶段性目标有明显影响的客户
    │   │   ├── 判定维度：金额、频次、潜力、战略价值
    │   │   └── 管理要求：主管重点关注
    │   ├── 战略客户
    │   │   ├── 定义：对公司长期经营有关键影响的客户
    │   │   ├── 判定维度：年度贡献、复购稳定性、行业影响力、项目价值
    │   │   └── 管理要求：总监/CEO可见
    │   ├── 沉睡客户
    │   │   ├── 定义：超过设定周期无实质互动或无成交的客户
    │   │   ├── 判定维度：最后成交时间、最后跟进时间、当前需求状态
    │   │   └── 管理要求：进入唤醒经营池
    │   └── 流失客户
    │       ├── 定义：明确失去合作可能的客户
    │       ├── 判定维度：客户明确终止、长期无响应、竞争对手锁定
    │       └── 管理要求：记录流失原因，进入复盘库
    ├── 商机口径
    │   ├── 有效线索
    │   │   ├── 定义：联系方式有效且具备初步业务意向的线索
    │   │   └── 用途：进入客户开发段
    │   ├── 有效ING
    │   │   ├── 定义：客户、需求、数量、交期等核心信息达到可推进标准的ING
    │   │   └── 用途：进入QR或QT
    │   ├── 有效QT
    │   │   ├── 定义：已正式发出且具备明确金额、条款、有效期的报价
    │   │   └── 用途：进入报价转化统计
    │   ├── 已成交
    │   │   ├── 定义：SC已签署并满足生效条件
    │   │   └── 用途：进入履约与回款链
    │   ├── 搁置商机
    │   │   ├── 定义：客户暂不推进，但仍保留再次启动可能
    │   │   └── 用途：进入复活提醒池
    │   └── 丢单商机
    │       ├── 定义：商机明确被竞争对手拿走或客户终止
    │       └── 用途：进入丢单复盘库
    ├── 成交与收入口径
    │   ├── 成交客户
    │   │   ├── 定义：至少有1个SC生效的客户
    │   │   └── 用途：成交客户数统计
    │   ├── 成交订单
    │   │   ├── 定义：至少1个SC进入履约阶段
    │   │   └── 用途：订单量统计
    │   ├── 已发货订单
    │   │   ├── 定义：Shipment进入已开船/在途后视为已发货
    │   │   └── 用途：交付统计
    │   ├── 已回款订单
    │   │   ├── 定义：完成约定应收的主要回款目标
    │   │   └── 用途：回款统计
    │   └── 已闭环订单
    │       ├── 定义：交付、回款、反馈均完成
    │       └── 用途：复购经营入口
    ├── 复购口径
    │   ├── 复购
    │   │   ├── 定义：同一客户在既有成交后再次形成新成交
    │   │   └── 用途：复购率统计
    │   ├── 扩品
    │   │   ├── 定义：同一客户购买新的产品线或新服务线
    │   │   └── 用途：客户深耕统计
    │   ├── 转介绍
    │   │   ├── 定义：由既有客户介绍而来的新增有效客户
    │   │   └── 用途：老客裂变统计
    │   └── 服务转贸易
    │       ├── 定义：service_to_trade 类型客户转化为 trade 类型客户
    │       └── 用途：重点战略转化指标
    └── 风险口径
        ├── 高风险客户
        │   ├── 定义：存在重大回款、投诉、流失、信用或战略影响风险的客户
        │   └── 用途：高层/主管重点监管
        ├── 高风险订单
        │   ├── 定义：存在交期、质量、单证、回款或利润异常的订单
        │   └── 用途：履约预警
        ├── 重大异常
        │   ├── 定义：影响收入、利润、交付、品牌或战略客户的异常
        │   └── 用途：升级处理
        └── 低毛利异常
            ├── 定义：低于公司或区域控制线的订单
            └── 用途：财务/CFO预警
```

---

## 14. 节点时限规则树

```text
节点时限规则
└── 全链路时间纪律
    ├── 客户开发段
    │   ├── 线索筛选
    │   │   ├── 建议时限：24小时内完成初筛
    │   │   └── 超时后果：降低线索温度与认领效率
    │   ├── 公海认领
    │   │   ├── 建议时限：高热度线索24小时内认领
    │   │   └── 超时动作：提醒主管关注
    │   └── 首次触达
    │       ├── 建议时限：客户建档后24小时内
    │       └── 超时动作：进入未首响预警
    ├── ING节点
    │   ├── 首响时限
    │   │   ├── 规则：24小时内必须有首次实质联系
    │   │   └── 超时动作：提醒业务员 + 主管可见
    │   ├── 更新时限
    │   │   ├── 规则：72小时内必须有一次推进记录
    │   │   └── 超时动作：进入停滞清单
    │   ├── 澄清时限
    │   │   ├── 规则：关键缺失信息应在3个工作日内补齐
    │   │   └── 超时动作：标记待补信息异常
    │   └── 下推时限
    │       ├── 规则：可下推后2个工作日内应下推QR或QT
    │       └── 超时动作：进入可下推未下推清单
    ├── QR / XJ / BJ节点组
    │   ├── QR承接时限
    │   │   ├── 规则：QR发起后24小时内采购必须承接
    │   │   └── 超时动作：提醒采购员与采购主管
    │   ├── XJ询价时限
    │   │   ├── 规则：承接后24小时内必须向供应商发询价
    │   │   └── 超时动作：进入采购未发询价清单
    │   ├── 供应商回复时限
    │   │   ├── 规则：原则上3个工作日内形成有效报价覆盖
    │   │   └── 超时动作：提醒扩供应商或升级
    │   ├── BJ比价时限
    │   │   ├── 规则：XJ收齐后24小时内完成比价结论
    │   │   └── 超时动作：提醒采购员和主管
    │   └── QR整体完成时限
    │       ├── 规则：普通单建议3-5个工作日内形成成本结论
    │       └── 超时动作：进入QR超时清单
    ├── QT节点
    │   ├── 报价生成时限
    │   │   ├── 规则：成本结论明确后24小时内生成QT
    │   │   └── 超时动作：提醒业务员
    │   ├── 报价反馈跟进时限
    │   │   ├── 规则：发出后7天内必须记录客户反馈或跟进动作
    │   │   └── 超时动作：进入已发QT未反馈清单
    │   ├── 谈判更新时限
    │   │   ├── 规则：谈判中单据每72小时必须更新一次
    │   │   └── 超时动作：主管可见
    │   └── 有效期时限
    │       ├── 规则：到期前2天提醒
    │       └── 超时动作：标记过期
    ├── SC节点
    │   ├── 合同签署时限
    │   │   ├── 规则：QT接受后3个工作日内应发SC并推动签署
    │   │   └── 超时动作：进入待签约风险清单
    │   ├── 定金时限
    │   │   ├── 规则：SC签署后按约定周期收定金
    │   │   └── 超时动作：提醒Sales_Rep + Finance
    │   └── PR发起时限
    │       ├── 规则：SC生效后1个工作日内应发起PR
    │       └── 超时动作：进入已生效未发起PR清单
    ├── PR / CG节点组
    │   ├── PR校验时限
    │   │   ├── 规则：PR发起后24小时内完成校验或回退补充
    │   │   └── 超时动作：提醒采购员/采购主管
    │   ├── 供应商分配时限
    │   │   ├── 规则：PR校验期内完成供应商拆分与分配
    │   │   └── 超时动作：进入供应商未分配清单
    │   ├── CG提交审批时限
    │   │   ├── 规则：PR完成后24小时内应生成并提交CG
    │   │   └── 超时动作：提醒采购员
    │   ├── CG审批时限
    │   │   ├── 规则：常规CG建议24小时内审批完成
    │   │   └── 超时动作：进入待审批超时清单
    │   └── 下单时限
    │       ├── 规则：CG审批通过后24小时内正式下单
    │       └── 超时动作：进入已审未下单清单
    ├── QC节点
    │   ├── 排期时限
    │   │   ├── 规则：生产接近完成前应提前锁定验货时间
    │   │   └── 超时动作：进入待排期清单
    │   ├── 报告时限
    │   │   ├── 规则：验货完成后24小时内出正式结论或报告
    │   │   └── 超时动作：提醒QC与跟单
    │   ├── 整改时限
    │   │   ├── 规则：整改问题应按约定周期关闭
    │   │   └── 超时动作：升级采购/主管
    │   └── 放行时限
    │       ├── 规则：出货前必须完成放行判断
    │       └── 超时动作：阻止Shipment前进
    ├── Shipment / Docs节点组
    │   ├── 订舱时限
    │   │   ├── 规则：按计划发运日前完成订舱
    │   │   └── 超时动作：进入出运风险清单
    │   ├── 装柜时限
    │   │   ├── 规则：按计划装柜日执行
    │   │   └── 超时动作：提醒跟单与仓储
    │   ├── 报关资料时限
    │   │   ├── 规则：开船前关键资料必须齐套
    │   │   └── 超时动作：Docs阻断放行
    │   ├── 单证齐套时限
    │   │   ├── 规则：出运后按节点归集关键文档
    │   │   └── 超时动作：提醒单证员与财务
    │   └── 到港确认时限
    │       ├── 规则：ETA附近应及时更新到港状态
    │       └── 超时动作：提醒Sales_Rep回访
    ├── Payment节点
    │   ├── 定金时限
    │   │   ├── 规则：按SC条款执行
    │   │   └── 超时动作：销售+财务催收
    │   ├── 尾款时限
    │   │   ├── 规则：按出货/到港/交单节点计算
    │   │   └── 超时动作：进入超账期清单
    │   ├── 票据补齐时限
    │   │   ├── 规则：收款后应及时归集水单和票据
    │   │   └── 超时动作：Docs/Finance协同提醒
    │   └── 利润确认时限
    │       ├── 规则：主要资金闭环后应尽快形成利润结论
    │       └── 超时动作：CFO可见
    └── Feedback / Repeat节点组
        ├── 回访时限
        │   ├── 规则：签收后7天内完成首次回访
        │   └── 超时动作：进入待回访清单
        ├── 问题关闭时限
        │   ├── 规则：问题应按严重度设关闭期限
        │   └── 超时动作：升级相关责任节点
        ├── 复购触发时限
        │   ├── 规则：按客户复购周期提前触发提醒
        │   └── 超时动作：进入复购机会流失清单
        └── 沉睡判定时限
            ├── 规则：超过设定周期无成交无有效互动
            └── 超时动作：转入沉睡客户池
```

---

## 15. Demo V5 对照增补树

```text
Demo V5 对照增补
└── 与当前总挂接树对照
    ├── A. 已覆盖主干
    │   ├── 销售前段主链
    │   │   ├── ING
    │   │   ├── QR
    │   │   ├── XJ
    │   │   ├── BJ
    │   │   ├── QT
    │   │   └── SC
    │   ├── 采购履约主链
    │   │   ├── PR
    │   │   ├── CG
    │   │   ├── QC
    │   │   └── Shipment / Docs / Payment
    │   ├── 后段闭环主链
    │   │   ├── Feedback
    │   │   └── Repeat
    │   └── 经营角色主干
    │       ├── Sales_Director
    │       ├── Regional_Manager
    │       ├── Sales_Rep
    │       ├── Procurement
    │       ├── QC
    │       ├── Documentation_Officer
    │       └── Finance
    ├── B. Demo 已体现、当前树仅部分覆盖
    │   ├── 双审批链
    │   │   ├── QT 一审：Regional_Manager
    │   │   ├── QT 二审：Sales_Director
    │   │   ├── SC 一审：Regional_Manager
    │   │   └── SC 二审：Sales_Director
    │   ├── 自动财务节点
    │   │   ├── SC 生效后自动生成 AR
    │   │   ├── 客户上传定金水单
    │   │   ├── 财务在应收模块看到客户水单
    │   │   └── 核销后前台状态自动变化
    │   ├── 采购付款审批链
    │   │   ├── 采购定金付款申请
    │   │   ├── Finance_Director 审批
    │   │   ├── 供应商定金支付
    │   │   └── 供应商尾款支付
    │   ├── 产前样 / 封样链
    │   │   ├── 供应商打样
    │   │   ├── 业务侧确认样品
    │   │   └── 封样后再量产
    │   ├── 验货前置链
    │   │   ├── 供应商上传自检/质检报告
    │   │   ├── QC 先看报告
    │   │   ├── 再排正式验货
    │   │   └── 验货报告回流业务与客户
    │   ├── 订舱决策链
    │   │   ├── 先确认贸易条款/订舱方式（FOB/CIF）
    │   │   ├── 再判断是否需要商检
    │   │   ├── 再询海运费
    │   │   └── 客户确认运费后再正式订舱
    │   └── 到港清关后段链
    │       ├── 客户安排目的港报关行
    │       ├── 补充清关单证
    │       ├── 目的港海关放行
    │       ├── 客户提柜运输
    │       ├── 开柜验货
    │       └── 正式验收确认
    ├── C. Demo 明显比当前树更细的外部参与方
    │   ├── Supplier（供应商）
    │   ├── Inspection Agency（商检机构）
    │   ├── Forwarder（货代）
    │   ├── Truck Company（拖车公司）
    │   ├── Truck Driver（拖车司机）
    │   ├── Customs Broker（报关行）
    │   ├── Customs（海关）
    │   └── Customer 端清关参与方
    ├── D. 当前总挂接树建议增补的细枝
    │   ├── 审批细枝
    │   │   ├── QT审批树
    │   │   │   ├── 常规QT是否免二审
    │   │   │   ├── 大额QT二审阈值
    │   │   │   ├── 特价QT审批
    │   │   │   └── 特殊付款条款审批
    │   │   └── SC审批树
    │   │       ├── 区域主管一审
    │   │       ├── 销售总监二审
    │   │       ├── 大额合同阈值
    │   │       └── 例外条款审批
    │   ├── 自动节点细枝
    │   │   ├── SC生效 -> 自动生成AR
    │   │   ├── 客户上传水单 -> Finance可见
    │   │   ├── Finance核销 -> 客户Portal状态变更
    │   │   └── 回款完成 -> 可触发下游付款
    │   ├── 产前样细枝
    │   │   ├── 样品制作
    │   │   ├── 样品确认
    │   │   ├── 封样
    │   │   └── 批量生产放行
    │   ├── 订舱前决策细枝
    │   │   ├── 贸易条款确认
    │   │   ├── 商检需求判断
    │   │   ├── 运费询价
    │   │   ├── 客户确认运费
    │   │   └── 正式订舱
    │   ├── 外部执行细枝
    │   │   ├── 货代确认船期
    │   │   ├── 拖车到厂装柜
    │   │   ├── 报关行申报
    │   │   ├── 海关放行
    │   │   └── 船公司/货代回传在途信息
    │   ├── API细枝
    │   │   ├── 船期API接入
    │   │   ├── 自动更新ETA/ETD
    │   │   ├── 自动推送异常给销售
    │   │   └── 自动推送异常给客户
    │   ├── 开票归档细枝
    │   │   ├── 业务员申请开票
    │   │   ├── 财务开票
    │   │   ├── 订单归档
    │   │   └── 归档编号规则
    │   └── 目的港清关验收细枝
    │       ├── 到港通知
    │       ├── 客户清关
    │       ├── 补充清关单证
    │       ├── 海关放行
    │       ├── 提柜到仓
    │       ├── 开柜验货
    │       ├── 验收确认
    │       └── 市场销售反馈
    ├── E. 当前系统与 Demo 的本质区别
    │   ├── 当前系统
    │   │   ├── 已具备真实ERP主骨架
    │   │   ├── 已有真实角色、页面、节点、数据承接
    │   │   └── 更适合做正式业务主线
    │   ├── Demo V5
    │   │   ├── 是培训/展示型泳道图
    │   │   ├── 颗粒度更细
    │   │   ├── 外部参与方更多
    │   │   └── 事件/通知表达更丰富
    │   └── 结论
    │       ├── 总挂接树不需要照搬 Demo
    │       ├── 但应吸收 Demo 中更细的执行枝条
    │       └── 尤其要补“审批、自动节点、外部参与方、订舱清关后段、开票归档、API追踪”
    └── F. 对照后的增补优先级
        ├── 第一优先级
        │   ├── QT/SC双审批树
        │   ├── AR自动生成与客户水单上传树
        │   ├── 产前样/封样树
        │   └── 订舱前决策树
        ├── 第二优先级
        │   ├── 外部参与方树
        │   ├── 拖车/报关行/海关执行树
        │   ├── 开票归档树
        │   └── 目的港清关验收树
        └── 第三优先级
            ├── API物流追踪树
            ├── 自动通知树
            └── 事件推送树
```

---

## 16. 当前定稿结论

本次定稿确认以下原则：

1. 系统只有一条总经营主线，不再按角色零散建设。
2. 角色必须挂在业务主线节点上，明确上承、下交、横向协同。
3. 页面和模块必须挂在角色责任域下，不再脱离责任独立生长。
4. 所有节点都必须具备动作、提醒、统计三类基础能力。
5. 后续新增或删减功能，统一在本树状总稿上修订，不再单点补丁式扩展。

---

## 17. 后续修订方式

后续讨论统一使用以下方式：

- `新增某枝`：新增一个角色树、节点树、模块树
- `删减某枝`：删除某个角色、节点、模块或统计枝条
- `重排某枝`：调整某角色、模块在树上的挂接位置
- `细化某枝`：继续向下钻字段、表单、提醒、统计、AI

本稿版本号：`V1`

---

## 18. 总挂接树后续增补总目录（全补目标）

```text
总挂接树后续增补总目录
└── 目标：把当前定稿从“主骨架完成”推进到“全链路可落地总纲”
    ├── A. 已完成主枝
    │   ├── 顶层目标树
    │   ├── 经营总主线树
    │   ├── 客户经营模型树
    │   ├── 角色责任树
    │   ├── 页面模块挂接树
    │   ├── 核心节点树
    │   │   ├── ING
    │   │   ├── QR
    │   │   ├── XJ
    │   │   ├── BJ
    │   │   ├── QT
    │   │   ├── SC
    │   │   ├── PR
    │   │   ├── CG
    │   │   ├── QC
    │   │   ├── Shipment
    │   │   ├── Docs
    │   │   ├── Payment
    │   │   ├── Feedback
    │   │   └── Repeat
    │   ├── PR/CG 双节点细化树
    │   ├── 经营口径树
    │   ├── 节点时限规则树
    │   └── Demo V5 对照增补树
    ├── B. 第一批必补枝
    │   ├── 1. 审批治理枝
    │   │   ├── QT审批树
    │   │   │   ├── 常规QT审批
    │   │   │   ├── 大额QT双审批
    │   │   │   ├── 特价审批
    │   │   │   ├── 特殊付款条款审批
    │   │   │   └── 驳回回流树
    │   │   ├── SC审批树
    │   │   │   ├── 区域主管一审
    │   │   │   ├── 销售总监二审
    │   │   │   ├── 大额合同阈值
    │   │   │   ├── 例外条款审批
    │   │   │   └── 驳回回流树
    │   │   ├── CG审批树
    │   │   │   ├── 常规CG审批
    │   │   │   ├── 大额采购审批
    │   │   │   ├── 特殊供应商审批
    │   │   │   ├── 特殊付款条件审批
    │   │   │   └── 驳回回流PR/CG树
    │   │   └── Finance付款审批树
    │   │       ├── 供应商定金付款审批
    │   │       ├── 供应商尾款付款审批
    │   │       ├── 大额付款审批
    │   │       └── 财务总监审批树
    │   ├── 2. 自动化联动枝
    │   │   ├── SC生效 -> 自动生成AR树
    │   │   ├── 客户上传定金水单树
    │   │   ├── Finance核销 -> Portal状态同步树
    │   │   ├── Payment完成 -> 下游放行树
    │   │   └── 事件驱动状态同步树
    │   ├── 3. 产前样与封样枝
    │   │   ├── 打样树
    │   │   ├── 样品上传树
    │   │   ├── 样品确认树
    │   │   ├── 封样树
    │   │   └── 封样后放量产树
    │   ├── 4. 订舱前决策枝
    │   │   ├── 贸易术语确认树
    │   │   ├── 是否需商检判断树
    │   │   ├── 海运费询价树
    │   │   ├── 客户确认运费树
    │   │   └── 正式订舱树
    │   ├── 5. 外部参与方枝
    │   │   ├── Supplier树
    │   │   ├── Inspection Agency树
    │   │   ├── Forwarder树
    │   │   ├── Truck Company / Driver树
    │   │   ├── Customs Broker树
    │   │   └── Customs树
    │   ├── 6. 目的港清关验收枝
    │   │   ├── 到港通知树
    │   │   ├── 客户清关安排树
    │   │   ├── 补充清关单证树
    │   │   ├── 目的港海关放行树
    │   │   ├── 提柜运输树
    │   │   ├── 开柜验货树
    │   │   ├── 正式验收树
    │   │   └── 市场销售反馈树
    │   └── 7. 开票归档枝
    │       ├── 业务员申请开票树
    │       ├── 财务开票树
    │       ├── 开票编号树
    │       ├── 归档资料树
    │       └── 归档编号树
    ├── C. 第二批强烈建议补枝
    │   ├── 1. 异常升级枝
    │   │   ├── 销售异常树
    │   │   ├── 采购异常树
    │   │   ├── 质量异常树
    │   │   ├── 出运异常树
    │   │   ├── 单证异常树
    │   │   ├── 财务异常树
    │   │   └── 升级路径树
    │   ├── 2. 事件通知枝
    │   │   ├── 系统自动通知树
    │   │   ├── 角色间通知树
    │   │   ├── Portal通知树
    │   │   ├── 邮件/WhatsApp通知树
    │   │   └── 关键异常推送树
    │   ├── 3. 字段来源与回写枝
    │   │   ├── owner_* 字段树
    │   │   ├── next_follow_up_at 字段树
    │   │   ├── payment_proof 字段树
    │   │   ├── clearance_status 字段树
    │   │   ├── archive_no 字段树
    │   │   └── 字段来源-展示-回写树
    │   ├── 4. 外部单据枝
    │   │   ├── AR树
    │   │   ├── CI树
    │   │   ├── PL树
    │   │   ├── BL树
    │   │   ├── CD树
    │   │   ├── CO树
    │   │   └── 水单/票据树
    │   ├── 5. 三端联动枝
    │   │   ├── 内部ERP端
    │   │   ├── Customer Portal端
    │   │   ├── Supplier Portal端
    │   │   └── 三端状态同步树
    │   └── 6. 权限与审计枝
    │       ├── 角色权限树
    │       ├── 节点可见性树
    │       ├── 审批权限树
    │       ├── 编辑权限树
    │       └── 审计日志树
    ├── D. 第三批进阶优化枝
    │   ├── 1. API物流追踪枝
    │   │   ├── 船公司API接入树
    │   │   ├── ETA/ETD自动更新树
    │   │   ├── 在途异常自动识别树
    │   │   └── 自动通知客户/销售树
    │   ├── 2. AI经营辅助枝
    │   │   ├── 客户摘要树
    │   │   ├── 下一步动作建议树
    │   │   ├── 报价谈判建议树
    │   │   ├── 催款建议树
    │   │   ├── 周报/月报树
    │   │   └── 团队异常诊断树
    │   ├── 3. KPI与口径深化枝
    │   │   ├── 漏斗KPI树
    │   │   ├── 效率KPI树
    │   │   ├── 利润KPI树
    │   │   ├── 客户生命周期KPI树
    │   │   └── service_to_trade KPI树
    │   ├── 4. 国家与贸易差异枝
    │   │   ├── 北美清关差异树
    │   │   ├── 南美清关差异树
    │   │   ├── 欧非清关差异树
    │   │   ├── 贸易术语差异树
    │   │   └── 单证差异树
    │   └── 5. 客户模型专属枝
    │       ├── trade 专属细枝
    │       ├── agency 专属细枝
    │       ├── project 专属细枝
    │       └── service_to_trade 专属细枝
    ├── E. 页面落地补枝
    │   ├── 1. 区域主管页面布局树
    │   ├── 2. 业务员页面布局树
    │   ├── 3. 采购主管/采购员页面布局树
    │   ├── 4. 跟单员页面布局树
    │   ├── 5. 单证员页面布局树
    │   ├── 6. 财务/CFO页面布局树
    │   └── 7. Customer Portal / Supplier Portal 页面布局树
    └── F. 落地顺序树
        ├── 第一阶段：把主链审批、自动化、样品、订舱、清关后段补齐
        ├── 第二阶段：把异常、通知、字段回写、权限审计补齐
        ├── 第三阶段：把API、AI、KPI、国家差异、客户模型专属枝补齐
        └── 第四阶段：按角色页面布局树逐页落地
```

---

## 19. 审批治理枝（一）：QT / SC 双审批树

```text
QT / SC 双审批治理
└── 目标：让报价与合同在关键风险点被正确审核，而不是所有单据一刀切审批
    ├── A. QT审批树
    │   ├── 节点定位
    │   │   ├── 所属主链：报价转化段
    │   │   ├── 上承：QR / BJ 成本结论
    │   │   ├── 下交：客户接收QT / SC
    │   │   └── 目标：在正式发给客户前完成价格、利润、条款风险把控
    │   ├── 审批触发树
    │   │   ├── 常规QT
    │   │   │   ├── 条件：金额低于区域阈值
    │   │   │   ├── 条件：利润率高于底线
    │   │   │   ├── 条件：付款条款标准
    │   │   │   └── 动作：可免二审或仅主管审批
    │   │   ├── 大额QT
    │   │   │   ├── 条件：金额达到二审阈值
    │   │   │   ├── 动作：Regional_Manager 一审
    │   │   │   └── 动作：Sales_Director 二审
    │   │   ├── 特价QT
    │   │   │   ├── 条件：低于正常利润率/低于价格底线
    │   │   │   ├── 动作：强制进入审批
    │   │   │   └── 动作：记录特价原因
    │   │   ├── 特殊付款条款QT
    │   │   │   ├── 条件：账期拉长 / 非标付款节奏
    │   │   │   ├── 动作：Regional_Manager 审核商业合理性
    │   │   │   └── 动作：必要时 Finance / Sales_Director 协同
    │   │   └── 战略客户QT
    │   │       ├── 条件：客户为重点/战略客户
    │   │       ├── 动作：主管必看
    │   │       └── 动作：大额时总监必看
    │   ├── 审批层级树
    │   │   ├── 一级：Regional_Manager
    │   │   │   ├── 审什么
    │   │   │   │   ├── 报价结构是否合理
    │   │   │   │   ├── 利润率是否达到区域底线
    │   │   │   │   ├── 客户历史是否匹配
    │   │   │   │   ├── 交期承诺是否现实
    │   │   │   │   └── 业务员是否已完成必要跟进
    │   │   │   ├── 决策结果
    │   │   │   │   ├── 通过
    │   │   │   │   ├── 退回修订
    │   │   │   │   └── 升级二审
    │   │   │   └── 输出
    │   │   │       ├── 可直接发送客户
    │   │   │       └── 提交 Sales_Director
    │   │   └── 二级：Sales_Director
    │   │       ├── 审什么
    │   │       │   ├── 大额金额风险
    │   │       │   ├── 战略客户重要性
    │   │       │   ├── 特价合理性
    │   │       │   ├── 条款例外风险
    │   │       │   └── 区域资源是否需要倾斜
    │   │       ├── 决策结果
    │   │       │   ├── 通过
    │   │       │   ├── 退回修订
    │   │       │   └── 暂缓
    │   │       └── 输出
    │   │           ├── 可发送客户
    │   │           └── 回流业务员修订
    │   ├── 状态树
    │   │   ├── QT草稿
    │   │   ├── 待主管审批
    │   │   ├── 主管已通过
    │   │   ├── 待总监审批
    │   │   ├── 总监已通过
    │   │   ├── 审批驳回
    │   │   ├── 待修订
    │   │   └── 可发送客户
    │   ├── 字段树
    │   │   ├── 报价金额
    │   │   ├── 成本金额
    │   │   ├── 毛利率
    │   │   ├── 特价标记
    │   │   ├── 特价原因
    │   │   ├── 付款条款
    │   │   ├── 交货期
    │   │   ├── 客户等级
    │   │   ├── 审批状态
    │   │   ├── 一审人/时间/意见
    │   │   └── 二审人/时间/意见
    │   ├── 动作树
    │   │   ├── 提交主管审批
    │   │   ├── 主管通过
    │   │   ├── 主管驳回
    │   │   ├── 提交总监审批
    │   │   ├── 总监通过
    │   │   ├── 总监驳回
    │   │   ├── 修订后重提
    │   │   └── 审批通过后发送客户
    │   ├── 提醒树
    │   │   ├── 待主管审批超时
    │   │   ├── 待总监审批超时
    │   │   ├── 被驳回待修订超时
    │   │   ├── 大额QT未进入二审
    │   │   └── 特价QT未审批禁止发送
    │   ├── 统计树
    │   │   ├── QT审批通过率
    │   │   ├── QT驳回率
    │   │   ├── 平均一审时长
    │   │   ├── 平均二审时长
    │   │   ├── 特价QT占比
    │   │   └── 审批后成交率
    │   └── 回流树
    │       ├── 主管驳回 -> Sales_Rep 修订QT
    │       ├── 总监驳回 -> Sales_Rep / Regional_Manager 复核后重提
    │       ├── 条款异常 -> Finance 参与协商
    │       └── 成本基础有问题 -> 回流 QR / BJ
    └── B. SC审批树
        ├── 节点定位
        │   ├── 所属主链：报价转化段终点 / 履约起点
        │   ├── 上承：QT已接受
        │   ├── 下交：SC签署生效 -> PR
        │   └── 目标：在正式形成合同承诺前完成金额、条款、履约和收款风险把控
        ├── 审批触发树
        │   ├── 常规SC
        │   │   ├── 条件：金额低于区域阈值
        │   │   ├── 条件：合同模板标准
        │   │   ├── 条件：付款条款标准
        │   │   └── 动作：主管审批即可生效
        │   ├── 大额SC
        │   │   ├── 条件：金额达到总监阈值
        │   │   ├── 动作：Regional_Manager 一审
        │   │   └── 动作：Sales_Director 二审
        │   ├── 例外条款SC
        │   │   ├── 条件：违约责任、交货责任、赔偿、账期等非标
        │   │   ├── 动作：强制进入二审
        │   │   └── 动作：必要时 Finance 协同
        │   └── 战略客户SC
        │       ├── 条件：战略/重点客户
        │       ├── 动作：主管必审
        │       └── 动作：必要时总监复核
        ├── 审批层级树
        │   ├── 一级：Regional_Manager
        │   │   ├── 审什么
        │   │   │   ├── 合同金额与QT是否一致
        │   │   │   ├── 交期承诺是否可履约
        │   │   │   ├── 定金比例是否合理
        │   │   │   ├── 付款条款风险
        │   │   │   └── 客户信用是否可接受
        │   │   ├── 决策结果
        │   │   │   ├── 通过
        │   │   │   ├── 退回修订
        │   │   │   └── 升级总监
        │   │   └── 输出
        │   │       ├── 可发客户签署
        │   │       └── 进入二审
        │   └── 二级：Sales_Director
        │       ├── 审什么
        │       │   ├── 大额订单风险
        │       │   ├── 战略客户影响
        │       │   ├── 履约资源是否匹配
        │       │   ├── 例外条款是否可接受
        │       │   └── 是否需CEO/CFO知情
        │       ├── 决策结果
        │       │   ├── 通过
        │       │   ├── 退回修订
        │       │   └── 暂缓
        │       └── 输出
        │           ├── 允许客户签署
        │           └── 回流业务员/主管
        ├── 状态树
        │   ├── SC草稿
        │   ├── 待主管审批
        │   ├── 主管已通过
        │   ├── 待总监审批
        │   ├── 总监已通过
        │   ├── 审批驳回
        │   ├── 待客户签署
        │   ├── 已签署待生效
        │   └── 已生效
        ├── 字段树
        │   ├── 合同金额
        │   ├── 定金比例
        │   ├── 尾款条件
        │   ├── 交货期
        │   ├── 交货条款
        │   ├── 违约责任
        │   ├── 客户信用等级
        │   ├── 审批状态
        │   ├── 一审人/时间/意见
        │   └── 二审人/时间/意见
        ├── 动作树
        │   ├── 提交主管审批
        │   ├── 主管通过
        │   ├── 主管驳回
        │   ├── 提交总监审批
        │   ├── 总监通过
        │   ├── 总监驳回
        │   ├── 修订后重提
        │   ├── 审批通过后发送客户签署
        │   └── 签署后触发生效判断
        ├── 提醒树
        │   ├── 待主管审批超时
        │   ├── 待总监审批超时
        │   ├── 被驳回待修订超时
        │   ├── 大额SC未二审
        │   ├── 已审通过未发客户签署
        │   └── 已签署待定金
        ├── 统计树
        │   ├── SC审批通过率
        │   ├── SC驳回率
        │   ├── 平均一审时长
        │   ├── 平均二审时长
        │   ├── 例外条款合同占比
        │   └── 审批后生效率
        └── 回流树
            ├── 主管驳回 -> Sales_Rep 修订SC
            ├── 总监驳回 -> Sales_Rep / Regional_Manager 复核后重提
            ├── 条款不可接受 -> 回流 QT / Finance 协商
            └── 客户签约前改需求 -> 回流 QT 或客户协商节点
```

---

## 20. 自动化联动枝（一）：SC -> AR -> 客户水单 -> 财务核销 -> Portal状态同步树

```text
SC 到 AR 到收款联动
└── 目标：把“合同生效、应收生成、客户上传水单、财务核销、前台状态变化”串成自动闭环
    ├── A. SC生效触发树
    │   ├── 节点定位
    │   │   ├── 所属主链：销售转化段终点 / 财务回款段起点
    │   │   ├── 上承：SC 已签署并满足生效条件
    │   │   └── 下交：AR 自动生成
    │   ├── 生效条件树
    │   │   ├── 合同已签署
    │   │   ├── 审批已完成
    │   │   ├── 客户签章完整
    │   │   └── 金额与条款冻结
    │   ├── 自动触发动作
    │   │   ├── 生成 AR 应收账款
    │   │   ├── 生成应收拆分
    │   │   │   ├── 定金应收
    │   │   │   └── 尾款应收
    │   │   ├── 更新 Sales_Rep 订单状态
    │   │   ├── 更新 Finance 待收款视图
    │   │   └── 更新 Customer Portal 为“等待定金”
    │   ├── 责任角色
    │   │   ├── 触发源：Sales_Rep / 系统
    │   │   ├── 承接人：Finance
    │   │   ├── 监督人：CFO / Regional_Manager
    │   │   └── 同步对象：Customer Portal / Sales_Rep
    │   └── 输出结果
    │       ├── AR编号
    │       ├── AR主状态
    │       ├── 定金待收状态
    │       └── 尾款等待状态
    ├── B. AR自动生成树
    │   ├── 节点定位
    │   │   ├── 所属主链：财务回款段入口
    │   │   ├── 上承：SC 生效
    │   │   └── 下交：客户支付定金 / 财务确认
    │   ├── AR字段树
    │   │   ├── AR编号
    │   │   ├── 来源SC编号
    │   │   ├── 客户名称
    │   │   ├── 合同金额
    │   │   ├── 定金比例
    │   │   ├── 定金金额
    │   │   ├── 尾款金额
    │   │   ├── 应收到期日
    │   │   ├── 当前收款状态
    │   │   └── 客户信用等级
    │   ├── AR状态树
    │   │   ├── 已生成
    │   │   ├── 等待定金
    │   │   ├── 定金已上传水单
    │   │   ├── 定金已到账
    │   │   ├── 等待尾款
    │   │   ├── 尾款已上传水单
    │   │   ├── 尾款已到账
    │   │   └── 应收关闭
    │   ├── 自动动作树
    │   │   ├── 自动写入应收台账
    │   │   ├── 自动生成待收提醒
    │   │   ├── 自动显示在 Finance 工作台
    │   │   └── 自动显示在 Sales_Rep 订单状态
    │   └── 页面挂接
    │       ├── Finance：收款管理中心
    │       ├── CFO：应收应付控制中心
    │       ├── Sales_Rep：我的订单状态
    │       └── Customer Portal：付款状态视图
    ├── C. 客户上传定金水单树
    │   ├── 节点定位
    │   │   ├── 所属主链：Payment 子节点
    │   │   ├── 上承：Customer Portal 显示“等待定金”
    │   │   └── 下交：Finance 核对到账
    │   ├── 责任角色
    │   │   ├── 执行人：Customer
    │   │   ├── 承接人：Finance
    │   │   └── 可见人：Sales_Rep / Regional_Manager
    │   ├── 客户动作树
    │   │   ├── 查看应收信息
    │   │   ├── 支付定金
    │   │   ├── 上传水单/付款凭证
    │   │   └── 提交付款说明
    │   ├── 水单字段树
    │   │   ├── 上传时间
    │   │   ├── 上传人
    │   │   ├── 金额
    │   │   ├── 币种
    │   │   ├── 银行信息
    │   │   ├── 附件URL/文件
    │   │   └── 备注
    │   ├── Portal状态树
    │   │   ├── 等待定金
    │   │   ├── 已上传水单
    │   │   ├── 等待财务确认
    │   │   └── 定金收到
    │   ├── 自动动作树
    │   │   ├── Finance 工作台出现“客户已上传水单”
    │   │   ├── Sales_Rep 收到付款通知
    │   │   ├── AR状态切换为“定金待确认”
    │   │   └── 生成水单核对任务
    │   └── 提醒树
    │       ├── 客户上传后通知 Finance
    │       ├── 客户上传后通知 Sales_Rep
    │       └── Finance 超时未核对提醒
    ├── D. 财务核销树
    │   ├── 节点定位
    │   │   ├── 所属主链：Payment 核心动作节点
    │   │   ├── 上承：客户上传水单
    │   │   └── 下交：Portal 状态更新 / 下游采购放行
    │   ├── 责任角色
    │   │   ├── 执行人：Finance
    │   │   ├── 监督人：CFO
    │   │   └── 同步人：Sales_Rep / Regional_Manager
    │   ├── 财务动作树
    │   │   ├── 查看客户上传水单
    │   │   ├── 核对银行到账
    │   │   ├── 核销定金
    │   │   ├── 上传收款凭证
    │   │   ├── 更新 AR 状态
    │   │   └── 关闭本次定金待收任务
    │   ├── 财务状态树
    │   │   ├── 待核对
    │   │   ├── 核对中
    │   │   ├── 已到账
    │   │   ├── 已核销
    │   │   ├── 差异待处理
    │   │   └── 驳回客户凭证
    │   ├── 差异处理树
    │   │   ├── 金额不一致
    │   │   ├── 币种不一致
    │   │   ├── 银行未到账
    │   │   ├── 凭证不清晰
    │   │   └── 需要客户补传
    │   ├── 输出动作树
    │   │   ├── AR状态变更为“定金已到账”
    │   │   ├── Customer Portal 变更为“定金收到”
    │   │   ├── Sales_Rep 状态变更为“可启动采购”
    │   │   └── 触发 PR 发起准备
    │   ├── 提醒树
    │   │   ├── 水单已上传待核对
    │   │   ├── 核对超时
    │   │   ├── 差异待处理
    │   │   └── 已到账未更新状态
    │   └── 统计树
    │       ├── 定金核销时长
    │       ├── 定金到账率
    │       ├── 水单差异率
    │       └── 核销完成率
    ├── E. Portal状态同步树
    │   ├── Customer Portal状态树
    │   │   ├── 等待定金
    │   │   ├── 已上传水单
    │   │   ├── 财务确认中
    │   │   ├── 定金收到
    │   │   ├── 等待尾款
    │   │   ├── 已上传尾款水单
    │   │   ├── 尾款确认中
    │   │   └── 已完成付款
    │   ├── Sales_Rep状态树
    │   │   ├── 客户确认订单等待付定金
    │   │   ├── 客户已上传定金水单
    │   │   ├── Finance核对中
    │   │   ├── 定金已到账可启动采购
    │   │   └── 等待尾款 / 尾款已到账
    │   ├── Finance状态树
    │   │   ├── 待收定金
    │   │   ├── 已上传待核对
    │   │   ├── 已到账待核销
    │   │   ├── 已核销
    │   │   └── 已关闭
    │   └── 同步规则树
    │       ├── Customer 上传水单 -> Finance / Sales_Rep 同步
    │       ├── Finance 核销 -> Customer Portal / Sales_Rep 同步
    │       ├── 尾款上传/核销 -> 同步重复执行
    │       └── 任一状态失败 -> 进入异常回流
    ├── F. 尾款镜像联动树
    │   ├── 逻辑：尾款流程复用定金联动机制
    │   ├── 差异一：触发条件改为发货/验货/到港后
    │   ├── 差异二：可能需要交单/放单前置条件
    │   ├── 差异三：尾款到账后可触发供应商尾款支付
    │   └── 差异四：尾款到账后更接近财务关闭
    ├── G. 异常回流树
    │   ├── AR生成失败 -> 回流 Finance / System 管理
    │   ├── 客户水单上传失败 -> 回流 Customer Portal / Sales_Rep
    │   ├── Finance核对失败 -> 回流 Customer 补传
    │   ├── Portal状态未同步 -> 回流系统事件补偿
    │   └── 定金未到账超时 -> 回流 Sales_Rep 催款 / Regional_Manager 介入
    └── H. 统计与管理树
        ├── AR自动生成成功率
        ├── 定金上传率
        ├── Finance核销时长
        ├── Portal状态同步成功率
        ├── 定金到账率
        ├── 尾款到账率
        └── 从SC生效到PR启动的平均时长
```

---

## 21. 产前样与封样枝

```text
产前样与封样
└── 目标：在批量生产前，把“样品正确、标准冻结、责任清晰”锁死，降低量产质量风险
    ├── A. 节点定位树
    │   ├── 所属主链：采购履约段 -> 生产与质控段之间的前置质量节点
    │   ├── 上承：CG 已生效 / 供应商已确认接单
    │   ├── 下交：批量生产启动
    │   └── 节点作用
    │       ├── 把客户确认要求转成样品实体
    │       ├── 把样品确认结果转成量产标准
    │       └── 把“可量产”与“不可量产”边界明确
    ├── B. 打样树
    │   ├── 责任角色
    │   │   ├── 执行人：Supplier
    │   │   ├── 协同人：Procurement
    │   │   ├── 协同人：Sales_Rep
    │   │   └── 监督人：Procurement_Manager / Regional_Manager
    │   ├── 打样输入树
    │   │   ├── 来源SC要求
    │   │   ├── 来源CG要求
    │   │   ├── 产品规格
    │   │   ├── 材质/颜色/包装
    │   │   ├── 客户图纸/图片
    │   │   └── 特殊质量要求
    │   ├── 打样状态树
    │   │   ├── 待打样
    │   │   ├── 打样中
    │   │   ├── 样品已完成
    │   │   ├── 样品已上传
    │   │   ├── 待确认
    │   │   └── 打样异常
    │   ├── 打样字段树
    │   │   ├── 样品编号
    │   │   ├── 对应CG编号
    │   │   ├── 样品数量
    │   │   ├── 样品完成日期
    │   │   ├── 样品图片
    │   │   ├── 样品说明
    │   │   ├── 样品版本
    │   │   └── 是否需重打样
    │   ├── 打样动作树
    │   │   ├── 发起打样
    │   │   ├── 上传样品图片/说明
    │   │   ├── 确认样品完成
    │   │   ├── 退回重打样
    │   │   └── 进入样品确认
    │   ├── 提醒树
    │   │   ├── 待打样超时
    │   │   ├── 样品未上传
    │   │   ├── 样品待确认超时
    │   │   └── 样品多次重做提醒
    │   └── 统计树
    │       ├── 打样完成率
    │       ├── 打样周期
    │       ├── 重打样率
    │       └── 打样异常率
    ├── C. 样品确认树
    │   ├── 责任角色
    │   │   ├── 主执行：Sales_Rep
    │   │   ├── 供应链确认：Procurement
    │   │   ├── 必要时质量确认：QC
    │   │   └── 监督：Regional_Manager
    │   ├── 确认对象树
    │   │   ├── 外观
    │   │   ├── 规格
    │   │   ├── 材质
    │   │   ├── 功能
    │   │   ├── 包装
    │   │   └── 客户特殊要求
    │   ├── 确认状态树
    │   │   ├── 待业务确认
    │   │   ├── 待客户确认
    │   │   ├── 已确认
    │   │   ├── 需修改
    │   │   └── 已拒绝
    │   ├── 确认字段树
    │   │   ├── 样品检查结论
    │   │   ├── 客户确认方式
    │   │   ├── 客户确认时间
    │   │   ├── 修改意见
    │   │   ├── 是否通过
    │   │   └── 是否允许封样
    │   ├── 确认动作树
    │   │   ├── 业务检查样品
    │   │   ├── 发客户确认
    │   │   ├── 记录客户意见
    │   │   ├── 通过确认
    │   │   └── 退回重做
    │   ├── 提醒树
    │   │   ├── 样品待业务确认超时
    │   │   ├── 样品待客户确认超时
    │   │   ├── 客户提出修改未闭环
    │   │   └── 样品确认后未封样
    │   └── 统计树
    │       ├── 样品确认通过率
    │       ├── 客户确认时长
    │       ├── 修改轮次
    │       └── 客户拒样率
    ├── D. 封样树
    │   ├── 节点目标
    │   │   ├── 冻结量产标准
    │   │   ├── 固化供应商执行样
    │   │   └── 固化QC验货标准参考
    │   ├── 责任角色
    │   │   ├── 执行人：Supplier / Procurement
    │   │   ├── 确认人：Sales_Rep
    │   │   ├── 可见人：QC
    │   │   └── 监督人：Procurement_Manager
    │   ├── 封样状态树
    │   │   ├── 待封样
    │   │   ├── 已封样
    │   │   ├── 封样已上传
    │   │   ├── 封样已确认
    │   │   └── 封样失效
    │   ├── 封样字段树
    │   │   ├── 封样编号
    │   │   ├── 对应样品版本
    │   │   ├── 封样日期
    │   │   ├── 封样图片/文件
    │   │   ├── 封样确认人
    │   │   ├── 封样有效状态
    │   │   └── 关联QC标准
    │   ├── 封样动作树
    │   │   ├── 生成封样记录
    │   │   ├── 上传封样资料
    │   │   ├── 确认封样
    │   │   ├── 废弃封样
    │   │   └── 允许量产
    │   ├── 提醒树
    │   │   ├── 已确认样品待封样
    │   │   ├── 封样资料未上传
    │   │   ├── 封样后未启动量产
    │   │   └── 量产前无有效封样
    │   └── 统计树
    │       ├── 封样完成率
    │       ├── 封样时长
    │       ├── 封样失效率
    │       └── 封样后变更率
    ├── E. 封样后放量产树
    │   ├── 触发条件
    │   │   ├── 样品确认通过
    │   │   ├── 封样已完成
    │   │   ├── 封样资料可追溯
    │   │   └── 必要审批已完成
    │   ├── 系统动作
    │   │   ├── CG状态允许进入生产
    │   │   ├── Supplier 状态更新为“可量产”
    │   │   ├── QC 可见封样标准
    │   │   └── Order_Coordinator 时间轴进入生产段
    │   ├── 阻断规则
    │   │   ├── 样品未确认禁止量产
    │   │   ├── 无封样禁止量产
    │   │   ├── 封样失效禁止量产
    │   │   └── 重大修改未闭环禁止量产
    │   └── 输出
    │       ├── 生产启动
    │       ├── QC参考标准锁定
    │       └── 质量风险前移控制
    ├── F. 异常回流树
    │   ├── 样品不合格 -> 回流 Supplier 重打样
    │   ├── 客户不同意样品 -> 回流 Sales_Rep / Procurement 调整要求
    │   ├── 封样资料缺失 -> 回流 Procurement 补资料
    │   ├── 量产前样品版本变更 -> 回流重新确认 / 重新封样
    │   └── 供应商私自变更样品标准 -> 升级 Procurement_Manager / QC
    └── G. 统计与管理树
        ├── 打样周期
        ├── 样品确认时长
        ├── 重打样率
        ├── 封样完成率
        ├── 无封样量产拦截率
        └── 封样后质量异常关联率
```

---

## 22. 订舱前决策枝

```text
订舱前决策
└── 目标：在正式订舱前，把“谁负责订舱、是否需要商检、运费是否确认、资料是否齐备”先判断清楚
    ├── A. 节点定位树
    │   ├── 所属主链：尾款催收后段 -> Shipment 前置决策段
    │   ├── 上承：QC通过 / 尾款条件成熟 / 可准备发运
    │   ├── 下交：正式订舱 / 拖车装柜 / 报关准备
    │   └── 节点作用
    │       ├── 确认贸易术语对应的责任边界
    │       ├── 确认是否需要商检或特殊证书
    │       ├── 确认海运费与客户承担方式
    │       └── 确认满足正式订舱条件
    ├── B. 贸易术语确认树
    │   ├── 责任角色
    │   │   ├── 主执行：Sales_Rep
    │   │   ├── 客户确认：Customer
    │   │   ├── 监督人：Regional_Manager
    │   │   └── 协同人：Order_Coordinator / Forwarder
    │   ├── 术语分支树
    │   │   ├── FOB
    │   │   │   ├── 客户负责主运订舱
    │   │   │   ├── 我方负责出厂至装船前配合
    │   │   │   └── 运费不走我方报价确认
    │   │   ├── CIF
    │   │   │   ├── 我方负责主运订舱
    │   │   │   ├── 我方需询海运费
    │   │   │   └── 客户需确认运费/总价影响
    │   │   ├── EXW
    │   │   │   ├── 客户/客户代理负责提货
    │   │   │   └── 我方主要做出厂配合
    │   │   └── 其他术语
    │   │       ├── 按条款配置责任边界
    │   │       └── 进入特殊物流判断
    │   ├── 状态树
    │   │   ├── 待确认
    │   │   ├── 已询问客户
    │   │   ├── 客户已确认
    │   │   ├── 待内部判路
    │   │   └── 已锁定术语
    │   ├── 字段树
    │   │   ├── 贸易术语
    │   │   ├── 责任方
    │   │   ├── 客户确认时间
    │   │   ├── 对Shipment路径影响
    │   │   └── 对运费确认影响
    │   ├── 动作树
    │   │   ├── 询问客户订舱方式
    │   │   ├── 记录贸易术语
    │   │   ├── 锁定责任边界
    │   │   └── 下推到运费/订舱分支
    │   └── 提醒树
    │       ├── 贸易术语未确认禁止订舱
    │       ├── 术语已确认但责任边界未锁定
    │       └── CIF未进入运费询价
    ├── C. 是否需商检判断树
    │   ├── 责任角色
    │   │   ├── 主执行：Sales_Rep
    │   │   ├── 协同人：Documentation_Officer
    │   │   ├── 协同人：Inspection Agency
    │   │   └── 监督人：Order_Coordinator
    │   ├── 判断输入树
    │   │   ├── 产品类别
    │   │   ├── 出口国家要求
    │   │   ├── 客户要求
    │   │   ├── 监管要求
    │   │   └── 历史案例
    │   ├── 判断结果树
    │   │   ├── 不需要商检
    │   │   ├── 需要商检
    │   │   ├── 需要原产地证
    │   │   ├── 需要认证文件
    │   │   └── 需外部机构介入
    │   ├── 状态树
    │   │   ├── 待判断
    │   │   ├── 判断中
    │   │   ├── 已确认无需商检
    │   │   ├── 已确认需商检
    │   │   └── 商检资料准备中
    │   ├── 动作树
    │   │   ├── 检查产品监管要求
    │   │   ├── 记录商检需求
    │   │   ├── 对接商检机构
    │   │   └── 生成商检资料任务
    │   ├── 提醒树
    │   │   ├── 商检需求未判断
    │   │   ├── 已需商检但未建任务
    │   │   └── 商检资料未备齐
    │   └── 输出
    │       ├── 影响Docs准备
    │       ├── 影响订舱时点
    │       └── 影响报关资料树
    ├── D. 海运费询价树
    │   ├── 触发条件
    │   │   ├── 贸易术语要求我方负责主运
    │   │   ├── 客户要求我方提供运费方案
    │   │   └── 需确认总报价含运费逻辑
    │   ├── 责任角色
    │   │   ├── 主执行：Sales_Rep / Order_Coordinator
    │   │   ├── 协同人：Forwarder
    │   │   └── 监督人：Regional_Manager
    │   ├── 状态树
    │   │   ├── 待询运费
    │   │   ├── 已询货代
    │   │   ├── 运费已回传
    │   │   ├── 待客户确认
    │   │   └── 已确认
    │   ├── 字段树
    │   │   ├── 起运港
    │   │   ├── 目的港
    │   │   ├── 箱型/箱量
    │   │   ├── 船期窗口
    │   │   ├── 海运费
    │   │   ├── 附加费
    │   │   └── 报价有效期
    │   ├── 动作树
    │   │   ├── 向货代询价
    │   │   ├── 收集运费方案
    │   │   ├── 记录推荐方案
    │   │   └── 转发客户确认
    │   ├── 提醒树
    │   │   ├── 运费待回传超时
    │   │   ├── 运费报价即将过期
    │   │   └── 客户待确认超时
    │   └── 统计树
    │       ├── 运费回传时长
    │       ├── 客户确认时长
    │       └── 运费方案采纳率
    ├── E. 客户确认运费树
    │   ├── 责任角色
    │   │   ├── 执行人：Customer
    │   │   ├── 承接人：Sales_Rep
    │   │   └── 监督人：Regional_Manager
    │   ├── 结果树
    │   │   ├── 客户确认
    │   │   ├── 客户要求调整
    │   │   ├── 客户拒绝当前方案
    │   │   └── 改变贸易术语
    │   ├── 动作树
    │   │   ├── 发送运费方案
    │   │   ├── 记录客户确认
    │   │   ├── 记录客户议价
    │   │   └── 必要时回流重新询价
    │   ├── 回流树
    │   │   ├── 客户不同意运费 -> 回流海运费询价
    │   │   ├── 客户改术语 -> 回流贸易术语确认
    │   │   └── 客户要求延期 -> 回流Shipment时间轴
    │   └── 输出
    │       ├── 可正式订舱
    │       └── 可锁定船期
    ├── F. 正式订舱树
    │   ├── 前置条件树
    │   │   ├── 贸易术语已锁定
    │   │   ├── 商检需求已明确
    │   │   ├── 运费已确认（如适用）
    │   │   ├── 尾款条件满足（如适用）
    │   │   └── 关键出运资料可准备
    │   ├── 责任角色
    │   │   ├── 主执行：Sales_Rep / Order_Coordinator
    │   │   ├── 外部执行：Forwarder
    │   │   └── 协同人：Warehouse_Ops / Documentation_Officer
    │   ├── 状态树
    │   │   ├── 待订舱
    │   │   ├── 已提交货代
    │   │   ├── 货代已确认
    │   │   ├── 船期已锁定
    │   │   └── 待装柜
    │   ├── 字段树
    │   │   ├── 船公司/货代
    │   │   ├── 船期
    │   │   ├── ETD/ETA
    │   │   ├── 箱型/箱量
    │   │   ├── 订舱确认号
    │   │   └── 备注/异常
    │   ├── 动作树
    │   │   ├── 正式订舱
    │   │   ├── 货代确认
    │   │   ├── 锁定船期
    │   │   ├── 同步拖车安排
    │   │   └── 下推拖车装柜
    │   ├── 提醒树
    │   │   ├── 待订舱超时
    │   │   ├── 货代未确认
    │   │   ├── 船期变更
    │   │   └── 订舱后未下推拖车
    │   └── 统计树
    │       ├── 订舱完成率
    │       ├── 船期确认时长
    │       ├── 船期变更率
    │       └── 订舱准时率
    ├── G. 异常回流树
    │   ├── 商检要求变化 -> 回流Docs / Inspection Agency
    │   ├── 运费过期 -> 回流海运费询价
    │   ├── 客户改贸易术语 -> 回流贸易术语确认
    │   ├── 货代无舱位 -> 回流Forwarder重新询价
    │   └── 关键资料缺失 -> 阻断正式订舱并回流Docs
    └── H. 管理与统计树
        ├── 术语确认时长
        ├── 商检判断准确率
        ├── 运费确认时长
        ├── 正式订舱准时率
        ├── 因术语/运费导致的回流率
        └── 订舱前阻断命中率
```

---

## 23. 外部参与方枝

```text
外部参与方
└── 目标：把主链中所有关键外部执行方正式挂到树上，明确“谁在外部执行、谁在内部承接、谁对异常负责”
    ├── A. Supplier（供应商）树
    │   ├── 所在线段
    │   │   ├── XJ/BJ
    │   │   ├── CG
    │   │   ├── 打样/封样
    │   │   ├── 生产
    │   │   ├── 自检/完货
    │   │   └── 配合装柜
    │   ├── 外部职责
    │   │   ├── 报价
    │   │   ├── 接单
    │   │   ├── 打样
    │   │   ├── 量产
    │   │   ├── 上传质检资料
    │   │   ├── 配合验货
    │   │   └── 配合装柜
    │   ├── 内部承接人
    │   │   ├── Procurement
    │   │   ├── Procurement_Manager
    │   │   ├── QC
    │   │   └── Order_Coordinator
    │   ├── 关键字段
    │   │   ├── supplier_id
    │   │   ├── supplier_name
    │   │   ├── supplier_level
    │   │   ├── supplier_status
    │   │   ├── delivery_commitment_date
    │   │   └── quality_risk_level
    │   └── 关键异常
    │       ├── 报价慢
    │       ├── 交期延误
    │       ├── 样品不达标
    │       ├── 质量反复异常
    │       └── 不配合整改
    ├── B. Inspection Agency（商检机构）树
    │   ├── 所在线段
    │   │   ├── 订舱前决策段
    │   │   ├── 商检/证书资料段
    │   │   └── Docs
    │   ├── 外部职责
    │   │   ├── 受理商检申请
    │   │   ├── 出具商检/证书
    │   │   └── 配合监管要求
    │   ├── 内部承接人
    │   │   ├── Sales_Rep
    │   │   ├── Documentation_Officer
    │   │   └── Order_Coordinator
    │   ├── 关键字段
    │   │   ├── inspection_agency_id
    │   │   ├── inspection_required
    │   │   ├── inspection_doc_status
    │   │   └── certificate_status
    │   └── 关键异常
    │       ├── 需商检但未申请
    │       ├── 证书延误
    │       └── 证书资料不完整
    ├── C. Forwarder（货代）树
    │   ├── 所在线段
    │   │   ├── 海运费询价
    │   │   ├── 正式订舱
    │   │   ├── 开船通知
    │   │   ├── 在途更新
    │   │   └── 到港通知
    │   ├── 外部职责
    │   │   ├── 运费报价
    │   │   ├── 订舱确认
    │   │   ├── 提供船期
    │   │   ├── 提供BL/物流资料
    │   │   └── 提供到港信息
    │   ├── 内部承接人
    │   │   ├── Sales_Rep
    │   │   ├── Order_Coordinator
    │   │   ├── Warehouse_Ops
    │   │   └── Documentation_Officer
    │   ├── 关键字段
    │   │   ├── forwarder_id
    │   │   ├── booking_no
    │   │   ├── vessel_name
    │   │   ├── etd
    │   │   ├── eta
    │   │   └── freight_quote_status
    │   └── 关键异常
    │       ├── 无舱位
    │       ├── 船期变化
    │       ├── BL延误
    │       └── 在途信息不更新
    ├── D. Truck Company / Driver（拖车公司/司机）树
    │   ├── 所在线段
    │   │   ├── Shipment 前置
    │   │   ├── 拖车装柜
    │   │   └── 港区运输
    │   ├── 外部职责
    │   │   ├── 接单确认
    │   │   ├── 到厂装柜
    │   │   ├── 运往港区
    │   │   └── 回传到港状态
    │   ├── 内部承接人
    │   │   ├── Sales_Rep
    │   │   ├── Order_Coordinator
    │   │   └── Warehouse_Ops
    │   ├── 关键字段
    │   │   ├── trucking_company
    │   │   ├── driver_name
    │   │   ├── loading_date
    │   │   ├── port_arrival_time
    │   │   └── trucking_status
    │   └── 关键异常
    │       ├── 拖车未确认
    │       ├── 到厂延误
    │       ├── 装柜异常
    │       └── 到港延误
    ├── E. Customs Broker（报关行）树
    │   ├── 所在线段
    │   │   ├── 报关资料提交
    │   │   ├── 申报
    │   │   ├── 放行通知
    │   │   └── 清关资料协同
    │   ├── 外部职责
    │   │   ├── 接收报关资料
    │   │   ├── 向海关申报
    │   │   ├── 回传报关单号
    │   │   └── 通知放行结果
    │   ├── 内部承接人
    │   │   ├── Documentation_Officer
    │   │   ├── Sales_Rep
    │   │   └── Order_Coordinator
    │   ├── 关键字段
    │   │   ├── customs_broker_id
    │   │   ├── declaration_status
    │   │   ├── customs_declaration_no
    │   │   └── release_notice_at
    │   └── 关键异常
    │       ├── 资料退回
    │       ├── 申报延误
    │       ├── 报关单错误
    │       └── 放行通知延迟
    ├── F. Customs（海关）树
    │   ├── 所在线段
    │   │   ├── 出口报关放行
    │   │   └── 目的港清关放行
    │   ├── 外部职责
    │   │   ├── 审核申报
    │   │   ├── 查验/免验
    │   │   ├── 放行
    │   │   └── 反馈监管结果
    │   ├── 内部承接人
    │   │   ├── Customs Broker
    │   │   ├── Documentation_Officer
    │   │   ├── Sales_Rep
    │   │   └── Customer（目的港）
    │   ├── 关键字段
    │   │   ├── customs_status
    │   │   ├── inspection_result
    │   │   ├── clearance_released_at
    │   │   └── customs_exception_note
    │   └── 关键异常
    │       ├── 查验
    │       ├── 补资料
    │       ├── 未放行
    │       └── 清关延误
    ├── G. 外部参与方共用治理树
    │   ├── 统一字段
    │   │   ├── external_party_type
    │   │   ├── external_party_name
    │   │   ├── contact_person
    │   │   ├── contact_phone
    │   │   ├── service_status
    │   │   └── related_document_no
    │   ├── 共用动作
    │   │   ├── 指派外部方
    │   │   ├── 记录回执
    │   │   ├── 记录异常
    │   │   └── 更换外部方
    │   ├── 共用提醒
    │   │   ├── 外部方未响应
    │   │   ├── 外部方状态未更新
    │   │   ├── 外部方异常未闭环
    │   │   └── 关键外部资料未回传
    │   └── 共用统计
    │       ├── 外部响应时长
    │       ├── 外部执行准时率
    │       ├── 外部异常率
    │       └── 外部方替换率
    └── H. 对齐检查清单
        ├── 是否所有外部方都挂到主链节点
        ├── 是否每个外部方都有内部承接人
        ├── 是否每个外部方都有异常回流
        ├── 是否每个外部方都有字段挂接
        └── 是否与 Demo V5 的外部角色保持一致口径
```

---

## 24. 目的港清关验收枝

```text
目的港清关验收
└── 目标：把“到港 -> 清关 -> 提柜 -> 到仓 -> 开柜验货 -> 正式验收 -> 市场反馈”从粗线条补成完整闭环
    ├── A. 到港通知树
    │   ├── 上承：Shipment 在途 -> 到港
    │   ├── 执行人：Forwarder / Sales_Rep
    │   ├── 接收人：Customer
    │   ├── 动作
    │   │   ├── 货代通知到港
    │   │   ├── Sales_Rep 通知客户
    │   │   └── 发送清关准备提示
    │   ├── 字段
    │   │   ├── arrival_notice_at
    │   │   ├── destination_port
    │   │   ├── eta_confirmed
    │   │   └── customer_notified_at
    │   └── 异常
    │       ├── 到港未通知
    │       └── 通知客户延误
    ├── B. 客户清关安排树
    │   ├── 执行人：Customer
    │   ├── 协同人：Sales_Rep / Documentation_Officer
    │   ├── 动作
    │   │   ├── 联系目的港报关行
    │   │   ├── 确认清关费用
    │   │   ├── 确认预计清关日期
    │   │   └── 建立目的港清关任务
    │   ├── 字段
    │   │   ├── destination_broker
    │   │   ├── customs_fee
    │   │   ├── est_clearance_date
    │   │   └── destination_clearance_status
    │   └── 异常
    │       ├── 客户未安排清关
    │       └── 清关费用/代理异常
    ├── C. 补充清关单证树
    │   ├── 执行人：Customer / Documentation_Officer
    │   ├── 协同人：Sales_Rep
    │   ├── 动作
    │   │   ├── 补充ISF/目的港资料
    │   │   ├── 补充收货方资料
    │   │   ├── 补充监管要求资料
    │   │   └── 确认资料齐套
    │   ├── 字段
    │   │   ├── destination_docs_status
    │   │   ├── destination_docs_missing
    │   │   ├── isf_status
    │   │   └── docs_completed_at
    │   └── 异常
    │       ├── 资料缺失
    │       ├── 资料错误
    │       └── 资料补充超时
    ├── D. 目的港海关放行树
    │   ├── 执行主体：Customer / Destination Broker / Destination Customs
    │   ├── 内部承接人：Sales_Rep
    │   ├── 状态
    │   │   ├── 清关准备中
    │   │   ├── 清关申报中
    │   │   ├── 查验中
    │   │   ├── 已放行
    │   │   └── 清关异常
    │   ├── 字段
    │   │   ├── destination_customs_status
    │   │   ├── destination_release_at
    │   │   ├── destination_inspection_note
    │   │   └── clearance_exception_note
    │   ├── 动作
    │   │   ├── 更新清关状态
    │   │   ├── 更新放行结果
    │   │   └── 通知客户/销售
    │   └── 异常
    │       ├── 查验
    │       ├── 扣关
    │       ├── 放行延迟
    │       └── 需补税/补资料
    ├── E. 提柜运输树
    │   ├── 执行人：Customer / Destination Trucking
    │   ├── 协同人：Sales_Rep
    │   ├── 动作
    │   │   ├── 安排提柜
    │   │   ├── 从港口提柜
    │   │   ├── 运往仓库
    │   │   └── 确认到仓
    │   ├── 字段
    │   │   ├── pickup_status
    │   │   ├── destination_trucking_company
    │   │   ├── warehouse_arrival_at
    │   │   └── destination_delivery_note
    │   └── 异常
    │       ├── 提柜延误
    │       ├── 运输异常
    │       └── 到仓延误
    ├── F. 开柜验货树
    │   ├── 执行人：Customer
    │   ├── 协同人：Sales_Rep
    │   ├── 动作
    │   │   ├── 开柜检查
    │   │   ├── 记录货物状态
    │   │   ├── 记录破损/短少
    │   │   └── 提交初步反馈
    │   ├── 字段
    │   │   ├── warehouse_open_check_status
    │   │   ├── cargo_condition
    │   │   ├── quantity_check_result
    │   │   └── initial_feedback
    │   └── 异常
    │       ├── 货损
    │       ├── 短少
    │       ├── 包装异常
    │       └── 与封样不一致
    ├── G. 正式验收树
    │   ├── 执行人：Customer
    │   ├── 承接人：Sales_Rep
    │   ├── 监督人：Regional_Manager
    │   ├── 动作
    │   │   ├── 正式验收确认
    │   │   ├── 签署验收结论
    │   │   ├── 标记满意度
    │   │   └── 推送正式反馈
    │   ├── 字段
    │   │   ├── acceptance_status
    │   │   ├── acceptance_signed_at
    │   │   ├── acceptance_quality_rating
    │   │   └── acceptance_note
    │   └── 异常
    │       ├── 验收不通过
    │       ├── 有条件接受
    │       └── 售后处理要求
    ├── H. 市场销售反馈树
    │   ├── 执行人：Customer
    │   ├── 承接人：Sales_Rep
    │   ├── 动作
    │   │   ├── 记录市场销售进展
    │   │   ├── 记录客户满意度
    │   │   ├── 记录复购意向
    │   │   └── 转入 Feedback / Repeat
    │   ├── 字段
    │   │   ├── market_sellthrough_status
    │   │   ├── customer_satisfaction
    │   │   ├── reorder_intent
    │   │   └── next_order_expectation
    │   └── 输出
    │       ├── Feedback
    │       ├── Repeat
    │       └── service_to_trade / 扩品机会
    ├── I. 共用提醒与统计树
    │   ├── 提醒
    │   │   ├── 到港未通知
    │   │   ├── 清关未安排
    │   │   ├── 清关资料未齐
    │   │   ├── 已放行未提柜
    │   │   ├── 到仓未开柜
    │   │   ├── 开柜后未验收
    │   │   └── 验收后未反馈
    │   ├── 统计
    │   │   ├── 到港通知及时率
    │   │   ├── 目的港清关周期
    │   │   ├── 清关异常率
    │   │   ├── 验收通过率
    │   │   ├── 客户满意度
    │   │   └── 复购意向率
    │   └── 回流
    │       ├── 清关异常 -> 回流 Documentation_Officer / Sales_Rep
    │       ├── 验收异常 -> 回流 QC / Sales_Rep / Regional_Manager
    │       └── 市场反馈优秀 -> 回流 Repeat
    └── J. 对齐检查清单
        ├── 是否把到港后的每个关键动作都挂出来
        ├── 是否区分了“初步开柜检查”和“正式验收”
        ├── 是否让Feedback/Repeat与目的港验收真正闭环
        ├── 是否给了清关、提柜、开柜、验收各自字段
        └── 是否与 Demo V5 的后段闭环口径一致
```

---

## 25. 开票归档枝

```text
开票归档
└── 目标：把“申请开票 -> 财务开票 -> 单据归档 -> 归档编号”纳入主链闭环，而不是散落在财务角落
    ├── A. 节点定位树
    │   ├── 所属主链：Shipment / Payment 后段支撑节点
    │   ├── 上承：合同、发货、收汇、单证资料已形成
    │   ├── 下交：财务归档 / 审计 / 退税 / 后续复盘
    │   └── 节点作用
    │       ├── 形成正式票据
    │       ├── 形成合规资料
    │       └── 形成可追溯归档闭环
    ├── B. 业务员申请开票树
    │   ├── 执行人：Sales_Rep
    │   ├── 承接人：Finance
    │   ├── 字段
    │   │   ├── 开票申请编号
    │   │   ├── 对应SC / Shipment / AR
    │   │   ├── 开票金额
    │   │   ├── 币种
    │   │   ├── 开票原因
    │   │   ├── 开票备注
    │   │   └── 是否用于退税
    │   ├── 动作
    │   │   ├── 发起开票申请
    │   │   ├── 补充开票信息
    │   │   └── 提交财务处理
    │   └── 异常
    │       ├── 信息不全
    │       ├── 金额不一致
    │       └── 条件未满足
    ├── C. 财务开票树
    │   ├── 执行人：Finance
    │   ├── 监督人：CFO
    │   ├── 状态
    │   │   ├── 待开票
    │   │   ├── 开票中
    │   │   ├── 已开具
    │   │   ├── 待补资料
    │   │   └── 已驳回
    │   ├── 字段
    │   │   ├── invoice_no
    │   │   ├── invoice_date
    │   │   ├── invoice_amount
    │   │   ├── invoice_status
    │   │   ├── invoice_type
    │   │   └── tax_refund_required
    │   ├── 动作
    │   │   ├── 审核开票申请
    │   │   ├── 开具发票
    │   │   ├── 上传发票文件
    │   │   └── 回传已开票状态
    │   └── 异常
    │       ├── 金额不匹配
    │       ├── 发票信息错误
    │       └── 未满足开票条件
    ├── D. 归档资料树
    │   ├── 归档对象
    │   │   ├── 销售合同
    │   │   ├── 采购合同
    │   │   ├── 商业发票
    │   │   ├── 装箱单
    │   │   ├── 提单
    │   │   ├── 报关资料
    │   │   ├── 收汇/结汇水单
    │   │   └── 付款记录
    │   ├── 执行人
    │   │   ├── Finance
    │   │   └── Documentation_Officer
    │   ├── 动作
    │   │   ├── 汇总资料
    │   │   ├── 校验齐套
    │   │   ├── 生成归档编号
    │   │   └── 完成归档
    │   └── 状态
    │       ├── 待归档
    │       ├── 归档中
    │       ├── 已归档
    │       └── 归档资料缺失
    ├── E. 编号树
    │   ├── 开票编号
    │   │   ├── 规则：按财务发票编号体系
    │   │   └── 用途：票据识别
    │   ├── 归档编号
    │   │   ├── 规则：按区域 / 年份 / 单据集生成
    │   │   └── 用途：归档检索
    │   └── 关联编号
    │       ├── SC编号
    │       ├── AR编号
    │       ├── Shipment编号
    │       └── 文档编号
    ├── F. 提醒与统计树
    │   ├── 提醒
    │   │   ├── 待开票
    │   │   ├── 发票待上传
    │   │   ├── 待归档
    │   │   └── 归档资料缺失
    │   ├── 统计
    │   │   ├── 开票及时率
    │   │   ├── 归档及时率
    │   │   ├── 归档完整率
    │   │   └── 票据差错率
    │   └── 回流
    │       ├── 开票信息错误 -> 回流 Sales_Rep
    │       ├── 归档资料不全 -> 回流 Documentation_Officer / Finance
    │       └── 票据不一致 -> 回流 Payment / Docs
    └── G. 对齐检查清单
        ├── 是否有正式的 invoice_no / invoice_date
        ├── 是否把归档状态独立出来
        ├── 是否把归档编号挂上
        ├── 是否与财务/单证双端协同
        └── 是否与 Demo V5 的开票归档段一致
```

---

## 26. 第一轮 Supabase 字段对齐盘点（已稳定主枝）

```text
第一轮 Supabase 字段对齐
└── 范围：审批治理枝 + 收款自动化枝 + 产前样/封样枝 + 订舱前决策枝
    ├── A. 已有字段，可直接承接
    │   ├── 责任归属字段
    │   │   ├── inquiries.owner_user_id / owner_email / owner_name / owner_role
    │   │   ├── sales_quotations.owner_user_id / owner_email / owner_name / owner_role
    │   │   ├── sales_contracts.owner_user_id / owner_email / owner_name / owner_role
    │   │   └── xj / purchase requirement 侧 owner_* 已存在
    │   ├── QT审批字段
    │   │   ├── sales_quotations.approval_status
    │   │   └── sales_quotations.approval_chain
    │   ├── SC审批字段
    │   │   ├── sales_contracts.approval_flow
    │   │   ├── sales_contracts.approval_history
    │   │   ├── sales_contracts.approval_notes
    │   │   ├── sales_contracts.rejection_reason
    │   │   └── sales_contracts.approved_at
    │   ├── 收款联动字段
    │   │   ├── sales_contracts.deposit_proof
    │   │   ├── orders.deposit_payment_proof
    │   │   ├── orders.balance_payment_proof
    │   │   ├── accounts_receivable 基础字段
    │   │   └── SC->AR 自动创建逻辑已存在
    │   ├── 产前样/封样字段
    │   │   ├── purchase_order_execution.sample_required
    │   │   ├── pre_production_sample_status
    │   │   ├── pre_production_sample_no
    │   │   ├── sample_round
    │   │   ├── pre_production_sample_sent_at
    │   │   ├── sample_confirmed_at
    │   │   └── seal_confirmed_at
    │   └── 订舱前决策字段
    │       ├── purchase_order_execution.booking_status
    │       ├── booking_responsibility
    │       ├── freight_confirmation_required
    │       ├── freight_confirmed_by_customer_at
    │       ├── freight_inquiry_status
    │       ├── selected_booking_quote_id
    │       └── shipping_order_status
    ├── B. 半有字段，需要统一口径
    │   ├── 审批链口径
    │   │   ├── QT 用 approval_status / approval_chain
    │   │   ├── SC 用 approval_flow / approval_history
    │   │   └── 建议统一补“current_approval_step / current_approver_role”派生口径
    │   ├── 收款凭证口径
    │   │   ├── sales_contracts.deposit_proof
    │   │   ├── orders.deposit_payment_proof
    │   │   ├── OrderContext 还有 depositReceiptProof / balanceReceiptProof
    │   │   └── 建议统一命名 customer_payment_proof / finance_receipt_proof 口径
    │   ├── Portal状态口径
    │   │   ├── 目前已有部分前端状态
    │   │   └── 建议统一 customer_portal_payment_status 派生口径
    │   ├── 贸易术语口径
    │   │   ├── sales_quotations.trade_terms / delivery_terms / incoterms 并存
    │   │   ├── sales_contracts.trade_terms
    │   │   └── 建议统一用 incoterm 作为主口径，trade_terms 为兼容展示
    │   └── 清关/交付后段口径
    │       ├── 已有 import_clearance_coordination.clearance_status
    │       ├── salesTodoCenter 里已有 shipmentReadinessStatus 派生
    │       └── 建议统一“主状态 + 派生状态”映射
    ├── C. 明确缺口，建议新增或补充
    │   ├── QT审批补充字段
    │   │   ├── qt_requires_manager_approval
    │   │   ├── qt_requires_director_approval
    │   │   ├── qt_rejection_reason
    │   │   └── qt_last_approval_at
    │   ├── SC自动化补充字段
    │   │   ├── ar_auto_created_at
    │   │   ├── customer_payment_proof_uploaded_at
    │   │   ├── finance_verified_payment_at
    │   │   └── customer_portal_payment_status
    │   ├── 产前样/封样补充字段
    │   │   ├── sample_image_urls
    │   │   ├── sample_feedback_notes
    │   │   ├── sealed_sample_ref
    │   │   └── sealed_sample_valid_status
    │   ├── 订舱前决策补充字段
    │   │   ├── incoterm
    │   │   ├── inspection_required
    │   │   ├── inspection_doc_status
    │   │   ├── freight_quote_valid_until
    │   │   └── booking_decision_locked_at
    │   └── 开票归档补充字段
    │       ├── invoice_no
    │       ├── invoice_status
    │       ├── archive_no
    │       ├── archive_status
    │       └── archived_at
    ├── D. 现有表挂接建议
    │   ├── inquiries
    │   │   └── 承接 ING 责任归属与基础跟进
    │   ├── sales_quotations
    │   │   └── 承接 QT 审批、术语、条款、客户反馈
    │   ├── sales_contracts
    │   │   └── 承接 SC 审批、签约、生效、定金前置
    │   ├── accounts_receivable
    │   │   └── 承接 AR、应收状态、回款金额
    │   ├── purchase_order_execution
    │   │   └── 承接 样品 / 封样 / 订舱前决策 / 尾款放行条件
    │   ├── import_clearance_coordination
    │   │   └── 承接 目的港清关状态
    │   ├── post_order_feedback
    │   │   └── 承接 反馈与满意度
    │   └── 文档/财务相关表
    │       └── 承接 开票归档与单证归档
    └── E. 第一轮对齐结论
        ├── 主骨架字段并非从零开始，已有相当基础
        ├── 产前样、订舱前决策、AR自动创建这三块已有明显落地基础
        ├── 最大问题不是“没有字段”，而是“同义字段并存、口径未统一”
        ├── 下一步应先做字段口径表，再决定哪些需要 migration
        └── 原则：先统一主口径，再补缺口字段，不先大规模改库
```

---

## 27. 字段口径对齐表 V1（第一轮可执行版）

| 业务口径 | 当前字段/位置 | 当前状态 | 建议主口径 | 后续动作 |
| --- | --- | --- | --- | --- |
| QT审批状态 | `sales_quotations.approval_status` | 已有 | `approval_status` | 继续沿用 |
| QT审批链 | `sales_quotations.approval_chain` | 已有 | `approval_chain` | 继续沿用，补充当前步骤派生口径 |
| QT是否需主管审批 | 目前无单独字段，靠前端/审批链判断 | 缺口 | `requires_manager_approval` | 后续补字段或派生 |
| QT是否需总监审批 | `approval_chain` / 业务规则 | 半有 | `requires_director_approval` | 先派生，后续视需要落库 |
| QT驳回原因 | 目前主要在审批链备注中 | 半有 | `rejection_reason` | 建议补独立字段或统一落在审批记录 |
| SC审批流 | `sales_contracts.approval_flow` | 已有 | `approval_flow` | 继续沿用 |
| SC审批历史 | `sales_contracts.approval_history` | 已有 | `approval_history` | 继续沿用 |
| SC审批说明 | `sales_contracts.approval_notes` | 已有 | `approval_notes` | 继续沿用 |
| SC驳回原因 | `sales_contracts.rejection_reason` | 已有 | `rejection_reason` | 继续沿用 |
| SC审批完成时间 | `sales_contracts.approved_at` | 已有 | `approved_at` | 继续沿用 |
| 责任归属 | 各主表 `owner_user_id / owner_email / owner_name / owner_role` | 已有 | `owner_*` | 继续沿用，禁止再造同义字段 |
| 业务员指派 | `inquiries.assigned_to` 等 | 半有 | `owner_email` 为主，`assigned_to` 兼容 | 服务层统一映射 |
| 下一次跟进时间 | 多在前端状态，库中未统一 | 缺口 | `next_follow_up_at` | 建议后续落库 |
| 客户上传定金凭证 | `sales_contracts.deposit_proof`、`orders.deposit_payment_proof` | 重复/半有 | `customer_payment_proof` 业务口径 | 先服务层收口，后评估迁移 |
| 财务收款凭证 | `OrderContext.depositReceiptProof / balanceReceiptProof` | 前端有、库侧未统一 | `finance_receipt_proof` | 建议后续落库 |
| 尾款客户凭证 | `orders.balance_payment_proof` | 已有 | `balance_payment_proof` | 暂沿用，后续并入口径树 |
| SC生效自动生成AR | `SalesContractContext` 自动创建 `accounts_receivable` | 已有逻辑 | `SC -> AR` 自动化链 | 保留并补审计/状态字段 |
| AR主状态 | `accounts_receivable.status` | 已有 | `status` | 继续沿用 |
| AR关联合同 | `accounts_receivable.orderNumber / contractNumber` 服务层映射 | 已有 | `contract_number` 业务口径 | 后续确认表实际列口径 |
| 客户Portal付款状态 | 主要是前端派生状态 | 缺口 | `customer_portal_payment_status` | 建议后续派生或落库 |
| Finance核销时间 | 目前通过操作日志/更新时间间接体现 | 缺口 | `finance_verified_payment_at` | 后续建议补字段 |
| 产前样是否需要 | `purchase_order_execution.sample_required` | 已有 | `sample_required` | 继续沿用 |
| 产前样状态 | `purchase_order_execution.pre_production_sample_status` | 已有 | `pre_production_sample_status` | 继续沿用 |
| 样品编号 | `purchase_order_execution.pre_production_sample_no` | 已有 | `pre_production_sample_no` | 继续沿用 |
| 样品轮次 | `purchase_order_execution.sample_round` | 已有 | `sample_round` | 继续沿用 |
| 样品确认时间 | `purchase_order_execution.sample_confirmed_at` | 已有 | `sample_confirmed_at` | 继续沿用 |
| 封样确认时间 | `purchase_order_execution.seal_confirmed_at` | 已有 | `seal_confirmed_at` | 继续沿用 |
| 样品图片/附件 | 当前未见统一字段 | 缺口 | `sample_image_urls` | 后续建议补字段 |
| 样品反馈说明 | 当前未见统一字段 | 缺口 | `sample_feedback_notes` | 后续建议补字段 |
| 封样引用号 | 当前未见统一字段 | 缺口 | `sealed_sample_ref` | 后续建议补字段 |
| 贸易术语 | `sales_quotations.trade_terms`、`delivery_terms`、`incoterms`、`sales_contracts.trade_terms` | 同义并存 | `incoterm` | 先服务层统一映射，再考虑迁移 |
| 是否需要商检 | `purchase_order_execution.inspection_execution_mode` / 业务规则 | 半有 | `inspection_required` | 建议补明确布尔或枚举 |
| 客户指定商检机构 | `purchase_order_execution.customer_designated_inspection_agency` | 已有 | `customer_designated_inspection_agency` | 继续沿用 |
| 订舱责任 | `purchase_order_execution.booking_responsibility` | 已有 | `booking_responsibility` | 继续沿用 |
| 运费是否需客户确认 | `purchase_order_execution.freight_confirmation_required` | 已有 | `freight_confirmation_required` | 继续沿用 |
| 客户确认运费时间 | `purchase_order_execution.freight_confirmed_by_customer_at` | 已有 | `freight_confirmed_by_customer_at` | 继续沿用 |
| 运费询价状态 | `purchase_order_execution.freight_inquiry_status` | 已有 | `freight_inquiry_status` | 继续沿用 |
| 订舱状态 | `purchase_order_execution.booking_status` | 已有 | `booking_status` | 继续沿用 |
| 清关状态 | `import_clearance_coordination.clearance_status`、前端 `shipmentReadinessStatus` | 半有 | `clearance_status` 为主，`shipmentReadinessStatus` 派生 | 映射统一 |
| 商业发票编号 | `postContractExecutionServices` / customs docs 有 `commercial_invoice_no` | 已有 | `commercial_invoice_no` | 继续沿用 |
| 发票编号 | 系统零散有 `invoice_no / invoiceDate` | 半有 | `invoice_no` | 需统一挂接到开票归档树 |
| 归档状态 | `purchase_order_execution.archive_status` | 已有 | `archive_status` | 继续沿用 |
| 归档编号 | 当前未见统一列 | 缺口 | `archive_no` | 建议后续补字段 |
| 归档时间 | 当前多为操作时间隐含 | 缺口 | `archived_at` | 建议后续补字段 |

### 使用规则

1. 先按“建议主口径”统一前端和服务层命名。
2. 已有字段优先复用，不急着迁移。
3. 同义字段并存的，先做服务层收口映射，再决定是否做 migration。
4. 真正缺口字段，等第二轮字段评审后再集中出 migration。
5. 后续新增节点或页面，必须先查这张表，避免重复造字段。

---

## 28. 现有 Supabase 变更回溯表（第一轮）

这部分用于回答一个非常实际的问题：

- 哪些字段其实已经在 Supabase 里改过或加过
- 哪些字段已经被前端/服务层依赖
- 哪些字段应该继续沿用现有 Supabase 命名
- 哪些字段虽然业务同义，但需要先通过服务层收口

这里的核心原则是：

1. 业务含义由本定稿定义。
2. 但只要 Supabase 现有字段已经稳定、语义可接受、牵连面广，就优先沿用 Supabase 命名。
3. 只有同义字段冲突严重或语义明显错误时，才考虑后续 migration。

### 28.1 回溯结论总览

```text
现有 Supabase 变更回溯
├── A. 责任归属主枝
│   ├── owner_* 已经在多个主表落库
│   ├── inquiries.owner_* 也已补齐
│   └── assigned_to 仍存在，需作为兼容口径
├── B. 销售审批主枝
│   ├── QT：approval_status / approval_chain 已稳定
│   └── SC：approval_flow / approval_history / approval_notes / rejection_reason / approved_at 已稳定
├── C. 回款自动化主枝
│   ├── sales_contracts.deposit_proof 已存在
│   ├── orders.deposit_payment_proof / balance_payment_proof 已存在
│   ├── accounts_receivable 已作为 AR 表存在
│   └── SalesContractContext 已有 SC -> AR 自动创建逻辑
├── D. 产前样/封样主枝
│   ├── sample_required
│   ├── pre_production_sample_status
│   ├── pre_production_sample_no
│   ├── sample_round
│   ├── sample_confirmed_at
│   └── seal_confirmed_at
├── E. 订舱前决策主枝
│   ├── booking_responsibility
│   ├── freight_confirmation_required
│   ├── freight_confirmed_by_customer_at
│   ├── booking_status
│   ├── freight_inquiry_status
│   └── shipping_order_status
├── F. 外部参与方与验货主枝
│   ├── customer_designated_inspection_agency
│   └── customer_designated_inspection_status
├── G. 清关与归档主枝
│   ├── import_clearance_coordination.clearance_status 已存在
│   └── purchase_order_execution.archive_status 已存在
└── H. 当前最大问题
    ├── 不是“没有字段”
    ├── 而是“同义字段并存”
    ├── 页面状态、服务层状态、库字段状态未完全统一
    └── 下一步要做的是“沿用 + 收口 + 少量新增”，不是“全量重命名”
```

### 28.2 现有变更回溯表

| 业务主枝 | 表 / 承接位置 | 已存在或已变更字段 | 来源线索 | 命名基准 | 当前结论 |
| --- | --- | --- | --- | --- | --- |
| 责任归属 | `inquiries` | `assigned_to`, `owner_user_id`, `owner_email`, `owner_name`, `owner_role` | `20260326150000_add_inquiry_owner_audit_fields.sql`、`inquiryService.ts`、`InquiryContext.tsx` | 沿用 Supabase | `owner_*` 作为主口径，`assigned_to` 兼容 |
| 责任归属 | `quotation_requests / quote_requirements / sales_quotations / sales_contracts / purchase_orders` | `owner_user_id`, `owner_email`, `owner_name`, `owner_role` | `069_add_business_owner_audit_fields.sql`、`20260326143000_enforce_business_owner_invariants.sql` | 沿用 Supabase | 不再新造同义“业务员字段” |
| QT审批 | `sales_quotations` | `approval_status`, `approval_chain` | `salesQuotationService.ts` | 沿用 Supabase | 这组字段保持主命名 |
| SC审批 | `sales_contracts` | `approval_flow`, `approval_history`, `approval_notes`, `rejection_reason`, `approved_at` | `contractOrderArServices.ts`、相关 migration | 沿用 Supabase | 这组字段保持主命名 |
| AR回款 | `sales_contracts` | `deposit_proof` | `contractOrderArServices.ts`、`SalesContractContext.tsx` | 沿用 Supabase | 合同层客户定金凭证沿用现名 |
| AR回款 | `orders` | `deposit_payment_proof`, `balance_payment_proof` | `contractOrderArServices.ts` | 沿用 Supabase | 订单层客户付款凭证沿用现名 |
| AR回款 | `accounts_receivable` | `status` 及 AR 相关字段 | `contractOrderArServices.ts`、`FinanceContext.tsx` | 沿用 Supabase | `accounts_receivable` 作为 AR 主表继续沿用 |
| SC->AR自动化 | 服务层/上下文 | `SC -> AR` 自动创建逻辑 | `SalesContractContext.tsx` | 沿用现逻辑 | 先补审计与派生状态，不急着重构 |
| 产前样/封样 | `purchase_order_execution` | `sample_required`, `pre_production_sample_status`, `pre_production_sample_no`, `sample_round`, `sample_confirmed_at`, `seal_confirmed_at` | `20260321090019_add_preproduction_sample_fields.sql`、`purchaseOrderQuoteRequirementServices.ts` | 沿用 Supabase | 这一枝已基本有落库基础 |
| 订舱前决策 | `purchase_order_execution` | `booking_responsibility`, `freight_confirmation_required`, `freight_confirmed_by_customer_at`, `booking_status`, `freight_inquiry_status`, `shipping_order_status` | `20260321090006...`、`20260321090008...`、`purchaseOrderQuoteRequirementServices.ts` | 沿用 Supabase | 这些字段直接作为主命名 |
| 外部参与方 | `purchase_order_execution` | `customer_designated_inspection_agency`, `customer_designated_inspection_status` | `20260321090016_add_explicit_inspection_and_loading_supervision_modes.sql`、`postContractExecutionServices.ts` | 沿用 Supabase | 客户指定验货机构口径沿用 |
| 清关后段 | `import_clearance_coordination` | `clearance_status` | 相关服务与后段流程 | 沿用 Supabase | 清关主状态以此为准 |
| 归档后段 | `purchase_order_execution` | `archive_status` | `20260321090018_add_case_close_and_archive_status.sql`、`postContractExecutionServices.ts` | 沿用 Supabase | 归档主状态以此为准 |
| 贸易术语 | `sales_quotations / sales_contracts / documentation-service` | `trade_terms`, `delivery_terms`, `incoterms`, `incoterm` | 多服务并存 | 服务层收口 | 不急着改库，先统一映射到业务口径 |
| 客户付款凭证口径 | `sales_contracts / orders / context state` | `deposit_proof`, `deposit_payment_proof`, `balance_payment_proof`, `depositReceiptProof`, `balanceReceiptProof` | 多层并存 | 服务层收口 | 先统一业务解释，再评估是否新增标准字段 |

### 28.3 已确认的相关 migration 回溯

```text
Supabase migration 回溯（第一轮）
├── 责任归属与 owner 审计
│   ├── 069_add_business_owner_audit_fields.sql
│   ├── 20260326143000_enforce_business_owner_invariants.sql
│   └── 20260326150000_add_inquiry_owner_audit_fields.sql
├── 后合同执行主枝
│   ├── 20260321090001_create_post_contract_execution_core.sql
│   ├── 20260321090005_add_collection_control_to_purchase_order_execution.sql
│   ├── 20260321090006_add_booking_and_finance_receipt_controls.sql
│   ├── 20260321090008_add_post_qc_customer_notice_and_booking_workflow.sql
│   ├── 20260321090016_add_explicit_inspection_and_loading_supervision_modes.sql
│   ├── 20260321090018_add_case_close_and_archive_status.sql
│   ├── 20260321090019_add_preproduction_sample_fields.sql
│   ├── 20260321090020_add_supplier_payment_confirmation_fields.sql
│   └── 20260321090021_add_bank_submission_and_release_log_fields.sql
├── 后段交付与反馈
│   ├── 20260321090003_create_post_shipment_tracking_and_delivery.sql
│   └── 20260321090004_create_post_order_feedback.sql
└── 审批记录补强
    └── 067_fix_approval_records_action.sql
```

### 28.4 第一轮落地规则

1. 已稳定且被多处依赖的 Supabase 字段，`md` 反向贴合，不强推改名。
2. 存在同义字段冲突的，先在服务层收口，不先大规模做 migration。
3. 真正缺口字段，只在主链稳定后集中补 migration。
4. 以后每补一棵新枝，都要先检查本节，确认：
   - 是否已有字段可直接沿用
   - 是否只是同义字段冲突
   - 是否真的是新缺口

---

## 29. 第二轮字段实施清单（不偏离主链）

这一节只服务一个目标：

- 把前面已经稳定下来的主枝，转成后续可执行的字段实施动作
- 不讨论页面美化，不讨论新的业务模型，只讨论“字段怎么落”

### 29.1 实施分层规则

```text
字段实施分层
├── A. 直接沿用
│   ├── Supabase 已稳定
│   ├── 字义可接受
│   ├── 前后端已较多依赖
│   └── 不主动改名
├── B. 服务层映射
│   ├── 业务同义
│   ├── 多字段并存
│   ├── 先在 service/context 层统一
│   └── 暂不大规模改库
└── C. 后续新增 migration
    ├── 主链上确有缺口
    ├── 现有字段无法表达
    ├── 不补会影响自动化/审批/审计
    └── 集中进入下一轮 migration
```

### 29.2 A类：直接沿用 Supabase 的字段

| 主枝 | 表 | 直接沿用字段 | 原因 | 后续动作 |
| --- | --- | --- | --- | --- |
| 责任归属 | `inquiries` | `owner_user_id`, `owner_email`, `owner_name`, `owner_role`, `assigned_to` | 已真实承接现有分配逻辑 | 前端继续以 `owner_*` 为主，`assigned_to` 兼容 |
| QT审批 | `sales_quotations` | `approval_status`, `approval_chain` | 已稳定、语义清楚 | 后续补派生字段，不改原名 |
| SC审批 | `sales_contracts` | `approval_flow`, `approval_history`, `approval_notes`, `rejection_reason`, `approved_at` | 已稳定、覆盖面广 | 保持不动 |
| AR主表 | `accounts_receivable` | `status` 及现有 AR 主字段 | 现有财务上下文已使用 | 保持不动 |
| 合同层客户定金凭证 | `sales_contracts` | `deposit_proof` | 已落库且已用 | 保持不动 |
| 订单层客户付款凭证 | `orders` | `deposit_payment_proof`, `balance_payment_proof` | 已落库且已用 | 保持不动 |
| 产前样/封样 | `purchase_order_execution` | `sample_required`, `pre_production_sample_status`, `pre_production_sample_no`, `sample_round`, `sample_confirmed_at`, `seal_confirmed_at` | 已有明确 migration 和服务层映射 | 保持不动 |
| 订舱前决策 | `purchase_order_execution` | `booking_responsibility`, `freight_confirmation_required`, `freight_confirmed_by_customer_at`, `booking_status`, `freight_inquiry_status`, `shipping_order_status` | 已真实承接后合同执行逻辑 | 保持不动 |
| 客户指定验货机构 | `purchase_order_execution` | `customer_designated_inspection_agency`, `customer_designated_inspection_status` | 已稳定 | 保持不动 |
| 清关主状态 | `import_clearance_coordination` | `clearance_status` | 已是后段主状态 | 保持不动 |
| 归档主状态 | `purchase_order_execution` | `archive_status` | 已有约束与索引 | 保持不动 |

### 29.3 B类：先在服务层收口映射的字段

| 业务口径 | 当前字段分散情况 | 当前问题 | 服务层收口建议 | 暂不做的事 |
| --- | --- | --- | --- | --- |
| 责任归属主口径 | `assigned_to` 与 `owner_email` 并存 | 老字段与新口径并行 | 所有业务主视图优先读 `owner_*`，必要时回退 `assigned_to` | 暂不删除 `assigned_to` |
| 贸易术语 | `trade_terms`, `delivery_terms`, `incoterms`, `incoterm` | 同义字段并存 | service 层统一映射为“业务口径：贸易术语”，优先读已有稳定字段 | 暂不大规模改表改名 |
| 客户付款凭证 | `deposit_proof`, `deposit_payment_proof`, `balance_payment_proof`, 前端 `depositReceiptProof/balanceReceiptProof` | 合同层、订单层、前端态并行 | 先统一成“客户付款凭证 / 财务收款凭证”两类业务解释 | 暂不强推统一成单一库字段 |
| 审批当前步骤 | `approval_chain` 与 `approval_flow/history` 结构不同 | QT 与 SC 审批模型不一致 | service 层补派生口径：`current_approval_step`, `current_approver_role` | 暂不强行把 QT/SC 审批结构改成同一 JSON |
| Shipment readiness | `clearance_status` 与前端 `shipmentReadinessStatus` | 数据主状态与展示派生状态混用 | 后端主状态仍用 `clearance_status`，前端统一派生展示 | 暂不落新主状态列 |
| Portal付款状态 | 主要是前端派生态 | 无统一主字段 | service 层先派生 `customer_portal_payment_status` 业务态 | 暂不立刻落库 |

### 29.4 C类：建议进入下一轮 migration 的缺口字段

| 主枝 | 建议新增字段 | 用途 | 为什么现有字段不够 |
| --- | --- | --- | --- |
| QT审批 | `qt_requires_manager_approval` | 明确是否必须一审 | 当前主要靠链路推断，不够直观 |
| QT审批 | `qt_requires_director_approval` | 明确是否必须二审 | 当前主要靠规则派生，不利于审计 |
| QT审批 | `qt_last_approval_at` | 统计与审计 | 当前只能从链路历史推断 |
| SC/AR自动化 | `ar_auto_created_at` | 明确自动建 AR 的完成时间 | 当前只靠逻辑执行，无单独落点 |
| SC/AR自动化 | `customer_payment_proof_uploaded_at` | 记录客户上传水单时间 | 当前只有文件/凭证，无时间锚点 |
| SC/AR自动化 | `finance_verified_payment_at` | 记录财务核销时间 | 当前只能从更新时间间接判断 |
| SC/AR自动化 | `customer_portal_payment_status` | Portal 统一状态 | 当前只有前端派生态 |
| 样品/封样 | `sample_image_urls` | 统一样品附件 | 当前未见统一字段 |
| 样品/封样 | `sample_feedback_notes` | 统一客户样品反馈 | 当前只有散落备注 |
| 样品/封样 | `sealed_sample_ref` | 封样引用号 | 当前无标准字段 |
| 订舱前决策 | `inspection_required` | 明确是否需商检 | 当前多靠模式/规则推断 |
| 订舱前决策 | `inspection_doc_status` | 跟踪商检资料齐套 | 当前无主状态字段 |
| 订舱前决策 | `freight_quote_valid_until` | 记录运价有效期 | 当前无时间锚点 |
| 订舱前决策 | `booking_decision_locked_at` | 记录订舱决策锁定时间 | 当前无审计字段 |
| 开票归档 | `invoice_no` | 统一发票编号 | 当前零散、未形成主字段口径 |
| 开票归档 | `invoice_status` | 统一开票状态 | 当前零散 |
| 开票归档 | `archive_no` | 统一归档编号 | 当前无主字段 |
| 开票归档 | `archived_at` | 记录归档时间 | 当前只有隐含更新时间 |

### 29.5 第二轮实施顺序

```text
第二轮实施顺序
├── 第一步：不动表结构，先统一服务层
│   ├── owner_* / assigned_to 收口
│   ├── trade_terms / delivery_terms / incoterm 收口
│   ├── 客户付款凭证口径收口
│   └── QT/SC 审批派生口径收口
├── 第二步：补最小必要缺口字段
│   ├── AR自动化时间锚点
│   ├── Finance核销时间锚点
│   ├── 样品附件/反馈
│   ├── 商检明确字段
│   └── 开票归档主字段
└── 第三步：再评估是否做统一重构
    ├── 如果服务层收口已足够，则不急着重命名库字段
    ├── 如果某些同义字段持续制造歧义，再做定向 migration
    └── 严禁一次性大改所有历史字段
```

### 29.6 当前实施原则定稿

1. 不为了命名整齐而大面积改 Supabase。
2. 能沿用的字段就沿用，`md` 主动贴近稳定 Supabase。
3. 先统一“业务解释”和“服务层映射”，再决定是否迁移。
4. 只有真正影响主链自动化、审批审计、财务闭环的缺口字段，才优先进入 migration。

### 29.7 已执行的第一波服务层收口

```text
第一波已执行收口
├── 新增共用 helper
│   └── src/lib/services/businessFieldNormalization.ts
├── 已接入 salesQuotationService
│   ├── owner_* 统一读取/写入
│   └── trade_terms / delivery_terms / incoterm 统一映射
├── 已接入 contractOrderArServices
│   ├── owner_* 统一读取/写入
│   ├── trade_terms / incoterm 统一映射
│   └── 客户付款凭证口径统一映射
├── 已接入 purchaseOrderQuoteRequirementServices
│   ├── owner_* 统一读取/写入
│   ├── PR assigned_to 与 owner_* 收口
│   └── trade_terms / delivery_terms / incoterm 统一映射
└── 已完成构建校验
    └── npm run build 通过
```

### 29.8 已执行的第二波服务层收口

```text
第二波已执行收口
├── 审批派生口径统一
│   ├── currentApprovalStep
│   ├── currentApproverRole
│   └── requiresDirectorApproval
├── Portal付款状态派生口径统一
│   └── customerPortalPaymentStatus / customer_portal_payment_status
├── 清关/交付派生口径统一
│   └── shipmentReadinessStatus / shipment_readiness_status
├── 已接入服务
│   ├── salesQuotationService
│   ├── contractOrderArServices
│   ├── postContractExecutionServices
│   └── salesTodoCenterService
└── 已完成构建校验
    └── npm run build 通过
```

### 29.9 已执行的第三波服务层收口

```text
第三波已执行收口
├── 外部参与方派生口径统一
│   ├── forwarder
│   ├── truckCompany
│   ├── customsBroker
│   ├── inspectionAgency
│   └── driver
├── 归档/开票派生口径统一
│   ├── archiveStatus
│   ├── archivedAt
│   ├── archivedBy
│   ├── archiveNo
│   ├── invoiceNo
│   └── invoiceStatus
├── 交付异常派生口径统一
│   ├── exceptionType
│   ├── exceptionStatus
│   └── exceptionSeverity
├── 已接入服务
│   └── postContractExecutionServices
└── 已完成构建校验
    └── npm run build 通过
```

---

## 30. 当前整体状况复盘（阶段检查点）

这一节的目的只有一个：

- 给这份 `V1 定案稿` 建立一个清晰的阶段检查点
- 明确哪些已经完成，哪些还没完成，下一步应该先做什么
- 后续继续增补时，以本节为阶段基线，不再重复发散

### 30.1 当前整体状况

```text
当前整体状况
├── 架构层
│   ├── 已完成
│   │   ├── 顶层目标树
│   │   ├── 全链路业务主树
│   │   ├── 客户经营模型树
│   │   ├── 组织与角色树
│   │   ├── 页面与模块挂接树
│   │   └── 关键节点树
│   └── 结论
│       └── 全链路主骨架已经成型
├── 业务细化层
│   ├── 已完成
│   │   ├── PR/CG 双节点细化
│   │   ├── ING/QT/SC 等关键销售节点细化
│   │   ├── Shipment/Docs/Payment/Feedback/Repeat 后段节点细化
│   │   ├── 产前样/封样枝
│   │   ├── 订舱前决策枝
│   │   ├── 外部参与方枝
│   │   ├── 目的港清关验收枝
│   │   └── 开票归档枝
│   └── 结论
│       └── 主链关键业务枝已覆盖到可落地讨论层
├── 治理规则层
│   ├── 已完成
│   │   ├── 经营口径树
│   │   ├── 节点时限规则树
│   │   ├── Demo V5 对照增补树
│   │   ├── 审批治理枝（一）：QT/SC
│   │   └── 第一轮/第二轮字段治理规则
│   └── 结论
│       └── 规则层已有初步稳定口径
├── 数据与实现层
│   ├── 已完成
│   │   ├── 第一轮 Supabase 字段对齐盘点
│   │   ├── 字段口径对齐表 V1
│   │   ├── Supabase 变更回溯表（第一轮）
│   │   ├── 第二轮字段实施清单
│   │   ├── 第一波服务层收口
│   │   ├── 第二波服务层收口
│   │   └── 第三波服务层收口
│   └── 结论
│       └── 已从“只写文档”进入“文档+代码并行收口”
└── 当前阶段判断
    ├── 这份 md 已经不是草图
    ├── 已经具备“顶层架构总纲 + 节点设计 + 字段治理”的三层能力
    └── 可以作为后续产品、开发、数据对齐的母稿继续推进
```

### 30.2 已完成任务清单

```text
已完成任务
├── A. 总体架构定稿
│   ├── 顶层目标树
│   ├── 客户经营模型树
│   ├── 全链路业务主树
│   ├── 组织角色树
│   ├── 页面模块挂接树
│   └── 角色挂接总树
├── B. 关键节点定稿
│   ├── ING
│   ├── QR
│   ├── XJ
│   ├── BJ
│   ├── QT
│   ├── SC
│   ├── PR
│   ├── CG
│   ├── QC
│   ├── Shipment
│   ├── Docs
│   ├── Payment
│   ├── Feedback
│   └── Repeat
├── C. 关键业务增补枝
│   ├── PR/CG 双节点细化树
│   ├── 审批治理枝（一）：QT/SC
│   ├── SC -> AR -> 客户水单 -> 财务核销 -> Portal状态同步树
│   ├── 产前样与封样枝
│   ├── 订舱前决策枝
│   ├── 外部参与方枝
│   ├── 目的港清关验收枝
│   └── 开票归档枝
├── D. 规则与口径
│   ├── 经营口径树
│   ├── 节点时限规则树
│   ├── Demo V5 对照增补树
│   ├── 字段命名优先级规则
│   └── Supabase 对齐原则
├── E. 数据治理
│   ├── 第一轮 Supabase 字段对齐盘点
│   ├── 字段口径对齐表 V1
│   ├── Supabase 变更回溯表（第一轮）
│   ├── 第二轮字段实施清单
│   └── 已明确 A/B/C 三类字段处理方式
└── F. 已落代码的服务层收口
    ├── 第一波：owner / incoterm / 客户付款凭证
    ├── 第二波：审批派生 / Portal付款状态 / shipment readiness
    ├── 第三波：外部参与方 / 开票归档 / 交付异常
    └── 三波收口后均已通过 npm run build
```

### 30.3 当前未完成任务清单

```text
当前未完成任务
├── A. 文档层未补全枝
│   ├── 异常升级树（全量版）
│   ├── 审批树（全量版，不止 QT/SC）
│   ├── 事件/通知树
│   ├── 字段来源与回写树
│   ├── 权限树
│   ├── 审计日志树
│   ├── 三端联动树（客户端/供应商端/内部端）
│   └── KPI口径树
├── B. 业务层待继续细化
│   ├── Payment 子树可继续拆成 Deposit / Balance / AP
│   ├── Shipment 子树可继续拆成订舱/装柜/报关/开船/在途/清关/签收
│   ├── Docs 子树可继续拆成贸易单证/报关单证/收汇资料/退税资料
│   ├── project 客户模式专属子树还未充分展开
│   └── service_to_trade 专属转化树还可继续深化
├── C. 数据治理层未完成
│   ├── 第二轮 migration 真实缺口字段未执行
│   ├── 字段回写路径未系统梳理
│   ├── 事件触发字段未统一
│   ├── 页面读写字段责任边界未全部固化
│   └── 服务层收口清单还未形成独立执行台账
└── D. 实施层未完成
    ├── 还未进入第二轮代码收口
    ├── 还未开始 migration 清单落库
    ├── 还未开始角色页面按总树重排
    └── 还未开始管理看板按总树重构
```

### 30.4 当前阶段的计划

```text
当前阶段计划
├── 第一阶段：先补齐“治理与支撑枝”
│   ├── 异常升级树
│   ├── 审批树（全量）
│   ├── 事件/通知树
│   ├── 字段来源与回写树
│   ├── 权限树
│   └── 审计日志树
├── 第二阶段：完成“字段治理第二轮”
│   ├── 形成服务层收口总台账
│   ├── 确认真缺口字段
│   ├── 输出 migration 候选清单
│   └── 评估哪些可以继续只做映射
├── 第三阶段：进入“页面重排与模块重挂接”
│   ├── 区域主管监督台
│   ├── 采购主管驾驶舱
│   ├── 跟单员履约协调台
│   ├── 仓储/发运独立执行台
│   └── 各角色首页按总树重构
└── 第四阶段：再进入“AI / 事件自动化 / Portal联动深化”
    ├── AI预警
    ├── AI摘要
    ├── AI周报
    ├── Portal状态同步
    └── 外部角色协同自动化
```

### 30.5 下一步做什么（当前建议）

当前最合适的下一步，不是再发散角色，而是继续沿着治理主线补下面 4 棵树：

1. `异常升级树`
2. `审批树（全量版）`
3. `事件/通知树`
4. `字段来源与回写树`

原因：

- 业务主树和角色树已经足够完整
- 继续补更多业务枝，边际收益开始下降
- 现在最缺的是把“谁超时、谁升级、谁审批、谁写回”系统化
- 这 4 棵树补完后，整份定稿会从“架构总纲”进入“可直接指导实施”的阶段

### 30.6 当前执行建议

```text
当前执行建议
├── 先不急着做大规模 migration
├── 先把治理树补完整
├── 同时继续维护字段收口总台账
├── 后续每做一波代码实施
│   ├── 先对照本定稿
│   ├── 再更新本定稿
│   └── 再决定是否动 Supabase
└── 本稿当前状态
    ├── 可以继续增补
    ├── 可以指导产品结构
    ├── 可以指导字段治理
    └── 还未进入最终冻结版
```

---

## 31. 异常升级树（全量版）

这一棵树只回答四个问题：

- 什么算异常
- 谁先发现
- 谁先处理
- 多久不解决升级给谁

### 31.1 异常总树

```text
异常升级总树
├── A. 销售异常
│   ├── 客户开发异常
│   │   ├── 线索无人认领
│   │   ├── 新客户未首响
│   │   ├── 客户资料长期不完整
│   │   └── 高热度客户未推进
│   ├── ING异常
│   │   ├── ING长时间未澄清
│   │   ├── 已可下推未下推
│   │   ├── 频繁改派
│   │   └── 重点客户ING停滞
│   ├── QT异常
│   │   ├── QR超时未回传
│   │   ├── QT超时未发出
│   │   ├── QT发出后长期无反馈
│   │   ├── 报价过期未处理
│   │   └── 大额报价谈判僵住
│   └── SC异常
│       ├── SC未签署
│       ├── SC签署后定金未到
│       ├── 特殊条款未审批
│       └── 合同已生效但未转履约
├── B. 采购异常
│   ├── PR异常
│   │   ├── PR信息不完整
│   │   ├── PR未分配供应商
│   │   └── PR长期未转CG
│   ├── CG异常
│   │   ├── CG待审批超时
│   │   ├── CG已批未下单
│   │   ├── 供应商不接单
│   │   ├── 成本超预算
│   │   └── 交期无法满足
│   └── 供应商异常
│       ├── 无报价响应
│       ├── 连续延误
│       ├── 连续质量问题
│       └── 付款争议
├── C. 质量异常
│   ├── 待验货超时
│   ├── 验货不通过
│   ├── 重大缺陷
│   ├── 整改超时
│   └── 复验仍不通过
├── D. 出运与单证异常
│   ├── 订舱异常
│   │   ├── 船期异常
│   │   ├── 运价异常
│   │   └── 客户未确认运费
│   ├── 发运异常
│   │   ├── 装柜延误
│   │   ├── 报关异常
│   │   ├── 在途异常
│   │   └── 到港延误
│   ├── 清关异常
│   │   ├── 清关资料缺失
│   │   ├── 清关受阻
│   │   └── 目的港异常费用
│   └── 单证异常
│       ├── 缺关键单证
│       ├── 单证差错
│       ├── 收汇资料缺失
│       └── 退税资料不完整
├── E. 财务异常
│   ├── 定金逾期
│   ├── 尾款逾期
│   ├── 应付超时
│   ├── 低毛利异常
│   ├── 超账期客户
│   └── 高风险客户
└── F. 经营异常
    ├── 重点客户流失风险
    ├── 沉睡客户激活失败
    ├── service_to_trade 转化长期无进展
    ├── 某区域漏斗断层
    └── 某客户类型整体转化差
```

### 31.2 升级路径树

```text
异常升级路径
├── 业务员发现
│   ├── 先处理
│   ├── 到时未解决 -> 区域主管
│   └── 重大异常可直接拉主管
├── 采购员发现
│   ├── 先处理
│   ├── 到时未解决 -> 采购主管
│   └── 涉及客户承诺 -> 同步跟单员/销售
├── QC发现
│   ├── 先出报告
│   ├── 整改未闭环 -> 采购主管
│   └── 重大质量问题 -> 区域主管/销售总监
├── 跟单员发现
│   ├── 先协调
│   ├── 节点仍卡住 -> 对口负责人主管
│   └── 涉及交付承诺 -> 区域主管
├── 财务发现
│   ├── 先处理常规催收/付款
│   ├── 超账期/低毛利 -> CFO
│   └── 涉及客户关系 -> 同步销售/区域主管
└── 升级顶层
    ├── 区域主管无法解决 -> Sales_Director
    ├── 采购主管无法解决 -> CFO/CEO 视异常性质
    └── 重大项目/重大客户/重大财务风险 -> CEO
```

### 31.3 升级时限树

```text
异常升级时限
├── 24小时级
│   ├── 新客户未首响
│   ├── 新ING无人处理
│   └── 待验货无人排期
├── 48小时级
│   ├── ING未澄清
│   ├── QR未回传
│   ├── PR未处理
│   └── 单证缺失未补
├── 72小时级
│   ├── QT无反馈无动作
│   ├── CG待审批
│   ├── 整改无动作
│   └── 客户问题未响应
├── 7天级
│   ├── SC未签
│   ├── 定金未到
│   ├── 尾款临近未催收
│   └── 复购窗口未触达
└── 即时升级
    ├── 重大质量问题
    ├── 大额客户流失风险
    ├── 重大交付事故
    └── 超大额财务风险
```

---

## 32. 审批树（全量版）

这棵树把“哪些节点要审批、谁审批、驳回后怎么回流”完整挂出来。

### 32.1 审批总树

```text
审批总树
├── A. 销售审批
│   ├── QT审批
│   │   ├── 常规报价审批
│   │   ├── 特价审批
│   │   ├── 特殊付款条款审批
│   │   ├── 大额报价审批
│   │   └── 战略客户报价审批
│   └── SC审批
│       ├── 常规合同审批
│       ├── 特殊条款审批
│       ├── 特殊账期审批
│       ├── 大额合同审批
│       └── 战略客户合同审批
├── B. 采购审批
│   ├── CG审批
│   │   ├── 全量采购合同先走 Procurement_Manager 一审
│   │   ├── 采购金额 > 100000 CNY 进入 CEO 二审
│   │   ├── 特殊供应商审批
│   │   ├── 特殊付款条件审批
│   │   └── 特殊交期审批
│   └── PR校验
│       ├── 不是正式审批
│       ├── 只校验完整性
│       ├── 只校验供应商分配
│       └── 只校验是否可生成CG
├── C. 财务审批
│   ├── 大额付款审批
│   ├── 例外付款审批
│   ├── 超账期放行审批
│   └── 异常低毛利放行审批
└── D. 单证/归档审批
    ├── 特殊资料放行
    ├── 例外归档审批
    └── 特殊开票审批
```

### 32.2 审批路径树

```text
审批路径
├── 一审
│   ├── 区域主管
│   ├── 采购主管
│   └── 财务负责人
├── 二审
│   ├── Sales_Director
│   ├── CFO
│   └── 特殊情况下 CEO
└── 审批结果
    ├── 通过
    ├── 驳回
    ├── 退回补充
    └── 升级审批
```

### 32.3 驳回与回流树

```text
驳回与回流
├── QT驳回
│   ├── 回流到 Sales_Rep 修订报价
│   ├── 必要时回流 QR 重取成本
│   └── 保留驳回意见和时间
├── SC驳回
│   ├── 回流到 Sales_Rep 修订合同
│   ├── 必要时回流 QT 重新谈判
│   └── 保留条款差异说明
├── CG驳回
│   ├── 回流 Procurement 修订采购条件
│   ├── 必要时回流 PR 重新拆分供应商
│   └── 保留供应商/条款驳回原因
└── 财务驳回
    ├── 回流到 Finance 补票据
    ├── 回流到 Sales_Rep 处理客户条款
    └── 回流到 Procurement 处理供应商付款条件
```

---

## 33. 事件/通知树

这棵树回答的是“什么事件触发什么通知，通知给谁”。

### 33.1 事件总树

```text
事件总树
├── A. 创建事件
│   ├── 新线索创建
│   ├── 新客户建档
│   ├── 新ING
│   ├── 新QT
│   ├── 新SC
│   ├── 新PR
│   ├── 新CG
│   └── 新QC单
├── B. 状态变化事件
│   ├── QT已发送
│   ├── QT已接受
│   ├── SC已签
│   ├── 定金已收
│   ├── CG已批准
│   ├── QC通过
│   ├── 已订舱
│   ├── 已开船
│   ├── 已到港
│   ├── 已签收
│   ├── 尾款已收
│   └── 已归档
├── C. 异常事件
│   ├── 首响超时
│   ├── QR超时
│   ├── QT超时无反馈
│   ├── CG延误
│   ├── QC不通过
│   ├── 清关异常
│   ├── 超账期
│   └── 重大客户风险
└── D. 提醒事件
    ├── 下次跟进到期
    ├── 复购窗口到期
    ├── 审批待处理
    ├── 单证缺失
    └── 回访未完成
```

### 33.2 通知目标树

```text
通知目标
├── Sales_Rep
│   ├── 待跟进
│   ├── 待报价
│   ├── 待合同
│   ├── 客户付款状态变化
│   └── 交付节点变化
├── Regional_Manager
│   ├── 超时客户
│   ├── 未分配
│   ├── 审批待处理
│   ├── 重点客户异常
│   └── 团队漏斗异常
├── Procurement / Procurement_Manager
│   ├── 待询价
│   ├── 待审批CG
│   ├── 供应商异常
│   └── 交期风险
├── QC
│   ├── 待验货
│   ├── 待复验
│   └── 待报告
├── Order_Coordinator
│   ├── 节点超时
│   ├── 单证未齐
│   ├── 订舱/出运异常
│   └── 到港/清关异常
├── Documentation_Officer
│   ├── 缺文档
│   ├── 待归档
│   └── 退税资料未齐
├── Finance / CFO
│   ├── 定金/尾款到期
│   ├── 超账期
│   ├── 大额付款待审批
│   └── 低毛利异常
└── Customer Portal / Supplier Portal
    ├── 待上传凭证
    ├── 待确认运费
    ├── 待确认样品
    └── 状态同步通知
```

### 33.3 通知方式树

```text
通知方式
├── 系统待办
├── 站内消息
├── 看板预警
├── Portal状态提示
├── 邮件通知
└── 后续可扩展
    ├── WhatsApp
    └── 企业IM
```

---

## 34. 字段来源与回写树

这棵树是为了避免再出现“页面看起来改了，实际上没落库”的问题。

### 34.1 主字段来源树

```text
主字段来源树
├── 责任归属字段
│   ├── 来源动作：主管分配 / 改派
│   ├── 主字段：owner_user_id, owner_email, owner_name, owner_role
│   ├── 兼容字段：assigned_to
│   ├── 读取页面
│   │   ├── 主管监督台
│   │   ├── 业务员工作台
│   │   ├── 销售待办中心
│   │   └── 订单中心
│   └── 回写要求
│       ├── 分配后立即落库
│       ├── 列表与详情同步
│       └── 筛选与统计口径一致
├── 跟进字段
│   ├── 来源动作：业务员记录跟进
│   ├── 主字段
│   │   ├── last_follow_up_at
│   │   ├── next_follow_up_at
│   │   ├── follow_up_method
│   │   └── follow_up_result
│   ├── 读取页面
│   │   ├── 销售待办中心
│   │   ├── 主管监督台
│   │   └── 客户详情页
│   └── 回写要求
│       ├── 记录行为必须更新主单据摘要字段
│       └── 触发提醒引擎
├── 审批字段
│   ├── 来源动作：一审/二审审批
│   ├── 主字段
│   │   ├── approval_status
│   │   ├── approval_chain / approval_flow
│   │   ├── approval_notes
│   │   ├── rejection_reason
│   │   └── approved_at
│   ├── 读取页面
│   │   ├── QT/SC/CG详情
│   │   ├── 审批中心
│   │   └── 管理驾驶舱
│   └── 回写要求
│       ├── 审批动作写回历史
│       ├── 驳回回流路径明确
│       └── 派生状态同步刷新
├── 付款字段
│   ├── 来源动作：客户上传水单 / 财务核销
│   ├── 主字段
│   │   ├── deposit_proof
│   │   ├── deposit_payment_proof
│   │   ├── balance_payment_proof
│   │   ├── customer_portal_payment_status（派生）
│   │   └── finance_verified_payment_at（候选）
│   ├── 读取页面
│   │   ├── Customer Portal
│   │   ├── 财务工作台
│   │   └── 销售待办中心
│   └── 回写要求
│       ├── 上传动作写文件与状态
│       ├── 核销动作写验证状态
│       └── Portal状态同步
├── 订舱与出运字段
│   ├── 来源动作：运费确认 / 订舱 / 开船 / 在途更新
│   ├── 主字段
│   │   ├── incoterm / trade_terms / delivery_terms（收口）
│   │   ├── freight_confirmation_required
│   │   ├── freight_confirmed_by_customer_at
│   │   ├── booking_status
│   │   ├── shipping_order_status
│   │   └── clearance_status
│   ├── 读取页面
│   │   ├── Shipment中心
│   │   ├── 跟单协调台
│   │   ├── 销售交付视图
│   │   └── 客户端状态页
│   └── 回写要求
│       ├── 节点更新必须写时间
│       ├── 异常必须写原因
│       └── 清关状态与签收状态不能只做前端态
└── 归档与异常字段
    ├── 来源动作：归档 / 异常登记 / 异常关闭
    ├── 主字段
    │   ├── archive_status
    │   ├── archiveNo（派生/候选）
    │   ├── exceptionType
    │   ├── exceptionStatus
    │   └── exceptionSeverity
    ├── 读取页面
    │   ├── 单证中心
    │   ├── 跟单协调台
    │   ├── 财务合规中心
    │   └── 管理预警看板
    └── 回写要求
        ├── 异常必须可关闭
        ├── 归档必须可追溯
        └── 管理看板读聚合，不直接拼前端态
```

### 34.2 回写责任树

```text
回写责任树
├── Sales_Rep
│   ├── 跟进记录
│   ├── 客户状态
│   ├── QT/SC主业务内容
│   └── 回访/复购计划
├── Regional_Manager
│   ├── 分配/改派
│   ├── 重点客户标签
│   └── 主管介入记录
├── Procurement / Procurement_Manager
│   ├── PR/CG条件
│   ├── 供应商信息
│   ├── 成本与交期
│   └── 采购异常
├── QC
│   ├── 验货状态
│   ├── 报告
│   └── 整改结论
├── Order_Coordinator / Warehouse_Ops
│   ├── 节点时间轴
│   ├── 在途状态
│   └── 清关/签收进度
├── Documentation_Officer
│   ├── 文档状态
│   ├── 归档状态
│   └── 单证缺失项
└── Finance
    ├── 收款/付款
    ├── 核销状态
    ├── 发票/票据
    └── 财务风险标记
```

---

## 35. 权限树

这棵树只解决一件事：

- 谁能看
- 谁能改
- 谁能审批
- 谁只能协同不能主改

### 35.1 权限总树

```text
权限总树
├── A. 战略决策层权限
│   ├── CEO
│   │   ├── 可看全局
│   │   ├── 可看所有区域
│   │   ├── 可看重大项目与重大风险
│   │   └── 一般不直接改业务单据
│   ├── Sales_Director
│   │   ├── 可看全部销售链
│   │   ├── 可看全部区域销售数据
│   │   ├── 可审批二审销售单据
│   │   └── 可介入重点客户
│   └── CFO
│       ├── 可看全财务链
│       ├── 可看利润/回款/账期
│       ├── 可审批高风险财务动作
│       └── 可看相关单证与归档资料
├── B. 经营管理层权限
│   ├── Regional_Manager
│   │   ├── 可看本区域全部销售客户与订单
│   │   ├── 可分配/改派本区域客户
│   │   ├── 可看本区域履约关键节点
│   │   ├── 可审批一审销售单据
│   │   └── 不直接改财务主数据
│   └── Procurement_Manager
│       ├── 可看全部采购单
│       ├── 可看供应商画像
│       ├── 可审批 CG
│       ├── 可改采购条件
│       └── 不直接改销售合同主数据
├── C. 业务执行层权限
│   ├── Sales_Rep
│   │   ├── 可看自己名下客户与单据
│   │   ├── 可建/改 ING, QT, SC 草稿
│   │   ├── 可记录跟进与回访
│   │   ├── 不可审批自己的单
│   │   └── 不可改他人 owner
│   ├── Sales_Assistant
│   │   ├── 可看协同范围内客户与单据
│   │   ├── 可补资料
│   │   ├── 可设提醒
│   │   └── 不可改核心商务条款
│   ├── Procurement
│   │   ├── 可处理 PR / CG
│   │   ├── 可改供应商和采购条件草稿
│   │   ├── 可发起验货
│   │   └── 不可审批自己 CG
│   ├── QC
│   │   ├── 可看验货相关订单
│   │   ├── 可写验货结果
│   │   └── 不可改商务/财务字段
│   ├── Order_Coordinator
│   │   ├── 可看履约全节点
│   │   ├── 可写时间轴和异常
│   │   └── 不可改审批结果
│   ├── Warehouse_Ops
│   │   ├── 可写发运和在途状态
│   │   └── 不可改销售/采购核心条件
│   ├── Documentation_Officer
│   │   ├── 可写单证状态和归档状态
│   │   └── 不可改合同金额
│   └── Finance
│       ├── 可写收款/付款/票据/核销
│       ├── 可看合同金额与付款条件
│       └── 不可改销售审批结论
└── D. 外部门户权限
    ├── Customer Portal
    │   ├── 可看自身订单状态
    │   ├── 可上传付款凭证
    │   ├── 可确认样品/运费/签收
    │   └── 不可看内部审批和利润
    └── Supplier Portal
        ├── 可看自身被分配采购任务
        ├── 可回传报价/交期/完工
        ├── 可上传供应商资料
        └── 不可看客户信息全量
```

### 35.2 权限原则树

```text
权限原则
├── owner 原则
│   ├── 谁负责谁可主改
│   ├── 上级可分配/改派
│   └── 他人默认只读或协同
├── 审批隔离原则
│   ├── 发起人不能审批自己
│   ├── 一审与二审分离
│   └── 财务审批与销售审批分离
├── 最小必要原则
│   ├── 只给完成职责所需权限
│   ├── 外部门户仅给必要外显字段
│   └── 跨部门默认读，不默认改
└── 审计原则
    ├── 所有关键改动留痕
    ├── owner 变更留痕
    ├── 审批留痕
    └── 财务留痕
```

---

## 36. 审计日志树

这棵树解决“谁在什么时候改了什么”。

### 36.1 审计事件总树

```text
审计事件总树
├── A. 责任归属审计
│   ├── 分配
│   ├── 改派
│   ├── 协办绑定
│   └── 主管介入
├── B. 销售主链审计
│   ├── ING创建/编辑/下推
│   ├── QT生成/发送/修订
│   ├── SC生成/签署/生效
│   └── 丢单/搁置记录
├── C. 审批审计
│   ├── 提交审批
│   ├── 一审通过/驳回
│   ├── 二审通过/驳回
│   └── 审批意见变更
├── D. 采购履约审计
│   ├── PR生成/校验
│   ├── CG生成/审批/关闭
│   ├── 供应商切换
│   └── 交期改动
├── E. 质量与交付审计
│   ├── QC结果
│   ├── 订舱状态变化
│   ├── 在途状态变化
│   ├── 清关状态变化
│   └── 签收状态变化
└── F. 财务与归档审计
    ├── 收款核销
    ├── 付款确认
    ├── 发票生成
    ├── 归档完成
    └── 风险标签变化
```

### 36.2 审计字段树

```text
审计字段
├── actor_id / actor_email / actor_role
├── entity_type
├── entity_id
├── action
├── before_value
├── after_value
├── changed_fields
├── reason
├── source
│   ├── 内部页面
│   ├── Customer Portal
│   ├── Supplier Portal
│   └── 自动化任务
└── occurred_at
```

---

## 37. 三端联动树

三端指：

- 内部端
- 客户端
- 供应商端

### 37.1 三端角色树

```text
三端联动总树
├── 内部端
│   ├── 销售
│   ├── 采购
│   ├── QC
│   ├── 跟单
│   ├── 单证
│   └── 财务
├── 客户端
│   ├── 上传付款凭证
│   ├── 确认报价/合同
│   ├── 确认样品
│   ├── 确认运费
│   ├── 查看发运状态
│   ├── 确认签收
│   └── 提交反馈/复购需求
└── 供应商端
    ├── 回传报价
    ├── 回传交期
    ├── 回传完工
    ├── 上传资料
    ├── 确认整改
    └── 查看被分配采购任务
```

### 37.2 三端状态同步树

```text
三端状态同步
├── 内部端 -> 客户端
│   ├── QT已发送
│   ├── SC已生效
│   ├── Shipment状态
│   ├── 到港/清关状态
│   └── 回访/复购提醒
├── 客户端 -> 内部端
│   ├── 付款凭证上传
│   ├── 样品确认
│   ├── 运费确认
│   ├── 签收确认
│   └── 客户反馈/新需求
├── 内部端 -> 供应商端
│   ├── PR/CG分配
│   ├── 规格要求
│   ├── 交期要求
│   ├── 验货要求
│   └── 整改要求
└── 供应商端 -> 内部端
    ├── 报价回传
    ├── 交期回传
    ├── 完工回传
    ├── 资料上传
    └── 整改反馈
```

---

## 38. KPI口径树

这棵树的目标是统一管理看板口径。

### 38.1 销售KPI树

```text
销售KPI
├── 开发类
│   ├── 新线索数
│   ├── 合格线索率
│   ├── 新客户数
│   └── 客户转ING率
├── 转化类
│   ├── ING->QT率
│   ├── QT->SC率
│   ├── SC->Shipment率
│   └── Shipment->Payment率
├── 效率类
│   ├── 首响时长
│   ├── ING停留时长
│   ├── QT反馈周期
│   └── 平均成交周期
└── 经营类
    ├── 复购率
    ├── 扩品率
    ├── 老客贡献占比
    └── service_to_trade 转化率
```

### 38.2 履约KPI树

```text
履约KPI
├── 采购类
│   ├── PR转CG率
│   ├── 准时下单率
│   ├── 交期达成率
│   └── 供应商合格率
├── 质量类
│   ├── 首检通过率
│   ├── 复验率
│   ├── 重大缺陷率
│   └── 整改关闭时长
├── 出运类
│   ├── 订舱准时率
│   ├── 出运准时率
│   ├── 在途异常率
│   └── 签收确认率
└── 单证类
    ├── 单证完整率
    ├── 单证差错率
    ├── 齐套时长
    └── 归档及时率
```

### 38.3 财务KPI树

```text
财务KPI
├── 回款类
│   ├── 定金及时率
│   ├── 尾款及时率
│   ├── 超账期率
│   └── 平均回款周期
├── 应付类
│   ├── 应付准时率
│   ├── 对账差异率
│   └── 付款异常率
├── 利润类
│   ├── 毛利率
│   ├── 区域利润率
│   ├── 客户利润率
│   └── 低毛利异常占比
└── 风险类
    ├── 高风险客户占比
    ├── 现金流压力指数
    └── 大额逾期金额
```

---

## 39. 冻结前复盘（V1）

这一节的目标不是继续长树，而是给当前这版总稿一个清楚的冻结判断：

- 哪些已经可以算 `V1 冻结范围`
- 哪些还属于 `V1 后续增强`
- 当前是否还有“主骨架级硬缺口”

### 39.1 主链复盘

```text
主链复盘
├── 客户开发段
│   ├── 已覆盖
│   │   ├── 线索
│   │   ├── 客户建档
│   │   ├── 首响/跟进
│   │   └── 转ING
│   └── 判断
│       └── 可纳入 V1 冻结
├── 销售转化段
│   ├── 已覆盖
│   │   ├── ING
│   │   ├── QR
│   │   ├── XJ
│   │   ├── BJ
│   │   ├── QT
│   │   └── SC
│   └── 判断
│       └── 可纳入 V1 冻结
├── 采购履约段
│   ├── 已覆盖
│   │   ├── PR
│   │   ├── CG
│   │   ├── 产前样
│   │   ├── 封样
│   │   └── 供应商/交期/采购审批
│   └── 判断
│       └── 可纳入 V1 冻结
├── 出运交付段
│   ├── 已覆盖
│   │   ├── 订舱前决策
│   │   ├── Shipment
│   │   ├── Docs
│   │   ├── 外部参与方
│   │   └── 目的港清关验收
│   └── 判断
│       └── 可纳入 V1 冻结
└── 回款反馈段
    ├── 已覆盖
    │   ├── SC -> AR -> 水单 -> 核销
    │   ├── Payment
    │   ├── Feedback
    │   ├── Repeat
    │   └── 开票归档
    └── 判断
        └── 可纳入 V1 冻结
```

### 39.2 角色复盘

```text
角色复盘
├── 已覆盖核心角色
│   ├── CEO
│   ├── Sales_Director
│   ├── CFO
│   ├── Regional_Manager
│   ├── Sales_Rep
│   ├── Sales_Assistant
│   ├── Procurement_Manager
│   ├── Procurement
│   ├── QC
│   ├── Order_Coordinator
│   ├── Warehouse_Ops
│   ├── Documentation_Officer
│   ├── Finance
│   └── Marketing_Ops
├── 已覆盖外部角色
│   ├── Customer Portal
│   ├── Supplier Portal
│   ├── Supplier
│   ├── Forwarder
│   ├── Truck Company / Driver
│   ├── Customs Broker
│   └── Inspection Agency
└── 判断
    └── 核心角色层面无明显硬缺口
```

### 39.3 治理树复盘

```text
治理树复盘
├── 已覆盖
│   ├── 经营口径树
│   ├── 节点时限规则树
│   ├── 异常升级树
│   ├── 审批树
│   ├── 事件/通知树
│   ├── 字段来源与回写树
│   ├── 权限树
│   ├── 审计日志树
│   ├── 三端联动树
│   └── KPI口径树
└── 判断
    └── 治理主树已具备 V1 冻结条件
```

### 39.4 当前仍不纳入 V1 冻结的部分

```text
不纳入 V1 冻结
├── A. 深化但非骨架缺口
│   ├── project 模式专属更细子树
│   ├── service_to_trade 专属更细转化树
│   ├── Payment 再拆 Deposit / Balance / AP
│   ├── Shipment 再拆更细物流泳道
│   └── Docs 再拆更细资料泳道
├── B. 实施层动作
│   ├── 第二轮 migration
│   ├── 页面按总树重排
│   ├── 看板重构
│   └── Portal 联动深化
└── C. AI深化
    ├── AI预警
    ├── AI摘要
    ├── AI周报
    └── AI预测
```

### 39.5 冻结判断

```text
冻结判断
├── 主骨架
│   └── 可以冻结
├── 主角色
│   └── 可以冻结
├── 主节点
│   └── 可以冻结
├── 治理主树
│   └── 可以冻结
├── 字段治理第一阶段规则
│   └── 可以冻结
└── 当前结论
    ├── 可将当前版本标记为：总挂接树 V1 骨架冻结版
    ├── 后续新增默认进入“V1 增强”而非改动主骨架
    └── 除非发现主链硬缺口，否则不再随意改动骨架命名
```

### 39.6 V1 之后的正确推进方式

```text
V1 之后推进方式
├── 第一步：冻结骨架
│   ├── 不再随意改主节点命名
│   ├── 不再随意改角色边界
│   └── 不再随意改治理树主结构
├── 第二步：建立实施清单
│   ├── 服务层继续收口
│   ├── migration 候选清单
│   ├── 页面重挂接清单
│   └── 看板重构清单
├── 第三步：增补只进增强层
│   ├── project 深化
│   ├── service_to_trade 深化
│   ├── AI 深化
│   └── Portal 深化
└── 第四步：所有实施反向更新总稿
    ├── 先实施
    ├── 再回写文档
    └── 保持母稿和代码同步
```
