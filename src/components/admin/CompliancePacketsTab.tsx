import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { RefreshCw, FileCheck, DollarSign, Ship, Upload, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useUser } from '../../contexts/UserContext';
import { approvalRecordService, financeCompliancePacketService, purchaseOrderExecutionStatusService } from '../../lib/supabaseService';
import { financeComplianceStorage } from '../../lib/storageService';

const slotLabelMap: Record<string, string> = {
  D01: 'D01 退税申报',
  D05: 'D05 报关/提运',
  D09: 'D09 国际运费',
  D10: 'D10 国际免责',
  D11: 'D11 收汇',
  D12: 'D12 结汇',
  D13: 'D13 收汇凭证表',
};

const statusColorMap: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  collecting: 'bg-amber-100 text-amber-700 border-amber-200',
  partially_ready: 'bg-blue-100 text-blue-700 border-blue-200',
  ready_for_fx_docs: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  ready_for_tax_refund: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  archived: 'bg-violet-100 text-violet-700 border-violet-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  awaiting_upload: 'bg-amber-100 text-amber-700 border-amber-200',
  awaiting_generation: 'bg-orange-100 text-orange-700 border-orange-200',
  linked: 'bg-blue-100 text-blue-700 border-blue-200',
  uploaded: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  generated: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
  not_required: 'bg-gray-100 text-gray-500 border-gray-200',
};

function PacketBadge({ value }: { value: string }) {
  return (
    <Badge className={`text-xs border ${statusColorMap[value] || statusColorMap.pending}`}>
      {value}
    </Badge>
  );
}

function isSlotReady(slot: any) {
  return ['linked', 'uploaded', 'generated', 'verified'].includes(String(slot?.status || ''));
}

export default function CompliancePacketsTab() {
  const { user } = useUser();
  const currentUserRole = String(user?.role || user?.userRole || '');
  const canEditFinancePacket = ['Finance', 'CFO', 'CEO'].includes(currentUserRole);
  const [packets, setPackets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [uploadDialog, setUploadDialog] = React.useState<{ packet: any; docCode: 'D09' | 'D11' | 'D12' } | null>(null);
  const [detailPacket, setDetailPacket] = React.useState<any | null>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadRemarks, setUploadRemarks] = React.useState('');
  const [requestingReleaseId, setRequestingReleaseId] = React.useState<string | null>(null);
  const [lcDiscrepancyDialog, setLcDiscrepancyDialog] = React.useState<{
    packet: any;
    status: 'none' | 'open' | 'resolved';
    notes: string;
  } | null>(null);
  const [bankStatusDialog, setBankStatusDialog] = React.useState<{
    packet: any;
    status: 'pending_submission' | 'submitted_to_bank' | 'negotiated' | 'collected';
    notes: string;
  } | null>(null);

  const loadPackets = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await financeCompliancePacketService.listPackets();
      setPackets(rows || []);
    } catch (error: any) {
      toast.error(error?.message || '加载合规文件包失败');
      setPackets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPackets();
  }, [loadPackets]);

  const handleSync = async (purchaseOrderId: string) => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能触发财务包同步与自动生成动作');
      return;
    }
    if (!purchaseOrderId) return;
    setSyncingId(purchaseOrderId);
    try {
      await financeCompliancePacketService.syncByPurchaseOrderId(purchaseOrderId);
      await loadPackets();
      toast.success('合规文件包已同步');
    } catch (error: any) {
      toast.error(error?.message || '同步合规文件包失败');
    } finally {
      setSyncingId(null);
    }
  };

  const handleFinanceConfirm = async (packet: any, docCode: 'D09' | 'D11' | 'D12', uploaded?: any) => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能维护财务资料');
      return;
    }
    if (!packet.purchaseOrderId) return;
    setSyncingId(packet.purchaseOrderId);
    try {
      if (docCode === 'D09') {
        await financeCompliancePacketService.markIntlFreightUploadedByPurchaseOrderId(packet.purchaseOrderId, {
          operator: 'finance',
          remarks: uploadRemarks || '国际运费发票及付款凭证已确认',
          fileName: uploaded?.fileName,
          fileType: uploaded?.mimeType,
          storageBucket: uploaded?.bucket,
          storagePath: uploaded?.path,
          fileUrl: uploaded?.url,
        });
      } else if (docCode === 'D11') {
        await financeCompliancePacketService.markFxReceiptUploadedByPurchaseOrderId(packet.purchaseOrderId, {
          operator: 'finance',
          remarks: uploadRemarks || '财务已确认收汇水单',
          fileName: uploaded?.fileName,
          fileType: uploaded?.mimeType,
          storageBucket: uploaded?.bucket,
          storagePath: uploaded?.path,
          fileUrl: uploaded?.url,
        });
      } else {
        await financeCompliancePacketService.markFxSettlementUploadedByPurchaseOrderId(packet.purchaseOrderId, {
          operator: 'finance',
          remarks: uploadRemarks || '财务已确认结汇水单',
          fileName: uploaded?.fileName,
          fileType: uploaded?.mimeType,
          storageBucket: uploaded?.bucket,
          storagePath: uploaded?.path,
          fileUrl: uploaded?.url,
        });
      }
      await loadPackets();
      toast.success(`${docCode} 已确认`);
    } catch (error: any) {
      toast.error(error?.message || `${docCode} 确认失败`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleOpenUpload = (packet: any, docCode: 'D09' | 'D11' | 'D12') => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能上传财务资料');
      return;
    }
    const slotMap = Object.fromEntries((packet?.slots || []).map((slot: any) => [slot.docCode, slot]));
    if (docCode === 'D12' && !isSlotReady(slotMap.D11)) {
      toast.error('D11 收汇水单未就绪，当前不能先上传 D12 结汇水单');
      return;
    }
    setUploadDialog({ packet, docCode });
    setUploadFile(null);
    setUploadRemarks('');
  };

  const handleSubmitUpload = async () => {
    if (!uploadDialog) return;
    if (!uploadFile) {
      toast.error('请先选择文件');
      return;
    }
    const { packet, docCode } = uploadDialog;
    setSyncingId(packet.purchaseOrderId);
    try {
      const uploaded = await financeComplianceStorage.upload(
        uploadFile,
        packet.packetNo || packet.purchaseOrderId,
        docCode,
        'finance@erp.local',
      );
      await handleFinanceConfirm(packet, docCode, {
        ...uploaded,
        bucket: 'finance-compliance-docs',
      });
      setUploadDialog(null);
      setUploadFile(null);
      setUploadRemarks('');
    } catch (error: any) {
      toast.error(error?.message || `${docCode} 上传失败`);
      setSyncingId(null);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('zh-CN');
    } catch {
      return value;
    }
  };

  const openDetail = (packet: any) => {
    setDetailPacket(packet);
  };

  const openLcDiscrepancyDialog = (packet: any) => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能维护 L/C 不符点');
      return;
    }
    const milestones = getBusinessMilestones(packet);
    setLcDiscrepancyDialog({
      packet,
      status: (milestones?.lcDiscrepancyStatus as 'none' | 'open' | 'resolved') || 'none',
      notes: milestones?.lcDiscrepancyNotes || '',
    });
  };

  const handleSaveLcDiscrepancy = async () => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能维护 L/C 不符点');
      return;
    }
    if (!lcDiscrepancyDialog?.packet?.purchaseOrderId) return;
    const purchaseOrderId = lcDiscrepancyDialog.packet.purchaseOrderId;
    setSyncingId(purchaseOrderId);
    try {
      await purchaseOrderExecutionStatusService.updateLcDiscrepancyByPurchaseOrderId(purchaseOrderId, {
        status: lcDiscrepancyDialog.status,
        notes: lcDiscrepancyDialog.notes,
        updatedBy: user?.name || user?.email || 'Finance',
      });
      if (lcDiscrepancyDialog.status === 'open') {
        const requests = await approvalRecordService.getAll();
        const existing = (requests || []).find((req: any) =>
          req.type === 'lc_discrepancy' &&
          String(req.relatedDocumentId || '') === String(purchaseOrderId) &&
          ['pending', 'forwarded'].includes(String(req.status || ''))
        );
        if (!existing) {
          const milestones = getBusinessMilestones(lcDiscrepancyDialog.packet);
          await approvalRecordService.upsert({
            id: crypto.randomUUID(),
            type: 'lc_discrepancy',
            relatedDocumentId: purchaseOrderId,
            relatedDocumentType: 'L/C 不符点审批',
            relatedDocument: {
              purchaseOrderId,
              poNumber: lcDiscrepancyDialog.packet?.cgNo || lcDiscrepancyDialog.packet?.purchaseOrderNo || null,
              packetNo: lcDiscrepancyDialog.packet?.packetNo || null,
              lcDiscrepancyStatus: 'open',
              lcDiscrepancyNotes: lcDiscrepancyDialog.notes,
              businessMilestones: milestones,
            },
            submittedBy: String(user?.email || user?.name || 'finance').trim().toLowerCase(),
            submittedByName: user?.name || user?.email || 'Finance',
            submittedByRole: currentRole || 'Finance',
            submittedAt: new Date().toISOString(),
            region: String(milestones?.region || 'NA'),
            currentApprover: 'ceo@cosunchina.com',
            currentApproverRole: 'CEO',
            nextApprover: null,
            nextApproverRole: null,
            requiresDirectorApproval: false,
            status: 'pending',
            urgency: 'high',
            amount: 0,
            currency: lcDiscrepancyDialog.packet?.currency || 'USD',
            customerName: lcDiscrepancyDialog.packet?.customerName || '',
            customerEmail: '',
            productSummary: `L/C 不符点：${lcDiscrepancyDialog.notes || '待审批'}`,
            approvalHistory: [],
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            expiresIn: 24,
          });
        }
      }
      await financeCompliancePacketService.syncByPurchaseOrderId(purchaseOrderId);
      await loadPackets();
      if (detailPacket?.purchaseOrderId === purchaseOrderId) {
        const refreshed = await financeCompliancePacketService.ensureByPurchaseOrderId(purchaseOrderId);
        setDetailPacket(refreshed);
      }
      setLcDiscrepancyDialog(null);
      toast.success('L/C 不符点状态已更新');
    } catch (error: any) {
      toast.error(error?.message || '保存 L/C 不符点失败');
    } finally {
      setSyncingId(null);
    }
  };

  const openBankStatusDialog = (packet: any) => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能维护银行交单状态');
      return;
    }
    const milestones = getBusinessMilestones(packet);
    const slotMap = Object.fromEntries((packet?.slots || []).map((slot: any) => [slot.docCode, slot]));
    if (!isSlotReady(slotMap.D05)) {
      toast.error('D05 未齐套，当前不能维护银行交单状态');
      return;
    }
    if (!['L/C', 'D/P或其它'].includes(String(milestones?.collectionRuleLabel || ''))) {
      toast.error('当前收款模式无需维护银行交单状态');
      return;
    }
    setBankStatusDialog({
      packet,
      status: (milestones?.bankSubmissionStatus as 'pending_submission' | 'submitted_to_bank' | 'negotiated' | 'collected') || 'pending_submission',
      notes: '',
    });
  };

  const handleSaveBankStatus = async () => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能维护银行交单状态');
      return;
    }
    if (!bankStatusDialog?.packet?.purchaseOrderId) return;
    const purchaseOrderId = bankStatusDialog.packet.purchaseOrderId;
    const milestones = getBusinessMilestones(bankStatusDialog.packet);
    const collectionRuleLabel = String(milestones?.collectionRuleLabel || '');
    const hasOpenLcDiscrepancy = ['open', 'pending', 'raised'].includes(String(milestones?.lcDiscrepancyStatus || ''));
    const nextBankStatus = bankStatusDialog.status;

    let nextReleaseStatus = milestones?.documentReleaseStatus || 'pending';
    if (collectionRuleLabel === 'L/C') {
      if (['negotiated', 'collected'].includes(nextBankStatus) && !hasOpenLcDiscrepancy) {
        nextReleaseStatus = nextReleaseStatus === 'released' ? 'released' : 'ready_to_release';
      } else if (nextReleaseStatus !== 'released') {
        nextReleaseStatus = 'blocked';
      }
    } else if (collectionRuleLabel === 'D/P或其它') {
      if (nextBankStatus === 'collected') {
        nextReleaseStatus = nextReleaseStatus === 'released' ? 'released' : 'ready_to_release';
      } else if (nextReleaseStatus !== 'released') {
        nextReleaseStatus = 'blocked';
      }
    }

    setSyncingId(purchaseOrderId);
    try {
      await purchaseOrderExecutionStatusService.upsertByPurchaseOrderId(purchaseOrderId, {
        bankSubmissionStatus: nextBankStatus,
        bankSubmittedAt: ['submitted_to_bank', 'negotiated', 'collected'].includes(nextBankStatus)
          ? new Date().toISOString()
          : null,
        bankSubmittedBy: ['submitted_to_bank', 'negotiated', 'collected'].includes(nextBankStatus)
          ? (user?.name || user?.email || 'Finance')
          : null,
        documentReleaseStatus: nextReleaseStatus,
      });
      await financeCompliancePacketService.syncByPurchaseOrderId(purchaseOrderId);
      await loadPackets();
      if (detailPacket?.purchaseOrderId === purchaseOrderId) {
        const refreshed = await financeCompliancePacketService.ensureByPurchaseOrderId(purchaseOrderId);
        setDetailPacket(refreshed);
      }
      setBankStatusDialog(null);
      toast.success('D05 银行交单状态已更新');
    } catch (error: any) {
      toast.error(error?.message || '保存 D05 银行交单状态失败');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSubmitReleaseException = async (packet: any) => {
    if (!canEditFinancePacket) {
      toast.error('当前角色仅可查看财务包，不能提交例外放单申请');
      return;
    }
    const milestones = getBusinessMilestones(packet);
    if (!packet?.purchaseOrderId) {
      toast.error('缺少采购单标识，无法提交例外放单申请');
      return;
    }
    if (!milestones?.releaseBlockedReason) {
      toast.error('当前没有放单阻断原因，无需提交例外放单申请');
      return;
    }

    setRequestingReleaseId(packet.purchaseOrderId);
    try {
      const requests = await approvalRecordService.getAll();
      const existing = (requests || []).find((req: any) =>
        req.relatedDocumentType === '例外放单申请' &&
        String(req.relatedDocumentId || '') === String(packet.purchaseOrderId) &&
        ['pending', 'forwarded'].includes(String(req.status || ''))
      );
      if (existing) {
        toast.error('该单已有待审批的例外放单申请，请勿重复提交');
        return;
      }

      await approvalRecordService.upsert({
        id: crypto.randomUUID(),
        type: 'payment',
        relatedDocumentId: packet.purchaseOrderId,
        relatedDocumentType: '例外放单申请',
        relatedDocument: {
          purchaseOrderId: packet.purchaseOrderId,
          packetNo: packet.packetNo || null,
          businessMilestones: milestones,
          releaseBlockedReason: milestones.releaseBlockedReason,
        },
        submittedBy: user?.email || 'finance@cosunchina.com',
        submittedByName: user?.name || user?.email || 'Finance',
        submittedByRole: user?.role || user?.userRole || 'Finance',
        submittedAt: new Date().toISOString(),
        region: 'NA',
        currentApprover: 'ceo@cosunchina.com',
        currentApproverRole: 'CEO',
        nextApprover: null,
        nextApproverRole: null,
        requiresDirectorApproval: false,
        status: 'pending',
        urgency: 'high',
        amount: 0,
        currency: 'CNY',
        customerName: packet.customerName || packet.customer || '',
        customerEmail: '',
        productSummary: [
          packet.packetNo ? `Packet ${packet.packetNo}` : null,
          milestones.blNo ? `BL ${milestones.blNo}` : null,
          milestones.collectionRuleLabel ? `收款 ${milestones.collectionRuleLabel}` : null,
          milestones.releaseBlockedReason ? `阻断 ${milestones.releaseBlockedReason}` : null,
        ].filter(Boolean).join(' · '),
        approvalHistory: [],
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success('已提交例外放单申请，等待 CEO 审批');
    } catch (error: any) {
      toast.error(error?.message || '提交例外放单申请失败');
    } finally {
      setRequestingReleaseId(null);
    }
  };

  const getPendingTasks = (packet: any) => {
    return (packet?.slots || [])
      .filter((slot: any) => slot.status !== 'not_required')
      .filter((slot: any) => !['linked', 'uploaded', 'generated', 'verified'].includes(String(slot.status || '')))
      .map((slot: any) => ({
        docCode: slot.docCode,
        docName: slot.docName || slotLabelMap[slot.docCode] || slot.docCode,
        status: slot.status || 'pending',
        reason: slot.missingReason || slot.notes || '等待补齐',
      }));
  };

  const getActivityLog = (packet: any) => {
    const parseSourceRef = (value: any) => {
      if (!value) return null;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };
    return (packet?.slots || [])
      .flatMap((slot: any) => {
        const events = [];
        const sourceRef = parseSourceRef(slot.sourceRef);
        if (slot.docCode === 'D05' && sourceRef?.bankSubmittedAt) {
          events.push({
            time: sourceRef.bankSubmittedAt,
            label: 'D05 银行交单',
            actor: sourceRef.bankSubmittedBy || 'business',
            note: [sourceRef.bankSubmissionStatus || null, sourceRef.blNo ? `BL ${sourceRef.blNo}` : null].filter(Boolean).join(' · '),
          });
        }
        if (slot.docCode === 'D05' && sourceRef?.documentReleasedAt) {
          events.push({
            time: sourceRef.documentReleasedAt,
            label: 'D05 单证/正本放行',
            actor: sourceRef.documentReleasedBy || 'business',
            note: [sourceRef.documentReleaseStatus || null, sourceRef.blNo ? `BL ${sourceRef.blNo}` : null].filter(Boolean).join(' · '),
          });
        }
        if (slot.docCode === 'D05' && sourceRef?.lcDiscrepancyUpdatedAt) {
          events.push({
            time: sourceRef.lcDiscrepancyUpdatedAt,
            label: 'D05 L/C 不符点更新',
            actor: sourceRef.lcDiscrepancyUpdatedBy || 'finance',
            note: [
              sourceRef.lcDiscrepancyStatus ? `状态 ${sourceRef.lcDiscrepancyStatus}` : null,
              sourceRef.lcDiscrepancyNotes || null,
            ].filter(Boolean).join(' · '),
          });
        }
        if (slot.docCode === 'D05' && slot.status === 'linked') {
          events.push({
            time: slot.updatedAt,
            label: 'D05 业务资料已关联',
            actor: slot.confirmedBy || 'system',
            note: slot.notes || '',
          });
        }
        if (slot.currentFile?.uploadedAt) {
          events.push({
            time: slot.currentFile.uploadedAt,
            label: `${slot.docCode} 上传当前文件`,
            actor: slot.currentFile.uploadedByPartyId || slot.currentFile.uploadedFromPortal || '-',
            note: slot.currentFile.fileName || slot.currentFile.remarks || '',
          });
        }
        if (slot.currentFile?.verifiedAt || slot.confirmedAt) {
          events.push({
            time: slot.currentFile?.verifiedAt || slot.confirmedAt,
            label: `${slot.docCode} 已核验`,
            actor: slot.currentFile?.verifiedByFinance || slot.confirmedBy || '-',
            note: slot.currentFile?.remarks || slot.notes || '',
          });
        }
        if (slot.generatedAt && ['generated', 'verified', 'uploaded', 'linked'].includes(String(slot.status || ''))) {
          events.push({
            time: slot.generatedAt,
            label: `${slot.docCode} 自动生成`,
            actor: 'system',
            note: slot.notes || '',
          });
        }
        if (!slot.currentFile && slot.updatedAt) {
          events.push({
            time: slot.updatedAt,
            label: `${slot.docCode} 状态更新`,
            actor: slot.confirmedBy || 'system',
            note: slot.notes || slot.missingReason || slot.status || '',
          });
        }
        return events;
      })
      .filter((event: any) => event.time)
      .sort((a: any, b: any) => String(b.time).localeCompare(String(a.time)))
      .slice(0, 12);
  };

  const getBusinessMilestones = (packet: any) => {
    const d05 = (packet?.slots || []).find((slot: any) => slot.docCode === 'D05');
    if (!d05?.sourceRef) return null;
    try {
      const sourceRef = typeof d05.sourceRef === 'string' ? JSON.parse(d05.sourceRef) : d05.sourceRef;
        return {
          blNo: sourceRef?.blNo || null,
          collectionRuleLabel: sourceRef?.collectionRuleLabel || null,
          releaseBlockedReason: sourceRef?.releaseBlockedReason || null,
          bankSubmissionStatus: sourceRef?.bankSubmissionStatus || null,
        bankSubmittedAt: sourceRef?.bankSubmittedAt || null,
        bankSubmittedBy: sourceRef?.bankSubmittedBy || null,
          documentReleaseStatus: sourceRef?.documentReleaseStatus || null,
          documentReleasedAt: sourceRef?.documentReleasedAt || null,
          documentReleasedBy: sourceRef?.documentReleasedBy || null,
          lcDiscrepancyStatus: sourceRef?.lcDiscrepancyStatus || null,
          lcDiscrepancyNotes: sourceRef?.lcDiscrepancyNotes || null,
          lcDiscrepancyUpdatedAt: sourceRef?.lcDiscrepancyUpdatedAt || null,
          lcDiscrepancyUpdatedBy: sourceRef?.lcDiscrepancyUpdatedBy || null,
          lcDiscrepancyResolvedAt: sourceRef?.lcDiscrepancyResolvedAt || null,
        };
      } catch {
        return null;
      }
  };

  const getFinanceStageBlocks = (packet: any) => {
    const slotMap = Object.fromEntries((packet?.slots || []).map((slot: any) => [slot.docCode, slot]));
    const d05Ready = isSlotReady(slotMap.D05);
    const d11Ready = isSlotReady(slotMap.D11);
    const d12Ready = isSlotReady(slotMap.D12);
    const d13Ready = isSlotReady(slotMap.D13);
    const d01Ready = isSlotReady(slotMap.D01);

    const blocks: Array<{ key: string; title: string; detail: string }> = [];
    if (!d05Ready) {
      blocks.push({
        key: 'd05',
        title: 'D05 未齐套',
        detail: '未齐套前不能进入完整交单/放单控制，也不能生成 D01。',
      });
    }
    if (d05Ready && !d11Ready) {
      blocks.push({
        key: 'd11',
        title: 'D11 未齐套',
        detail: 'D11 收汇水单未到位，当前不能进入完整结汇与退税资料链。',
      });
    }
    if (d11Ready && !d12Ready) {
      blocks.push({
        key: 'd12',
        title: 'D12 未齐套',
        detail: 'D12 结汇水单未到位，当前不能自动生成 D13。',
      });
    }
    if (d12Ready && !d13Ready) {
      blocks.push({
        key: 'd13',
        title: 'D13 未齐套',
        detail: 'D13 收汇凭证情况表未生成，当前不能形成完整退税资料链。',
      });
    }
    if (d05Ready && d11Ready && d12Ready && d13Ready && !d01Ready) {
      blocks.push({
        key: 'd01',
        title: 'D01 待生成',
        detail: 'D05 + D11 + D12 + D13 已齐套，待系统生成 D01 出口退税申报表。',
      });
    }
    return blocks;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-600" />
                Compliance Packets
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                聚焦后半段 D05 / D09 / D10 / D11 / D12 / D13，并联动 D01 的齐套与同步状态
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={loadPackets} disabled={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              {loading ? '刷新中...' : '刷新'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!canEditFinancePacket && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              当前账号为只读视图，财务资料上传、银行交单状态、L/C 不符点与例外放单申请仅允许 Finance / CFO / CEO 操作。
            </div>
          )}
          {packets.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">暂无合规文件包数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Packet</TableHead>
                  <TableHead>CG / Shipment</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>齐套度</TableHead>
                  <TableHead>关键槽位</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packets.map((packet) => {
                  const slotMap = Object.fromEntries((packet.slots || []).map((slot: any) => [slot.docCode, slot]));
                  return (
                    <TableRow key={packet.id}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{packet.packetNo}</div>
                          <div className="text-xs text-gray-500">{packet.cgNo || packet.purchaseOrderId || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Ship className="w-3 h-3" />
                            <span>{packet.shipmentNo || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <DollarSign className="w-3 h-3" />
                            <span>{packet.tradeTerm || '-'} / {packet.currency || 'USD'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PacketBadge value={packet.status || 'draft'} />
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[120px]">
                          <div className="text-xs text-gray-700 mb-1">{packet.docReadyPercent || 0}%</div>
                          <div className="h-2 rounded bg-gray-100 overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${packet.docReadyPercent || 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-1">
                          {['D01', 'D05', 'D09', 'D10', 'D11', 'D12', 'D13'].map((code) => (
                            <div key={code} className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                              <div className="text-[10px] text-gray-500">{slotLabelMap[code]}</div>
                              <div className="mt-1"><PacketBadge value={slotMap[code]?.status || 'pending'} /></div>
                              {slotMap[code]?.currentFile?.fileName && (
                                <>
                                  <div className="mt-1 text-[10px] text-gray-600 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span className="truncate">{slotMap[code].currentFile.fileName}</span>
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-gray-500">
                                    v{slotMap[code].currentFile.versionNo || 1} · {slotMap[code].currentFile.originMode || '-'}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(packet.purchaseOrderId)}
                            disabled={!canEditFinancePacket || !packet.purchaseOrderId || syncingId === packet.purchaseOrderId}
                          >
                            {syncingId === packet.purchaseOrderId ? '同步中...' : '同步后半段'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(packet)}
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            文件包详情
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenUpload(packet, 'D09')}
                            disabled={!canEditFinancePacket || !packet.purchaseOrderId || syncingId === packet.purchaseOrderId}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            上传 D09
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenUpload(packet, 'D11')}
                            disabled={!canEditFinancePacket || !packet.purchaseOrderId || syncingId === packet.purchaseOrderId}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            上传 D11
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenUpload(packet, 'D12')}
                            disabled={!canEditFinancePacket || !packet.purchaseOrderId || syncingId === packet.purchaseOrderId}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            上传 D12
                          </Button>
                          {['D09', 'D11', 'D12', 'D13', 'D01'].some((code) => slotMap[code]?.currentFile?.fileUrl) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="justify-start px-2"
                              onClick={() => {
                                const firstUrl = ['D09', 'D11', 'D12', 'D13', 'D01']
                                  .map((code) => slotMap[code]?.currentFile?.fileUrl)
                                  .find(Boolean);
                                if (firstUrl) window.open(firstUrl, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              查看当前文件
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(uploadDialog)} onOpenChange={(open) => !open && setUploadDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uploadDialog?.docCode === 'D09'
                ? '上传 D09 国际运费资料'
                : uploadDialog?.docCode === 'D11'
                  ? '上传 D11 收汇水单'
                  : '上传 D12 结汇水单'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>文件</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && <div className="text-xs text-gray-500">已选择：{uploadFile.name}</div>}
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                rows={3}
                value={uploadRemarks}
                onChange={(e) => setUploadRemarks(e.target.value)}
                placeholder="例如：银行回单已核对到账、结汇凭证已复核"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(null)}>取消</Button>
            <Button onClick={handleSubmitUpload} disabled={!uploadFile || syncingId === uploadDialog?.packet?.purchaseOrderId}>
              {syncingId === uploadDialog?.packet?.purchaseOrderId ? '上传中...' : '上传并确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailPacket)} onOpenChange={(open) => !open && setDetailPacket(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>合规文件包详情</DialogTitle>
          </DialogHeader>
          {detailPacket && (
            <div className="space-y-4">
              {getBusinessMilestones(detailPacket) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">BL</div>
                    <div className="font-medium text-gray-900 mt-1">{getBusinessMilestones(detailPacket)?.blNo || '-'}</div>
                  </div>
                  <div className="rounded border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">交单状态</div>
                    <div className="font-medium text-gray-900 mt-1">{getBusinessMilestones(detailPacket)?.bankSubmissionStatus || '-'}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatDateTime(getBusinessMilestones(detailPacket)?.bankSubmittedAt)}</div>
                    <div className="text-xs text-gray-500 mt-1">{getBusinessMilestones(detailPacket)?.bankSubmittedBy || '-'}</div>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => openBankStatusDialog(detailPacket)} disabled={!canEditFinancePacket}>
                        维护交单状态
                      </Button>
                    </div>
                  </div>
                  <div className="rounded border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">放单状态</div>
                    <div className="font-medium text-gray-900 mt-1">{getBusinessMilestones(detailPacket)?.documentReleaseStatus || '-'}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatDateTime(getBusinessMilestones(detailPacket)?.documentReleasedAt)}</div>
                    <div className="text-xs text-gray-500 mt-1">{getBusinessMilestones(detailPacket)?.documentReleasedBy || '-'}</div>
                  </div>
                  <div className="rounded border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">财务包状态</div>
                    <div className="font-medium text-gray-900 mt-1">{detailPacket.status} / {detailPacket.docReadyPercent || 0}%</div>
                  </div>
                </div>
              )}

              {getBusinessMilestones(detailPacket)?.collectionRuleLabel === 'L/C' || getBusinessMilestones(detailPacket)?.lcDiscrepancyStatus ? (
                <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-blue-900">L/C 不符点</div>
                      <div className="mt-1 text-blue-800">
                        {[
                          getBusinessMilestones(detailPacket)?.lcDiscrepancyStatus ? `状态：${getBusinessMilestones(detailPacket)?.lcDiscrepancyStatus}` : '状态：none',
                          getBusinessMilestones(detailPacket)?.lcDiscrepancyUpdatedAt ? `更新时间：${formatDateTime(getBusinessMilestones(detailPacket)?.lcDiscrepancyUpdatedAt)}` : null,
                          getBusinessMilestones(detailPacket)?.lcDiscrepancyUpdatedBy ? `更新人：${getBusinessMilestones(detailPacket)?.lcDiscrepancyUpdatedBy}` : null,
                        ].filter(Boolean).join(' · ')}
                      </div>
                      <div className="mt-1 text-xs text-blue-700 whitespace-pre-wrap">
                        {getBusinessMilestones(detailPacket)?.lcDiscrepancyNotes || '暂无不符点备注'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLcDiscrepancyDialog(detailPacket)}
                      disabled={!canEditFinancePacket}
                    >
                      维护 L/C 不符点
                    </Button>
                  </div>
                </div>
              ) : null}

              {getBusinessMilestones(detailPacket)?.releaseBlockedReason ? (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div className="font-medium text-amber-900">D05 放单阻断提示</div>
                  <div className="mt-1 text-amber-800">
                    {[
                      getBusinessMilestones(detailPacket)?.collectionRuleLabel ? `收款规则：${getBusinessMilestones(detailPacket)?.collectionRuleLabel}` : null,
                      getBusinessMilestones(detailPacket)?.releaseBlockedReason,
                    ].filter(Boolean).join(' · ')}
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSubmitReleaseException(detailPacket)}
                      disabled={!canEditFinancePacket || requestingReleaseId === detailPacket.purchaseOrderId}
                    >
                      {requestingReleaseId === detailPacket.purchaseOrderId ? '提交中...' : '提交例外放单申请'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm font-medium text-rose-900 mb-2">阶段阻断 / 不可推进项</div>
                  {getFinanceStageBlocks(detailPacket).length === 0 ? (
                    <div className="text-xs text-emerald-700">当前 D05 / D11 / D12 / D13 / D01 链路无额外阶段阻断</div>
                  ) : (
                    <div className="space-y-2">
                      {getFinanceStageBlocks(detailPacket).map((block) => (
                        <div key={block.key} className="rounded border border-rose-200 bg-white px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">{block.title}</div>
                          <div className="mt-1 text-xs text-gray-600">{block.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-medium text-amber-900 mb-2">待补任务 / 缺失清单</div>
                  {getPendingTasks(detailPacket).length === 0 ? (
                    <div className="text-xs text-emerald-700">当前关键槽位已齐套或不适用</div>
                  ) : (
                    <div className="space-y-2">
                      {getPendingTasks(detailPacket).map((task: any) => (
                        <div key={task.docCode} className="rounded border border-amber-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900">{task.docCode} {task.docName}</div>
                            <PacketBadge value={task.status} />
                          </div>
                          <div className="mt-1 text-xs text-gray-600">{task.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900 mb-2">最小操作日志</div>
                  {getActivityLog(detailPacket).length === 0 ? (
                    <div className="text-xs text-gray-500">暂无日志</div>
                  ) : (
                    <div className="space-y-2">
                      {getActivityLog(detailPacket).map((event: any, index: number) => (
                        <div key={`${event.label}-${event.time}-${index}`} className="rounded border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900">{event.label}</div>
                            <div className="text-[10px] text-gray-500">{formatDateTime(event.time)}</div>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">执行方：{event.actor || '-'}</div>
                          {event.note ? <div className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">{event.note}</div> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded border border-cyan-200 bg-cyan-50 p-4 text-sm">
                <div className="font-medium text-cyan-900">D13 / D01 当前代码现状</div>
                <div className="mt-2 text-cyan-800">
                  D13 与 D01 在现有 ERP 中没有人工上传入口，属于系统自动生成文件。
                </div>
                <div className="mt-1 text-xs text-cyan-700">
                  当前触发路径：财务包同步后，系统依据 D12 自动生成 D13；依据 D05 + D11 + D12 + D13 齐套自动生成 D01。为避免非财务角色触发写库与自动生成，财务包同步现已收紧为仅 Finance / CFO / CEO 可执行。
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Packet</div>
                  <div className="font-medium text-gray-900 mt-1">{detailPacket.packetNo}</div>
                </div>
                <div className="rounded border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">CG</div>
                  <div className="font-medium text-gray-900 mt-1">{detailPacket.cgNo || '-'}</div>
                </div>
                <div className="rounded border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Shipment</div>
                  <div className="font-medium text-gray-900 mt-1">{detailPacket.shipmentNo || '-'}</div>
                </div>
                <div className="rounded border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">状态 / 齐套度</div>
                  <div className="font-medium text-gray-900 mt-1">{detailPacket.status} / {detailPacket.docReadyPercent || 0}%</div>
                </div>
              </div>

              <div className="rounded border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>槽位</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>当前文件</TableHead>
                      <TableHead>来源</TableHead>
                      <TableHead>上传/核验</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detailPacket.slots || [])
                      .filter((slot: any) => ['D01', 'D05', 'D09', 'D10', 'D11', 'D12', 'D13'].includes(slot.docCode))
                      .map((slot: any) => (
                        <TableRow key={slot.id}>
                          <TableCell>
                            <div className="text-sm font-medium text-gray-900">{slot.docCode}</div>
                            <div className="text-xs text-gray-500">{slot.docName || slotLabelMap[slot.docCode] || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <PacketBadge value={slot.status || 'pending'} />
                          </TableCell>
                          <TableCell>
                            {slot.currentFile ? (
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900">{slot.currentFile.fileName}</div>
                                <div className="text-xs text-gray-500">v{slot.currentFile.versionNo || 1} · {slot.currentFile.fileType || '-'}</div>
                                {slot.currentFile.fileUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 justify-start"
                                    onClick={() => window.open(slot.currentFile.fileUrl, '_blank', 'noopener,noreferrer')}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    查看文件
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">暂无当前文件</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>origin: {slot.currentFile?.originMode || slot.sourceType || '-'}</div>
                              <div>portal: {slot.currentFile?.uploadedFromPortal || '-'}</div>
                              <div>uploader: {slot.currentFile?.uploadedByPartyId || slot.confirmedBy || '-'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>上传: {formatDateTime(slot.currentFile?.uploadedAt)}</div>
                              <div>核验: {formatDateTime(slot.currentFile?.verifiedAt || slot.confirmedAt)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-600 whitespace-pre-wrap">
                              {slot.currentFile?.remarks || slot.notes || slot.missingReason || '-'}
                              {slot.missingReason && (
                                <div className="mt-1 text-amber-700">缺失原因：{slot.missingReason}</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailPacket(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(lcDiscrepancyDialog)} onOpenChange={(open) => !open && setLcDiscrepancyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>维护 L/C 不符点</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>状态</Label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={lcDiscrepancyDialog?.status || 'none'}
                onChange={(e) => setLcDiscrepancyDialog((prev) => prev ? ({
                  ...prev,
                  status: e.target.value as 'none' | 'open' | 'resolved',
                }) : prev)}
              >
                <option value="none">none</option>
                <option value="open">open</option>
                <option value="resolved">resolved</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                rows={4}
                value={lcDiscrepancyDialog?.notes || ''}
                onChange={(e) => setLcDiscrepancyDialog((prev) => prev ? ({
                  ...prev,
                  notes: e.target.value,
                }) : prev)}
                placeholder="例如：提单唛头与 L/C 条款不一致，已要求改单"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLcDiscrepancyDialog(null)}>取消</Button>
            <Button
              onClick={handleSaveLcDiscrepancy}
              disabled={!canEditFinancePacket || syncingId === lcDiscrepancyDialog?.packet?.purchaseOrderId}
            >
              {syncingId === lcDiscrepancyDialog?.packet?.purchaseOrderId ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(bankStatusDialog)} onOpenChange={(open) => !open && setBankStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>维护 D05 银行交单状态</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>交单状态</Label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={bankStatusDialog?.status || 'pending_submission'}
                onChange={(e) => setBankStatusDialog((prev) => prev ? ({
                  ...prev,
                  status: e.target.value as 'pending_submission' | 'submitted_to_bank' | 'negotiated' | 'collected',
                }) : prev)}
              >
                <option value="pending_submission">pending_submission</option>
                <option value="submitted_to_bank">submitted_to_bank</option>
                <option value="negotiated">negotiated</option>
                <option value="collected">collected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                rows={3}
                value={bankStatusDialog?.notes || ''}
                onChange={(e) => setBankStatusDialog((prev) => prev ? ({
                  ...prev,
                  notes: e.target.value,
                }) : prev)}
                placeholder="例如：已提交银行审单，等待托收回款/议付结果"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankStatusDialog(null)}>取消</Button>
            <Button
              onClick={handleSaveBankStatus}
              disabled={!canEditFinancePacket || syncingId === bankStatusDialog?.packet?.purchaseOrderId}
            >
              {syncingId === bankStatusDialog?.packet?.purchaseOrderId ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
