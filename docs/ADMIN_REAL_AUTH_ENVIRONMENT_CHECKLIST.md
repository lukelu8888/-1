# 管理后台正式认证环境配置与联调清单

目标：
- 不偏离双轨主线
- 将已经完成的正式认证代码骨架，推进到可真实联调、可正式切换

适用范围：
- `test`
- `dual`
- `production`

## 一、双轨主线口径

### `test`

- 继续使用测试账号
- 允许假邮箱、测试密码、本地兜底
- 主要目标：业务流程测试

### `dual`

- 测试账号和真实账号并存
- 入口隔离
- 主要目标：真实认证联调 + 业务回归并行

### `production`

- 测试账号退出正式入口
- 只允许真实可验证身份登录
- 主要目标：正式交付运行

## 二、现有正式认证路径

当前项目已具备代码骨架的正式路径：

1. 公司邮箱邀请与激活
2. 手机号 OTP
3. 企业微信登录骨架
4. WhatsApp 辅助触达骨架

## 三、环境变量清单

### 1. 通用认证模式

| 变量名 | 说明 | `test` | `dual` | `production` |
|---|---|---|---|---|
| `VITE_ADMIN_AUTH_MODE` | 认证模式 | `test` | `dual` | `production` |
| `VITE_ALLOW_TEST_ACCOUNTS` | 是否允许测试账号 | `true` | `true` | `false` |
| `VITE_ALLOW_LOCAL_ADMIN_PASSWORD_FALLBACK` | 本地兜底密码 | `true` | `建议 true` | `false` |
| `VITE_REQUIRE_VERIFIED_EMAIL_FOR_PRODUCTION_LOGIN` | 正式邮箱验证要求 | `false` | `建议 true` | `true` |
| `VITE_REQUIRE_VERIFIED_PHONE_FOR_PRODUCTION_LOGIN` | 正式手机验证要求 | `false` | 按需 | 按需 |

### 2. 邮箱正式邀请

| 变量名 | 说明 |
|---|---|
| `VITE_ENABLE_REAL_EMAIL_ACTIVATION` | 开启真实邮箱邀请能力 |
| `ADMIN_EMAIL_INVITE_REDIRECT_URL` | 邀请邮件回调地址 |
| `ADMIN_EMAIL_INVITE_EXPIRY_HOURS` | 邀请有效时长，默认 168 小时 |
| `SITE_URL` | 系统站点地址 |
| `SUPABASE_URL` | Supabase 地址 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端管理密钥 |

### 3. 手机 OTP

| 变量名 | 说明 |
|---|---|
| `VITE_ENABLE_PHONE_OTP_LOGIN` | 开启手机号 OTP |
| `SUPABASE_URL` | Supabase 地址 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端管理密钥 |

说明：
- 具体短信发送能力依赖 Supabase Phone Auth 或你们绑定的短信服务商
- 若走第三方短信服务，还需补服务商密钥和模板配置

### 4. 企业微信

| 变量名 | 说明 |
|---|---|
| `VITE_ENABLE_ENTERPRISE_WECHAT_LOGIN` | 开启企业微信入口 |
| `ADMIN_ENTERPRISE_WECHAT_CORP_ID` | 企业微信 CorpID |
| `ADMIN_ENTERPRISE_WECHAT_AGENT_ID` | 企业微信 AgentID |
| `ADMIN_ENTERPRISE_WECHAT_CALLBACK_URL` | 企业微信回调地址 |
| `ADMIN_ENTERPRISE_WECHAT_SECRET` | 企业微信应用 Secret，用于回调换取用户身份 |
| `ADMIN_FORMAL_LOGIN_URL` | 企业微信回调成功后跳回的正式登录页地址 |

### 5. WhatsApp 辅助触达

| 变量名 | 说明 |
|---|---|
| `VITE_ENABLE_WHATSAPP_ASSIST_LOGIN` | 开启 WhatsApp 辅助入口 |
| `ADMIN_WHATSAPP_ASSIST_PROVIDER` | 服务商标识 |
| `TWILIO_ACCOUNT_SID` | 如使用 Twilio |
| `WHATSAPP_ACCESS_TOKEN` | 如使用 WhatsApp Business API |

## 四、四条路径分别要完成什么

## 1. 公司邮箱

### 已完成

- 正式账号发放动作已接入真实邮箱邀请接口骨架
- 已能写回：
  - `authUserId`
  - `invitedAt`
  - `inviteExpiresAt`

### 联调前要确认

- Supabase 邮件模板可用
- 邀请回调地址正确
- 发信域名与 SPF/DKIM/DMARC 已处理

### 联调检查项

- 发放正式邮箱邀请后是否真实收到邮件
- 邮件链接能否打开并回到正确页面
- 激活后是否能进入 `email_verified / active`
- 登录是否符合 `dual / production` 规则

## 2. 手机 OTP

### 已完成

- 登录页已支持 `手机号 OTP` 入口
- 已接 Supabase `signInWithOtp / verifyOtp` 骨架

### 联调前要确认

- Supabase Phone Auth 已开启
- 短信服务商已配置
- 区号和号码格式规则已明确

### 联调检查项

- 输入正式绑定手机号能否收到验证码
- 验证码校验通过后是否能建立会话
- 只绑定手机号且主因子为 `phone` 的正式账号能否登录
- `test` 账号是否仍不受影响

## 3. 企业微信

### 已完成

- 登录页已有企业微信入口
- 服务端已能生成企业微信授权地址

### 联调前要确认

- 企业微信应用已创建
- CorpID / AgentID 可用
- 回调域名已在企业微信后台配置

### 联调检查项

- 点击企业微信登录是否跳转授权页
- 授权成功后是否能拿到用户标识
- 是否能正确绑定到现有 `authUserId`
- 是否不会和测试轨账号混淆

## 4. WhatsApp 辅助触达

### 已完成

- 发放正式激活时，如果主因子为 `whatsapp`，会调用辅助触达接口骨架
- 已能写回发送时间、失效时间和备注

### 联调前要确认

- WhatsApp 服务商已选定
- 海外号码格式规范明确
- 模板消息或通知内容已确认

### 联调检查项

- 发放后是否真实触达到 WhatsApp
- 提醒消息是否符合预期
- 是否只作为辅助触达，而不是主登录入口

## 五、分环境建议配置

## `test`

建议：
- 保持测试账号完全可用
- 真实邮箱、OTP、企业微信、WhatsApp 可以关闭或只在少量专用环境试验

## `dual`

建议：
- 开启：
  - 真实邮箱邀请
  - 手机 OTP
  - 企业微信入口
  - WhatsApp 辅助触达
- 保留测试账号入口
- 真实账号和测试账号入口隔离

## `production`

建议：
- 关闭测试账号正式入口
- 关闭本地密码兜底
- 打开真实邮箱邀请
- 打开手机 OTP
- 打开企业微信
- WhatsApp 仅作为海外辅助触达

## 六、联调顺序建议

1. 邮箱邀请
2. 手机 OTP
3. 企业微信
4. WhatsApp 辅助触达

原因：
- 邮箱是最稳定、最容易成为正式第一入口
- 手机 OTP 次之
- 企业微信需要企业配置配合
- WhatsApp 更适合最后做海外辅助通道

## 七、上线前最终确认

| 检查项 | 预期结果 | 结果 | 备注 |
|---|---|---|---|
| `test` 入口仍可跑测试 | 测试不受影响 |  |  |
| `dual` 入口可跑真实联调 | 真实账号可验证 |  |  |
| `production` 已关闭测试账号 | 测试账号不进正式入口 |  |  |
| 邮箱邀请真实可收 | 邮件可达 |  |  |
| 手机 OTP 真实可收 | 验证码可达 |  |  |
| 企业微信可跳转授权 | 入口有效 |  |  |
| WhatsApp 辅助触达可用 | 提醒可达 |  |  |

## 八、主线提醒

这份清单只服务于一个目标：

开发阶段继续用测试账号；
交付前通过 `dual` 模式验证真实账号；
正式上线后测试账号退隐，真实账号接管登录。
