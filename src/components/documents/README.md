# 📄 专业文档生成系统

## 系统概述

这是一个**独立的、专业的国际贸易文档生成系统**，专门为B2B外贸业务设计。系统与业务流程解耦，专注于生成符合国际商业标准的正式文档。

## 核心理念

### 双层表单体系

系统严格区分两种不同性质的表单：

#### 1. **后台工作表单（Internal Workspace）**
- **位置**：业务员工作台、FullProcessDemoV5弹窗、各管理列表
- **特征**：包含流程状态、审批按钮、编辑功能、业务逻辑字段
- **用户**：内部团队（业务员、主管、财务、单证员）
- **目的**：流程管理、数据录入、团队协作

#### 2. **对外正式文档（External Business Documents）**
- **位置**：独立的文档生成器（本系统）
- **特征**：纯净的国际商业格式，无内部字段，可直接发送
- **用户**：客户、海关、货代、银行
- **目的**：法律效力、商业沟通、贸易执行

**关键原则**：后台工作表单的状态字段、审批信息、编辑按钮等**永远不会出现**在对外正式文档上。

## 文档类型

### 1. 客户询价单（Customer Inquiry）
```
文件：/templates/CustomerInquiryDocument.tsx
用途：客户发送的产品询价请求
数据源：KV Store - inquiry_{inquiryNo}
特点：标准化格式，便于内部分配和处理
```

**显示字段**：
- ✅ 询价编号、日期、区域
- ✅ 客户完整信息（公司、联系人、邮箱、地址）
- ✅ 产品需求列表（名称、规格、数量、目标价格）
- ✅ 交易要求（交期、港口、付款方式、认证）
- ✅ 备注

**不显示字段**（仅后台使用）：
- ❌ source（询价来源）
- ❌ assignedTo（分配的业务员）
- ❌ status（询价状态）
- ❌ 任何审批、流程相关字段

### 2. 销售报价单（Sales Quotation）
```
文件：/templates/QuotationDocument.tsx
用途：业务员基于供应链反馈给客户的正式报价
数据源：KV Store - quotation_{quotationNo}
数据继承：从客户询价单继承90%数据
特点：专业排版，包含公司完整信息和Logo
```

**核心内容**：
- 公司完整信息和Logo
- 报价有效期
- 产品清单（单价、金额）
- 贸易条款（FOB/CIF、付款方式、交期、包装）
- 业务员签名和联系方式

### 3. 形式发票（Proforma Invoice）
```
文件：/templates/ProformaInvoiceDocument.tsx
用途：客户付款前的预付发票
数据继承：从报价单或销售合同
```

### 4. 销售合同（Sales Contract）
```
文件：/templates/SalesContractDocument.tsx
用途：正式销售合同文档
数据继承：从形式发票或报价单
```

### 5. 出货通知（Shipping Notice）
```
文件：/templates/ShippingNoticeDocument.tsx
用途：通知客户货物即将出运
数据继承：从销售合同 + 实际装箱数据
```

### 6. 商业发票（Commercial Invoice）⭐️
```
文件：/templates/CommercialInvoiceDocument.tsx
用途：海关报关必需单据
数据继承：从销售合同 + 出货通知
重要性：最高 - 必须精确无误
```

**关键字段**：
- 发票编号、合同编号
- 出口方和进口方完整信息
- 唛头（Shipping Marks）
- HS编码（每个产品）
- 运输信息（船名、航次、提单号）
- 包装信息（箱数、毛重、净重、体积）

### 7. 包装清单（Packing List）⭐️
```
文件：/templates/PackingListDocument.tsx
用途：详细列出货物包装信息
配套文档：必须与商业发票配套使用
```

**详细内容**：
- 箱号范围（1-25, 26-50）
- 每箱数量、重量、体积
- 总箱数、总重量、总体积

## 数据流转机制

### 核心原则：一次录入，智能继承，按需转换

```
客户询价 (INQ)
    ↓ [继承90%数据]
业务员报价 (QT)
    ↓ [继承95%数据 + 客户确认]
形式发票 (PI) / 销售合同 (SC)
    ↓ [继承80%数据 + 实际生产/采购数据]
出货通知 (SN)
    ↓ [继承数据 + 实际装箱数据]
商业发票 (CI) + 包装清单 (PL)
```

### 数据调用示例

**从销售合同生成商业发票**：
```typescript
// 1. 从KV Store读取销售合同数据
const contract = await kv.get(`contract_${contractNo}`);

// 2. 从出货通知获取实际装箱数据
const shipping = await kv.get(`shipping_${shippingNo}`);

// 3. 组装商业发票数据
const invoiceData: CommercialInvoiceData = {
  invoiceNo: generateInvoiceNo(),      // 新编号
  contractNo: contract.contractNo,     // 调用
  invoiceDate: new Date().toISOString(),
  
  // 公司和客户信息 - 直接调用
  exporter: companyMasterData,
  importer: contract.customerInfo,
  
  // 产品清单 - 使用实际出货数量
  goods: contract.products.map(p => ({
    description: p.description,
    hsCode: p.hsCode,                  // 必需！
    quantity: p.actualShipQty,         // ⚠️ 实际数量，非合同数量
    unitPrice: p.contractPrice,
    currency: p.currency,
    amount: p.actualShipQty * p.contractPrice
  })),
  
  // 运输信息 - 从出货通知调用
  shipping: {
    vesselName: shipping.vesselName,
    blNo: shipping.blNo,
    portOfLoading: 'Xiamen, China',
    portOfDischarge: contract.portOfDestination
  },
  
  // ❌ 不调用后台字段
  // status, approvalHistory, internalNotes 等
};

// 4. 生成文档
<CommercialInvoiceDocument data={invoiceData} />
```

## 目录结构

```
/components/documents/
├── DocumentCenter.tsx              # 文档中心入口（暗黑主题）
├── DocumentPreview.tsx             # 文档预览组件
├── DocumentTestPage.tsx            # 测试页面（查看所有文档效果）
├── templates/
│   ├── CustomerInquiryDocument.tsx      # ✅ 完成
│   ├── QuotationDocument.tsx            # ✅ 完成
│   ├── ProformaInvoiceDocument.tsx      # 🚧 待开发
│   ├── SalesContractDocument.tsx        # 🚧 待开发
│   ├── ShippingNoticeDocument.tsx       # 🚧 待开发
│   ├── CommercialInvoiceDocument.tsx    # ✅ 完成
│   └── PackingListDocument.tsx          # ✅ 完成
└── README.md                       # 本文档
```

## 使用方法

### 方式一：测试页面（开发调试）

访问测试页面查看所有文档模板的效果：

```typescript
// 在浏览器中访问
window.location.href = '#document-test'
```

或在App.tsx中添加路由后访问 `/document-test`

### 方式二：在业务流程中集成

```typescript
import { CustomerInquiryDocument } from './components/documents/templates/CustomerInquiryDocument';

// 1. 从KV Store加载数据
const inquiryData = await kv.get(`inquiry_${inquiryNo}`);

// 2. 渲染文档
<CustomerInquiryDocument data={inquiryData} />

// 3. 生成PDF（TODO：待实现）
const pdfBlob = await generatePDF(<CustomerInquiryDocument data={inquiryData} />);
```

### 方式三：文档中心（推荐）

```typescript
import { DocumentCenter } from './components/documents/DocumentCenter';

// 在Admin Dashboard中添加入口
<DocumentCenter />
```

## 设计规范

### A4纸张标准
- 尺寸：210mm × 297mm
- 内边距：15-20mm
- 字体：Arial, Helvetica Neue
- 字号：9-10pt（正文）

### 颜色系统
- 主色调：#F96302（橙色 - 高盛达富品牌色）
- 文本：黑色 #000000
- 次要文本：灰色 #666666
- 边框：灰色 #CCCCCC

### 表格规范
- 外边框：2px solid black（重要文档如CI）
- 内边框：1px solid #CCCCCC
- 表头：灰色背景 #F5F5F5
- 数字：右对齐
- 文本：左对齐

## 与FullProcessDemoV5的关系

**FullProcessDemoV5** 是一个临时性的流程测试模块，用于：
- ✅ 测试12种核心业务表单的数据流转
- ✅ 验证状态变化逻辑
- ✅ 确保编号规则正确

**DocumentCenter（本系统）** 是一个正式的、独立的文档生成系统，用于：
- ✅ 生成符合国际标准的正式文档
- ✅ 直接发送给客户、海关、银行
- ✅ 存档、打印、导出PDF

**两者关系**：
- FullProcessDemoV5：内部工作流程（有状态、有按钮、有审批）
- DocumentCenter：对外正式文档（纯净、专业、可发送）
- 数据来源：都从KV Store读取，但DocumentCenter只显示对外字段

## 下一步开发

### 高优先级
1. ✅ 完成客户询价单（CustomerInquiryDocument）
2. ✅ 完成销售报价单（QuotationDocument）
3. ✅ 完成商业发票（CommercialInvoiceDocument）
4. ✅ 完成包装清单（PackingListDocument）

### 中优先级
5. 🚧 完成形式发票（ProformaInvoiceDocument）
6. 🚧 完成销售合同（SalesContractDocument）
7. 🚧 完成出货通知（ShippingNoticeDocument）

### 技术增强
8. 🔲 PDF生成功能（使用jsPDF或react-pdf）
9. 🔲 邮件发送集成
10. 🔲 批量生成功能
11. 🔲 多语言版本（中英文切换）
12. 🔲 水印功能（草稿/正式）

## 技术栈

- React + TypeScript
- Tailwind CSS（样式）
- forwardRef（支持打印）
- KV Store（数据持久化）
- 未来：jsPDF / react-pdf（PDF导出）

## 联系方式

如需了解更多关于文档系统的设计理念和使用方法，请参考：
- FullProcessDemoV5.tsx（业务流程测试）
- 本目录下的各个模板文件
- DocumentTestPage.tsx（查看实际效果）
