import React from 'react';
import { ArrowLeft, FileText, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';
import { useInquiry } from '../contexts/InquiryContext';
import { useRouter } from '../contexts/RouterContext';
import { useUser } from '../contexts/UserContext';
import { adaptInquiryToDocumentData } from '../utils/documentDataAdapters';
import { Button } from './ui/button';

const legacyDemoDealIds = new Set([
  'rebar-12mm',
  'cement-50kg',
  'gypsum-board',
  'led-high-bay',
  'ppr-fitting-set',
  'bulk-starter-pack',
  'container-building-pack',
  'led-panel-light',
]);

const getUnitFromCartItem = (item: { specification?: string; color?: string }) => {
  const text = `${item.specification || ''} ${item.color || ''}`;
  const unitMatch = text.match(/\/\s*([a-zA-Z]+)\b/);
  return unitMatch?.[1] || 'pcs';
};

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { user, userInfo } = useUser();
  const { addInquiry } = useInquiry();
  const { navigateTo } = useRouter();
  const [isCreatingInquiry, setIsCreatingInquiry] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  }, []);

  React.useEffect(() => {
    cartItems.forEach((item) => {
      if (item.modelNo && legacyDemoDealIds.has(item.modelNo)) {
        removeFromCart(item.productName, item.color);
      }
    });
  }, [cartItems, removeFromCart]);

  const normalizeQuantity = (quantity: number, packSize: number) => {
    const pack = Math.max(packSize || 1, 1);
    return Math.max(pack, Math.ceil(Math.max(quantity, 1) / pack) * pack);
  };

  const calculateItemShipping = (item: any) => {
    const pcsPerCarton = item.pcsPerCarton || 1;
    const cbmPerCarton = Number(item.cbmPerCarton || 0);
    const cartonGrossWeight = Number(item.cartonGrossWeight || 0);
    const cartonNetWeight = Number(item.cartonNetWeight || 0);
    const cartons = item.quantity / pcsPerCarton;
    const fullCartons = Math.ceil(item.quantity / pcsPerCarton);

    return {
      cartons,
      cbm: (fullCartons * cbmPerCarton).toFixed(3),
      totalGrossWeight: (fullCartons * cartonGrossWeight).toFixed(2),
      totalNetWeight: (fullCartons * cartonNetWeight).toFixed(2),
      isExactCartons: Number.isInteger(cartons),
      suggestedLower: Math.max(Math.floor(cartons) * pcsPerCarton, pcsPerCarton),
      suggestedHigher: Math.ceil(cartons) * pcsPerCarton,
    };
  };

  const totalShipping = cartItems.reduce(
    (totals, item) => {
      const shipping = calculateItemShipping(item);
      totals.cartons += shipping.cartons;
      totals.cbm += Number(shipping.cbm);
      totals.totalGrossWeight += Number(shipping.totalGrossWeight);
      totals.totalNetWeight += Number(shipping.totalNetWeight);
      return totals;
    },
    { cartons: 0, cbm: 0, totalGrossWeight: 0, totalNetWeight: 0 }
  );

  const selectedLines = cartItems.length;
  const selectedQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTotal = getTotalPrice();

  const formatMetric = (value: string | number, suffix = '') => {
    const numericValue = Number(value);
    return numericValue > 0 ? `${value}${suffix ? ` ${suffix}` : ''}` : 'TBC';
  };

  const handleCreateInquiry = async () => {
    if (user?.type === 'customer') {
      if (cartItems.length === 0 || isCreatingInquiry) return;
      setIsCreatingInquiry(true);
      try {
        const now = Date.now();
        const inquiryProducts = cartItems.map((item, index) => ({
          ...item,
          id: `${item.modelNo || item.productName}-${index}`,
          productName: item.productName,
          quantity: item.quantity,
          unit: getUnitFromCartItem(item),
          price: item.unitPrice || 0,
          targetPrice: item.unitPrice || 0,
          specifications: item.specification || '',
          image: item.image || '/placeholder.jpg',
          source: 'website',
          addedFrom: 'website-inquiry-list',
        }));
        const inquiry = {
          id: crypto.randomUUID(),
          inquiryNumber: null,
          date: new Date().toISOString().split('T')[0],
          userEmail: user.email,
          region: user.region || 'NA',
          products: inquiryProducts,
          totalPrice: estimatedTotal,
          status: 'pending' as const,
          isSubmitted: false,
          buyerInfo: {
            companyName: userInfo?.companyName || 'N/A',
            contactPerson: userInfo?.contactPerson || user.email.split('@')[0] || 'N/A',
            email: user.email,
            phone: userInfo?.phone || 'N/A',
            address: userInfo?.address || 'N/A',
            website: userInfo?.website || '',
            businessType: userInfo?.businessType || '',
          },
          shippingInfo: {
            cartons: totalShipping.cartons.toFixed(2),
            cbm: totalShipping.cbm.toFixed(3),
            totalGrossWeight: totalShipping.totalGrossWeight.toFixed(2),
            totalNetWeight: totalShipping.totalNetWeight.toFixed(2),
          },
          requirements: {
            otherRequirements: 'Created from website inquiry list.',
          },
          message: 'Created from website inquiry list.',
          createdAt: now,
        };
        (inquiry as any).templateSnapshot = { pendingResolution: true };
        (inquiry as any).documentRenderMeta = null;
        (inquiry as any).documentDataSnapshot = adaptInquiryToDocumentData(inquiry as any);

        const createdInquiry = await addInquiry(inquiry as any);
        clearCart();
        localStorage.setItem('dashboardActiveView', 'inquiries');
        toast.success('Inquiry created in your customer workspace', {
          description: createdInquiry.inquiryNumber || 'Ready for review',
        });
        navigateTo('dashboard');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Please try again.';
        toast.error(`Failed to create inquiry: ${message}`);
      } finally {
        setIsCreatingInquiry(false);
      }
      return;
    }

    toast.info('Please log in to create an inquiry in your customer workspace');
    navigateTo('login');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => navigateTo('home')}
              className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </button>

            <div className="rounded-sm border border-gray-200 bg-white p-12 text-center shadow-sm">
              <ShoppingBag className="mx-auto mb-4 h-24 w-24 text-gray-300" />
              <h2 className="mb-2 text-2xl font-black">Your inquiry list is empty</h2>
              <p className="mb-6 text-gray-600">Select products or deals to start an inquiry.</p>
              <Button onClick={() => navigateTo('home')} className="bg-red-600 hover:bg-red-700">
                Continue Browsing
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="cosun-shell">
        <div>
          <button
            onClick={() => navigateTo('home')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-normal text-red-600">Inquiry List</p>
              <h1 className="text-2xl font-black tracking-normal text-slate-950">Review selected products</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={clearCart}
                className="inline-flex h-9 items-center gap-2 rounded-sm border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-normal text-slate-600 hover:border-red-200 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
              <Button
                onClick={handleCreateInquiry}
                disabled={isCreatingInquiry}
                className="h-9 rounded-sm bg-red-600 px-4 text-xs font-black uppercase tracking-normal hover:bg-red-700"
              >
                <FileText className="mr-2 h-3.5 w-3.5" />
                {isCreatingInquiry ? 'Creating...' : 'Submit Inquiry'}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[1240px] border-b border-slate-200 bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-normal text-slate-500"
                style={{ gridTemplateColumns: '52px minmax(250px,1.6fr) 100px 142px 76px 90px 116px 112px 36px', columnGap: '10px' }}
              >
                <span />
                <span>Product</span>
                <span>Unit</span>
                <span>Qty</span>
                <span>Packs</span>
                <span>CBM</span>
                <span>GW / NW</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              {cartItems.map((item, index) => {
                const shipping = calculateItemShipping(item);
                const itemTotal = (item.unitPrice || 0) * item.quantity;
                const packSize = item.pcsPerCarton || 1;

                return (
                  <div key={`${item.productName}-${item.color}-${index}`} className="border-b border-slate-100 last:border-b-0">
                    <div
                      className="grid min-w-[1240px] gap-3 px-3 py-2.5 xl:items-center"
                      style={{ gridTemplateColumns: '52px minmax(250px,1.6fr) 100px 142px 76px 90px 116px 112px 36px', columnGap: '10px' }}
                    >
                      <div className="h-11 overflow-hidden rounded-sm border border-slate-100 bg-slate-50">
                        <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-black leading-5 text-slate-950">{item.productName}</div>
                        <div className="truncate text-xs font-semibold leading-4 text-slate-500">{item.specification}</div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-black uppercase leading-none">
                          <span className="rounded-sm bg-slate-100 px-1.5 py-1 text-slate-600">{item.material}</span>
                          <span className="rounded-sm bg-blue-50 px-1.5 py-1 text-blue-700">{item.color}</span>
                          <span className="rounded-sm bg-slate-100 px-1.5 py-1 text-slate-600">Pack {packSize}</span>
                        </div>
                      </div>

                      <div className="text-sm font-black text-orange-600">${(item.unitPrice || 0).toFixed(2)}</div>

                      <div>
                        <div
                          className="grid h-8 overflow-hidden rounded-sm border border-slate-200 bg-white"
                          style={{ gridTemplateColumns: '32px minmax(0,1fr) 32px' }}
                        >
                          <button
                            className="bg-slate-50 text-sm font-black text-slate-700 hover:bg-slate-100"
                            onClick={() => updateQuantity(item.productName, item.color, normalizeQuantity(item.quantity - packSize, packSize))}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (!Number.isNaN(value) && value >= 0) {
                                updateQuantity(item.productName, item.color, value);
                              }
                            }}
                            onBlur={() => updateQuantity(item.productName, item.color, normalizeQuantity(item.quantity, packSize))}
                            className="min-w-0 border-x border-slate-200 text-center text-sm font-black text-slate-950 outline-none"
                          />
                          <button
                            className="bg-slate-50 text-sm font-black text-slate-700 hover:bg-slate-100"
                            onClick={() => updateQuantity(item.productName, item.color, normalizeQuantity(item.quantity + packSize, packSize))}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className={`text-sm font-black ${!shipping.isExactCartons ? 'text-red-600' : 'text-slate-800'}`}>
                        {shipping.cartons.toFixed(2)}
                      </div>

                      <div className="text-sm font-bold text-slate-700">{formatMetric(shipping.cbm, 'm³')}</div>

                      <div className="text-xs font-bold leading-4 text-slate-600">
                        <div>GW {formatMetric(shipping.totalGrossWeight, 'kg')}</div>
                        <div>NW {formatMetric(shipping.totalNetWeight, 'kg')}</div>
                      </div>

                      <div className="text-right text-base font-black text-blue-600">${itemTotal.toFixed(2)}</div>

                      <button
                        onClick={() => removeFromCart(item.productName, item.color)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {!shipping.isExactCartons && (
                      <div className="flex min-w-[1240px] items-center gap-2 border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                        <span>Full pack:</span>
                        <button
                          onClick={() => updateQuantity(item.productName, item.color, shipping.suggestedLower)}
                          className="rounded-sm border border-amber-200 bg-white px-2 py-0.5 text-slate-700 hover:bg-amber-100"
                        >
                          {shipping.suggestedLower}
                        </button>
                        <button
                          onClick={() => updateQuantity(item.productName, item.color, shipping.suggestedHigher)}
                          className="rounded-sm border border-amber-200 bg-white px-2 py-0.5 text-slate-700 hover:bg-amber-100"
                        >
                          {shipping.suggestedHigher}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div
                className="grid min-w-[1240px] items-center gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3"
                style={{ gridTemplateColumns: '52px minmax(250px,1.6fr) 100px 142px 76px 90px 116px 112px 36px', columnGap: '10px' }}
              >
                <div />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-black uppercase tracking-normal text-slate-500">
                  <span>Lines <b className="text-slate-950">{selectedLines}</b></span>
                  <span>Total Qty <b className="text-slate-950">{selectedQuantity.toLocaleString()}</b></span>
                </div>
                <div className="text-xs font-black uppercase tracking-normal text-slate-500">Total</div>
                <div />
                <div className="text-sm font-black text-slate-950">{totalShipping.cartons.toFixed(2)}</div>
                <div className="text-sm font-black text-slate-950">{formatMetric(totalShipping.cbm.toFixed(3), 'm³')}</div>
                <div className="text-xs font-black leading-4 text-slate-600">
                  <div>GW {formatMetric(totalShipping.totalGrossWeight.toFixed(2), 'kg')}</div>
                  <div>NW {formatMetric(totalShipping.totalNetWeight.toFixed(2), 'kg')}</div>
                </div>
                <div className="text-right text-lg font-black text-blue-600">${estimatedTotal.toFixed(2)}</div>
                <div />
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" className="h-9 rounded-sm border-slate-300 px-4 text-xs font-black" onClick={() => navigateTo('home')}>
              Add Products
            </Button>
            <Button
              onClick={handleCreateInquiry}
              disabled={isCreatingInquiry}
              className="h-9 rounded-sm bg-red-600 px-5 text-xs font-black uppercase tracking-normal hover:bg-red-700"
            >
              {isCreatingInquiry ? 'Creating...' : 'Submit Inquiry'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
