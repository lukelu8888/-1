import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  Search,
  DollarSign,
  Calendar,
  Clock,
  ExternalLink,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function MyProducts() {
  const [activeTab, setActiveTab] = useState('updates');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  // Mock items ordered data
  const itemsOrdered = [
    {
      id: 'ITM-001',
      sku: 'LED-60X60-001',
      name: 'LED Panel Light 60x60cm',
      category: 'Lighting',
      image: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=200&h=200&fit=crop',
      totalOrders: 8,
      totalQuantity: 12500,
      totalSpent: 193750,
      avgPrice: 15.50,
      lastOrderDate: '2024-12-15',
      firstOrderDate: '2024-01-20',
      priceChange: 0,
      orderHistory: [
        { date: '2024-01-20', orderNo: 'ORD-20240120-1001', qty: 1000, price: 15.50, total: 15500 },
        { date: '2024-03-15', orderNo: 'ORD-20240315-2003', qty: 1500, price: 15.50, total: 23250 },
        { date: '2024-05-10', orderNo: 'ORD-20240510-3005', qty: 2000, price: 15.50, total: 31000 },
        { date: '2024-06-22', orderNo: 'ORD-20240622-4007', qty: 1500, price: 15.50, total: 23250 },
        { date: '2024-08-05', orderNo: 'ORD-20240805-5009', qty: 2000, price: 15.50, total: 31000 },
        { date: '2024-09-18', orderNo: 'ORD-20240918-6011', qty: 1500, price: 15.50, total: 23250 },
        { date: '2024-11-03', orderNo: 'ORD-20241103-7013', qty: 1500, price: 15.50, total: 23250 },
        { date: '2024-12-15', orderNo: 'ORD-20241215-8934', qty: 1500, price: 15.50, total: 23250 },
      ]
    },
    {
      id: 'ITM-002',
      sku: 'SSH-HANDLE-002',
      name: 'Stainless Steel Door Handle',
      category: 'Hardware',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      totalOrders: 6,
      totalQuantity: 18000,
      totalSpent: 45000,
      avgPrice: 2.50,
      lastOrderDate: '2024-11-28',
      firstOrderDate: '2024-02-10',
      priceChange: 0,
      orderHistory: [
        { date: '2024-02-10', orderNo: 'ORD-20240210-1234', qty: 2000, price: 2.50, total: 5000 },
        { date: '2024-04-05', orderNo: 'ORD-20240405-2345', qty: 3000, price: 2.50, total: 7500 },
        { date: '2024-06-12', orderNo: 'ORD-20240612-3456', qty: 3500, price: 2.50, total: 8750 },
        { date: '2024-08-20', orderNo: 'ORD-20240820-4567', qty: 3000, price: 2.50, total: 7500 },
        { date: '2024-10-08', orderNo: 'ORD-20241008-5678', qty: 3500, price: 2.50, total: 8750 },
        { date: '2024-11-28', orderNo: 'ORD-20241128-7823', qty: 3000, price: 2.50, total: 7500 },
      ]
    },
    {
      id: 'ITM-003',
      sku: 'TILE-CERAMIC-003',
      name: 'Ceramic Floor Tiles 60x60cm',
      category: 'Tiles',
      image: 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop',
      totalOrders: 5,
      totalQuantity: 35000,
      totalSpent: 311500,
      avgPrice: 8.90,
      lastOrderDate: '2024-10-15',
      firstOrderDate: '2024-03-05',
      priceChange: 0,
      orderHistory: [
        { date: '2024-03-05', orderNo: 'ORD-20240305-2211', qty: 5000, price: 8.90, total: 44500 },
        { date: '2024-05-20', orderNo: 'ORD-20240520-3322', qty: 8000, price: 8.90, total: 71200 },
        { date: '2024-07-10', orderNo: 'ORD-20240710-4433', qty: 7000, price: 8.90, total: 62300 },
        { date: '2024-09-02', orderNo: 'ORD-20240902-5544', qty: 7000, price: 8.90, total: 62300 },
        { date: '2024-10-15', orderNo: 'ORD-20241015-6712', qty: 8000, price: 8.90, total: 71200 },
      ]
    },
    {
      id: 'ITM-004',
      sku: 'LED-STRIP-004',
      name: 'LED Strip 5050',
      category: 'Lighting',
      image: 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=200&h=200&fit=crop',
      totalOrders: 7,
      totalQuantity: 3200,
      totalSpent: 28480,
      avgPrice: 8.90,
      lastOrderDate: '2024-12-15',
      firstOrderDate: '2024-01-25',
      priceChange: 0,
      orderHistory: [
        { date: '2024-01-25', orderNo: 'ORD-20240125-1111', qty: 400, price: 8.90, total: 3560 },
        { date: '2024-03-18', orderNo: 'ORD-20240318-2222', qty: 500, price: 8.90, total: 4450 },
        { date: '2024-05-12', orderNo: 'ORD-20240512-3333', qty: 500, price: 8.90, total: 4450 },
        { date: '2024-07-05', orderNo: 'ORD-20240705-4444', qty: 400, price: 8.90, total: 3560 },
        { date: '2024-09-10', orderNo: 'ORD-20240910-5555', qty: 500, price: 8.90, total: 4450 },
        { date: '2024-10-20', orderNo: 'ORD-20241020-6666', qty: 600, price: 8.90, total: 5340 },
        { date: '2024-12-15', orderNo: 'ORD-20241215-8934', qty: 300, price: 8.90, total: 2670 },
      ]
    },
    {
      id: 'ITM-005',
      sku: 'WALL-TILES-005',
      name: 'Wall Tiles Premium',
      category: 'Tiles',
      image: 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop',
      totalOrders: 4,
      totalQuantity: 16000,
      totalSpent: 104000,
      avgPrice: 6.50,
      lastOrderDate: '2024-09-20',
      firstOrderDate: '2024-04-08',
      priceChange: 0,
      orderHistory: [
        { date: '2024-04-08', orderNo: 'ORD-20240408-7777', qty: 4000, price: 6.50, total: 26000 },
        { date: '2024-06-15', orderNo: 'ORD-20240615-8888', qty: 4000, price: 6.50, total: 26000 },
        { date: '2024-08-12', orderNo: 'ORD-20240812-9999', qty: 2000, price: 6.50, total: 13000 },
        { date: '2024-09-20', orderNo: 'ORD-20240920-5601', qty: 6000, price: 6.50, total: 39000 },
      ]
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

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <span className="h-4 w-4 text-gray-400">—</span>;
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.type === filter;
  });

  const filteredItems = itemsOrdered.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'updates', label: 'Product Updates', icon: Bell },
    { id: 'ordered', label: 'Items Ordered', icon: Package }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">My Products</h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'updates' 
              ? 'Stay updated with new products and special offers' 
              : 'Track ordering history and trends for each product'}
          </p>
        </div>
        {activeTab === 'updates' && (
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <Badge className="bg-[#F96302]">{notifications.filter(n => n.isNew).length} New</Badge>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#F96302] text-[#F96302]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </CardContent>
      </Card>

      {/* Product Updates Tab */}
      {activeTab === 'updates' && (
        <>
          {/* Filter Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
                >
                  All Updates ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'new_product' ? 'default' : 'outline'}
                  onClick={() => setFilter('new_product')}
                  className={filter === 'new_product' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  New Products
                </Button>
                <Button
                  variant={filter === 'price_update' ? 'default' : 'outline'}
                  onClick={() => setFilter('price_update')}
                  className={filter === 'price_update' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Special Offers
                </Button>
                <Button
                  variant={filter === 'restock' ? 'default' : 'outline'}
                  onClick={() => setFilter('restock')}
                  className={filter === 'restock' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
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
                className={`hover:shadow-lg transition-all ${notification.isNew ? 'border-2 border-[#F96302]' : ''}`}
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
                        <Badge className="bg-[#F96302]">NEW</Badge>
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
                      <h3 className="text-lg text-gray-900 mb-2">{notification.title}</h3>
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
                          <span className="text-lg text-[#F96302]">{notification.price}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">MOQ</p>
                        <p className="text-sm text-gray-900">{notification.moq}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      <Button size="sm" className="flex-1 bg-[#F96302] hover:bg-[#E05502] text-white">
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
                <h3 className="text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">Check back later for new product updates and offers</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Items Ordered Tab */}
      {activeTab === 'ordered' && (
        <>
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Items</p>
                  <p className="text-3xl text-gray-900">{filteredItems.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p className="text-3xl text-gray-900">
                    {filteredItems.reduce((sum, item) => sum + item.totalOrders, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Quantity</p>
                  <p className="text-3xl text-gray-900">
                    {filteredItems.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                  <p className="text-3xl text-gray-900">
                    ${filteredItems.reduce((sum, item) => sum + item.totalSpent, 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold" style={{ fontSize: '14px' }}>Product</TableHead>
                      <TableHead className="font-bold" style={{ fontSize: '14px' }}>SKU</TableHead>
                      <TableHead className="font-bold" style={{ fontSize: '14px' }}>Category</TableHead>
                      <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Orders</TableHead>
                      <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Total Qty</TableHead>
                      <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Avg Price</TableHead>
                      <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Total Spent</TableHead>
                      <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Last Order</TableHead>
                      <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsDetailOpen(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                {item.name}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-gray-700">{item.sku}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right text-gray-900">{item.totalOrders}</TableCell>
                        <TableCell className="text-xs text-right text-gray-900">{item.totalQuantity.toLocaleString()} pcs</TableCell>
                        <TableCell className="text-xs text-right text-gray-900">
                          <div className="flex items-center justify-end gap-1">
                            ${item.avgPrice.toFixed(2)}
                            {getPriceChangeIcon(item.priceChange)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right text-gray-900">${item.totalSpent.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right text-gray-700">{item.lastOrderDate}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-3"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDetailOpen(true);
                              }}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Item Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b px-8 py-4">
            <div className="flex items-center gap-4">
              <DialogTitle className="sr-only">
                Item Details - {selectedItem?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Complete ordering history and analytics for this product
              </DialogDescription>
              <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                <img 
                  src={selectedItem?.image} 
                  alt={selectedItem?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xl">{selectedItem?.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-3">
                  <span>SKU: {selectedItem?.sku}</span>
                  <span>•</span>
                  <Badge variant="outline">{selectedItem?.category}</Badge>
                </div>
              </div>
            </div>
          </div>
          {selectedItem && (
            <div className="p-8 space-y-6 bg-white">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-xs">Total Orders</span>
                    </div>
                    <p className="text-2xl text-gray-900">{selectedItem.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs">Total Quantity</span>
                    </div>
                    <p className="text-2xl text-gray-900">{selectedItem.totalQuantity.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Total Spent</span>
                    </div>
                    <p className="text-2xl text-gray-900">${selectedItem.totalSpent.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Avg Price</span>
                    </div>
                    <p className="text-2xl text-gray-900">${selectedItem.avgPrice.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Last Order</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedItem.lastOrderDate}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Quantity Trend Chart */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="mb-4 text-gray-900">Order Quantity Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={selectedItem.orderHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="qty" 
                        stroke="#F96302" 
                        strokeWidth={2}
                        dot={{ fill: '#F96302', r: 4 }}
                        name="Quantity (pcs)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Order Value Trend Chart */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="mb-4 text-gray-900">Order Value Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={selectedItem.orderHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#2563eb"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Order Value ($)', angle: -90, position: 'insideLeft', style: { fill: '#2563eb' } }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#16a34a"
                        style={{ fontSize: '12px' }}
                        domain={[0, (dataMax: number) => {
                          const maxOrderValue = Math.max(...selectedItem.orderHistory.map((o: any) => o.total));
                          return Math.max(dataMax * 2.5, maxOrderValue / 500);
                        }]}
                        label={{ value: 'Unit Price ($)', angle: 90, position: 'insideRight', style: { fill: '#16a34a' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="total" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        name="Order Value ($)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="price" 
                        stroke="#16a34a" 
                        strokeWidth={2}
                        dot={{ fill: '#16a34a', r: 4 }}
                        name="Unit Price ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Order History Table */}
              <div>
                <h4 className="mb-3 text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#F96302]" />
                  Complete Order History & Timeline
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Order No.</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Price Change</TableHead>
                        <TableHead className="text-right">Days Since Last</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItem.orderHistory.slice().reverse().map((order: any, idx: number) => {
                        const reversedHistory = selectedItem.orderHistory.slice().reverse();
                        const prevOrder = idx > 0 ? reversedHistory[idx - 1] : null;
                        
                        const daysSince = prevOrder 
                          ? Math.floor((new Date(prevOrder.date).getTime() - new Date(order.date).getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        const priceChange = prevOrder ? order.price - prevOrder.price : 0;
                        const priceChangePercent = prevOrder ? ((priceChange / prevOrder.price) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <TableRow key={idx} className={idx === 0 ? 'bg-blue-50' : ''}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  idx === 0 ? 'bg-[#F96302] text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  <span className="text-xs">{selectedItem.orderHistory.length - idx}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{order.date}</TableCell>
                            <TableCell className="font-mono text-sm text-blue-600">{order.orderNo}</TableCell>
                            <TableCell className="text-right text-gray-900">{order.qty.toLocaleString()} pcs</TableCell>
                            <TableCell className="text-right text-gray-900">${order.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-gray-900">${order.total.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {priceChange === 0 ? (
                                <span className="text-gray-400">—</span>
                              ) : priceChange > 0 ? (
                                <span className="text-red-600 flex items-center justify-end gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  +{priceChangePercent}%
                                </span>
                              ) : (
                                <span className="text-green-600 flex items-center justify-end gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  {priceChangePercent}%
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {daysSince !== null ? (
                                <Badge variant="outline" className="text-xs">
                                  {daysSince} days
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">First Order</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="text-right text-gray-900">
                        TOTAL:
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        {selectedItem.totalQuantity.toLocaleString()} pcs
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        ${selectedItem.avgPrice.toFixed(2)} avg
                      </TableCell>
                      <TableCell className="text-right text-[#F96302] text-lg">
                        ${selectedItem.totalSpent.toLocaleString()}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
