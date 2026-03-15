# Model Numbering Rules

## Final Rule

- `internal_model_no` is the only primary product code.
- Website product code must equal `internal_model_no`.
- Customer codes and supplier codes are alias codes only. They never replace the internal primary code.

## Code Types

### 1. Internal Model No

- Field: `internal_model_no`
- Meaning: COSUN internal primary code
- Scope:
  - website product code
  - quotation
  - contract
  - CI
  - PL
  - internal inquiry handling
  - procurement order
  - supplier order primary code

### 2. Customer Part No

- App field: `customerModelNo`
- Supabase mapping type: `party_type = 'customer'`
- Meaning: customer alias code
- Scope:
  - customer-created `Your Items`
  - customer inquiry recognition
  - salesperson early-stage inquiry review

### 3. Supplier Part No

- App field: `supplierModelNo`
- Supabase mapping type: `party_type = 'supplier'`
- Meaning: supplier alias code
- Scope:
  - supplier coordination
  - procurement reference display

## Display Rules

### Customer Side

#### Your Items

- Show `customerModelNo` first when it exists.
- If customer code is empty, fall back to `internal_model_no`.

#### Select from Website

- Show `internal_model_no`.

#### History

- Follow the original source logic:
  - history item from website: show `internal_model_no`
  - history item from `Your Items`: show `customerModelNo` first when it exists

### Salesperson Receiving New Customer ING

- For `Your Items`, customer code should remain visible first.
- Internal code should still exist in the system mapping and be available as auxiliary information.

### Formal Business Documents

- Always show `internal_model_no` as the primary code.
- If needed, add `Customer Ref` as a secondary reference line.

### Procurement / Supplier Side

- Always show `internal_model_no` as the primary code.
- Show `supplierModelNo` only as a secondary reference.

## Supabase Alignment

Current Supabase structure is already aligned with this rule:

- `product_master.internal_model_no`
  - primary internal code
- `product_model_mappings.external_model_no`
  - external alias code
- `product_model_mappings.party_type`
  - `customer`
  - `supplier`

Reference migration:

- [/Users/luke/Documents/New project 2/innoshop_react20260221/database/migrations/046_internal_model_number_system.sql](/Users/luke/Documents/New%20project%202/innoshop_react20260221/database/migrations/046_internal_model_number_system.sql)

## Frontend Resolver Rule

Do not directly decide model display per page with ad-hoc `if/else`.

Use shared resolvers in:

- [/Users/luke/Documents/New project 2/innoshop_react20260221/src/utils/productModelDisplay.ts](/Users/luke/Documents/New%20project%202/innoshop_react20260221/src/utils/productModelDisplay.ts)

Current resolver meanings:

- `getCustomerFacingModelNo(product)`
- `getInternalFacingModelNo(product)`
- `getFormalBusinessModelNo(product)`
- `getSupplierFacingModelNo(product)`
- `shouldShowCustomerRefLine(product)`
- `shouldShowSupplierRefLine(product)`

## Execution Rule

- Customer-side inquiry pages follow customer-facing resolver.
- Internal handling pages may show both customer alias and internal primary code.
- Quotation / contract / CI / PL / procurement / supplier release must use internal primary code as the main code.

## Migration Principle

When old code still reads `product.modelNo`, treat it as internal-code semantics unless the page is explicitly customer-facing and uses the shared display resolver.
