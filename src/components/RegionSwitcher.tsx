import { useState, useRef, useEffect } from 'react';
import { useRegion, getRegionName, getRegionFlag, Region } from '../contexts/RegionContext';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function RegionSwitcher() {
  const { region, setRegion, setShowRegionSelector } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const regions: { id: Region; name: string; flag: string }[] = [
    { id: 'north-america', name: 'North America', flag: '🇺🇸' },
    { id: 'south-america', name: 'South America', flag: '🇧🇷' },
    { id: 'europe-africa', name: 'Europe & Africa', flag: '🇪🇺' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectRegion = (selectedRegion: Region) => {
    setRegion(selectedRegion);
    setIsOpen(false);
    toast.success(`Region changed to ${getRegionName(selectedRegion)}`);
  };

  const handleOpenSelector = () => {
    setIsOpen(false);
    setShowRegionSelector(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden md:inline">
          {region ? getRegionName(region) : 'Select Region'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select Your Region</p>
          </div>
          
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectRegion(r.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                region === r.id ? 'bg-red-50 text-red-600' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{r.flag}</span>
                <span className={region === r.id ? 'font-medium' : ''}>{r.name}</span>
              </div>
              {region === r.id && <Check className="w-4 h-4" />}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2 px-4 py-2">
            <button
              onClick={handleOpenSelector}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              View detailed region information →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}