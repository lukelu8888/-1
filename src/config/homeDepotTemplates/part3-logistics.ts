import { FormTemplate } from '../formTemplates';

// Part 3: 商业发票 & 提单
const hdTemplatesPart3: FormTemplate[] = [
  // 6. 商业发票 (Commercial Invoice)
  {
    id: 'hd_commercial_invoice',
    name: '商业发票',
    name_en: 'COMMERCIAL INVOICE',
    type: 'commercial_invoice',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '用于国际贸易的商业发票',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Header
      {
        id: 'ci_header',
        name: 'ci_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'ci_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 6px;">
                      FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                    </div>
                    <div style="font-size: 8px; color: #333; line-height: 1.5;">
                      EXPORTER<br/>
                      No. 123 Industrial Park Road<br/>
                      Fuzhou, Fujian 350000, China<br/>
                      Tel: +86-591-8888-8888<br/>
                      Email: export@cosun.com
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; margin-bottom: 4px;">
                      COMMERCIAL
                    </div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302;">
                      INVOICE
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Invoice Info
      {
        id: 'ci_info',
        name: 'ci_info',
        title: '',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'invoice_no',
            label: 'INVOICE NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'COSUN-CI-2024-0001',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'invoice_date',
            label: 'INVOICE DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'po_ref',
            label: 'PO REFERENCE',
            type: 'text',
            required: true,
            width: '33%',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'contract_ref',
            label: 'CONTRACT NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'lc_no',
            label: 'L/C NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'payment_terms',
            label: 'PAYMENT TERMS',
            type: 'text',
            required: true,
            width: '33%'
          }
        ]
      },

      // Parties
      {
        id: 'ci_parties',
        name: 'ci_parties',
        title: '',
        layout: 'double',
        fields: [
          {
            id: 'consignee',
            label: 'CONSIGNEE',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 5,
            defaultValue: 'THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'notify_party',
            label: 'NOTIFY PARTY',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 5,
            placeholder: 'Same as consignee or other party...'
          }
        ]
      },

      // Shipping Details
      {
        id: 'shipping_details',
        name: 'shipping_details',
        title: 'SHIPPING DETAILS',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'port_of_loading',
            label: 'PORT OF LOADING',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'Fuzhou, China'
          },
          {
            id: 'port_of_discharge',
            label: 'PORT OF DISCHARGE',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'final_destination',
            label: 'FINAL DESTINATION',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'vessel_flight',
            label: 'VESSEL/FLIGHT',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'sailing_date',
            label: 'SAILING DATE',
            type: 'date',
            required: false,
            width: '33%'
          },
          {
            id: 'delivery_terms',
            label: 'DELIVERY TERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP']
          }
        ]
      },

      // Goods Description
      {
        id: 'goods_table',
        name: 'goods_table',
        title: 'DESCRIPTION OF GOODS',
        layout: 'table',
        fields: [
          {
            id: 'goods',
            label: 'Goods',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'marks', label: 'MARKS & NOS.', width: '10%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION OF GOODS', width: '30%', type: 'text' },
              { id: 'hs_code', label: 'HS CODE', width: '10%', type: 'text' },
              { id: 'quantity', label: 'QUANTITY', width: '10%', type: 'number' },
              { id: 'unit', label: 'UNIT', width: '8%', type: 'text' },
              { id: 'unit_price', label: 'UNIT PRICE', width: '12%', type: 'currency' },
              { id: 'amount', label: 'AMOUNT', width: '12%', type: 'currency' }
            ],
            sampleRows: []
          }
        ]
      },

      // Totals
      {
        id: 'ci_totals',
        name: 'ci_totals',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'total_fob',
            label: 'TOTAL FOB VALUE',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            fontSize: 11
          },
          {
            id: 'freight',
            label: 'FREIGHT',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right'
          },
          {
            id: 'insurance',
            label: 'INSURANCE',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right'
          },
          {
            id: 'total_cif',
            label: 'TOTAL INVOICE VALUE',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          }
        ]
      },

      // Packaging
      {
        id: 'packaging',
        name: 'packaging',
        title: 'PACKAGING DETAILS',
        layout: 'triple',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'total_packages',
            label: 'TOTAL NO. OF PACKAGES',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'gross_weight',
            label: 'GROSS WEIGHT (KG)',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'net_weight',
            label: 'NET WEIGHT (KG)',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'measurement',
            label: 'MEASUREMENT (CBM)',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'container_no',
            label: 'CONTAINER NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'seal_no',
            label: 'SEAL NO.',
            type: 'text',
            required: false,
            width: '33%'
          }
        ]
      },

      // Declaration
      {
        id: 'declaration',
        name: 'declaration',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'declaration_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px; border: 2px solid #F96302; background: #FFFBF5;">
                <strong style="color: #F96302;">DECLARATION:</strong><br/>
                We hereby certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct. The goods are of Chinese origin.
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'Original for consignee | Country of Origin: China',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'FOR COSUN - AUTHORIZED SIGNATURE',
            role: 'exporter',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

  // 7. 提单 (Bill of Lading)
  {
    id: 'hd_bill_of_lading',
    name: '提单',
    name_en: 'BILL OF LADING',
    type: 'bill_of_lading',
    owner: 'logistics',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '海运/空运提单',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // BL Header
      {
        id: 'bl_header',
        name: 'bl_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'bl_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302; background: linear-gradient(to right, #FFFFFF, #FFF8F0);">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 900; color: #F96302; margin-bottom: 4px;">
                    BILL OF LADING
                  </div>
                  <div style="font-size: 10px; color: #666;">
                    FOR OCEAN/AIR FREIGHT SHIPMENT
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // BL Number & Details
      {
        id: 'bl_details',
        name: 'bl_details',
        title: '',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'bl_number',
            label: 'B/L NUMBER',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'BL-2024-000001',
            fontWeight: 'bold',
            fontSize: 11,
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'bl_date',
            label: 'B/L DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'bl_type',
            label: 'B/L TYPE',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Ocean B/L', 'Air Waybill', 'Master B/L', 'House B/L']
          },
          {
            id: 'carrier',
            label: 'CARRIER',
            type: 'text',
            required: true,
            width: '33%',
            placeholder: 'Shipping Line / Airline'
          },
          {
            id: 'booking_no',
            label: 'BOOKING NO.',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'freight_payment',
            label: 'FREIGHT PAYMENT',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Prepaid', 'Collect', 'Third Party']
          }
        ]
      },

      // Shipper, Consignee, Notify
      {
        id: 'bl_parties',
        name: 'bl_parties',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'shipper',
            label: 'SHIPPER',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3,
            defaultValue: 'FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.\\nNo. 123 Industrial Park Road, Fuzhou, Fujian 350000, China',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'consignee_bl',
            label: 'CONSIGNEE',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3,
            defaultValue: 'THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024, USA',
            fontWeight: 'bold'
          },
          {
            id: 'notify_party_bl',
            label: 'NOTIFY PARTY',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3,
            placeholder: 'Same as consignee or customs broker...'
          }
        ]
      },

      // Vessel & Voyage
      {
        id: 'vessel_voyage',
        name: 'vessel_voyage',
        title: 'VESSEL & VOYAGE DETAILS',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'vessel_name',
            label: 'VESSEL NAME / FLIGHT NO.',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'voyage_no',
            label: 'VOYAGE NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'port_of_loading_bl',
            label: 'PORT OF LOADING',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'Fuzhou, China'
          },
          {
            id: 'port_of_discharge_bl',
            label: 'PORT OF DISCHARGE',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'place_of_delivery',
            label: 'PLACE OF DELIVERY',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'etd',
            label: 'ETD (Estimated Time of Departure)',
            type: 'date',
            required: false,
            width: '33%'
          },
          {
            id: 'eta',
            label: 'ETA (Estimated Time of Arrival)',
            type: 'date',
            required: false,
            width: '33%'
          }
        ]
      },

      // Cargo Description
      {
        id: 'cargo_description',
        name: 'cargo_description',
        title: 'DESCRIPTION OF GOODS',
        layout: 'table',
        fields: [
          {
            id: 'cargo_table',
            label: 'Cargo',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'marks', label: 'MARKS & NUMBERS', width: '15%', type: 'text' },
              { id: 'no_of_packages', label: 'NO. OF PKGS', width: '10%', type: 'number' },
              { id: 'description', label: 'DESCRIPTION', width: '30%', type: 'text' },
              { id: 'gross_weight', label: 'GROSS WEIGHT (KG)', width: '15%', type: 'number' },
              { id: 'measurement', label: 'MEASUREMENT (CBM)', width: '15%', type: 'number' },
              { id: 'container', label: 'CONTAINER NO.', width: '15%', type: 'text' }
            ],
            sampleRows: [
              {
                marks: 'THE COSUN BM\\nPO: HD-2024-000001\\nCARTON 1-10 OF 10',
                no_of_packages: '10',
                description: 'Building Materials - Door Hardware',
                gross_weight: '250',
                measurement: '2.5',
                container: 'TEMU1234567'
              }
            ]
          }
        ]
      },

      // Container Details
      {
        id: 'container_details',
        name: 'container_details',
        title: 'CONTAINER DETAILS',
        layout: 'triple',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'container_no_detail',
            label: 'CONTAINER NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'seal_no_detail',
            label: 'SEAL NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'container_type',
            label: 'CONTAINER TYPE',
            type: 'select',
            required: false,
            width: '33%',
            options: ['20\' GP', '40\' GP', '40\' HQ', '45\' HQ', 'LCL']
          },
          {
            id: 'total_packages_bl',
            label: 'TOTAL PACKAGES',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          },
          {
            id: 'total_weight_bl',
            label: 'TOTAL WEIGHT (KG)',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          },
          {
            id: 'total_volume_bl',
            label: 'TOTAL VOLUME (CBM)',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          }
        ]
      },

      // Freight Charges
      {
        id: 'freight_charges',
        name: 'freight_charges',
        title: 'FREIGHT CHARGES',
        layout: 'double',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'freight_amount',
            label: 'FREIGHT AMOUNT',
            type: 'currency',
            required: false,
            width: '50%'
          },
          {
            id: 'freight_charges_note',
            label: 'CHARGES NOTE',
            type: 'text',
            required: false,
            width: '50%',
            placeholder: 'As per agreement / Prepaid / Collect'
          }
        ]
      },

      // Terms
      {
        id: 'bl_terms',
        name: 'bl_terms',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'bl_terms_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 8px; color: #333; line-height: 1.5; padding: 10px; border: 1px solid #DDD; background: #F9F9F9;">
                <strong style="color: #F96302;">TERMS AND CONDITIONS:</strong><br/>
                • This Bill of Lading is subject to the terms and conditions of the carrier.<br/>
                • Carrier shall not be liable for loss or damage arising from act of God, perils of the sea, war, strikes, or other causes beyond carrier's control.<br/>
                • Freight charges must be paid prior to release of cargo unless otherwise agreed.<br/>
                • Claims must be filed within 9 months of delivery or expected delivery date.
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'Issued on behalf of the carrier. Original for consignee.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'CARRIER / AUTHORIZED AGENT',
            role: 'carrier',
            fields: ['signature', 'name', 'place', 'date']
          }
        ]
      }
    }
  },

];

export default hdTemplatesPart3;
