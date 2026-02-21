/**
 * Social Media API Backend Service
 * 社交媒体API后端服务
 * 
 * 这是一个模拟版本，用于开发和测试
 * 在生产环境中，需要替换为真实的服务器实现
 */

// ==================== 数据模型 ====================

export interface SocialAccount {
  id: string;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'twitter';
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry: string;
  region: string;
  status: 'active' | 'expired' | 'error';
  connectedAt: string;
  lastSync?: string;
  followers?: number;
  profileImage?: string;
}

export interface PublishRequest {
  content: string;
  platforms: string[];
  link?: string;
  images?: string[];
  utmParams?: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
  };
  scheduledAt?: string;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface AnalyticsData {
  platform: string;
  period: string;
  impressions: number;
  clicks: number;
  engagement: number;
  followers: number;
  reach: number;
}

// ==================== 模拟数据存储 ====================

class MockDatabase {
  private accounts: Map<string, SocialAccount> = new Map();
  private posts: Map<string, any> = new Map();
  private analytics: Map<string, AnalyticsData[]> = new Map();

  // 初始化一些示例账号
  constructor() {
    this.seedData();
  }

  private seedData() {
    const sampleAccounts: SocialAccount[] = [
      {
        id: 'linkedin-1',
        platform: 'linkedin',
        accountName: 'Cosun Building Materials',
        accountId: 'cosun-building',
        accessToken: 'mock_linkedin_token_abc123',
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        region: 'north-america',
        status: 'active',
        connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        followers: 2547,
        profileImage: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'
      },
      {
        id: 'facebook-1',
        platform: 'facebook',
        accountName: 'Cosun Building Materials Official',
        accountId: 'cosun.official',
        accessToken: 'mock_facebook_token_def456',
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        region: 'north-america',
        status: 'active',
        connectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        followers: 8932,
        profileImage: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'
      }
    ];

    sampleAccounts.forEach(account => {
      this.accounts.set(account.id, account);
    });
  }

  // 账号管理
  getAllAccounts(): SocialAccount[] {
    return Array.from(this.accounts.values());
  }

  getAccount(id: string): SocialAccount | undefined {
    return this.accounts.get(id);
  }

  getAccountsByPlatform(platform: string): SocialAccount[] {
    return Array.from(this.accounts.values()).filter(acc => acc.platform === platform);
  }

  addAccount(account: SocialAccount): void {
    this.accounts.set(account.id, account);
  }

  updateAccount(id: string, updates: Partial<SocialAccount>): void {
    const account = this.accounts.get(id);
    if (account) {
      this.accounts.set(id, { ...account, ...updates });
    }
  }

  deleteAccount(id: string): void {
    this.accounts.delete(id);
  }

  // 发布记录
  addPost(post: any): void {
    this.posts.set(post.id, post);
  }

  getAllPosts(): any[] {
    return Array.from(this.posts.values());
  }

  // 分析数据
  getAnalytics(platform: string, period: string): AnalyticsData | null {
    const analytics = this.analytics.get(`${platform}-${period}`);
    if (analytics && analytics.length > 0) {
      return analytics[0];
    }
    
    // 返回模拟数据
    return {
      platform,
      period,
      impressions: Math.floor(Math.random() * 10000) + 5000,
      clicks: Math.floor(Math.random() * 500) + 100,
      engagement: Math.floor(Math.random() * 300) + 50,
      followers: Math.floor(Math.random() * 1000) + 2000,
      reach: Math.floor(Math.random() * 8000) + 3000
    };
  }
}

// 全局数据库实例
const db = new MockDatabase();

// ==================== OAuth 服务 ====================

class OAuthService {
  private platformConfigs = {
    linkedin: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_organization_social', 'w_organization_social', 'rw_organization_admin']
    },
    facebook: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish']
    },
    instagram: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['instagram_basic', 'instagram_content_publish']
    },
    youtube: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube']
    },
    pinterest: {
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      scopes: ['pins:read', 'pins:write', 'boards:read', 'boards:write']
    }
  };

  generateAuthUrl(platform: string, redirectUri: string, state: string): string {
    const config = this.platformConfigs[platform as keyof typeof this.platformConfigs];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const params = new URLSearchParams({
      client_id: `YOUR_${platform.toUpperCase()}_CLIENT_ID`,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      state: state,
      response_type: 'code'
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(platform: string, code: string, redirectUri: string): Promise<any> {
    // 在真实环境中，这里会调用平台的token endpoint
    // 现在返回模拟token
    return {
      access_token: `mock_${platform}_token_${Math.random().toString(36).substring(7)}`,
      refresh_token: `mock_${platform}_refresh_${Math.random().toString(36).substring(7)}`,
      expires_in: 5184000, // 60天
      token_type: 'Bearer'
    };
  }

  async refreshAccessToken(platform: string, refreshToken: string): Promise<any> {
    // 模拟刷新token
    return {
      access_token: `mock_${platform}_refreshed_${Math.random().toString(36).substring(7)}`,
      expires_in: 5184000,
      token_type: 'Bearer'
    };
  }
}

const oauthService = new OAuthService();

// ==================== 发布服务 ====================

class PublishService {
  async publishToLinkedIn(account: SocialAccount, content: string, link?: string, images?: string[]): Promise<PublishResult> {
    // 模拟API调用延迟
    await this.delay(1000);

    // 模拟成功率（95%成功）
    if (Math.random() < 0.95) {
      const postId = `li_post_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        platform: 'linkedin',
        postId: postId,
        postUrl: `https://www.linkedin.com/feed/update/${postId}`
      };
    } else {
      return {
        success: false,
        platform: 'linkedin',
        error: 'LinkedIn API rate limit exceeded'
      };
    }
  }

  async publishToFacebook(account: SocialAccount, content: string, link?: string, images?: string[]): Promise<PublishResult> {
    await this.delay(1200);

    if (Math.random() < 0.95) {
      const postId = `fb_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        platform: 'facebook',
        postId: postId,
        postUrl: `https://www.facebook.com/${account.accountId}/posts/${postId}`
      };
    } else {
      return {
        success: false,
        platform: 'facebook',
        error: 'Facebook API error: Invalid access token'
      };
    }
  }

  async publishToInstagram(account: SocialAccount, content: string, images?: string[]): Promise<PublishResult> {
    await this.delay(1500);

    if (!images || images.length === 0) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram requires at least one image'
      };
    }

    if (Math.random() < 0.95) {
      const postId = `ig_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        platform: 'instagram',
        postId: postId,
        postUrl: `https://www.instagram.com/p/${postId}`
      };
    } else {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram API error: Image processing failed'
      };
    }
  }

  async publishToYouTube(account: SocialAccount, content: string, videoUrl?: string): Promise<PublishResult> {
    await this.delay(2000);

    if (Math.random() < 0.95) {
      const videoId = `yt_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        platform: 'youtube',
        postId: videoId,
        postUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
    } else {
      return {
        success: false,
        platform: 'youtube',
        error: 'YouTube API quota exceeded'
      };
    }
  }

  async publishToPinterest(account: SocialAccount, content: string, images?: string[]): Promise<PublishResult> {
    await this.delay(1000);

    if (!images || images.length === 0) {
      return {
        success: false,
        platform: 'pinterest',
        error: 'Pinterest requires at least one image'
      };
    }

    if (Math.random() < 0.95) {
      const pinId = `pin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        platform: 'pinterest',
        postId: pinId,
        postUrl: `https://www.pinterest.com/pin/${pinId}`
      };
    } else {
      return {
        success: false,
        platform: 'pinterest',
        error: 'Pinterest API error'
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const publishService = new PublishService();

// ==================== API 端点 ====================

export class SocialMediaAPI {
  // ========== 账号管理 ==========

  /**
   * 获取所有已连接的社交媒体账号
   */
  async getAccounts(): Promise<SocialAccount[]> {
    return db.getAllAccounts();
  }

  /**
   * 获取单个账号信息
   */
  async getAccount(accountId: string): Promise<SocialAccount | null> {
    return db.getAccount(accountId) || null;
  }

  /**
   * 开始OAuth授权流程
   */
  async initiateOAuth(platform: string, region: string): Promise<{ authUrl: string; state: string }> {
    const state = `${platform}_${region}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    
    const authUrl = oauthService.generateAuthUrl(platform, redirectUri, state);
    
    // 存储state用于验证
    sessionStorage.setItem('oauth_state', state);
    
    return { authUrl, state };
  }

  /**
   * 处理OAuth回调
   */
  async handleOAuthCallback(code: string, state: string, platform: string, region: string): Promise<SocialAccount> {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    
    // 验证state
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }

    // 交换code为access token
    const tokenData = await oauthService.exchangeCodeForToken(platform, code, redirectUri);

    // 创建账号记录
    const account: SocialAccount = {
      id: `${platform}-${Date.now()}`,
      platform: platform as any,
      accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
      accountId: `user_${Math.random().toString(36).substring(7)}`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      region: region,
      status: 'active',
      connectedAt: new Date().toISOString(),
      followers: Math.floor(Math.random() * 5000) + 1000
    };

    // 保存到数据库
    db.addAccount(account);

    return account;
  }

  /**
   * 断开账号连接
   */
  async disconnectAccount(accountId: string): Promise<void> {
    db.deleteAccount(accountId);
  }

  /**
   * 刷新账号token
   */
  async refreshAccountToken(accountId: string): Promise<SocialAccount> {
    const account = db.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenData = await oauthService.refreshAccessToken(account.platform, account.refreshToken);

    const updates: Partial<SocialAccount> = {
      accessToken: tokenData.access_token,
      tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      status: 'active'
    };

    db.updateAccount(accountId, updates);

    return { ...account, ...updates };
  }

  // ========== 内容发布 ==========

  /**
   * 发布内容到多个平台
   */
  async publishContent(request: PublishRequest): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    for (const platformId of request.platforms) {
      const account = db.getAccount(platformId);
      if (!account) {
        results.push({
          success: false,
          platform: platformId,
          error: 'Account not found'
        });
        continue;
      }

      // 添加UTM参数到链接
      let finalLink = request.link;
      if (finalLink && request.utmParams) {
        const url = new URL(finalLink);
        url.searchParams.set('utm_source', request.utmParams.source);
        url.searchParams.set('utm_medium', request.utmParams.medium);
        url.searchParams.set('utm_campaign', request.utmParams.campaign);
        if (request.utmParams.term) url.searchParams.set('utm_term', request.utmParams.term);
        if (request.utmParams.content) url.searchParams.set('utm_content', request.utmParams.content);
        finalLink = url.toString();
      }

      let result: PublishResult;

      switch (account.platform) {
        case 'linkedin':
          result = await publishService.publishToLinkedIn(account, request.content, finalLink, request.images);
          break;
        case 'facebook':
          result = await publishService.publishToFacebook(account, request.content, finalLink, request.images);
          break;
        case 'instagram':
          result = await publishService.publishToInstagram(account, request.content, request.images);
          break;
        case 'youtube':
          result = await publishService.publishToYouTube(account, request.content, finalLink);
          break;
        case 'pinterest':
          result = await publishService.publishToPinterest(account, request.content, request.images);
          break;
        default:
          result = {
            success: false,
            platform: account.platform,
            error: 'Unsupported platform'
          };
      }

      results.push(result);

      // 记录发布历史
      if (result.success) {
        db.addPost({
          id: result.postId,
          platform: account.platform,
          accountId: account.id,
          content: request.content,
          link: finalLink,
          utmParams: request.utmParams,
          publishedAt: new Date().toISOString(),
          postUrl: result.postUrl
        });
      }
    }

    return results;
  }

  /**
   * 获取发布历史
   */
  async getPublishHistory(limit: number = 50): Promise<any[]> {
    const posts = db.getAllPosts();
    return posts.slice(0, limit).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  // ========== 数据分析 ==========

  /**
   * 获取账号分析数据
   */
  async getAccountAnalytics(accountId: string, period: string = '30d'): Promise<AnalyticsData | null> {
    const account = db.getAccount(accountId);
    if (!account) {
      return null;
    }

    return db.getAnalytics(account.platform, period);
  }

  /**
   * 获取所有平台汇总数据
   */
  async getAllPlatformsAnalytics(period: string = '30d'): Promise<Map<string, AnalyticsData>> {
    const accounts = db.getAllAccounts();
    const analytics = new Map<string, AnalyticsData>();

    for (const account of accounts) {
      const data = db.getAnalytics(account.platform, period);
      if (data) {
        analytics.set(account.platform, data);
      }
    }

    return analytics;
  }

  /**
   * 获取UTM追踪数据
   */
  async getUTMTracking(campaign: string): Promise<any> {
    // 模拟UTM追踪数据
    return {
      campaign,
      totalClicks: Math.floor(Math.random() * 1000) + 500,
      uniqueVisitors: Math.floor(Math.random() * 800) + 300,
      conversions: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      sources: {
        linkedin: Math.floor(Math.random() * 300) + 100,
        facebook: Math.floor(Math.random() * 400) + 150,
        instagram: Math.floor(Math.random() * 200) + 80
      }
    };
  }
}

// ==================== 导出单例 ====================

export const socialMediaAPI = new SocialMediaAPI();

// ==================== 模拟真实API调用（用于开发测试）====================

/**
 * 这个函数模拟真实的OAuth流程
 * 在生产环境中，应该由真实的服务器处理
 */
export async function mockOAuthFlow(platform: string, region: string): Promise<SocialAccount> {
  // 模拟用户授权过程
  await new Promise(resolve => setTimeout(resolve, 1500));

  const account: SocialAccount = {
    id: `${platform}-${Date.now()}`,
    platform: platform as any,
    accountName: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
    accountId: `mock_user_${Math.random().toString(36).substring(7)}`,
    accessToken: `mock_token_${Math.random().toString(36).substring(7)}`,
    refreshToken: `mock_refresh_${Math.random().toString(36).substring(7)}`,
    tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    region: region,
    status: 'active',
    connectedAt: new Date().toISOString(),
    followers: Math.floor(Math.random() * 10000) + 1000,
    profileImage: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'
  };

  db.addAccount(account);
  return account;
}
