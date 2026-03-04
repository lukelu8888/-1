# ✅ 供应商报价单模版功能完成

## 功能概述

已成功创建供应商报价单模版（Quotation Template），格式与采购询价单保持一致，采用A4标准格式和台湾大厂专业风格设计。

## 核心特性

### 1. ✅ 文档标识差异化
- **报价编号前缀**：BJ-YYYYMMDD-XXX（"报价"的拼音首字母）
- **LOGO切换**：使用供应商自己的LOGO（支持上传或占位符）
- **标题**：报价单 / Quotation
- **角色互换**：
  - 左侧 = 报价方（供应商）
  - 右侧 = 询价方（COSUN）

### 2. ✅ 多货币支持
- 每个产品可独立设置货币单位（USD、CNY、EUR、JPY等）
- 自动按货币分组计算总价
- 支持混合货币报价
- 专业的数字格式化（千分位、两位小数）

### 3. ✅ 价格计算系统
```typescript
产品清单表格：
┌────┬────┬────┬──────┬────┬────┬────────┬────────┬────┐
│序号│型号│图片│产品  │数量│单位│报价单价│报价金额│备注│
├────┼────┼────┼──────┼────┼────┼────────┼────────┼────┤
│ 1  │ABC │[图]│LED灯 │1000│ 个 │USD 1.50│USD     │    │
│    │    │    │      │    │    │        │1,500.00│    │
├────┼────┼────┼──────┼────┼────┼────────┼────────┼────┤
│ 2  │XYZ │[图]│开关  │500 │ 个 │CNY 5.00│CNY     │    │
│    │    │    │      │    │    │        │2,500.00│    │
├────┴────┴────┴──────┴────┴────┴────────┼────────┼────┤
│                  报价总额 (Total Amount):│USD     │    │
│                                          │1,500.00│    │
├──────────────────────────────────────────┼────────┼────┤
│                            CNY 小计:      │CNY     │    │
│                                          │2,500.00│    │
└──────────────────────────────────────────┴────────┴────┘
```

### 4. ✅ 灵活的报价条款
所有条款字段均为可选，供应商可根据实际情况填写：
- 付款方式（paymentTerms）
- 交货条款（deliveryTerms）
- 交货时间（deliveryTime）
- 交货地址（deliveryAddress）
- 最小起订量（moq）
- 质量标准（qualityStandard）
- 质保期（warranty）
- 包装方式（packaging）
- 唛头（shippingMarks）
- 其他说明（remarks）

### 5. ✅ 专业签名区域
```
┌──────────────────────┬──────────────────────┐
│ 报价方（供应商）     │ 询价方确认（客户）   │
│ ──────────────────── │ ──────────────────── │
│ 签字盖章：__________ │ 签字盖章：__________ │
│ 日期：____年____月__ │ 日期：____年____月__ │
└──────────────────────┴──────────────────────┘

底部说明：
本报价单一式两份，报价方和询价方各执一份。
报价单经双方签字盖章后生效。
```

## 文件结构

### 创建的文件

1. **SupplierQuotationDocument.tsx**
   - 路径：`/components/documents/templates/SupplierQuotationDocument.tsx`
   - 功能：报价单文档核心组件
   - 导出：`SupplierQuotationDocument`、`SupplierQuotationData`

2. **SupplierQuotationPreview.tsx**
   - 路径：`/components/supplier/SupplierQuotationPreview.tsx`
   - 功能：报价单预览和导出组件
   - 包含：打印按钮、导出PDF按钮、文档摘要

3. **SUPPLIER_QUOTATION_TEMPLATE.md**
   - 路径：`/SUPPLIER_QUOTATION_TEMPLATE.md`
   - 功能：完整的使用说明文档
   - 包含：数据结构、使用示例、业务流程、技术细节

## 数据接口

### SupplierQuotationData 接口

```typescript
export interface SupplierQuotationData {
  // 报价单基本信息
  quotationNo: string;              // BJ-20251218-001
  quotationDate: string;            // 2025-12-18
  validUntil: string;               // 报价有效期至
  rfqReference?: string;            // 关联的询价单号（可选）
  
  // 报价方（供应商）信息
  supplier: {
    companyName: string;
    companyNameEn?: string;
    address: string;
    addressEn?: string;
    tel: string;
    email: string;
    contactPerson: string;
    supplierCode?: string;
    logo?: string;                  // 🔥 供应商LOGO
  };
  
  // 询价方（COSUN）信息
  buyer: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;
  };
  
  // 报价产品清单
  products: Array<{
    no: number;
    modelNo?: string;
    imageUrl?: string;
    itemCode?: string;
    description: string;
    specification: string;
    quantity: number;
    unit: string;
    unitPrice: number;              // 🔥 报价单价（数字）
    currency: string;               // 🔥 货币单位（可选）
    remarks?: string;
  }>;
  
  // 报价条款（所有字段可选）
  terms: {
    paymentTerms?: string;
    deliveryTerms?: string;
    deliveryTime?: string;
    deliveryAddress?: string;
    moq?: string;
    qualityStandard?: string;
    warranty?: string;
    packaging?: string;
    shippingMarks?: string;
    remarks?: string;
  };
}
```

## 使用示例

### 完整示例代码

```typescript
import React from 'react';
import SupplierQuotationPreview from './components/supplier/SupplierQuotationPreview';
import { SupplierQuotationData } from './components/documents/templates/SupplierQuotationDocument';

function QuotationDemo() {
  const quotationData: SupplierQuotationData = {
    // 基本信息
    quotationNo: 'BJ-20251218-001',
    quotationDate: '2025-12-18',
    validUntil: '2026-01-18',
    rfqReference: 'RFQ-20251215-001',
    
    // 供应商信息
    supplier: {
      companyName: '东莞市华盛电器有限公司',
      companyNameEn: 'Dongguan Huasheng Electronics Co., Ltd.',
      address: '广东省东莞市长安镇新安社区横中路1号',
      addressEn: 'No.1 Hengzhong Road, Chang\'an Town, Dongguan',
      tel: '+86-769-8888-8888',
      email: 'sales@huasheng.com',
      contactPerson: '张经理',
      supplierCode: 'SUP-001',
      logo: 'https://example.com/supplier-logo.png'
    },
    
    // COSUN信息
    buyer: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian COSUN Building Materials Co., Ltd.',
      address: '福建省福州市仓山区金山大道618号',
      addressEn: 'No.618 Jinshan Avenue, Fuzhou, Fujian',
      tel: '+86-591-8888-8888',
      email: 'purchase@cosun.com',
      contactPerson: '李采购'
    },
    
    // 产品清单（多货币示例）
    products: [
      {
        no: 1,
        modelNo: 'LED-100W',
        description: 'LED工矿灯',
        specification: '100W 6000K IP65防水',
        quantity: 1000,
        unit: '个',
        unitPrice: 15.50,
        currency: 'USD',
        remarks: '含安装配件'
      },
      {
        no: 2,
        modelNo: 'SW-220V',
        description: '工业开关',
        specification: '220V 16A 防水型',
        quantity: 500,
        unit: '个',
        unitPrice: 35.00,
        currency: 'CNY'
      }
    ],
    
    // 报价条款
    terms: {
      paymentTerms: 'T/T 30% deposit, 70% before shipment',
      deliveryTerms: 'FOB Shenzhen',
      deliveryTime: '收到订单后30天',
      moq: '500个/款',
      qualityStandard: '符合GB/T标准，提供CE认证',
      warranty: '12个月质保',
      packaging: '标准出口纸箱包装'
    }
  };
  
  return <SupplierQuotationPreview quotationData={quotationData} />;
}
```

### 仅使用文档组件

```typescript
import { SupplierQuotationDocument } from './components/documents/templates/SupplierQuotationDocument';

function SimpleUsage() {
  const documentRef = useRef<HTMLDivElement>(null);
  
  return (
    <div>
      <SupplierQuotationDocument 
        ref={documentRef} 
        data={quotationData} 
      />
      
      <button onClick={() => window.print()}>
        打印
      </button>
    </div>
  );
}
```

## 与询价单的对比

| 项目 | 询价单（RFQ） | 报价单（Quotation） |
|------|---------------|---------------------|
| **文档编号** | RFQ-YYYYMMDD-XXX | **BJ-YYYYMMDD-XXX** |
| **LOGO** | COSUN Logo | **供应商 Logo** |
| **左侧主体** | 询价方（COSUN） | **报价方（供应商）** |
| **右侧主体** | 供应商 | **询价方（COSUN）** |
| **价格列名** | 目标价格（参考） | **报价单价（正式）** |
| **金额列名** | 合计价格 | **报价金额** |
| **总价标题** | 总价 (Total) | **报价总额 (Total Amount)** |
| **条款标题** | 询价要求和条款 | **报价条款** |
| **签名区** | ❌ 无 | **✅ 双方签字盖章区** |
| **有效期字段** | 回复截止日期 | **报价有效期至** |
| **货币处理** | 单一货币 | **✅ 多货币支持** |

## 多货币功能详解

### 场景1：单一货币
所有产品使用USD：
```
报价总额 (Total Amount): USD 25,350.00
```

### 场景2：多货币混合
产品使用USD、CNY、EUR：
```
报价总额 (Total Amount): USD 16,350.00
CNY 小计: CNY 17,500.00
EUR 小计: EUR 2,000.00
```

### 实现逻辑
```typescript
// 按货币分组计算
const totals: { [currency: string]: number } = {};
data.products.forEach(product => {
  if (!totals[product.currency]) {
    totals[product.currency] = 0;
  }
  totals[product.currency] += product.unitPrice * product.quantity;
});

// 第一个货币显示"报价总额"，其他显示"小计"
Object.entries(totals).map(([currency, total], index) => {
  const label = index === 0 
    ? '报价总额 (Total Amount):' 
    : `${currency} 小计:`;
  
  return `${label} ${currency} ${total.toFixed(2)}`;
});
```

## 业务流程集成

### 完整的询价到报价流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. COSUN发送询价单（RFQ-20251215-001）                 │
│    ↓                                                     │
│ 2. 供应商收到询价单                                     │
│    - 登录供应商Portal                                   │
│    - 查看询价单详情                                     │
│    - 点击"查看询价单"查看完整文档                       │
│    ↓                                                     │
│ 3. 供应商填写报价                                       │
│    - 点击"报价"按钮                                     │
│    - 填写单价、交货期、MOQ等信息                        │
│    - 选择货币单位（USD/CNY/EUR等）                      │
│    ↓                                                     │
│ 4. 系统生成报价单（BJ-20251218-001）                   │
│    ✅ 自动关联询价单号（rfqReference）                  │
│    ✅ 使用供应商Logo                                    │
│    ✅ 填充供应商信息                                    │
│    ✅ 自动计算报价金额（单价 × 数量）                   │
│    ✅ 按货币分组汇总总价                                │
│    ✅ 生成BJ编号                                        │
│    ↓                                                     │
│ 5. 供应商预览和导出报价单                               │
│    - 在线预览A4格式文档                                 │
│    - 点击"导出PDF"下载                                  │
│    - 确认信息无误                                       │
│    ↓                                                     │
│ 6. 供应商提交报价给COSUN                                │
│    - 系统记录报价信息                                   │
│    - 发送通知给采购员                                   │
│    - 报价单状态更新                                     │
│    ↓                                                     │
│ 7. COSUN采购员评估报价                                  │
│    - 查看报价单文档                                     │
│    - 比较多家供应商报价                                 │
│    - 评估性价比                                         │
│    ↓                                                     │
│ 8. 接受报价                                             │
│    - 采购员确认接受报价                                 │
│    - 双方打印报价单                                     │
│    - 签字盖章                                           │
│    ↓                                                     │
│ 9. 报价单转化为采购订单（PO）                           │
│    - 根据报价单生成PO                                   │
│    - 进入采购执行阶段                                   │
└─────────────────────────────────────────────────────────┘
```

## 打印和导出功能

### 打印配置
- ✅ 使用浏览器原生 `window.print()` API
- ✅ A4纸张：210mm × 297mm
- ✅ 纵向（Portrait）
- ✅ 边距：15mm
- ✅ 自动分页，表格不断裂
- ✅ 隐藏按钮等UI元素

### 导出PDF步骤
1. 点击"导出PDF"或"打印"按钮
2. 浏览器打开打印对话框
3. 目标打印机选择 **"另存为PDF"**
4. 文件名示例：`报价单_BJ-20251218-001_20251218.pdf`
5. 选择保存位置
6. 点击"保存"

### 打印样式
```css
@media print {
  /* A4页面设置 */
  @page {
    size: A4 portrait;
    margin: 0;
  }
  
  /* 文档容器 */
  .print-document {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    background: white;
  }
  
  /* 避免表格分页 */
  .products-section table,
  .terms-section table {
    page-break-inside: avoid;
  }
  
  /* 隐藏按钮 */
  button, .no-print {
    display: none !important;
  }
}
```

## 供应商Logo处理

### Logo显示逻辑
```typescript
{data.supplier.logo ? (
  <img
    src={data.supplier.logo}
    alt={`${data.supplier.companyName} Logo`}
    className="w-full h-auto max-h-full"
    style={{ objectFit: 'contain' }}
  />
) : (
  <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
    <span className="text-xs text-gray-400">供应商LOGO</span>
  </div>
)}
```

### Logo规格建议
- **推荐尺寸**：150px × 60px
- **支持格式**：PNG（透明背景）、JPG、SVG
- **文件大小**：< 500KB
- **显示方式**：contain（保持比例）

### Logo来源
1. **方案1**：供应商上传
   - 在供应商Profile中上传Logo
   - 系统自动引用

2. **方案2**：从数据库读取
   - suppliersDatabase中存储logo字段
   - 创建报价单时自动填充

3. **方案3**：使用占位符
   - 如果没有Logo，显示虚线边框占位
   - 不影响文档整体美观

## 自动编号生成

### BJ编号规则
```typescript
const generateQuotationNo = (date: Date = new Date()) => {
  // 格式：BJ-YYYYMMDD-序号
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  
  // 获取当天已有的报价单数量
  const todayQuotations = quotations.filter(q => 
    q.quotationDate === date.toISOString().split('T')[0]
  );
  
  const sequence = String(todayQuotations.length + 1).padStart(3, '0');
  
  return `BJ-${dateStr}-${sequence}`;
};

// 示例输出：BJ-20251218-001
```

### 有效期自动计算
```typescript
const calculateValidUntil = (
  quotationDate: string, 
  validDays: number = 30
) => {
  const date = new Date(quotationDate);
  date.setDate(date.getDate() + validDays);
  return date.toISOString().split('T')[0];
};

// 示例：quotationDate = '2025-12-18'
// 输出：validUntil = '2026-01-17'（30天后）
```

## 测试场景

### 场景1：单一货币报价
```typescript
products: [
  { ..., unitPrice: 15.50, currency: 'USD' },
  { ..., unitPrice: 12.80, currency: 'USD' },
  { ..., unitPrice: 8.90, currency: 'USD' }
]

// 结果：
// 报价总额 (Total Amount): USD 37,200.00
```

### 场景2：多货币报价
```typescript
products: [
  { ..., unitPrice: 15.50, currency: 'USD' },
  { ..., unitPrice: 100.00, currency: 'CNY' },
  { ..., unitPrice: 45.00, currency: 'EUR' }
]

// 结果：
// 报价总额 (Total Amount): USD 15,500.00
// CNY 小计: CNY 50,000.00
// EUR 小计: EUR 22,500.00
```

### 场景3：部分条款填写
```typescript
terms: {
  paymentTerms: 'T/T 30% deposit, 70% before shipment',
  deliveryTerms: 'FOB Shenzhen',
  moq: '500个/款'
  // 其他字段留空
}

// 结果：只显示3个条款，其他不显示
```

## 优势特性

### 1. 专业性
- ✅ A4国际标准格式
- ✅ 台湾大厂风格设计
- ✅ 完整的商务条款
- ✅ 正式的签名区域

### 2. 灵活性
- ✅ 多货币支持
- ✅ 条款可选编辑
- ✅ Logo可自定义
- ✅ 关联询价单号

### 3. 自动化
- ✅ 自动生成BJ编号
- ✅ 自动计算报价金额
- ✅ 自动汇总总价
- ✅ 自动按货币分组

### 4. 易用性
- ✅ 一键导出PDF
- ✅ 在线预览
- ✅ 打印友好
- ✅ 数据完整

## 下一步开发建议

### 1. 集成到供应商Portal
```typescript
// 在供应商的询价报价管理中
// 添加"生成报价单"功能
<Button onClick={handleGenerateQuotation}>
  生成报价单
</Button>

// 自动填充数据
const quotationData = convertRFQToQuotation(rfq, quote);
```

### 2. 邮件发送功能
```typescript
// 生成报价单PDF后
// 自动发送邮件给COSUN采购员
const sendQuotationEmail = async (quotationData, pdfBlob) => {
  await emailService.send({
    to: quotationData.buyer.email,
    subject: `报价单 - ${quotationData.quotationNo}`,
    attachments: [pdfBlob]
  });
};
```

### 3. 报价历史记录
```typescript
// 保存报价单到数据库
const saveQuotation = (quotationData) => {
  const quotation = {
    ...quotationData,
    createdAt: new Date(),
    status: 'sent',
    version: 1
  };
  
  return quotationsContext.addQuotation(quotation);
};
```

### 4. 比价功能
```typescript
// 在采购员端
// 对比多个供应商的报价单
<QuotationComparison
  rfqId={rfq.id}
  quotations={quotations.filter(q => q.rfqReference === rfq.rfqNumber)}
/>
```

## 相关文档

- [采购询价单模版](./SupplierRFQDocument.tsx)
- [报价单使用说明](./SUPPLIER_QUOTATION_TEMPLATE.md)
- [供应商Portal开发文档](./SUPPLIER_PORTAL.md)

## 总结

✅ **已完成的功能**：
1. 创建了完整的供应商报价单模版组件
2. 实现了多货币支持和自动汇总
3. 添加了供应商Logo显示
4. 设计了专业的签名区域
5. 实现了打印和导出PDF功能
6. 创建了预览组件
7. 编写了完整的使用说明文档

✅ **核心优势**：
1. 格式统一（与询价单一致）
2. 角色明确（供应商 vs COSUN）
3. 功能完整（价格、条款、签名）
4. 灵活可扩展（多货币、可选条款）

🎉 **供应商报价单模版已完成，可以开始集成到业务流程中！**
