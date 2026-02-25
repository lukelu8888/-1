import React from 'react';

interface A4PageProps {
  children: React.ReactNode;
  className?: string;
  pageNumber?: number;
}

export function A4Page({ children, className = '', pageNumber }: A4PageProps) {
  return (
    <section
      data-a4-page
      className={`bg-white text-[#111827] shadow-[0_4px_20px_rgba(0,0,0,0.12)] ${className}`.trim()}
      style={{
        width: '794px',
        height: '1123px',
        boxSizing: 'border-box',
        padding: '40px 48px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ height: '100%', overflow: 'hidden' }}>{children}</div>
      {typeof pageNumber === 'number' && (
        <div
          style={{
            position: 'absolute',
            right: 48,
            bottom: 14,
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          {pageNumber}
        </div>
      )}
    </section>
  );
}
