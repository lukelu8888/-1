import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Armchair,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Eye,
  FileCheck,
  Gamepad2,
  Lightbulb,
  Package,
  Shield,
  Shirt,
  Truck,
  Watch,
  Zap,
} from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';
import { AQLContent } from './AQLContent';
import { QCServiceRequestForm } from './QCServiceRequestForm';
import { Button } from './ui/button';
import qcHeroImg from 'figma:asset/8b8f9232f60a2046628bfa02ab68d1e507203f48.png';
import qcProductImg from 'figma:asset/3b125683eb3b428987bfb96d06a1a120a650267e.png';
import qcPackingImg from 'figma:asset/b3d077ae61f60718774042148488db58fe0fef8b.png';
import qcLoadingImg from 'figma:asset/e3f17a67e02946dc6667a2ab1d9a0e3e4b5c74d4.png';

const inspectionMoments = [
  ['Before final payment', 'Check whether goods match order, samples, photos, packing, and quantity before balance release.'],
  ['Before shipment', 'Use AQL sampling and product checkpoints to decide whether goods can leave the factory.'],
  ['During production', 'Catch visible issues before the full batch is finished.'],
  ['During loading', 'Confirm cartons, container condition, loading photos, and shipment preparation.'],
  ['After issues appear', 'Follow supplier correction, re-check evidence, and keep the record traceable.'],
];

const inspectionScope = [
  'Product appearance and workmanship',
  'Function, size, material, color, and finish',
  'Quantity, accessories, spare parts, and assortment',
  'Packaging, labels, barcodes, manuals, and carton marks',
  'Order, sample, drawing, photo, and checklist conformity',
  'Loading status, container condition, and shipment documents',
];

const reportOutputs = [
  'On-site photos and videos',
  'AQL sample size and acceptance result',
  'Critical / major / minor defect notes',
  'Quantity and packing verification',
  'Release, hold, or rework suggestion',
  'ERP and customer workspace record',
];

const aqlSteps = [
  ['Lot size', 'Confirm shipment quantity and inspection level.'],
  ['Sample size', 'Use ISO 2859-1 / ANSI Z1.4 tables or calculator.'],
  ['Defect class', 'Separate critical, major, and minor defects.'],
  ['Decision', 'Compare accept/reject numbers and advise next action.'],
];

const inspectionTypes = [
  'Factory audit',
  'During production check',
  'Pre-shipment inspection',
  'Loading supervision',
  'Re-inspection',
  'Issue follow-up',
];

const requestEvidence = [
  {
    title: 'Product or sample',
    text: 'Photos, drawings, model, material, finish, size, or function points.',
    image: qcProductImg,
    icon: Package,
  },
  {
    title: 'Packing and labels',
    text: 'Carton marks, barcode, manual, accessories, quantity, and packing list.',
    image: qcPackingImg,
    icon: ClipboardCheck,
  },
  {
    title: 'Shipment status',
    text: 'Supplier, order, delivery date, loading plan, container, or shipment photos.',
    image: qcLoadingImg,
    icon: Truck,
  },
];

const standardCategories = [
  { title: 'Toys', codes: 'ASTM F963 / EN71 / ISO 8124', icon: Gamepad2, page: 'toysinspection', color: 'text-pink-700 bg-pink-50' },
  { title: 'Electronics', codes: 'IEC 60335 / IEC 62368 / RoHS', icon: Cpu, page: 'electronicsinspection', color: 'text-indigo-700 bg-indigo-50' },
  { title: 'Appliances', codes: 'IEC 60335-1 / GB 4706.1', icon: Zap, page: 'appliancesinspection', color: 'text-orange-700 bg-orange-50' },
  { title: 'Lighting', codes: 'IEC 60598 / UL 153', icon: Lightbulb, page: 'lightinginspection', color: 'text-yellow-700 bg-yellow-50' },
  { title: 'Textiles', codes: 'ASTM D2054 / AATCC 8', icon: Shirt, page: 'textilesinspection', color: 'text-purple-700 bg-purple-50' },
  { title: 'Shoes', codes: 'SATRA TM / ISO 20871', icon: Watch, page: 'shoesinspection', color: 'text-cyan-700 bg-cyan-50' },
  { title: 'Furniture', codes: 'EN 12520 / ASTM F2057', icon: Armchair, page: 'furnitureinspection', color: 'text-emerald-700 bg-emerald-50' },
  { title: 'Packaging', codes: 'ISO 2248 / ASTM D4169', icon: Package, page: 'packaginginspection', color: 'text-teal-700 bg-teal-50' },
];

type AQLPreviewCell = { type: 'arrow' | 'num'; val: string; colspan?: number };

const aqlPreviewRows: Array<{ code: string; size: number; cells: AQLPreviewCell[] }> = [
  { code: 'A', size: 2, cells: [...Array(10).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }] },
  { code: 'B', size: 3, cells: [...Array(9).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }] },
  { code: 'C', size: 5, cells: [...Array(8).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }] },
  { code: 'D', size: 8, cells: [...Array(7).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }] },
  { code: 'E', size: 13, cells: [...Array(6).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }] },
  { code: 'F', size: 20, cells: [...Array(5).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }] },
  { code: 'G', size: 32, cells: [...Array(4).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }] },
  { code: 'H', size: 50, cells: [...Array(3).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }] },
  { code: 'J', size: 80, cells: [...Array(2).fill({ type: 'arrow', val: '↓', colspan: 2 }), { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }] },
  { code: 'K', size: 125, cells: [{ type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }] },
  { code: 'L', size: 200, cells: [{ type: 'num', val: '0' }, { type: 'num', val: '1' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }, { type: 'num', val: '21' }, { type: 'num', val: '22' }] },
  { code: 'M', size: 315, cells: [{ type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }, { type: 'num', val: '21' }, { type: 'num', val: '22' }, { type: 'arrow', val: '↑', colspan: 2 }] },
  { code: 'N', size: 500, cells: [{ type: 'arrow', val: '↓', colspan: 2 }, { type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }, { type: 'num', val: '21' }, { type: 'num', val: '22' }, { type: 'arrow', val: '↑', colspan: 2 }, { type: 'arrow', val: '↑', colspan: 2 }] },
  { code: 'P', size: 800, cells: [{ type: 'num', val: '1' }, { type: 'num', val: '2' }, { type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }, { type: 'num', val: '21' }, { type: 'num', val: '22' }, { type: 'arrow', val: '↑', colspan: 2 }, ...Array(2).fill({ type: 'arrow', val: '↑', colspan: 2 })] },
  { code: 'Q', size: 1250, cells: [{ type: 'num', val: '2' }, { type: 'num', val: '3' }, { type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }, { type: 'num', val: '21' }, { type: 'num', val: '22' }, { type: 'arrow', val: '↑', colspan: 2 }, ...Array(3).fill({ type: 'arrow', val: '↑', colspan: 2 })] },
  { code: 'R', size: 2000, cells: [{ type: 'num', val: '3' }, { type: 'num', val: '4' }, { type: 'num', val: '5' }, { type: 'num', val: '6' }, { type: 'num', val: '7' }, { type: 'num', val: '8' }, { type: 'num', val: '10' }, { type: 'num', val: '11' }, { type: 'num', val: '14' }, { type: 'num', val: '15' }, { type: 'num', val: '21' }, { type: 'num', val: '22' }, { type: 'arrow', val: '↑', colspan: 2 }, ...Array(4).fill({ type: 'arrow', val: '↑', colspan: 2 })] },
];

function AQLTableBPreview() {
  const highlightedGroup = 3;
  const renderCells = (cells: AQLPreviewCell[]) => {
    let colIndex = 0;
    return cells.map((cell, idx) => {
      const currentColIndex = colIndex;
      const aqlGroup = Math.floor(currentColIndex / 2);
      const highlighted = aqlGroup === highlightedGroup;
      colIndex += cell.colspan || 1;

      return (
        <td
          key={idx}
          colSpan={cell.colspan || 1}
          className={`border border-gray-300 px-2 py-1 text-center ${highlighted ? 'bg-red-600 text-white' : cell.type === 'arrow' ? 'text-gray-400' : 'text-gray-900'}`}
        >
          {cell.val}
        </td>
      );
    });
  };

  return (
    <div className="rounded-md bg-white p-5 shadow-2xl" style={{ width: 1240 }}>
      <div className="mb-5">
        <h3 className="mb-3 text-xl font-black text-gray-950">Table B</h3>
        <p className="text-base leading-7 text-gray-700">
          Locate Row L (the required sample size of 200) In compliance with AQL 2.5, no more than 10 units from a sample size of 200 may fail the inspection.
        </p>
      </div>
      <div className="mb-5 flex justify-center">
        <div className="rounded-full bg-red-600 px-8 py-3 text-base font-black text-white">
          Single sampling plans for normal inspection
        </div>
      </div>
      <div className="overflow-hidden">
        <table className="w-full border-collapse text-sm" style={{ minWidth: 1180 }}>
          <thead>
            <tr className="border-b-2 border-gray-300 bg-white">
              <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-center font-black leading-tight text-gray-950">Sample<br />Size<br />Code<br />Letter</th>
              <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-center font-black leading-tight text-gray-950">Sample<br />Size</th>
              <th colSpan={22} className="border border-gray-300 bg-gray-50 px-3 py-2 text-center font-black text-gray-950">Acceptable Quality Levels (Normal Inspection)</th>
            </tr>
            <tr className="bg-white">
              {['0.065', '0.10', '0.15', '0.25', '0.40', '0.65', '1.0', '1.5', '2.5', '4.0', '6.5'].map((value, index) => (
                <th key={value} colSpan={2} className={`border border-gray-300 px-2 py-2 text-center text-red-600 ${index === highlightedGroup ? 'bg-red-600 text-white' : ''}`}>
                  {value}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-1" />
              <th className="border border-gray-300 px-3 py-1" />
              {Array.from({ length: 22 }, (_, i) => (
                <th key={i} className={`border border-gray-300 px-2 py-1 text-center font-black ${Math.floor(i / 2) === highlightedGroup ? 'bg-red-600 text-white' : 'text-gray-700'}`}>
                  {i % 2 === 0 ? 'Ac' : 'Re'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aqlPreviewRows.map((row, rowIdx) => (
              <tr key={row.code} className={Math.floor(rowIdx / 3) % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                <td className="border border-gray-300 px-3 py-1 text-center font-black text-gray-950">{row.code}</td>
                <td className="border border-gray-300 px-3 py-1 text-center text-gray-950">{row.size}</td>
                {renderCells(row.cells)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function QCMaster() {
  const { navigateTo } = useRouter();
  const [showAQLDetails, setShowAQLDetails] = useState(false);

  const openAQLStandard = () => {
    setShowAQLDetails(true);
    window.setTimeout(() => {
      document.getElementById('aql-table-a')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  return (
    <section
      id="qc-master"
      className="overflow-x-hidden bg-white text-gray-950"
      style={{ maxWidth: '100vw', overflowY: 'visible' }}
    >
      <section className="relative isolate bg-gray-950 text-white">
        <img
          src={qcHeroImg}
          alt="COSUN on-site quality inspection"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'brightness(0.55) saturate(0.9)', objectPosition: 'center center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/86 via-gray-950/54 to-gray-950/34" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/10 via-transparent to-gray-950/50" />
        <div className="cosun-shell relative flex min-h-[560px] items-center py-12">
          <div className="min-w-0 lg:max-w-[560px]">
            <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-normal sm:text-5xl md:text-[60px]">
              Your Eyes in the Supply Chain
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/92 md:text-xl">
              COSUN checks products, packaging, quantity, labels, AQL sampling results, and loading status
              before goods leave the factory.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigateTo('login')} className="h-12 bg-red-600 px-6 text-base font-semibold hover:bg-red-700" style={{ width: 'min(100%, 230px)' }}>
                Book an Inspection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={openAQLStandard}
                variant="outline"
                className="h-12 border-white/60 bg-gray-950/70 px-6 text-base font-semibold text-white backdrop-blur-sm hover:!bg-gray-950/85 hover:!text-white"
                style={{ width: 'min(100%, 230px)' }}
              >
                View AQL Standard
              </Button>
            </div>
          </div>

          <div className="pointer-events-none absolute right-0 min-w-0 -translate-y-1/2" style={{ top: '74%' }}>
            <div className="ml-auto overflow-hidden rounded-md" style={{ width: 620, height: 430 }}>
              <div style={{ width: 1240, transform: 'scale(0.42)', transformOrigin: 'top left' }}>
                <AQLTableBPreview />
              </div>
            </div>
            <div className="overflow-x-auto rounded-md md:hidden">
              <div style={{ transform: 'scale(0.56)', transformOrigin: 'top left', width: 1240 }}>
                <AQLTableBPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-8">
        <div className="cosun-shell">
          <div className="grid gap-3 lg:grid-cols-5">
            {inspectionMoments.map(([title, text], index) => (
              <div key={title} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="text-sm font-black text-gray-950">{title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Inspection desk</p>
              <h2 className="text-2xl font-black leading-tight md:text-3xl">
                We inspect the risk points customers actually use to decide whether to pay, ship, or hold.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-gray-600">
                The inspection is based on your order, sample, drawing, photos, product checklist, packaging
                requirement, or AQL level. When problems are found, COSUN can also coordinate correction and re-check.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <Eye className="h-5 w-5 text-red-700" />
                  <h3 className="text-lg font-black text-gray-950">What we check</h3>
                </div>
                <div className="space-y-3">
                  {inspectionScope.map((item) => (
                    <div key={item} className="flex gap-2 text-sm font-semibold leading-5 text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-red-700" />
                  <h3 className="text-lg font-black text-gray-950">What customers receive</h3>
                </div>
                <div className="space-y-3">
                  {reportOutputs.map((item) => (
                    <div key={item} className="flex gap-2 text-sm font-semibold leading-5 text-gray-700">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="aql-decision" className="py-12 text-white" style={{ backgroundColor: '#111827' }}>
        <div className="cosun-shell">
          <div>
            <div className="max-w-4xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-200">AQL decision standard</p>
              <h2 className="text-2xl font-black leading-tight md:text-3xl">
                AQL is not a separate article. It is the rule behind the inspection decision.
              </h2>
              <p className="mt-4 text-sm font-semibold leading-6 text-gray-300">
                COSUN retains the current AQL tables and calculator, and uses AQL sampling to connect lot size,
                sample size, defect class, acceptance number, and final release advice.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {aqlSteps.map(([title, text], index) => (
                <div
                  key={title}
                  className="rounded-md border border-white/10 p-4"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)' }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-red-200">AQL step {index + 1}</span>
                    <Calculator className="h-4 w-4 text-red-200" />
                  </div>
                  <h3 className="font-black text-white">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-5 text-gray-300">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-sm font-semibold leading-6 text-gray-300">
              Common setup: Critical defects AQL 0, Major defects AQL 2.5, Minor defects AQL 4.0.
              Final values can be adjusted by product risk, order requirement, and customer market.
            </p>
            <Button
              onClick={() => setShowAQLDetails((value) => !value)}
              className="h-10 bg-red-600 px-5 font-semibold text-white hover:bg-red-700"
            >
              {showAQLDetails ? 'Hide Full AQL Tables' : 'Open Full AQL Tables'}
            </Button>
          </div>
        </div>
      </section>

      {showAQLDetails && (
        <section className="bg-white py-12">
          <div className="cosun-shell">
            <AQLContent />
          </div>
        </section>
      )}

      <section className="bg-white py-12">
        <div className="cosun-shell">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Product standards library</p>
              <h2 className="text-2xl font-black leading-tight md:text-3xl">AQL plus product-specific standards.</h2>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-gray-600">
              AQL answers how many pieces to inspect and how to judge defect tolerance. Category standards help define what to inspect for each product type.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {standardCategories.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigateTo(item.page)}
                  className="rounded-md border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-red-300 hover:bg-white hover:shadow-sm"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-gray-600">{item.codes}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.08em] text-red-700">Detailed standards</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Visible follow-up</p>
              <h2 className="text-2xl font-black leading-tight">We do not only report defects. We help close the loop.</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ['Find', 'Record defects with photos, location, quantity, and severity.'],
                  ['Push', 'Coordinate supplier correction, replacement, sorting, or rework evidence.'],
                  ['Track', 'Keep inspection reports, issue history, and follow-up files in the customer workspace.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-md bg-gray-50 p-4">
                    <h3 className="font-black text-gray-950">{title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-red-100 bg-red-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-700" />
                <h3 className="text-lg font-black text-gray-950">What you can send</h3>
              </div>
              <div className="space-y-3 text-sm font-semibold leading-6 text-gray-700">
                <p>Order number, supplier contact, product photos, sample requirements, packing list, inspection checklist, AQL level, or shipment date.</p>
                <p>COSUN can arrange inspection, apply the right sampling rule, report findings, and follow the supplier response before shipment.</p>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-black text-red-700">
                <Truck className="h-4 w-4" />
                Before goods leave the factory, make the decision visible.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="request-service" className="border-t border-gray-200 bg-white py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Request QC service</p>
              <h2 className="text-2xl font-black leading-tight text-gray-950 md:text-3xl">
                Send the real order details. COSUN turns them into an inspection brief.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-gray-600">
                You can submit a supplier, sample photo, product link, packing requirement, shipment date, or AQL level. We check the physical goods, packaging, quantity, labels, and loading status before the decision is made.
              </p>
              <div className="mt-6">
                <QCServiceRequestForm
                  trigger={
                    <Button size="lg" className="bg-red-600 px-6 font-black text-white hover:bg-red-700">
                      Request QC Service
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:col-span-3">
              {requestEvidence.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="overflow-hidden rounded-md border border-gray-200 bg-gray-50 shadow-sm">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/65 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded bg-white/95 px-3 py-2 text-xs font-black text-gray-950 shadow-sm">
                        <Icon className="h-4 w-4 text-red-600" />
                        {item.title}
                      </div>
                    </div>
                    <p className="p-4 text-sm font-semibold leading-6 text-gray-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
