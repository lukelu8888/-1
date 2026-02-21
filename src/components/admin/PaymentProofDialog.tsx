import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { FileText, Download, Calendar, DollarSign, Hash, FileCheck, X, Eye, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { resolveBackendPublicUrl } from '../../api/backend-auth';

interface PaymentProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function PaymentProofDialog({ open, onOpenChange, order }: PaymentProofDialogProps) {
  const [imageZoom, setImageZoom] = useState(100);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!order || !order.depositPaymentProof) return null;

  const proof = order.depositPaymentProof;
  const resolvedFileUrl = resolveBackendPublicUrl(proof.fileUrl);
  const uploadDate = new Date(proof.uploadedAt).toLocaleString('zh-CN');
  
  // 判断文件类型
  const fileExtension = proof.fileName?.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
  const isPDF = fileExtension === 'pdf';

  // 下载文件函数
  const handleDownload = () => {
    if (resolvedFileUrl) {
      // 创建一个隐藏的<a>标签来触发下载
      const link = document.createElement('a');
      link.href = resolvedFileUrl;
      link.download = proof.fileName || 'payment_proof';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('下载成功', {
        description: `已开始下载 ${proof.fileName}`,
        duration: 3000
      });
    } else {
      toast.error('下载失败', {
        description: '未找到文件URL',
        duration: 3000
      });
    }
  };

  // 在新窗口打开文件
  const handleViewInNewWindow = () => {
    if (resolvedFileUrl) {
      window.open(resolvedFileUrl, '_blank');
      toast.success('已在新窗口打开', {
        description: proof.fileName,
        duration: 2000
      });
    } else {
      toast.error('打开失败', {
        description: '未找到文件URL',
        duration: 3000
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-600" />
            付款凭证详情 Payment Proof Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            订单号 Order: {order.orderNumber || order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息卡片 */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  付款金额 Payment Amount
                </div>
                <div className="text-base font-bold text-purple-700">
                  {proof.currency || 'USD'} {proof.amount?.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  上传时间 Upload Time
                </div>
                <div className="text-sm text-gray-900">
                  {uploadDate}
                </div>
              </div>
            </div>
          </Card>

          {/* 🔥 图片预览区域 - 如果是图片文件 */}
          {isImage && resolvedFileUrl && (
            <Card className="p-4 border-blue-200 bg-blue-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  付款凭证图片预览 Image Preview
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setImageZoom(Math.max(50, imageZoom - 25))}
                    disabled={imageZoom <= 50}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-gray-600 w-12 text-center">{imageZoom}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                    disabled={imageZoom >= 200}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowFullImage(true)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    全屏查看
                  </Button>
                </div>
              </div>
              
              {/* 图片预览容器 */}
              <div className="bg-white rounded-lg border-2 border-gray-300 p-4 overflow-auto max-h-96 flex items-center justify-center">
                <img
                  src={resolvedFileUrl}
                  alt={proof.fileName}
                  style={{ 
                    width: `${imageZoom}%`,
                    maxWidth: 'none',
                    height: 'auto',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowFullImage(true)}
                  className="rounded shadow-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 点击图片或"全屏查看"按钮可以查看大图
              </p>
            </Card>
          )}

          {/* PDF预览提示 */}
          {isPDF && resolvedFileUrl && (
            <Card className="p-4 border-orange-200 bg-orange-50/30">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">PDF文档</p>
                  <p className="text-xs text-gray-600">点击"在新窗口打开"查看完整PDF文档</p>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-orange-600 hover:bg-orange-700"
                  onClick={handleViewInNewWindow}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  在新窗口打开
                </Button>
              </div>
            </Card>
          )}

          {/* 详细信息 */}
          <Card className="p-4 border-gray-200">
            <div className="space-y-3">
              {/* 付款水单号 */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  付款参考号 Payment Reference
                </div>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {proof.notes?.match(/Payment Reference: ([^.]+)/)?.[1] || 'N/A'}
                </div>
              </div>

              {/* 上传人 */}
              <div>
                <div className="text-xs text-gray-600 mb-1.5">
                  上传人 Uploaded By
                </div>
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {proof.uploadedBy}
                </div>
              </div>

              {/* 备注 */}
              {proof.notes && (
                <div>
                  <div className="text-xs text-gray-600 mb-1.5">
                    备注 Notes
                  </div>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200 whitespace-pre-wrap">
                    {proof.notes}
                  </div>
                </div>
              )}

              {/* 附件文件 */}
              {proof.fileName && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    附件文件 Attachment
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                    {isImage ? (
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                    <button
                      onClick={handleViewInNewWindow}
                      className="text-sm text-blue-700 flex-1 text-left hover:underline cursor-pointer"
                    >
                      {proof.fileName}
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-blue-100"
                      onClick={handleDownload}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 订单信息 */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h4 className="text-xs text-gray-700 mb-2">订单信息 Order Information</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">订单号:</span>
                <span className="ml-2 text-gray-900">{order.orderNumber || order.id}</span>
              </div>
              <div>
                <span className="text-gray-600">客户:</span>
                <span className="ml-2 text-gray-900">{order.customer}</span>
              </div>
              <div>
                <span className="text-gray-600">订单金额:</span>
                <span className="ml-2 text-gray-900">{order.currency || 'USD'} {order.totalAmount?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">报价单号:</span>
                <span className="ml-2 text-gray-900">{order.quotationNumber || 'N/A'}</span>
              </div>
            </div>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-between gap-2 pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              {resolvedFileUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleViewInNewWindow}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  在新窗口打开
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                关闭
              </Button>
              {resolvedFileUrl && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  下载凭证
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 🔥 全屏图片查看Dialog */}
      {showFullImage && isImage && resolvedFileUrl && (
        <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {proof.fileName}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={handleDownload}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    下载
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowFullImage(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="bg-gray-900 rounded-lg overflow-auto flex items-center justify-center" style={{ maxHeight: 'calc(95vh - 80px)' }}>
              <img
                src={resolvedFileUrl}
                alt={proof.fileName}
                className="max-w-full max-h-full object-contain"
                style={{ minHeight: '400px' }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
