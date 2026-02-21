# 🏭 B2B外贸单证管理系统完整设计方案

## 目录
1. [业务全流程与单证节点映射](#业务全流程与单证节点映射)
2. [13项标准单证详解](#13项标准单证详解)
3. [角色与业务流程互动](#角色与业务流程互动)
4. [系统架构设计](#系统架构设计)
5. [数据库设计](#数据库设计)
6. [文件存储方案](#文件存储方案)
7. [智能提醒系统](#智能提醒系统)
8. [单证生成引擎](#单证生成引擎)

---

## 一、业务全流程与单证节点映射

### 1.1 业务流程图

```
阶段1: 询价 (Inquiry)
   │
   ↓
阶段2: 报价 (Quotation)
   │
   ↓
阶段3: 合同签订 (Contract Signing)  ← 触发点
   │                                  ├─ 生成D02 (销售合同)
   │                                  ├─ 判断D04 (国内运费免责)
   │                                  └─ 判断D10 (国际运费免责)
   ↓
阶段4: 采购 (Procurement)  ← 触发点
   │                         └─ 生成D07 (采购合同)
   ↓
阶段5: 生产/验货 (Production/QC)
   │
   ↓
阶段6: 备货 (Preparation)
   │
   ↓
阶段7: 出货通知 (Shipping Notice)  ← 触发点
   │                                 ├─ 通知物流 → D03 (国内运输)
   │                                 ├─ 通知报关行 → D05 (报关单)
   │                                 └─ 单证员接收任务
   ↓
阶段8: 订舱 (Booking)
   │
   ↓
阶段9: 报关 (Customs Clearance)  ← 触发点
   │                               ├─ D05 (报关单/装箱单/提运单)
   │                               ├─ D06 (委托报关合同)
   │                               └─ 判断D08 (报关费用免责)
   ↓
阶段10: 装船 (Loading)
   │       └─ B/L (提单)
   ↓
阶段11: 开船 (Vessel Departure)  ← 触发点
   │                              └─ D09 (国际运费发票)
   ↓
阶段12: 到港 (Arrival)
   │
   ↓
阶段13: 收汇 (Payment Collection)  ← 触发点
   │                                 └─ D11 (收汇水单)
   ↓
阶段14: 结汇 (FX Settlement)  ← 触发点
   │                            ├─ D12 (结汇水单)
   │                            └─ D13 (退税收汇凭证表)
   ↓
阶段15: 退税申报 (Tax Refund)  ← 触发点
   │                            └─ D01 (出口退税申报表)
   ↓
阶段16: 归档 (Archived)
```

### 1.2 单证触发逻辑表

| 业务节点 | 触发的单证 | 自动/手动 | 责任人 | 数据来源 |
|---------|-----------|----------|--------|---------|
| 合同签订 | D02, D04, D10 | 自动生成 | 系统+业务员 | 销售合同数据 |
| 采购 | D07 | 自动生成 | 系统+采购 | 采购合同数据 |
| 出货通知 | D03 | 外部上传 | 物流部 | 运输公司 |
| 报关 | D05, D06, D08 | 外部上传+自动 | 报关行+系统 | 报关系统 |
| 开船 | D09 | 外部上传 | 货代 | 货代公司 |
| 收汇 | D11 | 外部上传 | 财务部 | 银行水单 |
| 结汇 | D12, D13 | 外部上传+自动 | 财务部+系统 | 银行+系统 |
| 退税 | D01 | 自动生成 | 系统+单证员 | 汇总数据 |

---

## 二、13项标准单证详解

### 2.1 单证清单表

| 编号 | 单证名称 | 英文名称 | 分类 | 生成方式 | 重要性 | 依赖关系 |
|------|---------|---------|------|---------|--------|---------|
| D01 | 出口退税申报表 | Export Tax Refund Declaration | 税务 | 系统自动 | ⭐⭐⭐⭐⭐ | D05+D11+D12+D13 |
| D02 | 购销合同/发票/付款凭证 | Sales Contract/Invoice/Payment | 贸易 | 系统自动 | ⭐⭐⭐⭐⭐ | 无 |
| D03 | 国内运输单据及运费凭证 | Domestic Transport Documents | 物流 | 外部上传 | ⭐⭐⭐ | 出货通知 |
| D04 | 国内运费免责声明 | Domestic Freight Waiver | 物流 | 系统自动 | ⭐⭐ | D02 (Incoterm) |
| D05 | 报关单/装箱单/提运单 | Customs/Packing List/B/L | 报关 | 外部上传 | ⭐⭐⭐⭐⭐ | D02+装箱清单 |
| D06 | 委托报关合同及费用凭证 | Customs Brokerage Contract | 报关 | 外部上传 | ⭐⭐⭐ | D05 |
| D07 | 采购发票及付款凭证 | Purchase Invoice/Payment | 贸易 | 系统自动 | ⭐⭐⭐⭐ | 采购合同 |
| D08 | 报关费用免责声明 | Customs Fee Waiver | 报关 | 系统自动 | ⭐⭐ | D02 (条款) |
| D09 | 国际运费发票及付款凭证 | Intl Freight Invoice | 物流 | 外部上传 | ⭐⭐⭐ | D05 (B/L) |
| D10 | 国际运费免责声明 | Intl Freight Waiver | 物流 | 系统自动 | ⭐⭐ | D02 (Incoterm) |
| D11 | 收汇水单 | FX Receipt | 财务 | 外部上传 | ⭐⭐⭐⭐⭐ | D02+D05 |
| D12 | 结汇水单 | FX Settlement | 财务 | 外部上传 | ⭐⭐⭐⭐⭐ | D11 |
| D13 | 出口退税收汇凭证表 | Tax Refund FX Certificate | 税务 | 系统自动 | ⭐⭐⭐⭐⭐ | D12 |

### 2.2 Incoterm自动判断逻辑

| Incoterm | D04 (国内运费) | D08 (报关费) | D10 (国际运费) | 说明 |
|----------|---------------|-------------|---------------|-----|
| EXW | 需要 | 需要 | 需要 | 买方承担所有运费 |
| FCA | 需要 | 需要 | 需要 | 卖方送到指定地点后，买方承担 |
| FOB | 自动生成免责 | 自动判断 | 自动生成免责 | 卖方只承担到港口费用 |
| CFR | 自动生成免责 | 自动判断 | 需要 | 卖方承担海运费 |
| CIF | 自动生成免责 | 自动判断 | 需要 | 卖方承担海运费+保险 |

**系统逻辑示例：**
```typescript
function autoGenerateWaiverDocuments(incoterm: string, contract: Contract) {
  const waivers = [];
  
  // D04 国内运费免责
  if (['FOB', 'CFR', 'CIF'].includes(incoterm)) {
    waivers.push({
      docId: 'D04',
      status: 'auto_generated',
      content: generateDomesticFreightWaiver(contract, incoterm)
    });
  }
  
  // D10 国际运费免责
  if (['EXW', 'FCA', 'FOB'].includes(incoterm)) {
    waivers.push({
      docId: 'D10',
      status: 'auto_generated',
      content: generateIntlFreightWaiver(contract, incoterm)
    });
  }
  
  return waivers;
}
```

---

## 三、角色与业务流程互动

### 3.1 角色权限矩阵

| 角色 | 创建 | 上传 | 审核 | 批准 | 下载 | 归档 | 查看范围 |
|------|-----|------|-----|------|-----|------|---------|
| 业务员 | D02 | ✓ | - | - | 自己的 | - | 自己负责的订单 |
| 采购 | D07 | ✓ | - | - | 相关 | - | 采购相关单证 |
| 单证员 | 全部 | ✓ | ✓ | - | ✓ | ✓ | 全部订单 |
| 财务 | D11/D12 | ✓ | ✓ | ✓ | ✓ | - | 全部订单（财务相关） |
| 报关行 | D05/D06 | ✓ | - | - | 相关 | - | 报关相关单证 |
| 物流 | D03/D09 | ✓ | - | - | 相关 | - | 物流相关单证 |
| CEO/CFO | - | - | - | ✓ | ✓ | - | 全部订单 |

### 3.2 协作流程图

```
业务员（张伟）
  │
  ├─ [12/01] 合同签订 SC-NA-20251201-001
  │   └─ 触发：系统自动生成D02、D04、D10
  │
  ├─ [12/01] 通知采购部：请采购订单商品
  │   └─ 采购部接收任务
  │
  ├─ [12/10] 发起出货通知（Shipping Notice）
  │   ├─ 通知物流部：安排国内运输
  │   ├─ 通知报关行：准备报关
  │   └─ 通知单证员：开始单证流程
  │
  └─ [持续] 跟进客户付款

采购部（李采购）
  │
  ├─ [12/05] 签订采购合同 PC-20251205-001
  │   └─ 触发：系统自动生成D07
  │
  └─ [12/07] 上传付款凭证
      └─ D07完成

物流部（王物流）
  │
  ├─ [12/10] 接收出货通知
  ├─ [12/12] 安排国内运输
  └─ [12/15] 上传D03（运输单据+运费发票）

报关行（赵报关）
  │
  ├─ [12/10] 接收出货通知
  ├─ [12/14] 完成报关
  ├─ [12/15] 上传D05（报关单/装箱单/提运单）⚠️ 超期
  └─ [12/16] 上传D06（委托报关合同+费用）

单证员（李单证）⭐ 核心角色
  │
  ├─ [实时] 监控单证进度
  │   ├─ D02 ✓ 已批准
  │   ├─ D04 ✓ 自动生成
  │   ├─ D05 ⚠️ 超期2天
  │   ├─ D07 ✓ 已批准
  │   ├─ D10 ✓ 自动生成
  │   └─ D11/D12/D13 ⏳ 等待收汇
  │
  ├─ [12/15] 发现D05超期 → 催促报关行
  │
  ├─ [12/16] 收到D05 → 审核通过
  │
  ├─ [等待] 等待财务部收汇（D11）
  │
  └─ [收汇后] 协助财务完成D12、生成D13、制作D01

财务部（钱财务）
  │
  ├─ [12/01] 审核D02付款条款
  ├─ [12/08] 审核D07付款凭证
  ├─ [等待] 等待客户付款（T/T 70%尾款）
  ├─ [收汇时] 上传D11（银行收汇水单）
  ├─ [收汇后5天] 完成结汇，上传D12
  └─ [结汇后] 协助单证员完成退税申报D01

最终归档
  │
  └─ [完成] 单证员打包所有13项单证
      ├─ 生成退税申报资料包
      ├─ 提交税务部门
      └─ 系统归档（Supabase Storage）
```

---

## 四、系统架构设计

### 4.1 模块架构图

```
┌─────────────────────────────────────────────────────────┐
│              前端界面层 (React + TypeScript)              │
├─────────────────────────────────────────────────────────┤
│  工作台    │  订单详情  │  文档库  │  报表  │  设置    │
├─────────────────────────────────────────────────────────┤
│                     业务逻辑层                            │
├─────────────────────────────────────────────────────────┤
│  单证管理  │  流程引擎  │  审批流  │  提醒  │  权限    │
├─────────────────────────────────────────────────────────┤
│                     数据访问层                            │
├─────────────────────────────────────────────────────────┤
│  订单数据  │  单证数据  │  文件数据 │  用户  │  日志   │
├─────────────────────────────────────────────────────────┤
│                  Supabase 后端服务                        │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL │  Storage  │  Auth  │  Functions │ Realtime│
└─────────────────────────────────────────────────────────┘
```

### 4.2 核心功能模块

#### 模块1: 单证工作台
- **当前任务视图** - 显示进行中的订单
- **历史归档视图** - 已完成订单查询
- **紧急预警面板** - 超期/缺失提醒
- **SOP流程指引** - 13项单证标准流程

#### 模块2: 订单单证详情页
- **订单基本信息** - 合同、客户、贸易条款
- **业务时间轴** - 关键节点时间记录
- **13项单证状态** - 可视化网格展示
- **文件管理** - 上传/下载/版本控制
- **审批流追踪** - 审批历史记录
- **依赖关系图** - 单证依赖关系可视化

#### 模块3: 文档生成引擎
- **模板管理** - 13种单证模板库
- **数据映射** - 自动填充订单数据
- **预览编辑** - 生成前预览调整
- **多格式导出** - PDF/Excel/Word

#### 模块4: 文件存储系统
- **Supabase Storage** - 云端存储
- **目录结构** - 按订单/单证分类
- **版本控制** - 文件历史版本
- **权限管理** - RLS行级安全

#### 模块5: 智能提醒系统
- **截止日期提醒** - 基于业务节点自动计算
- **缺失单证提醒** - 实时监控
- **依赖阻塞提醒** - D01依赖D05/D11/D12/D13
- **超期预警** - 红色高亮+通知

---

## 五、数据库设计

### 5.1 核心表结构

#### 表1: orders（订单主表）
```sql
CREATE TABLE orders (
  order_id VARCHAR(50) PRIMARY KEY,
  contract_no VARCHAR(50) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  sales_rep_id VARCHAR(50) NOT NULL,
  business_stage VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  
  -- 贸易信息
  incoterm VARCHAR(10) NOT NULL,
  payment_term TEXT,
  total_value DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  dest_port VARCHAR(100),
  container VARCHAR(50),
  
  -- 关键日期
  contract_date DATE NOT NULL,
  procurement_date DATE,
  shipment_date DATE NOT NULL,
  customs_date DATE,
  etd DATE,
  eta DATE,
  collection_date DATE,
  settlement_date DATE,
  
  -- 统计字段
  completion_rate INTEGER DEFAULT 0,
  required_docs INTEGER DEFAULT 0,
  completed_docs INTEGER DEFAULT 0,
  missing_docs INTEGER DEFAULT 0,
  overdue_items INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (sales_rep_id) REFERENCES users(user_id)
);
```

#### 表2: document_instances（单证实例表）
```sql
CREATE TABLE document_instances (
  instance_id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  doc_id VARCHAR(10) NOT NULL,  -- D01-D13
  status VARCHAR(20) NOT NULL,
  
  -- 生成信息
  generation_type VARCHAR(20),  -- auto/manual/external/template
  auto_generated_at TIMESTAMP,
  
  -- 上传信息
  upload_date TIMESTAMP,
  upload_by VARCHAR(50),
  
  -- 审核信息
  reviewer VARCHAR(50),
  review_date TIMESTAMP,
  review_status VARCHAR(20),
  review_comments TEXT,
  
  -- 批准信息
  approver VARCHAR(50),
  approve_date TIMESTAMP,
  
  -- 版本控制
  version INTEGER DEFAULT 1,
  
  -- 其他
  urgency VARCHAR(20),
  remarks TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  INDEX idx_order_doc (order_id, doc_id)
);
```

#### 表3: document_files（文件表）
```sql
CREATE TABLE document_files (
  file_id VARCHAR(50) PRIMARY KEY,
  instance_id VARCHAR(50) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  doc_id VARCHAR(10) NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,  -- Supabase Storage路径
  storage_bucket VARCHAR(100) NOT NULL,
  
  upload_date TIMESTAMP DEFAULT NOW(),
  upload_by VARCHAR(50) NOT NULL,
  
  -- 文件校验
  checksum VARCHAR(64),  -- SHA256
  mime_type VARCHAR(100),
  
  -- 版本控制
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  
  -- 元数据
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (instance_id) REFERENCES document_instances(instance_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  INDEX idx_order_files (order_id),
  INDEX idx_instance_files (instance_id)
);
```

#### 表4: document_history（单证历史表）
```sql
CREATE TABLE document_history (
  history_id SERIAL PRIMARY KEY,
  instance_id VARCHAR(50) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  doc_id VARCHAR(10) NOT NULL,
  
  action VARCHAR(50) NOT NULL,  -- created/uploaded/reviewed/approved/rejected/revised
  action_by VARCHAR(50) NOT NULL,
  action_at TIMESTAMP DEFAULT NOW(),
  
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  
  comments TEXT,
  metadata JSONB,
  
  FOREIGN KEY (instance_id) REFERENCES document_instances(instance_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  INDEX idx_instance_history (instance_id),
  INDEX idx_order_history (order_id)
);
```

#### 表5: document_alerts（单证预警表）
```sql
CREATE TABLE document_alerts (
  alert_id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  doc_id VARCHAR(10) NOT NULL,
  
  alert_type VARCHAR(50) NOT NULL,  -- missing/overdue/pending_approval/dependency
  severity VARCHAR(20) NOT NULL,  -- critical/high/medium/low
  message TEXT NOT NULL,
  
  triggered_at TIMESTAMP DEFAULT NOW(),
  dismissed_at TIMESTAMP,
  dismissed_by VARCHAR(50),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  INDEX idx_active_alerts (is_active, severity),
  INDEX idx_order_alerts (order_id)
);
```

### 5.2 数据关系图

```
orders (订单主表)
  │
  ├─ 1:N → document_instances (单证实例)
  │           │
  │           ├─ 1:N → document_files (文件)
  │           └─ 1:N → document_history (历史)
  │
  └─ 1:N → document_alerts (预警)
```

---

## 六、文件存储方案

### 6.1 Supabase Storage目录结构

```
make-880fd43b-documents/
├── orders/
│   ├── SO-NA-20251210-001/
│   │   ├── D01/
│   │   │   ├── v1_退税申报表_20251220.pdf
│   │   │   └── v2_退税申报表_修订_20251221.pdf
│   │   ├── D02/
│   │   │   ├── v1_销售合同_20251201.pdf
│   │   │   ├── v2_销售合同_修订_20251202.pdf
│   │   │   └── 付款凭证_20251205.jpg
│   │   ├── D05/
│   │   │   ├── 报关单_20251214.pdf
│   │   │   ├── 装箱单_20251214.pdf
│   │   │   └── 提运单_20251214.pdf
│   │   └── ... (其他单证)
│   │
│   ├── SO-EU-20251208-003/
│   └── ... (其他订单)
│
├── templates/
│   ├── D01_出口退税申报表_模板.xlsx
│   ├── D02_销售合同_模板.docx
│   └── ... (其他模板)
│
└── archived/
    ├── 2025/
    │   ├── 01/
    │   ├── 02/
    │   └── ...
    └── 2024/
```

### 6.2 文件命名规范

**格式：** `v{版本号}_{单证名称}_{日期}_{备注}.{扩展名}`

**示例：**
- `v1_销售合同_20251201.pdf`
- `v2_销售合同_修订_20251202.pdf`
- `v1_报关单_海关盖章_20251214.pdf`
- `v1_收汇水单_中国银行_20251230.jpg`

### 6.3 文件上传流程

```typescript
async function uploadDocumentFile(
  orderId: string,
  docId: string,
  file: File,
  uploadBy: string
): Promise<DocumentFile> {
  
  // 1. 生成文件路径
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `v1_${docId}_${timestamp}.${file.name.split('.').pop()}`;
  const storagePath = `orders/${orderId}/${docId}/${fileName}`;
  
  // 2. 上传到Supabase Storage
  const { data, error } = await supabase.storage
    .from('make-880fd43b-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // 3. 计算文件校验码
  const checksum = await calculateSHA256(file);
  
  // 4. 保存文件记录到数据库
  const fileRecord = {
    file_id: generateFileId(),
    instance_id: getInstanceId(orderId, docId),
    order_id: orderId,
    doc_id: docId,
    file_name: fileName,
    file_type: file.type,
    file_size: file.size,
    storage_path: data.path,
    storage_bucket: 'make-880fd43b-documents',
    checksum: checksum,
    upload_by: uploadBy,
    version: await getNextVersion(orderId, docId),
    is_latest: true
  };
  
  const { data: insertedFile } = await supabase
    .from('document_files')
    .insert(fileRecord)
    .select()
    .single();
  
  // 5. 更新单证实例状态
  await updateDocumentInstanceStatus(orderId, docId, 'uploaded', uploadBy);
  
  // 6. 记录历史
  await addDocumentHistory(orderId, docId, 'uploaded', uploadBy, `上传文件: ${fileName}`);
  
  return insertedFile;
}
```

### 6.4 文件下载流程

```typescript
async function downloadDocumentFile(
  fileId: string,
  userId: string
): Promise<{ url: string, fileName: string }> {
  
  // 1. 检查权限
  const hasPermission = await checkDownloadPermission(fileId, userId);
  if (!hasPermission) {
    throw new Error('无权限下载此文件');
  }
  
  // 2. 获取文件记录
  const { data: file } = await supabase
    .from('document_files')
    .select('*')
    .eq('file_id', fileId)
    .single();
  
  // 3. 生成签名URL（有效期1小时）
  const { data: signedUrl } = await supabase.storage
    .from('make-880fd43b-documents')
    .createSignedUrl(file.storage_path, 3600);
  
  // 4. 记录下载日志
  await logDownloadActivity(fileId, userId);
  
  return {
    url: signedUrl.signedUrl,
    fileName: file.file_name
  };
}
```

---

## 七、智能提醒系统

### 7.1 提醒规则引擎

```typescript
interface ReminderRule {
  docId: string;
  triggerType: 'deadline' | 'dependency' | 'status_change' | 'manual';
  condition: (order: Order, doc: DocumentInstance) => boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: (order: Order, doc: DocumentInstance) => string;
  recipients: (order: Order) => string[];
}

const REMINDER_RULES: ReminderRule[] = [
  {
    docId: 'D05',
    triggerType: 'deadline',
    condition: (order, doc) => {
      const deadline = addDays(order.customs_date, 3);
      const now = new Date();
      return now > deadline && doc.status !== 'approved';
    },
    severity: 'critical',
    message: (order, doc) => `订单${order.order_id}的D05报关单已超期，请立即上传`,
    recipients: (order) => ['单证员', '报关行', order.sales_rep_id]
  },
  {
    docId: 'D11',
    triggerType: 'deadline',
    condition: (order, doc) => {
      const deadline = addDays(order.shipment_date, 90);
      const now = new Date();
      const daysRemaining = differenceInDays(deadline, now);
      return daysRemaining <= 7 && doc.status === 'pending';
    },
    severity: 'high',
    message: (order, doc) => `订单${order.order_id}距离收汇截止日期还有${daysRemaining}天，请尽快跟进客户付款`,
    recipients: (order) => ['单证员', '财务部', order.sales_rep_id]
  },
  {
    docId: 'D01',
    triggerType: 'dependency',
    condition: (order, doc) => {
      const deps = ['D05', 'D11', 'D12', 'D13'];
      const allDepsReady = deps.every(depId => 
        order.documents[depId]?.status === 'approved'
      );
      return allDepsReady && doc.status === 'pending';
    },
    severity: 'medium',
    message: (order, doc) => `订单${order.order_id}的D01依赖单证已齐全，可以生成退税申报表`,
    recipients: (order) => ['单证员', '财务部']
  }
];
```

### 7.2 提醒触发时机

| 触发类型 | 检查频率 | 触发条件 | 通知方式 |
|---------|---------|---------|---------|
| 截止日期临近 | 每天凌晨2点 | 距离截止日期≤7天 | 邮件+系统通知 |
| 已超期 | 实时 | 超过截止日期 | 邮件+短信+系统弹窗 |
| 依赖满足 | 实时 | 前置单证全部完成 | 系统通知 |
| 状态变更 | 实时 | 单证状态改变 | 系统通知 |
| 审批待办 | 每4小时 | 有单证待审核 | 系统通知 |

### 7.3 提醒展示方式

**1. 工作台预警面板**
```tsx
<AlertPanel>
  <CriticalAlerts>
    {criticalAlerts.map(alert => (
      <AlertCard severity="critical">
        <AlertIcon />
        <AlertMessage>{alert.message}</AlertMessage>
        <AlertAction>立即处理</AlertAction>
      </AlertCard>
    ))}
  </CriticalAlerts>
</AlertPanel>
```

**2. 顶部通知栏**
```tsx
<TopBar>
  <NotificationBell badge={unreadCount}>
    <NotificationDropdown>
      {notifications.map(notif => (
        <NotificationItem>
          <NotificationIcon severity={notif.severity} />
          <NotificationText>{notif.message}</NotificationText>
          <NotificationTime>{notif.timestamp}</NotificationTime>
        </NotificationItem>
      ))}
    </NotificationDropdown>
  </NotificationBell>
</TopBar>
```

**3. 订单列表标记**
```tsx
<OrderRow className={order.alerts.length > 0 ? 'has-alerts' : ''}>
  {order.alerts.length > 0 && (
    <AlertBadge severity="critical">
      {order.alerts.length}项预警
    </AlertBadge>
  )}
</OrderRow>
```

---

## 八、单证生成引擎

### 8.1 模板系统

```typescript
interface DocumentTemplate {
  docId: string;
  templateName: string;
  templateType: 'pdf' | 'excel' | 'word';
  templatePath: string;
  dataMapping: DataMappingRule[];
  validationRules: ValidationRule[];
}

interface DataMappingRule {
  field: string;
  source: 'order' | 'customer' | 'contract' | 'computed';
  sourceField?: string;
  transformer?: (value: any, context: any) => any;
  required: boolean;
}

// 示例：D02销售合同模板
const D02_TEMPLATE: DocumentTemplate = {
  docId: 'D02',
  templateName: '销售合同模板',
  templateType: 'pdf',
  templatePath: 'templates/D02_销售合同_模板.docx',
  dataMapping: [
    {
      field: 'contractNo',
      source: 'contract',
      sourceField: 'contract_no',
      required: true
    },
    {
      field: 'contractDate',
      source: 'contract',
      sourceField: 'contract_date',
      transformer: (date) => formatDate(date, 'YYYY年MM月DD日'),
      required: true
    },
    {
      field: 'sellerName',
      source: 'computed',
      transformer: () => '福建高盛达富建材有限公司',
      required: true
    },
    {
      field: 'buyerName',
      source: 'order',
      sourceField: 'customer_name',
      required: true
    },
    {
      field: 'totalAmount',
      source: 'order',
      sourceField: 'total_value',
      transformer: (value, context) => `${context.currency} ${value.toLocaleString()}`,
      required: true
    },
    {
      field: 'incoterm',
      source: 'order',
      sourceField: 'incoterm',
      required: true
    },
    {
      field: 'paymentTerms',
      source: 'order',
      sourceField: 'payment_term',
      required: true
    },
    {
      field: 'shipmentDate',
      source: 'order',
      sourceField: 'shipment_date',
      transformer: (date) => formatDate(date, 'YYYY-MM-DD'),
      required: true
    },
    {
      field: 'destPort',
      source: 'order',
      sourceField: 'dest_port',
      required: true
    }
  ],
  validationRules: [
    {
      rule: 'required_fields',
      message: '必填字段不能为空'
    },
    {
      rule: 'valid_incoterm',
      message: 'Incoterm必须是有效的贸易术语'
    }
  ]
};
```

### 8.2 生成流程

```typescript
async function generateDocument(
  orderId: string,
  docId: string,
  userId: string
): Promise<DocumentFile> {
  
  // 1. 获取模板
  const template = await getTemplate(docId);
  
  // 2. 获取订单数据
  const order = await getOrder(orderId);
  const customer = await getCustomer(order.customer_id);
  const contract = await getContract(order.contract_no);
  
  // 3. 数据映射
  const mappedData = {};
  for (const mapping of template.dataMapping) {
    let value;
    
    switch (mapping.source) {
      case 'order':
        value = order[mapping.sourceField];
        break;
      case 'customer':
        value = customer[mapping.sourceField];
        break;
      case 'contract':
        value = contract[mapping.sourceField];
        break;
      case 'computed':
        value = mapping.transformer ? mapping.transformer(null, { order, customer, contract }) : null;
        break;
    }
    
    if (mapping.transformer && mapping.source !== 'computed') {
      value = mapping.transformer(value, { order, customer, contract });
    }
    
    if (mapping.required && !value) {
      throw new Error(`必填字段 ${mapping.field} 缺失`);
    }
    
    mappedData[mapping.field] = value;
  }
  
  // 4. 数据验证
  await validateDocumentData(mappedData, template.validationRules);
  
  // 5. 生成文档
  let generatedFile;
  
  switch (template.templateType) {
    case 'pdf':
      generatedFile = await generatePDF(template.templatePath, mappedData);
      break;
    case 'excel':
      generatedFile = await generateExcel(template.templatePath, mappedData);
      break;
    case 'word':
      generatedFile = await generateWord(template.templatePath, mappedData);
      break;
  }
  
  // 6. 上传到Storage
  const uploadedFile = await uploadDocumentFile(
    orderId,
    docId,
    generatedFile,
    userId
  );
  
  // 7. 更新单证状态
  await updateDocumentInstanceStatus(orderId, docId, 'auto_generated', 'system');
  
  // 8. 记录历史
  await addDocumentHistory(
    orderId,
    docId,
    'generated',
    userId,
    `系统自动生成${template.templateName}`
  );
  
  return uploadedFile;
}
```

### 8.3 自动生成时机

| 单证 | 触发事件 | 生成时机 | 数据来源 |
|------|---------|---------|---------|
| D02 | 合同签订 | 立即 | 销售合同表 |
| D04 | 合同签订 | 立即（如需要） | Incoterm判断 |
| D07 | 采购合同签订 | 立即 | 采购合同表 |
| D08 | 报关 | 立即（如需要） | 合同条款判断 |
| D10 | 合同签订 | 立即（如需要） | Incoterm判断 |
| D13 | 结汇完成 | D12上传后 | D12数据 |
| D01 | 依赖齐全 | D05+D11+D12+D13全部完成后 | 汇总数据 |

---

## 九、实施建议

### 9.1 分阶段实施计划

**Phase 1: 基础架构（2周）**
- 数据库设计与创建
- Supabase Storage配置
- 基础API开发

**Phase 2: 核心功能（3周）**
- 单证工作台开发
- 订单单证详情页
- 文件上传下载功能

**Phase 3: 智能功能（2周）**
- 自动生成引擎
- 智能提醒系统
- 审批流程

**Phase 4: 优化完善（2周）**
- 性能优化
- 用户体验优化
- 测试与修复

### 9.2 关键技术选型

| 技术栈 | 选型 | 理由 |
|-------|------|------|
| 前端框架 | React + TypeScript | 类型安全、生态成熟 |
| UI组件库 | Tailwind CSS + shadcn/ui | 灵活、美观、易定制 |
| 后端服务 | Supabase | 快速开发、内置Auth和Storage |
| 数据库 | PostgreSQL (Supabase) | 关系型、事务支持、JSON支持 |
| 文件存储 | Supabase Storage | 集成度高、S3兼容 |
| 文档生成 | docx/pdf-lib | 支持模板填充 |
| 状态管理 | React Context | 简单够用 |

### 9.3 注意事项

1. **数据安全**
   - 所有敏感数据加密存储
   - 使用RLS（Row Level Security）控制访问权限
   - 文件使用签名URL，限制访问时长

2. **性能优化**
   - 大文件上传使用分片上传
   - 列表查询添加分页和索引
   - 使用缓存减少数据库查询

3. **用户体验**
   - 提供清晰的SOP指引
   - 实时更新单证状态
   - 明确的错误提示和操作反馈

4. **业务流程**
   - 灵活适应不同Incoterm条款
   - 支持特殊情况的手动干预
   - 保留完整的操作历史记录

---

## 附录

### A. Incoterm贸易术语说明

| 术语 | 全称 | 卖方责任 | 买方责任 |
|------|------|---------|---------|
| EXW | Ex Works | 工厂交货 | 承担所有运输费用和风险 |
| FCA | Free Carrier | 交至承运人 | 指定地点后的所有费用 |
| FOB | Free On Board | 装船前所有费用 | 海运费、保险、进口费用 |
| CFR | Cost and Freight | 海运费 | 保险、进口费用 |
| CIF | Cost, Insurance and Freight | 海运费+保险 | 进口费用 |

### B. 单证制作检查清单

**D01 出口退税申报表**
- [ ] D05报关单原件
- [ ] D11收汇水单原件
- [ ] D12结汇水单原件
- [ ] D13收汇凭证情况表
- [ ] 销售合同复印件
- [ ] 采购发票复印件

**D05 报关单据**
- [ ] 销售合同
- [ ] 商业发票（Commercial Invoice）
- [ ] 装箱单（Packing List）
- [ ] 报关委托书
- [ ] 出口许可证（如需要）

**D11 收汇水单**
- [ ] 银行水单原件
- [ ] 外汇入账通知
- [ ] 发票号码对应
- [ ] 金额核对无误

---

**文档版本：** v1.0  
**最后更新：** 2025-12-11  
**作者：** THE COSUN BM 系统设计团队
