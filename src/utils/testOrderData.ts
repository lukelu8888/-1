// 🔥 测试订单数据 - 用于演示完整的定金支付流程
// 使用方法：在浏览器Console中运行 initTestOrders() 即可创建测试订单

import { Order } from '../contexts/OrderContext';

export const testOrders: Order[] = [
  // ✅ 订单1：Deposit Received状态 - 已收到定金
  {
    id: 'test-order-001',
    orderNumber: 'ORD-NA-251121-0002',
    customer: 'Global Electronics Corp',
    customerEmail: 'customer@example.com', // 🔥 替换为你的测试客户邮箱
    quotationId: 'quo-001',
    quotationNumber: 'QT-NA-251120-0001',
    date: '2025-11-21',
    expectedDelivery: '2025-12-30',
    totalAmount: 10500,
    currency: 'USD',
    status: 'Deposit Received', // 🔥 更新状态为已收到定金
    progress: 15,
    products: [
      {
        name: 'Top Freezer Refrigerator 20 cu.ft',
        quantity: 100,
        unitPrice: 105,
        totalPrice: 10500,
        specs: 'White, Energy Star Certified',
        produced: 0
      }
    ],
    paymentStatus: 'Deposit Paid',
    paymentTerms: '30% T/T deposit, 70% balance before shipment',
    shippingMethod: 'Sea Freight',
    deliveryTerms: 'FOB Fuzhou',
    notes: 'Deposit payment received on 2025-11-21.',
    createdFrom: 'qt',
    createdAt: '2025-11-21T08:00:00Z',
    updatedAt: '2025-11-21T12:00:00Z',
    confirmed: true, // Admin已确认
    confirmedAt: '2025-11-21T08:30:00Z',
    depositPaymentProof: { // 🔥 添加定金付款凭证
      uploadedAt: '2025-11-21T11:30:00Z',
      uploadedBy: 'customer@example.com',
      fileUrl: 'https://images.unsplash.com/photo-1726137570712-58609cab9eba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXltZW50JTIwcmVjZWlwdCUyMGludm9pY2V8ZW58MXx8fHwxNzYzNzA5OTU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      fileName: 'deposit_proof_ORD-NA-251121-0002.jpg',
      amount: 3150, // 30% of 10500
      currency: 'USD',
      notes: 'Payment Reference: TT20251121001. Wire transfer completed on 2025-11-21.'
    },
    contractTerms: {
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      shippingMethod: 'Sea Freight - 20ft Container',
      expectedDelivery: '2025-12-30',
      qualityStandards: 'ISO 9001:2015, Energy Star',
      warrantyTerms: '2 years limited warranty on compressor, 1 year on parts',
      remarks: 'Deposit received. Production scheduled.'
    }
  },

  // ✅ 订单2：Deposit Received状态 - 已收到定金
  {
    id: 'test-order-002',
    orderNumber: 'ORD-NA-251121-0003',
    customer: 'Global Electronics Corp',
    customerEmail: 'customer@example.com', // 🔥 替换为你的测试客户邮箱
    quotationId: 'quo-002',
    quotationNumber: 'QT-NA-251119-0001',
    date: '2025-11-20',
    expectedDelivery: '2025-12-25',
    totalAmount: 15750,
    currency: 'USD',
    status: 'Deposit Received', // 🔥 更新状态为已收到定金
    progress: 15,
    products: [
      {
        name: 'Side-by-Side Refrigerator 25 cu.ft',
        quantity: 150,
        unitPrice: 105,
        totalPrice: 15750,
        specs: 'Stainless Steel, Ice Maker',
        produced: 0
      }
    ],
    paymentStatus: 'Deposit Paid',
    paymentTerms: '30% T/T deposit, 70% balance before shipment',
    shippingMethod: 'Sea Freight',
    deliveryTerms: 'FOB Fuzhou',
    notes: 'Deposit payment received on 2025-11-20.',
    createdFrom: 'qt',
    createdAt: '2025-11-20T08:00:00Z',
    updatedAt: '2025-11-20T14:00:00Z',
    confirmed: true,
    confirmedAt: '2025-11-20T09:00:00Z',
    confirmedBy: 'customer@example.com',
    confirmedDate: '2025-11-20',
    customerFeedback: {
      status: 'accepted',
      message: 'Customer accepted the contract',
      submittedAt: Date.now() - 24 * 60 * 60 * 1000, // 1天前
      submittedBy: 'customer@example.com'
    },
    depositPaymentProof: { // 🔥 添加定金付款凭证
      uploadedAt: '2025-11-20T13:30:00Z',
      uploadedBy: 'customer@example.com',
      fileUrl: 'https://images.unsplash.com/photo-1641578240035-22be445fad5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlJTIwdHJhbnNmZXIlMjBkb2N1bWVudHxlbnwxfHx8fDE3NjM3MDk5NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      fileName: 'deposit_proof_ORD-NA-251121-0003.jpg',
      amount: 4725, // 30% of 15750
      currency: 'USD',
      notes: 'Payment Reference: TT20251120002. Bank wire transfer completed on 2025-11-20.'
    },
    contractTerms: {
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      shippingMethod: 'Sea Freight - 40ft Container',
      expectedDelivery: '2025-12-25',
      qualityStandards: 'ISO 9001:2015, Energy Star',
      warrantyTerms: '2 years limited warranty on compressor, 1 year on parts',
      remarks: 'Deposit received. Production in progress.'
    }
  },

  // ✅ 订单3：Preparing Production状态 - 已完成付款水单上传
  {
    id: 'test-order-003',
    orderNumber: 'ORD-NA-251121-0004',
    customer: 'Global Electronics Corp',
    customerEmail: 'customer@example.com', // 🔥 替换为你的测试客户邮箱
    quotationId: 'quo-003',
    quotationNumber: 'QT-NA-251118-0001',
    date: '2025-11-19',
    expectedDelivery: '2025-12-20',
    totalAmount: 21000,
    currency: 'USD',
    status: 'Preparing Production', // 🔥 关键状态
    progress: 20,
    products: [
      {
        name: 'French Door Refrigerator 28 cu.ft',
        quantity: 200,
        unitPrice: 105,
        totalPrice: 21000,
        specs: 'Black Stainless, Smart Features',
        produced: 0
      }
    ],
    paymentStatus: 'Deposit Paid',
    paymentTerms: '30% T/T deposit, 70% balance before shipment',
    shippingMethod: 'Sea Freight',
    deliveryTerms: 'FOB Fuzhou',
    notes: 'Deposit payment proof uploaded on 2025-11-19. Preparing for production.',
    createdFrom: 'qt',
    createdAt: '2025-11-19T08:00:00Z',
    updatedAt: '2025-11-19T14:00:00Z',
    confirmed: true,
    confirmedAt: '2025-11-19T09:00:00Z',
    confirmedBy: 'customer@example.com',
    confirmedDate: '2025-11-19',
    customerFeedback: {
      status: 'accepted',
      message: 'Customer accepted the contract',
      submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
      submittedBy: 'customer@example.com'
    },
    depositPaymentProof: {
      uploadedAt: '2025-11-19T14:00:00Z',
      uploadedBy: 'customer@example.com',
      fileUrl: 'https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5rJTIwcmVjZWlwdCUyMGRvY3VtZW50fGVufDF8fHx8MTc2MzcwODk5NXww&ixlib=rb-4.1.0&q=80&w=1080', // 🔥 添加fileUrl
      fileName: 'payment_proof_ORD-NA-251121-0004.pdf',
      amount: 6300, // 30% of 21000
      currency: 'USD',
      notes: 'Payment Reference: TT20251119001. Bank transfer completed on 2025-11-19.'
    },
    contractTerms: {
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      shippingMethod: 'Sea Freight - 40ft Container',
      expectedDelivery: '2025-12-20',
      qualityStandards: 'ISO 9001:2015, Energy Star',
      warrantyTerms: '2 years limited warranty on compressor, 1 year on parts',
      remarks: 'Deposit received. Production will start within 3 business days.'
    }
  },

  // ✅ 订单4：Awaiting Deposit状态 - 可以测试Upload Payment Proof流程
  {
    id: 'test-order-004',
    orderNumber: 'ORD-NA-251121-0005',
    customer: 'Global Electronics Corp',
    customerEmail: 'customer@example.com',
    quotationId: 'quo-004',
    quotationNumber: 'QT-NA-251121-0002',
    date: '2025-11-21',
    expectedDelivery: '2026-01-15',
    totalAmount: 8328,
    currency: 'USD',
    status: 'Awaiting Deposit', // 🔥 等待定金状态
    progress: 0,
    products: [
      {
        name: 'Mini Refrigerator 4.5 cu.ft',
        quantity: 120,
        unitPrice: 69.40,
        totalPrice: 8328,
        specs: 'Compact, Energy Efficient, Black',
        produced: 0
      }
    ],
    paymentStatus: 'Awaiting Deposit',
    paymentTerms: '30% T/T deposit, 70% balance before shipment',
    shippingMethod: 'Sea Freight',
    deliveryTerms: 'FOB Fuzhou',
    notes: 'Awaiting deposit payment from customer.',
    createdFrom: 'qt',
    createdAt: '2025-11-21T10:00:00Z',
    updatedAt: '2025-11-21T10:00:00Z',
    confirmed: true,
    confirmedAt: '2025-11-21T10:00:00Z',
    confirmedBy: 'customer@example.com',
    confirmedDate: '2025-11-21',
    customerFeedback: {
      status: 'accepted',
      message: 'Customer accepted the contract',
      submittedAt: Date.now() - 60 * 60 * 1000, // 1小时前
      submittedBy: 'customer@example.com'
    },
    contractTerms: {
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      shippingMethod: 'Sea Freight - 20ft Container',
      expectedDelivery: '2026-01-15',
      qualityStandards: 'ISO 9001:2015, Energy Star',
      warrantyTerms: '1 year limited warranty',
      remarks: 'Awaiting deposit payment. Please arrange payment within 7 business days.'
    }
  },

  // ✅ 订单5：Pending状态 - 可以测试Accept Contract流程
  {
    id: 'test-order-005',
    orderNumber: 'ORD-NA-251121-0006',
    customer: 'Global Electronics Corp',
    customerEmail: 'customer@example.com',
    quotationId: 'quo-005',
    quotationNumber: 'QT-NA-251121-0003',
    date: '2025-11-21',
    expectedDelivery: '2026-01-20',
    totalAmount: 18900,
    currency: 'USD',
    status: 'Pending', // 🔥 待客户确认状态
    progress: 0,
    products: [
      {
        name: 'Wine Cooler 32 Bottle Dual Zone',
        quantity: 180,
        unitPrice: 105,
        totalPrice: 18900,
        specs: 'Stainless Steel, Digital Display, UV Protection',
        produced: 0
      }
    ],
    paymentStatus: 'Pending',
    paymentTerms: '30% T/T deposit, 70% balance before shipment',
    shippingMethod: 'Sea Freight',
    deliveryTerms: 'FOB Fuzhou',
    notes: 'Sales contract sent to customer. Awaiting customer confirmation.',
    createdFrom: 'qt',
    createdAt: '2025-11-21T11:00:00Z',
    updatedAt: '2025-11-21T11:00:00Z',
    confirmed: false,
    contractTerms: {
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      shippingMethod: 'Sea Freight - 40ft Container',
      expectedDelivery: '2026-01-20',
      qualityStandards: 'ISO 9001:2015, CE Certified',
      warrantyTerms: '2 years limited warranty on cooling system',
      remarks: 'Please review and confirm the contract to proceed with production.'
    }
  }
];

// 🔧 初始化测试订单到localStorage
export function initTestOrders(customerEmail: string = 'customer@example.com') {
  console.log('🔧 [Test Orders] 初始化测试订单...');
  
  // 更新所有测试订单的customerEmail
  const updatedTestOrders = testOrders.map(order => ({
    ...order,
    customerEmail: customerEmail
  }));
  
  // 获取当前用户的订单数据
  const existingOrders = JSON.parse(localStorage.getItem(`orders_${customerEmail}`) || '[]');
  
  // 合并测试订单（避免重复）
  const mergedOrders = [...existingOrders];
  updatedTestOrders.forEach(testOrder => {
    const exists = mergedOrders.find(o => o.orderNumber === testOrder.orderNumber);
    if (!exists) {
      mergedOrders.push(testOrder);
    }
  });
  
  // 保存到localStorage
  localStorage.setItem(`orders_${customerEmail}`, JSON.stringify(mergedOrders));
  
  console.log(`✅ [Test Orders] 已添加 ${updatedTestOrders.length} 个测试订单`);
  console.log('  - ORD-NA-251121-0002: Deposit Received (可测试Accept Contract)');
  console.log('  - ORD-NA-251121-0003: Deposit Received (可测试Upload Proof)');
  console.log('  - ORD-NA-251121-0004: Preparing Production (已完成付款)');
  console.log('  - ORD-NA-251121-0005: Awaiting Deposit (可测试Upload Proof)');
  console.log('  - ORD-NA-251121-0006: Pending (可测试Accept Contract)');
  console.log('🔄 请刷新页面以查看测试订单');
  
  return mergedOrders;
}

// 🗑️ 清除测试订单
export function clearTestOrders(customerEmail: string = 'customer@example.com') {
  console.log('🗑️ [Test Orders] 清除测试订单...');
  
  const existingOrders = JSON.parse(localStorage.getItem(`orders_${customerEmail}`) || '[]');
  const testOrderNumbers = testOrders.map(o => o.orderNumber);
  
  const filteredOrders = existingOrders.filter((order: Order) => 
    !testOrderNumbers.includes(order.orderNumber)
  );
  
  localStorage.setItem(`orders_${customerEmail}`, JSON.stringify(filteredOrders));
  
  console.log(`✅ [Test Orders] 已清除 ${existingOrders.length - filteredOrders.length} 个测试订单`);
  console.log('🔄 请刷新页面');
  
  return filteredOrders;
}

// 🌐 将函数暴露到全局window对象，方便在浏览器Console中调用
if (typeof window !== 'undefined') {
  (window as any).initTestOrders = initTestOrders;
  (window as any).clearTestOrders = clearTestOrders;
}
