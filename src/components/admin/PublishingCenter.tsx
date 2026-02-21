import React, { useState } from 'react';
import { 
  Send,
  Image as ImageIcon,
  Video,
  Calendar,
  Link2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Plus,
  Paperclip,
  Hash,
  AtSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

interface PublishPost {
  id: string;
  content: string;
  platforms: string[];
  media: { type: 'image' | 'video'; url: string }[];
  link?: string;
  utm: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
  };
  scheduleDate?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt?: string;
}

const platformOptions = [
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-600' },
  { id: 'twitter', name: 'Twitter/X', color: 'bg-black' },
  { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
  { id: 'pinterest', name: 'Pinterest', color: 'bg-red-700' },
];

export default function PublishingCenter() {
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postLink, setPostLink] = useState('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [autoUTM, setAutoUTM] = useState(true);
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');

  const [publishedPosts, setPublishedPosts] = useState<PublishPost[]>([
    {
      id: '1',
      content: '🎉 新品发布！全新LED智能照明系列，节能50%，寿命延长3倍！',
      platforms: ['linkedin', 'facebook'],
      media: [],
      link: 'https://cosun.com/products/led-smart-lighting',
      utm: {
        source: 'linkedin',
        medium: 'social',
        campaign: 'led-launch-2025',
        content: 'product-announcement'
      },
      status: 'published',
      publishedAt: '2025-11-15 10:30'
    },
    {
      id: '2',
      content: '🏭 工厂直播进行中！带您参观我们的现代化生产线。',
      platforms: ['instagram', 'facebook', 'youtube'],
      media: [{ type: 'video', url: '/video-thumb.jpg' }],
      status: 'scheduled',
      scheduleDate: '2025-11-20 14:00'
    }
  ]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleAddHashtag = () => {
    if (newHashtag && !hashtags.includes(newHashtag)) {
      setHashtags([...hashtags, newHashtag]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const generateUTMLink = (platform: string) => {
    if (!postLink || !autoUTM) return postLink;
    
    const url = new URL(postLink);
    url.searchParams.set('utm_source', platform);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', utmCampaign || 'social-post');
    if (utmContent) {
      url.searchParams.set('utm_content', utmContent);
    }
    return url.toString();
  };

  const handlePublish = async () => {
    if (!postContent.trim()) {
      toast.error('请输入发布内容');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('请选择至少一个发布平台');
      return;
    }

    const newPost: PublishPost = {
      id: Date.now().toString(),
      content: postContent,
      platforms: selectedPlatforms,
      media: [],
      link: postLink,
      utm: {
        source: selectedPlatforms[0],
        medium: 'social',
        campaign: utmCampaign || 'social-post',
        content: utmContent
      },
      status: scheduleMode ? 'scheduled' : 'published',
      ...(scheduleMode && scheduleDate && scheduleTime 
        ? { scheduleDate: `${scheduleDate} ${scheduleTime}` }
        : { publishedAt: new Date().toLocaleString('zh-CN') }
      )
    };

    setPublishedPosts([newPost, ...publishedPosts]);
    
    toast.success(
      scheduleMode ? '内容已加入发布计划' : '内容发布成功！',
      {
        description: scheduleMode 
          ? `将在 ${scheduleDate} ${scheduleTime} 自动发布`
          : `已同时发布到 ${selectedPlatforms.length} 个平台`
      }
    );

    // 重置表单
    setPostContent('');
    setPostLink('');
    setSelectedPlatforms([]);
    setHashtags([]);
    setScheduleDate('');
    setScheduleTime('');
  };

  const getStatusBadge = (status: PublishPost['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700">已发布</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700">待发布</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">草稿</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">失败</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 发布表单 */}
      <Card>
        <CardHeader>
          <CardTitle>创建新发布</CardTitle>
          <CardDescription>跨平台统一发布内容，自动添加UTM追踪参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 选择平台 */}
          <div className="space-y-3">
            <Label>发布平台</Label>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? `${platform.color} text-white border-transparent`
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
            {selectedPlatforms.length > 0 && (
              <p className="text-sm text-gray-600">
                已选择 {selectedPlatforms.length} 个平台
              </p>
            )}
          </div>

          {/* 发布内容 */}
          <div className="space-y-3">
            <Label>发布内容</Label>
            <Textarea
              placeholder="输入您的发布内容... 支持话题标签和@提及"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-32 resize-none"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{postContent.length} 字符</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Hash className="w-4 h-4" />
                  话题标签
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <AtSign className="w-4 h-4" />
                  提及用户
                </Button>
              </div>
            </div>
          </div>

          {/* 话题标签 */}
          <div className="space-y-3">
            <Label>话题标签</Label>
            <div className="flex gap-2">
              <Input
                placeholder="添加标签，如：LED照明"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag()}
              />
              <Button onClick={handleAddHashtag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    #{tag}
                    <button
                      onClick={() => handleRemoveHashtag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 添加链接和UTM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>添加链接</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoUTM}
                  onCheckedChange={setAutoUTM}
                />
                <span className="text-sm text-gray-600">自动UTM追踪</span>
              </div>
            </div>
            <Input
              placeholder="https://cosun.com/your-page"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
            />
            
            {autoUTM && postLink && (
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">UTM参数配置</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Campaign</Label>
                    <Input
                      placeholder="campaign-name"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Content</Label>
                    <Input
                      placeholder="content-id"
                      value={utmContent}
                      onChange={(e) => setUtmContent(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">预览链接：</p>
                  <div className="bg-white p-2 rounded border border-gray-200 text-xs break-all font-mono">
                    {generateUTMLink(selectedPlatforms[0] || 'social')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 媒体附件 */}
          <div className="space-y-3">
            <Label>媒体附件</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                添加图片
              </Button>
              <Button variant="outline" className="gap-2">
                <Video className="w-4 h-4" />
                添加视频
              </Button>
              <Button variant="outline" className="gap-2">
                <Paperclip className="w-4 h-4" />
                附件
              </Button>
            </div>
          </div>

          {/* 发布时间 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>发布时间</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={scheduleMode}
                  onCheckedChange={setScheduleMode}
                />
                <span className="text-sm text-gray-600">定时发布</span>
              </div>
            </div>
            
            {scheduleMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">日期</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label className="text-xs">时间</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1 gap-2">
              <Eye className="w-4 h-4" />
              预览
            </Button>
            <Button className="flex-1 gap-2" onClick={handlePublish}>
              {scheduleMode ? (
                <>
                  <Clock className="w-4 h-4" />
                  安排发布
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  立即发布
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 发布历史 */}
      <Card>
        <CardHeader>
          <CardTitle>发布历史</CardTitle>
          <CardDescription>查看所有已发布和计划发布的内容</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="published">已发布</TabsTrigger>
              <TabsTrigger value="scheduled">待发布</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {publishedPosts.map(post => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(post.status)}
                          <span className="text-xs text-gray-500">
                            {post.publishedAt || post.scheduleDate}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{post.content}</p>
                        {post.link && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                            <Link2 className="w-3 h-3" />
                            <span className="truncate">{post.link}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.platforms.map(platformId => {
                        const platform = platformOptions.find(p => p.id === platformId);
                        return platform ? (
                          <Badge key={platformId} variant="outline" className="text-xs">
                            {platform.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="published" className="space-y-4 mt-4">
              {publishedPosts.filter(p => p.status === 'published').map(post => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <p className="text-sm">{post.content}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4 mt-4">
              {publishedPosts.filter(p => p.status === 'scheduled').map(post => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <p className="text-sm">{post.content}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
