import type { TrackingSummaryItem } from '../types/tracking';

interface TrackingSummaryCardsProps {
  items: TrackingSummaryItem[];
}

export function TrackingSummaryCards({ items }: TrackingSummaryCardsProps) {
  return (
    <div className="grid grid-cols-9 gap-3">
      {items.map((item) => (
        <div key={item.key} className="border border-gray-200 rounded-xl px-3 py-4 text-center bg-white">
          <div className="text-xl font-bold text-gray-900">{item.count}</div>
          <div className="text-sm text-gray-600 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
