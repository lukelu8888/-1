// 测试页面：验证 OrderDocumentationDetail 组件
import React from 'react';
import { OrderDocumentationDetail } from './OrderDocumentationDetail';

export function OrderDocumentationDetailTest() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">订单单证详情测试页</h1>
      <OrderDocumentationDetail 
        orderId="SO-NA-20251210-001"
        onBack={() => console.log('返回按钮被点击')}
      />
    </div>
  );
}
