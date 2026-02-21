import { Button } from '../ui/button';
import { Download, Printer, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DamageClaimFormProps {
  orderNumber?: string;
  onClose?: () => void;
}

export function DamageClaimForm({ orderNumber = 'PO-2025-001234', onClose }: DamageClaimFormProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white">
      {/* Action Buttons - Hidden when printing */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl text-gray-900">Damage Claim Form</h2>
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

      {/* Printable Form - A4 Standard Size */}
      <div className="damage-claim-form bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl text-gray-900 mb-2">DAMAGE CLAIM FORM</h1>
              <p className="text-sm text-gray-600">Claim for Damaged Goods During Transit/Delivery</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">CLAIM NO.</p>
                <p className="text-lg">DCF-2025-04001</p>
              </div>
              <p className="text-xs text-gray-600">Date: April 2, 2025</p>
            </div>
          </div>
        </div>

        {/* Section 1: Claimant Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 1: CLAIMANT INFORMATION
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Company Name</p>
              <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Contact Person</p>
              <p className="font-medium text-gray-900">Robert Williams - Warehouse Manager</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Address</p>
              <p className="font-medium text-gray-900">2500 E Warehouse Way, Ontario, CA 91761</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Phone / Email</p>
              <p className="font-medium text-gray-900">+1-909-555-0187</p>
              <p className="text-gray-700">robert.williams@customer.com</p>
            </div>
          </div>
        </div>

        {/* Section 2: Supplier Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 2: SUPPLIER INFORMATION
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Supplier Name</p>
              <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Contact Person</p>
              <p className="font-medium text-gray-900">Export Department</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Address</p>
              <p className="font-medium text-gray-900">Fujian Province, China</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Phone / Email</p>
              <p className="font-medium text-gray-900">+86-xxx-xxxx-xxxx</p>
              <p className="text-gray-700">export@gaoshengdafu.com</p>
            </div>
          </div>
        </div>

        {/* Section 3: Shipment Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 3: SHIPMENT & ORDER INFORMATION
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Purchase Order No.</p>
              <p className="font-medium text-gray-900">{orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Invoice No.</p>
              <p className="font-medium text-gray-900">INV-2025-02156</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Invoice Date</p>
              <p className="font-medium text-gray-900">March 1, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Container No.</p>
              <p className="font-medium text-gray-900">CSNU1234567</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Bill of Lading No.</p>
              <p className="font-medium text-gray-900">BL-COSCO-2025-031245</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Arrival Date</p>
              <p className="font-medium text-gray-900">March 30, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Origin Port</p>
              <p className="font-medium text-gray-900">Xiamen Port, China</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Destination Port</p>
              <p className="font-medium text-gray-900">Los Angeles Port, USA</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Inspection Date</p>
              <p className="font-medium text-gray-900">April 1, 2025</p>
            </div>
          </div>
        </div>

        {/* Section 4: Product Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 4: PRODUCT INFORMATION
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs text-gray-700">Product Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs text-gray-700">HS Code</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">Total Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">Unit</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs text-gray-700">Unit Price</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs text-gray-700">Total Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    Glazed Ceramic Floor Tiles<br />
                    <span className="text-xs text-gray-600">Size: 400x400mm, Color: Beige</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">6907.21.00</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">32,800</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$8.50</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$278,800.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Damage Details */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 5: DAMAGE DETAILS
          </h3>
          
          {/* Damage Summary Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs text-gray-700">Damage Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">Cartons Affected</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">Quantity Damaged</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">Damage %</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs text-gray-700">Claim Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">Corner Damage - Broken Tiles</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">3 cartons</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">120 SQM</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">0.37%</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$1,020.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                    <strong>TOTAL CLAIM AMOUNT:</strong>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                    <strong>$1,020.00</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Description */}
          <div className="border border-gray-300 p-4 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-2">Detailed Description of Damage:</p>
            <p className="text-sm text-gray-900 mb-3">
              During unpacking inspection on April 1, 2025, we discovered damage to 3 cartons located in the bottom layer 
              of the container. The cartons showed signs of impact on corners, resulting in broken ceramic tiles. 
              The damage appears to have occurred during transit or handling at the port.
            </p>
            <p className="text-sm text-gray-900 mb-3">
              <strong>Damage Characteristics:</strong>
            </p>
            <ul className="text-sm text-gray-900 list-disc list-inside space-y-1 ml-4">
              <li>Carton corners crushed and torn</li>
              <li>Tiles inside cartons broken at corners (approximately 40 tiles per carton)</li>
              <li>Estimated 120 SQM of tiles rendered unsaleable</li>
              <li>Container seal was intact upon arrival - damage likely occurred before loading or during transit</li>
            </ul>
          </div>
        </div>

        {/* Section 6: Evidence Documentation */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 6: EVIDENCE DOCUMENTATION
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-2">📷 Photographic Evidence</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>✓ 12 photos of damaged cartons (external)</li>
                <li>✓ 15 photos of broken tiles</li>
                <li>✓ 8 photos showing damage patterns</li>
                <li>✓ 5 photos of container condition</li>
              </ul>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-2">📄 Supporting Documents</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>✓ Unpacking Report</li>
                <li>✓ Quality Inspection Report</li>
                <li>✓ Container Inspection (EIR)</li>
                <li>✓ Packing List</li>
                <li>✓ Commercial Invoice</li>
                <li>✓ Bill of Lading</li>
              </ul>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <p className="text-blue-900">
              <strong>Note:</strong> All photographic evidence and supporting documents are attached to this claim form 
              and available for review. Original documents can be provided upon request.
            </p>
          </div>
        </div>

        {/* Section 7: Claim Resolution Request */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 7: CLAIM RESOLUTION REQUEST
          </h3>
          <div className="space-y-3 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-2">Requested Resolution:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-gray-900">Credit Note for Damaged Goods ($1,020.00)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked readOnly />
                  <span className="text-gray-900"><strong>Replacement Shipment (120 SQM)</strong> ✓ Preferred</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-gray-900">Discount on Next Order</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-gray-900">Other: ___________________________</span>
                </label>
              </div>
            </div>
            <div className="border border-gray-300 p-3 rounded bg-yellow-50">
              <p className="text-xs text-gray-600 mb-2">Additional Comments / Special Instructions:</p>
              <p className="text-sm text-gray-900">
                We prefer replacement shipment to be sent with our next regular order (PO-2025-001567) scheduled 
                for June 2025. This will minimize shipping costs and expedite resolution. Please confirm acceptance 
                of this claim within 5 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Section 8: Insurance Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 8: INSURANCE INFORMATION (If Applicable)
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Insurance Company</p>
              <p className="font-medium text-gray-900">Pacific Marine Insurance Co.</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Policy Number</p>
              <p className="font-medium text-gray-900">PMI-2025-CAR-78945</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Claim Filed with Insurance</p>
              <p className="font-medium text-gray-900">Yes - Claim No. IC-2025-04023</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Insurance Claim Status</p>
              <p className="font-medium text-gray-900">Under Review</p>
            </div>
          </div>
        </div>

        {/* Section 9: Declaration & Signatures */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SECTION 9: DECLARATION & SIGNATURES
          </h3>
          <div className="border border-gray-300 p-4 rounded bg-gray-50 mb-4">
            <p className="text-xs text-gray-900 mb-3">
              <strong>Declaration:</strong> I hereby declare that the information provided in this claim form is true, 
              accurate, and complete to the best of my knowledge. I understand that providing false or misleading 
              information may result in rejection of this claim and may affect future business relationships.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Claimant Signature */}
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-3">Claimant (Buyer) Signature:</p>
              <div className="border-b-2 border-gray-400 mb-2 h-16 flex items-end pb-2">
                <p className="text-lg text-gray-900" style={{ fontFamily: 'cursive' }}>Robert Williams</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="text-gray-900">Robert Williams</p>
                </div>
                <div>
                  <p className="text-gray-600">Position:</p>
                  <p className="text-gray-900">Warehouse Manager</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">April 2, 2025</p>
                </div>
                <div>
                  <p className="text-gray-600">Company Stamp:</p>
                  <div className="border border-gray-400 rounded px-2 py-1 text-center">
                    <p className="text-xs text-gray-700">BuildPro</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Acknowledgment */}
            <div className="border border-gray-300 p-4 rounded bg-blue-50">
              <p className="text-xs text-gray-600 mb-3">Supplier Acknowledgment (To be completed by supplier):</p>
              <div className="border-b-2 border-gray-400 mb-2 h-16"></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="text-gray-900">_____________________</p>
                </div>
                <div>
                  <p className="text-gray-600">Position:</p>
                  <p className="text-gray-900">_____________________</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">_____________________</p>
                </div>
                <div>
                  <p className="text-gray-600">Company Stamp:</p>
                  <div className="border border-gray-400 rounded h-10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 10: Internal Use Only */}
        <div className="mb-6 border-t-2 border-gray-800 pt-4">
          <h3 className="bg-gray-800 text-white px-3 py-2 text-sm mb-3">
            SECTION 10: INTERNAL USE ONLY (For Supplier)
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Claim Status:</p>
              <p className="text-gray-900">☐ Approved</p>
              <p className="text-gray-900">☐ Partially Approved</p>
              <p className="text-gray-900">☐ Rejected</p>
              <p className="text-gray-900">☐ Under Review</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Approved Amount:</p>
              <p className="text-gray-900">$ _________________</p>
              <p className="text-xs text-gray-600 mt-2 mb-1">Approved By:</p>
              <p className="text-gray-900">_____________________</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Resolution Method:</p>
              <p className="text-gray-900">☐ Credit Note</p>
              <p className="text-gray-900">☐ Replacement</p>
              <p className="text-gray-900">☐ Discount</p>
              <p className="text-gray-900">☐ Other</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p>This is an official damage claim document. Please retain a copy for your records.</p>
          <p className="mt-2">
            <strong>Contact Information:</strong> BuildPro Distribution LLC | 2500 E Warehouse Way, Ontario, CA 91761 | 
            Phone: +1-909-555-0187 | Email: robert.williams@customer.com
          </p>
          <p className="mt-2 text-gray-500">
            Form Generated: April 2, 2025 | Document ID: DCF-2025-04001 | Page 1 of 1
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 20mm 20mm 20mm 20mm;
          }
          .damage-claim-form {
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0 !important;
            box-sizing: border-box;
          }
          * {
            box-sizing: border-box;
          }
        }
        @media screen {
          .damage-claim-form {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}