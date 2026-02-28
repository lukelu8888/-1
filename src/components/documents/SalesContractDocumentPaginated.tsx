/**
 * SalesContractDocumentPaginated — 销售合同（新架构版）
 *
 * 使用 A4DocumentLayout + A4Sheet + PaginatedTable 实现真实分页：
 *   - 产品行按每页可用高度自动分配
 *   - 首页包含文档标题、双方信息（预留约 310px）
 *   - 后续页仅有续表（预留约 40px）
 *   - 条款 + 签名区固定在最后一页
 *   - 打印时每页精确 A4，无需 transform:scale
 */

import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';
import { SalesContractData } from './templates/SalesContractDocument';
import {
  A4DocumentLayout,
  A4Sheet,
  A4Body,
  A4_PAD_X,
} from './a4/A4DocumentLayout';
import { PaginatedTable, ROW_HEIGHT } from './a4/index';

// ─── 行高常量（与实际 CSS 对齐）────────────────────────────────────────────────
// 产品行：图片 32px + padding 8px + 描述两行 ≈ 44px
const PRODUCT_ROW_H = 44;
// 表头行高
const PRODUCT_HEADER_H = 28;
// 首页预留：logo+标题(70) + 分割线(8) + 双方信息表(100) + 文章标题(28) + 间距(24) = ~230
const FIRST_PAGE_RESERVED = 230;
// 后续页预留：续表标题(28) + 间距(12) = 40
const OTHER_PAGE_RESERVED = 40;
// 最后一页底部：条款(约200) + 签名(约130) = 330
const LAST_PAGE_BOTTOM_H = 330;

interface SalesContractDocumentPaginatedProps {
  data: SalesContractData;
}

export const SalesContractDocumentPaginated = forwardRef<
  HTMLDivElement,
  SalesContractDocumentPaginatedProps
>(({ data }, ref) => {
  const toSafeNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const n = Number(value.replace(/[^0-9.\-]/g, '').trim());
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const total = data.products.reduce(
    (sum, item) => sum + toSafeNumber(item.amount),
    0,
  );

  const extractTradeTerm = (t: string): string => {
    const u = t.toUpperCase();
    if (u.includes('EXW')) return 'EXW';
    if (u.includes('FOB')) return 'FOB';
    if (u.includes('CNF') || u.includes('C&F')) return 'CNF';
    if (u.includes('CIF')) return 'CIF';
    return 'EXW';
  };
  const tradeTerm = extractTradeTerm(data.terms.tradeTerms);

  // ── 共用子组件 ──────────────────────────────────────────────────────────────
  const DocumentHeader = () => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        {/* Logo */}
        <div style={{ width: 70, display: 'flex', alignItems: 'flex-end' }}>
          <img src={cosunLogo} alt="COSUN" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </div>
        {/* Title */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, margin: 0 }}>SALES CONTRACT</h1>
        </div>
        {/* Contract info table */}
        <div style={{ width: 231, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af', fontSize: 9 }}>
            <tbody>
              {data.quotationNo && (
                <tr>
                  <td style={{ border: '1px solid #9ca3af', padding: '2px 6px', background: '#f3f4f6', fontWeight: 600, whiteSpace: 'nowrap', width: '30%' }}>Ref. No.</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '2px 6px', width: '70%' }}>{data.quotationNo}</td>
                </tr>
              )}
              <tr>
                <td style={{ border: '1px solid #9ca3af', padding: '2px 6px', background: '#f3f4f6', fontWeight: 600, whiteSpace: 'nowrap' }}>Contract No.</td>
                <td style={{ border: '1px solid #9ca3af', padding: '2px 6px', fontWeight: 700 }}>{data.contractNo}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #9ca3af', padding: '2px 6px', background: '#f3f4f6', fontWeight: 600, whiteSpace: 'nowrap' }}>Date</td>
                <td style={{ border: '1px solid #9ca3af', padding: '2px 6px', fontWeight: 600 }}>
                  {new Date(data.contractDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ borderTop: '2.5px solid #000', borderBottom: '1px solid #9ca3af' }} />
    </div>
  );

  const PartiesTable = () => (
    <div style={{ marginBottom: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af', fontSize: 9 }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #9ca3af', padding: 0, width: '50%', verticalAlign: 'top' }}>
              <div style={{ background: '#e5e7eb', padding: '2px 6px', fontWeight: 700, borderBottom: '1px solid #9ca3af', fontSize: 9 }}>SELLER</div>
              <div style={{ padding: '4px 6px', fontSize: 9, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600 }}>{data.seller.nameEn}</div>
                <div><span style={{ color: '#6b7280' }}>Address:</span> {data.seller.addressEn}</div>
                <div><span style={{ color: '#6b7280' }}>Tel:</span> {data.seller.tel}</div>
                <div><span style={{ color: '#6b7280' }}>Email:</span> {data.seller.email}</div>
              </div>
            </td>
            <td style={{ border: '1px solid #9ca3af', padding: 0, width: '50%', verticalAlign: 'top' }}>
              <div style={{ background: '#e5e7eb', padding: '2px 6px', fontWeight: 700, borderBottom: '1px solid #9ca3af', fontSize: 9 }}>BUYER</div>
              <div style={{ padding: '4px 6px', fontSize: 9, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600 }}>{data.buyer.companyName}</div>
                <div><span style={{ color: '#6b7280' }}>Address:</span> {data.buyer.address}</div>
                <div><span style={{ color: '#6b7280' }}>Country:</span> {data.buyer.country}</div>
                <div><span style={{ color: '#6b7280' }}>Contact:</span> {data.buyer.contactPerson}</div>
                <div><span style={{ color: '#6b7280' }}>Tel:</span> {data.buyer.tel}</div>
                <div><span style={{ color: '#6b7280' }}>Email:</span> {data.buyer.email}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const TermsSection = () => (
    <div style={{ marginBottom: 8 }}>
      <h3 style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, marginTop: 0 }}>ARTICLE 2: TERMS AND CONDITIONS</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af', fontSize: 9 }}>
        <tbody>
          {[
            ['2.1 Trade Terms', data.terms.tradeTerms],
            ['2.2 Payment Terms', data.terms.paymentTerms],
            ['2.3 Delivery Time', data.terms.deliveryTime],
            ['2.4 Port of Loading', data.terms.portOfLoading],
            ['2.5 Port of Destination', data.terms.portOfDestination],
            ['2.6 Packing', data.terms.packing],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ border: '1px solid #9ca3af', padding: '2px 6px' }}>
                <span style={{ fontWeight: 600 }}>{label}:</span>
                <span style={{ marginLeft: 4 }}>{value}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const SignatureSection = () => (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '2px solid #d1d5db' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'SELLER (Company Seal):', name: data.seller.nameEn },
          { label: 'BUYER (Company Seal):', name: data.buyer.companyName },
        ].map(({ label, name }) => (
          <div key={label}>
            <h4 style={{ fontWeight: 700, marginBottom: 4, fontSize: 9, marginTop: 0 }}>{label}</h4>
            <div style={{ fontSize: 8, lineHeight: 1.8 }}>
              <p style={{ fontWeight: 600, fontSize: 9, margin: '0 0 4px' }}>{name}</p>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: 4, padding: 8, background: '#f9fafb', textAlign: 'center', marginBottom: 4 }}>
                <p style={{ color: '#9ca3af', fontSize: 8, margin: 0 }}>Company Seal</p>
              </div>
              <div style={{ borderBottom: '1px solid #9ca3af', paddingBottom: 2, marginBottom: 4 }}>
                <p style={{ color: '#6b7280', fontSize: 8, margin: 0 }}>Signature: ____________</p>
              </div>
              <p style={{ color: '#6b7280', fontSize: 8, margin: 0 }}>Date: ____________</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── 产品表头（每页重复）──────────────────────────────────────────────────────
  const ProductTableHeader = () => (
    <thead>
      <tr style={{ background: '#f3f4f6' }}>
        {[
          { label: 'No.', w: 28, align: 'left' as const },
          { label: 'Model', w: 70, align: 'left' as const },
          { label: 'Image', w: 50, align: 'center' as const },
          { label: 'Description / Specification', w: undefined, align: 'left' as const },
          { label: 'Qty', w: 55, align: 'right' as const },
          { label: 'Unit Price', w: 72, align: 'right' as const },
          { label: 'Amount', w: 80, align: 'right' as const },
        ].map(({ label, w, align }) => (
          <th
            key={label}
            style={{
              border: '1px solid #d1d5db',
              padding: '4px 6px',
              textAlign: align,
              fontSize: 9,
              fontWeight: 600,
              width: w,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );

  // ── 产品行渲染 ───────────────────────────────────────────────────────────────
  const renderProductRow = (
    product: (typeof data.products)[number],
    _rowIndex: number,
  ) => (
    <tr key={product.no}>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 6px', textAlign: 'center', fontSize: 9 }}>{product.no}</td>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 6px', fontSize: 8 }}>{product.modelNo || '-'}</td>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 4px', textAlign: 'center' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.description} style={{ width: 32, height: 32, objectFit: 'cover', margin: '0 auto', display: 'block', borderRadius: 2 }} />
        ) : (
          <div style={{ width: 32, height: 32, background: '#f3f4f6', margin: '0 auto', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#9ca3af' }}>N/A</div>
        )}
      </td>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}>
        <div style={{ fontWeight: 600, fontSize: 9 }}>{product.description}</div>
        <div style={{ fontSize: 8, color: '#6b7280' }}>{product.specification}</div>
      </td>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 6px', textAlign: 'right', fontSize: 9 }}>{product.quantity.toLocaleString()}</td>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 6px', textAlign: 'right', fontSize: 9 }}>{product.currency} {toSafeNumber(product.unitPrice).toFixed(2)}</td>
      <td style={{ border: '1px solid #d1d5db', padding: '4px 6px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>{product.currency} {toSafeNumber(product.amount).toFixed(2)}</td>
    </tr>
  );

  // ── 合计行 ───────────────────────────────────────────────────────────────────
  const renderSummary = () => (
    <tfoot>
      <tr style={{ background: '#f3f4f6', fontWeight: 700 }}>
        <td colSpan={6} style={{ border: '1px solid #d1d5db', padding: '5px 6px', textAlign: 'right', fontSize: 11 }}>
          Total Value ({tradeTerm}):
        </td>
        <td style={{ border: '1px solid #d1d5db', padding: '5px 6px', textAlign: 'right', fontWeight: 700, fontSize: 11 }}>
          {data.terms.currency} {total.toFixed(2)}
        </td>
      </tr>
    </tfoot>
  );

  // ── 页脚 ─────────────────────────────────────────────────────────────────────
  const PageFooter = ({ page, total: tot }: { page: number; total: number }) => (
    <div style={{ position: 'absolute', bottom: 14, right: A4_PAD_X, fontSize: 9, color: '#9ca3af', userSelect: 'none' }}>
      Page {page} of {tot}
    </div>
  );

  return (
    <div ref={ref}>
      <A4DocumentLayout>
        <PaginatedTable
          rows={data.products}
          rowHeight={PRODUCT_ROW_H}
          headerHeight={PRODUCT_HEADER_H}
          firstPageReserved={FIRST_PAGE_RESERVED}
          otherPageReserved={OTHER_PAGE_RESERVED}
          renderHeader={() => <ProductTableHeader />}
          renderRow={renderProductRow}
          renderSummary={renderSummary}
          renderPage={(tableNode, pageIndex, totalPages) => {
            const isFirst = pageIndex === 0;
            const isLast = pageIndex === totalPages - 1;

            return (
              <A4Sheet key={pageIndex}>
                <A4Body>
                  {/* 首页：文档标题 + 双方信息 */}
                  {isFirst && (
                    <>
                      <DocumentHeader />
                      <PartiesTable />
                    </>
                  )}

                  {/* 续页标题 */}
                  {!isFirst && (
                    <h3 style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, marginTop: 0 }}>
                      ARTICLE 1: PRODUCT DESCRIPTION (Continued)
                    </h3>
                  )}

                  {/* 首页产品表格标题 */}
                  {isFirst && (
                    <h3 style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, marginTop: 0 }}>
                      ARTICLE 1: PRODUCT DESCRIPTION
                    </h3>
                  )}

                  {/* 产品表格 */}
                  <div style={{ marginBottom: 8 }}>{tableNode}</div>

                  {/* 最后一页：条款 + 签名 */}
                  {isLast && (
                    <>
                      <TermsSection />
                      <SignatureSection />
                    </>
                  )}
                </A4Body>

                <PageFooter page={pageIndex + 1} total={totalPages} />
              </A4Sheet>
            );
          }}
        />
      </A4DocumentLayout>
    </div>
  );
});

SalesContractDocumentPaginated.displayName = 'SalesContractDocumentPaginated';
