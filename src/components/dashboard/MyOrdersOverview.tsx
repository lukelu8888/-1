import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Package,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useInquiry } from '../../contexts/InquiryContext';
import { useUser } from '../../contexts/UserContext';
import { useOrders } from '../../contexts/OrderContext';
import { useSalesContracts } from '../../contexts/SalesContractContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { salesQuotationService } from '../../lib/supabaseService';
import { readCustomerQuotationCache, writeCustomerQuotationCache } from '../../lib/customerPortalCache';
import { filterNotDeleted } from '../../lib/erp-core/deletion-tombstone';
import { repeatEntryOverviewService, type RepeatEntryOverview } from '../../lib/services/repeat-entry/repeatEntryOverviewService';

interface MyOrdersOverviewProps {
  activeOrders: any[];
  orderHistory: any[];
  onNavigate?: (view: string) => void;
  onTabChange: (tab: string) => void;
}

function normalizePortalOrder(order: any) {
  if (!order) return order;
  return {
    ...order,
    orderNumber: order.orderNumber || order.order_number || '',
    customerEmail: order.customerEmail || order.customer_email || '',
    quotationId: order.quotationId || order.quotation_id || null,
    quotationNumber: order.quotationNumber || order.quotation_number || null,
    contractNumber: order.contractNumber || order.contract_number || null,
    expectedDelivery: order.expectedDelivery || order.expected_delivery || '',
    totalAmount: order.totalAmount ?? order.total_amount ?? 0,
    paymentStatus: order.paymentStatus || order.payment_status || '',
    shippingMethod: order.shippingMethod || order.shipping_method || '',
    trackingNumber: order.trackingNumber || order.tracking_number || '',
    createdAt: order.createdAt || order.created_at || null,
    updatedAt: order.updatedAt || order.updated_at || null,
  };
}

function toTimestamp(value: unknown) {
  if (!value) return 0;
  const date = new Date(String(value));
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatActivityDate(value: unknown) {
  if (!value) return '--';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

export function MyOrdersOverview({ activeOrders, orderHistory, onNavigate, onTabChange }: MyOrdersOverviewProps) {
  const { user } = useUser();
  const { getUserInquiries } = useInquiry();
  const { orders: allOrders } = useOrders();
  const { contracts } = useSalesContracts();
  const [repeatEntryOverview, setRepeatEntryOverview] = useState<RepeatEntryOverview | null>(null);
  const [repeatEntryLoading, setRepeatEntryLoading] = useState(false);
  const [serverQuotations, setServerQuotations] = useState<any[]>(() => readCustomerQuotationCache(user?.email));

  const customerEmail = String(getCurrentUser()?.email || user?.email || '').trim().toLowerCase();
  const inquiries = useMemo(
    () => (customerEmail ? getUserInquiries(customerEmail) : []),
    [customerEmail, getUserInquiries],
  );

  const visibleQuotations = useMemo(
    () =>
      (serverQuotations || [])
        .filter((quotation: any) =>
          filterNotDeleted('customer_quotation', [quotation], (item: any) => [
            String(item?.id || ''),
            String(item?.qtNumber || ''),
            String(item?.quotationNumber || ''),
          ]).length > 0
        )
        .filter((quotation: any) =>
          ['sent', 'viewed', 'accepted', 'rejected', 'negotiating', 'expired'].includes(
            String(quotation?.customerStatus || '').trim().toLowerCase(),
          )
        ),
    [serverQuotations],
  );

  const activeContractOrders = useMemo(() => {
    if (!customerEmail) return [];

    const sentStatuses = new Set([
      'sent_to_customer',
      'sent',
      'customer_confirmed',
      'deposit_uploaded',
      'deposit_confirmed',
      'payment_proof_uploaded',
      'balance_uploaded',
    ]);

    return (contracts || [])
      .filter((contract: any) => {
        const contractEmail = String(contract?.customerEmail || '').trim().toLowerCase();
        const isInvalidEmail = !contractEmail || contractEmail === 'n/a' || !contractEmail.includes('@');
        return sentStatuses.has(String(contract?.status || '').trim().toLowerCase()) && (contractEmail === customerEmail || isInvalidEmail);
      })
      .map((contract: any) =>
        normalizePortalOrder({
          id: contract.id,
          orderNumber: contract.contractNumber,
          customer: contract.customerName,
          customerEmail,
          quotationNumber: contract.quotationNumber,
          date: String(contract.createdAt || '').split('T')[0],
          expectedDelivery: contract.deliveryTime,
          totalAmount: contract.totalAmount,
          currency: contract.currency || 'USD',
          status:
            contract.status === 'customer_confirmed'
              ? 'Awaiting Deposit'
              : contract.status === 'deposit_uploaded'
                ? 'Payment Proof Uploaded'
                : contract.status === 'deposit_confirmed'
                  ? 'Deposit Received'
                  : contract.status === 'cancelled'
                    ? 'cancelled'
                    : 'Pending',
          progress: 0,
          products: (contract.products || []).map((product: any) => ({
            name: product.productName,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            totalPrice: (product.quantity || 0) * (product.unitPrice || 0),
            specs: product.specification || '',
          })),
          paymentStatus: 'Pending',
          paymentTerms: contract.paymentTerms,
          shippingMethod: contract.tradeTerms,
          deliveryTerms: contract.tradeTerms,
          region: contract.region,
          country: contract.customerCountry,
          deliveryAddress: contract.customerAddress,
          contactPerson: contract.contactPerson,
          phone: contract.contactPhone,
          createdFrom: 'sales_contract',
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
        }),
      );
  }, [contracts, customerEmail]);

  const activeOrderList = useMemo(() => {
    const contextOrders = (allOrders || [])
      .map((order) => normalizePortalOrder(order))
      .filter((order) => {
        const status = String(order?.status || '').trim().toLowerCase();
        return (
          customerEmail &&
          String(order?.customerEmail || '').trim().toLowerCase() === customerEmail &&
          status !== 'delivered' &&
          status !== 'completed' &&
          status !== 'cancelled'
        );
      });

    const seen = new Set<string>();
    return filterNotDeleted(
      'order',
      [...contextOrders, ...activeContractOrders].filter((order: any) => {
        const key = String(order?.orderNumber || order?.id || '').trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        const status = String(order?.status || '').trim().toLowerCase();
        return status !== 'delivered' && status !== 'completed' && status !== 'cancelled';
      }),
      (order: any) => [
        String(order?.id || ''),
        String(order?.orderNumber || ''),
        String(order?.quotationNumber || ''),
      ],
    );
  }, [activeContractOrders, allOrders, customerEmail]);

  const completedOrderList = useMemo(
    () =>
      filterNotDeleted(
        'order',
        (allOrders || []).filter((order: any) => {
          const status = String(order?.status || '').trim().toLowerCase();
          return (
            customerEmail &&
            String(order?.customerEmail || '').trim().toLowerCase() === customerEmail &&
            ['delivered', 'completed', 'cancelled'].includes(status)
          );
        }),
        (order: any) => [
          String(order?.id || ''),
          String(order?.orderNumber || ''),
          String(order?.quotationNumber || ''),
        ],
      ),
    [allOrders, customerEmail],
  );

  const totalInquiries = inquiries.length;
  const pendingInquiries = inquiries.filter((inquiry) => inquiry.status === 'pending').length;
  const quotedInquiryStatusCount = inquiries.filter((inquiry) => inquiry.status === 'quoted').length;
  const quotedInquiryScope = new Set(
    visibleQuotations
      .map((quotation: any) => String(quotation?.inqNumber || quotation?.inquiryNumber || '').trim())
      .filter(Boolean),
  );
  const quotedInquiries = Math.max(quotedInquiryStatusCount, quotedInquiryScope.size);
  const totalQuotations = visibleQuotations.length;
  const pendingReviewQuotations = visibleQuotations.filter((quotation: any) =>
    ['sent', 'viewed'].includes(String(quotation?.customerStatus || '').trim().toLowerCase()),
  ).length;
  const totalActiveOrders = activeOrderList.length;
  const totalCompletedOrders = completedOrderList.length;
  const totalOrders = totalActiveOrders + totalCompletedOrders;
  const conversionQualifiedStatuses = new Set([
    'customer_confirmed',
    'awaiting deposit',
    'deposit uploaded',
    'payment proof uploaded',
    'deposit received',
    'preparing production',
    'confirmed',
    'in production',
    'production',
    'quality inspection',
    'ready to ship',
    'shipped',
    'in_transit',
    'in transit',
    'delivered',
    'completed',
    'balance_confirmed',
  ]);
  const conversionOrderCount = [...activeOrderList, ...completedOrderList].filter((order: any) =>
    conversionQualifiedStatuses.has(String(order?.status || '').trim().toLowerCase()),
  ).length;

  const inquiryToQuoteRate = totalInquiries > 0 ? Math.min(100, (quotedInquiries / totalInquiries) * 100) : 0;
  const quoteToOrderRate = totalQuotations > 0 ? Math.min(100, (conversionOrderCount / totalQuotations) * 100) : 0;
  const overallConversionRate = totalInquiries > 0 ? Math.min(100, (conversionOrderCount / totalInquiries) * 100) : 0;

  useEffect(() => {
    let alive = true;

    const loadRepeatEntryOverview = async () => {
      if (!user?.email) {
        setRepeatEntryOverview(null);
        return;
      }

      setRepeatEntryLoading(true);
      try {
        const overview = await repeatEntryOverviewService.getByCustomerEmail(user.email, orderHistory);
        if (alive) {
          setRepeatEntryOverview(overview);
        }
      } catch (error) {
        console.warn('[MyOrdersOverview] Failed to load repeat entry overview:', error);
        if (alive) {
          setRepeatEntryOverview(null);
        }
      } finally {
        if (alive) {
          setRepeatEntryLoading(false);
        }
      }
    };

    void loadRepeatEntryOverview();

    const handleRefresh = () => {
      void loadRepeatEntryOverview();
    };

    window.addEventListener('draftOrderUpdated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      alive = false;
      window.removeEventListener('draftOrderUpdated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, [orderHistory, user?.email]);

  useEffect(() => {
    if (!user?.email) {
      setServerQuotations([]);
      return;
    }

    let alive = true;
    setServerQuotations(readCustomerQuotationCache(user.email));

    const loadQuotations = async () => {
      try {
        const rows = await salesQuotationService.getByCustomerEmail(user.email);
        if (!alive) return;
        const list = Array.isArray(rows) ? rows : [];
        setServerQuotations(list);
        writeCustomerQuotationCache(user.email, list);
      } catch (error) {
        console.warn('[MyOrdersOverview] Failed to load customer quotations:', error);
      }
    };

    void loadQuotations();

    return () => {
      alive = false;
    };
  }, [user?.email]);

  const recentActivities = useMemo(
    () =>
      [
        ...inquiries.map((inquiry: any) => ({
          id: `inq-${String(inquiry?.id || inquiry?.inquiryNumber || '')}`,
          type: 'ing',
          title: `ING ${String(inquiry?.id || inquiry?.inquiryNumber || '').trim()}`,
          description: inquiry?.products?.[0]?.productName || 'Product inquiry',
          status: String(inquiry?.status || '').trim().toLowerCase(),
          date: inquiry?.updatedAt || inquiry?.date || inquiry?.createdAt,
          action: () => onTabChange('inquiries'),
        })),
        ...visibleQuotations.map((quotation: any) => ({
          id: `qt-${String(quotation?.id || quotation?.qtNumber || quotation?.quotationNumber || '')}`,
          type: 'quotation',
          title: String(quotation?.qtNumber || quotation?.quotationNumber || quotation?.id || 'Quotation'),
          description:
            quotation?.items?.[0]?.productName ||
            quotation?.items?.[0]?.name ||
            quotation?.customerCompany ||
            'Sales quotation',
          status: String(quotation?.customerStatus || '').trim().toLowerCase(),
          date: quotation?.updatedAt || quotation?.sentAt || quotation?.createdAt,
          action: () => onTabChange('quotations'),
        })),
        ...activeOrderList.map((order: any) => ({
          id: `active-${String(order?.id || order?.orderNumber || '')}`,
          type: 'order',
          title: String(order?.orderNumber || order?.id || 'Order'),
          description: `${order?.products?.length || 0} items - ${order?.status || 'Active'}`,
          status: String(order?.status || '').trim().toLowerCase(),
          date: order?.updatedAt || order?.date || order?.createdAt,
          action: () => onTabChange('active'),
        })),
        ...completedOrderList.map((order: any) => ({
          id: `history-${String(order?.id || order?.orderNumber || '')}`,
          type: 'order',
          title: String(order?.orderNumber || order?.id || 'Order'),
          description: `${order?.products?.length || 0} items - ${order?.status || 'Completed'}`,
          status: String(order?.status || '').trim().toLowerCase(),
          date: order?.updatedAt || order?.date || order?.createdAt,
          action: () => onTabChange('completed'),
        })),
      ]
        .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))
        .slice(0, 5),
    [activeOrderList, completedOrderList, inquiries, onTabChange, visibleQuotations],
  );

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--hd-font)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                {totalQuotations}
              </div>
              <div className="text-gray-500 text-[11px]" style={{ fontWeight: 400 }}>
                {pendingReviewQuotations} pending your review
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
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <div className="border-b-2 border-gray-200 px-6 py-4">
            <h3 className="text-gray-900 uppercase tracking-wide flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
              <Package className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
              Order Flow Pipeline
            </h3>
          </div>
          <div className="p-6 space-y-4">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#2E7D32]" strokeWidth={2.5} />
                  <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>QUOTATIONS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 700 }}>{totalQuotations}</span>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F96302]" strokeWidth={2.5} />
                  <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>ORDERS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 700 }}>{conversionOrderCount}</span>
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
                {recentActivities.map((activity) => (
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
                      ) : activity.type === 'quotation' ? (
                        <div className="w-10 h-10 bg-[#0891B2] rounded-sm flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />
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
                          {formatActivityDate(activity.date)}
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
                        {activity.status === 'sent' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-yellow-100 text-yellow-800 text-[10px]" style={{ fontWeight: 600 }}>
                            SENT
                          </span>
                        )}
                        {activity.status === 'viewed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-blue-100 text-blue-800 text-[10px]" style={{ fontWeight: 600 }}>
                            VIEWED
                          </span>
                        )}
                        {activity.status === 'approved' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-green-100 text-green-800 text-[10px]" style={{ fontWeight: 600 }}>
                            APPROVED
                          </span>
                        )}
                        {activity.status === 'accepted' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-green-100 text-green-800 text-[10px]" style={{ fontWeight: 600 }}>
                            ACCEPTED
                          </span>
                        )}
                        {activity.status === 'rejected' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-red-100 text-red-800 text-[10px]" style={{ fontWeight: 600 }}>
                            REJECTED
                          </span>
                        )}
                        {activity.status === 'negotiating' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-orange-100 text-orange-800 text-[10px]" style={{ fontWeight: 600 }}>
                            NEGOTIATING
                          </span>
                        )}
                        {activity.status === 'expired' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-gray-100 text-gray-800 text-[10px]" style={{ fontWeight: 600 }}>
                            EXPIRED
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
                        {activity.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-green-100 text-green-800 text-[10px]" style={{ fontWeight: 600 }}>
                            COMPLETED
                          </span>
                        )}
                        {activity.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-sm bg-red-100 text-red-800 text-[10px]" style={{ fontWeight: 600 }}>
                            CANCELLED
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

      <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
        <div className="border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <h3 className="text-gray-900 uppercase tracking-wide flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
            <RefreshCw className="w-5 h-5 text-[#F96302]" strokeWidth={2.5} />
            Repeat Order Entry
          </h3>
          <span className="text-gray-500 text-[11px]" style={{ fontWeight: 500 }}>
            Unified repeat quote and direct-order entry
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-sm p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-gray-600 uppercase text-[10px] mb-2" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                  Repeat Quote Draft
                </div>
                <div className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                  {repeatEntryLoading ? '--' : repeatEntryOverview?.repeatQuoteDraft ? 'ACTIVE' : 'EMPTY'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-sm bg-[#0891B2] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-gray-600 text-[12px] space-y-1" style={{ fontWeight: 400 }}>
              <div>Products: {repeatEntryOverview?.repeatQuoteDraft?.productCount || 0}</div>
              <div>Last Update: {repeatEntryOverview?.repeatQuoteDraft?.updatedAt ? String(repeatEntryOverview.repeatQuoteDraft.updatedAt).slice(0, 10) : 'Not started'}</div>
            </div>
            <Button
              onClick={() => onTabChange('quotations')}
              className="w-full mt-4 bg-[#0891B2] hover:bg-[#0E7490] text-white"
            >
              Continue Quote Path
            </Button>
          </div>

          <div className="border border-gray-200 rounded-sm p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-gray-600 uppercase text-[10px] mb-2" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                  Repeat Direct Order
                </div>
                <div className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                  {repeatEntryOverview?.repeatDirectDraftCount || 0} Drafts
                </div>
              </div>
              <div className="w-10 h-10 rounded-sm bg-[#F96302] flex items-center justify-center">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-gray-600 text-[12px] space-y-1" style={{ fontWeight: 400 }}>
              <div>Latest Draft: {repeatEntryOverview?.repeatDirectDraft?.draftNumber || 'Not started'}</div>
              <div>Products: {repeatEntryOverview?.repeatDirectDraft?.productCount || 0}</div>
              <div>Stage: {repeatEntryOverview?.repeatDirectDraft?.executionStage || 'draft'}</div>
            </div>
            <Button
              onClick={() => onTabChange('create')}
              className="w-full mt-4 bg-[#F96302] hover:bg-[#E05502] text-white"
            >
              Continue Direct Order
            </Button>
          </div>

          <div className="border border-gray-200 rounded-sm p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-gray-600 uppercase text-[10px] mb-2" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                  History Reuse Anchor
                </div>
                <div className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                  {repeatEntryOverview?.historyOrderCount || 0} Orders
                </div>
              </div>
              <div className="w-10 h-10 rounded-sm bg-[#0D3B66] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-gray-600 text-[12px] space-y-1" style={{ fontWeight: 400 }}>
              <div>Latest Source: {repeatEntryOverview?.latestHistoryOrderNumber || 'No history yet'}</div>
              <div>Purpose: history lookup / product refill / price inheritance</div>
              <div>Landing: repeat quote or direct-order draft</div>
            </div>
            <Button
              onClick={() => onTabChange('completed')}
              className="w-full mt-4 bg-[#0D3B66] hover:bg-[#0A2F52] text-white"
            >
              Open Order History
            </Button>
          </div>
        </div>
      </div>

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
            className="h-auto py-4 bg-[#2E7D32] hover:bg-[#256428] text-white border-0 rounded-sm justify-start"
          >
            <Package className="w-5 h-5 mr-3" strokeWidth={2.5} />
            <div className="text-left">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Track Orders</div>
              <div className="text-[11px] opacity-80" style={{ fontWeight: 400 }}>Monitor shipping progress</div>
            </div>
          </Button>

          <Button
            onClick={() => onTabChange('create')}
            className="h-auto py-4 bg-[#F96302] hover:bg-[#E05502] text-white border-0 rounded-sm justify-start"
          >
            <TrendingUp className="w-5 h-5 mr-3" strokeWidth={2.5} />
            <div className="text-left">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Create New Order</div>
              <div className="text-[11px] opacity-80" style={{ fontWeight: 400 }}>Place direct order</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
