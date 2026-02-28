/**
 * A4 文档架构统一出口
 *
 * 使用方式：
 *   import { A4DocumentLayout, A4Sheet, A4Body, A4Header, A4Footer,
 *            PaginatedTable, SimpleA4Table,
 *            useSplitRows, useSplitBlocks, splitRows, splitBlocks,
 *            calcRowsPerPage, calcSplitConfig, splitRowsVariadic,
 *            ROW_HEIGHT, A4_W, A4_H, A4_BODY_H, A4_BODY_W, A4_PAD_X, A4_PAD_Y
 *          } from '../a4';
 */

// ── 布局组件 ──────────────────────────────────────────────────────────────────
export {
  A4DocumentLayout,
  A4Sheet,
  A4Body,
  A4Header,
  A4Footer,
  // 常量
  A4_W,
  A4_H,
  A4_PAD_X,
  A4_PAD_Y,
  A4_BODY_H,
  A4_BODY_W,
} from './A4DocumentLayout';

// ── 分页工具 ──────────────────────────────────────────────────────────────────
export {
  ROW_HEIGHT,
  useSplitRows,
  useSplitBlocks,
  splitRows,
  splitBlocks,
  calcRowsPerPage,
  calcSplitConfig,
  splitRowsVariadic,
} from './usePagination';
export type { ContentBlock } from './usePagination';

// ── 分页表格组件 ──────────────────────────────────────────────────────────────
export { PaginatedTable, SimpleA4Table } from './PaginatedTable';
export type { ColumnDef } from './PaginatedTable';

// ── 旧版 A4Page（向后兼容）────────────────────────────────────────────────────
export { A4Page, A4_WIDTH_PX, A4_HEIGHT_PX } from './A4Page';
