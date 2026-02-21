// 邮件通知工具 - 模拟邮件发送功能
// 在实际项目中，这里应该调用真实的邮件服务API（如SendGrid、AWS SES等）

import { toast } from 'sonner@2.0.3';

export interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
  type: 'inquiry_received' | 'quotation_sent' | 'quotation_confirmed' | 'order_created' | 'payment_reminder';
}

// 邮件模板生成器
export const generateEmailTemplate = (
  type: EmailTemplate['type'],
  data: any
): EmailTemplate => {
  const templates: Record<EmailTemplate['type'], (data: any) => EmailTemplate> = {
    inquiry_received: (data) => ({
      to: 'admin@cosun.com',
      subject: `新询价通知 - ${data.inquiryNumber}`,
      body: `
亲爱的业务团队，

您收到一条新的客户询价：

询价编号：${data.inquiryNumber}
客户名称：${data.customerName}
客户邮箱：${data.customerEmail}
区域：${data.region}
询价时间：${data.inquiryDate}

产品清单：
${data.products.map((p: any, i: number) => `${i + 1}. ${p.name} - ${p.quantity} pcs - ${p.specs}`).join('\n')}

客户留言：
${data.message || '无'}

请及时处理并回复客户。

登录后台查看详情：https://admin.cosun.com/inquiries

---
福建高盛达富建材有限公司
Cosun Building Materials Co., Ltd.
      `,
      type: 'inquiry_received'
    }),

    quotation_sent: (data) => ({
      to: data.customerEmail,
      subject: `报价单 - ${data.quotationNumber}`,
      body: `
尊敬的 ${data.customerName}，

感谢您的询价！我们已为您准备好报价单。

报价编号：${data.quotationNumber}
报价日期：${data.quotationDate}
有效期至：${data.validUntil}

产品清单及报价：
${data.products.map((p: any, i: number) => 
  `${i + 1}. ${p.name}
     规格：${p.specs}
     数量：${p.quantity.toLocaleString()} pcs
     单价：$${p.unitPrice.toFixed(2)}
     总价：$${p.totalPrice.toLocaleString()}`
).join('\n\n')}

小计：$${data.subtotal.toLocaleString()}
折扣：-$${data.discount.toLocaleString()}
总计：$${data.totalAmount.toLocaleString()} ${data.currency}

付款条款：${data.paymentTerms}
交货条款：${data.deliveryTerms}

备注：${data.notes || '无'}

如有任何问题，请随时联系我们。

登录客户后台确认报价：https://customer.cosun.com/quotations

---
福建高盛达富建材有限公司
Cosun Building Materials Co., Ltd.
Email: sales@cosun.com
Tel: +86 592 1234567
      `,
      type: 'quotation_sent'
    }),

    quotation_confirmed: (data) => ({
      to: 'admin@cosun.com',
      subject: `报价已确认 - ${data.quotationNumber}`,
      body: `
亲爱的业务团队，

客户已确认报价单，可以进入订单流程！

报价编号：${data.quotationNumber}
客户名称：${data.customerName}
确认时间：${data.confirmedDate}
确认人：${data.confirmedBy}

总金额：$${data.totalAmount.toLocaleString()} ${data.currency}

下一步操作：
1. 下推生成订单
2. 准备销售合同
3. 发送付款通知

登录后台处理：https://admin.cosun.com/quotations

---
福建高盛达富建材有限公司
Cosun Building Materials Co., Ltd.
      `,
      type: 'quotation_confirmed'
    }),

    order_created: (data) => ({
      to: data.customerEmail,
      subject: `订单确认 - ${data.orderNumber}`,
      body: `
尊敬的 ${data.customer}，

您的订单已成功创建！

订单编号：${data.orderNumber}
订单日期：${data.date}
预计交货：${data.expectedDelivery}

订单金额：$${data.totalAmount.toLocaleString()} ${data.currency}
付款状态：${data.paymentStatus}
付款条款：${data.paymentTerms}

产品清单：
${data.products.map((p: any, i: number) => 
  `${i + 1}. ${p.name} - ${p.quantity.toLocaleString()} pcs`
).join('\n')}

我们将按计划安排生产，请您按照付款条款完成付款。

登录客户后台查看订单详情：https://customer.cosun.com/orders

---
福建高盛达富建材有限公司
Cosun Building Materials Co., Ltd.
Email: sales@cosun.com
Tel: +86 592 1234567
      `,
      type: 'order_created'
    }),

    payment_reminder: (data) => ({
      to: data.customerEmail,
      subject: `付款提醒 - ${data.orderNumber}`,
      body: `
尊敬的 ${data.customer}，

这是关于订单 ${data.orderNumber} 的付款提醒。

订单金额：$${data.totalAmount.toLocaleString()}
付款条款：${data.paymentTerms}
当前状态：${data.paymentStatus}

为了确保按时交货，请您尽快完成付款。

如已付款，请忽略此邮件。

---
福建高盛达富建材有限公司
Cosun Building Materials Co., Ltd.
      `,
      type: 'payment_reminder'
    })
  };

  return templates[type](data);
};

// 发送邮件（模拟）
export const sendEmail = async (template: EmailTemplate): Promise<boolean> => {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 在实际项目中，这里应该调用邮件服务API
  // 例如：
  // const response = await fetch('/api/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(template)
  // });
  // return response.ok;

  // 模拟成功
  console.log('📧 邮件已发送（模拟）：');
  console.log('收件人：', template.to);
  console.log('主题：', template.subject);
  console.log('内容：', template.body);

  return true;
};

// 发送邮件并显示通知
export const sendEmailWithNotification = async (
  type: EmailTemplate['type'],
  data: any
): Promise<boolean> => {
  try {
    const template = generateEmailTemplate(type, data);
    const success = await sendEmail(template);

    if (success) {
      toast.success('邮件已发送', {
        description: `已发送至 ${template.to}`,
        duration: 3000
      });
      return true;
    } else {
      toast.error('邮件发送失败', {
        description: '请稍后重试或联系技术支持'
      });
      return false;
    }
  } catch (error) {
    console.error('邮件发送错误：', error);
    toast.error('邮件发送失败', {
      description: '系统错误，请联系技术支持'
    });
    return false;
  }
};

// 批量发送邮件
export const sendBulkEmails = async (
  templates: EmailTemplate[]
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const template of templates) {
    const result = await sendEmail(template);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  if (failed === 0) {
    toast.success(`成功发送 ${success} 封邮件`);
  } else {
    toast.warning(`发送完成`, {
      description: `成功 ${success} 封，失败 ${failed} 封`
    });
  }

  return { success, failed };
};
