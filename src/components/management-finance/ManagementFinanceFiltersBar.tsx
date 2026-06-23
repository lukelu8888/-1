import React from 'react';
import { Building2, CalendarDays } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useManagementFinance } from './context/ManagementFinanceContext';

/** 公司内部管理财务：公司 / 会计期间选择与多币种提示（_shell 与各独立模块页共用） */
export function ManagementFinanceFiltersBar() {
  const { companies, companyId, setCompanyId, period, setPeriod } = useManagementFinance();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
        <Building2 className="h-4 w-4 text-slate-500" />
        公司
      </div>
      <Select value={companyId ?? ''} onValueChange={(v) => setCompanyId(v)}>
        <SelectTrigger className="h-9 w-[280px] border-slate-200 bg-slate-50 text-[13px]">
          <SelectValue placeholder="选择公司..." />
        </SelectTrigger>
        <SelectContent>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-[13px]">
              {c.code} · {c.name_cn}
              <span className="ml-2 text-[12px] text-slate-500">{c.base_currency}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
        <CalendarDays className="h-4 w-4 text-slate-500" />
        会计期间
      </div>
      <Select
        value={`${period.year}-${period.month}`}
        onValueChange={(v) => {
          const [y, m] = v.split('-').map(Number);
          setPeriod({ year: y, month: m });
        }}
      >
        <SelectTrigger className="h-9 w-[150px] border-slate-200 bg-slate-50 text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[2, 3, 4, 5].map((m) => (
            <SelectItem key={m} value={`2026-${m}`} className="text-[13px]">
              2026 年 {m} 月
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <Badge className="h-7 border-indigo-200 bg-indigo-50 px-2.5 text-[12px] text-indigo-800">
        多币种 USD / EUR / GBP / CNY / HKD
      </Badge>
      <Badge className="h-7 border-purple-200 bg-purple-50 px-2.5 text-[12px] text-purple-800">
        多租户 RLS 已启用
      </Badge>
    </div>
  );
}
