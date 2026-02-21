import { useRegion, getRegionName, getCountryFlag } from '../contexts/RegionContext';
import { MapPin } from 'lucide-react';

export function RegionBadge() {
  const { region, locationInfo } = useRegion();

  if (!region) return null;

  // Display city if available, otherwise show region
  const displayText = locationInfo?.city 
    ? locationInfo.city 
    : getRegionName(region);
  
  const flag = locationInfo?.countryCode
    ? getCountryFlag(locationInfo.countryCode)
    : null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-gray-700">
      <MapPin className="w-3.5 h-3.5 text-red-600" />
      <span className="flex items-center gap-1">
        {flag && <span className="text-sm">{flag}</span>}
        <span className="text-sm">{displayText}</span>
      </span>
    </div>
  );
}