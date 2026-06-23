import { useState } from 'react';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import type { CreateRunInput, TimeWindow, DataSourceType, RequestedLevel, AudienceType } from '../types';
import { createRun } from '../services/marketCategoryService';
import { BENCHMARK_RETAILERS } from '../mock/data';
import type { MCRNavState } from '../types';

interface Props {
  onNavigate: (state: MCRNavState) => void;
}

const TIME_WINDOWS: TimeWindow[] = ['10Y', '5Y', '3Y', '1Y', '3M'];
const DATA_SOURCES: { id: DataSourceType; label: string; note?: string }[] = [
  { id: 'google_trends', label: 'Google Trends', note: 'Relative search interest only. Not sales volume.' },
  { id: 'merchant_center', label: 'Google Merchant Center' },
  { id: 'amazon_oe', label: 'Amazon Opportunity Explorer' },
  { id: 'retailer_scan', label: 'Retailer Category Scan' },
  { id: 'google_shopping', label: 'Google Shopping' },
  { id: 'manual', label: 'Manual Research' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-4.5 w-4.5 items-center justify-center rounded border text-xs transition-colors ${checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-transparent'}`}
    >
      ✓
    </button>
  );
}

export function CreateRunPage({ onNavigate }: Props) {
  const [form, setForm] = useState<Partial<CreateRunInput>>({
    region: 'North America',
    country: 'US',
    audience: 'both',
    requestedLevel: 'L2',
    timeWindows: ['1Y', '3M'],
    dataSources: ['google_trends', 'retailer_scan'],
    benchmarkRetailers: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = form.country ?? 'US';
  const availableRetailers = country === 'CA' ? BENCHMARK_RETAILERS.CA : BENCHMARK_RETAILERS.US;

  function toggleArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) { setError('Title is required.'); return; }
    if (!form.sourceCategory?.trim()) { setError('Source Category is required.'); return; }
    if (!form.timeWindows?.length) { setError('Select at least one time window.'); return; }
    if (!form.dataSources?.length) { setError('Select at least one data source.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const run = await createRun(form as CreateRunInput);
      onNavigate({ page: 'run-detail', runId: run.id });
    } catch {
      setError('Failed to create run. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onNavigate({ page: 'runs' })} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
          <ChevronLeft size={14} />
        </button>
        <div>
          <h2 className="text-base font-semibold text-slate-900">New Research Run</h2>
          <p className="text-xs text-slate-500">Configure a market research task to discover category opportunities.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Basic Info</div>
        <div className="space-y-3 px-4 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
            <input
              value={form.title ?? ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Q2 2026 NA Home Improvement Research"
              className="h-8 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Source Category <span className="text-red-500">*</span></label>
            <input
              value={form.sourceCategory ?? ''}
              onChange={(e) => setForm({ ...form, sourceCategory: e.target.value })}
              placeholder="e.g. Home Improvement, Smart Home, Outdoor Furniture"
              className="h-8 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Region</label>
              <select
                value={form.region ?? ''}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option>North America</option>
                <option>Europe</option>
                <option>Asia Pacific</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Country</label>
              <select
                value={form.country ?? ''}
                onChange={(e) => setForm({ ...form, country: e.target.value, benchmarkRetailers: [] })}
                className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="US">US</option>
                <option value="CA">CA</option>
                <option value="UK">UK</option>
                <option value="AU">AU</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Audience</label>
              <select
                value={form.audience ?? 'both'}
                onChange={(e) => setForm({ ...form, audience: e.target.value as AudienceType })}
                className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="b2c">B2C</option>
                <option value="b2b">B2B</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Requested Category Level</label>
            <div className="flex gap-2">
              {(['L1', 'L2', 'L3', 'L4'] as RequestedLevel[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setForm({ ...form, requestedLevel: l })}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${form.requestedLevel === l ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Time Windows */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Time Windows</div>
        <div className="flex gap-2 px-4 py-4">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setForm({ ...form, timeWindows: toggleArray(form.timeWindows ?? [], w) })}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${(form.timeWindows ?? []).includes(w) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
            >
              {w}
            </button>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Data Sources</div>
        <div className="space-y-2 px-4 py-4">
          {DATA_SOURCES.map((ds) => (
            <div key={ds.id} className="flex items-start gap-2.5">
              <Toggle
                checked={(form.dataSources ?? []).includes(ds.id)}
                onChange={() => setForm({ ...form, dataSources: toggleArray(form.dataSources ?? [], ds.id) })}
              />
              <div>
                <div className="text-xs font-medium text-slate-700">{ds.label}</div>
                {ds.note && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle size={10} />
                    {ds.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark Retailers */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Benchmark Retailers <span className="ml-1 text-slate-400 normal-case font-normal">({country})</span>
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-4">
          {availableRetailers.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, benchmarkRetailers: toggleArray(form.benchmarkRetailers ?? [], r) })}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${(form.benchmarkRetailers ?? []).includes(r) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes (optional)</div>
        <div className="px-4 py-4">
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Research focus, known competitors, special considerations…"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => onNavigate({ page: 'runs' })} className="rounded-md border border-slate-200 px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Research Run'}
        </button>
      </div>
    </form>
  );
}
