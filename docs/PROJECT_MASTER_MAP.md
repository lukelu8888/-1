# COSUN ERP — Project Master Map

> 最后更新：2026-03-04  
> 维护规则：每完成一个切片，必须更新本文件对应状态行

---

## 一、业务流程全链路

```
ING（客户询价）
  ↓ 业务员下推"成本询报"
QR（报价请求：业务员→采购员，请帮我询价）        ← purchase_requirements 表（编号 QR-）
  ↓ 采购员发出询价
XJ（采购向供应商的询价单）                        ← supplier_xjs 表（编号 XJ-）
  ↓ 供应商回复
BJ（供应商报价）                                  ← supplier_quotations 表（编号 BJ-）
  ↓ 采购员选定报价，脱敏成本回写 QR.purchaserFeedback
QT（业务员给客户的报价单）                        ← sales_quotations 表（编号 QT-）
  ↓ 客户确认
SC（销售合同）                                    ← sales_contracts 表（编号 SC-）
  ↓ 业务员发给采购员"采购请求"
PR（采购请求：业务员→采购员，请下单）             ← ⚠️ 当前无独立表，与 QR 混用
  ↓ 采购员向工厂下单
CG（采购订单）                                    ← purchase_orders 表（编号 CG-）
  ↓
IR（验货报告）                                    ← 待建表（编号 IR-）
SH（订舱/出货）                                   ← 待建表（编号 SH-）
CI（商业发票）                                    ← 派生自 SC（编号 CI-SC-<sc_number>）
PL（装箱单）                                      ← 派生自 SC（编号 PL-SC-<sc_number>）
Finance（财务结算）
```

### ⚠️ 关键澄清：purchase_requirements 的真实身份

| 表名 | 实际业务含义 | 编号前缀 | 流程位置 |
|---|---|---|---|
| `purchase_requirements` | **QR（报价请求）** 业务员→采购员"帮我询价" | `QR-` | ING → XJ |
| 无独立表 | **PR（采购请求）** 业务员→采购员"帮我下单" | `PR-`（待建） | SC → CG |

migration 016 注释将 `purchase_requirements` 描述为"PR"是错误的——代码中编号前缀、变量名、UI 注释均证明它是 QR。**SC → CG 之间缺少独立的 PR 表。**

---

## 二、编号规则

| 单据 | 编号格式 | Scope | 备注 |
|---|---|---|---|
| ING | `ING-YYMMDD-XXXX` | customer_id | 序号不按天重置 |
| QR | `QR-YYMMDD-XXXX` | global | |
| XJ | `XJ-YYMMDD-XXXX` | global | |
| BJ | `BJ-YYMMDD-XXXX` | global | |
| QT | `QT-REGION-YYMMDD-XXXX` | region_code | |
| SC | `SC-REGION-YYMMDD-XXXX` | region_code | |
| PR | `PR-YYMMDD-XXXX` | global | 待建 |
| CG | `CG-YYMMDD-XXXX` | global | |
| IR | `IR-YYMMDD-XXXX` | global | |
| SH | `SH-YYMMDD-XXXX` | global | |
| CI | `CI-SC-<SC.display_number>` | derived | 派生自 SC |
| PL | `PL-SC-<SC.display_number>` | derived | 派生自 SC |

---

## 三、区域利润中心

| region_code | 覆盖地区 |
|---|---|
| `NA` | North America |
| `SA` | South America + Central America + Mexico |
| `EA` | Europe + Africa + Middle East + Asia + Australia + New Zealand |
| `UNKNOWN` | 无法识别区域的询盘 |

---

## 四、步骤 1 基线盘点报告（2026-03-04）

### A. Schema 差异

| 目标表 | 当前状态 | 差异 |
|---|---|---|
| `document_types` | ❌ 不存在 | 需新建（12种单据定义） |
| `number_sequences` | ✅ 已存在（migration 011） | 结构需升级：`(prefix, region_code, date_key)` → `(doc_type, scope_type, scope_id)` |
| `country_region_map` | ❌ 不存在 | 需新建（含区域映射数据） |
| `purchase_requests`（PR表） | ❌ 不存在 | SC→CG 间缺 PR 采购请求表，**步骤2e新建，含 pr_number** |

### B. 各业务表字段差异（最终版）

> **字段命名规则**：编号字段以单据代码为前缀（`ing_number`、`qr_number`、`sc_number`…）。
> `display_number` 为统一对外暴露的展示字段，值与各单据编号字段相同。

> **一QR多XJ设计原则**：QR只有1张，XJ有N张。不用 `xj_number1/xj_number2` 枚举列，
> 而是在 `supplier_xjs` 每行存 `source_qr_number`，天然支持无限多供应商询价。

| 表 | 单据 | 当前字段（DB） | 目标字段名 | display_number | source_doc_id | sales_contract_id | root_sales_contract_id | customer_id |
|---|---|---|---|---|---|---|---|---|
| `inquiries` | ING | `inquiry_number` | → **`ing_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| `sales_quotations` | QT | `qt_number` | 保留 **`qt_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| `sales_contracts` | SC | `contract_number` | → **`sc_number`** | ❌ 需添加 | ❌ | ✅（= self） | ❌ | ❌ |
| `purchase_requirements` | **QR 主表**（唯一） | `requirement_number` | → **`qr_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| `quotation_requests` | ~~QR~~（**废弃**） | `request_number` | **整表废弃**，数据迁入 `purchase_requirements` | — | — | — | — | — |
| `supplier_xjs` | XJ（N张，每张1供应商） | `xj_number` | 保留 **`xj_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| `supplier_quotations` | BJ | （无独立编号） | 新增 **`bj_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| `purchase_orders` | CG | `po_number` | → **`cg_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| `payments` | Finance | `payment_number` | 保留 **`payment_number`** | ❌ 需添加 | ❌ | ❌ | ❌ | ❌ |
| **`purchase_requests`**（待建） | **PR**（⚠️缺失） | 表不存在 | 新建，含 **`pr_number`** | ❌ | ❌ | ❌ | ❌ | ❌ |

#### 一QR多XJ关系示意

```
purchase_requirements（QR，始终只有1张）
  qr_number = QR-260304-0001
       │
       ├── supplier_xjs  xj_number = XJ-260304-0001  source_qr_number = QR-260304-0001  → 供应商A
       ├── supplier_xjs  xj_number = XJ-260304-0002  source_qr_number = QR-260304-0001  → 供应商B
       └── supplier_xjs  xj_number = XJ-260304-0003  source_qr_number = QR-260304-0001  → 供应商C
```

#### `quotation_requests` 废弃原因

| 问题 | 说明 |
|---|---|
| 功能与 `purchase_requirements` 重叠 | 都是"业务员→采购员"的询价触发 |
| `xj_ids JSONB[]` 反模式 | 用数组列枚举XJ，不如在XJ行里存`source_qr_number` |
| `purchase_requirements` 功能更完整 | 含 `purchaserFeedback` 成本回传闭环 |

### C. RPC 差异

| 目标 RPC | 当前状态 | 差异 |
|---|---|---|
| `next_number_ex(doc_type, region_code, customer_id)` | ❌ 不存在 | 需新建（通用编号生成，覆盖所有单据） |
| `next_inquiry_number(region_code)` | ✅ 已存在（migration 011） | 改为转调 `next_number_ex`，保持向后兼容 |

### D. 前端编号生成残留

| 位置 | 状态 |
|---|---|
| `UserContext.generateInquiryNumber` | ✅ 已改为调用 `next_inquiry_number` RPC |
| `UserContext.peekInquiryNumber` | ✅ 仅 UI 预览（返回 `????` 占位），无数据写入，符合章程 |
| 其余 `localStorage` 编号生成 | ✅ 无残留 |
| `rfqNumberGenerator` / `counter++` 类 | ✅ 无残留 |

### E. 链路字段现状

- `sales_contracts` 有 `inquiry_number` / `quotation_number` **文本引用**，但无 UUID 外键 `source_doc_id`
- **无任何表**有 `root_sales_contract_id`
- `number_sequences` 唯一约束 `(prefix, region_code, date_key)` 与新规格 `(doc_type, scope_type, scope_id)` 不兼容，需迁移
- PR（SC→CG 采购请求）**整个环节缺失**，SC 直接驱动 CG，利润闭环断裂

---

## 五、步骤 2 计划：Schema 对齐

**执行顺序（每段必须验收后再执行下一段）：**

### 2a — 新建 `document_types` + `country_region_map`（无风险，纯新建）
- 定义 12 种单据（ING/QR/XJ/BJ/QT/SC/PR/CG/IR/SH/CI/PL）
- 录入区域映射数据（NA/SA/EA 覆盖范围）

### 2b — 升级 `number_sequences`（ADD COLUMN，不删旧列）
- 新增 `doc_type TEXT`、`scope_type TEXT`、`scope_id TEXT`、`current_value INT`
- 保留 `prefix`、`region_code`、`date_key`、`current_seq` 向后兼容
- 新增唯一约束 `(doc_type, scope_type, scope_id)`

### 2c — 新建 `next_number_ex` RPC
- 参数：`doc_type TEXT, region_code TEXT DEFAULT 'UNKNOWN', customer_id TEXT DEFAULT NULL`
- 读取 `document_types.scope_type` → 决定 `scope_id`
- 原子递增 `number_sequences.current_value`
- 返回 `display_number`（按格式拼装）
- `derived` 类型直接 RAISE EXCEPTION

### 2d — `next_inquiry_number` 转调 `next_number_ex`
- 改写为：`RETURN next_number_ex('ING', p_region_code, NULL)`
- 保持函数签名不变，向后兼容

### 2e — Schema 结构调整（只加列/新建表，不删旧列）
- **所有保留表**新增统一字段：`display_number TEXT`、`source_doc_id UUID`、`sales_contract_id UUID`、`root_sales_contract_id UUID`、`customer_id TEXT`
- 编号字段新增（旧列保留向后兼容，由触发器同步值）：
  - `inquiries`：新增 `ing_number`（值同步自 `inquiry_number`）
  - `sales_contracts`：新增 `sc_number`（值同步自 `contract_number`）
  - `purchase_requirements`：新增 `qr_number`（值同步自 `requirement_number`）
  - `purchase_orders`：新增 `cg_number`（值同步自 `po_number`）
  - `supplier_quotations`：新增 `bj_number`
  - `supplier_xjs`：`xj_number` 已正确，`source_qr_number` 已正确，无需改动
- **`quotation_requests` 整表废弃**：
  - 步骤：将现有数据迁移至 `purchase_requirements`，再 `DROP TABLE`（或软标记 `deprecated_at`）
  - 移除 `xj_ids JSONB[]` 反模式字段
- **新建 `purchase_requests` 表**（PR，SC→CG 的采购请求）：
  - 含字段：`pr_number`、`sc_number`（外键）、`sales_contract_id UUID`、`root_sales_contract_id UUID`

### 2f — 添加索引
- `(sales_contract_id)`、`(root_sales_contract_id)`、`(display_number)`、`(source_doc_id)` 覆盖全部业务表

---

## 六、数据域状态（Context 层）

| Context | 业务单据 | Supabase 表 | 状态 |
|---|---|---|---|
| `OrderContext` | SO | `orders` | ✅ Supabase-only |
| `SalesContractContext` | SC | `sales_contracts` | ✅ Supabase-only |
| `QuotationContext` | QT（客户视角） | `sales_quotations` | ✅ Supabase-only |
| `InquiryContext` | ING | `inquiries` | ✅ Supabase-only |
| `SalesQuotationContext` | QT（内部） | `sales_quotations` | ✅ Supabase-only |
| `QuotationRequestContext` | QR（旧） | `quotation_requests` | 🔴 **整表废弃**，步骤2e迁入 `purchase_requirements` 后删除 |
| `XJContext` | XJ | `supplier_xjs` | ✅ Supabase-only |
| `PurchaseRequirementContext` | **QR**（实际） | `purchase_requirements` | ✅ Supabase-only |
| `PurchaseOrderContext` | CG | `purchase_orders` | ✅ Supabase-only（localStorage 已清除） |
| `NotificationContext` | — | `notifications` | ✅ Supabase-only |
| `FinanceContext` | Finance | `finance_records` | ✅ Supabase-only |
| `PaymentContext` | Finance | `payments` | ✅ Supabase-only |
| `ApprovalContext` | — | `approval_requests` | ✅ Supabase-only |
| `CartContext` | — | 无（UI状态） | ✅ localStorage 允许 |
| `RouterContext` | — | 无（UI状态） | ✅ localStorage 允许 |
| `OrganizationContext` | 公司配置 | 无 | 🟡 待评估 |
| `AdminOrganizationContext` | 后台配置 | 无 | 🟡 待评估 |
| `SalesOrderContext` | SO（旧） | 无 | ✅ **已删除** |

---

## 七、遗留清理清单

| 文件/事项 | 状态 |
|---|---|
| `src/api/backend-auth.ts` | ✅ **已删除**（2026-03-04） |
| `src/contexts/SalesOrderContext.tsx` | ✅ **已删除**（2026-03-04） |
| `apiFetchJson` 全量清除 | ✅ **已完成**（19文件） |
| `EMEA → EA` 全局替换 | ✅ **已完成** |
| `purchase_requirements` 命名澄清 | 🔴 表实为 QR，PR 环节缺失，待步骤 2e 修复 |
| `quotation_requests` 废弃 | ✅ **已决策废弃**，步骤2e执行数据迁移+DROP |

---

## 八、风险列表

| 风险 | 级别 | 当前状态 |
|---|---|---|
| `purchase_requirements` 命名混乱（QR/PR混用） | P0 | 🔴 步骤2修复 |
| PR 环节缺失（SC→CG 无中间表） | P0 | 🔴 步骤2e新建 |
| `root_sales_contract_id` 全链路缺失 | P1 | 🔴 步骤2e添加 |
| `number_sequences` 结构不兼容新规格 | P1 | 🔴 步骤2b升级 |
| `next_number_ex` RPC 不存在 | P1 | 🔴 步骤2c新建 |
| `display_number` 字段全表缺失 | P1 | 🔴 步骤2e添加 |
| `OrganizationContext` 纯 localStorage | P2 | 🟡 待评估 |
| tombstone 误隐藏 Supabase 数据 | P2 | 🟡 待审查 |

---

## 九、已完成 Git Commits（本阶段）

| Commit | 内容 |
|---|---|
| `9da34e4d` | EMEA → EA 全局替换 |
| `914db925` | Context 层移除 apiFetchJson（第1批） |
| `84fc7685` | 组件层移除 apiFetchJson（第2批） |
| `1d0a9b58` | apiFetchJson 全量清除完成 |
| `b25a11ac` | OrderContext/SalesContractContext localStorage 移除 |
| `710ff36c` | QuotationContext 全面迁移 Supabase |
| `d0038316` | 删除 backend-auth.ts + SalesOrderContext |
| `b6583ab6` | PurchaseOrderContext 移除 localStorage 兜底 |
| `c58495b9` | generateInquiryNumber 改用 Supabase RPC |
| `1a1db670` | 步骤2 Schema对齐完成（2a-2f，migration 017-021） |
