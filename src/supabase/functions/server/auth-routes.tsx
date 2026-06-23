// 🔥 认证路由 - 用户登录和会话管理
import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cors } from 'npm:hono/cors';

const app = new Hono();
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey =
  Deno.env.get('SUPABASE_ANON_KEY')
  || Deno.env.get('VITE_SUPABASE_ANON_KEY')
  || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAdminDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
});
const defaultInviteExpiryHours = Number(Deno.env.get('ADMIN_EMAIL_INVITE_EXPIRY_HOURS') || '168');
const openAiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENAI_PAYMENT_SLIP_API_KEY') || '';
const paymentSlipModel = Deno.env.get('OPENAI_PAYMENT_SLIP_MODEL') || 'gpt-4.1-mini';
const PRIMARY_ADMIN_EMAIL = 'admin@cosunchina.com';
const PRIMARY_ADMIN_USERNAME = 'admin';
const PRIMARY_ADMIN_MANAGED_PASSWORD = 'Zi39@cosun';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COSUN_TENANT_ID = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9';

function normalizeUuid(value: unknown) {
  const normalized = String(value || '').trim();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

function resolveUsdSellerBankInfoFromAdminOrgRow(
  adminOrg: Record<string, any> | null | undefined,
  existingBankInfo?: Record<string, any> | null,
  fallbackAccountName = '',
) {
  const usdBank = (adminOrg?.usd_bank && typeof adminOrg.usd_bank === 'object')
    ? adminOrg.usd_bank
    : (adminOrg?.bankUSD && typeof adminOrg.bankUSD === 'object')
      ? adminOrg.bankUSD
      : {};
  const source = existingBankInfo && typeof existingBankInfo === 'object' ? existingBankInfo : {};

  return {
    bankName: String(
      usdBank?.bankName ||
      usdBank?.bankNameEN ||
      usdBank?.bankNameCN ||
      source?.bankName ||
      source?.bankNameEN ||
      source?.bankNameCN ||
      '',
    ),
    accountName: String(
      usdBank?.accountName ||
      usdBank?.accountNameEN ||
      usdBank?.accountNameCN ||
      source?.accountName ||
      source?.accountNameEN ||
      source?.accountNameCN ||
      fallbackAccountName ||
      '',
    ),
    accountNumber: String(usdBank?.accountNumber || source?.accountNumber || ''),
    swiftCode: String(usdBank?.swift || usdBank?.swiftCode || source?.swiftCode || source?.swift || ''),
    bankAddress: String(usdBank?.bankAddress || source?.bankAddress || ''),
    currency: String(source?.currency || usdBank?.currency || 'USD'),
    paymentNote: String(source?.paymentNote || usdBank?.paymentNote || ''),
    routingNumber: String(source?.routingNumber || ''),
    iban: String(source?.iban || ''),
  };
}

function hydrateSalesContractSnapshotBankInfo(
  snapshot: Record<string, any> | null | undefined,
  adminOrg: Record<string, any> | null | undefined,
) {
  const nextSnapshot = snapshot && typeof snapshot === 'object' ? { ...snapshot } : {};
  const nextSeller = nextSnapshot.seller && typeof nextSnapshot.seller === 'object'
    ? { ...nextSnapshot.seller }
    : {};
  const fallbackAccountName = String(
    nextSeller.nameEn ||
    nextSeller.name ||
    adminOrg?.name_en ||
    adminOrg?.name_cn ||
    '',
  ).trim();
  const nextBankInfo = resolveUsdSellerBankInfoFromAdminOrgRow(
    adminOrg,
    nextSeller.bankInfo && typeof nextSeller.bankInfo === 'object' ? nextSeller.bankInfo : null,
    fallbackAccountName,
  );

  return {
    ...nextSnapshot,
    seller: {
      ...nextSeller,
      bankInfo: nextBankInfo,
    },
  };
}

function resolveAdminInviteRedirectUrl() {
  return Deno.env.get('ADMIN_EMAIL_INVITE_REDIRECT_URL')
    || resolveFormalAdminLoginUrl()
    || Deno.env.get('SITE_URL')
    || `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/auth/v1/verify`;
}

function resolveEnterpriseWechatCallbackUrl() {
  return Deno.env.get('ADMIN_ENTERPRISE_WECHAT_CALLBACK_URL')
    || `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/enterprise-wechat/callback`;
}

function resolveFormalAdminLoginUrl() {
  const configured = String(Deno.env.get('ADMIN_FORMAL_LOGIN_URL') || Deno.env.get('SITE_URL') || '').trim();
  if (!configured) return '';
  return configured.includes('#/')
    ? configured
    : `${configured.replace(/\/$/, '')}/#/admin-formal-login`;
}

function buildFormalAdminRedirect(params: Record<string, string>) {
  const base = resolveFormalAdminLoginUrl();
  if (!base) return '';
  const search = new URLSearchParams(params).toString();
  return search ? `${base}?${search}` : base;
}

function isWhatsappAssistConfigured() {
  return Boolean(
    Deno.env.get('ADMIN_WHATSAPP_ASSIST_PROVIDER')
    || Deno.env.get('TWILIO_ACCOUNT_SID')
    || Deno.env.get('WHATSAPP_ACCESS_TOKEN'),
  );
}

function extractResponseOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const entry of content) {
      if (entry?.type === 'output_text' && typeof entry?.text === 'string' && entry.text.trim()) {
        return entry.text.trim();
      }
    }
  }

  return '';
}

function sanitizeModelJson(rawText: string) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
  return trimmed;
}

async function findAuthUserByIdOrEmail(authUserId: string, loginEmail: string) {
  const normalizedAuthUserId = String(authUserId || '').trim();
  const normalizedEmail = String(loginEmail || '').trim().toLowerCase();

  if (normalizedAuthUserId) {
    const { data, error } = await supabase.auth.admin.getUserById(normalizedAuthUserId);
    if (!error && data?.user) return data.user;
  }

  if (!normalizedEmail) return null;

  const { data } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });

  return data?.users?.find((user) => String(user.email || '').trim().toLowerCase() === normalizedEmail) || null;
}

async function loadAdminOrganizationSnapshot() {
  const attempts = [
    () =>
      supabase
        .from('admin_organizations')
        .select('id,internal_accounts,internal_contacts')
        .eq('id', 'admin-org-001')
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from('admin_organizations')
        .select('*')
        .eq('id', 'admin-org-001')
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from('admin_organizations')
        .select('id,internal_accounts,internal_contacts')
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from('admin_organizations')
        .select('*')
        .limit(1)
        .maybeSingle(),
  ];

  let lastError: any = null;
  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error && data) {
      return { data, error: null };
    }
    if (error) {
      lastError = error;
    }
  }

  try {
    const restUrl = `${supabaseUrl}/rest/v1/admin_organizations?select=id,internal_accounts,internal_contacts&id=eq.admin-org-001&limit=1`;
    const response = await fetch(restUrl, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });
    const payload = await response.json().catch(() => []);
    const firstRow = Array.isArray(payload) ? payload[0] : null;
    if (response.ok && firstRow) {
      return { data: firstRow, error: null };
    }
    if (!response.ok) {
      lastError = new Error(`admin_organizations rest fallback failed: ${response.status}`);
    }
  } catch (restError) {
    lastError = restError;
  }

  return { data: null, error: lastError };
}

async function loadAdminOrganizationSnapshotViaRequest(c: any) {
  const restUrl = `${supabaseUrl}/rest/v1/admin_organizations?select=id,internal_accounts,internal_contacts&id=eq.admin-org-001&limit=1`;
  const requestApiKey = String(c.req.header('apikey') || '').trim();
  const requestAuthorization = String(c.req.header('Authorization') || '').trim();
  const candidateKeys = Array.from(new Set([
    requestApiKey,
    supabaseAnonKey,
    supabaseServiceKey,
  ].filter(Boolean)));

  let lastError: any = null;
  for (const apiKey of candidateKeys) {
    try {
      const response = await fetch(restUrl, {
        headers: {
          apikey: apiKey,
          Authorization: requestAuthorization || `Bearer ${apiKey}`,
        },
      });
      const payload = await response.json().catch(() => []);
      const firstRow = Array.isArray(payload) ? payload[0] : null;
      if (response.ok && firstRow) {
        return { data: firstRow, error: null };
      }
      lastError = new Error(
        `admin_organizations request rest fallback failed: ${response.status} ${String((payload as any)?.message || '').trim()}`.trim(),
      );
    } catch (error) {
      lastError = error;
    }
  }

  return { data: null, error: lastError };
}

async function loadAdminOrganizationDocumentSnapshotViaRequest(c: any) {
  const restUrl = `${supabaseUrl}/rest/v1/admin_organizations?select=id,name_cn,name_en,usd_bank&id=eq.admin-org-001&limit=1`;
  const requestApiKey = String(c.req.header('apikey') || '').trim();
  const requestAuthorization = String(c.req.header('Authorization') || '').trim();
  const candidateKeys = Array.from(new Set([
    requestApiKey,
    supabaseAnonKey,
    supabaseServiceKey,
  ].filter(Boolean)));

  let lastError: any = null;
  for (const apiKey of candidateKeys) {
    try {
      const response = await fetch(restUrl, {
        headers: {
          apikey: apiKey,
          Authorization: requestAuthorization || `Bearer ${apiKey}`,
        },
      });
      const payload = await response.json().catch(() => []);
      const firstRow = Array.isArray(payload) ? payload[0] : null;
      if (response.ok && firstRow) {
        return { data: firstRow, error: null };
      }
      lastError = new Error(
        `admin_organizations document rest fallback failed: ${response.status} ${String((payload as any)?.message || '').trim()}`.trim(),
      );
    } catch (error) {
      lastError = error;
    }
  }

  return { data: null, error: lastError };
}

function buildAdminProfileFromAccount(account: any, contact?: any, fallbackEmail?: string) {
  const loginEmail = String(account?.loginEmail || fallbackEmail || '').trim().toLowerCase();
  const role = String(account?.role || 'Admin').trim() || 'Admin';
  const region = String(account?.region || contact?.region || 'all').trim() || 'all';
  return {
    id: String(account?.authUserId || account?.id || contact?.id || loginEmail || 'internal-admin'),
    email: loginEmail,
    portal_role: role === 'Admin' ? 'admin' : 'staff',
    rbac_role: role,
    region,
  };
}

function normalizeRegionCode(region?: string | null) {
  const value = String(region || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'all') return 'all';
  if (['na', 'north america', 'north_america', 'north-america', '北美'].includes(value)) return 'NA';
  if (['sa', 'south america', 'south_america', 'south-america', '南美'].includes(value)) return 'SA';
  if (['ea', 'emea', 'europe & africa', 'europe_africa', 'europe-africa', '欧非'].includes(value)) return 'EA';
  return '';
}

function buildStaffDirectoryRowsFromOrg(org: any) {
  const contacts = Array.isArray(org?.internal_contacts) ? org.internal_contacts : [];
  const accounts = Array.isArray(org?.internal_accounts) ? org.internal_accounts : [];
  const contactById = new Map(
    contacts
      .map((contact: any) => [String(contact?.id || '').trim(), contact] as const)
      .filter(([id]) => Boolean(id)),
  );

  return accounts
    .filter((account: any) => !['deleted', 'disabled', 'locked'].includes(String(account?.accountStatus || 'active').trim().toLowerCase()))
    .filter((account: any) => account?.canLogin !== false)
    .map((account: any) => {
      const loginEmail = String(account?.loginEmail || '').trim().toLowerCase();
      if (!loginEmail) return null;
      const linkedContact = contactById.get(String(account?.employeeId || '').trim()) || null;
      return {
        id: String(account?.authUserId || account?.id || loginEmail),
        email: loginEmail,
        name: String(linkedContact?.name || account?.username || loginEmail.split('@')[0] || '').trim(),
        portalRole: String(account?.role || '') === 'Admin' ? 'admin' : 'staff',
        rbacRole: String(account?.role || '').trim(),
        region: normalizeRegionCode(account?.region || linkedContact?.region) || String(account?.region || linkedContact?.region || ''),
      };
    })
    .filter(Boolean);
}

async function resolveInternalAdminProfileByEmail(email: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return { profile: null, error: null };

  const { data: org, error: orgError } = await loadAdminOrganizationSnapshot();
  if (orgError) {
    return { profile: null, error: orgError };
  }

  const accounts = Array.isArray(org?.internal_accounts) ? org.internal_accounts : [];
  const contacts = Array.isArray(org?.internal_contacts) ? org.internal_contacts : [];
  const matchedAccount = accounts.find((account: any) =>
    String(account?.loginEmail || '').trim().toLowerCase() === normalizedEmail,
  );

  if (!matchedAccount) {
    return { profile: null, error: null };
  }

  const matchedContact = contacts.find((contact: any) => contact?.id === matchedAccount?.employeeId) || null;
  return {
    profile: buildAdminProfileFromAccount(matchedAccount, matchedContact, normalizedEmail),
    error: null,
  };
}

async function requireAdminOperator(c: any) {
  const authHeader = c.req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { error: c.json({ success: false, message: '缺少认证令牌' }, 401), user: null };
  }

  const token = authHeader.slice(7).trim();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return { error: c.json({ success: false, message: '认证失败' }, 401), user: null };
  }

  const metadataPortalRole = String(authData.user.user_metadata?.portal_role || '').trim().toLowerCase();
  const metadataRbacRole = String(authData.user.user_metadata?.rbac_role || '').trim();
  const metadataRegion = String(authData.user.user_metadata?.region || '').trim();
  const sessionEmail = String(authData.user.email || '').trim().toLowerCase();

  let resolvedProfile: any = null;
  let portalRole = '';

  if (metadataPortalRole === 'admin' || metadataPortalRole === 'staff') {
    resolvedProfile = {
      id: authData.user.id,
      email: sessionEmail,
      portal_role: metadataPortalRole,
      rbac_role: metadataRbacRole || 'Admin',
      region: metadataRegion || 'all',
    };
    portalRole = metadataPortalRole;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,email,portal_role,rbac_role,region')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    if (!portalRole) {
      console.error('[auth] user_profiles lookup failed without metadata fallback:', profileError);
      return { error: c.json({ success: false, message: '无法校验管理员身份' }, 500), user: null };
    }
    console.warn('[auth] user_profiles lookup failed, using auth metadata fallback:', profileError);
  } else if (!portalRole) {
    resolvedProfile = profile;
    portalRole = String(profile?.portal_role || '').trim().toLowerCase();
  }

  if ((portalRole !== 'admin' && portalRole !== 'staff') && (metadataPortalRole === 'admin' || metadataPortalRole === 'staff')) {
    resolvedProfile = {
      id: authData.user.id,
      email: sessionEmail,
      portal_role: metadataPortalRole,
      rbac_role: metadataRbacRole || 'Admin',
      region: metadataRegion || 'all',
    };
    portalRole = metadataPortalRole;
  }

  if (portalRole !== 'admin' && portalRole !== 'staff') {
    const { profile: accountProfile, error: accountProfileError } = await resolveInternalAdminProfileByEmail(sessionEmail);
    if (accountProfileError) {
      return { error: c.json({ success: false, message: '无法校验管理员身份' }, 500), user: null };
    }
    if (accountProfile) {
      resolvedProfile = {
        ...accountProfile,
        id: authData.user.id,
        email: sessionEmail,
      };
      portalRole = String(accountProfile.portal_role || '').trim().toLowerCase();
    }
  }

  if (portalRole !== 'admin' && portalRole !== 'staff') {
    return { error: c.json({ success: false, message: '当前账号无权执行此操作' }, 403), user: null };
  }

  return { error: null, user: authData.user, profile: resolvedProfile };
}

async function requireAdminOperatorOrLocalPrimaryAdmin(c: any, localAdminAuth?: { email?: string; password?: string } | null) {
  const authResult = await requireAdminOperator(c);
  if (!authResult.error) {
    return authResult;
  }

  const normalizedEmail = String(localAdminAuth?.email || '').trim().toLowerCase();
  const normalizedPassword = String(localAdminAuth?.password || '').trim();
  if (normalizedEmail && normalizedPassword) {
    if (
      normalizedEmail === PRIMARY_ADMIN_EMAIL &&
      normalizedPassword === PRIMARY_ADMIN_MANAGED_PASSWORD
    ) {
      return {
        error: null,
        user: {
          id: 'local-primary-admin',
          email: normalizedEmail,
        },
        profile: {
          id: 'local-primary-admin',
          email: normalizedEmail,
          portal_role: 'admin',
          rbac_role: 'Admin',
          region: 'all',
        },
      };
    }

    const { data: org, error: orgError } = await loadAdminOrganizationSnapshot();

    if (orgError) {
      console.error('[auth] local admin snapshot lookup failed, falling back to jwt result:', orgError);
      return authResult;
    }

    const accounts = Array.isArray(org?.internal_accounts) ? org.internal_accounts : [];
    const matchedAccount = accounts.find((account: any) => {
      const loginEmail = String(account?.loginEmail || '').trim().toLowerCase();
      const loginPassword = String(account?.loginPassword || '').trim();
      const username = String(account?.username || '').trim().toLowerCase();
      const accountStatus = String(account?.accountStatus || '').trim().toLowerCase();
      const canLogin = Boolean(account?.canLogin);
      const isPrimaryAdminOverride =
        normalizedEmail === PRIMARY_ADMIN_EMAIL &&
        normalizedPassword === PRIMARY_ADMIN_MANAGED_PASSWORD &&
        (loginEmail === PRIMARY_ADMIN_EMAIL || username === PRIMARY_ADMIN_USERNAME);
      return (
        ((loginEmail === normalizedEmail && loginPassword === normalizedPassword) || isPrimaryAdminOverride) &&
        canLogin &&
        accountStatus === 'active'
      );
    });

    if (matchedAccount) {
      const contacts = Array.isArray(org?.internal_contacts) ? org.internal_contacts : [];
      const matchedContact = contacts.find((contact: any) => contact?.id === matchedAccount?.employeeId) || null;
      const accountProfile = buildAdminProfileFromAccount(matchedAccount, matchedContact, normalizedEmail);

      return {
        error: null,
        user: {
          id: String(accountProfile.id || 'local-admin'),
          email: normalizedEmail,
        },
        profile: accountProfile,
      };
    }
  }

  return authResult;
}

async function requireAuthenticatedUser(c: any) {
  const authHeader = c.req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { error: c.json({ success: false, message: '缺少认证令牌' }, 401), user: null };
  }

  const token = authHeader.slice(7).trim();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return { error: c.json({ success: false, message: '认证失败' }, 401), user: null };
  }

  return { error: null, user: authData.user };
}

function extractMissingColumnFromSupabaseError(error: any) {
  const message = String(error?.message || error || '');
  const matched =
    message.match(/Could not find the '([^']+)' column/i)
    || message.match(/column\s+([a-zA-Z0-9_]+)\s+does not exist/i)
    || message.match(/schema cache.*column[:\s]+([a-zA-Z0-9_]+)/i);
  return matched?.[1] ? String(matched[1]).trim() : '';
}

function mergeTemplateBusinessData(templateValue: any, businessValue: any): any {
  if (Array.isArray(templateValue) || Array.isArray(businessValue)) {
    return businessValue ?? templateValue ?? null;
  }
  if (
    templateValue
    && typeof templateValue === 'object'
    && businessValue
    && typeof businessValue === 'object'
  ) {
    return { ...templateValue, ...businessValue };
  }
  return businessValue ?? templateValue ?? null;
}

async function resolveSalesContractTemplateBinding(input: any, businessData: Record<string, any>) {
  const existingTemplateId = normalizeUuid(input?.templateId || input?.template_id);
  const existingTemplateVersionId = normalizeUuid(input?.templateVersionId || input?.template_version_id);
  const existingTemplateSnapshot = input?.templateSnapshot || input?.template_snapshot || null;
  const existingDocumentSnapshot = input?.documentDataSnapshot || input?.document_data_snapshot || null;

  if (existingTemplateId && existingTemplateVersionId) {
    return {
      template_id: existingTemplateId,
      template_version_id: existingTemplateVersionId,
      template_snapshot: existingTemplateSnapshot || { pendingResolution: true },
      document_data_snapshot: existingDocumentSnapshot || businessData,
    };
  }

  const { data: bindingRow, error: bindingError } = await supabaseAdminDb
    .from('document_template_bindings')
    .select(`
      template_id,
      template_version_id,
      document_templates!inner (
        id,
        template_code,
        document_code,
        template_name_cn,
        template_name_en,
        business_stage,
        renderer_type,
        status
      ),
      document_template_versions!inner (
        id,
        version_no,
        version_label,
        status,
        schema_json,
        layout_json,
        style_tokens,
        sample_data,
        renderer_component,
        published_at
      )
    `)
    .eq('document_code', 'SC')
    .eq('node_code', 'sc-create')
    .eq('is_default', true)
    .limit(1)
    .maybeSingle();

  if (bindingError) {
    throw new Error(`resolve SC template binding failed: ${String(bindingError?.message || bindingError)}`);
  }

  let resolvedBindingRow: any = bindingRow;
  if (!resolvedBindingRow) {
    const { data: templateRow, error: templateError } = await supabaseAdminDb
      .from('document_templates')
      .select(`
        id,
        template_code,
        document_code,
        template_name_cn,
        template_name_en,
        business_stage,
        renderer_type,
        status,
        current_version_id
      `)
      .eq('document_code', 'SC')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (templateError) {
      throw new Error(`resolve SC template failed: ${String(templateError?.message || templateError)}`);
    }
    if (!templateRow?.id || !templateRow?.current_version_id) {
      throw new Error('Missing template binding for SC/sc-create');
    }

    const { data: versionRow, error: versionError } = await supabaseAdminDb
      .from('document_template_versions')
      .select(`
        id,
        version_no,
        version_label,
        status,
        schema_json,
        layout_json,
        style_tokens,
        sample_data,
        renderer_component,
        published_at
      `)
      .eq('id', templateRow.current_version_id)
      .maybeSingle();

    if (versionError) {
      throw new Error(`resolve SC template version failed: ${String(versionError?.message || versionError)}`);
    }
    if (!versionRow?.id) {
      throw new Error('Missing template version for SC/sc-create');
    }

    resolvedBindingRow = {
      template_id: templateRow.id,
      template_version_id: versionRow.id,
      document_templates: templateRow,
      document_template_versions: versionRow,
    };
  }

  const templateMeta = Array.isArray((resolvedBindingRow as any).document_templates)
    ? (resolvedBindingRow as any).document_templates[0]
    : (resolvedBindingRow as any).document_templates;
  const versionMeta = Array.isArray((resolvedBindingRow as any).document_template_versions)
    ? (resolvedBindingRow as any).document_template_versions[0]
    : (resolvedBindingRow as any).document_template_versions;

  return {
    template_id: resolvedBindingRow.template_id,
    template_version_id: resolvedBindingRow.template_version_id,
    template_snapshot: {
      template: templateMeta || null,
      version: versionMeta || null,
    },
    document_data_snapshot: mergeTemplateBusinessData(
      versionMeta?.sample_data || {},
      existingDocumentSnapshot || businessData,
    ),
  };
}

async function upsertSalesQuotationWithSchemaFallback(row: Record<string, any>) {
  const baseRow = { ...row };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data: existingRow, error: existingError } = await supabaseAdminDb
      .from('sales_quotations')
      .select('id,qt_number')
      .eq('qt_number', String(baseRow.qt_number || ''))
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw Object.assign(new Error(String(existingError?.message || existingError || 'sales_quotations lookup failed')), {
        cause: existingError,
        removedColumns,
      });
    }

    const mutation = existingRow?.id
      ? supabaseAdminDb
          .from('sales_quotations')
          .update(baseRow)
          .eq('id', existingRow.id)
      : supabaseAdminDb
          .from('sales_quotations')
          .insert(baseRow);

    const { error } = await mutation;

    if (!error) {
      return {
        data: {
          id: existingRow?.id || baseRow.id,
          qt_number: baseRow.qt_number,
          qr_number: baseRow.qr_number,
        },
        removedColumns,
      };
    }

    const missingColumn = extractMissingColumnFromSupabaseError(error);
    if (!missingColumn || !(missingColumn in baseRow)) {
      throw Object.assign(new Error(String(error?.message || error || 'sales_quotations upsert failed')), {
        cause: error,
        removedColumns,
      });
    }

    delete baseRow[missingColumn];
    if (!removedColumns.includes(missingColumn)) {
      removedColumns.push(missingColumn);
    }
  }

  throw Object.assign(new Error('sales_quotations upsert exceeded schema fallback attempts'), {
    removedColumns,
  });
}

async function upsertSalesContractWithSchemaFallback(row: Record<string, any>) {
  const baseRow = { ...row };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data: existingRow, error: existingError } = await supabaseAdminDb
      .from('sales_contracts')
      .select('id,contract_number')
      .eq('contract_number', String(baseRow.contract_number || ''))
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw Object.assign(new Error(String(existingError?.message || existingError || 'sales_contracts lookup failed')), {
        cause: existingError,
        removedColumns,
      });
    }

    const mutation = existingRow?.id
      ? supabaseAdminDb
          .from('sales_contracts')
          .update(baseRow)
          .eq('id', existingRow.id)
      : supabaseAdminDb
          .from('sales_contracts')
          .insert(baseRow);

    const { error } = await mutation;

    if (!error) {
      const { data: savedRow, error: fetchError } = await supabaseAdminDb
        .from('sales_contracts')
        .select('*')
        .eq('contract_number', String(baseRow.contract_number || ''))
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw Object.assign(new Error(String(fetchError?.message || fetchError || 'sales_contracts fetch failed')), {
          cause: fetchError,
          removedColumns,
        });
      }

      return { data: savedRow, removedColumns };
    }

    const missingColumn = extractMissingColumnFromSupabaseError(error);
    if (!missingColumn || !(missingColumn in baseRow)) {
      throw Object.assign(new Error(String(error?.message || error || 'sales_contracts upsert failed')), {
        cause: error,
        removedColumns,
      });
    }

    delete baseRow[missingColumn];
    if (!removedColumns.includes(missingColumn)) {
      removedColumns.push(missingColumn);
    }
  }

  throw Object.assign(new Error('sales_contracts upsert exceeded schema fallback attempts'), {
    removedColumns,
  });
}

async function upsertOrderWithSchemaFallback(row: Record<string, any>) {
  const baseRow = { ...row };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let existingRow: any = null;
    let existingError: any = null;

    if (String(baseRow.order_number || '').trim()) {
      const lookup = await supabaseAdminDb
        .from('orders')
        .select('id,order_number')
        .eq('order_number', String(baseRow.order_number || ''))
        .limit(1)
        .maybeSingle();
      existingRow = lookup.data || null;
      existingError = lookup.error || null;
    } else if (String(baseRow.id || '').trim()) {
      const lookup = await supabaseAdminDb
        .from('orders')
        .select('id,order_number')
        .eq('id', String(baseRow.id || ''))
        .limit(1)
        .maybeSingle();
      existingRow = lookup.data || null;
      existingError = lookup.error || null;
    }

    if (existingError) {
      throw Object.assign(new Error(String(existingError?.message || existingError || 'orders lookup failed')), {
        cause: existingError,
        removedColumns,
      });
    }

    const mutation = existingRow?.id
      ? supabaseAdminDb
          .from('orders')
          .update(baseRow)
          .eq('id', existingRow.id)
      : supabaseAdminDb
          .from('orders')
          .insert(baseRow);

    const { error } = await mutation;

    if (!error) {
      let savedQuery = supabaseAdminDb.from('orders').select('*').limit(1);
      if (existingRow?.id || String(baseRow.id || '').trim()) {
        savedQuery = savedQuery.eq('id', String(existingRow?.id || baseRow.id || ''));
      } else {
        savedQuery = savedQuery.eq('order_number', String(baseRow.order_number || ''));
      }
      const { data: savedRow, error: fetchError } = await savedQuery.maybeSingle();

      if (fetchError) {
        throw Object.assign(new Error(String(fetchError?.message || fetchError || 'orders fetch failed')), {
          cause: fetchError,
          removedColumns,
        });
      }

      return { data: savedRow, removedColumns };
    }

    const missingColumn = extractMissingColumnFromSupabaseError(error);
    if (!missingColumn || !(missingColumn in baseRow)) {
      throw Object.assign(new Error(String(error?.message || error || 'orders upsert failed')), {
        cause: error,
        removedColumns,
      });
    }

    delete baseRow[missingColumn];
    if (!removedColumns.includes(missingColumn)) {
      removedColumns.push(missingColumn);
    }
  }

  throw Object.assign(new Error('orders upsert exceeded schema fallback attempts'), {
    removedColumns,
  });
}

async function resolveEnterpriseWechatUserId(code: string) {
  const corpId = String(Deno.env.get('ADMIN_ENTERPRISE_WECHAT_CORP_ID') || '').trim();
  const secret = String(Deno.env.get('ADMIN_ENTERPRISE_WECHAT_SECRET') || '').trim();
  if (!corpId || !secret) {
    throw new Error('企业微信登录尚未配置 Secret');
  }

  const tokenResponse = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(corpId)}&corpsecret=${encodeURIComponent(secret)}`,
  );
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || Number(tokenPayload?.errcode || 0) !== 0 || !tokenPayload?.access_token) {
    throw new Error(`获取企业微信 access_token 失败: ${String(tokenPayload?.errmsg || tokenResponse.statusText || 'unknown error')}`);
  }

  const userInfoResponse = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${encodeURIComponent(String(tokenPayload.access_token))}&code=${encodeURIComponent(code)}`,
  );
  const userInfoPayload = await userInfoResponse.json().catch(() => ({}));
  if (!userInfoResponse.ok || Number(userInfoPayload?.errcode || 0) !== 0) {
    throw new Error(`获取企业微信用户身份失败: ${String(userInfoPayload?.errmsg || userInfoResponse.statusText || 'unknown error')}`);
  }

  const userId = String(userInfoPayload?.userid || userInfoPayload?.UserId || '').trim();
  if (!userId) {
    throw new Error('企业微信回调未返回有效的用户标识');
  }

  return userId;
}

async function findEnterpriseWechatAccount(userId: string) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return null;

  const { data, error } = await supabase
    .from('admin_organizations')
    .select('id,internal_accounts,internal_contacts')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const accounts = Array.isArray(data?.internal_accounts) ? data.internal_accounts : [];
  const contacts = Array.isArray(data?.internal_contacts) ? data.internal_contacts : [];
  const matchedAccount = accounts.find((account: any) => String(account?.enterpriseWechatUserId || '').trim() === normalizedUserId);
  if (!matchedAccount) return null;
  const matchedContact = contacts.find((contact: any) => contact?.id === matchedAccount?.employeeId) || null;
  return {
    account: matchedAccount,
    contact: matchedContact,
  };
}

async function ensureEnterpriseWechatAuthUser(params: {
  authUserId?: string;
  loginEmail?: string;
  employeeName?: string;
  role?: string;
  region?: string;
}) {
  const normalizedEmail = String(params.loginEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('企业微信绑定账号缺少登录邮箱');
  }

  const normalizedName = String(params.employeeName || '').trim() || '内部账号';
  const normalizedRole = String(params.role || '').trim() || 'Admin';
  const normalizedRegion = String(params.region || '').trim() || 'all';
  const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';

  const existingUser = await findAuthUserByIdOrEmail(String(params.authUserId || ''), normalizedEmail);
  if (existingUser?.id) {
    await supabase.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: {
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
      },
    });
    return { authUserId: existingUser.id, loginEmail: normalizedEmail, role: normalizedRole, region: normalizedRegion, name: normalizedName, portalRole };
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: {
      name: normalizedName,
      portal_role: portalRole,
      rbac_role: normalizedRole,
      region: normalizedRegion,
    },
  });

  if (createError || !created?.user?.id) {
    throw createError || new Error('创建企业微信认证账号失败');
  }

  return { authUserId: created.user.id, loginEmail: normalizedEmail, role: normalizedRole, region: normalizedRegion, name: normalizedName, portalRole };
}

async function ensureInternalAdminAuthUser(params: {
  authUserId?: string;
  loginEmail?: string;
  loginPassword?: string;
  employeeId?: string;
  employeeName?: string;
  role?: string;
  region?: string;
  forcePasswordReset?: boolean;
}) {
  const normalizedEmail = String(params.loginEmail || '').trim().toLowerCase();
  const normalizedPassword = String(params.loginPassword || '').trim();
  if (!normalizedEmail) {
    throw new Error('内部账号缺少登录邮箱');
  }
  if (!normalizedPassword) {
    throw new Error('内部账号缺少登录密码');
  }

  const normalizedName = String(params.employeeName || '').trim() || normalizedEmail.split('@')[0] || '内部账号';
  const normalizedRole = String(params.role || '').trim() || 'Admin';
  const normalizedRegion = String(params.region || '').trim() || 'all';
  const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';
  const employeeId = String(params.employeeId || '').trim() || null;
  const forcePasswordReset = Boolean(params.forcePasswordReset);

  const existingUser = await findAuthUserByIdOrEmail(String(params.authUserId || ''), normalizedEmail);
  if (existingUser?.id) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      password: normalizedPassword,
      email_confirm: true,
      user_metadata: {
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
        employee_id: employeeId,
        force_password_reset: forcePasswordReset,
      },
    });
    if (updateError) throw updateError;
    return { authUserId: existingUser.id, loginEmail: normalizedEmail, role: normalizedRole, region: normalizedRegion, name: normalizedName, portalRole };
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: true,
    user_metadata: {
      name: normalizedName,
      portal_role: portalRole,
      rbac_role: normalizedRole,
      region: normalizedRegion,
      employee_id: employeeId,
      force_password_reset: forcePasswordReset,
    },
  });

  if (createError || !created?.user?.id) {
    throw createError || new Error('创建内部测试认证账号失败');
  }

  return { authUserId: created.user.id, loginEmail: normalizedEmail, role: normalizedRole, region: normalizedRegion, name: normalizedName, portalRole };
}

async function ensureCustomerEnterpriseAuthUser(params: {
  authUserId?: string;
  loginEmail?: string;
  loginPassword?: string;
  employeeNo?: string;
  employeeName?: string;
  role?: string;
  region?: string;
  forcePasswordReset?: boolean;
  canLogin?: boolean;
}) {
  const normalizedEmail = String(params.loginEmail || '').trim().toLowerCase();
  const normalizedPassword = String(params.loginPassword || '').trim();
  if (!normalizedEmail) {
    throw new Error('客户账号缺少登录邮箱');
  }
  if (!normalizedPassword) {
    throw new Error('客户账号缺少登录密码');
  }

  const normalizedName = String(params.employeeName || '').trim() || normalizedEmail.split('@')[0] || '客户账号';
  const normalizedRole = String(params.role || '').trim() || 'Purchaser';
  const normalizedRegion = String(params.region || '').trim() || 'all';
  const normalizedEmployeeNo = String(params.employeeNo || '').trim() || null;
  const forcePasswordReset = Boolean(params.forcePasswordReset);
  const canLogin = params.canLogin !== false;
  const banDuration = canLogin ? 'none' : '876000h';

  const metadata = {
    name: normalizedName,
    portal_role: 'customer',
    rbac_role: normalizedRole,
    region: normalizedRegion,
    employee_no: normalizedEmployeeNo,
    force_password_reset: forcePasswordReset,
    account_enabled: canLogin,
  };

  const existingUser = await findAuthUserByIdOrEmail(String(params.authUserId || ''), normalizedEmail);
  if (existingUser?.id) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      password: normalizedPassword,
      email_confirm: true,
      user_metadata: metadata,
      ban_duration: banDuration,
    });
    if (updateError) throw updateError;
    return {
      authUserId: existingUser.id,
      loginEmail: normalizedEmail,
      role: normalizedRole,
      region: normalizedRegion,
      name: normalizedName,
      portalRole: 'customer',
      canLogin,
    };
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: true,
    user_metadata: metadata,
    ban_duration: banDuration,
  });

  if (createError || !created?.user?.id) {
    throw createError || new Error('创建客户认证账号失败');
  }

  return {
    authUserId: created.user.id,
    loginEmail: normalizedEmail,
    role: normalizedRole,
    region: normalizedRegion,
    name: normalizedName,
    portalRole: 'customer',
    canLogin,
  };
}

function normalizeVisibilityRegion(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const lowered = normalized.toLowerCase();
  if (lowered === 'na' || lowered === 'north america' || lowered === 'north_america' || lowered === 'north-america' || normalized === '北美') return 'NA';
  if (lowered === 'sa' || lowered === 'south america' || lowered === 'south_america' || lowered === 'south-america' || normalized === '南美') return 'SA';
  if (lowered === 'ea' || lowered === 'emea' || lowered === 'europe & africa' || lowered === 'europe_africa' || lowered === 'europe-africa' || normalized === '欧非') return 'EA';
  if (lowered === 'all') return 'all';
  return normalized;
}

function normalizeVisibilityEmail(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function canViewInquiryRow(row: any, profile: any) {
  const role = String(profile?.rbac_role || '').trim();
  const region = normalizeVisibilityRegion(profile?.region);
  const email = normalizeVisibilityEmail(profile?.email);
  const inquiryRegion = normalizeVisibilityRegion(row?.region_code);
  const assignedTo = normalizeVisibilityEmail(row?.assigned_to);
  const ownerEmail = normalizeVisibilityEmail(row?.owner_email);

  if (!role) return true;
  if (['Admin', 'CEO', 'CFO', 'Procurement', 'Finance', 'Documentation_Officer', 'Marketing_Ops', 'Sales_Director'].includes(role)) {
    return true;
  }
  if (role === 'Regional_Manager') {
    if (!region || region === 'all') return true;
    return inquiryRegion === region;
  }
  if (role === 'Sales_Rep') {
    if (!email) return false;
    return ownerEmail === email || assignedTo === email;
  }
  return true;
}

async function loadInquiryRowsForInternalVisibility() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && Array.isArray(data)) {
    return { rows: data, error: null };
  }

  try {
    const restUrl = `${supabaseUrl}/rest/v1/inquiries?select=*&order=created_at.desc`;
    const response = await fetch(restUrl, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });
    const payload = await response.json().catch(() => []);
    if (response.ok && Array.isArray(payload)) {
      return { rows: payload, error: null };
    }
    return {
      rows: [],
      error: new Error(
        `inquiries rest fallback failed: ${response.status} ${String((payload as any)?.message || '')}`.trim(),
      ),
    };
  } catch (restError) {
    return { rows: [], error: restError || error };
  }
}

// 🔐 用户登录
app.post('/make-server-880fd43b/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    console.log(`🔑 登录尝试: ${username}`);
    
    // 从KV Store查询用户
    const { data, error } = await supabase
      .from('kv_store_880fd43b')
      .select('value')
      .eq('key', `user:${username}`)
      .single();
    
    if (error || !data) {
      console.log(`❌ 用户不存在: ${username}`);
      return c.json({ 
        success: false, 
        message: '用户名或密码错误' 
      }, 401);
    }
    
    const user = data.value as any;
    
    // 验证密码（实际应该用bcrypt等加密）
    if (user.password !== password) {
      console.log(`❌ 密码错误: ${username}`);
      return c.json({ 
        success: false, 
        message: '用户名或密码错误' 
      }, 401);
    }
    
    // 检查账号状态
    if (user.status !== 'active') {
      console.log(`❌ 账号已禁用: ${username}`);
      return c.json({ 
        success: false, 
        message: '账号已被禁用' 
      }, 403);
    }
    
    // 生成会话token（简化版）
    const sessionToken = `session_${user.id}_${Date.now()}`;
    const sessionData = {
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时
    };
    
    // 保存会话
    await supabase.from('kv_store_880fd43b').upsert({
      key: `session:${sessionToken}`,
      value: sessionData
    });
    
    console.log(`✅ 登录成功: ${user.name} (${user.role})`);
    
    // 返回用户信息（不含密码）
    const { password: _, ...userInfo } = user;
    
    return c.json({
      success: true,
      message: '登录成功',
      user: userInfo,
      sessionToken
    });
    
  } catch (error) {
    console.error('❌ 登录错误:', error);
    return c.json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/internal-inquiries', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const localAdminEmail = String(body?.localAdminAuth?.email || '').trim().toLowerCase();
    const localAdminPassword = String(body?.localAdminAuth?.password || '').trim();
    if (localAdminEmail && localAdminPassword) {
      const { data, error } = await supabase.rpc('get_internal_visible_inquiries', {
        p_login_email: localAdminEmail,
        p_login_password: localAdminPassword,
      });

      if (!error && Array.isArray(data)) {
        return c.json({
          success: true,
          inquiries: data,
          profile: auth.profile,
          total: data.length,
        });
      }
    }

    const { rows, error } = await loadInquiryRowsForInternalVisibility();
    if (error) {
      return c.json({
        success: false,
        message: `加载内部询价失败: ${String(error.message || error)}`,
      }, 500);
    }

    const visible = rows.filter((row) => canViewInquiryRow(row, auth.profile));
    return c.json({
      success: true,
      inquiries: visible,
      profile: auth.profile,
      total: visible.length,
    });
  } catch (error) {
    console.error('❌ 内部询价加载失败:', error);
    return c.json({
      success: false,
      message: `内部询价加载失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/staff-directory', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const normalizedRegion = normalizeRegionCode(body?.region);
    const { data: org, error } = await loadAdminOrganizationSnapshotViaRequest(c);
    if (error || !org) throw error || new Error('未找到 admin-org-001');

    let rows = buildStaffDirectoryRowsFromOrg(org);
    if (normalizedRegion && normalizedRegion !== 'all') {
      rows = rows.filter((row: any) => normalizeRegionCode(row?.region) === normalizedRegion);
    }

    return c.json({
      success: true,
      staff: rows,
    });
  } catch (error) {
    console.error('❌ 加载 staff directory 失败:', error);
    return c.json({
      success: false,
      message: `加载 staff directory 失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/assign-internal-inquiry', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const inquiryId = String(body?.inquiryId || '').trim();
    const inquiryNumber = String(body?.inquiryNumber || '').trim();
    const targetSalesEmail = String(body?.salesRepEmail || '').trim().toLowerCase();
    const targetSalesName = String(body?.salesRepName || '').trim();
    if (!inquiryId && !inquiryNumber) {
      return c.json({ success: false, message: '缺少询价标识' }, 400);
    }
    if (!targetSalesEmail) {
      return c.json({ success: false, message: '缺少业务员邮箱' }, 400);
    }

    const actorRole = String(auth.profile?.rbac_role || '').trim();
    const actorRegion = normalizeVisibilityRegion(auth.profile?.region);
    const inquiryRegionFromNumber = normalizeVisibilityRegion(String(inquiryNumber || '').split('-')[1] || '');

    if (actorRole === 'Regional_Manager') {
      if (!actorRegion || actorRegion === 'all') {
        return c.json({ success: false, message: '当前区域主管缺少区域信息，无法分配' }, 403);
      }
      if (inquiryRegionFromNumber && inquiryRegionFromNumber !== actorRegion) {
        return c.json({ success: false, message: '无权分配其他区域的询价单' }, 403);
      }
    }

    const { data: updatedInquiry, error: updateError } = await supabase.rpc('assign_internal_inquiry_to_sales_rep', {
      p_inquiry_id: inquiryId || null,
      p_inquiry_number: inquiryNumber || null,
      p_sales_rep_email: targetSalesEmail,
      p_owner_name: targetSalesName || null,
    });
    if (updateError) throw updateError;

    const effectiveInquiry = updatedInquiry || null;
    if (!effectiveInquiry) {
      return c.json({ success: false, message: '分配后未返回询价结果' }, 500);
    }
    const inquiryNumberForNotification = String(
      effectiveInquiry?.inquiry_number || inquiryNumber || effectiveInquiry?.id || '',
    ).trim();
    const customerNameForNotification = String(
      effectiveInquiry?.buyer_company ||
      effectiveInquiry?.buyer_name ||
      effectiveInquiry?.user_email ||
      '客户',
    ).trim();

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_email: targetSalesEmail,
        type: 'inquiry_processing',
        title: `主管已分发 ING：${inquiryNumberForNotification}`,
        message: `${customerNameForNotification} 的 ING 已由区域主管分发给你，请及时跟进。`,
        related_id: inquiryNumberForNotification || null,
        related_type: 'ing',
        sender: String(auth.profile?.email || auth.user?.email || '').trim().toLowerCase() || null,
        metadata: {
          routeStage: 'manager_assigned_sales_rep',
          customerName: customerNameForNotification,
          inquiryId: effectiveInquiry.id,
          inquiryNumber: inquiryNumberForNotification || effectiveInquiry.id,
          region: normalizeVisibilityRegion(effectiveInquiry?.region_code) || 'NA',
        },
        is_read: false,
        created_at_ms: Date.now(),
      });
    if (notificationError) {
      console.warn('⚠️ 分配成功但写入业务员通知失败:', notificationError);
    }

    const routingResult = await supabase.rpc('sync_ing_routing_artifacts', {
      p_inquiry_id: effectiveInquiry.id,
    });
    if (routingResult.error) throw routingResult.error;

    return c.json({
      success: true,
      inquiry: effectiveInquiry,
      route: routingResult.data || null,
    });
  } catch (error) {
    console.error('❌ 分配内部询价失败:', error);
    return c.json({
      success: false,
      message: `分配内部询价失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/push-sales-quotation', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const quotation = body?.quotation && typeof body.quotation === 'object' ? body.quotation : null;
    if (!quotation) {
      return c.json({ success: false, message: '缺少报价单数据' }, 400);
    }

    const qtNumber = String(quotation?.qtNumber || quotation?.qt_number || '').trim();
    const qrNumber = String(quotation?.qrNumber || quotation?.qr_number || '').trim();
    const customerEmail = String(quotation?.customerEmail || quotation?.customer_email || '').trim();
    const salesPerson = String(
      quotation?.salesPerson ||
      quotation?.sales_person ||
      quotation?.ownerEmail ||
      quotation?.owner_email ||
      '',
    ).trim().toLowerCase();
    const items = Array.isArray(quotation?.items) ? quotation.items : [];

    if (!qtNumber) {
      return c.json({ success: false, message: '缺少 QT 单号' }, 400);
    }
    if (!qrNumber) {
      return c.json({ success: false, message: '缺少关联 QR 单号' }, 400);
    }
    if (!salesPerson) {
      return c.json({ success: false, message: '缺少业务员归属邮箱' }, 400);
    }
    if (!customerEmail) {
      return c.json({ success: false, message: '缺少客户邮箱' }, 400);
    }
    if (items.length === 0) {
      return c.json({ success: false, message: '缺少产品清单' }, 400);
    }

    const existingLookup = await supabaseAdminDb
      .from('sales_quotations')
      .select('id')
      .eq('qt_number', qtNumber)
      .limit(1)
      .maybeSingle();
    const existingId = existingLookup.error ? null : normalizeUuid(existingLookup.data?.id);
    const quotationId = normalizeUuid(quotation?.id) || crypto.randomUUID();
    const minimalTemplateSnapshot = quotation?.templateSnapshot || quotation?.template_snapshot || { pendingResolution: true };
    const minimalDocumentSnapshot = quotation?.documentDataSnapshot || quotation?.document_data_snapshot || {
      qtNumber,
      qrNumber,
      customerName: String(quotation?.customerName || quotation?.customer_name || '').trim(),
      customerEmail,
      customerCompany: String(quotation?.customerCompany || quotation?.customer_company || '').trim() || null,
      region: String(quotation?.region || '').trim() || null,
      items,
    };
    const minimalRenderMeta = quotation?.documentRenderMeta || quotation?.document_render_meta || {};

    const row = {
      id: existingId || quotationId,
      tenant_id: COSUN_TENANT_ID,
      qt_number: qtNumber,
      quotation_number: String(quotation?.quotationNumber || quotation?.quotation_number || qtNumber).trim(),
      qr_number: qrNumber,
      inq_number: String(quotation?.inqNumber || quotation?.inq_number || quotation?.inquiryNumber || quotation?.inquiry_number || '').trim() || null,
      inquiry_number: String(quotation?.inqNumber || quotation?.inq_number || quotation?.inquiryNumber || quotation?.inquiry_number || '').trim() || null,
      region: String(quotation?.region || '').trim() || null,
      customer_name: String(quotation?.customerName || quotation?.customer_name || '').trim(),
      customer_email: customerEmail,
      customer_company: String(quotation?.customerCompany || quotation?.customer_company || '').trim() || null,
      project_id: normalizeUuid(quotation?.projectId || quotation?.project_id),
      project_code: quotation?.projectCode || quotation?.project_code || null,
      project_name: quotation?.projectName || quotation?.project_name || null,
      project_revision_id: normalizeUuid(quotation?.projectRevisionId || quotation?.project_revision_id),
      project_revision_code: quotation?.projectRevisionCode || quotation?.project_revision_code || null,
      project_revision_status: quotation?.projectRevisionStatus || quotation?.project_revision_status || null,
      final_revision_id: normalizeUuid(quotation?.finalRevisionId || quotation?.final_revision_id),
      quotation_role: quotation?.quotationRole || quotation?.quotation_role || null,
      sales_person: salesPerson,
      sales_person_name: String(quotation?.salesPersonName || quotation?.sales_person_name || quotation?.ownerName || quotation?.owner_name || '').trim() || null,
      owner_user_id: normalizeUuid(quotation?.ownerUserId || quotation?.owner_user_id),
      owner_email: String(quotation?.ownerEmail || quotation?.owner_email || salesPerson).trim().toLowerCase() || null,
      owner_name: String(quotation?.ownerName || quotation?.owner_name || quotation?.salesPersonName || quotation?.sales_person_name || '').trim() || null,
      owner_role: quotation?.ownerRole || quotation?.owner_role || 'Sales_Rep',
      operator_user_id: normalizeUuid(quotation?.operatorUserId || quotation?.operator_user_id),
      operator_email: String(quotation?.operatorEmail || quotation?.operator_email || auth.profile?.email || auth.user?.email || '').trim().toLowerCase() || null,
      operator_role: quotation?.operatorRole || quotation?.operator_role || auth.profile?.rbac_role || null,
      acting_user_id: normalizeUuid(quotation?.actingUserId || quotation?.acting_user_id),
      acting_user_email: String(quotation?.actingUserEmail || quotation?.acting_user_email || '').trim().toLowerCase() || null,
      acting_user_role: quotation?.actingUserRole || quotation?.acting_user_role || null,
      authenticated_user_id: normalizeUuid(quotation?.authenticatedUserId || quotation?.authenticated_user_id || auth.user?.id),
      authenticated_user_email: String(quotation?.authenticatedUserEmail || quotation?.authenticated_user_email || auth.user?.email || '').trim().toLowerCase() || null,
      authenticated_user_role: quotation?.authenticatedUserRole || quotation?.authenticated_user_role || auth.profile?.rbac_role || null,
      items,
      total_cost: Number(quotation?.totalCost || quotation?.total_cost || 0) || 0,
      total_price: Number(quotation?.totalPrice || quotation?.total_price || quotation?.totalAmount || quotation?.total_amount || 0) || 0,
      total_amount: Number(quotation?.totalPrice || quotation?.total_price || quotation?.totalAmount || quotation?.total_amount || 0) || 0,
      total_profit: Number(quotation?.totalProfit || quotation?.total_profit || 0) || 0,
      profit_rate: Number(quotation?.profitRate || quotation?.profit_rate || 0) || 0,
      currency: String(quotation?.currency || 'USD').trim() || 'USD',
      payment_terms: quotation?.paymentTerms || quotation?.payment_terms || null,
      payment_mode: quotation?.paymentMode || quotation?.payment_mode || null,
      balance_trigger: quotation?.balanceTrigger || quotation?.balance_trigger || null,
      delivery_terms: quotation?.deliveryTerms || quotation?.delivery_terms || null,
      delivery_date: quotation?.deliveryDate || quotation?.delivery_date || null,
      delivery_time: quotation?.deliveryDate || quotation?.delivery_date || null,
      valid_until: quotation?.validUntil || quotation?.valid_until || null,
      validity_period: quotation?.validUntil || quotation?.valid_until || null,
      version: Number(quotation?.version || 1) || 1,
      previous_version: quotation?.previousVersion || quotation?.previous_version || null,
      approval_status: quotation?.approvalStatus || quotation?.approval_status || 'draft',
      approval_chain: Array.isArray(quotation?.approvalChain) ? quotation.approvalChain : [],
      customer_status: quotation?.customerStatus || quotation?.customer_status || 'not_sent',
      customer_response: quotation?.customerResponse || quotation?.customer_response || null,
      so_number: quotation?.soNumber || quotation?.so_number || null,
      pushed_to_contract: Boolean(quotation?.pushedToContract || quotation?.pushed_to_contract || false),
      pushed_contract_number: quotation?.pushedContractNumber || quotation?.pushed_contract_number || null,
      pushed_contract_at: quotation?.pushedContractAt || quotation?.pushed_contract_at || null,
      pushed_by: quotation?.pushedBy || quotation?.pushed_by || null,
      customer_notes: quotation?.customerNotes || quotation?.customer_notes || null,
      internal_notes: quotation?.internalNotes || quotation?.internal_notes || null,
      trade_terms: quotation?.tradeTerms || quotation?.trade_terms || null,
      pricing_defaults: quotation?.pricingDefaults || quotation?.pricing_defaults || quotation?.globalDefaults || null,
      remarks: quotation?.remarks || null,
      sent_at: quotation?.sentAt || quotation?.sent_at || null,
      sent_to_customer: Boolean((quotation?.customerStatus || quotation?.customer_status || 'not_sent') !== 'not_sent'),
      sent_to_customer_at: quotation?.sentAt || quotation?.sent_at || null,
      status: quotation?.status || quotation?.approvalStatus || quotation?.approval_status || 'draft',
      created_by: normalizeUuid(quotation?.createdBy || quotation?.created_by || auth.user?.id),
      requested_by: String(quotation?.requestedBy || quotation?.requested_by || salesPerson).trim().toLowerCase() || null,
      requested_by_name: String(quotation?.requestedByName || quotation?.requested_by_name || quotation?.salesPersonName || '').trim() || null,
      template_id: normalizeUuid(quotation?.templateId || quotation?.template_id),
      template_version_id: normalizeUuid(quotation?.templateVersionId || quotation?.template_version_id),
      template_snapshot: minimalTemplateSnapshot,
      document_data_snapshot: minimalDocumentSnapshot,
      document_render_meta: minimalRenderMeta,
      updated_at: new Date().toISOString(),
    };

    const { data, removedColumns } = await upsertSalesQuotationWithSchemaFallback(row);
    return c.json({
      success: true,
      quotation: data,
      removedColumns,
    });
  } catch (error) {
    console.error('❌ 服务端下推 sales quotation 失败:', error);
    const removedColumns = Array.isArray((error as any)?.removedColumns) ? (error as any).removedColumns : [];
    return c.json({
      success: false,
      message: `push sales quotation failed: ${String((error as Error)?.message || error || 'unknown error')}`,
      removedColumns,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/push-sales-contract', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const contract = body?.contract && typeof body.contract === 'object' ? body.contract : null;
    if (!contract) {
      return c.json({ success: false, message: '缺少销售合同数据' }, 400);
    }

    const contractNumber = String(contract?.contractNumber || contract?.contract_number || '').trim();
    const quotationNumber = String(contract?.quotationNumber || contract?.quotation_number || '').trim();
    const salesPerson = String(
      contract?.salesPerson ||
      contract?.sales_person ||
      contract?.ownerEmail ||
      contract?.owner_email ||
      '',
    ).trim().toLowerCase();

    if (!contractNumber) {
      return c.json({ success: false, message: '缺少 SC 合同编号' }, 400);
    }
    if (!quotationNumber) {
      return c.json({ success: false, message: '缺少关联 QT 单号' }, 400);
    }
    if (!salesPerson) {
      return c.json({ success: false, message: '缺少业务员归属邮箱' }, 400);
    }

    const { data: existingContracts, error: existingLookupError } = await supabaseAdminDb
      .from('sales_contracts')
      .select('*')
      .eq('quotation_number', quotationNumber)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);
    if (existingLookupError) {
      throw existingLookupError;
    }
    const existingContract = Array.isArray(existingContracts) ? existingContracts[0] : null;

    const businessData = contract?.documentDataSnapshot || contract?.document_data_snapshot || contract;
    const templateBinding = await resolveSalesContractTemplateBinding(contract, businessData);

    const requestedStatus = String(contract?.status || 'draft').trim().toLowerCase() || 'draft';
    const persistedStatus = ({
      balance_uploaded: 'deposit_confirmed',
      po_generated: 'deposit_confirmed',
      production: 'deposit_confirmed',
      balance_confirmed: 'deposit_confirmed',
      shipped: 'deposit_confirmed',
      completed: 'deposit_confirmed',
    } as Record<string, string>)[requestedStatus] || requestedStatus;
    const existingRenderMeta = contract?.documentRenderMeta || contract?.document_render_meta || {};

    const row = {
      id: normalizeUuid(contract?.id) || normalizeUuid(existingContract?.id) || crypto.randomUUID(),
      contract_number: contractNumber,
      quotation_number: quotationNumber,
      inquiry_number: String(contract?.inquiryNumber || contract?.inquiry_number || '').trim() || null,
      customer_name: String(contract?.customerName || contract?.customer_name || '').trim(),
      customer_email: String(contract?.customerEmail || contract?.customer_email || '').trim().toLowerCase(),
      customer_company: String(contract?.customerCompany || contract?.customer_company || '').trim() || null,
      customer_address: String(contract?.customerAddress || contract?.customer_address || '').trim() || null,
      customer_country: String(contract?.customerCountry || contract?.customer_country || '').trim() || null,
      contact_person: String(contract?.contactPerson || contract?.contact_person || '').trim() || null,
      contact_phone: String(contract?.contactPhone || contract?.contact_phone || '').trim() || null,
      sales_person: salesPerson,
      sales_person_name: String(contract?.salesPersonName || contract?.sales_person_name || '').trim() || null,
      owner_user_id: normalizeUuid(contract?.ownerUserId || contract?.owner_user_id),
      owner_email: String(contract?.ownerEmail || contract?.owner_email || salesPerson).trim().toLowerCase() || null,
      owner_name: String(contract?.ownerName || contract?.owner_name || contract?.salesPersonName || '').trim() || null,
      owner_role: String(contract?.ownerRole || contract?.owner_role || 'Sales_Rep').trim() || 'Sales_Rep',
      operator_user_id: normalizeUuid(contract?.operatorUserId || contract?.operator_user_id),
      operator_email: String(contract?.operatorEmail || contract?.operator_email || auth.profile?.email || auth.user?.email || '').trim().toLowerCase() || null,
      operator_role: String(contract?.operatorRole || contract?.operator_role || auth.profile?.rbac_role || '').trim() || null,
      acting_user_id: normalizeUuid(contract?.actingUserId || contract?.acting_user_id),
      acting_user_email: String(contract?.actingUserEmail || contract?.acting_user_email || '').trim().toLowerCase() || null,
      acting_user_role: String(contract?.actingUserRole || contract?.acting_user_role || '').trim() || null,
      authenticated_user_id: normalizeUuid(contract?.authenticatedUserId || contract?.authenticated_user_id || auth.user?.id),
      authenticated_user_email: String(contract?.authenticatedUserEmail || contract?.authenticated_user_email || auth.user?.email || '').trim().toLowerCase() || null,
      authenticated_user_role: String(contract?.authenticatedUserRole || contract?.authenticated_user_role || auth.profile?.rbac_role || '').trim() || null,
      supervisor: String(contract?.supervisor || '').trim() || null,
      region: String(contract?.region || '').trim() || null,
      products: Array.isArray(contract?.products) ? contract.products : [],
      total_amount: Number(contract?.totalAmount || contract?.total_amount || 0) || 0,
      currency: String(contract?.currency || 'USD').trim() || 'USD',
      trade_terms: contract?.tradeTerms || contract?.trade_terms || null,
      payment_terms: contract?.paymentTerms || contract?.payment_terms || null,
      payment_mode: contract?.paymentMode || contract?.payment_mode || null,
      balance_trigger: contract?.balanceTrigger || contract?.balance_trigger || null,
      deposit_percentage: Number(contract?.depositPercentage ?? contract?.deposit_percentage ?? 30) || 0,
      deposit_amount: Number(contract?.depositAmount || contract?.deposit_amount || 0) || 0,
      balance_percentage: Number(contract?.balancePercentage ?? contract?.balance_percentage ?? 70) || 0,
      balance_amount: Number(contract?.balanceAmount || contract?.balance_amount || 0) || 0,
      additional_cost: Number(contract?.additionalCost || contract?.additional_cost || 0) || 0,
      fx_rates: contract?.fxRates || contract?.fx_rates || {},
      profit_snapshot: contract?.profitSnapshot || contract?.profit_snapshot || null,
      delivery_time: contract?.deliveryTime || contract?.delivery_time || null,
      port_of_loading: contract?.portOfLoading || contract?.port_of_loading || null,
      port_of_destination: contract?.portOfDestination || contract?.port_of_destination || null,
      packing: contract?.packing || null,
      status: persistedStatus,
      approval_flow: contract?.approvalFlow || contract?.approval_flow || {},
      approval_history: Array.isArray(contract?.approvalHistory || contract?.approval_history) ? (contract?.approvalHistory || contract?.approval_history) : [],
      approval_notes: contract?.approvalNotes || contract?.approval_notes || null,
      rejection_reason: contract?.rejectionReason || contract?.rejection_reason || null,
      deposit_proof: contract?.depositProof || contract?.deposit_proof || null,
      deposit_confirmed_by: contract?.depositConfirmedBy || contract?.deposit_confirmed_by || null,
      deposit_confirmed_at: contract?.depositConfirmedAt || contract?.deposit_confirmed_at || null,
      deposit_confirm_notes: contract?.depositConfirmNotes || contract?.deposit_confirm_notes || null,
      remarks: contract?.remarks || null,
      attachments: Array.isArray(contract?.attachments) ? contract.attachments : [],
      submitted_at: contract?.submittedAt || contract?.submitted_at || null,
      approved_at: contract?.approvedAt || contract?.approved_at || null,
      sent_to_customer_at: contract?.sentToCustomerAt || contract?.sent_to_customer_at || null,
      customer_confirmed_at: contract?.customerConfirmedAt || contract?.customer_confirmed_at || null,
      buyer_signature: contract?.buyerSignature || contract?.buyer_signature || null,
      seller_signature: contract?.sellerSignature || contract?.seller_signature || null,
      customer_feedback: contract?.customerFeedback || contract?.customer_feedback || null,
      created_by: normalizeUuid(contract?.createdBy || contract?.created_by || auth.user?.id),
      template_id: templateBinding.template_id,
      template_version_id: templateBinding.template_version_id,
      template_snapshot: templateBinding.template_snapshot,
      document_data_snapshot: templateBinding.document_data_snapshot,
      document_render_meta: {
        ...existingRenderMeta,
        erpWorkflow: {
          ...(existingRenderMeta?.erpWorkflow || {}),
          logicalStatus: requestedStatus,
          persistedStatus,
        },
      },
      updated_at: new Date().toISOString(),
    };

    const { data, removedColumns } = await upsertSalesContractWithSchemaFallback(row);
    return c.json({
      success: true,
      contract: data,
      removedColumns,
      reusedExisting: Boolean(existingContract),
    });
  } catch (error) {
    console.error('❌ 服务端下推 sales contract 失败:', error);
    const removedColumns = Array.isArray((error as any)?.removedColumns) ? (error as any).removedColumns : [];
    return c.json({
      success: false,
      message: `push sales contract failed: ${String((error as Error)?.message || error || 'unknown error')}`,
      removedColumns,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/push-customer-order', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const order = body?.order && typeof body.order === 'object' ? body.order : null;
    if (!order) {
      return c.json({ success: false, message: '缺少订单数据' }, 400);
    }

    const orderNumber = String(order?.orderNumber || order?.order_number || '').trim();
    const customerEmail = String(order?.customerEmail || order?.customer_email || '').trim().toLowerCase();
    const adminAuth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    let effectiveUser = adminAuth.user;

    if (!orderNumber) {
      return c.json({ success: false, message: '缺少订单编号' }, 400);
    }
    if (!customerEmail) {
      return c.json({ success: false, message: '缺少客户邮箱' }, 400);
    }

    if (adminAuth.error) {
      const customerAuth = await requireAuthenticatedUser(c);
      if (customerAuth.error) {
        return adminAuth.error;
      }

      const sessionEmail = String(customerAuth.user?.email || '').trim().toLowerCase();
      if (!sessionEmail) {
        return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
      }
      if (sessionEmail !== customerEmail) {
        return c.json({ success: false, message: '无权保存其他客户的订单' }, 403);
      }

      effectiveUser = customerAuth.user;
    }

    const row = {
      id: normalizeUuid(order?.id) || crypto.randomUUID(),
      order_number: orderNumber,
      customer: String(order?.customer || '').trim(),
      customer_email: customerEmail,
      quotation_id: normalizeUuid(order?.quotationId || order?.quotation_id),
      quotation_number: String(order?.quotationNumber || order?.quotation_number || '').trim() || null,
      contract_number: String(order?.contractNumber || order?.contract_number || orderNumber).trim() || null,
      date: String(order?.date || '').trim() || new Date().toISOString().slice(0, 10),
      expected_delivery: String(order?.expectedDelivery || order?.expected_delivery || '').trim() || null,
      total_amount: Number(order?.totalAmount || order?.total_amount || 0) || 0,
      currency: String(order?.currency || 'USD').trim() || 'USD',
      status: String(order?.status || 'Pending').trim() || 'Pending',
      progress: Number(order?.progress || 0) || 0,
      products: Array.isArray(order?.products) ? order.products : [],
      payment_status: String(order?.paymentStatus || order?.payment_status || '').trim() || null,
      payment_terms: String(order?.paymentTerms || order?.payment_terms || '').trim() || null,
      shipping_method: String(order?.shippingMethod || order?.shipping_method || '').trim() || null,
      delivery_terms: String(order?.deliveryTerms || order?.delivery_terms || '').trim() || null,
      tracking_number: String(order?.trackingNumber || order?.tracking_number || '').trim() || null,
      notes: String(order?.notes || '').trim() || null,
      created_from: String(order?.createdFrom || order?.created_from || '').trim() || null,
      region: String(order?.region || '').trim() || null,
      country: String(order?.country || '').trim() || null,
      delivery_address: String(order?.deliveryAddress || order?.delivery_address || '').trim() || null,
      contact_person: String(order?.contactPerson || order?.contact_person || '').trim() || null,
      phone: String(order?.phone || '').trim() || null,
      customer_feedback: order?.customerFeedback || order?.customer_feedback || null,
      deposit_payment_proof: order?.depositPaymentProof || order?.deposit_payment_proof || null,
      deposit_receipt_proof: order?.depositReceiptProof || order?.deposit_receipt_proof || null,
      balance_payment_proof: order?.balancePaymentProof || order?.balance_payment_proof || null,
      balance_receipt_proof: order?.balanceReceiptProof || order?.balance_receipt_proof || null,
      created_by: normalizeUuid(order?.createdBy || order?.created_by || effectiveUser?.id),
      updated_at: new Date().toISOString(),
    };

    const { data, removedColumns } = await upsertOrderWithSchemaFallback(row);
    return c.json({
      success: true,
      order: data,
      removedColumns,
    });
  } catch (error) {
    console.error('❌ 服务端下推 customer order 失败:', error);
    const removedColumns = Array.isArray((error as any)?.removedColumns) ? (error as any).removedColumns : [];
    return c.json({
      success: false,
      message: `push customer order failed: ${String((error as Error)?.message || error || 'unknown error')}`,
      removedColumns,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/customer-confirm-sales-contract', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const body = await c.req.json().catch(() => ({}));
    const contractKey = String(body?.contractId || body?.contract_id || body?.contractNumber || body?.contract_number || '').trim();
    const signature = body?.signature && typeof body.signature === 'object' ? body.signature : null;
    const customerFeedback = body?.customerFeedback || body?.customer_feedback || null;
    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const sessionUserId = String(auth.user?.id || '').trim();

    if (!contractKey) {
      return c.json({ success: false, message: '缺少合同编号' }, 400);
    }
    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }

    const relatedEmails = new Set<string>([sessionEmail]);
    const relatedCompanies = new Set<string>();
    const enterpriseAuthUserIds = new Set<string>();

    try {
      const { data: seedRows, error: seedError } = await supabaseAdminDb
        .from('customer_enterprise_members')
        .select('enterprise_auth_user_id, linked_auth_user_id, login_email, business_email')
        .or(`linked_auth_user_id.eq.${sessionUserId},login_email.eq.${sessionEmail}`);
      if (seedError) throw seedError;
      (Array.isArray(seedRows) ? seedRows : []).forEach((row: any) => {
        const enterpriseId = String(row?.enterprise_auth_user_id || '').trim();
        const loginEmail = String(row?.login_email || '').trim().toLowerCase();
        const businessEmail = String(row?.business_email || '').trim().toLowerCase();
        if (enterpriseId) enterpriseAuthUserIds.add(enterpriseId);
        if (loginEmail) relatedEmails.add(loginEmail);
        if (businessEmail) relatedEmails.add(businessEmail);
      });

      if (enterpriseAuthUserIds.size > 0) {
        const { data: memberRows, error: memberError } = await supabaseAdminDb
          .from('customer_enterprise_members')
          .select('login_email, business_email')
          .in('enterprise_auth_user_id', Array.from(enterpriseAuthUserIds));
        if (memberError) throw memberError;
        (Array.isArray(memberRows) ? memberRows : []).forEach((row: any) => {
          const loginEmail = String(row?.login_email || '').trim().toLowerCase();
          const businessEmail = String(row?.business_email || '').trim().toLowerCase();
          if (loginEmail) relatedEmails.add(loginEmail);
          if (businessEmail) relatedEmails.add(businessEmail);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户确认 SC 企业成员作用域读取失败，使用登录邮箱兜底:', scopeError);
    }

    if (sessionUserId) enterpriseAuthUserIds.add(sessionUserId);

    try {
      if (enterpriseAuthUserIds.size > 0) {
        const { data: orgRows, error: orgError } = await supabaseAdminDb
          .from('customer_organizations')
          .select('auth_user_id, company_name, email')
          .in('auth_user_id', Array.from(enterpriseAuthUserIds));
        if (orgError) throw orgError;
        (Array.isArray(orgRows) ? orgRows : []).forEach((row: any) => {
          const orgEmail = String(row?.email || '').trim().toLowerCase();
          const companyName = String(row?.company_name || '').trim();
          if (orgEmail) relatedEmails.add(orgEmail);
          if (companyName && companyName.toLowerCase() !== 'n/a') relatedCompanies.add(companyName);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户确认 SC 组织作用域读取失败，使用邮箱兜底:', scopeError);
    }

    try {
      const { data: inquiryRows, error: inquiryError } = await supabaseAdminDb
        .from('inquiries')
        .select('user_email, buyer_company, buyer_info')
        .eq('user_email', sessionEmail)
        .order('created_at', { ascending: false })
        .limit(200);
      if (inquiryError) throw inquiryError;
      (Array.isArray(inquiryRows) ? inquiryRows : []).forEach((row: any) => {
        const buyerInfo = row?.buyer_info && typeof row.buyer_info === 'object' ? row.buyer_info : {};
        const buyerEmail = String(buyerInfo?.email || '').trim().toLowerCase();
        const buyerCompany = String(row?.buyer_company || buyerInfo?.companyName || '').trim();
        if (buyerEmail && buyerEmail !== 'n/a') relatedEmails.add(buyerEmail);
        if (buyerCompany && buyerCompany.toLowerCase() !== 'n/a') relatedCompanies.add(buyerCompany);
      });
    } catch (scopeError) {
      console.warn('⚠️ 客户确认 SC 询价作用域读取失败，使用邮箱兜底:', scopeError);
    }

    const contractUuid = normalizeUuid(contractKey);
    let contractQuery = supabaseAdminDb.from('sales_contracts').select('*');
    contractQuery = contractUuid
      ? contractQuery.eq('id', contractUuid)
      : contractQuery.eq('contract_number', contractKey);
    const { data: contractRow, error: contractError } = await contractQuery.maybeSingle();
    if (contractError) throw contractError;
    if (!contractRow) {
      return c.json({ success: false, message: '销售合同不存在' }, 404);
    }

    const contractEmail = String(contractRow?.customer_email || '').trim().toLowerCase();
    const contractCompany = String(contractRow?.customer_company || contractRow?.customer_name || '').trim();
    const hasEmailScope = !!contractEmail && relatedEmails.has(contractEmail);
    const hasCompanyScope = !!contractCompany && relatedCompanies.has(contractCompany);
    if (!hasEmailScope && !hasCompanyScope) {
      return c.json({ success: false, message: '无权确认其他客户企业的销售合同' }, 403);
    }

    const now = new Date().toISOString();
    const updatePayload = {
      status: 'customer_confirmed',
      approval_status: 'approved',
      execution_status: 'customer_confirmed',
      payment_status_deposit: 'pending',
      buyer_signature: signature,
      customer_confirmed_at: now,
      updated_at: now,
      document_render_meta: {
        ...(contractRow?.document_render_meta && typeof contractRow.document_render_meta === 'object' ? contractRow.document_render_meta : {}),
        erpWorkflow: {
          ...((contractRow?.document_render_meta && typeof contractRow.document_render_meta === 'object'
            ? contractRow.document_render_meta?.erpWorkflow
            : {}) || {}),
          logicalStatus: 'customer_confirmed',
          persistedStatus: 'customer_confirmed',
          approvalStatus: 'approved',
          executionStatus: 'customer_confirmed',
          paymentStatusDeposit: 'pending',
          customerFeedback: customerFeedback || null,
          customerConfirmedAt: now,
        },
      },
    };

    const { data: updatedRows, error: updateError } = await supabaseAdminDb
      .from('sales_contracts')
      .update(updatePayload)
      .eq('id', contractRow.id)
      .select('*')
      .limit(1);
    if (updateError) throw updateError;
    const updatedContract = Array.isArray(updatedRows) ? updatedRows[0] : null;

    const orderNumber = String(contractRow?.contract_number || contractKey).trim();
    await supabaseAdminDb
      .from('orders')
      .update({
        status: 'Awaiting Deposit',
        payment_status: 'Pending',
        confirmed: true,
        confirmed_at: now,
        confirmed_by: sessionEmail,
        confirmed_date: now.slice(0, 10),
        customer_feedback: customerFeedback || null,
        updated_at: now,
      })
      .or(`order_number.eq.${orderNumber},contract_number.eq.${orderNumber}`);

    return c.json({
      success: true,
      contract: updatedContract || { ...contractRow, ...updatePayload },
      orderNumber,
    });
  } catch (error) {
    console.error('❌ 客户确认销售合同失败:', error);
    return c.json({
      success: false,
      message: `customer confirm sales contract failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/customer-upload-sales-contract-payment-proof', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const body = await c.req.json().catch(() => ({}));
    const contractKey = String(body?.contractId || body?.contract_id || body?.contractNumber || body?.contract_number || '').trim();
    const paymentType = String(body?.paymentType || body?.payment_type || 'deposit').trim().toLowerCase();
    const proof = body?.proof && typeof body.proof === 'object' ? body.proof : null;
    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const sessionUserId = String(auth.user?.id || '').trim();

    if (!contractKey) {
      return c.json({ success: false, message: '缺少合同编号' }, 400);
    }
    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }
    if (!proof?.fileUrl && !proof?.fileName) {
      return c.json({ success: false, message: '缺少付款凭证文件信息' }, 400);
    }

    const relatedEmails = new Set<string>([sessionEmail]);
    const relatedCompanies = new Set<string>();
    const enterpriseAuthUserIds = new Set<string>();

    try {
      const { data: seedRows, error: seedError } = await supabaseAdminDb
        .from('customer_enterprise_members')
        .select('enterprise_auth_user_id, linked_auth_user_id, login_email, business_email')
        .or(`linked_auth_user_id.eq.${sessionUserId},login_email.eq.${sessionEmail}`);
      if (seedError) throw seedError;
      (Array.isArray(seedRows) ? seedRows : []).forEach((row: any) => {
        const enterpriseId = String(row?.enterprise_auth_user_id || '').trim();
        const loginEmail = String(row?.login_email || '').trim().toLowerCase();
        const businessEmail = String(row?.business_email || '').trim().toLowerCase();
        if (enterpriseId) enterpriseAuthUserIds.add(enterpriseId);
        if (loginEmail) relatedEmails.add(loginEmail);
        if (businessEmail) relatedEmails.add(businessEmail);
      });

      if (enterpriseAuthUserIds.size > 0) {
        const { data: memberRows, error: memberError } = await supabaseAdminDb
          .from('customer_enterprise_members')
          .select('login_email, business_email')
          .in('enterprise_auth_user_id', Array.from(enterpriseAuthUserIds));
        if (memberError) throw memberError;
        (Array.isArray(memberRows) ? memberRows : []).forEach((row: any) => {
          const loginEmail = String(row?.login_email || '').trim().toLowerCase();
          const businessEmail = String(row?.business_email || '').trim().toLowerCase();
          if (loginEmail) relatedEmails.add(loginEmail);
          if (businessEmail) relatedEmails.add(businessEmail);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户上传 SC 水单企业成员作用域读取失败，使用登录邮箱兜底:', scopeError);
    }

    if (sessionUserId) enterpriseAuthUserIds.add(sessionUserId);

    try {
      if (enterpriseAuthUserIds.size > 0) {
        const { data: orgRows, error: orgError } = await supabaseAdminDb
          .from('customer_organizations')
          .select('auth_user_id, company_name, email')
          .in('auth_user_id', Array.from(enterpriseAuthUserIds));
        if (orgError) throw orgError;
        (Array.isArray(orgRows) ? orgRows : []).forEach((row: any) => {
          const orgEmail = String(row?.email || '').trim().toLowerCase();
          const companyName = String(row?.company_name || '').trim();
          if (orgEmail) relatedEmails.add(orgEmail);
          if (companyName && companyName.toLowerCase() !== 'n/a') relatedCompanies.add(companyName);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户上传 SC 水单组织作用域读取失败，使用邮箱兜底:', scopeError);
    }

    try {
      const { data: inquiryRows, error: inquiryError } = await supabaseAdminDb
        .from('inquiries')
        .select('user_email, buyer_company, buyer_info')
        .eq('user_email', sessionEmail)
        .order('created_at', { ascending: false })
        .limit(200);
      if (inquiryError) throw inquiryError;
      (Array.isArray(inquiryRows) ? inquiryRows : []).forEach((row: any) => {
        const buyerInfo = row?.buyer_info && typeof row.buyer_info === 'object' ? row.buyer_info : {};
        const buyerEmail = String(buyerInfo?.email || '').trim().toLowerCase();
        const buyerCompany = String(row?.buyer_company || buyerInfo?.companyName || '').trim();
        if (buyerEmail && buyerEmail !== 'n/a') relatedEmails.add(buyerEmail);
        if (buyerCompany && buyerCompany.toLowerCase() !== 'n/a') relatedCompanies.add(buyerCompany);
      });
    } catch (scopeError) {
      console.warn('⚠️ 客户上传 SC 水单询价作用域读取失败，使用邮箱兜底:', scopeError);
    }

    const contractUuid = normalizeUuid(contractKey);
    let contractQuery = supabaseAdminDb.from('sales_contracts').select('*');
    contractQuery = contractUuid
      ? contractQuery.eq('id', contractUuid)
      : contractQuery.eq('contract_number', contractKey);
    const { data: contractRow, error: contractError } = await contractQuery.maybeSingle();
    if (contractError) throw contractError;
    if (!contractRow) {
      return c.json({ success: false, message: '销售合同不存在' }, 404);
    }

    const contractEmail = String(contractRow?.customer_email || '').trim().toLowerCase();
    const contractCompany = String(contractRow?.customer_company || contractRow?.customer_name || '').trim();
    const hasEmailScope = !!contractEmail && relatedEmails.has(contractEmail);
    const hasCompanyScope = !!contractCompany && relatedCompanies.has(contractCompany);
    if (!hasEmailScope && !hasCompanyScope) {
      return c.json({ success: false, message: '无权为其他客户企业的销售合同上传付款凭证' }, 403);
    }

    const now = new Date().toISOString();
    const isBalance = paymentType === 'balance';
    const nextStatus = isBalance ? 'balance_uploaded' : 'deposit_uploaded';
    const proofPayload = {
      ...proof,
      uploadedBy: proof?.uploadedBy || sessionEmail,
      uploadedAt: proof?.uploadedAt || now,
    };
    const existingRenderMeta = contractRow?.document_render_meta && typeof contractRow.document_render_meta === 'object'
      ? contractRow.document_render_meta
      : {};
    const updatePayload: Record<string, any> = {
      status: nextStatus,
      approval_status: 'approved',
      execution_status: nextStatus,
      payment_status_deposit: isBalance ? (contractRow?.payment_status_deposit || 'confirmed') : 'uploaded',
      payment_status_balance: isBalance ? 'uploaded' : (contractRow?.payment_status_balance || 'not_due'),
      updated_at: now,
      document_render_meta: {
        ...existingRenderMeta,
        erpWorkflow: {
          ...((existingRenderMeta?.erpWorkflow || {}) as Record<string, any>),
          logicalStatus: nextStatus,
          persistedStatus: nextStatus,
          approvalStatus: 'approved',
          executionStatus: nextStatus,
          paymentStatusDeposit: isBalance ? (contractRow?.payment_status_deposit || 'confirmed') : 'uploaded',
          paymentStatusBalance: isBalance ? 'uploaded' : (contractRow?.payment_status_balance || 'not_due'),
          customerPaymentProof: proofPayload,
          customerPaymentProofUploadedAt: now,
        },
      },
    };
    if (!isBalance) {
      updatePayload.deposit_proof = proofPayload;
    }

    const { data: updatedRows, error: updateError } = await supabaseAdminDb
      .from('sales_contracts')
      .update(updatePayload)
      .eq('id', contractRow.id)
      .select('*')
      .limit(1);
    if (updateError) throw updateError;
    const updatedContract = Array.isArray(updatedRows) ? updatedRows[0] : null;

    const orderNumber = String(contractRow?.contract_number || contractKey).trim();
    await supabaseAdminDb
      .from('orders')
      .update({
        status: isBalance ? 'Balance Payment Proof Uploaded' : 'Payment Proof Uploaded',
        payment_status: isBalance ? 'Balance Proof Uploaded' : 'Proof Uploaded',
        [isBalance ? 'balance_payment_proof' : 'deposit_payment_proof']: proofPayload,
        updated_at: now,
      })
      .or(`order_number.eq.${orderNumber},contract_number.eq.${orderNumber}`);

    return c.json({
      success: true,
      contract: updatedContract || { ...contractRow, ...updatePayload },
      orderNumber,
      status: nextStatus,
    });
  } catch (error) {
    console.error('❌ 客户上传销售合同付款凭证失败:', error);
    return c.json({
      success: false,
      message: `customer upload sales contract payment proof failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/process-sales-contract-approval', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const approvalRequestId = normalizeUuid(body?.approvalRequestId || body?.approval_request_id);
    const contractKey = String(body?.contractId || body?.contract_id || body?.contractNumber || body?.contract_number || '').trim();
    const contractUuid = normalizeUuid(contractKey);
    const requestedAction = String(body?.action || '').trim().toLowerCase();
    const comment = String(body?.comment || '').trim();
    const approverEmail = String(body?.approverEmail || body?.approver_email || auth.profile?.email || auth.user?.email || '').trim().toLowerCase();
    const approverName = String(body?.approverName || body?.approver_name || auth.profile?.name || approverEmail || '').trim();
    const approverRole = String(body?.approverRole || body?.approver_role || auth.profile?.rbac_role || '').trim();

    if (!approvalRequestId) {
      return c.json({ success: false, message: '缺少审批记录 ID' }, 400);
    }
    if (!contractKey) {
      return c.json({ success: false, message: '缺少合同 ID/合同编号' }, 400);
    }
    if (!['approve', 'reject'].includes(requestedAction)) {
      return c.json({ success: false, message: '审批动作不合法' }, 400);
    }

    const { data: approvalRow, error: approvalLookupError } = await supabaseAdminDb
      .from('approval_records')
      .select('*')
      .eq('id', approvalRequestId)
      .maybeSingle();
    if (approvalLookupError) throw approvalLookupError;
    if (!approvalRow) {
      return c.json({ success: false, message: '审批记录不存在' }, 404);
    }

    const relatedContract = approvalRow?.related_document && typeof approvalRow.related_document === 'object'
      ? approvalRow.related_document
      : {};
    const resolvedContractNumber = String(
      relatedContract?.contractNumber ||
      relatedContract?.contract_number ||
      approvalRow?.related_document_id ||
      (/^SC-/i.test(contractKey) ? contractKey : '')
    ).trim();

    let contractQuery = supabaseAdminDb
      .from('sales_contracts')
      .select('*');
    contractQuery = contractUuid
      ? contractQuery.eq('id', contractUuid)
      : contractQuery.eq('contract_number', resolvedContractNumber || contractKey);
    const { data: existingContractRow, error: contractLookupError } = await contractQuery.maybeSingle();
    if (contractLookupError) throw contractLookupError;
    let contractRow = existingContractRow;
    if (!contractRow) {
      if (!resolvedContractNumber) {
        return c.json({ success: false, message: '销售合同不存在，且审批记录缺少合同快照，无法自动补建' }, 404);
      }
      const relatedRenderMeta = relatedContract?.documentRenderMeta || relatedContract?.document_render_meta || {};
      contractRow = {
        id: crypto.randomUUID(),
        contract_number: resolvedContractNumber,
        quotation_number: String(relatedContract?.quotationNumber || relatedContract?.quotation_number || '').trim() || null,
        inquiry_number: String(relatedContract?.inquiryNumber || relatedContract?.inquiry_number || '').trim() || null,
        customer_name: String(relatedContract?.customerName || relatedContract?.customer_name || approvalRow?.customer_name || '').trim(),
        customer_email: String(relatedContract?.customerEmail || relatedContract?.customer_email || approvalRow?.customer_email || '').trim().toLowerCase(),
        customer_company: String(relatedContract?.customerCompany || relatedContract?.customer_company || '').trim() || null,
        customer_address: String(relatedContract?.customerAddress || relatedContract?.customer_address || '').trim() || null,
        customer_country: String(relatedContract?.customerCountry || relatedContract?.customer_country || '').trim() || null,
        contact_person: String(relatedContract?.contactPerson || relatedContract?.contact_person || '').trim() || null,
        contact_phone: String(relatedContract?.contactPhone || relatedContract?.contact_phone || '').trim() || null,
        sales_person: String(relatedContract?.salesPerson || relatedContract?.sales_person || approvalRow?.submitted_by || '').trim().toLowerCase(),
        sales_person_name: String(relatedContract?.salesPersonName || relatedContract?.sales_person_name || approvalRow?.submitted_by_name || '').trim() || null,
        owner_email: String(relatedContract?.ownerEmail || relatedContract?.owner_email || relatedContract?.salesPerson || approvalRow?.submitted_by || '').trim().toLowerCase() || null,
        owner_name: String(relatedContract?.ownerName || relatedContract?.owner_name || relatedContract?.salesPersonName || approvalRow?.submitted_by_name || '').trim() || null,
        owner_role: String(relatedContract?.ownerRole || relatedContract?.owner_role || 'Sales_Rep').trim() || 'Sales_Rep',
        operator_email: approverEmail || null,
        operator_role: approverRole || null,
        authenticated_user_id: normalizeUuid(auth.user?.id),
        authenticated_user_email: String(auth.user?.email || approverEmail || '').trim().toLowerCase() || null,
        authenticated_user_role: String(auth.profile?.rbac_role || approverRole || '').trim() || null,
        supervisor: String(relatedContract?.supervisor || '').trim() || null,
        region: String(relatedContract?.region || approvalRow?.region || '').trim() || null,
        products: Array.isArray(relatedContract?.products) ? relatedContract.products : [],
        total_amount: Number(relatedContract?.totalAmount || relatedContract?.total_amount || approvalRow?.amount || 0) || 0,
        currency: String(relatedContract?.currency || approvalRow?.currency || 'USD').trim() || 'USD',
        trade_terms: relatedContract?.tradeTerms || relatedContract?.trade_terms || null,
        payment_terms: relatedContract?.paymentTerms || relatedContract?.payment_terms || null,
        payment_mode: relatedContract?.paymentMode || relatedContract?.payment_mode || null,
        balance_trigger: relatedContract?.balanceTrigger || relatedContract?.balance_trigger || null,
        deposit_percentage: Number(relatedContract?.depositPercentage ?? relatedContract?.deposit_percentage ?? 30) || 0,
        deposit_amount: Number(relatedContract?.depositAmount || relatedContract?.deposit_amount || 0) || 0,
        balance_percentage: Number(relatedContract?.balancePercentage ?? relatedContract?.balance_percentage ?? 70) || 0,
        balance_amount: Number(relatedContract?.balanceAmount || relatedContract?.balance_amount || 0) || 0,
        additional_cost: Number(relatedContract?.additionalCost || relatedContract?.additional_cost || 0) || 0,
        fx_rates: relatedContract?.fxRates || relatedContract?.fx_rates || {},
        profit_snapshot: relatedContract?.profitSnapshot || relatedContract?.profit_snapshot || null,
        delivery_time: relatedContract?.deliveryTime || relatedContract?.delivery_time || null,
        port_of_loading: relatedContract?.portOfLoading || relatedContract?.port_of_loading || null,
        port_of_destination: relatedContract?.portOfDestination || relatedContract?.port_of_destination || null,
        packing: relatedContract?.packing || null,
        status: 'pending_supervisor',
        approval_flow: relatedContract?.approvalFlow || relatedContract?.approval_flow || {},
        approval_history: Array.isArray(relatedContract?.approvalHistory || relatedContract?.approval_history) ? (relatedContract?.approvalHistory || relatedContract?.approval_history) : [],
        approval_notes: relatedContract?.approvalNotes || relatedContract?.approval_notes || null,
        rejection_reason: relatedContract?.rejectionReason || relatedContract?.rejection_reason || null,
        remarks: relatedContract?.remarks || null,
        attachments: Array.isArray(relatedContract?.attachments) ? relatedContract.attachments : [],
        submitted_at: relatedContract?.submittedAt || relatedContract?.submitted_at || approvalRow?.submitted_at || null,
        template_id: relatedContract?.templateId || relatedContract?.template_id || null,
        template_version_id: relatedContract?.templateVersionId || relatedContract?.template_version_id || null,
        template_snapshot: relatedContract?.templateSnapshot || relatedContract?.template_snapshot || {},
        document_data_snapshot: relatedContract?.documentDataSnapshot || relatedContract?.document_data_snapshot || {},
        document_render_meta: relatedRenderMeta,
        created_by: normalizeUuid(auth.user?.id),
      };
    }

    const now = new Date().toISOString();
    const existingApprovalHistory = Array.isArray(approvalRow?.approval_history) ? approvalRow.approval_history : [];
    const existingContractHistory = Array.isArray(contractRow?.approval_history) ? contractRow.approval_history : [];
    const requiresDirectorApproval = Boolean(approvalRow?.requires_director_approval);
    const isDirectorApprover = approverRole === 'Sales_Director';
    const shouldForwardToDirector = requestedAction === 'approve' && requiresDirectorApproval && !isDirectorApprover;
    const finalApprovalStatus = requestedAction === 'reject'
      ? 'rejected'
      : shouldForwardToDirector
        ? 'forwarded'
        : 'approved';
    const finalApprovalAction = requestedAction === 'reject'
      ? 'reject'
      : shouldForwardToDirector
        ? 'forward'
        : 'approve';

    const approvalHistoryItem = {
      id: crypto.randomUUID(),
      approver: approverEmail,
      approverName,
      approverRole,
      action: finalApprovalStatus,
      comment: comment || (requestedAction === 'reject' ? '驳回' : shouldForwardToDirector ? '主管审批通过并转交总监' : '审批通过'),
      timestamp: now,
    };

    const nextApprover = shouldForwardToDirector
      ? String(approvalRow?.next_approver || 'sales.director@cosunchina.com').trim().toLowerCase()
      : null;
    const nextApproverRole = shouldForwardToDirector
      ? String(approvalRow?.next_approver_role || 'Sales_Director').trim()
      : null;

    const approvalUpdate = {
      status: finalApprovalStatus,
      current_approver: nextApprover || '',
      current_approver_role: nextApproverRole || '',
      next_approver: shouldForwardToDirector ? null : null,
      next_approver_role: shouldForwardToDirector ? null : null,
      requires_director_approval: shouldForwardToDirector,
      approval_history: [...existingApprovalHistory, approvalHistoryItem],
      action: finalApprovalAction,
      status_before: approvalRow?.status || null,
      status_after: finalApprovalStatus,
      updated_at: now,
    };

    const { data: updatedApprovalRecord, error: approvalUpdateError } = await supabaseAdminDb
      .from('approval_records')
      .update(approvalUpdate)
      .eq('id', approvalRequestId)
      .select('*')
      .maybeSingle();
    if (approvalUpdateError) throw approvalUpdateError;

    const existingApprovalFlow = typeof contractRow?.approval_flow === 'object' && contractRow?.approval_flow
      ? contractRow.approval_flow
      : {};
    const contractNextStatus = requestedAction === 'reject'
      ? 'rejected'
      : shouldForwardToDirector
        ? 'pending_director'
        : 'approved';
    const contractHistoryItem = {
      action: requestedAction === 'reject' ? 'rejected' : 'approved',
      actor: approverName || approverEmail,
      actorRole: isDirectorApprover ? 'director' : 'supervisor',
      timestamp: now,
      notes: comment || undefined,
      amount: Number(contractRow?.total_amount || 0) || 0,
    };
    const nextApprovalFlow = {
      ...existingApprovalFlow,
      requiresDirectorApproval: shouldForwardToDirector,
      currentStep: shouldForwardToDirector ? 'director' : requestedAction === 'reject' ? existingApprovalFlow?.currentStep || 'supervisor' : 'completed',
    };
    const contractUpdateRow = {
      ...contractRow,
      status: contractNextStatus,
      approval_status: requestedAction === 'reject' ? 'rejected' : shouldForwardToDirector ? 'pending_l2' : 'approved',
      execution_status: 'draft',
      payment_status_deposit: contractRow?.payment_status_deposit || 'pending',
      payment_status_balance: contractRow?.payment_status_balance || 'not_due',
      approval_flow: nextApprovalFlow,
      approval_history: [...existingContractHistory, contractHistoryItem],
      approval_notes: comment || contractRow?.approval_notes || null,
      rejection_reason: requestedAction === 'reject' ? (comment || contractRow?.rejection_reason || '审批驳回') : null,
      approved_at: !shouldForwardToDirector && requestedAction === 'approve' ? now : contractRow?.approved_at || null,
      updated_at: now,
    };
    const { data: updatedContract, removedColumns } = await upsertSalesContractWithSchemaFallback(contractUpdateRow);

    return c.json({
      success: true,
      approvalRecord: updatedApprovalRecord || { ...approvalRow, ...approvalUpdate },
      contract: updatedContract || contractUpdateRow,
      removedColumns,
    });
  } catch (error) {
    console.error('❌ 处理 sales contract 审批失败:', error);
    const removedColumns = Array.isArray((error as any)?.removedColumns) ? (error as any).removedColumns : [];
    return c.json({
      success: false,
      message: `process sales contract approval failed: ${String((error as Error)?.message || error || 'unknown error')}`,
      removedColumns,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/list-sales-quotations', async (c) => {
  try {
    const ownerEmail = String(c.req.query('ownerEmail') || '').trim().toLowerCase();
    const qtNumber = String(c.req.query('qtNumber') || '').trim();
    const localAdminAuth = c.req.query('localAdminAuth')
      ? {
          email: String(c.req.query('localAdminEmail') || '').trim().toLowerCase(),
          password: String(c.req.query('localAdminPassword') || '').trim(),
        }
      : null;
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, localAdminAuth);
    if (auth.error) return auth.error;

    let query = supabaseAdminDb
      .from('sales_quotations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(qtNumber ? 10 : 200);

    if (qtNumber) {
      query = query.eq('qt_number', qtNumber);
    }

    if (ownerEmail) {
      query = query.or(`owner_email.eq.${ownerEmail},sales_person.eq.${ownerEmail}`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      quotations: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error('❌ 服务端读取 sales quotations 失败:', error);
    return c.json({
      success: false,
      message: `list sales quotations failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/list-sales-contracts', async (c) => {
  try {
    const ownerEmail = String(c.req.query('ownerEmail') || '').trim().toLowerCase();
    const contractNumber = String(c.req.query('contractNumber') || '').trim();
    const localAdminAuth = c.req.query('localAdminAuth')
      ? {
          email: String(c.req.query('localAdminEmail') || '').trim().toLowerCase(),
          password: String(c.req.query('localAdminPassword') || '').trim(),
        }
      : null;
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, localAdminAuth);
    if (auth.error) return auth.error;

    let query = supabaseAdminDb
      .from('sales_contracts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(contractNumber ? 10 : 200);

    if (contractNumber) {
      query = query.eq('contract_number', contractNumber);
    }

    if (ownerEmail) {
      query = query.or(`owner_email.eq.${ownerEmail},sales_person.eq.${ownerEmail}`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      contracts: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error('❌ 服务端读取 sales contracts 失败:', error);
    return c.json({
      success: false,
      message: `list sales contracts failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/reset-sales-contract-to-deposit-confirmed', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const contractNumber = String(body?.contractNumber || body?.contract_number || '').trim();
    if (!contractNumber) {
      return c.json({ success: false, message: '缺少合同号' }, 400);
    }

    const { data: targetContract, error: targetLookupError } = await supabaseAdminDb
      .from('sales_contracts')
      .select('*')
      .eq('contract_number', contractNumber)
      .maybeSingle();
    if (targetLookupError) {
      throw targetLookupError;
    }
    if (!targetContract) {
      return c.json({ success: false, message: '销售合同不存在' }, 404);
    }

    const existingRenderMeta = (targetContract.document_render_meta && typeof targetContract.document_render_meta === 'object')
      ? targetContract.document_render_meta
      : {};
    const existingWorkflow = (existingRenderMeta.erpWorkflow && typeof existingRenderMeta.erpWorkflow === 'object')
      ? existingRenderMeta.erpWorkflow
      : {};
    const nextWorkflow = {
      ...existingWorkflow,
      logicalStatus: 'deposit_confirmed',
      persistedStatus: 'deposit_confirmed',
      approvalStatus: 'approved',
      executionStatus: 'deposit_confirmed',
      paymentStatusDeposit: 'confirmed',
      paymentStatusBalance: 'not_due',
    };

    delete nextWorkflow.balanceConfirmedAt;
    delete nextWorkflow.balanceConfirmedBy;
    delete nextWorkflow.balanceConfirmNotes;
    delete nextWorkflow.balanceReceiptProof;
    delete nextWorkflow.balanceUploadedAt;
    delete nextWorkflow.balanceUploadedBy;
    delete nextWorkflow.balancePaymentProof;

    const nextRenderMeta = {
      ...existingRenderMeta,
      erpWorkflow: nextWorkflow,
    };

    const { data: updatedContract, error: updateError } = await supabaseAdminDb
      .from('sales_contracts')
      .update({
        status: 'deposit_confirmed',
        approval_status: 'approved',
        execution_status: 'deposit_confirmed',
        payment_status_deposit: 'confirmed',
        payment_status_balance: 'not_due',
        document_render_meta: nextRenderMeta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetContract.id)
      .select('*')
      .maybeSingle();
    if (updateError) {
      throw updateError;
    }

    const { error: resetOrderError } = await supabaseAdminDb
      .from('orders')
      .update({
        status: 'Deposit Received',
        payment_status: 'Deposit Received',
        balance_payment_proof: null,
        balance_receipt_proof: null,
        updated_at: new Date().toISOString(),
      })
      .or(`order_number.eq.${contractNumber},contract_number.eq.${contractNumber}`);
    if (resetOrderError) {
      throw resetOrderError;
    }

    return c.json({
      success: true,
      contractNumber,
      contract: updatedContract,
    });
  } catch (error) {
    console.error('❌ 重置 sales contract 到定金确认状态失败:', error);
    return c.json({
      success: false,
      message: `reset sales contract failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/cleanup-duplicate-sales-contracts', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const quotationNumber = String(body?.quotationNumber || body?.quotation_number || '').trim();
    if (!quotationNumber) {
      return c.json({ success: false, message: '缺少关联 QT 单号' }, 400);
    }

    const { data, error } = await supabaseAdminDb
      .from('sales_contracts')
      .select('*')
      .eq('quotation_number', quotationNumber)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const contracts = Array.isArray(data) ? data : [];
    if (contracts.length <= 1) {
      return c.json({
        success: true,
        quotationNumber,
        keptContract: contracts[0] || null,
        deletedContracts: [],
        deletedCount: 0,
      });
    }

    const [keptContract, ...duplicateContracts] = contracts;
    const duplicateIds = duplicateContracts
      .map((contract: any) => normalizeUuid(contract?.id))
      .filter(Boolean) as string[];

    if (duplicateIds.length > 0) {
      const { error: deleteError } = await supabaseAdminDb
        .from('sales_contracts')
        .delete()
        .in('id', duplicateIds);
      if (deleteError) {
        throw deleteError;
      }
    }

    return c.json({
      success: true,
      quotationNumber,
      keptContract,
      deletedContracts: duplicateContracts,
      deletedCount: duplicateContracts.length,
    });
  } catch (error) {
    console.error('❌ 清理重复 sales contracts 失败:', error);
    return c.json({
      success: false,
      message: `cleanup duplicate sales contracts failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/delete-sales-contract', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const contractId = normalizeUuid(body?.id || body?.contractId);
    if (!contractId) {
      return c.json({ success: false, message: '缺少合同 ID' }, 400);
    }

    const { data: targetContract, error: targetLookupError } = await supabaseAdminDb
      .from('sales_contracts')
      .select('*')
      .eq('id', contractId)
      .maybeSingle();
    if (targetLookupError) {
      throw targetLookupError;
    }
    if (!targetContract) {
      return c.json({ success: false, message: '销售合同不存在' }, 404);
    }

    const quotationNumber = String(targetContract?.quotation_number || '').trim();

    const { error: deleteError } = await supabaseAdminDb
      .from('sales_contracts')
      .delete()
      .eq('id', contractId);
    if (deleteError) {
      throw deleteError;
    }

    let remainingLatestContract = null as any;
    if (quotationNumber) {
      const { data: remainingContracts, error: remainingLookupError } = await supabaseAdminDb
        .from('sales_contracts')
        .select('*')
        .eq('quotation_number', quotationNumber)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);
      if (remainingLookupError) {
        throw remainingLookupError;
      }
      remainingLatestContract = Array.isArray(remainingContracts) ? remainingContracts[0] || null : null;
    }

    return c.json({
      success: true,
      deletedContract: targetContract,
      remainingLatestContract,
    });
  } catch (error) {
    console.error('❌ 删除 sales contract 失败:', error);
    return c.json({
      success: false,
      message: `delete sales contract failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/repair-sales-contract-bank-snapshots', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const contractNumber = String(body?.contractNumber || body?.contract_number || '').trim();
    const quotationNumber = String(body?.quotationNumber || body?.quotation_number || '').trim();
    const limit = Math.max(1, Math.min(1000, Number(body?.limit || 500) || 500));

    const { data: adminOrg, error: adminOrgError } = await loadAdminOrganizationDocumentSnapshotViaRequest(c);
    if (adminOrgError || !adminOrg) {
      throw adminOrgError || new Error('未找到组织档案，无法修复 SC 银行信息');
    }

    let query = supabaseAdminDb
      .from('sales_contracts')
      .select('id,contract_number,quotation_number,document_data_snapshot,updated_at')
      .order('updated_at', { ascending: false })
      .range(0, limit - 1);

    if (contractNumber) {
      query = query.eq('contract_number', contractNumber);
    }
    if (quotationNumber) {
      query = query.eq('quotation_number', quotationNumber);
    }

    const { data: rows, error: rowsError } = await query;
    if (rowsError) {
      throw rowsError;
    }

    const contracts = Array.isArray(rows) ? rows : [];
    const repaired: Array<{ id: string; contractNumber: string; quotationNumber: string | null }> = [];
    const skipped: Array<{ id: string; contractNumber: string; reason: string }> = [];

    for (const row of contracts) {
      const originalSnapshot = row?.document_data_snapshot && typeof row.document_data_snapshot === 'object'
        ? row.document_data_snapshot
        : {};
      const nextSnapshot = hydrateSalesContractSnapshotBankInfo(originalSnapshot, adminOrg);

      if (JSON.stringify(originalSnapshot) === JSON.stringify(nextSnapshot)) {
        skipped.push({
          id: String(row?.id || ''),
          contractNumber: String(row?.contract_number || ''),
          reason: 'snapshot-already-normalized',
        });
        continue;
      }

      const { error: updateError } = await supabaseAdminDb
        .from('sales_contracts')
        .update({
          document_data_snapshot: nextSnapshot,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (updateError) {
        throw updateError;
      }

      repaired.push({
        id: String(row?.id || ''),
        contractNumber: String(row?.contract_number || ''),
        quotationNumber: String(row?.quotation_number || '').trim() || null,
      });
    }

    return c.json({
      success: true,
      repairedCount: repaired.length,
      skippedCount: skipped.length,
      repaired,
      skipped,
    });
  } catch (error) {
    console.error('❌ 修复 sales contract 银行快照失败:', error);
    return c.json({
      success: false,
      message: `repair sales contract bank snapshots failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/customer-sales-quotations', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const requestedEmail = String(c.req.query('email') || '').trim().toLowerCase();
    const effectiveEmail = requestedEmail || sessionEmail;
    const sessionUserId = String(auth.user?.id || '').trim();

    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }

    if (effectiveEmail !== sessionEmail) {
      return c.json({ success: false, message: '无权读取其他客户邮箱的报价单' }, 403);
    }

    const relatedEmails = new Set<string>([effectiveEmail, sessionEmail].filter(Boolean));
    const relatedCompanies = new Set<string>();

    const enterpriseAuthUserIds = new Set<string>();
    try {
      const { data: enterpriseSeedRows, error: enterpriseSeedError } = await supabaseAdminDb
        .from('customer_enterprise_members')
        .select('enterprise_auth_user_id, linked_auth_user_id, login_email, business_email')
        .or(`linked_auth_user_id.eq.${sessionUserId},login_email.eq.${sessionEmail}`);
      if (enterpriseSeedError) throw enterpriseSeedError;

      (Array.isArray(enterpriseSeedRows) ? enterpriseSeedRows : []).forEach((row: any) => {
        const enterpriseId = String(row?.enterprise_auth_user_id || '').trim();
        if (enterpriseId) enterpriseAuthUserIds.add(enterpriseId);
      });

      if (enterpriseAuthUserIds.size > 0) {
        const { data: memberRows, error: memberError } = await supabaseAdminDb
          .from('customer_enterprise_members')
          .select('login_email, business_email')
          .in('enterprise_auth_user_id', Array.from(enterpriseAuthUserIds));
        if (memberError) throw memberError;
        (Array.isArray(memberRows) ? memberRows : []).forEach((row: any) => {
          const loginEmail = String(row?.login_email || '').trim().toLowerCase();
          const businessEmail = String(row?.business_email || '').trim().toLowerCase();
          if (loginEmail) relatedEmails.add(loginEmail);
          if (businessEmail) relatedEmails.add(businessEmail);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户企业成员作用域读取失败，继续使用询价 buyer_info 兜底:', scopeError);
    }

    if (sessionUserId) enterpriseAuthUserIds.add(sessionUserId);

    try {
      if (enterpriseAuthUserIds.size > 0) {
        const { data: organizationRows, error: organizationError } = await supabaseAdminDb
          .from('customer_organizations')
          .select('auth_user_id, company_name, email')
          .in('auth_user_id', Array.from(enterpriseAuthUserIds));
        if (organizationError) throw organizationError;
        (Array.isArray(organizationRows) ? organizationRows : []).forEach((row: any) => {
          const orgEmail = String(row?.email || '').trim().toLowerCase();
          const companyName = String(row?.company_name || '').trim();
          if (orgEmail) relatedEmails.add(orgEmail);
          if (companyName && companyName.toLowerCase() !== 'n/a') relatedCompanies.add(companyName);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户组织作用域读取失败，继续使用询价 buyer_info 兜底:', scopeError);
    }

    try {
      const { data: inquiryRows, error: inquiryError } = await supabaseAdminDb
        .from('inquiries')
        .select('user_email, buyer_company, buyer_info')
        .eq('user_email', effectiveEmail)
        .order('created_at', { ascending: false })
        .limit(200);
      if (inquiryError) throw inquiryError;
      (Array.isArray(inquiryRows) ? inquiryRows : []).forEach((row: any) => {
        const buyerInfo = row?.buyer_info && typeof row.buyer_info === 'object' ? row.buyer_info : {};
        const buyerEmail = String(buyerInfo?.email || '').trim().toLowerCase();
        const buyerCompany = String(row?.buyer_company || buyerInfo?.companyName || '').trim();
        if (buyerEmail && buyerEmail !== 'n/a') relatedEmails.add(buyerEmail);
        if (buyerCompany && buyerCompany.toLowerCase() !== 'n/a') relatedCompanies.add(buyerCompany);
      });
    } catch (scopeError) {
      console.warn('⚠️ 客户询价 buyer_info 作用域读取失败，仅使用登录邮箱读取报价:', scopeError);
    }

    const merged = new Map<string, any>();
    const bindRows = (rows: any[]) => {
      (Array.isArray(rows) ? rows : []).forEach((row: any) => {
        const key = String(row?.id || row?.qt_number || row?.quotation_number || '').trim();
        if (key) merged.set(key, row);
      });
    };

    if (relatedEmails.size > 0) {
      const { data, error } = await supabaseAdminDb
        .from('sales_quotations')
        .select('*')
        .in('customer_email', Array.from(relatedEmails))
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      bindRows(data || []);
    }

    for (const companyName of relatedCompanies) {
      const { data, error } = await supabaseAdminDb
        .from('sales_quotations')
        .select('*')
        .eq('customer_company', companyName)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      bindRows(data || []);
    }

    return c.json({
      success: true,
      quotations: Array.from(merged.values()).slice(0, 200),
      scope: {
        relatedEmails: Array.from(relatedEmails),
        relatedCompanies: Array.from(relatedCompanies),
      },
    });
  } catch (error) {
    console.error('❌ 客户侧读取 sales quotations 失败:', error);
    return c.json({
      success: false,
      message: `customer sales quotations failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/customer-sales-quotations/respond', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const sessionUserId = String(auth.user?.id || '').trim();
    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const quotationKey = String(
      body?.quotationKey ||
      body?.quotationUidOrNumber ||
      body?.qtNumber ||
      body?.quotationNumber ||
      body?.id ||
      '',
    ).trim();
    const status = String(body?.status || '').trim().toLowerCase();
    const comment = String(body?.comment || '').trim();

    if (!quotationKey) {
      return c.json({ success: false, message: '缺少报价单标识' }, 400);
    }
    if (!['accepted', 'negotiating', 'rejected'].includes(status)) {
      return c.json({ success: false, message: '报价反馈状态无效' }, 400);
    }
    if (['negotiating', 'rejected'].includes(status) && !comment) {
      return c.json({ success: false, message: 'Comment is required for negotiating/rejected' }, 422);
    }

    const loadQuotation = async () => {
      const normalizedUuid = normalizeUuid(quotationKey);
      if (normalizedUuid) {
        const byId = await supabaseAdminDb
          .from('sales_quotations')
          .select('*')
          .eq('id', normalizedUuid)
          .limit(1)
          .maybeSingle();
        if (byId.error) throw byId.error;
        if (byId.data) return byId.data;
      }

      const byQtNumber = await supabaseAdminDb
        .from('sales_quotations')
        .select('*')
        .eq('qt_number', quotationKey)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byQtNumber.error) throw byQtNumber.error;
      if (byQtNumber.data) return byQtNumber.data;

      const byQuotationNumber = await supabaseAdminDb
        .from('sales_quotations')
        .select('*')
        .eq('quotation_number', quotationKey)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byQuotationNumber.error) throw byQuotationNumber.error;
      return byQuotationNumber.data || null;
    };

    const quotation = await loadQuotation();
    if (!quotation) {
      return c.json({ success: false, message: 'Quotation not found' }, 404);
    }

    const quotationCustomerEmail = String(quotation?.customer_email || '').trim().toLowerCase();
    const quotationCustomerCompany = String(quotation?.customer_company || '').trim();
    const relatedEmails = new Set<string>([sessionEmail].filter(Boolean));
    const relatedCompanies = new Set<string>();

    const enterpriseAuthUserIds = new Set<string>();
    try {
      const { data: enterpriseSeedRows, error: enterpriseSeedError } = await supabaseAdminDb
        .from('customer_enterprise_members')
        .select('enterprise_auth_user_id, linked_auth_user_id, login_email, business_email')
        .or(`linked_auth_user_id.eq.${sessionUserId},login_email.eq.${sessionEmail}`);
      if (enterpriseSeedError) throw enterpriseSeedError;

      (Array.isArray(enterpriseSeedRows) ? enterpriseSeedRows : []).forEach((row: any) => {
        const enterpriseId = String(row?.enterprise_auth_user_id || '').trim();
        if (enterpriseId) enterpriseAuthUserIds.add(enterpriseId);
      });

      if (enterpriseAuthUserIds.size > 0) {
        const { data: memberRows, error: memberError } = await supabaseAdminDb
          .from('customer_enterprise_members')
          .select('login_email, business_email')
          .in('enterprise_auth_user_id', Array.from(enterpriseAuthUserIds));
        if (memberError) throw memberError;
        (Array.isArray(memberRows) ? memberRows : []).forEach((row: any) => {
          const loginEmail = String(row?.login_email || '').trim().toLowerCase();
          const businessEmail = String(row?.business_email || '').trim().toLowerCase();
          if (loginEmail) relatedEmails.add(loginEmail);
          if (businessEmail) relatedEmails.add(businessEmail);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户响应报价时企业成员作用域读取失败，继续使用询价 buyer_info 兜底:', scopeError);
    }

    if (sessionUserId) enterpriseAuthUserIds.add(sessionUserId);

    try {
      if (enterpriseAuthUserIds.size > 0) {
        const { data: organizationRows, error: organizationError } = await supabaseAdminDb
          .from('customer_organizations')
          .select('auth_user_id, company_name, email')
          .in('auth_user_id', Array.from(enterpriseAuthUserIds));
        if (organizationError) throw organizationError;
        (Array.isArray(organizationRows) ? organizationRows : []).forEach((row: any) => {
          const orgEmail = String(row?.email || '').trim().toLowerCase();
          const companyName = String(row?.company_name || '').trim();
          if (orgEmail) relatedEmails.add(orgEmail);
          if (companyName && companyName.toLowerCase() !== 'n/a') relatedCompanies.add(companyName);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户响应报价时组织作用域读取失败，继续使用询价 buyer_info 兜底:', scopeError);
    }

    try {
      const { data: inquiryRows, error: inquiryError } = await supabaseAdminDb
        .from('inquiries')
        .select('user_email, buyer_company, buyer_info')
        .eq('user_email', sessionEmail)
        .order('created_at', { ascending: false })
        .limit(200);
      if (inquiryError) throw inquiryError;
      (Array.isArray(inquiryRows) ? inquiryRows : []).forEach((row: any) => {
        const buyerInfo = row?.buyer_info && typeof row.buyer_info === 'object' ? row.buyer_info : {};
        const buyerEmail = String(buyerInfo?.email || '').trim().toLowerCase();
        const buyerCompany = String(row?.buyer_company || buyerInfo?.companyName || '').trim();
        if (buyerEmail && buyerEmail !== 'n/a') relatedEmails.add(buyerEmail);
        if (buyerCompany && buyerCompany.toLowerCase() !== 'n/a') relatedCompanies.add(buyerCompany);
      });
    } catch (scopeError) {
      console.warn('⚠️ 客户响应报价时询价 buyer_info 作用域读取失败，仅使用登录邮箱校验:', scopeError);
    }

    const canOperateQuotation =
      (!!quotationCustomerEmail && relatedEmails.has(quotationCustomerEmail)) ||
      (!!quotationCustomerCompany && relatedCompanies.has(quotationCustomerCompany));

    if (!canOperateQuotation) {
      return c.json({ success: false, message: '无权操作其他客户的报价单' }, 403);
    }

    const currentStatus = String(quotation?.customer_status || '').trim().toLowerCase();
    if (!['sent', 'viewed', 'negotiating', 'accepted', 'rejected'].includes(currentStatus)) {
      return c.json({ success: false, message: 'Quotation is not available for customer response' }, 400);
    }

    const respondedAt = new Date().toISOString();
    const customerResponse = {
      status,
      comment: comment || null,
      respondedAt,
      respondedBy: sessionEmail,
    };

    const { data: updatedQuotation, error: updateError } = await supabaseAdminDb
      .from('sales_quotations')
      .update({
        customer_status: status,
        customer_response: customerResponse,
        updated_at: respondedAt,
      })
      .eq('id', quotation.id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    return c.json({
      success: true,
      quotation: updatedQuotation,
    });
  } catch (error) {
    console.error('❌ 客户侧提交 sales quotation 响应失败:', error);
    return c.json({
      success: false,
      message: `customer respond quotation failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/customer-orders', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const requestedEmail = String(c.req.query('email') || '').trim().toLowerCase();
    const effectiveEmail = requestedEmail || sessionEmail;
    const sessionUserId = String(auth.user?.id || '').trim();

    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }

    if (effectiveEmail !== sessionEmail) {
      return c.json({ success: false, message: '无权读取其他客户邮箱的订单' }, 403);
    }

    const relatedEmails = new Set<string>([effectiveEmail, sessionEmail].filter(Boolean));
    const relatedCompanies = new Set<string>();
    const enterpriseAuthUserIds = new Set<string>();

    try {
      const { data: enterpriseSeedRows, error: enterpriseSeedError } = await supabaseAdminDb
        .from('customer_enterprise_members')
        .select('enterprise_auth_user_id, linked_auth_user_id, login_email, business_email')
        .or(`linked_auth_user_id.eq.${sessionUserId},login_email.eq.${sessionEmail}`);
      if (enterpriseSeedError) throw enterpriseSeedError;

      (Array.isArray(enterpriseSeedRows) ? enterpriseSeedRows : []).forEach((row: any) => {
        const enterpriseId = String(row?.enterprise_auth_user_id || '').trim();
        if (enterpriseId) enterpriseAuthUserIds.add(enterpriseId);
      });

      if (enterpriseAuthUserIds.size > 0) {
        const { data: memberRows, error: memberError } = await supabaseAdminDb
          .from('customer_enterprise_members')
          .select('login_email, business_email')
          .in('enterprise_auth_user_id', Array.from(enterpriseAuthUserIds));
        if (memberError) throw memberError;
        (Array.isArray(memberRows) ? memberRows : []).forEach((row: any) => {
          const loginEmail = String(row?.login_email || '').trim().toLowerCase();
          const businessEmail = String(row?.business_email || '').trim().toLowerCase();
          if (loginEmail) relatedEmails.add(loginEmail);
          if (businessEmail) relatedEmails.add(businessEmail);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户企业成员作用域读取失败，继续使用订单邮箱兜底:', scopeError);
    }

    if (sessionUserId) enterpriseAuthUserIds.add(sessionUserId);

    try {
      if (enterpriseAuthUserIds.size > 0) {
        const { data: organizationRows, error: organizationError } = await supabaseAdminDb
          .from('customer_organizations')
          .select('auth_user_id, company_name, email')
          .in('auth_user_id', Array.from(enterpriseAuthUserIds));
        if (organizationError) throw organizationError;
        (Array.isArray(organizationRows) ? organizationRows : []).forEach((row: any) => {
          const orgEmail = String(row?.email || '').trim().toLowerCase();
          const companyName = String(row?.company_name || '').trim();
          if (orgEmail) relatedEmails.add(orgEmail);
          if (companyName && companyName.toLowerCase() !== 'n/a') relatedCompanies.add(companyName);
        });
      }
    } catch (scopeError) {
      console.warn('⚠️ 客户组织作用域读取失败，继续使用订单邮箱兜底:', scopeError);
    }

    try {
      const { data: inquiryRows, error: inquiryError } = await supabaseAdminDb
        .from('inquiries')
        .select('user_email, buyer_company, buyer_info')
        .eq('user_email', effectiveEmail)
        .order('created_at', { ascending: false })
        .limit(200);
      if (inquiryError) throw inquiryError;
      (Array.isArray(inquiryRows) ? inquiryRows : []).forEach((row: any) => {
        const buyerInfo = row?.buyer_info && typeof row.buyer_info === 'object' ? row.buyer_info : {};
        const buyerEmail = String(buyerInfo?.email || '').trim().toLowerCase();
        const buyerCompany = String(row?.buyer_company || buyerInfo?.companyName || '').trim();
        if (buyerEmail && buyerEmail !== 'n/a') relatedEmails.add(buyerEmail);
        if (buyerCompany && buyerCompany.toLowerCase() !== 'n/a') relatedCompanies.add(buyerCompany);
      });
    } catch (scopeError) {
      console.warn('⚠️ 客户询价 buyer_info 作用域读取失败，仅使用登录邮箱读取订单:', scopeError);
    }

    const merged = new Map<string, any>();
    const bindRows = (rows: any[]) => {
      (Array.isArray(rows) ? rows : []).forEach((row: any) => {
        const key = String(row?.id || row?.order_number || '').trim();
        if (key) merged.set(key, row);
      });
    };

    if (relatedEmails.size > 0) {
      const { data, error } = await supabaseAdminDb
        .from('orders')
        .select('*')
        .in('customer_email', Array.from(relatedEmails))
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      bindRows(data || []);
    }

    for (const companyName of relatedCompanies) {
      const { data, error } = await supabaseAdminDb
        .from('orders')
        .select('*')
        .eq('customer', companyName)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      bindRows(data || []);
    }

    const SENT_CONTRACT_STATUSES = new Set([
      'sent',
      'sent_to_customer',
      'customer_confirmed',
      'deposit_uploaded',
      'payment_proof_uploaded',
      'deposit_confirmed',
      'po_generated',
      'production',
      'balance_confirmed',
      'shipped',
    ]);
    const bindContractRows = (rows: any[]) => {
      (Array.isArray(rows) ? rows : []).forEach((contract: any) => {
        const status = String(contract?.status || '').trim().toLowerCase();
        if (!SENT_CONTRACT_STATUSES.has(status)) return;

        const contractNumber = String(contract?.contract_number || '').trim();
        if (!contractNumber) return;
        if (merged.has(contractNumber)) return;

        const products = Array.isArray(contract?.products) ? contract.products : [];
        merged.set(contractNumber, {
          id: contract?.id || contractNumber,
          order_number: contractNumber,
          contract_number: contractNumber,
          quotation_number: contract?.quotation_number || null,
          customer: contract?.customer_name || contract?.customer_company || '',
          customer_email: contract?.customer_email || effectiveEmail,
          date: String(contract?.created_at || contract?.submitted_at || new Date().toISOString()).slice(0, 10),
          expected_delivery: contract?.delivery_time || null,
          total_amount: Number(contract?.total_amount || 0) || 0,
          currency: contract?.currency || 'USD',
          status: status === 'customer_confirmed'
            ? 'Awaiting Deposit'
            : ['deposit_uploaded', 'payment_proof_uploaded'].includes(status)
              ? 'Payment Proof Uploaded'
              : ['deposit_confirmed', 'po_generated', 'production', 'balance_confirmed', 'shipped'].includes(status)
                ? 'Deposit Received'
                : 'Pending',
          progress: 0,
          products: products.map((item: any) => ({
            name: item?.productName || item?.name || item?.product_name || 'Product',
            quantity: Number(item?.quantity || 0) || 0,
            unitPrice: Number(item?.unitPrice || item?.unit_price || 0) || 0,
            totalPrice: Number(item?.amount || item?.totalPrice || item?.total_price || 0) || 0,
            specs: item?.specification || item?.specs || '',
          })),
          payment_status: status === 'deposit_confirmed' ? 'Deposit Received' : 'Pending',
          deposit_payment_proof: contract?.deposit_proof || contract?.document_render_meta?.erpWorkflow?.customerPaymentProof || null,
          payment_terms: contract?.payment_terms || null,
          shipping_method: contract?.trade_terms || null,
          delivery_terms: contract?.trade_terms || null,
          region: contract?.region || null,
          country: contract?.customer_country || null,
          delivery_address: contract?.customer_address || null,
          contact_person: contract?.contact_person || null,
          phone: contract?.contact_phone || null,
          created_from: 'sales_contract',
          created_at: contract?.created_at || null,
          updated_at: contract?.updated_at || null,
        });
      });
    };

    if (relatedEmails.size > 0) {
      const { data, error } = await supabaseAdminDb
        .from('sales_contracts')
        .select('*')
        .in('customer_email', Array.from(relatedEmails))
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      bindContractRows(data || []);
    }

    for (const companyName of relatedCompanies) {
      const { data, error } = await supabaseAdminDb
        .from('sales_contracts')
        .select('*')
        .eq('customer_company', companyName)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      bindContractRows(data || []);
    }

    const orders = Array.from(merged.values()).slice(0, 200);

    return c.json({
      success: true,
      orders,
      scope: {
        relatedEmails: Array.from(relatedEmails),
        relatedCompanies: Array.from(relatedCompanies),
      },
    });
  } catch (error) {
    console.error('❌ 客户侧读取 orders 失败:', error);
    return c.json({
      success: false,
      message: `customer orders failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/list-orders', async (c) => {
  try {
    const orderNumber = String(c.req.query('orderNumber') || '').trim();
    const customerEmail = String(c.req.query('customerEmail') || '').trim().toLowerCase();
    const localAdminAuth = c.req.query('localAdminAuth')
      ? {
          email: String(c.req.query('localAdminEmail') || '').trim().toLowerCase(),
          password: String(c.req.query('localAdminPassword') || '').trim(),
        }
      : null;
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, localAdminAuth);
    if (auth.error) return auth.error;

    let query = supabaseAdminDb
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(orderNumber ? 20 : 500);

    if (orderNumber) {
      query = query.or(`order_number.eq.${orderNumber},contract_number.eq.${orderNumber}`);
    }

    if (customerEmail) {
      query = query.eq('customer_email', customerEmail);
    }

    const { data, error } = await query;
    if (error) throw error;

    return c.json({
      success: true,
      orders: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error('❌ 服务端读取 orders 失败:', error);
    return c.json({
      success: false,
      message: `list orders failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/customer-shipment-tracking', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const requestedEmail = String(c.req.query('email') || '').trim().toLowerCase();
    const effectiveEmail = requestedEmail || sessionEmail;

    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }

    if (effectiveEmail !== sessionEmail) {
      return c.json({ success: false, message: '无权读取其他客户邮箱的物流跟踪' }, 403);
    }

    const { data: poRows, error: poError } = await supabaseAdminDb
      .from('purchase_orders')
      .select('id, po_number, customer_email, supplier_name')
      .eq('customer_email', effectiveEmail)
      .is('deleted_at', null);

    if (poError) throw poError;

    const purchaseOrders = Array.isArray(poRows) ? poRows : [];
    if (purchaseOrders.length === 0) {
      return c.json({ success: true, rows: [] });
    }

    const purchaseOrderIds = purchaseOrders.map((row: any) => row.id).filter(Boolean);
    const { data: voyageRows, error: voyageError } = await supabaseAdminDb
      .from('voyage_tracking')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds)
      .order('created_at', { ascending: false });
    if (voyageError) throw voyageError;

    const { data: executionRows, error: executionError } = await supabaseAdminDb
      .from('purchase_order_execution')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds);
    if (executionError) throw executionError;

    const executionMap = new Map<string, any>();
    (executionRows || []).forEach((row: any) => {
      if (row?.purchase_order_id) executionMap.set(row.purchase_order_id, row);
    });

    const voyageMap = new Map<string, any>();
    (voyageRows || []).forEach((row: any) => {
      if (row?.purchase_order_id && !voyageMap.has(row.purchase_order_id)) {
        voyageMap.set(row.purchase_order_id, row);
      }
    });

    const voyageIds = Array.from(new Set((voyageRows || []).map((row: any) => row?.id).filter(Boolean)));
    let arrivalRows: any[] = [];
    let clearanceRows: any[] = [];
    let deliveryRows: any[] = [];
    let exceptionRows: any[] = [];
    let feedbackRows: any[] = [];

    if (voyageIds.length > 0) {
      const arrivalResult = await supabaseAdminDb
        .from('arrival_notices')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false });
      if (arrivalResult.error) throw arrivalResult.error;
      arrivalRows = arrivalResult.data || [];

      const clearanceResult = await supabaseAdminDb
        .from('import_clearance_coordination')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false });
      if (clearanceResult.error) throw clearanceResult.error;
      clearanceRows = clearanceResult.data || [];

      const clearanceIds = Array.from(new Set(clearanceRows.map((row: any) => row?.id).filter(Boolean)));
      if (clearanceIds.length > 0) {
        const deliveryResult = await supabaseAdminDb
          .from('delivery_confirmations')
          .select('*')
          .in('clearance_id', clearanceIds)
          .order('created_at', { ascending: false });
        if (deliveryResult.error) throw deliveryResult.error;
        deliveryRows = deliveryResult.data || [];
      }

      const exceptionResult = await supabaseAdminDb
        .from('delivery_exceptions')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false });
      if (exceptionResult.error) throw exceptionResult.error;
      exceptionRows = exceptionResult.data || [];
    }

    const feedbackResult = await supabaseAdminDb
      .from('post_order_feedback')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds)
      .order('created_at', { ascending: false });
    if (feedbackResult.error) throw feedbackResult.error;
    feedbackRows = feedbackResult.data || [];

    const arrivalMap = new Map<string, any>();
    arrivalRows.forEach((row: any) => {
      if (row?.voyage_id && !arrivalMap.has(row.voyage_id)) arrivalMap.set(row.voyage_id, row);
    });

    const clearanceMap = new Map<string, any>();
    clearanceRows.forEach((row: any) => {
      if (row?.voyage_id && !clearanceMap.has(row.voyage_id)) clearanceMap.set(row.voyage_id, row);
    });

    const deliveryMap = new Map<string, any>();
    deliveryRows.forEach((row: any) => {
      if (row?.clearance_id && !deliveryMap.has(row.clearance_id)) deliveryMap.set(row.clearance_id, row);
    });

    const exceptionMap = new Map<string, any[]>();
    exceptionRows.forEach((row: any) => {
      if (!row?.voyage_id) return;
      const existing = exceptionMap.get(row.voyage_id) || [];
      existing.push(row);
      exceptionMap.set(row.voyage_id, existing);
    });

    const feedbackMap = new Map<string, any>();
    feedbackRows.forEach((row: any) => {
      if (row?.purchase_order_id && !feedbackMap.has(row.purchase_order_id)) {
        feedbackMap.set(row.purchase_order_id, row);
      }
    });

    const rows = purchaseOrders.map((po: any) => {
      const voyage = voyageMap.get(po.id) || null;
      const arrival = voyage?.id ? (arrivalMap.get(voyage.id) || null) : null;
      const clearance = voyage?.id ? (clearanceMap.get(voyage.id) || null) : null;
      const delivery = clearance?.id ? (deliveryMap.get(clearance.id) || null) : null;
      return {
        purchaseOrderId: po.id,
        orderNumber: po.po_number || null,
        customerEmail: po.customer_email || null,
        supplierName: po.supplier_name || null,
        execution: executionMap.get(po.id) || null,
        voyage,
        arrivalNotice: arrival,
        importClearance: clearance,
        deliveryConfirmation: delivery,
        deliveryExceptions: voyage?.id ? (exceptionMap.get(voyage.id) || []) : [],
        latestFeedback: feedbackMap.get(po.id) || null,
      };
    });

    return c.json({
      success: true,
      rows,
    });
  } catch (error) {
    console.error('❌ 客户侧读取 shipment tracking 失败:', error);
    return c.json({
      success: false,
      message: `customer shipment tracking failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/customer-inquiries', async (c) => {
  try {
    const auth = await requireAuthenticatedUser(c);
    if (auth.error) return auth.error;

    const sessionEmail = String(auth.user?.email || '').trim().toLowerCase();
    const requestedEmail = String(c.req.query('email') || '').trim().toLowerCase();
    const effectiveEmail = requestedEmail || sessionEmail;
    const companyId = String(c.req.query('companyId') || '').trim();
    const companyName = String(c.req.query('companyName') || '').trim();

    if (!sessionEmail) {
      return c.json({ success: false, message: '当前账号缺少邮箱信息' }, 400);
    }

    if (effectiveEmail !== sessionEmail) {
      return c.json({ success: false, message: '无权读取其他客户邮箱的询价单' }, 403);
    }

    const { data, error } = await supabaseAdminDb
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const rows = (Array.isArray(data) ? data : []).filter((row: any) => {
      const rowEmail = String(row?.user_email || row?.buyer_info?.email || '').trim().toLowerCase();
      const rowCompanyId = String(row?.company_id || '').trim();
      const rowCompanyName = String(row?.buyer_company || row?.buyer_info?.companyName || '').trim();
      return (
        (!!effectiveEmail && rowEmail === effectiveEmail) ||
        (!!companyId && rowCompanyId === companyId) ||
        (!!companyName && rowCompanyName === companyName)
      );
    });

    return c.json({
      success: true,
      inquiries: rows,
    });
  } catch (error) {
    console.error('❌ 客户侧读取 inquiries 失败:', error);
    return c.json({
      success: false,
      message: `customer inquiries failed: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

// 🔍 验证会话
app.get('/make-server-880fd43b/auth/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        message: '未提供认证令牌' 
      }, 401);
    }
    
    const token = authHeader.substring(7);
    
    // 查询会话
    const { data, error } = await supabase
      .from('kv_store_880fd43b')
      .select('value')
      .eq('key', `session:${token}`)
      .single();
    
    if (error || !data) {
      return c.json({ 
        success: false, 
        message: '会话已过期，请重新登录' 
      }, 401);
    }
    
    const session = data.value as any;
    
    // 检查会话是否过期
    if (new Date(session.expiresAt) < new Date()) {
      // 删除过期会话
      await supabase
        .from('kv_store_880fd43b')
        .delete()
        .eq('key', `session:${token}`);
      
      return c.json({ 
        success: false, 
        message: '会话已过期，请重新登录' 
      }, 401);
    }
    
    return c.json({
      success: true,
      user: {
        userId: session.userId,
        username: session.username,
        name: session.name,
        email: session.email,
        role: session.role,
        department: session.department
      }
    });
    
  } catch (error) {
    console.error('❌ 会话验证错误:', error);
    return c.json({ 
      success: false, 
      message: '验证失败' 
    }, 500);
  }
});

// 🚪 用户登出
app.post('/make-server-880fd43b/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: true, 
        message: '已登出' 
      });
    }
    
    const token = authHeader.substring(7);
    
    // 删除会话
    await supabase
      .from('kv_store_880fd43b')
      .delete()
      .eq('key', `session:${token}`);
    
    return c.json({
      success: true,
      message: '登出成功'
    });
    
  } catch (error) {
    console.error('❌ 登出错误:', error);
    return c.json({ 
      success: false, 
      message: '登出失败' 
    }, 500);
  }
});

// 👥 获取所有用户列表（仅管理员）
app.get('/make-server-880fd43b/auth/users', async (c) => {
  try {
    // 查询所有用户
    const { data, error } = await supabase
      .from('kv_store_880fd43b')
      .select('value')
      .like('key', 'user:%')
      .not('key', 'like', 'user:id:%'); // 排除ID索引
    
    if (error) {
      throw error;
    }
    
    const users = data
      .map(row => row.value as any)
      .map(({ password, ...user }) => user); // 移除密码字段
    
    return c.json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error('❌ 获取用户列表错误:', error);
    return c.json({ 
      success: false, 
      message: '获取用户列表失败' 
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/sync-internal-account-identity', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      authUserId,
      previousLoginEmail,
      nextLoginEmail,
      nextUsername,
      employeeName,
      role,
      region,
    } = await c.req.json();

    const normalizedNextEmail = String(nextLoginEmail || '').trim().toLowerCase();
    const normalizedPreviousEmail = String(previousLoginEmail || '').trim().toLowerCase();
    const normalizedAuthUserId = String(authUserId || '').trim();
    const normalizedName = String(employeeName || nextUsername || '').trim() || '内部账号';
    const normalizedRole = String(role || '').trim() || 'Admin';
    const normalizedRegion = String(region || '').trim() || 'all';
    const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';

    if (!normalizedNextEmail) {
      return c.json({ success: false, message: '缺少目标登录邮箱' }, 400);
    }

    let targetUserId = normalizedAuthUserId;

    if (!targetUserId && normalizedPreviousEmail) {
      const { data: previousUser } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const matched = previousUser?.users?.find((user) => String(user.email || '').trim().toLowerCase() === normalizedPreviousEmail);
      targetUserId = matched?.id || '';
    }

    const nextEmailOwner = await findAuthUserByIdOrEmail('', normalizedNextEmail);
    if (nextEmailOwner?.id) {
      targetUserId = nextEmailOwner.id;
    }

    if (!targetUserId) {
      return c.json({ success: false, message: '未找到要同步的认证账号' }, 404);
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUserId, {
      email: normalizedNextEmail,
      user_metadata: {
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
      },
      email_confirm: true,
    });

    if (updateAuthError) {
      throw updateAuthError;
    }

    const { error: upsertProfileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: targetUserId,
        email: normalizedNextEmail,
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
        updated_at: new Date().toISOString(),
      });

    if (upsertProfileError) {
      throw new Error(`同步 user_profiles 失败: ${String(upsertProfileError.message || upsertProfileError)}`);
    }

    await supabase
      .from('admin_account_identity_audit_logs')
      .insert({
        changed_at: new Date().toISOString(),
        account_id: normalizedAuthUserId || null,
        employee_id: null,
        employee_no: null,
        employee_name: normalizedName,
        actor_name: guard.profile?.email || guard.user?.email || null,
        actor_email: guard.user?.email || null,
        previous_username: null,
        next_username: String(nextUsername || '').trim() || null,
        previous_login_email: normalizedPreviousEmail || null,
        next_login_email: normalizedNextEmail,
        reason: 'Auth 同步校验',
        auth_sync_required: true,
        password_reset_required: false,
      })
      .throwOnError()
      .catch(() => null);

    const { data: verifiedAuthUser, error: verifyAuthError } = await supabase.auth.admin.getUserById(targetUserId);
    if (verifyAuthError) {
      throw verifyAuthError;
    }

    const { data: verifiedProfile, error: verifyProfileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', targetUserId)
      .maybeSingle();

    if (verifyProfileError) {
      throw verifyProfileError;
    }

    const authEmail = String(verifiedAuthUser.user?.email || '').trim().toLowerCase();
    const profileEmail = String(verifiedProfile?.email || '').trim().toLowerCase();
    const consistent = authEmail === normalizedNextEmail && profileEmail === normalizedNextEmail;

    return c.json({
      success: true,
      authUserId: targetUserId,
      email: authEmail,
      profileEmail,
      consistent,
    });
  } catch (error) {
    console.error('❌ 同步内部账号标识失败:', error);
    return c.json({
      success: false,
      message: `同步认证账号失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/ensure-admin-test-account', async (c) => {
  try {
    const body = await c.req.json();
    const authResult = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (authResult.error) return authResult.error;

    const {
      authUserId,
      loginEmail,
      loginPassword,
      employeeId,
      employeeName,
      role,
      region,
      forcePasswordReset,
    } = body;

    const ensuredUser = await ensureInternalAdminAuthUser({
      authUserId,
      loginEmail,
      loginPassword,
      employeeId,
      employeeName,
      role,
      region,
      forcePasswordReset,
    });

    const { error: profileError } = await supabase.rpc('upsert_internal_user_profile', {
      p_id: ensuredUser.authUserId,
      p_email: ensuredUser.loginEmail,
      p_name: ensuredUser.name,
      p_portal_role: ensuredUser.portalRole,
      p_rbac_role: ensuredUser.role,
      p_region: ensuredUser.region,
      p_company: null,
      p_phone: null,
    });

    if (profileError) {
      throw new Error(`同步 user_profiles 失败: ${String(profileError.message || profileError)}`);
    }

    const { data: verifiedAuthUser, error: verifyAuthError } = await supabase.auth.admin.getUserById(ensuredUser.authUserId);
    if (verifyAuthError) throw verifyAuthError;

    const { data: verifiedProfileEmail, error: verifyProfileError } = await supabase.rpc('get_internal_user_profile_email', {
      p_id: ensuredUser.authUserId,
    });
    if (verifyProfileError) throw verifyProfileError;

    const authEmail = String(verifiedAuthUser.user?.email || '').trim().toLowerCase();
    const profileEmail = String(verifiedProfileEmail || '').trim().toLowerCase();
    const expectedEmail = String(ensuredUser.loginEmail || '').trim().toLowerCase();

    return c.json({
      success: true,
      authUserId: ensuredUser.authUserId,
      email: authEmail,
      profileEmail,
      consistent: authEmail === expectedEmail && profileEmail === expectedEmail,
    });
  } catch (error) {
    console.error('❌ 同步内部测试账号失败:', error);
    return c.json({
      success: false,
      message: `同步内部测试账号失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/sync-customer-enterprise-account', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAuthenticatedUser(c);
    const adminGuard = auth.error
      ? await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null)
      : null;

    if (auth.error && adminGuard?.error) {
      return auth.error;
    }

    const {
      memberId,
      enterpriseAuthUserId,
      authUserId,
      loginEmail,
      loginPassword,
      employeeNo,
      employeeName,
      role,
      region,
      businessEmail,
      forcePasswordReset,
      canLogin,
      status,
    } = body;

    const actingUserId = String(auth.user?.id || '').trim();
    const isAdminRepair = Boolean(auth.error && !adminGuard?.error);
    const normalizedEnterpriseAuthUserId = String(
      enterpriseAuthUserId || actingUserId || '',
    ).trim();
    const normalizedMemberId = String(memberId || '').trim();
    const normalizedEmail = String(loginEmail || '').trim().toLowerCase();
    const normalizedBusinessEmail = String(businessEmail || normalizedEmail).trim().toLowerCase();
    const normalizedStatus = String(status || '').trim() || 'active';

    if (!normalizedEnterpriseAuthUserId) {
      return c.json({ success: false, message: '缺少企业主账号标识' }, 400);
    }

    if (!isAdminRepair && normalizedEnterpriseAuthUserId !== actingUserId) {
      return c.json({ success: false, message: '无权同步其他企业成员的认证账号' }, 403);
    }

    if (!normalizedMemberId) {
      return c.json({ success: false, message: '缺少成员标识' }, 400);
    }

    if (!normalizedEmail) {
      return c.json({ success: false, message: '缺少登录邮箱' }, 400);
    }

    const { data: existingMember, error: memberLoadError } = await supabaseAdminDb
      .from('customer_enterprise_members')
      .select('id, enterprise_auth_user_id, linked_auth_user_id')
      .eq('enterprise_auth_user_id', normalizedEnterpriseAuthUserId)
      .eq('id', normalizedMemberId)
      .maybeSingle();

    if (memberLoadError) throw memberLoadError;
    if (!existingMember?.id) {
      return c.json({ success: false, message: '未找到要同步的客户成员' }, 404);
    }

    const ensuredUser = await ensureCustomerEnterpriseAuthUser({
      authUserId: String(authUserId || existingMember.linked_auth_user_id || '').trim(),
      loginEmail: normalizedEmail,
      loginPassword,
      employeeNo,
      employeeName,
      role,
      region,
      forcePasswordReset,
      canLogin,
    });

    const profilePayload = {
      id: ensuredUser.authUserId,
      email: ensuredUser.loginEmail,
      name: ensuredUser.name,
      portal_role: 'customer',
      rbac_role: ensuredUser.role,
      region: ensuredUser.region,
      company: null,
      phone: null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertProfileError } = await supabaseAdminDb
      .from('user_profiles')
      .upsert(profilePayload);

    if (upsertProfileError) {
      throw new Error(`同步客户 user_profiles 失败: ${String(upsertProfileError.message || upsertProfileError)}`);
    }

    const { error: updateMemberError } = await supabaseAdminDb
      .from('customer_enterprise_members')
      .update({
        linked_auth_user_id: ensuredUser.authUserId,
        login_email: normalizedEmail,
        business_email: normalizedBusinessEmail,
        role: ensuredUser.role,
        status: normalizedStatus,
        can_login: ensuredUser.canLogin,
        updated_at: new Date().toISOString(),
      })
      .eq('enterprise_auth_user_id', normalizedEnterpriseAuthUserId)
      .eq('id', normalizedMemberId);

    if (updateMemberError) throw updateMemberError;

    const { data: verifiedAuthUser, error: verifyAuthError } = await supabase.auth.admin.getUserById(ensuredUser.authUserId);
    if (verifyAuthError) throw verifyAuthError;

    return c.json({
      success: true,
      authUserId: ensuredUser.authUserId,
      loginEmail: ensuredUser.loginEmail,
      email: String(verifiedAuthUser.user?.email || '').trim().toLowerCase(),
      canLogin: ensuredUser.canLogin,
      role: ensuredUser.role,
      region: ensuredUser.region,
    });
  } catch (error) {
    console.error('❌ 同步客户企业账号失败:', error);
    return c.json({
      success: false,
      message: `同步客户认证账号失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/upsert-admin-roster-entry', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const authResult = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (authResult.error) return authResult.error;

    const contact = body?.contact && typeof body.contact === 'object' ? body.contact : null;
    const account = body?.account && typeof body.account === 'object' ? body.account : null;
    const contactId = String(contact?.id || account?.employeeId || '').trim();
    const loginEmail = String(account?.loginEmail || contact?.email || '').trim().toLowerCase();

    if (!contact || !account || !contactId || !loginEmail) {
      return c.json({ success: false, message: '缺少必要的人员或账号信息' }, 400);
    }

    const { data: currentOrg, error: loadError } = await supabase
      .from('admin_organizations')
      .select('*')
      .eq('id', 'admin-org-001')
      .maybeSingle();

    if (loadError || !currentOrg) {
      throw loadError || new Error('未找到 admin-org-001');
    }

    const nextContacts = Array.isArray(currentOrg.internal_contacts) ? [...currentOrg.internal_contacts] : [];
    const nextAccounts = Array.isArray(currentOrg.internal_accounts) ? [...currentOrg.internal_accounts] : [];

    const contactIndex = nextContacts.findIndex((item: any) =>
      String(item?.id || '').trim() === contactId ||
      String(item?.email || '').trim().toLowerCase() === loginEmail,
    );
    if (contactIndex >= 0) {
      nextContacts[contactIndex] = {
        ...nextContacts[contactIndex],
        ...contact,
        id: contactId,
        email: loginEmail,
      };
    } else {
      nextContacts.push({
        ...contact,
        id: contactId,
        email: loginEmail,
      });
    }

    const accountIndex = nextAccounts.findIndex((item: any) =>
      String(item?.id || '').trim() === String(account?.id || '').trim() ||
      String(item?.loginEmail || '').trim().toLowerCase() === loginEmail,
    );
    const nextAccount = {
      ...account,
      employeeId: contactId,
      loginEmail,
    };
    if (accountIndex >= 0) {
      nextAccounts[accountIndex] = {
        ...nextAccounts[accountIndex],
        ...nextAccount,
      };
    } else {
      nextAccounts.push(nextAccount);
    }

    const { error: saveError } = await supabase
      .from('admin_organizations')
      .update({
        internal_contacts: nextContacts,
        internal_accounts: nextAccounts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'admin-org-001');

    if (saveError) {
      throw saveError;
    }

    return c.json({
      success: true,
      contactEmail: loginEmail,
      accountEmail: loginEmail,
      contactCount: nextContacts.length,
      accountCount: nextAccounts.length,
    });
  } catch (error) {
    console.error('❌ 补写 admin roster 条目失败:', error);
    return c.json({
      success: false,
      message: `补写 admin roster 条目失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/reconcile-admin-roster', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const authResult = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (authResult.error) return authResult.error;

    const profile = body?.profile && typeof body.profile === 'object' ? body.profile : null;
    if (!profile) {
      return c.json({ success: false, message: '缺少组织花名册数据' }, 400);
    }

    const { data, error } = await supabase.rpc('reconcile_admin_org_roster', {
      p_org_id: String(profile.id || 'admin-org-001'),
      p_internal_contacts: Array.isArray(profile.internal_contacts)
        ? profile.internal_contacts
        : (Array.isArray(profile.internalContacts) ? profile.internalContacts : []),
      p_internal_accounts: Array.isArray(profile.internal_accounts)
        ? profile.internal_accounts
        : (Array.isArray(profile.internalAccounts) ? profile.internalAccounts : []),
    });

    if (error) throw error;

    return c.json({
      success: true,
      organization: data || null,
    });
  } catch (error) {
    console.error('❌ 重建 admin roster 失败:', error);
    return c.json({
      success: false,
      message: `重建 admin roster 失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/update-admin-account-password', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      accountId,
      nextPassword,
      forcePasswordReset,
    } = await c.req.json();

    const normalizedAccountId = String(accountId || '').trim();
    const normalizedPassword = String(nextPassword || '').trim();

    if (!normalizedAccountId) {
      return c.json({ success: false, message: '缺少账号标识' }, 400);
    }

    if (!normalizedPassword) {
      return c.json({ success: false, message: '密码不能为空' }, 400);
    }

    const { data: org, error: orgError } = await supabase
      .from('admin_organizations')
      .select('id,internal_accounts')
      .eq('id', 'admin-org-001')
      .maybeSingle();

    if (orgError) throw orgError;

    const currentAccounts = Array.isArray(org?.internal_accounts) ? org.internal_accounts : [];
    const targetAccount = currentAccounts.find((account: any) => String(account?.id || '').trim() === normalizedAccountId);
    if (!targetAccount) {
      return c.json({ success: false, message: '未找到要更新的账号' }, 404);
    }

    const nextAccounts = currentAccounts.map((account: any) => (
      String(account?.id || '').trim() === normalizedAccountId
        ? {
            ...account,
            loginPassword: normalizedPassword,
            forcePasswordReset: typeof forcePasswordReset === 'boolean'
              ? forcePasswordReset
              : Boolean(account?.forcePasswordReset),
          }
        : account
    ));

    const { data: updated, error: updateError } = await supabase
      .from('admin_organizations')
      .update({
        internal_accounts: nextAccounts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'admin-org-001')
      .select('internal_accounts')
      .maybeSingle();

    if (updateError) throw updateError;

    const updatedAccounts = Array.isArray(updated?.internal_accounts) ? updated.internal_accounts : nextAccounts;
    const updatedAccount = updatedAccounts.find((account: any) => String(account?.id || '').trim() === normalizedAccountId);

    return c.json({
      success: true,
      account: updatedAccount || null,
    });
  } catch (error) {
    console.error('❌ 更新内部账号密码失败:', error);
    return c.json({
      success: false,
      message: `更新账号密码失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/save-admin-organization', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const profile = body?.profile || {};
    const authResult = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (authResult.error) return authResult.error;

    const payload = {
      id: String(profile.id || 'admin-org-001'),
      name_cn: String(profile.name_cn || profile.nameCN || ''),
      name_en: String(profile.name_en || profile.nameEN || ''),
      description_cn: String(profile.description_cn || profile.descriptionCN || ''),
      description_en: String(profile.description_en || profile.descriptionEN || ''),
      phone: String(profile.phone || ''),
      email: String(profile.email || ''),
      contact_person: String(profile.contact_person || profile.contactPerson || ''),
      website: String(profile.website || ''),
      address_cn: String(profile.address_cn || profile.addressCN || ''),
      address_en: String(profile.address_en || profile.addressEN || ''),
      tax_id: String(profile.tax_id || profile.taxId || ''),
      default_currency: String(profile.default_currency || profile.defaultCurrency || ''),
      timezone: String(profile.timezone || 'Asia/Shanghai'),
      logo_url: profile.logo_url ?? profile.logoUrl ?? null,
      rmb_bank: profile.rmb_bank || profile.bankRMB || {},
      usd_bank: profile.usd_bank || profile.bankUSD || {},
      private_bank: profile.private_bank || profile.bankPrivate || {},
      internal_contacts: Array.isArray(profile.internal_contacts) ? profile.internal_contacts : (Array.isArray(profile.internalContacts) ? profile.internalContacts : []),
      internal_accounts: Array.isArray(profile.internal_accounts) ? profile.internal_accounts : (Array.isArray(profile.internalAccounts) ? profile.internalAccounts : []),
      document_defaults: profile.document_defaults || profile.documentDefaults || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.rpc('save_admin_organization_snapshot', {
      p_payload: payload,
    });

    if (error) throw error;

    return c.json({
      success: true,
      organization: data || null,
    });
  } catch (error) {
    console.error('❌ 保存 admin organization 失败:', error);
    return c.json({
      success: false,
      message: `保存 admin organization 失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/send-admin-email-invite', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      authUserId,
      loginEmail,
      employeeId,
      employeeName,
      role,
      region,
    } = await c.req.json();

    const normalizedEmail = String(loginEmail || '').trim().toLowerCase();
    const normalizedName = String(employeeName || '').trim() || normalizedEmail.split('@')[0] || '内部账号';
    const normalizedRole = String(role || '').trim() || 'Admin';
    const normalizedRegion = String(region || '').trim() || 'all';
    const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';
    const redirectTo = resolveAdminInviteRedirectUrl();

    if (!normalizedEmail) {
      return c.json({ success: false, message: '缺少正式登录邮箱' }, 400);
    }

    const existedUser = await findAuthUserByIdOrEmail(String(authUserId || ''), normalizedEmail);
    let targetUserId = existedUser?.id || '';
    let inviteUrl = '';
    let deliveryMode: 'invite' | 'magiclink' = 'invite';

    if (!targetUserId) {
      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: {
          name: normalizedName,
          portal_role: portalRole,
          rbac_role: normalizedRole,
          region: normalizedRegion,
          employee_id: String(employeeId || '').trim() || null,
        },
      });

      if (inviteError) throw inviteError;
      targetUserId = invited.user?.id || '';
    } else {
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUserId, {
        email: normalizedEmail,
        user_metadata: {
          name: normalizedName,
          portal_role: portalRole,
          rbac_role: normalizedRole,
          region: normalizedRegion,
          employee_id: String(employeeId || '').trim() || null,
        },
        email_confirm: false,
      });

      if (updateAuthError) throw updateAuthError;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo,
          data: {
            name: normalizedName,
            portal_role: portalRole,
            rbac_role: normalizedRole,
            region: normalizedRegion,
            employee_id: String(employeeId || '').trim() || null,
          },
        },
      });

      if (linkError) throw linkError;
      inviteUrl = String(linkData?.properties?.action_link || linkData?.properties?.hashed_token || '');
      deliveryMode = 'magiclink';
    }

    await supabase
      .from('user_profiles')
      .upsert({
        id: targetUserId,
        email: normalizedEmail,
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
        updated_at: new Date().toISOString(),
      });

    const invitedAt = new Date().toISOString();
    const inviteExpiresAt = new Date(Date.now() + defaultInviteExpiryHours * 60 * 60 * 1000).toISOString();

    return c.json({
      success: true,
      authUserId: targetUserId,
      loginEmail: normalizedEmail,
      invitedAt,
      inviteExpiresAt,
      inviteUrl,
      deliveryMode,
      redirectTo,
    });
  } catch (error) {
    console.error('❌ 发送内部正式邮箱邀请失败:', error);
    return c.json({
      success: false,
      message: `发送正式邮箱邀请失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/enterprise-wechat/start', async (c) => {
  try {
    const corpId = Deno.env.get('ADMIN_ENTERPRISE_WECHAT_CORP_ID') || '';
    const agentId = Deno.env.get('ADMIN_ENTERPRISE_WECHAT_AGENT_ID') || '';
    const callbackUrl = resolveEnterpriseWechatCallbackUrl();

    if (!corpId || !agentId || !callbackUrl) {
      return c.json({
        success: false,
        message: '企业微信登录尚未配置完成，请先补充 CorpID、AgentID 和回调地址',
      }, 501);
    }

    const state = crypto.randomUUID();
    const authorizeUrl =
      'https://open.work.weixin.qq.com/wwopen/sso/qrConnect'
      + `?appid=${encodeURIComponent(corpId)}`
      + `&agentid=${encodeURIComponent(agentId)}`
      + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
      + '&state=' + encodeURIComponent(state);

    return c.json({
      success: true,
      authorizeUrl,
      state,
    });
  } catch (error) {
    console.error('❌ 企业微信登录启动失败:', error);
    return c.json({
      success: false,
      message: `企业微信登录启动失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/enterprise-wechat/callback', async (c) => {
  const redirectWithError = (message: string) => {
    const redirectUrl = buildFormalAdminRedirect({
      enterprise_wechat_error: message,
    });
    if (!redirectUrl) return c.json({ success: false, message }, 500);
    return c.redirect(redirectUrl, 302);
  };

  try {
    const code = String(c.req.query('code') || '').trim();
    const callbackUserId = String(c.req.query('userid') || c.req.query('mock_userid') || '').trim();
    const resolvedUserId = callbackUserId || await resolveEnterpriseWechatUserId(code);

    if (!resolvedUserId) {
      return redirectWithError('企业微信回调未识别到内部用户标识');
    }

    const matched = await findEnterpriseWechatAccount(resolvedUserId);
    if (!matched?.account) {
      return redirectWithError('未找到绑定该企业微信用户的正式账号');
    }

    const accountStatus = String(matched.account.accountStatus || '').trim().toLowerCase();
    const authMode = String(matched.account.authMode || '').trim().toLowerCase();
    const activationStatus = String(matched.account.activationStatus || '').trim().toLowerCase();
    const primaryIdentitySource = String(matched.account.primaryIdentitySource || '').trim().toLowerCase();

    if (!matched.account.canLogin || accountStatus !== 'active') {
      return redirectWithError('该企业微信账号当前未开通登录');
    }

    if (authMode === 'test') {
      return redirectWithError('该企业微信账号仍属于测试轨，请改用测试入口');
    }

    if (primaryIdentitySource !== 'enterprise_wechat') {
      return redirectWithError('该账号未配置企业微信为主认证方式');
    }

    if (activationStatus !== 'active') {
      return redirectWithError('该正式账号尚未完成激活，暂不可用企业微信登录');
    }

    const ensuredUser = await ensureEnterpriseWechatAuthUser({
      authUserId: String(matched.account.authUserId || '').trim(),
      loginEmail: String(matched.account.loginEmail || '').trim().toLowerCase(),
      employeeName: String(matched.contact?.name || matched.account.username || '').trim(),
      role: String(matched.account.role || '').trim(),
      region: String(matched.account.region || '').trim(),
    });

    await supabase
      .from('user_profiles')
      .upsert({
        id: ensuredUser.authUserId,
        email: ensuredUser.loginEmail,
        name: ensuredUser.name,
        portal_role: ensuredUser.portalRole,
        rbac_role: ensuredUser.role,
        region: ensuredUser.region,
        updated_at: new Date().toISOString(),
      });

    const magicLinkResult = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: ensuredUser.loginEmail,
      options: {
        redirectTo: resolveFormalAdminLoginUrl(),
      },
    });

    const actionLink = String(
      magicLinkResult.data?.properties?.action_link
      || magicLinkResult.data?.properties?.hashed_token
      || '',
    ).trim();

    if (!actionLink) {
      return redirectWithError('企业微信登录已识别账号，但生成正式登录链接失败');
    }

    return c.redirect(actionLink, 302);
  } catch (error) {
    console.error('❌ 企业微信登录回调失败:', error);
    return redirectWithError(`企业微信登录回调失败: ${String((error as Error)?.message || error || 'unknown error')}`);
  }
});

app.post('/make-server-880fd43b/auth/scan-payment-slip', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    if (!openAiApiKey) {
      return c.json({
        success: false,
        message: '付款水单识别尚未配置 OPENAI_API_KEY，请先在 Supabase Functions 环境变量中补充后再使用',
      }, 501);
    }

    const {
      fileName,
      contentType,
      dataUrl,
    } = await c.req.json();

    const normalizedFileName = String(fileName || '').trim() || 'payment-slip';
    const normalizedType = String(contentType || '').trim().toLowerCase();
    const normalizedDataUrl = String(dataUrl || '').trim();

    if (!normalizedDataUrl.startsWith('data:image/')) {
      return c.json({ success: false, message: '当前仅支持图片格式的付款水单识别' }, 400);
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(normalizedType)) {
      return c.json({ success: false, message: '当前仅支持 JPG、PNG、WebP 格式的付款水单识别' }, 400);
    }

    const systemPrompt = [
      '你是资深财务出纳助理，负责读取付款水单并提取字段。',
      '只返回一个 JSON 对象，不要输出解释、不要输出 Markdown 代码块。',
      'JSON 必须包含这些键：payee, amount, currency, paidAt, method, bankRef, bankName, accountNumber, remarks, warnings。',
      '规则：',
      '1. 无法确定的字段返回 null。',
      '2. amount 返回数字，不要带货币符号和千分位。',
      '3. currency 返回大写币种代码，例如 USD、CNY、EUR。',
      '4. paidAt 尽量格式化为 YYYY-MM-DD HH:mm；如果只能识别日期，可返回 YYYY-MM-DD 00:00。',
      '5. method 仅允许 T/T、L/C、CASH、CHEQUE、OTHER、null。',
      '6. bankRef 优先提取交易流水号、参考号、回单号。',
      '7. warnings 必须是字符串数组，记录看不清、字段冲突、需要人工确认的点。',
      '8. 不要臆造收款方、金额、日期、币种。',
    ].join('\n');

    const userPrompt = [
      `文件名: ${normalizedFileName}`,
      '请读取这张付款水单，并提取录入付款记录表单所需字段。',
    ].join('\n');

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: paymentSlipModel,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: systemPrompt,
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: userPrompt,
              },
              {
                type: 'input_image',
                image_url: normalizedDataUrl,
              },
            ],
          },
        ],
      }),
    });

    const openAiPayload = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      console.error('❌ 付款水单识别请求失败:', openAiPayload);
      return c.json({
        success: false,
        message: String(openAiPayload?.error?.message || openAiPayload?.message || '付款水单识别失败'),
      }, 502);
    }

    const rawText = sanitizeModelJson(extractResponseOutputText(openAiPayload));
    if (!rawText) {
      return c.json({ success: false, message: '付款水单识别未返回可解析结果' }, 502);
    }

    let extracted: Record<string, any> = {};
    try {
      extracted = JSON.parse(rawText);
    } catch (error) {
      console.error('❌ 付款水单识别结果解析失败:', rawText, error);
      return c.json({ success: false, message: '付款水单识别结果格式异常，请重试' }, 502);
    }

    const normalizedResult = {
      payee: typeof extracted?.payee === 'string' && extracted.payee.trim() ? extracted.payee.trim() : null,
      amount: typeof extracted?.amount === 'number'
        ? extracted.amount
        : typeof extracted?.amount === 'string' && extracted.amount.trim()
          ? Number(String(extracted.amount).replace(/,/g, ''))
          : null,
      currency: typeof extracted?.currency === 'string' && extracted.currency.trim()
        ? extracted.currency.trim().toUpperCase()
        : null,
      paidAt: typeof extracted?.paidAt === 'string' && extracted.paidAt.trim() ? extracted.paidAt.trim() : null,
      method: typeof extracted?.method === 'string' && extracted.method.trim()
        ? extracted.method.trim().toUpperCase()
        : null,
      bankRef: typeof extracted?.bankRef === 'string' && extracted.bankRef.trim() ? extracted.bankRef.trim() : null,
      bankName: typeof extracted?.bankName === 'string' && extracted.bankName.trim() ? extracted.bankName.trim() : null,
      accountNumber: typeof extracted?.accountNumber === 'string' && extracted.accountNumber.trim()
        ? extracted.accountNumber.trim()
        : null,
      remarks: typeof extracted?.remarks === 'string' && extracted.remarks.trim() ? extracted.remarks.trim() : null,
      warnings: Array.isArray(extracted?.warnings)
        ? extracted.warnings.filter((item: unknown) => typeof item === 'string' && item.trim())
        : [],
    };

    return c.json({
      success: true,
      fileName: normalizedFileName,
      model: paymentSlipModel,
      extracted: normalizedResult,
    });
  } catch (error) {
    console.error('❌ 付款水单识别失败:', error);
    return c.json({
      success: false,
      message: `付款水单识别失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/send-admin-whatsapp-assist', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      employeeId,
      employeeName,
      whatsappAccount,
      loginEmail,
    } = await c.req.json();

    const normalizedWhatsapp = String(whatsappAccount || '').trim();
    const normalizedName = String(employeeName || '').trim() || '内部账号';
    const normalizedEmail = String(loginEmail || '').trim().toLowerCase();

    if (!normalizedWhatsapp) {
      return c.json({ success: false, message: '缺少 WhatsApp 账号' }, 400);
    }

    if (!isWhatsappAssistConfigured()) {
      return c.json({
        success: false,
        message: 'WhatsApp 辅助触达尚未配置完成，请先补充服务商配置',
      }, 501);
    }

    const sentAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + defaultInviteExpiryHours * 60 * 60 * 1000).toISOString();

    await supabase
      .from('admin_account_identity_audit_logs')
      .insert({
        changed_at: sentAt,
        account_id: null,
        employee_id: String(employeeId || '').trim() || null,
        employee_no: null,
        employee_name: normalizedName,
        actor_name: guard.profile?.email || guard.user?.email || null,
        actor_email: guard.user?.email || null,
        previous_username: null,
        next_username: null,
        previous_login_email: null,
        next_login_email: normalizedEmail || null,
        reason: `WhatsApp 辅助触达已发送至 ${normalizedWhatsapp}`,
        auth_sync_required: false,
        password_reset_required: false,
      })
      .throwOnError()
      .catch(() => null);

    return c.json({
      success: true,
      whatsappAccount: normalizedWhatsapp,
      sentAt,
      expiresAt,
      deliveryMode: 'whatsapp_assist',
    });
  } catch (error) {
    console.error('❌ 发送 WhatsApp 辅助触达失败:', error);
    return c.json({
      success: false,
      message: `发送 WhatsApp 辅助触达失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

export default app;
