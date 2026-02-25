# Client ERP Phase 1 Tasklist (File-Level)

## Scope
- Based on `/Users/luke/Documents/New project 2/innoshop_react20260221/src/docs/client-erp-system-blueprint.md`
- Goal: stabilize ERP core base without changing/removing existing left sidebar modules.

## A. Core Governance Base

### A1. Tombstone permanent-delete base (global)
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/deletion-tombstone.ts`
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/InquiryContext.tsx`
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/OrderContext.tsx`
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/QuotationContext.tsx`

### A2. ID mapping base (internal/external)
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/id-mapping.ts`
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/types.ts`

### A3. Sync policy skeleton
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/sync-policy.ts`

## B. Customer Dashboard Domain Fixes (Phase 1)

### B1. Inquiry list consistency
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/InquiryManagement.tsx`
  - Tombstone filtering
  - External ERP number display
  - Batch delete behavior aligned

### B2. Quotation list consistency
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/QuotationReceived.tsx`
  - Tombstone filtering unified
  - Delete flow unified (backend + local tombstone)
  - External ERP number display

### B3. Active Orders consistency
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/ActiveOrders.tsx`
  - Tombstone filtering
  - Batch delete behavior aligned
  - External ERP number display

### B4. Completed Orders consistency
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/OrderHistory.tsx`
  - Tombstone filtering
  - External ERP number display
  - Runtime crash risk cleanup (`setHistoricalOrders` undefined path)

### B5. Create Order draft consistency
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/CreateOrder.tsx`
  - Tombstone filtering for drafts
  - Tombstone write on manual delete
  - External ERP number display

### B6. Tracking consistency
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/OrderTracking.tsx`
  - Real-data cards + unified filters
  - Inquiry/Quotation/Order stats filtered by tombstone
  - External ERP number-aware lookup/search

### B7. My Documents real data
- [x] `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/MyDocuments.tsx`
  - Real records derived from contexts
  - External ERP number display

## C. Pending Tasks (Next Execution Order)

### C1. Deletion policy service hardening (cross-page)
- [x] Create unified delete guard utility:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/delete-guard.ts`
- [x] Centralize "cannot delete if progressed to final workflow" checks.
  - Integrated in:
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/InquiryManagement.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/QuotationReceived.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/ActiveOrders.tsx`

### C2. Number mapping UX standardization
- [x] Add common rendering helper:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/number-display.ts`
- [x] Replace duplicated inline mapping rendering across core dashboard pages.
  - Integrated in:
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/InquiryManagement.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/QuotationReceived.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/ActiveOrders.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/OrderHistory.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/CreateOrder.tsx`
    - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/MyDocuments.tsx`

### C3. Sync event dictionary bootstrap
- [x] Add event schema constants:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/events.ts`
- [x] Add event dispatcher wrapper:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/event-bus.ts`
- [x] Wire core domain events in context actions:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/InquiryContext.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/OrderContext.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/QuotationContext.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/SalesQuotationContext.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/dashboard/QuotationReceived.tsx` (event-driven reload)

### C4. Non-sensitive sync field whitelist
- [x] Expand `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/erp-core/sync-policy.ts`
  - domain-level field allowlist/denylist
  - sensitive-field policy tags

### C5. Tracking module decomposition prep (no nav change yet)
- [x] Create module folder scaffold:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/modules/tracking/pages/TrackingPage.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/modules/tracking/components/TrackingSummaryCards.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/modules/tracking/components/TrackingListTable.tsx`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/modules/tracking/hooks/useTrackingOverview.ts`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/modules/tracking/services/trackingRepository.ts`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/modules/tracking/types/tracking.ts`

## D. Build Validation
- [x] Build passes after each major patch (`npm run build`).

## E. Notes
- Existing warnings unrelated to this phase are still present:
  - Duplicate object keys in `Header.tsx`
  - Duplicate `className` in `CFODashboardCompactWithHelp.tsx`
- These are queued under engineering cleanup, not blocking Phase 1 core governance.
