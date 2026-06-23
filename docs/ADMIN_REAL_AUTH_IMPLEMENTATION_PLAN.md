# 管理后台正式认证真接入实施方案

目标：
- 正式交付后，内部正式用户不再依赖假邮箱和测试账号
- 支持真实邮箱发放与验证
- 支持手机号 OTP
- 支持企业微信绑定登录
- 支持 WhatsApp 作为海外辅助触达与验证渠道

适用范围：
- 管理后台内部账号
- 后续可复用于客户 / 供应商 / 外部门户账号体系

## 一、当前系统现状

### 已具备

- 已有 `test / dual / production` 认证模式切换
- 已有正式账号发放、验证、激活、过期、批量运维的后台骨架
- 已有账号标识变更、Auth 同步、一致性校验和审计
- 已在内部账号模型中预留：
  - `authMode`
  - `activationStatus`
  - `primaryIdentitySource`
  - `emailVerified`
  - `phoneVerified`
  - `wechatOpenId`
  - `enterpriseWechatUserId`
  - `whatsappAccount`

### 当前缺口

- 登录仍主要依赖 `email + password`
- 没有真实“邮箱邀请 / 邮件验证”发送闭环
- 没有真实“手机 OTP”发送与校验
- 没有企业微信 OAuth / SSO 流程
- 没有 WhatsApp 真正的消息触达或验证集成

## 二、主线优先级

### 第一阶段：必须先做

1. 真实邮箱发送与验证
2. 手机 OTP

### 第二阶段：正式内部生态增强

3. 企业微信绑定 / 登录

### 第三阶段：海外辅助能力

4. WhatsApp 消息触达 / 辅助验证

### 当前阶段不建议优先做

- 普通微信作为后台主登录
- WhatsApp 直接做主登录
- 多个第三方登录同时首发

## 三、推荐正式架构

### 身份锚点

- `employeeNo`
  - 业务身份，稳定，不随邮箱手机号变化
- `authUserId`
  - 认证身份，稳定，所有登录入口最终归并到这里

### 登录入口

- 邮箱
- 手机号
- 企业微信

### 辅助联系与触达

- 微信号
- WhatsApp

原则：
- 权限永远绑定 `authUserId + role`
- 邮箱、手机号、企业微信只是登录入口
- 联系方式字段不直接等于权限身份

## 四、分阶段实施

## 阶段 A：真实邮箱发放与验证

### 目标

- 正式账号发放后，系统能真实发送邀请邮件
- 用户点击邮件链接完成验证和激活

### 建议实现

方案优先级：
1. Supabase Auth 邀请 / 邮件验证
2. 自建 server function + 邮件服务（Resend / SendGrid / 阿里云邮件）

### 需要改动

前端：
- `src/components/admin/AdminOrganizationProfile.tsx`
  - 将“发放正式激活”改为调用真实邀请接口
  - 发放成功后记录：
    - `invitedAt`
    - `inviteExpiresAt`
    - `lastInviteChannel = 'email'`

认证前端：
- `src/components/AdminLogin.tsx`
  - 保持生产模式下必须校验 `emailVerified`
  - 增加“邮箱邀请已发送 / 请前往邮件激活”的提示

认证封装：
- `src/hooks/useSupabaseAuth.ts`
  - 新增：
    - `sendAdminEmailInvite(...)`
    - `verifyAdminEmailToken(...)`
    - `resendAdminEmailInvite(...)`

服务端：
- `src/supabase/functions/server/auth-routes.tsx`
  - 新增接口：
    - `POST /auth/send-admin-email-invite`
    - `POST /auth/resend-admin-email-invite`
    - `POST /auth/mark-admin-email-verified`

### 上线条件

- 邮件服务商可用
- 正式域名与回调地址已配置
- 邮件模板已确认

## 阶段 B：手机号 OTP

### 目标

- 内部用户或外部正式用户可用手机号验证码登录

### 建议实现

推荐方式：
- 使用 OTP
- 不建议“手机号 + 固定密码”作为长期正式方案

### 需要改动

前端：
- `src/components/AdminLogin.tsx`
  - 增加手机号登录入口
  - 支持两步流程：
    - 输入手机号
    - 输入验证码

认证封装：
- `src/hooks/useSupabaseAuth.ts`
  - 新增：
    - `sendPhoneOtp(...)`
    - `verifyPhoneOtp(...)`

服务端：
- `src/supabase/functions/server/auth-routes.tsx`
  - 新增接口：
    - `POST /auth/send-phone-otp`
    - `POST /auth/verify-phone-otp`

后台运维：
- `src/components/admin/AdminOrganizationProfile.tsx`
  - 将“标记手机已验证”升级为真实 OTP 验证结果回写

### 依赖

- 国内短信服务商：
  - 阿里云短信
  - 腾讯云短信
- 海外短信服务商：
  - Twilio
  - MessageBird

### 上线条件

- 短信签名 / 模板审核完成
- 国内外号码覆盖策略明确

## 阶段 C：企业微信绑定 / 登录

### 目标

- 内部员工可通过企业微信完成登录或免密绑定

### 建议定位

- 企业微信适合内部员工
- 不建议与普通微信混为一体

### 需要改动

前端：
- `src/components/AdminLogin.tsx`
  - 增加“企业微信登录”按钮
  - 支持 OAuth 回调处理

服务端：
- `src/supabase/functions/server/auth-routes.tsx`
  - 新增：
    - `GET /auth/enterprise-wechat/start`
    - `GET /auth/enterprise-wechat/callback`
    - `POST /auth/link-enterprise-wechat`

后台运维：
- `src/components/admin/AdminOrganizationProfile.tsx`
  - 将 `enterpriseWechatUserId` 从手工字段升级为真实绑定结果

### 上线条件

- 企业微信应用已开通
- 回调域名与应用配置已完成

## 阶段 D：WhatsApp 辅助触达

### 目标

- 海外用户或合作方通过 WhatsApp 收到邀请或验证提醒

### 建议定位

- 第一阶段只做：
  - 邀请通知
  - 激活提醒
  - OTP 辅助触达
- 不建议第一阶段直接做 WhatsApp 主登录

### 需要改动

服务端：
- `src/supabase/functions/server/auth-routes.tsx`
  - 新增：
    - `POST /auth/send-whatsapp-invite`
    - `POST /auth/send-whatsapp-reminder`

后台运维：
- `src/components/admin/AdminOrganizationProfile.tsx`
  - 增加 WhatsApp 发放记录 / 重发记录

### 依赖

- WhatsApp Business API
- 第三方服务商（如 Twilio WhatsApp）

## 五、建议开发顺序

### Sprint 1

- 真实邮箱邀请发送
- 邮箱激活回调
- 后台发放与重发联动真实接口

### Sprint 2

- 手机 OTP 发送与校验
- 登录页手机号入口
- OTP 成功后的账号归并

### Sprint 3

- 企业微信 OAuth 绑定 / 登录
- 企业微信回调落库

### Sprint 4

- WhatsApp 通知与提醒
- 海外账号辅助激活流程

## 六、代码改动主清单

### 前端

- `src/components/AdminLogin.tsx`
- `src/hooks/useSupabaseAuth.ts`
- `src/components/admin/AdminOrganizationProfile.tsx`
- `src/config/adminPortalPolicy.ts`

### 服务端

- `src/supabase/functions/server/auth-routes.tsx`

### 数据模型 / Migration

建议新增正式认证表：
- `admin_auth_invites`
- `admin_phone_otp_logs`
- `admin_social_binding_logs`

建议字段：
- `employee_id`
- `auth_user_id`
- `identity_source`
- `target_value`
- `status`
- `sent_at`
- `verified_at`
- `expires_at`
- `operator_email`

## 七、交付建议

### 正式首发建议

- 必上：
  - 真实邮箱邀请
  - 手机 OTP

- 可后置：
  - 企业微信
  - WhatsApp

### 业务建议

- 内部员工优先使用：
  - 公司邮箱
  - 企业微信
  - 手机 OTP 作为备用

- 海外正式用户优先使用：
  - 公司邮箱
  - 手机 OTP
  - WhatsApp 作为通知通道

## 八、结论

这条主线的正确推进方式不是同时做 4 种认证，而是：

1. 先把 `真实邮箱发送与验证` 做通
2. 再把 `手机 OTP` 做通
3. 然后再接 `企业微信`
4. 最后做 `WhatsApp 辅助触达`

当前项目已经完成了“后台治理骨架”，下一阶段应正式进入“真实认证接入实施”。
