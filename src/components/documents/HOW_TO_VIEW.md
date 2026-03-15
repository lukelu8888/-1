# 📄 如何查看文档模板

## 访问方法

### 方法1：通过Admin Dashboard（推荐）

1. 登录Admin账号
2. 在左侧边栏找到并点击 **"单证制作"** 或 **"Documents"** 菜单项
3. 点击任一文档类型卡片的 **"预览"** 按钮

### 方法2：直接访问测试页面

在浏览器地址栏输入：
```
#document-test
```
或者点击浏览器地址栏后面加上 `#document-test`

## 已完成的文档模板（7种）

### ✅ 1. 客户询价单 (Customer Inquiry)
- 文件：`/components/documents/templates/CustomerInquiryDocument.tsx`
- 用途：客户发送的产品询价请求
- 特点：标准化格式，包含客户信息、产品需求、交易要求

### ✅ 2. 销售报价单 (Sales Quotation)
- 文件：`/components/documents/templates/QuotationDocument.tsx`
- 用途：业务员基于供应链反馈给客户的正式报价
- 特点：专业排版，橙色主题，包含公司完整信息

### ✅ 3. 销售合同 (Sales Contract) 🆕
- 文件：`/components/documents/templates/SalesContractDocument.tsx`
- 用途：发给客户的正式销售合同
- 特点：法律文件，包含完整条款、违约责任、争议解决、签字区域

### ✅ 4. 采购合同 (Purchase Contract) 🆕
- 文件：`/components/documents/templates/PurchaseOrderDocument.tsx`
- 用途：发给供应商的采购合同
- 特点：物料编码、质量标准、验收方式、审批信息

### ✅ 5. 对账单 (Statement of Account) 🆕
- 文件：`/components/documents/templates/StatementOfAccountDocument.tsx`
- 用途：发给客户的月度/季度对账单
- 特点：期初期末余额、交易明细、账龄分析、银行信息

### ✅ 6. 商业发票 (Commercial Invoice)
- 文件：`/components/documents/templates/CommercialInvoiceDocument.tsx`
- 用途：海关报关必需单据
- 特点：HS编码、唛头、运输信息、严格符合报关要求

### ✅ 7. 包装清单 (Packing List)
- 文件：`/components/documents/templates/PackingListDocument.tsx`
- 用途：详细货物包装信息
- 特点：箱号、重量、体积详细信息

## 文档特点

所有文档模板都具备以下特点：

### 🎨 设计规范
- A4纸张标准（210mm × 297mm）
- 专业排版，符合国际商业标准
- 橙色#F96302主色调（公司品牌色）
- 可直接打印或导出PDF

### 📋 内容结构
- 公司完整信息（抬头）
- 清晰的编号系统
- 专业的表格布局
- 合规的条款说明
- 签字盖章区域（合同类文档）

### 💾 数据调用
- 从KV Store读取业务数据
- 智能数据继承机制
- 字段精准映射
- 后台字段不显示在对外文档

## 数据流转示例

```
客户询价单 (INQ-NA-20251210-001)
    ↓ 继承90%数据
销售报价单 (QT-NA-20251210-001)
    ↓ 继承95%数据
销售合同 (SC-NA-20251220-001)
    ↓ 继承数据 + 实际生产数据
出货通知 → 商业发票 (CI-20260215-001)
         → 包装清单 (PL-20260215-001)
```

## 与业务流程集成

### 在FullProcessDemoV5中调用

```typescript
import { CustomerInquiryDocument } from '../documents/templates/CustomerInquiryDocument';

// 从KV Store读取数据
const inquiryData = await kv.get(`inquiry_${inquiryNo}`);

// 生成文档
<CustomerInquiryDocument data={inquiryData} />
```

### 在订单管理中调用

```typescript
// 点击"生成销售合同"按钮
const contractData = await kv.get(`contract_${contractNo}`);
<SalesContractDocument data={contractData} />
```

### 在财务模块中调用

```typescript
// 生成月度对账单
const soaData = await kv.get(`soa_${soaNo}`);
<StatementOfAccountDocument data={soaData} />
```

## 下一步开发

### 即将完成
- 🔲 形式发票 (Proforma Invoice)
- 🔲 出货通知 (Shipping Notice)

### 技术增强
- 🔲 PDF生成功能（jsPDF）
- 🔲 邮件发送集成
- 🔲 批量生成
- 🔲 多语言切换（中英文）
- 🔲 水印功能（草稿/正式）

## 常见问题

### Q: 为什么看不到文档？
A: 确保已登录Admin账号，或直接访问 `#document-test` 路由

### Q: 如何打印文档？
A: 点击页面上的"打印"按钮，或使用浏览器快捷键 Ctrl+P / Cmd+P

### Q: 数据从哪里来？
A: 目前测试页面使用示例数据，实际使用时会从KV Store读取真实业务数据

### Q: 如何修改文档样式？
A: 编辑对应的模板文件，所有样式都使用Tailwind CSS和内联样式

## 技术支持

如有问题，请参考：
- `/components/documents/README.md` - 完整系统说明
- `/components/documents/templates/` - 各文档模板源码
- `/components/documents/DocumentTestPage.tsx` - 测试页面代码
