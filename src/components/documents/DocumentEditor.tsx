import React, { useState, useRef } from 'react';
import { 
  Edit, 
  Save, 
  Download, 
  Eye, 
  EyeOff, 
  FileText, 
  Plus, 
  Trash2, 
  Copy,
  Printer,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { CustomerInquiryDocument, CustomerInquiryData } from './templates/CustomerInquiryDocument';
import { QuotationDocument, QuotationData } from './templates/QuotationDocument';
import { SalesContractDocument, SalesContractData } from './templates/SalesContractDocument';
import { PurchaseOrderDocument, PurchaseOrderData } from './templates/PurchaseOrderDocument';
import { ProformaInvoiceDocument, ProformaInvoiceData } from './templates/ProformaInvoiceDocument';
import { SupplierRFQDocument, SupplierRFQData } from './templates/SupplierRFQDocument';
import { SupplierQuotationDocument, SupplierQuotationData } from './templates/SupplierQuotationDocument';
import { PurchaseRequirementDocument, PurchaseRequirementDocumentData } from './templates/PurchaseRequirementDocument';
import { StatementOfAccountDocument, StatementOfAccountData } from './templates/StatementOfAccountDocument';
import { CommercialInvoiceDocument, CommercialInvoiceData } from './templates/CommercialInvoiceDocument';
import { PackingListDocument, PackingListData } from './templates/PackingListDocument';
import { exportToPDFPrint } from '../../utils/pdfExport';

/**
 * 🎨 文档编辑器 - 通用文档编辑工具
 * 
 * 功能：
 * 1. ✅ 支持编辑所有文档类型
 * 2. ✅ 实时预览文档效果
 * 3. ✅ 智能字段识别和分组
 * 4. ✅ 支持保存和导出PDF
 * 5. ✅ 支持添加/删除产品行项目
 */

type DocumentType = 
  | 'inquiry'           // 客户询价单
  | 'quotation'         // 报价单
  | 'sales-contract'    // 销售合同
  | 'purchase-order'    // 采购订单
  | 'proforma-invoice'  // 形式发票
  | 'supplier-rfq'      // 供应商询价单
  | 'supplier-quotation' // 供应商报价单
  | 'purchase-requirement' // 采购需求单
  | 'statement'         // 对账单
  | 'commercial-invoice' // 商业发票
  | 'packing-list';     // 装箱单

type DocumentData = 
  | CustomerInquiryData 
  | QuotationData 
  | SalesContractData 
  | PurchaseOrderData 
  | ProformaInvoiceData
  | SupplierRFQData
  | SupplierQuotationData
  | PurchaseRequirementDocumentData
  | StatementOfAccountData
  | CommercialInvoiceData
  | PackingListData;

interface SavedDocument {
  id: string;
  type: DocumentType;
  name: string;
  data: DocumentData;
  createdAt: string;
  updatedAt: string;
}

export function DocumentEditor() {
  const [documentType, setDocumentType] = useState<DocumentType>('inquiry');
  const [documentData, setDocumentData] = useState<DocumentData>(getDefaultData('inquiry'));
  const [showPreview, setShowPreview] = useState(true);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const documentRef = useRef<HTMLDivElement>(null);

  // 文档类型配置
  const documentTypes = [
    { value: 'inquiry', label: '📋 客户询价单', color: 'blue' },
    { value: 'quotation', label: '💰 报价单', color: 'green' },
    { value: 'sales-contract', label: '📄 销售合同', color: 'purple' },
    { value: 'purchase-order', label: '🛒 采购订单', color: 'orange' },
    { value: 'proforma-invoice', label: '📜 形式发票', color: 'indigo' },
    { value: 'supplier-rfq', label: '📨 供应商询价单', color: 'cyan' },
    { value: 'supplier-quotation', label: '💵 供应商报价单', color: 'teal' },
    { value: 'purchase-requirement', label: '📋 采购需求单', color: 'amber' },
    { value: 'statement', label: '📊 对账单', color: 'pink' },
    { value: 'commercial-invoice', label: '🧾 商业发票', color: 'rose' },
    { value: 'packing-list', label: '📦 装箱单', color: 'lime' },
  ];

  // 切换文档类型
  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    setDocumentData(getDefaultData(type));
    setCurrentDocId(null);
  };

  // 切换章节展开/折叠
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // 更新字段值
  const updateField = (path: string, value: any) => {
    setDocumentData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData));
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // 获取字段值
  const getFieldValue = (path: string): any => {
    const keys = path.split('.');
    let current: any = documentData;
    
    for (const key of keys) {
      if (current === undefined || current === null) return '';
      current = current[key];
    }
    
    return current ?? '';
  };

  // 添加产品行
  const addProduct = () => {
    const data = documentData as any;
    const products = data.products || data.items || [];
    const newProduct = {
      no: products.length + 1,
      productName: '',
      specification: '',
      quantity: 0,
      unit: 'pcs',
      unitPrice: 0,
      totalPrice: 0,
      // 🔥 供应商报价单默认人民币
      ...(documentType === 'supplier-quotation' && { currency: 'CNY' })
    };
    
    if (data.products) {
      updateField('products', [...products, newProduct]);
    } else if (data.items) {
      updateField('items', [...products, newProduct]);
    }
  };

  // 删除产品行
  const removeProduct = (index: number) => {
    const data = documentData as any;
    const products = data.products || data.items || [];
    const filtered = products.filter((_: any, i: number) => i !== index);
    
    if (data.products) {
      updateField('products', filtered);
    } else if (data.items) {
      updateField('items', filtered);
    }
  };

  // 保存文档
  const handleSave = () => {
    const docName = prompt('请输入文档名称：', `${getDocTypeName(documentType)}_${new Date().toLocaleDateString()}`);
    if (!docName) return;

    const now = new Date().toISOString();
    
    if (currentDocId) {
      // 更新现有文档
      setSavedDocuments(prev => prev.map(doc => 
        doc.id === currentDocId 
          ? { ...doc, name: docName, data: documentData, updatedAt: now }
          : doc
      ));
      toast.success('文档已更新！');
    } else {
      // 创建新文档
      const newDoc: SavedDocument = {
        id: Date.now().toString(),
        type: documentType,
        name: docName,
        data: documentData,
        createdAt: now,
        updatedAt: now
      };
      setSavedDocuments(prev => [...prev, newDoc]);
      setCurrentDocId(newDoc.id);
      toast.success('文档已保存！');
    }
  };

  // 加载文档
  const handleLoad = (doc: SavedDocument) => {
    setDocumentType(doc.type);
    setDocumentData(doc.data);
    setCurrentDocId(doc.id);
    toast.success(`已加载文档：${doc.name}`);
  };

  // 删除文档
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个文档吗？')) {
      setSavedDocuments(prev => prev.filter(doc => doc.id !== id));
      if (currentDocId === id) {
        setCurrentDocId(null);
      }
      toast.success('文档已删除！');
    }
  };

  // 导出PDF
  const handleExportPDF = async () => {
    try {
      const filename = `${getDocTypeName(documentType)}_${new Date().toLocaleDateString()}.pdf`;
      await exportToPDFPrint('document-preview', filename);
      toast.success('PDF已导出！');
    } catch (error) {
      console.error('PDF导出失败:', error);
      toast.error('PDF导出失败');
    }
  };

  // 渲染文档预览
  const renderDocumentPreview = () => {
    switch (documentType) {
      case 'inquiry':
        return <CustomerInquiryDocument ref={documentRef} data={documentData as CustomerInquiryData} />;
      case 'quotation':
        return <QuotationDocument ref={documentRef} data={documentData as QuotationData} />;
      case 'sales-contract':
        return <SalesContractDocument ref={documentRef} data={documentData as SalesContractData} />;
      case 'purchase-order':
        return <PurchaseOrderDocument ref={documentRef} data={documentData as PurchaseOrderData} />;
      case 'proforma-invoice':
        return <ProformaInvoiceDocument ref={documentRef} data={documentData as ProformaInvoiceData} />;
      case 'supplier-rfq':
        return <SupplierRFQDocument ref={documentRef} data={documentData as SupplierRFQData} />;
      case 'supplier-quotation':
        return <SupplierQuotationDocument ref={documentRef} data={documentData as SupplierQuotationData} />;
      case 'purchase-requirement':
        return <PurchaseRequirementDocument ref={documentRef} data={documentData as PurchaseRequirementDocumentData} />;
      case 'statement':
        return <StatementOfAccountDocument ref={documentRef} data={documentData as StatementOfAccountData} />;
      case 'commercial-invoice':
        return <CommercialInvoiceDocument ref={documentRef} data={documentData as CommercialInvoiceData} />;
      case 'packing-list':
        return <PackingListDocument ref={documentRef} data={documentData as PackingListData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Edit className="w-6 h-6 text-[#F96302]" />
                <h1 className="text-xl font-bold text-gray-900">文档编辑器</h1>
              </div>
              
              {/* 文档类型选择 */}
              <Select value={documentType} onValueChange={(v) => handleDocumentTypeChange(v as DocumentType)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentDocId && (
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  已保存
                </Badge>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? '隐藏预览' : '显示预览'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                导出PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-2" />
                打印
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex">
        {/* 左侧：编辑表单 */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200 bg-white overflow-y-auto`} style={{ height: 'calc(100vh - 89px)' }}>
          <div className="p-6">
            <FieldEditor
              documentType={documentType}
              documentData={documentData}
              updateField={updateField}
              getFieldValue={getFieldValue}
              addProduct={addProduct}
              removeProduct={removeProduct}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
            />
          </div>
        </div>

        {/* 右侧：文档预览 */}
        {showPreview && (
          <div className="w-1/2 bg-gray-100 overflow-y-auto" style={{ height: 'calc(100vh - 89px)' }}>
            <div className="p-6">
              <div id="document-preview">
                {renderDocumentPreview()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部：已保存文档列表 */}
      {savedDocuments.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="px-6 py-3">
            <div className="flex items-center gap-4 overflow-x-auto">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">已保存文档：</span>
              {savedDocuments.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm whitespace-nowrap">{doc.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleLoad(doc)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 字段编辑器组件
interface FieldEditorProps {
  documentType: DocumentType;
  documentData: DocumentData;
  updateField: (path: string, value: any) => void;
  getFieldValue: (path: string) => any;
  addProduct: () => void;
  removeProduct: (index: number) => void;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
}

function FieldEditor({ 
  documentType, 
  documentData, 
  updateField, 
  getFieldValue,
  addProduct,
  removeProduct,
  expandedSections,
  toggleSection
}: FieldEditorProps) {
  // 根据文档类型渲染不同的编辑表单
  const renderFields = () => {
    const data = documentData as any;
    
    return (
      <div className="space-y-4">
        {/* 基本信息 */}
        <Section title="基本信息" id="basic" expanded={expandedSections.has('basic')} onToggle={toggleSection}>
          <div className="grid grid-cols-2 gap-4">
            {renderBasicFields(documentType, data, updateField, getFieldValue)}
          </div>
        </Section>

        {/* 客户/供应商信息 */}
        {(data.customer || data.buyer || data.supplier) && (
          <Section title={data.customer ? '客户信息' : data.supplier ? '供应商信息' : '买方信息'} id="party" expanded={expandedSections.has('party')} onToggle={toggleSection}>
            <div className="grid grid-cols-2 gap-4">
              {renderPartyFields(documentType, data, updateField, getFieldValue)}
            </div>
          </Section>
        )}

        {/* 产品清单 */}
        {(data.products || data.items) && (
          <Section title="产品清单" id="products" expanded={expandedSections.has('products')} onToggle={toggleSection}>
            <div className="space-y-3">
              {(data.products || data.items || []).map((product: any, index: number) => (
                <ProductRow
                  key={index}
                  index={index}
                  product={product}
                  documentType={documentType}
                  updateField={updateField}
                  removeProduct={removeProduct}
                />
              ))}
              <Button variant="outline" size="sm" onClick={addProduct} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                添加产品
              </Button>
            </div>
          </Section>
        )}

        {/* 其他要求 */}
        {data.requirements && (
          <Section title="其他要求" id="requirements" expanded={expandedSections.has('requirements')} onToggle={toggleSection}>
            <div className="space-y-3">
              {renderRequirementFields(data, updateField, getFieldValue)}
            </div>
          </Section>
        )}
      </div>
    );
  };

  return renderFields();
}

// 章节组件
interface SectionProps {
  title: string;
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function Section({ title, id, expanded, onToggle, children }: SectionProps) {
  return (
    <Card className="border border-gray-200">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => onToggle(id)}
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </div>
      {expanded && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </Card>
  );
}

// 产品行组件
interface ProductRowProps {
  index: number;
  product: any;
  documentType: DocumentType;
  updateField: (path: string, value: any) => void;
  removeProduct: (index: number) => void;
}

function ProductRow({ index, product, documentType, updateField, removeProduct }: ProductRowProps) {
  const basePath = (documentType === 'inquiry' || documentType === 'quotation' || documentType === 'sales-contract') ? 'products' : 'items';
  
  return (
    <div className="border border-gray-200 rounded p-3 bg-gray-50 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 text-red-600 hover:text-red-700"
        onClick={() => removeProduct(index)}
      >
        <X className="w-4 h-4" />
      </Button>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">产品名称</Label>
          <Input
            value={product.productName || product.description || ''}
            onChange={(e) => updateField(`${basePath}.${index}.productName`, e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">规格</Label>
          <Input
            value={product.specification || ''}
            onChange={(e) => updateField(`${basePath}.${index}.specification`, e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">型号</Label>
          <Input
            value={product.modelNo || ''}
            onChange={(e) => updateField(`${basePath}.${index}.modelNo`, e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">数量</Label>
          <Input
            type="number"
            value={product.quantity || 0}
            onChange={(e) => updateField(`${basePath}.${index}.quantity`, parseFloat(e.target.value) || 0)}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">单位</Label>
          <Input
            value={product.unit || 'pcs'}
            onChange={(e) => updateField(`${basePath}.${index}.unit`, e.target.value)}
            className="text-sm"
          />
        </div>
        
        {/* 🔥 供应商报价单显示货币选择器 */}
        {documentType === 'supplier-quotation' && (
          <div>
            <Label className="text-xs">货币</Label>
            <Select 
              value={product.currency || 'CNY'} 
              onValueChange={(value) => updateField(`${basePath}.${index}.currency`, value)}
            >
              <SelectTrigger className="text-sm h-9">
                <SelectValue placeholder="选择币种" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                <SelectItem value="USD">美元 (USD)</SelectItem>
                <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                <SelectItem value="GBP">英镑 (GBP)</SelectItem>
                <SelectItem value="JPY">日元 (JPY)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div>
          <Label className="text-xs">单价</Label>
          <Input
            type="number"
            step="0.01"
            value={product.unitPrice || 0}
            onChange={(e) => updateField(`${basePath}.${index}.unitPrice`, parseFloat(e.target.value) || 0)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// 渲染基本字段
function renderBasicFields(type: DocumentType, data: any, updateField: (path: string, value: any) => void, getFieldValue: (path: string) => any) {
  const fields: JSX.Element[] = [];
  
  // 根据文档类型显示不同的字段
  const fieldMap: Record<string, string> = {
    'inquiry': 'inquiryNo',
    'quotation': 'quotationNo',
    'sales-contract': 'contractNo',
    'purchase-order': 'poNo',
    'proforma-invoice': 'piNo',
    'supplier-rfq': 'rfqNo',
    'supplier-quotation': 'quotationNo',
    'purchase-requirement': 'requirementNo',
  };

  const noField = fieldMap[type];
  if (noField && data[noField] !== undefined) {
    fields.push(
      <div key={noField}>
        <Label className="text-sm">单号</Label>
        <Input value={getFieldValue(noField)} onChange={(e) => updateField(noField, e.target.value)} />
      </div>
    );
  }

  // 日期字段
  const dateFields = Object.keys(data).filter(key => key.includes('Date') || key.includes('date'));
  dateFields.forEach(field => {
    fields.push(
      <div key={field}>
        <Label className="text-sm">{formatFieldName(field)}</Label>
        <Input type="date" value={getFieldValue(field)} onChange={(e) => updateField(field, e.target.value)} />
      </div>
    );
  });

  return fields;
}

// 渲染客户/供应商字段
function renderPartyFields(type: DocumentType, data: any, updateField: (path: string, value: any) => void, getFieldValue: (path: string) => any) {
  const party = data.customer || data.buyer || data.supplier;
  const basePath = data.customer ? 'customer' : data.supplier ? 'supplier' : 'buyer';
  const fields: JSX.Element[] = [];

  Object.keys(party).forEach(key => {
    fields.push(
      <div key={key}>
        <Label className="text-sm">{formatFieldName(key)}</Label>
        <Input
          value={getFieldValue(`${basePath}.${key}`)}
          onChange={(e) => updateField(`${basePath}.${key}`, e.target.value)}
        />
      </div>
    );
  });

  return fields;
}

// 渲染需求字段
function renderRequirementFields(data: any, updateField: (path: string, value: any) => void, getFieldValue: (path: string) => any) {
  const fields: JSX.Element[] = [];

  Object.keys(data.requirements).forEach(key => {
    const value = data.requirements[key];
    if (Array.isArray(value)) {
      fields.push(
        <div key={key}>
          <Label className="text-sm">{formatFieldName(key)}</Label>
          <Input
            value={value.join(', ')}
            onChange={(e) => updateField(`requirements.${key}`, e.target.value.split(',').map((s: string) => s.trim()))}
          />
        </div>
      );
    } else {
      fields.push(
        <div key={key}>
          <Label className="text-sm">{formatFieldName(key)}</Label>
          {typeof value === 'string' && value.length > 50 ? (
            <Textarea
              value={getFieldValue(`requirements.${key}`)}
              onChange={(e) => updateField(`requirements.${key}`, e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              value={getFieldValue(`requirements.${key}`)}
              onChange={(e) => updateField(`requirements.${key}`, e.target.value)}
            />
          )}
        </div>
      );
    }
  });

  return fields;
}

// 格式化字段名
function formatFieldName(field: string): string {
  const nameMap: Record<string, string> = {
    'companyName': '公司名称',
    'contactPerson': '联系人',
    'email': '邮箱',
    'phone': '电话',
    'address': '地址',
    'inquiryDate': '询价日期',
    'quotationDate': '报价日期',
    'contractDate': '合同日期',
    'deliveryTime': '交货时间',
    'paymentTerms': '付款条款',
    'tradeTerms': '贸易条款',
  };
  
  return nameMap[field] || field.replace(/([A-Z])/g, ' $1').trim();
}

// 获取文档类型名称
function getDocTypeName(type: DocumentType): string {
  const typeMap: Record<DocumentType, string> = {
    'inquiry': '客户询价单',
    'quotation': '报价单',
    'sales-contract': '销售合同',
    'purchase-order': '采购订单',
    'proforma-invoice': '形式发票',
    'supplier-rfq': '供应商询价单',
    'supplier-quotation': '供应商报价单',
    'purchase-requirement': '采购需求单',
    'statement': '对账单',
    'commercial-invoice': '商业发票',
    'packing-list': '装箱单',
  };
  return typeMap[type];
}

// 获取默认数据
function getDefaultData(type: DocumentType): DocumentData {
  const baseDate = new Date().toISOString().split('T')[0];
  
  switch (type) {
    case 'inquiry':
      return {
        inquiryNo: 'INQ-NA-' + Date.now(),
        inquiryDate: baseDate,
        region: 'NA',
        customer: {
          companyName: '',
          contactPerson: '',
          position: '',
          email: '',
          phone: '',
          address: '',
          country: ''
        },
        products: [],
        requirements: {
          deliveryTime: '',
          portOfDestination: '',
          paymentTerms: '',
          tradeTerms: '',
          packingRequirements: '',
          certifications: [],
          otherRequirements: ''
        }
      } as CustomerInquiryData;
    
    case 'quotation':
      return {
        quotationNo: 'QT-NA-' + Date.now(),
        quotationDate: baseDate,
        validUntil: baseDate,
        region: 'NA',
        company: {
          name: '福建高盛达富建材有限公司',
          nameEn: 'COSUN Building Materials Co., Ltd.',
          address: '福建省厦门市思明区',
          addressEn: 'Siming District, Xiamen, Fujian, China',
          tel: '+86-592-1234567',
          email: 'info@cosun.com',
          website: 'www.cosun.com'
        },
        customer: {
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: ''
        },
        products: [],
        tradeTerms: {
          incoterms: 'FOB Xiamen',
          paymentTerms: '30% T/T deposit, 70% before shipment',
          deliveryTime: '25-30 days after deposit',
          packing: 'Export carton with pallets',
          portOfLoading: 'Xiamen, China',
          portOfDestination: ''
        },
        salesPerson: {
          name: '',
          position: 'Sales Manager',
          phone: '',
          email: ''
        },
        remarks: ''
      } as QuotationData;

    case 'sales-contract':
      return {
        contractNo: 'SC-NA-' + Date.now(),
        contractDate: baseDate,
        region: 'NA',
        seller: {
          name: '福建高盛达富建材有限公司',
          nameEn: 'COSUN Building Materials Co., Ltd.',
          address: '福建省厦门市思明区',
          addressEn: 'Siming District, Xiamen, Fujian, China',
          tel: '+86-592-1234567',
          email: 'info@cosun.com',
          legalRepresentative: 'Zhang Wei',
          businessLicense: '91350200MA2XYZ1234',
          bankInfo: {
            bankName: 'Bank of China Xiamen Branch',
            accountName: 'COSUN Building Materials Co., Ltd.',
            accountNumber: '1234567890',
            swiftCode: 'BKCHCNBJ950',
            currency: 'USD'
          }
        },
        buyer: {
          companyName: '',
          address: '',
          country: '',
          contactPerson: '',
          tel: '',
          email: ''
        },
        products: [],
        terms: {
          totalAmount: 0,
          currency: 'USD',
          tradeTerms: 'FOB Xiamen',
          paymentTerms: '30% T/T deposit, 70% before shipment',
          deliveryTime: '25-30 days after deposit received',
          portOfLoading: 'Xiamen, China',
          portOfDestination: '',
          packing: 'Export standard carton',
          inspection: 'Third-party inspection accepted'
        },
        additionalTerms: [],
        signatures: {
          sellerSignature: '',
          sellerDate: baseDate,
          buyerSignature: '',
          buyerDate: baseDate
        }
      } as SalesContractData;

    case 'supplier-quotation':
      return {
        quotationNo: 'BJ-' + Date.now(),
        quotationDate: baseDate,
        validUntil: baseDate,
        rfqReference: '',
        supplier: {
          companyName: '',
          companyNameEn: '',
          address: '',
          addressEn: '',
          tel: '',
          email: '',
          contactPerson: '',
          supplierCode: '',
          logo: ''
        },
        buyer: {
          name: '福建高盛达富建材有限公司',
          nameEn: 'COSUN Building Materials Co., Ltd.',
          address: '福建省厦门市思明区',
          addressEn: 'Siming District, Xiamen, Fujian, China',
          tel: '+86-592-1234567',
          email: 'info@cosun.com',
          contactPerson: ''
        },
        products: [],
        terms: {
          paymentTerms: 'T/T 30% deposit, 70% before shipment',
          deliveryTerms: 'FOB',
          deliveryTime: '30 days',
          deliveryAddress: '',
          moq: '',
          qualityStandard: '',
          warranty: '',
          packaging: '',
          shippingMarks: '',
          remarks: ''
        }
      } as SupplierQuotationData;

    // 其他文档类型的默认数据...
    default:
      return {} as DocumentData;
  }
}