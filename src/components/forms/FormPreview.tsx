import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  X, Edit2, Download, Printer, FileText
} from 'lucide-react';
import { FormTemplate } from '../../config/formTemplates';

interface FormPreviewProps {
  template: FormTemplate;
  onClose: () => void;
  onEdit: () => void;
  data?: any; // 实际数据（可选）
}

const FormPreview: React.FC<FormPreviewProps> = ({ template, onClose, onEdit, data }) => {
  // A4 尺寸比例 (210mm x 297mm)
  const a4Ratio = 297 / 210;
  
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 头部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600">{template.name_en}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              编辑模板
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              打印
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              关闭
            </Button>
          </div>
        </div>
      </div>

      {/* A4预览区域 */}
      <div className="flex-1 overflow-y-auto p-8">
        <div 
          className="max-w-[210mm] mx-auto bg-white shadow-lg"
          style={{
            minHeight: '297mm',
            width: '210mm',
            padding: `${template.pageSettings.margins.top}mm ${template.pageSettings.margins.right}mm ${template.pageSettings.margins.bottom}mm ${template.pageSettings.margins.left}mm`,
            fontFamily: template.styling.fontFamily,
            fontSize: `${template.styling.fontSize}pt`,
            lineHeight: template.styling.lineHeight,
            color: template.styling.secondaryColor
          }}
        >
          {/* 表头 */}
          {template.pageSettings.header && (
            <div className="mb-6">
              {/* Logo */}
              {template.header.logo.enabled && (
                <div 
                  className="mb-4"
                  style={{
                    textAlign: template.header.logo.position,
                  }}
                >
                  <div 
                    className="inline-block border-2 border-dashed border-gray-300 flex items-center justify-center"
                    style={{
                      width: `${template.header.logo.size.width}mm`,
                      height: `${template.header.logo.size.height}mm`,
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <span className="text-xs text-gray-400">
                      {template.header.logo.source === 'cosun' && 'Cosun Logo'}
                      {template.header.logo.source === 'customer' && 'Customer Logo'}
                      {template.header.logo.source === 'supplier' && 'Supplier Logo'}
                    </span>
                  </div>
                </div>
              )}

              {/* 公司信息 */}
              {template.header.companyInfo.enabled && (
                <div className="text-xs mb-4 text-gray-600">
                  <p className="font-semibold">Fujian Cosun Tuff Building Materials Co., Ltd.</p>
                  <p>福建高盛达富建材有限公司</p>
                  <p>Address: Fujian Province, China</p>
                  <p>Tel: +86-xxx-xxxx | Email: info@cosun.com</p>
                </div>
              )}

              {/* 标题 */}
              <h1 
                className="font-bold mb-4"
                style={{
                  fontSize: `${template.header.title.fontSize}pt`,
                  textAlign: template.header.title.alignment,
                  color: template.styling.primaryColor,
                  borderBottom: `2px solid ${template.styling.primaryColor}`,
                  paddingBottom: '4mm'
                }}
              >
                {template.header.title.text}
              </h1>
            </div>
          )}

          {/* 区段内容 */}
          <div className="space-y-4">
            {template.sections.map(section => (
              <div 
                key={section.id}
                className={`${section.border ? 'border border-gray-300 p-3' : ''}`}
                style={{
                  backgroundColor: section.backgroundColor || 'transparent'
                }}
              >
                {/* 区段标题 */}
                <h2 
                  className="font-semibold mb-3 pb-1 border-b"
                  style={{
                    color: template.styling.primaryColor,
                    fontSize: '11pt'
                  }}
                >
                  {section.title}
                </h2>

                {/* 字段 */}
                <div 
                  className={`grid gap-3`}
                  style={{
                    gridTemplateColumns: section.layout === 'single' ? '1fr' :
                                       section.layout === 'double' ? '1fr 1fr' :
                                       '1fr 1fr 1fr'
                  }}
                >
                  {section.fields.map(field => {
                    // 表格类型字段占满整行
                    if (field.type === 'table') {
                      return (
                        <div key={field.id} style={{ gridColumn: '1 / -1' }}>
                          <div className="border border-gray-300">
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ backgroundColor: `${template.styling.primaryColor}20` }}>
                                  <th className="border border-gray-300 p-2 text-left">No.</th>
                                  <th className="border border-gray-300 p-2 text-left">Item Description</th>
                                  <th className="border border-gray-300 p-2 text-center">Quantity</th>
                                  <th className="border border-gray-300 p-2 text-right">Unit Price</th>
                                  <th className="border border-gray-300 p-2 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[1, 2, 3].map(i => (
                                  <tr key={i}>
                                    <td className="border border-gray-300 p-2">{i}</td>
                                    <td className="border border-gray-300 p-2">Sample Product {i}</td>
                                    <td className="border border-gray-300 p-2 text-center">100</td>
                                    <td className="border border-gray-300 p-2 text-right">$10.00</td>
                                    <td className="border border-gray-300 p-2 text-right">$1,000.00</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    // 计算字段
                    if (field.type === 'calculated') {
                      return (
                        <div 
                          key={field.id} 
                          style={{ 
                            gridColumn: field.width === '100%' ? '1 / -1' : 'auto',
                            textAlign: field.alignment || 'left'
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span 
                              className={field.fontWeight === 'bold' ? 'font-bold' : ''}
                              style={{ 
                                fontSize: field.fontSize ? `${field.fontSize}pt` : 'inherit',
                                color: template.styling.primaryColor
                              }}
                            >
                              {field.label}:
                            </span>
                            <span 
                              className={field.fontWeight === 'bold' ? 'font-bold' : ''}
                              style={{ 
                                fontSize: field.fontSize ? `${field.fontSize}pt` : 'inherit'
                              }}
                            >
                              $3,000.00
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // 文本域
                    if (field.type === 'textarea') {
                      return (
                        <div 
                          key={field.id}
                          style={{ gridColumn: field.width === '100%' ? '1 / -1' : 'auto' }}
                        >
                          <label className="text-xs font-semibold block mb-1">
                            {field.label}{field.required && <span className="text-red-600">*</span>}
                          </label>
                          <div className="border border-gray-300 p-2 min-h-[20mm] bg-gray-50 text-xs text-gray-600">
                            {field.defaultValue || field.placeholder || '(内容区域)'}
                          </div>
                        </div>
                      );
                    }

                    // 普通字段
                    return (
                      <div 
                        key={field.id}
                        style={{ gridColumn: field.width === '100%' ? '1 / -1' : 'auto' }}
                      >
                        <label className="text-xs font-semibold block mb-1">
                          {field.label}{field.required && <span className="text-red-600">*</span>}
                        </label>
                        <div className="border-b border-gray-400 pb-1 text-xs text-gray-600">
                          {field.defaultValue || field.placeholder || '_________________'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 表尾 */}
          {template.footer.enabled && (
            <div className="mt-8 pt-6 border-t-2" style={{ borderColor: template.styling.primaryColor }}>
              {/* 签名栏 */}
              {template.footer.signatureLines?.enabled && (
                <div 
                  className="grid gap-8"
                  style={{
                    gridTemplateColumns: `repeat(${template.footer.signatureLines.parties.length}, 1fr)`
                  }}
                >
                  {template.footer.signatureLines.parties.map((party, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs font-semibold mb-2">{party.label}</div>
                      <div className="border-b border-gray-400 h-12 mb-2"></div>
                      <div className="text-xs text-gray-600">
                        Signature / 签名
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        Date / 日期: _______________
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 页脚信息 */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>This is a computer-generated document and does not require a signature.</p>
                <p className="mt-1">Page 1 of 1</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <Badge variant="outline">A4 尺寸 (210mm × 297mm)</Badge>
            <Badge variant="outline">版本: {template.version}</Badge>
            <Badge variant="outline">区段数: {template.sections.length}</Badge>
          </div>
          <div className="text-xs text-gray-500">
            最后修改: {template.lastModified}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;