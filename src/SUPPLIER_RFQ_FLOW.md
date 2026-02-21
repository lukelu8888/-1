# 📋 供应商询价单流程说明

## 🎯 系统架构

### 1. 询价单模板
- **文件位置**: `/components/documents/templates/SupplierRFQDocument.tsx`
- **编号规则**: `XJ-YYMMDD-XXXX`（XJ = 询价）
- **格式**: A4纸张，专业商业文档格式
- **特点**: 
  - 参考采购订单格式，但简化为询价功能
  - 不包含供应商收款信息
  - 不包含正式采购合同条款
  - 包含必要的询价条款和要求

### 2. 数据结构
```typescript
export interface SupplierRFQData {
  rfqNo: string;                      // 询价单号 XJ-251218-1001
  rfqDate: string;                    // 询价日期
  requiredResponseDate: string;       // 要求回复日期
  requiredDeliveryDate: string;       // 要求交货日期
  
  buyer: {                            // 采购方信息（高盛达富）
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;
  };
  
  supplier: {                         // 供应商信息
    companyName: string;
    address: string;
    contactPerson: string;
    tel: string;
    email: string;
    supplierCode: string;
  };
  
  products: Array<{                   // 产品清单
    no: number;
    modelNo: string;
    description: string;
    specification: string;
    quantity: number;
    unit: string;
    targetPrice?: string;             // 目标价格（可选）
    remarks?: string;
  }>;
  
  terms: {                            // 询价条款
    currency: string;
    paymentTerms: string;
    deliveryTerms: string;
    deliveryAddress: string;
    qualityStandard: string;
    inspectionMethod: string;
    deliveryRequirement: string;
    packaging: string;
    shippingMarks: string;
    inspectionRequirement: string;
    technicalDocuments: string;
    ipRights: string;
    confidentiality: string;
    sampleRequirement: string;
    moq: string;
    remarks: string;
  };
}
```

## 🔄 完整流程

### 第一步：采购员创建询价单

**入口**: Admin Portal → 采购订单管理 → 采购需求池 → "创建询价单"按钮

**流程**:
1. 选择要询价的产品（支持多选）
2. 搜索并选择供应商（支持多选）
3. 每个供应商旁边有"预览"按钮，可查看询价单效果
4. 设置报价截止日期
5. 填写备注说明

**关键代码**: `/components/admin/PurchaseOrderManagementEnhanced.tsx`

```typescript
// 生成询价单文档数据
const generateRFQDocumentData = (
  supplier: Supplier,
  requirement: PurchaseRequirement,
  deadline: Date,
  remarks: string
): SupplierRFQData => {
  // 生成询价单号
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  const rfqNo = `XJ-${dateStr}-${random}`;
  
  // 构建完整文档数据
  return {
    rfqNo,
    rfqDate: new Date().toISOString().split('T')[0],
    requiredResponseDate: deadline.toISOString().split('T')[0],
    requiredDeliveryDate: requirement.requiredDate,
    buyer: { /* 高盛达富信息 */ },
    supplier: { /* 供应商信息 */ },
    products: selectedProducts.map((item, index) => ({
      no: index + 1,
      modelNo: item.modelNo,
      description: item.productName,
      specification: item.specification || '',
      quantity: item.quantity,
      unit: item.unit,
      targetPrice: item.targetPrice ? `${item.targetCurrency} ${item.targetPrice}` : undefined,
      remarks: item.remarks
    })),
    terms: { /* 询价条款 */ }
  };
};
```

### 第二步：预览询价单

**功能**: 采购员可以在提交前预览每个供应商的询价单

**特点**:
- 实时生成PDF预览
- 支持打印
- 支持下载PDF
- 每个供应商看到的是专属的询价单文档

**代码位置**:
```typescript
// 预览单个供应商的询价单
const handlePreviewRFQ = (supplier: Supplier) => {
  if (!selectedRequirementForRFQ || !rfqDeadline) {
    toast.error('请填写完整的询价信息');
    return;
  }
  
  if (selectedProductIds.length === 0) {
    toast.error('请至少选择一个产品');
    return;
  }
  
  const rfqData = generateRFQDocumentData(
    supplier, 
    selectedRequirementForRFQ, 
    rfqDeadline, 
    rfqRemarks
  );
  
  setCurrentRFQData(rfqData);
  setShowRFQPreview(true);
};
```

### 第三步：提交询价单

**流程**:
1. 点击"发送询价单"按钮
2. 系统为每个供应商生成：
   - 唯一的询价单号（XJ-YYMMDD-XXXX）
   - 完整的询价单文档数据（SupplierRFQData）
   - RFQ记录（保存到RFQContext）

**关键逻辑**:
```typescript
const handleSubmitRFQ = () => {
  // 验证
  if (selectedSuppliers.length === 0) {
    toast.error('请至少选择一个供应商');
    return;
  }
  
  if (!rfqDeadline) {
    toast.error('请设置报价截止日期');
    return;
  }
  
  if (selectedProductIds.length === 0) {
    toast.error('请至少选择一个产品');
    return;
  }
  
  // 为每个供应商创建询价单
  selectedSuppliers.forEach((supplier) => {
    // 生成供应商专属询价单号（同一供应商的所有产品共享）
    const supplierRfqNo = `XJ-${dateStr}-${random}`;
    
    // 生成完整的询价单文档数据
    const rfqDocumentData = generateRFQDocumentData(
      supplier, 
      selectedRequirementForRFQ, 
      rfqDeadline, 
      rfqRemarks
    );
    
    // 为每个产品创建RFQ记录
    selectedProducts.forEach((item) => {
      const rfq: RFQ = {
        id: `rfq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rfqNumber: `RFQ-${dateStr}-${random}`, // 采购员内部编号
        supplierRfqNo,                          // 供应商询价单号（共享）
        
        // 产品信息
        productName: item.productName,
        modelNo: item.modelNo,
        quantity: item.quantity,
        // ... 其他字段
        
        // 🔥 保存完整的询价单文档数据
        documentData: rfqDocumentData
      };
      
      addRFQ(rfq);
    });
  });
  
  // 更新采购需求状态
  updateRequirement(selectedRequirementForRFQ.id, { 
    status: 'processing',
    items: updatedItems
  });
  
  toast.success(`询价单已发送给 ${selectedSuppliers.length} 个供应商`);
};
```

### 第四步：供应商查看询价单

**入口**: Supplier Portal → 询价管理 → 查看询价单

**显示内容**:
- 供应商只能看到发给自己的询价单
- 使用保存的 `documentData` 渲染完整的询价单文档
- 支持下载PDF和打印

**数据获取**:
```typescript
// 在Supplier Portal中
const { getRFQsBySupplier } = useRFQs();
const currentSupplier = JSON.parse(localStorage.getItem('cosun_current_user') || '{}');
const myRFQs = getRFQsBySupplier(currentSupplier.email);

// 显示询价单
myRFQs.forEach(rfq => {
  const documentData = rfq.documentData as SupplierRFQData;
  
  return (
    <SupplierRFQDocument 
      data={documentData}
    />
  );
});
```

## 📊 数据流转

```
1. 采购需求 (PurchaseRequirement)
   ↓
2. 选择产品 + 选择供应商
   ↓
3. 生成询价单文档数据 (SupplierRFQData)
   ↓
4. 创建RFQ记录 (包含documentData)
   ↓
5. 保存到RFQContext (localStorage)
   ↓
6. 供应商Portal读取RFQ记录
   ↓
7. 使用documentData渲染询价单
```

## 🎨 询价单包含的条款

### 基本商务条款
- 报价币种
- 付款方式：T/T 30% 预付，70% 发货前付清
- 交货条款：EXW 工厂交货
- 交货地址

### 质量要求
- 质量标准：国家GB/T标准、ISO、CE认证
- 验收标准：外观和功能检测，抽检率5%

### 交货与包装
- 交货时间要求
- 包装要求：标准出口包装，纸箱+托盘，防潮防震
- 唛头要求：中性唛头或定制唛头

### 验货与技术文件
- 验货要求：出货前提供产品照片
- 技术文件：产品说明书、检测报告、认证证书

### 法律保护
- 知识产权：供应商确认不侵犯第三方知识产权
- 保密条款：双方对价格、技术、客户信息保密

### 其他
- 样品要求：首次合作需提供样品
- MOQ要求：请在报价中注明最小起订量
- 备注：报价有效期不少于30天

## 🔍 测试方法

### 1. 在文档测试页面预览
- 进入 Admin Portal → 文档中心
- 点击"供应商询价单"标签
- 查看示例询价单
- 测试下载PDF和打印功能

### 2. 在采购需求池测试完整流程
1. 创建一个采购需求（或使用现有需求）
2. 点击"创建询价单"
3. 选择产品和供应商
4. 点击"预览"查看询价单效果
5. 提交询价单
6. 在浏览器控制台查看日志，确认documentData已保存

### 3. 在Supplier Portal测试
1. 使用供应商账号登录
2. 查看收到的询价单
3. 验证询价单显示是否正确
4. 测试下载和打印功能

## 📝 注意事项

1. **询价单号的唯一性**: 
   - 同一供应商的所有产品共享同一个询价单号（XJ-xxx）
   - 采购员内部编号（RFQ-xxx）对每个产品是唯一的

2. **文档数据的保存**:
   - documentData字段保存完整的SupplierRFQData
   - 供应商Portal可以直接渲染，无需重新生成

3. **权限隔离**:
   - 供应商只能看到发给自己的询价单
   - 不能看到目标价格之外的敏感信息
   - 不能看到其他供应商的报价

4. **数据持久化**:
   - RFQ数据保存在localStorage
   - 生产环境需要同步到后端数据库

## 🚀 后续优化建议

1. **邮件通知**: 发送询价单时自动发送邮件给供应商
2. **在线报价**: 供应商可以直接在Portal中提交报价
3. **报价对比**: 自动对比多个供应商的报价
4. **批量导出**: 支持批量导出多个询价单为ZIP文件
5. **历史记录**: 查看某个产品的历史询价记录
6. **模板管理**: 支持自定义询价单模板和条款

## 🔗 相关文件

- 询价单模板: `/components/documents/templates/SupplierRFQDocument.tsx`
- 采购需求管理: `/components/admin/PurchaseOrderManagementEnhanced.tsx`
- RFQ Context: `/contexts/RFQContext.tsx`
- PDF导出工具: `/utils/pdfExport.ts`
- 文档测试页面: `/components/documents/DocumentTestPage.tsx`
