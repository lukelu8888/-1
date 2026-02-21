/**
 * 完整的33步业务流程配置 - V2增强版
 * 
 * 🆕 V2更新说明：
 * - 在"阶段2：报价准备"中增加基于报价金额的审批权限控制
 * - 报价金额 < $20,000：区域主管审批（step_2_5a_regional）
 * - 报价金额 >= $20,000：销售总监审批（step_2_5a_director）
 * - 保持完整的拒绝和修改流程
 * - 在"阶段5：销售合同"中增加基于合同金额的审批权限控制
 * - 合同金额 < $20,000：区域主管审批（step_5_2a_regional）
 * - 合同金额 >= $20,000：销售总监审批（step_5_2b_director）
 * - 保持完整的拒绝和修改流程
 * 
 * 📋 业务流程总览：
 * 1️⃣ 询价提交（1步）
 * 2️⃣ 报价准备（8步）← V2增强：增加金额条件分支
 * 3️⃣ 报价发送（1步）
 * 4️⃣ 客户响应（5步）
 * 5️⃣ 销售合同（9步）← V2增强：增加金额条件分支
 * 6️⃣ 付款阶段（2步）
 * 7️⃣ 采购阶段（2步）
 * 8️⃣ 生产阶段（3步）
 * 9️⃣ 质检阶段（2步）
 * 🔟 物流阶段（3步）
 * 1️⃣1️⃣ 订单完成（1步）
 * 
 * 总计：37步（阶段2: 8步 + 阶段5: 9步）
 */

export const businessWorkflowConfigV2 = {
  "workflow_config": {
    "workflow_name": "标准B2B外贸流程 (V2增强版)",
    "version": "2.0.0",
    "created_date": "2025-11-26",
    "description": "从询价到交付的完整业务流程，支持基于金额的多级审批",
    "total_stages": 11,
    "total_steps": 37,
    "roles": {
      "participants": [
        {
          "role_id": "customer",
          "name": "客户",
          "module": "Customer Portal",
          "access_level": "customer"
        },
        {
          "role_id": "sales_rep",
          "name": "区域业务员",
          "module": "Salesperson Portal",
          "access_level": "sales",
          "region_bound": true
        },
        {
          "role_id": "regional_manager",
          "name": "区域主管",
          "module": "Admin Portal - Regional Manager",
          "access_level": "manager",
          "region_bound": true,
          "approval_limit": 20000,
          "approval_limit_currency": "USD"
        },
        {
          "role_id": "sales_director",
          "name": "销售总监",
          "module": "Admin Portal - Sales Director",
          "access_level": "director",
          "region_bound": false,
          "approval_limit": null
        },
        {
          "role_id": "finance",
          "name": "财务人员",
          "module": "Admin Portal - Finance",
          "access_level": "finance"
        },
        {
          "role_id": "cfo",
          "name": "财务总监",
          "module": "Admin Portal - CFO",
          "access_level": "executive"
        },
        {
          "role_id": "procurement",
          "name": "采购人员",
          "module": "Admin Portal - Procurement",
          "access_level": "operations"
        },
        {
          "role_id": "qc_inspector",
          "name": "质检员",
          "module": "Admin Portal - QC",
          "access_level": "operations"
        },
        {
          "role_id": "logistics",
          "name": "物流人员",
          "module": "Admin Portal - Logistics",
          "access_level": "operations"
        },
        {
          "role_id": "supplier",
          "name": "供应商",
          "module": "Supplier Portal",
          "access_level": "supplier",
          "description": "工厂供应商，接收采购订单并安排生产"
        },
        {
          "role_id": "ceo",
          "name": "CEO",
          "module": "Admin Portal - CEO",
          "access_level": "executive"
        }
      ]
    },

    "workflow": {
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
              "data_required": [
                "product_details",
                "quantity",
                "target_price",
                "delivery_date",
                "shipping_address"
              ],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep[region]", "regional_manager[region]", "sales_director"],
                  "message": "新询价: {inquiry_number} - {customer_name}",
                  "title": "🔔 新询价提醒"
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
          "name": "阶段2: 报价准备（V2增强版）",
          "description": "支持基于金额的多级审批：<$20K区域主管，>=$20K销售总监",
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
              "data_required": ["quotation_amount", "quotation_currency", "payment_terms", "delivery_terms"],
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
              "action": "sales_request_approval",
              "actor": "sales_rep",
              "description": "业务员提交报价申请审批（系统自动根据金额分配审批人）",
              "approval_routing": {
                "condition": "quotation_amount_usd",
                "rules": [
                  {
                    "condition": "< 20000",
                    "approver": "regional_manager",
                    "next_step": "step_2_5a_regional"
                  },
                  {
                    "condition": ">= 20000",
                    "approver": "sales_director",
                    "next_step": "step_2_5a_director"
                  }
                ]
              },
              "triggers": [
                {
                  "type": "conditional_notification",
                  "condition": "quotation_amount_usd < 20000",
                  "recipients": ["regional_manager[region]"],
                  "message": "报价审批请求: {quotation_number} - 金额: {currency} {amount} (< $20,000)",
                  "title": "📋 报价审批请求 - 区域主管"
                },
                {
                  "type": "conditional_notification",
                  "condition": "quotation_amount_usd >= 20000",
                  "recipients": ["sales_director"],
                  "message": "报价审批请求: {quotation_number} - 金额: {currency} {amount} (>= $20,000)",
                  "title": "📋 报价审批请求 - 销售总监"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "报价待审批: {quotation_number} - {currency} {amount}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "pending_approval",
                  "display": "待审批"
                }
              ],
              "next_steps": ["step_2_5a_regional", "step_2_5a_director"]
            },
            {
              "id": "step_2_5a_regional",
              "action": "regional_manager_approve_quotation",
              "actor": "regional_manager",
              "description": "区域主管批准报价（金额 < $20,000）",
              "condition": "quotation_amount_usd < 20000",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "报价已批准（区域主管），可发送给客户: {quotation_number}",
                  "title": "✅ 报价审批通过"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "区域主管已批准报价: {quotation_number} - {currency} {amount}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "approved_by_regional_manager",
                  "display": "区域主管已批准"
                }
              ],
              "next_steps": ["step_3_1"]
            },
            {
              "id": "step_2_5b_regional",
              "action": "regional_manager_reject_quotation",
              "actor": "regional_manager",
              "description": "区域主管拒绝报价（金额 < $20,000）",
              "condition": "quotation_amount_usd < 20000",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "报价被退回（区域主管），请修改: {rejection_reason}",
                  "title": "❌ 报价审批被拒"
                },
                {
                  "type": "notification",
                  "recipients": ["sales_director"],
                  "message": "区域主管拒绝报价: {quotation_number} - 原因: {rejection_reason}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "rejected_by_regional_manager",
                  "display": "区域主管已拒绝"
                }
              ],
              "next_steps": ["step_2_3"]
            },
            {
              "id": "step_2_5a_director",
              "action": "sales_director_approve_quotation",
              "actor": "sales_director",
              "description": "销售总监批准报价（金额 >= $20,000）",
              "condition": "quotation_amount_usd >= 20000",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "报价已批准（销售总监），可发送给客户: {quotation_number}",
                  "title": "✅ 报价审批通过"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "销售总监已批准报价: {quotation_number} - {currency} {amount}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "approved_by_sales_director",
                  "display": "销售总监已批准"
                }
              ],
              "next_steps": ["step_3_1"]
            },
            {
              "id": "step_2_5b_director",
              "action": "sales_director_reject_quotation",
              "actor": "sales_director",
              "description": "销售总监拒绝报价（金额 >= $20,000）",
              "condition": "quotation_amount_usd >= 20000",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "报价被退回（销售总监），请修改: {rejection_reason}",
                  "title": "❌ 报价审批被拒"
                },
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "销售总监拒绝报价: {quotation_number} - 原因: {rejection_reason}",
                  "title": "📊 业务同步"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "rejected_by_sales_director",
                  "display": "销售总监已拒绝"
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
                  "recipients": ["sales_rep", "regional_manager[region]", "sales_director"],
                  "message": "客户接受报价: {quotation_number}",
                  "title": "✅ 报价已接受"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "accepted",
                  "display": "客户已接受"
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
                  "message": "客户要求议价: {quotation_number} - 目标价: {target_price}",
                  "title": "💬 客户议价"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "negotiating",
                  "display": "议价中"
                }
              ],
              "next_steps": ["step_4_2"]
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
                  "recipients": ["sales_rep", "regional_manager[region]", "sales_director"],
                  "message": "客户拒绝报价: {quotation_number} - 原因: {rejection_reason}",
                  "title": "❌ 报价被拒"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "rejected_by_customer",
                  "display": "客户已拒绝"
                }
              ],
              "next_steps": ["step_4_5"]
            },
            {
              "id": "step_4_2",
              "action": "sales_submit_revised_quotation",
              "actor": "sales_rep",
              "description": "业务员提交修订后的报价",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]"],
                  "message": "修订报价待审批: {quotation_number}",
                  "title": "📋 修订报价审批"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "revised",
                  "display": "已修订"
                }
              ],
              "next_steps": ["step_4_3a", "step_4_3b"]
            },
            {
              "id": "step_4_3a",
              "action": "manager_approve_revised_quotation",
              "actor": "regional_manager",
              "description": "主管批准修订报价",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "修订报价已批准，请发送给客户",
                  "title": "✅ 修订报价批准"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "revised_approved",
                  "display": "修订已批准"
                }
              ],
              "next_steps": ["step_3_1"]
            },
            {
              "id": "step_4_3b",
              "action": "manager_reject_revised_quotation",
              "actor": "regional_manager",
              "description": "主管拒绝修订报价",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "修订报价被拒: {rejection_reason}",
                  "title": "❌ 修订报价被拒"
                },
                {
                  "type": "status_change",
                  "target": "quotation",
                  "new_status": "revised_rejected",
                  "display": "修订已拒绝"
                }
              ],
              "next_steps": ["step_4_5"]
            },
            {
              "id": "step_4_5",
              "action": "close_inquiry",
              "actor": "sales_rep",
              "description": "关闭询价（报价被拒或议价失败）",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["regional_manager[region]", "sales_director"],
                  "message": "询价已关闭: {inquiry_number}",
                  "title": "🔚 询价关闭"
                },
                {
                  "type": "status_change",
                  "target": "inquiry",
                  "new_status": "closed",
                  "display": "已关闭"
                }
              ],
              "next_steps": []
            }
          ]
        },

        {
          "id": "stage_5_contract",
          "name": "阶段5: 销售合同 (v2增强版)",
          "steps": [
            {
              "id": "step_5_1",
              "action": "sales_generate_contract",
              "actor": "sales_rep",
              "description": "业务员生成销售合同",
              "data_required": ["contract_terms", "payment_terms", "delivery_terms"],
              "triggers": [
                {
                  "type": "status_change",
                  "target": "contract",
                  "new_status": "draft",
                  "display": "合同草稿"
                }
              ],
              "next_steps": ["step_5_2_check"]
            },
            {
              "id": "step_5_2_check",
              "action": "system_check_contract_amount",
              "actor": "system",
              "description": "系统检查合同金额并路由审批",
              "data_required": ["contract_amount"],
              "condition": {
                "field": "contract_amount",
                "type": "amount_based_routing",
                "branches": [
                  {
                    "condition": "< 20000",
                    "next_step": "step_5_2a_regional",
                    "approver": "regional_manager",
                    "description": "合同金额 < $20,000 → 区域主管审批"
                  },
                  {
                    "condition": ">= 20000",
                    "next_step": "step_5_2b_director",
                    "approver": "sales_director",
                    "description": "合同金额 >= $20,000 → 销售总监审批"
                  }
                ]
              },
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["system"],
                  "message": "正在根据合同金额路由审批流程...",
                  "title": "🔄 智能路由"
                }
              ],
              "next_steps": ["step_5_2a_regional", "step_5_2b_director"]
            },
            {
              "id": "step_5_2a_regional",
              "action": "regional_manager_review_contract",
              "actor": "regional_manager",
              "description": "区域主管审核合同 (金额 < $20,000)",
              "condition": {
                "field": "contract_amount",
                "operator": "<",
                "value": 20000
              },
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "合同已由区域主管审核 (金额 < $20,000)",
                  "title": "✅ 合同审核中"
                }
              ],
              "next_steps": ["step_5_3a_regional", "step_5_3b_regional"]
            },
            {
              "id": "step_5_3a_regional",
              "action": "regional_manager_approve_contract",
              "actor": "regional_manager",
              "description": "区域主管批准合同 (金额 < $20,000)",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "finance"],
                  "message": "合同已由区域主管批准，请发送给客户签署",
                  "title": "✅ 合同批准"
                },
                {
                  "type": "status_change",
                  "target": "contract",
                  "new_status": "approved_by_regional",
                  "display": "区域主管已批准"
                }
              ],
              "next_steps": ["step_5_4"]
            },
            {
              "id": "step_5_3b_regional",
              "action": "regional_manager_reject_contract",
              "actor": "regional_manager",
              "description": "区域主管拒绝合同 (金额 < $20,000)",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep"],
                  "message": "合同被区域主管退回: {rejection_reason}",
                  "title": "❌ 合同被拒"
                }
              ],
              "next_steps": ["step_5_1"]
            },
            {
              "id": "step_5_2b_director",
              "action": "sales_director_review_contract",
              "actor": "sales_director",
              "description": "销售总监审核合同 (金额 >= $20,000)",
              "condition": {
                "field": "contract_amount",
                "operator": ">=",
                "value": 20000
              },
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "regional_manager[region]"],
                  "message": "合同已提交销售总监审核 (金额 >= $20,000)",
                  "title": "📊 高额合同审批"
                }
              ],
              "next_steps": ["step_5_3a_director", "step_5_3b_director"]
            },
            {
              "id": "step_5_3a_director",
              "action": "sales_director_approve_contract",
              "actor": "sales_director",
              "description": "销售总监批准合同 (金额 >= $20,000)",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "finance", "regional_manager[region]"],
                  "message": "高额合同已由销售总监批准，请发送给客户签署",
                  "title": "✅ 销售总监批准"
                },
                {
                  "type": "status_change",
                  "target": "contract",
                  "new_status": "approved_by_director",
                  "display": "销售总监已批准"
                }
              ],
              "next_steps": ["step_5_4"]
            },
            {
              "id": "step_5_3b_director",
              "action": "sales_director_reject_contract",
              "actor": "sales_director",
              "description": "销售总监拒绝合同 (金额 >= $20,000)",
              "data_required": ["rejection_reason"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "regional_manager[region]"],
                  "message": "高额合同被销售总监退回: {rejection_reason}",
                  "title": "❌ 销售总监拒绝"
                }
              ],
              "next_steps": ["step_5_1"]
            },
            {
              "id": "step_5_4",
              "action": "sales_send_contract_to_customer",
              "actor": "sales_rep",
              "description": "业务员发送合同给客户签署",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "请签署销售合同: {contract_number}",
                  "title": "📄 合同待签署"
                },
                {
                  "type": "status_change",
                  "target": "contract",
                  "new_status": "sent_to_customer",
                  "display": "客户待签署"
                }
              ],
              "next_steps": ["step_5_5"]
            },
            {
              "id": "step_5_5",
              "action": "customer_sign_contract",
              "actor": "customer",
              "description": "客户签署合同",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "finance", "regional_manager[region]", "sales_director"],
                  "message": "客户已签署合同: {contract_number}",
                  "title": "✅ 合同已签署"
                },
                {
                  "type": "status_change",
                  "target": "contract",
                  "new_status": "signed",
                  "display": "已签署"
                }
              ],
              "next_steps": ["step_6_1"]
            }
          ]
        },

        {
          "id": "stage_6_payment",
          "name": "阶段6: 付款阶段",
          "steps": [
            {
              "id": "step_6_1",
              "action": "customer_pay_deposit",
              "actor": "customer",
              "description": "客户支付定金",
              "data_required": ["payment_amount", "payment_method", "payment_proof"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["finance", "sales_rep"],
                  "message": "客户已支付定金: {payment_amount}",
                  "title": "💰 定金已收到"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "deposit_paid",
                  "display": "定金已付"
                }
              ],
              "next_steps": ["step_7_1"]
            },
            {
              "id": "step_6_2",
              "action": "customer_pay_balance",
              "actor": "customer",
              "description": "客户支付尾款",
              "data_required": ["payment_amount", "payment_method", "payment_proof"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["finance", "sales_rep", "logistics"],
                  "message": "客户已支付尾款: {payment_amount}",
                  "title": "💰 尾款已收到"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "fully_paid",
                  "display": "已全款"
                }
              ],
              "next_steps": ["step_10_1"]
            }
          ]
        },

        {
          "id": "stage_7_procurement",
          "name": "阶段7: 采购阶段",
          "steps": [
            {
              "id": "step_7_1",
              "action": "procurement_create_po",
              "actor": "procurement",
              "description": "采购员创建采购订单",
              "data_required": ["supplier_id", "product_specs", "quantity", "price"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["supplier"],
                  "message": "新采购订单: {po_number}",
                  "title": "📋 采购订单"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "procurement_initiated",
                  "display": "采购中"
                }
              ],
              "next_steps": ["step_7_2"]
            },
            {
              "id": "step_7_2",
              "action": "supplier_confirm_production",
              "actor": "supplier",
              "description": "供应商确认并安排生产",
              "data_required": ["production_schedule", "estimated_completion"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["procurement", "sales_rep"],
                  "message": "供应商已确认生产: {po_number}",
                  "title": "✅ 生产已安排"
                },
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
          "id": "stage_8_production",
          "name": "阶段8: 生产阶段",
          "steps": [
            {
              "id": "step_8_1",
              "action": "supplier_update_production_progress",
              "actor": "supplier",
              "description": "供应商更新生产进度",
              "data_required": ["progress_percentage", "status_notes"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["procurement", "sales_rep"],
                  "message": "生产进度更新: {progress_percentage}%",
                  "title": "📊 生产进度"
                }
              ],
              "next_steps": ["step_8_2"]
            },
            {
              "id": "step_8_2",
              "action": "supplier_complete_production",
              "actor": "supplier",
              "description": "供应商完成生产",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["procurement", "qc_inspector"],
                  "message": "生产完成，待质检: {po_number}",
                  "title": "✅ 生产完成"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "production_completed",
                  "display": "生产完成"
                }
              ],
              "next_steps": ["step_8_3"]
            },
            {
              "id": "step_8_3",
              "action": "supplier_notify_ready_for_inspection",
              "actor": "supplier",
              "description": "供应商通知产品准备好接受质检",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["qc_inspector"],
                  "message": "产品已准备好质检: {po_number}",
                  "title": "🔍 质检通知"
                }
              ],
              "next_steps": ["step_9_1"]
            }
          ]
        },

        {
          "id": "stage_9_qc",
          "name": "阶段9: 质检阶段",
          "steps": [
            {
              "id": "step_9_1",
              "action": "qc_perform_inspection",
              "actor": "qc_inspector",
              "description": "质检员执行产品质检",
              "data_required": ["inspection_results", "pass_fail_status"],
              "triggers": [
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "qc_in_progress",
                  "display": "质检中"
                }
              ],
              "next_steps": ["step_9_2a", "step_9_2b"]
            },
            {
              "id": "step_9_2a",
              "action": "qc_pass_inspection",
              "actor": "qc_inspector",
              "description": "质检通过",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["procurement", "supplier", "sales_rep", "finance"],
                  "message": "质检通过，可以安排发货: {po_number}",
                  "title": "✅ 质检通过"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "qc_passed",
                  "display": "质检通过"
                }
              ],
              "next_steps": ["step_6_2"]
            },
            {
              "id": "step_9_2b",
              "action": "qc_fail_inspection",
              "actor": "qc_inspector",
              "description": "质检失败",
              "data_required": ["failure_reasons", "corrective_actions"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["procurement", "supplier"],
                  "message": "质检失败，需要整改: {failure_reasons}",
                  "title": "❌ 质检失败"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "qc_failed",
                  "display": "质检失败"
                }
              ],
              "next_steps": ["step_8_1"]
            }
          ]
        },

        {
          "id": "stage_10_logistics",
          "name": "阶段10: 物流阶段",
          "steps": [
            {
              "id": "step_10_1",
              "action": "logistics_arrange_shipping",
              "actor": "logistics",
              "description": "物流员安排发货",
              "data_required": ["shipping_method", "carrier", "estimated_delivery"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer", "sales_rep"],
                  "message": "订单已发货: {tracking_number}",
                  "title": "🚚 订单发货"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "shipped",
                  "display": "已发货"
                }
              ],
              "next_steps": ["step_10_2"]
            },
            {
              "id": "step_10_2",
              "action": "logistics_update_tracking",
              "actor": "logistics",
              "description": "物流员更新物流跟踪信息",
              "data_required": ["tracking_status", "location"],
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer"],
                  "message": "物流更新: {tracking_status}",
                  "title": "📦 物流跟踪"
                }
              ],
              "next_steps": ["step_10_3"]
            },
            {
              "id": "step_10_3",
              "action": "customer_receive_goods",
              "actor": "customer",
              "description": "客户确认收货",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["sales_rep", "finance", "logistics"],
                  "message": "客户已确认收货: {order_number}",
                  "title": "✅ 订单已收货"
                },
                {
                  "type": "status_change",
                  "target": "order",
                  "new_status": "delivered",
                  "display": "已送达"
                }
              ],
              "next_steps": ["step_11_1"]
            }
          ]
        },

        {
          "id": "stage_11_completion",
          "name": "阶段11: 订单完成",
          "steps": [
            {
              "id": "step_11_1",
              "action": "close_order",
              "actor": "sales_rep",
              "description": "关闭订单（交易完成）",
              "triggers": [
                {
                  "type": "notification",
                  "recipients": ["customer", "regional_manager[region]", "sales_director"],
                  "message": "订单已完成: {order_number}，感谢您的业务！",
                  "title": "🎉 订单完成"
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
  }
};

export default businessWorkflowConfigV2;