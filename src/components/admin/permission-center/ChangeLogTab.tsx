import React from 'react';
import type { PermissionChangeLog } from '../../../lib/services/permissionCenterService';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { History } from 'lucide-react';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <History className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

interface ChangeLogTabProps {
  logDateFrom: string;
  onLogDateFromChange: (value: string) => void;
  logDateTo: string;
  onLogDateToChange: (value: string) => void;
  logSearch: string;
  onLogSearchChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onExportLogs: () => void;
  filteredLogs: PermissionChangeLog[];
  logTypeLabel: Record<string, string>;
  formatDateTime: (value?: string) => string;
}

export function ChangeLogTab({
  logDateFrom,
  onLogDateFromChange,
  logDateTo,
  onLogDateToChange,
  logSearch,
  onLogSearchChange,
  onApplyFilters,
  onResetFilters,
  onExportLogs,
  filteredLogs,
  logTypeLabel,
  formatDateTime,
}: ChangeLogTabProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={logDateFrom}
            onChange={(event) => onLogDateFromChange(event.target.value)}
            className="w-40"
          />
          <span className="text-slate-400">至</span>
          <Input
            type="date"
            value={logDateTo}
            onChange={(event) => onLogDateToChange(event.target.value)}
            className="w-40"
          />
          <Input
            value={logSearch}
            onChange={(event) => onLogSearchChange(event.target.value)}
            className="w-72"
            placeholder="搜索操作人、变更类型或内容..."
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onApplyFilters}>过滤日志</Button>
          <Button variant="outline" onClick={onResetFilters}>
            重置过滤
          </Button>
          <Button variant="outline" onClick={onExportLogs} disabled={!filteredLogs.length}>
            <History className="mr-2 h-4 w-4" />
            导出审计报告
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
        <span>当前筛选结果：<span className="font-medium text-slate-700">{filteredLogs.length}</span></span>
        <span>日志来源：本地前端发布记录</span>
        <span>当前阶段仅用于核对权限配置变化，不作为最终数据库审计源。</span>
      </div>

      {filteredLogs.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-44">发生时间</TableHead>
                <TableHead className="w-52">操作人账号</TableHead>
                <TableHead className="w-44">变更类型</TableHead>
                <TableHead className="w-56">操作摘要</TableHead>
                <TableHead>变更详情说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.changedAt)}</TableCell>
                  <TableCell className="font-medium text-slate-900">{log.changedBy}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {logTypeLabel[log.type] || log.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{log.title}</TableCell>
                  <TableCell className="max-w-[420px] truncate text-slate-600" title={log.detail}>
                    {log.detail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            <div>日志保留本地发布记录，用于前端阶段审查与核对。</div>
            <div>当前结果 {filteredLogs.length} 条</div>
          </div>
        </>
      ) : (
        <EmptyState title="无操作日志" description="在当前选定的时间范围内没有权限变更操作记录。" />
      )}
    </div>
  );
}
