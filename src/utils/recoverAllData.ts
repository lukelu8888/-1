// 🔥 完整数据恢复脚本
// 用于恢复所有测试数据：订单、询价单、报价单、应收账款、通知等

import { testOrders, initTestOrders } from './testOrderData';

// 🔧 恢复所有数据
export function recoverAllData(customerEmail: string = 'customer@example.com') {
  console.log('🔄 [Data Recovery] 开始恢复所有测试数据...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1️⃣ 恢复订单数据
  console.log('\n📦 [1/5] 恢复订单数据...');
  initTestOrders(customerEmail);
  
  // 2️⃣ 恢复询价单数据
  console.log('\n📋 [2/5] 恢复询价单数据...');
  const testRFQs = [
    {
      id: 'rfq-001',
      rfqNumber: 'RFQ-NA-251119-0001',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      date: '2025-11-19',
      products: [
        {
          name: 'Top Freezer Refrigerator 20 cu.ft',
          quantity: 100,
          specs: 'White, Energy Star Certified'
        }
      ],
      status: 'quoted',
      notes: 'Sample RFQ for testing'
    },
    {
      id: 'rfq-002',
      rfqNumber: 'RFQ-NA-251120-0001',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      date: '2025-11-20',
      products: [
        {
          name: 'Side-by-Side Refrigerator 25 cu.ft',
          quantity: 150,
          specs: 'Stainless Steel, Ice Maker'
        }
      ],
      status: 'quoted',
      notes: 'Sample RFQ for testing'
    }
  ];
  
  const existingRFQs = JSON.parse(localStorage.getItem(`rfqs_${customerEmail}`) || '[]');
  const mergedRFQs = [...existingRFQs];
  testRFQs.forEach(rfq => {
    const exists = mergedRFQs.find(r => r.rfqNumber === rfq.rfqNumber);
    if (!exists) {
      mergedRFQs.push(rfq);
    }
  });
  localStorage.setItem(`rfqs_${customerEmail}`, JSON.stringify(mergedRFQs));
  console.log(`  ✅ 已添加 ${testRFQs.length} 个询价单`);
  
  // 3️⃣ 恢复报价单数据
  console.log('\n💰 [3/5] 恢复报价单数据...');
  const testQuotations = [
    {
      id: 'quo-001',
      quotationNumber: 'QUO-NA-251120-0001',
      rfqNumber: 'RFQ-NA-251119-0001',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      date: '2025-11-20',
      validUntil: '2025-12-20',
      totalAmount: 10500,
      currency: 'USD',
      products: [
        {
          name: 'Top Freezer Refrigerator 20 cu.ft',
          quantity: 100,
          unitPrice: 105,
          totalPrice: 10500,
          specs: 'White, Energy Star Certified'
        }
      ],
      status: 'accepted',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      notes: 'Sample quotation for testing'
    },
    {
      id: 'quo-002',
      quotationNumber: 'QUO-NA-251119-0001',
      rfqNumber: 'RFQ-NA-251120-0001',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      date: '2025-11-19',
      validUntil: '2025-12-19',
      totalAmount: 15750,
      currency: 'USD',
      products: [
        {
          name: 'Side-by-Side Refrigerator 25 cu.ft',
          quantity: 150,
          unitPrice: 105,
          totalPrice: 15750,
          specs: 'Stainless Steel, Ice Maker'
        }
      ],
      status: 'accepted',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      deliveryTerms: 'FOB Fuzhou Port',
      notes: 'Sample quotation for testing'
    }
  ];
  
  const existingQuotations = JSON.parse(localStorage.getItem(`quotations_${customerEmail}`) || '[]');
  const mergedQuotations = [...existingQuotations];
  testQuotations.forEach(quo => {
    const exists = mergedQuotations.find(q => q.quotationNumber === quo.quotationNumber);
    if (!exists) {
      mergedQuotations.push(quo);
    }
  });
  localStorage.setItem(`quotations_${customerEmail}`, JSON.stringify(mergedQuotations));
  console.log(`  ✅ 已添加 ${testQuotations.length} 个报价单`);
  
  // 4️⃣ 恢复应收账款数据
  console.log('\n💵 [4/5] 恢复应收账款数据...');
  const testARs = [
    {
      arNumber: 'YS-NA-251121-0001',
      orderNumber: 'ORD-NA-251121-0002',
      quotationNumber: 'QUO-NA-251120-0001',
      contractNumber: 'ORD-NA-251121-0002',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      invoiceDate: '2025-11-21',
      dueDate: '2025-11-28',
      totalAmount: 10500,
      paidAmount: 0,
      remainingAmount: 10500,
      currency: 'USD',
      status: 'proof_uploaded', // 🔥 客户已上传凭证，等待财务确认
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      products: [
        {
          name: 'Smart Refrigerator 27 cu.ft',
          quantity: 100,
          unitPrice: 105,
          totalPrice: 10500
        }
      ],
      paymentHistory: [],
      depositProof: { // 🔥 客户上传的定金凭证
        uploadedAt: '2025-11-21T10:00:00Z',
        uploadedBy: customerEmail,
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXltZW50JTIwcmVjZWlwdHxlbnwxfHx8fDE3MzIxNjI3ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        fileName: 'deposit_proof_ORD-NA-251121-0002.jpg',
        amount: 3150, // 30%
        currency: 'USD',
        notes: 'Payment Reference: TT20251121001. Wire transfer completed on 2025-11-21.'
      },
      createdBy: 'system-auto',
      notes: 'Auto-generated from contract acceptance'
    },
    {
      arNumber: 'YS-NA-251120-0001',
      orderNumber: 'ORD-NA-251121-0003',
      quotationNumber: 'QUO-NA-251119-0001',
      contractNumber: 'ORD-NA-251121-0003',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      invoiceDate: '2025-11-20',
      dueDate: '2025-11-27',
      totalAmount: 15750,
      paidAmount: 0,
      remainingAmount: 15750,
      currency: 'USD',
      status: 'proof_uploaded', // 🔥 客户已上传凭证，等待财务确认
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      products: [
        {
          name: 'Side-by-Side Refrigerator 25 cu.ft',
          quantity: 150,
          unitPrice: 105,
          totalPrice: 15750
        }
      ],
      paymentHistory: [],
      depositProof: { // 🔥 客户上传的定金凭证
        uploadedAt: '2025-11-20T13:30:00Z',
        uploadedBy: customerEmail,
        fileUrl: 'https://images.unsplash.com/photo-1641578240035-22be445fad5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlJTIwdHJhbnNmZXIlMjBkb2N1bWVudHxlbnwxfHx8fDE3NjM3MDk5NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        fileName: 'deposit_proof_ORD-NA-251121-0003.jpg',
        amount: 4725, // 30%
        currency: 'USD',
        notes: 'Payment Reference: TT20251120002. Bank wire transfer completed on 2025-11-20.'
      },
      createdBy: 'system-auto',
      notes: 'Auto-generated from contract acceptance'
    },
    {
      arNumber: 'YS-NA-251119-0001',
      orderNumber: 'ORD-NA-251121-0004',
      quotationNumber: 'QUO-NA-251118-0001',
      contractNumber: 'ORD-NA-251121-0004',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      invoiceDate: '2025-11-19',
      dueDate: '2025-11-26',
      totalAmount: 21000,
      paidAmount: 0,
      remainingAmount: 21000,
      currency: 'USD',
      status: 'proof_uploaded', // 🔥 客户已上传凭证，等待财务确认
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      products: [
        {
          name: 'French Door Refrigerator 28 cu.ft',
          quantity: 200,
          unitPrice: 105,
          totalPrice: 21000
        }
      ],
      paymentHistory: [],
      depositProof: { // 🔥 客户上传的定金凭证
        uploadedAt: '2025-11-19T14:00:00Z',
        uploadedBy: customerEmail,
        fileUrl: 'https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5rJTIwcmVjZWlwdCUyMGRvY3VtZW50fGVufDF8fHx8MTc2MzcwODk5NXww&ixlib=rb-4.1.0&q=80&w=1080',
        fileName: 'payment_proof_ORD-NA-251121-0004.pdf',
        amount: 6300, // 30%
        currency: 'USD',
        notes: 'Payment Reference: TT20251119001. Bank transfer completed on 2025-11-19.'
      },
      createdBy: 'system-auto',
      notes: 'Auto-generated from contract acceptance'
    },
    {
      arNumber: 'YS-NA-251121-0002',
      orderNumber: 'ORD-NA-251121-0005',
      quotationNumber: 'QUO-NA-251121-0002',
      contractNumber: 'ORD-NA-251121-0005',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      invoiceDate: '2025-11-21',
      dueDate: '2025-11-28',
      totalAmount: 8328,
      paidAmount: 0,
      remainingAmount: 8328,
      currency: 'USD',
      status: 'pending',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      products: [
        {
          name: 'Mini Refrigerator 4.5 cu.ft',
          quantity: 120,
          unitPrice: 69.40,
          totalPrice: 8328
        }
      ],
      paymentHistory: [],
      createdBy: 'system-auto',
      notes: 'Auto-generated from contract acceptance. Awaiting deposit payment.'
    },
    {
      arNumber: 'YS-NA-251121-0003',
      orderNumber: 'ORD-NA-251121-0006',
      quotationNumber: 'QUO-NA-251121-0003',
      contractNumber: 'ORD-NA-251121-0006',
      customerName: 'Global Electronics Corp',
      customerEmail: customerEmail,
      region: 'NA',
      invoiceDate: '2025-11-21',
      dueDate: '2025-11-28',
      totalAmount: 18900,
      paidAmount: 0,
      remainingAmount: 18900,
      currency: 'USD',
      status: 'pending',
      paymentTerms: '30% T/T deposit, 70% balance before shipment',
      products: [
        {
          name: 'Wine Cooler 32 Bottle Dual Zone',
          quantity: 180,
          unitPrice: 105,
          totalPrice: 18900
        }
      ],
      paymentHistory: [],
      createdBy: 'system-auto',
      notes: 'Pending customer contract acceptance'
    }
  ];
  
  // 为Admin恢复应收账款数据
  const adminEmail = 'admin@cosun.com';
  const existingARs = JSON.parse(localStorage.getItem(`accountsReceivable_${adminEmail}`) || '[]');
  const mergedARs = [...existingARs];
  testARs.forEach(ar => {
    const exists = mergedARs.find(a => a.arNumber === ar.arNumber);
    if (!exists) {
      mergedARs.push(ar);
    }
  });
  localStorage.setItem(`accountsReceivable_${adminEmail}`, JSON.stringify(mergedARs));
  console.log(`  ✅ 已添加 ${testARs.length} 个应收账款，总数 ${mergedARs.length} 个`);
  console.log(`  📦 LocalStorage Key: accountsReceivable_${adminEmail}`);
  console.log(`  📊 应收账款数据:`, mergedARs.map(ar => `${ar.arNumber} (${ar.orderNumber})`).join(', '));
  
  // 5️⃣ 恢复通知数据
  console.log('\n🔔 [5/5] 恢复通知数据...');
  const testNotifications = [
    {
      id: `notif-${Date.now()}-1`,
      type: 'payment_received',
      title: '💰 Deposit Received - ORD-NA-251121-0002',
      message: 'Deposit payment of USD 3,150 has been confirmed for order ORD-NA-251121-0002.',
      relatedId: 'ORD-NA-251121-0002',
      relatedType: 'order',
      sender: 'finance@gaoshengda.com',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      read: false
    },
    {
      id: `notif-${Date.now()}-2`,
      type: 'payment_reminder',
      title: '💰 Deposit Payment Required - ORD-NA-251121-0005',
      message: 'Please arrange deposit payment of USD 2,498.40 (30%) within 7 business days.',
      relatedId: 'ORD-NA-251121-0005',
      relatedType: 'payment',
      sender: 'finance@gaoshengda.com',
      timestamp: Date.now() - 1 * 60 * 60 * 1000,
      read: false
    }
  ];
  
  const existingNotifications = JSON.parse(localStorage.getItem(`notifications_${customerEmail}`) || '[]');
  const mergedNotifications = [...existingNotifications, ...testNotifications];
  localStorage.setItem(`notifications_${customerEmail}`, JSON.stringify(mergedNotifications));
  console.log(`  ✅ 已添加 ${testNotifications.length} 个通知`);
  
  // 完成
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [Data Recovery] 数据恢复完成！');
  console.log('\n📊 恢复数据统计：');
  console.log(`  - 📦 订单：${testOrders.length} 个`);
  console.log(`  - 📋 询价单：${testRFQs.length} 个`);
  console.log(`  - 💰 报价单：${testQuotations.length} 个`);
  console.log(`  - 💵 应收账款：${testARs.length} 个`);
  console.log(`  - 🔔 通知：${testNotifications.length} 个`);
  console.log('\n🧪 测试流程：');
  console.log('  1. 登录Admin (admin@cosun.com) → Finance Management → Accounts Receivable');
  console.log('  2. 查看应收账款列表，找到有"Uploaded"徽章的订单');
  console.log('  3. 点击"Review"按钮查看客户上传的付款凭证');
  console.log('  4. 点击"Confirm Payment Received"确认收款');
  console.log('  5. 三方状态同步更新为"Deposit Received"✅');
  console.log('\n🔄 请刷新页面以查看所有数据！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    orders: testOrders.length,
    rfqs: testRFQs.length,
    quotations: testQuotations.length,
    accountsReceivable: testARs.length,
    notifications: testNotifications.length
  };
}

// 🗑️ 清除所有数据
export function clearAllData(customerEmail: string = 'customer@example.com') {
  console.log('🗑️ [Data Cleanup] 开始清除所有数据...');
  
  localStorage.removeItem(`orders_${customerEmail}`);
  localStorage.removeItem(`rfqs_${customerEmail}`);
  localStorage.removeItem(`quotations_${customerEmail}`);
  localStorage.removeItem(`notifications_${customerEmail}`);
  localStorage.removeItem(`accountsReceivable_admin@cosun.com`);
  
  console.log('✅ [Data Cleanup] 所有数据已清除');
  console.log('🔄 请刷新页面');
}

// 🔍 检查数据状态
export function checkDataStatus(customerEmail: string = 'customer@example.com') {
  console.log('🔍 [Data Status] 当前数据状态检查...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const adminEmail = 'admin@cosun.com';
  
  // 检查订单
  const orders = JSON.parse(localStorage.getItem(`orders_${customerEmail}`) || '[]');
  console.log(`\n📦 订单 (orders_${customerEmail}):`);
  console.log(`  - 数量: ${orders.length}`);
  if (orders.length > 0) {
    console.log(`  - 列表:`, orders.map((o: any) => `${o.orderNumber} (${o.status})`).join(', '));
  }
  
  // 检查询价单
  const rfqs = JSON.parse(localStorage.getItem(`rfqs_${customerEmail}`) || '[]');
  console.log(`\n📋 询价单 (rfqs_${customerEmail}):`);
  console.log(`  - 数量: ${rfqs.length}`);
  
  // 检查报价单
  const quotations = JSON.parse(localStorage.getItem(`quotations_${customerEmail}`) || '[]');
  console.log(`\n💰 报价单 (quotations_${customerEmail}):`);
  console.log(`  - 数量: ${quotations.length}`);
  
  // 🔥 检查应收账款（重点）
  const ars = JSON.parse(localStorage.getItem(`accountsReceivable_${adminEmail}`) || '[]');
  console.log(`\n💵 应收账款 (accountsReceivable_${adminEmail}):`);
  console.log(`  - 数量: ${ars.length}`);
  if (ars.length > 0) {
    console.log(`  - 列表:`, ars.map((ar: any) => `${ar.arNumber} (${ar.orderNumber}) - ${ar.status}`).join('\n    '));
    console.log(`  - 包含depositProof的数量: ${ars.filter((ar: any) => ar.depositProof).length}`);
  } else {
    console.warn('  ⚠️ 应收账款数据为空！');
    console.log('  📝 建议执行: recoverAllData() 然后刷新页面');
  }
  
  // 检查通知
  const notifications = JSON.parse(localStorage.getItem(`notifications_${customerEmail}`) || '[]');
  console.log(`\n🔔 通知 (notifications_${customerEmail}):`);
  console.log(`  - 数量: ${notifications.length}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [Data Status] 数据状态检查完成！\n');
  
  return {
    orders: orders.length,
    rfqs: rfqs.length,
    quotations: quotations.length,
    accountsReceivable: ars.length,
    notifications: notifications.length
  };
}

// 🌐 将函数暴露到全局window对象
if (typeof window !== 'undefined') {
  (window as any).recoverAllData = recoverAllData;
  (window as any).clearAllData = clearAllData;
  (window as any).checkDataStatus = checkDataStatus; // 🔥 新增
}