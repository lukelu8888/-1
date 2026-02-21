import React, { createContext, useContext, useState, ReactNode } from 'react';

// 🎯 销售订单（SO）- 客户接受报价后创建

export interface SalesOrderItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  
  // 价格信息（从QT锁定）
  salesPrice: number; // 销售价格
  costPrice: number; // 采购成本
  profit: number; // 利润
  profitMargin: number; // 利润率
  
  // 供应商信息
  selectedSupplier: string;
  selectedSupplierName: string;
  selectedBJ: string; // 关联的供应商报价单号
  
  hsCode?: string;
  remarks?: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string; // SO-NA-251219-8888
  
  // 关联单据
  qtNumber: string; // QT-NA-251219-6789（销售报价单）
  qrNumber: string; // QR-NA-251219-1234（采购需求单）
  inqNumber: string; // INQ-NA-251219-0001（客户询价单）
  
  // 区域和客户
  region: 'NA' | 'SA' | 'EU';
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  
  // 业务员信息
  salesPerson: string;
  salesPersonName: string;
  
  // 订单产品（从QT复制，价格锁定）
  items: SalesOrderItem[];
  
  // 财务汇总
  totalAmount: number; // 总金额（销售价）
  totalCost: number; // 总成本
  totalProfit: number; // 总利润
  profitRate: number; // 利润率
  
  // 付款和交付条件
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryDate: string;
  
  // 订单状态
  status: 'confirmed' | 'purchasing' | 'in_production' | 'qc_inspection' | 'shipping' | 'delivered' | 'completed' | 'cancelled';
  
  // 付款状态
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount?: number;
  
  // 关联的采购订单（PO）
  poNumbers: string[]; // [PO-5678, PO-5679, PO-5680]
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string; // 订单确认时间
  completedAt?: string; // 订单完成时间
  
  // 备注
  notes?: string;
  
  // 客户订单号（如果客户提供）
  customerPONumber?: string;
}

interface SalesOrderContextType {
  orders: SalesOrder[];
  addOrder: (order: SalesOrder) => void;
  updateOrder: (id: string, updates: Partial<SalesOrder>) => void;
  deleteOrder: (id: string) => void;
  getOrderById: (id: string) => SalesOrder | undefined;
  getOrderByNumber: (soNumber: string) => SalesOrder | undefined;
  getOrdersByQT: (qtNumber: string) => SalesOrder[];
  getOrdersByCustomer: (customerEmail: string) => SalesOrder[];
  getOrdersBySalesPerson: (salesPersonEmail: string) => SalesOrder[];
}

const SalesOrderContext = createContext<SalesOrderContextType | undefined>(undefined);

export const SalesOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 从localStorage加载初始数据
  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesOrders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('✅ [SalesOrder] 从localStorage加载销售订单，总数:', parsed.length);
          return parsed;
        } catch (e) {
          console.error('❌ [SalesOrder] 加载销售订单失败:', e);
        }
      }
    }
    console.log('📋 [SalesOrder] 初始化销售订单为空数组');
    return [];
  });

  // 自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('salesOrders', JSON.stringify(orders));
      console.log('💾 [SalesOrder] 销售订单已保存，总数:', orders.length);
    }
  }, [orders]);

  const addOrder = (order: SalesOrder) => {
    console.log('➕ [SalesOrder] 添加新销售订单:', order.soNumber);
    setOrders(prev => {
      const newOrders = [...prev, order];
      console.log('  ✅ 当前销售订单总数:', newOrders.length);
      return newOrders;
    });
  };

  const updateOrder = (id: string, updates: Partial<SalesOrder>) => {
    console.log('🔄 [SalesOrder] 更新销售订单:', id, updates);
    setOrders(prev =>
      prev.map(so => so.id === id ? { ...so, ...updates, updatedAt: new Date().toISOString() } : so)
    );
  };

  const deleteOrder = (id: string) => {
    console.log('🗑️ [SalesOrder] 删除销售订单:', id);
    setOrders(prev => prev.filter(so => so.id !== id));
  };

  const getOrderById = (id: string) => {
    return orders.find(so => so.id === id);
  };

  const getOrderByNumber = (soNumber: string) => {
    return orders.find(so => so.soNumber === soNumber);
  };

  const getOrdersByQT = (qtNumber: string) => {
    return orders.filter(so => so.qtNumber === qtNumber);
  };

  const getOrdersByCustomer = (customerEmail: string) => {
    return orders.filter(so => so.customerEmail === customerEmail);
  };

  const getOrdersBySalesPerson = (salesPersonEmail: string) => {
    return orders.filter(so => so.salesPerson === salesPersonEmail);
  };

  return (
    <SalesOrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        getOrderById,
        getOrderByNumber,
        getOrdersByQT,
        getOrdersByCustomer,
        getOrdersBySalesPerson
      }}
    >
      {children}
    </SalesOrderContext.Provider>
  );
};

export const useSalesOrders = () => {
  const context = useContext(SalesOrderContext);
  if (context === undefined) {
    throw new Error('useSalesOrders must be used within a SalesOrderProvider');
  }
  return context;
};
