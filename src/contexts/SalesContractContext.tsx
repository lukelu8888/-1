/**
 * 🔥 销售合同（SC）Context
 * 
 * 功能：
 * - 管理销售合同的创建、审批、签署流程
 * - 与QT报价单一对一关联
 * - 审批流程同QT：< $20,000 主管审批，≥ $20,000 主管+总监两级审批
 * - 支持电子签名
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef as _useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { useOrders } from './OrderContext'; // 🔥 新增：同步订单到客户端，以及监听客户确认状态
import { useOptionalPurchaseOrders } from './PurchaseOrderContext'; // Phase 7A: snapshot needs CG data
import { useSalesQuotations, type SalesQuotation } from './SalesQuotationContext'; // Phase 7A: snapshot needs QT data
import { computeSCProfit } from '../utils/scProfitUtils'; // Phase 7A: reuse Phase 6 actual profit logic
import {
  getCurrentUser,
  getScopedStorageKey,
  getStoredPortalRole,
  isStoredStaffPortalRole,
  resolveCurrentStorageIdentity,
} from '../utils/dataIsolation';
import { addTombstones, filterNotDeleted, listTombstones, removeTombstones, removeTombstonesByMarkers } from '../lib/erp-core/deletion-tombstone';
import { buildCustomerContractTombstoneMarkers } from '../lib/customerPortalScope';
import { salesContractsDb, fromContractRow } from '../lib/supabase-db';
import { contractService, orderService, arService, salesQuotationService } from '../lib/supabaseService';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';
import { getLocalAdminAuth } from '../lib/internalAdminLocalAuth';
import type { SalesContractData } from '../components/documents/templates/SalesContractDocument';
import type { PaymentMode } from './SalesQuotationContext';
import {
  buildPaymentTermsText,
  deriveBalanceTrigger,
  getDefaultBalancePercentage,
  getDefaultDepositPercentage,
  type BalanceTrigger,
} from '../lib/paymentFlow';
import { assertBusinessOwnerEmail } from '../utils/quotationOwnership';
import { buildIdentityAuditMetadata, buildIdentityPersistenceFields } from '../utils/dataIsolation';
import { sendNotificationToUsers } from '../utils/notificationUtils';
import { buildScArNotes, getFinanceNotificationRecipients } from '../utils/financeWorkflow';
import { deriveSalesContractSplitFields, normalizeCustomerContractStatus } from '../lib/customerPortalContractStatus';
import { adaptSalesContractToDocumentData } from '../utils/documentDataAdapters';

// ── Phase 7A: Profit snapshot — frozen at SC completion ───────────────────────
/**
 * Written ONCE when SC.status transitions to 'completed'.
 * Captures actual profit at that moment. Never recalculated or overwritten.
 * If actual profit was unavailable at completion, this field is absent (null).
 */
export interface ProfitSnapshot {
  finalRevenue:   number;   // SC.totalAmount at snapshot time
  finalCost:      number;   // sum(CG.totalAmount) + additionalCost
  finalProfit:    number;   // finalRevenue − finalCost
  finalMargin:    number;   // decimal 0–1  (finalProfit / finalRevenue)
  cgCount:        number;   // CG records included in finalCost
  additionalCost: number;   // SC.additionalCost at snapshot time
  currency:       string;   // SC.currency (context for all amounts)
  snapshotAt:     string;   // ISO 8601 timestamp
}

// 🔥 销售合同产品接口
export interface SalesContractProduct {
  productId: string;
  productName: string;
  specification: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryTime?: string;
  customerProductId?: string;
  projectId?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
}

// 🔥 电子签名接口
export interface ElectronicSignature {
  signedBy: string;        // 签名人姓名
  signedByEmail: string;   // 签名人邮箱
  signedAt: string;        // 签名时间
  signatureData?: string;  // 签名数据（Base64图片）
  ipAddress?: string;      // IP地址
  userAgent?: string;      // 浏览器信息
}

// 🔥 审批流程接口
export interface ContractApprovalFlow {
  requiresDirectorApproval: boolean;  // 是否需要总监审批（≥$20,000）
  currentStep: 'supervisor' | 'director' | 'completed';
  steps: Array<'supervisor' | 'director'>;
}

// 🔥 审批历史记录
export interface ContractApprovalHistory {
  action: 'submitted' | 'approved' | 'rejected' | 'modified';
  actor: string;
  actorRole: 'salesperson' | 'supervisor' | 'director';
  timestamp: string;
  notes?: string;
  amount?: number;
}

export type SalesContractApprovalStatus =
  | 'draft'
  | 'pending_l1'
  | 'pending_l2'
  | 'approved'
  | 'rejected';

export type SalesContractExecutionStatus =
  | 'draft'
  | 'sent_to_customer'
  | 'customer_confirmed'
  | 'customer_requested_changes'
  | 'customer_rejected'
  | 'awaiting_deposit'
  | 'deposit_uploaded'
  | 'deposit_confirmed'
  | 'in_procurement'
  | 'in_pre_production'
  | 'in_production'
  | 'qc_pending'
  | 'qc_passed'
  | 'awaiting_balance'
  | 'balance_uploaded'
  | 'balance_confirmed'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type SalesContractPaymentStageStatus =
  | 'not_required'
  | 'pending'
  | 'uploaded'
  | 'confirmed';

// 🔥 销售合同接口
export interface SalesContract {
  // 基本信息
  id: string;                          // 合同ID
  contractNumber: string;              // 合同编号: SC-{REGION}-{YYMMDD}-{序号}
  quotationNumber: string;             // 关联的报价单号（QT）- 一对一
  qrNumber?: string;                   // 关联的报价请求单号（QR）
  inquiryNumber?: string;              // 原始询价单号（ING）
  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled' | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
  quotationRole?: 'budgetary' | 'technical_review' | 'commercial_offer' | 'final_offer' | 'accepted' | null;
  
  // 客户信息
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: string;
  customerCountry: string;
  contactPerson: string;
  contactPhone: string;
  
  // 业务信息
  salesPerson: string;                 // 业务员邮箱
  salesPersonName: string;             // 业务员姓名
  ownerUserId?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  operatorUserId?: string | null;
  operatorEmail?: string | null;
  operatorRole?: string | null;
  actingUserId?: string | null;
  actingUserEmail?: string | null;
  actingUserRole?: string | null;
  authenticatedUserId?: string | null;
  authenticatedUserEmail?: string | null;
  authenticatedUserRole?: string | null;
  supervisor?: string;                 // 主管邮箱
  region: 'NA' | 'SA' | 'EA';       // 区域
  
  // 产品信息
  products: SalesContractProduct[];
  
  // 金额和条款
  totalAmount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  tradeTerms: string;                  // FOB/CIF/EXW等
  paymentTerms: string;                // 付款条款（自由文本，文档渲染用）
  paymentMode?: PaymentMode | null;    // 结构化付款模式（Phase 1: 仅存储，不影响闸门逻辑）
  balanceTrigger?: BalanceTrigger | null; // 余款/信用证触发节点（财务流程唯一依据）
  scType?: 'regular' | 'large_amount' | 'exceptional_clause' | 'strategic_customer' | 'special_account_period' | null;
  exceptionalClauseFlag?: boolean;
  exceptionalClauseNotes?: string | null;
  specialAccountPeriodFlag?: boolean;
  strategicCustomerFlag?: boolean;
  scLastApprovalAt?: string | null;
  depositPercentage: number;           // 定金比例（默认30%）
  depositAmount: number;               // 定金金额
  balancePercentage: number;           // 余款比例（默认70%）
  balanceAmount: number;               // 余款金额
  additionalCost?: number;             // 附加成本（运费/关税等，SC币种）Phase 6b
  fxRates?: Record<string, number>;    // Phase 8: FX map — fxRates[foreignCcy] = units per 1 SC-ccy unit
  profitSnapshot?: ProfitSnapshot | null; // Phase 7A: frozen profit at completion (null = skipped)
  deliveryTime: string;                // 交货期
  portOfLoading: string;               // 装运港
  portOfDestination: string;           // 目的港
  packing: string;                     // 包装要求
  
  // 🔥 状态流转（更新完整流程）
  // ⚠️ Normalized status dictionary — do NOT use 'sent_to_customer', 'pending' (bare) for SC writes.
  status:
    | 'draft'                       // 草稿
    | 'pending_supervisor'          // 待主管审批
    | 'pending_director'            // 待总监审批
    | 'approved'                    // 审批通过
    | 'rejected'                    // 内部审批驳回
    | 'sent'                        // 已发送给客户（normalized from 'sent_to_customer'）
    | 'customer_confirmed'          // 客户已确认
    | 'customer_rejected'           // 客户拒绝合同
    | 'customer_requested_changes'  // 客户要求修改合同
    | 'deposit_uploaded'            // 客户已上传定金凭证
    | 'deposit_confirmed'           // 财务已确认收到定金（可以生成PO）
    | 'po_generated'                // 已生成PO（SC-side procurement placeholder）
    | 'production'                  // 生产中（NOTE: no in-app write path exists yet — set externally if needed）
    | 'balance_confirmed'           // 财务已确认收到尾款 [Phase 2a]
    | 'shipped'                     // 已发货
    | 'completed'                   // 已完成
    | 'cancelled';                  // 已取消（内部/业务取消）
  approvalStatus?: SalesContractApprovalStatus;
  executionStatus?: SalesContractExecutionStatus;
  paymentStatusDeposit?: SalesContractPaymentStageStatus;
  paymentStatusBalance?: 'not_due' | SalesContractPaymentStageStatus;
  
  // 审批流程
  approvalFlow: ContractApprovalFlow;
  approvalHistory: ContractApprovalHistory[];
  approvalNotes?: string;              // 提交审批说明
  rejectionReason?: string;            // 驳回原因
  
  // 🔥 定金管理
  depositProof?: {
    fileName: string;              // 凭证文件名
    fileUrl: string;               // 凭证URL（图片/PDF）
    uploadedBy: string;            // 上传人（客户邮箱）
    uploadedAt: string;            // 上传时间
  };
  depositConfirmedBy?: string;     // 财务确认人
  depositConfirmedAt?: string;     // 财务确认时间
  depositConfirmNotes?: string;    // 确认备注
  
  // 🔥 采购订单（PO）
  purchaseOrderNumbers?: string[];  // 关联的PO编号列表
  
  // 电子签名
  sellerSignature?: ElectronicSignature;   // 卖方签名（业务员或授权人）
  buyerSignature?: ElectronicSignature;    // 买方签名（客户）
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;                // 提交审批时间
  approvedAt?: string;                 // 审批通过时间
  sentToCustomerAt?: string;           // 发送给客户时间
  customerConfirmedAt?: string;        // 客户确认时间
  customerFeedback?: Record<string, any>; // 客户反馈（accept/reject/negotiate）

  // 其他
  remarks?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  templateId?: string | null;
  templateVersionId?: string | null;
  templateSnapshot?: any;
  documentDataSnapshot?: SalesContractData;
  documentRenderMeta?: any;
}

interface SalesContractContextType {
  contracts: SalesContract[];
  loaded: boolean;
  
  // CRUD操作
  createContract: (contractData: Partial<SalesContract>) => Promise<SalesContract>;
  updateContract: (id: string, updates: Partial<SalesContract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  getContractById: (id: string) => SalesContract | undefined;
  getContractByQuotationNumber: (quotationNumber: string) => SalesContract | undefined;
  getContractByContractNumber: (contractNumber: string) => SalesContract | undefined;
  clearAllContracts: () => void; // 🔥 清空所有合同
  
  // 业务流程
  submitForApproval: (id: string, notes?: string) => Promise<void>;
  approveContract: (id: string, approverRole: 'supervisor' | 'director', notes?: string) => Promise<void>;
  rejectContract: (id: string, reason: string, approverRole: 'supervisor' | 'director') => Promise<void>;
  sendToCustomer: (id: string) => Promise<void>;
  customerConfirmContract: (id: string, signature: ElectronicSignature, silent?: boolean, customerFeedback?: Record<string, any>) => Promise<void>;
  customerRejectContract: (id: string, reason: string) => Promise<void>;
  customerRequestChanges: (id: string, requestedChanges: string) => Promise<void>;

  // 🔥 定金管理
  uploadDepositProof: (id: string, fileName: string, fileUrl: string, uploadedBy: string) => Promise<void>;
  confirmDeposit: (id: string, confirmedBy: string, notes?: string) => Promise<void>;

  // ⚠️ DEPRECATED (Phase 3a): Non-authoritative SC-side placeholder. Does NOT create purchase_orders
  // rows. Superseded by markPRInitiated() which is called by the real live procurement trigger.
  // Retained for backward compatibility; do not call from new code.
  generatePurchaseOrder: (id: string) => Promise<string[]>;

  // Phase 3a: SC → PR initiation write-back
  // Called by the real SC-side procurement trigger (requestProcurementFromContract) after the PR
  // record is successfully created in purchase_orders. Advances SC.status to 'po_generated' and
  // appends the PR number to SC.purchaseOrderNumbers. Does NOT create purchase_orders rows.
  markPRInitiated: (id: string, prNumber: string) => Promise<void>;

  // Phase 3c: procurement-execution mirror — resolves SC.production orphan status.
  // Called by PurchaseOrderManagementEnhanced after ALL standard-path CG records under a PR
  // reach procurementRequestStatus === 'pushed_supplier'. Advances SC.status to 'production'.
  // Accepts the SC contract number (not id) because the caller only has the contract number
  // from the PR record's salesContractNumber / sourceRef field.
  // Safety: only advances from 'po_generated' — does NOT overwrite any later SC status.
  advanceSCToProduction: (contractNumber: string) => Promise<void>;

  // 🔥 尾款确认 & 履约推进 [Phase 2a: Mode 1 / null default]
  confirmBalancePayment: (id: string, confirmedBy: string, notes?: string, receiptProof?: Record<string, any>) => Promise<void>;
  advanceSCToShipped: (id: string) => Promise<void>;
  advanceSCToCompleted: (id: string) => Promise<void>;
  
  // 电子签名
  addSellerSignature: (id: string, signature: ElectronicSignature) => Promise<void>;
  addBuyerSignature: (id: string, signature: ElectronicSignature) => Promise<void>;

  // 🔥 接口化：手动刷新（用于确保进入订单管理Tab时一定发起请求）
  refreshFromBackend: () => Promise<void>;
}

const SalesContractContext = createContext<SalesContractContextType | undefined>(undefined);
const SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY = 'sales_contract_context_cache_v1';

const getSalesContractCacheKey = () => {
  return getScopedStorageKey(SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY);
};

const getLegacySalesContractCacheKeys = () => {
  if (typeof window === 'undefined') return [] as string[];

  const { email, role } = resolveCurrentStorageIdentity();
  const currentUser = getCurrentUser() as any;
  const keys = new Set<string>([
    getSalesContractCacheKey(),
    `sales_contract_context_cache_${currentUser?.email || currentUser?.type || 'guest'}`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:${role}`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:customer`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:admin`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:staff`,
    `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:supplier`,
  ]);

  try {
    const prefix = `${SALES_CONTRACT_CONTEXT_CACHE_BASE_KEY}:${email}:`;
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(prefix)) {
        keys.add(key);
      }
    }
  } catch {
    // ignore storage scan failures
  }

  return Array.from(keys);
};

const readSalesContractCache = (): SalesContract[] => {
  if (typeof window === 'undefined') return [];
  try {
    for (const key of getLegacySalesContractCacheKeys()) {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
};

const persistSalesContractCache = (contracts: SalesContract[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(getSalesContractCacheKey(), JSON.stringify(contracts));
    for (const key of getLegacySalesContractCacheKeys()) {
      if (key === getSalesContractCacheKey()) continue;
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore cache write failures
  }
};

const hasLocalContractIdentity = () => {
  const currentUser = getCurrentUser() as any;
  return Boolean(
    currentUser?.email ||
    currentUser?.id ||
    currentUser?.role ||
    currentUser?.userRole ||
    currentUser?.type,
  );
};

const assertSalesContractWritePayload = (contract: Partial<SalesContract>) => {
  if (!contract.templateSnapshot || !contract.documentDataSnapshot) {
    throw new Error(`SC ${contract.contractNumber || contract.id || ''} 缺少模板快照数据，已阻止写入`);
  }
};

const assertSalesContractPersistedBinding = (contract: Partial<SalesContract>) => {
  if (!contract.templateId || !contract.templateVersionId || !contract.templateSnapshot || !contract.documentDataSnapshot) {
    throw new Error(`SC ${contract.contractNumber || contract.id || ''} 缺少模板绑定字段，Supabase 返回结果不完整`);
  }
};

const normalizeSalesContractWritePayload = (contract: SalesContract): SalesContract => {
  const ownerEmail = assertBusinessOwnerEmail(contract.salesPerson, contract.region, '销售合同');
  const logicalStatus = normalizeCustomerContractStatus(contract);
  const splitFields = deriveSalesContractSplitFields({
    ...contract,
    status: logicalStatus,
  });
  const existingRenderMeta = contract.documentRenderMeta || {};
  return {
    ...contract,
    salesPerson: ownerEmail,
    ownerEmail,
    approvalStatus: (contract.approvalStatus || splitFields.approvalStatus) as SalesContractApprovalStatus,
    executionStatus: (contract.executionStatus || splitFields.executionStatus) as SalesContractExecutionStatus,
    paymentStatusDeposit: (contract.paymentStatusDeposit || splitFields.paymentStatusDeposit) as SalesContractPaymentStageStatus,
    paymentStatusBalance: (contract.paymentStatusBalance || splitFields.paymentStatusBalance) as ('not_due' | SalesContractPaymentStageStatus),
    ownerName: contract.salesPersonName || null,
    ownerRole: 'Sales_Rep',
    ...buildIdentityPersistenceFields({
      ownerEmail,
      ownerName: contract.salesPersonName || null,
      ownerRole: 'Sales_Rep',
    }),
    documentRenderMeta: {
      ...existingRenderMeta,
      ...buildIdentityAuditMetadata({
        ownerEmail,
        ownerName: contract.salesPersonName || null,
        ownerRole: 'Sales_Rep',
        region: contract.region || null,
      }),
      erpWorkflow: {
        ...(existingRenderMeta?.erpWorkflow || {}),
        logicalStatus,
        approvalStatus: contract.approvalStatus || splitFields.approvalStatus,
        executionStatus: contract.executionStatus || splitFields.executionStatus,
        paymentStatusDeposit: contract.paymentStatusDeposit || splitFields.paymentStatusDeposit,
        paymentStatusBalance: contract.paymentStatusBalance || splitFields.paymentStatusBalance,
      },
    },
  };
};

const pushSalesContractViaServer = async (contract: SalesContract): Promise<SalesContract> => {
  const localAdminAuth = getLocalAdminAuth();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/push-sales-contract`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contract,
        ...(localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password
          ? {
              localAdminAuth: {
                email: localAdminAuth.email,
                password: localAdminAuth.password,
              },
            }
          : {}),
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(String(payload?.message || '服务端保存 SC 失败'));
  }

  return fromContractRow(payload?.contract) as SalesContract;
};

const pushCustomerOrderViaServer = async (order: Record<string, any>): Promise<Record<string, any>> => {
  const localAdminAuth = getLocalAdminAuth();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/push-customer-order`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        order,
        ...(localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password
          ? {
              localAdminAuth: {
                email: localAdminAuth.email,
                password: localAdminAuth.password,
              },
            }
          : {}),
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(String(payload?.message || '服务端保存订单失败'));
  }

  return payload?.order || order;
};

const customerConfirmSalesContractViaServer = async (
  contractId: string,
  signature: ElectronicSignature,
  customerFeedback?: Record<string, any>,
): Promise<SalesContract | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/customer-confirm-sales-contract`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contractId,
        signature,
        customerFeedback: customerFeedback || null,
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(String(payload?.message || '客户确认销售合同失败'));
  }

  return payload?.contract ? (fromContractRow(payload.contract) as SalesContract) : null;
};

const persistSalesContractViaServerFirst = async (contract: SalesContract): Promise<SalesContract> => {
  const normalizedContract = normalizeSalesContractWritePayload(contract);

  assertSalesContractWritePayload(normalizedContract);
  try {
    return await pushSalesContractViaServer(normalizedContract);
  } catch (serverError) {
    console.warn('⚠️ [SalesContractContext] 服务端保存 SC 失败，回退前端直写:', serverError);
    return await contractService.upsert(normalizedContract);
  }
};

// ─── paymentMode classification helpers ───────────────────────────────────────
// Ship-first modes: balance payment is received AFTER shipment
// (tt_deposit_balance_against_bl = Mode 2, dp/da collection = Mode 5, oa = Mode 6)
const isShipFirstMode = (mode: PaymentMode | null | undefined): boolean =>
  mode === 'tt_deposit_balance_against_bl' || mode === 'dp' || mode === 'da' || mode === 'oa';

// No-deposit modes: skip the deposit stage entirely
// lc_100: 100% LC — no deposit required; oa: open account — no deposit required
const isNoDepositMode = (mode: PaymentMode | null | undefined): boolean =>
  mode === 'oa' || mode === 'lc_100';

// LC modes: payment secured via Letter of Credit (Phase 2b-ii)
// balance_confirmed is reused as the unified pre-shipment financial clearance gate,
// meaning "LC readiness confirmed" rather than a cash balance payment.
// lc_100         — no deposit, pre-ship balance gate required
// deposit_plus_lc — deposit required, then LC covers the remainder (pre-ship balance gate)
const isLCMode = (mode: PaymentMode | null | undefined): boolean =>
  mode === 'lc_100' || mode === 'deposit_plus_lc';
// ─────────────────────────────────────────────────────────────────────────────

export function SalesContractProvider({ children }: { children: ReactNode }) {
  // 迁移历史 tombstone：将错误写入 order 域的合同删除标记迁移到 contract 域
  useEffect(() => {
    const legacy = listTombstones('order').filter((t) => t.reason === 'manual-delete-sales-contract');
    if (legacy.length === 0) return;
    addTombstones(
      'contract',
      legacy.map((t) => t.marker),
      { reason: 'manual-delete-sales-contract', deletedBy: 'migration' },
    );
    const removed = removeTombstones((t) => t.domain === 'order' && t.reason === 'manual-delete-sales-contract');
    if (removed > 0) {
      console.warn(`⚠️ [SalesContractContext] migrated ${removed} legacy contract tombstones`);
    }
  }, []);

  const filterDeletedContracts = (list: SalesContract[]): SalesContract[] =>
    filterNotDeleted('contract', list, (contract: any) => [
      String(contract?.id || ''),
      String(contract?.contractNumber || ''),
    ]);

  const clearingRef = React.useRef(false);


  const [contracts, setContracts] = useState<SalesContract[]>(() => readSalesContractCache());
  const [loaded, setLoaded] = useState(() => readSalesContractCache().length > 0);
  const restoreContractCacheFallback = React.useCallback(() => {
    const cached = readSalesContractCache();
    if (Array.isArray(cached) && cached.length > 0) {
      setContracts(cached);
      setLoaded(true);
      return true;
    }
    return false;
  }, []);

  const preserveContractStateOnAuthGap = React.useCallback(() => {
    const cached = readSalesContractCache();
    if (Array.isArray(cached) && cached.length > 0) {
      setContracts(cached);
      setLoaded(true);
      return;
    }
    setContracts((prev) => prev);
    setLoaded(true);
  }, []);

  const pickLatestContract = React.useCallback((items: SalesContract[]): SalesContract | undefined => {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    return [...items].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String(b.contractNumber || '').localeCompare(String(a.contractNumber || ''));
    })[0];
  }, []);
  
  // 🔥 获取订单Context（用于同步订单到客户端，以及监听客户确认状态）
  const { addOrder, orders: allOrders } = useOrders();

  useEffect(() => {
    persistSalesContractCache(contracts);
  }, [contracts]);

  const contractApprovalReconcileSignature = React.useMemo(() => (
    contracts
      .map((contract) => `${String(contract.contractNumber || '').trim()}:${String(contract.status || '').trim()}`)
      .filter((value) => value.startsWith('SC-'))
      .join('|')
  ), [contracts]);

  useEffect(() => {
    if (!contractApprovalReconcileSignature || clearingRef.current) return;
    let cancelled = false;

    const reconcileFromApprovalRecords = async () => {
      const contractNumbers = Array.from(new Set(
        contracts
          .map((contract) => String(contract.contractNumber || '').trim())
          .filter((contractNumber) => /^SC-/i.test(contractNumber)),
      ));
      if (contractNumbers.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('approval_records')
          .select('related_document_id,status,updated_at,approval_history')
          .eq('type', 'sales_contract')
          .in('related_document_id', contractNumbers)
          .in('status', ['approved', 'forwarded', 'rejected'])
          .order('updated_at', { ascending: false });
        if (error) throw error;
        if (cancelled || !Array.isArray(data) || data.length === 0) return;

        const latestByContract = new Map<string, any>();
        data.forEach((record: any) => {
          const contractNumber = String(record?.related_document_id || '').trim();
          if (contractNumber && !latestByContract.has(contractNumber)) {
            latestByContract.set(contractNumber, record);
          }
        });

        setContracts((prev) => {
          let changed = false;
          const next = prev.map((contract) => {
            const contractNumber = String(contract.contractNumber || '').trim();
            const record = latestByContract.get(contractNumber);
            if (!record) return contract;

            const approvalStatus = String(record.status || '').trim();
            if (approvalStatus === 'approved' && contract.status !== 'approved') {
              changed = true;
              return {
                ...contract,
                status: 'approved' as const,
                approvalStatus: 'approved' as const,
                executionStatus: contract.executionStatus || 'draft',
                approvedAt: contract.approvedAt || record.updated_at || new Date().toISOString(),
                updatedAt: record.updated_at || contract.updatedAt,
              };
            }
            if (approvalStatus === 'forwarded' && contract.status !== 'pending_director') {
              changed = true;
              return {
                ...contract,
                status: 'pending_director' as const,
                approvalStatus: 'pending_l2' as const,
                executionStatus: contract.executionStatus || 'draft',
                updatedAt: record.updated_at || contract.updatedAt,
              };
            }
            if (approvalStatus === 'rejected' && contract.status !== 'rejected') {
              changed = true;
              return {
                ...contract,
                status: 'rejected' as const,
                approvalStatus: 'rejected' as const,
                executionStatus: contract.executionStatus || 'draft',
                updatedAt: record.updated_at || contract.updatedAt,
              };
            }
            return contract;
          });
          return changed ? next : prev;
        });
      } catch (error: any) {
        console.warn('⚠️ [SalesContractContext] SC 审批记录对账失败:', error?.message || error);
      }
    };

    void reconcileFromApprovalRecords();

    return () => {
      cancelled = true;
    };
  }, [contractApprovalReconcileSignature, contracts]);

  // Phase 7A: profit snapshot at completion — needs CG cost data and QT estimates
  const purchaseOrderContext = useOptionalPurchaseOrders();
  const purchaseOrders = purchaseOrderContext?.purchaseOrders || [];
  const { getQuotationByNumber, updateQuotation } = useSalesQuotations();

  const getQuotationBridgeApprovalStatus = (status?: SalesContract['status']) => {
    if (!status) return 'draft';
    if (status === 'rejected') return 'rejected';
    if (['approved', 'sent', 'customer_confirmed', 'customer_rejected', 'customer_requested_changes', 'deposit_uploaded', 'deposit_confirmed', 'po_generated', 'production', 'balance_confirmed', 'shipped', 'completed'].includes(status)) {
      return 'approved';
    }
    if (['pending_supervisor', 'pending_director'].includes(status)) return 'pending_approval';
    return 'draft';
  };

  const getQuotationBridgeCustomerStage = (status?: SalesContract['status']) => {
    if (!status) return 'not_started';
    if (status === 'sent') return 'sent';
    if (status === 'customer_confirmed') return 'confirmed';
    if (status === 'customer_rejected') return 'rejected';
    if (status === 'customer_requested_changes') return 'requested_changes';
    if (['deposit_uploaded', 'deposit_confirmed', 'po_generated', 'production', 'balance_confirmed', 'shipped', 'completed'].includes(status)) {
      return 'confirmed';
    }
    return 'pending';
  };

  const extractQuotationFinancialSummary = React.useCallback((quotationLike: Partial<SalesQuotation> | Record<string, any> | null | undefined) => {
    if (!quotationLike) return null;

    const snapshot =
      (quotationLike as any)?.documentDataSnapshot?.financialSummary ||
      (quotationLike as any)?.documentDataSnapshot?.financials ||
      (quotationLike as any)?.documentRenderMeta?.financialSummary ||
      (quotationLike as any)?.documentRenderMeta?.financials ||
      null;

    const items = Array.isArray((quotationLike as any)?.items)
      ? (quotationLike as any).items
      : Array.isArray((quotationLike as any)?.documentDataSnapshot?.products)
        ? (quotationLike as any).documentDataSnapshot.products
        : Array.isArray((quotationLike as any)?.templateSnapshot?.products)
          ? (quotationLike as any).templateSnapshot.products
          : [];
    const itemsTotalAmount = items.reduce((sum: number, item: any) => {
      const quantity = Number(item?.quantity ?? item?.qty ?? item?.pcs ?? item?.count ?? 0);
      const unitPrice = Number(
        item?.salesPrice ??
        item?.unitPrice ??
        item?.quotePrice ??
        item?.sales_price ??
        item?.quote_price ??
        0,
      );
      const lineAmount = Number(item?.totalPrice ?? item?.totalAmount ?? item?.total_price);
      if (Number.isFinite(lineAmount)) return sum + lineAmount;
      return sum + ((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0));
    }, 0);
    const itemsTotalCost = items.reduce((sum: number, item: any) => {
      const quantity = Number(item?.quantity ?? item?.qty ?? item?.pcs ?? item?.count ?? 0);
      const costPrice = Number(
        item?.costPrice ??
        item?.costUSD ??
        item?.cost_price ??
        item?.cost_usd ??
        0,
      );
      const lineCost = Number(item?.totalCost ?? item?.total_cost);
      if (Number.isFinite(lineCost)) return sum + lineCost;
      return sum + ((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(costPrice) ? costPrice : 0));
    }, 0);

    const totalAmount = Number(
      (quotationLike as any)?.totalAmount ??
      (quotationLike as any)?.totalPrice ??
      snapshot?.totalAmount ??
      snapshot?.totalPrice ??
      itemsTotalAmount,
    );
    const totalCost = Number(
      (quotationLike as any)?.totalCost ??
      (quotationLike as any)?.total_cost ??
      snapshot?.totalCost ??
      snapshot?.total_cost ??
      itemsTotalCost,
    );
    const rawTotalProfit =
      (quotationLike as any)?.totalProfit ??
      (quotationLike as any)?.total_profit ??
      snapshot?.totalProfit ??
      snapshot?.total_profit;
    const totalProfit = Number.isFinite(Number(rawTotalProfit))
      ? Number(rawTotalProfit)
      : (totalAmount - totalCost);
    const rawProfitRate = Number(
      (quotationLike as any)?.profitRate ??
      (quotationLike as any)?.profit_rate ??
      (quotationLike as any)?.profitMargin ??
      (quotationLike as any)?.profit_margin ??
      snapshot?.profitRate ??
      snapshot?.profit_rate ??
      snapshot?.profitMargin ??
      snapshot?.profit_margin,
    );
    const profitRate = Number.isFinite(rawProfitRate)
      ? (rawProfitRate > 0 && rawProfitRate < 1 ? rawProfitRate * 100 : rawProfitRate)
      : (totalCost > 0 ? (totalProfit / totalCost) * 100 : Number.NaN);

    if (
      !Number.isFinite(totalAmount) &&
      !Number.isFinite(totalCost) &&
      !Number.isFinite(totalProfit) &&
      !Number.isFinite(profitRate)
    ) {
      return null;
    }

    return {
      quotationNumber: String(
        (quotationLike as any)?.qtNumber ||
        (quotationLike as any)?.quotationNumber ||
        '',
      ).trim() || null,
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      totalCost: Number.isFinite(totalCost) ? totalCost : 0,
      totalProfit: Number.isFinite(totalProfit) ? totalProfit : 0,
      profitRate: Number.isFinite(profitRate) ? profitRate : null,
      syncedAt: new Date().toISOString(),
      source: 'quotation_to_contract_bridge',
    };
  }, []);

  const hasContractFinancialBridge = React.useCallback((contractLike: Partial<SalesContract> | null | undefined) => {
    if (!contractLike) return false;
    const documentData = (contractLike as any)?.documentDataSnapshot || (contractLike as any)?.document_data_snapshot || {};
    const renderMeta = (contractLike as any)?.documentRenderMeta || (contractLike as any)?.document_render_meta || {};
    const financialSummary =
      documentData?.financialSummary ||
      documentData?.financials ||
      renderMeta?.financialSummary ||
      renderMeta?.financials ||
      renderMeta?.quotationFinancialBridge ||
      null;

    return Boolean(
      financialSummary &&
      (
        Number.isFinite(Number(financialSummary?.profitRate ?? financialSummary?.profit_rate)) ||
        Number.isFinite(Number(financialSummary?.totalCost ?? financialSummary?.total_cost)) ||
        Number.isFinite(Number(financialSummary?.totalProfit ?? financialSummary?.total_profit))
      ),
    );
  }, []);

  const attachQuotationFinancialBridge = React.useCallback((
    contractLike: Partial<SalesContract>,
    quotationLike?: Partial<SalesQuotation> | Record<string, any> | null,
  ) => {
    const quotation =
      quotationLike ||
      getQuotationByNumber(String(contractLike.quotationNumber || '').trim()) ||
      null;
    const financialSummary = extractQuotationFinancialSummary(quotation);
    if (!financialSummary) return contractLike;

    const existingDocumentData = (contractLike.documentDataSnapshot || {}) as Record<string, any>;
    const existingRenderMeta = (contractLike.documentRenderMeta || {}) as Record<string, any>;

    return {
      ...contractLike,
      qrNumber:
        String(
          contractLike.qrNumber ||
          (quotation as any)?.qrNumber ||
          (quotation as any)?.requirementNo ||
          '',
        ).trim() || undefined,
      documentDataSnapshot: {
        ...existingDocumentData,
        qrNumber:
          String(
            existingDocumentData?.qrNumber ||
            (quotation as any)?.qrNumber ||
            (quotation as any)?.requirementNo ||
            '',
          ).trim() || undefined,
        financialSummary,
        financials: financialSummary,
      } as any,
      documentRenderMeta: {
        ...existingRenderMeta,
        qrNumber:
          String(
            existingRenderMeta?.qrNumber ||
            (quotation as any)?.qrNumber ||
            (quotation as any)?.requirementNo ||
            '',
          ).trim() || undefined,
        financialSummary,
        financials: financialSummary,
        quotationFinancialBridge: financialSummary,
      },
    };
  }, [extractQuotationFinancialSummary, getQuotationByNumber]);

  const syncQuotationBridgeFromContract = async (
    contractLike: Partial<SalesContract>,
    options: {
      contractStatus?: SalesContract['status'];
      soNumber?: string | null;
      pushedContractAt?: string | null;
      sentToCustomerAt?: string | null;
      customerConfirmedAt?: string | null;
      customerFeedback?: Record<string, any> | null;
      rejectionReason?: string | null;
      purchaseOrderNumbers?: string[];
    } = {},
  ) => {
    const quotationNumber = String(contractLike.quotationNumber || '').trim();
    const contractNumber = String(contractLike.contractNumber || '').trim();
    if (!quotationNumber || !contractNumber) return;

    const quotation = getQuotationByNumber(quotationNumber);
    const currentApprovalStatus = quotation?.approvalStatus || 'approved';
    const now = new Date().toISOString();
    const existingRenderMeta = quotation?.documentRenderMeta || {};
    const existingBridge = existingRenderMeta?.contractBridge || {};
    const contractStatus = options.contractStatus || contractLike.status || 'draft';
    const soNumber = options.soNumber ?? quotation?.soNumber ?? existingBridge?.soNumber ?? null;
    const nextBridge = {
      ...existingBridge,
      contractNumber,
      quotationNumber,
      contractStatus,
      approvalStatus: getQuotationBridgeApprovalStatus(contractStatus),
      customerStage: getQuotationBridgeCustomerStage(contractStatus),
      lastSyncedAt: now,
      linkedAt: existingBridge?.linkedAt || options.pushedContractAt || contractLike.createdAt || now,
      pushedContractAt: quotation?.pushedContractAt || options.pushedContractAt || contractLike.createdAt || now,
      sentToCustomerAt: options.sentToCustomerAt ?? contractLike.sentToCustomerAt ?? existingBridge?.sentToCustomerAt ?? null,
      customerConfirmedAt: options.customerConfirmedAt ?? contractLike.customerConfirmedAt ?? existingBridge?.customerConfirmedAt ?? null,
      rejectionReason: options.rejectionReason ?? contractLike.rejectionReason ?? existingBridge?.rejectionReason ?? null,
      customerFeedback: options.customerFeedback ?? contractLike.customerFeedback ?? existingBridge?.customerFeedback ?? null,
      purchaseOrderNumbers: options.purchaseOrderNumbers ?? contractLike.purchaseOrderNumbers ?? existingBridge?.purchaseOrderNumbers ?? [],
      soNumber,
    };

    const quotationPatch: Partial<SalesQuotation> = {
      pushedToContract: true,
      pushedContractNumber: contractNumber,
      pushedContractAt: quotation?.pushedContractAt || options.pushedContractAt || contractLike.createdAt || now,
      pushedBy: quotation?.pushedBy || contractLike.salesPerson || contractLike.salesPersonName || null,
      documentRenderMeta: {
        ...existingRenderMeta,
        contractBridge: nextBridge,
      },
    };

    if (soNumber) {
      quotationPatch.soNumber = soNumber;
    }

    try {
      if (quotation?.id) {
        await updateQuotation(quotation.id, quotationPatch);
      } else {
        await salesQuotationService.updateStatus(quotationNumber, currentApprovalStatus, quotationPatch as Record<string, any>);
      }
    } catch (error: any) {
      console.warn('⚠️ [SalesContractContext] 回写关联 QT 失败:', error?.message || error);
    }
  };

  useEffect(() => {
    if (!loaded || contracts.length === 0 || !isStoredStaffPortalRole()) return;

    let cancelled = false;
    const candidates = contracts.filter((contract) => {
      if (!contract.quotationNumber || hasContractFinancialBridge(contract)) return false;
      return Boolean(getQuotationByNumber(String(contract.quotationNumber || '').trim()));
    });
    if (candidates.length === 0) return;

    const backfill = async () => {
      for (const contract of candidates) {
        if (cancelled) return;
        const quotation = getQuotationByNumber(String(contract.quotationNumber || '').trim());
        const enriched = attachQuotationFinancialBridge(contract, quotation);
        if (
          enriched.documentDataSnapshot === contract.documentDataSnapshot &&
          enriched.documentRenderMeta === contract.documentRenderMeta
        ) {
          continue;
        }

        try {
          const saved = await contractService.upsert(enriched as SalesContract);
          if (!saved || cancelled) continue;
          setContracts((prev) => prev.map((item) => (
            item.id === saved.id ? (saved as SalesContract) : item
          )));
        } catch (error: any) {
          console.warn(`⚠️ [SalesContractContext] 回填 SC 利润快照失败 ${contract.contractNumber}:`, error?.message || error);
        }
      }
    };

    void backfill();
    return () => {
      cancelled = true;
    };
  }, [attachQuotationFinancialBridge, contracts, getQuotationByNumber, hasContractFinancialBridge, loaded]);

  const clearQuotationBridgeForDeletedContract = async (
    contractLike: Partial<SalesContract>,
    remainingLatestContract?: Partial<SalesContract> | null,
  ) => {
    const quotationNumber = String(contractLike.quotationNumber || '').trim();
    const deletedContractNumber = String(contractLike.contractNumber || '').trim();
    if (!quotationNumber || !deletedContractNumber) return;

    if (remainingLatestContract?.quotationNumber && remainingLatestContract?.contractNumber) {
      await syncQuotationBridgeFromContract(remainingLatestContract as Partial<SalesContract>, {
        contractStatus: remainingLatestContract.status,
      });
      return;
    }

    const quotation = getQuotationByNumber(quotationNumber);
    const currentApprovalStatus = quotation?.approvalStatus || 'approved';
    const existingRenderMeta = quotation?.documentRenderMeta || {};
    const existingBridge = existingRenderMeta?.contractBridge || {};
    const currentBridgeContractNumber = String(
      quotation?.pushedContractNumber ||
      existingBridge?.contractNumber ||
      '',
    ).trim();

    if (currentBridgeContractNumber && currentBridgeContractNumber !== deletedContractNumber) {
      return;
    }

    const nextRenderMeta = { ...existingRenderMeta };
    if (nextRenderMeta.contractBridge) {
      delete nextRenderMeta.contractBridge;
    }

    const quotationPatch: Partial<SalesQuotation> = {
      pushedToContract: false,
      pushedContractNumber: null,
      pushedContractAt: null,
      soNumber: null,
      documentRenderMeta: nextRenderMeta,
    };

    try {
      if (quotation?.id) {
        await updateQuotation(quotation.id, quotationPatch);
      } else {
        await salesQuotationService.updateStatus(quotationNumber, currentApprovalStatus, quotationPatch as Record<string, any>);
      }
    } catch (error: any) {
      console.warn('⚠️ [SalesContractContext] 清理关联 QT 合同桥接失败:', error?.message || error);
    }
  };

  // 🔥 从 Supabase 加载合同列表（Supabase-first）
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (clearingRef.current) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (alive) {
            if (!restoreContractCacheFallback()) {
              preserveContractStateOnAuthGap();
            }
            setLoaded(true);
          }
          return;
        }

        let isStaff = isStoredStaffPortalRole();
        if (!isStaff && getStoredPortalRole() === null) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('portal_role')
            .eq('id', session.user.id)
            .maybeSingle();
          isStaff = profile?.portal_role === 'admin' || profile?.portal_role === 'staff';
        }
      const data = isStaff
          ? await contractService.getAll()
          : await contractService.getByEmail(session.user.email || '');
        if (!alive || clearingRef.current) return;
        if (Array.isArray(data) && data.length > 0) {
          const rawContracts = data as SalesContract[];
          const filtered = filterDeletedContracts(rawContracts);
          if (!isStaff && filtered.length === 0) {
            const removed = removeTombstonesByMarkers('contract', rawContracts.flatMap((contract) => buildCustomerContractTombstoneMarkers(contract)));
            if (removed > 0) {
              console.warn(`⚠️ [SalesContractProvider] removed ${removed} stale contract tombstones after backend reload`);
            }
            setContracts(rawContracts);
            setLoaded(true);
            return;
          }
          setContracts(filtered);
          setLoaded(true);
        } else if (alive) {
          setContracts([]);
          setLoaded(true);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.warn('⚠️ [SalesContractProvider] Supabase 加载合同失败:', e?.message || e);
        if (alive) setLoaded(true);
      }
    };

    void load();

    // 监听 Auth 状态变化，登录后重新加载
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') {
        if (!hasLocalContractIdentity() || !restoreContractCacheFallback()) {
          preserveContractStateOnAuthGap();
        }
      }
    });

    const handleUserChanged = () => void load();
    const handleOrdersUpdated = () => void load();
    const handleWindowFocus = () => void load();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    };

    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('ordersUpdated', handleOrdersUpdated);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      alive = false;
      subscription.unsubscribe();
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preserveContractStateOnAuthGap, restoreContractCacheFallback]);

  const refreshFromBackend = React.useCallback(async (): Promise<void> => {
    if (clearingRef.current) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!restoreContractCacheFallback()) {
          preserveContractStateOnAuthGap();
        }
        return;
      }

      let isStaff = isStoredStaffPortalRole();
      if (!isStaff && getStoredPortalRole() === null) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('portal_role')
          .eq('id', session.user.id)
          .maybeSingle();
        isStaff = profile?.portal_role === 'admin' || profile?.portal_role === 'staff';
      }
      const data = isStaff
        ? await contractService.getAll()
        : await contractService.getByEmail(session.user.email || '');
      if (clearingRef.current) return;
      if (Array.isArray(data) && data.length > 0) {
        const rawContracts = data as SalesContract[];
        const filtered = filterDeletedContracts(rawContracts);
        if (!isStaff && filtered.length === 0) {
          const removed = removeTombstonesByMarkers('contract', rawContracts.flatMap((contract) => buildCustomerContractTombstoneMarkers(contract)));
          if (removed > 0) {
            console.warn(`⚠️ [SalesContractProvider] removed ${removed} stale contract tombstones during refresh`);
          }
          setContracts(rawContracts);
          setLoaded(true);
          return;
        }
        setContracts(filtered);
        setLoaded(true);
      } else {
        setContracts([]);
        setLoaded(true);
      }
    } catch (e: any) {
      console.warn('⚠️ [SalesContractProvider] refreshFromBackend 失败:', e?.message || e);
      setLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preserveContractStateOnAuthGap, restoreContractCacheFallback]);
  
  // 🔥 监听客户确认订单，同步更新销售合同状态（内存 + Supabase 双写）
  useEffect(() => {
    type PendingSync = {
      key: string; // contract id 或 contractNumber
      status: string;
      extra: Record<string, any>;
    };
    const pendingSync: PendingSync[] = [];

    setContracts(prev => {
      if (clearingRef.current) return prev;
      let hasChanges = false;
      const updated = prev.map(contract => {
        const order = allOrders.find(o => o.orderNumber === contract.contractNumber);

        if (!order) {
          return contract;
        }

        // 🔥 如果客户已确认（Accept），更新合同状态
        const feedbackStatus = String((order.customerFeedback as any)?.status || (order.customerFeedback as any)?.type || '').trim().toLowerCase();
        if (['accepted', 'accept'].includes(feedbackStatus) &&
            contract.status !== 'customer_confirmed' &&
            contract.status !== 'deposit_uploaded' &&
            !['deposit_confirmed', 'po_generated', 'production', 'balance_uploaded', 'balance_confirmed', 'shipped', 'completed'].includes(contract.status) &&
            (contract.status === 'sent' || contract.status === 'approved')) {

          hasChanges = true;
          const confirmedAt = new Date().toISOString();
          const buyerSignature = {
            signedBy: (order.customerFeedback as any)?.submittedBy || order.customerEmail || 'Customer',
            signedByEmail: order.customerEmail || '',
            signedAt: new Date((order.customerFeedback as any)?.submittedAt || Date.now()).toISOString(),
            signatureData: `Electronically confirmed by ${(order.customerFeedback as any)?.submittedBy || 'customer'}`,
          };

          // 🔥 如果同时已有定金凭证，直接跳级到 deposit_uploaded（避免两次 effect 运行）
          if (order.depositPaymentProof) {
            const depositProof = {
              fileName: (order.depositPaymentProof as any).fileName || 'deposit-proof.pdf',
              fileUrl: (order.depositPaymentProof as any).fileUrl || '',
              uploadedBy: (order.depositPaymentProof as any).uploadedBy || order.customerEmail || 'Customer',
              uploadedAt: (order.depositPaymentProof as any).uploadedAt || new Date().toISOString(),
            };
            pendingSync.push({
              key: contract.id || contract.contractNumber,
              status: 'deposit_uploaded',
              extra: {
                customer_confirmed_at: confirmedAt,
                buyer_signature: buyerSignature,
                deposit_proof: depositProof,
              },
            });
            return {
              ...contract,
              status: 'deposit_uploaded',
              customerConfirmedAt: confirmedAt,
              updatedAt: new Date().toISOString(),
              buyerSignature,
              depositProof,
            };
          }

          pendingSync.push({
            key: contract.id || contract.contractNumber,
            status: 'customer_confirmed',
            extra: {
              customer_confirmed_at: confirmedAt,
              buyer_signature: buyerSignature,
            },
          });
          return {
            ...contract,
            status: 'customer_confirmed',
            customerConfirmedAt: confirmedAt,
            updatedAt: confirmedAt,
            buyerSignature,
          };
        }

        // 🔥 如果客户已上传定金凭证，更新合同状态（合同已是 customer_confirmed 的情况）
        if (order.depositPaymentProof &&
            contract.status === 'customer_confirmed' &&
            !contract.depositProof) {

          hasChanges = true;
          const depositProof = {
            fileName: (order.depositPaymentProof as any).fileName || 'deposit-proof.pdf',
            fileUrl: (order.depositPaymentProof as any).fileUrl || '',
            uploadedBy: (order.depositPaymentProof as any).uploadedBy || order.customerEmail || 'Customer',
            uploadedAt: (order.depositPaymentProof as any).uploadedAt || new Date().toISOString(),
          };
          pendingSync.push({
            key: contract.id || contract.contractNumber,
            status: 'deposit_uploaded',
            extra: { deposit_proof: depositProof },
          });
          return {
            ...contract,
            status: 'deposit_uploaded',
            updatedAt: new Date().toISOString(),
            depositProof,
          };
        }

        return contract;
      });

      return hasChanges ? updated : prev;
    });

    // 将推导出的状态变更持久化到 Supabase（静默，不阻塞 UI）
    if (pendingSync.length > 0) {
      pendingSync.forEach(({ key, status, extra }) => {
        contractService.updateStatus(key, status, extra).catch((err: any) => {
          console.warn(`[SalesContractContext] 合同状态同步 Supabase 失败 (${key} → ${status}):`, err?.message || err);
        });
      });
    }
  }, [allOrders]); // 🔥 监听订单变化
  
  // Supabase-first: 写操作直接调用 contractService.upsert，不再写 localStorage
  
  // 🔥 生成合同编号
  const normalizeContractRegionCode = (region: string): string => {
    const value = String(region || '').trim().toLowerCase();
    const compact = value.replace(/[\s_-]/g, '');
    if (compact === 'na' || compact === 'northamerica') return 'NA';
    if (compact === 'sa' || compact === 'southamerica') return 'SA';
    if (compact === 'ea' || compact === 'emea' || compact === 'europe&africa' || compact === 'europeafrica') return 'EA';
    return 'NA';
  };

  const generateContractNumber = async (region: string): Promise<string> => {
    const normalizedRegion = normalizeContractRegionCode(region);
    try {
      const { data, error } = await supabase.rpc('next_number_ex', {
        p_doc_type: 'SC',
        p_region_code: normalizedRegion,
        p_customer_id: null,
      });
      if (error) throw error;
      return data as string;
    } catch (err) {
      console.error('[SalesContractContext] next_number_ex RPC failed, using local fallback:', err);
      const now = new Date();
      const dateStr = now.getFullYear().toString().slice(-2)
        + String(now.getMonth() + 1).padStart(2, '0')
        + String(now.getDate()).padStart(2, '0');
      return `SC-${normalizedRegion}-${dateStr}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    }
  };
  
  // 🔥 创建销售合同
  const createContract = async (contractData: Partial<SalesContract>): Promise<SalesContract> => {
    clearingRef.current = false;
    const now = new Date().toISOString();
    const existingForQuotation = pickLatestContract(
      contracts.filter((contract) => String(contract.quotationNumber || '').trim() === String(contractData.quotationNumber || '').trim()),
    );
    if (existingForQuotation) {
      return existingForQuotation;
    }
    
    // 计算金额
    const totalAmount = contractData.totalAmount || 0;
    const resolvedPaymentMode = contractData.paymentMode || null;
    const resolvedBalanceTrigger = deriveBalanceTrigger(resolvedPaymentMode, contractData.balanceTrigger);
    const resolvedPaymentTerms = String(
      contractData.paymentTerms || buildPaymentTermsText(resolvedPaymentMode, resolvedBalanceTrigger),
    ).trim();
    const depositPercentage = contractData.depositPercentage ?? getDefaultDepositPercentage(resolvedPaymentMode);
    const balancePercentage = contractData.balancePercentage ?? getDefaultBalancePercentage(resolvedPaymentMode);
    const depositAmount = totalAmount * (depositPercentage / 100);
    const balanceAmount = totalAmount * (balancePercentage / 100);
    
    // 判断是否需要总监审批
    const requiresDirectorApproval = totalAmount >= 20000;

    const contractNumber = await generateContractNumber(contractData.region || 'NA');
    const bridgedContractData = attachQuotationFinancialBridge({
      ...contractData,
      contractNumber,
    });
    
    const contractCurrency = String(contractData.currency || 'USD').trim().toUpperCase() || 'USD';
    const normalizedProducts = (bridgedContractData.products || []).map((product: any) => ({
      ...product,
      currency: contractCurrency,
    }));

    const newContract: SalesContract = {
      id: crypto.randomUUID(),
      contractNumber,
      quotationNumber: bridgedContractData.quotationNumber || '',
      qrNumber: String(bridgedContractData.qrNumber || '').trim() || undefined,
      inquiryNumber: bridgedContractData.inquiryNumber,
      projectId: bridgedContractData.projectId || null,
      projectCode: bridgedContractData.projectCode || null,
      projectName: bridgedContractData.projectName || null,
      projectRevisionId: bridgedContractData.projectRevisionId || null,
      projectRevisionCode: bridgedContractData.projectRevisionCode || null,
      projectRevisionStatus: bridgedContractData.projectRevisionStatus || null,
      finalRevisionId: bridgedContractData.finalRevisionId || null,
      finalQuotationId: bridgedContractData.finalQuotationId || null,
      finalQuotationNumber: bridgedContractData.finalQuotationNumber || bridgedContractData.quotationNumber || null,
      quotationRole: bridgedContractData.quotationRole || null,
      
      customerName: bridgedContractData.customerName || '',
      customerEmail: bridgedContractData.customerEmail || '',
      customerCompany: bridgedContractData.customerCompany || '',
      customerAddress: bridgedContractData.customerAddress || '',
      customerCountry: bridgedContractData.customerCountry || '',
      contactPerson: bridgedContractData.contactPerson || '',
      contactPhone: bridgedContractData.contactPhone || '',
      
      salesPerson: bridgedContractData.salesPerson || '',
      salesPersonName: bridgedContractData.salesPersonName || '',
      supervisor: bridgedContractData.supervisor,
      region: normalizeContractRegionCode(bridgedContractData.region || 'NA'),
      
      products: normalizedProducts,
      
      totalAmount,
      currency: contractCurrency,
      tradeTerms: contractData.tradeTerms || 'FOB Xiamen',
      paymentTerms: resolvedPaymentTerms,
      paymentMode: resolvedPaymentMode,
      balanceTrigger: resolvedBalanceTrigger,
      depositPercentage,
      depositAmount,
      balancePercentage,
      balanceAmount,
      deliveryTime: bridgedContractData.deliveryTime || '25-30 days after deposit received',
      portOfLoading: bridgedContractData.portOfLoading || 'Xiamen, China',
      portOfDestination: bridgedContractData.portOfDestination || '',
      packing: bridgedContractData.packing || 'Export standard carton',
      
      status: 'draft',
      approvalStatus: 'draft',
      executionStatus: 'draft',
      paymentStatusDeposit: isNoDepositMode(resolvedPaymentMode) ? 'not_required' : 'pending',
      paymentStatusBalance: 'not_due',
      
      approvalFlow: {
        requiresDirectorApproval,
        currentStep: 'supervisor',
        steps: requiresDirectorApproval ? ['supervisor', 'director'] : ['supervisor']
      },
      approvalHistory: [],
      
      createdAt: now,
      updatedAt: now,
      
      remarks: bridgedContractData.remarks,
      attachments: bridgedContractData.attachments || [],
      templateId: bridgedContractData.templateId || null,
      templateVersionId: bridgedContractData.templateVersionId || null,
      templateSnapshot: bridgedContractData.templateSnapshot || null,
      documentDataSnapshot: adaptSalesContractToDocumentData({
        ...bridgedContractData,
        contractNumber,
        createdAt: now,
        totalAmount,
        currency: contractCurrency,
        products: normalizedProducts,
        depositAmount,
        balanceAmount,
        paymentTerms: resolvedPaymentTerms,
        paymentMode: resolvedPaymentMode,
        balanceTrigger: resolvedBalanceTrigger,
      }),
      documentRenderMeta: bridgedContractData.documentRenderMeta || null,
    };

    const normalizedContract = normalizeSalesContractWritePayload(newContract);

    
    assertSalesContractWritePayload(normalizedContract);
    let saved: SalesContract | null = null;
    try {
      saved = await pushSalesContractViaServer(normalizedContract);
    } catch (serverError) {
      console.warn('⚠️ [SalesContractContext] 服务端下推 SC 失败，回退前端直写:', serverError);
      saved = await contractService.upsert(normalizedContract);
    }
    if (!saved) {
      throw new Error(`销售合同 ${normalizedContract.contractNumber} 创建失败`);
    }
    assertSalesContractPersistedBinding(saved as SalesContract);
    setContracts(prev => [...prev.filter(c => c.id !== saved.id), saved as SalesContract]);
    await syncQuotationBridgeFromContract(saved as SalesContract, {
      contractStatus: (saved as SalesContract).status,
      pushedContractAt: (saved as SalesContract).createdAt,
    });
    toast.success(`销售合同 ${normalizedContract.contractNumber} 创建成功！`);
    return saved as SalesContract;
  };
  
  // 🔥 更新合同
  const updateContract = async (id: string, updates: Partial<SalesContract>) => {
    const targetContract = contracts.find(c => c.id === id);
    if (!targetContract) return;
    const merged = normalizeSalesContractWritePayload({ ...targetContract, ...updates, updatedAt: new Date().toISOString() } as SalesContract);
    if (updates.totalAmount && updates.totalAmount !== targetContract.totalAmount) {
      const requiresDirectorApproval = updates.totalAmount >= 20000;
      merged.approvalFlow = {
        requiresDirectorApproval,
        currentStep: 'supervisor',
        steps: requiresDirectorApproval ? ['supervisor', 'director'] : ['supervisor']
      };
    }
    assertSalesContractWritePayload(merged);
    const saved = await contractService.upsert(merged);
    if (!saved) {
      throw new Error(`合同 ${targetContract.contractNumber || id} 更新失败`);
    }
    assertSalesContractPersistedBinding(saved as SalesContract);
    setContracts(prev => prev.map(contract => contract.id === id ? saved as SalesContract : contract));
    await syncQuotationBridgeFromContract(saved as SalesContract, {
      contractStatus: (saved as SalesContract).status,
    });
    toast.success('合同已更新！');
  };
  
  // 🔥 删除合同
  const deleteContract = async (id: string) => {
    const deletionResult = await contractService.delete(id);
    setContracts(prev => prev.filter(c => c.id !== id));
    await clearQuotationBridgeForDeletedContract(
      deletionResult?.deletedContract || contracts.find((c) => c.id === id) || {},
      deletionResult?.remainingLatestContract || null,
    );
    toast.success('合同已删除！');
  };
  
  // 🔥 清空所有合同
  const clearAllContracts = () => {
    clearingRef.current = true;
    setContracts([]);
    toast.success('All contracts cleared');
  };
  
  // 🔥 根据ID获取合同
  const getContractById = (id: string) => {
    return contracts.find(c => c.id === id);
  };
  
  // 🔥 根据报价单号获取合同
  const getContractByQuotationNumber = (quotationNumber: string) => {
    return pickLatestContract(
      contracts.filter(c => String(c.quotationNumber || '').trim() === String(quotationNumber || '').trim()),
    );
  };
  
  // 🔥 根据合同编号获取合同
  const getContractByContractNumber = (contractNumber: string) => {
    return contracts.find(c => c.contractNumber === contractNumber);
  };
  
  // 🔥 提交审批
  const submitForApproval = async (id: string, notes?: string) => {
    const contractKey = String(id || '').trim();
    const submittedContract = contracts.find(c =>
      String(c.id || '').trim() === contractKey ||
      String(c.contractNumber || '').trim() === contractKey
    );
    if (!submittedContract) {
      throw new Error(`未找到销售合同 ${contractKey || '未知编号'}，请刷新后重试`);
    }

    const now = new Date().toISOString();
    const updatedContract = normalizeSalesContractWritePayload({
      ...submittedContract,
      status: 'pending_supervisor',
      approvalStatus: 'pending_l1',
      executionStatus: 'draft',
      paymentStatusDeposit: submittedContract.paymentStatusDeposit || 'pending',
      paymentStatusBalance: submittedContract.paymentStatusBalance || 'not_due',
      submittedAt: now,
      approvalNotes: notes,
      approvalFlow: {
        ...(submittedContract.approvalFlow || {}),
        currentStep: 'supervisor',
      },
      approvalHistory: [...(submittedContract.approvalHistory || []), {
        action: 'submitted',
        actor: submittedContract.salesPersonName,
        actorRole: 'salesperson',
        timestamp: now,
        notes,
        amount: submittedContract.totalAmount
      }],
      updatedAt: now,
    } as SalesContract);

    assertSalesContractWritePayload(updatedContract);
    const saved = await persistSalesContractViaServerFirst(updatedContract);
    if (!saved) {
      throw new Error(`合同 ${submittedContract.contractNumber || id} 提交审批失败`);
    }
    assertSalesContractPersistedBinding(saved as SalesContract);
    setContracts(prev => prev.map(contract =>
      contract.id === submittedContract.id || contract.contractNumber === submittedContract.contractNumber
        ? saved as SalesContract
        : contract
    ));
    await syncQuotationBridgeFromContract(saved as SalesContract, {
      contractStatus: (saved as SalesContract).status,
    });
  };
  
  // 🔥 审批通过
  const approveContract = async (id: string, approverRole: 'supervisor' | 'director', notes?: string) => {
    const contractKey = String(id || '').trim();
    const contract = contracts.find(c =>
      String(c.id || '').trim() === contractKey ||
      String(c.contractNumber || '').trim() === contractKey
    );
    if (!contract) {
      throw new Error(`未找到销售合同 ${contractKey || '未知编号'}，无法同步审批结果`);
    }
    const now = new Date().toISOString();
    const updated = { ...contract };
    updated.approvalHistory.push({
      action: 'approved',
      actor: approverRole === 'supervisor' ? '区域主管' : '销售总监',
      actorRole: approverRole,
      timestamp: now,
      notes
    });
    if (approverRole === 'supervisor') {
      if (contract.approvalFlow.requiresDirectorApproval) {
        updated.status = 'pending_director';
        updated.approvalStatus = 'pending_l2';
        updated.executionStatus = 'draft';
        updated.approvalFlow.currentStep = 'director';
      } else {
        updated.status = 'approved';
        updated.approvalStatus = 'approved';
        updated.executionStatus = 'draft';
        updated.approvalFlow.currentStep = 'completed';
        updated.approvedAt = now;
      }
    } else if (approverRole === 'director') {
      updated.status = 'approved';
      updated.approvalStatus = 'approved';
      updated.executionStatus = 'draft';
      updated.approvalFlow.currentStep = 'completed';
      updated.approvedAt = now;
    }
    updated.updatedAt = now;
    const saved = await persistSalesContractViaServerFirst(normalizeSalesContractWritePayload(updated as SalesContract));
    if (!saved) {
      throw new Error(`合同 ${contract.contractNumber || id} 审批同步失败`);
    }
    setContracts(prev => prev.map(item =>
      item.id === contract.id || item.contractNumber === contract.contractNumber
        ? saved as SalesContract
        : item
    ));
    await syncQuotationBridgeFromContract(saved as SalesContract, {
      contractStatus: (saved as SalesContract).status,
    });

    if (contract?.approvalFlow.requiresDirectorApproval && approverRole === 'supervisor') {
      toast.success('主管审批通过！合同已提交给销售总监审批。');
    } else {
      toast.success('合同审批通过！现在可以发送给客户了。');
    }
  };
  
  // 🔥 审批驳回
  const rejectContract = async (id: string, reason: string, approverRole: 'supervisor' | 'director') => {
    const rejectedContract = contracts.find(c => c.id === id);
    if (!rejectedContract) return;
    const updated = { ...rejectedContract };
    updated.status = 'rejected';
    updated.rejectionReason = reason;
    updated.approvalHistory.push({
      action: 'rejected',
      actor: approverRole === 'supervisor' ? '区域主管' : '销售总监',
      actorRole: approverRole,
      timestamp: new Date().toISOString(),
      notes: reason
    });
    const saved = await contractService.upsert(updated);
    if (!saved) {
      throw new Error(`合同 ${rejectedContract.contractNumber || id} 驳回同步失败`);
    }
    setContracts(prev => prev.map(contract => contract.id === id ? saved as SalesContract : contract));
    await syncQuotationBridgeFromContract(saved as SalesContract, {
      contractStatus: (saved as SalesContract).status,
      rejectionReason: (saved as SalesContract).rejectionReason || reason,
    });
    toast.error('合同已被驳回，请修改后重新提交！');
  };
  
  // 🔥 发送给客户（先调后端接口落库，再刷新列表并同步订单到客户视角）
  const sendToCustomer = async (id: string): Promise<void> => {
    const contractKey = String(id || '').trim();
    const contract = contracts.find(c =>
      String(c.id || '').trim() === contractKey ||
      String(c.contractNumber || '').trim() === contractKey
    );
    if (!contract || contract.status !== 'approved') {
      console.error('❌ [sendToCustomer] 状态不是approved，实际:', contract?.status);
      toast.error('只能发送审批通过的合同！');
      return;
    }
    // 仅按合同状态判断是否已发送（规范化：仅检查 'sent'，不再使用 'sent_to_customer'）
    if (contract.sentToCustomerAt || contract.status === 'sent') {
      toast.warning('该合同已发送给客户！请勿重复操作。');
      return;
    }
    // 本地立即执行发送（确保 UI 响应），再异步同步后端
    const doLocalSend = async () => {
      const now = new Date().toISOString();

      // 🔥 确保 customerEmail 有效：从合同、关联报价单、localStorage 多重来源兜底
      const INVALID_EMAILS = new Set(['', 'N/A', 'n/a', 'undefined', 'null', 'customer@example.com']);
      const isValidEmail = (e?: string) => !!e && !INVALID_EMAILS.has(e) && e.includes('@');

      let resolvedCustomerEmail = isValidEmail(contract.customerEmail) ? contract.customerEmail : '';

      if (!resolvedCustomerEmail) {
        // 方法1：从 Supabase sales_quotations 通过 quotationNumber 查找
        try {
          const { data: qtRows } = await supabase
            .from('sales_quotations')
            .select('customer_email')
            .or(`qt_number.eq.${contract.quotationNumber},id.eq.${contract.quotationNumber}`)
            .limit(1);
          const candidate = qtRows?.[0]?.customer_email;
          if (isValidEmail(candidate)) {
            resolvedCustomerEmail = candidate;
          }
        } catch { /* ignore */ }
      }

      if (!resolvedCustomerEmail) {
        // 方法2：从 Supabase inquiries 通过 inquiryNumber 查找
        try {
          const { data: inqRows } = await supabase
            .from('inquiries')
            .select('user_email, buyer_info')
            .or(`inquiry_number.eq.${contract.inquiryNumber},id.eq.${contract.inquiryNumber}`)
            .limit(1);
          const row = inqRows?.[0];
          const candidate = (row?.buyer_info as any)?.email || row?.user_email;
          if (isValidEmail(candidate)) {
            resolvedCustomerEmail = candidate;
          }
        } catch { /* ignore */ }
      }


      if (!resolvedCustomerEmail) {
        throw new Error('未找到有效客户邮箱，无法把合同下推到客户订单');
      }

      // 构建订单数据
      const orderData = {
        id: contract.id,
        orderNumber: contract.contractNumber,
        contractNumber: contract.contractNumber,
        customer: contract.customerName,
        customerEmail: resolvedCustomerEmail,
        quotationNumber: contract.quotationNumber,
        date: (contract.createdAt || now).split('T')[0],
        expectedDelivery: contract.deliveryTime,
        totalAmount: contract.totalAmount,
        currency: contract.currency,
        status: 'Pending',
        progress: 0,
        products: (contract.products || []).map((p: SalesContractProduct) => ({
          name: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalPrice: p.quantity * p.unitPrice,
          specs: p.specification || ''
        })),
        paymentStatus: 'Pending',
        paymentTerms: contract.paymentTerms,
        shippingMethod: contract.tradeTerms,
        deliveryTerms: contract.tradeTerms,
        region: contract.region,
        country: contract.customerCountry,
        deliveryAddress: contract.customerAddress,
        contactPerson: contract.contactPerson,
        phone: contract.contactPhone,
        createdFrom: 'sales_contract',
        createdAt: contract.createdAt,
        updatedAt: now,
      };

      // 1. 写入 orders 主数据表；只有写入成功才允许继续发送
      let savedOrder: Record<string, any> | null = null;
      try {
        savedOrder = await pushCustomerOrderViaServer(orderData);
      } catch (serverError) {
        console.warn('⚠️ [sendToCustomer] 服务端写入 orders 失败，回退客户端直写:', serverError);
        savedOrder = await orderService.upsert(orderData);
      }
      if (!savedOrder) {
        throw new Error('客户订单主数据写入失败，合同未发送');
      }

      // 2. 持久化 SC 状态到 sales_contracts（status='sent' + sent_to_customer_at）
      // 仅在 email 有变化时额外写入 customer_email，防止覆盖为空值
      try {
        const scExtra: Record<string, any> = { sent_to_customer_at: now };
        if (resolvedCustomerEmail && resolvedCustomerEmail !== contract.customerEmail) {
          scExtra.customer_email = resolvedCustomerEmail;
        }
        await contractService.updateStatus(contract.id || contract.contractNumber, 'sent', scExtra);
      } catch (_e) {
        console.warn('⚠️ [sendToCustomer] Supabase sales_contracts 状态写入失败，仅本地处理');
      }

      // 3. 更新本地 React state（DB write 完成后同步）
      setContracts(prev => prev.map(c =>
        c.id === contract.id || c.contractNumber === contract.contractNumber
          ? {
              ...c,
              status: 'sent' as const,
              approvalStatus: 'approved',
              executionStatus: 'sent_to_customer',
              paymentStatusDeposit: c.paymentStatusDeposit || (isNoDepositMode(c.paymentMode) ? 'not_required' : 'pending'),
              paymentStatusBalance: c.paymentStatusBalance || 'not_due',
              sentToCustomerAt: now,
              updatedAt: now,
              customerEmail: resolvedCustomerEmail || c.customerEmail,
            }
          : c
      ));

      // 4. 同时走 context addOrder（更新当前 React state）
      addOrder(orderData);

      // 5. 广播事件，触发客户端 OrderContext 重新加载
      window.dispatchEvent(new CustomEvent('ordersUpdated', {
        detail: { action: 'add', orderNumber: orderData.orderNumber, customerEmail: resolvedCustomerEmail }
      }));

      await syncQuotationBridgeFromContract({
        ...contract,
        status: 'sent',
        sentToCustomerAt: now,
        customerEmail: resolvedCustomerEmail || contract.customerEmail,
      }, {
        contractStatus: 'sent',
        soNumber: orderData.orderNumber,
        sentToCustomerAt: now,
      });

      sendNotificationToUsers(getFinanceNotificationRecipients(), {
        type: 'contract_review',
        title: `📄 SC Sent To Customer - ${contract.contractNumber}`,
        message: `Sales contract ${contract.contractNumber} has been sent to customer ${contract.customerName}. Current status: Sent to Customer.`,
        relatedId: contract.contractNumber,
        relatedType: 'sales_contract',
        sender: contract.salesPerson || 'system-auto',
        metadata: {
          contractNumber: contract.contractNumber,
          quotationNumber: contract.quotationNumber || 'N/A',
          customerName: contract.customerName,
          customerEmail: resolvedCustomerEmail || contract.customerEmail,
          amount: `${contract.currency || 'USD'} ${(contract.totalAmount || 0).toLocaleString()}`,
          status: 'sent',
          sentToCustomerAt: now,
        },
      });

      toast.success('合同已发送给客户！客户可在 My Orders → Active Orders 查看。');
    };

    // 直接走本地逻辑（Supabase-first：doLocalSend 内部查 Supabase 获取 email 并 upsert 合同）
    try {
      await doLocalSend();
    } catch (error: any) {
      console.error('❌ [sendToCustomer] 发送合同失败:', error);
      toast.error(error?.message || '发送合同失败，请稍后重试');
    }
  };
  
  // 🔥 客户确认合同 — 单一写入路径（状态 + 签名 + feedback + AR 自动创建）
  const customerConfirmContract = async (
    id: string,
    signature: ElectronicSignature,
    silent = false,
    customerFeedback?: Record<string, any>,
  ): Promise<void> => {
    const now = new Date().toISOString();
    const contractKey = String(id || '').trim();

    // Single authoritative DB write. Customer portal confirmation must go through
    // the server because the logged-in account may be the enterprise account
    // while the SC contact email is a different business contact.
    const saved = await customerConfirmSalesContractViaServer(contractKey, signature, customerFeedback);

    // Sync local state: update in-place if present, otherwise no-op (realtime subscription will catch it)
    setContracts(prev => {
      const idx = prev.findIndex(c =>
        String(c.id || '').trim() === contractKey ||
        String(c.contractNumber || '').trim() === contractKey ||
        String((saved as any)?.id || '').trim() === String(c.id || '').trim() ||
        String((saved as any)?.contractNumber || '').trim() === String(c.contractNumber || '').trim()
      );
      if (idx === -1) return prev;
      const merged = saved
        ? { ...prev[idx], ...saved }
        : { ...prev[idx], status: 'customer_confirmed' as const, buyerSignature: signature, customerConfirmedAt: now, customerFeedback: customerFeedback };
      return [...prev.slice(0, idx), merged, ...prev.slice(idx + 1)];
    });

    const confirmedContract = (saved || contracts.find(c =>
      String(c.id || '').trim() === contractKey ||
      String(c.contractNumber || '').trim() === contractKey
    ) || null) as SalesContract | null;
    if (confirmedContract) {
      await syncQuotationBridgeFromContract({
        ...confirmedContract,
        status: 'customer_confirmed',
        customerConfirmedAt: now,
        customerFeedback: customerFeedback || null,
      }, {
        contractStatus: 'customer_confirmed',
        customerConfirmedAt: now,
        customerFeedback: customerFeedback || null,
      });
    }

    // AR auto-creation with idempotency guard
    const contract = contracts.find(c =>
      String(c.id || '').trim() === contractKey ||
      String(c.contractNumber || '').trim() === contractKey
    ) || saved;
    const contractNumber = (contract as any)?.contractNumber || (contract as any)?.contract_number;
    if (contractNumber) {
      try {
        const existing = await arService.getByOrderNumber(contractNumber);
        if (existing) {
          console.log(`[SC→AR] AR already exists for ${contractNumber}, skipping.`);
        } else {
          const c = contract as any;
          const region = contractNumber.split('-')[1] || 'NA';
          const d = new Date();
          const dateStr = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
          const arNumber = `YS-${region}-${dateStr}-0001`;
          const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const newAR = {
            id: `ar-${Date.now()}`,
            arNumber,
            orderNumber: contractNumber,
            quotationNumber: c.quotationNumber || null,
            contractNumber,
            customerName: c.customerName || '',
            customerEmail: c.customerEmail || '',
            region,
            invoiceDate: d.toISOString().split('T')[0],
            dueDate,
            totalAmount: c.totalAmount || 0,
            paidAmount: 0,
            remainingAmount: c.totalAmount || 0,
            currency: c.currency || 'USD',
            status: 'pending',
            paymentTerms: c.paymentTerms || '30% T/T deposit, 70% balance before shipment',
            products: (c.products || []).map((p: any) => ({
              name: p.productName || p.name || '',
              quantity: p.quantity || 0,
              unitPrice: p.unitPrice || 0,
              totalPrice: p.amount || p.totalPrice || (p.quantity || 0) * (p.unitPrice || 0),
            })),
            paymentHistory: [],
            createdAt: now,
            updatedAt: now,
            createdBy: 'system-auto',
            notes: buildScArNotes({
              contractNumber,
              quotationNumber: c.quotationNumber || null,
              contractStatus: 'customer_confirmed',
              extraNotes: 'Auto-generated from customer contract acceptance.',
            }),
          };
          await arService.upsert(newAR);
          console.log(`✅ [SC→AR] AR created: ${arNumber} for contract ${contractNumber}`);
        }
      } catch (arErr: any) {
        console.warn(`⚠️ [SC→AR] AR auto-creation failed for ${contractNumber}:`, arErr?.message);
      }
    }

    const contractForFinance = (contracts.find(c =>
      String(c.id || '').trim() === contractKey ||
      String(c.contractNumber || '').trim() === contractKey
    ) || saved) as any;
    if (contractForFinance?.contractNumber) {
      sendNotificationToUsers(getFinanceNotificationRecipients(), {
        type: 'contract_review',
        title: `💰 AR Created For SC - ${contractForFinance.contractNumber}`,
        message: `Customer confirmed sales contract ${contractForFinance.contractNumber}. Accounts receivable has been created and is waiting for deposit.`,
        relatedId: contractForFinance.contractNumber,
        relatedType: 'accounts_receivable',
        sender: signature.signedByEmail || 'system-auto',
        metadata: {
          contractNumber: contractForFinance.contractNumber,
          quotationNumber: contractForFinance.quotationNumber || 'N/A',
          customerName: contractForFinance.customerName || '',
          customerEmail: contractForFinance.customerEmail || '',
          amount: `${contractForFinance.currency || 'USD'} ${Number(contractForFinance.totalAmount || 0).toLocaleString()}`,
          status: 'customer_confirmed',
          customerConfirmedAt: now,
        },
      });
    }

    if (!silent) toast.success('客户已确认合同！应收账款已自动创建。');
  };
  
  // 🔥 客户拒绝合同
  // Note: writes to rejection_reason column, same column used by internal rejectContract().
  // Schema debt — accepted as temporary. Separate column for customer rejection reason is out of scope.
  const customerRejectContract = async (id: string, reason: string): Promise<void> => {
    try {
      await contractService.updateStatus(id, 'customer_rejected', {
        rejection_reason: reason,
      });
    } catch (err: any) {
      toast.error(`客户拒绝状态保存失败：${err?.message || '请重试'}`);
      return;
    }

    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'customer_rejected' as const,
          approvalStatus: contract.approvalStatus || 'approved',
          executionStatus: 'customer_rejected',
          rejectionReason: reason,
          updatedAt: new Date().toISOString(),
        };
      }
      return contract;
    }));

    const rejectedContract = contracts.find(c => c.id === id);
    if (rejectedContract) {
      await syncQuotationBridgeFromContract({
        ...rejectedContract,
        status: 'customer_rejected',
        rejectionReason: reason,
      }, {
        contractStatus: 'customer_rejected',
        rejectionReason: reason,
      });
    }

    toast.error('客户拒绝了合同！');
  };
  
  // 🔥 客户请求修改
  const customerRequestChanges = async (id: string, requestedChanges: string): Promise<void> => {
    const contract = contracts.find(c => c.id === id);
    const updatedRemarks = `客户修改意见：${requestedChanges}\n\n${contract?.remarks || ''}`;

    try {
      await contractService.updateStatus(id, 'customer_requested_changes', {
        remarks: updatedRemarks,
      });
    } catch (err: any) {
      toast.error(`客户修改请求保存失败：${err?.message || '请重试'}`);
      return;
    }

    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: 'customer_requested_changes' as const,
          approvalStatus: c.approvalStatus || 'approved',
          executionStatus: 'customer_requested_changes',
          remarks: updatedRemarks,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));

    if (contract) {
      await syncQuotationBridgeFromContract({
        ...contract,
        status: 'customer_requested_changes',
        remarks: updatedRemarks,
      }, {
        contractStatus: 'customer_requested_changes',
      });
    }

    toast.info('客户请求修改合同内容！');
  };
  
  // 🔥 添加卖方签名
  const addSellerSignature = async (id: string, signature: ElectronicSignature): Promise<void> => {
    // Read current status at call time to avoid writing a stale status from closure
    const currentStatus = contracts.find(c => c.id === id)?.status;
    if (!currentStatus) return;

    try {
      await contractService.updateStatus(id, currentStatus, {
        seller_signature: signature,
      });
    } catch (err: any) {
      toast.error(`卖方签名保存失败：${err?.message || '请重试'}`);
      return;
    }

    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return { ...contract, sellerSignature: signature, updatedAt: new Date().toISOString() };
      }
      return contract;
    }));

    toast.success('卖方签名已添加！');
  };
  
  // 🔥 添加买方签名
  const addBuyerSignature = async (id: string, signature: ElectronicSignature): Promise<void> => {
    // Read current status at call time to avoid writing a stale status from closure
    const currentStatus = contracts.find(c => c.id === id)?.status;
    if (!currentStatus) return;

    try {
      await contractService.updateStatus(id, currentStatus, {
        buyer_signature: signature,
      });
    } catch (err: any) {
      toast.error(`买方签名保存失败：${err?.message || '请重试'}`);
      return;
    }

    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return { ...contract, buyerSignature: signature, updatedAt: new Date().toISOString() };
      }
      return contract;
    }));

    toast.success('买方签名已添加！');
  };
  
  // 🔥 上传定金凭证
  const uploadDepositProof = async (id: string, fileName: string, fileUrl: string, uploadedBy: string): Promise<void> => {
    const uploadedAt = new Date().toISOString();
    const depositProofPayload = { fileName, fileUrl, uploadedBy, uploadedAt };

    try {
      await contractService.updateStatus(id, 'deposit_uploaded', {
        deposit_proof: depositProofPayload,
      });
    } catch (err: any) {
      toast.error(`定金凭证上传失败：${err?.message || '请重试'}`);
      return;
    }

    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'deposit_uploaded' as const,
          approvalStatus: contract.approvalStatus || 'approved',
          executionStatus: 'deposit_uploaded',
          paymentStatusDeposit: 'uploaded',
          paymentStatusBalance: contract.paymentStatusBalance || 'not_due',
          depositProof: depositProofPayload,
          updatedAt: uploadedAt,
        };
      }
      return contract;
    }));

    toast.success('定金凭证已上传！');
  };
  
  // 🔥 确认定金
  const confirmDeposit = async (id: string, confirmedBy: string, notes?: string): Promise<void> => {
    const confirmedAt = new Date().toISOString();
    const contract = contracts.find(c => c.id === id || c.contractNumber === id);
    if (!contract) return;

    try {
      const saved = await persistSalesContractViaServerFirst({
        ...contract,
        status: 'deposit_confirmed',
        depositConfirmedBy: confirmedBy,
        depositConfirmedAt: confirmedAt,
        depositConfirmNotes: notes || null,
        updatedAt: confirmedAt,
      } as SalesContract);

      setContracts(prev => prev.map(current =>
        current.id === saved.id
          ? saved
          : current
      ));

      await syncQuotationBridgeFromContract(saved, {
        contractStatus: 'deposit_confirmed',
      });
    } catch (err: any) {
      toast.error(`定金确认失败：${err?.message || '请重试'}`);
      return;
    }

    toast.success('定金已确认！现在可以创建 CG。');
  };
  
  // ⚠️ DEPRECATED (Phase 3a): Non-authoritative SC-side placeholder.
  // Does NOT create a purchase_orders row. Has NO live UI callers.
  // Superseded by markPRInitiated(), which is called by the real procurement trigger
  // (requestProcurementFromContract in SalesContractManagement.tsx).
  // Retained for backward compatibility — do NOT call from new code.
  const generatePurchaseOrder = async (id: string): Promise<string[]> => {
    const contract = contracts.find(c => c.id === id);

    // Phase 2b-ii: isNoDepositMode covers both oa and lc_100 — no deposit stage, so PO can be
    // generated from customer_confirmed onwards. deposit_plus_lc still requires deposit_confirmed
    // first (deposit stage must complete before procurement). All other modes: deposit_confirmed.
    const poEligible: string[] = isNoDepositMode(contract?.paymentMode)
      ? ['customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'po_generated', 'production']
      : ['deposit_confirmed', 'po_generated', 'production'];

    if (!contract || !poEligible.includes(contract.status)) {
      toast.error(isNoDepositMode(contract?.paymentMode)
        ? '无法创建 CG，请确认合同已被客户确认。'
        : '无法创建 CG，请确认定金已收到。');
      return [];
    }

    const poNumber = `CG-${contract.contractNumber}`;

    try {
      await contractService.updateStatus(id, 'po_generated', {
        purchase_order_numbers: [poNumber],
      });
    } catch (err: any) {
      toast.error(`CG 创建失败：${err?.message || '请重试'}`);
      return [];
    }

    setContracts(prev => prev.map(c =>
      c.id === id
        ? {
            ...c,
            status: 'po_generated' as const,
            approvalStatus: c.approvalStatus || 'approved',
            executionStatus: 'in_procurement',
            paymentStatusDeposit: c.paymentStatusDeposit || 'confirmed',
            paymentStatusBalance: c.paymentStatusBalance || 'not_due',
            purchaseOrderNumbers: [poNumber],
            updatedAt: new Date().toISOString(),
          }
        : c
    ));

    toast.success(`CG ${poNumber} 已创建！`);
    return [poNumber];
  };

  // Phase 3a: SC → PR initiation write-back ─────────────────────────────────────────────────────
  // The real SC-side procurement trigger (requestProcurementFromContract in
  // SalesContractManagement.tsx) calls this after successfully creating the PR record in
  // purchase_orders. This is the authoritative path that sets SC.status = 'po_generated'.
  //
  // Behaviour:
  //   • Advances SC.status to 'po_generated' via contractService.updateStatus (minimal write —
  //     no full upsert assertion required)
  //   • Appends prNumber to SC.purchaseOrderNumbers — preserves any previously recorded numbers
  //   • Updates local React state so the UI reflects the change immediately without a reload
  //   • Does NOT create purchase_orders rows (that is requestProcurementFromContract's job)
  //   • Does NOT show a toast (the caller shows its own success/failure toast)
  const markPRInitiated = async (id: string, prNumber: string): Promise<void> => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    // Append to any already-recorded numbers; deduplicate to guard against re-triggers
    const existing = contract.purchaseOrderNumbers ?? [];
    const updated = existing.includes(prNumber) ? existing : [...existing, prNumber];

    try {
      await contractService.updateStatus(id, 'po_generated', {
        purchase_order_numbers: updated,
      });
    } catch (err: any) {
      throw new Error(`SC 采购启动状态写入失败：${err?.message || '请重试'}`);
    }

    setContracts(prev => prev.map(c =>
      c.id === id
        ? {
            ...c,
            status: 'po_generated' as const,
            approvalStatus: c.approvalStatus || 'approved',
            executionStatus: 'in_procurement',
            paymentStatusDeposit: c.paymentStatusDeposit || 'confirmed',
            paymentStatusBalance: c.paymentStatusBalance || 'not_due',
            purchaseOrderNumbers: updated,
            updatedAt: new Date().toISOString(),
          }
        : c
    ));
    await syncQuotationBridgeFromContract({
      ...contract,
      status: 'po_generated',
      purchaseOrderNumbers: updated,
    }, {
      contractStatus: 'po_generated',
      purchaseOrderNumbers: updated,
    });
  };
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // Phase 3c: procurement-execution mirror ──────────────────────────────────────────────────────
  // Called by PurchaseOrderManagementEnhanced (handlePushPurchaseToSupplier) after ALL standard-
  // path CG records for a given PR have reached procurementRequestStatus === 'pushed_supplier'.
  // Resolves the SC.production orphan status by giving it a real, automated write path.
  //
  // Parameter: contractNumber (SC-xxx) — the PR record carries this in salesContractNumber /
  //   sourceRef; the admin component does not have the SC internal id.
  //
  // Safety gate: only advances SC from 'po_generated'. Statuses at or after 'production'
  //   (balance_confirmed, shipped, completed) are NOT overwritten. This is a one-way advancement
  //   only; there is no rollback.
  //
  // ⚠️  Phase 5 rule: this is the TERMINAL automated SC reflection point.
  //     SC mirrors CG execution up to 'production' only.
  //     SC does NOT auto-sync further CG states ('producing', 'shipped', 'completed').
  //     SC.shipped → advanceSCToShipped (salesperson-triggered, manual).
  //     SC.completed → advanceSCToCompleted (salesperson-triggered, manual).
  //     Do NOT add further auto-advance steps to this function or create new callers
  //     that would push SC beyond 'production' based on CG state changes.
  const advanceSCToProduction = async (contractNumber: string): Promise<void> => {
    const contract = contracts.find(c => c.contractNumber === contractNumber);
    if (!contract) return;

    // Conservative eligibility: only advance from po_generated.
    // po_generated is the expected SC state when the PR has been initiated (Phase 3a) and
    // supplier allocation is complete. Do not overwrite any status that comes after production.
    if (contract.status !== 'po_generated') return;

    try {
      await contractService.updateStatus(contract.id, 'production');
    } catch (err: any) {
      throw new Error(`SC 生产状态写入失败：${err?.message || '请重试'}`);
    }

    setContracts(prev => prev.map(c =>
      c.id === contract.id
        ? {
            ...c,
            status: 'production' as const,
            approvalStatus: c.approvalStatus || 'approved',
            executionStatus: 'in_production',
            paymentStatusDeposit: c.paymentStatusDeposit || 'confirmed',
            paymentStatusBalance: c.paymentStatusBalance || 'pending',
            updatedAt: new Date().toISOString(),
          }
        : c
    ));
    await syncQuotationBridgeFromContract({
      ...contract,
      status: 'production',
    }, {
      contractStatus: 'production',
    });
  };
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  // 🔥 确认尾款收到 / 确认信用证落实 [Phase 2b-ii: mode-aware eligible statuses]
  // 当前线上 sales_contracts.status 实际仅接受较早期的一组枚举值，
  // 因此这里不再强行把合同写成 balance_confirmed，避免财务回款成功后
  // 又因为合同状态枚举不兼容而额外报错。尾款/信用证的完成态以订单、
  // 应收与凭证为主数据源，合同保留现有合法状态即可。
  const confirmBalancePayment = async (
    id: string,
    confirmedBy: string,
    notes?: string,
    receiptProof?: Record<string, any>,
  ): Promise<void> => {
    const contract = contracts.find(c => c.id === id || c.contractNumber === id);
    if (!contract) return;

    // Ship-first modes (2/5/6): balance confirmed AFTER shipment — includes 'shipped' in eligible set.
    // lc_100: no deposit stage — eligible from po_generated / production (LC readiness confirmation).
    // deposit_plus_lc / Mode 1 / null: eligible from deposit_confirmed / po_generated / production.
    const ELIGIBLE: string[] = isShipFirstMode(contract.paymentMode)
      ? ['deposit_confirmed', 'po_generated', 'production', 'shipped']
      : contract.paymentMode === 'lc_100'
        ? ['po_generated', 'production']
        : ['deposit_confirmed', 'po_generated', 'production'];

    if (!ELIGIBLE.includes(contract.status)) {
      toast.error(isLCMode(contract.paymentMode)
        ? '当前合同状态不支持确认信用证落实'
        : '当前合同状态不支持确认尾款');
      return;
    }
    try {
      const confirmedAt = new Date().toISOString();
      const existingRenderMeta = contract.documentRenderMeta || {};
      const existingWorkflow = existingRenderMeta?.erpWorkflow || {};
      const saved = await persistSalesContractViaServerFirst({
        ...contract,
        status: 'balance_confirmed',
        documentRenderMeta: {
          ...existingRenderMeta,
          erpWorkflow: {
            ...existingWorkflow,
            logicalStatus: 'balance_confirmed',
            persistedStatus: 'deposit_confirmed',
            balanceConfirmedBy: confirmedBy,
            balanceConfirmedAt: confirmedAt,
            balanceConfirmNotes: notes || null,
            ...(receiptProof ? { balanceReceiptProof: receiptProof } : {}),
          },
        },
        updatedAt: confirmedAt,
      } as SalesContract);

      setContracts(prev => prev.map(current =>
        current.id === saved.id
          ? saved
          : current
      ));

      await syncQuotationBridgeFromContract(saved, {
        contractStatus: saved.status,
      });
      toast.success(isShipFirstMode(contract.paymentMode)
        ? '尾款确认已记录。'
        : isLCMode(contract.paymentMode)
          ? '信用证确认已记录。'
          : '尾款确认已记录。');
    } catch (err: any) {
      toast.error(`确认失败：${err?.message || '请重试'}`);
    }
  };

  // 🔥 推进合同到已发货 [Phase 2b-i: mode-aware ship gate]
  // Phase 5 rule: SC.shipped is a SALES-CONTROLLED action. It is triggered by the salesperson
  // via a UI button in SalesContractManagement — never by CG state changes.
  // No automated caller should invoke this function based on CG.status or CG.procurementRequestStatus.
  const advanceSCToShipped = async (id: string): Promise<void> => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    // Phase 2b-ii:
    //   OA (no deposit, ship-first): can ship from customer_confirmed / po_generated / production
    //   Ship-first Mode 2 / 5: can ship from deposit_confirmed / po_generated / production
    //   lc_100 / deposit_plus_lc / Mode 1 / null: balance_confirmed required before shipment
    //   (for LC modes, balance_confirmed = LC readiness confirmed — same gate, different business meaning)
    const shipEligible: string[] = isShipFirstMode(contract.paymentMode)
      ? (isNoDepositMode(contract.paymentMode)
          ? ['customer_confirmed', 'deposit_confirmed', 'po_generated', 'production']
          : ['deposit_confirmed', 'po_generated', 'production'])
      : ['balance_confirmed'];

    if (!shipEligible.includes(contract.status)) {
      toast.error(isShipFirstMode(contract.paymentMode)
        ? '请先完成采购生产流程再发货'
        : isLCMode(contract.paymentMode)
          ? '发货前必须先确认信用证已落实'
          : '发货前必须先确认尾款已到账');
      return;
    }
    try {
      await contractService.updateStatus(id, 'shipped');
      setContracts(prev => prev.map(c =>
        c.id === id ? { ...c, status: 'shipped' as const, updatedAt: new Date().toISOString() } : c
      ));
      await syncQuotationBridgeFromContract({
        ...contract,
        status: 'shipped',
      }, {
        contractStatus: 'shipped',
      });
      toast.success('合同已标记为已发货！');
    } catch (err: any) {
      toast.error(`标记发货失败：${err?.message || '请重试'}`);
    }
  };

  // 🔥 推进合同到已完成 [Phase 2b-i: mode-aware complete gate]
  // Phase 5 rule: SC.completed is a SALES-CONTROLLED action. It is triggered by the salesperson
  // via a UI button in SalesContractManagement — never by CG state changes.
  // No automated caller should invoke this function based on CG.status or CG.procurementRequestStatus.
  const advanceSCToCompleted = async (id: string): Promise<void> => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    // Phase 2b-ii:
    //   Ship-first modes (2, 5, 6): balance confirmed post-shipment → gate on balance_confirmed
    //   lc_100 / deposit_plus_lc / Mode 1 / null: balance_confirmed is pre-shipment → gate on shipped
    //   (LC modes are NOT ship-first, so they correctly gate on 'shipped' here — no change needed)
    const completeGate = isShipFirstMode(contract.paymentMode) ? 'balance_confirmed' : 'shipped';

    if (contract.status !== completeGate) {
      toast.error(isShipFirstMode(contract.paymentMode)
        ? '合同完成前须先确认尾款已到账'
        : '合同必须先标记发货后才能完成');
      return;
    }
    // Phase 7A rule:
    // Profit snapshot is written ONLY once at SC completion.
    // It captures ACTUAL profit at that moment.
    // It must NOT be recalculated or overwritten later.
    // If actual profit is unavailable, snapshot is skipped intentionally.
    let snapshotExtra: Record<string, any> | undefined;
    if (!contract.profitSnapshot) {
      const profit = computeSCProfit(
        contract,
        getQuotationByNumber(contract.quotationNumber) ?? null,
        purchaseOrders,
      );
      if (profit.actual.available === true) {
        const snapshot: ProfitSnapshot = {
          finalRevenue:   contract.totalAmount,
          finalCost:      profit.actual.actualCost,
          finalProfit:    profit.actual.actualProfit,
          finalMargin:    profit.actual.actualMargin,
          cgCount:        profit.actual.cgCount,
          additionalCost: contract.additionalCost ?? 0,
          currency:       contract.currency,
          snapshotAt:     new Date().toISOString(),
        };
        snapshotExtra = { profit_snapshot: snapshot };
      }
    }

    try {
      await contractService.updateStatus(id, 'completed', snapshotExtra);
      setContracts(prev => prev.map(c =>
        c.id === id ? {
          ...c,
          status: 'completed' as const,
          updatedAt: new Date().toISOString(),
          ...(snapshotExtra ? { profitSnapshot: snapshotExtra.profit_snapshot as ProfitSnapshot } : {}),
        } : c
      ));
      await syncQuotationBridgeFromContract({
        ...contract,
        status: 'completed',
        ...(snapshotExtra ? { profitSnapshot: snapshotExtra.profit_snapshot as ProfitSnapshot } : {}),
      }, {
        contractStatus: 'completed',
      });
      toast.success('合同已完成！');
    } catch (err: any) {
      toast.error(`标记完成失败：${err?.message || '请重试'}`);
    }
  };

  const value: SalesContractContextType = {
    contracts,
    loaded,
    createContract,
    updateContract,
    deleteContract,
    getContractById,
    getContractByQuotationNumber,
    getContractByContractNumber,
    clearAllContracts, // 🔥 清空所有合同
    submitForApproval,
    approveContract,
    rejectContract,
    sendToCustomer,
    customerConfirmContract,
    customerRejectContract,
    customerRequestChanges,
    uploadDepositProof,
    confirmDeposit,
    generatePurchaseOrder,
    markPRInitiated,
    advanceSCToProduction,
    confirmBalancePayment,
    advanceSCToShipped,
    advanceSCToCompleted,
    addSellerSignature,
    addBuyerSignature,
    refreshFromBackend
  };
  
  return (
    <SalesContractContext.Provider value={value}>
      {children}
    </SalesContractContext.Provider>
  );
}

export function useSalesContracts() {
  const context = useContext(SalesContractContext);
  if (context === undefined) {
    throw new Error('useSalesContracts must be used within a SalesContractProvider');
  }
  return context;
}
