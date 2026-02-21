import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { toast } from 'sonner@2.0.3';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  FileIcon,
  Edit3,
  AlertTriangle,
  Plus,
  Search,
  ExternalLink,
  Package,
  FileCheck,
  DollarSign,
  ShieldCheck,
  Info,
  Percent
} from 'lucide-react';

// ==================== 类型定义 ====================

// 产品信息
interface Product {
  id: string;
  name: string;
  nameEn: string;
  hsCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  taxRate: number; // 退税率
  requiresInspection: boolean; // 是否需要商检
  declarationElements: string; // 报关要素
  material?: string;
  usage?: string;
  brand?: string;
  model?: string;
}

// 文件
interface NodeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  category: string;
}

// 操作日志
interface OperationLog {
  id: string;
  action: string;
  operator: string;
  timestamp: string;
  details?: string;
}

interface CustomsDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentInfo: {
    shipmentNo: string;
    contractNo: string;
    customerName: string;
  };
  onSave?: (data: any) => void;
}

// ==================== 主组件 ====================

export default function CustomsDeclarationModal({
  isOpen,
  onClose,
  shipmentInfo,
  onSave
}: CustomsDeclarationModalProps) {
  // 状态管理
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'delayed'>('in_progress');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // 基础信息
  const [declarationNo, setDeclarationNo] = useState('');
  const [declarationDate, setDeclarationDate] = useState('');
  const [customsBroker, setCustomsBroker] = useState('');
  const [customsOfficer, setCustomsOfficer] = useState('');
  const [totalDeclaredValue, setTotalDeclaredValue] = useState('');
  const [customsDuty, setCustomsDuty] = useState('');
  const [vat, setVat] = useState('');
  const [notes, setNotes] = useState('');

  // 产品列表
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: '不锈钢水龙头',
      nameEn: 'Stainless Steel Faucet',
      hsCode: '8481.80.9000',
      quantity: 1000,
      unit: '件',
      unitPrice: 25.50,
      totalAmount: 25500,
      taxRate: 13,
      requiresInspection: true,
      declarationElements: '品名|用途|材质|品牌|型号',
      material: '304不锈钢',
      usage: '厨房水槽用',
      brand: 'COSUN',
      model: 'CS-F-8800'
    }
  ]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // 文件管理
  const [files, setFiles] = useState<NodeFile[]>([
    {
      id: '1',
      name: '报关单.pdf',
      type: 'application/pdf',
      size: 1024000,
      url: '#',
      uploadedAt: '2024-11-20',
      uploadedBy: '张三',
      category: '报关单'
    }
  ]);

  // 文件类型
  const fileCategories = [
    '报关单',
    '装箱单',
    '商业发票',
    '合同',
    '报关委托书',
    '核销单',
    '原产地证',
    '商检证明',
    '其他文件'
  ];

  // 操作日志
  const [operationLogs] = useState<OperationLog[]>([
    { id: '1', action: '创建报关任务', operator: '系统', timestamp: '2024-11-20 10:00', details: '自动创建报关节点' },
    { id: '2', action: '添加产品信息', operator: '张三', timestamp: '2024-11-20 11:30', details: '添加1个产品' },
    { id: '3', action: '上传报关单', operator: '李四', timestamp: '2024-11-20 14:15', details: '上传文件：报关单.pdf' }
  ]);

  // 添加/编辑产品
  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === product.id ? product : p));
      toast.success('产品已更新');
    } else {
      setProducts([...products, { ...product, id: Date.now().toString() }]);
      toast.success('产品已添加');
    }
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // 删除产品
  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success('产品已删除');
  };

  // 文件上传
  const handleFileUpload = (category: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newFile: NodeFile = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: '当前用户',
      category
    };

    setFiles([...files, newFile]);
    toast.success(`${category} 上传成功`);
  };

  // 下载文件
  const handleDownloadFile = (file: NodeFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
    toast.success('文件下载中...');
  };

  // 删除文件
  const handleDeleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast.success('文件已删除');
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 计算总金额
  const totalAmount = products.reduce((sum, p) => sum + p.totalAmount, 0);

  // 获取状态显示
  const getStatusDisplay = (s: string) => {
    const statusMap = {
      'pending': { label: '待处理', color: 'gray', icon: Clock },
      'in_progress': { label: '报关中', color: 'blue', icon: Clock },
      'completed': { label: '已放行', color: 'green', icon: CheckCircle2 },
      'delayed': { label: '查验中', color: 'orange', icon: AlertCircle }
    };
    return statusMap[s as keyof typeof statusMap] || statusMap.pending;
  };

  const statusDisplay = getStatusDisplay(status);
  const StatusIcon = statusDisplay.icon;

  // 文件按类型分组
  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.category]) {
      acc[file.category] = [];
    }
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, NodeFile[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1600px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <DialogHeader className="border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium text-gray-900">
                报关管理
              </DialogTitle>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500">{shipmentInfo.shipmentNo}</span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500">{shipmentInfo.contractNo}</span>
              <Badge variant="outline" className={`bg-${statusDisplay.color}-50 text-${statusDisplay.color}-700 border-${statusDisplay.color}-200 text-xs h-5`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusDisplay.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                  <Edit3 className="w-3 h-3 mr-1" />
                  编辑
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-7 text-xs"
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success('保存成功');
                      setIsEditing(false);
                    }}
                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    保存
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-200 px-4">
              <TabsList className="h-9">
                <TabsTrigger value="products" className="text-xs">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  产品清单
                  <Badge variant="secondary" className="ml-1.5 text-xs">{products.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                  报关信息
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  单证文件
                  <Badge variant="secondary" className="ml-1.5 text-xs">{files.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-xs">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  操作记录
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 产品清单 */}
            <TabsContent value="products" className="p-4 space-y-3 mt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-900">产品清单</h3>
                  <Badge variant="outline" className="text-xs">共 {products.length} 个产品</Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    总金额: USD {totalAmount.toLocaleString()}
                  </Badge>
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    添加产品
                  </Button>
                )}
              </div>

              {/* 产品列表 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">产品名称</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">HS编码</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">数量</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">单价</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">金额</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">退税率</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">商检</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <p className="text-xs font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.nameEn}</p>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{product.hsCode}</code>
                            <a
                              href={`https://www.hs-bianma.com/search?keyword=${product.hsCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                              title="查询HS编码"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <p className="text-xs text-gray-900">{product.quantity} {product.unit}</p>
                        </td>
                        <td className="py-2 px-3">
                          <p className="text-xs text-gray-900">USD {product.unitPrice}</p>
                        </td>
                        <td className="py-2 px-3">
                          <p className="text-xs font-medium text-gray-900">USD {product.totalAmount.toLocaleString()}</p>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {product.taxRate}%
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          {product.requiresInspection ? (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              需要
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                              不需要
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductForm(true);
                              }}
                              disabled={!isEditing}
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            </Button>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 产品编辑表单弹窗 */}
              {showProductForm && (
                <ProductFormDialog
                  product={editingProduct}
                  onSave={handleSaveProduct}
                  onClose={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                />
              )}
            </TabsContent>

            {/* 报关信息 */}
            <TabsContent value="info" className="p-4 space-y-3 mt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* 左列 */}
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded">
                    <div className="px-3 py-2 border-b bg-gray-50">
                      <h4 className="text-xs font-medium text-gray-700">基本信息</h4>
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div>
                        <Label className="text-xs text-gray-600">报关单号</Label>
                        {isEditing ? (
                          <Input value={declarationNo} onChange={(e) => setDeclarationNo(e.target.value)} className="h-7 mt-1 text-xs" placeholder="请输入报关单号" />
                        ) : (
                          <p className="text-xs text-gray-900 mt-1">{declarationNo || '未填写'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">报关日期</Label>
                        {isEditing ? (
                          <Input type="date" value={declarationDate} onChange={(e) => setDeclarationDate(e.target.value)} className="h-7 mt-1 text-xs" />
                        ) : (
                          <p className="text-xs text-gray-900 mt-1">{declarationDate || '未填写'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">报关行</Label>
                        {isEditing ? (
                          <Input value={customsBroker} onChange={(e) => setCustomsBroker(e.target.value)} className="h-7 mt-1 text-xs" placeholder="请输入报关行名称" />
                        ) : (
                          <p className="text-xs text-gray-900 mt-1">{customsBroker || '未填写'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">报关员</Label>
                        {isEditing ? (
                          <Input value={customsOfficer} onChange={(e) => setCustomsOfficer(e.target.value)} className="h-7 mt-1 text-xs" placeholder="请输入报关员姓名" />
                        ) : (
                          <p className="text-xs text-gray-900 mt-1">{customsOfficer || '未填写'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右列 */}
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded">
                    <div className="px-3 py-2 border-b bg-gray-50">
                      <h4 className="text-xs font-medium text-gray-700">费用信息</h4>
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div>
                        <Label className="text-xs text-gray-600">申报金额</Label>
                        {isEditing ? (
                          <Input value={totalDeclaredValue} onChange={(e) => setTotalDeclaredValue(e.target.value)} className="h-7 mt-1 text-xs" placeholder="USD" />
                        ) : (
                          <p className="text-xs font-medium text-gray-900 mt-1">USD {totalAmount.toLocaleString()}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">关税</Label>
                        {isEditing ? (
                          <Input value={customsDuty} onChange={(e) => setCustomsDuty(e.target.value)} className="h-7 mt-1 text-xs" placeholder="CNY" />
                        ) : (
                          <p className="text-xs text-gray-900 mt-1">{customsDuty || '未填写'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">增值税</Label>
                        {isEditing ? (
                          <Input value={vat} onChange={(e) => setVat(e.target.value)} className="h-7 mt-1 text-xs" placeholder="CNY" />
                        ) : (
                          <p className="text-xs text-gray-900 mt-1">{vat || '未填写'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded">
                    <div className="px-3 py-2 border-b bg-gray-50">
                      <h4 className="text-xs font-medium text-gray-700">备注说明</h4>
                    </div>
                    <div className="p-3">
                      {isEditing ? (
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none text-xs" placeholder="添加备注..." />
                      ) : (
                        <p className="text-xs text-gray-600">{notes || '暂无备注'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 单证文件 */}
            <TabsContent value="documents" className="p-4 space-y-3 mt-0">
              <div className="grid grid-cols-3 gap-3">
                {fileCategories.map((category) => (
                  <div key={category} className="border border-gray-200 rounded">
                    <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                      <h4 className="text-xs font-medium text-gray-700">{category}</h4>
                      <label>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(category, e)}
                          disabled={!isEditing}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          disabled={!isEditing}
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                          }}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          上传
                        </Button>
                      </label>
                    </div>
                    <div className="p-2">
                      {groupedFiles[category] && groupedFiles[category].length > 0 ? (
                        <div className="space-y-1.5">
                          {groupedFiles[category].map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDownloadFile(file)}
                                  title="下载"
                                >
                                  <Download className="w-3 h-3 text-gray-500" />
                                </Button>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500"
                                    onClick={() => handleDeleteFile(file.id)}
                                    title="删除"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">暂无文件</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 操作记录 */}
            <TabsContent value="logs" className="p-4 mt-0">
              <div className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b bg-gray-50">
                  <h4 className="text-xs font-medium text-gray-700">操作时间线</h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {operationLogs.map((log, index) => (
                      <div key={log.id} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3 h-3 text-blue-600" />
                          </div>
                          {index < operationLogs.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 mt-1.5" style={{ minHeight: '16px' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-start justify-between mb-0.5">
                            <p className="text-xs font-medium text-gray-900">{log.action}</p>
                            <span className="text-xs text-gray-400 ml-2">{log.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span>{log.operator}</span>
                          </div>
                          {log.details && (
                            <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== 产品表单弹窗 ====================

interface ProductFormDialogProps {
  product: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

function ProductFormDialog({ product, onSave, onClose }: ProductFormDialogProps) {
  const [formData, setFormData] = useState<Product>(
    product || {
      id: '',
      name: '',
      nameEn: '',
      hsCode: '',
      quantity: 0,
      unit: '件',
      unitPrice: 0,
      totalAmount: 0,
      taxRate: 13,
      requiresInspection: false,
      declarationElements: '',
      material: '',
      usage: '',
      brand: '',
      model: ''
    }
  );

  const handleChange = (field: keyof Product, value: any) => {
    const newData = { ...formData, [field]: value };
    
    // 自动计算总金额
    if (field === 'quantity' || field === 'unitPrice') {
      newData.totalAmount = newData.quantity * newData.unitPrice;
    }
    
    setFormData(newData);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.hsCode || !formData.quantity) {
      toast.error('请填写必填字段');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{product ? '编辑产品' : '添加产品'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">产品名称（中文） *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-8 mt-1 text-xs"
                placeholder="不锈钢水龙头"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">产品名称（英文） *</Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                className="h-8 mt-1 text-xs"
                placeholder="Stainless Steel Faucet"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 flex items-center gap-2">
                HS编码 *
                <a
                  href="https://www.hs-bianma.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Search className="w-3 h-3" />
                  <span className="text-xs">查询</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </Label>
              <Input
                value={formData.hsCode}
                onChange={(e) => handleChange('hsCode', e.target.value)}
                className="h-8 mt-1 text-xs font-mono"
                placeholder="8481.80.9000"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">数量 *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  className="h-8 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">单位 *</Label>
                <Select value={formData.unit} onValueChange={(v) => handleChange('unit', v)}>
                  <SelectTrigger className="h-8 mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="件">件</SelectItem>
                    <SelectItem value="个">个</SelectItem>
                    <SelectItem value="套">套</SelectItem>
                    <SelectItem value="台">台</SelectItem>
                    <SelectItem value="箱">箱</SelectItem>
                    <SelectItem value="kg">千克</SelectItem>
                    <SelectItem value="m">米</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">单价 (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                  className="h-8 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">总金额 (USD)</Label>
                <Input
                  value={formData.totalAmount.toFixed(2)}
                  disabled
                  className="h-8 mt-1 text-xs bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 flex items-center gap-2">
                退税率 (%)
                <Info className="w-3 h-3 text-gray-400" />
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                className="h-8 mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 flex items-center gap-2">
                是否需要商检
                <Info className="w-3 h-3 text-gray-400" />
              </Label>
              <Select
                value={formData.requiresInspection ? 'yes' : 'no'}
                onValueChange={(v) => handleChange('requiresInspection', v === 'yes')}
              >
                <SelectTrigger className="h-8 mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">不需要</SelectItem>
                  <SelectItem value="yes">需要</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">材质</Label>
              <Input
                value={formData.material}
                onChange={(e) => handleChange('material', e.target.value)}
                className="h-8 mt-1 text-xs"
                placeholder="304不锈钢"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">用途</Label>
              <Input
                value={formData.usage}
                onChange={(e) => handleChange('usage', e.target.value)}
                className="h-8 mt-1 text-xs"
                placeholder="厨房水槽用"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">品牌</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="h-8 mt-1 text-xs"
                  placeholder="COSUN"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">型号</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="h-8 mt-1 text-xs"
                  placeholder="CS-F-8800"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">报关要素</Label>
              <Textarea
                value={formData.declarationElements}
                onChange={(e) => handleChange('declarationElements', e.target.value)}
                rows={2}
                className="resize-none text-xs mt-1"
                placeholder="品名|用途|材质|品牌|型号"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
            <Save className="w-3 h-3 mr-1" />
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
