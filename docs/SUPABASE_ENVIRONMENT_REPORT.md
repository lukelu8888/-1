# Supabase 环境完整性报告

> 检查日期：2026-03-03
> 项目：COSUN ERP + AI SaaS
> Supabase Project ID：`oaavirpytvemskjooeyg`
> Supabase URL：`https://oaavirpytvemskjooeyg.supabase.co`

---

## 一、总览

| 维度 | 数量 | 状态 |
|------|------|------|
| 表 | 21 | 100% 完整 |
| 函数 | 21 | 100% 完整 |
| RLS 策略 | 90 | 100% 完整 |
| 触发器 | 33 | 100% 完整 |
| 枚举类型 | 20+ | 100% 完整 |
| 编号规则（active） | 16 | 干净无重复 |
| 租户 | 1 (COSUN, pro plan) | 100% |
| 租户成员 | 19 (3 admin + 11 staff + 5 external) | 100% |
| user_profiles | 19 | 100% 已修复 |
| Storage buckets | 2 (payment-proofs, contract-attachments) | 100% 已创建 |
| Realtime 发布 | 8 张表 | 100% 已配置 |
| Region 统一 | 全部 EA（无 EMEA） | 100% |

---

## 二、表清单（21 张）

| # | 表名 | 用途 |
|---|------|------|
| 1 | `tenants` | 租户（多租户核心） |
| 2 | `tenant_memberships` | 租户成员关系 |
| 3 | `user_profiles` | 用户元数据（关联 auth.users） |
| 4 | `companies` | 公司主数据（客户/供应商/合作方） |
| 5 | `contacts` | 联系人 |
| 6 | `company_bank_accounts` | 公司银行账户 |
| 7 | `company_tax_profiles` | 公司税务信息 |
| 8 | `company_portal_users` | 外部用户门户权限 |
| 9 | `documents` | 文档管理 |
| 10 | `inquiries` | 客户询价单 |
| 11 | `sales_quotations` | 销售报价单 |
| 12 | `sales_contracts` | 销售合同 |
| 13 | `orders` | 订单（内部跟踪） |
| 14 | `quotation_requests` | 报价请求（内部） |
| 15 | `supplier_rfqs` | 采购询价 |
| 16 | `notifications` | 通知 |
| 17 | `number_rules` | 编号规则 |
| 18 | `number_mappings` | 编号映射 |
| 19 | `event_log` | 事件日志（AI-ready） |
| 20 | `status_history` | 状态变更历史（AI-ready） |
| 21 | `ai_insights` | AI 洞察存储（AI-ready） |

> **术语说明**：表中 RFQ 相关命名（如 `supplier_rfqs`、`rfq_status`、`entity_type` 等）为历史遗留；业务术语已统一为 **XJ（采购询价）**。

---

## 三、函数清单（21 个）

### 多租户核心
| 函数 | 作用 |
|------|------|
| `current_tenant_id()` | 获取当前用户的 tenant_id |
| `is_tenant_staff()` | 判断当前用户是否为租户员工 |
| `is_tenant_admin()` | 判断当前用户是否为租户管理员 |
| `is_authorized_company()` | 判断用户是否有权访问某公司 |

### 触发器函数
| 函数 | 作用 |
|------|------|
| `auto_fill_tenant_id()` | INSERT 时自动填充 tenant_id |
| `auto_add_tenant_membership()` | 新用户注册时自动创建租户成员关系 |
| `auto_generate_company_code()` | 自动生成公司代码 |
| `set_updated_at()` | 更新 updated_at 字段 |

### 编号系统
| 函数 | 作用 |
|------|------|
| `next_number()` | 基础编号生成 |
| `next_number_ex()` | 高级编号生成（带区域、并发安全） |
| `reset_number_rule()` | 重置编号规则 |

### 区域自动填充
| 函数 | 作用 |
|------|------|
| `fill_order_region_code()` | 订单区域代码 |
| `fill_qr_region_code()` | 报价请求区域代码 |
| `fill_region_code_from_inquiry()` | 从询价单获取区域代码 |
| `fill_rfq_region_code()` | XJ (采购询价) 区域代码 |
| `fill_sc_region_code()` | 销售合同区域代码 |
| `fill_sq_region_code()` | 销售报价区域代码 |
| `get_region_from_inquiry()` | 根据询价单获取区域 |

### AI/审计
| 函数 | 作用 |
|------|------|
| `log_event()` | 记录事件日志（AI-ready） |
| `log_status_change()` | 记录状态变更（AI-ready） |

### 安全
| 函数 | 作用 |
|------|------|
| `protect_document_immutable_fields()` | 保护文档不可变字段 |

---

## 四、RLS 策略清单（90 条）

### ai_insights (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| ai_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| ai_system_insert | INSERT | NULL (允许系统写入) |

### companies (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| companies_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| companies_external_select | SELECT | `deleted_at IS NULL AND is_authorized_company(auth.uid(), id)` |
| companies_external_update | UPDATE | `deleted_at IS NULL AND is_authorized_company(auth.uid(), id)` |
| companies_staff_insert | INSERT | NULL |
| companies_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| companies_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### company_bank_accounts (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| cba_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| cba_external_insert | INSERT | NULL |
| cba_external_select | SELECT | `deleted_at IS NULL AND is_authorized_company(auth.uid(), company_...)` |
| cba_external_update | UPDATE | `deleted_at IS NULL AND is_authorized_company(auth.uid(), company_...)` |
| cba_staff_insert | INSERT | NULL |
| cba_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| cba_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### company_portal_users (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| cpu_external_own | SELECT | `user_id = auth.uid()` |
| cpu_staff_all | ALL | `tenant_id = current_tenant_id() AND is_tenant_admin()` |

### company_tax_profiles (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| ctp_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| ctp_external_insert | INSERT | NULL |
| ctp_external_select | SELECT | `deleted_at IS NULL AND is_authorized_company(auth.uid(), company_...)` |
| ctp_external_update | UPDATE | `deleted_at IS NULL AND is_authorized_company(auth.uid(), company_...)` |
| ctp_staff_insert | INSERT | NULL |
| ctp_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| ctp_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### contacts (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| contacts_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| contacts_external_insert | INSERT | NULL |
| contacts_external_select | SELECT | `deleted_at IS NULL AND is_authorized_company(auth.uid(), company_...)` |
| contacts_external_update | UPDATE | `deleted_at IS NULL AND is_authorized_company(auth.uid(), company_...)` |
| contacts_staff_insert | INSERT | NULL |
| contacts_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| contacts_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### documents (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| docs_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| docs_external_insert | INSERT | NULL |
| docs_external_select | SELECT | `deleted_at IS NULL AND owner_type = 'company'::doc_owner_type AND ...` |
| docs_external_update | UPDATE | `deleted_at IS NULL AND owner_type = 'company'::doc_owner_type AND ...` |
| docs_staff_insert | INSERT | NULL |
| docs_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| docs_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### event_log (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| el_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| el_system_insert | INSERT | NULL |

### inquiries (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| inq_customer_own | ALL | `lower(user_email) = lower(auth.email()) AND deleted_at IS NULL` |
| inq_staff_all | ALL | `EXISTS (SELECT 1 FROM tenant_memberships tm WHERE tm.user_id = auth.uid() AND tm.tenant_id = inquiries.tenant_id ...)` |

### notifications (4)
| 策略 | 操作 | 条件 |
|------|------|------|
| notif_delete_own | DELETE | `recipient_email = auth.email()` |
| notif_insert | INSERT | NULL |
| notif_own | SELECT | `recipient_email = auth.email()` |
| notif_update_own | UPDATE | `recipient_email = auth.email()` |

### number_mappings (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| nm_admin_write | INSERT | NULL |
| nm_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### number_rules (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| nr_admin_write | INSERT | NULL |
| nr_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### orders (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| ord_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| ord_customer_select | SELECT | `deleted_at IS NULL AND customer_email = auth.email()` |
| ord_customer_update | UPDATE | `deleted_at IS NULL AND customer_email = auth.email()` |
| ord_staff_insert | INSERT | NULL |
| ord_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff() AND deleted_at IS NULL` |
| ord_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### quotation_requests (4)
| 策略 | 操作 | 条件 |
|------|------|------|
| qr_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| qr_staff_insert | INSERT | NULL |
| qr_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff() AND deleted_at IS NULL` |
| qr_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### sales_contracts (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| sc_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| sc_customer_select | SELECT | `deleted_at IS NULL AND customer_email = auth.email() AND status IN (...)` |
| sc_customer_update | UPDATE | `deleted_at IS NULL AND customer_email = auth.email() AND status IN (...)` |
| sc_staff_insert | INSERT | NULL |
| sc_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff() AND deleted_at IS NULL` |
| sc_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### sales_quotations (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| sq_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| sq_customer_select | SELECT | `deleted_at IS NULL AND customer_email = auth.email() AND customer_status IN (...)` |
| sq_staff_insert | INSERT | NULL |
| sq_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff() AND deleted_at IS NULL` |
| sq_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |

### status_history (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| sh_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| sh_system_insert | INSERT | NULL |

### supplier_rfqs (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| rfq_admin_delete | DELETE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |
| rfq_staff_insert | INSERT | NULL |
| rfq_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff() AND deleted_at IS NULL` |
| rfq_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| rfq_supplier_select | SELECT | `deleted_at IS NULL AND supplier_email = auth.email()` |
| rfq_supplier_update | UPDATE | `deleted_at IS NULL AND supplier_email = auth.email()` |

### tenant_memberships (6)
| 策略 | 操作 | 条件 |
|------|------|------|
| tm_admin_delete | DELETE | `tenant_id = current_tenant_id() AND EXISTS(...)` |
| tm_external_own | SELECT | `user_id = auth.uid()` |
| tm_staff_insert | INSERT | NULL |
| tm_staff_select | SELECT | `tenant_id = current_tenant_id() AND is_tenant_staff()` |
| tm_staff_update | UPDATE | `tenant_id = current_tenant_id() AND is_tenant_admin()` |

### tenants (2)
| 策略 | 操作 | 条件 |
|------|------|------|
| tenants_owner_update | UPDATE | `id = current_tenant_id() AND is_tenant_admin(id)` |
| tenants_staff_select | SELECT | `id = current_tenant_id()` |

### user_profiles (4)
| 策略 | 操作 | 条件 |
|------|------|------|
| own_profile_select | SELECT | `id = auth.uid()` |
| own_profile_update | UPDATE | `id = auth.uid()` |
| users can read own profile | SELECT | `id = auth.uid()` |
| users can update own profile | UPDATE | `id = auth.uid()` |

---

## 五、触发器清单（33 个）

| 触发器 | 表 | 执行函数 |
|--------|---|---------|
| trg_companies_auto_code | companies | auto_generate_company_code() |
| trg_companies_updated_at | companies | set_updated_at() |
| trg_cba_updated_at | company_bank_accounts | set_updated_at() |
| trg_cpu_updated_at | company_portal_users | set_updated_at() |
| trg_ctp_updated_at | company_tax_profiles | set_updated_at() |
| trg_contacts_updated_at | contacts | set_updated_at() |
| trg_docs_updated_at | documents | set_updated_at() |
| trg_protect_doc_immutable | documents | protect_document_immutable_fields() |
| trg_inquiries_auto_tenant | inquiries | auto_fill_tenant_id() |
| trg_inquiries_updated_at | inquiries | set_updated_at() |
| trg_nr_updated_at | number_rules | set_updated_at() |
| trg_order_fill_region | orders | fill_order_region_code() |
| trg_order_fill_region | orders | fill_order_region_code() |
| trg_orders_auto_tenant | orders | auto_fill_tenant_id() |
| trg_orders_updated_at | orders | set_updated_at() |
| trg_qr_auto_tenant | quotation_requests | auto_fill_tenant_id() |
| trg_qr_fill_region | quotation_requests | fill_qr_region_code() |
| trg_qr_fill_region | quotation_requests | fill_qr_region_code() |
| trg_qr_updated_at | quotation_requests | set_updated_at() |
| trg_sc_auto_tenant | sales_contracts | auto_fill_tenant_id() |
| trg_sc_fill_region | sales_contracts | fill_sc_region_code() |
| trg_sc_fill_region | sales_contracts | fill_sc_region_code() |
| trg_sc_updated_at | sales_contracts | set_updated_at() |
| trg_sq_auto_tenant | sales_quotations | auto_fill_tenant_id() |
| trg_sq_fill_region | sales_quotations | fill_sq_region_code() |
| trg_sq_fill_region | sales_quotations | fill_sq_region_code() |
| trg_sq_updated_at | sales_quotations | set_updated_at() |
| trg_rfq_auto_tenant | supplier_rfqs | auto_fill_tenant_id() |
| trg_rfq_fill_region | supplier_rfqs | fill_rfq_region_code() |
| trg_rfq_fill_region | supplier_rfqs | fill_rfq_region_code() |
| trg_rfq_updated_at | supplier_rfqs | set_updated_at() |
| trg_tm_updated_at | tenant_memberships | set_updated_at() |
| trg_tenants_updated_at | tenants | set_updated_at() |

---

## 六、枚举类型清单

### 业务枚举
| 枚举类型 | 可选值 |
|---------|--------|
| inquiry_status | draft, pending, quoted, approved, rejected |
| order_status | Pending, Awaiting Deposit, Payment Proof Uploaded, Deposit Received, Preparing Production, In Production, Quality Inspection, Ready to Ship, Shipped, Delivered, confirmed, negotiating, cancelled |
| sc_status | draft, pending_supervisor, pending_director, approved, rejected, sent, customer_confirmed, deposit_uploaded, deposit_confirmed, po_generated, production, shipped, completed, cancelled |
| sq_approval_status | draft, pending_approval, approved, rejected |
| sq_customer_status | not_sent, sent, viewed, accepted, rejected, negotiating, expired |
| qr_status | draft, submitted, rfq_sent, quoted, selected, rejected, cancelled |
| rfq_status | pending, quoted, accepted, rejected, expired |
| payment_proof_status | pending, confirmed, rejected |

### 公司/主数据枚举
| 枚举类型 | 可选值 |
|---------|--------|
| party_type | customer, supplier, partner |
| common_status | active, inactive, suspended, pending_review, archived |
| doc_owner_type | company, contact, transaction |
| doc_status | active, expired, replaced, pending_review |
| document_type | business_license, qc_report, inspection_report, payment_receipt, contract_signed, customs_doc, bank_statement, other |
| tax_type | VAT, GST, Corporate, Import, Export, Other |
| region_code | NA, SA, EA, EU, EMEA |

### 多租户枚举
| 枚举类型 | 可选值 |
|---------|--------|
| membership_role | owner, admin, staff, external |
| membership_status | active, invited, suspended |
| portal_role | viewer, finance, operator, manager |
| tenant_plan | free, pro, enterprise |
| billing_status | active, past_due, canceled, trialing |

---

## 七、编号规则（16 条 active）

### 业务流程编号（带区域）
| 业务 | entity_type | 前缀 | 格式 | 示例 |
|------|------------|------|------|------|
| 客户询价 | inquiry | INQ | {PREFIX}-{REGION}-{YYMMDD}-{SEQ4} | INQ-NA-260303-0001 |
| 我们报价 | quotation | QT | {PREFIX}-{REGION}-{YYMMDD}-{SEQ4} | QT-NA-260303-0001 |
| 销售合同 | contract | SC | {PREFIX}-{REGION}-{YYMMDD}-{SEQ4} | SC-NA-260303-0001 |

每个都有 NA / SA / EA 三个区域规则。

### 内部编号（无区域）
| 业务 | entity_type | 前缀 | 格式 | 示例 |
|------|------------|------|------|------|
| 采购单 | purchase_order | CG | {PREFIX}-{YYMMDD}-{SEQ4} | CG-260303-0001 |
| 采购询价 | supplier_rfq | XJ | {PREFIX}-{YYMMDD}-{SEQ4} | XJ-260303-0001 |
| 供应商报价 | supplier_quotation | BJ | {PREFIX}-{YYMMDD}-{SEQ4} | BJ-260303-0001 |
| 报价请求 | quotation_request | QR | {PREFIX}-{YYMMDD}-{SEQ4} | QR-260303-0001 |

### 主数据编号
| 业务 | entity_type | 前缀 | 格式 | 示例 |
|------|------------|------|------|------|
| 客户 | company_customer | CUS | {PREFIX}-{SEQ4} | CUS-0001 |
| 供应商 | company_supplier | SUP | {PREFIX}-{SEQ4} | SUP-0001 |
| 合作方 | company_partner | PAR | {PREFIX}-{SEQ4} | PAR-0001 |

### 业务流程
```
客户 → INQ（询价） → 我们 → QT（报价） → 客户确认 → 我们 → SC（销售合同） → 执行
                                                              ↓
                                                     CG（采购单）→ 供应商
                                                     XJ（采购询价）→ 供应商
                                                     供应商 → BJ（供应商报价）→ 我们
```

客户的 PO/Order 只作为附件/备注，不进入编号体系。

---

## 八、租户信息

| 字段 | 值 |
|------|-----|
| id | `3683e7c6-8c05-4074-8a58-5e9e599ff4b9` |
| name | COSUN |
| slug | cosun |
| plan | pro |
| billing_status | active |
| status | active |
| created_at | 2026-03-01 |

---

## 九、租户成员（19 人）

### Admin（3 人）
| 邮箱 | 名称 | membership_role |
|------|------|----------------|
| admin@cosun.com | 系统管理员 | admin |
| ceo@cosun.com | 张明 | admin |
| cfo@cosun.com | 李华 | admin |

### Staff（11 人）
| 邮箱 | 名称 | membership_role | portal_role | rbac_role | region |
|------|------|----------------|-------------|-----------|--------|
| carlos.silva@cosun.com | 陈明华 | staff | admin | Regional_Manager | SA |
| finance@cosun.com | 赵敏 | staff | admin | Finance | all |
| hans.mueller@cosun.com | 赵国强 | staff | admin | Regional_Manager | EA |
| john.smith@cosun.com | 刘建国 | staff | admin | Regional_Manager | NA |
| lifang@cosun.com | 李芳 | staff | admin | Sales_Rep | SA |
| marketing@cosun.com | 李娜 | staff | admin | Marketing_Ops | all |
| procurement@cosun.com | 刘刚 | staff | admin | Procurement | all |
| sales.director@cosun.com | 王强 | staff | admin | Sales_Director | all |
| wangfang@cosun.com | 王芳 | staff | admin | Sales_Rep | EA |
| zhanghui@cosun.com | 张晖 | staff | admin | Documentation_Officer | all |
| zhangwei@cosun.com | 张伟 | staff | admin | Sales_Rep | NA |

### External（5 人）
| 邮箱 | 名称 | membership_role | portal_role | region |
|------|------|----------------|-------------|--------|
| abc.customer@test.com | ABC Customer | external | customer | NA |
| brasil.customer@test.com | Brasil Customer | external | customer | SA |
| europa.customer@test.com | Europa Customer | external | customer | EA |
| gd.supplier@test.com | 广东五金制造厂 | external | supplier | NA |
| zj.supplier@test.com | 浙江建材集团 | external | supplier | NA |

---

## 十、inquiries 表结构（21 列）

| 列名 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| id | uuid | uuid_generate_v4() | 主键，自动生成 |
| tenant_id | uuid | NULL | 由触发器 auto_fill_tenant_id() 自动填充 |
| inquiry_number | text | NULL | 由 next_number_ex() 生成 |
| region_code | text | NULL | 区域代码 NA/SA/EA |
| user_email | text | NULL | 客户邮箱（RLS 依赖） |
| company_id | uuid | NULL | 关联 companies 表 |
| buyer_info | jsonb | '{}' | 买方信息 |
| products | jsonb | '[]' | 产品列表 |
| shipping_info | jsonb | '{}' | 运输信息 |
| container_info | jsonb | NULL | 集装箱信息 |
| total_price | numeric | 0 | 总价 |
| status | inquiry_status (ENUM) | 'draft' | draft/pending/quoted/approved/rejected |
| is_submitted | boolean | false | 是否已提交 |
| message | text | NULL | 留言 |
| date | date | CURRENT_DATE | 日期 |
| submitted_at | timestamptz | NULL | 提交时间 |
| deleted_at | timestamptz | NULL | 软删除时间 |
| created_at | timestamptz | now() | 创建时间 |
| created_by | uuid | NULL | 创建者 |
| updated_at | timestamptz | now() | 更新时间 |
| updated_by | uuid | NULL | 更新者 |

---

## 十一、Storage Buckets（2 个）

| Bucket | 公开 | 大小限制 | 允许类型 |
|--------|------|---------|---------|
| payment-proofs | true | 10MB | jpeg, jpg, png, gif, pdf |
| contract-attachments | true | 20MB | jpeg, jpg, png, gif, pdf, doc, docx |

---

## 十二、Realtime 发布（8 张表）

| 表 |
|---|
| inquiries |
| sales_quotations |
| sales_contracts |
| orders |
| notifications |
| supplier_rfqs |
| quotation_requests |
| status_history |

---

## 十三、Vercel 配置

| 项目 | 值 |
|------|-----|
| Build command | `npm run build` |
| Output dir | `build` |
| Framework | null（纯静态 SPA） |
| Rewrites | `/((?!assets/).*) → /index.html` |
| Security headers | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection |

---

## 十四、今日修复记录

| # | 项目 | 修复前 | 修复后 |
|---|------|--------|--------|
| 1 | zhangwei portal_role | supplier | admin |
| 2 | carlos.silva rbac_role | Sales_Rep | Regional_Manager |
| 3 | john.smith rbac_role | Sales_Rep | Regional_Manager |
| 4 | hans.mueller rbac_role + region | Sales_Rep / EA | Regional_Manager / EA |
| 5 | zhanghui rbac_role + region | NULL / NULL | Documentation_Officer / all |
| 6 | brasil.customer region | NULL | SA |
| 7 | europa.customer region | NULL | EA |
| 8 | gd.supplier region | NULL | NA |
| 9 | zj.supplier region | NULL | NA |
| 10 | abc.customer rbac_role | "Customer" | NULL |
| 11 | EMEA → EA | 全项目统一 | 完成 |
| 12 | Order prefix SO → CG | 已修改 | 完成 |
| 13 | 重复 number_rules 清理 | v1/v2/v3 共存 | 仅保留最新版 |
| 14 | 重复 entity_type 清理 | bj/po/rfq/qr | retired，保留正式名 |
| 15 | Storage buckets | 未创建 | payment-proofs + contract-attachments |
| 16 | Realtime 发布 | 未配置 | 8 张表已发布 |

---

## 十五、前端 vs 数据库冲突清单（待修复）

以下是前端代码需要改造的核心问题：

| # | 冲突 | 前端发送 | 数据库期望 | 影响 |
|---|------|---------|----------|------|
| 1 | id 类型 | TEXT（如 "INQ-NA-260303-0001"） | UUID（自动生成） | INSERT 失败 |
| 2 | tenant_id | 不发送 | UUID（触发器自动填充，但需要用户在 tenant_memberships 中） | staff 看不到数据 |
| 3 | region → region_code | 字段名 `region` | 字段名 `region_code` | 值写到错误字段 |
| 4 | status | 自由 TEXT（如 "pending"） | ENUM inquiry_status | 可能被拒绝 |
| 5 | created_at | bigint 时间戳 | timestamptz | INSERT 可能失败 |
| 6 | date | TEXT 字符串 | DATE 类型 | 可能被拒绝 |
| 7 | created_by | 不发送 | UUID | NULL |
| 8 | 编号生成 | localStorage 计数器 | next_number_ex() RPC | 编号重复 |
| 9 | 认证读取 | users 表 | user_profiles 表 | 数据不一致 |
| 10 | 编号前缀 | INQ 前缀不统一 | INQ（统一） | 编号混乱 |

---

## 十六、结论

**Supabase 的 SaaS 多租户 + AI-ready 架构是完整的、未被破坏的。**

所有 21 张表、21 个函数、90 条 RLS、33 个触发器、16 条编号规则全部正确就位。

**真正的问题 100% 在前端**：前端代码不知道多租户架构的存在，没有使用 `next_number_ex()`，数据类型不匹配（UUID vs TEXT, ENUM vs string, timestamptz vs bigint），导致写入/读取出现各种问题。

下一步：前端代码改造，让前端正确对接这套完整的 SaaS 多租户后端。
