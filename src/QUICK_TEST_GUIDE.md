# 🚀 快速测试指南 - 供应商RFQ报价功能

## ⚡ 5分钟快速测试

### 步骤1: 创建测试RFQ（1分钟）

1. 打开应用，如果是在Customer Portal或其他页面，先**退出登录**
2. 打开浏览器**开发者工具控制台** (F12)
3. 粘贴并执行以下代码：

```javascript
// 🔥 一键创建测试RFQ
(function() {
  const testRFQ = {
    id: `rfq_${Date.now()}`,
    rfqNumber: `RFQ-TEST-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-001`,
    requirementNo: 'PR-2025-1215-001',
    sourceRef: 'SO-2025-0892',
    
    targetSuppliers: [
      {
        supplierCode: 'supplier@test.com',
        supplierName: '测试供应商',
        supplierEmail: 'supplier@test.com'
      }
    ],
    
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
    
    expectedDate: '2025-12-30',
    quotationDeadline: '2025-12-20',
    status: 'pending',
    remarks: '项目紧急，请优先处理',
    createdBy: 'admin@cosun.com',
    createdDate: '2025-12-17',
    quotes: []
  };
  
  const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
  rfqs.push(testRFQ);
  localStorage.setItem('rfqs', JSON.stringify(rfqs));
  
  console.log('%c✅ 测试RFQ已创建！', 'color: green; font-size: 16px; font-weight: bold');
  console.log('📋 RFQ编号:', testRFQ.rfqNumber);
  console.log('📦 产品:', testRFQ.items[0].productName);
  console.log('👥 目标供应商:', testRFQ.targetSuppliers[0].supplierEmail);
  
  alert('✅ 测试RFQ已创建！\n现在可以登录供应商账号查看。');
})();
```

### 步骤2: 注册/登录供应商账号（1分钟）

#### 方式A: 如果已有供应商账号
1. 点击右上角"登录"
2. 选择"供应商登录"
3. 使用邮箱: `supplier@test.com`

#### 方式B: 注册新供应商账号
1. 点击"成为供应商"
2. 填写信息：
   - **邮箱**: `supplier@test.com`
   - **密码**: `123456`
   - **公司名**: 测试供应商公司
   - **联系人**: 张三
   - **电话**: 13800138000
3. 提交注册
4. 自动跳转到Supplier Portal

### 步骤3: 查看RFQ（1分钟）

1. 登录后，自动进入Supplier Portal
2. 左侧菜单点击 **"询价报价"** (Calculator图标)
3. 查看统计卡片：
   - 应该显示 **"待报价: 1"**
4. 默认在"待报价"Tab，应该看到1条RFQ：
   ```
   RFQ-TEST-20251217-001
   智能LED面板灯
   5,000 个
   截止: 2025-12-20
   ```

### 步骤4: 提交报价（2分钟）

1. 点击RFQ右侧的 **"报价"** 按钮
2. 弹出报价表单，填写：
   - **单价**: `11.80` (会显示"✓ 低于目标5.6%")
   - **交货周期**: `30` 天
   - **最小订购量**: `1000`
   - **报价有效期**: `30` 天
   - **付款条款**: 保持默认 `T/T 30% deposit, 70% before shipment`
   - **备注**: `我们可以提供优质产品和快速交货`
3. 查看报价摘要：
   - 应该显示 **总金额: $59,000.00**
4. 点击 **"提交报价"** 按钮
5. 看到成功提示：
   ```
   ✅ 报价已成功提交！
   RFQ编号: RFQ-TEST-20251217-001
   报价已发送至COSUN管理员
   ```

### 步骤5: 验证报价（30秒）

1. 自动回到询价列表
2. 点击 **"已报价"** Tab
3. 应该看到刚才的RFQ已经移到"已报价"分类
4. 点击 **"查看报价"** 按钮
5. 在详情对话框中，应该看到绿色的"我的报价"区域，显示：
   - 报价单价: $11.80
   - 交货周期: 30 天
   - 最小订购量: 1000
   - 报价日期: 2025-12-17
   - 付款条款: T/T 30% deposit, 70% before shipment

---

## 📊 验证清单

测试完成后，确认以下功能：

- [x] RFQ在localStorage中正确保存
- [x] 供应商登录后能看到发给他的RFQ
- [x] 统计卡片数字正确（待报价=1）
- [x] 报价表单正确显示RFQ信息
- [x] 价格对比功能工作（显示低于/高于目标）
- [x] 总金额自动计算正确
- [x] 报价提交后显示成功提示
- [x] RFQ自动移到"已报价"Tab
- [x] 报价信息正确保存到RFQ.quotes数组
- [x] 可以查看已提交的报价详情

---

## 🔍 高级验证（可选）

### 查看数据结构

在控制台执行：

```javascript
// 查看所有RFQ
const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
console.log('📋 总RFQ数:', rfqs.length);
console.table(rfqs.map(r => ({
  询价单号: r.rfqNumber,
  产品: r.items[0]?.productName,
  供应商: r.targetSuppliers[0]?.supplierName,
  报价数: r.quotes?.length || 0,
  状态: r.status
})));

// 查看第一个RFQ的详细信息
if (rfqs.length > 0) {
  console.log('📦 第一个RFQ详情:', rfqs[0]);
  if (rfqs[0].quotes && rfqs[0].quotes.length > 0) {
    console.log('💰 报价详情:', rfqs[0].quotes[0]);
  }
}
```

### 验证供应商过滤

```javascript
const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
const supplierEmail = 'supplier@test.com';

const myRFQs = rfqs.filter(rfq => 
  rfq.targetSuppliers.some(s => s.supplierCode === supplierEmail)
);

console.log(`✅ 供应商 ${supplierEmail} 的RFQ:`, myRFQs.length);
console.table(myRFQs.map(r => ({
  询价单号: r.rfqNumber,
  产品: r.items[0]?.productName,
  是否已报价: r.quotes?.some(q => q.supplierCode === supplierEmail) ? '是' : '否'
})));
```

---

## 🐛 常见问题排查

### 问题1: 看不到RFQ

**检查项**:
1. 确认localStorage中有RFQ数据：
   ```javascript
   console.log(localStorage.getItem('rfqs'));
   ```
2. 确认供应商邮箱与targetSuppliers中的supplierCode一致
3. 检查RFQContext是否正确加载：
   ```javascript
   // 在React DevTools中查看RFQProvider
   ```

### 问题2: 提交报价后没有反应

**检查项**:
1. 打开控制台，查看是否有错误信息
2. 确认表单验证是否通过（所有必填项已填写）
3. 检查localStorage是否更新：
   ```javascript
   const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
   console.log('最新RFQ:', rfqs[rfqs.length - 1]);
   console.log('报价数:', rfqs[rfqs.length - 1].quotes?.length);
   ```

### 问题3: 统计数字不对

**解决方案**:
1. 刷新页面（RFQ Context会重新从localStorage加载）
2. 检查RFQ的status字段是否正确更新
3. 清空缓存重新测试：
   ```javascript
   localStorage.removeItem('rfqs');
   location.reload();
   ```

---

## 🧹 清理测试数据

测试完成后，可以清空测试数据：

```javascript
// 清空所有RFQ
localStorage.removeItem('rfqs');
console.log('✅ RFQ数据已清空');
location.reload();
```

---

## 🎯 下一步测试

当Admin端"下推询价"功能完成后，可以测试完整流程：

1. Admin Portal → 供应链管理 → 采购订单管理
2. 进入"采购需求池"
3. 点击"下推询价"按钮
4. 选择供应商（可多选）
5. 确认发送
6. 切换到Supplier Portal查看
7. 提交报价
8. 切换回Admin Portal查看报价

---

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台的错误信息
2. 查看 `/SUPPLIER_RFQ_COMPLETE.md` 完整文档
3. 使用 `/TEST_RFQ_HELPER.md` 中的调试脚本

---

**预计测试时间**: 5分钟
**难度**: ⭐⭐☆☆☆ (简单)
**状态**: ✅ 就绪
