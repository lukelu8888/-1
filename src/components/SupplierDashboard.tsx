import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { LayoutDashboard, Package, Factory, FileText, MessageSquare, DollarSign, LogOut, Calculator, Shield, ChevronLeft, ChevronRight, User, Bell, Beaker, Building2, Boxes, Truck, Layers, Settings, ClipboardList, GripVertical, ChevronDown, UserCircle } from 'lucide-react';
import SupplierOverview from './supplier/SupplierOverview';
import CustomerOrders from './supplier/CustomerOrders';
import ProductionManagement from './supplier/ProductionManagement';
import SupplierDocuments from './supplier/SupplierDocuments';
import SupplierDocumentsWorkflow from './supplier/SupplierDocumentsWorkflow';
import SupplierDocumentsWorkflowCompact from './supplier/SupplierDocumentsWorkflowCompact';
import SupplierDocumentsWorkflowCompactV2 from './supplier/SupplierDocumentsWorkflowCompactV2';
import SupplierMessages from './supplier/SupplierMessages';
import SupplierFinancial from './supplier/SupplierFinancial';
import SupplierQuotationsSimple from './supplier/SupplierQuotationsSimple';
import SupplierQualityControl from './supplier/SupplierQualityControl';
import SampleManagement from './supplier/SampleManagement';
import ResourceCenter from './supplier/ResourceCenter';
import TechnicalCenter from './supplier/TechnicalCenter';
import CategoryManagement from './supplier/CategoryManagement';
import IndustryInitWizard from './supplier/IndustryInitWizard';
import SupplierOrderManagementCenter from './supplier/SupplierOrderManagementCenter';
import SupplierOrderManagementCenterV2 from './supplier/SupplierOrderManagementCenterV2';
import QuickQuotationCreator from './supplier/QuickQuotationCreator';
import OrganizationProfile from './supplier/OrganizationProfile';
import UserProfile from './supplier/UserProfile';
import { UserAvatar } from './supplier/UserProfile';
import { Badge } from './ui/badge';
import { getCurrentUser } from '../data/authorizedUsers';
import { isIndustryInitialized } from '../data/industryTemplates';
import { useOrganization } from '../contexts/OrganizationContext';

interface SupplierDashboardProps {
  onLogout: () => void | Promise<void>;
}

// 🔥 定义菜单项类型
interface MenuItem {
  id: string;
  label: string;
  enLabel: string;
  icon: any;
  highlight?: boolean;
  badge?: number;
}

export default function SupplierDashboard({ onLogout }: SupplierDashboardProps) {
  const { org, userProfile } = useOrganization();

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('supplierDashboardActiveTab');
    return savedTab || 'overview';
  });

  // Remember which tab was active before going to a profile page so we can go back
  const [prevTab, setPrevTab] = useState('overview');

  const navigateTo = (tab: string) => {
    // If we're navigating away from a non-profile page, remember it
    if (activeTab !== 'organization-profile' && activeTab !== 'user-profile') {
      setPrevTab(activeTab);
    }
    setActiveTab(tab);
  };

  const goBack = () => {
    setActiveTab(prevTab);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showInitWizard, setShowInitWizard] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // User dropdown menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click-outside to close user menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentUser = getCurrentUser();
  // Use org context name, fall back to authorized user data
  const companyName = org.name !== '供应商公司' ? org.name : (currentUser?.company || '供应商公司');
  const companyShortName = companyName.length > 6 ? companyName.substring(0, 6) + '...' : companyName;

  // 🔥 检查是否需要显示行业初始化向导
  useEffect(() => {
    const initialized = isIndustryInitialized();
    if (!initialized) {
      setShowInitWizard(true);
    }
  }, []);

  // 当 activeTab 改变时，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('supplierDashboardActiveTab', activeTab);
    console.log('📍 供应商模块已保存:', activeTab);
  }, [activeTab]);

  // 🔥 默认菜单项配置
  const defaultMenuItems: MenuItem[] = [
    { id: 'overview', label: '工作台', enLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'order-management-center', label: '订单管理中心', enLabel: 'Order Management Center', icon: ClipboardList },
    { id: 'sample-management', label: '样品管理', enLabel: 'Sample Management', icon: Beaker },
    { id: 'production', label: '生产管理', enLabel: 'Production', icon: Factory },
    { id: 'quality-control', label: '品质交期', enLabel: 'QC & Delivery', icon: Shield },
    { id: 'technical-center', label: '技术中心', enLabel: 'Technical Center', icon: Layers },
    { id: 'financial', label: '财务中心', enLabel: 'Financial', icon: DollarSign },
    { id: 'resource-center', label: '资源中心', enLabel: 'Resource Center', icon: Building2 },
    { id: 'documents', label: '文档中心', enLabel: 'Documents', icon: FileText },
    { id: 'documents-workflow', label: '订单流程文档', enLabel: 'Order Workflow', icon: FileText }, // 🔥 V2极致紧凑版
    { id: 'messages', label: '消息通讯', enLabel: 'Messages', icon: MessageSquare, badge: 2 },
    { id: 'category-management', label: '产品类别管理', enLabel: 'Category Management', icon: Settings },
  ];

  // 🔥 从localStorage读取菜单排序，如果没有则使用默认顺序
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const savedOrder = localStorage.getItem('supplierMenuOrder');
    console.log('🔍 [SupplierDashboard] 读取保存的菜单顺序:', savedOrder);
    
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        console.log('📋 [SupplierDashboard] 解析后的菜单ID顺序:', orderIds);
        
        // 根据保存的顺序重新排列菜单
        const orderedItems = orderIds
          .map((id: string) => defaultMenuItems.find(item => item.id === id))
          .filter((item: MenuItem | undefined): item is MenuItem => item !== undefined);
        
        console.log('✅ [SupplierDashboard] 重新排列后的菜单数量:', orderedItems.length);
        
        // 检查是否有新增的菜单项（不在保存的顺序中）
        const newItems = defaultMenuItems.filter(
          item => !orderIds.includes(item.id)
        );
        
        if (newItems.length > 0) {
          console.log('🆕 [SupplierDashboard] 发现新增菜单项:', newItems.map(i => i.label));
        }
        
        const finalItems = [...orderedItems, ...newItems];
        console.log('🎯 [SupplierDashboard] 最终菜单顺序:', finalItems.map(i => i.label));
        return finalItems;
      } catch (error) {
        console.error('❌ [SupplierDashboard] 读取菜单顺序失败:', error);
        return defaultMenuItems;
      }
    }
    
    console.log('📋 [SupplierDashboard] 使用默认菜单顺序');
    return defaultMenuItems;
  });

  // 🔥 保存菜单顺序到localStorage
  const saveMenuOrder = (items: MenuItem[]) => {
    const orderIds = items.map(item => item.id);
    localStorage.setItem('supplierMenuOrder', JSON.stringify(orderIds));
    console.log('💾 [SupplierDashboard] 菜单顺序已保存:', orderIds);
    console.log('💾 [SupplierDashboard] 菜单标签顺序:', items.map(i => i.label));
    
    // 🔥 验证保存结果
    const saved = localStorage.getItem('supplierMenuOrder');
    console.log('✅ [SupplierDashboard] 验证保存结果:', saved);
  };

  // 🔥 拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  // 🔥 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // 🔥 拖拽结束
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newMenuItems = [...menuItems];
      const draggedItem = newMenuItems[draggedIndex];
      
      // 移除被拖拽的项
      newMenuItems.splice(draggedIndex, 1);
      // 在新位置插入
      newMenuItems.splice(dragOverIndex, 0, draggedItem);
      
      setMenuItems(newMenuItems);
      saveMenuOrder(newMenuItems);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 🔥 拖拽离开
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SupplierOverview />;
      case 'production':
        return <ProductionManagement />;
      case 'quality-control':
        return <SupplierQualityControl />;
      case 'documents':
        return <SupplierDocuments />;
      case 'documents-workflow':
        return <SupplierDocumentsWorkflowCompactV2 />; // 🔥 V2极致紧凑版（台湾大厂风格）
      case 'financial':
        return <SupplierFinancial />;
      case 'messages':
        return <SupplierMessages />;
      case 'sample-management':
        return <SampleManagement />; // 🔥 样品管理
      case 'resource-center':
        return <ResourceCenter />; // 🔥 资源中心
      case 'technical-center':
        return <TechnicalCenter />; // 🔥 技术中心
      case 'category-management':
        return <CategoryManagement />; // 🔥 产品类别管理
      case 'order-management-center':
        return <SupplierOrderManagementCenter />;
      case 'organization-profile':
        return <OrganizationProfile onBack={goBack} />;
      case 'user-profile':
        return <UserProfile onBack={goBack} />;
      default:
        return <SupplierOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 🔥 行业初始化向导（首次使用时自动弹出） */}
      <IndustryInitWizard 
        open={showInitWizard} 
        onComplete={() => setShowInitWizard(false)} 
      />

      {/* 左侧固定侧边栏 - 台湾大厂风格 */}
      <aside 
        className={`bg-slate-800 text-white flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* ── Org logo / company name (clickable → Organization Profile) ── */}
        <div
          className="h-16 flex items-center justify-center border-b border-slate-700 px-3 cursor-pointer hover:bg-slate-700/50 transition-colors group"
          onClick={() => navigateTo('organization-profile')}
          title="公司信息"
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 w-full">
              {/* Logo or placeholder */}
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt="Company Logo"
                  className="w-9 h-9 rounded object-contain bg-white flex-shrink-0 border border-slate-600"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-sm select-none">
                  {companyName.slice(0, 1)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white truncate group-hover:text-orange-300 transition-colors" style={{ fontSize: '13px', fontWeight: 600 }} title={companyName}>{companyShortName}</p>
                <p className="text-slate-400 truncate" style={{ fontSize: '10px' }}>Supplier Portal</p>
              </div>
            </div>
          ) : (
            <>
              {org.logoUrl ? (
                <img src={org.logoUrl} alt="Logo" className="w-9 h-9 rounded object-contain bg-white border border-slate-600" />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center text-white font-bold text-sm select-none">
                  {companyName.slice(0, 1)}
                </div>
              )}
            </>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              
              return (
                <li key={item.id}>
                  <div
                    className={`relative ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'mt-2' : ''} transition-all`}
                    draggable={!sidebarCollapsed}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                  >
                    {/* 🔥 拖拽指示线 */}
                    {isDragOver && draggedIndex !== null && draggedIndex !== index && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                    )}
                    
                    <button
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded transition-colors relative cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      {/* 🔥 拖拽手柄 */}
                      {!sidebarCollapsed && (
                        <GripVertical className="w-3 h-3 opacity-50 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                      )}
                      
                      <Icon className={`flex-shrink-0 ${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      {!sidebarCollapsed && (
                        <>
                          <div className="flex-1 text-left min-w-0">
                            <p className="truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</p>
                            <p className="text-xs opacity-75 truncate">{item.enLabel}</p>
                          </div>
                          {item.badge && (
                            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          {item.highlight && (
                            <div className="flex items-center gap-1">
                              <Badge className="h-5 px-2 text-xs bg-orange-500 hover:bg-orange-600">
                                NEW
                              </Badge>
                            </div>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && item.badge && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white" style={{ fontSize: '10px' }}>
                          {item.badge}
                        </div>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部折叠按钮 */}
        <div className="h-14 border-t border-slate-700 flex items-center justify-center">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* 右侧主要内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 - 简洁扁平风格 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          {/* 左侧：COSUN供应商使命 Slogan */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-900" style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.2' }}>
                  客户因我而强大 💪
                </p>
                <p className="text-blue-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                  助力客户，我们的责任
                </p>
              </div>
            </div>
          </div>

          {/* ── Right toolbar ── */}
          <div className="flex items-center gap-3">
            {/* Company name (links to org profile) */}
            <button
              onClick={() => navigateTo('organization-profile')}
              className="hidden lg:block text-right border-r pr-4 hover:opacity-70 transition-opacity"
              title="公司信息"
            >
              <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 500 }}>{companyName}</p>
              <p className="text-gray-500" style={{ fontSize: '11px' }}>Supplier</p>
            </button>

            {/* Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative border-l pl-3" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
              >
                <UserAvatar
                  avatarUrl={userProfile.avatarUrl}
                  name={userProfile.name}
                  size={32}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 500 }}>{userProfile.name}</p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>{userProfile.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
                  <button
                    onClick={() => { navigateTo('user-profile'); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-gray-400" />
                    个人资料
                  </button>
                  <button
                    onClick={() => { navigateTo('organization-profile'); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-gray-400" />
                    公司信息
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={async () => { setUserMenuOpen(false); await onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 主内容区域 - 可滚动 */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}