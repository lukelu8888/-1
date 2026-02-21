import React from 'react';
import { format } from 'date-fns';

interface QuotationPDFTemplateProps {
  quotation: any;
  containerInfo?: any;
}

export const QuotationPDFTemplate = React.forwardRef<HTMLDivElement, QuotationPDFTemplateProps>(
  ({ quotation, containerInfo }, ref) => {
    const calculateTotals = () => {
      let totalCartons = 0;
      let totalCBM = 0;
      let totalGrossWeight = 0;
      let totalNetWeight = 0;
      let subtotal = 0;

      quotation.products.forEach((product: any) => {
        const cartons = Math.ceil(product.quantity / product.pcsPerCarton);
        const cbm = (product.cartonLength * product.cartonWidth * product.cartonHeight) / 1000000 * cartons;
        totalCartons += cartons;
        totalCBM += cbm;
        totalGrossWeight += product.grossWeight * cartons;
        totalNetWeight += product.netWeight * cartons;
        subtotal += product.quantity * product.unitPrice;
      });

      return {
        totalCartons,
        totalCBM: totalCBM.toFixed(3),
        totalGrossWeight: totalGrossWeight.toFixed(2),
        totalNetWeight: totalNetWeight.toFixed(2),
        subtotal: subtotal.toFixed(2),
      };
    };

    const totals = calculateTotals();

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm',
          backgroundColor: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10pt',
          color: '#000',
          lineHeight: '1.4',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px', borderBottom: '2px solid #dc2626', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '24pt', fontWeight: 'bold', color: '#dc2626', margin: '0 0 5px 0' }}>
                COSUN
              </h1>
              <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>
                Fujian Gaoshengda Fulian Building Materials Co., Ltd.
              </p>
              <p style={{ fontSize: '8pt', color: '#666', margin: '5px 0 0 0' }}>
                Add: [Your Address]<br />
                Tel: [Your Phone] | Email: [Your Email]<br />
                Web: www.cosun.com
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                QUOTATION
              </h2>
              <p style={{ fontSize: '9pt', margin: '2px 0' }}>
                <strong>Quotation No:</strong> {quotation.id}
              </p>
              <p style={{ fontSize: '9pt', margin: '2px 0' }}>
                <strong>Date:</strong> {quotation.date}
              </p>
              <p style={{ fontSize: '9pt', margin: '2px 0' }}>
                <strong>Valid Until:</strong> {quotation.validUntil}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 8px 0', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
            BILL TO:
          </h3>
          <p style={{ fontSize: '9pt', margin: '2px 0' }}>
            <strong>Company:</strong> {quotation.customer}
          </p>
          <p style={{ fontSize: '9pt', margin: '2px 0' }}>
            <strong>Contact:</strong> {quotation.contactPerson || 'N/A'}
          </p>
          <p style={{ fontSize: '9pt', margin: '2px 0' }}>
            <strong>Email:</strong> {quotation.email || 'N/A'}
          </p>
        </div>

        {/* Product Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '8pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#dc2626', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', width: '5%' }}>No.</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', width: '25%' }}>Product Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '10%' }}>Qty (pcs)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', width: '10%' }}>Unit Price</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', width: '10%' }}>Amount</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '8%' }}>Pcs/Ctn</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '8%' }}>Cartons</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '12%' }}>Carton Size (cm)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '12%' }}>GW/NW (kg)</th>
            </tr>
          </thead>
          <tbody>
            {quotation.products.map((product: any, index: number) => {
              const cartons = Math.ceil(product.quantity / product.pcsPerCarton);
              const amount = product.quantity * product.unitPrice;
              return (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px' }}>{product.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{product.quantity}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>
                    ${product.unitPrice.toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>
                    ${amount.toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>
                    {product.pcsPerCarton}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{cartons}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '7pt' }}>
                    {product.cartonLength}×{product.cartonWidth}×{product.cartonHeight}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>
                    {(product.grossWeight * cartons).toFixed(1)}/{(product.netWeight * cartons).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#fee', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                TOTAL:
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {quotation.products.reduce((sum: number, p: any) => sum + p.quantity, 0)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                ${totals.subtotal}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {totals.totalCartons}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {totals.totalCBM} CBM
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {totals.totalGrossWeight}/{totals.totalNetWeight}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Container Suggestion */}
        {containerInfo && (
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '12px', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e40af' }}>
              📦 Container Loading Suggestion
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '8pt' }}>
              <div>
                <strong>Suggested Container:</strong><br />
                {containerInfo.suggestedContainer}
              </div>
              <div>
                <strong>CBM Utilization:</strong><br />
                {containerInfo.utilizationCBM}%
              </div>
              <div>
                <strong>Weight Utilization:</strong><br />
                {containerInfo.utilizationWeight}%
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div style={{ marginBottom: '15px', fontSize: '8pt' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 8px 0', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
            TERMS & CONDITIONS:
          </h3>
          <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Price Terms:</strong> FOB Xiamen Port / CIF [Destination Port]</li>
            <li><strong>Payment Terms:</strong> 30% T/T deposit, 70% balance before shipment</li>
            <li><strong>Lead Time:</strong> 30-45 days after deposit received</li>
            <li><strong>Validity:</strong> This quotation is valid for 30 days from the date of issue</li>
            <li><strong>MOQ:</strong> As specified per product</li>
            <li><strong>Packing:</strong> Standard export carton packing</li>
          </ul>
        </div>

        {/* Signature Section */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '45%' }}>
            <p style={{ fontSize: '9pt', margin: '0 0 30px 0' }}>
              <strong>Prepared by:</strong>
            </p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
              <p style={{ fontSize: '8pt', margin: 0 }}>COSUN Sales Representative</p>
              <p style={{ fontSize: '8pt', margin: 0 }}>Date: {quotation.date}</p>
            </div>
          </div>
          <div style={{ width: '45%' }}>
            <p style={{ fontSize: '9pt', margin: '0 0 30px 0' }}>
              <strong>Approved by:</strong>
            </p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
              <p style={{ fontSize: '8pt', margin: 0 }}>Sales Manager</p>
              <p style={{ fontSize: '8pt', margin: 0 }}>COSUN</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '7pt', color: '#666' }}>
          <p style={{ margin: 0 }}>
            Thank you for your business! For any questions, please contact us at sales@cosun.com
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            Fujian Gaoshengda Fulian Building Materials Co., Ltd. | 20 Years of Excellence in Building Materials
          </p>
        </div>
      </div>
    );
  }
);

QuotationPDFTemplate.displayName = 'QuotationPDFTemplate';
