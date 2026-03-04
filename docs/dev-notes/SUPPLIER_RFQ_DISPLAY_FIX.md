# 🔧 采购询价单显示问题修复

## 问题描述

供应商端（东莞市华盛电器有限公司账号）的询价报价管理下的待报价列表，产品信息显示为"N/A"，需求数量显示为0。

## 问题原因

代码试图从 `rfq.items` 数组中读取产品信息，但RFQ对象的结构中产品信息是直接字段，不是数组：

### ❌ 错误的代码
```typescript
const firstItem = rfq.items?.[0];

<p>{firstItem?.productName || 'N/A'}</p>
<p>{firstItem?.modelNo || ''}</p>
<span>{firstItem?.quantity?.toLocaleString() || 0}</span>
```

### ✅ 正确的代码
```typescript
<p>{rfq.productName || 'N/A'}</p>
<p>{rfq.modelNo || ''}</p>
<span>{rfq.quantity?.toLocaleString() || 0}</span>
```

## RFQ数据结构

根据 `/contexts/RFQContext.tsx` 的定义，RFQ对象的产品信息字段为：

```typescript
export interface RFQ {
  id: string;
  rfqNumber: string;
  
  // 产品信息（直接字段，不是数组）
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency?: string;
  
  // 供应商信息
  supplierCode: string;
  supplierName: string;
  supplierEmail: string;
  
  // 其他字段...
}
```

## 修复内容

### 1. 表格显示修复 (`/components/supplier/SupplierQuotationsSimple.tsx`)

**位置**: 第313-343行

**修改前**:
```typescript
const firstItem = rfq.items?.[0];

<TableCell className="py-3" style={{ fontSize: '13px' }}>
  <div>
    <p className="font-medium text-gray-900">{firstItem?.productName || 'N/A'}</p>
    <p className="text-xs text-gray-500">{firstItem?.modelNo || ''}</p>
  </div>
</TableCell>
<TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
  <span className="font-medium">{firstItem?.quantity?.toLocaleString() || 0}</span>
  <span className="text-gray-500 ml-1">{firstItem?.unit || ''}</span>
</TableCell>
```

**修改后**:
```typescript
<TableCell className="py-3" style={{ fontSize: '13px' }}>
  <div>
    <p className="font-medium text-gray-900">{rfq.productName || 'N/A'}</p>
    <p className="text-xs text-gray-500">{rfq.modelNo || ''}</p>
    {rfq.specification && (
      <p className="text-xs text-gray-500">{rfq.specification}</p>
    )}
    {rfq.remarks && (
      <p className="text-xs text-orange-600 mt-1">{rfq.remarks}</p>
    )}
  </div>
</TableCell>
<TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
  <span className="font-medium">{rfq.quantity?.toLocaleString() || 0}</span>
  <span className="text-gray-500 ml-1">{rfq.unit || ''}</span>
</TableCell>
```

### 2. 详情对话框增强

**位置**: 第495-519行

**功能**: 添加了单产品信息的显示逻辑，支持两种情况：
- 如果有 `items` 数组，显示产品清单（多产品）
- 如果没有 `items` 数组，显示单个产品信息

**代码**:
```typescript
{detailRFQ.items && detailRFQ.items.length > 0 ? (
  // 多产品清单显示
  <div className="border-t pt-4">
    <h4 className="font-semibold mb-3 text-sm">产品清单</h4>
    {detailRFQ.items.map((item, idx) => (
      // ... 产品项
    ))}
  </div>
) : (
  // 单产品信息显示
  <div className="border-t pt-4">
    <h4 className="font-semibold mb-3 text-sm">产品信息</h4>
    <div className="bg-gray-50 p-4 rounded border">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-600">产品名称</p>
          <p className="text-sm font-medium">{detailRFQ.productName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">型号</p>
          <p className="text-sm font-medium">{detailRFQ.modelNo}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">需求数量</p>
          <p className="text-sm font-semibold">{detailRFQ.quantity} {detailRFQ.unit}</p>
        </div>
        {detailRFQ.targetPrice && (
          <div>
            <p className="text-xs text-gray-600">目标价格</p>
            <p className="text-sm font-medium text-orange-600">{detailRFQ.currency} {detailRFQ.targetPrice}</p>
          </div>
        )}
        {detailRFQ.specification && (
          <div className="col-span-2">
            <p className="text-xs text-gray-600">规格说明</p>
            <p className="text-sm">{detailRFQ.specification}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

## 测试方法

### 1. 测试供应商账号

**账号信息**:
- 用户名: `zhang`
- 密码: `supplier123`
- 公司: 东莞市华盛电器有限公司
- 邮箱: `zhang@huasheng.com`
- 供应商代码: `DG-HS-001`

### 2. 测试流程

**Step 1: 采购员创建询价单**
1. 使用Admin账号登录
2. 进入"采购订单管理" → "采购需求池"
3. 点击任一需求的"创建询价单"按钮
4. 选择产品和供应商（选择"东莞市华盛电器有限公司"）
5. 设置报价截止日期
6. 点击"发送询价单"

**Step 2: 供应商查看询价单**
1. 登出Admin账号
2. 使用供应商账号登录（zhang / supplier123）
3. 进入"询价报价"模块
4. 查看"待报价"列表

**预期结果**:
- ✅ 产品名称正确显示（不是"N/A"）
- ✅ 型号正确显示
- ✅ 需求数量正确显示（不是0）
- ✅ 单位正确显示
- ✅ 规格说明正确显示（如果有）
- ✅ 备注正确显示（如果有）

**Step 3: 查看详情**
1. 点击某个询价单的"详情"按钮
2. 查看详情对话框

**预期结果**:
- ✅ 产品信息完整显示
- ✅ 包含产品名称、型号、数量、单位
- ✅ 如果有目标价格，也应该显示
- ✅ 如果有规格说明，也应该显示

**Step 4: 提交报价**
1. 点击某个询价单的"报价"按钮
2. 填写报价信息
3. 提交报价

**预期结果**:
- ✅ 报价成功提交
- ✅ 询价单状态变为"已报价"
- ✅ 在"已报价"标签页可以看到报价信息

## 数据流程

```
1. 采购员创建RFQ
   ↓
2. handleSubmitRFQ() 创建RFQ对象
   ├─ productName: item.productName
   ├─ modelNo: item.modelNo
   ├─ quantity: item.quantity
   ├─ unit: item.unit
   ├─ supplierEmail: supplier.email
   └─ supplierCode: supplier.code
   ↓
3. 保存到RFQContext (localStorage)
   ↓
4. 供应商Portal读取
   ├─ getRFQsBySupplier(user.email)
   ├─ 匹配条件: rfq.supplierEmail === user.email
   └─ 返回匹配的RFQ列表
   ↓
5. 显示在表格中
   ├─ 直接使用 rfq.productName
   ├─ 直接使用 rfq.modelNo
   ├─ 直接使用 rfq.quantity
   └─ 直接使用 rfq.unit
```

## 注意事项

1. **字段名称**: RFQ对象中产品信息是直接字段，不是items数组
2. **兼容性**: 代码同时支持有items数组和没有items数组两种情况
3. **供应商匹配**: 使用 `supplierEmail` 字段匹配供应商
4. **数据持久化**: RFQ数据保存在localStorage中

## 相关文件

- `/components/supplier/SupplierQuotationsSimple.tsx` - 采购询价报价管理
- `/contexts/RFQContext.tsx` - RFQ数据Context
- `/data/authorizedUsers.ts` - 供应商账号数据
- `/data/suppliersData.ts` - 供应商信息数据
- `/components/admin/PurchaseOrderManagementEnhanced.tsx` - 采购员创建询价单

## 后续优化建议

1. **批量询价**: 支持一次向多个供应商发送同一产品的询价
2. **询价单模板**: 显示完整的采购询价单PDF文档
3. **报价对比**: 在Admin端对比不同供应商的报价
4. **邮件通知**: 发送询价单时自动邮件通知供应商
5. **在线协商**: 支持供应商和采购员在线沟通询价细节
