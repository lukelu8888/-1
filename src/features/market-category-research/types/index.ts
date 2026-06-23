// ─── Run ────────────────────────────────────────────────────────────────────

export type RunStatus = 'draft' | 'running' | 'completed' | 'failed';

export type TimeWindow = '10Y' | '5Y' | '3Y' | '1Y' | '3M';

export type DataSourceType =
  | 'google_trends'
  | 'merchant_center'
  | 'amazon_oe'
  | 'retailer_scan'
  | 'google_shopping'
  | 'manual';

export type RequestedLevel = 'L1' | 'L2' | 'L3' | 'L4';

export type AudienceType = 'b2b' | 'b2c' | 'both';

export interface ResearchRun {
  id: string;
  title: string;
  sourceCategory: string;
  region: string;
  country: string;
  audience: AudienceType;
  requestedLevel: RequestedLevel;
  timeWindows: TimeWindow[];
  dataSources: DataSourceType[];
  benchmarkRetailers: string[];
  notes?: string;
  status: RunStatus;
  createdAt: string;
  completedAt?: string;
  candidateCount: number;
  pendingReviewCount: number;
}

export interface CreateRunInput {
  title: string;
  sourceCategory: string;
  region: string;
  country: string;
  audience: AudienceType;
  requestedLevel: RequestedLevel;
  timeWindows: TimeWindow[];
  dataSources: DataSourceType[];
  benchmarkRetailers: string[];
  notes?: string;
}

// ─── Candidate ───────────────────────────────────────────────────────────────

export type CandidateStatus =
  | 'candidate'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'watchlist'
  | 'published';

export type RiskLevel = 'low' | 'medium' | 'high';

export type OpportunityType =
  | 'retailer_bestseller'
  | 'search_trend'
  | 'marketplace_gap'
  | 'seasonal_growth'
  | 'cross_category_expansion'
  | 'emerging_product'
  | 'competitor_category_match'
  | 'manual_research';

export interface CandidateScores {
  confidence: number; // 0-100
  trend: number;
  demand: number;
  competition: number;
  market_fit: number;
  seasonality: number;
}

export interface TrendDataPoint {
  period: string;
  value: number;
}

export interface TrendWindow {
  window: TimeWindow;
  data: TrendDataPoint[];
  peakPeriod?: string;
  yoy?: number; // year-over-year %
}

export interface CandidateCategory {
  id: string;
  runId: string;
  nameZh: string;
  nameEn: string;
  suggestedLevel: RequestedLevel;
  region: string;
  country: string;
  audience: AudienceType;
  scores: CandidateScores;
  riskLevel: RiskLevel;
  status: CandidateStatus;
  opportunityTypes: OpportunityType[];
  evidenceCount: number;
  trendWindows: TrendWindow[];
  hotProducts: HotProduct[];
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
  publishedCategoryId?: string;
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export type EvidenceStatus =
  | 'market_verified'
  | 'cross_verified'
  | 'single_source'
  | 'fallback'
  | 'manual';

export interface Evidence {
  id: string;
  candidateId: string;
  source: DataSourceType;
  sourceLabel: string;
  title: string;
  summary: string;
  evidenceStatus: EvidenceStatus;
  fetchedAt: string;
  rawPayloadHash: string;
  url?: string;
  metrics?: Record<string, string | number>;
}

// ─── Retailer Scan ───────────────────────────────────────────────────────────

export interface RetailerScan {
  id: string;
  candidateId: string;
  retailer: string;
  retailerLogo?: string;
  categoryPath: string;
  productCount: number;
  bestsellerRank?: number;
  avgRating?: number;
  reviewCount?: number;
  priceMin?: number;
  priceMax?: number;
  priceCurrency: string;
  promotionSignal: boolean;
  seasonalSignal: boolean;
  sourceUrl: string;
  fetchedAt: string;
  confidence: number; // 0-100
}

// ─── Hot Product Sample ──────────────────────────────────────────────────────

export interface HotProduct {
  id: string;
  candidateId: string;
  name: string;
  retailer: string;
  price: number;
  currency: string;
  rank?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

// ─── Data Source Health ──────────────────────────────────────────────────────

export type SourceHealth = 'healthy' | 'degraded' | 'offline';

export interface DataSourceStatus {
  id: DataSourceType;
  label: string;
  health: SourceHealth;
  lastSyncAt: string;
  recordsToday: number;
  latencyMs?: number;
  notes?: string;
}

// ─── Overview KPIs ───────────────────────────────────────────────────────────

export interface OverviewKPIs {
  totalRuns: number;
  pendingReview: number;
  approved: number;
  published: number;
  watchlist: number;
  highConfidenceCandidates: number;
  dataSourcesHealthy?: number;
  dataSourcesTotal?: number;
}

// ─── Publish ─────────────────────────────────────────────────────────────────

export interface PublishInput {
  candidateId: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PublishLog {
  id: string;
  candidateId: string;
  candidateName: string;
  publishedAt: string;
  publishedBy: string;
  targetCategoryId: string;
  targetPath: string;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export type MCRPage =
  | 'overview'
  | 'runs'
  | 'runs-new'
  | 'run-detail'
  | 'candidates'
  | 'candidate-detail'
  | 'evidence'
  | 'review-queue'
  | 'publish'
  | 'data-sources';

export interface MCRNavState {
  page: MCRPage;
  runId?: string;
  candidateId?: string;
}
