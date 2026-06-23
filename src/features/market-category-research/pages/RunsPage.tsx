import { useEffect, useState } from 'react';
import { Filter, Plus, RefreshCw } from 'lucide-react';
import type { ResearchRun, RunStatus } from '../types';
import { fetchRuns } from '../services/marketCategoryService';
import { runStatusColor, runStatusLabel, formatDate, formatDateTime } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingRows } from '../components/LoadingRows';
import type { MCRNavState } from '../types';

interface Props {
  onNavigate: (state: MCRNavState) => void;
}

const STATUS_OPTIONS: { label: string; value: RunStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

export function RunsPage({ onNavigate }: Props) {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetchRuns().then((r) => { setRuns(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const visible = runs.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.sourceCategory.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runs…"
              className="h-7 rounded-md border border-slate-200 bg-white pl-7 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
            <Filter size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="flex rounded-md border border-slate-200 bg-white overflow-hidden">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-2.5 py-1 text-xs transition-colors ${statusFilter === opt.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
            <RefreshCw size={12} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate({ page: 'runs-new' })}
            className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            <Plus size={12} />
            New Run
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Title', 'Region / Country', 'Level', 'Data Sources', 'Candidates', 'Status', 'Created', 'Completed'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <LoadingRows cols={8} rows={5} />
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">No runs found.</td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onNavigate({ page: 'run-detail', runId: r.id })}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{r.title}</div>
                    <div className="text-slate-400">{r.sourceCategory}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {r.region}<br />
                    <span className="text-slate-400">{r.country} · {r.audience}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{r.requestedLevel}</span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[140px]">
                    <div className="flex flex-wrap gap-1">
                      {r.dataSources.slice(0, 3).map((ds) => (
                        <span key={ds} className="rounded bg-slate-100 px-1 py-0.5 text-slate-500 capitalize">{ds.replace('_', ' ')}</span>
                      ))}
                      {r.dataSources.length > 3 && <span className="text-slate-400">+{r.dataSources.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    <span className="text-slate-700">{r.candidateCount}</span>
                    {r.pendingReviewCount > 0 && (
                      <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-amber-700">{r.pendingReviewCount} review</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge label={runStatusLabel(r.status)} colorClass={runStatusColor(r.status)} />
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 tabular-nums">{formatDate(r.createdAt)}</td>
                  <td className="px-3 py-2.5 text-slate-400 tabular-nums">
                    {r.completedAt ? formatDate(r.completedAt) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400">{visible.length} runs</div>
    </div>
  );
}
