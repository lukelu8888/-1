import React, { useState, useRef } from 'react';
import { FileText, Eye, Download, Printer, Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { A4PageContainer } from '../documents/A4PageContainer';
import { CustomerInquiryDocument } from '../documents/templates/CustomerInquiryDocument';
import { QuotationDocument } from '../documents/templates/QuotationDocument';
import { SalesContractDocument } from '../documents/templates/SalesContractDocument';
import { ProformaInvoiceDocument } from '../documents/templates/ProformaInvoiceDocument';
import { CommercialInvoiceDocument } from '../documents/templates/CommercialInvoiceDocument';
import { PackingListDocument } from '../documents/templates/PackingListDocument';
import type { CustomerInquiryData } from '../documents/templates/CustomerInquiryDocument';
import type { QuotationData } from '../documents/templates/QuotationDocument';
import type { SalesContractData } from '../documents/templates/SalesContractDocument';
import type { ProformaInvoiceData } from '../documents/templates/ProformaInvoiceDocument';
import type { CommercialInvoiceData } from '../documents/templates/CommercialInvoiceDocument';
import type { PackingListData } from '../documents/templates/PackingListDocument';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * 📄 客户文档中心
 * 
 * 功能：
 * 1. 查看所有与客户相关的文档
 * 2. 预览文档（A4格式）
 * 3. 下载PDF
 * 4. 打印文档
 */

interface DocumentItem {
  id: string;
  type: 'inquiry' | 'quotation' | 'sc' | 'pi' | 'ci' | 'pl';
  number: string;
  date: string;
  title: string;
  status: 'draft' | 'sent' | 'confirmed' | 'completed';
  amount?: string;
}

export function MyDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // 示例文档列表（实际应该从后端获取）
  const documents: DocumentItem[] = [
    {
      id: '1',
      type: 'inquiry',
      number: 'INQ-NA-20251210-001',
      date: '2025-12-10',
      title: 'Electrical Components Inquiry',
      status: 'confirmed',
    },
    {
      id: '2',
      type: 'quotation',
      number: 'QT-NA-20251211-001',
      date: '2025-12-11',
      title: 'Quotation for Electrical Components',
      status: 'sent',
      amount: '$15,890.00',
    },
    {
      id: '3',
      type: 'sc',
      number: 'SC-NA-20251212-001',
      date: '2025-12-12',
      title: 'Sales Contract - Electrical Components',
      status: 'confirmed',
      amount: '$15,890.00',
    },
    {
      id: '4',
      type: 'pi',
      number: 'PI-NA-20251213-001',
      date: '2025-12-13',
      title: 'Proforma Invoice',
      status: 'sent',
      amount: '$15,890.00',
    },
    {
      id: '5',
      type: 'ci',
      number: 'CI-NA-20251214-001',
      date: '2025-12-14',
      title: 'Commercial Invoice',
      status: 'completed',
      amount: '$15,890.00',
    },
    {
      id: '6',
      type: 'pl',
      number: 'PL-NA-20251214-001',
      date: '2025-12-14',
      title: 'Packing List',
      status: 'completed',
    },
  ];

  // 文档类型标签
  const docTypeLabels: Record<string, { label: string; color: string }> = {
    inquiry: { label: 'Inquiry', color: 'bg-blue-100 text-blue-700' },
    quotation: { label: 'Quotation', color: 'bg-purple-100 text-purple-700' },
    sc: { label: 'Sales Contract', color: 'bg-green-100 text-green-700' },
    pi: { label: 'Proforma Invoice', color: 'bg-yellow-100 text-yellow-700' },
    ci: { label: 'Commercial Invoice', color: 'bg-orange-100 text-orange-700' },
    pl: { label: 'Packing List', color: 'bg-pink-100 text-pink-700' },
  };

  // 状态标签
  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
    sent: { label: 'Pending', color: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  };

  // 过滤文档
  const filteredDocuments = documents.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       doc.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || doc.type === filterType;
    const matchStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // 获取文档数据（示例数据）
  const getDocumentData = (doc: DocumentItem) => {
    const baseCustomer = {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      position: 'Purchasing Manager',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
      country: 'United States'
    };

    const baseItems = [
      {
        itemNo: '1',
        productCode: 'EL-SW-001',
        description: 'Wall Switch, Single Pole, 15A, White',
        specifications: '120V AC, UL Listed',
        quantity: 5000,
        unit: 'pcs',
        unitPrice: 1.25,
        amount: 6250.00
      },
      {
        itemNo: '2',
        productCode: 'EL-OUT-002',
        description: 'Duplex Outlet, 15A, Tamper Resistant',
        specifications: '120V AC, UL Listed, TR',
        quantity: 3000,
        unit: 'pcs',
        unitPrice: 1.85,
        amount: 5550.00
      },
    ];

    switch (doc.type) {
      case 'inquiry':
        return {
          inquiryNo: doc.number,
          inquiryDate: doc.date,
          region: 'NA',
          customer: baseCustomer,
          items: baseItems.map(item => ({
            ...item,
            unitPrice: undefined,
            amount: undefined,
          })),
          notes: 'Please provide your best price for the items listed above.'
        } as CustomerInquiryData;

      case 'quotation':
        return {
          quotationNo: doc.number,
          quotationDate: doc.date,
          validUntil: '2025-12-31',
          inquiryRef: 'INQ-NA-20251210-001',
          region: 'NA',
          customer: baseCustomer,
          items: baseItems,
          subtotal: 11800.00,
          discount: 0,
          tax: 0,
          shipping: 4090.00,
          total: 15890.00,
          paymentTerms: '30% T/T in advance, 70% before shipment',
          deliveryTerms: 'FOB Shanghai',
          leadTime: '30 days after deposit received',
          validity: '30 days from quotation date',
          notes: 'Prices are quoted in USD and valid for 30 days.'
        } as QuotationData;

      case 'sc':
        return {
          contractNo: doc.number,
          contractDate: doc.date,
          quotationRef: 'QT-NA-20251211-001',
          region: 'NA',
          buyer: baseCustomer,
          seller: {
            companyName: '福建高盛达富建材有限公司',
            companyNameEn: 'Fujian COSUN Building Materials Co., Ltd.',
            address: '福建省福州市仓山区建新镇金山工业区',
            addressEn: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
            phone: '+86-591-8888-8888',
            email: 'sales@cosun-bm.com',
            representative: 'Zhang Wei',
            representativeEn: 'Mr. Zhang Wei'
          },
          items: baseItems,
          subtotal: 11800.00,
          discount: 0,
          tax: 0,
          shipping: 4090.00,
          total: 15890.00,
          paymentTerms: '30% T/T in advance, 70% before shipment',
          deliveryTerms: 'FOB Shanghai',
          deliveryDate: '2026-01-15',
          packingRequirements: 'Standard export carton with inner poly bag',
          inspectionTerms: 'SGS inspection before shipment',
          notes: 'Both parties agree to the terms and conditions stated above.'
        } as SalesContractData;

      case 'pi':
        return {
          invoiceNo: doc.number,
          invoiceDate: doc.date,
          contractRef: 'SC-NA-20251212-001',
          region: 'NA',
          buyer: baseCustomer,
          seller: {
            companyName: '福建高盛达富建材有限公司',
            companyNameEn: 'Fujian COSUN Building Materials Co., Ltd.',
            address: '福建省福州市仓山区建新镇金山工业区',
            addressEn: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
            phone: '+86-591-8888-8888',
            email: 'sales@cosun-bm.com',
            bankName: 'Bank of China, Fuzhou Branch',
            bankAccount: '1234567890123456789',
            swiftCode: 'BKCHCNBJ950'
          },
          items: baseItems,
          subtotal: 11800.00,
          discount: 0,
          tax: 0,
          shipping: 4090.00,
          total: 15890.00,
          paymentTerms: '30% T/T in advance, 70% before shipment',
          deliveryTerms: 'FOB Shanghai',
          notes: 'This is a proforma invoice for customs clearance purposes only.'
        } as ProformaInvoiceData;

      case 'ci':
        return {
          invoiceNo: doc.number,
          invoiceDate: doc.date,
          contractRef: 'SC-NA-20251212-001',
          region: 'NA',
          buyer: baseCustomer,
          seller: {
            companyName: '福建高盛达富建材有限公司',
            companyNameEn: 'Fujian COSUN Building Materials Co., Ltd.',
            address: '福建省福州市仓山区建新镇金山工业区',
            addressEn: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
            phone: '+86-591-8888-8888',
            email: 'sales@cosun-bm.com',
          },
          items: baseItems,
          subtotal: 11800.00,
          discount: 0,
          tax: 0,
          shipping: 4090.00,
          total: 15890.00,
          paymentTerms: '30% T/T in advance, 70% before shipment',
          deliveryTerms: 'FOB Shanghai',
          shippingInfo: {
            portOfLoading: 'Shanghai, China',
            portOfDischarge: 'Los Angeles, USA',
            vesselName: 'COSCO Glory',
            voyageNo: 'V2025-001',
            containerNo: 'COSU1234567',
            sealNo: 'SEAL123456',
            blNo: 'BL-2025-001'
          },
          notes: 'All goods have been shipped as per contract terms.'
        } as CommercialInvoiceData;

      case 'pl':
        return {
          packingListNo: doc.number,
          packingListDate: doc.date,
          invoiceRef: 'CI-NA-20251214-001',
          contractRef: 'SC-NA-20251212-001',
          region: 'NA',
          buyer: baseCustomer,
          seller: {
            companyName: '福建高盛达富建材有限公司',
            companyNameEn: 'Fujian COSUN Building Materials Co., Ltd.',
            address: '福建省福州市仓山区建新镇金山工业区',
            addressEn: 'Jinshan Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
            phone: '+86-591-8888-8888',
            email: 'sales@cosun-bm.com',
          },
          items: baseItems.map(item => ({
            ...item,
            cartonNo: '1-50',
            grossWeight: item.quantity * 0.15,
            netWeight: item.quantity * 0.12,
            measurements: '60x40x30 cm',
            cartons: Math.ceil(item.quantity / 100)
          })),
          shippingInfo: {
            portOfLoading: 'Shanghai, China',
            portOfDischarge: 'Los Angeles, USA',
            vesselName: 'COSCO Glory',
            voyageNo: 'V2025-001',
            containerNo: 'COSU1234567',
            sealNo: 'SEAL123456',
          },
          totalGrossWeight: 1125,
          totalNetWeight: 900,
          totalCartons: 80,
          totalCbm: 5.76,
          notes: 'Handle with care. Keep dry.'
        } as PackingListData;

      default:
        return null;
    }
  };

  // 渲染文档预览
  const renderDocumentPreview = (doc: DocumentItem) => {
    const data = getDocumentData(doc);
    if (!data) return null;

    switch (doc.type) {
      case 'inquiry':
        return <CustomerInquiryDocument data={data as CustomerInquiryData} />;
      case 'quotation':
        return <QuotationDocument data={data as QuotationData} />;
      case 'sc':
        return <SalesContractDocument data={data as SalesContractData} />;
      case 'pi':
        return <ProformaInvoiceDocument data={data as ProformaInvoiceData} />;
      case 'ci':
        return <CommercialInvoiceDocument data={data as CommercialInvoiceData} />;
      case 'pl':
        return <PackingListDocument data={data as PackingListData} />;
      default:
        return null;
    }
  };

  // 下载PDF
  const handleDownloadPDF = async () => {
    if (!documentRef.current || !previewDoc) return;

    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${previewDoc.number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // 打印
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 文档列表视图 */}
      {!previewDoc && (
        <>
          {/* 页面标题 */}
          <div>
            <h2 className="text-gray-900 mb-2">My Documents</h2>
            <p className="text-gray-600">View and download all your business documents</p>
          </div>

          {/* 搜索和筛选 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 文档类型筛选 */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="quotation">Quotation</option>
                  <option value="sc">Sales Contract</option>
                  <option value="pi">Proforma Invoice</option>
                  <option value="ci">Commercial Invoice</option>
                  <option value="pl">Packing List</option>
                </select>
              </div>

              {/* 状态筛选 */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* 文档列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Document Type</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Document No.</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Title</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Date</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Amount</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Status</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-gray-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Badge className={docTypeLabels[doc.type].color}>
                          {docTypeLabels[doc.type].label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{doc.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{doc.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{doc.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.amount && (
                          <span className="text-gray-900">{doc.amount}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusLabels[doc.status].color}>
                          {statusLabels[doc.status].label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewDoc(doc)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* 文档预览视图 */}
      {previewDoc && (
        <>
          {/* 预览工具栏 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDoc(null)}
                  className="gap-2"
                >
                  ← Back to List
                </Button>
                <div>
                  <h3 className="text-gray-900">{previewDoc.title}</h3>
                  <p className="text-gray-600">{previewDoc.number}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="gap-2 bg-[#F96302] hover:bg-[#E55502]"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          {/* A4文档预览 */}
          <div className="flex justify-center">
            <div ref={documentRef}>
              <A4PageContainer>
                {renderDocumentPreview(previewDoc)}
              </A4PageContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
