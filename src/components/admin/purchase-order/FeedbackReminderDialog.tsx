import React from 'react';
import { AlertCircle, Calculator, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';

interface FeedbackReminderDialogProps {
  acceptedQuotationNo: string;
  onClose: () => void;
  onNavigateToRequirements: () => void;
}

export const FeedbackReminderDialog: React.FC<FeedbackReminderDialogProps> = ({
  acceptedQuotationNo,
  onClose,
  onNavigateToRequirements,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        {/* 标题 */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-base">✅ 已接受供应商报价</p>
            <p className="text-sm text-gray-500 mt-0.5">报价单号：{acceptedQuotationNo}</p>
          </div>
        </div>

        {/* 提醒内容 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-amber-800">⚠️ 请记得反馈成本价给业务员</p>
            <p className="text-sm text-amber-700">
              接受报价后，业务员还不知道采购成本，请前往
              <span className="font-semibold text-amber-900">「报价请求池」</span>
              找到对应需求，点击
              <span className="font-semibold text-amber-900">「智能反馈」</span>
              按钮，将供应商报价成本一键反馈给业务员，以便其制作销售报价单。
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 justify-end pt-1">
          <Button
            variant="outline"
            className="text-gray-600"
            onClick={onClose}
          >
            稍后处理
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            onClick={onNavigateToRequirements}
          >
            <Calculator className="w-4 h-4" />
            立即前往报价请求池
          </Button>
        </div>
      </div>
    </div>
  );
};
