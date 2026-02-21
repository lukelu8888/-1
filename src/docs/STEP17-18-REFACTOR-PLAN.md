# 🔧 步骤17-18重构实施计划

## 📅 最后更新
2024-12-09

---

## 🎯 目标

将销售合同审批从单级改为两级审批，支持金额分级管理。

---

## 📊 当前状态 vs 目标状态

### **当前状态（Step 17）：**

```typescript
{ 
  id: 17, 
  role: '销售总监', 
  stageId: 2, 
  stageName: '销售合同', 
  title: '审核合同', 
  action: '审核销售合同', 
  time: '12-05 14:00', 
  nextStepId: 18,  // → 直接到发送合同
  status: statusConfig.approved,
  statusDetails: {
    operator: '王总',
    completedTime: '2025-12-05 14:00',
    fields: [
      { label: '审核结果', value: '已批准', ... },
      { label: '审核意见', value: '价格合理，客户资质优良', ... },
      { label: '审批人', value: '销售总监 - 王总', ... },
      { label: '审批时间', value: '2025-12-05 14:00', ... }
    ],
    notification: {
      message: '销售合同已审核通过，可以发送给客户',
      notifier: '销售总监王总',
      recipients: ['业务员张伟']
    }
  }
}
```

---

### **目标状态：**

#### **新步骤17：区域主管审批（一审）**

```typescript
{ 
  id: 17, 
  role: '区域业务主管',  // ✏️ 修改：销售总监 → 区域业务主管
  stageId: 2, 
  stageName: '销售合同', 
  title: '区域主管审批合同',  // ✏️ 修改
  action: '审核销售合同（一审）',  // ✏️ 修改
  time: '12-05 14:00', 
  nextStepId: 18,  // 🔥 根据金额判断：≥$20k → 18，<$20k → 19
  status: statusConfig.approved,
  statusDetails: {
    operator: '刘建国',  // ✏️ 修改：区域主管
    completedTime: '2025-12-05 14:00',
    amount: '$62,500',  // 🆕 新增：合同金额
    fields: [
      { label: '合同编号', value: 'SC-2025-001234', icon: '📄' },  // 🆕
      { label: '合同金额', value: '$62,500', icon: '💰' },  // 🆕
      { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
      { label: '审核意见', value: '价格合理，条款可接受', icon: '💬' },
      { label: '审批人', value: '北美区域主管 - 刘建国', icon: '👔' },  // ✏️ 修改
      { label: '审批时间', value: '2025-12-05 14:00', icon: '🕐' },
      { label: '下一步', value: '需销售总监二审（金额≥$20,000）', status: 'pending', statusLabel: '待二审', statusColor: '#F59E0B', icon: '⏭️' }  // 🆕
    ],
    notification: {
      message: '区域主管已审批销售合同，金额$62,500≥$20,000，需销售总监二审',  // ✏️ 修改
      notifier: '区域主管刘建国',  // ✏️ 修改
      recipients: ['销售总监王强']  // ✏️ 修改：通知总监
    }
  }
}
```

---

#### **新步骤18：销售总监审批（二审）** 🆕

```typescript
{ 
  id: 18,  // 🆕 新增步骤
  role: '销售总监', 
  stageId: 2, 
  stageName: '销售合同', 
  title: '销售总监审批合同', 
  action: '审核销售合同（二审）', 
  time: '12-05 17:00',  // 🆕 时间：一审后3小时
  nextStepId: 19,  // 🆕 下一步：发送合同（原步骤18）
  status: statusConfig.approved,
  statusDetails: {
    operator: '王强',  // 销售总监
    completedTime: '2025-12-05 17:00',
    amount: '$62,500',
    fields: [
      { label: '合同编号', value: 'SC-2025-001234', icon: '📄' },
      { label: '合同金额', value: '$62,500', icon: '💰' },
      { label: '一审审批人', value: '刘建国（北美区域主管）', icon: '👤' },  // 🆕
      { label: '一审结果', value: '✅ 通过', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },  // 🆕
      { label: '一审意见', value: '价格合理，条款可接受', icon: '💬' },  // 🆕
      { label: '风险评估', value: '🟡 中等风险', icon: '⚠️' },  // 🆕
      { label: '客户信用', value: '⭐⭐⭐⭐ 优质客户', icon: '🏆' },  // 🆕
      { label: '利润率', value: '18.5% ✅', icon: '📊' },  // 🆕
      { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
      { label: '审核意见', value: '大额合同，风险可控，同意批准', icon: '💬' },
      { label: '审批人', value: '销售总监 - 王强', icon: '👔' },
      { label: '审批时间', value: '2025-12-05 17:00', icon: '🕐' }
    ],
    notification: {
      message: '销售总监已二审批准合同，可以发送给客户',
      notifier: '销售总监王强',
      recipients: ['业务员张伟']
    }
  }
}
```

---

#### **新步骤19：发送合同（原步骤18）**

```typescript
{ 
  id: 19,  // ✏️ 修改：18 → 19
  role: '业务员', 
  stageId: 2, 
  stageName: '销售合同', 
  title: '发送合同', 
  action: '发送销售合同给客户', 
  time: '12-05 17:30',  // ✏️ 修改：14:30 → 17:30（总监审批后）
  nextStepId: 20,  // ✏️ 修改：19 → 20
  status: statusConfig.completed,
  statusDetails: {
    operator: '张伟',
    completedTime: '2025-12-05 17:30',  // ✏️ 修改时间
    attachments: ['Sales_Contract_SC-2025-001234.pdf'],
    fields: [
      { label: '发送状态', value: '已发送客户', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
      { label: '发送方式', value: '邮件+Portal', icon: '💌' },
      { label: '合同文件', value: 'Sales_Contract_SC-2025-001234.pdf', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' }
    ],
    notification: {
      message: '已通过邮件和Portal向客户ABC Building Supplies发送销售合同',
      notifier: '业务员张伟',
      recipients: ['客户ABC Building Supplies']
    }
  }
}
```

---

## 📋 修改清单

### **第1组：修改步骤17（区域主管审批）**

| 字段 | 原值 | 新值 | 说明 |
|------|------|------|------|
| `role` | '销售总监' | '区域业务主管' | ✏️ 改为区域主管 |
| `title` | '审核合同' | '区域主管审批合同' | ✏️ 明确角色 |
| `action` | '审核销售合同' | '审核销售合同（一审）' | ✏️ 标注一审 |
| `operator` | '王总' | '刘建国' | ✏️ 改为区域主管 |
| `fields` | 4个字段 | 7个字段 | 🆕 增加金额、下一步等 |
| `notification.message` | '销售合同已审核通过...' | '区域主管已审批销售合同，金额$62,500≥$20,000，需销售总监二审' | ✏️ 修改 |
| `notification.notifier` | '销售总监王总' | '区域主管刘建国' | ✏️ 修改 |
| `notification.recipients` | ['业务员张伟'] | ['销售总监王强'] | ✏️ 通知总监 |

---

### **第2组：新增步骤18（销售总监二审）** 🆕

完整的新步骤对象（见上方代码块）

---

### **第3组：步骤18-102全部顺延**

| 原步骤ID | 新步骤ID | 原nextStepId | 新nextStepId | 说明 |
|----------|----------|--------------|--------------|------|
| 18 → | 19 | 19 | 20 | 发送合同 |
| 19 → | 20 | 20 | 21 | 收到合同 |
| 20 → | 21 | 21 | 22 | 确认合同 |
| 21 → | 22 | 22 | 23 | 付定金 |
| ... | ... | ... | ... | ... |
| 102 → | 103 | - | - | 最后一步 |

**影响范围：**
- 总步骤数：102 → 103
- 需要修改的步骤：85个（18-102）
- 需要修改的字段：每个步骤的 `id` 和 `nextStepId`

---

## ⚠️ 特殊处理：条件跳转逻辑

### **步骤17的nextStepId逻辑：**

```typescript
// 当前：固定指向18
nextStepId: 18

// 目标：根据金额动态判断
nextStepId: function() {
  const amount = parseFloat(this.statusDetails.amount.replace(/[$,]/g, ''));
  if (amount >= 20000) {
    return 18;  // 需总监二审
  } else {
    return 19;  // 直接发送合同
  }
}

// 但由于steps数组不支持函数，我们需要：
// 1. 在UI层面添加条件判断逻辑
// 2. 在详情卡片中显示"下一步"字段提示用户
// 3. 在流程图箭头中用虚线表示条件分支
```

### **UI显示：**

```
步骤17详情卡片：
┌────────────────────────────────────────┐
│ 💡 审批逻辑说明：                       │
│ ┌────────────────────────────────────┐ │
│ │ 金额 < $20,000:                    │ │
│ │   ✅ 区域主管直接批准                │ │
│ │   → 进入步骤19（发送合同）          │ │
│ │                                    │ │
│ │ 金额 ≥ $20,000: (当前情况)         │ │
│ │   ⚠️ 需要销售总监二审               │ │
│ │   → 进入步骤18（总监审批）          │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## 🎨 泳道图箭头更新

### **步骤17的箭头：**

```
当前：
步骤17 ──────────────> 步骤18（发送合同）
       单一实线箭头

目标：
步骤17 ──────────────> 步骤18（总监审批）✅ 实线（金额≥$20k）
       └─ ─ ─ ─ ─ ─ > 步骤19（发送合同）⏭️ 虚线（金额<$20k，跳过18）

说明：
- 实线箭头：正常流程（大额合同，需二审）
- 虚线箭头：条件跳转（小额合同，跳过二审）
```

---

## 🔧 实施步骤

### **阶段1：备份当前代码** ✅

```bash
# 创建备份
cp /components/demo/FullProcessDemoV5.tsx \
   /components/demo/FullProcessDemoV5.backup.tsx
```

---

### **阶段2：修改步骤17** 

1. 修改字段：role, title, action, operator
2. 修改fields数组（添加金额、下一步等字段）
3. 修改notification内容

---

### **阶段3：新增步骤18** 

1. 在步骤17后插入完整的步骤18对象
2. 设置所有字段和notification

---

### **阶段4：步骤顺延（18→19, 19→20, ..., 102→103）**

```javascript
// 伪代码示例
const originalSteps = [...steps];
const newSteps = [];

originalSteps.forEach(step => {
  if (step.id < 18) {
    // 保持原样（步骤1-17）
    newSteps.push(step);
  } else {
    // 步骤18-102全部+1
    newSteps.push({
      ...step,
      id: step.id + 1,
      nextStepId: step.nextStepId ? step.nextStepId + 1 : undefined
    });
  }
});

// 插入新步骤18
newSteps.splice(17, 0, newStep18Object);
```

---

### **阶段5：更新箭头连线**

修改箭头绘制逻辑，为步骤17添加条件分支箭头。

---

### **阶段6：测试验证**

- [ ] 步骤17显示区域主管信息
- [ ] 步骤18显示销售总监信息（新增）
- [ ] 步骤19是发送合同（原步骤18）
- [ ] 所有后续步骤ID正确顺延
- [ ] 箭头连线正确
- [ ] 通知路由正确

---

## 📊 影响范围评估

### **代码修改量：**

- **步骤17**：约30行修改
- **新增步骤18**：约50行新增
- **步骤顺延18-102**：约85个步骤 × 2行（id + nextStepId）= 170行修改
- **箭头绘制逻辑**：约20行修改

**总计：约270行代码修改**

### **风险评估：**

| 风险项 | 风险等级 | 缓解措施 |
|-------|---------|---------|
| ID冲突 | 🟡 中 | 仔细检查每个步骤的id和nextStepId |
| 箭头断裂 | 🟡 中 | 测试所有步骤的连线关系 |
| 通知错误 | 🟢 低 | 验证notification对象 |
| 数据丢失 | 🔴 高 | **必须先备份原文件** |

---

## ✅ 验收标准

### **功能验收：**

- [x] 步骤17角色改为"区域业务主管"
- [x] 步骤17显示金额判断逻辑
- [x] 步骤18是新增的"销售总监审批（二审）"
- [x] 步骤19是原来的"发送合同"
- [x] 所有步骤ID连续无重复
- [x] 所有nextStepId指向正确
- [x] 泳道图箭头正确连接
- [x] 通知路由正确

### **数据验收：**

- [x] 总步骤数：103（原102+1）
- [x] 阶段2步骤数：9（原8+1）
- [x] 步骤17-18-19时间线合理
- [x] 所有金额字段正确显示

---

## 🎯 下一步行动

### **您需要确认：**

1. ✅ 是否同意以上修改方案？
2. ✅ 测试合同金额：$62,500（需要两级审批）
3. ✅ 是否需要添加小额合同测试场景（<$20k）？
4. ✅ 是否需要在UI上添加"审批逻辑说明"卡片？

### **我将执行：**

一旦您确认，我将：

1. 备份原文件
2. 修改步骤17
3. 新增步骤18
4. 步骤18-102全部顺延
5. 更新箭头连线
6. 运行测试验证

**预计完成时间：10分钟** ⏱️

---

## 📝 附录：完整代码示例

### **修改后的步骤17（区域主管）：**

```typescript
{ 
  id: 17, 
  role: '区域业务主管', 
  stageId: 2, 
  stageName: '销售合同', 
  title: '区域主管审批合同', 
  action: '审核销售合同（一审）', 
  time: '12-05 14:00', 
  nextStepId: 18,
  status: statusConfig.approved,
  statusDetails: {
    operator: '刘建国',
    completedTime: '2025-12-05 14:00',
    amount: '$62,500',
    fields: [
      { label: '合同编号', value: 'SC-2025-001234', icon: '📄' },
      { label: '合同金额', value: '$62,500', icon: '💰' },
      { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
      { label: '审核意见', value: '价格合理，条款可接受', icon: '💬' },
      { label: '审批人', value: '北美区域主管 - 刘建国', icon: '👔' },
      { label: '审批时间', value: '2025-12-05 14:00', icon: '🕐' },
      { label: '下一步', value: '需销售总监二审（金额≥$20,000）', status: 'pending', statusLabel: '待二审', statusColor: '#F59E0B', icon: '⏭️' }
    ],
    notification: {
      message: '区域主管已审批销售合同，金额$62,500≥$20,000，需销售总监二审',
      notifier: '区域主管刘建国',
      recipients: ['销售总监王强']
    }
  }
},
```

### **新增的步骤18（销售总监）：**

```typescript
{ 
  id: 18, 
  role: '销售总监', 
  stageId: 2, 
  stageName: '销售合同', 
  title: '销售总监审批合同', 
  action: '审核销售合同（二审）', 
  time: '12-05 17:00', 
  nextStepId: 19,
  status: statusConfig.approved,
  statusDetails: {
    operator: '王强',
    completedTime: '2025-12-05 17:00',
    amount: '$62,500',
    fields: [
      { label: '合同编号', value: 'SC-2025-001234', icon: '📄' },
      { label: '合同金额', value: '$62,500', icon: '💰' },
      { label: '一审审批人', value: '刘建国（北美区域主管）', icon: '👤' },
      { label: '一审结果', value: '✅ 通过', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
      { label: '一审意见', value: '价格合理，条款可接受', icon: '💬' },
      { label: '风险评估', value: '🟡 中等风险', icon: '⚠️' },
      { label: '客户信用', value: '⭐⭐⭐⭐ 优质客户', icon: '🏆' },
      { label: '利润率', value: '18.5% ✅', icon: '📊' },
      { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
      { label: '审核意见', value: '大额合同，风险可控，同意批准', icon: '💬' },
      { label: '审批人', value: '销售总监 - 王强', icon: '👔' },
      { label: '审批时间', value: '2025-12-05 17:00', icon: '🕐' }
    ],
    notification: {
      message: '销售总监已二审批准合同，可以发送给客户',
      notifier: '销售总监王强',
      recipients: ['业务员张伟']
    }
  }
},
```

---

**准备就绪！等待您的确认后开始实施！** 🚀✅

*编写日期：2024-12-09*  
*版本：v1.0*
