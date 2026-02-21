import React, { forwardRef, ReactNode } from 'react';

/**
 * THE COSUN BM A4标准表单模板包装组件
 * 
 * 特点：
 * 1. 严格遵循A4标准尺寸（210mm x 297mm）
 * 2. 屏幕预览带阴影效果
 * 3. 打印时自动适配A4纸张
 * 4. 支持橙色主题（#F96302）
 * 5. 支持分页避免内容被切断
 */

interface CosunA4TemplateProps {
  children: ReactNode;
  /** 是否显示页面边框（仅屏幕预览） */
  showBorder?: boolean;
  /** 自定义class */
  className?: string;
  /** 页面内边距（毫米） */
  paddingMm?: number;
  /** 是否这是最后一页（避免分页） */
  isLastPage?: boolean;
}

const CosunA4Template = forwardRef<HTMLDivElement, CosunA4TemplateProps>(
  ({ children, showBorder = true, className = '', paddingMm = 15, isLastPage = true }, ref) => {
    return (
      <div 
        ref={ref}
        className={`cosun-a4-page ${isLastPage ? '' : 'page-break-after'} ${className}`}
        style={{
          padding: `${paddingMm}mm`,
          fontFamily: 'Arial, "Microsoft JhengHei", "SimHei", sans-serif',
        }}
      >
        {children}
        
        {/* 打印专用样式 */}
        <style jsx>{`
          @media screen {
            .cosun-a4-page {
              width: 210mm;
              min-height: 297mm;
              background: white;
              margin: 20px auto;
              box-sizing: border-box;
              ${showBorder ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : ''}
            }
          }
          
          @media print {
            .cosun-a4-page {
              width: 100%;
              min-height: auto;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            
            .page-break-after {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

CosunA4Template.displayName = 'CosunA4Template';

export default CosunA4Template;

/**
 * COSUN表单页眉组件
 */
interface CosunFormHeaderProps {
  /** 公司名称（中文） */
  companyName: string;
  /** 公司名称（英文） */
  companyNameEn: string;
  /** 表单标题（中文） */
  title: string;
  /** 表单标题（英文） */
  titleEn: string;
  /** 主题颜色 */
  themeColor?: string;
  /** 公司信息 */
  companyInfo?: {
    taxId?: string;
    address?: string;
    addressEn?: string;
    tel?: string;
    fax?: string;
    email?: string;
    website?: string;
  };
}

export const CosunFormHeader: React.FC<CosunFormHeaderProps> = ({
  companyName,
  companyNameEn,
  title,
  titleEn,
  themeColor = '#F96302', // COSUN橙色
  companyInfo,
}) => {
  return (
    <div className="avoid-break" style={{ marginBottom: '5mm', paddingBottom: '3mm', borderBottom: `2px solid ${themeColor}` }}>
      <div className="flex justify-between items-start">
        {/* 左侧：公司信息 */}
        <div>
          <h1 style={{ fontSize: '18pt', fontWeight: 600, color: themeColor, marginBottom: '2mm', lineHeight: 1.2 }}>
            {companyName}
          </h1>
          <p style={{ fontSize: '9pt', color: '#666', marginBottom: '3mm', lineHeight: 1.2 }}>
            {companyNameEn}
          </p>
          
          {companyInfo && (
            <div style={{ fontSize: '7.5pt', color: '#666', lineHeight: 1.4 }}>
              {companyInfo.taxId && <p>統一編號: {companyInfo.taxId}</p>}
              {companyInfo.address && <p>地址: {companyInfo.address}</p>}
              {companyInfo.addressEn && <p>Address: {companyInfo.addressEn}</p>}
              {companyInfo.tel && companyInfo.fax && (
                <p>Tel: {companyInfo.tel} | Fax: {companyInfo.fax}</p>
              )}
              {companyInfo.email && companyInfo.website && (
                <p>Email: {companyInfo.email} | Web: {companyInfo.website}</p>
              )}
            </div>
          )}
        </div>
        
        {/* 右侧：表单标题 */}
        <div className="text-right">
          <div 
            className="inline-block text-white px-6 py-2" 
            style={{ 
              backgroundColor: themeColor,
              fontSize: '14pt',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: '8pt', marginTop: '2mm', color: '#666', lineHeight: 1.2 }}>
            {titleEn}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * COSUN表单表格组件
 */
interface CosunFormTableProps {
  /** 表格标题（中文） */
  title?: string;
  /** 表格标题（英文） */
  titleEn?: string;
  /** 表头配置 */
  headers: Array<{
    label: string;
    labelEn?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  /** 表格数据 */
  data: Array<Array<ReactNode>>;
  /** 主题颜色 */
  themeColor?: string;
  /** 是否显示斑马纹 */
  striped?: boolean;
}

export const CosunFormTable: React.FC<CosunFormTableProps> = ({
  title,
  titleEn,
  headers,
  data,
  themeColor = '#F96302',
  striped = false,
}) => {
  return (
    <div className="avoid-break" style={{ marginBottom: '3mm' }}>
      {/* 表格标题 */}
      {title && (
        <div 
          className="text-white px-3 py-1.5" 
          style={{ 
            backgroundColor: themeColor, 
            fontSize: '8.5pt',
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {title} {titleEn && <span style={{ fontSize: '7.5pt', opacity: 0.9 }}>{titleEn}</span>}
        </div>
      )}
      
      {/* 表格主体 */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        border: '1px solid #ddd',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  border: '1px solid #ddd',
                  padding: '2mm',
                  fontSize: '8pt',
                  fontWeight: 600,
                  textAlign: header.align || 'left',
                  width: header.width,
                  lineHeight: 1.3,
                }}
              >
                <div>{header.label}</div>
                {header.labelEn && (
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    {header.labelEn}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              style={{
                backgroundColor: striped && rowIndex % 2 === 1 ? '#fafafa' : 'transparent',
              }}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    border: '1px solid #ddd',
                    padding: '2mm',
                    fontSize: '8pt',
                    textAlign: headers[cellIndex]?.align || 'left',
                    lineHeight: 1.3,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * COSUN表单信息栏组件（两列布局）
 */
interface CosunFormInfoRowProps {
  /** 信息项 */
  items: Array<{
    label: string;
    labelEn?: string;
    value: ReactNode;
    span?: 1 | 2; // 跨度：1列或2列
  }>;
  /** 主题颜色 */
  themeColor?: string;
}

export const CosunFormInfoRow: React.FC<CosunFormInfoRowProps> = ({
  items,
  themeColor = '#F96302',
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 avoid-break" style={{ marginBottom: '3mm' }}>
      {items.map((item, index) => (
        <div 
          key={index}
          className={item.span === 2 ? 'col-span-2' : 'col-span-1'}
          style={{ border: '1px solid #ddd' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    width: '35%',
                    fontSize: '8pt',
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  <div>{item.label}</div>
                  {item.labelEn && (
                    <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                      {item.labelEn}
                    </div>
                  )}
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', lineHeight: 1.3 }}>
                  {item.value}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

/**
 * COSUN表单页脚组件
 */
interface CosunFormFooterProps {
  /** 页脚文本 */
  text?: string;
  /** 页脚文本（英文） */
  textEn?: string;
  /** 显示页码 */
  showPageNumber?: boolean;
  /** 当前页码 */
  pageNumber?: number;
  /** 总页数 */
  totalPages?: number;
}

export const CosunFormFooter: React.FC<CosunFormFooterProps> = ({
  text = '本文件为电脑列印文件，如有塗改或未盖公司印章恕不生效',
  textEn = 'This document is computer generated and valid only with company seal',
  showPageNumber = false,
  pageNumber = 1,
  totalPages = 1,
}) => {
  return (
    <div 
      className="avoid-break text-center" 
      style={{ 
        marginTop: '5mm',
        paddingTop: '3mm',
        borderTop: '1px solid #ddd',
        fontSize: '7pt',
        color: '#666',
        lineHeight: 1.4,
      }}
    >
      <p>{text}</p>
      <p style={{ marginTop: '1mm' }}>{textEn}</p>
      {showPageNumber && (
        <p style={{ marginTop: '2mm', fontSize: '6.5pt' }}>
          Page {pageNumber} of {totalPages}
        </p>
      )}
    </div>
  );
};

/**
 * COSUN签名区域组件
 */
interface CosunSignatureAreaProps {
  /** 签名配置 */
  signatures: Array<{
    title: string;
    titleEn: string;
  }>;
}

export const CosunSignatureArea: React.FC<CosunSignatureAreaProps> = ({
  signatures,
}) => {
  return (
    <div 
      className="grid gap-4 avoid-break" 
      style={{ 
        gridTemplateColumns: `repeat(${signatures.length}, 1fr)`,
        marginTop: '8mm',
        marginBottom: '5mm',
      }}
    >
      {signatures.map((sig, index) => (
        <div 
          key={index}
          style={{ 
            border: '1px solid #ddd',
            padding: '5mm',
            minHeight: '30mm',
          }}
        >
          <div style={{ fontSize: '8pt', marginBottom: '8mm', lineHeight: 1.2 }}>
            {sig.title} <span style={{ fontSize: '7pt', color: '#666' }}>{sig.titleEn}</span>
          </div>
          <div className="flex justify-between items-end">
            <div style={{ fontSize: '8pt', lineHeight: 1.4 }}>
              <div>簽名 Signature:</div>
              <div style={{ marginTop: '2mm' }}>_________________</div>
            </div>
            <div style={{ fontSize: '8pt', lineHeight: 1.4 }}>
              <div>日期 Date:</div>
              <div style={{ marginTop: '2mm' }}>_________________</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
