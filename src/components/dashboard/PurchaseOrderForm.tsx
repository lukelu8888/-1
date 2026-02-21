import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface PurchaseOrderFormProps {
  orderNumber?: string;
  quotationNumber?: string;
  onClose?: () => void;
}

export function PurchaseOrderForm({ 
  orderNumber = 'PO-2025-001234',
  quotationNumber = 'QT-2025-001234',
  onClose 
}: PurchaseOrderFormProps) {
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
        <h2 className="text-xl text-gray-900">Purchase Order</h2>
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
      <div className="purchase-order-form bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">PURCHASE ORDER</h1>
              <p className="text-sm text-gray-600">Official Order Confirmation</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">PO NUMBER</p>
                <p className="text-lg">{orderNumber}</p>
              </div>
              <p className="text-xs text-gray-600">Date: January 25, 2025</p>
              <p className="text-xs text-gray-600">Ref Quote: {quotationNumber}</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-gray-900">
            <strong>⚠️ NOTICE:</strong> This is an official purchase order. Please confirm acceptance within 2 business days. 
            Any changes to this order must be agreed upon in writing by both parties.
          </p>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Buyer */}
          <div className="border-2 border-red-600 rounded p-4 bg-red-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-red-600 pb-2">BUYER / BILL TO</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Mr. Robert Williams</p>
                <p className="text-xs text-gray-600">Purchasing Manager</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Billing Address</p>
                <p className="text-gray-900">2500 E Warehouse Way</p>
                <p className="text-gray-900">Ontario, CA 91761, USA</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">Tel: +1-909-555-0187</p>
                <p className="text-gray-900">Email: robert.williams@buildpro.com</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Tax ID / Business License</p>
                <p className="text-gray-900">US-TAX-123456789</p>
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">SUPPLIER / VENDOR</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Ms. Li Wei</p>
                <p className="text-xs text-gray-600">Export Sales Manager</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Factory Address</p>
                <p className="text-gray-900">Industrial Park, Minhou County</p>
                <p className="text-gray-900">Fuzhou, Fujian Province, China 350100</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
                <p className="text-gray-900">Email: export@gaoshengdafu.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Information */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">SHIPPING & DELIVERY INFORMATION</h3>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Delivery Address:</p>
              <p className="text-gray-900">BuildPro Distribution LLC</p>
              <p className="text-gray-900">Warehouse B2</p>
              <p className="text-gray-900">2500 E Warehouse Way</p>
              <p className="text-gray-900">Ontario, CA 91761, USA</p>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Shipping Terms:</p>
              <p className="text-gray-900">Incoterm: <strong>CIF Los Angeles</strong></p>
              <p className="text-gray-900">Port of Loading: Xiamen, China</p>
              <p className="text-gray-900">Port of Discharge: Los Angeles, USA</p>
              <p className="text-gray-900">Container: 2 × 40ft HC</p>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Delivery Schedule:</p>
              <p className="text-gray-900">Required Delivery: <strong>March 30, 2025</strong></p>
              <p className="text-gray-900">Production Start: Feb 1, 2025</p>
              <p className="text-gray-900">Est. Shipment: March 1, 2025</p>
              <p className="text-gray-900">Transit Time: 25-30 days</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            ORDER DETAILS
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs">Line</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs">Product Code</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs">Description & Specifications</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">Ordered Qty</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs">Unit Price<br />(CIF)</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs">Line Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">1</td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>GSD-FL-400</strong><br />
                    <span className="text-xs">HS Code: 6907.21.00</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>Glazed Ceramic Floor Tiles</strong><br />
                    <span className="text-xs">Size: 400x400mm, Thickness: 9mm</span><br />
                    <span className="text-xs">Color: Beige, Finish: Matt, Non-slip</span><br />
                    <span className="text-xs">Packing: 4 pcs/carton, 0.64 SQM/carton</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">32,800</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$8.50</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$278,800.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">2</td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>GSD-WL-306</strong><br />
                    <span className="text-xs">HS Code: 6907.22.00</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>Ceramic Wall Tiles</strong><br />
                    <span className="text-xs">Size: 300x600mm, Thickness: 8mm</span><br />
                    <span className="text-xs">Color: White, Finish: Glossy</span><br />
                    <span className="text-xs">Packing: 6 pcs/carton, 1.08 SQM/carton</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">22,500</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$7.10</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$159,750.00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">3</td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>GSD-MS-25</strong><br />
                    <span className="text-xs">HS Code: 6907.40.00</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>Glass Mosaic Tiles</strong><br />
                    <span className="text-xs">Chip Size: 25x25mm, Sheet: 300x300mm</span><br />
                    <span className="text-xs">Color: Blue/Green Mix, Mesh mounted</span><br />
                    <span className="text-xs">Packing: 11 sheets/carton, 0.99 SQM/carton</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">6,500</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$13.90</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$90,350.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Payment Summary */}
            <div>
              <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
                PAYMENT SUMMARY
              </h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Subtotal (Product Value)</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$528,900.00</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Discount (3% for volume)</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-red-600">-$15,867.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Net Product Value</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$513,033.00</td>
                  </tr>
                  <tr className="bg-red-50 border-t-2 border-red-600">
                    <td className="border border-gray-300 px-3 py-2">
                      <strong className="text-gray-900 text-lg">TOTAL ORDER VALUE</strong>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      <strong className="text-red-600 text-xl">$513,033.00</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Schedule */}
            <div>
              <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
                PAYMENT SCHEDULE
              </h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs text-gray-700">Milestone</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">%</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs text-gray-700">Amount</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-700">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Deposit</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">30%</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$153,909.90</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">Jan 28, 2025</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Balance</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">70%</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$359,123.10</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">Feb 28, 2025</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-3">
            TERMS AND CONDITIONS
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Payment Terms:</p>
              <ul className="text-gray-900 space-y-1">
                <li>• Method: Telegraphic Transfer (T/T)</li>
                <li>• 30% deposit upon PO confirmation</li>
                <li>• 70% balance before shipment</li>
                <li>• Payment must clear before production start</li>
                <li>• Bank charges borne by respective parties</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Quality Assurance:</p>
              <ul className="text-gray-900 space-y-1">
                <li>• Grade A quality, ISO 9001 certified</li>
                <li>• CE marking on all products</li>
                <li>• Pre-shipment inspection allowed</li>
                <li>• Breakage tolerance: maximum 5%</li>
                <li>• Quality claim period: 30 days after delivery</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Delivery Terms:</p>
              <ul className="text-gray-900 space-y-1">
                <li>• Production lead time: 25-30 days</li>
                <li>• Shipping method: Sea freight (CIF)</li>
                <li>• Notify buyer 7 days before shipment</li>
                <li>• Provide shipping documents within 5 days</li>
                <li>• Force majeure clause applies</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Order Modifications:</p>
              <ul className="text-gray-900 space-y-1">
                <li>• Changes allowed before production start</li>
                <li>• Written approval required from both parties</li>
                <li>• Cancellation fee: 10% of order value</li>
                <li>• No changes after production begins</li>
                <li>• Partial shipments not accepted</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SPECIAL INSTRUCTIONS & REQUIREMENTS
          </h3>
          
          <div className="border border-gray-300 p-4 rounded bg-blue-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-red-600 mb-2">Packaging Requirements:</p>
                <ul className="text-gray-900 space-y-1">
                  <li>✓ Export standard carton packaging</li>
                  <li>✓ Wooden pallets for floor tiles</li>
                  <li>✓ Corner protection on all boxes</li>
                  <li>✓ Label each carton with: Product code, Size, Color, Quantity, Gross/Net weight</li>
                  <li>✓ Shipping marks: "BUILDPRO - PO-2025-001234 - USA"</li>
                </ul>
              </div>
              <div>
                <p className="text-xs text-red-600 mb-2">Documentation Required:</p>
                <ul className="text-gray-900 space-y-1">
                  <li>✓ Commercial Invoice (3 originals)</li>
                  <li>✓ Packing List (3 copies)</li>
                  <li>✓ Bill of Lading (1 original set)</li>
                  <li>✓ Certificate of Origin (Form A)</li>
                  <li>✓ Quality Inspection Certificate</li>
                  <li>✓ Insurance Policy (if CIF)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Authorization & Acceptance */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            AUTHORIZATION & ACCEPTANCE
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Buyer Authorization */}
            <div className="border-2 border-red-600 p-4 rounded bg-red-50">
              <p className="text-xs text-red-600 mb-3">BUYER AUTHORIZATION:</p>
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
                  <p className="text-gray-900">Purchasing Manager</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">January 25, 2025</p>
                </div>
                <div>
                  <p className="text-gray-600">Company Seal:</p>
                  <div className="border border-gray-400 rounded px-2 py-1 text-center">
                    <p className="text-xs text-gray-700">BuildPro</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                By signing, I confirm that this purchase order is authorized and binding.
              </p>
            </div>

            {/* Supplier Acceptance */}
            <div className="border border-gray-300 p-4 rounded bg-gray-50">
              <p className="text-xs text-red-600 mb-3">SUPPLIER ACCEPTANCE (To be completed):</p>
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
                  <p className="text-gray-600">Company Seal:</p>
                  <div className="border border-gray-400 rounded h-10"></div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                By signing, supplier accepts this PO and agrees to all terms stated herein.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="border-2 border-yellow-400 bg-yellow-50 p-4 rounded mb-6">
          <p className="text-sm text-gray-900 mb-2">
            <strong>📋 IMPORTANT NOTES:</strong>
          </p>
          <ul className="text-sm text-gray-900 space-y-1">
            <li>1. This Purchase Order constitutes a legally binding agreement between buyer and supplier.</li>
            <li>2. Supplier must acknowledge receipt and acceptance of this PO within 2 business days.</li>
            <li>3. Any deviation from the specifications must be communicated immediately.</li>
            <li>4. Delay in delivery beyond agreed date may result in penalties or order cancellation.</li>
            <li>5. All disputes shall be resolved through negotiation or arbitration in buyer's jurisdiction.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p>This is a computer-generated purchase order and is valid without signature if transmitted electronically.</p>
          <p className="mt-2">
            <strong>BuildPro Distribution LLC</strong> | 2500 E Warehouse Way, Ontario, CA 91761, USA | 
            Tel: +1-909-555-0187 | Email: purchasing@buildpro.com | Tax ID: US-TAX-123456789
          </p>
          <p className="mt-2 text-gray-500">
            PO Generated: January 25, 2025 | Document ID: {orderNumber} | Page 1 of 1
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
          .purchase-order-form {
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
          .purchase-order-form {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}
