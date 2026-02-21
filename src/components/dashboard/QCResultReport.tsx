import { Button } from '../ui/button';
import { Download, Printer, CheckCircle2, XCircle, AlertCircle, FileCheck, Package, Calendar, MapPin, User, Building2 } from 'lucide-react';

interface QCResultReportProps {
  reportNumber?: string;
  orderNumber?: string;
  onClose?: () => void;
}

export function QCResultReport({ 
  reportNumber = 'QCR-2025-0228',
  orderNumber = 'PO-2025-001',
  onClose 
}: QCResultReportProps) {
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
        <h2 className="text-xl text-gray-900">QC Result Report</h2>
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

      {/* Printable A4 Form with 20mm margins */}
      <div className="bg-white" style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        margin: '0 auto',
        padding: '20mm',
        boxSizing: 'border-box'
      }}>
        {/* Company Header */}
        <div className="border-b-4 border-red-600 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl text-red-600 mb-2" style={{ fontWeight: 700 }}>COSUN</h1>
              <p className="text-sm text-gray-700 mb-1">Fujian Gaoshengda Wealth Building Materials Co., Ltd.</p>
              <p className="text-xs text-gray-600">Quality Assurance Department</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg mb-3">
                <p className="text-xs mb-1">REPORT NO.</p>
                <p className="text-2xl" style={{ fontWeight: 700 }}>{reportNumber}</p>
              </div>
              <div className="bg-green-600 text-white px-6 py-2 rounded-lg">
                <p className="text-lg" style={{ fontWeight: 700 }}>✓ PASSED</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>QUALITY CONTROL RESULT REPORT</h2>
          <p className="text-sm text-gray-600">Final Inspection Result - Pre-Shipment Quality Assessment</p>
          <div className="w-32 h-1 bg-red-600 mx-auto mt-3"></div>
        </div>

        {/* Result Summary - Highlighted Box */}
        <div className="bg-green-50 border-4 border-green-600 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-600 rounded-full p-3">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl text-green-900 mb-1" style={{ fontWeight: 700 }}>INSPECTION PASSED</h3>
              <p className="text-sm text-green-700">All products meet the required quality standards and specifications</p>
              <p className="text-sm text-green-700">Approved for shipment to customer</p>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border-2 border-green-500 text-center">
              <p className="text-xs text-gray-600 mb-1">Acceptance Rate</p>
              <p className="text-3xl text-green-600" style={{ fontWeight: 700 }}>99.8%</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-green-500 text-center">
              <p className="text-xs text-gray-600 mb-1">Major Defects</p>
              <p className="text-3xl text-green-600" style={{ fontWeight: 700 }}>0</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-yellow-400 text-center">
              <p className="text-xs text-gray-600 mb-1">Minor Defects</p>
              <p className="text-3xl text-yellow-600" style={{ fontWeight: 700 }}>8</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-green-500 text-center">
              <p className="text-xs text-gray-600 mb-1">Total Inspected</p>
              <p className="text-3xl text-green-600" style={{ fontWeight: 700 }}>5,000</p>
            </div>
          </div>
        </div>

        {/* Order & Inspection Information */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Left Column - Order Details */}
          <div className="border-2 border-gray-300 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-red-600">
              <Package className="w-5 h-5 text-red-600" />
              <h3 className="text-sm text-red-600" style={{ fontWeight: 700 }}>ORDER INFORMATION</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Order:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>ABC Trading Co.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Product Name:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>LED Panel Light</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model Number:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>LP-6060-48W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Quantity:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>5,000 pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>$77,500.00</span>
              </div>
            </div>
          </div>

          {/* Right Column - Inspection Details */}
          <div className="border-2 border-gray-300 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-red-600">
              <FileCheck className="w-5 h-5 text-red-600" />
              <h3 className="text-sm text-red-600" style={{ fontWeight: 700 }}>INSPECTION DETAILS</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Inspection Date:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>2025-02-28</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inspector:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>Michael Zhang (SGS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inspection Type:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>Pre-Shipment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inspection Location:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>Guangzhou Warehouse</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AQL Level:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>2.5 (Standard)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>6 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Results Table */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-red-600">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm text-red-600" style={{ fontWeight: 700 }}>DETAILED INSPECTION RESULTS</h3>
          </div>
          
          <table className="w-full border-2 border-gray-300 text-sm">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="border border-gray-300 p-3 text-left" style={{ fontWeight: 700 }}>Inspection Item</th>
                <th className="border border-gray-300 p-3 text-center" style={{ fontWeight: 700 }}>Standard</th>
                <th className="border border-gray-300 p-3 text-center" style={{ fontWeight: 700 }}>Sample Size</th>
                <th className="border border-gray-300 p-3 text-center" style={{ fontWeight: 700 }}>Result</th>
                <th className="border border-gray-300 p-3 text-center" style={{ fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="border border-gray-300 p-3">Appearance & Finish</td>
                <td className="border border-gray-300 p-3 text-center">No visible defects</td>
                <td className="border border-gray-300 p-3 text-center">200 pcs</td>
                <td className="border border-gray-300 p-3 text-center">197 Pass / 3 Minor</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">Dimensions</td>
                <td className="border border-gray-300 p-3 text-center">600×600×12mm ±2mm</td>
                <td className="border border-gray-300 p-3 text-center">125 pcs</td>
                <td className="border border-gray-300 p-3 text-center">125 Pass / 0 Fail</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3">Power & Voltage</td>
                <td className="border border-gray-300 p-3 text-center">48W ±5%, 85-265V</td>
                <td className="border border-gray-300 p-3 text-center">80 pcs</td>
                <td className="border border-gray-300 p-3 text-center">80 Pass / 0 Fail</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">Light Color Temperature</td>
                <td className="border border-gray-300 p-3 text-center">6000K ±300K</td>
                <td className="border border-gray-300 p-3 text-center">80 pcs</td>
                <td className="border border-gray-300 p-3 text-center">80 Pass / 0 Fail</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3">Luminous Flux</td>
                <td className="border border-gray-300 p-3 text-center">&gt;4800 lm</td>
                <td className="border border-gray-300 p-3 text-center">80 pcs</td>
                <td className="border border-gray-300 p-3 text-center">80 Pass / 0 Fail</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">Packaging Quality</td>
                <td className="border border-gray-300 p-3 text-center">Intact, proper labels</td>
                <td className="border border-gray-300 p-3 text-center">200 pcs</td>
                <td className="border border-gray-300 p-3 text-center">195 Pass / 5 Minor</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3">Labeling & Marking</td>
                <td className="border border-gray-300 p-3 text-center">Per customer spec</td>
                <td className="border border-gray-300 p-3 text-center">200 pcs</td>
                <td className="border border-gray-300 p-3 text-center">200 Pass / 0 Fail</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">Safety Compliance</td>
                <td className="border border-gray-300 p-3 text-center">CE, RoHS certified</td>
                <td className="border border-gray-300 p-3 text-center">80 pcs</td>
                <td className="border border-gray-300 p-3 text-center">80 Pass / 0 Fail</td>
                <td className="border border-gray-300 p-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded" style={{ fontWeight: 600 }}>✓ PASS</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Defect Summary */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-red-600">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm text-red-600" style={{ fontWeight: 700 }}>DEFECT SUMMARY</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
              <p className="text-xs text-gray-600 mb-1">Critical Defects</p>
              <p className="text-2xl text-green-600" style={{ fontWeight: 700 }}>0</p>
              <p className="text-xs text-green-700 mt-1">Acceptance: 0 allowed</p>
            </div>
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
              <p className="text-xs text-gray-600 mb-1">Major Defects</p>
              <p className="text-2xl text-green-600" style={{ fontWeight: 700 }}>0</p>
              <p className="text-xs text-green-700 mt-1">Acceptance: &lt;10 allowed</p>
            </div>
            <div className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">Minor Defects</p>
              <p className="text-2xl text-yellow-600" style={{ fontWeight: 700 }}>8</p>
              <p className="text-xs text-yellow-700 mt-1">Acceptance: &lt;50 allowed</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2" style={{ fontWeight: 600 }}>Minor Defects Details:</p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• 3 pcs - Minor scratches on frame (&lt;5mm)</li>
              <li>• 5 pcs - Packaging label slightly misaligned</li>
            </ul>
            <p className="text-xs text-green-700 mt-3" style={{ fontWeight: 600 }}>Note: All minor defects are within acceptable AQL 2.5 standards and do not affect product functionality.</p>
          </div>
        </div>

        {/* Conclusion */}
        <div className="bg-green-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-full p-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl mb-2" style={{ fontWeight: 700 }}>FINAL CONCLUSION</h3>
              <p className="text-sm leading-relaxed mb-2">
                Based on the comprehensive quality control inspection conducted on 2025-02-28, all products meet the required quality standards and specifications. The acceptance rate of 99.8% exceeds the minimum requirement, with zero critical and major defects found.
              </p>
              <p className="text-sm leading-relaxed">
                <span style={{ fontWeight: 700 }}>DECISION: APPROVED FOR SHIPMENT</span> - The goods are cleared for packaging and shipment to the customer.
              </p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="border-t-2 border-gray-400 pt-4">
            <p className="text-xs text-gray-600 mb-2">QC Inspector</p>
            <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>Michael Zhang</p>
            <p className="text-xs text-gray-500">SGS Certification</p>
            <p className="text-xs text-gray-500 mt-2">Date: 2025-02-28</p>
          </div>
          <div className="border-t-2 border-gray-400 pt-4">
            <p className="text-xs text-gray-600 mb-2">QC Manager</p>
            <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>Wang Ming</p>
            <p className="text-xs text-gray-500">COSUN QA Department</p>
            <p className="text-xs text-gray-500 mt-2">Date: 2025-02-28</p>
          </div>
          <div className="border-t-2 border-gray-400 pt-4">
            <p className="text-xs text-gray-600 mb-2">Authorized By</p>
            <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>Chen Li</p>
            <p className="text-xs text-gray-500">Operations Director</p>
            <p className="text-xs text-gray-500 mt-2">Date: 2025-02-28</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 text-xs text-gray-500 text-center">
          <p className="mb-1">Fujian Gaoshengda Wealth Building Materials Co., Ltd.</p>
          <p className="mb-1">Address: Industrial Zone, Fuzhou, Fujian Province, China | Tel: +86-591-8888-8888</p>
          <p>Email: qc@cosun-buildingmaterials.com | Website: www.cosun-buildingmaterials.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
