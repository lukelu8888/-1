import React, { useState } from 'react';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  ExternalLink,
  Trash2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'pinterest' | 'tiktok';
  accountName: string;
  accountHandle: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'expired' | 'pending';
  region: 'north-america' | 'south-america' | 'europe-africa';
  connectedDate: string;
  lastSync: string;
  tokenExpiry?: string;
  stats: {
    followers: number;
    engagement: number;
    posts: number;
    reach: number;
  };
}

const platformConfig = {
  facebook: {
    name: 'Facebook Business',
    icon: Facebook,
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    description: '连接Facebook Business账号以管理主页和广告'
  },
  instagram: {
    name: 'Instagram Business',
    icon: Instagram,
    color: 'bg-pink-600',
    textColor: 'text-pink-600',
    description: '连接Instagram Business账号以发布内容'
  },
  linkedin: {
    name: 'LinkedIn Company',
    icon: Linkedin,
    color: 'bg-blue-700',
    textColor: 'text-blue-700',
    description: '连接LinkedIn公司主页，B2B营销核心渠道'
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    textColor: 'text-black',
    description: '连接X（原Twitter）账号以发布动态'
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    textColor: 'text-red-600',
    description: '连接YouTube频道以发布视频内容'
  },
  pinterest: {
    name: 'Pinterest',
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
      </svg>
    ),
    color: 'bg-red-700',
    textColor: 'text-red-700',
    description: '连接Pinterest账号以发布产品图片'
  },
  tiktok: {
    name: 'TikTok for Business',
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: 'bg-black',
    textColor: 'text-black',
    description: '连接TikTok企业账号以发布短视频'
  }
};

const regionOptions = [
  { value: 'north-america', label: '北美市场', flag: '🇺🇸' },
  { value: 'south-america', label: '南美市场', flag: '🇧🇷' },
  { value: 'europe-africa', label: '欧非市场', flag: '🇪🇺' }
];

export default function SocialMediaAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: '1',
      platform: 'linkedin',
      accountName: 'Cosun Building Materials',
      accountHandle: '@cosun-building',
      accountId: 'cosun-building-materials',
      status: 'connected',
      region: 'north-america',
      connectedDate: '2025-01-15',
      lastSync: '2025-11-18 10:30',
      tokenExpiry: '2025-12-15',
      stats: {
        followers: 8524,
        engagement: 4.2,
        posts: 156,
        reach: 45230
      }
    },
    {
      id: '2',
      platform: 'facebook',
      accountName: 'Cosun Materials USA',
      accountHandle: '@CosunUSA',
      accountId: 'cosun-materials-usa',
      status: 'connected',
      region: 'north-america',
      connectedDate: '2025-01-10',
      lastSync: '2025-11-18 09:15',
      tokenExpiry: '2025-11-25',
      stats: {
        followers: 12450,
        engagement: 3.8,
        posts: 234,
        reach: 67890
      }
    },
    {
      id: '3',
      platform: 'instagram',
      accountName: 'Cosun_Building',
      accountHandle: '@cosun_building',
      accountId: 'cosun-building-ig',
      status: 'expired',
      region: 'north-america',
      connectedDate: '2025-01-05',
      lastSync: '2025-11-10 14:20',
      tokenExpiry: '2025-11-15',
      stats: {
        followers: 6780,
        engagement: 5.6,
        posts: 189,
        reach: 34560
      }
    },
    {
      id: '4',
      platform: 'youtube',
      accountName: 'Cosun Building Channel',
      accountHandle: '@CosunBuilding',
      accountId: 'cosun-building-yt',
      status: 'connected',
      region: 'north-america',
      connectedDate: '2025-02-01',
      lastSync: '2025-11-18 08:00',
      stats: {
        followers: 3240,
        engagement: 6.8,
        posts: 45,
        reach: 123450
      }
    }
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const getStatusBadge = (status: SocialAccount['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 border-green-300">已连接</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">已过期</Badge>;
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">未连接</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">待授权</Badge>;
      default:
        return null;
    }
  };

  const handleConnectAccount = () => {
    if (!selectedPlatform || !selectedRegion) {
      toast.error('请选择平台和区域');
      return;
    }

    setIsConnecting(true);
    
    // 模拟OAuth授权流程
    setTimeout(() => {
      toast.success('正在跳转到授权页面...', {
        description: '请在新窗口中完成授权流程'
      });
      
      // 模拟授权成功
      setTimeout(() => {
        const newAccount: SocialAccount = {
          id: Date.now().toString(),
          platform: selectedPlatform as any,
          accountName: `New ${platformConfig[selectedPlatform as keyof typeof platformConfig].name} Account`,
          accountHandle: '@new-account',
          accountId: `new-account-${Date.now()}`,
          status: 'connected',
          region: selectedRegion as any,
          connectedDate: new Date().toISOString().split('T')[0],
          lastSync: new Date().toLocaleString('zh-CN'),
          stats: {
            followers: 0,
            engagement: 0,
            posts: 0,
            reach: 0
          }
        };
        
        setAccounts([...accounts, newAccount]);
        setIsConnecting(false);
        setShowConnectDialog(false);
        setSelectedPlatform('');
        setSelectedRegion('');
        
        toast.success('账号连接成功！', {
          description: '您现在可以开始发布内容了'
        });
      }, 2000);
    }, 1000);
  };

  const handleRefreshAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    toast.info(`正在刷新 ${account?.accountName} 的数据...`);
    
    setTimeout(() => {
      setAccounts(accounts.map(a => 
        a.id === accountId 
          ? { ...a, lastSync: new Date().toLocaleString('zh-CN'), status: 'connected' }
          : a
      ));
      toast.success('数据刷新成功');
    }, 1500);
  };

  const handleReauthorize = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    toast.info(`正在重新授权 ${account?.accountName}...`);
    
    setTimeout(() => {
      setAccounts(accounts.map(a => 
        a.id === accountId 
          ? { 
              ...a, 
              status: 'connected', 
              lastSync: new Date().toLocaleString('zh-CN'),
              tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          : a
      ));
      toast.success('重新授权成功');
    }, 1500);
  };

  const handleDisconnect = (accountId: string) => {
    if (confirm('确定要断开此账号连接吗？')) {
      setAccounts(accounts.filter(a => a.id !== accountId));
      toast.success('账号已断开连接');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getRegionLabel = (region: string) => {
    return regionOptions.find(r => r.value === region)?.label || region;
  };

  const connectedCount = accounts.filter(a => a.status === 'connected').length;
  const totalReach = accounts.reduce((sum, a) => sum + a.stats.reach, 0);
  const totalFollowers = accounts.reduce((sum, a) => sum + a.stats.followers, 0);
  const avgEngagement = accounts.length > 0 
    ? (accounts.reduce((sum, a) => sum + a.stats.engagement, 0) / accounts.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已连接账号</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{connectedCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总粉丝数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalFollowers)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总触达量</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalReach)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均互动率</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{avgEngagement}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>社交媒体账号管理</CardTitle>
              <CardDescription>统一管理所有社交媒体平台的官方账号</CardDescription>
            </div>
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  连接新账号
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>连接社交媒体账号</DialogTitle>
                  <DialogDescription>
                    选择要连接的平台和目标市场区域
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>选择平台</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择社交媒体平台" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(platformConfig).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span>{config.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedPlatform && (
                      <p className="text-xs text-gray-500">
                        {platformConfig[selectedPlatform as keyof typeof platformConfig].description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>目标市场区域</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择市场区域" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionOptions.map(region => (
                          <SelectItem key={region.value} value={region.value}>
                            <span>{region.flag} {region.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowConnectDialog(false)}
                    disabled={isConnecting}
                  >
                    取消
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleConnectAccount}
                    disabled={isConnecting || !selectedPlatform || !selectedRegion}
                  >
                    {isConnecting ? '连接中...' : '开始连接'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">全部账号 ({accounts.length})</TabsTrigger>
              <TabsTrigger value="connected">已连接 ({connectedCount})</TabsTrigger>
              <TabsTrigger value="expired">需要授权 ({accounts.filter(a => a.status === 'expired').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {accounts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">还没有连接任何账号</h3>
                  <p className="text-sm text-gray-600 mb-4">开始连接您的社交媒体账号以统一管理</p>
                  <Button onClick={() => setShowConnectDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    连接第一个账号
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {accounts.map(account => {
                    const config = platformConfig[account.platform];
                    const Icon = config.icon;
                    const needsReauth = account.status === 'expired';
                    const tokenExpiryDate = account.tokenExpiry ? new Date(account.tokenExpiry) : null;
                    const daysUntilExpiry = tokenExpiryDate 
                      ? Math.ceil((tokenExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <Card key={account.id} className={needsReauth ? 'border-yellow-300' : ''}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
                                  {getStatusBadge(account.status)}
                                </div>
                                <p className="text-sm text-gray-600">{account.accountHandle}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {regionOptions.find(r => r.value === account.region)?.flag} {getRegionLabel(account.region)}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    最后同步: {account.lastSync}
                                  </span>
                                </div>
                                {daysUntilExpiry !== null && daysUntilExpiry <= 7 && account.status === 'connected' && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>授权将在 {daysUntilExpiry} 天后过期</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {needsReauth ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                  onClick={() => handleReauthorize(account.id)}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  重新授权
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleRefreshAccount(account.id)}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  刷新
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDisconnect(account.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* 账号统计 */}
                          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">粉丝数</p>
                              <p className="text-lg font-semibold text-gray-900">{formatNumber(account.stats.followers)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">互动率</p>
                              <p className="text-lg font-semibold text-gray-900">{account.stats.engagement}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">发布数</p>
                              <p className="text-lg font-semibold text-gray-900">{account.stats.posts}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">触达量</p>
                              <p className="text-lg font-semibold text-gray-900">{formatNumber(account.stats.reach)}</p>
                            </div>
                          </div>

                          {/* 快捷操作 */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <Button variant="outline" size="sm" className="flex-1 gap-2">
                              <BarChart3 className="w-4 h-4" />
                              查看数据
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 gap-2">
                              <ExternalLink className="w-4 h-4" />
                              访问主页
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="connected" className="space-y-4">
              {accounts.filter(a => a.status === 'connected').map(account => {
                const config = platformConfig[account.platform];
                const Icon = config.icon;
                
                return (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
                          <p className="text-sm text-gray-600">{account.accountHandle}</p>
                        </div>
                        {getStatusBadge(account.status)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {accounts.filter(a => a.status === 'expired').map(account => {
                const config = platformConfig[account.platform];
                const Icon = config.icon;
                
                return (
                  <Card key={account.id} className="border-yellow-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
                          <p className="text-sm text-gray-600">{account.accountHandle}</p>
                          <p className="text-xs text-yellow-600 mt-1">需要重新授权才能继续使用</p>
                        </div>
                        <Button 
                          size="sm"
                          className="gap-2"
                          onClick={() => handleReauthorize(account.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                          重新授权
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 平台连接指南 */}
      <Card>
        <CardHeader>
          <CardTitle>平台连接指南</CardTitle>
          <CardDescription>如何连接各个社交媒体平台</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(platformConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isConnected = accounts.some(a => a.platform === key && a.status === 'connected');
              
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{config.name}</h4>
                        {isConnected && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{config.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}