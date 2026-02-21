// 🔥 认证路由 - 用户登录和会话管理
import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cors } from 'npm:hono/cors';

const app = new Hono();
app.use('*', cors());

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

export default app;
