import React, { useState } from 'react';
import { FileText, Download, Eye, Send, Printer, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { CustomerInquiryDocument } from './templates/CustomerInquiryDocument';
import { QuotationDocument } from './templates/QuotationDocument';
import { ProformaInvoiceDocument } from './templates/ProformaInvoiceDocument';
import { SalesContractDocument } from './templates/SalesContractDocument';
import { ShippingNoticeDocument } from './templates/ShippingNoticeDocument';
import { CommercialInvoiceDocument } from './templates/CommercialInvoiceDocument';
import { PackingListDocument } from './templates/PackingListDocument';
import { DocumentPreview } from './DocumentPreview';

/**
 * 📄 专业文档生成中心
 * 
 * 功能定位：
 * 1. 独立的文档生成和管理模块
 * 2. 与业务流程解耦，专注于文档的创建、预览、导出
 * 3. 支持7种核心国际贸易文档
 * 4. 符合国际商业标准的专业排版
 */
export function DocumentCenter() {
  const [activeTab, setActiveTab] = useState<string>('ing');
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  // 模拟文档列表数据
  const documentTypes = [
    { 
      id: 'ing', 
      name: '客户询价单', 
      nameEn: 'Customer Inquiry',
      icon: FileText,
      color: 'blue',
      description: '客户发送的产品询价请求'
    },
    { 
      id: 'qt', 
      name: '销售报价单', 
      nameEn: 'Sales Quotation',
      icon: FileText,
      color: 'orange',
      description: '业务员基于供应链反馈给客户的正式报价'
    },
    { 
      id: 'proforma', 
      name: '形式发票', 
      nameEn: 'Proforma Invoice',
      icon: FileText,
      color: 'purple',
      description: '客户付款前的预付发票'
    },
    { 
      id: 'contract', 
      name: '销售合同', 
      nameEn: 'Sales Contract',
      icon: FileText,
      color: 'green',
      description: '正式销售合同文档'
    },
    { 
      id: 'shipping', 
      name: '出货通知', 
      nameEn: 'Shipping Notice',
      icon: FileText,
      color: 'cyan',
      description: '货物准备出运的通知'
    },
    { 
      id: 'commercial', 
      name: '商业发票', 
      nameEn: 'Commercial Invoice',
      icon: FileText,
      color: 'red',
      description: '报关必需的商业发票'
    },
    { 
      id: 'packing', 
      name: '包装清单', 
      nameEn: 'Packing List',
      icon: FileText,
      color: 'amber',
      description: '货物包装详细清单'
    }
  ];

  const handlePreview = (docType: string) => {
    // TODO: 从KV Store加载真实数据
    toast.success(`预览 ${docType} 文档`);
    setPreviewDocument({ type: docType });
  };

  const handleDownload = (docType: string) => {
    // TODO: 生成PDF并下载
    toast.success(`下载 ${docType} 文档`);
  };

  const handleSend = (docType: string) => {
    // TODO: 发送邮件
    toast.success(`发送 ${docType} 文档`);
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0F1E]">
      {/* 顶部标题栏 */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#F96302]/10 to-transparent">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-white/90 mb-1">单证制作中心</h1>
              <p className="text-sm text-white/50">Document Generation Center - 国际标准商业文档系统</p>
            </div>
            <Button 
              className="bg-[#F96302] hover:bg-[#F96302]/90 text-white"
              onClick={() => toast.info('选择文档类型以创建新文档')}
            >
              <Plus className="w-4 h-4 mr-2" />
              创建文档
            </Button>
          </div>
        </div>
      </div>

      {/* 文档类型卡片网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documentTypes.map((docType) => {
            const Icon = docType.icon;
            return (
              <div
                key={docType.id}
                className="group relative bg-white/5 rounded-lg border border-white/10 hover:border-[#F96302]/50 transition-all hover:shadow-lg hover:shadow-[#F96302]/20"
              >
                <div className="p-5">
                  {/* 文档图标和标题 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${docType.color}-500/10 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${docType.color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-white/90 font-medium">{docType.name}</h3>
                        <p className="text-xs text-white/40">{docType.nameEn}</p>
                      </div>
                    </div>
                  </div>

                  {/* 文档描述 */}
                  <p className="text-sm text-white/50 mb-4 min-h-[40px]">
                    {docType.description}
                  </p>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[#F96302]/50"
                      onClick={() => handlePreview(docType.name)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      预览
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[#F96302]/50"
                      onClick={() => handleDownload(docType.name)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[#F96302]/50"
                      onClick={() => handleSend(docType.name)}
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* 文档数量角标 */}
                  <div className="absolute top-3 right-3 bg-[#F96302] text-white text-xs px-2 py-0.5 rounded-full">
                    12
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 快速统计 */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="text-white/50 text-sm mb-1">本月创建</div>
            <div className="text-2xl text-white/90">48</div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="text-white/50 text-sm mb-1">待发送</div>
            <div className="text-2xl text-[#F96302]">12</div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="text-white/50 text-sm mb-1">已发送</div>
            <div className="text-2xl text-green-400">36</div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="text-white/50 text-sm mb-1">总文档</div>
            <div className="text-2xl text-white/90">156</div>
          </div>
        </div>
      </div>

      {/* 预览对话框 */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}

/**
 * 使用说明：
 * 
 * 1. 这是一个独立的文档中心入口
 * 2. 点击每个文档类型卡片可以：
 *    - 预览：查看文档格式和内容
 *    - 下载：生成PDF文件
 *    - 发送：通过邮件发送给客户
 * 
 * 3. 数据调用：
 *    - 从KV Store读取业务数据
 *    - 映射到各文档模板
 *    - 生成符合国际标准的文档
 * 
 * 4. 与业务流程集成：
 *    - 可以从订单管理、CRM等模块直接跳转到这里
 *    - 传入业务数据ID，自动加载并生成文档
 */
