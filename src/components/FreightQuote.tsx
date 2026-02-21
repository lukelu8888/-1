import { useState } from 'react';
import { Search, Ship, DollarSign, TrendingDown, Clock, CheckCircle2, Package, AlertCircle, ArrowRight, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PortSelector } from './PortSelector';
import { FreightQuoteForm } from './FreightQuoteForm';
import { getFreightRates, popularRoutes, type FreightRate } from '../data/freightRatesData';
import { toast } from 'sonner@2.0.3';

export function FreightQuote() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [containerType, setContainerType] = useState<'20GP' | '40GP' | '40HC'>('40HC');
  const [isSearching, setIsSearching] = useState(false);
  const [rates, setRates] = useState<FreightRate[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ origin: string; destination: string } | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'reliability'>('price');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedRate, setSelectedRate] = useState<FreightRate | null>(null);

  const handleSearch = () => {
    if (!origin || !destination) {
      toast.error('Please select both origin and destination ports');
      return;
    }

    setIsSearching(true);

    // Simulate API call delay
    setTimeout(() => {
      const result = getFreightRates(origin, destination);

      if (result) {
        let sortedRates = [...result.rates];
        
        // Sort rates based on selected criteria
        if (sortBy === 'price') {
          sortedRates.sort((a, b) => {
            const priceA = containerType === '20GP' ? a.rate20GP : containerType === '40GP' ? a.rate40GP : a.rate40HC;
            const priceB = containerType === '20GP' ? b.rate20GP : containerType === '40GP' ? b.rate40GP : b.rate40HC;
            return priceA - priceB;
          });
        } else if (sortBy === 'time') {
          sortedRates.sort((a, b) => {
            const daysA = parseInt(a.transitTime.split('-')[0]);
            const daysB = parseInt(b.transitTime.split('-')[0]);
            return daysA - daysB;
          });
        } else if (sortBy === 'reliability') {
          sortedRates.sort((a, b) => b.reliability - a.reliability);
        }

        setRates(sortedRates);
        setRouteInfo({ origin: result.origin, destination: result.destination });
        toast.success('Freight rates loaded successfully!');
      } else {
        setRates([]);
        setRouteInfo(null);
        toast.error('No rates found for this route. Please try a different route.');
      }

      setIsSearching(false);
    }, 1000);
  };

  const handleQuickRoute = (route: string) => {
    const [orig, dest] = route.split('-');
    setOrigin(orig);
    setDestination(dest);
    setTimeout(() => handleSearch(), 100);
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'Express':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Standard':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Economy':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrice = (rate: FreightRate) => {
    switch (containerType) {
      case '20GP':
        return rate.rate20GP;
      case '40GP':
        return rate.rate40GP;
      case '40HC':
        return rate.rate40HC;
      default:
        return rate.rate40HC;
    }
  };

  return (
    <div className="space-y-8">
      {!showQuoteForm ? (
        <>
          {/* Search Section */}
          <Card className="border-2 border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Ship className="w-6 h-6 text-red-600" />
                Instant Freight Quote
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Get real-time shipping rates from multiple carriers
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Route Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin Port (China)
                  </label>
                  <PortSelector
                    value={origin}
                    onValueChange={setOrigin}
                    placeholder="Select origin port"
                    regionFilter="China"
                    autoExpand={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination Port (Worldwide)
                  </label>
                  <PortSelector
                    value={destination}
                    onValueChange={setDestination}
                    placeholder="Select destination port"
                    excludeRegion="China"
                  />
                </div>
              </div>

              {/* Container Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Container Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setContainerType('20GP')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      containerType === '20GP'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <Package className="w-6 h-6 mx-auto mb-2 text-red-600" />
                    <div className="font-semibold text-sm">20' GP</div>
                    <div className="text-xs text-gray-500">Standard</div>
                  </button>
                  <button
                    onClick={() => setContainerType('40GP')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      containerType === '40GP'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <Package className="w-8 h-6 mx-auto mb-2 text-red-600" />
                    <div className="font-semibold text-sm">40' GP</div>
                    <div className="text-xs text-gray-500">Standard</div>
                  </button>
                  <button
                    onClick={() => setContainerType('40HC')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      containerType === '40HC'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <Package className="w-8 h-7 mx-auto mb-2 text-red-600" />
                    <div className="font-semibold text-sm">40' HC</div>
                    <div className="text-xs text-gray-500">High Cube</div>
                  </button>
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                {isSearching ? 'Searching Rates...' : 'Get Instant Quotes'}
              </Button>

              {/* Quick Routes */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-3">Popular Routes:</div>
                <div className="flex flex-wrap gap-2">
                  {popularRoutes.map((route) => (
                    <button
                      key={route.value}
                      onClick={() => handleQuickRoute(route.value)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {rates.length > 0 && routeInfo && (
            <div className="space-y-6">
              {/* Route Info */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">From</div>
                        <div className="font-semibold text-lg">{routeInfo.origin}</div>
                      </div>
                      <ArrowRight className="w-8 h-8 text-blue-600" />
                      <div className="text-center">
                        <div className="text-sm text-gray-600">To</div>
                        <div className="font-semibold text-lg">{routeInfo.destination}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Sort by Price</SelectItem>
                          <SelectItem value="time">Sort by Transit Time</SelectItem>
                          <SelectItem value="reliability">Sort by Reliability</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rates List */}
              <div className="space-y-4">
                {rates.map((rate, index) => (
                  <Card key={index} className="border-2 hover:border-red-300 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Carrier Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Ship className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{rate.carrier}</h3>
                              <Badge className={`${getServiceColor(rate.service)} text-xs`}>
                                {rate.service} Service
                              </Badge>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                <Clock className="w-4 h-4" />
                                Transit Time
                              </div>
                              <div className="font-semibold">{rate.transitTime}</div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                <TrendingDown className="w-4 h-4" />
                                Reliability
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">{rate.reliability}%</div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      rate.reliability >= 95
                                        ? 'bg-green-500'
                                        : rate.reliability >= 90
                                        ? 'bg-blue-500'
                                        : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${rate.reliability}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Valid Until</div>
                              <div className="font-semibold">{rate.validUntil}</div>
                            </div>
                          </div>

                          {/* Includes/Excludes */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="text-gray-600 font-medium mb-1">Includes:</div>
                              <ul className="space-y-0.5">
                                {rate.includes.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-gray-600 font-medium mb-1">Excludes:</div>
                              <ul className="space-y-0.5 text-gray-500">
                                {rate.excludes.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="ml-6 flex flex-col items-end justify-between h-full min-h-[200px]">
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">All-in Price</div>
                            <div className="text-4xl font-bold text-red-600 mb-1">
                              ${getPrice(rate).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">per {containerType}</div>
                          </div>

                          <div className="space-y-2 w-full">
                            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => { setShowQuoteForm(true); setSelectedRate(rate); }}>
                              <DollarSign className="w-4 h-4 mr-1" />
                              Request Booking
                            </Button>
                            <Button variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Info Banner */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Powered by Real-Time Data
                      </h3>
                      <p className="text-blue-800 text-sm mb-3">
                        Our freight rates are updated daily from major shipping lines and freight forwarders. 
                        Prices shown are indicative and subject to confirmation. Final rates may vary based on 
                        cargo details, booking date, and seasonal factors.
                      </p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Need Help?</span>{' '}
                          <a href="mailto:freight@cosun.com" className="text-blue-600 hover:underline">
                            freight@cosun.com
                          </a>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Call Us:</span>{' '}
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
          {rates.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ship className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Multi-Carrier Comparison</h3>
                  <p className="text-sm text-gray-600">
                    Compare rates from COSCO, Maersk, MSC, CMA CGM, and more
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Real-Time Pricing</h3>
                  <p className="text-sm text-gray-600">
                    Get instant quotes with up-to-date market rates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Best Rates Guaranteed</h3>
                  <p className="text-sm text-gray-600">
                    Save up to 30% with our negotiated carrier contracts
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        selectedRate && (
          <FreightQuoteForm
            selectedRate={selectedRate}
            origin={origin}
            destination={destination}
            containerType={containerType}
            onBack={() => setShowQuoteForm(false)}
          />
        )
      )}
    </div>
  );
}