import React from 'react';

import { A4_FOOTER_SAFE_HEIGHT } from './A4Page';

export interface PaginatorOptions {
  pageContentHeight?: number;
  orphanThreshold?: number;
  itemGap?: number;
}

export interface A4SectionBlock {
  type: 'section';
  key: string;
  estimatedHeight: number;
  avoidBreak?: boolean;
  render: () => React.ReactNode;
}

export interface A4TableBlock<Row = unknown> {
  type: 'table';
  key: string;
  headerHeight: number;
  rowHeight: number | ((row: Row, rowIndex: number) => number);
  rows: Row[];
  avoidBreak?: boolean;
  footerHeight?: number;
  renderHeader: () => React.ReactNode;
  renderRow: (row: Row, rowIndex: number) => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export type A4Block<Row = unknown> = A4SectionBlock | A4TableBlock<Row>;

export interface PaginatedSectionItem {
  type: 'section';
  key: string;
  render: () => React.ReactNode;
}

export interface PaginatedTableItem<Row = unknown> {
  type: 'table';
  key: string;
  rows: Row[];
  startIndex: number;
  showFooter: boolean;
  renderHeader: () => React.ReactNode;
  renderRow: (row: Row, rowIndex: number) => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export type PaginatedItem<Row = unknown> = PaginatedSectionItem | PaginatedTableItem<Row>;

export interface PaginatedPage<Row = unknown> {
  index: number;
  items: PaginatedItem<Row>[];
}

const DEFAULT_PAGE_CONTENT_HEIGHT = 1123 - 40 * 2 - A4_FOOTER_SAFE_HEIGHT;
const DEFAULT_ORPHAN_THRESHOLD = 180;

function toHeight<Row>(
  rowHeight: A4TableBlock<Row>['rowHeight'],
  row: Row,
  rowIndex: number,
): number {
  return typeof rowHeight === 'number' ? rowHeight : rowHeight(row, rowIndex);
}

export function paginateBlocks<Row = unknown>(
  blocks: A4Block<Row>[],
  options: PaginatorOptions = {},
): PaginatedPage<Row>[] {
  const pageContentHeight = options.pageContentHeight ?? DEFAULT_PAGE_CONTENT_HEIGHT;
  const orphanThreshold = options.orphanThreshold ?? DEFAULT_ORPHAN_THRESHOLD;
  const itemGap = Math.max(0, options.itemGap ?? 0);

  const pages: PaginatedPage<Row>[] = [{ index: 1, items: [] }];
  let currentPage = pages[0];
  let remainingHeight = pageContentHeight;

  const nextPage = () => {
    currentPage = { index: pages.length + 1, items: [] };
    pages.push(currentPage);
    remainingHeight = pageContentHeight;
  };

  const gapBeforeNextItem = () => (currentPage.items.length > 0 ? itemGap : 0);

  for (const block of blocks) {
    if (block.type === 'section') {
      const blockHeight = Math.max(0, block.estimatedHeight);
      const gapHeight = gapBeforeNextItem();

      if (
        currentPage.items.length > 0 &&
        (gapHeight + blockHeight > remainingHeight || (block.avoidBreak !== false && remainingHeight < orphanThreshold))
      ) {
        nextPage();
      }

      remainingHeight -= gapBeforeNextItem();
      currentPage.items.push({
        type: 'section',
        key: block.key,
        render: block.render,
      });

      remainingHeight -= blockHeight;
      continue;
    }

    const tableBlock = block;
    let rowStartIndex = 0;

    while (rowStartIndex < tableBlock.rows.length) {
      const headerHeight = tableBlock.headerHeight;
      const gapHeight = gapBeforeNextItem();
      if (currentPage.items.length > 0 && remainingHeight < gapHeight + headerHeight + 24) {
        nextPage();
      }

      remainingHeight -= gapBeforeNextItem();
      let availableAfterHeader = remainingHeight - headerHeight;
      if (availableAfterHeader <= 0) {
        nextPage();
        remainingHeight -= gapBeforeNextItem();
        availableAfterHeader = remainingHeight - headerHeight;
      }

      let consumedRowsHeight = 0;
      let rowEndIndex = rowStartIndex;

      while (rowEndIndex < tableBlock.rows.length) {
        const row = tableBlock.rows[rowEndIndex];
        const h = Math.max(1, toHeight(tableBlock.rowHeight, row, rowEndIndex));

        const isLastRow = rowEndIndex === tableBlock.rows.length - 1;
        const footerHeight =
          isLastRow && tableBlock.renderFooter
            ? Math.max(0, tableBlock.footerHeight ?? 0)
            : 0;

        if (consumedRowsHeight + h + footerHeight > availableAfterHeader) {
          break;
        }

        consumedRowsHeight += h;
        rowEndIndex += 1;
      }

      if (rowEndIndex === rowStartIndex) {
        rowEndIndex = rowStartIndex + 1;
        consumedRowsHeight = Math.max(1, toHeight(tableBlock.rowHeight, tableBlock.rows[rowStartIndex], rowStartIndex));
      }

      const showFooter = rowEndIndex >= tableBlock.rows.length;
      const footerHeight = showFooter && tableBlock.renderFooter ? Math.max(0, tableBlock.footerHeight ?? 0) : 0;

      currentPage.items.push({
        type: 'table',
        key: `${tableBlock.key}-${rowStartIndex}-${rowEndIndex}`,
        rows: tableBlock.rows.slice(rowStartIndex, rowEndIndex),
        startIndex: rowStartIndex,
        showFooter,
        renderHeader: tableBlock.renderHeader,
        renderRow: tableBlock.renderRow,
        renderFooter: tableBlock.renderFooter,
      });

      remainingHeight -= tableBlock.headerHeight + consumedRowsHeight + footerHeight;
      rowStartIndex = rowEndIndex;

      if (rowStartIndex < tableBlock.rows.length) {
        nextPage();
      }
    }
  }

  return pages.filter((page) => page.items.length > 0);
}
