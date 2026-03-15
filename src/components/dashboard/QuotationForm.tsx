import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface QuotationFormProps {
  quotationNumber?: string;
  inquiryNumber?: string;
  onClose?: () => void;
}

export function QuotationForm({ 
  quotationNumber = 'QT-2025-001234',
  inquiryNumber = 'ING-2025-001234',
  onClose 
}: QuotationFormProps) {
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
        <h2 className="text-xl text-gray-900">Quotation Form</h2>
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
      <div className="quotation-form bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">QUOTATION</h1>
              <p className="text-sm text-gray-600">Proforma Invoice</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">QUOTATION NO.</p>
                <p className="text-lg">{quotationNumber}</p>
              </div>
              <p className="text-xs text-gray-600">Date: January 18, 2025</p>
              <p className="text-xs text-gray-600">Ref: {inquiryNumber}</p>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Supplier */}
          <div className="border border-gray-300 rounded p-4 bg-red-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">SUPPLIER</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Ms. Li Wei - Export Sales Manager</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Address</p>
                <p className="text-gray-900">Industrial Park, Minhou County</p>
                <p className="text-gray-900">Fuzhou, Fujian Province, China 350100</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
                <p className="text-gray-900">Fax: +86-591-xxxx-xxxx</p>
                <p className="text-gray-900">Email: export@gaoshengdafu.com</p>
              </div>
            </div>
          </div>

          {/* Buyer */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">BUYER</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Mr. Robert Williams - Purchasing Manager</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Address</p>
                <p className="text-gray-900">2500 E Warehouse Way</p>
                <p className="text-gray-900">Ontario, CA 91761, USA</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">Tel: +1-909-555-0187</p>
                <p className="text-gray-900">Email: robert.williams@buildpro.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quotation Summary */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">QUOTATION SUMMARY</h3>
          
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Quotation Date</p>
              <p className="font-medium text-gray-900">January 18, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Valid Until</p>
              <p className="font-medium text-red-600">February 18, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Delivery Terms</p>
              <p className="font-medium text-gray-900">FOB Xiamen / CIF Los Angeles</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Currency</p>
              <p className="font-medium text-gray-900">USD ($)</p>
            </div>
          </div>
        </div>

        {/* Product Quotation */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            PRODUCT QUOTATION
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs">Item</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs">Product Description</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs">Specifications</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">Qty</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs">Unit Price<br />(FOB)</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs">Unit Price<br />(CIF)</th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs">Total Amount<br />(FOB)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">1</td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>Glazed Ceramic Floor Tiles</strong><br />
                    <span className="text-xs text-gray-600">Model: GSD-FL-400</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <span className="text-xs">Size: 400x400mm</span><br />
                    <span className="text-xs">Thickness: 9mm</span><br />
                    <span className="text-xs">Color: Beige</span><br />
                    <span className="text-xs">Finish: Matt</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">32,800</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$7.80</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$8.50</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$255,840.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">2</td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>Wall Tiles</strong><br />
                    <span className="text-xs text-gray-600">Model: GSD-WL-306</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <span className="text-xs">Size: 300x600mm</span><br />
                    <span className="text-xs">Thickness: 8mm</span><br />
                    <span className="text-xs">Color: White</span><br />
                    <span className="text-xs">Finish: Glossy</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">22,500</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$6.50</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$7.10</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$146,250.00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">3</td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <strong>Mosaic Tiles</strong><br />
                    <span className="text-xs text-gray-600">Model: GSD-MS-25</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900">
                    <span className="text-xs">Chip: 25x25mm</span><br />
                    <span className="text-xs">Sheet: 300x300mm</span><br />
                    <span className="text-xs">Color: Blue/Green Mix</span><br />
                    <span className="text-xs">Mesh mounted</span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">6,500</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$12.80</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$13.90</td>
                  <td className="border border-gray-300 px-2 py-2 text-right text-gray-900">$83,200.00</td>
                </tr>
                <tr className="bg-red-50">
                  <td colSpan={7} className="border border-gray-300 px-2 py-2 text-right">
                    <strong className="text-gray-900">SUBTOTAL (FOB Xiamen):</strong>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    <strong className="text-gray-900">$485,290.00</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <div>
              <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
                COST BREAKDOWN (CIF Los Angeles)
              </h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Product Value (FOB)</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$485,290.00</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Ocean Freight</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$12,500.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Marine Insurance (0.5%)</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$2,489.00</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="border border-gray-300 px-3 py-2"><strong className="text-gray-900">TOTAL (CIF)</strong></td>
                    <td className="border border-gray-300 px-3 py-2 text-right"><strong className="text-red-600 text-lg">$500,279.00</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Packing Details */}
            <div>
              <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
                CONTAINER LOADING
              </h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Container Type</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">2 × 40ft HC</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Total Cartons</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">2,050 cartons</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Total Gross Weight</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">52,800 KG</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-gray-900">Total Volume</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">135 CBM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-3">
            TERMS & CONDITIONS
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Payment Terms:</p>
              <p className="text-gray-900 mb-1"><strong>Option 1 (Recommended):</strong></p>
              <p className="text-gray-900 mb-2">• 30% T/T deposit upon order confirmation</p>
              <p className="text-gray-900 mb-2">• 70% T/T balance before shipment</p>
              <p className="text-gray-900"><strong>Option 2:</strong></p>
              <p className="text-gray-900">• 100% Irrevocable L/C at sight</p>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Production & Delivery:</p>
              <p className="text-gray-900">• Production Lead Time: 25-30 days</p>
              <p className="text-gray-900">• Delivery Time: 3-4 weeks (sea freight)</p>
              <p className="text-gray-900">• Port of Loading: Xiamen, China</p>
              <p className="text-gray-900">• Port of Destination: Los Angeles, USA</p>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Quality & Warranty:</p>
              <p className="text-gray-900">• Grade A quality, ISO 9001 certified</p>
              <p className="text-gray-900">• CE marking included</p>
              <p className="text-gray-900">• Breakage tolerance: max 5%</p>
              <p className="text-gray-900">• Warranty: 1 year from delivery date</p>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Packaging:</p>
              <p className="text-gray-900">• Export standard carton boxes</p>
              <p className="text-gray-900">• Wooden pallets for floor tiles</p>
              <p className="text-gray-900">• Corner protection included</p>
              <p className="text-gray-900">• Clearly labeled with product info</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            ADDITIONAL INFORMATION
          </h3>
          
          <div className="border border-gray-300 p-4 rounded bg-blue-50 text-sm">
            <p className="text-gray-900 mb-2"><strong>What's Included:</strong></p>
            <ul className="grid grid-cols-2 gap-2 text-gray-900">
              <li>✓ Free product samples (5 pcs each item)</li>
              <li>✓ Complete product catalog</li>
              <li>✓ Test reports (slip resistance, water absorption)</li>
              <li>✓ CE certificates</li>
              <li>✓ Installation guidelines</li>
              <li>✓ Care & maintenance instructions</li>
            </ul>
            
            <p className="text-gray-900 mt-3 mb-2"><strong>Special Offers:</strong></p>
            <ul className="text-gray-900 space-y-1">
              <li>• 3% discount for orders above $500,000</li>
              <li>• Free customization service for orders above $300,000</li>
              <li>• Long-term partnership benefits available</li>
            </ul>
          </div>
        </div>

        {/* Banking Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            BANKING INFORMATION
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm border border-gray-300 p-4 rounded bg-gray-50">
            <div>
              <p className="text-xs text-gray-600 mb-1">Bank Name</p>
              <p className="text-gray-900">Bank of China, Fuzhou Branch</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Account Name</p>
              <p className="text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Account Number</p>
              <p className="text-gray-900">1234 5678 9012 3456</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">SWIFT Code</p>
              <p className="text-gray-900">BKCHCNBJ350</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Bank Address</p>
              <p className="text-gray-900">No. 136 Wusi Road, Fuzhou, Fujian, China</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Currency</p>
              <p className="text-gray-900">USD</p>
            </div>
          </div>
        </div>

        {/* Validity & Authorization */}
        <div className="mb-6">
          <div className="border border-yellow-400 bg-yellow-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-900">
              <strong>⚠️ IMPORTANT:</strong> This quotation is valid until <strong>February 18, 2025</strong>. 
              Prices are subject to change after this date. Please confirm your order before the expiry date to lock in these prices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-2">For Any Questions, Contact:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">Ms. Li Wei</p>
                <p className="text-gray-900">Export Sales Manager</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
                <p className="text-gray-900">Mobile: +86-138-xxxx-xxxx</p>
                <p className="text-gray-900">Email: liwei@gaoshengdafu.com</p>
                <p className="text-xs text-gray-600 mt-2">Working Hours: Mon-Sat, 8AM-6PM CST</p>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4 rounded bg-red-50">
              <p className="text-xs text-gray-600 mb-3">Authorized By:</p>
              <div className="border-b-2 border-gray-400 mb-2 h-16 flex items-end pb-2">
                <p className="text-lg text-gray-900" style={{ fontFamily: 'cursive' }}>Li Wei</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="text-gray-900">Li Wei</p>
                </div>
                <div>
                  <p className="text-gray-600">Position:</p>
                  <p className="text-gray-900">Export Sales Manager</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">January 18, 2025</p>
                </div>
                <div>
                  <p className="text-gray-600">Company Seal:</p>
                  <div className="border border-gray-400 rounded px-2 py-1 text-center">
                    <p className="text-xs text-gray-700">COSUN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p>Thank you for your inquiry. We look forward to a successful business relationship.</p>
          <p className="mt-2">
            <strong>Fujian Gaoshengda Fuji Building Materials Co., Ltd.</strong> | Industrial Park, Minhou County, Fuzhou, Fujian, China | 
            Tel: +86-591-xxxx-xxxx | Email: export@gaoshengdafu.com | Web: www.gaoshengdafu.com
          </p>
          <p className="mt-2 text-gray-500">
            Quotation Generated: January 18, 2025 | Document ID: {quotationNumber} | Page 1 of 1
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
          .quotation-form {
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
          .quotation-form {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}
