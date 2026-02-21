# 表单数据同步架构说明文档

## 📋 目录
1. [系统架构概览](#系统架构概览)
2. [表单列标题字段同步机制](#表单列标题字段同步机制)
3. [表单状态管理机制](#表单状态管理机制)
4. [数据流转全景图](#数据流转全景图)
5. [实现细节与代码示例](#实现细节与代码示例)
6. [最佳实践建议](#最佳实践建议)

---

## 🏗️ 系统架构概览

### 三层架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     表单展示层 (UI Layer)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ 询价表单  │  │ 报价表单  │  │ 合同表单  │  │ 发货表单  │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                  状态管理层 (State Layer)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ InquiryContext  │  │ OrderContext    │  │PaymentContext││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │QuotationContext │  │FinanceContext   │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                 数据持久化层 (Storage Layer)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           localStorage (客户端缓存)                       ││
│  │  - cosun_inquiries      - cosun_quotations              ││
│  │  - cosun_orders         - cosun_payments                ││
│  │  - cosun_contracts      - cosun_shipments               ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Supabase KV Store (服务端存储)                    ││
│  │  表: kv_store_880fd43b                                  ││
│  │  键值对结构: key → value (JSON)                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 表单列标题字段同步机制

### 1. 核心概念

**列标题字段同步**指的是：当表单模板中定义的字段配置（如字段名、类型、验证规则等）发生变化时，所有使用该模板的表单实例都能自动更新其显示和验证逻辑。

### 2. 实现原理

#### 2.1 表单模板配置（Template Configuration）

所有表单模板定义在配置文件中：

**文件位置：**
- `/config/formTemplates.ts` - 基础表单模板
- `/config/formTemplatesHomeDepot.ts` - Home Depot风格模板
- `/config/formTemplatesHomeDepotReal.ts` - 真实商业文档模板
- `/config/formTemplatesCosunReal.ts` - COSUN企业级模板

**模板结构示例：**

```typescript
// 表单模板接口定义
export interface FormField {
  id: string;              // 字段唯一标识
  label: string;           // 字段标签（中文）
  labelEn: string;         // 字段标签（英文）
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'table';
  required: boolean;       // 是否必填
  placeholder?: string;    // 占位符
  options?: string[];      // 下拉选项（select类型）
  validation?: {           // 验证规则
    pattern?: string;
    min?: number;
    max?: number;
    custom?: (value: any) => boolean;
  };
  columnWidth?: string;    // 列宽度（智能宽度系统）
  dependencies?: string[]; // 依赖字段
}

export interface FormSection {
  title: string;           // 区块标题
  titleEn: string;         // 区块标题（英文）
  fields: FormField[];     // 字段列表
}

export interface FormTemplate {
  id: string;              // 模板ID
  name: string;            // 模板名称
  nameEn: string;          // 模板名称（英文）
  category: string;        // 分类
  sections: FormSection[]; // 表单区块
  version: string;         // 版本号
  status: 'active' | 'draft' | 'archived';
  metadata: {              // 元数据
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
  };
}
```

#### 2.2 字段同步流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 步骤1: 模板配置更新                                              │
│ ─────────────────────────────────────────────────────────────── │
│ 系统管理员在「表单库管理中心Pro」修改模板配置                     │
│ ├─ 修改字段标签: "Customer Name" → "Client Company Name"       │
│ ├─ 修改字段类型: text → select                                  │
│ ├─ 添加验证规则: required: true, minLength: 3                   │
│ └─ 调整列宽度: auto → 200px                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 步骤2: 版本管理与变更追踪                                        │
│ ─────────────────────────────────────────────────────────────── │
│ 系统自动创建新版本记录                                           │
│ ├─ version: "1.0.0" → "1.1.0"                                  │
│ ├─ changeLog: "Updated customer name field validation"         │
│ ├─ timestamp: "2025-12-10 14:30:00"                            │
│ └─ 保存到 localStorage: `form_template_${templateId}_v1.1.0`   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 步骤3: 实例化表单加载最新配置                                     │
│ ─────────────────────────────────────────────────────────────── │
│ 当用户打开表单时（如创建新询价、编辑报价等）                       │
│ ├─ 组件从 formTemplates 配置文件读取最新模板定义                 │
│ ├─ 根据模板ID匹配对应的模板配置                                  │
│ ├─ 动态渲染表单字段（使用最新的 label、type、validation）        │
│ └─ 应用智能宽度系统（根据 columnWidth 配置）                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 步骤4: 列表展示同步更新                                          │
│ ─────────────────────────────────────────────────────────────── │
│ 在各角色的管理列表页面中（如订单列表、报价列表）                   │
│ ├─ TableHead 标题从模板配置动态读取                              │
│ ├─ 示例: <TableHead>{formTemplate.fields[0].label}</TableHead>│
│ ├─ 字段变更时，列表标题自动更新                                  │
│ └─ 无需手动修改列表组件代码                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3 实现代码示例

**模板定义（配置文件）：**

```typescript
// /config/formTemplatesCosunReal.ts
export const inquiryFormTemplate: FormTemplate = {
  id: 'inquiry-rfq-v1',
  name: '询价单（RFQ）',
  nameEn: 'Request for Quotation',
  category: 'inquiry',
  sections: [
    {
      title: '客户信息',
      titleEn: 'Customer Information',
      fields: [
        {
          id: 'customerName',
          label: '客户公司名称',
          labelEn: 'Customer Company Name',
          type: 'text',
          required: true,
          columnWidth: 'flex-1', // 智能宽度
          validation: {
            pattern: '^[A-Za-z0-9\\s\\.\\-]+$',
            min: 3,
            max: 100
          }
        },
        {
          id: 'contactPerson',
          label: '联系人',
          labelEn: 'Contact Person',
          type: 'text',
          required: true,
          columnWidth: 'w-48'
        },
        {
          id: 'email',
          label: '电子邮箱',
          labelEn: 'Email Address',
          type: 'text',
          required: true,
          columnWidth: 'w-64',
          validation: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
          }
        }
      ]
    },
    {
      title: '产品信息',
      titleEn: 'Product Information',
      fields: [
        {
          id: 'products',
          label: '询价产品清单',
          labelEn: 'Product List',
          type: 'table',
          required: true,
          columnWidth: 'w-full'
        }
      ]
    }
  ],
  version: '1.0.0',
  status: 'active',
  metadata: {
    createdAt: '2025-12-01',
    createdBy: 'admin',
    updatedAt: '2025-12-10',
    updatedBy: 'admin'
  }
};
```

**表单渲染组件（动态读取配置）：**

```tsx
// /components/admin/CreateInquiryDialog.tsx
import { inquiryFormTemplate } from '../../config/formTemplatesCosunReal';

export function CreateInquiryDialog() {
  const template = inquiryFormTemplate; // 读取最新模板配置
  
  return (
    <Dialog>
      <DialogContent>
        <form>
          {template.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {section.titleEn}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {section.fields.map((field) => (
                  <div key={field.id} className={field.columnWidth}>
                    <Label>{field.labelEn}</Label>
                    {field.type === 'text' && (
                      <Input
                        required={field.required}
                        placeholder={field.placeholder}
                        pattern={field.validation?.pattern}
                        minLength={field.validation?.min}
                        maxLength={field.validation?.max}
                      />
                    )}
                    {field.type === 'select' && (
                      <Select>
                        {field.options?.map(opt => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**列表页面（列标题同步）：**

```tsx
// /components/admin/AdminInquiryManagement.tsx
import { inquiryFormTemplate } from '../../config/formTemplatesCosunReal';

export function AdminInquiryManagement() {
  const template = inquiryFormTemplate;
  
  // 从模板配置中提取字段定义
  const customerNameField = template.sections[0].fields.find(
    f => f.id === 'customerName'
  );
  const contactPersonField = template.sections[0].fields.find(
    f => f.id === 'contactPerson'
  );
  const emailField = template.sections[0].fields.find(
    f => f.id === 'email'
  );
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>询价单号</TableHead>
          {/* 🔥 列标题从模板配置动态读取 */}
          <TableHead>{customerNameField?.labelEn}</TableHead>
          <TableHead>{contactPersonField?.labelEn}</TableHead>
          <TableHead>{emailField?.labelEn}</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inquiries.map((inquiry) => (
          <TableRow key={inquiry.id}>
            <TableCell>{inquiry.id}</TableCell>
            <TableCell>{inquiry.customerName}</TableCell>
            <TableCell>{inquiry.contactPerson}</TableCell>
            <TableCell>{inquiry.email}</TableCell>
            <TableCell>
              <Badge>{inquiry.status}</Badge>
            </TableCell>
            <TableCell>
              <Button>查看</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 📊 表单状态管理机制

### 1. 状态生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                    表单状态生命周期                               │
│                                                                  │
│  Draft → Submitted → Under Review → Approved → Processing →     │
│  Completed → Archived                                            │
│                                                                  │
│  具体示例（询价单）：                                             │
│  草稿 → 已提交 → 审核中 → 已批准 → 报价中 → 已报价 → 已归档      │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 状态同步实现

#### 2.1 Context API 状态管理

系统使用 React Context API 进行全局状态管理，主要的 Context 包括：

**主要 Context 列表：**

| Context名称 | 管理的表单类型 | 文件位置 | 主要功能 |
|------------|---------------|---------|---------|
| `InquiryContext` | 询价单（RFQ） | `/contexts/InquiryContext.tsx` | 管理询价单的创建、更新、状态变更 |
| `QuotationContext` | 报价单（Quotation） | `/contexts/QuotationContext.tsx` | 管理报价单的生成、修改、发送 |
| `OrderContext` | 订单（Order）、销售合同（SC） | `/contexts/OrderContext.tsx` | 管理订单全生命周期 |
| `PaymentContext` | 付款记录、应收账款 | `/contexts/PaymentContext.tsx` | 管理付款状态与财务流转 |
| `FinanceContext` | 财务数据、收款管理 | `/contexts/FinanceContext.tsx` | 管理财务审批与记录 |
| `NotificationContext` | 通知消息 | `/contexts/NotificationContext.tsx` | 智能通知规则系统 |

#### 2.2 状态同步流程

**示例：询价单状态从"草稿"变更为"已提交"**

```typescript
// 步骤1: 在 InquiryContext 中定义状态更新函数
// /contexts/InquiryContext.tsx

export const InquiryProvider = ({ children }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    // 从 localStorage 加载数据
    const stored = localStorage.getItem('cosun_inquiries');
    return stored ? JSON.parse(stored) : [];
  });

  // 🔥 更新询价单状态
  const updateInquiryStatus = (inquiryId: string, newStatus: InquiryStatus) => {
    setInquiries(prev => {
      const updated = prev.map(inquiry => 
        inquiry.id === inquiryId 
          ? { ...inquiry, status: newStatus, updatedAt: new Date().toISOString() }
          : inquiry
      );
      
      // 🔥 同步到 localStorage
      localStorage.setItem('cosun_inquiries', JSON.stringify(updated));
      
      // 🔥 触发通知（如果需要）
      if (newStatus === 'Submitted') {
        addNotification({
          type: 'inquiry',
          title: 'Inquiry Submitted',
          message: `Inquiry ${inquiryId} has been submitted for review`,
          recipientRole: 'Marketing_Ops',
          relatedId: inquiryId
        });
      }
      
      return updated;
    });
  };

  return (
    <InquiryContext.Provider value={{
      inquiries,
      updateInquiryStatus,
      // ... 其他方法
    }}>
      {children}
    </InquiryContext.Provider>
  );
};
```

```typescript
// 步骤2: 在组件中调用状态更新
// /components/admin/AdminInquiryManagement.tsx

import { useInquiry } from '../../contexts/InquiryContext';

export function AdminInquiryManagement() {
  const { inquiries, updateInquiryStatus } = useInquiry();

  const handleSubmitInquiry = (inquiryId: string) => {
    // 🔥 更新状态
    updateInquiryStatus(inquiryId, 'Submitted');
    
    toast.success('询价单已提交');
  };

  return (
    <Table>
      <TableBody>
        {inquiries.map(inquiry => (
          <TableRow key={inquiry.id}>
            <TableCell>{inquiry.id}</TableCell>
            <TableCell>
              {/* 🔥 状态自动同步显示 */}
              <Badge variant={getStatusVariant(inquiry.status)}>
                {inquiry.status}
              </Badge>
            </TableCell>
            <TableCell>
              {inquiry.status === 'Draft' && (
                <Button onClick={() => handleSubmitInquiry(inquiry.id)}>
                  提交询价
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### 2.3 跨模块状态同步

**场景：询价单 → 报价单 → 销售合同 → 订单**

```typescript
// 🔥 完整的业务流转状态同步

// 1️⃣ 询价单创建（InquiryContext）
const createInquiry = (data: InquiryData) => {
  const newInquiry = {
    id: generateInquiryId(), // INQ-2025-0001
    ...data,
    status: 'Draft',
    createdAt: new Date().toISOString()
  };
  
  setInquiries(prev => {
    const updated = [...prev, newInquiry];
    localStorage.setItem('cosun_inquiries', JSON.stringify(updated));
    return updated;
  });
  
  return newInquiry;
};

// 2️⃣ 生成报价单（QuotationContext）
const generateQuotationFromInquiry = (inquiryId: string) => {
  // 从 InquiryContext 读取询价单数据
  const inquiry = inquiries.find(i => i.id === inquiryId);
  
  if (!inquiry) return;
  
  const newQuotation = {
    id: generateQuotationId(), // QUO-2025-0001
    inquiryId: inquiry.id,
    customer: inquiry.customer,
    products: inquiry.products,
    status: 'Draft',
    createdAt: new Date().toISOString()
  };
  
  setQuotations(prev => {
    const updated = [...prev, newQuotation];
    localStorage.setItem('cosun_quotations', JSON.stringify(updated));
    return updated;
  });
  
  // 🔥 更新询价单状态
  updateInquiryStatus(inquiryId, 'Quoted');
  
  return newQuotation;
};

// 3️⃣ 生成销售合同（OrderContext）
const generateContractFromQuotation = (quotationId: string) => {
  const quotation = quotations.find(q => q.id === quotationId);
  
  if (!quotation) return;
  
  const newContract = {
    id: generateContractId(), // SC-2025-0001
    quotationId: quotation.id,
    inquiryId: quotation.inquiryId,
    customer: quotation.customer,
    products: quotation.products,
    status: 'Draft',
    createdAt: new Date().toISOString()
  };
  
  setContracts(prev => {
    const updated = [...prev, newContract];
    localStorage.setItem('cosun_contracts', JSON.stringify(updated));
    return updated;
  });
  
  // 🔥 更新报价单状态
  updateQuotationStatus(quotationId, 'Contract Generated');
  
  // 🔥 更新询价单状态
  updateInquiryStatus(quotation.inquiryId, 'Contract Signed');
  
  return newContract;
};
```

### 3. 角色权限与状态可见性

不同角色看到的表单状态和操作权限不同：

```typescript
// /lib/rbac-config.ts

export const formPermissionMatrix = {
  // 询价单权限
  inquiry: {
    Marketing_Ops: {
      canView: ['all'],
      canEdit: ['Draft', 'Pending Review'],
      canDelete: ['Draft'],
      canSubmit: true,
      canApprove: false
    },
    Sales_Manager: {
      canView: ['all'],
      canEdit: ['Draft', 'Pending Review', 'Submitted'],
      canDelete: ['Draft'],
      canSubmit: true,
      canApprove: true
    },
    Sales_Rep: {
      canView: ['own'], // 只能看自己的
      canEdit: ['Draft'],
      canDelete: false,
      canSubmit: false,
      canApprove: false
    }
  },
  
  // 报价单权限
  quotation: {
    Sales_Rep: {
      canView: ['own'],
      canEdit: ['Draft'],
      canDelete: false,
      canSend: true,
      canApprove: false
    },
    Sales_Manager: {
      canView: ['region'], // 看所管辖区域的
      canEdit: ['Draft', 'Sent'],
      canDelete: ['Draft'],
      canSend: true,
      canApprove: true
    },
    CEO: {
      canView: ['all'],
      canEdit: ['all'],
      canDelete: ['all'],
      canSend: true,
      canApprove: true
    }
  }
};

// 在列表页面中应用权限过滤
export function AdminQuotationList() {
  const { currentUser } = useAuth();
  const { quotations } = useQuotation();
  
  // 🔥 根据角色过滤可见的报价单
  const visibleQuotations = quotations.filter(quotation => {
    const permissions = formPermissionMatrix.quotation[currentUser.role];
    
    if (permissions.canView.includes('all')) {
      return true;
    }
    
    if (permissions.canView.includes('own')) {
      return quotation.createdBy === currentUser.id;
    }
    
    if (permissions.canView.includes('region')) {
      return quotation.region === currentUser.region;
    }
    
    return false;
  });
  
  return (
    <Table>
      <TableBody>
        {visibleQuotations.map(quotation => (
          <TableRow key={quotation.id}>
            {/* ... */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 🌐 数据流转全景图

### 完整业务流程的表单状态同步

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COSUN B2B 全流程数据流转                             │
└─────────────────────────────────────────────────────────────────────────────┘

📝 询价单 (RFQ - Request for Quotation)
┌────────────────────────────────────────────────────────────────┐
│ ID: INQ-2025-0001                                              │
│ Status: Draft → Submitted → Under Review → Quoted             │
│ Context: InquiryContext                                        │
│ Storage: localStorage['cosun_inquiries']                       │
│ Visible To: Marketing_Ops, Sales_Manager, Sales_Rep           │
└────────────────────────────────────────────────────────────────┘
                         ↓ (生成报价单)
💰 报价单 (Quotation)
┌────────────────────────────────────────────────────────────────┐
│ ID: QUO-2025-0001                                              │
│ Status: Draft → Sent → Negotiating → Accepted → Contract Gen. │
│ Context: QuotationContext                                      │
│ Storage: localStorage['cosun_quotations']                      │
│ Visible To: Sales_Rep, Sales_Manager, CEO                     │
│ Related: inquiryId = INQ-2025-0001                            │
└────────────────────────────────────────────────────────────────┘
                         ↓ (客户接受，生成合同)
📄 销售合同 (Sales Contract)
┌────────────────────────────────────────────────────────────────┐
│ ID: SC-2025-0001                                               │
│ Status: Draft → Pending Review → Approved → Signed → Active   │
│ Context: OrderContext                                          │
│ Storage: localStorage['cosun_contracts']                       │
│ Visible To: Sales_Rep, Finance, CEO                           │
│ Related: quotationId = QUO-2025-0001, inquiryId = INQ-2025... │
└────────────────────────────────────────────────────────────────┘
                         ↓ (合同签署后，创建订单)
📦 订单 (Order / Purchase Order)
┌────────────────────────────────────────────────────────────────┐
│ ID: ORD-2025-0001                                              │
│ Status: Pending → In Production → Quality Check → Ready       │
│ Context: OrderContext                                          │
│ Storage: localStorage['cosun_orders']                          │
│ Visible To: Sales_Rep, Procurement, CEO                       │
│ Related: contractId = SC-2025-0001                            │
└────────────────────────────────────────────────────────────────┘
                         ↓ (订单完成，发起发货)
🚢 发货通知 (Shipment Notification)
┌────────────────────────────────────────────────────────────────┐
│ ID: SN-2025-0001                                               │
│ Status: Draft → Pending → Shipped → In Transit → Delivered    │
│ Context: ShipmentContext                                       │
│ Storage: localStorage['cosun_shipments']                       │
│ Visible To: Sales_Rep, Logistics, Customer                    │
│ Related: orderId = ORD-2025-0001                              │
└────────────────────────────────────────────────────────────────┘
                         ↓ (发货后，生成单证)
📋 单证 (Shipping Documents)
┌────────────────────────────────────────────────────────────────┐
│ Types: CI (商业发票), PL (装箱单), BL (提单), CD (报关单)         │
│ Status: Draft → Generated → Sent → Confirmed                  │
│ Context: DocumentContext                                       │
│ Storage: localStorage['cosun_documents']                       │
│ Visible To: Sales_Rep, Customs Broker, Customer               │
│ Related: shipmentId = SN-2025-0001                            │
└────────────────────────────────────────────────────────────────┘
                         ↓ (发货后，财务管理)
💵 应收账款 (Accounts Receivable)
┌────────────────────────────────────────────────────────────────┐
│ ID: AR-2025-0001                                               │
│ Status: Pending → Partial Paid → Fully Paid → Overdue         │
│ Context: FinanceContext                                        │
│ Storage: localStorage['cosun_receivables']                     │
│ Visible To: Finance, CFO, CEO                                 │
│ Related: contractId = SC-2025-0001                            │
└────────────────────────────────────────────────────────────────┘
                         ↓ (客户付款)
💳 收款记录 (Payment Record)
┌────────────────────────────────────────────────────────────────┐
│ ID: PAY-2025-0001                                              │
│ Status: Pending → Confirmed → Reconciled                      │
│ Context: PaymentContext                                        │
│ Storage: localStorage['cosun_payments']                        │
│ Visible To: Finance, CFO, CEO                                 │
│ Related: arId = AR-2025-0001                                  │
└────────────────────────────────────────────────────────────────┘
```

### 状态同步触发机制

```typescript
// 🔥 智能通知规则系统
// /lib/notification-rules.ts

export const statusChangeNotificationRules = {
  // 询价单状态变更通知
  inquiry: {
    'Draft → Submitted': {
      notifyRoles: ['Marketing_Ops', 'Sales_Manager'],
      message: 'New inquiry submitted for review',
      priority: 'normal'
    },
    'Submitted → Under Review': {
      notifyRoles: ['Sales_Manager'],
      message: 'Inquiry is under review',
      priority: 'high'
    },
    'Under Review → Quoted': {
      notifyRoles: ['Sales_Rep', 'Marketing_Ops'],
      message: 'Quotation generated for inquiry',
      priority: 'normal'
    }
  },
  
  // 报价单状态变更通知
  quotation: {
    'Draft → Sent': {
      notifyRoles: ['Sales_Manager', 'CEO'],
      message: 'Quotation sent to customer',
      priority: 'normal'
    },
    'Sent → Accepted': {
      notifyRoles: ['Sales_Rep', 'Finance', 'CEO'],
      message: 'Customer accepted the quotation!',
      priority: 'high',
      action: 'Generate Contract'
    },
    'Accepted → Contract Generated': {
      notifyRoles: ['Sales_Rep', 'Finance'],
      message: 'Sales contract generated',
      priority: 'high'
    }
  },
  
  // 订单状态变更通知
  order: {
    'Pending → In Production': {
      notifyRoles: ['Procurement', 'Sales_Rep'],
      message: 'Order entered production',
      priority: 'normal'
    },
    'In Production → Quality Check': {
      notifyRoles: ['Sales_Rep'],
      message: 'Order ready for quality inspection',
      priority: 'normal'
    },
    'Quality Check → Ready': {
      notifyRoles: ['Sales_Rep', 'Logistics'],
      message: 'Order passed quality check, ready to ship',
      priority: 'high',
      action: 'Create Shipment Notification'
    }
  }
};
```

---

## 💻 实现细节与代码示例

### 1. 智能表单字段宽度系统

系统实现了自适应的字段宽度管理，根据字段类型和内容自动调整宽度：

```typescript
// /config/formLayoutSystem.ts

export const fieldWidthMapping = {
  // 固定宽度字段
  id: 'w-32',              // ID字段：128px
  code: 'w-36',            // 编码字段：144px
  date: 'w-40',            // 日期字段：160px
  number: 'w-32',          // 数字字段：128px
  currency: 'w-40',        // 货币字段：160px
  
  // 中等宽度字段
  name: 'w-48',            // 名称字段：192px
  email: 'w-64',           // 邮箱字段：256px
  phone: 'w-44',           // 电话字段：176px
  
  // 弹性宽度字段
  description: 'flex-1',   // 描述字段：占满剩余空间
  textarea: 'w-full',      // 文本域：100%
  table: 'w-full',         // 表格：100%
  
  // 下拉选择字段
  select: 'w-48',          // 下拉框：192px
  multiselect: 'w-64',     // 多选框：256px
  
  // 布尔字段
  checkbox: 'w-auto',      // 复选框：自适应
  radio: 'w-auto',         // 单选框：自适应
  switch: 'w-auto',        // 开关：自适应
};

// 🔥 自动计算字段宽度的工具函数
export function getFieldWidth(field: FormField): string {
  // 优先使用字段定义的宽度
  if (field.columnWidth) {
    return field.columnWidth;
  }
  
  // 根据字段类型推断宽度
  if (field.type === 'table') return 'w-full';
  if (field.type === 'textarea') return 'w-full';
  if (field.type === 'select') return 'w-48';
  if (field.type === 'date') return 'w-40';
  if (field.type === 'number') return 'w-32';
  
  // 根据字段ID推断宽度
  if (field.id.includes('description')) return 'flex-1';
  if (field.id.includes('email')) return 'w-64';
  if (field.id.includes('phone')) return 'w-44';
  if (field.id.includes('name')) return 'w-48';
  
  // 默认宽度
  return 'w-48';
}
```

### 2. 表单数据持久化

```typescript
// /contexts/OrderContext.tsx

export const OrderProvider = ({ children }) => {
  // 🔥 初始化时从 localStorage 加载数据
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cosun_orders');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse orders from localStorage:', error);
          return [];
        }
      }
    }
    return [];
  });

  // 🔥 每次状态更新时自动保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cosun_orders', JSON.stringify(orders));
    }
  }, [orders]);

  // 🔥 添加订单
  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Pending'
    };

    setOrders(prev => [...prev, newOrder]);
    
    // 🔥 触发通知
    addNotification({
      type: 'order',
      title: 'New Order Created',
      message: `Order ${newOrder.id} has been created`,
      recipientRole: 'Procurement',
      relatedId: newOrder.id
    });

    return newOrder;
  };

  // 🔥 更新订单状态
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          : order
      )
    );

    // 🔥 根据状态变更触发通知
    const notificationRule = statusChangeNotificationRules.order[
      `${oldStatus} → ${newStatus}`
    ];
    
    if (notificationRule) {
      notificationRule.notifyRoles.forEach(role => {
        addNotification({
          type: 'order',
          title: 'Order Status Updated',
          message: notificationRule.message,
          recipientRole: role,
          relatedId: orderId,
          priority: notificationRule.priority,
          actionLabel: notificationRule.action
        });
      });
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      addOrder,
      updateOrderStatus,
      // ... 其他方法
    }}>
      {children}
    </OrderContext.Provider>
  );
};
```

### 3. 角色专属视图过滤

```typescript
// /components/admin/AdminActiveOrders.tsx

import { useAuth } from '../../hooks/useAuth';
import { useOrder } from '../../contexts/OrderContext';

export function AdminActiveOrders() {
  const { currentUser } = useAuth();
  const { orders } = useOrder();

  // 🔥 根据角色过滤订单
  const filteredOrders = orders.filter(order => {
    // CEO/CFO 看所有订单
    if (['CEO', 'CFO'].includes(currentUser.role)) {
      return true;
    }

    // 销售总监看所有区域
    if (currentUser.role === 'Sales_Manager' && currentUser.region === 'all') {
      return true;
    }

    // 区域主管看自己区域的订单
    if (currentUser.role === 'Sales_Manager') {
      return order.region === currentUser.region;
    }

    // 业务员只看自己创建的订单
    if (currentUser.role === 'Sales_Rep') {
      return order.createdBy === currentUser.id;
    }

    // 财务看所有订单（用于财务管理）
    if (currentUser.role === 'Finance') {
      return true;
    }

    // 采购看所有订单（用于采购管理）
    if (currentUser.role === 'Procurement') {
      return true;
    }

    return false;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>订单编号</TableHead>
          <TableHead>客户名称</TableHead>
          <TableHead>区域</TableHead>
          <TableHead>订单金额</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredOrders.map(order => (
          <TableRow key={order.id}>
            <TableCell>{order.id}</TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell>
              <Badge>{order.region}</Badge>
            </TableCell>
            <TableCell>${order.totalAmount.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(order.status)}>
                {order.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" onClick={() => handleViewOrder(order.id)}>
                查看
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 🎯 最佳实践建议

### 1. 表单模板配置管理

✅ **推荐做法：**
- 所有表单字段定义集中在配置文件中（`/config/formTemplates*.ts`）
- 使用版本号管理模板变更（v1.0.0 → v1.1.0）
- 字段变更时记录变更日志（changeLog）
- 使用 TypeScript 接口确保类型安全

❌ **避免做法：**
- 在组件中硬编码字段定义
- 直接修改表单组件代码来更新字段
- 不记录版本变更历史

### 2. 状态管理

✅ **推荐做法：**
- 使用 React Context API 进行全局状态管理
- 状态更新时同时更新 localStorage 和内存状态
- 使用 useEffect 监听状态变化并持久化
- 状态变更时触发相关通知

❌ **避免做法：**
- 在组件内部使用 useState 管理全局表单数据
- 不进行数据持久化
- 状态变更后不更新关联表单

### 3. 权限控制

✅ **推荐做法：**
- 使用 RBAC（基于角色的访问控制）
- 在 Context 层面过滤数据（减少组件复杂度）
- 使用权限矩阵配置（`/lib/rbac-config.ts`）
- 敏感操作增加二次确认

❌ **避免做法：**
- 在每个组件中重复权限判断逻辑
- 客户端仅依靠 UI 隐藏（应配合服务端验证）

### 4. 数据同步

✅ **推荐做法：**
- 使用统一的 ID 生成规则（如 `INQ-2025-0001`）
- 表单之间使用 `relatedId` 建立关联
- 状态变更时同步更新关联表单
- 使用通知系统告知相关角色

❌ **避免做法：**
- 手动管理表单之间的关联关系
- 状态更新后不同步关联表单
- 缺少审计日志（谁在何时做了什么）

### 5. 性能优化

✅ **推荐做法：**
- 使用 React.memo 避免不必要的重渲染
- 表单列表使用虚拟滚动（大数据量）
- localStorage 数据定期清理归档数据
- 使用 useCallback 缓存回调函数

❌ **避免做法：**
- 在每次渲染时重新创建对象/函数
- 不限制 localStorage 数据大小
- 一次性加载所有历史数据

---

## 📚 相关文档

- [RBAC权限配置说明](/docs/RBAC-权限配置说明.md)
- [智能通知规则系统](/docs/smart-notification-system.md)
- [表单库管理用户指南](/docs/FormLibraryManagement-UserGuide.md)
- [订单全流程业务逻辑](/docs/workflow-inquiry-to-contract-readme.md)

---

## 🔧 技术栈

- **前端框架:** React 18 + TypeScript
- **状态管理:** React Context API
- **数据持久化:** localStorage (客户端) + Supabase KV Store (服务端)
- **UI组件库:** shadcn/ui + Tailwind CSS
- **权限管理:** RBAC (Role-Based Access Control)
- **表单验证:** React Hook Form + Zod (可选)

---

**最后更新时间:** 2025-12-10  
**文档维护者:** COSUN 技术团队
