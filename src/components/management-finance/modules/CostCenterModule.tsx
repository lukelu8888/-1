import React, { useMemo } from 'react';
import {
  Boxes,
  Building2,
  Cpu,
  Factory,
  Layers,
  Truck,
  UsersRound,
  Warehouse,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { MfStatStrip } from '../components/MfStatStrip';
import { formatMoney, formatPercent } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';
import type { CostCenterType } from '../types';

const TYPE_META: Record<CostCenterType, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  department: { label: '部门成本', icon: Building2,   tone: 'bg-slate-100 text-slate-700' },
  project:    { label: '项目成本', icon: Layers,      tone: 'bg-indigo-50 text-indigo-700' },
  warehouse:  { label: '仓储成本', icon: Warehouse,   tone: 'bg-amber-50 text-amber-700' },
  logistics:  { label: '物流成本', icon: Truck,       tone: 'bg-blue-50 text-blue-700' },
  people:     { label: '人工成本', icon: UsersRound,  tone: 'bg-emerald-50 text-emerald-700' },
  ai:         { label: 'AI 成本',  icon: Cpu,         tone: 'bg-purple-50 text-purple-700' },
  shared:     { label: '公共分摊', icon: Boxes,       tone: 'bg-slate-100 text-slate-600' },
};

export function CostCenterModule() {
  const { costCenters, deptProfits, departments } = useManagementFinance();

  // Aggregate cost by cost center based on department profit snapshots.
  // Real implementation would be:
  //   SELECT cost_center_id, sum(debit-credit) FROM mf_voucher_lines
  //   WHERE cost_center_id IS NOT NULL GROUP BY cost_center_id;
  // Mock seed: synthesize from department profits keyed by cost_center_id.
  const aggregated = useMemo(() => {
    const map = new Map<string, { labor: number; logistics: number; warehouse: number; depreciation: number; ai: number; overhead: number; total: number }>();
    for (const p of deptProfits) {
      const dep = departments.find((d) => d.id === p.scope_ref_id);
      const ccId = dep?.cost_center_id ?? null;
      if (!ccId) continue;
      const slot = map.get(ccId) ?? { labor: 0, logistics: 0, warehouse: 0, depreciation: 0, ai: 0, overhead: 0, total: 0 };
      slot.labor += p.cost_labor;
      slot.logistics += p.cost_logistics;
      slot.warehouse += p.cost_warehouse;
      slot.depreciation += p.cost_depreciation;
      slot.ai += p.cost_ai;
      slot.overhead += p.cost_overhead;
      slot.total += p.cost_labor + p.cost_logistics + p.cost_warehouse + p.cost_depreciation + p.cost_ai + p.cost_overhead;
      map.set(ccId, slot);
    }
    return map;
  }, [deptProfits, departments]);

  const grandTotal = Array.from(aggregated.values()).reduce((s, v) => s + v.total, 0);

  const breakdownByType = useMemo(() => {
    const types: CostCenterType[] = ['department', 'project', 'warehouse', 'logistics', 'people', 'ai', 'shared'];
    return types.map((t) => {
      const ccs = costCenters.filter((c) => c.cc_type === t);
      const sum = ccs.reduce((s, c) => s + (aggregated.get(c.id)?.total ?? 0), 0);
      return { type: t, count: ccs.length, sum };
    });
  }, [costCenters, aggregated]);

  return (
    <div>
      <MfModuleHeader
        title="成本中心体系"
        subtitle="部门 / 项目 / 仓储 / 物流 / 人工 / AI 全维度成本归集。所有凭证行的 cost_center_id 强制非空（业务费用类）。"
        badge={<Badge className="h-7 border-purple-200 bg-purple-50 px-2.5 text-[12px] text-purple-700">业财一体化</Badge>}
        actions={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
            <Factory className="h-3 w-3" />
            维护成本中心
          </Button>
        }
      />

      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {breakdownByType.map(({ type, count, sum }) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            const share = grandTotal === 0 ? 0 : sum / grandTotal;
            return (
              <div key={type} className="rounded border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700">
                  <span>{meta.label}</span>
                  <span className={`rounded p-1 ${meta.tone}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-1 text-[15px] font-bold tabular-nums text-slate-900">
                  {formatMoney(sum, 'CNY', { compact: true, decimals: 0 })}
                </div>
                <div className="mt-0.5 text-[12px] text-slate-400">{count} 个中心 · 占比 {formatPercent(share)}</div>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">成本中心</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">类型</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">人工成本</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">物流成本</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">仓储成本</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">折旧分摊</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">AI 成本</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">公共分摊</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">合计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.map((c) => {
                const meta = TYPE_META[c.cc_type];
                const data = aggregated.get(c.id);
                return (
                  <TableRow key={c.id} className="hover:bg-slate-50">
                    <TableCell className="py-2.5 text-[13px]">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-[12px] text-slate-400">{c.code}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`h-7 border-0 px-2.5 text-[12px] ${meta.tone}`}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{data ? formatMoney(data.labor, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{data ? formatMoney(data.logistics, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{data ? formatMoney(data.warehouse, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{data ? formatMoney(data.depreciation, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-purple-700">{data ? formatMoney(data.ai, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-500">{data ? formatMoney(data.overhead, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] font-semibold tabular-nums text-slate-900">{data ? formatMoney(data.total, 'CNY', { decimals: 0 }) : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
