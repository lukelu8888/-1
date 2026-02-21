import{r as m,j as e,bd as w,be as E,b4 as T,ba as v,ar as C,X as f,k as O,m as _,_ as g,ac as I,K as A}from"./vendor-react-rNRqg5Dj.js";import{B as n,j as b}from"./index-CyPsm1Sv.js";import"./vendor-Bf1OVMfx.js";import"./vendor-date-fns-BlGZAn5g.js";import"./vendor-radix-DmPcM8uy.js";const x=[{id:"hd_purchase_order_real",name:"Home Depot 采购订单",name_en:"THE COSUN BM PURCHASE ORDER",type:"purchase_contract",owner:"customer",version:"1.0",lastModified:"2024-01-15",description:"真实的Home Depot采购订单格式",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"header",name:"header",title:"",layout:"custom",backgroundColor:"#FFFFFF",fields:[{id:"logo_company_info",label:"",type:"html",width:"100%",customHtml:`
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="flex: 1;">
                  <div style="font-size: 28px; font-weight: 900; color: #F96302; font-family: Arial, sans-serif; letter-spacing: -0.5px;">
                    THE COSUN BM
                  </div>
                  <div style="font-size: 9px; color: #333; margin-top: 8px; line-height: 1.4;">
                    <strong>CORPORATE OFFICE</strong><br/>
                    2455 Paces Ferry Road, N.W.<br/>
                    Atlanta, Georgia 30339-4024<br/>
                    Phone: (770) 433-8211
                  </div>
                </div>
                <div style="text-align: right; flex: 1;">
                  <div style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 4px;">
                    PURCHASE ORDER
                  </div>
                  <div style="font-size: 10px; color: #666;">
                    This document constitutes a binding agreement
                  </div>
                </div>
              </div>
            `}]},{id:"po_info",name:"po_info",title:"",layout:"custom",fields:[{id:"po_number",label:"PO NUMBER",type:"text",required:!0,width:"25%",defaultValue:"HD-2024-000001",fontWeight:"bold",fontSize:11},{id:"po_date",label:"PO DATE",type:"date",required:!0,width:"25%",fontSize:10},{id:"buyer_code",label:"BUYER CODE",type:"text",required:!0,width:"25%",fontSize:10},{id:"dept_number",label:"DEPT #",type:"text",required:!0,width:"25%",fontSize:10}]},{id:"vendor_info",name:"vendor_info",title:"VENDOR INFORMATION",layout:"double",backgroundColor:"#F5F5F5",border:!0,fields:[{id:"vendor_number",label:"VENDOR NUMBER",type:"text",required:!0,width:"50%",fontWeight:"bold"},{id:"vendor_name",label:"VENDOR NAME",type:"text",required:!0,width:"50%",placeholder:"Fujian Cosun Tuff Building Materials Co., Ltd."},{id:"vendor_address",label:"ADDRESS",type:"textarea",required:!0,width:"50%",placeholder:`123 Industrial Park Road
Fuzhou, Fujian 350000
China`},{id:"vendor_contact",label:"CONTACT PERSON",type:"text",required:!0,width:"50%"},{id:"vendor_phone",label:"PHONE",type:"text",required:!0,width:"25%"},{id:"vendor_email",label:"EMAIL",type:"text",required:!0,width:"25%"}]},{id:"shipping_billing",name:"shipping_billing",title:"",layout:"double",fields:[{id:"ship_to",label:"SHIP TO",type:"textarea",required:!0,width:"50%",defaultValue:`THE COSUN BM
Distribution Center #6542
1000 Logistics Drive
City, State ZIP`,backgroundColor:"#FFF8F0"},{id:"bill_to",label:"BILL TO",type:"textarea",required:!0,width:"50%",defaultValue:`THE COSUN BM
Accounts Payable Department
2455 Paces Ferry Road
Atlanta, GA 30339`,backgroundColor:"#FFF8F0"}]},{id:"terms",name:"terms",title:"TERMS & CONDITIONS",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"ship_via",label:"SHIP VIA",type:"select",required:!0,width:"33%",options:["FOB Origin","FOB Destination","Prepaid & Add","Collect"]},{id:"fob_point",label:"FOB POINT",type:"select",required:!0,width:"33%",options:["Origin","Destination"]},{id:"freight_terms",label:"FREIGHT TERMS",type:"select",required:!0,width:"33%",options:["Prepaid","Collect","Third Party"]},{id:"payment_terms",label:"PAYMENT TERMS",type:"select",required:!0,width:"33%",options:["Net 30","Net 60","Net 90","2/10 Net 30","COD","Letter of Credit"]},{id:"requested_ship_date",label:"REQUESTED SHIP DATE",type:"date",required:!0,width:"33%"},{id:"cancel_date",label:"CANCEL DATE",type:"date",required:!0,width:"33%"}]},{id:"line_items",name:"line_items",title:"LINE ITEMS",layout:"table",fields:[{id:"items_table",label:"Items",type:"table",required:!0,width:"100%",tableColumns:[{id:"line",label:"LINE",width:"5%",type:"number"},{id:"item_number",label:"ITEM NUMBER / SKU",width:"15%",type:"text"},{id:"description",label:"DESCRIPTION",width:"30%",type:"text"},{id:"uom",label:"UOM",width:"8%",type:"text"},{id:"qty_ordered",label:"QTY ORDERED",width:"10%",type:"number"},{id:"unit_price",label:"UNIT PRICE",width:"12%",type:"currency"},{id:"extended_price",label:"EXTENDED PRICE",width:"12%",type:"currency"},{id:"req_date",label:"REQ DATE",width:"8%",type:"date"}],sampleRows:[{line:"1",item_number:"SKU-12345678",description:"Premium Door Lock Set - Brushed Nickel Finish",uom:"EA",qty_ordered:"500",unit_price:"$24.50",extended_price:"$12,250.00",req_date:"2024-02-15"},{line:"2",item_number:"SKU-87654321",description:"Heavy Duty Window Hinge - Stainless Steel",uom:"SET",qty_ordered:"1000",unit_price:"$8.75",extended_price:"$8,750.00",req_date:"2024-02-15"}]}]},{id:"totals",name:"totals",title:"",layout:"custom",fields:[{id:"subtotal",label:"SUBTOTAL",type:"currency",required:!0,width:"100%",alignment:"right",defaultValue:"$21,000.00",fontSize:11},{id:"freight",label:"FREIGHT",type:"currency",required:!1,width:"100%",alignment:"right",defaultValue:"$0.00",fontSize:10},{id:"tax",label:"TAX",type:"currency",required:!1,width:"100%",alignment:"right",defaultValue:"$0.00",fontSize:10},{id:"total_amount",label:"TOTAL AMOUNT",type:"currency",required:!0,width:"100%",alignment:"right",defaultValue:"$21,000.00",fontSize:14,fontWeight:"bold"}]},{id:"instructions",name:"instructions",title:"SPECIAL INSTRUCTIONS",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"special_instructions",label:"",type:"textarea",required:!1,width:"100%",placeholder:"Enter any special shipping, packaging, or handling instructions here...",rows:4}]},{id:"important_notes",name:"important_notes",title:"",layout:"single",fields:[{id:"notes",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 8px; color: #666; line-height: 1.6; padding: 12px; border: 1px solid #DDD; background: #F9F9F9;">
                <strong style="color: #000; text-decoration: underline;">IMPORTANT NOTES:</strong><br/>
                • Please acknowledge receipt of this Purchase Order within 24 hours.<br/>
                • All shipments must include a packing list and reference this PO number.<br/>
                • Invoice must match PO line items exactly. Discrepancies will delay payment.<br/>
                • Compliance with Home Depot vendor requirements is mandatory.<br/>
                • All goods are subject to inspection upon receipt. Non-conforming goods will be rejected.<br/>
                • ASN (Advanced Shipping Notice) is required 24 hours prior to delivery.<br/>
                • Vendor must comply with all Home Depot safety and quality standards.
              </div>
            `}]}],footer:{text:"© 2024 The Home Depot, Inc. All rights reserved. This Purchase Order is subject to The Home Depot Standard Terms and Conditions.",signatureLines:{enabled:!0,parties:[{label:"AUTHORIZED BY (HOME DEPOT BUYER)",role:"buyer",fields:["signature","name","date"]}]}}},{id:"hd_vendor_invoice_real",name:"Home Depot 供应商发票",name_en:"VENDOR INVOICE FOR THE COSUN BM",type:"invoice",owner:"cosun",version:"1.0",lastModified:"2024-01-15",description:"供应商向Home Depot提交的发票格式",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"vendor_header",name:"vendor_header",title:"",layout:"custom",fields:[{id:"vendor_info_header",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 18px; font-weight: bold; color: #000; margin-bottom: 8px;">
                      FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                    </div>
                    <div style="font-size: 9px; color: #333; line-height: 1.5;">
                      No. 123 Industrial Park Road, Fuzhou Economic Zone<br/>
                      Fuzhou, Fujian Province 350000, China<br/>
                      Tel: +86-591-8888-8888 | Fax: +86-591-8888-8889<br/>
                      Email: sales@cosun.com | www.cosun.com<br/>
                      Tax ID: 91350000XXXXXXXXXX
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; margin-bottom: 4px;">
                      INVOICE
                    </div>
                    <div style="font-size: 9px; color: #666;">
                      FOR THE COSUN BM
                    </div>
                  </div>
                </div>
              </div>
            `}]},{id:"invoice_details",name:"invoice_details",title:"",layout:"double",backgroundColor:"#F5F5F5",fields:[{id:"invoice_number",label:"INVOICE NUMBER",type:"text",required:!0,width:"50%",defaultValue:"COSUN-INV-2024-0001",fontWeight:"bold",fontSize:11},{id:"invoice_date",label:"INVOICE DATE",type:"date",required:!0,width:"50%"},{id:"po_number_ref",label:"HOME DEPOT PO NUMBER",type:"text",required:!0,width:"50%",placeholder:"HD-2024-000001",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"vendor_number_ref",label:"VENDOR NUMBER",type:"text",required:!0,width:"50%"},{id:"shipment_date",label:"SHIPMENT DATE",type:"date",required:!0,width:"50%"},{id:"due_date",label:"PAYMENT DUE DATE",type:"date",required:!0,width:"50%"}]},{id:"addresses",name:"addresses",title:"",layout:"double",fields:[{id:"bill_to_hd",label:"BILL TO",type:"textarea",required:!0,width:"50%",defaultValue:`THE COSUN BM
Accounts Payable Department
2455 Paces Ferry Road, N.W.
Atlanta, GA 30339-4024
USA`,backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"ship_to_dc",label:"SHIP TO",type:"textarea",required:!0,width:"50%",placeholder:`THE COSUN BM DC #XXXX
...`,backgroundColor:"#FFF8F0"}]},{id:"invoice_items",name:"invoice_items",title:"INVOICE DETAILS",layout:"table",fields:[{id:"invoice_table",label:"Items",type:"table",required:!0,width:"100%",tableColumns:[{id:"line",label:"LINE",width:"5%",type:"number"},{id:"po_line",label:"PO LINE",width:"7%",type:"text"},{id:"item_sku",label:"ITEM/SKU",width:"13%",type:"text"},{id:"description",label:"DESCRIPTION",width:"28%",type:"text"},{id:"qty_shipped",label:"QTY SHIPPED",width:"10%",type:"number"},{id:"uom",label:"UOM",width:"7%",type:"text"},{id:"unit_price",label:"UNIT PRICE",width:"12%",type:"currency"},{id:"amount",label:"AMOUNT",width:"13%",type:"currency"}],sampleRows:[{line:"1",po_line:"1",item_sku:"SKU-12345678",description:"Premium Door Lock Set - Brushed Nickel",qty_shipped:"500",uom:"EA",unit_price:"$24.50",amount:"$12,250.00"}]}]},{id:"shipping_info",name:"shipping_info",title:"SHIPPING INFORMATION",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"carrier",label:"CARRIER",type:"text",required:!0,width:"33%",placeholder:"FedEx / UPS / DHL etc."},{id:"tracking_number",label:"TRACKING NUMBER",type:"text",required:!0,width:"33%"},{id:"pro_number",label:"PRO NUMBER / BOL",type:"text",required:!1,width:"33%"},{id:"number_of_cartons",label:"NUMBER OF CARTONS",type:"number",required:!0,width:"33%"},{id:"total_weight",label:"TOTAL WEIGHT (LBS)",type:"number",required:!0,width:"33%"},{id:"incoterms",label:"INCOTERMS",type:"select",required:!0,width:"33%",options:["FOB","CIF","CFR","EXW","DDP"]}]},{id:"invoice_totals",name:"invoice_totals",title:"",layout:"custom",fields:[{id:"merchandise_total",label:"MERCHANDISE TOTAL",type:"currency",required:!0,width:"100%",alignment:"right",defaultValue:"$12,250.00",fontSize:11},{id:"freight_charges",label:"FREIGHT CHARGES",type:"currency",required:!1,width:"100%",alignment:"right",defaultValue:"$0.00"},{id:"insurance",label:"INSURANCE",type:"currency",required:!1,width:"100%",alignment:"right",defaultValue:"$0.00"},{id:"other_charges",label:"OTHER CHARGES",type:"currency",required:!1,width:"100%",alignment:"right",defaultValue:"$0.00"},{id:"invoice_total",label:"INVOICE TOTAL",type:"currency",required:!0,width:"100%",alignment:"right",defaultValue:"$12,250.00",fontSize:14,fontWeight:"bold",backgroundColor:"#FFF8F0"}]},{id:"payment_instructions",name:"payment_instructions",title:"PAYMENT INSTRUCTIONS",layout:"double",backgroundColor:"#FFFBF5",fields:[{id:"payment_method",label:"PAYMENT METHOD",type:"select",required:!0,width:"50%",options:["Wire Transfer","Letter of Credit","Check"]},{id:"payment_terms_inv",label:"PAYMENT TERMS",type:"text",required:!0,width:"50%",defaultValue:"Net 30 Days"},{id:"bank_name",label:"BANK NAME",type:"text",required:!1,width:"50%",placeholder:"Bank of China, Fuzhou Branch"},{id:"account_number",label:"ACCOUNT NUMBER",type:"text",required:!1,width:"50%"},{id:"swift_code",label:"SWIFT CODE",type:"text",required:!1,width:"50%"},{id:"bank_address",label:"BANK ADDRESS",type:"textarea",required:!1,width:"50%"}]},{id:"notes_remarks",name:"notes_remarks",title:"NOTES & REMARKS",layout:"single",fields:[{id:"invoice_notes",label:"",type:"textarea",required:!1,width:"100%",rows:3,placeholder:"Any additional notes or remarks..."}]},{id:"certification",name:"certification",title:"",layout:"single",fields:[{id:"certification_text",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px; border: 2px solid #F96302; background: #FFFBF5;">
                <strong style="color: #F96302;">CERTIFICATION:</strong><br/>
                I hereby certify that the information contained in this invoice is true and correct, and that the goods described were shipped on the date indicated and comply with all terms of the Purchase Order referenced above. All goods are warranted to be free from defects in materials and workmanship.
              </div>
            `}]}],footer:{text:"Please remit payment to the address shown above. For questions, contact: accounting@cosun.com or +86-591-8888-8888",signatureLines:{enabled:!0,parties:[{label:"AUTHORIZED SIGNATURE (VENDOR)",role:"vendor",fields:["signature","name","title","date"]}]}}},{id:"hd_packing_list_real",name:"Home Depot 装箱单",name_en:"PACKING LIST FOR THE COSUN BM",type:"packing_list",owner:"cosun",version:"1.0",lastModified:"2024-01-15",description:"真实的Home Depot装箱单格式",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"pl_header",name:"pl_header",title:"",layout:"custom",fields:[{id:"pl_header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                    PACKING LIST
                  </div>
                  <div style="font-size: 11px; color: #000; font-weight: bold; margin-bottom: 12px;">
                    FOR THE COSUN BM SHIPMENT
                  </div>
                  <div style="font-size: 9px; color: #666; line-height: 1.5;">
                    Vendor: FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.<br/>
                    Address: No. 123 Industrial Park Road, Fuzhou, Fujian 350000, China<br/>
                    Tel: +86-591-8888-8888 | Email: export@cosun.com
                  </div>
                </div>
              </div>
            `}]},{id:"pl_info",name:"pl_info",title:"SHIPMENT INFORMATION",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"pl_number",label:"PACKING LIST NO.",type:"text",required:!0,width:"33%",defaultValue:"PL-2024-0001",fontWeight:"bold"},{id:"pl_date",label:"DATE",type:"date",required:!0,width:"33%"},{id:"invoice_ref",label:"INVOICE NO.",type:"text",required:!0,width:"33%",backgroundColor:"#FFF8F0"},{id:"po_ref",label:"HOME DEPOT PO NO.",type:"text",required:!0,width:"33%",backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"destination_dc",label:"DESTINATION DC",type:"text",required:!0,width:"33%"},{id:"container_no",label:"CONTAINER NO.",type:"text",required:!1,width:"33%"}]},{id:"carton_details",name:"carton_details",title:"CARTON DETAILS",layout:"table",fields:[{id:"carton_table",label:"Cartons",type:"table",required:!0,width:"100%",tableColumns:[{id:"carton_no",label:"CARTON NO.",width:"8%",type:"text"},{id:"po_line",label:"PO LINE",width:"7%",type:"text"},{id:"item_sku",label:"ITEM/SKU",width:"15%",type:"text"},{id:"description",label:"DESCRIPTION",width:"25%",type:"text"},{id:"qty_per_carton",label:"QTY/CTN",width:"8%",type:"number"},{id:"total_cartons",label:"CTNS",width:"7%",type:"number"},{id:"total_qty",label:"TOTAL QTY",width:"10%",type:"number"},{id:"gross_weight",label:"G.W. (KG)",width:"10%",type:"number"},{id:"net_weight",label:"N.W. (KG)",width:"10%",type:"number"}],sampleRows:[{carton_no:"1-10",po_line:"1",item_sku:"SKU-12345678",description:"Premium Door Lock Set",qty_per_carton:"50",total_cartons:"10",total_qty:"500",gross_weight:"250",net_weight:"220"}]}]},{id:"shipment_summary",name:"shipment_summary",title:"SHIPMENT SUMMARY",layout:"triple",backgroundColor:"#FFF8F0",fields:[{id:"total_cartons",label:"TOTAL CARTONS",type:"number",required:!0,width:"33%",fontWeight:"bold",fontSize:12},{id:"total_gross_weight",label:"TOTAL GROSS WEIGHT (KG)",type:"number",required:!0,width:"33%",fontWeight:"bold",fontSize:12},{id:"total_net_weight",label:"TOTAL NET WEIGHT (KG)",type:"number",required:!0,width:"33%",fontWeight:"bold",fontSize:12},{id:"total_volume",label:"TOTAL VOLUME (CBM)",type:"number",required:!0,width:"33%"},{id:"number_of_pallets",label:"NUMBER OF PALLETS",type:"number",required:!1,width:"33%"},{id:"container_type",label:"CONTAINER TYPE",type:"select",required:!1,width:"33%",options:["20' GP","40' GP","40' HQ","LCL"]}]},{id:"marks_numbers",name:"marks_numbers",title:"SHIPPING MARKS",layout:"single",fields:[{id:"shipping_marks",label:"",type:"textarea",required:!0,width:"100%",rows:5,defaultValue:`THE COSUN BM
PO NO.: HD-2024-000001
DC #: 6542
MADE IN CHINA
CARTON NO.: 1-10 OF 10`,fontFamily:"monospace"}]},{id:"special_handling",name:"special_handling",title:"SPECIAL HANDLING INSTRUCTIONS",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"handling_instructions",label:"",type:"textarea",required:!1,width:"100%",rows:3,placeholder:"e.g., Handle with care, Keep dry, This side up, etc."}]}],footer:{text:"This packing list must accompany the shipment. Copy to be retained for customs clearance.",signatureLines:{enabled:!0,parties:[{label:"PREPARED BY",role:"shipper",fields:["name","date"]}]}}},{id:"hd_sales_contract_real",name:"Home Depot 销售合同",name_en:"THE COSUN BM SALES CONTRACT",type:"sales_contract",owner:"customer",version:"1.0",lastModified:"2024-01-15",description:"真实的Home Depot销售合同格式",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"contract_header",name:"contract_header",title:"",layout:"custom",fields:[{id:"contract_header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302; background: linear-gradient(to right, #FFFFFF 0%, #FFF8F0 100%);">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 900; color: #F96302; letter-spacing: -0.5px; margin-bottom: 8px;">
                    THE COSUN BM
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #000; margin-bottom: 12px;">
                    SALES CONTRACT
                  </div>
                  <div style="font-size: 9px; color: #666; line-height: 1.5;">
                    2455 Paces Ferry Road, N.W. | Atlanta, Georgia 30339-4024<br/>
                    Phone: (770) 433-8211 | www.homedepot.com
                  </div>
                </div>
              </div>
            `}]},{id:"contract_info",name:"contract_info",title:"CONTRACT INFORMATION",layout:"triple",backgroundColor:"#F5F5F5",border:!0,fields:[{id:"contract_number",label:"CONTRACT NO.",type:"text",required:!0,width:"33%",defaultValue:"HD-SC-2024-0001",fontWeight:"bold",fontSize:11,backgroundColor:"#FFF8F0"},{id:"contract_date",label:"CONTRACT DATE",type:"date",required:!0,width:"33%"},{id:"effective_date",label:"EFFECTIVE DATE",type:"date",required:!0,width:"33%"},{id:"expiry_date",label:"EXPIRY DATE",type:"date",required:!0,width:"33%"},{id:"contract_value",label:"CONTRACT VALUE",type:"currency",required:!0,width:"33%",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"payment_terms",label:"PAYMENT TERMS",type:"select",required:!0,width:"33%",options:["Net 30","Net 60","Net 90","2/10 Net 30","Letter of Credit"]}]},{id:"parties",name:"parties",title:"CONTRACTING PARTIES",layout:"double",fields:[{id:"buyer_info",label:"BUYER (THE COSUN BM)",type:"textarea",required:!0,width:"50%",rows:6,defaultValue:"THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA\\nTax ID: XX-XXXXXXX",backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"seller_info",label:"SELLER (VENDOR)",type:"textarea",required:!0,width:"50%",rows:6,placeholder:"Vendor Company Name\\nAddress\\nCity, State ZIP\\nCountry\\nTax ID",backgroundColor:"#FFFFFF"}]},{id:"contract_items",name:"contract_items",title:"CONTRACT ITEMS & SPECIFICATIONS",layout:"table",fields:[{id:"items_table",label:"Items",type:"table",required:!0,width:"100%",tableColumns:[{id:"item",label:"ITEM",width:"5%",type:"number"},{id:"sku",label:"SKU / PART NO.",width:"15%",type:"text"},{id:"description",label:"DESCRIPTION & SPECS",width:"30%",type:"text"},{id:"quantity",label:"QUANTITY",width:"10%",type:"number"},{id:"uom",label:"UOM",width:"8%",type:"text"},{id:"unit_price",label:"UNIT PRICE",width:"12%",type:"currency"},{id:"total_price",label:"TOTAL PRICE",width:"12%",type:"currency"},{id:"delivery_date",label:"DELIVERY",width:"8%",type:"date"}],sampleRows:[{item:"1",sku:"SKU-12345678",description:"Premium Door Lock Set - Brushed Nickel Finish, Grade 1 Security",quantity:"10,000",uom:"EA",unit_price:"$24.50",total_price:"$245,000.00",delivery_date:"2024-03-01"}]}]},{id:"contract_totals",name:"contract_totals",title:"",layout:"custom",fields:[{id:"subtotal",label:"SUBTOTAL",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:11},{id:"discount",label:"DISCOUNT",type:"currency",required:!1,width:"100%",alignment:"right"},{id:"contract_total",label:"CONTRACT TOTAL",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:14,fontWeight:"bold",backgroundColor:"#FFF8F0"}]},{id:"terms_conditions",name:"terms_conditions",title:"TERMS & CONDITIONS",layout:"single",fields:[{id:"terms_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #333; line-height: 1.8; padding: 16px; border: 1px solid #DDD; background: #F9F9F9;">
                <strong style="color: #F96302; font-size: 11px;">1. DELIVERY TERMS:</strong><br/>
                Seller shall deliver all goods FOB Destination to Home Depot distribution centers as specified. Delivery dates are firm commitments.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">2. QUALITY STANDARDS:</strong><br/>
                All goods must meet Home Depot quality specifications. Non-conforming goods will be rejected at Seller's expense.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">3. PAYMENT TERMS:</strong><br/>
                Payment as specified above, subject to receipt of compliant goods and proper documentation.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">4. WARRANTIES:</strong><br/>
                Seller warrants all goods are free from defects, merchantable, and fit for intended purpose.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">5. COMPLIANCE:</strong><br/>
                Seller must comply with all applicable laws, regulations, and Home Depot vendor requirements.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">6. TERMINATION:</strong><br/>
                Home Depot may terminate this contract for cause with 30 days written notice.
              </div>
            `}]},{id:"special_provisions",name:"special_provisions",title:"SPECIAL PROVISIONS",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"special_provisions_text",label:"",type:"textarea",required:!1,width:"100%",rows:4,placeholder:"Enter any special provisions, amendments, or additional terms..."}]}],footer:{text:"© 2024 The Home Depot, Inc. This contract is governed by the laws of the State of Georgia.",signatureLines:{enabled:!0,parties:[{label:"AUTHORIZED SIGNATURE (BUYER - HOME DEPOT)",role:"buyer",fields:["signature","name","title","date"]},{label:"AUTHORIZED SIGNATURE (SELLER - VENDOR)",role:"seller",fields:["signature","name","title","date"]}]}}},{id:"hd_purchase_contract_vendor",name:"Cosun 采购合同",name_en:"PURCHASE CONTRACT - COSUN",type:"purchase_contract",owner:"cosun",version:"1.0",lastModified:"2024-01-15",description:"Cosun与供应商之间的采购合同",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"header",name:"header",title:"",layout:"custom",fields:[{id:"header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: #000; margin-bottom: 8px;">
                    FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                  </div>
                  <div style="font-size: 24px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                    PURCHASE CONTRACT
                  </div>
                  <div style="font-size: 9px; color: #666; line-height: 1.5;">
                    No. 123 Industrial Park Road | Fuzhou, Fujian 350000, China<br/>
                    Tel: +86-591-8888-8888 | Email: purchase@cosun.com
                  </div>
                </div>
              </div>
            `}]},{id:"contract_details",name:"contract_details",title:"CONTRACT DETAILS",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"contract_no",label:"CONTRACT NO.",type:"text",required:!0,width:"33%",defaultValue:"COSUN-PC-2024-0001",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"contract_date",label:"DATE",type:"date",required:!0,width:"33%"},{id:"hd_po_reference",label:"HOME DEPOT PO REF",type:"text",required:!0,width:"33%",backgroundColor:"#FFF8F0"},{id:"delivery_deadline",label:"DELIVERY DEADLINE",type:"date",required:!0,width:"33%",fontWeight:"bold"},{id:"payment_method",label:"PAYMENT METHOD",type:"select",required:!0,width:"33%",options:["T/T in Advance","30% Deposit + 70% Balance","L/C at Sight","Net 30"]},{id:"incoterms",label:"INCOTERMS",type:"select",required:!0,width:"33%",options:["FOB","CIF","CFR","EXW","DDP"]}]},{id:"parties",name:"parties",title:"PARTIES",layout:"double",fields:[{id:"buyer",label:"BUYER (COSUN)",type:"textarea",required:!0,width:"50%",rows:5,defaultValue:"Fujian Cosun Tuff Building Materials Co., Ltd.\\nNo. 123 Industrial Park Road\\nFuzhou, Fujian 350000, China\\nTel: +86-591-8888-8888",backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"supplier",label:"SUPPLIER (VENDOR)",type:"textarea",required:!0,width:"50%",rows:5,placeholder:"Supplier company name and address..."}]},{id:"purchase_items",name:"purchase_items",title:"PURCHASE ITEMS",layout:"table",fields:[{id:"items_table",label:"Items",type:"table",required:!0,width:"100%",tableColumns:[{id:"no",label:"NO.",width:"5%",type:"number"},{id:"product_name",label:"PRODUCT NAME",width:"25%",type:"text"},{id:"specifications",label:"SPECIFICATIONS",width:"20%",type:"text"},{id:"quantity",label:"QUANTITY",width:"10%",type:"number"},{id:"unit",label:"UNIT",width:"8%",type:"text"},{id:"unit_price",label:"UNIT PRICE",width:"12%",type:"currency"},{id:"amount",label:"AMOUNT",width:"12%",type:"currency"},{id:"delivery",label:"DELIVERY",width:"8%",type:"date"}],sampleRows:[]}]},{id:"totals",name:"totals",title:"",layout:"custom",fields:[{id:"subtotal",label:"SUBTOTAL",type:"currency",required:!0,width:"100%",alignment:"right"},{id:"tax",label:"TAX",type:"currency",required:!1,width:"100%",alignment:"right"},{id:"total",label:"TOTAL AMOUNT",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:14,fontWeight:"bold",backgroundColor:"#FFF8F0"}]},{id:"contract_terms",name:"contract_terms",title:"CONTRACT TERMS",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"terms",label:"",type:"textarea",required:!1,width:"100%",rows:5,placeholder:"Quality standards, packaging requirements, inspection terms, etc."}]}],footer:{text:"This contract is subject to the laws of the People's Republic of China.",signatureLines:{enabled:!0,parties:[{label:"BUYER (COSUN) - AUTHORIZED SIGNATURE",role:"buyer",fields:["signature","name","title","date"]},{label:"SUPPLIER - AUTHORIZED SIGNATURE",role:"supplier",fields:["signature","name","title","date"]}]}}},{id:"hd_commercial_invoice",name:"商业发票",name_en:"COMMERCIAL INVOICE",type:"commercial_invoice",owner:"cosun",version:"1.0",lastModified:"2024-01-15",description:"用于国际贸易的商业发票",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"ci_header",name:"ci_header",title:"",layout:"custom",fields:[{id:"ci_header_html",label:"",type:"html",width:"100%",customHtml:`
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
            `}]},{id:"ci_info",name:"ci_info",title:"",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"invoice_no",label:"INVOICE NO.",type:"text",required:!0,width:"33%",defaultValue:"COSUN-CI-2024-0001",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"invoice_date",label:"INVOICE DATE",type:"date",required:!0,width:"33%"},{id:"po_ref",label:"PO REFERENCE",type:"text",required:!0,width:"33%",backgroundColor:"#FFF8F0"},{id:"contract_ref",label:"CONTRACT NO.",type:"text",required:!1,width:"33%"},{id:"lc_no",label:"L/C NO.",type:"text",required:!1,width:"33%"},{id:"payment_terms",label:"PAYMENT TERMS",type:"text",required:!0,width:"33%"}]},{id:"ci_parties",name:"ci_parties",title:"",layout:"double",fields:[{id:"consignee",label:"CONSIGNEE",type:"textarea",required:!0,width:"50%",rows:5,defaultValue:"THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA",backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"notify_party",label:"NOTIFY PARTY",type:"textarea",required:!0,width:"50%",rows:5,placeholder:"Same as consignee or other party..."}]},{id:"shipping_details",name:"shipping_details",title:"SHIPPING DETAILS",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"port_of_loading",label:"PORT OF LOADING",type:"text",required:!0,width:"33%",defaultValue:"Fuzhou, China"},{id:"port_of_discharge",label:"PORT OF DISCHARGE",type:"text",required:!0,width:"33%"},{id:"final_destination",label:"FINAL DESTINATION",type:"text",required:!0,width:"33%"},{id:"vessel_flight",label:"VESSEL/FLIGHT",type:"text",required:!1,width:"33%"},{id:"sailing_date",label:"SAILING DATE",type:"date",required:!1,width:"33%"},{id:"delivery_terms",label:"DELIVERY TERMS",type:"select",required:!0,width:"33%",options:["FOB","CIF","CFR","EXW","DDP"]}]},{id:"goods_table",name:"goods_table",title:"DESCRIPTION OF GOODS",layout:"table",fields:[{id:"goods",label:"Goods",type:"table",required:!0,width:"100%",tableColumns:[{id:"marks",label:"MARKS & NOS.",width:"10%",type:"text"},{id:"description",label:"DESCRIPTION OF GOODS",width:"30%",type:"text"},{id:"hs_code",label:"HS CODE",width:"10%",type:"text"},{id:"quantity",label:"QUANTITY",width:"10%",type:"number"},{id:"unit",label:"UNIT",width:"8%",type:"text"},{id:"unit_price",label:"UNIT PRICE",width:"12%",type:"currency"},{id:"amount",label:"AMOUNT",width:"12%",type:"currency"}],sampleRows:[]}]},{id:"ci_totals",name:"ci_totals",title:"",layout:"custom",fields:[{id:"total_fob",label:"TOTAL FOB VALUE",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:11},{id:"freight",label:"FREIGHT",type:"currency",required:!1,width:"100%",alignment:"right"},{id:"insurance",label:"INSURANCE",type:"currency",required:!1,width:"100%",alignment:"right"},{id:"total_cif",label:"TOTAL INVOICE VALUE",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:14,fontWeight:"bold",backgroundColor:"#FFF8F0"}]},{id:"packaging",name:"packaging",title:"PACKAGING DETAILS",layout:"triple",backgroundColor:"#FFFBF5",fields:[{id:"total_packages",label:"TOTAL NO. OF PACKAGES",type:"number",required:!0,width:"33%"},{id:"gross_weight",label:"GROSS WEIGHT (KG)",type:"number",required:!0,width:"33%"},{id:"net_weight",label:"NET WEIGHT (KG)",type:"number",required:!0,width:"33%"},{id:"measurement",label:"MEASUREMENT (CBM)",type:"number",required:!0,width:"33%"},{id:"container_no",label:"CONTAINER NO.",type:"text",required:!1,width:"33%"},{id:"seal_no",label:"SEAL NO.",type:"text",required:!1,width:"33%"}]},{id:"declaration",name:"declaration",title:"",layout:"single",fields:[{id:"declaration_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px; border: 2px solid #F96302; background: #FFFBF5;">
                <strong style="color: #F96302;">DECLARATION:</strong><br/>
                We hereby certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct. The goods are of Chinese origin.
              </div>
            `}]}],footer:{text:"Original for consignee | Country of Origin: China",signatureLines:{enabled:!0,parties:[{label:"FOR COSUN - AUTHORIZED SIGNATURE",role:"exporter",fields:["signature","name","title","date"]}]}}},{id:"hd_bill_of_lading",name:"提单",name_en:"BILL OF LADING",type:"bill_of_lading",owner:"logistics",version:"1.0",lastModified:"2024-01-15",description:"海运/空运提单",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"bl_header",name:"bl_header",title:"",layout:"custom",fields:[{id:"bl_header_html",label:"",type:"html",width:"100%",customHtml:`
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
            `}]},{id:"bl_details",name:"bl_details",title:"",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"bl_number",label:"B/L NUMBER",type:"text",required:!0,width:"33%",defaultValue:"BL-2024-000001",fontWeight:"bold",fontSize:11,backgroundColor:"#FFF8F0"},{id:"bl_date",label:"B/L DATE",type:"date",required:!0,width:"33%"},{id:"bl_type",label:"B/L TYPE",type:"select",required:!0,width:"33%",options:["Ocean B/L","Air Waybill","Master B/L","House B/L"]},{id:"carrier",label:"CARRIER",type:"text",required:!0,width:"33%",placeholder:"Shipping Line / Airline"},{id:"booking_no",label:"BOOKING NO.",type:"text",required:!0,width:"33%"},{id:"freight_payment",label:"FREIGHT PAYMENT",type:"select",required:!0,width:"33%",options:["Prepaid","Collect","Third Party"]}]},{id:"bl_parties",name:"bl_parties",title:"",layout:"single",fields:[{id:"shipper",label:"SHIPPER",type:"textarea",required:!0,width:"100%",rows:3,defaultValue:"FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.\\nNo. 123 Industrial Park Road, Fuzhou, Fujian 350000, China",backgroundColor:"#FFF8F0"},{id:"consignee_bl",label:"CONSIGNEE",type:"textarea",required:!0,width:"100%",rows:3,defaultValue:"THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024, USA",fontWeight:"bold"},{id:"notify_party_bl",label:"NOTIFY PARTY",type:"textarea",required:!0,width:"100%",rows:3,placeholder:"Same as consignee or customs broker..."}]},{id:"vessel_voyage",name:"vessel_voyage",title:"VESSEL & VOYAGE DETAILS",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"vessel_name",label:"VESSEL NAME / FLIGHT NO.",type:"text",required:!0,width:"33%"},{id:"voyage_no",label:"VOYAGE NO.",type:"text",required:!1,width:"33%"},{id:"port_of_loading_bl",label:"PORT OF LOADING",type:"text",required:!0,width:"33%",defaultValue:"Fuzhou, China"},{id:"port_of_discharge_bl",label:"PORT OF DISCHARGE",type:"text",required:!0,width:"33%"},{id:"place_of_delivery",label:"PLACE OF DELIVERY",type:"text",required:!0,width:"33%"},{id:"etd",label:"ETD (Estimated Time of Departure)",type:"date",required:!1,width:"33%"},{id:"eta",label:"ETA (Estimated Time of Arrival)",type:"date",required:!1,width:"33%"}]},{id:"cargo_description",name:"cargo_description",title:"DESCRIPTION OF GOODS",layout:"table",fields:[{id:"cargo_table",label:"Cargo",type:"table",required:!0,width:"100%",tableColumns:[{id:"marks",label:"MARKS & NUMBERS",width:"15%",type:"text"},{id:"no_of_packages",label:"NO. OF PKGS",width:"10%",type:"number"},{id:"description",label:"DESCRIPTION",width:"30%",type:"text"},{id:"gross_weight",label:"GROSS WEIGHT (KG)",width:"15%",type:"number"},{id:"measurement",label:"MEASUREMENT (CBM)",width:"15%",type:"number"},{id:"container",label:"CONTAINER NO.",width:"15%",type:"text"}],sampleRows:[{marks:"THE COSUN BM\\nPO: HD-2024-000001\\nCARTON 1-10 OF 10",no_of_packages:"10",description:"Building Materials - Door Hardware",gross_weight:"250",measurement:"2.5",container:"TEMU1234567"}]}]},{id:"container_details",name:"container_details",title:"CONTAINER DETAILS",layout:"triple",backgroundColor:"#FFFBF5",fields:[{id:"container_no_detail",label:"CONTAINER NO.",type:"text",required:!1,width:"33%"},{id:"seal_no_detail",label:"SEAL NO.",type:"text",required:!1,width:"33%"},{id:"container_type",label:"CONTAINER TYPE",type:"select",required:!1,width:"33%",options:["20' GP","40' GP","40' HQ","45' HQ","LCL"]},{id:"total_packages_bl",label:"TOTAL PACKAGES",type:"number",required:!0,width:"33%",fontWeight:"bold"},{id:"total_weight_bl",label:"TOTAL WEIGHT (KG)",type:"number",required:!0,width:"33%",fontWeight:"bold"},{id:"total_volume_bl",label:"TOTAL VOLUME (CBM)",type:"number",required:!0,width:"33%",fontWeight:"bold"}]},{id:"freight_charges",name:"freight_charges",title:"FREIGHT CHARGES",layout:"double",backgroundColor:"#F5F5F5",fields:[{id:"freight_amount",label:"FREIGHT AMOUNT",type:"currency",required:!1,width:"50%"},{id:"freight_charges_note",label:"CHARGES NOTE",type:"text",required:!1,width:"50%",placeholder:"As per agreement / Prepaid / Collect"}]},{id:"bl_terms",name:"bl_terms",title:"",layout:"single",fields:[{id:"bl_terms_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 8px; color: #333; line-height: 1.5; padding: 10px; border: 1px solid #DDD; background: #F9F9F9;">
                <strong style="color: #F96302;">TERMS AND CONDITIONS:</strong><br/>
                • This Bill of Lading is subject to the terms and conditions of the carrier.<br/>
                • Carrier shall not be liable for loss or damage arising from act of God, perils of the sea, war, strikes, or other causes beyond carrier's control.<br/>
                • Freight charges must be paid prior to release of cargo unless otherwise agreed.<br/>
                • Claims must be filed within 9 months of delivery or expected delivery date.
              </div>
            `}]}],footer:{text:"Issued on behalf of the carrier. Original for consignee.",signatureLines:{enabled:!0,parties:[{label:"CARRIER / AUTHORIZED AGENT",role:"carrier",fields:["signature","name","place","date"]}]}}},{id:"hd_statement_of_account",name:"对账单",name_en:"STATEMENT OF ACCOUNT",type:"statement",owner:"finance",version:"1.0",lastModified:"2024-01-15",description:"月度对账单",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"statement_header",name:"statement_header",title:"",layout:"custom",fields:[{id:"statement_header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 18px; font-weight: bold; color: #000;">
                      FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                    </div>
                    <div style="font-size: 8px; color: #666; margin-top: 6px;">
                      Accounts Receivable Department<br/>
                      Tel: +86-591-8888-8888 | Email: ar@cosun.com
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: 900; color: #F96302;">
                      STATEMENT OF
                    </div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302;">
                      ACCOUNT
                    </div>
                  </div>
                </div>
              </div>
            `}]},{id:"statement_info",name:"statement_info",title:"",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"statement_no",label:"STATEMENT NO.",type:"text",required:!0,width:"33%",defaultValue:"SOA-2024-001",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"statement_date",label:"STATEMENT DATE",type:"date",required:!0,width:"33%"},{id:"period",label:"STATEMENT PERIOD",type:"text",required:!0,width:"33%",placeholder:"Jan 1, 2024 - Jan 31, 2024"},{id:"customer_account_no",label:"CUSTOMER ACCOUNT NO.",type:"text",required:!0,width:"33%",fontWeight:"bold"},{id:"payment_terms_soa",label:"PAYMENT TERMS",type:"text",required:!0,width:"33%"},{id:"currency_soa",label:"CURRENCY",type:"select",required:!0,width:"33%",options:["USD","EUR","GBP","CNY"]}]},{id:"customer_info_soa",name:"customer_info_soa",title:"CUSTOMER INFORMATION",layout:"single",fields:[{id:"customer_details",label:"",type:"textarea",required:!0,width:"100%",rows:4,defaultValue:"THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA",backgroundColor:"#FFF8F0",fontWeight:"bold"}]},{id:"account_summary",name:"account_summary",title:"ACCOUNT SUMMARY",layout:"custom",backgroundColor:"#FFF8F0",border:!0,fields:[{id:"beginning_balance",label:"BEGINNING BALANCE",type:"currency",required:!0,width:"100%",fontSize:11,fontWeight:"bold"},{id:"total_charges",label:"TOTAL CHARGES (INVOICES)",type:"currency",required:!0,width:"100%",fontSize:11},{id:"total_payments",label:"TOTAL PAYMENTS",type:"currency",required:!0,width:"100%",fontSize:11},{id:"ending_balance",label:"ENDING BALANCE",type:"currency",required:!0,width:"100%",fontSize:14,fontWeight:"bold",backgroundColor:"#FFFFFF"}]},{id:"transactions",name:"transactions",title:"TRANSACTION DETAILS",layout:"table",fields:[{id:"transactions_table",label:"Transactions",type:"table",required:!0,width:"100%",tableColumns:[{id:"date",label:"DATE",width:"10%",type:"date"},{id:"transaction_type",label:"TYPE",width:"10%",type:"text"},{id:"reference",label:"REFERENCE NO.",width:"15%",type:"text"},{id:"description",label:"DESCRIPTION",width:"30%",type:"text"},{id:"charges",label:"CHARGES",width:"12%",type:"currency"},{id:"payments",label:"PAYMENTS",width:"12%",type:"currency"},{id:"balance",label:"BALANCE",width:"12%",type:"currency"}],sampleRows:[{date:"2024-01-05",transaction_type:"Invoice",reference:"INV-2024-001",description:"Sales Invoice - PO HD-2024-000001",charges:"$12,250.00",payments:"-",balance:"$12,250.00"},{date:"2024-01-15",transaction_type:"Payment",reference:"PAY-2024-001",description:"Wire Transfer",charges:"-",payments:"$12,250.00",balance:"$0.00"}]}]},{id:"aging_analysis",name:"aging_analysis",title:"AGING ANALYSIS",layout:"custom",backgroundColor:"#F5F5F5",fields:[{id:"aging_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="display: flex; gap: 10px; padding: 12px; font-size: 10px;">
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">CURRENT</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">1-30 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">31-60 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">61-90 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFF8F0; border: 2px solid #F96302;">
                  <div style="color: #F96302; margin-bottom: 4px; font-weight: bold;">OVER 90 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #F96302;">$0.00</div>
                </div>
              </div>
            `}]},{id:"payment_instructions_soa",name:"payment_instructions_soa",title:"PAYMENT INSTRUCTIONS",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"payment_instructions_text",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px;">
                <strong style="color: #F96302;">PAYMENT DETAILS:</strong><br/>
                Bank: Bank of China, Fuzhou Branch<br/>
                Account Name: Fujian Cosun Tuff Building Materials Co., Ltd.<br/>
                Account Number: XXXX-XXXX-XXXX-XXXX<br/>
                SWIFT Code: BKCHCNBJ950<br/><br/>
                
                <strong style="color: #F96302;">IMPORTANT:</strong> Please reference your account number and statement number on all payments.
              </div>
            `}]},{id:"statement_notes",name:"statement_notes",title:"NOTES",layout:"single",fields:[{id:"notes",label:"",type:"textarea",required:!1,width:"100%",rows:3,placeholder:"Additional notes or comments..."}]}],footer:{text:"If you have any questions about this statement, please contact our Accounts Receivable department.",signatureLines:{enabled:!1}}},{id:"hd_payment_advice",name:"付款通知",name_en:"PAYMENT ADVICE",type:"payment_advice",owner:"finance",version:"1.0",lastModified:"2024-01-15",description:"付款通知单",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"pa_header",name:"pa_header",title:"",layout:"custom",fields:[{id:"pa_header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302; background: linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%);">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 900; color: #F96302; margin-bottom: 4px;">
                    PAYMENT ADVICE
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 8px;">
                    Remittance Notification
                  </div>
                </div>
              </div>
            `}]},{id:"payment_info",name:"payment_info",title:"PAYMENT INFORMATION",layout:"triple",backgroundColor:"#F5F5F5",border:!0,fields:[{id:"payment_advice_no",label:"PAYMENT ADVICE NO.",type:"text",required:!0,width:"33%",defaultValue:"PA-2024-0001",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"payment_date",label:"PAYMENT DATE",type:"date",required:!0,width:"33%",fontWeight:"bold"},{id:"payment_method",label:"PAYMENT METHOD",type:"select",required:!0,width:"33%",options:["Wire Transfer","Check","ACH","Letter of Credit","PayPal"]},{id:"payment_reference",label:"PAYMENT REFERENCE",type:"text",required:!0,width:"33%",placeholder:"Transaction ID / Check No.",fontWeight:"bold"},{id:"payment_amount",label:"PAYMENT AMOUNT",type:"currency",required:!0,width:"33%",fontSize:12,fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"currency_pa",label:"CURRENCY",type:"select",required:!0,width:"33%",options:["USD","EUR","GBP","CNY"]}]},{id:"payer_info",name:"payer_info",title:"",layout:"double",fields:[{id:"payer",label:"PAYER (FROM)",type:"textarea",required:!0,width:"50%",rows:5,defaultValue:"THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA",backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"payee",label:"PAYEE (TO)",type:"textarea",required:!0,width:"50%",rows:5,placeholder:"Vendor/Supplier company name and address..."}]},{id:"bank_details_pa",name:"bank_details_pa",title:"BANK TRANSFER DETAILS",layout:"double",backgroundColor:"#FFFBF5",fields:[{id:"bank_name_pa",label:"BANK NAME",type:"text",required:!1,width:"50%"},{id:"bank_branch",label:"BRANCH",type:"text",required:!1,width:"50%"},{id:"account_name_pa",label:"ACCOUNT NAME",type:"text",required:!1,width:"50%"},{id:"account_number_pa",label:"ACCOUNT NUMBER",type:"text",required:!1,width:"50%"},{id:"swift_code_pa",label:"SWIFT/BIC CODE",type:"text",required:!1,width:"50%"},{id:"routing_number",label:"ROUTING NUMBER (ACH)",type:"text",required:!1,width:"50%"}]},{id:"invoices_paid",name:"invoices_paid",title:"INVOICES BEING PAID",layout:"table",fields:[{id:"invoices_table",label:"Invoices",type:"table",required:!0,width:"100%",tableColumns:[{id:"invoice_no",label:"INVOICE NO.",width:"15%",type:"text"},{id:"invoice_date",label:"INVOICE DATE",width:"12%",type:"date"},{id:"po_number",label:"PO NUMBER",width:"15%",type:"text"},{id:"invoice_amount",label:"INVOICE AMOUNT",width:"15%",type:"currency"},{id:"discount",label:"DISCOUNT",width:"12%",type:"currency"},{id:"amount_paid",label:"AMOUNT PAID",width:"15%",type:"currency"},{id:"status",label:"STATUS",width:"10%",type:"text"}],sampleRows:[{invoice_no:"COSUN-INV-2024-0001",invoice_date:"2024-01-05",po_number:"HD-2024-000001",invoice_amount:"$12,250.00",discount:"$0.00",amount_paid:"$12,250.00",status:"Paid in Full"}]}]},{id:"payment_summary",name:"payment_summary",title:"PAYMENT SUMMARY",layout:"custom",backgroundColor:"#F5F5F5",fields:[{id:"total_invoices",label:"TOTAL INVOICES AMOUNT",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:11},{id:"total_discounts",label:"TOTAL DISCOUNTS",type:"currency",required:!1,width:"100%",alignment:"right"},{id:"bank_charges",label:"BANK CHARGES",type:"currency",required:!1,width:"100%",alignment:"right"},{id:"net_payment",label:"NET PAYMENT AMOUNT",type:"currency",required:!0,width:"100%",alignment:"right",fontSize:14,fontWeight:"bold",backgroundColor:"#FFF8F0"}]},{id:"payment_notes",name:"payment_notes",title:"PAYMENT NOTES",layout:"single",fields:[{id:"notes_text",label:"",type:"textarea",required:!1,width:"100%",rows:3,placeholder:"Additional payment notes or comments..."}]},{id:"confirmation",name:"confirmation",title:"",layout:"single",fields:[{id:"confirmation_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px; border: 2px solid #F96302; background: #FFFBF5; text-align: center;">
                <strong style="color: #F96302; font-size: 11px;">PAYMENT CONFIRMATION</strong><br/><br/>
                This is to confirm that payment has been processed as indicated above. Please allow 2-5 business days for the funds to reflect in your account. If you have any questions regarding this payment, please contact our Accounts Payable department.
              </div>
            `}]}],footer:{text:"This is a computer-generated document and does not require a signature. For inquiries, contact: ap@homedepot.com",signatureLines:{enabled:!1}}},{id:"hd_goods_receipt",name:"收货确认单",name_en:"GOODS RECEIPT CONFIRMATION",type:"goods_receipt",owner:"warehouse",version:"1.0",lastModified:"2024-01-15",description:"货物收货确认单",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"gr_header",name:"gr_header",title:"",layout:"custom",fields:[{id:"gr_header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; letter-spacing: -0.5px;">
                      THE COSUN BM
                    </div>
                    <div style="font-size: 9px; color: #666; margin-top: 6px;">
                      Distribution Center Operations
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 900; color: #000;">
                      GOODS RECEIPT
                    </div>
                    <div style="font-size: 20px; font-weight: 700; color: #F96302;">
                      CONFIRMATION
                    </div>
                  </div>
                </div>
              </div>
            `}]},{id:"receipt_info",name:"receipt_info",title:"RECEIPT INFORMATION",layout:"triple",backgroundColor:"#F5F5F5",border:!0,fields:[{id:"gr_number",label:"GR NUMBER",type:"text",required:!0,width:"33%",defaultValue:"GR-2024-0001",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"receipt_date",label:"RECEIPT DATE",type:"date",required:!0,width:"33%",fontWeight:"bold"},{id:"receipt_time",label:"RECEIPT TIME",type:"text",required:!0,width:"33%",placeholder:"14:30"},{id:"po_number_gr",label:"PO NUMBER",type:"text",required:!0,width:"33%",backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"delivery_note_no",label:"DELIVERY NOTE NO.",type:"text",required:!1,width:"33%"},{id:"packing_list_no",label:"PACKING LIST NO.",type:"text",required:!1,width:"33%"},{id:"dc_location",label:"DC LOCATION",type:"text",required:!0,width:"33%",placeholder:"DC #6542"},{id:"dock_door",label:"DOCK DOOR",type:"text",required:!1,width:"33%",placeholder:"Door 12"},{id:"carrier_name",label:"CARRIER NAME",type:"text",required:!0,width:"33%"}]},{id:"vendor_info_gr",name:"vendor_info_gr",title:"VENDOR INFORMATION",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"vendor_details_gr",label:"",type:"textarea",required:!0,width:"100%",rows:3,placeholder:"Vendor name and address..."}]},{id:"received_items",name:"received_items",title:"ITEMS RECEIVED",layout:"table",fields:[{id:"items_received_table",label:"Items",type:"table",required:!0,width:"100%",tableColumns:[{id:"line",label:"LINE",width:"5%",type:"number"},{id:"item_sku_gr",label:"ITEM/SKU",width:"12%",type:"text"},{id:"description_gr",label:"DESCRIPTION",width:"25%",type:"text"},{id:"po_qty",label:"PO QTY",width:"8%",type:"number"},{id:"received_qty",label:"RECEIVED QTY",width:"10%",type:"number"},{id:"uom_gr",label:"UOM",width:"6%",type:"text"},{id:"variance",label:"VARIANCE",width:"8%",type:"number"},{id:"condition",label:"CONDITION",width:"10%",type:"select"},{id:"notes",label:"NOTES",width:"16%",type:"text"}],sampleRows:[{line:"1",item_sku_gr:"SKU-12345678",description_gr:"Premium Door Lock Set",po_qty:"500",received_qty:"500",uom_gr:"EA",variance:"0",condition:"Good",notes:""}]}]},{id:"receipt_summary",name:"receipt_summary",title:"RECEIPT SUMMARY",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"total_cartons_received",label:"TOTAL CARTONS RECEIVED",type:"number",required:!0,width:"33%",fontWeight:"bold"},{id:"total_pallets",label:"TOTAL PALLETS",type:"number",required:!1,width:"33%"},{id:"total_weight_received",label:"TOTAL WEIGHT (LBS)",type:"number",required:!1,width:"33%"},{id:"receipt_status",label:"RECEIPT STATUS",type:"select",required:!0,width:"33%",options:["Complete","Partial","Over-Shipped","Damaged","Rejected"],backgroundColor:"#FFF8F0",fontWeight:"bold"},{id:"inspection_result",label:"INSPECTION RESULT",type:"select",required:!0,width:"33%",options:["Passed","Failed","Conditional","Pending"],fontWeight:"bold"},{id:"put_away_location",label:"PUT-AWAY LOCATION",type:"text",required:!1,width:"33%",placeholder:"Warehouse location"}]},{id:"inspection_notes",name:"inspection_notes",title:"INSPECTION & QUALITY NOTES",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"quality_notes",label:"",type:"textarea",required:!1,width:"100%",rows:4,placeholder:"Document any damages, discrepancies, quality issues, or special observations..."}]},{id:"discrepancies",name:"discrepancies",title:"DISCREPANCIES & ACTIONS",layout:"double",backgroundColor:"#FFF8F0",fields:[{id:"discrepancy_type",label:"DISCREPANCY TYPE",type:"select",required:!1,width:"50%",options:["None","Quantity Shortage","Quantity Overage","Damaged Goods","Wrong Items","Quality Issue"]},{id:"action_taken",label:"ACTION TAKEN",type:"select",required:!1,width:"50%",options:["None","Accepted","Rejected","Partial Accept","Vendor Notified","RMA Issued"]},{id:"discrepancy_details",label:"DISCREPANCY DETAILS",type:"textarea",required:!1,width:"100%",rows:3,placeholder:"Describe discrepancies in detail..."}]},{id:"evidence",name:"evidence",title:"PHOTOS & EVIDENCE",layout:"single",fields:[{id:"evidence_notes",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #666; padding: 10px; background: #F9F9F9; border: 1px dashed #CCC;">
                Photos of damaged goods, packaging, or discrepancies should be uploaded to the system and referenced here.<br/>
                Photo IDs: ___________________________________________
              </div>
            `}]}],footer:{text:"This Goods Receipt Confirmation is an official record. Discrepancies must be reported within 24 hours.",signatureLines:{enabled:!0,parties:[{label:"RECEIVED BY (DC SUPERVISOR)",role:"receiver",fields:["signature","name","employee_id","date"]},{label:"DRIVER SIGNATURE (CARRIER)",role:"carrier",fields:["signature","name","date"]}]}}},{id:"hd_rfq_customer",name:"客户询价单",name_en:"REQUEST FOR QUOTATION (RFQ)",type:"rfq",owner:"customer",version:"1.0",lastModified:"2024-01-15",description:"客户询价单（Home Depot向供应商询价）",layout:{pageSize:"Letter",orientation:"portrait",margins:{top:.5,right:.5,bottom:.5,left:.5}},sections:[{id:"rfq_header",name:"rfq_header",title:"",layout:"custom",fields:[{id:"rfq_header_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; letter-spacing: -0.5px; margin-bottom: 8px;">
                      THE COSUN BM
                    </div>
                    <div style="font-size: 9px; color: #333; line-height: 1.4;">
                      <strong>PROCUREMENT DEPARTMENT</strong><br/>
                      2455 Paces Ferry Road, N.W.<br/>
                      Atlanta, Georgia 30339-4024<br/>
                      Phone: (770) 433-8211
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 4px;">
                      REQUEST FOR
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #F96302;">
                      QUOTATION
                    </div>
                  </div>
                </div>
              </div>
            `}]},{id:"rfq_details",name:"rfq_details",title:"RFQ DETAILS",layout:"triple",backgroundColor:"#F5F5F5",border:!0,fields:[{id:"rfq_number",label:"RFQ NUMBER",type:"text",required:!0,width:"33%",defaultValue:"RFQ-HD-2024-0001",fontWeight:"bold",fontSize:11,backgroundColor:"#FFF8F0"},{id:"rfq_date",label:"RFQ DATE",type:"date",required:!0,width:"33%"},{id:"quote_due_date",label:"QUOTE DUE DATE",type:"date",required:!0,width:"33%",fontWeight:"bold",backgroundColor:"#FFF8F0"},{id:"buyer_name",label:"BUYER NAME",type:"text",required:!0,width:"33%"},{id:"buyer_email",label:"BUYER EMAIL",type:"text",required:!0,width:"33%"},{id:"buyer_phone",label:"BUYER PHONE",type:"text",required:!0,width:"33%"},{id:"project_name",label:"PROJECT NAME",type:"text",required:!1,width:"50%"},{id:"validity_period",label:"QUOTE VALIDITY PERIOD",type:"select",required:!0,width:"50%",options:["30 Days","60 Days","90 Days","180 Days"]}]},{id:"vendor_info_rfq",name:"vendor_info_rfq",title:"VENDOR INFORMATION",layout:"single",backgroundColor:"#FFFBF5",fields:[{id:"vendor_details_rfq",label:"TO (VENDOR)",type:"textarea",required:!0,width:"100%",rows:4,placeholder:"Vendor Company Name\\nAddress\\nCity, State ZIP\\nCountry\\nContact Person & Email"}]},{id:"items_requested",name:"items_requested",title:"ITEMS REQUESTED FOR QUOTATION",layout:"table",fields:[{id:"rfq_items_table",label:"Items",type:"table",required:!0,width:"100%",tableColumns:[{id:"item_no",label:"ITEM",width:"5%",type:"number"},{id:"hd_item_code",label:"HD ITEM CODE",width:"12%",type:"text"},{id:"description",label:"ITEM DESCRIPTION & SPECIFICATIONS",width:"35%",type:"text"},{id:"quantity",label:"QUANTITY",width:"10%",type:"number"},{id:"uom",label:"UOM",width:"8%",type:"text"},{id:"target_price",label:"TARGET PRICE",width:"12%",type:"currency"},{id:"delivery_date",label:"REQ. DELIVERY",width:"10%",type:"date"},{id:"notes",label:"NOTES",width:"8%",type:"text"}],sampleRows:[{item_no:"1",hd_item_code:"HD-DOL-12345",description:"Premium Door Lock Set - Brushed Nickel Finish, Grade 1 Security, ANSI/BHMA A156.2",quantity:"10,000",uom:"EA",target_price:"$22.00",delivery_date:"2024-03-01",notes:"Sample required"}]}]},{id:"shipping_requirements",name:"shipping_requirements",title:"SHIPPING & DELIVERY REQUIREMENTS",layout:"triple",backgroundColor:"#F5F5F5",fields:[{id:"delivery_location",label:"DELIVERY LOCATION",type:"select",required:!0,width:"33%",options:["FOB Origin","FOB Destination - DC","Multiple DCs","Store Direct"]},{id:"incoterms_rfq",label:"INCOTERMS",type:"select",required:!0,width:"33%",options:["FOB","CIF","CFR","EXW","DDP","DAP"]},{id:"shipping_method",label:"SHIPPING METHOD",type:"select",required:!1,width:"33%",options:["Ocean","Air","Truck","Rail","Courier"]},{id:"packaging_requirements",label:"PACKAGING REQUIREMENTS",type:"text",required:!1,width:"100%",placeholder:"Specify any special packaging or labeling requirements..."}]},{id:"commercial_terms",name:"commercial_terms",title:"COMMERCIAL TERMS",layout:"triple",backgroundColor:"#FFFBF5",fields:[{id:"payment_terms_rfq",label:"PREFERRED PAYMENT TERMS",type:"select",required:!0,width:"33%",options:["Net 30","Net 60","Net 90","2/10 Net 30","Letter of Credit"]},{id:"warranty_period",label:"WARRANTY PERIOD",type:"select",required:!0,width:"33%",options:["1 Year","2 Years","3 Years","5 Years","Lifetime"]},{id:"quality_certification",label:"QUALITY CERTIFICATION",type:"select",required:!1,width:"33%",options:["ISO 9001","CE","UL","ETL","ANSI","BHMA","Other"]}]},{id:"special_requirements",name:"special_requirements",title:"SPECIAL REQUIREMENTS & INSTRUCTIONS",layout:"single",fields:[{id:"special_requirements_text",label:"",type:"textarea",required:!1,width:"100%",rows:4,placeholder:"Enter any special requirements, testing needs, compliance requirements, or additional instructions..."}]},{id:"submission_instructions",name:"submission_instructions",title:"",layout:"single",fields:[{id:"instructions_html",label:"",type:"html",width:"100%",customHtml:`
              <div style="font-size: 9px; color: #333; line-height: 1.8; padding: 16px; border: 2px solid #F96302; background: #FFFBF5;">
                <strong style="color: #F96302; font-size: 11px;">QUOTE SUBMISSION INSTRUCTIONS:</strong><br/><br/>
                
                <strong>1. QUOTE MUST INCLUDE:</strong><br/>
                • Itemized pricing for each product<br/>
                • Lead times and delivery schedules<br/>
                • Payment terms and conditions<br/>
                • Warranty information<br/>
                • Product specifications and datasheets<br/>
                • Samples (if applicable)<br/>
                • Certifications and compliance documents<br/><br/>
                
                <strong>2. SUBMISSION METHOD:</strong><br/>
                Please submit your quotation via email to the buyer contact listed above, referencing the RFQ number in the subject line.<br/><br/>
                
                <strong>3. EVALUATION CRITERIA:</strong><br/>
                Quotes will be evaluated based on price, quality, delivery time, payment terms, vendor capabilities, and past performance.<br/><br/>
                
                <strong>4. IMPORTANT NOTES:</strong><br/>
                • Late submissions will not be considered<br/>
                • Home Depot reserves the right to accept or reject any or all quotes<br/>
                • This RFQ does not constitute a purchase order or commitment to buy
              </div>
            `}]}],footer:{text:"© 2024 The Home Depot, Inc. This RFQ is confidential and intended only for the recipient vendor.",signatureLines:{enabled:!0,parties:[{label:"ISSUED BY (HOME DEPOT BUYER)",role:"buyer",fields:["signature","name","title","date"]}]}}},{id:"cosun_purchase_contract_cn",name:"福建高盛达富采购合同",name_en:"Cosun Purchase Contract (Chinese)",type:"purchase_contract",owner:"cosun",version:"1.0",lastModified:"2024-11-30",description:"福建高盛达富建材有限公司中文采购合同",layout:{pageSize:"A4",orientation:"portrait",margins:{top:20,right:20,bottom:20,left:20}},sections:[{id:"header",name:"header",title:"",layout:"custom",backgroundColor:"#FFFFFF",fields:[{id:"company_header",label:"",type:"html",width:"100%",customHtml:`
              <div style="text-align: center; padding: 20px 0; border-bottom: 4px solid #F96302;">
                <div style="font-size: 32px; font-weight: 900; color: #F96302; margin-bottom: 10px; letter-spacing: 2px;">
                  福建高盛达富建材有限公司
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
                  FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                </div>
                <div style="font-size: 28px; font-weight: bold; color: #212121; margin-top: 15px;">
                  采购合同
                </div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                  PURCHASE CONTRACT
                </div>
              </div>
            `}]},{id:"contract_info",name:"contract_info",title:"合同信息",layout:"double",backgroundColor:"#FFF8F0",border:!0,fields:[{id:"contract_no",label:"合同编号",type:"text",required:!0,width:"50%",placeholder:"COSUN-PC-2024-001",fontWeight:"bold"},{id:"contract_date",label:"合同日期",type:"date",required:!0,width:"50%",defaultValue:new Date().toISOString().split("T")[0]},{id:"delivery_date",label:"交货日期",type:"date",required:!0,width:"50%"},{id:"payment_terms",label:"付款方式",type:"select",required:!0,width:"50%",options:["T/T 30%预付，70%见提单复印件","T/T 100%预付","L/C 即期","L/C 远期","D/P","D/A","O/A 30天","O/A 60天","O/A 90天"]}]},{id:"parties_info",name:"parties_info",title:"合同双方信息",layout:"custom",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"parties_layout",label:"",type:"html",width:"100%",customHtml:`
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 10px;">
                <!-- 左侧：供应商（乙方/卖家） -->
                <div style="border: 2px solid #888; border-radius: 6px; padding: 12px; background: #FAFAFA;">
                  <h3 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: bold; border-bottom: 2px solid #888; padding-bottom: 6px;">
                    🏭 供应商（乙方）
                  </h3>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司名称 *</div>
                    <input type="text" placeholder="供应商公司名称" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; font-weight: bold;" />
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司地址 *</div>
                    <textarea placeholder="详细地址&#10;邮编：" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; resize: vertical; min-height: 50px;"></textarea>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系人 *</div>
                      <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系电话 *</div>
                      <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">电子邮箱 *</div>
                    <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">统一社会信用代码</div>
                    <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                </div>
                
                <!-- 右侧：采购方（甲方/买家） -->
                <div style="border: 2px solid #F96302; border-radius: 6px; padding: 12px; background: #FFF8F0;">
                  <h3 style="margin: 0 0 12px 0; color: #F96302; font-size: 15px; font-weight: bold; border-bottom: 2px solid #F96302; padding-bottom: 6px;">
                    📋 采购方（甲方）
                  </h3>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司名称</div>
                    <div style="font-weight: bold; color: #212121; font-size: 13px;">福建高盛达富建材有限公司</div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司地址</div>
                    <div style="color: #212121; font-size: 12px; line-height: 1.4;">福建省福州市仓山区建新镇金山工业区<br/>邮编：350008</div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系人</div>
                      <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系电话</div>
                      <input type="text" placeholder="+86-591-XXXX-XXXX" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">电子邮箱</div>
                    <input type="text" placeholder="purchase@cosun.com" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">统一社会信用代码</div>
                    <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                </div>
              </div>
            `}]},{id:"product_details",name:"product_details",title:"产品明细",layout:"single",backgroundColor:"#FFFFFF",fields:[{id:"items_table",label:"",type:"table",width:"100%",rows:3,defaultValue:`福建省福州市仓山区建新镇金山工业区
邮编：350008`,backgroundColor:"#FFF8F0"}]},{id:"supplier_info",name:"supplier_info",title:"供应商（乙方）",layout:"single",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"supplier_company",label:"公司名称",type:"text",required:!0,width:"100%",placeholder:"供应商公司名称",fontWeight:"bold"},{id:"supplier_address",label:"公司地址",type:"textarea",required:!0,width:"100%",rows:3,placeholder:`详细地址
邮编：`},{id:"supplier_contact",label:"联系人",type:"text",required:!0,width:"50%"},{id:"supplier_phone",label:"联系电话",type:"text",required:!0,width:"50%"},{id:"supplier_email",label:"电子邮箱",type:"text",required:!0,width:"50%"},{id:"supplier_tax_no",label:"统一社会信用代码",type:"text",required:!1,width:"50%"}]},{id:"product_details",name:"product_details",title:"产品明细",layout:"single",backgroundColor:"#FFFFFF",fields:[{id:"items_table",label:"",type:"table",width:"100%",columns:[{id:"item_no",label:"序号",width:"8%",type:"text"},{id:"product_name",label:"产品名称",width:"25%",type:"text"},{id:"specifications",label:"规格型号",width:"20%",type:"text"},{id:"unit",label:"单位",width:"8%",type:"text"},{id:"quantity",label:"数量",width:"10%",type:"number"},{id:"unit_price",label:"单价",width:"12%",type:"number"},{id:"amount",label:"金额",width:"12%",type:"number"}],defaultRows:[{item_no:"1",product_name:"",specifications:"",unit:"",quantity:"",unit_price:"",amount:""},{item_no:"2",product_name:"",specifications:"",unit:"",quantity:"",unit_price:"",amount:""},{item_no:"3",product_name:"",specifications:"",unit:"",quantity:"",unit_price:"",amount:""},{item_no:"4",product_name:"",specifications:"",unit:"",quantity:"",unit_price:"",amount:""},{item_no:"5",product_name:"",specifications:"",unit:"",quantity:"",unit_price:"",amount:""}]}]},{id:"amount_summary",name:"amount_summary",title:"金额汇总",layout:"single",backgroundColor:"#FFF8F0",border:!0,fields:[{id:"subtotal",label:"小计金额",type:"text",required:!0,width:"50%",placeholder:"¥0.00",alignment:"right",fontWeight:"bold"},{id:"tax_rate",label:"税率",type:"select",required:!0,width:"25%",options:["0%","3%","6%","9%","13%","17%"],defaultValue:"13%"},{id:"tax_amount",label:"税额",type:"text",required:!0,width:"25%",placeholder:"¥0.00",alignment:"right"},{id:"total_amount",label:"合同总额",type:"text",required:!0,width:"50%",placeholder:"¥0.00",alignment:"right",fontWeight:"bold",fontSize:14,backgroundColor:"#FFE5D0"},{id:"total_amount_words",label:"合同总额（大写）",type:"text",required:!0,width:"50%",placeholder:"人民币：",fontWeight:"bold"}]},{id:"delivery_terms",name:"delivery_terms",title:"交货条款",layout:"single",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"delivery_location",label:"交货地点",type:"text",required:!0,width:"100%",placeholder:"福建省福州市仓山区金山工业区高盛达富仓库"},{id:"delivery_method",label:"运输方式",type:"select",required:!0,width:"50%",options:["供应商送货","采购方自提","物流配送","快递","海运","空运"]},{id:"freight_terms",label:"运费承担",type:"select",required:!0,width:"50%",options:["供应商承担","采购方承担","到付","FOB","CIF","CFR","EXW"]},{id:"delivery_remarks",label:"交货备注",type:"textarea",required:!1,width:"100%",rows:2,placeholder:"其他交货相关说明"}]},{id:"quality_standards",name:"quality_standards",title:"质量标准",layout:"single",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"quality_standard",label:"质量标准",type:"textarea",required:!0,width:"100%",rows:3,defaultValue:`1. 产品须符合国家相关质量标准和行业规范
2. 产品须提供合格证、检验报告等相关质量证明文件
3. 产品包装完好，标识清晰`},{id:"inspection_method",label:"验收方式",type:"select",required:!0,width:"50%",options:["到货验收","抽样检验","全检","第三方检测","供应商自检"]},{id:"warranty_period",label:"质保期",type:"select",required:!0,width:"50%",options:["3个月","6个月","12个月","18个月","24个月","36个月"]}]},{id:"breach_terms",name:"breach_terms",title:"违约责任",layout:"single",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"breach_terms_content",label:"违约条款",type:"textarea",required:!0,width:"100%",rows:4,defaultValue:`1. 乙方未按约定时间交货，每逾期一天按合同总额的0.5%支付违约金
2. 产品质量不符合约定标准，甲方有权退货，乙方承担相关费用
3. 甲方未按约定付款，每逾期一天按应付款项的0.3%支付违约金
4. 任何一方违反合同其他条款，应赔偿对方因此造成的损失`}]},{id:"dispute_resolution",name:"dispute_resolution",title:"争议解决",layout:"single",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"dispute_method",label:"争议解决方式",type:"select",required:!0,width:"50%",options:["友好协商","仲裁","诉讼"],defaultValue:"友好协商"},{id:"arbitration_location",label:"仲裁/诉讼地点",type:"text",required:!1,width:"50%",placeholder:"福建省福州市"},{id:"applicable_law",label:"适用法律",type:"text",required:!0,width:"100%",defaultValue:"中华人民共和国合同法及相关法律法规"}]},{id:"other_terms",name:"other_terms",title:"其他条款",layout:"single",backgroundColor:"#FFFFFF",border:!0,fields:[{id:"contract_copies",label:"合同份数",type:"text",required:!0,width:"50%",defaultValue:"本合同一式两份，甲乙双方各执一份，具有同等法律效力"},{id:"contract_effective_date",label:"生效日期",type:"text",required:!0,width:"50%",defaultValue:"自双方签字盖章之日起生效"},{id:"additional_terms",label:"补充条款",type:"textarea",required:!1,width:"100%",rows:3,placeholder:"其他补充说明事项"}]},{id:"attachments",name:"attachments",title:"附件清单",layout:"single",backgroundColor:"#FFF8F0",border:!0,fields:[{id:"attachment_list",label:"附件",type:"textarea",required:!1,width:"100%",rows:3,placeholder:`附件1：产品规格书
附件2：质量标准文件
附件3：...`}]}],footer:{showPageNumber:!0,text:"福建高盛达富建材有限公司 | Fujian Cosun Tuff Building Materials Co., Ltd. | 采购合同",signatureLines:{enabled:!0,parties:[{label:"采购方（甲方）：福建高盛达富建材有限公司",role:"buyer",fields:["signature","company_seal","name","date"]},{label:"供应商（乙方）：",role:"supplier",fields:["signature","company_seal","name","date"]}]}}}];function S({template:a,onClose:d,onEdit:o}){const[t,s]=m.useState(130),[i,c]=m.useState(1);m.useEffect(()=>{const u=l=>{if(l.key==="Escape"){d();return}if((l.ctrlKey||l.metaKey)&&l.key==="p"){l.preventDefault(),h();return}if((l.ctrlKey||l.metaKey)&&l.key==="e"&&o){l.preventDefault(),y();return}(l.ctrlKey||l.metaKey)&&(l.key==="="||l.key==="+"?(l.preventDefault(),s(p=>Math.min(200,p+10))):l.key==="-"?(l.preventDefault(),s(p=>Math.max(50,p-10))):l.key==="0"&&(l.preventDefault(),s(100)))};return window.addEventListener("keydown",u),()=>window.removeEventListener("keydown",u)},[d,o]);const h=()=>{const u=document.querySelector(".form-preview-content");if(!u){alert("无法找到表单内容，请重试");return}const l=window.open("","_blank");if(!l){alert("无法打开打印窗口，请检查浏览器设置");return}const p=u.cloneNode(!0),N=`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${a.name} - ${a.name_en}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5in;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* 确保颜色打印 */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* 重置transform */
            .form-preview-content {
              transform: none !important;
              width: 100% !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* 确保橙色背景显示 */
            [style*="background-color: rgb(249, 99, 2)"],
            [style*="background-color:#F96302"] {
              background-color: #F96302 !important;
            }
            
            /* 表格样式 */
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            /* 避免分页切断 */
            table, tr, td, th {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          ${p.outerHTML}
        </body>
      </html>
    `;l.document.write(N),l.document.close(),l.onload=()=>{setTimeout(()=>{l.print(),l.onafterprint=()=>{l.close()}},250)}},F=()=>{window.confirm(`📥 下载 "${a.name}" 为PDF

点击"确定"后将打开打印对话框。

请在打印对话框中：
1. 选择"保存为PDF"或"Microsoft Print to PDF"
2. 点击"保存"按钮
3. 输入文件名并选择保存位置

建议文件名: ${a.id}_${new Date().toISOString().slice(0,10)}.pdf`)&&h()},y=()=>{o&&(o(a),d())};return e.jsx("div",{className:"fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col",children:[e.jsxs("div",{className:"bg-gray-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("h3",{className:"font-bold text-lg",children:a.name}),e.jsx("span",{className:"text-gray-400 text-sm",children:a.name_en})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",onClick:()=>s(Math.max(50,t-10)),children:e.jsx(w,{className:"w-4 h-4"})}),e.jsxs("span",{className:"text-sm min-w-[60px] text-center",children:[t,"%"]}),e.jsx(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",onClick:()=>s(Math.min(200,t+10)),children:e.jsx(E,{className:"w-4 h-4"})}),e.jsx("div",{className:"w-px h-6 bg-gray-600 mx-2"}),o&&e.jsxs(e.Fragment,{children:[e.jsxs(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",onClick:y,title:"编辑表单",children:[e.jsx(T,{className:"w-4 h-4 mr-2"}),"编辑"]}),e.jsx("div",{className:"w-px h-6 bg-gray-600 mx-2"})]}),e.jsxs(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",onClick:h,title:"打印表单 (Ctrl+P)",children:[e.jsx(v,{className:"w-4 h-4 mr-2"}),"打印"]}),e.jsxs(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",onClick:F,title:"下载为PDF",children:[e.jsx(C,{className:"w-4 h-4 mr-2"}),"下载"]}),e.jsx("div",{className:"w-px h-6 bg-gray-600 mx-2"}),e.jsx(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",onClick:d,title:"关闭预览 (Esc)",children:e.jsx(f,{className:"w-4 h-4"})})]})]}),e.jsx("div",{className:"flex-1 overflow-auto bg-gray-100 p-8",children:e.jsx("div",{className:"mx-auto bg-white shadow-xl form-preview-content",style:{width:"8.5in",minHeight:"11in",transform:`scale(${t/100})`,transformOrigin:"top center",transition:"transform 0.2s"},children:e.jsx(R,{template:a})})}),e.jsxs("div",{className:"bg-gray-900 text-white px-6 py-3 rounded-b-lg flex items-center justify-center gap-4",children:[e.jsx(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",disabled:i===1,children:e.jsx(O,{className:"w-4 h-4"})}),e.jsxs("span",{className:"text-sm",children:["第 ",i," 页"]}),e.jsx(n,{size:"sm",variant:"ghost",className:"text-white hover:bg-white/10",children:e.jsx(_,{className:"w-4 h-4"})})]})]})})}function R({template:a}){const d="#F96302",o="#212121";return e.jsxs("div",{className:"p-12 font-sans",style:{fontSize:"10pt",lineHeight:"1.5"},children:[e.jsx("div",{className:"h-3 mb-6",style:{backgroundColor:d}}),e.jsxs("div",{className:"mb-8",children:[e.jsxs("div",{className:"flex items-start justify-between mb-4",children:[e.jsxs("div",{className:"w-48",children:[e.jsx("div",{className:"text-3xl font-black mb-2",style:{color:d},children:"THE COSUN BM"}),e.jsx("div",{className:"text-xs text-gray-600 leading-tight",children:a.owner==="cosun"?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"font-semibold",children:"Fujian Cosun Tuff Building Materials Co., Ltd."}),e.jsx("div",{children:"123 Industrial Park Road"}),e.jsx("div",{children:"Fuzhou, Fujian 350000, China"}),e.jsx("div",{children:"Tel: +86-591-8888-8888"}),e.jsx("div",{children:"Email: info@cosun.com"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{children:"2455 Paces Ferry Road SE"}),e.jsx("div",{children:"Atlanta, GA 30339"}),e.jsx("div",{children:"Tel: 1-800-HOME-DEPOT"})]})})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h1",{className:"text-4xl font-black mb-2",style:{color:o},children:a.name_en.toUpperCase()}),e.jsx("div",{className:"text-sm text-gray-600",children:a.name})]})]}),e.jsx("div",{className:"h-1 mb-6",style:{backgroundColor:d}})]}),e.jsx("div",{className:"space-y-6",children:a.sections.map((t,s)=>e.jsxs("div",{className:"mb-6",children:[t.title&&e.jsx("div",{className:"px-4 py-2 mb-3 font-bold text-white",style:{backgroundColor:d},children:t.title}),e.jsx("div",{className:"p-4",style:{backgroundColor:t.backgroundColor||"transparent",border:t.border?`2px solid ${d}`:"none"},children:t.fields[0]?.type==="table"?e.jsx("div",{className:"overflow-hidden border-2",style:{borderColor:d},children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{children:e.jsxs("tr",{style:{backgroundColor:d},children:[e.jsx("th",{className:"px-3 py-2 text-left text-white text-xs font-bold border-r border-white",children:"NO."}),e.jsx("th",{className:"px-3 py-2 text-left text-white text-xs font-bold border-r border-white",children:"DESCRIPTION"}),e.jsx("th",{className:"px-3 py-2 text-left text-white text-xs font-bold border-r border-white",children:"QTY"}),e.jsx("th",{className:"px-3 py-2 text-left text-white text-xs font-bold border-r border-white",children:"UNIT PRICE"}),e.jsx("th",{className:"px-3 py-2 text-left text-white text-xs font-bold",children:"AMOUNT"})]})}),e.jsx("tbody",{children:[1,2,3,4,5].map(i=>e.jsxs("tr",{className:"border-b",style:{borderColor:d},children:[e.jsx("td",{className:"px-3 py-3 text-xs border-r",style:{borderColor:"#E0E0E0"},children:i}),e.jsx("td",{className:"px-3 py-3 text-xs border-r",style:{borderColor:"#E0E0E0"},children:i===1?"Sample Product Description":""}),e.jsx("td",{className:"px-3 py-3 text-xs border-r",style:{borderColor:"#E0E0E0"},children:i===1?"100":""}),e.jsx("td",{className:"px-3 py-3 text-xs text-right border-r",style:{borderColor:"#E0E0E0"},children:i===1?"$10.00":""}),e.jsx("td",{className:"px-3 py-3 text-xs text-right",children:i===1?"$1,000.00":""})]},i))})]})}):e.jsx("div",{className:`grid gap-4 ${t.layout==="single"?"grid-cols-1":t.layout==="triple"?"grid-cols-3":"grid-cols-2"}`,children:t.fields.map(i=>e.jsxs("div",{style:{width:i.width||"100%"},children:[e.jsxs("label",{className:"block text-xs font-bold mb-1",style:{color:o},children:[i.label,i.required&&e.jsx("span",{style:{color:d},children:" *"})]}),i.type==="textarea"?e.jsx("textarea",{className:"w-full px-3 py-2 text-sm border-2 rounded focus:outline-none focus:ring-2",style:{borderColor:"#D0D0D0",minHeight:"60px"},placeholder:i.placeholder,defaultValue:i.defaultValue}):i.type==="select"?e.jsxs("select",{className:"w-full px-3 py-2 text-sm border-2 rounded focus:outline-none",style:{borderColor:"#D0D0D0"},children:[e.jsx("option",{value:"",children:"Select..."}),i.options?.map(c=>e.jsx("option",{value:c,children:c},c))]}):i.type==="date"?e.jsx("input",{type:"date",className:"w-full px-3 py-2 text-sm border-2 rounded focus:outline-none",style:{borderColor:"#D0D0D0"},defaultValue:i.defaultValue||new Date().toISOString().split("T")[0]}):e.jsx("input",{type:i.type==="number"?"number":"text",className:"w-full px-3 py-2 text-sm border-2 rounded focus:outline-none focus:ring-2",style:{borderColor:"#D0D0D0",fontWeight:i.fontWeight==="bold"?"bold":"normal",fontSize:i.fontSize?`${i.fontSize}pt`:"10pt",textAlign:i.alignment||"left"},placeholder:i.placeholder,defaultValue:i.defaultValue})]},i.id))})})]},t.id))}),a.footer.signatureLines?.enabled&&e.jsx("div",{className:"mt-12 pt-6 border-t-2",style:{borderColor:d},children:e.jsx("div",{className:`grid gap-8 ${a.footer.signatureLines.parties.length>1?"grid-cols-2":"grid-cols-1"}`,children:a.footer.signatureLines.parties.map(t=>e.jsxs("div",{children:[e.jsx("div",{className:"mb-8 border-b-2 border-gray-400"}),e.jsx("div",{className:"text-xs font-bold",style:{color:o},children:t.label}),e.jsx("div",{className:"text-xs text-gray-500 mt-1",children:"Date: ______________"})]},t.label))})}),e.jsx("div",{className:"h-3 mt-8",style:{backgroundColor:d}}),e.jsxs("div",{className:"mt-4 text-xs text-center text-gray-500",children:[e.jsx("div",{children:"This document is for business purposes only. Confidential information."}),e.jsx("div",{className:"font-bold mt-1",style:{color:d},children:"THE COSUN BM - Building Materials Division"})]})]})}const r={primary:"#F96302",secondary:"#FF8C42",accent:"#FFA500",lightBg:"#FFF8F0"};function k({onClose:a}){const[d,o]=m.useState(null);return e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50",children:[e.jsx("div",{className:"bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white py-8 px-6 shadow-lg",style:{background:`linear-gradient(135deg, ${r.primary} 0%, ${r.accent} 50%, ${r.primary} 100%)`},children:e.jsxs("div",{className:"max-w-7xl mx-auto",children:[e.jsxs("div",{className:"flex items-center justify-between gap-4 mb-4",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"bg-white/20 backdrop-blur p-4 rounded-xl",children:e.jsx(g,{className:"w-10 h-10"})}),e.jsxs("div",{children:[e.jsxs("h1",{className:"text-4xl font-black mb-2 flex items-center gap-3",children:["HOME DEPOT 商业文档",e.jsx(I,{className:"w-8 h-8",style:{color:r.secondary}})]}),e.jsx("p",{className:"text-orange-100 text-lg",children:"The Home Depot | 100% 真实的 B2B 商业文档 | 采购订单、发票、装箱单、提单、对账单等完整单据"})]})]}),a&&e.jsxs(n,{onClick:a,variant:"ghost",size:"lg",className:"text-white hover:bg-white/20 hover:text-white flex items-center gap-2 px-6 py-3 text-base font-bold",children:[e.jsx(f,{className:"w-6 h-6"}),"关闭"]})]}),e.jsx("div",{className:"bg-white/10 backdrop-blur rounded-lg p-4 mt-4",children:e.jsxs("div",{className:"grid grid-cols-4 gap-4 text-center",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-3xl font-bold",children:x.length}),e.jsx("div",{className:"text-orange-100 text-sm",children:"真实文档模板"})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-3xl font-bold",children:"100%"}),e.jsx("div",{className:"text-orange-100 text-sm",children:"真实度"})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-3xl font-bold",children:"Letter"}),e.jsx("div",{className:"text-orange-100 text-sm",children:"美国标准纸张"})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-3xl font-bold",children:"B2B"}),e.jsx("div",{className:"text-orange-100 text-sm",children:"商业贸易"})]})]})})]})}),e.jsxs("div",{className:"max-w-7xl mx-auto p-8",children:[e.jsx("div",{className:"grid grid-cols-1 gap-6",children:x.map((t,s)=>e.jsxs("div",{className:"bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-8",style:{borderLeftColor:r.primary},children:[e.jsx("div",{className:"p-8",children:e.jsxs("div",{className:"flex items-start justify-between gap-6",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx("div",{className:"w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg",style:{background:`linear-gradient(135deg, ${r.primary} 0%, ${r.accent} 100%)`},children:e.jsx("span",{className:"text-3xl font-black",children:s+1})})}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-2xl font-black text-gray-900 mb-2",children:t.name}),e.jsx("p",{className:"text-lg font-bold mb-2",style:{color:r.primary},children:t.name_en})]}),e.jsx(b,{className:"text-white text-sm px-4 py-1",style:{backgroundColor:r.secondary},children:"真实文档"})]}),e.jsx("p",{className:"text-gray-600 mb-4 text-base",children:t.description}),e.jsxs("div",{className:"grid grid-cols-4 gap-4 mb-4",children:[e.jsxs("div",{className:"rounded-lg p-3",style:{backgroundColor:r.lightBg},children:[e.jsx("div",{className:"text-xs font-semibold mb-1",style:{color:r.primary},children:"文档类型"}),e.jsx("div",{className:"text-sm font-bold text-gray-900",children:t.type})]}),e.jsxs("div",{className:"rounded-lg p-3",style:{backgroundColor:r.lightBg},children:[e.jsx("div",{className:"text-xs font-semibold mb-1",style:{color:r.primary},children:"所有者"}),e.jsx("div",{className:"text-sm font-bold text-gray-900",children:t.owner==="customer"?"Home Depot":t.owner==="cosun"?"Cosun":t.owner})]}),e.jsxs("div",{className:"rounded-lg p-3",style:{backgroundColor:"#FFF4E6"},children:[e.jsx("div",{className:"text-xs font-semibold mb-1",style:{color:r.secondary},children:"纸张规格"}),e.jsxs("div",{className:"text-sm font-bold text-gray-900",children:[t.layout?.pageSize||"Letter",' (8.5" × 11")']})]}),e.jsxs("div",{className:"rounded-lg p-3",style:{backgroundColor:"#FFF4E6"},children:[e.jsx("div",{className:"text-xs font-semibold mb-1",style:{color:r.secondary},children:"区块数量"}),e.jsxs("div",{className:"text-sm font-bold text-gray-900",children:[t.sections.length," 个区块"]})]})]}),e.jsxs("div",{className:"bg-gray-50 rounded-lg p-4 mb-4",children:[e.jsx("div",{className:"text-xs font-bold text-gray-500 mb-2 uppercase",children:"关键字段包含"}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[t.sections.slice(0,3).map(i=>i.fields.slice(0,3).map(c=>e.jsx(b,{variant:"outline",className:"text-xs",children:c.label},c.id))),t.sections.length>3&&e.jsxs(b,{variant:"outline",className:"text-xs",children:["+",t.sections.length-3," 更多区块..."]})]})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs(n,{onClick:()=>o(t),className:"text-white font-bold shadow-lg",size:"lg",style:{backgroundColor:r.primary},children:[e.jsx(A,{className:"w-5 h-5 mr-2"}),"预览真实文档",e.jsx(_,{className:"w-4 h-4 ml-2"})]}),e.jsx(n,{variant:"outline",size:"lg",className:"border-2 font-bold",style:{borderColor:r.secondary,color:r.secondary},children:"查看字段详情"})]})]})]})}),e.jsx("div",{className:"h-2",style:{background:`linear-gradient(90deg, ${r.primary} 0%, ${r.accent} 50%, ${r.secondary} 100%)`}})]},t.id))}),e.jsxs("div",{className:"mt-12 bg-white rounded-xl shadow-lg p-8 border-t-4",style:{borderTopColor:r.primary},children:[e.jsxs("h3",{className:"text-2xl font-black text-gray-900 mb-4 flex items-center gap-2",children:[e.jsx(g,{className:"w-7 h-7",style:{color:r.primary}}),"关于 Home Depot 商业文档系统"]}),e.jsxs("div",{className:"space-y-3 text-gray-700 leading-relaxed",children:[e.jsxs("p",{children:[e.jsx("strong",{style:{color:r.primary},children:"✓ 100% 真实格式："}),"这些模板基于 The Home Depot 实际使用的 B2B 商业文档，包含所有真实的字段、格式和业务逻辑。涵盖从采购订单到收货确认的完整供应链流程。"]}),e.jsxs("p",{children:[e.jsx("strong",{style:{color:r.primary},children:"✓ 完整的业务流程："}),"包含采购订单(PO)、供应商发票、装箱单、提单、对账单、付款通知、收货确认单、询价单(RFQ)等全套单据。覆盖采购、物流、财务全流程。"]}),e.jsxs("p",{children:[e.jsx("strong",{style:{color:r.secondary},children:"✓ 符合北美标准："}),'使用 Letter 尺寸 (8.5" × 11")，符合美国商业文档规范。包含 FOB Terms、Payment Terms、Warranty 等美国零售业标准字段。']}),e.jsxs("p",{children:[e.jsx("strong",{style:{color:r.secondary},children:"✓ 可直接使用："}),"这些模板可以直接用于实际的 B2B 供应链管理，适用于建材、五金、家装、电气等 Home Depot 经营的所有品类。支持多种贸易条款和支付方式。"]}),e.jsxs("p",{children:[e.jsx("strong",{style:{color:r.accent},children:"✓ Home Depot 品牌风格："}),"采用 Home Depot 标志性橙色(#F96302)为主色调，象征活力与专业；简洁明快的设计风格，体现北美零售巨头的效率与标准化管理理念。"]})]})]})]}),d&&e.jsx(S,{template:d,onClose:()=>o(null)})]})}export{k as default};
