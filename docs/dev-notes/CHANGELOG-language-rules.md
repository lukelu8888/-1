# 🌐 语言显示规则实现 - 更新日志

**更新时间：** 2025-12-08  
**功能模块：** 通知内容与字段状态多语言智能显示

---

## 📋 需求说明

### 用户需求
根据用户在不同Portal中的角色，智能显示中文或英文界面内容，特别是通知信息和字段状态。

### 语言显示规则
1. **客户发出的通知** → 接收人（其他角色）看英文
2. **其他角色发给客户的通知** → 客户看英文
3. **非客户之间互发的通知** → 都看中文

### 适用范围
- **Customer Portal（客户端）**：全英文 🇺🇸
- **Admin Portal（高盛达富端）**：全中文（主）+ 英文（辅） 🇨🇳
- **Supplier Portal（供应端）**：全中文（主）+ 英文（辅） 🇨🇳
- **通知内容**：根据发送方和接收方智能切换
- **字段状态**：根据查看者角色智能切换

---

## ✨ 新增功能

### 1. 语言显示规则辅助函数库
**文件：** `/lib/notification-language.ts`

#### 核心函数：
- `isCustomerRole(roleName)` - 判断角色是否为客户
- `getNotificationLanguage(viewerRole, notifierRole, recipientRole)` - 智能判断应显示的语言
- `selectLanguageText(language, zhText, enText)` - 选择对应语言文本
- `getFieldLabelLanguage(viewerRole, formOwnerRole)` - 判断字段标签语言
- `translateFieldLabel(field, language)` - 翻译字段标签
- `commonFieldLabels` - 常用字段的中英文映射表（70+字段）

#### 字段映射示例：
```typescript
{
  inquiryStatus: { label: '询价状态', labelEn: 'Inquiry Status' },
  quotationNumber: { label: '报价编号', labelEn: 'Quotation Number' },
  contractStatus: { label: '合同状态', labelEn: 'Contract Status' },
  // ... 70+ 字段
}
```

---

### 2. V5全流程演示弹窗增强
**文件：** `/components/demo/FullProcessDemoV5.tsx`

#### 新增功能：
✅ **视角切换器**
- 位置：弹窗标题栏右侧
- 功能：模拟不同角色查看同一步骤的语言显示效果
- 默认视角：业务员
- 支持切换：客户、业务员、财务专员、采购员等14个核心角色

✅ **智能语言切换**
- `getFieldText()` - 根据视角切换字段标签和值
- `getNotificationText()` - 根据发送方/接收方/视角智能显示通知内容

✅ **双语界面标题**
- 表单字段：`Form Fields` / `表单字段`
- 通知信息：`Notification` / `通知信息`
- 通知人：`Notifier` / `通知人`
- 被通知人：`Recipients` / `被通知人`
- 通知内容：`Notification Content` / `通知内容`

✅ **视角提示条**
- 显示当前模拟的角色视角
- 提示当前语言显示规则
- 蓝色背景高亮显示

---

### 3. 通知数据结构扩展
**接口定义：**
```typescript
notification?: {
  message: string;          // 通知消息（中文）
  messageEn?: string;       // 通知消息（英文）
  notifier: string;         // 通知人（中文）
  notifierEn?: string;      // 通知人（英文）
  recipients?: string[];    // 接收人列表
}
```

#### 已完成英文翻译的关键步骤：
- ✅ 步骤1：客户提交询价
- ✅ 步骤3：业务员分配采购
- ✅ 步骤4：业务员询价
- ✅ 步骤6：采购员发送询价
- ✅ 步骤7：供应商收到询价
- ✅ 步骤8：供应商提交报价
- ✅ 步骤23：财务核销定金
- ✅ 步骤50：通知客户完货

---

## 🔧 技术实现

### 语言判断逻辑

```typescript
// 1. 判断通知人角色
const isNotifierCustomer = isCustomerRole(notification.notifier);

// 2. 判断查看者角色
const isViewerCustomer = isCustomerRole(viewerRole);

// 3. 判断被通知人中是否有客户
const hasCustomerRecipient = notification.recipients?.some(r => isCustomerRole(r));

// 4. 应用规则
if (isNotifierCustomer && !isViewerCustomer) {
  // 规则1：客户发出 → 内部员工看英文
  shouldShowEnglish = true;
}

if (!isNotifierCustomer && isViewerCustomer) {
  // 规则2：内部发给客户 → 客户看英文
  shouldShowEnglish = true;
}

// 5. 返回对应语言文本
return shouldShowEnglish && messageEn ? messageEn : message;
```

---

## 📊 文件变更清单

### 新增文件
- ✅ `/lib/notification-language.ts` - 语言规则辅助函数库
- ✅ `/docs/language-rules-testing-guide.md` - 测试指南
- ✅ `/CHANGELOG-language-rules.md` - 本文档

### 修改文件
- ✅ `/components/demo/FullProcessDemoV5.tsx`
  - 新增 `viewerRole` 状态管理
  - 新增视角切换器组件
  - 增强 `getFieldText()` 函数
  - 新增 `getNotificationText()` 函数
  - 更新通知内容显示逻辑
  - 更新界面标题双语显示
  - 为8个关键步骤添加英文通知

---

## 🎯 当前状态

### ✅ 已完成
- [x] 语言规则辅助函数库
- [x] V5弹窗视角切换器
- [x] 智能语言判断逻辑
- [x] 界面标题双语化
- [x] 关键步骤英文翻译（8个）
- [x] 视角提示条
- [x] 测试指南文档

### ⏳ 待完成
- [ ] 为剩余94个步骤添加英文翻译
- [ ] 在真实订单管理页面应用语言规则
- [ ] 在Customer Portal应用语言规则
- [ ] 在Supplier Portal应用语言规则
- [ ] 邮件通知系统集成语言规则
- [ ] PDF文档生成集成语言规则
- [ ] 人员名录双语化（中英文姓名）

---

## 🧪 测试说明

### 测试入口
1. 打开 Admin Portal
2. 进入"订单管理中心"
3. 点击任意订单
4. 打开"🎬 全流程演示"弹窗

### 测试步骤
1. 使用标题栏的**视角切换器**切换不同角色
2. 点击不同步骤查看详情
3. 观察"通知信息"和"表单字段"的语言变化
4. 验证语言显示规则是否正确

### 重点测试场景
- **客户视角** → 所有内容应显示英文
- **业务员视角** → 所有内容应显示中文
- **步骤1（客户提交询价）** → 测试客户发出的通知
- **步骤50（通知客户完货）** → 测试内部发给客户的通知
- **步骤3（业务员分配采购）** → 测试内部互发的通知

详细测试指南见：`/docs/language-rules-testing-guide.md`

---

## 💡 使用示例

### 在其他组件中应用语言规则

```typescript
import { 
  getNotificationLanguage, 
  selectLanguageText,
  getFieldLabel 
} from '@/lib/notification-language';

// 示例1：判断通知应显示的语言
const language = getNotificationLanguage(
  currentUserRole,    // '业务员'
  notificationSender, // '客户'
  notificationRecipient // '业务员'
);
// 返回: 'en' (客户发出的通知，业务员看英文)

// 示例2：选择对应语言的文本
const text = selectLanguageText(
  language,
  '已收到您的询价',              // 中文
  'Your inquiry has been received'  // 英文
);

// 示例3：获取字段标签
const label = getFieldLabel(
  'inquiryStatus',    // 字段key
  currentUserRole,    // 当前用户角色
  formOwnerRole       // 表单创建者角色
);
// 返回: 'Inquiry Status' (如果是客户查看)
// 返回: '询价状态' (如果是内部员工查看)
```

---

## 🔄 后续优化计划

### Phase 1：完善V5演示数据 ✅ 当前
- [x] 为8个关键步骤添加英文翻译
- [ ] 为剩余94个步骤添加英文翻译
- [ ] 优化人员名录双语显示

### Phase 2：真实业务系统集成
- [ ] 订单详情页面应用语言规则
- [ ] 询价管理页面应用语言规则
- [ ] 报价管理页面应用语言规则
- [ ] 合同管理页面应用语言规则

### Phase 3：跨Portal语言统一
- [ ] Customer Portal字段标签统一
- [ ] Admin Portal通知内容智能化
- [ ] Supplier Portal通知内容智能化

### Phase 4：自动化与扩展
- [ ] 邮件模板支持智能语言选择
- [ ] PDF文档支持智能语言选择
- [ ] 批量翻译工具开发
- [ ] 翻译质量检查工具

---

## 📞 技术支持

如有问题或建议，请联系开发团队。

**相关文档：**
- `/lib/notification-language.ts` - 语言规则源码
- `/docs/language-rules-testing-guide.md` - 测试指南

---

**版本：** v1.0.0  
**最后更新：** 2025-12-08  
**维护者：** 开发团队
