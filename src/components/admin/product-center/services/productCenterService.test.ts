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
  computeTierIssues,
} from './productCenterService';
import type { ProductTierPrice } from '../context/types';

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

describe('Phase 5a (mock impl)', () => {
  it('uploadMedia returns a media row with a session blob URL and forwards file metadata', async () => {
    const file = new File(['hello'], 'hero.png', { type: 'image/png' });
    const created = await mockProductCenterService.uploadMedia({
      productId: 'p_test',
      kind: 'main',
      file,
      altText: 'Hero shot',
      sortOrder: 0,
    });
    expect(created.productId).toBe('p_test');
    expect(created.kind).toBe('main');
    expect(created.altText).toBe('Hero shot');
    expect(created.fileSize).toBe(file.size);
    // jsdom in vitest exposes URL.createObjectURL → blob: URL.
    expect(created.url.startsWith('blob:') || created.url.startsWith('mock://')).toBe(true);
    expect(typeof created.id).toBe('string');
    expect(created.id.length).toBeGreaterThan(0);
  });

  it('removeMediaFile is a no-op for non-blob URLs and does not throw', async () => {
    await expect(
      mockProductCenterService.removeMediaFile({
        id: 'pm1',
        productId: 'p_test',
        kind: 'main',
        url: 'https://cdn.example.com/foo.jpg',
        sortOrder: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }),
    ).resolves.toBeUndefined();
  });

  it('uploadMedia derives altText from filename when none supplied', async () => {
    const file = new File(['x'], 'product-shot-01.jpg', { type: 'image/jpeg' });
    const created = await mockProductCenterService.uploadMedia({
      productId: 'p_test',
      kind: 'detail',
      file,
    });
    // Strips the extension but keeps the rest of the filename.
    expect(created.altText).toBe('product-shot-01');
  });
});

// ─── Phase 5b: B2B tier prices ─────────────────────────────────────────────

function makeTier(over: Partial<ProductTierPrice>): ProductTierPrice {
  return {
    id: over.id ?? 't',
    productId: 'p_001',
    regionCode: 'NA',
    minQty: 100,
    maxQty: null,
    unitPrice: 10,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
    ...over,
  };
}

describe('Phase 5b — computeTierIssues', () => {
  it('reports tier-below-moq when the lowest tier is below MOQ', () => {
    const issues = computeTierIssues(
      [makeTier({ minQty: 50, maxQty: 200 }), makeTier({ id: 't2', minQty: 200, maxQty: null })],
      100,
    );
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('tier-below-moq');
    expect(issues.find((i) => i.code === 'tier-below-moq')?.severity).toBe('error');
  });

  it('warns when no tier has an open-ended top (max_qty = null)', () => {
    const issues = computeTierIssues(
      [
        makeTier({ id: 't1', minQty: 100, maxQty: 500 }),
        makeTier({ id: 't2', minQty: 500, maxQty: 1000 }),
      ],
      100,
    );
    expect(issues.some((i) => i.code === 'no-open-top-tier' && i.severity === 'warning')).toBe(
      true,
    );
  });

  it('warns when adjacent tiers are not continuous (gap)', () => {
    const issues = computeTierIssues(
      [
        makeTier({ id: 't1', minQty: 100, maxQty: 500 }),
        makeTier({ id: 't2', minQty: 1000, maxQty: null }),
      ],
      100,
    );
    expect(issues.some((i) => i.code === 'tier-gap-or-overlap')).toBe(true);
  });

  it('reports duplicate-min-qty as error', () => {
    const issues = computeTierIssues(
      [
        makeTier({ id: 't1', minQty: 100, maxQty: 500 }),
        makeTier({ id: 't2', minQty: 100, maxQty: null }),
      ],
      100,
    );
    expect(issues.some((i) => i.code === 'duplicate-min-qty' && i.severity === 'error')).toBe(
      true,
    );
  });

  it('returns empty for a clean ladder at MOQ', () => {
    const issues = computeTierIssues(
      [
        makeTier({ id: 't1', minQty: 100, maxQty: 500 }),
        makeTier({ id: 't2', minQty: 500, maxQty: null }),
      ],
      100,
    );
    expect(issues).toEqual([]);
  });
});

describe('Phase 5b — getEffectiveTierPrice (mock)', () => {
  it('hits the lowest tier when qty is at MOQ', async () => {
    // p_001 NA seed: 100/500/1500/5000
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_001',
      region: 'NA',
      qty: 100,
    });
    expect(r.source).toBe('tier');
    expect(r.minQty).toBe(100);
    expect(r.unitPrice).toBe(19.99);
    expect(r.currency).toBe('USD');
  });

  it('selects the highest matching tier when qty straddles multiple', async () => {
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_001',
      region: 'NA',
      qty: 2000,
    });
    expect(r.source).toBe('tier');
    expect(r.minQty).toBe(1500);
    expect(r.unitPrice).toBe(15.5);
  });

  it('selects the open-ended top tier for very large qty', async () => {
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_001',
      region: 'NA',
      qty: 100000,
    });
    expect(r.source).toBe('tier');
    expect(r.minQty).toBe(5000);
    expect(r.maxQty).toBeNull();
    expect(r.unitPrice).toBe(13.8);
  });

  it("returns source='none' with reason='below-moq' when qty < MOQ", async () => {
    // p_001 MOQ = 100
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_001',
      region: 'NA',
      qty: 50,
    });
    expect(r.source).toBe('none');
    expect(r.reason).toBe('below-moq');
    expect(r.moq).toBe(100);
  });

  it("falls back to source='base' when qty ≥ MOQ but no tiers exist for the region", async () => {
    // p_003 has region prices but no tier prices in seed; MOQ = 20
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_003',
      region: 'NA',
      qty: 100,
    });
    expect(r.source).toBe('base');
    expect(r.unitPrice).toBe(299);
  });

  it("returns source='none' with reason='no-region-price' when no region price either", async () => {
    // p_004 has no NA region price seed
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_004',
      region: 'NA',
      qty: 1000,
    });
    expect(r.source).toBe('none');
    expect(r.reason).toBe('no-region-price');
  });

  it('returns source=none with reason=qty-required for invalid qty', async () => {
    const r = await mockProductCenterService.getEffectiveTierPrice({
      productId: 'p_001',
      region: 'NA',
      qty: 0,
    });
    expect(r.source).toBe('none');
    expect(r.reason).toBe('qty-required');
  });
});

describe('Phase 5b — validateTierPrices (mock)', () => {
  it('returns no issues for the clean p_001 NA seed', async () => {
    const issues = await mockProductCenterService.validateTierPrices({
      productId: 'p_001',
      region: 'NA',
    });
    expect(issues).toEqual([]);
  });

  it('returns no issues for an empty region (no tiers configured yet)', async () => {
    const issues = await mockProductCenterService.validateTierPrices({
      productId: 'p_003',
      region: 'NA',
    });
    expect(issues).toEqual([]);
  });
});
