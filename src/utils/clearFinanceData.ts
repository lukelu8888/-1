// 🗑️ 清空财务管理数据脚本
// 用于清空所有财务相关数据，从零开始测试数据流转

// 🗑️ 清空所有财务数据
export function clearFinanceData() {
  console.log('🗑️ [Clear Finance] 开始清空财务管理数据...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1️⃣ 清空应收账款数据
  console.log('\n💵 [1/1] 清空应收账款数据...');
  const adminEmail = 'admin@cosun.com';
  localStorage.removeItem(`accountsReceivable_${adminEmail}`);
  console.log('  ✅ 已清空应收账款数据');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [Clear Finance] 财务数据清空完成！');
  console.log('\n📊 已清空的数据：');
  console.log('  - 💵 应收账款：已清空');
  console.log('\n🔄 请刷新页面以查看清空结果！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 🗑️ 清空所有测试数据（包括客户端+Admin+财务）
export function clearAllTestData(customerEmail: string = 'customer@example.com') {
  console.log('🗑️ [Clear All] 开始清空所有测试数据...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1️⃣ 清空客户端数据
  console.log('\n👤 [1/4] 清空Customer数据...');
  localStorage.removeItem(`orders_${customerEmail}`);
  localStorage.removeItem(`rfqs_${customerEmail}`);
  localStorage.removeItem(`quotations_${customerEmail}`);
  localStorage.removeItem(`notifications_${customerEmail}`);
  console.log('  ✅ 已清空Customer数据（订单、询价、报价、通知）');
  
  // 2️⃣ 清空Admin数据
  console.log('\n🔧 [2/4] 清空Admin数据...');
  const adminEmail = 'admin@cosun.com';
  localStorage.removeItem(`orders_${adminEmail}`);
  localStorage.removeItem(`rfqs_${adminEmail}`);
  localStorage.removeItem(`quotations_${adminEmail}`);
  localStorage.removeItem(`notifications_${adminEmail}`);
  console.log('  ✅ 已清空Admin数据（订单、询价、报价、通知）');
  
  // 3️⃣ 清空财务数据
  console.log('\n💵 [3/4] 清空Finance数据...');
  localStorage.removeItem(`accountsReceivable_${adminEmail}`);
  console.log('  ✅ 已清空Finance数据（应收账款）');
  
  // 4️⃣ 清空其他共享数据
  console.log('\n🗃️ [4/4] 清空其他数据...');
  // 可以在这里添加其他需要清空的数据
  console.log('  ✅ 已清空其他数据');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [Clear All] 所有测试数据清空完成！');
  console.log('\n📊 已清空的数据：');
  console.log('  - 👤 Customer: 订单、询价、报价、通知');
  console.log('  - 🔧 Admin: 订单、询价、报价、通知');
  console.log('  - 💵 Finance: 应收账款');
  console.log('\n💡 现在可以开始测试完整的数据流转逻辑！');
  console.log('🔄 请刷新页面以查看清空结果！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 🔍 查看当前数据状态
export function checkDataStatus(customerEmail: string = 'customer@example.com') {
  console.log('🔍 [Data Status] 检查当前数据状态...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const adminEmail = 'admin@cosun.com';
  
  // Customer数据
  const customerOrders = JSON.parse(localStorage.getItem(`orders_${customerEmail}`) || '[]');
  const customerRFQs = JSON.parse(localStorage.getItem(`rfqs_${customerEmail}`) || '[]');
  const customerQuotations = JSON.parse(localStorage.getItem(`quotations_${customerEmail}`) || '[]');
  const customerNotifications = JSON.parse(localStorage.getItem(`notifications_${customerEmail}`) || '[]');
  
  // Admin数据
  const adminOrders = JSON.parse(localStorage.getItem(`orders_${adminEmail}`) || '[]');
  const adminRFQs = JSON.parse(localStorage.getItem(`rfqs_${adminEmail}`) || '[]');
  const adminQuotations = JSON.parse(localStorage.getItem(`quotations_${adminEmail}`) || '[]');
  const adminNotifications = JSON.parse(localStorage.getItem(`notifications_${adminEmail}`) || '[]');
  
  // Finance数据
  const accountsReceivable = JSON.parse(localStorage.getItem(`accountsReceivable_${adminEmail}`) || '[]');
  
  console.log('\n👤 Customer Portal Data:');
  console.log(`  - Orders: ${customerOrders.length} 条`);
  console.log(`  - Inquiries (INQ): ${customerRFQs.length} 条`);
  console.log(`  - Quotations: ${customerQuotations.length} 条`);
  console.log(`  - Notifications: ${customerNotifications.length} 条`);
  
  console.log('\n🔧 Admin Portal Data:');
  console.log(`  - Orders: ${adminOrders.length} 条`);
  console.log(`  - Inquiries (INQ): ${adminRFQs.length} 条`);
  console.log(`  - Quotations: ${adminQuotations.length} 条`);
  console.log(`  - Notifications: ${adminNotifications.length} 条`);
  
  console.log('\n💵 Finance Management Data:');
  console.log(`  - Accounts Receivable: ${accountsReceivable.length} 条`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [Data Status] 数据状态检查完成！\n');
  
  return {
    customer: {
      orders: customerOrders.length,
      rfqs: customerRFQs.length,
      quotations: customerQuotations.length,
      notifications: customerNotifications.length
    },
    admin: {
      orders: adminOrders.length,
      rfqs: adminRFQs.length,
      quotations: adminQuotations.length,
      notifications: adminNotifications.length
    },
    finance: {
      accountsReceivable: accountsReceivable.length
    }
  };
}

// 🌐 将函数暴露到全局window对象
if (typeof window !== 'undefined') {
  (window as any).clearFinanceData = clearFinanceData;
  (window as any).clearAllTestData = clearAllTestData;
  (window as any).checkDataStatus = checkDataStatus;
}
