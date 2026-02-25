import React, { forwardRef } from 'react';

/**
 * 📦 出货通知（Shipping Notice）
 * 
 * 用途：通知客户货物即将出运
 * 数据继承：从销售合同 + 实际装箱数据
 */

export interface ShippingNoticeData {
  // TODO: 定义数据结构
}

interface ShippingNoticeDocumentProps {
  data: ShippingNoticeData;
}

export const ShippingNoticeDocument = forwardRef<HTMLDivElement, ShippingNoticeDocumentProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white w-[794px] min-h-[1123px] mx-auto shadow-lg p-[20mm]">
        <h1>Shipping Notice</h1>
        <p>模板开发中...</p>
      </div>
    );
  }
);

ShippingNoticeDocument.displayName = 'ShippingNoticeDocument';
