import React, { useMemo } from 'react';
import { Building2, Download, Eye, TrendingDown, TrendingUp } from 'lucide-react';
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

export function DepartmentProfitModule() {
  const { deptProfits } = useManagementFinance();

  const totals = useMemo(() => {
    const revenue = deptProfits.reduce((s, p) => s + p.revenue, 0);
    const cost = deptProfits.reduce((s, p) => s + p.total_cost, 0);
    const profit = revenue - cost;
    return { revenue, cost, profit, margin: revenue === 0 ? 0 : profit / revenue };
  }, [deptProfits]);

  const profitable = deptProfits.filter((p) => p.gross_profit > 0).length;
  const lossMaking = deptProfits.filter((p) => p.gross_profit < 0).length;

  return (
    <div>
      <MfModuleHeader
        title="部门利润分析"
        subtitle="基于 mf_profit_snapshots.scope='department' 的实时数据。营收按业务侧主营业务收入归集，成本含人工 / 物流 / 仓储 / 折旧 / AI / 公共分摊。"
        badge={<Badge className="h-7 border-emerald-200 bg-emerald-50 px-2.5 text-[12px] text-emerald-700">实时回算</Badge>}
        actions={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
            <Download className="h-3 w-3" /> 导出部门 P&L
          </Button>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip
          items={[
            { id: 'rev',    label: '总营收',  value: formatMoney(totals.revenue, 'CNY', { compact: true, decimals: 0 }), sub: `${deptProfits.length} 个部门`, tone: 'info' },
            { id: 'cost',   label: '总成本',  value: formatMoney(totals.cost, 'CNY', { compact: true, decimals: 0 }), sub: '业财一体化', tone: 'warn' },
            { id: 'profit', label: '部门毛利',value: formatMoney(totals.profit, 'CNY', { compact: true, decimals: 0 }), sub: '已扣公共分摊', tone: totals.profit > 0 ? 'ok' : 'danger' },
            { id: 'margin', label: '毛利率',  value: formatPercent(totals.margin), sub: '加权综合' },
            { id: 'win',    label: '盈利部门', value: `${profitable}`, tone: 'ok' },
            { id: 'loss',   label: '亏损部门', value: `${lossMaking}`, tone: lossMaking > 0 ? 'danger' : 'default' },
          ]}
        />

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">部门</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">营收</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">采购成本</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">人工</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">物流</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">仓储</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">折旧</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">AI</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">公共分摊</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">毛利</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">毛利率</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...deptProfits]
                .sort((a, b) => b.gross_profit - a.gross_profit)
                .map((p) => {
                  const pct = (p.margin_pct ?? 0) * 100;
                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50">
                      <TableCell className="py-2.5 text-[13px]">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {p.scope_label}
                        </div>
                        <div className="text-[12px] text-slate-400">{p.scope_ref_no}</div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] font-semibold tabular-nums text-slate-900">{p.revenue.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_purchase.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_labor.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_logistics.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_warehouse.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.cost_depreciation.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-purple-700">{p.cost_ai.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-500">{p.cost_overhead.toLocaleString()}</TableCell>
                      <TableCell className={`py-2.5 text-right text-[13px] font-bold tabular-nums ${p.gross_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {p.gross_profit >= 0 ? <TrendingUp className="mr-0.5 inline h-3 w-3" /> : <TrendingDown className="mr-0.5 inline h-3 w-3" />}
                        {p.gross_profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <Progress value={Math.min(Math.abs(pct), 100)} className="h-1.5 w-16" />
                          <span className={`text-[12px] font-semibold tabular-nums ${pct >= 25 ? 'text-emerald-700' : pct >= 10 ? 'text-amber-700' : pct >= 0 ? 'text-slate-600' : 'text-rose-700'}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-0.5 px-3 text-[13px]">
                          <Eye className="h-3 w-3" /> 钻取
                        </Button>
                      </TableCell>
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
