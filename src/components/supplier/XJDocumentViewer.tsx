import React, { useRef } from 'react';
import { Button } from '../ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { XJDocument, XJData } from '../documents/templates/XJDocument';
import type { DocumentLayoutConfig } from '../documents/A4PageContainer';

interface XJDocumentViewerProps {
  xj: any; // 采购询价对象，包含documentData字段
}

export default function XJDocumentViewer({ xj }: XJDocumentViewerProps) {
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

  // 检查是否有文档数据
  const templateSnapshot = xj.templateSnapshot || xj.template_snapshot || null;
  const templateVersion = templateSnapshot?.version || null;
  const documentData = (xj.documentDataSnapshot || xj.document_data_snapshot) as XJData | null;
  const layoutConfig = (templateVersion?.layout_json || null) as DocumentLayoutConfig | null;

  if (!templateVersion || !documentData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FileText className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="font-semibold text-red-900 mb-2">XJ 模板快照缺失</h3>
        <p className="text-sm text-red-700">
          此采购询价单未绑定模板中心版本快照，无法预览。
          <br />
          请从模板中心绑定后重新生成。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🔥 操作按钮栏 */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h4 className="font-semibold text-gray-900">询价单文档</h4>
          <p className="text-xs text-gray-500 mt-1">
            编号: {documentData.xjNo} | 日期: {documentData.xjDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              handlePrint();
            }}
          >
            <Printer className="w-4 h-4" />
            打印
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              handlePrint();
            }}
          >
            <Download className="w-4 h-4" />
            导出PDF
          </Button>
        </div>
      </div>

      {/* 🔥 文档预览区域 */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <XJDocument ref={documentRef} data={documentData} layoutConfig={layoutConfig || undefined} />
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
            <p className="text-xs text-blue-700">采购方</p>
            <p className="font-medium text-blue-900">{documentData.buyer.name}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">采购员</p>
            <p className="font-medium text-blue-900">{documentData.buyer.contactPerson}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">报价截止日期</p>
            <p className="font-medium text-orange-600">{documentData.requiredResponseDate}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">要求交货日期</p>
            <p className="font-medium text-blue-900">{documentData.requiredDeliveryDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-blue-700">产品数量</p>
            <p className="font-medium text-blue-900">{documentData.products.length} 个产品</p>
          </div>
        </div>
      </div>

      {/* 🔥 使用提示 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">使用提示</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 点击"导出PDF"按钮，在打印对话框中选择"另存为PDF"即可保存文档</li>
          <li>• 文档包含完整的产品信息、商务条款和技术要求，请仔细阅读</li>
          <li>• 请在报价截止日期前提交报价，逾期可能影响合作机会</li>
          <li>• 如有疑问，请通过消息功能联系COSUN采购员：{documentData.buyer.contactPerson}</li>
        </ul>
      </div>
    </div>
  );
}
