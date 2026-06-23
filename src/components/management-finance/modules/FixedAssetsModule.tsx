import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArchiveX,
  HardDrive,
  Plus,
  Receipt,
  Wrench,
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
import { Progress } from '../../ui/progress';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { MfStatStrip } from '../components/MfStatStrip';
import { formatMoney, formatPercent } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';

const STATUS_TONE: Record<string, string> = {
  in_use: 'bg-emerald-50 text-emerald-700',
  idle: 'bg-slate-100 text-slate-500',
  under_repair: 'bg-amber-50 text-amber-700',
  disposed: 'bg-rose-50 text-rose-700',
  scrapped: 'bg-rose-50 text-rose-700',
  sold: 'bg-blue-50 text-blue-700',
};

export function FixedAssetsModule() {
  const { assets, depreciation, period } = useManagementFinance();

  const totals = useMemo(() => {
    const totalCost = assets.reduce((s, a) => s + a.acquisition_cost, 0);
    const totalAccum = assets.reduce((s, a) => s + a.accumulated_depreciation, 0);
    const totalNbv = assets.reduce((s, a) => s + a.net_book_value, 0);
    const monthlyDepr = assets.reduce(
      (s, a) => s + (a.status === 'in_use' ? (a.acquisition_cost - a.salvage_value) / a.useful_life_months : 0),
      0,
    );
    const fullyDepreciated = assets.filter((a) => a.net_book_value === 0).length;
    return { totalCost, totalAccum, totalNbv, monthlyDepr, fullyDepreciated };
  }, [assets]);

  const currentMonthDepr = depreciation.filter(
    (d) => d.period_year === period.year && d.period_month === period.month,
  );

  return (
    <div>
      <MfModuleHeader
        title="固定资产管理"
        subtitle="资产台账 / 折旧计算 / 自动凭证 / 维修记录 / 处置闭环。支持直线法、双倍余额递减、年数总和等多种折旧方法。"
        badge={
          <Badge className="h-7 border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700">
            Auto Depreciation
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <Wrench className="h-3.5 w-3.5" /> 维修登记
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <ArchiveX className="h-3.5 w-3.5" /> 资产处置
            </Button>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500">
              <Plus className="h-3.5 w-3.5" /> 新增资产
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip
          items={[
            { id: 'count',    label: '资产数量',    value: `${assets.length}`, sub: '台账数', tone: 'info' },
            { id: 'cost',     label: '原值总计',    value: formatMoney(totals.totalCost, 'CNY', { compact: true, decimals: 0 }) },
            { id: 'accum',    label: '累计折旧',    value: formatMoney(totals.totalAccum, 'CNY', { compact: true, decimals: 0 }), tone: 'warn' },
            { id: 'nbv',      label: '账面净值',    value: formatMoney(totals.totalNbv, 'CNY', { compact: true, decimals: 0 }), tone: 'ok' },
            { id: 'monthly',  label: '本月计提',    value: formatMoney(totals.monthlyDepr, 'CNY', { compact: true, decimals: 0 }), sub: `${period.year}-${period.month}` },
            { id: 'full',     label: '已折旧完毕',  value: `${totals.fullyDepreciated}`, sub: '待处置', tone: totals.fullyDepreciated > 0 ? 'warn' : 'default' },
          ]}
        />

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-11 whitespace-nowrap text-[12px] font-semibold text-slate-800">资产编号 / 名称</TableHead>
                <TableHead className="h-11 text-[12px] font-semibold text-slate-800">分类</TableHead>
                <TableHead className="h-11 text-[12px] font-semibold text-slate-800">使用部门</TableHead>
                <TableHead className="h-11 text-right text-[12px] font-semibold text-slate-800">原值</TableHead>
                <TableHead className="h-11 text-right text-[12px] font-semibold text-slate-800">累计折旧</TableHead>
                <TableHead className="h-11 text-right text-[12px] font-semibold text-slate-800">净值</TableHead>
                <TableHead className="min-w-[112px] h-11 text-[12px] font-semibold text-slate-800">折旧进度</TableHead>
                <TableHead className="h-11 text-[12px] font-semibold text-slate-800">方法 / 残值</TableHead>
                <TableHead className="h-11 text-[12px] font-semibold text-slate-800">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => {
                const progress = (a.accumulated_depreciation / Math.max(a.acquisition_cost - a.salvage_value, 1)) * 100;
                return (
                  <TableRow key={a.id} className="hover:bg-slate-50">
                    <TableCell className="py-2.5 align-top text-[13px]">
                      <div className="font-semibold text-indigo-700">{a.asset_no}</div>
                      <div className="mt-0.5 text-[12px] leading-snug text-slate-700">{a.name}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-slate-800">{categoryLabel(a.category)}</TableCell>
                    <TableCell className="py-2.5 text-[13px] text-slate-800">
                      <div className="font-medium">{a.department_name ?? '—'}</div>
                      <div className="mt-0.5 text-[12px] leading-snug text-slate-600">{a.location ?? '—'}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-900">{a.acquisition_cost.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums font-medium text-amber-800">{a.accumulated_depreciation.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] font-semibold tabular-nums text-emerald-800">{a.net_book_value.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5">
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="mt-1 text-[12px] tabular-nums text-slate-600">{formatPercent(progress / 100, 1)}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] leading-snug text-slate-700">
                      <div className="text-[13px] text-slate-800">{depreciationMethodLabel(a.depreciation_method)}</div>
                      <div className="mt-0.5 text-[12px] text-slate-600">残值 {formatMoney(a.salvage_value, a.currency, { decimals: 0 })}</div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge className={`h-7 border-0 px-2.5 text-[12px] font-medium ${STATUS_TONE[a.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {statusLabel(a.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50/60">
            <div className="border-b border-slate-200 px-3 py-2.5 text-[14px] font-semibold tracking-tight text-slate-900">
              {period.year}-{period.month} 折旧明细
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="h-10 text-[12px] font-semibold text-slate-800">资产</TableHead>
                  <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">本月折旧</TableHead>
                  <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">累计</TableHead>
                  <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">期末净值</TableHead>
                  <TableHead className="h-10 text-[12px] font-semibold text-slate-800">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthDepr.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-4 text-center text-[13px] text-slate-500">
                      暂无明细
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMonthDepr.map((d) => {
                    const asset = assets.find((a) => a.id === d.asset_id);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="py-2.5 text-[13px] text-slate-900">{asset?.name ?? d.asset_id}</TableCell>
                        <TableCell className="py-2.5 text-right text-[13px] tabular-nums">{d.amount.toLocaleString()}</TableCell>
                        <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{d.accumulated.toLocaleString()}</TableCell>
                        <TableCell className="py-2.5 text-right text-[13px] font-medium tabular-nums text-emerald-800">{d.net_book_value.toLocaleString()}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge className={`h-7 border-0 px-2.5 text-[12px] font-medium ${d.status === 'posted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                            {d.status === 'posted' ? '已落账' : '待落账'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded border border-indigo-200 bg-indigo-50/50 p-4 text-indigo-950">
            <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
              <HardDrive className="h-4 w-4 shrink-0" /> 自动凭证（折旧）
            </div>
            <pre className="mt-2 whitespace-pre-wrap rounded-md border border-indigo-200/70 bg-white/90 p-3 font-mono text-[12px] leading-relaxed text-indigo-950">
{`月末批量计算 (mf_voucher_rules.event_type='asset.depreciation')：
借：管理费用 - 折旧                       ${totals.monthlyDepr.toFixed(0)}
  贷：累计折旧                              ${totals.monthlyDepr.toFixed(0)}`}
            </pre>
            <p className="mt-3 text-[13px] leading-relaxed text-indigo-950/90">
              <Receipt className="mr-1 inline h-4 w-4 align-text-bottom opacity-90" />
              折旧条目同步写入 <code className="rounded border border-indigo-200 bg-white px-1.5 py-0.5 font-mono text-[12px] text-indigo-900">mf_depreciation_schedule</code>{' '}
              并归集到资产所属成本中心，
              用于部门 / 项目 / 订单层面的真实利润计算。
            </p>
            {totals.fullyDepreciated > 0 ? (
              <div className="mt-3 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="text-[13px] leading-relaxed">
                  {totals.fullyDepreciated} 项资产净值为 0，建议进入处置流程（出售 / 报废）并触发{' '}
                  <code className="rounded bg-white/80 px-1 font-mono text-[12px]">mf_voucher_rules.event_type='asset.disposal'</code>。
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function categoryLabel(c: string): string {
  return { electronics: '电子设备', vehicle: '车辆', building: '不动产', machinery: '机器设备', software: '软件', other: '其它' }[c] ?? c;
}
function depreciationMethodLabel(m: string): string {
  return { straight_line: '直线法', double_declining: '双倍余额递减', units_of_production: '工作量法', sum_of_years: '年数总和法' }[m] ?? m;
}
function statusLabel(s: string): string {
  return { in_use: '使用中', idle: '闲置', under_repair: '维修中', disposed: '已处置', scrapped: '已报废', sold: '已出售' }[s] ?? s;
}
