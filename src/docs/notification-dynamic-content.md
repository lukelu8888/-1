# 📢 动态通知内容生成系统

## 🎯 功能说明

通知内容现在会**根据实际选择的被通知人动态生成**，而不是使用硬编码的文本。

## ✨ 核心特性

### 1. 动态生成规则

- **单人通知**：显示具体的被通知人姓名
  - 中文：`已向业务员张伟发送询盘通知`
  - 英文：`Inquiry notification sent to Sales Rep Zhang Wei`

- **多人通知**：显示被通知人数量
  - 中文：`已向3位人员发送报价通知`
  - 英文：`Quotation notification sent to 3 recipients`

- **无被通知人**：显示默认提示
  - 中文：`暂无通知`
  - 英文：`No notification sent`

### 2. 智能语言切换

通知内容会根据以下规则自动选择语言：

1. **客户发出的通知** → 接收人（其他角色）看英文
2. **其他角色发给客户的通知** → 客户看英文  
3. **非客户之间互发的通知** → 都看中文

### 3. 步骤标题集成

系统会根据步骤类型自动添加对应的业务标题：

| 步骤 | 中文标题 | 英文标题 |
|-----|---------|---------|
| 提交询盘 | 询盘 | Inquiry |
| 报价 | 报价 | Quotation |
| 签订合同 | 合同签订 | Contract Signing |
| 采购下单 | 采购订单 | Purchase Order |
| 生产 | 生产 | Production |
| 质检 | 质检 | Quality Inspection |
| 出货通知 | 出货 | Shipment |
| 报关 | 报关 | Customs Declaration |
| 海运提单 | 提单 | Bill of Lading |

## 🔧 技术实现

### 核心函数

#### `generateNotificationMessage()`

位置：`/lib/notification-language.ts`

```typescript
generateNotificationMessage(
  notifier: string,         // 通知发送者
  recipients: string[],     // 被通知人列表
  stepTitle?: string,       // 步骤标题（可选）
  language: 'zh' | 'en'     // 语言
): string
```

#### `stepNotificationTitles`

步骤标题映射表，包含所有业务步骤的中英文标题。

### 使用示例

```typescript
// 在 FullProcessDemoV5.tsx 中
const message = getNotificationText(
  step.statusDetails.notification, 
  'message', 
  step.role, 
  step.title  // 🔥 传入步骤标题
);
```

## 📋 数据结构

### Notification 接口

```typescript
interface Notification {
  message: string;           // 预设中文内容（fallback）
  messageEn?: string;        // 预设英文内容（fallback）
  notifier: string;          // 通知发送者
  notifierEn?: string;       // 通知发送者（英文）
  recipients?: string[];     // 🔥 被通知人列表（用于动态生成）
}
```

## 🎨 用户体验

### 实时更新

当用户在"被通知人"字段中：
- ✅ **添加人员** → 通知内容立即更新
- ✅ **删除人员** → 通知内容立即更新
- ✅ **切换视角** → 语言自动切换

### 示例场景

#### 场景 1：业务员向采购员发送通知

**操作**：
1. 通知人：业务员张伟
2. 被通知人：采购员李明
3. 视角：业务员（中文）

**显示**：
```
通知内容：已向采购员李明发送询盘通知
```

#### 场景 2：客户视角查看

**操作**：
1. 通知人：系统自动通知
2. 被通知人：业务员张伟
3. 视角：客户（英文）

**显示**：
```
Notification Content: Inquiry notification sent to Sales Rep Zhang Wei
```

#### 场景 3：多人通知

**操作**：
1. 通知人：业务员张伟
2. 被通知人：采购员李明、财务专员王芳、仓库管理员赵强
3. 视角：业务员（中文）

**显示**：
```
通知内容：已向3位人员发送报价通知
```

## 🔄 Fallback 机制

如果 `recipients` 数组为空或未定义，系统会使用预设的 `message`/`messageEn` 字段作为备用显示内容，确保向后兼容。

## 🚀 优势

1. **灵活性**：内容随数据实时变化
2. **国际化**：完整的中英文支持
3. **可维护性**：无需硬编码所有通知文本
4. **用户友好**：通知内容清晰明确
5. **向后兼容**：保留 fallback 机制

## 📝 开发注意事项

### 添加新步骤时

如果添加新的业务步骤，需要在 `stepNotificationTitles` 中添加对应的中英文标题：

```typescript
export const stepNotificationTitles: Record<string, { zh: string; en: string }> = {
  // ... 现有步骤
  '新步骤名称': { zh: '新步骤', en: 'New Step' },
};
```

### 自定义通知内容

如果需要完全自定义的通知内容（不使用动态生成），可以：
1. 将 `recipients` 设置为空数组
2. 设置 `message` 和 `messageEn` 字段

系统会自动使用预设内容。

---

**创建时间**：2025-12-08  
**版本**：V1.0  
**状态**：✅ 已实现并测试
