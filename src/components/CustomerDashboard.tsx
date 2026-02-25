import { useRef, useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronLeft, ChevronRight, User, LayoutDashboard, Package, DollarSign, Bell, BarChart3, Mail, FileText, GripVertical, Home, Calculator, Target } from 'lucide-react';
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
import { MyDocuments } from './dashboard/MyDocuments'; // 📄 客户文档中心
import { ProfitAnalyzerPro } from './dashboard/ProfitAnalyzerPro'; // 🔥 利润分析器Pro
import { SupplierEvaluationSystem } from './dashboard/SupplierEvaluationSystem'; // 🎯 供应商评估系统 v2.0

interface CustomerDashboardProps {
  onLogout: () => void | Promise<void>;
  userEmail: string;
}

const DEFAULT_DASHBOARD_VIEW = 'overview';
const VALID_DASHBOARD_VIEWS = new Set([
  'overview',
  'profile',
  'my-orders',
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { navigateTo } = useRouter();
  const { clearUser } = useUser();

  // Save active view to localStorage whenever it changes
  useEffect(() => {
    if (!VALID_DASHBOARD_VIEWS.has(activeView)) {
      setActiveView(DEFAULT_DASHBOARD_VIEW);
      return;
    }
    localStorage.setItem('dashboardActiveView', activeView);
    console.log('💾 Saved dashboard view:', activeView);
  }, [activeView]);

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

  // Menu items state with drag and drop support
  const defaultMenuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'my-orders', label: 'My Orders', icon: Package },
    { id: 'rate-request', label: 'Rate Request', icon: DollarSign },
    { id: 'analytics', label: 'Data Analytics', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'documents', label: 'My Documents', icon: FileText }, // 📄 客户文档中心
    { id: 'profit-analyzer', label: 'Profit Analyzer', icon: Calculator }, // 🔥 利润分析器
    { id: 'supplier-evaluation', label: 'Supplier Evaluation', icon: Target }, // 🎯 供应商评估系统 v2.0
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
        return <CustomerProfile forceEditToken={profileEditToken} />;
      case 'my-orders':
        return <MyOrders 
          activeOrders={activeOrders} 
          orderHistory={historicalOrders} 
          onNavigate={setActiveView}
          draftOrder={draftOrder}
          onOrderSubmitted={handleOrderSubmitted}
          onNavigateToShop={() => navigateTo('home')}
        />;
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
    <div className="min-h-screen bg-gray-50">
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
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Resizable Sidebar - Desktop Only */}
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
          className={`
            fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-50
            transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
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
                  setActiveView('profile');
                  setProfileEditToken(Date.now());
                }}
                className="w-full flex items-center gap-3 overflow-hidden text-left group"
              >
                <div
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-300 transition"
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
                  <p className="text-xs text-gray-500 whitespace-nowrap">Premium Member · Click to edit profile</p>
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg mb-3 border-2 border-blue-400 overflow-hidden"
                >
                  <Home className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap truncate">Back to Website</span>
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
                            ? 'bg-red-600 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
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
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 text-sm overflow-hidden bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap truncate">Logout</span>
              </Button>
            </div>
          </div>
        </Resizable>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-x-hidden">
          {/* 🌟 客户成长使命Banner */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b-2 border-orange-200">
            <div className="px-4 lg:px-8 py-4 max-w-[1600px] mx-auto">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#F96302] to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                    Empowering Your Business Growth 🚀
                  </h2>
                  <p className="text-sm text-gray-700">
                    COSUN is committed to providing quality products and services, growing together with you to achieve business success
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-3 text-sm">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-200">
                    <span className="text-gray-600">Our Mission:</span>
                    <span className="font-semibold text-[#F96302] ml-1">Customer Growth · Win-Win Future</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
