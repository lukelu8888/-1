import React, { useMemo, useState } from 'react';
import { Package, FileText, BookOpen, Layers } from 'lucide-react';
import ProductLibrary from './technical/ProductLibrary';
import DrawingManagement from './technical/DrawingManagement';
import CatalogManagement from './technical/CatalogManagement';
import CustomerSamples from './technical/CustomerSamples';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { resolveSupplierPortalLanguage } from '../../utils/supplierPortalLanguage';

/**
 * 🔥 供应商视角：技术中心
 * - 产品资料库
 * - 图纸管理
 * - 产品目录
 * - 来样管理
 */
export default function TechnicalCenter() {
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
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: '产品资料库', icon: Package, component: ProductLibrary },
    { id: 'drawings', label: '图纸管理', icon: FileText, component: DrawingManagement },
    { id: 'catalog', label: '产品目录', icon: BookOpen, component: CatalogManagement },
    { id: 'samples', label: '来样管理', icon: Layers, component: CustomerSamples },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProductLibrary;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>技术中心</h2>
        <p className="text-xs text-gray-500 mt-1">
          {portalLanguage === 'zh' ? '管理产品资料、图纸、目录与来样资料' : 'Technical Center'}
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
