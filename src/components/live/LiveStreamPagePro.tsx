// 🎬 直播间页面 Pro版 - 完整功能实现
// 新增：实时聊天、数据统计、产品上架、预告提醒、互动礼物

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Radio, Users, Clock, Calendar, Eye, Share2, 
  ExternalLink, Play, Youtube, Linkedin, Facebook,
  MessageSquare, ThumbsUp, ChevronRight, Bell,
  Download, Bookmark, AlertCircle, Send, Heart,
  Gift, TrendingUp, BarChart3, ShoppingCart, Package,
  Star, Zap, Award, Timer, DollarSign, Tag, X,
  Settings, Video, Mic, MicOff, VideoOff
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  speaker: string;
  startTime: string;
  duration: string;
  status: 'live' | 'upcoming' | 'ended';
  viewers: number;
  platforms: {
    youtube?: string;
    linkedin?: string;
    facebook?: string;
  };
  topics: string[];
  language: string;
  thumbnailUrl?: string;
}

interface ChatMessage {
  id: number;
  user: string;
  avatar: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'gift' | 'system';
  giftType?: string;
}

interface LiveProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  sold: number;
  description: string;
}

interface LiveStats {
  totalViewers: number;
  peakViewers: number;
  averageWatchTime: string;
  totalMessages: number;
  totalGifts: number;
  totalOrders: number;
  revenue: number;
  conversionRate: number;
}

// 模拟当前直播数据
const currentLive: LiveStream = {
  id: 'live-001',
  title: '2024新品发布会 - 智能门锁系列',
  description: '我们将为您展示最新的智能门锁产品系列，包括指纹识别、密码锁、远程控制等功能。现场演示产品性能，解答采购问题，并提供首发优惠政策。',
  speaker: '产品经理 张伟 + 技术总监 李明',
  startTime: '2024-11-25 10:00 AM EST',
  duration: '45分钟',
  status: 'live',
  viewers: 156,
  platforms: {
    youtube: 'https://youtube.com/live/example',
    linkedin: 'https://linkedin.com/video/live/example',
    facebook: 'https://facebook.com/live/example'
  },
  topics: ['智能门锁', '新品发布', 'B2B采购', '首发优惠'],
  language: 'English + 中文字幕'
};

// 直播商品列表
const liveProducts: LiveProduct[] = [
  {
    id: 'prod-001',
    name: '智能指纹门锁 X1 Pro',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400',
    price: 45.99,
    originalPrice: 59.99,
    discount: 23,
    stock: 500,
    sold: 87,
    description: '指纹识别 + 密码 + 卡片 + 钥匙 四合一开锁'
  },
  {
    id: 'prod-002',
    name: '智能密码锁 X2 Plus',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400',
    price: 38.50,
    originalPrice: 49.99,
    discount: 23,
    stock: 300,
    sold: 123,
    description: '虚位密码 + 防窥视设计 + APP远程管理'
  },
  {
    id: 'prod-003',
    name: '蓝牙智能锁 X3 Mini',
    image: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400',
    price: 32.00,
    originalPrice: 42.00,
    discount: 24,
    stock: 200,
    sold: 56,
    description: '蓝牙开锁 + 超长续航 + 低电量提醒'
  }
];

export function LiveStreamPagePro() {
  const [activeTab, setActiveTab] = useState('current');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      user: 'John Smith',
      avatar: 'JS',
      message: '产品看起来很专业！请问支持定制吗？',
      timestamp: new Date(Date.now() - 120000),
      type: 'normal'
    },
    {
      id: 2,
      user: 'Maria Garcia',
      avatar: 'MG',
      message: 'MOQ是多少？可以提供样品吗？',
      timestamp: new Date(Date.now() - 300000),
      type: 'normal'
    },
    {
      id: 3,
      user: 'System',
      avatar: '🎁',
      message: 'David Chen 送出了一个超级火箭！',
      timestamp: new Date(Date.now() - 180000),
      type: 'gift',
      giftType: 'rocket'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<LiveProduct | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 直播统计数据
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalViewers: 342,
    peakViewers: 198,
    averageWatchTime: '12:35',
    totalMessages: 156,
    totalGifts: 23,
    totalOrders: 45,
    revenue: 2067.55,
    conversionRate: 13.2
  });

  // 模拟实时更新观看人数
  useEffect(() => {
    if (currentLive.status === 'live') {
      const interval = setInterval(() => {
        const change = Math.floor(Math.random() * 10) - 4;
        currentLive.viewers = Math.max(100, currentLive.viewers + change);
        setLiveStats(prev => ({
          ...prev,
          totalViewers: prev.totalViewers + Math.abs(change),
          peakViewers: Math.max(prev.peakViewers, currentLive.viewers)
        }));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  // 模拟接收新消息
  useEffect(() => {
    if (currentLive.status === 'live') {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          const mockMessages = [
            '这个产品质量怎么样？',
            '支持国际物流吗？',
            '可以提供认证文件吗？',
            '价格很有竞争力！',
            '我想了解更多细节',
            '交货期是多久？'
          ];
          const mockUsers = ['Alice Wang', 'Bob Lee', 'Carol Zhang', 'David Liu', 'Emma Chen'];
          const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
          const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
          
          const newMsg: ChatMessage = {
            id: Date.now(),
            user: randomUser,
            avatar: randomUser.split(' ').map(n => n[0]).join(''),
            message: randomMessage,
            timestamp: new Date(),
            type: 'normal'
          };
          
          setChatMessages(prev => [...prev, newMsg]);
          setLiveStats(prev => ({
            ...prev,
            totalMessages: prev.totalMessages + 1
          }));
        }
      }, 8000);
      return () => clearInterval(interval);
    }
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 发送消息
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const msg: ChatMessage = {
      id: Date.now(),
      user: 'You',
      avatar: 'ME',
      message: newMessage,
      timestamp: new Date(),
      type: 'normal'
    };
    
    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');
    toast.success('消息已发送！');
  };

  // 发送礼物
  const handleSendGift = (giftType: string, giftName: string) => {
    const msg: ChatMessage = {
      id: Date.now(),
      user: 'System',
      avatar: '🎁',
      message: `You 送出了一个${giftName}！`,
      timestamp: new Date(),
      type: 'gift',
      giftType
    };
    
    setChatMessages(prev => [...prev, msg]);
    setLiveStats(prev => ({
      ...prev,
      totalGifts: prev.totalGifts + 1
    }));
    toast.success(`已送出${giftName}！`);
  };

  // 加入购物车
  const handleAddToCart = (product: LiveProduct) => {
    toast.success(`${product.name} 已加入购物车！`);
    setSelectedProduct(null);
    
    // 更新统计
    setLiveStats(prev => ({
      ...prev,
      totalOrders: prev.totalOrders + 1,
      revenue: prev.revenue + product.price,
      conversionRate: ((prev.totalOrders + 1) / prev.totalViewers * 100)
    }));
  };

  // 设置提醒
  const handleSetReminder = () => {
    if (!reminderEmail) {
      toast.error('请输入邮箱地址！');
      return;
    }
    
    // 这里应该调用后端API保存提醒
    toast.success('提醒已设置！我们会在直播开始前通过邮件通知您。');
    setShowReminder(false);
    setReminderEmail('');
  };

  // 计算倒计时
  const getCountdown = (startTime: string) => {
    return {
      days: 2,
      hours: 14,
      minutes: 35,
      seconds: 20
    };
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <Radio className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">COSUN Live Pro</h1>
                <p className="text-sm text-slate-600">专业直播系统</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowStats(true)}
              >
                <BarChart3 className="size-4" />
                数据统计
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="size-4" />
                直播日程
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="size-4" />
                下载资料
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="current" className="gap-2">
              <Radio className="size-4" />
              正在直播
              {currentLive.status === 'live' && (
                <Badge className="bg-red-500 text-white ml-2 animate-pulse">LIVE</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="size-4" />
              即将开始
              <Badge variant="outline" className="ml-2">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Play className="size-4" />
              往期回放
            </TabsTrigger>
          </TabsList>

          {/* 正在直播 */}
          <TabsContent value="current" className="space-y-6">
            {currentLive.status === 'live' ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 左侧：主视频区域 */}
                <div className="lg:col-span-3 space-y-4">
                  <Card className="overflow-hidden border-red-300 border-2">
                    {/* 直播状态栏 */}
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </div>
                            <span className="font-bold text-lg">LIVE NOW</span>
                          </div>
                          <div className="h-6 w-px bg-white/30" />
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="size-4" />
                            <span className="font-semibold">{currentLive.viewers}</span>
                            <span className="opacity-90">人正在观看</span>
                          </div>
                          <div className="h-6 w-px bg-white/30" />
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="size-4" />
                            <span className="font-semibold">{liveStats.totalMessages}</span>
                            <span className="opacity-90">条消息</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Share2 className="size-4" />
                            分享
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-2">
                            <Bookmark className="size-4" />
                            收藏
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 视频播放器 */}
                    <div className="relative bg-slate-900 aspect-video">
                      {/* 这里嵌入实际的视频播放器 */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        <div className="text-center">
                          <Play className="size-20 text-white/50 mx-auto mb-4" />
                          <p className="text-white/70 text-lg">视频播放器</p>
                          <p className="text-white/50 text-sm mt-2">直播将在这里显示</p>
                        </div>
                      </div>

                      {/* 浮动控制条 */}
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button size="sm" variant="secondary" className="bg-slate-900/80 hover:bg-slate-900">
                          <Video className="size-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-slate-900/80 hover:bg-slate-900">
                          <Mic className="size-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-slate-900/80 hover:bg-slate-900">
                          <Settings className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 直播信息 */}
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-slate-900 mb-3">
                        {currentLive.title}
                      </h2>
                      <p className="text-slate-600 mb-4">
                        {currentLive.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users className="size-4 text-blue-600" />
                          <span>{currentLive.speaker}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="size-4 text-green-600" />
                          <span>{currentLive.startTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="size-4 text-orange-600" />
                          <span>{currentLive.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MessageSquare className="size-4 text-purple-600" />
                          <span>{currentLive.language}</span>
                        </div>
                      </div>

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-2">
                        {currentLive.topics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* 直播商品展示 */}
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <ShoppingCart className="size-5 text-orange-600" />
                      直播商品 ({liveProducts.length})
                      <Badge className="bg-red-500 text-white ml-2">限时优惠</Badge>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {liveProducts.map((product) => (
                        <div 
                          key={product.id}
                          className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="relative aspect-square bg-slate-100">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                            {product.discount && (
                              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                                -{product.discount}%
                              </Badge>
                            )}
                            <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded text-xs">
                              已售 {product.sold}
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2">
                              {product.name}
                            </h4>
                            <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-red-600">
                                    ${product.price}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-xs text-slate-400 line-through">
                                      ${product.originalPrice}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  库存: {product.stock}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                              >
                                <ShoppingCart className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* 右侧：聊天互动区 */}
                <div className="lg:col-span-1 space-y-4">
                  {/* 实时聊天 */}
                  <Card className="flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="size-5 text-blue-600" />
                        实时互动
                        <Badge variant="outline" className="ml-auto">{chatMessages.length}</Badge>
                      </h3>
                    </div>

                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex gap-3 ${msg.type === 'system' ? 'justify-center' : ''} ${msg.type === 'gift' ? 'bg-yellow-50 -mx-4 px-4 py-2' : ''}`}
                        >
                          {msg.type !== 'system' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              msg.user === 'You' 
                                ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                                : msg.type === 'gift'
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                : 'bg-gradient-to-br from-blue-500 to-purple-500'
                            }`}>
                              {msg.avatar}
                            </div>
                          )}
                          <div className={`flex-1 min-w-0 ${msg.type === 'system' ? 'text-center' : ''}`}>
                            {msg.type !== 'system' && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-slate-900">{msg.user}</span>
                                <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                              </div>
                            )}
                            <p className={`text-sm ${
                              msg.type === 'gift' 
                                ? 'text-orange-700 font-semibold' 
                                : msg.type === 'system'
                                ? 'text-slate-600 text-xs'
                                : 'text-slate-700'
                            }`}>
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* 礼物快捷栏 */}
                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleSendGift('heart', '❤️ 爱心')}
                          className="flex-1 p-2 text-2xl hover:bg-slate-100 rounded transition-colors"
                          title="送爱心"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => handleSendGift('like', '👍 点赞')}
                          className="flex-1 p-2 text-2xl hover:bg-slate-100 rounded transition-colors"
                          title="点赞"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleSendGift('rocket', '🚀 火箭')}
                          className="flex-1 p-2 text-2xl hover:bg-slate-100 rounded transition-colors"
                          title="送火箭"
                        >
                          🚀
                        </button>
                        <button
                          onClick={() => handleSendGift('gift', '🎁 礼物')}
                          className="flex-1 p-2 text-2xl hover:bg-slate-100 rounded transition-colors"
                          title="送礼物"
                        >
                          🎁
                        </button>
                      </div>
                    </div>

                    {/* 输入框 */}
                    <div className="p-4 border-t border-slate-200">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="说点什么..."
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          className="gap-2"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <Send className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* 直播资料 */}
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📝 直播资料</h3>
                    <div className="space-y-3">
                      {[
                        { name: '产品目录 PDF', size: '2.3 MB' },
                        { name: '价格表 Excel', size: '156 KB' },
                        { name: '规格书 PDF', size: '1.8 MB' }
                      ].map((file, idx) => (
                        <Button key={idx} variant="outline" className="w-full justify-between" size="sm">
                          <span className="text-sm truncate">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{file.size}</span>
                            <Download className="size-4" />
                          </div>
                        </Button>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-semibold text-orange-900 mb-2">🎁 直播专属优惠</p>
                      <p className="text-xs text-orange-700 mb-3">
                        直播期间下单享受首单8折优惠，仅限前20名！
                      </p>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm">
                        立即咨询
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <AlertCircle className="size-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">当前没有正在进行的直播</h3>
                <p className="text-slate-600 mb-6">查看即将开始的直播或观看往期回放</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setActiveTab('upcoming')} className="gap-2">
                    <Clock className="size-4" />
                    查看即将直播
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('archive')} className="gap-2">
                    <Play className="size-4" />
                    观看回放
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* 即将开始 */}
          <TabsContent value="upcoming">
            <Card className="p-6 mb-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Bell className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">设置直播提醒</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    订阅即将开始的直播，我们会在开播前通过邮件通知您
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowReminder(true)}
                  >
                    <Bell className="size-4 mr-2" />
                    订阅提醒
                  </Button>
                </div>
              </div>
            </Card>

            <div className="text-sm text-slate-600 mb-4">
              即将进行 2 场直播
            </div>

            <div className="space-y-4">
              {/* 这里可以添加即将开始的直播列表 */}
              <Card className="p-6">
                <div className="text-center text-slate-500">
                  即将开始的直播列表...
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 往期回放 */}
          <TabsContent value="archive">
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-video bg-slate-200">
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
                      <Play className="size-12 text-white" />
                    </div>
                    <Badge className="absolute top-2 right-2 bg-slate-900/80 text-white">
                      45:23
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-slate-900 mb-2">
                      工厂参观直播 #{i}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      2024-11-{20+i} | 观看: 230次
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <ThumbsUp className="size-4 text-slate-400" />
                        <span className="text-xs text-slate-600">45</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                        观看回放
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 产品详情对话框 */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5" />
              商品详情
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedProduct.discount && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                      省 ${(selectedProduct.originalPrice! - selectedProduct.price).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {selectedProduct.name}
                </h3>
                
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-red-600">
                      ${selectedProduct.price}
                    </span>
                    {selectedProduct.originalPrice && (
                      <>
                        <span className="text-lg text-slate-400 line-through">
                          ${selectedProduct.originalPrice}
                        </span>
                        <Badge className="bg-red-500 text-white">
                          -{selectedProduct.discount}%
                        </Badge>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>库存: {selectedProduct.stock}</span>
                    <span>•</span>
                    <span>已售: {selectedProduct.sold}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-2">产品描述</h4>
                  <p className="text-sm text-slate-600">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 gap-2"
                    onClick={() => handleAddToCart(selectedProduct)}
                  >
                    <ShoppingCart className="size-4" />
                    立即购买
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="size-4" />
                    联系客服
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-700 flex items-center gap-2">
                    <Zap className="size-4" />
                    直播专属优惠！限时限量抢购
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 数据统计对话框 */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              直播数据统计
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '累计观看', value: liveStats.totalViewers, icon: Eye, color: 'blue' },
              { label: '峰值人数', value: liveStats.peakViewers, icon: TrendingUp, color: 'purple' },
              { label: '互动消息', value: liveStats.totalMessages, icon: MessageSquare, color: 'green' },
              { label: '总订单数', value: liveStats.totalOrders, icon: ShoppingCart, color: 'orange' }
            ].map((stat, idx) => (
              <Card key={idx} className="p-4">
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className={`size-5 text-${stat.color}-600`} />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="size-5 text-green-600" />
                营收数据
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">总销售额</span>
                  <span className="text-lg font-bold text-green-600">
                    ${liveStats.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">转化率</span>
                  <span className="text-lg font-bold text-blue-600">
                    {liveStats.conversionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">平均客单价</span>
                  <span className="text-lg font-bold text-purple-600">
                    ${(liveStats.revenue / liveStats.totalOrders).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Timer className="size-5 text-orange-600" />
                互动数据
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">平均观看时长</span>
                  <span className="text-lg font-bold text-slate-900">
                    {liveStats.averageWatchTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">总礼物数</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {liveStats.totalGifts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">互动率</span>
                  <span className="text-lg font-bold text-green-600">
                    {((liveStats.totalMessages / liveStats.totalViewers) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-4 text-center text-sm text-slate-500">
            数据每5秒自动更新
          </div>
        </DialogContent>
      </Dialog>

      {/* 提醒设置对话框 */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              设置直播提醒
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                邮箱地址
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">
                我们会在直播开始前30分钟发送邮件提醒您
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowReminder(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleSetReminder}>
                <Bell className="size-4 mr-2" />
                设置提醒
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
