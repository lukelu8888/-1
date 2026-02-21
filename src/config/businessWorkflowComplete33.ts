/**
 * 🔄 完整业务流程配置 - 33步全流程版本
 * 从询价到交付的完整业务流转逻辑定义
 */

export const businessWorkflowComplete33 = {
  "version": "2.0.0",
  "lastUpdated": "2025-11-26",
  "description": "福建高盛达富建材B2B业务完整流转配置 - 33步完整版",
  
  "roles": {
    "customer": {
      "name": "客户",
      "permissions": ["submit_inquiry", "view_quotation", "accept_quotation", "reject_quotation", "negotiate_quotation", "confirm_contract", "upload_payment", "view_order", "confirm_receipt"]
    },
    "sales_rep": {
      "name": "区域业务员",
      "region_isolated": true,
      "permissions": ["view_inquiry", "request_finance_approval", "create_quotation", "request_manager_approval", "send_quotation", "create_contract", "create_po", "view_payment", "arrange_shipment"]
    },
    "regional_manager": {
      "name": "区域主管", 
      "region_isolated": true,
      "permissions": ["view_inquiry", "approve_quotation", "reject_quotation", "approve_negotiation", "approve_contract", "view_all_region_activities"]
    },
    "sales_director": {
      "name": "销售总监",
      "region_isolated": false,
      "permissions": ["view_all_regions", "view_all_quotations", "view_all_orders", "view_all_contracts"]
    },
    "finance": {
      "name": "财务",
      "permissions": ["approve_finance_request", "provide_cost_price", "view_all_quotations", "view_all_contracts", "confirm_payment", "manage_receivables"]
    },
    "cfo": {
      "name": "财务总监",
      "permissions": ["view_all_finance", "approve_large_amounts"]
    },
    "procurement": {
      "name": "采购部门",
      "permissions": ["receive_po", "manage_suppliers", "confirm_delivery", "arrange_production"]
    },
    "qc": {
      "name": "质检部门",
      "permissions": ["conduct_inspection", "issue_report", "approve_shipment"]
    },
    "logistics": {
      "name": "物流部门",
      "permissions": ["arrange_shipping", "book_cargo", "arrange_customs", "track_shipment"]
    }
  },

  "workflows": {
    "inquiry_to_delivery": {
      "name": "询价到交付完整流程（33步）",
      "stages": [
        {
          "id": "stage_1_inquiry",
          "name": "阶段1: 询价提交",
          "steps": [
            {
              "id": "step_1_1",
              "action": "customer_submit_inquiry",
              "actor": "customer",
              "description": "客户提交询价单",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep[region]", "regional_manager[region]", "sales_director"],
                  "message": "新询价: {inquiry_number} - {customer_name}",
                  "title": "📋 新询价通知"
                },
                {
                  "type": "status_change",
                  "target": "inquiry",
                  "new_status": "pending",
                  "display": "待处理"
                }
              ],
              "next_steps": ["step_2_1"]
            }
          ]
        },

        {
          "id": "stage_2_quotation_preparation",
          "name": "阶段2: 报价准备",
          "steps": [
            {
              "id": "step_2_1",
              "action": "sales_request_finance_approval",
              "actor": "sales_rep",
              "description": "业务员请求财务提供成本价和利润率",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["finance", "cfo"],
                  "message": "报价请求: {inquiry_number} - 需要成本价指导",
                  "title": "📋 财务审批请求"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "pending_finance",
                  "display": "财务审核中"
                }
              ],
              "next_steps": ["step_2_2"]
            },
            {
              "id": "step_2_2",
              "action": "finance_provide_guidance",
              "actor": "finance",
              "description": "财务反馈成本低价和最低利润率",
              "data_required": ["cost_price", "min_profit_rate", "suggested_price", "notes"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "财务已反馈报价基准: {inquiry_number}",
                  "title": "✅ 财务反馈完成"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "财务已反馈报价基准: {inquiry_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "finance_approved",
                  "display": "财务已批准"
                }
              ],
              "next_steps": ["step_2_3"]
            },
            {
              "id": "step_2_3",
              "action": "sales_create_quotation",
              "actor": "sales_rep",
              "description": "业务员根据财务指导填写报价",
              "triggers": [
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "draft",
                  "display": "草稿"
                }
              ],
              "next_steps": ["step_2_4"]
            },
            {
              "id": "step_2_4",
              "action": "sales_request_manager_approval",
              "actor": "sales_rep",
              "description": "业务员提交报价给区域主管审批",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "报价审批请求: {quotation_number} - 金额: {currency} {amount}",
                  "title": "📋 报价审批请求"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "报价待审批: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "pending_manager",
                  "display": "主管审核中"
                }
              ],
              "next_steps": ["step_2_5a", "step_2_5b"]
            },
            {
              "id": "step_2_5a",
              "action": "manager_approve_quotation",
              "actor": "regional_manager",
              "description": "区域主管批准报价",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "报价已批准，可发送给客户",
                  "title": "✅ 报价审批通过"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "报价已批准: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "approved",
                  "display": "已批准"
                }
              ],
              "next_steps": ["step_3_1"]
            },
            {
              "id": "step_2_5b",
              "action": "manager_reject_quotation",
              "actor": "regional_manager",
              "description": "区域主管拒绝报价",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "报价被退回，请修改: {rejection_reason}",
                  "title": "❌ 报价审批被拒"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "报价被拒绝: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "rejected_by_manager",
                  "display": "主管已拒绝"
                }
              ],
              "next_steps": ["step_2_3"]
            }
          ]
        },

        {
          "id": "stage_3_quotation_sent",
          "name": "阶段3: 报价发送",
          "steps": [
            {
              "id": "step_3_1",
              "action": "sales_send_quotation",
              "actor": "sales_rep",
              "description": "业务员发送报价给客户",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "您收到新报价: {quotation_number}",
                  "title": "📄 新报价"
                },
                {
                  "type": "notification",
                  "recipients": ["finance"],
                  "message": "报价已发送: {quotation_number} - {currency} {amount}",
                  "title": "💰 报价同步"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "报价已发送: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "sent",
                  "display": "已发送"
                }
              ],
              "next_steps": ["step_4_1a", "step_4_1b", "step_4_1c"]
            }
          ]
        },

        {
          "id": "stage_4_customer_response",
          "name": "阶段4: 客户响应",
          "steps": [
            {
              "id": "step_4_1a",
              "action": "customer_accept_quotation",
              "actor": "customer",
              "description": "客户接受报价",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "客户已接受报价: {quotation_number}",
                  "title": "✅ 客户确认报价"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "客户已接受报价: {quotation_number}",
                  "title": "✅ 客户确认报价"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "客户已接受报价: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "notification",
                  "recipients": ["finance"],
                  "message": "客户已接受报价: {quotation_number}",
                  "title": "💰 报价确认"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "confirmed",
                  "display": "客户已确认 by {customer_contact}"
                }
              ],
              "next_steps": ["step_5_1"]
            },
            {
              "id": "step_4_1b",
              "action": "customer_negotiate_quotation",
              "actor": "customer",
              "description": "客户要求议价",
              "data_required": ["negotiation_reason", "target_price"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "regional_manager[region]"],
                  "message": "客户要求议价: {quotation_number} - {negotiation_reason}",
                  "title": "💬 客户议价请求"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "客户要求议价: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "negotiating",
                  "display": "议价中"
                }
              ],
              "next_steps": ["step_4_2a", "step_4_2b"]
            },
            {
              "id": "step_4_1c",
              "action": "customer_reject_quotation",
              "actor": "customer",
              "description": "客户拒绝报价",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "客户已拒绝报价: {quotation_number} - 理由: {rejection_reason}",
                  "title": "❌ 客户拒绝报价"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "客户已拒绝报价: {quotation_number}",
                  "title": "❌ 客户拒绝报价"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "客户已拒绝报价: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "rejected",
                  "display": "客户已拒绝 - {rejection_reason} - {timestamp}"
                }
              ],
              "next_steps": []
            },
            {
              "id": "step_4_2a",
              "action": "manager_approve_negotiation",
              "actor": "regional_manager",
              "description": "主管批准议价（主管可直接处理，无需业务员转发）",
              "data_required": ["adjusted_price", "approval_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "议价已批准，请更新报价",
                  "title": "✅ 议价批准"
                },
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "您的议价请求已接受",
                  "title": "✅ 议价接受"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "议价已批准: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "negotiation_approved",
                  "display": "议价已批准"
                }
              ],
              "next_steps": ["step_3_1"]
            },
            {
              "id": "step_4_2b",
              "action": "manager_reject_negotiation",
              "actor": "regional_manager",
              "description": "主管拒绝议价",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "议价被拒绝: {rejection_reason}",
                  "title": "❌ 议价拒绝"
                },
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "抱歉，无法接受议价: {rejection_reason}",
                  "title": "❌ 议价拒绝"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "议价被拒绝: {quotation_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "negotiation_rejected",
                  "display": "议价已拒绝"
                }
              ],
              "next_steps": []
            }
          ]
        },

        {
          "id": "stage_5_contract",
          "name": "阶段5: 销售合同",
          "steps": [
            {
              "id": "step_5_1",
              "action": "sales_generate_contract",
              "actor": "sales_rep",
              "description": "业务员生成销售合同",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "销售合同待审批: {contract_number}",
                  "title": "📄 合同审批请求"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "销售合同待审批: {contract_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "notification",
                  "recipients": ["finance"],
                  "message": "销售合同待审批: {contract_number} - {currency} {amount}",
                  "title": "💰 合同同步"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "contract_pending",
                  "display": "合同待审"
                }
              ],
              "next_steps": ["step_5_2a", "step_5_2b"]
            },
            {
              "id": "step_5_2a",
              "action": "manager_approve_contract",
              "actor": "regional_manager",
              "description": "主管审批通过销售合同",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "销售合同已批准，可发送客户",
                  "title": "✅ 合同审批通过"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "销售合同已批准: {contract_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "contract_approved",
                  "display": "合同已批准"
                }
              ],
              "next_steps": ["step_5_3"]
            },
            {
              "id": "step_5_2b",
              "action": "manager_reject_contract",
              "actor": "regional_manager",
              "description": "主管拒绝销售合同",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "销售合同被拒绝: {rejection_reason}",
                  "title": "❌ 合同审批被拒"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "销售合同被拒绝: {contract_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "contract_rejected",
                  "display": "合同已拒绝"
                }
              ],
              "next_steps": ["step_5_1"]
            },
            {
              "id": "step_5_3",
              "action": "sales_send_contract",
              "actor": "sales_rep",
              "description": "业务员发送合同给客户",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "销售合同待您确认: {contract_number}",
                  "title": "📄 销售合同"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "sent_to_customer",
                  "display": "已提交给客户"
                }
              ],
              "next_steps": ["step_5_4"]
            },
            {
              "id": "step_5_4",
              "action": "customer_confirm_contract",
              "actor": "customer",
              "description": "客户确认销售合同",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "客户已确认合同: {contract_number}",
                  "title": "✅ 合同确认"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "客户已确认合同: {contract_number}",
                  "title": "✅ 合同确认"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "客户已确认合同: {contract_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "notification",
                  "recipients": ["finance", "cfo"],
                  "message": "客户已确认合同，应收账款已创建: {contract_number}",
                  "title": "💰 应收账款"
                },
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "请在7天内按付款条件完成付款",
                  "title": "⏰ 付款提醒"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "awaiting_payment",
                  "display": "待付款"
                },
                {
                  "type": "create_record",
                  "record_type": "receivable",
                  "data": {
                    "order_number": "{order_number}",
                    "customer": "{customer_name}",
                    "amount": "{total_amount}",
                    "status": "pending"
                  }
                }
              ],
              "next_steps": ["step_6_1"]
            }
          ]
        },

        {
          "id": "stage_6_payment",
          "name": "阶段6: 定金付款阶段",
          "steps": [
            {
              "id": "step_6_1",
              "action": "customer_upload_deposit_proof",
              "actor": "customer",
              "description": "客户上传定金付款水单",
              "data_required": ["payment_proof", "amount", "payment_date"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["finance", "sales_rep"],
                  "message": "客户已提交定金水单: {order_number}",
                  "title": "💰 付款水单"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "客户已提交定金水单: {order_number}",
                  "title": "💰 付款水单"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "客户已提交定金水单: {order_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "order.deposit_status",
                  "new_status": "submitted",
                  "display": "定金已付款"
                },
                {
                  "type": "status_change",
                  "target": "order.balance_status",
                  "new_status": "pending",
                  "display": "余款未付款"
                }
              ],
              "next_steps": ["step_6_2"]
            },
            {
              "id": "step_6_2",
              "action": "finance_confirm_deposit",
              "actor": "finance",
              "description": "财务确认定金到账",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer", "sales_rep"],
                  "message": "定金已确认到账",
                  "title": "✅ 定金收到"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "定金已确认到账: {order_number}",
                  "title": "✅ 定金收到"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "定金已到账: {order_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "order.deposit_status",
                  "new_status": "confirmed",
                  "display": "定金收到"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "deposit_confirmed",
                  "display": "已确认"
                }
              ],
              "next_steps": ["step_7_1"]
            }
          ]
        },

        {
          "id": "stage_7_procurement",
          "name": "阶段7: 采购阶段",
          "steps": [
            {
              "id": "step_7_1",
              "action": "sales_initiate_procurement",
              "actor": "sales_rep",
              "description": "业务员发起采购",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["procurement"],
                  "message": "采购请求: {order_number}",
                  "title": "🏭 采购请求"
                },
                {
                  "type": "notification",
                  "recipients": ["finance"],
                  "message": "采购订单已生成: {po_number} - {currency} {amount}",
                  "title": "💰 采购合同同步"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "采购已发起: {order_number}",
                  "title": "🏭 采购发起"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "采购已发起: {order_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "in_procurement",
                  "display": "采购中"
                }
              ],
              "next_steps": ["step_7_2"]
            },
            {
              "id": "step_7_2",
              "action": "procurement_arrange_purchase",
              "actor": "procurement",
              "description": "采购部门安排货物采购",
              "triggers": [
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "in_production",
                  "display": "生产中"
                }
              ],
              "next_steps": ["step_8_1"]
            }
          ]
        },

        {
          "id": "stage_8_production_qc",
          "name": "阶段8: 生产与质检",
          "steps": [
            {
              "id": "step_8_1",
              "action": "supplier_start_production",
              "actor": "procurement",
              "description": "供应商开始生产货物",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "regional_manager[region]"],
                  "message": "供应商已开始生产: {order_number}",
                  "title": "🏭 生产开始"
                },
                {
                  "type": "notification",
                  "recipients": ["qc"],
                  "message": "订单已进入生产，请关注质检时间: {order_number}",
                  "title": "🔍 质检提醒"
                },
                {
                  "type": "status_change",
                  "target": "order.production_status",
                  "new_status": "in_progress",
                  "display": "生产中"
                }
              ],
              "next_steps": ["step_8_2"]
            },
            {
              "id": "step_8_2",
              "action": "production_complete",
              "actor": "procurement",
              "description": "生产完成，通知质检",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["qc"],
                  "message": "货物生产完成，请安排质检: {order_number}",
                  "title": "🔍 质检请求"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "货物生产完成: {order_number}",
                  "title": "✅ 生产完成"
                },
                {
                  "type": "status_change",
                  "target": "order.production_status",
                  "new_status": "completed",
                  "display": "生产完成"
                }
              ],
              "next_steps": ["step_8_3"]
            },
            {
              "id": "step_8_3",
              "action": "qc_conduct_inspection",
              "actor": "qc",
              "description": "质检部门进行质量检验",
              "data_required": ["inspection_date", "inspector_name", "inspection_results"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "procurement"],
                  "message": "质检正在进行中: {order_number}",
                  "title": "🔍 质检进行中"
                },
                {
                  "type": "status_change",
                  "target": "order.qc_status",
                  "new_status": "inspecting",
                  "display": "质检中"
                }
              ],
              "next_steps": ["step_8_4"]
            },
            {
              "id": "step_8_4",
              "action": "qc_issue_report",
              "actor": "qc",
              "description": "质检部门发布质检报告",
              "data_required": ["report_url", "pass_rate", "defect_notes"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "customer"],
                  "message": "质检报告已发布: {order_number}",
                  "title": "📋 质检报告"
                },
                {
                  "type": "notification",
                  "recipients": ["procurement"],
                  "message": "质检通过，可以安排发货: {order_number}",
                  "title": "✅ 质检通过"
                },
                {
                  "type": "status_change",
                  "target": "order.qc_status",
                  "new_status": "passed",
                  "display": "质检通过"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "ready_to_ship",
                  "display": "待发货"
                }
              ],
              "next_steps": ["step_9_1"]
            }
          ]
        },

        {
          "id": "stage_9_balance_payment",
          "name": "阶段9: 尾款支付阶段",
          "steps": [
            {
              "id": "step_9_1",
              "action": "sales_request_balance",
              "actor": "sales_rep",
              "description": "业务员通知客户支付尾款",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "货物准备就绪，请支付尾款: {order_number}",
                  "title": "💰 尾款通知"
                },
                {
                  "type": "status_change",
                  "target": "order.balance_status",
                  "new_status": "awaiting",
                  "display": "等待尾款"
                }
              ],
              "next_steps": ["step_9_2"]
            },
            {
              "id": "step_9_2",
              "action": "customer_upload_balance_proof",
              "actor": "customer",
              "description": "客户上传尾款付款水单",
              "data_required": ["payment_proof", "amount", "payment_date"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["finance", "sales_rep"],
                  "message": "客户已提交尾款水单: {order_number}",
                  "title": "💰 尾款水单"
                },
                {
                  "type": "status_change",
                  "target": "order.balance_status",
                  "new_status": "submitted",
                  "display": "尾款已付款"
                }
              ],
              "next_steps": ["step_9_3"]
            },
            {
              "id": "step_9_3",
              "action": "finance_confirm_balance",
              "actor": "finance",
              "description": "财务确认尾款到账",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer", "sales_rep"],
                  "message": "尾款已确认到账，货物即将发货",
                  "title": "✅ 尾款收到"
                },
                {
                  "type": "notification",
                  "recipients": ["logistics"],
                  "message": "全款已到账，可以安排发货: {order_number}",
                  "title": "📦 准备发货"
                },
                {
                  "type": "status_change",
                  "target": "order.balance_status",
                  "new_status": "confirmed",
                  "display": "尾款收到"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "fully_paid",
                  "display": "已全额付款"
                }
              ],
              "next_steps": ["step_10_1"]
            }
          ]
        },

        {
          "id": "stage_10_logistics_shipping",
          "name": "阶段10: 物流发货阶段",
          "steps": [
            {
              "id": "step_10_1",
              "action": "logistics_arrange_shipping",
              "actor": "logistics",
              "description": "物流部门安排发货",
              "data_required": ["shipping_company", "tracking_number", "etd", "eta"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "customer"],
                  "message": "货物已安排发货: {order_number}",
                  "title": "📦 发货通知"
                },
                {
                  "type": "status_change",
                  "target": "order.shipping_status",
                  "new_status": "preparing",
                  "display": "准备发货"
                }
              ],
              "next_steps": ["step_10_2"]
            },
            {
              "id": "step_10_2",
              "action": "logistics_ship_goods",
              "actor": "logistics",
              "description": "货物已发货",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer", "sales_rep"],
                  "message": "货物已发货，追踪号: {tracking_number}",
                  "title": "🚢 货物已发货"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "订单已发货: {order_number}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "order.shipping_status",
                  "new_status": "in_transit",
                  "display": "运输中"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "shipped",
                  "display": "已发货"
                }
              ],
              "next_steps": ["step_10_3"]
            },
            {
              "id": "step_10_3",
              "action": "logistics_customs_clearance",
              "actor": "logistics",
              "description": "货物到港，办理清关",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer", "sales_rep"],
                  "message": "货物已到达目的港，正在清关: {order_number}",
                  "title": "🛃 清关中"
                },
                {
                  "type": "status_change",
                  "target": "order.shipping_status",
                  "new_status": "customs",
                  "display": "清关中"
                }
              ],
              "next_steps": ["step_10_4"]
            },
            {
              "id": "step_10_4",
              "action": "logistics_out_for_delivery",
              "actor": "logistics",
              "description": "清关完成，配送中",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "清关完成，货物配送中，预计{delivery_date}送达",
                  "title": "🚚 配送中"
                },
                {
                  "type": "status_change",
                  "target": "order.shipping_status",
                  "new_status": "out_for_delivery",
                  "display": "配送中"
                }
              ],
              "next_steps": ["step_10_5"]
            },
            {
              "id": "step_10_5",
              "action": "customer_confirm_receipt",
              "actor": "customer",
              "description": "客户确认收货",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "regional_manager[region]", "sales_director"],
                  "message": "✅ 客户已确认收货: {order_number}",
                  "title": "✅ 订单完成"
                },
                {
                  "type": "notification",
                  "recipients": ["finance"],
                  "message": "订单已完成: {order_number}",
                  "title": "💰 订单完成"
                },
                {
                  "type": "status_change",
                  "target": "order.shipping_status",
                  "new_status": "delivered",
                  "display": "已送达"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "completed",
                  "display": "已完成"
                }
              ],
              "next_steps": []
            }
          ]
        }
      ]
    }
  },

  "notification_templates": {
    "inquiry_submitted": "新询价: {inquiry_number} - {customer_name}",
    "quotation_finance_approved": "财务已反馈报价基准: {inquiry_number}",
    "quotation_manager_approved": "报价已批准，可发送给客户",
    "quotation_sent": "您收到新报价: {quotation_number}",
    "quotation_confirmed": "客户已接受报价: {quotation_number}",
    "quotation_rejected": "客户已拒绝报价: {quotation_number} - 理由: {rejection_reason}",
    "contract_pending": "销售合同待审批: {contract_number}",
    "contract_approved": "销售合同已批准，可发送客户",
    "contract_sent": "销售合同待您确认: {contract_number}",
    "contract_confirmed": "客户已确认合同: {contract_number}",
    "payment_submitted": "客户已提交付款水单: {order_number}",
    "payment_confirmed": "财务已确认收款: {order_number}",
    "procurement_initiated": "采购已发起: {order_number}",
    "production_started": "供应商已开始生产: {order_number}",
    "production_completed": "货物生产完成: {order_number}",
    "qc_in_progress": "质检正在进行中: {order_number}",
    "qc_passed": "质检通过，可以安排发货: {order_number}",
    "balance_requested": "货物准备就绪，请支付尾款: {order_number}",
    "balance_submitted": "客户已提交尾款水单: {order_number}",
    "balance_confirmed": "尾款已确认到账，货物即将发货",
    "shipping_arranged": "货物已安排发货: {order_number}",
    "goods_shipped": "货物已发货，追踪号: {tracking_number}",
    "customs_clearance": "货物已到达目的港，正在清关: {order_number}",
    "out_for_delivery": "清关完成，货物配送中",
    "order_delivered": "客户已确认收货: {order_number}",
    "order_completed": "✅ 订单完成: {order_number}"
  },

  "status_definitions": {
    "inquiry": {
      "pending": "待处理",
      "quoted": "已报价",
      "accepted": "已接受",
      "rejected": "已拒绝"
    },
    "quotation": {
      "pending_finance": "财务审核中",
      "finance_approved": "财务已批准",
      "draft": "草稿",
      "pending_manager": "主管审核中",
      "approved": "已批准",
      "rejected_by_manager": "主管已拒绝",
      "sent": "已发送",
      "confirmed": "客户已确认",
      "negotiating": "议价中",
      "negotiation_approved": "议价已批准",
      "negotiation_rejected": "议价已拒绝",
      "rejected": "客户已拒绝"
    },
    "order": {
      "contract_pending": "合同待审",
      "contract_approved": "合同已批",
      "contract_rejected": "合同已拒",
      "sent_to_customer": "已发送客户",
      "awaiting_payment": "待付款",
      "deposit_confirmed": "定金已确认",
      "in_procurement": "采购中",
      "in_production": "生产中",
      "ready_to_ship": "待发货",
      "fully_paid": "已全额付款",
      "shipped": "已发货",
      "completed": "已完成"
    },
    "deposit_status": {
      "pending": "待付款",
      "submitted": "定金已付款",
      "confirmed": "定金收到"
    },
    "balance_status": {
      "pending": "余款未付款",
      "awaiting": "等待尾款",
      "submitted": "尾款已付款",
      "confirmed": "尾款收到"
    },
    "production_status": {
      "not_started": "未开始",
      "in_progress": "生产中",
      "completed": "生产完成"
    },
    "qc_status": {
      "pending": "待质检",
      "inspecting": "质检中",
      "passed": "质检通过",
      "failed": "质检不通过"
    },
    "shipping_status": {
      "not_shipped": "未发货",
      "preparing": "准备发货",
      "in_transit": "运输中",
      "customs": "清关中",
      "out_for_delivery": "配送中",
      "delivered": "已送达"
    }
  },

  "validation_rules": {
    "region_isolation": {
      "sales_rep": "只能查看和操作本区域的询价、报价、订单",
      "regional_manager": "只能查看和审批本区域的报价和合同",
      "sales_director": "可以查看所有区域的数据（只读）"
    },
    "finance_sync": {
      "from_stage": "quotation_sent",
      "recipients": ["finance", "cfo"],
      "trigger_on": ["quotation_sent", "contract_generated", "payment_received"]
    }
  },

  "summary": {
    "total_stages": 10,
    "total_steps": 33,
    "description": "从询价到交付的完整33步业务流程",
    "stages_breakdown": {
      "stage_1": "询价提交（1步）",
      "stage_2": "报价准备（6步）",
      "stage_3": "报价发送（1步）",
      "stage_4": "客户响应（5步）",
      "stage_5": "销售合同（5步）",
      "stage_6": "定金付款（2步）",
      "stage_7": "采购阶段（2步）",
      "stage_8": "生产与质检（4步）",
      "stage_9": "尾款支付（3步）",
      "stage_10": "物流发货（5步，包括收货确认）"
    }
  }
} as const;

export default businessWorkflowComplete33;
