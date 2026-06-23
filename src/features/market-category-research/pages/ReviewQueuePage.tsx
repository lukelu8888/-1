import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import type { CandidateCategory, Evidence } from '../types';
import { fetchReviewQueue, fetchEvidence, approveCandidate, rejectCandidate, watchlistCandidate } from '../services/marketCategoryService';
import { statusColor, statusLabel, riskColor, evidenceStatusColor, evidenceStatusLabel, scoreColor, formatDate } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreBar } from '../components/ScoreBar';
import type { MCRNavState } from '../types';

interface Props {
  onNavigate: (state: MCRNavState) => void;
}

interface ReviewModal {
  candidate: CandidateCategory;
  evidence: Evidence[];
  action: 'approve' | 'reject';
}

export function ReviewQueuePage({ onNavigate }: Props) {
  const [queue, setQueue] = useState<CandidateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ReviewModal | null>(null);
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [approveFields, setApproveFields] = useState({ nameEn: '', seoTitle: '', parentCategory: '', level: '' });

  const load = () => {
    setLoading(true);
    fetchReviewQueue().then((q) => { setQueue(q); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function openReview(candidate: CandidateCategory, action: 'approve' | 'reject') {
    const ev = await fetchEvidence(candidate.id);
    setModal({ candidate, evidence: ev, action });
    setNotes('');
    setApproveFields({
      nameEn: candidate.nameEn,
      seoTitle: candidate.nameEn + ' | Category',
      parentCategory: '',
      level: candidate.suggestedLevel,
    });
  }

  async function confirm() {
    if (!modal) return;
    setActing(true);
    const fn = modal.action === 'approve'
      ? () => approveCandidate(modal.candidate.id, notes)
      : () => rejectCandidate(modal.candidate.id, notes);
    await fn();
    setQueue((prev) => prev.filter((c) => c.id !== modal.candidate.id));
    showToast(modal.action === 'approve' ? '✓ Candidate approved.' : 'Candidate rejected.');
    setModal(null);
    setActing(false);
  }

  async function addToWatchlist(id: string) {
    await watchlistCandidate(id);
    setQueue((prev) => prev.filter((c) => c.id !== id));
    showToast('Added to watchlist.');
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Review Queue</h2>
          <p className="text-xs text-slate-500">Approve, reject, or watchlist candidates before they can be published.</p>
        </div>
        <button onClick={load} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
          <RefreshCw size={12} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 size={13} /> {toast}
        </div>
      )}

      {/* Rule reminder */}
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <strong className="text-slate-700">Review Rule:</strong> Only candidates with sufficient evidence may be approved. Approved candidates can then be published to the live category tree.
        Unapproved candidates <strong>cannot</strong> be written to the formal category table.
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white py-12 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-3 text-emerald-400" />
          <p className="text-sm text-slate-500">Review queue is empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onNavigate({ page: 'candidate-detail', candidateId: c.id })}
                      className="text-sm font-semibold text-slate-900 hover:text-slate-600"
                    >
                      {c.nameEn}
                    </button>
                    <span className="text-xs text-slate-400">{c.nameZh}</span>
                    <StatusBadge label={c.suggestedLevel} colorClass="bg-slate-100 text-slate-700" />
                    <StatusBadge label={c.riskLevel + ' risk'} colorClass={riskColor(c.riskLevel)} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {c.country} · {c.audience} · {c.evidenceCount} evidence records
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                    <ScoreBar label="Confidence" value={c.scores.confidence} />
                    <ScoreBar label="Demand" value={c.scores.demand} />
                    <ScoreBar label="Market Fit" value={c.scores.market_fit} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => openReview(c, 'approve')}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openReview(c, 'reject')}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => addToWatchlist(c.id)}
                    className="rounded-md border border-blue-200 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50"
                  >
                    Watchlist
                  </button>
                  <button
                    onClick={() => onNavigate({ page: 'candidate-detail', candidateId: c.id })}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-sm font-semibold text-slate-900">
                {modal.action === 'approve' ? 'Approve Candidate' : 'Reject Candidate'}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <div className="text-xs text-slate-500">Candidate</div>
                <div className="font-medium text-slate-800">{modal.candidate.nameEn}</div>
              </div>

              {/* Evidence Summary */}
              <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs">
                <div className="mb-1.5 font-medium text-slate-700">Evidence Summary</div>
                {modal.evidence.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-red-600">
                    <AlertCircle size={12} /> No evidence — cannot approve.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {modal.evidence.map((ev) => (
                      <StatusBadge key={ev.id} label={ev.sourceLabel} colorClass={evidenceStatusColor(ev.evidenceStatus)} />
                    ))}
                  </div>
                )}
              </div>

              {modal.action === 'approve' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-slate-600">Category Name</label>
                    <input
                      value={approveFields.nameEn}
                      onChange={(e) => setApproveFields({ ...approveFields, nameEn: e.target.value })}
                      className="h-7 w-full rounded-md border border-slate-200 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-slate-600">SEO Title</label>
                    <input
                      value={approveFields.seoTitle}
                      onChange={(e) => setApproveFields({ ...approveFields, seoTitle: e.target.value })}
                      className="h-7 w-full rounded-md border border-slate-200 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-slate-600">Parent Category</label>
                      <input
                        value={approveFields.parentCategory}
                        onChange={(e) => setApproveFields({ ...approveFields, parentCategory: e.target.value })}
                        placeholder="e.g. Home Improvement"
                        className="h-7 w-full rounded-md border border-slate-200 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-slate-600">Level</label>
                      <select
                        value={approveFields.level}
                        onChange={(e) => setApproveFields({ ...approveFields, level: e.target.value })}
                        className="h-7 w-full rounded-md border border-slate-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                      >
                        <option>L1</option>
                        <option>L2</option>
                        <option>L3</option>
                        <option>L4</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-0.5 block text-xs font-medium text-slate-600">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional review notes…"
                  className="w-full resize-none rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button onClick={() => setModal(null)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={acting || (modal.action === 'approve' && modal.evidence.length === 0)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 ${
                  modal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {acting ? 'Processing…' : modal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
