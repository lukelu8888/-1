import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Eye, Star, TrendingUp, Zap } from 'lucide-react';
import type { OverviewKPIs, DataSourceStatus, ResearchRun, CandidateCategory } from '../types';
import { fetchOverviewKPIs, fetchDataSources, fetchRuns, fetchCandidates } from '../services/marketCategoryService';
import { runStatusColor, runStatusLabel, statusColor, statusLabel, formatDate } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreBar } from '../components/ScoreBar';
import type { MCRNavState } from '../types';

interface Props {
  onNavigate: (state: MCRNavState) => void;
}

export function OverviewPage({ onNavigate }: Props) {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [highConf, setHighConf] = useState<CandidateCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOverviewKPIs(),
      fetchDataSources(),
      fetchRuns(),
      fetchCandidates(),
    ]).then(([k, s, r, c]) => {
      setKpis(k);
      setSources(s);
      setRuns(r.slice(0, 5));
      setHighConf(c.filter((x) => x.scores.confidence >= 85 && x.status !== 'published').slice(0, 5));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Market Category Research</h2>
          <p className="text-xs text-slate-500">Discover, validate, and publish new categories via market intelligence.</p>
        </div>
        <button
          onClick={() => onNavigate({ page: 'runs-new' })}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          <Zap size={12} />
          New Research Run
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Runs', value: kpis?.totalRuns, icon: TrendingUp, color: 'text-slate-700', action: () => onNavigate({ page: 'runs' }) },
          { label: 'Pending Review', value: kpis?.pendingReview, icon: Clock, color: 'text-amber-600', action: () => onNavigate({ page: 'review-queue' }) },
          { label: 'Approved', value: kpis?.approved, icon: CheckCircle2, color: 'text-emerald-600', action: () => onNavigate({ page: 'candidates' }) },
          { label: 'Published', value: kpis?.published, icon: Star, color: 'text-purple-600', action: () => onNavigate({ page: 'candidates' }) },
          { label: 'Watchlist', value: kpis?.watchlist, icon: Eye, color: 'text-blue-600', action: () => onNavigate({ page: 'candidates' }) },
          { label: 'High Confidence', value: kpis?.highConfidenceCandidates, icon: Zap, color: 'text-orange-600', action: () => onNavigate({ page: 'candidates' }) },
        ].map(({ label, value, icon: Icon, color, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <Icon size={13} className={color} />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
              {loading ? <span className="inline-block h-7 w-8 animate-pulse rounded bg-slate-100" /> : (value ?? 0)}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Data Source Health */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data Source Health</span>
            <button onClick={() => onNavigate({ page: 'data-sources' })} className="text-xs text-slate-400 hover:text-slate-600">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                    <div className="h-3 flex-1 rounded bg-slate-100" />
                  </div>
                ))
              : sources.map((src) => (
                  <div key={src.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        src.health === 'healthy' ? 'bg-emerald-400' : src.health === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                    />
                    <span className="flex-1 text-xs text-slate-700">{src.label}</span>
                    {src.latencyMs && (
                      <span className={`text-xs tabular-nums ${src.latencyMs > 1000 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {src.latencyMs}ms
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-slate-400">{src.recordsToday.toLocaleString()}</span>
                  </div>
                ))}
          </div>
          {sources.some((s) => s.notes) && (
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-amber-700 flex items-start gap-1.5">
              <AlertCircle size={11} className="mt-0.5 shrink-0" />
              <span>{sources.find((s) => s.notes)?.notes}</span>
            </div>
          )}
        </div>

        {/* High Confidence Candidates */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">High Confidence Candidates</span>
            <button onClick={() => onNavigate({ page: 'candidates' })} className="text-xs text-slate-400 hover:text-slate-600">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-2.5 animate-pulse">
                    <div className="h-3 w-2/3 rounded bg-slate-100 mb-1.5" />
                    <div className="h-2 w-full rounded bg-slate-50" />
                  </div>
                ))
              : highConf.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onNavigate({ page: 'candidate-detail', candidateId: c.id })}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-800">{c.nameEn}</span>
                      <StatusBadge label={statusLabel(c.status)} colorClass={statusColor(c.status)} />
                    </div>
                    <ScoreBar label="Confidence" value={c.scores.confidence} />
                  </button>
                ))}
          </div>
        </div>

        {/* Recent Runs */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Research Runs</span>
            <button onClick={() => onNavigate({ page: 'runs' })} className="text-xs text-slate-400 hover:text-slate-600">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-2.5 animate-pulse">
                    <div className="h-3 w-3/4 rounded bg-slate-100 mb-1.5" />
                    <div className="h-2 w-1/2 rounded bg-slate-50" />
                  </div>
                ))
              : runs.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onNavigate({ page: 'run-detail', runId: r.id })}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-800 truncate max-w-[160px]">{r.title}</span>
                      <StatusBadge label={runStatusLabel(r.status)} colorClass={runStatusColor(r.status)} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span>{r.country}</span>
                      <span>·</span>
                      <span>{r.requestedLevel}</span>
                      <span>·</span>
                      <span>{formatDate(r.createdAt)}</span>
                    </div>
                  </button>
                ))}
          </div>
          {/* Review Queue Quick Access */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              onClick={() => onNavigate({ page: 'review-queue' })}
              className="flex w-full items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="font-medium">Review Queue</span>
              {kpis && kpis.pendingReview > 0 && (
                <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-bold text-amber-900">
                  {kpis.pendingReview}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Market signals only.</span>{' '}
        Retailer category presence is a market signal, not proof of profitability.{' '}
        大卖场存在该类目 ≠ 一定赚钱，仅代表市场信号。
        Candidates must complete evidence review before publishing to the live category tree.
      </div>
    </div>
  );
}
