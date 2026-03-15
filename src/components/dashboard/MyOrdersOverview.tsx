import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TruckIcon,
  ArrowRight,
  TrendingUp,
  Package,
  AlertCircle,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useInquiry } from '../../contexts/InquiryContext';
import { useUser } from '../../contexts/UserContext';

interface MyOrdersOverviewProps {
  activeOrders: any[];
  orderHistory: any[];
  onNavigate?: (view: string) => void;
  onTabChange: (tab: string) => void;
}

export function MyOrdersOverview({ activeOrders, orderHistory, onNavigate, onTabChange }: MyOrdersOverviewProps) {
  const { user } = useUser();
  const { getUserInquiries } = useInquiry();
  
  // Get inquiries for current user
  const inquiries = user ? getUserInquiries(user.email) : [];
  
  // Calculate statistics
  const totalInquiries = inquiries.length;
  const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;
  const quotedInquiries = inquiries.filter(i => i.status === 'quoted').length;
  const approvedInquiries = inquiries.filter(i => i.status === 'approved').length;
  
  const totalActiveOrders = activeOrders.length;
  const totalCompletedOrders = orderHistory.length;
  const totalOrders = totalActiveOrders + totalCompletedOrders;
  
  // Calculate conversion rates
  const inquiryToQuoteRate = totalInquiries > 0 ? (quotedInquiries / totalInquiries * 100) : 0;
  const quoteToOrderRate = quotedInquiries > 0 ? (approvedInquiries / quotedInquiries * 100) : 0;
  const overallConversionRate = totalInquiries > 0 ? (approvedInquiries / totalInquiries * 100) : 0;
  
  // Recent activities
  const recentActivities = [
    ...inquiries.slice(0, 2).map(inq => ({
      id: inq.id,
      type: 'ing',
      title: `ING ${inq.id}`,
      description: inq.products?.[0]?.productName || 'Product inquiry',
      status: inq.status,
      date: inq.date,
      action: () => onTabChange('inquiries')
    })),
    ...activeOrders.slice(0, 2).map(order => ({
      id: order.id,
      type: 'order',
      title: `Order ${order.id}`,
      description: `${order.products?.length || 0} items - ${order.status}`,
      status: order.status,
      date: order.date,
      action: () => onTabChange('active')
    }))
  ].slice(0, 5);

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* Key Metrics - 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Inquiries */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group"
          onClick={() => onTabChange('inquiries')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Total Inquiries
              </div>
              <div className="text-gray-900 text-3xl mb-1" style={{ fontWeight: 700, lineHeight: 1 }}>
                {totalInquiries}
              </div>
              <div className="text-gray-500 text-[11px]" style={{ fontWeight: 400 }}>
                {pendingInquiries} pending • {quotedInquiries} quoted
              </div>
            </div>
            <div className="bg-[#0D3B66] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#0A2F52] transition-colors">
              <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#F96302] text-[11px]" style={{ fontWeight: 600 }}>
            <span className="uppercase">View All</span>
            <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </div>
        </div>

        {/* Quotations */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group"
          onClick={() => onTabChange('quotations')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Quotations
              </div>
              <div className="text-gray-900 text-3xl mb-1" style={{ fontWeight: 700, lineHeight: 1 }}>
                {quotedInquiries}
              </div>
              <div className="text-gray-500 text-[11px]" style={{ fontWeight: 400 }}>
                Pending your review
              </div>
            </div>
            <div className="bg-[#0891B2] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#0E7490] transition-colors">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#F96302] text-[11px]" style={{ fontWeight: 600 }}>
            <span className="uppercase">View All</span>
            <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </div>
        </div>

        {/* Active Orders */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group"
          onClick={() => onTabChange('active')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Active Orders
              </div>
              <div className="text-gray-900 text-3xl mb-1" style={{ fontWeight: 700, lineHeight: 1 }}>
                {totalActiveOrders}
              </div>
              <div className="text-gray-500 text-[11px]" style={{ fontWeight: 400 }}>
                Currently in progress
              </div>
            </div>
            <div className="bg-[#F59E0B] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#D97706] transition-colors">
              <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#F96302] text-[11px]" style={{ fontWeight: 600 }}>
            <span className="uppercase">View All</span>
            <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </div>
        </div>

        {/* Completed Orders */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all cursor-pointer group"
          onClick={() => onTabChange('completed')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Completed Orders
              </div>
              <div className="text-gray-900 text-3xl mb-1" style={{ fontWeight: 700, lineHeight: 1 }}>
                {totalCompletedOrders}
              </div>
              <div className="text-gray-500 text-[11px]" style={{ fontWeight: 400 }}>
                Successfully delivered
              </div>
            </div>
            <div className="bg-[#2E7D32] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#256428] transition-colors">
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#F96302] text-[11px]" style={{ fontWeight: 600 }}>
            <span className="uppercase">View All</span>
            <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-5 hover:border-[#F96302] transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-gray-600 uppercase tracking-wide mb-2 text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                Conversion Rate
              </div>
              <div className="text-gray-900 text-3xl mb-1" style={{ fontWeight: 700, lineHeight: 1 }}>
                {overallConversionRate.toFixed(0)}%
              </div>
              <div className="text-gray-500 text-[11px]" style={{ fontWeight: 400 }}>
                Inquiry to Order
              </div>
            </div>
            <div className="bg-[#6B46C1] w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#5A3BA5] transition-colors">
              <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <Progress value={overallConversionRate} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Flow Funnel */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-6 py-4">
            <h3 className="text-gray-900 uppercase tracking-wide flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
              <Package className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
              Order Flow Pipeline
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Inquiry Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0D3B66]" strokeWidth={2.5} />
                  <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>INQUIRIES</span>
                </div>
                <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 700 }}>{totalInquiries}</span>
              </div>
              <Progress value={100} className="h-2 bg-gray-200" />
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>

            {/* Quotation Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#2E7D32]" strokeWidth={2.5} />
                  <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>QUOTATIONS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 700 }}>{quotedInquiries}</span>
                  <span className="text-[#2E7D32] text-[11px]" style={{ fontWeight: 600 }}>
                    {inquiryToQuoteRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <Progress value={inquiryToQuoteRate} className="h-2 bg-gray-200" />
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>

            {/* Order Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F96302]" strokeWidth={2.5} />
                  <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>ORDERS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 700 }}>{approvedInquiries}</span>
                  <span className="text-[#F96302] text-[11px]" style={{ fontWeight: 600 }}>
                    {quoteToOrderRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <Progress value={quoteToOrderRate} className="h-2 bg-gray-200" />
            </div>

            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 uppercase text-[11px]" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                  Overall Conversion
                </span>
                <span className="text-[#F96302]" style={{ fontSize: '18px', fontWeight: 700 }}>
                  {overallConversionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-6 py-4">
            <h3 className="text-gray-900 uppercase tracking-wide flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
              <Clock className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 hover:border-[#F96302]"
                    onClick={activity.action}
                  >
                    <div className="flex-shrink-0">
                      {activity.type === 'ing' ? (
                        <div className="w-10 h-10 bg-[#0D3B66] rounded-sm flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[#F96302] rounded-sm flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 truncate" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {activity.title}
                        </span>
                        <span className="text-gray-500 text-[11px] flex-shrink-0 ml-2" style={{ fontWeight: 400 }}>
                          {activity.date}
                        </span>
                      </div>
                      <p className="text-gray-600 text-[12px] truncate" style={{ fontWeight: 400 }}>
                        {activity.description}
                      </p>
                      <div className="mt-2">
                        {activity.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-yellow-100 text-yellow-800 text-[10px]" style={{ fontWeight: 600 }}>
                            PENDING
                          </span>
                        )}
                        {activity.status === 'quoted' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-blue-100 text-blue-800 text-[10px]" style={{ fontWeight: 600 }}>
                            QUOTED
                          </span>
                        )}
                        {activity.status === 'approved' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-green-100 text-green-800 text-[10px]" style={{ fontWeight: 600 }}>
                            APPROVED
                          </span>
                        )}
                        {activity.status === 'in_transit' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-orange-100 text-orange-800 text-[10px]" style={{ fontWeight: 600 }}>
                            IN TRANSIT
                          </span>
                        )}
                        {activity.status === 'delivered' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-green-100 text-green-800 text-[10px]" style={{ fontWeight: 600 }}>
                            DELIVERED
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" strokeWidth={2} />
                <p className="text-gray-600" style={{ fontSize: '13px', fontWeight: 400 }}>
                  No recent activity
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-6">
        <h3 className="text-gray-900 uppercase tracking-wide mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => onTabChange('inquiries')}
            className="h-auto py-4 bg-[#0D3B66] hover:bg-[#0A2F52] text-white border-0 rounded-sm justify-start"
          >
            <FileText className="w-5 h-5 mr-3" strokeWidth={2.5} />
            <div className="text-left">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Submit New Inquiry</div>
              <div className="text-[11px] opacity-80" style={{ fontWeight: 400 }}>Request a quotation</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => onTabChange('tracking')}
            className="h-auto py-4 bg-[#F96302] hover:bg-[#E05502] text-white border-0 rounded-sm justify-start"
          >
            <TruckIcon className="w-5 h-5 mr-3" strokeWidth={2.5} />
            <div className="text-left">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Track Shipment</div>
              <div className="text-[11px] opacity-80" style={{ fontWeight: 400 }}>Check order status</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => onTabChange('quotations')}
            className="h-auto py-4 bg-[#2E7D32] hover:bg-[#256428] text-white border-0 rounded-sm justify-start"
          >
            <DollarSign className="w-5 h-5 mr-3" strokeWidth={2.5} />
            <div className="text-left">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>View Quotations</div>
              <div className="text-[11px] opacity-80" style={{ fontWeight: 400 }}>Review pricing</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
