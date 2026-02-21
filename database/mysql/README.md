### MySQL 数据库（基于当前项目“写死数据”整理）

本目录提供 **MySQL 8.0** 的建库建表与初始化数据脚本，用来替代当前项目里大量 `localStorage` / mock 数据。

### 文件说明

- `schema.sql`: 建库 + 建表（含外键、索引、JSON字段）
- `seed.sql`: 初始化测试账号/客户/供应商 + 订单样例（来自项目里的写死数据）

### 执行方式

在 MySQL 客户端里依次执行：

```sql
SOURCE /path/to/schema.sql;
SOURCE /path/to/seed.sql;
```

或命令行：

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

### 说明

- 当前为了“快速跑通”，seed 里会把明文密码写入 `users.password_plain`（**仅 DEMO**，便于你找回测试账号密码 / 批量重新 hash）。
- 后端认证请使用 `users.password`（bcrypt/argon2 hash）。上线前建议清空或移除 `password_plain` 字段。
- `document_sequences` 提供服务端生成单据号的基础表（对应 `RFQ/QT/SC/PO/YS/SK...` 的累计序列号逻辑）。

