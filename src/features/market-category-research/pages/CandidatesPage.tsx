import { useEffect, useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import type { CandidateCategory, CandidateStatus } from '../types';
import { fetchCandidates, sendToReview, watchlistCandidate, rejectCandidate } from '../services/marketCategoryService';
import { statusColor, statusLabel, riskColor, opportunityTypeLabel, formatDate, scoreColor } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { MiniTrendChart } from '../components/MiniTrendChart';
import { LoadingRows } from '../components/LoadingRows';
import type { MCRNavState } from '../types';

interface Props {
  onNavigate: (state: MCRNavState) => void;
}

const STATUS_OPTS: { label: string; value: CandidateStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Candidate', value: 'candidate' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Watchlist', value: 'watchlist' },
  { label: 'Published', value: 'published' },
];

export function CandidatesPage({ onNavigate }: Props) {
  const [candidates, setCandidates] = useState<CandidateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchCandidates().then((c) => { setCandidates(c); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const visible = candidates.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.nameEn.toLowerCase().includes(search.toLowerCase()) && !c.nameZh.includes(search)) return false;
    return true;
  });

  async function act(id: string, fn: (id: string) => Promise<CandidateCategory>) {
    setActingId(id);
    const updated = await fn(id);
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates…"
            className="h-7 rounded-md border border-slate-200 bg-white pl-7 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
          <Filter size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="flex overflow-hidden rounded-md border border-slate-200 bg-white">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 text-xs transition-colors ${statusFilter === opt.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
          <RefreshCw size={12} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
        Retailer category presence is a market signal, not proof of profitability. · 大卖场存在该类目 ≠ 一定赚钱，仅代表市场信号。
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Name', 'Level', 'Country', 'Confidence', 'Trend YoY', 'Demand', 'Risk', 'Opportunity', 'Evidence', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <LoadingRows cols={11} rows={6} />
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-center text-slate-400">No candidates found.</td>
              </tr>
            ) : (
              visible.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onNavigate({ page: 'candidate-detail', candidateId: c.id })}
                      className="text-left"
                    >
                      <div className="font-medium text-slate-800 hover:text-slate-600">{c.nameEn}</div>
                      <div className="text-slate-400">{c.nameZh}</div>
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{c.suggestedLevel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{c.country}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full ${scoreColor(c.scores.confidence)}`} style={{ width: `${c.scores.confidence}%` }} />
                      </div>
                      <span className="tabular-nums text-slate-700">{c.scores.confidence}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <MiniTrendChart data={c.trendWindows[0]?.data ?? []} width={40} height={18} />
                      {c.trendWindows[0]?.yoy != null && (
                        <span className={c.trendWindows[0].yoy >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {c.trendWindows[0].yoy > 0 ? '+' : ''}{c.trendWindows[0].yoy}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-700">{c.scores.demand}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge label={c.riskLevel} colorClass={riskColor(c.riskLevel)} />
                  </td>
                  <td className="px-3 py-2.5 max-w-[120px]">
                    <div className="flex flex-wrap gap-0.5">
                      {c.opportunityTypes.slice(0, 2).map((t) => (
                        <span key={t} className="rounded bg-slate-100 px-1 py-0.5 text-slate-500">{opportunityTypeLabel(t)}</span>
                      ))}
                      {c.opportunityTypes.length > 2 && <span className="text-slate-400">+{c.opportunityTypes.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600">{c.evidenceCount}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge label={statusLabel(c.status)} colorClass={statusColor(c.status)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {c.status === 'candidate' && (
                        <button
                          onClick={() => act(c.id, sendToReview)}
                          disabled={actingId === c.id}
                          className="rounded border border-amber-200 px-1.5 py-0.5 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                        >
                          Review
                        </button>
                      )}
                      {c.status === 'needs_review' && (
                        <button
                          onClick={() => onNavigate({ page: 'review-queue' })}
                          className="rounded border border-emerald-200 px-1.5 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                      )}
                      {c.status === 'approved' && (
                        <button
                          onClick={() => onNavigate({ page: 'publish', candidateId: c.id })}
                          className="rounded border border-purple-200 px-1.5 py-0.5 text-xs text-purple-700 hover:bg-purple-50"
                        >
                          Publish
                        </button>
                      )}
                      {(c.status === 'candidate' || c.status === 'needs_review') && (
                        <button
                          onClick={() => act(c.id, watchlistCandidate)}
                          disabled={actingId === c.id}
                          className="rounded border border-blue-200 px-1.5 py-0.5 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          Watch
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate({ page: 'candidate-detail', candidateId: c.id })}
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400">{visible.length} candidates</div>
    </div>
  );
}
