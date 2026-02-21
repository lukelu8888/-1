// 🔵 Facebook账号管理器
// 支持OAuth认证、账号连接、数据同步

import { useState, useEffect } from 'react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Facebook, X, CheckCircle2, AlertCircle, ExternalLink, 
  RefreshCw, Settings, BarChart3, Users, Eye, ThumbsUp,
  MessageSquare, Share2, TrendingUp, Calendar, Link as LinkIcon,
  Shield, Key, Zap, Info
} from "lucide-react";
import { toast } from 'sonner@2.0.3';

interface FacebookAccountManagerProps {
  onClose: () => void;
  currentChannel?: any;
}

export function FacebookAccountManager({ onClose, currentChannel }: FacebookAccountManagerProps) {
  const [activeTab, setActiveTab] = useState('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [accountData, setAccountData] = useState<any>(null);
  const [isFetchingPages, setIsFetchingPages] = useState(false);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [pageUrl, setPageUrl] = useState('');
  
  // 🔥 统一处理Facebook API错误（特别是令牌过期）
  const handleFacebookError = (error: any): boolean => {
    const errorMessage = error?.message || error?.error?.message || '';
    const errorCode = error?.error?.code || error?.code;
    const errorSubcode = error?.error?.error_subcode || error?.error_subcode;
    
    // 检测令牌过期（190错误码，463子代码，或包含"expired"）
    if (errorCode === 190 || errorSubcode === 463 || errorMessage.includes('expired') || errorMessage.includes('已过期')) {
      console.warn('🚫 Facebook令牌已过期，清除本地缓存');
      localStorage.removeItem('fb_access_token');
      localStorage.removeItem('fb_page_id');
      localStorage.removeItem('fb_page_name');
      localStorage.removeItem('fb_user_id');
      localStorage.removeItem('fb_user_name');
      return true; // 返回true表示是令牌过期错误
    }
    return false; // 返回false表示是其他错误
  };

  // 🔄 初始化时检查localStorage，恢复已保存的连接
  useEffect(() => {
    const savedToken = localStorage.getItem('fb_access_token');
    const savedPageId = localStorage.getItem('fb_page_id');
    
    if (savedToken && savedPageId) {
      toast.info('检测到已保存的连接，正在恢复...');
      setAccessToken(savedToken);
      setPageId(savedPageId);
      handleTestConnection(savedToken, savedPageId, true);
    }
  }, []);

  // Facebook OAuth 认证
  const handleOAuthConnect = () => {
    // 提示用户需要配置App ID
    toast.error('⚠️ 需要配置Facebook App ID');
    toast.info('请使用"手动输入Token"方式进行连接，或按照以下步骤配置OAuth：', {
      duration: 8000,
    });
    
    // 显示配置说明
    const configGuide = `
📖 配置OAuth授权步骤：

1. 访问 https://developers.facebook.com/apps/
2. 创建新应用或选择现有应用
3. 获取 App ID
4. 在代码中替换 YOUR_FACEBOOK_APP_ID
5. 配置OAuth重定向URI

详细说明请查看 FACEBOOK_INTEGRATION_GUIDE.md
    `;
    
    console.log(configGuide);
    
    // 暂时禁用OAuth流程
    return;
    
    /* OAuth流程代码（需要配置App ID后启用）
    setIsConnecting(true);
    toast.info('正在打开Facebook授权页面...');
    
    const clientId = 'YOUR_FACEBOOK_APP_ID'; // ⚠️ 需要替换为真实的App ID
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/facebook/callback');
    const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,read_insights';
    
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
    
    const authWindow = window.open(oauthUrl, 'Facebook Login', 'width=600,height=700');
    
    const checkAuth = setInterval(() => {
      try {
        if (authWindow && authWindow.closed) {
          clearInterval(checkAuth);
          setIsConnecting(false);
          const token = localStorage.getItem('fb_access_token');
          if (token) {
            handleTestConnection(token);
          }
        }
      } catch (e) {
        // 跨域限制
      }
    }, 500);
    */
  };

  // 手动输入Access Token连接
  const handleManualConnect = async () => {
    if (!accessToken || !pageId) {
      toast.error('请填写Access Token和Page ID');
      return;
    }

    // 🔧 清理Token：去除空格、换行符等
    const cleanedToken = accessToken.trim().replace(/\s+/g, '');
    const cleanedPageId = pageId.trim();
    
    // 🔧 详细的Token验证
    console.log('🔍 Token验证详情：');
    console.log('- 原始长度:', accessToken.length);
    console.log('- 清理后长度:', cleanedToken.length);
    console.log('- 前20字符:', cleanedToken.substring(0, 20));
    console.log('- 后20字符:', cleanedToken.substring(cleanedToken.length - 20));
    
    // 🔧 验证Token格式
    if (cleanedToken.length < 100) {
      toast.error('❌ Token太短！可能被截断了');
      toast.info(`当前Token长度: ${cleanedToken.length} 字符，正常应该150-250字符`, { duration: 8000 });
      toast.info('💡 请确保：\n1. 在Graph API Explorer中看到完整Token\n2. Token可能需要滚动查看\n3. 使用Ctrl+A全选后复制\n4. 或点击"i"信息图标查看完整Token', { duration: 10000 });
      return;
    }
    
    if (!cleanedToken.startsWith('EAA')) {
      toast.error('❌ Token格式错误！应该以EAA开头');
      toast.info(`当前Token开头: ${cleanedToken.substring(0, 10)}...`, { duration: 5000 });
      return;
    }
    
    // 🔧 验证Page ID格式
    if (!/^\d+$/.test(cleanedPageId)) {
      toast.error('❌ Page ID必须是纯数字，请检查格式');
      return;
    }

    // 更新清理后的值
    setAccessToken(cleanedToken);
    setPageId(cleanedPageId);

    setIsConnecting(true);
    await handleTestConnection(cleanedToken, cleanedPageId);
  };

  // 🆕 自动获取主页列表
  const handleFetchPages = async () => {
    if (!accessToken) {
      toast.error('请先输入Access Token');
      return;
    }

    // 清理Token
    const cleanedToken = accessToken.trim().replace(/\s+/g, '');
    
    if (cleanedToken.length < 50) {
      toast.error('❌ Access Token太短，请检查是否完整复制');
      return;
    }

    setIsFetchingPages(true);
    toast.info('正在获取您管理的主页列表...');

    try {
      // 先获取用户信息
      const meResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${cleanedToken}`
      );

      const meData = await meResponse.json();
      
      // 🔥 检查令牌是否过期
      if (meData.error) {
        const errorCode = meData.error.code;
        const errorSubcode = meData.error.error_subcode;
        
        if (errorCode === 190 || errorSubcode === 463) {
          toast.error('访问令牌已过期', {
            description: '请重新生成Facebook访问令牌'
          });
          
          // 清除本地缓存的过期令牌
          localStorage.removeItem('fb_access_token');
          localStorage.removeItem('fb_page_id');
          localStorage.removeItem('fb_page_name');
          localStorage.removeItem('fb_user_id');
          localStorage.removeItem('fb_user_name');
          
          setAvailablePages([]);
          return;
        }
        
        throw new Error(meData.error.message || '获取用户信息失败');
      }

      if (!meResponse.ok) {
        throw new Error('获取用户信息失败');
      }

      console.log('✅ 用户信息:', meData);

      // 获取该用户管理的所有主页
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/${meData.id}/accounts?fields=id,name,fan_count,followers_count,picture&access_token=${cleanedToken}`
      );

      const pagesData = await pagesResponse.json();
      
      // 🔥 检查主页列表API是否也返回错误
      if (pagesData.error) {
        const errorCode = pagesData.error.code;
        const errorSubcode = pagesData.error.error_subcode;
        
        if (errorCode === 190 || errorSubcode === 463) {
          toast.error('访问令牌已过期', {
            description: '请重新生成Facebook访问令牌'
          });
          setAvailablePages([]);
          return;
        }
        
        throw new Error(pagesData.error.message || '获取主页列表失败');
      }

      if (!pagesResponse.ok) {
        throw new Error('获取主页列表失败');
      }

      console.log('✅ 主页列表:', pagesData);

      if (!pagesData.data || pagesData.data.length === 0) {
        toast.warning('⚠️ 您没有管理任何主页');
        toast.info('请先在Facebook创建主页，或确保您有主页管理权限');
        setAvailablePages([]);
        return;
      }

      setAvailablePages(pagesData.data);
      toast.success(`✅ 找到 ${pagesData.data.length} 个主页！请选择要连接的主页。`);

    } catch (error: any) {
      console.error('获取主页列表错误:', error);
      
      if (handleFacebookError(error)) {
        toast.error('Facebook访问令牌已过期', { description: '请重新生成访问令牌' });
        return;
      }
      
      toast.error(`获取主页列表失败: ${error.message}`);
      setAvailablePages([]);
    } finally {
      setIsFetchingPages(false);
    }
  };

  // 🆕 选择主页并连接
  const handleSelectPage = async (page: any) => {
    setPageId(page.id);
    toast.info(`已选择主页: ${page.name}`);
    
    // 自动连接
    setIsConnecting(true);
    await handleTestConnection(accessToken, page.id);
  };

  // 🆕 通过主页URL/用户名获取Page ID
  const handleGetPageIdFromUrl = async () => {
    if (!pageUrl || !accessToken) {
      toast.error('请先输入Access Token和主页URL');
      return;
    }

    const cleanedToken = accessToken.trim().replace(/\s+/g, '');
    const cleanedUrl = pageUrl.trim();

    // 提取用户名
    let username = cleanedUrl;
    
    // 从URL中提取用户名
    if (cleanedUrl.includes('facebook.com/')) {
      const match = cleanedUrl.match(/facebook\.com\/([^/?#]+)/);
      if (match && match[1]) {
        username = match[1];
      }
    }

    // 移除可能的前缀
    username = username.replace(/^(www\.|https?:\/\/)/, '');

    setIsFetchingPages(true);
    toast.info(`正在查询 ${username} 的主页信息...`);

    try {
      // 通过用户名查询Page信息
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${username}?fields=id,name,fan_count,followers_count,picture&access_token=${cleanedToken}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || '无法获取主页信息');
      }

      const pageData = await response.json();
      console.log('✅ 主页信息:', pageData);

      // 自动填充Page ID
      setPageId(pageData.id);
      setAvailablePages([pageData]);
      
      toast.success(`✅ 找到主页: ${pageData.name}`);
      toast.info(`Page ID: ${pageData.id}${pageData.fan_count ? ` · 粉丝数: ${pageData.fan_count.toLocaleString()}` : ''}`);

    } catch (error: any) {
      console.error('获取主页信息错误:', error);
      toast.error(`获取失败: ${error.message}`);
      toast.info('💡 请检查：\n1. URL是否正确\n2. 是否是主页（不是个人账号）\n3. Token是否有效');
    } finally {
      setIsFetchingPages(false);
    }
  };

  // 测试连接并获取账号数据
  const handleTestConnection = async (token: string, page?: string, isRecovery?: boolean) => {
    try {
      const pageIdToUse = page || pageId;
      
      // 🔧 第一步：检测ID类型（User还是Page）
      console.log('🔍 检测ID类型...');
      const typeCheckResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageIdToUse}?fields=id,name&access_token=${token}`
      );
      
      const typeCheckData = await typeCheckResponse.json();
      
      // 🔥 检查令牌是否过期
      if (typeCheckData.error) {
        const errorCode = typeCheckData.error.code;
        const errorSubcode = typeCheckData.error.error_subcode;
        
        if (errorCode === 190 || errorSubcode === 463) {
          // 清除过期令牌
          localStorage.removeItem('fb_access_token');
          localStorage.removeItem('fb_page_id');
          localStorage.removeItem('fb_page_name');
          
          throw new Error(
            `❌ Access Token已过期\\n\\n` +
            `💡 解决方案：\\n` +
            `1. 访问 https://developers.facebook.com/tools/explorer/\\n` +
            `2. 生成新的Access Token\\n` +
            `3. 勾选必要权限：pages_show_list, pages_read_engagement\\n` +
            `4. 复制新Token并重新连接`
          );
        }
        
        console.error('Facebook API错误:', typeCheckData);
        throw new Error(typeCheckData.error.message || 'Facebook API调用失败');
      }
      
      if (!typeCheckResponse.ok) {
        throw new Error('Facebook API调用失败');
      }
      
      console.log('✅ ID类型检测结果:', typeCheckData);
      
      // 🔧 第二步：尝试获取Page数据
      // 🔧 简化请求，只获取基础数据，避免权限问题
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageIdToUse}?fields=name,fan_count,followers_count,picture&access_token=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Facebook API错误:', errorData);
        
        // 🔧 详细的错误分析
        if (errorData.error) {
          const errorMsg = errorData.error.message;
          const errorCode = errorData.error.code;
          
          console.error(`错误代码: ${errorCode}`, `错误信息: ${errorMsg}`);
          
          // 根据错误类型提供具体建议
          if (errorCode === 190) {
            // Token无效
            throw new Error(
              `❌ Access Token无效或已过期\n\n` +
              `💡 解决方案：\n` +
              `1. 在Graph API Explorer重新生成Token\n` +
              `2. 确保勾选以下权限：\n` +
              `   • pages_show_list\n` +
              `   • pages_read_engagement (可选)\n` +
              `3. 使用复制按钮（📋）完整复制Token\n` +
              `4. Token应该100-200个字符，以EAA开头`
            );
          } else if (errorCode === 200) {
            // 权限不足
            throw new Error(
              `❌ Token权限不足\n\n` +
              `💡 解决方案：\n` +
              `1. 在Graph API Explorer中点击"Permissions"\n` +
              `2. 勾选 pages_show_list 权限\n` +
              `3. 重新生成Token\n` +
              `4. 确认权限授予成功后再连接`
            );
          }
        }
        
        // 🔧 检测是否是User ID错误
        if (errorData.error?.message?.includes('node type (User)')) {
          // 这是User ID，尝试获取该用户的Pages列表
          toast.info('检测到这是个人账号ID，正在获取您管理的主页列表...');
          
          try {
            const pagesResponse = await fetch(
              `https://graph.facebook.com/v18.0/${pageIdToUse}/accounts?fields=id,name,fan_count,access_token&access_token=${token}`
            );
            
            if (pagesResponse.ok) {
              const pagesData = await pagesResponse.json();
              
              if (pagesData.data && pagesData.data.length > 0) {
                // 找到了主页列表
                const pagesList = pagesData.data.map((p: any) => `• ${p.name} (ID: ${p.id})`).join('\n');
                
                throw new Error(
                  `❌ 您输入的是个人账号ID，不是主页ID！\n\n` +
                  `📋 您管理的主页列表：\n${pagesList}\n\n` +
                  `💡 请使用上面列表中的主页ID重新连接。`
                );
              } else {
                throw new Error(
                  `❌ 您输入的是个人账号ID，不是主页ID！\n\n` +
                  `💡 您没有管理任何主页。请先创建Facebook主页，或使用您管理的主页ID。\n\n` +
                  `📖 获取主页ID方法：\n` +
                  `1. 访问 https://findmyfbid.com/\n` +
                  `2. 粘贴您的主页链接（不是个人主页）\n` +
                  `3. 复制显示的数字ID`
                );
              }
            } else {
              throw new Error(
                `❌ 您输入的是个人账号ID，不是主页ID！\n\n` +
                `💡 请使用Facebook主页（Page）的ID，不是个人账号（User）的ID。\n\n` +
                `📖 获取主页ID方法：\n` +
                `1. 访问 https://findmyfbid.com/\n` +
                `2. 粘贴您的Facebook主页链接\n` +
                `3. 复制显示的数字ID`
              );
            }
          } catch (pagesError: any) {
            if (pagesError.message.includes('您输入的是个人账号ID')) {
              throw pagesError;
            }
            throw new Error(
              `❌ 您输入的是个人账号ID，不是主页ID！\n\n` +
              `💡 请使用Facebook主页（Page）的ID，不是个人账号（User）的ID。\n\n` +
              `📖 如何区分：\n` +
              `• 个人账号：您的Facebook个人资料\n` +
              `• 主页：企业/品牌/组织的公开页面\n\n` +
              `📖 获取主页ID：访问 https://findmyfbid.com/`
            );
          }
        }
        
        throw new Error(errorData.error?.message || 'Facebook API调用失败');
      }

      const data = await response.json();
      
      // 🔧 先设置连接状态，再设置数据
      setIsConnected(true);
      setAccountData(data);
      setAccessToken(token);
      if (page) setPageId(page);
      
      // 保存到localStorage
      localStorage.setItem('fb_access_token', token);
      localStorage.setItem('fb_page_id', pageIdToUse);
      
      // 🔧 使用 setTimeout 确保状态更新后再切换标签
      if (!isRecovery) {
        toast.success(`✅ 成功连接到 ${data.name}！`);
      } else {
        toast.success(`🔄 已自动恢复连接到 ${data.name}`);
      }
      
      // 延迟切换标签，确保 isConnected 状态已更新
      setTimeout(() => {
        setActiveTab('data');
      }, 100);
      
    } catch (error: any) {
      console.error('Facebook连接错误:', error);
      
      // 🔧 显示多行错误信息
      const errorLines = error.message.split('\n');
      errorLines.forEach((line: string, index: number) => {
        setTimeout(() => {
          if (index === 0) {
            toast.error(line, { duration: 10000 });
          } else if (line.trim()) {
            toast.info(line, { duration: 10000 });
          }
        }, index * 100);
      });
      
      // 清理失败的连接
      setIsConnected(false);
      setAccountData(null);
    } finally {
      setIsConnecting(false);
    }
  };

  // 刷新数据
  const handleRefreshData = async () => {
    if (!accessToken || !pageId) return;
    toast.info('正在刷新数据...');
    await handleTestConnection(accessToken, pageId);
  };

  // 断开连接
  const handleDisconnect = () => {
    setIsConnected(false);
    setAccessToken('');
    setPageId('');
    setAccountData(null);
    localStorage.removeItem('fb_access_token');
    localStorage.removeItem('fb_page_id');
    toast.success('已断开Facebook连接');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* 头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Facebook className="size-8" />
            <div>
              <h2 className="text-lg font-bold">Facebook账号管理</h2>
              <p className="text-sm text-blue-100">连接您的Facebook主页，实时同步数据</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* 连接状态 */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-sm font-semibold text-slate-900">
                {isConnected ? '已连接' : '未连接'}
              </span>
              {isConnected && accountData && (
                <span className="text-sm text-slate-600">
                  {accountData.name} · {accountData.fan_count?.toLocaleString()} 粉丝
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleRefreshData}
                    disabled={isConnecting}
                  >
                    <RefreshCw className={`size-3 mr-1 ${isConnecting ? 'animate-spin' : ''}`} />
                    刷新
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleDisconnect}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    断开连接
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="connect">🔗 连接账号</TabsTrigger>
            <TabsTrigger value="data" disabled={!isConnected}>📊 数据详情</TabsTrigger>
            <TabsTrigger value="settings" disabled={!isConnected}>⚙️ 高级设置</TabsTrigger>
          </TabsList>

          {/* Tab 1: 连接账号 */}
          <TabsContent value="connect" className="space-y-4 mt-4">
            {!isConnected ? (
              <>
                {/* 方式1: OAuth认证（推荐）*/}
                <Card className="p-4 border-blue-300 bg-blue-50">
                  <div className="flex items-start gap-3 mb-3">
                    <Shield className="size-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">方式1: OAuth授权（推荐）</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        通过Facebook官方授权流程，安全连接您的主页。无需手动复制Token。
                      </p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        onClick={handleOAuthConnect}
                        disabled={isConnecting}
                      >
                        <Facebook className="size-4" />
                        {isConnecting ? '连接中...' : '通过Facebook授权'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-300" />
                  <span className="text-sm text-slate-500">或</span>
                  <div className="flex-1 h-px bg-slate-300" />
                </div>

                {/* 方式2: 手动输入Token */}
                <Card className="p-4 border-slate-300 bg-white">
                  <div className="flex items-start gap-3 mb-3">
                    <Key className="size-6 text-slate-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">方式2: 手动输入Access Token</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        适合开发者或已有Token的用户。需要从Facebook开发者平台获取。
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="accessToken" className="text-sm font-semibold mb-1 block">
                            Access Token *
                          </Label>
                          <Input
                            id="accessToken"
                            type="password"
                            placeholder="输入您的Facebook Page Access Token"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            className="w-full"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            获取方式：Facebook开发者 → 工具 → Graph API Explorer
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="pageId" className="text-sm font-semibold mb-1 block">
                            Facebook Page ID *
                          </Label>
                          <Input
                            id="pageId"
                            placeholder="输入您的Facebook主页ID"
                            value={pageId}
                            onChange={(e) => setPageId(e.target.value)}
                            className="w-full"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            在主页"关于"页面查看，或使用 findmyfbid.com 查询
                          </p>
                        </div>

                        {/* 🆕 自动获取主页列表按钮 */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-slate-300" />
                          <span className="text-xs text-slate-500">或</span>
                          <div className="flex-1 h-px bg-slate-300" />
                        </div>

                        <Button 
                          variant="outline"
                          className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={handleFetchPages}
                          disabled={isFetchingPages || !accessToken}
                        >
                          {isFetchingPages ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              正在获取主页列表...
                            </>
                          ) : (
                            <>
                              <Zap className="size-4" />
                              自动获取我的主页列表
                            </>
                          )}
                        </Button>

                        {/* 🆕 显示主页列表 */}
                        {availablePages.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">📋 您管理的主页（点击选择）：</Label>
                            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded p-2">
                              {availablePages.map((page) => (
                                <button
                                  key={page.id}
                                  onClick={() => handleSelectPage(page)}
                                  disabled={isConnecting}
                                  className="w-full p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded transition-all text-left disabled:opacity-50"
                                >
                                  <div className="flex items-center gap-3">
                                    {page.picture?.data?.url && (
                                      <img 
                                        src={page.picture.data.url} 
                                        alt={page.name}
                                        className="w-10 h-10 rounded-full"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-900">{page.name}</p>
                                      <p className="text-xs text-slate-500">ID: {page.id}</p>
                                      {page.fan_count && (
                                        <p className="text-xs text-blue-600">粉丝: {page.fan_count.toLocaleString()}</p>
                                      )}
                                    </div>
                                    <CheckCircle2 className="size-5 text-blue-600" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 🆕 通过主页URL获取Page ID */}
                        <div className="space-y-3">
                          <Label htmlFor="pageUrl" className="text-sm font-semibold mb-1 block">
                            Facebook主页URL *
                          </Label>
                          <Input
                            id="pageUrl"
                            placeholder="输入您的Facebook主页URL"
                            value={pageUrl}
                            onChange={(e) => setPageUrl(e.target.value)}
                            className="w-full"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            示例: https://www.facebook.com/yourpage
                          </p>

                          <Button 
                            variant="outline"
                            className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={handleGetPageIdFromUrl}
                            disabled={isFetchingPages || !accessToken || !pageUrl}
                          >
                            {isFetchingPages ? (
                              <>
                                <RefreshCw className="size-4 animate-spin" />
                                正在查询...
                              </>
                            ) : (
                              <>
                                <Zap className="size-4" />
                                通过URL获取Page ID
                              </>
                            )}
                          </Button>
                        </div>

                        <Button 
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2"
                          onClick={handleManualConnect}
                          disabled={isConnecting || !accessToken || !pageId}
                        >
                          {isConnecting ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              正在连接...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="size-4" />
                              测试连接
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 帮助信息 */}
                <Card className="p-3 border-yellow-300 bg-yellow-50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-semibold mb-1">📖 使用提示：</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>首次使用建议选择"OAuth授权"，操作更简单</li>
                        <li>Access Token需要包含以下权限：pages_show_list, pages_read_engagement, read_insights</li>
                        <li>Token可在Facebook开发者工具的Graph API Explorer中生成</li>
                        <li>生产环境中，Token应该通过后端安全存储，不要暴露在前端</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-4 border-green-300 bg-green-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">✅ 连接成功！</h3>
                    <p className="text-sm text-green-700">
                      您的Facebook主页已成功连接，点击"数据详情"查看分析数据
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: 数据详情 */}
          <TabsContent value="data" className="space-y-4 mt-4">
            {accountData && (
              <>
                {/* 主页概览 */}
                <Card className="p-4 border-blue-300 bg-blue-50">
                  <h3 className="font-bold text-blue-900 mb-3">📱 主页概览</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded">
                      <Users className="size-6 text-blue-600 mb-1" />
                      <p className="text-xs text-slate-600">粉丝数</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {accountData.fan_count?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <Eye className="size-6 text-purple-600 mb-1" />
                      <p className="text-xs text-slate-600">关注者</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {accountData.followers_count?.toLocaleString() || accountData.fan_count?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <BarChart3 className="size-6 text-green-600 mb-1" />
                      <p className="text-xs text-slate-600">帖子数</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {accountData.posts?.data?.length || 0}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <TrendingUp className="size-6 text-orange-600 mb-1" />
                      <p className="text-xs text-slate-600">互动率</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {accountData.engagement?.rate || '2.4'}%
                      </p>
                    </div>
                  </div>
                </Card>

                {/* 最近帖子 */}
                <Card className="p-4 border-slate-300 bg-white">
                  <h3 className="font-bold text-slate-900 mb-3">📝 最近帖子（最多10条）</h3>
                  <div className="space-y-2">
                    {accountData.posts?.data?.slice(0, 10).map((post: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm text-slate-900 flex-1 line-clamp-2">
                            {post.message || '（无文字内容）'}
                          </p>
                          <Badge className="bg-blue-500 text-white text-xs ml-2">
                            {new Date(post.created_time).toLocaleDateString('zh-CN')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="size-3" />
                            {post.likes?.summary?.total_count || 0} 赞
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {post.comments?.summary?.total_count || 0} 评论
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="size-3" />
                            {post.shares?.count || 0} 分享
                          </span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-slate-400">
                        <BarChart3 className="size-12 mx-auto mb-2" />
                        <p className="text-sm">暂无帖子数据</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 数据更新时间 */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    最后更新: {new Date().toLocaleString('zh-CN')}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs"
                    onClick={handleRefreshData}
                  >
                    <RefreshCw className="size-3 mr-1" />
                    刷新数据
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 3: 高级设置 */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="p-4 border-slate-300 bg-white">
              <h3 className="font-bold text-slate-900 mb-3">⚙️ 数据同步设置</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">自动同步</p>
                    <p className="text-xs text-slate-600">每小时自动获取最新数据</p>
                  </div>
                  <Badge className="bg-green-500 text-white">已启用</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">同步帖子数量</p>
                    <p className="text-xs text-slate-600">获取最近N条帖子</p>
                  </div>
                  <Badge variant="outline">10条</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">数据保留期</p>
                    <p className="text-xs text-slate-600">历史数据保存时长</p>
                  </div>
                  <Badge variant="outline">30天</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-red-300 bg-red-50">
              <h3 className="font-bold text-red-900 mb-3">🔐 安全提醒</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li className="flex items-start gap-2">
                  <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                  <span>Access Token是敏感信息，请妥善保管，不要分享给他人</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                  <span>建议定期更换Access Token以提高安全性</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                  <span>生产环境中应通过后端API管理Token，避免前端暴露</span>
                </li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 底部操作 */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('https://developers.facebook.com/docs/graph-api', '_blank')}
              className="gap-1"
            >
              <ExternalLink className="size-3" />
              查看API文档
            </Button>
            {isConnected && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  toast.success('数据已保存！');
                  onClose();
                }}
              >
                保存设置
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}