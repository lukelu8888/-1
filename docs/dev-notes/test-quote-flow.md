# ✅ 报价流程完整测试指南

## 🎯 数据流转路径

```
成本询报（成本询报与供应商协同）
    ↓ 点击"为客户报价"按钮
智能报价弹窗（QuoteCreationIntelligent）
    ↓ 填写报价信息并提交审核
QuotationContext（报价数据存储）
    ↓ 自动保存
报价管理（订单管理中心 > 报价管理）
    ↓ 显示待审批/已审批报价
审批管理（区域主管/销售总监）
    ↓ 审批通过
业务员可发送给客户
```

## 📋 完整测试步骤

### 1️⃣ 创建报价单

**位置**：Admin Dashboard → 成本询报与供应商协同

**操作**：
1. 在"成本询报"标签页中找到一个已有供应商报价的需求单
2. 点击"为客户报价"按钮
3. 进入智能报价创建界面

**填写内容**：
- 报价单号：自动生成（QT-XX-XXXXXX-XXXX）
- 报价日期：自动填充今天日期
- 有效期：30天（可修改）
- 需求单号：自动关联

**产品报价**：
- 查看供应商成本价
- 计算退税金额（鼠标悬停查看公式）
- 设置利润率和利润额
- 系统自动计算给客户的报价

**提交说明**：
- 填写提交给主管的审批说明
- 点击"提交审核"

### 2️⃣ 系统自动判断审批流程

**金额判断**：
- **< $20,000**：一级审批（区域主管）
  ```
  提示：报价总额：$15,800 (< $20,000)
  审批流程：
  1️⃣ 区域业务主管审核
  主管审批通过后，您即可发送给客户。
  ```

- **≥ $20,000**：两级审批（区域主管 → 销售总监）
  ```
  提示：报价总额：$45,600 (≥ $20,000)
  审批流程：
  1️⃣ 区域业务主管审核
  2️⃣ 销售总监审核
  两级审批全部通过后，您才能发送给客户。
  ```

### 3️⃣ 查看报价管理

**位置**：Admin Dashboard → 订单管理中心 → 报价管理

**验证内容**：
- ✅ 报价单已出现在列表中
- ✅ 状态显示为"pending_supervisor"（待区域主管审批）
- ✅ 报价单号正确（QT-XX-XXXXXX-XXXX）
- ✅ 客户信息正确
- ✅ 产品清单正确
- ✅ 总金额正确
- ✅ 可以查看报价单详情（使用文档中心专业模板）

### 4️⃣ 审批流程（可选测试）

**位置**：暂时使用演示页面测试

**访问方式**：
将 `/test-quote-approval.tsx` 作为临时入口

**测试审批**：
1. 切换到"区域主管"角色
2. 查看待审批报价列表
3. 点击"审批"按钮
4. 选择"批准"或"驳回"
5. 填写审批意见
6. 确认提交

**审批结果**：
- 批准（< $20k）→ 状态变为"approved"
- 批准（≥ $20k）→ 状态变为"pending_director"（流转到销售总监）
- 驳回 → 状态变为"rejected"（退回业务员）

## 🔧 技术实现细节

### 数据转换

QuoteCreationIntelligent 输出格式：
```typescript
{
  quoteNo: 'QT-NA-251223-0001',
  quoteDate: '2025-12-23',
  validityDays: 30,
  requirementNo: 'QR-NA-251223-0001',
  status: 'pending_supervisor',
  items: [...],
  totalAmount: 15800,
  approvalFlow: {
    requiresDirectorApproval: false,
    currentStep: 'supervisor',
    steps: ['supervisor']
  },
  approvalHistory: [...]
}
```

转换为 Quotation 格式（QuotationContext）：
```typescript
{
  id: 'quotation-1234567890',
  quotationNumber: 'QT-NA-251223-0001',
  inquiryNumber: 'QR-NA-251223-0001',
  customerName: 'ABC Building Supplies',
  status: 'pending_supervisor',
  products: [...],
  totalAmount: 15800,
  approvalFlow: {...},
  approvalHistory: [...]
}
```

### 涉及文件

```
✅ /components/admin/QuoteCreationIntelligent.tsx
   - 智能报价创建界面
   - 自动判断审批流程
   - 生成审批数据

✅ /components/admin/PurchaseOrderManagementEnhanced.tsx
   - 成本询报主界面
   - 调用报价创建组件
   - 数据转换并保存到Context

✅ /contexts/QuotationContext.tsx
   - 报价数据存储
   - addQuotation方法

✅ /components/admin/QuotationManagement.tsx
   - 报价管理列表
   - 支持审批状态显示
   - Quotation接口已扩展

✅ /components/admin/ViewQuotationDialog.tsx
   - 报价单详情查看
   - 使用文档中心专业模板

✅ /components/documents/templates/QuotationDocument.tsx
   - 大厂级专业报价单模板
```

## 🎉 成功标志

当您完成测试后，应该能够：

1. ✅ 从成本询报创建报价单
2. ✅ 系统自动判断并提示审批流程
3. ✅ 报价单保存到QuotationContext
4. ✅ 在报价管理中查看新创建的报价
5. ✅ 报价单显示审批状态（pending_supervisor）
6. ✅ 点击查看可以看到专业的报价单文档

## 📝 注意事项

1. **数据持久化**：当前使用 localStorage，刷新页面数据仍然保留
2. **审批管理**：审批界面目前在独立演示页面，后续可集成到主Dashboard
3. **权限控制**：业务员只能创建报价，主管/总监才能审批
4. **数据同步**：使用 Context + localStorage，跨组件数据自动同步

---

**最后更新**：2025-12-23
**状态**：✅ 完整实现
