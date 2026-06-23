# Payment Flow Governance

## Purpose

This document defines the single source of truth for customer payment flow in the ERP.

The goal is to prevent payment logic from drifting into page-local guesses such as:

- "deposit confirmed" => always show "waiting customer balance upload"
- hardcoded `30/70` payment text in template/demo pages
- using free-text `paymentTerms` to drive workflow decisions

## Source Of Truth

Customer-side receivable workflow must be driven by the structured fields on QT / SC:

- `payment_mode`
- `balance_trigger`

These fields are persisted in Supabase and then propagated through:

1. QT creation / edit
2. QT review / approval
3. QT -> SC conversion
4. SC preview / contract lifecycle
5. Finance AR list / AR detail
6. Customer portal payment-related views

`paymentTerms` remains a display/document field only.

It may be edited for wording, but it must not be used as the workflow decision key.

## Canonical Code Locations

### Rule Layer

- `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/paymentFlow.ts`

This file defines:

- `PAYMENT_MODE_OPTIONS`
- `BALANCE_TRIGGER_OPTIONS`
- `deriveBalanceTrigger()`
- `isNoDepositPaymentMode()`
- `getDefaultDepositPercentage()`
- `getDefaultBalancePercentage()`
- `getPaymentModeLabel()`
- `buildPaymentTermsText()`

All modules that need payment behavior should import from this file instead of recreating rules.

### Supabase Persistence

- `/Users/luke/Documents/New project 2/innoshop_react20260221/supabase/migrations/20260408113000_add_balance_trigger_to_qt_sc.sql`

This migration adds:

- `sales_quotations.payment_mode`
- `sales_quotations.balance_trigger`
- `sales_contracts.payment_mode`
- `sales_contracts.balance_trigger`

### Core Business Modules

- QT truth source: `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/SalesQuotationContext.tsx`
- SC truth source: `/Users/luke/Documents/New project 2/innoshop_react20260221/src/contexts/SalesContractContext.tsx`
- Finance AR rendering: `/Users/luke/Documents/New project 2/innoshop_react20260221/src/components/finance-v2/modules/ReceivablesModule.tsx`
- QT/SC persistence adapters:
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/services/salesQuotationService.ts`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/services/contractOrderArServices.ts`
  - `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/supabase-db.ts`

## Structured Fields

### paymentMode

Current canonical values:

- `tt_deposit_balance_before_shipment`
- `tt_deposit_balance_against_bl`
- `deposit_plus_lc`
- `lc_100`
- `dp`
- `da`
- `oa`

### balanceTrigger

Current canonical values:

- `after_deposit`
- `before_shipment`
- `after_shipment`
- `lc_ready`

If `balanceTrigger` is missing, derive it through `deriveBalanceTrigger(paymentMode, explicitTrigger)`.

## Business Meaning

### Payment Modes

`tt_deposit_balance_before_shipment`
- Deposit required.
- Remaining balance is a normal TT balance stage.
- Balance is expected before shipment.

`tt_deposit_balance_against_bl`
- Deposit required.
- Remaining balance is triggered after shipment / against BL copy.

`deposit_plus_lc`
- Deposit required.
- Remaining stage is not "customer uploads balance receipt" by default.
- Next stage is LC-driven.

`lc_100`
- No deposit stage.
- Entire payment is LC-driven.

`dp`
- No normal TT balance upload stage.
- Payment follows document release / shipment-stage logic.

`da`
- No normal TT balance upload stage.
- Post-shipment acceptance / account-period logic.

`oa`
- No deposit stage.
- Post-shipment account-period receivable logic.

## Workflow Mapping Principles

### Rule 1

Do not infer payment flow from `paymentTerms` text.

### Rule 2

Do not infer payment flow only from "deposit confirmed".

Deposit confirmation only completes the deposit stage.
It does not automatically mean the next visible state is `waiting_customer_balance_upload`.

### Rule 3

The next AR state must be calculated from:

- `paymentMode`
- `balanceTrigger`
- deposit/balance proof status
- contract/AR progression status

### Rule 4

Document templates and preview seeds may generate wording from structured fields, but they must never become the workflow source.

## Expected AR Behavior By Mode

### `tt_deposit_balance_before_shipment`

After deposit confirmation:
- next state may move to `待客户上传余款`

### `tt_deposit_balance_against_bl`

After deposit confirmation:
- do not immediately force `待客户上传余款`
- state should wait for shipment/BL trigger

Recommended label:
- `待出货触发余款`

### `deposit_plus_lc`

After deposit confirmation:
- do not show normal TT balance upload as next step

Recommended label:
- `待信用证落实`

### `lc_100`

No deposit UI should be the driver.

Recommended label:
- `待信用证落实`

### `dp`, `da`, `oa`

Do not render them as standard "deposit + balance upload" flow.
They belong to shipment/post-shipment receivable logic.

## UI Rules

### QT / SC Editing

User-facing entry points should expose:

- payment mode
- balance trigger
- generated payment terms text

`paymentTerms` may remain editable for wording, but editing the wording must not change workflow state.

### Finance Detail

Deposit section:
- editable only until deposit receipt is confirmed
- after confirmation it becomes locked
- confirmed amount/date must persist after reopen

Balance section:
- must remain locked until the configured trigger is reached
- if next stage is LC-driven, do not expose normal balance-upload wording

### Templates / Demo Pages

If a page needs sample payment text, it should use:

- `buildPaymentTermsText(paymentMode, balanceTrigger)`

instead of hardcoded:

- `30% T/T deposit, 70% before shipment`
- `30% 预付，70% 见提单副本付款`
- similar fixed variants

## Default Percentages

Current default logic in `paymentFlow.ts`:

- no-deposit modes (`oa`, `lc_100`) => deposit `0%`
- all other current modes => deposit `30%`
- balance = `100 - deposit`

This is a practical default only.

If business later needs:

- `50/50`
- milestone installment
- customer-specific negotiated ratio

that should be modeled as explicit structured fields rather than more free-text branching.

## Do And Don’t

### Do

- read workflow from `payment_mode + balance_trigger`
- generate display wording from helper functions
- persist QT -> SC -> AR with the same structured values
- let demo/template pages reuse helper-generated wording

### Don’t

- reintroduce hardcoded `30/70` fallbacks in business pages
- use free-text `paymentTerms` as the workflow switch
- assume deposit confirmation always means "customer should upload balance now"
- let template wording override contract workflow

## Extension Guidance

If a new payment style is added, update in this order:

1. Add enum support in `/Users/luke/Documents/New project 2/innoshop_react20260221/src/lib/paymentFlow.ts`
2. Update labels and generated wording
3. Update QT / SC forms that expose payment configuration
4. Update finance AR mapping logic
5. Update templates/seeds only as display helpers
6. If needed, add Supabase migration for any new structured column

## Current Boundary

This governance document is for customer receivable workflow.

Supplier payment terms, payable terms, and supplier-side account periods may use different semantics and should not be forcibly mapped onto customer-side `paymentMode` unless product/business explicitly decides to unify them.
