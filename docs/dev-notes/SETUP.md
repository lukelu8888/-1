# 🚀 福建高盛达富B2B外贸系统 - 设置指南

## 📋 系统概述

这是一个完整的B2B外贸管理系统，包括：
- **Customer Portal** - 客户门户（Home Depot风格）
- **Admin Portal** - 管理后台（台湾大厂蓝灰色调）
- **Supplier Portal** - 供应商门户

## 🎯 首次使用步骤

### 1. 初始化数据库

**方式A：通过登录页面**
1. 访问系统：打开应用
2. 前往Admin登录页：点击"Admin Portal"
3. 点击"🚀 初始化数据库（首次使用）"按钮
4. 等待2-3分钟完成初始化

**方式B：直接访问**
1. 浏览器访问：`/init-database`
2. 点击"开始初始化数据库"
3. 等待完成

### 2. 使用测试账号登录

初始化完成后，系统会创建7个测试账号：

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| CEO (张明) | zhangming | cosun123 | 全部权限 |
| CFO (李华) | lihua | cosun123 | 财务+数据分析 |
| 销售主管 (王强) | wangqiang | cosun123 | 销售+客户+订单 |
| 业务员 (Maria) | maria | cosun123 | 基础销售功能 |
| 财务 (赵敏) | zhaomin | cosun123 | 财务管理 |
| 采购 (刘洋) | liuyang | cosun123 | 供应链管理 |
| 管理员 (Admin) | admin | admin123 | 系统管理 |

### 3. 测试系统功能

建议按以下顺序测试：

1. **CEO账号登录** → 查看CEO驾驶舱，完整功能访问
2. **切换角色** → 使用右上角角色切换器测试不同角色
3. **业务流程** → 创建询价→生成报价→签订合同→收款
4. **权限验证** → 切换到"业务员"角色，验证财务模块不可见

## 🏗️ 技术架构

### 前端
- React + TypeScript
- Tailwind CSS v4.0
- Shadcn/UI组件库

### 后端
- Supabase Edge Functions (Hono框架)
- PostgreSQL数据库
- KV Store数据存储

### 部署
- **开发环境**: Figma Make本地预览
- **生产环境**: Vercel (推荐) 或其他云平台

## 📊 数据库结构

系统使用Supabase的KV Store存储以下数据：

| 数据类型 | Key前缀 | 说明 |
|---------|---------|------|
| 用户账号 | `user:*` | 登录认证 |
| 客户信息 | `customer:*` | 客户管理 |
| 询价单 | `inquiry:*` | 询价管理 |
| 报价单 | `quotation:*` | 报价管理 |
| 订单 | `order:*` | 订单管理 |
| 应收账款 | `receivable:*` | 财务管理 |
| 供应商 | `supplier:*` | 供应链管理 |
| 服务商 | `service_provider:*` | 服务商管理 |
| 产品 | `product:*` | 产品目录 |

## 🔐 权限系统 (RBAC)

### 权限类型

系统实现了基于角色的访问控制(RBAC)：

```typescript
// 权限配置文件：/lib/rbac-config.ts

CEO: 30+ 权限 (全部)
CFO: 25 权限 (财务+数据)
销售主管: 20 权限 (销售+客户+订单)
业务员: 10 权限 (基础销售)
财务: 15 权限 (财务管理)
采购: 12 权限 (供应链)
Admin: 30+ 权限 (系统管理)
```

### 菜单过滤

每个菜单项都配置了所需权限，系统会自动根据用户角色过滤显示：

- **CEO** → 看到所有模块
- **CFO** → 看不到"角色权限管理"和"数据备份"
- **销售主管** → 看不到"财务管理"和"供应商管理"
- **业务员** → 只看到基础模块

## 🔄 边测试边修改

### 开发流程

1. **在Figma Make中修改**
   - 对话AI助手："请修改客户管理界面..."
   - 立即在预览窗口查看效果

2. **测试功能**
   - 切换不同角色测试
   - 验证权限控制
   - 测试业务流程

3. **满意后部署**
   - 点击"Deploy"按钮
   - 2分钟后团队可访问新版本

### 数据持久化

- ✅ 连接Supabase后，所有数据存储在云端
- ✅ 刷新浏览器数据不会丢失
- ✅ 多用户看到相同数据
- ✅ 支持实时协作

## 📦 数据迁移

### 导出数据

随时可以从Supabase导出数据：

```bash
# 方法1：Supabase控制台
Database → Backup → Export SQL

# 方法2：pg_dump命令
pg_dump -h your-host -U postgres -d your-db > backup.sql
```

### 迁移到其他数据库

Supabase使用标准PostgreSQL，可迁移到：
- 阿里云RDS
- 腾讯云PostgreSQL
- AWS RDS
- 自建服务器

迁移时间：1-2小时

## 🚀 部署到生产环境

### 使用Vercel（推荐）

1. **连接GitHub**
   - 将项目push到GitHub仓库

2. **导入Vercel**
   - 访问vercel.com
   - Import项目
   - 配置环境变量

3. **部署**
   - 自动构建和部署
   - 获得网址：`https://your-app.vercel.app`

### 环境变量配置

需要在Vercel配置：

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## 📞 支持

如有问题，请联系：
- 技术支持：通过Figma Make AI助手
- 系统管理员：admin@cosun.com

## 📝 更新日志

### v1.0.0 (2024-11-24)
- ✅ 完成数据库初始化系统
- ✅ 实现RBAC权限菜单过滤
- ✅ 创建7个角色测试账号
- ✅ 完整B2B业务闭环
- ✅ 三Portal架构实现

---

**COSUN Building Materials Co., Ltd.**
*助力客户与供应商共同成长* 🌱
