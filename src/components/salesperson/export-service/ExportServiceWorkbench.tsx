// 借抬头出口服务 - 内部执行工作台
// 挂在：订单管理中心 > 借抬头出口服务

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { exportServiceOrdersDb } from '../../../lib/supabase-db';
import {
  Search, Filter, ChevronRight, AlertCircle, Clock, CheckCircle2,
  XCircle, Mail, Globe, FileText, Package, Ship, Anchor, DollarSign,
  Upload, Download, Eye, MoreHorizontal, ChevronUp,
  User, Users, Building2, TruckIcon, CreditCard, Wallet,
  ArrowRight, Check, X, AlertTriangle, Info, Paperclip,
  Inbox, Send, Receipt, BookOpen
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { toast } from 'sonner';
import { CompactDetailsPopover } from '../../shared/CompactDetailsPopover';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InternalStage =
  | 'draft_request'
  | 'request_from_email'
  | 'waiting_manager_acceptance'
  | 'assigned_to_sales'
  | 'pi_preparing'
  | 'pi_pending_approval'
  | 'pi_rejected'
  | 'pi_approved'
  | 'pi_sent_to_customer'
  | 'pi_rejected_by_customer'
  | 'pi_accepted_by_customer'
  | 'waiting_ctn_submission'
  | 'ctn_received'
  | 'waiting_shipping_notice'
  | 'freight_quoting'
  | 'waiting_freight_confirmation'
  | 'booking_in_progress'
  | 'shipment_coordination'
  | 'bill_of_lading_isolation'
  | 'soa_preparing'
  | 'soa_sent'
  | 'waiting_payment_slip'
  | 'payment_slip_received'
  | 'payment_received_pending_check'
  | 'payment_confirmed'
  | 'freight_paid_to_forwarder'
  | 'bl_received_by_us'
  | 'bl_forwarded_to_supplier'
  | 'completed'
  | 'cancelled';

export type CommissionSource = 'customer_portal' | 'email_import';

export interface ExportServiceDocument {
  id: string;
  name: string;
  category:
    | 'commission_attachment'
    | 'email_attachment'
    | 'product_list'
    | 'pi'
    | 'ctn'
    | 'soa'
    | 'payment_slip'
    | 'bill_of_lading'
    | 'other';
  uploadedAt: string;
  uploadedBy: string;
  uploaderRole: string;
  visibleToCustomer: boolean;
  fileSize?: string;
  status: 'pending' | 'received' | 'verified' | 'rejected';
}

export interface FreightQuote {
  id: string;
  forwarder: string;
  price: number;
  currency: string;
  transitDays: number;
  vessel?: string;
  port?: string;
  quotedAt: string;
  confirmed?: boolean;
}

export interface ExportServiceEvent {
  id: string;
  time: string;
  actor: string;
  actorRole: string;
  action: string;
  note?: string;
}

export interface ExportServiceOrder {
  id: string;
  source: CommissionSource;
  type: 'Standard' | 'Rush' | 'Partial';
  customer: string;
  customerEmail?: string;
  region: 'NA' | 'SA' | 'EA';
  managerName?: string;
  salesName?: string;
  trackerName?: string;
  financeName?: string;
  internalStage: InternalStage;
  currentActionRole: string;
  isBlocked?: boolean;
  isUrgent?: boolean;
  createdAt: string;
  updatedAt: string;
  emailSubject?: string;
  piNumber?: string;
  piAmount?: number;
  piCurrency?: string;
  piRejectionReason?: string;
  piCustomerFeedback?: string;
  piCustomerDecision?: 'accepted' | 'rejected';
  freightQuotes?: FreightQuote[];
  confirmedForwarder?: string;
  confirmedFreight?: number;
  soaAmount?: number;
  soaCurrency?: string;
  blNumber?: string;
  blForwardedAt?: string;
  documents: ExportServiceDocument[];
  events: ExportServiceEvent[];
  internalNotes?: string;
}

// ─── Stage Labels ─────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<InternalStage, string> = {
  draft_request: '草稿委托',
  request_from_email: '邮件导入',
  waiting_manager_acceptance: '待主管受理',
  assigned_to_sales: '已分配业务员',
  pi_preparing: 'PI 制作中',
  pi_pending_approval: 'PI 待主管审核',
  pi_rejected: 'PI 已驳回',
  pi_approved: 'PI 已通过',
  pi_sent_to_customer: 'PI 已发给客户',
  pi_rejected_by_customer: '客户已拒绝 PI',
  pi_accepted_by_customer: '客户已确认 PI',
  waiting_ctn_submission: '等待客户提交 CTN',
  ctn_received: '已收到 CTN',
  waiting_shipping_notice: '等待客户通知出货',
  freight_quoting: '询价中',
  waiting_freight_confirmation: '等待客户确认订舱',
  booking_in_progress: '订舱进行中',
  shipment_coordination: '出货执行中',
  bill_of_lading_isolation: '提单隔离流转',
  soa_preparing: 'SOA 制作中',
  soa_sent: 'SOA 已发送',
  waiting_payment_slip: '等待付款水单',
  payment_slip_received: '已收到付款水单',
  payment_received_pending_check: '待财务确认到账',
  payment_confirmed: '已确认到账',
  freight_paid_to_forwarder: '运费已付货代',
  bl_received_by_us: '我方已收到提单',
  bl_forwarded_to_supplier: '提单已转寄供应商',
  completed: '已完成',
  cancelled: '已取消',
};

const STAGE_GROUP: Record<InternalStage, string> = {
  draft_request: 'request',
  request_from_email: 'request',
  waiting_manager_acceptance: 'request',
  assigned_to_sales: 'request',
  pi_preparing: 'pi',
  pi_pending_approval: 'pi',
  pi_rejected: 'pi',
  pi_approved: 'pi',
  pi_sent_to_customer: 'pi',
  pi_rejected_by_customer: 'pi',
  pi_accepted_by_customer: 'pi',
  waiting_ctn_submission: 'ctn',
  ctn_received: 'ctn',
  waiting_shipping_notice: 'shipment',
  freight_quoting: 'shipment',
  waiting_freight_confirmation: 'shipment',
  booking_in_progress: 'shipment',
  shipment_coordination: 'execution',
  bill_of_lading_isolation: 'execution',
  soa_preparing: 'payment',
  soa_sent: 'payment',
  waiting_payment_slip: 'payment',
  payment_slip_received: 'payment',
  payment_received_pending_check: 'payment',
  payment_confirmed: 'payment',
  freight_paid_to_forwarder: 'settlement',
  bl_received_by_us: 'settlement',
  bl_forwarded_to_supplier: 'settlement',
  completed: 'done',
  cancelled: 'cancelled',
};
// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageBadge(stage: InternalStage) {
  const label = STAGE_LABEL[stage];
  if (stage === 'completed') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800">{label}</span>;
  if (stage === 'cancelled') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">{label}</span>;
  if (stage.includes('rejected')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700">{label}</span>;
  if (stage.includes('waiting') || stage.includes('pending')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">{label}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700">{label}</span>;
}

function sourceBadge(source: CommissionSource) {
  if (source === 'customer_portal') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
        <Globe className="w-2.5 h-2.5" />Portal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
      <Mail className="w-2.5 h-2.5" />邮件
    </span>
  );
}

const DOC_CAT_LABEL: Record<string, string> = {
  commission_attachment: '委托附件',
  email_attachment: '邮件附件',
  product_list: '产品清单',
  pi: 'PI 文档',
  ctn: 'CTN 文档',
  soa: 'SOA',
  payment_slip: '付款水单',
  bill_of_lading: '提单流转单据',
  other: '其他归档',
};

const DOC_CAT_ORDER = [
  'commission_attachment',
  'email_attachment',
  'product_list',
  'pi',
  'ctn',
  'soa',
  'payment_slip',
  'bill_of_lading',
  'other',
];

// ─── Sub-tab components ───────────────────────────────────────────────────────

function OverviewTab({ order }: { order: ExportServiceOrder }) {
  const stage = STAGE_LABEL[order.internalStage];
  const group = STAGE_GROUP[order.internalStage];

  const steps = [
    { id: 'request', label: 'Request & PI', groups: ['request', 'pi'] },
    { id: 'shipment', label: 'Shipment Arrangement', groups: ['ctn', 'shipment'] },
    { id: 'execution', label: 'Execution & Documents', groups: ['execution'] },
    { id: 'settlement', label: 'Settlement & Closure', groups: ['payment', 'settlement', 'done'] },
  ];

  const stepStatus = (s: typeof steps[number]) => {
    if (order.internalStage === 'cancelled') return 'cancelled';
    if (s.groups.includes(group)) return 'in_progress';
    const idx = steps.findIndex(x => x.id === s.id);
    const curIdx = steps.findIndex(x => x.groups.includes(group));
    if (idx < curIdx) return 'done';
    if (group === 'done') return 'done';
    return 'pending';
  };

  return (
    <div className="space-y-5">
      {/* Step grid */}
      <div className="grid grid-cols-4 gap-0 border border-gray-200 rounded-sm overflow-hidden">
        {steps.map((s, i) => {
          const st = stepStatus(s);
          return (
            <div key={s.id} className={`px-4 py-3 border-r border-gray-200 last:border-r-0 ${st === 'in_progress' ? 'bg-blue-50' : st === 'done' ? 'bg-green-50' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${st === 'done' ? 'bg-green-500 text-white' : st === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${st === 'in_progress' ? 'text-blue-700' : st === 'done' ? 'text-green-700' : 'text-gray-400'}`}>{st === 'done' ? 'Done' : st === 'in_progress' ? 'In Progress' : 'Pending'}</span>
              </div>
              <div className="text-[12px] font-medium text-gray-700">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Basic info table */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">委托基本信息</span>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {[
              ['委托单号', order.id],
              ['客户', order.customer],
              ['区域', order.region],
              ['来源', order.source === 'customer_portal' ? '客户端发起' : '邮件导入'],
              ['类型', order.type],
              ['当前阶段', stage],
              ['当前责任角色', order.currentActionRole],
              ['外贸主管', order.managerName || '—'],
              ['业务员', order.salesName || '—'],
              ['跟单员', order.trackerName || '—'],
              ['财务', order.financeName || '—'],
              ['创建时间', order.createdAt],
              ['最近更新', order.updatedAt],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-2 text-[12px] text-gray-500 font-medium w-36 bg-gray-50">{label}</td>
                <td className="px-4 py-2 text-[13px] text-gray-900">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent events */}
      {order.events.length > 0 && (
        <div className="border border-gray-200 rounded-sm">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">近期操作记录</span>
          </div>
          <div className="divide-y divide-gray-100">
            {order.events.slice(-5).reverse().map((ev) => (
              <div key={ev.id} className="px-4 py-2.5 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <div>
                  <span className="text-[12px] text-gray-900">{ev.action}</span>
                  <div className="text-[11px] text-gray-500 mt-0.5">{ev.actor}（{ev.actorRole}）· {ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const [note, setNote] = useState('');
  const [salesInput, setSalesInput] = useState(order.salesName || '');

  const canAccept = order.internalStage === 'waiting_manager_acceptance' || order.internalStage === 'draft_request' || order.internalStage === 'request_from_email';
  const canAssign = order.internalStage === 'waiting_manager_acceptance' || order.internalStage === 'assigned_to_sales';

  const handleAccept = () => {
    onUpdate({ internalStage: 'assigned_to_sales', currentActionRole: '业务员' });
    toast.success('委托已受理');
  };

  const handleAssign = () => {
    if (!salesInput.trim()) { toast.error('请输入业务员姓名'); return; }
    onUpdate({ salesName: salesInput, internalStage: 'assigned_to_sales', currentActionRole: '业务员' });
    toast.success(`已分配给：${salesInput}`);
  };

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">主管受理</span>
          {canAccept && <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />待受理</span>}
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">委托来源</div>
              <div>{order.source === 'customer_portal' ? '客户端发起' : '邮件导入'}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">当前主管</div>
              <div>{order.managerName || '—'}</div>
            </div>
            {order.source === 'email_import' && order.emailSubject && (
              <div className="col-span-2">
                <div className="text-[11px] text-gray-500 mb-1">邮件主题</div>
                <div className="text-gray-700">{order.emailSubject}</div>
              </div>
            )}
          </div>
          {canAccept && (
            <Button size="sm" onClick={handleAccept} className="h-7 text-xs">
              <Check className="w-3.5 h-3.5 mr-1.5" />接受委托
            </Button>
          )}
          {!canAccept && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />委托已受理
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">业务员分配</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-[12px] text-gray-600">
            分配给同区（{order.region}）指定业务员，或负责过该客户的同区业务员。
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={salesInput}
              onChange={(e) => setSalesInput(e.target.value)}
              placeholder="输入业务员姓名"
              className="h-7 text-xs w-48"
              disabled={!canAssign}
            />
            <Button size="sm" onClick={handleAssign} disabled={!canAssign} className="h-7 text-xs">
              确认分配
            </Button>
          </div>
          {order.salesName && (
            <div className="text-[12px] text-gray-700">
              当前分配：<span className="font-semibold">{order.salesName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">主管备注</span>
        </div>
        <div className="p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="受理备注（可选）..."
            className="w-full h-20 text-xs border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );
}

function PITab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const [piNo, setPiNo] = useState(order.piNumber || '');
  const [piAmt, setPiAmt] = useState(order.piAmount?.toString() || '');
  const [piCur, setPiCur] = useState(order.piCurrency || 'USD');

  const canCreate = ['assigned_to_sales', 'pi_rejected'].includes(order.internalStage);
  const canSubmit = order.internalStage === 'pi_preparing';
  const canApprove = order.internalStage === 'pi_pending_approval';
  const canSend = order.internalStage === 'pi_approved';

  const handleCreate = () => {
    if (!piNo) { toast.error('请填写 PI 编号'); return; }
    onUpdate({ piNumber: piNo, piAmount: Number(piAmt), piCurrency: piCur, internalStage: 'pi_preparing', currentActionRole: '业务员' });
    toast.success('PI 已创建');
  };

  const handleSubmitApproval = () => {
    onUpdate({ internalStage: 'pi_pending_approval', currentActionRole: '上级主管' });
    toast.success('PI 已提交审核');
  };

  const handleApprove = () => {
    onUpdate({ internalStage: 'pi_approved', currentActionRole: '业务员' });
    toast.success('PI 已通过审核');
  };

  const handleReject = () => {
    onUpdate({ internalStage: 'pi_rejected', currentActionRole: '业务员', piRejectionReason: '价格需调整，请修改后重新提交' });
    toast.error('PI 已驳回');
  };

  const handleSend = () => {
    onUpdate({ internalStage: 'pi_sent_to_customer', currentActionRole: '客户' });
    toast.success('PI 已发送给客户');
  };

  return (
    <div className="space-y-5">
      {/* PI 信息 */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">PI 制作（业务员）</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">PI 编号</div>
              <Input value={piNo} onChange={(e) => setPiNo(e.target.value)} placeholder="PI-2025-XXXX" className="h-7 text-xs" disabled={!canCreate} />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">金额</div>
              <Input value={piAmt} onChange={(e) => setPiAmt(e.target.value)} placeholder="0.00" className="h-7 text-xs" disabled={!canCreate} />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">货币</div>
              <Select value={piCur} onValueChange={setPiCur} disabled={!canCreate}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {order.piRejectionReason && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              驳回原因：{order.piRejectionReason}
            </div>
          )}

          <div className="flex items-center gap-2">
            {canCreate && <Button size="sm" onClick={handleCreate} className="h-7 text-xs">创建 PI</Button>}
            {canSubmit && <Button size="sm" onClick={handleSubmitApproval} className="h-7 text-xs">提交主管审核</Button>}
            {canSend && <Button size="sm" onClick={handleSend} className="h-7 text-xs"><Send className="w-3 h-3 mr-1" />发送给客户</Button>}
          </div>
        </div>
      </div>

      {/* 主管审核 */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">主管 PI 审核</span>
          {canApprove && <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />待审核</span>}
        </div>
        <div className="p-4 space-y-3">
          {order.piNumber ? (
            <div className="text-[13px] text-gray-700">
              PI 编号：<span className="font-semibold">{order.piNumber}</span> · 金额：<span className="font-semibold">{order.piAmount?.toLocaleString()} {order.piCurrency}</span>
            </div>
          ) : (
            <div className="text-[12px] text-gray-400">PI 尚未创建</div>
          )}
          {canApprove && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleApprove} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                <Check className="w-3 h-3 mr-1" />通过
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50">
                <X className="w-3 h-3 mr-1" />驳回
              </Button>
            </div>
          )}
          {order.internalStage === 'pi_approved' && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />PI 审核通过</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PIFeedbackTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const [rejectReason, setRejectReason] = useState(order.piCustomerFeedback || '');

  const handleMarkAccepted = () => {
    onUpdate({ internalStage: 'pi_accepted_by_customer', piCustomerDecision: 'accepted', currentActionRole: '业务员' });
    toast.success('已标记：客户确认 PI');
  };

  const handleMarkRejected = () => {
    onUpdate({ internalStage: 'pi_rejected_by_customer', piCustomerDecision: 'rejected', piCustomerFeedback: rejectReason, currentActionRole: '业务员' });
    toast.error('已标记：客户拒绝 PI');
  };

  const waitingFeedback = order.internalStage === 'pi_sent_to_customer';

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">客户 PI 响应记录</span>
        </div>
        <div className="p-4 space-y-3">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-[12px] text-gray-500 w-32">PI 发送时间</td>
                <td className="py-1.5 text-[13px]">{order.updatedAt || '—'}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-[12px] text-gray-500">客户决定</td>
                <td className="py-1.5">
                  {order.piCustomerDecision === 'accepted' && <span className="text-green-700 font-medium text-[12px]">✓ 已确认</span>}
                  {order.piCustomerDecision === 'rejected' && <span className="text-red-600 font-medium text-[12px]">✗ 已拒绝</span>}
                  {!order.piCustomerDecision && <span className="text-gray-400 text-[12px]">待响应</span>}
                </td>
              </tr>
              {order.piCustomerFeedback && (
                <tr>
                  <td className="py-1.5 text-[12px] text-gray-500">拒绝原因</td>
                  <td className="py-1.5 text-[13px] text-red-700">{order.piCustomerFeedback}</td>
                </tr>
              )}
            </tbody>
          </table>

          {waitingFeedback && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-[11px] text-gray-500 font-medium">手动更新客户响应</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="如客户拒绝，请填写拒绝原因..."
                className="w-full h-16 text-xs border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleMarkAccepted} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                  <Check className="w-3 h-3 mr-1" />客户已确认
                </Button>
                <Button size="sm" variant="outline" onClick={handleMarkRejected} className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50">
                  <X className="w-3 h-3 mr-1" />客户已拒绝
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CTNTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const ctnDocs = order.documents.filter(d => d.category === 'ctn');
  const canMark = order.internalStage === 'waiting_ctn_submission';

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">CTN 文件管理</span>
          {canMark && <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />等待客户提交</span>}
        </div>
        <div className="p-4 space-y-3">
          <div className="text-[12px] text-gray-600">
            客户需提交进口清关 CTN（报关单/进口单）文件。收到后系统自动流转。
          </div>
          {ctnDocs.length > 0 ? (
            <div className="space-y-1">
              {ctnDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded text-[12px]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-800">{doc.name}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{doc.fileSize}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{doc.uploadedAt}</span>
                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />已收到</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-gray-400 italic">暂无 CTN 文件</div>
          )}
          {canMark && (
            <Button size="sm" onClick={() => { onUpdate({ internalStage: 'ctn_received', currentActionRole: '业务员' }); toast.success('CTN 已标记为收到'); }} className="h-7 text-xs">
              标记已收到 CTN
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const [newQuote, setNewQuote] = useState({ forwarder: '', price: '', days: '' });
  const quotes = order.freightQuotes || [];
  const canAddQuote = ['waiting_shipping_notice', 'freight_quoting', 'ctn_received'].includes(order.internalStage);

  const handleAddQuote = () => {
    if (!newQuote.forwarder || !newQuote.price) { toast.error('请填写货代和价格'); return; }
    const updated: FreightQuote[] = [...quotes, {
      id: `fq${Date.now()}`, forwarder: newQuote.forwarder,
      price: Number(newQuote.price), currency: 'USD',
      transitDays: Number(newQuote.days), quotedAt: new Date().toISOString().slice(0, 10),
      confirmed: false,
    }];
    onUpdate({ freightQuotes: updated, internalStage: 'freight_quoting', currentActionRole: '客户' });
    setNewQuote({ forwarder: '', price: '', days: '' });
    toast.success('询价已添加，等待客户确认');
  };

  const handleConfirm = (id: string) => {
    const q = quotes.find(q => q.id === id);
    if (!q) return;
    const updated = quotes.map(qo => ({ ...qo, confirmed: qo.id === id }));
    onUpdate({
      freightQuotes: updated,
      confirmedForwarder: q.forwarder,
      confirmedFreight: q.price,
      internalStage: 'booking_in_progress',
      currentActionRole: '业务员',
    });
    toast.success(`已确认：${q.forwarder}，$${q.price}`);
  };

  return (
    <div className="space-y-5">
      {/* Shipping notice status */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">出货通知</span>
        </div>
        <div className="p-4">
          {['waiting_shipping_notice', 'freight_quoting', 'waiting_freight_confirmation', 'booking_in_progress', 'shipment_coordination', 'bill_of_lading_isolation', 'soa_preparing', 'soa_sent', 'waiting_payment_slip', 'payment_slip_received', 'payment_received_pending_check', 'payment_confirmed', 'freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) ? (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />客户已通知出货</div>
          ) : (
            <div className="flex items-center gap-1.5 text-[12px] text-amber-600"><Clock className="w-3.5 h-3.5" />等待客户通知出货安排</div>
          )}
        </div>
      </div>

      {/* Freight quotes */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">货代询价（至少 2 家）</span>
        </div>
        <div className="p-4 space-y-3">
          {quotes.length > 0 && (
            <table className="w-full text-[12px] border border-gray-200 rounded">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">货代</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">价格</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">运期（天）</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">状态</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map(q => (
                  <tr key={q.id} className={q.confirmed ? 'bg-green-50' : ''}>
                    <td className="px-3 py-2">{q.forwarder}</td>
                    <td className="px-3 py-2 font-medium">${q.price.toLocaleString()} {q.currency}</td>
                    <td className="px-3 py-2">{q.transitDays || '—'}</td>
                    <td className="px-3 py-2">
                      {q.confirmed ? <span className="text-green-700 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />已确认</span> : <span className="text-gray-400">待确认</span>}
                    </td>
                    <td className="px-3 py-2">
                      {!q.confirmed && order.internalStage === 'waiting_freight_confirmation' && (
                        <Button size="sm" onClick={() => handleConfirm(q.id)} className="h-6 text-[11px] px-2">确认</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canAddQuote && (
            <div className="flex items-end gap-2 pt-2 border-t border-gray-100">
              <div>
                <div className="text-[11px] text-gray-500 mb-1">货代名称</div>
                <Input value={newQuote.forwarder} onChange={e => setNewQuote(v => ({ ...v, forwarder: e.target.value }))} placeholder="货代公司" className="h-7 text-xs w-36" />
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">报价 (USD)</div>
                <Input value={newQuote.price} onChange={e => setNewQuote(v => ({ ...v, price: e.target.value }))} placeholder="0.00" className="h-7 text-xs w-24" />
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">运期（天）</div>
                <Input value={newQuote.days} onChange={e => setNewQuote(v => ({ ...v, days: e.target.value }))} placeholder="30" className="h-7 text-xs w-20" />
              </div>
              <Button size="sm" onClick={handleAddQuote} className="h-7 text-xs">添加询价</Button>
            </div>
          )}

          {order.confirmedForwarder && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded text-[12px] text-green-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              已确认：{order.confirmedForwarder}，运费 ${order.confirmedFreight?.toLocaleString()} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoordinationTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const inExecution = ['shipment_coordination', 'bill_of_lading_isolation', 'soa_preparing', 'soa_sent', 'waiting_payment_slip', 'payment_slip_received', 'payment_received_pending_check', 'payment_confirmed', 'freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage);

  const checkItems = [
    { label: '跟踪报关进度', done: inExecution },
    { label: '报关文件核对', done: inExecution },
    { label: '出口报关由客户供应商负责', done: inExecution },
    { label: '我方配合核对提单信息', done: ['bill_of_lading_isolation', 'soa_preparing', 'soa_sent', 'waiting_payment_slip', 'payment_slip_received', 'payment_received_pending_check', 'payment_confirmed', 'freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) },
  ];

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">跟单与报关协同</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-[12px] text-gray-600 mb-3">
            跟单员负责与客户供应商协同出货，核对文件，跟踪提单信息。出口报关由客户供应商负责，我方配合。
          </div>
          {checkItems.map(item => (
            <div key={item.label} className="flex items-center gap-2.5 text-[13px]">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                {item.done ? <Check className="w-2.5 h-2.5 text-white" /> : null}
              </div>
              <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
            </div>
          ))}
          {!inExecution && (
            <Button size="sm" onClick={() => { onUpdate({ internalStage: 'shipment_coordination', currentActionRole: '跟单员' }); toast.success('出货执行阶段已启动'); }} className="h-7 text-xs mt-2">
              启动出货执行
            </Button>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">重要提醒</span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-2.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">提单隔离流转原则</div>
              <div className="mt-1 text-amber-600">我方货代 <ArrowRight className="w-3 h-3 inline mx-0.5" /> 我方 <ArrowRight className="w-3 h-3 inline mx-0.5" /> 客户供应商。
              货代不得直接与客户供应商对接，提单必须经由我方流转。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BLIsolationTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const [blNo, setBlNo] = useState(order.blNumber || '');

  const steps = [
    { id: 'forwarder_to_us', label: '货代 → 我方', subtitle: '货代将提单发给我方', done: ['bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) },
    { id: 'us_review', label: '我方审核提单', subtitle: '核对提单信息', done: ['bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) },
    { id: 'us_to_supplier', label: '我方 → 客户供应商', subtitle: '我方转寄提单给客户供应商', done: ['bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) },
  ];

  const canMarkReceived = order.internalStage === 'bill_of_lading_isolation';
  const canMarkForwarded = order.internalStage === 'bl_received_by_us';

  return (
    <div className="space-y-5">
      {/* Isolation flow */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">提单隔离流转</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className={`flex flex-col items-center px-5 py-3 border rounded-sm ${step.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`} style={{ minWidth: 160 }}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 ${step.done ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {step.done ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-[11px] text-white font-bold">{i + 1}</span>}
                  </div>
                  <div className={`text-[12px] font-semibold ${step.done ? 'text-green-700' : 'text-gray-500'}`}>{step.label}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 text-center">{step.subtitle}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gray-300 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* BL details */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">提单信息</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-gray-500 w-24">提单号 (BL#)</div>
            <Input value={blNo} onChange={e => setBlNo(e.target.value)} placeholder="MBOL-XXXXXXXX-XXX" className="h-7 text-xs w-48" />
          </div>
          {order.blNumber && (
            <div className="text-[12px] text-gray-700">当前提单号：<span className="font-semibold">{order.blNumber}</span></div>
          )}
          {order.blForwardedAt && (
            <div className="text-[12px] text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />提单已于 {order.blForwardedAt} 转寄给客户供应商</div>
          )}
          <div className="flex gap-2">
            {canMarkReceived && (
              <Button size="sm" onClick={() => { onUpdate({ blNumber: blNo || order.blNumber, internalStage: 'bl_received_by_us', currentActionRole: '跟单员' }); toast.success('已标记：我方收到提单'); }} className="h-7 text-xs">
                标记我方已收到提单
              </Button>
            )}
            {canMarkForwarded && (
              <Button size="sm" onClick={() => { onUpdate({ internalStage: 'bl_forwarded_to_supplier', blForwardedAt: new Date().toISOString().slice(0, 10), currentActionRole: '财务' }); toast.success('提单已转寄'); }} className="h-7 text-xs">
                标记已转寄给客户供应商
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border border-amber-200 rounded-sm bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2 text-[12px] text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">隔离原则：</span>
            我方货代与客户供应商之间不得直接对接。提单必须通过我方中转，确保业务关系安全。
          </div>
        </div>
      </div>
    </div>
  );
}

function SOAPaymentTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const [soaAmt, setSoaAmt] = useState(order.soaAmount?.toString() || '');
  const [soaCur, setSoaCur] = useState(order.soaCurrency || 'USD');
  const canCreateSOA = ['pi_accepted_by_customer', 'ctn_received', 'waiting_shipping_notice', 'freight_quoting', 'waiting_freight_confirmation', 'booking_in_progress', 'shipment_coordination', 'bill_of_lading_isolation'].includes(order.internalStage);
  const waitingSlip = order.internalStage === 'waiting_payment_slip';
  const slipReceived = ['payment_slip_received', 'payment_received_pending_check', 'payment_confirmed', 'freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage);

  const handleSendSOA = () => {
    onUpdate({ soaAmount: Number(soaAmt), soaCurrency: soaCur, internalStage: 'soa_sent', currentActionRole: '客户' });
    toast.success('SOA 已发送');
  };

  const handleMarkSlipReceived = () => {
    onUpdate({ internalStage: 'payment_slip_received', currentActionRole: '财务' });
    toast.success('付款水单已标记收到');
  };

  const handleConfirmPayment = () => {
    onUpdate({ internalStage: 'payment_confirmed', currentActionRole: '财务' });
    toast.success('已确认到账');
  };

  return (
    <div className="space-y-5">
      {/* SOA */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">SOA（结算账单）</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-[12px] text-gray-600">SOA 包含：服务费 + 海运费（如有）</div>
          <div className="flex items-end gap-2">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">总金额</div>
              <Input value={soaAmt} onChange={e => setSoaAmt(e.target.value)} placeholder="0.00" className="h-7 text-xs w-28" disabled={!canCreateSOA && !!order.soaAmount} />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">货币</div>
              <Select value={soaCur} onValueChange={setSoaCur} disabled={!canCreateSOA && !!order.soaAmount}>
                <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(canCreateSOA || order.internalStage === 'soa_preparing') && (
              <Button size="sm" onClick={handleSendSOA} className="h-7 text-xs">
                <Send className="w-3 h-3 mr-1" />发送 SOA
              </Button>
            )}
          </div>
          {order.soaAmount && (
            <div className="text-[12px] text-gray-700">已发送 SOA：<span className="font-semibold">{order.soaAmount.toLocaleString()} {order.soaCurrency}</span></div>
          )}
        </div>
      </div>

      {/* Payment slip */}
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">付款水单跟踪</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-[12px]">
            <div className={`p-3 border rounded text-center ${waitingSlip ? 'border-amber-200 bg-amber-50' : slipReceived ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="font-medium mb-1">等待付款水单</div>
              <div className={waitingSlip ? 'text-amber-600' : slipReceived ? 'text-green-600' : 'text-gray-400'}>
                {waitingSlip ? '进行中' : slipReceived ? '已完成' : '待启动'}
              </div>
            </div>
            <div className={`p-3 border rounded text-center ${order.internalStage === 'payment_slip_received' ? 'border-amber-200 bg-amber-50' : ['payment_received_pending_check', 'payment_confirmed', 'freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="font-medium mb-1">水单已收到</div>
              <div className="text-gray-500">财务确认</div>
            </div>
            <div className={`p-3 border rounded text-center ${order.internalStage === 'payment_confirmed' || ['freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="font-medium mb-1">已确认到账</div>
              <div className="text-gray-500">财务</div>
            </div>
          </div>

          <div className="flex gap-2">
            {waitingSlip && (
              <Button size="sm" onClick={handleMarkSlipReceived} className="h-7 text-xs">
                标记已收到付款水单
              </Button>
            )}
            {order.internalStage === 'payment_received_pending_check' && (
              <Button size="sm" onClick={handleConfirmPayment} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />确认已到账
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettlementTab({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (patch: Partial<ExportServiceOrder>) => void }) {
  const canPayFreight = order.internalStage === 'payment_confirmed' && order.confirmedFreight;
  const canClose = order.internalStage === 'bl_forwarded_to_supplier';

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">运费结算</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-[12px] text-gray-600">财务在客户付款到账后，向我方货代支付海运费。</div>
          {order.confirmedFreight && (
            <div className="text-[13px] text-gray-700">应付货代运费：<span className="font-semibold">${order.confirmedFreight.toLocaleString()} USD</span>（{order.confirmedForwarder}）</div>
          )}
          <div className="flex gap-2">
            {canPayFreight && (
              <Button size="sm" onClick={() => { onUpdate({ internalStage: 'freight_paid_to_forwarder', currentActionRole: '跟单员' }); toast.success('运费已标记支付'); }} className="h-7 text-xs">
                <CreditCard className="w-3 h-3 mr-1" />标记运费已付货代
              </Button>
            )}
          </div>
          {['freight_paid_to_forwarder', 'bl_received_by_us', 'bl_forwarded_to_supplier', 'completed'].includes(order.internalStage) && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />运费已付货代</div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-sm">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">整单收口</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-[12px] text-gray-600">确认所有文件归档、款项结清、提单转寄完成后，财务执行整单收口。</div>
          {order.internalStage === 'completed' ? (
            <div className="flex items-center gap-2 text-[13px] text-green-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />整单已收口
            </div>
          ) : (
            <Button size="sm" onClick={() => { onUpdate({ internalStage: 'completed', currentActionRole: '—' }); toast.success('整单已收口'); }} disabled={!canClose} className="h-7 text-xs">
              整单收口
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentCenterTab({ order }: { order: ExportServiceOrder }) {
  const docsByCategory = useMemo(() => {
    const map: Record<string, ExportServiceDocument[]> = {};
    DOC_CAT_ORDER.forEach(cat => { map[cat] = []; });
    order.documents.forEach(d => {
      if (!map[d.category]) map[d.category] = [];
      map[d.category].push(d);
    });
    return map;
  }, [order.documents]);

  return (
    <div className="space-y-4">
      {DOC_CAT_ORDER.map(cat => {
        const docs = docsByCategory[cat] || [];
        return (
          <div key={cat} className="border border-gray-200 rounded-sm">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{DOC_CAT_LABEL[cat]}</span>
              <span className="text-[11px] text-gray-400">{docs.length} 份</span>
            </div>
            {docs.length > 0 ? (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-1.5 text-left font-medium text-gray-500">文件名</th>
                    <th className="px-4 py-1.5 text-left font-medium text-gray-500">上传方</th>
                    <th className="px-4 py-1.5 text-left font-medium text-gray-500">时间</th>
                    <th className="px-4 py-1.5 text-left font-medium text-gray-500">客户可见</th>
                    <th className="px-4 py-1.5 text-left font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docs.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-800">{doc.name}</span>
                          {doc.fileSize && <span className="text-gray-400">({doc.fileSize})</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{doc.uploadedBy}<span className="text-gray-400 ml-1">({doc.uploaderRole})</span></td>
                      <td className="px-4 py-2 text-gray-500">{doc.uploadedAt}</td>
                      <td className="px-4 py-2">
                        {doc.visibleToCustomer
                          ? <span className="text-green-600 flex items-center gap-0.5"><Eye className="w-3 h-3" />可见</span>
                          : <span className="text-gray-400 flex items-center gap-0.5"><X className="w-3 h-3" />仅内部</span>}
                      </td>
                      <td className="px-4 py-2">
                        {doc.status === 'verified' && <span className="text-green-700 font-medium">已核对</span>}
                        {doc.status === 'received' && <span className="text-blue-600 font-medium">已收到</span>}
                        {doc.status === 'pending' && <span className="text-amber-600">待确认</span>}
                        {doc.status === 'rejected' && <span className="text-red-600">已驳回</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-2.5 text-[12px] text-gray-400 italic">暂无文件</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function WorkbenchDetail({ order, onUpdate }: { order: ExportServiceOrder; onUpdate: (id: string, patch: Partial<ExportServiceOrder>) => void }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '委托概览' },
    { id: 'assignment', label: '受理与分配' },
    { id: 'pi', label: 'PI 制作审核' },
    { id: 'pi_feedback', label: '客户 PI 响应' },
    { id: 'ctn', label: 'CTN 文件' },
    { id: 'booking', label: '出货与订舱' },
    { id: 'coordination', label: '跟单与报关' },
    { id: 'bl_isolation', label: '提单隔离流转' },
    { id: 'soa_payment', label: 'SOA 与付款' },
    { id: 'settlement', label: '运费与结算' },
    { id: 'documents', label: '内部文档中心' },
  ];

  const patch = (p: Partial<ExportServiceOrder>) => onUpdate(order.id, p);

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-gray-900">{order.id}</span>
              {sourceBadge(order.source)}
              {order.isUrgent && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">加急</span>}
              {order.isBlocked && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">阻断</span>}
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5">{order.customer} · {order.region} · {order.type}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stageBadge(order.internalStage)}
          <span className="text-[11px] text-gray-400">责任：{order.currentActionRole}</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && <OverviewTab order={order} />}
        {activeTab === 'assignment' && <AssignmentTab order={order} onUpdate={patch} />}
        {activeTab === 'pi' && <PITab order={order} onUpdate={patch} />}
        {activeTab === 'pi_feedback' && <PIFeedbackTab order={order} onUpdate={patch} />}
        {activeTab === 'ctn' && <CTNTab order={order} onUpdate={patch} />}
        {activeTab === 'booking' && <BookingTab order={order} onUpdate={patch} />}
        {activeTab === 'coordination' && <CoordinationTab order={order} onUpdate={patch} />}
        {activeTab === 'bl_isolation' && <BLIsolationTab order={order} onUpdate={patch} />}
        {activeTab === 'soa_payment' && <SOAPaymentTab order={order} onUpdate={patch} />}
        {activeTab === 'settlement' && <SettlementTab order={order} onUpdate={patch} />}
        {activeTab === 'documents' && <DocumentCenterTab order={order} />}
      </div>
    </div>
  );
}

// ─── Main Workbench ───────────────────────────────────────────────────────────

export function ExportServiceWorkbench() {
  const [orders, setOrders] = useState<ExportServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [softTimeoutFallback, setSoftTimeoutFallback] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    let settled = false;

    setLoading(true);

    const softTimeout = window.setTimeout(() => {
      if (settled || requestIdRef.current !== requestId) return;
      setSoftTimeoutFallback(true);
      setLoading(false);
    }, 1200);

    try {
      const data = await exportServiceOrdersDb.getAll();
      settled = true;
      window.clearTimeout(softTimeout);
      if (requestIdRef.current !== requestId) return;
      setOrders(Array.isArray(data) ? data : []);
      setSoftTimeoutFallback(false);
      setSelectedId((prev) => {
        const nextData = Array.isArray(data) ? data : [];
        if (prev && nextData.some((item) => item.id === prev)) return prev;
        return nextData[0]?.id ?? null;
      });
    } catch (error) {
      settled = true;
      window.clearTimeout(softTimeout);
      if (requestIdRef.current !== requestId) return;
      console.warn('[ExportServiceWorkbench] load orders failed:', error);
    } finally {
      settled = true;
      window.clearTimeout(softTimeout);
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  // Load real data from Supabase
  useEffect(() => {
    let mounted = true;
    void loadOrders();

    const sub = exportServiceOrdersDb.subscribeChanges(() => {
      if (!mounted) return;
      void loadOrders();
    });

    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, [loadOrders]);

  const selectedOrder = orders.find(o => o.id === selectedId) ?? null;

  const handleUpdate = useCallback(async (id: string, patch: Partial<ExportServiceOrder>) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o));
    // Persist to Supabase
    await exportServiceOrdersDb.update(id, patch);
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.customer.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRegion !== 'all' && o.region !== filterRegion) return false;
      if (filterStage !== 'all' && STAGE_GROUP[o.internalStage] !== filterStage) return false;
      if (filterSource !== 'all' && o.source !== filterSource) return false;
      return true;
    });
  }, [orders, search, filterRegion, filterStage, filterSource]);

  const urgentCount = orders.filter(o => o.isUrgent).length;
  const pendingCount = orders.filter(o => !['completed', 'cancelled'].includes(o.internalStage)).length;

  return (
    <div className="flex flex-col h-full bg-white" style={{ fontFamily: 'var(--hd-font, system-ui)' }}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 uppercase tracking-wide">借抬头出口服务</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">内部执行工作台 · 委托全流程管理</p>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            {loading && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                同步中
              </div>
            )}
            {softTimeoutFallback && (
              <div className="text-amber-600">
                数据加载较慢，已先显示页面骨架
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-600">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              进行中 <span className="font-semibold">{pendingCount}</span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                加急 <span className="font-semibold">{urgentCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-5 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="委托单号 / 客户" className="h-7 text-xs pl-7 w-44" />
        </div>
        <Select value={filterRegion} onValueChange={setFilterRegion}>
          <SelectTrigger className="h-7 text-xs w-24"><SelectValue placeholder="区域" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部区域</SelectItem>
            <SelectItem value="NA">NA</SelectItem>
            <SelectItem value="SA">SA</SelectItem>
            <SelectItem value="EA">EA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="阶段" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部阶段</SelectItem>
            <SelectItem value="request">委托受理</SelectItem>
            <SelectItem value="pi">PI 环节</SelectItem>
            <SelectItem value="ctn">CTN</SelectItem>
            <SelectItem value="shipment">出货订舱</SelectItem>
            <SelectItem value="execution">执行跟单</SelectItem>
            <SelectItem value="payment">SOA 付款</SelectItem>
            <SelectItem value="settlement">结算收口</SelectItem>
            <SelectItem value="done">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="来源" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="customer_portal">客户端</SelectItem>
            <SelectItem value="email_import">邮件导入</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-[11px] text-gray-400">{filtered.length} 条</div>
      </div>

      {/* Body: list + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Order list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {loading && orders.length === 0 ? (
              <div className="px-4 py-4 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`export-service-list-skeleton-${index}`} className="rounded border border-gray-100 p-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-40 animate-pulse rounded bg-gray-50" />
                    <div className="mt-3 h-5 w-24 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-gray-400">暂无委托单</div>
            ) : (
              filtered.map(order => {
                const isSelected = order.id === selectedId;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="truncate text-[13px] font-semibold text-gray-900">{order.id}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {order.isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="加急" />}
                        {sourceBadge(order.source)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      {stageBadge(order.internalStage)}
                      <CompactDetailsPopover
                        align="end"
                        items={[
                          { label: '客户', value: order.customer },
                          { label: '区域', value: order.region },
                          { label: '责任', value: order.currentActionRole },
                          { label: '更新', value: order.updatedAt },
                        ]}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && orders.length === 0 ? (
            <div className="flex-1 p-5 space-y-4">
              <div className="h-16 animate-pulse rounded border border-gray-100 bg-gray-50" />
              <div className="h-12 animate-pulse rounded border border-gray-100 bg-gray-50" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-48 animate-pulse rounded border border-gray-100 bg-gray-50" />
                <div className="h-48 animate-pulse rounded border border-gray-100 bg-gray-50" />
              </div>
              <div className="h-56 animate-pulse rounded border border-gray-100 bg-gray-50" />
            </div>
          ) : selectedOrder ? (
            <WorkbenchDetail
              key={selectedOrder.id}
              order={selectedOrder}
              onUpdate={handleUpdate}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-gray-400">
              请从左侧选择委托单
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExportServiceWorkbench;
