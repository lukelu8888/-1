# Architecture Baseline — InnoShop ERP V1.0

> ⚠️ This document defines the V1.0 system baseline. Do not violate these rules without explicit review.

---

## System Stage

**V1.0 — Complete.**
All future work is additive enhancement. The core flow, entity roles, status machines, profit model, FX model, and snapshot rules defined here are frozen and must not be changed without cross-layer review.

---

## 1. Core Flow (MUST NOT CHANGE)

```
SC (Sales Contract)
 └─► PR (Procurement Request)      ← requestProcurementFromContract()
      └─► CG × N (Supplier Orders) ← submitSupplierAllocation()
           └─► pushed_supplier      ← admin push after boss approval
```

**This is the only standard path.**
- Every PR must originate from an SC (`salesContractNumber` required).
- Every CG must originate from a PR (`parentRequestPoNumber = 'PR-...'` required).
- No SC → CG shortcut exists in the standard path.

---

## 2. Entity Roles

| Entity | Role | Identifier | Owner |
|--------|------|-----------|-------|
| **SC** | Contract record. Holds revenue, customer terms, final status, and profit snapshot. | `SC-{REGION}-{YYMMDD}-{seq}` | Salesperson |
| **PR** | Internal procurement request. Links SC to supplier execution. Holds allocation state. | `PR-{REGION}-{YYMMDD}-{seq}` | Salesperson (creates) / Admin (processes) |
| **CG** | Supplier execution order. Holds cost data, currency, and physical delivery state. | `CG-{REGION}-{YYMMDD}-{seq}` | Admin |

> Both PR and CG are stored in the `purchase_orders` table and distinguished by `poNumber` prefix and `procurementRequestStatus` values.

---

## 3. Status Ownership

### 3a. SC status — contract lifecycle (customer-facing + final control)

```
draft
 → pending_supervisor → pending_director
 → approved → sent → customer_confirmed
 → po_generated          ← automated: PR created (markPRInitiated)
 → production            ← automated: all CGs pushed_supplier (advanceSCToProduction)
 → balance_confirmed     ← manual: finance
 → shipped               ← manual: salesperson
 → completed             ← manual: salesperson (triggers profit snapshot)
```

Terminal states: `rejected`, `cancelled`, `customer_rejected`, `customer_requested_changes`

**SC mirrors CG execution up to `production` only.**
`shipped` and `completed` are salesperson-controlled. No automated CG → SC sync beyond `production`.

### 3b. PR `procurementRequestStatus` — allocation state

| Value | Meaning |
|-------|---------|
| `pending_procurement_assignment` | Created; no suppliers assigned yet |
| `partial_allocated` | Some lines have CGs; remainder pending |
| `allocated_completed` | All lines distributed to suppliers |

### 3c. CG `procurementRequestStatus` — execution state

| Value | Meaning |
|-------|---------|
| `draft_allocated` | Created; not yet submitted for boss review |
| `pending_boss_approval` | Submitted for review |
| `approved_boss` | Approved; ready to push |
| `rejected_boss` | Rejected; terminal failure — requires new PR |
| `pushed_supplier` | Transmitted to supplier; execution underway |

---

## 4. Profit Model

| Component | Source | Notes |
|-----------|--------|-------|
| **Revenue** | `SC.totalAmount` | SC currency |
| **Estimated profit** | Linked `SalesQuotation` (`totalCost`, `totalProfit`, `profitRate`) | Null if quotation absent or cost ≤ 0 |
| **Actual profit** | Sum of `CG.totalAmount` (converted to SC currency) + `SC.additionalCost` | Available only when all guards pass |
| **Profit snapshot** | Frozen copy at SC `completed` | See §6 |

### Actual profit guard sequence

1. **`no_cgs`** — no standard-path CG records linked to this SC → unavailable
2. **`zero_cost_cg`** — any CG has `totalAmount ≤ 0` → unavailable
3. **`missing_fx_rate`** — any foreign-currency CG lacks a valid FX rate → unavailable
4. All guards pass → compute actual profit

### `additionalCost`

`SC.additionalCost` is a salesperson-editable SC-level field for freight, duties, and misc costs. It is added to the CG cost sum after all guards pass. It does **not** compensate for zero-cost CGs (guard 2 fires first).

---

## 5. FX Model (Phase 8)

- FX rates live on the SC as `SC.fxRates: Record<string, number>`.
- **Convention:** `fxRates[foreignCurrency]` = units of that foreign currency per 1 SC-currency unit.
  - Example: SC is USD, `fxRates["CNY"] = 7.24` means 1 USD = 7.24 CNY.
- **Conversion:** `cgAmount / fxRates[cgCurrency]` = amount in SC currency.
- Same-currency CGs are never converted (pass through at 1:1).
- If a foreign-currency CG has no valid rate (`missing_fx_rate`), actual profit is unavailable until the rate is entered.

**Hard constraints:**
- No external FX API.
- No FX rate history.
- No CG-level FX rates (SC-level only).

---

## 6. Profit Snapshot Rules (Phase 7A)

- Written **once** when SC advances to `completed` via `advanceSCToCompleted`.
- Condition: `!sc.profitSnapshot && profit.actual.available === true`.
- Written atomically with the `completed` status in a single DB call.
- **Never overwritten.** If a snapshot already exists, it is never recalculated.
- **Not editable** by any user action.
- If actual profit is unavailable at completion time, snapshot is skipped (remains `null`). No retry or backfill.
- Displayed as **最终毛利** in the SC list — read-only, visually distinct from live actual profit.

### Snapshot fields

```typescript
interface ProfitSnapshot {
  finalRevenue:   number;   // SC.totalAmount at completion time
  finalCost:      number;   // actual cost (CG sum + additionalCost, FX-converted)
  finalProfit:    number;
  finalMargin:    number;   // decimal 0–1
  cgCount:        number;
  additionalCost: number;
  currency:       string;
  snapshotAt:     string;   // ISO 8601
}
```

---

## 7. Guardrails (Must Not Violate)

| Rule | Rationale |
|------|-----------|
| SC → PR → CG is the only standard path | Traceability, profit calculation, and SC status reflection all depend on this chain |
| No direct SC → CG | CGs without `parentRequestPoNumber` are invisible to `computeSCProfit` and profit snapshot |
| No CG → SC auto-sync beyond `production` | `shipped` and `completed` are customer-facing states; only the salesperson can confirm them |
| No modifying profit snapshot | Snapshot is the authoritative final record; editing it destroys audit integrity |
| No external FX API | FX rates are deal-specific and entered manually by the salesperson |
| No new procurement path without updating the full chain | PR is the formal procurement entry point; routing around it breaks SC write-back and CG grouping |
| Do not add SC/PR/CG statuses without cross-layer review | Status values appear in type unions, display configs, and filter logic across multiple files |

---

## 8. Legacy Path

`handleSubmitCreateOrder` in `PurchaseOrderManagementEnhanced.tsx` creates a CG directly from a `QuoteRequirement`, bypassing the PR tier.

- The resulting CG has **no** `parentRequestPoNumber` and no `salesContractNumber`.
- It is **invisible** to `computeSCProfit`, profit filters, and profit snapshot.
- SC status reflection does **not** trigger.
- The "直接下单" button is visually downgraded (outline/gray) to signal non-standard status.

**Enforcement (Phase 3d):** If the QR's referenced SC already has a standard PR (`poNumber.startsWith('PR-')` + matching `salesContractNumber`), the legacy path is **hard-blocked** at submit time with the message:

> "该合同已进入标准采购流程（PR），请通过PR分配生成CG，不可再使用直接下单。"

The legacy path remains available only as a fallback for QRs with no linked SC or no existing standard PR.

---

## 9. Key Typed Fields

All critical linkage fields are typed on `PurchaseOrder` in `PurchaseOrderContext.tsx`. No `as any` casts are permitted for these fields:

```typescript
salesContractNumber?: string;        // CG/PR → SC traceability
parentRequestPoNumber?: string;      // CG → PR backlink
procurementRequestStatus?: ...;      // PR and CG lifecycle state
xjNumber?: string;                   // CG/PR → XJ (supplier RFQ) reference
sourceSONumber?: string;             // alternate SC reference
quotationNumber?: string;            // PR → QT reference
```

---

## 10. Context Functions — Standard Path

| Function | File | Triggered by |
|----------|------|-------------|
| `requestProcurementFromContract` | `SalesContractManagement.tsx` | Salesperson clicks "请求采购" |
| `markPRInitiated` | `SalesContractContext.tsx` | Auto: after PR is persisted → SC → `po_generated` |
| `submitSupplierAllocation` | `PurchaseOrderManagementEnhanced.tsx` | Admin allocates suppliers to PR |
| `handlePushPurchaseToSupplier` | `PurchaseOrderManagementEnhanced.tsx` | Admin pushes CG(s) → `pushed_supplier` |
| `advanceSCToProduction` | `SalesContractContext.tsx` | Auto: all CGs pushed → SC → `production` |
| `confirmBalancePayment` | `SalesContractContext.tsx` | Finance confirms balance → SC → `balance_confirmed` |
| `advanceSCToShipped` | `SalesContractContext.tsx` | Salesperson manual action |
| `advanceSCToCompleted` | `SalesContractContext.tsx` | Salesperson manual action + writes profit snapshot |

---

## 11. DB Columns (sales_contracts)

Columns added by phases 6b–8. All are non-breaking (nullable or defaulted):

| Column | Type | Phase | Purpose |
|--------|------|-------|---------|
| `additional_cost` | `numeric DEFAULT 0` | 6b | SC-level freight/duty costs |
| `profit_snapshot` | `jsonb` | 7A | Frozen profit at completion |
| `fx_rates` | `jsonb DEFAULT '{}'` | 8 | Per-currency FX map |
