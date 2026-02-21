# 📋 供应商报价单模版说明文档

## 概述

供应商报价单（Quotation）是供应商响应COSUN询价的正式报价文档，采用A4标准格式，台湾大厂专业风格设计。

## 核心特性

### 1. **文档标识**
- ✅ 报价编号前缀：**BJ-YYYYMMDD-XXX**（报价的拼音首字母）
- ✅ 使用供应商自己的LOGO
- ✅ 标题：报价单 / Quotation
- ✅ A4标准格式（210mm × 297mm）

### 2. **货币支持**
- ✅ 多货币支持：USD、CNY、EUR、JPY等
- ✅ 每个产品可以独立设置货币单位
- ✅ 按货币分组显示总价
- ✅ 自动汇总和计算

### 3. **双方信息**
- ✅ **报价方**：供应商信息（左侧）
- ✅ **询价方**：COSUN公司信息（右侧）
- ✅ 与询价单的角色互换

### 4. **价格明细**
- ✅ 报价单价（每个产品的单价）
- ✅ 报价金额（单价 × 数量）
- ✅ 按货币分组的总价汇总
- ✅ 专业的数字格式化（千分位分隔，保留两位小数）

## 数据结构

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
    companyName: string;            // 东莞市华盛电器有限公司
    companyNameEn?: string;         // Dongguan Huasheng Electronics Co., Ltd.
    address: string;                // 中文地址
    addressEn?: string;             // 英文地址
    tel: string;                    // 联系电话
    email: string;                  // 邮箱
    contactPerson: string;          // 联系人
    supplierCode?: string;          // 供应商编号
    logo?: string;                  // 供应商LOGO图片URL
  };
  
  // 询价方（COSUN）信息
  buyer: {
    name: string;                   // 福建高盛达富建材有限公司
    nameEn: string;                 // Fujian COSUN Building Materials Co., Ltd.
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;          // 采购员姓名
  };
  
  // 报价产品清单
  products: Array<{
    no: number;                     // 序号
    modelNo?: string;               // 型号
    imageUrl?: string;              // 产品图片URL
    itemCode?: string;              // 物料编码
    description: string;            // 产品名称
    specification: string;          // 规格说明
    quantity: number;               // 数量
    unit: string;                   // 单位（个、台、箱等）
    unitPrice: number;              // 报价单价（数字）
    currency: string;               // 货币单位（USD、CNY、EUR等）
    remarks?: string;               // 备注
  }>;
  
  // 报价条款（所有字段可选）
  terms: {
    paymentTerms?: string;          // 付款方式
    deliveryTerms?: string;         // 交货条款（FOB/CIF/DDP等）
    deliveryTime?: string;          // 交货时间
    deliveryAddress?: string;       // 交货地址
    moq?: string;                   // 最小起订量
    qualityStandard?: string;       // 质量标准
    warranty?: string;              // 质保期
    packaging?: string;             // 包装方式
    shippingMarks?: string;         // 唛头
    remarks?: string;               // 其他说明
  };
}
```

## 文档结构

### 1. 文档头部
```
┌────────────────────────────────────────────────────────────────┐
│ [供应商LOGO]           报价单                    ┌──────────┐│
│                      Quotation                   │报价编号  ││
│                                                  │报价日期  ││
│                                                  │有效期至  ││
│                                                  │询价单号  ││
│                                                  └──────────┘│
├────────────────────────────────────────────────────────────────┤
```

### 2. 双方信息
```
┌──────────────────────────┬──────────────────────────┐
│ 报价方（供应商）         │ 询价方（客户）           │
├──────────────────────────┼──────────────────────────┤
│ 东莞市华盛电器有限公司   │ 福建高盛达富建材有限公司 │
│ Dongguan Huasheng...     │ Fujian COSUN...          │
│ 供应商编号：SUP-001      │                          │
│ 地址：广东省东莞市...    │ 地址：福建省福州市...    │
│ 电话：...                │ 电话：...                │
│ 邮箱：...                │ 邮箱：...                │
│ 联系人：张经理           │ 联系人：李采购           │
└──────────────────────────┴──────────────────────────┘
```

### 3. 报价产品清单
```
┌────┬────┬────┬──────────┬────┬────┬────────┬────────┬────┐
│序号│型号│图片│产品名称  │数量│单位│报价单价│报价金额│备注│
├────┼────┼────┼──────────┼────┼────┼────────┼────────┼────┤
│ 1  │ABC │[图]│LED灯 100W│1000│ 个 │USD 1.50│USD     │    │
│    │    │    │          │    │    │        │1,500.00│    │
├────┼────┼────┼──────────┼────┼────┼────────┼────────┼────┤
│ 2  │XYZ │[图]│开关 220V │500 │ 个 │CNY 5.00│CNY     │    │
│    │    │    │          │    │    │        │2,500.00│    │
├────┴────┴────┴──────────┴────┴────┴────────┼────────┼────┤
│                    报价总额 (Total Amount): │USD     │    │
│                                             │1,500.00│    │
├─────────────────────────────────────────────┼────────┼────┤
│                               USD 小计:     │CNY     │    │
│                                             │2,500.00│    │
└─────────────────────────────────────────────┴────────┴────┘
```

### 4. 报价条款
```
┌────────────────────────────────────────────────────────┐
│ 报价条款                                               │
├────────────────────────────────────────────────────────┤
│ 1. 付款方式：T/T 30% deposit, 70% before shipment     │
│ 2. 交货条款：FOB Shenzhen                             │
│ 3. 交货时间：收到订单后30天                           │
│ 4. 交货地址：客户指定地址                             │
│ 5. 最小起订量（MOQ）：500个                           │
│ 6. 质量标准：符合GB/T标准                             │
│ 7. 质保期：12个月                                      │
│ 8. 包装方式：标准出口纸箱包装                         │
│ 9. 唛头：中性唛头                                      │
│ 10. 其他说明：样品费可退                              │
└────────────────────────────────────────────────────────┘
```

### 5. 签名区域
```
┌──────────────────────┬──────────────────────┐
│ 报价方（供应商）     │ 询价方确认（客户）   │
│ ──────────────────── │ ──────────────────── │
│ 签字盖章：__________ │ 签字盖章：__________ │
│ 日期：____年____月__ │ 日期：____年____月__ │
└──────────────────────┴──────────────────────┘
```

## 使用示例

### 完整数据示例

```typescript
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
    addressEn: 'No.1 Hengzhong Road, Xin\'an Community, Chang\'an Town, Dongguan, Guangdong',
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
    addressEn: 'No.618 Jinshan Avenue, Cangshan District, Fuzhou, Fujian',
    tel: '+86-591-8888-8888',
    email: 'purchase@cosun.com',
    contactPerson: '李采购'
  },
  
  // 产品清单（多货币示例）
  products: [
    {
      no: 1,
      modelNo: 'LED-100W',
      imageUrl: 'https://images.unsplash.com/photo-1234567890',
      description: 'LED工矿灯',
      specification: '100W 6000K 色温 IP65防水',
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
    },
    {
      no: 3,
      modelNo: 'CB-50M',
      description: '电缆线',
      specification: '3×2.5mm² 国标铜芯',
      quantity: 100,
      unit: '米',
      unitPrice: 8.50,
      currency: 'USD'
    }
  ],
  
  // 报价条款
  terms: {
    paymentTerms: 'T/T 30% deposit, 70% before shipment',
    deliveryTerms: 'FOB Shenzhen',
    deliveryTime: '收到订单后30天',
    deliveryAddress: '客户指定仓库',
    moq: '500个/款',
    qualityStandard: '符合GB/T 19001-2016标准，提供CE认证',
    warranty: '12个月质保，终身维护',
    packaging: '标准出口纸箱+托盘，防水防潮包装',
    shippingMarks: '按客户要求印刷唛头',
    remarks: '样品费100元/个，下单后可退。大批量订单可协商价格。'
  }
};
```

### 组件使用

```typescript
import { SupplierQuotationDocument, SupplierQuotationData } from './components/documents/templates/SupplierQuotationDocument';

function QuotationPreview() {
  const documentRef = useRef<HTMLDivElement>(null);
  
  return (
    <div>
      <SupplierQuotationDocument 
        ref={documentRef} 
        data={quotationData} 
      />
      
      <Button onClick={() => window.print()}>
        导出PDF
      </Button>
    </div>
  );
}
```

## 多货币处理逻辑

### 1. 单货币场景
如果所有产品使用同一货币：
```
┌─────────────────────────────────────────────┐
│ 报价总额 (Total Amount): USD 25,350.00     │
└─────────────────────────────────────────────┘
```

### 2. 多货币场景
如果产品使用不同货币，按货币分组显示：
```
┌─────────────────────────────────────────────┐
│ 报价总额 (Total Amount): USD 16,350.00     │
├─────────────────────────────────────────────┤
│ CNY 小计: CNY 17,500.00                     │
├─────────────────────────────────────────────┤
│ EUR 小计: EUR 2,000.00                      │
└─────────────────────────────────────────────┘
```

### 3. 货币自动汇总代码

```typescript
// 按货币分组计算总价
const totals: { [currency: string]: number } = {};
data.products.forEach(product => {
  if (!totals[product.currency]) {
    totals[product.currency] = 0;
  }
  totals[product.currency] += product.unitPrice * product.quantity;
});

// 渲染多货币总价
Object.entries(totals).map(([currency, total], index) => (
  <tr key={currency} className="bg-orange-50 font-bold">
    <td colSpan={7} className="border-2 border-gray-400 px-2 py-2 text-right">
      {index === 0 ? '报价总额 (Total Amount):' : `${currency} 小计:`}
    </td>
    <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600 text-sm">
      {currency} {total.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}
    </td>
    <td className="border-2 border-gray-400 px-2 py-2"></td>
  </tr>
));
```

## 与询价单的区别

| 项目 | 询价单（RFQ） | 报价单（Quotation） |
|------|---------------|---------------------|
| **文档编号** | RFQ-YYYYMMDD-XXX | BJ-YYYYMMDD-XXX |
| **LOGO** | COSUN Logo | 供应商 Logo |
| **左侧主体** | 询价方（COSUN） | 报价方（供应商） |
| **右侧主体** | 供应商 | 询价方（COSUN） |
| **价格列** | 目标价格（参考） | 报价单价（正式） |
| **金额列** | 合计价格 | 报价金额 |
| **条款性质** | 询价要求 | 报价条款 |
| **签名区** | 无 | 双方签字盖章区 |
| **有效期** | 回复截止日期 | 报价有效期 |

## 业务流程集成

### 完整流程

```
1. COSUN发送询价单（RFQ-xxx）
   ↓
2. 供应商收到询价单
   ↓
3. 供应商填写报价信息
   ↓
4. 系统生成报价单（BJ-xxx）
   ├─ 自动关联询价单号
   ├─ 使用供应商Logo
   ├─ 填充供应商信息
   ├─ 计算报价金额和总价
   └─ 按货币分组汇总
   ↓
5. 供应商预览和导出报价单PDF
   ↓
6. 供应商提交报价给COSUN
   ↓
7. COSUN采购员评估报价
   ↓
8. 如接受报价，双方签字盖章
   ↓
9. 报价单转化为采购订单
```

## 打印和导出

### 打印设置
- ✅ A4纸张（210mm × 297mm）
- ✅ 纵向（Portrait）
- ✅ 边距：15mm
- ✅ 自动分页，避免表格断裂
- ✅ 隐藏按钮等非打印元素

### 导出PDF步骤
1. 点击"导出PDF"按钮
2. 浏览器打开打印对话框
3. 目标打印机选择"另存为PDF"
4. 文件名自动生成：`报价单_BJ-20251218-001_20251218.pdf`
5. 选择保存位置
6. 点击保存

## 高级特性

### 1. 自动编号生成
```typescript
const generateQuotationNo = () => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const sequence = String(currentSequence).padStart(3, '0');
  return `BJ-${date}-${sequence}`;
};
// 结果: BJ-20251218-001
```

### 2. 有效期自动计算
```typescript
const calculateValidUntil = (quotationDate: string, validDays: number = 30) => {
  const date = new Date(quotationDate);
  date.setDate(date.getDate() + validDays);
  return date.toISOString().split('T')[0];
};
```

### 3. 货币转换（可选功能）
```typescript
// 未来可以添加货币转换功能
const convertCurrency = (amount: number, from: string, to: string) => {
  const rates = { USD: 1, CNY: 7.2, EUR: 0.92 };
  return (amount / rates[from]) * rates[to];
};
```

## 样式规范

### 颜色方案
- 主色调：橙色 `#F96302`（COSUN品牌色）
- 价格高亮：蓝色 `#2563eb`（报价单价）
- 金额高亮：橙色 `#ea580c`（报价金额）
- 背景色：灰色 `#f3f4f6`（表头）
- 边框色：灰色 `#9ca3af`

### 字体大小
- 标题：`text-3xl`（30px）
- 小标题：`text-base`（16px）
- 表头：`text-xs`（12px）
- 正文：`text-xs`（12px）

### 表格样式
- 外边框：2px 实线
- 内边框：1px 实线
- 表头背景：灰色
- 总价行背景：橙色浅色

## 注意事项

1. **供应商Logo**
   - 建议尺寸：150px × 60px
   - 支持格式：PNG、JPG、SVG
   - 如无Logo，显示占位符

2. **货币单位**
   - 常用：USD、CNY、EUR、JPY、GBP
   - 必须与产品数据一致
   - 不同货币分别汇总

3. **数字格式**
   - 使用千分位分隔符
   - 保留两位小数
   - 右对齐显示

4. **条款填写**
   - 所有条款字段可选
   - 只显示填写的条款
   - 空值自动隐藏

5. **签名区域**
   - 预留签字盖章位置
   - 双方各执一份
   - 签字后生效

## 文件位置

```
/components/documents/templates/SupplierQuotationDocument.tsx
```

## 相关文档

- [供应商询价单模版](./SupplierRFQDocument.tsx)
- [采购订单模版](./PurchaseOrderDocument.tsx)（待开发）
- [销售合同模版](./SalesContractDocument.tsx)（待开发）

## 更新日志

### v1.0.0 (2025-12-18)
- ✅ 初始版本发布
- ✅ A4标准格式
- ✅ 多货币支持
- ✅ 报价金额自动计算
- ✅ 按货币分组汇总
- ✅ 供应商Logo支持
- ✅ 报价条款可选编辑
- ✅ 签名区域设计
- ✅ 打印和导出PDF功能
