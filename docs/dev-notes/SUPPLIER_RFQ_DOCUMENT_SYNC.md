# 📄 采购询价单文档同步功能

## 功能概述

现已成功将采购员端的采购询价单模版（A4专业格式）同步到供应商Portal的询价报价管理模块中。供应商可以查看、打印和导出PDF格式的完整询价单文档。

## 核心功能

### 1. 文档查看器组件

**组件路径**: `/components/supplier/SupplierRFQDocumentViewer.tsx`

**功能特性**:
- ✅ 在线预览完整的A4格式询价单文档
- ✅ 打印功能（支持直接打印或保存为PDF）
- ✅ 导出PDF功能
- ✅ 文档信息摘要展示
- ✅ 使用提示和说明

**组件结构**:
```typescript
<SupplierRFQDocumentViewer rfq={rfq}>
  ├─ 操作按钮栏
  │  ├─ 打印按钮
  │  └─ 导出PDF按钮
  ├─ 文档预览区域（最大高度600px，可滚动）
  │  └─ SupplierRFQDocument（A4格式）
  ├─ 文档信息摘要
  │  ├─ 采购方信息
  │  ├─ 采购员信息
  │  ├─ 报价截止日期
  │  ├─ 要求交货日期
  │  └─ 产品数量
  └─ 使用提示
</SupplierRFQDocumentViewer>
```

### 2. 表格集成

**组件路径**: `/components/supplier/SupplierQuotationsSimple.tsx`

**新增功能**:
- ✅ 在每条询价单记录的操作列中添加"询价单"按钮
- ✅ 按钮显示条件：仅当RFQ有documentData时显示
- ✅ 点击按钮打开文档查看器对话框
- ✅ 按钮样式：橙色边框，突出显示

**按钮位置**:
```
操作列 = [询价单按钮] + [详情按钮] + [报价按钮/查看报价] + [删除按钮]
```

### 3. 数据流程

```
📊 数据流程图

1. 采购员创建询价单
   ↓
2. handleSubmitRFQ() 生成documentData
   ├─ 基本信息：rfqNo, rfqDate, 截止日期等
   ├─ 采购方信息：COSUN公司信息
   ├─ 供应商信息：从suppliersDatabase读取
   ├─ 产品清单：从选中的产品生成
   └─ 商务条款：付款方式、质量标准等
   ↓
3. 保存到RFQ对象的documentData字段
   ↓
4. 同步到RFQContext (localStorage持久化)
   ↓
5. 供应商Portal读取
   ├─ getRFQsBySupplier(user.email)
   └─ 返回包含documentData的RFQ列表
   ↓
6. 显示"询价单"按钮（仅当documentData存在）
   ↓
7. 点击按钮打开SupplierRFQDocumentViewer
   ↓
8. 显示完整的A4格式询价单
   ├─ 在线预览
   ├─ 打印
   └─ 导出PDF
```

## 询价单文档内容

### A4格式询价单包含以下内容：

#### 1. 头部信息
- COSUN公司Logo
- 公司名称：福建高盛达富建材有限公司
- 文档标题：REQUEST FOR QUOTATION (RFQ)
- 询价单编号：RFQ-20251218-001
- 询价日期

#### 2. 采购方信息
- 公司名称（中英文）
- 地址（中英文）
- 联系电话
- 电子邮件
- 采购员姓名

#### 3. 供应商信息
- 供应商公司名称
- 供应商地址
- 联系人
- 联系电话
- 电子邮件
- 供应商专属编号

#### 4. 产品清单
- 序号
- 型号/物料编码
- 产品图片（如有）
- 产品名称
- 规格说明
- 询价数量
- 单位
- 目标价格（可选）
- 备注

#### 5. 商务条款
- **付款方式**: T/T 30% deposit, 70% before shipment
- **交货条款**: FOB / CIF / DDP等
- **交货地址**: 指定交货地点
- **报价币种**: USD / CNY

#### 6. 质量要求
- **质量标准**: GB/T、ISO、CE等标准
- **验收标准**: 第三方检测、工厂验货、到货抽检
- **检验方式**: 出货前验货要求

#### 7. 交货和包装
- **交货时间要求**: 具体交货期限
- **包装要求**: 标准出口包装、纸箱+托盘等
- **唛头要求**: 中性唛头、客户指定唛头

#### 8. 技术文件
- **验货要求**: 第三方检验报告
- **技术文件**: 产品说明书、检测报告、认证证书

#### 9. 知识产权和保密
- **知识产权**: 产品设计、商标、专利归属
- **保密条款**: 客户信息、价格信息保密要求

#### 10. 其他要求
- 样品要求（可选）
- 最小起订量要求（可选）
- 其他特殊说明（可选）

## 使用方法

### 🎯 供应商端操作流程

#### Step 1: 登录供应商账号
```
用户名: zhang
密码: supplier123
公司: 东莞市华盛电器有限公司
```

#### Step 2: 进入询价报价管理
```
左侧菜单 → 询价报价 → 待报价/已报价/已接受/全部
```

#### Step 3: 查看询价单文档
```
1. 在询价单列表中找到目标询价单
2. 点击"询价单"按钮（橙色边框）
3. 文档查看器对话框打开
4. 在线预览完整的A4格式询价单
```

#### Step 4: 导出PDF
```
1. 在文档查看器中，点击"导出PDF"按钮
2. 浏览器打开打印对话框
3. 在"目标打印机"中选择"另存为PDF"
4. 选择保存位置
5. 点击"保存"
```

#### Step 5: 打印
```
1. 在文档查看器中，点击"打印"按钮
2. 浏览器打开打印对话框
3. 选择打印机
4. 设置打印选项
5. 点击"打印"
```

### 🔥 采购员端操作流程

#### Step 1: 创建询价单
```
1. 进入"采购订单管理" → "采购需求池"
2. 选择需求记录，点击"创建询价单"
3. 选择产品和供应商
4. 填写报价截止日期和期望交期
5. 点击"发送询价单"
```

#### Step 2: 系统自动生成documentData
```
✅ handleSubmitRFQ() 自动执行：
   ├─ 生成询价单编号（RFQ-YYYYMMDD-XXX）
   ├─ 填充COSUN公司信息
   ├─ 填充供应商信息（从suppliersDatabase）
   ├─ 构建产品清单
   ├─ 设置商务条款和质量要求
   └─ 保存到RFQ.documentData字段
```

#### Step 3: 预览和导出
```
1. 点击"预览询价单"按钮
2. 查看生成的询价单文档
3. 点击"导出询价单"下载PDF
```

## 数据结构

### RFQ对象结构（包含documentData）

```typescript
interface RFQ {
  id: string;
  rfqNumber: string;
  
  // 基本产品信息
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
  
  // 时间信息
  createdDate: string;
  quotationDeadline: string;
  expectedDate: string;
  
  // 报价信息
  quotes: Array<{
    supplierCode: string;
    supplierName: string;
    quotedDate: string;
    quotedPrice: number;
    leadTime: number;
    moq: number;
    validityDays: number;
    paymentTerms: string;
    remarks?: string;
  }>;
  
  // 🔥 完整的询价单文档数据
  documentData?: SupplierRFQData;
  
  // 其他字段...
}
```

### SupplierRFQData结构

```typescript
interface SupplierRFQData {
  // 询价单基本信息
  rfqNo: string;
  rfqDate: string;
  requiredResponseDate: string;
  requiredDeliveryDate: string;
  
  // 采购方信息
  buyer: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;
  };
  
  // 供应商信息
  supplier: {
    companyName: string;
    address: string;
    contactPerson: string;
    tel: string;
    email: string;
    supplierCode?: string;
  };
  
  // 询价产品清单
  products: Array<{
    no: number;
    modelNo?: string;
    imageUrl?: string;
    itemCode?: string;
    description: string;
    specification: string;
    quantity: number;
    unit: string;
    targetPrice?: string;
    remarks?: string;
  }>;
  
  // 询价要求和条款
  terms: {
    // 基本商务条款
    paymentTerms: string;
    deliveryTerms: string;
    deliveryAddress: string;
    currency: string;
    
    // 产品质量要求
    qualityStandard: string;
    inspectionMethod: string;
    
    // 交货和包装要求
    deliveryRequirement: string;
    packaging: string;
    shippingMarks: string;
    
    // 验货和技术文件
    inspectionRequirement: string;
    technicalDocuments: string;
    
    // 知识产权和保密
    ipRights: string;
    confidentiality: string;
    
    // 其他要求
    sampleRequirement?: string;
    moq?: string;
    remarks?: string;
  };
}
```

## UI效果

### 1. 询价单列表按钮

```
┌────────────────────────────────────────────────────────────┐
│ 操作                                                        │
├────────────────────────────────────────────────────────────┤
│ [📄询价单] [👁详情] [💰报价] [🗑删除]                       │
│   橙色边框   普通     橙色背景  红色                        │
└────────────────────────────────────────────────────────────┘
```

### 2. 文档查看器对话框

```
┌─────────────────────────────────────────────────────────────┐
│ 询价单文档 - RFQ-20251218-001                         [X]   │
├─────────────────────────────────────────────────────────────┤
│ 📄 询价单文档                                               │
│ 编号: RFQ-20251218-001 | 日期: 2025-12-18                  │
│                                 [🖨打印] [⬇导出PDF]         │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐ │
│ │ [A4格式文档预览区域 - 可滚动，最大高度600px]          │ │
│ │                                                       │ │
│ │ COSUN LOGO                                            │ │
│ │ 福建高盛达富建材有限公司                              │ │
│ │ REQUEST FOR QUOTATION                                 │ │
│ │                                                       │ │
│ │ RFQ Number: RFQ-20251218-001                          │ │
│ │ Date: 2025-12-18                                      │ │
│ │ ...                                                   │ │
│ └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📋 文档说明                                                 │
│ 采购方: 福建高盛达富建材有限公司                            │
│ 采购员: 李采购                                              │
│ 报价截止日期: 2025-12-25                                    │
│ 要求交货日期: 2026-01-15                                    │
│ 产品数量: 1 个产品                                          │
├─────────────────────────────────────────────────────────────┤
│ 💡 使用提示                                                 │
│ • 点击"导出PDF"按钮，在打印对话框中选择"另存为PDF"         │
│ • 文档包含完整的产品信息、商务条款和技术要求                │
│ • 请在报价截止日期前提交报价                                │
├─────────────────────────────────────────────────────────────┤
│                                            [关闭]           │
└─────────────────────────────────────────────────────────────┘
```

## 技术实现

### 1. 打印/导出PDF功能

**使用库**: `react-to-print`

**实现代码**:
```typescript
const handlePrint = useReactToPrint({
  contentRef: documentRef,
  documentTitle: `询价单_${rfq.documentData?.rfqNo}_${date}.pdf`,
  onAfterPrint: () => {
    toast.success('文档已准备就绪', {
      description: '请在打印对话框中选择"另存为PDF"进行保存'
    });
  }
});
```

### 2. 文档预览

**特性**:
- 使用 `<div ref={documentRef}>` 包裹 SupplierRFQDocument 组件
- 设置最大高度600px，超出部分可滚动
- 保持A4格式（210mm x 297mm）的比例
- 支持打印时自动分页

### 3. 条件渲染

**按钮显示条件**:
```typescript
{rfq.documentData && (
  <Button onClick={() => openDocumentViewer()}>
    <FileText /> 询价单
  </Button>
)}
```

**降级处理**:
```typescript
if (!rfq.documentData) {
  return (
    <div className="bg-yellow-50">
      <FileText />
      <h3>暂无询价单文档</h3>
      <p>请联系COSUN采购员重新发送询价单。</p>
    </div>
  );
}
```

## 优势特性

### 1. 数据一致性
✅ 供应商看到的询价单与采购员发送的完全一致
✅ documentData在创建时生成并保存，不会被修改
✅ 确保询价信息的准确性和可追溯性

### 2. 专业性
✅ A4国际标准格式
✅ 完整的商务条款和技术要求
✅ 专业的文档结构和排版
✅ 包含COSUN公司Logo和品牌标识

### 3. 易用性
✅ 一键查看完整询价单
✅ 在线预览，无需下载
✅ 导出PDF方便存档
✅ 打印功能支持纸质文档

### 4. 权限安全
✅ 供应商只能看到自己的询价单
✅ 通过supplierEmail精确匹配
✅ 不泄露其他供应商信息
✅ 符合权限隔离原则

## 测试场景

### 场景1: 完整流程测试

1. **采购员创建询价单**
   - 登录Admin账号
   - 进入采购需求池
   - 创建询价单并选择"东莞市华盛电器有限公司"
   - 提交询价单

2. **系统生成documentData**
   - 检查RFQ对象的documentData字段
   - 验证数据完整性
   - 确认保存到localStorage

3. **供应商查看询价单**
   - 登录供应商账号（zhang / supplier123）
   - 进入询价报价管理
   - 点击"询价单"按钮
   - 验证文档显示正确

4. **供应商导出PDF**
   - 点击"导出PDF"按钮
   - 检查打印对话框
   - 另存为PDF
   - 验证PDF内容完整

### 场景2: 无文档数据处理

1. **测试旧询价单**
   - 创建不包含documentData的RFQ
   - 供应商端不显示"询价单"按钮
   - 正确降级处理

### 场景3: 多产品询价单

1. **创建多产品询价单**
   - 在采购员端选择多个产品
   - 生成包含多个产品的documentData
   - 供应商端查看产品清单
   - 验证所有产品信息正确显示

## 注意事项

### 1. 数据持久化
- documentData保存在RFQ对象中
- 通过RFQContext管理
- 使用localStorage持久化
- 页面刷新后数据不丢失

### 2. 浏览器兼容性
- 打印功能依赖浏览器的打印API
- 建议使用Chrome、Edge等现代浏览器
- PDF导出实际是通过打印对话框的"另存为PDF"功能

### 3. 文档大小
- 包含多个产品时文档可能较长
- 打印时自动分页
- 保持A4格式不变形

### 4. 权限控制
- 供应商只能查看自己的询价单
- 通过supplierEmail进行匹配
- 不会看到其他供应商的询价单

## 后续优化建议

1. **邮件发送**: 创建询价单时自动发送邮件给供应商，附带PDF文档
2. **在线协商**: 支持供应商对条款提出异议或疑问
3. **历史版本**: 记录询价单的修改历史
4. **批量导出**: 支持批量导出多个询价单PDF
5. **电子签名**: 添加供应商确认收到询价单的电子签名功能
6. **移动端优化**: 优化移动设备上的文档显示效果
