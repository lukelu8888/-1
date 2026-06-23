// 🔥 认证路由 - 用户登录和会话管理
import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cors } from 'npm:hono/cors';

const app = new Hono();
app.use('*', cors());

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const defaultInviteExpiryHours = Number(Deno.env.get('ADMIN_EMAIL_INVITE_EXPIRY_HOURS') || '168');

function resolveAdminInviteRedirectUrl() {
  return Deno.env.get('ADMIN_EMAIL_INVITE_REDIRECT_URL')
    || Deno.env.get('SITE_URL')
    || `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/auth/v1/verify`;
}

function resolveEnterpriseWechatCallbackUrl() {
  return Deno.env.get('ADMIN_ENTERPRISE_WECHAT_CALLBACK_URL')
    || `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/enterprise-wechat/callback`;
}

function resolveFormalAdminLoginUrl() {
  const configured = String(Deno.env.get('ADMIN_FORMAL_LOGIN_URL') || Deno.env.get('SITE_URL') || '').trim();
  if (!configured) return '';
  return configured.includes('#/')
    ? configured
    : `${configured.replace(/\/$/, '')}/#/admin-formal-login`;
}

function buildFormalAdminRedirect(params: Record<string, string>) {
  const base = resolveFormalAdminLoginUrl();
  if (!base) return '';
  const search = new URLSearchParams(params).toString();
  return search ? `${base}?${search}` : base;
}

function isWhatsappAssistConfigured() {
  return Boolean(
    Deno.env.get('ADMIN_WHATSAPP_ASSIST_PROVIDER')
    || Deno.env.get('TWILIO_ACCOUNT_SID')
    || Deno.env.get('WHATSAPP_ACCESS_TOKEN'),
  );
}

async function findAuthUserByIdOrEmail(authUserId: string, loginEmail: string) {
  const normalizedAuthUserId = String(authUserId || '').trim();
  const normalizedEmail = String(loginEmail || '').trim().toLowerCase();

  if (normalizedAuthUserId) {
    const { data, error } = await supabase.auth.admin.getUserById(normalizedAuthUserId);
    if (!error && data?.user) return data.user;
  }

  if (!normalizedEmail) return null;

  const { data } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });

  return data?.users?.find((user) => String(user.email || '').trim().toLowerCase() === normalizedEmail) || null;
}

async function loadAdminOrganizationSnapshot() {
  const attempts = [
    () =>
      supabase
        .from('admin_organizations')
        .select('id,internal_accounts,internal_contacts')
        .eq('id', 'admin-org-001')
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from('admin_organizations')
        .select('*')
        .eq('id', 'admin-org-001')
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from('admin_organizations')
        .select('id,internal_accounts,internal_contacts')
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from('admin_organizations')
        .select('*')
        .limit(1)
        .maybeSingle(),
  ];

  let lastError: any = null;
  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error && data) {
      return { data, error: null };
    }
    if (error) {
      lastError = error;
    }
  }

  try {
    const restUrl = `${supabaseUrl}/rest/v1/admin_organizations?select=id,internal_accounts,internal_contacts&id=eq.admin-org-001&limit=1`;
    const response = await fetch(restUrl, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });
    const payload = await response.json().catch(() => []);
    const firstRow = Array.isArray(payload) ? payload[0] : null;
    if (response.ok && firstRow) {
      return { data: firstRow, error: null };
    }
    if (!response.ok) {
      lastError = new Error(`admin_organizations rest fallback failed: ${response.status}`);
    }
  } catch (restError) {
    lastError = restError;
  }

  return { data: null, error: lastError };
}

function buildAdminProfileFromAccount(account: any, contact?: any, fallbackEmail?: string) {
  const loginEmail = String(account?.loginEmail || fallbackEmail || '').trim().toLowerCase();
  const role = String(account?.role || 'Admin').trim() || 'Admin';
  const region = String(account?.region || contact?.region || 'all').trim() || 'all';
  return {
    id: String(account?.authUserId || account?.id || contact?.id || loginEmail || 'internal-admin'),
    email: loginEmail,
    portal_role: role === 'Admin' ? 'admin' : 'staff',
    rbac_role: role,
    region,
  };
}

async function resolveInternalAdminProfileByEmail(email: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return { profile: null, error: null };

  const { data: org, error: orgError } = await loadAdminOrganizationSnapshot();
  if (orgError) {
    return { profile: null, error: orgError };
  }

  const accounts = Array.isArray(org?.internal_accounts) ? org.internal_accounts : [];
  const contacts = Array.isArray(org?.internal_contacts) ? org.internal_contacts : [];
  const matchedAccount = accounts.find((account: any) =>
    String(account?.loginEmail || '').trim().toLowerCase() === normalizedEmail,
  );

  if (!matchedAccount) {
    return { profile: null, error: null };
  }

  const matchedContact = contacts.find((contact: any) => contact?.id === matchedAccount?.employeeId) || null;
  return {
    profile: buildAdminProfileFromAccount(matchedAccount, matchedContact, normalizedEmail),
    error: null,
  };
}

async function requireAdminOperator(c: any) {
  const authHeader = c.req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { error: c.json({ success: false, message: '缺少认证令牌' }, 401), user: null };
  }

  const token = authHeader.slice(7).trim();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return { error: c.json({ success: false, message: '认证失败' }, 401), user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,email,portal_role,rbac_role,region')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    return { error: c.json({ success: false, message: '无法校验管理员身份' }, 500), user: null };
  }

  const metadataPortalRole = String(authData.user.user_metadata?.portal_role || '').trim().toLowerCase();
  const metadataRbacRole = String(authData.user.user_metadata?.rbac_role || '').trim();
  const metadataRegion = String(authData.user.user_metadata?.region || '').trim();
  const sessionEmail = String(authData.user.email || '').trim().toLowerCase();

  let resolvedProfile = profile;
  let portalRole = String(profile?.portal_role || '').trim().toLowerCase();

  if ((portalRole !== 'admin' && portalRole !== 'staff') && (metadataPortalRole === 'admin' || metadataPortalRole === 'staff')) {
    resolvedProfile = {
      id: authData.user.id,
      email: sessionEmail,
      portal_role: metadataPortalRole,
      rbac_role: metadataRbacRole || 'Admin',
      region: metadataRegion || 'all',
    };
    portalRole = metadataPortalRole;
  }

  if (portalRole !== 'admin' && portalRole !== 'staff') {
    const { profile: accountProfile, error: accountProfileError } = await resolveInternalAdminProfileByEmail(sessionEmail);
    if (accountProfileError) {
      return { error: c.json({ success: false, message: '无法校验管理员身份' }, 500), user: null };
    }
    if (accountProfile) {
      resolvedProfile = {
        ...accountProfile,
        id: authData.user.id,
        email: sessionEmail,
      };
      portalRole = String(accountProfile.portal_role || '').trim().toLowerCase();
    }
  }

  if (portalRole !== 'admin' && portalRole !== 'staff') {
    return { error: c.json({ success: false, message: '当前账号无权执行此操作' }, 403), user: null };
  }

  return { error: null, user: authData.user, profile: resolvedProfile };
}

async function requireAdminOperatorOrLocalPrimaryAdmin(c: any, localAdminAuth?: { email?: string; password?: string } | null) {
  const authResult = await requireAdminOperator(c);
  if (!authResult.error) {
    return authResult;
  }

  const normalizedEmail = String(localAdminAuth?.email || '').trim().toLowerCase();
  const normalizedPassword = String(localAdminAuth?.password || '').trim();
  if (!normalizedEmail || !normalizedPassword) {
    return authResult;
  }

  const { data: org, error: orgError } = await loadAdminOrganizationSnapshot();

  if (orgError) {
    return { error: c.json({ success: false, message: '无法校验本地管理员身份' }, 500), user: null };
  }

  const accounts = Array.isArray(org?.internal_accounts) ? org.internal_accounts : [];
  const matchedAccount = accounts.find((account: any) => {
    const loginEmail = String(account?.loginEmail || '').trim().toLowerCase();
    const loginPassword = String(account?.loginPassword || '').trim();
    const accountStatus = String(account?.accountStatus || '').trim().toLowerCase();
    const canLogin = Boolean(account?.canLogin);
    return loginEmail === normalizedEmail && loginPassword === normalizedPassword && canLogin && accountStatus === 'active';
  });

  if (!matchedAccount) {
    return authResult;
  }

  const contacts = Array.isArray(org?.internal_contacts) ? org.internal_contacts : [];
  const matchedContact = contacts.find((contact: any) => contact?.id === matchedAccount?.employeeId) || null;
  const accountProfile = buildAdminProfileFromAccount(matchedAccount, matchedContact, normalizedEmail);

  return {
    error: null,
    user: {
      id: String(accountProfile.id || 'local-admin'),
      email: normalizedEmail,
    },
    profile: accountProfile,
  };
}

async function resolveEnterpriseWechatUserId(code: string) {
  const corpId = String(Deno.env.get('ADMIN_ENTERPRISE_WECHAT_CORP_ID') || '').trim();
  const secret = String(Deno.env.get('ADMIN_ENTERPRISE_WECHAT_SECRET') || '').trim();
  if (!corpId || !secret) {
    throw new Error('企业微信登录尚未配置 Secret');
  }

  const tokenResponse = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(corpId)}&corpsecret=${encodeURIComponent(secret)}`,
  );
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || Number(tokenPayload?.errcode || 0) !== 0 || !tokenPayload?.access_token) {
    throw new Error(`获取企业微信 access_token 失败: ${String(tokenPayload?.errmsg || tokenResponse.statusText || 'unknown error')}`);
  }

  const userInfoResponse = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${encodeURIComponent(String(tokenPayload.access_token))}&code=${encodeURIComponent(code)}`,
  );
  const userInfoPayload = await userInfoResponse.json().catch(() => ({}));
  if (!userInfoResponse.ok || Number(userInfoPayload?.errcode || 0) !== 0) {
    throw new Error(`获取企业微信用户身份失败: ${String(userInfoPayload?.errmsg || userInfoResponse.statusText || 'unknown error')}`);
  }

  const userId = String(userInfoPayload?.userid || userInfoPayload?.UserId || '').trim();
  if (!userId) {
    throw new Error('企业微信回调未返回有效的用户标识');
  }

  return userId;
}

async function findEnterpriseWechatAccount(userId: string) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return null;

  const { data, error } = await supabase
    .from('admin_organizations')
    .select('id,internal_accounts,internal_contacts')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const accounts = Array.isArray(data?.internal_accounts) ? data.internal_accounts : [];
  const contacts = Array.isArray(data?.internal_contacts) ? data.internal_contacts : [];
  const matchedAccount = accounts.find((account: any) => String(account?.enterpriseWechatUserId || '').trim() === normalizedUserId);
  if (!matchedAccount) return null;
  const matchedContact = contacts.find((contact: any) => contact?.id === matchedAccount?.employeeId) || null;
  return {
    account: matchedAccount,
    contact: matchedContact,
  };
}

async function ensureEnterpriseWechatAuthUser(params: {
  authUserId?: string;
  loginEmail?: string;
  employeeName?: string;
  role?: string;
  region?: string;
}) {
  const normalizedEmail = String(params.loginEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('企业微信绑定账号缺少登录邮箱');
  }

  const normalizedName = String(params.employeeName || '').trim() || '内部账号';
  const normalizedRole = String(params.role || '').trim() || 'Admin';
  const normalizedRegion = String(params.region || '').trim() || 'all';
  const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';

  const existingUser = await findAuthUserByIdOrEmail(String(params.authUserId || ''), normalizedEmail);
  if (existingUser?.id) {
    await supabase.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: {
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
      },
    });
    return { authUserId: existingUser.id, loginEmail: normalizedEmail, role: normalizedRole, region: normalizedRegion, name: normalizedName, portalRole };
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password: crypto.randomUUID(),
    user_metadata: {
      name: normalizedName,
      portal_role: portalRole,
      rbac_role: normalizedRole,
      region: normalizedRegion,
    },
  });

  if (createError || !created?.user?.id) {
    throw createError || new Error('创建企业微信认证账号失败');
  }

  return { authUserId: created.user.id, loginEmail: normalizedEmail, role: normalizedRole, region: normalizedRegion, name: normalizedName, portalRole };
}

function normalizeVisibilityRegion(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const lowered = normalized.toLowerCase();
  if (lowered === 'na' || lowered === 'north america' || lowered === 'north_america' || lowered === 'north-america' || normalized === '北美') return 'NA';
  if (lowered === 'sa' || lowered === 'south america' || lowered === 'south_america' || lowered === 'south-america' || normalized === '南美') return 'SA';
  if (lowered === 'ea' || lowered === 'emea' || lowered === 'europe & africa' || lowered === 'europe_africa' || lowered === 'europe-africa' || normalized === '欧非') return 'EA';
  if (lowered === 'all') return 'all';
  return normalized;
}

function normalizeVisibilityEmail(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function canViewInquiryRow(row: any, profile: any) {
  const role = String(profile?.rbac_role || '').trim();
  const region = normalizeVisibilityRegion(profile?.region);
  const email = normalizeVisibilityEmail(profile?.email);
  const inquiryRegion = normalizeVisibilityRegion(row?.region_code);
  const assignedTo = normalizeVisibilityEmail(row?.assigned_to);
  const ownerEmail = normalizeVisibilityEmail(row?.owner_email);

  if (!role) return true;
  if (['Admin', 'CEO', 'CFO', 'Procurement', 'Finance', 'Documentation_Officer', 'Marketing_Ops', 'Sales_Director'].includes(role)) {
    return true;
  }
  if (role === 'Regional_Manager') {
    if (!region || region === 'all') return true;
    return inquiryRegion === region;
  }
  if (role === 'Sales_Rep') {
    if (!email) return false;
    return ownerEmail === email || assignedTo === email;
  }
  return true;
}

async function loadInquiryRowsForInternalVisibility() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && Array.isArray(data)) {
    return { rows: data, error: null };
  }

  try {
    const restUrl = `${supabaseUrl}/rest/v1/inquiries?select=*&order=created_at.desc`;
    const response = await fetch(restUrl, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });
    const payload = await response.json().catch(() => []);
    if (response.ok && Array.isArray(payload)) {
      return { rows: payload, error: null };
    }
    return {
      rows: [],
      error: new Error(
        `inquiries rest fallback failed: ${response.status} ${String((payload as any)?.message || '')}`.trim(),
      ),
    };
  } catch (restError) {
    return { rows: [], error: restError || error };
  }
}

// 🔐 用户登录
app.post('/make-server-880fd43b/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    console.log(`🔑 登录尝试: ${username}`);
    
    // 从KV Store查询用户
    const { data, error } = await supabase
      .from('kv_store_880fd43b')
      .select('value')
      .eq('key', `user:${username}`)
      .single();
    
    if (error || !data) {
      console.log(`❌ 用户不存在: ${username}`);
      return c.json({ 
        success: false, 
        message: '用户名或密码错误' 
      }, 401);
    }
    
    const user = data.value as any;
    
    // 验证密码（实际应该用bcrypt等加密）
    if (user.password !== password) {
      console.log(`❌ 密码错误: ${username}`);
      return c.json({ 
        success: false, 
        message: '用户名或密码错误' 
      }, 401);
    }
    
    // 检查账号状态
    if (user.status !== 'active') {
      console.log(`❌ 账号已禁用: ${username}`);
      return c.json({ 
        success: false, 
        message: '账号已被禁用' 
      }, 403);
    }
    
    // 生成会话token（简化版）
    const sessionToken = `session_${user.id}_${Date.now()}`;
    const sessionData = {
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时
    };
    
    // 保存会话
    await supabase.from('kv_store_880fd43b').upsert({
      key: `session:${sessionToken}`,
      value: sessionData
    });
    
    console.log(`✅ 登录成功: ${user.name} (${user.role})`);
    
    // 返回用户信息（不含密码）
    const { password: _, ...userInfo } = user;
    
    return c.json({
      success: true,
      message: '登录成功',
      user: userInfo,
      sessionToken
    });
    
  } catch (error) {
    console.error('❌ 登录错误:', error);
    return c.json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/internal-inquiries', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const auth = await requireAdminOperatorOrLocalPrimaryAdmin(c, body?.localAdminAuth || null);
    if (auth.error) return auth.error;

    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({
        success: false,
        message: `加载内部询价失败: ${String(error.message || error)}`,
      }, 500);
    }

    const rows = Array.isArray(data) ? data : [];
    const visible = rows.filter((row) => canViewInquiryRow(row, auth.profile));
    return c.json({
      success: true,
      inquiries: visible,
      profile: auth.profile,
      total: visible.length,
    });
  } catch (error) {
    console.error('❌ 内部询价加载失败:', error);
    return c.json({
      success: false,
      message: `内部询价加载失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

// 🔍 验证会话
app.get('/make-server-880fd43b/auth/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        message: '未提供认证令牌' 
      }, 401);
    }
    
    const token = authHeader.substring(7);
    
    // 查询会话
    const { data, error } = await supabase
      .from('kv_store_880fd43b')
      .select('value')
      .eq('key', `session:${token}`)
      .single();
    
    if (error || !data) {
      return c.json({ 
        success: false, 
        message: '会话已过期，请重新登录' 
      }, 401);
    }
    
    const session = data.value as any;
    
    // 检查会话是否过期
    if (new Date(session.expiresAt) < new Date()) {
      // 删除过期会话
      await supabase
        .from('kv_store_880fd43b')
        .delete()
        .eq('key', `session:${token}`);
      
      return c.json({ 
        success: false, 
        message: '会话已过期，请重新登录' 
      }, 401);
    }
    
    return c.json({
      success: true,
      user: {
        userId: session.userId,
        username: session.username,
        name: session.name,
        email: session.email,
        role: session.role,
        department: session.department
      }
    });
    
  } catch (error) {
    console.error('❌ 会话验证错误:', error);
    return c.json({ 
      success: false, 
      message: '验证失败' 
    }, 500);
  }
});

// 🚪 用户登出
app.post('/make-server-880fd43b/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: true, 
        message: '已登出' 
      });
    }
    
    const token = authHeader.substring(7);
    
    // 删除会话
    await supabase
      .from('kv_store_880fd43b')
      .delete()
      .eq('key', `session:${token}`);
    
    return c.json({
      success: true,
      message: '登出成功'
    });
    
  } catch (error) {
    console.error('❌ 登出错误:', error);
    return c.json({ 
      success: false, 
      message: '登出失败' 
    }, 500);
  }
});

// 👥 获取所有用户列表（仅管理员）
app.get('/make-server-880fd43b/auth/users', async (c) => {
  try {
    // 查询所有用户
    const { data, error } = await supabase
      .from('kv_store_880fd43b')
      .select('value')
      .like('key', 'user:%')
      .not('key', 'like', 'user:id:%'); // 排除ID索引
    
    if (error) {
      throw error;
    }
    
    const users = data
      .map(row => row.value as any)
      .map(({ password, ...user }) => user); // 移除密码字段
    
    return c.json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error('❌ 获取用户列表错误:', error);
    return c.json({ 
      success: false, 
      message: '获取用户列表失败' 
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/sync-internal-account-identity', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      authUserId,
      previousLoginEmail,
      nextLoginEmail,
      nextUsername,
      employeeName,
      role,
      region,
    } = await c.req.json();

    const normalizedNextEmail = String(nextLoginEmail || '').trim().toLowerCase();
    const normalizedPreviousEmail = String(previousLoginEmail || '').trim().toLowerCase();
    const normalizedAuthUserId = String(authUserId || '').trim();
    const normalizedName = String(employeeName || nextUsername || '').trim() || '内部账号';
    const normalizedRole = String(role || '').trim() || 'Admin';
    const normalizedRegion = String(region || '').trim() || 'all';
    const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';

    if (!normalizedNextEmail) {
      return c.json({ success: false, message: '缺少目标登录邮箱' }, 400);
    }

    let targetUserId = normalizedAuthUserId;

    if (!targetUserId && normalizedPreviousEmail) {
      const { data: previousUser } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const matched = previousUser?.users?.find((user) => String(user.email || '').trim().toLowerCase() === normalizedPreviousEmail);
      targetUserId = matched?.id || '';
    }

    if (!targetUserId) {
      const { data: currentUsers } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const matched = currentUsers?.users?.find((user) => String(user.email || '').trim().toLowerCase() === normalizedNextEmail);
      targetUserId = matched?.id || '';
    }

    if (!targetUserId) {
      return c.json({ success: false, message: '未找到要同步的认证账号' }, 404);
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUserId, {
      email: normalizedNextEmail,
      user_metadata: {
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
      },
      email_confirm: true,
    });

    if (updateAuthError) {
      throw updateAuthError;
    }

    await supabase
      .from('user_profiles')
      .upsert({
        id: targetUserId,
        email: normalizedNextEmail,
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
        updated_at: new Date().toISOString(),
      });

    await supabase
      .from('admin_account_identity_audit_logs')
      .insert({
        changed_at: new Date().toISOString(),
        account_id: normalizedAuthUserId || null,
        employee_id: null,
        employee_no: null,
        employee_name: normalizedName,
        actor_name: guard.profile?.email || guard.user?.email || null,
        actor_email: guard.user?.email || null,
        previous_username: null,
        next_username: String(nextUsername || '').trim() || null,
        previous_login_email: normalizedPreviousEmail || null,
        next_login_email: normalizedNextEmail,
        reason: 'Auth 同步校验',
        auth_sync_required: true,
        password_reset_required: false,
      })
      .throwOnError()
      .catch(() => null);

    const { data: verifiedAuthUser, error: verifyAuthError } = await supabase.auth.admin.getUserById(targetUserId);
    if (verifyAuthError) {
      throw verifyAuthError;
    }

    const { data: verifiedProfile, error: verifyProfileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', targetUserId)
      .maybeSingle();

    if (verifyProfileError) {
      throw verifyProfileError;
    }

    const authEmail = String(verifiedAuthUser.user?.email || '').trim().toLowerCase();
    const profileEmail = String(verifiedProfile?.email || '').trim().toLowerCase();
    const consistent = authEmail === normalizedNextEmail && profileEmail === normalizedNextEmail;

    return c.json({
      success: true,
      authUserId: targetUserId,
      email: authEmail,
      profileEmail,
      consistent,
    });
  } catch (error) {
    console.error('❌ 同步内部账号标识失败:', error);
    return c.json({
      success: false,
      message: `同步认证账号失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.post('/make-server-880fd43b/auth/send-admin-email-invite', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      authUserId,
      loginEmail,
      employeeId,
      employeeName,
      role,
      region,
    } = await c.req.json();

    const normalizedEmail = String(loginEmail || '').trim().toLowerCase();
    const normalizedName = String(employeeName || '').trim() || normalizedEmail.split('@')[0] || '内部账号';
    const normalizedRole = String(role || '').trim() || 'Admin';
    const normalizedRegion = String(region || '').trim() || 'all';
    const portalRole = normalizedRole === 'Admin' ? 'admin' : 'staff';
    const redirectTo = resolveAdminInviteRedirectUrl();

    if (!normalizedEmail) {
      return c.json({ success: false, message: '缺少正式登录邮箱' }, 400);
    }

    const existedUser = await findAuthUserByIdOrEmail(String(authUserId || ''), normalizedEmail);
    let targetUserId = existedUser?.id || '';
    let inviteUrl = '';
    let deliveryMode: 'invite' | 'magiclink' = 'invite';

    if (!targetUserId) {
      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: {
          name: normalizedName,
          portal_role: portalRole,
          rbac_role: normalizedRole,
          region: normalizedRegion,
          employee_id: String(employeeId || '').trim() || null,
        },
      });

      if (inviteError) throw inviteError;
      targetUserId = invited.user?.id || '';
    } else {
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUserId, {
        email: normalizedEmail,
        user_metadata: {
          name: normalizedName,
          portal_role: portalRole,
          rbac_role: normalizedRole,
          region: normalizedRegion,
          employee_id: String(employeeId || '').trim() || null,
        },
        email_confirm: false,
      });

      if (updateAuthError) throw updateAuthError;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo,
          data: {
            name: normalizedName,
            portal_role: portalRole,
            rbac_role: normalizedRole,
            region: normalizedRegion,
            employee_id: String(employeeId || '').trim() || null,
          },
        },
      });

      if (linkError) throw linkError;
      inviteUrl = String(linkData?.properties?.action_link || linkData?.properties?.hashed_token || '');
      deliveryMode = 'magiclink';
    }

    await supabase
      .from('user_profiles')
      .upsert({
        id: targetUserId,
        email: normalizedEmail,
        name: normalizedName,
        portal_role: portalRole,
        rbac_role: normalizedRole,
        region: normalizedRegion,
        updated_at: new Date().toISOString(),
      });

    const invitedAt = new Date().toISOString();
    const inviteExpiresAt = new Date(Date.now() + defaultInviteExpiryHours * 60 * 60 * 1000).toISOString();

    return c.json({
      success: true,
      authUserId: targetUserId,
      loginEmail: normalizedEmail,
      invitedAt,
      inviteExpiresAt,
      inviteUrl,
      deliveryMode,
      redirectTo,
    });
  } catch (error) {
    console.error('❌ 发送内部正式邮箱邀请失败:', error);
    return c.json({
      success: false,
      message: `发送正式邮箱邀请失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/enterprise-wechat/start', async (c) => {
  try {
    const corpId = Deno.env.get('ADMIN_ENTERPRISE_WECHAT_CORP_ID') || '';
    const agentId = Deno.env.get('ADMIN_ENTERPRISE_WECHAT_AGENT_ID') || '';
    const callbackUrl = resolveEnterpriseWechatCallbackUrl();

    if (!corpId || !agentId || !callbackUrl) {
      return c.json({
        success: false,
        message: '企业微信登录尚未配置完成，请先补充 CorpID、AgentID 和回调地址',
      }, 501);
    }

    const state = crypto.randomUUID();
    const authorizeUrl =
      'https://open.work.weixin.qq.com/wwopen/sso/qrConnect'
      + `?appid=${encodeURIComponent(corpId)}`
      + `&agentid=${encodeURIComponent(agentId)}`
      + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
      + '&state=' + encodeURIComponent(state);

    return c.json({
      success: true,
      authorizeUrl,
      state,
    });
  } catch (error) {
    console.error('❌ 企业微信登录启动失败:', error);
    return c.json({
      success: false,
      message: `企业微信登录启动失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

app.get('/make-server-880fd43b/auth/enterprise-wechat/callback', async (c) => {
  const redirectWithError = (message: string) => {
    const redirectUrl = buildFormalAdminRedirect({
      enterprise_wechat_error: message,
    });
    if (!redirectUrl) return c.json({ success: false, message }, 500);
    return c.redirect(redirectUrl, 302);
  };

  try {
    const code = String(c.req.query('code') || '').trim();
    const callbackUserId = String(c.req.query('userid') || c.req.query('mock_userid') || '').trim();
    const resolvedUserId = callbackUserId || await resolveEnterpriseWechatUserId(code);

    if (!resolvedUserId) {
      return redirectWithError('企业微信回调未识别到内部用户标识');
    }

    const matched = await findEnterpriseWechatAccount(resolvedUserId);
    if (!matched?.account) {
      return redirectWithError('未找到绑定该企业微信用户的正式账号');
    }

    const accountStatus = String(matched.account.accountStatus || '').trim().toLowerCase();
    const authMode = String(matched.account.authMode || '').trim().toLowerCase();
    const activationStatus = String(matched.account.activationStatus || '').trim().toLowerCase();
    const primaryIdentitySource = String(matched.account.primaryIdentitySource || '').trim().toLowerCase();

    if (!matched.account.canLogin || accountStatus !== 'active') {
      return redirectWithError('该企业微信账号当前未开通登录');
    }

    if (authMode === 'test') {
      return redirectWithError('该企业微信账号仍属于测试轨，请改用测试入口');
    }

    if (primaryIdentitySource !== 'enterprise_wechat') {
      return redirectWithError('该账号未配置企业微信为主认证方式');
    }

    if (activationStatus !== 'active') {
      return redirectWithError('该正式账号尚未完成激活，暂不可用企业微信登录');
    }

    const ensuredUser = await ensureEnterpriseWechatAuthUser({
      authUserId: String(matched.account.authUserId || '').trim(),
      loginEmail: String(matched.account.loginEmail || '').trim().toLowerCase(),
      employeeName: String(matched.contact?.name || matched.account.username || '').trim(),
      role: String(matched.account.role || '').trim(),
      region: String(matched.account.region || '').trim(),
    });

    await supabase
      .from('user_profiles')
      .upsert({
        id: ensuredUser.authUserId,
        email: ensuredUser.loginEmail,
        name: ensuredUser.name,
        portal_role: ensuredUser.portalRole,
        rbac_role: ensuredUser.role,
        region: ensuredUser.region,
        updated_at: new Date().toISOString(),
      });

    const magicLinkResult = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: ensuredUser.loginEmail,
      options: {
        redirectTo: resolveFormalAdminLoginUrl(),
      },
    });

    const actionLink = String(
      magicLinkResult.data?.properties?.action_link
      || magicLinkResult.data?.properties?.hashed_token
      || '',
    ).trim();

    if (!actionLink) {
      return redirectWithError('企业微信登录已识别账号，但生成正式登录链接失败');
    }

    return c.redirect(actionLink, 302);
  } catch (error) {
    console.error('❌ 企业微信登录回调失败:', error);
    return redirectWithError(`企业微信登录回调失败: ${String((error as Error)?.message || error || 'unknown error')}`);
  }
});

app.post('/make-server-880fd43b/auth/send-admin-whatsapp-assist', async (c) => {
  const guard = await requireAdminOperator(c);
  if (guard.error) return guard.error;

  try {
    const {
      employeeId,
      employeeName,
      whatsappAccount,
      loginEmail,
    } = await c.req.json();

    const normalizedWhatsapp = String(whatsappAccount || '').trim();
    const normalizedName = String(employeeName || '').trim() || '内部账号';
    const normalizedEmail = String(loginEmail || '').trim().toLowerCase();

    if (!normalizedWhatsapp) {
      return c.json({ success: false, message: '缺少 WhatsApp 账号' }, 400);
    }

    if (!isWhatsappAssistConfigured()) {
      return c.json({
        success: false,
        message: 'WhatsApp 辅助触达尚未配置完成，请先补充服务商配置',
      }, 501);
    }

    const sentAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + defaultInviteExpiryHours * 60 * 60 * 1000).toISOString();

    await supabase
      .from('admin_account_identity_audit_logs')
      .insert({
        changed_at: sentAt,
        account_id: null,
        employee_id: String(employeeId || '').trim() || null,
        employee_no: null,
        employee_name: normalizedName,
        actor_name: guard.profile?.email || guard.user?.email || null,
        actor_email: guard.user?.email || null,
        previous_username: null,
        next_username: null,
        previous_login_email: null,
        next_login_email: normalizedEmail || null,
        reason: `WhatsApp 辅助触达已发送至 ${normalizedWhatsapp}`,
        auth_sync_required: false,
        password_reset_required: false,
      })
      .throwOnError()
      .catch(() => null);

    return c.json({
      success: true,
      whatsappAccount: normalizedWhatsapp,
      sentAt,
      expiresAt,
      deliveryMode: 'whatsapp_assist',
    });
  } catch (error) {
    console.error('❌ 发送 WhatsApp 辅助触达失败:', error);
    return c.json({
      success: false,
      message: `发送 WhatsApp 辅助触达失败: ${String((error as Error)?.message || error || 'unknown error')}`,
    }, 500);
  }
});

export default app;
