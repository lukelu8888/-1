import { useMemo, useRef, useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronLeft, ChevronRight, User, LayoutDashboard, Package, DollarSign, Bell, BarChart3, Mail, FileText, GripVertical, Home, Calculator, Target, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Resizable } from 're-resizable';
import { useRouter } from '../contexts/RouterContext';
import { useUser } from '../contexts/UserContext';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { MyOrders } from './dashboard/MyOrders';
import { MyProducts } from './dashboard/MyProducts';
import { DataAnalytics } from './dashboard/DataAnalytics';
import { CreateOrder } from './dashboard/CreateOrder';
import { InternalMessaging } from './dashboard/InternalMessaging';
import { RateRequestForm } from './dashboard/RateRequestForm';
import { InquiryManagement } from './dashboard/InquiryManagement';
import { CustomerProfile } from './dashboard/CustomerProfile';
import CustomerUserProfile from './dashboard/CustomerUserProfile';
import CustomerEnterpriseMasterDataCenter from './dashboard/CustomerEnterpriseMasterDataCenter';
import { MyDocuments } from './dashboard/MyDocuments'; // 📄 客户文档中心
import { ProfitAnalyzerPro } from './dashboard/ProfitAnalyzerPro'; // 🔥 利润分析器Pro
import { SupplierEvaluationSystem } from './dashboard/SupplierEvaluationSystem'; // 🎯 供应商评估系统 v2.0
import { customerOrganizationService, customerPortalProfileService } from '../lib/supabaseService';
import {
  CUSTOMER_MASTER_DATA_LOCALE_EVENT,
  CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY,
  resolveCustomerMasterDataLocale,
  type CustomerMasterDataLocale,
} from './dashboard/customerEnterpriseMasterDataI18n';
import { createThemePalette, DEFAULT_CUSTOMER_THEME, extractLogoPrimaryColor, type CustomerThemePalette } from '../utils/logoTheme';

interface CustomerDashboardProps {
  onLogout: () => void | Promise<void>;
  userEmail: string;
}

const DEFAULT_DASHBOARD_VIEW = 'overview';
const CUSTOMER_LOGO_UPDATED_EVENT = 'cosun-customer-logo-updated';
const VALID_DASHBOARD_VIEWS = new Set([
  'overview',
  'profile',
  'organization-profile',
  'user-profile',
  'my-orders',
  'my-products',
  'rate-request',
  'create-order',
  'analytics',
  'messages',
  'inquiries',
  'documents',
  'profit-analyzer',
  'supplier-evaluation',
]);

export function CustomerDashboard({ onLogout, userEmail }: CustomerDashboardProps) {
  // Restore active view from localStorage on mount
  const [activeView, setActiveView] = useState<string>(() => {
    const savedView = localStorage.getItem('dashboardActiveView');
    if (savedView && VALID_DASHBOARD_VIEWS.has(savedView)) {
      return savedView;
    }
    return DEFAULT_DASHBOARD_VIEW;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [profileEditToken, setProfileEditToken] = useState(0);
  const [customerLogo, setCustomerLogo] = useState<string | null>(() => localStorage.getItem('cosun_customer_logo'));
  const [theme, setTheme] = useState<CustomerThemePalette>(DEFAULT_CUSTOMER_THEME);
  const [locale, setLocale] = useState<CustomerMasterDataLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    return resolveCustomerMasterDataLocale(localStorage.getItem(CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY) || navigator.language);
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { navigateTo } = useRouter();
  const { clearUser, user } = useUser();

  // Save active view to localStorage whenever it changes
  useEffect(() => {
    if (!VALID_DASHBOARD_VIEWS.has(activeView)) {
      setActiveView(DEFAULT_DASHBOARD_VIEW);
      return;
    }
    localStorage.setItem('dashboardActiveView', activeView);
  }, [activeView]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncLogo = () => {
      setCustomerLogo(localStorage.getItem('cosun_customer_logo'));
    };
    const syncLogoFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ logoUrl?: string | null }>).detail;
      if (typeof detail?.logoUrl === 'string') {
        setCustomerLogo(detail.logoUrl || null);
        return;
      }
      syncLogo();
    };
    syncLogo();
    window.addEventListener('storage', syncLogo);
    window.addEventListener('focus', syncLogo);
    window.addEventListener(CUSTOMER_LOGO_UPDATED_EVENT, syncLogoFromEvent as EventListener);
    return () => {
      window.removeEventListener('storage', syncLogo);
      window.removeEventListener('focus', syncLogo);
      window.removeEventListener(CUSTOMER_LOGO_UPDATED_EVENT, syncLogoFromEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncLocale = () => {
      setLocale(resolveCustomerMasterDataLocale(localStorage.getItem(CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY) || navigator.language));
    };
    const syncLocaleFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ locale?: string }>).detail;
      if (detail?.locale) {
        setLocale(resolveCustomerMasterDataLocale(detail.locale));
        return;
      }
      syncLocale();
    };
    syncLocale();
    window.addEventListener('storage', syncLocale);
    window.addEventListener('focus', syncLocale);
    window.addEventListener(CUSTOMER_MASTER_DATA_LOCALE_EVENT, syncLocaleFromEvent as EventListener);
    return () => {
      window.removeEventListener('storage', syncLocale);
      window.removeEventListener('focus', syncLocale);
      window.removeEventListener(CUSTOMER_MASTER_DATA_LOCALE_EVENT, syncLocaleFromEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id || user.type !== 'customer') return undefined;

    void (async () => {
      try {
        const remoteOrg = await customerOrganizationService.getByAuthUser(user.id);
        if (cancelled) return;
        if (remoteOrg?.logoUrl) {
          setCustomerLogo(remoteOrg.logoUrl);
          localStorage.setItem('cosun_customer_logo', remoteOrg.logoUrl);
        }
      } catch (error) {
        console.warn('[CustomerDashboard] Failed to hydrate customer logo from Supabase:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.type]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const primary = await extractLogoPrimaryColor(customerLogo);
      if (!cancelled) {
        setTheme(createThemePalette(primary));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerLogo]);

  const themeVars = useMemo(
    () => ({
      ['--customer-primary' as const]: theme.primary,
      ['--customer-primary-hover' as const]: theme.primaryHover,
      ['--customer-primary-soft' as const]: theme.primarySoft,
      ['--customer-primary-border' as const]: theme.primaryBorder,
      ['--customer-primary-text' as const]: theme.primaryText,
      ['--customer-on-primary' as const]: theme.onPrimary,
    }),
    [theme],
  );

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const nextView = (event as CustomEvent<{ view?: string }>).detail?.view;
      if (nextView && VALID_DASHBOARD_VIEWS.has(nextView)) {
        setActiveView(nextView);
      }
    };

    window.addEventListener('customer-dashboard-navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('customer-dashboard-navigate', handleNavigate as EventListener);
    };
  }, []);

  // Shared orders state between Active Orders and Order History
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  const [historicalOrders, setHistoricalOrders] = useState<any[]>([]);

  // Draft order for Create New Order (from reorder functionality)
  const [draftOrder, setDraftOrder] = useState<any>(null);

  // Add new order to active orders (called from Order History reorder)
  const handleAddActiveOrder = (order: any) => {
    setActiveOrders([order, ...activeOrders]);
  };

  // Update order in active orders (called from Active Orders edit)
  const handleUpdateActiveOrder = (orderId: string, updatedOrder: any) => {
    setActiveOrders(orders =>
      orders.map(order => order.id === orderId ? updatedOrder : order)
    );
  };

  // Set draft order and navigate to Create Order page
  const handleCreateDraftOrder = (order: any) => {
    setDraftOrder(order);
    setActiveView('create-order');
  };

  // Handle order submission from Create Order - stay on the same page
  const handleOrderSubmitted = (order: any) => {
    // Add to active orders
    setActiveOrders([order, ...activeOrders]);
    // Don't change activeView - stay on Create Order page
    // Clear the draft order
    setDraftOrder(null);
  };

  const handleBackToWebsite = () => {
    // Don't clear user - keep them logged in
    navigateTo('home');
  };

  const dashboardCopy = {
    en: {
      overview: 'Dashboard Overview',
      organizationProfile: 'Enterprise Master Data',
      userProfile: 'My Account',
      myOrders: 'My Orders',
      myProducts: 'My Products',
      rateRequest: 'Rate Request',
      analytics: 'Data Analytics',
      messages: 'Messages',
      documents: 'My Documents',
      profitAnalyzer: 'Profit Analyzer',
      supplierEvaluation: 'Supplier Evaluation',
      backToWebsite: 'Back to Website',
      logout: 'Logout',
      premiumMember: 'Premium Member · Click to edit',
      brandTitle: 'Empowering Your Business Growth',
      brandSubtitle: 'Growing together to achieve business success',
      brandMissionLabel: 'Our Mission',
      brandMissionValue: 'Customer Growth · Win-Win Future',
    },
    es: {
      overview: 'Resumen del panel',
      organizationProfile: 'Datos maestros empresariales',
      userProfile: 'Mi cuenta',
      myOrders: 'Mis pedidos',
      myProducts: 'Mis productos',
      rateRequest: 'Solicitud de tarifa',
      analytics: 'Análisis de datos',
      messages: 'Mensajes',
      documents: 'Mis documentos',
      profitAnalyzer: 'Analizador de beneficios',
      supplierEvaluation: 'Evaluación de proveedores',
      backToWebsite: 'Volver al sitio web',
      logout: 'Cerrar sesión',
      premiumMember: 'Miembro premium · Haga clic para editar',
      brandTitle: 'Impulsando el crecimiento de su negocio',
      brandSubtitle: 'Creciendo juntos para lograr el éxito comercial',
      brandMissionLabel: 'Nuestra misión',
      brandMissionValue: 'Crecimiento del cliente · Futuro ganar-ganar',
    },
    pt: {
      overview: 'Visão geral',
      organizationProfile: 'Dados mestres empresariais',
      userProfile: 'Minha conta',
      myOrders: 'Meus pedidos',
      myProducts: 'Meus produtos',
      rateRequest: 'Solicitação de frete',
      analytics: 'Análise de dados',
      messages: 'Mensagens',
      documents: 'Meus documentos',
      profitAnalyzer: 'Analisador de lucro',
      supplierEvaluation: 'Avaliação de fornecedores',
      backToWebsite: 'Voltar ao site',
      logout: 'Sair',
      premiumMember: 'Membro premium · Clique para editar',
      brandTitle: 'Impulsionando o crescimento do seu negócio',
      brandSubtitle: 'Crescendo juntos para alcançar o sucesso comercial',
      brandMissionLabel: 'Nossa missão',
      brandMissionValue: 'Crescimento do cliente · Futuro ganha-ganha',
    },
    ar: {
      overview: 'نظرة عامة',
      organizationProfile: 'البيانات الرئيسية للشركة',
      userProfile: 'حسابي',
      myOrders: 'طلباتي',
      myProducts: 'منتجاتي',
      rateRequest: 'طلب تسعير',
      analytics: 'تحليلات البيانات',
      messages: 'الرسائل',
      documents: 'مستنداتي',
      profitAnalyzer: 'محلل الربح',
      supplierEvaluation: 'تقييم الموردين',
      backToWebsite: 'العودة إلى الموقع',
      logout: 'تسجيل الخروج',
      premiumMember: 'عضو مميز · انقر للتعديل',
      brandTitle: 'نعزز نمو أعمالك',
      brandSubtitle: 'ننمو معًا لتحقيق نجاح الأعمال',
      brandMissionLabel: 'مهمتنا',
      brandMissionValue: 'نمو العميل · مستقبل مربح للطرفين',
    },
  } as const;

  const copy = dashboardCopy[locale];
  const brandCard = (
    <div
      className="mb-3 rounded-xl border px-3 py-3 shadow-sm"
      style={{
        backgroundColor: 'var(--customer-primary-soft)',
        borderColor: 'var(--customer-primary-border)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--customer-primary)' }}
        >
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M13 7h6m0 0v6m0-6l-7 7-4-4-4 4" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5" style={{ color: 'var(--customer-primary-text)' }}>
            {copy.brandTitle}
          </div>
          <div className="mt-0.5 text-xs leading-5 text-gray-600">
            {copy.brandSubtitle}
          </div>
          <div className="mt-1 text-[11px] leading-4 text-gray-500">
            <span>{copy.brandMissionLabel}:</span>
            <span className="ml-1 font-medium" style={{ color: 'var(--customer-primary-text)' }}>
              {copy.brandMissionValue}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Menu items state with drag and drop support
  const defaultMenuItems = [
    { id: 'overview', label: copy.overview, icon: LayoutDashboard },
    { id: 'organization-profile', label: copy.organizationProfile, icon: Building2 },
    { id: 'user-profile', label: copy.userProfile, icon: User },
    { id: 'my-orders', label: copy.myOrders, icon: Package },
    { id: 'my-products', label: copy.myProducts, icon: Package },
    { id: 'rate-request', label: copy.rateRequest, icon: DollarSign },
    { id: 'analytics', label: copy.analytics, icon: BarChart3 },
    { id: 'messages', label: copy.messages, icon: Mail },
    { id: 'documents', label: copy.documents, icon: FileText },
    { id: 'profit-analyzer', label: copy.profitAnalyzer, icon: Calculator },
    { id: 'supplier-evaluation', label: copy.supplierEvaluation, icon: Target },
  ];

  // Restore menu order from localStorage or use default
  const [menuItems, setMenuItems] = useState(() => {
    const savedOrder = localStorage.getItem('dashboardMenuOrder');
    if (savedOrder) {
      try {
        const savedIds = JSON.parse(savedOrder);
        if (!Array.isArray(savedIds)) {
          return defaultMenuItems;
        }
        
        // Get saved items that still exist in defaultMenuItems
        const existingItems = savedIds
          .map((id: string) => defaultMenuItems.find(item => item.id === id))
          .filter(Boolean);
        
        // Find new items that aren't in saved order
        const existingIds = new Set(savedIds);
        const newItems = defaultMenuItems.filter(item => !existingIds.has(item.id));
        
        // Merge: keep saved order for existing items, add new items at appropriate positions
        // Insert "my-orders" after "overview" if it's new
        if (newItems.some(item => item.id === 'my-orders')) {
          const overviewIndex = existingItems.findIndex(item => item.id === 'overview');
          const myOrdersItem = defaultMenuItems.find(item => item.id === 'my-orders');
          if (overviewIndex >= 0 && myOrdersItem) {
            existingItems.splice(overviewIndex + 1, 0, myOrdersItem);
            return existingItems.concat(newItems.filter(item => item.id !== 'my-orders'));
          }
        }
        
        // Default: append new items at the end
        return existingItems.concat(newItems);
      } catch (e) {
        return defaultMenuItems;
      }
    }
    return defaultMenuItems;
  });

  useEffect(() => {
    setMenuItems((prev) => {
      const currentIds = prev.map((item) => item.id);
      const nextById = new Map(defaultMenuItems.map((item) => [item.id, item]));
      const existingItems = currentIds
        .map((id) => nextById.get(id))
        .filter(Boolean) as typeof defaultMenuItems;
      const existingIds = new Set(existingItems.map((item) => item.id));
      const newItems = defaultMenuItems.filter((item) => !existingIds.has(item.id));
      return existingItems.concat(newItems);
    });
  }, [locale]);

  // Save menu order to localStorage whenever it changes
  useEffect(() => {
    const order = menuItems.map(item => item.id);
    localStorage.setItem('dashboardMenuOrder', JSON.stringify(order));
  }, [menuItems]);

  // Drag and drop handlers
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  // Sidebar width state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('dashboardSidebarWidth');
    const parsedWidth = savedWidth ? parseInt(savedWidth, 10) : 256;
    if (!Number.isFinite(parsedWidth)) {
      return 256;
    }
    return Math.min(400, Math.max(200, parsedWidth)); // Default 256px (w-64)
  });

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardSidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItem === null) return;
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem === null || dragOverItem === null) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const items = [...menuItems];
    const draggedItemContent = items[draggedItem];
    
    // Remove dragged item
    items.splice(draggedItem, 1);
    // Insert at new position
    items.splice(dragOverItem, 0, draggedItemContent);
    
    setMenuItems(items);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <DashboardOverview userEmail={userEmail} onNavigate={setActiveView} />;
      case 'profile':
      case 'organization-profile':
        return (
          <CustomerEnterpriseMasterDataCenter
            forceEditToken={profileEditToken}
            onBack={() => setActiveView('overview')}
            locale={locale}
            onLocaleChange={setLocale}
            theme={theme}
          />
        );
      case 'user-profile':
        return <CustomerUserProfile />;
      case 'my-orders':
        return <MyOrders 
          activeOrders={activeOrders} 
          orderHistory={historicalOrders} 
          onNavigate={setActiveView}
          draftOrder={draftOrder}
          onOrderSubmitted={handleOrderSubmitted}
          onNavigateToShop={() => navigateTo('home')}
        />;
      case 'my-products':
        return <MyProducts />;
      case 'rate-request':
        return <RateRequestForm />;
      case 'create-order':
        return <CreateOrder 
          draftOrder={draftOrder} 
          onOrderSubmitted={handleOrderSubmitted} 
          onNavigateToHistory={() => setActiveView('my-orders')} 
          onNavigateToShop={() => navigateTo('home')}
        />;
      case 'analytics':
        return <DataAnalytics />;
      case 'messages':
        return <InternalMessaging />;
      case 'inquiries':
        return <InquiryManagement />;
      case 'documents':
        return <MyDocuments />; // 📄 客户文档中心
      case 'profit-analyzer':
        return <ProfitAnalyzerPro onNavigate={setActiveView} />; // 🔥 利润分析器Pro
      case 'supplier-evaluation':
        return <SupplierEvaluationSystem />; // 🎯 供应商评估系统 v2.0
      default:
        return <DashboardOverview userEmail={userEmail} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50" style={themeVars}>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-900">COSUN Portal</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToWebsite}
            className="transition-colors"
            style={{ color: 'var(--customer-primary-text)' }}
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-0px)]">
        {/* Mobile Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl
            transition-transform duration-300 ease-in-out lg:hidden
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setActiveView('organization-profile');
                  setProfileEditToken(Date.now());
                }}
                className="w-full flex items-center gap-3 overflow-hidden text-left group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-transparent transition"
                  style={{ backgroundColor: 'var(--customer-primary)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    logoInputRef.current?.click();
                  }}
                  title="Click to upload logo"
                >
                  {customerLogo ? (
                    <img src={customerLogo} alt="Customer logo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate whitespace-nowrap">{userEmail}</p>
                  <p className="text-xs text-gray-500 whitespace-nowrap">{copy.premiumMember}</p>
                </div>
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                    if (!dataUrl) return;
                    setCustomerLogo(dataUrl);
                    localStorage.setItem('cosun_customer_logo', dataUrl);
                    if (user?.id && user.type === 'customer') {
                      void (async () => {
                        try {
                          const currentProfile = await customerOrganizationService.getByAuthUser(user.id);
                          await customerOrganizationService.saveByAuthUser(user.id, {
                            ...(currentProfile || {}),
                            companyName: currentProfile?.companyName || '',
                            contactPerson: currentProfile?.contactPerson || '',
                            email: currentProfile?.email || user.email || '',
                            phone: currentProfile?.phone || '',
                            mobile: currentProfile?.mobile || '',
                            address: currentProfile?.address || '',
                            website: currentProfile?.website || '',
                            businessType: currentProfile?.businessType || 'Importer',
                            logoUrl: dataUrl,
                          });
                          await customerPortalProfileService.saveByAuthUser(user.id, {
                            displayName: currentProfile?.contactPerson || user.name || '',
                            loginEmail: user.email || '',
                            portalRole: 'customer',
                            avatarUrl: dataUrl,
                          });
                        } catch (error) {
                          console.warn('[CustomerDashboard] Failed to persist customer logo:', error);
                        }
                      })();
                    }
                  };
                  reader.readAsDataURL(file);
                  e.currentTarget.value = '';
                }}
              />
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {/* Back to Website - Prominent Button */}
                <button
                  onClick={handleBackToWebsite}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all text-white shadow-md hover:shadow-lg mb-3 border-2 overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, var(--customer-primary), var(--customer-primary-hover))',
                    borderColor: 'var(--customer-primary-border)',
                    color: 'var(--customer-on-primary)',
                  }}
                >
                  <Home className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap truncate">{copy.backToWebsite}</span>
                </button>

                {/* Divider */}
                <div className="border-t border-gray-200 my-3"></div>

                {/* Regular Menu Items */}
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  const isDragging = draggedItem === index;
                  const isDragOver = dragOverItem === index;
                  
                  return (
                    <div
                      key={item.id}
                      className={`
                        relative group
                        ${isDragging ? 'opacity-50' : ''}
                        ${isDragOver ? 'border-t-2 border-red-600' : ''}
                      `}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                    >
                      <button
                        onClick={() => {
                          setActiveView(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all overflow-hidden
                          ${isActive 
                            ? 'text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                        style={isActive ? {
                          backgroundColor: 'var(--customer-primary)',
                          color: 'var(--customer-on-primary)',
                        } : undefined}
                      >
                        <GripVertical className={`h-3.5 w-3.5 flex-shrink-0 cursor-grab active:cursor-grabbing ${isActive ? 'text-white/70' : 'text-gray-400'}`} />
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 whitespace-nowrap truncate">{item.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              {brandCard}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-sm overflow-hidden"
                style={{
                  backgroundColor: 'var(--customer-primary)',
                  borderColor: 'var(--customer-primary)',
                  color: 'var(--customer-on-primary)',
                }}
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap truncate">{copy.logout}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0 h-full">
          <Resizable
            size={{ width: sidebarWidth, height: '100vh' }}
            onResizeStop={(e, direction, ref, d) => {
              setSidebarWidth(sidebarWidth + d.width);
            }}
            minWidth={200}
            maxWidth={400}
            enable={{ 
              right: true, 
              top: false, 
              bottom: false, 
              left: false, 
              topRight: false, 
              bottomRight: false, 
              bottomLeft: false, 
              topLeft: false 
            }}
            className="relative h-full bg-white border-r border-gray-200"
            handleStyles={{
              right: {
                width: '4px',
                right: '-2px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s',
              }
            }}
            handleClasses={{
              right: 'hover:bg-red-600'
            }}
          >
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('organization-profile');
                    setProfileEditToken(Date.now());
                  }}
                  className="w-full flex items-center gap-3 overflow-hidden text-left group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-transparent transition"
                    style={{
                      backgroundColor: 'var(--customer-primary)',
                      boxShadow: '0 0 0 2px transparent',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      logoInputRef.current?.click();
                    }}
                    title="Click to upload logo"
                  >
                    {customerLogo ? (
                      <img src={customerLogo} alt="Customer logo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate whitespace-nowrap">{userEmail}</p>
                    <p className="text-xs text-gray-500 whitespace-nowrap">{copy.premiumMember}</p>
                  </div>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                      if (!dataUrl) return;
                      setCustomerLogo(dataUrl);
                      localStorage.setItem('cosun_customer_logo', dataUrl);
                      if (user?.id && user.type === 'customer') {
                        void (async () => {
                          try {
                            const currentProfile = await customerOrganizationService.getByAuthUser(user.id);
                            await customerOrganizationService.saveByAuthUser(user.id, {
                              ...(currentProfile || {}),
                              companyName: currentProfile?.companyName || '',
                              contactPerson: currentProfile?.contactPerson || '',
                              email: currentProfile?.email || user.email || '',
                              phone: currentProfile?.phone || '',
                              mobile: currentProfile?.mobile || '',
                              address: currentProfile?.address || '',
                              website: currentProfile?.website || '',
                              businessType: currentProfile?.businessType || 'Importer',
                              logoUrl: dataUrl,
                            });
                            await customerPortalProfileService.saveByAuthUser(user.id, {
                              displayName: currentProfile?.contactPerson || user.name || '',
                              loginEmail: user.email || '',
                              portalRole: 'customer',
                              avatarUrl: dataUrl,
                            });
                          } catch (error) {
                            console.warn('[CustomerDashboard] Failed to persist customer logo:', error);
                          }
                        })();
                      }
                    };
                    reader.readAsDataURL(file);
                    e.currentTarget.value = '';
                  }}
                />
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <button
                    onClick={handleBackToWebsite}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all text-white shadow-md hover:shadow-lg mb-3 border-2 overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, var(--customer-primary), var(--customer-primary-hover))',
                      borderColor: 'var(--customer-primary-border)',
                      color: 'var(--customer-on-primary)',
                    }}
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium whitespace-nowrap truncate">{copy.backToWebsite}</span>
                  </button>

                  <div className="border-t border-gray-200 my-3"></div>

                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isDragging = draggedItem === index;
                    const isDragOver = dragOverItem === index;

                    return (
                      <div
                        key={item.id}
                        className={`
                          relative group
                          ${isDragging ? 'opacity-50' : ''}
                          ${isDragOver ? 'border-t-2 border-red-600' : ''}
                        `}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                      >
                        <button
                          onClick={() => setActiveView(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all overflow-hidden
                            ${isActive ? 'text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}
                          `}
                          style={isActive ? {
                            backgroundColor: 'var(--customer-primary)',
                            color: 'var(--customer-on-primary)',
                          } : undefined}
                        >
                          <GripVertical className={`h-3.5 w-3.5 flex-shrink-0 cursor-grab active:cursor-grabbing ${isActive ? 'text-white/70' : 'text-gray-400'}`} />
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium flex-1 whitespace-nowrap truncate">{item.label}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </nav>

              <div className="p-4 border-t border-gray-200 space-y-2">
                {brandCard}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 text-sm overflow-hidden"
                  style={{
                    backgroundColor: 'var(--customer-primary)',
                    borderColor: 'var(--customer-primary)',
                    color: 'var(--customer-on-primary)',
                  }}
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap truncate">{copy.logout}</span>
                </Button>
              </div>
            </div>
          </Resizable>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="relative z-0 flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden">
          <div className="p-4 pb-8 lg:p-8 lg:pb-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
