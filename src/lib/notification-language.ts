/**
 * 获取字段标签（自动判断语言）
 */
export function getFieldLabel(
  fieldKey: string,
  viewerRole: string,
  formOwnerRole?: string
): string {
  const field = commonFieldLabels[fieldKey];
  if (!field) return fieldKey; // 如果没有定义，返回原始key
  
  const language = getFieldLabelLanguage(viewerRole, formOwnerRole);
  return translateFieldLabel(field, language);
}

/**
 * 动态生成通知内容
 * 
 * @param notifier - 通知发送者姓名
 * @param recipients - 被通知人列表
 * @param stepTitle - 步骤标题（如"提交询盘"、"报价"等）
 * @param language - 语言 'zh' | 'en'
 * @returns 生成的通知内容
 */
export function generateNotificationMessage(
  notifier: string,
  recipients: string[],
  stepTitle?: string,
  language: 'zh' | 'en' = 'zh'
): string {
  if (!recipients || recipients.length === 0) {
    return language === 'en' 
      ? 'No notification sent' 
      : '暂无通知';
  }

  const recipientCount = recipients.length;
  
  if (language === 'en') {
    // 英文通知内容
    if (recipientCount === 1) {
      // 单人通知
      const recipient = recipients[0];
      if (stepTitle) {
        return `${stepTitle} notification sent to ${recipient}`;
      }
      return `Notification sent to ${recipient}`;
    } else {
      // 多人通知
      if (stepTitle) {
        return `${stepTitle} notification sent to ${recipientCount} recipients`;
      }
      return `Notification sent to ${recipientCount} recipients`;
    }
  } else {
    // 中文通知内容
    if (recipientCount === 1) {
      // 单人通知
      const recipient = recipients[0];
      if (stepTitle) {
        return `已向${recipient}发送${stepTitle}通知`;
      }
      return `已向${recipient}发送通知`;
    } else {
      // 多人通知
      if (stepTitle) {
        return `已向${recipientCount}位人员发送${stepTitle}通知`;
      }
      return `已向${recipientCount}位人员发送通知`;
    }
  }
}

/**
 * 根据步骤获取通知标题（用于生成通知内容）
 */
export const stepNotificationTitles: Record<string, { zh: string; en: string }> = {
  '提交询盘': { zh: '询盘', en: 'Inquiry' },
  '收到询盘': { zh: '询价处理', en: 'Inquiry Processing' },
  '报价': { zh: '报价', en: 'Quotation' },
  '收到报价': { zh: '报价审核', en: 'Quotation Review' },
  '签订合同': { zh: '合同签订', en: 'Contract Signing' },
  '收到合同': { zh: '合同确认', en: 'Contract Confirmation' },
  '采购下单': { zh: '采购订单', en: 'Purchase Order' },
  '生产': { zh: '生产', en: 'Production' },
  '质检': { zh: '质检', en: 'Quality Inspection' },
  '出货通知': { zh: '出货', en: 'Shipment' },
  '报关': { zh: '报关', en: 'Customs Declaration' },
  '海运提单': { zh: '提单', en: 'Bill of Lading' },
};