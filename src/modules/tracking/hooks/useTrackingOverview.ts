import { useMemo } from 'react';
import { getTrackingOverviewPlaceholder } from '../services/trackingRepository';

export function useTrackingOverview() {
  return useMemo(() => getTrackingOverviewPlaceholder(), []);
}
