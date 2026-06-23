import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { toast } from 'sonner';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { MfStatStrip } from '../components/MfStatStrip';
import { formatMoney } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';
import type { MfVoucherWithLines } from '../types';

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700',
  posted: 'bg-emerald-50 text-emerald-700',
  approved: 'bg-blue-50 text-blue-700',
  reversed: 'bg-rose-50 text-rose-700',
  void: 'bg-slate-100 text-slate-500',
};

const TYPE_LABEL: Record<string, string> = {
  JE: '通用',
  PAYROLL: '工资',
  DEPRECIATION: '折旧',
  EXPENSE: '费用',
  REVENUE: '收入',
  FX: '汇兑',
  ADJUST: '调整',
  OPENING: '期初',
  CLOSING: '结转',
  AI: 'AI 建议',
};

const SOURCE_LABEL: Record<string, string> = {
  payroll: '工资计提',
  asset: '固定资产',
  expense: '费用报销',
  budget: '预算',
  manual: '手工录入',
  ai: 'AI 建议',
};

export function VoucherCenterModule() {
  const { vouchers, postVoucher, refreshSlice } = useManagementFinance();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeVoucher, setActiveVoucher] = useState<MfVoucherWithLines | null>(null);
  const [posting, setPosting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return vouchers.filter((v) => {
      if (sourceFilter !== 'all' && v.source_module !== sourceFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!v.voucher_no.toLowerCase().includes(q) && !(v.description?.toLowerCase().includes(q) ?? false)) return false;
      }
      return true;
    });
  }, [vouchers, search, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    const draftCount = vouchers.filter((v) => v.status === 'draft').length;
    const postedCount = vouchers.filter((v) => v.status === 'posted').length;
    const aiCount = vouchers.filter((v) => v.source_module === 'ai').length;
    const totalCny = vouchers.reduce((s, v) => s + v.amount * (v.exchange_rate || 1), 0);
    return [
      { id: 'total',  label: '凭证总数',   value: `${vouchers.length}`, sub: '本期范围', tone: 'info' as const },
      { id: 'draft',  label: '待复核',     value: `${draftCount}`, sub: 'AI / 系统建议', tone: draftCount > 0 ? ('warn' as const) : ('default' as const) },
      { id: 'posted', label: '已落账',     value: `${postedCount}`, sub: '不可逆改', tone: 'ok' as const },
      { id: 'ai',     label: 'AI 凭证',    value: `${aiCount}`, sub: '建议借贷', tone: 'info' as const },
      { id: 'amount', label: '金额合计',   value: formatMoney(totalCny, 'CNY', { compact: true, decimals: 0 }), sub: '已折 CNY' },
      { id: 'rules',  label: '凭证规则',   value: '6 active', sub: 'mf_voucher_rules' },
    ];
  }, [vouchers]);

  const onPost = async (id: string) => {
    setPosting(id);
    try {
      await postVoucher(id);
      await refreshSlice('vouchers');
      toast.success('凭证已落账');
    } catch (err) {
      toast.error((err as Error).message ?? '凭证落账失败');
    } finally {
      setPosting(null);
    }
  };

  return (
    <div>
      <MfModuleHeader
        title="自动凭证中心"
        subtitle="工资、社保、折旧、费用、汇兑、AI 建议六类凭证统一汇集。借贷自动平衡、规则驱动、可审计、可回滚。"
        badge={<Badge className="h-7 border-rose-200 bg-rose-50 px-2.5 text-[12px] text-rose-700">凭证引擎</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <ArrowLeftRight className="h-3 w-3" /> 凭证规则配置
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <FileText className="h-3 w-3" /> 导出凭证账册
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip items={stats} />

        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50/60 px-2 py-1.5">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索凭证号 / 摘要..."
              className="h-9 pl-8 text-[13px]"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-9 w-[130px] border-slate-200 bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部来源</SelectItem>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[110px] border-slate-200 bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部状态</SelectItem>
              <SelectItem value="draft" className="text-xs">待复核</SelectItem>
              <SelectItem value="posted" className="text-xs">已落账</SelectItem>
              <SelectItem value="reversed" className="text-xs">已冲销</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3 overflow-x-auto rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="h-10 text-[12px] font-semibold text-slate-800">凭证号 / 日期</TableHead>
                  <TableHead className="h-10 text-[12px] font-semibold text-slate-800">类型 / 来源</TableHead>
                  <TableHead className="h-10 text-[12px] font-semibold text-slate-800">摘要</TableHead>
                  <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">金额</TableHead>
                  <TableHead className="h-10 text-[12px] font-semibold text-slate-800">状态</TableHead>
                  <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    className={`cursor-pointer hover:bg-slate-50 ${activeVoucher?.id === v.id ? 'bg-indigo-50/40' : ''}`}
                    onClick={() => setActiveVoucher(v)}
                  >
                    <TableCell className="py-2.5 text-[13px]">
                      <div className="font-medium text-indigo-600">{v.voucher_no}</div>
                      <div className="text-[12px] text-slate-400">{v.voucher_date}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px]">
                      <div className="flex items-center gap-1">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-700">{TYPE_LABEL[v.voucher_type] ?? v.voucher_type}</span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-slate-400">{SOURCE_LABEL[v.source_module ?? ''] ?? v.source_module ?? '—'}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-slate-700">
                      <span className="line-clamp-1">{v.description}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[13px] tabular-nums">
                      {formatMoney(v.amount, v.currency, { decimals: 2 })}
                      {v.currency !== 'CNY' ? (
                        <div className="text-[12px] text-slate-400">≈ {formatMoney(v.amount * v.exchange_rate, 'CNY', { decimals: 0 })}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`h-7 border-0 px-2.5 text-[12px] ${STATUS_TONE[v.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {v.status === 'draft' ? '待复核' : v.status === 'posted' ? '已落账' : v.status === 'reversed' ? '已冲销' : v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {v.status === 'draft' ? (
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-emerald-600 px-3 text-[13px] text-white hover:bg-emerald-500"
                          disabled={posting === v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPost(v.id);
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" /> 落账
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[13px]">详情</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-800">
                {activeVoucher ? `${activeVoucher.voucher_no} · ${activeVoucher.description ?? ''}` : '凭证明细'}
              </div>
              {activeVoucher ? (
                <>
                  <div className="border-b border-slate-100 px-3 py-2.5 text-[12px] text-slate-700">
                    <div>日期：{activeVoucher.voucher_date}</div>
                    <div>类型：{TYPE_LABEL[activeVoucher.voucher_type] ?? activeVoucher.voucher_type} · 来源 {SOURCE_LABEL[activeVoucher.source_module ?? ''] ?? activeVoucher.source_module ?? '—'}</div>
                    <div>币种：{activeVoucher.currency} × {activeVoucher.exchange_rate.toFixed(4)}</div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="h-10 text-[12px] font-semibold text-slate-800">科目</TableHead>
                        <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">借</TableHead>
                        <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">贷</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeVoucher.lines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="py-2 text-[13px]">
                            <div className="font-medium text-slate-800">{l.account_code} · {l.account_name}</div>
                            {l.memo ? <div className="text-[12px] text-slate-500">{l.memo}</div> : null}
                          </TableCell>
                          <TableCell className="py-2 text-right text-[13px] tabular-nums text-amber-700">{l.debit > 0 ? l.debit.toLocaleString() : '—'}</TableCell>
                          <TableCell className="py-2 text-right text-[13px] tabular-nums text-emerald-700">{l.credit > 0 ? l.credit.toLocaleString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50">
                        <TableCell className="py-1.5 text-[12px] font-semibold text-slate-600">合计</TableCell>
                        <TableCell className="py-2 text-right text-[13px] font-bold tabular-nums">
                          {activeVoucher.lines.reduce((s, l) => s + l.debit, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2 text-right text-[13px] font-bold tabular-nums">
                          {activeVoucher.lines.reduce((s, l) => s + l.credit, 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {activeVoucher.source_module === 'ai' ? (
                    <div className="border-t border-slate-100 bg-indigo-50/40 p-2 text-[12px] text-indigo-800">
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      该凭证由 AI 凭证引擎根据近 30 期相似业务推荐生成（置信度 92%）。请人工复核后点击"落账"。
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="p-6 text-center text-[12px] text-slate-500">
                  <ClipboardCheck className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                  点击左侧任一凭证查看明细
                </div>
              )}
            </div>

            <div className="mt-3 rounded border border-indigo-200 bg-indigo-50/40 p-3 text-[12px] text-indigo-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <Banknote className="h-3.5 w-3.5" /> 自动凭证规则示例
              </div>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] leading-snug text-indigo-900/90">
{`{
  "event_type": "payroll.run",
  "template": [
    { "side": "debit",  "account_code": "6602.01",
      "amount_expr": "payload.gross_total", "cc_expr": "payload.dept_code" },
    { "side": "credit", "account_code": "2211",
      "amount_expr": "payload.gross_total" }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
