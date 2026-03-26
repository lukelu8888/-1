import React, { forwardRef, useMemo } from 'react';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import {
  getCustomerInquiryRequirementRows,
  normalizeCustomerInquiryProductTableColumns,
  type CustomerInquiryData,
} from '../CustomerInquiryDocument';

interface CustomerInquiryDocumentA4Props {
  data: CustomerInquiryData;
  showControls?: boolean;
}

const sectionTitleClass = 'text-sm font-bold mb-2 text-gray-900';
const tableClass = 'w-full table-fixed border-collapse text-[12px]';
const fullWidthTableClass = 'w-full border-collapse table-fixed text-xs';
const thClass = 'border border-gray-400 px-2 py-2 break-words bg-gray-100 font-semibold';
const tdClass = 'border border-gray-300 px-2 py-2 align-top';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRegion(value: CustomerInquiryData['region'] | string) {
  if (value === 'NA') return 'North America';
  if (value === 'SA') return 'South America';
  if (value === 'EU') return 'Europe & Africa';
  return value;
}

export const CustomerInquiryDocumentA4 = forwardRef<HTMLDivElement, CustomerInquiryDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildCustomerInquiryPages(data), [data]);

    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.inquiryNo || 'customer-inquiry'}.pdf`} />
      </div>
    );
  },
);

CustomerInquiryDocumentA4.displayName = 'CustomerInquiryDocumentA4';

interface CustomerInquiryDocumentA4PagesProps {
  data: CustomerInquiryData;
}

export function CustomerInquiryDocumentA4Pages({ data }: CustomerInquiryDocumentA4PagesProps) {
  const pages = useMemo(() => buildCustomerInquiryPages(data), [data]);

  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`inq-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildCustomerInquiryPages(data: CustomerInquiryData): React.ReactNode[] {
  const products = Array.isArray(data.products) ? data.products : [];
  const total = products.reduce((sum, p) => sum + Number(p.quantity || 0) * Number(p.targetPrice || 0), 0);
  const currency = products[0]?.currency || 'USD';
  const requirementRows = getCustomerInquiryRequirementRows(data, { includeEmpty: true });
  const productTableColumns = normalizeCustomerInquiryProductTableColumns(
    data.templateSettings?.productTableColumns,
  );

  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 126,
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-wider text-black">CUSTOMER INQUIRY</h1>
            </div>
            <div className="w-[240px]">
              <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Inq. No.</td>
                  <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.inquiryNo || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                  <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">{formatDate(data.inquiryDate)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Region</td>
                  <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">{formatRegion(data.region)}</td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
          <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>
      ),
    },
    {
      type: 'section',
      key: 'customer',
      estimatedHeight: 154,
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <table className={fullWidthTableClass}>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-0 align-top">
                  <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                    CUSTOMER INFORMATION
                  </div>
                  <div className="px-2 py-1.5 space-y-0.5">
                    <div><span className="font-semibold">{data.customer.companyName}</span></div>
                    <div><span className="text-gray-600">Contact:</span> {data.customer.contactPerson}{data.customer.position ? ` (${data.customer.position})` : ''}</div>
                    <div><span className="text-gray-600">Email:</span> {data.customer.email}</div>
                    {data.customer.phone && <div><span className="text-gray-600">Tel:</span> {data.customer.phone}</div>}
                    {data.customer.address && <div><span className="text-gray-600">Address:</span> {data.customer.address}</div>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      type: 'table',
      key: 'products',
      avoidBreak: true,
      headerHeight: 82,
      rowHeight: 56,
      footerHeight: total > 0 ? 46 : 0,
      rows: products,
      renderHeader: () => (
        <>
          <colgroup>
            {productTableColumns.map((column) => (
              <col key={column.key} style={{ width: `${column.widthPercent}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-100">
              {productTableColumns.map((column) => {
                const alignmentClass =
                  column.key === 'image'
                    ? 'text-center'
                    : column.key === 'quantity' || column.key === 'targetPrice' || column.key === 'estimatedValue'
                      ? 'text-right'
                      : column.key === 'unit'
                        ? 'text-center'
                        : 'text-left';

                return (
                  <th key={column.key} className={`${thClass} ${column.key === 'quantity' || column.key === 'unit' || column.key === 'targetPrice' || column.key === 'estimatedValue' ? 'whitespace-nowrap break-normal' : ''} ${alignmentClass}`}>
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
        </>
      ),
      renderRow: (row, idx) => {
        const estimated = Number(row.quantity || 0) * Number(row.targetPrice || 0);
        const hasPrice = Number(row.targetPrice || 0) > 0;
        return (
          <tr key={`${row.no}-${idx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            {productTableColumns.map((column) => {
              if (column.key === 'no') {
                return <td key={column.key} className={`${tdClass} text-center`}>{row.no || idx + 1}</td>;
              }

              if (column.key === 'modelNo') {
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-gray-700">{row.modelNo || '-'}</td>;
              }

              if (column.key === 'image') {
                return (
                  <td key={column.key} className="border border-gray-300 px-1 py-1 text-center">
                    {row.imageUrl ? (
                      <img
                        src={row.imageUrl}
                        alt={row.productName}
                        className="w-10 h-10 object-cover mx-auto rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-400">
                        N/A
                      </div>
                    )}
                  </td>
                );
              }

              if (column.key === 'itemNameSpecification') {
                return (
                  <td key={column.key} className="border border-gray-300 px-2 py-2">
                    <div className="font-semibold text-[#111827]">{row.productName}</div>
                    {row.specification && <div className="text-xs text-gray-600 mt-0.5">{row.specification}</div>}
                  </td>
                );
              }

              if (column.key === 'quantity') {
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{Number(row.quantity || 0).toLocaleString()}</td>;
              }

              if (column.key === 'unit') {
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{row.unit}</td>;
              }

              if (column.key === 'targetPrice') {
                return (
                  <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">
                    {hasPrice ? Number(row.targetPrice || 0).toFixed(2) : '-'}
                  </td>
                );
              }

              return (
                <td key={column.key} className="border border-gray-300 px-2 py-2 text-right font-semibold">
                  {hasPrice ? estimated.toFixed(2) : '-'}
                </td>
              );
            })}
          </tr>
        );
      },
      renderFooter: () => (
        <tr className="bg-gray-100 font-bold">
          <td className="border border-gray-300 px-2 py-2 text-right" colSpan={Math.max(productTableColumns.length - 1, 1)}>
            Total Value ({currency}):
          </td>
          <td className="border border-gray-300 px-2 py-2 text-right font-semibold">{total.toFixed(2)}</td>
        </tr>
      ),
    },
  ];

  blocks.push({
    type: 'section',
    key: 'requirements',
    estimatedHeight: 44 + requirementRows.length * 34,
    avoidBreak: true,
    render: () => (
      <div className="mb-6">
        <h2 className={sectionTitleClass}>TRADING REQUIREMENTS</h2>
        <table className={fullWidthTableClass}>
          <tbody>
            {requirementRows.map((row, index) => (
              <tr key={row.label}>
                <td className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-100" style={index === 0 ? { width: '25%' } : undefined}>
                  {row.label}
                </td>
                <td className="border border-gray-400 px-2 py-1.5 whitespace-pre-wrap">{row.value || '\u00A0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  });

  blocks.push({
    type: 'section',
    key: 'footer-statement',
    estimatedHeight: 32,
    avoidBreak: true,
    render: () => (
      <div className="text-xs text-gray-600 text-center border-t border-gray-300 pt-2">
        This inquiry will be processed and quoted within 24-48 hours. Thank you for your interest.
      </div>
    ),
  });

  return paginateBlocks(blocks).map((page) => (
    <div key={`inq-${page.index}`} className="flex h-full flex-col text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        return (
          <div key={item.key} className="mb-4">
            <h2 className={sectionTitleClass}>PRODUCT REQUIREMENTS</h2>
            <table className={fullWidthTableClass}>
              {item.renderHeader()}
              <tbody>
                {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                {item.showFooter && item.renderFooter?.()}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  ));
}
