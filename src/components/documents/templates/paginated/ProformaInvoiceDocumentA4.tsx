import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import {
  DEFAULT_PROFORMA_INVOICE_GOODS_TABLE_COLUMNS,
  normalizeProformaInvoiceGoodsTableColumns,
  type ProformaInvoiceData,
} from '../ProformaInvoiceDocument';

interface ProformaInvoiceDocumentA4Props {
  data: ProformaInvoiceData;
  showControls?: boolean;
}

interface ProformaInvoiceDocumentA4PagesProps {
  data: ProformaInvoiceData;
}

function formatAmount(amount: number, currency = 'US$') {
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function estimateWrappedLines(text: string | undefined, charsPerLine: number) {
  if (!text) return 0;
  return text
    .split('\n')
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0);
}

function buildPiPages(data: ProformaInvoiceData): React.ReactNode[] {
  const sellerName = data.seller.nameEn || data.seller.name;
  const sellerNameLines = sellerName.includes(' BUILDING MATERIALS ')
    ? sellerName.replace(' BUILDING MATERIALS ', ' BUILDING MATERIALS\n')
    : sellerName.includes(' Building Materials ')
      ? sellerName.replace(' Building Materials ', ' Building Materials\n')
      : sellerName;
  const sellerAddress =
    data.seller.addressEn ||
    data.seller.address ||
    [
      data.seller.unit,
      data.seller.building,
      data.seller.zone,
      data.seller.plaza,
      data.seller.district,
      data.seller.city,
      data.seller.province,
      data.seller.country,
    ]
      .filter(Boolean)
      .join(', ');
  const sellerAddressLines = sellerAddress.includes(', Cangshan Dist')
    ? sellerAddress.replace(', Cangshan Dist', '\nCangshan Dist')
    : sellerAddress.includes(', Fuzhou')
      ? sellerAddress.replace(', Fuzhou', '\nFuzhou')
      : sellerAddress;
  const remarksLines =
    (data.remarks.priceTerms ? 1 : 0) +
    (data.remarks.containerType ? 1 : 0) +
    (data.remarks.paymentTerms ? 1 : 0) +
    (data.remarks.portOfLoading ? 1 : 0) +
    (data.remarks.shipmentDate ? 1 : 0) +
    (data.remarks.others?.length ?? 0) +
    (data.remarks.others?.length ? 1 : 0);
  const estimatedContentHeight =
    240 +
    data.products.reduce(
      (total, product) =>
        total +
        54 +
        estimateWrappedLines(product.description, 38) * 12 +
        estimateWrappedLines(product.specification, 38) * 10,
      0
    ) +
    84 +
    120 +
    remarksLines * 18;
  const signatureBlockHeight = 170;
  const shouldInlineSignatureBlock = estimatedContentHeight + signatureBlockHeight < 980;
  const goodsTableColumns = normalizeProformaInvoiceGoodsTableColumns(
    data.templateSettings?.goodsTableColumns || DEFAULT_PROFORMA_INVOICE_GOODS_TABLE_COLUMNS,
  );

  const signatureBlock = (
    <div className="flex justify-between gap-8">
      <div className="flex-1">
        <p className="mb-2 italic">For and on Behalf of Buyer</p>
        <p className="mb-24 font-bold">{data.buyer.companyName}</p>
        <div className="mb-2 border-b border-dotted border-black pb-1"></div>
        <p className="text-center text-xs italic">Authorized Signature(s)</p>
      </div>
      <div className="flex-1">
        <p className="mb-2 text-right italic">For and on Behalf of Seller</p>
        <p className="mb-24 text-right font-bold">{data.seller.nameEn || data.seller.name}</p>
        <div className="mb-2 border-b border-dotted border-black pb-1"></div>
        <p className="text-center text-xs italic">Authorized Signature(s)</p>
      </div>
    </div>
  );

  const pageOne = (
    <div className="relative h-full px-4 pt-10 pb-24 text-[12px] text-black" style={{ fontFamily: 'Times New Roman, serif', lineHeight: 1.22 }}>
      <div className="mb-5">
        <div className="relative mb-2 flex items-start justify-between gap-4">
          <div className="w-[360px]">
            <div className="flex items-start gap-2">
              <div className="flex h-[62px] w-[70px] flex-shrink-0 items-center">
                <img
                  src={data.seller.logoUrl || cosunLogo}
                  alt="THE COSUN Logo"
                  className="h-auto max-h-full w-full object-contain"
                />
              </div>
              <div className="pt-0.5 text-xs leading-[1.25] text-black">
                <h1
                  className="mb-1 max-w-[270px] whitespace-pre-line text-xs font-bold tracking-normal text-black"
                  style={{ letterSpacing: '0.01em', lineHeight: 1.2 }}
                >
                  {sellerNameLines}
                </h1>
                {sellerAddress ? (
                  <p className="mb-1 max-w-[270px] whitespace-pre-line text-xs font-normal" style={{ lineHeight: 1.2 }}>
                    {sellerAddressLines}
                  </p>
                ) : null}
                {data.seller.cell ? <p className="whitespace-nowrap text-xs font-normal">Cell: {data.seller.cell}</p> : null}
                {data.seller.email ? <p className="whitespace-nowrap text-xs font-normal">Email: {data.seller.email}</p> : null}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute left-1/2 bottom-3 w-[240px] -translate-x-1/2 text-center">
            <h2 className="whitespace-nowrap text-[18px] font-bold tracking-[0.02em] text-black not-italic">PROFORMA INVOICE</h2>
          </div>
          <div className="w-[220px] pt-0.5">
            <table className="w-full border-collapse border border-gray-400 text-xs not-italic">
              <tbody>
                {data.costNo ? (
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold whitespace-nowrap">Cost No.</td>
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{data.costNo}</td>
                  </tr>
                ) : null}
                <tr>
                  <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold whitespace-nowrap">Inv. No.</td>
                  <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap">{data.invoiceNo}</td>
                </tr>
                {data.scNo ? (
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold whitespace-nowrap">S/C No.</td>
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{data.scNo}</td>
                  </tr>
                ) : null}
                <tr>
                  <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-semibold whitespace-nowrap">Date</td>
                  <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{data.invoiceDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mb-3 border-b border-gray-400 border-t-2" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
      </div>
      <div className="mb-4 flex justify-between gap-6 text-xs">
        <div className="flex-1 leading-6">
          <p className="mb-1"><span className="font-bold italic">TO: </span><span className="italic">{data.buyer.companyName}</span></p>
          {data.buyer.poBox ? <p className="mb-1 italic"><span className="font-bold">P.O. </span>{data.buyer.poBox}</p> : null}
          {data.buyer.contactPerson ? <p className="mt-2 italic">{data.buyer.contactPerson}</p> : null}
        </div>
        <div className="min-w-[180px] text-right text-xs italic text-gray-700 leading-6">
          {data.buyer.address ? <p className="mb-1">{data.buyer.address}</p> : null}
          {data.buyer.city || data.buyer.country ? <p>{[data.buyer.city, data.buyer.country].filter(Boolean).join(', ')}</p> : null}
        </div>
      </div>
      <table className="mb-4 w-full border-collapse border-2 border-black text-xs">
        <thead>
          <tr>
            {goodsTableColumns.map((column) => (
              <th
                key={column.key}
                className="border border-black px-1 py-1 font-bold italic text-center"
                style={{ width: `${column.widthPercent}%` }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.products.map((product) => (
            <tr key={product.seqNo}>
              {goodsTableColumns.map((column) => {
                switch (column.key) {
                  case 'seqItemNo':
                    return <td key={column.key} className="border border-black px-1 py-2 text-center italic align-top">{product.seqNo}</td>;
                  case 'photos':
                    return (
                      <td key={column.key} className="border border-black px-1 py-2 text-center align-top">
                        {product.itemNo ? <div className="mb-1 text-xs italic">{product.itemNo}</div> : null}
                        {product.photoUrl ? (
                          <img src={product.photoUrl} alt={product.description} className="h-auto w-full" />
                        ) : (
                          <div className="flex h-12 w-full items-center justify-center bg-gray-100 text-xs text-gray-400">Photo</div>
                        )}
                      </td>
                    );
                  case 'description':
                    return (
                      <td key={column.key} className="border border-black px-2 py-2 italic align-top">
                        <div className="font-bold">{product.description}</div>
                        {product.specification ? <div className="mt-1">{product.specification}</div> : null}
                      </td>
                    );
                  case 'quantity':
                    return <td key={column.key} className="border border-black px-1 py-2 text-center italic align-top">{product.quantity.toLocaleString()} {product.unit}</td>;
                  case 'unitPrice':
                    return <td key={column.key} className="border border-black px-1 py-2 text-center italic align-top">{formatAmount(product.unitPrice, product.currency)}</td>;
                  case 'extendedValue':
                  default:
                    return <td key={column.key} className="border border-black px-1 py-2 text-center italic align-top">{formatAmount(product.extendedValue, product.currency)}</td>;
                }
              })}
            </tr>
          ))}
          <tr><td className="border border-black px-1 py-2" colSpan={goodsTableColumns.length}><div className="text-center italic font-bold">Null</div></td></tr>
          {data.freight ? <tr><td className="border border-black px-2 py-2 text-center italic" colSpan={goodsTableColumns.length}>{data.freight.type}: {data.freight.terms}</td></tr> : null}
          <tr>
            <td className="border border-black px-2 py-2 text-right italic font-bold" colSpan={Math.max(goodsTableColumns.length - 1, 1)}>Total {data.priceTerms} Value</td>
            <td className="border border-black px-1 py-2 text-center font-bold italic">{formatAmount(data.totalValue, data.totalCurrency)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mb-3 text-xs">
        <p className="mb-1 font-bold italic">BANK INFORMATION FOR T/T:</p>
        <div className="leading-5 italic">
          <p><span className="font-bold">Beneficiary:</span> {data.bankInfo.beneficiary}</p>
          <p><span className="font-bold">Beneficiary's address:</span> {data.bankInfo.beneficiaryAddress}</p>
          <p><span className="font-bold">Beneficiary's account:</span> {data.bankInfo.accountNo}</p>
          <p><span className="font-bold">Beneficiary's bank:</span> {data.bankInfo.bank}</p>
          <p><span className="font-bold">Beneficiary's bank address:</span> {data.bankInfo.bankAddress}</p>
          <p><span className="font-bold">Swift Code:</span> {data.bankInfo.swiftCode}</p>
        </div>
      </div>
      <div className="mb-2 text-xs">
        <p className="mb-1 font-bold italic">Remarks:</p>
        <div className="leading-5 italic">
          {data.remarks.priceTerms ? <p>1. {data.remarks.priceTerms}</p> : null}
          {data.remarks.containerType ? <p>2. {data.remarks.containerType}</p> : null}
          {data.remarks.paymentTerms ? <p>3. {data.remarks.paymentTerms}</p> : null}
          {data.remarks.portOfLoading ? <p>4. {data.remarks.portOfLoading}</p> : null}
          {data.remarks.shipmentDate ? <p>5. {data.remarks.shipmentDate}</p> : null}
          {data.remarks.others?.length ? (
            <>
              <p className="mt-2 font-bold">Others:</p>
              {data.remarks.others.map((remark, index) => <p key={index} className="ml-2">{remark}</p>)}
            </>
          ) : null}
        </div>
      </div>
      {shouldInlineSignatureBlock ? (
        <div className="mt-8 border-t border-black pt-6">
          {signatureBlock}
        </div>
      ) : null}
      <div className="absolute bottom-8 left-0 right-0 px-4">
        <div className="flex items-center justify-start border-t border-black pt-2 text-xs">
          <span>{data.footer?.tagline || 'One-stop Project Sourcing Solution Provider'}</span>
        </div>
      </div>
    </div>
  );

  const pageTwo = (
    <div className="relative flex h-full flex-col px-4 pt-12 pb-24 text-[12px] text-black" style={{ fontFamily: 'Times New Roman, serif', lineHeight: 1.25 }}>
      <div className="mt-auto flex justify-between gap-8 pb-20">
        {signatureBlock}
      </div>
      <div className="absolute bottom-8 left-0 right-0 px-4">
        <div className="flex items-center justify-start border-t border-black pt-2 text-xs">
          <span>{data.footer?.tagline || 'One-stop Project Sourcing Solution Provider'}</span>
        </div>
      </div>
    </div>
  );

  return shouldInlineSignatureBlock ? [pageOne] : [pageOne, pageTwo];
}

export const ProformaInvoiceDocumentA4 = forwardRef<HTMLDivElement, ProformaInvoiceDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildPiPages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.invoiceNo || 'pi'}.pdf`} />
      </div>
    );
  },
);

ProformaInvoiceDocumentA4.displayName = 'ProformaInvoiceDocumentA4';

export function ProformaInvoiceDocumentA4Pages({ data }: ProformaInvoiceDocumentA4PagesProps) {
  const pages = useMemo(() => buildPiPages(data), [data]);
  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`pi-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}
