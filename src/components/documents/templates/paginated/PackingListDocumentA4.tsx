import React, { forwardRef, useMemo } from 'react';
import cosunLogo from '../../../../assets/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentViewer } from '../../a4/A4DocumentViewer';
import { A4Page } from '../../a4/A4Page';
import { A4Block, paginateBlocks } from '../../a4/Paginator';
import type { PackingListData } from '../PackingListDocument';

interface PackingListDocumentA4Props {
  data: PackingListData;
  showControls?: boolean;
}

interface PackingListDocumentA4PagesProps {
  data: PackingListData;
}

const tableClass = 'w-full border-collapse border border-black text-xs';
const productTableClass = 'w-full border-collapse border-2 border-black text-xs';
const tdClass = 'border border-black px-1 py-1 align-top';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function estimateWrappedLines(text: string, maxCharsPerLine: number) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => Math.max(1, Math.ceil(line.length / maxCharsPerLine)))
    .reduce((sum, count) => sum + count, 0);
}

function buildPackageRowHeight(pkg: PackingListData['packages'][number]) {
  return Math.max(32, 12 + estimateWrappedLines(pkg.description || '', 16) * 12);
}

export const PackingListDocumentA4 = forwardRef<HTMLDivElement, PackingListDocumentA4Props>(
  ({ data, showControls = false }, ref) => {
    const pages = useMemo(() => buildPackingListPages(data), [data]);
    return (
      <div ref={ref}>
        <A4DocumentViewer pages={pages} showControls={showControls} fileName={`${data.plNo || 'pl'}.pdf`} />
      </div>
    );
  },
);

PackingListDocumentA4.displayName = 'PackingListDocumentA4';

export function PackingListDocumentA4Pages({ data }: PackingListDocumentA4PagesProps) {
  const pages = useMemo(() => buildPackingListPages(data), [data]);
  return (
    <>
      {pages.map((page, index) => (
        <A4Page key={`pl-page-${index}`} pageNumber={index + 1} totalPages={pages.length}>
          {page}
        </A4Page>
      ))}
    </>
  );
}

export function buildPackingListPages(data: PackingListData): React.ReactNode[] {
  const totals = data.packages.reduce(
    (acc, pkg) => ({
      cartons: acc.cartons + pkg.totalCartons,
      nw: acc.nw + pkg.totalNW,
      gw: acc.gw + pkg.totalGW,
      cbm: acc.cbm + pkg.totalCBM,
    }),
    { cartons: 0, nw: 0, gw: 0, cbm: 0 },
  );

  const blocks: A4Block[] = [
    {
      type: 'section',
      key: 'header',
      estimatedHeight: 130,
      avoidBreak: true,
      render: () => (
        <div>
          <div className="mb-2 flex items-start justify-between">
            <div className="w-[70px] flex-shrink-0">
              <img src={cosunLogo} alt="Company Logo" className="w-full h-auto" style={{ objectFit: 'contain' }} />
            </div>
            <div className="flex flex-1 justify-center items-center">
              <h1 className="text-2xl font-bold tracking-wider text-black whitespace-nowrap">PACKING LIST</h1>
            </div>
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
                    <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{formatDate(data.date)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>
      ),
    },
    {
      type: 'section',
      key: 'parties',
      estimatedHeight: 120,
      avoidBreak: true,
      render: () => (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-black p-3">
            <h3 className="mb-2 font-semibold underline">EXPORTER:</h3>
            <p className="font-semibold">{data.exporter.name}</p>
            <p>{data.exporter.address}</p>
          </div>
          <div className="border border-black p-3">
            <h3 className="mb-2 font-semibold underline">IMPORTER:</h3>
            <p className="font-semibold">{data.importer.name}</p>
            <p>{data.importer.address}</p>
          </div>
        </div>
      ),
    },
    {
      type: 'section',
      key: 'marks',
      estimatedHeight: 80,
      avoidBreak: true,
      render: () => (
        <div className="border border-black p-3">
          <h3 className="mb-2 font-semibold">SHIPPING MARKS:</h3>
          <div className="font-mono text-sm whitespace-pre-line">{data.shippingMarks}</div>
        </div>
      ),
    },
    {
      type: 'table',
      key: 'packages',
      headerHeight: 92,
      rowHeight: (row) => buildPackageRowHeight(row),
      footerHeight: 38,
      rows: data.packages,
      renderHeader: () => (
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-1 py-1">Carton No.</th>
            <th className="border border-black px-1 py-1">Description</th>
            <th className="border border-black px-1 py-1 w-16">Qty/Ctn</th>
            <th className="border border-black px-1 py-1 w-12">Ctns</th>
            <th className="border border-black px-1 py-1 w-16">Total Qty</th>
            <th className="border border-black px-1 py-1 w-16">N.W./Ctn</th>
            <th className="border border-black px-1 py-1 w-16">G.W./Ctn</th>
            <th className="border border-black px-1 py-1 w-16">Meas./Ctn</th>
            <th className="border border-black px-1 py-1 w-16">Total N.W.</th>
            <th className="border border-black px-1 py-1 w-16">Total G.W.</th>
            <th className="border border-black px-1 py-1 w-16">Total Meas.</th>
          </tr>
        </thead>
      ),
      renderRow: (pkg) => (
        <tr key={`${pkg.cartonNo}-${pkg.description}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <td className={`${tdClass} text-center font-semibold`}>{pkg.cartonNo}</td>
          <td className={tdClass}>{pkg.description}</td>
          <td className={`${tdClass} text-right`}>{pkg.qtyPerCarton}</td>
          <td className={`${tdClass} text-center`}>{pkg.totalCartons}</td>
          <td className={`${tdClass} text-right`}>{pkg.totalQty.toLocaleString()} {pkg.unit}</td>
          <td className={`${tdClass} text-right`}>{pkg.netWeight.toFixed(2)}</td>
          <td className={`${tdClass} text-right`}>{pkg.grossWeight.toFixed(2)}</td>
          <td className={`${tdClass} text-right`}>{pkg.measurement.toFixed(3)}</td>
          <td className={`${tdClass} text-right font-semibold`}>{pkg.totalNW.toFixed(2)}</td>
          <td className={`${tdClass} text-right font-semibold`}>{pkg.totalGW.toFixed(2)}</td>
          <td className={`${tdClass} text-right font-semibold`}>{pkg.totalCBM.toFixed(2)}</td>
        </tr>
      ),
      renderFooter: () => (
        <tr className="bg-gray-100 font-bold">
          <td colSpan={3} className={`${tdClass} text-right`}>TOTAL:</td>
          <td className={`${tdClass} text-center`}>{totals.cartons}</td>
          <td className={tdClass}></td>
          <td colSpan={3} className={tdClass}></td>
          <td className={`${tdClass} text-right`}>{totals.nw.toFixed(2)}</td>
          <td className={`${tdClass} text-right`}>{totals.gw.toFixed(2)}</td>
          <td className={`${tdClass} text-right`}>{totals.cbm.toFixed(2)}</td>
        </tr>
      ),
    },
    {
      type: 'section',
      key: 'shipping-info',
      estimatedHeight: 90,
      avoidBreak: true,
      render: () => (
        <div className="text-xs">
          <div className="mb-1"><span className="font-semibold">Remark:</span> Weight unit: KGS; Measurement unit: CBM.</div>
          <div className="mb-1"><span className="font-semibold">Port of Loading:</span> {data.shipping.portOfLoading}</div>
          <div className="mb-1"><span className="font-semibold">Port of Discharge:</span> {data.shipping.portOfDischarge}</div>
          {data.shipping.vesselName ? <div className="mb-1"><span className="font-semibold">Vessel:</span> {data.shipping.vesselName}</div> : null}
          {data.shipping.blNo ? <div><span className="font-semibold">B/L No:</span> {data.shipping.blNo}</div> : null}
        </div>
      ),
    },
  ];

  return paginateBlocks(blocks).map((page) => (
    <div key={`pl-${page.index}`} className="flex h-full flex-col gap-4 text-[12px] leading-5">
      {page.items.map((item) => {
        if (item.type === 'section') return <React.Fragment key={item.key}>{item.render()}</React.Fragment>;
        return (
          <section key={item.key}>
            <table className={productTableClass}>
              {item.renderHeader()}
              <tbody>
                {item.rows.map((row, index) => item.renderRow(row, item.startIndex + index))}
                {item.showFooter && item.renderFooter?.()}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  ));
}
