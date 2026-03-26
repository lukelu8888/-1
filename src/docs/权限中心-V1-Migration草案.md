# 权限中心 V1 Migration 草案

## 一、目标

本草案用于为新建的 **权限中心 V1** 提供正式落库结构建议。

边界：
- 不破坏现有图1、图2
- 不替代企业主数据中心
- 只为新权限中心准备独立权限数据结构

---

## 二、V1 建议新增表

### 1. `permission_roles`
### 2. `permission_modules`
### 3. `permission_role_module_access`
### 4. `permission_role_module_actions`
### 5. `permission_role_module_scopes`
### 6. `permission_user_exceptions`
### 7. `permission_change_logs`

---

## 三、统一约束策略

### 1. 状态/类型字段
统一采用：
- `TEXT + CHECK`

### 2. 主键
统一采用：
- `UUID`

### 3. 快照与扩展信息
统一采用：
- 普通字段承载核心结构
- `JSONB` 只承载：
  - 可变规则快照
  - before/after 快照
  - 例外配置附加规则

### 4. 审计字段
每张表建议至少带：
- `created_at`
- `updated_at`

---

## 四、表结构草案

## 1. `permission_roles`

### 用途
正式角色字典。

### 字段
- `id` UUID PK
- `role_code` TEXT NOT NULL
- `role_name_zh` TEXT NOT NULL
- `role_name_en` TEXT NULL
- `role_type` TEXT NOT NULL
- `is_internal` BOOLEAN NOT NULL DEFAULT true
- `requires_region` BOOLEAN NOT NULL DEFAULT false
- `default_scope` TEXT NOT NULL
- `allow_login` BOOLEAN NOT NULL DEFAULT true
- `is_system_role` BOOLEAN NOT NULL DEFAULT true
- `description` TEXT NULL
- `status` TEXT NOT NULL DEFAULT `active`
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- UNIQUE: `role_code`
- CHECK `role_type` IN
  - `executive`
  - `management`
  - `business`
  - `support`
  - `external`
- CHECK `default_scope` IN
  - `all`
  - `region`
  - `department`
  - `subordinate`
  - `own`
  - `assigned`
- CHECK `status` IN
  - `active`
  - `inactive`

### 索引
- `idx_permission_roles_status (status)`
- `idx_permission_roles_type (role_type)`

---

## 2. `permission_modules`

### 用途
权限中心识别的模块字典。

### 字段
- `id` UUID PK
- `module_code` TEXT NOT NULL
- `module_name_zh` TEXT NOT NULL
- `module_name_en` TEXT NULL
- `module_category` TEXT NOT NULL
- `parent_module_code` TEXT NULL
- `module_level` INTEGER NOT NULL DEFAULT 1
- `route_key` TEXT NULL
- `description` TEXT NULL
- `status` TEXT NOT NULL DEFAULT `active`
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- UNIQUE: `module_code`
- CHECK `module_category` IN
  - `core`
  - `business`
  - `finance`
  - `supply_chain`
  - `system`
  - `support`
- CHECK `status` IN
  - `active`
  - `inactive`

### 索引
- `idx_permission_modules_category (module_category)`
- `idx_permission_modules_status (status)`
- `idx_permission_modules_parent (parent_module_code)`

---

## 3. `permission_role_module_access`

### 用途
角色对模块的菜单可见性。

### 字段
- `id` UUID PK
- `role_id` UUID NOT NULL
- `module_id` UUID NOT NULL
- `is_visible` BOOLEAN NOT NULL DEFAULT false
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- FK: `role_id` -> `permission_roles.id`
- FK: `module_id` -> `permission_modules.id`
- UNIQUE: `(role_id, module_id)`

### 索引
- `idx_permission_role_module_access_role (role_id)`
- `idx_permission_role_module_access_module (module_id)`

---

## 4. `permission_role_module_actions`

### 用途
角色在某模块内的动作权限。

### 字段
- `id` UUID PK
- `role_id` UUID NOT NULL
- `module_id` UUID NOT NULL
- `action_code` TEXT NOT NULL
- `is_allowed` BOOLEAN NOT NULL DEFAULT false
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- FK: `role_id` -> `permission_roles.id`
- FK: `module_id` -> `permission_modules.id`
- UNIQUE: `(role_id, module_id, action_code)`
- CHECK `action_code` IN
  - `view`
  - `create`
  - `edit`
  - `delete`
  - `approve`
  - `export`
  - `print`
  - `manage`

### 索引
- `idx_permission_role_module_actions_role (role_id)`
- `idx_permission_role_module_actions_module (module_id)`
- `idx_permission_role_module_actions_code (action_code)`

---

## 5. `permission_role_module_scopes`

### 用途
角色在某模块内的数据范围。

### 字段
- `id` UUID PK
- `role_id` UUID NOT NULL
- `module_id` UUID NOT NULL
- `scope_code` TEXT NOT NULL
- `scope_rules` JSONB NOT NULL DEFAULT `'{}'::jsonb`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- FK: `role_id` -> `permission_roles.id`
- FK: `module_id` -> `permission_modules.id`
- UNIQUE: `(role_id, module_id)`
- CHECK `scope_code` IN
  - `all`
  - `region`
  - `department`
  - `subordinate`
  - `own`
  - `assigned`

### 索引
- `idx_permission_role_module_scopes_role (role_id)`
- `idx_permission_role_module_scopes_module (module_id)`
- `idx_permission_role_module_scopes_code (scope_code)`

### JSONB 边界
`scope_rules` 只用于扩展规则，如：
- 指定区域集合
- 指定部门集合
- 特殊排除条件

---

## 6. `permission_user_exceptions`

### 用途
具体人员的例外授权。

### 字段
- `id` UUID PK
- `user_profile_id` UUID NOT NULL
- `role_id` UUID NOT NULL
- `module_id` UUID NOT NULL
- `exception_type` TEXT NOT NULL
- `action_overrides` JSONB NOT NULL DEFAULT `'{}'::jsonb`
- `scope_override_code` TEXT NULL
- `scope_override_rules` JSONB NOT NULL DEFAULT `'{}'::jsonb`
- `effective_from` TIMESTAMPTZ NULL
- `effective_to` TIMESTAMPTZ NULL
- `reason` TEXT NULL
- `approved_by` TEXT NULL
- `status` TEXT NOT NULL DEFAULT `active`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- FK: `role_id` -> `permission_roles.id`
- FK: `module_id` -> `permission_modules.id`
- CHECK `exception_type` IN
  - `grant`
  - `restrict`
- CHECK `scope_override_code` IN
  - `all`
  - `region`
  - `department`
  - `subordinate`
  - `own`
  - `assigned`
  OR `scope_override_code IS NULL`
- CHECK `status` IN
  - `active`
  - `inactive`
  - `expired`

### 索引
- `idx_permission_user_exceptions_user (user_profile_id)`
- `idx_permission_user_exceptions_role (role_id)`
- `idx_permission_user_exceptions_module (module_id)`
- `idx_permission_user_exceptions_status (status)`

### JSONB 边界
- `action_overrides`
  - 只记录动作增减差异
- `scope_override_rules`
  - 只记录范围扩展/限制规则

---

## 7. `permission_change_logs`

### 用途
权限配置变更日志。

### 字段
- `id` UUID PK
- `change_type` TEXT NOT NULL
- `target_type` TEXT NOT NULL
- `target_key` TEXT NOT NULL
- `before_snapshot` JSONB NOT NULL DEFAULT `'{}'::jsonb`
- `after_snapshot` JSONB NOT NULL DEFAULT `'{}'::jsonb`
- `changed_by` TEXT NULL
- `change_reason` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 约束
- PK: `id`
- CHECK `change_type` IN
  - `create`
  - `update`
  - `delete`
- CHECK `target_type` IN
  - `role`
  - `module_access`
  - `module_action`
  - `module_scope`
  - `user_exception`

### 索引
- `idx_permission_change_logs_target (target_type, target_key)`
- `idx_permission_change_logs_changed_by (changed_by)`
- `idx_permission_change_logs_created_at (created_at)`

### JSONB 边界
- `before_snapshot`
- `after_snapshot`
只用于审计，不参与业务核心筛选

---

## 五、建议初始化内容

### 1. 初始化正式角色
基于：
- [我方侧正式角色清单-V2-扩展版.md](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/docs/%E6%88%91%E6%96%B9%E4%BE%A7%E6%AD%A3%E5%BC%8F%E8%A7%92%E8%89%B2%E6%B8%85%E5%8D%95-V2-%E6%89%A9%E5%B1%95%E7%89%88.md)

### 2. 初始化模块字典
从现有：
- `AdminDashboard`
- 旧图2菜单矩阵
提炼模块编码与分类

### 3. 初始化菜单矩阵
先迁图2的勾叉结果

### 4. 初始化动作与范围
先迁旧图1里真正有效的逻辑

---

## 六、推荐落地顺序

### 第一批
- `permission_roles`
- `permission_modules`
- `permission_role_module_access`

### 第二批
- `permission_role_module_actions`
- `permission_role_module_scopes`

### 第三批
- `permission_user_exceptions`
- `permission_change_logs`

---

## 七、V1 不建议立即落地的内容

暂不建议：
- 字段级权限
- 行级表达式权限引擎
- 多租户权限模型
- 客户侧/供应商侧统一权限中心

先把我方侧权限中心做稳。

---

## 八、结论

权限中心 V1 的 migration 草案应围绕这七张表展开，形成：

`角色`
→ `菜单`
→ `动作`
→ `范围`
→ `例外`
→ `日志`

这套结构既能承接现有图1、图2，又能符合大厂常见的权限中心分层设计。

