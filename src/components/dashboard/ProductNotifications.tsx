import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { 
  Bell, 
  Star, 
  Eye,
  Heart,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Package,
  AlertCircle
} from 'lucide-react';

export function ProductNotifications() {
  const [filter, setFilter] = useState('all');

  // Mock new product notifications
  const notifications = [
    {
      id: 1,
      type: 'new_product',
      title: 'New LED Smart Panel Light Series',
      description: 'Premium RGBW LED panels with WiFi control, energy-efficient design, and 5-year warranty.',
      image: 'https://images.unsplash.com/photo-1558089687-e4e4d0b0b5e5?w=400',
      date: '2025-01-20',
      isNew: true,
      tags: ['Hot Item', 'Energy Saving'],
      price: '$18.90',
      moq: '100 pcs',
      category: 'Lighting'
    },
    {
      id: 2,
      type: 'price_update',
      title: 'Special Discount: Stainless Steel Hardware',
      description: 'Limited time offer - 15% discount on all stainless steel door handles and hinges. Bulk orders welcome!',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      date: '2025-01-18',
      isNew: true,
      tags: ['Discount', 'Limited Offer'],
      price: '$2.13',
      originalPrice: '$2.50',
      moq: '500 pcs',
      category: 'Hardware'
    },
    {
      id: 3,
      type: 'new_product',
      title: 'Premium Ceramic Tiles Collection',
      description: 'New designer series ceramic tiles with anti-slip surface. Available in 10 modern patterns.',
      image: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=400',
      date: '2025-01-15',
      isNew: false,
      tags: ['Premium', 'Designer'],
      price: '$9.50/sqm',
      moq: '200 sqm',
      category: 'Building Materials'
    },
    {
      id: 4,
      type: 'restock',
      title: 'Back in Stock: Kitchen Cabinet Hardware',
      description: 'Popular kitchen cabinet hardware sets are back in stock. Order now to avoid wait times!',
      image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400',
      date: '2025-01-12',
      isNew: false,
      tags: ['Restocked', 'Popular'],
      price: '$12.50/set',
      moq: '300 sets',
      category: 'Hardware'
    },
    {
      id: 5,
      type: 'new_product',
      title: 'Eco-Friendly LED Strip Lights',
      description: 'Energy-efficient LED strips with low power consumption and high brightness. Perfect for commercial and residential use.',
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400',
      date: '2025-01-10',
      isNew: false,
      tags: ['Eco-Friendly', 'Best Seller'],
      price: '$9.90/roll',
      moq: '200 rolls',
      category: 'Lighting'
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_product':
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case 'price_update':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'restock':
        return <Package className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new_product':
        return 'New Product';
      case 'price_update':
        return 'Price Update';
      case 'restock':
        return 'Restocked';
      default:
        return 'Notification';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Updates</h1>
          <p className="text-gray-600 mt-1">Stay updated with new products and special offers</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <Badge className="bg-red-600">{notifications.filter(n => n.isNew).length} New</Badge>
        </div>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              All Updates ({notifications.length})
            </Button>
            <Button
              variant={filter === 'new_product' ? 'default' : 'outline'}
              onClick={() => setFilter('new_product')}
              className={filter === 'new_product' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Products
            </Button>
            <Button
              variant={filter === 'price_update' ? 'default' : 'outline'}
              onClick={() => setFilter('price_update')}
              className={filter === 'price_update' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Special Offers
            </Button>
            <Button
              variant={filter === 'restock' ? 'default' : 'outline'}
              onClick={() => setFilter('restock')}
              className={filter === 'restock' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <Package className="h-4 w-4 mr-2" />
              Restocked
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredNotifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`hover:shadow-lg transition-all ${notification.isNew ? 'border-2 border-red-600' : ''}`}
          >
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <ImageWithFallback
                  src={notification.image}
                  alt={notification.title}
                  className="w-full h-full object-cover"
                />
                {notification.isNew && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-600">NEW</Badge>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                    {getTypeIcon(notification.type)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                    <span className="text-xs text-gray-500">{notification.date}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{notification.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{notification.description}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {notification.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Price and MOQ */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <div className="flex items-center gap-2">
                      {notification.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{notification.originalPrice}</span>
                      )}
                      <span className="text-lg font-bold text-red-600">{notification.price}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">MOQ</p>
                    <p className="text-sm font-semibold text-gray-900">{notification.moq}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Inquire
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">Check back later for new product updates and offers</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
