/**
 * 🗑️ 清空收款管理数据工具
 * 
 * 用途：清除PaymentContext中的所有收款记录（SK系列）
 * 
 * 使用方法：
 * 1. 打开浏览器控制台（F12）
 * 2. 输入：clearPaymentData()
 * 3. 刷新页面：location.reload()
 */

export function clearPaymentData() {
  const financeEmail = 'admin@cosun.com';
  const storageKey = `${financeEmail}_paymentRecords`;
  
  // 清除收款记录数据
  localStorage.removeItem(storageKey);
  
  console.log('✅ 收款管理数据已清空');
  console.log('📊 已删除的数据：');
  console.log('  - 收款记录（paymentRecords）');
  console.log('');
  console.log('💡 请刷新页面以查看效果：location.reload()');
}

// 🌍 挂载到全局对象，方便控制台调用
if (typeof window !== 'undefined') {
  (window as any).clearPaymentData = clearPaymentData;
  console.log('🔧 [清空收款数据工具已加载]');
  console.log('💡 使用方法：clearPaymentData()');
}
