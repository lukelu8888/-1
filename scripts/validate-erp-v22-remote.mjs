import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const shouldInsertAuditSample = ['1', 'true', 'yes', 'on'].includes(String(process.env.ERP_V22_INSERT_AUDIT_SAMPLE || '').trim().toLowerCase())

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[erp-v22-validate] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function countBy(rows, field) {
  return (rows || []).reduce((acc, row) => {
    const key = String(row?.[field] || 'null')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

async function fetchAll(table, select, filters = []) {
  let query = supabase.from(table).select(select)
  for (const applyFilter of filters) {
    query = applyFilter(query)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function fetchExactCount(table, select = 'id', filters = []) {
  let query = supabase.from(table).select(select, { count: 'exact', head: true })
  for (const applyFilter of filters) {
    query = applyFilter(query)
  }
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function insertAuditSample() {
  const stamp = new Date().toISOString()
  const entityId = randomUUID()
  const payload = {
    entity_type: 'erp_v22_environment_validation',
    entity_id: entityId,
    actor_id: null,
    actor_email: 'codex-validation@local',
    actor_role: 'system',
    action: 'update',
    changed_fields: {
      validation_run_at: {
        before: null,
        after: stamp,
      },
    },
    source: 'erp_v22_validation',
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(payload)
    .select('id,entity_type,entity_id,source,created_at')
    .single()

  if (error) throw error
  return data
}

async function main() {
  const [
    qtRows,
    scRows,
    poExecutionRows,
    approvedQtMissing,
    activeScMissing,
    auditLogCountBefore,
  ] = await Promise.all([
    fetchAll('sales_quotations', 'id,qt_type,approval_status,qt_last_approval_at'),
    fetchAll('sales_contracts', 'id,sc_type,status,sc_last_approval_at'),
    fetchAll('purchase_order_execution', 'id,seal_status,lc_discrepancy_status,lc_discrepancy_approval_status'),
    fetchExactCount('sales_quotations', 'id', [
      (query) => query.eq('approval_status', 'approved'),
      (query) => query.is('qt_last_approval_at', null),
    ]),
    fetchExactCount('sales_contracts', 'id', [
      (query) => query.in('status', ['approved', 'sent', 'customer_confirmed', 'production', 'shipped', 'completed']),
      (query) => query.is('sc_last_approval_at', null),
    ]),
    fetchExactCount('audit_logs'),
  ])

  let auditSample = null
  let auditLogCountAfter = auditLogCountBefore

  if (shouldInsertAuditSample) {
    auditSample = await insertAuditSample()
    auditLogCountAfter = await fetchExactCount('audit_logs')
  }

  const summary = {
    validatedAt: new Date().toISOString(),
    qt: {
      rows: qtRows.length,
      typeCounts: countBy(qtRows, 'qt_type'),
      approvedMissingLastApprovalAt: approvedQtMissing,
    },
    sc: {
      rows: scRows.length,
      typeCounts: countBy(scRows, 'sc_type'),
      activeMissingLastApprovalAt: activeScMissing,
    },
    purchaseOrderExecution: {
      rows: poExecutionRows.length,
      sealStatusCounts: countBy(poExecutionRows, 'seal_status'),
      lcDiscrepancyStatusCounts: countBy(poExecutionRows, 'lc_discrepancy_status'),
      lcDiscrepancyApprovalCounts: countBy(poExecutionRows, 'lc_discrepancy_approval_status'),
    },
    auditLogs: {
      countBefore: auditLogCountBefore,
      countAfter: auditLogCountAfter,
      insertedSample: auditSample,
    },
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[erp-v22-validate] failed:', error?.message || error)
  process.exit(1)
})
