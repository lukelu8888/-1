import { Hono } from 'npm:hono';

/**
 * 🔥 邮件发送路由
 * - 支持发送产品资料邮件
 * - 使用Resend API发送邮件
 */

const emailRoutes = new Hono();

// 📧 发送产品资料邮件
emailRoutes.post('/make-server-880fd43b/send-product-materials', async (c) => {
  try {
    console.log('📧 收到邮件发送请求...');
    
    const body = await c.req.json();
    const { 
      to, 
      subject, 
      message, 
      productInfo,
      files 
    } = body;

    console.log(`收件人: ${to}, 主题: ${subject}`);

    // 验证必填字段
    if (!to || !subject) {
      console.error('❌ 缺少必填字段');
      return c.json({ 
        success: false, 
        error: '缺少必填字段：收件人或主题' 
      }, 400);
    }

    // 获取Resend API Key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY environment variable is not set');
      console.error('💡 请在Supabase Dashboard中设置RESEND_API_KEY环境变量');
      console.error('💡 详细说明请查看 /EMAIL_SETUP.md 文件');
      return c.json({ 
        success: false, 
        error: '邮件服务未配置：RESEND_API_KEY环境变量未设置。\n\n请按照以下步骤设置：\n1. 访问 https://resend.com 注册账号\n2. 获取API密钥\n3. 在Supabase Dashboard → Settings → Edge Functions → Secrets 中添加 RESEND_API_KEY\n\n详细说明请查看项目根目录的 EMAIL_SETUP.md 文件'
      }, 500);
    }

    console.log('✅ RESEND_API_KEY已配置');

    // 构建邮件HTML内容
    const emailHtml = `

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F96302 0%, #FF8C42 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .product-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .product-info h3 { margin: 0 0 10px 0; color: #F96302; }
    .product-detail { display: grid; grid-template-columns: 120px 1fr; gap: 8px; margin: 5px 0; font-size: 14px; }
    .product-detail strong { color: #666; }
    .files-section { margin: 20px 0; }
    .file-category { margin: 15px 0; }
    .file-category h4 { color: #F96302; font-size: 14px; margin-bottom: 8px; }
    .file-item { background: #f8f9fa; padding: 8px 12px; margin: 4px 0; border-left: 3px solid #F96302; font-size: 13px; }
    .message-content { white-space: pre-wrap; line-height: 1.8; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    .footer strong { color: #F96302; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">福建高盛达富建材有限公司</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Fujian Gaoshengdafu Building Materials Co., Ltd.</p>
    </div>
    
    <div class="content">
      <div class="product-info">
        <h3>📦 产品信息</h3>
        <div class="product-detail">
          <strong>产品编码：</strong>
          <span>${productInfo.code}</span>
        </div>
        <div class="product-detail">
          <strong>产品名称：</strong>
          <span>${productInfo.name} / ${productInfo.nameEn}</span>
        </div>
        <div class="product-detail">
          <strong>规格说明：</strong>
          <span>${productInfo.specification}</span>
        </div>
        <div class="product-detail">
          <strong>产品类别：</strong>
          <span>${productInfo.category}</span>
        </div>
      </div>

      <div class="message-content">
${message || `尊敬的客户，

附件是产品 ${productInfo.code} - ${productInfo.name} 的完整技术资料，请查收。

如有任何问题，欢迎随时联系我们。

此致
敬礼！`}
      </div>

      ${files && files.length > 0 ? `
      <div class="files-section">
        <h3 style="color: #F96302;">📎 附件文件清单（${files.length}个文件）</h3>
        
        ${files.filter((f: any) => f.category === 'drawings').length > 0 ? `
        <div class="file-category">
          <h4>📐 产品图纸</h4>
          ${files.filter((f: any) => f.category === 'drawings').map((file: any) => `
          <div class="file-item">
            ${file.name} <span style="color: #999; float: right;">${file.size}</span>
          </div>
          `).join('')}
        </div>
        ` : ''}

        ${files.filter((f: any) => f.category === 'bom').length > 0 ? `
        <div class="file-category">
          <h4>📋 BOM清单</h4>
          ${files.filter((f: any) => f.category === 'bom').map((file: any) => `
          <div class="file-item">
            ${file.name} <span style="color: #999; float: right;">${file.size}</span>
          </div>
          `).join('')}
        </div>
        ` : ''}

        ${files.filter((f: any) => f.category === 'specs').length > 0 ? `
        <div class="file-category">
          <h4>📄 产品规格书</h4>
          ${files.filter((f: any) => f.category === 'specs').map((file: any) => `
          <div class="file-item">
            ${file.name} <span style="color: #999; float: right;">${file.size}</span>
          </div>
          `).join('')}
        </div>
        ` : ''}

        ${files.filter((f: any) => f.category === 'images').length > 0 ? `
        <div class="file-category">
          <h4>📸 产品照片</h4>
          ${files.filter((f: any) => f.category === 'images').map((file: any) => `
          <div class="file-item">
            ${file.name} <span style="color: #999; float: right;">${file.size}</span>
          </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <strong>福建高盛达富建材有限公司</strong><br>
      地址：福建省 | 电话：+86-xxx-xxxx-xxxx<br>
      网站：www.gaoshengdafu.com | 邮箱：info@gaoshengdafu.com<br>
      <p style="margin-top: 10px; color: #999;">本邮件由产品资料管理系统自动发送</p>
    </div>
  </div>
</body>
</html>
    `;

    // 调用Resend API发送邮件
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fujian Gaoshengdafu <onboarding@resend.dev>', // Resend测试域名
        to: [to],
        subject: subject,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', result);
      return c.json({ 
        success: false, 
        error: `邮件发送失败: ${result.message || '未知错误'}`,
        details: result 
      }, 500);
    }

    console.log('✅ Email sent successfully:', result);

    return c.json({ 
      success: true, 
      message: '邮件发送成功',
      emailId: result.id,
      recipient: to
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return c.json({ 
      success: false, 
      error: `邮件发送异常: ${error.message}` 
    }, 500);
  }
});

export default emailRoutes;