# Supplier Number Linkage Runbook

## Purpose

This runbook is for supplier-side order number tracing in the ERP, especially when a supplier sees a `CG` order but the "展开关联编号" area is empty, wrong, or leaking internal numbers.

It is designed to avoid repeating the same debugging detours.

## Scope

This document covers the supplier-visible numbering chain:

- `CG` supplier purchase order
- `XJ` supplier inquiry
- `BJ` supplier quotation

It explicitly excludes internal-only numbers from supplier display:

- `ING`
- `QR`
- `SC`
- `QT`
- `PR`
- `SO`

These internal numbers may still be used for tracing, but must not be shown on supplier pages.

## True Business Mainline

The intended upstream/downstream chain is:

`ING -> QR -> XJ -> BJ -> PR -> CG -> Supplier Portal`

For supplier display, the final visible output must be:

`CG -> XJ -> BJ`

## Source of Truth

### New orders

For newly generated `CG` records, supplier-visible numbers should already be persisted during `PR -> CG` generation.

Expected persisted fields:

- `purchase_order.documentRenderMeta.supplierPortalLinkage.supplierXjNo`
- `purchase_order.documentRenderMeta.supplierPortalLinkage.supplierBjNo`
- `purchase_order.documentRenderMeta.supplierPortalLinkage.supplierQuotationId`
- `purchase_order.documentDataSnapshot.editForm.xjNumber`
- `purchase_order.documentDataSnapshot.editForm.supplierQuotationNo`

### Historical orders

For older `CG` records, the chain may be incomplete. In that case:

1. Admin-side backfill should try to reconstruct and persist supplier `XJ/BJ`
2. Supplier-side page may use read-only inference as a temporary display fallback

Supplier-side pages must not be responsible for formally writing historical linkage back to `purchase_orders`.

## Current Implementation Notes

### Supplier-side display

Main file:

- `src/components/supplier/SupplierOrderManagementCenter.tsx`

Current behavior:

- Uses real `purchase_orders / CG`
- Only shows supplier-visible numbers
- Uses business-mainline inference when historical data is incomplete
- Does not write inferred linkage back from the supplier portal

### Admin-side persistence and backfill

Main file:

- `src/components/admin/PurchaseOrderManagementEnhanced.tsx`

Current behavior:

- New `PR -> CG` generation writes supplier linkage into `CG`
- Historical `CG` backfill logic attempts to persist missing supplier `XJ/BJ`

## Debugging Order

When supplier-side related numbers are missing, follow this order.

### Step 1: Confirm page data source

Verify that the supplier page is using real `CG/PO` data, not `accepted XJ` data.

If the supplier cannot even see the order, this is a data-source problem, not a linkage problem.

### Step 2: Confirm permission boundary

On supplier pages, verify that only these may be shown:

- `CG-...`
- `XJ-...`
- `BJ-...`

If `ING-...`, `SC-...`, `QT-...`, `PR-...`, or `SO-...` appears in UI, this is a permission/display bug.

### Step 3: Inspect the `CG` record

Check whether the `CG` already carries supplier linkage:

- `documentRenderMeta.supplierPortalLinkage`
- `documentDataSnapshot.editForm.xjNumber`
- `documentDataSnapshot.editForm.supplierQuotationNo`

If present and correct, supplier page should render them directly.

### Step 4: Trace from parent PR

If `CG` is missing supplier linkage, check:

- `parentRequestPoNumber`
- parent `PR` snapshot/edit form fields
- parent `PR` requirement references

### Step 5: Trace internal inquiry only as a bridge

If only `ING` remains in the historical chain, it can be used for tracing but not display.

Typical historical pattern:

- `CG.xjNumber` or `editForm.xjNumber` contains `ING-...`
- supplier page must infer the matching supplier `XJ/BJ`
- supplier page still must not display `ING`

### Step 6: Match supplier-side XJ/BJ

Try matching using:

- `supplier_xjs.source_inquiry_number`
- `supplier_xjs.source_ref`
- `supplier_xjs.source_qr_number`
- `supplier_xjs.requirement_no`
- `supplier_quotations.sourceXJ`
- `supplier_quotations.sourceXJNumber`
- `supplier_quotations.requirementNo`

### Step 7: If historical chain is incomplete

If the page can infer the correct supplier `XJ/BJ` but the `CG` does not store them:

- admin side should backfill and persist
- supplier side may temporarily infer for display

## Common Failure Modes

### 1. Wrong data source

Symptom:

- Supplier active orders show `0`
- But purchasing side already created `CG`

Cause:

- Supplier page still bound to old `accepted XJ` logic

Fix:

- Use real `purchase_orders / CG`

### 2. Internal number leakage

Symptom:

- Supplier page shows `ING` under related numbers

Cause:

- Internal tracing value accidentally reused as display value

Fix:

- Hard filter supplier-visible output to `CG/XJ/BJ` only

### 3. Historical CG missing supplier linkage

Symptom:

- Supplier page shows `展开关联编号（0）`
- But upstream supplier `XJ/BJ` clearly exists

Cause:

- Old `CG` was generated before supplier linkage persistence was added

Fix:

- Admin-side backfill
- Supplier-side read-only inference as fallback

### 4. Supplier page tries to backfill data

Symptom:

- `400` or `403` on `purchase_orders` update

Cause:

- Supplier page is attempting to write inferred linkage back

Fix:

- Remove write-back from supplier page
- Move persistence to admin-side flow

### 5. React initialization errors

Symptom:

- `Cannot access 'xxx' before initialization`

Cause:

- Helper ordering issue after adding new callbacks

Fix:

- Check callback definition order
- Avoid referencing later helpers from earlier callbacks unless guaranteed safe

## Lessons Learned

### Do

- Separate "display issue" from "source data issue"
- Follow the business mainline first
- Persist supplier `XJ/BJ` at generation time
- Use supplier-side inference only as fallback
- Keep permission filtering strict at the final render layer

### Do not

- Assume one field like `xjNumber` is always reliable
- Expose internal numbers just because they help tracing
- Let supplier-side pages become formal backfill writers
- Treat a successful UI render as proof that source data is complete

## Release Gate

Do not consider this area release-ready until all three are true:

1. New `PR -> CG` records persist supplier `XJ/BJ`
2. Historical `CG` records can be backfilled from admin-side flow
3. Supplier-side pages show only `CG/XJ/BJ` with no runtime errors

## Fast Checklist

Use this when a supplier reports "关联编号不对" or "关联编号为空".

1. Can supplier see the `CG` order at all?
2. Does the page show only `CG/XJ/BJ`?
3. Does the `CG` record already carry `supplierPortalLinkage`?
4. Does parent `PR` carry enough lineage to reconstruct it?
5. Does supplier `XJ` exist and match the chain?
6. Does supplier `BJ` exist and match that `XJ`?
7. Is this a historical `CG` needing admin-side backfill?

## Recommended Next Rule

If a supplier page can infer a correct `XJ/BJ`, that is enough for temporary display.

If the same case is expected to recur, it should be fixed in admin-side persistence, not left as permanent UI-only inference.
