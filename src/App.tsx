import './styles/globals.css';
import React, { Suspense, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import {
  LazyHome,
  LazyProjectSolution,
  LazyRetailWholesale,
  LazyFabricators,
  LazyChinaAgent,
  LazyQCMaster,
  LazyShipmentHub,
  LazySpecialOffers,
  LazyProductCenter,
  LazyProductCatalog,
  LazyFailureCases,
  LazyServices,
  LazySocialMedia,
  LazyNews,
  LazyAbout,
  LazyMember,
  LazyLogin,
  LazyAdminLogin,
  LazyAdminFormalLogin,
  LazyRegister,
  LazyBecomeSupplier,
  LazyCategoryDetail,
  LazyCart,
  LazyPrivacyPolicy,
  LazyTermsOfService,
  LazyLiveStreamPage,
  LazyLiveArchivePage,
  LazyCustomerDashboard,
  LazyAdminDashboard,
  LazySupplierDashboard,
  LazyDatabaseInitializer,
  LazyFurnitureInspectionStandards,
  LazyTextilesInspectionStandards,
  LazyToysInspectionStandards,
  LazyElectronicsInspectionStandards,
  LazyAppliancesInspectionStandards,
  LazyLightingInspectionStandards,
  LazyShoesInspectionStandards,
  LazyPackagingInspectionStandards,
  LazyAdvancedFormDemo,
  LazyClearSalesOrderHelper,
  LazyDocumentTestPage,
  LazyHeaderLayoutOptions,
} from './lazyPages';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function PageLoadFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      Loading…
    </div>
  );
}
import { RouterProvider, useRouter } from './contexts/RouterContext';
import { CartProvider } from './contexts/CartContext';
import { UserProvider, useOptionalUser } from './contexts/UserContext';
import type { AuthUser as AppAuthUser } from './contexts/UserContext';
import { RegionProvider, useRegion } from './contexts/RegionContext';
import { InquiryProvider } from './contexts/InquiryContext';
import { OrderProvider } from './contexts/OrderContext';
import { QuotationProvider } from './contexts/QuotationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ApprovalProvider } from './contexts/ApprovalContext'; // 🔥 审批工作流
import { QuoteRequirementProvider } from './contexts/QuoteRequirementContext'; // 🔥 报价请求管理（QR 语义别名层）
import { PurchaseOrderProvider } from './contexts/PurchaseOrderContext'; // 🔥 采购订单管理
import { XJProvider } from './contexts/XJContext'; // 🔥 采购询价管理（XJ）
import { QuotationRequestProvider } from './contexts/QuotationRequestContext'; // 🔥 报价请求管理
import { SalesQuotationProvider } from './contexts/SalesQuotationContext'; // 🔥 销售报价管理（QT）
import { SalesContractProvider } from './contexts/SalesContractContext'; // 🔥 销售合同管理（SC）
import { OrganizationProvider } from './contexts/OrganizationContext'; // 🔥 供应商组织信息管理
import { AdminOrganizationProvider } from './contexts/AdminOrganizationContext'; // 🔥 Admin主体公司信息管理
import { RegionSelectorModal } from './components/RegionSelectorModal';
import { RegionTransition } from './components/RegionTransition';
import { Toaster } from './components/ui/sonner';
import { resetDocumentScrollLock } from './components/ui/dialog';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
// ❌ 已禁用：文件不存在
// import PreviewPODocument from './preview-po-document';
// import CategoryDemo from './pages/CategoryDemo';
// import ShipmentDemo from './pages/ShipmentDemo';

const CUSTOMER_DASHBOARD_PAGES = ['dashboard', 'login', 'register', 'member'] as const;
const PUBLIC_SITE_PAGES = [
  'home',
  'retail-wholesale',
  'fabricators',
  'china-agent',
  'projectsolution',
  'qcmaster',
  'shipmenthub',
  'specials',
  'products',
  'catalog',
  'failurecases',
  'services',
  'socialmedia',
  'news',
  'about',
  'member',
  'cart',
  'privacy-policy',
  'terms-of-service',
  'live',
  'live-archive',
] as const;

function isPublicSitePage(currentPage: string) {
  return PUBLIC_SITE_PAGES.includes(currentPage as (typeof PUBLIC_SITE_PAGES)[number]) || currentPage.startsWith('category-');
}

function shouldUseCustomerBusinessProviders(user: AppAuthUser | null, currentPage: string) {
  return currentPage === 'cart' || (user?.type === 'customer' && CUSTOMER_DASHBOARD_PAGES.includes(currentPage as (typeof CUSTOMER_DASHBOARD_PAGES)[number]));
}

function shouldRenderCustomerDashboard(user: AppAuthUser | null, currentPage: string) {
  return user?.type === 'customer' && CUSTOMER_DASHBOARD_PAGES.includes(currentPage as (typeof CUSTOMER_DASHBOARD_PAGES)[number]);
}

function FullBusinessProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminOrganizationProvider>
      <OrganizationProvider>
        <InquiryProvider>
          <OrderProvider>
            <QuotationProvider>
              <NotificationProvider>
                <FinanceProvider>
                  <PaymentProvider>
                    <ApprovalProvider>
                      <QuoteRequirementProvider>
                        <PurchaseOrderProvider>
                          <XJProvider>
                            <QuotationRequestProvider>
                              <SalesQuotationProvider>
                                <SalesContractProvider>{children}</SalesContractProvider>
                              </SalesQuotationProvider>
                            </QuotationRequestProvider>
                          </XJProvider>
                        </PurchaseOrderProvider>
                      </QuoteRequirementProvider>
                    </ApprovalProvider>
                  </PaymentProvider>
                </FinanceProvider>
              </NotificationProvider>
            </QuotationProvider>
          </OrderProvider>
        </InquiryProvider>
      </OrganizationProvider>
    </AdminOrganizationProvider>
  );
}

function CustomerBusinessProviders({ children }: { children: React.ReactNode }) {
  return (
    <InquiryProvider>
      <OrderProvider>
        <NotificationProvider>
          <FinanceProvider>
            <PurchaseOrderProvider>
              <SalesQuotationProvider>
                <SalesContractProvider>{children}</SalesContractProvider>
              </SalesQuotationProvider>
            </PurchaseOrderProvider>
          </FinanceProvider>
        </NotificationProvider>
      </OrderProvider>
    </InquiryProvider>
  );
}

function AppProviders({
  children,
  user,
  currentPage,
}: {
  children: React.ReactNode;
  user: AppAuthUser | null;
  currentPage: string;
}) {
  const isCustomerBusinessPage = shouldUseCustomerBusinessProviders(user, currentPage);

  return (
    <RegionProvider>
      {isCustomerBusinessPage ? (
        <CustomerBusinessProviders>{children}</CustomerBusinessProviders>
      ) : user?.type === 'admin' || user?.type === 'supplier' ? (
        <FullBusinessProviders>{children}</FullBusinessProviders>
      ) : (
        children
      )}
    </RegionProvider>
  );
}

function AppShell() {
  const userContext = useOptionalUser();
  const user = userContext?.user ?? null;
  const authLoading = userContext?.authLoading ?? false;
  const logout = userContext?.logout ?? (async () => {});
  const { currentPage, navigateTo } = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (user?.type === 'supplier' && currentPage === 'dashboard') {
      navigateTo('supplier');
    }
  }, [authLoading, currentPage, navigateTo, user?.type]);

  return (
    <AppProviders user={user} currentPage={currentPage}>
      <AppErrorBoundary scope="AppContentRoot">
        <AppContent user={user} authLoading={authLoading} logout={logout} />
      </AppErrorBoundary>
    </AppProviders>
  );
}

function AppContent({
  user,
  authLoading,
  logout,
}: {
  user: AppAuthUser | null;
  authLoading: boolean;
  logout: () => Promise<void>;
}) {
  const { currentPage, categoryParams, navigateTo } = useRouter();
  const { setRegion } = useRegion();
  const { language } = useLanguage();
  const [showHomeDepotDemo, setShowHomeDepotDemo] = useState(false);
  const showCustomerDashboard = shouldRenderCustomerDashboard(user, currentPage);
  const isKnownPublicPage =
    [
      'home',
      'retail-wholesale',
      'fabricators',
      'china-agent',
      'projectsolution',
      'qcmaster',
      'shipmenthub',
      'specials',
      'products',
      'catalog',
      'failurecases',
      'services',
      'socialmedia',
      'news',
      'about',
      'member',
      'login',
      'admin-login',
      'admin-formal-login',
      'register',
      'supplier',
      'dashboard',
      'furnitureinspection',
      'textilesinspection',
      'toysinspection',
      'electronicsinspection',
      'appliancesinspection',
      'lightinginspection',
      'shoesinspection',
      'packaginginspection',
      'privacy-policy',
      'terms-of-service',
      'live',
      'live-archive',
      'cart',
      'clear-sales-orders',
      'document-test',
      'header-layout-options',
      'test-inquiry-flow',
      'init-database',
    ].includes(currentPage) || currentPage.startsWith('category-');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clearStalePublicScrollLock = () => {
      const hasOpenDialog = Boolean(document.querySelector('[data-slot="dialog-content"]'));
      if (!hasOpenDialog) {
        resetDocumentScrollLock();
      }
    };

    clearStalePublicScrollLock();
    const frameId = window.requestAnimationFrame(clearStalePublicScrollLock);
    return () => window.cancelAnimationFrame(frameId);
  }, [currentPage, categoryParams?.category, categoryParams?.subcategory]);

  // 🔥 临时预览类目导航Demo - 注释下面这行恢复正常网站
  // return <CategoryDemo />;

  // 🔥 临时预览页眉布局方案对比 - 取消注释下面这行来预览
  // return <HeaderLayoutOptions />;

  // 🔥 临时预览采购订单A4表单 - 取消注释下面这行来预览
  // return <PreviewPODocument />;

  // 🔥 临时预览发货单A4表单 - 取消注释下面这行来预览
  // return <ShipmentDemo />;

  // 🔥 临时预览表单库（Home Depot风格）- 取消注释下面这行来预览
  // return <FormLibraryPreview />;
  // 🔥 预览高级表单布局系统 - 支持无限网格和灵活定位
  if (showHomeDepotDemo) {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        <LazyAdvancedFormDemo onClose={() => setShowHomeDepotDemo(false)} />
      </Suspense>
    );
  }

  // 🔥 预览真实的 Home Depot 商业文档 - 100%真实格式
  // if (showHomeDepotDemo) {
  //   return <RealHomeDepotDemo onClose={() => setShowHomeDepotDemo(false)} />;
  // }

  // Admin 登录页必须先于 session 验证渲染；否则 Supabase 初始化慢时会卡在 Loading。
  if (currentPage === 'admin-login' || currentPage === 'admin-formal-login') {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        {currentPage === 'admin-login' ? <LazyAdminLogin /> : <LazyAdminFormalLogin />}
        <Toaster />
      </Suspense>
    );
  }

  // 等待 Supabase session 验证完成，防止闪烁或卡死
  if (authLoading) {
    return <PageLoadFallback />;
  }

  // If user is logged in as admin, show admin dashboard
  if (user && user.type === 'admin' && !isPublicSitePage(currentPage)) {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        <LazyAdminDashboard onLogout={async () => {
          await logout();
          navigateTo('home');
        }} />
        <Toaster />
      </Suspense>
    );
  }

  // If user is logged in as supplier, show supplier dashboard
  if (user && user.type === 'supplier') {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        <LazySupplierDashboard onLogout={async () => {
          await logout();
          navigateTo('home');
        }} />
        <Toaster />
      </Suspense>
    );
  }

  // 🔥 数据库初始化页面 - 独立全屏显示，不需要Header/Footer
  if (currentPage === 'init-database') {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        <LazyDatabaseInitializer />
        <Toaster />
      </Suspense>
    );
  }

  // If customer is logged in, never keep rendering the auth pages.
  if (showCustomerDashboard) {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        <ProtectedRoute portalType="customer">
          <LazyCustomerDashboard
            onLogout={async () => {
              await logout();
              navigateTo('home');
            }}
            userEmail={user.email || 'customer@example.com'}
          />
        </ProtectedRoute>
        <Toaster />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-white" lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppErrorBoundary scope="RegionSelectorModal">
        <RegionSelectorModal />
      </AppErrorBoundary>
      <AppErrorBoundary scope="Header">
        <Header />
      </AppErrorBoundary>
      <AppErrorBoundary scope="MainRegionTransition">
        <RegionTransition>
          <main>
            <Suspense fallback={<PageLoadFallback />}>
            {currentPage === 'home' && <LazyHome />}
            {currentPage === 'retail-wholesale' && <LazyRetailWholesale />}
            {currentPage === 'fabricators' && <LazyFabricators />}
            {currentPage === 'china-agent' && <LazyChinaAgent />}
            {currentPage === 'projectsolution' && <LazyProjectSolution />}
            {currentPage === 'qcmaster' && <LazyQCMaster />}
            {currentPage === 'shipmenthub' && <LazyShipmentHub />}
            {currentPage === 'specials' && <LazySpecialOffers />}
            {currentPage === 'products' && <LazyProductCenter />}
            {currentPage === 'catalog' && <LazyProductCatalog />}
            {currentPage === 'failurecases' && <LazyFailureCases />}
            {currentPage === 'services' && <LazyServices />}
            {currentPage === 'socialmedia' && <LazySocialMedia />}
            {currentPage === 'news' && <LazyNews />}
            {currentPage === 'about' && <LazyAbout />}
            {currentPage === 'member' && <LazyMember />}
            {currentPage === 'login' && <LazyLogin />}
            {currentPage === 'admin-login' && <LazyAdminLogin />}
            {currentPage === 'admin-formal-login' && <LazyAdminFormalLogin />}
            {currentPage === 'register' && <LazyRegister />}
            {currentPage === 'dashboard' && (
              <ProtectedRoute portalType="customer">
                <LazyCustomerDashboard
                  onLogout={async () => {
                    await logout();
                    navigateTo('home');
                  }}
                  userEmail={user?.email || 'customer@example.com'}
                />
              </ProtectedRoute>
            )}
            {currentPage === 'supplier' && <LazyBecomeSupplier />}
            {currentPage === 'furnitureinspection' && <LazyFurnitureInspectionStandards />}
            {currentPage === 'textilesinspection' && <LazyTextilesInspectionStandards />}
            {currentPage === 'toysinspection' && <LazyToysInspectionStandards />}
            {currentPage === 'electronicsinspection' && <LazyElectronicsInspectionStandards />}
            {currentPage === 'appliancesinspection' && <LazyAppliancesInspectionStandards />}
            {currentPage === 'lightinginspection' && <LazyLightingInspectionStandards />}
            {currentPage === 'shoesinspection' && <LazyShoesInspectionStandards />}
            {currentPage === 'packaginginspection' && <LazyPackagingInspectionStandards />}
            {currentPage === 'privacy-policy' && <LazyPrivacyPolicy />}
            {currentPage === 'terms-of-service' && <LazyTermsOfService />}
            {currentPage === 'live' && <LazyLiveStreamPage />}
            {currentPage === 'live-archive' && <LazyLiveArchivePage />}
            {currentPage.startsWith('category-') && (
              <LazyCategoryDetail category={categoryParams?.category} subcategory={categoryParams?.subcategory} />
            )}
            {currentPage === 'cart' && <LazyCart />}
            {currentPage === 'clear-sales-orders' && <LazyClearSalesOrderHelper />}
            {currentPage === 'document-test' && <LazyDocumentTestPage />}
            {currentPage === 'header-layout-options' && <LazyHeaderLayoutOptions />}
            {!isKnownPublicPage && <LazyHome />}
            </Suspense>
          </main>
        </RegionTransition>
      </AppErrorBoundary>
      <AppErrorBoundary scope="Footer">
        <Footer />
      </AppErrorBoundary>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider>
        <CartProvider>
          <UserProvider>
            <AppShell />
          </UserProvider>
        </CartProvider>
      </RouterProvider>
    </LanguageProvider>
  );
}
