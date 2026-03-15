import React, { forwardRef, useMemo } from 'react';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import { getCustomerInquiryRequirementRows, type CustomerInquiryData } from '../CustomerInquiryDocument';

interface CustomerInquiryDocumentA4Props {
  data: CustomerInquiryData;
  showControls?: boolean;
}

const sectionTitleClass = 'text-[14px] font-bold text-[#111827] mb-2';
const tableClass = 'w-full border-collapse text-[12px]';
const thClass = 'border border-[#cbd5e1] bg-[#f3f4f6] p-2 text-left font-semibold';
const tdClass = 'border border-[#cbd5e1] p-2 align-top';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 140,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="mb-2 flex items-start justify-between">
            <h1 className="text-[28px] font-bold tracking-wide text-[#111827]">CUSTOMER INQUIRY</h1>
            <table className={tableClass} style={{ width: 300 }}>
              <tbody>
                <tr>
                  <td className={thClass}>Inq. No.</td>
                  <td className={tdClass}>{data.inquiryNo}</td>
                </tr>
                <tr>
                  <td className={thClass}>Date</td>
                  <td className={tdClass}>{formatDate(data.inquiryDate)}</td>
                </tr>
                <tr>
                  <td className={thClass}>Region</td>
                  <td className={tdClass}>{data.region}</td>
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
      key: 'customer',
      estimatedHeight: 170,
      avoidBreak: true,
      render: () => (
        <section>
          <h2 className={sectionTitleClass}>CUSTOMER INFORMATION</h2>
          <table className={tableClass}>
            <tbody>
              <tr>
                <td className={thClass}>Company</td>
                <td className={tdClass}>{data.customer.companyName}</td>
                <td className={thClass}>Contact</td>
                <td className={tdClass}>{data.customer.contactPerson}</td>
              </tr>
              <tr>
                <td className={thClass}>Email</td>
                <td className={tdClass}>{data.customer.email}</td>
                <td className={thClass}>Phone</td>
                <td className={tdClass}>{data.customer.phone || '-'}</td>
              </tr>
              <tr>
                <td className={thClass}>Country</td>
                <td className={tdClass}>{data.customer.country}</td>
                <td className={thClass}>Address</td>
                <td className={tdClass}>{data.customer.address || '-'}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ),
    },
    {
      type: 'table',
      key: 'products',
      avoidBreak: true,
      headerHeight: 92,
      rowHeight: 56,
      footerHeight: total > 0 ? 46 : 0,
      rows: products,
      renderHeader: () => (
        <thead>
          <tr>
            <th className={thClass}>No.</th>
            <th className={thClass}>Product</th>
            <th className={thClass}>Specification</th>
            <th className={thClass}>Quantity</th>
            <th className={thClass}>Unit</th>
            <th className={thClass}>Target Price</th>
            <th className={thClass}>Est. Value</th>
          </tr>
        </thead>
      ),
      renderRow: (row, idx) => {
        const estimated = Number(row.quantity || 0) * Number(row.targetPrice || 0);
        const hasPrice = Number(row.targetPrice || 0) > 0;
        return (
          <tr key={`${row.no}-${idx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <td className={tdClass}>{row.no || idx + 1}</td>
            <td className={tdClass}>{row.productName}</td>
            <td className={tdClass}>{row.specification || '-'}</td>
            <td className={tdClass}>{Number(row.quantity || 0).toLocaleString()}</td>
            <td className={tdClass}>{row.unit}</td>
            <td className={tdClass}>{hasPrice ? `${row.currency || currency} ${Number(row.targetPrice || 0).toFixed(2)}` : '-'}</td>
            <td className={tdClass}>{hasPrice ? `${row.currency || currency} ${estimated.toFixed(2)}` : '-'}</td>
          </tr>
        );
      },
      renderFooter: () => (
        <tr>
          <td className={`${tdClass} font-semibold text-right`} colSpan={6}>
            ESTIMATED TOTAL
          </td>
          <td className={`${tdClass} font-semibold`}>{`${currency} ${total.toFixed(2)}`}</td>
        </tr>
      ),
    },
  ];

  blocks.push({
    type: 'section',
    key: 'requirements',
    estimatedHeight: 38 + requirementRows.length * 34,
    avoidBreak: true,
    render: () => (
      <section>
        <h2 className={sectionTitleClass}>TRADING REQUIREMENTS</h2>
        <table className={tableClass}>
          <tbody>
            {requirementRows.map((row) => (
              <tr key={row.label}>
                <td className={thClass} style={{ width: 190 }}>
                  {row.label}
                </td>
                <td className={`${tdClass} whitespace-pre-wrap`}>{row.value || '\u00A0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    ),
  });

  return paginateBlocks(blocks).map((page) => (
    <div key={`inq-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        return (
          <section key={item.key}>
            <h2 className={sectionTitleClass}>PRODUCT REQUIREMENTS</h2>
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
