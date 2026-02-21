import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface BookingConfirmationFormProps {
  bookingNumber?: string;
  orderNumber?: string;
  onClose?: () => void;
}

export function BookingConfirmationForm({ 
  bookingNumber = 'COSN-BK-2025-0303-789',
  orderNumber = 'PO-2025-001',
  onClose 
}: BookingConfirmationFormProps) {
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
        <h2 className="text-xl text-gray-900">Booking Confirmation</h2>
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
      <div className="booking-confirmation bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">BOOKING CONFIRMATION</h1>
              <p className="text-sm text-gray-600">Container Space Booking - Confirmed</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">BOOKING NO.</p>
                <p className="text-lg">{bookingNumber}</p>
              </div>
              <div className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                ✓ SPACE CONFIRMED
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-green-50 border-2 border-green-600 rounded p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
              ✓
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">Booking Successfully Confirmed</p>
              <p className="text-sm text-green-700">Container space has been reserved. Please deliver cargo to CY before cut-off time.</p>
            </div>
          </div>
        </div>

        {/* Vessel & Voyage Information */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">VESSEL & VOYAGE DETAILS</h3>
          
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-blue-50 p-4 border-b border-gray-300">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Vessel Name</p>
                  <p className="text-xl font-medium text-gray-900">COSCO GLORY</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Voyage Number</p>
                  <p className="text-xl font-medium text-gray-900">V.125E</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Service Code</p>
                  <p className="text-xl font-medium text-gray-900">NWX</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-1">Shipping Line</p>
                <p className="font-medium text-gray-900">COSCO Shipping</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Vessel Flag</p>
                <p className="font-medium text-gray-900">Hong Kong</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">IMO Number</p>
                <p className="font-medium text-gray-900">9876543</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Service Type</p>
                <p className="font-medium text-gray-900">Direct</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            SAILING SCHEDULE
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Origin */}
            <div className="border-2 border-blue-600 rounded p-4 bg-blue-50">
              <p className="text-sm text-blue-900 font-medium mb-3">📍 ORIGIN - Xiamen, China</p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs text-gray-600">CY Cut-off:</p>
                  <p className="font-medium text-red-600">March 10, 2025 16:00</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs text-gray-600">Doc Cut-off:</p>
                  <p className="font-medium text-red-600">March 11, 2025 10:00</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs text-gray-600">VGM Cut-off:</p>
                  <p className="font-medium text-red-600">March 11, 2025 12:00</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-blue-300 pt-2 mt-2">
                  <p className="text-xs text-gray-600">ETD (Estimated):</p>
                  <p className="text-lg font-medium text-blue-900">March 12, 2025</p>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="border-2 border-green-600 rounded p-4 bg-green-50">
              <p className="text-sm text-green-900 font-medium mb-3">📍 DESTINATION - Los Angeles, USA</p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs text-gray-600">Transit Time:</p>
                  <p className="font-medium text-gray-900">18-22 days</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs text-gray-600">Free Demurrage:</p>
                  <p className="font-medium text-gray-900">5 days</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs text-gray-600">Free Detention:</p>
                  <p className="font-medium text-gray-900">7 days</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-green-300 pt-2 mt-2">
                  <p className="text-xs text-gray-600">ETA (Estimated):</p>
                  <p className="text-lg font-medium text-green-900">March 30, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Container & Cargo Details */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CONTAINER & CARGO DETAILS
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Container Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Quantity</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Commodity</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Est. Weight</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Est. Volume</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>40' High Cube (HC)</strong><br />
                    <span className="text-xs text-gray-600">Dry Container</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    LED Lighting Products<br />
                    <span className="text-xs text-gray-600">HS Code: 9405.40</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">6,800 kg</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">52 CBM</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Total Cartons</p>
              <p className="font-medium text-gray-900">425 ctns</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Total Pieces</p>
              <p className="font-medium text-gray-900">5,000 pcs</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Cargo Value</p>
              <p className="font-medium text-gray-900">$77,500 USD</p>
            </div>
            <div className="border border-gray-300 p-3 rounded bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">Cargo Nature</p>
              <p className="font-medium text-gray-900">Non-Hazardous</p>
            </div>
          </div>
        </div>

        {/* Parties Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            PARTIES INFORMATION
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 rounded p-4 bg-gray-50">
              <p className="text-xs text-red-600 mb-2">SHIPPER:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
                <p className="text-gray-900">Industrial Park, Minhou County</p>
                <p className="text-gray-900">Fuzhou, Fujian 350100, China</p>
                <p className="text-gray-900 mt-2">Contact: Ms. Li Wei</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-4">
              <p className="text-xs text-red-600 mb-2">CONSIGNEE:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
                <p className="text-gray-900">2500 E Warehouse Way</p>
                <p className="text-gray-900">Ontario, CA 91761, USA</p>
                <p className="text-gray-900 mt-2">Contact: Mr. Robert Williams</p>
                <p className="text-gray-900">Tel: +1-909-555-0187</p>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-4">
              <p className="text-xs text-red-600 mb-2">NOTIFY PARTY:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">Same as Consignee</p>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-4 bg-blue-50">
              <p className="text-xs text-red-600 mb-2">FREIGHT FORWARDER:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">China Shipping Logistics Co., Ltd.</p>
                <p className="text-gray-900">Xiamen Branch</p>
                <p className="text-gray-900">Contact: Mr. Chen Wei</p>
                <p className="text-gray-900">Tel: +86-592-xxxx-xxxx</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Instructions */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            LOADING INSTRUCTIONS
          </h3>
          
          <div className="border border-gray-300 rounded p-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Container Yard (CY):</p>
                <p className="font-medium text-gray-900">Xiamen Port Container Terminal</p>
                <p className="text-gray-900">East Terminal, Gate 3</p>
                <p className="text-gray-900">No. 789 Port Road, Xiamen</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">CY Operating Hours:</p>
                <p className="font-medium text-gray-900">Monday - Saturday</p>
                <p className="text-gray-900">08:00 - 17:00</p>
                <p className="text-xs text-red-600 mt-1">Closed on Sundays & Public Holidays</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm">
              <p className="font-medium text-yellow-900 mb-2">⚠️ Important Loading Notes:</p>
              <ul className="space-y-1 text-gray-900 list-disc list-inside">
                <li>Container will be released 3 days before CY cut-off date</li>
                <li>Shipper must provide VGM (Verified Gross Mass) before cut-off</li>
                <li>All cargo must be properly secured and sealed</li>
                <li>Loading photos and seal number must be sent to forwarder</li>
                <li>Original packing list must accompany the container</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Documentation Requirements */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            DOCUMENTATION REQUIREMENTS
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Required Before Sailing:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Commercial Invoice (3 originals)</li>
                <li>☑ Packing List (3 originals)</li>
                <li>☑ VGM Declaration</li>
                <li>☑ Shipping Instruction</li>
                <li>☑ Container Loading Photos</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">To Be Issued After Sailing:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☐ Original Bill of Lading (3 copies)</li>
                <li>☐ Sea Waybill (if required)</li>
                <li>☐ Certificate of Origin</li>
                <li>☐ Fumigation Certificate (if applicable)</li>
                <li>☐ ISF Filing Confirmation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Charges Summary */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CHARGES SUMMARY
          </h3>
          
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs">Charge Description</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs">Payment Term</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-gray-900">Ocean Freight (All-in)</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">Prepaid</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">2,850.00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-gray-900">Booking Fee</td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">Prepaid</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">Included</td>
              </tr>
              <tr className="bg-green-50 border-t-2 border-green-600">
                <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                  <strong>TOTAL PREPAID CHARGES:</strong>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                  <strong className="text-green-600">$2,850.00</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-600 mt-2">
            * Destination charges (if any) will be paid by consignee at port of discharge.
          </p>
        </div>

        {/* Important Notes */}
        <div className="mb-6">
          <h3 className="bg-yellow-100 border-l-4 border-yellow-600 px-3 py-2 text-sm text-gray-900 mb-3">
            ⚠️ IMPORTANT BOOKING TERMS
          </h3>
          
          <div className="border border-yellow-300 bg-yellow-50 p-4 rounded text-sm">
            <ul className="space-y-2 text-gray-900">
              <li>• This booking confirmation is subject to the carrier's standard terms and conditions.</li>
              <li>• Container space is confirmed but subject to final payment of freight charges.</li>
              <li>• Late delivery of cargo after CY cut-off may result in rollover to next vessel at shipper's expense.</li>
              <li>• Sailing schedule is subject to change due to weather, port congestion, or operational reasons.</li>
              <li>• Shipper is responsible for accurate cargo declaration and compliance with all regulations.</li>
              <li>• Any demurrage or detention charges incurred will be borne by the respective responsible party.</li>
              <li>• Cancellation of booking must be notified at least 48 hours before CY cut-off.</li>
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            BOOKING CONTACT
          </h3>
          
          <div className="border border-blue-300 bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-900 mb-3">
              For any questions or updates regarding this booking, please contact:
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">Mr. Chen Wei - Freight Manager</p>
                <p className="text-gray-900">China Shipping Logistics Co., Ltd.</p>
                <p className="text-gray-900 mt-2">Mobile: +86-138-xxxx-xxxx</p>
                <p className="text-gray-900">Email: chen.wei@chinashipping.com</p>
                <p className="text-gray-900">WeChat ID: chenwei_shipping</p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-300">
                <p className="text-xs text-blue-600 mb-2">24/7 Operations Hotline:</p>
                <p className="text-lg font-medium text-blue-900">+86-592-888-9999</p>
                <p className="text-xs text-gray-600 mt-2">For urgent matters after office hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Signature */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CONFIRMATION
          </h3>
          
          <div className="border border-gray-300 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
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
                    <p className="text-gray-600">Date:</p>
                    <p className="text-gray-900">March 3, 2025</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Company:</p>
                    <p className="text-gray-900">China Shipping</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ref:</p>
                    <p className="text-gray-900">{bookingNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p><strong>China Shipping Logistics Co., Ltd.</strong> - Xiamen Branch</p>
          <p className="mt-1">
            This booking confirmation is issued in good faith based on information provided. | 
            Carrier's liability is governed by Bill of Lading terms.
          </p>
          <p className="mt-2 text-gray-500">
            Booking Confirmed: March 3, 2025 11:00 | Document ID: {bookingNumber} | Page 1 of 1
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
          .booking-confirmation {
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0 !important;
          }
        }
        @media screen {
          .booking-confirmation {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}
