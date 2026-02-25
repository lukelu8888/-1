import { TrackingListTable } from '../components/TrackingListTable';
import { TrackingSummaryCards } from '../components/TrackingSummaryCards';
import { useTrackingOverview } from '../hooks/useTrackingOverview';

export function TrackingPage() {
  const overview = useTrackingOverview();

  return (
    <div className="space-y-4">
      <TrackingSummaryCards items={overview.summary} />
      <TrackingListTable rows={overview.records} />
    </div>
  );
}
