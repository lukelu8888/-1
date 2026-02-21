import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, Clock } from 'lucide-react';
import AdminActiveOrders from './AdminActiveOrders';
import AdminOrderHistory from './AdminOrderHistory';

export default function OrderTracking() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  return (
    <div className="space-y-0">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="bg-white border border-gray-200 rounded-t-lg">
          <div className="px-4 py-3 border-b border-gray-100">
            <TabsList className="bg-transparent h-auto p-0 gap-6 w-full justify-start">
              <TabsTrigger 
                value="active" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 rounded-none px-0 pb-3 pt-0 font-medium"
                style={{ fontSize: '14px' }}
              >
                <Package className="w-4 h-4 mr-2" />
                在制订单
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:text-green-600 rounded-none px-0 pb-3 pt-0 font-medium"
                style={{ fontSize: '14px' }}
              >
                <Clock className="w-4 h-4 mr-2" />
                订单历史
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="active" className="m-0">
          <AdminActiveOrders />
        </TabsContent>

        <TabsContent value="history" className="m-0">
          <AdminOrderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}