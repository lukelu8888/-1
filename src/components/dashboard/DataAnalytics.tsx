import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function DataAnalytics() {
  const [timeRange, setTimeRange] = useState('year');
  const [selectedProduct, setSelectedProduct] = useState('all');

  // Mock data for yearly trend
  const yearlyData = [
    { month: 'Jan', orders: 12, revenue: 45000, quantity: 8500 },
    { month: 'Feb', orders: 19, revenue: 68000, quantity: 12000 },
    { month: 'Mar', orders: 15, revenue: 52000, quantity: 9500 },
    { month: 'Apr', orders: 25, revenue: 89000, quantity: 15000 },
    { month: 'May', orders: 22, revenue: 78000, quantity: 13500 },
    { month: 'Jun', orders: 30, revenue: 105000, quantity: 18000 },
    { month: 'Jul', orders: 28, revenue: 98000, quantity: 16500 },
    { month: 'Aug', orders: 32, revenue: 115000, quantity: 19500 },
    { month: 'Sep', orders: 27, revenue: 92000, quantity: 15800 },
    { month: 'Oct', orders: 35, revenue: 125000, quantity: 21000 },
    { month: 'Nov', orders: 31, revenue: 108000, quantity: 18500 },
    { month: 'Dec', orders: 29, revenue: 102000, quantity: 17500 },
  ];

  // Mock data for monthly trend
  const monthlyData = [
    { week: 'Week 1', orders: 7, revenue: 25000 },
    { week: 'Week 2', orders: 8, revenue: 28000 },
    { week: 'Week 3', orders: 9, revenue: 32000 },
    { week: 'Week 4', orders: 11, revenue: 40000 },
  ];

  // Mock data for weekly trend
  const weeklyData = [
    { day: 'Mon', orders: 2, revenue: 7000 },
    { day: 'Tue', orders: 3, revenue: 9500 },
    { day: 'Wed', orders: 1, revenue: 4500 },
    { day: 'Thu', orders: 2, revenue: 8000 },
    { day: 'Fri', orders: 4, revenue: 12000 },
    { day: 'Sat', orders: 1, revenue: 3500 },
    { day: 'Sun', orders: 0, revenue: 0 },
  ];

  // Product comparison data
  const productData = [
    { product: 'LED Panel Light', price: 15.50, qty: 12500, revenue: 193750 },
    { product: 'Door Handle', price: 2.50, qty: 25000, revenue: 62500 },
    { product: 'Floor Tiles', price: 8.90, qty: 45000, revenue: 400500 },
    { product: 'LED Strip', price: 8.90, qty: 8000, revenue: 71200 },
  ];

  const getData = () => {
    switch (timeRange) {
      case 'week':
        return weeklyData;
      case 'month':
        return monthlyData;
      case 'year':
      default:
        return yearlyData;
    }
  };

  const currentData = getData();
  const totalRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  // Calculate trends
  const revenueGrowth = 12.5; // Mock value
  const orderGrowth = 8.3; // Mock value

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your order history</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">+{revenueGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">+{orderGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${Math.round(avgOrderValue).toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">+4.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">{revenueGrowth}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">Excellent</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={currentData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeRange === 'year' ? 'month' : timeRange === 'month' ? 'week' : 'day'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#dc2626" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                name="Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders and Quantity Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={timeRange === 'year' ? 'month' : timeRange === 'month' ? 'week' : 'day'} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#dc2626" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#dc2626" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Sales Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Product</th>
                  <th className="px-6 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-6 py-3 text-right font-semibold">Total Quantity</th>
                  <th className="px-6 py-3 text-right font-semibold">Total Revenue</th>
                  <th className="px-6 py-3 text-right font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productData.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{product.product}</td>
                    <td className="px-6 py-4 text-right">${product.price}</td>
                    <td className="px-6 py-4 text-right">{product.qty.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-semibold">${product.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-semibold">+12%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
