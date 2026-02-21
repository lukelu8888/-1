import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';

interface QCScheduleFormProps {
  scheduleNumber?: string;
  orderNumber?: string;
  onClose?: () => void;
}

export function QCScheduleForm({ 
  scheduleNumber = 'QCS-2025-0224',
  orderNumber = 'PO-2025-001',
  onClose 
}: QCScheduleFormProps) {
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
        <h2 className="text-xl text-gray-900">QC Schedule Confirmation</h2>
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
      <div className="qc-schedule-form bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">QC SCHEDULE</h1>
              <p className="text-sm text-gray-600">Quality Control Inspection Schedule Confirmation</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">SCHEDULE NO.</p>
                <p className="text-lg">{scheduleNumber}</p>
              </div>
              <p className="text-xs text-gray-600">Scheduled Date: February 24, 2025</p>
            </div>
          </div>
        </div>

        {/* Reference Information */}
        <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Purchase Order No.</p>
              <p className="font-medium text-gray-900">{orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Schedule Created</p>
              <p className="font-medium text-gray-900">February 24, 2025 10:00 AM</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Schedule Status</p>
              <p className="font-medium text-green-600">✓ CONFIRMED</p>
            </div>
          </div>
        </div>

        {/* Parties Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Inspection Company */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">INSPECTION COMPANY</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">SGS (Société Générale de Surveillance)</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Office Location</p>
                <p className="text-gray-900">Guangzhou Branch Office</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Inspector Assigned</p>
                <p className="text-gray-900">Michael Zhang</p>
                <p className="text-xs text-gray-600">Senior QC Inspector (ID: SGS-GZ-0456)</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact</p>
                <p className="text-gray-900">Tel: +86-20-8888-5566</p>
                <p className="text-gray-900">Email: michael.zhang@sgs.com</p>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">SUPPLIER/MANUFACTURER</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Factory Location</p>
                <p className="text-gray-900">Industrial Park, Minhou County</p>
                <p className="text-gray-900">Fuzhou, Fujian Province, China</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Contact Person</p>
                <p className="text-gray-900">Ms. Li Wei - Export Manager</p>
                <p className="text-gray-900">Tel: +86-591-xxxx-xxxx</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Schedule Details */}
        <div className="mb-6">
          <h3 className="bg-red-600 text-white px-3 py-2 text-sm mb-4">INSPECTION SCHEDULE DETAILS</h3>
          
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-300">
              <div className="p-3 border-r border-gray-300">
                <p className="text-xs text-gray-600 mb-1">Inspection Date</p>
                <p className="font-medium text-gray-900">February 28, 2025 (Friday)</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 mb-1">Inspection Time</p>
                <p className="font-medium text-gray-900">09:00 AM - 05:00 PM (Full Day)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-300">
              <div className="p-3 border-r border-gray-300">
                <p className="text-xs text-gray-600 mb-1">Inspection Type</p>
                <p className="font-medium text-gray-900">Pre-Shipment Inspection (PSI)</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 mb-1">Inspection Standard</p>
                <p className="font-medium text-gray-900">AQL 2.5 / ISO 2859-1</p>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50">
              <p className="text-xs text-gray-600 mb-1">Inspection Location</p>
              <p className="font-medium text-gray-900">Guangzhou Consolidation Warehouse</p>
              <p className="text-sm text-gray-900">No. 888 Logistics Avenue, Huangpu District, Guangzhou, Guangdong 510530</p>
            </div>
          </div>
        </div>

        {/* Products to be Inspected */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            PRODUCTS TO BE INSPECTED
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Item</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Product Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Total Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs">Sample Size</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs">Inspection Focus</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">1</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>LED Panel Light 60x60cm</strong><br />
                    <span className="text-xs text-gray-600">48W, 4000K, White Frame</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">2,000 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">125 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <span className="text-xs">• Luminous efficacy</span><br />
                    <span className="text-xs">• Color consistency</span><br />
                    <span className="text-xs">• Frame quality</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">2</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>LED Downlight 8 inch</strong><br />
                    <span className="text-xs text-gray-600">25W, 3000K, Dimmable</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">2,000 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">125 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <span className="text-xs">• Dimming function</span><br />
                    <span className="text-xs">• Heat dissipation</span><br />
                    <span className="text-xs">• Installation fit</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">3</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <strong>LED Track Light</strong><br />
                    <span className="text-xs text-gray-600">30W, 4000K, Adjustable</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">1,000 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">80 pcs</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">
                    <span className="text-xs">• Rotation mechanism</span><br />
                    <span className="text-xs">• Track compatibility</span><br />
                    <span className="text-xs">• Beam angle</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspection Scope */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            INSPECTION SCOPE & CHECKLIST
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Product Quality Checks:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Appearance & Workmanship</li>
                <li>☑ Dimensions & Specifications</li>
                <li>☑ Color & Finish Consistency</li>
                <li>☑ Material Quality Verification</li>
                <li>☑ Functionality Testing (On-site)</li>
                <li>☑ Safety Compliance Check</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Packaging & Labeling:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Individual Product Packaging</li>
                <li>☑ Master Carton Quality</li>
                <li>☑ Labeling Accuracy (SKU, Barcode)</li>
                <li>☑ Shipping Marks Verification</li>
                <li>☑ Protection Materials (Foam, etc.)</li>
                <li>☑ User Manual & Accessories</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Quantity Verification:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Total Carton Count</li>
                <li>☑ Random Carton Opening</li>
                <li>☑ Pieces per Carton Verification</li>
                <li>☑ Packing List Cross-check</li>
                <li>☑ Product Mix Confirmation</li>
              </ul>
            </div>
            
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-red-600 mb-2">Documentation Review:</p>
              <ul className="text-sm text-gray-900 space-y-1">
                <li>☑ Test Reports (Photometric, Safety)</li>
                <li>☑ Certificates (CE, UL, Energy Star)</li>
                <li>☑ Material Certifications</li>
                <li>☑ Warranty Cards</li>
                <li>☑ Installation Instructions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Required Preparations */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            REQUIRED PREPARATIONS BY SUPPLIER
          </h3>
          
          <div className="border border-red-300 bg-red-50 p-4 rounded">
            <p className="text-sm text-gray-900 mb-3"><strong>Please ensure the following are ready by inspection date:</strong></p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-900">✓ All products 100% packed and labeled</p>
                <p className="text-gray-900">✓ Products organized by SKU</p>
                <p className="text-gray-900">✓ Access to power supply for testing</p>
                <p className="text-gray-900">✓ Adequate lighting in inspection area</p>
              </div>
              <div>
                <p className="text-gray-900">✓ Complete packing list available</p>
                <p className="text-gray-900">✓ All test reports and certificates</p>
                <p className="text-gray-900">✓ Factory QC personnel on-site</p>
                <p className="text-gray-900">✓ Measuring tools available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            EMERGENCY CONTACT & SCHEDULE CHANGES
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-3 rounded">
              <p className="text-xs text-gray-600 mb-2">SGS Inspector - Day of Inspection:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">Michael Zhang</p>
                <p className="text-gray-900">Mobile: +86-138-0013-5566</p>
                <p className="text-gray-900">Email: michael.zhang@sgs.com</p>
                <p className="text-xs text-gray-600 mt-2">Available: 8:00 AM - 6:00 PM</p>
              </div>
            </div>
            
            <div className="border border-gray-300 p-3 rounded bg-yellow-50">
              <p className="text-xs text-red-600 mb-2">Schedule Change Policy:</p>
              <ul className="text-xs text-gray-900 space-y-1">
                <li>• Minimum 48 hours notice required</li>
                <li>• Rescheduling fee may apply</li>
                <li>• Contact SGS office: +86-20-8888-5566</li>
                <li>• Email: guangzhou@sgs.com</li>
              </ul>
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
              <li>• <strong>Inspection Duration:</strong> Estimated 6-8 hours depending on product complexity and sample size.</li>
              <li>• <strong>Report Delivery:</strong> Final QC report will be issued within 24-48 hours after inspection completion.</li>
              <li>• <strong>Failed Inspection:</strong> If products fail inspection, re-inspection will be required after corrections (additional fee applies).</li>
              <li>• <strong>Weather/Force Majeure:</strong> In case of severe weather or unforeseen circumstances, inspector will contact all parties immediately.</li>
              <li>• <strong>Photography:</strong> Inspector will take photos during inspection for documentation purposes.</li>
              <li>• <strong>Confidentiality:</strong> All information obtained during inspection will be kept confidential as per SGS policy.</li>
            </ul>
          </div>
        </div>

        {/* Confirmation */}
        <div className="mb-6">
          <h3 className="bg-gray-100 px-3 py-2 text-sm text-gray-900 border-l-4 border-red-600 mb-3">
            CONFIRMATION
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-xs text-gray-600 mb-3">Confirmed by (SGS):</p>
              <div className="border-b-2 border-gray-400 mb-2 h-16 flex items-end pb-2">
                <p className="text-lg text-gray-900" style={{ fontFamily: 'cursive' }}>Michael Zhang</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Inspector Name:</p>
                  <p className="text-gray-900">Michael Zhang</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">Feb 24, 2025</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-300 p-4 rounded bg-blue-50">
              <p className="text-xs text-gray-600 mb-3">Acknowledged by (Supplier):</p>
              <div className="border-b-2 border-gray-400 mb-2 h-16 flex items-end pb-2">
                <p className="text-lg text-gray-900" style={{ fontFamily: 'cursive' }}>Li Wei</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="text-gray-900">Li Wei</p>
                </div>
                <div>
                  <p className="text-gray-600">Date:</p>
                  <p className="text-gray-900">Feb 24, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-xs text-gray-600 text-center">
          <p><strong>SGS Testing & Inspection Services</strong> - Guangzhou Branch</p>
          <p className="mt-1">
            No. 123 Inspection Road, Tianhe District, Guangzhou, Guangdong 510000, China | 
            Tel: +86-20-8888-5566 | Email: guangzhou@sgs.com
          </p>
          <p className="mt-2 text-gray-500">
            Schedule Issued: February 24, 2025 | Document ID: {scheduleNumber} | Page 1 of 1
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
            margin: 20mm;
          }
          .qc-schedule-form {
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0 !important;
            box-sizing: border-box;
          }
        }
        @media screen {
          .qc-schedule-form {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}
