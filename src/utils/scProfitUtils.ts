/**
 * SC profit layer — Phase 6a
 *
 * Pure computation utility. No side effects, no context subscriptions.
 *
 * Revenue source   : SC.totalAmount
 * Estimated source : SalesQuotation.totalCost / totalProfit / profitRate
 * Actual source    : standard-path CG records only
 *                    (poNumber starts with 'CG-' AND salesContractNumber === sc.contractNumber)
 *
 * Phase 5 rule respected: this utility is read-only derived data. It does not
 * write any SC status or add new state transitions.
 *
 * Phase 8: mixed-currency CG sets are now computable when sc.fxRates is populated.
 *
 * Intentionally deferred:
 *   - Freight / duty costs (no field exists yet)
 *   - Legacy CG inclusion (no salesContractNumber → excluded by design)
 *   - Profit snapshots / DB persistence
 *   - AR-based cash recognition
 */

import type { SalesContract } from '../contexts/SalesContractContext';
import type { PurchaseOrder as PurchaseOrderType } from '../contexts/PurchaseOrderContext';

// ── Minimal QT input shape ────────────────────────────────────────────────────
/**
 * Profit fields from SalesQuotation after context normalisation.
 * profitRate is in PERCENT units as returned by useSalesQuotations()
 * (e.g. 18 means 18%, not 0.18 — the context applies normalizeProfitRatePercent).
 */
export interface QTProfitFields {
  totalCost:   number;
  totalProfit: number;
  profitRate:  number; // percent, e.g. 18 → 18%
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface EstimatedProfit {
  estimatedCost:   number;
  estimatedProfit: number;
  estimatedMargin: number; // decimal 0–1 (e.g. 0.18 for 18%)
}

export type ActualProfitUnavailableReason =
  | 'no_cgs'           // no standard-path CG records linked to this SC
  | 'zero_cost_cg'     // one or more CGs have totalAmount === 0
  | 'missing_fx_rate'  // Phase 8: one or more foreign-currency CGs have no valid FX rate on the SC
  | 'mixed_currency';  // @deprecated — kept for backward compatibility; new logic returns 'missing_fx_rate'

export interface ActualProfitAvailable {
  available:    true;
  actualCost:   number;
  actualProfit: number;
  actualMargin: number; // decimal 0–1
  cgCount:      number;
}

export interface ActualProfitUnavailable {
  available: false;
  reason:    ActualProfitUnavailableReason;
  cgCount:   number;
}

export type ActualProfit = ActualProfitAvailable | ActualProfitUnavailable;

export interface SCProfitResult {
  /** null when the linked quotation is not found or has totalCost <= 0. */
  estimated: EstimatedProfit | null;
  actual:    ActualProfit;
}

// ── Display text for unavailable states ──────────────────────────────────────

export const ACTUAL_UNAVAILABLE_LABEL: Record<ActualProfitUnavailableReason, string> = {
  no_cgs:           '暂无实际数据',
  zero_cost_cg:     '成本未完整录入',
  missing_fx_rate:  '请填写汇率',       // Phase 8
  mixed_currency:   '币种不一致',       // @deprecated fallback
};

export const ACTUAL_UNAVAILABLE_TOOLTIP: Record<ActualProfitUnavailableReason, string> = {
  no_cgs:           '尚无标准路径采购单（CG）关联此合同',
  zero_cost_cg:     '部分采购单金额为零，无法计算实际利润',
  missing_fx_rate:  '存在外币采购单，请在利润栏填写对应汇率后自动计算', // Phase 8
  mixed_currency:   '采购单币种与合同币种不同，暂不支持自动换算',      // @deprecated fallback
};

// Phase 6c: icon prefix for unavailable reason labels.
// ⏳ = waiting for data to arrive; ⚠ = data present but invalid/incomplete.
export const ACTUAL_UNAVAILABLE_ICON: Record<ActualProfitUnavailableReason, string> = {
  no_cgs:           '⏳',  // no CGs yet — waiting
  zero_cost_cg:     '⚠',  // CGs exist but cost is zero
  missing_fx_rate:  '💱',  // Phase 8: FX rate needed
  mixed_currency:   '⚠',  // @deprecated fallback
};

// ── Main computation ──────────────────────────────────────────────────────────

/**
 * Compute estimated and actual profit for a Sales Contract.
 *
 * @param sc        The Sales Contract record.
 * @param quotation The linked SalesQuotation profit fields (from getQuotationByNumber),
 *                  or null/undefined when the quotation is not found.
 * @param allPOs    Full purchaseOrders array from usePurchaseOrders().
 *                  Filtered internally; only standard-path CGs for this SC are used.
 */
export function computeSCProfit(
  sc:        SalesContract,
  quotation: QTProfitFields | null | undefined,
  allPOs:    PurchaseOrderType[],
): SCProfitResult {

  // ── Estimated profit (SalesQuotation → totalCost / totalProfit / profitRate) ─
  let estimated: EstimatedProfit | null = null;
  if (quotation && quotation.totalCost > 0) {
    estimated = {
      estimatedCost:   quotation.totalCost,
      estimatedProfit: quotation.totalProfit,
      estimatedMargin: quotation.profitRate / 100, // percent → decimal
    };
  }

  // ── Actual profit (standard-path CG records) ──────────────────────────────
  // Linkage: Phase 3b sets salesContractNumber on CG records during submitSupplierAllocation.
  // Legacy CGs (handleSubmitCreateOrder) have no salesContractNumber — excluded by design.
  const scContractNumber = String(sc.contractNumber || '').trim();
  const cgs = allPOs.filter(
    (po) =>
      String(po.salesContractNumber || '').trim() === scContractNumber &&
      String(po.poNumber || '').trim().startsWith('CG-'),
  );

  const cgCount = cgs.length;

  // Guard 1: at least one standard-path CG must exist
  if (cgCount === 0) {
    return {
      estimated,
      actual: { available: false, reason: 'no_cgs', cgCount: 0 },
    };
  }

  // Guard 2: every CG must have a recorded cost (non-zero totalAmount)
  const hasZeroCost = cgs.some((cg) => (cg.totalAmount ?? 0) <= 0);
  if (hasZeroCost) {
    return {
      estimated,
      actual: { available: false, reason: 'zero_cost_cg', cgCount },
    };
  }

  // Guard 3 / Phase 8: convert foreign-currency CGs using sc.fxRates.
  // Same-currency CGs pass through at 1:1 — logic unchanged from prior phases.
  // For each CG whose currency differs from the SC currency:
  //   - require sc.fxRates[cgCurrency] to be a finite number > 0
  //   - if any needed rate is absent or invalid, actual profit is unavailable
  // Convention: fxRates[foreignCcy] = units of foreign currency per 1 SC-currency unit
  // Conversion: foreignAmount / fxRates[foreignCcy] = amount in SC currency
  const scCurrency = String(sc.currency || '').toUpperCase();
  const fxRates    = sc.fxRates ?? {};

  const foreignCGs = cgs.filter(
    (cg) => String(cg.currency || '').toUpperCase() !== scCurrency,
  );
  if (foreignCGs.length > 0) {
    const missingRate = foreignCGs.some((cg) => {
      const rate = fxRates[String(cg.currency || '').toUpperCase()];
      return !rate || rate <= 0;
    });
    if (missingRate) {
      return {
        estimated,
        actual: { available: false, reason: 'missing_fx_rate', cgCount },
      };
    }
  }

  // All guards passed — compute actual profit
  //
  // Phase 6b: SC-level additional cost (freight, duties, misc).
  // ⚠️ additionalCost does NOT compensate missing CG cost — if any CG has
  //    totalAmount ≤ 0 the zero_cost_cg guard fires above before reaching here.
  //
  // Phase 8: foreign-currency CG amounts are converted to SC currency via fxRates.
  const additionalCost = Math.max(0, sc.additionalCost ?? 0);
  const actualCost = cgs.reduce((sum, cg) => {
    const cgCurrency = String(cg.currency || '').toUpperCase();
    const amount     = cg.totalAmount ?? 0;
    if (cgCurrency === scCurrency) {
      return sum + amount;
    }
    // Rate already validated above — safe to divide.
    return sum + amount / fxRates[cgCurrency];
  }, 0) + additionalCost;
  const revenue      = sc.totalAmount ?? 0;
  const actualProfit = revenue - actualCost;
  const actualMargin = revenue > 0 ? actualProfit / revenue : 0;

  return {
    estimated,
    actual: {
      available: true,
      actualCost,
      actualProfit,
      actualMargin,
      cgCount,
    },
  };
}
