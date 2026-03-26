import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileCheck, Search } from 'lucide-react';

interface TemplateCenterPreviewViewportProps {
  zoom: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onOpenEditor?: () => void;
  children: React.ReactNode;
  className?: string;
  resetKey?: string | number | null;
  hideToolbar?: boolean;
  viewportRefExternal?: React.MutableRefObject<HTMLDivElement | null>;
}

function PreviewToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onPrint,
  onDownload,
  onOpenEditor,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onOpenEditor?: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute top-4 right-4 z-[30] flex flex-col items-center gap-1 rounded-2xl border border-white/75 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)] p-2.5">
      <button type="button" className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700 transition-colors" title="搜索">
        <Search className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onZoomIn();
        }}
        title="放大"
      >
        <span className="text-sm font-bold">+</span>
      </button>
      <button
        type="button"
        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onZoomOut();
        }}
        title="缩小"
      >
        <span className="text-sm font-bold">−</span>
      </button>
      <span className="py-1 text-xs font-semibold text-gray-500">{zoom}%</span>
      {(onPrint || onDownload || onOpenEditor) && <div className="my-1 h-px w-7 bg-gray-200" />}
      {onPrint && (
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onPrint();
          }}
          title="打印"
        >
          <FileCheck className="w-4 h-4" />
        </button>
      )}
      {onDownload && (
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDownload();
          }}
          title="下载"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
      {onOpenEditor && (
        <>
          <div className="my-1 h-px w-7 bg-gray-200" />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-violet-600 transition-colors hover:bg-violet-100"
            title="进入编辑器"
            onClick={onOpenEditor}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

export function TemplateCenterPreviewViewport({
  zoom,
  onZoomIn,
  onZoomOut,
  onPrint,
  onDownload,
  onOpenEditor,
  children,
  className = '',
  resetKey,
  hideToolbar = false,
  viewportRefExternal,
}: TemplateCenterPreviewViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const scale = zoom / 100;

  useEffect(() => {
    if (!viewportRefExternal) return;
    viewportRefExternal.current = viewportRef.current;
    return () => {
      if (viewportRefExternal.current === viewportRef.current) {
        viewportRefExternal.current = null;
      }
    };
  }, [viewportRefExternal]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: 0, left: 0 });
  }, [resetKey, zoom]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () => {
      setContentSize({
        width: content.offsetWidth,
        height: content.offsetHeight,
      });
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [resetKey, children]);

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-auto rounded-lg bg-[#525659] ${className}`.trim()}
      style={{ backgroundColor: '#525659' }}
    >
      {!hideToolbar && (
        <PreviewToolbar
          zoom={zoom}
          onZoomIn={onZoomIn || (() => {})}
          onZoomOut={onZoomOut || (() => {})}
          onPrint={onPrint}
          onDownload={onDownload}
          onOpenEditor={onOpenEditor}
        />
      )}
      <div className="flex min-h-full justify-center px-6 py-10">
        <div
          key={`${resetKey ?? 'preview'}`}
          className="flex flex-col items-center gap-6"
          style={{
            width: contentSize.width ? `${contentSize.width * scale}px` : undefined,
            minHeight: contentSize.height ? `${contentSize.height * scale}px` : undefined,
          }}
        >
          <div
            ref={contentRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: 'fit-content',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateCenterPreviewViewport;
