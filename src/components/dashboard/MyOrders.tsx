import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TruckIcon,
  Package,
  PlusCircle,
  GripVertical
} from 'lucide-react';
import { InquiryManagement } from './InquiryManagement';
import { ActiveOrders } from './ActiveOrders';
import { OrderHistory } from './OrderHistory';
import { OrderTracking } from './OrderTracking';
import { MyOrdersOverview } from './MyOrdersOverview';
import { QuotationReceived } from './QuotationReceived';
import { CreateOrder } from './CreateOrder';
import { CustomerNotificationCenter } from '../CustomerNotificationCenter';

interface TabItem {
  id: string;
  label: string;
  icon: any;
}

interface DraggableTabProps {
  tab: TabItem;
  index: number;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
}

const DraggableTab = ({ 
  tab, 
  index, 
  moveTab, 
  activeTab, 
  setActiveTab,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}: DraggableTabProps) => {
  const Icon = tab.icon;

  return (
    <div 
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      <TabsTrigger 
        value={tab.id}
        className="flex items-center gap-1.5 px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#F96302] data-[state=active]:bg-[#FFF4ED] transition-all"
        style={{ fontSize: '13px', fontWeight: 600 }}
      >
        <GripVertical className="w-3 h-3 text-gray-300 -ml-0.5" strokeWidth={2} />
        <Icon className="w-4 h-4" strokeWidth={2.5} />
        <span className="uppercase tracking-wide whitespace-nowrap">{tab.label}</span>
      </TabsTrigger>
    </div>
  );
};

interface MyOrdersProps {
  activeOrders: any[];
  orderHistory: any[];
  onNavigate?: (view: string) => void;
  draftOrder?: any;
  onOrderSubmitted?: (order: any) => void;
  onNavigateToShop?: () => void;
}

export function MyOrders({ 
  activeOrders, 
  orderHistory, 
  onNavigate,
  draftOrder,
  onOrderSubmitted,
  onNavigateToShop
}: MyOrdersProps) {
  // 🔥 从localStorage读取默认tab（用于从Profit Analyzer返回时自动定位到quotations）
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('myOrders_activeTab');
    if (savedTab) {
      localStorage.removeItem('myOrders_activeTab'); // 读取后立即清除
      return savedTab;
    }
    return 'overview';
  });
  
  // Default tab order
  const defaultTabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inquiries', label: 'Inquiries', icon: FileText },
    { id: 'quotations', label: 'Quotations', icon: DollarSign },
    { id: 'active', label: 'Active Orders', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
    { id: 'tracking', label: 'Tracking', icon: TruckIcon },
    { id: 'create', label: 'Create Order', icon: PlusCircle }
  ];

  const [tabs, setTabs] = useState<TabItem[]>(defaultTabs);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Load tab order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('myOrdersTabOrder');
    if (savedOrder) {
      try {
        const savedTabIds = JSON.parse(savedOrder) as string[];
        const reorderedTabs = savedTabIds
          .map(id => defaultTabs.find(tab => tab.id === id))
          .filter((tab): tab is TabItem => tab !== undefined);
        
        // Add any new tabs that might not be in saved order
        const missingTabs = defaultTabs.filter(
          tab => !savedTabIds.includes(tab.id)
        );
        
        setTabs([...reorderedTabs, ...missingTabs]);
      } catch (error) {
        console.error('Failed to load tab order:', error);
      }
    }
  }, []);

  // Save tab order to localStorage whenever it changes
  useEffect(() => {
    const tabIds = tabs.map(tab => tab.id);
    localStorage.setItem('myOrdersTabOrder', JSON.stringify(tabIds));
  }, [tabs]);

  const moveTab = (dragIndex: number, hoverIndex: number) => {
    const newTabs = [...tabs];
    const [draggedTab] = newTabs.splice(dragIndex, 1);
    newTabs.splice(hoverIndex, 0, draggedTab);
    setTabs(newTabs);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      moveTab(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* Header Section with Icon */}
      <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F96302] rounded-sm flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '20px', fontWeight: 700 }}>
                MY ORDERS
              </h1>
              <p className="text-gray-600 mt-1" style={{ fontSize: '13px', fontWeight: 400 }}>
                Manage all your inquiries, quotations, and orders in one place
              </p>
            </div>
          </div>
          
          {/* 🔔 Notification Center - Right Side */}
          <div className="flex-shrink-0">
            <CustomerNotificationCenter />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-2 border-gray-200 rounded-sm shadow-sm">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b-2 border-gray-200 rounded-none">
            {tabs.map((tab, index) => (
              <DraggableTab 
                key={tab.id}
                tab={tab}
                index={index}
                moveTab={moveTab}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={dragIndex === index}
              />
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          <TabsContent value="overview" className="m-0">
            <MyOrdersOverview 
              activeOrders={activeOrders}
              orderHistory={orderHistory}
              onNavigate={onNavigate}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="inquiries" className="m-0">
            <InquiryManagement />
          </TabsContent>

          <TabsContent value="quotations" className="m-0">
            <QuotationReceived onNavigate={onNavigate} onSwitchMyOrdersTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="active" className="m-0">
            <ActiveOrders orders={activeOrders} onNavigate={onNavigate} />
          </TabsContent>

          <TabsContent value="completed" className="m-0">
            <OrderHistory orders={orderHistory} />
          </TabsContent>

          <TabsContent value="tracking" className="m-0">
            <OrderTracking />
          </TabsContent>

          <TabsContent value="create" className="m-0">
            <CreateOrder 
              draftOrder={draftOrder}
              onOrderSubmitted={onOrderSubmitted}
              onNavigateToShop={onNavigateToShop}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}