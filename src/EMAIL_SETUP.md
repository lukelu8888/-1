# 📧 邮件发送功能设置指南

## 功能说明

产品资料库现已支持真实的邮件发送功能。供应商可以通过邮件将产品的技术资料、图纸、BOM清单、规格书和产品照片发送给客户。

---

## 🔧 设置步骤

### 1. 注册Resend账号并获取API密钥

1. 访问 [Resend官网](https://resend.com) 并注册免费账号
2. 登录后，进入 **API Keys** 页面
3. 点击 **Create API Key** 创建新密钥
4. 复制生成的API密钥（格式类似：`re_xxxxxxxxxxxxxxxxx`）

> 💡 免费账号额度：每天可发送100封邮件，足够测试使用

---

### 2. 在Supabase中添加环境变量

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 **Settings** → **Edge Functions** → **Secrets**
4. 点击 **Add Secret**
5. 填写：
   - **Name**: `RESEND_API_KEY`
   - **Value**: 粘贴您刚才复制的Resend API密钥
6. 点击 **Save** 保存

---

### 3. 重启Edge Functions（可选）

如果添加密钥后邮件仍无法发送，可能需要重启Edge Functions：

1. 在Supabase Dashboard中，进入 **Edge Functions**
2. 找到 `make-server-880fd43b` 函数
3. 点击右侧的 **⋮** 菜单 → **Redeploy**

---

## 📨 使用邮件发送功能

### 发送产品资料邮件

1. 在 **供应商Portal** → **技术资料** → **产品资料库** 中
2. 找到要发送的产品，点击 **发送** 按钮
3. 在弹出的对话框中：
   - 选择发送方式：**📧 电子邮件**
   - 填写收件人邮箱地址
   - 确认邮件主题（自动填充，可修改）
   - 选择要发送的附件文件
   - 编辑邮件内容（可选）
4. 点击 **确认发送**

### 邮件内容

发送的邮件将包含：

- ✅ 产品基本信息（编码、名称、规格、类别）
- ✅ 完整的技术文档清单
- ✅ 精美的HTML格式排版
- ✅ 公司品牌信息和联系方式

### 邮件示例

收件人将收到一封包含以下内容的邮件：

```
主题：产品技术资料 - AT-600x600-001 抛光砖

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
福建高盛达富建材有限公司
Fujian Gaoshengdafu Building Materials Co., Ltd.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 产品信息
产品编码：AT-600x600-001
产品名称：抛光砖 / Polished Tile
规格说明：600x600mm 米黄色
产品类别：建筑陶瓷

[邮件内容]

📎 附件文件清单（7个文件）

📐 产品图纸
  - AT-600x600-001技术图纸.pdf (2.5 MB)
  - AT-600x600-001安装图.dwg (1.8 MB)

📋 BOM清单
  - BOM清单-V2.1.xlsx (85 KB)

📄 产品规格书
  - 产品规格书-中英文.pdf (3.2 MB)

📸 产品照片
  - 产品照片-正面.jpg (1.2 MB)
  - 产品照片-侧面.jpg (980 KB)
  - 应用场景图.jpg (2.1 MB)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
福建高盛达富建材有限公司
地址：福建省 | 电话：+86-xxx-xxxx-xxxx
网站：www.gaoshengdafu.com | 邮箱：info@gaoshengdafu.com

本邮件由产品资料管理系统自动发送
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ 常见问题

### Q1: 点击发送后显示"邮件服务未配置"

**A:** 说明 `RESEND_API_KEY` 环境变量未设置。请按照上述步骤在Supabase中添加该密钥。

### Q2: 邮件发送失败，提示"Invalid API key"

**A:** API密钥可能错误或已失效。请检查：
1. 复制的API密钥是否完整
2. API密钥是否已在Resend后台删除
3. 重新生成新的API密钥并更新

### Q3: 收件人没有收到邮件

**A:** 请检查：
1. 收件人邮箱地址是否正确
2. 查看垃圾邮件/促销邮件文件夹
3. 检查Resend Dashboard中的发送日志
4. 确认是否超过免费额度（100封/天）

### Q4: 发件人显示为 "onboarding@resend.dev"

**A:** 这是Resend的测试域名。如需使用自定义域名：
1. 在Resend Dashboard中添加并验证您的域名
2. 修改 `/supabase/functions/server/email-routes.tsx` 文件
3. 将 `from: 'Fujian Gaoshengdafu <onboarding@resend.dev>'` 改为 `from: 'Fujian Gaoshengdafu <noreply@yourdomain.com>'`

---

## 🎯 后续优化建议

- [ ] 添加附件真实文件上传和发送功能
- [ ] 支持邮件模板自定义
- [ ] 记录邮件发送历史
- [ ] 支持批量发送
- [ ] 添加邮件打开和点击追踪

---

## 📞 技术支持

如有任何问题，请查看：
- [Resend官方文档](https://resend.com/docs)
- [Supabase Edge Functions文档](https://supabase.com/docs/guides/functions)

---

**福建高盛达富建材有限公司**  
产品资料管理系统 v1.0
