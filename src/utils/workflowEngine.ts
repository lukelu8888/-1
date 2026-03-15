import workflowConfig from '../config/businessWorkflow';
import { sendNotificationToUser } from '../utils/notificationUtils';

/**
 * 🔄 业务流程引擎
 * 基于配置驱动的工作流执行系统
 */

interface WorkflowContext {
  // 当前操作的数据
  inquiry_number?: string;
  quotation_number?: string;
  contract_number?: string;
  order_number?: string;
  po_number?: string;
  
  // 金额相关
  currency?: string;
  amount?: number;
  total_amount?: number;
  
  // 人员信息
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  sales_rep_name?: string;
  sales_rep_email?: string;
  manager_name?: string;
  manager_email?: string;
  
  // 区域
  region?: string;
  
  // 其他
  rejection_reason?: string;
  negotiation_reason?: string;
  target_price?: number;
  timestamp?: string;
  
  // 扩展字段
  [key: string]: any;
}

/**
 * 执行工作流步骤
 */
export async function executeWorkflowStep(
  stepId: string,
  context: WorkflowContext,
  additionalData?: any
): Promise<{
  success: boolean;
  message: string;
  nextSteps: string[];
  statusChanges: Array<{
    target: string;
    status: string;
    display: string;
  }>;
}> {
  console.log(`🔄 [WorkflowEngine] 执行步骤: ${stepId}`, context);
  
  // 查找步骤配置
  const step = findStepById(stepId);
  if (!step) {
    console.error(`❌ 未找到步骤: ${stepId}`);
    return {
      success: false,
      message: `未找到步骤配置: ${stepId}`,
      nextSteps: [],
      statusChanges: []
    };
  }
  
  console.log(`✅ 找到步骤配置:`, step);
  
  const statusChanges: Array<{ target: string; status: string; display: string }> = [];
  
  // 执行所有触发器
  for (const trigger of step.triggers) {
    try {
      if (trigger.type === 'notification') {
        // 发送通知
        await executeNotificationTrigger(trigger, context);
      } else if (trigger.type === 'status_change') {
        // 状态变更
        const change = executeStatusChangeTrigger(trigger, context);
        statusChanges.push(change);
      } else if (trigger.type === 'create_record') {
        // 创建记录
        executeCreateRecordTrigger(trigger, context);
      }
    } catch (error) {
      console.error(`❌ 触发器执行失败:`, trigger, error);
    }
  }
  
  console.log(`✅ 步骤执行完成，下一步:`, step.next_steps);
  
  return {
    success: true,
    message: step.description,
    nextSteps: step.next_steps || [],
    statusChanges
  };
}

/**
 * 查找步骤配置
 */
function findStepById(stepId: string): any {
  const workflow = workflowConfig.workflows.inquiry_to_order;
  for (const stage of workflow.stages) {
    const step = stage.steps.find((s: any) => s.id === stepId);
    if (step) return step;
  }
  return null;
}

/**
 * 执行通知触发器
 */
async function executeNotificationTrigger(trigger: any, context: WorkflowContext) {
  const { recipients, title, message } = trigger;
  
  for (const recipient of recipients) {
    try {
      // 解析接收人
      const recipientEmail = parseRecipient(recipient, context);
      if (!recipientEmail) {
        console.warn(`⚠️ 无法解析接收人: ${recipient}`, context);
        continue;
      }
      
      // 替换消息模板变量
      const finalTitle = replaceTemplateVars(title, context);
      const finalMessage = replaceTemplateVars(message, context);
      
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
        relatedId: context.quotation_number || context.order_number || context.inquiry_number || '',
        relatedType: context.quotation_number ? 'qt' : context.order_number ? 'order' : 'ing',
        sender: context.sales_rep_email || 'system@gaoshengda.com',
        metadata: context
      });
      
    } catch (error) {
      console.error(`❌ 发送通知失败:`, recipient, error);
    }
  }
}

/**
 * 执行状态变更触发器
 */
function executeStatusChangeTrigger(trigger: any, context: WorkflowContext) {
  const { target, new_status, display } = trigger;
  
  const finalDisplay = replaceTemplateVars(display, context);
  
  console.log(`📊 状态变更:`, {
    target,
    status: new_status,
    display: finalDisplay
  });
  
  return {
    target,
    status: new_status,
    display: finalDisplay
  };
}

/**
 * 执行创建记录触发器
 */
function executeCreateRecordTrigger(trigger: any, context: WorkflowContext) {
  const { record_type, data } = trigger;
  
  console.log(`➕ 创建记录:`, {
    type: record_type,
    data: replaceTemplateVarsInObject(data, context)
  });
  
  // 这里可以调用相应的Context来创建记录
  // 例如：创建应收账款记录
  if (record_type === 'receivable') {
    // 调用 FinanceContext 创建应收账款
    console.log('📝 创建应收账款记录');
  }
}

/**
 * 解析接收人
 */
function parseRecipient(recipient: string, context: WorkflowContext): string | string[] {
  // 处理动态接收人
  if (recipient.includes('[region]')) {
    // 例如: sales_rep[region] -> 根据region获取该区域的业务员
    const role = recipient.replace('[region]', '');
    return getRoleEmailsByRegion(role, context.region || '');
  }
  
  // 处理固定角色
  return getRoleEmails(recipient);
}

/**
 * 获取角色邮箱
 */
function getRoleEmails(role: string): string | string[] {
  const roleEmailMap: any = {
    'finance': 'finance@gaoshengda.com',
    'cfo': 'cfo@gaoshengda.com',
    'sales_director': 'sales.director@gaoshengda.com',
    'procurement': 'procurement@gaoshengda.com',
    'customer': '', // 从context获取
    'sales_rep': '', // 从context获取
    'regional_manager': '' // 从context获取
  };
  
  return roleEmailMap[role] || role;
}

/**
 * 根据区域获取角色邮箱
 */
function getRoleEmailsByRegion(role: string, region: string): string {
  // 从localStorage获取该区域的角色用户
  const users = JSON.parse(localStorage.getItem('cosun_users') || '[]');
  
  // 区域和角色的映射
  const roleMap: any = {
    'sales_rep': 'Sales_Rep',
    'regional_manager': 'Regional_Manager'
  };
  
  const targetRole = roleMap[role];
  if (!targetRole) return '';
  
  // 查找该区域的用户
  const user = users.find((u: any) => 
    u.role === targetRole && u.region === region
  );
  
  console.log(`🔍 查找 ${region} 区域的 ${targetRole}:`, user);
  
  return user ? user.email : '';
}

/**
 * 替换模板变量
 */
function replaceTemplateVars(template: string, context: WorkflowContext): string {
  let result = template;
  
  // 替换所有 {variable} 格式的变量
  const matches = template.match(/\{([^}]+)\}/g);
  if (matches) {
    for (const match of matches) {
      const key = match.slice(1, -1); // 去掉 { 和 }
      const value = context[key] || match; // 如果找不到值，保留原始占位符
      result = result.replace(match, String(value));
    }
  }
  
  return result;
}

/**
 * 替换对象中的模板变量
 */
function replaceTemplateVarsInObject(obj: any, context: WorkflowContext): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = replaceTemplateVars(value, context);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * 获取步骤的显示名称
 */
export function getStepDisplayName(stepId: string): string {
  const step = findStepById(stepId);
  return step ? step.description : stepId;
}

/**
 * 获取状态的显示文本
 */
export function getStatusDisplay(target: string, status: string, context?: WorkflowContext): string {
  const statusDefs = workflowConfig.status_definitions as any;
  
  if (statusDefs[target] && statusDefs[target][status]) {
    const display = statusDefs[target][status];
    return context ? replaceTemplateVars(display, context) : display;
  }
  
  return status;
}

/**
 * 验证步骤执行权限
 */
export function canExecuteStep(stepId: string, userRole: string, userRegion: string): boolean {
  const step = findStepById(stepId);
  if (!step) return false;
  
  const roleConfig = (workflowConfig.roles as any)[step.actor];
  if (!roleConfig) return false;
  
  // 检查区域隔离
  if (roleConfig.region_isolated) {
    // 需要检查用户区域是否匹配
    // 这里可以根据具体需求实现
    return true; // 简化处理
  }
  
  return true;
}

/**
 * 快捷方法：客户提交询价
 */
export async function customerSubmitInquiry(context: WorkflowContext) {
  return executeWorkflowStep('step_1_1', context);
}

/**
 * 快捷方法：业务员请求财务审批
 */
export async function salesRequestFinanceApproval(context: WorkflowContext) {
  return executeWorkflowStep('step_2_1', context);
}

/**
 * 快捷方法：财务提供指导
 */
export async function financeProvideGuidance(context: WorkflowContext) {
  return executeWorkflowStep('step_2_2', context);
}

/**
 * 快捷方法：业务员请求主管审批
 */
export async function salesRequestManagerApproval(context: WorkflowContext) {
  return executeWorkflowStep('step_2_4', context);
}

/**
 * 快捷方法：主管批准报价
 */
export async function managerApproveQuotation(context: WorkflowContext) {
  return executeWorkflowStep('step_2_5a', context);
}

/**
 * 快捷方法：主管拒绝报价
 */
export async function managerRejectQuotation(context: WorkflowContext) {
  return executeWorkflowStep('step_2_5b', context);
}

/**
 * 快捷方法：业务员发送报价
 */
export async function salesSendQuotation(context: WorkflowContext) {
  return executeWorkflowStep('step_3_1', context);
}

/**
 * 快捷方法：客户接受报价
 */
export async function customerAcceptQuotation(context: WorkflowContext) {
  return executeWorkflowStep('step_4_1a', context);
}

/**
 * 快捷方法：客户议价
 */
export async function customerNegotiateQuotation(context: WorkflowContext) {
  return executeWorkflowStep('step_4_1b', context);
}

/**
 * 快捷方法：客户拒绝报价
 */
export async function customerRejectQuotation(context: WorkflowContext) {
  return executeWorkflowStep('step_4_1c', context);
}

/**
 * 快捷方法：主管批准议价
 */
export async function managerApproveNegotiation(context: WorkflowContext) {
  return executeWorkflowStep('step_4_2a', context);
}

/**
 * 快捷方法：主管拒绝议价
 */
export async function managerRejectNegotiation(context: WorkflowContext) {
  return executeWorkflowStep('step_4_2b', context);
}

/**
 * 快捷方法：生成销售合同
 */
export async function salesGenerateContract(context: WorkflowContext) {
  return executeWorkflowStep('step_5_1', context);
}

/**
 * 快捷方法：主管批准合同
 */
export async function managerApproveContract(context: WorkflowContext) {
  return executeWorkflowStep('step_5_2a', context);
}

/**
 * 快捷方法：客户确认合同
 */
export async function customerConfirmContract(context: WorkflowContext) {
  return executeWorkflowStep('step_5_4', context);
}

/**
 * 快捷方法：客户上传付款水单
 */
export async function customerUploadPaymentProof(context: WorkflowContext) {
  return executeWorkflowStep('step_6_1', context);
}

/**
 * 快捷方法：财务确认收款
 */
export async function financeConfirmPayment(context: WorkflowContext) {
  return executeWorkflowStep('step_6_2', context);
}

/**
 * 快捷方法：业务员发起采购
 */
export async function salesInitiateProcurement(context: WorkflowContext) {
  return executeWorkflowStep('step_7_1', context);
}
