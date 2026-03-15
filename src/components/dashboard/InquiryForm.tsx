import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface InquiryFormProps {
  inquiryNumber?: string;
  onClose?: () => void;
}

export function InquiryForm({ inquiryNumber = 'ING-2025-001234', onClose }: InquiryFormProps) {
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
        <h2 className="text-xl text-gray-900">Inquiry Form</h2>
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
      <div className="inquiry-form bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">INQUIRY</h1>
              <p className="text-sm text-gray-600">Request for Quotation</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">INQUIRY NO.</p>
                <p className="text-lg">{inquiryNumber}</p>
              </div>
              <p className="text-xs text-gray-600">Date: January 15, 2025</p>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* From */}
          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">FROM (BUYER)</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Mr. Robert Williams</p>
                <p className="text-xs text-gray-600">Purchasing Manager</p>
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

          {/* To */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">TO (SUPPLIER)</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Ms. Li Wei</p>
                <p className="text-xs text-gray-600">Export Sales Manager</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Address</p>
                <p className="text-gray-900">Industrial Park, Minhou County</p>
                <p className="text-gray-900">Fuzhou, Fujian Province, China</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
                <p className="text-gray-900">Email: export@gaoshengdafu.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Details */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">INQUIRY DETAILS</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Inquiry Date</p>
              <p className="font-medium text-gray-900">January 15, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Required Quote By</p>
              <p className="font-medium text-gray-900">January 22, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Target Market</p>
              <p className="font-medium text-gray-900">North America</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Payment Terms Preference</p>
              <p className="font-medium text-gray-900">T/T 30% deposit, 70% before shipment</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Delivery Terms</p>
              <p className="font-medium text-gray-900">FOB Xiamen / CIF Los Angeles</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Expected Delivery</p>
              <p className="font-medium text-gray-900">March 2025</p>
            </div>
          </div>
        </div>

        {/* Product Requirements */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            PRODUCT REQUIREMENTS
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Item No.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Product Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Specifications</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Quantity</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Unit</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">1</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>Glazed Ceramic Floor Tiles</strong><br />
                    <span className="text-xs text-gray-600">Porcelain, Non-slip surface</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    Size: 400x400mm<br />
                    <span className="text-xs">Thickness: 8-10mm</span><br />
                    <span className="text-xs">Color: Beige/Cream tones</span><br />
                    <span className="text-xs">Surface: Matt finish</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">30,000-35,000</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <span className="text-xs">Grade A quality</span><br />
                    <span className="text-xs">CE certified preferred</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">2</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>Wall Tiles</strong><br />
                    <span className="text-xs text-gray-600">Ceramic, Glossy finish</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    Size: 300x600mm<br />
                    <span className="text-xs">Thickness: 7-9mm</span><br />
                    <span className="text-xs">Color: White/Light Grey</span><br />
                    <span className="text-xs">Surface: Glossy</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">20,000-25,000</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <span className="text-xs">Water absorption &lt;0.5%</span><br />
                    <span className="text-xs">Rectified edges</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">3</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>Mosaic Tiles</strong><br />
                    <span className="text-xs text-gray-600">Glass/Ceramic blend</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    Size: 25x25mm chips<br />
                    <span className="text-xs">Sheet size: 300x300mm</span><br />
                    <span className="text-xs">Mixed colors: Blue/Green</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">5,000-8,000</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">SQM</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <span className="text-xs">Mesh mounted</span><br />
                    <span className="text-xs">Sample required</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            ADDITIONAL REQUIREMENTS
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Quality Standards:</p>
              <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                <li>ISO 9001 certified manufacturer preferred</li>
                <li>CE marking required for European standards</li>
                <li>Third-party inspection acceptable</li>
                <li>Less than 5% breakage tolerance</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Packaging Requirements:</p>
              <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                <li>Export standard carton packaging</li>
                <li>Palletized loading preferred</li>
                <li>Each carton clearly labeled with product info</li>
                <li>Corner protection for tile boxes</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Shipping Requirements:</p>
              <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                <li>Container loading: 20ft or 40ft HC</li>
                <li>Maximum loading weight calculation needed</li>
                <li>Estimated CBM per product required</li>
                <li>Shipping marks to be confirmed</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Documentation Required:</p>
              <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                <li>Product catalog with detailed specifications</li>
                <li>Test reports (water absorption, slip resistance)</li>
                <li>Certificate of Origin</li>
                <li>Free samples (3-5 pieces per item)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quote Request Details */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            QUOTE REQUEST DETAILS
          </h3>
          
          <div className="border border-gray-300 p-4 rounded bg-yellow-50">
            <p className="text-sm text-gray-900 mb-3">
              <strong>Please provide the following in your quotation:</strong>
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-900">✓ Unit price (FOB and CIF)</p>
                <p className="text-gray-900">✓ Minimum Order Quantity (MOQ)</p>
                <p className="text-gray-900">✓ Production lead time</p>
                <p className="text-gray-900">✓ Payment terms options</p>
              </div>
              <div>
                <p className="text-gray-900">✓ Packaging details and dimensions</p>
                <p className="text-gray-900">✓ Loading capacity per container</p>
                <p className="text-gray-900">✓ Available colors and finishes</p>
                <p className="text-gray-900">✓ Warranty and quality guarantee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Notes */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SPECIAL NOTES & REMARKS
          </h3>
          
          <div className="border border-gray-300 p-4 rounded text-sm">
            <ul className="space-y-2 text-gray-900">
              <li>• This inquiry is for our Q2 2025 inventory replenishment program.</li>
              <li>• We are open to establishing a long-term partnership with reliable suppliers.</li>
              <li>• Annual order volume estimated at 200,000+ SQM across all product lines.</li>
              <li>• Factory visit may be arranged before final order confirmation.</li>
              <li>• Please indicate if you can provide customization services (size, color, design).</li>
              <li>• Reference samples from previous suppliers available upon request.</li>
            </ul>
          </div>
        </div>

        {/* Contact & Authorization */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CONTACT INFORMATION & AUTHORIZATION
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-2">Primary Contact for This Inquiry:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">Mr. Robert Williams</p>
                <p className="text-gray-900">Purchasing Manager</p>
                <p className="text-gray-900">Direct: +1-909-555-0187</p>
                <p className="text-gray-900">Email: robert.williams@buildpro.com</p>
                <p className="text-xs text-gray-600 mt-2">Working Hours: Mon-Fri, 9AM-6PM PST</p>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4 rounded bg-blue-50">
              <p className="text-xs text-gray-600 mb-3">Authorized Signature:</p>
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
                  <p className="text-gray-900">January 15, 2025</p>
                </div>
                <div>
                  <p className="text-gray-600">Company Stamp:</p>
                  <div className="border border-gray-400 rounded px-2 py-1 text-center">
                    <p className="text-xs text-gray-700">BuildPro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p>This inquiry is valid for 30 days from the date of issue.</p>
          <p className="mt-2">
            <strong>BuildPro Distribution LLC</strong> | 2500 E Warehouse Way, Ontario, CA 91761, USA | 
            Tel: +1-909-555-0187 | Email: robert.williams@buildpro.com
          </p>
          <p className="mt-2 text-gray-500">
            Inquiry Generated: January 15, 2025 | Document ID: {inquiryNumber} | Page 1 of 1
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
          .inquiry-form {
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
          .inquiry-form {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}
