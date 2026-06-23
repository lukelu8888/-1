/**
 * marketCategoryService.ts
 * ─────────────────────────
 * Supabase-backed service with automatic mock fallback.
 *
 * If the mcr_* tables don't exist yet (migration not run), every call
 * transparently falls back to in-memory mock data so the UI stays fully
 * functional during development. Once the Supabase migration is applied,
 * real data flows automatically — no code change needed.
 *
 * Fallback detection: PostgreSQL error code 42P01 ("relation does not exist")
 */

import { supabase } from '../../../lib/supabase';
import type {
  ResearchRun,
  CandidateCategory,
  Evidence,
  RetailerScan,
  DataSourceStatus,
  OverviewKPIs,
  PublishLog,
  CreateRunInput,
  PublishInput,
  CandidateStatus,
} from '../types';
import {
  MOCK_RUNS,
  MOCK_CANDIDATES,
  MOCK_EVIDENCE,
  MOCK_RETAILER_SCANS,
  MOCK_DATA_SOURCES,
  MOCK_KPIS,
  MOCK_PUBLISH_LOGS,
  EXISTING_CATEGORIES,
} from '../mock/data';

// ─── In-memory mock store (used when DB tables don't exist yet) ───────────────
let _runs: ResearchRun[]           = [...MOCK_RUNS];
let _candidates: CandidateCategory[] = [...MOCK_CANDIDATES];
let _evidence: Evidence[]          = [...MOCK_EVIDENCE];
let _scans: RetailerScan[]         = [...MOCK_RETAILER_SCANS];
let _publishLogs: PublishLog[]     = [...MOCK_PUBLISH_LOGS];

// ─── Table-existence probe (cached per session) ────────────────────────────────
let _tablesExist: boolean | null = null;

async function checkTablesExist(): Promise<boolean> {
  if (_tablesExist !== null) return _tablesExist;
  const { error } = await supabase
    .from('mcr_runs')
    .select('id', { count: 'exact', head: true })
    .limit(1);
  // error code 42P01 = relation does not exist
  _tablesExist = !error || error.code !== '42P01';
  return _tablesExist;
}

/** Call with a Supabase thunk; if tables missing, invoke mockFn instead. */
async function withFallback<T>(
  sbFn: () => Promise<T>,
  mockFn: () => Promise<T>,
): Promise<T> {
  const exists = await checkTablesExist();
  if (!exists) return mockFn();
  try {
    return await sbFn();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('42P01') || msg.includes('relation') || msg.includes('does not exist')) {
      _tablesExist = false;
      return mockFn();
    }
    throw e;
  }
}

function delay<T>(v: T, ms = 300): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

// ─── Row → Domain mappers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRun(row: any): ResearchRun {
  return {
    id:                 row.id,
    title:              row.title,
    sourceCategory:     row.source_category,
    region:             row.region,
    country:            row.country,
    audience:           row.audience,
    requestedLevel:     row.requested_level,
    timeWindows:        parseJsonField(row.time_windows, []),
    dataSources:        parseJsonField(row.data_sources, []),
    benchmarkRetailers: parseJsonField(row.benchmark_retailers, []),
    notes:              row.notes ?? undefined,
    status:             row.status,
    candidateCount:     row.candidate_count      ?? 0,
    pendingReviewCount: row.pending_review_count ?? 0,
    createdBy:          row.created_by   ?? undefined,
    createdAt:          row.created_at,
    completedAt:        row.completed_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCandidate(row: any): CandidateCategory {
  return {
    id:             row.id,
    runId:          row.run_id      ?? undefined,
    nameZh:         row.name_zh     ?? '',
    nameEn:         row.name_en,
    suggestedLevel: row.suggested_level,
    region:         row.region,
    country:        row.country,
    audience:       row.audience,
    scores: {
      confidence:  row.score_confidence  ?? 0,
      trend:       row.score_trend       ?? 0,
      demand:      row.score_demand      ?? 0,
      competition: row.score_competition ?? 0,
      marketFit:   row.score_market_fit  ?? 0,
      seasonality: row.score_seasonality ?? 0,
    },
    riskLevel:       row.risk_level,
    status:          row.status,
    opportunityTypes: parseJsonField(row.opportunity_types, []),
    trendWindows:     parseJsonField(row.trend_windows, []),
    reviewNotes:     row.review_notes ?? undefined,
    reviewedBy:      row.reviewed_by  ?? undefined,
    reviewedAt:      row.reviewed_at  ?? undefined,
    publishedCategoryId: row.published_category_id ?? undefined,
    publishedAt:     row.published_at  ?? undefined,
    evidenceCount:   row.evidence_count ?? 0,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
    hotProducts:     (row.mcr_hot_products ?? row.hot_products ?? []).map(mapHotProduct),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvidence(row: any): Evidence {
  return {
    id:             row.id,
    candidateId:    row.candidate_id,
    source:         row.source,
    sourceLabel:    row.source_label,
    title:          row.title,
    summary:        row.summary ?? undefined,
    status:         row.evidence_status,
    metrics:        row.metrics ? parseJsonField(row.metrics, undefined) : undefined,
    url:            row.url    ?? undefined,
    rawPayloadHash: row.raw_payload_hash,
    fetchedAt:      row.fetched_at,
    createdAt:      row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRetailerScan(row: any): RetailerScan {
  return {
    id:             row.id,
    candidateId:    row.candidate_id,
    retailer:       row.retailer,
    categoryPath:   row.category_path,
    productCount:   row.product_count   ?? 0,
    bestsellerRank: row.bestseller_rank ?? undefined,
    avgRating:      row.avg_rating      ?? undefined,
    reviewCount:    row.review_count    ?? undefined,
    priceRange: { min: row.price_min ?? 0, max: row.price_max ?? 0, currency: row.price_currency ?? 'USD' },
    promotionSignal: row.promotion_signal ?? false,
    seasonalSignal:  row.seasonal_signal  ?? false,
    sourceUrl:       row.source_url       ?? undefined,
    confidence:      row.confidence       ?? 0,
    fetchedAt:       row.fetched_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPublishLog(row: any): PublishLog {
  return {
    id:               row.id,
    candidateId:      row.candidate_id,
    candidateName:    row.candidate_name,
    publishedAt:      row.published_at,
    publishedBy:      row.published_by,
    targetCategoryId: row.target_category_id,
    targetPath:       row.target_path,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHotProduct(row: any) {
  return {
    id: row.id, name: row.name, retailer: row.retailer,
    price: row.price ?? undefined, currency: row.currency ?? 'USD',
    rank: row.rank ?? undefined, rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined, imageUrl: row.image_url ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonField<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val as T;
  try { return JSON.parse(val as string) as T; } catch { return fallback; }
}

function throwSb(error: { message: string } | null, ctx: string): never {
  throw new Error(`[MCR/${ctx}] ${error?.message ?? 'Unknown error'}`);
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function fetchOverviewKPIs(): Promise<OverviewKPIs> {
  return withFallback(
    async () => {
      const [runsR, pendingR, approvedR, publishedR, watchlistR, highR] = await Promise.all([
        supabase.from('mcr_runs').select('id', { count: 'exact', head: true }),
        supabase.from('mcr_candidates').select('id', { count: 'exact', head: true }).eq('status', 'needs_review'),
        supabase.from('mcr_candidates').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('mcr_candidates').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('mcr_candidates').select('id', { count: 'exact', head: true }).eq('status', 'watchlist'),
        supabase.from('mcr_candidates').select('id', { count: 'exact', head: true }).gte('score_confidence', 85),
      ]);
      if (runsR.error) throwSb(runsR.error, 'kpis');
      return {
        totalRuns:               runsR.count      ?? 0,
        pendingReview:           pendingR.count    ?? 0,
        approved:                approvedR.count   ?? 0,
        published:               publishedR.count  ?? 0,
        watchlist:               watchlistR.count  ?? 0,
        highConfidenceCandidates: highR.count      ?? 0,
        dataSourcesHealthy:      MOCK_DATA_SOURCES.filter((s) => s.status === 'healthy').length,
        dataSourcesTotal:        MOCK_DATA_SOURCES.length,
      };
    },
    async () => delay({ ...MOCK_KPIS }),
  );
}

export async function fetchDataSources(): Promise<DataSourceStatus[]> {
  return [...MOCK_DATA_SOURCES];
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export async function fetchRuns(): Promise<ResearchRun[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase.from('mcr_runs').select('*').order('created_at', { ascending: false });
      if (error) throwSb(error, 'fetchRuns');
      return (data ?? []).map(mapRun);
    },
    async () => delay([..._runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  );
}

export async function fetchRun(id: string): Promise<ResearchRun | null> {
  return withFallback(
    async () => {
      const { data, error } = await supabase.from('mcr_runs').select('*').eq('id', id).maybeSingle();
      if (error) throwSb(error, 'fetchRun');
      return data ? mapRun(data) : null;
    },
    async () => delay(_runs.find((r) => r.id === id) ?? null),
  );
}

export async function createRun(input: CreateRunInput): Promise<ResearchRun> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('mcr_runs')
        .insert({
          title:               input.title,
          source_category:     input.sourceCategory,
          region:              input.region,
          country:             input.country,
          audience:            input.audience,
          requested_level:     input.requestedLevel,
          time_windows:        input.timeWindows,
          data_sources:        input.dataSources,
          benchmark_retailers: input.benchmarkRetailers ?? [],
          notes:               input.notes ?? null,
          status:              'draft',
          candidate_count:     0,
          pending_review_count: 0,
        })
        .select()
        .single();
      if (error) throwSb(error, 'createRun');
      return mapRun(data);
    },
    async () => {
      await delay(null, 500);
      const run: ResearchRun = {
        id: `run-${Date.now()}`,
        ...input,
        status: 'draft',
        createdAt: new Date().toISOString(),
        candidateCount: 0,
        pendingReviewCount: 0,
      };
      _runs = [run, ..._runs];
      return run;
    },
  );
}

export async function startRun(id: string): Promise<ResearchRun> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('mcr_runs').update({ status: 'running' }).eq('id', id).select().single();
      if (error) throwSb(error, 'startRun');
      return mapRun(data);
    },
    async () => {
      await delay(null, 400);
      _runs = _runs.map((r) => r.id === id ? { ...r, status: 'running' as const } : r);
      setTimeout(() => {
        _runs = _runs.map((r) =>
          r.id === id ? { ...r, status: 'completed' as const, completedAt: new Date().toISOString() } : r,
        );
      }, 3000);
      return _runs.find((r) => r.id === id)!;
    },
  );
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export async function fetchCandidates(runId?: string): Promise<CandidateCategory[]> {
  return withFallback(
    async () => {
      let q = supabase.from('mcr_candidates').select('*');
      if (runId) q = q.eq('run_id', runId);
      const { data, error } = await q.order('score_confidence', { ascending: false });
      if (error) throwSb(error, 'fetchCandidates');
      return (data ?? []).map(mapCandidate);
    },
    async () => {
      await delay(null, 300);
      const list = runId ? _candidates.filter((c) => c.runId === runId) : [..._candidates];
      return list.sort((a, b) => b.scores.confidence - a.scores.confidence);
    },
  );
}

export async function fetchCandidate(id: string): Promise<CandidateCategory | null> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('mcr_candidates').select('*, mcr_hot_products(*)').eq('id', id).maybeSingle();
      if (error) throwSb(error, 'fetchCandidate');
      return data ? mapCandidate(data) : null;
    },
    async () => delay(_candidates.find((c) => c.id === id) ?? null),
  );
}

export async function updateCandidateStatus(
  id: string,
  status: CandidateStatus,
  notes?: string,
): Promise<CandidateCategory> {
  return withFallback(
    async () => {
      const updates: Record<string, unknown> = { status };
      if (notes !== undefined) updates.review_notes = notes;
      if (status === 'approved' || status === 'rejected') updates.reviewed_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('mcr_candidates').update(updates).eq('id', id).select().single();
      if (error) throwSb(error, 'updateCandidateStatus');
      return mapCandidate(data);
    },
    async () => {
      await delay(null, 350);
      _candidates = _candidates.map((c) =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString(), reviewNotes: notes ?? c.reviewNotes } : c,
      );
      const updated = _candidates.find((c) => c.id === id)!;
      const runPending = _candidates.filter((c) => c.runId === updated.runId && c.status === 'needs_review').length;
      _runs = _runs.map((r) => r.id === updated.runId ? { ...r, pendingReviewCount: runPending } : r);
      return updated;
    },
  );
}

export async function sendToReview(id: string): Promise<CandidateCategory> {
  return updateCandidateStatus(id, 'needs_review');
}
export async function approveCandidate(id: string, notes?: string): Promise<CandidateCategory> {
  return updateCandidateStatus(id, 'approved', notes);
}
export async function rejectCandidate(id: string, notes?: string): Promise<CandidateCategory> {
  return updateCandidateStatus(id, 'rejected', notes);
}
export async function watchlistCandidate(id: string): Promise<CandidateCategory> {
  return updateCandidateStatus(id, 'watchlist');
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export async function fetchEvidence(candidateId?: string): Promise<Evidence[]> {
  return withFallback(
    async () => {
      let q = supabase.from('mcr_evidence').select('*');
      if (candidateId) q = q.eq('candidate_id', candidateId);
      const { data, error } = await q.order('fetched_at', { ascending: false });
      if (error) throwSb(error, 'fetchEvidence');
      return (data ?? []).map(mapEvidence);
    },
    async () => {
      await delay(null, 200);
      return candidateId ? _evidence.filter((e) => e.candidateId === candidateId) : [..._evidence];
    },
  );
}

// ─── Retailer Scans ───────────────────────────────────────────────────────────

export async function fetchRetailerScans(candidateId: string): Promise<RetailerScan[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('mcr_retailer_scans').select('*').eq('candidate_id', candidateId).order('confidence', { ascending: false });
      if (error) throwSb(error, 'fetchRetailerScans');
      return (data ?? []).map(mapRetailerScan);
    },
    async () => delay(_scans.filter((s) => s.candidateId === candidateId)),
  );
}

// ─── Review Queue ─────────────────────────────────────────────────────────────

export async function fetchReviewQueue(): Promise<CandidateCategory[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('mcr_candidates').select('*').eq('status', 'needs_review').order('score_confidence', { ascending: false });
      if (error) throwSb(error, 'fetchReviewQueue');
      return (data ?? []).map(mapCandidate);
    },
    async () => delay(_candidates.filter((c) => c.status === 'needs_review')),
  );
}

// ─── Publish ─────────────────────────────────────────────────────────────────

export async function fetchExistingCategories() {
  return [...EXISTING_CATEGORIES];
}

export async function publishCandidate(input: PublishInput): Promise<PublishLog> {
  return withFallback(
    async () => {
      const candidate = await fetchCandidate(input.candidateId);
      if (!candidate) throw new Error('Candidate not found');
      if (candidate.status !== 'approved') throw new Error('Only approved candidates can be published');

      const targetPath = input.parentCategoryName
        ? `${input.parentCategoryName} > ${candidate.nameEn}` : candidate.nameEn;
      const targetCategoryId = `cat-${candidate.nameEn.toLowerCase().replace(/\s+/g, '-')}-${candidate.id.slice(0, 8)}`;

      await supabase.from('mcr_candidates').update({
        status: 'published',
        published_category_id: targetCategoryId,
        published_at: new Date().toISOString(),
      }).eq('id', candidate.id);

      const { data: logRow, error: logErr } = await supabase
        .from('mcr_publish_logs')
        .insert({
          candidate_id:       candidate.id,
          candidate_name:     candidate.nameEn,
          published_at:       new Date().toISOString(),
          published_by:       'admin',
          target_category_id: targetCategoryId,
          target_path:        targetPath,
          seo_title:          input.seoTitle ?? null,
          parent_category_id: input.parentCategoryId ?? null,
        })
        .select().single();
      if (logErr) throwSb(logErr, 'publishCandidate');
      return mapPublishLog(logRow);
    },
    async () => {
      await delay(null, 600);
      const candidate = _candidates.find((c) => c.id === input.candidateId);
      if (!candidate) throw new Error('Candidate not found');
      if (candidate.status !== 'approved') throw new Error('Only approved candidates can be published');

      const log: PublishLog = {
        id: `pub-${Date.now()}`,
        candidateId: input.candidateId,
        candidateName: candidate.nameEn,
        publishedAt: new Date().toISOString(),
        publishedBy: 'admin@innoshop.com',
        targetCategoryId: `cat-${input.candidateId}`,
        targetPath: input.parentCategoryName
          ? `${input.parentCategoryName} > ${candidate.nameEn}` : candidate.nameEn,
      };
      _candidates = _candidates.map((c) =>
        c.id === input.candidateId
          ? { ...c, status: 'published' as const, publishedCategoryId: log.targetCategoryId, updatedAt: new Date().toISOString() }
          : c,
      );
      _publishLogs = [log, ..._publishLogs];
      return log;
    },
  );
}

export async function fetchPublishLogs(): Promise<PublishLog[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('mcr_publish_logs').select('*').order('published_at', { ascending: false });
      if (error) throwSb(error, 'fetchPublishLogs');
      return (data ?? []).map(mapPublishLog);
    },
    async () => delay([..._publishLogs]),
  );
}
