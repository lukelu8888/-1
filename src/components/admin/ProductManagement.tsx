import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Image, Video, Upload, Plus, X, Trash2, Eye, ArrowLeft, Save, Star, Grid3x3, List, Wand2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import ProductCreationWizard from './ProductCreationWizard';
import { productCategories } from '../../data/productCategories';

export default function ProductManagement() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // 模拟产品数据
  const [products, setProducts] = useState([
    { 
      id: 'PRD-001', 
      name: 'Door Lock Set Premium', 
      category: '门锁系列',
      description: '高品质门锁套装，适用于各类室内外门',
      mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        'https://images.unsplash.com/photo-1582719471327-0c8f2d9a6a0c?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        'https://images.unsplash.com/photo-1584622781867-1c6c1f6b1c4c?w=800',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
      ],
      videos: [
        { id: 'v1', name: '产品介绍视频.mp4', duration: '2:30', size: '45MB', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' }
      ],
      status: 'published',
      statusLabel: '已发布',
      views: 1245,
      createTime: '2025-11-10',
      updateTime: '2天前'
    },
    { 
      id: 'PRD-002', 
      name: 'Cabinet Hinges Deluxe', 
      category: '铰链系列',
      description: '豪华柜门铰链，静音顺滑，耐用持久',
      mainImage: 'https://images.unsplash.com/photo-1581858726788-75bc0f1a4e8c?w=800',
      images: [
        'https://images.unsplash.com/photo-1581858726788-75bc0f1a4e8c?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
        'https://images.unsplash.com/photo-1584622781867-1c6c1f6b1c4c?w=800',
      ],
      videos: [],
      status: 'draft',
      statusLabel: '草稿',
      views: 0,
      createTime: '2025-11-16',
      updateTime: '1天前'
    },
    { 
      id: 'PRD-003', 
      name: 'Window Hardware Kit', 
      category: '窗户配件',
      description: '全套窗户五金配件，安装便捷，质量可靠',
      mainImage: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',
      images: [
        'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',
        'https://images.unsplash.com/photo-1582719471327-0c8f2d9a6a0c?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
        'https://images.unsplash.com/photo-1584622781867-1c6c1f6b1c4c?w=800',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      ],
      videos: [
        { id: 'v1', name: '安装教程.mp4', duration: '5:20', size: '85MB', thumbnail: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400' },
        { id: 'v2', name: '产品演示.mp4', duration: '3:15', size: '52MB', thumbnail: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400' }
      ],
      status: 'published',
      statusLabel: '已发布',
      views: 892,
      createTime: '2025-11-08',
      updateTime: '3天前'
    },
  ]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      published: 'bg-green-100 text-green-800 border-green-300',
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      offline: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // 如果显示向导，直接返回向导组件
  if (showWizard) {
    return <ProductCreationWizard onComplete={() => setShowWizard(false)} />;
  }

  return (
    <div className="space-y-4 pb-6">
      {/* 页面标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>产品管理</h1>
          <p className="text-gray-500" style={{ fontSize: '12px' }}>管理网站前端展示的产品图片和视频资源</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            className="h-8 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
            style={{ fontSize: '12px' }}
            onClick={() => setShowWizard(true)}
          >
            <Wand2 className="w-4 h-4 mr-1.5" />
            创建向导
          </Button>
          <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-700" style={{ fontSize: '12px' }}>
            <Plus className="w-4 h-4 mr-1.5" />
            快速添加
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="搜索产品名称、产品编号..."
              className="h-9"
              style={{ fontSize: '12px' }}
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-36" style={{ fontSize: '12px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-96 overflow-y-auto">
              <SelectItem value="all" style={{ fontSize: '12px' }}>全部分类</SelectItem>
              {productCategories.map((category) => (
                <React.Fragment key={category.id}>
                  {/* 一级分类作为分组标题 */}
                  <div className="px-2 py-2 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-900" style={{ fontSize: '11px', fontWeight: 700 }}>
                      {category.label} / {category.enLabel}
                    </p>
                  </div>
                  {/* 二级分类作为选项 */}
                  {category.categories.map((subCategory) => (
                    <SelectItem 
                      key={`${category.id}-${subCategory.id}`}
                      value={`${category.id}-${subCategory.id}`} 
                      style={{ fontSize: '11px', paddingLeft: '24px' }}
                    >
                      {subCategory.label} / {subCategory.enLabel}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-28" style={{ fontSize: '12px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
              <SelectItem value="published" style={{ fontSize: '12px' }}>已发布</SelectItem>
              <SelectItem value="draft" style={{ fontSize: '12px' }}>草稿</SelectItem>
              <SelectItem value="offline" style={{ fontSize: '12px' }}>已下线</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 网格视图 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-all overflow-hidden group">
              {/* 产品主图 */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <ImageWithFallback 
                  src={product.mainImage} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                  <Badge className={`h-6 px-2.5 border ${getStatusColor(product.status)}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                    {product.statusLabel}
                  </Badge>
                  {product.images.length > 0 && product.images[0] === product.mainImage && (
                    <div className="bg-yellow-500 text-white rounded px-2 py-0.5 flex items-center gap-1" style={{ fontSize: '10px' }}>
                      <Star className="w-3 h-3 fill-white" />
                      主图
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" className="h-8 px-3 bg-white text-gray-900 hover:bg-gray-100" style={{ fontSize: '11px' }}>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    上传
                  </Button>
                  <Button size="sm" className="h-8 px-3 bg-white text-gray-900 hover:bg-gray-100" style={{ fontSize: '11px' }}>
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    查看
                  </Button>
                </div>
              </div>
              
              {/* 产品信息 */}
              <div className="p-3.5">
                <div className="mb-2.5">
                  <p className="text-gray-900 mb-1 line-clamp-1" style={{ fontSize: '13px', fontWeight: 600 }}>{product.name}</p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>{product.id}</p>
                </div>
                
                <Badge variant="outline" className="h-5 px-2 mb-3" style={{ fontSize: '10px' }}>
                  {product.category}
                </Badge>

                {/* 媒体资源统计 */}
                <div className="flex items-center gap-4 mb-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-blue-50 rounded flex items-center justify-center">
                      <Image className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>{product.images.length}</p>
                      <p className="text-gray-500" style={{ fontSize: '10px' }}>张图片</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-purple-50 rounded flex items-center justify-center">
                      <Video className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>{product.videos.length}</p>
                      <p className="text-gray-500" style={{ fontSize: '10px' }}>个视频</p>
                    </div>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between text-gray-500 mb-3" style={{ fontSize: '11px' }}>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{product.views.toLocaleString()} 次浏览</span>
                  </div>
                  <span>{product.updateTime}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 flex-1" 
                    style={{ fontSize: '11px' }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    管理媒体
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* 添加新产品卡片 */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
            <div className="aspect-square flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-900 mb-1.5" style={{ fontSize: '13px', fontWeight: 600 }}>添加新产品</p>
                <p className="text-gray-500" style={{ fontSize: '11px' }}>上传产品图片和视频</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>产品信息</th>
                  <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>分类</th>
                  <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>图片</th>
                  <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>视频</th>
                  <th className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600 }}>状态</th>
                  <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>浏览量</th>
                  <th className="px-4 py-3 text-right" style={{ fontSize: '11px', fontWeight: 600 }}>更新时间</th>
                  <th className="px-4 py-3 text-center" style={{ fontSize: '11px', fontWeight: 600 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                          <ImageWithFallback 
                            src={product.mainImage} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>{product.name}</p>
                          <p className="text-gray-500" style={{ fontSize: '11px' }}>{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Image className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>{product.images.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Video className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>{product.videos.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`h-5 px-2 border ${getStatusColor(product.status)}`} style={{ fontSize: '11px' }}>
                        {product.statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-900" style={{ fontSize: '12px' }}>{product.views.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500" style={{ fontSize: '11px' }}>
                      {product.updateTime}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2" 
                          style={{ fontSize: '11px' }}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          管理
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 产品详情/媒体管理弹窗 */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedProduct(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 600 }}>{selectedProduct.name}</p>
                  <p className="text-gray-500" style={{ fontSize: '12px', fontWeight: 400 }}>{selectedProduct.id}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="images" className="mt-4">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  产品图片 ({selectedProduct.images.length})
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  产品视频 ({selectedProduct.videos.length})
                </TabsTrigger>
              </TabsList>

              {/* 图片管理 */}
              <TabsContent value="images" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600" style={{ fontSize: '12px' }}>管理产品展示图片（主图+附图）</p>
                    <Button className="h-8 px-4 bg-blue-600 hover:bg-blue-700" style={{ fontSize: '11px' }}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      上传图片
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {selectedProduct.images.map((img: string, index: number) => (
                      <div key={index} className="relative group aspect-square bg-gray-100 rounded border-2 border-gray-200 overflow-hidden">
                        <ImageWithFallback 
                          src={img} 
                          alt={`产品图 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded px-2 py-0.5 flex items-center gap-1" style={{ fontSize: '10px', fontWeight: 600 }}>
                            <Star className="w-3 h-3 fill-white" />
                            主图
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" className="h-7 w-7 p-0 bg-white hover:bg-gray-100">
                            <Eye className="w-3.5 h-3.5 text-gray-900" />
                          </Button>
                          <Button size="sm" className="h-7 w-7 p-0 bg-white hover:bg-gray-100">
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                          {index + 1}/{selectedProduct.images.length}
                        </div>
                      </div>
                    ))}
                    
                    {/* 上传新图片 */}
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer flex items-center justify-center transition-all">
                      <div className="text-center">
                        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>添加图片</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 视频管理 */}
              <TabsContent value="videos" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600" style={{ fontSize: '12px' }}>管理产品介绍视频</p>
                    <Button className="h-8 px-4 bg-purple-600 hover:bg-purple-700" style={{ fontSize: '11px' }}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      上传视频
                    </Button>
                  </div>

                  {selectedProduct.videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProduct.videos.map((video: any) => (
                        <div key={video.id} className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-all overflow-hidden">
                          <div className="relative aspect-video bg-gray-900">
                            <ImageWithFallback 
                              src={video.thumbnail} 
                              alt={video.name}
                              className="w-full h-full object-cover opacity-70"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                <Video className="w-8 h-8 text-purple-600" />
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded px-2 py-1" style={{ fontSize: '10px' }}>
                              {video.duration}
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>{video.name}</p>
                            <p className="text-gray-500 mb-3" style={{ fontSize: '11px' }}>文件大小: {video.size}</p>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-7 flex-1" style={{ fontSize: '11px' }}>
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                预览
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>暂无产品视频</p>
                      <p className="text-gray-500 mb-4" style={{ fontSize: '11px' }}>上传产品介绍、使用教程等视频</p>
                      <Button className="h-8 px-4 bg-purple-600 hover:bg-purple-700" style={{ fontSize: '11px' }}>
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        上传第一个视频
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                取消
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-1.5" />
                保存更改
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}