import React from 'react';
import { Progress } from '../ui/progress';

interface InquiryRFQViewProps {
  inquiry: any;
}

export function InquiryRFQView({ inquiry }: InquiryRFQViewProps) {
  // Helper function to calculate container utilization
  const calculateUtilization = (spec: any, totalCbm: number, totalWeight: number) => {
    const spaceUtilization = (totalCbm / spec.volume) * 100;
    const weightUtilization = (totalWeight / spec.maxPayload) * 100;
    return { spaceUtilization, weightUtilization };
  };

  // Helper function for utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 95) return 'text-red-600';
    if (utilization >= 85) return 'text-orange-600';
    if (utilization >= 70) return 'text-green-600';
    return 'text-blue-600';
  };

  // Helper function for utilization background color
  const getUtilizationBgColor = (utilization: number) => {
    if (utilization >= 95) return 'bg-red-600';
    if (utilization >= 85) return 'bg-orange-600';
    if (utilization >= 70) return 'bg-green-600';
    return 'bg-blue-600';
  };

  // Parse shipping info from message
  const parseShippingInfo = (message: string) => {
    const cbmMatch = message.match(/Total CBM:\s*([\d.]+)/);
    const cartonsMatch = message.match(/Cartons:\s*([\d.]+)/);
    const netWeightMatch = message.match(/Net Weight:\s*([\d.]+)/);
    const grossWeightMatch = message.match(/Gross Weight:\s*([\d.]+)/);
    const containerMatch = message.match(/Container:\s*([^|]+)/);

    return {
      cbm: cbmMatch ? cbmMatch[1] : 'N/A',
      cartons: cartonsMatch ? cartonsMatch[1] : 'N/A',
      netWeight: netWeightMatch ? netWeightMatch[1] : 'N/A',
      grossWeight: grossWeightMatch ? grossWeightMatch[1] : 'N/A',
      container: containerMatch ? containerMatch[1].trim() : 'N/A'
    };
  };

  const shippingInfo = parseShippingInfo(inquiry.message || '');
  const totalCbm = parseFloat(shippingInfo.cbm) || 0;
  const totalGrossWeight = parseFloat(shippingInfo.grossWeight) || 0;

  // Container specifications
  const containerSpecs: Record<string, any> = {
    '20GP': { name: '20GP', volume: 28, maxPayload: 21800, internalDim: '5.90m × 2.35m × 2.39m' },
    '20HV': { name: '20HV', volume: 32, maxPayload: 21800, internalDim: '5.90m × 2.35m × 2.70m' },
    '40GP': { name: '40GP', volume: 58, maxPayload: 26580, internalDim: '12.03m × 2.35m × 2.39m' },
    '40HQ': { name: '40HQ', volume: 68, maxPayload: 26580, internalDim: '12.03m × 2.35m × 2.70m' },
  };

  // Determine container type from message
  const containerType = shippingInfo.container.includes('20GP') ? '20GP' :
                       shippingInfo.container.includes('20HV') ? '20HV' :
                       shippingInfo.container.includes('40GP') ? '40GP' :
                       shippingInfo.container.includes('40HQ') ? '40HQ' : '40HQ';

  const containerSpec = containerSpecs[containerType];
  const utilization = calculateUtilization(containerSpec, totalCbm, totalGrossWeight);

  // Calculate total price
  const totalPrice = inquiry.products?.reduce((sum: number, product: any) => {
    const priceMatch = product.specs?.match(/FOB:\s*\$?([\d.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
    return sum + (price * product.quantity);
  }, 0) || 0;

  return (
    <div className="space-y-6 py-4">
      {/* RFQ Header */}
      <div className="border-b-2 border-gray-800 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl mb-2">REQUEST FOR QUOTATION</h1>
            <p className="text-sm text-gray-600">Fujian Gaoshengda Fu Building Materials Co., Ltd.</p>
          </div>
          <div className="text-right">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-2">
              <p className="text-xs">RFQ No.</p>
              <p className="text-lg">{inquiry.inquiryNumber || inquiry.id}</p>
            </div>
            <p className="text-xs text-gray-600">
              {(() => {
                try {
                  const dateStr = inquiry.inquiryDate || inquiry.date;
                  if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  const date = new Date(dateStr);
                  if (isNaN(date.getTime())) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                } catch (e) {
                  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                }
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Buyer Information */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">BUYER INFORMATION</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-gray-600 text-xs mb-1">Company Name:</p>
            <p>{inquiry.customerName || inquiry.customer?.company || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Business Type:</p>
            <p>Importer</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600 text-xs mb-1">Region:</p>
            <p>{inquiry.region || 'North America'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Contact Person:</p>
            <p>{inquiry.customer?.name || inquiry.customerName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Phone:</p>
            <p>{inquiry.customerPhone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Email:</p>
            <p>{inquiry.customerEmail || inquiry.customer?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-1">Website:</p>
            <p>N/A</p>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">PRODUCT DETAILS</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 border-b text-xs">No.</th>
                <th className="text-left px-3 py-2 border-b text-xs">Product Description</th>
                <th className="text-right px-3 py-2 border-b text-xs">Quantity</th>
                <th className="text-right px-3 py-2 border-b text-xs">Unit Price</th>
                <th className="text-right px-3 py-2 border-b text-xs">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {inquiry.products?.map((product: any, index: number) => {
                const priceMatch = product.specs?.match(/FOB:\s*\$?([\d.]+)/);
                const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
                const subtotal = unitPrice * product.quantity;
                
                return (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2 text-xs text-gray-600">{index + 1}</td>
                    <td className="px-3 py-2">
                      <p className="text-xs mb-0.5">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.specs}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{product.quantity.toLocaleString()} pcs</td>
                    <td className="px-3 py-2 text-right text-xs">${unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-xs">${subtotal.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-3 py-2 text-right text-xs">TOTAL:</td>
                <td className="px-3 py-2 text-right text-xs">${totalPrice.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Summary */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">SHIPPING REQUIREMENTS</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Total Cartons</p>
            <p className="text-lg text-orange-600">{shippingInfo.cartons}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Total Volume</p>
            <p className="text-lg text-orange-600">{shippingInfo.cbm} m³</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Gross Weight</p>
            <p className="text-lg text-orange-600">{(parseFloat(shippingInfo.grossWeight) / 1000).toFixed(2)} T</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-gray-600 mb-1">Net Weight</p>
            <p className="text-lg text-orange-600">{(parseFloat(shippingInfo.netWeight) / 1000).toFixed(2)} T</p>
          </div>
        </div>
      </div>

      {/* Container Planning */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">CONTAINER PLANNING</h2>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">Recommended Container:</span>
            <span className="bg-blue-600 text-white px-4 py-1 rounded text-sm">
              1 × {containerSpec.name}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Space Utilization</span>
                <span className={getUtilizationColor(utilization.spaceUtilization)}>
                  {utilization.spaceUtilization.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(utilization.spaceUtilization, 100)} 
                className="h-2"
                indicatorClassName={getUtilizationBgColor(utilization.spaceUtilization)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {totalCbm.toFixed(2)} / {containerSpec.volume} m³
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Weight Utilization</span>
                <span className={getUtilizationColor(utilization.weightUtilization)}>
                  {utilization.weightUtilization.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(utilization.weightUtilization, 100)} 
                className="h-2"
                indicatorClassName={getUtilizationBgColor(utilization.weightUtilization)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(totalGrossWeight / 1000).toFixed(2)} / {(containerSpec.maxPayload / 1000).toFixed(0)} T
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-3 text-xs">
            <p className="text-gray-600 mb-1">Container Specifications:</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-gray-500">Internal Dim:</span>
                <p>{containerSpec.internalDim}</p>
              </div>
              <div>
                <span className="text-gray-500">Max Volume:</span>
                <p>{containerSpec.volume} m³</p>
              </div>
              <div>
                <span className="text-gray-500">Max Payload:</span>
                <p>{(containerSpec.maxPayload / 1000).toFixed(0)} T</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Total */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">ESTIMATED VALUE</h2>
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Estimated FOB Value</p>
              <p className="text-sm text-gray-500">
                ({inquiry.products?.reduce((sum: number, p: any) => sum + p.quantity, 0).toLocaleString()} pieces in {shippingInfo.cartons} cartons)
              </p>
            </div>
            <p className="text-3xl text-orange-600">${totalPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div>
        <h2 className="text-lg mb-3 bg-gray-100 px-3 py-2 rounded">TERMS & CONDITIONS</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ul className="text-xs space-y-2 text-gray-700">
            <li>• This RFQ is valid for 30 days from the date of issue.</li>
            <li>• All prices are estimated FOB values and subject to confirmation.</li>
            <li>• Final pricing, shipping costs, payment terms, and delivery schedule will be negotiated separately.</li>
            <li>• Lead time will be confirmed upon order confirmation.</li>
            <li>• Product specifications and availability are subject to change without notice.</li>
            <li>• Quality control and inspection standards will be agreed upon before shipment.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 pt-4 text-center text-xs text-gray-500">
        <p>This document was generated automatically by the COSUN Building Materials Online Inquiry System.</p>
        <p>For questions or clarifications, please contact our sales team at sales@cosunbm.com</p>
        <p className="mt-2">© {new Date().getFullYear()} Fujian Gaoshengda Fu Building Materials Co., Ltd. All rights reserved.</p>
      </div>
    </div>
  );
}