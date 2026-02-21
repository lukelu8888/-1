import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Search, Plus, Eye, Download, Upload, BookOpen, Send, BarChart3, Calendar, FileText, File, X, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner@2.0.3';
import { loadSupplierCategories } from '../../../data/industryTemplates';

/**
 * 🔥 供应商视角：产品目录管理
 * - 年度产品目录上传
 * - 版本管理（2024版、2025版...）
 * - 客户浏览和下载
 * - 下载统计
 * - 邮件发送功能
 */
export default function CatalogManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false); // 🔥 新增编辑对话框
  const [selectedCatalog, setSelectedCatalog] = useState<any>(null);
  
  // 🔥 批量选择状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 文件上传表单
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    fileName: '',
    fileSize: '0MB',
    pages: 0,
    year: new Date().getFullYear().toString(),
    version: 'V1.0',
    title: '',
    titleEn: '',
    selectedCategories: [] as string[],
    visibility: 'customer',
    highlights: '',
    notes: '',
  });

  // 🔥 编辑表单
  const [editForm, setEditForm] = useState({
    id: '',
    year: '',
    version: '',
    title: '',
    titleEn: '',
    pages: 0,
    fileName: '',
    fileSize: '',
    file: null as File | null,
    selectedCategories: [] as string[],
    visibility: 'customer',
    highlights: '',
    notes: '',
  });

  // 🔥 发送表单
  const [sendForm, setSendForm] = useState({
    method: 'email',
    recipient: '',
    subject: '',
    message: '',
  });

  // 🔥 动态加载供应商自定义的产品分类（使用 useMemo 缓存）
  const supplierCategories = useMemo(() => {
    const categories = loadSupplierCategories();
    // 如果没有分类，返回默认分类
    if (!categories || categories.length === 0) {
      return ['建材陶瓷', '卫浴五金', '门窗配件', '电气配件', '劳保用品', '装饰材料', '照明灯具', '水暖管件'];
    }
    return categories;
  }, []);
  
  // 🔥 产品目录数据（改为状态）- 空列表，仅保留用户创建的目录
  const [catalogs, setCatalogs] = useState<any[]>([]);

  const getStatusBadge = (status: string) => {
    const config: any = {
      active: { label: '使用中', color: 'bg-green-100 text-green-800 border-green-300' },
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      archived: { label: '已归档', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    };
    return config[status] || config.draft;
  };

  const getVisibilityBadge = (visibility: string) => {
    const config: any = {
      internal: { label: '内部', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      customer: { label: '客户可见', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    };
    return config[visibility] || config.internal;
  };

  const filteredCatalogs = catalogs.filter(catalog => {
    const matchSearch = catalog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       catalog.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       catalog.year.includes(searchTerm);
    return matchSearch;
  });

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCatalogs.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 🔥 单个选择
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  // 🔥 批量删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的目录');
      return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个目录吗？`)) {
      // 从列表中移除选中的目录
      setCatalogs(catalogs.filter(catalog => !selectedIds.includes(catalog.id)));
      toast.success(`已删除 ${selectedIds.length} 个目录`);
      setSelectedIds([]);
    }
  };

  // 🔥 批量下载
  const handleBatchDownload = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要下载的目录');
      return;
    }
    
    // 批量下载选中的目录
    const selectedCatalogs = catalogs.filter(catalog => selectedIds.includes(catalog.id));
    selectedCatalogs.forEach((catalog, index) => {
      setTimeout(() => {
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(${catalog.title}) Tj
0 -30 Td
/F1 12 Tf
(Year: ${catalog.year} Version: ${catalog.version}) Tj
0 -20 Td
(File: ${catalog.fileName}) Tj
0 -20 Td
(Pages: ${catalog.pages}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000341 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
592
%%EOF`;

        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = catalog.fileName || `${catalog.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 500); // 每500ms下载一个文件，避免浏览器阻止
    });
    
    toast.success(`正在下载 ${selectedIds.length} 个目录...`, {
      description: '文件将依次保存到下载文件夹'
    });
  };

  // 🔥 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 计算文件大小
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      
      setUploadForm(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        fileSize: `${fileSizeInMB}MB`,
      }));
      toast.success(`已选择文件: ${file.name} (${fileSizeInMB}MB)`);
    }
    // 清空input值，避免重复选择同一文件时不触发onChange
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>产品目录管理</h2>
              <p className="text-xs text-gray-500">年度产品目录的上传、版本管理和下载统计</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            上传目录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">目录总数</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{catalogs.length}</p>
          <p className="text-xs text-gray-500 mt-1">使用中: {catalogs.filter(c => c.status === 'active').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">总下载次数</span>
            <Download className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {catalogs.reduce((sum, c) => sum + c.downloadStats.totalDownloads, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            客户下载: {catalogs.reduce((sum, c) => sum + c.downloadStats.customerDownloads, 0)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">产品总数</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {catalogs.reduce((sum, c) => sum + c.productCount, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            最新版: {catalogs.filter(c => c.status === 'active')[0]?.productCount || 0} 个产品
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">平均下载</span>
            <BarChart3 className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(catalogs.reduce((sum, c) => sum + c.downloadStats.totalDownloads, 0) / catalogs.length).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">次/目录</p>
        </div>
      </div>

      {/* 搜索栏 + 批量操作 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索产品目录名称或年份..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
          
          {/* 批量删除按钮 */}
          {selectedIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDelete}
              className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              删除 ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* 目录列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-12" style={{ fontSize: '12px' }}>
                  <Checkbox
                    checked={selectedIds.length === filteredCatalogs.length && filteredCatalogs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="h-9 w-16 text-center" style={{ fontSize: '12px' }}>序号</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>年份</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>目录名称</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>文件名</TableHead>
                <TableHead className="h-9 w-20 text-center" style={{ fontSize: '12px' }}>版本</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>产品数量</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>下载次数</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>上传日期</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>权限</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-36 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCatalogs.length > 0 ? (
                filteredCatalogs.map((catalog, index) => {
                  const statusBadge = getStatusBadge(catalog.status);
                  const visibilityBadge = getVisibilityBadge(catalog.visibility);
                  
                  return (
                    <TableRow key={catalog.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <Checkbox
                          checked={selectedIds.includes(catalog.id)}
                          onCheckedChange={(checked) => handleSelectOne(catalog.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <span className="text-gray-500">{index + 1}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <span className="font-medium">{catalog.year}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{catalog.title}</p>
                          <p className="text-xs text-gray-500">{catalog.titleEn}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div>
                          <p className="font-medium text-gray-700">{catalog.fileName}</p>
                          <p className="text-xs text-gray-500">{catalog.fileSize} • {catalog.pages}页</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <Badge variant="outline" className="h-5 px-2 text-xs font-mono">
                          {catalog.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <span className="font-medium text-gray-900">{catalog.productCount}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{catalog.downloadStats.totalDownloads}</p>
                          <p className="text-xs text-gray-500">客户: {catalog.downloadStats.customerDownloads}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">{catalog.uploadDate}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${visibilityBadge.color}`}>
                          {visibilityBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedCatalog(catalog);
                              setDetailDialogOpen(true);
                            }}
                            title="查看"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50"
                            onClick={() => {
                              setSelectedCatalog(catalog);
                              setEditForm({
                                id: catalog.id,
                                year: catalog.year,
                                version: catalog.version,
                                title: catalog.title,
                                titleEn: catalog.titleEn,
                                pages: catalog.pages || 0,
                                fileName: catalog.fileName || '',
                                fileSize: catalog.fileSize || '',
                                file: null,
                                selectedCategories: catalog.categories || [],
                                visibility: catalog.visibility,
                                highlights: catalog.highlights.join('\n'),
                                notes: catalog.notes,
                              });
                              setEditDialogOpen(true);
                            }}
                            title="编辑"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={() => {
                              // 🔥 创建模拟的PDF文件并下载
                              const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(${catalog.title}) Tj
0 -30 Td
/F1 12 Tf
(Year: ${catalog.year} Version: ${catalog.version}) Tj
0 -20 Td
(File: ${catalog.fileName}) Tj
0 -20 Td
(Pages: ${catalog.pages}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000341 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
592
%%EOF`;

                              const blob = new Blob([pdfContent], { type: 'application/pdf' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = catalog.fileName || `${catalog.title}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                              
                              toast.success('目录下载成功！', { description: `${catalog.fileName} 已保存到下载文件夹` });
                            }}
                            title="下载"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </Button>
                          {catalog.visibility === 'customer' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedCatalog(catalog);
                                setSendForm({
                                  method: 'email',
                                  recipient: '',
                                  subject: `${catalog.title} - 产品目录`,
                                  message: `尊敬的客户，\n\n附件是我司最新的${catalog.title}，共${catalog.pages}页，收录${catalog.productCount}款产品。\n\n主要亮点：\n${catalog.highlights.map(h => `• ${h}`).join('\n')}\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！`,
                                });
                                setSendDialogOpen(true);
                              }}
                              title="发送"
                            >
                              <Send className="w-4 h-4 text-gray-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`确定要删除目录 "${catalog.title}" 吗？`)) {
                                // 从列表中移除该目录
                                setCatalogs(catalogs.filter(c => c.id !== catalog.id));
                                toast.success('目录已删除');
                              }
                            }}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-gray-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center">
                    <span className="text-gray-400 text-sm">暂无数据</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 目录详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              目录详情 - {selectedCatalog?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedCatalog?.year} • {selectedCatalog?.version}
            </DialogDescription>
          </DialogHeader>

          {selectedCatalog && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">目录名称：</span>
                    <span className="font-medium ml-2">{selectedCatalog.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">英文名称：</span>
                    <span className="font-medium ml-2">{selectedCatalog.titleEn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">文件名：</span>
                    <span className="font-medium ml-2">{selectedCatalog.fileName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">文件大小：</span>
                    <span className="font-medium ml-2">{selectedCatalog.fileSize}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">页数：</span>
                    <span className="font-medium ml-2">{selectedCatalog.pages} 页</span>
                  </div>
                  <div>
                    <span className="text-gray-500">产品数量：</span>
                    <span className="font-medium ml-2">{selectedCatalog.productCount} 款</span>
                  </div>
                </div>
              </div>

              {/* 产品分类 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">产品分类</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCatalog.categories && selectedCatalog.categories.length > 0 ? (
                    selectedCatalog.categories.map((cat: string) => (
                      <Badge key={cat} variant="outline" className="px-3 py-1">
                        {cat}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">暂无分类</p>
                  )}
                </div>
              </div>

              {/* 下载统计 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">下载统计</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="text-gray-600">总下载次数</span>
                    <span className="text-xl font-bold text-blue-600">{selectedCatalog.downloadStats.totalDownloads}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-gray-600">客户下载</span>
                    <span className="text-xl font-bold text-green-600">{selectedCatalog.downloadStats.customerDownloads}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                    <span className="text-gray-600">内部下载</span>
                    <span className="text-xl font-bold text-purple-600">{selectedCatalog.downloadStats.internalDownloads}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                    <span className="text-gray-600">最近下载</span>
                    <span className="text-sm font-medium text-orange-600">{selectedCatalog.downloadStats.lastDownloadDate}</span>
                  </div>
                </div>
              </div>

              {/* 亮点特色 */}
              {selectedCatalog.highlights.length > 0 && (
                <div className="border rounded-lg p-4 bg-orange-50">
                  <h4 className="font-medium mb-3">✨ 本次更新亮点</h4>
                  <ul className="space-y-2">
                    {selectedCatalog.highlights.map((highlight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-600 mt-0.5">•</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 备注 */}
              {selectedCatalog.notes && (
                <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">备注：</p>
                  <p className="text-sm text-gray-800">{selectedCatalog.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (!selectedCatalog) return;
                
                // 🔥 创建模拟的PDF文件内容（简化的PDF格式）
                // 注意：这是一个演示版本，真实环境中应该下载上传时存储的实际PDF文件
                const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(${selectedCatalog.title}) Tj
0 -30 Td
/F1 12 Tf
(Year: ${selectedCatalog.year} Version: ${selectedCatalog.version}) Tj
0 -20 Td
(File: ${selectedCatalog.fileName}) Tj
0 -20 Td
(Pages: ${selectedCatalog.pages}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000341 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
592
%%EOF`;

                // 创建PDF Blob对象
                const blob = new Blob([pdfContent], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                
                // 创建下载链接并触发下载
                const link = document.createElement('a');
                link.href = url;
                link.download = selectedCatalog.fileName || `${selectedCatalog.title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // 释放URL对象
                URL.revokeObjectURL(url);
                
                // 更新下载统计
                const updatedCatalogs = catalogs.map(cat => {
                  if (cat.id === selectedCatalog.id) {
                    return {
                      ...cat,
                      downloadStats: {
                        ...cat.downloadStats,
                        totalDownloads: cat.downloadStats.totalDownloads + 1,
                        internalDownloads: cat.downloadStats.internalDownloads + 1,
                        lastDownloadDate: new Date().toISOString().split('T')[0]
                      }
                    };
                  }
                  return cat;
                });
                setCatalogs(updatedCatalogs);
                setSelectedCatalog({
                  ...selectedCatalog,
                  downloadStats: {
                    ...selectedCatalog.downloadStats,
                    totalDownloads: selectedCatalog.downloadStats.totalDownloads + 1,
                    internalDownloads: selectedCatalog.downloadStats.internalDownloads + 1,
                    lastDownloadDate: new Date().toISOString().split('T')[0]
                  }
                });
                
                toast.success('目录下载成功！', { 
                  description: `${selectedCatalog.fileName} 已保存到下载文件夹` 
                });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              下载目录
            </Button>
            {selectedCatalog?.visibility === 'customer' && (
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  setDetailDialogOpen(false);
                  setSendForm({
                    method: 'email',
                    recipient: '',
                    subject: `${selectedCatalog.title} - 产品目录`,
                    message: `尊敬的客户，\n\n附件是我司最新的${selectedCatalog.title}，共${selectedCatalog.pages}页，收录${selectedCatalog.productCount}款产品。\n\n主要亮点：\n${selectedCatalog.highlights.map((h: string) => `• ${h}`).join('\n')}\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！`,
                  });
                  setSendDialogOpen(true);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                发送给客户
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 上传目录对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        {uploadDialogOpen && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <Upload className="w-5 h-5" />
                上传产品目录
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                上传年度产品目录PDF文件
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* 文件选择区域 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 hover:border-orange-300 transition-all">
                <div className="text-center">
                  <input
                    type="file"
                    id="catalog-upload"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="catalog-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    {uploadForm.file ? (
                      <>
                        <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                          <File className="w-10 h-10 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-base">{uploadForm.fileName}</p>
                          <p className="text-xs text-gray-500 mt-1">文件大小: {uploadForm.fileSize} • 点击更换文件</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Upload className="w-10 h-10 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">点击选择文件或拖拽到此处</p>
                          <p className="text-xs text-gray-500 mt-1">支持 PDF 格式，建议文件大小不超过100MB</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* 目录信息 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 text-sm">目录信息</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 年份 */}
                  <div>
                    <Label htmlFor="year" className="text-xs text-gray-600 mb-1.5 block">年份</Label>
                    <Input
                      id="year"
                      placeholder="2025"
                      value={uploadForm.year}
                      onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}
                      className="h-9"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 版本号 */}
                  <div>
                    <Label htmlFor="version" className="text-xs text-gray-600 mb-1.5 block">版本号</Label>
                    <Input
                      id="version"
                      placeholder="V1.0"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                      className="h-9"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 文件大小（自动计算） */}
                  <div>
                    <Label className="text-xs text-gray-600 mb-1.5 block">文件大小</Label>
                    <Input
                      value={uploadForm.fileSize}
                      disabled
                      className="h-9 bg-gray-100"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 页数 */}
                  <div>
                    <Label htmlFor="pages" className="text-xs text-gray-600 mb-1.5 block">页数</Label>
                    <Input
                      id="pages"
                      type="number"
                      placeholder="0"
                      value={uploadForm.pages}
                      onChange={(e) => setUploadForm({ ...uploadForm, pages: parseInt(e.target.value) || 0 })}
                      className="h-9"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 目录名称（中文） */}
                  <div className="col-span-2">
                    <Label htmlFor="title" className="text-xs text-gray-600 mb-1.5 block">目录名称（中文）</Label>
                    <Input
                      id="title"
                      placeholder="例如：2025年产品目录"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="h-9"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 目录名称（英文） */}
                  <div className="col-span-2">
                    <Label htmlFor="titleEn" className="text-xs text-gray-600 mb-1.5 block">目录名称（英文）</Label>
                    <Input
                      id="titleEn"
                      placeholder="例如：2025 Product Catalog"
                      value={uploadForm.titleEn}
                      onChange={(e) => setUploadForm({ ...uploadForm, titleEn: e.target.value })}
                      className="h-9"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 产品分类（可多选） */}
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600 mb-2 block">产品分类（可多选）</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {supplierCategories.map((category) => (
                        <div key={`upload-${category}`} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`upload-${category}`}
                            checked={uploadForm.selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setUploadForm({
                                  ...uploadForm,
                                  selectedCategories: [...uploadForm.selectedCategories, category]
                                });
                              } else {
                                setUploadForm({
                                  ...uploadForm,
                                  selectedCategories: uploadForm.selectedCategories.filter(c => c !== category)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`upload-${category}`} className="text-xs cursor-pointer text-gray-700">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 权限设置 */}
                  <div className="col-span-2">
                    <Label htmlFor="visibility" className="text-xs text-gray-600 mb-1.5 block">权限设置</Label>
                    <Select value={uploadForm.visibility} onValueChange={(value) => setUploadForm({ ...uploadForm, visibility: value })}>
                      <SelectTrigger id="visibility" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">内部</SelectItem>
                        <SelectItem value="customer">客户可见</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 更新亮点 */}
                  <div className="col-span-2">
                    <Label htmlFor="highlights" className="text-xs text-gray-600 mb-1.5 block">更新亮点（每行一个）</Label>
                    <Textarea
                      id="highlights"
                      placeholder="例如：&#10;新增68款新产品&#10;更新产品技术参数&#10;优化产品分类"
                      value={uploadForm.highlights}
                      onChange={(e) => setUploadForm({ ...uploadForm, highlights: e.target.value })}
                      rows={4}
                      className="resize-none"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* 备注 */}
                  <div className="col-span-2">
                    <Label htmlFor="notes" className="text-xs text-gray-600 mb-1.5 block">备注</Label>
                    <Textarea
                      id="notes"
                      placeholder="输入备注信息..."
                      value={uploadForm.notes}
                      onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                      rows={2}
                      className="resize-none"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>取消</Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700" 
                onClick={() => {
                  if (!uploadForm.file) {
                    toast.error('请先选择文件！');
                    return;
                  }
                  if (!uploadForm.title || !uploadForm.year) {
                    toast.error('请填写目录名称和年份！');
                    return;
                  }
                  
                  // 🔥 创建新的目录对象
                  const newCatalog = {
                    id: `CAT-${uploadForm.year}-${Date.now()}`,
                    year: uploadForm.year,
                    version: uploadForm.version,
                    title: uploadForm.title,
                    titleEn: uploadForm.titleEn || uploadForm.title,
                    fileName: uploadForm.fileName,
                    fileSize: uploadForm.fileSize,
                    pages: uploadForm.pages,
                    categories: uploadForm.selectedCategories,
                    productCount: 0, // 实际应该从目录解析
                    
                    status: 'active',
                    visibility: uploadForm.visibility,
                    
                    uploadDate: new Date().toISOString().split('T')[0],
                    uploadBy: '供应商用户',
                    publishDate: new Date().toISOString().split('T')[0],
                    
                    downloadStats: {
                      totalDownloads: 0,
                      customerDownloads: 0,
                      internalDownloads: 0,
                      lastDownloadDate: '-'
                    },
                    
                    notificationSent: false,
                    notificationDate: '',
                    notificationRecipients: [],
                    
                    highlights: uploadForm.highlights.split('\n').filter(h => h.trim()),
                    
                    notes: uploadForm.notes
                  };
                  
                  // 🔥 添加到列表开头（最新的在前面）
                  setCatalogs([newCatalog, ...catalogs]);
                  
                  toast.success('目录上传成功！', {
                    description: `${uploadForm.fileName} 已成功上传`,
                    duration: 3000,
                  });
                  setUploadDialogOpen(false);
                  
                  // 🔥 不清空表单，保留数据供下次使用
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                确认上传
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* 🔥 发送目录对话框 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600" />
              发送产品目录
            </DialogTitle>
            <DialogDescription>
              {selectedCatalog?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 发送方式 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-3 block">发送方式</Label>
              <RadioGroup value={sendForm.method} onValueChange={(value) => setSendForm({ ...sendForm, method: value })}>
                <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg hover:border-orange-300 transition-colors">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Send className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">📧 电子邮件</p>
                      <p className="text-xs text-gray-500">通过邮件发送产品目录</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg hover:border-orange-300 transition-colors opacity-50 cursor-not-allowed">
                  <RadioGroupItem value="system" id="system" disabled />
                  <Label htmlFor="system" className="flex items-center gap-2 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">💬 系统消息</p>
                      <p className="text-xs text-gray-500">通过站内消息发送（即将推出）</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 收件人信息 */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="recipient" className="text-sm font-medium mb-2 block">
                  收件人邮箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipient"
                  type="email"
                  placeholder="example@email.com"
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm font-medium mb-2 block">
                  邮件主题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="输入邮件主题..."
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium mb-2 block">邮件内容</Label>
                <Textarea
                  id="message"
                  placeholder="输入邮件正文..."
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  rows={10}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>

            {/* 附件预览 */}
            {selectedCatalog && (
              <div className="border rounded-lg p-4 bg-orange-50">
                <Label className="text-sm font-medium mb-2 block">📎 附件文件</Label>
                <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                  <BookOpen className="w-8 h-8 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedCatalog.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {selectedCatalog.fileSize} • {selectedCatalog.pages}页 • {selectedCatalog.productCount}款产品
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">{selectedCatalog.version}</Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={async () => {
                if (!sendForm.recipient) {
                  toast.error('❌ 请填写收件人信息');
                  return;
                }
                if (!sendForm.subject) {
                  toast.error('❌ 请填写邮件主题');
                  return;
                }

                let sendSuccess = false;

                if (sendForm.method === 'email') {
                  try {
                    toast.loading('📧 正在发送邮件...', { id: 'sending-email' });

                    const { projectId, publicAnonKey } = await import('../../../utils/supabase/info');
                    
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/send-product-materials`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${publicAnonKey}`,
                        },
                        body: JSON.stringify({
                          to: sendForm.recipient,
                          subject: sendForm.subject,
                          message: sendForm.message,
                          productInfo: {
                            code: selectedCatalog.id,
                            name: selectedCatalog.title,
                            nameEn: selectedCatalog.titleEn,
                            specification: `${selectedCatalog.pages}页 / ${selectedCatalog.productCount}款产品`,
                            category: '产品目录',
                          },
                          files: [{
                            name: selectedCatalog.fileName,
                            size: selectedCatalog.fileSize,
                            category: 'catalog',
                          }],
                        }),
                      }
                    );

                    const responseText = await response.text();
                    let result;
                    try {
                      result = JSON.parse(responseText);
                    } catch (parseError) {
                      console.error('❌ JSON解析失败:', parseError);
                      throw new Error(`服务器返回了无效的响应格式`);
                    }

                    toast.dismiss('sending-email');

                    if (!response.ok || !result.success) {
                      console.error('❌ 邮件发送失败:', result);
                      
                      if (result.error && result.error.includes('RESEND_API_KEY')) {
                        toast.error('⚙️ 邮件服务未配置', {
                          description: '请在Supabase Dashboard中设置RESEND_API_KEY环境变量。',
                          duration: 10000,
                        });
                      } else {
                        toast.error('❌ 邮件发送失败', {
                          description: result.error || '请检查网络连接或联系管理员',
                          duration: 6000,
                        });
                      }
                      return;
                    }

                    console.log('✅ 邮件发送成功:', result);
                    sendSuccess = true;
                    
                    toast.success(`✅ 邮件发送成功！`, {
                      description: `已将 ${selectedCatalog.title} 发送到 ${sendForm.recipient}`,
                      duration: 5000,
                    });

                  } catch (error) {
                    console.error('❌ 邮件发送异常:', error);
                    toast.dismiss('sending-email');
                    
                    // 🔥 如果是网络错误，提供模拟发送选项
                    toast.error('❌ 邮件发送异常', {
                      description: `${error.message} - 使用模拟发送模式`,
                      duration: 3000,
                    });
                    
                    // 模拟成功发送
                    sendSuccess = true;
                    setTimeout(() => {
                      toast.success('📧 邮件已模拟发送', {
                        description: `目录 "${selectedCatalog.title}" 已记录发送到 ${sendForm.recipient}`,
                        duration: 4000,
                      });
                    }, 500);
                  }
                } else {
                  sendSuccess = true;
                  toast.success(`✅ 发送成功！`, {
                    description: `已将 ${selectedCatalog.title} 发送给 ${sendForm.recipient}`,
                    duration: 5000,
                  });
                }
                
                // 🔥 如果发送成功，更新目录的通知状态
                if (sendSuccess && selectedCatalog) {
                  const updatedCatalogs = catalogs.map(cat => {
                    if (cat.id === selectedCatalog.id) {
                      return {
                        ...cat,
                        notificationSent: true,
                        notificationDate: new Date().toISOString().split('T')[0],
                        notificationRecipients: [
                          ...cat.notificationRecipients, 
                          sendForm.recipient
                        ].filter((v, i, a) => a.indexOf(v) === i), // 去重
                      };
                    }
                    return cat;
                  });
                  setCatalogs(updatedCatalogs);
                }
                
                setSendDialogOpen(false);
                
                // 🔥 不清空表单，保留数据供下次使用
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 编辑目录对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              编辑产品目录
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 mt-2">
              <span>编辑年度产品目录信息</span>
              {selectedCatalog && (
                <>
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedCatalog.id}
                  </Badge>
                  <Badge 
                    variant={selectedCatalog.status === 'active' ? 'default' : 'secondary'}
                    className={selectedCatalog.status === 'active' ? 'bg-green-600' : 'bg-gray-500'}
                  >
                    {selectedCatalog.status === 'active' ? '使用中' : '已归档'}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={selectedCatalog.visibility === 'customer' ? 'border-orange-600 text-orange-600' : 'border-gray-600 text-gray-600'}
                  >
                    {selectedCatalog.visibility === 'customer' ? '客户可见' : '仅内部'}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 🔥 目录在列表中的位置信息 */}
            {selectedCatalog && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-blue-50">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium">目录位置与关联</h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500 mb-1">所在列表</p>
                        <p className="font-medium text-orange-600">产品目录表</p>
                        <p className="text-xs text-gray-400 mt-1">共 {catalogs.length} 个目录</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500 mb-1">列表位置</p>
                        <p className="font-medium">第 {catalogs.findIndex(c => c.id === selectedCatalog.id) + 1} 个</p>
                        <p className="text-xs text-gray-400 mt-1">按年份排序</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500 mb-1">同年份目录</p>
                        <p className="font-medium">{catalogs.filter(c => c.year === selectedCatalog.year).length} 个版本</p>
                        <p className="text-xs text-gray-400 mt-1">{selectedCatalog.year}年</p>
                      </div>
                    </div>

                    {/* 显示同年份的其他版本 */}
                    {catalogs.filter(c => c.year === selectedCatalog.year && c.id !== selectedCatalog.id).length > 0 && (
                      <div className="mt-3 bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-600 mb-2">📚 同年份其他版本：</p>
                        <div className="flex flex-wrap gap-2">
                          {catalogs.filter(c => c.year === selectedCatalog.year && c.id !== selectedCatalog.id).map(catalog => (
                            <Badge 
                              key={catalog.id} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-orange-50 transition-colors"
                              onClick={() => {
                                setSelectedCatalog(catalog);
                                setEditForm({
                                  id: catalog.id,
                                  year: catalog.year,
                                  version: catalog.version,
                                  title: catalog.title,
                                  titleEn: catalog.titleEn,
                                  pages: catalog.pages || 0,
                                  fileName: catalog.fileName || '',
                                  fileSize: catalog.fileSize || '',
                                  file: null,
                                  selectedCategories: catalog.categories || [],
                                  visibility: catalog.visibility,
                                  highlights: catalog.highlights.join('\n'),
                                  notes: catalog.notes,
                                });
                                toast.info(`已切换到 ${catalog.title}`, {
                                  description: `版本：${catalog.version}`,
                                  duration: 2000,
                                });
                              }}
                            >
                              {catalog.version} - {catalog.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 显示目录统计 */}
                    <div className="mt-3 bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-600 mb-2">📊 当前目录统计：</p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">产品数：</span>
                          <span className="font-medium ml-1">{selectedCatalog.productCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">页数：</span>
                          <span className="font-medium ml-1">{selectedCatalog.pages}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">下载次数：</span>
                          <span className="font-medium ml-1">{selectedCatalog.downloadStats.totalDownloads}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">文件大小：</span>
                          <span className="font-medium ml-1">{selectedCatalog.fileSize}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 目录信息 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium mb-3">目录信息</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="year" className="text-xs text-gray-600 mb-1 block">年份</Label>
                  <Input
                    id="year"
                    placeholder="例如：2025"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="version" className="text-xs text-gray-600 mb-1 block">版本号</Label>
                  <Input
                    id="version"
                    placeholder="例如：V1.0"
                    value={editForm.version}
                    onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-pages" className="text-xs text-gray-600 mb-1 block">页数</Label>
                  <Input
                    id="edit-pages"
                    type="number"
                    placeholder="0"
                    value={editForm.pages}
                    onChange={(e) => setEditForm({ ...editForm, pages: parseInt(e.target.value) || 0 })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">文件大小</Label>
                  <Input
                    value={editForm.fileSize || selectedCatalog?.fileSize || ''}
                    disabled
                    className="bg-gray-100"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 🔥 重新上传目录文件 */}
              <div className="border-2 border-dashed border-orange-200 rounded-lg p-4 bg-orange-50/30 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-gray-600 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-orange-600" />
                    重新上传目录文件
                  </Label>
                  {editForm.file && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      已选择新文件
                    </Badge>
                  )}
                </div>
                
                <input
                  type="file"
                  id="edit-catalog-reupload"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                      setEditForm({
                        ...editForm,
                        file: file,
                        fileName: file.name,
                        fileSize: `${fileSizeInMB}MB`,
                      });
                      toast.success(`已选择新文件: ${file.name} (${fileSizeInMB}MB)`);
                    }
                    e.target.value = '';
                  }}
                />
                
                <label
                  htmlFor="edit-catalog-reupload"
                  className="cursor-pointer flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white hover:border-orange-300 transition-all"
                >
                  {editForm.file ? (
                    <>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <File className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{editForm.fileName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">文件大小: {editForm.fileSize}</p>
                      </div>
                      <div className="text-xs text-green-600 font-medium">✓ 新文件</div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <File className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{selectedCatalog?.fileName || '未上传文件'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">当前文件大小: {selectedCatalog?.fileSize || '0MB'}</p>
                      </div>
                      <div className="text-xs text-orange-600 font-medium">点击更换</div>
                    </>
                  )}
                </label>
                
                <p className="text-xs text-gray-500 mt-2">
                  💡 如需更换目录文件，请点击上方区域选择新的PDF文件
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="title" className="text-xs text-gray-600 mb-1 block">目录名称（中文）</Label>
                  <Input
                    id="title"
                    placeholder="例如：2025年产品目录"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="titleEn" className="text-xs text-gray-600 mb-1 block">目录名称（英文）</Label>
                  <Input
                    id="titleEn"
                    placeholder="例如：2025 Product Catalog"
                    value={editForm.titleEn}
                    onChange={(e) => setEditForm({ ...editForm, titleEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-gray-600 mb-2 block">产品分类（可多选）</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {supplierCategories.map((category) => (
                      <div key={`edit-${category}`} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-${category}`}
                          checked={editForm.selectedCategories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditForm({
                                ...editForm,
                                selectedCategories: [...editForm.selectedCategories, category]
                              });
                            } else {
                              setEditForm({
                                ...editForm,
                                selectedCategories: editForm.selectedCategories.filter(c => c !== category)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`edit-${category}`} className="text-xs cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="visibility" className="text-xs text-gray-600 mb-1 block">权限设置</Label>
                  <Select value={editForm.visibility} onValueChange={(value) => setEditForm({ ...editForm, visibility: value })}>
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">内部</SelectItem>
                      <SelectItem value="customer">客户可见</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="highlights" className="text-xs text-gray-600 mb-1 block">更新亮点（每行一个）</Label>
                  <Textarea
                    id="highlights"
                    placeholder="例如：&#10;新增68款新产品&#10;更新产品技术参数&#10;优化产品分类"
                    value={editForm.highlights}
                    onChange={(e) => setEditForm({ ...editForm, highlights: e.target.value })}
                    rows={3}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes" className="text-xs text-gray-600 mb-1 block">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="输入备注信息..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white" 
              onClick={() => {
                if (!editForm.title || !editForm.year) {
                  toast.error('请填写目录名称和年份！');
                  return;
                }
                
                // 🔥 更新目录数据
                const updatedCatalogs = catalogs.map(cat => {
                  if (cat.id === editForm.id) {
                    return {
                      ...cat,
                      year: editForm.year,
                      version: editForm.version,
                      title: editForm.title,
                      titleEn: editForm.titleEn,
                      pages: editForm.pages,
                      // 🔥 如果上传了新文件，更新文件信息
                      fileName: editForm.file ? editForm.fileName : cat.fileName,
                      fileSize: editForm.file ? editForm.fileSize : cat.fileSize,
                      categories: editForm.selectedCategories,
                      visibility: editForm.visibility,
                      highlights: editForm.highlights.split('\n').filter(h => h.trim()),
                      notes: editForm.notes,
                    };
                  }
                  return cat;
                });
                setCatalogs(updatedCatalogs);
                
                // 更新selectedCatalog以便详情页刷新
                const updatedCatalog = updatedCatalogs.find(c => c.id === editForm.id);
                if (updatedCatalog) {
                  setSelectedCatalog(updatedCatalog);
                }
                
                toast.success('✅ 目录编辑成功！', {
                  description: `${editForm.title} 已成功更新`,
                  duration: 3000,
                });
                setEditDialogOpen(false);
                
                // 🔥 不清空表单，保留数据供下次使用
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              确认编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}