import { useState } from 'react';
import { Tag, TrendingDown, Clock, Package, Star, ShoppingCart, ArrowRight, Percent, Gift, Megaphone, PlayCircle, FileText } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function SpecialOffers() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Promotional announcements (video and text)
  const promotions = [
    {
      id: 1,
      type: 'video',
      title: t.specials?.promotions?.promo1?.title || 'Spring Sale 2025 - Up to 50% Off!',
      description: t.specials?.promotions?.promo1?.desc || 'Get amazing discounts on all building materials. Watch our video to see the incredible offers available now!',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video
      startDate: '2025-10-20',
      endDate: '2025-11-30',
      status: 'active',
    },
    {
      id: 2,
      type: 'text',
      title: t.specials?.promotions?.promo2?.title || 'Bulk Order Promotion - Order Now!',
      description: t.specials?.promotions?.promo2?.desc || 'Limited time offer: Place your bulk orders now and enjoy exclusive discounts up to 40%. Perfect for contractors and large projects. Contact our sales team to get started!',
      highlights: [
        t.specials?.promotions?.promo2?.highlight1 || '✓ Minimum order: 1000 units',
        t.specials?.promotions?.promo2?.highlight2 || '✓ Discount up to 40%',
        t.specials?.promotions?.promo2?.highlight3 || '✓ Free shipping included',
        t.specials?.promotions?.promo2?.highlight4 || '✓ Dedicated account manager',
      ],
      startDate: '2025-10-15',
      endDate: '2025-12-15',
      status: 'active',
    },
  ];

  const categories = [
    { id: 'all', name: t.specials?.categories?.all || 'All Offers', icon: Tag },
    { id: 'flash', name: t.specials?.categories?.flash || 'Flash Sale', icon: Clock },
    { id: 'bulk', name: t.specials?.categories?.bulk || 'Bulk Discount', icon: Package },
    { id: 'featured', name: t.specials?.categories?.featured || 'Featured', icon: Star },
  ];

  const offers = [
    {
      id: 1,
      category: 'flash',
      title: t.specials?.offers?.offer1?.title || 'Building Materials Flash Sale',
      description: t.specials?.offers?.offer1?.desc || 'Up to 40% off on selected building materials. Limited stock available.',
      discount: '40%',
      originalPrice: '$2,500',
      salePrice: '$1,500',
      deadline: '2025-10-25',
      image: 'https://images.unsplash.com/photo-1562957982-b1f25317aebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMG1hdGVyaWFscyUyMHNhbGV8ZW58MXx8fHwxNzYwNzgyODIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Flash Sale',
      badgeColor: 'bg-red-500',
    },
    {
      id: 2,
      category: 'bulk',
      title: t.specials?.offers?.offer2?.title || 'Bulk Purchase Discount',
      description: t.specials?.offers?.offer2?.desc || 'Order 1000+ units and save 30%. Perfect for large projects.',
      discount: '30%',
      originalPrice: '$15,000',
      salePrice: '$10,500',
      deadline: '2025-11-15',
      image: 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBtYXRlcmlhbHMlMjB3YXJlaG91c2V8ZW58MXx8fHwxNzYwNzA2Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Bulk Discount',
      badgeColor: 'bg-blue-500',
    },
    {
      id: 3,
      category: 'featured',
      title: t.specials?.offers?.offer3?.title || 'Hardware Combo Deal',
      description: t.specials?.offers?.offer3?.desc || 'Buy complete hardware sets at special bundle prices.',
      discount: '25%',
      originalPrice: '$800',
      salePrice: '$600',
      deadline: '2025-10-30',
      image: 'https://images.unsplash.com/photo-1613489763341-1a3603e11d61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd2FyZSUyMHN0b3JlJTIwZGlzY291bnR8ZW58MXx8fHwxNzYwNzgyODIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Bundle Deal',
      badgeColor: 'bg-green-500',
    },
    {
      id: 4,
      category: 'flash',
      title: t.specials?.offers?.offer4?.title || 'Weekend Special - Flooring',
      description: t.specials?.offers?.offer4?.desc || 'Premium flooring materials at unbeatable weekend prices.',
      discount: '35%',
      originalPrice: '$3,200',
      salePrice: '$2,080',
      deadline: '2025-10-20',
      image: 'https://images.unsplash.com/photo-1562957982-b1f25317aebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMG1hdGVyaWFscyUyMHNhbGV8ZW58MXx8fHwxNzYwNzgyODIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Weekend Only',
      badgeColor: 'bg-purple-500',
    },
    {
      id: 5,
      category: 'bulk',
      title: t.specials?.offers?.offer5?.title || 'Paint & Coating Volume Discount',
      description: t.specials?.offers?.offer5?.desc || 'Buy 500+ gallons and get massive savings on premium paints.',
      discount: '28%',
      originalPrice: '$5,000',
      salePrice: '$3,600',
      deadline: '2025-11-01',
      image: 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBtYXRlcmlhbHMlMjB3YXJlaG91c2V8ZW58MXx8fHwxNzYwNzA2Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Volume Deal',
      badgeColor: 'bg-orange-500',
    },
    {
      id: 6,
      category: 'featured',
      title: t.specials?.offers?.offer6?.title || 'New Customer Special',
      description: t.specials?.offers?.offer6?.desc || 'First-time buyers get exclusive discount on all products.',
      discount: '20%',
      originalPrice: '$1,000',
      salePrice: '$800',
      deadline: '2025-12-31',
      image: 'https://images.unsplash.com/photo-1613489763341-1a3603e11d61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd2FyZSUyMHN0b3JlJTIwZGlzY291bnR8ZW58MXx8fHwxNzYwNzgyODIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'New Customer',
      badgeColor: 'bg-pink-500',
    },
  ];

  const filteredOffers = selectedCategory === 'all' 
    ? offers 
    : offers.filter(offer => offer.category === selectedCategory);

  const calculateTimeLeft = (deadline: string) => {
    const difference = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Ending soon';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-4">
              <Percent className="h-5 w-5" />
              <span>{t.specials?.heroTag || 'Special Offers'}</span>
            </div>
            <h1 className="text-gray-900 mb-4">
              {t.specials?.title || 'Exclusive Special Offers'}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              {t.specials?.subtitle || 'Limited-time deals on premium building materials. Save big on bulk orders and featured products.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Promotional Announcements Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full mb-4">
              <Megaphone className="h-5 w-5" />
              <span>{t.specials?.promotions?.badge || 'Active Promotions'}</span>
            </div>
            <h2 className="text-gray-900 mb-2">
              {t.specials?.promotions?.title || 'Don\'t Miss Our Latest Promotions!'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t.specials?.promotions?.subtitle || 'Check out our current promotional campaigns and start placing your orders today'}
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="all">{t.specials?.promotions?.tabs?.all || 'All'}</TabsTrigger>
              <TabsTrigger value="video">
                <PlayCircle className="h-4 w-4 mr-2" />
                {t.specials?.promotions?.tabs?.video || 'Video'}
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                {t.specials?.promotions?.tabs?.text || 'Text'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {promotions.map((promo) => (
                <Card key={promo.id} className="overflow-hidden border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
                  <CardContent className="p-0">
                    {promo.type === 'video' ? (
                      <div className="grid md:grid-cols-2 gap-0">
                        <div className="aspect-video md:aspect-auto">
                          <iframe
                            className="w-full h-full min-h-[300px]"
                            src={promo.videoUrl}
                            title={promo.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                          <Badge className="bg-red-500 text-white border-0 w-fit mb-4">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            {t.specials?.promotions?.videoPromo || 'Video Promotion'}
                          </Badge>
                          <h3 className="text-gray-900 mb-4">{promo.title}</h3>
                          <p className="text-gray-600 mb-6">{promo.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{t.specials?.promotions?.validUntil || 'Valid until'}: {new Date(promo.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {t.specials?.promotions?.orderNow || 'Order Now'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge className="bg-blue-500 text-white border-0 mb-4">
                              <FileText className="h-3 w-3 mr-1" />
                              {t.specials?.promotions?.textPromo || 'Special Announcement'}
                            </Badge>
                            <h3 className="text-gray-900 mb-2">{promo.title}</h3>
                          </div>
                          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                            {t.specials?.promotions?.active || 'Active'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-6 text-lg">{promo.description}</p>
                        {promo.highlights && (
                          <div className="bg-white rounded-lg p-6 mb-6 border border-orange-100">
                            <div className="grid sm:grid-cols-2 gap-3">
                              {promo.highlights.map((highlight, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-700">
                                  <span className="text-orange-600">{highlight}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-4">
                          <Button className="bg-orange-600 hover:bg-orange-700">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {t.specials?.promotions?.orderNow || 'Order Now'}
                          </Button>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{t.specials?.promotions?.validUntil || 'Valid until'}: {new Date(promo.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="video" className="space-y-6">
              {promotions.filter(p => p.type === 'video').map((promo) => (
                <Card key={promo.id} className="overflow-hidden border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-video md:aspect-auto">
                        <iframe
                          className="w-full h-full min-h-[300px]"
                          src={promo.videoUrl}
                          title={promo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        <Badge className="bg-red-500 text-white border-0 w-fit mb-4">
                          <PlayCircle className="h-3 w-3 mr-1" />
                          {t.specials?.promotions?.videoPromo || 'Video Promotion'}
                        </Badge>
                        <h3 className="text-gray-900 mb-4">{promo.title}</h3>
                        <p className="text-gray-600 mb-6">{promo.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{t.specials?.promotions?.validUntil || 'Valid until'}: {new Date(promo.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {t.specials?.promotions?.orderNow || 'Order Now'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="text" className="space-y-6">
              {promotions.filter(p => p.type === 'text').map((promo) => (
                <Card key={promo.id} className="overflow-hidden border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge className="bg-blue-500 text-white border-0 mb-4">
                          <FileText className="h-3 w-3 mr-1" />
                          {t.specials?.promotions?.textPromo || 'Special Announcement'}
                        </Badge>
                        <h3 className="text-gray-900 mb-2">{promo.title}</h3>
                      </div>
                      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                        {t.specials?.promotions?.active || 'Active'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-6 text-lg">{promo.description}</p>
                    {promo.highlights && (
                      <div className="bg-white rounded-lg p-6 mb-6 border border-orange-100">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {promo.highlights.map((highlight, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-gray-700">
                              <span className="text-orange-600">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t.specials?.promotions?.orderNow || 'Order Now'}
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{t.specials?.promotions?.validUntil || 'Valid until'}: {new Date(promo.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
        {/* Category Filters */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  selectedCategory === category.id 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-600'
                }`}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Highlight Section */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">{t.specials?.highlights?.flash || 'Flash Sales'}</h3>
              <p className="text-gray-600 text-sm">
                {t.specials?.highlights?.flashDesc || 'Limited-time offers with massive discounts'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">{t.specials?.highlights?.bulk || 'Bulk Discounts'}</h3>
              <p className="text-gray-600 text-sm">
                {t.specials?.highlights?.bulkDesc || 'Save more when you order in volume'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">{t.specials?.highlights?.bundle || 'Bundle Deals'}</h3>
              <p className="text-gray-600 text-sm">
                {t.specials?.highlights?.bundleDesc || 'Get complete packages at special prices'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <Badge className={`absolute top-4 left-4 ${offer.badgeColor} text-white border-0`}>
                  {offer.badge}
                </Badge>
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1">
                  <span className="text-orange-600">-{offer.discount}</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{calculateTimeLeft(offer.deadline)}</span>
                </div>
                <h3 className="text-gray-900 mb-2">{offer.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {offer.description}
                </p>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-gray-400 line-through">{offer.originalPrice}</span>
                  <span className="text-orange-600">{offer.salePrice}</span>
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 group">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t.specials?.viewDeal || 'View Deal'}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-12 text-center text-white">
          <h2 className="text-gray-900 mb-4">
            {t.specials?.ctaTitle || 'Don\'t Miss Out on These Exclusive Offers'}
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            {t.specials?.ctaDesc || 'Subscribe to our newsletter and be the first to know about new deals and special promotions.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder={t.specials?.emailPlaceholder || 'Enter your email'}
              className="flex-1 px-6 py-3 rounded-lg text-gray-900"
            />
            <Button className="bg-white text-orange-600 hover:bg-gray-100 px-8">
              {t.specials?.subscribe || 'Subscribe'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
