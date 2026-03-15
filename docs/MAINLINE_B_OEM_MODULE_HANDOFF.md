# Mainline B OEM Module Handoff

## Scope

This document covers only Mainline B:

- OEM drawing / technical document intake from customer-side ING
- Internal anonymization and replacement flow
- Factory-facing OEM package generation and release
- Supplier/factory-side released package viewing

This document does not cover Mainline A or QR template publishing.

## Business Definition

OEM here means a business mode where:

- the customer provides design, branding, drawings, or technical requirements
- COSUN handles internal review, anonymization, replacement, and internal part mapping
- the factory receives only factory-facing material controlled by COSUN

OEM is therefore a workflow branch inside the inquiry process, not an isolated attachment widget.

## Confirmed Rules

### Customer-side rules

- OEM is an optional branch inside customer ING.
- The OEM module appears only when the customer selects `Yes - involves OEM/technical documents`.
- The OEM module requires:
  - file upload
  - mandatory description for each uploaded file
  - overall business requirement note
- If tooling or mold cost is involved, the customer must also provide:
  - first order quantity
  - annual quantity
  - quantity within 3 years
  - mold lifetime

### Internal-control rules

- The customer cannot decide whether OEM files are forwarded to factories.
- Factory forwarding is internal-only.
- Factory-facing documents must:
  - replace customer identity with COSUN internal information
  - replace customer part numbers with internal `MODEL# / SKU`
  - show `Procurement Department`
  - not expose salesperson personal identity

## User-end Entrypoints

### Customer end

Primary creation flow:

- `UnifiedInquiryDialog`
- `InquiryManagement.handleCreateInquiry`
- `InquiryContext.addInquiry`

Customer-facing OEM input UI:

- [src/components/dashboard/UnifiedInquiryDialog.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/dashboard/UnifiedInquiryDialog.tsx)
- [src/components/dashboard/OemModuleSection.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/dashboard/OemModuleSection.tsx)

Customer inquiry view:

- [src/components/dashboard/CustomerInquiryView.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/dashboard/CustomerInquiryView.tsx)
- [src/components/dashboard/OemInquirySummary.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/dashboard/OemInquirySummary.tsx)

### Internal/admin end

Admin inquiry detail and OEM controls:

- [src/components/admin/AdminInquiryManagement.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/admin/AdminInquiryManagement.tsx)
- [src/components/admin/AdminInquiryManagementNew.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/admin/AdminInquiryManagementNew.tsx)
- [src/components/admin/OemInternalProcessingPanel.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/admin/OemInternalProcessingPanel.tsx)
- [src/components/admin/OemFactoryFacingPreview.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/admin/OemFactoryFacingPreview.tsx)

Factory-facing printable document:

- [src/components/documents/templates/OemFactoryFacingDocument.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/documents/templates/OemFactoryFacingDocument.tsx)

### Supplier/factory end

Released OEM package entry:

- [src/components/supplier/SupplierDocumentsWorkflow.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/supplier/SupplierDocumentsWorkflow.tsx)
- [src/components/supplier/SupplierOemFactoryReleaseCenter.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/supplier/SupplierOemFactoryReleaseCenter.tsx)

Supplier/factory users can only see released factory-facing packages. They do not see original customer OEM content.

## Data Model

### Frontend domain model

OEM types:

- [src/types/oem.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/types/oem.ts)

Key structures:

- `InquiryOemData`
- `OemUploadedFile`
- `OemPartNumberMapping`
- `internalProcessing`
- `forwardingControl`
- `anonymizationPolicy`

### Supabase tables

Mainline B persistent tables:

- `inquiry_oem_modules`
- `inquiry_oem_files`
- `inquiry_oem_part_mappings`
- `inquiry_oem_factory_dispatches`

Migration files:

- [supabase/migrations/048_inquiry_oem_module.sql](/Users/luke/Documents/New%20project%202/innoshop_react20260221/supabase/migrations/048_inquiry_oem_module.sql)
- [supabase/migrations/049_inquiry_oem_factory_dispatch.sql](/Users/luke/Documents/New%20project%202/innoshop_react20260221/supabase/migrations/049_inquiry_oem_factory_dispatch.sql)
- [supabase/migrations/050_backfill_inquiry_oem_factory_dispatch.sql](/Users/luke/Documents/New%20project%202/innoshop_react20260221/supabase/migrations/050_backfill_inquiry_oem_factory_dispatch.sql)

Current remote migration state:

- `048` applied
- `049` applied
- `050` applied

### Services

Supabase service layer:

- [src/lib/supabaseService.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/lib/supabaseService.ts)

Relevant services:

- `inquiryService`
- `inquiryOemService`
- `inquiryOemFactoryDispatchService`

Storage service:

- [src/lib/storageService.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/lib/storageService.ts)

OEM attachment bucket:

- `oem-attachments`

## Workflow State Model

### Internal OEM processing statuses

In `internalProcessing`:

- `anonymizationStatus`
  - `pending`
  - `in_progress`
  - `completed`
- `replacementVersionStatus`
  - `pending`
  - `in_progress`
  - `completed`
- `factoryForwardingStatus`
  - `internal_hold`
  - `ready_for_internal_review`
  - `released_to_factory`

### Factory release gates

`Release to Factory` is blocked unless:

- a factory-facing OEM version has been generated
- anonymization is completed
- replacement version is completed
- all customer PN mappings are confirmed as `mapped`
- final `MODEL#` and `SKU` do not contain `PENDING`

## Persistence Rules

### Current persistence direction

Mainline B now uses:

- independent OEM tables as the main structured storage
- independent OEM factory dispatch table as the main release storage

Legacy compatibility remains only for some OEM module input hydration paths. Factory dispatch no longer reads from `documentRenderMeta.oemFactoryFacingVersion`, and UI/business flow now rely on `oemFactoryDispatch` plus the dedicated OEM dispatch table.

### Inquiry context synchronization

Inquiry sync logic:

- [src/contexts/InquiryContext.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/contexts/InquiryContext.tsx)

Covered paths:

- inquiry create
- inquiry update
- background retry sync
- inquiry list enrichment from OEM tables
- inquiry list enrichment from factory dispatch table

## Document Generation

### Factory-facing payload generation

Adapter:

- [src/utils/documentDataAdapters.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/utils/documentDataAdapters.ts)

Key adapter:

- `adaptInquiryToFactoryFacingOemDocument(...)`

It performs:

- customer identity replacement
- project name replacement
- customer PN to internal `MODEL# / SKU` conversion
- `Procurement Department` ownership rendering

### Factory-facing document output

Document component:

- [src/components/documents/templates/OemFactoryFacingDocument.tsx](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/components/documents/templates/OemFactoryFacingDocument.tsx)

Used for:

- admin internal preview
- admin print output
- supplier/factory released package view

## Audit and Verification

### Build verification

Current implementation has passed:

- `npm run build`

### Data audit SQL

Audit file:

- [scripts/oem_factory_dispatch_audit.sql](/Users/luke/Documents/New%20project%202/innoshop_react20260221/scripts/oem_factory_dispatch_audit.sql)

Checks:

- missing factory dispatch
- released OEM without released timestamp
- missing part mappings
- incomplete part mappings
- empty dispatch payload

Latest reported result:

- audit executed successfully
- no problematic rows returned

## Current Known Boundaries

- Customer-side binary file upload is supported through storage service and OEM metadata persistence, but future hardening may still be needed around bucket policy and attachment lifecycle cleanup.
- OEM factory dispatch now persists only through `oemFactoryDispatch` and the dedicated OEM dispatch table. Legacy `documentRenderMeta.oemFactoryFacingVersion` fallback reads have been removed.
- OEM supplier release is currently attached to inquiry-level release records, not yet split into a broader supplier packet / dispatch orchestration module.

## Recommended Next Steps

### Recommended if continuing Mainline B

1. Add a scheduled or manual audit run for OEM release integrity.
2. Introduce supplier packet / dispatch orchestration if factory handoff becomes more complex than inquiry-level release.
3. Add automated integration coverage for:
   - customer OEM submission
   - internal generation
   - release gate blocking
   - supplier release visibility

## Summary

Mainline B is now implemented as a complete OEM workflow branch:

- customer submits OEM inquiry material
- internal users review and process OEM data
- COSUN generates factory-facing replacement documents
- release to factory is gated by mapping and anonymization rules
- suppliers/factories see only released factory-facing OEM packages

The data model, UI entrypoints, storage, release gate, and dispatch persistence are all in place.
