import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { DamageClaimForm } from './DamageClaimForm';
import { InquiryForm } from './InquiryForm';
import { QuotationForm } from './QuotationForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { QCScheduleForm } from './QCScheduleForm';
import { QCInspectionReport } from './QCInspectionReport';
import { QCResultReport } from './QCResultReport';
import { FreightInquiryForm } from './FreightInquiryForm';
import { FreightConfirmationForm } from './FreightConfirmationForm';
import { BookingConfirmationForm } from './BookingConfirmationForm';
import { 
  Package,
  Search,
  MessageSquare,
  FileText,
  DollarSign,
  CheckCircle2,
  Factory,
  ClipboardCheck,
  TruckIcon,
  Ship,
  Download,
  Eye,
  Calendar,
  MapPin,
  Users,
  Box,
  Camera,
  File,
  ExternalLink,
  Container,
  Anchor,
  Globe,
  AlertCircle,
  Clock,
  Mail,
  CreditCard,
  Banknote,
  FileCheck,
  Plane,
  ShipWheel,
  MapPinned,
  Package2,
  Building2,
  ChevronRight,
  Info,
  ChevronDown,
  ChevronUp,
  Bell
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// Mock data with complete order lifecycle
const mockOrders = [
  {
    id: 'PO-2025-001',
    inquiryDate: '2024-12-20',
    orderDate: '2025-01-10',
    productName: 'LED Panel Light 60x60cm + 2 more items',
    totalItems: 5000,
    totalValue: 77500.00,
    currentPhaseIndex: 4,
    currentStageId: 'loading_supervision',
    overallProgress: 78,
    estimatedArrival: '2025-03-25',
    phases: [
      {
        id: 'inquiry',
        name: 'Inquiry',
        icon: MessageSquare,
        color: 'purple',
        status: 'completed',
        stages: [
          {
            id: 'inquiry_submitted',
            name: 'Customer Inquiry',
            date: '2024-12-20',
            time: '14:30',
            status: 'completed',
            icon: MessageSquare,
            details: {
              'Inquiry No': 'INQ-2024-1220-045',
              'Contact Person': 'John Smith',
              'Products': '3 items'
            },
            documents: [
              { name: 'Inquiry_Form.pdf', size: '198 KB', type: 'pdf' }
            ],
            isImportant: false
          },
          {
            id: 'quotation_sent',
            name: 'Quotation Received',
            date: '2024-12-22',
            time: '10:15',
            status: 'completed',
            icon: FileText,
            details: {
              'Quotation Number': 'QT-2025-001234',
              'Received From': 'COSUN - Fujian Gaoshengda Fuji Building Materials',
              'Total Amount': '$500,279.00 USD',
              'Total Quantity': '61,800 SQM',
              'Valid Until': 'February 18, 2025',
              'Delivery Terms': 'CIF Los Angeles'
            },
            quotationItems: [
              {
                item: 1,
                productName: 'Glazed Ceramic Floor Tiles',
                model: 'GSD-FL-400',
                specifications: '400x400mm, 9mm, Beige, Matt',
                quantity: '32,800 SQM',
                unitPrice: '$7.80',
                totalAmount: '$255,840.00'
              },
              {
                item: 2,
                productName: 'Wall Tiles',
                model: 'GSD-WL-306',
                specifications: '300x600mm, 8mm, White, Glossy',
                quantity: '22,500 SQM',
                unitPrice: '$6.50',
                totalAmount: '$146,250.00'
              },
              {
                item: 3,
                productName: 'Mosaic Tiles',
                model: 'GSD-MS-25',
                specifications: '25x25mm chip, 300x300mm sheet, Blue/Green Mix',
                quantity: '6,500 SQM',
                unitPrice: '$12.80',
                totalAmount: '$83,200.00'
              }
            ],
            documents: [
              { name: 'Quotation_Form.pdf', size: '245 KB', type: 'pdf' }
            ],
            isImportant: false
          }
        ]
      },
      {
        id: 'contract',
        name: 'Order & Payment',
        icon: FileCheck,
        color: 'blue',
        status: 'completed',
        stages: [
          {
            id: 'po_received',
            name: 'PO Received',
            date: '2025-01-08',
            time: '16:20',
            status: 'completed',
            icon: FileCheck,
            details: {
              'PO Number': 'PO-2025-001',
              'Amount': '$77,500.00',
              'Payment Terms': '30% Deposit + 70% Balance'
            },
            documents: [
              { name: 'Purchase_Order.pdf', size: '189 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'deposit_requested',
            name: 'Deposit Invoice',
            date: '2025-01-09',
            time: '09:30',
            status: 'completed',
            icon: CreditCard,
            details: {
              'Deposit': '$23,250.00 (30%)'
            },
            isImportant: false
          },
          {
            id: 'deposit_received',
            name: 'Deposit Received',
            date: '2025-01-10',
            time: '14:45',
            status: 'completed',
            icon: Banknote,
            details: {
              'Amount': '$23,250.00',
              'Bank Ref': 'TT20250110XXXX'
            },
            isImportant: true
          }
        ]
      },
      {
        id: 'production',
        name: 'Production',
        icon: Factory,
        color: 'orange',
        status: 'completed',
        stages: [
          {
            id: 'cosun_po_issued',
            name: 'COSUN PO to Factory',
            date: '2025-01-12',
            time: '11:00',
            status: 'completed',
            icon: Building2,
            factoryDistribution: [
              { name: 'Guangdong Lighting Factory A', location: 'Guangzhou', quantity: 2000 },
              { name: 'Shenzhen LED Manufacturing B', location: 'Shenzhen', quantity: 2000 },
              { name: 'Foshan Electronics C', location: 'Foshan', quantity: 1000 }
            ],
            isImportant: true
          },
          {
            id: 'production_scheduled',
            name: 'Production Scheduled',
            date: '2025-01-15',
            time: '09:00',
            status: 'completed',
            icon: Calendar,
            details: {
              'Start Date': '2025-01-20',
              'Est. Completion': '2025-02-25',
              'Duration': '36 days'
            },
            isImportant: false
          },
          {
            id: 'production_started',
            name: 'Production Started',
            date: '2025-01-20',
            time: '08:00',
            status: 'completed',
            icon: Factory,
            isImportant: false
          },
          {
            id: 'production_progress',
            name: 'Production Progress',
            date: '2025-02-10',
            time: '16:00',
            status: 'completed',
            icon: Factory,
            progressDetails: [
              { factory: 'Guangdong Lighting Factory A', progress: 100, completed: 2000, total: 2000 },
              { factory: 'Shenzhen LED Manufacturing B', progress: 100, completed: 2000, total: 2000 },
              { factory: 'Foshan Electronics C', progress: 100, completed: 1000, total: 1000 }
            ],
            images: [
              'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800',
              'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'
            ],
            isImportant: true
          },
          {
            id: 'production_completed',
            name: 'Production Completed',
            date: '2025-02-23',
            time: '17:30',
            status: 'completed',
            icon: CheckCircle2,
            details: {
              'Total Produced': '5,000 pcs',
              'Quality Rate': '99.8%'
            },
            isImportant: true
          }
        ]
      },
      {
        id: 'quality',
        name: 'Quality Control',
        icon: ClipboardCheck,
        color: 'yellow',
        status: 'completed',
        stages: [
          {
            id: 'qc_scheduled',
            name: 'QC Scheduled',
            date: '2025-02-24',
            time: '10:00',
            status: 'completed',
            icon: Calendar,
            details: {
              'Date': '2025-02-28',
              'Inspector': 'SGS',
              'Location': 'Guangzhou Warehouse'
            },
            documents: [
              { name: 'QC_Schedule_Confirmation.pdf', size: '156 KB', type: 'pdf' }
            ],
            isImportant: false
          },
          {
            id: 'qc_inspection',
            name: 'QC Inspection',
            date: '2025-02-28',
            time: '09:00',
            status: 'completed',
            icon: ClipboardCheck,
            details: {
              'Inspector': 'Michael Zhang (SGS)',
              'Type': 'Pre-shipment',
              'Duration': '6 hours'
            },
            documents: [
              { name: 'QC_Inspection_Report.pdf', size: '1.2 MB', type: 'pdf' }
            ],
            images: [
              'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
              'https://images.unsplash.com/photo-1581092918484-8313e1f1e1dd?w=800'
            ],
            isImportant: true
          },
          {
            id: 'qc_result',
            name: 'QC Result: PASSED',
            date: '2025-02-28',
            time: '17:00',
            status: 'completed',
            icon: CheckCircle2,
            details: {
              'Result': 'PASSED ✓',
              'Acceptance Rate': '99.8%',
              'Major Defects': '0',
              'Minor Defects': '8'
            },
            documents: [
              { name: 'QC_Report_PO-2025-001.pdf', size: '1.2 MB', type: 'pdf' },
              { name: 'QC_Photos.zip', size: '8.5 MB', type: 'zip' }
            ],
            qcPhotos: [
              'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800',
              'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
              'https://images.unsplash.com/photo-1581092918484-8313e1f1e1dd?w=800',
              'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800',
              'https://images.unsplash.com/photo-1581092583537-20d51b2e3057?w=800',
              'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800',
              'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800',
              'https://images.unsplash.com/photo-1581092800698-e45906c5a48d?w=800'
            ],
            isImportant: true
          }
        ]
      },
      {
        id: 'shipping',
        name: 'Shipping',
        icon: Ship,
        color: 'cyan',
        status: 'in_progress',
        stages: [
          {
            id: 'freight_inquiry',
            name: 'Freight Inquiry',
            date: '2025-03-01',
            time: '10:30',
            status: 'completed',
            icon: Mail,
            details: {
              'Forwarder': 'China Shipping',
              'Route': 'Guangzhou → LA'
            },
            documents: [
              { name: 'Freight_Inquiry.pdf', size: '198 KB', type: 'pdf' }
            ],
            isImportant: false
          },
          {
            id: 'freight_confirmation',
            name: 'Freight Confirmed',
            date: '2025-03-02',
            time: '15:20',
            status: 'completed',
            icon: CheckCircle2,
            details: {
              'Freight Cost': '$2,850.00',
              'Transit Time': '18-22 days',
              'Incoterms': 'FOB Guangzhou'
            },
            documents: [
              { name: 'Freight_Confirmation.pdf', size: '165 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'booking_arranged',
            name: 'Space Booked',
            date: '2025-03-03',
            time: '11:00',
            status: 'completed',
            icon: Ship,
            details: {
              'Booking No': 'COSN-BK-2025-0303-789',
              'Vessel': 'COSCO GLORY V.125E',
              'ETD': '2025-03-12',
              'ETA': '2025-03-30'
            },
            documents: [
              { name: 'Booking_Confirmation.pdf', size: '178 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'container_arranged',
            name: 'Container Arranged',
            date: '2025-03-05',
            time: '09:15',
            status: 'completed',
            icon: Container,
            details: {
              'Container No': 'CSNU1234567',
              'Type': '40HQ',
              'Seal No': 'SL789456'
            },
            isImportant: false
          },
          {
            id: 'trucking_arranged',
            name: 'Trucking Arranged',
            date: '2025-03-06',
            time: '08:30',
            status: 'completed',
            icon: TruckIcon,
            details: {
              'Company': 'GD Logistics',
              'Driver': 'Li Wei',
              'Phone': '+86 138 0000 1234'
            },
            isImportant: false
          },
          {
            id: 'loading_scheduled',
            name: 'Loading Scheduled',
            date: '2025-03-07',
            time: '10:00',
            status: 'completed',
            icon: Calendar,
            details: {
              'Date': '2025-03-08 09:00 AM',
              'Location': 'Guangzhou Center',
              'Address': 'No.123 Huangpu District'
            },
            isImportant: false
          },
          {
            id: 'loading_supervision',
            name: 'Loading Supervision',
            date: '2025-03-08',
            time: '09:00',
            status: 'in_progress',
            icon: Users,
            details: {
              'Supervisor': 'COSUN QC - Wang Ming',
              'Start Time': '09:00 AM',
              'Status': 'In Progress...'
            },
            images: [
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
              'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800',
              'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800'
            ],
            isImportant: true
          },
          {
            id: 'loading_completed',
            name: 'Loading Completed',
            date: '2025-03-08',
            time: '14:30',
            status: 'in_progress',
            icon: CheckCircle2,
            details: {
              'Cartons': '285',
              'Gross Weight': '18,500 KG',
              'CBM': '58.5',
              'Utilization': '87%'
            },
            documents: [
              { name: 'Loading_Report.pdf', size: '456 KB', type: 'pdf' }
            ],
            images: [
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
              'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800'
            ],
            isImportant: true
          },
          {
            id: 'truck_to_port',
            name: 'Truck to Port',
            date: '2025-03-08',
            time: '15:00',
            status: 'completed',
            icon: TruckIcon,
            details: {
              'Departure Time': '2025-03-08 15:00',
              'Departure Location': 'Guangzhou Consolidation Center',
              'Distance': '45 KM',
              'Arrival Time': '2025-03-08 16:20',
              'Arrival Location': 'Guangzhou Huangpu Port Yard',
              'Container Tare Weight': '3,850 KG',
              'Cargo Weight': '18,500 KG',
              'Gross Weight': '22,350 KG',
              'Driver': 'Li Wei',
              'Truck Plate': '粤A·12345'
            },
            documents: [
              { name: 'Weight_Certificate.pdf', size: '156 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'customs_clearance',
            name: 'Customs Clearance',
            date: '2025-03-09',
            time: '09:30',
            status: 'completed',
            icon: FileText,
            details: {
              'Declaration Time': '2025-03-09 09:30',
              'Customs Broker': 'GZ Customs Broker Co., Ltd',
              'Customs Declaration No': 'GZ2025030900123',
              'HS Code': '9405.40.00',
              'Product Description': 'LED Panel Lights',
              'Declared Value': '$77,500.00',
              'Export Tax': '$0.00 (Tax Rebate Eligible)',
              'Inspection Status': 'Green Channel - No Inspection',
              'Clearance Time': '2025-03-09 14:45',
              'Processing Duration': '5 hours 15 mins'
            },
            documents: [
              { name: 'Customs_Declaration.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Export_License.pdf', size: '189 KB', type: 'pdf' },
              { name: 'Packing_List.pdf', size: '156 KB', type: 'pdf' },
              { name: 'Commercial_Invoice.pdf', size: '198 KB', type: 'pdf' }
            ],
            isImportant: true
          }
        ]
      },
      {
        id: 'transit',
        name: 'Sea Transit',
        icon: Anchor,
        color: 'indigo',
        status: 'pending',
        stages: [
          {
            id: 'departed_port',
            name: 'Departed Origin',
            date: '2025-03-12',
            time: '14:30',
            status: 'completed',
            icon: Anchor,
            details: {
              'Departure Time': '2025-03-12 14:30',
              'Origin Port': 'Guangzhou Port (Huangpu)',
              'Port Code': 'CNCAN',
              'Terminal': 'Huangpu New Port Terminal 3',
              'Vessel Name': 'COSCO GLORY',
              'Voyage Number': 'V.125E',
              'IMO Number': 'IMO 9845632',
              'Vessel Flag': 'China (CN)',
              'Vessel Type': 'Container Ship',
              'Vessel Capacity': '8,500 TEU',
              'ETD (Estimated)': '2025-03-12 14:00',
              'ATD (Actual)': '2025-03-12 14:30',
              'Destination Port': 'Los Angeles Port (USLAX)',
              'ETA': '2025-03-30 08:00',
              'Transit Time': '18 Days',
              'Shipping Route': 'Trans-Pacific (TPX)',
              'Container No': 'CSNU1234567',
              'Seal No': 'SN789456123'
            },
            documents: [
              { name: 'Bill_of_Lading.pdf', size: '267 KB', type: 'pdf' },
              { name: 'Vessel_Schedule.pdf', size: '145 KB', type: 'pdf' },
              { name: 'Departure_Confirmation.pdf', size: '178 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'transit_port',
            name: 'Transit Port',
            date: '2025-03-18',
            time: '16:45',
            status: 'completed',
            icon: ShipWheel,
            details: {
              'Transit Port': 'Busan Port (South Korea)',
              'Port Code': 'KRPUS',
              'Terminal': 'Busan New Port Container Terminal',
              'Arrival Time': '2025-03-18 16:45',
              'Departure Time': '2025-03-19 22:30',
              'Port Stay Duration': '29 hours 45 mins',
              'Vessel Name': 'COSCO GLORY',
              'Voyage Number': 'V.125E',
              'Operations': 'Container Transfer & Refueling',
              'Containers Loaded': '247 TEU',
              'Containers Unloaded': '183 TEU',
              'Container Status': 'Remained on Vessel',
              'Next Port': 'Los Angeles (USLAX)',
              'Distance to Next': '8,900 KM',
              'ETA Next Port': '2025-03-30 08:00'
            },
            documents: [
              { name: 'Transit_Port_Report.pdf', size: '198 KB', type: 'pdf' },
              { name: 'Container_Status.pdf', size: '134 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'approaching_destination',
            name: 'Arriving Destination',
            date: '2025-03-29',
            time: '18:30',
            status: 'in-progress',
            icon: MapPinned,
            details: {
              'Last Position Update': '2025-03-29 18:30 UTC',
              'Current Location': 'Pacific Ocean - California Coast',
              'GPS Coordinates': '33°42\'N, 121°15\'W',
              'Distance to LA Port': '285 Nautical Miles (528 KM)',
              'Estimated Distance Remaining': '12-14 Hours',
              'Current Speed': '19.5 Knots (36 KM/H)',
              'Average Speed (Last 24H)': '20.2 Knots',
              'Heading': '085° (East)',
              'Vessel Name': 'COSCO GLORY',
              'Voyage Number': 'V.125E',
              'Destination Port': 'Los Angeles Port (USLAX)',
              'Original ETA': '2025-03-30 08:00',
              'Updated ETA': '2025-03-30 06:30',
              'ETA Variance': '-1.5 Hours (Earlier)',
              'Sea Condition': 'Moderate - Wave Height 1.5M',
              'Weather': 'Partly Cloudy, Wind 15 Knots'
            },
            documents: [
              { name: 'Vessel_Position_Report.pdf', size: '145 KB', type: 'pdf' },
              { name: 'ETA_Update_Notice.pdf', size: '123 KB', type: 'pdf' }
            ],
            isImportant: true
          }
        ]
      },
      {
        id: 'delivery',
        name: 'Delivery & Feedback',
        icon: Package2,
        color: 'green',
        status: 'pending',
        stages: [
          {
            id: 'arrival_port',
            name: 'Arrival at Destination Port',
            date: '2025-03-30',
            time: '06:20',
            status: 'completed',
            icon: Anchor,
            details: {
              'Actual Arrival Time': '2025-03-30 06:20',
              'Destination Port': 'Los Angeles Port (USLAX)',
              'Port Code': 'USLAX',
              'Terminal': 'West Basin Container Terminal (WBCT)',
              'Berth Number': 'Berth 206',
              'Vessel Name': 'COSCO GLORY',
              'Voyage Number': 'V.125E',
              'Planned ETA': '2025-03-30 08:00',
              'Updated ETA': '2025-03-30 06:30',
              'Actual ATA': '2025-03-30 06:20',
              'Arrival Variance': '-1 Hour 40 Mins (Earlier)',
              'Advance Notice Sent': '2025-03-16 (14 Days Before)',
              'Customer Notified': 'Yes - Email & SMS Sent',
              'Clearance Reminder Sent': '2025-03-23 (7 Days Before)',
              'Discharge Date': '2025-03-31',
              'Free Time': '5 Days (Until 2025-04-05)',
              'Demurrage After': '2025-04-06',
              'Container Status': 'Ready for Discharge',
              'Customs Status': 'Awaiting Clearance',
              'Action Required': 'Please arrange customs clearance ASAP'
            },
            documents: [
              { name: 'Arrival_Notice.pdf', size: '198 KB', type: 'pdf' },
              { name: 'Discharge_Schedule.pdf', size: '167 KB', type: 'pdf' },
              { name: 'Clearance_Reminder.pdf', size: '134 KB', type: 'pdf' },
              { name: 'Free_Time_Notice.pdf', size: '145 KB', type: 'pdf' }
            ],
            notifications: [
              { date: '2025-03-16', type: 'Arrival Notice', message: 'Your shipment will arrive at Los Angeles Port on 2025-03-30. Please prepare customs clearance documents.' },
              { date: '2025-03-23', type: 'Clearance Reminder', message: 'Reminder: Your shipment arrives in 7 days. Please contact your customs broker.' },
              { date: '2025-03-30', type: 'Arrival Confirmation', message: 'Your shipment has arrived at Los Angeles Port. Free time: 5 days.' }
            ],
            isImportant: true
          },
          {
            id: 'customs_import',
            name: 'Import Customs Clearance',
            date: '2025-03-31',
            time: '14:30',
            status: 'completed',
            icon: FileText,
            details: {
              'Clearance Start Date': '2025-03-31 09:00',
              'Clearance Completion': '2025-03-31 14:30',
              'Processing Time': '5.5 Hours',
              'Customs Broker': 'Global Customs Services Inc.',
              'Broker Contact': 'John Smith - +1-310-555-0123',
              'Customs Office': 'US CBP - Los Angeles Seaport',
              'Entry Number': 'CBP-LAX-2025-031567',
              'Entry Type': 'Consumption Entry (Type 01)',
              'HS Code': '6907.21.00 (Ceramic Tiles)',
              'Customs Duty': '$12,450.00',
              'Import VAT': '$8,320.00',
              'Processing Fee': '$485.00',
              'Total Tax Paid': '$21,255.00',
              'Payment Method': 'ACH Transfer',
              'Payment Status': 'Paid - Confirmed',
              'Inspection Required': 'No - Risk Level: Low',
              'Release Status': 'Released',
              'Release Date': '2025-03-31 14:30',
              'Customs Hold': 'None',
              'ISF Filing': 'Completed on 2025-03-20',
              'AMS Filing': 'Completed on 2025-03-20',
              'Documents Submitted': '8 Documents',
              'Duty Drawback Eligible': 'No'
            },
            documents: [
              { name: 'Customs_Entry_Form.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Commercial_Invoice.pdf', size: '198 KB', type: 'pdf' },
              { name: 'Packing_List.pdf', size: '167 KB', type: 'pdf' },
              { name: 'Bill_of_Lading.pdf', size: '189 KB', type: 'pdf' },
              { name: 'Certificate_of_Origin.pdf', size: '145 KB', type: 'pdf' },
              { name: 'Duty_Payment_Receipt.pdf', size: '134 KB', type: 'pdf' },
              { name: 'ISF_Filing_Confirmation.pdf', size: '123 KB', type: 'pdf' },
              { name: 'Customs_Release_Notice.pdf', size: '156 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'customer_pickup',
            name: 'Customer Container Pickup',
            date: '2025-04-01',
            time: '10:45',
            status: 'completed',
            icon: TruckIcon,
            details: {
              'Pickup Date': '2025-04-01 10:45',
              'Pickup Location': 'West Basin Container Terminal (WBCT)',
              'Terminal Address': '500 Pier S Avenue, San Pedro, CA 90731',
              'Gate Number': 'Gate 8',
              'Appointment Number': 'WBCT-040125-1045',
              'Container Number': 'CSNU1234567',
              'Container Size': "40' HC (High Cube)",
              'Container Type': 'Dry Container',
              'Seal Number': 'SN-8856234',
              'Seal Condition': 'Intact - Verified',
              'Gross Weight': '28,450 KG',
              'Tare Weight': '3,850 KG',
              'Net Weight': '24,600 KG',
              'Trucking Company': 'Pacific Drayage Solutions',
              'Driver Name': 'Michael Rodriguez',
              'Driver License': 'CA-DL-M5678901',
              'Truck Number': 'PDX-4521',
              'Chassis Number': 'CH-789456',
              'Equipment Interchange': 'EIR-2025-040145',
              'Damage Inspection': 'No Damage - Clean EIR',
              'Out-Gate Time': '2025-04-01 11:15',
              'Total Gate Time': '30 Minutes',
              'Destination': 'Customer Warehouse - Ontario, CA',
              'Estimated Delivery': '2025-04-01 15:00'
            },
            documents: [
              { name: 'EIR_Equipment_Interchange.pdf', size: '187 KB', type: 'pdf' },
              { name: 'Gate_Out_Receipt.pdf', size: '156 KB', type: 'pdf' },
              { name: 'Container_Inspection_Report.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Delivery_Order.pdf', size: '145 KB', type: 'pdf' },
              { name: 'Trucking_Confirmation.pdf', size: '134 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'container_unpacking',
            name: 'Container Unpacking & Inspection',
            date: '2025-04-01',
            time: '15:30',
            status: 'completed',
            icon: Box,
            details: {
              'Arrival at Warehouse': '2025-04-01 14:45',
              'Unpacking Start': '2025-04-01 15:30',
              'Unpacking Complete': '2025-04-01 18:20',
              'Total Unpacking Time': '2 Hours 50 Minutes',
              'Warehouse Location': 'Ontario Distribution Center',
              'Warehouse Address': '2500 E Warehouse Way, Ontario, CA 91761',
              'Container Number': 'CSNU1234567',
              'Seal Number': 'SN-8856234',
              'Seal Status': 'Intact Upon Arrival',
              'Container Condition': 'Excellent - No External Damage',
              'Total Cartons': '820 Cartons',
              'Total Pallets': '20 Pallets',
              'Gross Weight': '24,600 KG',
              'Cubic Meters': '67.2 CBM',
              'Damaged Cartons': '3 Cartons (0.37%)',
              'Damaged Items': 'Corner damage on 3 boxes',
              'Missing Items': 'None',
              'Excess Items': 'None',
              'Quality Check': 'Random Sample - 5% Inspected',
              'Samples Inspected': '41 Cartons',
              'Quality Result': 'Pass - 98.5% Acceptance Rate',
              'Product Condition': 'Excellent',
              'Packaging Condition': 'Good - Minor wear on 3 cartons',
              'Documentation Match': '100% Match with Packing List',
              'Photos Taken': '47 Photos',
              'Video Documentation': '15 Minutes Video',
              'Inspector Name': 'Sarah Johnson',
              'Supervisor': 'David Chen',
              'Container Return': 'Scheduled for 2025-04-02'
            },
            documents: [
              { name: 'Unpacking_Report.pdf', size: '298 KB', type: 'pdf' },
              { name: 'Quality_Inspection_Report.pdf', size: '267 KB', type: 'pdf' },
              { name: 'Damage_Report.pdf', size: '189 KB', type: 'pdf' },
              { name: 'Packing_List_Verification.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Warehouse_Receipt.pdf', size: '156 KB', type: 'pdf' },
              { name: 'Photo_Documentation.pdf', size: '3.2 MB', type: 'pdf' }
            ],
            images: [
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
              'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800',
              'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800'
            ],
            isImportant: true
          },
          {
            id: 'goods_received',
            name: 'Goods Received Confirmation',
            date: '2025-04-02',
            time: '10:00',
            status: 'completed',
            icon: CheckCircle2,
            details: {
              'Receipt Date': '2025-04-02 10:00',
              'Confirmed By': 'Robert Williams - Warehouse Manager',
              'Email': 'robert.williams@customer.com',
              'Phone': '+1-909-555-0187',
              'Order Number': 'PO-2025-001234',
              'Total Cartons Ordered': '820 Cartons',
              'Total Cartons Received': '820 Cartons',
              'Matching Rate': '100%',
              'Product Code': 'CT-CERAMIC-40X40-GL',
              'Product Name': 'Glazed Ceramic Floor Tiles 40x40cm',
              'Quantity Ordered': '32,800 SQM',
              'Quantity Received': '32,800 SQM',
              'Unit Price': '$8.50/SQM',
              'Total Value': '$278,800.00',
              'Good Condition Items': '32,680 SQM (99.63%)',
              'Damaged Items': '120 SQM (0.37%)',
              'Damage Claim': '$1,020.00',
              'Claim Status': 'Filed - Under Review',
              'Overall Condition': 'Excellent',
              'Quality Rating': '5/5 Stars',
              'Packaging Rating': '5/5 Stars',
              'Delivery Time Rating': '5/5 Stars',
              'Supplier Rating': '5/5 Stars',
              'Would Reorder': 'Yes - Highly Recommended',
              'Storage Location': 'Warehouse Zone A - Racks 1-20',
              'Inventory Status': 'Added to System',
              'SKU Assignment': 'Complete',
              'Barcode Scanning': 'Complete - 100%',
              'Insurance Claim': 'Required for Damaged Items',
              'Final Acceptance': 'Accepted with Minor Exceptions'
            },
            documents: [
              { name: 'Goods_Receipt_Note.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Final_Inspection_Report.pdf', size: '298 KB', type: 'pdf' },
              { name: 'Damage_Claim_Form.pdf', size: '189 KB', type: 'pdf' },
              { name: 'Acceptance_Certificate.pdf', size: '167 KB', type: 'pdf' },
              { name: 'Inventory_Update_Report.pdf', size: '145 KB', type: 'pdf' },
              { name: 'Quality_Rating_Form.pdf', size: '134 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'customer_feedback',
            name: 'Customer Product Feedback',
            date: '2025-04-15',
            time: '16:30',
            status: 'completed',
            icon: MessageSquare,
            details: {
              'Feedback Date': '2025-04-15 16:30',
              'Feedback By': 'Robert Williams - Warehouse Manager',
              'Company': 'BuildPro Distribution LLC',
              'Customer Type': 'Distributor - Tier 1',
              'Overall Satisfaction': '5/5 Stars - Excellent',
              'Product Quality': '5/5 Stars',
              'Product Appearance': '5/5 Stars',
              'Product Dimensions': '5/5 Stars - Accurate',
              'Product Weight': 'As Expected',
              'Color Consistency': '5/5 Stars - Perfect Match',
              'Surface Finish': '5/5 Stars - High Gloss',
              'Packaging Quality': '5/5 Stars',
              'Packaging Protection': 'Excellent - Minimal Damage',
              'Carton Strength': 'Very Good',
              'Inner Packing': 'Well Protected',
              'Labeling Accuracy': '100% Correct',
              'Documentation': '5/5 Stars - Complete & Clear',
              'Product Specification': 'Match Exactly as Ordered',
              'Sample Comparison': 'Identical to Approved Sample',
              'Delivery Timeline': '5/5 Stars - On Time',
              'Communication': '5/5 Stars - Responsive',
              'Service Quality': '5/5 Stars',
              'Technical Support': 'Very Helpful',
              'After-Sales Service': 'Excellent',
              'Price Competitiveness': '4/5 Stars - Fair',
              'Value for Money': '5/5 Stars',
              'Reorder Intention': 'Yes - Next Order in Planning',
              'Recommended to Others': 'Yes - Highly Recommended',
              'Improvement Suggestions': 'Consider eco-friendly packaging options',
              'Additional Comments': 'Excellent product quality and service. Very satisfied with this shipment.'
            },
            documents: [
              { name: 'Customer_Feedback_Form.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Product_Rating_Report.pdf', size: '198 KB', type: 'pdf' },
              { name: 'Quality_Survey_Results.pdf', size: '167 KB', type: 'pdf' }
            ],
            isImportant: true
          },
          {
            id: 'market_feedback',
            name: 'Market & Consumer Feedback',
            date: '2025-04-30',
            time: '14:00',
            status: 'completed',
            icon: Users,
            details: {
              'Report Date': '2025-04-30 14:00',
              'Report Period': '30 Days (Apr 1 - Apr 30)',
              'Report By': 'BuildPro Distribution LLC',
              'Market Region': 'North America - West Coast',
              'Total Units Sold': '28,500 SQM (86.9% of shipment)',
              'Remaining Stock': '4,300 SQM (13.1%)',
              'Sales Performance': 'Excellent - Above Expectations',
              'Sales Growth': '+23% vs Previous Month',
              'Inventory Turnover': '87% in 30 Days',
              'Average Daily Sales': '950 SQM/Day',
              'Peak Sales Day': 'Apr 18 - 1,850 SQM',
              'Customer Demographics': 'Contractors (65%), Retailers (25%), DIY (10%)',
              'Top Buyer Segment': 'Commercial Contractors',
              'Geographic Distribution': 'CA (45%), NV (20%), AZ (18%), OR (12%), WA (5%)',
              'Consumer Rating': '4.8/5 Stars (Based on 127 Reviews)',
              '5 Star Reviews': '89 (70%)',
              '4 Star Reviews': '31 (24%)',
              '3 Star Reviews': '5 (4%)',
              '2 Star Reviews': '2 (2%)',
              '1 Star Reviews': '0 (0%)',
              'Positive Feedback': 'Excellent quality, Beautiful finish, Great value',
              'Most Liked Feature': 'High gloss finish and durability',
              'Common Complaints': 'Packaging could be more eco-friendly (3 mentions)',
              'Return Rate': '0.5% (Very Low)',
              'Warranty Claims': '1 Claim (0.3%)',
              'Repeat Customer Rate': '45%',
              'Customer Referrals': '23 New Customers from Referrals',
              'Price Point': 'Mid-Range - Competitive',
              'Market Price': '$12.50 - $14.00/SQM Retail',
              'Competitor Comparison': 'Better Quality at Similar Price',
              'Market Demand': 'High - Growing',
              'Future Order Intention': 'Confirmed - Next Order 60,000 SQM',
              'Reorder Status': 'Purchase Order Submitted',
              'Market Trend': 'Increasing demand for glazed ceramic tiles',
              'Seasonality': 'Strong Q2 Performance Expected'
            },
            documents: [
              { name: 'Market_Performance_Report.pdf', size: '345 KB', type: 'pdf' },
              { name: 'Sales_Analysis_30Days.pdf', size: '298 KB', type: 'pdf' },
              { name: 'Consumer_Review_Summary.pdf', size: '267 KB', type: 'pdf' },
              { name: 'Competitor_Analysis.pdf', size: '234 KB', type: 'pdf' },
              { name: 'Reorder_Purchase_Order.pdf', size: '189 KB', type: 'pdf' }
            ],
            isImportant: true
          }
        ]
      }
    ]
  },
  {
    id: 'PO-2025-002',
    inquiryDate: '2025-01-05',
    orderDate: '2025-01-25',
    productName: 'Ceramic Floor Tiles + Wall Tiles',
    totalItems: 15000,
    totalValue: 121500.00,
    currentPhaseIndex: 3,
    currentStageId: 'qc_inspection',
    overallProgress: 65,
    estimatedArrival: '2025-04-10',
    phases: [
      {
        id: 'inquiry',
        name: 'Inquiry',
        icon: MessageSquare,
        color: 'purple',
        status: 'completed',
        stages: [
          {
            id: 'inquiry_submitted',
            name: 'Customer Inquiry',
            date: '2025-01-05',
            time: '10:15',
            status: 'completed',
            icon: MessageSquare,
            isImportant: false
          },
          {
            id: 'quotation_sent',
            name: 'Quotation Received',
            date: '2025-01-07',
            time: '14:30',
            status: 'completed',
            icon: FileText,
            details: {
              'Quotation Number': 'QT-2025-001567',
              'Received From': 'COSUN - Fujian Gaoshengda Fuji Building Materials',
              'Total Amount': '$320,450.00 USD',
              'Total Quantity': '45,000 SQM',
              'Valid Until': 'March 15, 2025',
              'Delivery Terms': 'FOB Xiamen'
            },
            quotationItems: [
              {
                item: 1,
                productName: 'Ceramic Floor Tiles',
                model: 'GSD-FL-600',
                specifications: '600x600mm, 10mm, Grey, Polished',
                quantity: '30,000 SQM',
                unitPrice: '$8.50',
                totalAmount: '$255,000.00'
              },
              {
                item: 2,
                productName: 'Wall Tiles Premium',
                model: 'GSD-WL-300',
                specifications: '300x300mm, 7mm, Cream, Glossy',
                quantity: '15,000 SQM',
                unitPrice: '$4.30',
                totalAmount: '$64,500.00'
              }
            ],
            documents: [
              { name: 'Quotation_Form.pdf', size: '198 KB', type: 'pdf' }
            ],
            isImportant: false
          }
        ]
      },
      {
        id: 'contract',
        name: 'Order & Payment',
        icon: FileCheck,
        color: 'blue',
        status: 'completed',
        stages: [
          {
            id: 'po_received',
            name: 'PO Received',
            date: '2025-01-25',
            time: '11:20',
            status: 'completed',
            icon: FileCheck,
            isImportant: true
          },
          {
            id: 'deposit_requested',
            name: 'Deposit Invoice',
            date: '2025-01-26',
            time: '09:00',
            status: 'completed',
            icon: CreditCard,
            isImportant: false
          },
          {
            id: 'deposit_received',
            name: 'Deposit Received',
            date: '2025-01-28',
            time: '15:30',
            status: 'completed',
            icon: Banknote,
            isImportant: true
          }
        ]
      },
      {
        id: 'production',
        name: 'Production',
        icon: Factory,
        color: 'orange',
        status: 'completed',
        stages: [
          {
            id: 'cosun_po_issued',
            name: 'COSUN PO to Factory',
            date: '2025-01-29',
            time: '10:00',
            status: 'completed',
            icon: Building2,
            isImportant: true
          },
          {
            id: 'production_completed',
            name: 'Production Completed',
            date: '2025-03-01',
            time: '16:00',
            status: 'completed',
            icon: CheckCircle2,
            isImportant: true
          }
        ]
      },
      {
        id: 'quality',
        name: 'Quality Control',
        icon: ClipboardCheck,
        color: 'yellow',
        status: 'in_progress',
        stages: [
          {
            id: 'qc_scheduled',
            name: 'QC Scheduled',
            date: '2025-03-02',
            time: '11:00',
            status: 'completed',
            icon: Calendar,
            isImportant: false
          },
          {
            id: 'qc_inspection',
            name: 'QC Inspection',
            date: '2025-03-06',
            time: '09:00',
            status: 'in_progress',
            icon: ClipboardCheck,
            isImportant: true
          }
        ]
      }
    ]
  }
];

export function OrderTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [showDamageClaimForm, setShowDamageClaimForm] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [showPurchaseOrderForm, setShowPurchaseOrderForm] = useState(false);
  const [showQCScheduleForm, setShowQCScheduleForm] = useState(false);
  const [showQCInspectionReport, setShowQCInspectionReport] = useState(false);
  const [showQCResultReport, setShowQCResultReport] = useState(false);
  const [showFreightInquiryForm, setShowFreightInquiryForm] = useState(false);
  const [showFreightConfirmationForm, setShowFreightConfirmationForm] = useState(false);
  const [showBookingConfirmationForm, setShowBookingConfirmationForm] = useState(false);

  const toggleStageExpansion = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const getPhaseColor = (color: string, variant: 'bg' | 'text' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
      yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-500' },
      green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' }
    };
    return colors[color]?.[variant] || colors.blue[variant];
  };

  // 🔥 清空mock数据 - 使用空数组
  const filteredOrders: any[] = [];

  const openImageViewer = (images: string[], startIndex: number = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
    setIsImageViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
        <p className="text-gray-600 mt-1">Complete lifecycle tracking from inquiry to customer</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <MessageSquare className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-600">8</p>
              <p className="text-xs text-gray-600">Inquiry</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <FileCheck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-600">12</p>
              <p className="text-xs text-gray-600">Contract</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <Factory className="h-5 w-5 text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-600">5</p>
              <p className="text-xs text-gray-600">Production</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <ClipboardCheck className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-600">3</p>
              <p className="text-xs text-gray-600">QC</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <Ship className="h-5 w-5 text-cyan-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-cyan-600">12</p>
              <p className="text-xs text-gray-600">Shipping</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-600">28</p>
              <p className="text-xs text-gray-600">Delivered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by PO number or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>PO Number</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Inquiry Date</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Order Date</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Product</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Quantity</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Value</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Progress</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>ETA</TableHead>
                  <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailOpen(true);
                          // Start with all stages collapsed
                          setExpandedStages(new Set());
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        {order.id}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">{order.inquiryDate}</TableCell>
                    <TableCell className="text-xs text-gray-700">{order.orderDate}</TableCell>
                    <TableCell className="text-xs font-medium text-gray-900 max-w-xs truncate">
                      {order.productName}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">{order.totalItems.toLocaleString()} pcs</TableCell>
                    <TableCell className="text-xs font-medium text-gray-900">${order.totalValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Progress value={order.overallProgress} className="w-20 h-2" />
                        <span className="text-xs font-medium text-gray-700">{order.overallProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">{order.estimatedArrival}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                            // Start with all stages collapsed
                            setExpandedStages(new Set());
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">Order: {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Complete order lifecycle from inquiry to customer
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 px-2">
              {/* Order Summary */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Inquiry Date</p>
                    <p className="font-bold text-gray-900">{selectedOrder.inquiryDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Order Date</p>
                    <p className="font-bold text-gray-900">{selectedOrder.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Items</p>
                    <p className="font-bold text-gray-900">{selectedOrder.totalItems.toLocaleString()} pcs</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Value</p>
                    <p className="font-bold text-gray-900">${selectedOrder.totalValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Est. Arrival</p>
                    <p className="font-bold text-gray-900">{selectedOrder.estimatedArrival}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Overall Progress</p>
                    <p className="text-sm font-bold text-red-600">{selectedOrder.overallProgress}%</p>
                  </div>
                  <Progress value={selectedOrder.overallProgress} className="h-2" />
                </div>
              </div>

              {/* Horizontal Phase Stepper */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  {selectedOrder.phases.map((phase: any, index: number) => {
                    const PhaseIcon = phase.icon;
                    const isActive = index === selectedOrder.currentPhaseIndex;
                    const isCompleted = phase.status === 'completed';
                    const isInProgress = phase.status === 'in_progress';
                    
                    return (
                      <div key={phase.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                            isCompleted ? getPhaseColor(phase.color, 'bg') + ' shadow-lg' :
                            isInProgress ? getPhaseColor(phase.color, 'bg') + ' shadow-lg animate-pulse' :
                            'bg-gray-200'
                          }`}>
                            <PhaseIcon className={`h-6 w-6 ${
                              isCompleted || isInProgress ? 'text-white' : 'text-gray-400'
                            }`} />
                          </div>
                          <p className={`text-xs font-medium text-center ${
                            isCompleted || isInProgress ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {phase.name}
                          </p>
                          {isCompleted && (
                            <Badge className="mt-1 bg-green-500 text-xs">Done</Badge>
                          )}
                          {isInProgress && (
                            <Badge className="mt-1 bg-blue-500 text-xs animate-pulse">Active</Badge>
                          )}
                        </div>
                        {index < selectedOrder.phases.length - 1 && (
                          <div className={`h-1 flex-1 mx-2 mb-8 rounded ${
                            isCompleted ? getPhaseColor(phase.color, 'bg') : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  Detailed Timeline
                </h3>

                <div className="relative">
                  {/* Table Layout */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {selectedOrder.phases.map((phase: any, phaseIndex: number) => {
                      // Calculate global stage number
                      let globalStageNumber = 0;
                      for (let i = 0; i < phaseIndex; i++) {
                        globalStageNumber += selectedOrder.phases[i].stages.length;
                      }
                      
                      return (
                        <React.Fragment key={phase.id}>
                          {phase.stages.map((stage: any, stageIndex: number) => {
                            const currentStageNumber = globalStageNumber + stageIndex + 1;
                            const StageIcon = stage.icon;
                            const isExpanded = expandedStages.has(stage.id);
                            const hasExpandableContent = stage.details || stage.factoryDistribution || 
                                                        stage.progressDetails || stage.images || stage.documents || stage.notifications;
                            const showExpandToggle = hasExpandableContent && stage.status !== 'pending';
                            
                            return (
                              <React.Fragment key={stage.id}>
                                {/* Main Row */}
                                <tr 
                                  className={`border-t border-gray-200 ${
                                    showExpandToggle ? 'cursor-pointer hover:bg-gray-50' : ''
                                  } ${stage.status === 'in_progress' ? 'bg-blue-50' : ''}`}
                                  onClick={() => showExpandToggle && toggleStageExpansion(stage.id)}
                                >
                                  {/* Number Column */}
                                  <td className="w-16 p-3 text-center align-middle">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                                      stage.status === 'completed' ? 'bg-green-500 shadow-md' :
                                      stage.status === 'in_progress' ? 'bg-blue-500 shadow-lg animate-pulse' :
                                      'bg-gray-300'
                                    }`}>
                                      <span className="text-white font-bold text-sm">
                                        {currentStageNumber}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Name Column */}
                                  <td className="p-3 align-middle">
                                    <div className="flex items-center gap-2">
                                      {showExpandToggle && (
                                        <div className="flex items-center">
                                          {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-red-600" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4 text-red-600" />
                                          )}
                                        </div>
                                      )}
                                      <h4 className={stage.status === 'pending' ? 'text-xs font-bold text-gray-500' : 'text-xs font-bold text-gray-900'}>
                                        {stage.name}
                                      </h4>
                                      {stage.isImportant && stage.status !== 'pending' && (
                                        <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                                          Important
                                        </Badge>
                                      )}
                                      {showExpandToggle && (
                                        <span className="text-xs text-gray-500 italic">
                                          ({isExpanded ? 'Click to collapse' : 'Click to expand'})
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Date/Time Column */}
                                  <td className="p-3 text-xs align-middle w-48">
                                    {stage.date && (
                                      <div className="text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {stage.date}
                                        </div>
                                        {stage.time && (
                                          <div className="text-xs text-gray-500 mt-0.5 ml-4">
                                            {stage.time}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* Status Column */}
                                  <td className="p-3 text-right w-32 align-middle">
                                    <Badge className={`text-xs ${
                                      stage.status === 'completed' ? 'bg-green-500' :
                                      stage.status === 'in_progress' ? 'bg-blue-500' :
                                      'bg-gray-400'
                                    }`}>
                                      {stage.status === 'completed' ? '✓ Done' :
                                       stage.status === 'in_progress' ? '⟳ Active' :
                                       '○ Pending'}
                                    </Badge>
                                  </td>
                                </tr>

                                {/* Expandable Content Row */}
                                {isExpanded && hasExpandableContent && (
                                  <tr className={`${stage.status === 'in_progress' ? 'bg-blue-50' : ''}`}>
                                    <td colSpan={4} className="p-0">
                                      <div className="px-16 py-4 bg-gray-50 border-t border-gray-200">
                                        <div className="space-y-3">
                                      {/* Factory Distribution */}
                                      {stage.factoryDistribution && (
                                        <div className="bg-white rounded overflow-hidden border border-gray-200">
                                          <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                              <Factory className="h-3 w-3" />
                                              Factory Distribution
                                            </p>
                                          </div>
                                          <table className="w-full text-xs">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="text-left p-2 border-b border-gray-200">Factory Name</th>
                                                <th className="text-left p-2 border-b border-gray-200">Location</th>
                                                <th className="text-right p-2 border-b border-gray-200">Quantity</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {stage.factoryDistribution.map((factory: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                  <td className="p-2 border-b border-gray-100">
                                                    <div className="flex items-center gap-1">
                                                      <MapPin className="h-3 w-3 text-gray-500" />
                                                      <span className="font-medium">{factory.name}</span>
                                                    </div>
                                                  </td>
                                                  <td className="p-2 border-b border-gray-100 text-gray-600">{factory.location}</td>
                                                  <td className="p-2 border-b border-gray-100 text-right font-bold text-blue-600">{factory.quantity.toLocaleString()} pcs</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      {/* Details */}
                                      {stage.details && (
                                        <div className="space-y-3">
                                          {/* Details Table */}
                                          <div className="bg-white rounded overflow-hidden border border-gray-200">
                                            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                                              <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Details
                                              </p>
                                            </div>
                                            <table className="w-full text-xs table-fixed">
                                              <thead className="bg-gray-50">
                                                <tr>
                                                  {Object.keys(stage.details).map((key: string) => (
                                                    <th key={key} className="p-2 border-b border-r border-gray-200 text-left text-gray-600">
                                                      {key}
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                <tr className="hover:bg-gray-50">
                                                  {Object.values(stage.details).map((value: any, idx: number) => (
                                                    <td key={idx} className="p-2 border-b border-r border-gray-100 font-medium text-gray-900 break-words">
                                                      {value}
                                                    </td>
                                                  ))}
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>

                                          {/* Quotation Items Table */}
                                          {stage.quotationItems && stage.quotationItems.length > 0 && (
                                            <div className="bg-white rounded overflow-hidden border border-gray-200">
                                              <div className="bg-red-600 text-white px-3 py-2 border-b border-red-700">
                                                <p className="text-xs font-bold flex items-center gap-1">
                                                  <Package className="h-3 w-3" />
                                                  Quotation Items from COSUN
                                                </p>
                                              </div>
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                  <thead className="bg-gray-50">
                                                    <tr>
                                                      <th className="p-2 border-b border-r border-gray-200 text-center text-gray-600 whitespace-nowrap">Item</th>
                                                      <th className="p-2 border-b border-r border-gray-200 text-left text-gray-600 whitespace-nowrap">Model</th>
                                                      <th className="p-2 border-b border-r border-gray-200 text-left text-gray-600 whitespace-nowrap">Product Name</th>
                                                      <th className="p-2 border-b border-r border-gray-200 text-left text-gray-600 whitespace-nowrap">Specifications</th>
                                                      <th className="p-2 border-b border-r border-gray-200 text-right text-gray-600 whitespace-nowrap">Quantity</th>
                                                      <th className="p-2 border-b border-r border-gray-200 text-right text-gray-600 whitespace-nowrap">Unit Price (FOB)</th>
                                                      <th className="p-2 border-b border-gray-200 text-right text-gray-600 whitespace-nowrap">Total Amount</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {stage.quotationItems.map((item: any, idx: number) => (
                                                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                                                        <td className="p-2 border-b border-r border-gray-100 text-center font-medium text-gray-900">{item.item}</td>
                                                        <td className="p-2 border-b border-r border-gray-100 text-gray-700 font-mono text-xs">{item.model}</td>
                                                        <td className="p-2 border-b border-r border-gray-100 font-medium text-gray-900">{item.productName}</td>
                                                        <td className="p-2 border-b border-r border-gray-100 text-gray-600 text-xs">{item.specifications}</td>
                                                        <td className="p-2 border-b border-r border-gray-100 text-right font-medium text-blue-600">{item.quantity}</td>
                                                        <td className="p-2 border-b border-r border-gray-100 text-right font-medium text-gray-900">{item.unitPrice}</td>
                                                        <td className="p-2 border-b border-gray-100 text-right font-bold text-green-600">{item.totalAmount}</td>
                                                      </tr>
                                                    ))}
                                                    <tr className="bg-red-50 border-t-2 border-red-600">
                                                      <td colSpan={6} className="p-2 border-r border-gray-200 text-right font-bold text-gray-900">SUBTOTAL (FOB):</td>
                                                      <td className="p-2 text-right font-bold text-red-600 text-sm">$485,290.00</td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}

                                          {/* Documents Table */}
                                          {stage.documents && stage.documents.length > 0 && (
                                            <div className="bg-white rounded overflow-hidden border border-gray-200">
                                              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                                                <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                                  <FileText className="h-3 w-3" />
                                                  Documents
                                                </p>
                                              </div>
                                              <table className="w-full text-xs table-fixed">
                                                <thead className="bg-gray-50">
                                                  <tr>
                                                    {stage.documents.map((doc: any, idx: number) => (
                                                      <th key={`doc-${idx}`} className="p-2 border-b border-r border-gray-200 text-left text-gray-600">
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                          {doc.name === 'QC_Photos.zip' ? (
                                                            <Camera className="h-3 w-3 text-red-600 flex-shrink-0" />
                                                          ) : (
                                                            <File className="h-3 w-3 text-red-600 flex-shrink-0" />
                                                          )}
                                                          <span className="break-words">{doc.name}</span>
                                                        </div>
                                                      </th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  <tr className="hover:bg-gray-50">
                                                    {stage.documents.map((doc: any, idx: number) => (
                                                      <td key={`doc-val-${idx}`} className="p-2 border-b border-r border-gray-100">
                                                        <div className="flex flex-col gap-1">
                                                          <span className="text-gray-500 text-xs">{doc.size}</span>
                                                          <div className="flex items-center gap-1 flex-wrap">
                                                            {doc.name === 'QC_Photos.zip' && stage.qcPhotos && (
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-xs"
                                                                onClick={() => openImageViewer(stage.qcPhotos, 0)}
                                                              >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                              </Button>
                                                            )}
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-6 w-6 p-0"
                                                              onClick={() => {
                                                                if (doc.name === 'Damage_Claim_Form.pdf') {
                                                                  setShowDamageClaimForm(true);
                                                                } else if (doc.name === 'Inquiry_Form.pdf') {
                                                                  setShowInquiryForm(true);
                                                                } else if (doc.name === 'Quotation_Form.pdf') {
                                                                  setShowQuotationForm(true);
                                                                } else if (doc.name === 'Purchase_Order.pdf') {
                                                                  setShowPurchaseOrderForm(true);
                                                                } else if (doc.name === 'QC_Schedule_Confirmation.pdf') {
                                                                  setShowQCScheduleForm(true);
                                                                } else if (doc.name === 'QC_Inspection_Report.pdf') {
                                                                  setShowQCInspectionReport(true);
                                                                } else if (doc.name === 'QC_Report_PO-2025-001.pdf') {
                                                                  setShowQCResultReport(true);
                                                                } else if (doc.name === 'Freight_Inquiry.pdf') {
                                                                  setShowFreightInquiryForm(true);
                                                                } else if (doc.name === 'Freight_Confirmation.pdf') {
                                                                  setShowFreightConfirmationForm(true);
                                                                } else if (doc.name === 'Booking_Confirmation.pdf') {
                                                                  setShowBookingConfirmationForm(true);
                                                                } else {
                                                                  toast.success('Document downloaded');
                                                                }
                                                              }}
                                                            >
                                                              <Download className="h-3 w-3" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      </td>
                                                    ))}
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Progress Details */}
                                      {stage.progressDetails && (
                                        <div className="bg-white rounded overflow-hidden border border-gray-200">
                                          <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                              <Factory className="h-3 w-3" />
                                              Production Progress
                                            </p>
                                          </div>
                                          <table className="w-full text-xs">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="text-left p-2 border-b border-gray-200">Factory</th>
                                                <th className="text-center p-2 border-b border-gray-200">Progress</th>
                                                <th className="text-right p-2 border-b border-gray-200">Quantity</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {stage.progressDetails.map((detail: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                  <td className="p-2 border-b border-gray-100 font-medium">{detail.factory}</td>
                                                  <td className="p-2 border-b border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                      <Progress value={detail.progress} className="h-1.5 flex-1" />
                                                      <span className="font-bold text-blue-600 min-w-[35px] text-right">{detail.progress}%</span>
                                                    </div>
                                                  </td>
                                                  <td className="p-2 border-b border-gray-100 text-right text-gray-600">
                                                    {detail.completed.toLocaleString()} / {detail.total.toLocaleString()} pcs
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      {/* Images */}
                                      {stage.images && stage.images.length > 0 && (
                                        <div>
                                          <p className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1">
                                            <Camera className="h-3 w-3" />
                                            Photos ({stage.images.length})
                                          </p>
                                          <div className="grid grid-cols-6 gap-2">
                                            {stage.images.map((img: string, idx: number) => (
                                              <button
                                                key={idx}
                                                onClick={() => openImageViewer(stage.images, idx)}
                                                className="relative aspect-square rounded overflow-hidden border-2 border-gray-200 hover:border-red-500 transition-all group"
                                              >
                                                <ImageWithFallback
                                                  src={img}
                                                  alt={`Photo ${idx + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                                  <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Documents - Now integrated into Details table above */}

                                      {/* Notifications */}
                                      {stage.notifications && stage.notifications.length > 0 && (
                                        <div className="bg-white rounded overflow-hidden border border-gray-200">
                                          <div className="bg-blue-100 px-3 py-2 border-b border-blue-200">
                                            <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                                              <Bell className="h-3 w-3" />
                                              Customer Notifications ({stage.notifications.length})
                                            </p>
                                          </div>
                                          <table className="w-full text-xs">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="text-left p-2 border-b border-gray-200 w-32">Type</th>
                                                <th className="text-left p-2 border-b border-gray-200">Message</th>
                                                <th className="text-right p-2 border-b border-gray-200 w-28">Date</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {stage.notifications.map((notification: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-blue-50">
                                                  <td className="p-2 border-b border-gray-100">
                                                    <div className="flex items-center gap-1">
                                                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Bell className="h-3 w-3 text-blue-600" />
                                                      </div>
                                                      <span className="font-bold text-blue-900">{notification.type}</span>
                                                    </div>
                                                  </td>
                                                  <td className="p-2 border-b border-gray-100 text-gray-700">{notification.message}</td>
                                                  <td className="p-2 border-b border-gray-100 text-right text-blue-600">{notification.date}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              Photo Viewer ({currentImageIndex + 1} / {selectedImages.length})
            </DialogTitle>
            <DialogDescription>
              View production and quality control photos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {selectedImages[currentImageIndex] && (
                <ImageWithFallback
                  src={selectedImages[currentImageIndex]}
                  alt={`Photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {selectedImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? 'bg-red-600 w-6' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentImageIndex(Math.min(selectedImages.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === selectedImages.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Damage Claim Form Dialog */}
      <Dialog open={showDamageClaimForm} onOpenChange={setShowDamageClaimForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Damage Claim Form</DialogTitle>
            <DialogDescription>Submit a damage claim for your order</DialogDescription>
          </DialogHeader>
          <DamageClaimForm 
            orderNumber={selectedOrder?.orderNumber}
            onClose={() => setShowDamageClaimForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Inquiry Form Dialog */}
      <Dialog open={showInquiryForm} onOpenChange={setShowInquiryForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Inquiry Form</DialogTitle>
            <DialogDescription>View inquiry details</DialogDescription>
          </DialogHeader>
          <InquiryForm 
            inquiryNumber="INQ-2024-1220-045"
            onClose={() => setShowInquiryForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Quotation Form Dialog */}
      <Dialog open={showQuotationForm} onOpenChange={setShowQuotationForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Quotation Form</DialogTitle>
            <DialogDescription>View quotation details</DialogDescription>
          </DialogHeader>
          <QuotationForm 
            quotationNumber="QT-2025-001234"
            inquiryNumber="INQ-2024-1220-045"
            onClose={() => setShowQuotationForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Purchase Order Form Dialog */}
      <Dialog open={showPurchaseOrderForm} onOpenChange={setShowPurchaseOrderForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Purchase Order Form</DialogTitle>
            <DialogDescription>View purchase order details</DialogDescription>
          </DialogHeader>
          <PurchaseOrderForm 
            orderNumber={selectedOrder?.id}
            quotationNumber="QT-2025-001234"
            onClose={() => setShowPurchaseOrderForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QC Schedule Form Dialog */}
      <Dialog open={showQCScheduleForm} onOpenChange={setShowQCScheduleForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>QC Schedule Form</DialogTitle>
            <DialogDescription>View QC schedule details</DialogDescription>
          </DialogHeader>
          <QCScheduleForm 
            scheduleNumber="QCS-2025-0224"
            orderNumber={selectedOrder?.id}
            onClose={() => setShowQCScheduleForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QC Inspection Report Dialog */}
      <Dialog open={showQCInspectionReport} onOpenChange={setShowQCInspectionReport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>QC Inspection Report</DialogTitle>
            <DialogDescription>View QC inspection report details</DialogDescription>
          </DialogHeader>
          <QCInspectionReport 
            reportNumber="QCR-2025-0228"
            orderNumber={selectedOrder?.id}
            onClose={() => setShowQCInspectionReport(false)}
          />
        </DialogContent>
      </Dialog>

      {/* QC Result Report Dialog */}
      <Dialog open={showQCResultReport} onOpenChange={setShowQCResultReport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>QC Result Report</DialogTitle>
            <DialogDescription>View QC result report details</DialogDescription>
          </DialogHeader>
          <QCResultReport 
            reportNumber="QCR-2025-0228"
            orderNumber={selectedOrder?.id}
            onClose={() => setShowQCResultReport(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Freight Inquiry Form Dialog */}
      <Dialog open={showFreightInquiryForm} onOpenChange={setShowFreightInquiryForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Freight Inquiry Form</DialogTitle>
            <DialogDescription>View freight inquiry details</DialogDescription>
          </DialogHeader>
          <FreightInquiryForm 
            inquiryNumber="FI-2025-0301"
            orderNumber={selectedOrder?.id}
            onClose={() => setShowFreightInquiryForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Freight Confirmation Form Dialog */}
      <Dialog open={showFreightConfirmationForm} onOpenChange={setShowFreightConfirmationForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Freight Confirmation Form</DialogTitle>
            <DialogDescription>View freight confirmation details</DialogDescription>
          </DialogHeader>
          <FreightConfirmationForm 
            confirmationNumber="FC-2025-0302"
            inquiryNumber="FI-2025-0301"
            onClose={() => setShowFreightConfirmationForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Form Dialog */}
      <Dialog open={showBookingConfirmationForm} onOpenChange={setShowBookingConfirmationForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Booking Confirmation Form</DialogTitle>
            <DialogDescription>View booking confirmation details</DialogDescription>
          </DialogHeader>
          <BookingConfirmationForm 
            bookingNumber="COSN-BK-2025-0303-789"
            orderNumber={selectedOrder?.id}
            onClose={() => setShowBookingConfirmationForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
