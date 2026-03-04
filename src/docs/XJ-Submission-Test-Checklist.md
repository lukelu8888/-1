# 询价单提交流转测试清单

## ✅ 测试目的
验证XJ开头的询价单从Admin端"询价管理"模块成功流转到Supplier端"客户需求池"模块。

## 📋 测试前准备

### 1. 数据环境准备
```javascript
// 清空测试环境（可选）
localStorage.removeItem('rfqs');
localStorage.removeItem('supplierRFQs');
localStorage.removeItem('supplierQuotations');

// 刷新页面
location.reload();
```

### 2. 账号准备
- **Admin账号**: 采购员角色（如：刘明）
- **Supplier账号**: 供应商账号（如：supplier1@example.com - 东莞市华星电器有限公司）

---

## 🔬 测试步骤

### Phase 1: Admin端创建询价单（草稿）

#### 步骤 1.1: 创建采购需求
1. 登录Admin Portal
2. 进入【采购订单管理】→【采购需求池】Tab
3. 点击"新建需求"创建QR需求单
4. 填写客户信息和产品信息
5. 在"业务部说明"中填写：`客户要求3个月内收到新款产品`
6. 保存需求单

**预期结果**: 
- ✓ 生成QR-YYMMDD-XXXX编号
- ✓ 状态为"待处理"

#### 步骤 1.2: 创建询价单
1. 在需求单行点击"创建询价"
2. 选择供应商（如：东莞市华星电器有限公司）
3. 设置报价截止日期
4. 勾选需要询价的产品
5. 填写"采购部说明"（可选）
6. 点击"提交"按钮

**预期结果**:
- ✓ 生成XJ-YYMMDD-XXXX编号
- ✓ 显示toast提示"✅ 询价单创建成功"
- ✓ 提示"👉 请前往【询价管理】Tab查看并提交给供应商"
- ✓ 自动跳转到"询价管理"Tab

### Phase 2: Admin端提交询价单

#### 步骤 2.1: 查看草稿询价单
1. 在【询价管理】Tab中
2. 查看询价单列表

**预期结果**:
- ✓ 看到刚创建的XJ询价单
- ✓ 状态显示"草稿"（灰色背景）
- ✓ 显示"查看"、"编辑"、"提交"三个按钮

#### 步骤 2.2: 预览询价单
1. 点击"查看"按钮
2. 查看询价单文档内容

**预期结果**:
- ✓ 显示完整的询价单PDF格式文档
- ✓ 包含供应商信息、产品清单
- ✓ 显示询价说明（业务部说明+采购部说明）

#### 步骤 2.3: 提交询价单
1. 关闭预览窗口
2. 点击"提交"按钮

**预期结果**:
- ✓ 显示toast提示"✅ 询价单已提交"
- ✓ 显示询价单号和供应商名称
- ✓ 提示"✓ 供应商将在Portal【客户需求池】中收到询价通知"
- ✓ 询价单状态变为"已发送"（蓝色背景）
- ✓ "编辑"和"提交"按钮消失，只保留"查看"按钮

#### 步骤 2.4: 验证防重复提交
1. 尝试再次提交同一询价单（如果按钮已消失则跳过）

**预期结果**:
- ✓ 按钮已不可见或显示错误提示"⚠️ 询价单已提交"

### Phase 3: Supplier端查看询价单

#### 步骤 3.1: 登录供应商Portal
1. 退出Admin账号
2. 登录Supplier账号（supplier1@example.com）
3. 进入【订单管理中心】

**预期结果**:
- ✓ 成功登录供应商Portal
- ✓ 看到订单管理中心首页

#### 步骤 3.2: 查看统计数据
1. 在首页查看"客户需求"统计卡片

**预期结果**:
- ✓ "客户需求"数量 ≥ 1
- ✓ 显示"XJ · X"（X为待报价数量）

#### 步骤 3.3: 进入客户需求池
1. 点击【客户需求】Tab

**预期结果**:
- ✓ 看到询价单列表
- ✓ 列表中包含刚提交的XJ询价单
- ✓ 显示询价单号（XJ-YYMMDD-XXXX）
- ✓ 显示产品信息
- ✓ 显示截止日期
- ✓ 状态显示"待报价"

#### 步骤 3.4: 查看询价单详情
1. 点击询价单号或"查看"按钮

**预期结果**:
- ✓ 打开询价单文档查看器
- ✓ 显示完整的XJ询价单文档
- ✓ 询价说明中只显示"客户要求3个月内收到新款产品"
- ✓ 不显示业务部说明和采购部说明

#### 步骤 3.5: 创建报价单
1. 关闭文档查看器
2. 点击"报价"按钮
3. 填写报价信息（单价、交货期等）
4. 点击"保存"或"提交"

**预期结果**:
- ✓ 成功创建BJ报价单
- ✓ 报价单关联到XJ询价单
- ✓ XJ询价单状态变为"已报价"
- ✓ 从"客户需求池"移动到"已报价"Tab

---

## 🔍 验证检查点

### 数据完整性检查

#### 检查 localStorage 数据
```javascript
// 1. 检查Admin端XJ询价数据
const adminRFQs = JSON.parse(localStorage.getItem('rfqs') || '[]');
console.log('Admin RFQs:', adminRFQs);
// 应该看到status为'sent'的XJ询价单

// 2. 检查Supplier端XJ询价数据
const supplierRFQs = JSON.parse(localStorage.getItem('supplierRFQs') || '[]');
console.log('Procurement Inquiry XJs:', supplierRFQs);
// 应该看到推送给供应商的XJ询价数据

// 3. 验证数据一致性
const adminRFQ = adminRFQs.find(r => r.status === 'sent');
const supplierRFQ = supplierRFQs.find(r => r.id === adminRFQ?.id);
console.log('数据一致性:', adminRFQ?.id === supplierRFQ?.id);
// 应该返回 true
```

### 字段映射检查

| Admin端字段 | Supplier端字段 | 验证方法 |
|------------|---------------|---------|
| `rfq.id` | `supplierRFQ.id` | 两者应相同 |
| `rfq.supplierXjNo` | `supplierRFQ.xjNumber` | XJ-YYMMDD-XXXX格式 |
| `rfq.requirementNo` | `supplierRFQ.sourceQRNumber` | QR-YYMMDD-XXXX格式 |
| `rfq.supplierEmail` | `supplierRFQ.supplierEmail` | 应匹配登录邮箱 |
| `rfq.products` | `supplierRFQ.products` | 产品数组应相同 |
| `rfq.documentData` | `supplierRFQ.documentData` | 文档数据应相同 |

### 状态转换检查

```
创建时: status = 'draft'      → Admin端显示"草稿"
提交后: status = 'sent'       → Admin端显示"已发送"
推送后: status = 'pending'    → Supplier端显示"待报价"
报价后: status = 'quoted'     → Supplier端显示"已报价"
```

---

## 🐛 常见问题排查

### 问题1: 供应商看不到询价单

**排查步骤**:
1. 检查供应商邮箱是否正确
   ```javascript
   // Admin端创建时的supplierEmail
   console.log(rfq.supplierEmail);
   
   // Supplier端登录邮箱
   console.log(user.email);
   
   // 两者必须完全一致
   ```

2. 检查supplierRFQs存储
   ```javascript
   const data = JSON.parse(localStorage.getItem('supplierRFQs') || '[]');
   console.log('供应商XJ询价数量:', data.length);
   console.log('供应商邮箱列表:', data.map(r => r.supplierEmail));
   ```

3. 刷新页面或重新登录

### 问题2: 重复提交导致数据重复

**解决方案**: 
- 已添加防重复检查逻辑
- 提交时会检查supplierRFQs中是否已存在相同ID

### 问题3: 询价说明显示不正确

**排查步骤**:
1. 检查documentData中的inquiryDescription
   ```javascript
   console.log(rfq.documentData?.inquiryDescription);
   ```

2. 确认提取逻辑是否正确匹配【特殊要求】部分

### 问题4: 控制台错误

**检查项**:
- 是否有getRFQsBySupplier相关错误
- 是否有localStorage权限错误
- 是否有Context未初始化错误

---

## ✨ 测试通过标准

完整流程测试通过需满足以下所有条件：

- [x] Admin端成功创建XJ询价单（草稿状态）
- [x] Admin端成功提交询价单（状态变为已发送）
- [x] 防重复提交机制生效
- [x] Supplier端客户需求池中显示询价单
- [x] 询价单号、产品信息完整显示
- [x] 询价说明只显示客户要求部分
- [x] Supplier端可以正常创建报价单
- [x] 数据在localStorage中正确存储
- [x] 无控制台错误
- [x] 无数据丢失或重复

---

## 📊 测试记录模板

```markdown
测试日期: ____________
测试人员: ____________
测试环境: [开发/测试/生产]

### 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| Admin创建询价单 | ☑️通过 / ☐失败 |  |
| Admin提交询价单 | ☑️通过 / ☐失败 |  |
| Supplier查看询价单 | ☑️通过 / ☐失败 |  |
| Supplier创建报价单 | ☑️通过 / ☐失败 |  |
| 数据完整性 | ☑️通过 / ☐失败 |  |

### 发现的问题

1. 
2. 
3. 

### 改进建议

1. 
2. 
3. 
```

---

**版本**: 1.0  
**最后更新**: 2025-12-21  
**维护人**: QA团队
