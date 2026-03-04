# 询价单（XJ）提交流转程序说明

## 📋 流程概述

当Admin端采购员在"询价管理"模块点击"提交"按钮时，XJ开头的询价单会自动流转到对应供应商账户的"客户需求池"模块。

## 🔄 完整流转路径

```
Admin端【采购需求池】
    ↓
  创建询价单（草稿状态）
    ↓
Admin端【询价管理】Tab
    ↓
  点击【提交】按钮
    ↓
  系统流转处理
    ↓
Supplier端【客户需求池】
```

## 💾 数据存储架构

### 1. Admin端创建阶段
- **存储位置**: `localStorage['rfqs']`
- **状态**: `status: 'draft'`
- **编号格式**: `XJ-YYMMDD-XXXX`
- **可见性**: 仅Admin端可见

### 2. 提交后流转阶段
- **存储位置**: `localStorage['supplierRFQs']`
- **状态**: Admin端显示`status: 'sent'`，Supplier端显示`status: 'pending'`
- **可见性**: 对应供应商Portal可见

## 🔧 技术实现

### 核心函数: `handleSubmitRFQToSupplier`

位置: `/components/admin/PurchaseOrderManagementEnhanced.tsx`

#### 执行步骤:

1. **防重复检查**
   ```typescript
   const alreadySubmitted = existingSupplierRFQs.some((item: any) => item.id === rfq.id);
   if (alreadySubmitted) {
     toast.error('该询价单已经提交给供应商，无需重复提交');
     return;
   }
   ```

2. **更新Admin端状态**
   ```typescript
   updateRFQ(rfq.id, {
     status: 'sent',
     sentDate: new Date().toISOString().split('T')[0]
   });
   ```

3. **构建供应商端数据**
   ```typescript
   const supplierRFQData = {
     id: rfq.id,
     supplierXjNo: rfq.supplierXjNo,  // XJ-YYMMDD-XXXX
     supplierCode: rfq.supplierCode,
     supplierEmail: rfq.supplierEmail,
     sourceQRNumber: rfq.requirementNo, // 关联QR号
     products: rfq.products,             // 产品清单
     documentData: rfq.documentData,     // 完整文档数据
     status: 'pending',                  // 供应商端状态
     ...
   };
   ```

4. **保存到供应商数据存储**
   ```typescript
   localStorage.setItem('supplierRFQs', JSON.stringify(updatedSupplierRFQs));
   ```

5. **触发实时更新事件**
   ```typescript
   window.dispatchEvent(new Event('storage'));
   ```

## 📊 供应商端接收机制

### RFQContext自动合并数据源

位置: `/contexts/RFQContext.tsx`

```typescript
const [rfqs, setRFQs] = useState<RFQ[]>(() => {
  // 合并两个数据源
  const adminRFQs = localStorage.getItem('rfqs');        // Admin草稿
  const supplierRFQs = localStorage.getItem('supplierRFQs'); // 已提交
  
  let allRFQs: RFQ[] = [];
  
  // 加载并去重
  if (adminRFQs) { allRFQs.push(...JSON.parse(adminRFQs)); }
  if (supplierRFQs) {
    JSON.parse(supplierRFQs).forEach(item => {
      if (!allRFQs.find(rfq => rfq.id === item.id)) {
        allRFQs.push(item);
      }
    });
  }
  
  return allRFQs;
});
```

### 供应商端过滤显示

位置: `/components/supplier/SupplierOrderManagementCenter.tsx`

```typescript
// 获取当前供应商的询价单
const myRFQs = useMemo(() => {
  if (!user?.email) return [];
  return getRFQsBySupplier(user.email); // 根据邮箱过滤
}, [rfqs, user?.email]);

// 分类显示在客户需求池
const categorizedRFQs = useMemo(() => {
  const pending = myRFQs.filter(rfq => {
    const myQuote = rfq.quotes?.find(q => q.supplierCode === user?.email);
    return !myQuote && rfq.status === 'pending'; // 未报价的显示在需求池
  });
  
  return { pending, quoted, accepted };
}, [myRFQs, user?.email]);
```

## 🎯 关键字段映射

| Admin端字段 | Supplier端字段 | 说明 |
|------------|---------------|------|
| `rfq.supplierXjNo` | `xjNumber` | XJ-YYMMDD-XXXX |
| `rfq.requirementNo` | `sourceQRNumber` | 关联的QR需求单号 |
| `rfq.supplierCode` | `supplierCode` | 供应商编码（过滤依据） |
| `rfq.supplierEmail` | `supplierEmail` | 供应商邮箱（过滤依据） |
| `status: 'sent'` | `status: 'pending'` | 状态映射 |
| `rfq.products` | `products` | 产品清单（多产品支持） |
| `rfq.documentData` | `documentData` | 完整询价单文档数据 |

## 🔐 权限隔离保证

1. **供应商邮箱匹配**: 通过`getRFQsBySupplier(user.email)`过滤
2. **数据源隔离**: Admin草稿（rfqs）和已提交（supplierRFQs）分开存储
3. **状态控制**: 只有draft状态的XJ询价单才显示"提交"按钮
4. **防重复提交**: 提交前检查supplierRFQs中是否已存在

## 🚀 流转特点

### ✅ 优势
- **实时推送**: 使用storage事件即时通知
- **数据完整**: 包含完整的documentData和产品清单
- **防重复**: 自动检测重复提交
- **可追溯**: 记录sentDate和状态变化
- **多产品支持**: 支持一次询价多个产品

### 📝 日志输出
提交时在console输出详细日志：
```
📤 [提交询价单] 已成功提交给供应商
  - 询价单号: XJ-251221-3862
  - 供应商: 东莞市华星电器有限公司
  - 供应商邮箱: supplier1@example.com
  - 产品数量: 5
  - 报价截止: 2025-12-23
```

## 🔍 调试方法

### 查看Admin端询价单
```javascript
JSON.parse(localStorage.getItem('rfqs'))
```

### 查看供应商端收到的询价单
```javascript
JSON.parse(localStorage.getItem('supplierRFQs'))
```

### 清空采购询价池（测试用）
```javascript
localStorage.removeItem('supplierRFQs');
```

## 📱 用户操作流程

### Admin端操作
1. 在【采购需求池】选择需求，点击"创建询价单"
2. 选择供应商，设置报价截止日期
3. 点击"提交"创建草稿状态的XJ询价单
4. 在【询价管理】Tab查看所有询价单
5. 找到草稿状态的询价单，点击"提交"按钮
6. 系统提示"✅ 询价单已提交"，状态变为"已发送"

### Supplier端查看
1. 登录供应商Portal
2. 进入【订单管理中心】
3. 在【客户需求池】Tab看到新的询价单
4. 显示状态为"待报价"
5. 可点击"报价"按钮创建报价单

## 🎨 UI显示

### Admin端询价管理
- **草稿状态**: 灰色背景，显示"编辑"和"提交"按钮
- **已发送状态**: 蓝色背景，只显示"查看"按钮
- **询价单号**: XJ-YYMMDD-XXXX（蓝色可点击）

### Supplier端客户需求池
- **待报价**: 橙色徽章
- **询价单号**: XJ-YYMMDD-XXXX
- **来源**: 显示关联的QR需求单号
- **操作**: "查看"、"报价"按钮

## 📌 注意事项

1. **不要清空数据**: 按照用户要求，所有表单不会被自动清空删除
2. **保持ID一致**: Admin端和Supplier端的XJ询价单使用同一个ID
3. **状态同步**: Admin端更新状态后会触发Supplier端刷新
4. **邮箱匹配**: 确保供应商登录邮箱与XJ询价单中的supplierEmail一致

---

**版本**: 1.0  
**最后更新**: 2025-12-21  
**维护人**: 系统架构组
