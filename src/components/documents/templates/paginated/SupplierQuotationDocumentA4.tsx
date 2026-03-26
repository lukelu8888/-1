import React, { forwardRef, useMemo } from 'react';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import type { SupplierQuotationData } from '../SupplierQuotationDocument';

interface SupplierQuotationDocumentA4Props {
  data: SupplierQuotationData;
  showControls?: boolean;
}

interface SupplierQuotationDocumentA4PagesProps {
  data: SupplierQuotationData;
}

interface BjTermRow {
  label: string;
  value: string;
}

const sectionTitleClass = 'mb-2 text-base font-bold text-black';
const tableClass = 'w-full border-collapse border border-gray-400 text-xs';
const productTableClass = 'w-full border-collapse border-2 border-gray-300 text-xs';
const tdClass = 'border border-gray-400 px-2 py-1.5 align-top';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function buildProductRowHeight(product: SupplierQuotationData['products'][number]) {
  const nameLines = estimateWrappedLines(product.description || '', 14);
  const specLines = estimateWrappedLines(product.specification || '', 20);
  return Math.max(72, 18 + nameLines * 14 + specLines * 12);
}

function buildTermRows(data: SupplierQuotationData): BjTermRow[] {
  const rows: Array<BjTermRow | null> = [
    data.terms.paymentTerms ? { label: '1. 付款方式', value: data.terms.paymentTerms } : null,
    data.terms.deliveryTerms ? { label: '2. 交货条款', value: data.terms.deliveryTerms } : null,
    data.terms.deliveryTime ? { label: '3. 交货时间', value: data.terms.deliveryTime } : null,
    data.terms.deliveryAddress ? { label: '4. 交货地址', value: data.terms.deliveryAddress } : null,
    data.terms.moq ? { label: '5. 最小起订量（MOQ）', value: data.terms.moq } : null,
    data.terms.qualityStandard ? { label: '6. 质量标准', value: data.terms.qualityStandard } : null,
    data.terms.warranty ? { label: '7. 质保期', value: data.terms.warranty } : null,
    data.terms.packaging ? { label: '8. 包装方式', value: data.terms.packaging } : null,
    data.terms.shippingMarks ? { label: '9. 唛头', value: data.terms.shippingMarks } : null,
    data.terms.remarks ? { label: '10. 其他说明', value: data.terms.remarks } : null,
  ];
  return rows.filter((row): row is BjTermRow => Boolean(row));
}

function buildTermRowHeight(row: BjTermRow) {
  return Math.max(28, 10 + estimateWrappedLines(row.value, 46) * 12);
}

export const SupplierQuotationDocumentA4 = forwardRef<HTMLDivElement, SupplierQuotationDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildSupplierQuotationPages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.quotationNo || 'bj'}.pdf`} />
      </div>
    );
  },
);

SupplierQuotationDocumentA4.displayName = 'SupplierQuotationDocumentA4';

export function SupplierQuotationDocumentA4Pages({ data }: SupplierQuotationDocumentA4PagesProps) {
  const pages = useMemo(() => buildSupplierQuotationPages(data), [data]);
  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`bj-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildSupplierQuotationPages(data: SupplierQuotationData): React.ReactNode[] {
  const total = data.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const termRows = buildTermRows(data);
  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 150,
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="flex h-[60px] w-[150px] items-center">
              {data.supplier.logo ? (
                <img src={data.supplier.logo} alt={`${data.supplier.companyName} Logo`} className="h-auto max-h-full w-full" style={{ objectFit: 'contain' }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded border-2 border-dashed border-gray-300">
                  <span className="text-xs text-gray-400">供应商LOGO</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 justify-center items-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-wider text-black">报价单</h1>
                <p className="mt-1 text-sm text-gray-600">Quotation</p>
              </div>
            </div>
            <div className="w-[216px]">
              <table className={tableClass}>
                <tbody>
                  <tr><td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">报价编号</td><td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.quotationNo}</td></tr>
                  <tr><td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">报价日期</td><td className="border border-gray-400 px-1.5 py-0.5">{formatDate(data.quotationDate)}</td></tr>
                  <tr><td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">有效期至</td><td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-orange-600">{formatDate(data.validUntil)}</td></tr>
                  {data.xjReference ? <tr><td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">询价单号</td><td className="border border-gray-400 px-1.5 py-0.5 text-blue-600 text-xs">{data.xjReference}</td></tr> : null}
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
      key: 'baseline',
      estimatedHeight: data.projectExecutionBaseline && (data.projectExecutionBaseline.projectCode || data.projectExecutionBaseline.projectName || data.projectExecutionBaseline.projectRevisionCode) ? 56 : 0,
      render: () => data.projectExecutionBaseline && (data.projectExecutionBaseline.projectCode || data.projectExecutionBaseline.projectName || data.projectExecutionBaseline.projectRevisionCode) ? (
        <div className="mb-3 rounded border border-purple-200 bg-purple-50 px-3 py-2">
          <div className="mb-1 text-xs font-semibold text-purple-700">执行基线 / Execution Baseline</div>
          <div className="text-xs text-gray-700">
            <span className="font-medium">{data.projectExecutionBaseline.projectCode || data.projectExecutionBaseline.projectName || '项目'}</span>
            <span className="mx-1">/</span>
            <span className="font-medium">{data.projectExecutionBaseline.projectRevisionCode || 'Rev'}</span>
            {data.projectExecutionBaseline.finalQuotationNumber ? <><span className="mx-1">/</span><span className="font-medium">{data.projectExecutionBaseline.finalQuotationNumber}</span></> : null}
          </div>
        </div>
      ) : null,
    },
    {
      type: 'section',
      key: 'parties',
      estimatedHeight: 190,
      avoidBreak: true,
      render: () => (
        <table className={tableClass}>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-0 w-1/2 align-top">
                <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">报价方（供应商）</div>
                <div className="px-2 py-1.5 space-y-0.5">
                  <div><span className="font-semibold">{data.supplier.companyName}</span></div>
                  {data.supplier.companyNameEn ? <div className="text-gray-600">{data.supplier.companyNameEn}</div> : null}
                  {data.supplier.supplierCode ? <div><span className="text-gray-600">供应商编号：</span><span className="font-semibold text-blue-600">{data.supplier.supplierCode}</span></div> : null}
                  <div><span className="text-gray-600">地址：</span>{data.supplier.address}</div>
                  {data.supplier.addressEn ? <div className="text-xs text-gray-600">{data.supplier.addressEn}</div> : null}
                  <div><span className="text-gray-600">电话：</span>{data.supplier.tel}</div>
                  <div><span className="text-gray-600">邮箱：</span>{data.supplier.email}</div>
                  <div><span className="text-gray-600">联系人：</span>{data.supplier.contactPerson}</div>
                </div>
              </td>
              <td className="border border-gray-400 p-0 w-1/2 align-top">
                <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">询价方（客户）</div>
                <div className="px-2 py-1.5 space-y-0.5">
                  <div><span className="font-semibold">{data.buyer.name}</span></div>
                  <div className="text-gray-600">{data.buyer.nameEn}</div>
                  <div><span className="text-gray-600">地址：</span>{data.buyer.address}</div>
                  <div><span className="text-gray-600">电话：</span>{data.buyer.tel}</div>
                  <div><span className="text-gray-600">邮箱：</span>{data.buyer.email}</div>
                  <div><span className="text-gray-600">联系人：</span>{data.buyer.contactPerson}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      type: 'section',
      key: 'intro',
      estimatedHeight: 56,
      avoidBreak: true,
      render: () => (
        <div className="rounded border border-blue-200 bg-blue-50 p-2">
          <p className="text-xs text-gray-700">
            <span className="font-semibold text-blue-700">📋 报价说明：</span>
            本报价单是对贵司询价的正式回复，包含详细的产品报价和商务条款。报价有效期至 <span className="font-bold text-blue-600">{formatDate(data.validUntil)}</span>，请在有效期内确认订单。
          </p>
        </div>
      ),
    },
    {
      type: 'section',
      key: 'inquiry-reference',
      estimatedHeight: data.inquiryReference ? Math.max(56, 24 + estimateWrappedLines(data.inquiryReference, 72) * 12) : 0,
      render: () => data.inquiryReference ? (
        <div className="rounded border border-orange-200 bg-orange-50 p-2">
          <p className="text-xs text-gray-700"><span className="font-semibold text-orange-700">📝 询价说明：</span><span className="ml-1">{data.inquiryReference}</span></p>
        </div>
      ) : null,
    },
    {
      type: 'table',
      key: 'products',
      headerHeight: 104,
      rowHeight: (row) => buildProductRowHeight(row),
      footerHeight: 40,
      rows: data.products,
      renderHeader: () => (
        <>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left w-8">序号</th>
              <th className="border border-gray-300 px-2 py-2 text-left w-20">型号</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-16">图片</th>
              <th className="border border-gray-300 px-2 py-2 text-left">产品名称/规格</th>
              <th className="border border-gray-300 px-2 py-2 text-right w-16">数量</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-10">单位</th>
              <th className="border border-gray-300 px-2 py-2 text-right w-24">单价</th>
              <th className="border border-gray-300 px-2 py-2 text-right w-24">报价金额</th>
            </tr>
          </thead>
        </>
      ),
      renderRow: (product) => {
        const totalPrice = product.unitPrice * product.quantity;
        return (
          <tr key={`${product.no}-${product.description}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <td className="border border-gray-300 px-2 py-2 text-center">{product.no}</td>
            <td className="border border-gray-300 px-2 py-2 text-gray-700">{product.modelNo || product.itemCode || '-'}</td>
            <td className="border border-gray-300 px-1 py-1 text-center">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.description} className="w-10 h-10 object-cover mx-auto rounded" /> : <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-400">无图</div>}
            </td>
            <td className="border border-gray-300 px-2 py-2"><div className="font-semibold">{product.description}</div><div className="text-xs text-gray-600 mt-0.5">{product.specification}</div></td>
            <td className="border border-gray-300 px-2 py-2 text-right font-semibold">{product.quantity.toLocaleString()}</td>
            <td className="border border-gray-300 px-2 py-2 text-center">{product.unit}</td>
            <td className="border border-gray-300 px-2 py-2 text-right text-blue-600 font-medium">{product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="border border-gray-300 px-2 py-2 text-right font-semibold text-orange-600">{totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        );
      },
      renderFooter: () => (
        <tr className="bg-orange-50 font-bold">
          <td colSpan={7} className="border-2 border-gray-400 px-2 py-2 text-right">报价总额 (Total Amount):</td>
          <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600 text-sm">{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      ),
    },
    {
      type: 'table',
      key: 'terms',
      headerHeight: 34,
      rowHeight: (row) => buildTermRowHeight(row),
      rows: termRows,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={2}>报价条款</th>
          </tr>
        </thead>
      ),
      renderRow: (row) => (
        <tr key={row.label} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className="border border-gray-400 px-2 py-1.5 font-semibold" style={{ width: 190 }}>{row.label}：</td>
          <td className="border border-gray-400 px-2 py-1.5 whitespace-pre-wrap">{row.value}</td>
        </tr>
      ),
    },
  ];

  if (data.supplierRemarks?.content) {
    blocks.push({
      type: 'section',
      key: 'supplier-remarks',
      estimatedHeight: Math.max(90, 48 + estimateWrappedLines(data.supplierRemarks.content, 68) * 12),
      render: () => (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-3">
          <div className="mb-2 flex items-start gap-2">
            <h4 className="text-sm font-bold text-blue-900">供应商备注：</h4>
            {data.supplierRemarks?.remarkDate ? <span className="text-xs text-blue-600">({data.supplierRemarks.remarkDate})</span> : null}
          </div>
          <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800">{data.supplierRemarks?.content}</div>
          {data.supplierRemarks?.remarkBy ? <div className="mt-2 text-xs text-blue-700">备注人：{data.supplierRemarks.remarkBy}</div> : null}
        </div>
      ),
    });
  }

  blocks.push({
    type: 'section',
    key: 'signature',
    estimatedHeight: 170,
    avoidBreak: true,
    render: () => (
      <div>
        <div className="mt-8 border-t-2 border-gray-300 pt-4">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="mb-2 text-xs text-gray-600">报价方（供应商）</p>
              <div className="mb-2 border-b border-gray-400 pb-8"></div>
              <div className="text-xs text-gray-500"><p>签字盖章：________________</p><p className="mt-1">日期：____年____月____日</p></div>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-600">询价方确认（客户）</p>
              <div className="mb-2 border-b border-gray-400 pb-8"></div>
              <div className="text-xs text-gray-500"><p>签字盖章：________________</p><p className="mt-1">日期：____年____月____日</p></div>
            </div>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-200 pt-3">
          <p className="text-center text-xs text-gray-500">本报价单一式两份，报价方和询价方各执一份。报价单经双方签字盖章后生效。</p>
        </div>
      </div>
    ),
  });

  return paginateBlocks(blocks).map((page) => (
    <div key={`bj-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        if (item.key.startsWith('products')) {
          return (
            <section key={item.key}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className={sectionTitleClass}>报价产品清单：</h3>
                <div className="rounded border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">货币单位：元</div>
              </div>
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
