# 客户侧成员与账号管理模块 PRD

## 一、文档目的

本文用于定义客户侧门户中的 **成员与账号管理模块**，用于与客户侧 `Permission Center` 形成完整的管理闭环。

本文档重点回答：

1. 客户侧成员与账号管理模块要做什么
2. 管理员账号在这里承担什么职责
3. 该模块与 `Permission Center` 的边界是什么
4. 哪些角色可以管理成员、账号、角色分配

---

## 二、核心结论

客户侧必须同时具备两套管理能力：

1. **成员与账号管理**
2. **角色与权限管理**

其中：

- `成员与账号管理模块` 负责“人和账号”
- `Permission Center` 负责“角色和权限”

一句话：

> 没有成员与账号管理模块，客户侧 Permission Center 无法真正运转；没有 Permission Center，成员账号又无法形成清晰的角色边界。

---

## 三、产品定位

客户侧成员与账号管理模块用于回答：

1. 这个人是不是本企业成员
2. 这个人是否有登录账号
3. 账号是否启用、停用、锁定或待激活
4. 这个人当前被分配了什么角色
5. 这个人是否应被允许进入客户侧后台

它不负责：

- 直接配置菜单权限矩阵
- 直接配置动作权限矩阵
- 直接配置数据范围
- 替代 `Permission Center`

---

## 四、与 Permission Center 的边界

## 4.1 成员与账号管理模块负责

- 成员信息维护
- 邀请成员
- 开通账号
- 停用账号
- 查看账号状态
- 基础角色分配

## 4.2 Permission Center 负责

- 角色模板定义
- 菜单权限矩阵
- 动作权限配置
- 数据范围配置
- 人员例外授权
- 变更日志

## 4.3 标准链路

标准管理链路应为：

`创建成员 -> 开通账号 -> 分配角色 -> 角色决定权限 -> 如有特殊情况再走例外授权`

---

## 五、模块命名建议

结合现有客户侧页面基础，建议继续沿用：

- 一级模块：`People & Accounts Center`

并保留 3 个子页签：

1. `People Directory`
2. `Account Access`
3. `Role Permissions`

其中：

- `Role Permissions` 页中的“去权限中心”作为跳转入口
- 真正的角色矩阵和权限配置仍在独立 `Permission Center`

---

## 六、管理员账号体系

客户侧必须内置管理员账号体系。

### 建议角色

- `Company Owner`
- `Company Admin`

### 核心规则

- 只有 `Company Owner` 和 `Company Admin` 可以管理成员与账号
- 普通业务角色不能管理成员和账号
- `Company Owner` 是企业最高控制角色
- `Company Admin` 是日常组织管理角色

---

## 七、角色边界

## 7.1 Company Owner

### 可做

- 查看全部成员
- 邀请新成员
- 启用/停用账号
- 分配或调整角色
- 指定/更换 `Company Admin`
- 进入 `Permission Center`
- 发布权限变更

### 不应被限制

- 不应被普通管理员删除
- 不应被普通业务角色替代

---

## 7.2 Company Admin

### 可做

- 管理成员资料
- 邀请新成员
- 维护账号访问状态
- 分配业务角色
- 进入 `Permission Center`
- 处理例外授权

### 建议限制

- 不允许删除 `Company Owner`
- 不允许将自己提升为 `Company Owner`
- 不允许触达平台级后台能力

---

## 7.3 普通业务角色

包括：

- `Purchase Manager`
- `Purchaser`
- `Finance`
- `Warehouse Receiver`
- `Viewer`

### 原则

这些角色只能做业务，不应做组织管理。

### 明确限制

不允许：

- 邀请成员
- 停用账号
- 分配角色
- 管理权限中心
- 发布权限变更

---

## 八、页面结构建议

## 8.1 Page Header

建议延续现有客户侧主数据中心风格。

Title:

`People & Accounts Center`

Description:

`Manage enterprise contacts, login access, and customer-side role assignment.`

---

## 8.2 Sub-tab 1: People Directory

### 页面目的

维护企业成员主档。

### 建议能力

- 查看成员列表
- 搜索姓名 / 职位 / 邮箱 / 角色
- 查看所属部门
- 查看职位
- 查看业务邮箱
- 查看登录邮箱
- 查看成员状态

### 建议字段

- `Full Name`
- `Employee No.`
- `Department`
- `Title / Position`
- `Business Email`
- `Login Email`
- `Current Role`
- `Status`
- `Actions`

### 行操作

- `View Details`
- `Edit Member`
- `Invite`
- `Suspend`

### 说明

本页解决“人是否存在于企业成员目录中”。

---

## 8.3 Sub-tab 2: Account Access

### 页面目的

维护登录账号和账号状态。

### 建议能力

- 查看账号是否已开通
- 查看邀请是否已发送
- 查看账号状态
- 激活账号
- 停用账号
- 重发邀请
- 复制邀请链接

### 建议字段

- `Contact`
- `Login Email`
- `Role`
- `Account Status`
- `Login Access`
- `Last Login`
- `Invite Sent`
- `Actions`

### 建议账号状态

- `Active`
- `Invited`
- `Suspended`
- `Locked`
- `Pending Activation`

### 行操作

- `Activate`
- `Suspend`
- `Resend Invite`
- `Copy Invite Link`
- `View Details`

### 说明

本页解决“账号能不能登录”。

---

## 8.4 Sub-tab 3: Role Permissions

### 页面目的

做基础的角色分配与角色摘要展示。

### 建议能力

- 查看成员当前角色
- 修改成员角色
- 查看角色摘要
- 一键跳转 `Permission Center`

### 建议字段

- `Member`
- `Current Role`
- `Role Code`
- `Role Summary`
- `Actions`

### 行操作

- `Update Role`
- `Open Permission Center`

### 说明

本页只做“角色分配入口”和“角色摘要展示”，不承载复杂矩阵配置。

---

## 九、关键业务规则

## 9.1 成员与账号的区别

### 成员

表示此人属于客户企业组织。

### 账号

表示此人是否可以登录系统。

因此允许存在：

- 已建成员但未开通账号
- 已邀请但未激活账号
- 已停用账号但成员档案仍保留

---

## 9.2 角色分配与权限配置分离

成员与账号模块中可以做：

- 给某人选一个角色

但不在这里做：

- 修改角色的菜单权限
- 修改角色的动作权限
- 修改角色的数据范围

这些都必须跳转到 `Permission Center` 处理。

---

## 9.3 默认管理员初始化

客户企业首次开通时，至少应初始化：

- 1 个 `Company Owner`

如果业务需要，也可同步初始化：

- 1 个 `Company Admin`

### 初始化要求

- Owner 账号必须可登录
- Owner 必须能进入 `People & Accounts Center`
- Owner 必须能进入 `Permission Center`

---

## 9.4 `Purchaser` 的边界

`Purchaser` 是客户侧业务角色，不是管理角色。

虽然 `Purchaser` 默认拥有：

- `My Products`
- `Inquiry Center`
- `Order Center`

但不拥有：

- 成员管理
- 账号管理
- 权限发布

---

## 十、建议的英文 UI 文案

### Page Title

`People & Accounts Center`

### Description

`Manage enterprise contacts, login access, and customer-side role assignment.`

### Sub-tabs

- `People Directory`
- `Account Access`
- `Role Permissions`

### Common Actions

- `Invite Member`
- `Activate`
- `Suspend`
- `Resend Invite`
- `Copy Invite Link`
- `View Details`
- `Update Role`
- `Open Permission Center`

---

## 十一、多语言规则

本模块与客户侧 `Permission Center` 一样，跟随客户侧主页语言切换。

支持：

- `English`
- `Español`
- `Português`
- `العربية`

固定规则：

- 语言切换只在客户侧门户内生效
- 我方侧 ERP 不跟随切换
- role code 与系统 code 不翻译

---

## 十二、权限规则建议

## 12.1 可管理本模块的角色

仅：

- `Company Owner`
- `Company Admin`

## 12.2 可查看但不可管理的角色

可按业务选择是否允许：

- `Purchase Manager`

若允许，也应仅为只读，不应具备编辑成员和账号的能力。

## 12.3 不应进入本模块的角色

- `Purchaser`
- `Finance`
- `Warehouse Receiver`
- `Viewer`

---

## 十三、验收点

本模块验收至少包括：

1. `Company Owner` 可邀请成员
2. `Company Owner` 可分配角色
3. `Company Admin` 可管理成员账号
4. 普通业务角色不可进入成员管理主流程
5. `Role Permissions` 页可跳转到 `Permission Center`
6. 客户侧主页切换语言后，本模块文案同步切换

---

## 十四、最终需求冻结语句

> The customer-side portal must provide a People & Accounts Center to manage enterprise members, account access, and role assignment. Only Company Owner and Company Admin may manage members, accounts, and role assignment. Detailed role permission configuration remains in the customer-side Permission Center.

