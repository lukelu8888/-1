# RFQ测试辅助工具

## 快速创建测试RFQ数据

在浏览器控制台执行以下代码，可以快速创建测试RFQ数据：

```javascript
// 🔥 创建测试RFQ数据
const testRFQ = {
  id: `rfq_${Date.now()}`,
  rfqNumber: `RFQ-TEST-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-001`,
  requirementNo: 'PR-2025-1215-001',
  sourceRef: 'SO-2025-0892',
  
  // 🔥 目标供应商（替换为你的供应商邮箱）
  targetSuppliers: [
    {
      supplierCode: 'supplier@test.com',  // ⚠️ 修改为你的供应商邮箱
      supplierName: '测试供应商A',
      supplierEmail: 'supplier@test.com'
    }
  ],
  
  // 产品清单
  items: [
    {
      id: 'item1',
      productName: '智能LED面板灯',
      modelNo: 'LED-1200x300-40W',
      specification: '40W, 4000K, CRI>80, 可调光',
      quantity: 5000,
      unit: '个',
      targetPrice: 12.50,
      currency: 'USD',
      hsCode: '9405.40',
      packingRequirement: '标准纸箱包装',
      remarks: '客户项目紧急，请快速报价'
    }
  ],
  
  // 询价信息
  expectedDate: '2025-12-30',
  quotationDeadline: '2025-12-20',
  
  // 状态信息
  status: 'pending',
  
  // 其他信息
  remarks: '项目紧急，请优先处理',
  createdBy: 'admin@cosun.com',
  createdDate: '2025-12-17',
  
  // 报价信息（初始为空）
  quotes: []
};

// 保存到localStorage
const existingRFQs = JSON.parse(localStorage.getItem('rfqs') || '[]');
existingRFQs.push(testRFQ);
localStorage.setItem('rfqs', JSON.stringify(existingRFQs));

console.log('✅ 测试RFQ已创建:', testRFQ.rfqNumber);
console.log('📋 RFQ详情:', testRFQ);

// 刷新页面查看
location.reload();
```

## 查看当前所有RFQ

```javascript
const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
console.table(rfqs.map(r => ({
  询价单号: r.rfqNumber,
  产品: r.items[0]?.productName,
  数量: r.items[0]?.quantity,
  供应商数: r.targetSuppliers?.length,
  报价数: r.quotes?.length || 0,
  状态: r.status
})));
```

## 清空RFQ数据

```javascript
localStorage.removeItem('rfqs');
console.log('✅ RFQ数据已清空');
location.reload();
```

## 模拟供应商报价

```javascript
// 1. 先获取最新的RFQ
const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
const latestRFQ = rfqs[rfqs.length - 1];

// 2. 添加供应商报价
const supplierQuote = {
  supplierCode: 'supplier@test.com',  // ⚠️ 必须与targetSuppliers中的一致
  supplierName: '测试供应商A',
  quotedDate: '2025-12-17',
  quotedPrice: 11.80,  // 报价单价
  leadTime: 30,        // 交货周期（天）
  moq: 1000,           // 最小订购量
  validityDays: 30,    // 报价有效期
  paymentTerms: 'T/T 30% deposit, 70% before shipment',
  remarks: '我们可以提供优质产品和快速交货'
};

// 3. 更新RFQ
if (!latestRFQ.quotes) {
  latestRFQ.quotes = [];
}
latestRFQ.quotes.push(supplierQuote);
latestRFQ.status = 'quoted';
latestRFQ.updatedDate = new Date().toISOString().split('T')[0];

// 4. 保存
rfqs[rfqs.length - 1] = latestRFQ;
localStorage.setItem('rfqs', JSON.stringify(rfqs));

console.log('✅ 供应商报价已添加');
console.log('📊 报价详情:', supplierQuote);
location.reload();
```

## 完整测试流程

### 步骤1: 创建RFQ（Admin端）
```javascript
// 在Admin Portal控制台执行
const testRFQ = {
  id: `rfq_${Date.now()}`,
  rfqNumber: `RFQ-TEST-20251217-001`,
  requirementNo: 'PR-2025-1215-001',
  targetSuppliers: [{
    supplierCode: 'supplier@test.com',
    supplierName: '测试供应商',
    supplierEmail: 'supplier@test.com'
  }],
  items: [{
    id: 'item1',
    productName: 'LED面板灯',
    modelNo: 'LED-40W',
    quantity: 5000,
    unit: '个',
    targetPrice: 12.50,
    currency: 'USD'
  }],
  expectedDate: '2025-12-30',
  quotationDeadline: '2025-12-20',
  status: 'pending',
  createdBy: 'admin@cosun.com',
  createdDate: '2025-12-17',
  quotes: []
};

const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
rfqs.push(testRFQ);
localStorage.setItem('rfqs', JSON.stringify(rfqs));
console.log('✅ RFQ已创建');
```

### 步骤2: 登录供应商Portal查看
1. 退出Admin Portal
2. 使用 supplier@test.com 登录Supplier Portal
3. 进入"询价报价"模块
4. 应该能看到刚创建的RFQ

### 步骤3: 供应商提交报价
1. 点击"报价"按钮
2. 填写报价信息
3. 提交

### 步骤4: Admin查看报价
1. 切换回Admin Portal
2. 查看RFQ列表
3. 应该能看到供应商的报价

## 调试技巧

### 查看RFQ Context状态
在React DevTools中查看RFQProvider的状态

### 监听RFQ更新事件
```javascript
window.addEventListener('rfqsUpdated', (event) => {
  console.log('🔔 RFQ已更新:', event.detail);
});
```

### 检查供应商匹配
```javascript
const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
const currentSupplier = 'supplier@test.com';  // 当前登录供应商

const myRFQs = rfqs.filter(rfq => 
  rfq.targetSuppliers.some(s => s.supplierCode === currentSupplier)
);

console.log('我的RFQ数量:', myRFQs.length);
console.table(myRFQs);
```
