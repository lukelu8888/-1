import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Region = 'north-america' | 'south-america' | 'europe-africa' | null;

interface LocationInfo {
  city: string;
  country: string;
  countryCode: string;
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

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(null);
  const [detectedRegion, setDetectedRegion] = useState<Region | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingRegion, setIsChangingRegion] = useState(false);

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

  // Detect user's region based on IP
  const detectRegion = async () => {
    try {
      const response = await fetch('https://ip-api.com/json/?fields=status,country,countryCode,continent,continentCode,city');
      const data = await response.json();
      
      if (data.status === 'success' && data.countryCode && data.continentCode) {
        const detected = mapToRegion(data.countryCode, data.continentCode);
        setDetectedRegion(detected);
        setLocationInfo({
          city: data.city,
          country: data.country,
          countryCode: data.countryCode,
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
      // Always detect location for displaying city info
      const detected = await detectRegion();
      
      // Check if user has previously selected a region
      const savedRegion = localStorage.getItem('cosun-region') as Region;
      
      if (savedRegion) {
        // Returning user with saved preference
        setRegionState(savedRegion);
        setIsFirstVisit(false);
        setIsLoading(false);
      } else {
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
          localStorage.setItem('cosun-region', newRegion);
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
        localStorage.setItem('cosun-region', newRegion);
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