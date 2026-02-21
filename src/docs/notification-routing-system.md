# 🤖 智能通知路由系统设计文档

## 📋 业务需求

### 核心问题：
- ❓ 北美客户询价 → 应该通知谁？
- ❓ 南美客户询价 → 应该通知谁？
- ❓ 一个区域有多个业务员，如何分配？

---

## 🎯 解决方案：三层智能路由机制

### **第1层：区域匹配（Region Matching）**
根据客户所在区域，自动匹配同区域的业务人员。

```typescript
// 当前系统支持的区域：
- 北美区 (north_america)
- 南美区 (south_america)
- 欧非区 (europe_africa)
- 中国区 (china)

// 人员区域配置：
北美区客户: ABC Building Supplies (北美区)
  ↓ 自动匹配
北美区业务员: 张伟 (北美区)
北美区业务主管: 刘建国 (北美区)
```

### **第2层：负载均衡（Load Balancing）**
当一个区域有多个业务员时，通过智能分配算法分配客户。

#### **方案A：轮询分配（Round Robin）**
```typescript
// 北美区有3个业务员：张伟、王芳、李强
// 新询价单依次分配：
询价单1 → 张伟
询价单2 → 王芳
询价单3 → 李强
询价单4 → 张伟（循环）
```

#### **方案B：负载最小优先（Least Load First）**
```typescript
// 根据当前处理中的询价单数量分配：
张伟: 5个询价单
王芳: 3个询价单 ← 分配给她
李强: 7个询价单
```

#### **方案C：手动分配 + 公海池（推荐）**
```typescript
// 采用您现有的业务流程：
1. 客户询价 → 进入公海客户池
2. 运营专员初筛 → 标记优先级/区域
3. 同区域业务员背调认领 → 主动认领（避免强制分配导致质量问题）
4. 业务员精准开发 → 成交

// 这种方式最符合您的"社媒触达→运营专员筛选→公海客户池→业务员背调认领"流程
```

### **第3层：升级机制（Escalation）**
当业务员未及时响应时，自动通知上级。

```typescript
// 升级时间线：
客户询价 → 业务员（立即）
  ↓ 2小时未响应
  → 区域业务主管（提醒）
    ↓ 4小时未响应
    → 销售总监（警告）
      ↓ 8小时未响应
      → 老板（严重警告）
```

---

## 🔧 当前系统实现状态

### ✅ 已实现功能：

#### 1. **区域人员配置（完整）**
```typescript
// /lib/notification-rules.ts
personnelList: [
  // 北美区
  { name: 'ABC Building Supplies', region: 'north_america', role: '客户' },
  { name: '张伟', region: 'north_america', role: '业务员' },
  { name: '刘建国', region: 'north_america', role: '区域业务主管' },
  
  // 南美区
  { name: 'Brasil Construction Co.', region: 'south_america', role: '客户' },
  { name: '李芳', region: 'south_america', role: '业务员' },
  { name: '陈明华', region: 'south_america', role: '区域业务主管' },
  
  // 欧非区
  { name: 'Europa Trading GmbH', region: 'europe_africa', role: '客户' },
  { name: '王芳', region: 'europe_africa', role: '业务员' },
  { name: '赵国强', region: 'europe_africa', role: '区域业务主管' },
]
```

#### 2. **智能推荐算法（已实现）**
```typescript
// 函数: getRecommendedRecipients(notifierName)
// 规则1: 客户询价 → 推荐同区域业务员 + 业务主管 + 销售总监
// 规则2: 业务员提交 → 推荐同区域业务主管 + 销售总监
// 规则3: 业务主管审批 → 推荐销售总监 + 同区域业务员
```

#### 3. **泳道图步骤1特殊处理（已实现）**
```typescript
// 在FullProcessDemoV5.tsx中
if (pinnedStep.id === 1) {
  // 步骤1：客户询价，自动进行区域匹配
  const firstNotifier = personnelList.find(p => 
    (p.displayName || p.name) === currentNotifiers[0]
  );
  const notifierRegion = firstNotifier?.region;
  
  // 只显示同区域的业务员
  filteredPersons = personnelList
    .filter(p => p.role === '业务员' && p.region === notifierRegion)
    .map(p => p.displayName || p.name);
}
```

---

## 🚀 推荐实施方案：增强版智能路由

### **阶段1：完善区域匹配（立即实施）**

#### 步骤1：扩展人员列表（支持多业务员）
```typescript
// 修改 /lib/notification-rules.ts
export const personnelList: Personnel[] = [
  // === 北美区团队 ===
  { name: 'ABC Building Supplies', region: 'north_america', role: '客户', displayName: 'ABC Building Supplies (北美区)' },
  { name: '张伟', region: 'north_america', role: '业务员', displayName: '张伟 (北美区)', workload: 5 },
  { name: '王强', region: 'north_america', role: '业务员', displayName: '王强 (北美区)', workload: 3 },
  { name: '李明', region: 'north_america', role: '业务员', displayName: '李明 (北美区)', workload: 7 },
  { name: '刘建国', region: 'north_america', role: '区域业务主管', displayName: '刘建国 (北美区)' },
  
  // === 南美区团队 ===
  { name: 'Brasil Construction Co.', region: 'south_america', role: '客户', displayName: 'Brasil Construction Co. (南美区)' },
  { name: '李芳', region: 'south_america', role: '业务员', displayName: '李芳 (南美区)', workload: 4 },
  { name: '陈磊', region: 'south_america', role: '业务员', displayName: '陈磊 (南美区)', workload: 6 },
  { name: '陈明华', region: 'south_america', role: '区域业务主管', displayName: '陈明华 (南美区)' },
  
  // === 欧非区团队 ===
  { name: 'Europa Trading GmbH', region: 'europe_africa', role: '客户', displayName: 'Europa Trading GmbH (欧非区)' },
  { name: '王芳', region: 'europe_africa', role: '业务员', displayName: '王芳 (欧非区)', workload: 2 },
  { name: '赵勇', region: 'europe_africa', role: '业务员', displayName: '赵勇 (欧非区)', workload: 5 },
  { name: '孙丽', region: 'europe_africa', role: '业务员', displayName: '孙丽 (欧非区)', workload: 8 },
  { name: '赵国强', region: 'europe_africa', role: '区域业务主管', displayName: '赵国强 (欧非区)' },
  
  // ... 其他角色保持不变
];
```

#### 步骤2：增强智能推荐算法
```typescript
// 新增：根据负载均衡推荐业务员
export function getRecommendedSalesRep(customerRegion: Region, mode: 'round_robin' | 'least_load' | 'manual' = 'manual'): string[] {
  const regionalSalesReps = personnelList.filter(p => 
    p.role === '业务员' && p.region === customerRegion
  );
  
  if (mode === 'manual') {
    // 方案C：显示所有同区域业务员，让运营专员或客户自己选择
    return regionalSalesReps.map(p => p.displayName || p.name);
  }
  
  if (mode === 'least_load') {
    // 方案B：推荐负载最低的业务员
    const sorted = regionalSalesReps.sort((a, b) => (a.workload || 0) - (b.workload || 0));
    return [sorted[0].displayName || sorted[0].name];
  }
  
  if (mode === 'round_robin') {
    // 方案A：轮询分配（需要维护一个计数器）
    // 实现略...
  }
  
  return regionalSalesReps.map(p => p.displayName || p.name);
}
```

#### 步骤3：在泳道图中应用智能路由
```typescript
// 在步骤1（客户询价）中
if (pinnedStep.id === 1) {
  // 获取客户的区域信息
  const customer = personnelList.find(p => 
    (p.displayName || p.name) === pinnedStep.statusDetails.notification.notifier
  );
  
  if (customer?.region) {
    // 🔥 智能推荐：显示所有同区域业务员
    const recommendations = getRecommendedSalesRep(customer.region, 'manual');
    
    // 自动填充推荐的被通知人
    updateStep(pinnedStep.id, {
      statusDetails: {
        ...pinnedStep.statusDetails,
        notification: {
          ...pinnedStep.statusDetails?.notification!,
          recipients: recommendations,
          isRecommended: true,
        },
      },
    });
  }
}
```

---

## 📊 实际应用场景演示

### **场景1：北美客户ABC询价**
```
触发人: ABC Building Supplies (北美区)
   ↓ 系统自动匹配区域
被通知人（智能推荐3选1）:
   ✓ 张伟 (北美区) - 当前5个询价单
   ✓ 王强 (北美区) - 当前3个询价单 ← 负载最低
   ✓ 李明 (北美区) - 当前7个询价单
抄送: 刘建国 (北美区主管)、王强 (销售总监)
```

### **场景2：南美客户Brasil询价**
```
触发人: Brasil Construction Co. (南美区)
   ↓ 系统自动匹配区域
被通知人（智能推荐2选1）:
   ✓ 李芳 (南美区) - 当前4个询价单 ← 负载最低
   ✓ 陈磊 (南美区) - 当前6个询价单
抄送: 陈明华 (南美区主管)、王强 (销售总监)
```

### **场景3：跨区域升级**
```
触发人: 张伟 (北美区业务员)
   ↓ 需要上级审批
被通知人:
   ✓ 刘建国 (北美区主管) ← 一级审批
   ✓ 王强 (销售总监) ← 二级审批
```

---

## 🎨 UI改进建议

### **被通知人选择界面优化**

#### 当前：
```
[ 选择被通知人 ▼ ]
→ 显示所有18个角色的所有人员（混乱）
```

#### 优化后：
```
[ 选择被通知人 ▼ ]
→ 智能分组显示：
  
  🌍 推荐（同区域）────────
  ✅ 张伟 (北美区) - 5个询价单
  ✅ 王强 (北美区) - 3个询价单 ⭐推荐
  ✅ 李明 (北美区) - 7个询价单
  
  👔 管理层─────────────
  ✅ 刘建国 (北美区主管)
  ✅ 王强 (销售总监)
  
  🔍 其他区域（折叠）───────
  □ 李芳 (南美区)
  □ 王芳 (欧非区)
```

---

## ⚡ 快速实施清单

### **立即可实施（不影响现有数据）：**

✅ **任务1**：扩展人员列表，每个区域添加2-3个业务员  
   - 修改文件：`/lib/notification-rules.ts`
   - 添加 `workload` 字段
   - 不影响现有功能

✅ **任务2**：优化步骤1的智能推荐  
   - 修改文件：`/components/demo/FullProcessDemoV5.tsx`
   - 在步骤1中自动调用 `getRecommendedRecipients()`
   - 自动填充同区域业务员

✅ **任务3**：添加负载显示  
   - 在被通知人选择弹窗中显示每个业务员的当前负载
   - 用颜色标识：绿色（负载低）、黄色（中）、红色（高）

✅ **任务4**：添加"快速分配"按钮  
   - 在步骤1弹窗中添加按钮：[⚡ 自动分配给最空闲业务员]
   - 一键自动选择负载最低的业务员

---

## 🤔 下一步决策

请告诉我您希望：

**A.** 立即实施上述4个任务（扩展人员 + 智能推荐 + 负载显示 + 快速分配）  
**B.** 先扩展人员列表，看看效果再决定  
**C.** 保持现有机制（已经有区域匹配功能）  
**D.** 其他需求（请说明）

---

## 📌 重要提示

1. **现有数据不受影响**：所有改动都是增强型，不会破坏测试数据
2. **区域匹配已实现**：当前系统已支持基础区域匹配
3. **负载均衡可选**：可以先用"手动选择"模式，后期再加自动分配
4. **升级机制待定**：需要您确认是否需要超时升级功能

---

## 🎯 总结

您的系统**已经具备区域匹配的基础能力**，只需要：
1. ✅ 扩展每个区域的业务员数量（从1个变成3-5个）
2. ✅ 优化被通知人推荐算法（显示负载信息）
3. ✅ 添加快速分配功能（可选）

这样就能完美支持"北美客户→北美业务员、南美客户→南美业务员"的业务逻辑！🚀
