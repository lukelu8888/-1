import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import {
  DEFAULT_COMMERCIAL_INVOICE_GOODS_TABLE_COLUMNS,
  normalizeCommercialInvoiceGoodsTableColumns,
  type CommercialInvoiceData,
} from '../CommercialInvoiceDocument';

interface CommercialInvoiceDocumentA4Props {
  data: CommercialInvoiceData;
  showControls?: boolean;
}

interface CommercialInvoiceDocumentA4PagesProps {
  data: CommercialInvoiceData;
}

const sectionTitleClass = 'mb-2 text-[14px] font-bold text-black';
const tableClass = 'w-full border-collapse border border-black text-xs';
const productTableClass = 'w-full border-collapse border-2 border-black text-xs';
const thClass = 'border border-black bg-gray-200 px-1 py-1 font-semibold';
const tdClass = 'border border-black px-1 py-1 align-top';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function buildGoodsRowHeight(item: CommercialInvoiceData['goods'][number]) {
  const lines = estimateWrappedLines(item.description || '', 44);
  return Math.max(32, 12 + lines * 12);
}

export const CommercialInvoiceDocumentA4 = forwardRef<HTMLDivElement, CommercialInvoiceDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildCommercialInvoicePages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.invoiceNo || 'ci'}.pdf`} />
      </div>
    );
  },
);

CommercialInvoiceDocumentA4.displayName = 'CommercialInvoiceDocumentA4';

export function CommercialInvoiceDocumentA4Pages({ data }: CommercialInvoiceDocumentA4PagesProps) {
  const pages = useMemo(() => buildCommercialInvoicePages(data), [data]);
  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`ci-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildCommercialInvoicePages(data: CommercialInvoiceData): React.ReactNode[] {
  const exporterDisplayName = data.exporter.nameEn || data.exporter.name;
  const exporterDisplayAddress = data.exporter.addressEn || data.exporter.address;
  const total = data.goods.reduce((sum, item) => sum + item.amount, 0);
  const currency = data.goods[0]?.currency || 'USD';
  const goodsTableColumns = normalizeCommercialInvoiceGoodsTableColumns(
    data.templateSettings?.goodsTableColumns || DEFAULT_COMMERCIAL_INVOICE_GOODS_TABLE_COLUMNS,
  );
  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 130,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="mb-2 flex items-start justify-between">
            <div className="w-[70px] flex-shrink-0">
              <img src={cosunLogo} alt="Company Logo" className="w-full h-auto" style={{ objectFit: 'contain' }} />
            </div>
            <div className="flex flex-1 justify-center items-center">
              <h1 className="text-2xl font-bold tracking-wider text-black whitespace-nowrap">COMMERCIAL INVOICE</h1>
            </div>
            <div className="w-[250px]">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap w-[85px]">Invoice No.</td>
                    <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap">{data.invoiceNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{formatDate(data.invoiceDate)}</td>
                  </tr>
                  {data.contractNo ? (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Contract No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{data.contractNo}</td>
                    </tr>
                  ) : null}
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
      key: 'parties',
      estimatedHeight: 140,
      avoidBreak: true,
      render: () => (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-black p-3">
            <h3 className="mb-2 font-semibold underline">EXPORTER (Seller):</h3>
            <p className="font-semibold">{exporterDisplayName}</p>
            <p>{exporterDisplayAddress}</p>
            <p>Tel: {data.exporter.tel}</p>
          </div>
          <div className="border border-black p-3">
            <h3 className="mb-2 font-semibold underline">IMPORTER (Buyer):</h3>
            <p className="font-semibold">{data.importer.name}</p>
            <p>{data.importer.address}</p>
            <p>{data.importer.country}</p>
            {data.importer.tel ? <p>Tel: {data.importer.tel}</p> : null}
          </div>
        </div>
      ),
    },
    {
      type: 'section',
      key: 'marks',
      estimatedHeight: 88,
      avoidBreak: true,
      render: () => (
        <div className="border border-black p-3">
          <h3 className="mb-2 font-semibold">SHIPPING MARKS:</h3>
          <div className="font-mono text-sm whitespace-pre-line">
            {data.shippingMarks.mainMark}
            {data.shippingMarks.sideMark ? `\n${data.shippingMarks.sideMark}` : ''}
            {data.shippingMarks.cautionMark ? `\n${data.shippingMarks.cautionMark}` : ''}
          </div>
        </div>
      ),
    },
    {
      type: 'table',
      key: 'goods',
      headerHeight: 74,
      rowHeight: (row) => buildGoodsRowHeight(row),
      footerHeight: 52,
      rows: data.goods,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-200">
            {goodsTableColumns.map((column) => (
              <th
                key={column.key}
                className={`border border-black px-1 py-1 ${
                  column.key === 'quantity' || column.key === 'unitPrice' || column.key === 'amount'
                    ? 'text-right'
                    : column.key === 'unit'
                      ? 'text-center'
                      : ''
                }`}
                style={{ width: `${column.widthPercent}%` }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
      ),
      renderRow: (item) => (
        <tr key={item.no} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          {goodsTableColumns.map((column) => {
            switch (column.key) {
              case 'no':
                return <td key={column.key} className={`${tdClass} text-center`}>{item.no}</td>;
              case 'description':
                return <td key={column.key} className={tdClass}>{item.description}</td>;
              case 'hsCode':
                return <td key={column.key} className={`${tdClass} text-center`}>{item.hsCode}</td>;
              case 'quantity':
                return <td key={column.key} className={`${tdClass} text-right`}>{item.quantity.toLocaleString()}</td>;
              case 'unit':
                return <td key={column.key} className={`${tdClass} text-center`}>{item.unit}</td>;
              case 'unitPrice':
                return <td key={column.key} className={`${tdClass} text-right`}>{item.unitPrice.toFixed(2)}</td>;
              case 'amount':
              default:
                return <td key={column.key} className={`${tdClass} text-right font-semibold`}>{item.amount.toFixed(2)}</td>;
            }
          })}
        </tr>
      ),
      renderFooter: () => (
        <>
          <tr className="font-semibold">
            <td colSpan={Math.max(goodsTableColumns.length - 1, 1)} className={`${tdClass} text-right`}>TOTAL({currency}):</td>
            <td className={`${tdClass} text-right`}>{total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={7} className={`${tdClass} px-2 py-1 text-xs`}>
              <span className="font-semibold">SAY TOTAL: </span>
              {currency} {total.toFixed(2)} ONLY
            </td>
          </tr>
        </>
      ),
    },
    {
      type: 'section',
      key: 'shipping-info',
      estimatedHeight: 120,
      avoidBreak: true,
      render: () => (
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="mb-1"><span className="font-semibold">Terms:</span> {data.shipping.tradeTerms}</div>
            <div className="mb-1"><span className="font-semibold">Payment:</span> {data.shipping.paymentTerms}</div>
            <div className="mb-1"><span className="font-semibold">Port of Loading:</span> {data.shipping.portOfLoading}</div>
            <div className="mb-1"><span className="font-semibold">Port of Discharge:</span> {data.shipping.portOfDischarge}</div>
            <div><span className="font-semibold">Final Destination:</span> {data.shipping.finalDestination}</div>
          </div>
          <div>
            <div className="mb-1"><span className="font-semibold">Total Cartons:</span> {data.packing.totalCartons}</div>
            <div className="mb-1"><span className="font-semibold">Total G.W.:</span> {data.packing.totalGrossWeight} KGS</div>
            <div className="mb-1"><span className="font-semibold">Total N.W.:</span> {data.packing.totalNetWeight} KGS</div>
            <div><span className="font-semibold">Total Measurement:</span> {data.packing.totalMeasurement} CBM</div>
          </div>
        </div>
      ),
    },
  ];

  return paginateBlocks(blocks).map((page) => (
    <div key={`ci-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        return (
          <section key={item.key}>
            <h2 className={sectionTitleClass}>DESCRIPTION OF GOODS:</h2>
            <table className={productTableClass}>
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
