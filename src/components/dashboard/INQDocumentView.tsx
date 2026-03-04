import React from 'react';
import { Building2, Package } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface INQDocumentViewProps {
  inquiry: any;
  zoom?: number;
}

export function INQDocumentView({ inquiry, zoom = 138 }: INQDocumentViewProps) {
  const { user } = useUser();

  // 🔧 Unified data format - Compatible with Customer Portal and Admin Portal
  const unifiedInquiry = {
    id: inquiry.id || inquiry.inquiryNumber || 'N/A',
    date: inquiry.date || inquiry.inquiryDate || new Date().toLocaleDateString('en-US'),
    buyerInfo: inquiry.buyerInfo || {
      companyName: inquiry.customerName || inquiry.customer?.company || user?.company || 'N/A',
      contactPerson: inquiry.customer?.name || inquiry.customerName || user?.name || 'N/A',
      email: inquiry.customerEmail || inquiry.customer?.email || user?.email || 'N/A',
      phone: inquiry.customerPhone || inquiry.customer?.phone || user?.phone || 'N/A',
      address: inquiry.deliveryAddress || inquiry.buyerInfo?.address || user?.address || 'N/A',
      businessType: inquiry.buyerInfo?.businessType || 'Retailer'
    },
    products: inquiry.products?.map((product: any, idx: number) => {
      // Extract pure SKU code - Smart extraction for complex SKU patterns
      let pureSku = product.sku || product.productCode || product.id || '';
      
      // Strategy: Extract the last meaningful segment (usually category abbreviation + code)
      // Example: "appliances-refrigerators-french-door-ref-fd-001" => "FD-001"
      if (pureSku && pureSku !== 'N/A') {
        // Split by hyphen and find the last 2-3 segments that look like a product code
        const segments = pureSku.split('-');
        
        // Look for pattern like "fd-001" or "ref-fd-001" at the end
        if (segments.length >= 2) {
          const lastSegment = segments[segments.length - 1]; // "001"
          const secondLastSegment = segments[segments.length - 2]; // "fd"
          
          // Check if last segment is numeric/alphanumeric code
          if (/^[a-zA-Z0-9]+$/.test(lastSegment)) {
            // If second last is short (likely abbreviation), include it
            if (secondLastSegment && secondLastSegment.length <= 4 && /^[a-zA-Z]+$/.test(secondLastSegment)) {
              pureSku = `${secondLastSegment.toUpperCase()}-${lastSegment}`;
            } else {
              pureSku = lastSegment;
            }
          }
        }
      }
      
      // If still no SKU, generate a simple numeric code
      if (!pureSku || pureSku === 'N/A') {
        pureSku = String(idx + 1).padStart(4, '0');
      }
      
      return {
        productName: product.productName || product.name || 'N/A',
        sku: pureSku,
        image: product.image || '',
        specification: product.specification || product.specifications || product.specs || 'Standard',
        quantity: product.quantity || 0,
        unit: product.unit || 'pcs',
        unitPrice: product.targetPrice || product.unitPrice || product.price || 0,
        // Container planning data
        length: product.length || 0,
        width: product.width || 0,
        height: product.height || 0,
        weight: product.weight || 0,
        netWeight: product.netWeight || 0,
        pcsPerCarton: product.pcsPerCarton || 0
      };
    }) || [],
    shippingInfo: inquiry.shippingInfo || {},
    containerInfo: inquiry.containerInfo || null,
    message: inquiry.message || ''
  };

  // Calculate totals
  const totalQuantity = unifiedInquiry.products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
  const totalValue = unifiedInquiry.products.reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.unitPrice || 0)), 0);
  
  // Calculate shipping totals
  const totalVolume = unifiedInquiry.products.reduce((sum: number, p: any) => {
    if (p.length && p.width && p.height) {
      const cbm = (p.length * p.width * p.height * p.quantity) / 1000000;
      return sum + cbm;
    }
    return sum;
  }, 0);

  const totalGrossWeight = unifiedInquiry.products.reduce((sum: number, p: any) => {
    return sum + ((p.weight || 0) * (p.quantity || 0));
  }, 0);

  const totalNetWeight = unifiedInquiry.products.reduce((sum: number, p: any) => {
    return sum + ((p.netWeight || 0) * (p.quantity || 0));
  }, 0);

  const totalCartons = unifiedInquiry.products.reduce((sum: number, p: any) => {
    if (p.pcsPerCarton > 0) {
      return sum + Math.ceil(p.quantity / p.pcsPerCarton);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6 py-4">
      {/* 🎨 A4 Professional INQ Document */}
      <div className="flex justify-center overflow-auto rfq-print-container" style={{ padding: '20px 0' }}>
        <div 
          className="bg-white shadow-lg rfq-document"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '10mm 12mm',
            boxSizing: 'border-box',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out'
          }}
          data-rfq-content
        >
          {/* ========== HEADER SECTION ========== */}
          <div className="mb-3">
            <div className="flex justify-between items-start mb-3">
              {/* Left: Company Branding */}
              <div className="flex items-center gap-3">
                <div 
                  className="flex-shrink-0 flex items-center justify-center" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    backgroundColor: '#D32F2F',
                    borderRadius: '2px'
                  }}
                >
                  <Building2 className="text-white" style={{ width: '24px', height: '24px', strokeWidth: 2.5 }} />
                </div>
                <div>
                  <div 
                    className="text-gray-900 leading-none mb-0.5" 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 700,
                      letterSpacing: '-0.2px'
                    }}
                  >
                    COSUN BUILDING MATERIALS
                  </div>
                  <div className="text-gray-600" style={{ fontSize: '8px', fontWeight: 400 }}>
                    Fujian Gaoshengda Fu Building Materials Co., Ltd.
                  </div>
                </div>
              </div>
              
              {/* Right: INQ Badge */}
              <div>
                <div 
                  className="text-white text-center px-4 py-1.5"
                  style={{ 
                    backgroundColor: '#D32F2F',
                    borderRadius: '2px'
                  }}
                >
                  <div 
                    className="uppercase" 
                    style={{ 
                      fontSize: '7px', 
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      opacity: 0.85,
                      marginBottom: '2px'
                    }}
                  >
                    INQ NUMBER
                  </div>
                  <div 
                    style={{ 
                      fontSize: '15px', 
                      fontWeight: 700,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {unifiedInquiry.id}
                  </div>
                </div>
                <div className="text-right text-gray-500 mt-1" style={{ fontSize: '8px' }}>
                  {unifiedInquiry.date}
                </div>
              </div>
            </div>

            {/* Company Contact Info - Compact */}
            <div className="flex items-center gap-4 text-gray-600" style={{ fontSize: '8px' }}>
              <span>📍 Fujian Province, China</span>
              <span>•</span>
              <span>📧 services@cosunchina.com</span>
              <span>•</span>
              <span>🌐 www.cosunchina.com</span>
            </div>

            {/* Brand Separator */}
            <div 
              className="mt-4" 
              style={{ 
                height: '3px', 
                backgroundColor: '#D32F2F'
              }}
            />
          </div>

          {/* ========== TITLE ========== */}
          <div className="mb-3">
            <h1 
              className="text-gray-900 mb-1" 
              style={{ 
                fontSize: '18px', 
                fontWeight: 700,
                letterSpacing: '-0.3px'
              }}
            >
              CUSTOMER INQUIRY
            </h1>
            <p className="text-gray-600" style={{ fontSize: '10px' }}>
              We kindly request your best pricing and delivery terms for the following items
            </p>
          </div>

          {/* ========== BUYER INFORMATION ========== */}
          <div className="mb-3">
            <div 
              className="text-white px-3 py-1.5 mb-2"
              style={{ 
                backgroundColor: '#D32F2F',
                borderRadius: '2px'
              }}
            >
              <h3 
                className="uppercase" 
                style={{ 
                  fontSize: '9px', 
                  fontWeight: 700,
                  letterSpacing: '0.8px'
                }}
              >
                BUYER INFORMATION
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-x-6 gap-y-2.5" style={{ fontSize: '9px' }}>
              <div>
                <div className="text-gray-500 uppercase mb-0.5" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  COMPANY NAME
                </div>
                <div className="text-gray-900" style={{ fontWeight: 500 }}>
                  {unifiedInquiry.buyerInfo?.companyName}
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-0.5" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  CONTACT PERSON
                </div>
                <div className="text-gray-900" style={{ fontWeight: 500 }}>
                  {unifiedInquiry.buyerInfo?.contactPerson}
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-0.5" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  BUSINESS TYPE
                </div>
                <div className="text-gray-900" style={{ fontWeight: 500 }}>
                  {unifiedInquiry.buyerInfo?.businessType}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 uppercase mb-0.5" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  ADDRESS
                </div>
                <div className="text-gray-900" style={{ fontWeight: 500 }}>
                  {unifiedInquiry.buyerInfo?.address}
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-0.5" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  PHONE
                </div>
                <div className="text-gray-900" style={{ fontWeight: 500 }}>
                  {unifiedInquiry.buyerInfo?.phone}
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-0.5" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  EMAIL
                </div>
                <div className="text-gray-900" style={{ fontWeight: 500 }}>
                  {unifiedInquiry.buyerInfo?.email}
                </div>
              </div>
            </div>
          </div>

          {/* ========== PRODUCT DETAILS TABLE ========== */}
          <div className="mb-3">
            <div 
              className="text-white px-3 py-1.5 mb-2"
              style={{ 
                backgroundColor: '#D32F2F',
                borderRadius: '2px'
              }}
            >
              <h3 
                className="uppercase" 
                style={{ 
                  fontSize: '9px', 
                  fontWeight: 700,
                  letterSpacing: '0.8px'
                }}
              >
                PRODUCT SPECIFICATIONS
              </h3>
            </div>
            
            <div className="border border-gray-300" style={{ borderRadius: '2px' }}>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr 
                    style={{ 
                      backgroundColor: '#F8F8F8',
                      borderBottom: '2px solid #D32F2F'
                    }}
                  >
                    <th 
                      className="text-center px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '4%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      NO.
                    </th>
                    <th 
                      className="text-left px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '9%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      SKU CODE
                    </th>
                    <th 
                      className="text-center px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '8%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      IMAGE
                    </th>
                    <th 
                      className="text-left px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '38%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      DESCRIPTION & SPECS
                    </th>
                    <th 
                      className="text-right px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '10%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      QTY
                    </th>
                    <th 
                      className="text-right px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '10%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      UNIT
                    </th>
                    <th 
                      className="text-right px-2 py-2 text-gray-700 uppercase border-r border-gray-200" 
                      style={{ 
                        width: '11%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      TARGET PRICE
                    </th>
                    <th 
                      className="text-right px-2 py-2 text-gray-700 uppercase" 
                      style={{ 
                        width: '10%',
                        fontSize: '7.5px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}
                    >
                      SUBTOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedInquiry.products?.map((product: any, index: number) => {
                    const subtotal = (product.quantity || 0) * (product.unitPrice || 0);
                    return (
                      <tr 
                        key={`product-${index}`} 
                        className="border-b border-gray-200"
                        style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}
                      >
                        <td className="px-2 py-1.5 text-gray-600 text-center border-r border-gray-100" style={{ fontSize: '8.5px', fontWeight: 500 }}>
                          {index + 1}
                        </td>
                        <td className="px-2 py-1.5 text-gray-900 font-mono border-r border-gray-100" style={{ fontSize: '7.5px', fontWeight: 600 }}>
                          {product.sku}
                        </td>
                        <td className="px-2 py-1.5 text-center border-r border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center"
                              style={{ 
                                width: '40px', 
                                height: '40px',
                                border: '1px solid #E5E5E5',
                                borderRadius: '2px'
                              }}
                            >
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.productName}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              ) : (
                                <Package className="text-gray-400" style={{ width: '20px', height: '20px' }} />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-100">
                          <div className="mb-1 text-gray-900" style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1.3 }}>
                            {product.productName}
                          </div>
                          <div className="text-gray-600" style={{ fontSize: '7.5px', lineHeight: 1.4 }}>
                            {product.specification}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-900 border-r border-gray-100" style={{ fontSize: '9px', fontWeight: 600 }}>
                          {(product.quantity || 0).toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-600 border-r border-gray-100" style={{ fontSize: '8px' }}>
                          {product.unit}
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-900 border-r border-gray-100" style={{ fontSize: '9px', fontWeight: 600 }}>
                          ${Number(product.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-900" style={{ fontSize: '9px', fontWeight: 700 }}>
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* TOTAL ROW */}
                  <tr 
                    style={{ 
                      backgroundColor: '#FFEBEE',
                      borderTop: '2px solid #D32F2F'
                    }}
                  >
                    <td colSpan={4} className="px-3 py-2.5 text-right text-gray-900 uppercase" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>
                      TOTAL
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-900 border-r border-gray-200" style={{ fontSize: '10px', fontWeight: 700 }}>
                      {totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-600 border-r border-gray-200" style={{ fontSize: '8px' }}>
                      pcs
                    </td>
                    <td className="px-2 py-2.5 text-right border-r border-gray-200" style={{ fontSize: '9px', fontWeight: 600 }}>
                      -
                    </td>
                    <td className="px-2 py-2.5 text-right" style={{ fontSize: '11px', fontWeight: 700, color: '#D32F2F' }}>
                      ${totalValue.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========== SHIPPING & LOGISTICS ========== */}
          <div className="mb-3">
            <div 
              className="text-white px-3 py-1.5 mb-2"
              style={{ 
                backgroundColor: '#D32F2F',
                borderRadius: '2px'
              }}
            >
              <h3 
                className="uppercase" 
                style={{ 
                  fontSize: '9px', 
                  fontWeight: 700,
                  letterSpacing: '0.8px'
                }}
              >
                SHIPPING & LOGISTICS
              </h3>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <div 
                className="text-center p-2.5"
                style={{ 
                  border: '1.5px solid #E5E5E5',
                  borderRadius: '2px',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <div 
                  className="text-gray-500 uppercase mb-1" 
                  style={{ 
                    fontSize: '7px', 
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  CARTONS
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#D32F2F' }}>
                  {totalCartons > 0 ? totalCartons : 'TBD'}
                </div>
                <div className="text-gray-500" style={{ fontSize: '7px' }}>Ctns</div>
              </div>
              
              <div 
                className="text-center p-2.5"
                style={{ 
                  border: '1.5px solid #E5E5E5',
                  borderRadius: '2px',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <div 
                  className="text-gray-500 uppercase mb-1" 
                  style={{ 
                    fontSize: '7px', 
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  VOLUME
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#D32F2F' }}>
                  {totalVolume > 0 ? totalVolume.toFixed(2) : 'TBD'}
                </div>
                <div className="text-gray-500" style={{ fontSize: '7px' }}>CBM</div>
              </div>
              
              <div 
                className="text-center p-2.5"
                style={{ 
                  border: '1.5px solid #E5E5E5',
                  borderRadius: '2px',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <div 
                  className="text-gray-500 uppercase mb-1" 
                  style={{ 
                    fontSize: '7px', 
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  GROSS WT
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#D32F2F' }}>
                  {totalGrossWeight > 0 ? (totalGrossWeight / 1000).toFixed(2) : 'TBD'}
                </div>
                <div className="text-gray-500" style={{ fontSize: '7px' }}>Tons</div>
              </div>
              
              <div 
                className="text-center p-2.5"
                style={{ 
                  border: '1.5px solid #E5E5E5',
                  borderRadius: '2px',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <div 
                  className="text-gray-500 uppercase mb-1" 
                  style={{ 
                    fontSize: '7px', 
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  NET WT
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#D32F2F' }}>
                  {totalNetWeight > 0 ? (totalNetWeight / 1000).toFixed(2) : 'TBD'}
                </div>
                <div className="text-gray-500" style={{ fontSize: '7px' }}>Tons</div>
              </div>
            </div>
          </div>

          {/* ========== ADDITIONAL NOTES ========== */}
          {unifiedInquiry.message && (
            <div className="mb-3">
              <div 
                className="text-white px-3 py-1.5 mb-2"
                style={{ 
                  backgroundColor: '#D32F2F',
                  borderRadius: '2px'
                }}
              >
                <h3 
                  className="uppercase" 
                  style={{ 
                    fontSize: '9px', 
                    fontWeight: 700,
                    letterSpacing: '0.8px'
                  }}
                >
                  ADDITIONAL REQUIREMENTS
                </h3>
              </div>
              <div 
                className="p-3 text-gray-700"
                style={{ 
                  fontSize: '9px',
                  lineHeight: 1.6,
                  border: '1px solid #E5E5E5',
                  borderRadius: '2px',
                  backgroundColor: '#FAFAFA'
                }}
              >
                {unifiedInquiry.message}
              </div>
            </div>
          )}

          {/* ========== TERMS & CONDITIONS ========== */}
          <div className="mb-3">
            <div 
              className="text-white px-3 py-1.5 mb-2"
              style={{ 
                backgroundColor: '#D32F2F',
                borderRadius: '2px'
              }}
            >
              <h3 
                className="uppercase" 
                style={{ 
                  fontSize: '9px', 
                  fontWeight: 700,
                  letterSpacing: '0.8px'
                }}
              >
                QUOTATION REQUIREMENTS
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4" style={{ fontSize: '8px' }}>
              <div>
                <div className="text-gray-500 uppercase mb-1" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  PRICING TERMS
                </div>
                <div className="text-gray-700" style={{ lineHeight: 1.5 }}>
                  • FOB prices required<br/>
                  • Include all applicable taxes<br/>
                  • Specify currency
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-1" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  DELIVERY TERMS
                </div>
                <div className="text-gray-700" style={{ lineHeight: 1.5 }}>
                  • Lead time confirmation<br/>
                  • Production capacity<br/>
                  • Packaging details
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-1" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  PAYMENT TERMS
                </div>
                <div className="text-gray-700" style={{ lineHeight: 1.5 }}>
                  • Payment methods accepted<br/>
                  • Deposit requirements<br/>
                  • Credit terms if applicable
                </div>
              </div>
            </div>
          </div>

          {/* ========== FOOTER ========== */}
          <div 
            className="pt-2 mt-3"
            style={{ 
              borderTop: '2px solid #E5E5E5'
            }}
          >
            <div className="grid grid-cols-2 gap-6" style={{ fontSize: '8px' }}>
              <div>
                <div className="text-gray-500 uppercase mb-1" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  QUOTATION VALIDITY
                </div>
                <div className="text-gray-700">
                  Please provide quotation validity period and estimated delivery schedule.
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase mb-1" style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  CONTACT FOR QUERIES
                </div>
                <div className="text-gray-700">
                  For any questions regarding this inquiry, please contact us at services@cosunchina.com
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center text-gray-400" style={{ fontSize: '7px' }}>
              Generated by COSUN B2B Platform | Document ID: {unifiedInquiry.id} | Date: {unifiedInquiry.date}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}