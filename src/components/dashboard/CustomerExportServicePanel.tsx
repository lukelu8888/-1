// 借抬头出口服务 - 客户侧面板
// 仅对 export_service_enabled 的客户可见
// 挂载：My Orders > Export Service

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { exportServiceOrdersDb } from '../../lib/supabase-db';
import {
  Globe, Mail, FileText, CheckCircle2, Clock, XCircle,
  AlertCircle, ChevronRight, Eye, Download, Upload, Info,
  ArrowRight, Package, Anchor, Ship, CreditCard, Check,
  AlertTriangle, Plus, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner';

// ─── Feature flag ─────────────────────────────────────────────────────────────
// 读取当前客户的 export_service_enabled 开关
// 优先级：localStorage 全局覆写 > Supabase customer_service_features 表 > 演示邮件白名单
export function useExportServiceEnabled(): boolean {
  const { user } = useUser();

  // Compute quick synchronous result for initial render
  const quickCheck = (): boolean => {
    if (!user) return false;
    const globalKey = 'cosun_export_service_enabled';
    const global = localStorage.getItem(globalKey);
    if (global === 'true') return true;
    if (global === 'false') return false;
    const demoEmails = ['customer@cosunchina.com', 'demo@cosun.com', 'test.customer@cosun.com'];
    return demoEmails.includes((user.email || '').toLowerCase());
  };

  const [enabled, setEnabled] = useState<boolean>(quickCheck);

  useEffect(() => {
    if (!user?.email) return;
    // Re-check localStorage in case it changed
    const globalKey = 'cosun_export_service_enabled';
    const global = localStorage.getItem(globalKey);
    if (global === 'true') { setEnabled(true); return; }
    if (global === 'false') { setEnabled(false); return; }
    // Query Supabase
    exportServiceOrdersDb.isExportServiceEnabled(user.email).then(setEnabled);
  }, [user?.email]);

  return enabled;
}

// ─── Types (re-use compatible subset from internal types) ─────────────────────

type CommissionSource = 'customer_portal' | 'email_import';
type CustomerStatus = 'Preparing' | 'In Progress' | 'Completed' | 'Cancelled';

interface CustomerAction {
  id: string;
  label: string;
  description: string;
  type: 'info' | 'action' | 'warning';
}

interface CustomerDocument {
  id: string;
  name: string;
  category:
    | 'commission_attachment'
    | 'product_list'
    | 'pi'
    | 'ctn'
    | 'soa'
    | 'payment_slip'
    | 'customer_visible';
  uploadedAt: string;
  sentOrUploadedBy: string;
  fileSize?: string;
  status: 'pending' | 'received' | 'confirmed' | 'rejected';
}

interface CustomerTimelineNode {
  id: string;
  label: string;
  status: 'done' | 'in_progress' | 'pending';
  time?: string;
}

interface CustomerOrder {
  id: string;
  source: CommissionSource;
  type: string;
  customerStatus: CustomerStatus;
  currentAction: CustomerAction;
  updatedAt: string;
  createdAt: string;
  timeline: CustomerTimelineNode[];
  documents: CustomerDocument[];
  piRejectionHint?: string;
  showEmailHint?: boolean; // show "next time use portal" hint if email_import
}

// ─── Customer-side internal-stage → status map ───────────────────────────────

function mapToCustomerStatus(stage: string): CustomerStatus {
  const preparing = [
    'draft_request', 'request_from_email', 'waiting_manager_acceptance',
    'assigned_to_sales', 'pi_preparing', 'pi_pending_approval', 'pi_rejected', 'pi_approved',
  ];
  const done = ['completed'];
  const cancelled = ['cancelled'];
  if (preparing.includes(stage)) return 'Preparing';
  if (done.includes(stage)) return 'Completed';
  if (cancelled.includes(stage)) return 'Cancelled';
  return 'In Progress';
}


// ─── Stage index for timeline computation ─────────────────────────────────────

const STAGE_IDX: Record<string, number> = {
  draft_request: 0, request_from_email: 0,
  waiting_manager_acceptance: 1,
  assigned_to_sales: 2,
  pi_preparing: 3,
  pi_pending_approval: 4, pi_rejected: 4,
  pi_approved: 5,
  pi_sent_to_customer: 6,
  pi_rejected_by_customer: 7,
  pi_accepted_by_customer: 8,
  waiting_ctn_submission: 9, ctn_received: 10,
  waiting_shipping_notice: 11,
  freight_quoting: 12, waiting_freight_confirmation: 12,
  booking_in_progress: 13,
  shipment_coordination: 14, bill_of_lading_isolation: 14,
  soa_preparing: 15, soa_sent: 16,
  waiting_payment_slip: 17, payment_slip_received: 18,
  payment_received_pending_check: 18, payment_confirmed: 19,
  freight_paid_to_forwarder: 20, bl_received_by_us: 21, bl_forwarded_to_supplier: 22,
  completed: 24,
  cancelled: -1,
};

function nodeStatus(idx: number, doneAt: number, inProgressAt?: number): CustomerTimelineNode['status'] {
  if (idx >= doneAt) return 'done';
  if (inProgressAt !== undefined && idx >= inProgressAt) return 'in_progress';
  return 'pending';
}

function buildTimeline(stage: string): CustomerTimelineNode[] {
  const idx = STAGE_IDX[stage] ?? 0;
  return [
    { id: 't1',  label: 'Request Submitted',        status: nodeStatus(idx, 1, 0)   },
    { id: 't2',  label: 'Request Accepted',          status: nodeStatus(idx, 2, 1)   },
    { id: 't3',  label: 'PI in Preparation',         status: nodeStatus(idx, 4, 3)   },
    { id: 't4',  label: 'PI under Review',           status: nodeStatus(idx, 5, 4)   },
    { id: 't5',  label: 'PI Sent to You',            status: nodeStatus(idx, 7, 6)   },
    { id: 't6',  label: 'PI Confirmed / Rejected',   status: nodeStatus(idx, 9, 7)   },
    { id: 't7',  label: 'CTN Documents',             status: nodeStatus(idx, 11, 9)  },
    { id: 't8',  label: 'Shipment Notice',           status: nodeStatus(idx, 12, 11) },
    { id: 't9',  label: 'Booking Confirmation',      status: nodeStatus(idx, 14, 13) },
    { id: 't10', label: 'Shipment Execution',        status: nodeStatus(idx, 15, 14) },
    { id: 't11', label: 'SOA Issued',                status: nodeStatus(idx, 17, 15) },
    { id: 't12', label: 'Payment Slip Upload',       status: nodeStatus(idx, 19, 17) },
    { id: 't13', label: 'Payment Confirmation',      status: nodeStatus(idx, 20, 19) },
    { id: 't14', label: 'Bill of Lading Forwarded',  status: nodeStatus(idx, 23, 22) },
    { id: 't15', label: 'Completed',                 status: nodeStatus(idx, 24, 23) },
  ];
}

function buildCurrentAction(stage: string, raw: any): CustomerAction {
  switch (stage) {
    case 'pi_sent_to_customer':
      return {
        id: 'review_pi',
        label: 'Please review your Proforma Invoice',
        description: `Your PI${raw.piNumber ? ` (${raw.piNumber})` : ''} is ready. Please review and confirm or request changes.`,
        type: 'action',
      };
    case 'pi_rejected_by_customer':
      return {
        id: 'pi_rejected',
        label: 'PI was rejected — revision in progress',
        description: 'We have received your rejection. Our team is preparing a revised PI.',
        type: 'warning',
      };
    case 'waiting_ctn_submission':
      return {
        id: 'submit_ctn',
        label: 'Please submit CTN / packing list',
        description: 'Your PI has been confirmed. Please provide the cargo packing list (CTN) to proceed.',
        type: 'action',
      };
    case 'waiting_shipping_notice':
      return {
        id: 'notify_shipping',
        label: 'Please notify us when goods are ready',
        description: 'Please inform us when the cargo is ready to ship and provide shipment details.',
        type: 'action',
      };
    case 'waiting_freight_confirmation':
      return {
        id: 'confirm_freight',
        label: 'Please confirm booking details',
        description: 'Our team has prepared freight options. Please confirm your preferred booking.',
        type: 'action',
      };
    case 'soa_sent':
    case 'waiting_payment_slip':
      return {
        id: 'upload_slip',
        label: 'Please upload your payment slip',
        description: `Your SOA${raw.soaAmount ? ` of ${raw.soaCurrency ?? 'USD'} ${Number(raw.soaAmount).toLocaleString()}` : ''} has been sent. Please arrange payment and upload the slip.`,
        type: 'action',
      };
    case 'completed':
      return {
        id: 'completed',
        label: 'Service completed',
        description: 'Your export service has been completed successfully. All documents have been processed.',
        type: 'info',
      };
    case 'cancelled':
      return {
        id: 'cancelled',
        label: 'Order cancelled',
        description: 'This export service order has been cancelled.',
        type: 'warning',
      };
    default:
      return {
        id: 'wait',
        label: 'Please wait — processing in progress',
        description: 'Our team is handling your request. You will be notified when action is required.',
        type: 'info',
      };
  }
}

function mapDbToCustomerOrder(raw: any): CustomerOrder {
  const stage: string = raw.internalStage ?? '';
  const docs: any[] = raw.documents ?? [];
  return {
    id: raw.id,
    source: raw.source as CommissionSource,
    type: raw.type ?? 'Standard',
    customerStatus: mapToCustomerStatus(stage),
    currentAction: buildCurrentAction(stage, raw),
    updatedAt: (raw.updatedAt ?? '').split('T')[0],
    createdAt: (raw.createdAt ?? '').split('T')[0],
    timeline: buildTimeline(stage),
    documents: docs
      .filter((d: any) => d.visibleToCustomer)
      .map((d: any) => ({
        id: d.id,
        name: d.name,
        category: d.category as CustomerDocument['category'],
        uploadedAt: d.uploadedAt,
        sentOrUploadedBy: d.uploadedBy ?? '',
        fileSize: d.fileSize,
        status: (d.status === 'verified' ? 'confirmed' : d.status) as CustomerDocument['status'],
      })),
    piRejectionHint: stage === 'pi_rejected_by_customer' ? raw.piRejectionReason : undefined,
    showEmailHint: raw.source === 'email_import',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<CustomerStatus, { bg: string; text: string; label: string }> = {
  Preparing:   { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Preparing'   },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800',   label: 'In Progress' },
  Completed:   { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Completed'   },
  Cancelled:   { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Cancelled'   },
};

const DOC_CAT_LABEL: Record<string, string> = {
  commission_attachment: 'Commission Attachment',
  product_list: 'Product List',
  pi: 'Proforma Invoice (PI)',
  ctn: 'CTN Documents',
  soa: 'Statement of Account (SOA)',
  payment_slip: 'Payment Slip',
  customer_visible: 'Other Documents',
};

const DOC_CAT_ORDER = ['commission_attachment', 'product_list', 'pi', 'ctn', 'soa', 'payment_slip', 'customer_visible'];

function StatusBadge({ status }: { status: CustomerStatus }) {
  const s = STATUS_STYLE[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

function SourceBadge({ source }: { source: CommissionSource }) {
  if (source === 'customer_portal') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
        <Globe className="w-2.5 h-2.5" />Portal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
      <Mail className="w-2.5 h-2.5" />Email
    </span>
  );
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgressBar({ order }: { order: CustomerOrder }) {
  const segments = [
    { label: 'Request & PI',           nodes: [0, 1, 2, 3, 4, 5] },
    { label: 'Shipment',               nodes: [6, 7, 8, 9] },
    { label: 'Payment',                nodes: [10, 11, 12] },
    { label: 'Closure',                nodes: [13, 14] },
  ];

  const getStatus = (nodes: number[]) => {
    if (order.customerStatus === 'Cancelled') return 'cancelled';
    const nodeStatuses = nodes.map(n => order.timeline[n]?.status ?? 'pending');
    if (nodeStatuses.every(s => s === 'done')) return 'done';
    if (nodeStatuses.some(s => s === 'in_progress' || s === 'done')) return 'active';
    return 'pending';
  };

  return (
    <div className="flex items-stretch gap-0 overflow-hidden rounded-sm border border-gray-200">
      {segments.map((seg, i) => {
        const st = getStatus(seg.nodes);
        return (
          <div key={i} className={`flex-1 px-3 py-2.5 border-r border-gray-200 last:border-r-0 ${
            st === 'done' ? 'bg-green-50' : st === 'active' ? 'bg-blue-50' : 'bg-white'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                st === 'done' ? 'bg-green-500' : st === 'active' ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {st === 'done'
                  ? <Check className="w-2.5 h-2.5 text-white" />
                  : <span className={`text-[9px] font-bold ${st === 'active' ? 'text-white' : 'text-gray-400'}`}>{i + 1}</span>
                }
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                st === 'done' ? 'text-green-600' : st === 'active' ? 'text-blue-600' : 'text-gray-400'
              }`}>{st === 'done' ? 'Done' : st === 'active' ? 'In Progress' : 'Pending'}</span>
            </div>
            <div className="text-[12px] font-medium text-gray-700 leading-tight">{seg.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Compact Timeline ─────────────────────────────────────────────────────────

function CompactTimeline({ nodes }: { nodes: CustomerTimelineNode[] }) {
  // Show: all done nodes (collapsed if >3 consecutive), current, next 2 pending
  const currentIdx = nodes.findIndex(n => n.status === 'in_progress');
  const doneCount = nodes.filter(n => n.status === 'done').length;

  return (
    <div className="relative">
      <div className="absolute left-[9px] top-0 bottom-0 w-px bg-gray-100" />
      <div className="space-y-0">
        {/* Collapsed done nodes */}
        {doneCount > 0 && (
          <div className="flex items-center gap-3 py-1.5">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 z-10">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-[12px] text-green-700 font-medium">{doneCount} step{doneCount > 1 ? 's' : ''} completed</span>
          </div>
        )}

        {/* Current node */}
        {currentIdx >= 0 && (
          <div className="flex items-start gap-3 py-2 relative">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 z-10 mt-0.5 ring-4 ring-blue-100">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-blue-700">{nodes[currentIdx].label}</div>
              {nodes[currentIdx].time && <div className="text-[11px] text-gray-400">{nodes[currentIdx].time}</div>}
            </div>
          </div>
        )}

        {/* Next 2 pending */}
        {nodes.slice(currentIdx >= 0 ? currentIdx + 1 : doneCount, (currentIdx >= 0 ? currentIdx + 1 : doneCount) + 3).filter(n => n.status === 'pending').map(node => (
          <div key={node.id} className="flex items-start gap-3 py-1.5 relative opacity-50">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 z-10 mt-0.5" />
            <div className="text-[12px] text-gray-500">{node.label}</div>
          </div>
        ))}

        {/* Remaining count */}
        {(() => {
          const shownFrom = currentIdx >= 0 ? currentIdx + 1 : doneCount;
          const remaining = nodes.slice(shownFrom + 3).filter(n => n.status === 'pending').length;
          return remaining > 0 ? (
            <div className="flex items-center gap-3 py-1.5 opacity-40">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 z-10">
                <span className="text-[9px] text-gray-400">+{remaining}</span>
              </div>
              <span className="text-[11px] text-gray-400">{remaining} more steps</span>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ action, order, onStageAction }: {
  action: CustomerAction;
  order: CustomerOrder;
  onStageAction?: (actionId: string) => void;
}) {
  const configs: Record<string, { bg: string; border: string; icon: React.ReactNode; titleColor: string }> = {
    info:    { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: <Info className="w-5 h-5 text-blue-500" />,    titleColor: 'text-blue-900' },
    action:  { bg: 'bg-amber-50',  border: 'border-amber-300', icon: <AlertCircle className="w-5 h-5 text-amber-500" />, titleColor: 'text-amber-900' },
    warning: { bg: 'bg-red-50',    border: 'border-red-200',   icon: <AlertTriangle className="w-5 h-5 text-red-500" />, titleColor: 'text-red-900' },
  };
  const c = configs[action.type] ?? configs.info;

  return (
    <div className={`border-2 rounded-sm p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{c.icon}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[14px] font-bold ${c.titleColor}`}>{action.label}</div>
          <div className="text-[12px] text-gray-600 mt-1 leading-relaxed">{action.description}</div>

          {/* Action buttons by action.id */}
          {action.id === 'review_pi' && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 gap-1.5 px-4">
                <Check className="w-3.5 h-3.5" />Confirm PI
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50 px-4">
                Reject PI
              </Button>
            </div>
          )}
          {action.id === 'submit_ctn' && (
            <Button size="sm" className="mt-3 h-8 text-xs gap-1.5 px-4">
              <Upload className="w-3.5 h-3.5" />Submit CTN Documents
            </Button>
          )}
          {action.id === 'notify_shipping' && (
            <Button size="sm" className="mt-3 h-8 text-xs gap-1.5 px-4">
              <Ship className="w-3.5 h-3.5" />Notify Us — Goods Ready
            </Button>
          )}
          {action.id === 'confirm_freight' && (
            <Button size="sm" className="mt-3 h-8 text-xs gap-1.5 px-4">
              <Check className="w-3.5 h-3.5" />Confirm Booking Details
            </Button>
          )}
          {action.id === 'upload_slip' && (
            <Button size="sm" className="mt-3 h-8 text-xs gap-1.5 px-4 bg-amber-600 hover:bg-amber-700">
              <Upload className="w-3.5 h-3.5" />Upload Payment Slip
            </Button>
          )}
        </div>
      </div>

      {order.showEmailHint && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20 flex items-start gap-2 text-[11px] text-gray-500">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
          <span>This request was received via email. Initiating through the portal next time gives you full tracking of PI, CTN, SOA and payment history.</span>
        </div>
      )}
    </div>
  );
}

// ─── Document Center ──────────────────────────────────────────────────────────

function DocumentCenter({ order }: { order: CustomerOrder }) {
  const docsByCategory = useMemo(() => {
    const map: Record<string, CustomerDocument[]> = {};
    DOC_CAT_ORDER.forEach(cat => { map[cat] = []; });
    order.documents.forEach(d => {
      if (!map[d.category]) map[d.category] = [];
      map[d.category].push(d);
    });
    return map;
  }, [order.documents]);

  const relevantCats = DOC_CAT_ORDER.filter(cat => (docsByCategory[cat] || []).length > 0);
  const emptyCats = DOC_CAT_ORDER.filter(cat => (docsByCategory[cat] || []).length === 0);
  const [showEmpty, setShowEmpty] = useState(false);

  const renderCat = (cat: string) => {
    const docs = docsByCategory[cat] || [];
    return (
      <div key={cat} className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{DOC_CAT_LABEL[cat]}</span>
          <span className="text-[11px] text-gray-400">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
        </div>
        {docs.length > 0 ? (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-1.5 text-left font-medium text-gray-500">File Name</th>
                <th className="px-4 py-1.5 text-left font-medium text-gray-500">From</th>
                <th className="px-4 py-1.5 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-1.5 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">{doc.name}</span>
                      {doc.fileSize && <span className="text-gray-400">· {doc.fileSize}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{doc.sentOrUploadedBy}</td>
                  <td className="px-4 py-2 text-gray-500">{doc.uploadedAt}</td>
                  <td className="px-4 py-2">
                    {doc.status === 'confirmed' && <span className="text-green-700 font-medium">Confirmed</span>}
                    {doc.status === 'received'  && <span className="text-blue-600">Received</span>}
                    {doc.status === 'pending'   && <span className="text-amber-600">Pending</span>}
                    {doc.status === 'rejected'  && <span className="text-red-600">Rejected</span>}
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-2 text-[12px] text-gray-400 italic">No documents yet</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {relevantCats.map(renderCat)}
      {emptyCats.length > 0 && (
        <>
          {showEmpty && emptyCats.map(renderCat)}
          <button
            onClick={() => setShowEmpty(v => !v)}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${showEmpty ? 'rotate-90' : ''}`} />
            {showEmpty ? 'Hide' : `Show ${emptyCats.length} empty categories`}
          </button>
        </>
      )}
      {relevantCats.length === 0 && !showEmpty && (
        <div className="text-[12px] text-gray-400 italic px-1">No documents uploaded yet</div>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function CustomerOrderDetail({ order }: { order: CustomerOrder }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold text-gray-900">{order.id}</span>
          <SourceBadge source={order.source} />
          <span className="text-[12px] text-gray-400">{order.type}</span>
        </div>
        <StatusBadge status={order.customerStatus} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Action Card — top priority */}
        <div className="px-5 pt-4 pb-3">
          <ActionCard action={order.currentAction} order={order} />
        </div>

        {/* Step Progress Bar */}
        <div className="px-5 pb-4">
          <StepProgressBar order={order} />
        </div>

        {/* Two-column: Info + Timeline */}
        <div className="px-5 pb-4 flex gap-4 items-start">
          {/* Left: Request Details */}
          <div className="flex-1 min-w-0 border border-gray-200 rounded-sm">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Request Details</span>
            </div>
            <table className="w-full">
              <tbody>
                {[
                  ['Request ID', order.id],
                  ['Type', order.type],
                  ['Submitted via', order.source === 'customer_portal' ? 'Customer Portal' : 'Email'],
                  ['Status', order.customerStatus],
                  ['Created', order.createdAt],
                  ['Last Updated', order.updatedAt],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-2 text-[12px] text-gray-500 font-medium w-32 bg-gray-50/60 whitespace-nowrap">{label}</td>
                    <td className="px-4 py-2 text-[13px] text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: Compact Timeline */}
          <div className="w-56 flex-shrink-0 border border-gray-200 rounded-sm">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Progress</span>
            </div>
            <div className="px-4 py-3">
              <CompactTimeline nodes={order.timeline} />
            </div>
          </div>
        </div>

        {/* Document Center */}
        <div className="px-5 pb-5">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Document Center</div>
          <DocumentCenter order={order} />
        </div>
      </div>
    </div>
  );
}


// ─── New Request Dialog ───────────────────────────────────────────────────────

interface NewRequestForm {
  serviceType: 'header_only' | 'header_booking' | 'header_booking_customs';
  productName: string;
  quantityPacking: string;
  estimatedValue: string;
  tradeTerms: 'FOB' | 'EXW' | 'FCA' | 'CIF';
  expectedShipDate: string;
  destinationPort: string;
  attachments: File[];
}

function NewRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (form: NewRequestForm) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState<NewRequestForm>({
    serviceType: 'header_only',
    productName: '',
    quantityPacking: '',
    estimatedValue: '',
    tradeTerms: 'FOB',
    expectedShipDate: '',
    destinationPort: '',
    attachments: [],
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const set = (k: keyof NewRequestForm) => (v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setForm(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    e.target.value = '';
  };

  const removeFile = (idx: number) =>
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim())     { toast.error('Please enter the product / goods name'); return; }
    if (!form.quantityPacking.trim()) { toast.error('Please enter quantity and packaging'); return; }
    if (!form.estimatedValue.trim())  { toast.error('Please enter estimated FOB value'); return; }
    if (!form.destinationPort.trim()) { toast.error('Please enter destination port / country'); return; }
    await onSubmit(form);
    setForm({
      serviceType: 'header_only',
      productName: '',
      quantityPacking: '',
      estimatedValue: '',
      tradeTerms: 'FOB',
      expectedShipDate: '',
      destinationPort: '',
      attachments: [],
    });
  };

  const SERVICE_LABELS: Record<string, string> = {
    header_only:            '借抬头出口（仅抬头）',
    header_booking:         '借抬头出口 + 订舱服务',
    header_booking_customs: '借抬头出口 + 订舱 + 报关（全程）',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-[#F96302]" />
            Submit Export Service Request
          </DialogTitle>
          <DialogDescription>
            Request our company to handle the export under our header (借抬头出口).
            We will prepare a Proforma Invoice (PI) for your confirmation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">

          {/* Service type */}
          <div>
            <label className="text-[12px] font-semibold text-gray-700 block mb-1.5">
              委托类型 Service Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {(['header_only', 'header_booking', 'header_booking_customs'] as const).map(v => (
                <label key={v} className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                  form.serviceType === v
                    ? 'border-[#F96302] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    className="mt-0.5 accent-[#F96302]"
                    checked={form.serviceType === v}
                    onChange={() => set('serviceType')(v)}
                  />
                  <div>
                    <div className="text-[13px] font-medium text-gray-800">{SERVICE_LABELS[v]}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {v === 'header_only'            && 'We issue the export documents under our company name. Booking and customs handled by you or your forwarder.'}
                      {v === 'header_booking'         && 'We handle export documents AND arrange shipping/booking with your preferred forwarder.'}
                      {v === 'header_booking_customs' && 'Full service: export documents, booking, and customs declaration handled by us.'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-1">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">委托明细 Request Details</div>
          </div>

          {/* Product name */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 block mb-1">
              货物名称 Product / Goods Name <span className="text-red-500">*</span>
            </label>
            <Input
              className="h-9 text-[13px]"
              placeholder="e.g. Ceramic Floor Tiles / 陶瓷地板砖"
              value={form.productName}
              onChange={e => set('productName')(e.target.value)}
            />
          </div>

          {/* Quantity + Trade Terms row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-gray-700 block mb-1">
                数量 / 包装 Qty & Packaging <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-9 text-[13px]"
                placeholder="e.g. 500 CTN / 20 Pallets"
                value={form.quantityPacking}
                onChange={e => set('quantityPacking')(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-700 block mb-1">贸易条款 Trade Terms</label>
              <Select value={form.tradeTerms} onValueChange={set('tradeTerms')}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                  <SelectItem value="FCA">FCA</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Value + Ship Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-gray-700 block mb-1">
                预估金额 Estimated Value (USD) <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-9 text-[13px]"
                type="number"
                min="0"
                placeholder="e.g. 28000"
                value={form.estimatedValue}
                onChange={e => set('estimatedValue')(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-700 block mb-1">预计出运日期 Expected Ship Date</label>
              <Input
                className="h-9 text-[13px]"
                type="date"
                value={form.expectedShipDate}
                onChange={e => set('expectedShipDate')(e.target.value)}
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 block mb-1">
              目的港 / 国 Destination Port / Country <span className="text-red-500">*</span>
            </label>
            <Input
              className="h-9 text-[13px]"
              placeholder="e.g. Los Angeles, USA / Santos, Brazil"
              value={form.destinationPort}
              onChange={e => set('destinationPort')(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 block mb-1">
              上传资料 Attachments
              <span className="text-gray-400 font-normal ml-1">(品名清单 / 装箱单 / 参考资料)</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-sm px-4 py-4 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
              <div className="text-[12px] text-gray-500">
                Click to select files, or drag & drop
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">PDF, Excel, Word, images accepted</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
            {form.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {form.attachments.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded border border-gray-200 text-[12px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{f.name}</span>
                      <span className="text-gray-400 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="ml-2 text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info hint */}
          <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-blue-50 rounded-sm px-3 py-2.5 border border-blue-100">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
            <span>After submission, our team will review your request and prepare a PI within 1–2 business days. You will be notified here when the PI is ready for your confirmation.</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5 bg-[#F96302] hover:bg-[#e05700]">
              {submitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function CustomerExportServicePanel() {
  const { user } = useUser();
  const enabled = useExportServiceEnabled();
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real orders from Supabase by customer email
  useEffect(() => {
    if (!user?.email || !enabled) { setLoadingOrders(false); return; }
    let mounted = true;
    setLoadingOrders(true);
    exportServiceOrdersDb.getByCustomerEmail(user.email).then((data: any[]) => {
      if (!mounted) return;
      setRawOrders(data);
      setLoadingOrders(false);
      if (data.length > 0) setSelectedId(prev => prev ?? data[0].id);
    });
    return () => { mounted = false; };
  }, [user?.email, enabled]);

  const orders = useMemo<CustomerOrder[]>(
    () => rawOrders.map(mapDbToCustomerOrder),
    [rawOrders]
  );

  const selectedOrder = orders.find(o => o.id === selectedId) ?? null;

  const handleSubmitRequest = useCallback(async (form: NewRequestForm) => {
    if (!user?.email) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const serviceTypeLabel: Record<string, string> = {
        header_only:            '借抬头出口（仅抬头）',
        header_booking:         '借抬头出口 + 订舱',
        header_booking_customs: '借抬头出口 + 订舱 + 报关',
      };
      const requestDetail = [
        `Service: ${serviceTypeLabel[form.serviceType] ?? form.serviceType}`,
        `Product: ${form.productName}`,
        `Qty/Pkg: ${form.quantityPacking}`,
        `Value: USD ${form.estimatedValue} ${form.tradeTerms}`,
        form.expectedShipDate ? `Ship Date: ${form.expectedShipDate}` : '',
        `Destination: ${form.destinationPort}`,
        form.attachments.length > 0
          ? `Attachments: ${form.attachments.map(f => f.name).join(', ')}`
          : '',
      ].filter(Boolean).join('\n');

      const created = await exportServiceOrdersDb.create({
        source: 'customer_portal',
        type: 'Standard',
        customer: user.name || user.email || 'Customer',
        customerEmail: user.email,
        region: 'NA',        // internal team will update
        internalStage: 'draft_request',
        currentActionRole: 'Foreign Trade Manager',
        isBlocked: false,
        isUrgent: false,
        internalNotes: requestDetail,
        documents: [],
        events: [{
          id: `e-${Date.now()}`,
          time: now.replace('T', ' ').substring(0, 16),
          actor: user.name || user.email || 'Customer',
          actorRole: '客户',
          action: '通过客户端提交委托',
          note: `${form.productName} | ${form.quantityPacking} | USD ${form.estimatedValue} ${form.tradeTerms} → ${form.destinationPort}`,
        }],
      });
      if (created) {
        setRawOrders(prev => [created, ...prev]);
        setSelectedId(created.id);
        setShowNewRequest(false);
        toast.success(`Request ${created.id} submitted — our team will respond within 1–2 business days.`);
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  // Feature gate
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-8">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Anchor className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-[15px] font-semibold text-gray-700 mb-2">Export Service Not Available</h3>
        <p className="text-[13px] text-gray-500 max-w-sm">
          The Export Service (借抬头出口) module is not enabled for your account. Please contact your account manager for more information.
        </p>
      </div>
    );
  }

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-[13px] gap-2">
        <Clock className="w-4 h-4 animate-spin" />
        Loading your export service requests...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white border-2 border-gray-200 rounded-sm overflow-hidden" style={{ minHeight: 600, fontFamily: 'var(--hd-font, system-ui)' }}>
      <NewRequestDialog
        open={showNewRequest}
        onOpenChange={setShowNewRequest}
        onSubmit={handleSubmitRequest}
        submitting={submitting}
      />

      {/* Left list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Export Service</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{orders.length} request{orders.length !== 1 ? 's' : ''}</p>
            </div>
            <Button
              size="sm"
              className="h-7 text-[12px] gap-1 px-2.5 bg-[#F96302] hover:bg-[#e05700]"
              onClick={() => setShowNewRequest(true)}
            >
              <Plus className="w-3.5 h-3.5" />New
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {orders.map(order => {
            const isSelected = order.id === selectedId;
            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold text-gray-900">{order.id}</span>
                  <SourceBadge source={order.source} />
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={order.customerStatus} />
                  <span className="text-[10px] text-gray-400">{order.updatedAt}</span>
                </div>
                {order.currentAction.type === 'action' && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600">
                    <AlertCircle className="w-3 h-3" />Action required
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedOrder ? (
          <CustomerOrderDetail key={selectedOrder.id} order={selectedOrder} />
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
              <Anchor className="w-7 h-7 text-[#F96302]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-700 mb-1">No export service requests yet</h3>
              <p className="text-[13px] text-gray-500 max-w-xs">
                Submit a request to use our company header (借抬头) for your shipment. Our team will prepare a PI for your confirmation.
              </p>
            </div>
            <Button
              className="gap-1.5 bg-[#F96302] hover:bg-[#e05700]"
              onClick={() => setShowNewRequest(true)}
            >
              <Plus className="w-4 h-4" />Submit Your First Request
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-gray-400">
            Select a request to view details
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerExportServicePanel;
