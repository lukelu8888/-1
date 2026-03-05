# COSUN ERP — Project Master Map

> 维护人：首席架构师 | 最后更新：2026-03-05

---

## 一、数据域清单

| 模块 | 数据来源 | 状态 | 备注 |
|------|----------|------|------|
| ING（客户询价） | Supabase `inquiries` | ✅ Supabase-only | 编号走 `next_inquiry_number` RPC |
| QR（采购需求） | Supabase `purchase_requirements` | ✅ Supabase-only | 编号走 `next_number_ex` RPC |
| XJ（采购询价单） | Supabase `supplier_xjs` | ✅ Supabase-only | 编号走 `next_number_ex` RPC；`tenant_id` 固定单租户 |
| BJ（供应商报价） | Supabase `supplier_quotations` | ⚠️ 部分 | 软删除 tombstone 存 localStorage（允许）|
| QT（销售报价） | 待核查 | ❓ 未确认 | |
| SC（销售合同） | Supabase `sales_contracts` | ⚠️ 部分 | 读已对齐；需确认写入完整性 |
| 供应商数据 | 本地静态 `suppliersDatabase` | ❌ 未迁移 | 未接入 Supabase `companies/organizations` 表 |
| 审批流 | localStorage `approval_center_pending_bridge_v1` | ❌ 违规双写 | 需迁移到 Supabase `approvals` 表 |

---

## 二、关键 RPC

| RPC | 用途 | 状态 |
|-----|------|------|
| `next_number_ex(doc_type, scope_type, scope_id)` | 所有业务编号生成 | ✅ 正常 |
| `next_inquiry_number(region_code, customer_id)` | ING 编号（向前兼容） | ✅ 正常 |

---

## 三、关键表字段对齐状态

### `supplier_xjs`
| 字段 | 类型 | 前端对齐 | 备注 |
|------|------|----------|------|
| `id` | uuid | ✅ | `toUUID()` 生成 |
| `tenant_id` | uuid NOT NULL | ✅ | 固定 `3683e7c6-8c05-4074-8a58-5e9e599ff4b9` |
| `xj_number` | text NOT NULL | ✅ | 唯一约束 `(tenant_id, xj_number)` |
| `status` | xj_status enum | ✅ | |

### `purchase_requirements`
| 字段 | 类型 | 前端对齐 | 备注 |
|------|------|----------|------|
| `id` | uuid | ✅ | |
| `requirement_no` | text | ✅ | |
| `items` | jsonb | ✅ | 写入时每个 item 注入 UUID |
| `customer_info` | jsonb | ✅ | |
| `created_by` | uuid | ✅ | 非 UUID 时传 null |

### `supplier_quotations`
| 字段 | 类型 | 前端对齐 | 备注 |
|------|------|----------|------|
| `source_xj_id` | uuid | ✅ | 原 rfq_id 已核实不存在 |
| `source_xj_number` | text | ✅ | |

---

## 四、遗留清理清单

| ID | 项目 | 优先级 | 状态 |
|----|------|--------|------|
| L1 | `approval_center_pending_bridge_v1` localStorage 双写 | P1 | ❌ 待处理 |
| L2 | 供应商数据迁移到 Supabase `companies` 表 | P2 | ❌ 待处理 |
| L3 | `backend/` Laravel 残留调用清查 | P3 | ❌ 未开始 |
| L4 | `database.types.ts` 未包含 `supplier_xjs` 类型 | P2 | ❌ 待更新 |
| L5 | `calculateRequirementStatus` 前端计算，未用 DB status | P2 | ⚠️ 已知风险 |

---

## 五、风险列表

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| RLS 策略未知（supplier_xjs） | 写入 silent fail | 验收时检查 Network 400/403 |
| `xj_status` enum 值范围不清 | status 写入失败 | 需查 DB enum 定义 |
| `suppliersDatabase` 静态数据陈旧 | 供应商搜索不准确 | 接入 companies 表后废弃 |
| region 全名混入历史数据 | 显示异常 | 前端加 normalize 函数统一处理 |

---

## 六、架构决策记录（ADR）

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-03-05 | `tenant_id` 硬编码单租户 UUID | 当前系统单租户，无需动态查询 |
| 2026-03-05 | item.id 由 `toPRRow` 写入时生成 UUID | Supabase 为唯一数据源，不依赖前端生成 |
| 2026-03-05 | 软删 tombstone 允许存 localStorage | 删除操作不可逆，tombstone 仅作 UI 过滤缓存，可接受 |
| 2026-03-04 | ING 编号格式 `ING-EA-YYMMDD-XXXX` | 客户作用域+区域前缀，按客户隔离计数 |
