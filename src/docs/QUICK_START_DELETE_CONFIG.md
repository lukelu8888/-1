# 🚀 订单删除功能 - 快速配置指南

## ⚡ 5分钟快速上手

---

## 📍 当前状态（测试阶段）

```typescript
// 文件: /config/admin.config.ts

TEST_MODE: true  ✅ 当前激活
```

**✅ 当前行为：所有订单都可以删除**

---

## 🎯 正式发布时只需 1 步

### **打开配置文件**
```bash
/config/admin.config.ts
```

### **修改这一行**
```typescript
- TEST_MODE: true,   // 测试模式
+ TEST_MODE: false,  // 生产模式 ⚠️
```

### **完成！🎉**
- ✅ 生产模式激活
- ✅ 只有测试订单可删除
- ✅ 正式订单受保护

---

## 📊 三种模式对比

| 模式 | 配置 | 删除权限 |
|-----|------|---------|
| **测试阶段** | `TEST_MODE: true` | ✅ 所有订单 |
| **生产环境** | `TEST_MODE: false` | 🟡 仅测试订单 |
| **完全锁定** | `TEST_MODE: false`<br>`ALLOW_DELETE_TEST_ORDERS: false` | ❌ 禁止删除 |

---

## 🏷️ 如何标记测试订单

```typescript
const order = {
  id: 'ORD-TEST-2025-0001',
  customer: 'Test Company',
  isTest: true,  // 🔖 标记为测试订单
  // ... 其他字段
}
```

**生产环境下，只有 `isTest: true` 的订单才能删除！**

---

## ✅ 发布前检查清单

```
[ ] 打开 /config/admin.config.ts
[ ] 修改 TEST_MODE: false
[ ] 保存文件
[ ] 重启应用
[ ] 验证只有测试订单可删除
[ ] 完成！
```

---

## 🆘 常见问题

### **Q: 正式环境如何删除测试数据？**
A: 为测试订单添加 `isTest: true` 标记，即可在生产环境删除。

### **Q: 误删了重要订单怎么办？**
A: 删除操作无法撤销，建议定期备份数据库。

### **Q: 如何完全禁止删除功能？**
A: 设置 `ALLOW_DELETE_TEST_ORDERS: false`

---

## 📞 需要帮助？

详细文档: `/docs/DELETE_CONFIGURATION_GUIDE.md`

---

**记住：正式发布前，一定要把 `TEST_MODE` 改为 `false`！⚠️**
