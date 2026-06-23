import { useState } from 'react';
import {
  BadgePercent,
  Box,
  Database,
  Layers,
  LayoutGrid,
  Globe,
} from 'lucide-react';
import ModelMappingCenter from './ModelMappingCenter';
import InternalProductCatalog from './InternalProductCatalog';
import WebsiteCatalogPublisher from './WebsiteCatalogPublisher';
import HomeDepotPimWorkbench from './HomeDepotPimWorkbench';
import PromotionsManager from './PromotionsManager';
import CategoryAttributeManager from './CategoryAttributeManager';

// ─── 区域定义 ─────────────────────────────────────────────────────────────────

type RegionCode = 'NA' | 'SA' | 'EA';

interface Region {
  code: RegionCode;
  name: string;
  nameEn: string;
  flag: string;
  color: string;          // Tailwind color token (without bg-/text-)
  borderColor: string;    // active border class
  bgClass: string;        // active background class
  textClass: string;      // active text class
  badgeClass: string;     // pill badge
}

const REGIONS: Region[] = [
  {
    code: 'NA',
    name: '北美',
    nameEn: 'North America',
    flag: '🇺🇸',
    color: 'blue',
    borderColor: 'border-blue-500',
    bgClass: 'bg-blue-600 hover:bg-blue-700',
    textClass: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    code: 'SA',
    name: '南美',
    nameEn: 'South America',
    flag: '🇧🇷',
    color: 'green',
    borderColor: 'border-green-500',
    bgClass: 'bg-green-600 hover:bg-green-700',
    textClass: 'text-green-700',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    code: 'EA',
    name: '欧非',
    nameEn: 'Europe & Africa',
    flag: '🇪🇺',
    color: 'purple',
    borderColor: 'border-purple-500',
    bgClass: 'bg-purple-600 hover:bg-purple-700',
    textClass: 'text-purple-700',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
];

// ─── 标签页定义 ───────────────────────────────────────────────────────────────

type TabId = 'publisher' | 'promotions' | 'categories' | 'catalog' | 'pim' | 'mapping';

interface Tab {
  id: TabId;
  label: string;
  subLabel: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  /** 是否随区域变化（true = 区域相关；false = 全局通用） */
  regionAware: boolean;
}

const TABS: Tab[] = [
  {
    id: 'publisher',
    label: '官网发布',
    subLabel: '产品发布与上架管理',
    icon: Globe,
    regionAware: true,
  },
  {
    id: 'promotions',
    label: '促销管理',
    subLabel: '促销活动与优惠配置',
    icon: BadgePercent,
    badge: '新',
    regionAware: true,
  },
  {
    id: 'categories',
    label: '分类 & 属性',
    subLabel: '产品分类与属性方案',
    icon: Layers,
    regionAware: false,
  },
  {
    id: 'catalog',
    label: '产品库',
    subLabel: '内部产品主数据目录',
    icon: Database,
    regionAware: false,
  },
  {
    id: 'pim',
    label: 'PIM 工作台',
    subLabel: '产品信息精细化管理',
    icon: Box,
    regionAware: false,
  },
  {
    id: 'mapping',
    label: '型号映射',
    subLabel: '客户/我方/供应侧型号对应',
    icon: LayoutGrid,
    regionAware: false,
  },
];

// ─── 组件 ─────────────────────────────────────────────────────────────────────

export default function ProductManagement() {
  const [activeRegion, setActiveRegion] = useState<RegionCode>('NA');
  const [activeTab, setActiveTab] = useState<TabId>('publisher');

  const region = REGIONS.find((r) => r.code === activeRegion)!;
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-0 pb-6">

      {/* ── 区域选择器 ───────────────────────────────────────────────────── */}
      <div className={`mb-4 rounded-xl border-2 ${region.borderColor} bg-white px-5 py-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 shrink-0">当前操作区域：</span>
          <div className="flex gap-2">
            {REGIONS.map((r) => {
              const isActive = r.code === activeRegion;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setActiveRegion(r.code)}
                  className={`
                    flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all
                    ${isActive
                      ? `${r.bgClass} border-transparent text-white shadow-md`
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-base leading-none">{r.flag}</span>
                  <div className="text-left">
                    <div className="leading-tight">{r.name}</div>
                    <div className={`text-[10px] leading-tight font-normal ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {r.nameEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 当前区域标记 */}
          <div className="ml-auto hidden sm:flex items-center gap-1.5">
            {currentTab.regionAware ? (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${region.badgeClass}`}>
                <span className="text-sm">{region.flag}</span>
                {region.name} 独立数据
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                🌐 全区域共用
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 标签页 ───────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 mb-5">
        <nav className="flex gap-0 overflow-x-auto" aria-label="产品管理标签页">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-left transition-colors
                  ${isActive
                    ? `border-gray-900 text-gray-900`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-gray-800' : 'text-gray-400'}`} />
                <div>
                  <div className={`text-sm font-medium leading-tight ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                    {tab.label}
                    {tab.badge && (
                      <span className="ml-1.5 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold uppercase text-red-600">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`text-[10px] leading-tight ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tab.subLabel}
                    </div>
                    {/* 区域感知标记 */}
                    {tab.regionAware && (
                      <span className="text-[9px] leading-tight" title={`${region.name}独立数据`}>
                        {region.flag}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 内容面板 ─────────────────────────────────────────────────────── */}
      <div>
        {activeTab === 'publisher'   && <WebsiteCatalogPublisher regionCode={activeRegion} />}
        {activeTab === 'promotions'  && <PromotionsManager regionCode={activeRegion} />}
        {activeTab === 'categories'  && <CategoryAttributeManager />}
        {activeTab === 'catalog'     && <InternalProductCatalog />}
        {activeTab === 'pim'         && <HomeDepotPimWorkbench />}
        {activeTab === 'mapping'     && <ModelMappingCenter />}
      </div>
    </div>
  );
}
