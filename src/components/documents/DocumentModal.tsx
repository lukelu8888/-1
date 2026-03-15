/**
 * DocumentModal – Professional enterprise A4 document preview modal
 *
 * Features:
 *  • Draggable header bar (viewport-clamped, no text-select during drag)
 *  • Internal scroll for the document area only
 *  • Zoom: 60 / 80 / 100% via CSS transform:scale (does NOT affect pagination)
 *  • Page-gap between A4 pages, consistent shadow
 *  • Responsive: full-screen on small viewports (< 768px)
 *  • Esc to close; optional backdrop click to close
 *  • Print / Download PDF via existing infrastructure
 *  • Slot-based action buttons (onEdit, onSubmit, etc.)
 *
 * Usage:
 *   <DocumentModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="报价单文档"
 *     subtitle="BJ-260227-0001"
 *     pages={[<YourPage1 />, <YourPage2 />]}
 *     actions={<YourButtons />}
 *     fileName="quotation.pdf"
 *   />
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Download,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/button';
import { A4_HEIGHT_PX } from './a4/A4Page';

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_MIN_ZOOM = 60;
const DEFAULT_MAX_ZOOM = 100;
const DEFAULT_ZOOM_STEP = 20;
const DEFAULT_ZOOM = 80;

// Safe margin from viewport edges (px)
const DEFAULT_VIEWPORT_SAFE = 24;

// ─── types ────────────────────────────────────────────────────────────────────
export interface DocumentModalProps {
  open: boolean;
  onClose: () => void;

  /** Heading shown in the drag bar */
  title?: string;
  /** Sub-label (document number, status badge, etc.) */
  subtitle?: React.ReactNode;

  /**
   * Array of React nodes – each item = one A4 page content.
   * The modal wraps each in a white A4-sized box with shadow.
   */
  pages: React.ReactNode[];

  /** Extra action buttons rendered in the toolbar (Edit, Submit, etc.) */
  actions?: React.ReactNode;

  /** File name for downloaded PDF */
  fileName?: string;

  /** Close when clicking the backdrop (default: true) */
  closeOnBackdrop?: boolean;

  /** Initial zoom percentage for the text layer */
  defaultZoom?: number;

  /** Minimum zoom percentage */
  minZoom?: number;

  /** Maximum zoom percentage */
  maxZoom?: number;

  /** Zoom step percentage */
  zoomStep?: number;

  /**
   * Shell width anchor. When set, the modal width stays sized for this zoom
   * while the document pages continue to zoom independently inside the viewport.
   */
  shellZoom?: number;

  /** Fixed top offset in px. Useful when the preview should stay near the top. */
  topOffset?: number;

  /** Safe viewport margin in px */
  viewportSafe?: number;

  /** Visual shell style */
  variant?: 'default' | 'template-center';

  /** Whether pages are already fully-rendered A4 documents */
  pageRenderMode?: 'wrapped' | 'raw';
}

// ─── helper: clamp drag position to viewport ─────────────────────────────────
function clampPosition(
  x: number,
  y: number,
  modalW: number,
  modalH: number,
  viewportSafe: number,
): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.max(viewportSafe, Math.min(x, vw - modalW - viewportSafe)),
    y: Math.max(viewportSafe, Math.min(y, vh - modalH - viewportSafe)),
  };
}

function clampOffsetFromAnchor(
  x: number,
  y: number,
  modalW: number,
  modalH: number,
  anchorTop: number,
  viewportSafe: number,
): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const baseLeft = (vw - modalW) / 2;

  return {
    x: Math.max(
      viewportSafe - baseLeft,
      Math.min(x, vw - modalW - viewportSafe - baseLeft),
    ),
    y: Math.max(
      viewportSafe - anchorTop,
      Math.min(y, vh - modalH - viewportSafe - anchorTop),
    ),
  };
}

// ─── A4 page wrapper (rendered inside the scrollable preview area) ─────────────
const A4PageWrapper: React.FC<{
  index: number;
  total: number;
  zoom: number;
  children: React.ReactNode;
}> = ({ index, total, zoom, children }) => {
  const scale = zoom / 100;
  // The wrapper must occupy the scaled height so scroll works correctly
  const scaledH = A4_HEIGHT_PX * scale;
  const scaledW = 794 * scale;

  return (
    <div
      style={{
        width: scaledW,
        height: scaledH,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: 794,
          height: A4_HEIGHT_PX,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* A4 sheet */}
        <div
          data-a4-page
          style={{
            width: 794,
            height: A4_HEIGHT_PX,
            background: '#fff',
            boxSizing: 'border-box',
            padding: '40px 48px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow:
              '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.10)',
          }}
        >
          {children}
          {/* Page number */}
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 48,
              fontSize: 11,
              color: '#9ca3af',
              userSelect: 'none',
            }}
          >
            {index + 1} / {total}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
export function DocumentModal({
  open,
  onClose,
  title = '文档预览',
  subtitle,
  pages,
  actions,
  fileName = `document_${Date.now()}.pdf`,
  closeOnBackdrop = true,
  defaultZoom = DEFAULT_ZOOM,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  zoomStep = DEFAULT_ZOOM_STEP,
  shellZoom,
  topOffset,
  viewportSafe = DEFAULT_VIEWPORT_SAFE,
  variant = 'default',
  pageRenderMode = 'wrapped',
}: DocumentModalProps) {
  const clampZoom = useCallback(
    (value: number) => Math.max(minZoom, Math.min(value, maxZoom)),
    [maxZoom, minZoom],
  );

  // ── zoom ──────────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState<number>(() => clampZoom(defaultZoom));
  const zoomIn = () => setZoom((current) => clampZoom(current + zoomStep));
  const zoomOut = () => setZoom((current) => clampZoom(current - zoomStep));

  // ── modal dimensions ──────────────────────────────────────────────────────
  // Modal width = A4 scaled width + horizontal chrome
  const shellScale = (shellZoom ?? zoom) / 100;
  const scaledW = useMemo(() => Math.round(794 * shellScale), [shellScale]);
  const MODAL_CHROME_H = 56; // toolbar height px
  const MODAL_W = Math.max(scaledW + 64, 680); // 32px side padding each

  // ── drag state ────────────────────────────────────────────────────────────
  const modalRef   = useRef<HTMLDivElement>(null);
  const dragRef    = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Centre on first open
  useEffect(() => {
    if (!open) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const modalH = Math.min(vh - viewportSafe * 2, 900);

    if (variant === 'template-center') {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    if (topOffset !== undefined || !pos) {
      setPos({
        x: Math.max(viewportSafe, (vw - MODAL_W) / 2),
        y: topOffset ?? Math.max(viewportSafe, (vh - modalH) / 2),
      });
    }
  }, [MODAL_W, open, pos, topOffset, variant, viewportSafe]);

  // Re-centre when zoom changes to avoid escaping viewport
  useEffect(() => {
    const el = modalRef.current;
    const modalH = el ? el.offsetHeight : 900;
    if (!open) return;

    if (variant === 'template-center') {
      const anchorTop = topOffset ?? viewportSafe;
      setDragOffset((current) =>
        clampOffsetFromAnchor(current.x, current.y, MODAL_W, modalH, anchorTop, viewportSafe),
      );
      return;
    }

    if (!pos) return;
    setPos((current) =>
      current ? clampPosition(current.x, current.y, MODAL_W, modalH, viewportSafe) : current,
    );
  }, [MODAL_W, open, pos, topOffset, variant, viewportSafe]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: variant === 'template-center' ? dragOffset.x : (pos?.x ?? 0),
      origY: variant === 'template-center' ? dragOffset.y : (pos?.y ?? 0),
    };
    document.body.style.userSelect = 'none';
  }, [dragOffset.x, dragOffset.y, pos, variant]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const el = modalRef.current;
      const modalH = el ? el.offsetHeight : 900;

      if (variant === 'template-center') {
        const anchorTop = topOffset ?? viewportSafe;
        setDragOffset(
          clampOffsetFromAnchor(
            dragRef.current.origX + dx,
            dragRef.current.origY + dy,
            MODAL_W,
            modalH,
            anchorTop,
            viewportSafe,
          ),
        );
        return;
      }

      setPos(
        clampPosition(
          dragRef.current.origX + dx,
          dragRef.current.origY + dy,
          MODAL_W,
          modalH,
          viewportSafe,
        ),
      );
    };
    const onUp = () => {
      dragRef.current.active = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [MODAL_W, topOffset, variant, viewportSafe]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ── PDF download ──────────────────────────────────────────────────────────
  const pagesRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    if (!pagesRef.current || downloading) return;
    setDownloading(true);
    try {
      const pageEls = Array.from(
        pagesRef.current.querySelectorAll<HTMLElement>('[data-a4-page]'),
      );
      if (!pageEls.length) return;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
      pdf.save(fileName);
    } finally {
      setDownloading(false);
    }
  }, [downloading, fileName]);

  const handlePrint = useCallback(() => window.print(), []);

  // ── render guard ──────────────────────────────────────────────────────────
  if (!open) return null;

  const isSmall = window.innerWidth < 768;
  const isTemplateCenter = variant === 'template-center';

  const modalStyle: React.CSSProperties = isSmall
    ? { position: 'fixed', inset: 0, zIndex: 1000 }
    : variant === 'template-center'
      ? {
          position: 'fixed',
          left: '50%',
          top: topOffset ?? viewportSafe,
          transform: `translateX(-50%) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
          width: MODAL_W,
          maxWidth: `calc(100vw - ${viewportSafe * 2}px)`,
          maxHeight: `calc(100vh - ${(topOffset ?? viewportSafe) + viewportSafe}px)`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          background: '#525659',
        }
      : {
        position: 'fixed',
        left: pos?.x ?? '50%',
        top:  pos?.y ?? '50%',
        transform: pos ? undefined : 'translate(-50%, -50%)',
        width: MODAL_W,
        maxWidth: `calc(100vw - ${viewportSafe * 2}px)`,
        maxHeight: topOffset !== undefined
          ? `calc(100vh - ${topOffset + viewportSafe}px)`
          : `calc(100vh - ${viewportSafe * 2}px)`,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow:
          '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        background: isTemplateCenter ? '#525659' : '#fff',
      };

  return (
    <>
      {/* ── Global print styles ─────────────────────────────────────────── */}
      <style>{`
        @media print {
          body > *:not(#doc-modal-print-root) { display: none !important; }
          #doc-modal-print-root { display: block !important; }

          #doc-modal-print-root .doc-modal-shell {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          #doc-modal-print-root .doc-modal-toolbar { display: none !important; }
          #doc-modal-print-root .doc-modal-scrollarea {
            overflow: visible !important;
            max-height: none !important;
            background: #fff !important;
            padding: 0 !important;
          }

          [data-a4-page] {
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            transform: none !important;
          }
          [data-a4-page]:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .a4-page-wrapper {
            width: 210mm !important;
            height: 297mm !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ zIndex: 999 }}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* ── Modal shell ─────────────────────────────────────────────────── */}
      <div
        id="doc-modal-print-root"
        ref={modalRef}
        className="doc-modal-shell"
        style={modalStyle}
      >
        {/* ── Toolbar (drag handle) ──────────────────────────────────── */}
        <div
          className="doc-modal-toolbar flex items-center gap-3 px-4 select-none shrink-0"
          style={{
            height: MODAL_CHROME_H,
            background: isTemplateCenter ? '#3c3f41' : '#f8fafc',
            borderBottom: isTemplateCenter ? '1px solid #4b5563' : '1px solid #e2e8f0',
            cursor: 'grab',
          }}
          onMouseDown={onMouseDown}
        >
          {/* Icon + title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className={`w-4 h-4 shrink-0 ${isTemplateCenter ? 'text-gray-300' : 'text-slate-500'}`} />
            <span className={`text-sm font-semibold truncate ${isTemplateCenter ? 'text-gray-100' : 'text-slate-800'}`}>{title}</span>
            {subtitle && (
              <span className={`text-xs truncate hidden sm:inline ${isTemplateCenter ? 'text-gray-400' : 'text-slate-500'}`}>
                {subtitle}
              </span>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); zoomOut(); }}
              onMouseDown={e => e.stopPropagation()}
              disabled={zoom <= minZoom}
              className={`h-7 w-7 rounded flex items-center justify-center disabled:opacity-30 transition-colors ${
                isTemplateCenter ? 'text-gray-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200'
              }`}
              title="缩小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className={`text-xs font-medium w-8 text-center tabular-nums ${isTemplateCenter ? 'text-gray-300' : 'text-slate-600'}`}>{zoom}%</span>
            <button
              onClick={e => { e.stopPropagation(); zoomIn(); }}
              onMouseDown={e => e.stopPropagation()}
              disabled={zoom >= maxZoom}
              className={`h-7 w-7 rounded flex items-center justify-center disabled:opacity-30 transition-colors ${
                isTemplateCenter ? 'text-gray-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200'
              }`}
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider */}
          <div className={`w-px h-5 shrink-0 ${isTemplateCenter ? 'bg-gray-600' : 'bg-slate-300'}`} />

          {/* Action buttons */}
          <div
            className="flex items-center gap-2 shrink-0"
            onMouseDown={e => e.stopPropagation()}
          >
            <Button
              variant="outline" size="sm"
              className={`h-8 text-xs gap-1.5 hidden sm:flex ${isTemplateCenter ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white' : ''}`}
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? '生成中…' : '下载PDF'}
            </Button>
            <Button
              variant="outline" size="sm"
              className={`h-8 text-xs gap-1.5 ${isTemplateCenter ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white' : ''}`}
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">打印</span>
            </Button>

            {/* Slot for extra actions (Edit / Submit / …) */}
            {actions}

            {/* Close */}
            <button
              onClick={onClose}
              className={`h-8 w-8 rounded flex items-center justify-center transition-colors ml-1 ${
                isTemplateCenter
                  ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
              }`}
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Document preview area (scrolls internally) ─────────────── */}
        <div
          className="doc-modal-scrollarea flex-1 overflow-y-auto overflow-x-auto"
          style={{
            background: isTemplateCenter ? '#525659' : '#e8ecf0',
            padding: isTemplateCenter ? '36px 24px 40px' : '28px 24px',
            // Smooth momentum scroll on iOS
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Inner container – centres pages horizontally */}
          <div
            ref={pagesRef}
            className="flex flex-col items-center"
            style={{ gap: 24, minWidth: 'max-content', margin: '0 auto' }}
          >
            {pages.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                暂无内容
              </div>
            ) : (
              pages.map((page, i) => (
                pageRenderMode === 'raw' ? (
                  <div
                    key={i}
                    data-a4-page
                    className="a4-page-wrapper"
                    style={{
                      flexShrink: 0,
                      zoom: `${zoom}%`,
                      transformOrigin: 'top center',
                      margin: '0 auto',
                    }}
                  >
                    {page}
                  </div>
                ) : (
                  <A4PageWrapper key={i} index={i} total={pages.length} zoom={zoom}>
                    {page}
                  </A4PageWrapper>
                )
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default DocumentModal;
