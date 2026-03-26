import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import type { StatementOfAccountData } from '../StatementOfAccountDocument';

interface StatementOfAccountDocumentA4Props {
  data: StatementOfAccountData;
  showControls?: boolean;
}

interface StatementOfAccountDocumentA4PagesProps {
  data: StatementOfAccountData;
}

const tableClass = 'w-full border-collapse border border-gray-400 text-xs';
const tdClass = 'border border-gray-400 px-2 py-1 align-top';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'invoice': return 'Invoice';
    case 'payment': return 'Payment';
    case 'credit_note': return 'Credit Note';
    case 'debit_note': return 'Debit Note';
    default: return type;
  }
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function buildTransactionRowHeight(row: StatementOfAccountData['transactions'][number]) {
  return Math.max(30, 10 + estimateWrappedLines(row.description || '', 26) * 11);
}

export const StatementOfAccountDocumentA4 = forwardRef<HTMLDivElement, StatementOfAccountDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildStatementPages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.statementNo || 'soa'}.pdf`} />
      </div>
    );
  },
);

StatementOfAccountDocumentA4.displayName = 'StatementOfAccountDocumentA4';

export function StatementOfAccountDocumentA4Pages({ data }: StatementOfAccountDocumentA4PagesProps) {
  const pages = useMemo(() => buildStatementPages(data), [data]);
  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`soa-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildStatementPages(data: StatementOfAccountData): React.ReactNode[] {
  const totalDebit = data.transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = data.transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
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
              <h1 className="text-2xl font-bold tracking-wider text-black whitespace-nowrap">STATEMENT OF ACCOUNT</h1>
            </div>
            <div className="w-[250px]">
              <table className={tableClass}>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap w-[85px]">Statement No.</td>
                    <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap">{data.statementNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{formatDate(data.statementDate)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Period</td>
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">
                      {new Date(data.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {formatDate(data.periodEnd)}
                    </td>
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
      key: 'parties',
      estimatedHeight: 128,
      avoidBreak: true,
      render: () => (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="border border-gray-400">
            <div className="bg-gray-100 border-b border-gray-400 px-2 py-1 font-semibold">SELLER:</div>
            <div className="px-2 py-1.5 space-y-0.5">
              <p className="font-semibold text-black">{data.company.nameEn}</p>
              <p className="text-gray-700">{data.company.addressEn}</p>
              <p className="text-gray-700">Tel: {data.company.tel}</p>
              <p className="text-gray-700">Email: {data.company.email}</p>
            </div>
          </div>
          <div className="border border-gray-400">
            <div className="bg-gray-100 border-b border-gray-400 px-2 py-1 font-semibold">CUSTOMER (Code: {data.customer.customerCode}):</div>
            <div className="px-2 py-1.5 space-y-0.5">
              <p className="font-semibold text-black">{data.customer.companyName}</p>
              <p className="text-gray-700">{data.customer.address}</p>
              <p className="text-gray-700">Contact: {data.customer.contactPerson}</p>
              <p className="text-gray-700">Email: {data.customer.email}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      type: 'section',
      key: 'opening',
      estimatedHeight: 46,
      avoidBreak: true,
      render: () => (
        <table className={tableClass}>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold w-[120px]">Opening Balance:</td>
              <td className="border border-gray-400 px-2 py-1 font-bold text-black">
                {data.openingBalance.currency} {data.openingBalance.amount.toFixed(2)}
                <span className="ml-2 text-xs font-normal text-gray-600">({data.openingBalance.type === 'debit' ? 'Receivable' : 'Payable'})</span>
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      type: 'table',
      key: 'transactions',
      headerHeight: 68,
      rowHeight: (row) => buildTransactionRowHeight(row),
      footerHeight: 40,
      rows: data.transactions,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold w-[70px]">Date</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold w-[65px]">Type</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold w-[110px]">Reference</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Description</th>
            <th className="border border-gray-400 px-2 py-1.5 text-right font-semibold w-[85px]">Debit</th>
            <th className="border border-gray-400 px-2 py-1.5 text-right font-semibold w-[85px]">Credit</th>
            <th className="border border-gray-400 px-2 py-1.5 text-right font-semibold w-[85px]">Balance</th>
          </tr>
        </thead>
      ),
      renderRow: (transaction) => (
        <tr key={`${transaction.referenceNo}-${transaction.date}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className={`${tdClass} whitespace-nowrap`}>{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
          <td className={`${tdClass} text-xs`}>{getTypeLabel(transaction.type)}</td>
          <td className={`${tdClass} font-mono text-[10px]`}>{transaction.referenceNo}</td>
          <td className={tdClass}>{transaction.description}</td>
          <td className={`${tdClass} text-right`}>{transaction.debit ? transaction.debit.toFixed(2) : '-'}</td>
          <td className={`${tdClass} text-right`}>{transaction.credit ? transaction.credit.toFixed(2) : '-'}</td>
          <td className={`${tdClass} text-right font-semibold`}>{transaction.balance.toFixed(2)}</td>
        </tr>
      ),
      renderFooter: () => (
        <tr className="bg-gray-100">
          <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right font-semibold">TOTAL:</td>
          <td className="border border-gray-400 px-2 py-1.5 text-right font-bold text-black">{totalDebit.toFixed(2)}</td>
          <td className="border border-gray-400 px-2 py-1.5 text-right font-bold text-black">{totalCredit.toFixed(2)}</td>
          <td className="border border-gray-400 px-2 py-1.5"></td>
        </tr>
      ),
    },
    {
      type: 'section',
      key: 'closing',
      estimatedHeight: 56,
      avoidBreak: true,
      render: () => (
        <table className="w-full border-collapse border-2 border-black text-xs">
          <tbody>
            <tr className="bg-gray-100">
              <td className="border-2 border-black px-2 py-1.5 font-bold w-[120px]">Closing Balance:</td>
              <td className="border-2 border-black px-2 py-1.5 font-bold text-black text-lg">
                {data.closingBalance.currency} {Math.abs(data.closingBalance.amount).toFixed(2)}
                <span className="ml-3 text-sm">({data.closingBalance.type === 'debit' ? 'RECEIVABLE' : 'PAYABLE'})</span>
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
  ];

  if (data.agingAnalysis && data.closingBalance.type === 'debit') {
    blocks.push({
      type: 'section',
      key: 'aging',
      estimatedHeight: 150,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="bg-gray-100 border border-gray-400 px-2 py-1 font-semibold text-xs mb-1">AGING ANALYSIS:</div>
          <table className={tableClass}>
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Period</th>
                <th className="border border-gray-400 px-2 py-1 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={tdClass}>Current (0-30 days)</td><td className={`${tdClass} text-right font-semibold`}>{data.closingBalance.currency} {data.agingAnalysis.current.toFixed(2)}</td></tr>
              <tr><td className={tdClass}>31-60 days</td><td className={`${tdClass} text-right font-semibold`}>{data.closingBalance.currency} {data.agingAnalysis.days30.toFixed(2)}</td></tr>
              <tr><td className={tdClass}>61-90 days</td><td className={`${tdClass} text-right font-semibold`}>{data.closingBalance.currency} {data.agingAnalysis.days60.toFixed(2)}</td></tr>
              <tr className="bg-gray-50"><td className={`${tdClass} font-semibold`}>Over 90 days</td><td className={`${tdClass} text-right font-bold text-black`}>{data.closingBalance.currency} {data.agingAnalysis.days90Plus.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      ),
    });
  }

  if (data.company.bankName) {
    blocks.push({
      type: 'section',
      key: 'payment',
      estimatedHeight: 120,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="bg-gray-100 border border-gray-400 px-2 py-1 font-semibold text-xs mb-1">PAYMENT INFORMATION:</div>
          <table className={tableClass}>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold w-[120px]">Account Name:</td>
                <td className={tdClass}>{data.company.accountName}</td>
                <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold w-[120px]">Bank Name:</td>
                <td className={tdClass}>{data.company.bankName}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold">Account Number:</td>
                <td className={`${tdClass} font-mono`}>{data.company.accountNumber}</td>
                <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold">SWIFT Code:</td>
                <td className={`${tdClass} font-mono`}>{data.company.swiftCode || '-'}</td>
              </tr>
              {data.company.bankAddress ? (
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold">Bank Address:</td>
                  <td className={tdClass} colSpan={3}>{data.company.bankAddress}</td>
                </tr>
              ) : null}
              {data.company.paymentNote ? (
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold">Payment Note:</td>
                  <td className={tdClass} colSpan={3}>{data.company.paymentNote}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ),
    });
  }

  if (data.remarks) {
    blocks.push({
      type: 'section',
      key: 'remarks',
      estimatedHeight: 72,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="bg-gray-100 border border-gray-400 px-2 py-1 font-semibold text-xs mb-1">REMARKS:</div>
          <div className="border border-gray-400 px-2 py-1.5 text-xs text-gray-700">{data.remarks}</div>
        </div>
      ),
    });
  }

  blocks.push({
    type: 'section',
    key: 'footer',
    estimatedHeight: 42,
    avoidBreak: true,
    render: () => (
      <div className="border-t border-gray-300 pt-2 text-[10px] text-gray-600">
        <p className="text-center font-semibold mb-0.5">Please verify and confirm this statement within 7 days.</p>
        <p className="text-center">For any questions, please contact us at {data.company.email}</p>
      </div>
    ),
  });

  return paginateBlocks(blocks).map((page) => (
    <div key={`soa-${page.index}`} className="flex h-full flex-col gap-3 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
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
