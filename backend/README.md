### PHP 后端推荐：Laravel（首选）

你这个项目是典型的 **多角色门户（Customer/Admin/Supplier）+ RBAC + 审批流/通知流 + MySQL**，用 Laravel 最省心。

本目录提供一个 **Docker + MySQL 8 + Nginx + PHP-FPM** 的后端运行环境骨架，并给出初始化 Laravel 的步骤。

---

### 0) 先说明（为什么你会“卡住”）

Laravel 初始化需要 **PHP + Composer**（或 Docker）。如果你的机器里：

- 没装 PHP / Composer
- 或没装 Docker Desktop（`docker` 命令不可用）

就会无法创建 `backend/api`，看起来像“卡住”。

---

### 1) 准备（Windows 推荐方案）

二选一即可：

- **方案 A（最推荐）**：安装 **Docker Desktop**（Windows），后续用 `docker compose` 跑 MySQL + PHP-FPM + Nginx  
- **方案 B（不装 Docker）**：安装 **PHP 8.2+ + Composer 2.x**

Windows 上最省事的安装方式：

- **Laragon**（推荐）：自带 PHP、Nginx/Apache、MySQL（可选）并且很适合本地开发  
- 或 **XAMPP/WAMP** + 额外安装 Composer

> 如果你只想本地起 Laravel，不想装数据库，也可以只装 PHP+Composer，然后 MySQL 用你现有的服务器/云数据库。

---

### 2) 初始化 Laravel（生成代码）

在项目根目录下执行（会创建 `backend/api`）：

```bash
cd backend
composer create-project laravel/laravel api
```

如果你的 `composer` 命令不存在，说明还没装 Composer（或没加入 PATH），请先完成上面的“准备”。

---

### 3) Laravel 连接本项目 MySQL

把 Laravel 的数据库配置指向本项目的 MySQL（如果你用 docker-compose，就用 mysql 容器名；如果你用本机 MySQL，就用 127.0.0.1）。

复制 env：

```bash
copy api\.env.example api\.env
```

并修改 `backend/api/.env`（示例）：

```env
APP_NAME=COSUN-B2B
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cosun_b2b
DB_USERNAME=root
DB_PASSWORD=你的密码
```

---

### 4) 启动（不使用 Docker）

```bash
cd backend/api
php artisan key:generate
php artisan serve --host=0.0.0.0 --port=8000
```

启动后：
- Laravel: `http://localhost:8000`

---

### 5) 初始化数据库表结构与种子数据

把你已经生成的 MySQL SQL 执行进去：

```bash
mysql -u root -p < ..\database\mysql\schema.sql
mysql -u root -p < ..\database\mysql\seed.sql
```

---

### 6) 下一步我建议你做的后端模块（Laravel）

- `auth`：登录/退出/JWT 或 Sanctum token
- `users` / `organizations`：账号与组织
- `inquiries` / `quotations` / `orders`：核心业务 API
- `approvals` / `notifications`：审批与通知

