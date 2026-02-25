# 客户端ERP系统蓝图（最终定稿 v1）

## 1. 产品定位（最终结论）
- 客户端定位为完整的客户侧国际贸易 ERP，而非仅采购门户。
- Tracking 是核心执行控制域，但不是系统容器。
- 采用统一产品形态：不区分“有ERP客户/无ERP客户”两套系统。
- 有自有ERP客户通过接口与本系统双向打通；无ERP客户直接将本系统作为主系统使用。

## 2. 当前阶段约束
- 暂不改动、删除左侧现有模块与导航结构。
- 本阶段以“能力增强 + 内部重构 + 统一规则底座”推进。

## 3. 核心业务目标
- 从采购下单到到港、入库、上架形成端到端闭环。
- 客户可在系统中管理向我方采购，也可管理向第三方供应商采购。
- 支持验货服务场景，并支持偶发的代订舱附加服务。
- 覆盖财务能力（AP/AR/对账/费用/税汇/现金流）形成可经营闭环。

## 4. 系统模块边界（目标态）
1. 客户主数据与CRM
- 客户档案、联系人、地址、税务信息、币种与条款。

2. 采购与供应商管理
- 采购需求、询价、报价、比价、下单、变更、取消。
- 多供应商协同（含我方与第三方）。

3. 合同与单证中心
- 合同、PI、CI、PL、BL、COO、保险、报关资料。
- 版本化、审批、签署、归档、追溯。

4. Tracking Control Tower（执行控制域）
- 里程碑时间轴、异常中心、SLA、ETA偏差、责任人闭环。
- 与采购、单证、财务、仓储域联动。

5. 仓储与履约
- 到港、收货、GRN（入库）、Putaway（上架）、批次与库存状态。

6. 财务中心
- AP、AR、核销、费用分摊、发票、汇率与税费、现金流视图。

7. 服务模块（附加能力）
- 验货服务（重要场景）。
- 代订舱（附加服务，不做独立主入口）。

8. 集成中心
- API / Webhook / 文件交换（SFTP/CSV）。
- 同步监控、重试、告警、字段映射管理。

## 5. 业务模式策略
- Supply Mode（主流）：完整采购供货流程。
- QC Service Mode（重要）：独立验货申请与报告闭环。
- Booking Agent Service（偶发附加）：依附常规客户流程，不独立成主入口。

## 6. 数据治理红线（必须）
1. 手动删除 = 永久删除
- 所有列表统一规则。
- 通过 tombstone 实现防复现。
- 删除后不可被备份恢复或同步回灌复活。

2. 双编号强映射
- 每个业务对象维护 `internalNo/internalId` 与 `externalNo/externalId`。
- 映射关系必须可追溯、可审计、可检索。
- 流程推进时要求映射完整性（可按节点配置是否强制）。

3. 全链路审计
- 记录谁、何时、修改内容、修改原因、关联证据。

## 7. Tracking标准阶段（统一语义）
- Inquiry
- Quotation
- Contract/PO
- Production
- Pre-shipment QC
- Booking & Dispatch
- Ocean/Air Transit
- Customs Clearance
- Port to Warehouse
- GRN（收货入库）
- Putaway（上架）
- Post-order Feedback
- Product Review

说明：当前前端 9 张卡片可作为阶段化展示入口，后续逐步对齐上述完整标准阶段模型。

## 8. 每阶段最小字段契约
- `plannedAt`
- `actualAt`
- `owner`
- `status`（not_started / in_progress / blocked / completed）
- `source`（manual / system / api / edi）
- `evidence[]`（附件、照片、回执）
- `updatedBy`
- `updatedAt`

## 9. 客户端 ↔ Admin Portal 同步原则
1. 同步范围
- 非敏感字段：双向实时或准实时同步。
- 敏感字段（如利润率、内部审批意见）：默认不跨端同步。

2. 同步机制
- 事件驱动为主（Event Bus/Webhook） + 拉取兜底。
- 幂等键、防重放、冲突处理（时间戳 + 权威优先级）。
- 失败重试与告警可观测。

3. 关键事件（示例）
- `INQUIRY_SUBMITTED`
- `QUOTATION_SENT`
- `CONTRACT_APPROVED`
- `ORDER_CONFIRMED`
- `QC_PASSED`
- `SHIPMENT_BOOKED`
- `BL_UPLOADED`
- `GRN_CONFIRMED`
- `PUTAWAY_DONE`
- `PAYMENT_CONFIRMED`

## 10. 财务域最小可用范围（MVP）
- AP：供应商账单、付款计划、付款执行、账龄。
- AR：开票、回款、核销。
- 费用：运费、保险、关税、杂费分摊至订单/SKU。
- 对账：订单-发票-收货三单匹配。
- 汇率税务：基础换汇与税额拆分。

## 11. 前端工程拆分标准
- 禁止“超大单文件TSX”承载全部逻辑。
- 采用领域目录拆分：
  - `modules/procurement/*`
  - `modules/documents/*`
  - `modules/tracking/*`
  - `modules/finance/*`
  - `modules/warehouse/*`
  - `modules/integration/*`
- 每域至少分层：`types` / `services` / `hooks` / `components` / `pages`。
- 业务规则进入 `services/hooks`，页面仅负责渲染与交互。

## 12. 分阶段实施路线
### Phase 1（当前进行）
- 冻结蓝图与数据契约。
- 统一删除永久化规则（全域 tombstone）。
- 统一双编号映射底座。
- 完成关键页面真实数据化与基础一致性修复。

### Phase 2
- 建立集成中心基础能力（接口、映射、同步监控）。
- 补齐 Tracking 时间轴、异常中心、SLA。
- 补齐到港、GRN、Putaway 节点联动。

### Phase 3
- 上线财务MVP（AP/AR/对账/费用）。
- 打通核心单证链路与财务联动。

### Phase 4
- 深化服务模块（QC服务、偶发代订舱）。
- 完善管理层看板（OTIF、周期、异常关闭时效）。

## 13. 验收标准（v1）
- 删除后刷新/重登/跨端同步均不复现。
- 内外部编号可在关键列表与详情中对应展示。
- 主链路节点状态真实、可追溯、可审计。
- Tracking数据与Admin Portal在非敏感字段上保持一致性。
- 代码结构满足模块化拆分，不再新增超大TSX耦合实现。
