import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface FreightConfirmationFormProps {
  confirmationNumber?: string;
  inquiryNumber?: string;
  onClose?: () => void;
}

export function FreightConfirmationForm({ 
  confirmationNumber = 'FC-2025-0302',
  inquiryNumber = 'FI-2025-0301',
  onClose 
}: FreightConfirmationFormProps) {
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
        <h2 className="text-xl text-gray-900">Freight Rate Confirmation</h2>
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
      <div className="freight-confirmation bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">FREIGHT RATE CONFIRMATION</h1>
              <p className="text-sm text-gray-600">Ocean Freight Quotation - Approved</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">CONFIRMATION NO.</p>
                <p className="text-lg">{confirmationNumber}</p>
              </div>
              <div className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                ✓ CONFIRMED
              </div>
            </div>
          </div>
        </div>

        {/* Reference Information */}
        <div className="bg-blue-50 border border-blue-300 rounded p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Reference Inquiry</p>
              <p className="font-medium text-gray-900">{inquiryNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Confirmation Date</p>
              <p className="font-medium text-gray-900">March 2, 2025</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Valid Until</p>
              <p className="font-medium text-gray-900">March 17, 2025</p>
            </div>
          </div>
        </div>

        {/* Freight Forwarder Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">FREIGHT FORWARDER</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">China Shipping Logistics Co., Ltd.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Office Location</p>
                <p className="text-gray-900">Xiamen Branch Office</p>
                <p className="text-gray-900">No. 567 Shipping Road, Xiamen, Fujian</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Mr. Chen Wei - Freight Manager</p>
                <p className="text-gray-900">Tel: +86-592-xxxx-xxxx</p>
                <p className="text-gray-900">Email: chen.wei@chinashipping.com</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">SERVICE TYPE</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Service Level:</p>
                <p className="text-gray-900">FCL Ocean Freight</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Container Type:</p>
                <p className="text-gray-900">40' High Cube (HQ)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Incoterms:</p>
                <p className="text-gray-900">FOB Xiamen</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Transit Time:</p>
                <p className="text-gray-900">18-22 days</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-600">Sailing Frequency:</p>
                <p className="text-gray-900">Weekly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Route Information */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">SHIPPING ROUTE</h3>
          
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-blue-50 p-4 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Origin Port</p>
                  <p className="text-lg font-medium text-gray-900">Xiamen, China (XMN)</p>
                  <p className="text-xs text-gray-600">Port of Loading (POL)</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-2xl text-blue-600">→ → →</p>
                  <p className="text-sm text-gray-600">Ocean Freight</p>
                  <p className="text-sm text-gray-900">18-22 days</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-600 mb-1">Destination Port</p>
                  <p className="text-lg font-medium text-gray-900">Los Angeles, USA (LAX)</p>
                  <p className="text-xs text-gray-600">Port of Discharge (POD)</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-1">Shipping Line</p>
                <p className="font-medium text-gray-900">COSCO Shipping</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Service Type</p>
                <p className="font-medium text-gray-900">Direct Service</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Transshipment</p>
                <p className="font-medium text-gray-900">None (Direct)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Breakdown */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            FREIGHT RATE BREAKDOWN
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Unit</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs">Rate (USD)</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">Ocean Freight - 40'HQ Container</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1 Container</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">2,200.00</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">2,200.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">Bunker Adjustment Factor (BAF)</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1 Container</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">350.00</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">350.00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">Currency Adjustment Factor (CAF)</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1 Container</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">150.00</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">150.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">Documentation Fee</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1 Shipment</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">50.00</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">50.00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">THC (Terminal Handling Charge) - Origin</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1 Container</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">100.00</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">100.00</td>
                </tr>
                <tr className="bg-green-50 border-t-2 border-green-600">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                    <strong>TOTAL FREIGHT COST:</strong>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                    <strong className="text-green-600">$2,850.00</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded p-3 text-xs">
            <p className="text-gray-900"><strong>Note:</strong> The above rates are based on FOB Xiamen terms. Destination charges (THC, demurrage, detention) are not included and will be borne by consignee.</p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            ADDITIONAL INFORMATION
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Free Time at Destination:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>• Free Demurrage: 5 days</li>
                <li>• Free Detention: 7 days</li>
                <li>• Per Diem after free time: $75/day</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">VGM (Verified Gross Mass):</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>• VGM declaration required</li>
                <li>• Deadline: 24 hrs before vessel ETD</li>
                <li>• Shipper's responsibility</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Payment Terms:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>• Freight: Prepaid</li>
                <li>• Payment due: Before Bill of Lading release</li>
                <li>• Method: T/T Bank Transfer</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded bg-blue-50">
              <p className="text-xs text-red-600 mb-2">Insurance (Optional):</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>• Coverage: All Risks</li>
                <li>• Premium: 0.35% of cargo value</li>
                <li>• Estimated: $271.00 (for $77,500)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            TERMS & CONDITIONS
          </h3>
          
          <div className="border border-gray-300 p-4 rounded text-xs">
            <ol className="space-y-2 text-gray-900 list-decimal list-inside">
              <li>This quotation is valid for 15 days from the date of issue and subject to space and equipment availability.</li>
              <li>All rates are quoted in USD and are subject to change without prior notice in case of significant fluctuations in fuel costs or currency exchange rates.</li>
              <li>Shipper must provide accurate cargo details (weight, dimensions, HS code) at time of booking.</li>
              <li>Any additional charges incurred due to incorrect information will be borne by the shipper.</li>
              <li>Freight charges must be paid in full before the release of shipping documents (Bill of Lading).</li>
              <li>Container loading and securing is the responsibility of the shipper. Any damage due to improper loading will not be covered by the carrier.</li>
              <li>The forwarder reserves the right to substitute the nominated vessel with another vessel of equal or better service without prior notice.</li>
              <li>Shipper is responsible for compliance with all export regulations and obtaining necessary permits and licenses.</li>
              <li>General Average and salvage charges, if applicable, will be borne proportionally by all cargo interests.</li>
              <li>This quotation does not constitute a contract of carriage. A separate booking confirmation and Bill of Lading will govern the actual shipment.</li>
            </ol>
          </div>
        </div>

        {/* Confirmation */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CONFIRMATION & ACCEPTANCE
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-3">Issued by (Forwarder):</p>
              <div className="border-b-2 border-gray-400 mb-2 h-16 flex items-end pb-2">
                <p className="text-lg text-gray-900" style={{ fontFamily: 'cursive' }}>Chen Wei</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="text-gray-900">Chen Wei</p>
                </div>
                <div>
                  <p className="text-gray-600">Position:</p>
                  <p className="text-gray-900">Freight Manager</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">March 2, 2025</p>
                </div>
                <div>
                  <p className="text-gray-600">Company:</p>
                  <p className="text-gray-900">China Shipping</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4 rounded bg-green-50">
              <p className="text-xs text-gray-600 mb-3">Accepted by (Shipper):</p>
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
                  <p className="text-gray-900">Export Manager</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">March 2, 2025</p>
                </div>
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="text-green-600">✓ CONFIRMED</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p><strong>China Shipping Logistics Co., Ltd.</strong> - Xiamen Branch</p>
          <p className="mt-1">
            No. 567 Shipping Road, Xiamen, Fujian, China | 
            Tel: +86-592-xxxx-xxxx | Email: xiamen@chinashipping.com
          </p>
          <p className="mt-2 text-gray-500">
            Confirmation Issued: March 2, 2025 | Document ID: {confirmationNumber} | Page 1 of 1
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
          .freight-confirmation {
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0 !important;
          }
        }
        @media screen {
          .freight-confirmation {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}
