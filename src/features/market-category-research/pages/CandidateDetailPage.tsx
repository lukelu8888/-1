import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, ExternalLink, Info } from 'lucide-react';
import type { CandidateCategory, Evidence, RetailerScan, TimeWindow } from '../types';
import {
  fetchCandidate, fetchEvidence, fetchRetailerScans,
  sendToReview, approveCandidate, rejectCandidate, watchlistCandidate,
} from '../services/marketCategoryService';
import {
  statusColor, statusLabel, riskColor, evidenceStatusColor, evidenceStatusLabel,
  opportunityTypeLabel, formatDateTime, formatDate, scoreColor,
} from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreBar } from '../components/ScoreBar';
import { MiniTrendChart } from '../components/MiniTrendChart';
import type { MCRNavState } from '../types';

interface Props {
  candidateId: string;
  onNavigate: (state: MCRNavState) => void;
}

const SCORE_LABELS: { key: keyof CandidateCategory['scores']; label: string }[] = [
  { key: 'confidence', label: 'Confidence' },
  { key: 'trend', label: 'Trend' },
  { key: 'demand', label: 'Demand' },
  { key: 'competition', label: 'Competition' },
  { key: 'market_fit', label: 'Market Fit' },
  { key: 'seasonality', label: 'Seasonality' },
];

export function CandidateDetailPage({ candidateId, onNavigate }: Props) {
  const [candidate, setCandidate] = useState<CandidateCategory | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [scans, setScans] = useState<RetailerScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWindow, setActiveWindow] = useState<TimeWindow | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'evidence' | 'retailer' | 'products' | 'review'>('scores');
  const [acting, setActing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCandidate(candidateId),
      fetchEvidence(candidateId),
      fetchRetailerScans(candidateId),
    ]).then(([c, ev, sc]) => {
      setCandidate(c);
      setEvidence(ev);
      setScans(sc);
      if (c) setActiveWindow(c.trendWindows[0]?.window ?? null);
      setLoading(false);
    });
  }, [candidateId]);

  async function doAction(fn: () => Promise<CandidateCategory>, msg: string) {
    setActing(true);
    const updated = await fn();
    setCandidate(updated);
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
    setActing(false);
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-400 animate-pulse">Loading candidate…</div>;
  if (!candidate) return <div className="py-10 text-center text-sm text-slate-400">Candidate not found.</div>;

  const activeWindowData = candidate.trendWindows.find((w) => w.window === activeWindow);
  const singleSourceWarning = evidence.some((e) => e.evidenceStatus === 'single_source');
  const hasFallback = evidence.some((e) => e.evidenceStatus === 'fallback');

  const TABS = [
    { id: 'scores', label: 'Scores & Trend' },
    { id: 'evidence', label: `Evidence (${evidence.length})` },
    { id: 'retailer', label: `Retailer Signals (${scans.length})` },
    { id: 'products', label: `Hot Products (${candidate.hotProducts.length})` },
    { id: 'review', label: 'Review Actions' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => onNavigate({ page: 'candidates' })} className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
            <ChevronLeft size={14} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">{candidate.nameEn}</h2>
              <span className="text-xs text-slate-400">{candidate.nameZh}</span>
              <StatusBadge label={statusLabel(candidate.status)} colorClass={statusColor(candidate.status)} />
              <StatusBadge label={candidate.riskLevel + ' risk'} colorClass={riskColor(candidate.riskLevel)} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{candidate.country}</span>
              <span>·</span>
              <span>{candidate.audience}</span>
              <span>·</span>
              <span className="font-mono">{candidate.suggestedLevel}</span>
              <span>·</span>
              <span>Evidence: {candidate.evidenceCount}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {candidate.status === 'candidate' && (
            <button onClick={() => doAction(() => sendToReview(candidate.id), 'Sent to review queue.')} disabled={acting}
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-50">
              Send to Review
            </button>
          )}
          {candidate.status === 'approved' && (
            <button onClick={() => onNavigate({ page: 'publish', candidateId: candidate.id })}
              className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
              Publish to Storefront
            </button>
          )}
          {candidate.status === 'needs_review' && (
            <button onClick={() => onNavigate({ page: 'review-queue' })}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100">
              Go to Review Queue
            </button>
          )}
        </div>
      </div>

      {/* Opportunity Tags */}
      <div className="flex flex-wrap gap-1.5">
        {candidate.opportunityTypes.map((t) => (
          <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            {opportunityTypeLabel(t)}
          </span>
        ))}
      </div>

      {/* Inline action feedback */}
      {actionMsg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 size={13} /> {actionMsg}
        </div>
      )}

      {/* Warnings */}
      {singleSourceWarning && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={13} /> Single-source evidence detected. Cross-verification recommended before review.
        </div>
      )}
      {hasFallback && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <Info size={13} /> Fallback evidence cannot be used for market_verified status.
        </div>
      )}

      {/* Retailer signal disclaimer */}
      <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
        <strong>Retailer category presence is a market signal, not proof of profitability.</strong>{' '}
        大卖场存在该类目 ≠ 一定赚钱，仅代表市场信号。
      </div>

      {/* Tab Nav */}
      <div className="flex gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 border-r border-slate-100 px-2 py-2 text-xs font-medium transition-colors last:border-r-0 ${activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'scores' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Score Bars */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Score Overview</div>
            <div className="space-y-2.5">
              {SCORE_LABELS.map(({ key, label }) => (
                <ScoreBar key={key} label={label} value={candidate.scores[key]} />
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trend</div>
              <div className="flex gap-1">
                {candidate.trendWindows.map((w) => (
                  <button
                    key={w.window}
                    onClick={() => setActiveWindow(w.window)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${activeWindow === w.window ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {w.window}
                  </button>
                ))}
              </div>
            </div>
            {activeWindowData && (
              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Google Trends relative interest · {activeWindowData.window}
                  {activeWindowData.yoy != null && (
                    <span className={`ml-2 font-medium ${activeWindowData.yoy >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {activeWindowData.yoy >= 0 ? '↑' : '↓'} {Math.abs(activeWindowData.yoy)}% YoY
                    </span>
                  )}
                </div>
                <div className="h-24 w-full">
                  {/* Full-width trend chart */}
                  <svg width="100%" height="96" viewBox={`0 0 280 96`} preserveAspectRatio="none">
                    {(() => {
                      const vals = activeWindowData.data.map((d) => d.value);
                      const mn = Math.min(...vals);
                      const mx = Math.max(...vals);
                      const rng = mx - mn || 1;
                      const pts = activeWindowData.data.map((d, i) => {
                        const x = (i / (activeWindowData.data.length - 1)) * 280;
                        const y = 96 - ((d.value - mn) / rng) * 86 - 5;
                        return `${x},${y}`;
                      });
                      return (
                        <>
                          <polyline points={pts.join(' ')} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          {/* X labels */}
                          {activeWindowData.data.filter((_, i) => i % Math.ceil(activeWindowData.data.length / 5) === 0).map((d, i, arr) => (
                            <text key={i} x={(activeWindowData.data.indexOf(d) / (activeWindowData.data.length - 1)) * 280} y="96" textAnchor="middle" fontSize="8" fill="#94a3b8">{d.period}</text>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="mt-1 text-xs text-slate-400">Relative search interest only. Not sales volume.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="space-y-2">
          {evidence.length === 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={14} className="mr-1.5 inline" />
              No evidence found. This candidate cannot be marked as market_verified without evidence.
            </div>
          ) : (
            evidence.map((ev) => (
              <div
                key={ev.id}
                className={`rounded-lg border bg-white p-3.5 ${ev.evidenceStatus === 'fallback' ? 'opacity-60 border-slate-100' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-800">{ev.title}</span>
                      <StatusBadge label={evidenceStatusLabel(ev.evidenceStatus)} colorClass={evidenceStatusColor(ev.evidenceStatus)} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{ev.summary}</p>
                    {ev.metrics && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {Object.entries(ev.metrics).map(([k, v]) => (
                          <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-slate-500">{ev.sourceLabel}</div>
                    <div className="text-xs text-slate-400">{formatDate(ev.fetchedAt)}</div>
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-xs text-blue-500 hover:underline">
                        Source <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-slate-300">hash: {ev.rawPayloadHash}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'retailer' && (
        <div className="space-y-3">
          <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Retailer category presence is a market signal, not proof of profitability. · 大卖场存在该类目 ≠ 一定赚钱
          </div>
          {scans.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No retailer scans available for this candidate.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Retailer', 'Category Path', 'SKUs', 'Bestseller Rank', 'Avg Rating', 'Reviews', 'Price Range', 'Promo', 'Seasonal', 'Confidence', 'Fetched'].map((h) => (
                      <th key={h} className="px-2.5 py-2 text-left font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-2.5 py-2 font-medium text-slate-800">{s.retailer}</td>
                      <td className="px-2.5 py-2 text-slate-500 max-w-[160px]">
                        <span title={s.categoryPath} className="line-clamp-1">{s.categoryPath}</span>
                      </td>
                      <td className="px-2.5 py-2 tabular-nums text-slate-700">{s.productCount.toLocaleString()}</td>
                      <td className="px-2.5 py-2 tabular-nums text-slate-600">#{s.bestsellerRank ?? '—'}</td>
                      <td className="px-2.5 py-2 tabular-nums text-slate-600">{s.avgRating?.toFixed(1) ?? '—'}</td>
                      <td className="px-2.5 py-2 tabular-nums text-slate-500">{s.reviewCount ? s.reviewCount.toLocaleString() : '—'}</td>
                      <td className="px-2.5 py-2 text-slate-600">
                        {s.priceMin != null && s.priceMax != null
                          ? `$${s.priceMin}–$${s.priceMax}`
                          : '—'}
                      </td>
                      <td className="px-2.5 py-2">
                        {s.promotionSignal ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-2.5 py-2">
                        {s.seasonalSignal ? <span className="text-blue-500">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-10 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full ${scoreColor(s.confidence)}`} style={{ width: `${s.confidence}%` }} />
                          </div>
                          <span className="tabular-nums text-slate-600">{s.confidence}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 text-slate-400 tabular-nums">{formatDate(s.fetchedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {candidate.hotProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No hot product samples available.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Product', 'Retailer', 'Price', 'Rank', 'Rating', 'Reviews'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidate.hotProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{p.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.retailer}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">
                      ${p.price.toLocaleString()} {p.currency}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">
                      {p.rank != null ? `#${p.rank}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">
                      {p.rating != null ? `${p.rating} ★` : '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">
                      {p.reviewCount != null ? p.reviewCount.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review Actions</div>

          {/* Evidence Summary */}
          <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div className="font-medium mb-1">Evidence Summary</div>
            <div className="space-y-0.5">
              {(['cross_verified', 'market_verified', 'single_source', 'manual', 'fallback'] as const).map((st) => {
                const count = evidence.filter((e) => e.evidenceStatus === st).length;
                if (!count) return null;
                return (
                  <div key={st} className="flex items-center gap-2">
                    <StatusBadge label={evidenceStatusLabel(st)} colorClass={evidenceStatusColor(st)} />
                    <span>{count}</span>
                  </div>
                );
              })}
              {evidence.length === 0 && <span className="text-red-600">No evidence — cannot approve.</span>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Review Notes</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Optional notes for this review decision…"
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={acting || evidence.length === 0 || candidate.status === 'approved'}
              onClick={() => doAction(() => approveCandidate(candidate.id, reviewNote), 'Candidate approved.')}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              Approve
            </button>
            <button
              disabled={acting || candidate.status === 'rejected'}
              onClick={() => doAction(() => rejectCandidate(candidate.id, reviewNote), 'Candidate rejected.')}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-40"
            >
              Reject
            </button>
            <button
              disabled={acting || candidate.status === 'watchlist'}
              onClick={() => doAction(() => watchlistCandidate(candidate.id), 'Added to watchlist.')}
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-40"
            >
              Watchlist
            </button>
            {candidate.status === 'approved' && (
              <button
                onClick={() => onNavigate({ page: 'publish', candidateId: candidate.id })}
                className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                Publish to Storefront →
              </button>
            )}
          </div>

          {candidate.reviewNotes && (
            <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-medium">Prior Notes: </span>{candidate.reviewNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
