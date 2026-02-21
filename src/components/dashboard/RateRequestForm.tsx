import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Download, Printer, Ship, Truck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface RateRequestFormProps {
  requestNumber?: string;
  orderNumber?: string;
  onClose?: () => void;
}

interface CheckboxState {
  // Option 1: Ocean Freight
  containerRoute: boolean;
  transitTime: boolean;
  freeTimeDestination: boolean;
  includeSurcharges: boolean;
  sailingSchedule: boolean;
  quotationValidity: boolean;
  
  // Option 2: Door-to-Door
  pickupFactory: boolean;
  oceanFreight: boolean;
  customsClearance: boolean;
  truckingXiamen: boolean;
  destinationCharges: boolean;
  deliveryWarehouse: boolean;
}

export function RateRequestForm({ 
  requestNumber = 'RR-2025-0315',
  orderNumber,
  onClose 
}: RateRequestFormProps) {
  // State for all checkboxes
  const [checkboxes, setCheckboxes] = useState<CheckboxState>({
    containerRoute: false,
    transitTime: false,
    freeTimeDestination: false,
    includeSurcharges: false,
    sailingSchedule: false,
    quotationValidity: false,
    pickupFactory: false,
    oceanFreight: false,
    customsClearance: false,
    truckingXiamen: false,
    destinationCharges: false,
    deliveryWarehouse: false,
  });

  // Additional information state
  const [additionalServices, setAdditionalServices] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Toggle checkbox
  const toggleCheckbox = (key: keyof CheckboxState) => {
    setCheckboxes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
      const content = document.querySelector('.rate-request-form') as HTMLElement;
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
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save PDF
      pdf.save(`Rate_Request_${requestNumber}.pdf`);

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('PDF downloaded successfully!', {
        description: `File saved as Rate_Request_${requestNumber}.pdf`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', {
        description: 'Please try again or use the Print option.'
      });
    }
  };

  const handleSubmit = () => {
    toast.success('Rate request submitted successfully!', {
      description: `Request ${requestNumber} has been sent to our freight team.`
    });
  };

  return (
    <div className="bg-white">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl text-gray-900">Rate Request - Please Quote</h2>
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
      <div className="rate-request-form bg-white p-6 print:p-0" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl text-red-600 mb-1">RATE REQUEST - PLEASE QUOTE</h1>
              <p className="text-sm text-gray-600">Freight Rate Quotation Request</p>
            </div>
            <div className="text-right">
              <div className="bg-red-600 text-white px-4 py-2 rounded mb-2">
                <p className="text-xs">REQUEST NO.</p>
                <p className="text-lg">{requestNumber}</p>
              </div>
              <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Reference Information */}
        {orderNumber && (
          <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-6">
            <div className="text-sm">
              <p className="text-xs text-gray-600 mb-1">Related Purchase Order</p>
              <p className="font-medium text-gray-900">{orderNumber}</p>
            </div>
          </div>
        )}

        {/* Introduction */}
        <div className="mb-6">
          <p className="text-gray-900">Please provide quotation for the following:</p>
        </div>

        {/* Option 1: Ocean Freight (FCL) */}
        <div className="border-l-4 border-red-600 bg-red-50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Ship className="h-5 w-5 text-red-600" />
            <h3 className="text-red-600">Option 1: Ocean Freight (FCL)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.containerRoute}
                onChange={() => toggleCheckbox('containerRoute')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">1 x 40'HQ Container - Xiamen to Los Angeles</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.includeSurcharges}
                onChange={() => toggleCheckbox('includeSurcharges')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Include BAF, CAF, and other surcharges</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.transitTime}
                onChange={() => toggleCheckbox('transitTime')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Transit time</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.sailingSchedule}
                onChange={() => toggleCheckbox('sailingSchedule')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Sailing schedule (weekly/bi-weekly)</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.freeTimeDestination}
                onChange={() => toggleCheckbox('freeTimeDestination')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Free time at destination port</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.quotationValidity}
                onChange={() => toggleCheckbox('quotationValidity')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Validity of quotation</span>
            </label>
          </div>
        </div>

        {/* Option 2: Door-to-Door Service */}
        <div className="border-l-4 border-red-600 bg-red-50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-red-600" />
            <h3 className="text-red-600">Option 2: Door-to-Door Service (If available)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.pickupFactory}
                onChange={() => toggleCheckbox('pickupFactory')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Pickup from factory (Fuzhou)</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.truckingXiamen}
                onChange={() => toggleCheckbox('truckingXiamen')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Trucking to Xiamen port</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.oceanFreight}
                onChange={() => toggleCheckbox('oceanFreight')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Ocean freight</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.destinationCharges}
                onChange={() => toggleCheckbox('destinationCharges')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Destination port charges</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.customsClearance}
                onChange={() => toggleCheckbox('customsClearance')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Customs clearance (USA)</span>
            </label>

            <label 
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkboxes.deliveryWarehouse}
                onChange={() => toggleCheckbox('deliveryWarehouse')}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-900">Delivery to Ontario, CA warehouse</span>
            </label>
          </div>
        </div>

        {/* Additional Services Required */}
        <div className="border-l-4 border-gray-400 bg-gray-50 p-6 mb-6">
          <h3 className="text-gray-900 mb-4">ADDITIONAL SERVICES REQUIRED</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Additional Services or Specifications
              </label>
              <Textarea
                value={additionalServices}
                onChange={(e) => setAdditionalServices(e.target.value)}
                placeholder="Please specify any additional services you require (e.g., insurance, palletization, special handling)..."
                className="w-full min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Special Requirements or Notes
              </label>
              <Textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Any special requirements or notes for this shipment..."
                className="w-full min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border border-gray-300 rounded p-4 mb-6 bg-gray-50">
          <h3 className="text-sm text-red-600 mb-3 border-b border-gray-300 pb-2">REQUESTER INFORMATION</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-600">Company Name</p>
              <p className="font-medium text-gray-900">Your Company Name</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Contact Person</p>
              <p className="font-medium text-gray-900">Your Name</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Email</p>
              <p className="text-gray-900">your.email@company.com</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Phone</p>
              <p className="text-gray-900">+1 (XXX) XXX-XXXX</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-6">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <p className="mb-1">Fujian Gaoshengda Fuji Building Materials Co., Ltd.</p>
              <p>Email: freight@cosunhardware.com | Tel: +86-591-8888-8888</p>
            </div>
            <div className="text-right">
              <p className="text-red-600">www.cosunhardware.com</p>
            </div>
          </div>
        </div>

        {/* Submit Button - Only visible on screen, not in print */}
        <div className="mt-6 flex justify-center print:hidden">
          <Button 
            className="bg-red-600 hover:bg-red-700 px-8 py-6 text-lg"
            onClick={handleSubmit}
          >
            Submit Rate Request
          </Button>
        </div>
      </div>
    </div>
  );
}