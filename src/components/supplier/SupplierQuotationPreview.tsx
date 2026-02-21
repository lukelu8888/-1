import React, { useRef } from 'react';
import { Button } from '../ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SupplierQuotationDocument, SupplierQuotationData } from '../documents/templates/SupplierQuotationDocument';

interface SupplierQuotationPreviewProps {
  quotationData: SupplierQuotationData;
}

export default function SupplierQuotationPreview({ quotationData }: SupplierQuotationPreviewProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  // 🔥 打印/导出PDF功能
  const handlePrint = () => {
    if (!documentRef.current) {
      toast.error('文档未加载完成，请稍后重试');
      return;
    }

    // 使用浏览器原生打印API
    window.print();
    
    toast.success('文档已准备就绪', {
      description: '请在打印对话框中选择"另存为PDF"进行保存',
      duration: 3000
    });
  };

  return (
    <div className="space-y-4">
      {/* 🔥 操作按钮栏 */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h4 className="font-semibold text-gray-900">报价单文档</h4>
          <p className="text-xs text-gray-500 mt-1">
            编号: {quotationData.quotationNo} | 日期: {quotationData.quotationDate} | 有效期至: {quotationData.validUntil}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            打印
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-orange-600 hover:bg-orange-700"
            onClick={handlePrint}
          >
            <Download className="w-4 h-4" />
            导出PDF
          </Button>
        </div>
      </div>

      {/* 🔥 文档预览区域 */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <SupplierQuotationDocument ref={documentRef} data={quotationData} />
        </div>
      </div>

      {/* 🔥 文档信息摘要 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          文档说明
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-blue-700">报价方（供应商）</p>
            <p className="font-medium text-blue-900">{quotationData.supplier.companyName}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">联系人</p>
            <p className="font-medium text-blue-900">{quotationData.supplier.contactPerson}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">询价方（客户）</p>
            <p className="font-medium text-blue-900">{quotationData.buyer.name}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">采购员</p>
            <p className="font-medium text-blue-900">{quotationData.buyer.contactPerson}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">产品数量</p>
            <p className="font-medium text-blue-900">{quotationData.products.length} 个产品</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">报价有效期</p>
            <p className="font-medium text-orange-600">{quotationData.validUntil}</p>
          </div>
          {quotationData.rfqReference && (
            <div className="col-span-2">
              <p className="text-xs text-blue-700">关联询价单</p>
              <p className="font-medium text-blue-900">{quotationData.rfqReference}</p>
            </div>
          )}
        </div>
      </div>

      {/* 🔥 使用提示 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">使用提示</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 点击"导出PDF"按钮，在打印对话框中选择"另存为PDF"即可保存文档</li>
          <li>• 报价单采用A4标准格式，支持自动分页，适合打印</li>
          <li>• 文档包含完整的产品报价、商务条款和签名区域</li>
          <li>• 支持多货币报价，自动按货币分组汇总总价</li>
          <li>• 报价单一式两份，双方签字盖章后生效</li>
        </ul>
      </div>
    </div>
  );
}
