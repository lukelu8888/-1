// 📺 直播回放存档页面 - /live/archive
// 展示所有历史直播录像

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Play, Clock, Eye, ThumbsUp, Download, Share2, 
  Search, Filter, Calendar, Users, Tag
} from 'lucide-react';

interface ArchiveVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  publishDate: string;
  views: number;
  likes: number;
  speaker: string;
  category: string;
  tags: string[];
  videoUrl: string;
}

// 模拟历史直播数据
const archiveVideos: ArchiveVideo[] = [
  {
    id: 'archive-001',
    title: '工厂参观直播 - 智能制造生产线全揭秘',
    description: '实地带您参观我们的智能制造工厂，展示产品从原材料到成品的完整生产流程。',
    thumbnailUrl: '',
    duration: '45:23',
    publishDate: '2024-11-20',
    views: 1250,
    likes: 89,
    speaker: '工厂总监 王强',
    category: '工厂参观',
    tags: ['智能制造', '生产流程', '质量控制'],
    videoUrl: ''
  },
  {
    id: 'archive-002',
    title: '2024秋季新品发布会 - 智能门锁系列',
    description: '发布最新智能门锁产品系列，包括指纹识别、密码锁、远程控制等创新功能。',
    thumbnailUrl: '',
    duration: '52:15',
    publishDate: '2024-11-18',
    views: 2340,
    likes: 156,
    speaker: '产品经理 张伟',
    category: '新品发布',
    tags: ['智能门锁', '新品', '技术创新'],
    videoUrl: ''
  },
  {
    id: 'archive-003',
    title: 'B2B采购指南 - 如何选择优质中国供应商',
    description: '采购专家分享选择中国供应商的经验和技巧，避坑指南，质量把控要点。',
    thumbnailUrl: '',
    duration: '38:42',
    publishDate: '2024-11-15',
    views: 890,
    likes: 67,
    speaker: 'Sarah Johnson',
    category: '采购指南',
    tags: ['采购技巧', '供应商选择', '质量控制'],
    videoUrl: ''
  },
  {
    id: 'archive-004',
    title: '客户见证 - 北美零售商成功案例分享',
    description: '邀请长期合作的北美零售商分享与我们合作的经验和取得的成果。',
    thumbnailUrl: '',
    duration: '29:18',
    publishDate: '2024-11-12',
    views: 1560,
    likes: 112,
    speaker: 'David Smith (客户)',
    category: '客户案例',
    tags: ['客户见证', '成功案例', '合作经验'],
    videoUrl: ''
  },
  {
    id: 'archive-005',
    title: '质量控制流程详解 - 如何保证产品质量',
    description: '详细讲解我们的质量控制体系，从原材料检测到成品验收的每个环节。',
    thumbnailUrl: '',
    duration: '41:55',
    publishDate: '2024-11-10',
    views: 780,
    likes: 54,
    speaker: '质检主管 李明',
    category: '质量管理',
    tags: ['质量控制', 'QC流程', '检测标准'],
    videoUrl: ''
  },
  {
    id: 'archive-006',
    title: '外贸实战 - 国际支付和物流解决方案',
    description: '外贸经理分享国际支付方式、物流选择、清关流程等实用知识。',
    thumbnailUrl: '',
    duration: '35:27',
    publishDate: '2024-11-08',
    views: 1120,
    likes: 98,
    speaker: '外贸经理 陈红',
    category: '外贸知识',
    tags: ['国际支付', '物流', '清关'],
    videoUrl: ''
  }
];

const categories = ['全部分类', '工厂参观', '新品发布', '采购指南', '客户案例', '质量管理', '外贸知识'];

export function LiveArchivePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [sortBy, setSortBy] = useState('latest');

  // 过滤和排序视频
  const filteredVideos = archiveVideos
    .filter(video => {
      const matchSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === '全部分类' || video.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      } else if (sortBy === 'popular') {
        return b.views - a.views;
      } else if (sortBy === 'liked') {
        return b.likes - a.likes;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部搜索栏 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">直播回放存档</h1>
            <p className="text-slate-600">观看往期精彩直播内容</p>
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                type="text"
                placeholder="搜索直播标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">最新发布</SelectItem>
                <SelectItem value="popular">最多观看</SelectItem>
                <SelectItem value="liked">最多点赞</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 视频网格 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            找到 <span className="font-semibold text-slate-900">{filteredVideos.length}</span> 个视频
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card 
              key={video.id} 
              className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
            >
              {/* 缩略图 */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-900">
                <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Play className="size-8 text-slate-900 ml-1" />
                  </div>
                </div>
                
                {/* 时长标签 */}
                <Badge className="absolute bottom-2 right-2 bg-black/80 text-white border-0">
                  <Clock className="size-3 mr-1" />
                  {video.duration}
                </Badge>

                {/* 分类标签 */}
                <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-0">
                  {video.category}
                </Badge>
              </div>

              {/* 视频信息 */}
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h3>
                
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {video.description}
                </p>

                {/* 讲师 */}
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <Users className="size-4 text-blue-600" />
                  <span>{video.speaker}</span>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {video.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Tag className="size-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Eye className="size-4" />
                      {video.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="size-4" />
                      {video.likes}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    <Calendar className="size-3 inline mr-1" />
                    {video.publishDate}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 gap-2">
                    <Play className="size-4" />
                    观看
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="size-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Share2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 空状态 */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Play className="size-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">未找到相关视频</h3>
            <p className="text-slate-600">尝试更换搜索关键词或筛选条件</p>
          </div>
        )}

        {/* 加载更多 */}
        {filteredVideos.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              加载更多视频
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
