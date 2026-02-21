import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Ship, TrendingDown, Boxes, CheckCircle2, Users, Truck, FileText, DollarSign, Globe2, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FreightQuote } from './FreightQuote';
import { ContainerTrackingWidget } from './ContainerTrackingWidget';
import shippingProducts1 from 'figma:asset/3b125683eb3b428987bfb96d06a1a120a650267e.png';
import shippingProducts2 from 'figma:asset/b3d077ae61f60718774042148488db58fe0fef8b.png';
import containerLoading from 'figma:asset/e3f17a67e02946dc6667a2ab1d9a0e3e4b5c74d4.png';

export function ShipmentHub() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  const capabilities = [
    {
      icon: Users,
      title: t.shipmentHub.capabilities.manufacturers,
      description: t.shipmentHub.capabilities.manufacturersDesc,
      stat: '1000+',
    },
    {
      icon: Boxes,
      title: t.shipmentHub.capabilities.skuConsolidation,
      description: t.shipmentHub.capabilities.skuConsolidationDesc,
      stat: '100%',
    },
    {
      icon: Package,
      title: t.shipmentHub.capabilities.containerOptimization,
      description: t.shipmentHub.capabilities.containerOptimizationDesc,
      stat: '95%',
    },
    {
      icon: DollarSign,
      title: t.shipmentHub.capabilities.costSavings,
      description: t.shipmentHub.capabilities.costSavingsDesc,
      stat: '30%',
    },
  ];

  const features = [
    {
      icon: Boxes,
      title: t.shipmentHub.features.multiSkuTitle,
      description: t.shipmentHub.features.multiSkuDesc,
      items: [
        t.shipmentHub.features.multiSkuItems.unlimited,
        t.shipmentHub.features.multiSkuItems.tracking,
        t.shipmentHub.features.multiSkuItems.quality,
      ],
    },
    {
      icon: Package,
      title: t.shipmentHub.features.containerTitle,
      description: t.shipmentHub.features.containerDesc,
      items: [
        t.shipmentHub.features.containerItems.optimization,
        t.shipmentHub.features.containerItems.mixedLoading,
        t.shipmentHub.features.containerItems.costEffective,
      ],
    },
    {
      icon: Ship,
      title: t.shipmentHub.features.shippingTitle,
      description: t.shipmentHub.features.shippingDesc,
      items: [
        t.shipmentHub.features.shippingItems.carrierSelection,
        t.shipmentHub.features.shippingItems.rateNegotiation,
        t.shipmentHub.features.shippingItems.scheduling,
      ],
    },
  ];

  const process = [
    {
      step: '01',
      title: t.shipmentHub.process.orderReceiving,
      description: t.shipmentHub.process.orderReceivingDesc,
      icon: FileText,
    },
    {
      step: '02',
      title: t.shipmentHub.process.supplierCoordination,
      description: t.shipmentHub.process.supplierCoordinationDesc,
      icon: Users,
    },
    {
      step: '03',
      title: t.shipmentHub.process.consolidation,
      description: t.shipmentHub.process.consolidationDesc,
      icon: Boxes,
    },
    {
      step: '04',
      title: t.shipmentHub.process.containerLoading,
      description: t.shipmentHub.process.containerLoadingDesc,
      icon: Package,
    },
    {
      step: '05',
      title: t.shipmentHub.process.shipping,
      description: t.shipmentHub.process.shippingDesc,
      icon: Ship,
    },
    {
      step: '06',
      title: t.shipmentHub.process.delivery,
      description: t.shipmentHub.process.deliveryDesc,
      icon: Truck,
    },
  ];

  const benefits = [
    {
      icon: TrendingDown,
      title: t.shipmentHub.benefits.costReduction,
      value: '25-35%',
      description: t.shipmentHub.benefits.costReductionDesc,
    },
    {
      icon: CheckCircle2,
      title: t.shipmentHub.benefits.efficiency,
      value: '40%',
      description: t.shipmentHub.benefits.efficiencyDesc,
    },
    {
      icon: Globe2,
      title: t.shipmentHub.benefits.network,
      value: '1000+',
      description: t.shipmentHub.benefits.networkDesc,
    },
    {
      icon: Ship,
      title: t.shipmentHub.benefits.shipping,
      value: '99%',
      description: t.shipmentHub.benefits.shippingDesc,
    },
  ];

  return (
    <section id="shipment-hub" className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full mb-4">
            <span className="flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Shipment Hub
            </span>
          </div>
          <h1 className="text-gray-900 mb-4">
            {t.shipmentHub.title}
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto mb-2">
            {t.shipmentHub.subtitle}
          </p>
          <p className="text-orange-600 max-w-2xl mx-auto">
            {t.shipmentHub.tagline}
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Track Container
            </TabsTrigger>
            <TabsTrigger value="freight" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Freight Rates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Original Content */}
          <TabsContent value="overview" className="mt-0">
        {/* Real Shipment Cases Gallery */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-4">
            {t.shipmentHub.shipmentCasesTitle}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t.shipmentHub.shipmentCasesDesc}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="overflow-hidden rounded-xl shadow-lg group">
              <div className="relative aspect-[4/3]">
                <img
                  src={shippingProducts1}
                  alt="Wrapped Products Ready for Shipment"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">{t.shipmentHub.shipmentCase1}</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl shadow-lg group">
              <div className="relative aspect-[4/3]">
                <img
                  src={shippingProducts2}
                  alt="Multi-SKU Product Consolidation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">{t.shipmentHub.shipmentCase2}</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl shadow-lg group">
              <div className="relative aspect-[4/3]">
                <img
                  src={containerLoading}
                  alt="Optimized Container Loading"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">{t.shipmentHub.shipmentCase3}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-12">
            {t.shipmentHub.capabilitiesTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <Card key={index} className="border-2 hover:border-orange-500 transition-all hover:shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <capability.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-orange-600 mb-2">{capability.stat}</div>
                  <h3 className="text-gray-900 mb-3">{capability.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {capability.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-12">
            {t.shipmentHub.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white shadow-sm border-2 hover:border-orange-500 transition-all">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Process Timeline */}
        <div className="mb-16 bg-white rounded-2xl shadow-sm border p-8 md:p-12">
          <h2 className="text-gray-900 text-center mb-12">
            {t.shipmentHub.processTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {process.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-orange-600 mb-1">{step.step}</div>
                    <h3 className="text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-12">
            {t.shipmentHub.benefitsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border-2 p-6 hover:border-orange-500 transition-all hover:shadow-lg text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-orange-600 mb-2">{benefit.value}</div>
                <h3 className="text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-white mb-4">
            {t.shipmentHub.ctaTitle}
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            {t.shipmentHub.ctaDesc}
          </p>
          <Button 
            size="lg" 
            className="bg-white text-orange-600 hover:bg-gray-100"
          >
            {t.shipmentHub.ctaButton}
          </Button>
        </div>
          </TabsContent>

          {/* Tracking Tab - New Content */}
          <TabsContent value="tracking" className="mt-0">
            <ContainerTrackingWidget />
          </TabsContent>

          {/* Freight Tab - New Content */}
          <TabsContent value="freight" className="mt-0">
            <FreightQuote />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}