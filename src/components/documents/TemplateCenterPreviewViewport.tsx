import React, { useEffect, useRef } from 'react';
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
    <div className="pointer-events-auto absolute top-4 right-4 z-[30] flex flex-col items-center gap-1 bg-white/95 backdrop-blur rounded-xl shadow-lg p-2">
      <button type="button" className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600" title="搜索">
        <Search className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
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
        className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onZoomOut();
        }}
        title="缩小"
      >
        <span className="text-sm font-bold">−</span>
      </button>
      <span className="text-xs text-gray-500 font-semibold py-1">{zoom}%</span>
      {(onPrint || onDownload || onOpenEditor) && <div className="w-6 h-px bg-gray-200 my-0.5" />}
      {onPrint && (
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
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
          className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
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
          <div className="w-6 h-px bg-gray-200 my-0.5" />
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-violet-100 text-violet-600"
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

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-auto rounded-lg bg-[#525659] ${className}`.trim()}
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
          key={`${resetKey ?? 'preview'}-${zoom}`}
          className="flex w-max flex-col items-center gap-6"
          style={{
            zoom: `${zoom}%`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default TemplateCenterPreviewViewport;
