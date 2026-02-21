// 📊 单证管理矩阵视图 - Document Management Matrix
// 一个萝卜一个坑的表格式单证管理系统

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Download, Eye, CheckCircle2, Clock, XCircle,
  AlertTriangle, FileCheck, Package, Ship, DollarSign, RefreshCw, Mail,
  X, Send, Paperclip
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface DocumentMatrixViewProps {
  onBack?: () => void;
}

// 文档预览对话框
interface DocumentPreviewDialogProps {
  doc: any;
  onClose: () => void;
}

function DocumentPreviewDialog({ doc, onClose }: DocumentPreviewDialogProps) {
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // 模拟PDF总页数
  
  // 判断文件类型
  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
    return 'other';
  };
  
  const fileType = getFileType(doc.fileName);
  
  // 模拟PDF内容
  const renderPDFPreview = () => (
    <div className="w-full h-full flex flex-col items-center bg-gray-800 overflow-auto p-4">
      <div 
        className="bg-white shadow-2xl mb-4 p-8 rounded"
        style={{ 
          width: `${21 * 30 * scale}px`, 
          minHeight: `${29.7 * 30 * scale}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center'
        }}
      >
        {/* 模拟PDF页面内容 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-gray-900 pb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SALES CONTRACT</h1>
              <p className="text-sm text-gray-600">销售合同</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Contract No.</p>
              <p className="text-sm font-bold">{doc.orderId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-gray-700">Seller 卖方:</p>
              <p>福建高盛达富建材有限公司</p>
              <p>Fujian Gaoshengdafu Building Materials Co., Ltd.</p>
              <p className="mt-2 text-gray-600">Address: Fujian, China</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Buyer 买方:</p>
              <p>ABC Trading Company</p>
              <p className="mt-2 text-gray-600">Address: New York, USA</p>
            </div>
          </div>
          
          <table className="w-full text-xs border border-gray-300 mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-1">No.</th>
                <th className="border border-gray-300 px-2 py-1">Description</th>
                <th className="border border-gray-300 px-2 py-1">Qty</th>
                <th className="border border-gray-300 px-2 py-1">Unit Price</th>
                <th className="border border-gray-300 px-2 py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-center">1</td>
                <td className="border border-gray-300 px-2 py-1">Door Hinges 门铰链</td>
                <td className="border border-gray-300 px-2 py-1 text-center">5000 pcs</td>
                <td className="border border-gray-300 px-2 py-1 text-right">$2.50</td>
                <td className="border border-gray-300 px-2 py-1 text-right">$12,500.00</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-1 text-center">2</td>
                <td className="border border-gray-300 px-2 py-1">Window Locks 窗锁</td>
                <td className="border border-gray-300 px-2 py-1 text-center">3000 pcs</td>
                <td className="border border-gray-300 px-2 py-1 text-right">$3.80</td>
                <td className="border border-gray-300 px-2 py-1 text-right">$11,400.00</td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-300 px-2 py-1 text-right font-bold">Total:</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-bold">$23,900.00</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-4 text-xs space-y-2">
            <p><span className="font-bold">Payment Terms:</span> 30% deposit, 70% before shipment</p>
            <p><span className="font-bold">Delivery Time:</span> 30 days after deposit</p>
            <p><span className="font-bold">Port of Loading:</span> Xiamen, China</p>
            <p><span className="font-bold">Destination:</span> New York, USA</p>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4 text-xs">
            <div className="border-t border-gray-400 pt-2">
              <p className="font-bold">Seller Signature</p>
              <p className="text-gray-500 mt-4">___________________</p>
              <p className="text-gray-500">Date: {doc.uploadDate}</p>
            </div>
            <div className="border-t border-gray-400 pt-2">
              <p className="font-bold">Buyer Signature</p>
              <p className="text-gray-500 mt-4">___________________</p>
              <p className="text-gray-500">Date: ___________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[95%] h-[95%] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-bold text-gray-900">{doc.fileName}</h3>
              <p className="text-xs text-gray-500">
                订单号: {doc.orderId} · 大小: {doc.size} · 上传: {doc.uploadDate}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-50">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          <div className="flex items-center gap-2">
            {fileType === 'pdf' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            >
              <span className="text-lg">-</span>
            </Button>
            <span className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setScale(Math.min(2, scale + 0.1))}
            >
              <span className="text-lg">+</span>
            </Button>
          </div>
        </div>
        
        {/* 预览区域 */}
        <div className="flex-1 overflow-auto">
          {fileType === 'pdf' ? (
            renderPDFPreview()
          ) : fileType === 'image' ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 p-4">
              <img 
                src="https://images.unsplash.com/photo-1568667256549-094345857637?w=800" 
                alt={doc.fileName}
                style={{ transform: `scale(${scale})` }}
                className="max-w-full max-h-full object-contain rounded shadow-2xl"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">暂不支持预览此文件格式</p>
                <p className="text-xs text-gray-500 mt-2">{doc.fileName}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 底部操作 */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            💡 提示：使用鼠标滚轮可以缩放预览
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              下载原文件
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              替换文件
            </Button>
            <Button size="sm" onClick={onClose} style={{ backgroundColor: '#F96302' }}>
              关闭预览
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 文件上传对话框
interface FileUploadDialogProps {
  docType: string;
  docName: string;
  orderId: string;
  onClose: () => void;
  onUpload: (file: File) => void;
}

function FileUploadDialog({ docType, docName, orderId, onClose, onUpload }: FileUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[500px]" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-bold text-gray-900">上传单证</h3>
            <p className="text-xs text-gray-500">{docType} - {docName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 内容 */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-xs text-gray-700 mb-2">订单号</label>
            <input 
              type="text" 
              value={orderId} 
              disabled 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-xs text-gray-700 mb-2">选择文件</label>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              {selectedFile ? (
                <div>
                  <Paperclip className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">点击选择文件或拖拽文件到这里</p>
                  <p className="text-xs text-gray-500 mt-1">支持 PDF, JPG, PNG 格式</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button 
            size="sm" 
            onClick={handleUpload}
            disabled={!selectedFile}
            style={{ backgroundColor: '#F96302' }}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            确认上传
          </Button>
        </div>
      </div>
    </div>
  );
}

// 邮报对话框
interface EmailDialogProps {
  selectedDocs: {orderId: string, docId: string, doc: any}[];
  onClose: () => void;
  onSend: (emails: string[], subject: string, message: string) => void;
}

function EmailDialog({ selectedDocs, onClose, onSend }: EmailDialogProps) {
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('外贸单证文件');
  const [message, setMessage] = useState('您好，\n\n附件为本次交易的相关单证文件，请查收。\n\n此致\n敬礼');
  
  const handleSend = () => {
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    onSend(emailList, subject, message);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[600px]" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-bold text-gray-900">邮报单证</h3>
            <p className="text-xs text-gray-500">已选择 {selectedDocs.length} 个单证</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-700 mb-1">收件人邮箱（多个邮箱用逗号分隔）</label>
            <input 
              type="text" 
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="example@email.com, another@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-700 mb-1">邮件主题</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-700 mb-1">邮件正文</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-700 mb-2">📎 附件列表：</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedDocs.map((item, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  <span>{item.doc.fileName}</span>
                  <span className="text-gray-400">({item.doc.size})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button 
            size="sm" 
            onClick={handleSend}
            disabled={!emails.trim()}
            style={{ backgroundColor: '#F96302' }}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            发送邮件
          </Button>
        </div>
      </div>
    </div>
  );
}

// 业务阶段和单证类型映射
const BUSINESS_STAGES = [
  {
    id: 'contract',
    name: '合同阶段',
    color: '#3B82F6',
    documents: [
      { id: 'D02', code: 'D02', name: '销售合同/发票' },
      { id: 'D07', code: 'D07', name: '采购发票凭证' },
    ]
  },
  {
    id: 'domestic_transport',
    name: '国内运输',
    color: '#8B5CF6',
    documents: [
      { id: 'D03', code: 'D03', name: '国内运输单据' },
      { id: 'D04', code: 'D04', name: '国内运费免责' },
    ]
  },
  {
    id: 'customs',
    name: '报关出口',
    color: '#F59E0B',
    documents: [
      { id: 'D05', code: 'D05', name: '报关单/提运单' },
      { id: 'D06', code: 'D06', name: '报关合同费用' },
      { id: 'D08', code: 'D08', name: '报关费用免责' },
    ]
  },
  {
    id: 'international_shipping',
    name: '国际运输',
    color: '#10B981',
    documents: [
      { id: 'D09', code: 'D09', name: '国际运费发票' },
      { id: 'D10', code: 'D10', name: '国际运费免责' },
    ]
  },
  {
    id: 'forex',
    name: '收汇结汇',
    color: '#EC4899',
    documents: [
      { id: 'D11', code: 'D11', name: '收汇水单' },
      { id: 'D12', code: 'D12', name: '结汇水单' },
    ]
  },
  {
    id: 'tax_refund',
    name: '退税阶段',
    color: '#EF4444',
    documents: [
      { id: 'D01', code: 'D01', name: '退税申报表' },
      { id: 'D13', code: 'D13', name: '退税收汇凭证' },
    ]
  },
];

// 模拟订单数据
const MOCK_ORDERS = [
  {
    orderId: 'SO-NA-20251201-001',
    contractNo: 'SC-NA-20251201-001',
    customer: 'Home Depot Inc.',
    customerId: 'C-NA-001',
    region: 'North America',
    totalValue: 125000,
    currency: 'USD',
    documents: {
      'D01': { fileName: 'Tax_Refund_001.pdf', size: '1.2MB', uploadDate: '2025-12-20', status: 'approved' },
      'D02': { fileName: 'SC-NA-20251201-001.pdf', size: '2.1MB', uploadDate: '2025-12-01', status: 'approved' },
      'D03': { fileName: 'Domestic_Transport_001.pdf', size: '1.5MB', uploadDate: '2025-12-10', status: 'approved' },
      'D04': { fileName: 'Domestic_Waiver_001.pdf', size: '450KB', uploadDate: '2025-12-10', status: 'approved' },
      'D05': { fileName: 'Customs_Declaration_001.pdf', size: '2.8MB', uploadDate: '2025-12-15', status: 'approved' },
      'D06': { fileName: 'Customs_Contract_001.pdf', size: '1.2MB', uploadDate: '2025-12-15', status: 'approved' },
      'D07': { fileName: 'Purchase_Invoice_001.pdf', size: '2.1MB', uploadDate: '2025-12-06', status: 'approved' },
      'D08': { fileName: 'Customs_Waiver_001.pdf', size: '380KB', uploadDate: '2025-12-15', status: 'approved' },
      'D09': { fileName: 'Intl_Freight_001.pdf', size: '890KB', uploadDate: '2025-12-18', status: 'approved' },
      'D10': { fileName: 'Intl_Waiver_001.pdf', size: '320KB', uploadDate: '2025-12-18', status: 'approved' },
      'D11': { fileName: 'FX_Receipt_001.jpg', size: '890KB', uploadDate: '2025-12-28', status: 'approved' },
      'D12': { fileName: 'FX_Settlement_001.jpg', size: '750KB', uploadDate: '2026-01-02', status: 'approved' },
      'D13': { fileName: 'Tax_FX_Certificate_001.pdf', size: '650KB', uploadDate: '2026-01-05', status: 'approved' },
    }
  },
  {
    orderId: 'SO-NA-20251210-005',
    contractNo: 'SC-NA-20251210-005',
    customer: 'Lowe\'s Inc.',
    customerId: 'C-NA-005',
    region: 'North America',
    totalValue: 89500,
    currency: 'USD',
    documents: {
      'D02': { fileName: 'SC-NA-20251210-005.pdf', size: '2.2MB', uploadDate: '2025-12-10', status: 'pending' },
      'D05': { fileName: 'Customs_Declaration_005.pdf', size: '2.5MB', uploadDate: '2025-12-18', status: 'pending' },
      'D07': { fileName: 'Purchase_Invoice_005.pdf', size: '1.9MB', uploadDate: '2025-12-12', status: 'pending' },
    }
  },
  {
    orderId: 'SO-EU-20251120-007',
    contractNo: 'SC-EU-20251120-007',
    customer: 'Decathlon SA',
    customerId: 'C-EU-007',
    region: 'Europe',
    totalValue: 56000,
    currency: 'EUR',
    documents: {
      'D02': { fileName: 'SC-EU-20251120-007.pdf', size: '1.8MB', uploadDate: '2025-11-20', status: 'approved' },
      'D05': { 
        fileName: 'Customs_Declaration_007.pdf', 
        size: '2.3MB', 
        uploadDate: '2025-11-28', 
        status: 'rejected',
        rejectionReasons: ['海关编码错误（应为：8536.69.00）', '合同号与销售合同不一致', '缺少报关员签章'],
        rejectedBy: '张单证员',
        rejectedAt: '2025-11-29 10:30'
      },
      'D07': { 
        fileName: 'Purchase_Invoice_007.pdf', 
        size: '2.0MB', 
        uploadDate: '2025-11-22', 
        status: 'rejected',
        rejectionReasons: ['供应商名称拼写错误', '扫描件倾斜，建议重新扫描'],
        rejectedBy: '李审核员',
        rejectedAt: '2025-11-23 14:15'
      },
      'D11': { 
        fileName: 'FX_Receipt_007.jpg', 
        size: '650KB', 
        uploadDate: '2025-12-05', 
        status: 'rejected',
        rejectionReasons: ['收汇金额与合同金额不符（应为EUR 56,000）', '缺少银行盖章'],
        rejectedBy: '王财务',
        rejectedAt: '2025-12-06 09:20'
      },
    }
  },
];

export function DocumentMatrixView({ onBack }: DocumentMatrixViewProps) {
  const [selectedDocs, setSelectedDocs] = useState<{[orderId: string]: string[]}>({});
  const [activeMenu, setActiveMenu] = useState<{orderId: string, docId: string} | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [uploadDialog, setUploadDialog] = useState<{orderId: string, docType: string, docName: string} | null>(null);
  const [emailDialog, setEmailDialog] = useState<boolean>(false);
  const [orders, setOrders] = useState(MOCK_ORDERS);

  // 点击页面其他地方关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在操作菜单或单证图标之外
      const target = event.target as HTMLElement;
      if (!target.closest('.doc-menu-trigger') && !target.closest('.doc-menu')) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

  // 计算总共选中了多少个文档
  const getTotalSelectedCount = () => {
    return Object.values(selectedDocs).reduce((total, docs) => total + docs.length, 0);
  };

  // 获取所有选中的单证详情
  const getSelectedDocDetails = () => {
    const details: {orderId: string, docId: string, doc: any}[] = [];
    Object.entries(selectedDocs).forEach(([orderId, docIds]) => {
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        docIds.forEach(docId => {
          const doc = order.documents[docId];
          if (doc) {
            details.push({ orderId, docId, doc });
          }
        });
      }
    });
    return details;
  };

  // 查看单个单证
  const handleViewDoc = (orderId: string, docId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (order && order.documents[docId]) {
      setPreviewDoc({ ...order.documents[docId], orderId, docId });
    }
  };

  // 批量查看
  const handleBatchView = () => {
    const details = getSelectedDocDetails();
    if (details.length > 0) {
      // 这里简化为查看第一个
      setPreviewDoc({ ...details[0].doc, orderId: details[0].orderId, docId: details[0].docId });
    }
  };

  // 下载单个单证
  const handleDownloadDoc = (orderId: string, docId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (order && order.documents[docId]) {
      const doc = order.documents[docId];
      alert(`正在下载: ${doc.fileName} (${doc.size})`);
      // 实际应用中这里会触发文件下载
      console.log('Download:', doc.fileName);
    }
  };

  // 批量下载
  const handleBatchDownload = () => {
    const details = getSelectedDocDetails();
    if (details.length > 0) {
      alert(`正在打包下载 ${details.length} 个单证:\n${details.map(d => d.doc.fileName).join('\n')}`);
      // 实际应用中这里会打包下载所有选中的文件
      console.log('Batch download:', details);
    }
  };

  // 下载订单的所有选中单证
  const handleDownloadOrderDocs = (orderId: string) => {
    const docIds = selectedDocs[orderId] || [];
    if (docIds.length === 0) {
      alert('请先选择要下载的单证');
      return;
    }
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      const docs = docIds.map(id => order.documents[id]).filter(d => d);
      alert(`正在下载订单 ${orderId} 的 ${docs.length} 个单证:\n${docs.map(d => d.fileName).join('\n')}`);
    }
  };

  // 邮报
  const handleBatchEmail = () => {
    const details = getSelectedDocDetails();
    if (details.length > 0) {
      setEmailDialog(true);
    } else {
      alert('请先选择要邮报的单证');
    }
  };

  // 发送邮件
  const handleSendEmail = (emails: string[], subject: string, message: string) => {
    const details = getSelectedDocDetails();
    alert(`邮件已发送！\n\n收件人: ${emails.join(', ')}\n主题: ${subject}\n附件数量: ${details.length}`);
    console.log('Email sent:', { emails, subject, message, attachments: details });
  };

  // 上传/替换单证
  const handleUploadDoc = (file: File) => {
    if (!uploadDialog) return;
    
    const { orderId, docType } = uploadDialog;
    const newDoc = {
      fileName: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    // 更新订单文档
    setOrders(prev => prev.map(order => {
      if (order.orderId === orderId) {
        return {
          ...order,
          documents: {
            ...order.documents,
            [docType]: newDoc
          }
        };
      }
      return order;
    }));
    
    alert(`✅ 上传成功！\n文件: ${file.name}\n大小: ${newDoc.size}\n状态: 待审核`);
  };

  // 刷新数据
  const handleRefresh = () => {
    alert('正在刷新数据...');
    // 实际应用中这里会从服务器重新加载数据
    setOrders([...MOCK_ORDERS]);
    setSelectedDocs({});
    console.log('Data refreshed');
  };

  // 导出Excel
  const handleExportExcel = () => {
    alert('正在导出Excel文件...');
    // 实际应用中这里会生成Excel文件
    console.log('Export Excel');
  };

  // 切换单个文档选择
  const toggleDocSelection = (orderId: string, docId: string) => {
    setSelectedDocs(prev => {
      const orderDocs = prev[orderId] || [];
      const isSelected = orderDocs.includes(docId);
      
      return {
        ...prev,
        [orderId]: isSelected 
          ? orderDocs.filter(id => id !== docId)
          : [...orderDocs, docId]
      };
    });
  };

  // 全选/取消全选订单的所有文档
  const toggleOrderSelection = (orderId: string) => {
    const order = MOCK_ORDERS.find(o => o.orderId === orderId);
    if (!order) return;

    const allDocIds = Object.keys(order.documents);
    const currentSelection = selectedDocs[orderId] || [];
    const allSelected = allDocIds.length === currentSelection.length;

    setSelectedDocs(prev => ({
      ...prev,
      [orderId]: allSelected ? [] : allDocIds
    }));
  };

  // 获取文档状态图标和颜色
  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', text: '已通过' };
      case 'pending':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', text: '待审核' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: '已驳回' };
      default:
        return { icon: FileText, color: 'text-gray-400', bg: 'bg-gray-50', text: '未上传' };
    }
  };

  return (
    <>
      {/* 对话框 */}
      {previewDoc && (
        <DocumentPreviewDialog 
          doc={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
      
      {uploadDialog && (
        <FileUploadDialog
          docType={uploadDialog.docType}
          docName={uploadDialog.docName}
          orderId={uploadDialog.orderId}
          onClose={() => setUploadDialog(null)}
          onUpload={handleUploadDoc}
        />
      )}
      
      {emailDialog && (
        <EmailDialog
          selectedDocs={getSelectedDocDetails()}
          onClose={() => setEmailDialog(false)}
          onSend={handleSendEmail}
        />
      )}
      
      <div className="min-h-full bg-gray-50 w-full max-w-full overflow-hidden">
        {/* 顶部导航栏 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm w-full max-w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5" style={{ color: '#F96302' }} />
            <div>
              <h1 className="text-sm font-bold text-gray-900">单证管理矩阵 · Document Matrix</h1>
              <div className="text-xs text-gray-500">
                一个萝卜一个坑的表格式管理 · 
                <span className="text-blue-600 ml-1">💡 单击打开菜单</span> · 
                <span className="text-purple-600">双击选中单证</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 批量操作工具栏 - 在选中单证时显示 */}
            {getTotalSelectedCount() > 0 ? (
              <>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  已选择 {getTotalSelectedCount()} 个单证
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedDocs({})}
                >
                  清空选择
                </Button>
                <div className="h-4 w-px bg-gray-300 mx-1"></div>
                {/* 查看按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-50"
                  onClick={handleBatchView}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  查看
                </Button>
                
                {/* 下载按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-50"
                  onClick={handleBatchDownload}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  下载
                </Button>
                
                {/* 邮报按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-50"
                  onClick={handleBatchEmail}
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  邮报
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRefresh}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  刷新数据
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleExportExcel}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  导出Excel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-full">
        {/* 矩阵表格 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden max-w-full">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse">
              {/* 表头 - 主列标题 */}
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                  <th className="sticky left-0 z-20 bg-gray-100 border-r border-gray-300 px-3 py-2 text-left min-w-[168px]">
                    <div className="text-xs font-bold text-gray-700">销售订单号</div>
                  </th>
                  <th className="sticky left-[168px] z-20 bg-gray-100 border-r border-gray-300 px-3 py-2 text-left">
                    <div className="text-xs font-bold text-gray-700">客户编号</div>
                  </th>
                  
                  {BUSINESS_STAGES.map(stage => (
                    <th 
                      key={stage.id} 
                      colSpan={stage.documents.length}
                      className="border-r border-gray-300 px-2 py-2 text-center"
                      style={{ backgroundColor: `${stage.color}15` }}
                    >
                      <div className="text-xs font-bold" style={{ color: stage.color }}>
                        {stage.name}
                      </div>
                    </th>
                  ))}
                  
                  <th className="sticky right-0 z-20 bg-gray-100 border-l-2 border-gray-300 px-3 py-2 text-center min-w-[120px]">
                    <div className="text-xs font-bold text-gray-700">操作</div>
                  </th>
                </tr>
                
                {/* 表头 - 子列标题（单证类型）*/}
                <tr className="bg-white border-b border-gray-300">
                  <th className="sticky left-0 z-20 bg-white border-r border-gray-200 px-3 py-1.5">
                    <div className="text-[10px] text-gray-500">Contract No.</div>
                  </th>
                  <th className="sticky left-[168px] z-20 bg-white border-r border-gray-200 px-3 py-1.5">
                    <div className="text-[10px] text-gray-500">Customer ID</div>
                  </th>
                  
                  {BUSINESS_STAGES.map(stage => (
                    <React.Fragment key={stage.id}>
                      {stage.documents.map((doc, idx) => (
                        <th 
                          key={doc.id}
                          className={`border-r border-gray-200 px-0.5 py-1.5 text-center min-w-[15px] w-[15px] ${
                            idx === stage.documents.length - 1 ? 'border-r-2 border-gray-300' : ''
                          }`}
                        >
                          <div className="text-[10px] font-semibold text-gray-700">{doc.code}</div>
                          <div className="text-[9px] text-gray-500 leading-tight">{doc.name}</div>
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  <th className="sticky right-0 z-20 bg-white border-l-2 border-gray-300 px-3 py-1.5">
                    <div className="text-[10px] text-gray-500">Actions</div>
                  </th>
                </tr>
              </thead>

              {/* 表体 - 订单数据 */}
              <tbody>
                {orders.map((order, rowIdx) => (
                  <tr 
                    key={order.orderId}
                    className={`border-b border-gray-200 hover:bg-blue-50/30 transition-colors ${
                      rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    {/* 销售订单号 */}
                    <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-3 py-2">
                      <div className="text-xs font-bold text-gray-900">{order.orderId}</div>
                      <div className="text-[10px] text-gray-500">{order.contractNo}</div>
                    </td>
                    
                    {/* 客户编号 */}
                    <td className="sticky left-[168px] z-10 bg-inherit border-r border-gray-200 px-3 py-2">
                      <div className="text-xs font-medium text-gray-900">{order.customerId}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[100px]">{order.customer}</div>
                    </td>
                    
                    {/* 各业务阶段的单证 */}
                    {BUSINESS_STAGES.map(stage => (
                      <React.Fragment key={stage.id}>
                        {stage.documents.map((docType, idx) => {
                          const doc = order.documents[docType.id];
                          const isSelected = (selectedDocs[order.orderId] || []).includes(docType.id);
                          
                          return (
                            <td 
                              key={docType.id}
                              className={`border-r border-gray-200 px-2 py-2 ${
                                idx === stage.documents.length - 1 ? 'border-r-2 border-gray-300' : ''
                              }`}
                            >
                              {doc ? (
                                // 已上传的文档
                                <div className="relative">
                                  <div 
                                    className={`doc-menu-trigger flex items-center justify-center p-1 rounded cursor-pointer ${
                                      activeMenu?.orderId === order.orderId && activeMenu?.docId === docType.id 
                                        ? 'ring-2 ring-orange-400 border-2 border-orange-400 scale-105' 
                                        : isSelected 
                                        ? 'bg-blue-100 border-2 border-blue-400' 
                                        : 'bg-gray-50 border border-gray-200 hover:border-blue-300'
                                    } ${getDocumentStatusBadge(doc.status).bg} transition-all`}
                                    onClick={(e) => {
                                      // 点击时切换操作菜单显示状态
                                      if (activeMenu?.orderId === order.orderId && activeMenu?.docId === docType.id) {
                                        setActiveMenu(null); // 如果已经显示，则关闭
                                      } else {
                                        setActiveMenu({ orderId: order.orderId, docId: docType.id }); // 显示菜单
                                      }
                                    }}
                                    onDoubleClick={(e) => {
                                      // 双击选中/取消选中单证
                                      e.stopPropagation();
                                      toggleDocSelection(order.orderId, docType.id);
                                    }}
                                  >
                                    {/* 状态图标 */}
                                    {(() => {
                                      const statusInfo = getDocumentStatusBadge(doc.status);
                                      const StatusIcon = statusInfo.icon;
                                      return <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />;
                                    })()}
                                  </div>
                                  
                                  {/* 操作菜单 - 点击后显示并保持不消失 */}
                                  {activeMenu?.orderId === order.orderId && activeMenu?.docId === docType.id && (
                                    <div className="doc-menu absolute top-full left-0 mt-1 bg-white border-2 border-orange-400 rounded-lg shadow-2xl z-30 whitespace-nowrap overflow-hidden">
                                      {/* 菜单标题 */}
                                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-2 py-1 border-b border-orange-200">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            <FileText className="h-3 w-3 text-orange-600" />
                                            <span className="text-[9px] font-semibold text-orange-700">
                                              {BUSINESS_STAGES.flatMap(s => s.documents).find(d => d.id === docType.id)?.name}
                                            </span>
                                          </div>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-4 w-4 p-0 hover:bg-red-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveMenu(null);
                                            }}
                                          >
                                            <X className="h-2.5 w-2.5 text-gray-500" />
                                          </Button>
                                        </div>
                                        <div className="text-[8px] text-gray-500 mt-0.5">
                                          {order.orderId} · {doc.fileName}
                                        </div>
                                      </div>
                                      
                                      {/* 菜单按钮 */}
                                      <div className="flex items-center gap-1 p-1.5">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 px-2.5 text-[10px] hover:bg-blue-50 border border-transparent hover:border-blue-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDoc(order.orderId, docType.id);
                                          }}
                                        >
                                          <Eye className="h-3.5 w-3.5 mr-1" />
                                          查看
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 px-2.5 text-[10px] hover:bg-green-50 border border-transparent hover:border-green-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadDoc(order.orderId, docType.id);
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1" />
                                          下载
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 px-2.5 text-[10px] hover:bg-purple-50 border border-transparent hover:border-purple-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const docName = BUSINESS_STAGES
                                              .flatMap(s => s.documents)
                                              .find(d => d.id === docType.id)?.name || '';
                                            setUploadDialog({
                                              orderId: order.orderId,
                                              docType: docType.id,
                                              docName
                                            });
                                          }}
                                        >
                                          <Upload className="h-3.5 w-3.5 mr-1" />
                                          替换
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 驳回原因提示 */}
                                  {doc.status === 'rejected' && doc.rejectionReasons && activeMenu?.orderId === order.orderId && activeMenu?.docId === docType.id && (
                                    <div className="absolute top-full left-0 mt-8 bg-red-50 border border-red-200 rounded p-1.5 z-30 w-48">
                                      <div className="text-[9px] font-semibold text-red-700 mb-0.5">❌ 驳回原因：</div>
                                      <ul className="text-[8px] text-red-600 space-y-0.5">
                                        {doc.rejectionReasons.map((reason, i) => (
                                          <li key={i}>• {reason}</li>
                                        ))}
                                      </ul>
                                      <div className="text-[8px] text-red-500 mt-0.5">
                                        {doc.rejectedBy} · {doc.rejectedAt}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // 缺失的文档 - 灰色占位框
                                <div 
                                  className="border-2 border-dashed border-gray-300 rounded p-1 text-center bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer transition-all"
                                  onClick={() => {
                                    const docName = BUSINESS_STAGES
                                      .flatMap(s => s.documents)
                                      .find(d => d.id === docType.id)?.name || '';
                                    setUploadDialog({
                                      orderId: order.orderId,
                                      docType: docType.id,
                                      docName
                                    });
                                  }}
                                >
                                  <div className="text-gray-400">
                                    <Upload className="h-4 w-4 mx-auto" />
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    
                    {/* 操作列 */}
                    <td className="sticky right-0 z-10 bg-inherit border-l-2 border-gray-300 px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[10px] w-full"
                          onClick={() => toggleOrderSelection(order.orderId)}
                        >
                          <input
                            type="checkbox"
                            checked={
                              (selectedDocs[order.orderId] || []).length === Object.keys(order.documents).length &&
                              Object.keys(order.documents).length > 0
                            }
                            onChange={() => {}}
                            className="h-3 w-3 mr-1"
                          />
                          全选
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[10px] w-full"
                          disabled={(selectedDocs[order.orderId] || []).length === 0}
                          onClick={() => handleDownloadOrderDocs(order.orderId)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          下载({(selectedDocs[order.orderId] || []).length})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[10px] w-full"
                          onClick={() => {
                            alert('批量上传功能：选择多个文件同时上传到此订单');
                            // 实际应用中这里会打开批量上传对话框
                          }}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          批量上传
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部统计信息 */}
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
          <div className="grid grid-cols-6 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-[10px] text-gray-500">总订单数</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {orders.reduce((sum, o) => sum + Object.keys(o.documents).length, 0)}
              </div>
              <div className="text-[10px] text-gray-500">已上传</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {orders.reduce((sum, o) => 
                  sum + Object.values(o.documents).filter(d => d.status === 'approved').length, 0
                )}
              </div>
              <div className="text-[10px] text-gray-500">已通过</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">
                {orders.reduce((sum, o) => 
                  sum + Object.values(o.documents).filter(d => d.status === 'pending').length, 0
                )}
              </div>
              <div className="text-[10px] text-gray-500">待审核</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">
                {orders.reduce((sum, o) => 
                  sum + Object.values(o.documents).filter(d => d.status === 'rejected').length, 0
                )}
              </div>
              <div className="text-[10px] text-gray-500">已驳回</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-400">
                {orders.length * BUSINESS_STAGES.reduce((sum, s) => sum + s.documents.length, 0) - 
                 orders.reduce((sum, o) => sum + Object.keys(o.documents).length, 0)}
              </div>
              <div className="text-[10px] text-gray-500">缺失单证</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}