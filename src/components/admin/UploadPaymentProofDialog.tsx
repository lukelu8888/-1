import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Upload, FileText, Image as ImageIcon, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { paymentProofStorage } from '../../lib/storageService';

interface UploadPaymentProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onUploadSuccess: (proofData: any) => void;
  proofType?: 'deposit' | 'balance'; // 定金凭证或余款凭证
}

export function UploadPaymentProofDialog({ 
  open, 
  onOpenChange, 
  order,
  onUploadSuccess,
  proofType = 'deposit'
}: UploadPaymentProofDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [formData, setFormData] = useState({
    amount: proofType === 'deposit' ? (order?.totalAmount * 0.3 || 0) : (order?.totalAmount * 0.7 || 0),
    currency: order?.currency || 'USD',
    paymentReference: '',
    notes: ''
  });

  // 🔥 调试：监控selectedFile状态变化
  React.useEffect(() => {
    console.log('🔍 selectedFile状态变化:', selectedFile ? selectedFile.name : 'null');
    console.log('  - 确认上传按钮是否禁用:', uploading || !selectedFile);
  }, [selectedFile, uploading]);

  // 🔥 当Dialog打开时，重置所有状态
  React.useEffect(() => {
    if (open) {
      console.log('🔄 Dialog打开，重置所有状态');
      setSelectedFile(null);
      setPreviewUrl('');
      setUploading(false);
      setFormData({
        amount: proofType === 'deposit' ? (order?.totalAmount * 0.3 || 0) : (order?.totalAmount * 0.7 || 0),
        currency: order?.currency || 'USD',
        paymentReference: '',
        notes: ''
      });
      console.log('  ✅ 状态已重置');
    }
  }, [open, order, proofType]);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 ========================================');
    console.log('📁 文件选择事件触发');
    console.log('📁 ========================================');
    
    const file = event.target.files?.[0];
    console.log('  - 选择的文件:', file);
    
    if (file) {
      console.log('  - 文件名:', file.name);
      console.log('  - 文件类型:', file.type);
      console.log('  - 文件大小:', (file.size / 1024).toFixed(2), 'KB');
      
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        console.error('  ❌ 文件类型不支持:', file.type);
        toast.error('文件格式不支持', {
          description: '请上传 JPG, PNG, GIF 或 PDF 格式的文件',
          duration: 3000
        });
        return;
      }
      console.log('  ✅ 文件类型验证通过');

      // 验证文件大小（最大10MB）
      if (file.size > 10 * 1024 * 1024) {
        console.error('  ❌ 文件过大:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        toast.error('文件过大', {
          description: '文件大小不能超过 10MB',
          duration: 3000
        });
        return;
      }
      console.log('  ✅ 文件大小验证通过');

      console.log('  📝 设置selectedFile状态...');
      setSelectedFile(file);
      console.log('  ✅ selectedFile已设置');

      // 如果是图片，生成预览
      if (file.type.startsWith('image/')) {
        console.log('  🖼️ 正在生成图片预览...');
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setPreviewUrl(url);
          console.log('  ✅ 图片预览URL已生成, 长度:', url.length);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('  📄 PDF文件，不生成预览');
        setPreviewUrl(''); // PDF不预览
      }

      toast.success('✅ 文件已选择', {
        description: file.name,
        duration: 2000
      });
      
      console.log('  ✅ ✅ ✅ 文件选择完成！');
    } else {
      console.warn('  ⚠️ 没有选择文件');
    }
    
    console.log('📁 ========================================\n');
  };

  // 处理上传（真实上传到 Supabase Storage）
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请选择文件', { description: '请先选择要上传的付款凭证文件', duration: 3000 });
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error('请输入付款金额', { description: '付款金额必须大于0', duration: 3000 });
      return;
    }

    setUploading(true);
    setUploadProgress('正在上传到云存储...');

    try {
      const result = await paymentProofStorage.upload(
        selectedFile,
        order?.orderNumber || order?.id || 'unknown',
        proofType,
        order?.customer || 'admin'
      );

      setUploadProgress('上传成功！');

      const proofData = {
        uploadedAt: new Date().toISOString(),
        uploadedBy: order?.customer || 'Admin',
        fileUrl: result.url,
        storagePath: result.path,
        fileName: result.fileName,
        fileSize: result.fileSize,
        amount: parseFloat(formData.amount.toString()),
        currency: formData.currency,
        notes: `Payment Reference: ${formData.paymentReference || 'N/A'}. ${formData.notes || ''}`
      };

      onUploadSuccess(proofData);

      toast.success('✅ 上传成功！', {
        description: `${proofType === 'deposit' ? '定金' : '余款'}凭证已上传至云存储`,
        duration: 3000
      });

      // 重置表单
      setSelectedFile(null);
      setPreviewUrl('');
      setUploadProgress('');
      setFormData({
        amount: proofType === 'deposit' ? (order?.totalAmount * 0.3 || 0) : (order?.totalAmount * 0.7 || 0),
        currency: order?.currency || 'USD',
        paymentReference: '',
        notes: ''
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error('上传失败', { description: err?.message || '请重试或联系管理员', duration: 4000 });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            上传{proofType === 'deposit' ? '定金' : '余款'}付款凭证
          </DialogTitle>
          <DialogDescription className="text-sm">
            订单号: {order.orderNumber || order.id} | 客户: {order.customer}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 订单信息卡片 */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-600 mb-1">订单总额</p>
                <p className="text-base text-blue-700">
                  {order.currency || 'USD'} {order.totalAmount?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">
                  {proofType === 'deposit' ? '定金金额 (30%)' : '余款金额 (70%)'}
                </p>
                <p className="text-base text-blue-700">
                  {order.currency || 'USD'} {(order.totalAmount * (proofType === 'deposit' ? 0.3 : 0.7)).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* 文件上传区域 */}
          <Card className="p-4 border-dashed border-2 border-gray-300 bg-gray-50">
            <div className="text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  {selectedFile ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-900 mb-1">
                    {selectedFile ? (
                      <span className="text-green-600 flex items-center gap-1 justify-center">
                        <CheckCircle className="w-4 h-4" />
                        {selectedFile.name}
                      </span>
                    ) : (
                      '点击选择文件或拖拽文件到此处'
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    支持 JPG, PNG, GIF, PDF 格式，最大 10MB
                  </p>
                </div>
              </label>
            </div>

            {/* 图片预览 */}
            {previewUrl && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  预览
                </p>
                <div className="bg-white rounded-lg border p-2 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-h-48 rounded"
                  />
                </div>
              </div>
            )}

            {/* PDF提示 */}
            {selectedFile && selectedFile.type === 'application/pdf' && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded">
                  <FileText className="w-5 h-5" />
                  <span>已选择PDF文件，上传后可在凭证详情中查看</span>
                </div>
              </div>
            )}
          </Card>

          {/* 付款信息表单 */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 mb-1.5 block flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  付款金额 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="h-9 text-xs"
                  placeholder="请输入付款金额"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 mb-1.5 block">
                  币种
                </label>
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="h-9 text-xs"
                  placeholder="USD"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-700 mb-1.5 block">
                付款参考号 / 水单号
              </label>
              <Input
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                className="h-9 text-xs"
                placeholder="请输入银行水单号或交易参考号"
              />
            </div>

            <div>
              <label className="text-xs text-gray-700 mb-1.5 block">
                备注说明（可选）
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs min-h-[60px]"
                placeholder="输入其他说明信息..."
              />
            </div>
          </div>

          {/* 温馨提示 */}
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-medium">温馨提示：</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>请确保上传的付款凭证清晰可见</li>
                  <li>付款金额应与实际支付金额一致</li>
                  <li>建议填写银行水单号便于后续核对</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs bg-orange-500 hover:bg-orange-600"
              onClick={() => void handleUpload()}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  {uploadProgress || '上传中...'}
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  确认上传
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}