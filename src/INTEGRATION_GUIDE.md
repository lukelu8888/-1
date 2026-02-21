# 🚀 业务员端功能集成指南

## 快速集成步骤

### Step 1: 在业务员 Portal 添加导航菜单

找到业务员 Portal 的导航组件（通常在 `AdminDashboard.tsx` 或类似文件），添加"我的采购需求"菜单项：

```typescript
// 在 AdminDashboard.tsx 或业务员 Portal 中

import { MyPurchaseRequirements } from './components/salesperson/MyPurchaseRequirements';

// ... 其他 imports ...

export default function SalespersonPortal() {
  const [activeSection, setActiveSection] = useState('dashboard');
  
  return (
    <div>
      {/* 导航栏 */}
      <Nav>
        <Nav.Link onClick={() => setActiveSection('dashboard')}>
          仪表盘
        </Nav.Link>
        
        <Nav.Link onClick={() => setActiveSection('inquiries')}>
          客户询价
        </Nav.Link>
        
        {/* 🔥 新增菜单：我的采购需求 */}
        <Nav.Link onClick={() => setActiveSection('myPurchaseRequirements')}>
          <FileText className="mr-2" />
          我的采购需求
        </Nav.Link>
        
        <Nav.Link onClick={() => setActiveSection('quotations')}>
          我的报价
        </Nav.Link>
      </Nav>
      
      {/* 内容区域 */}
      <div className="content">
        {activeSection === 'dashboard' && <Dashboard />}
        {activeSection === 'inquiries' && <InquiryManagement />}
        
        {/* 🔥 新增渲染：我的采购需求 */}
        {activeSection === 'myPurchaseRequirements' && <MyPurchaseRequirements />}
        
        {activeSection === 'quotations' && <QuotationManagement />}
      </div>
    </div>
  );
}
```

---

### Step 2: 确保 Context Providers 已包裹

确保业务员 Portal 已被必要的 Context Providers 包裹：

```typescript
// 在 App.tsx 或入口文件中

import { PurchaseRequirementProvider } from './contexts/PurchaseRequirementContext';
import { SalesQuotationProvider } from './contexts/SalesQuotationContext';
import { InquiryProvider } from './contexts/InquiryContext';

function App() {
  return (
    <InquiryProvider>
      <PurchaseRequirementProvider>
        <SalesQuotationProvider>
          {/* 其他 Providers */}
          <YourApp />
        </SalesQuotationProvider>
      </PurchaseRequirementProvider>
    </InquiryProvider>
  );
}
```

---

### Step 3: 测试完整流程

#### 3.1 准备测试数据

**a. 创建客户询价（INQ）**
```
Customer Portal → 登录客户 → 创建询价
产品：LED灯 60W × 5000pcs
提交 → 生成 INQ-NA-251221-0001
```

**b. 业务员下推采购需求（QR）**
```
Admin Portal → 登录业务员 → 询价管理
找到 INQ-NA-251221-0001 → 点击"下推成本询报"
生成 QR-NA-251221-8888
```

**c. 采购员创建询价单（XJ）**
```
Admin Portal → 登录采购员 → 采购需求池
找到 QR-NA-251221-8888 → 点击"创建询价单"
选择供应商1、2、3 → 生成 3个 XJ
```

**d. 供应商提交报价（BJ）**
```
Supplier Portal → 登录供应商1 → 查看询价
填写报价：单价 $8.20，MOQ 1000，交期 25天
提交 → 生成 BJ-NA-251221-3762
重复以上步骤让其他供应商也提交报价
```

**e. 采购员智能比价反馈**
```
Admin Portal → 登录采购员 → 采购需求池
找到 QR-NA-251221-8888 → 点击"智能反馈"⚡
系统自动比价 → 确认推荐供应商 → 提交反馈
```

#### 3.2 测试业务员端功能

**a. 查看我的采购需求**
```
Admin Portal → 登录业务员 → 我的采购需求
✅ 应该看到 QR-NA-251221-8888
✅ 状态应该显示"✅ 已反馈"
✅ 统计卡片"已收到反馈"应该显示正确数量
```

**b. 查看采购反馈**
```
点击"查看反馈"按钮
✅ 应该弹出采购反馈对话框
✅ 应该显示成本信息（总成本、建议利润率、建议售价）
✅ 应该显示产品成本明细表
✅ 应该显示采购员专业建议
❌ 不应该显示供应商名称、BJ单号（权限隔离）
```

**c. 创建客户报价**
```
点击"基于此成本创建客户报价"按钮
✅ 应该弹出创建报价对话框
✅ 成本单价应该自动填充
✅ 客户信息应该自动关联（从 INQ）
✅ 利润率应该显示建议值（如 30%）
✅ 销售单价应该自动计算

调整利润率从 30% 改为 35%
✅ 销售单价应该自动更新
✅ 总报价应该自动更新

点击"创建客户报价单"
✅ 应该显示成功 Toast
✅ 应该生成 QT 编号（如 QT-NA-251221-8888）
✅ 对话框应该关闭
```

**d. 验证数据保存**
```
打开浏览器控制台
执行：JSON.parse(localStorage.getItem('salesQuotations'))
✅ 应该看到新创建的 QT
✅ qrNumber 应该等于 QR-NA-251221-8888
✅ inqNumber 应该等于 INQ-NA-251221-0001
✅ items 应该包含正确的产品和价格
```

---

### Step 4: 常见问题排查

#### 问题 1: 看不到"我的采购需求"菜单

**原因：** 未正确导入组件或未添加导航项

**解决：**
```typescript
// 检查是否正确导入
import { MyPurchaseRequirements } from './components/salesperson/MyPurchaseRequirements';

// 检查是否添加导航项
<Nav.Link onClick={() => setActiveSection('myPurchaseRequirements')}>
  我的采购需求
</Nav.Link>

// 检查是否添加渲染逻辑
{activeSection === 'myPurchaseRequirements' && <MyPurchaseRequirements />}
```

---

#### 问题 2: 点击"查看反馈"没有反应

**原因：** QR 没有 purchaserFeedback 字段

**解决：**
```typescript
// 检查 QR 数据
console.log('QR数据:', qr);
console.log('是否有反馈:', qr.purchaserFeedback);

// 确保采购员已提交反馈
// Admin Portal → 采购员登录 → 采购需求池 → 智能反馈
```

---

#### 问题 3: 创建报价时提示"未找到关联客户"

**原因：** QR 的 sourceInquiryNo 未正确关联

**解决：**
```typescript
// 检查 QR 的 sourceInquiryNo 字段
console.log('QR的sourceInquiryNo:', qr.sourceInquiryNo);

// 检查 inquiries 列表
console.log('所有询价:', inquiries);

// 确保创建 QR 时正确设置了 sourceInquiryNo
// 或者通过产品名称匹配
```

---

#### 问题 4: 利润率调整后售价没有自动更新

**原因：** useEffect 依赖项配置问题

**解决：**
```typescript
// 检查 CreateQuotationFromFeedback.tsx 中的 useEffect
useEffect(() => {
  if (feedback.products) {
    // 重新计算售价的逻辑
  }
}, [feedback, margin]); // 确保 margin 在依赖项中
```

---

#### 问题 5: 保存的 QT 数据不完整

**原因：** SalesQuotation 接口字段不匹配

**解决：**
```typescript
// 检查 CreateQuotationFromFeedback.tsx 中的 handleSubmit
// 确保所有必填字段都已填充
const quotation: SalesQuotation = {
  id: `qt-${Date.now()}`,
  qtNumber,
  qrNumber: qr.requirementNo,
  inqNumber: relatedInquiry.inquiryNumber || relatedInquiry.id,
  region: qr.region as 'NA' | 'SA' | 'EU',
  // ... 其他必填字段
};

// 检查 SalesQuotationContext.tsx 中的 addQuotation 方法
// 确保正确保存到 localStorage
```

---

### Step 5: 性能优化建议

#### 5.1 使用 useMemo 缓存计算结果

```typescript
// 在 MyPurchaseRequirements.tsx 中
const myRequirements = useMemo(() => {
  return requirements.filter(qr => {
    // 筛选逻辑
  });
}, [requirements, currentUser, filterStatus, searchTerm]);
```

#### 5.2 使用 React.memo 优化组件渲染

```typescript
// 对于频繁渲染的子组件
const FeedbackCard = React.memo(({ qr, onViewFeedback }) => {
  // 组件逻辑
});
```

#### 5.3 懒加载对话框组件

```typescript
// 只在需要时才加载
const PurchaserFeedbackView = React.lazy(() => 
  import('./PurchaserFeedbackView')
);

// 使用 Suspense 包裹
<Suspense fallback={<Loading />}>
  <PurchaserFeedbackView ... />
</Suspense>
```

---

### Step 6: 扩展功能建议

#### 6.1 添加快捷筛选

```typescript
// 在 MyPurchaseRequirements.tsx 中添加更多筛选维度
const [filterRegion, setFilterRegion] = useState<'all' | 'NA' | 'SA' | 'EU'>('all');
const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');

// 筛选逻辑
const filteredRequirements = myRequirements.filter(qr => {
  if (filterRegion !== 'all' && qr.region !== filterRegion) return false;
  if (filterRisk !== 'all' && qr.purchaserFeedback?.riskLevel !== filterRisk) return false;
  return true;
});
```

#### 6.2 添加导出功能

```typescript
// 导出采购反馈为 PDF/Excel
const handleExportFeedback = (qr: PurchaseRequirement) => {
  const data = {
    qrNumber: qr.requirementNo,
    products: qr.purchaserFeedback.products,
    totalCost: qr.purchaserFeedback.products.reduce((sum, p) => sum + p.amount, 0),
    // ... 其他数据
  };
  
  // 使用库如 jsPDF、xlsx 等
  exportToPDF(data);
};
```

#### 6.3 添加批量操作

```typescript
// 批量创建报价
const [selectedQRs, setSelectedQRs] = useState<string[]>([]);

const handleBatchCreateQuotations = () => {
  selectedQRs.forEach(qrId => {
    const qr = myRequirements.find(q => q.id === qrId);
    if (qr && qr.purchaserFeedback) {
      // 创建报价逻辑
    }
  });
};
```

---

## 完整文件依赖关系

```
MyPurchaseRequirements.tsx
  ├─ PurchaserFeedbackView.tsx
  │   └─ PurchaseRequirementContext (读取 purchaserFeedback)
  │
  └─ CreateQuotationFromFeedback.tsx
      ├─ PurchaseRequirementContext (读取 QR 数据)
      ├─ SalesQuotationContext (保存 QT 数据)
      └─ InquiryContext (关联客户信息)
```

---

## 数据流转图

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 采购员提交反馈                                           │
│    PurchaseRequirementContext.updateRequirement()           │
│    ├─ 更新 QR 的 purchaserFeedback 字段                    │
│    └─ 保存到 localStorage.purchaseRequirements             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 业务员查看反馈                                           │
│    MyPurchaseRequirements.tsx                               │
│    ├─ usePurchaseRequirements() 读取所有 QR                │
│    ├─ 筛选 createdBy === currentUser.name                  │
│    └─ 显示有 purchaserFeedback 的 QR                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 业务员点击"查看反馈"                                     │
│    PurchaserFeedbackView.tsx                                │
│    ├─ 接收 qr 和 qr.purchaserFeedback                      │
│    ├─ 显示成本信息（脱敏）                                 │
│    └─ 不显示 linkedBJ、linkedSupplier                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 业务员点击"创建客户报价"                                 │
│    CreateQuotationFromFeedback.tsx                          │
│    ├─ 从 purchaserFeedback.products 提取成本信息           │
│    ├─ 从 useInquiries() 查找关联的 INQ                     │
│    ├─ 计算售价 = 成本 × (1 + 利润率)                       │
│    └─ 生成 QT 对象                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 保存客户报价                                             │
│    SalesQuotationContext.addQuotation()                     │
│    ├─ 保存到 state: quotations                             │
│    └─ 保存到 localStorage.salesQuotations                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 集成完成检查清单

- [ ] ✅ 已导入 MyPurchaseRequirements 组件
- [ ] ✅ 已添加"我的采购需求"导航菜单
- [ ] ✅ 已添加渲染逻辑
- [ ] ✅ 已确保 Context Providers 包裹
- [ ] ✅ 已测试查看采购需求列表
- [ ] ✅ 已测试筛选和搜索功能
- [ ] ✅ 已测试查看采购反馈
- [ ] ✅ 已测试权限隔离（不显示供应商信息）
- [ ] ✅ 已测试创建客户报价
- [ ] ✅ 已测试利润率调整
- [ ] ✅ 已测试数据保存

---

**🎉 集成完成！业务员现在可以查看采购反馈并创建客户报价了！**
