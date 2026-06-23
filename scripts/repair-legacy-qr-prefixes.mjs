import { createClient } from '@supabase/supabase-js';

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
const isDryRun = isTruthy(process.env.QR_PREFIX_REPAIR_DRY_RUN);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[qr-prefix-repair] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const normalizeLegacyQrNumber = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/^PR-/i, 'QR-');
};

const normalizeRegionCode = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return 'NA';
  if (raw === 'NA' || raw === 'NORTH AMERICA') return 'NA';
  if (raw === 'SA' || raw === 'SOUTH AMERICA') return 'SA';
  if (raw === 'EA' || raw === 'EUROPE & AFRICA' || raw === 'EUROPE-AFRICA' || raw === 'EUROPE AND AFRICA') return 'EA';
  return raw;
};

const canonicalizeQrNumber = (value, region) => {
  const normalized = normalizeLegacyQrNumber(value).toUpperCase();
  const match = normalized.match(/^QR-(?:(NA|SA|EA)-)?(\d{6})-(\d{4})$/);
  if (!match) return normalized;
  const [, embeddedRegion, datePart, sequencePart] = match;
  return `QR-${embeddedRegion || normalizeRegionCode(region)}-${datePart}-${sequencePart}`;
};

const repairDocumentSnapshot = (snapshot, newNo) => {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return snapshot;
  return {
    ...snapshot,
    requirementNo: newNo,
    requirementNumber: newNo,
    qrNumber: newNo,
    displayNumber: newNo,
  };
};

const countMatches = async (table, column, value) => {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value);
  if (error) throw error;
  return count ?? 0;
};

const updateMatches = async (table, column, value, patch) => {
  const { error } = await supabase
    .from(table)
    .update(patch)
    .eq(column, value);
  if (error) throw error;
};

const main = async () => {
  const { data: rows, error } = await supabase
    .from('quote_requirements')
    .select('id,requirement_no,qr_number,display_number,region,document_data_snapshot,deleted_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[qr-prefix-repair] Failed to load quote_requirements:', error.message || error);
    process.exit(1);
  }

  const candidates = (rows || []).map((row) => {
    const oldNo = String(row.requirement_no || '').trim();
    const newNo = canonicalizeQrNumber(oldNo, row.region);
    return {
      id: row.id,
      oldNo,
      newNo,
      row,
    };
  }).filter((item) => item.oldNo && item.newNo && item.oldNo !== item.newNo);

  if (candidates.length === 0) {
    console.log(JSON.stringify({
      dryRun: isDryRun,
      repaired: 0,
      message: 'No non-standard QR rows found.',
    }, null, 2));
    return;
  }

  const summary = [];

  for (const candidate of candidates) {
    const targetExists = await countMatches('quote_requirements', 'requirement_no', candidate.newNo);
    if (targetExists > 0) {
      summary.push({
        id: candidate.id,
        from: candidate.oldNo,
        to: candidate.newNo,
        skipped: true,
        reason: 'Target QR number already exists in quote_requirements.',
      });
      continue;
    }

    const referenceCounts = {
      quote_requirements: 1,
      sales_quotations: await countMatches('sales_quotations', 'qr_number', candidate.oldNo),
      supplier_quotations: await countMatches('supplier_quotations', 'source_qr_number', candidate.oldNo),
      supplier_xjs_by_source_qr: await countMatches('supplier_xjs', 'source_qr_number', candidate.oldNo),
      supplier_xjs_by_requirement: await countMatches('supplier_xjs', 'requirement_no', candidate.oldNo),
      purchase_orders: await countMatches('purchase_orders', 'requirement_no', candidate.oldNo),
    };

    if (!isDryRun) {
      await supabase
        .from('quote_requirements')
        .update({
          requirement_no: candidate.newNo,
          qr_number: candidate.newNo,
          display_number: candidate.newNo,
          document_data_snapshot: repairDocumentSnapshot(candidate.row.document_data_snapshot, candidate.newNo),
        })
        .eq('id', candidate.id);

      await Promise.all([
        updateMatches('sales_quotations', 'qr_number', candidate.oldNo, { qr_number: candidate.newNo }),
        updateMatches('supplier_quotations', 'source_qr_number', candidate.oldNo, { source_qr_number: candidate.newNo }),
        updateMatches('supplier_xjs', 'source_qr_number', candidate.oldNo, { source_qr_number: candidate.newNo }),
        updateMatches('supplier_xjs', 'requirement_no', candidate.oldNo, { requirement_no: candidate.newNo }),
        updateMatches('purchase_orders', 'requirement_no', candidate.oldNo, { requirement_no: candidate.newNo }),
      ]);
    }

    summary.push({
      id: candidate.id,
      from: candidate.oldNo,
      to: candidate.newNo,
      references: referenceCounts,
    });
  }

  console.log(JSON.stringify({
    dryRun: isDryRun,
    repaired: summary.length,
    rows: summary,
  }, null, 2));
};

main().catch((error) => {
  console.error('[qr-prefix-repair] failed:', error?.message || error);
  process.exit(1);
});
