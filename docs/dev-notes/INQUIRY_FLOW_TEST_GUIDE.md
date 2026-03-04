# 🧪 询价单流程测试指南

## 📍 访问测试页面

在浏览器中访问：
```
/#/test-inquiry-flow
```

或者在Console中执行：
```javascript
window.location.hash = '#/test-inquiry-flow'
```

---

## 🎯 测试目的

验证从客户提交询价单到业务员接收的完整数据流程：

```
客户 → 创建询价单 → 提交询价单 → 业务员能看到 ✅
```

---

## 🧪 测试功能

### 1️⃣ 创建询价单
- 模拟客户创建一个询价单
- 包含完整的买家信息和产品清单
- 状态为`draft`，`isSubmitted: false`

### 2️⃣ 提交询价单  
- 将询价单状态从`draft`改为`pending`
- 设置`isSubmitted: true`
- 记录提交时间`submittedAt`

### 3️⃣ 业务员查看
- 使用`getSubmittedInquiries()`获取已提交的询价单
- 验证业务员能否看到刚提交的询价单

### 4️⃣ 区域过滤测试
- 创建北美、南美、欧非3个区域的询价单
- 验证区域过滤是否正常工作

### 5️⃣ 检查当前状态
- 查看localStorage中的所有询价数据
- 统计总数、已提交数、草稿数
- 按区域统计

### 6️⃣ 完整流程测试
- 自动运行上述所有测试
- 显示每个步骤的结果

---

## ✅ 预期结果

### 成功标准：

1. **创建询价单** ✅
   - 询价单成功创建
   - 数据保存到localStorage
   - 返回询价单号（如：`RFQ-NA-251217-1234`）

2. **提交询价单** ✅
   - `isSubmitted`从`false`变为`true`
   - `status`从`draft`变为`pending`
   - `submittedAt`时间戳已记录

3. **业务员查看** ✅
   - `getSubmittedInquiries()`能找到刚提交的询价单
   - 询价单包含完整信息（客户、产品、区域等）

4. **区域过滤** ✅
   - 北美、南美、欧非区域的询价单都能正确创建
   - 按区域统计数量正确

---

## 🔍 检查点

### 数据完整性检查：

```javascript
// 在Console中手动检查
const inquiries = JSON.parse(localStorage.getItem('cosun_inquiries') || '[]');

console.log('总询价数:', inquiries.length);
console.log('已提交数:', inquiries.filter(i => i.isSubmitted).length);
console.log('草稿数:', inquiries.filter(i => !i.isSubmitted).length);

// 查看最近5条
console.log('最近5条询价:', 
  inquiries.slice(-5).map(i => ({
    id: i.id,
    region: i.region,
    customer: i.buyerInfo?.companyName,
    isSubmitted: i.isSubmitted,
    status: i.status
  }))
);
```

### 业务员视角检查：

```javascript
// 模拟业务员查看
const submittedInquiries = inquiries.filter(inq => inq.isSubmitted === true);

console.log('业务员可见询价数:', submittedInquiries.length);
console.log('按区域分布:', {
  'North America': submittedInquiries.filter(i => i.region === 'North America').length,
  'South America': submittedInquiries.filter(i => i.region === 'South America').length,
  'Europe & Africa': submittedInquiries.filter(i => i.region === 'Europe & Africa').length
});
```

---

## 🐛 常见问题排查

### 问题1：业务员看不到询价单

**可能原因：**
- 询价单未提交（`isSubmitted: false`）
- 区域过滤不匹配
- localStorage数据损坏

**排查步骤：**
```javascript
// 1. 检查询价单状态
const inquiries = JSON.parse(localStorage.getItem('cosun_inquiries') || '[]');
console.log('未提交的询价:', inquiries.filter(i => !i.isSubmitted));

// 2. 检查用户区域设置
const currentUser = JSON.parse(localStorage.getItem('cosun_current_user') || '{}');
console.log('当前用户区域:', currentUser.region);

// 3. 检查区域匹配
const targetRegion = 'North America'; // 根据实际情况修改
const matchingInquiries = inquiries.filter(i => 
  i.isSubmitted && i.region === targetRegion
);
console.log('匹配的询价:', matchingInquiries);
```

### 问题2：询价单号格式错误

**正确格式：**
- `RFQ-{REGION}-{YYMMDD}-{RANDOM}`
- 例如：`RFQ-NA-251217-1234`

**区域代码：**
- `NA` = North America（北美）
- `SA` = South America（南美）
- `EA` = Europe & Africa（欧非）

**检查方法：**
```javascript
const inquiries = JSON.parse(localStorage.getItem('cosun_inquiries') || '[]');
inquiries.forEach(inq => {
  const parts = inq.id.split('-');
  console.log({
    id: inq.id,
    parts: parts,
    isValid: parts.length >= 4, // 新格式至少4个部分
    region: inq.region
  });
});
```

### 问题3：区域过滤失效

**原因：**
区域名称不匹配（如`EMEA` vs `Europe & Africa`）

**修复方法：**
```javascript
// 在AdminInquiryManagement.tsx中已有区域映射函数
const regionCodeToFullName = (code) => {
  const mapping = {
    'NA': 'North America',
    'SA': 'South America',
    'EA': 'Europe & Africa',
    'EMEA': 'Europe & Africa'  // 兼容旧数据
  };
  return mapping[code] || code;
};
```

---

## 📊 测试数据示例

### 成功的询价单数据：

```json
{
  "id": "RFQ-NA-251217-1234",
  "date": "2025-12-17",
  "userEmail": "customer@homedepot.com",
  "companyId": "company_homedepot_001",
  "products": [
    {
      "id": "1",
      "name": "LED Light Bulb 60W",
      "quantity": 1000,
      "price": 5.99,
      "totalPrice": 5990
    }
  ],
  "status": "pending",
  "isSubmitted": true,
  "totalPrice": 5990,
  "region": "North America",
  "buyerInfo": {
    "companyName": "Home Depot Inc.",
    "contactPerson": "John Smith",
    "email": "customer@homedepot.com",
    "phone": "+1-800-466-3337",
    "address": "2455 Paces Ferry Rd NW, Atlanta, GA 30339",
    "businessType": "Retailer"
  },
  "shippingInfo": {
    "cartons": "50",
    "cbm": "10",
    "totalGrossWeight": "500",
    "totalNetWeight": "450"
  },
  "message": "Urgent order for Home Depot store chain",
  "createdAt": 1702819200000,
  "submittedAt": 1702819200000
}
```

---

## 🚀 下一步

测试通过后，确认：

1. ✅ 客户可以创建询价单
2. ✅ 客户可以提交询价单
3. ✅ 业务员可以看到已提交的询价单
4. ✅ 区域过滤正常工作
5. ✅ 数据持久化到localStorage

然后可以继续实现：

- 业务员向采购员发起"报价请求"（已完成）
- 采购员向采购询价（待实现）
- 供应商报价（待实现）
- 业务员给客户报价（待实现）

---

## 🆘 需要帮助？

如果测试失败，请：

1. 打开浏览器Console（F12）
2. 查看错误信息
3. 运行上述排查脚本
4. 检查localStorage数据完整性
5. 截图测试结果页面

提供给开发人员进行调试。
