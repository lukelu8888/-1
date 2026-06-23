import React from 'react';
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Clock,
  Eye,
  FileCheck,
  Upload,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

type ProofType = 'depositPayment' | 'depositReceipt' | 'balancePayment' | 'balanceReceipt';

interface ReceivableProofCellProps {
  order: any;
  proofType: ProofType;
  onView: (order: any, proof: any, proofType: ProofType) => void;
  onUpload: (order: any, proofType: 'depositReceipt' | 'balanceReceipt') => void;
}

function formatDisplayDate(value?: string | null) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('zh-CN');
}

export function ReceivableProofCell({
  order,
  proofType,
  onView,
  onUpload,
}: ReceivableProofCellProps) {
  const isPayment = proofType.includes('Payment');
  const isDeposit = proofType.includes('deposit');
  const proofField = isPayment
    ? (isDeposit ? 'depositPaymentProof' : 'balancePaymentProof')
    : (isDeposit ? 'depositReceiptProof' : 'balanceReceiptProof');
  const proof = order[proofField];

  if (isPayment) {
    if (!proof) {
      return (
        <div className="space-y-1.5">
          <Badge className="h-5 px-2 text-xs bg-gray-100 text-gray-500 border-gray-300 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            待客户上传
          </Badge>
          <div className="text-[10px] text-gray-400">客户尚未上传付款凭证</div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge className="h-5 px-2 text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 w-fit">
            <FileCheck className="h-3 w-3" />
            已上传
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(order, proof, proofType)}
            className="h-5 w-5 p-0 hover:bg-blue-50"
            title="查看客户付款凭证"
          >
            <Eye className="h-3 w-3 text-blue-600" />
          </Button>
        </div>
        <div className="text-[11px] font-semibold text-gray-900">
          {order.currency} {proof.amount?.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-500">{formatDisplayDate(proof.uploadedAt)}</div>
      </div>
    );
  }

  const paymentProofField = isDeposit ? 'depositPaymentProof' : 'balancePaymentProof';
  const paymentProof = order[paymentProofField];
  const stageLabel = isDeposit
    ? order.statusSnapshot?.depositStageLabel
    : order.statusSnapshot?.balanceStageLabel;

  if (isDeposit && stageLabel === '无需定金') {
    return (
      <div className="space-y-1.5">
        <Badge className="h-5 px-2 text-xs bg-slate-100 text-slate-500 border-slate-300 flex items-center gap-1 w-fit">
          <CheckSquare className="h-3 w-3" />
          无需定金
        </Badge>
        <div className="text-[10px] text-slate-400">当前付款方式无需定金</div>
      </div>
    );
  }

  if (stageLabel === '已结清' || stageLabel === '余款已确认到账' || stageLabel === '定金已确认到账') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge className="h-5 px-2 text-xs bg-green-100 text-green-700 border-green-300 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            {stageLabel === '已结清' ? '已结清' : '已确认'}
          </Badge>
          {proof ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView(order, proof, proofType)}
              className="h-5 w-5 p-0 hover:bg-blue-50"
              title="查看财务收款凭证"
            >
              <Eye className="h-3 w-3 text-blue-600" />
            </Button>
          ) : null}
        </div>
        <div className="text-[11px] font-semibold text-green-700">
          {proof?.actualAmount ? `${order.currency} ${proof.actualAmount.toLocaleString()}` : stageLabel}
        </div>
        <div className="text-[10px] text-gray-500">
          {proof?.receiptDate ? formatDisplayDate(proof.receiptDate) : '无需跟进'}
        </div>
      </div>
    );
  }

  if (!paymentProof) {
    return (
      <div className="space-y-1.5">
        <Badge className="h-5 px-2 text-xs bg-gray-50 text-gray-400 border-gray-200 flex items-center gap-1 w-fit">
          <Clock className="h-3 w-3" />
          {stageLabel || '等待客户付款'}
        </Badge>
        <div className="text-[10px] text-gray-400">
          {stageLabel === '等待定金完成' ? '请先完成定金流程' : stageLabel || '客户需先上传付款凭证'}
        </div>
      </div>
    );
  }

  if (!proof) {
    const pendingLabel = isDeposit ? '待财务确认定金到账' : '待财务确认余款到账';
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge className="h-5 px-2 text-xs bg-yellow-100 text-yellow-700 border-yellow-300 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            {stageLabel === pendingLabel ? '待确认' : stageLabel || '待上传'}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpload(order, proofType as 'depositReceipt' | 'balanceReceipt')}
            className="h-5 w-5 p-0 hover:bg-green-50"
            title={stageLabel === pendingLabel ? '录入财务收款凭证' : '上传财务收款凭证'}
          >
            <Upload className="h-3 w-3 text-green-600" />
          </Button>
        </div>
        <div className="text-[10px] text-gray-600">
          {stageLabel === pendingLabel ? '待财务确认到账' : stageLabel || '请上传收款凭证'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge className="h-5 px-2 text-xs bg-green-100 text-green-700 border-green-300 flex items-center gap-1 w-fit">
          <CheckCircle className="h-3 w-3" />
          已上传
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onView(order, proof, proofType)}
          className="h-5 w-5 p-0 hover:bg-blue-50"
          title="查看财务收款凭证"
        >
          <Eye className="h-3 w-3 text-blue-600" />
        </Button>
      </div>
      <div className="text-[11px] font-semibold text-green-700">
        {order.currency} {proof.actualAmount?.toLocaleString()}
      </div>
      <div className="text-[10px] text-gray-500">{formatDisplayDate(proof.receiptDate)}</div>
    </div>
  );
}
