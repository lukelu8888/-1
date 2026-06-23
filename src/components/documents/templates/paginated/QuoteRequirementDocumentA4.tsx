import React, { useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4Page, A4_FOOTER_SAFE_HEIGHT, A4_HEIGHT_PX, A4_PAD_V } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import {
  QuoteRequirementDocumentData,
  buildDefaultQuoteRequirementTextOverrides,
  type QuoteRequirementTextOverrides,
} from '../QuoteRequirementDocument';

interface QuoteRequirementDocumentA4PagesProps {
  data: QuoteRequirementDocumentData;
  textOverrides?: QuoteRequirementTextOverrides;
  showRelationBanner?: boolean;
}

const QR_FOOTER_RESERVED_HEIGHT = 64;
const QR_PAGE_CONTENT_HEIGHT = A4_HEIGHT_PX - A4_PAD_V * 2 - A4_FOOTER_SAFE_HEIGHT;
const QR_SIGNATURE_ESTIMATED_HEIGHT = 176;
const QR_SIGNATURE_SECTION_GAP = 18;
const tableClass = 'w-full table-fixed border-separate border-spacing-0 border border-gray-300 text-xs';
const cellClass = 'border border-gray-300 px-2 py-2 align-top';
const titleClass = 'font-bold text-base mb-2';
const BOX_LINES_PER_PAGE = 10;

function formatDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-');
}

function getCurrencySymbol(currency?: string) {
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  if (currency === 'CNY') return '¥';
  return currency || '¥';
}

function resolveDocumentCurrency(products: QuoteRequirementDocumentData['products']) {
  const resolvedCode =
    products.find((product) => String(product.currency || '').trim())?.currency?.toUpperCase() || 'USD';
  return {
    code: resolvedCode,
    symbol: getCurrencySymbol(resolvedCode),
  };
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  const safe = text || '';
  return safe
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, lineCount) => sum + lineCount, 0);
}

function normalizeDocumentText(value?: string | number | null) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function buildProductDisplayText(product: QuoteRequirementDocumentData['products'][number]) {
  const rawName = normalizeDocumentText(product.productName);
  const rawSpecification = normalizeDocumentText(product.specification);
  const displayName = rawName.split(/[;；]/)[0]?.trim() || rawName || '-';
  let displaySpecification = rawSpecification;

  if (displaySpecification && rawName && displaySpecification.startsWith(rawName)) {
    displaySpecification = displaySpecification.slice(rawName.length).replace(/^[\s;；,，:：-]+/, '').trim();
  }

  if (displaySpecification && displayName && displaySpecification.startsWith(displayName)) {
    displaySpecification = displaySpecification.slice(displayName.length).replace(/^[\s;；,，:：-]+/, '').trim();
  }

  return {
    productName: displayName,
    specification: displaySpecification,
  };
}

function splitTextIntoChunks(text: string, maxCharsPerLine: number, maxLinesPerChunk: number) {
  const paragraphs = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [''];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLines = 0;

  paragraphs.forEach((paragraph) => {
    const lines = Math.max(1, Math.ceil(paragraph.length / maxCharsPerLine));
    if (currentChunk.length > 0 && currentLines + lines > maxLinesPerChunk) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
      currentLines = 0;
    }

    currentChunk.push(paragraph);
    currentLines += lines;
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

function splitTextIntoCompactChunks(text: string, maxCharsPerLine: number, maxLinesPerChunk: number) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [''];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLines = 0;

  lines.forEach((line) => {
    const wrappedLines = Math.max(1, Math.ceil(line.length / maxCharsPerLine));
    if (currentChunk.length > 0 && currentLines + wrappedLines > maxLinesPerChunk) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
      currentLines = 0;
    }

    currentChunk.push(line);
    currentLines += wrappedLines;
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

function buildTextSectionBlocks(
  key: string,
  title: string,
  text: string,
  placeholder: string,
  emptyClassName: string,
  options?: {
    maxCharsPerLine?: number;
    maxLinesPerChunk?: number;
    minHeightPx?: number;
    lineHeightPx?: number;
    boxClassName?: string;
  },
) {
  const content = text?.trim() || '';
  const maxCharsPerLine = options?.maxCharsPerLine || 32;
  const maxLinesPerChunk = options?.maxLinesPerChunk || BOX_LINES_PER_PAGE;
  const minHeightPx = options?.minHeightPx || 140;
  const lineHeightPx = options?.lineHeightPx || 22;
  const boxClassName =
    options?.boxClassName ||
    'border border-gray-300 rounded p-4 bg-blue-50 text-xs text-left min-h-[140px] whitespace-pre-wrap break-words leading-7';
  const chunks = splitTextIntoCompactChunks(content || placeholder, maxCharsPerLine, maxLinesPerChunk);

  return chunks.map<A4Block>((chunk, index) => ({
    type: 'section',
    key: `${key}-${index}`,
    estimatedHeight: Math.max(minHeightPx, 42 + estimateWrappedLines(chunk, maxCharsPerLine) * lineHeightPx),
    avoidBreak: options?.minHeightPx ? false : undefined,
    render: () => (
      <section>
        <h3 className={titleClass}>
          {title}
          {index > 0 ? '（续）' : ''}
        </h3>
        <div className={boxClassName}>
          {content ? (
            chunk
          ) : (
            <div className={emptyClassName}>{placeholder}</div>
          )}
        </div>
      </section>
    ),
  }));
}

function buildProductRowHeight(product: QuoteRequirementDocumentData['products'][number]) {
  const displayText = buildProductDisplayText(product);
  const specificationLines = estimateWrappedLines(displayText.specification || '', 34);
  const metaLines = (product.moq ? 1 : 0) + (product.leadTime ? 1 : 0);
  return Math.max(64, 30 + specificationLines * 15 + metaLines * 16);
}

function estimatePageItemHeight(
  item: ReturnType<typeof paginateBlocks>[number]['items'][number],
  blocks: A4Block<QuoteRequirementDocumentData['products'][number]>[],
) {
  if (item.type === 'section') {
    const sectionBlock = blocks.find((block): block is Extract<typeof block, { type: 'section' }> => {
      return block.type === 'section' && block.key === item.key;
    });
    return sectionBlock?.estimatedHeight ?? 0;
  }

  const tableBlock = blocks.find((block): block is Extract<typeof block, { type: 'table' }> => {
    return block.type === 'table' && item.key.startsWith(`${block.key}-`);
  });

  if (!tableBlock) {
    return 0;
  }

  const rowsHeight = item.rows.reduce((sum, row, rowIndex) => {
    const globalIndex = item.startIndex + rowIndex;
    const height =
      typeof tableBlock.rowHeight === 'number'
        ? tableBlock.rowHeight
        : tableBlock.rowHeight(row, globalIndex);
    return sum + Math.max(1, height);
  }, 0);

  const footerHeight = item.showFooter && tableBlock.renderFooter ? Math.max(0, tableBlock.footerHeight ?? 0) : 0;
  return tableBlock.headerHeight + rowsHeight + footerHeight;
}

function estimateRemainingHeight(
  page: ReturnType<typeof paginateBlocks>[number],
  blocks: A4Block<QuoteRequirementDocumentData['products'][number]>[],
  pageContentHeight: number,
) {
  const usedHeight = page.items.reduce((sum, item) => sum + estimatePageItemHeight(item, blocks), 0);
  return pageContentHeight - usedHeight;
}

function appendSectionWithFlow(
  pages: ReturnType<typeof paginateBlocks>,
  section: Extract<A4Block<QuoteRequirementDocumentData['products'][number]>, { type: 'section' }>,
  blocks: A4Block<QuoteRequirementDocumentData['products'][number]>[],
  pageContentHeight: number,
  minGap = 24,
) {
  let currentPage = pages[pages.length - 1];
  const remainingHeight = estimateRemainingHeight(currentPage, blocks, pageContentHeight);

  if (currentPage.items.length > 0 && section.estimatedHeight + minGap > remainingHeight) {
    currentPage = { index: pages.length + 1, items: [] };
    pages.push(currentPage);
  }

  currentPage.items.push({
    type: 'section',
    key: section.key,
    render: section.render,
  });
}

export function buildQuoteRequirementPages(
  data: QuoteRequirementDocumentData,
  textOverrides?: QuoteRequirementTextOverrides,
  showRelationBanner = true,
): React.ReactNode[] {
  const texts = {
    ...buildDefaultQuoteRequirementTextOverrides(data),
    ...(textOverrides || {}),
  };
  const urgencyConfig = {
    low: { label: '普通', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    medium: { label: '一般', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    high: { label: '紧急', color: 'text-red-600', bgColor: 'bg-red-100' },
  };
  const urgencyInfo = urgencyConfig[data.urgency];
  const documentCurrency = resolveDocumentCurrency(data.products);
  const blocks: A4Block<QuoteRequirementDocumentData['products'][number]>[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 176,
      avoidBreak: true,
      render: () => (
        <div className="mb-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-[70px] w-[80px] items-center">
              <img
                src={cosunLogo}
                alt="THE COSUN Logo"
                className="h-auto max-h-full w-full"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold tracking-wider text-black">{texts.documentTitle}</h1>
              <p className="mt-1 text-sm text-gray-600">{texts.documentTitleEn}</p>
            </div>
            <div className="w-[210px]">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">单据编号</td>
                    <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.requirementNo}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">创建日期</td>
                    <td className="border border-gray-400 px-1.5 py-0.5">{formatDate(data.requirementDate)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">回复截止</td>
                    <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-orange-600">{formatDate(data.requiredResponseDate)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold whitespace-nowrap">要求交期</td>
                    <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">{formatDate(data.requiredDeliveryDate)}</td>
                  </tr>
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
      key: 'base-info',
      estimatedHeight: 126,
      avoidBreak: true,
      render: () => (
        <div className="mb-1">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-0 align-top w-1/2">
                  <div className="border-b border-gray-400 bg-gray-200 px-2 py-1 font-bold">{texts.customerSectionTitle}</div>
                  <div className="space-y-0.5 px-2 py-1.5">
                    <div><span className="text-gray-600">{texts.customerRegionLabel}</span>{data.customer.region}</div>
                    <div className="mt-2 border-t border-gray-300 pt-2 text-xs leading-relaxed text-gray-600">
                      {texts.customerIntroText}
                    </div>
                  </div>
                </td>
                <td className="border border-gray-400 p-0 align-top w-1/2">
                  <div className="border-b border-gray-400 bg-gray-200 px-2 py-1 font-bold">{texts.creatorSectionTitle}</div>
                  <div className="space-y-0.5 px-2 py-1.5">
                    <div><span className="text-gray-600">{texts.creatorRoleLabel}</span><span className="font-semibold">{data.createdBy}</span></div>
                    <div><span className="text-gray-600">{texts.creatorDepartmentLabel}</span>{texts.creatorDepartmentValue}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      type: 'section',
      key: 'products-title',
      estimatedHeight: 34,
      avoidBreak: true,
      render: () => <h3 className={titleClass}>{texts.productsSectionTitle}</h3>,
    },
    {
      type: 'table',
      key: 'products',
      headerHeight: 68,
      rowHeight: (product) => buildProductRowHeight(product),
      footerHeight: 34,
      rows: data.products,
      renderHeader: () => (
        <>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left w-8">{texts.tableHeaderIndex}</th>
              <th className="border border-gray-300 px-2 py-2 text-left w-20">{texts.tableHeaderModel}</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-16">{texts.tableHeaderImage}</th>
              <th className="border border-gray-300 px-2 py-2 text-left">{texts.tableHeaderProduct}</th>
              <th className="border border-gray-300 px-2 py-2 text-right w-16">{texts.tableHeaderQuantity}</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-10">{texts.tableHeaderUnit}</th>
              <th className="border border-gray-300 px-2 py-2 text-right w-20">{texts.tableHeaderUnitPrice}</th>
              <th className="border border-gray-300 px-2 py-2 text-right w-20">{texts.tableHeaderTotalPrice}</th>
            </tr>
          </thead>
        </>
      ),
      renderRow: (product, index) => {
        const totalPrice = product.totalPrice || (product.unitPrice ? product.quantity * product.unitPrice : 0);
        const currencySymbol = getCurrencySymbol(product.currency);
        const displayText = buildProductDisplayText(product);

        return (
          <tr key={`${product.no}-${index}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <td className={`${cellClass} text-center`}>{product.no}</td>
            <td className={`${cellClass} text-gray-700`}>{product.modelNo || '-'}</td>
            <td className={`${cellClass} px-1 py-1 text-center`}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="mx-auto h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                  无图
                </div>
              )}
            </td>
            <td className={cellClass}>
              <div className="font-semibold break-words">{displayText.productName}</div>
              {displayText.specification ? (
                <div className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-4 text-gray-600">
                  {displayText.specification}
                </div>
              ) : null}
              {(product.moq || product.leadTime) && (
                <div className="mt-1 space-y-0.5 text-xs text-blue-600">
                  {product.moq && <div>MOQ: {product.moq} {product.unit}</div>}
                  {product.leadTime && <div>交期: {product.leadTime}</div>}
                </div>
              )}
            </td>
            <td className={`${cellClass} text-right font-semibold`}>{product.quantity.toLocaleString()}</td>
            <td className={`${cellClass} text-center`}>{product.unit}</td>
            <td className={`${cellClass} text-right text-blue-600`}>
              {product.unitPrice ? `${currencySymbol}${product.unitPrice.toFixed(2)}` : '-'}
            </td>
            <td className={`${cellClass} text-right font-semibold text-blue-600`}>
              {totalPrice > 0 ? `${currencySymbol}${totalPrice.toFixed(2)}` : '-'}
            </td>
          </tr>
        );
      },
      renderFooter: () => {
        const total = data.products.reduce((sum, p) => {
          const itemTotal = p.totalPrice || (p.unitPrice ? p.quantity * p.unitPrice : 0);
          return sum + itemTotal;
        }, 0);

        return (
          <tr className="bg-gray-50 font-bold">
            <td colSpan={4} className="border-2 border-gray-400 px-2 py-2 text-right">{texts.tableTotalLabel}</td>
            <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600">
              {data.products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
            </td>
            <td className="border-2 border-gray-400 px-2 py-2" />
            <td className="border-2 border-gray-400 px-2 py-2" />
            <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600">
              {total > 0 ? `${documentCurrency.symbol}${total.toFixed(2)}` : '-'}
            </td>
          </tr>
        );
      },
    },
    ...buildTextSectionBlocks(
      'sales-notes',
      texts.salesInstructionsTitle,
      data.salesDeptNotes || '',
      [
        texts.salesFallbackNote1,
        texts.salesFallbackNote2,
        texts.salesFallbackNote3,
        texts.salesFallbackNote4,
        texts.salesFallbackNote5,
      ].join('\n'),
      'space-y-1',
      {
        maxCharsPerLine: 46,
        maxLinesPerChunk: 8,
        minHeightPx: 72,
        lineHeightPx: 18,
        boxClassName:
          'border border-gray-300 rounded p-3 bg-blue-50 text-xs text-left whitespace-pre-wrap break-words leading-6',
      },
    ),
    ...buildTextSectionBlocks(
      'purchase-feedback-section',
      texts.purchaseFeedbackTitle,
      data.purchaseDeptFeedback || '',
      texts.purchaseFeedbackPlaceholder,
      'text-gray-400 italic',
      {
        maxCharsPerLine: 46,
        maxLinesPerChunk: 8,
        minHeightPx: 64,
        lineHeightPx: 20,
        boxClassName:
          'border border-gray-300 rounded p-2 bg-blue-50 text-xs text-left whitespace-pre-wrap break-words leading-5',
      },
    ),
    {
      type: 'section',
      key: 'signatures-footer-section',
      estimatedHeight: QR_SIGNATURE_ESTIMATED_HEIGHT,
      avoidBreak: true,
      render: () => (
        <div className="signature-section mt-1 pb-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="mb-1 text-sm font-bold">{texts.salesSignatureTitle}</h4>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{data.createdBy}</p>
                <div className="mt-1 border-b border-gray-400 pb-0.5">
                  <p className="text-xs text-gray-600">{texts.signLabel}</p>
                </div>
                <p className="text-xs text-gray-600">{texts.dateLabel}{formatDate(data.requirementDate)}</p>
              </div>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-bold">{texts.procurementSignatureTitle}</h4>
              <div className="space-y-1 text-xs">
                <p className="text-gray-500">{texts.procurementOfficerPlaceholder}</p>
                <div className="mt-1 border-b border-gray-400 pb-0.5">
                  <p className="text-xs text-gray-600">{texts.signLabel}</p>
                </div>
                <p className="text-xs text-gray-600">{texts.dateLabel}_____________</p>
              </div>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-bold">{texts.managerSignatureTitle}</h4>
              <div className="space-y-1 text-xs">
                <p className="text-gray-500">{texts.managerPlaceholder}</p>
                <div className="mt-1 border-b border-gray-400 pb-0.5">
                  <p className="text-xs text-gray-600">{texts.signLabel}</p>
                </div>
                <p className="text-xs text-gray-600">{texts.dateLabel}_____________</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (showRelationBanner) {
    blocks.splice(1, 0, {
      type: 'section',
      key: 'relation',
      estimatedHeight: 50,
      avoidBreak: true,
      render: () => (
        <div className="mb-1 flex items-center justify-between rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
          <div>
            <span className="text-gray-600">{texts.sourceInquiryLabel}</span>
            <span className="ml-1 font-bold text-blue-600">{data.sourceInquiryNo}</span>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyInfo.bgColor} ${urgencyInfo.color}`}>
            {texts.urgencyPrefix}
            {urgencyInfo.label}
          </div>
        </div>
      ),
    });
  }
  const feedbackBlocks = blocks.filter(
    (block): block is Extract<typeof block, { type: 'section' }> =>
      block.type === 'section' && block.key.startsWith('purchase-feedback-section-'),
  );
  const signaturesBlock = blocks.find(
    (block): block is Extract<typeof block, { type: 'section' }> =>
      block.type === 'section' && block.key === 'signatures-footer-section',
  );
  const mainBlocks = blocks.filter((block) => {
    return !block.key.startsWith('purchase-feedback-section-') && block.key !== 'signatures-footer-section';
  });

  const pages = paginateBlocks(mainBlocks, {
    pageContentHeight: QR_PAGE_CONTENT_HEIGHT,
    orphanThreshold: 112,
  });

  feedbackBlocks.forEach((feedbackBlock, index) => {
    appendSectionWithFlow(pages, feedbackBlock, blocks, QR_PAGE_CONTENT_HEIGHT, index === 0 ? 18 : 10);
  });

  if (signaturesBlock) {
    appendSectionWithFlow(pages, signaturesBlock, blocks, QR_PAGE_CONTENT_HEIGHT, QR_SIGNATURE_SECTION_GAP);
  }

  return pages.map((page, pageIndex) => (
    <div className="flex h-full flex-col gap-4 text-[12px] leading-6" key={`qr-page-${pageIndex}`}>
      {page.items.map((item) => {
        if (item.type === 'section') {
          return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        }

        return (
          <table key={item.key} className={tableClass}>
            {item.renderHeader()}
            <tbody>
              {item.rows.map((row, rowIndex) => item.renderRow(row, item.startIndex + rowIndex))}
              {item.showFooter && item.renderFooter?.()}
            </tbody>
          </table>
        );
      })}
    </div>
  ));
}

export function QuoteRequirementDocumentA4Pages({
  data,
  textOverrides,
  showRelationBanner = true,
}: QuoteRequirementDocumentA4PagesProps) {
  const pages = useMemo(
    () => buildQuoteRequirementPages(data, textOverrides, showRelationBanner),
    [data, textOverrides, showRelationBanner],
  );
  const texts = useMemo(
    () => ({
      ...buildDefaultQuoteRequirementTextOverrides(data),
      ...(textOverrides || {}),
    }),
    [data, textOverrides],
  );
  const footerLines = [texts.footerNote1, texts.footerNote2, texts.footerNote3].filter(Boolean);

  return (
    <>
      {pages.map((page, index) => (
        <A4Page
          key={`qr-a4-page-${index}`}
          pageNumber={index + 1}
          totalPages={pages.length}
          footerReservedHeight={index === pages.length - 1 && footerLines.length > 0 ? QR_FOOTER_RESERVED_HEIGHT : undefined}
          footer={
            index === pages.length - 1 && footerLines.length > 0 ? (
              <div className="relative">
                <div className="border-t border-gray-300 pt-2 text-center text-[10px] text-gray-600">
                  {footerLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: -2,
                    fontSize: 11,
                    color: '#9ca3af',
                    userSelect: 'none',
                  }}
                >
                  {`${index + 1} / ${pages.length}`}
                </div>
              </div>
            ) : undefined
          }
        >
          {page}
        </A4Page>
      ))}
    </>
  );
}
