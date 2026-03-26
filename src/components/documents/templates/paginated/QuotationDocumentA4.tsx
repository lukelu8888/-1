import React, { forwardRef, useMemo } from 'react';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import {
  DEFAULT_QUOTATION_PRODUCT_TABLE_COLUMNS,
  normalizeQuotationProductTableColumns,
  type QuotationData,
} from '../QuotationDocument';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

interface QuotationDocumentA4Props {
  data?: QuotationData;
  quotation?: QuotationData;
  layout?: {
    qtLogoWidthPx?: number;
    qtLogoHeightPx?: number;
    qtInfoTableWidthPx?: number;
    qtTableCellPaddingY?: number;
    qtCompanyTableWidthPercent?: number;
    qtProductsTableWidthPercent?: number;
    qtTermsTableWidthPercent?: number;
    qtRemarksTableWidthPercent?: number;
    qtPreparedByTableWidthPercent?: number;
  };
  showControls?: boolean;
  defaultZoom?: 50 | 75 | 100;
}

interface QuotationDocumentA4PagesProps {
  data?: QuotationData;
  quotation?: QuotationData;
  layout?: QuotationDocumentA4Props['layout'];
}

const tableClass = 'w-full border-collapse border border-gray-400 text-xs';
const tdClass = 'border border-gray-400 px-2 py-1.5 align-top';
const productTableClass = 'w-full border-collapse border-2 border-gray-300 text-xs';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function extractTradeTerm(incoterms: string): string {
  const upperTerms = String(incoterms || '').toUpperCase();
  if (upperTerms.includes('EXW')) return 'EXW';
  if (upperTerms.includes('FOB')) return 'FOB';
  if (upperTerms.includes('CNF') || upperTerms.includes('C&F')) return 'CNF';
  if (upperTerms.includes('CIF')) return 'CIF';
  return 'EXW';
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function estimateProductRowHeight(product: QuotationData['products'][number]) {
  const nameLines = estimateWrappedLines(product.productName || '', 20);
  const specLines = estimateWrappedLines(product.specification || '', 34);
  return Math.max(68, 18 + nameLines * 14 + specLines * 12);
}

function estimateRemarksHeight(remarks: string) {
  return Math.max(54, 28 + estimateWrappedLines(remarks, 90) * 12);
}

function estimatePreparedByHeight(data: QuotationData) {
  const lines = [
    `${data.salesPerson.name} - ${data.salesPerson.position}`,
    `Tel: ${data.salesPerson.phone}${data.salesPerson.whatsapp ? ` | WhatsApp: ${data.salesPerson.whatsapp}` : ''}`,
    `Email: ${data.salesPerson.email}`,
  ];
  return Math.max(52, 20 + lines.reduce((sum, line) => sum + estimateWrappedLines(line, 72) * 12, 0));
}

function buildTermRows(data: QuotationData) {
  return [
    {
      label: 'Validity',
      value: `Valid until ${new Date(data.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    },
    {
      label: 'Trade Terms',
      value: data.tradeTerms.incoterms,
    },
    {
      label: 'Payment Terms',
      value: data.tradeTerms.paymentTerms,
    },
    {
      label: 'Delivery Time',
      value: data.tradeTerms.deliveryTime,
    },
    {
      label: 'Port of Loading',
      value: data.tradeTerms.portOfLoading,
    },
    ...(data.tradeTerms.portOfDestination
      ? [
          {
            label: 'Port of Destination',
            value: data.tradeTerms.portOfDestination,
          },
        ]
      : []),
    {
      label: 'Packing',
      value: data.tradeTerms.packing,
    },
    {
      label: 'Quality Warranty',
      value:
        data.tradeTerms.warranty ||
        '12 months from delivery date against manufacturing defects',
    },
    {
      label: 'Inspection',
      value:
        data.tradeTerms.inspection ||
        "Seller's factory inspection, buyer has the right to re-inspect upon arrival",
    },
  ];
}

function estimateTermRowHeight(value: string) {
  return Math.max(32, 14 + estimateWrappedLines(value, 72) * 12);
}

function renderHeader(quotationData: QuotationData, layout?: QuotationDocumentA4Props['layout']) {
  const logoWidth = layout?.qtLogoWidthPx ?? 80;
  const logoHeight = layout?.qtLogoHeightPx ?? 70;
  const infoTableWidth = layout?.qtInfoTableWidthPx ?? 240;
  const cellPaddingY = layout?.qtTableCellPaddingY ?? 6;

  return (
    <div className="mb-3">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="flex items-center" style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}>
          <img
            src={quotationData.company.logo || cosunLogo}
            alt="THE COSUN Logo"
            className="h-auto max-h-full w-full"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-2xl font-bold tracking-wider text-black">QUOTATION</h1>
        </div>
        <div style={{ width: `${infoTableWidth}px` }}>
          <table className={tableClass}>
            <tbody>
              {quotationData.inquiryNo ? (
                <tr>
                  <td className="border border-gray-400 px-2 bg-gray-100 font-semibold whitespace-nowrap" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>Inq. No.</td>
                  <td className="border border-gray-400 px-2" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>{quotationData.inquiryNo}</td>
                </tr>
              ) : null}
              <tr>
                <td className="border border-gray-400 px-2 bg-gray-100 font-semibold whitespace-nowrap" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>Quo. No.</td>
                <td className="border border-gray-400 px-2 font-bold text-black" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>{quotationData.quotationNo}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 bg-gray-100 font-semibold whitespace-nowrap" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>Date</td>
                <td className="border border-gray-400 px-2 font-semibold text-black" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>{formatDate(quotationData.quotationDate)}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 bg-gray-100 font-semibold whitespace-nowrap" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>Valid Until</td>
                <td className="border border-gray-400 px-2 font-semibold text-black" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>{formatDate(quotationData.validUntil)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
    </div>
  );
}

function renderCompanyCustomer(quotationData: QuotationData, layout?: QuotationDocumentA4Props['layout']) {
  const cellPaddingY = layout?.qtTableCellPaddingY ?? 6;
  const widthPercent = layout?.qtCompanyTableWidthPercent ?? 100;
  const companyDisplayName = quotationData.company.nameEn || quotationData.company.name;
  const companyDisplayAddress = quotationData.company.addressEn || quotationData.company.address;
  return (
    <table className={tableClass} style={{ width: `${widthPercent}%` }}>
      <tbody>
        <tr>
          <td className="w-1/2 border border-gray-400 p-0 align-top">
            <div className="border-b border-gray-400 bg-gray-200 px-2 font-bold" style={{ paddingTop: `${Math.max(4, cellPaddingY - 2)}px`, paddingBottom: `${Math.max(4, cellPaddingY - 2)}px` }}>FROM</div>
            <div className="space-y-0.5 px-2" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>
              <div>
                <span className="font-semibold">{companyDisplayName}</span>
              </div>
              <div>
                <span className="text-gray-600">Address:</span> {companyDisplayAddress}
              </div>
              <div>
                <span className="text-gray-600">Tel:</span> {quotationData.company.tel}
                {quotationData.company.fax ? ` | Fax: ${quotationData.company.fax}` : ''}
              </div>
              <div>
                <span className="text-gray-600">Email:</span> {quotationData.company.email}
              </div>
              {quotationData.company.website ? (
                <div>
                  <span className="text-gray-600">Website:</span> {quotationData.company.website}
                </div>
              ) : null}
            </div>
          </td>
          <td className="w-1/2 border border-gray-400 p-0 align-top">
            <div className="border-b border-gray-400 bg-gray-200 px-2 font-bold" style={{ paddingTop: `${Math.max(4, cellPaddingY - 2)}px`, paddingBottom: `${Math.max(4, cellPaddingY - 2)}px` }}>TO</div>
            <div className="space-y-0.5 px-2" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>
              <div>
                <span className="font-semibold">{quotationData.customer.companyName}</span>
              </div>
              <div>
                <span className="text-gray-600">Attn:</span> {quotationData.customer.contactPerson}
              </div>
              {quotationData.customer.address ? (
                <div>
                  <span className="text-gray-600">Address:</span> {quotationData.customer.address}
                </div>
              ) : null}
              <div>
                <span className="text-gray-600">Email:</span> {quotationData.customer.email}
              </div>
              {quotationData.customer.phone ? (
                <div>
                  <span className="text-gray-600">Tel:</span> {quotationData.customer.phone}
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export const QuotationDocumentA4 = forwardRef<HTMLDivElement, QuotationDocumentA4Props>(
  ({ data, quotation, layout, showControls = false, defaultZoom = 100 }, ref) => {
    const quotationData = quotation || data;
    if (!quotationData) {
      return <div ref={ref}>No quotation data available</div>;
    }

    const pages = useMemo(() => buildQuotationPages(quotationData, layout), [quotationData, layout]);

    return (
      <div ref={ref}>
        <A4DocumentViewer
          pages={pages}
          showControls={showControls}
          defaultZoom={defaultZoom}
          fileName={`${quotationData.quotationNo || 'qt'}.pdf`}
        />
      </div>
    );
  },
);

QuotationDocumentA4.displayName = 'QuotationDocumentA4';

export function QuotationDocumentA4Pages({ data, quotation, layout }: QuotationDocumentA4PagesProps) {
  const quotationData = quotation || data;
  if (!quotationData) return null;

  const pages = useMemo(() => buildQuotationPages(quotationData, layout), [quotationData, layout]);

  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`qt-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildQuotationPages(
  quotationData: QuotationData,
  layout?: QuotationDocumentA4Props['layout'],
): React.ReactNode[] {
  const currency = quotationData.products[0]?.currency || 'USD';
  const total = quotationData.products.reduce((sum, item) => sum + item.amount, 0);
  const tradeTerm = extractTradeTerm(quotationData.tradeTerms.incoterms);
  const productTableColumns = normalizeQuotationProductTableColumns(
    quotationData.templateSettings?.productTableColumns || DEFAULT_QUOTATION_PRODUCT_TABLE_COLUMNS,
  );
  const termRows = buildTermRows(quotationData);
  const productsTableWidthPercent = layout?.qtProductsTableWidthPercent ?? 100;
  const termsTableWidthPercent = layout?.qtTermsTableWidthPercent ?? 100;
  const remarksTableWidthPercent = layout?.qtRemarksTableWidthPercent ?? 100;
  const preparedByTableWidthPercent = layout?.qtPreparedByTableWidthPercent ?? 100;
  const cellPaddingY = layout?.qtTableCellPaddingY ?? 6;

  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 136,
      avoidBreak: true,
      render: () => renderHeader(quotationData, layout),
    },
    {
      type: 'section',
      key: 'company-customer',
      estimatedHeight: 154,
      avoidBreak: true,
      render: () => renderCompanyCustomer(quotationData, layout),
    },
    {
      type: 'table',
      key: 'products',
      headerHeight: 108,
      rowHeight: (row) => estimateProductRowHeight(row),
      footerHeight: 42,
      rows: quotationData.products,
      renderHeader: () => (
        <>
          <thead>
            <tr className="bg-gray-100">
              {productTableColumns.map((column) => (
                <th
                  key={column.key}
                  className={`border border-gray-300 px-2 whitespace-nowrap ${
                    column.key === 'quantity' || column.key === 'unitPrice' || column.key === 'amount'
                      ? 'text-right'
                      : column.key === 'unit' || column.key === 'image'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                  style={{
                    width: `${column.widthPercent}%`,
                    paddingTop: `${cellPaddingY + 2}px`,
                    paddingBottom: `${cellPaddingY + 2}px`,
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        </>
      ),
      renderRow: (product) => (
        <tr key={product.no} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          {productTableColumns.map((column) => {
            const cellStyle = {
              paddingTop: `${column.key === 'image' ? Math.max(4, cellPaddingY - 1) : cellPaddingY}px`,
              paddingBottom: `${column.key === 'image' ? Math.max(4, cellPaddingY - 1) : cellPaddingY}px`,
            };

            switch (column.key) {
              case 'no':
                return <td key={column.key} className="border border-gray-300 px-2 text-center" style={cellStyle}>{product.no}</td>;
              case 'modelNo':
                return <td key={column.key} className="border border-gray-300 px-2 text-gray-700" style={cellStyle}>{product.modelNo || '-'}</td>;
              case 'image':
                return (
                  <td key={column.key} className="border border-gray-300 px-1 text-center" style={cellStyle}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="mx-auto h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                        N/A
                      </div>
                    )}
                  </td>
                );
              case 'itemNameSpecification':
                return (
                  <td key={column.key} className="border border-gray-300 px-2" style={cellStyle}>
                    <div className="font-semibold">{product.productName}</div>
                    <div className="mt-0.5 text-xs text-gray-600">{product.specification}</div>
                  </td>
                );
              case 'quantity':
                return <td key={column.key} className="border border-gray-300 px-2 text-right" style={cellStyle}>{product.quantity.toLocaleString()}</td>;
              case 'unit':
                return <td key={column.key} className="border border-gray-300 px-2 text-center" style={cellStyle}>{product.unit}</td>;
              case 'unitPrice':
                return <td key={column.key} className="border border-gray-300 px-2 text-right" style={cellStyle}>{product.currency} {product.unitPrice.toFixed(2)}</td>;
              case 'amount':
              default:
                return <td key={column.key} className="border border-gray-300 px-2 text-right font-semibold" style={cellStyle}>{product.currency} {product.amount.toFixed(2)}</td>;
            }
          })}
        </tr>
      ),
      renderFooter: () => (
        <tr className="bg-gray-100 font-bold">
          <td colSpan={Math.max(productTableColumns.length - 1, 1)} className="border border-gray-300 px-2 text-right" style={{ paddingTop: `${cellPaddingY + 2}px`, paddingBottom: `${cellPaddingY + 2}px` }}>
            TOTAL VALUE ({tradeTerm}):
          </td>
          <td className="border border-gray-300 px-2 text-right font-semibold" style={{ paddingTop: `${cellPaddingY + 2}px`, paddingBottom: `${cellPaddingY + 2}px` }}>
            {currency} {total.toFixed(2)}
          </td>
        </tr>
      ),
    },
    {
      type: 'table',
      key: 'terms',
      headerHeight: 0,
      rowHeight: (row) => estimateTermRowHeight(row.value),
      rows: termRows,
      renderHeader: () => null,
      renderRow: (row) => (
        <tr key={row.label} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className={`${tdClass} bg-gray-100 font-semibold`} style={{ width: '25%' }}>
            {row.label}
          </td>
          <td className={tdClass}>{row.value}</td>
        </tr>
      ),
    },
  ];

  if (quotationData.remarks) {
    blocks.push({
      type: 'section',
      key: 'remarks',
      estimatedHeight: estimateRemarksHeight(quotationData.remarks),
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <table className={tableClass} style={{ width: `${remarksTableWidthPercent}%` }}>
            <thead>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-2 text-left font-bold" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>
                  REMARKS / NOTES
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 text-gray-700" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>
                  {quotationData.remarks}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    });
  }

  blocks.push({
    type: 'section',
    key: 'prepared-by',
    estimatedHeight: estimatePreparedByHeight(quotationData),
    avoidBreak: true,
      render: () => (
        <div className="mb-4">
          <table className={tableClass} style={{ width: `${preparedByTableWidthPercent}%` }}>
            <tbody>
              <tr>
                <td className="w-[25%] border border-gray-400 bg-gray-100 px-2 font-semibold" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>
                  Prepared By
                </td>
                <td className="border border-gray-400 px-2" style={{ paddingTop: `${cellPaddingY}px`, paddingBottom: `${cellPaddingY}px` }}>
                  <div className="space-y-0.5">
                  <div>
                    <span className="font-semibold">{quotationData.salesPerson.name}</span> - {quotationData.salesPerson.position}
                  </div>
                  <div className="text-gray-600">
                    Tel: {quotationData.salesPerson.phone}
                    {quotationData.salesPerson.whatsapp ? ` | WhatsApp: ${quotationData.salesPerson.whatsapp}` : ''}
                  </div>
                  <div className="text-gray-600">Email: {quotationData.salesPerson.email}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  });

  blocks.push({
    type: 'section',
    key: 'closing',
    estimatedHeight: 36,
    render: () => (
      <div className="border-t border-gray-300 pt-2 text-center text-xs text-gray-600">
        We look forward to receiving your order and establishing a long-term business relationship.
      </div>
    ),
  });

  return paginateBlocks(blocks).map((page) => (
    <div key={`qt-${page.index}`} className="flex h-full flex-col text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        if (item.key.startsWith('products')) {
          return (
            <section key={item.key}>
              <table className={productTableClass} style={{ width: `${productsTableWidthPercent}%` }}>
                {item.renderHeader()}
                <tbody>
                  {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                  {item.showFooter && item.renderFooter?.()}
                </tbody>
              </table>
            </section>
          );
        }

        if (item.key.startsWith('terms')) {
          return (
            <section key={item.key} className="mb-6">
              <h3 className="mb-2 text-sm font-bold text-gray-900">TERMS AND CONDITIONS:</h3>
              <table className={tableClass} style={{ width: `${termsTableWidthPercent}%` }}>
                <tbody>
                  {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                  {item.showFooter && item.renderFooter?.()}
                </tbody>
              </table>
            </section>
          );
        }

        return (
          <section key={item.key}>
            <table className={tableClass}>
              {item.renderHeader()}
              <tbody>
                {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                {item.showFooter && item.renderFooter?.()}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  ));
}
