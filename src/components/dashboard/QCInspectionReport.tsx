import { Button } from '../ui/button';
import { Download, Printer, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface QCInspectionReportProps {
  reportNumber?: string;
  orderNumber?: string;
  onClose?: () => void;
}

export function QCInspectionReport({ 
  reportNumber = 'QCR-2025-0228',
  orderNumber = 'PO-2025-001',
  onClose 
}: QCInspectionReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl text-gray-900">QC Inspection Report</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Printable Form */}
      <div className="qc-report bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">QC INSPECTION REPORT</h1>
              <p className="text-sm text-gray-600">Pre-Shipment Quality Control Report</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">REPORT NO.</p>
                <p className="text-lg">{reportNumber}</p>
              </div>
              <div className="bg-green-600 text-white px-4 py-1 rounded text-sm">
                ✓ PASSED
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Summary */}
        <div className="bg-green-50 border-2 border-green-600 rounded p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg text-green-900">INSPECTION RESULT: PASSED</h3>
              <p className="text-sm text-green-700">Products meet quality standards and are approved for shipment</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm mt-4">
            <div className="bg-white p-2 rounded border border-green-200">
              <p className="text-xs text-gray-600">Acceptance Rate</p>
              <p className="text-xl text-green-600">99.8%</p>
            </div>
            <div className="bg-white p-2 rounded border border-green-200">
              <p className="text-xs text-gray-600">Major Defects</p>
              <p className="text-xl text-green-600">0</p>
            </div>
            <div className="bg-white p-2 rounded border border-yellow-200">
              <p className="text-xs text-gray-600">Minor Defects</p>
              <p className="text-xl text-yellow-600">8</p>
            </div>
            <div className="bg-white p-2 rounded border border-green-200">
              <p className="text-xs text-gray-600">AQL Level</p>
              <p className="text-xl text-green-600">2.5</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">INSPECTION DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Inspection Date:</p>
                <p className="text-gray-900">February 28, 2025</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Inspection Time:</p>
                <p className="text-gray-900">09:00 AM - 05:00 PM</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Duration:</p>
                <p className="text-gray-900">6 hours</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Inspection Type:</p>
                <p className="text-gray-900">Pre-Shipment (PSI)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Standard:</p>
                <p className="text-gray-900">AQL 2.5 / ISO 2859-1</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Location:</p>
                <p className="text-gray-900">Guangzhou Warehouse</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">INSPECTOR INFORMATION</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Inspection Company</p>
                <p className="font-medium text-gray-900">SGS (Société Générale de Surveillance)</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Inspector Name</p>
                <p className="text-gray-900">Michael Zhang</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Inspector ID</p>
                <p className="text-gray-900">SGS-GZ-0456</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Qualification</p>
                <p className="text-gray-900">Senior QC Inspector</p>
                <p className="text-xs text-gray-600">8 years experience</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">michael.zhang@sgs.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Reference */}
        <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-6">
          <h3 className="text-sm text-red-600 mb-3">ORDER REFERENCE</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600">PO Number</p>
              <p className="font-medium text-gray-900">{orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Buyer</p>
              <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Supplier</p>
              <p className="font-medium text-gray-900">Gaoshengda Fuji</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Order Value</p>
              <p className="font-medium text-gray-900">$77,500.00</p>
            </div>
          </div>
        </div>

        {/* Inspection Results by Product */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">DETAILED INSPECTION RESULTS</h3>
          
          {/* Product 1 */}
          <div className="border border-gray-300 rounded mb-4 overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Product 1: LED Panel Light 60x60cm</p>
                <p className="text-xs text-gray-600">SKU: LPL-6060-48W-4000K | Qty: 2,000 pcs</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">PASSED</span>
              </div>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-xs text-gray-600">Inspection Item</th>
                    <th className="text-center py-2 text-xs text-gray-600">Sample Size</th>
                    <th className="text-center py-2 text-xs text-gray-600">Defects Found</th>
                    <th className="text-center py-2 text-xs text-gray-600">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Dimensions (600x600mm ±2mm)</td>
                    <td className="text-center text-gray-900">125 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Luminous Flux (≥4800lm)</td>
                    <td className="text-center text-gray-900">20 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Color Temperature (4000K ±200K)</td>
                    <td className="text-center text-gray-900">20 pcs</td>
                    <td className="text-center text-gray-900">2 minor</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Frame Finish & Coating</td>
                    <td className="text-center text-gray-900">125 pcs</td>
                    <td className="text-center text-gray-900">1 minor</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Functionality Test (On/Off)</td>
                    <td className="text-center text-gray-900">50 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-900">Packaging Quality</td>
                    <td className="text-center text-gray-900">125 boxes</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Product 2 */}
          <div className="border border-gray-300 rounded mb-4 overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Product 2: LED Downlight 8 inch</p>
                <p className="text-xs text-gray-600">SKU: LDL-8IN-25W-3000K | Qty: 2,000 pcs</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">PASSED</span>
              </div>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-xs text-gray-600">Inspection Item</th>
                    <th className="text-center py-2 text-xs text-gray-600">Sample Size</th>
                    <th className="text-center py-2 text-xs text-gray-600">Defects Found</th>
                    <th className="text-center py-2 text-xs text-gray-600">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Cut-out Diameter (203mm ±2mm)</td>
                    <td className="text-center text-gray-900">125 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Dimming Function (0-100%)</td>
                    <td className="text-center text-gray-900">30 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Heat Dissipation (Surface temp)</td>
                    <td className="text-center text-gray-900">10 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Installation Clips Quality</td>
                    <td className="text-center text-gray-900">125 pcs</td>
                    <td className="text-center text-gray-900">3 minor</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-900">Driver Performance</td>
                    <td className="text-center text-gray-900">20 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Product 3 */}
          <div className="border border-gray-300 rounded mb-4 overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Product 3: LED Track Light</p>
                <p className="text-xs text-gray-600">SKU: LTL-30W-4000K-ADJ | Qty: 1,000 pcs</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">PASSED</span>
              </div>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-xs text-gray-600">Inspection Item</th>
                    <th className="text-center py-2 text-xs text-gray-600">Sample Size</th>
                    <th className="text-center py-2 text-xs text-gray-600">Defects Found</th>
                    <th className="text-center py-2 text-xs text-gray-600">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Rotation Mechanism (350°)</td>
                    <td className="text-center text-gray-900">80 pcs</td>
                    <td className="text-center text-gray-900">2 minor</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Track Adapter Compatibility</td>
                    <td className="text-center text-gray-900">80 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">Beam Angle (24° ±3°)</td>
                    <td className="text-center text-gray-900">15 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-900">Finish & Appearance</td>
                    <td className="text-center text-gray-900">80 pcs</td>
                    <td className="text-center text-gray-900">0</td>
                    <td className="text-center text-green-600">✓ Pass</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Packaging Inspection */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            PACKAGING & LABELING INSPECTION
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Individual Packaging:</p>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-900">Inner box quality</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-900">Protection materials</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-900">Product labeling</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-900">Barcode scanning</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Master Cartons:</p>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-900">Carton strength</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-900">Shipping marks</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-900">Strapping/Sealing</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-900">Pallet configuration</td>
                    <td className="text-right text-green-600">✓ Pass</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quantity Verification */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            QUANTITY VERIFICATION
          </h3>
          
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs">Product</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs">Ordered Qty</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs">Packed Qty</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs">Variance</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-gray-900">LED Panel Light 60x60cm</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">2,000 pcs</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">2,000 pcs</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">0</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">✓ OK</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-gray-900">LED Downlight 8 inch</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">2,000 pcs</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">2,000 pcs</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">0</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">✓ OK</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-gray-900">LED Track Light</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1,000 pcs</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1,000 pcs</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">0</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">✓ OK</td>
              </tr>
              <tr className="bg-green-50">
                <td colSpan={1} className="border border-gray-300 px-3 py-2 text-gray-900"><strong>TOTAL</strong></td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900"><strong>5,000 pcs</strong></td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900"><strong>5,000 pcs</strong></td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600"><strong>100% Match</strong></td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600"><strong>✓ VERIFIED</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Defects Summary */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            DEFECTS SUMMARY
          </h3>
          
          <div className="border border-gray-300 rounded p-4 bg-yellow-50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 text-xs text-gray-600">Defect Type</th>
                  <th className="text-center py-2 text-xs text-gray-600">Quantity</th>
                  <th className="text-left py-2 text-xs text-gray-600">Description</th>
                  <th className="text-center py-2 text-xs text-gray-600">Classification</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Color variation</td>
                  <td className="text-center text-gray-900">2</td>
                  <td className="text-gray-900">Slight color temp variation (+250K)</td>
                  <td className="text-center text-yellow-600">Minor</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Frame coating</td>
                  <td className="text-center text-gray-900">1</td>
                  <td className="text-gray-900">Small scratch on frame (&lt;5mm)</td>
                  <td className="text-center text-yellow-600">Minor</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Clip tightness</td>
                  <td className="text-center text-gray-900">3</td>
                  <td className="text-gray-900">Installation clip slightly loose</td>
                  <td className="text-center text-yellow-600">Minor</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Rotation stiffness</td>
                  <td className="text-center text-gray-900">2</td>
                  <td className="text-gray-900">Rotation mechanism slightly stiff</td>
                  <td className="text-center text-yellow-600">Minor</td>
                </tr>
                <tr className="bg-green-100">
                  <td className="py-2 text-gray-900"><strong>TOTAL</strong></td>
                  <td className="text-center text-gray-900"><strong>8</strong></td>
                  <td className="text-gray-900"><strong>All within acceptable limits</strong></td>
                  <td className="text-center text-green-600"><strong>ACCEPTABLE</strong></td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-600 mt-3">
              * All defects are classified as minor and within AQL 2.5 acceptable limits. No critical or major defects found.
            </p>
          </div>
        </div>

        {/* Inspector's Comments */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            INSPECTOR'S COMMENTS & RECOMMENDATIONS
          </h3>
          
          <div className="border border-gray-300 p-4 rounded">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-green-600 font-medium mb-1">✓ STRENGTHS:</p>
                <ul className="list-disc list-inside text-gray-900 space-y-1 ml-3">
                  <li>Overall product quality is excellent and consistent across all items</li>
                  <li>Packaging is robust and suitable for long-distance shipping</li>
                  <li>All certifications and test reports are complete and valid</li>
                  <li>Factory QC procedures appear to be effective</li>
                  <li>Products meet all specified technical requirements</li>
                </ul>
              </div>
              
              <div>
                <p className="text-yellow-600 font-medium mb-1">⚠ MINOR OBSERVATIONS:</p>
                <ul className="list-disc list-inside text-gray-900 space-y-1 ml-3">
                  <li>A few minor cosmetic issues noted but within acceptable tolerances</li>
                  <li>Recommend tightening installation clips during packing in future orders</li>
                  <li>Color temperature calibration could be slightly improved for better consistency</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-600 p-3 mt-3">
                <p className="font-medium text-green-900">FINAL RECOMMENDATION:</p>
                <p className="text-gray-900 mt-1">
                  <strong>APPROVED FOR SHIPMENT</strong> - All products meet quality standards and are ready for export. 
                  The minor defects found are within acceptable limits and do not affect functionality or commercial value.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Attached */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            INSPECTION PHOTOS (Sample)
          </h3>
          
          <div className="border border-gray-300 p-4 rounded bg-gray-50">
            <p className="text-sm text-gray-900 mb-2">
              Total of 156 photos taken during inspection (attached separately as QC_Photos.zip)
            </p>
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
              <div className="border border-gray-300 bg-white p-2 rounded text-center">
                <p>📷 Product overview</p>
                <p className="text-gray-900">45 photos</p>
              </div>
              <div className="border border-gray-300 bg-white p-2 rounded text-center">
                <p>📷 Testing process</p>
                <p className="text-gray-900">38 photos</p>
              </div>
              <div className="border border-gray-300 bg-white p-2 rounded text-center">
                <p>📷 Packaging</p>
                <p className="text-gray-900">42 photos</p>
              </div>
              <div className="border border-gray-300 bg-white p-2 rounded text-center">
                <p>📷 Defects found</p>
                <p className="text-gray-900">31 photos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            INSPECTOR CERTIFICATION
          </h3>
          
          <div className="border border-gray-300 p-4 rounded">
            <p className="text-sm text-gray-900 mb-4">
              I hereby certify that the inspection was conducted in accordance with the agreed inspection plan and standards. 
              The findings in this report are based on the samples inspected and represent the condition of the products at the time of inspection.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="border-b-2 border-gray-400 mb-2 h-16 flex items-end pb-2">
                  <p className="text-lg text-gray-900" style={{ fontFamily: 'cursive' }}>Michael Zhang</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Inspector Name:</p>
                    <p className="text-gray-900">Michael Zhang</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Inspector ID:</p>
                    <p className="text-gray-900">SGS-GZ-0456</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date:</p>
                    <p className="text-gray-900">Feb 28, 2025</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time:</p>
                    <p className="text-gray-900">17:00</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-red-600 p-3 rounded bg-red-50">
                <p className="text-xs text-red-600 mb-2">SGS Official Stamp:</p>
                <div className="border-2 border-red-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <div className="text-center">
                    <p className="text-sm text-red-600">SGS</p>
                    <p className="text-xs text-red-600">Guangzhou</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p><strong>SGS Testing & Inspection Services</strong> - Guangzhou Branch</p>
          <p className="mt-1">
            This report is for the exclusive use of the client and SGS accepts no responsibility to third parties. | 
            Report valid only with official stamp and signature.
          </p>
          <p className="mt-2 text-gray-500">
            Report Issued: February 28, 2025 17:00 | Document ID: {reportNumber} | Page 1 of 1
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          .qc-report {
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0 !important;
          }
        }
        @media screen {
          .qc-report {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}