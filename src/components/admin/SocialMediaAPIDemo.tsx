import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSocialMediaAPI, formatAccountForUI } from '../../hooks/useSocialMediaAPI';
import { toast } from 'sonner';
import { 
  Linkedin, 
  Facebook, 
  Instagram, 
  Youtube,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
  Eye
} from 'lucide-react';

const platformIcons: Record<string, any> = {
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube
};

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  instagram: 'bg-pink-600',
  youtube: 'bg-red-600',
  pinterest: 'bg-red-500',
  twitter: 'bg-sky-500'
};

export default function SocialMediaAPIDemo() {
  const {
    accounts,
    loading,
    error,
    loadAccounts,
    connectAccount,
    disconnectAccount,
    refreshAccount,
    publishContent,
    getPublishHistory,
    getAccountAnalytics
  } = useSocialMediaAPI();

  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // 发布表单状态
  const [publishForm, setPublishForm] = useState({
    content: '',
    link: '',
    selectedAccounts: [] as string[],
    utmSource: '',
    utmMedium: 'social',
    utmCampaign: ''
  });

  const [publishHistory, setPublishHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Map<string, any>>(new Map());

  // 加载发布历史
  useEffect(() => {
    getPublishHistory(10).then(history => {
      if (history) setPublishHistory(history);
    });
  }, [getPublishHistory]);

  // 连接账号处理
  const handleConnectAccount = async () => {
    if (!selectedPlatform || !selectedRegion) {
      toast.error('Please select platform and region');
      return;
    }

    setIsConnecting(true);
    try {
      const account = await connectAccount(selectedPlatform, selectedRegion);
      toast.success(`Successfully connected ${account.platform} account!`);
      setSelectedPlatform('');
      setSelectedRegion('');
    } catch (err) {
      toast.error('Failed to connect account');
    } finally {
      setIsConnecting(false);
    }
  };

  // 断开账号
  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect this ${platform} account?`)) {
      return;
    }

    try {
      await disconnectAccount(accountId);
      toast.success('Account disconnected successfully');
    } catch (err) {
      toast.error('Failed to disconnect account');
    }
  };

  // 刷新账号
  const handleRefresh = async (accountId: string) => {
    try {
      await refreshAccount(accountId);
      toast.success('Account refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh account');
    }
  };

  // 发布内容
  const handlePublish = async () => {
    if (!publishForm.content.trim()) {
      toast.error('Please enter content to publish');
      return;
    }

    if (publishForm.selectedAccounts.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    try {
      const results = await publishContent({
        content: publishForm.content,
        platforms: publishForm.selectedAccounts,
        link: publishForm.link || undefined,
        utmParams: publishForm.utmCampaign ? {
          source: publishForm.utmSource || 'social',
          medium: publishForm.utmMedium || 'social',
          campaign: publishForm.utmCampaign
        } : undefined
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully published to ${successCount} platform${successCount > 1 ? 's' : ''}!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to publish to ${failCount} platform${failCount > 1 ? 's' : ''}`);
      }

      // 清空表单
      setPublishForm({
        content: '',
        link: '',
        selectedAccounts: [],
        utmSource: '',
        utmMedium: 'social',
        utmCampaign: ''
      });

      // 刷新发布历史
      const history = await getPublishHistory(10);
      if (history) setPublishHistory(history);

    } catch (err) {
      toast.error('Failed to publish content');
    }
  };

  // 切换账号选择
  const toggleAccountSelection = (accountId: string) => {
    setPublishForm(prev => ({
      ...prev,
      selectedAccounts: prev.selectedAccounts.includes(accountId)
        ? prev.selectedAccounts.filter(id => id !== accountId)
        : [...prev.selectedAccounts, accountId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900 mb-2">Social Media API Integration</h2>
        <p className="text-gray-600">
          Real-time social media account management and publishing system
        </p>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="publish">Publish Content</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="demo">API Demo</TabsTrigger>
        </TabsList>

        {/* 账号管理标签 */}
        <TabsContent value="accounts" className="space-y-4">
          {/* 连接新账号 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Connect New Account
              </CardTitle>
              <CardDescription>
                Add a new social media account to manage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="pinterest">Pinterest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Region</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north-america">North America</SelectItem>
                      <SelectItem value="south-america">South America</SelectItem>
                      <SelectItem value="europe-africa">Europe & Africa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleConnectAccount} 
                disabled={!selectedPlatform || !selectedRegion || isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 已连接账号列表 */}
          <div className="grid gap-4">
            {loading && accounts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading accounts...
                </CardContent>
              </Card>
            ) : accounts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No accounts connected yet. Connect your first account above!
                </CardContent>
              </Card>
            ) : (
              accounts.map(account => {
                const Icon = platformIcons[account.platform];
                const color = platformColors[account.platform];
                
                return (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                            {Icon && <Icon className="w-6 h-6 text-white" />}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-gray-900">{account.accountName}</h4>
                              <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                                {account.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              @{account.accountId} • {account.region}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {account.followers?.toLocaleString() || 0} followers
                              </span>
                              <span>
                                Connected: {new Date(account.connectedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefresh(account.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(account.id, account.platform)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* 发布内容标签 */}
        <TabsContent value="publish" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish to Social Media</CardTitle>
              <CardDescription>
                Create and publish content across multiple platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 选择平台 */}
              <div>
                <Label className="mb-3 block">Select Platforms</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {accounts.map(account => {
                    const Icon = platformIcons[account.platform];
                    const color = platformColors[account.platform];
                    const isSelected = publishForm.selectedAccounts.includes(account.id);
                    
                    return (
                      <button
                        key={account.id}
                        onClick={() => toggleAccountSelection(account.id)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                            {Icon && <Icon className="w-5 h-5 text-white" />}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {account.platform}
                            </div>
                            <div className="text-xs text-gray-500">
                              {account.accountName}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 内容 */}
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={publishForm.content}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="What would you like to share?"
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* 链接 */}
              <div>
                <Label htmlFor="link">Link (optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={publishForm.link}
                  onChange={(e) => setPublishForm(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>

              {/* UTM参数 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="utmSource">UTM Source</Label>
                  <Input
                    id="utmSource"
                    value={publishForm.utmSource}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, utmSource: e.target.value }))}
                    placeholder="social"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="utmMedium">UTM Medium</Label>
                  <Input
                    id="utmMedium"
                    value={publishForm.utmMedium}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, utmMedium: e.target.value }))}
                    placeholder="social"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="utmCampaign">UTM Campaign</Label>
                  <Input
                    id="utmCampaign"
                    value={publishForm.utmCampaign}
                    onChange={(e) => setPublishForm(prev => ({ ...prev, utmCampaign: e.target.value }))}
                    placeholder="spring_sale_2025"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button 
                onClick={handlePublish}
                disabled={loading || publishForm.selectedAccounts.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish to {publishForm.selectedAccounts.length} Platform{publishForm.selectedAccounts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 发布历史标签 */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publishing History</CardTitle>
              <CardDescription>
                Recent posts published through the API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publishHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No posts published yet
                </div>
              ) : (
                <div className="space-y-3">
                  {publishHistory.map(post => (
                    <div key={post.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="capitalize">{post.platform}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(post.publishedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{post.content}</p>
                      {post.link && (
                        <a 
                          href={post.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {post.link}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API演示标签 */}
        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Status & Demo</CardTitle>
              <CardDescription>
                This is a fully functional mock API that simulates real social media integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">API is Running</h4>
                </div>
                <p className="text-sm text-green-700">
                  All API endpoints are functional and ready to use. The system is using mock data for development.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Current Capabilities:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>OAuth account connection (simulated)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Multi-platform publishing (LinkedIn, Facebook, Instagram, YouTube, Pinterest)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Automatic UTM parameter generation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Token refresh and account management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Publishing history tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Analytics data retrieval</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps for Production:</h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li>Deploy backend server to cloud (Alibaba Cloud, AWS, etc.)</li>
                  <li>Register apps on LinkedIn, Facebook, Instagram, YouTube, Pinterest</li>
                  <li>Replace mock OAuth with real OAuth endpoints</li>
                  <li>Set up production database (PostgreSQL or MySQL)</li>
                  <li>Configure environment variables with real API keys</li>
                  <li>Replace mock API calls with real platform API calls</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Technical Details:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>API Location:</strong> /api/social-media-api.ts</p>
                  <p><strong>Hook:</strong> /hooks/useSocialMediaAPI.ts</p>
                  <p><strong>Database:</strong> In-memory (mock)</p>
                  <p><strong>Authentication:</strong> OAuth 2.0 (simulated)</p>
                  <p><strong>Data Persistence:</strong> Session-based (resets on refresh)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
