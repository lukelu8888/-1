import { supabase } from './supabase'
import { sanitizePersistedInquiryProducts } from './services/productMappingServices'
export {
  adminOrganizationService,
  externalPortalDirectoryService,
  sharedRoleUiPreferenceService,
  staffDirectoryService,
  uiPreferenceService,
} from './services/profileDirectoryServices'
export {
  customerOrganizationService,
  customerPortalProfileService,
  supplierOrganizationService,
  supplierPortalProfileService,
} from './services/portalOrganizationServices'
export {
  customerEnterpriseInvitationService,
  customerEnterpriseMemberService,
} from './services/customerEnterpriseServices'
export {
  inquiryOemFactoryDispatchService,
  inquiryOemService,
  paymentService,
} from './services/inquiryOemPaymentServices'
export {
  loadingInspectionOrderService,
  qcInspectionOrderService,
  supplierInspectionReportService,
} from './services/inspectionServices'
export {
  customerInquiryDraftService,
  productMappingEventService,
  productMasterService,
  productModelMappingService,
  sanitizePersistedInquiryProducts,
} from './services/productMappingServices'
export { companyService } from './services/companyServices'
export { adminLoginAuditService } from './services/adminLoginAuditService'
import { createSupplierQuotationService } from './services/supplierQuotationService'
import {
  createTemplateCenterService,
  isTemplateCenterSupabaseUnreachable,
  retryTemplateCenterSupabase,
} from './services/templateCenterService'
import {
  buildSupabaseError,
  extractCheckConstraintColumn,
  extractMissingColumn,
  fromRegionCode,
  handleError,
  isMissingColumnError,
  matchesCustomerEmailFallback,
  normalizeProfitRateForStorage,
  normalizeProfitRatePercent,
  shouldDowngradeProfitRate,
  throwSupabaseError,
  toIsoDate,
  toRegionCode,
  toUUID,
  toUUIDOrNull,
} from './services/supabaseCoreHelpers'
import { createApprovalRecordService } from './services/approvalRecordService'
import { createInquiryService } from './services/inquiryService'
import {
  createArService,
  createContractService,
  createOrderService,
} from './services/contractOrderArServices'
import {
  createApprovalService,
  createNotificationService,
  createNotificationSupabaseService,
} from './services/approvalNotificationServices'
import { createSalesQuotationService } from './services/salesQuotationService'
import {
  createQuotationRequestService,
  createXjService,
} from './services/xjQuotationRequestServices'
import {
  createPurchaseOrderService,
  createQuoteRequirementService,
} from './services/purchaseOrderQuoteRequirementServices'
import {
  allocateNextClientInquiryNumber,
  applyKnownMissingColumns,
  enrichInquiryRowWithTemplateData,
  enrichInquiryRowsWithTemplateData,
  hasKnownMissingColumn,
  insertInquiryWithServerAssignedNumber,
  isTransientSupabaseRequestError,
  isUuidLike,
  rememberMissingColumn,
  resolveBusinessDocumentTemplateBinding,
  updateInquiryRowViaRest,
  updateWithSchemaFallback,
  upsertWithSchemaFallback,
  upsertWithoutSelectWithSchemaFallback,
  withSupabaseTimeout,
} from './services/inquiryRuntimeHelpers'
export {
  isTemplateCenterSupabaseUnreachable,
  retryTemplateCenterSupabase,
} from './services/templateCenterService'
export { fromApprovalRow } from './services/approvalRecordService'
export type {
  ExternalPortalDirectoryEntry,
  StaffDirectoryProfile,
} from './services/profileDirectoryServices'
export {
  REGION_CODE_TO_NAME,
  REGION_NAME_TO_CODE,
  buildSupabaseError,
  extractCheckConstraintColumn,
  extractMissingColumn,
  fromRegionCode,
  handleError,
  isMissingColumnError,
  matchesCustomerEmailFallback,
  normalizeProfitRateForStorage,
  normalizeProfitRatePercent,
  shouldDowngradeProfitRate,
  throwSupabaseError,
  toIsoDate,
  toRegionCode,
  toUUID,
  toUUIDOrNull,
} from './services/supabaseCoreHelpers'
export {
  arrivalNoticeService,
  bookingQuoteRequestService,
  cargoReceiptService,
  consolidationPlanService,
  containerLoadPlanService,
  customerShipmentTrackingService,
  customsDeclarationService,
  deliveryConfirmationService,
  deliveryExceptionService,
  domesticTransferOrderService,
  exportRequirementCheckService,
  financeCompliancePacketService,
  importClearanceCoordinationService,
  loadingTaskService,
  loadingTaskItemService,
  postOrderFeedbackService,
  purchaseOrderExecutionStatusService,
  shipmentDocumentSetService,
  shipmentWorkflowSummaryService,
  shippingOrderService,
  thirdPartyWarehouseService,
  voyageTrackingService,
} from './services/postContractExecutionServices'
export {
  containerAllocationEngine,
  containerPlacementService,
  containerLoadingSolutionService,
  containerPlanningEngine,
  containerTypeSpecService,
  loadingPoolItemService,
  loadingPoolService,
} from './services/containerLoadingServices'

// ============================================================
// Number Allocation
// ============================================================
export async function nextInquiryNumber(regionCode: string = 'NA', customerId?: string): Promise<string> {
  try {
    return await allocateNextClientInquiryNumber(regionCode, new Date().toISOString(), customerId ?? null)
  } catch (error: any) {
    console.error('[Supabase] next inquiry number allocation failed:', error?.message || error)
    throw new Error(`Failed to generate inquiry number: ${error?.message || error}`)
  }
}

export async function nextInternalModelNo(regionCode: string = 'NA'): Promise<string> {
  const { data, error } = await supabase.rpc('next_internal_model_no', {
    p_region_code: regionCode,
  })
  if (error) {
    console.error('[Supabase] next_internal_model_no RPC failed:', error.message)
    throw new Error(`Failed to generate internal model number: ${error.message}`)
  }
  return data as string
}

// ============================================================
// Business Documents
// ============================================================
export const inquiryService = createInquiryService({
  throwSupabaseError,
  withSupabaseTimeout,
  resolveBusinessDocumentTemplateBinding: (input, options) =>
    resolveBusinessDocumentTemplateBinding(input, options, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  applyKnownMissingColumns,
  rememberMissingColumn,
  hasKnownMissingColumn,
  isMissingColumnError,
  extractMissingColumn,
  enrichInquiryRowsWithTemplateData,
  enrichInquiryRowWithTemplateData,
  insertInquiryWithServerAssignedNumber: (payload, context) =>
    insertInquiryWithServerAssignedNumber(payload, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  isTransientSupabaseRequestError,
  updateInquiryRowViaRest,
  toRegionCode,
  toUUIDOrNull,
  sanitizePersistedInquiryProducts,
  isUuidLike,
})

export const salesQuotationService = createSalesQuotationService({
  throwSupabaseError,
  buildSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  normalizeProfitRateForStorage,
  normalizeProfitRatePercent,
  toUUID,
  toUUIDOrNull,
})

export const xjService = createXjService({
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  toUUID,
  toUUIDOrNull,
  toIsoDate,
  toRegionCode,
  fromRegionCode,
})

export const quotationRequestService = createQuotationRequestService({
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  toUUID,
  toUUIDOrNull,
  toIsoDate,
  toRegionCode,
  fromRegionCode,
})

export const purchaseOrderService = createPurchaseOrderService({
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  toUUID,
  toUUIDOrNull,
  toIsoDate,
  toRegionCode,
  fromRegionCode,
})

export const quoteRequirementService = createQuoteRequirementService({
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  toUUID,
  toUUIDOrNull,
  toIsoDate,
  toRegionCode,
  fromRegionCode,
})

export const contractService = createContractService({
  handleError,
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  rememberMissingColumn,
  matchesCustomerEmailFallback,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  updateWithSchemaFallback: (table, row, applyFilters, context) =>
    updateWithSchemaFallback(table, row, applyFilters, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  toUUIDOrNull,
})

export const orderService = createOrderService({
  handleError,
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  rememberMissingColumn,
  matchesCustomerEmailFallback,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  updateWithSchemaFallback: (table, row, applyFilters, context) =>
    updateWithSchemaFallback(table, row, applyFilters, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  toUUIDOrNull,
})

export const arService = createArService({
  handleError,
  throwSupabaseError,
  resolveBusinessDocumentTemplateBinding,
  rememberMissingColumn,
  matchesCustomerEmailFallback,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  updateWithSchemaFallback: (table, row, applyFilters, context) =>
    updateWithSchemaFallback(table, row, applyFilters, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  toUUIDOrNull,
})

export const approvalService = createApprovalService({
  handleError,
})

export const notificationService = createNotificationService({
  handleError,
})

export const notificationSupabaseService = createNotificationSupabaseService({
  handleError,
})

// ============================================================
// Document Infrastructure
// ============================================================
export const templateCenterService = createTemplateCenterService({
  buildSupabaseError,
  throwSupabaseError,
  withSupabaseTimeout,
  updateWithSchemaFallback: (table, row, applyFilter, context) =>
    updateWithSchemaFallback(table, row, applyFilter, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  upsertWithoutSelectWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithoutSelectWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
})

export const approvalRecordService = createApprovalRecordService({
  throwSupabaseError,
  toUUID,
  toUUIDOrNull,
  toRegionCode,
  upsertWithSchemaFallback: (table, row, onConflict, context) =>
    upsertWithSchemaFallback(table, row, onConflict, context, {
      buildSupabaseError,
      throwSupabaseError,
      extractMissingColumn,
      extractCheckConstraintColumn,
      shouldDowngradeProfitRate,
      toUUIDOrNull,
      toRegionCode,
      sanitizePersistedInquiryProducts,
    }),
  extractMissingColumn,
})

export const supplierQuotationService = createSupplierQuotationService({
  handleError,
  throwSupabaseError,
  toUUID,
  toUUIDOrNull,
  resolveBusinessDocumentTemplateBinding,
})
