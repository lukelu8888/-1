import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
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
  Save,
  Edit3,
  Plus,
  Search,
  ExternalLink,
  Package,
  FileCheck,
  DollarSign,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileIcon,
  Printer,
  Send,
  Archive,
  ChevronRight
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
  taxRate: number;
  requiresInspection: boolean;
  declarationElements: string;
  material?: string;
  usage?: string;
  brand?: string;
  model?: string;
}

// 单证包
interface DocumentPackage {
  id: string;
  contractNo: string;
  customerName: string;
  shipmentNo?: string;
  status: 'draft' | 'completed' | 'sent' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  products: Product[];
  documents: {
    ci: { generated: boolean; url?: string; generatedAt?: string };
    pl: { generated: boolean; url?: string; generatedAt?: string };
    co: { generated: boolean; url?: string; generatedAt?: string };
    customsDeclaration: { generated: boolean; url?: string; generatedAt?: string };
  };
  declarationInfo: {
    declarationNo?: string;
    customsBroker?: string;
    declaredValue?: number;
  };
}

// ==================== 主组件 ====================

export default function DocumentsManagementCenter() {
  const [packages, setPackages] = useState<DocumentPackage[]>([
    {
      id: 'DOC001',
      contractNo: 'CT-NA-2024-089',
      customerName: 'ABC Trading Ltd.',
      shipmentNo: 'COSUN-SH-2024-001',
      status: 'completed',
      createdAt: '2024-11-15',
      updatedAt: '2024-11-20',
      createdBy: '张三',
      products: [
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
        },
        {
          id: '2',
          name: '淋浴花洒套装',
          nameEn: 'Shower Head Set',
          hsCode: '8481.80.1100',
          quantity: 500,
          unit: '套',
          unitPrice: 48.00,
          totalAmount: 24000,
          taxRate: 13,
          requiresInspection: false,
          declarationElements: '品名|用途|材质|品牌|型号',
          material: '铜合金+ABS塑料',
          usage: '浴室淋浴用',
          brand: 'COSUN',
          model: 'CS-SH-6600'
        }
      ],
      documents: {
        ci: { generated: true, url: '#', generatedAt: '2024-11-18' },
        pl: { generated: true, url: '#', generatedAt: '2024-11-18' },
        co: { generated: true, url: '#', generatedAt: '2024-11-19' },
        customsDeclaration: { generated: false }
      },
      declarationInfo: {
        declarationNo: '520020240001234',
        customsBroker: '厦门国际报关行',
        declaredValue: 49500
      }
    },
    {
      id: 'DOC002',
      contractNo: 'CT-EU-2024-156',
      customerName: 'European Import GmbH',
      shipmentNo: 'COSUN-SH-2024-002',
      status: 'completed',
      createdAt: '2024-10-10',
      updatedAt: '2024-10-15',
      createdBy: '李四',
      products: [
        {
          id: '3',
          name: '门锁五金套件',
          nameEn: 'Door Lock Hardware Kit',
          hsCode: '8301.40.0000',
          quantity: 2000,
          unit: '套',
          unitPrice: 15.80,
          totalAmount: 31600,
          taxRate: 13,
          requiresInspection: true,
          declarationElements: '品名|用途|材质|品牌',
          material: '锌合金',
          usage: '门窗用',
          brand: 'COSUN'
        }
      ],
      documents: {
        ci: { generated: true, url: '#', generatedAt: '2024-10-12' },
        pl: { generated: true, url: '#', generatedAt: '2024-10-12' },
        co: { generated: true, url: '#', generatedAt: '2024-10-13' },
        customsDeclaration: { generated: true, url: '#', generatedAt: '2024-10-14' }
      },
      declarationInfo: {
        declarationNo: '520020240005678',
        customsBroker: '上海浦东报关行',
        declaredValue: 31600
      }
    }
  ]);

  const [selectedPackage, setSelectedPackage] = useState<DocumentPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 筛选
  const filteredPackages = packages.filter(pkg => {
    const matchSearch = pkg.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       pkg.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || pkg.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 统计
  const stats = {
    total: packages.length,
    draft: packages.filter(p => p.status === 'draft').length,
    completed: packages.filter(p => p.status === 'completed').length,
    sent: packages.filter(p => p.status === 'sent').length,
    archived: packages.filter(p => p.status === 'archived').length
  };

  // 生成文件
  const handleGenerateDocument = (pkgId: string, docType: 'ci' | 'pl' | 'co' | 'customsDeclaration') => {
    setPackages(packages.map(pkg => {
      if (pkg.id === pkgId) {
        return {
          ...pkg,
          documents: {
            ...pkg.documents,
            [docType]: {
              generated: true,
              url: '#',
              generatedAt: new Date().toISOString().split('T')[0]
            }
          },
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return pkg;
    }));
    const docNames = {
      ci: '商业发票(CI)',
      pl: '装箱单(PL)',
      co: '原产地证(CO)',
      customsDeclaration: '报关单'
    };
    toast.success(`${docNames[docType]} 生成成功`);
  };

  // 添加/编辑产品
  const handleSaveProduct = (product: Product) => {
    if (!selectedPackage) return;
    
    const updatedProducts = editingProduct
      ? selectedPackage.products.map(p => p.id === product.id ? product : p)
      : [...selectedPackage.products, { ...product, id: Date.now().toString() }];
    
    setSelectedPackage({
      ...selectedPackage,
      products: updatedProducts
    });
    
    setPackages(packages.map(pkg => 
      pkg.id === selectedPackage.id 
        ? { ...pkg, products: updatedProducts, updatedAt: new Date().toISOString().split('T')[0] }
        : pkg
    ));
    
    setShowProductForm(false);
    setEditingProduct(null);
    toast.success(editingProduct ? '产品已更新' : '产品已添加');
  };

  // 删除产品
  const handleDeleteProduct = (productId: string) => {
    if (!selectedPackage) return;
    
    const updatedProducts = selectedPackage.products.filter(p => p.id !== productId);
    setSelectedPackage({
      ...selectedPackage,
      products: updatedProducts
    });
    
    setPackages(packages.map(pkg => 
      pkg.id === selectedPackage.id 
        ? { ...pkg, products: updatedProducts, updatedAt: new Date().toISOString().split('T')[0] }
        : pkg
    ));
    
    toast.success('产品已删除');
  };

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      draft: { label: '草稿', color: 'gray', icon: Edit3 },
      completed: { label: '已完成', color: 'green', icon: CheckCircle2 },
      sent: { label: '已发送', color: 'blue', icon: Send },
      archived: { label: '已归档', color: 'purple', icon: Archive }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.draft;
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">单证制作中心</h1>
          <p className="text-sm text-gray-500 mt-1">管理产品清单、制作报关单证、维护HS编码</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1.5" />
          新建单证包
        </Button>
      </div>

      {/* KPI统计 */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '全部', value: stats.total, color: 'blue', icon: FileText },
          { label: '草稿', value: stats.draft, color: 'gray', icon: Edit3 },
          { label: '已完成', value: stats.completed, color: 'green', icon: CheckCircle2 },
          { label: '已发送', value: stats.sent, color: 'blue', icon: Send },
          { label: '已归档', value: stats.archived, color: 'purple', icon: Archive }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-gray-200">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full bg-${stat.color}-50 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 筛选工具栏 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索合同编号或客户名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="sent">已发送</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="w-4 h-4 mr-1.5" />
          导出
        </Button>
      </div>

      {/* 单证包列表 */}
      <Card>
        <CardHeader className="py-2 px-3 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-700">单证包列表</h3>
            <Badge variant="secondary" className="text-xs">{filteredPackages.length} 个单证包</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">合同编号</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">客户名称</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">产品数量</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">申报金额</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">单证完成度</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">状态</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">更新时间</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPackages.map((pkg) => {
                  const totalAmount = pkg.products.reduce((sum, p) => sum + p.totalAmount, 0);
                  const docsCount = Object.values(pkg.documents).filter(d => d.generated).length;
                  const totalDocs = 4;
                  const statusDisplay = getStatusDisplay(pkg.status);
                  const StatusIcon = statusDisplay.icon;

                  return (
                    <tr
                      key={pkg.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <td className="py-2 px-3">
                        <p className="text-xs font-medium text-blue-600 hover:underline">{pkg.contractNo}</p>
                      </td>
                      <td className="py-2 px-3">
                        <p className="text-xs text-gray-900">{pkg.customerName}</p>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">
                          {pkg.products.length} 个产品
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <p className="text-xs font-semibold text-gray-900">USD {totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-24">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${(docsCount / totalDocs) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{docsCount}/{totalDocs}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className={`bg-${statusDisplay.color}-50 text-${statusDisplay.color}-700 border-${statusDisplay.color}-200 text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusDisplay.label}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <p className="text-xs text-gray-600">{pkg.updatedAt}</p>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPackage(pkg);
                            }}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            title="更多操作"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 单证详情弹窗 */}
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="max-w-[1600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-gray-200 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-base font-medium text-gray-900">
                  单证包详情
                </DialogTitle>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500">{selectedPackage?.contractNo}</span>
                {selectedPackage && (
                  <Badge variant="outline" className={`bg-${getStatusDisplay(selectedPackage.status).color}-50 text-${getStatusDisplay(selectedPackage.status).color}-700 border-${getStatusDisplay(selectedPackage.status).color}-200 text-xs`}>
                    {getStatusDisplay(selectedPackage.status).label}
                  </Badge>
                )}
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

          {selectedPackage && (
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="products" className="h-full">
                <div className="border-b border-gray-200 px-4">
                  <TabsList className="h-9">
                    <TabsTrigger value="products" className="text-xs">
                      <Package className="w-3.5 h-3.5 mr-1.5" />
                      产品清单
                      <Badge variant="secondary" className="ml-1.5 text-xs">{selectedPackage.products.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs">
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      单证生成
                    </TabsTrigger>
                    <TabsTrigger value="declaration" className="text-xs">
                      <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                      报关信息
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* 产品清单 */}
                <TabsContent value="products" className="p-4 space-y-3 mt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-gray-900">产品清单</h3>
                      <Badge variant="outline" className="text-xs">共 {selectedPackage.products.length} 个产品</Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        总金额: USD {selectedPackage.products.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
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
                        {selectedPackage.products.map((product) => (
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
                                  onClick={(e) => e.stopPropagation()}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProduct(product.id);
                                    }}
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
                </TabsContent>

                {/* 单证生成 */}
                <TabsContent value="documents" className="p-4 space-y-3 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'ci' as const, name: '商业发票', nameEn: 'Commercial Invoice', icon: FileText },
                      { key: 'pl' as const, name: '装箱单', nameEn: 'Packing List', icon: Package },
                      { key: 'co' as const, name: '原产地证', nameEn: 'Certificate of Origin', icon: FileCheck },
                      { key: 'customsDeclaration' as const, name: '报关单', nameEn: 'Customs Declaration', icon: FileIcon }
                    ].map((doc) => {
                      const Icon = doc.icon;
                      const docInfo = selectedPackage.documents[doc.key];
                      return (
                        <Card key={doc.key} className="border border-gray-200">
                          <CardHeader className="py-3 px-4 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-gray-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-xs text-gray-500">{doc.nameEn}</p>
                                </div>
                              </div>
                              {docInfo.generated ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 px-4">
                            {docInfo.generated ? (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600">生成时间：{docInfo.generatedAt}</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                                    <Eye className="w-3 h-3 mr-1" />
                                    预览
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                                    <Download className="w-3 h-3 mr-1" />
                                    下载
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                                    <Printer className="w-3 h-3 mr-1" />
                                    打印
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleGenerateDocument(selectedPackage.id, doc.key)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                生成文件
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* 报关信息 */}
                <TabsContent value="declaration" className="p-4 space-y-3 mt-0">
                  <Card className="border border-gray-200">
                    <CardHeader className="py-2 px-3 border-b bg-gray-50">
                      <h4 className="text-xs font-medium text-gray-700">报关基本信息</h4>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">报关单号</Label>
                          <p className="text-xs text-gray-900 mt-1">{selectedPackage.declarationInfo.declarationNo || '未填写'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">报关行</Label>
                          <p className="text-xs text-gray-900 mt-1">{selectedPackage.declarationInfo.customsBroker || '未填写'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">申报金额</Label>
                          <p className="text-xs font-semibold text-gray-900 mt-1">
                            USD {selectedPackage.declarationInfo.declaredValue?.toLocaleString() || selectedPackage.products.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 产品表单弹窗 */}
      {showProductForm && selectedPackage && (
        <ProductFormDialog
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
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
          <DialogDescription>填写产品信息以添加或更新产品清单。</DialogDescription>
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