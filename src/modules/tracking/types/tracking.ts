export type TrackingStage =
  | 'inquiry'
  | 'quotation'
  | 'contract'
  | 'production'
  | 'qc'
  | 'shipping'
  | 'delivered'
  | 'order_feedback'
  | 'review';

export interface TrackingSummaryItem {
  key: TrackingStage;
  label: string;
  count: number;
}

export interface TrackingListRecord {
  id: string;
  poNumber: string;
  inquiryDate?: string;
  orderDate?: string;
  productSummary?: string;
  quantity?: number;
  value?: number;
  progress?: string;
  eta?: string;
}
