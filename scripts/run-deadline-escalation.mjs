import { createClient } from '@supabase/supabase-js';

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const isDryRun = isTruthy(process.env.DEADLINE_ESCALATION_DRY_RUN);
const useFixture = isTruthy(process.env.DEADLINE_ESCALATION_USE_FIXTURE);
const retryCount = Math.max(0, Number(process.env.DEADLINE_ESCALATION_RETRY_COUNT || 2));
const dedupeHours = Math.max(1, Number(process.env.DEADLINE_ESCALATION_DEDUPE_HOURS || 12));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const requireSupabase = !useFixture;

if (requireSupabase && (!supabaseUrl || !supabaseServiceRoleKey)) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = requireSupabase
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const HOURS = 1000 * 60 * 60;
const DAYS = HOURS * 24;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeRegion = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'NORTH AMERICA') return 'NA';
  if (raw === 'SOUTH AMERICA') return 'SA';
  if (raw === 'EUROPE & AFRICA' || raw === 'EMEA') return 'EA';
  return raw;
};

const parseDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : ts;
};

const hoursSince = (value, now) => {
  const parsed = parseDate(value);
  if (parsed == null) return null;
  return Math.floor((now - parsed) / HOURS);
};

const daysUntil = (value, now) => {
  const parsed = parseDate(value);
  if (parsed == null) return null;
  return Math.ceil((parsed - now) / DAYS);
};

const isCompletedStatus = (value) => {
  const status = String(value || '').trim().toLowerCase();
  return ['completed', 'closed', 'paid', 'released', 'archived', 'finance_confirmed', 'balance_paid'].includes(status);
};

const buildMessage = (item) => {
  const dueText = item.dueAt ? `，节点时间：${item.dueAt}` : '';
  const overdueText = item.overdueHours != null ? `，已偏离 ${item.overdueHours}h` : '';
  return `${item.title}${dueText}${overdueText}`;
};

const buildRuleSummary = (items) => items.reduce((summary, item) => {
  summary[item.type] += 1;
  return summary;
}, {
  ing_first_response_overdue: 0,
  qt_feedback_overdue: 0,
  sc_unsigned_overdue: 0,
  sc_deposit_overdue: 0,
  oa_due_warning: 0,
  da_maturity_warning: 0,
  usance_lc_maturity_warning: 0,
});

function buildFixtureSnapshot() {
  const now = Date.now();
  return {
    inquiries: [
      {
        id: 'ing-fixture-1',
        inquiry_number: 'ING-NA-FIXTURE-0001',
        status: 'submitted',
        submitted_at: new Date(now - 30 * HOURS).toISOString(),
        assigned_to: 'sales.rep.fixture@cosunchina.com',
        region_code: 'NA',
      },
    ],
    quotations: [
      {
        id: 'qt-fixture-1',
        qt_number: 'QT-NA-FIXTURE-0001',
        customer_status: 'sent',
        sent_to_customer_at: new Date(now - 9 * DAYS).toISOString(),
        sales_person_email: 'sales.rep.fixture@cosunchina.com',
      },
    ],
    contracts: [
      {
        id: 'sc-fixture-1',
        contract_number: 'SC-NA-FIXTURE-0001',
        sent_to_customer_at: new Date(now - 4 * DAYS).toISOString(),
        buyer_signature: null,
        sales_person: 'sales.rep.fixture@cosunchina.com',
        customer_company: 'Fixture Customer',
      },
    ],
    purchaseOrders: [
      {
        id: 'po-fixture-1',
        po_number: 'CG-NA-FIXTURE-0001',
        payment_mode: 'deposit_plus_lc',
        expected_delivery_date: new Date(now - 6 * DAYS).toISOString(),
        owner_email: 'sales.rep.fixture@cosunchina.com',
        purchase_order_execution: {
          customer_balance_status: 'pending',
          lc_type: 'usance',
          lc_maturity_date: new Date(now + 4 * DAYS).toISOString(),
        },
      },
      {
        id: 'po-fixture-2',
        po_number: 'CG-NA-FIXTURE-0002',
        payment_mode: 'oa',
        expected_delivery_date: new Date(now + 3 * DAYS).toISOString(),
        owner_email: 'sales.rep.fixture@cosunchina.com',
        purchase_order_execution: {
          customer_balance_status: 'pending',
        },
      },
    ],
    staff: [
      { email: 'salesmanager-na@cosunchina.com', name: 'Fixture Manager', rbac_role: 'Regional_Manager', region: 'NA' },
      { email: 'finance.fixture@cosunchina.com', name: 'Fixture Finance', rbac_role: 'Finance', region: 'NA' },
    ],
  };
}

async function loadWorkflowRows() {
  if (useFixture) {
    return buildFixtureSnapshot();
  }

  const [
    inquiryResult,
    quotationResult,
    contractResult,
    purchaseOrderResult,
    staffResult,
  ] = await Promise.all([
    supabase
      .from('inquiries')
      .select('id,inquiry_number,status,submitted_at,created_at,assigned_to,owner_email,user_email,region_code'),
    supabase
      .from('sales_quotations')
      .select('id,qt_number,customer_status,sent_to_customer_at,sent_at,owner_email,customer_email'),
    supabase
      .from('sales_contracts')
      .select('id,contract_number,sent_to_customer_at,submitted_at,buyer_signature,sales_person,customer_company'),
    supabase
      .from('purchase_orders')
      .select('id,po_number,payment_mode,owner_email,purchase_order_execution(customer_balance_status,acceptance_maturity_date,lc_type,lc_maturity_date)'),
    supabase
      .from('user_profiles')
      .select('email,name,rbac_role,region')
      .in('rbac_role', ['Regional_Manager', 'Finance']),
  ]);

  const firstError = inquiryResult.error || quotationResult.error || contractResult.error || purchaseOrderResult.error || staffResult.error;
  if (firstError) {
    console.error('Failed to load workflow rows:', firstError);
    process.exit(1);
  }

  return {
    inquiries: inquiryResult.data || [],
    quotations: quotationResult.data || [],
    contracts: contractResult.data || [],
    purchaseOrders: purchaseOrderResult.data || [],
    staff: staffResult.data || [],
  };
}

function deriveItems(snapshot, now = Date.now()) {
  const items = [];

  snapshot.inquiries.forEach((inquiry) => {
    const overdueHours = hoursSince(inquiry.submitted_at || inquiry.created_at, now);
    const status = String(inquiry.status || '').trim().toLowerCase();
    if (overdueHours != null && overdueHours >= 24 && !['quoted', 'closed', 'completed'].includes(status)) {
      items.push({
        key: `ing-${inquiry.id || inquiry.inquiry_number}`,
        type: 'ing_first_response_overdue',
        title: `${inquiry.inquiry_number || inquiry.id} 超过 24h 未首响`,
        owner: inquiry.assigned_to || inquiry.owner_email || inquiry.user_email || null,
        relatedNumber: inquiry.inquiry_number || null,
        region: inquiry.region_code || null,
        dueAt: inquiry.submitted_at || inquiry.created_at || null,
        overdueHours,
      });
    }
  });

  snapshot.quotations.forEach((quotation) => {
    const sentAt = quotation.sent_to_customer_at || quotation.sent_at;
    const overdueHours = hoursSince(sentAt, now);
    const customerStatus = String(quotation.customer_status || '').trim().toLowerCase();
    if (overdueHours != null && overdueHours >= 24 * 7 && !['accepted', 'rejected', 'closed'].includes(customerStatus)) {
      items.push({
        key: `qt-${quotation.id || quotation.qt_number}`,
        type: 'qt_feedback_overdue',
        title: `${quotation.qt_number || quotation.id} 超过 7 天未反馈`,
        owner: quotation.owner_email || quotation.customer_email || null,
        relatedNumber: quotation.qt_number || null,
        region: null,
        dueAt: sentAt || null,
        overdueHours,
      });
    }
  });

  snapshot.contracts.forEach((contract) => {
    const sentAt = contract.sent_to_customer_at || contract.submitted_at;
    const overdueHours = hoursSince(sentAt, now);
    const signed = Boolean(contract.buyer_signature);
    if (overdueHours != null && overdueHours >= 24 * 3 && !signed) {
      items.push({
        key: `sc-${contract.id || contract.contract_number}`,
        type: 'sc_unsigned_overdue',
        title: `${contract.contract_number || contract.id} 超过 3 天未签回`,
        owner: contract.sales_person || null,
        relatedNumber: contract.contract_number || null,
        region: null,
        dueAt: sentAt || null,
        overdueHours,
      });
    }
  });

  snapshot.purchaseOrders.forEach((order) => {
    const poNumber = String(order.po_number || '');
    if (!poNumber.startsWith('CG-')) return;
    const execution = Array.isArray(order.purchase_order_execution) ? order.purchase_order_execution[0] : order.purchase_order_execution || {};
    const paymentMode = String(order.payment_mode || '').trim().toLowerCase();
    const customerBalanceStatus = String(execution.customer_balance_status || '').trim().toLowerCase();
    const expectedDate =
      order.expected_delivery_date ||
      order.expected_date ||
      execution.expected_delivery_date ||
      null;
    const overdueHours = hoursSince(expectedDate, now);
    const daysToExpected = daysUntil(expectedDate, now);
    const maturityDate = execution.acceptance_maturity_date || execution.lc_maturity_date;
    const daysToMaturity = daysUntil(maturityDate, now);

    if (
      ['tt_deposit_balance_before_shipment', 'tt_deposit_balance_against_bl', 'deposit_plus_lc'].includes(paymentMode) &&
      overdueHours != null &&
      overdueHours >= 24 * 5 &&
      !['finance_confirmed', 'paid', 'balance_paid'].includes(customerBalanceStatus)
    ) {
      items.push({
        key: `sc-deposit-${order.id || poNumber}`,
        type: 'sc_deposit_overdue',
        title: `${poNumber} 定金/余款超期未确认`,
        owner: order.owner_email || null,
        relatedNumber: poNumber,
        region: null,
        dueAt: expectedDate || null,
        overdueHours,
      });
    }

    if (paymentMode === 'oa' && daysToExpected != null && daysToExpected >= 0 && daysToExpected <= 7 && !isCompletedStatus(customerBalanceStatus)) {
      items.push({
        key: `oa-${order.id || poNumber}`,
        type: 'oa_due_warning',
        title: `${poNumber} O/A 账期临近到期`,
        owner: order.owner_email || null,
        relatedNumber: poNumber,
        region: null,
        dueAt: expectedDate || null,
        overdueHours: null,
      });
    }

    if (paymentMode === 'da' && daysToMaturity != null && daysToMaturity >= 0 && daysToMaturity <= 3) {
      items.push({
        key: `da-${order.id || poNumber}`,
        type: 'da_maturity_warning',
        title: `${poNumber} D/A 承兑即将到期`,
        owner: order.owner_email || null,
        relatedNumber: poNumber,
        region: null,
        dueAt: maturityDate || null,
        overdueHours: null,
      });
    }

    if (String(execution.lc_type || '').trim().toLowerCase() === 'usance' && daysToMaturity != null && daysToMaturity >= 0 && daysToMaturity <= 5) {
      items.push({
        key: `usance-${order.id || poNumber}`,
        type: 'usance_lc_maturity_warning',
        title: `${poNumber} Usance L/C 即将到期`,
        owner: order.owner_email || null,
        relatedNumber: poNumber,
        region: null,
        dueAt: maturityDate || null,
        overdueHours: null,
      });
    }
  });

  return items;
}

function resolveRecipients(item, staff) {
  const recipients = new Set();
  const owner = normalizeEmail(item.owner);
  if (owner) recipients.add(owner);

  if (['ing_first_response_overdue', 'qt_feedback_overdue', 'sc_unsigned_overdue', 'sc_deposit_overdue'].includes(item.type)) {
    const manager = staff.find((row) => row.rbac_role === 'Regional_Manager' && normalizeRegion(row.region) === normalizeRegion(item.region));
    const managerEmail = normalizeEmail(manager?.email);
    if (managerEmail) recipients.add(managerEmail);
  }

  if (['oa_due_warning', 'da_maturity_warning', 'usance_lc_maturity_warning', 'sc_deposit_overdue'].includes(item.type)) {
    staff
      .filter((row) => row.rbac_role === 'Finance')
      .map((row) => normalizeEmail(row.email))
      .filter(Boolean)
      .forEach((email) => recipients.add(email));
  }

  return Array.from(recipients);
}

async function hasRecentDuplicate(notification) {
  if (useFixture) return false;

  const since = new Date(Date.now() - dedupeHours * HOURS).toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('recipient_email', notification.recipient_email)
    .eq('type', notification.type)
    .eq('related_id', notification.related_id)
    .gte('created_at', since)
    .limit(1);

  if (error) {
    console.warn('[deadline-escalation] duplicate check failed:', error.message);
    return false;
  }
  return Boolean(data?.length);
}

async function insertNotificationWithRetry(notification) {
  if (isDryRun) {
    return { ok: true, dryRun: true };
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const { error } = await supabase.from('notifications').insert(notification);
    if (!error) {
      return { ok: true, attempts: attempt + 1 };
    }
    lastError = error;
    console.warn(`[deadline-escalation] enqueue attempt ${attempt + 1} failed:`, error.message);
  }

  return { ok: false, error: lastError };
}

const main = async () => {
  const snapshot = await loadWorkflowRows();
  const items = deriveItems(snapshot);
  let enqueued = 0;
  let deduped = 0;
  let dryRunCount = 0;
  const dispatchResults = [];
  const failures = [];

  for (const item of items) {
    const recipients = resolveRecipients(item, snapshot.staff);
    for (const recipient of recipients) {
      const notification = {
        recipient_email: recipient,
        title: item.title,
        message: buildMessage(item),
        type: `deadline_${item.type}`,
        related_id: item.relatedNumber || item.key,
        related_type: 'deadline_escalation',
        is_read: false,
      };

      if (await hasRecentDuplicate(notification)) {
        deduped += 1;
        dispatchResults.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          status: 'deduped',
          notificationType: notification.type,
          referenceId: notification.related_id,
        });
        continue;
      }

      const result = await insertNotificationWithRetry(notification);
      if (!result.ok) {
        failures.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          stage: 'enqueue',
          errorMessage: result.error?.message || 'unknown error',
        });
        dispatchResults.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          status: 'failed',
          notificationType: notification.type,
          referenceId: notification.related_id,
          errorMessage: result.error?.message || 'unknown error',
        });
        continue;
      }

      if (result.dryRun) {
        dryRunCount += 1;
        dispatchResults.push({
          itemKey: item.key,
          itemType: item.type,
          recipientEmail: recipient,
          status: 'dry_run',
          notificationType: notification.type,
          referenceId: notification.related_id,
        });
        continue;
      }

      enqueued += 1;
      dispatchResults.push({
        itemKey: item.key,
        itemType: item.type,
        recipientEmail: recipient,
        status: 'enqueued',
        notificationType: notification.type,
        referenceId: notification.related_id,
      });
    }
  }

  const summary = {
    dryRun: isDryRun,
    useFixture,
    dedupeHours,
    retryCount,
    scanned: items.length,
    enqueued,
    deduped,
    dryRunCount,
    items,
    ruleSummary: buildRuleSummary(items),
    dispatchResults,
    failures,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!isDryRun && failures.length > 0) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
