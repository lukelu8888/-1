import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Bell,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardOverviewProps {
  userEmail: string;
  onNavigate: (
    view:
      | 'overview'
      | 'profile'
      | 'my-orders'
      | 'my-products'
      | 'rate-request'
      | 'create-order'
      | 'analytics'
      | 'messages'
      | 'inquiries'
      | 'documents'
      | 'profit-analyzer'
      | 'supplier-evaluation'
  ) => void;
}

export function DashboardOverview({ userEmail, onNavigate }: DashboardOverviewProps) {
  // Mock data for charts
  const monthlyOrderData = [
    { month: 'Jan', orders: 12, revenue: 45000 },
    { month: 'Feb', orders: 19, revenue: 68000 },
    { month: 'Mar', orders: 15, revenue: 52000 },
    { month: 'Apr', orders: 25, revenue: 89000 },
    { month: 'May', orders: 22, revenue: 78000 },
    { month: 'Jun', orders: 30, revenue: 105000 },
  ];

  const recentActivities = [
    { id: 1, type: 'order', message: 'Order #ORD-2025-089 has been shipped', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'ing', message: 'New quotation received for ING #ING-456', time: '5 hours ago', status: 'info' },
    { id: 3, type: 'notification', message: 'New products added to catalog', time: '1 day ago', status: 'warning' },
    { id: 4, type: 'order', message: 'Order #ORD-2025-087 delivered successfully', time: '2 days ago', status: 'success' },
  ];

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* ========== Home Depot Style - KPI Cards ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group" 
          onClick={() => onNavigate('my-orders')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Active Orders
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                8
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                2 pending shipment
              </div>
            </div>
            <div className="bg-[#F96302] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#E55A00] transition-colors">
              <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center text-[#F96302] group-hover:text-[#E55A00] text-[11px]" style={{ fontWeight: 600 }}>
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.5} />
          </div>
        </div>

        {/* Pending Inquiries */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group" 
          onClick={() => onNavigate('inquiries')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Pending Inquiries
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                5
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                3 awaiting quotation
              </div>
            </div>
            <div className="bg-[#0D3B66] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#0A2F52] transition-colors">
              <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center text-[#F96302] group-hover:text-[#E55A00] text-[11px]" style={{ fontWeight: 600 }}>
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.5} />
          </div>
        </div>

        {/* Completed Orders */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group" 
          onClick={() => onNavigate('my-orders')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Completed Orders
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                156
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                Total lifetime orders
              </div>
            </div>
            <div className="bg-[#2E7D32] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#256428] transition-colors">
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center text-[#F96302] group-hover:text-[#E55A00] text-[11px]" style={{ fontWeight: 600 }}>
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.5} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Total Revenue
              </div>
              <div className="text-gray-900 text-3xl" style={{ fontWeight: 700, lineHeight: 1 }}>
                $437K
              </div>
              <div className="text-gray-500 mt-1.5 text-[11px]" style={{ fontWeight: 400 }}>
                All time purchases
              </div>
            </div>
            <div className="bg-[#6B46C1] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#5A3BA5] transition-colors">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center text-[#2E7D32] text-[11px]" style={{ fontWeight: 600 }}>
            <TrendingUp className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
            <span>+12% vs last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Orders Trend */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-5 py-3">
            <h3 className="text-gray-900 uppercase tracking-wide text-xs" style={{ fontWeight: 700 }}>
              Monthly Order Trends
            </h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyOrderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" style={{ fontSize: '11px', fontWeight: 600 }} />
                <YAxis style={{ fontSize: '11px', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #F96302',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 600
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="orders" stroke="#F96302" strokeWidth={3} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-5 py-3">
            <h3 className="text-gray-900 uppercase tracking-wide text-xs" style={{ fontWeight: 700 }}>
              Monthly Revenue (USD)
            </h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyOrderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" style={{ fontSize: '11px', fontWeight: 600 }} />
                <YAxis style={{ fontSize: '11px', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #F96302',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 600
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="revenue" fill="#F96302" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-5 py-3">
            <h3 className="text-gray-900 uppercase tracking-wide text-xs" style={{ fontWeight: 700 }}>
              Recent Activity
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b-2 border-gray-100 last:border-b-0 last:pb-0">
                  <div className={`
                    w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0
                    ${activity.status === 'success' ? 'bg-[#2E7D32]' : ''}
                    ${activity.status === 'info' ? 'bg-[#0D3B66]' : ''}
                    ${activity.status === 'warning' ? 'bg-[#F96302]' : ''}
                  `} />
                  <div className="flex-1">
                    <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>{activity.message}</p>
                    <p className="text-gray-500 mt-0.5 text-[10px]" style={{ fontWeight: 500 }}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-5 py-3">
            <h3 className="text-gray-900 uppercase tracking-wide text-xs" style={{ fontWeight: 700 }}>
              Quick Actions
            </h3>
          </div>
          <div className="p-5 space-y-2.5">
            <Button 
              className="w-full justify-between bg-[#F96302] hover:bg-[#E55A00] text-white border-0 rounded-sm shadow-sm h-11 text-xs"
              onClick={() => onNavigate('create-order')}
              style={{ fontWeight: 700 }}
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" strokeWidth={2.5} />
                CREATE NEW ORDER
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
            <Button 
              className="w-full justify-between bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-sm shadow-sm h-11 text-xs"
              onClick={() => onNavigate('inquiries')}
              style={{ fontWeight: 700 }}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" strokeWidth={2.5} />
                SUBMIT INQUIRY
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
            <Button 
              className="w-full justify-between bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-sm shadow-sm h-11 text-xs"
              onClick={() => onNavigate('analytics')}
              style={{ fontWeight: 700 }}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                VIEW ANALYTICS
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto py-4 px-6 hover:bg-gray-50 justify-between border-2 hover:border-[#F96302] transition-all group"
              onClick={() => onNavigate('my-products')}
              style={{ fontWeight: 700 }}
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" strokeWidth={2.5} />
                MY PRODUCTS
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
