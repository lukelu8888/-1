import { useState } from 'react';
import { 
  ArrowLeft, Ship, Package, MapPin, Calendar, Clock, 
  CheckCircle2, AlertCircle, FileText, Download, 
  Phone, Mail, Anchor, Navigation, TrendingUp, Info,
  Truck, Plane, Container as ContainerIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { TrackingHistory } from '../data/trackingHistoryData';

interface ContainerDetailsPageProps {
  containerNumber: string;
  trackingData: TrackingHistory;
  onBack: () => void;
}

interface TimelineEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
  type: 'completed' | 'current' | 'upcoming';
  vessel?: string;
  isEstimated?: boolean;
}

export function ContainerDetailsPage({ containerNumber, trackingData, onBack }: ContainerDetailsPageProps) {
  const [activeTab, setActiveTab] = useState('timeline');

  // Generate complete timeline (past + future events)
  const generateTimeline = (): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];
    const currentIndex = trackingData.events.findIndex(e => e.status === trackingData.currentStatus);

    // Past and current events
    trackingData.events.forEach((event, index) => {
      timeline.push({
        date: event.date,
        time: event.time,
        location: event.location,
        status: event.status,
        description: event.description,
        type: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming',
        vessel: event.vessel,
        isEstimated: false
      });
    });

    // Add future estimated events based on status
    if (trackingData.currentStatus !== 'Delivered' && trackingData.estimatedArrival) {
      const futureEvents = getFutureEvents(trackingData);
      timeline.push(...futureEvents);
    }

    return timeline;
  };

  const getFutureEvents = (data: TrackingHistory): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const currentStatus = data.currentStatus;

    if (currentStatus === 'In Transit') {
      events.push({
        date: getEstimatedDate(5),
        time: '14:00',
        location: 'Suez Canal',
        status: 'Transit Point',
        description: 'Expected to pass through Suez Canal',
        type: 'upcoming',
        isEstimated: true
      });
      events.push({
        date: getEstimatedDate(8),
        time: '09:00',
        location: data.destination,
        status: 'Port Arrival',
        description: 'Expected arrival at destination port',
        type: 'upcoming',
        vessel: data.vessel,
        isEstimated: true
      });
      events.push({
        date: data.estimatedArrival,
        time: '16:00',
        location: data.destination,
        status: 'Available for Pickup',
        description: 'Container cleared and ready for pickup',
        type: 'upcoming',
        isEstimated: true
      });
    } else if (currentStatus === 'At Port') {
      events.push({
        date: getEstimatedDate(2),
        time: '10:00',
        location: data.currentLocation,
        status: 'Customs Clearance',
        description: 'Customs inspection and clearance',
        type: 'upcoming',
        isEstimated: true
      });
      events.push({
        date: data.estimatedArrival,
        time: '14:00',
        location: data.currentLocation,
        status: 'Available for Pickup',
        description: 'Container ready for pickup',
        type: 'upcoming',
        isEstimated: true
      });
    }

    return events;
  };

  const getEstimatedDate = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered') || statusLower.includes('completed')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (statusLower.includes('transit') || statusLower.includes('loaded')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (statusLower.includes('port') || statusLower.includes('arrival')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if (statusLower.includes('delayed') || statusLower.includes('issue')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const timeline = generateTimeline();
  const completedEvents = timeline.filter(e => e.type === 'completed').length;
  const totalEvents = timeline.length;
  const progress = (completedEvents / totalEvents) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Tracking
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            Email Updates
          </Button>
        </div>
      </div>

      {/* Container Overview Card */}
      <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Container Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <ContainerIcon className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{containerNumber}</h1>
                  <Badge className={`${getStatusColor(trackingData.currentStatus)} text-sm px-3 py-1`}>
                    {trackingData.currentStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/60 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Container Type</div>
                  <div className="font-semibold">{trackingData.containerType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Vessel</div>
                  <div className="font-semibold">{trackingData.vessel}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Origin</div>
                  <div className="font-semibold">{trackingData.origin}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Destination</div>
                  <div className="font-semibold">{trackingData.destination}</div>
                </div>
              </div>
            </div>

            {/* Right: Current Status */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Current Location</div>
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">{trackingData.currentLocation}</div>
                  <div className="text-sm text-gray-600">Last updated 2 hours ago</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-2">Estimated Arrival</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="font-semibold">{trackingData.estimatedArrival}</div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="text-sm text-gray-600 mb-2">Journey Progress</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{completedEvents} of {totalEvents} milestones</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Shipment Timeline
              </CardTitle>
              <p className="text-sm text-gray-600">
                Complete journey from origin to destination
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Timeline Events */}
                <div className="space-y-6">
                  {timeline.map((event, index) => (
                    <div key={index} className="relative flex gap-6">
                      {/* Timeline Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            event.type === 'completed'
                              ? 'bg-green-100 border-4 border-green-500'
                              : event.type === 'current'
                              ? 'bg-blue-100 border-4 border-blue-500 ring-4 ring-blue-200 animate-pulse'
                              : 'bg-gray-100 border-4 border-gray-300 border-dashed'
                          }`}
                        >
                          {event.type === 'completed' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : event.type === 'current' ? (
                            <Navigation className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Clock className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Event Content */}
                      <div className={`flex-1 pb-6 ${event.type === 'upcoming' ? 'opacity-60' : ''}`}>
                        <Card className={`${event.type === 'current' ? 'border-2 border-blue-500 shadow-lg' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-lg mb-1">{event.status}</div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {event.date}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {event.time}
                                  </div>
                                </div>
                              </div>
                              {event.isEstimated && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Estimated
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm font-medium">{event.location}</div>
                            </div>

                            <p className="text-sm text-gray-600">{event.description}</p>

                            {event.vessel && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <Ship className="w-4 h-4" />
                                {event.vessel}
                              </div>
                            )}

                            {event.type === 'current' && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="text-sm text-blue-800">
                                    <strong>Current Status:</strong> Your container is currently at this location. 
                                    Next update expected in 6-12 hours.
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-red-600" />
                Route Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Ship className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive route map</p>
                  <p className="text-sm text-gray-500">{trackingData.origin} → {trackingData.destination}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  Shipment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Container Number</div>
                    <div className="font-semibold">{containerNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Container Type</div>
                    <div className="font-semibold">{trackingData.containerType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Seal Number</div>
                    <div className="font-semibold">SL{Math.random().toString().slice(2, 10)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Booking Number</div>
                    <div className="font-semibold">BK{Math.random().toString().slice(2, 10)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Bill of Lading</div>
                    <div className="font-semibold">BL{Math.random().toString().slice(2, 10)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Weight</div>
                    <div className="font-semibold">18,500 kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Volume</div>
                    <div className="font-semibold">55 CBM</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Cargo Type</div>
                    <div className="font-semibold">Building Materials</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vessel Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-red-600" />
                  Vessel Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Vessel Name</div>
                    <div className="font-semibold">{trackingData.vessel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Voyage Number</div>
                    <div className="font-semibold">VY{Math.random().toString().slice(2, 7)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">IMO Number</div>
                    <div className="font-semibold">IMO {Math.random().toString().slice(2, 9)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Flag</div>
                    <div className="font-semibold">Panama</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Carrier</div>
                    <div className="font-semibold">COSCO Shipping</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Service</div>
                    <div className="font-semibold">Asia-North America</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Vessel Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-green-600">Active - On Schedule</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-red-600" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Port of Loading</div>
                  <div className="font-semibold text-lg">{trackingData.origin}</div>
                  <div className="text-sm text-gray-500">Departed: {trackingData.events[0]?.date}</div>
                </div>

                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="h-px w-16 bg-blue-300" />
                    <Ship className="w-5 h-5" />
                    <div className="h-px w-16 bg-blue-300" />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Port of Discharge</div>
                  <div className="font-semibold text-lg">{trackingData.destination}</div>
                  <div className="text-sm text-gray-500">ETA: {trackingData.estimatedArrival}</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Transit Time</div>
                      <div className="font-semibold">18-22 days</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Distance</div>
                      <div className="font-semibold">~11,500 nm</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customs & Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Customs & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Export Clearance</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Cleared</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Import Clearance</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Documentation</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Complete</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">HS Code</div>
                  <div className="font-semibold">6907.21.0000</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Ceramic tiles for flooring
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Shipping Documents
              </CardTitle>
              <p className="text-sm text-gray-600">
                Download and view all related documents
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Bill of Lading', status: 'Available', date: 'Nov 10, 2025', size: '245 KB' },
                  { name: 'Commercial Invoice', status: 'Available', date: 'Nov 10, 2025', size: '189 KB' },
                  { name: 'Packing List', status: 'Available', date: 'Nov 10, 2025', size: '156 KB' },
                  { name: 'Certificate of Origin', status: 'Available', date: 'Nov 10, 2025', size: '98 KB' },
                  { name: 'Insurance Certificate', status: 'Available', date: 'Nov 11, 2025', size: '134 KB' },
                  { name: 'Customs Declaration', status: 'Processing', date: 'Pending', size: '-' },
                  { name: 'Delivery Order', status: 'Pending', date: 'Est. Nov 25, 2025', size: '-' },
                ].map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-red-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-sm text-gray-600">
                          {doc.date} {doc.size !== '-' && `• ${doc.size}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          doc.status === 'Available'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'Processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {doc.status}
                      </Badge>
                      {doc.status === 'Available' && (
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Notifications & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900">On Schedule</div>
                    <div className="text-sm text-blue-800">
                      Your shipment is progressing as planned. No delays expected.
                    </div>
                    <div className="text-xs text-blue-600 mt-1">2 hours ago</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900">Export Customs Cleared</div>
                    <div className="text-sm text-green-800">
                      Container has been cleared by export customs authorities.
                    </div>
                    <div className="text-xs text-green-600 mt-1">1 day ago</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-900">Action Required</div>
                    <div className="text-sm text-yellow-800">
                      Please provide import customs documents before Nov 20, 2025.
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">3 days ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carrier Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-red-600" />
                  Carrier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-semibold text-lg mb-1">COSCO Shipping Lines</div>
                  <div className="text-sm text-gray-600">Main Carrier</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Customer Service</div>
                      <a href="tel:+86-21-2603-6666" className="font-medium text-red-600 hover:underline">
                        +86-21-2603-6666
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <a href="mailto:service@cosco.com" className="font-medium text-red-600 hover:underline">
                        service@cosco.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Contact Carrier
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* COSUN Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  COSUN Support Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-semibold text-lg mb-1">Freight Support</div>
                  <div className="text-sm text-gray-600">Available 24/7</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Hotline</div>
                      <a href="tel:+86-123-4567-8900" className="font-medium text-red-600 hover:underline">
                        +86-123-4567-8900
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <a href="mailto:freight@cosun.com" className="font-medium text-red-600 hover:underline">
                        freight@cosun.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Chat with Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Port Agent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-red-600" />
                  Destination Port Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-semibold text-lg mb-1">Pacific Logistics LLC</div>
                  <div className="text-sm text-gray-600">{trackingData.destination}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Office</div>
                      <a href="tel:+1-310-555-0100" className="font-medium text-red-600 hover:underline">
                        +1-310-555-0100
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <a href="mailto:la@pacificlogistics.com" className="font-medium text-red-600 hover:underline">
                        la@pacificlogistics.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Services</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Customs Clearance</Badge>
                    <Badge variant="outline">Cargo Pickup</Badge>
                    <Badge variant="outline">Storage</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customs Broker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Customs Broker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-semibold text-lg mb-1">Global Trade Services</div>
                  <div className="text-sm text-gray-600">Licensed Customs Broker</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Direct Line</div>
                      <a href="tel:+1-310-555-0200" className="font-medium text-red-600 hover:underline">
                        +1-310-555-0200
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <a href="mailto:customs@globaltradeservices.com" className="font-medium text-red-600 hover:underline">
                        customs@globaltradeservices.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">License Number</div>
                  <div className="font-medium">US-CB-12345-LA</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
