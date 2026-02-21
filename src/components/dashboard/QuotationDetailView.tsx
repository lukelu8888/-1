import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Printer, Download, X, CheckCircle, XCircle, MessageSquare, Calculator } from 'lucide-react';
import { Quotation } from '../admin/QuotationManagement';
import { QuotationDocument, QuotationData } from '../documents/templates/QuotationDocument'; // 🔥 使用文档中心的业务员报价单模版
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'; // 🔥 使用SalesQuotationContext
import { sendNotificationToUser } from '../../contexts/NotificationContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner@2.0.3';
import { apiFetchJson } from '../../api/backend-auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QuotationDetailViewProps {
  open: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onOpenProfitAnalyzer?: (quotation: Quotation) => void; // 🔥 新增：打开Profit Analyzer的回调
  onUpdated?: () => void; // 🔥 客户操作后刷新列表（落库后重新拉取）
}

export default function QuotationDetailView({
  open,
  onClose,
  quotation,
  onOpenProfitAnalyzer,
  onUpdated
}: QuotationDetailViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'accepted' | 'rejected' | 'negotiating'>('negotiating');
  const { updateQuotation } = useSalesQuotations();
  const { user } = useUser();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = printRef.current;
    if (!element) return;

    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Quotation_${quotation?.quotationNumber}.pdf`);
    });
  };

  // 🆕 接受报价
  const handleAcceptQuotation = async () => {
    if (!quotation || !user) return;

    console.log('📝 [QuotationDetailView] 接受报价开始');
    console.log('  - 报价ID:', quotation.id);
    console.log('  - 报价编号:', (quotation as any).qtNumber || quotation.quotationNumber);
    console.log('  - 客户邮箱:', quotation.customerEmail);
    console.log('  - 当前用户:', user.email);

    // ✅ 落库：客户接受报价
    try {
      await apiFetchJson(`/api/sales-quotations/${encodeURIComponent(String(quotation.id))}/customer-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'accepted',
          comment: 'Customer accepted the quotation',
        }),
      });

      // 🔥 同步本地状态（兼容现有组件/统计）
      updateQuotation(quotation.id, {
        customerStatus: 'accepted',
        customerResponse: {
          status: 'accepted',
          comment: 'Customer accepted the quotation',
          respondedAt: new Date().toISOString(),
        },
      });
      onUpdated?.();
    } catch (e: any) {
      console.error('❌ [QuotationDetailView] Accept 落库失败:', e);
      toast.error(`❌ Accept failed: ${e?.message || 'Unknown error'}`);
      return;
    }

    console.log('✅ [QuotationDetailView] updateQuotation 已调用 - customerStatus: accepted');

    // 🔔 发送通知给业务员
    const salesPersonEmail = (quotation as any).salesPerson || 'admin@cosun.com';
    sendNotificationToUser(salesPersonEmail, {
      type: 'quotation_accepted',
      title: '✅ 客户接受报价',
      message: `${quotation.customerName || quotation.customer} 已接受报价 ${(quotation as any).qtNumber || quotation.quotationNumber}`,
      relatedId: (quotation as any).qtNumber || quotation.quotationNumber,
      relatedType: 'quotation',
      sender: user.email,
      metadata: {
        customerName: quotation.customerName || quotation.customer,
        customerEmail: quotation.customerEmail,
        qtNumber: (quotation as any).qtNumber || quotation.quotationNumber,
        action: 'accepted'
      }
    });

    toast.success('✅ Thanks for your confirmation!', {
      description: "We're preparing you with sales contract.",
      duration: 4000,
      className: 'bg-white',
      style: {
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #22c55e',
      },
      descriptionStyle: {
        color: '#374151'
      }
    });

    console.log('✅ [QuotationDetailView] 接受报价完成，准备关闭对话框');
    onClose();
  };

  // 🆕 提交反馈（Negotiate或Decline）
  const handleSubmitFeedback = async () => {
    if (!quotation || !user) return;

    if (!feedbackMessage.trim()) {
      toast.error('Please enter your feedback', {
        description: 'Feedback message cannot be empty',
        duration: 3000
      });
      return;
    }

    // 🔥 根据feedbackType确定customerStatus
    const newCustomerStatus = feedbackType === 'rejected' ? 'rejected' : 'negotiating';

    console.log('📝 [QuotationDetailView] 提交反馈开始');
    console.log('  - 反馈类型:', feedbackType);
    console.log('  - 新状态:', newCustomerStatus);
    console.log('  - 反馈内容:', feedbackMessage);

    // ✅ 落库：客户协商/拒绝
    try {
      await apiFetchJson(`/api/sales-quotations/${encodeURIComponent(String(quotation.id))}/customer-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newCustomerStatus, // negotiating | rejected
          comment: feedbackMessage,
        }),
      });

      // 🔥 同步本地状态（兼容现有组件/统计）
      updateQuotation(quotation.id, {
        customerStatus: newCustomerStatus,
        customerResponse: {
          status: feedbackType,
          comment: feedbackMessage,
          respondedAt: new Date().toISOString(),
        },
      });
      onUpdated?.();
    } catch (e: any) {
      console.error('❌ [QuotationDetailView] Feedback 落库失败:', e);
      toast.error(`❌ Submit failed: ${e?.message || 'Unknown error'}`);
      return;
    }

    console.log('✅ [QuotationDetailView] updateQuotation 已调用 - customerStatus:', newCustomerStatus);

    // 🔔 发送通知给业务员
    const salesPersonEmail = (quotation as any).salesPerson || 'admin@cosun.com';
    const notificationTitle = feedbackType === 'rejected' ? '❌ 客户拒绝报价' : '💬 客户请求协商';
    const notificationMessage = `${quotation.customerName || quotation.customer} 对报价 ${(quotation as any).qtNumber || quotation.quotationNumber} 提出反馈`;

    sendNotificationToUser(salesPersonEmail, {
      type: feedbackType === 'rejected' ? 'quotation_rejected' : 'quotation_negotiating',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: (quotation as any).qtNumber || quotation.quotationNumber,
      relatedType: 'quotation',
      sender: user.email,
      metadata: {
        customerName: quotation.customerName || quotation.customer,
        customerEmail: quotation.customerEmail,
        feedbackType,
        feedbackMessage,
        qtNumber: (quotation as any).qtNumber || quotation.quotationNumber,
        action: newCustomerStatus
      }
    });

    const successTitle = feedbackType === 'rejected' 
      ? '❌ Feedback submitted' 
      : '💬 Negotiation request sent';
    const successDescription = feedbackType === 'rejected'
      ? 'We have received your decision. Thank you for your time.'
      : 'Our sales team will review your request and get back to you soon.';

    toast.success(successTitle, {
      description: successDescription,
      duration: 4000
    });

    setShowFeedback(false);
    setFeedbackMessage('');
    onClose();
  };

  if (!quotation) return null;

  // 是否已有反馈
  const hasFeedback = quotation.customerFeedback !== undefined;
  const isConfirmed = quotation.status === 'confirmed';
  const isRejected = quotation.status === 'rejected';
  const isNegotiating = quotation.status === 'negotiating';
  
  // 🆕 检查是否是修订版本
  const isRevised = (quotation.revisionNumber || 1) > 1;
  const latestRevision = quotation.revisions && quotation.revisions.length > 0 
    ? quotation.revisions[quotation.revisions.length - 1] 
    : null;

  // 🐛 调试日志
  console.log('🔍 [QuotationDetailView] 报价详情检查:');
  console.log('  - 报价编号:', quotation.quotationNumber);
  console.log('  - 报价状态:', quotation.status);
  console.log('  - hasFeedback:', hasFeedback);
  console.log('  - customerFeedback:', quotation.customerFeedback);
  console.log('  - 修订版本号:', quotation.revisionNumber);
  console.log('  - 是否显示操作按钮:', !hasFeedback && quotation.status !== 'converted');
  console.log('  - isConfirmed:', isConfirmed);
  console.log('  - isRevised:', isRevised);

  // 🔥 将Customer Portal的quotation数据转换为QuotationDocument需要的格式
  const convertToQuotationData = (): QuotationData => {
    // 🔥 兼容新旧数据结构
    const quotationNo = (quotation as any).qtNumber || quotation.quotationNumber || '';
    const quotationDate = (quotation as any).createdAt 
      ? new Date((quotation as any).createdAt).toISOString().split('T')[0]
      : quotation.quotationDate || new Date().toISOString().split('T')[0];
    const inquiryNo = (quotation as any).inqNumber || quotation.inquiryNumber || '';
    const productList = (quotation as any).items || quotation.products || [];
    
    // 🔒 安全过滤：只使用客户可见的备注，绝不显示内部备注
    const safeRemarks = (quotation as any).customerNotes 
      || (quotation as any).remarks 
      || '';  // ⚠️ 绝不使用 internalNotes 或 notes（可能包含采购建议）
    
    console.log('🔍 [QuotationDetailView] 数据转换:');
    console.log('  - qtNumber:', (quotation as any).qtNumber);
    console.log('  - quotationNumber:', quotation.quotationNumber);
    console.log('  - 最终编号:', quotationNo);
    console.log('  - items:', (quotation as any).items);
    console.log('  - products:', quotation.products);
    console.log('  - 最终产品列表长度:', productList.length);
    console.log('  - customerNotes:', (quotation as any).customerNotes);
    console.log('  - remarks:', (quotation as any).remarks);
    console.log('  - internalNotes (不显示):', (quotation as any).internalNotes);
    console.log('  - 最终备注:', safeRemarks);
    
    return {
      // 报价单基本信息
      quotationNo: quotationNo,
      quotationDate: quotationDate,
      validUntil: quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      inquiryNo: inquiryNo,
      region: ((quotation as any).region || quotation.region || 'NA') as 'NA' | 'SA' | 'EU',
      
      // 公司信息
      company: {
        name: '福建高盛达富建材有限公司',
        nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
        address: '中国福建省厦门市思明区',
        addressEn: 'Siming District, Xiamen, Fujian Province, China',
        tel: '+86-592-1234567',
        fax: '+86-592-1234568',
        email: 'info@cosun.com',
        website: 'www.cosun.com'
      },
      
      // 客户信息
      customer: {
        companyName: (quotation as any).customerCompany || quotation.customer || '',
        contactPerson: quotation.customerName || '',
        address: quotation.customerAddress || 'N/A',
        email: quotation.customerEmail || '',
        phone: quotation.customerPhone || 'N/A'
      },
      
      // 🔥 产品报价列表 - 兼容items和products两种结构
      products: productList.map((item: any, index: number) => ({
        no: index + 1,
        modelNo: item.modelNo || item.sku || '',
        imageUrl: item.imageUrl || item.image || '',
        productName: item.productName || item.name || '',
        specification: item.specification || item.specs || '',
        hsCode: item.hsCode || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'PCS',
        unitPrice: item.salesPrice || item.unitPrice || 0, // 🔥 使用salesPrice（销售价）而不是costPrice
        currency: (quotation as any).currency || quotation.currency || 'USD',
        amount: item.salesPrice ? (item.salesPrice * item.quantity) : (item.totalPrice || (item.unitPrice * item.quantity) || 0),
        moq: item.moq || 0,
        leadTime: item.leadTime || ''
      })),
      
      // 贸易条款
      tradeTerms: {
        incoterms: (quotation as any).tradeTerms?.incoterms || quotation.deliveryTerms || 'FOB 厦门',
        paymentTerms: (quotation as any).tradeTerms?.paymentTerms || (quotation as any).paymentTerms || quotation.paymentTerms || 'T/T 30天',
        deliveryTime: (quotation as any).tradeTerms?.deliveryTime || quotation.deliveryTime || '25-30 days after deposit',
        packing: (quotation as any).tradeTerms?.packing || quotation.packing || 'Export carton with pallets',
        portOfLoading: (quotation as any).tradeTerms?.portOfLoading || quotation.portOfLoading || 'Xiamen, China',
        portOfDestination: (quotation as any).tradeTerms?.portOfDestination || quotation.portOfDestination || '',
        warranty: (quotation as any).tradeTerms?.warranty || quotation.warranty || '12 months from delivery date against manufacturing defects',
        inspection: (quotation as any).tradeTerms?.inspection || quotation.inspection || "Seller's factory inspection, buyer has the right to re-inspect upon arrival"
      },
      
      // 🔒 备注 - 只使用客户可见的备注
      remarks: safeRemarks,
      
      // 业务员信息
      salesPerson: {
        name: (quotation as any).salesPersonName || quotation.salesPersonName || 'Sales Representative',
        position: 'Sales Manager',
        email: (quotation as any).salesPerson || quotation.salesPersonEmail || 'sales@cosun.com',
        phone: quotation.salesPersonPhone || '+86-592-1234567',
        whatsapp: quotation.salesPersonWhatsapp || ''
      }
    };
  };

  const quotationData = convertToQuotationData();

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
        <DialogContent 
          className="max-w-5xl max-h-[90vh] flex flex-col p-0"
          onPointerDownOutside={(e) => {
            // 检查点击是否在Profit Analyzer上
            const target = e.target as HTMLElement;
            if (target.closest('[data-profit-analyzer]')) {
              e.preventDefault(); // 阻止Dialog关闭
            }
          }}
          onInteractOutside={(e) => {
            // 检查点击是否在Profit Analyzer上
            const target = e.target as HTMLElement;
            if (target.closest('[data-profit-analyzer]')) {
              e.preventDefault(); // 阻止Dialog关闭
            }
          }}
        >
          {/* 🔥 Header区域 - 固定不滚动 */}
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base">Quotation Details</DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-1">
                  Quotation Number: {(quotation as any).qtNumber || quotation.quotationNumber}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handlePrint}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* 🔥 Content区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* 台湾大厂风格报价单模板 */}
            <QuotationDocument ref={printRef} quotation={quotationData} />

            {/* 🆕 修订版本提示 */}
            {isRevised && latestRevision && !hasFeedback && quotation.status !== 'converted' && (
              <div className="mt-4 border rounded-lg py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 print:hidden">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-blue-900">📝 Quotation Revised Based on Your Feedback</h4>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        Revision {quotation.revisionNumber}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mb-2">
                      We have adjusted the quotation based on your negotiation. Please review the updated pricing and terms carefully.
                    </p>
                    <p className="text-xs text-gray-500">
                      Revised on: {new Date(latestRevision.revisedAt).toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 已提交反馈的状态显示 */}
            {hasFeedback && !isConfirmed && (
              <div className="mt-4 print:hidden">
                <div className={`p-4 rounded-lg border-2 ${
                  isRejected 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {isRejected ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {isRejected ? 'You have declined this quotation' : 'Your feedback has been submitted'}
                      </p>
                      <p className="text-xs text-gray-700 mb-2">
                        {quotation.customerFeedback?.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted on: {new Date(quotation.customerFeedback?.submittedAt || 0).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 已接受的状态 */}
            {isConfirmed && (
              <div className="mt-4 print:hidden">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 mb-1">
                        ✅ Quotation Accepted
                      </p>
                      <p className="text-xs text-green-700">
                        We will generate your official order and arrange production. Thank you for your trust!
                      </p>
                      {quotation.confirmedDate && (
                        <p className="text-xs text-green-600 mt-2">
                          Confirmed on: {quotation.confirmedDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 已转订单的状态 */}
            {quotation.status === 'converted' && (
              <div className="mt-4 print:hidden">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900 mb-1">
                        🎉 This quotation has been converted to an order
                      </p>
                      <p className="text-xs text-purple-700">
                        Please go to "My Orders" to view order details and production progress
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🔥 粘性操作栏 - 固定在底部，始终可见 */}
          {!hasFeedback && quotation.status !== 'converted' && (
            <div className="border-t bg-white flex-shrink-0 print:hidden">
              {/* 🔥 利润计算提示区域 - 放在最顶部 */}
              {!showFeedback && (
                <div className="px-6 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <Calculator className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900 mb-1">
                          💰 Want to calculate your profit margin?
                        </p>
                        <p className="text-xs text-orange-700">
                          Compare this quotation with alternative suppliers and calculate your landed costs, profit margins, and ROI before making a decision.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg px-4 whitespace-nowrap"
                      onClick={() => {
                        console.log('🔥 [QuotationDetailView] Calculate Profit button clicked!');
                        if (onOpenProfitAnalyzer && quotation) {
                          console.log('🔥 [QuotationDetailView] Calling onOpenProfitAnalyzer callback');
                          onOpenProfitAnalyzer(quotation);
                        }
                      }}
                    >
                      <Calculator className="w-4 h-4 mr-1.5" />
                      Calculate Profit
                    </Button>
                  </div>
                </div>
              )}
              
              {/* 提示信息区域 */}
              {!showFeedback && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                  <p className="text-xs text-blue-900 flex items-start gap-2">
                    <span className="text-base">ℹ️</span>
                    <span>Please review the quotation carefully. If you have any questions or need adjustments, click the buttons below to provide feedback.</span>
                  </p>
                </div>
              )}

              {/* 反馈输入表单 */}
              {showFeedback && (
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border-2 ${
                      feedbackType === 'negotiating' 
                        ? 'bg-orange-50 border-orange-300' 
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <p className="text-sm font-medium mb-1">
                        {feedbackType === 'negotiating' ? '📝 Negotiation Request' : '❌ Reason for Declining'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {feedbackType === 'negotiating' 
                          ? 'Please specify what you would like to adjust (e.g., price, delivery time, payment terms)' 
                          : 'Please explain why you are declining this quotation'}
                      </p>
                    </div>
                    <Textarea
                      placeholder={feedbackType === 'negotiating' 
                        ? 'e.g., Could you reduce the unit price by 5% and extend payment terms to 45 days?' 
                        : 'e.g., The price exceeds our budget and delivery time is too long...'}
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* 🔥 操作按钮栏 - 始终可见 */}
              <div className="px-6 py-4">
                {!showFeedback ? (
                  <div className="grid grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 text-sm border-2"
                      onClick={onClose}
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Close
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 text-sm border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        setFeedbackType('negotiating');
                        setShowFeedback(true);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      Negotiate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 text-sm border-2 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setFeedbackType('rejected');
                        setShowFeedback(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Decline
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-10 text-sm bg-green-600 hover:bg-green-700 font-semibold"
                      onClick={handleAcceptQuotation}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Accept
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 text-sm"
                      onClick={() => {
                        setShowFeedback(false);
                        setFeedbackMessage('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className={`flex-1 h-10 text-sm font-semibold ${
                        feedbackType === 'negotiating'
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      onClick={handleSubmitFeedback}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 已有反馈或已转订单的关闭按钮 */}
          {(hasFeedback || quotation.status === 'converted') && (
            <div className="border-t bg-white px-6 py-4 flex-shrink-0 print:hidden">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="h-9 text-sm px-6" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
  );
}