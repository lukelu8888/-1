import { useState, useEffect } from 'react';
import { Search, Package, Ship, MapPin, Calendar, Clock, CheckCircle2, Circle, Truck, FileText, AlertCircle, History, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { searchContainer, sampleContainerNumbers, type ContainerInfo } from '../data/containerTrackingData';
import { ContainerDetailsPage } from './ContainerDetailsPage';
import { toast } from 'sonner@2.0.3';

// Storage key for tracking history
const TRACKING_HISTORY_KEY = 'cosun_container_tracking_history';

interface TrackingHistoryItem {
  containerNumber: string;
  searchDate: string;
  status: string;
  origin: string;
  destination: string;
}

export function ContainerTrackingWidget() {
  const [searchQuery, setSearchQuery] = useState('');
  const [containerInfo, setContainerInfo] = useState<ContainerInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<TrackingHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetailsPage, setShowDetailsPage] = useState(false);

  // Load tracking history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRACKING_HISTORY_KEY);
      if (saved) {
        setTrackingHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load tracking history:', error);
    }
  }, []);

  // Save to history
  const saveToHistory = (container: ContainerInfo) => {
    const historyItem: TrackingHistoryItem = {
      containerNumber: container.containerNumber,
      searchDate: new Date().toISOString(),
      status: container.currentStatus,
      origin: container.origin,
      destination: container.destination,
    };

    // Check if already exists
    const existingIndex = trackingHistory.findIndex(
      (item) => item.containerNumber === container.containerNumber
    );

    let newHistory: TrackingHistoryItem[];
    if (existingIndex !== -1) {
      // Update existing entry
      newHistory = [...trackingHistory];
      newHistory[existingIndex] = historyItem;
    } else {
      // Add new entry at the beginning
      newHistory = [historyItem, ...trackingHistory];
    }

    // Keep only last 20 entries
    newHistory = newHistory.slice(0, 20);

    setTrackingHistory(newHistory);
    localStorage.setItem(TRACKING_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Remove from history
  const removeFromHistory = (containerNumber: string) => {
    const newHistory = trackingHistory.filter(
      (item) => item.containerNumber !== containerNumber
    );
    setTrackingHistory(newHistory);
    localStorage.setItem(TRACKING_HISTORY_KEY, JSON.stringify(newHistory));
    toast.success('Removed from history');
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a container number');
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const result = searchContainer(searchQuery);
      
      if (result) {
        setContainerInfo(result);
        saveToHistory(result);
        toast.success('Container found!');
      } else {
        setContainerInfo(null);
        toast.error('Container not found. Please check the number and try again.');
      }
      
      setIsSearching(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'At Port':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Customs Clearance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Out for Delivery':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Transit':
        return <Ship className="w-5 h-5" />;
      case 'At Port':
        return <MapPin className="w-5 h-5" />;
      case 'Customs Clearance':
        return <FileText className="w-5 h-5" />;
      case 'Out for Delivery':
        return <Truck className="w-5 h-5" />;
      case 'Delivered':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // If showing details page
  if (showDetailsPage && containerInfo) {
    return (
      <div>
        <ContainerDetailsPage
          containerNumber={containerInfo.containerNumber}
          trackingData={containerInfo}
          onBack={() => setShowDetailsPage(false)}
        />
      </div>
    );
  }

  // Main tracking interface - Open to everyone
  return (
    <div className="space-y-8">
      {/* Search Section */}
      <Card className="border-2 border-red-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Track Your Container
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Track your shipments in real-time with our advanced container tracking system
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Search Box */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter Container Number (e.g., CSNU1234567)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 text-lg"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-12 px-8 bg-red-600 hover:bg-red-700"
            >
              <Search className="w-5 h-5 mr-2" />
              {isSearching ? 'Searching...' : 'Track'}
            </Button>
          </div>
          
          {/* Sample Numbers */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Try sample:</span>
            {sampleContainerNumbers.map((number) => (
              <button
                key={number}
                onClick={() => {
                  setSearchQuery(number);
                  setTimeout(() => handleSearch(), 100);
                }}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                {number}
              </button>
            ))}
          </div>

          {/* History Toggle */}
          {trackingHistory.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide' : 'Show'} Tracking History ({trackingHistory.length})
              </button>

              {showHistory && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {trackingHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => {
                          setSearchQuery(item.containerNumber);
                          setTimeout(() => handleSearch(), 100);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-sm">{item.containerNumber}</div>
                          <Badge className={`${getStatusColor(item.status)} text-xs`}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.origin} → {item.destination}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.searchDate).toLocaleString()}
                        </div>
                      </button>
                      <button
                        onClick={() => removeFromHistory(item.containerNumber)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {containerInfo && (
        <div className="space-y-6">
          {/* Container Overview */}
          <Card className="border-2">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-red-600" />
                  Container: {containerInfo.containerNumber}
                </CardTitle>
                <Badge className={`text-base px-4 py-2 flex items-center gap-2 ${getStatusColor(containerInfo.currentStatus)}`}>
                  {getStatusIcon(containerInfo.currentStatus)}
                  {containerInfo.currentStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Vessel</div>
                  <div className="font-semibold flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" />
                    {containerInfo.vessel}
                  </div>
                  <div className="text-sm text-gray-500">Voyage: {containerInfo.voyage}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Carrier</div>
                  <div className="font-semibold">{containerInfo.carrier}</div>
                  <div className="text-sm text-gray-500">B/L: {containerInfo.billOfLading}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Container Type</div>
                  <div className="font-semibold">{containerInfo.containerType}</div>
                  <div className="text-sm text-gray-500">{containerInfo.containerSize}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Booking Number</div>
                  <div className="font-semibold">{containerInfo.bookingNumber}</div>
                </div>
              </div>

              {/* Route Information */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Origin</div>
                    <div className="font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      {containerInfo.origin}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Departed: {containerInfo.actualDeparture || containerInfo.estimatedDeparture}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <Ship className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">In Transit</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Destination</div>
                    <div className="font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {containerInfo.destination}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ETA: {containerInfo.actualArrival || containerInfo.estimatedArrival}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          <Card>
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  Tracking History
                </CardTitle>
                <Button
                  onClick={() => setShowDetailsPage(true)}
                  className="bg-red-600 hover:bg-red-700 gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Full Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {containerInfo.events.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    {/* Timeline Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-2 ${
                        event.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {event.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      {index < containerInfo.events.length - 1 && (
                        <div className={`w-0.5 h-full min-h-[40px] ${
                          event.completed ? 'bg-green-200' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className={`font-semibold ${
                            event.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {event.status}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-900 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {event.date}
                          </div>
                          <div className="text-gray-500">{event.time}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {event.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                  <p className="text-blue-800 text-sm mb-3">
                    If you have any questions about your shipment or need assistance, our customer service team is here to help.
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Email:</span>{' '}
                      <a href="mailto:shipping@cosun.com" className="text-blue-600 hover:underline">
                        shipping@cosun.com
                      </a>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Phone:</span>{' '}
                      <a href="tel:+86-123-4567-8900" className="text-blue-600 hover:underline">
                        +86-123-4567-8900
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State Features */}
      {!containerInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ship className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-sm text-gray-600">
                Track your container's journey with live status updates at every milestone
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Location Tracking</h3>
              <p className="text-sm text-gray-600">
                Know exactly where your container is at any point during transit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">ETA Predictions</h3>
              <p className="text-sm text-gray-600">
                Accurate estimated arrival times to help you plan ahead
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
