import React, { useMemo, useState } from 'react';
import { Package, Beaker } from 'lucide-react';
import PreProductionSamples from './samples/PreProductionSamples';
import BulkSamples from './samples/BulkSamples';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { resolveSupplierPortalLanguage } from '../../utils/supplierPortalLanguage';

/**
 * 🔥 供应商视角：样品管理中心
 * - 产前样管理（Pre-production Samples）
 * - 大货样管理（Bulk Samples）
 */
export default function SampleManagement() {
  const { org } = useOrganization();
  const { user } = useUser();
  const portalLanguage = useMemo<'zh' | 'en'>(() => resolveSupplierPortalLanguage({
    org: {
      name: org?.name,
      nameEn: org?.nameEn,
      address: org?.address,
    },
    user: {
      name: user?.name,
      company: user?.company,
      address: user?.address,
      type: user?.type,
      role: user?.role,
      userRole: user?.userRole,
    },
  }), [org?.address, org?.name, org?.nameEn, user?.address, user?.company, user?.name, user?.role, user?.type, user?.userRole]);
  const [activeTab, setActiveTab] = useState('pre-production');

  const tabs = [
    { id: 'pre-production', label: '产前样', icon: Beaker, component: PreProductionSamples },
    { id: 'bulk', label: '大货样', icon: Package, component: BulkSamples },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PreProductionSamples;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>样品管理</h2>
        <p className="text-xs text-gray-500 mt-1">
          {portalLanguage === 'zh' ? '跟进产前样与大货样的制作、寄送和确认' : 'Sample Management'}
        </p>
      </div>
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
