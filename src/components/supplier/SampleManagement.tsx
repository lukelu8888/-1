import React, { useState } from 'react';
import { Package, Beaker } from 'lucide-react';
import PreProductionSamples from './samples/PreProductionSamples';
import BulkSamples from './samples/BulkSamples';

/**
 * 🔥 供应商视角：样品管理中心
 * - 产前样管理（Pre-production Samples）
 * - 大货样管理（Bulk Samples）
 */
export default function SampleManagement() {
  const [activeTab, setActiveTab] = useState('pre-production');

  const tabs = [
    { id: 'pre-production', label: '产前样', icon: Beaker, component: PreProductionSamples },
    { id: 'bulk', label: '大货样', icon: Package, component: BulkSamples },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PreProductionSamples;

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
