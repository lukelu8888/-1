# THE COSUN BM A4标准打印指南

## 📋 概述

本指南详细说明如何在系统中实现完美的A4标准打印功能，确保所有商业表单（报价单、合同、发票等）在屏幕预览和打印时都完美适配A4纸张。

---

## 📐 A4纸张标准尺寸

### 物理尺寸
- **宽度**: 210mm
- **高度**: 297mm

### 像素尺寸（96 DPI）
- **宽度**: 794px
- **高度**: 1123px

### 推荐边距
- **标准边距**: 15mm (约 57px)
- **可打印区域**: 180mm × 267mm

---

## 🛠️ 实现方案

### 1. 核心工具类

#### **位置**: `/utils/a4-print-helper.ts`

提供了完整的A4打印工具函数：
- `A4_CONFIG` - A4标准尺寸配置
- `getA4ContainerStyle()` - 获取A4容器样式
- `triggerPrint()` - 触发打印对话框
- `isContentOverflowing()` - 检查内容是否溢出
- `calculatePageCount()` - 计算所需页数

**使用示例:**
```typescript
import { getA4ContainerStyle, triggerPrint } from '@/utils/a4-print-helper';

// 获取A4容器样式
const containerStyle = getA4ContainerStyle(15); // 15mm边距

// 触发打印
triggerPrint(
  () => console.log('打印前准备'),
  () => console.log('打印完成')
);
```

### 2. 标准表单模板组件

#### **位置**: `/components/forms/CosunA4Template.tsx`

提供了一套完整的表单组件：

#### **主容器 - CosunA4Template**
```tsx
<CosunA4Template 
  paddingMm={15}      // 内边距（毫米）
  showBorder={true}   // 显示边框（仅屏幕预览）
  isLastPage={true}   // 是否最后一页
>
  {/* 表单内容 */}
</CosunA4Template>
```

#### **页眉组件 - CosunFormHeader**
```tsx
<CosunFormHeader
  companyName="THE COSUN BM"
  companyNameEn="Fujian Gaoshengdafu Building Materials Co., Ltd."
  title="報價單"
  titleEn="QUOTATION"
  themeColor="#F96302"  // COSUN橙色
  companyInfo={{
    taxId: '91350000MA2XXXXXXX',
    address: '福建省福州市仓山区建新镇XX工业区XX号',
    addressEn: 'XX Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
    tel: '+86-591-8888-8888',
    fax: '+86-591-8888-8889',
    email: 'sales@cosunbm.com',
    website: 'www.cosunbm.com',
  }}
/>
```

#### **表格组件 - CosunFormTable**
```tsx
<CosunFormTable
  title="產品明細"
  titleEn="Product Details"
  themeColor="#F96302"
  headers={[
    { label: '項次', labelEn: 'No.', width: '10%', align: 'center' },
    { label: '產品名稱', labelEn: 'Product Name', align: 'left' },
    { label: '金額', labelEn: 'Amount', width: '15%', align: 'right' },
  ]}
  data={[
    ['1', 'Product A', '$100.00'],
    ['2', 'Product B', '$200.00'],
  ]}
  striped={true}  // 斑马纹
/>
```

#### **信息栏组件 - CosunFormInfoRow**
```tsx
<CosunFormInfoRow
  themeColor="#F96302"
  items={[
    {
      label: '報價單號碼',
      labelEn: 'Quotation No.',
      value: 'QT-2024-001',
      span: 1,  // 1列或2列
    },
    {
      label: '報價日期',
      labelEn: 'Quote Date',
      value: '2024-01-01',
      span: 1,
    },
  ]}
/>
```

#### **签名区组件 - CosunSignatureArea**
```tsx
<CosunSignatureArea
  signatures={[
    { title: '製單人員', titleEn: 'Prepared By' },
    { title: '核准主管', titleEn: 'Approved By' },
  ]}
/>
```

#### **页脚组件 - CosunFormFooter**
```tsx
<CosunFormFooter
  text="本文件為電腦列印文件，如有塗改或未蓋公司印章恕不生效"
  textEn="This document is computer generated and valid only with company seal"
  showPageNumber={true}
  pageNumber={1}
  totalPages={1}
/>
```

### 3. 全局打印样式

#### **位置**: `/styles/globals.css`

已添加完整的A4打印CSS：

```css
/* A4页面容器 - 屏幕预览 */
@media screen {
  .cosun-a4-page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    background: white;
    margin: 20px auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }
}

/* A4页面容器 - 打印 */
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  
  .cosun-a4-page {
    width: 100%;
    min-height: auto;
    padding: 0;
    margin: 0;
    box-shadow: none !important;
    page-break-after: always;
  }
}
```

---

## 📝 实际应用示例

### 示例1: 报价单模板（QuotationTemplateA4.tsx）

```tsx
import React, { forwardRef } from 'react';
import CosunA4Template, { 
  CosunFormHeader, 
  CosunFormTable, 
  CosunSignatureArea,
  CosunFormFooter 
} from '../forms/CosunA4Template';

const QuotationTemplateA4 = forwardRef<HTMLDivElement, Props>(
  ({ quotation }, ref) => {
    return (
      <CosunA4Template ref={ref} paddingMm={15}>
        {/* 页眉 */}
        <CosunFormHeader
          companyName="THE COSUN BM"
          companyNameEn="Fujian Gaoshengdafu Building Materials Co., Ltd."
          title="報價單"
          titleEn="QUOTATION"
          themeColor="#F96302"
        />

        {/* 产品明细表格 */}
        <CosunFormTable
          title="產品明細"
          titleEn="Product Details"
          themeColor="#F96302"
          headers={[...]}
          data={quotation.products.map(...)}
        />

        {/* 签名区 */}
        <CosunSignatureArea
          signatures={[
            { title: '製單人員', titleEn: 'Prepared By' },
            { title: '核准主管', titleEn: 'Approved By' },
          ]}
        />

        {/* 页脚 */}
        <CosunFormFooter />
      </CosunA4Template>
    );
  }
);

export default QuotationTemplateA4;
```

---

## 🎯 关键要点

### ✅ DO (推荐做法)

1. **使用`CosunA4Template`作为最外层容器**
   - 确保严格的A4尺寸
   - 自动处理屏幕预览和打印差异

2. **使用毫米单位（mm）**
   - 更精确的打印控制
   - 例如：`padding: 15mm` 而不是 `padding: 57px`

3. **添加`.avoid-break`类**
   - 防止重要内容被分页切断
   - 例如：表格、签名区、小结

4. **确保颜色打印**
   ```css
   -webkit-print-color-adjust: exact !important;
   print-color-adjust: exact !important;
   ```

5. **使用固定的字体大小（pt）**
   - 打印时字体大小更稳定
   - 例如：`fontSize: '8pt'` 而不是 `text-xs`

### ❌ DON'T (避免做法)

1. **不要使用px作为打印尺寸**
   - 不同DPI会导致不一致
   - 改用mm单位

2. **不要在打印样式中使用Tailwind响应式类**
   - 打印时这些类可能不生效
   - 改用inline style或CSS

3. **不要在A4容器外添加边距**
   - 会破坏A4尺寸
   - 边距应该在容器内部设置

4. **不要使用transform: scale()**
   - 打印时会被重置
   - 直接使用正确的尺寸

5. **不要忘记隐藏打印按钮**
   ```tsx
   <Button className="print:hidden">打印</Button>
   ```

---

## 🔍 常见问题

### Q1: 为什么打印时内容超出了A4纸张？
**A:** 检查以下几点：
- 是否使用了`CosunA4Template`容器
- 是否设置了正确的`@page`规则
- 内容是否太多（需要分页）

### Q2: 为什么颜色在打印时显示为灰色？
**A:** 需要添加打印颜色设置：
```css
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

### Q3: 如何处理多页内容？
**A:** 使用多个`CosunA4Template`组件：
```tsx
<CosunA4Template isLastPage={false}>第1页</CosunA4Template>
<CosunA4Template isLastPage={true}>第2页</CosunA4Template>
```

### Q4: 打印对话框显示的页面大小不对？
**A:** 确保浏览器打印设置：
- 纸张大小：A4
- 边距：默认或自定义15mm
- 缩放：100%

---

## 📚 相关文件

### 核心文件
- `/utils/a4-print-helper.ts` - A4打印工具类
- `/components/forms/CosunA4Template.tsx` - 标准表单模板组件
- `/styles/globals.css` - 全局打印样式

### 表单模板（已升级）
- `/components/admin/QuotationTemplateA4.tsx` - 报价单（A4标准版）
- `/components/admin/QuotationTemplate.tsx` - 报价单（原版）

### 待升级的表单
- 销售合同模板 (SalesContractTemplate)
- 采购订单模板 (PurchaseOrderTemplate)
- 商业发票模板 (CommercialInvoiceTemplate)
- 装箱单模板 (PackingListTemplate)
- 提单模板 (BillOfLadingTemplate)
- 等等...

---

## 🚀 下一步计划

1. ✅ 完成报价单A4标准化
2. ⏳ 升级销售合同模板
3. ⏳ 升级采购订单模板
4. ⏳ 升级发票和装箱单
5. ⏳ 添加PDF导出功能
6. ⏳ 添加批量打印功能

---

## 💡 最佳实践总结

1. **始终使用`CosunA4Template`作为容器**
2. **使用毫米（mm）作为尺寸单位**
3. **重要内容添加`.avoid-break`类**
4. **确保打印颜色设置正确**
5. **测试多种浏览器的打印效果**
6. **提供打印预览功能**
7. **按钮和UI元素添加`print:hidden`类**

---

**最后更新**: 2024-11-30
**维护者**: AI Assistant
**版本**: v1.0
