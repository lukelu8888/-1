import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Building2,
  Check,
  Copy,
  Eye,
  Globe,
  Lock,
  RefreshCcw,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { type ExternalPortalDirectoryEntry, externalPortalDirectoryService } from '../../../../lib/supabaseService';
import {
  clearPortalPasswordMirror,
  invalidatePortalPasswordMirror,
  listPortalPasswordMirrors,
  markPortalPasswordMirrorNotified,
  resyncPortalPasswordMirror,
  type ExternalPortalType,
  type PortalPasswordMirrorRecord,
} from '../../../../lib/portalPasswordMirror';
import { PreviewMetricCard, Section } from '../components';

type HubAccount = {
  id: string;
  portalType: ExternalPortalType;
  loginEmail: string;
  displayName: string;
  password: string;
  updatedAt: string;
  source: string;
  status: string;
  notifiedAt?: string;
  clearedAt?: string;
  hubId: string;
  organizationName: string;
  phone?: string;
  fromDirectoryOnly?: boolean;
};

type MappingHub = {
  id: string;
  hubName: string;
  hubCode: string;
  owner: string;
  region: string;
  riskCount: number;
  pendingNotifyCount: number;
  totalAccounts: number;
  customerCount: number;
  supplierCount: number;
  thirdPartyCount: number;
  latestSyncAt: string;
  primarySide: ExternalPortalType;
  accounts: HubAccount[];
};

export function ExternalPortalPasswordMirrorModule() {
  const [records, setRecords] = useState<PortalPasswordMirrorRecord[]>(() => listPortalPasswordMirrors());
  const [directoryEntries, setDirectoryEntries] = useState<ExternalPortalDirectoryEntry[]>([]);
  const [selectedHubId, setSelectedHubId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const reloadRecords = React.useCallback(() => {
    setRecords(listPortalPasswordMirrors());
  }, []);

  useEffect(() => {
    reloadRecords();
    const handleStorage = () => reloadRecords();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [reloadRecords]);

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      try {
        const entries = await externalPortalDirectoryService.listAll();
        if (cancelled) return;
        setDirectoryEntries(entries);
      } catch (error) {
        if (cancelled) return;
        console.warn('[ExternalPortalPasswordMirrorModule] directory fallback to local cache', error);
        const localFallback: ExternalPortalDirectoryEntry[] = [];
        try {
          const customerRaw = window.localStorage.getItem('cosun_customer_profile');
          const supplierRaw = window.localStorage.getItem('cosun_org_profile');
          if (customerRaw) {
            const customer = JSON.parse(customerRaw);
            if (customer?.email) {
              localFallback.push({
                id: 'local-customer-profile',
                email: String(customer.email).toLowerCase(),
                name: String(customer.contactPerson || customer.companyName || customer.email),
                portalRole: 'customer',
                company: String(customer.companyName || ''),
                phone: String(customer.phone || ''),
                region: '',
              });
            }
          }
          if (supplierRaw) {
            const supplier = JSON.parse(supplierRaw);
            if (supplier?.contactPerson || supplier?.name) {
              localFallback.push({
                id: 'local-supplier-profile',
                email: '',
                name: String(supplier.contactPerson || supplier.name || ''),
                portalRole: 'supplier',
                company: String(supplier.name || ''),
                phone: String(supplier.phone || ''),
                region: '',
              });
            }
          }
        } catch {
          // ignore malformed local cache
        }
        setDirectoryEntries(localFallback);
      }
    };

    void loadDirectory();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDemoMode = records.length === 0;

  const portalMeta: Record<ExternalPortalType, { label: string; description: string }> = {
    customer: { label: '客户侧账号池', description: '客户门户账号群' },
    supplier: { label: '供应商侧账号池', description: '供应商门户账号群' },
    third_party: { label: '第三方侧账号池', description: '服务商 / 协同机构账号群' },
  };

  const sourceLabelMap: Record<string, string> = {
    user_self_set: '用户自设',
    login_capture: '登录抓取',
    manual_sync: '人工重同步',
    directory_pending: '目录待建',
  };

  const statusMeta: Record<string, { label: string; className: string }> = {
    active: { label: '有效', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    notified: { label: '已通知', className: 'border-blue-200 bg-blue-50 text-blue-700' },
    invalid: { label: '已失效', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    cleared: { label: '已清除', className: 'border-slate-200 bg-slate-100 text-slate-500' },
    pending_sync: { label: '未建镜像', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-CN', { hour12: false });
  };

  const maskPassword = (password: string) => {
    if (!password) return '已清除';
    if (password.length <= 4) return password;
    return `${password.slice(0, 2)}••••${password.slice(-2)}`;
  };

  const extractOrganizationName = (record: PortalPasswordMirrorRecord) => {
    const emailDomain = String(record.loginEmail || '').split('@')[1] || '';
    const segments = emailDomain.split('.').filter(Boolean);
    if (segments.length > 1) return segments[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    if (segments.length === 1) return segments[0];
    return record.displayName || '未命名对象';
  };

  const buildHubKey = (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'hub';

  const effectiveRecords = useMemo(() => {
    if (!isDemoMode) return records;
    return [
      {
        id: 'demo-customer-home-depot-1',
        portalType: 'customer' as const,
        loginEmail: 'buyer.cn@homedepot.com',
        displayName: 'Home Depot CN Buyer',
        password: 'HdBuyer@2026',
        updatedAt: '2026-03-24T08:30:00.000Z',
        source: 'manual_sync' as const,
        status: 'notified' as const,
        notifiedAt: '2026-03-24T09:00:00.000Z',
      },
      {
        id: 'demo-customer-home-depot-2',
        portalType: 'customer' as const,
        loginEmail: 'qa.apac@homedepot.com',
        displayName: 'Home Depot APAC QA',
        password: 'HdQa@2026',
        updatedAt: '2026-03-23T04:20:00.000Z',
        source: 'login_capture' as const,
        status: 'active' as const,
      },
      {
        id: 'demo-supplier-home-depot-1',
        portalType: 'supplier' as const,
        loginEmail: 'fuzhou.plant01@cosun-supplier.com',
        displayName: 'Fuzhou Plant 01',
        password: 'Plant01@2026',
        updatedAt: '2026-03-24T07:10:00.000Z',
        source: 'user_self_set' as const,
        status: 'active' as const,
      },
      {
        id: 'demo-supplier-home-depot-2',
        portalType: 'supplier' as const,
        loginEmail: 'xiamen.plant02@cosun-supplier.com',
        displayName: 'Xiamen Plant 02',
        password: 'Plant02@2026',
        updatedAt: '2026-03-23T11:45:00.000Z',
        source: 'manual_sync' as const,
        status: 'invalid' as const,
      },
      {
        id: 'demo-third-home-depot-1',
        portalType: 'third_party' as const,
        loginEmail: 'ops@sgs-fuzhou.com',
        displayName: 'SGS Fuzhou Witness',
        password: 'SgsOps@2026',
        updatedAt: '2026-03-24T06:15:00.000Z',
        source: 'manual_sync' as const,
        status: 'active' as const,
      },
      {
        id: 'demo-customer-target-1',
        portalType: 'customer' as const,
        loginEmail: 'sourcing@target.com',
        displayName: 'Target Sourcing',
        password: 'Target@2026',
        updatedAt: '2026-03-22T03:10:00.000Z',
        source: 'user_self_set' as const,
        status: 'cleared' as const,
        clearedAt: '2026-03-23T02:30:00.000Z',
      },
      {
        id: 'demo-supplier-target-1',
        portalType: 'supplier' as const,
        loginEmail: 'ningbo.partner@cosun-supplier.com',
        displayName: 'Ningbo Partner',
        password: 'NbPartner@2026',
        updatedAt: '2026-03-21T09:40:00.000Z',
        source: 'login_capture' as const,
        status: 'notified' as const,
        notifiedAt: '2026-03-21T10:10:00.000Z',
      },
    ];
  }, [isDemoMode, records]);

  const hubs = useMemo<MappingHub[]>(() => {
    const grouped = new Map<string, HubAccount[]>();

    effectiveRecords.forEach((record) => {
      const organizationName = extractOrganizationName(record);
      const hubKey = buildHubKey(organizationName);
      const nextRecord: HubAccount = {
        ...record,
        hubId: hubKey,
        organizationName,
        fromDirectoryOnly: false,
      };
      const current = grouped.get(hubKey) || [];
      current.push(nextRecord);
      grouped.set(hubKey, current);
    });

    directoryEntries.forEach((entry) => {
      const baseName = String(entry.company || entry.name || entry.email || '').trim();
      if (!baseName) return;
      const hubId = buildHubKey(baseName);
      const current = grouped.get(hubId) || [];
      const normalizedEmail = String(entry.email || '').trim().toLowerCase();
      const existingAccount = current.find((account) => (
        account.portalType === entry.portalRole &&
        normalizedEmail &&
        String(account.loginEmail || '').trim().toLowerCase() === normalizedEmail
      ));
      if (existingAccount) return;

      current.push({
        id: `directory-${entry.portalRole}-${entry.id}`,
        portalType: entry.portalRole,
        loginEmail: normalizedEmail,
        displayName: String(entry.name || entry.company || entry.email || '未命名账号'),
        password: '',
        updatedAt: '',
        source: 'directory_pending',
        status: 'pending_sync',
        hubId,
        organizationName: baseName,
        phone: entry.phone || '',
        fromDirectoryOnly: true,
      });
      grouped.set(hubId, current);
    });

    return Array.from(grouped.entries())
      .map(([hubId, accounts]) => {
        const latestSyncAt = [...accounts]
          .sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())[0]?.updatedAt || '';
        const customerCount = accounts.filter((item) => item.portalType === 'customer').length;
        const supplierCount = accounts.filter((item) => item.portalType === 'supplier').length;
        const thirdPartyCount = accounts.filter((item) => item.portalType === 'third_party').length;
        const riskCount = accounts.filter((item) => item.status === 'invalid' || item.status === 'cleared').length;
        const pendingNotifyCount = accounts.filter((item) => item.status === 'active' || item.status === 'pending_sync').length;
        const primarySide = customerCount > 0 ? 'customer' : supplierCount > 0 ? 'supplier' : 'third_party';

        return {
          id: hubId,
          hubName: accounts[0]?.organizationName || '未命名中枢对象',
          hubCode: `HUB-${hubId.slice(0, 8).toUpperCase()}`,
          owner: primarySide === 'customer' ? '销售中台' : primarySide === 'supplier' ? '采购中台' : '协同服务中台',
          region: customerCount > 0 && supplierCount > 0 ? '跨侧协同' : primarySide === 'customer' ? '客户协同' : primarySide === 'supplier' ? '供应协同' : '第三方协同',
          riskCount,
          pendingNotifyCount,
          totalAccounts: accounts.length,
          customerCount,
          supplierCount,
          thirdPartyCount,
          latestSyncAt,
          primarySide,
          accounts: accounts.sort((left, right) => {
            const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
            const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
            if (rightTime !== leftTime) return rightTime - leftTime;
            return left.displayName.localeCompare(right.displayName, 'zh-CN');
          }),
        };
      })
      .sort((left, right) => {
        const rightTime = right.latestSyncAt ? new Date(right.latestSyncAt).getTime() : 0;
        const leftTime = left.latestSyncAt ? new Date(left.latestSyncAt).getTime() : 0;
        if (rightTime !== leftTime) return rightTime - leftTime;
        return left.hubName.localeCompare(right.hubName, 'zh-CN');
      });
  }, [directoryEntries, effectiveRecords]);

  useEffect(() => {
    if (!hubs.length) {
      setSelectedHubId('');
      return;
    }
    if (!selectedHubId || !hubs.some((hub) => hub.id === selectedHubId)) {
      setSelectedHubId(hubs[0].id);
    }
  }, [hubs, selectedHubId]);

  const selectedHub = hubs.find((hub) => hub.id === selectedHubId) || null;
  const selectedHubAccounts = selectedHub?.accounts || [];

  useEffect(() => {
    if (!selectedHubAccounts.length) {
      setSelectedAccountId('');
      return;
    }
    if (!selectedAccountId || !selectedHubAccounts.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId(selectedHubAccounts[0].id);
    }
  }, [selectedAccountId, selectedHubAccounts]);

  const selectedAccount = selectedHubAccounts.find((account) => account.id === selectedAccountId) || null;

  const getPoolAccounts = (portalType: ExternalPortalType) =>
    selectedHubAccounts.filter((account) => account.portalType === portalType);

  const summary = useMemo(() => ({
    hubCount: hubs.length,
    totalAccounts: hubs.reduce((sum, hub) => sum + hub.totalAccounts, 0),
    pendingNotifyCount: hubs.reduce((sum, hub) => sum + hub.pendingNotifyCount, 0),
    riskCount: hubs.reduce((sum, hub) => sum + hub.riskCount, 0),
  }), [hubs]);

  const handleCopyPassword = async (record: Pick<HubAccount, 'password'>) => {
    if (!record.password) {
      toast.info('该镜像已清除，无可复制密码');
      return;
    }
    try {
      await navigator.clipboard.writeText(record.password);
      toast.success('镜像密码已复制');
    } catch {
      toast.error('复制失败，请检查浏览器权限');
    }
  };

  const runRecordAction = (action: () => void, successMessage: string) => {
    if (isDemoMode) {
      toast.info('当前为示意结构，接入真实镜像数据后可执行操作');
      return;
    }
    if (selectedAccount?.fromDirectoryOnly) {
      toast.info('该账号仅存在于目录，尚未建立镜像，请先执行建镜像/同步');
      return;
    }
    action();
    reloadRecords();
    toast.success(successMessage);
  };

  const poolHeaderClass: Record<ExternalPortalType, string> = {
    customer: 'border-blue-200 bg-blue-50/70 text-blue-700',
    supplier: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    third_party: 'border-amber-200 bg-amber-50/70 text-amber-700',
  };

  return (
    <div className="space-y-5">
      <Section title="外部门户账号映射中心" titleEN="External Portal Account Mapping Hub" icon={<Globe className="w-3.5 h-3.5" />}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-800">以我方 ERP 中枢为主轴，统一拖拽客户侧 / 供应商侧 / 第三方侧账号池</p>
              {isDemoMode && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  结构示意
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              页面主语不再是“单条密码”，而是“我方侧主对象下面挂接的多外侧账号池”。适合一主拖多侧、多账号并行协同的 ERP 结构。
            </p>
          </div>
          <button
            type="button"
            onClick={reloadRecords}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            刷新镜像
          </button>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PreviewMetricCard label="中枢对象" value={summary.hubCount} hint="我方侧主对象数" accent="slate" />
        <PreviewMetricCard label="外侧账号" value={summary.totalAccounts} hint="客户 / 供应商 / 第三方合计" accent="blue" />
        <PreviewMetricCard label="待通知" value={summary.pendingNotifyCount} hint="已同步但仍待业务通知" accent="amber" />
        <PreviewMetricCard label="风险镜像" value={summary.riskCount} hint="失效 / 已清除 / 单侧异常" accent="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <Section title="我方侧中枢对象" titleEN="Hub Objects" icon={<Building2 className="w-3.5 h-3.5" />}>
          <div className="space-y-3">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => setSelectedHubId(hub.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  selectedHubId === hub.id
                    ? 'border-red-200 bg-red-50/70'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{hub.hubName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{hub.hubCode} · {hub.owner}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {hub.totalAccounts}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">客 {hub.customerCount}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">供 {hub.supplierCount}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">三 {hub.thirdPartyCount}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>待通知 {hub.pendingNotifyCount}</span>
                  <span>风险 {hub.riskCount}</span>
                </div>
              </button>
            ))}
            {hubs.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                暂无中枢对象
              </div>
            )}
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="中枢映射总览" titleEN="Hub Mapping Overview" icon={<Shield className="w-3.5 h-3.5" />}>
            {selectedHub ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                      我方侧 ERP 中枢
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800">{selectedHub.hubName}</span>
                    <span className="text-[11px] text-slate-400">{selectedHub.hubCode}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">中枢归属</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.owner}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">协同区域</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.region}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">最近同步</p>
                      <p className="mt-1 font-medium text-slate-800">{formatTimestamp(selectedHub.latestSyncAt)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">外侧挂接</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.totalAccounts} 个账号</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">一主拖多侧</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-white">{selectedHub.hubName}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">客户侧 {selectedHub.customerCount}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">供应商侧 {selectedHub.supplierCount}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-amber-700">第三方侧 {selectedHub.thirdPartyCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                选中一个我方侧中枢对象后，查看其拖挂的多外侧账号池。
              </div>
            )}
          </Section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {(Object.keys(portalMeta) as ExternalPortalType[]).map((portalType) => {
              const poolAccounts = getPoolAccounts(portalType);
              return (
                <Section key={portalType} title={portalMeta[portalType].label} titleEN="Account Pool" icon={<Users className="w-3.5 h-3.5" />}>
                  <div className={`rounded-xl border px-4 py-3 ${poolHeaderClass[portalType]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold">{portalMeta[portalType].label}</p>
                        <p className="mt-1 text-[11px] opacity-80">{portalMeta[portalType].description}</p>
                      </div>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold">{poolAccounts.length}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {poolAccounts.map((account) => {
                      const meta = statusMeta[account.status] || statusMeta.active;
                      return (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => setSelectedAccountId(account.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                            selectedAccountId === account.id
                              ? 'border-red-200 bg-red-50/50'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-slate-800">{account.displayName || account.loginEmail}</p>
                              <p className="mt-1 truncate text-[11px] text-slate-500">{account.loginEmail}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                            <span>密码 {maskPassword(account.password)}</span>
                            <span>来源 {sourceLabelMap[account.source] || account.source}</span>
                            <span>同步 {formatTimestamp(account.updatedAt)}</span>
                            <span>{account.status === 'pending_sync' ? '待建镜像' : account.notifiedAt ? `通知 ${formatTimestamp(account.notifiedAt)}` : '待通知'}</span>
                          </div>
                        </button>
                      );
                    })}
                    {poolAccounts.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                        当前中枢对象下暂无该侧账号
                      </div>
                    )}
                  </div>
                </Section>
              );
            })}
          </div>

          <Section title="选中账号详情" titleEN="Selected External Account" icon={<Eye className="w-3.5 h-3.5" />}>
            {selectedAccount ? (
              <div className="space-y-4 text-[12px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">账号映射</p>
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <span className="text-slate-400">我方侧中枢</span><span className="text-slate-800">{selectedHub?.hubName || '—'}</span>
                      <span className="text-slate-400">对象名称</span><span className="text-slate-800">{selectedAccount.displayName || '未命名'}</span>
                      <span className="text-slate-400">组织归属</span><span className="text-slate-800">{selectedAccount.organizationName}</span>
                      <span className="text-slate-400">账号池</span><span className="text-slate-800">{portalMeta[selectedAccount.portalType].label}</span>
                      <span className="text-slate-400">登录邮箱</span><span className="text-slate-800">{selectedAccount.loginEmail}</span>
                      <span className="text-slate-400">镜像密码</span><span className="font-mono text-slate-800">{selectedAccount.status === 'pending_sync' ? '尚未建立镜像' : (selectedAccount.password || '已清除')}</span>
                      <span className="text-slate-400">联系电话</span><span className="text-slate-800">{selectedAccount.phone || '—'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">同步与通知</p>
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <span className="text-slate-400">当前状态</span><span className="text-slate-800">{statusMeta[selectedAccount.status]?.label || selectedAccount.status}</span>
                      <span className="text-slate-400">同步来源</span><span className="text-slate-800">{sourceLabelMap[selectedAccount.source] || selectedAccount.source}</span>
                      <span className="text-slate-400">最近同步时间</span><span className="text-slate-800">{formatTimestamp(selectedAccount.updatedAt)}</span>
                      <span className="text-slate-400">最近通知时间</span><span className="text-slate-800">{formatTimestamp(selectedAccount.notifiedAt)}</span>
                      <span className="text-slate-400">清除时间</span><span className="text-slate-800">{formatTimestamp(selectedAccount.clearedAt)}</span>
                      <span className="text-slate-400">中枢建议动作</span><span className="text-slate-800">{selectedAccount.status === 'pending_sync' ? '先建镜像并同步首个凭证' : selectedAccount.status === 'active' ? '优先通知' : selectedAccount.status === 'invalid' ? '重新同步或更换账号' : '维持留痕'}</span>
                    </div>
                  </div>
                </div>

                {selectedAccount.fromDirectoryOnly ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-4 text-[12px] text-violet-800">
                    该账号已存在于外部门户目录，但尚未建立密码镜像。
                    建议下一步接入“建镜像 / 首次同步”动作，把目录账号转成可管理的镜像账号。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button type="button" onClick={() => void handleCopyPassword(selectedAccount)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                      <Copy className="h-3.5 w-3.5" />
                      复制密码
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => markPortalPasswordMirrorNotified(selectedAccount.id), '已标记为已通知')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                      <Check className="h-3.5 w-3.5" />
                      标记已通知
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => resyncPortalPasswordMirror(selectedAccount.id), '镜像已重新同步')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                      <RefreshCcw className="h-3.5 w-3.5" />
                      重新同步
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => invalidatePortalPasswordMirror(selectedAccount.id), '镜像已标记失效')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-[12px] font-medium text-amber-700 hover:bg-amber-50">
                      <Ban className="h-3.5 w-3.5" />
                      标记失效
                    </button>
                    <button type="button" onClick={() => runRecordAction(() => clearPortalPasswordMirror(selectedAccount.id), '镜像已清除')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                      清除镜像
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                选中某个外侧账号后，可执行单账号级通知 / 同步 / 清理操作。
              </div>
            )}
          </Section>

          <Section title="设计原则" titleEN="Why This Layout" icon={<Lock className="w-3.5 h-3.5" />}>
            <div className="space-y-3 text-[12px] leading-6 text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">1. 主语改成“我方侧中枢对象”</p>
                <p>先看我方侧拖挂了哪些外部对象，再看每个对象下面挂了哪些客户、供应商、第三方账号。</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">2. 从“单条密码”升级为“多账号池”</p>
                <p>客户侧、供应商侧、第三方侧都可能同时挂很多账号，所以必须按池管理，而不是切成三张孤立列表。</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">3. 操作分层</p>
                <p>中枢级看总览与风险，账号池级看挂接规模，单账号级执行复制、通知、同步、失效和清理。</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
