# 客户侧权限中心 TypeScript 类型草案

## 一、目标

本文用于定义客户侧 Permission Center 的前端 TypeScript 类型草案，方便：

- 前端页面建模
- service 返回值建模
- adapter/config 建模
- i18n copy 建模

目标：

- 尽量贴近现有权限中心分层
- 角色、模块、矩阵、scope、日志分别建模
- 保留 code 与 display name 双层表达

---

## 二、基础枚举建议

```ts
export type CustomerPermissionLocale = 'en' | 'es' | 'pt' | 'ar';

export type CustomerRoleCode =
  | 'Company_Owner'
  | 'Company_Admin'
  | 'Purchase_Manager'
  | 'Purchaser'
  | 'Finance'
  | 'Warehouse_Receiver'
  | 'Viewer';

export type CustomerRoleCategory =
  | 'management'
  | 'administration'
  | 'business'
  | 'support'
  | 'operations'
  | 'read_only';

export type CustomerSpecialControlCode =
  | 'all_company_data'
  | 'department_scope'
  | 'assigned_or_self'
  | 'financial_access'
  | 'assigned_data'
  | 'read_only_scope';

export type CustomerModuleGroupCode =
  | 'core'
  | 'business'
  | 'administration';

export type CustomerModuleCode =
  | 'dashboard'
  | 'message-center'
  | 'document-center'
  | 'company-profile'
  | 'member-directory'
  | 'my-products'
  | 'inquiry-center'
  | 'order-center'
  | 'contract-center'
  | 'invoice-statement-center'
  | 'shipment-receiving'
  | 'after-sales-service'
  | 'permission-center'
  | 'approval-center'
  | 'operation-logs';

export type CustomerActionCode =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve';

export type CustomerScopeCode =
  | 'all_company'
  | 'department'
  | 'department_and_sub'
  | 'self'
  | 'assigned';

export type CustomerExceptionTypeCode =
  | 'temporary_module_access'
  | 'temporary_approval_permission'
  | 'temporary_data_scope_expansion'
  | 'acting_on_behalf'
  | 'emergency_business_access';

export type CustomerPermissionChangeTypeCode =
  | 'role_created'
  | 'role_updated'
  | 'role_deleted'
  | 'menu_permission_changed'
  | 'action_permission_changed'
  | 'data_scope_changed'
  | 'exception_authorization_added'
  | 'exception_authorization_updated'
  | 'exception_authorization_revoked'
  | 'changes_published';
```

---

## 三、基础实体类型

```ts
export interface CustomerPermissionRole {
  roleCode: CustomerRoleCode;
  roleName: string;
  category: CustomerRoleCategory;
  categoryLabel: string;
  specialControlCode: CustomerSpecialControlCode;
  specialControlLabel: string;
  responsibilityDescription: string;
  isSystemTemplate: boolean;
  isEditable: boolean;
  sortOrder: number;
}

export interface CustomerPermissionModule {
  moduleCode: CustomerModuleCode;
  moduleName: string;
  moduleGroupCode: CustomerModuleGroupCode;
  moduleGroupName: string;
  parentModuleCode?: CustomerModuleCode | null;
  sortOrder: number;
  isVisibleInMatrix: boolean;
}

export interface CustomerPermissionModuleGroup {
  moduleGroupCode: CustomerModuleGroupCode;
  moduleGroupName: string;
  items: CustomerPermissionModule[];
}
```

---

## 四、矩阵类型

```ts
export type CustomerMenuPermissionMatrix = Record<
  CustomerRoleCode,
  Partial<Record<CustomerModuleCode, boolean>>
>;

export type CustomerActionPermissionSet = Record<CustomerActionCode, boolean>;

export interface CustomerModuleActionRow {
  roleCode: CustomerRoleCode;
  roleName: string;
  permissions: CustomerActionPermissionSet;
}

export interface CustomerModuleActionMatrix {
  moduleCode: CustomerModuleCode;
  moduleName: string;
  actions: CustomerActionCode[];
  rows: CustomerModuleActionRow[];
}

export type CustomerScopeMatrix = Record<
  CustomerRoleCode,
  Partial<Record<CustomerModuleCode, CustomerScopeCode>>
>;
```

---

## 五、数据范围类型

```ts
export interface CustomerScopeOption {
  scopeCode: CustomerScopeCode;
  scopeName: string;
  description: string;
}

export interface CustomerModuleScopeDetail {
  moduleCode: CustomerModuleCode;
  moduleName: string;
  roleCode: CustomerRoleCode;
  roleName: string;
  selectedScope: CustomerScopeCode;
  availableScopes: CustomerScopeOption[];
}
```

---

## 六、例外授权类型

```ts
export interface CustomerUserPermissionException {
  id: string;
  targetUserId: string;
  targetUserName: string;
  baseRoleCode: CustomerRoleCode;
  baseRoleName: string;
  exceptionTypeCode: CustomerExceptionTypeCode;
  exceptionTypeName: string;
  targetModuleCode: CustomerModuleCode;
  targetModuleName: string;
  permissions: Partial<Record<CustomerActionCode, boolean>>;
  scopeCode?: CustomerScopeCode | null;
  effectivePermissionScope: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  status: 'active' | 'revoked' | 'expired';
}
```

---

## 七、变更日志类型

```ts
export interface CustomerPermissionChangeLog {
  id: string;
  operatorId: string | null;
  operatorName: string;
  changeTypeCode: CustomerPermissionChangeTypeCode;
  changeTypeName: string;
  targetType: 'role' | 'module' | 'menu_matrix' | 'action_matrix' | 'scope_matrix' | 'exception' | 'publish_batch';
  targetCode?: string | null;
  content: string;
  createdAt: string;
}
```

---

## 八、页面数据类型

```ts
export interface CustomerRoleOverviewPageData {
  roles: CustomerPermissionRole[];
}

export interface CustomerMenuPermissionMatrixPageData {
  roles: Array<Pick<CustomerPermissionRole, 'roleCode' | 'roleName'>>;
  modules: CustomerPermissionModuleGroup[];
  matrix: CustomerMenuPermissionMatrix;
}

export interface CustomerActionsDataScopePageData {
  moduleGroups: CustomerPermissionModuleGroup[];
  selectedModuleCode: CustomerModuleCode;
  actionMatrix: CustomerModuleActionMatrix;
  selectedRoleCode: CustomerRoleCode;
  scopeDetail: CustomerModuleScopeDetail;
}

export interface CustomerUserExceptionPageData {
  items: CustomerUserPermissionException[];
}

export interface CustomerChangeLogPageData {
  items: CustomerPermissionChangeLog[];
  total: number;
}
```

---

## 九、API 返回类型

```ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## 十、保存类 payload 类型

```ts
export interface SaveCustomerMenuMatrixChange {
  roleCode: CustomerRoleCode;
  moduleCode: CustomerModuleCode;
  visible: boolean;
}

export interface SaveCustomerMenuMatrixPayload {
  changes: SaveCustomerMenuMatrixChange[];
}

export interface SaveCustomerModuleActionChange {
  roleCode: CustomerRoleCode;
  permissions: Partial<Record<CustomerActionCode, boolean>>;
}

export interface SaveCustomerModuleActionsPayload {
  moduleCode: CustomerModuleCode;
  changes: SaveCustomerModuleActionChange[];
}

export interface SaveCustomerModuleScopePayload {
  moduleCode: CustomerModuleCode;
  roleCode: CustomerRoleCode;
  scopeCode: CustomerScopeCode;
}

export interface CreateCustomerUserExceptionPayload {
  targetUserId: string;
  baseRoleCode: CustomerRoleCode;
  exceptionTypeCode: CustomerExceptionTypeCode;
  targetModuleCode: CustomerModuleCode;
  permissions: Partial<Record<CustomerActionCode, boolean>>;
  scopeCode?: CustomerScopeCode | null;
  reason: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface PublishCustomerPermissionChangesPayload {
  changeSummary: {
    roleChanges: number;
    menuMatrixChanges: number;
    actionChanges: number;
    scopeChanges: number;
    exceptionChanges: number;
  };
}
```

---

## 十一、i18n Copy 类型

```ts
export interface CustomerPermissionCenterCopy {
  title: string;
  subtitle: string;
  resetChanges: string;
  publishChanges: string;
  tabs: {
    roleOverview: string;
    menuMatrix: string;
    actionsScope: string;
    userException: string;
    changeLog: string;
  };
  roleOverview: {
    searchPlaceholder: string;
    allCategories: string;
    newRole: string;
    headers: {
      roleName: string;
      roleCode: string;
      category: string;
      specialControl: string;
      responsibility: string;
      actions: string;
    };
  };
  menuMatrix: {
    title: string;
    expandAll: string;
    collapseAll: string;
    systemMenuNodes: string;
  };
  actionsScope: {
    searchPlaceholder: string;
    headers: {
      roleName: string;
      view: string;
      create: string;
      edit: string;
      delete: string;
      approve: string;
    };
    scopeTitle: string;
    scopeDescription: string;
  };
  userException: {
    notice: string;
    searchPlaceholder: string;
    allTypes: string;
    newEntry: string;
  };
  changeLog: {
    startDate: string;
    endDate: string;
    searchPlaceholder: string;
    filterLogs: string;
    resetFilters: string;
    exportAuditReport: string;
  };
}
```

---

## 十二、Config 类型

```ts
export interface CustomerPermissionCenterConfig {
  roles: CustomerPermissionRole[];
  moduleGroups: CustomerPermissionModuleGroup[];
  menuMatrixBaseline: CustomerMenuPermissionMatrix;
  actionMatrixBaseline: Partial<Record<CustomerModuleCode, CustomerModuleActionRow[]>>;
  scopeMatrixBaseline: CustomerScopeMatrix;
}
```

---

## 十三、Hook 返回值建议

如果客户侧也做编辑器 hook，建议类型如下：

```ts
export interface UseCustomerPermissionEditorResult {
  hasUnsavedChanges: boolean;
  selectedModuleCode: CustomerModuleCode | null;
  selectedRoleCode: CustomerRoleCode | null;
  menuMatrix: CustomerMenuPermissionMatrix;
  updateMenuVisibility: (roleCode: CustomerRoleCode, moduleCode: CustomerModuleCode, visible: boolean) => void;
  updateModuleActions: (
    moduleCode: CustomerModuleCode,
    roleCode: CustomerRoleCode,
    permissions: Partial<Record<CustomerActionCode, boolean>>
  ) => void;
  updateModuleScope: (moduleCode: CustomerModuleCode, roleCode: CustomerRoleCode, scopeCode: CustomerScopeCode) => void;
  publishChanges: () => Promise<void>;
  resetChanges: () => void;
}
```

---

## 十四、建议落地文件

建议新增：

- `src/components/dashboard/customer-permission-center/customerPermissionCenterTypes.ts`

可按本文档拆出：

- 基础枚举
- 实体类型
- 页面数据类型
- payload 类型
- copy 类型

---

## 十五、关键约束

类型层面必须明确以下事实：

1. `CustomerRoleCode` 中必须包含 `Purchaser`
2. `CustomerModuleCode` 中必须包含 `my-products`
3. `Purchaser` 与 `my-products` 的默认关系应能在 config 中直接表达
4. locale 类型必须只面向客户侧门户语言

