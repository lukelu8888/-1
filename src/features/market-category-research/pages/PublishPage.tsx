import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, Info, Lock } from 'lucide-react';
import type { CandidateCategory, Evidence, PublishLog } from '../types';
import { fetchCandidate, fetchEvidence, fetchExistingCategories, publishCandidate } from '../services/marketCategoryService';
import { statusColor, statusLabel, evidenceStatusColor, evidenceStatusLabel, scoreColor } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import type { MCRNavState } from '../types';

interface Props {
  candidateId: string;
  onNavigate: (state: MCRNavState) => void;
}

export function PublishPage({ candidateId, onNavigate }: Props) {
  const [candidate, setCandidate] = useState<CandidateCategory | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; path: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentCatId, setParentCatId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishLog, setPublishLog] = useState<PublishLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCandidate(candidateId), fetchEvidence(candidateId), fetchExistingCategories()])
      .then(([c, ev, cats]) => {
        setCandidate(c);
        setEvidence(ev);
        setCategories(cats);
        if (c) setSeoTitle(c.nameEn + ' | Shop Online');
        setLoading(false);
      });
  }, [candidateId]);

  const selectedCat = categories.find((c) => c.id === parentCatId);
  const previewPath = selectedCat
    ? `${selectedCat.path} > ${candidate?.nameEn ?? ''}`
    : candidate?.nameEn ?? '';

  const hasDuplicate = categories.some((c) =>
    c.name.toLowerCase() === candidate?.nameEn?.toLowerCase(),
  );

  async function handlePublish() {
    if (!candidate) return;
    if (candidate.status !== 'approved') { setError('Only approved candidates can be published.'); return; }
    if (evidence.length === 0) { setError('No evidence attached — cannot publish.'); return; }
    setError(null);
    setPublishing(true);
    try {
      const log = await publishCandidate({
        candidateId: candidate.id,
        parentCategoryId: parentCatId || undefined,
        parentCategoryName: selectedCat?.name,
        seoTitle,
      });
      setPublishLog(log);
      setCandidate((prev) => prev ? { ...prev, status: 'published' } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed.');
    }
    setPublishing(false);
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-400 animate-pulse">Loading…</div>;
  if (!candidate) return <div className="py-10 text-center text-sm text-slate-400">Candidate not found.</div>;

  if (publishLog) {
    return (
      <div className="mx-auto max-w-lg space-y-5 pt-8">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500" />
          <h2 className="text-base font-semibold text-emerald-800">Published Successfully</h2>
          <p className="mt-1 text-sm text-emerald-700">{publishLog.candidateName}</p>
          <p className="mt-2 text-xs text-emerald-600">{publishLog.targetPath}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Target Category ID</span>
            <span className="font-mono text-slate-700">{publishLog.targetCategoryId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Published At</span>
            <span className="text-slate-700">{new Date(publishLog.publishedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Published By</span>
            <span className="text-slate-700">{publishLog.publishedBy}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate({ page: 'candidates' })} className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">
            ← Back to Candidates
          </button>
          <button onClick={() => onNavigate({ page: 'overview' })} className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-xs text-white hover:bg-slate-700">
            Go to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate({ page: 'candidate-detail', candidateId })} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
          <ChevronLeft size={14} />
        </button>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Publish to Storefront</h2>
          <p className="text-xs text-slate-500">This will write the category into the live category tree.</p>
        </div>
      </div>

      {/* Candidate info */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{candidate.nameEn}</span>
              <span className="text-xs text-slate-400">{candidate.nameZh}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{candidate.country} · {candidate.suggestedLevel} · {candidate.audience}</div>
          </div>
          <StatusBadge label={statusLabel(candidate.status)} colorClass={statusColor(candidate.status)} />
        </div>
      </div>

      {/* Access Control */}
      {candidate.status !== 'approved' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <Lock size={14} />
          <span><strong>Publish blocked:</strong> Only <em>approved</em> candidates can be published. Current status: <strong>{candidate.status}</strong>.</span>
        </div>
      )}

      {/* Evidence Summary */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence Summary</div>
        {evidence.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={13} /> No evidence — publish blocked.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {evidence.map((ev) => (
              <StatusBadge key={ev.id} label={ev.sourceLabel} colorClass={evidenceStatusColor(ev.evidenceStatus)} />
            ))}
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publish Configuration</div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Parent Category (optional)</label>
          <select
            value={parentCatId}
            onChange={(e) => setParentCatId(e.target.value)}
            disabled={candidate.status !== 'approved'}
            className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50"
          >
            <option value="">— Root level (no parent) —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.path}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Category Path Preview</label>
          <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
            {previewPath || '—'}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">SEO Title</label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            disabled={candidate.status !== 'approved'}
            className="h-8 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50"
          />
        </div>

        {hasDuplicate && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle size={13} />
            A category with this name already exists in the tree. Please verify before publishing.
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        <Info size={13} />
        Publishing will write this category into the formal category table and set status to <strong>published</strong>. This action cannot be undone from this interface.
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => onNavigate({ page: 'candidate-detail', candidateId })} className="rounded-md border border-slate-200 px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing || candidate.status !== 'approved' || evidence.length === 0}
          className="rounded-md bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-40"
        >
          {publishing ? 'Publishing…' : 'Confirm Publish'}
        </button>
      </div>
    </div>
  );
}
