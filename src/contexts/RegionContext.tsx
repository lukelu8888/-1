import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isCurrentLocalDevHost } from '../lib/localDevHost';

export type Region = 'north-america' | 'south-america' | 'europe-africa' | null;

const REGION_STORAGE_KEY = 'cosun-region';
const LOCATION_STORAGE_KEY = 'cosun-location-info';

interface LocationInfo {
  city: string;
  country: string;
  countryCode: string;
}

interface ReverseGeocodeResult {
  city: string;
  country: string;
  countryCode: string;
  continentCode: string;
}

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  detectedRegion: Region | null;
  locationInfo: LocationInfo | null;
  isFirstVisit: boolean;
  showRegionSelector: boolean;
  setShowRegionSelector: (show: boolean) => void;
  isChangingRegion: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

function isLocalDevHost() {
  return isCurrentLocalDevHost();
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(null);
  const [detectedRegion, setDetectedRegion] = useState<Region | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingRegion, setIsChangingRegion] = useState(false);

  const persistLocationInfo = (nextLocationInfo: LocationInfo) => {
    setLocationInfo(nextLocationInfo);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLocationInfo));
    }
  };

  // Map country/continent to our three regions
  const mapToRegion = (countryCode: string, continentCode: string): Region => {
    // North America
    if (['US', 'CA', 'MX'].includes(countryCode)) {
      return 'north-america';
    }
    
    // South America
    if (continentCode === 'SA' || ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF'].includes(countryCode)) {
      return 'south-america';
    }
    
    // Europe & Africa (default for EU, AF continents)
    if (continentCode === 'EU' || continentCode === 'AF') {
      return 'europe-africa';
    }
    
    // For other regions (Asia, Oceania), default to Europe & Africa
    // You can adjust this based on your business logic
    return 'europe-africa';
  };

  const detectLocationByGeolocation = async (): Promise<Region | null> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 1000 * 60 * 60,
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as Partial<ReverseGeocodeResult> & {
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
        countryCode?: string;
        continent?: string;
        continentCode?: string;
      };

      const city = data.city || data.locality || data.principalSubdivision || '';
      const country = data.country || data.countryName || '';
      const countryCode = data.countryCode || '';
      const continentCode = data.continentCode || '';

      if (!countryCode || !continentCode) {
        return null;
      }

      const detected = mapToRegion(countryCode, continentCode);
      setDetectedRegion(detected);
      persistLocationInfo({
        city,
        country,
        countryCode,
      });
      return detected;
    } catch (error) {
      console.log('Browser geolocation failed, falling back to IP lookup');
      return null;
    }
  };

  // Detect user's region based on IP
  const detectRegion = async () => {
    if (isLocalDevHost()) {
      return null;
    }

    try {
      // ipwho.is: 免费、支持 HTTPS、无需 API key
      const response = await fetch('https://ipwho.is/');
      if (!response.ok) {
        return null;
      }
      const data = await response.json();

      if (data.success && data.country_code && data.continent_code) {
        const detected = mapToRegion(data.country_code, data.continent_code);
        setDetectedRegion(detected);
        persistLocationInfo({
          city: data.city || '',
          country: data.country || '',
          countryCode: data.country_code,
        });
        return detected;
      }
    } catch (error) {
      console.log('IP detection failed, will ask user to select region');
    }
    return null;
  };

  // Initialize region on mount
  useEffect(() => {
    const initRegion = async () => {
      const savedRegion = localStorage.getItem(REGION_STORAGE_KEY) as Region;
      const savedLocationInfo = localStorage.getItem(LOCATION_STORAGE_KEY);

      if (savedLocationInfo) {
        try {
          setLocationInfo(JSON.parse(savedLocationInfo));
        } catch {
          localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      }

      if (savedRegion) {
        // Returning user with saved preference
        setRegionState(savedRegion);
        setIsFirstVisit(false);
        setIsLoading(false);
        return;
      } else {
        if (isLocalDevHost()) {
          // Keep localhost usable during development: do not block the page
          // behind the first-visit region chooser.
          setIsFirstVisit(false);
          setShowRegionSelector(false);
          setIsLoading(false);
          return;
        }

        // Use IP-based detection only when we have no saved preference,
        // so we do not trigger unnecessary third-party requests on every visit.
        await detectRegion();

        // First-time visitor
        setIsFirstVisit(true);
        
        // Show region selector modal
        setShowRegionSelector(true);
        setIsLoading(false);
      }
    };

    initRegion();
  }, []);

  const setRegion = (newRegion: Region) => {
    // Only trigger animation if region is actually changing
    if (newRegion && newRegion !== region) {
      setIsChangingRegion(true);
      
      // Wait for animation to complete before updating region
      setTimeout(() => {
        setRegionState(newRegion);
        if (newRegion) {
          localStorage.setItem(REGION_STORAGE_KEY, newRegion);
        }
        
        // Reset changing state after content updates
        setTimeout(() => {
          setIsChangingRegion(false);
        }, 100);
      }, 300);
    } else {
      // First time setting region (no animation needed)
      setRegionState(newRegion);
      if (newRegion) {
        localStorage.setItem(REGION_STORAGE_KEY, newRegion);
      }
    }
  };

  return (
    <RegionContext.Provider
      value={{
        region,
        setRegion,
        detectedRegion,
        locationInfo,
        isFirstVisit,
        showRegionSelector,
        setShowRegionSelector,
        isChangingRegion,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

// Helper function to get region display name
export function getRegionName(region: Region): string {
  switch (region) {
    case 'north-america':
      return 'North America';
    case 'south-america':
      return 'South America';
    case 'europe-africa':
      return 'Europe & Africa';
    default:
      return 'Select Region';
  }
}

// Helper function to get region flag emoji
export function getRegionFlag(region: Region): string {
  switch (region) {
    case 'north-america':
      return '🇺🇸';
    case 'south-america':
      return '🇧🇷';
    case 'europe-africa':
      return '🇪🇺';
    default:
      return '🌍';
  }
}

// Helper function to get country flag emoji from country code
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Convert country code to flag emoji
  // Each flag emoji is created from regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}
