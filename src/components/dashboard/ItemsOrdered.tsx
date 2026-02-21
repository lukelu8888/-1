import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  ExternalLink,
  BarChart3,
  Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ItemsOrdered() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Mock items ordered data with complete history
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

  const filteredItems = itemsOrdered.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <span className="h-4 w-4 text-gray-400">—</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Items Ordered</h1>
        <p className="text-gray-600 mt-1">Track ordering history and trends for each product</p>
      </div>

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
                        stroke="#dc2626" 
                        strokeWidth={2}
                        dot={{ fill: '#dc2626', r: 4 }}
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
                          // Calculate max order value to set appropriate scale
                          const maxOrderValue = Math.max(...selectedItem.orderHistory.map((o: any) => o.total));
                          // Make right axis range larger so unit price line stays below order value line
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
                  <Calendar className="h-5 w-5 text-red-600" />
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
                        
                        // Calculate days since last order
                        const daysSince = prevOrder 
                          ? Math.floor((new Date(prevOrder.date).getTime() - new Date(order.date).getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        // Calculate price change from previous order
                        const priceChange = prevOrder ? order.price - prevOrder.price : 0;
                        const priceChangePercent = prevOrder ? ((priceChange / prevOrder.price) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <TableRow key={idx} className={idx === 0 ? 'bg-blue-50' : ''}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  idx === 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
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
                      <TableCell className="text-right text-red-600 text-lg">
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