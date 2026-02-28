/**
 * A4DocumentLayout — 统一文档视图架构
 *
 * 架构层次：
 *   <A4DocumentLayout>          ← 外层灰色背景 + 居中 + 打印样式注入
 *     <A4Sheet>                 ← 单张 794×1123px 白纸（带阴影）
 *       <A4Header />            ← 页眉（可选，每页重复）
 *       <A4Body>                ← 内容区（padding 已扣除）
 *         {children}
 *       </A4Body>
 *       <A4Footer />            ← 页脚（可选，每页重复）
 *     </A4Sheet>
 *   </A4DocumentLayout>
 *
 * 分页方式：
 *   - 屏幕：每个 <A4Sheet> = 一张物理 A4 纸，多页时垂直排列，间距 24px
 *   - 打印：@page size A4，每个 [data-a4-sheet] 触发 break-after: page
 *   - 表格：使用 <PaginatedTable> 自动按行分配到各页
 *
 * 使用方式：
 *   // 单页文档
 *   <A4DocumentLayout>
 *     <A4Sheet>
 *       <A4Body>内容</A4Body>
 *     </A4Sheet>
 *   </A4DocumentLayout>
 *
 *   // 多页文档（使用 useSplitPages hook 自动分页）
 *   const pages = useSplitPages(rows, ROWS_PER_PAGE);
 *   <A4DocumentLayout>
 *     {pages.map((pageRows, i) => (
 *       <A4Sheet key={i}>
 *         <A4Body>
 *           <PaginatedTable rows={pageRows} repeatHeader={<thead>…</thead>} />
 *         </A4Body>
 *       </A4Sheet>
 *     ))}
 *   </A4DocumentLayout>
 */

import React from 'react';

// ─── A4 尺寸常量（@96dpi）────────────────────────────────────────────────────
export const A4_W        = 794;   // px
export const A4_H        = 1123;  // px
export const A4_PAD_X    = 48;    // px  左右内边距
export const A4_PAD_Y    = 40;    // px  上下内边距
/** 每页内容区可用高度（扣除上下 padding） */
export const A4_BODY_H   = A4_H - A4_PAD_Y * 2;   // 1043px
/** 每页内容区可用宽度（扣除左右 padding） */
export const A4_BODY_W   = A4_W - A4_PAD_X * 2;   // 698px

// ─── 打印全局样式 ─────────────────────────────────────────────────────────────
const PRINT_STYLE = `
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 隐藏弹窗壳、导航栏等非文档元素 */
  body > *:not(#a4-print-root) {
    display: none !important;
  }
  #a4-print-root {
    display: block !important;
  }

  /* 外层容器打印时去除背景和间距 */
  [data-a4-layout] {
    background: white !important;
    padding: 0 !important;
    gap: 0 !important;
  }

  /* 每张 A4 纸：精确 210×297mm，无阴影，分页后换页 */
  [data-a4-sheet] {
    width: 210mm !important;
    height: 297mm !important;
    padding: 10mm 12.7mm !important;   /* 上下10mm，左右12.7mm ≈ 标准打印边距 */
    box-shadow: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    break-after: page;
    page-break-after: always;
    overflow: hidden !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
  }

  [data-a4-sheet]:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  /* 表格：表头每页重复，行不被裁切 */
  [data-a4-sheet] table {
    page-break-inside: auto;
    border-collapse: collapse;
  }
  [data-a4-sheet] thead {
    display: table-header-group;
  }
  [data-a4-sheet] tfoot {
    display: table-footer-group;
  }
  [data-a4-sheet] tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* 避免标题、签名区被裁切 */
  [data-avoid-break] {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`;

// ─── A4DocumentLayout ─────────────────────────────────────────────────────────
interface A4DocumentLayoutProps {
  /** 多个 <A4Sheet> 子节点 */
  children: React.ReactNode;
  /** 打印时挂载到此 id 的容器（配合 DocumentModal 的 print root） */
  printRootId?: string;
  className?: string;
}

/**
 * 外层布局容器：灰色背景 + 居中 + 注入打印样式。
 * 直接子节点应为一个或多个 <A4Sheet>。
 */
export function A4DocumentLayout({
  children,
  printRootId,
  className = '',
}: A4DocumentLayoutProps) {
  return (
    <>
      <style>{PRINT_STYLE}</style>
      <div
        id={printRootId}
        data-a4-layout
        className={className}
        style={{
          background: '#525659',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px',
          gap: 24,
          minHeight: '100%',
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </>
  );
}

// ─── A4Sheet ──────────────────────────────────────────────────────────────────
interface A4SheetProps {
  children: React.ReactNode;
  /** 页码（1-based）；传入时在右下角显示 "1 / 3" */
  pageNumber?: number;
  totalPages?: number;
  style?: React.CSSProperties;
}

/**
 * 单张 A4 纸：794×1123px，白色，阴影，固定高度（不拉伸）。
 * 内容超出时会被 overflow:hidden 裁切 → 应提前分页。
 */
export function A4Sheet({ children, pageNumber, totalPages, style }: A4SheetProps) {
  return (
    <section
      data-a4-sheet
      style={{
        position: 'relative',
        width: A4_W,
        height: A4_H,
        background: '#fff',
        boxSizing: 'border-box',
        padding: `${A4_PAD_Y}px ${A4_PAD_X}px`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.10)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}

      {/* 页码 */}
      {typeof pageNumber === 'number' && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: A4_PAD_X,
            fontSize: 10,
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

// ─── A4Body ───────────────────────────────────────────────────────────────────
interface A4BodyProps {
  children: React.ReactNode;
  /** 额外 className */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 内容区：flex-1，撑满 A4Sheet 剩余高度。
 * 放在 A4Sheet 内，位于 PageHeader 和 PageFooter 之间。
 */
export function A4Body({ children, className = '', style }: A4BodyProps) {
  return (
    <div
      className={className}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── A4Header / A4Footer ──────────────────────────────────────────────────────
interface A4SlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** 页眉区域：shrink-0，不参与 flex 拉伸 */
export function A4Header({ children, className = '', style }: A4SlotProps) {
  return (
    <div
      className={className}
      style={{ flexShrink: 0, marginBottom: 8, ...style }}
    >
      {children}
    </div>
  );
}

/** 页脚区域：shrink-0，固定在 A4Sheet 底部 */
export function A4Footer({ children, className = '', style }: A4SlotProps) {
  return (
    <div
      className={className}
      style={{ flexShrink: 0, marginTop: 8, ...style }}
    >
      {children}
    </div>
  );
}
