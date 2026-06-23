import React, { useMemo, useState } from 'react';
import { Database, FileDown, Filter, Search, ShieldCheck, User } from 'lucide-react';
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
import { MfModuleHeader } from '../components/MfModuleHeader';
import { useManagementFinance } from '../context/ManagementFinanceContext';

const MODULE_TONE: Record<string, string> = {
  voucher: 'bg-rose-50 text-rose-700',
  payroll: 'bg-blue-50 text-blue-700',
  asset: 'bg-amber-50 text-amber-700',
  expense: 'bg-emerald-50 text-emerald-700',
  budget: 'bg-purple-50 text-purple-700',
  ai: 'bg-indigo-50 text-indigo-700',
};

const ACTION_LABEL: Record<string, string> = {
  create: '创建',
  update: '更新',
  approve: '审批',
  submit: '提交',
  post: '落账',
  reverse: '冲销',
  export: '导出',
  run: '运行',
};

export function AuditLogModule() {
  const { auditLogs } = useManagementFinance();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return auditLogs.filter((l) => {
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(l.actor_email ?? '').toLowerCase().includes(q) &&
          !(l.entity_id ?? '').toLowerCase().includes(q) &&
          !(l.entity ?? '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, search, moduleFilter]);

  return (
    <div>
      <MfModuleHeader
        title="审计日志"
        subtitle="所有关键动作（创建 / 审批 / 落账 / 冲销 / 导出 / AI 运行）均通过 mf_audit_logs 写入。受 RLS 保护，不可前端伪造。"
        badge={<Badge className="h-7 border-rose-200 bg-rose-50 px-2.5 text-[12px] text-rose-700">ISO/IEC 27001 兼容</Badge>}
        actions={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]">
            <FileDown className="h-3 w-3" /> 导出审计快照
          </Button>
        }
      />

      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-700">
              <Database className="h-3 w-3 text-slate-400" /> 日志总数
            </div>
            <div className="mt-1 text-[16px] font-bold text-slate-900">{auditLogs.length}</div>
            <div className="text-[12px] text-slate-400">本次窗口</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-700">
              <User className="h-3 w-3 text-slate-400" /> 操作人
            </div>
            <div className="mt-1 text-[16px] font-bold text-slate-900">
              {new Set(auditLogs.map((l) => l.actor_email)).size}
            </div>
            <div className="text-[12px] text-slate-400">独立账号 / 系统</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-700">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> 落账
            </div>
            <div className="mt-1 text-[16px] font-bold text-emerald-700">
              {auditLogs.filter((l) => l.action === 'post').length}
            </div>
            <div className="text-[12px] text-slate-400">不可逆动作</div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-700">
              <ShieldCheck className="h-3 w-3 text-indigo-500" /> AI 调用
            </div>
            <div className="mt-1 text-[16px] font-bold text-indigo-700">
              {auditLogs.filter((l) => l.module === 'ai').length}
            </div>
            <div className="text-[12px] text-slate-400">自动入审</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50/60 px-2 py-1.5">
          <div className="relative w-[280px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索操作人 / 实体ID / 对象..."
              className="h-9 pl-8 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-1 text-[13px] text-slate-600">
            <Filter className="h-3 w-3" /> 模块
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="h-9 w-[130px] border-slate-200 bg-white text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部模块</SelectItem>
              <SelectItem value="voucher" className="text-xs">凭证</SelectItem>
              <SelectItem value="payroll" className="text-xs">工资</SelectItem>
              <SelectItem value="asset" className="text-xs">固定资产</SelectItem>
              <SelectItem value="expense" className="text-xs">费用</SelectItem>
              <SelectItem value="budget" className="text-xs">预算</SelectItem>
              <SelectItem value="ai" className="text-xs">AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">时间</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">模块</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">动作</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">实体 · ID</TableHead>
                <TableHead className="h-10 text-[12px] font-semibold text-slate-800">操作人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id} className="hover:bg-slate-50">
                  <TableCell className="py-2.5 text-[13px] tabular-nums text-slate-700">
                    {new Date(l.created_at).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className={`h-7 border-0 px-2.5 text-[12px] ${MODULE_TONE[l.module] ?? 'bg-slate-100 text-slate-600'}`}>
                      {l.module}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-[13px] font-medium text-slate-800">
                    {ACTION_LABEL[l.action] ?? l.action}
                  </TableCell>
                  <TableCell className="py-2.5 text-[13px]">
                    <div className="text-slate-700">{l.entity}</div>
                    <div className="text-[12px] text-slate-400">{l.entity_id}</div>
                  </TableCell>
                  <TableCell className="py-2.5 text-[13px] text-slate-600">{l.actor_email ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
