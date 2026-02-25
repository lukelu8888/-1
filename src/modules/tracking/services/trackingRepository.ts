import type { TrackingListRecord, TrackingSummaryItem } from '../types/tracking';

export interface TrackingOverviewData {
  summary: TrackingSummaryItem[];
  records: TrackingListRecord[];
}

export function getTrackingOverviewPlaceholder(): TrackingOverviewData {
  return {
    summary: [
      { key: 'inquiry', label: 'Inquiry', count: 0 },
      { key: 'quotation', label: 'Quotation', count: 0 },
      { key: 'contract', label: 'Contract', count: 0 },
      { key: 'production', label: 'Production', count: 0 },
      { key: 'qc', label: 'QC', count: 0 },
      { key: 'shipping', label: 'Shipping', count: 0 },
      { key: 'delivered', label: 'Delivered', count: 0 },
      { key: 'order_feedback', label: 'Order feedback', count: 0 },
      { key: 'review', label: 'Review on Product', count: 0 },
    ],
    records: [],
  };
}
