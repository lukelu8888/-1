/**
 * PaginatedTable — A4 文档专用分页表格
 *
 * 功能：
 *   - 接收完整数据行，自动按每页可用高度分组
 *   - 每页表格都重复表头（thead）
 *   - 行不被裁切（整行在同一页）
 *   - 最后一页显示合计行（可选）
 *   - 与 A4DocumentLayout + A4Sheet 配合使用
 *
 * 用法：
 *   <PaginatedTable
 *     rows={products}
 *     rowHeight={ROW_HEIGHT.TABLE_COMPACT}
 *     reservedHeight={200}       // 首页：标题+双方信息等占用高度
 *     renderHeader={() => (
 *       <thead>
 *         <tr><th>No.</th><th>Description</th>…</tr>
 *       </thead>
 *     )}
 *     renderRow={(row, i) => (
 *       <tr key={i}><td>{row.no}</td><td>{row.description}</td>…</tr>
 *     )}
 *     renderSummary={(allRows) => (
 *       <tfoot><tr><td colSpan={5}>Total: …</td></tr></tfoot>
 *     )}
 *     renderPage={(tableNode, pageIdx, totalPages) => (
 *       <A4Sheet pageNumber={pageIdx + 1} totalPages={totalPages}>
 *         {pageIdx === 0 && <DocumentHeader />}
 *         <A4Body>{tableNode}</A4Body>
 *         {pageIdx === totalPages - 1 && <SignatureBlock />}
 *       </A4Sheet>
 *     )}
 *   />
 */

import React from 'react';
import { splitRowsVariadic, ROW_HEIGHT } from './usePagination';
import { A4_BODY_H } from './A4DocumentLayout';

// ─── types ────────────────────────────────────────────────────────────────────
interface PaginatedTableProps<T> {
  /** 完整数据行 */
  rows: T[];

  /** 每行高度（px），默认 ROW_HEIGHT.TABLE_COMPACT = 22 */
  rowHeight?: number;

  /** 表头高度（px），默认 ROW_HEIGHT.TABLE_HEADER = 28 */
  headerHeight?: number;

  /**
   * 首页额外预留高度（px）。
   * 首页通常有文档标题、双方信息等，能放的行更少。
   * 默认 0（由调用方根据实际页眉高度传入）。
   */
  firstPageReserved?: number;

  /**
   * 后续页额外预留高度（px）。
   * 后续页通常只有表格，可以放更多行。
   * 默认 0。
   */
  otherPageReserved?: number;

  /** 渲染表头（每页重复） */
  renderHeader: () => React.ReactNode;

  /** 渲染单行 */
  renderRow: (row: T, index: number, pageIndex: number) => React.ReactNode;

  /**
   * 渲染合计行（仅在最后一页的表格末尾显示）。
   * 传入全部行数据，方便计算合计。
   */
  renderSummary?: (allRows: T[]) => React.ReactNode;

  /**
   * 渲染每一页的完整 A4Sheet。
   * @param tableNode   当前页的 <table> 节点
   * @param pageIndex   当前页索引（0-based）
   * @param totalPages  总页数
   * @param pageRows    当前页的数据行
   */
  renderPage: (
    tableNode: React.ReactNode,
    pageIndex: number,
    totalPages: number,
    pageRows: T[],
  ) => React.ReactNode;

  /** 表格的额外 className */
  tableClassName?: string;

  /** 表格的额外 style */
  tableStyle?: React.CSSProperties;
}

// ─── component ────────────────────────────────────────────────────────────────
export function PaginatedTable<T>({
  rows,
  rowHeight = ROW_HEIGHT.TABLE_COMPACT,
  headerHeight = ROW_HEIGHT.TABLE_HEADER,
  firstPageReserved = 0,
  otherPageReserved = 0,
  renderHeader,
  renderRow,
  renderSummary,
  renderPage,
  tableClassName = '',
  tableStyle,
}: PaginatedTableProps<T>) {
  // ── 计算每页行数 ──────────────────────────────────────────────────────────
  const firstPageRows = Math.max(
    1,
    Math.floor((A4_BODY_H - headerHeight - firstPageReserved) / rowHeight),
  );
  const otherPageRows = Math.max(
    1,
    Math.floor((A4_BODY_H - headerHeight - otherPageReserved) / rowHeight),
  );

  // ── 分组 ──────────────────────────────────────────────────────────────────
  const pages = splitRowsVariadic(rows, firstPageRows, otherPageRows);
  const totalPages = pages.length;

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <>
      {pages.map((pageRows, pageIndex) => {
        const isLastPage = pageIndex === totalPages - 1;

        const tableNode = (
          <table
            className={tableClassName}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              fontSize: 9,
              lineHeight: '1.4',
              ...tableStyle,
            }}
          >
            {/* 表头每页重复 */}
            {renderHeader()}

            <tbody>
              {pageRows.map((row, rowIndex) =>
                renderRow(row, rowIndex, pageIndex),
              )}
            </tbody>

            {/* 合计行仅在最后一页 */}
            {isLastPage && renderSummary && renderSummary(rows)}
          </table>
        );

        return (
          <React.Fragment key={pageIndex}>
            {renderPage(tableNode, pageIndex, totalPages, pageRows)}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─── SimpleA4Table ─────────────────────────────────────────────────────────
/**
 * 简化版：当整个文档只有一张表格时使用。
 * 自动处理分页，调用方只需提供列定义和数据。
 *
 * 用法：
 *   <SimpleA4Table
 *     columns={[
 *       { key: 'no', label: 'No.', width: 30 },
 *       { key: 'description', label: 'Description', width: 200 },
 *       { key: 'qty', label: 'Qty', width: 60, align: 'right' },
 *       { key: 'unitPrice', label: 'Unit Price', width: 80, align: 'right' },
 *       { key: 'amount', label: 'Amount', width: 80, align: 'right' },
 *     ]}
 *     rows={products}
 *     renderPage={(tableNode, pageIndex, totalPages) => (
 *       <A4Sheet pageNumber={pageIndex + 1} totalPages={totalPages}>
 *         <A4Body>{tableNode}</A4Body>
 *       </A4Sheet>
 *     )}
 *   />
 */
export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
}

interface SimpleA4TableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowHeight?: number;
  firstPageReserved?: number;
  otherPageReserved?: number;
  renderPage: (
    tableNode: React.ReactNode,
    pageIndex: number,
    totalPages: number,
    pageRows: T[],
  ) => React.ReactNode;
  /** 表头背景色，默认 #f3f4f6 */
  headerBg?: string;
  /** 合计行渲染（可选） */
  renderSummary?: (allRows: T[]) => React.ReactNode;
}

export function SimpleA4Table<T extends Record<string, unknown>>({
  columns,
  rows,
  rowHeight = ROW_HEIGHT.TABLE_COMPACT,
  firstPageReserved = 0,
  otherPageReserved = 0,
  renderPage,
  headerBg = '#f3f4f6',
  renderSummary,
}: SimpleA4TableProps<T>) {
  const thStyle: React.CSSProperties = {
    background: headerBg,
    border: '1px solid #d1d5db',
    padding: '4px 6px',
    fontSize: 9,
    fontWeight: 600,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    border: '1px solid #d1d5db',
    padding: '3px 6px',
    fontSize: 9,
    verticalAlign: 'top',
  };

  return (
    <PaginatedTable
      rows={rows}
      rowHeight={rowHeight}
      firstPageReserved={firstPageReserved}
      otherPageReserved={otherPageReserved}
      renderHeader={() => (
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  ...thStyle,
                  width: col.width,
                  textAlign: col.align ?? 'left',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      )}
      renderRow={(row, rowIndex) => (
        <tr
          key={rowIndex}
          style={{ background: rowIndex % 2 === 0 ? '#fff' : '#fafafa' }}
        >
          {columns.map((col) => (
            <td
              key={String(col.key)}
              style={{ ...tdStyle, textAlign: col.align ?? 'left' }}
            >
              {col.render
                ? col.render(row, rowIndex)
                : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
            </td>
          ))}
        </tr>
      )}
      renderSummary={renderSummary}
      renderPage={renderPage}
    />
  );
}
