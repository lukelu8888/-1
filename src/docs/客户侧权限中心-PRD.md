# 客户侧权限中心 PRD

## 一、文档目的

本文用于定义 **客户侧 Permission Center** 的产品边界、页面结构、角色基线、权限矩阵、多语言策略与实现约束。

本文档面向：

- 产品
- UI/UX
- 前端
- 后端
- 测试

---

## 二、核心结论

客户侧权限中心采用以下固定原则：

1. **UI 布局与我方侧权限中心完全一致**
2. **角色逻辑、模块内容、权限矩阵按客户侧业务单独定义**
3. **`Purchaser` 默认包含 `My Products` 模块维护权限**
4. **语言切换只在客户侧主页体系内生效**
5. **客户侧权限只能作用于客户自己的租户空间，不能触达平台级能力**

一句话：

> 客户侧 Permission Center 与我方侧保持 100% 相同的 UI 骨架，但采用客户侧独立的角色与权限逻辑。

---

## 三、产品定位

客户侧权限中心用于回答以下问题：

1. 当前客户企业有哪些可用角色
2. 每个角色能看到哪些模块
3. 每个角色在模块内能执行哪些动作
4. 每个角色能看到多大范围的数据
5. 某个具体人员是否被临时授予了例外权限

它不负责：

- 维护平台级角色
- 管理我方内部运营权限
- 维护跨租户权限
- 管理客户侧以外系统的语言状态

---

## 四、与我方侧权限中心的关系

### 4.1 一致的部分

- 顶部标题区布局一致
- 右上角全局操作按钮一致
- 页签数量与顺序一致
- 表格布局一致
- 菜单矩阵布局一致
- 动作与数据范围页三栏结构一致
- 例外授权页布局一致
- 变更日志页布局一致

### 4.2 不一致的部分

- 角色清单不一致
- 模块树不一致
- 权限说明文案不一致
- 数据范围语义不一致
- 客户侧不暴露平台级能力
- 客户侧语言由客户门户控制，我方侧不跟随

---

## 五、页面结构

客户侧权限中心固定保留 5 个页签，顺序不得调整：

1. `Role Overview`
2. `Menu Permission Matrix`
3. `Actions & Data Scope`
4. `User Exception Authorization`
5. `Change Log`

顶部固定元素：

- Page Title: `Permission Center`
- Subtitle: `Manage customer-side roles, module access, and data scope`
- Global Button: `Reset Changes`
- Global Button: `Publish Changes`

---

## 六、角色基线

客户侧默认角色采用以下 7 个模板角色：

| Role Name | Role Code | Category | Special Control | Responsibility Description |
|---|---|---|---|---|
| Company Owner | `Company_Owner` | Management | All Company Data Required | Full control of company settings, members, permissions, and business data. |
| Company Admin | `Company_Admin` | Administration | All Company Data Required | Manage company profile, members, roles, and operational settings. |
| Purchase Manager | `Purchase_Manager` | Business | Department Scope Required | Manage purchasing operations, approve requests, oversee My Products maintenance, and supervise team activities. |
| Purchaser | `Purchaser` | Business | Assigned or Self Data | Maintain My Products, create inquiries, place orders, and follow up purchasing tasks. |
| Finance | `Finance` | Support | Financial Data Access Required | View invoices, statements, payment records, and settlement-related data. |
| Warehouse Receiver | `Warehouse_Receiver` | Operations | Assigned Data Required | Confirm deliveries, receive goods, and update receiving records. |
| Viewer | `Viewer` | Read Only | Read-Only Scope | View authorized modules and records without editing rights. |

### 关键约束

- `Purchaser` 必须默认拥有 `My Products` 模块访问权
- `Purchaser` 必须默认拥有 `My Products` 的 `View / Create / Edit` 权限
- `Purchase Manager` 必须默认拥有 `My Products` 的审批或审核类权限
- 客户侧可支持自定义角色，但以上 7 个角色为默认模板基线

---

## 七、模块基线

客户侧菜单矩阵中的模块树采用以下结构：

### 7.1 Core Modules

- `Dashboard`
- `Message Center`
- `Document Center`
- `Company Profile`
- `Member Directory`

### 7.2 Business Modules

- `My Products`
- `Inquiry Center`
- `Order Center`
- `Contract Center`
- `Invoice & Statement Center`
- `Shipment & Receiving`
- `After-sales Service`

### 7.3 Administration

- `Permission Center`
- `Approval Center`
- `Operation Logs`

### 模块设计原则

- 客户侧模块命名全部使用客户业务语言
- 不直接暴露我方内部运营模块
- `My Products` 为客户侧关键模块，必须明确列入主业务模块

---

## 八、各页签定义

## 8.1 Role Overview

### 页面目的

用于展示客户侧全部角色模板与角色职责。

### 固定 UI 元素

- Search Placeholder: `Search role name / code...`
- Filter: `All Categories`
- Primary Button: `+ New Role`

### 表头

- `Role Name`
- `Role Code`
- `Category`
- `Special Control`
- `Responsibility Description`
- `Actions`

### 行操作

- `Configure`
- `Clone`
- `Delete`

### 说明

- 本页不处理菜单勾选
- 本页不处理真实用户账号列表
- 本页用于定义角色模板本身

---

## 8.2 Menu Permission Matrix

### 页面目的

用于定义角色是否能看到某个模块入口。

### 固定 UI 元素

- Section Title: `Menu Permission Configuration Matrix`
- Button: `Expand All`
- Button: `Collapse All`
- Left Column Title: `System Menu Nodes`

### 设计规则

- 只表达模块是否可见
- 不混入动作权限
- 不混入数据范围
- 不混入个人例外授权

### 默认菜单访问基线

| Role | Default Menu Access |
|---|---|
| Company Owner | All modules |
| Company Admin | Almost all modules |
| Purchase Manager | Dashboard, Message Center, Document Center, My Products, Inquiry Center, Order Center, Contract Center, Shipment & Receiving, Approval Center |
| Purchaser | Dashboard, Message Center, Document Center, My Products, Inquiry Center, Order Center |
| Finance | Dashboard, Message Center, Document Center, Contract Center, Invoice & Statement Center |
| Warehouse Receiver | Dashboard, Message Center, Shipment & Receiving |
| Viewer | Only explicitly granted modules |

### 关键约束

- `My Products` 默认对 `Purchase Manager` 和 `Purchaser` 勾选

---

## 8.3 Actions & Data Scope

### 页面目的

用于定义角色在具体模块内可以执行的动作，以及能查看的数据范围。

### 布局

保持与我方侧完全一致的三栏结构：

1. 左栏：模块树
2. 中栏：动作权限矩阵
3. 右栏：数据范围控制

### 固定 UI 元素

- Search Placeholder: `Search business modules...`
- Right Panel Title: `Row-level Data Scope Control`
- Right Panel Description: `Configure what data this role can access within the current module.`

### 标准动作列

- `View`
- `Create`
- `Edit`
- `Delete`
- `Approve`

### 标准数据范围

- `All Company Data`
- `Department Data`
- `Department and Sub-departments`
- `Self Only`
- `Assigned Data`

### 数据范围说明

- `All Company Data`: `Access all records within the company.`
- `Department Data`: `Access records belonging to the current department.`
- `Department and Sub-departments`: `Access records belonging to the current department and its sub-departments.`
- `Self Only`: `Access only records created by or assigned to the current user.`
- `Assigned Data`: `Access only records explicitly assigned to the current role or user.`

### 设计规则

- 客户侧数据范围以企业内协作为主
- 不沿用我方侧以区域为主的数据范围语义
- 优先支持 `Self / Assigned / Department / All Company`

---

## 九、权限矩阵基线

## 9.1 总表

| Role | Module | Menu Access | Action Permissions | Data Scope |
|---|---|---|---|---|
| Company Owner | All Modules | Yes | `View / Create / Edit / Delete / Approve` | `All Company Data` |
| Company Admin | Dashboard | Yes | `View` | `All Company Data` |
| Company Admin | Message Center | Yes | `View` | `All Company Data` |
| Company Admin | Document Center | Yes | `View / Create / Edit / Delete` | `All Company Data` |
| Company Admin | Company Profile | Yes | `View / Edit` | `All Company Data` |
| Company Admin | Member Directory | Yes | `View / Create / Edit / Delete` | `All Company Data` |
| Company Admin | My Products | Yes | `View / Create / Edit / Delete / Approve` | `All Company Data` |
| Company Admin | Inquiry Center | Yes | `View / Create / Edit / Delete / Approve` | `All Company Data` |
| Company Admin | Order Center | Yes | `View / Create / Edit / Delete / Approve` | `All Company Data` |
| Company Admin | Contract Center | Yes | `View / Create / Edit / Delete / Approve` | `All Company Data` |
| Company Admin | Invoice & Statement Center | Yes | `View / Create / Edit / Approve` | `All Company Data` |
| Company Admin | Shipment & Receiving | Yes | `View / Create / Edit / Approve` | `All Company Data` |
| Company Admin | After-sales Service | Yes | `View / Create / Edit / Approve` | `All Company Data` |
| Company Admin | Permission Center | Yes | `View / Create / Edit / Delete / Approve` | `All Company Data` |
| Company Admin | Approval Center | Yes | `View / Approve` | `All Company Data` |
| Company Admin | Operation Logs | Yes | `View / Export` | `All Company Data` |
| Purchase Manager | Dashboard | Yes | `View` | `Department and Sub-departments` |
| Purchase Manager | Message Center | Yes | `View` | `Department and Sub-departments` |
| Purchase Manager | Document Center | Yes | `View / Create / Edit` | `Department and Sub-departments` |
| Purchase Manager | My Products | Yes | `View / Create / Edit / Approve` | `Department and Sub-departments` |
| Purchase Manager | Inquiry Center | Yes | `View / Create / Edit / Approve` | `Department and Sub-departments` |
| Purchase Manager | Order Center | Yes | `View / Create / Edit / Approve` | `Department and Sub-departments` |
| Purchase Manager | Contract Center | Yes | `View / Create / Edit` | `Department and Sub-departments` |
| Purchase Manager | Shipment & Receiving | Yes | `View / Create / Edit / Approve` | `Department and Sub-departments` |
| Purchase Manager | Approval Center | Yes | `View / Approve` | `Department and Sub-departments` |
| Purchaser | Dashboard | Yes | `View` | `Self Only` |
| Purchaser | Message Center | Yes | `View` | `Self Only` |
| Purchaser | Document Center | Yes | `View / Create / Edit` | `Self Only` |
| Purchaser | My Products | Yes | `View / Create / Edit` | `Self Only` or `Assigned Data` |
| Purchaser | Inquiry Center | Yes | `View / Create / Edit` | `Self Only` or `Assigned Data` |
| Purchaser | Order Center | Yes | `View / Create / Edit` | `Self Only` or `Assigned Data` |
| Purchaser | Contract Center | Optional | `View` | `Self Only` or `Assigned Data` |
| Purchaser | Shipment & Receiving | Optional | `View` | `Assigned Data` |
| Finance | Dashboard | Yes | `View` | `All Company Data` |
| Finance | Message Center | Yes | `View` | `All Company Data` |
| Finance | Document Center | Yes | `View` | `All Company Data` |
| Finance | Contract Center | Yes | `View` | `All Company Data` |
| Finance | Invoice & Statement Center | Yes | `View / Create / Edit / Approve` | `All Company Data` |
| Finance | Order Center | Optional | `View` | `All Company Data` |
| Warehouse Receiver | Dashboard | Yes | `View` | `Assigned Data` |
| Warehouse Receiver | Message Center | Yes | `View` | `Assigned Data` |
| Warehouse Receiver | Shipment & Receiving | Yes | `View / Create / Edit` | `Assigned Data` |
| Warehouse Receiver | Order Center | Optional | `View` | `Assigned Data` |
| Viewer | Granted Modules Only | Conditional | `View` only | `Self Only` or `Assigned Data` |

## 9.2 关键模块说明

### My Products

| Role | Permissions |
|---|---|
| Company Owner | `View / Create / Edit / Delete / Approve` |
| Company Admin | `View / Create / Edit / Delete / Approve` |
| Purchase Manager | `View / Create / Edit / Approve` |
| Purchaser | `View / Create / Edit` |
| Finance | Optional `View` |
| Warehouse Receiver | No access |
| Viewer | `View` |

### Inquiry Center

| Role | Permissions |
|---|---|
| Company Owner | `View / Create / Edit / Delete / Approve` |
| Company Admin | `View / Create / Edit / Delete / Approve` |
| Purchase Manager | `View / Create / Edit / Approve` |
| Purchaser | `View / Create / Edit` |
| Finance | Optional `View` |
| Warehouse Receiver | No access |
| Viewer | `View` |

### Order Center

| Role | Permissions |
|---|---|
| Company Owner | `View / Create / Edit / Delete / Approve` |
| Company Admin | `View / Create / Edit / Delete / Approve` |
| Purchase Manager | `View / Create / Edit / Approve` |
| Purchaser | `View / Create / Edit` |
| Finance | `View` |
| Warehouse Receiver | `View` |
| Viewer | `View` |

---

## 十、User Exception Authorization

### 页面目的

用于处理临时、特殊、紧急场景下的用户级例外授权。

### 固定 UI 元素

- Notice:
  `Exception authorization should only be used for temporary or special business needs. Standard role-based access control (RBAC) should remain the primary method of authorization.`
- Search Placeholder: `Search user name / account...`
- Filter: `All Types`
- Primary Button: `+ New Exception Entry`

### 表头

- `Target User`
- `Base Role`
- `Exception Type`
- `Target Module`
- `Effective Permission Scope`
- `Reason and Created Info`
- `Actions`

### 例外类型

- `Temporary Module Access`
- `Temporary Approval Permission`
- `Temporary Data Scope Expansion`
- `Acting on Behalf`
- `Emergency Business Access`

### 行操作

- `Edit`
- `Revoke`

### 空状态

- Title: `No exception authorization records`
- Description: `There are currently no active user-level exception authorization settings in the system.`

---

## 十一、Change Log

### 页面目的

用于记录权限相关配置变更，支持审计与回溯。

### 固定 UI 元素

- `Start Date`
- `End Date`
- Search Placeholder: `Search operator, change type, or content...`
- Button: `Filter Logs`
- Button: `Reset Filters`
- Button: `Export Audit Report`

### 页面说明

`The current page shows permission change records for customer-side configuration review and audit tracking.`

### 日志类型

- `Role Created`
- `Role Updated`
- `Role Deleted`
- `Menu Permission Changed`
- `Action Permission Changed`
- `Data Scope Changed`
- `Exception Authorization Added`
- `Exception Authorization Updated`
- `Exception Authorization Revoked`
- `Changes Published`

### 空状态

- Title: `No activity logs`
- Description: `No permission change records were found within the selected time range.`

---

## 十二、多语言策略

### 12.1 支持语言

客户侧权限中心默认语言为 English，并支持：

- `English`
- `Español`
- `Português`
- `العربية`

### 12.2 语言切换范围

语言切换只在客户侧主页体系内生效。

固定规则：

1. 客户侧门户切换语言后，客户侧 Permission Center 跟随切换
2. 我方侧 ERP 不跟随客户侧语言切换
3. 我方侧 Permission Center 不跟随客户侧语言切换
4. 客户侧与我方侧不共享同一个 locale 状态

### 12.3 翻译规则

- 角色显示名可翻译
- 模块显示名可翻译
- 按钮文案可翻译
- 角色编码不翻译
- 模块 code 不翻译
- 日志类型显示名可翻译，内部枚举不翻译

### 12.4 Arabic 特殊要求

- 客户侧权限中心在 Arabic 下支持 RTL
- code、ID、Role Code、Module Code 等技术字段保持 LTR
- 不重新设计布局，只做国际化方向适配

---

## 十三、实现约束

### 前端约束

- 客户侧 Permission Center 必须复用我方侧的页面骨架与组件布局
- 仅替换客户侧文案、模块树、角色列与矩阵数据
- 不允许为了客户侧需求擅自新增第六个页签
- 不允许修改现有 5 个页签顺序

### 后端约束

- 客户侧权限必须限制在客户自己的租户内
- 不允许客户角色配置平台级能力
- 角色、菜单、动作、数据范围、例外授权应共用统一 RBAC 模型
- 但客户侧与我方侧应使用不同的角色模板和模块基线

### 测试约束

- 验证客户侧 UI 与我方侧 UI 的结构一致性
- 验证 `Purchaser` 默认拥有 `My Products` 维护权限
- 验证语言切换只影响客户侧门户
- 验证 Arabic 下的 RTL 显示与表格 code 列表现

---

## 十四、最终需求冻结语句

本需求冻结为以下版本口径：

> The customer-side Permission Center must keep the exact same UI layout, tab structure, and interaction pattern as the internal-side Permission Center. Only role definitions, permission logic, business modules, and localized copy differ. Language switching applies only within the customer portal and does not affect the internal-side ERP.

