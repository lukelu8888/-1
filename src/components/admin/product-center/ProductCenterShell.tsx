import { useMemo, useState, type ReactNode } from 'react';
import {
  Database,
  Globe,
  BadgePercent,
  Layers,
  DollarSign,
  Image as ImageIcon,
  ShieldCheck,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../ui/utils';

import { ROLE_LABELS, useProductCenter, type CurrentUser, type UserRole } from './context/ProductCenterContext';
import { REGIONS } from './context/regionConfig';
import type { RegionCode } from './context/types';

import { PimListPage } from './modules/pim/PimListPage';
import { PimDetailPage } from './modules/pim/PimDetailPage';
import { PublishingPage } from './modules/publishing/PublishingPage';
import { DealsPage } from './modules/deals/DealsPage';
import { CategoriesPage } from './modules/categories/CategoriesPage';
import { PricingCenterPage } from './modules/pricing/PricingCenterPage';
import { MediaCenterPage } from './modules/media/MediaCenterPage';
import { ReviewCenterPage } from './modules/review/ReviewCenterPage';
import { MappingPage } from './modules/mapping/MappingPage';

export type ProductCenterModuleId =
  | 'pim'
  | 'publishing'
  | 'deals'
  | 'categories'
  | 'pricing'
  | 'media'
  | 'review'
  | 'mapping';

interface ModuleDef {
  id: ProductCenterModuleId;
  label: string;
  labelEn: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** True = fully implemented in current phase. */
  ready: boolean;
  phase: 'P1' | 'P2' | 'P3';
}

const MODULES: ModuleDef[] = [
  {
    id: 'pim',
    label: '产品库 / PIM Master',
    labelEn: 'PIM Master',
    description: '所有产品主数据维护中心',
    icon: Database,
    ready: true,
    phase: 'P1',
  },
  {
    id: 'publishing',
    label: '官网发布',
    labelEn: 'Website Publishing',
    description: '从产品库选择产品发布到官网',
    icon: Globe,
    ready: true,
    phase: 'P1',
  },
  {
    id: 'deals',
    label: '促销管理',
    labelEn: 'Deals & Offers',
    description: '活动、折扣、限时促销',
    icon: BadgePercent,
    ready: true,
    phase: 'P2',
  },
  {
    id: 'categories',
    label: '分类 & 属性',
    labelEn: 'Category & Attributes',
    description: '分类树与属性模板',
    icon: Layers,
    ready: true,
    phase: 'P1',
  },
  {
    id: 'pricing',
    label: '价格中心',
    labelEn: 'Pricing Center',
    description: '成本 / 区域售价 / 利润率',
    icon: DollarSign,
    ready: true,
    phase: 'P1',
  },
  {
    id: 'media',
    label: '媒体中心',
    labelEn: 'Media Center',
    description: '图片 / 视频 / 文件管理',
    icon: ImageIcon,
    ready: true,
    phase: 'P1',
  },
  {
    id: 'review',
    label: '审核中心',
    labelEn: 'Review & Approval',
    description: '产品发布前审核流程',
    icon: ShieldCheck,
    ready: true,
    phase: 'P3',
  },
  {
    id: 'mapping',
    label: '型号映射',
    labelEn: 'Model Mapping',
    description: '客户/我方/供应商型号对应',
    icon: GitBranch,
    ready: true,
    phase: 'P3',
  },
];

interface ShellProps {
  /** opens the inline detail page */
  detailProductId: string | null;
  setDetailProductId: (id: string | null) => void;
  activeModule: ProductCenterModuleId;
  setActiveModule: (id: ProductCenterModuleId) => void;
}

export function ProductCenterShell({
  detailProductId,
  setDetailProductId,
  activeModule,
  setActiveModule,
}: ShellProps) {
  const { activeRegion, setActiveRegion, currentUser, setCurrentUser } = useProductCenter();
  const [navCollapsed, setNavCollapsed] = useState(false);

  const moduleContent = useMemo<ReactNode>(() => {
    if (detailProductId) {
      return (
        <PimDetailPage
          productId={detailProductId}
          onBack={() => setDetailProductId(null)}
        />
      );
    }

    switch (activeModule) {
      case 'pim':
        return <PimListPage onOpenProduct={(id) => setDetailProductId(id)} />;
      case 'publishing':
        return <PublishingPage onOpenProduct={(id) => setDetailProductId(id)} />;
      case 'deals':
        return <DealsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'pricing':
        return <PricingCenterPage onOpenProduct={(id) => setDetailProductId(id)} />;
      case 'media':
        return <MediaCenterPage onOpenProduct={(id) => setDetailProductId(id)} />;
      case 'review':
        return <ReviewCenterPage onOpenProduct={(id) => setDetailProductId(id)} />;
      case 'mapping':
        return <MappingPage />;
      default:
        return null;
    }
  }, [activeModule, detailProductId, setDetailProductId]);

  return (
    <div className="flex h-full min-h-[calc(100vh-200px)] flex-col bg-slate-50 text-slate-900">
      <RegionBar
        active={activeRegion}
        onChange={setActiveRegion}
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'relative shrink-0 border-r border-slate-200 bg-white transition-all',
            navCollapsed ? 'w-12' : 'w-60',
          )}
        >
          <div className="flex h-9 items-center justify-between border-b border-slate-200 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {!navCollapsed && <span>产品管理中心</span>}
            <button
              type="button"
              onClick={() => setNavCollapsed((v) => !v)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              aria-label={navCollapsed ? '展开导航' : '收起导航'}
            >
              {navCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          <nav className="flex flex-col py-1">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const active = !detailProductId && activeModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setDetailProductId(null);
                    setActiveModule(m.id);
                  }}
                  className={cn(
                    'group flex items-start gap-2 border-l-2 px-2.5 py-2 text-left transition-colors',
                    active
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                  title={`${m.label} · ${m.labelEn}`}
                >
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700',
                    )}
                  />
                  {!navCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium">{m.label}</span>
                        <span
                          className={cn(
                            'rounded px-1 py-px text-[9px] font-bold tracking-wide',
                            m.phase === 'P1' && 'bg-emerald-50 text-emerald-700',
                            m.phase === 'P2' && 'bg-indigo-50 text-indigo-700',
                            m.phase === 'P3' && 'bg-amber-50 text-amber-700',
                          )}
                        >
                          {m.phase}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-slate-400">{m.labelEn}</div>
                      <div className="truncate text-[11px] text-slate-400">{m.description}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">{moduleContent}</main>
      </div>
    </div>
  );
}

function RegionBar({
  active,
  onChange,
  currentUser,
  onChangeUser,
}: {
  active: RegionCode;
  onChange: (region: RegionCode) => void;
  currentUser: CurrentUser;
  onChangeUser: (u: CurrentUser) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        当前操作区域 · Operating Region
      </span>
      <div className="flex items-center gap-1">
        {REGIONS.map((r) => {
          const isActive = r.code === active;
          return (
            <button
              key={r.code}
              type="button"
              onClick={() => onChange(r.code)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] transition-colors',
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <span>{r.flag}</span>
              <span className="font-medium">{r.code}</span>
              <span className={cn(isActive ? 'text-white/80' : 'text-slate-500')}>
                {r.name}
              </span>
              <span className={cn('text-[10px]', isActive ? 'text-white/60' : 'text-slate-400')}>
                · {r.currency}
              </span>
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-500">
        <RoleSwitcher value={currentUser} onChange={onChangeUser} />
      </div>
    </div>
  );
}

function RoleSwitcher({
  value,
  onChange,
}: {
  value: CurrentUser;
  onChange: (u: CurrentUser) => void;
}) {
  const roles: UserRole[] = ['editor', 'reviewer', 'admin'];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        当前身份
      </span>
      <select
        value={value.role}
        onChange={(e) => {
          const role = e.target.value as UserRole;
          const NAME_BY_ROLE: Record<UserRole, string> = {
            editor: '编辑 Bob',
            reviewer: '审核员 Alice',
            admin: '管理员 Lina',
          };
          onChange({
            id: `u_${role}`,
            name: NAME_BY_ROLE[role],
            role,
          });
        }}
        className="h-6 rounded border border-slate-300 bg-white px-1.5 text-[11px]"
        title="切换当前用户身份（仅前端模拟）"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
        {value.name}
      </span>
    </div>
  );
}
