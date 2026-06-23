import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Calculator,
  FileDown,
  Layers,
  Lock,
  Search,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
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
import { formatMoney } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';
import type { MfPayslip, MfPayslipLine, MfPayslipRun, MfSiSchemeVersion } from '../types';

const RUN_STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: '草稿', tone: 'bg-slate-100 text-slate-600' },
  calculated: { label: '已计算', tone: 'bg-indigo-50 text-indigo-700' },
  approved: { label: '已审批', tone: 'bg-emerald-50 text-emerald-700' },
  disbursed: { label: '已代发', tone: 'bg-blue-50 text-blue-700' },
  locked: { label: '已锁定', tone: 'bg-slate-100 text-slate-500' },
  cancelled: { label: '已取消', tone: 'bg-rose-50 text-rose-700' },
};

const LINE_CAT_LABEL: Record<MfPayslipLine['category'], string> = {
  earning: '收入项',
  deduction: '员工代扣',
  employer_cost: '公司承担（人力成本）',
};

function periodAnchor(pr: MfPayslipRun): string {
  return `${pr.period_year}-${String(pr.period_month).padStart(2, '0')}-01`;
}

function resolveSiVersionForRun(
  pr: MfPayslipRun | null,
  versions: MfSiSchemeVersion[],
): MfSiSchemeVersion | null {
  if (!pr) return null;
  const anchor = periodAnchor(pr);
  return (
    versions.find(
      (v) => v.effective_from <= anchor && (!v.effective_to || v.effective_to >= anchor),
    ) ??
    versions.find((v) => v.id === pr.si_scheme_version_id) ??
    null
  );
}

export function PayrollModule() {
  const { payslipRun, payslips, payslipLines, siSchemeVersions, period } = useManagementFinance();
  const [search, setSearch] = useState('');
  const [detailPayslip, setDetailPayslip] = useState<MfPayslip | null>(null);

  const filtered = useMemo(() => {
    if (!search) return payslips;
    const q = search.toLowerCase();
    return payslips.filter(
      (p) =>
        p.employee_name?.toLowerCase().includes(q) ||
        p.employee_no?.toLowerCase().includes(q) ||
        p.department_name?.toLowerCase().includes(q),
    );
  }, [payslips, search]);

  const runLines = useMemo(() => {
    const rid = payslipRun?.id;
    if (!rid) return payslipLines;
    return payslipLines.filter((l) => l.run_id === rid);
  }, [payslipLines, payslipRun?.id]);

  const linesForDetail = useMemo(
    () => (detailPayslip ? runLines.filter((l) => l.payslip_id === detailPayslip.id) : []),
    [detailPayslip, runLines],
  );

  const activeSiVersion = useMemo(
    () => resolveSiVersionForRun(payslipRun, siSchemeVersions),
    [payslipRun, siSchemeVersions],
  );

  const groupedDetail = useMemo(() => {
    const g: Record<MfPayslipLine['category'], MfPayslipLine[]> = {
      earning: [],
      deduction: [],
      employer_cost: [],
    };
    for (const row of linesForDetail) {
      g[row.category].push(row);
    }
    return g;
  }, [linesForDetail]);

  const totalCompanyCost = useMemo(
    () =>
      payslips.reduce(
        (s, p) => s + p.gross_pay + p.social_insurance_company + p.housing_fund_company,
        0,
      ),
    [payslips],
  );

  const status = payslipRun ? RUN_STATUS[payslipRun.status] : null;

  return (
    <div>
      <MfModuleHeader
        title="工资与人力成本"
        subtitle={`周期：${period.year} 年 ${period.month} 月 · 汇总表 + 批次分项快照 · 规则改版不回算历史行`}
        badge={status ? <Badge className={`h-7 border-0 px-2.5 text-[12px] ${status.tone}`}>{status.label}</Badge> : null}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <Calculator className="h-3 w-3" />
              重算工资
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <FileDown className="h-3 w-3" />
              工资条 PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <Send className="h-3 w-3" />
              银行代发清单
            </Button>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500">
              <Lock className="h-3 w-3" />
              入账并锁期
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip
          items={[
            { id: 'count', label: '在册员工', value: `${payslipRun?.employee_count ?? 0}`, sub: '本月工资条', tone: 'info' },
            { id: 'gross', label: '应发工资合计', value: formatMoney(payslipRun?.total_gross ?? 0, 'CNY', { compact: true, decimals: 0 }), sub: 'Gross Pay' },
            { id: 'net', label: '实发工资', value: formatMoney(payslipRun?.total_net ?? 0, 'CNY', { compact: true, decimals: 0 }), sub: 'Net Pay', tone: 'ok' },
            { id: 'si', label: '社保合计', value: formatMoney(payslipRun?.total_si ?? 0, 'CNY', { compact: true, decimals: 0 }), sub: '公司+个人' },
            { id: 'hf', label: '公积金合计', value: formatMoney(payslipRun?.total_hf ?? 0, 'CNY', { compact: true, decimals: 0 }), sub: '公司+个人' },
            { id: 'totalCost', label: '人力总成本', value: formatMoney(totalCompanyCost, 'CNY', { compact: true, decimals: 0 }), sub: 'Gross + 公司缴', tone: 'warn' },
          ]}
        />

        {payslipRun ? (
          <div className="rounded border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-[12px] leading-snug text-indigo-950">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>
                批次 {payslipRun.run_no}
                {payslipRun.locked_at ? ` · 锁定 ${new Date(payslipRun.locked_at).toLocaleString('zh-CN')}` : null}
              </span>
              {activeSiVersion ? (
                <Badge className="h-6 border-indigo-200 bg-white px-2 text-[12px] text-indigo-800">
                  社保规则 {activeSiVersion.id}（{activeSiVersion.effective_from}
                  {activeSiVersion.effective_to ? ` → ${activeSiVersion.effective_to}` : ' 起长期有效'}）
                </Badge>
              ) : null}
              {payslipRun.payroll_tax_policy_version_id ? (
                <Badge className="h-6 border-slate-200 bg-white px-2 text-[12px] text-slate-700">
                  个税政策 {payslipRun.payroll_tax_policy_version_id}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-indigo-900/80">
              主表为汇总；点击「分项快照」查看已冻结的 mf_payslip_lines（基数 / 适用比例引用 / 金额）。新版本方案只作用于<strong>未锁定</strong>的新批次。
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50/60 px-2 py-1.5">
          <div className="relative w-[280px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索员工 / 工号 / 部门..."
              className="h-9 pl-8 text-[13px]"
            />
          </div>
          <div className="flex-1" />
          <Badge className="h-7 border-indigo-200 bg-white px-2.5 text-[12px] text-indigo-800">
            <Users className="mr-1 h-3 w-3" /> {filtered.length} 名员工
          </Badge>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">员工</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">部门</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">基本工资</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">加班</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">奖金</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">提成</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">应发</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">社保(个)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">公积金(个)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">个税</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">实发</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">代发账户</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell className="py-2.5 text-[13px]">
                    <div className="font-medium text-slate-800">{p.employee_name}</div>
                    <div className="text-[12px] text-slate-400">{p.employee_no}</div>
                  </TableCell>
                  <TableCell className="py-2.5 text-[13px] text-slate-700">{p.department_name ?? '—'}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums">{p.base_salary.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.overtime_pay || '—'}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.bonus || '—'}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-600">{p.commission || '—'}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] font-semibold tabular-nums text-slate-900">{p.gross_pay.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-rose-600">-{p.social_insurance_employee.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-rose-600">-{p.housing_fund_employee.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-rose-600">-{p.income_tax.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] font-bold tabular-nums text-emerald-600">{p.net_pay.toLocaleString()}</TableCell>
                  <TableCell className="py-2 text-[12px] text-slate-500">
                    <div>{p.bank_name}</div>
                    <div className="text-slate-400">{p.bank_account}</div>
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-[12px]" onClick={() => setDetailPayslip(p)}>
                      分项快照
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded border border-indigo-200 bg-indigo-50/50 p-3 text-[12px] text-indigo-900">
            <div className="flex items-center gap-1.5 font-semibold">
              <Banknote className="h-3.5 w-3.5" /> 自动凭证（计提）
            </div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] leading-snug text-indigo-900/90">
{`借：管理费用 - 工资                      ${(payslipRun?.total_gross ?? 0).toLocaleString()}
    管理费用 - 社保 (公司)                ${((payslipRun?.total_si ?? 0) * 0.72).toFixed(0)}
    管理费用 - 公积金 (公司)              ${((payslipRun?.total_hf ?? 0) * 0.5).toFixed(0)}
  贷：应付职工薪酬                          ${(payslipRun?.total_gross ?? 0).toLocaleString()}
      其他应付款 - 社保 / 公积金             ${(((payslipRun?.total_si ?? 0) + (payslipRun?.total_hf ?? 0)) * 1.0).toFixed(0)}`}
            </pre>
            <p className="mt-1 text-[12px] text-indigo-900/70">
              基于 <code className="rounded bg-white px-1">mf_voucher_rules.event_type='payroll.run'</code> 模板生成；
              科目/借贷方向取自 <code className="rounded bg-white px-1">mf_accounts</code>。
            </p>
          </div>

          <div className="rounded border border-emerald-200 bg-emerald-50/50 p-3 text-[12px] text-emerald-900">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> 自动凭证（发放）
            </div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] leading-snug text-emerald-900/90">
{`借：应付职工薪酬                          ${(payslipRun?.total_gross ?? 0).toLocaleString()}
  贷：银行存款                              ${(payslipRun?.total_net ?? 0).toLocaleString()}
      应交税费 - 应交个人所得税              ${(payslipRun?.total_tax ?? 0).toLocaleString()}
      其他应付款 - 社保 / 公积金 (个人代扣)`}
            </pre>
            <p className="mt-1 text-[12px] text-emerald-900/70">
              点击&quot;入账并锁期&quot;后由 <code className="rounded bg-white px-1">mf_post_voucher</code> 落账并写入 <code className="rounded bg-white px-1">mf_audit_logs</code>。
            </p>
          </div>
        </div>
      </div>

      <Sheet open={!!detailPayslip} onOpenChange={(o) => !o && setDetailPayslip(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-[15px]">
              工资分项快照 · {detailPayslip?.employee_name}{' '}
              <span className="text-[13px] font-normal text-slate-500">{detailPayslip?.employee_no}</span>
            </SheetTitle>
            <SheetDescription className="text-left text-[12px] leading-relaxed">
              {payslipRun ? (
                <>
                  批次 <code className="rounded bg-slate-100 px-1">{payslipRun.run_no}</code> ·{' '}
                  {payslipRun.period_year}-{String(payslipRun.period_month).padStart(2, '0')}
                  <br />
                  组织快照：{detailPayslip?.snapshot_department_name ?? detailPayslip?.department_name ?? '—'} · 成本中心{' '}
                  {detailPayslip?.snapshot_cost_center_code ?? '—'}
                  <br />
                  以下为入账时写入的 <strong>mf_payslip_lines</strong>，后续若政策表调整不会回算改行。
                </>
              ) : (
                '未匹配到当期算薪批次，仍展示已加载的分项行（演示）。'
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {(['earning', 'deduction', 'employer_cost'] as const).map((cat) => {
              const rows = groupedDetail[cat];
              if (rows.length === 0) return null;
              return (
                <div key={cat} className="rounded border border-slate-200">
                  <div
                    className={`border-b border-slate-200 px-3 py-2 text-[12px] font-semibold ${
                      cat === 'employer_cost' ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-800'
                    }`}
                  >
                    {LINE_CAT_LABEL[cat]}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-[12px]">项目</TableHead>
                        <TableHead className="h-9 text-right text-[12px]">金额</TableHead>
                        <TableHead className="h-9 text-[12px]">基数 / 比例 / 规则</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="py-2 text-[13px]">
                            <div className="font-medium text-slate-800">{row.label}</div>
                            <div className="text-[11px] text-slate-400">{row.code}</div>
                            {row.memo ? <div className="mt-0.5 text-[12px] text-slate-500">{row.memo}</div> : null}
                          </TableCell>
                          <TableCell
                            className={`py-2 text-right text-[13px] tabular-nums ${
                              cat === 'earning'
                                ? 'text-slate-900'
                                : cat === 'deduction'
                                  ? 'text-rose-600'
                                  : 'text-amber-800'
                            }`}
                          >
                            {cat === 'deduction' ? '-' : ''}
                            {row.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-2 text-[12px] text-slate-600">
                            {row.applied_base != null ? (
                              <div>基数 {row.applied_base.toLocaleString()}</div>
                            ) : (
                              <div>基数 —</div>
                            )}
                            {row.rate_pct != null ? <div>比例 {row.rate_pct}%</div> : null}
                            {row.scheme_version_id ? (
                              <div className="text-[11px] text-slate-400">方案 {row.scheme_version_id}</div>
                            ) : null}
                            {row.rule_effective_from ? (
                              <div className="text-[11px] text-slate-400">rule ≥ {row.rule_effective_from}</div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}

            {detailPayslip ? (
              <div className="rounded border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-[12px] text-emerald-900">
                <div className="font-semibold">与主表勾稽</div>
                <div className="mt-1 tabular-nums">
                  应发 {detailPayslip.gross_pay.toLocaleString()} · 实发 {detailPayslip.net_pay.toLocaleString()}
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
