/**
 * 🔄 业务流程引擎 V2
 * 基于5阶段21步骤的客户询价到合同完整流程
 * 支持74个触发器的自动化执行
 */

import { sendNotificationToUser } from '../contexts/NotificationContext';

// ===== 工作流上下文接口 =====
export interface WorkflowContext {
  // 单据编号
  inquiry_number?: string;
  quotation_number?: string;
  contract_number?: string;
  order_number?: string;
  po_number?: string;
  supplier_inquiry_number?: string;
  
  // 金额相关
  quotation_amount?: number;
  quotation_currency?: string;
  total_amount?: number;
  cost_price?: number;
  suggested_selling_price?: number;
  profit_margin?: number;
  unit_price?: number;
  revised_price?: number;
  contract_total_amount?: number;
  target_price?: number;
  price_gap?: string;
  
  // 人员信息
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  sales_rep_name?: string;
  sales_rep_email?: string;
  regional_manager_name?: string;
  regional_manager_email?: string;
  sales_director_name?: string;
  sales_director_email?: string;
  admin_finance_name?: string;
  admin_finance_email?: string;
  supplier_name?: string;
  supplier_email?: string;
  
  // 数量和时间
  product_count?: number;
  quantity?: number;
  moq?: string;
  lead_time?: string;
  urgency_level?: string;
  expected_response_time?: string;
  response_deadline?: string;
  validity_period?: string;
  view_time?: string;
  submission_date?: string;
  
  // 地址和背景
  shipping_address?: string;
  customer_background?: string;
  
  // 审批相关
  approval_status?: 'approved' | 'rejected';
  approval_comments?: string;
  risk_assessment?: string;
  strategic_value?: string;
  contract_approval_status?: 'approved' | 'rejected';
  review_comments?: string;
  risk_notes?: string;
  
  // 反馈相关
  feedback_type?: 'accepted' | 'negotiate' | 'rejected';
  feedback_comments?: string;
  rejection_reason?: string;
  follow_up_notes?: string;
  future_opportunity?: string;
  competitor_info?: string;
  
  // 议价相关
  negotiation_decision?: 'accept' | 'reject';
  justification?: string;
  
  // 合同相关
  contract_terms?: string;
  special_clauses?: string;
  payment_schedule?: string;
  delivery_schedule?: string;
  payment_terms?: string;
  delivery_terms?: string;
  
  // 修订相关
  revision_notes?: string;
  revised_quotation_amount?: number;
  revision_reason?: string;
  revision_summary?: string;
  revised_contract_terms?: string;
  
  // 供应商相关
  supplier_list?: string;
  inquiry_details?: string;
  notes?: string;
  
  // 行动计划
  action_plan?: 'generate_contract' | 'escalate_negotiation' | 'follow_up_rejection';
  
  // 区域
  region?: string;
  
  // 时间戳
  timestamp?: string;
  
  // 扩展字段
  [key: string]: any;
}

// ===== 触发器接口 =====
interface Trigger {
  type: 'notification' | 'conditional_notification' | 'status_change';
  recipients?: string[];
  message?: string;
  title?: string;
  target?: string;
  new_status?: string;
  display?: string;
  condition?: string; // 用于条件触发器
}

// ===== 步骤接口 =====
interface WorkflowStep {
  id: string;
  action: string;
  description: string;
  actor: string;
  required_fields: string[];
  triggers: Trigger[];
  next_steps: string[];
}

// ===== 阶段接口 =====
interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  steps: WorkflowStep[];
}

// ===== 完整的5阶段21步骤工作流配置 =====
const INQUIRY_TO_CONTRACT_WORKFLOW: WorkflowStage[] = [
  // 阶段 1️⃣：📋 询价阶段（6个步骤）
  {
    id: "inquiry_stage",
    name: "📋 询价阶段",
    description: "客户发起询价，内部协调获取成本底价",
    order: 1,
    steps: [
      {
        id: "customer_inquiry",
        action: "客户发送询价单",
        description: "客户通过Customer Portal提交产品询价单，填写产品需求、数量、交期等信息",
        actor: "customer",
        required_fields: ["product_list", "quantity", "delivery_date", "shipping_address"],
        triggers: [
          {
            type: "notification",
            recipients: ["sales_rep"],
            message: "新询价单提交: {inquiry_number} - 客户: {customer_name}",
            title: "📋 新询价单"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "新询价单待处理: {inquiry_number} - 产品数量: {product_count}",
            title: "📋 新询价单通知"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "submitted",
            display: "已提交"
          }
        ],
        next_steps: ["system_distribute_inquiry"]
      },
      {
        id: "system_distribute_inquiry",
        action: "系统自动分发询价单",
        description: "系统同时通知Admin财务和对应区域的业务员，确保双方及时获知客户需求",
        actor: "system",
        required_fields: [],
        triggers: [
          {
            type: "notification",
            recipients: ["sales_rep", "regional_manager"],
            message: "询价单已分配给您的区域: {inquiry_number} - 紧急程度: {urgency_level}",
            title: "🎯 询价单分配"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "请关注新询价单并准备成本分析: {inquiry_number}",
            title: "💼 询价单待分析"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "distributed",
            display: "已分发"
          }
        ],
        next_steps: ["sales_remind_finance"]
      },
      {
        id: "sales_remind_finance",
        action: "区域业务员提醒财务报价",
        description: "区域业务员查看询价单后，向财务部门发送报价提醒，注明紧急程度和客户背景",
        actor: "sales_rep",
        required_fields: ["urgency_level", "customer_background", "expected_response_time"],
        triggers: [
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "紧急报价请求: {inquiry_number} - 客户背景: {customer_background} - 期望响应: {expected_response_time}",
            title: "⚡ 报价提醒"
          },
          {
            type: "notification",
            recipients: ["regional_manager"],
            message: "业务员已向财务发送报价提醒: {inquiry_number}",
            title: "📊 流程进度更新"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "pending_finance_quote",
            display: "财务报价处理中"
          }
        ],
        next_steps: ["finance_generate_supplier_inquiry"]
      },
      {
        id: "finance_generate_supplier_inquiry",
        action: "财务生成工厂询价单",
        description: "Admin财务根据客户需求，创建并发送工厂询价单给对应供应商",
        actor: "admin_finance",
        required_fields: ["supplier_list", "inquiry_details", "response_deadline"],
        triggers: [
          {
            type: "notification",
            recipients: ["supplier"],
            message: "新工厂询价单: {supplier_inquiry_number} - 截止日期: {response_deadline}",
            title: "📦 工厂询价单"
          },
          {
            type: "notification",
            recipients: ["sales_rep"],
            message: "财务已向供应商发送询价: {inquiry_number} - 预计响应: {response_deadline}",
            title: "✅ 采购询价已发送"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "supplier_inquiry_sent",
            display: "采购询价中"
          }
        ],
        next_steps: ["supplier_feedback_inquiry"]
      },
      {
        id: "supplier_feedback_inquiry",
        action: "工厂反馈询价单",
        description: "供应商通过Supplier Portal查看询价单，提交报价和交期信息",
        actor: "supplier",
        required_fields: ["unit_price", "moq", "lead_time", "payment_terms"],
        triggers: [
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "供应商报价已提交: {supplier_inquiry_number} - 单价: {unit_price}, MOQ: {moq}, 交期: {lead_time}",
            title: "📊 供应商报价"
          },
          {
            type: "notification",
            recipients: ["sales_rep"],
            message: "供应商已反馈报价，财务正在分析成本: {inquiry_number}",
            title: "⏳ 成本分析进行中"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "supplier_quote_received",
            display: "供应商已报价"
          }
        ],
        next_steps: ["finance_provide_cost"]
      },
      {
        id: "finance_provide_cost",
        action: "财务提供成本底价",
        description: "财务汇总供应商报价，计算成本底价和建议售价，发送给区域业务员",
        actor: "admin_finance",
        required_fields: ["cost_price", "suggested_selling_price", "profit_margin", "notes"],
        triggers: [
          {
            type: "notification",
            recipients: ["sales_rep"],
            message: "财务已提供成本价和利润率指导: {inquiry_number}",
            title: "💰 成本底价已提供"
          },
          {
            type: "notification",
            recipients: ["sales_director"],
            message: "财务已完成成本分析: {inquiry_number} - 建议售价: {suggested_selling_price}",
            title: "📊 成本分析完成"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "cost_analysis_completed",
            display: "成本分析完成"
          }
        ],
        next_steps: ["sales_create_quotation"]
      }
    ]
  },
  
  // 阶段 2️⃣：💰 报价阶段（2个步骤）
  {
    id: "quotation_stage",
    name: "💰 报价阶段",
    description: "区域业务员创建客户报价单",
    order: 2,
    steps: [
      {
        id: "sales_create_quotation",
        action: "区域业务员创建报价单",
        description: "业务员基于成本底价，结合客户情况和市场竞争，创建客户报价单",
        actor: "sales_rep",
        required_fields: ["quoted_price", "validity_period", "payment_terms", "delivery_terms", "total_amount"],
        triggers: [
          {
            type: "notification",
            recipients: ["regional_manager"],
            message: "新报价单待审批: {quotation_number} - 总金额: {total_amount}",
            title: "📝 报价单创建"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "报价单已创建: {quotation_number} - 利润率: {profit_margin}%",
            title: "💰 报价单监控"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "draft",
            display: "草稿"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "quotation_created",
            display: "已生成报价"
          }
        ],
        next_steps: ["system_route_approval"]
      },
      {
        id: "system_route_approval",
        action: "金额自动路由审批",
        description: "系统根据报价总金额自动路由：<$20,000→区域经理，≥$20,000→销售总监",
        actor: "system",
        required_fields: ["quotation_amount", "quotation_currency"],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["regional_manager"],
            message: "报价审批请求: {quotation_number} - 金额: {quotation_amount} {quotation_currency} (< $20,000)",
            title: "📋 报价审批请求 - 区域经理",
            condition: "quotation_amount < 20000"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_director"],
            message: "报价审批请求: {quotation_number} - 金额: {quotation_amount} {quotation_currency} (≥ $20,000)",
            title: "📋 报价审批请求 - 销售总监",
            condition: "quotation_amount >= 20000"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "pending_approval",
            display: "待审批"
          }
        ],
        next_steps: ["regional_manager_review", "sales_director_review"]
      }
    ]
  },
  
  // 阶段 3️⃣：✅ 审批阶段（5个步骤）
  {
    id: "approval_stage",
    name: "✅ 审批阶段",
    description: "多级审批确保报价合理性",
    order: 3,
    steps: [
      {
        id: "regional_manager_review",
        action: "区域经理审核报价单",
        description: "区域经理审核报价单的价格合理性、利润率、付款条件等（适用于<$20,000订单）",
        actor: "regional_manager",
        required_fields: ["approval_status", "approval_comments"],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "报价单审批通过: {quotation_number} - 可发送给客户",
            title: "✅ 审批通过",
            condition: "approval_status == 'approved'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "报价单审批拒绝: {quotation_number} - 原因: {approval_comments}",
            title: "❌ 审批拒绝",
            condition: "approval_status == 'rejected'"
          },
          {
            type: "notification",
            recipients: ["sales_director"],
            message: "区域经理审批结果: {quotation_number} - 状态: {approval_status}",
            title: "📊 审批动态"
          }
        ],
        next_steps: ["approval_feedback"]
      },
      {
        id: "sales_director_review",
        action: "销售总监审核报价单",
        description: "销售总监审核大额订单（≥$20,000），评估风险和战略价值",
        actor: "sales_director",
        required_fields: ["approval_status", "risk_assessment", "strategic_value", "approval_comments"],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["sales_rep", "regional_manager"],
            message: "大额报价单审批通过: {quotation_number} - 总监批准: {strategic_value}",
            title: "✅ 总监批准",
            condition: "approval_status == 'approved'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep", "regional_manager"],
            message: "大额报价单审批拒绝: {quotation_number} - 风险评估: {risk_assessment}",
            title: "❌ 总监拒绝",
            condition: "approval_status == 'rejected'"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "大额报价审批完成: {quotation_number} - 结果: {approval_status}",
            title: "💼 大额订单审批"
          }
        ],
        next_steps: ["approval_feedback"]
      },
      {
        id: "approval_feedback",
        action: "审核结果反馈",
        description: "系统通知业务员审核结果，如果不通过需说明原因和改进建议",
        actor: "system",
        required_fields: [],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "审批结果: 通过 ✅ - 请尽快发送给客户: {quotation_number}",
            title: "🎉 审批通过通知",
            condition: "approval_status == 'approved'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "审批结果: 拒绝 ❌ - 请查看原因并修改: {quotation_number}",
            title: "📝 需要修改",
            condition: "approval_status == 'rejected'"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "feedback_sent",
            display: "反馈已发送"
          }
        ],
        next_steps: ["sales_submit_to_customer", "sales_view_rejection"]
      },
      {
        id: "sales_view_rejection",
        action: "业务员查看不通过原因",
        description: "业务员查看审批不通过的具体原因，修改报价单后重新提交审批",
        actor: "sales_rep",
        required_fields: ["revision_notes", "revised_quotation_amount"],
        triggers: [
          {
            type: "notification",
            recipients: ["regional_manager", "sales_director"],
            message: "业务员已查看拒绝原因，准备修改报价: {quotation_number}",
            title: "🔄 报价修改中"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "revising",
            display: "修改中"
          }
        ],
        next_steps: ["sales_create_quotation"]
      }
    ]
  },
  
  // 阶段 4️⃣：💬 客户反馈阶段（6个步骤）
  {
    id: "customer_feedback_stage",
    name: "💬 客户反馈阶段",
    description: "提交报价给客户并处理反馈",
    order: 4,
    steps: [
      {
        id: "sales_submit_to_customer",
        action: "区域业务员提交报价给客户",
        description: "审核通过后，业务员通过系统将报价单正式发送给客户",
        actor: "sales_rep",
        required_fields: ["quotation_pdf", "cover_email", "submission_date"],
        triggers: [
          {
            type: "notification",
            recipients: ["customer"],
            message: "您有新的报价单: {quotation_number} - 有效期至: {validity_period}",
            title: "📄 新报价单"
          },
          {
            type: "notification",
            recipients: ["regional_manager"],
            message: "报价单已发送给客户: {quotation_number} - 客户: {customer_name}",
            title: "✉️ 报价已发送"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "报价单已提交客户: {quotation_number} - 等待客户反馈",
            title: "⏳ 等待客户响应"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "sent_to_customer",
            display: "已发送客户"
          }
        ],
        next_steps: ["customer_receive_quotation"]
      },
      {
        id: "customer_receive_quotation",
        action: "客户收到Admin报价",
        description: "客户通过Customer Portal查看报价单详情，包括产品明细、价格、交期等",
        actor: "customer",
        required_fields: [],
        triggers: [
          {
            type: "notification",
            recipients: ["sales_rep"],
            message: "客户已查看报价单: {quotation_number} - 查看时间: {view_time}",
            title: "👀 客户已读"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "viewed_by_customer",
            display: "客户已查看"
          }
        ],
        next_steps: ["customer_feedback_quotation"]
      },
      {
        id: "customer_feedback_quotation",
        action: "客户反馈报价",
        description: "客户对报价进行反馈：同意、议价或拒绝，并填写具体意见",
        actor: "customer",
        required_fields: ["feedback_type", "feedback_comments"],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["sales_rep", "regional_manager"],
            message: "客户接受报价 🎉: {quotation_number} - 可生成合同",
            title: "✅ 客户接受",
            condition: "feedback_type == 'accepted'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "客户要求议价 💬: {quotation_number} - 意见: {feedback_comments}",
            title: "💰 议价请求",
            condition: "feedback_type == 'negotiate'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep", "regional_manager"],
            message: "客户拒绝报价 ❌: {quotation_number} - 原因: {feedback_comments}",
            title: "❌ 客户拒绝",
            condition: "feedback_type == 'rejected'"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "customer_responded",
            display: "客户已反馈"
          }
        ],
        next_steps: ["sales_process_feedback"]
      },
      {
        id: "sales_process_feedback",
        action: "业务员处理客户反馈",
        description: "根据客户反馈类型采取不同行动：同意→生成合同，议价→上报区域经理，拒绝→跟进了解原因",
        actor: "sales_rep",
        required_fields: ["action_plan"],
        triggers: [
          {
            type: "notification",
            recipients: ["regional_manager"],
            message: "业务员正在处理客户反馈: {quotation_number} - 行动计划: {action_plan}",
            title: "📋 反馈处理中"
          },
          {
            type: "conditional_notification",
            recipients: ["admin_finance"],
            message: "准备生成合同: {quotation_number} - 客户已接受报价",
            title: "📄 合同准备中",
            condition: "action_plan == 'generate_contract'"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "feedback_processing",
            display: "反馈处理中"
          }
        ],
        next_steps: ["sales_generate_contract", "manager_handle_negotiation", "sales_follow_rejection"]
      },
      {
        id: "manager_handle_negotiation",
        action: "区域经理处理议价",
        description: "区域经理评估客户议价要求，决定是否接受或提出折中方案",
        actor: "regional_manager",
        required_fields: ["negotiation_decision", "revised_price", "justification"],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "议价批准 ✅: {quotation_number} - 调整价格: {revised_price} - 理由: {justification}",
            title: "💰 议价批准",
            condition: "negotiation_decision == 'accept'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "议价拒绝 ❌: {quotation_number} - 理由: {justification}",
            title: "❌ 议价拒绝",
            condition: "negotiation_decision == 'reject'"
          },
          {
            type: "notification",
            recipients: ["sales_director", "admin_finance"],
            message: "议价处理完成: {quotation_number} - 决定: {negotiation_decision}",
            title: "📊 议价结果"
          }
        ],
        next_steps: ["sales_submit_to_customer"]
      },
      {
        id: "sales_follow_rejection",
        action: "业务员跟进拒绝原因",
        description: "业务员联系客户了解拒绝的具体原因，记录反馈用于后续改进",
        actor: "sales_rep",
        required_fields: ["rejection_reason", "follow_up_notes", "future_opportunity", "competitor_info", "price_gap"],
        triggers: [
          {
            type: "notification",
            recipients: ["regional_manager", "sales_director"],
            message: "客户拒绝跟进完成: {quotation_number} - 拒绝原因: {rejection_reason}",
            title: "📝 拒绝跟进报告"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "市场反馈: 客户认为价格差距: {price_gap}, 竞争对手信息: {competitor_info}",
            title: "💡 市场情报"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "closed_rejected",
            display: "已关闭-客户拒绝"
          },
          {
            type: "status_change",
            target: "inquiry",
            new_status: "closed_with_feedback",
            display: "已关闭-已记录反馈"
          }
        ],
        next_steps: []
      }
    ]
  },
  
  // 阶段 5️⃣：📄 合同阶段（5个步骤）
  {
    id: "contract_stage",
    name: "📄 合同阶段",
    description: "生成销售合同并审核",
    order: 5,
    steps: [
      {
        id: "sales_generate_contract",
        action: "生成销售合同",
        description: "系统根据确认的报价单自动生成销售合同，业务员可补充特殊条款",
        actor: "sales_rep",
        required_fields: ["contract_terms", "special_clauses", "payment_schedule", "delivery_schedule"],
        triggers: [
          {
            type: "notification",
            recipients: ["regional_manager"],
            message: "新合同待审核: {contract_number} - 基于报价: {quotation_number}",
            title: "📄 合同待审核"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "合同已生成: {contract_number} - 付款计划: {payment_schedule}",
            title: "💼 合同生成通知"
          },
          {
            type: "notification",
            recipients: ["sales_director"],
            message: "合同已创建: {contract_number} - 总金额: {contract_total_amount}",
            title: "📊 合同监控"
          },
          {
            type: "status_change",
            target: "contract",
            new_status: "draft",
            display: "合同草稿"
          },
          {
            type: "status_change",
            target: "quotation",
            new_status: "converted_to_contract",
            display: "已转合同"
          }
        ],
        next_steps: ["manager_review_contract"]
      },
      {
        id: "manager_review_contract",
        action: "区域经理审核合同",
        description: "区域经理审核合同条款的完整性、合规性和风险点",
        actor: "regional_manager",
        required_fields: ["contract_approval_status", "review_comments", "risk_notes"],
        triggers: [
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "合同审核通过 ✅: {contract_number} - 可发送给客户",
            title: "✅ 合同审核通过",
            condition: "contract_approval_status == 'approved'"
          },
          {
            type: "conditional_notification",
            recipients: ["sales_rep"],
            message: "合同需要修订 📝: {contract_number} - 原因: {review_comments}",
            title: "📝 合同需修订",
            condition: "contract_approval_status == 'rejected'"
          },
          {
            type: "notification",
            recipients: ["sales_director"],
            message: "合同审核完成: {contract_number} - 结果: {contract_approval_status} - 风险: {risk_notes}",
            title: "📊 合同审核结果"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "合同审核状态更新: {contract_number} - {contract_approval_status}",
            title: "💼 合同状态"
          }
        ],
        next_steps: ["contract_approved", "contract_revision"]
      },
      {
        id: "contract_approved",
        action: "合同审核通过",
        description: "合同审核通过后，发送给客户签署，同时通知财务和物流部门准备",
        actor: "system",
        required_fields: [],
        triggers: [
          {
            type: "notification",
            recipients: ["customer"],
            message: "销售合同待签署: {contract_number} - 请查看并确认",
            title: "📄 合同待签署"
          },
          {
            type: "notification",
            recipients: ["sales_rep"],
            message: "合同已发送给客户: {contract_number} - 等待客户签署",
            title: "✉️ 合同已发送"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "合同审核通过，准备财务流程: {contract_number} - 总金额: {contract_total_amount}",
            title: "💰 财务准备"
          },
          {
            type: "notification",
            recipients: ["sales_director"],
            message: "合同流程进展: {contract_number} - 已发送客户签署",
            title: "📊 流程更新"
          }
        ],
        next_steps: []
      },
      {
        id: "contract_revision",
        action: "合同修订",
        description: "合同审核不通过，业务员根据反馈意见修改合同后重新提交",
        actor: "sales_rep",
        required_fields: ["revision_notes", "revised_contract_terms", "revision_reason", "revision_summary"],
        triggers: [
          {
            type: "notification",
            recipients: ["regional_manager"],
            message: "合同已修订完成，请重新审核: {contract_number} - 修订原因: {revision_reason}",
            title: "📄 合同修订完成"
          },
          {
            type: "notification",
            recipients: ["admin_finance"],
            message: "合同修订通知: {contract_number} - 修订摘要: {revision_summary}",
            title: "💼 合同修订同步"
          },
          {
            type: "status_change",
            target: "contract",
            new_status: "revised_pending_review",
            display: "修订待审"
          }
        ],
        next_steps: ["manager_review_contract"]
      }
    ]
  }
];

// ===== 工作流引擎主类 =====
export class WorkflowExecutionEngine {
  private workflow: WorkflowStage[] = INQUIRY_TO_CONTRACT_WORKFLOW;

  /**
   * 执行工作流步骤
   */
  async executeStep(stepId: string, context: WorkflowContext): Promise<{
    success: boolean;
    message: string;
    nextSteps: string[];
    statusChanges: Array<{
      target: string;
      status: string;
      display: string;
    }>;
    triggersExecuted: number;
  }> {
    console.log(`🔄 [WorkflowEngineV2] 执行步骤: ${stepId}`, context);

    // 查找步骤配置
    const step = this.findStep(stepId);
    if (!step) {
      console.error(`❌ 未找到步骤: ${stepId}`);
      return {
        success: false,
        message: `未找到步骤配置: ${stepId}`,
        nextSteps: [],
        statusChanges: [],
        triggersExecuted: 0
      };
    }

    console.log(`✅ 找到步骤配置: ${step.action}`, step);

    const statusChanges: Array<{ target: string; status: string; display: string }> = [];
    let triggersExecuted = 0;

    // 执行所有触发器
    for (const trigger of step.triggers) {
      try {
        const executed = await this.executeTrigger(trigger, context);
        if (executed) {
          triggersExecuted++;
          
          // 处理状态变更
          if (trigger.type === 'status_change') {
            statusChanges.push({
              target: trigger.target!,
              status: trigger.new_status!,
              display: this.replaceVars(trigger.display!, context)
            });
          }
        }
      } catch (error) {
        console.error(`❌ 触发器执行失败:`, trigger, error);
      }
    }

    console.log(`✅ 步骤执行完成，触发了 ${triggersExecuted} 个触发器`);

    return {
      success: true,
      message: step.description,
      nextSteps: step.next_steps || [],
      statusChanges,
      triggersExecuted
    };
  }

  /**
   * 执行触发器
   */
  private async executeTrigger(trigger: Trigger, context: WorkflowContext): Promise<boolean> {
    // 检查条件
    if (trigger.condition && !this.evaluateCondition(trigger.condition, context)) {
      console.log(`⏭️ 跳过条件触发器（条件不满足）: ${trigger.condition}`);
      return false;
    }

    switch (trigger.type) {
      case 'notification':
      case 'conditional_notification':
        await this.executeNotification(trigger, context);
        return true;
      
      case 'status_change':
        console.log(`📊 状态变更: ${trigger.target} → ${trigger.new_status} (${trigger.display})`);
        return true;
      
      default:
        console.warn(`⚠️ 未知触发器类型: ${trigger.type}`);
        return false;
    }
  }

  /**
   * 执行通知触发器
   */
  private async executeNotification(trigger: Trigger, context: WorkflowContext): Promise<void> {
    const { recipients, title, message } = trigger;

    if (!recipients || recipients.length === 0) {
      console.warn(`⚠️ 触发器没有接收人`);
      return;
    }

    for (const recipient of recipients) {
      try {
        const recipientEmail = this.resolveRecipient(recipient, context);
        if (!recipientEmail) {
          console.warn(`⚠️ 无法解析接收人: ${recipient}`);
          continue;
        }

        const finalTitle = this.replaceVars(title || '', context);
        const finalMessage = this.replaceVars(message || '', context);

        console.log(`📧 发送通知:`, {
          to: recipientEmail,
          title: finalTitle,
          message: finalMessage
        });

        // 发送通知
        await sendNotificationToUser(recipientEmail, {
          type: 'workflow_notification',
          title: finalTitle,
          message: finalMessage,
          relatedId: context.inquiry_number || context.quotation_number || context.contract_number || '',
          relatedType: context.contract_number ? 'contract' : context.quotation_number ? 'quotation' : 'inquiry',
          sender: 'system@gaoshengda.com',
          metadata: context
        });

      } catch (error) {
        console.error(`❌ 发送通知失败:`, recipient, error);
      }
    }
  }

  /**
   * 解析接收人
   */
  private resolveRecipient(recipient: string, context: WorkflowContext): string {
    // 映射角色到邮箱字段
    const recipientMap: Record<string, string> = {
      'customer': context.customer_email || '',
      'sales_rep': context.sales_rep_email || '',
      'regional_manager': context.regional_manager_email || '',
      'sales_director': context.sales_director_email || '',
      'admin_finance': context.admin_finance_email || 'finance@gaoshengda.com',
      'supplier': context.supplier_email || ''
    };

    return recipientMap[recipient] || recipient;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // 简单的条件评估
      // 支持格式: "quotation_amount < 20000" 或 "approval_status == 'approved'"
      
      const operators = ['>=', '<=', '==', '!=', '>', '<'];
      let operator = '';
      let parts: string[] = [];

      for (const op of operators) {
        if (condition.includes(op)) {
          operator = op;
          parts = condition.split(op).map(s => s.trim());
          break;
        }
      }

      if (!operator || parts.length !== 2) {
        console.warn(`⚠️ 无法解析条件: ${condition}`);
        return false;
      }

      const leftValue = this.getContextValue(parts[0], context);
      const rightValue = parts[1].replace(/['"]/g, ''); // 去掉引号

      switch (operator) {
        case '==':
          return String(leftValue) === rightValue;
        case '!=':
          return String(leftValue) !== rightValue;
        case '>':
          return Number(leftValue) > Number(rightValue);
        case '<':
          return Number(leftValue) < Number(rightValue);
        case '>=':
          return Number(leftValue) >= Number(rightValue);
        case '<=':
          return Number(leftValue) <= Number(rightValue);
        default:
          return false;
      }
    } catch (error) {
      console.error(`❌ 条件评估失败: ${condition}`, error);
      return false;
    }
  }

  /**
   * 获取上下文值
   */
  private getContextValue(key: string, context: WorkflowContext): any {
    return context[key];
  }

  /**
   * 替换模板变量
   */
  private replaceVars(template: string, context: WorkflowContext): string {
    let result = template;
    const matches = template.match(/\{([^}]+)\}/g);
    
    if (matches) {
      for (const match of matches) {
        const key = match.slice(1, -1);
        const value = context[key] || match;
        result = result.replace(match, String(value));
      }
    }
    
    return result;
  }

  /**
   * 查找步骤
   */
  private findStep(stepId: string): WorkflowStep | null {
    for (const stage of this.workflow) {
      const step = stage.steps.find(s => s.id === stepId);
      if (step) return step;
    }
    return null;
  }

  /**
   * 获取所有阶段
   */
  getStages(): WorkflowStage[] {
    return this.workflow;
  }

  /**
   * 获取步骤信息
   */
  getStepInfo(stepId: string): WorkflowStep | null {
    return this.findStep(stepId);
  }

  /**
   * 获取工作流统计信息
   */
  getWorkflowStats(): {
    totalStages: number;
    totalSteps: number;
    totalTriggers: number;
    triggersByType: Record<string, number>;
  } {
    let totalSteps = 0;
    let totalTriggers = 0;
    const triggersByType: Record<string, number> = {};

    for (const stage of this.workflow) {
      totalSteps += stage.steps.length;
      for (const step of stage.steps) {
        totalTriggers += step.triggers.length;
        for (const trigger of step.triggers) {
          triggersByType[trigger.type] = (triggersByType[trigger.type] || 0) + 1;
        }
      }
    }

    return {
      totalStages: this.workflow.length,
      totalSteps,
      totalTriggers,
      triggersByType
    };
  }
}

// ===== 导出单例实例 =====
export const workflowEngine = new WorkflowExecutionEngine();

// ===== 快捷方法 =====

/**
 * 客户提交询价单（步骤 1.1）
 */
export async function executeCustomerInquiry(context: WorkflowContext) {
  return workflowEngine.executeStep('customer_inquiry', context);
}

/**
 * 系统自动分发询价单（步骤 1.2）
 */
export async function executeSystemDistribute(context: WorkflowContext) {
  return workflowEngine.executeStep('system_distribute_inquiry', context);
}

/**
 * 区域业务员提醒财务（步骤 1.3）
 */
export async function executeSalesRemindFinance(context: WorkflowContext) {
  return workflowEngine.executeStep('sales_remind_finance', context);
}

/**
 * 获取工作流引擎实例
 */
export function getWorkflowEngine(): WorkflowExecutionEngine {
  return workflowEngine;
}

/**
 * 获取工作流统计信息
 */
export function getWorkflowStats() {
  return workflowEngine.getWorkflowStats();
}

// ===== 工作流状态追踪 =====

export interface WorkflowState {
  inquiryNumber: string;
  currentStageId: string;
  currentStepId: string;
  completedSteps: string[];
  statusHistory: Array<{
    stepId: string;
    timestamp: number;
    statusChanges: Array<{
      target: string;
      status: string;
      display: string;
    }>;
  }>;
  lastUpdated: number;
  context?: WorkflowContext; // 保存工作流上下文数据
}

const WORKFLOW_STATES_KEY = 'cosun_workflow_states';

/**
 * 保存工作流状态
 */
export function saveWorkflowState(state: WorkflowState): void {
  if (typeof window === 'undefined') return;
  
  try {
    const states = getAllWorkflowStates();
    states[state.inquiryNumber] = state;
    localStorage.setItem(WORKFLOW_STATES_KEY, JSON.stringify(states));
    console.log('✅ 工作流状态已保存:', state.inquiryNumber);
  } catch (error) {
    console.error('❌ 保存工作流状态失败:', error);
  }
}

/**
 * 获取工作流状态
 */
export function getWorkflowState(inquiryNumber: string): WorkflowState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const states = getAllWorkflowStates();
    return states[inquiryNumber] || null;
  } catch (error) {
    console.error('❌ 获取工作流状态失败:', error);
    return null;
  }
}

/**
 * 获取所有工作流状态
 */
export function getAllWorkflowStates(): Record<string, WorkflowState> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(WORKFLOW_STATES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('❌ 读取工作流状态失败:', error);
    return {};
  }
}

/**
 * 更新工作流状态（执行步骤后）
 */
export async function updateWorkflowState(
  inquiryNumber: string,
  stepId: string,
  context: WorkflowContext
): Promise<void> {
  const result = await workflowEngine.executeStep(stepId, context);
  
  if (result.success) {
    let state = getWorkflowState(inquiryNumber);
    
    if (!state) {
      // 创建新的工作流状态
      state = {
        inquiryNumber,
        currentStageId: 'inquiry_submission',
        currentStepId: stepId,
        completedSteps: [stepId],
        statusHistory: [],
        lastUpdated: Date.now(),
        context: context // 保存上下文数据
      };
    } else {
      // 更新现有状态
      if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId);
      }
      state.currentStepId = stepId;
      state.lastUpdated = Date.now();
      // 合并上下文数据
      state.context = { ...state.context, ...context };
    }
    
    // 记录状态历史
    if (result.statusChanges.length > 0) {
      state.statusHistory.push({
        stepId,
        timestamp: Date.now(),
        statusChanges: result.statusChanges
      });
    }
    
    // 更新当前阶段（根据步骤ID判断）
    const step = INQUIRY_TO_CONTRACT_WORKFLOW
      .flatMap(stage => stage.steps)
      .find(s => s.id === stepId);
    
    if (step) {
      const stage = INQUIRY_TO_CONTRACT_WORKFLOW.find(s => 
        s.steps.some(st => st.id === stepId)
      );
      if (stage) {
        state.currentStageId = stage.id;
      }
    }
    
    saveWorkflowState(state);
    console.log('✅ 工作流状态已更新:', state);
  }
}
