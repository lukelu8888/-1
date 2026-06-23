import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Hash, Plus, RefreshCw, RotateCcw, Save, Search } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../hooks/useAuth';
import { auditLogService } from '../../lib/services/auditLogService';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type SequenceRow = {
  id: string;
  doc_type: string;
  scope_type: string;
  scope_id: string;
  prefix?: string | null;
  region_code?: string | null;
  date_key?: string | null;
  updated_at?: string | null;
  current_value: number;
  current_seq: number;
};

type CreateFormState = {
  docType: string;
  scopeType: string;
  scopeId: string;
  regionCode: string;
  prefix: string;
  dateKey: string;
  nextNumber: string;
};

type NumberingAuditRow = {
  id: string;
  entity_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  occurred_at: string;
  changed_fields: any;
};

type NumberingRuleTemplate = {
  docType: string;
  scopeType: string;
  pattern: string;
  resetPolicy: string;
  allowLowering: boolean;
  note: string;
};

const DOC_TYPE_OPTIONS = ['ING', 'QR', 'QT', 'SC', 'CI', 'PL', 'YS', 'SK', 'XJ', 'BJ', 'CG', 'PR', 'PO', 'SO'];
const SCOPE_TYPE_OPTIONS = ['region', 'global', 'customer', 'custom'];
const REGION_OPTIONS = ['NA', 'SA', 'EA', 'GLOBAL', 'UNKNOWN'];
const DEFAULT_COUNTER_PRESETS = [
  { docType: 'ING', scopeType: 'region', scopeId: 'NA', regionCode: 'NA', prefix: 'ING', nextNumber: 1 },
  { docType: 'ING', scopeType: 'region', scopeId: 'SA', regionCode: 'SA', prefix: 'ING', nextNumber: 1 },
  { docType: 'ING', scopeType: 'region', scopeId: 'EA', regionCode: 'EA', prefix: 'ING', nextNumber: 1 },
  { docType: 'QR', scopeType: 'region', scopeId: 'NA', regionCode: 'NA', prefix: 'QR', nextNumber: 1 },
  { docType: 'QR', scopeType: 'region', scopeId: 'SA', regionCode: 'SA', prefix: 'QR', nextNumber: 1 },
  { docType: 'QR', scopeType: 'region', scopeId: 'EA', regionCode: 'EA', prefix: 'QR', nextNumber: 1 },
  { docType: 'QT', scopeType: 'region', scopeId: 'NA', regionCode: 'NA', prefix: 'QT', nextNumber: 1 },
  { docType: 'QT', scopeType: 'region', scopeId: 'SA', regionCode: 'SA', prefix: 'QT', nextNumber: 1 },
  { docType: 'QT', scopeType: 'region', scopeId: 'EA', regionCode: 'EA', prefix: 'QT', nextNumber: 1 },
  { docType: 'SC', scopeType: 'region', scopeId: 'NA', regionCode: 'NA', prefix: 'SC', nextNumber: 1 },
  { docType: 'SC', scopeType: 'region', scopeId: 'SA', regionCode: 'SA', prefix: 'SC', nextNumber: 1 },
  { docType: 'SC', scopeType: 'region', scopeId: 'EA', regionCode: 'EA', prefix: 'SC', nextNumber: 1 },
  { docType: 'CI', scopeType: 'region', scopeId: 'NA', regionCode: 'NA', prefix: 'CI', nextNumber: 1 },
  { docType: 'PL', scopeType: 'region', scopeId: 'NA', regionCode: 'NA', prefix: 'PL', nextNumber: 1 },
];
const NUMBERING_RULE_TEMPLATES: NumberingRuleTemplate[] = [
  {
    docType: 'ING',
    scopeType: 'region',
    pattern: 'ING-{REGION}-{YYMMDD}-{SEQ}',
    resetPolicy: 'Region-global sequence, date shown only',
    allowLowering: false,
    note: 'ING will compare against historical max suffix. Lowering is blocked in UI.',
  },
  {
    docType: 'QR',
    scopeType: 'region',
    pattern: 'QR-{REGION}-{YYMMDD}-{XXXX}',
    resetPolicy: 'Region counter managed in number_sequences',
    allowLowering: true,
    note: 'Can be preset during go-live or adjusted when no conflicting live documents exist.',
  },
  {
    docType: 'QT',
    scopeType: 'region',
    pattern: 'QT-{REGION}-{YYMMDD}-{XXXX}',
    resetPolicy: 'Region counter managed in number_sequences',
    allowLowering: true,
    note: 'Recommended to adjust only before production traffic or after reconciliation.',
  },
  {
    docType: 'SC',
    scopeType: 'region',
    pattern: 'SC-{REGION}-{YYMMDD}-{XXXX}',
    resetPolicy: 'Region counter managed in number_sequences',
    allowLowering: true,
    note: 'Contracts should normally only move forward; lowering is allowed but operationally sensitive.',
  },
  {
    docType: 'CI',
    scopeType: 'region',
    pattern: 'CI-{REGION}-{YYMMDD}-{XXXX}',
    resetPolicy: 'Region counter managed in number_sequences',
    allowLowering: true,
    note: 'Usually initialized once per region and then maintained upward.',
  },
  {
    docType: 'PL',
    scopeType: 'region',
    pattern: 'PL-{REGION}-{YYMMDD}-{XXXX}',
    resetPolicy: 'Region counter managed in number_sequences',
    allowLowering: true,
    note: 'Packing list counters follow document center sequence rules.',
  },
];

const toDateKey = (date = new Date()) =>
  `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

const inferCurrentValue = (row: Record<string, any>) => {
  const raw = row.current_value ?? row.current_seq ?? row.last_seq ?? 0;
  return Number.isFinite(Number(raw)) ? Number(raw) : 0;
};

const normalizeSequenceRow = (row: Record<string, any>): SequenceRow => {
  const currentValue = inferCurrentValue(row);
  const currentSeq = Number.isFinite(Number(row.current_seq)) ? Number(row.current_seq) : currentValue;

  return {
    id: String(row.id),
    doc_type: String(row.doc_type ?? ''),
    scope_type: String(row.scope_type ?? ''),
    scope_id: String(row.scope_id ?? ''),
    prefix: row.prefix ?? null,
    region_code: row.region_code ?? null,
    date_key: row.date_key ?? null,
    updated_at: row.updated_at ?? null,
    current_value: currentValue,
    current_seq: currentSeq,
  };
};

const buildDefaultCreateForm = (): CreateFormState => ({
  docType: 'ING',
  scopeType: 'region',
  scopeId: 'NA',
  regionCode: 'NA',
  prefix: 'ING',
  dateKey: toDateKey(),
  nextNumber: '1',
});

const buildDefaultScopeId = (docType: string, scopeType: string, regionCode: string) => {
  if (scopeType === 'region') {
    return regionCode || 'NA';
  }
  if (scopeType === 'global') {
    return 'GLOBAL';
  }
  if (scopeType === 'customer') {
    return 'CUSTOMER';
  }
  return `${docType}-${regionCode || 'NA'}`;
};

const getRuleTemplate = (docType: string) =>
  NUMBERING_RULE_TEMPLATES.find((rule) => rule.docType === docType) ?? null;

const requestAuditReason = (actionLabel: string) => {
  const reason = window.prompt(`${actionLabel}\n\nPlease enter the reason for this numbering change:`, '');
  const normalized = String(reason || '').trim();
  if (!normalized) {
    toast.error('A reason is required for numbering changes in production.');
    return null;
  }
  return normalized;
};

export default function DocumentNumberingCenter() {
  const { currentUser } = useAuth();
  const canManageNumbering = currentUser?.role === 'Admin';
  const hasAuditViewerAccess = currentUser?.role === 'Admin' || currentUser?.role === 'CEO' || currentUser?.role === 'CFO';
  const [rows, setRows] = useState<SequenceRow[]>([]);
  const [audits, setAudits] = useState<NumberingAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [nextValues, setNextValues] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState<CreateFormState>(buildDefaultCreateForm);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSequences = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from('number_sequences')
      .select('*')
      .order('doc_type', { ascending: true })
      .order('scope_type', { ascending: true })
      .order('scope_id', { ascending: true });

    if (error) {
      setRows([]);
      setNextValues({});
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((row) => normalizeSequenceRow(row as Record<string, any>));
    setRows(normalized);
    setNextValues(
      normalized.reduce<Record<string, string>>((acc, row) => {
        acc[row.id] = String(row.current_value + 1);
        return acc;
      }, {}),
    );
    setLoading(false);
  }, []);

  const loadAudits = useCallback(async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, entity_id, actor_email, actor_role, action, occurred_at, changed_fields')
      .eq('entity_type', 'number_sequence')
      .order('occurred_at', { ascending: false })
      .limit(12);

    if (error) {
      setAudits([]);
      return;
    }

    setAudits((data ?? []) as NumberingAuditRow[]);
  }, []);

  useEffect(() => {
    void loadSequences();
    void loadAudits();
  }, [loadAudits, loadSequences]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (docTypeFilter !== 'all' && row.doc_type !== docTypeFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return [
        row.doc_type,
        row.scope_type,
        row.scope_id,
        row.region_code ?? '',
        row.prefix ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [docTypeFilter, rows, search]);

  const summary = useMemo(() => {
    const docTypes = new Set(rows.map((row) => row.doc_type)).size;
    const maxCurrent = rows.reduce((max, row) => Math.max(max, row.current_value), 0);
    return {
      rows: rows.length,
      docTypes,
      maxCurrent,
    };
  }, [rows]);

  const handleSaveNext = useCallback(
    async (row: SequenceRow, forcedNextValue?: string) => {
      if (!canManageNumbering) {
        toast.error('You have read-only access to numbering settings.');
        return;
      }

      const rawNextValue = forcedNextValue ?? nextValues[row.id] ?? String(row.current_value + 1);
      const parsedNext = Number.parseInt(rawNextValue, 10);
      const rule = getRuleTemplate(row.doc_type);

      if (!Number.isFinite(parsedNext) || parsedNext < 1) {
        toast.error('Next number must be a positive integer.');
        return;
      }

      if (rule && !rule.allowLowering && parsedNext <= row.current_value) {
        toast.error(`${row.doc_type} follows a protected forward-only rule. Please set a next number greater than ${row.current_value}.`);
        return;
      }

      const nextCurrentValue = parsedNext - 1;
      const confirmed = window.confirm(
        `Reset ${row.doc_type} / ${row.scope_id} so that the next generated number becomes ${parsedNext}?`,
      );
      if (!confirmed) {
        return;
      }
      const reason = requestAuditReason(`Update ${row.doc_type} / ${row.scope_id} to next number ${parsedNext}`);
      if (!reason) {
        return;
      }

      setSavingId(row.id);

      const payload: Record<string, any> = {
        current_value: nextCurrentValue,
        current_seq: nextCurrentValue,
        date_key: row.date_key || toDateKey(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('number_sequences').update(payload).eq('id', row.id);

      if (error) {
        toast.error(`Failed to update ${row.doc_type}: ${error.message}`);
        setSavingId(null);
        return;
      }

      await auditLogService.logEntityChange({
        entityType: 'number_sequence',
        entityId: row.id,
        action: 'update',
        before: {
          current_value: row.current_value,
          current_seq: row.current_seq,
          date_key: row.date_key,
          audit_reason: null,
        },
        after: {
          current_value: nextCurrentValue,
          current_seq: nextCurrentValue,
          date_key: payload.date_key,
          audit_reason: reason,
        },
        actor: {
          actorId: currentUser?.id ?? null,
          actorEmail: currentUser?.email ?? null,
          actorRole: currentUser?.role ?? null,
        },
        source: 'document-numbering-center',
      });

      toast.success(`Updated ${row.doc_type} / ${row.scope_id}. Next number is now ${parsedNext}.`);
      setSavingId(null);
      await loadSequences();
      await loadAudits();
    },
    [canManageNumbering, currentUser?.email, currentUser?.id, currentUser?.role, loadAudits, loadSequences, nextValues],
  );

  const handleResetToOne = useCallback(
    async (row: SequenceRow) => {
      setNextValues((prev) => ({ ...prev, [row.id]: '1' }));
      await handleSaveNext(row, '1');
    },
    [handleSaveNext],
  );

  const handleCreateCounter = useCallback(async () => {
    if (!canManageNumbering) {
      toast.error('You have read-only access to numbering settings.');
      return;
    }

    const nextNumber = Number.parseInt(createForm.nextNumber, 10);

    if (!createForm.docType || !createForm.scopeType || !createForm.scopeId) {
      toast.error('Please complete document type, scope type, and scope id.');
      return;
    }

    if (!Number.isFinite(nextNumber) || nextNumber < 1) {
      toast.error('Starting next number must be a positive integer.');
      return;
    }

    const reason = requestAuditReason(`Create counter ${createForm.docType} / ${createForm.scopeId} with next number ${nextNumber}`);
    if (!reason) {
      return;
    }

    setCreating(true);

    const payload: Record<string, any> = {
      doc_type: createForm.docType,
      scope_type: createForm.scopeType,
      scope_id: createForm.scopeId,
      prefix: createForm.prefix || createForm.docType,
      region_code: createForm.regionCode || null,
      date_key: createForm.dateKey || null,
      current_value: nextNumber - 1,
      current_seq: nextNumber - 1,
    };

      const { error } = await supabase.from('number_sequences').insert(payload);

      if (error) {
        toast.error(`Failed to create counter: ${error.message}`);
        setCreating(false);
        return;
      }

      const newEntityId = `${createForm.docType}:${createForm.scopeType}:${createForm.scopeId}`;
      await auditLogService.logEntityChange({
        entityType: 'number_sequence',
        entityId: newEntityId,
        action: 'create',
        before: null,
        after: {
          ...payload,
          audit_reason: reason,
        },
        actor: {
          actorId: currentUser?.id ?? null,
          actorEmail: currentUser?.email ?? null,
          actorRole: currentUser?.role ?? null,
        },
        source: 'document-numbering-center',
      });

      toast.success(`Created ${createForm.docType} counter. Next number starts from ${nextNumber}.`);
      setCreateForm(buildDefaultCreateForm());
      setCreating(false);
      await loadSequences();
      await loadAudits();
  }, [canManageNumbering, createForm, currentUser?.email, currentUser?.id, currentUser?.role, loadAudits, loadSequences]);

  const handleApplyPresets = useCallback(async () => {
    if (!canManageNumbering) {
      toast.error('You have read-only access to numbering settings.');
      return;
    }

    const existingKeys = new Set(rows.map((row) => `${row.doc_type}:${row.scope_type}:${row.scope_id}`));
    const missingPresets = DEFAULT_COUNTER_PRESETS.filter(
      (preset) => !existingKeys.has(`${preset.docType}:${preset.scopeType}:${preset.scopeId}`),
    );

    if (missingPresets.length === 0) {
      toast.success('All default numbering presets already exist.');
      return;
    }

    const confirmed = window.confirm(`Create ${missingPresets.length} missing default counters now?`);
    if (!confirmed) {
      return;
    }
    const reason = requestAuditReason(`Initialize ${missingPresets.length} default numbering counters`);
    if (!reason) {
      return;
    }

    setPresetLoading(true);

    const payload = missingPresets.map((preset) => ({
      doc_type: preset.docType,
      scope_type: preset.scopeType,
      scope_id: preset.scopeId,
      prefix: preset.prefix,
      region_code: preset.regionCode,
      date_key: toDateKey(),
      current_value: preset.nextNumber - 1,
      current_seq: preset.nextNumber - 1,
    }));

    const { error } = await supabase.from('number_sequences').insert(payload);

    if (error) {
      toast.error(`Failed to apply presets: ${error.message}`);
      setPresetLoading(false);
      return;
    }

    await Promise.all(
      payload.map((item) =>
        auditLogService.logEntityChange({
          entityType: 'number_sequence',
          entityId: `${item.doc_type}:${item.scope_type}:${item.scope_id}`,
          action: 'create',
          before: null,
          after: {
            ...item,
            audit_reason: reason,
          },
          actor: {
            actorId: currentUser?.id ?? null,
            actorEmail: currentUser?.email ?? null,
            actorRole: currentUser?.role ?? null,
          },
          source: 'document-numbering-center:preset',
        }),
      ),
    );

    toast.success(`Created ${missingPresets.length} default counters.`);
    setPresetLoading(false);
    await loadSequences();
    await loadAudits();
  }, [canManageNumbering, currentUser?.email, currentUser?.id, currentUser?.role, loadAudits, loadSequences, rows]);

  const docTypeOptions = useMemo(() => {
    const dynamic = Array.from(new Set(rows.map((row) => row.doc_type))).filter(Boolean);
    return Array.from(new Set([...DOC_TYPE_OPTIONS, ...dynamic])).sort();
  }, [rows]);

  const canLowerBeIgnored = (row: SequenceRow) =>
    row.doc_type === 'ING' && row.scope_type === 'region';

  const isLoweringBlocked = (row: SequenceRow, nextValue: string) => {
    const parsedNext = Number.parseInt(nextValue, 10);
    if (!Number.isFinite(parsedNext)) {
      return false;
    }
    const rule = getRuleTemplate(row.doc_type);
    if (!rule || rule.allowLowering) {
      return false;
    }
    return parsedNext <= row.current_value;
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-4 p-4 xl:space-y-5 xl:p-5">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-amber-50 p-5 xl:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600">
                  SYSTEM NUMBERING
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">编号管理中心</h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    先维护当前编号，再处理新增计数器；规则与审计放在下方辅助查看。
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                {!canManageNumbering && hasAuditViewerAccess && (
                  <Badge variant="outline" className="w-fit border-amber-300 bg-amber-50 text-amber-700">
                    Read Only
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleApplyPresets()}
                  disabled={!canManageNumbering || presetLoading || loading}
                  className="justify-start bg-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {presetLoading ? '初始化中...' : '初始化常用编号'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadSequences()}
                  disabled={loading}
                  className="justify-start bg-white"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Counters</div>
                <div className="mt-2 text-3xl font-semibold leading-none text-slate-900">{summary.rows}</div>
                <div className="mt-2 text-xs text-slate-500">已登记计数器</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Types</div>
                <div className="mt-2 text-3xl font-semibold leading-none text-slate-900">{summary.docTypes}</div>
                <div className="mt-2 text-xs text-slate-500">覆盖表单类型</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Peak Seq</div>
                <div className="mt-2 text-3xl font-semibold leading-none text-slate-900">{summary.maxCurrent}</div>
                <div className="mt-2 text-xs text-slate-500">当前最高序号</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-600">
              <span className="font-medium text-slate-900">使用逻辑：</span>
              先在下方主表筛选并调整已有计数器；只有缺少计数器时，再使用“新建计数器”补建。常用正式单据可用“初始化常用编号”一次补齐。
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">ING 特别提示</p>
                  <p className="text-[13px] leading-6">
                    ING 会参考历史已用最大尾号。把“下一号”调小，不一定会重新发出更小的编号。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4" />
              当前编号计数器
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="搜索表单类型、区域、scope"
                />
              </div>
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="全部表单类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部表单类型</SelectItem>
                  {docTypeOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              加载编号计数器失败：{loadError}
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-sm text-slate-500">正在加载编号计数器...</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">当前没有匹配的编号计数器。</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>计数器</TableHead>
                    <TableHead>当前 / 下一号</TableHead>
                    <TableHead>规则提示</TableHead>
                    <TableHead>最近更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="min-w-[260px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{row.doc_type}</span>
                            <Badge variant="outline">{row.scope_type}</Badge>
                            {row.region_code && <Badge variant="secondary">{row.region_code}</Badge>}
                          </div>
                          <div className="font-mono text-xs text-slate-500">{row.scope_id}</div>
                          <div className="text-xs text-slate-400">{row.prefix || row.doc_type}</div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[210px]">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                            <div className="text-[11px] text-slate-500">当前</div>
                            <div className="font-mono text-base font-semibold text-slate-900">{row.current_value}</div>
                          </div>
                          <div className="text-slate-300">→</div>
                          <div className="space-y-2">
                            <Input
                              value={nextValues[row.id] ?? String(row.current_value + 1)}
                              disabled={!canManageNumbering}
                              onChange={(event) =>
                                setNextValues((prev) => ({ ...prev, [row.id]: event.target.value }))
                              }
                              className="w-28 font-mono"
                            />
                            {isLoweringBlocked(row, nextValues[row.id] ?? String(row.current_value + 1)) && (
                              <div className="text-[11px] leading-4 text-red-600">
                                当前规则仅允许上调
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-2 text-[11px] leading-5">
                          {canLowerBeIgnored(row) ? (
                            <div className="text-amber-700">ING 参考历史最大尾号，往下改不一定生效。</div>
                          ) : (
                            <div className="text-slate-500">按当前计数器规则直接维护下一号。</div>
                          )}
                          {!getRuleTemplate(row.doc_type)?.allowLowering && (
                            <div className="text-red-600">此类型不可回退，只能向上调整。</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleResetToOne(row)}
                            disabled={!canManageNumbering || savingId === row.id || !getRuleTemplate(row.doc_type)?.allowLowering}
                          >
                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                            重置到 1
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSaveNext(row)}
                            disabled={!canManageNumbering || savingId === row.id || isLoweringBlocked(row, nextValues[row.id] ?? String(row.current_value + 1))}
                          >
                            <Save className="mr-2 h-3.5 w-3.5" />
                            {savingId === row.id ? '保存中...' : '保存'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            新建计数器
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-0 md:grid-cols-2">
          <div className="space-y-2">
            <Label>表单类型</Label>
            <Select
              value={createForm.docType}
              disabled={!canManageNumbering}
              onValueChange={(value) =>
                setCreateForm((prev) => ({
                  ...prev,
                  docType: value,
                  prefix: value,
                  scopeId: buildDefaultScopeId(value, prev.scopeType, prev.regionCode),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择表单类型" />
              </SelectTrigger>
              <SelectContent>
                {docTypeOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>范围类型</Label>
            <Select
              value={createForm.scopeType}
              disabled={!canManageNumbering}
              onValueChange={(value) =>
                setCreateForm((prev) => ({
                  ...prev,
                  scopeType: value,
                  scopeId: buildDefaultScopeId(prev.docType, value, prev.regionCode),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择范围类型" />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_TYPE_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>区域代码</Label>
            <Select
              value={createForm.regionCode}
              disabled={!canManageNumbering}
              onValueChange={(value) =>
                setCreateForm((prev) => ({
                  ...prev,
                  regionCode: value,
                  scopeId: prev.scopeType === 'region' ? value : prev.scopeId,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择区域代码" />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>下一号</Label>
            <Input
              value={createForm.nextNumber}
              disabled={!canManageNumbering}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, nextNumber: event.target.value }))}
              placeholder="例如 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Scope ID</Label>
            <Input
              value={createForm.scopeId}
              disabled={!canManageNumbering}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, scopeId: event.target.value }))}
              placeholder="例如 NA"
            />
          </div>

          <div className="space-y-2">
            <Label>前缀</Label>
            <Input
              value={createForm.prefix}
              disabled={!canManageNumbering}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, prefix: event.target.value.toUpperCase() }))}
              placeholder="例如 ING"
            />
          </div>

          <div className="space-y-2">
            <Label>Date Key</Label>
            <Input
              value={createForm.dateKey}
              disabled={!canManageNumbering}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, dateKey: event.target.value }))}
              placeholder="YYMMDD"
            />
          </div>

          <div className="flex items-end">
            <Button type="button" onClick={() => void handleCreateCounter()} disabled={!canManageNumbering || creating} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {creating ? '创建中...' : '创建计数器'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">规则摘要</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {NUMBERING_RULE_TEMPLATES.map((rule) => (
              <div key={`${rule.docType}:${rule.scopeType}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-slate-900">{rule.docType}</div>
                    <Badge variant="outline">{rule.scopeType}</Badge>
                  </div>
                  <Badge variant={rule.allowLowering ? 'outline' : 'destructive'}>
                    {rule.allowLowering ? '可调整' : '仅允许上调'}
                  </Badge>
                </div>
                <div className="mt-2 text-[12px] leading-5 text-slate-600">
                  <span className="font-mono text-slate-700">{rule.pattern}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  {rule.resetPolicy}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">最近编号变更审计</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {audits.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">暂无编号变更审计记录。</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>对象</TableHead>
                    <TableHead>变更内容</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(audit.occurred_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-900">{audit.actor_email || 'system'}</div>
                          <div className="text-xs text-slate-500">{audit.actor_role || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{audit.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{audit.entity_id}</TableCell>
                      <TableCell>
                        <pre className="max-w-[520px] overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-slate-100 p-3 text-[11px] leading-5 text-slate-700">
                          {JSON.stringify(audit.changed_fields ?? {}, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
