import { useRegion, getRegionName, getRegionFlag, Region } from '../contexts/RegionContext';
import { X, Check, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

export function RegionSelectorModal() {
  const { region, setRegion, detectedRegion, showRegionSelector, setShowRegionSelector } = useRegion();

  if (!showRegionSelector) return null;

  const regions: { id: Region; name: string; flag: string; countries: string; description: string }[] = [
    {
      id: 'north-america',
      name: 'North America',
      flag: '🇺🇸',
      countries: 'USA, Canada, Mexico',
      description: 'Products tailored for North American market standards and regulations'
    },
    {
      id: 'south-america',
      name: 'South America',
      flag: '🇧🇷',
      countries: 'Brazil, Argentina, Chile, Colombia, Peru...',
      description: 'Products adapted for South American construction requirements'
    },
    {
      id: 'europe-africa',
      name: 'Europe & Africa',
      flag: '🇪🇺',
      countries: 'European Union, UK, Africa',
      description: 'Products meeting European CE standards and African market needs'
    }
  ];

  const handleSelectRegion = (selectedRegion: Region) => {
    setRegion(selectedRegion);
    setShowRegionSelector(false);
    toast.success(`Region set to ${getRegionName(selectedRegion)}`);
  };

  const handleSkip = () => {
    setShowRegionSelector(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-gray-900 mb-2">Welcome to COSUN</h2>
          <p className="text-gray-600">Please select your region to view products tailored for your market</p>
        </div>

        {/* IP Detection Notice */}
        {detectedRegion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  We detected you're visiting from: <span className="text-blue-600">{getRegionName(detectedRegion)}</span>
                </p>
                <p className="text-xs text-gray-600">
                  Click below to confirm, or choose a different region
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Region Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {regions.map((r) => {
            const isDetected = detectedRegion === r.id;
            const isSelected = region === r.id;
            
            return (
              <div
                key={r.id}
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  isDetected
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : isSelected
                    ? 'border-red-600 bg-red-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => !isDetected && handleSelectRegion(r.id)}
              >
                {isDetected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{r.flag}</div>
                  <h3 className="font-medium text-gray-900 mb-1">{r.name}</h3>
                  <p className="text-xs text-gray-500">{r.countries}</p>
                </div>
                
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  {r.description}
                </p>

                {isDetected && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRegion(r.id);
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirm & Continue
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            💡 <span className="font-medium">Tip:</span> You can change your region anytime from the top navigation bar
          </p>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now (browse all regions)
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}