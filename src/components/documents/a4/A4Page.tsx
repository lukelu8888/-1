import React from 'react';

// A4 @ 96 dpi: 210mm × 297mm → 794 × 1123 px
export const A4_WIDTH_PX  = 794;
export const A4_HEIGHT_PX = 1123;
export const A4_PAD_H     = 48; // horizontal padding px
export const A4_PAD_V     = 40; // vertical padding px (top + bottom each)

interface A4PageProps {
  children: React.ReactNode;
  className?: string;
  /** 1-based page number; omit to hide footer page number */
  pageNumber?: number;
  /** Total pages – shown as "1 / 3" when provided */
  totalPages?: number;
  /** Optional header slot rendered above the padded content area */
  header?: React.ReactNode;
  /** Optional footer slot rendered below the padded content area */
  footer?: React.ReactNode;
}

export function A4Page({
  children,
  className = '',
  pageNumber,
  totalPages,
  header,
  footer,
}: A4PageProps) {
  return (
    <section
      data-a4-page
      className={`relative bg-white text-[#111827] ${className}`.trim()}
      style={{
        width:  A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexShrink: 0,
        // Subtle professional shadow
        boxShadow: '0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      {/* Optional page header (outside padding box, full width) */}
      {header && (
        <div style={{ padding: `${A4_PAD_V}px ${A4_PAD_H}px 0` }}>
          {header}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          padding: header
            ? `12px ${A4_PAD_H}px ${A4_PAD_V}px`
            : `${A4_PAD_V}px ${A4_PAD_H}px`,
          height: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Optional page footer */}
      {footer && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: `0 ${A4_PAD_H}px ${A4_PAD_V / 2}px`,
          }}
        >
          {footer}
        </div>
      )}

      {/* Default page number (bottom-right) when no custom footer */}
      {typeof pageNumber === 'number' && !footer && (
        <div
          style={{
            position: 'absolute',
            right: A4_PAD_H,
            bottom: 14,
            fontSize: 11,
            color: '#9ca3af',
            userSelect: 'none',
          }}
        >
          {totalPages ? `${pageNumber} / ${totalPages}` : pageNumber}
        </div>
      )}
    </section>
  );
}
