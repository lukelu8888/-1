import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import type { XJData } from '../XJDocument';
import type { DocumentConditionGroup, DocumentConditionItem } from '../../../../types/documentConditions';

interface XJDocumentA4Props {
  data: XJData;
  showControls?: boolean;
}

interface XJDocumentA4PagesProps {
  data: XJData;
  footerContact?: {
    name?: string;
    email?: string;
  } | null;
}

interface XjTermRow {
  label: string;
  value: string;
}

interface XjConditionRow {
  item: DocumentConditionItem;
  itemIndex: number;
}

const sectionTitleClass = 'mb-2 text-base font-bold text-black';
const tableClass = 'w-full border-collapse border border-gray-400 text-xs';
const compactTableClass = 'w-full border-collapse border-2 border-gray-300 text-xs';
const thClass = 'border border-gray-400 bg-gray-100 px-1.5 py-0.5 text-left font-semibold whitespace-nowrap';
const tdClass = 'border border-gray-400 px-1.5 py-0.5 align-top';

function safeFormatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  const safe = String(text || '');
  return safe
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function buildProductRowHeight(product: XJData['products'][number]) {
  const descriptionLines = estimateWrappedLines(product.description || '', 14);
  const specLines = estimateWrappedLines(product.specification || '', 20);
  return Math.max(72, 18 + descriptionLines * 14 + specLines * 12);
}

function buildTermsRows(data: XJData): XjTermRow[] {
  const rows: Array<XjTermRow | null> = [
    data.terms.currency ? { label: '1. 报价币种', value: data.terms.currency } : null,
    data.terms.paymentTerms ? { label: '2. 付款方式', value: data.terms.paymentTerms } : null,
    data.terms.deliveryTerms ? { label: '3. 交货条款', value: data.terms.deliveryTerms } : null,
    data.terms.deliveryAddress ? { label: '4. 交货地址', value: data.terms.deliveryAddress } : null,
    data.terms.deliveryRequirement ? { label: '5. 交货时间', value: data.terms.deliveryRequirement } : null,
    data.terms.qualityStandard ? { label: '6. 产品质量标准', value: data.terms.qualityStandard } : null,
    data.terms.inspectionMethod ? { label: '7. 验收标准', value: data.terms.inspectionMethod } : null,
    data.terms.packaging ? { label: '8. 包装要求', value: data.terms.packaging } : null,
    data.terms.shippingMarks ? { label: '9. 唛头要求', value: data.terms.shippingMarks } : null,
    data.terms.inspectionRequirement ? { label: '10. 验货要求', value: data.terms.inspectionRequirement } : null,
    data.terms.technicalDocuments ? { label: '11. 技术文件', value: data.terms.technicalDocuments } : null,
    data.terms.ipRights ? { label: '12. 知识产权', value: data.terms.ipRights } : null,
    data.terms.confidentiality ? { label: '13. 保密条款', value: data.terms.confidentiality } : null,
    data.terms.sampleRequirement ? { label: '14. 样品要求', value: data.terms.sampleRequirement } : null,
    data.terms.moq ? { label: '15. 最小起订量（MOQ）', value: data.terms.moq } : null,
    data.terms.remarks ? { label: '16. 其他说明', value: data.terms.remarks } : null,
  ];

  return rows.filter((row): row is XjTermRow => Boolean(row));
}

function buildTermRowHeight(row: XjTermRow) {
  const wrappedLines = estimateWrappedLines(row.value, 50);
  return Math.max(36, 16 + wrappedLines * 18);
}

function buildConditionRowHeight(row: XjConditionRow) {
  const content = row.item.hint ? `${row.item.value}\n${row.item.hint}` : row.item.value;
  const wrappedLines = estimateWrappedLines(content, 34);
  return Math.max(44, 20 + wrappedLines * 20);
}

export const XJDocumentA4 = forwardRef<HTMLDivElement, XJDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildXJPages(data), [data]);

    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.xjNo || 'xj'}.pdf`} />
      </div>
    );
  },
);

XJDocumentA4.displayName = 'XJDocumentA4';

export function XJDocumentA4Pages({ data, footerContact = null }: XJDocumentA4PagesProps) {
  const pages = useMemo(() => buildXJPages(data, footerContact), [data, footerContact]);

  return (
    <>
      {pages.map((page, index) => {
        const isLastPage = index === pages.length - 1;
        const footerName = footerContact?.name || data.buyer.contactPerson;
        const footerEmail = footerContact?.email || data.buyer.email;

        return (
          <A4Page
            key={`xj-page-${index}`}
            pageNumber={index + 1}
            totalPages={pages.length}
            footer={(
              <div
                className={`flex min-h-[16px] items-end ${isLastPage ? 'justify-between gap-6 border-t border-[#e5e7eb] pt-3' : 'justify-end'}`}
              >
                {isLastPage ? (
                  <div className="flex-1 text-center text-[11px] leading-6 text-[#374151]">
                    如有疑问，请及时联系采购联系人：{footerName} | {footerEmail}
                  </div>
                ) : null}
                <div
                  style={{
                    fontSize: 11,
                    color: '#9ca3af',
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {`${index + 1} / ${pages.length}`}
                </div>
              </div>
            )}
          >
            {page}
          </A4Page>
        );
      })}
    </>
  );
}

export function buildXJPages(
  data: XJData,
  footerContact?: {
    name?: string;
    email?: string;
  } | null,
): React.ReactNode[] {
  const termRows = buildTermsRows(data);
  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 150,
      avoidBreak: true,
      render: () => (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-[70px] w-[80px] items-center">
              <img src={cosunLogo} alt="THE COSUN Logo" className="h-auto max-h-full w-full" style={{ objectFit: 'contain' }} />
            </div>
            <div className="flex flex-1 justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-wider text-black">询价单</h1>
                <p className="mt-1 text-sm text-gray-600">Procurement Inquiry</p>
              </div>
            </div>
            <div className="w-[180px]">
              <table className={tableClass}>
                <tbody>
                <tr>
                  <td className={thClass}>询价编号</td>
                  <td className={`${tdClass} font-bold text-black`}>{data.xjNo}</td>
                </tr>
                <tr>
                  <td className={thClass}>询价日期</td>
                  <td className={tdClass}>{safeFormatDate(data.xjDate)}</td>
                </tr>
                <tr>
                  <td className={thClass}>回复截止</td>
                  <td className={`${tdClass} font-semibold text-[#ea580c]`}>{safeFormatDate(data.requiredResponseDate)}</td>
                </tr>
                <tr>
                  <td className={thClass}>要求交期</td>
                  <td className={`${tdClass} font-semibold`}>{safeFormatDate(data.requiredDeliveryDate)}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t-2 border-b border-[#9ca3af]" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>
      ),
    },
    {
      type: 'section',
      key: 'parties',
      estimatedHeight: 164,
      avoidBreak: true,
      render: () => (
        <section className="mb-3">
          <table className={tableClass}>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-0 align-top w-1/2">
                  <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">询价方</div>
                  <div className="px-2 py-1.5 space-y-0.5">
                    <div className="font-semibold">{data.buyer.name}</div>
                    <div className="text-gray-600">{data.buyer.nameEn}</div>
                    <div><span className="text-gray-600">地址：</span>{data.buyer.address}</div>
                    <div><span className="text-gray-600">电话：</span>{data.buyer.tel}</div>
                    <div><span className="text-gray-600">邮箱：</span>{data.buyer.email}</div>
                    <div><span className="text-gray-600">联系人：</span>{data.buyer.contactPerson}</div>
                  </div>
                </td>
                <td className="border border-gray-400 p-0 align-top w-1/2">
                  <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">供应商</div>
                  <div className="px-2 py-1.5 space-y-0.5">
                    <div className="font-semibold">{data.supplier.companyName}</div>
                    {data.supplier.supplierCode ? (
                      <div><span className="text-gray-600">供应商编号：</span><span className="font-semibold text-blue-600">{data.supplier.supplierCode}</span></div>
                    ) : null}
                    <div><span className="text-gray-600">地址：</span>{data.supplier.address}</div>
                    <div><span className="text-gray-600">联系人：</span>{data.supplier.contactPerson}</div>
                    <div><span className="text-gray-600">电话：</span>{data.supplier.tel}</div>
                    <div><span className="text-gray-600">邮箱：</span>{data.supplier.email}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      ),
    },
    {
      type: 'section',
      key: 'description',
      estimatedHeight: 56,
      avoidBreak: true,
      render: () => (
        <section className="mb-3">
          <div className="rounded border border-orange-200 bg-orange-50 p-2">
            <p className="text-xs text-gray-700">
              <span className="font-semibold text-orange-700">📋 询价说明：</span>
              {data.inquiryDescription ? (
                <span>{data.inquiryDescription}</span>
              ) : (
                <>
                  请贵司根据以下产品清单和要求提供详细报价，包括单价、总价、交货期等信息。
                  请在 <span className="font-bold text-orange-600">{safeFormatDate(data.requiredResponseDate)}</span> 前将报价单回复至采购联系人邮箱。
                </>
              )}
            </p>
          </div>
        </section>
      ),
    },
    {
      type: 'table',
      key: 'products',
      headerHeight: 78,
      rowHeight: (product) => buildProductRowHeight(product),
      rows: data.products,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-2 text-left w-8">序号</th>
            <th className="border border-gray-300 px-2 py-2 text-left w-20">型号</th>
            <th className="border border-gray-300 px-2 py-2 text-center w-16">图片</th>
            <th className="border border-gray-300 px-2 py-2 text-left">产品名称/规格</th>
            <th className="border border-gray-300 px-2 py-2 text-right w-16">数量</th>
            <th className="border border-gray-300 px-2 py-2 text-center w-10">单位</th>
          </tr>
        </thead>
      ),
      renderRow: (product, index) => (
        <tr key={`${product.no}-${index}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className="border border-gray-300 px-2 py-2 text-center">{product.no}</td>
          <td className="border border-gray-300 px-2 py-2 text-gray-700">{product.modelNo || product.itemCode || '-'}</td>
          <td className="border border-gray-300 px-1 py-1 text-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.description} className="mx-auto h-10 w-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-400">
                无图
              </div>
            )}
          </td>
          <td className="border border-gray-300 px-2 py-2">
            <div className="font-semibold">{product.description}</div>
            <div className="text-xs text-gray-600 mt-0.5">{product.specification}</div>
          </td>
          <td className="border border-gray-300 px-2 py-2 text-right font-semibold">{Number(product.quantity || 0).toLocaleString()}</td>
          <td className="border border-gray-300 px-2 py-2 text-center">{product.unit}</td>
        </tr>
      ),
    },
  ];

  const visibleConditionGroups = (data.conditionGroups || []).filter(
    (group): group is DocumentConditionGroup => Array.isArray(group.items) && group.items.length > 0,
  );

  if (visibleConditionGroups.length > 0) {
    blocks.push({
      type: 'section',
      key: 'conditions-title',
      estimatedHeight: 28,
      render: () => (
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold text-base">询价条件汇总</h3>
          <span className="text-[10px] uppercase tracking-wide text-gray-500">XJ CONDITIONS</span>
        </div>
      ),
    });

    visibleConditionGroups.forEach((group) => {
      const rows: XjConditionRow[] = group.items.map((item, index) => ({
        item,
        itemIndex: index,
      }));

      blocks.push({
        type: 'table',
        key: `conditions-${group.key}`,
        headerHeight: 46,
        rowHeight: (row) => buildConditionRowHeight(row),
        rows,
        renderHeader: () => (
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold" colSpan={3}>
                <div className="flex items-center justify-between gap-2">
                  <span>{group.title}</span>
                  {group.titleEn ? (
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">{group.titleEn}</span>
                  ) : null}
                </div>
              </th>
            </tr>
          </thead>
        ),
        renderRow: (row) => (
          <tr key={row.item.key} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <td className="w-10 border border-gray-400 px-2 py-1.5 text-center font-semibold text-gray-600">
              {row.itemIndex + 1}
            </td>
            <td className="w-40 border border-gray-400 px-2 py-1.5 font-semibold text-gray-700">
              {row.item.label}
            </td>
            <td className="border border-gray-400 px-2 py-1.5">
              <div className="whitespace-pre-wrap break-words text-gray-900">{row.item.value}</div>
              {row.item.hint ? <div className="mt-1 text-[10px] text-blue-600">{row.item.hint}</div> : null}
            </td>
          </tr>
        ),
      });
    });
  }

  blocks.push(
    {
      type: 'table',
      key: 'terms',
      headerHeight: 34,
      rowHeight: (row) => buildTermRowHeight(row),
      rows: termRows,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={2}>
              询价要求和条款
            </th>
          </tr>
        </thead>
      ),
      renderRow: (row) => (
        <tr key={row.label} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className="border border-gray-400 px-2 py-1.5 font-semibold" style={{ width: 190 }}>
            {row.label}：
          </td>
          <td className="border border-gray-400 px-2 py-1.5 whitespace-pre-wrap">{row.value}</td>
        </tr>
      ),
    },
  );

  const paginatedPages = paginateBlocks(blocks);

  return paginatedPages.map((page) => (
    <div key={`xj-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        if (item.key.startsWith('products')) {
          return (
            <section key={item.key} className="mb-4">
              <h3 className={sectionTitleClass}>询价产品清单：</h3>
              <table className={compactTableClass}>
                {item.renderHeader()}
                <tbody>
                  {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                  {item.showFooter && item.renderFooter?.()}
                </tbody>
              </table>
            </section>
          );
        }

        if (item.key.startsWith('terms')) {
          return (
            <section key={item.key} className="mb-6">
              <table className={tableClass}>
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={2}>
                      {item.startIndex > 0 ? '询价要求和条款（续）' : '询价要求和条款'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                  {item.showFooter && item.renderFooter?.()}
                </tbody>
              </table>
            </section>
          );
        }

        return (
          <section key={item.key} className="mb-6">
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
