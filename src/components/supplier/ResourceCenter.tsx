import React, { useState } from 'react';
import { Building2, Boxes, Truck } from 'lucide-react';
import CustomerManagement from './resources/CustomerManagement';
import SubSupplierManagement from './resources/SubSupplierManagement';
import LogisticsManagement from './resources/LogisticsManagement';

/**
 * 🔥 供应商视角：资源中心
 * - 客户管理
 * - 下游供应商管理
 * - 物流公司管理
 */
export default function ResourceCenter() {
  const [activeTab, setActiveTab] = useState('customers');

  const tabs = [
    { id: 'customers', label: '客户管理', icon: Building2, component: CustomerManagement },
    { id: 'suppliers', label: '供应商管理', icon: Boxes, component: SubSupplierManagement },
    { id: 'logistics', label: '物流公司', icon: Truck, component: LogisticsManagement },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || CustomerManagement;

  return (
    <div className="space-y-4">
      {/* Tab导航 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{ fontSize: '14px', fontWeight: 500 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab内容 */}
      <ActiveComponent />
    </div>
  );
}
