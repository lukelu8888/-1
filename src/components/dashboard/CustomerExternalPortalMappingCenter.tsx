import { useMemo, useState } from 'react';
import { Building2, Check, Copy, Eye, Globe, Lock, RefreshCcw, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerMasterDataCopy } from './customerEnterpriseMasterDataI18n';
import { CustomerMasterSection } from './customerEnterpriseMasterDataLayout';

type PortalType = 'customer' | 'supplier' | 'third-party';
type PortalStatus = 'active' | 'pending' | 'risk';

type ExternalAccount = {
  id: string;
  portalType: PortalType;
  displayName: string;
  organizationName: string;
  loginEmail: string;
  phone: string;
  password: string;
  source: string;
  status: PortalStatus;
  notifiedAt: string;
  updatedAt: string;
};

type HubObject = {
  id: string;
  hubName: string;
  hubCode: string;
  owner: string;
  region: string;
  accounts: ExternalAccount[];
};

const HUBS: HubObject[] = [
  {
    id: 'hub-customer-enterprise',
    hubName: 'Customer Enterprise Hub',
    hubCode: 'CUS-HUB-001',
    owner: 'Customer Master Data',
    region: 'Global',
    accounts: [
      {
        id: 'customer-main',
        portalType: 'customer',
        displayName: 'Primary Customer Login',
        organizationName: 'Customer Enterprise',
        loginEmail: 'portal@customer-enterprise.com',
        phone: '+1 555 231 8899',
        password: 'Cus#Portal2026',
        source: 'ERP Mirror',
        status: 'active',
        notifiedAt: '2026-03-22',
        updatedAt: '2026-03-25',
      },
      {
        id: 'supplier-linked',
        portalType: 'supplier',
        displayName: 'Supplier Finance Route',
        organizationName: 'Partner Supplier',
        loginEmail: 'finance@supplier-link.com',
        phone: '+86 591 8888 0001',
        password: 'Supp#Bridge88',
        source: 'Shared Access',
        status: 'pending',
        notifiedAt: '',
        updatedAt: '2026-03-24',
      },
      {
        id: 'third-party-qc',
        portalType: 'third-party',
        displayName: 'QC Service Account',
        organizationName: 'Third Party Service',
        loginEmail: 'qc@thirdparty-service.com',
        phone: '+55 21 4000 2000',
        password: 'QC#Mirror661',
        source: 'External Mapping',
        status: 'risk',
        notifiedAt: '2026-03-20',
        updatedAt: '2026-03-21',
      },
    ],
  },
];

const portalColorMap: Record<PortalType, string> = {
  customer: 'bg-blue-50 text-blue-700',
  supplier: 'bg-emerald-50 text-emerald-700',
  'third-party': 'bg-amber-50 text-amber-700',
};

const statusClassMap: Record<PortalStatus, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
};

const sourceLabelMap: Record<string, string> = {
  'ERP Mirror': 'ERP Mirror',
  'Shared Access': 'Shared Access',
  'External Mapping': 'External Mapping',
};

const recommendedActionMap: Record<PortalStatus, string> = {
  active: 'Notify mapped party and keep access available',
  pending: 'Notify the owner and complete first-time validation',
  risk: 'Re-sync or replace this account before it is used again',
};

export default function CustomerExternalPortalMappingCenter({
  copy,
  rtl = false,
}: {
  copy: CustomerMasterDataCopy['portal'];
  rtl?: boolean;
}) {
  const [selectedHubId, setSelectedHubId] = useState(HUBS[0]?.id || '');
  const [selectedAccountId, setSelectedAccountId] = useState(HUBS[0]?.accounts[0]?.id || '');

  const selectedHub = HUBS.find((hub) => hub.id === selectedHubId) || HUBS[0] || null;
  const selectedAccount = selectedHub?.accounts.find((account) => account.id === selectedAccountId) || selectedHub?.accounts[0] || null;

  const summary = useMemo(() => {
    const allAccounts = HUBS.flatMap((hub) => hub.accounts);
    return {
      hubs: HUBS.length,
      accounts: allAccounts.length,
      pending: allAccounts.filter((item) => item.status === 'pending').length,
      risk: allAccounts.filter((item) => item.status === 'risk').length,
    };
  }, []);

  const pools = useMemo(() => ({
    customer: selectedHub?.accounts.filter((account) => account.portalType === 'customer') || [],
    supplier: selectedHub?.accounts.filter((account) => account.portalType === 'supplier') || [],
    'third-party': selectedHub?.accounts.filter((account) => account.portalType === 'third-party') || [],
  }), [selectedHub]);

  const copyPassword = async () => {
    if (!selectedAccount) return;
    await navigator.clipboard.writeText(selectedAccount.password);
    toast.success(copy.actions.copyPassword);
  };

  const simulatePortalAction = (message: string) => {
    toast.success(message);
  };

  return (
    <div className="space-y-4" dir={rtl ? 'rtl' : 'ltr'}>
      <CustomerMasterSection title={copy.title} titleEN="External Portal Mapping Hub" icon={<Globe className="h-4 w-4" />}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-800">{copy.helperTitle}</p>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                {copy.demo}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">{copy.helperText}</p>
          </div>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCcw className="h-3.5 w-3.5" />
            {copy.refresh}
          </button>
        </div>
      </CustomerMasterSection>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          [copy.metrics.hubs, summary.hubs, copy.metrics.hubsHint],
          [copy.metrics.accounts, summary.accounts, copy.metrics.accountsHint],
          [copy.metrics.pending, summary.pending, copy.metrics.pendingHint],
          [copy.metrics.risk, summary.risk, copy.metrics.riskHint],
        ].map(([label, value, hint]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-800">{value}</p>
            <p className="mt-2 text-[12px] text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <CustomerMasterSection title={copy.sections.hubObjects} titleEN="Hub Objects" icon={<Building2 className="h-4 w-4" />}>
          <div className="space-y-3">
            {HUBS.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  setSelectedHubId(hub.id);
                  setSelectedAccountId(hub.accounts[0]?.id || '');
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  selectedHubId === hub.id ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{hub.hubName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{hub.hubCode} · {hub.owner}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {hub.accounts.length}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{copy.labels.customer} {hub.accounts.filter((item) => item.portalType === 'customer').length}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">{copy.labels.supplier} {hub.accounts.filter((item) => item.portalType === 'supplier').length}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{copy.labels.thirdParty} {hub.accounts.filter((item) => item.portalType === 'third-party').length}</span>
                </div>
              </button>
            ))}
          </div>
        </CustomerMasterSection>

        <div className="space-y-5">
          <CustomerMasterSection title={copy.sections.overview} titleEN="Hub Mapping Overview" icon={<Shield className="h-4 w-4" />}>
            {selectedHub ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                      ERP Hub
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800">{selectedHub.hubName}</span>
                    <span className="text-[11px] text-slate-400">{selectedHub.hubCode}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">{copy.labels.owner}</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.owner}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">{copy.labels.region}</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.region}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">{copy.labels.latestSync}</p>
                      <p className="mt-1 font-medium text-slate-800">2026-03-25</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">{copy.labels.linkedAccounts}</p>
                      <p className="mt-1 font-medium text-slate-800">{selectedHub.accounts.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Hub To Pools</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-white">{selectedHub.hubName}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">{copy.labels.customer} {pools.customer.length}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{copy.labels.supplier} {pools.supplier.length}</span>
                    <span className="text-slate-300">→</span>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-amber-700">{copy.labels.thirdParty} {pools['third-party'].length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  {([
                    ['customer', copy.labels.customer],
                    ['supplier', copy.labels.supplier],
                    ['third-party', copy.labels.thirdParty],
                  ] as Array<[PortalType, string]>).map(([portalType, label]) => (
                    <CustomerMasterSection key={portalType} title={label} titleEN={copy.sections.accountPool} icon={<Users className="h-4 w-4" />}>
                      <div className="space-y-3">
                        {pools[portalType].length ? pools[portalType].map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => setSelectedAccountId(account.id)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                              selectedAccountId === account.id ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-slate-800">{account.displayName}</p>
                                <p className="mt-1 truncate text-[11px] text-slate-500">{account.loginEmail}</p>
                              </div>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassMap[account.status]}`}>
                                {account.status}
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                              <span>{copy.labels.passwordMirror} {account.password}</span>
                              <span>{copy.labels.source} {sourceLabelMap[account.source] || account.source}</span>
                              <span>{copy.labels.latestSync} {account.updatedAt}</span>
                              <span>{copy.labels.notifiedAt} {account.notifiedAt || '—'}</span>
                            </div>
                          </button>
                        )) : (
                          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                            {copy.empty.accountPool}
                          </div>
                        )}
                      </div>
                    </CustomerMasterSection>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                {copy.empty.overview}
              </div>
            )}
          </CustomerMasterSection>

          <CustomerMasterSection title={copy.sections.selected} titleEN="Selected External Account" icon={<Eye className="h-4 w-4" />}>
            {selectedAccount ? (
              <div className="space-y-4 text-[12px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Mapping</p>
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <span className="text-slate-400">Hub</span><span className="text-slate-800">{selectedHub?.hubName || '—'}</span>
                      <span className="text-slate-400">Pool</span><span className="text-slate-800">{copy.labels[selectedAccount.portalType === 'third-party' ? 'thirdParty' : selectedAccount.portalType]}</span>
                      <span className="text-slate-400">{copy.labels.organization}</span><span className="text-slate-800">{selectedAccount.organizationName}</span>
                      <span className="text-slate-400">{copy.labels.loginEmail}</span><span className="text-slate-800">{selectedAccount.loginEmail}</span>
                      <span className="text-slate-400">{copy.labels.passwordMirror}</span><span className="font-mono text-slate-800">{selectedAccount.password}</span>
                      <span className="text-slate-400">{copy.labels.phone}</span><span className="text-slate-800">{selectedAccount.phone}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Status</p>
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <span className="text-slate-400">{copy.labels.currentStatus}</span><span className="text-slate-800">{selectedAccount.status}</span>
                      <span className="text-slate-400">{copy.labels.source}</span><span className="text-slate-800">{sourceLabelMap[selectedAccount.source] || selectedAccount.source}</span>
                      <span className="text-slate-400">{copy.labels.latestSync}</span><span className="text-slate-800">{selectedAccount.updatedAt}</span>
                      <span className="text-slate-400">{copy.labels.notifiedAt}</span><span className="text-slate-800">{selectedAccount.notifiedAt || '—'}</span>
                      <span className="text-slate-400">{copy.labels.recommendedAction}</span><span className="text-slate-800">{recommendedActionMap[selectedAccount.status]}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button type="button" onClick={() => void copyPassword()} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                    <Copy className="h-3.5 w-3.5" />
                    {copy.actions.copyPassword}
                  </button>
                  <button type="button" onClick={() => simulatePortalAction(copy.actions.markNotified)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                    <Check className="h-3.5 w-3.5" />
                    {copy.actions.markNotified}
                  </button>
                  <button type="button" onClick={() => simulatePortalAction(copy.actions.resync)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {copy.actions.resync}
                  </button>
                  <button type="button" onClick={() => simulatePortalAction(copy.actions.invalidate)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-[12px] font-medium text-amber-700 hover:bg-amber-50">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.actions.invalidate}
                  </button>
                  <button type="button" onClick={() => simulatePortalAction(copy.actions.clear)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.actions.clear}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12px] text-slate-400">
                {copy.empty.selected}
              </div>
            )}
          </CustomerMasterSection>

          <CustomerMasterSection title={copy.sections.principles} titleEN="Why This Layout" icon={<Lock className="h-4 w-4" />}>
            <div className="space-y-3 text-[12px] leading-6 text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">{copy.principles.p1Title}</p>
                <p>{copy.principles.p1Text}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{copy.principles.p2Title}</p>
                <p>{copy.principles.p2Text}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{copy.principles.p3Title}</p>
                <p>{copy.principles.p3Text}</p>
              </div>
            </div>
          </CustomerMasterSection>
        </div>
      </div>
    </div>
  );
}
