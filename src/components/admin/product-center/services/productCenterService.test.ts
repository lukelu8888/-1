import { describe, expect, it } from 'vitest';
import {
  computeRegionCost,
  suggestSalePrice,
  actualMargin,
  DEFAULT_DUTY_PERCENT,
} from '../context/costModel';
import {
  mockProductCenterService,
  getProductCenterService,
} from './productCenterService';

describe('cost model', () => {
  it('computes landed cost with default region duties and FX', () => {
    const cost = computeRegionCost('NA', { factoryCost: 100 });
    expect(cost.fxRate).toBe(1);
    expect(cost.dutyPercent).toBe(DEFAULT_DUTY_PERCENT.NA);
    expect(cost.landedCost).toBeGreaterThan(100);
    expect(cost.landedCost).toBe(
      Math.round((100 * (1 + DEFAULT_DUTY_PERCENT.NA)) * 100) / 100,
    );
  });

  it('computes landed cost with FX conversion + shipping + duty + local fee', () => {
    const cost = computeRegionCost('SA', {
      factoryCost: 100,
      fxRate: 5,
      shippingPerUnit: 50,
      dutyPercent: 0.18,
      localFee: 20,
    });
    // converted = 500; duty = (500+50)*0.18 = 99; landed = 500+50+99+20 = 669
    expect(cost.landedCost).toBe(669);
  });

  it('suggestSalePrice from landed cost given target margin', () => {
    const price = suggestSalePrice(100, 0.4); // target 40% margin → price = 166.67
    expect(price).toBeCloseTo(166.67, 2);
  });

  it('suggestSalePrice clamps target margin to a safe range', () => {
    expect(suggestSalePrice(100, 0.99)).toBeGreaterThan(0);
    expect(suggestSalePrice(100, -1)).toBe(100);
  });

  it('actualMargin returns null for missing inputs', () => {
    expect(actualMargin(undefined, 50)).toBeNull();
    expect(actualMargin(100, 0)).toBeNull();
    expect(actualMargin(100, 60)).toBeCloseTo(0.4, 4);
  });
});

describe('mockProductCenterService', () => {
  it('loadAll returns an empty snapshot with all keys present', async () => {
    const snap = await mockProductCenterService.loadAll!();
    expect(snap).toBeDefined();
    const keys = Object.keys(snap);
    expect(keys).toEqual(
      expect.arrayContaining([
        'products',
        'categories',
        'attributes',
        'attributeValues',
        'media',
        'suppliers',
        'regionPrices',
        'publishChannels',
        'campaigns',
        'campaignProducts',
        'mappings',
        'auditLogs',
        'priceHistory',
        'supplierQuotes',
        'reviewHistory',
      ]),
    );
    for (const key of keys) {
      expect(Array.isArray((snap as unknown as Record<string, unknown>)[key])).toBe(true);
    }
  });

  it('upsertProduct echoes input', async () => {
    const product = {
      id: 'p1',
      tenantId: 'tenant_default',
      sku: 'SKU-1',
      name: 'Test',
      status: 'draft' as const,
      reviewStatus: 'not_submitted' as const,
      campaignStatus: 'no_campaign' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    const out = await mockProductCenterService.upsertProduct(product);
    expect(out.sku).toBe('SKU-1');
  });

  it('rejectProduct logs reason in synthesized review entry', async () => {
    const entry = await mockProductCenterService.rejectProduct('p1', '缺少主图');
    expect(entry.toStatus).toBe('rejected');
    expect(entry.reason).toBe('缺少主图');
  });
});

describe('getProductCenterService', () => {
  it('returns mock impl when VITE_PC_BACKEND is not "supabase"', () => {
    const svc = getProductCenterService();
    // mock impl is a stable singleton; identity check is enough
    expect(svc).toBe(mockProductCenterService);
  });
});

describe('Phase 4d (mock impl)', () => {
  it('searchProducts returns substring matches when given a keyword', async () => {
    // pick any sku from the seed data and split it to a sub-fragment to
    // make sure the substring match path works.
    const sample = await mockProductCenterService.searchProducts({ limit: 5 });
    expect(sample.length).toBeGreaterThan(0);
    const fragment = sample[0].sku.slice(0, 3);

    const hits = await mockProductCenterService.searchProducts({ keyword: fragment });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((p) => p.sku.toLowerCase().includes(fragment.toLowerCase()))).toBe(true);
  });

  it('searchProducts returns the full set (capped by limit) when keyword is empty', async () => {
    const all = await mockProductCenterService.searchProducts({ limit: 3 });
    expect(all.length).toBeLessThanOrEqual(3);
  });

  it('exportProducts emits CSV-friendly rows with the expected keys', async () => {
    const rows = await mockProductCenterService.exportProducts({ region: 'NA' });
    expect(rows.length).toBeGreaterThan(0);
    const sample = rows[0];
    expect(Object.keys(sample)).toEqual(
      expect.arrayContaining([
        'sku',
        'name',
        'status',
        'reviewStatus',
        'region',
        'publishStatus',
        'updatedAt',
      ]),
    );
    // boolean / numeric / nullable fields are sane (not undefined)
    expect(typeof sample.homepageFeatured).toBe('boolean');
    expect(['number', 'object']).toContain(typeof sample.basePrice);
  });

  it('getAnalyticsRollup returns totals and per-region price summary', async () => {
    const rollup = await mockProductCenterService.getAnalyticsRollup();
    expect(rollup.totals.all).toBeGreaterThanOrEqual(rollup.totals.active);
    expect(rollup.dataQuality).toEqual(
      expect.objectContaining({
        missingImage: expect.any(Number),
        missingCategory: expect.any(Number),
        missingPrice: expect.any(Number),
      }),
    );
    // at least one of the three regions should have a price summary in
    // mock data; if none do this signals a regression in mockData seeds.
    const anyRegion =
      rollup.priceSummaryByRegion.NA ??
      rollup.priceSummaryByRegion.SA ??
      rollup.priceSummaryByRegion.EA;
    expect(anyRegion).toBeDefined();
    expect(anyRegion!.count).toBeGreaterThan(0);
  });

  it('getAnalyticsRollup honours the region filter', async () => {
    const rollup = await mockProductCenterService.getAnalyticsRollup({ region: 'NA' });
    expect(rollup.regionFilter).toBe('NA');
    // SA / EA buckets should not be filled when scoped to NA
    expect(rollup.priceSummaryByRegion.SA).toBeUndefined();
    expect(rollup.priceSummaryByRegion.EA).toBeUndefined();
  });

  it('bulkUpsertProducts validates required fields and unknown categories', async () => {
    // Use the first real SKU from the seed for the "update" path so we
    // don't hard-code a brittle string here.
    const { mockProducts } = await import('../context/mockData');
    const existingSku = mockProducts[0].sku;

    const res = await mockProductCenterService.bulkUpsertProducts([
      { sku: existingSku, name: 'updated' },
      { sku: 'IMPORT-NEW-001', name: '新产品' },
      { sku: '' },
      { sku: 'IMPORT-NEW-002' },
      { sku: 'IMPORT-NEW-003', name: 'X', primaryCategoryCode: '__notexist__' },
    ]);
    expect(res.created + res.updated).toBeGreaterThan(0);
    expect(res.errors.length).toBe(3);
    expect(res.errors.map((e) => e.index).sort()).toEqual([3, 4, 5]);
    expect(res.errors.find((e) => e.index === 3)?.message).toContain('missing-sku');
    expect(res.errors.find((e) => e.index === 4)?.message).toContain('missing-name');
    expect(res.errors.find((e) => e.index === 5)?.message).toContain('unknown-category-code');
  });
});
