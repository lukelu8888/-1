/**
 * SupplierQuotationPages
 *
 * Converts QuotationDocData → React.ReactNode[]  (one node per A4 page).
 *
 * All monetary values come from the pre-normalised QuotationDocData object
 * produced by useQuotationDocumentData.  No hard-coded prices or names.
 *
 * Formatting rules (enforced by formatters.ts):
 *   • Money  : Intl.NumberFormat, 2dp, thousands separator
 *   • null   : displays "—" (em-dash), never "NaN" or "0.00"
 *   • Dates  : zh-CN "YYYY-MM-DD"
 */

import React from 'react';
import { paginateBlocks, type A4Block } from '../a4/Paginator';
import type { QuotationDocData, QuotationDocItem } from '../../../hooks/useQuotationDocumentData';
import {
  formatMoney,
  formatDate,
  formatQty,
  getCurrencyConfig,
} from '../../../utils/formatters';

// A4 inner content height (px): 1123 − 80 padding
const PAGE_CONTENT_H = 1123 - 80;

// ─── Supplier logo with robust fallback ───────────────────────────────────────
function SupplierLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  const [broken, setBroken] = React.useState(false);

  if (!logoUrl || broken) {
    return (
      <div
        className="w-full h-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50"
        aria-label="供应商LOGO占位"
      >
        <svg className="w-6 h-6 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[9px] text-gray-400 text-center leading-tight px-1">供应商LOGO</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${name} Logo`}
      className="w-full h-auto max-h-full object-contain"
      onError={() => setBroken(true)}
    />
  );
}

// ─── Document header (logo + title + info table + parties) ────────────────────
function DocHeader({ data }: { data: QuotationDocData }) {
  const { supplier, buyer } = data;
  return (
    <div>
      {/* Logo + title + info */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="w-[140px] h-[56px] flex items-center shrink-0">
          <SupplierLogo logoUrl={supplier.logoUrl} name={supplier.name} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-[26px] font-bold tracking-widest text-black leading-tight">报价单</h1>
          <p className="text-xs text-gray-500 mt-0.5 tracking-widest">Quotation</p>
        </div>

        <div className="w-[210px] shrink-0">
          <table className="w-full border-collapse border border-gray-400 text-[11px]">
            <tbody>
              <tr>
                <td className="border border-gray-400 px-1.5 py-[3px] bg-gray-100 font-semibold whitespace-nowrap">报价编号</td>
                <td className="border border-gray-400 px-1.5 py-[3px] font-bold">{data.quotationNo || '—'}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-1.5 py-[3px] bg-gray-100 font-semibold whitespace-nowrap">报价日期</td>
                <td className="border border-gray-400 px-1.5 py-[3px]">{formatDate(data.quotationDate)}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-1.5 py-[3px] bg-gray-100 font-semibold whitespace-nowrap">有效期至</td>
                <td className="border border-gray-400 px-1.5 py-[3px] font-semibold text-orange-600">
                  {formatDate(data.validUntil)}
                </td>
              </tr>
              {data.xjReference && (
                <tr>
                  <td className="border border-gray-400 px-1.5 py-[3px] bg-gray-100 font-semibold whitespace-nowrap">询价单号</td>
                  <td className="border border-gray-400 px-1.5 py-[3px] text-blue-600 text-[10px]">{data.xjReference}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule */}
      <div className="border-t-[3px] border-b border-black mb-3" />

      {/* Parties */}
      <table className="w-full border-collapse border border-gray-400 text-[11px] mb-3">
        <tbody>
          <tr>
            {/* Supplier (报价方) */}
            <td className="border border-gray-400 p-0 w-1/2 align-top">
              <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400 text-xs">报价方（供应商）</div>
              <div className="px-2 py-1.5 space-y-[2px]">
                <div className="font-semibold">{supplier.name || '—'}</div>
                {supplier.nameEn && <div className="text-gray-500">{supplier.nameEn}</div>}
                {supplier.code && (
                  <div>
                    <span className="text-gray-500">供应商编号：</span>
                    <span className="font-semibold text-blue-600">{supplier.code}</span>
                  </div>
                )}
                <div><span className="text-gray-500">地址：</span>{supplier.address || '—'}</div>
                <div><span className="text-gray-500">电话：</span>{supplier.phone || '—'}</div>
                <div>
                  <span className="text-gray-500">邮箱：</span>
                  <span className="text-blue-600">{supplier.email || '—'}</span>
                </div>
                <div><span className="text-gray-500">联系人：</span>{supplier.contactPerson || '—'}</div>
              </div>
            </td>

            {/* Buyer (询价方 / COSUN) */}
            <td className="border border-gray-400 p-0 w-1/2 align-top">
              <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400 text-xs">询价方（客户）</div>
              <div className="px-2 py-1.5 space-y-[2px]">
                <div className="font-semibold">{buyer.name}</div>
                <div className="text-gray-500">{buyer.nameEn}</div>
                <div><span className="text-gray-500">地址：</span>{buyer.address}</div>
                <div><span className="text-gray-500">电话：</span>{buyer.tel}</div>
                <div><span className="text-gray-500">邮箱：</span>{buyer.email}</div>
                <div><span className="text-gray-500">联系人：</span>{buyer.contactPerson}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Quotation notice */}
      <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mb-3">
        <p className="text-[11px] text-gray-700">
          <span className="font-semibold text-blue-700">📋 报价说明：</span>
          本报价单是对贵司询价的正式回复，包含详细的产品报价和商务条款。
          报价有效期至{' '}
          <span className="font-bold text-blue-600">{formatDate(data.validUntil)}</span>，
          请在有效期内确认订单。
        </p>
      </div>

      {data.inquiryReference && (
        <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1.5 mb-3">
          <p className="text-[11px] text-gray-700">
            <span className="font-semibold text-orange-700">📝 询价说明：</span>
            <span className="ml-1">{data.inquiryReference}</span>
          </p>
        </div>
      )}

      {(data as any).projectExecutionBaseline && (((data as any).projectExecutionBaseline.projectCode) || ((data as any).projectExecutionBaseline.projectName) || ((data as any).projectExecutionBaseline.projectRevisionCode)) && (
        <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1.5 mb-3">
          <p className="text-[11px] text-gray-700">
            <span className="font-semibold text-purple-700">📌 执行基线：</span>
            <span className="ml-1 font-medium">
              {(data as any).projectExecutionBaseline.projectCode || (data as any).projectExecutionBaseline.projectName || '项目'}
            </span>
            <span className="mx-1">/</span>
            <span className="font-medium">{(data as any).projectExecutionBaseline.projectRevisionCode || 'Rev'}</span>
            {(data as any).projectExecutionBaseline.finalQuotationNumber && (
              <>
                <span className="mx-1">/</span>
                <span className="font-medium">{(data as any).projectExecutionBaseline.finalQuotationNumber}</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Products table header ────────────────────────────────────────────────────
function ProductsTableHead({ currency }: { currency: string }) {
  const cfg = getCurrencyConfig(currency);
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-sm">报价产品清单：</h3>
        <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
          货币单位：{cfg.label}
        </span>
      </div>
      {/* thead is rendered here so it repeats on each paginated table */}
      <table className="w-full border-collapse border-2 border-gray-300 text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            {['序号','型号','图片','产品名称/规格','数量','单位','单价','报价金额'].map((h, i) => (
              <th
                key={h}
                className="border border-gray-300 px-1.5 py-1.5 text-left font-semibold"
                style={{
                  width: i === 0 ? 28 : i === 1 ? 64 : i === 2 ? 52
                       : i === 4 ? 52 : i === 5 ? 36 : i === 6 ? 80 : i === 7 ? 80 : 'auto',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </>
  );
}

// ─── Single product row ───────────────────────────────────────────────────────
function ProductRow({ item }: { item: QuotationDocItem }) {
  return (
    <tr>
      <td className="border border-gray-300 px-1.5 py-1.5 text-center" style={{ width: 28 }}>
        {item.no}
      </td>
      <td className="border border-gray-300 px-1.5 py-1.5 text-gray-700" style={{ width: 64 }}>
        {item.modelNo || '—'}
      </td>
      <td className="border border-gray-300 px-1 py-1 text-center" style={{ width: 52 }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="w-9 h-9 object-cover mx-auto rounded" />
        ) : (
          <div className="w-9 h-9 bg-gray-100 mx-auto rounded flex items-center justify-center text-[9px] text-gray-400">
            无图
          </div>
        )}
      </td>
      <td className="border border-gray-300 px-1.5 py-1.5">
        <div className="font-semibold leading-tight">{item.description || '—'}</div>
        {item.specification && (
          <div className="text-[10px] text-gray-500 mt-0.5">{item.specification}</div>
        )}
        {item.remarks && (
          <div className="text-[10px] text-gray-400 italic mt-0.5">{item.remarks}</div>
        )}
      </td>
      <td className="border border-gray-300 px-1.5 py-1.5 text-right font-semibold" style={{ width: 52 }}>
        {formatQty(item.quantity)}
      </td>
      <td className="border border-gray-300 px-1.5 py-1.5 text-center" style={{ width: 36 }}>
        {item.unit}
      </td>
      <td className="border border-gray-300 px-1.5 py-1.5 text-right text-blue-600 font-medium" style={{ width: 80 }}>
        {formatMoney(item.unitPrice, item.currency, { withSymbol: false })}
      </td>
      <td className="border border-gray-300 px-1.5 py-1.5 text-right font-semibold text-orange-600" style={{ width: 80 }}>
        {formatMoney(item.lineAmount, item.currency, { withSymbol: false })}
      </td>
    </tr>
  );
}

// ─── Products table footer (grand total row) ──────────────────────────────────
function ProductsTableFoot({ total, currency }: { total: number; currency: string }) {
  return (
    <tr className="bg-orange-50 font-bold">
      <td colSpan={7} className="border-2 border-gray-400 px-2 py-1.5 text-right text-[11px]">
        报价总额 (Total Amount):
      </td>
      <td className="border-2 border-gray-400 px-2 py-1.5 text-right text-orange-600 text-sm">
        {formatMoney(total, currency, { withSymbol: false })}
      </td>
    </tr>
  );
}

// ─── Terms section ────────────────────────────────────────────────────────────
interface TermRow { label: string; value: string }

function TermsSection({ rows }: { rows: TermRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="mb-4">
      <table className="w-full border-collapse border border-gray-400 text-[11px]">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-xs">报价条款</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border border-gray-400 px-2 py-1.5">
                <span className="font-semibold">{r.label}</span>
                <span className="ml-1">{r.value}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Remarks block ────────────────────────────────────────────────────────────
function RemarksSection({ remarks }: { remarks: QuotationDocData['supplierRemarks'] }) {
  if (!remarks) return null;
  return (
    <div className="mb-4 bg-gray-50 border border-gray-300 rounded p-3">
      <div className="flex items-start justify-between mb-1.5">
        <h4 className="text-xs font-bold text-gray-800">📝 供应商备注</h4>
        <div className="text-[10px] text-gray-500">
          {formatDate(remarks.remarkDate)} | {remarks.remarkBy}
        </div>
      </div>
      <div className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">
        {remarks.content}
      </div>
    </div>
  );
}

// ─── Signature footer ─────────────────────────────────────────────────────────
function SignatureSection({ data }: { data: QuotationDocData }) {
  return (
    <div className="mt-2">
      <div className="border-t border-gray-300 pt-3">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-[11px] font-semibold text-gray-700 mb-4">报价方确认：</div>
            <div className="border-b border-gray-400 mb-1" style={{ height: 36 }} />
            <div className="text-[10px] text-gray-500 flex justify-between">
              <span>{data.supplier.name}</span>
              <span>签字 / 盖章</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-700 mb-4">询价方确认：</div>
            <div className="border-b border-gray-400 mb-1" style={{ height: 36 }} />
            <div className="text-[10px] text-gray-500 flex justify-between">
              <span>{data.buyer.name}</span>
              <span>签字 / 盖章</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state (no items) ───────────────────────────────────────────────────
function EmptyProductsState() {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center my-4">
      <p className="text-sm text-gray-400">暂无产品明细</p>
    </div>
  );
}

// ─── Main export: build pages ─────────────────────────────────────────────────
export function buildQuotationPages(data: QuotationDocData): React.ReactNode[] {
  const { items, currency, totalAmount, terms, supplierRemarks } = data;

  // Build term rows (only non-empty values)
  const termRows: TermRow[] = [
    terms.paymentTerms    && { label: '1. 付款方式：',          value: terms.paymentTerms },
    terms.deliveryTerms   && { label: '2. 交货条款：',          value: terms.deliveryTerms },
    terms.deliveryTime    && { label: '3. 交货时间：',          value: terms.deliveryTime },
    terms.deliveryAddress && { label: '4. 交货地址：',          value: terms.deliveryAddress },
    terms.moq             && { label: '5. 最小起订量（MOQ）：', value: terms.moq },
    terms.qualityStandard && { label: '6. 质量标准：',          value: terms.qualityStandard },
    terms.warranty        && { label: '7. 质保期：',            value: terms.warranty },
    terms.packaging       && { label: '8. 包装方式：',          value: terms.packaging },
    terms.shippingMarks   && { label: '9. 唛头：',              value: terms.shippingMarks },
    terms.remarks         && { label: '10. 其他说明：',         value: terms.remarks },
  ].filter(Boolean) as TermRow[];

  // Height estimates (px at 96dpi)
  const H = {
    header:      270,
    productHead:  52,
    productRow:   52,
    productFoot:  36,
    termsHead:    32,
    termsRow:     26,
    emptyState:   80,
    remarks: supplierRemarks
      ? Math.min(40 + supplierRemarks.content.split('\n').length * 16, 280)
      : 0,
    signature:    88,
  };

  const blocks: A4Block[] = [];

  // 1. Header block
  blocks.push({
    type: 'section',
    key: 'header',
    estimatedHeight: H.header,
    avoidBreak: false,
    render: () => <DocHeader data={data} />,
  });

  // 2. Products table (or empty state)
  if (items.length === 0) {
    blocks.push({
      type: 'section',
      key: 'empty-products',
      estimatedHeight: H.emptyState,
      avoidBreak: true,
      render: () => <EmptyProductsState />,
    });
  } else {
    blocks.push({
      type: 'table',
      key: 'products',
      headerHeight: H.productHead,
      rowHeight: H.productRow,
      rows: items,
      footerHeight: H.productFoot,
      renderHeader: () => <ProductsTableHead currency={currency} />,
      renderRow: (item) => <ProductRow item={item as QuotationDocItem} />,
      renderFooter: () => <ProductsTableFoot total={totalAmount} currency={currency} />,
    });
  }

  // 3. Terms section
  if (termRows.length > 0) {
    blocks.push({
      type: 'section',
      key: 'terms',
      estimatedHeight: H.termsHead + termRows.length * H.termsRow + 16,
      avoidBreak: true,
      render: () => <TermsSection rows={termRows} />,
    });
  }

  // 4. Remarks
  if (supplierRemarks) {
    blocks.push({
      type: 'section',
      key: 'remarks',
      estimatedHeight: H.remarks,
      avoidBreak: H.remarks < 200,
      render: () => <RemarksSection remarks={supplierRemarks} />,
    });
  }

  // 5. Signature
  blocks.push({
    type: 'section',
    key: 'signature',
    estimatedHeight: H.signature,
    avoidBreak: true,
    render: () => <SignatureSection data={data} />,
  });

  // Paginate
  const pages = paginateBlocks(blocks, { pageContentHeight: PAGE_CONTENT_H });

  return pages.map((page) => (
    <div key={page.index} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <div key={item.key}>{item.render()}</div>;
        }
        const tbl = item;
        return (
          <div key={tbl.key}>
            {tbl.renderHeader()}
            <table className="w-full border-collapse border-2 border-gray-300 text-[11px]">
              <tbody>
                {tbl.rows.map((row, ri) => tbl.renderRow(row, tbl.startIndex + ri))}
                {tbl.showFooter && tbl.renderFooter?.()}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  ));
}
