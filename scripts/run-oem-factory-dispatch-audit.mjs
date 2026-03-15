import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const hasResolvedInternalCode = (value) => {
  const normalized = String(value || '').trim();
  return Boolean(normalized) && !normalized.includes('PENDING');
};

const main = async () => {
  const [
    { data: inquiryRows, error: inquiryError },
    { data: moduleRows, error: moduleError },
    { data: mappingRows, error: mappingError },
    { data: dispatchRows, error: dispatchError },
  ] = await Promise.all([
    supabase
      .from('inquiries')
      .select('id,inquiry_number,date,document_render_meta')
      .order('date', { ascending: false }),
    supabase
      .from('inquiry_oem_modules')
      .select('id,inquiry_id,enabled,anonymization_status,replacement_version_status,factory_forwarding_status')
      .eq('enabled', true),
    supabase
      .from('inquiry_oem_part_mappings')
      .select('inquiry_oem_module_id,customer_part_number,internal_model_number,internal_sku,mapping_status'),
    supabase
      .from('inquiry_oem_factory_dispatches')
      .select('id,inquiry_id,dispatch_status,released_at,payload'),
  ]);

  if (inquiryError || moduleError || mappingError || dispatchError) {
    console.error('Audit query failed:', inquiryError || moduleError || mappingError || dispatchError);
    process.exit(1);
  }

  const inquiryMap = new Map((inquiryRows || []).map((row) => [row.id, row]));
  const dispatchMap = new Map((dispatchRows || []).map((row) => [row.inquiry_id, row]));
  const mappingByModuleId = new Map();

  for (const row of mappingRows || []) {
    const list = mappingByModuleId.get(row.inquiry_oem_module_id) || [];
    list.push(row);
    mappingByModuleId.set(row.inquiry_oem_module_id, list);
  }

  const findings = [];

  for (const module of moduleRows || []) {
    const inquiry = inquiryMap.get(module.inquiry_id);
    const dispatch = dispatchMap.get(module.inquiry_id);
    const mappings = mappingByModuleId.get(module.id) || [];
    const completeMappings = mappings.filter((mapping) => (
      mapping.mapping_status === 'mapped' &&
      hasResolvedInternalCode(mapping.internal_model_number) &&
      hasResolvedInternalCode(mapping.internal_sku)
    ));
    const legacyFactoryVersion = inquiry?.document_render_meta?.oemFactoryFacingVersion || null;

    let auditResult = 'ok';
    if (!dispatch) {
      auditResult = 'missing_dispatch';
    } else if (!dispatch.payload || Object.keys(dispatch.payload).length === 0) {
      auditResult = 'empty_dispatch_payload';
    } else if (module.factory_forwarding_status === 'released_to_factory' && !dispatch.released_at) {
      auditResult = 'released_without_dispatch_release_time';
    } else if (mappings.length === 0) {
      auditResult = 'no_part_mapping';
    } else if (mappings.length !== completeMappings.length) {
      auditResult = 'incomplete_part_mapping';
    }

    findings.push({
      inquiryNumber: inquiry?.inquiry_number || module.inquiry_id,
      date: inquiry?.date || null,
      dispatchStatus: dispatch?.dispatch_status || 'missing',
      factoryForwardingStatus: module.factory_forwarding_status,
      anonymizationStatus: module.anonymization_status,
      replacementVersionStatus: module.replacement_version_status,
      mappingCount: mappings.length,
      mappedCount: completeMappings.length,
      hasLegacyFactoryVersion: Boolean(legacyFactoryVersion),
      auditResult,
    });
  }

  const summary = findings.reduce((acc, item) => {
    acc.total += 1;
    acc[item.auditResult] = (acc[item.auditResult] || 0) + 1;
    return acc;
  }, { total: 0 });

  const problematic = findings.filter((item) => item.auditResult !== 'ok');

  console.log(JSON.stringify({
    summary,
    problematic,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
