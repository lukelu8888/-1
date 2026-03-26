import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import {
  DEFAULT_PURCHASE_ORDER_PRODUCT_TABLE_COLUMNS,
  normalizePurchaseOrderProductTableColumns,
  type PurchaseOrderData,
} from '../PurchaseOrderDocument';

interface PurchaseOrderDocumentA4Props {
  data: PurchaseOrderData;
  showControls?: boolean;
}

interface PurchaseOrderDocumentA4PagesProps {
  data: PurchaseOrderData;
}

const tableClass = 'w-full border-collapse border border-gray-400 text-xs text-black';
const productTableClass = 'w-full border-collapse border-2 border-gray-300 text-xs text-black';
const thClass = 'border border-gray-400 bg-gray-100 px-2 py-1.5 text-left font-semibold text-black';
const tdClass = 'border border-gray-400 px-2 py-1.5 align-top text-black';
const sectionTitleClass = 'mb-2 text-base font-bold text-black';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toMoney(value: number) {
  return Number(value || 0).toFixed(2);
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function buildProductRowHeight(product: PurchaseOrderData['products'][number]) {
  const titleLines = estimateWrappedLines(product.description || '', 18);
  const specLines = estimateWrappedLines(product.specification || '', 26);
  return Math.max(60, 16 + titleLines * 12 + specLines * 10);
}

export const PurchaseOrderDocumentA4 = forwardRef<HTMLDivElement, PurchaseOrderDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildPurchaseOrderPages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.poNo || 'cg'}.pdf`} />
      </div>
    );
  },
);

PurchaseOrderDocumentA4.displayName = 'PurchaseOrderDocumentA4';

export function PurchaseOrderDocumentA4Pages({ data }: PurchaseOrderDocumentA4PagesProps) {
  const pages = useMemo(() => buildPurchaseOrderPages(data), [data]);

  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`po-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildPurchaseOrderPages(data: PurchaseOrderData): React.ReactNode[] {
  const products = Array.isArray(data?.products) ? data.products : [];
  const productTableColumns = normalizePurchaseOrderProductTableColumns(
    data?.templateSettings?.productTableColumns || DEFAULT_PURCHASE_ORDER_PRODUCT_TABLE_COLUMNS,
  );
  const total = products.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const normalizedTermCurrency = String(data?.terms?.currency || '').trim().toUpperCase();
  const productCurrencies = Array.from(
    new Set(products.map((item) => String(item.currency || '').trim().toUpperCase()).filter(Boolean)),
  );
  const bankCurrency = String(data?.supplier?.bankInfo?.currency || '').trim().toUpperCase();
  const currency =
    normalizedTermCurrency ||
    (productCurrencies.length === 1 ? productCurrencies[0] : '') ||
    (bankCurrency && !bankCurrency.includes('/') ? bankCurrency : '') ||
    'CNY';

  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 140,
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-[70px] w-[80px] items-center">
              <img src={cosunLogo} alt="THE COSUN Logo" className="h-auto max-h-full w-full" style={{ objectFit: 'contain' }} />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <h1 className="text-3xl font-bold tracking-wider text-black">采购合同</h1>
            </div>
            <div className="w-[210px] h-[78px]">
              <table className="h-full w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">合同编号</td>
                    <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black whitespace-nowrap">{data.poNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">合同日期</td>
                    <td className="border border-gray-400 px-1.5 py-0.5 whitespace-nowrap">{formatDate(data.poDate).replace(/\//g, '-')}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">要求交期</td>
                    <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black whitespace-nowrap">{formatDate(data.requiredDeliveryDate).replace(/\//g, '-')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-b border-gray-400 border-t-2" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>
      ),
    },
    {
      type: 'section',
      key: 'parties',
      estimatedHeight: 160,
      avoidBreak: true,
      render: () => (
        <table className={tableClass}>
          <tbody>
            <tr>
              <td className="w-1/2 border border-gray-400 p-0 align-top">
                <div className="border-b border-gray-400 bg-gray-200 px-2 py-1 font-bold">采购方（买方）</div>
                <div className="space-y-0.5 px-2 py-1.5">
                  <div><span className="font-semibold">{data.buyer.name}</span></div>
                  <div className="text-gray-700">{data.buyer.nameEn}</div>
                  <div><span className="text-black">地址：</span>{data.buyer.address}</div>
                  <div><span className="text-black">电话：</span>{data.buyer.tel}</div>
                  <div><span className="text-black">邮箱：</span>{data.buyer.email}</div>
                  <div><span className="text-black">联系人：</span>{data.buyer.contactPerson}</div>
                </div>
              </td>
              <td className="w-1/2 border border-gray-400 p-0 align-top">
                <div className="border-b border-gray-400 bg-gray-200 px-2 py-1 font-bold">供应商（卖方）</div>
                <div className="space-y-0.5 px-2 py-1.5">
                  <div><span className="font-semibold">{data.supplier.companyName}</span></div>
                  {data.supplier.supplierCode ? <div><span className="text-black">编码：</span>{data.supplier.supplierCode}</div> : null}
                  <div><span className="text-black">地址：</span>{data.supplier.address}</div>
                  <div><span className="text-black">联系人：</span>{data.supplier.contactPerson}</div>
                  <div><span className="text-black">电话：</span>{data.supplier.tel}</div>
                  <div><span className="text-black">邮箱：</span>{data.supplier.email}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      type: 'table',
      key: 'items',
      headerHeight: 90,
      rowHeight: (row) => buildProductRowHeight(row),
      footerHeight: 44,
      rows: products,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-100">
            {productTableColumns.map((column) => (
              <th
                key={column.key}
                className={`border border-gray-300 px-2 py-2 ${
                  column.key === 'image'
                    ? 'text-center'
                    : column.key === 'quantity' || column.key === 'unitPrice' || column.key === 'amount'
                      ? 'text-right'
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
      renderRow: (row, idx) => (
        <tr key={`${row.no}-${idx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          {productTableColumns.map((column) => {
            switch (column.key) {
              case 'no':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{row.no || idx + 1}</td>;
              case 'itemCode':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-gray-700">{row.modelNo || row.itemCode || '-'}</td>;
              case 'image':
                return (
                  <td key={column.key} className="border border-gray-300 px-1 py-1 text-center">
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt={row.description} className="mx-auto h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">无图</div>
                    )}
                  </td>
                );
              case 'description':
                return (
                  <td key={column.key} className="border border-gray-300 px-2 py-2">
                    <div className="font-semibold">{row.description}</div>
                    <div className="mt-0.5 text-xs text-gray-600">{row.specification}</div>
                  </td>
                );
              case 'quantity':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{Number(row.quantity || 0).toLocaleString()}</td>;
              case 'unit':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{row.unit}</td>;
              case 'unitPrice':
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{toMoney(Number(row.unitPrice || 0))}</td>;
              case 'amount':
              default:
                return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right font-semibold">{toMoney(Number(row.amount || 0))}</td>;
            }
          })}
        </tr>
      ),
      renderFooter: () => (
        <tr className="bg-gray-100 font-bold">
          <td colSpan={Math.max(productTableColumns.length - 1, 1)} className="border border-gray-300 px-2 py-2 text-right">
            采购总金额（{currency}）：
          </td>
          <td className="border border-gray-300 px-2 py-2 text-right text-base text-black">{toMoney(total)}</td>
        </tr>
      ),
    },
  ];

  if (data.supplier.bankInfo) {
    blocks.push({
      type: 'section',
      key: 'bank',
      estimatedHeight: 150,
      avoidBreak: true,
      render: () => (
        <section>
          <table className={tableClass}>
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={4}>供应商银行收款信息</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={thClass} style={{ width: 140 }}>开户银行</td>
                <td className={tdClass}>{data.supplier.bankInfo?.bankName || '-'}</td>
                <td className={thClass} style={{ width: 140 }}>账户名称</td>
                <td className={tdClass}>{data.supplier.bankInfo?.accountName || '-'}</td>
              </tr>
              <tr>
                <td className={thClass}>银行账号</td>
                <td className={tdClass}>{data.supplier.bankInfo?.accountNumber || '-'}</td>
                <td className={thClass}>收款币种</td>
                <td className={tdClass}>{data.supplier.bankInfo?.currency || currency}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ),
    });
  }

  blocks.push(
    {
      type: 'section',
      key: 'terms',
      estimatedHeight: 180,
      avoidBreak: true,
      render: () => (
        <section>
          <table className={tableClass}>
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">合同条款</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdClass}><span className="font-semibold">1. 付款条款：</span><span className="ml-1">{data.terms.paymentTerms}</span></td>
              </tr>
              <tr>
                <td className={tdClass}><span className="font-semibold">2. 交货条款：</span><span className="ml-1">{data.terms.deliveryTerms}</span></td>
              </tr>
              <tr>
                <td className={tdClass}><span className="font-semibold">3. 交货地址：</span><span className="ml-1">{data.terms.deliveryAddress}</span></td>
              </tr>
              <tr>
                <td className={tdClass}><span className="font-semibold">4. 质量标准：</span><span className="ml-1">{data.terms.qualityStandard}</span></td>
              </tr>
              <tr>
                <td className={tdClass}><span className="font-semibold">5. 验收方式：</span><span className="ml-1">{data.terms.inspectionMethod}</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      ),
    },
    {
      type: 'section',
      key: 'sign',
      estimatedHeight: 160,
      avoidBreak: true,
      render: () => (
        <section>
          <h2 className={sectionTitleClass}>签章</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="rounded border border-[#cbd5e1] p-3">
              <div className="mb-16 font-semibold">采购方盖章：</div>
              <div className="text-[12px] text-[#6b7280]">日期：________________</div>
            </div>
            <div className="rounded border border-[#cbd5e1] p-3">
              <div className="mb-16 font-semibold">供应商盖章：</div>
              <div className="text-[12px] text-[#6b7280]">日期：________________</div>
            </div>
          </div>
        </section>
      ),
    },
  );

  return paginateBlocks(blocks).map((page) => (
    <div key={`po-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        return (
          <section key={item.key}>
            <h2 className={sectionTitleClass}>采购明细：</h2>
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
