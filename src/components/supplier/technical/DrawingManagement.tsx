import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Search, Plus, Eye, Edit, Download, Upload, FileText, CheckCircle, XCircle, Clock, Send, AlertCircle, File, X, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { loadSupplierCategories } from '../../../data/industryTemplates';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 供应商视角：图纸管理
 * - 版本控制
 * - 审批流程（草稿 → 审核 → 批准 → 归档）
 * - 权限管理（内部查看、客户可见）
 * - 文件上传
 * - 邮件发送功能
 */
export default function DrawingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false); // 🔥 新增编辑对话框状态
  
  // 🔥 批量选择状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 文件上传表单
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    fileName: '',
    fileType: 'PDF',
    productName: '',
    productCode: '',
    drawingNo: '',
    version: '',
    visibility: 'internal',
    notes: '',
  });

  // 🔥 编辑表单
  const [editForm, setEditForm] = useState({
    id: '',
    drawingNo: '',
    productName: '',
    productCode: '',
    fileName: '',
    fileType: 'PDF',
    version: '',
    visibility: 'internal',
    notes: '',
  });

  // 🔥 发送表单
  const [sendForm, setSendForm] = useState({
    method: 'email',
    recipient: '',
    subject: '',
    message: '',
  });

  // 🔥 动态加载供应商自定义的产品分类
  const supplierCategories = loadSupplierCategories();

  // 🔥 图纸数据 - 改为状态管理 + localStorage持久化
  const [drawings, setDrawings] = useState<any[]>(() => {
    try {
      const savedData = localStorage.getItem('supplier_drawing_management');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load drawings from localStorage:', error);
    }
    // 默认数据
    return [
    {
      id: 'DWG-2024-001',
      drawingNo: 'AT-600-001-V2.0',
      productName: '抛光砖 600x600mm',
      productCode: 'AT-600x600-001',
      fileName: '抛光砖产品图纸 V2.0.pdf',
      fileType: 'PDF',
      fileSize: '2.3MB',
      version: 'V2.0',
      status: 'approved',
      visibility: 'customer',
      
      creator: '王工',
      createDate: '2024-11-15',
      reviewer: '李总工',
      reviewDate: '2024-11-18',
      approver: '技术总监',
      approveDate: '2024-11-20',
      
      relatedProduct: 'PROD-2024-001',
      relatedOrders: ['PO-2024-152', 'PO-2024-148'],
      
      versionHistory: [
        { version: 'V2.0', date: '2024-11-20', creator: '王工', changes: '调整尺寸标注，优化生产工艺', status: 'approved' },
        { version: 'V1.0', date: '2024-06-15', creator: '王工', changes: '初始版本', status: 'archived' },
      ],
      
      notes: '客户COSUN确认版本，用于批量生产'
    },
    {
      id: 'DWG-2024-002',
      drawingNo: 'AT-600-001-CAD-V2.0',
      productName: '抛光砖 600x600mm',
      productCode: 'AT-600x600-001',
      fileName: '抛光砖尺寸标注图 V2.0.dwg',
      fileType: 'CAD',
      fileSize: '850KB',
      version: 'V2.0',
      status: 'approved',
      visibility: 'internal',
      
      creator: '王工',
      createDate: '2024-11-15',
      reviewer: '李总工',
      reviewDate: '2024-11-18',
      approver: '技术总监',
      approveDate: '2024-11-20',
      
      relatedProduct: 'PROD-2024-001',
      relatedOrders: ['PO-2024-152'],
      
      versionHistory: [
        { version: 'V2.0', date: '2024-11-20', creator: '王工', changes: '更新CAD图层', status: 'approved' },
      ],
      
      notes: '生产部门内部使用，含详细加工尺寸'
    },
    {
      id: 'DWG-2024-003',
      drawingNo: 'MT-800-002-V1.0',
      productName: '大理石瓷砖 800x800mm',
      productCode: 'MT-800x800-002',
      fileName: '大理石瓷砖产品图纸 V1.0.pdf',
      fileType: 'PDF',
      fileSize: '2.1MB',
      version: 'V1.0',
      status: 'reviewing',
      visibility: 'internal',
      
      creator: '李工',
      createDate: '2024-10-08',
      reviewer: '李总工',
      reviewDate: '2024-10-10',
      approver: null,
      approveDate: null,
      
      relatedProduct: 'PROD-2024-002',
      relatedOrders: [],
      
      versionHistory: [
        { version: 'V1.0', date: '2024-10-10', creator: '李工', changes: '新产品图纸', status: 'reviewing' },
      ],
      
      notes: '等待技术总监审批'
    },
    {
      id: 'DWG-2024-004',
      drawingNo: 'WT-200-003-V1.2',
      productName: '木纹砖 200x1000mm',
      productCode: 'WT-200x1000-003',
      fileName: '木纹砖产品图纸 V1.2.pdf',
      fileType: 'PDF',
      fileSize: '1.9MB',
      version: 'V1.2',
      status: 'draft',
      visibility: 'internal',
      
      creator: '张工',
      createDate: '2024-09-12',
      reviewer: null,
      reviewDate: null,
      approver: null,
      approveDate: null,
      
      relatedProduct: 'PROD-2024-003',
      relatedOrders: [],
      
      versionHistory: [
        { version: 'V1.2', date: '2024-09-15', creator: '张工', changes: '修正纹理细节', status: 'draft' },
        { version: 'V1.1', date: '2024-08-20', creator: '张工', changes: '调整颜色标注', status: 'archived' },
        { version: 'V1.0', date: '2024-07-10', creator: '张工', changes: '初始版本', status: 'archived' },
      ],
      
      notes: '草稿阶段，待提交审核'
    }
    ];
  });

  const getStatusConfig = (status: string) => {
    const config: any = {
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Edit },
      reviewing: { label: '审核中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      approved: { label: '已批准', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      archived: { label: '已归档', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
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

  const tabs = [
    { id: 'all', label: '全部', count: drawings.length },
    { id: 'draft', label: '草稿', count: drawings.filter(d => d.status === 'draft').length },
    { id: 'reviewing', label: '审核中', count: drawings.filter(d => d.status === 'reviewing').length },
    { id: 'approved', label: '已批准', count: drawings.filter(d => d.status === 'approved').length },
  ];

  const filteredDrawings = drawings.filter(drawing => {
    const matchSearch = drawing.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       drawing.drawingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       drawing.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'all' || drawing.status === activeTab;
    const matchCategory = filterCategory === 'all' || drawing.productCode.startsWith(filterCategory);
    return matchSearch && matchTab && matchCategory;
  });

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredDrawings.map(d => d.id));
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
      toast.error('请先选择要删除的图纸');
      return;
    }
    
    const updatedDrawings = drawings.filter(d => !selectedIds.includes(d.id));
    setDrawings(updatedDrawings);
    setSelectedIds([]);
    toast.success(`已删除 ${selectedIds.length} 个图纸`);
  };

  // 🔥 批量下载
  const handleBatchDownload = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要下载的图纸');
      return;
    }
    toast.success(`正在打包下载 ${selectedIds.length} 个图纸...`);
  };

  // 🔥 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file: file,
        fileName: file.name,
      });
      toast.success(`已选择文件: ${file.name}`);
    }
  };

  // 🔥 自动保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('supplier_drawing_management', JSON.stringify(drawings));
    } catch (error) {
      console.error('Failed to save drawings to localStorage:', error);
    }
  }, [drawings]);

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>图纸管理</h2>
              <p className="text-xs text-gray-500">产品图纸的版本控制、审批流程和权限管理</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            上传图纸
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">图纸总数</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{drawings.length}</p>
          <p className="text-xs text-gray-500 mt-1">已批准: {drawings.filter(d => d.status === 'approved').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待审核</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {drawings.filter(d => ['draft', 'reviewing'].includes(d.status)).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">草稿: {drawings.filter(d => d.status === 'draft').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">客户可见</span>
            <Send className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {drawings.filter(d => d.visibility === 'customer').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">占比: {((drawings.filter(d => d.visibility === 'customer').length / drawings.length) * 100).toFixed(0)}%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">版本总数</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {drawings.reduce((sum, d) => sum + d.versionHistory.length, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">平均版本数: {(drawings.reduce((sum, d) => sum + d.versionHistory.length, 0) / drawings.length).toFixed(1)}</p>
        </div>
      </div>

      {/* 搜索栏 + 批量操作 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索图纸编号、产品名称或文件名..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
          
          {/* 批量操作按钮 */}
          {selectedIds.length > 0 && (
            <>
              <div className="flex items-center px-3 h-9 bg-orange-50 border border-orange-200 rounded-md">
                <span className="text-sm text-gray-700">
                  已选 <span className="font-bold text-orange-600">{selectedIds.length}</span> 项
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDownload}
                className="h-9 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                批量下载
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDelete}
                className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                批量删除
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="h-9 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab + 表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Tab导航 */}
        <div className="flex items-center border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              {tab.label}
              <Badge variant="outline" className="h-5 px-1.5 min-w-5 text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-12 text-center" style={{ fontSize: '12px' }}>
                  <Checkbox
                    checked={filteredDrawings.length > 0 && selectedIds.length === filteredDrawings.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="h-9 w-16 text-center" style={{ fontSize: '12px' }}>序号</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>图纸编号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品名称</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>文件名</TableHead>
                <TableHead className="h-9 w-20 text-center" style={{ fontSize: '12px' }}>版本</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>文件类型</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>创建人</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>创建日期</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>权限</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-40 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrawings.length > 0 ? (
                filteredDrawings.map((drawing, index) => {
                  const statusConfig = getStatusConfig(drawing.status);
                  const visibilityBadge = getVisibilityBadge(drawing.visibility);
                  const StatusIcon = statusConfig.icon;
                  const isSelected = selectedIds.includes(drawing.id);
                  
                  return (
                    <TableRow key={drawing.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-orange-50' : ''}`}>
                      <TableCell className="py-3 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(drawing.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="py-3 text-center text-gray-500" style={{ fontSize: '12px' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-blue-600">{drawing.drawingNo}</p>
                          <p className="text-xs text-gray-500">{drawing.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{drawing.productName}</p>
                          <p className="text-xs text-gray-500">{drawing.productCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div>
                          <p className="font-medium text-gray-700">{drawing.fileName}</p>
                          <p className="text-xs text-gray-500">{drawing.fileSize}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <Badge variant="outline" className="h-5 px-2 text-xs font-mono">
                          {drawing.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <Badge className={`h-5 px-2 text-xs ${
                          drawing.fileType === 'PDF' ? 'bg-red-100 text-red-800' :
                          drawing.fileType === 'CAD' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {drawing.fileType}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <span className="text-gray-700">{drawing.creator}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">{drawing.createDate}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${visibilityBadge.color}`}>
                          {visibilityBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedDrawing(drawing);
                              setDetailDialogOpen(true);
                            }}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = '#';
                              link.download = drawing.fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              toast.success('图纸下载中...', { description: `正在下载 ${drawing.fileName}` });
                            }}
                            title="下载图纸"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </Button>
                          {drawing.visibility === 'customer' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-orange-50"
                              title="发送给客户"
                              onClick={() => {
                                setSelectedDrawing(drawing);
                                setSendForm({
                                  method: 'email',
                                  recipient: '',
                                  subject: `产品图纸 - ${drawing.drawingNo} ${drawing.productName}`,
                                  message: `尊敬的客户，\n\n附件是产品图纸 ${drawing.drawingNo} - ${drawing.productName} ${drawing.version}，请查收。\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！`,
                                });
                                setSendDialogOpen(true);
                              }}
                            >
                              <Send className="w-4 h-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedDrawing(drawing);
                              setEditForm({
                                id: drawing.id,
                                drawingNo: drawing.drawingNo,
                                productName: drawing.productName,
                                productCode: drawing.productCode,
                                fileName: drawing.fileName,
                                fileType: drawing.fileType,
                                version: drawing.version,
                                visibility: drawing.visibility,
                                notes: drawing.notes,
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
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`确定要删除图纸 "${drawing.drawingNo} - ${drawing.productName}" 吗？`)) {
                                setDrawings(drawings.filter(d => d.id !== drawing.id));
                                toast.success('图纸已删除');
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
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>暂无图纸数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 图纸详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              图纸详情 - {selectedDrawing?.drawingNo}
            </DialogTitle>
            <DialogDescription>
              {selectedDrawing?.productName} | {selectedDrawing?.version}
            </DialogDescription>
          </DialogHeader>

          {selectedDrawing && (
            <div className="grid grid-cols-2 gap-4">
              {/* 左侧：图纸预览 */}
              <div className="space-y-4">
                {/* 图纸预览区域 */}
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4" />
                      <span className="text-sm font-medium">{selectedDrawing.fileName}</span>
                    </div>
                    <Badge className={`h-5 px-2 text-xs ${
                      selectedDrawing.fileType === 'PDF' ? 'bg-red-600' :
                      selectedDrawing.fileType === 'CAD' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}>
                      {selectedDrawing.fileType}
                    </Badge>
                  </div>
                  
                  {/* 图纸预览画布 */}
                  <div className="aspect-[4/3] bg-white flex items-center justify-center p-8">
                    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-4">
                      <FileText className="w-20 h-20 text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">{selectedDrawing.productName}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedDrawing.drawingNo}</p>
                        <p className="text-xs text-gray-400 mt-2">图纸预览区域</p>
                        <p className="text-xs text-gray-400">实际项目中将显示PDF或CAD预览</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 预览工具栏 */}
                  <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">文件大小：{selectedDrawing.fileSize}</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-600">创建日期：{selectedDrawing.createDate}</span>
                    </div>
                  </div>
                </div>

                {/* 备注 */}
                {selectedDrawing.notes && (
                  <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">备注说明</p>
                        <p className="text-sm text-gray-800">{selectedDrawing.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：详细信息 */}
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    基本信息
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">图纸编号</span>
                      <span className="font-medium text-blue-600">{selectedDrawing.drawingNo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">产品名称</span>
                      <span className="font-medium">{selectedDrawing.productName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">产品编码</span>
                      <span className="font-medium text-gray-600">{selectedDrawing.productCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">当前版本</span>
                      <Badge variant="outline" className="h-5 px-2 text-xs font-mono">
                        {selectedDrawing.version}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">权限设置</span>
                      <Badge className={`h-5 px-2 text-xs ${getVisibilityBadge(selectedDrawing.visibility).color}`}>
                        {getVisibilityBadge(selectedDrawing.visibility).label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">当前状态</span>
                      <Badge className={`h-5 px-2 text-xs ${getStatusConfig(selectedDrawing.status).color}`}>
                        {getStatusConfig(selectedDrawing.status).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 审批流程 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    审批流程
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">创建</span>
                          <span className="text-xs text-gray-500">{selectedDrawing.createDate}</span>
                        </div>
                        <p className="text-xs text-gray-600">创建人：{selectedDrawing.creator}</p>
                      </div>
                    </div>

                    {selectedDrawing.reviewer && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                          selectedDrawing.status === 'draft' ? 'bg-gray-100' : 'bg-green-100'
                        }`}>
                          {selectedDrawing.status === 'draft' ? (
                            <Clock className="w-4 h-4 text-gray-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">审核</span>
                            <span className="text-xs text-gray-500">{selectedDrawing.reviewDate || '待审核'}</span>
                          </div>
                          <p className="text-xs text-gray-600">审核人：{selectedDrawing.reviewer}</p>
                        </div>
                      </div>
                    )}

                    {selectedDrawing.approver && selectedDrawing.status === 'approved' && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">批准</span>
                            <span className="text-xs text-gray-500">{selectedDrawing.approveDate}</span>
                          </div>
                          <p className="text-xs text-gray-600">批准人：{selectedDrawing.approver}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 版本历史 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    版本历史
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDrawing.versionHistory.map((ver: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded text-sm">
                        <Badge variant="outline" className="h-5 px-2 text-xs font-mono mt-0.5 flex-shrink-0">
                          {ver.version}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium truncate">{ver.changes}</p>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{ver.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">{ver.creator}</span>
                            <Badge className={`h-4 px-1.5 text-xs ${getStatusConfig(ver.status).color}`}>
                              {getStatusConfig(ver.status).label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 关联订单 */}
                {selectedDrawing.relatedOrders && selectedDrawing.relatedOrders.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      关联订单
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDrawing.relatedOrders.map((order: string) => (
                        <Badge key={order} variant="outline" className="px-3 py-1 text-xs">
                          {order}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                if (selectedDrawing) {
                  // 创建一个虚拟的下载链接
                  const link = document.createElement('a');
                  link.href = '#'; // 实际项目中应该是真实的文件URL
                  link.download = selectedDrawing.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`图纸 ${selectedDrawing.fileName} 下载成功！`);
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              下载图纸
            </Button>
            {selectedDrawing?.visibility === 'customer' && (
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  setDetailDialogOpen(false);
                  setSendForm({
                    method: 'email',
                    recipient: '',
                    subject: `产品图纸 - ${selectedDrawing.drawingNo} ${selectedDrawing.productName}`,
                    message: `尊敬的客户，\n\n附件是产品图纸 ${selectedDrawing.drawingNo} - ${selectedDrawing.productName} ${selectedDrawing.version}，请查收。\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！`,
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

      {/* 🔥 上传图纸对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" />
              上传图纸
            </DialogTitle>
            <DialogDescription>
              选择要上传的图纸文件
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 文件选择 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.dwg,.dxf,.cad"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploadForm.file ? (
                    <>
                      <File className="w-12 h-12 text-orange-600" />
                      <p className="font-medium text-gray-900">{uploadForm.fileName}</p>
                      <p className="text-xs text-gray-500">点击更换文件</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="font-medium text-gray-900">点击选择文件或拖拽到此处</p>
                      <p className="text-xs text-gray-500">支持 PDF, DWG, DXF, CAD 格式</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* 图纸信息 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium mb-3">图纸信息</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fileType" className="text-xs text-gray-600 mb-1 block">文件类型</Label>
                  <Select value={uploadForm.fileType} onValueChange={(value) => setUploadForm({ ...uploadForm, fileType: value })}>
                    <SelectTrigger id="fileType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="DWG">DWG</SelectItem>
                      <SelectItem value="DXF">DXF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="version" className="text-xs text-gray-600 mb-1 block">版本号</Label>
                  <Input
                    id="version"
                    placeholder="例如：V1.0"
                    value={uploadForm.version}
                    onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="productName" className="text-xs text-gray-600 mb-1 block">产品名称</Label>
                  <Input
                    id="productName"
                    placeholder="输入产品名称..."
                    value={uploadForm.productName}
                    onChange={(e) => setUploadForm({ ...uploadForm, productName: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="productCode" className="text-xs text-gray-600 mb-1 block">产品代码</Label>
                  <Input
                    id="productCode"
                    placeholder="输入产品代码..."
                    value={uploadForm.productCode}
                    onChange={(e) => setUploadForm({ ...uploadForm, productCode: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="drawingNo" className="text-xs text-gray-600 mb-1 block">图纸编号</Label>
                  <Input
                    id="drawingNo"
                    placeholder="输入图纸编号..."
                    value={uploadForm.drawingNo}
                    onChange={(e) => setUploadForm({ ...uploadForm, drawingNo: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="visibility" className="text-xs text-gray-600 mb-1 block">权限设置</Label>
                  <Select value={uploadForm.visibility} onValueChange={(value) => setUploadForm({ ...uploadForm, visibility: value })}>
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
                  <Label htmlFor="notes" className="text-xs text-gray-600 mb-1 block">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="输入备注信息..."
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    rows={3}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700" 
              onClick={() => {
                if (!uploadForm.file) {
                  toast.error('请先选择文件！');
                  return;
                }
                if (!uploadForm.productName || !uploadForm.drawingNo) {
                  toast.error('请填写产品名称和图纸编号！');
                  return;
                }
                
                // 🔥 生成新图纸ID
                const newId = `DWG-2024-${String(drawings.length + 1).padStart(3, '0')}`;
                const today = new Date().toISOString().split('T')[0];
                
                // 🔥 创建新图纸对象
                const newDrawing = {
                  id: newId,
                  drawingNo: uploadForm.drawingNo,
                  productName: uploadForm.productName,
                  productCode: uploadForm.productCode,
                  fileName: uploadForm.fileName,
                  fileType: uploadForm.fileType,
                  fileSize: `${(uploadForm.file.size / 1024 / 1024).toFixed(2)}MB`,
                  version: uploadForm.version || 'V1.0',
                  status: 'draft' as const,
                  visibility: uploadForm.visibility as 'internal' | 'customer',
                  
                  creator: '当前用户',
                  createDate: today,
                  reviewer: null,
                  reviewDate: null,
                  approver: null,
                  approveDate: null,
                  
                  relatedProduct: null,
                  relatedOrders: [],
                  
                  versionHistory: [
                    { 
                      version: uploadForm.version || 'V1.0', 
                      date: today, 
                      creator: '当前用户', 
                      changes: '初始上传', 
                      status: 'draft' 
                    }
                  ],
                  
                  notes: uploadForm.notes
                };
                
                // 🔥 添加到列表
                setDrawings([newDrawing, ...drawings]);
                
                toast.success('图纸上传成功！', {
                  description: `${uploadForm.fileName} 已成功上传`,
                  duration: 3000,
                });
                setUploadDialogOpen(false);
                
                // 重置表单
                setUploadForm({
                  file: null,
                  fileName: '',
                  fileType: 'PDF',
                  productName: '',
                  productCode: '',
                  drawingNo: '',
                  version: '',
                  visibility: 'internal',
                  notes: '',
                });
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              确认上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 发送图纸对话框 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600" />
              发送图纸
            </DialogTitle>
            <DialogDescription>
              {selectedDrawing?.productName} - {selectedDrawing?.drawingNo}
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
                      <p className="text-xs text-gray-500">通过邮件发送图纸</p>
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
                  rows={8}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>

            {/* 附件预览 */}
            {selectedDrawing && (
              <div className="border rounded-lg p-4 bg-orange-50">
                <Label className="text-sm font-medium mb-2 block">📎 附件文件</Label>
                <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                  <File className="w-8 h-8 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedDrawing.fileName}</p>
                    <p className="text-xs text-gray-500">{selectedDrawing.fileSize} • {selectedDrawing.fileType}</p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">{selectedDrawing.version}</Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={async () => {
                // 验证必填项
                if (!sendForm.recipient) {
                  toast.error('❌ 请填写收件人信息');
                  return;
                }
                if (!sendForm.subject) {
                  toast.error('❌ 请填写邮件主题');
                  return;
                }

                // 🔥 调用后端邮件发送API
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
                            code: selectedDrawing.drawingNo,
                            name: selectedDrawing.productName,
                            nameEn: selectedDrawing.productName,
                            specification: selectedDrawing.version,
                            category: '产品图纸',
                          },
                          files: [{
                            name: selectedDrawing.fileName,
                            size: selectedDrawing.fileSize,
                            category: 'drawings',
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
                    
                    toast.success(`✅ 邮件发送成功！`, {
                      description: `已将 ${selectedDrawing.productName} 的图纸发送到 ${sendForm.recipient}`,
                      duration: 5000,
                    });

                  } catch (error) {
                    console.error('❌ 邮件发送异常:', error);
                    toast.dismiss('sending-email');
                    toast.error('❌ 邮件发送异常', {
                      description: `${error.message}`,
                      duration: 8000,
                    });
                    return;
                  }
                } else {
                  toast.success(`✅ 发送成功！`, {
                    description: `已将 ${selectedDrawing.productName} 的图纸发送给 ${sendForm.recipient}`,
                    duration: 5000,
                  });
                }
                
                setSendDialogOpen(false);
                
                // 重置表单
                setSendForm({
                  method: 'email',
                  recipient: '',
                  subject: '',
                  message: '',
                });
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 编辑图纸对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              编辑图纸
            </DialogTitle>
            <DialogDescription>
              {selectedDrawing?.productName} - {selectedDrawing?.drawingNo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 图纸信息 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium mb-3">图纸信息</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fileType" className="text-xs text-gray-600 mb-1 block">文件类型</Label>
                  <Select value={editForm.fileType} onValueChange={(value) => setEditForm({ ...editForm, fileType: value })}>
                    <SelectTrigger id="fileType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="DWG">DWG</SelectItem>
                      <SelectItem value="DXF">DXF</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="productName" className="text-xs text-gray-600 mb-1 block">产品名称</Label>
                  <Input
                    id="productName"
                    placeholder="输入产品名称..."
                    value={editForm.productName}
                    onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="productCode" className="text-xs text-gray-600 mb-1 block">产品代码</Label>
                  <Input
                    id="productCode"
                    placeholder="输入产品代码..."
                    value={editForm.productCode}
                    onChange={(e) => setEditForm({ ...editForm, productCode: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="drawingNo" className="text-xs text-gray-600 mb-1 block">图纸编号</Label>
                  <Input
                    id="drawingNo"
                    placeholder="输入图纸编号..."
                    value={editForm.drawingNo}
                    onChange={(e) => setEditForm({ ...editForm, drawingNo: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
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
                  <Label htmlFor="notes" className="text-xs text-gray-600 mb-1 block">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="输入备注信息..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700" 
              onClick={() => {
                // 🔥 更新图纸信息
                const updatedDrawings = drawings.map(drawing => {
                  if (drawing.id === editForm.id) {
                    return {
                      ...drawing,
                      drawingNo: editForm.drawingNo,
                      productName: editForm.productName,
                      productCode: editForm.productCode,
                      fileName: editForm.fileName,
                      fileType: editForm.fileType,
                      version: editForm.version,
                      visibility: editForm.visibility,
                      notes: editForm.notes,
                    };
                  }
                  return drawing;
                });
                
                setDrawings(updatedDrawings);
                
                toast.success('图纸信息更新成功！', {
                  description: `已更新 ${editForm.productName} 的图纸信息`,
                  duration: 3000,
                });
                setEditDialogOpen(false);
                
                // 重置表单
                setEditForm({
                  id: '',
                  drawingNo: '',
                  productName: '',
                  productCode: '',
                  fileName: '',
                  fileType: 'PDF',
                  version: '',
                  visibility: 'internal',
                  notes: '',
                });
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              确认更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}