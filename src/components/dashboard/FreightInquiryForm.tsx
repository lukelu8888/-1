import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface FreightInquiryFormProps {
  inquiryNumber?: string;
  orderNumber?: string;
  onClose?: () => void;
}

export function FreightInquiryForm({ 
  inquiryNumber = 'FI-2025-0301',
  orderNumber = 'PO-2025-001',
  onClose 
}: FreightInquiryFormProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF...');

      // Dynamically import the libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Get the content element
      const content = document.querySelector('.freight-inquiry') as HTMLElement;
      if (!content) {
        toast.error('Failed to generate PDF. Content not found.');
        return;
      }

      // Create canvas from the content
      const canvas = await html2canvas(content, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate PDF dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save PDF
      pdf.save(`Freight_Inquiry_${inquiryNumber}.pdf`);

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('PDF downloaded successfully!', {
        description: `File saved as Freight_Inquiry_${inquiryNumber}.pdf`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', {
        description: 'Please try again or use the Print option.'
      });
    }
  };

  return (
    <div className="bg-white">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl text-gray-900">Freight Inquiry</h2>
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
      <div className="freight-inquiry bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">FREIGHT INQUIRY</h1>
              <p className="text-sm text-gray-600">Ocean/Air Freight Rate Request</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">INQUIRY NO.</p>
                <p className="text-lg">{inquiryNumber}</p>
              </div>
              <p className="text-xs text-gray-600">Date: March 1, 2025</p>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Shipper */}
          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">SHIPPER / CONSIGNOR</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Address</p>
                <p className="text-gray-900">Industrial Park, Minhou County</p>
                <p className="text-gray-900">Fuzhou, Fujian 350100, China</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Ms. Li Wei - Export Manager</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
                <p className="text-gray-900">Email: export@gaoshengdafu.com</p>
              </div>
            </div>
          </div>

          {/* Consignee */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">CONSIGNEE / RECEIVER</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">BuildPro Distribution LLC</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Address</p>
                <p className="text-gray-900">2500 E Warehouse Way</p>
                <p className="text-gray-900">Ontario, CA 91761, USA</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Mr. Robert Williams</p>
                <p className="text-gray-900">Tel: +1-909-555-0187</p>
                <p className="text-gray-900">Email: robert.williams@buildpro.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">SHIPMENT DETAILS</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Reference PO Number</p>
              <p className="font-medium text-gray-900">{orderNumber}</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Cargo Ready Date</p>
              <p className="font-medium text-gray-900">March 8, 2025</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Expected Shipment Date</p>
              <p className="font-medium text-gray-900">March 12-15, 2025</p>
            </div>
            <div className="border border-gray-300 p-3 rounded bg-blue-50">
              <p className="text-xs text-gray-600 mb-1">Port of Loading (POL)</p>
              <p className="font-medium text-gray-900">Xiamen, China</p>
            </div>
            <div className="border border-gray-300 p-3 rounded bg-blue-50">
              <p className="text-xs text-gray-600 mb-1">Port of Discharge (POD)</p>
              <p className="font-medium text-gray-900">Los Angeles, USA</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Final Destination</p>
              <p className="font-medium text-gray-900">Ontario, CA</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Preferred Shipping Method</p>
              <p className="font-medium text-gray-900">Ocean Freight (FCL)</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Incoterms Preference</p>
              <p className="font-medium text-gray-900">FOB Xiamen or CIF Los Angeles</p>
            </div>
          </div>
        </div>

        {/* Cargo Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CARGO INFORMATION
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Description of Goods</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Quantity</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Total Cartons</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Est. Weight</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Est. Volume</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>LED Lighting Products</strong><br />
                    <span className="text-xs text-gray-600">Panel Lights, Downlights, Track Lights</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">5,000 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">425 ctns</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">6,800 kg</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">52 CBM</td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right text-gray-900">
                    <strong>TOTAL:</strong>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900"><strong>425 ctns</strong></td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900"><strong>6,800 kg</strong></td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900"><strong>52 CBM</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div className="border border-gray-300 p-3 rounded bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">Cargo Nature</p>
              <p className="font-medium text-gray-900">General Cargo (Non-Hazardous)</p>
            </div>
            <div className="border border-gray-300 p-3 rounded bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">HS Code</p>
              <p className="font-medium text-gray-900">9405.40 (LED Lamps)</p>
            </div>
            <div className="border border-gray-300 p-3 rounded bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">Container Requirement</p>
              <p className="font-medium text-gray-900">1 x 40'HQ Container</p>
            </div>
          </div>
        </div>

        {/* Rate Request */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            RATE REQUEST - PLEASE QUOTE
          </h3>
          
          <div className="border border-red-300 bg-red-50 p-4 rounded">
            <p className="text-sm text-gray-900 mb-3"><strong>Please provide quotation for the following:</strong></p>
            
            <div className="space-y-3 text-sm">
              <div className="bg-white border border-gray-300 p-3 rounded">
                <p className="text-red-600 font-medium mb-2">Option 1: Ocean Freight (FCL)</p>
                <div className="grid grid-cols-2 gap-2 text-gray-900">
                  <p>☐ 1 x 40'HQ Container - Xiamen to Los Angeles</p>
                  <p>☐ Include BAF, CAF, and other surcharges</p>
                  <p>☐ Transit time</p>
                  <p>☐ Sailing schedule (weekly/bi-weekly)</p>
                  <p>☐ Free time at destination port</p>
                  <p>☐ Validity of quotation</p>
                </div>
              </div>

              <div className="bg-white border border-gray-300 p-3 rounded">
                <p className="text-red-600 font-medium mb-2">Option 2: Door-to-Door Service (If available)</p>
                <div className="grid grid-cols-2 gap-2 text-gray-900">
                  <p>☐ Pickup from factory (Fuzhou)</p>
                  <p>☐ Trucking to Xiamen port</p>
                  <p>☐ Ocean freight</p>
                  <p>☐ Destination port charges</p>
                  <p>☐ Customs clearance (USA)</p>
                  <p>☐ Delivery to Ontario, CA warehouse</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Services */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            ADDITIONAL SERVICES REQUIRED
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Insurance:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Marine cargo insurance required</li>
                <li>☑ Coverage: All Risks</li>
                <li>☑ Insured value: $77,500 USD + 10%</li>
                <li>☑ Please provide insurance rate</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Documentation:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Bill of Lading (B/L)</li>
                <li>☑ Commercial Invoice</li>
                <li>☑ Packing List</li>
                <li>☑ Certificate of Origin (if needed)</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Customs & Clearance:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☐ Export customs clearance (China)</li>
                <li>☐ Import customs clearance (USA)</li>
                <li>☐ ISF filing</li>
                <li>☐ Customs bond arrangement</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Special Requirements:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Container loading supervision</li>
                <li>☐ Temperature controlled container</li>
                <li>☐ Hazmat handling (N/A)</li>
                <li>☑ Photo documentation required</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment & Terms */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            PAYMENT TERMS & VALIDITY
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-2">Payment Terms Preference:</p>
              <div className="text-sm space-y-1">
                <p className="text-gray-900">☑ Prepaid (before shipment)</p>
                <p className="text-gray-900">☐ Collect (payable at destination)</p>
                <p className="text-gray-900">☐ Credit terms (30 days)</p>
                <p className="text-xs text-gray-600 mt-2">Payment method: T/T Bank Transfer</p>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4 rounded bg-blue-50">
              <p className="text-xs text-gray-600 mb-2">Response Required By:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">March 2, 2025 (5:00 PM CST)</p>
                <p className="text-xs text-gray-600 mt-3">Quotation Validity Period:</p>
                <p className="text-gray-900">Minimum 15 days from quote date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            INQUIRY CONTACT
          </h3>
          
          <div className="border border-gray-300 p-4 rounded">
            <p className="text-sm text-gray-900 mb-3">
              For any questions or clarifications regarding this freight inquiry, please contact:
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600">Primary Contact:</p>
                <p className="font-medium text-gray-900">Ms. Li Wei</p>
                <p className="text-gray-900">Export Manager</p>
                <p className="text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
                <p className="text-gray-900 mt-2">Mobile: +86-138-xxxx-xxxx</p>
                <p className="text-gray-900">Email: export@gaoshengdafu.com</p>
                <p className="text-gray-900">WeChat ID: liwei_export</p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-xs text-red-600 mb-2">Submission Instructions:</p>
                <ul className="text-xs text-gray-900 space-y-1">
                  <li>• Email quotation to: export@gaoshengdafu.com</li>
                  <li>• Subject line: "Freight Quote - {inquiryNumber}"</li>
                  <li>• Include company profile and references</li>
                  <li>• Specify all charges itemized</li>
                  <li>• Include terms and conditions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mb-6">
          <h3 className="bg-yellow-100 border-l-4 border-yellow-600 px-3 py-2 text-sm text-gray-900 mb-3">
            ⚠️ IMPORTANT NOTES
          </h3>
          
          <div className="border border-yellow-300 bg-yellow-50 p-4 rounded text-sm">
            <ul className="space-y-2 text-gray-900">
              <li>• All rates should be quoted in USD</li>
              <li>• Please clearly separate ocean freight charges from local charges</li>
              <li>• Specify any fuel surcharges (BAF), currency adjustment factors (CAF), or peak season surcharges</li>
              <li>• Indicate if rates are subject to change without notice</li>
              <li>• Confirm container availability for the requested shipment dates</li>
              <li>• Provide company registration and business license upon request</li>
              <li>• We may request references from other clients</li>
            </ul>
          </div>
        </div>

        {/* Authorization */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            AUTHORIZATION
          </h3>
          
          <div className="border border-gray-300 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-3">Issued by:</p>
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
                    <p className="text-gray-900">March 1, 2025</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Company Stamp:</p>
                    <div className="border border-gray-400 rounded px-2 py-1 text-center">
                      <p className="text-xs text-gray-700">Gaoshengda</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p><strong>Fujian Gaoshengda Fuji Building Materials Co., Ltd.</strong></p>
          <p className="mt-1">
            Industrial Park, Minhou County, Fuzhou, Fujian Province, China | 
            Tel: +86-591-xxxx-xxxx | Email: export@gaoshengdafu.com
          </p>
          <p className="mt-2 text-gray-500">
            Inquiry Issued: March 1, 2025 | Document ID: {inquiryNumber} | Page 1 of 1
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
          .freight-inquiry {
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0 !important;
          }
        }
        @media screen {
          .freight-inquiry {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}