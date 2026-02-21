import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { FileText, Upload, Download, Eye, Search, FolderOpen, File, Image, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

export default function SupplierDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // 🔥 上传表单数据
  const [uploadForm, setUploadForm] = useState({
    orderId: '',
    category: 'quality_control',
    description: ''
  });

  // 🔥 文档数据（改为状态管理）
  const [documents, setDocuments] = useState([
    {
      id: 1,
      orderId: 'PO-2024-155',
      name: '采购订单 PO-2024-155.pdf',
      type: '采购订单',
      category: 'purchase_orders',
      uploadDate: '2024-11-12',
      uploadedBy: 'COSUN管理员',
      size: '245 KB',
      status: 'active',
    },
    {
      id: 2,
      orderId: 'PO-2024-154',
      name: '质检报告 - LED轨道灯.pdf',
      type: '质量检测',
      category: 'quality_control',
      uploadDate: '2024-11-16',
      uploadedBy: '您',
      size: '1.2 MB',
      status: 'uploaded',
    },
    {
      id: 3,
      orderId: 'PO-2024-154',
      name: '生产照片 - 组装.zip',
      type: '生产照片',
      category: 'production',
      uploadDate: '2024-11-15',
      uploadedBy: '您',
      size: '8.5 MB',
      status: 'uploaded',
    },
    {
      id: 4,
      orderId: 'PO-2024-152',
      name: '装箱单 PO-2024-152.pdf',
      type: '发货文件',
      category: 'shipping',
      uploadDate: '2024-11-17',
      uploadedBy: '您',
      size: '180 KB',
      status: 'uploaded',
    },
    {
      id: 5,
      orderId: 'PO-2024-152',
      name: '商业发票 PO-2024-152.pdf',
      type: '发票',
      category: 'financial',
      uploadDate: '2024-11-17',
      uploadedBy: '您',
      size: '156 KB',
      status: 'uploaded',
    },
    {
      id: 6,
      orderId: 'PO-2024-155',
      name: '技术规格书.pdf',
      type: '技术文档',
      category: 'technical',
      uploadDate: '2024-11-10',
      uploadedBy: 'COSUN管理员',
      size: '520 KB',
      status: 'active',
    },
  ]);

  // 🔥 重置上传表单
  const resetUploadForm = () => {
    setUploadForm({
      orderId: '',
      category: 'quality_control',
      description: ''
    });
    setSelectedFiles(null);
  };

  // 🔥 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // 验证文件大小（单个文件最大20MB）
      const maxSize = 20 * 1024 * 1024; // 20MB
      const oversizedFiles = Array.from(e.target.files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast.error('文件过大', {
          description: `${oversizedFiles[0].name} 超过20MB限制`
        });
        return;
      }
      
      setSelectedFiles(e.target.files);
    }
  };

  // 🔥 保存上传文档
  const handleUploadDocument = () => {
    // 表单验证
    if (!uploadForm.orderId) {
      toast.error('请输入关联订单号');
      return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('请选择要上传的文件');
      return;
    }

    // 获取当前日期
    const today = new Date().toISOString().split('T')[0];

    // 处理每个选中的文件
    const newDocuments = Array.from(selectedFiles).map((file, index) => {
      // 计算文件大小
      const sizeInKB = (file.size / 1024).toFixed(0);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const displaySize = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`;

      // 根据分类获取文档类型
      const typeMap: any = {
        quality_control: '质量检测',
        production: '生产记录',
        shipping: '发货文件',
        financial: '财务文件',
        technical: '技术文档',
        purchase_orders: '采购订单'
      };

      return {
        id: documents.length + index + 1,
        orderId: uploadForm.orderId,
        name: file.name,
        type: typeMap[uploadForm.category] || '其他',
        category: uploadForm.category,
        uploadDate: today,
        uploadedBy: '您',
        size: displaySize,
        status: 'uploaded',
      };
    });

    // 添加到文档列表
    setDocuments([...documents, ...newDocuments]);

    // 显示成功提示
    toast.success(`成功上传 ${selectedFiles.length} 个文件！`, {
      description: `订单号：${uploadForm.orderId} | 类型：${getCategoryLabel(uploadForm.category)}`
    });

    // 关闭对话框并重置表单
    setUploadDialogOpen(false);
    resetUploadForm();
  };

  // 🔥 获取分类标签
  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.label : categoryId;
  };

  const categories = [
    { id: 'all', label: '全部文档', count: documents.length },
    { id: 'purchase_orders', label: '采购订单', count: documents.filter(d => d.category === 'purchase_orders').length },
    { id: 'quality_control', label: '质量检测', count: documents.filter(d => d.category === 'quality_control').length },
    { id: 'production', label: '生产记录', count: documents.filter(d => d.category === 'production').length },
    { id: 'shipping', label: '发货文件', count: documents.filter(d => d.category === 'shipping').length },
    { id: 'financial', label: '财务文件', count: documents.filter(d => d.category === 'financial').length },
    { id: 'technical', label: '技术文档', count: documents.filter(d => d.category === 'technical').length },
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('照片') || type.includes('图片')) return Image;
    return FileText;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* 文档统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">总文档数</span>
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
          <p className="text-xs text-gray-500 mt-1">全部类型</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已上传</span>
            <Upload className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{documents.filter(d => d.uploadedBy === '您').length}</p>
          <p className="text-xs text-gray-500 mt-1">您上传的文件</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待上传</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">3</p>
          <p className="text-xs text-gray-500 mt-1">需要补充</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">总大小</span>
            <File className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">10.8</p>
          <p className="text-xs text-gray-500 mt-1">MB</p>
        </div>
      </div>

      {/* 文档管理 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>文档中心</h3>
            </div>
            <Button 
              size="sm" 
              className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="w-3 h-3" />
              上传文档
            </Button>
          </div>

          {/* 搜索栏 */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="搜索文档名称或订单号..."
              className="pl-9 h-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>

        {/* 分类Tab */}
        <div className="border-b border-gray-200 px-3 py-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontSize: '12px' }}
              >
                {category.label}
                <Badge variant="outline" className="h-4 px-1.5 text-xs">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* 文档表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-12" style={{ fontSize: '12px' }}>类型</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>文件名称</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>订单号</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>文档类型</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>上传者</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>上传日期</TableHead>
                <TableHead className="h-9 w-20 text-right" style={{ fontSize: '12px' }}>大小</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => {
                  const Icon = getFileIcon(doc.type);
                  
                  return (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          {doc.uploadedBy === '您' && (
                            <Badge variant="outline" className="h-4 px-1.5 text-xs bg-green-50 text-green-700 border-green-300">
                              <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                              已上传
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-blue-600 font-medium">{doc.orderId}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">{doc.type}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className={doc.uploadedBy === '您' ? 'text-blue-600' : 'text-gray-600'}>
                          {doc.uploadedBy}
                        </span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">{doc.uploadDate}</span>
                      </TableCell>
                      <TableCell className="py-3 text-right" style={{ fontSize: '12px' }}>
                        <span className="text-gray-500">{doc.size}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            预览
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            下载
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>暂无文档</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 上传说明 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '14px' }}>文档上传说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">质检报告</p>
              <p className="text-xs text-gray-600">订单完成后需上传完整质检报告（PDF格式）</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Image className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">生产照片</p>
              <p className="text-xs text-gray-600">上传生产过程照片，每个订单至少5张</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">发货文件</p>
              <p className="text-xs text-gray-600">装箱单、商业发票等发货相关文档</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Upload className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">文件格式</p>
              <p className="text-xs text-gray-600">支持PDF、JPG、PNG、ZIP，单个文件最大20MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 上传文档对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              上传文档
            </DialogTitle>
            <DialogDescription>
              请选择要上传的文件并填写相关信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 关联订单号 */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">关联订单号 *</Label>
              <Input
                className="h-9"
                value={uploadForm.orderId}
                onChange={(e) => setUploadForm({ ...uploadForm, orderId: e.target.value })}
                style={{ fontSize: '13px' }}
                placeholder="例如：PO-2024-155"
              />
            </div>

            {/* 文档分类 */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">文档分类 *</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="请选择文档分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality_control">质量检测</SelectItem>
                  <SelectItem value="production">生产记录</SelectItem>
                  <SelectItem value="shipping">发货文件</SelectItem>
                  <SelectItem value="financial">财务文件</SelectItem>
                  <SelectItem value="technical">技术文档</SelectItem>
                  <SelectItem value="purchase_orders">采购订单</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 文件上传 */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">选择文件 *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    点击选择文件或拖拽文件到此处
                  </p>
                  <p className="text-xs text-gray-400">
                    支持 PDF、JPG、PNG、ZIP，单个文件最大20MB
                  </p>
                </label>
              </div>

              {/* 已选择的文件列表 */}
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-600">已选择 {selectedFiles.length} 个文件：</p>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 备注说明 */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">备注说明</Label>
              <Textarea
                className="min-h-20"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                style={{ fontSize: '13px' }}
                placeholder="请填写文档相关说明（可选）"
              />
            </div>

            {/* 上传提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  上传提示：
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>请确保文件清晰完整，符合质量要求</li>
                    <li>质检报告需包含完整的检测数据和结论</li>
                    <li>生产照片需展示关键生产工序</li>
                    <li>发货文件需与实际发货信息一致</li>
                  </ul>
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              resetUploadForm();
            }}>
              取消
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleUploadDocument}
            >
              <Upload className="w-4 h-4 mr-2" />
              确认上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
