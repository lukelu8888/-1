import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { DataSourceStatus, SourceHealth } from '../types';
import { fetchDataSources } from '../services/marketCategoryService';
import { formatDateTime } from '../utils';

const HEALTH_ICON: Record<SourceHealth, React.ReactNode> = {
  healthy: <CheckCircle2 size={14} className="text-emerald-500" />,
  degraded: <AlertCircle size={14} className="text-amber-500" />,
  offline: <WifiOff size={14} className="text-red-500" />,
};

const HEALTH_BADGE: Record<SourceHealth, string> = {
  healthy: 'bg-emerald-100 text-emerald-800',
  degraded: 'bg-amber-100 text-amber-800',
  offline: 'bg-red-100 text-red-800',
};

export function DataSourcesPage() {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchDataSources().then((s) => { setSources(s); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const healthyCt = sources.filter((s) => s.health === 'healthy').length;
  const degradedCt = sources.filter((s) => s.health === 'degraded').length;
  const offlineCt = sources.filter((s) => s.health === 'offline').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Data Sources</h2>
          <p className="text-xs text-slate-500">Monitor the health and sync status of all connected market intelligence data sources.</p>
        </div>
        <button onClick={load} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
          <RefreshCw size={12} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          { label: 'Healthy', count: healthyCt, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Degraded', count: degradedCt, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Offline', count: offlineCt, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-lg border px-4 py-3 ${bg}`}>
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`text-2xl font-bold tabular-nums ${color}`}>{count}</div>
          </div>
        ))}
      </div>

      {/* Sources Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Source', 'Health', 'Last Sync', 'Records Today', 'Latency', 'Notes'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5"><div className="h-3 rounded bg-slate-100" /></td>
                    ))}
                  </tr>
                ))
              : sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {HEALTH_ICON[src.health]}
                        <span className="font-medium text-slate-800">{src.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded px-1.5 py-0.5 capitalize ${HEALTH_BADGE[src.health]}`}>
                        {src.health}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 tabular-nums">{formatDateTime(src.lastSyncAt)}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-700">{src.recordsToday.toLocaleString()}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {src.latencyMs ? (
                        <span className={src.latencyMs > 1000 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                          {src.latencyMs}ms
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-slate-500 max-w-[200px]">
                      {src.notes ?? '—'}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Google Trends notice */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <div className="font-medium mb-0.5">Google Trends Notice</div>
        Google Trends data reflects <strong>relative search interest only</strong>. It is not a measure of sales volume, revenue, or market size.
        Do not use trend data alone to justify category creation. Cross-verify with retailer scans, Merchant Center, or Amazon OE.
      </div>

      {/* Supported Retailers */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Retailer & Marketplace Coverage</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            'Home Depot (US)', "Lowe's (US)", 'Walmart US', 'Amazon US', 'Best Buy', 'Target',
            'Costco US', 'Wayfair', 'TikTok Shop', 'Alibaba / AliExpress', 'Google Shopping',
            'Home Depot CA', 'RONA', 'Canadian Tire', 'Walmart CA', 'Amazon CA', 'Costco CA',
          ].map((r) => (
            <div key={r} className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
              <Wifi size={11} className="shrink-0 text-emerald-400" />
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
