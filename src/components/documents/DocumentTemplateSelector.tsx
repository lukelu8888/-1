/**
 * 📄 文档模板选择器
 * 
 * 用途：
 * 1. 在各个角色工作台中集成文档模板功能
 * 2. 根据角色显示可用的文档模板
 * 3. 支持快速预览和生成文档
 */

import React, { useState, useRef } from 'react';
import { FileText, Eye, Download, X, Printer, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { 
  getTemplatesByRole, 
  getTemplateById, 
  DOCUMENT_TEMPLATES,
  DOCUMENT_CATEGORIES 
} from '../../lib/services/document-template-service';
import { A4PageContainer } from './A4PageContainer';
import { SalesContractDocument } from './templates/SalesContractDocument';
import { StatementOfAccountDocument } from './templates/StatementOfAccountDocument';
import { CommercialInvoiceDocument } from './templates/CommercialInvoiceDocument';
import { PackingListDocument } from './templates/PackingListDocument';
import { ProformaInvoiceDocument } from './templates/ProformaInvoiceDocument';
import { CustomerInquiryDocument } from './templates/CustomerInquiryDocument';
import { QuotationDocument } from './templates/QuotationDocument';
import { PurchaseOrderDocument } from './templates/PurchaseOrderDocument';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DocumentTemplateSelectorProps {
  userRole: string;
  onSelectTemplate?: (templateId: string) => void;
  mode?: 'compact' | 'full'; // compact: 紧凑模式, full: 完整模式
}

export function DocumentTemplateSelector({ 
  userRole, 
  onSelectTemplate,
  mode = 'full' 
}: DocumentTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const documentRef = useRef<HTMLDivElement>(null);

  // 获取当前角色可用的模板
  const availableTemplates = getTemplatesByRole(userRole);

  // 按分类过滤模板
  const filteredTemplates = activeCategory === 'all' 
    ? availableTemplates 
    : availableTemplates.filter(t => t.category === activeCategory);

  // 统计数据
  const stats = {
    total: availableTemplates.length,
    byCategory: Object.entries(DOCUMENT_CATEGORIES).map(([key, value]) => ({
      id: key,
      name: value.name,
      icon: value.icon,
      color: value.color,
      count: availableTemplates.filter(t => t.category === key).length
    }))
  };

  // 处理模板选择
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    }
  };

  // 处理预览
  const handlePreview = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowPreview(true);
  };

  // 渲染文档预览
  const renderDocumentPreview = () => {
    if (!selectedTemplate) return null;

    const template = getTemplateById(selectedTemplate);
    if (!template) return null;

    // 这里使用示例数据，实际应该从业务数据中获取
    const sampleData = getSampleDataForTemplate(selectedTemplate);

    return (
      <div ref={documentRef}>
        <A4PageContainer>
          {renderDocument(selectedTemplate, sampleData)}
        </A4PageContainer>
      </div>
    );
  };

  // 根据模板ID渲染对应的文档组件
  const renderDocument = (templateId: string, data: any) => {
    switch (templateId) {
      case 'inquiry':
        return <CustomerInquiryDocument data={data} />;
      case 'quotation':
        return <QuotationDocument data={data} />;
      case 'sc':
        return <SalesContractDocument data={data} />;
      case 'po':
        return <PurchaseOrderDocument data={data} />;
      case 'soa':
        return <StatementOfAccountDocument data={data} />;
      case 'ci':
        return <CommercialInvoiceDocument data={data} />;
      case 'pl':
        return <PackingListDocument data={data} />;
      case 'pi':
        return <ProformaInvoiceDocument data={data} />;
      default:
        return <div>未知模板</div>;
    }
  };

  // 下载PDF
  const handleDownload = async () => {
    if (!documentRef.current || !selectedTemplate) return;

    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const template = getTemplateById(selectedTemplate);
      pdf.save(`${template?.name}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('PDF生成失败:', error);
      alert('PDF生成失败，请重试');
    }
  };

  // 打印
  const handlePrint = () => {
    window.print();
  };

  if (mode === 'compact') {
    // 紧凑模式：只显示快速访问按钮
    return (
      <div className="flex flex-wrap gap-2">
        {availableTemplates.map(template => (
          <Button
            key={template.id}
            size="sm"
            variant="outline"
            onClick={() => handlePreview(template.id)}
            className="gap-2"
          >
            <span>{template.icon}</span>
            <span>{template.name}</span>
          </Button>
        ))}

        {/* 预览对话框 */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedTemplate && getTemplateById(selectedTemplate)?.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    打印
                  </Button>
                  <Button size="sm" onClick={handleDownload} style={{ background: '#F96302' }}>
                    <Download className="w-4 h-4 mr-2" />
                    下载PDF
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            {renderDocumentPreview()}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 完整模式：显示完整的模板库界面
  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">文档模板库</h3>
            <p className="text-sm text-slate-600">共 {stats.total} 个可用模板</p>
          </div>
          <FileText className="w-10 h-10 text-slate-400" />
        </div>

        {/* 分类统计 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-[#F96302] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            全部 ({stats.total})
          </button>
          {stats.byCategory.map(cat => (
            cat.count > 0 && (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
                style={{
                  backgroundColor: activeCategory === cat.id ? cat.color : undefined
                }}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name} ({cat.count})
              </button>
            )
          ))}
        </div>
      </div>

      {/* 模板网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-lg border border-slate-200 hover:border-[#F96302] hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="p-4">
              {/* 图标和标题 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{template.name}</h4>
                    <p className="text-xs text-slate-500">{template.nameEn}</p>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{template.description}</p>

              {/* 业务阶段标签 */}
              <Badge 
                variant="outline" 
                className="text-xs mb-3"
                style={{ 
                  borderColor: template.color,
                  color: template.color
                }}
              >
                {template.businessStage}
              </Badge>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(template.id)}
                  className="flex-1 gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  预览
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSelectTemplate(template.id)}
                  className="flex-1 gap-1"
                  style={{ background: template.color }}
                >
                  使用
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">该分类下暂无可用模板</p>
        </div>
      )}

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTemplate && getTemplateById(selectedTemplate)?.name}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  打印
                </Button>
                <Button size="sm" onClick={handleDownload} style={{ background: '#F96302' }}>
                  <Download className="w-4 h-4 mr-2" />
                  下载PDF
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate && getTemplateById(selectedTemplate)?.description}
            </DialogDescription>
          </DialogHeader>
          {renderDocumentPreview()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 获取示例数据（简化版，实际应该从真实业务数据中获取）
function getSampleDataForTemplate(templateId: string): any {
  // 这里返回各个模板的示例数据
  // 实际使用时应该从业务系统中获取真实数据
  const commonData = {
    company: {
      name: '福建高盛达富建材有限公司',
      nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
      address: '福建省厦门市XX区XX路XX号',
      addressEn: 'XX Road, XX District, Xiamen, Fujian, China',
      tel: '+86-592-1234-5678',
      email: 'info@cosun-bm.com'
    },
    customer: {
      companyName: 'ABC Trading Corporation',
      contactPerson: 'John Smith',
      position: 'Purchasing Manager',
      email: 'john.smith@abctrading.com',
      phone: '+1-323-555-0123',
      address: '123 Main Street, Suite 500, Los Angeles, CA 90001',
      country: 'United States'
    }
  };

  // 根据不同模板返回对应的示例数据
  switch (templateId) {
    case 'inquiry':
      return {
        inquiryNo: 'INQ-NA-20251210-001',
        inquiryDate: '2025-12-10',
        region: 'NA',
        customer: commonData.customer,
        products: [
          {
            no: 1,
            productName: 'GFCI Outlet',
            specification: '20A, 125V, Tamper-Resistant',
            quantity: 5000,
            unit: 'pcs',
            targetPrice: 2.50,
            currency: 'USD'
          }
        ],
        requirements: {
          deliveryTime: 'Before March 15, 2026',
          portOfDestination: 'Los Angeles, USA',
          paymentTerms: 'T/T or L/C at sight',
          tradeTerms: 'FOB Xiamen',
          certifications: ['UL', 'FCC']
        }
      };
    
    case 'quotation':
      return {
        quotationNo: 'QT-NA-20251210-001',
        quotationDate: '2025-12-10',
        validUntil: '2026-01-10',
        inquiryNo: 'INQ-NA-20251210-001',
        region: 'NA',
        supplier: commonData.company,
        buyer: commonData.customer,
        products: [
          {
            no: 1,
            productName: 'GFCI Outlet',
            specification: '20A, 125V, Tamper-Resistant',
            quantity: 5000,
            unit: 'pcs',
            unitPrice: 2.85,
            currency: 'USD',
            amount: 14250.00
          }
        ],
        tradeTerms: 'FOB XIAMEN',
        paymentTerms: 'T/T, 30% deposit, 70% before shipment'
      };

    case 'sc':
      return {
        contractNo: 'SC-NA-20251220-001',
        contractDate: '2025-12-20',
        quotationNo: 'QT-NA-20251210-001',
        seller: commonData.company,
        buyer: commonData.customer,
        products: [
          {
            no: 1,
            productName: 'GFCI Outlet',
            specification: '20A, 125V, Tamper-Resistant',
            quantity: 5000,
            unit: 'pcs',
            unitPrice: 2.85,
            currency: 'USD',
            amount: 14250.00
          }
        ],
        tradeTerms: 'FOB XIAMEN',
        paymentTerms: 'T/T, 30% deposit, 70% before shipment',
        portOfLoading: 'Xiamen, China',
        portOfDestination: 'Los Angeles, USA',
        deliveryTime: 'Within 30 days after receiving deposit',
        packingRequirements: 'Export standard carton packing'
      };

    case 'po':
      return {
        poNo: 'PO-20251205-001',
        poDate: '2025-12-05',
        contractNo: 'SC-NA-20251220-001',
        buyer: commonData.company,
        supplier: {
          companyName: 'Supplier Company Ltd.',
          address: 'Supplier Address',
          tel: '+86-123-4567-8900',
          contact: 'Supplier Contact'
        },
        products: [
          {
            no: 1,
            productName: 'GFCI Outlet Components',
            specification: 'According to technical drawing',
            quantity: 5000,
            unit: 'pcs',
            unitPrice: 1.50,
            currency: 'USD',
            amount: 7500.00
          }
        ],
        paymentTerms: 'T/T, 30% deposit, 70% before delivery',
        deliveryTime: 'Within 20 days after order confirmation'
      };

    case 'ci':
      return {
        invoiceNo: 'CI-20260215-001',
        invoiceDate: '2026-02-15',
        contractNo: 'SC-NA-20251220-001',
        exporter: {
          name: commonData.company.name,
          nameEn: commonData.company.nameEn,
          address: commonData.company.address,
          addressEn: commonData.company.addressEn,
          tel: commonData.company.tel
        },
        importer: {
          name: commonData.customer.companyName,
          address: commonData.customer.address,
          country: commonData.customer.country,
          tel: commonData.customer.phone
        },
        shippingMarks: {
          mainMark: 'ABC-LA-001',
          sideMark: 'C/NO. 1-50',
          cautionMark: 'MADE IN CHINA\\nFRAGILE - HANDLE WITH CARE'
        },
        goods: [
          {
            no: 1,
            description: 'GFCI Outlet, 20A 125V, Tamper-Resistant',
            hsCode: '8536.6990',
            quantity: 5000,
            unit: 'PCS',
            unitPrice: 2.85,
            currency: 'USD',
            amount: 14250.00,
            grossWeight: 0.25,
            netWeight: 0.22
          }
        ],
        shipping: {
          tradeTerms: 'FOB XIAMEN',
          paymentTerms: 'T/T',
          portOfLoading: 'Xiamen Port, China',
          portOfDischarge: 'Los Angeles Port, USA',
          vesselName: 'COSCO SHIPPING',
          voyageNo: 'V123'
        },
        packing: {
          totalPackages: 50,
          packageType: 'CARTONS',
          totalGrossWeight: 1250,
          totalNetWeight: 1100,
          measurement: 12.5
        }
      };

    case 'pl':
      return {
        plNo: 'PL-20260215-001',
        invoiceNo: 'CI-20260215-001',
        date: '2026-02-15',
        exporter: {
          name: commonData.company.nameEn,
          address: commonData.company.addressEn
        },
        importer: {
          name: commonData.customer.companyName,
          address: commonData.customer.address
        },
        shippingMarks: 'ABC-LA-001\nC/NO. 1-50\nMADE IN CHINA\nFRAGILE - HANDLE WITH CARE',
        packages: [
          {
            cartonNo: '1-50',
            description: 'GFCI Outlet, 20A 125V, Tamper-Resistant',
            qtyPerCarton: 100,
            totalCartons: 50,
            totalQty: 5000,
            unit: 'PCS',
            netWeight: 22,
            grossWeight: 25,
            measurement: 0.25,
            totalNW: 1100,
            totalGW: 1250,
            totalCBM: 12.5
          }
        ],
        shipping: {
          portOfLoading: 'Xiamen Port, China',
          portOfDischarge: 'Los Angeles Port, USA',
          vesselName: 'COSCO SHIPPING',
          blNo: 'BL-20260215-001'
        }
      };

    case 'pi':
      return {
        invoiceNo: 'PI-20251215-001',
        invoiceDate: '2025-12-15',
        quotationNo: 'QT-NA-20251210-001',
        seller: commonData.company,
        buyer: commonData.customer,
        products: [
          {
            no: 1,
            productName: 'GFCI Outlet',
            specification: '20A, 125V, Tamper-Resistant',
            quantity: 5000,
            unit: 'pcs',
            unitPrice: 2.85,
            currency: 'USD',
            amount: 14250.00
          }
        ],
        tradeTerms: 'FOB XIAMEN',
        paymentTerms: 'T/T, 30% deposit ($4,275.00), 70% before shipment ($9,975.00)',
        deliveryTime: 'Within 30 days after receiving deposit',
        validUntil: '2026-01-15',
        bankDetails: {
          bankName: 'Bank of China Xiamen Branch',
          accountName: commonData.company.nameEn,
          accountNo: '1234567890',
          swiftCode: 'BKCHCNBJ'
        }
      };

    case 'soa':
      return {
        statementNo: 'SOA-20251231-001',
        statementDate: '2025-12-31',
        periodFrom: '2025-10-01',
        periodTo: '2025-12-31',
        company: commonData.company,
        customer: commonData.customer,
        openingBalance: {
          amount: 0,
          currency: 'USD',
          type: 'credit' as const
        },
        transactions: [
          {
            date: '2025-10-15',
            type: 'invoice' as const,
            referenceNo: 'CI-20251015-001',
            description: 'Invoice for Order #SO-001',
            debit: 12000.00,
            balance: 12000.00,
            currency: 'USD'
          },
          {
            date: '2025-10-25',
            type: 'payment' as const,
            referenceNo: 'PMT-20251025-001',
            description: 'T/T Payment Received',
            credit: 12000.00,
            balance: 0.00,
            currency: 'USD'
          }
        ],
        closingBalance: {
          amount: 0.00,
          currency: 'USD',
          type: 'credit' as const
        },
        agingAnalysis: {
          current: 0.00,
          days30: 0.00,
          days60: 0.00,
          days90Plus: 0.00
        }
      };

    // 其他模板的示例数据...
    default:
      return {};
  }
}
