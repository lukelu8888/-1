import React, { useMemo, useRef, useState } from 'react';
import { FileText, Eye, Download, Printer, Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { A4PageContainer } from '../documents/A4PageContainer';
import { CustomerInquiryDocument } from '../documents/templates/CustomerInquiryDocument';
import { QuotationDocument } from '../documents/templates/QuotationDocument';
import { SalesContractDocument } from '../documents/templates/SalesContractDocument';
import { CommercialInvoiceDocument } from '../documents/templates/CommercialInvoiceDocument';
import { PackingListDocument } from '../documents/templates/PackingListDocument';
import type { CustomerInquiryData } from '../documents/templates/CustomerInquiryDocument';
import type { QuotationData } from '../documents/templates/QuotationDocument';
import type { SalesContractData } from '../documents/templates/SalesContractDocument';
import type { CommercialInvoiceData } from '../documents/templates/CommercialInvoiceDocument';
import type { PackingListData } from '../documents/templates/PackingListDocument';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useInquiry } from '../../contexts/InquiryContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { useSalesContracts } from '../../contexts/SalesContractContext';
import { useOrders } from '../../contexts/OrderContext';
import { useUser } from '../../contexts/UserContext';
import type { BusinessDomain } from '../../lib/erp-core/types';
import { resolveDisplayNumber } from '../../lib/erp-core/number-display';
import { getStoredAdminOrgProfile } from '../../contexts/AdminOrganizationContext';
import {
  adaptInquiryToDocumentData,
  adaptSalesContractToCommercialInvoice,
  adaptSalesContractToDocumentData,
  adaptSalesContractToPackingList,
  adaptSalesQuotationToDocumentData,
} from '../../utils/documentDataAdapters';

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
  type: 'ing' | 'qt' | 'sc' | 'ci' | 'pl';
  number: string;
  externalNumber?: string;
  date: string;
  title: string;
  status: 'draft' | 'sent' | 'confirmed' | 'completed';
  amount?: string;
  sourceRecord?: any;
  sourceOrder?: any;
}

export function MyDocuments() {
  const { user } = useUser();
  const { getUserInquiries } = useInquiry();
  const { quotations: allQuotations } = useSalesQuotations();
  const { contracts } = useSalesContracts();
  const { orders } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const currentEmail = String(user?.email || '').toLowerCase();
  const companyId = (user as any)?.companyId ? String((user as any).companyId) : undefined;

  const formatAmount = (amount?: number, currency?: string) => {
    if (typeof amount !== 'number' || Number.isNaN(amount)) return undefined;
    const code = (currency || 'USD').toUpperCase();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const mapInquiryStatus = (status?: string): DocumentItem['status'] => {
    const s = String(status || '').toLowerCase();
    if (s === 'draft') return 'draft';
    if (s === 'pending' || s === 'quoted') return 'sent';
    return 'confirmed';
  };

  const mapQuotationStatus = (customerStatus?: string): DocumentItem['status'] => {
    const s = String(customerStatus || '').toLowerCase();
    if (s === 'not_sent') return 'draft';
    if (s === 'sent' || s === 'viewed' || s === 'negotiating') return 'sent';
    if (s === 'accepted') return 'confirmed';
    return 'completed';
  };

  const mapContractStatus = (status?: string): DocumentItem['status'] => {
    const s = String(status || '').toLowerCase();
    if (s === 'draft' || s === 'pending_supervisor' || s === 'pending_director') return 'draft';
    if (s === 'approved' || s === 'sent') return 'sent';
    if (s === 'completed' || s === 'cancelled' || s === 'rejected') return 'completed';
    return 'confirmed';
  };

  const getMappedExternalNo = (domain: BusinessDomain, internalNo: string) => {
    if (!internalNo) return undefined;
    return resolveDisplayNumber({ domain, internalNo, companyId }).externalNo;
  };

  const documents: DocumentItem[] = useMemo(() => {
    const result: DocumentItem[] = [];
    if (!currentEmail) return result;

    const inquiries = getUserInquiries(currentEmail);
    inquiries.forEach((inq: any) => {
      const number = inq.inquiryNumber || inq.id || 'N/A';
      const firstProduct = inq.products?.[0]?.productName || inq.products?.[0]?.name || 'Inquiry';
      result.push({
        id: `inq-${inq.id}`,
        type: 'ing',
        number,
        externalNumber: getMappedExternalNo('ing', number),
        date: String(inq.date || '').slice(0, 10) || new Date(inq.createdAt || Date.now()).toISOString().slice(0, 10),
        title: String(firstProduct),
        status: mapInquiryStatus(inq.status),
        sourceRecord: inq,
      });
    });

    const quotations = (allQuotations || []).filter((q: any) => String(q.customerEmail || '').toLowerCase() === currentEmail);
    quotations.forEach((qt: any) => {
      const firstProduct = qt.items?.[0]?.productName || 'Quotation';
      result.push({
        id: `qt-${qt.id}`,
        type: 'qt',
        number: qt.qtNumber || qt.id,
        externalNumber: getMappedExternalNo('qt', qt.qtNumber || qt.id),
        date: String(qt.createdAt || '').slice(0, 10),
        title: `Quotation - ${firstProduct}`,
        status: mapQuotationStatus(qt.customerStatus),
        amount: formatAmount(Number(qt.totalPrice || 0), qt.currency),
        sourceRecord: qt,
      });
    });

    const customerContracts = (contracts || []).filter((c: any) => String(c.customerEmail || '').toLowerCase() === currentEmail);
    customerContracts.forEach((sc: any) => {
      const baseDate = String(sc.updatedAt || sc.createdAt || '').slice(0, 10);
      const amount = formatAmount(Number(sc.totalAmount || 0), sc.currency);
      const scStatus = mapContractStatus(sc.status);
      const scNo = sc.contractNumber || sc.id;
      const order = (orders || []).find((o: any) => (o.orderNumber || o.id) === scNo);
      const orderStatus = String(order?.status || '').toLowerCase();

      result.push({
        id: `sc-${sc.id}`,
        type: 'sc',
        number: scNo,
        externalNumber: getMappedExternalNo('contract', scNo),
        date: baseDate,
        title: `Sales Contract - ${sc.customerCompany || sc.customerName || 'Customer'}`,
        status: scStatus,
        amount,
        sourceRecord: sc,
        sourceOrder: order,
      });

      if (orderStatus === 'shipped' || orderStatus === 'delivered' || String(sc.status || '').toLowerCase() === 'completed') {
        result.push({
          id: `ci-${sc.id}`,
          type: 'ci',
          number: `CI-${scNo}`,
          externalNumber: getMappedExternalNo('document', `CI-${scNo}`),
          date: baseDate,
          title: 'Commercial Invoice',
          status: orderStatus === 'delivered' ? 'completed' : 'confirmed',
          amount,
          sourceRecord: sc,
          sourceOrder: order,
        });
        result.push({
          id: `pl-${sc.id}`,
          type: 'pl',
          number: `PL-${scNo}`,
          externalNumber: getMappedExternalNo('document', `PL-${scNo}`),
          date: baseDate,
          title: 'Packing List',
          status: orderStatus === 'delivered' ? 'completed' : 'confirmed',
          amount,
          sourceRecord: sc,
          sourceOrder: order,
        });
      }
    });

    return result.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allQuotations, contracts, currentEmail, getUserInquiries, orders]);

  // 文档类型标签
  const docTypeLabels: Record<string, { label: string; color: string }> = {
    ing: { label: 'ING', color: 'bg-blue-100 text-blue-700' },
    qt: { label: 'QT', color: 'bg-purple-100 text-purple-700' },
    sc: { label: 'Sales Contract', color: 'bg-green-100 text-green-700' },
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
    if (doc.type === 'ing' && doc.sourceRecord) {
      return adaptInquiryToDocumentData(doc.sourceRecord) as CustomerInquiryData;
    }
    if (doc.type === 'qt' && doc.sourceRecord) {
      return adaptSalesQuotationToDocumentData(doc.sourceRecord) as QuotationData;
    }
    if (doc.type === 'sc' && doc.sourceRecord) {
      return adaptSalesContractToDocumentData(doc.sourceRecord) as SalesContractData;
    }
    if (doc.type === 'ci' && doc.sourceRecord) {
      return adaptSalesContractToCommercialInvoice(doc.sourceRecord, doc.sourceOrder) as CommercialInvoiceData;
    }
    if (doc.type === 'pl' && doc.sourceRecord) {
      return adaptSalesContractToPackingList(doc.sourceRecord, doc.sourceOrder) as PackingListData;
    }

    const adminOrg = getStoredAdminOrgProfile();
    const sellerInfo = {
      companyName: String(adminOrg.nameCN || ''),
      companyNameEn: String(adminOrg.nameEN || adminOrg.nameCN || ''),
      address: String(adminOrg.addressCN || ''),
      addressEn: String(adminOrg.addressEN || adminOrg.addressCN || ''),
      phone: String(adminOrg.phone || ''),
      email: String(adminOrg.email || ''),
    };
    const usdBank = adminOrg.bankUSD;
    const baseCustomer = {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      position: 'Purchasing Manager',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
      country: 'United States',
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
        amount: 6250.0,
      },
      {
        itemNo: '2',
        productCode: 'EL-OUT-002',
        description: 'Duplex Outlet, 15A, Tamper Resistant',
        specifications: '120V AC, UL Listed, TR',
        quantity: 3000,
        unit: 'pcs',
        unitPrice: 1.85,
        amount: 5550.0,
      },
    ];
    const quotationTradeTerms = {
      incoterms: 'FOB Shanghai',
      paymentTerms: '30% T/T in advance, 70% before shipment',
      deliveryTime: '30 days after deposit received',
      packing: 'Standard export carton with inner poly bag',
      portOfLoading: 'Shanghai, China',
      portOfDestination: 'Los Angeles, USA',
      warranty: '12 months after shipment',
      inspection: 'Seller self-inspection before shipment',
    };
    const salesPerson = {
      name: String(adminOrg.contactPerson || adminOrg.defaultSignatory || 'Luke'),
      position: 'Sales Representative',
      email: sellerInfo.email,
      phone: sellerInfo.phone,
    };

    switch (doc.type) {
      case 'ing':
        return {
          inquiryNo: doc.number,
          inquiryDate: doc.date,
          region: 'NA',
          customer: baseCustomer,
          items: baseItems.map((item) => ({
            ...item,
            unitPrice: undefined,
            amount: undefined,
          })),
          notes: 'Please provide your best price for the items listed above.',
        } as CustomerInquiryData;

      case 'qt':
        return {
          quotationNo: doc.number,
          quotationDate: doc.date,
          validUntil: '2025-12-31',
          inquiryNo: 'ING-NA-20251210-001',
          region: 'NA',
          company: {
            name: sellerInfo.companyName,
            nameEn: sellerInfo.companyNameEn,
            address: sellerInfo.address,
            addressEn: sellerInfo.addressEn,
            tel: sellerInfo.phone,
            email: sellerInfo.email,
          },
          customer: {
            companyName: baseCustomer.companyName,
            contactPerson: baseCustomer.contactPerson,
            address: baseCustomer.address,
            email: baseCustomer.email,
            phone: baseCustomer.phone,
          },
          products: baseItems.map((item, index) => ({
            no: index + 1,
            modelNo: '-',
            productName: item.description,
            specification: item.specifications,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            currency: 'USD',
            amount: item.amount,
          })),
          tradeTerms: quotationTradeTerms,
          remarks: 'Prices are quoted in USD and valid for 30 days.',
          salesPerson,
        } as QuotationData;

      case 'sc':
        return {
          contractNo: doc.number,
          contractDate: doc.date,
          quotationNo: 'QT-NA-20251211-001',
          region: 'NA',
          buyer: {
            companyName: baseCustomer.companyName,
            address: baseCustomer.address,
            country: baseCustomer.country,
            contactPerson: baseCustomer.contactPerson,
            tel: baseCustomer.phone,
            email: baseCustomer.email,
          },
          seller: {
            name: sellerInfo.companyName,
            nameEn: sellerInfo.companyNameEn,
            address: sellerInfo.address,
            addressEn: sellerInfo.addressEn,
            tel: sellerInfo.phone,
            email: sellerInfo.email,
            legalRepresentative: String(adminOrg.contactPerson || adminOrg.defaultSignatory || ''),
            bankInfo: {
              bankName: String(usdBank.bankNameEN || usdBank.bankNameCN || ''),
              accountName: String(usdBank.accountNameEN || usdBank.accountNameCN || sellerInfo.companyNameEn || sellerInfo.companyName),
              accountNumber: String(usdBank.accountNumber || ''),
              swiftCode: String(usdBank.swiftCode || ''),
              bankAddress: String(usdBank.bankAddress || ''),
              paymentNote: String(usdBank.paymentNote || ''),
              currency: 'USD',
            },
          },
          products: baseItems.map((item, index) => ({
            no: index + 1,
            modelNo: '-',
            description: item.description,
            specification: item.specifications,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            currency: 'USD',
            amount: item.amount,
          })),
          terms: {
            totalAmount: 11800.0,
            currency: 'USD',
            tradeTerms: quotationTradeTerms.incoterms,
            paymentTerms: quotationTradeTerms.paymentTerms,
            depositAmount: 3540.0,
            balanceAmount: 8260.0,
            deliveryTime: quotationTradeTerms.deliveryTime,
            portOfLoading: quotationTradeTerms.portOfLoading,
            portOfDestination: quotationTradeTerms.portOfDestination || '',
            packing: quotationTradeTerms.packing,
            inspection: 'SGS inspection before shipment',
          },
        } as SalesContractData;

      case 'ci':
        return {
          invoiceNo: doc.number,
          invoiceDate: doc.date,
          contractNo: 'SC-NA-20251212-001',
          exporter: {
            name: sellerInfo.companyName,
            nameEn: sellerInfo.companyNameEn,
            address: sellerInfo.address,
            addressEn: sellerInfo.addressEn,
            tel: sellerInfo.phone,
          },
          importer: {
            name: baseCustomer.companyName,
            address: baseCustomer.address,
            country: baseCustomer.country,
            tel: baseCustomer.phone,
          },
          shippingMarks: {
            mainMark: 'ABC-LA-001',
            sideMark: 'C/NO. 1-50',
            cautionMark: 'MADE IN CHINA\nFRAGILE - HANDLE WITH CARE',
          },
          goods: baseItems.map((item, index) => ({
            no: index + 1,
            description: `${item.description}, ${item.specifications}`,
            hsCode: '8536.6990',
            quantity: item.quantity,
            unit: item.unit.toUpperCase(),
            unitPrice: item.unitPrice,
            currency: 'USD',
            amount: item.amount,
            grossWeight: item.quantity * 0.15,
            netWeight: item.quantity * 0.12,
            measurement: item.quantity * 0.0008,
          })),
          shipping: {
            tradeTerms: 'FOB Shanghai',
            paymentTerms: '30% T/T in advance, 70% before shipment',
            portOfLoading: 'Shanghai, China',
            portOfDischarge: 'Los Angeles, USA',
            finalDestination: 'Los Angeles, USA',
            vesselName: 'COSCO Glory',
            voyageNo: 'V2025-001',
            blNo: 'BL-2025-001',
          },
          packing: {
            totalCartons: 80,
            totalGrossWeight: 1250,
            totalNetWeight: 1000,
            totalMeasurement: 5.76,
          },
        } as CommercialInvoiceData;

      case 'pl':
        return {
          plNo: doc.number,
          invoiceNo: 'CI-NA-20251214-001',
          date: doc.date,
          exporter: {
            name: sellerInfo.companyNameEn || sellerInfo.companyName,
            address: sellerInfo.addressEn || sellerInfo.address,
          },
          importer: {
            name: baseCustomer.companyName,
            address: baseCustomer.address,
          },
          shippingMarks: 'ABC-LA-001\nC/NO. 1-50\nMADE IN CHINA\nFRAGILE - HANDLE WITH CARE',
          packages: baseItems.map((item) => ({
            cartonNo: '1-50',
            description: `${item.description}, ${item.specifications}`,
            qtyPerCarton: 100,
            totalCartons: Math.ceil(item.quantity / 100),
            totalQty: item.quantity,
            unit: item.unit.toUpperCase(),
            netWeight: 12,
            grossWeight: 15,
            measurement: 0.072,
            totalNW: Math.ceil(item.quantity / 100) * 12,
            totalGW: Math.ceil(item.quantity / 100) * 15,
            totalCBM: Math.ceil(item.quantity / 100) * 0.072,
          })),
          shipping: {
            portOfLoading: 'Shanghai, China',
            portOfDischarge: 'Los Angeles, USA',
            vesselName: 'COSCO Glory',
            blNo: 'BL-2025-001',
          },
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
      case 'ing':
        return <CustomerInquiryDocument data={data as CustomerInquiryData} />;
      case 'qt':
        return <QuotationDocument data={data as QuotationData} />;
      case 'sc':
        return <SalesContractDocument data={data as SalesContractData} />;
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
                  <option value="ing">Inquiry</option>
                  <option value="qt">Quotation</option>
                  <option value="sc">Sales Contract</option>
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
                        <div className="space-y-0.5">
                          <span className="text-gray-900 block">{doc.number}</span>
                          {doc.externalNumber && doc.externalNumber !== doc.number && (
                            <span className="text-xs text-gray-500 block">Customer ERP: {doc.externalNumber}</span>
                          )}
                        </div>
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
