import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 📦 包装清单（Packing List）
 * 
 * 用途：详细列出货物包装信息
 * 配合商业发票使用（必需配套文件）
 * 数据来源：出货通知 + 实际装箱数据
 */

export interface PackingListData {
  // 基本信息
  plNo: string;                // PL-20251210-001
  invoiceNo: string;           // 关联商业发票号
  date: string;
  
  // 出口方
  exporter: {
    name: string;
    address: string;
  };
  
  // 进口方
  importer: {
    name: string;
    address: string;
  };
  
  // 唛头
  shippingMarks: string;
  
  // 包装明细
  packages: Array<{
    cartonNo: string;          // "1-25" 表示箱号1到25
    description: string;       // 货物描述
    qtyPerCarton: number;      // 每箱数量
    totalCartons: number;      // 总箱数
    totalQty: number;          // 总数量
    unit: string;              // 单位
    netWeight: number;         // 净重/箱 (kg)
    grossWeight: number;       // 毛重/箱 (kg)
    measurement: number;       // 体积/箱 (cbm)
    totalNW: number;           // 总净重 (kg)
    totalGW: number;           // 总毛重 (kg)
    totalCBM: number;          // 总体积 (cbm)
  }>;
  
  // 运输信息
  shipping: {
    portOfLoading: string;
    portOfDischarge: string;
    vesselName?: string;
    blNo?: string;
  };
}

interface PackingListDocumentProps {
  data: PackingListData;
}

export const PackingListDocument = forwardRef<HTMLDivElement, PackingListDocumentProps>(
  ({ data }, ref) => {
    
    // 计算总计
    const totals = data.packages.reduce(
      (acc, pkg) => ({
        cartons: acc.cartons + pkg.totalCartons,
        nw: acc.nw + pkg.totalNW,
        gw: acc.gw + pkg.totalGW,
        cbm: acc.cbm + pkg.totalCBM
      }),
      { cartons: 0, nw: 0, gw: 0, cbm: 0 }
    );

    return (
      <div 
        ref={ref}
        className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-lg"
        style={{ 
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          fontSize: '9pt',
          lineHeight: '1.3'
        }}
      >
        <div className="p-[15mm]">
          {/* Header - Taiwan Enterprise Compact Style */}
          <div className="mb-3">
            {/* Title + P/L Info Table */}
            <div className="flex items-start justify-between mb-2">
              {/* Left: LOGO */}
              <div className="w-[70px] flex-shrink-0">
                <img
                  src={cosunLogo}
                  alt="Company Logo"
                  className="w-full h-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Center: PACKING LIST Title */}
              <div className="flex-1 flex justify-center items-center">
                <h1 className="text-2xl font-bold tracking-wider text-black whitespace-nowrap">
                  PACKING LIST
                </h1>
              </div>
              
              {/* Right: P/L Info Table */}
              <div className="w-[250px]">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap w-[85px]">P/L No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap">{data.plNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Invoice No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{data.invoiceNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">
                        {new Date(data.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Divider - Double Line Design */}
            <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
          </div>

          {/* 出口方和进口方 */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="border border-black p-3">
              <h3 className="font-semibold mb-2 underline">EXPORTER:</h3>
              <p className="font-semibold">{data.exporter.name}</p>
              <p>{data.exporter.address}</p>
            </div>
            <div className="border border-black p-3">
              <h3 className="font-semibold mb-2 underline">IMPORTER:</h3>
              <p className="font-semibold">{data.importer.name}</p>
              <p>{data.importer.address}</p>
            </div>
          </div>

          {/* 唛头 */}
          <div className="mb-4 border border-black p-3">
            <h3 className="font-semibold mb-2">SHIPPING MARKS:</h3>
            <div className="font-mono text-sm whitespace-pre-line">
              {data.shippingMarks}
            </div>
          </div>

          {/* 包装明细表格 */}
          <div className="mb-4">
            <table className="w-full border-collapse border-2 border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black px-1 py-1">Carton No.</th>
                  <th className="border border-black px-1 py-1">Description</th>
                  <th className="border border-black px-1 py-1 w-16">Qty/Ctn</th>
                  <th className="border border-black px-1 py-1 w-12">Ctns</th>
                  <th className="border border-black px-1 py-1 w-16">Total Qty</th>
                  <th className="border border-black px-1 py-1 w-16">N.W./Ctn (KGS)</th>
                  <th className="border border-black px-1 py-1 w-16">G.W./Ctn (KGS)</th>
                  <th className="border border-black px-1 py-1 w-16">Meas./Ctn (CBM)</th>
                  <th className="border border-black px-1 py-1 w-16">Total N.W. (KGS)</th>
                  <th className="border border-black px-1 py-1 w-16">Total G.W. (KGS)</th>
                  <th className="border border-black px-1 py-1 w-16">Total Meas. (CBM)</th>
                </tr>
              </thead>
              <tbody>
                {data.packages.map((pkg, index) => (
                  <tr key={index}>
                    <td className="border border-black px-1 py-1 text-center font-semibold">
                      {pkg.cartonNo}
                    </td>
                    <td className="border border-black px-1 py-1">
                      {pkg.description}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {pkg.qtyPerCarton}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {pkg.totalCartons}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {pkg.totalQty.toLocaleString()} {pkg.unit}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {pkg.netWeight.toFixed(2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {pkg.grossWeight.toFixed(2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {pkg.measurement.toFixed(3)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-semibold">
                      {pkg.totalNW.toFixed(2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-semibold">
                      {pkg.totalGW.toFixed(2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-semibold">
                      {pkg.totalCBM.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={3} className="border border-black px-1 py-1 text-right">
                    TOTAL:
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {totals.cartons}
                  </td>
                  <td className="border border-black px-1 py-1"></td>
                  <td colSpan={3} className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1 text-right">
                    {totals.nw.toFixed(2)}
                  </td>
                  <td className="border border-black px-1 py-1 text-right">
                    {totals.gw.toFixed(2)}
                  </td>
                  <td className="border border-black px-1 py-1 text-right">
                    {totals.cbm.toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 运输信息 */}
          <div className="text-xs">
            <div className="mb-1">
              <span className="font-semibold">Port of Loading:</span> {data.shipping.portOfLoading}
            </div>
            <div className="mb-1">
              <span className="font-semibold">Port of Discharge:</span> {data.shipping.portOfDischarge}
            </div>
            {data.shipping.vesselName && (
              <div className="mb-1">
                <span className="font-semibold">Vessel:</span> {data.shipping.vesselName}
              </div>
            )}
            {data.shipping.blNo && (
              <div>
                <span className="font-semibold">B/L No:</span> {data.shipping.blNo}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PackingListDocument.displayName = 'PackingListDocument';