import type { FollowUpAction, TodoPriority, TodoType } from './salesTodoCenterService'

export const SALES_TODO_TYPE_LABELS: Record<TodoType, string> = {
  ing_new: '新ING',
  ing_clarify: 'ING澄清',
  qr_waiting_cost: '待采购回传',
  qt_send: '待发QT',
  qt_customer_feedback: '待客户反馈',
  qt_negotiating: '报价协商',
  sc_sign: '待签SC',
  sc_deposit: '待定金',
  inspection_method: '验货方式',
  third_party_inspection: '第三方验货/监装',
  payment_followup: '付款跟进',
  balance_tt_chase: '尾款催收',
  lc_open_chase: 'L/C 开立催办',
  lc_terms_confirm: 'L/C 条款/交单',
  bl_copy_send: '提单副本/见单催款',
  dp_redemption_chase: 'D/P 赎单催办',
  da_acceptance_chase: 'D/A 承兑催办',
  da_maturity_chase: 'D/A 到期催款',
  oa_period_warning: 'O/A 账期预警',
  oa_overdue_chase: 'O/A 逾期催收',
  freight_confirmation: '海运费/船期',
  arrival_confirmation: '到港确认',
  clearance_docs: '清关资料',
  receipt_confirmation: '收货确认',
  feedback_followup: '反馈回访',
}

export const SALES_TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  overdue: '已超期',
  high: '高',
  medium: '中',
  normal: '正常',
}

export const SALES_TODO_ACTION_LABELS: Record<FollowUpAction, string> = {
  contacted: '已联系客户',
  sent_qt: '已发 QT',
  chased_contract: '已催合同',
  chased_deposit: '已催定金',
  shared_report: '已发验货报告',
  chased_payment: '已催付款',
  notified_arrival: '已通知到港',
  requested_clearance_docs: '已催清关资料',
  confirmed_receipt: '已确认收货',
  invited_feedback: '已邀请反馈',
  scheduled: '约下次跟进',
}

const TODO_ACTION_SCHEMA: Record<TodoType, FollowUpAction[]> = {
  ing_new: ['contacted', 'scheduled'],
  ing_clarify: ['contacted', 'scheduled'],
  qr_waiting_cost: ['contacted', 'scheduled'],
  qt_send: ['sent_qt', 'scheduled'],
  qt_customer_feedback: ['contacted', 'scheduled'],
  qt_negotiating: ['contacted', 'scheduled'],
  sc_sign: ['chased_contract', 'scheduled'],
  sc_deposit: ['chased_deposit', 'chased_payment', 'scheduled'],
  inspection_method: ['contacted', 'scheduled'],
  third_party_inspection: ['shared_report', 'scheduled'],
  payment_followup: ['chased_payment', 'scheduled'],
  balance_tt_chase: ['chased_payment', 'scheduled'],
  lc_open_chase: ['contacted', 'scheduled'],
  lc_terms_confirm: ['contacted', 'shared_report', 'scheduled'],
  bl_copy_send: ['contacted', 'chased_payment', 'scheduled'],
  dp_redemption_chase: ['chased_payment', 'scheduled'],
  da_acceptance_chase: ['chased_payment', 'scheduled'],
  da_maturity_chase: ['chased_payment', 'scheduled'],
  oa_period_warning: ['chased_payment', 'scheduled'],
  oa_overdue_chase: ['chased_payment', 'scheduled'],
  freight_confirmation: ['contacted', 'scheduled'],
  arrival_confirmation: ['notified_arrival', 'scheduled'],
  clearance_docs: ['requested_clearance_docs', 'scheduled'],
  receipt_confirmation: ['confirmed_receipt', 'scheduled'],
  feedback_followup: ['invited_feedback', 'scheduled'],
}

const TODO_COLLABORATION_HINTS: Partial<Record<TodoType, string[]>> = {
  qr_waiting_cost: ['Procurement'],
  sc_sign: ['Customer'],
  sc_deposit: ['Finance'],
  inspection_method: ['QC'],
  third_party_inspection: ['QC', 'Supplier'],
  lc_open_chase: ['Finance', 'Customer'],
  lc_terms_confirm: ['Documentation_Officer', 'Finance'],
  dp_redemption_chase: ['Finance'],
  da_acceptance_chase: ['Finance'],
  da_maturity_chase: ['Finance'],
  oa_period_warning: ['Finance'],
  oa_overdue_chase: ['Finance'],
  freight_confirmation: ['Order_Coordinator'],
  arrival_confirmation: ['Order_Coordinator'],
  clearance_docs: ['Documentation_Officer'],
  receipt_confirmation: ['Order_Coordinator'],
  feedback_followup: ['Marketing_Ops'],
}

export function getSalesTodoActionOptions(type: TodoType): FollowUpAction[] {
  return TODO_ACTION_SCHEMA[type] || ['contacted', 'scheduled']
}

export function getSalesTodoDefaultAction(type: TodoType): FollowUpAction {
  return getSalesTodoActionOptions(type)[0] || 'contacted'
}

export function getSalesTodoCollaborationHints(type: TodoType): string[] {
  return TODO_COLLABORATION_HINTS[type] || []
}
