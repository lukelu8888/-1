import { useState, useEffect, useCallback } from 'react';
import { socialMediaAPI, mockOAuthFlow, SocialAccount as APISocialAccount, PublishRequest, PublishResult } from '../api/social-media-api';

/**
 * React Hook for Social Media API
 * 社交媒体API的React Hook
 */

export function useSocialMediaAPI() {
  const [accounts, setAccounts] = useState<APISocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载所有账号
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialMediaAPI.getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // 连接新账号（模拟OAuth流程）
  const connectAccount = useCallback(async (platform: string, region: string) => {
    try {
      setLoading(true);
      setError(null);

      // 使用模拟OAuth流程（在真实环境中，这会打开OAuth窗口）
      const newAccount = await mockOAuthFlow(platform, region);
      
      // 重新加载账号列表
      await loadAccounts();
      
      return newAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAccounts]);

  // 断开账号
  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      await socialMediaAPI.disconnectAccount(accountId);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAccounts]);

  // 刷新账号token
  const refreshAccount = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await socialMediaAPI.refreshAccountToken(accountId);
      await loadAccounts();
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAccounts]);

  // 发布内容
  const publishContent = useCallback(async (request: PublishRequest): Promise<PublishResult[]> => {
    try {
      setLoading(true);
      setError(null);
      const results = await socialMediaAPI.publishContent(request);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish content');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取发布历史
  const getPublishHistory = useCallback(async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      const history = await socialMediaAPI.getPublishHistory(limit);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load publish history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取账号分析数据
  const getAccountAnalytics = useCallback(async (accountId: string, period: string = '30d') => {
    try {
      const analytics = await socialMediaAPI.getAccountAnalytics(accountId, period);
      return analytics;
    } catch (err) {
      console.error('Failed to load analytics:', err);
      return null;
    }
  }, []);

  // 获取所有平台汇总数据
  const getAllAnalytics = useCallback(async (period: string = '30d') => {
    try {
      const analytics = await socialMediaAPI.getAllPlatformsAnalytics(period);
      return analytics;
    } catch (err) {
      console.error('Failed to load all analytics:', err);
      return new Map();
    }
  }, []);

  // 获取UTM追踪数据
  const getUTMTracking = useCallback(async (campaign: string) => {
    try {
      const data = await socialMediaAPI.getUTMTracking(campaign);
      return data;
    } catch (err) {
      console.error('Failed to load UTM tracking:', err);
      return null;
    }
  }, []);

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    connectAccount,
    disconnectAccount,
    refreshAccount,
    publishContent,
    getPublishHistory,
    getAccountAnalytics,
    getAllAnalytics,
    getUTMTracking
  };
}

/**
 * 格式化账号数据以适配现有UI组件
 */
export function formatAccountForUI(account: APISocialAccount) {
  return {
    id: account.id,
    platform: account.platform,
    accountName: account.accountName,
    accountHandle: `@${account.accountId}`,
    accountId: account.accountId,
    status: account.status === 'active' ? 'connected' : 
            account.status === 'expired' ? 'expired' : 'disconnected',
    region: account.region,
    connectedDate: new Date(account.connectedAt).toLocaleDateString(),
    lastSync: account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Never',
    tokenExpiry: account.tokenExpiry ? new Date(account.tokenExpiry).toLocaleDateString() : undefined,
    stats: {
      followers: account.followers || 0,
      engagement: Math.floor(Math.random() * 100) + 50,
      posts: Math.floor(Math.random() * 200) + 50,
      reach: Math.floor(Math.random() * 50000) + 10000
    }
  };
}
