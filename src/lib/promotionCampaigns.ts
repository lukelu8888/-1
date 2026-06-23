import { toRegionCode } from './supabaseService';
import { supabase } from './supabase';

export type PromotionCampaignType = 'weekly' | 'flash' | 'seasonal' | 'container' | 'clearance' | 'holiday';
export type PromotionCampaignStatus = 'scheduled' | 'active' | 'ended';
export type PromotionCampaignPublicationStatus = 'draft' | 'published';
export type PromotionPopupStyle = 'hero-modal' | 'center-card' | 'top-bar' | 'corner';
export type PromotionPopupTrigger = 'homepage-delay' | 'immediate' | 'scroll-depth';
export type PromotionPopupFrequency = 'once-per-day' | 'once-per-campaign' | 'every-visit';
export type PromotionCampaignDiscountType = 'percent' | 'amount';

export interface PromotionCampaignProductOffer {
  discountType: PromotionCampaignDiscountType;
  discountValue: string;
  dealLabel: string;
  dealBadge: string;
  moq: string;
}

export interface PromotionCampaignDisplayConfig {
  placements: {
    homeDeals: boolean;
    dealsPageHero: boolean;
    popup: boolean;
  };
  popup: {
    enabled: boolean;
    style: PromotionPopupStyle;
    trigger: PromotionPopupTrigger;
    delayMs: number;
    scrollDepth: number;
    frequency: PromotionPopupFrequency;
    dismissBehavior: 'today' | 'campaign' | 'session';
    ctaTarget: 'deals' | 'campaign' | 'catalog';
    productPreviewCount: number;
  };
  productOffers?: Record<string, PromotionCampaignProductOffer>;
}

export interface PromotionCampaign {
  id: string;
  regionCode: string;
  name: string;
  type: PromotionCampaignType;
  startDate: string;
  endDate: string;
  headline: string;
  description: string;
  ctaText: string;
  bannerColor: string;
  productIds: string[];
  displayConfig: PromotionCampaignDisplayConfig;
  publicationStatus: PromotionCampaignPublicationStatus;
  publishedAt: string | null;
  createdAt: string;
}

const CAMPAIGNS_STORAGE_KEY = 'cosun_promotion_campaigns_v1';
const REGION_STORAGE_KEY = 'cosun-region';
export const PROMOTION_CAMPAIGNS_UPDATED_EVENT = 'cosun-promotion-campaigns-updated';

export const DEFAULT_PROMOTION_DISPLAY_CONFIG: PromotionCampaignDisplayConfig = {
  placements: {
    homeDeals: true,
    dealsPageHero: true,
    popup: false,
  },
  popup: {
    enabled: false,
    style: 'hero-modal',
    trigger: 'homepage-delay',
    delayMs: 1200,
    scrollDepth: 35,
    frequency: 'once-per-day',
    dismissBehavior: 'today',
    ctaTarget: 'deals',
    productPreviewCount: 4,
  },
};

const campaignLegacyBaseSelectColumns = 'id, region_code, name, type, start_date, end_date, headline, description, cta_text, banner_color, product_ids, created_at';
const campaignBaseSelectColumns = `${campaignLegacyBaseSelectColumns}, status, published_at`;
const campaignSelectColumns = `${campaignBaseSelectColumns}, display_config`;

const normalizeDisplayConfig = (input: Partial<PromotionCampaignDisplayConfig> | null | undefined): PromotionCampaignDisplayConfig => ({
  placements: {
    ...DEFAULT_PROMOTION_DISPLAY_CONFIG.placements,
    ...(input?.placements || {}),
  },
  popup: {
    ...DEFAULT_PROMOTION_DISPLAY_CONFIG.popup,
    ...(input?.popup || {}),
    delayMs: Math.max(Number(input?.popup?.delayMs ?? DEFAULT_PROMOTION_DISPLAY_CONFIG.popup.delayMs), 0),
    scrollDepth: Math.min(Math.max(Number(input?.popup?.scrollDepth ?? DEFAULT_PROMOTION_DISPLAY_CONFIG.popup.scrollDepth), 0), 100),
    productPreviewCount: Math.min(Math.max(Number(input?.popup?.productPreviewCount ?? DEFAULT_PROMOTION_DISPLAY_CONFIG.popup.productPreviewCount), 1), 8),
  },
  productOffers: Object.fromEntries(
    Object.entries(input?.productOffers || {}).map(([productId, offer]) => [
      productId,
      {
        discountType: offer?.discountType === 'amount' ? 'amount' : 'percent',
        discountValue: String(offer?.discountValue || ''),
        dealLabel: String(offer?.dealLabel || ''),
        dealBadge: String(offer?.dealBadge || ''),
        moq: String(offer?.moq || ''),
      },
    ]),
  ),
});

const normalizeCampaign = (campaign: Partial<PromotionCampaign>): PromotionCampaign => ({
  id: String(campaign.id || ''),
  regionCode: resolvePromotionRegionCode(campaign.regionCode),
  name: String(campaign.name || ''),
  type: campaign.type || 'weekly',
  startDate: String(campaign.startDate || ''),
  endDate: String(campaign.endDate || ''),
  headline: String(campaign.headline || ''),
  description: String(campaign.description || ''),
  ctaText: String(campaign.ctaText || 'Shop Now'),
  bannerColor: String(campaign.bannerColor || 'from-red-600 to-orange-500'),
  productIds: Array.isArray(campaign.productIds) ? campaign.productIds.map(String) : [],
  displayConfig: normalizeDisplayConfig(campaign.displayConfig),
  publicationStatus: campaign.publicationStatus === 'draft' ? 'draft' : 'published',
  publishedAt: campaign.publishedAt || null,
  createdAt: String(campaign.createdAt || new Date().toISOString()),
});

const rowToCampaign = (row: any): PromotionCampaign => normalizeCampaign({
  id: row.id,
  regionCode: row.region_code,
  name: row.name,
  type: row.type,
  startDate: row.start_date,
  endDate: row.end_date,
  headline: row.headline,
  description: row.description,
  ctaText: row.cta_text,
  bannerColor: row.banner_color,
  productIds: row.product_ids,
  displayConfig: row.display_config,
  publicationStatus: row.status,
  publishedAt: row.published_at,
  createdAt: row.created_at,
});

const campaignToRow = (campaign: PromotionCampaign) => ({
  id: campaign.id,
  region_code: resolvePromotionRegionCode(campaign.regionCode),
  name: campaign.name,
  type: campaign.type,
  start_date: campaign.startDate,
  end_date: campaign.endDate,
  headline: campaign.headline,
  description: campaign.description,
  cta_text: campaign.ctaText || 'Shop Now',
  banner_color: campaign.bannerColor || 'from-red-600 to-orange-500',
  product_ids: campaign.productIds || [],
  display_config: normalizeDisplayConfig(campaign.displayConfig),
  status: campaign.publicationStatus || 'published',
  published_at: campaign.publicationStatus === 'published'
    ? (campaign.publishedAt || new Date().toISOString())
    : null,
  created_at: campaign.createdAt || new Date().toISOString(),
});

const isMissingDisplayConfigColumn = (error: any) =>
  String(error?.message || error?.details || error || '').toLowerCase().includes('display_config');

const isMissingPublishColumns = (error: any) => {
  const message = String(error?.message || error?.details || error || '').toLowerCase();
  return message.includes('status') || message.includes('published_at');
};

const withPromotionRequestTimeout = async <T,>(
  request: Promise<T>,
  label: string,
  timeoutMs = 25_000,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

function cachePromotionCampaigns(campaigns: PromotionCampaign[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns.map(normalizeCampaign)));
  } catch {
    // localStorage can fail in private windows; Supabase remains the source of truth.
  }
}

export function loadPromotionCampaigns(): PromotionCampaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PromotionCampaign[]).map(normalizeCampaign).filter((campaign) => campaign.id) : [];
  } catch {
    return [];
  }
}

export async function loadPromotionCampaignsFromDatabase(options: { throwOnError?: boolean } = {}): Promise<PromotionCampaign[]> {
  let { data, error } = await supabase
    .from('promotion_campaigns')
    .select(campaignSelectColumns)
    .order('end_date', { ascending: true });

  if (error && isMissingPublishColumns(error)) {
    const legacy = await supabase
      .from('promotion_campaigns')
      .select(`${campaignLegacyBaseSelectColumns}, display_config`)
      .order('end_date', { ascending: true });
    data = legacy.data;
    error = legacy.error;
  }

  if (error && isMissingDisplayConfigColumn(error)) {
    const fallback = await supabase
      .from('promotion_campaigns')
      .select(isMissingPublishColumns(error) ? campaignLegacyBaseSelectColumns : campaignBaseSelectColumns)
      .order('end_date', { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.warn('Failed to load promotion campaigns from Supabase:', error.message);
    if (options.throwOnError) {
      throw new Error(`Failed to load promotion campaigns from Supabase: ${error.message}`);
    }
    return [];
  }

  const campaigns = (data || []).map(rowToCampaign).filter((campaign) => campaign.id);
  cachePromotionCampaigns(campaigns);
  return campaigns;
}

export async function persistPromotionCampaign(campaign: PromotionCampaign): Promise<void> {
  const normalized = normalizeCampaign(campaign);
  let { data, error } = await withPromotionRequestTimeout(
    supabase
      .from('promotion_campaigns')
      .upsert(campaignToRow(normalized), { onConflict: 'id' })
      .select(campaignSelectColumns)
      .single(),
    'Persist promotion campaign',
  );

  if (error && isMissingPublishColumns(error)) {
    const { status, published_at, ...legacyRow } = campaignToRow(normalized);
    const fallback = await withPromotionRequestTimeout(
      supabase
        .from('promotion_campaigns')
        .upsert(legacyRow, { onConflict: 'id' })
        .select(`${campaignLegacyBaseSelectColumns}, display_config`)
        .single(),
      'Persist promotion campaign without publish columns',
    );
    data = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingDisplayConfigColumn(error)) {
    const { display_config, ...legacyRow } = campaignToRow(normalized);
    const fallback = await withPromotionRequestTimeout(
      supabase
        .from('promotion_campaigns')
        .upsert(legacyRow, { onConflict: 'id' })
        .select(campaignBaseSelectColumns)
        .single(),
      'Persist promotion campaign fallback',
    );
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Failed to persist promotion campaign to Supabase: ${error.message}`);
  }

  const persisted = rowToCampaign(data);
  if (persisted.id !== normalized.id) {
    throw new Error('Failed to persist promotion campaign to Supabase: returned campaign id mismatch');
  }
  if (persisted.publicationStatus !== normalized.publicationStatus) {
    throw new Error('Failed to persist promotion campaign to Supabase: publication status mismatch');
  }
  if (persisted.displayConfig?.popup?.enabled !== normalized.displayConfig?.popup?.enabled) {
    throw new Error('Failed to persist promotion campaign to Supabase: popup enabled state mismatch');
  }

  const refreshed = await withPromotionRequestTimeout(
    supabase
      .from('promotion_campaigns')
      .select(campaignSelectColumns)
      .eq('id', normalized.id)
      .single(),
    'Verify promotion campaign persistence',
  );

  if (refreshed.error) {
    throw new Error(`Failed to verify promotion campaign in Supabase: ${refreshed.error.message}`);
  }
  const verified = rowToCampaign(refreshed.data);
  if (verified.publicationStatus !== normalized.publicationStatus) {
    throw new Error('Failed to verify promotion campaign in Supabase: publication status mismatch');
  }
  cachePromotionCampaigns(loadPromotionCampaigns().filter((item) => item.id !== verified.id).concat(verified));
}

export async function deletePromotionCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('promotion_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete promotion campaign from Supabase: ${error.message}`);
  }
}

export function resolvePromotionRegionCode(regionCode?: string | null) {
  if (regionCode) return toRegionCode(regionCode) || 'NA';
  if (typeof window === 'undefined') return 'NA';
  return toRegionCode(window.localStorage.getItem(REGION_STORAGE_KEY)) || 'NA';
}

export function getPromotionCampaignStatus(campaign: PromotionCampaign): PromotionCampaignStatus {
  const now = Date.now();
  const start = new Date(campaign.startDate).getTime();
  const end = new Date(campaign.endDate).getTime() + 86_400_000;
  if (now < start) return 'scheduled';
  if (now > end) return 'ended';
  return 'active';
}

const hasEnabledPromotionPopup = (campaign: PromotionCampaign) =>
  Boolean(campaign.displayConfig?.placements?.popup && campaign.displayConfig?.popup?.enabled);

const sortActivePromotionCampaigns = (a: PromotionCampaign, b: PromotionCampaign) => {
  const popupPriority = Number(hasEnabledPromotionPopup(b)) - Number(hasEnabledPromotionPopup(a));
  if (popupPriority !== 0) return popupPriority;
  const publishedPriority =
    new Date(b.publishedAt || b.createdAt || 0).getTime() -
    new Date(a.publishedAt || a.createdAt || 0).getTime();
  if (publishedPriority !== 0) return publishedPriority;
  return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
};

export function getActivePromotionCampaign(regionCode?: string | null): PromotionCampaign | null {
  const resolvedRegion = resolvePromotionRegionCode(regionCode);
  const activeCampaigns = loadPromotionCampaigns()
    .filter((campaign) => campaign.publicationStatus === 'published' && campaign.regionCode === resolvedRegion && getPromotionCampaignStatus(campaign) === 'active')
    .sort(sortActivePromotionCampaigns);

  return activeCampaigns[0] || null;
}

export function getBestActivePromotionCampaign(regionCode?: string | null): PromotionCampaign | null {
  const regionCampaign = getActivePromotionCampaign(regionCode);
  if (regionCampaign) return regionCampaign;

  const northAmericaCampaign = getActivePromotionCampaign('NA');
  if (northAmericaCampaign) return northAmericaCampaign;

  return loadPromotionCampaigns()
    .filter((campaign) => campaign.publicationStatus === 'published' && getPromotionCampaignStatus(campaign) === 'active')
    .sort(sortActivePromotionCampaigns)[0] || null;
}

export async function getBestActivePromotionCampaignAsync(regionCode?: string | null): Promise<PromotionCampaign | null> {
  const campaigns = await loadPromotionCampaignsFromDatabase();
  const resolvedRegion = resolvePromotionRegionCode(regionCode);
  const activeCampaigns = campaigns
    .filter((campaign) => campaign.publicationStatus === 'published' && getPromotionCampaignStatus(campaign) === 'active')
    .sort(sortActivePromotionCampaigns);

  return (
    activeCampaigns.find((campaign) => campaign.regionCode === resolvedRegion) ||
    activeCampaigns.find((campaign) => campaign.regionCode === 'NA') ||
    activeCampaigns[0] ||
    null
  );
}

export function getCampaignTimeRemaining(campaign: PromotionCampaign | null, now = Date.now()) {
  if (!campaign) return null;
  const end = new Date(campaign.endDate).getTime() + 86_400_000;
  const totalMs = Math.max(end - now, 0);
  const totalMinutes = Math.floor(totalMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes, totalMs };
}
