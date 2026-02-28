/**
 * usePagination — 稳定的 A4 文档分页工具集
 *
 * 设计原则：
 *   - 纯计算，不依赖 DOM 测量（DOM 测量在 SSR/首渲染前不可用，且跨机器不稳定）
 *   - 每种内容类型有明确的"行高"常量，确保跨机器分页一致
 *   - 表格按行分配，不允许拆行
 *   - 非表格内容按"逻辑块"分配，每块有预估高度
 *
 * 核心 hook：
 *   useSplitRows<T>   — 将数组按每页最大行数分组
 *   useSplitBlocks    — 将逻辑块按每页最大高度分组
 *   calcRowsPerPage   — 根据行高计算每页能放几行
 */

import { useMemo } from 'react';
import { A4_BODY_H } from './A4DocumentLayout';

// ─── 常用行高常量（px，@96dpi，与 CSS font-size 对应）────────────────────────
export const ROW_HEIGHT = {
  /** 紧凑表格行（font-size: 9-10pt，line-height: 1.4，含 padding） */
  TABLE_COMPACT:  22,
  /** 标准表格行（font-size: 10pt，含 padding） */
  TABLE_STANDARD: 28,
  /** 带图片的表格行（含产品图缩略图，高度约 40px） */
  TABLE_WITH_IMG: 44,
  /** 表头行 */
  TABLE_HEADER:   28,
  /** 普通文本段落（单行） */
  TEXT_LINE:      18,
  /** 小节标题（h3 级别） */
  SECTION_TITLE:  28,
  /** 签名区域（固定高度块） */
  SIGNATURE:     100,
} as const;

// ─── 逻辑块类型 ───────────────────────────────────────────────────────────────
export interface ContentBlock {
  /** 唯一 key，用于 React key */
  key: string;
  /** 预估高度（px） */
  height: number;
  /** 是否禁止跨页拆分（整块必须在同一页） */
  avoidBreak?: boolean;
  /** 实际内容（由调用方传入，分页后原样渲染） */
  content: React.ReactNode;
}

// ─── useSplitRows ─────────────────────────────────────────────────────────────
/**
 * 将数据行数组按每页最大行数分组。
 *
 * @param rows        数据行数组
 * @param rowHeight   每行高度（px），使用 ROW_HEIGHT 常量
 * @param headerHeight 表头高度（px），每页都要预留
 * @param reservedHeight 每页额外预留高度（页眉、页脚、合计行等）
 * @returns           二维数组，每个子数组对应一页的行
 *
 * @example
 * const pages = useSplitRows(products, ROW_HEIGHT.TABLE_COMPACT, 28, 120);
 * // pages[0] = 第一页的产品行，pages[1] = 第二页的产品行，…
 */
export function useSplitRows<T>(
  rows: T[],
  rowHeight: number = ROW_HEIGHT.TABLE_COMPACT,
  headerHeight: number = ROW_HEIGHT.TABLE_HEADER,
  reservedHeight: number = 0,
): T[][] {
  return useMemo(() => {
    if (!rows.length) return [[]];
    const usableH = A4_BODY_H - headerHeight - reservedHeight;
    const rowsPerPage = Math.max(1, Math.floor(usableH / rowHeight));
    const pages: T[][] = [];
    for (let i = 0; i < rows.length; i += rowsPerPage) {
      pages.push(rows.slice(i, i + rowsPerPage));
    }
    return pages;
  }, [rows, rowHeight, headerHeight, reservedHeight]);
}

// ─── calcRowsPerPage（非 hook 版，用于静态计算）───────────────────────────────
/**
 * 计算每页能放几行数据（不依赖 React，可在组件外调用）。
 */
export function calcRowsPerPage(
  rowHeight: number,
  headerHeight: number = ROW_HEIGHT.TABLE_HEADER,
  reservedHeight: number = 0,
): number {
  const usableH = A4_BODY_H - headerHeight - reservedHeight;
  return Math.max(1, Math.floor(usableH / rowHeight));
}

// ─── splitRows（非 hook 版）───────────────────────────────────────────────────
/**
 * 纯函数版 splitRows，可在 useMemo 外部调用。
 */
export function splitRows<T>(
  rows: T[],
  rowHeight: number = ROW_HEIGHT.TABLE_COMPACT,
  headerHeight: number = ROW_HEIGHT.TABLE_HEADER,
  reservedHeight: number = 0,
): T[][] {
  if (!rows.length) return [[]];
  const rowsPerPage = calcRowsPerPage(rowHeight, headerHeight, reservedHeight);
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }
  return pages;
}

// ─── useSplitBlocks ───────────────────────────────────────────────────────────
/**
 * 将任意逻辑块按每页可用高度分组。
 * 支持 avoidBreak：整块不跨页（若单块超过一页则单独成页）。
 *
 * @param blocks  逻辑块数组（每块含 height + content）
 * @returns       二维数组，每个子数组对应一页的块列表
 *
 * @example
 * const blocks: ContentBlock[] = [
 *   { key: 'header', height: 80, content: <Header /> },
 *   { key: 'table', height: 600, content: <Table /> },
 *   { key: 'sig', height: 100, avoidBreak: true, content: <Sig /> },
 * ];
 * const pages = useSplitBlocks(blocks);
 */
export function useSplitBlocks(blocks: ContentBlock[]): ContentBlock[][] {
  return useMemo(() => splitBlocks(blocks), [blocks]);
}

export function splitBlocks(blocks: ContentBlock[]): ContentBlock[][] {
  if (!blocks.length) return [[]];

  const pages: ContentBlock[][] = [];
  let currentPage: ContentBlock[] = [];
  let usedH = 0;

  for (const block of blocks) {
    const blockH = block.height;

    // 如果当前页已有内容，且加入此块会超出，则换页
    const wouldOverflow = usedH + blockH > A4_BODY_H;

    if (wouldOverflow && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      usedH = 0;
    }

    currentPage.push(block);
    usedH += blockH;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

// ─── 辅助：计算表格分页的第一页行数（首页可能有额外页眉占用高度）────────────
/**
 * 首页通常有文档标题、双方信息等占用额外高度，第一页能放的行数可能更少。
 *
 * @param firstPageReserved  首页额外预留高度（px）
 * @param otherPageReserved  后续页额外预留高度（px）
 * @param rowHeight          行高
 * @param headerHeight       表头高度
 */
export function calcSplitConfig(
  firstPageReserved: number,
  otherPageReserved: number,
  rowHeight: number = ROW_HEIGHT.TABLE_COMPACT,
  headerHeight: number = ROW_HEIGHT.TABLE_HEADER,
): { firstPageRows: number; otherPageRows: number } {
  return {
    firstPageRows: calcRowsPerPage(rowHeight, headerHeight, firstPageReserved),
    otherPageRows: calcRowsPerPage(rowHeight, headerHeight, otherPageReserved),
  };
}

/**
 * 将行数组按首页/后续页不同容量分组。
 */
export function splitRowsVariadic<T>(
  rows: T[],
  firstPageRows: number,
  otherPageRows: number,
): T[][] {
  if (!rows.length) return [[]];
  const pages: T[][] = [];
  let remaining = rows;

  // 首页
  pages.push(remaining.slice(0, firstPageRows));
  remaining = remaining.slice(firstPageRows);

  // 后续页
  while (remaining.length > 0) {
    pages.push(remaining.slice(0, otherPageRows));
    remaining = remaining.slice(otherPageRows);
  }

  return pages;
}
