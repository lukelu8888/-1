# 采购订单接口文档（CG 开头 = 采购请求）

## 说明

在**采购订单**模块中，**采购单号以 `CG-` 开头的记录表示「采购请求」**（由销售合同推单生成或采购员新建）。  
本接口用于采购员查询、新建、更新、删除这类采购订单数据。

**采购单号规则：** `CG-{区域}-{YYMMDD}-{序号}`  
示例：`CG-North America-260211-0003`、`CG-NA-260313-0001`

---

## 基础信息

| 项目 | 说明 |
|------|------|
| **Base URL** | `https://api.cosunchina.com`（或当前部署的 API 域名） |
| **认证方式** | Bearer Token（登录后获取） |
| **Content-Type** | `application/json` |
| **Accept** | `application/json` |

请求头示例：

```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

---

## 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/purchase-orders` | 获取采购订单列表（含 CG 开头的采购请求） |
| POST | `/api/purchase-orders` | 新建采购订单 |
| PATCH | `/api/purchase-orders/{poRef}` | 更新采购订单 |
| DELETE | `/api/purchase-orders/{poRef}` | 删除采购订单 |

---

## 1. 获取采购订单列表

**GET** `/api/purchase-orders`

返回当前用户有权限查看的采购订单，**包含所有「采购请求」来源及采购单号以 `CG-` 开头的记录**。

### 请求

- 无 Query 参数（可选后续扩展分页、筛选）。

### 响应示例

```json
{
  "purchaseOrders": [
    {
      "id": "uuid-xxx",
      "poNumber": "CG-North America-260211-0003",
      "requirementNo": "QR-NA-260211-0001",
      "sourceRef": "CG-North America-260211-0003",
      "sourceSONumber": "CG-North America-260211-0003",
      "orderGroup": null,
      "isPartOfGroup": null,
      "groupTotalOrders": null,
      "groupNote": null,
      "rfqId": null,
      "rfqNumber": null,
      "selectedQuote": null,
      "supplierName": "待选择供应商",
      "supplierCode": "TBD",
      "supplierContact": null,
      "supplierPhone": null,
      "supplierAddress": null,
      "region": "NA",
      "items": [
        {
          "id": "item-uuid",
          "productName": "产品名称",
          "modelNo": "-",
          "specification": null,
          "quantity": 4,
          "unit": "PCS",
          "unitPrice": 0,
          "currency": "USD",
          "subtotal": 0,
          "hsCode": null,
          "packingRequirement": null,
          "remarks": null
        }
      ],
      "totalAmount": 0,
      "currency": "USD",
      "paymentTerms": "待确认",
      "deliveryTerms": "待确认",
      "orderDate": "2026-02-11",
      "expectedDate": "2026-03-13",
      "actualDate": null,
      "status": "pending",
      "paymentStatus": "unpaid",
      "remarks": "",
      "createdBy": "user@example.com",
      "createdDate": "2026-02-11",
      "updatedDate": "2026-02-11T12:00:00.000000Z"
    }
  ]
}
```

### 响应字段说明（列表项）

| 字段 | 类型 | 说明 |
|------|------|------|
| **id** | string | 采购订单唯一标识（requirement_uid） |
| **poNumber** | string | 采购单号，**CG 开头表示采购请求** |
| **requirementNo** | string | 需求编号（如 QR-NA-260211-0001） |
| **sourceRef** | string | 来源引用，通常与 poNumber 一致 |
| **sourceSONumber** | string | 来源销售订单号 |
| **supplierName** | string | 供应商名称（待选择时为「待选择供应商」） |
| **supplierCode** | string | 供应商编码（待选为 TBD） |
| **region** | string | 区域代码：NA / SA / EA |
| **items** | array | 明细行，见下表 |
| **totalAmount** | number | 采购总额 |
| **currency** | string | 币种 |
| **orderDate** | string | 订单日期 YYYY-MM-DD |
| **expectedDate** | string | 期望交货/报价期限 YYYY-MM-DD |
| **status** | string | 状态：pending / confirmed / producing / shipped / completed / cancelled |
| **paymentStatus** | string | 付款状态：unpaid / partial / paid |
| **createdBy** | string | 创建人邮箱 |
| **createdDate** | string | 创建日期 |

**items 元素：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 明细行 ID |
| productName | string | 产品名称 |
| modelNo | string | 型号 |
| specification | string | 规格 |
| quantity | number | 数量 |
| unit | string | 单位（如 PCS） |
| unitPrice | number | 单价 |
| currency | string | 币种 |
| subtotal | number | 小计 |
| hsCode | string | 海关编码 |
| packingRequirement | string | 包装要求 |
| remarks | string | 备注 |

### 权限与过滤

- 需登录（Bearer Token）。
- 非内部角色（如非 admin、非采购/销售/财务等）仅能看自己创建的订单（`created_by` = 当前用户邮箱）。

---

## 2. 新建采购订单

**POST** `/api/purchase-orders`

创建一条采购订单（采购请求）。若 `poNumber` 已存在则幂等返回已有记录。

### 请求体示例

```json
{
  "poNumber": "CG-NA-260313-0001",
  "requirementNo": "",
  "sourceRef": "CG-NA-260313-0001",
  "sourceSONumber": "",
  "supplierName": "待选择供应商",
  "supplierCode": "TBD",
  "region": "NA",
  "items": [
    {
      "productName": "产品名称",
      "modelNo": "MODEL-01",
      "specification": "规格说明",
      "quantity": 4,
      "unit": "PCS",
      "unitPrice": 10.5,
      "currency": "USD"
    }
  ],
  "totalAmount": 42,
  "currency": "USD",
  "paymentTerms": "待确认",
  "deliveryTerms": "待确认",
  "orderDate": "2026-03-13",
  "expectedDate": "2026-04-30",
  "status": "pending",
  "paymentStatus": "unpaid",
  "remarks": ""
}
```

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| **poNumber** | string | 采购单号，建议 CG-区域-YYMMDD-序号 |
| **items** | array | 至少一条明细 |
| **items[].productName** | string | 产品名称 |
| **items[].quantity** | integer | 数量，≥1 |
| **items[].unit** | string | 单位 |

### 响应

- **201 Created**：创建成功，body 中 `purchaseOrder` 为完整单条数据（结构同列表项）。
- **200 OK**：该 `poNumber` 已存在，返回 `message: "Purchase order already exists"` 及已有 `purchaseOrder`。
- **401**：未登录或 Token 无效。
- **422**：校验失败（如缺少必填字段）。
- **500**：服务端错误。

---

## 3. 更新采购订单

**PATCH** `/api/purchase-orders/{poRef}`

`poRef` 可为：采购单号（如 `CG-NA-260313-0001`）、需求编号（requirementNo）或订单 id（requirement_uid）。

### 请求体（均为可选）

可只传需要修改的字段，例如：

```json
{
  "status": "confirmed",
  "paymentStatus": "unpaid",
  "supplierName": "某某供应商",
  "supplierCode": "SUP001",
  "expectedDate": "2026-05-15",
  "remarks": "已选供应商"
}
```

常用可更新字段：`status`、`paymentStatus`、`supplierName`、`supplierCode`、`supplierContact`、`supplierPhone`、`supplierAddress`、`totalAmount`、`currency`、`paymentTerms`、`deliveryTerms`、`orderDate`、`expectedDate`、`actualDate`、`remarks`、`rfqId`、`rfqNumber`、`sourceSONumber`、`orderGroup`、`isPartOfGroup`、`groupTotalOrders`、`groupNote`、`selectedQuote`。

### 响应

- **200 OK**：返回 `message: "Purchase order updated"` 及更新后的 `purchaseOrder`。
- **404**：未找到该 `poRef`。
- **401**：未授权。

---

## 4. 删除采购订单

**DELETE** `/api/purchase-orders/{poRef}`

`poRef` 同上（采购单号 / 需求编号 / id）。删除后不可恢复。

### 响应

- **200 OK**：`{ "message": "Purchase order deleted" }`
- **404**：未找到该采购订单。
- **401**：未授权。

---

## 状态与业务含义（供展示用）

| status | 说明 |
|--------|------|
| pending | 待确认 |
| confirmed | 已确认 |
| producing | 生产中 |
| shipped | 已发货 |
| completed | 已完成 |
| cancelled | 已取消 |

| paymentStatus | 说明 |
|---------------|------|
| unpaid | 未付款 |
| partial | 部分付款 |
| paid | 已付款 |

| region | 说明 |
|--------|------|
| NA | North America |
| SA | South America |
| EA | Europe & Africa |

---

## 错误响应格式

- 校验错误（422）：`{ "message": "...", "errors": { "field": ["..."] } }`
- 业务错误（4xx/5xx）：`{ "message": "错误描述" }`

---

**文档版本：** 1.0  
**适用：** 采购订单模块中 CG 开头的采购请求数据的查询与维护。
