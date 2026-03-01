/**
 * 按路由懒加载页面，减小首包体积，便于 Figma / 构建 通过。
 * 每个页面打成独立 chunk，首屏只加载当前路由所需代码。
 */
import React from 'react';

// 公网站点页面
export const LazyHome = React.lazy(() =>
  import('./components/Home').then((m) => ({ default: m.Home }))
);
export const LazyProjectSolution = React.lazy(() =>
  import('./components/ProjectSolution').then((m) => ({ default: m.ProjectSolution }))
);
export const LazyQCMaster = React.lazy(() =>
  import('./components/QCMaster').then((m) => ({ default: m.QCMaster }))
);
export const LazyShipmentHub = React.lazy(() =>
  import('./components/ShipmentHub').then((m) => ({ default: m.ShipmentHub }))
);
export const LazySpecialOffers = React.lazy(() =>
  import('./components/SpecialOffers').then((m) => ({ default: m.SpecialOffers }))
);
export const LazyProductCenter = React.lazy(() =>
  import('./components/ProductCenter').then((m) => ({ default: m.ProductCenter }))
);
export const LazyProductCatalog = React.lazy(() =>
  import('./components/ProductCatalog').then((m) => ({ default: m.ProductCatalog }))
);
export const LazyFailureCases = React.lazy(() =>
  import('./components/FailureCases').then((m) => ({ default: m.FailureCases }))
);
export const LazyServices = React.lazy(() =>
  import('./components/Services').then((m) => ({ default: m.Services }))
);
export const LazySocialMedia = React.lazy(() =>
  import('./components/SocialMedia').then((m) => ({ default: m.SocialMedia }))
);
export const LazyNews = React.lazy(() =>
  import('./components/News').then((m) => ({ default: m.News }))
);
export const LazyAbout = React.lazy(() =>
  import('./components/About').then((m) => ({ default: m.About }))
);
export const LazyMember = React.lazy(() =>
  import('./components/Member').then((m) => ({ default: m.Member }))
);
export const LazyLogin = React.lazy(() =>
  import('./components/Login').then((m) => ({ default: m.Login }))
);
export const LazyAdminLogin = React.lazy(() => import('./components/AdminLogin'));
export const LazyRegister = React.lazy(() =>
  import('./components/Register').then((m) => ({ default: m.Register }))
);
export const LazyBecomeSupplier = React.lazy(() =>
  import('./components/BecomeSupplier').then((m) => ({ default: m.BecomeSupplier }))
);
export const LazyCategoryDetail = React.lazy(() =>
  import('./components/CategoryDetail').then((m) => ({ default: m.CategoryDetail }))
);
export const LazyCart = React.lazy(() =>
  import('./components/Cart').then((m) => ({ default: m.Cart }))
);
export const LazyPrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));
export const LazyTermsOfService = React.lazy(() => import('./components/TermsOfService'));
export const LazyCustomerDashboard = React.lazy(() =>
  import('./components/CustomerDashboard').then((m) => ({ default: m.CustomerDashboard }))
);
export const LazyAdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
export const LazySupplierDashboard = React.lazy(() => import('./components/SupplierDashboard'));
export const LazyDatabaseInitializer = React.lazy(() => import('./components/DatabaseInitializer'));

// 验货标准页
export const LazyFurnitureInspectionStandards = React.lazy(() =>
  import('./components/FurnitureInspectionStandards').then((m) => ({ default: m.FurnitureInspectionStandards }))
);
export const LazyTextilesInspectionStandards = React.lazy(() =>
  import('./components/TextilesInspectionStandards').then((m) => ({ default: m.TextilesInspectionStandards }))
);
export const LazyToysInspectionStandards = React.lazy(() =>
  import('./components/ToysInspectionStandards').then((m) => ({ default: m.ToysInspectionStandards }))
);
export const LazyElectronicsInspectionStandards = React.lazy(() =>
  import('./components/ElectronicsInspectionStandards').then((m) => ({ default: m.ElectronicsInspectionStandards }))
);
export const LazyAppliancesInspectionStandards = React.lazy(() =>
  import('./components/AppliancesInspectionStandards').then((m) => ({ default: m.AppliancesInspectionStandards }))
);
export const LazyLightingInspectionStandards = React.lazy(() =>
  import('./components/LightingInspectionStandards').then((m) => ({ default: m.LightingInspectionStandards }))
);
export const LazyShoesInspectionStandards = React.lazy(() =>
  import('./components/ShoesInspectionStandards').then((m) => ({ default: m.ShoesInspectionStandards }))
);
export const LazyPackagingInspectionStandards = React.lazy(() =>
  import('./components/PackagingInspectionStandards').then((m) => ({ default: m.PackagingInspectionStandards }))
);

// 工具/测试页
export const LazyRealHomeDepotDemo = React.lazy(() => import('./components/RealHomeDepotDemo'));
export const LazyAdvancedFormDemo = React.lazy(() => import('./components/AdvancedFormDemo'));
export const LazyClearSalesOrderHelper = React.lazy(() => import('./components/admin/ClearSalesOrderHelper'));
export const LazyDocumentTestPage = React.lazy(() => import('./components/documents/DocumentTestPage'));
export const LazyHeaderLayoutOptions = React.lazy(() => import('./components/documents/HeaderLayoutOptions'));