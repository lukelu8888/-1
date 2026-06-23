import type { CandidateStatus, RunStatus, EvidenceStatus, RiskLevel, OpportunityType } from '../types';

export function statusColor(status: CandidateStatus): string {
  switch (status) {
    case 'candidate': return 'bg-slate-100 text-slate-700';
    case 'needs_review': return 'bg-amber-100 text-amber-800';
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'watchlist': return 'bg-blue-100 text-blue-700';
    case 'published': return 'bg-purple-100 text-purple-800';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function statusLabel(status: CandidateStatus): string {
  switch (status) {
    case 'candidate': return 'Candidate';
    case 'needs_review': return 'Needs Review';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'watchlist': return 'Watchlist';
    case 'published': return 'Published';
    default: return status;
  }
}

export function runStatusColor(status: RunStatus): string {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-600';
    case 'running': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-emerald-100 text-emerald-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function runStatusLabel(status: RunStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'running': return 'Running';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    default: return status;
  }
}

export function evidenceStatusColor(status: EvidenceStatus): string {
  switch (status) {
    case 'market_verified': return 'bg-emerald-100 text-emerald-800';
    case 'cross_verified': return 'bg-emerald-100 text-emerald-700';
    case 'single_source': return 'bg-amber-100 text-amber-800';
    case 'fallback': return 'bg-slate-100 text-slate-400';
    case 'manual': return 'bg-blue-100 text-blue-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function evidenceStatusLabel(status: EvidenceStatus): string {
  switch (status) {
    case 'market_verified': return 'Market Verified';
    case 'cross_verified': return 'Cross Verified';
    case 'single_source': return 'Single Source ⚠';
    case 'fallback': return 'Fallback';
    case 'manual': return 'Manual';
    default: return status;
  }
}

export function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low': return 'bg-emerald-100 text-emerald-800';
    case 'medium': return 'bg-amber-100 text-amber-800';
    case 'high': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function opportunityTypeLabel(type: OpportunityType): string {
  switch (type) {
    case 'retailer_bestseller': return 'Retailer Bestseller';
    case 'search_trend': return 'Search Trend';
    case 'marketplace_gap': return 'Marketplace Gap';
    case 'seasonal_growth': return 'Seasonal Growth';
    case 'cross_category_expansion': return 'Cross-Category';
    case 'emerging_product': return 'Emerging Product';
    case 'competitor_category_match': return 'Competitor Match';
    case 'manual_research': return 'Manual Research';
    default: return type;
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-400';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    google_trends: 'Google Trends',
    merchant_center: 'Merchant Center',
    amazon_oe: 'Amazon OE',
    retailer_scan: 'Retailer Scan',
    google_shopping: 'Google Shopping',
    manual: 'Manual',
  };
  return map[source] ?? source;
}
