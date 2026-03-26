import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import {
  DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS,
  normalizeSalesContractProductTableColumns,
  type SalesContractData,
} from '../SalesContractDocument';

interface SalesContractDocumentA4Props {
  data: SalesContractData;
  showControls?: boolean;
}

interface SalesContractDocumentA4PagesProps {
  data: SalesContractData;
}

const tableClass = 'w-full border-collapse border border-gray-400 text-xs text-black';
const productTableClass = 'w-full border-collapse border-2 border-gray-300 text-xs text-black';
const tdClass = 'border border-gray-400 px-2 py-1.5 align-top text-black';
const articleHeadingClass = 'mb-2 text-[20px] font-bold leading-tight tracking-tight text-black';

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

function buildProductRowHeight(product: SalesContractData['products'][number]) {
  const nameLines = estimateWrappedLines(product.description || '', 16);
  const specLines = estimateWrappedLines(product.specification || '', 24);
  return Math.max(58, 14 + nameLines * 12 + specLines * 10);
}

function extractTradeTerm(tradeTerms: string): string {
  const upperTerms = tradeTerms.toUpperCase();
  if (upperTerms.includes('EXW')) return 'EXW';
  if (upperTerms.includes('FOB')) return 'FOB';
  if (upperTerms.includes('CNF') || upperTerms.includes('C&F')) return 'CNF';
  if (upperTerms.includes('CIF')) return 'CIF';
  return 'EXW';
}

export const SalesContractDocumentA4 = forwardRef<HTMLDivElement, SalesContractDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildSalesContractPages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.contractNo || 'sc'}.pdf`} />
      </div>
    );
  },
);

SalesContractDocumentA4.displayName = 'SalesContractDocumentA4';

export function SalesContractDocumentA4Pages({ data }: SalesContractDocumentA4PagesProps) {
  const pages = useMemo(() => buildSalesContractPages(data), [data]);
  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`sc-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildSalesContractPages(data: SalesContractData): React.ReactNode[] {
  const sellerDisplayName = data.seller.nameEn || data.seller.name;
  const sellerDisplayAddress = data.seller.addressEn || data.seller.address;
  const total = data.products.reduce((sum, item) => sum + item.amount, 0);
  const tradeTerm = extractTradeTerm(data.terms.tradeTerms);
  const productTableColumns = normalizeSalesContractProductTableColumns(
    data.templateSettings?.productTableColumns || DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS,
  );
  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 136,
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-[70px] w-[80px] items-center">
              <img src={cosunLogo} alt="THE COSUN Logo" className="w-full h-auto max-h-full" style={{ objectFit: 'contain' }} />
            </div>
            <div className="flex flex-1 justify-center items-center">
              <h1 className="text-2xl font-bold tracking-wider text-black">SALES CONTRACT</h1>
            </div>
            <div className="w-[280px]">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  {data.quotationNo ? (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap w-[38%]">Ref. No.</td>
                      <td className="border border-gray-400 px-2 py-1 whitespace-nowrap break-keep">{data.quotationNo}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Contract No.</td>
                    <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap break-keep">{data.contractNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{formatDate(data.contractDate)}</td>
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
      estimatedHeight: 130,
      avoidBreak: true,
      render: () => (
        <table className={tableClass}>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-0 w-1/2 align-top">
                <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">SELLER</div>
                <div className="px-2 py-1.5 space-y-0.5">
                  <div><span className="font-semibold">{sellerDisplayName}</span></div>
                  <div><span className="text-black">Address:</span> {sellerDisplayAddress}</div>
                  <div><span className="text-black">Tel:</span> {data.seller.tel} {data.seller.fax ? `| Fax: ${data.seller.fax}` : ''}</div>
                  <div><span className="text-black">Email:</span> {data.seller.email}</div>
                  {data.seller.legalRepresentative ? <div><span className="text-black">Legal Rep.:</span> {data.seller.legalRepresentative}</div> : null}
                </div>
              </td>
              <td className="border border-gray-400 p-0 w-1/2 align-top">
                <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">BUYER</div>
                <div className="px-2 py-1.5 space-y-0.5">
                  <div><span className="font-semibold">{data.buyer.companyName}</span></div>
                  <div><span className="text-black">Address:</span> {data.buyer.address}</div>
                  <div><span className="text-black">Country:</span> {data.buyer.country}</div>
                  <div><span className="text-black">Contact:</span> {data.buyer.contactPerson}</div>
                  <div><span className="text-black">Tel:</span> {data.buyer.tel}</div>
                  <div><span className="text-black">Email:</span> {data.buyer.email}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      type: 'table',
      key: 'products',
      headerHeight: 82,
      rowHeight: (row) => buildProductRowHeight(row),
      footerHeight: 40,
      rows: data.products,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-100">
            {productTableColumns.map((column) => (
              <th
                key={column.key}
                className={`border border-gray-300 px-2 py-2 ${
                  column.key === 'quantity' || column.key === 'unitPrice' || column.key === 'amount'
                    ? 'text-right'
                    : column.key === 'unit' || column.key === 'image'
                      ? 'text-center'
                      : 'text-left'
                }`}
                style={{ width: `${column.widthPercent}%` }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
      ),
      renderRow: (product) => (
        <tr key={`${product.no}-${product.description}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          {productTableColumns.map((column) => {
            switch (column.key) {
              case 'no':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{product.no}</td>;
              case 'modelNo':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-black">{product.modelNo || '-'}</td>;
              case 'image':
                return (
                  <td key={column.key} className="border border-gray-300 px-1 py-1 text-center">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.description} className="w-10 h-10 object-cover mx-auto rounded" /> : <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-500">N/A</div>}
                  </td>
                );
              case 'itemNameSpecification':
                return <td key={column.key} className="border border-gray-300 px-2 py-2"><div className="font-semibold text-black">{product.description}</div><div className="mt-0.5 text-xs text-black">{product.specification}</div></td>;
              case 'quantity':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{product.quantity.toLocaleString()}</td>;
              case 'unit':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{product.unit}</td>;
              case 'unitPrice':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{product.currency} {product.unitPrice.toFixed(2)}</td>;
              case 'amount':
              default:
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right font-semibold">{product.currency} {product.amount.toFixed(2)}</td>;
            }
          })}
        </tr>
      ),
      renderFooter: () => (
        <tr className="bg-gray-100 font-bold">
          <td colSpan={Math.max(productTableColumns.length - 1, 1)} className="border border-gray-300 px-2 py-2 text-right">Total Value ({tradeTerm}):</td>
          <td className="border border-gray-300 px-2 py-2 text-right font-semibold">{data.terms.currency} {total.toFixed(2)}</td>
        </tr>
      ),
    },
  ];

  if (data.seller.bankInfo) {
    blocks.push({
      type: 'section',
      key: 'bank',
      estimatedHeight: 130,
      avoidBreak: true,
      render: () => (
        <table className={tableClass}>
          <thead>
            <tr className="bg-gray-200"><th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={4}>SELLER'S BANK INFORMATION</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 w-[15%] font-semibold">Bank Name</td>
              <td className="border border-gray-400 px-2 py-1.5 w-[35%]">{data.seller.bankInfo.bankName}</td>
              <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 w-[15%] font-semibold">Account Name</td>
              <td className="border border-gray-400 px-2 py-1.5 w-[35%]">{data.seller.bankInfo.accountName}</td>
            </tr>
            <tr><td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Account No.</td><td className="border border-gray-400 px-2 py-1.5 font-bold" colSpan={3}>{data.seller.bankInfo.accountNumber}</td></tr>
            {data.seller.bankInfo.swiftCode || data.seller.bankInfo.currency ? (
              <tr>
                <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">SWIFT Code</td>
                <td className="border border-gray-400 px-2 py-1.5">{data.seller.bankInfo.swiftCode || '-'}</td>
                <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Currency</td>
                <td className="border border-gray-400 px-2 py-1.5">{data.seller.bankInfo.currency || '-'}</td>
              </tr>
            ) : null}
            {data.seller.bankInfo.iban ? <tr><td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">IBAN</td><td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.iban}</td></tr> : null}
            {data.seller.bankInfo.routingNumber ? <tr><td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Routing No.</td><td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.routingNumber}</td></tr> : null}
            {data.seller.bankInfo.bankAddress ? <tr><td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Bank Address</td><td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.bankAddress}</td></tr> : null}
            {data.seller.bankInfo.paymentNote ? <tr><td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Payment Note</td><td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.paymentNote}</td></tr> : null}
          </tbody>
        </table>
      ),
    });
  }

  const termsRows: string[] = [
    `2.1 Trade Terms: ${data.terms.tradeTerms}`,
    `2.2 Payment Terms: ${data.terms.paymentTerms}${data.terms.depositAmount || data.terms.balanceAmount ? ` ${data.terms.depositAmount ? `(Deposit: ${data.terms.currency} ${data.terms.depositAmount.toFixed(2)})` : ''}${data.terms.depositAmount && data.terms.balanceAmount ? ', ' : ''}${data.terms.balanceAmount ? `(Balance: ${data.terms.currency} ${data.terms.balanceAmount.toFixed(2)})` : ''}` : ''}`,
    `2.3 Delivery Time: ${data.terms.deliveryTime}`,
    `2.4 Port of Loading: ${data.terms.portOfLoading}`,
    `2.5 Port of Destination: ${data.terms.portOfDestination}`,
    `2.6 Packing: ${data.terms.packing}`,
    `2.7 Inspection: ${data.terms.inspection}`,
    ...(data.terms.insurance ? [`2.8 Insurance: ${data.terms.insurance}`] : []),
    ...(data.terms.warranty ? [`2.9 Warranty: ${data.terms.warranty}`] : []),
  ];

  blocks.push({
    type: 'table',
    key: 'terms',
    headerHeight: 60,
      rowHeight: (row: string) => Math.max(22, 6 + estimateWrappedLines(row, 102) * 10),
    rows: termsRows,
    renderHeader: () => (
      <>
        <thead><tr className="bg-gray-200"><th className="border border-gray-400 px-2 py-1.5 text-left font-bold">ARTICLE 2: TERMS AND CONDITIONS</th></tr></thead>
      </>
    ),
    renderRow: (row: string) => <tr key={row}><td className="border border-gray-400 px-2 py-1.5">{row}</td></tr>,
  });

  if (data.liabilityTerms) {
    blocks.push({
      type: 'section',
      key: 'liability',
      estimatedHeight: 120,
      render: () => (
        <div>
          <h3 className={articleHeadingClass}>ARTICLE 3: LIABILITY</h3>
          <table className={tableClass}>
            <tbody>
              <tr><td className={tdClass}><span className="font-semibold">3.1 Seller Default:</span><span className="ml-1">{data.liabilityTerms?.sellerDefault}</span></td></tr>
              <tr><td className={tdClass}><span className="font-semibold">3.2 Buyer Default:</span><span className="ml-1">{data.liabilityTerms?.buyerDefault}</span></td></tr>
              <tr><td className={tdClass}><span className="font-semibold">3.3 Force Majeure:</span><span className="ml-1">{data.liabilityTerms?.forceMajeure}</span></td></tr>
            </tbody>
          </table>
        </div>
      ),
    });
  }

  if (data.disputeResolution) {
    blocks.push({
      type: 'section',
      key: 'dispute',
      estimatedHeight: 92,
      render: () => (
        <div>
          <h3 className={articleHeadingClass}>ARTICLE 4: DISPUTE RESOLUTION</h3>
          <table className={tableClass}>
            <tbody>
              <tr><td className={tdClass}><span className="font-semibold">4.1 Governing Law:</span><span className="ml-1">{data.disputeResolution?.governingLaw}</span></td></tr>
              <tr><td className={tdClass}><span className="font-semibold">4.2 Arbitration:</span><span className="ml-1">{data.disputeResolution?.arbitration}</span></td></tr>
            </tbody>
          </table>
        </div>
      ),
    });
  }

  blocks.push({
    type: 'section',
    key: 'signature',
    estimatedHeight: 214,
    avoidBreak: true,
    render: () => (
      <div className="mt-auto border-t-2 border-gray-300 pt-5 text-black">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="mb-3 text-sm font-bold text-black">SELLER</p>
            <p className="min-h-[52px] max-w-[92%] text-[11px] font-semibold leading-5 tracking-tight text-black">{data.seller.nameEn}</p>
            <div className="mt-4 mb-5 border-b border-gray-400 pb-12"></div>
            <div className="space-y-3 text-[12px] leading-7 text-black">
              <p>Authorized Signature: __________________</p>
              <p>Date: __________________</p>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold text-black">BUYER</p>
            <p className="min-h-[52px] max-w-[92%] text-[11px] font-semibold leading-5 tracking-tight text-black">{data.buyer.companyName}</p>
            <div className="mt-4 mb-5 border-b border-gray-400 pb-12"></div>
            <div className="space-y-3 text-[12px] leading-7 text-black">
              <p>Authorized Signature: __________________</p>
              <p>Date: __________________</p>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-center text-[11px] leading-6 text-gray-700">This Sales Contract is made in duplicate, one for each party, and shall become effective upon signature and seal by both parties.</p>
        </div>
      </div>
    ),
  });

  return paginateBlocks(blocks).map((page) => (
    <div key={`sc-${page.index}`} className="flex h-full flex-col gap-2 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        if (item.key.startsWith('products')) {
          return (
            <section key={item.key}>
              <h3 className={articleHeadingClass}>ARTICLE 1: PRODUCT DESCRIPTION</h3>
              <table className={productTableClass}>
                {item.renderHeader()}
                <tbody>
                  {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                  {item.showFooter && item.renderFooter?.()}
                </tbody>
              </table>
            </section>
          );
        }
        const termsTitle =
          item.key.startsWith('terms') && item.startIndex > 0
            ? 'ARTICLE 2: TERMS AND CONDITIONS (CONT\'D)'
            : 'ARTICLE 2: TERMS AND CONDITIONS';
        return (
          <section key={item.key}>
            <table className={tableClass}>
              {item.key.startsWith('terms') ? (
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-2 text-left text-[20px] font-bold leading-tight tracking-tight text-black">{termsTitle}</th>
                  </tr>
                </thead>
              ) : (
                item.renderHeader()
              )}
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
