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
