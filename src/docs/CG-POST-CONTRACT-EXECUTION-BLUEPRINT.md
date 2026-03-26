# 后段蓝图（CG后履约与财务归档实施蓝图）

## 1. 目标

本文档用于冻结 `CG` 之后的真实业务主线与开发主线，避免后续开发只做局部页面或遗漏关键节点。

本文档内部简称：

- `后段蓝图`

本蓝图明确两条并行主线：

- 主线A：`CG之后的履约执行主线`
- 主线B：`财务合规文件包主线`

原则：

- A 主线负责推动业务履约。
- B 主线跟随 A 主线自动沉淀文件与凭证。
- B 不替代 A，A 也不能忽略 B。

---

## 2. CG语义统一

系统内统一语义：

- `PR / CQ`：内部采购请求
- `CG`：对供应商生效的采购合同 / Purchase Contract

后续开发与文档中，不再把 `CG` 称为“采购请求”。

---

## 3. 主线A：CG之后的履约执行主线

```text
CG生效
-> 采购付款
-> 产前样 / 封样
-> 正式生产
-> 供应商自检
-> 验货方式判断
-> 我方QC验货 或 客户指定第三方验货
-> 完货确认
-> 客户尾款
-> 供应商尾款
-> 是否直装 / 拼柜
-> 国内集货 / 转运
-> 到货清点
-> 装柜计划
-> 监装方式判断
-> 装柜执行 / 第三方监装（如需）
-> 出口要求判定
-> 商检 / CO / 熏蒸（如需）
-> CI / PL / 报关资料
-> 报关
-> 开船 / BL
-> 在途跟踪
-> 到港通知
-> 清关 / 提货
-> 客户收货
-> 交付异常处理 / 客诉
-> 结案
-> 客户线上产品反馈
-> 业务归档完成
```

### 3.0 标准节点清单（不可跳步基线）

为避免后续开发只盯当前页面而跳过主线，`CG -> 最终结束` 统一按下列节点清单校验。

说明：

- `必经`：所有后段业务都必须经过的节点。
- `条件`：按业务条件触发，不命中则显式标记为 `not_required / skipped_by_rule`，不能静默省略。
- `挂B`：该节点会触发主线B财务包的文件归集、生成或待上传任务。

| 序号 | 节点 | 类型 | 说明 | 挂B |
|------|------|------|------|------|
| 1 | `CG生效` | 必经 | 采购合同审核、发出、回签并生效 | D07 起点 |
| 2 | `采购付款` | 必经 | 定金/中期/尾款申请、审批、支付 | D07 |
| 3 | `产前样` | 条件 | 有打样要求时进入 | - |
| 4 | `封样确认` | 条件 | 样品确认后才能批量生产 | - |
| 5 | `正式生产` | 必经 | 工厂进入生产执行 | - |
| 6 | `供应商自检` | 必经 | 供应商上传自检结论与附件 | - |
| 7 | `验货方式判断` | 必经 | 显式选择 `我方QC` 或 `客户指定第三方验货` | - |
| 8 | `我方QC验货安排` | 条件 | 仅在选择我方 QC 时创建 QC 验货任务 | - |
| 9 | `我方QC验货执行` | 条件 | QC 到场验货并沉淀结果 | - |
| 10 | `客户指定第三方验货` | 条件 | 客户自定 BV/SGS/其它机构，ERP 记录机构、预约、状态、附件引用 | D05 附件引用 |
| 11 | `完货确认` | 必经 | 基于我方 QC 或客户第三方验货结果确认可出运 finished goods | - |
| 12 | `通知客户完货 / 验货方式` | 必经 | 通知客户完货，并明确我方 QC 报告流转或客户自验/第三方验货方式 | D05 附件引用 |
| 13 | `客户尾款 / 收款控制点` | 条件 | 按付款条款催收/到账，但时间点受收款控制模式约束 | D11 |
| 14 | `供应商尾款` | 条件 | 按采购付款条件支付 | D07 |
| 15 | `履约模式判断` | 必经 | 直装 / 拼柜 / 多点装柜判断 | D03 / D04 准备 |
| 16 | `国内集货/转运` | 条件 | 需要拼柜或中转时生成国内转运单 | D03 / D04 |
| 17 | `到货清点` | 条件 | 接收方清点、差异处理 | D03 附件引用 |
| 18 | `订舱询价 / 货比三家` | 条件 | 在需要我方订舱时，保存货代、船公司、海运费、船期等比价记录 | D09 准备 |
| 19 | `客户确认海运费 / 船期` | 条件 | FOB 等场景下，客户需先确认海运费和船期后才能订舱 | D09 / 客户确认佐证 |
| 20 | `下 Shipping Order / 港口备案` | 条件 | 确认货代和报价后，下 SO，必要时完成出货港备案 | D05 / D09 |
| 21 | `装柜计划` | 必经 | 建柜计划、柜型、截港，并承接已确认订舱 | D05 准备 |
| 22 | `监装方式判断` | 必经 | 显式选择 `常规装柜` 或 `第三方监装` | - |
| 23 | `装柜执行` | 必经 | 柜号、封签号、空柜/半柜/满柜照片 | D05 附件引用 |
| 24 | `第三方监装` | 条件 | 如客户要求第三方监装到场，记录机构、到场、见证、报告 | D05 附件引用 |
| 25 | `出口要求判定` | 必经 | 商检/CO/熏蒸/监装报告判断 | D05/D06/D08/D09/D10 准备 |
| 26 | `商检` | 条件 | 产品/国家命中监管要求时触发，且必须在报关前完成 | D05 |
| 27 | `原产地证 CO` | 条件 | 客户或目的国要求时触发 | D05 |
| 28 | `熏蒸证书` | 条件 | 木包装或国家要求时触发，且必须在报关前完成 | D05 |
| 29 | `CI / PL / 报关资料` | 必经 | 形成报关基础单证 | D05 |
| 30 | `报关` | 必经 | 报关行申报、海关放行 | D05 / D06 / D08 |
| 31 | `开船 / BL` | 必经 | 开船后取得 BL 和国际运费资料 | D05 / D09 / D10 |
| 32 | `在途跟踪` | 必经 | 航次、ETA、异常事件跟踪 | - |
| 33 | `到港通知` | 必经 | 到港提醒客户/代理 | - |
| 34 | `清关 / 提货` | 条件 | 由客户、代理或协同方完成 | - |
| 35 | `客户收货` | 必经 | POD、签收、是否异常 | - |
| 36 | `交付异常处理 / 客诉` | 条件 | 延误、短少、破损、错发、清关卡住 | 索赔附件引用 |
| 37 | `结案` | 必经 | 责任、补件、赔付或处理动作收口 | - |
| 38 | `客户线上产品反馈` | 必经 | 最终闭环节点，不与前段 customer feedback 混用 | - |
| 39 | `业务归档完成` | 必经 | 主线A关闭，同时主线B应已归档 | Packet 归档完成 |

### 3.0.1 开发校验规则

- 后续每开发一个节点，都必须回答：它在上表中是第几个节点。
- 如果当前实现跳过了前置节点，必须明确说明是 `暂未实现` 还是 `条件不命中`。
- 对 `条件` 节点，不允许直接缺失，只能是：
  - `required`
  - `not_required`
  - `skipped_by_rule`
- 当某个节点会触发主线B文件沉淀时，必须同时定义：
  - 自动生成
  - 自动归集
  - 外部上传
  - 财务确认版本
  这四种处理方式中的一种或多种。

### 3.0.2 当前已落地到真实系统的节点

- 已落地：`CG生效后执行层`
- 已落地：`供应商确认接单`
- 已落地：`供应商自检`
- 已落地：`我方QC验货安排 / QC结果提交`
- 已建库待接入：`完货确认`
- 已建库待接入：`国内集货 / 装柜 / 出口要求判定`
- 已建库待接入：`开船后跟踪 / 到港 / 清关 / 收货 / 客户线上反馈`

### 3.0.2A 对齐 V5 后的主线复核结论（2026-03-21）

基于 `FullProcessSandboxV5` 与当前真实实现复核，当前主线A可以分成三类：

- 已形成真实业务骨架并已有页面入口：
  - `1 CG生效`
  - `5 正式生产`
  - `6 供应商自检`
  - `7 验货方式判断`
  - `8 我方QC验货安排`
  - `9 我方QC验货执行`
  - `10 客户指定第三方验货`
  - `11 完货确认`
  - `12 通知客户完货 / 验货方式`
  - `15 履约模式判断`
  - `16 国内集货/转运`
  - `17 到货清点`
  - `18 订舱询价 / 货比三家`
  - `19 客户确认海运费 / 船期`
  - `20 下 Shipping Order / 港口备案`
  - `21 装柜计划`
  - `22 监装方式判断`
  - `23 装柜执行`
  - `24 第三方监装`
  - `25 出口要求判定`
  - `26 商检`
  - `27 原产地证 CO`
  - `28 熏蒸证书`
  - `29 CI / PL / 报关资料`
  - `30 报关`
  - `31 开船 / BL`
  - `32 在途跟踪`
  - `33 到港通知`
  - `34 清关 / 提货`
  - `35 客户收货`
  - `36 交付异常处理 / 客诉`
  - `38 客户线上产品反馈`

- 已有散落模块或基础能力，但尚未显式挂入统一 `CG -> 最终结束` 主线：
  - `2 采购付款`
  - `3 产前样`
  - `4 封样确认`
  - `13 客户尾款 / 收款控制点`
  - `14 供应商尾款`

- 目前仍需补成“显式节点动作”的关闭类节点：
  - `37 结案`
  - `39 业务归档完成`

当前复核判断：

- 后半段从 `供应商自检 -> 装柜 -> 报关 -> 开船 -> 在途 -> 到港 -> 清关 -> 收货 -> 反馈` 已经基本形成真实骨架。
- 仍需继续补齐的不是更多新节点，而是把 `产前样/封样`、`付款控制点`、`结案/归档完成` 这三组节点从“散落能力”收成统一主线动作。
- 后续每次继续推进时，应优先检查这三组是否被遗漏。

### 3.0.3 收款控制点分支（QC后必须判定）

`QC验货后` 不能把“客户尾款”固定在同一个时间点，必须按收款方式分支。

统一原则：

- `订舱/装货` 是物流动作。
- `放单/交单` 是单证控制动作。
- `收汇` 是财务动作。
- 三者先后顺序由 `payment collection mode / 收款控制模式` 决定。

建议系统新增统一口径：

- `collection_control_mode`
- `document_release_mode`
- `customer_balance_gate_status`

推荐值：

- `prepaid_before_booking`
- `post_tt_before_obl_release`
- `lc_bank_negotiation`
- `dp_or_other_collection`

#### A. 前 T/T

定义：

- 出货前收全款
- 余款到账后再订舱

主线应为：

`完货确认`
-> `催收客户余款`
-> `确认余款到账`
-> `订舱 / 装货`
-> `开船 / BL`
-> `放单给客户`

系统控制点：

- 未收齐余款，不允许进入 `booking_confirmed`
- 未收齐余款，不允许进入 `loading_confirmed`

#### B. 后 T/T

定义：

- 定金 + 出货后收余款
- 可以订舱装货
- 但在给客户正本提单前，必须收齐余款

主线应为：

`完货确认`
-> `订舱 / 装货`
-> `开船 / BL`
-> `催收客户余款`
-> `确认余款到账`
-> `放正本提单 / 放单`

系统控制点：

- 可以进入 `booking_confirmed`
- 可以进入 `loaded`
- 可以进入 `shipped`
- 但未收齐余款，不允许 `release_original_bl_to_customer`

#### C. L/C

定义：

- `定金 + L/C`
- 或 `100% L/C`
- 订舱装货后，提交单证给银行收款，再给客户正本提单单证

主线应为：

`完货确认`
-> `确认 L/C 生效 / 可用`
-> `订舱 / 装货`
-> `开船 / BL`
-> `缮制交单文件`
-> `交单银行`
-> `银行议付 / 收汇`
-> `放单给客户`

系统控制点：

- 若 L/C 未落实，不允许出运
- 出运后必须进入 `bank_document_submission`
- 未完成银行交单/议付，不允许客户侧正本单证放行

#### D. D/P 或其它托收

定义：

- `定金 + D/P / 其它`
- 或 `100% D/P / 其它`
- 可以订舱装货，之后按托收方式控制单据交付

主线应为：

`完货确认`
-> `订舱 / 装货`
-> `开船 / BL`
-> `托收交单`
-> `客户付款 / 承兑`
-> `放单`

系统控制点：

- 可以先出运
- 但单证释放要受 `collection result` 控制

#### 对后段蓝图的直接影响

- 节点 `11 客户尾款` 必须理解为“客户付款控制点”，不是固定发生在订舱前。
- 节点 `24 报关`、`25 开船 / BL` 前后顺序，要受 `collection_control_mode` 约束。
- 后续必须增加两个真实节点：
  - `bank / collection document submission`
  - `document release to customer`
- `BL` 不等于“自动给客户”，必须区分：
  - `bl_issued`
  - `bl_released_to_customer`
  - `document_set_released`

### 3.0.4 QC后完货通知与验货结果流转

在 `供应商自检 -> 我方QC验货 -> 完货确认` 这一段，必须再补两个动作：

- `通知客户完货`
- `通知客户验货方式`

规则如下：

- 如果是 `我方QC验货`
  - 我方通过 ERP 把验货结果报告流转给客户
  - 客户后续付款、订舱、放单判断可以引用我方报告
- 如果是 `客户自行安排第三方验货`
  - ERP 只记录“客户自验 / 客户第三方验货”
  - 第三方如何把报告交给客户，不属于我方 ERP 的流转责任
  - 我方 ERP 只保留状态与必要佐证，不强行要求客户第三方报告回流我方系统

因此，主线中 `我方QC验货` 和 `客户自验` 必须区分，不能混成一个“验货通过”状态。

### 3.0.5 订舱与装柜必须拆成两个节点

`订舱` 和 `装柜` 不是同一个节点，后续开发必须分开：

- `订舱`
  - 决定谁来订、何时订、是否等待费用确认
- `装柜`
  - 决定在哪装、怎么装、柜号/封签号/照片证据链

订舱责任判断规则：

- 如果是 `FOB`
  - 分两种：
    - 客户需先确认运费，我方才能订舱
    - 客户指定货代，我方代为订舱
- 如果是 `CNF/CFR` 或 `CIF`
  - 由我方订舱
  - 不需要客户再确认运费

因此后续应增加明确字段：

- `booking_responsibility`
- `freight_confirmation_required`
- `freight_confirmed_by_customer_at`
- `forwarder_assignment_mode`
- `freight_inquiry_status`
- `selected_booking_quote_id`
- `shipping_order_status`

并且主线A中，`订舱` 应作为 `装柜计划` 的前置控制节点。

### 3.0.7 订舱前必须保留海运询价 / 比价记录

在 `需要我方订舱` 的前提下，订舱前必须先做：

- 向多家货代询价
- 保留海运费、船期、船东/船公司记录
- 支持同一家货代提供 2-3 个船公司方案
- 形成最终采用方案

如果业务条件要求客户先确认海运费和船期，则必须先取得客户确认，再进入 `Shipping Order`。

因此后续系统必须支持：

- `booking_quote_requests`
- `booking_quote_options`
- `customer_confirmation_required`
- `customer_confirmed_at`

### 3.0.8 确认采用报价后要下 Shipping Order，必要时完成港口备案

在确认哪家货代、哪条船期方案后，主线A不能直接跳到装柜，必须补：

- `下 Shipping Order`
- `订舱确认`
- `港口备案（如需）`

因此后续系统必须支持：

- `shipping_orders`
- `port_filing_required`
- `port_filing_status`

### 3.0.9 商检和熏蒸必须发生在报关前

`商检` 和 `熏蒸` 都不是报关后的补录动作，而是：

- `出口要求判定`
- 如需：`商检`
- 如需：`熏蒸`
- `CI / PL / 报关资料`
- `报关`

后续任何实现都不能把商检或熏蒸挂到报关之后。

### 3.0.6 所有收款节点都必须以财务确认为准

所有收款节点，不以“业务员说客户已付”作为完成标准，统一以：

- `财务确认到款`

作为关口。

适用范围包括：

- 客户定金
- 客户余款
- 银行议付 / L/C 收汇
- D/P 或其它托收回款

因此后续系统控制必须统一遵循：

- `payment_received` 不等于 `payment_confirmed`
- 只有 `finance_confirmed_received = true`，才能通过收款控制点

建议统一补充字段：

- `customer_payment_received_at`
- `customer_payment_confirmed_at`
- `finance_confirmed_received_by`

以及对应状态：

补充口径：

- 在 `订舱前放行` 这个主线位置，`财务确认到款` 只适用于 `前 T/T`
- `后 T/T`、`L/C`、`D/P / 其它托收` 虽然同样需要财务确认回款，但它们的财务控制点不在订舱前，而在：
  - `后 T/T`：放正本提单 / 放单前
  - `L/C`：银行交单 / 议付 / 收汇环节
  - `D/P / 其它托收`：托收结果 / 放单环节

- `awaiting_finance_confirmation`
- `finance_confirmed`

### 3.1 阶段拆解

#### 阶段1：CG生效与采购付款

- `CG生成 -> 审核 -> 发送供应商 -> 供应商回签 -> 生效`
- `采购定金/尾款申请 -> 审批 -> 支付 -> 供应商确认到账`

#### 阶段2：生产与质控

- `产前样`
- `封样确认`
- `正式生产`
- `供应商自检并上传资料`
- `我方QC验货`
- `第三方验货 / 监装（按客户要求）`
- `验货报告上传`
- `完货确认`

#### 阶段3：客户回款与供应商尾款

- `完货通知客户`
- `客户查看验货报告`
- `客户支付尾款`
- `我方确认收汇`
- `支付供应商尾款`

#### 阶段4：履约模式判断

- `工厂直装直出`
- `供应商间拼柜中转`
- `第三方仓拼柜`
- `自营仓集中装柜（未来兼容）`

#### 阶段5：国内集货与到货清点

- `生成国内转运单`
- `确认国内运费`
- `确认承担方 / 垫付方 / 结算方`
- `供应商发货`
- `在途跟踪`
- `到货通知`
- `接收方清点收货`
- `异常处理`
- `进入待装柜池`

#### 阶段6：装柜计划与装柜执行

- `建立装柜计划`
- `确认船期 / 柜型 / 截港`
- `预约拖车`
- `如需，预约第三方监装`
- `现场装柜`
- `多点装柜`
- `最终封柜`
- `进港`

#### 阶段7：出口要求判定与单证准备

- `判断是否需要商检`
- `判断是否需要原产地证`
- `判断是否需要熏蒸`
- `判断是否需要第三方监装报告`
- `生成 CI / PL`
- `单证齐套预检查`

#### 阶段8：报关、开船、海运

- `报关申报`
- `海关放行`
- `获取报关单`
- `开船`
- `获取 BL`
- `海运在途跟踪`

#### 阶段9：到港、清关、交付

- `到港通知`
- `清关协同`
- `提货`
- `客户收货确认`
- `损坏 / 短少 / 延误异常`

#### 阶段10：业务关闭

- `交付异常收口`
- `结案`
- `客户线上产品反馈`
- `业务归档`

---

## 4. 主线B：财务合规文件包主线

```text
Packet建立
-> D07 采购合同/采购付款
-> D03 / D04 国内运输
-> D05 / D06 / D08 报关相关
-> D09 / D10 国际运费相关
-> D11 收汇水单
-> D12 结汇水单
-> D13 收汇凭证情况表
-> D01 退税申报表
-> 财务归档完成
```

### 4.1 财务包定位

财务侧不能继续在多个业务模块中零散找文件，必须按单票业务形成统一的：

- `Finance Compliance Packet / 财务合规文件包`

建议案卷口径：

- `SC No`
- `Shipment No`
- `Customs Declaration No`

最终以一个 `packet` 承载整票业务的财务合规资料。

### 4.2 D01-D13映射

| 编号 | 文件 | 处理方式 | 触发节点 |
|------|------|----------|---------|
| D01 | 出口退税申报表 | 系统自动生成 | D05+D11+D12+D13 齐套 |
| D02 | 购销合同/发票/付款凭证 | 自动归集 + 上传 | 合同/收付款 |
| D03 | 国内运输单据及运费凭证 | 自动归集 + 上传 | 国内集货 |
| D04 | 国内运费免责说明 | 系统自动生成 | 本方不承担国内运费 |
| D05 | 报关单/装箱单/提运单 | 自动归集 + 上传 | 报关/开船 |
| D06 | 委托报关合同及费用凭证 | 上传 + 自动关联付款 | 报关 |
| D07 | 采购发票及付款凭证 | 自动归集 + 上传 | CG/采购付款 |
| D08 | 报关费用免责说明 | 系统自动生成 | 本方不承担报关费用 |
| D09 | 国际运费发票及付款凭证 | 上传 + 自动关联付款 | 开船/国际运费 |
| D10 | 国际运费免责说明 | 系统自动生成 | 本方不承担国际运费 |
| D11 | 收汇水单 | 财务上传 | 收汇 |
| D12 | 结汇水单 | 财务上传 | 结汇 |
| D13 | 出口退（免）税收汇凭证情况表 | 系统自动生成 | D12 完成 |

---

## 5. 条件分支规则

### 5.1 非必经节点

以下节点必须做成条件触发，不允许设计成默认必经流程：

- 商检
- 原产地证 `CO`
- 熏蒸证书
- 第三方验货
- 第三方监装
- 国内拼柜
- 多点装柜

### 5.2 判定维度

- 产品规则
- HS Code / 监管要求
- 包装规则
- 客户要求
- 目的国要求
- Incoterm
- 实际费用承担方

### 5.3 核心判定字段

- `requires_inspection`
- `requires_co`
- `requires_fumigation`
- `requires_loading_inspection_report`
- `consolidation_required`
- `consolidation_mode`
- `loading_mode`
- `freight_charge_party`
- `freight_advance_party`
- `freight_settlement_party`
- `customs_charge_party`
- `intl_freight_charge_party`

---

## 6. 关键业务对象

### 6.1 主线A执行对象

- `Domestic Transfer Order`
- `Cargo Receipt`
- `Cargo Lot`
- `Container Load Plan`
- `Loading Task`
- `Loading Inspection Order`
- `Export Requirement Check`
- `Voyage Tracking`
- `Arrival Notice`
- `Import Clearance Coordination`
- `Delivery Confirmation`
- `Delivery Exception`

### 6.2 主线B文件对象

- `finance_compliance_packets`
- `finance_packet_document_slots`
- `finance_packet_files`

---

## 7. 国内集货与装柜执行要求

### 7.1 国内转运规则

国内拼柜前置段必须建模为独立业务对象，不允许仅写备注。

标准链路：

```text
确认转运需求
-> 确认国内物流商
-> 确认国内运费
-> 确认承担方 / 垫付方 / 结算方
-> 发货
-> 在途跟踪
-> 到货通知
-> 接收方清点
-> 异常处理
-> 进入待装柜池
```

对于 `多供应商集中到一个装柜点` 的场景，国内集货模块还必须额外沉淀：

- 各供应商内陆费询价与确认
- 承运商名称、联系人、联系电话、邮箱
- 司机姓名、司机电话、车牌
- 运费承担方 / 垫付方 / 最终结算方
- 接收方 / 接收仓库信息
- 接收人、接收人电话
- 仓库类型：供应商工厂 / 第三方仓 / 自有仓
- 仓库地址
- 与仓库或接收点的结算方、结算金额、结算状态

### 7.1.1 第三方仓库必须是独立模块，不只是服务商资料

现有 `ServiceProvider / 仓储公司` 只能解决“仓是谁”的主数据问题，不足以承载真实业务执行。

因此在后段蓝图里，`第三方仓库` 必须作为独立业务模块存在，至少覆盖：

- 第三方仓基础资料
  - 仓库名称
  - 仓库类型
  - 地址
  - 联系人
  - 联系电话
  - 邮箱
  - 可承接业务范围
- 集货接收
  - 接收通知
  - 到货登记
  - 接收人
  - 到货时间
  - 实收件数 / 数量
  - 差异 / 破损
- 待装柜池
  - 哪些供应商货物已到仓
  - 哪些还未到
  - 哪些货可进入装柜计划
- 仓库结算
  - 仓租
  - 装卸费
  - 操作费
  - 结算方
  - 结算状态
- 仓库与装柜协同
  - 预约装柜
  - 仓库装柜联系人
  - 仓库放货 / 配载说明

也就是说：

- `ServiceProviderManagement`
  - 继续作为第三方仓库主数据入口
- `Third-Party Warehouse Module`
  - 承担真实业务执行

两者不是二选一，而是：

- 前者管“仓库档案”
- 后者管“仓库业务”

### 7.2 装柜现场证据链

装柜任务必须记录：

- `container_no`
- `seal_no`
- `driver_name`
- `driver_phone`
- `vehicle_no`
- `supervisor_name`
- `arrived_at`
- `loading_started_at`
- `loading_finished_at`

必须支持固定照片槽位：

- 空柜照片
- 半柜内柜照片
- 装完后双门开照片
- 左门开照片
- 双门关照片

### 7.3 多点装柜规则

系统必须支持：

- 先在一个供应商装一部分
- 不打最终封签
- 拉到第二装柜点继续装柜
- 最后一站录入最终封签号
- 再进港

---

## 8. 第三方验货与第三方监装

系统必须支持第三方机构角色：

- `BV`
- `SGS`
- `TUV`
- 其它客户指定机构

### 8.1 第三方验货

适用于：

- 生产完成后的出货前验货
- 客户要求的独立质检

### 8.2 第三方监装

适用于：

- 装柜现场见证
- 监装报告上传
- 柜号 / 封签号见证

### 8.3 第三方相关资料

- 到场签到
- 监装现场照片
- 第三方报告
- 见证柜号
- 见证封签号

---

## 9. 文件来源通道规则

所有文件不能只记录“有无”，还必须记录“从哪里来、谁上传、是否被财务确认采用”。

### 9.1 统一来源模式

- `auto_generated`
- `auto_linked`
- `manual_admin_upload`
- `supplier_portal_upload`
- `partner_portal_upload`
- `finance_upload`

### 9.2 文件级字段

- `uploaded_from_portal`
- `uploaded_by_party_type`
- `uploaded_by_party_id`
- `origin_ref_type`
- `origin_ref_id`
- `is_primary_source`
- `verified_by_finance`
- `verified_at`

### 9.3 供应商发票双路径

供应商发票允许两条上传路径：

- 我方后台上传
- 供应商侧门户上传

最终规则：

- 两种来源都允许存在
- 财务端必须确认一份“有效版本”
- 有效版本作为 `current_file_id`

---

## 10. 节点与文件包挂接规则

### 10.1 CG生效

- 建立 `packet`
- 初始化 `D07`
- 自动归集 `CG`

### 10.2 采购付款

- 归集采购付款凭证
- 等待/归集供应商发票

### 10.3 国内集货

- 建 `D03`
- 判断是否生成 `D04`

### 10.4 报关

- 建 `D05`
- 建 `D06`
- 判断是否生成 `D08`

### 10.5 开船

- 归集 `BL`
- 建 `D09`
- 判断是否生成 `D10`

### 10.6 收汇

- 更新 `D11`

### 10.7 结汇

- 更新 `D12`
- 自动生成 `D13`

### 10.8 退税

- 依赖齐套后自动生成 `D01`

---

## 11. 数据库落地建议

### 11.1 第一批必须落地

- `domestic_transfer_orders`
- `domestic_transfer_order_items`
- `cargo_receipts`
- `cargo_receipt_items`
- `cargo_lots`
- `container_load_plans`
- `container_load_plan_items`
- `loading_tasks`
- `loading_task_items`
- `loading_inspection_orders`
- `export_requirement_checks`
- `finance_compliance_packets`
- `finance_packet_document_slots`
- `finance_packet_files`

### 11.2 第二批建议落地

- `voyage_tracking`
- `voyage_tracking_events`
- `arrival_notices`
- `import_clearance_coordination`
- `delivery_confirmations`
- `delivery_exceptions`

---

## 12. 前端模块落地建议

### 12.1 主线A

- 采购执行页
- 供应商生产/自检页
- QC 验货页
- 国内集货管理页
- 装柜计划页
- 装柜执行页
- 报关/开船页
- 在途/到港页

### 12.2 主线B

在财务模块新增独立入口：

- `Compliance Packets / 合规文件包`

不要只依赖现有零散模块：

- 付款记录
- 发运单证
- 文档中心

要让财务按单票业务看到：

- 已齐套
- 缺失文件
- 来源通道
- 当前有效版本

---

## 13. 开发优先级

### Phase 1：打通 CG 后执行起点

- `CG生效 -> 采购付款 -> 产前样/生产 -> 供应商自检 -> QC验货`

### Phase 2：打通国内集货与装柜

- `Domestic Transfer Order`
- `Cargo Receipt`
- `Cargo Lot`
- `Container Load Plan`
- `Loading Task`
- `Loading Inspection Order`

### Phase 3：打通报关与开船

- `Export Requirement Check`
- `CI/PL`
- 条件单证
- `BL`

### Phase 4：打通财务文件包

- `finance_compliance_packets`
- `D01-D13 槽位`
- 自动归集
- 自动生成免责说明
- 财务核验版本

### Phase 5：打通到港、清关、收货、归档

- 在途跟踪
- 清关协同
- 收货确认
- 异常处理
- 业务关闭

---

## 14. 与现有文档关系

本蓝图不是替代现有文档，而是对以下内容做统一收口：

- 现有单证体系设计：`documentation-system-design.md`
- 现有集成设计：`documentation-integration-architecture.md`
- 现有客户端蓝图：`client-erp-system-blueprint.md`

新增内容重点在于：

- 把 `CG后履约主线` 明确完整化
- 把 `财务合规文件包主线` 与履约主线绑定
- 补足国内集货、拼柜、多点装柜、第三方监装
- 固定文件来源通道与财务确认规则

---

## 15. 后续实施纪律

后续所有开发评审、表结构设计、页面新增、状态流转设计，必须先回答这三个问题：

1. 这个改动属于主线A还是主线B？
2. 它位于主线中的哪个节点？
3. 它会沉淀或消费哪类文件、凭证、证据？

如果答不清楚，不进入开发。

### 15.1 主线偏移控制

后续评审和开发过程中，必须始终锚定：

- 主线A：`CG之后的履约执行主线`
- 主线B：`财务合规文件包主线`

如果某项设计、讨论或开发工作连续偏离 A/B 主线达到 4 步，必须立即暂停并重新审视：

1. 这个话题是否仍服务于 A 或 B 主线？
2. 它是否已经变成旁支优化，而不是主线闭环必需项？
3. 它是否应该推迟到主线闭环之后再做？

如果答案不清楚，则回到主线当前节点继续推进。

---

## 16. 现有近似能力盘点与旧能力处理策略

本项目中已经存在一些“类似功能”，但成熟度和定位并不一致。后续实施必须先判断旧能力类型，再决定复用、迁移还是冻结。

### 16.1 现有能力分层

#### A类：真实业务骨架，可复用

这类能力已经进入真实业务链，可作为新主线的底座继续扩展：

- `purchase_orders (CG)` 及其现有状态流转
- `SalesContract -> PurchaseOrder` 下推逻辑
- 财务 `AR / AP / PaymentRecord` 真实管理入口
- 现有 `DocumentCenter` 模板与单证渲染能力
- 现有 `documentation-service` 事件触发骨架

处理原则：

- 保留并扩展
- 不推翻已有真实编号和关联关系
- 新模型优先挂到现有真实业务对象上

#### B类：半成品业务页面，可迁移升级

这类能力已经表达了业务意图，但数据结构较轻，暂未达到真实执行域要求：

- `DocumentsManagementCenter`
- `ShippingDocumentManagement`
- `FinanceManagement` 下的单证/付款/发运关联
- `FinanceContext` 中的收汇凭证、结汇凭证附件逻辑

处理原则：

- 保留入口和概念
- 逐步切换数据源
- 通过适配层迁移到新的 `packet / shipment / loading` 模型
- 避免新旧页面同时维护两份真数据

#### C类：工作台/样例/演示层，不作为真实数据源

这类能力适合保留为演示、培训、视觉参考，但不能继续承担真实流程主数据职责：

- `admin/workbenches/*`
- `FullProcessSandboxV5.tsx`
- 大量 mock 驱动的单证工作台、矩阵、明细页

处理原则：

- 冻结业务扩展
- 不再新增真实状态写入逻辑
- 如需保留，明确标记为 `demo / workbench / mock`
- 后续真实功能完成后，可作为 UI 参考进行改造或归档

### 16.2 旧能力逐项处理建议

#### 1. `documentation-service`

现状：

- 已有 D01-D13 事件触发概念
- 已有 `CONTRACT_SIGNED / PROCUREMENT_PAID / CUSTOMS_CLEARED / PAYMENT_RECEIVED / FX_SETTLED` 等事件监听
- 但当前还是“按 orderId 创建 document_instances”的轻量实现
- 尚未支持 `Finance Compliance Packet`
- 尚未支持多来源文件、财务确认版本、供应商侧上传、执行域联动

处理建议：

- 保留事件驱动思路
- 不直接废弃
- 升级为 `finance packet sync service`
- 让旧 `document_instances` 逐步退为兼容视图或迁移来源

#### 2. `DocumentsManagementCenter`

现状：

- 仅覆盖 `CI / PL / CO / customsDeclaration`
- 偏单证生成中心，不是财务合规包

处理建议：

- 保留为“贸易/报关单证生成中心”
- 不承担 D01-D13 全量文件包职责
- 未来与 `Finance Compliance Packet` 建立引用关系，而不是把它扩写成所有文件的唯一中心

#### 3. `DocumentCenter`

现状：

- 模板管理和文档渲染能力较强
- 已覆盖 `SC / CG / CI / PL` 等模板型文档

处理建议：

- 作为模板与文档输出引擎保留
- 新系统生成的 `CG / CI / PL / statement / waiver` 可以继续复用此能力
- 但文件包、版本确认、来源追踪要在新 packet 模型中管理

#### 4. `FinanceManagement` / `PaymentRecordManagement` / `FinanceContext`

现状：

- 已有真实财务入口
- `PaymentRecordManagement` 已表达“付款给供应商/报关行/货代/验货机构”等业务对象
- `FinanceContext` 已支持收汇证明附件
- 但尚未形成按单票出口业务统一归档

处理建议：

- 保留财务入口，不新建第二套财务门户
- 在 `FinanceManagement` 新增 `Compliance Packets` 标签
- `PaymentRecord` 继续作为付款主记录
- 通过关联规则把付款附件自动回填到 `D03 / D06 / D07 / D09`

#### 5. `ShippingDocumentManagement`

现状：

- 已有 `containerNo / sealNo / BL / customs / tracking` 等字段雏形
- 但仍偏 mock 数据视图
- 缺少国内集货、Cargo Lot、多点装柜、现场照片证据链

处理建议：

- 保留页面入口和部分字段命名
- 新增真实 `shipment + load plan + loading task` 数据层
- 逐步替换 mock 数据
- 原页面只保留为新数据模型的视图层

#### 6. `admin/workbenches/*`

现状：

- 覆盖 D01-D13、提醒、单证矩阵等完整体验
- 但以 mock 数据为主

处理建议：

- 停止作为真实主线继续扩写
- 保留用于 SOP 讨论、视觉参考、未来真实化改造参考
- 不作为数据库或状态流转设计依据

### 16.3 旧数据处理策略

后续如果新增真实表，旧数据处理遵循以下规则：

#### 规则1：真实主记录优先迁移，不双写长期并存

- `purchase_orders`
- `accounts_receivable`
- `payment_records`
- 真实模板版本与真实文档文件

这类数据优先迁移到新模型或建立正式映射。

#### 规则2：mock/workbench 数据不迁移，只保留演示

对于纯演示数据：

- 不做迁移脚本
- 不进入新主线
- 在 UI 上标记 demo 性质即可

#### 规则3：旧表如继续存在，必须明确角色

旧对象只允许三种角色：

- `source_of_truth`
- `compatibility_layer`
- `demo_only`

不允许“不知道是不是还在用”的灰色状态长期存在。

### 16.4 推荐迁移路径

#### 路径1：先接真实数据，再换页面

优先级：

1. 建新表和关联关系
2. 用适配器从旧入口写入新表
3. 让旧页面切换读取新数据
4. 最后移除旧 mock 数据

这样风险最小。

#### 路径2：文档中心与财务包解耦但联动

- `DocumentCenter` 负责模板生成
- `Finance Compliance Packet` 负责文件齐套与财务确认
- 两者通过 `origin_ref_type / origin_ref_id` 关联

#### 路径3：旧事件总线继续用，但事件语义升级

现有事件可继续保留，例如：

- `PROCUREMENT_PAID`
- `PAYMENT_RECEIVED`
- `FX_SETTLED`

但后续要补充：

- `SUPPLIER_SELF_INSPECTION_SUBMITTED`
- `QC_INSPECTION_PASSED`
- `DOMESTIC_TRANSFER_RECEIVED`
- `LOAD_TASK_COMPLETED`
- `THIRD_PARTY_LOADING_INSPECTION_UPLOADED`
- `FINANCE_PACKET_SLOT_VERIFIED`

### 16.5 开发时的判断口径

如果发现旧功能与新功能重复，按下列顺序判断：

1. 这个旧功能是否真实接 Supabase / API / 真实 Context？
2. 它是否是当前业务主线中的真实入口？
3. 它是否是 demo/workbench/mock？
4. 如果复用，复用的是页面、字段命名、还是状态机？
5. 如果不复用，是否要提供兼容读取或迁移？

只有判断完，才进入具体开发。

---

## 17. 第一批真实可用ERP表设计

本节不是 demo 结构，而是用于真实建库、真实迁移、真实前后端对接的第一批核心表设计。

设计原则：

- 尽量复用现有真实主表，不重复造第二个 `CG`
- 新能力优先以“执行层扩表 / 从表 / 关联表”方式落地
- 旧 mock/workbench 不进入真表设计

### 17.1 复用的现有真实表

#### `purchase_orders`

保留为 `CG` 主表，不新建第二张采购合同表。

现有表已具备：

- `id`
- `po_number`
- `cg_number`
- `sales_contract_id`
- `root_sales_contract_id`
- `supplier_*`
- `items`
- `payment_terms`
- `delivery_terms`
- `status`
- 模板快照字段

处理原则：

- `purchase_orders` 继续作为 `CG source_of_truth`
- 新增执行域表时全部通过 `purchase_order_id` 关联
- 不另起一张 `cg_contracts`

#### `payments`

保留为真实付款表，但后续要在业务语义上拆清：

- 采购付款
- 国内运费付款
- 报关费用付款
- 港杂费付款
- 国际运费付款
- 验货费用付款

处理原则：

- 继续保留 `payments`
- 后续增补费用分类字段或通过扩展表关联
- 不直接新建第二套付款主表

### 17.2 第一批新建表总览

第一批建议新建以下表：

- `purchase_order_execution`
- `supplier_inspection_reports`
- `qc_inspection_orders`
- `domestic_transfer_orders`
- `domestic_transfer_order_items`
- `cargo_lots`
- `cargo_receipts`
- `cargo_receipt_items`
- `container_load_plans`
- `container_load_plan_items`
- `loading_tasks`
- `loading_task_items`
- `loading_inspection_orders`
- `export_requirement_checks`
- `finance_compliance_packets`
- `finance_packet_document_slots`
- `finance_packet_files`

---

## 18. 字段级设计与旧能力处理

### 18.1 `purchase_order_execution`

用途：

- 为现有 `purchase_orders(CG)` 增加执行域，不污染原合同主表

主键与关联：

- `id`
- `purchase_order_id` -> `purchase_orders.id`

建议字段：

- `execution_status`
- `supplier_confirmed_at`
- `supplier_rejected_at`
- `supplier_reply_notes`
- `sample_required`
- `sample_confirmed_at`
- `production_started_at`
- `estimated_completion_date`
- `production_completed_at`
- `supplier_self_inspection_status`
- `qc_inspection_status`
- `finished_goods_confirmed_at`
- `customer_balance_status`
- `supplier_balance_status`
- `fulfillment_mode`
- `consolidation_required`
- `shipment_readiness_status`
- `remarks`
- `created_at`
- `updated_at`

建议状态值：

- `supplier_pending_confirmation`
- `supplier_confirmed`
- `sampling`
- `in_production`
- `supplier_self_inspection_pending`
- `supplier_self_inspection_submitted`
- `qc_pending`
- `qc_passed`
- `qc_failed`
- `finished_goods_ready`
- `awaiting_loading`
- `loaded`
- `shipped`
- `completed`

旧能力处理：

- 不把这些状态继续塞进 `purchase_orders.status`
- `purchase_orders.status` 保留合同级状态
- 执行态统一进入本表

### 18.2 `supplier_inspection_reports`

用途：

- 供应商自检资料与报告

建议字段：

- `id`
- `purchase_order_id`
- `report_no`
- `supplier_id`
- `inspection_date`
- `result`
- `summary`
- `defect_notes`
- `attachments`
- `submitted_by`
- `submitted_from_portal`
- `verified_by_qc`
- `verified_at`
- `created_at`
- `updated_at`

旧能力处理：

- 不使用备注字段替代正式报告
- 后续可与供应商门户上传打通

### 18.3 `qc_inspection_orders`

用途：

- 我方 QC 验货任务、结果、报告

建议字段：

- `id`
- `purchase_order_id`
- `inspection_no`
- `inspection_type`
- `scheduled_date`
- `inspector_id`
- `inspector_name`
- `status`
- `result`
- `factory_name`
- `inspection_location`
- `report_files`
- `photos`
- `third_party_agency_id`
- `third_party_agency_name`
- `remarks`
- `created_at`
- `updated_at`

旧能力处理：

- 现有验货页面可继续作为 UI 入口
- 真数据以本表为准，不再以页面内 mock 报告为准

### 18.4 `domestic_transfer_orders`

用途：

- 国内集货主单

建议字段：

- `id`
- `transfer_no`
- `purchase_order_id`
- `shipment_no`
- `source_party_type`
- `source_party_id`
- `source_location_id`
- `destination_party_type`
- `destination_party_id`
- `destination_location_id`
- `carrier_type`
- `carrier_id`
- `carrier_name`
- `driver_name`
- `driver_phone`
- `vehicle_no`
- `transport_mode`
- `pickup_date`
- `planned_arrival_date`
- `actual_departure_at`
- `actual_arrival_at`
- `tracking_no`
- `freight_currency`
- `freight_amount`
- `freight_charge_party`
- `freight_advance_party`
- `freight_settlement_party`
- `freight_payment_status`
- `status`
- `remarks`
- `created_at`
- `updated_at`

建议状态值：

- `draft`
- `freight_pending`
- `freight_confirmed`
- `picked_up`
- `in_transit`
- `arrived`
- `received`
- `exception_pending`
- `closed`
- `cancelled`

旧能力处理：

- 当前系统没有真实国内转运主单，直接新建
- 后续 `D03 / D04` 直接从本表和付款记录回填

### 18.5 `domestic_transfer_order_items`

用途：

- 国内转运明细

建议字段：

- `id`
- `transfer_order_id`
- `cargo_lot_id`
- `product_id`
- `product_name`
- `model_no`
- `packages`
- `quantity`
- `unit`
- `gross_weight`
- `net_weight`
- `volume_cbm`
- `packing_desc`
- `remarks`

### 18.6 `cargo_lots`

用途：

- 主线A最重要的货物批次对象

建议字段：

- `id`
- `cargo_lot_no`
- `purchase_order_id`
- `sales_contract_id`
- `source_supplier_id`
- `source_location_id`
- `current_location_type`
- `current_location_id`
- `final_loading_location_id`
- `product_id`
- `product_name`
- `model_no`
- `specification`
- `hs_code`
- `packages`
- `quantity`
- `unit`
- `gross_weight`
- `net_weight`
- `volume_cbm`
- `packing_type`
- `has_wood_packing`
- `requires_inspection`
- `requires_co`
- `requires_fumigation`
- `status`
- `ready_date`
- `loaded_at`
- `shipped_at`
- `remarks`
- `created_at`
- `updated_at`

建议状态值：

- `planned`
- `ready_at_supplier`
- `awaiting_transfer`
- `in_domestic_transit`
- `arrived_at_consolidation_point`
- `waiting_loading`
- `partially_loaded`
- `fully_loaded`
- `shipped`
- `cancelled`

旧能力处理：

- 当前没有统一货批对象，直接新建
- 后续 `PL` 与装柜分配从本表汇总

### 18.7 `cargo_receipts`

用途：

- 到货清点主单

建议字段：

- `id`
- `receipt_no`
- `transfer_order_id`
- `receipt_status`
- `receiver_party_type`
- `receiver_party_id`
- `receiver_location_id`
- `received_at`
- `received_by`
- `contact_phone`
- `expected_packages`
- `received_packages`
- `expected_quantity`
- `received_quantity`
- `damage_flag`
- `shortage_flag`
- `overage_flag`
- `variance_flag`
- `photo_files`
- `signed_files`
- `remarks`
- `created_at`
- `updated_at`

旧能力处理：

- 当前无正式收货清点单，直接新建

### 18.8 `cargo_receipt_items`

建议字段：

- `id`
- `receipt_id`
- `cargo_lot_id`
- `product_id`
- `product_name`
- `expected_packages`
- `received_packages`
- `expected_quantity`
- `received_quantity`
- `damage_qty`
- `shortage_qty`
- `remarks`

### 18.9 `container_load_plans`

用途：

- 装柜总计划

建议字段：

- `id`
- `load_plan_no`
- `shipment_no`
- `sales_contract_id`
- `status`
- `container_type`
- `container_count`
- `loading_mode`
- `consolidation_mode`
- `port_of_loading`
- `port_of_destination`
- `forwarder_id`
- `truck_company_id`
- `customs_broker_id`
- `planned_etd`
- `booking_cutoff_at`
- `planned_customs_cutoff_at`
- `planned_loading_date`
- `seal_required`
- `final_seal_no`
- `remarks`
- `created_at`
- `updated_at`

建议状态值：

- `draft`
- `cargo_collecting`
- `ready_for_loading`
- `loading_in_progress`
- `awaiting_final_seal`
- `sealed`
- `sent_to_port`
- `customs_in_progress`
- `released`
- `departed`
- `closed`

旧能力处理：

- `ShippingDocumentManagement` 的 shipment/card 视图可复用
- 真正装柜总计划统一以本表为准

### 18.10 `container_load_plan_items`

建议字段：

- `id`
- `load_plan_id`
- `cargo_lot_id`
- `loading_task_id`
- `planned_packages`
- `planned_quantity`
- `planned_weight`
- `planned_cbm`
- `load_sequence_no`
- `is_final_loaded`
- `remarks`

### 18.11 `loading_tasks`

用途：

- 单次装柜点执行任务

建议字段：

- `id`
- `loading_task_no`
- `load_plan_id`
- `sequence_no`
- `task_status`
- `loading_point_type`
- `loading_point_id`
- `loading_point_name`
- `truck_company_id`
- `container_no`
- `seal_status`
- `seal_no`
- `driver_name`
- `driver_phone`
- `vehicle_no`
- `supervisor_name`
- `scheduled_arrival_at`
- `actual_arrival_at`
- `loading_start_at`
- `loading_finish_at`
- `departed_at`
- `loaded_packages`
- `loaded_quantity`
- `loaded_weight`
- `loaded_cbm`
- `container_condition_ok`
- `container_clean_ok`
- `container_dry_ok`
- `odor_check_ok`
- `door_lock_ok`
- `floor_check_ok`
- `empty_container_photos`
- `half_loaded_inner_photos`
- `full_loaded_both_doors_open_photos`
- `left_door_open_photos`
- `both_doors_closed_photos`
- `remarks`
- `created_at`
- `updated_at`

建议状态值：

- `planned`
- `truck_dispatched`
- `arrived`
- `loading`
- `loaded`
- `departed_to_next_stop`
- `completed`
- `exception_open`

旧能力处理：

- `ShippingDocumentManagement` 中已有 `containerNo / sealNo` 字段概念，命名可保留
- 但真实数据必须改从本表读取

### 18.12 `loading_task_items`

建议字段：

- `id`
- `loading_task_id`
- `cargo_lot_id`
- `loaded_packages`
- `loaded_quantity`
- `remarks`

### 18.13 `loading_inspection_orders`

用途：

- 第三方监装 / 见证

建议字段：

- `id`
- `inspection_order_no`
- `load_plan_id`
- `loading_task_id`
- `agency_name`
- `agency_type`
- `inspector_name`
- `inspector_phone`
- `scheduled_at`
- `arrived_at`
- `completed_at`
- `inspection_status`
- `inspection_result`
- `witness_container_no`
- `witness_seal_no`
- `report_no`
- `report_files`
- `photos`
- `remarks`
- `created_at`
- `updated_at`

### 18.14 `export_requirement_checks`

用途：

- 报关前合规要求统一判定

建议字段：

- `id`
- `check_no`
- `sales_contract_id`
- `shipment_no`
- `load_plan_id`
- `destination_country`
- `trade_term`
- `customer_id`
- `requires_customs_declaration`
- `requires_inspection`
- `requires_co`
- `requires_fumigation`
- `requires_loading_inspection_report`
- `requires_other_docs`
- `other_doc_notes`
- `checked_by`
- `checked_at`
- `status`
- `created_at`
- `updated_at`

旧能力处理：

- 旧逻辑里很多判断散落在单证页和经验规则里
- 后续统一收敛到本表

### 18.15 `finance_compliance_packets`

用途：

- 单票业务财务合规总包

建议字段：

- `id`
- `packet_no`
- `export_case_no`
- `sc_no`
- `cg_no`
- `shipment_no`
- `load_plan_no`
- `customs_decl_no`
- `customer_id`
- `customer_name`
- `region`
- `currency`
- `trade_term`
- `destination_country`
- `status`
- `doc_ready_percent`
- `tax_refund_ready`
- `archived_at`
- `created_by`
- `created_at`
- `updated_at`

建议状态值：

- `draft`
- `collecting`
- `partially_ready`
- `ready_for_fx_docs`
- `ready_for_tax_refund`
- `archived`

旧能力处理：

- 不用 `document_instances` 直接替代本表
- `document_instances` 可作为兼容层或旧单证任务来源

### 18.16 `finance_packet_document_slots`

用途：

- D01-D13 固定槽位

建议字段：

- `id`
- `packet_id`
- `doc_code`
- `doc_name`
- `doc_category`
- `is_required`
- `requirement_rule`
- `source_type`
- `source_ref`
- `status`
- `current_file_id`
- `missing_reason`
- `generated_at`
- `confirmed_at`
- `confirmed_by`
- `notes`
- `created_at`
- `updated_at`

建议状态值：

- `not_required`
- `pending`
- `awaiting_upload`
- `awaiting_generation`
- `linked`
- `uploaded`
- `generated`
- `verified`
- `rejected`

### 18.17 `finance_packet_files`

用途：

- 单个槽位下的多版本文件

建议字段：

- `id`
- `packet_id`
- `slot_id`
- `version_no`
- `file_name`
- `file_type`
- `storage_bucket`
- `storage_path`
- `file_url`
- `origin_mode`
- `origin_ref_type`
- `origin_ref_id`
- `uploaded_from_portal`
- `uploaded_by_party_type`
- `uploaded_by_party_id`
- `is_primary_source`
- `verified_by_finance`
- `verified_at`
- `uploaded_at`
- `is_current`
- `remarks`

重点支持：

- 我方后台上传
- 供应商侧上传
- 合作方上传
- 财务上传
- 自动归集
- 自动生成

---

## 19. 新旧能力切换策略

### 19.1 页面不立刻重做，先换数据底座

顺序：

1. 先建真实表
2. 先接入真实写入
3. 再让现有页面改读新表
4. 最后淘汰旧 mock 数据

### 19.2 `document_instances` 的处理

建议定位改为：

- 旧单证任务兼容层

不建议继续扩展为未来主文件包模型。

后续方案：

- 新业务写 `finance_compliance_packets`
- 老页面如仍依赖 `document_instances`，通过适配器兼容读取

### 19.3 `DocumentsManagementCenter` 的处理

建议继续保留，但角色明确为：

- 贸易/报关文档生成页

不是：

- 全量财务合规案卷中心

### 19.4 `ShippingDocumentManagement` 的处理

建议保留页面与部分字段命名，但分三步切换：

1. 先把 `shipment` 数据改接真实表
2. 再补 `container_load_plans / loading_tasks`
3. 最后再接 `voyage tracking / delivery confirmation`

### 19.5 `PaymentRecordManagement` 的处理

建议继续作为付款主入口，不替换。

后续只做：

- 增补费用分类
- 增补来源业务单关联
- 自动回填到 `finance packet slots`

---

## 20. 实施优先级（真实ERP版）

### Sprint 1：CG执行与检验

- `purchase_order_execution`
- `supplier_inspection_reports`
- `qc_inspection_orders`

目标：

- 先把 `CG -> 生产 -> 自检 -> QC` 跑成真实链路

### Sprint 2：国内集货与装柜

- `domestic_transfer_orders`
- `cargo_lots`
- `cargo_receipts`
- `container_load_plans`
- `loading_tasks`
- `loading_inspection_orders`

目标：

- 让直装、第三方仓拼柜、供应商间拼柜都能落地

### Sprint 3：财务合规包

- `finance_compliance_packets`
- `finance_packet_document_slots`
- `finance_packet_files`
- 与 `payments / FinanceContext / documentation-service` 联动

目标：

- 让财务按业务案卷查看完整资料，不再满系统找附件

### Sprint 4：报关、开船、到港

- `export_requirement_checks`
- `voyage tracking`
- `arrival notice`
- `delivery confirmation`

目标：

- 打通 `装柜 -> 报关 -> 开船 -> 到港 -> 收货`
