import React, { useRef } from 'react';
import { Button } from '../ui/button';
import { Download, Printer, FileText, Edit, Send } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SupplierQuotationDocument, SupplierQuotationData } from '../documents/templates/SupplierQuotationDocument';

interface SupplierQuotationDocumentViewerProps {
  quotation: any; // 报价单对象，包含documentData字段
  onEdit?: () => void; // 🔥 编辑回调
  onSubmit?: () => void; // 🔥 提交回调
}

export default function SupplierQuotationDocumentViewer({ quotation, onEdit, onSubmit }: SupplierQuotationDocumentViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
    toast.success('正在打印报价单...');
  };

  const handleDownload = () => {
    toast.info('下载功能开发中...');
  };

  // 🔥 如果没有documentData，从quotation对象构建
  const getDocumentData = (): SupplierQuotationData => {
    // 🔥 调试：打印quotation对象
    console.log('🔍 SupplierQuotationDocumentViewer - quotation对象:', quotation);
    console.log('🔍 quotation.currency:', quotation.currency);
    console.log('🔍 quotation.items:', quotation.items);
    console.log('🔍 quotation.documentData:', quotation.documentData);
    
    // 🔥 优先从items中获取最新的货币（因为编辑器保存时会更新items）
    const actualCurrency = quotation.items?.[0]?.currency || quotation.currency || 'CNY';
    console.log('🔍 实际使用的货币:', actualCurrency);
    
    if (quotation.documentData) {
      // 🔥 即使有documentData，也要更新货币信息（确保与编辑器同步）
      const updatedDocumentData = {
        ...quotation.documentData,
        products: quotation.documentData.products.map((product: any) => ({
          ...product,
          currency: actualCurrency // 🔥 使用实际货币
        }))
      };
      
      console.log('🔍 更新后的documentData.products:', updatedDocumentData.products);
      console.log('🔍 第一个产品的货币:', updatedDocumentData.products[0]?.currency);
      
      // 🔥 如果documentData存在但缺少supplierRemarks，尝试补充
      if (!updatedDocumentData.supplierRemarks) {
        updatedDocumentData.supplierRemarks = quotation.supplierRemarks ? {
          content: quotation.supplierRemarks,
          remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
          remarkBy: quotation.supplierContact || quotation.supplierName || '供应商'
        } : quotation.generalRemarks ? {
          // 🔥 从generalRemarks字段读取（兼容旧数据）
          content: quotation.generalRemarks,
          remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
          remarkBy: quotation.supplierContact || quotation.supplierName || '供应商'
        } : {
          // 🔥 如果没有任何备注，提供一个默认的专业备注模板
          content: `特别说明：

1. 本次报价基于当前原材料价格，如原材料价格波动超过10%，我司保留价格调整权利。

2. 首次合作客户，建议先下小批量试单验证产品质量，满意后再批量采购。

3. 我司已通过ISO 9001质量管理体系认证，所有产品出厂前均经过严格的质量检验，不良率控制在0.5%以内。

4. 付款方式可协商，老客户可申请月结账期（需提供公司资质审核）。

5. 如需样品测试，可提供2-3个免费样品，快递费到付。正式下单后样品费可抵扣货款。`,
          remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
          remarkBy: quotation.supplierContact || quotation.supplierName || '供应商'
        };
      }
      
      // 🔥 如果terms.remarks为空，补充默认值（确保第10条显示）
      if (!updatedDocumentData.terms.remarks) {
        updatedDocumentData.terms.remarks = '报价有效期30天。大批量订单可协商价格。';
      }
      
      return updatedDocumentData;
    }

    // 从quotation对象构建documentData
    return {
      quotationNo: quotation.quotationNo || '',
      quotationDate: quotation.quotationDate || '',
      validUntil: quotation.validUntil || '',
      rfqReference: quotation.sourceXJ || quotation.sourceQR,
      
      supplier: {
        companyName: quotation.supplierCompany || '',
        address: '供应商地址',
        tel: quotation.supplierPhone || '',
        email: quotation.supplierEmail || '',
        contactPerson: quotation.supplierContact || quotation.supplierName || '',
        supplierCode: quotation.supplierCode || ''
      },
      
      buyer: {
        name: '福建高盛达富建材有限公司',
        nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
        address: '福建省厦门市思明区',
        addressEn: 'Siming District, Xiamen, Fujian, China',
        tel: '+86-592-1234567',
        email: 'purchase@cosun.com',
        contactPerson: quotation.customerName || 'COSUN采购'
      },
      
      products: quotation.items?.map((item: any, index: number) => ({
        no: index + 1,
        modelNo: item.modelNo || '',
        description: item.productName || '',
        specification: item.specification || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice || 0,
        currency: item.currency || quotation.currency || 'CNY',
        remarks: item.remarks || ''
      })) || [],
      
      terms: {
        paymentTerms: quotation.paymentTerms || 'T/T 30天',
        deliveryTerms: quotation.deliveryTerms || 'FOB 厦门',
        deliveryTime: '收到订单后30天内',
        deliveryAddress: '福建省福州市仓山区金山工业区', // 🔥 添加交货地址
        moq: '1000 pcs',
        qualityStandard: '符合国家标准', // 🔥 添加质量标准
        warranty: '12个月', // 🔥 添加质保期
        packaging: quotation.packingTerms || '标准出口包装',
        shippingMarks: '中性唛头', // 🔥 添加唛头
        remarks: quotation.generalRemarks || '报价有效期30天。大批量订单可协商价格。' // 🔥 添加默认值，确保第10条显示
      },
      
      // 🔥 供应商备注
      supplierRemarks: quotation.supplierRemarks ? {
        content: quotation.supplierRemarks,
        remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
        remarkBy: quotation.supplierContact || quotation.supplierName || '供应商'
      } : quotation.documentData?.supplierRemarks ? {
        // 🔥 如果quotation对象没有supplierRemarks，尝试从documentData中读取
        content: quotation.documentData.supplierRemarks.content,
        remarkDate: quotation.documentData.supplierRemarks.remarkDate || quotation.quotationDate,
        remarkBy: quotation.documentData.supplierRemarks.remarkBy || quotation.supplierName || '供应商'
      } : quotation.generalRemarks ? {
        // 🔥 从generalRemarks字段读取（兼容旧数据）
        content: quotation.generalRemarks,
        remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
        remarkBy: quotation.supplierContact || quotation.supplierName || '供应商'
      } : {
        // 🔥 如果没有任何备注，提供一个默认的专业备注模板
        content: `特别说明：

1. 本次报价基于当前原材料价格，如原材料价格波动超过10%，我司保留价格调整权利。

2. 首次合作客户，建议先下小批量试单验证产品质量，满意后再批量采购。

3. 我司已通过ISO 9001质量管理体系认证，所有产品出厂前均经过严格的质量检验，不良率控制在0.5%以内。

4. 付款方式可协商，老客户可申请月结账期（需提供公司资质审核）。

5. 如需样品测试，可提供2-3个免费样品，快递费到付。正式下单后样品费可抵扣货款。`,
        remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
        remarkBy: quotation.supplierContact || quotation.supplierName || '供应商'
      }
    };
  };

  const documentData = getDocumentData();

  return (
    <div className="space-y-4">
      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-2 pb-4 border-b print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          下载PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          打印
        </Button>
        {onEdit && quotation.status === 'draft' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            编辑
          </Button>
        )}
        {onSubmit && quotation.status === 'draft' && (
          <Button
            size="sm"
            onClick={onSubmit}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="w-4 h-4" />
            提交报价
          </Button>
        )}
      </div>

      {/* 文档预览 */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <SupplierQuotationDocument ref={documentRef} data={documentData} />
        </div>
      </div>
    </div>
  );
}