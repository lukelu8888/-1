# ⚠️ DEVELOPMENT GUARDRAILS (V1.0)

Before writing any code, you MUST follow these rules.
If a requested change violates any rule below, you MUST warn before proceeding.

---

## Core Architecture (MUST NOT BREAK)

- **SC → PR → CG is the only standard flow.**
  A Sales Contract initiates a Procurement Request. Admin creates Supplier Orders (CGs) from the PR. No other sequence is valid.
- **PR is mandatory before CG.**
  Every CG created via the standard path must have `parentRequestPoNumber = 'PR-...'`. A CG without this is legacy/non-standard.
- **No direct SC → CG creation.**
  Do not create CGs that bypass the PR layer. The PR is the formal linkage between SC and supplier execution.

---

## Profit System

- Do NOT modify profit calculation logic in `computeSCProfit` without explicit review.
- Do NOT mix AR (accounts receivable) data into profit figures.
- Do NOT fabricate or estimate profit when it is genuinely unavailable (guards exist for a reason).
- **Profit snapshot is final and immutable.** It is written once at SC `completed` and never overwritten or edited.

---

## FX Rules

- FX rates live on **SC only** (`SC.fxRates: Record<string, number>`).
- **No external FX API.** Rates are entered manually by the salesperson.
- **No FX history.** A single current rate per currency per SC.
- Conversion formula: `foreignAmount / fxRates[currency]` = SC-currency amount.
- Same-currency CGs are never converted.

---

## Status Rules

- **SC mirrors CG execution only up to `production`.** The automated mirror terminates at `advanceSCToProduction`.
- **`SC.shipped` and `SC.completed` are manual.** They are triggered by the salesperson only. Never auto-sync from CG state.
- Do NOT add values to `SC.status`, `procurementRequestStatus`, or `POStatus` without cross-layer review.

---

## Legacy Rules

- Legacy direct-CG path (`handleSubmitCreateOrder`) must NOT interfere with standard flow.
- Do NOT expand legacy usage. It is a fallback only.
- **Blocked if PR exists:** if the SC already has a standard PR, the legacy path is hard-blocked at submit time.

---

## Type Safety

- Do NOT introduce `as any` casts on core linkage fields:
  `salesContractNumber`, `parentRequestPoNumber`, `procurementRequestStatus`, `xjNumber`, `sourceSONumber`, `quotationNumber`.
- All SC/PR/CG linkage fields must be properly typed in `PurchaseOrder` interface.

---

## Forbidden Actions

- No schema redesign without migration file and review.
- No workflow redesign that adds or removes stages from SC → PR → CG.
- No hidden side effects in context functions (no status changes outside the documented trigger chain).
- No breaking changes to V1.0 entity interfaces, status machines, or profit model.
- No new procurement path that bypasses the PR layer.

---

## Quick Reference

```
Standard flow:
  SC ──► PR ──► CG(s) ──► pushed_supplier
       ↓               ↓
  po_generated      production  (automated)

Manual only:
  SC → shipped    (salesperson button)
  SC → completed  (salesperson button + writes profit snapshot)

Profit guards:
  no_cgs → zero_cost_cg → missing_fx_rate → ✓ compute actual

FX convention:
  fxRates["CNY"] = 7.24  →  1 USD = 7.24 CNY
  cost in USD = cnyCost / 7.24
```

Full baseline: [`ARCHITECTURE_BASELINE.md`](./ARCHITECTURE_BASELINE.md)
