import React, { useMemo } from 'react';
import { Building, Shield, ShieldCheck } from 'lucide-react';
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
import { formatMoney } from '../components/MfCurrency';
import { useManagementFinance } from '../context/ManagementFinanceContext';

export function SocialInsuranceModule() {
  const { siRecords, period, payslipRun, siSchemeVersions } = useManagementFinance();

  const activeSiVersion = useMemo(() => {
    if (!payslipRun) return null;
    const anchor = `${payslipRun.period_year}-${String(payslipRun.period_month).padStart(2, '0')}-01`;
    return (
      siSchemeVersions.find(
        (v) => v.effective_from <= anchor && (!v.effective_to || v.effective_to >= anchor),
      ) ?? siSchemeVersions.find((v) => v.id === payslipRun.si_scheme_version_id) ?? null
    );
  }, [payslipRun, siSchemeVersions]);

  const totals = useMemo(() => {
    return siRecords.reduce(
      (acc, r) => {
        acc.pensionC += r.pension_company;
        acc.pensionE += r.pension_employee;
        acc.medicalC += r.medical_company;
        acc.medicalE += r.medical_employee;
        acc.uempC += r.unemployment_company;
        acc.uempE += r.unemployment_employee;
        acc.injuryC += r.injury_company;
        acc.maternityC += r.maternity_company;
        acc.hfC += r.housing_fund_company;
        acc.hfE += r.housing_fund_employee;
        return acc;
      },
      {
        pensionC: 0, pensionE: 0,
        medicalC: 0, medicalE: 0,
        uempC: 0, uempE: 0,
        injuryC: 0, maternityC: 0,
        hfC: 0, hfE: 0,
      },
    );
  }, [siRecords]);

  const companyTotal =
    totals.pensionC + totals.medicalC + totals.uempC + totals.injuryC + totals.maternityC + totals.hfC;
  const employeeTotal =
    totals.pensionE + totals.medicalE + totals.uempE + totals.hfE;

  return (
    <div>
      <MfModuleHeader
        title="社保 / 公积金 / 个税"
        subtitle={`${period.year} 年 ${period.month} 月 · 与工资批次「${payslipRun?.run_no ?? '—'}」同一归属期 · 台账分项已快照 · 方案引用 ${activeSiVersion?.id ?? payslipRun?.si_scheme_version_id ?? '—'}`}
        badge={<Badge className="h-7 border-blue-200 bg-blue-50 px-2.5 text-[12px] text-blue-700">SI Scheme: SZ-2026</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
              <Building className="h-3 w-3" /> 切换城市方案
            </Button>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 text-[13px] hover:bg-indigo-500">
              <ShieldCheck className="h-3 w-3" /> 申报 / 核销
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-3">
        <MfStatStrip
          items={[
            { id: 'count',   label: '参保人数',  value: `${siRecords.length}`, sub: '深圳方案' },
            { id: 'compc',   label: '公司缴费',  value: formatMoney(companyTotal, 'CNY', { compact: true, decimals: 0 }), sub: '社保 + 公积金', tone: 'warn' },
            { id: 'empc',    label: '个人代扣',  value: formatMoney(employeeTotal, 'CNY', { compact: true, decimals: 0 }), sub: '工资条扣除', tone: 'info' },
            { id: 'pension', label: '养老',      value: formatMoney(totals.pensionC + totals.pensionE, 'CNY', { compact: true, decimals: 0 }), sub: '16% + 8%' },
            { id: 'medical', label: '医疗',      value: formatMoney(totals.medicalC + totals.medicalE, 'CNY', { compact: true, decimals: 0 }), sub: '10% + 2%' },
            { id: 'hf',      label: '公积金',    value: formatMoney(totals.hfC + totals.hfE, 'CNY', { compact: true, decimals: 0 }), sub: '12% + 12%' },
          ]}
        />

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">员工</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">社保基数</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">公积金基数</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">养老(公司/个)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">医疗(公司/个)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">失业(公司/个)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">工伤(公司)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">生育(公司)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">公积金(公司/个)</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">公司合计</TableHead>
                <TableHead className="h-10 text-right text-[12px] font-semibold text-slate-800">个人合计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50">
                  <TableCell className="py-2.5 text-[13px] font-medium text-slate-800">{r.employee_name ?? r.employee_id}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.si_base?.toLocaleString() ?? '—'}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.hf_base?.toLocaleString() ?? '—'}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.pension_company.toLocaleString()} / {r.pension_employee.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.medical_company.toLocaleString()} / {r.medical_employee.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.unemployment_company.toLocaleString()} / {r.unemployment_employee.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.injury_company.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.maternity_company.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-slate-700">{r.housing_fund_company.toLocaleString()} / {r.housing_fund_employee.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] font-semibold tabular-nums text-amber-700">{r.total_company.toLocaleString()}</TableCell>
                  <TableCell className="py-2.5 text-right text-[13px] font-semibold tabular-nums text-indigo-700">{r.total_employee.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50/40 p-3 text-[12px] text-blue-900">
          <div className="flex items-center gap-1.5 font-semibold">
            <Shield className="h-3.5 w-3.5" /> 自动凭证（计提 + 申报）
          </div>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] leading-snug text-blue-900/90">
{`借：管理费用 - 社保(公司)                 ${(totals.pensionC + totals.medicalC + totals.uempC + totals.injuryC + totals.maternityC).toLocaleString()}
    管理费用 - 公积金(公司)               ${totals.hfC.toLocaleString()}
  贷：其他应付款 - 社保(公司)               ${(totals.pensionC + totals.medicalC + totals.uempC + totals.injuryC + totals.maternityC).toLocaleString()}
      其他应付款 - 公积金(公司)             ${totals.hfC.toLocaleString()}

申报扣款（个人部分由工资代扣，月末统一申报）：
借：其他应付款 - 社保(公司+个人) / 公积金(公司+个人)
  贷：银行存款`}
          </pre>
        </div>
      </div>
    </div>
  );
}
