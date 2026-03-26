# 业务员待办中心 节点 vs 现有 ERP 真实表字段对照表

## 一、目的

这份对照表用于回答一个核心问题：

**业务员待办中心方案，是否严格按本 ERP 系统现有真实业务表和真实字段来。**

这里不再讨论抽象设计，而是逐个节点对照：

1. 这个节点在现有 ERP 中由哪张表承载
2. 现有字段是否足够
3. 是否已经能聚合成业务员待办
4. 如果不够，还缺什么

---

## 二、正式业务主链范围

本对照只覆盖业务员真正负责的链路：

`ING -> QR -> QT -> SC -> 客户付款/验货/监装 -> 到港/清关/收货 -> 反馈/结案`

其中采购链：

`PR -> XJ -> BJ -> CG`

属于业务员的上下文链，不是业务员的主动作链。

---

## 三、节点对照表

## 3.1 ING 新询价待响应

### 业务含义

- 客户发起 `ING`
- 已提交
- 指派给某业务员
- 等业务员首次响应

### 现有真实对象

- `Inquiry`

### 现有字段

- `id`
- `inquiryNumber`
- `isSubmitted`
- `status`
- `salesRepEmail`
- `assignedTo`
- `buyerInfo.contactPerson`
- `buyerInfo.companyName`
- `createdAt/date`

### 是否足够支撑待办

- **基本足够**

### 当前缺口

- 缺正式“最近联系时间”
- 缺正式“下次跟进时间”
- 缺正式“业务员跟进日志”

### 结论

- `ING` 节点可以直接进入业务员待办中心
- 但要形成真正业务员待办，仍需要补行为层日志

---

## 3.2 ING 待澄清

### 业务含义

- 业务员已看到 `ING`
- 但客户需求还不完整
- 待进一步沟通澄清

### 现有真实对象

- `Inquiry`

### 现有字段

- `status`
- `notes`
- `requirements/details`

### 是否足够支撑待办

- **部分足够**

### 当前缺口

- 缺专门的“澄清状态”字段
- 缺“已完成澄清”的回写字段
- 缺联系过程日志

### 结论

- 可以先按 `status/notes` 派生轻待办
- 若要稳定，后续应补专门的澄清跟进行为记录

---

## 3.3 QR 待成本回传

### 业务含义

- 业务员已发起 `QR`
- 等采购/内部返回成本或方案

### 现有真实对象

- `Quotation Request Context / QR 相关对象`

### 现有字段

- 存在 `QR` 对象与上下文
- 已有 `QR` 编码进入正式主链

### 是否足够支撑待办

- **部分足够**

### 当前缺口

- 需要明确现有真实表名与稳定字段口径
- 需要明确：
  - `qr_no`
  - `status`
  - `sales_owner`
  - `responded_at`

### 结论

- 方向上有对象
- 但在当前现网里，`QR` 是业务员待办中最需要再核表的一段

---

## 3.4 QT 待发送

### 业务含义

- `QT` 已批准
- 还没正式发给客户

### 现有真实对象

- `SalesQuotation`

### 现有字段

- `id`
- `qtNumber`
- `approvalStatus`
- `customerStatus`
- `salesPerson`
- `customerCompany`
- `customerName`
- `contactPerson`
- `createdAt`
- `sentAt`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 无核心缺口
- 只缺业务员的跟进行为日志

### 结论

- 这是最适合直接接入业务员待办的节点之一

---

## 3.5 QT 待客户反馈

### 业务含义

- `QT` 已发送
- 客户尚未确认、拒绝或协商完成

### 现有真实对象

- `SalesQuotation`

### 现有字段

- `approvalStatus`
- `customerStatus`
  - `sent`
  - `viewed`
  - `negotiating`
  - `accepted`
  - `rejected`
  - `expired`
- `sentAt`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 缺客户最近回复日志层
- 缺业务员联系日志层

### 结论

- `QT` 待反馈可以直接作为业务员待办核心来源

---

## 3.6 SC 待客户签署

### 业务含义

- `SC` 已生成/已发送
- 客户尚未最终确认签署

### 现有真实对象

- `SalesContract`

### 现有字段

- `id`
- `contractNumber`
- `status`
- `customerCompany`
- `customerName`
- `contactPerson`
- `sentAt/updatedAt`

### 是否足够支撑待办

- **基本足够**

### 当前缺口

- 要核对 `status` 具体枚举是否稳定承载：
  - 已发送
  - 待客户确认
  - 客户已确认

### 结论

- 可以纳入待办
- 需要在服务层对合同状态做明确映射

---

## 3.7 SC 待客户定金

### 业务含义

- `SC` 已确认
- 按约定应由客户支付定金/首款

### 现有真实对象

- `SalesContract`
- 财务付款确认链

### 现有字段

- `SalesContract.status`
- 相关定金状态字段
- 财务确认对象

### 是否足够支撑待办

- **部分足够**

### 当前缺口

- 需要明确哪个字段是“客户定金已到账”正式口径
- 业务员能跟进，但不能代替财务确认

### 结论

- 这是业务员待办里的“可跟进节点”
- 但最终确认必须挂财务链

---

## 3.8 待确认验货方式

### 业务含义

- 完货后
- 客户需选择：
  - 我方 QC
  - 客户第三方验货

### 现有真实对象

- `purchase_order_execution`

### 现有字段

- `inspection_mode`
- `inspection_feedback_status`

### 是否足够支撑待办

- **基本足够**

### 当前缺口

- 业务员侧缺跟进日志
- 客户回复缺单独行为层承载

### 结论

- 可以进入待办
- 需要日志层增强“已联系/客户已选择”

---

## 3.9 待安排第三方验货

### 业务含义

- 客户选择第三方验货
- 但尚未安排或未确认安排结果

### 现有真实对象

- `purchase_order_execution`

### 现有字段

- `inspection_mode`
- `inspection_feedback_status`

### 是否足够支撑待办

- **基本足够**

### 当前缺口

- 缺机构/预约/客户确认的独立日志结构
- 缺业务员跟进过程留痕

### 结论

- 可以先作为协同待办
- 若要真正精细化，需要后续补第三方验货行为结构

---

## 3.10 待安排第三方监装

### 业务含义

- 装柜前客户要求第三方监装
- 尚未安排或未确认

### 现有真实对象

- `purchase_order_execution`

### 现有字段

- `loading_supervision_mode`
- `loading_supervision_feedback_status`

### 是否足够支撑待办

- **基本足够**

### 当前缺口

- 缺第三方监装机构/预约/跟进留痕

### 结论

- 可纳入业务员待办
- 但协同过程数据还偏轻

---

## 3.11 待客户付款

### 业务含义

- 客户付款未完成
- 业务员需要催办

### 现有真实对象

- `purchase_order_execution`

### 现有字段

- `collection_control_mode`
- `customer_balance_gate_status`
- `customer_payment_received_at`
- `customer_payment_confirmed_at`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 无核心字段缺口
- 仅缺业务员“催款动作”留痕层

### 结论

- 可直接形成业务员待办

---

## 3.12 待客户确认海运费/船期

### 业务含义

- 需客户确认运费/船期方案后才能继续

### 现有真实对象

- `purchase_order_execution`

### 现有字段

- `freight_confirmation_required`
- `freight_confirmed_by_customer_at`
- `booking_responsibility`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 只缺业务员联系日志

### 结论

- 可直接形成待办

---

## 3.13 待客户确认到港

### 业务含义

- 到港通知已发送
- 客户未确认收到/知悉

### 现有真实对象

- `arrival_notices`

### 现有字段

- `arrival_notice_no`
- `arrival_notice_status`
- `sent_to_customer_at`
- `arrival_at`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 只缺业务员跟进动作层

### 结论

- 可直接作为交付后待办来源

---

## 3.14 待清关资料

### 业务含义

- 客户尚未提供或确认清关相关资料

### 现有真实对象

- `import_clearance_coordination`

### 现有字段

- `clearance_status`
- 代理/联系人/备注

### 是否足够支撑待办

- **部分足够**

### 当前缺口

- 需要进一步明确“待客户资料”状态字段是否稳定

### 结论

- 可以先轻接入
- 但要在实现前再核一次该表字段

---

## 3.15 待收货回执

### 业务含义

- 客户是否已确认收货

### 现有真实对象

- `delivery_confirmations`

### 现有字段

- `customer_confirmed`
- `delivered_at`
- `receiver_name`
- `received_quantity`
- `has_damage`
- `has_shortage`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 只缺业务员的联系日志

### 结论

- 可直接形成待办

---

## 3.16 待客户反馈

### 业务含义

- 客户收货后尚未提交反馈

### 现有真实对象

- `post_order_feedback`

### 现有字段

- `submitted_at`
- `overall_rating`
- `quality_issue`
- `packaging_issue`
- `delivery_issue`
- `summary`

### 是否足够支撑待办

- **足够**

### 当前缺口

- 只缺业务员“已邀请反馈”与“已催反馈”日志

### 结论

- 可直接接入待办

---

## 四、对照总结

### 1. 已经有较强现网支撑的节点

这些节点现有 ERP 真实表字段已经比较完整：

- `ING` 新询价待响应
- `QT` 待发送
- `QT` 待客户反馈
- `SC` 待客户签署
- 待客户付款
- 待客户确认海运费/船期
- 待客户确认到港
- 待收货回执
- 待客户反馈

### 2. 现网部分足够，但仍需再核字段或补行为层的节点

- `ING` 待澄清
- `QR` 待成本回传
- `SC` 待客户定金
- 待确认验货方式
- 待安排第三方验货
- 待安排第三方监装
- 待清关资料

### 3. 当前最核心缺口

不是主业务表不够，而是：

- 缺正式的业务员跟进日志层
- 缺正式的客户回复日志层

也就是说：

**主链对象大多已经存在，真正缺的是业务员行为层。**

---

## 五、最终结论

### 结论 1

业务员待办中心的设计方向，**大体是按现有 ERP 正式业务流程和正式对象来的**。

### 结论 2

但它还不是“完全不新增任何行为层对象就能直接落地”的程度。

### 结论 3

当前最合理的落地方式不是新造通用待办主表，而是：

1. 复用现有真实业务主表
2. 新增最小行为层：
   - `sales_follow_up_logs`
   - `sales_customer_reply_logs`
3. 由服务层实时聚合业务员待办

### 结论 4

所以这套方案可以说：

- **严格按主链**
- **基本对齐现网**
- **但需要最小行为层补充**

而不能说：

- 完全不新增任何对象就能直接成立

---

## 六、下一步建议

如果继续往前走，最合理的下一步是：

- 先把 `sales_follow_up_logs`
- `sales_customer_reply_logs`

做成正式 migration 草案，再进入服务层设计。
