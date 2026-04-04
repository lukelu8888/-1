import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mode = String(process.argv[2] || 'plan').trim().toLowerCase()
const confirmation = String(process.env.ERP_V22_REMOTE_SAMPLE_CONFIRM || '').trim()
const marker = 'erp_v22_execution_validation_sample'
const ownerEmail = 'codex-validation@local'

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[erp-v22-execution-sample] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!['plan', 'create', 'cleanup'].includes(mode)) {
  console.error('[erp-v22-execution-sample] Mode must be one of: plan, create, cleanup')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function buildSamplePayload() {
  const stamp = new Date().toISOString()
  const compact = stamp.replace(/[-:TZ.]/g, '').slice(0, 14)
  const purchaseOrderId = randomUUID()
  const poNumber = `CG-VALIDATION-${compact}`

  return {
    purchaseOrder: {
      id: purchaseOrderId,
      po_number: poNumber,
      supplier_code: 'VALIDATION',
      supplier_name: 'ERP V2.2 Validation Sample',
      supplier_email: ownerEmail,
      items: [
        {
          sku: 'ERP-V22-VALIDATION',
          description: 'Execution governance validation sample',
          quantity: 1,
          unit_price: 1,
        },
      ],
      total_amount: 1,
      currency: 'USD',
      payment_mode: 'deposit_plus_lc',
      notes: marker,
      owner_email: ownerEmail,
      owner_name: 'Codex Validation',
      owner_role: 'system',
    },
    execution: {
      purchase_order_id: purchaseOrderId,
      execution_status: 'sampling',
      sample_required: true,
      lc_type: 'usance',
      lc_discrepancy_status: 'open',
      lc_discrepancy_notes: 'Validation discrepancy sample',
      lc_discrepancy_recorded_at: stamp,
      lc_discrepancy_recorded_by: ownerEmail,
      lc_discrepancy_approval_status: 'pending',
      lc_discrepancy_approval_requested_at: stamp,
      lc_discrepancy_approval_requested_by: ownerEmail,
      seal_status: 'invalidated',
      sealed_sample_ref: `SEAL-${compact}`,
      sealed_sample_uploaded_at: stamp,
      sealed_sample_uploaded_by: ownerEmail,
      seal_invalidated_at: stamp,
      seal_invalidated_by: ownerEmail,
      seal_invalidated_reason: 'Validation sample for ERP V2.2 governance checks',
      remarks: marker,
    },
  }
}

async function plan() {
  const payload = buildSamplePayload()
  const existing = await supabase
    .from('purchase_orders')
    .select('id,po_number,notes,created_at')
    .eq('notes', marker)
  if (existing.error) throw existing.error

  console.log(JSON.stringify({
    mode: 'plan',
    marker,
    remoteExistingSamples: existing.data || [],
    proposedSample: payload,
    createRequires: 'ERP_V22_REMOTE_SAMPLE_CONFIRM=CREATE_REMOTE_SAMPLE',
    cleanupRequires: 'ERP_V22_REMOTE_SAMPLE_CONFIRM=DELETE_REMOTE_SAMPLE',
  }, null, 2))
}

async function create() {
  if (confirmation !== 'CREATE_REMOTE_SAMPLE') {
    console.error('[erp-v22-execution-sample] Refusing remote write without ERP_V22_REMOTE_SAMPLE_CONFIRM=CREATE_REMOTE_SAMPLE')
    process.exit(1)
  }

  const payload = buildSamplePayload()
  const { error: purchaseOrderError } = await supabase.from('purchase_orders').insert(payload.purchaseOrder)
  if (purchaseOrderError) throw purchaseOrderError

  const { error: executionError } = await supabase.from('purchase_order_execution').insert(payload.execution)
  if (executionError) throw executionError

  console.log(JSON.stringify({
    mode: 'create',
    createdPurchaseOrderId: payload.purchaseOrder.id,
    createdPoNumber: payload.purchaseOrder.po_number,
    marker,
  }, null, 2))
}

async function cleanup() {
  if (confirmation !== 'DELETE_REMOTE_SAMPLE') {
    console.error('[erp-v22-execution-sample] Refusing remote cleanup without ERP_V22_REMOTE_SAMPLE_CONFIRM=DELETE_REMOTE_SAMPLE')
    process.exit(1)
  }

  const { data: rows, error: lookupError } = await supabase
    .from('purchase_orders')
    .select('id,po_number')
    .eq('notes', marker)

  if (lookupError) throw lookupError

  const purchaseOrderIds = (rows || []).map((row) => row.id)
  if (purchaseOrderIds.length > 0) {
    const { error: executionDeleteError } = await supabase
      .from('purchase_order_execution')
      .delete()
      .in('purchase_order_id', purchaseOrderIds)
    if (executionDeleteError) throw executionDeleteError

    const { error: poDeleteError } = await supabase
      .from('purchase_orders')
      .delete()
      .in('id', purchaseOrderIds)
    if (poDeleteError) throw poDeleteError
  }

  console.log(JSON.stringify({
    mode: 'cleanup',
    removedPurchaseOrderIds: purchaseOrderIds,
    marker,
  }, null, 2))
}

async function main() {
  if (mode === 'plan') return plan()
  if (mode === 'create') return create()
  return cleanup()
}

main().catch((error) => {
  console.error('[erp-v22-execution-sample] failed:', error?.message || error)
  process.exit(1)
})
