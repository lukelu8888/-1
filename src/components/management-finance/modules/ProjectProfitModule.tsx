import React, { useMemo, useState } from 'react';
import { Download, Eye, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
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
import type { MfProfitSnapshot } from '../types';

export function ProjectProfitModule() {
  const { orderProfits, enqueueAiJob } = useManagementFinance();
  const [drilldown, setDrilldown] = useState<MfProfitSnapshot | null>(null);

  const totals = useMemo(() => {
    const revenue = orderProfits.reduce((s, p) => s + p.revenue, 0);
    const cost = orderProfits.reduce((s, p) => s + p.total_cost, 0);
    const profit = revenue - cost;
    return { revenue, cost, profit, margin: revenue === 0 ? 0 : profit / revenue };
  }, [orderProfits]);

  return (
    <div>
      <MfModuleHeader
        title="项目 / 订单真实利润"
        subtitle="按真实成本归集：采购 + 人工 + 海运 + 税费 + 仓储 + 汇兑损益 + 固定资产分摊 + AI 成本。"
        badge={<Badge className="h-7 border-purple-200 bg-purple-50 px-2.5 text-[12px] text-purple-700">业财一体化 · 真实利润</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <Download className="h-3 w-3" /> 导出订单 P&L
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip
          items={[
            { id: 'rev',    label: '订单总营收', value: formatMoney(totals.revenue, 'CNY', { compact: true, decimals: 0 }), sub: `${orderProfits.length} 单`, tone: 'info' },
            { id: 'cost',   label: '真实总成本', value: formatMoney(totals.cost, 'CNY', { compact: true, decimals: 0 }), sub: '业财一体化', tone: 'warn' },
            { id: 'profit', label: '订单毛利',   value: formatMoney(totals.profit, 'CNY', { compact: true, decimals: 0 }), tone: totals.profit > 0 ? 'ok' : 'danger' },
            { id: 'margin', label: '订单毛利率', value: formatPercent(totals.margin) },
            { id: 'best',   label: '最高毛利单', value: orderProfits.length === 0 ? '—' : orderProfits.reduce((a, b) => (a.margin_pct! > b.margin_pct! ? a : b)).scope_ref_no ?? '—', tone: 'ok' },
            { id: 'low',    label: '低于阈值',   value: `${orderProfits.filter((o) => (o.margin_pct ?? 0) < 0.2).length}`, sub: '毛利率 < 20%', tone: 'warn' },
          ]}
        />

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">订单号 / 客户</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">币种 / 营收</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">采购</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">海运 + 物流</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">仓储</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">税费</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">汇兑损益</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">折旧分摊</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">人工 / AI</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">真实毛利</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">毛利率</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderProfits.map((p) => {
                const pct = (p.margin_pct ?? 0) * 100;
                return (
                  <TableRow key={p.id} className="hover:bg-slate-50">
                    <TableCell className="py-2.5 text-[13px]">
                      <div className="font-medium text-indigo-600">{p.scope_ref_no}</div>
                      <div className="text-[12px] text-slate-500">{p.scope_label}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums">
                      <div className="text-[12px] text-slate-400">{p.currency}</div>
                      {p.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_purchase.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_logistics.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_warehouse.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-amber-700">{p.cost_tax.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-rose-600">{p.cost_fx.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_depreciation.toLocaleString()}</TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_labor.toLocaleString()} / {p.cost_ai.toLocaleString()}</TableCell>
                    <TableCell className={`py-2.5 text-right text-[13px] font-bold tabular-nums ${p.gross_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {p.gross_profit >= 0 ? <TrendingUp className="mr-0.5 inline h-3 w-3" /> : <TrendingDown className="mr-0.5 inline h-3 w-3" />}
                      {p.gross_profit.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">
                        <Progress value={Math.min(Math.abs(pct), 100)} className="h-1.5 w-16" />
                        <span className={`text-[12px] font-semibold tabular-nums ${pct >= 25 ? 'text-emerald-700' : pct >= 15 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[13px]" onClick={() => setDrilldown(p)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-0.5 px-2 text-[13px] text-indigo-600"
                          onClick={() => enqueueAiJob('profit_analysis', { order_no: p.scope_ref_no })}
                        >
                          <Sparkles className="h-3 w-3" /> AI 钻取
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!drilldown} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[14px]">订单真实利润钻取 · {drilldown?.scope_ref_no}</DialogTitle>
            <DialogDescription className="text-[12px] text-slate-600">{drilldown?.scope_label}</DialogDescription>
          </DialogHeader>
          {drilldown ? (
            <div className="space-y-3">
              <div className="rounded border border-slate-200 p-2">
                <div className="mb-2 text-[12px] font-semibold text-slate-800">成本结构</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] tabular-nums text-slate-800">
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">采购成本</span><span>{drilldown.cost_purchase.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">人工成本</span><span>{drilldown.cost_labor.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">海运+物流</span><span>{drilldown.cost_logistics.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">仓储费用</span><span>{drilldown.cost_warehouse.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">税费</span><span>{drilldown.cost_tax.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">汇兑损益</span><span>{drilldown.cost_fx.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">固定资产折旧</span><span>{drilldown.cost_depreciation.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[12px] text-slate-500">公共分摊</span><span>{drilldown.cost_overhead.toLocaleString()}</span></div>
                  <div className="flex justify-between col-span-2 border-t border-slate-200 pt-1"><span className="text-[13px] font-semibold">真实总成本</span><span className="text-[13px] font-semibold">{drilldown.total_cost.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border border-slate-200 p-2 text-center">
                  <div className="text-[12px] text-slate-500">营收</div>
                  <div className="text-[14px] font-bold text-slate-900">{drilldown.revenue.toLocaleString()}</div>
                </div>
                <div className="rounded border border-slate-200 p-2 text-center">
                  <div className="text-[12px] text-slate-500">真实毛利</div>
                  <div className={`text-[14px] font-bold ${drilldown.gross_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{drilldown.gross_profit.toLocaleString()}</div>
                </div>
                <div className="rounded border border-slate-200 p-2 text-center">
                  <div className="text-[12px] text-slate-500">真实毛利率</div>
                  <div className="text-[14px] font-bold text-indigo-700">{formatPercent(drilldown.margin_pct ?? 0)}</div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
