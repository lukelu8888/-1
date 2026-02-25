import React, { forwardRef, useMemo } from 'react';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import type { PurchaseOrderData } from '../PurchaseOrderDocument';

interface PurchaseOrderDocumentA4Props {
  data: PurchaseOrderData;
  showControls?: boolean;
}

const tableClass = 'w-full border-collapse text-[12px]';
const thClass = 'border border-[#cbd5e1] bg-[#f3f4f6] p-2 text-left font-semibold';
const tdClass = 'border border-[#cbd5e1] p-2 align-top';
const sectionTitleClass = 'text-[14px] font-bold text-[#111827] mb-2';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toMoney(value: number) {
  return Number(value || 0).toFixed(2);
}

export const PurchaseOrderDocumentA4 = forwardRef<HTMLDivElement, PurchaseOrderDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const total = data.products.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const currency = data.products[0]?.currency || data.terms.currency || 'CNY';

    const blocks = useMemo<A4Block[]>(() => {
      const result: A4Block[] = [
        {
          type: 'section',
          key: 'header',
          estimatedHeight: 140,
          avoidBreak: true,
          render: () => (
            <div>
              <div className="mb-2 flex items-start justify-between gap-4">
                <h1 className="text-[28px] font-bold tracking-wide text-[#111827]">采购订单</h1>
                <table className={tableClass} style={{ width: 320 }}>
                  <tbody>
                    <tr>
                      <td className={thClass}>采购单号</td>
                      <td className={tdClass}>{data.poNo}</td>
                    </tr>
                    <tr>
                      <td className={thClass}>下单日期</td>
                      <td className={tdClass}>{formatDate(data.poDate)}</td>
                    </tr>
                    <tr>
                      <td className={thClass}>要求交期</td>
                      <td className={tdClass}>{formatDate(data.requiredDeliveryDate)}</td>
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
          estimatedHeight: 190,
          avoidBreak: true,
          render: () => (
            <section>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>采购方（买方）</th>
                    <th className={thClass}>供应商（卖方）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdClass}>
                      <div className="font-semibold">{data.buyer.name}</div>
                      <div>{data.buyer.nameEn}</div>
                      <div>地址：{data.buyer.address}</div>
                      <div>电话：{data.buyer.tel}</div>
                      <div>邮箱：{data.buyer.email}</div>
                      <div>联系人：{data.buyer.contactPerson}</div>
                    </td>
                    <td className={tdClass}>
                      <div className="font-semibold">{data.supplier.companyName}</div>
                      <div>编码：{data.supplier.supplierCode || '-'}</div>
                      <div>地址：{data.supplier.address}</div>
                      <div>电话：{data.supplier.tel}</div>
                      <div>邮箱：{data.supplier.email}</div>
                      <div>联系人：{data.supplier.contactPerson}</div>
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
          rowHeight: 56,
          footerHeight: 44,
          rows: data.products,
          renderHeader: () => (
            <thead>
              <tr>
                <th className={thClass}>序号</th>
                <th className={thClass}>产品名称/规格</th>
                <th className={thClass}>数量</th>
                <th className={thClass}>单位</th>
                <th className={thClass}>单价</th>
                <th className={thClass}>金额</th>
              </tr>
            </thead>
          ),
          renderRow: (row, idx) => (
            <tr key={`${row.no}-${idx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <td className={tdClass}>{row.no || idx + 1}</td>
              <td className={tdClass}>
                <div className="font-semibold">{row.description}</div>
                <div className="text-[11px] text-[#6b7280]">{row.specification}</div>
              </td>
              <td className={tdClass}>{Number(row.quantity || 0).toLocaleString()}</td>
              <td className={tdClass}>{row.unit}</td>
              <td className={tdClass}>{`${row.currency || currency} ${toMoney(Number(row.unitPrice || 0))}`}</td>
              <td className={tdClass}>{`${row.currency || currency} ${toMoney(Number(row.amount || 0))}`}</td>
            </tr>
          ),
          renderFooter: () => (
            <tr>
              <td className={`${tdClass} text-right font-semibold`} colSpan={5}>
                采购总金额
              </td>
              <td className={`${tdClass} font-semibold`}>{`${currency} ${toMoney(total)}`}</td>
            </tr>
          ),
        },
      ];

      if (data.supplier.bankInfo) {
        result.push({
          type: 'section',
          key: 'bank',
          estimatedHeight: 150,
          avoidBreak: true,
          render: () => (
            <section>
              <h2 className={sectionTitleClass}>供应商收款信息</h2>
              <table className={tableClass}>
                <tbody>
                  <tr>
                    <td className={thClass} style={{ width: 140 }}>
                      开户银行
                    </td>
                    <td className={tdClass}>{data.supplier.bankInfo?.bankName || '-'}</td>
                    <td className={thClass} style={{ width: 140 }}>
                      账户名称
                    </td>
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

      result.push(
        {
          type: 'section',
          key: 'terms',
          estimatedHeight: 180,
          avoidBreak: true,
          render: () => (
            <section>
              <h2 className={sectionTitleClass}>合同条款</h2>
              <table className={tableClass}>
                <tbody>
                  <tr>
                    <td className={thClass} style={{ width: 160 }}>
                      付款条款
                    </td>
                    <td className={tdClass}>{data.terms.paymentTerms}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>交货条款</td>
                    <td className={tdClass}>{data.terms.deliveryTerms}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>交货地址</td>
                    <td className={tdClass}>{data.terms.deliveryAddress}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>质量标准</td>
                    <td className={tdClass}>{data.terms.qualityStandard}</td>
                  </tr>
                  <tr>
                    <td className={thClass}>验收方式</td>
                    <td className={tdClass}>{data.terms.inspectionMethod}</td>
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

      return result;
    }, [currency, data, total]);

    const pages = paginateBlocks(blocks).map((page) => (
      <div key={`po-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
        {page.items.map((item) => {
          if (item.type === 'section') {
            return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
          }

          return (
            <section key={item.key}>
              <h2 className={sectionTitleClass}>采购产品明细</h2>
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

    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.poNo || 'purchase-order'}.pdf`} />
      </div>
    );
  },
);

PurchaseOrderDocumentA4.displayName = 'PurchaseOrderDocumentA4';
