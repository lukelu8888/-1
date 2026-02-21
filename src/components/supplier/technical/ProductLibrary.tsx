import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Plus, Eye, Edit, Package, FileText, Image as ImageIcon, Download, Send, Filter, Grid, List, Calendar, Upload, X, Trash2, Info, FileSpreadsheet, FileImage } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { loadSupplierCategories } from '../../../data/industryTemplates';
import { toast } from 'sonner@2.0.3'; // 🔥 添加toast
import { Label } from '../../ui/label'; // 🔥 添加Label
import { Textarea } from '../../ui/textarea'; // 🔥 添加Textarea
import { Checkbox } from '../../ui/checkbox'; // 🔥 添加Checkbox
import JSZip from 'jszip'; // 🔥 添加JSZip用于创建ZIP文件

/**
 * 🔥 供应商视角：产品资料库
 * - 所有产品的技术资料集中管理
 * - 图纸、BOM、规格书、照片等
 * - 支持按客户、类别、状态分类
 * - 🔥 动态读取供应商自定义的产品分类
 */

// 🔥 下载文件的辅助函数
const downloadFile = (fileName: string, fileContent?: string) => {
  // 创建一个模拟的文件内容（实际应用中应该是真实的文件URL或Blob）
  const content = fileContent || `这是 ${fileName} 的内容`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 🔥 打包下载所有文件的函数（创建ZIP）
const downloadAllFilesAsZip = async (product: any) => {
  const zip = new JSZip();
  const allFiles: any[] = [];
  
  // 收集所有文件
  if (product.files.drawings?.length > 0) {
    allFiles.push(...product.files.drawings.map((f: any) => ({ ...f, type: '图纸', folder: '图纸' })));
  }
  if (product.files.bom?.length > 0) {
    allFiles.push(...product.files.bom.map((f: any) => ({ ...f, type: 'BOM清单', folder: 'BOM清单' })));
  }
  if (product.files.specs?.length > 0) {
    allFiles.push(...product.files.specs.map((f: any) => ({ ...f, type: '产品规格书', folder: '产品规格书' })));
  }
  if (product.files.images?.length > 0) {
    allFiles.push(...product.files.images.map((f: any) => ({ ...f, type: '产品照片', folder: '产品照片' })));
  }
  
  // 添加文件到ZIP
  for (const file of allFiles) {
    if (file.url) {
      // 对于图片，尝试从URL获取
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.folder(file.folder)?.file(file.name, blob);
      } catch (error) {
        // 如果获取失败，添加占位文件
        zip.folder(file.folder)?.file(file.name, `这是 ${file.name} 的内容`);
      }
    } else {
      // 对于其他文件，添加文本说明
      zip.folder(file.folder)?.file(file.name, `这是 ${file.name} 的内容\n版本: ${file.version}\n日期: ${file.date}\n大小: ${file.size}`);
    }
  }
  
  // 生成ZIP并下载
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${product.code}_资料包.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export default function ProductLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false); // 🔥 添加产品对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false); // 🔥 编辑产品对话框
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false); // 🔥 下载确认对话框
  const [sendDialogOpen, setSendDialogOpen] = useState(false); // 🔥 发送确认对话框
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false); // 🔥 图片预览对话框
  const [previewImage, setPreviewImage] = useState<any>(null); // 🔥 当前预览的图片
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]); // 🔥 选中的产品ID列表
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 🔥 批量删除确认对话框
  const [hoverPreview, setHoverPreview] = useState<{ file: any; type: 'image' | 'document'; position: { x: number; y: number } } | null>(null); // 🔥 hover预览状态
  
  // 🔥 文件上传状态
  const [uploadedDrawings, setUploadedDrawings] = useState<File[]>([]);
  const [uploadedBoms, setUploadedBoms] = useState<File[]>([]);
  const [uploadedSpecs, setUploadedSpecs] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  // 🔥 新增产品表单状态
  const [newProductForm, setNewProductForm] = useState({
    code: '',
    name: '',
    nameEn: '',
    specification: '',
    category: '',
    customer: '',
    material: '',
    color: '',
    size: '',
    weight: '',
    waterAbsorption: '',
    breakingStrength: '',
    surfaceFinish: '',
    packingSpec: '',
    notes: '',
  });

  // 🔥 发送表单状态
  const [sendForm, setSendForm] = useState({
    method: 'email', // email / system
    recipient: '',
    subject: '',
    message: '',
    attachAll: true,
    productId: '',
    productCode: '',
    productName: '',
  });

  // 🔥 产品列表状态（从 localStorage 加载数据，实现数据持久化）
  const [productList, setProductList] = useState<any[]>(() => {
    try {
      const savedData = localStorage.getItem('supplier_product_library');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('读取产品数据失败:', error);
    }
    return [];
  });

  // 🔥 监听 productList 变化，自动保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('supplier_product_library', JSON.stringify(productList));
      console.log('✅ 产品数据已自动保存到本地存储');
    } catch (error) {
      console.error('保存产品数据失败:', error);
    }
  }, [productList]);

  // 🔥 动态加载供应商自定义的产品分类
  const supplierCategories = loadSupplierCategories();

  // 🔥 文件上传处理函数
  const handleFileUpload = (fileType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      const fileTypeNames: { [key: string]: string } = {
        'drawing': '产品图纸',
        'bom': 'BOM清单',
        'spec': '产品规格书',
        'image': '产品照片'
      };
      toast.success(`✅ ${fileTypeNames[fileType]} "${fileName}" 上传成功！`);
      switch (fileType) {
        case 'drawing':
          setUploadedDrawings([...uploadedDrawings, files[0]]);
          break;
        case 'bom':
          setUploadedBoms([...uploadedBoms, files[0]]);
          break;
        case 'spec':
          setUploadedSpecs([...uploadedSpecs, files[0]]);
          break;
        case 'image':
          setUploadedImages([...uploadedImages, files[0]]);
          break;
        default:
          break;
      }
    }
  };

  // 🔥 验证必填项
  const validateForm = () => {
    const requiredFields = {
      'code': '产品编码',
      'name': '产品名称（中文）',
      'nameEn': '产品名称（英文）',
      'specification': '规格说明',
      'category': '产品类别',
      'customer': '客户分类',
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!newProductForm[field as keyof typeof newProductForm]) {
        toast.error(`❌ 请填写必填项：${label}`);
        return false;
      }
    }
    return true;
  };

  // 🔥 保存新产品
  const handleSaveNewProduct = () => {
    // 验证必填项
    if (!validateForm()) {
      return;
    }

    // 生成新产品ID
    const newProductId = `PROD-${String(productList.length + 1).padStart(3, '0')}`;
    
    // 创建新产品对象
    const newProduct = {
      id: newProductId,
      code: newProductForm.code,
      name: newProductForm.name,
      nameEn: newProductForm.nameEn,
      specification: newProductForm.specification,
      category: newProductForm.category,
      customer: newProductForm.customer,
      status: 'active',
      relatedOrders: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      createdBy: '当前用户',
      notes: newProductForm.notes,
      technicalData: {
        material: newProductForm.material || 'N/A',
        color: newProductForm.color || 'N/A',
        size: newProductForm.size || 'N/A',
        weight: newProductForm.weight || 'N/A',
        waterAbsorption: newProductForm.waterAbsorption || 'N/A',
        breakingStrength: newProductForm.breakingStrength || 'N/A',
        surfaceFinish: newProductForm.surfaceFinish || 'N/A',
        packingSpec: newProductForm.packingSpec || 'N/A',
      },
      files: {
        drawings: uploadedDrawings.map((file, index) => ({
          id: `DWG-${newProductId}-${index + 1}`,
          name: file.name,
          version: 'V1.0',
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: URL.createObjectURL(file), // 🔥 创建临时URL用于预览
        })),
        bom: uploadedBoms.map((file, index) => ({
          id: `BOM-${newProductId}-${index + 1}`,
          name: file.name,
          version: 'V1.0',
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: URL.createObjectURL(file), // 🔥 创建临时URL用于预览
        })),
        specs: uploadedSpecs.map((file, index) => ({
          id: `SPEC-${newProductId}-${index + 1}`,
          name: file.name,
          version: 'V1.0',
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: URL.createObjectURL(file), // 🔥 创建临时URL用于预览
        })),
        images: uploadedImages.map((file, index) => ({
          id: `IMG-${newProductId}-${index + 1}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          date: new Date().toISOString().split('T')[0],
          url: URL.createObjectURL(file), // 🔥 创建临时URL用于预览
        })),
        others: [],
      },
    };

    // 添加到产品列表
    setProductList([newProduct, ...productList]);

    // 清空表单
    setNewProductForm({
      code: '',
      name: '',
      nameEn: '',
      specification: '',
      category: '',
      customer: '',
      material: '',
      color: '',
      size: '',
      weight: '',
      waterAbsorption: '',
      breakingStrength: '',
      surfaceFinish: '',
      packingSpec: '',
      notes: '',
    });

    // 清空上传的文件
    setUploadedDrawings([]);
    setUploadedBoms([]);
    setUploadedSpecs([]);
    setUploadedImages([]);

    // 关闭对话框
    setAddDialogOpen(false);

    // 显示成功提示
    toast.success(`✅ 产品 "${newProduct.name}" 已成功添加到资料库！`);
  };

  // 🔥 动态生成分类筛选器（必须在products定义之后）
  const categories = [
    { id: 'all', label: '全部类别', count: productList.length },
    ...supplierCategories.map(catName => ({
      id: catName,
      label: catName,
      count: productList.filter(p => p.category === catName).length
    }))
  ];

  const getStatusConfig = (status: string) => {
    const config: any = {
      active: { label: '在产', color: 'bg-green-100 text-green-800 border-green-300' },
      inactive: { label: '停产', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      developing: { label: '开发中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    };
    return config[status] || config.active;
  };

  const getCustomerBadge = (customer: string) => {
    if (customer === 'COSUN') {
      return { label: 'COSUN专属', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    }
    return { label: '通用产品', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  };

  const filteredProducts = productList.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchCustomer = filterCustomer === 'all' || product.customer === filterCustomer;
    const matchStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchSearch && matchCategory && matchCustomer && matchStatus;
  });

  const getTotalFiles = (product: any) => {
    return (product.files.drawings?.length || 0) +
           (product.files.bom?.length || 0) +
           (product.files.specs?.length || 0) +
           (product.files.images?.length || 0) +
           (product.files.others?.length || 0);
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  // 🔥 单选
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, productId]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    }
  };

  // 🔥 是否全选
  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;
  const isSomeSelected = selectedProductIds.length > 0 && selectedProductIds.length < filteredProducts.length;

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>产品资料库</h2>
              <p className="text-xs text-gray-500">
                集中管理所有产品的技术资料、图纸、BOM和规格书 
                {productList.length > 0 && (
                  <span className="ml-2 text-green-600 font-medium">
                    💾 已保存 {productList.length} 个产品
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => {
                if (confirm('⚠️ 确定要清空所有产品数据吗？此操作不可恢复！')) {
                  setProductList([]);
                  localStorage.removeItem('supplier_product_library');
                  toast.success('✅ 所有产品数据已清空');
                }
              }}
              title="清空所有产品数据（不可恢复）"
            >
              <Trash2 className="w-4 h-4" />
              清空数据
            </Button>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              新增产品
            </Button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">产品总数</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{productList.length}</p>
          <p className="text-xs text-gray-500 mt-1">在产: {productList.filter(p => p.status === 'active').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">COSUN专属</span>
            <Badge className="h-4 px-2 text-xs bg-orange-100 text-orange-800">VIP</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {productList.filter(p => p.customer === 'COSUN').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">占比: {((productList.filter(p => p.customer === 'COSUN').length / productList.length) * 100).toFixed(0)}%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">技术文档</span>
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {productList.reduce((sum, p) => sum + getTotalFiles(p), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">图纸/规格/BOM/照片</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">开发中产品</span>
            <Calendar className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {productList.filter(p => p.status === 'developing').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">来样定制</p>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* 分类筛选 */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filterCategory === cat.id
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              style={{ fontSize: '13px' }}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* 高级筛选 + 搜索 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索产品名称、编码或规格..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
          
          <Select value={filterCustomer} onValueChange={setFilterCustomer}>
            <SelectTrigger className="w-40 h-9" style={{ fontSize: '13px' }}>
              <SelectValue placeholder="客户分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部客户</SelectItem>
              <SelectItem value="COSUN">COSUN专属</SelectItem>
              <SelectItem value="通用产品">通用产品</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 批量删除按钮 - 只在有选中产品时显示 */}
          {selectedProductIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              批量删除 ({selectedProductIds.length})
            </Button>
          )}

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9" style={{ fontSize: '13px' }}>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">在产</SelectItem>
              <SelectItem value="developing">开发中</SelectItem>
              <SelectItem value="inactive">停产</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 产品列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-16" style={{ fontSize: '12px' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                    <span>序号</span>
                  </div>
                </TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>产品编码</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>类别</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>客户</TableHead>
                <TableHead className="h-9 w-24 text-center" style={{ fontSize: '12px' }}>技术文档</TableHead>
                <TableHead className="h-9 w-24 text-center" style={{ fontSize: '12px' }}>关联订单</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>最后更新</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-40 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const statusConfig = getStatusConfig(product.status);
                  const customerBadge = getCustomerBadge(product.customer);
                  const totalFiles = getTotalFiles(product);
                  const isSelected = selectedProductIds.includes(product.id);
                  
                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            aria-label={`选择产品 ${product.name}`}
                          />
                          <span className="text-gray-500">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div 
                          className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDetailDialogOpen(true);
                          }}
                          title="点击查看产品详情"
                        >
                          <p className="font-medium text-blue-600">{product.code}</p>
                          <p className="text-xs text-gray-500">{product.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.specification}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <span className="text-gray-700">{product.category}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${customerBadge.color}`}>
                          {customerBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <div 
                          className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors inline-block"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDetailDialogOpen(true);
                          }}
                          title="点击查看技术文档"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{totalFiles}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            图{product.files.drawings?.length || 0} / BOM{product.files.bom?.length || 0} / 片{product.files.images?.length || 0}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <div 
                          className="cursor-pointer hover:bg-green-50 rounded px-2 py-1 inline-block transition-colors"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDetailDialogOpen(true);
                          }}
                          title="点击查看关联订单"
                        >
                          <span className="font-medium text-green-600">{product.relatedOrders}</span>
                          <span className="text-gray-500 ml-1">单</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div>
                          <p className="text-gray-700">{product.lastUpdated}</p>
                          <p className="text-xs text-gray-500">{product.createdBy}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              setSelectedProduct(product);
                              setDetailDialogOpen(true);
                            }}
                            title="详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              setSelectedProduct(product);
                              setDownloadDialogOpen(true);
                            }}
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700"
                            onClick={() => {
                              setSelectedProduct(product);
                              // 自动填充发送表单数据
                              setSendForm({
                                ...sendForm,
                                productId: product.id,
                                productCode: product.code,
                                productName: product.name,
                                subject: `产品技术资料 - ${product.code} ${product.name}`,
                                recipient: product.customer === 'COSUN' ? 'john@cosun.com' : '',
                              });
                              setSendDialogOpen(true);
                            }}
                            title="发送"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setSelectedProduct(product);
                              // 填充编辑表单
                              setNewProductForm({
                                code: product.code,
                                name: product.name,
                                nameEn: product.nameEn || '',
                                specification: product.specification,
                                category: product.category,
                                customer: product.customer,
                                material: product.technicalData?.material || '',
                                color: product.technicalData?.color || '',
                                size: product.technicalData?.size || '',
                                weight: product.technicalData?.weight || '',
                                waterAbsorption: product.technicalData?.waterAbsorption || '',
                                breakingStrength: product.technicalData?.breakingStrength || '',
                                surfaceFinish: product.technicalData?.surfaceFinish || '',
                                packingSpec: product.technicalData?.packingSpec || '',
                                notes: product.notes || '',
                              });
                              setEditDialogOpen(true);
                            }}
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`确定要删除产品"${product.name}"吗？\n\n产品编码：${product.code}\n关联订单：${product.relatedOrders}单\n\n此操作无法撤销，请谨慎操作！`)) {
                                setProductList(productList.filter(p => p.id !== product.id));
                                toast.success('删除成功！', {
                                  description: `已删除产品：${product.code} ${product.name}`,
                                  duration: 3000,
                                });
                              }
                            }}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>暂无产品数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 产品详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              产品资料 - {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              产品编码：{selectedProduct?.code} | {selectedProduct?.specification}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">基本信息</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">产品名称：</span>
                    <span className="font-medium ml-2">{selectedProduct.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">英文名称：</span>
                    <span className="font-medium ml-2">{selectedProduct.nameEn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">产品编码：</span>
                    <span className="font-medium ml-2">{selectedProduct.code}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">规格：</span>
                    <span className="font-medium ml-2">{selectedProduct.specification}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">类别：</span>
                    <span className="font-medium ml-2">{selectedProduct.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">客户：</span>
                    <Badge className={`ml-2 h-5 px-2 text-xs ${getCustomerBadge(selectedProduct.customer).color}`}>
                      {getCustomerBadge(selectedProduct.customer).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 技术参数 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">技术参数</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(selectedProduct.technicalData).map(([key, value]) => {
                    const labels: any = {
                      material: '材质',
                      color: '颜色',
                      size: '尺寸',
                      weight: '重量',
                      waterAbsorption: '吸水率',
                      breakingStrength: '破坏强度',
                      surfaceFinish: '表面处理',
                      packingSpec: '包装规格',
                    };
                    return (
                      <div key={key}>
                        <span className="text-gray-500">{labels[key]}：</span>
                        <span className="font-medium ml-2">{value as string}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 技术文档 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">技术文档</h4>
                <div className="space-y-3">
                  {/* 图纸 */}
                  {selectedProduct.files.drawings?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">📐 产品图纸 ({selectedProduct.files.drawings.length})</p>
                      <div className="space-y-1">
                        {selectedProduct.files.drawings.map((file: any) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100 cursor-pointer relative"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoverPreview({
                                file,
                                type: 'document',
                                position: { x: rect.right + 10, y: rect.top }
                              });
                            }}
                            onMouseLeave={() => setHoverPreview(null)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.version} | {file.date} | {file.size}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100" 
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file.name);
                                toast.success(`正在下载 ${file.name}...`, {
                                  description: `文件大小：${file.size}`,
                                  duration: 2000,
                                });
                              }}
                              title="下载"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOM清单 */}
                  {selectedProduct.files.bom?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">📋 BOM清单 ({selectedProduct.files.bom.length})</p>
                      <div className="space-y-1">
                        {selectedProduct.files.bom.map((file: any) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-2 bg-green-50 rounded hover:bg-green-100 cursor-pointer relative"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoverPreview({
                                file,
                                type: 'document',
                                position: { x: rect.right + 10, y: rect.top }
                              });
                            }}
                            onMouseLeave={() => setHoverPreview(null)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.version} | {file.date} | {file.size}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-100" 
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file.name);
                                toast.success(`正在下载 ${file.name}...`, {
                                  description: `文件大小：${file.size}`,
                                  duration: 2000,
                                });
                              }}
                              title="下载"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 产品规格书 */}
                  {selectedProduct.files.specs?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">📄 产品规格书 ({selectedProduct.files.specs.length})</p>
                      <div className="space-y-1">
                        {selectedProduct.files.specs.map((file: any) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-2 bg-purple-50 rounded hover:bg-purple-100 cursor-pointer relative"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoverPreview({
                                file,
                                type: 'document',
                                position: { x: rect.right + 10, y: rect.top }
                              });
                            }}
                            onMouseLeave={() => setHoverPreview(null)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.version} | {file.date} | {file.size}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-100" 
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file.name);
                                toast.success(`正在下载 ${file.name}...`, {
                                  description: `文件大小：${file.size}`,
                                  duration: 2000,
                                });
                              }}
                              title="下载"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 产品照片 */}
                  {selectedProduct.files.images?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">📸 产品照片 ({selectedProduct.files.images.length})</p>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedProduct.files.images.map((file: any) => (
                          <div key={file.id} className="border rounded overflow-hidden hover:shadow-lg transition-shadow group relative">
                            <div 
                              className="aspect-video bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                              onClick={() => {
                                setPreviewImage(file);
                                setImagePreviewOpen(true);
                              }}
                              onMouseEnter={(e) => {
                                if (file.url) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoverPreview({
                                    file,
                                    type: 'image',
                                    position: { x: rect.right + 10, y: rect.top }
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoverPreview(null)}
                            >
                              {file.url ? (
                                <img 
                                  src={file.url} 
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-12 h-12 text-gray-400" />
                              )}
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{file.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">{file.size}</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (file.url) {
                                      // 下载图片
                                      const link = document.createElement('a');
                                      link.href = file.url;
                                      link.download = file.name;
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }
                                    toast.success(`正在下载 ${file.name}...`, {
                                      description: `文件大小：${file.size}`,
                                      duration: 2000,
                                    });
                                  }}
                                  title="下载"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 备注 */}
              {selectedProduct.notes && (
                <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">备注：</p>
                  <p className="text-sm text-gray-800">{selectedProduct.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button variant="outline" onClick={() => {
              setDownloadDialogOpen(true);
            }}>
              <Download className="w-4 h-4 mr-2" />
              打包下载
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => {
              // 设置发送表单的初始数据
              setSendForm({
                ...sendForm,
                productId: selectedProduct.id,
                productCode: selectedProduct.code,
                productName: selectedProduct.name,
                subject: `产品技术资料 - ${selectedProduct.code} ${selectedProduct.name}`,
                recipient: selectedProduct.customer === 'COSUN' ? 'john@cosun.com' : '',
              });
              // 打开发送对话框
              setSendDialogOpen(true);
            }}>
              <Send className="w-4 h-4 mr-2" />
              发送给客户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 Hover预览悬浮窗 */}
      {hoverPreview && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${Math.min(hoverPreview.position.x, window.innerWidth - (hoverPreview.type === 'image' ? 420 : hoverPreview.file.previewUrl ? 520 : 320))}px`,
            top: `${Math.min(hoverPreview.position.y, window.innerHeight - (hoverPreview.file.previewUrl ? 450 : 350))}px`,
          }}
        >
          {hoverPreview.type === 'image' ? (
            // 图片预览
            <div className="bg-white border-2 border-orange-400 rounded-lg shadow-2xl p-2 animate-in fade-in zoom-in-50 duration-150">
              <div className="relative">
                <img
                  src={hoverPreview.file.url}
                  alt={hoverPreview.file.name}
                  className="max-w-[400px] max-h-[300px] object-contain rounded"
                />
                {/* 预览提示角标 */}
                <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                  预览
                </div>
              </div>
              <div className="mt-2 px-2 border-t pt-2">
                <p className="text-xs font-medium text-gray-800 truncate">{hoverPreview.file.name}</p>
                <p className="text-xs text-gray-500">{hoverPreview.file.size}</p>
              </div>
            </div>
          ) : hoverPreview.file.previewUrl ? (
            // 文档内容预览（有previewUrl）- 根据文件类型智能显示
            (() => {
              const fileName = hoverPreview.file.name.toLowerCase();
              const isPDF = fileName.endsWith('.pdf');
              const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
              const isImage = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif');

              if (isPDF) {
                // PDF文件：使用iframe预览
                return (
                  <div className="bg-white border-2 border-blue-400 rounded-lg shadow-2xl p-2 animate-in fade-in zoom-in-50 duration-150">
                    <div className="relative">
                      <iframe
                        src={hoverPreview.file.previewUrl}
                        className="w-[500px] h-[400px] rounded border-0"
                        title={hoverPreview.file.name}
                      />
                      {/* 预览提示角标 */}
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>PDF预览</span>
                      </div>
                    </div>
                    <div className="mt-2 px-2 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{hoverPreview.file.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {hoverPreview.file.version && <span>版本 {hoverPreview.file.version}</span>}
                            {hoverPreview.file.size && <span>{hoverPreview.file.size}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2 text-blue-600">
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (isExcel) {
                // Excel文件：显示表格图标和详细信息
                return (
                  <div className="bg-white border-2 border-green-400 rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in-50 duration-150 max-w-[350px]">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center shadow-sm">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{hoverPreview.file.name}</p>
                          <span className="flex-shrink-0 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Excel</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600 bg-gray-50 rounded p-2 mb-2">
                          {hoverPreview.file.version && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">版本：</span>
                              <span className="font-medium">{hoverPreview.file.version}</span>
                            </div>
                          )}
                          {hoverPreview.file.date && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">日期：</span>
                              <span className="font-medium">{hoverPreview.file.date}</span>
                            </div>
                          )}
                          {hoverPreview.file.size && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">大小：</span>
                              <span className="font-medium">{hoverPreview.file.size}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5 border border-amber-200">
                          <p className="font-medium">💡 Excel文件需要下载后查看</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (isImage) {
                // 图片文件：直接显示
                return (
                  <div className="bg-white border-2 border-purple-400 rounded-lg shadow-2xl p-2 animate-in fade-in zoom-in-50 duration-150">
                    <div className="relative">
                      <img
                        src={hoverPreview.file.previewUrl}
                        alt={hoverPreview.file.name}
                        className="max-w-[500px] max-h-[400px] object-contain rounded"
                      />
                      {/* 预览提示角标 */}
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg flex items-center gap-1">
                        <FileImage className="w-3 h-3" />
                        <span>图片预览</span>
                      </div>
                    </div>
                    <div className="mt-2 px-2 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{hoverPreview.file.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {hoverPreview.file.version && <span>版本 {hoverPreview.file.version}</span>}
                            {hoverPreview.file.size && <span>{hoverPreview.file.size}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2 text-purple-600">
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // 其他文件类型（CAD等）：显示文件信息
                return (
                  <div className="bg-white border-2 border-indigo-400 rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in-50 duration-150 max-w-[350px]">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded flex items-center justify-center shadow-sm">
                        <FileText className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{hoverPreview.file.name}</p>
                          <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium">文档</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600 bg-gray-50 rounded p-2 mb-2">
                          {hoverPreview.file.version && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">版本：</span>
                              <span className="font-medium">{hoverPreview.file.version}</span>
                            </div>
                          )}
                          {hoverPreview.file.date && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">日期：</span>
                              <span className="font-medium">{hoverPreview.file.date}</span>
                            </div>
                          )}
                          {hoverPreview.file.size && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">大小：</span>
                              <span className="font-medium">{hoverPreview.file.size}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 rounded px-2 py-1">
                          <Download className="w-3 h-3" />
                          <span className="font-medium">点击下载查看文件</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })()
          ) : (
            // 文档信息预览（无previewUrl，降级显示）
            <div className="bg-white border-2 border-blue-400 rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in-50 duration-150 max-w-[300px]">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center shadow-sm">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{hoverPreview.file.name}</p>
                    <span className="flex-shrink-0 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">信息</span>
                  </div>
                  <div className="space-y-0.5 text-xs text-gray-600 bg-gray-50 rounded p-2 mb-2">
                    {hoverPreview.file.version && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">版本：</span>
                        <span className="font-medium">{hoverPreview.file.version}</span>
                      </div>
                    )}
                    {hoverPreview.file.date && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">日期：</span>
                        <span className="font-medium">{hoverPreview.file.date}</span>
                      </div>
                    )}
                    {hoverPreview.file.size && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">大小：</span>
                        <span className="font-medium">{hoverPreview.file.size}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                    <Download className="w-3 h-3" />
                    <span className="font-medium">点击下载文件</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔥 新增产品对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              新增产品资料
            </DialogTitle>
            <DialogDescription>
              填写产品基本信息、技术参数和上传相关文档
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode" className="text-sm">产品编码 *</Label>
                  <Input
                    id="productCode"
                    placeholder="例如：AT-600x600-001"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.code}
                    onChange={(e) => setNewProductForm({ ...newProductForm, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productName" className="text-sm">产品名称（文）*</Label>
                  <Input
                    id="productName"
                    placeholder="例如：抛光砖"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productNameEn" className="text-sm">产品名称（英文）*</Label>
                  <Input
                    id="productNameEn"
                    placeholder="例如：Polished Tile"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.nameEn}
                    onChange={(e) => setNewProductForm({ ...newProductForm, nameEn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specification" className="text-sm">规格说明 *</Label>
                  <Input
                    id="specification"
                    placeholder="例如：600x600mm 米黄色"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.specification}
                    onChange={(e) => setNewProductForm({ ...newProductForm, specification: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm">产品类别 *</Label>
                  <Select value={newProductForm.category} onValueChange={(value) => setNewProductForm({ ...newProductForm, category: value })}>
                    <SelectTrigger className="h-9" style={{ fontSize: '13px' }}>
                      <SelectValue placeholder="选择产品类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm">客户分类 *</Label>
                  <Select value={newProductForm.customer} onValueChange={(value) => setNewProductForm({ ...newProductForm, customer: value })}>
                    <SelectTrigger className="h-9" style={{ fontSize: '13px' }}>
                      <SelectValue placeholder="选择客户分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COSUN">COSUN专属</SelectItem>
                      <SelectItem value="通用产品">通用产品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 技术参数 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">技术参数</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-sm">材质</Label>
                  <Input
                    id="material"
                    placeholder="例如：高岭土、石英砂、长石粉"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.material}
                    onChange={(e) => setNewProductForm({ ...newProductForm, material: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm">颜色</Label>
                  <Input
                    id="color"
                    placeholder="例如：米黄色 (Beige)"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.color}
                    onChange={(e) => setNewProductForm({ ...newProductForm, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-sm">尺寸</Label>
                  <Input
                    id="size"
                    placeholder="例如：600x600x10mm"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.size}
                    onChange={(e) => setNewProductForm({ ...newProductForm, size: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm">重量</Label>
                  <Input
                    id="weight"
                    placeholder="例如：12.5 kg/片"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.weight}
                    onChange={(e) => setNewProductForm({ ...newProductForm, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waterAbsorption" className="text-sm">吸水率</Label>
                  <Input
                    id="waterAbsorption"
                    placeholder="例如：<0.5%"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.waterAbsorption}
                    onChange={(e) => setNewProductForm({ ...newProductForm, waterAbsorption: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakingStrength" className="text-sm">破坏强度</Label>
                  <Input
                    id="breakingStrength"
                    placeholder="例如：>1300N"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.breakingStrength}
                    onChange={(e) => setNewProductForm({ ...newProductForm, breakingStrength: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surfaceFinish" className="text-sm">表面处理</Label>
                  <Input
                    id="surfaceFinish"
                    placeholder="例如：抛光"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.surfaceFinish}
                    onChange={(e) => setNewProductForm({ ...newProductForm, surfaceFinish: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packingSpec" className="text-sm">包装规格</Label>
                  <Input
                    id="packingSpec"
                    placeholder="例如：4片/箱"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={newProductForm.packingSpec}
                    onChange={(e) => setNewProductForm({ ...newProductForm, packingSpec: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 文档上传 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">文档上传</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* 产品图纸 */}
                <div className="space-y-2">
                  <Label className="text-sm">产品图纸（PDF/CAD）</Label>
                  <input
                    type="file"
                    id="drawing-upload"
                    accept=".pdf,.dwg,.dxf"
                    className="hidden"
                    onChange={(e) => handleFileUpload('drawing', e)}
                  />
                  <label
                    htmlFor="drawing-upload"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors block"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-500">点击上传图纸文件</p>
                  </label>
                  {/* 已上传文件列表 */}
                  {uploadedDrawings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedDrawings.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedDrawings(uploadedDrawings.filter((_, i) => i !== index));
                              toast.info(`已删除 "${file.name}"`);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOM清单 */}
                <div className="space-y-2">
                  <Label className="text-sm">BOM清单（Excel）</Label>
                  <input
                    type="file"
                    id="bom-upload"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload('bom', e)}
                  />
                  <label
                    htmlFor="bom-upload"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors block"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-500">点击上传BOM文件</p>
                  </label>
                  {/* 已上传文件列表 */}
                  {uploadedBoms.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedBoms.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedBoms(uploadedBoms.filter((_, i) => i !== index));
                              toast.info(`已删除 "${file.name}"`);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 产品规格书 */}
                <div className="space-y-2">
                  <Label className="text-sm">产品规格书（PDF）</Label>
                  <input
                    type="file"
                    id="spec-upload"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload('spec', e)}
                  />
                  <label
                    htmlFor="spec-upload"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors block"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-500">点击上传规格书</p>
                  </label>
                  {/* 已上传文件列表 */}
                  {uploadedSpecs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedSpecs.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-purple-50 p-2 rounded text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-3 h-3 text-purple-600 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedSpecs(uploadedSpecs.filter((_, i) => i !== index));
                              toast.info(`已删除 "${file.name}"`);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 产品照片 */}
                <div className="space-y-2">
                  <Label className="text-sm">产品照片（JPG/PNG）</Label>
                  <input
                    type="file"
                    id="image-upload"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload('image', e)}
                  />
                  <label
                    htmlFor="image-upload"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors block"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs text-gray-500">点击上传产品照片</p>
                  </label>
                  {/* 已上传文件列表 */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-orange-50 p-2 rounded text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ImageIcon className="w-3 h-3 text-orange-600 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                              toast.info(`已删除 "${file.name}"`);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">备注信息</h4>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm">备注</Label>
                <Textarea
                  id="notes"
                  placeholder="请输入产品备注信息，例如：主打产品、订货量、特殊要求等..."
                  className="min-h-[80px]"
                  style={{ fontSize: '13px' }}
                  value={newProductForm.notes}
                  onChange={(e) => setNewProductForm({ ...newProductForm, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveNewProduct}>
              <Plus className="w-4 h-4 mr-2" />
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 编辑产品对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              编辑产品
            </DialogTitle>
            <DialogDescription>
              修改产品的技术资料和信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code" className="text-xs text-gray-600 mb-1 block">产品编码 <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-code"
                  placeholder="例如：AT-600x600-001"
                  value={newProductForm.code}
                  onChange={(e) => setNewProductForm({ ...newProductForm, code: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-xs text-gray-600 mb-1 block">产品名称（中文） <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-name"
                  placeholder="例如：抛光砖"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-nameEn" className="text-xs text-gray-600 mb-1 block">产品名称（英文）</Label>
                <Input
                  id="edit-nameEn"
                  placeholder="例如：Polished Tile"
                  value={newProductForm.nameEn}
                  onChange={(e) => setNewProductForm({ ...newProductForm, nameEn: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-specification" className="text-xs text-gray-600 mb-1 block">规格型号 <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-specification"
                  placeholder="例如：600x600mm 米黄色"
                  value={newProductForm.specification}
                  onChange={(e) => setNewProductForm({ ...newProductForm, specification: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-category" className="text-xs text-gray-600 mb-1 block">产品类别 <span className="text-red-500">*</span></Label>
                <Select value={newProductForm.category} onValueChange={(value) => setNewProductForm({ ...newProductForm, category: value })}>
                  <SelectTrigger id="edit-category" style={{ fontSize: '13px' }}>
                    <SelectValue placeholder="选择产品类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-customer" className="text-xs text-gray-600 mb-1 block">客户名称 <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-customer"
                  placeholder="例如：COSUN"
                  value={newProductForm.customer}
                  onChange={(e) => setNewProductForm({ ...newProductForm, customer: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>

            {/* 技术参数 */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm mb-3 text-gray-900">技术参数</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-material" className="text-xs text-gray-600 mb-1 block">材质</Label>
                  <Input
                    id="edit-material"
                    placeholder="例如：高岭土、石英砂、长石粉"
                    value={newProductForm.material}
                    onChange={(e) => setNewProductForm({ ...newProductForm, material: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-color" className="text-xs text-gray-600 mb-1 block">颜色</Label>
                  <Input
                    id="edit-color"
                    placeholder="例如：米黄色"
                    value={newProductForm.color}
                    onChange={(e) => setNewProductForm({ ...newProductForm, color: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-size" className="text-xs text-gray-600 mb-1 block">尺寸</Label>
                  <Input
                    id="edit-size"
                    placeholder="例如：600x600x10mm"
                    value={newProductForm.size}
                    onChange={(e) => setNewProductForm({ ...newProductForm, size: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight" className="text-xs text-gray-600 mb-1 block">重量</Label>
                  <Input
                    id="edit-weight"
                    placeholder="例如：12.5 kg/片"
                    value={newProductForm.weight}
                    onChange={(e) => setNewProductForm({ ...newProductForm, weight: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-waterAbsorption" className="text-xs text-gray-600 mb-1 block">吸水率</Label>
                  <Input
                    id="edit-waterAbsorption"
                    placeholder="例如：<0.5%"
                    value={newProductForm.waterAbsorption}
                    onChange={(e) => setNewProductForm({ ...newProductForm, waterAbsorption: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-breakingStrength" className="text-xs text-gray-600 mb-1 block">破坏强度</Label>
                  <Input
                    id="edit-breakingStrength"
                    placeholder="例如：>1300N"
                    value={newProductForm.breakingStrength}
                    onChange={(e) => setNewProductForm({ ...newProductForm, breakingStrength: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-surfaceFinish" className="text-xs text-gray-600 mb-1 block">表面处理</Label>
                  <Input
                    id="edit-surfaceFinish"
                    placeholder="例如：抛光"
                    value={newProductForm.surfaceFinish}
                    onChange={(e) => setNewProductForm({ ...newProductForm, surfaceFinish: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-packingSpec" className="text-xs text-gray-600 mb-1 block">包装规格</Label>
                  <Input
                    id="edit-packingSpec"
                    placeholder="例如：4片/箱"
                    value={newProductForm.packingSpec}
                    onChange={(e) => setNewProductForm({ ...newProductForm, packingSpec: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div>
              <Label htmlFor="edit-notes" className="text-xs text-gray-600 mb-1 block">备注</Label>
              <Textarea
                id="edit-notes"
                placeholder="输入备注信息..."
                value={newProductForm.notes}
                onChange={(e) => setNewProductForm({ ...newProductForm, notes: e.target.value })}
                rows={3}
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                if (!newProductForm.code || !newProductForm.name || !newProductForm.specification || !newProductForm.category || !newProductForm.customer) {
                  toast.error('请填写所有必填字段！');
                  return;
                }
                
                // 更新产品列表
                setProductList(productList.map(product => {
                  if (product.id === selectedProduct?.id) {
                    return {
                      ...product,
                      code: newProductForm.code,
                      name: newProductForm.name,
                      nameEn: newProductForm.nameEn,
                      specification: newProductForm.specification,
                      category: newProductForm.category,
                      customer: newProductForm.customer,
                      notes: newProductForm.notes,
                      technicalData: {
                        ...product.technicalData,
                        material: newProductForm.material,
                        color: newProductForm.color,
                        size: newProductForm.size,
                        weight: newProductForm.weight,
                        waterAbsorption: newProductForm.waterAbsorption,
                        breakingStrength: newProductForm.breakingStrength,
                        surfaceFinish: newProductForm.surfaceFinish,
                        packingSpec: newProductForm.packingSpec,
                      },
                      lastUpdated: new Date().toISOString().split('T')[0],
                    };
                  }
                  return product;
                }));
                
                toast.success('产品信息修改成功！', {
                  description: `${newProductForm.name} 的信息已更新`,
                  duration: 3000,
                });
                setEditDialogOpen(false);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 下载确认对话框 */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-600" />
              确认下载
            </DialogTitle>
            <DialogDescription>
              您确定要下载 {selectedProduct?.name} 的所有资料吗？
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* 产品信息 */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-sm">产品信息</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">产品编码：</span><span className="font-medium">{selectedProduct.code}</span></div>
                  <div><span className="text-gray-500">产品名称：</span><span className="font-medium">{selectedProduct.name}</span></div>
                  <div><span className="text-gray-500">规格：</span><span className="font-medium">{selectedProduct.specification}</span></div>
                  <div><span className="text-gray-500">类别：</span><span className="font-medium">{selectedProduct.category}</span></div>
                </div>
              </div>

              {/* 文件列表 */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">打包文件清单（{getTotalFiles(selectedProduct)}个文件）</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    预计大小：{(() => {
                      let totalSize = 0;
                      selectedProduct.files.drawings?.forEach((f: any) => {
                        const size = parseFloat(f.size);
                        totalSize += f.size.includes('MB') ? size * 1024 : size;
                      });
                      selectedProduct.files.bom?.forEach((f: any) => {
                        const size = parseFloat(f.size);
                        totalSize += f.size.includes('MB') ? size * 1024 : size;
                      });
                      selectedProduct.files.specs?.forEach((f: any) => {
                        const size = parseFloat(f.size);
                        totalSize += f.size.includes('MB') ? size * 1024 : size;
                      });
                      selectedProduct.files.images?.forEach((f: any) => {
                        const size = parseFloat(f.size);
                        totalSize += f.size.includes('MB') ? size * 1024 : size;
                      });
                      return totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} MB` : `${totalSize.toFixed(0)} KB`;
                    })()}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* 图纸文件 */}
                  {selectedProduct.files.drawings?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">📐 产品图纸 ({selectedProduct.files.drawings.length})</p>
                      {selectedProduct.files.drawings.map((file: any) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs cursor-pointer hover:bg-blue-100"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoverPreview({
                              file,
                              type: 'document',
                              position: { x: rect.right + 10, y: rect.top }
                            });
                          }}
                          onMouseLeave={() => setHoverPreview(null)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>{file.name}</span>
                          </div>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BOM清单 */}
                  {selectedProduct.files.bom?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">📋 BOM清单 ({selectedProduct.files.bom.length})</p>
                      {selectedProduct.files.bom.map((file: any) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-2 bg-green-50 rounded text-xs cursor-pointer hover:bg-green-100"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoverPreview({
                              file,
                              type: 'document',
                              position: { x: rect.right + 10, y: rect.top }
                            });
                          }}
                          onMouseLeave={() => setHoverPreview(null)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-green-600" />
                            <span>{file.name}</span>
                          </div>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 规格书 */}
                  {selectedProduct.files.specs?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">📄 产品规格书 ({selectedProduct.files.specs.length})</p>
                      {selectedProduct.files.specs.map((file: any) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-2 bg-purple-50 rounded text-xs cursor-pointer hover:bg-purple-100"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoverPreview({
                              file,
                              type: 'document',
                              position: { x: rect.right + 10, y: rect.top }
                            });
                          }}
                          onMouseLeave={() => setHoverPreview(null)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-purple-600" />
                            <span>{file.name}</span>
                          </div>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 产品照片 */}
                  {selectedProduct.files.images?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">📸 产品照片 ({selectedProduct.files.images.length})</p>
                      {selectedProduct.files.images.map((file: any) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-2 bg-orange-50 rounded text-xs cursor-pointer hover:bg-orange-100"
                          onMouseEnter={(e) => {
                            if (file.url) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoverPreview({
                                file,
                                type: 'image',
                                position: { x: rect.right + 10, y: rect.top }
                              });
                            }
                          }}
                          onMouseLeave={() => setHoverPreview(null)}
                        >
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-3 h-3 text-orange-600" />
                            <span>{file.name}</span>
                          </div>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 下载说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">下载说明：</p>
                    <p>• 点击"确认下载"后，浏览器会自动下载文件到默认下载文件夹</p>
                    <p>• 文件将打包为 <span className="font-mono bg-white px-1 rounded">{selectedProduct.code}_资料包.zip</span> 格式</p>
                    <p>• 包含所有技术文档、图纸、规格书和产品照片的清单</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={async () => {
              if (!selectedProduct) return;

              // 🔥 使用ZIP方式下载
              try {
                await downloadAllFilesAsZip(selectedProduct);
                toast.success(`正在下载 ${selectedProduct.name} 的资料包`, {
                  description: `文件名：${selectedProduct.code}_资料包.zip`,
                  duration: 3000,
                });
                setDownloadDialogOpen(false);
              } catch (error) {
                toast.error('下载失败，请重试');
              }
              
              return;
              
              // 🔥 旧的文本文件方式（保留备用）
              const fileContent = `
═══════════════════════════════════════════════════════
  产品资料包 - ${selectedProduct.name}
═══════════════════════════════════════════════════════

【产品信息】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
产品编码：${selectedProduct.code}
产品名称：${selectedProduct.name}
英文名称：${selectedProduct.nameEn}
规格说明：${selectedProduct.specification}
产品类别：${selectedProduct.category}
客户分类：${selectedProduct.customer}
产品状态：${getStatusConfig(selectedProduct.status).label}
关联订单：${selectedProduct.relatedOrders} 单
最后更新：${selectedProduct.lastUpdated}
创建人员：${selectedProduct.createdBy}

【技术参数】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
材质：${selectedProduct.technicalData.material}
颜色：${selectedProduct.technicalData.color}
尺寸：${selectedProduct.technicalData.size}
重量：${selectedProduct.technicalData.weight}
吸水率：${selectedProduct.technicalData.waterAbsorption}
破坏强度：${selectedProduct.technicalData.breakingStrength}
表面处理：${selectedProduct.technicalData.surfaceFinish}
包装规格：${selectedProduct.technicalData.packingSpec}

【技术文档清单】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 产品图纸 (${selectedProduct.files.drawings?.length || 0}个文件)
${selectedProduct.files.drawings?.map((file: any, index: number) => 
  `  ${index + 1}. ${file.name}
     版本：${file.version} | 日期：${file.date} | 大小：${file.size}`
).join('\n') || '  暂无图纸文件'}

📋 BOM清单 (${selectedProduct.files.bom?.length || 0}个文件)
${selectedProduct.files.bom?.map((file: any, index: number) => 
  `  ${index + 1}. ${file.name}
     版本：${file.version} | 日期：${file.date} | 大小：${file.size}`
).join('\n') || '  暂无BOM文件'}

📄 产品规格书 (${selectedProduct.files.specs?.length || 0}个文件)
${selectedProduct.files.specs?.map((file: any, index: number) => 
  `  ${index + 1}. ${file.name}
     版本：${file.version} | 日期：${file.date} | 大小：${file.size}`
).join('\n') || '  暂无规格书'}

📸 产品照片 (${selectedProduct.files.images?.length || 0}个文件)
${selectedProduct.files.images?.map((file: any, index: number) => 
  `  ${index + 1}. ${file.name}
     日期：${file.date} | 大小：${file.size}`
).join('\n') || '  暂无产品照片'}

${selectedProduct.notes ? `【备注信息】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${selectedProduct.notes}
` : ''}
【文件统计】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
文件总数：${getTotalFiles(selectedProduct)} 个
生成时间：${new Date().toLocaleString('zh-CN')}

═══════════════════════════════════════════════════════
  福建高盛达富建材有限公司 - 产品资料管理系统
═══════════════════════════════════════════════════════
`;

              // 🔥 创建 Blob 对象
              const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
              
              // 🔥 创建下载链接
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${selectedProduct.code}_${selectedProduct.name}_资料包.txt`;
              
              // 🔥 触发下载
              document.body.appendChild(link);
              link.click();
              
              // 🔥 清理
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              // 显示成功提示
              const totalFiles = getTotalFiles(selectedProduct);
              toast.success(`✅ 下载成功！文件已保存到浏览器默认下载文件夹`, {
                description: `${selectedProduct.code}_${selectedProduct.name}_资料包.txt（包含${totalFiles}个文件清单）`,
                duration: 5000,
              });
              
              setDownloadDialogOpen(false);
            }}>
              <Download className="w-4 h-4 mr-2" />
              确认下载
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 发送资料对话框 */}
      <Dialog open={sendDialogOpen} onOpenChange={(open) => {
        setSendDialogOpen(open);
        if (!open) {
          // 关闭时重置表单
          setSendForm({
            method: 'email',
            recipient: '',
            subject: '',
            message: '',
            attachAll: true,
            productId: '',
            productCode: '',
            productName: '',
          });
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600" />
              发送产品资料
            </DialogTitle>
            <DialogDescription>
              向客户发送 {selectedProduct?.name} 的技术资料和文档
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* 产品信息 */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-sm">产品信息</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">产品编码：</span><span className="font-medium">{selectedProduct.code}</span></div>
                  <div><span className="text-gray-500">产品名称：</span><span className="font-medium">{selectedProduct.name}</span></div>
                  <div><span className="text-gray-500">规格：</span><span className="font-medium">{selectedProduct.specification}</span></div>
                  <div><span className="text-gray-500">客户：</span><Badge className="ml-1 h-5 px-2 text-xs bg-orange-100 text-orange-800">{selectedProduct.customer}</Badge></div>
                </div>
              </div>

              {/* 发送方式 */}
              <div className="border rounded-lg p-4">
                <Label className="text-sm font-medium mb-3 block">发送方式</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSendForm({ ...sendForm, method: 'email' })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      sendForm.method === 'email'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        sendForm.method === 'email' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {sendForm.method === 'email' && <div className="w-2 h-2 rounded-full bg-orange-600" />}
                      </div>
                      <span className="font-medium text-sm">📧 电子邮件</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">通过邮件发送给客户联系人</p>
                  </button>

                  <button
                    onClick={() => setSendForm({ ...sendForm, method: 'system' })}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      sendForm.method === 'system'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        sendForm.method === 'system' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {sendForm.method === 'system' && <div className="w-2 h-2 rounded-full bg-orange-600" />}
                      </div>
                      <span className="font-medium text-sm">💬 系统消息</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">发送到客户Portal系统内</p>
                  </button>
                </div>
              </div>

              {/* 收件人 */}
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-sm">
                  {sendForm.method === 'email' ? '收件人邮箱 *' : '接收客户 *'}
                </Label>
                {sendForm.method === 'email' ? (
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="例如：john@cosun.com"
                    className="h-9"
                    style={{ fontSize: '13px' }}
                    value={sendForm.recipient}
                    onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                  />
                ) : (
                  <Select value={sendForm.recipient} onValueChange={(value) => setSendForm({ ...sendForm, recipient: value })}>
                    <SelectTrigger className="h-9" style={{ fontSize: '13px' }}>
                      <SelectValue placeholder="选择接收客户" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COSUN">COSUN - 主要联系人</SelectItem>
                      <SelectItem value="COSUN-John">COSUN - John Smith</SelectItem>
                      <SelectItem value="COSUN-Mary">COSUN - Mary Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 主题 */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm">邮件主题 *</Label>
                <Input
                  id="subject"
                  placeholder="例如：产品技术资料 - AT-600x600-001 抛光砖"
                  className="h-9"
                  style={{ fontSize: '13px' }}
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                />
              </div>

              {/* 附件选择 */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">附件文件（{getTotalFiles(selectedProduct)}个）</Label>
                  <button
                    onClick={() => setSendForm({ ...sendForm, attachAll: !sendForm.attachAll })}
                    className="text-xs text-orange-600 hover:underline"
                  >
                    {sendForm.attachAll ? '取消全选' : '全选'}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {/* 图纸 */}
                  {selectedProduct.files.drawings?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">📐 产品图纸</p>
                      {selectedProduct.files.drawings.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs">
                          <input type="checkbox" checked={sendForm.attachAll} readOnly className="rounded" />
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span className="flex-1">{file.name}</span>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BOM */}
                  {selectedProduct.files.bom?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">📋 BOM清单</p>
                      {selectedProduct.files.bom.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                          <input type="checkbox" checked={sendForm.attachAll} readOnly className="rounded" />
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="flex-1">{file.name}</span>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 规格书 */}
                  {selectedProduct.files.specs?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">📄 产品规格书</p>
                      {selectedProduct.files.specs.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded text-xs">
                          <input type="checkbox" checked={sendForm.attachAll} readOnly className="rounded" />
                          <FileText className="w-3 h-3 text-purple-600" />
                          <span className="flex-1">{file.name}</span>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 照片 */}
                  {selectedProduct.files.images?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">📸 产品照片</p>
                      {selectedProduct.files.images.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-orange-50 rounded text-xs">
                          <input type="checkbox" checked={sendForm.attachAll} readOnly className="rounded" />
                          <ImageIcon className="w-3 h-3 text-orange-600" />
                          <span className="flex-1">{file.name}</span>
                          <span className="text-gray-500">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 邮件内容 */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm">邮件内容</Label>
                <Textarea
                  id="message"
                  placeholder={`尊敬的${selectedProduct.customer}客户，\n\n附件是产品 ${selectedProduct.code} - ${selectedProduct.name} 的完整技术资料，包括图纸、BOM清单、规格书和产品照片，请查收。\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！\n\n福建高盛达富建材有限公司`}
                  className="min-h-[120px]"
                  style={{ fontSize: '13px' }}
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                />
              </div>

              {/* 提示信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">发送说明：</p>
                    <p>• 系统将自动记录发送历史，可在"发送记录"中查看</p>
                    <p>• {sendForm.method === 'email' ? '邮件将在1-2分钟内送达客户邮箱' : '消息将立即推送到客户Portal系统'}</p>
                    <p>• 附件文件总数：{getTotalFiles(selectedProduct)}个</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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

                const totalFiles = getTotalFiles(selectedProduct);
                const methodName = sendForm.method === 'email' ? '邮件' : '系统消息';
                
                // 🔥 如果是邮件发送，调用后端API
                if (sendForm.method === 'email') {
                  try {
                    // 显示发送中提示
                    toast.loading('📧 正在发送邮件...', { id: 'sending-email' });

                    // 准备文件列表数据
                    const filesList = [];
                    
                    selectedProduct.files.drawings?.forEach((file: any) => {
                      filesList.push({ ...file, category: 'drawings' });
                    });
                    selectedProduct.files.bom?.forEach((file: any) => {
                      filesList.push({ ...file, category: 'bom' });
                    });
                    selectedProduct.files.specs?.forEach((file: any) => {
                      filesList.push({ ...file, category: 'specs' });
                    });
                    selectedProduct.files.images?.forEach((file: any) => {
                      filesList.push({ ...file, category: 'images' });
                    });

                    // 调用后端邮件发送API
                    const { projectId, publicAnonKey } = await import('../../../utils/supabase/info');
                    
                    const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/send-product-materials`;
                    console.log('📧 调用邮件API:', apiUrl);
                    
                    const response = await fetch(
                      apiUrl,
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
                            code: selectedProduct.code,
                            name: selectedProduct.name,
                            nameEn: selectedProduct.nameEn,
                            specification: selectedProduct.specification,
                            category: selectedProduct.category,
                          },
                          files: filesList,
                        }),
                      }
                    );

                    console.log('📧 响应状态:', response.status, response.statusText);
                    
                    // 先获取原始文本，以便调试
                    const responseText = await response.text();
                    console.log('📧 响应原始内容:', responseText);
                    
                    // 尝试解析JSON
                    let result;
                    try {
                      result = JSON.parse(responseText);
                    } catch (parseError) {
                      console.error('❌ JSON解析失败:', parseError);
                      console.error('响应内容（前200字符）:', responseText.substring(0, 200));
                      throw new Error(`服务器返回了无效的响应格式。响应内容: ${responseText.substring(0, 100)}...`);
                    }

                    // 关闭发送中提示
                    toast.dismiss('sending-email');

                    if (!response.ok || !result.success) {
                      console.error('❌ 邮件发送失败:', result);
                      
                      // 特殊处理API密钥未配置的情况
                      if (result.error && result.error.includes('RESEND_API_KEY')) {
                        toast.error('⚙️ 邮件服务未配置', {
                          description: '请在Supabase Dashboard中设置RESEND_API_KEY环境变量。详细说明请查看项目根目录的 EMAIL_SETUP.md 文件。',
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
                      description: `已将 ${selectedProduct.name} 的资料（${totalFiles}个文件）发送到 ${sendForm.recipient}`,
                      duration: 5000,
                    });

                  } catch (error) {
                    console.error('❌ 邮件发送异常详情:', error);
                    console.error('错误类型:', error.constructor?.name);
                    console.error('错误消息:', error.message);
                    console.error('错误堆栈:', error.stack);
                    toast.dismiss('sending-email');
                    toast.error('❌ 邮件发送异常', {
                      description: `${error.message || '请检查网络连接'}。详情请打开浏览器控制台（按F12）查看。`,
                      duration: 8000,
                    });
                    return;
                  }
                } else {
                  // 系统消息发送（暂时只显示成功提示）
                  toast.success(`✅ 发送成功！`, {
                    description: `已通过${methodName}将 ${selectedProduct.name} 的资料（${totalFiles}个文件）发送给 ${sendForm.recipient}`,
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
                  attachAll: true,
                  productId: '',
                  productCode: '',
                  productName: '',
                });
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 图片预览对话框 */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              图片预览
            </DialogTitle>
            <DialogDescription>
              {previewImage?.name}
            </DialogDescription>
          </DialogHeader>

          {previewImage && (
            <div className="space-y-4">
              {/* 图片预览区域 */}
              <div className="border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden" style={{ minHeight: '400px', maxHeight: '600px' }}>
                {previewImage.url ? (
                  <img 
                    src={previewImage.url} 
                    alt={previewImage.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-24 h-24 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{previewImage.name}</p>
                    <p className="text-xs text-gray-400 mt-1">文件大小：{previewImage.size}</p>
                  </div>
                )}
              </div>

              {/* 文件信息 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">文件名称</p>
                  <p className="text-sm font-medium">{previewImage.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">文件大小</p>
                  <p className="text-sm font-medium">{previewImage.size}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImagePreviewOpen(false)}>关闭</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (previewImage) {
                  if (previewImage.url) {
                    // 下载图片
                    const link = document.createElement('a');
                    link.href = previewImage.url;
                    link.download = previewImage.name;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                  toast.success(`正在下载 ${previewImage.name}...`, {
                    description: `文件大小：${previewImage.size}`,
                    duration: 2000,
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              下载图片
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 批量删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              批量删除确认
            </DialogTitle>
            <DialogDescription>
              此操作不可撤销，确认要删除选中的产品吗？
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 警告提示 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-800">
                  <p className="font-medium mb-1">⚠️ 警告：</p>
                  <p>• 您即将删除 <span className="font-bold">{selectedProductIds.length}</span> 个产品</p>
                  <p>• 删除后将无法恢复产品及其关联的所有技术资料</p>
                  <p>• 请确认这些产品不再需要</p>
                </div>
              </div>
            </div>

            {/* 将要删除的产品列表 */}
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b sticky top-0">
                <p className="text-xs font-medium text-gray-700">将要删除的产品：</p>
              </div>
              <div className="divide-y">
                {productList.filter(p => selectedProductIds.includes(p.id)).map((product) => (
                  <div key={product.id} className="p-2 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.code}</p>
                      </div>
                      <Badge className="text-xs bg-red-100 text-red-800 border-red-300">
                        {getTotalFiles(product)} 个文件
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                // 🔥 执行批量删除
                const deletedCount = selectedProductIds.length;
                const deletedProducts = productList.filter(p => selectedProductIds.includes(p.id));
                
                // 从列表中移除选中的产品
                const remainingProducts = productList.filter(p => !selectedProductIds.includes(p.id));
                setProductList(remainingProducts);
                
                toast.success(`成功删除 ${deletedCount} 个产品`, {
                  description: `已删除：${deletedProducts.map(p => p.name).join('、')}`,
                  duration: 3000,
                });
                
                // 清空选中状态
                setSelectedProductIds([]);
                setDeleteDialogOpen(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}