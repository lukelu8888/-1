import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Filter } from 'lucide-react';
import type { Evidence, EvidenceStatus } from '../types';
import { fetchEvidence } from '../services/marketCategoryService';
import { evidenceStatusColor, evidenceStatusLabel, formatDate, formatDateTime } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingRows } from '../components/LoadingRows';
import type { MCRNavState } from '../types';

interface Props {
  onNavigate: (state: MCRNavState) => void;
}

const STATUS_OPTS: { label: string; value: EvidenceStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Market Verified', value: 'market_verified' },
  { label: 'Cross Verified', value: 'cross_verified' },
  { label: 'Single Source', value: 'single_source' },
  { label: 'Fallback', value: 'fallback' },
  { label: 'Manual', value: 'manual' },
];

const SOURCE_LABELS: Record<string, string> = {
  google_trends: 'Google Trends',
  merchant_center: 'Merchant Center',
  amazon_oe: 'Amazon OE',
  retailer_scan: 'Retailer Scan',
  google_shopping: 'Google Shopping',
  manual: 'Manual',
};

export function EvidencePage({ onNavigate }: Props) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchEvidence().then((ev) => { setEvidence(ev); setLoading(false); });
  }, []);

  const visible = evidence.filter((e) => {
    if (statusFilter !== 'all' && e.evidenceStatus !== statusFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.sourceLabel.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFallback = visible.some((e) => e.evidenceStatus === 'fallback');
  const hasSingleSource = visible.some((e) => e.evidenceStatus === 'single_source');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Evidence Board</h2>
          <p className="text-xs text-slate-500">All evidence records across all candidates. Cross-verify before approving.</p>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-700">Evidence Verification Rules</div>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Fallback evidence <strong>cannot</strong> be marked as market_verified</li>
          <li>Single-source evidence displays a <strong className="text-amber-700">warning</strong></li>
          <li>Multi-source evidence is shown as <strong className="text-emerald-700">cross_verified</strong></li>
          <li>Each evidence record must carry source, fetched_at, and raw_payload_hash</li>
          <li>Publish is blocked unless evidence summary is reviewed</li>
        </ul>
      </div>

      {(hasFallback || hasSingleSource) && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={13} />
          {hasFallback && 'Some records are fallback — cannot be used for verification. '}
          {hasSingleSource && 'Some records have only a single source — cross-verification recommended.'}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence…"
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Title', 'Source', 'Status', 'Candidate', 'Fetched', 'Hash'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <LoadingRows cols={6} rows={6} />
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">No evidence records found.</td>
              </tr>
            ) : (
              visible.map((ev) => (
                <tr
                  key={ev.id}
                  className={`hover:bg-slate-50 transition-colors ${ev.evidenceStatus === 'fallback' ? 'opacity-50' : ''}`}
                >
                  <td className="px-3 py-2.5 max-w-[220px]">
                    <div className="font-medium text-slate-800">{ev.title}</div>
                    <p className="text-slate-400 line-clamp-1">{ev.summary}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{ev.sourceLabel}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge label={evidenceStatusLabel(ev.evidenceStatus)} colorClass={evidenceStatusColor(ev.evidenceStatus)} />
                    {ev.evidenceStatus === 'single_source' && (
                      <AlertCircle size={11} className="ml-1 inline text-amber-500" />
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onNavigate({ page: 'candidate-detail', candidateId: ev.candidateId })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {ev.candidateId}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 tabular-nums">{formatDate(ev.fetchedAt)}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300 text-xs">{ev.rawPayloadHash.slice(0, 20)}…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400">{visible.length} records</div>
    </div>
  );
}
