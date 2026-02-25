import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../../ui/button';
import { A4Page } from './A4Page';

interface A4DocumentViewerProps {
  pages: React.ReactNode[];
  showControls?: boolean;
  defaultZoom?: 50 | 75 | 100;
  fileName?: string;
  className?: string;
}

const ZOOM_LEVELS = [50, 75, 100] as const;

export function A4DocumentViewer({
  pages,
  showControls = true,
  defaultZoom = 100,
  fileName = `document_${Date.now()}.pdf`,
  className = '',
}: A4DocumentViewerProps) {
  const [zoom, setZoom] = useState<number>(defaultZoom);
  const pagesRef = useRef<HTMLDivElement>(null);

  const pageScale = useMemo(() => zoom / 100, [zoom]);

  const handleZoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom as (typeof ZOOM_LEVELS)[number]);
    if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
  };

  const handleZoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom as (typeof ZOOM_LEVELS)[number]);
    if (idx >= 0 && idx < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[idx + 1]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!pagesRef.current) return;
    const pageEls = Array.from(pagesRef.current.querySelectorAll<HTMLElement>('[data-a4-page]'));
    if (!pageEls.length) return;

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    for (let index = 0; index < pageEls.length; index += 1) {
      const canvas = await html2canvas(pageEls[index], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imageData = canvas.toDataURL('image/png');
      if (index > 0) {
        pdf.addPage();
      }
      pdf.addImage(imageData, 'PNG', 0, 0, 210, 297);
    }

    pdf.save(fileName);
  };

  return (
    <div className={`w-full ${className}`.trim()}>
      <style>{`
        @media print {
          .a4-viewer-shell {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .a4-viewer-toolbar {
            display: none !important;
          }
          [data-a4-page] {
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
          }
          [data-a4-page]:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          table {
            break-inside: auto;
            page-break-inside: auto;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="a4-viewer-shell bg-[#e5e7eb] p-6">
        {showControls && (
          <div className="a4-viewer-toolbar mb-4 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="mr-1 h-4 w-4" />
              缩小
            </Button>
            <div className="min-w-[56px] text-center text-sm font-medium text-[#374151]">{zoom}%</div>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="mr-1 h-4 w-4" />
              放大
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1 h-4 w-4" />
              打印
            </Button>
            <Button size="sm" className="bg-[#F96302] hover:bg-[#e05500]" onClick={handleDownloadPdf}>
              <Download className="mr-1 h-4 w-4" />
              下载PDF
            </Button>
          </div>
        )}

        <div ref={pagesRef} className="mx-auto flex flex-col items-center gap-6">
          {pages.map((page, index) => (
            <div
              key={`a4-wrap-${index}`}
              style={{
                transform: `scale(${pageScale})`,
                transformOrigin: 'top center',
                marginBottom: `${(1 - pageScale) * 1123}px`,
              }}
            >
              <A4Page pageNumber={index + 1}>{page}</A4Page>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
