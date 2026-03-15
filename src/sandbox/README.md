# Sandbox Area — Mock & Demo Files

## What This Directory Is

The `src/sandbox/` directory contains **visual demonstrations, mock data pages, and workflow
sandboxes** that exist solely for training, onboarding, and design reference purposes.

**None of the files in this directory are part of the real ERP system.**

---

## Rules

| Rule | Details |
|------|---------|
| No real data | Sandbox files must not read from or write to any Supabase table |
| No real contexts | Sandbox files must not import or consume any ERP business Context (OrderContext, InquiryContext, SalesContractContext, etc.) |
| No real services | Sandbox files must not call contractService, orderService, approvalService, or any service in `src/lib/supabaseService.ts` |
| No ERP events | Sandbox files must not call `emitErpEvent` or interact with the ERP event bus |
| No production imports | Real ERP business components must not import from `src/sandbox/` |
| Clearly labeled | All sandbox files must carry the file-level warning header block |

---

## Contents

### `src/sandbox/demo/`

| File | Description |
|------|-------------|
| `FullProcessSandboxV5.tsx` | Interactive swimlane diagram showing 18 stages / 122 steps of the full B2B procurement workflow. Pure visualization — no backend calls, no context dependencies, no async operations. UI state is persisted only to `localStorage` under keys prefixed `fullProcessDemoV5_`. |

---

## What Sandbox Files Are Allowed To Use

- React built-ins: `useState`, `useRef`, `useEffect`, `useMemo`
- Third-party UI libraries: Radix UI, Lucide icons, react-dnd, Tailwind CSS
- `src/components/ui/` — shared base UI components (Button, Card, Badge, etc.)
- `src/lib/notification-rules.ts` and `src/lib/notification-language.ts` — **only for local computation** (personnel list and message templates; no network calls)
- `src/lib/supplier-store.ts` and `src/lib/customer-salesrep-mapping.ts` — **only for mock data initialization in localStorage**
- `localStorage` — for persisting sandbox UI state only (not ERP business data)

---

## How To Add A New Sandbox File

1. Place the file inside `src/sandbox/demo/` (or a new subdirectory under `src/sandbox/`)
2. Copy the warning header block from `FullProcessSandboxV5.tsx` and update the details
3. Do not import from `src/contexts/`, `src/lib/supabaseService.ts`, or any real ERP service
4. Register it in `AdminDashboard.tsx` with a menu label that includes `(Mock)` or `(Sandbox)`
5. Use `badge: 'MOCK'` in the menu item definition

---

## Why This Separation Exists

In a large ERP codebase, visual demos and training aids can be mistaken for real business
modules — especially by AI coding tools, new developers, or automated code analysis. Placing
these files in a clearly-named `sandbox/` directory with explicit file-level warnings ensures:

- AI tools and static analysis do not treat mock data as real ERP schema or business logic
- New developers understand immediately that these files are not reference implementations
- The boundary between real ERP modules and visualization aids is always explicit and auditable
