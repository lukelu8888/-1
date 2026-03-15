import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface TemplatePreviewShellProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  shellClassName?: string;
  bodyClassName?: string;
  contentWrapperClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  controlButtonClassName?: string;
  zoomTextClassName?: string;
}

export function TemplatePreviewShell({
  title = 'A4 模板预览',
  subtitle = '210mm × 297mm',
  zoom,
  minZoom = 30,
  maxZoom = 150,
  onZoomIn,
  onZoomOut,
  headerActions,
  children,
  shellClassName = '',
  bodyClassName = '',
  contentWrapperClassName = '',
  headerClassName = '',
  titleClassName = '',
  subtitleClassName = '',
  controlButtonClassName = '',
  zoomTextClassName = '',
}: TemplatePreviewShellProps) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-[#525659] ${shellClassName}`.trim()}>
      <div className={`sticky top-0 z-10 flex items-center justify-between border-b border-[#3c3f41] bg-[#3c3f41] px-4 py-2.5 flex-shrink-0 ${headerClassName}`.trim()}>
        <div>
          <p className={`text-xs font-semibold text-gray-200 ${titleClassName}`.trim()}>{title}</p>
          <p className={`mt-0.5 text-[10px] text-gray-400 ${subtitleClassName}`.trim()}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`flex h-7 w-7 items-center justify-center rounded text-gray-300 hover:bg-white/10 disabled:opacity-30 ${controlButtonClassName}`.trim()}
            onClick={onZoomOut}
            disabled={!onZoomOut || zoom <= minZoom}
            title="缩小"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className={`w-10 text-center text-[11px] font-medium text-gray-300 ${zoomTextClassName}`.trim()}>{zoom}%</span>
          <button
            type="button"
            className={`flex h-7 w-7 items-center justify-center rounded text-gray-300 hover:bg-white/10 disabled:opacity-30 ${controlButtonClassName}`.trim()}
            onClick={onZoomIn}
            disabled={!onZoomIn || zoom >= maxZoom}
            title="放大"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          {headerActions && <div className="ml-1 flex items-center gap-1.5">{headerActions}</div>}
        </div>
      </div>

      <div className={`min-h-0 flex-1 overflow-auto bg-[#525659] p-8 ${bodyClassName}`.trim()}>
        <div className={`flex min-h-full justify-center ${contentWrapperClassName}`.trim()}>
          <div
            data-rfq-content
            style={{
              zoom: `${zoom}%`,
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

export default TemplatePreviewShell;
