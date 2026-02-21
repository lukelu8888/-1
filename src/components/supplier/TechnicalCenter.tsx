import React, { useState } from 'react';
import { Package, FileText, BookOpen, Layers } from 'lucide-react';
import ProductLibrary from './technical/ProductLibrary';
import DrawingManagement from './technical/DrawingManagement';
import CatalogManagement from './technical/CatalogManagement';
import CustomerSamples from './technical/CustomerSamples';

/**
 * 🔥 供应商视角：技术中心
 * - 产品资料库
 * - 图纸管理
 * - 产品目录
 * - 来样管理
 */
export default function TechnicalCenter() {
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
