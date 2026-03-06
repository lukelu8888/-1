#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const BUSINESS_KEY_PATTERNS = [
  'salesQuotations',
  'sales_quotation_management_cache_v1',
  'sales_quotation_draft_overrides',
  'customer_quotations_bridge',
  'customer_decline_bridge',
  'approval_center_pending_bridge_v1',
  'salesContracts',
];

// Legacy allowlist for existing files. New usages outside these files are blocked.
const ALLOWED_FILES = new Set([
  'src/components/salesperson/SalesQuotationManagement.tsx',
  'src/components/dashboard/QuotationDetailView.tsx',
  'src/contexts/SalesContractContext.tsx',
  'src/lib/supabaseStorageBridge.ts',
  'src/components/admin/ApprovalCenter.tsx',
  'src/components/dashboard/ActiveOrders.tsx',
  'src/components/dashboard/UploadPaymentProofDialog.tsx',
  'src/components/salesperson/SalesContractManagement.tsx',
]);

function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

const setItemRegex = /localStorage\.setItem\s*\(\s*(['"`])([^'"`]+)\1/g;
const violations = [];

for (const file of collectFiles(SRC_DIR)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(setItemRegex)) {
    const key = match[2];
    const hitBusinessKey = BUSINESS_KEY_PATTERNS.some((p) => key.includes(p));
    if (!hitBusinessKey) continue;
    if (ALLOWED_FILES.has(rel)) continue;
    violations.push({
      file: rel,
      key,
      line: lineNumberAt(source, match.index ?? 0),
    });
  }
}

if (violations.length > 0) {
  console.error('❌ Business localStorage write blocked. Move these writes to Supabase-backed flow first:');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} key="${v.key}"`);
  }
  process.exit(1);
}

console.log('✅ Business storage guard passed.');
