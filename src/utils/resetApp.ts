// 临时工具：重置应用状态
export function resetAppState() {
  if (typeof window !== 'undefined') {
    // 清除所有localStorage数据
    const keysToRemove = [
      'cosun_inquiries',
      'admin_inquiries',
      'cosun_quotations',
      'cosun_orders'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ 已清除: ${key}`);
    });
    
    console.log('🔄 应用状态已重置');
  }
}

// 在浏览器控制台中运行此函数来重置应用
if (typeof window !== 'undefined') {
  (window as any).resetAppState = resetAppState;
}
