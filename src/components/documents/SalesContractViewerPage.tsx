/**
 * SalesContractViewerPage — 销售合同页面级 Viewer
 *
 * ─── 架构 ──────────────────────────────────────────────────────────────────
 *
 * <SalesContractViewerPage>
 *   <ZoomToolbar />              ← 右侧固定缩放控制器
 *   <ViewerCanvas>               ← 灰色画布，overflow-y-auto，flex-1
 *     <ScaleWrapper zoom={zoom}> ← transform:scale(zoom)，仅视觉缩放
 *       <SalesContractDocumentPaginated data={data} />
 *         ↳ <A4DocumentLayout>  ← 灰色背景 + 居中
 *             <A4Sheet />        ← 794×1123px 白纸，固定高度
 *             <A4Sheet />        ← 第二页（PaginatedTable 自动分配）
 *             ...
 *           </A4DocumentLayout>
 *     </ScaleWrapper>
 *   </ViewerCanvas>
 * </SalesContractViewerPage>
 *
 * ─── 分页机制 ──────────────────────────────────────────────────────────────
 *
 * 分页由 SalesContractDocumentPaginated 内部的 PaginatedTable 完成：
 *   - 纯计算（行高常量），无 DOM 依赖
 *   - 首页预留 230px（标题+双方信息）
 *   - 后续页预留 40px（续表标题）
 *   - 最后一页底部附条款+签名（约 330px）
 *   - 每页表头自动重复
 *   - 行不被拆分
 *
 * ─── 缩放机制 ──────────────────────────────────────────────────────────────
 *
 * transform:scale(zoom) 仅用于视觉缩放：
 *   - 分页计算始终基于 100% 原始尺寸（794×1123px）
 *   - ScaleWrapper 通过 width/height 补偿 scale 缩小后的空白
 *   - 支持 50/60/70/80/90/100/120%
 *
 * ─── 打印 ──────────────────────────────────────────────────────────────────
 *
 * @media print 由 A4DocumentLayout 内部注入：
 *   - @page size: A4; margin: 0
 *   - 每个 [data-a4-sheet] break-after: page
 *   - transform:none（还原真实 A4 尺寸）
 *   - 隐藏工具栏、灰色背景
 *
 * ─── 代码位置 ──────────────────────────────────────────────────────────────
 *
 * 销售合同分页渲染：
 *   src/components/documents/SalesContractDocumentPaginated.tsx
 *     └── 使用 A4DocumentLayout + A4Sheet + PaginatedTable
 *         └── src/components/documents/a4/A4DocumentLayout.tsx
 *         └── src/components/documents/a4/PaginatedTable.tsx
 *         └── src/components/documents/a4/usePagination.ts
 *
 * 销售合同数据类型：
 *   src/components/documents/templates/SalesContractDocument.tsx
 *     └── export interface SalesContractData
 *
 * 本文件（Viewer + 缩放）：
 *   src/components/documents/SalesContractViewerPage.tsx
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { SalesContractDocumentPaginated } from './SalesContractDocumentPaginated';
import type { SalesContractData } from './templates/SalesContractDocument';

// ─── A4 基准尺寸（与 A4DocumentLayout.tsx 保持一致）─────────────────────────
const A4_W = 794;   // px @96dpi
const A4_H = 1123;  // px @96dpi

// ─── 缩放步骤 ─────────────────────────────────────────────────────────────────
const ZOOM_STEPS = [50, 60, 70, 80, 90, 100, 120] as const;
type ZoomLevel = (typeof ZOOM_STEPS)[number];

// ─── 打印时隐藏工具栏的补充样式 ──────────────────────────────────────────────
// A4DocumentLayout 已注入 @page + [data-a4-sheet] 打印样式，
// 这里只需额外隐藏 Viewer 工具栏和还原 transform:scale。
const VIEWER_PRINT_STYLE = `
@media print {
  /* 隐藏 Viewer 工具栏 */
  [data-sc-toolbar] {
    display: none !important;
  }
  /* 还原缩放（打印时不需要 scale） */
  [data-sc-scale-wrapper] {
    transform: none !important;
    width: auto !important;
    height: auto !important;
  }
  /* 画布去掉 overflow 限制 */
  [data-sc-canvas] {
    overflow: visible !important;
    height: auto !important;
    flex: none !important;
  }
}
`;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface SalesContractViewerPageProps {
  data: SalesContractData;
  /** 下载 PDF 的文件名，默认 contractNo.pdf */
  fileName?: string;
}

// ─── ZoomToolbar ─────────────────────────────────────────────────────────────
interface ZoomToolbarProps {
  zoom: ZoomLevel;
  onZoomChange: (z: ZoomLevel) => void;
  onPrint: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}

function ZoomToolbar({
  zoom,
  onZoomChange,
  onPrint,
  onDownload,
  isDownloading,
}: ZoomToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const zoomIn = () => {
    const i = ZOOM_STEPS.indexOf(zoom);
    if (i < ZOOM_STEPS.length - 1) onZoomChange(ZOOM_STEPS[i + 1]);
  };
  const zoomOut = () => {
    const i = ZOOM_STEPS.indexOf(zoom);
    if (i > 0) onZoomChange(ZOOM_STEPS[i - 1]);
  };

  return (
    <div
      data-sc-toolbar
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        overflow: 'visible',
        padding: '4px 0',
        minWidth: 44,
      }}
    >
      {/* 放大 */}
      <ToolBtn
        onClick={zoomIn}
        disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
        title="放大"
      >
        <ZoomIn style={{ width: 16, height: 16 }} />
      </ToolBtn>

      {/* 缩放百分比（点击展开下拉） */}
      <div style={{ position: 'relative', width: '100%' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width: '100%',
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid #f1f5f9',
            borderBottom: '1px solid #f1f5f9',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            color: '#374151',
            padding: '0 4px',
          }}
          title="选择缩放比例"
        >
          {zoom}%
          <ChevronDown style={{ width: 10, height: 10, color: '#9ca3af' }} />
        </button>

        {menuOpen && (
          <>
            {/* 点击外部关闭 */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                right: 'calc(100% + 8px)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                zIndex: 101,
                overflow: 'hidden',
                minWidth: 72,
              }}
            >
              {ZOOM_STEPS.map(z => (
                <button
                  key={z}
                  onClick={() => { onZoomChange(z); setMenuOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '7px 16px',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: z === zoom ? 700 : 400,
                    background: z === zoom ? '#f1f5f9' : 'transparent',
                    color: '#374151',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {z}%
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 缩小 */}
      <ToolBtn
        onClick={zoomOut}
        disabled={zoom === ZOOM_STEPS[0]}
        title="缩小"
      >
        <ZoomOut style={{ width: 16, height: 16 }} />
      </ToolBtn>

      {/* 分隔线 */}
      <div style={{ width: '80%', height: 1, background: '#f1f5f9', margin: '2px 0' }} />

      {/* 打印 */}
      <ToolBtn onClick={onPrint} title="打印">
        <Printer style={{ width: 15, height: 15 }} />
      </ToolBtn>

      {/* 下载 PDF */}
      <ToolBtn onClick={onDownload} disabled={isDownloading} title={isDownloading ? '生成中…' : '下载PDF'}>
        <Download style={{ width: 15, height: 15 }} />
      </ToolBtn>
    </div>
  );
}

// ─── 小工具按钮 ───────────────────────────────────────────────────────────────
function ToolBtn({
  children,
  onClick,
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 44,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#d1d5db' : '#374151',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s',
        borderRadius: 4,
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

// ─── ViewerCanvas ─────────────────────────────────────────────────────────────
/**
 * 灰色画布容器。
 * ScaleWrapper 内部的 A4DocumentLayout 已经是灰色背景，
 * 这里只需提供 overflow-y-auto 的滚动容器。
 */
function ViewerCanvas({
  children,
  canvasRef,
}: {
  children: React.ReactNode;
  canvasRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      data-sc-canvas
      ref={canvasRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'auto',
        background: '#525659',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
      }}
    >
      {children}
    </div>
  );
}

// ─── ScaleWrapper ─────────────────────────────────────────────────────────────
/**
 * 用 transform:scale(zoom) 实现视觉缩放。
 *
 * 原理：
 *   - A4DocumentLayout 内部宽度固定为 794px（A4_W）
 *   - scale 后视觉宽度 = 794 * zoom
 *   - 但 transform:scale 不影响文档流（元素仍占 794px 空间）
 *   - 通过设置 width = 794*zoom, height = totalH*zoom 补偿空间
 *     使滚动条正确反映缩放后的尺寸
 *
 * 注意：
 *   - 分页计算在 SalesContractDocumentPaginated 内部完成，
 *     基于 100% 原始尺寸，与 zoom 完全无关
 *   - zoom 仅影响视觉呈现
 */
function ScaleWrapper({
  zoom,
  pageCount,
  children,
}: {
  zoom: ZoomLevel;
  pageCount: number;
  children: React.ReactNode;
}) {
  const scale = zoom / 100;
  // A4DocumentLayout 的总高度 = pageCount * A4_H + (pageCount-1)*24 + 32*2 (padding)
  const layoutH = pageCount * A4_H + Math.max(0, pageCount - 1) * 24 + 64;
  const layoutW = A4_W + 48; // 左右各 24px padding

  return (
    // 外层：占据缩放后的空间，使滚动条正确
    <div
      style={{
        width: layoutW * scale,
        height: layoutH * scale,
        flexShrink: 0,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* 内层：实际内容，transform:scale 缩放 */}
      <div
        data-sc-scale-wrapper
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: layoutW,
          height: layoutH,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function SalesContractViewerPage({
  data,
  fileName,
}: SalesContractViewerPageProps) {
  const [zoom, setZoom] = useState<ZoomLevel>(80);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // ── 计算页数（与 PaginatedTable 内部逻辑一致）───────────────────────────
  // 用于 ScaleWrapper 预留正确高度
  const pageCount = usePageCount(data);

  // ── 打印 ─────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => window.print(), []);

  // ── 下载 PDF ─────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!docRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const sheets = Array.from(
        docRef.current.querySelectorAll<HTMLElement>('[data-a4-sheet]'),
      );
      if (!sheets.length) return;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      for (let i = 0; i < sheets.length; i++) {
        const canvas = await html2canvas(sheets[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
      pdf.save(fileName ?? `${data.contractNo}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, fileName, data.contractNo]);

  return (
    <>
      <style>{VIEWER_PRINT_STYLE}</style>

      {/*
       * 占满父容器高度（父容器需设 height: 100% 或 flex-1）
       * DocumentTestPage 已设 height: 100vh + flex-col
       */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* 右侧缩放工具栏（fixed 定位，不占文档流） */}
        <ZoomToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          onPrint={handlePrint}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />

        {/* 灰色画布（flex-1，可滚动） */}
        <ViewerCanvas canvasRef={canvasRef}>
          <ScaleWrapper zoom={zoom} pageCount={pageCount}>
            {/*
             * SalesContractDocumentPaginated 内部：
             *   A4DocumentLayout → 多个 A4Sheet（794×1123px）
             * 分页逻辑完全在此组件内部，与 zoom 无关
             */}
            <SalesContractDocumentPaginated data={data} ref={docRef} />
          </ScaleWrapper>
        </ViewerCanvas>
      </div>
    </>
  );
}

// ─── usePageCount：计算销售合同页数 ──────────────────────────────────────────
/**
 * 与 SalesContractDocumentPaginated 内部的 PaginatedTable 使用相同常量，
 * 纯计算，无 DOM 依赖。
 *
 * 常量来源：SalesContractDocumentPaginated.tsx
 *   PRODUCT_ROW_H    = 44
 *   PRODUCT_HEADER_H = 28
 *   FIRST_PAGE_RESERVED = 230
 *   OTHER_PAGE_RESERVED = 40
 *   LAST_PAGE_BOTTOM_H  = 330
 *   A4_BODY_H = 1043 (= 1123 - 40*2)
 */
const PRODUCT_ROW_H       = 44;
const PRODUCT_HEADER_H    = 28;
const FIRST_PAGE_RESERVED = 230;
const OTHER_PAGE_RESERVED = 40;
const LAST_PAGE_BOTTOM_H  = 330;
const A4_BODY_H           = 1043; // A4_H - A4_PAD_Y * 2

function usePageCount(data: SalesContractData): number {
  const rowCount = data.products.length;

  // 首页可放行数
  const firstPageBodyH = A4_BODY_H - FIRST_PAGE_RESERVED - PRODUCT_HEADER_H;
  const firstPageRows  = Math.max(1, Math.floor(firstPageBodyH / PRODUCT_ROW_H));

  if (rowCount <= firstPageRows) {
    // 全部行在首页，检查加上底部内容是否溢出
    const usedH = FIRST_PAGE_RESERVED + PRODUCT_HEADER_H + rowCount * PRODUCT_ROW_H + LAST_PAGE_BOTTOM_H;
    return usedH <= A4_BODY_H ? 1 : 2;
  }

  // 后续页可放行数
  const otherPageBodyH = A4_BODY_H - OTHER_PAGE_RESERVED - PRODUCT_HEADER_H;
  const otherPageRows  = Math.max(1, Math.floor(otherPageBodyH / PRODUCT_ROW_H));

  let pages = 1;
  let remaining = rowCount - firstPageRows;

  while (remaining > 0) {
    pages++;
    remaining -= otherPageRows;
  }

  // 检查最后一页是否能容纳底部内容
  const lastPageUsed = OTHER_PAGE_RESERVED + PRODUCT_HEADER_H +
    (rowCount - firstPageRows - (pages - 2) * otherPageRows) * PRODUCT_ROW_H;
  if (lastPageUsed + LAST_PAGE_BOTTOM_H > A4_BODY_H) {
    pages++;
  }

  return Math.max(1, pages);
}
