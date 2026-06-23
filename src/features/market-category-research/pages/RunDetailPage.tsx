import { useEffect, useState } from 'react';
import { ChevronLeft, Play, RefreshCw } from 'lucide-react';
import type { ResearchRun, CandidateCategory } from '../types';
import { fetchRun, fetchCandidates, startRun } from '../services/marketCategoryService';
import { runStatusColor, runStatusLabel, statusColor, statusLabel, formatDateTime, scoreColor } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { MiniTrendChart } from '../components/MiniTrendChart';
import { LoadingRows } from '../components/LoadingRows';
import type { MCRNavState } from '../types';

interface Props {
  runId: string;
  onNavigate: (state: MCRNavState) => void;
}

export function RunDetailPage({ runId, onNavigate }: Props) {
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [candidates, setCandidates] = useState<CandidateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchRun(runId), fetchCandidates(runId)]).then(([r, c]) => {
      setRun(r);
      setCandidates(c);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [runId]);

  async function handleStart() {
    if (!run) return;
    setStarting(true);
    const updated = await startRun(run.id);
    setRun(updated);
    setStarting(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-6 w-1/3 rounded bg-slate-100" />
        <div className="animate-pulse h-20 rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (!run) {
    return <div className="py-10 text-center text-sm text-slate-400">Run not found.</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => onNavigate({ page: 'runs' })} className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
            <ChevronLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">{run.title}</h2>
              <StatusBadge label={runStatusLabel(run.status)} colorClass={runStatusColor(run.status)} />
            </div>
            <p className="text-xs text-slate-500">{run.sourceCategory} · {run.country} · {run.audience} · {run.requestedLevel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
            <RefreshCw size={12} className="text-slate-400" />
          </button>
          {run.status === 'draft' && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play size={11} />
              {starting ? 'Starting…' : 'Start Run'}
            </button>
          )}
        </div>
      </div>

      {/* Run Info Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Region', value: run.region },
          { label: 'Time Windows', value: run.timeWindows.join(', ') },
          { label: 'Data Sources', value: run.dataSources.length.toString() },
          { label: 'Benchmark Retailers', value: run.benchmarkRetailers.length ? run.benchmarkRetailers.slice(0, 2).join(', ') + (run.benchmarkRetailers.length > 2 ? ` +${run.benchmarkRetailers.length - 2}` : '') : '—' },
          { label: 'Created', value: formatDateTime(run.createdAt) },
          { label: 'Completed', value: run.completedAt ? formatDateTime(run.completedAt) : '—' },
          { label: 'Candidates', value: run.candidateCount.toString() },
          { label: 'Pending Review', value: run.pendingReviewCount.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-800">{value}</div>
          </div>
        ))}
      </div>

      {run.notes && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium">Notes: </span>{run.notes}
        </div>
      )}

      {/* Candidates Table */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">Candidates ({candidates.length})</span>
          {run.pendingReviewCount > 0 && (
            <button
              onClick={() => onNavigate({ page: 'review-queue' })}
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800 hover:bg-amber-100"
            >
              {run.pendingReviewCount} pending review →
            </button>
          )}
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Name', 'Level', 'Confidence', 'Trend', 'Demand', 'Risk', 'Status', 'Evidence'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {run.status === 'running' ? 'Run in progress — candidates will appear here.' : 'No candidates generated yet.'}
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onNavigate({ page: 'candidate-detail', candidateId: c.id })}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-800">{c.nameEn}</div>
                      <div className="text-slate-400">{c.nameZh}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{c.suggestedLevel}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full ${scoreColor(c.scores.confidence)}`} style={{ width: `${c.scores.confidence}%` }} />
                        </div>
                        <span className="tabular-nums text-slate-700">{c.scores.confidence}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <MiniTrendChart data={c.trendWindows[0]?.data ?? []} width={50} height={20} />
                        <span className={`text-xs ${c.trendWindows[0]?.yoy != null && c.trendWindows[0].yoy >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {c.trendWindows[0]?.yoy != null ? `${c.trendWindows[0].yoy > 0 ? '+' : ''}${c.trendWindows[0].yoy}%` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">{c.scores.demand}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 capitalize ${c.riskLevel === 'low' ? 'bg-emerald-50 text-emerald-700' : c.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {c.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge label={statusLabel(c.status)} colorClass={statusColor(c.status)} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">{c.evidenceCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
