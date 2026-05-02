/**
 * Phase 3 — composite cost model.
 *
 * Pricing Center asks: "given a factory cost in CNY, what does it actually
 * cost me to land a unit in NA / SA / EA, and what should I price it at?"
 *
 * Inputs are kept opt-in: when a number isn't supplied the calc falls back to
 * just the converted factory cost so partial data still produces useful output.
 */

import type { ProductCostBreakdown, RegionCode } from './types';

export interface RegionCostInputs {
  /** Factory cost in supplier currency (typically USD or CNY). */
  factoryCost: number;
  /** FX rate from supplier currency → region currency. Defaults: 1. */
  fxRate?: number;
  /** Per-unit shipping cost in region currency. */
  shippingPerUnit?: number;
  /** Duty as decimal (0.05 = 5%). */
  dutyPercent?: number;
  /** Misc local fee (port + warehouse + last-mile). */
  localFee?: number;
}

/**
 * Default duty assumptions per region. Tweakable via UI when actual rate is
 * known.
 */
export const DEFAULT_DUTY_PERCENT: Record<RegionCode, number> = {
  NA: 0.04,
  SA: 0.18, // South America averages high — Brazil import duty is ~16-22%
  EA: 0.06, // EU + Africa varies wildly; this is a conservative midpoint
};

/**
 * Default FX rates (relative to USD). Real app pulls from `pc_exchange_rates`.
 */
export const DEFAULT_FX_TO_REGION: Record<RegionCode, number> = {
  NA: 1, // USD → USD
  SA: 1, // USD → USD (most LATAM B2B contracts price in USD)
  EA: 0.92, // USD → EUR
};

export function computeRegionCost(
  region: RegionCode,
  inputs: RegionCostInputs,
): ProductCostBreakdown {
  const fxRate = inputs.fxRate ?? DEFAULT_FX_TO_REGION[region];
  const shippingPerUnit = inputs.shippingPerUnit ?? 0;
  const dutyPercent = inputs.dutyPercent ?? DEFAULT_DUTY_PERCENT[region];
  const localFee = inputs.localFee ?? 0;
  const converted = inputs.factoryCost * fxRate;
  const duty = (converted + shippingPerUnit) * dutyPercent;
  const landedCost =
    Math.round((converted + shippingPerUnit + duty + localFee) * 100) / 100;
  return {
    factoryCost: inputs.factoryCost,
    fxRate,
    shippingPerUnit,
    dutyPercent,
    localFee,
    landedCost,
  };
}

/**
 * Suggest a sales price for a target gross margin.
 * `targetMargin` is decimal (0.35 = 35% gross margin).
 */
export function suggestSalePrice(landedCost: number, targetMargin: number): number {
  const safe = Math.min(0.95, Math.max(0, targetMargin));
  const raw = landedCost / (1 - safe);
  return Math.round(raw * 100) / 100;
}

/** Compute realised margin from a sale price + landed cost. */
export function actualMargin(salePrice: number | null | undefined, landedCost: number) {
  if (!salePrice || !landedCost) return null;
  return (salePrice - landedCost) / salePrice;
}
