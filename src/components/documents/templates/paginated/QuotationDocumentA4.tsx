import React, { forwardRef, useMemo } from 'react';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import type { QuotationData } from '../QuotationDocument';

interface QuotationDocumentA4Props {
  data?: QuotationData;
  quotation?: QuotationData;
  showControls?: boolean;
}

interface QuotationDocumentA4PagesProps {
  data?: QuotationData;
  quotation?: QuotationData;
}

const tableClass = 'w-full border-collapse text-[12px]';
const thClass = 'border border-[#cbd5e1] bg-[#f3f4f6] p-2 text-left font-semibold';
const tdClass = 'border border-[#cbd5e1] p-2 align-top';
const sectionTitleClass = 'text-[14px] font-bold text-[#111827] mb-2';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const QuotationDocumentA4 = forwardRef<HTMLDivElement, QuotationDocumentA4Props>(
  ({ data, quotation, showControls = false }, ref) => {
    const quotationData = quotation || data;
    if (!quotationData) {
      return <div ref={ref}>No quotation data available</div>;
    }

    const currency = quotationData.products[0]?.currency || 'USD';
    const total = quotationData.products.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const blocks = useMemo<A4Block[]>(() => {
      const result: A4Block[] = [
        {
          type: 'section',
          key: 'header',
          estimatedHeight: 150,
          avoidBreak: true,
          render: () => (
            <div>
              <div className="mb-2 flex items-start justify-between gap-4">
                <h1 className="text-[28px] font-bold tracking-wide text-[#111827]">QUOTATION</h1>
                <table className={tableClass} style={{ width: 320 }}>
                  <tbody>
                    {quotationData.inquiryNo && (
                      <tr>
                        <td className={thClass}>Inq. No.</td>
                        <td className={tdClass}>{quotationData.inquiryNo}</td>
                      </tr>
                    )}
                    <tr>
                      <td className={thClass}>Quo. No.</td>
                      <td className={tdClass}>{quotationData.quotationNo}</td>
                    </tr>
                    <tr>
                      <td className={thClass}>Date</td>
                      <td className={tdClass}>{formatDate(quotationData.quotationDate)}</td>
                    </tr>
                    <tr>
                      <td className={thClass}>Valid Until</td>
                      <td className={tdClass}>{formatDate(quotationData.validUntil)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="h-[2px] w-full bg-[#111827]" />
            </div>
          ),
        },
        {
          type: 'section',
          key: 'parties',
          estimatedHeight: 180,
          avoidBreak: true,
          render: () => (
            <section>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>FROM</th>
                    <th className={thClass}>TO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdClass}>
                      <div className="font-semibold">{quotationData.company.nameEn}</div>
                      <div>Address: {quotationData.company.addressEn}</div>
                      <div>Email: {quotationData.company.email}</div>
                      <div>Tel: {quotationData.company.tel}</div>
                    </td>
                    <td className={tdClass}>
                      <div className="font-semibold">{quotationData.customer.companyName}</div>
                      <div>Contact: {quotationData.customer.contactPerson}</div>
                      <div>Email: {quotationData.customer.email}</div>
                      <div>Address: {quotationData.customer.address || '-'}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          ),
        },
        {
          type: 'table',
          key: 'items',
          headerHeight: 92,
          rowHeight: 58,
          footerHeight: 44,
          rows: quotationData.products,
          renderHeader: () => (
            <thead>
              <tr>
                <th className={thClass}>No.</th>
                <th className={thClass}>Product</th>
                <th className={thClass}>Specification</th>
                <th className={thClass}>Qty</th>
                <th className={thClass}>Unit</th>
                <th className={thClass}>Unit Price</th>
                <th className={thClass}>Amount</th>
              </tr>
            </thead>
          ),
          renderRow: (row, idx) => (
            <tr key={`${row.no}-${idx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <td className={tdClass}>{row.no || idx + 1}</td>
              <td className={tdClass}>{row.productName}</td>
              <td className={tdClass}>{row.specification}</td>
              <td className={tdClass}>{Number(row.quantity || 0).toLocaleString()}</td>
              <td className={tdClass}>{row.unit}</td>
              <td className={tdClass}>{`${row.currency || currency} ${Number(row.unitPrice || 0).toFixed(2)}`}</td>
              <td className={tdClass}>{`${row.currency || currency} ${Number(row.amount || 0).toFixed(2)}`}</td>
            </tr>
          ),
          renderFooter: () => (
            <tr>
              <td className={`${tdClass} text-right font-semibold`} colSpan={6}>
                TOTAL VALUE
              </td>
              <td className={`${tdClass} font-semibold`}>{`${currency} ${total.toFixed(2)}`}</td>
            </tr>
          ),
        },
        {
          type: 'section',
          key: 'terms',
          estimatedHeight: 200,
          avoidBreak: true,
          render: () => (
            <section>
              <h2 className={sectionTitleClass}>TERMS AND CONDITIONS</h2>
              <table className={tableClass}>
                <tbody>
                  <tr>
                    <td className={thClass} style={{ width: 180 }}>
                      Incoterms
                    </td>
                    <td className={tdClass}>{quotationData.tradeTerms.incoterms}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>Payment Terms</td>
                    <td className={tdClass}>{quotationData.tradeTerms.paymentTerms}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>Delivery Time</td>
                    <td className={tdClass}>{quotationData.tradeTerms.deliveryTime}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>Port</td>
                    <td className={tdClass}>
                      {quotationData.tradeTerms.portOfLoading}
                      {quotationData.tradeTerms.portOfDestination
                        ? ` → ${quotationData.tradeTerms.portOfDestination}`
                        : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className={thClass}>Packing</td>
                    <td className={tdClass}>{quotationData.tradeTerms.packing}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ),
        },
      ];

      if (quotationData.remarks) {
        result.push({
          type: 'section',
          key: 'remarks',
          estimatedHeight: 120,
          avoidBreak: true,
          render: () => (
            <section>
              <h2 className={sectionTitleClass}>REMARKS</h2>
              <div className="rounded border border-[#cbd5e1] p-3 text-[12px] leading-6">{quotationData.remarks}</div>
            </section>
          ),
        });
      }

      return result;
    }, [currency, quotationData, total]);

    const pages = buildQuotationPages(quotationData);

    return (
      <div ref={ref}>
        <A4DocumentViewer
          pages={pages}
          showControls={showControls}
          fileName={`${quotationData.quotationNo || 'qt'}.pdf`}
        />
      </div>
    );
  },
);

QuotationDocumentA4.displayName = 'QuotationDocumentA4';

export function QuotationDocumentA4Pages({ data, quotation }: QuotationDocumentA4PagesProps) {
  const quotationData = quotation || data;
  if (!quotationData) return null;

  const pages = useMemo(() => buildQuotationPages(quotationData), [quotationData]);

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

export function buildQuotationPages(quotationData: QuotationData): React.ReactNode[] {
  const currency = quotationData.products[0]?.currency || 'USD';
  const total = quotationData.products.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 150,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="mb-2 flex items-start justify-between gap-4">
            <h1 className="text-[28px] font-bold tracking-wide text-[#111827]">QUOTATION</h1>
            <table className={tableClass} style={{ width: 320 }}>
              <tbody>
                {quotationData.inquiryNo && (
                  <tr>
                    <td className={thClass}>Inq. No.</td>
                    <td className={tdClass}>{quotationData.inquiryNo}</td>
                  </tr>
                )}
                <tr>
                  <td className={thClass}>Quo. No.</td>
                  <td className={tdClass}>{quotationData.quotationNo}</td>
                </tr>
                <tr>
                  <td className={thClass}>Date</td>
                  <td className={tdClass}>{formatDate(quotationData.quotationDate)}</td>
                </tr>
                <tr>
                  <td className={thClass}>Valid Until</td>
                  <td className={tdClass}>{formatDate(quotationData.validUntil)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="h-[2px] w-full bg-[#111827]" />
        </div>
      ),
    },
    {
      type: 'section',
      key: 'parties',
      estimatedHeight: 180,
      avoidBreak: true,
      render: () => (
        <section>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>FROM</th>
                <th className={thClass}>TO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdClass}>
                  <div className="font-semibold">{quotationData.company.nameEn}</div>
                  <div>Address: {quotationData.company.addressEn}</div>
                  <div>Email: {quotationData.company.email}</div>
                  <div>Tel: {quotationData.company.tel}</div>
                </td>
                <td className={tdClass}>
                  <div className="font-semibold">{quotationData.customer.companyName}</div>
                  <div>Contact: {quotationData.customer.contactPerson}</div>
                  <div>Email: {quotationData.customer.email}</div>
                  <div>Address: {quotationData.customer.address || '-'}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      ),
    },
    {
      type: 'table',
      key: 'items',
      headerHeight: 92,
      rowHeight: 58,
      footerHeight: 44,
      rows: quotationData.products,
      renderHeader: () => (
        <thead>
          <tr>
            <th className={thClass}>No.</th>
            <th className={thClass}>Product</th>
            <th className={thClass}>Specification</th>
            <th className={thClass}>Qty</th>
            <th className={thClass}>Unit</th>
            <th className={thClass}>Unit Price</th>
            <th className={thClass}>Amount</th>
          </tr>
        </thead>
      ),
      renderRow: (row, idx) => (
        <tr key={`${row.no}-${idx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className={tdClass}>{row.no || idx + 1}</td>
          <td className={tdClass}>{row.productName}</td>
          <td className={tdClass}>{row.specification}</td>
          <td className={tdClass}>{Number(row.quantity || 0).toLocaleString()}</td>
          <td className={tdClass}>{row.unit}</td>
          <td className={tdClass}>{`${row.currency || currency} ${Number(row.unitPrice || 0).toFixed(2)}`}</td>
          <td className={tdClass}>{`${row.currency || currency} ${Number(row.amount || 0).toFixed(2)}`}</td>
        </tr>
      ),
      renderFooter: () => (
        <tr>
          <td className={`${tdClass} text-right font-semibold`} colSpan={6}>
            TOTAL VALUE
          </td>
          <td className={`${tdClass} font-semibold`}>{`${currency} ${total.toFixed(2)}`}</td>
        </tr>
      ),
    },
    {
      type: 'section',
      key: 'terms',
      estimatedHeight: 200,
      avoidBreak: true,
      render: () => (
        <section>
          <h2 className={sectionTitleClass}>TERMS AND CONDITIONS</h2>
          <table className={tableClass}>
            <tbody>
              <tr>
                <td className={thClass} style={{ width: 180 }}>
                  Incoterms
                </td>
                <td className={tdClass}>{quotationData.tradeTerms.incoterms}</td>
              </tr>
              <tr>
                <td className={thClass}>Payment Terms</td>
                <td className={tdClass}>{quotationData.tradeTerms.paymentTerms}</td>
              </tr>
              <tr>
                <td className={thClass}>Delivery Time</td>
                <td className={tdClass}>{quotationData.tradeTerms.deliveryTime}</td>
              </tr>
              <tr>
                <td className={thClass}>Port</td>
                <td className={tdClass}>
                  {quotationData.tradeTerms.portOfLoading}
                  {quotationData.tradeTerms.portOfDestination
                    ? ` → ${quotationData.tradeTerms.portOfDestination}`
                    : ''}
                </td>
              </tr>
              <tr>
                <td className={thClass}>Packing</td>
                <td className={tdClass}>{quotationData.tradeTerms.packing}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ),
    },
  ];

  if (quotationData.remarks) {
    blocks.push({
      type: 'section',
      key: 'remarks',
      estimatedHeight: 120,
      avoidBreak: true,
      render: () => (
        <section>
          <h2 className={sectionTitleClass}>REMARKS</h2>
          <div className="rounded border border-[#cbd5e1] p-3 text-[12px] leading-6">{quotationData.remarks}</div>
        </section>
      ),
    });
  }

  return paginateBlocks(blocks).map((page) => (
      <div key={`qt-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
        {page.items.map((item) => {
          if (item.type === 'section') {
            return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
          }

          return (
            <section key={item.key}>
              <h2 className={sectionTitleClass}>QUOTATION ITEMS</h2>
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
