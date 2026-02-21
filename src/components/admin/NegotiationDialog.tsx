import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Edit, 
  Send,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Quotation } from './QuotationManagement';
import { toast } from 'sonner@2.0.3';
import { sendNotificationToUser } from '../../contexts/NotificationContext';

interface NegotiationDialogProps {
  open: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onEditQuotation: (quotation: Quotation) => void;
  onSendRevision: (quotation: Quotation, responseMessage: string) => void;
}

export default function NegotiationDialog({
  open,
  onClose,
  quotation,
  onEditQuotation,
  onSendRevision
}: NegotiationDialogProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!quotation || !quotation.customerFeedback) return null;

  const feedback = quotation.customerFeedback;
  const feedbackDate = new Date(feedback.submittedAt).toLocaleString('zh-CN');

  // 处理编辑报价
  const handleEditQuotation = () => {
    onEditQuotation(quotation);
    onClose();
  };

  // 处理发送修订报价
  const handleSendRevision = async () => {
    if (!responseMessage.trim()) {
      toast.error('请输入回复内容');
      return;
    }

    setIsSending(true);

    try {
      // 发送修订报价
      await onSendRevision(quotation, responseMessage);

      // 发送通知给客户
      sendNotificationToUser(quotation.customerEmail, {
        type: 'quotation_sent',
        title: '报价已修订',
        message: `我们已根据您的反馈修订了报价 ${quotation.quotationNumber}`,
        relatedId: quotation.quotationNumber,
        relatedType: 'quotation',
        sender: 'admin@cosun.com',
        metadata: {
          quotationNumber: quotation.quotationNumber,
          customerName: quotation.customerName,
          responseMessage: responseMessage
        }
      });

      toast.success('修订报价已发送', {
        description: '客户将收到通知',
        duration: 3000
      });

      setResponseMessage('');
      onClose();
    } catch (error) {
      toast.error('发送失败', {
        description: '请稍后重试'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            客户反馈处理
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 报价基本信息 */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">报价编号</p>
                <p className="font-semibold text-blue-600">{quotation.quotationNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">客户名称</p>
                <p className="font-semibold">{quotation.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">报价金额</p>
                <p className="font-semibold text-green-600">
                  {quotation.currency} {quotation.totalAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">有效期至</p>
                <p className="font-semibold text-gray-700">{quotation.validUntil}</p>
              </div>
            </div>
          </Card>

          <Separator />

          {/* 客户反馈内容 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold">客户反馈</h3>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {feedback.status === 'negotiating' ? '需要协商' : '已处理'}
              </Badge>
            </div>

            <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{quotation.customerName}</p>
                    <Badge variant="outline" className="h-5 text-[10px] border-gray-300">
                      {feedback.submittedBy}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{feedbackDate}</span>
                  </div>
                </div>
              </div>

              <div className="pl-13 mt-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-amber-200">
                  {feedback.message || '客户未留言'}
                </p>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Admin回复区域 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">处理方案</h3>
            </div>

            <div className="space-y-3">
              {/* 选项1: 修改报价 */}
              <Card className="p-4 border-2 border-blue-100 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-sm">方案一：修改报价内容</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      根据客户反馈调整价格、数量、交期或其他条款
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 ml-4"
                    onClick={handleEditQuotation}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    编辑报价
                  </Button>
                </div>
              </Card>

              {/* 选项2: 发送说明 */}
              <Card className="p-4 border-2 border-green-100 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-sm">方案二：发送说明/回复</h4>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  不修改报价，但向客户说明原因或提供其他解决方案
                </p>

                <Textarea
                  placeholder="输入您的回复内容..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="min-h-[120px] text-sm mb-3"
                />

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSendRevision}
                    disabled={isSending || !responseMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSending ? '发送中...' : '发送回复'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* 修订历史 */}
          {quotation.revisions && quotation.revisions.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold">修订历史</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {quotation.revisions.length} 次修订
                  </Badge>
                </div>

                <div className="space-y-2">
                  {quotation.revisions.map((revision, index) => (
                    <Card key={index} className="p-3 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-gray-200 text-gray-700 h-6 px-2">
                          V{revision.revisionNumber}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">{revision.revisedBy}</span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(revision.revisedAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">修订原因：</span>
                            {revision.reason}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">变更内容：</span>
                            {revision.changes}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            稍后处理
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
