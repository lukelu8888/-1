import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  Plus,
  Receipt,
  Search,
  XCircle,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { MfStatStrip } from '../components/MfStatStrip';
import { formatMoney } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';
import type { ExpenseStatus } from '../types';

const STATUS_LABEL: Record<ExpenseStatus, { label: string; tone: string }> = {
  draft: { label: '草稿', tone: 'bg-slate-100 text-slate-600' },
  submitted: { label: '待审批', tone: 'bg-amber-50 text-amber-700' },
  approved: { label: '已审批', tone: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '已驳回', tone: 'bg-rose-50 text-rose-700' },
  paid: { label: '已付款', tone: 'bg-blue-50 text-blue-700' },
  voided: { label: '已作废', tone: 'bg-slate-100 text-slate-500' },
};

export function ExpenseManagementModule() {
  const { expenseClaims, departments } = useManagementFinance();
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return expenseClaims.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.claim_no.toLowerCase().includes(q) &&
          !(c.applicant_name?.toLowerCase().includes(q) ?? false) &&
          !(c.reason?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [expenseClaims, statusFilter, search]);

  const deptLookup = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  const stats = useMemo(() => {
    const inCny = (c: { total_amount: number; exchange_rate: number }) =>
      c.total_amount * (c.exchange_rate || 1);
    const submitted = expenseClaims.filter((c) => c.status === 'submitted');
    const approved = expenseClaims.filter((c) => c.status === 'approved');
    const paid = expenseClaims.filter((c) => c.status === 'paid');
    return [
      { id: 'total', label: '本月报销笔数', value: `${expenseClaims.length}`, sub: '含全部状态' },
      { id: 'pending', label: '待审批', value: `${submitted.length}`, sub: formatMoney(submitted.reduce((s, c) => s + inCny(c), 0), 'CNY', { compact: true, decimals: 0 }), tone: 'warn' as const },
      { id: 'approved', label: '已审批待付', value: `${approved.length}`, sub: formatMoney(approved.reduce((s, c) => s + inCny(c), 0), 'CNY', { compact: true, decimals: 0 }), tone: 'info' as const },
      { id: 'paid', label: '已付款', value: `${paid.length}`, sub: formatMoney(paid.reduce((s, c) => s + inCny(c), 0), 'CNY', { compact: true, decimals: 0 }), tone: 'ok' as const },
      { id: 'fx', label: '外币报销', value: `${expenseClaims.filter((c) => c.currency !== 'CNY').length}`, sub: 'USD / EUR / GBP', tone: 'default' as const },
      { id: 'voucher', label: '已生成凭证', value: `${expenseClaims.filter((c) => c.voucher_id).length}`, sub: '自动凭证引擎', tone: 'info' as const },
    ];
  }, [expenseClaims]);

  return (
    <div>
      <MfModuleHeader
        title="费用管理中心"
        subtitle="差旅、办公、招待、福利、IT 等管理费用的提交 / 审批 / 付款 / 入账闭环。审批通过即由凭证引擎落账。"
        badge={
          <Badge className="h-7 border-emerald-200 bg-emerald-50 px-2.5 text-[12px] text-emerald-700">
            自动凭证已启用
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <FileText className="h-3 w-3" />
              导出报表
            </Button>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500">
              <Plus className="h-3 w-3" />
              新建报销单
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip items={stats} />

        <div className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-slate-50/60 px-2 py-1.5">
          <div className="relative w-[280px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索报销单号 / 申请人 / 事由..."
              className="h-9 pl-8 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-1 text-[13px] text-slate-600">
            <Filter className="h-3 w-3" /> 状态
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExpenseStatus | 'all')}>
            <SelectTrigger className="h-9 w-[130px] border-slate-200 bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部状态</SelectItem>
              <SelectItem value="submitted" className="text-xs">待审批</SelectItem>
              <SelectItem value="approved" className="text-xs">已审批</SelectItem>
              <SelectItem value="paid" className="text-xs">已付款</SelectItem>
              <SelectItem value="rejected" className="text-xs">已驳回</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">报销单号</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">申请人 / 部门</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">事由</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">金额</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">币种 · 折 CNY</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">状态</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">关联凭证</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-[13px] text-slate-500">
                    暂无报销数据
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const cny = c.total_amount * (c.exchange_rate || 1);
                  const status = STATUS_LABEL[c.status];
                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50">
                      <TableCell className="py-2.5 text-[13px] font-medium text-indigo-600">
                        {c.claim_no}
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px] text-slate-700">
                        <div>{c.applicant_name}</div>
                        <div className="text-[12px] text-slate-400">
                          {c.department_id ? deptLookup.get(c.department_id) ?? '—' : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px] text-slate-700">{c.reason}</TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-800">
                        {formatMoney(c.total_amount, c.currency, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px] text-slate-500">
                        {c.currency} × {c.exchange_rate.toFixed(2)}
                        <div className="text-[12px] text-slate-400">
                          ≈ {formatMoney(cny, 'CNY', { decimals: 0 })}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`h-7 border-0 px-2.5 text-[12px] ${status.tone}`}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px]">
                        {c.voucher_id ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[12px] text-blue-700">
                            <Receipt className="h-3 w-3" />
                            已落账
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400">未生成</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {c.status === 'submitted' ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-8 gap-1 border-emerald-200 px-2.5 text-[13px] text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> 批
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 gap-1 border-rose-200 px-2.5 text-[13px] text-rose-700">
                              <XCircle className="h-3 w-3" /> 退
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 px-3 text-[13px]">详情</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded border border-indigo-200 bg-indigo-50/50 p-3 text-[12px] text-indigo-900">
          <div className="flex items-center gap-1.5 font-semibold">
            <ClipboardList className="h-3.5 w-3.5" /> 自动凭证规则（差旅 / 办公 / 招待）
          </div>
          <p className="mt-1 text-indigo-800/80">
            报销审批通过后，由 <code className="rounded bg-white px-1 text-[12px]">mf_voucher_rules</code> 配置驱动凭证引擎自动生成借贷记账：
            <br />
            借：管理费用 - 差旅 / 办公 / 招待 …（按报销分类 → 二级科目）；贷：银行存款 / 库存现金；外币按当日汇率折 CNY。
          </p>
        </div>
      </div>
    </div>
  );
}
