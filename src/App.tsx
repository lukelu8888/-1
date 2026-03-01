import './styles/globals.css';
import React, { Suspense, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import {
  LazyHome,
  LazyProjectSolution,
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
  LazyRegister,
  LazyBecomeSupplier,
  LazyCategoryDetail,
  LazyCart,
  LazyPrivacyPolicy,
  LazyTermsOfService,
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
import { LanguageProvider } from './contexts/LanguageContext';

function PageLoadFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      Loading…
    </div>
  );
}
import { RouterProvider, useRouter } from './contexts/RouterContext';
import { CartProvider } from './contexts/CartContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { RegionProvider, useRegion } from './contexts/RegionContext';
import { InquiryProvider } from './contexts/InquiryContext';
import { OrderProvider } from './contexts/OrderContext';
import { QuotationProvider } from './contexts/QuotationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ApprovalProvider } from './contexts/ApprovalContext'; // 🔥 审批工作流
import { PurchaseRequirementProvider } from './contexts/PurchaseRequirementContext'; // 🔥 采购需求管理
import { PurchaseOrderProvider } from './contexts/PurchaseOrderContext'; // 🔥 采购订单管理
import { RFQProvider } from './contexts/RFQContext'; // 🔥 询价管理
import { QuotationRequestProvider } from './contexts/QuotationRequestContext'; // 🔥 报价请求管理
import { SalesQuotationProvider } from './contexts/SalesQuotationContext'; // 🔥 销售报价管理（QT）
import { SalesOrderProvider } from './contexts/SalesOrderContext'; // 🔥 销售订单管理（SO）
import { SalesContractProvider } from './contexts/SalesContractContext'; // 🔥 销售合同管理（SC）
import { OrganizationProvider } from './contexts/OrganizationContext'; // 🔥 供应商组织信息管理
import { AdminOrganizationProvider } from './contexts/AdminOrganizationContext'; // 🔥 Admin主体公司信息管理
import { RegionSelectorModal } from './components/RegionSelectorModal';
import { RegionTransition } from './components/RegionTransition';
import { Toaster } from './components/ui/sonner';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
// ❌ 已禁用：文件不存在
// import PreviewPODocument from './preview-po-document';
// import CategoryDemo from './pages/CategoryDemo';
// import ShipmentDemo from './pages/ShipmentDemo';

function AppContent() {
  const { currentPage, categoryParams, navigateTo } = useRouter();
  const { user, authLoading, logout } = useUser();
  const { setRegion } = useRegion();
  const [showHomeDepotDemo, setShowHomeDepotDemo] = useState(false);
  const isKnownPublicPage =
    [
      'home',
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
      'cart',
      'clear-sales-orders',
      'document-test',
      'header-layout-options',
      'test-inquiry-flow',
      'init-database',
    ].includes(currentPage) || currentPage.startsWith('category-');

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

  // 等待 Supabase session 验证完成，防止闪烁或卡死
  if (authLoading) {
    return <PageLoadFallback />;
  }

  // If user is logged in as admin, show admin dashboard
  if (user && user.type === 'admin') {
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

  // If user is logged in as customer and on dashboard page, show dashboard
  if (user && user.type === 'customer' && currentPage === 'dashboard') {
    return (
      <Suspense fallback={<PageLoadFallback />}>
        <LazyCustomerDashboard
          onLogout={async () => {
            await logout();
            navigateTo('home');
          }}
          userEmail={user.email || 'customer@example.com'}
        />
        <Toaster />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-white" lang="en">
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
            {currentPage === 'register' && <LazyRegister />}
            {currentPage === 'dashboard' && user && user.type === 'customer' && (
              <LazyCustomerDashboard
                onLogout={async () => {
                  await logout();
                  navigateTo('home');
                }}
                userEmail={user.email || 'customer@example.com'}
              />
            )}
            {currentPage === 'dashboard' && !user && (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">请先登录以访问个人中心</p>
                  <button
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                    onClick={() => navigateTo('login')}
                  >
                    前往登录
                  </button>
                </div>
              </div>
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
            <AdminOrganizationProvider>
            <OrganizationProvider>
            <RegionProvider>
              <InquiryProvider>
                <OrderProvider>
                  <QuotationProvider>
                    <NotificationProvider>
                      <FinanceProvider>
                        <PaymentProvider>
                          <ApprovalProvider>
                            <PurchaseRequirementProvider>
                              <PurchaseOrderProvider>
                                <RFQProvider>
                                  <QuotationRequestProvider>
                                    <SalesQuotationProvider>
                                      <SalesOrderProvider>
                                        <SalesContractProvider>
                                          <AppErrorBoundary scope="AppContentRoot">
                                            <AppContent />
                                          </AppErrorBoundary>
                                        </SalesContractProvider>
                                      </SalesOrderProvider>
                                    </SalesQuotationProvider>
                                  </QuotationRequestProvider>
                                </RFQProvider>
                              </PurchaseOrderProvider>
                            </PurchaseRequirementProvider>
                          </ApprovalProvider>
                        </PaymentProvider>
                      </FinanceProvider>
                    </NotificationProvider>
                  </QuotationProvider>
                </OrderProvider>
              </InquiryProvider>
            </RegionProvider>
            </OrganizationProvider>
            </AdminOrganizationProvider>
          </UserProvider>
        </CartProvider>
      </RouterProvider>
    </LanguageProvider>
  );
}
