import { useState, useEffect } from 'react';
import { Search, MapPin, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { searchPorts } from '../data/freightRatesData';

interface PortSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  regionFilter?: string; // Optional filter to show only specific region
  autoExpand?: boolean; // Auto expand all regions (no collapse UI)
  excludeRegion?: string; // Optional filter to exclude specific region
}

export function PortSelector({ value, onValueChange, placeholder, regionFilter, autoExpand, excludeRegion }: PortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPorts, setFilteredPorts] = useState(searchPorts(''));
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ports = searchPorts(searchQuery);
    
    // Apply region filter if specified
    if (regionFilter) {
      ports = ports.filter(port => port.region.toLowerCase() === regionFilter.toLowerCase());
    }
    
    // Apply region exclusion if specified
    if (excludeRegion) {
      ports = ports.filter(port => port.region.toLowerCase() !== excludeRegion.toLowerCase());
    }
    
    setFilteredPorts(ports);
  }, [searchQuery, regionFilter, excludeRegion]);

  const handleSelect = (portName: string) => {
    onValueChange(portName);
    setIsOpen(false);
    setSearchQuery('');
    setExpandedRegions(new Set());
  };

  const clearSelection = () => {
    onValueChange('');
    setSearchQuery('');
  };

  const toggleRegion = (region: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(region)) {
      newExpanded.delete(region);
    } else {
      newExpanded.add(region);
    }
    setExpandedRegions(newExpanded);
  };

  return (
    <div className="relative">
      <div
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center h-10 px-3 border border-gray-300 rounded-md bg-white hover:border-red-600 transition-colors">
          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by port name, country, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Port List */}
            <div className="overflow-y-auto max-h-80">
              {filteredPorts.length > 0 ? (
                <div>
                  {/* When searching OR autoExpand is true, show results directly without grouping */}
                  {searchQuery.trim() || autoExpand ? (
                    <div>
                      {filteredPorts
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((port) => (
                          <button
                            key={port.code}
                            onClick={() => handleSelect(port.name)}
                            className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 ${
                              value === port.name ? 'bg-red-50 text-red-600' : ''
                            }`}
                          >
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {port.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {port.country} • {port.code}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  ) : (
                    /* Show collapsible regions when not searching */
                    (() => {
                      const groupedPorts = filteredPorts.reduce((acc, port) => {
                        if (!acc[port.region]) {
                          acc[port.region] = [];
                        }
                        acc[port.region].push(port);
                        return acc;
                      }, {} as Record<string, typeof filteredPorts>);

                      return Object.entries(groupedPorts).map(([region, ports]) => {
                        // Sort ports alphabetically by name
                        const sortedPorts = [...ports].sort((a, b) => a.name.localeCompare(b.name));
                        
                        return (
                          <div key={region} className="border-b border-gray-200 last:border-0">
                            {/* Region Header - Clickable */}
                            <button
                              onClick={() => toggleRegion(region)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {expandedRegions.has(region) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                  {region}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {ports.length} port{ports.length !== 1 ? 's' : ''}
                              </span>
                            </button>
                            
                            {/* Ports in this region - Sorted alphabetically */}
                            {expandedRegions.has(region) && (
                              <div className="bg-white">
                                {sortedPorts.map((port) => (
                                  <button
                                    key={port.code}
                                    onClick={() => handleSelect(port.name)}
                                    className={`w-full text-left px-6 py-2.5 hover:bg-red-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 ${
                                      value === port.name ? 'bg-red-50 text-red-600' : ''
                                    }`}
                                  >
                                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">
                                        {port.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {port.country} • {port.code}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <div className="text-sm">No ports found</div>
                  <div className="text-xs mt-1">
                    Try searching by name, country, or code
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
              {filteredPorts.length} port{filteredPorts.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </>
      )}
    </div>
  );
}