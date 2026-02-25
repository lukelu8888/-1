import type { TrackingListRecord } from '../types/tracking';

interface TrackingListTableProps {
  rows: TrackingListRecord[];
}

export function TrackingListTable({ rows }: TrackingListTableProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900">Tracking List</div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">PO Number</th>
            <th className="px-4 py-2 text-left">Inquiry Date</th>
            <th className="px-4 py-2 text-left">Order Date</th>
            <th className="px-4 py-2 text-left">Product</th>
            <th className="px-4 py-2 text-left">Quantity</th>
            <th className="px-4 py-2 text-left">Value</th>
            <th className="px-4 py-2 text-left">Progress</th>
            <th className="px-4 py-2 text-left">ETA</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
                No tracking records
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="px-4 py-2">{row.poNumber}</td>
              <td className="px-4 py-2">{row.inquiryDate || '-'}</td>
              <td className="px-4 py-2">{row.orderDate || '-'}</td>
              <td className="px-4 py-2">{row.productSummary || '-'}</td>
              <td className="px-4 py-2">{row.quantity ?? '-'}</td>
              <td className="px-4 py-2">{row.value ?? '-'}</td>
              <td className="px-4 py-2">{row.progress || '-'}</td>
              <td className="px-4 py-2">{row.eta || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
