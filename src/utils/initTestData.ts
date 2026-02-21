/**
 * 🔧 测试数据初始化工具
 * 
 * 用途：在首次加载时为系统生成测试数据，持久化到localStorage
 * 避免每次刷新都需要重新生成
 */

import { setUserData, getUserData } from './dataIsolation';
import type { Order } from '../contexts/OrderContext';

// 🔥 初始化测试订单数据
export function initTestOrders() {
  console.log('🔧 [initTestData] 开始初始化测试订单数据...');
  
  // 检查是否已有测试数据
  const existingOrders = getUserData<Order>('orders', 'john@techsolutions.com');
  
  if (existingOrders.length > 0) {
    console.log('  ✅ 已存在测试数据，跳过初始化');
    console.log('  - 订单数量:', existingOrders.length);
    return;
  }
  
  console.log('  📝 开始生成测试订单...');
  
  // 客户1：john@techsolutions.com - 北美客户
  const customer1Orders: Order[] = [
    {
      id: 'ORD-20251214-001',
      orderNumber: 'ORD-20251214-001',
      customer: 'Tech Solutions Inc.',
      customerEmail: 'john@techsolutions.com',
      quotationId: 'QT-NA-20251210-001',
      quotationNumber: 'QT-NA-20251210-001',
      date: '2025-12-14',
      expectedDelivery: '2026-01-25',
      totalAmount: 45680,
      currency: 'USD',
      status: 'In Production',
      progress: 35,
      products: [
        {
          name: 'Industrial Circuit Breaker MCB-DZ47-63',
          quantity: 500,
          unitPrice: 12.5,
          totalPrice: 6250,
          specs: '63A, 3P, 6kA breaking capacity',
          produced: 175
        },
        {
          name: 'LED Downlight CL-DL-15W',
          quantity: 1000,
          unitPrice: 8.2,
          totalPrice: 8200,
          specs: '15W, 6000K, IP44',
          produced: 350
        },
        {
          name: 'Shower Mixer Valve SM-8801',
          quantity: 300,
          unitPrice: 45.8,
          totalPrice: 13740,
          specs: 'Brass body, ceramic cartridge',
          produced: 105
        },
        {
          name: 'Door Handle Set DH-2024',
          quantity: 800,
          unitPrice: 15.6,
          totalPrice: 12480,
          specs: 'Stainless steel 304, satin finish',
          produced: 280
        },
        {
          name: 'Safety Gloves SG-PU-100',
          quantity: 2000,
          unitPrice: 2.51,
          totalPrice: 5020,
          specs: 'PU coated, size L',
          produced: 700
        }
      ],
      paymentStatus: 'Partial Payment',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'FOB Fuzhou',
      trackingNumber: '',
      createdFrom: 'quotation',
      createdAt: '2025-12-14T08:30:00Z',
      updatedAt: '2025-12-14T10:15:00Z',
      confirmed: true,
      confirmedAt: '2025-12-14T09:00:00Z',
      confirmedBy: 'admin@gaoshengda.com',
      depositPaymentProof: {
        uploadedAt: '2025-12-14T14:30:00Z',
        uploadedBy: 'john@techsolutions.com',
        amount: 13704,
        currency: 'USD',
        notes: 'Wire transfer from Bank of America'
      }
    },
    {
      id: 'ORD-20251210-002',
      orderNumber: 'ORD-20251210-002',
      customer: 'Tech Solutions Inc.',
      customerEmail: 'john@techsolutions.com',
      quotationId: 'QT-NA-20251205-002',
      quotationNumber: 'QT-NA-20251205-002',
      date: '2025-12-10',
      expectedDelivery: '2026-01-15',
      totalAmount: 32500,
      currency: 'USD',
      status: 'Ready to Ship',
      progress: 100,
      products: [
        {
          name: 'Toilet Flush Valve TFV-2025',
          quantity: 600,
          unitPrice: 28.5,
          totalPrice: 17100,
          specs: 'Dual flush, chrome finish',
          produced: 600
        },
        {
          name: 'Window Hinge WH-304',
          quantity: 1000,
          unitPrice: 15.4,
          totalPrice: 15400,
          specs: 'Stainless steel 304, concealed type',
          produced: 1000
        }
      ],
      paymentStatus: 'Paid',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'FOB Fuzhou',
      trackingNumber: '',
      createdFrom: 'quotation',
      createdAt: '2025-12-10T10:00:00Z',
      updatedAt: '2025-12-14T09:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-10T11:00:00Z',
      confirmedBy: 'admin@gaoshengda.com',
      depositPaymentProof: {
        uploadedAt: '2025-12-10T15:00:00Z',
        uploadedBy: 'john@techsolutions.com',
        amount: 9750,
        currency: 'USD',
        notes: 'Deposit payment'
      },
      balancePaymentProof: {
        uploadedAt: '2025-12-13T16:00:00Z',
        uploadedBy: 'john@techsolutions.com',
        amount: 22750,
        currency: 'USD',
        notes: 'Balance payment before shipment'
      }
    }
  ];
  
  // 客户2：maria@constructora.com - 南美客户
  const customer2Orders: Order[] = [
    {
      id: 'ORD-20251213-003',
      orderNumber: 'ORD-20251213-003',
      customer: 'Constructora del Sur',
      customerEmail: 'maria@constructora.com',
      quotationId: 'QT-SA-20251208-001',
      quotationNumber: 'QT-SA-20251208-001',
      date: '2025-12-13',
      expectedDelivery: '2026-01-28',
      totalAmount: 58900,
      currency: 'USD',
      status: 'Awaiting Deposit',
      progress: 0,
      products: [
        {
          name: 'Ceramic Basin CB-8060',
          quantity: 400,
          unitPrice: 68.5,
          totalPrice: 27400,
          specs: '800x600mm, white glaze',
          produced: 0
        },
        {
          name: 'Faucet Set FS-Chrome-Pro',
          quantity: 500,
          unitPrice: 42.0,
          totalPrice: 21000,
          specs: 'Chrome finish, ceramic valve',
          produced: 0
        },
        {
          name: 'Safety Helmet SH-ABS-Standard',
          quantity: 1000,
          unitPrice: 10.5,
          totalPrice: 10500,
          specs: 'ABS material, adjustable strap',
          produced: 0
        }
      ],
      paymentStatus: 'Pending Payment',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'CIF Buenos Aires',
      trackingNumber: '',
      createdFrom: 'quotation',
      createdAt: '2025-12-13T11:00:00Z',
      updatedAt: '2025-12-13T11:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-13T12:00:00Z',
      confirmedBy: 'admin@gaoshengda.com'
    }
  ];
  
  // 客户3：pierre@europarts.com - 欧洲客户
  const customer3Orders: Order[] = [
    {
      id: 'ORD-20251212-004',
      orderNumber: 'ORD-20251212-004',
      customer: 'EuroParts GmbH',
      customerEmail: 'pierre@europarts.com',
      quotationId: 'QT-EU-20251207-001',
      quotationNumber: 'QT-EU-20251207-001',
      date: '2025-12-12',
      expectedDelivery: '2026-01-22',
      totalAmount: 72300,
      currency: 'EUR',
      status: 'Quality Inspection',
      progress: 85,
      products: [
        {
          name: 'Door Lock Set DL-Smart-2025',
          quantity: 300,
          unitPrice: 125.0,
          totalPrice: 37500,
          specs: 'Smart lock, fingerprint + password',
          produced: 255
        },
        {
          name: 'Window Actuator WA-Electric-300',
          quantity: 200,
          unitPrice: 98.0,
          totalPrice: 19600,
          specs: 'Electric actuator, 300mm stroke',
          produced: 170
        },
        {
          name: 'LED Panel Light LP-60x60-40W',
          quantity: 500,
          unitPrice: 30.4,
          totalPrice: 15200,
          specs: '600x600mm, 40W, 4000K',
          produced: 425
        }
      ],
      paymentStatus: 'Partial Payment',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'FOB Fuzhou',
      trackingNumber: '',
      createdFrom: 'quotation',
      createdAt: '2025-12-12T09:00:00Z',
      updatedAt: '2025-12-14T08:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-12T10:00:00Z',
      confirmedBy: 'admin@gaoshengda.com',
      depositPaymentProof: {
        uploadedAt: '2025-12-12T16:00:00Z',
        uploadedBy: 'pierre@europarts.com',
        amount: 21690,
        currency: 'EUR',
        notes: 'SEPA transfer'
      }
    }
  ];
  
  // 保存到各个客户的专属存储
  setUserData('orders', customer1Orders, 'john@techsolutions.com');
  setUserData('orders', customer2Orders, 'maria@constructora.com');
  setUserData('orders', customer3Orders, 'pierre@europarts.com');
  
  console.log('  ✅ 测试订单数据已生成并保存');
  console.log('  - 客户1 (john@techsolutions.com):', customer1Orders.length, '条订单');
  console.log('  - 客户2 (maria@constructora.com):', customer2Orders.length, '条订单');
  console.log('  - 客户3 (pierre@europarts.com):', customer3Orders.length, '条订单');
}

// 🔥 在应用启动时调用
export function initAllTestData() {
  console.log('🚀 [initTestData] 初始化所有测试数据...');
  
  // 初始化订单数据
  initTestOrders();
  
  console.log('✅ [initTestData] 所有测试数据初始化完成');
}

// 🔥 重置测试数据（开发者工具）
// 在浏览器console中调用：window.resetTestData()
export function resetTestData() {
  console.log('🔄 [resetTestData] 重置测试数据...');
  
  // 清除初始化标记
  localStorage.removeItem('test_data_initialized');
  
  // 清空所有测试客户的订单数据
  localStorage.removeItem('orders_john@techsolutions.com');
  localStorage.removeItem('orders_maria@constructora.com');
  localStorage.removeItem('orders_pierre@europarts.com');
  
  console.log('✅ 测试数据已清除');
  console.log('💡 刷新页面将重新生成测试数据');
}

// 🔥 挂载到window对象供开发者使用
if (typeof window !== 'undefined') {
  (window as any).resetTestData = resetTestData;
  (window as any).initAllTestData = initAllTestData;
  
  console.log('💡 开发者工具已加载：');
  console.log('  - window.resetTestData() - 清除并重置测试数据');
  console.log('  - window.initAllTestData() - 手动初始化测试数据');
}