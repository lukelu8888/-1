import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Search, Building2, Package, Send, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useXJs } from '../../contexts/XJContext';
import { useQuotationRequests } from '../../contexts/QuotationRequestContext';
import { generateDocumentNumber, type RegionType } from '../../utils/xjNumberGenerator';

/**
 * 📋 产品-供应商分发选择器
 * 
 * 核心功能：
 * 1. 显示QR的所有产品列表（左侧）
 * 2. 显示所有可选供应商列表（右侧）
 * 3. 产品-供应商矩阵勾选（每个产品可选多个供应商）
 * 4. 按供应商维度汇总生成XJ(采购询价)（一个供应商=一个XJ，包含多个产品）
 * 
 * 业务场景：
 * - 场景1：产品A→供应商X，产品B→供应商Y（不同产品给不同供应商）
 * - 场景2：产品A→供应商X和Y（同一产品给多个供应商对比价格）
 * - 场景3：产品A→供应商X和Y，产品B→供应商Y和Z（灵活组合）
 */

interface Product {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
}

interface QuotationRequest {
  id: string;
  requestNumber: string; // QR-NA-251217-9365
  sourceInquiryId: string;
  sourceInquiryNumber: string;
  customerName: string;
  region: string;
  items: Product[];
  expectedQuoteDate?: string;
  requiredDate?: string;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string[];
  rating: number;
  isPreferred: boolean;
}

interface ProductSupplierDistributionDialogProps {
  open: boolean;
  onClose: () => void;
  quotationRequest: QuotationRequest | null;
}

// 🔥 模拟供应商数据
const mockSuppliers: Supplier[] = [
  {
    id: 'sup_001',
    code: 'SUP-A-001',
    name: '深圳市华强电子有限公司',
    contact: '张经理',
    email: 'supplier_a@test.com',
    phone: '+86 755 8888 0001',
    category: ['电气', '照明'],
    rating: 4.8,
    isPreferred: true
  },
  {
    id: 'sup_002',
    code: 'SUP-B-001',
    name: '佛山市鑫达卫浴制造厂',
    contact: '李总',
    email: 'supplier_xinda@test.com',
    phone: '+86 757 8888 0002',
    category: ['卫浴', '水暖'],
    rating: 4.9,
    isPreferred: true
  },
  {
    id: 'sup_003',
    code: 'SUP-C-001',
    name: '东莞市精工五金制造厂',
    contact: '王经理',
    email: 'supplier_jinggong@test.com',
    phone: '+86 769 8888 0003',
    category: ['五金', '门窗配件'],
    rating: 4.6,
    isPreferred: false
  },
  {
    id: 'sup_004',
    code: 'SUP-D-001',
    name: '广州市优质劳保用品公司',
    contact: '陈主管',
    email: 'supplier_laobao@test.com',
    phone: '+86 20 8888 0004',
    category: ['劳保用品', '安全防护'],
    rating: 4.5,
    isPreferred: false
  },
  {
    id: 'sup_005',
    code: 'SUP-E-001',
    name: '中山市照明电器制造厂',
    contact: '林总监',
    email: 'supplier_lighting@test.com',
    phone: '+86 760 8888 0005',
    category: ['电气', '照明', 'LED'],
    rating: 4.7,
    isPreferred: true
  }
];

export function ProductSupplierDistributionDialog({
  open,
  onClose,
  quotationRequest
}: ProductSupplierDistributionDialogProps) {
  const { addXJ } = useXJs();
  const { updateQuotationRequest } = useQuotationRequests();
  
  // 🔥 产品-供应商分配矩阵：{ productId: [supplierId1, supplierId2, ...] }
  const [productSupplierMatrix, setProductSupplierMatrix] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // 过滤供应商
  const filteredSuppliers = mockSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 优先显示首选供应商
  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      return b.rating - a.rating;
    });
  }, [filteredSuppliers]);

  // 切换产品-供应商关联
  const toggleProductSupplier = (productId: string, supplierId: string) => {
    setProductSupplierMatrix(prev => {
      const currentSuppliers = prev[productId] || [];
      const newSuppliers = currentSuppliers.includes(supplierId)
        ? currentSuppliers.filter(id => id !== supplierId)
        : [...currentSuppliers, supplierId];
      
      return {
        ...prev,
        [productId]: newSuppliers
      };
    });
  };

  // 为单个产品选择所有供应商
  const toggleAllSuppliersForProduct = (productId: string) => {
    const currentSuppliers = productSupplierMatrix[productId] || [];
    if (currentSuppliers.length === sortedSuppliers.length) {
      // 取消全选
      setProductSupplierMatrix(prev => ({
        ...prev,
        [productId]: []
      }));
    } else {
      // 全选
      setProductSupplierMatrix(prev => ({
        ...prev,
        [productId]: sortedSuppliers.map(s => s.id)
      }));
    }
  };

  // 为单个供应商选择所有产品
  const toggleAllProductsForSupplier = (supplierId: string) => {
    const products = quotationRequest?.items || [];
    const allSelected = products.every(product => 
      (productSupplierMatrix[product.id] || []).includes(supplierId)
    );

    if (allSelected) {
      // 取消全选：移除该供应商
      setProductSupplierMatrix(prev => {
        const newMatrix = { ...prev };
        products.forEach(product => {
          newMatrix[product.id] = (newMatrix[product.id] || []).filter(id => id !== supplierId);
        });
        return newMatrix;
      });
    } else {
      // 全选：添加该供应商
      setProductSupplierMatrix(prev => {
        const newMatrix = { ...prev };
        products.forEach(product => {
          const currentSuppliers = newMatrix[product.id] || [];
          if (!currentSuppliers.includes(supplierId)) {
            newMatrix[product.id] = [...currentSuppliers, supplierId];
          }
        });
        return newMatrix;
      });
    }
  };

  // 计算统计信息
  const statistics = useMemo(() => {
    const products = quotationRequest?.items || [];
    const assignedProducts = products.filter(p => (productSupplierMatrix[p.id] || []).length > 0);
    
    // 按供应商分组统计
    const supplierGroups: Record<string, { supplier: Supplier; products: Product[] }> = {};
    
    Object.entries(productSupplierMatrix).forEach(([productId, supplierIds]) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      supplierIds.forEach(supplierId => {
        const supplier = mockSuppliers.find(s => s.id === supplierId);
        if (!supplier) return;
        
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = {
            supplier,
            products: []
          };
        }
        supplierGroups[supplierId].products.push(product);
      });
    });
    
    return {
      totalProducts: products.length,
      assignedProducts: assignedProducts.length,
      unassignedProducts: products.length - assignedProducts.length,
      totalXJs: Object.keys(supplierGroups).length,
      supplierGroups
    };
  }, [quotationRequest, productSupplierMatrix]);

  // 生成XJ编号
  const generateXJNumber = (region: string): string => {
    const safeRegion: RegionType =
      region === 'North America' ? 'North America'
      : region === 'South America' ? 'South America'
      : region === 'Europe & Africa' ? 'Europe & Africa'
      : 'North America';
    return generateDocumentNumber('XJ', safeRegion);
  };

  // 提交：按供应商维度创建XJ
  const handleSubmit = () => {
    if (!quotationRequest) return;

    if (statistics.totalXJs === 0) {
      toast.error('请至少为一个产品分配供应商');
      return;
    }

    if (statistics.unassignedProducts > 0) {
      const confirm = window.confirm(
        `还有 ${statistics.unassignedProducts} 个产品未分配供应商，是否继续？`
      );
      if (!confirm) return;
    }

    setLoading(true);

    try {
      // 🔥 按供应商维度创建XJ
      Object.entries(statistics.supplierGroups).forEach(([supplierId, group]) => {
        const xjNumber = generateXJNumber(quotationRequest.region);
        
        addXJ({
          id: `rfq_${Date.now()}_${supplierId}_${Math.random()}`,
          xjNumber,
          
          // 🔥 关联原始QR编号
          sourceQRNumber: quotationRequest.requestNumber,
          sourceInquiryId: quotationRequest.sourceInquiryId,
          sourceInquiryNumber: quotationRequest.sourceInquiryNumber,
          
          // 🔥 供应商信息
          supplierCode: group.supplier.email,
          supplierName: group.supplier.name,
          supplierContact: group.supplier.contact,
          supplierEmail: group.supplier.email,
          
          // 🔥 产品列表（多个产品）
          products: group.products.map(p => ({
            id: p.id,
            productName: p.productName,
            modelNo: p.modelNo,
            specification: p.specification || '',
            quantity: p.quantity,
            unit: p.unit,
            targetPrice: p.targetPrice,
            currency: p.currency
          })),
          
          // 保留旧字段以兼容（使用第一个产品的信息）
          productName: group.products[0].productName,
          modelNo: group.products[0].modelNo,
          quantity: group.products.reduce((sum, p) => sum + p.quantity, 0),
          unit: group.products[0].unit,
          
          // 🔥 状态信息
          status: 'pending',
          priority: 'medium',
          
          // 🔥 日期信息
          expectedDate: quotationRequest.expectedQuoteDate || quotationRequest.requiredDate || '',
          createdBy: 'admin@cosun.com',
          createdDate: new Date().toISOString().split('T')[0],
          dueDate: quotationRequest.expectedQuoteDate || quotationRequest.requiredDate || '',
          
          // 🔥 备注
          remarks: `来自采购需求 ${quotationRequest.requestNumber}，包含 ${group.products.length} 个产品`,
          
          quotes: []
        });
      });

      // 🔥 更新QuotationRequest的rfqCount
      updateQuotationRequest(quotationRequest.id, {
        xjCount: statistics.totalXJs,
        status: 'processing'
      });

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">✅ 询价已成功发送！</p>
          <p className="text-sm">
            生成 {statistics.totalXJs} 个采购询价(XJ)，覆盖 {statistics.assignedProducts} 个产品
          </p>
        </div>,
        { duration: 4000 }
      );

      // 重置并关闭
      setProductSupplierMatrix({});
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('创建XJ失败:', error);
      toast.error('发送询价失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!quotationRequest) return null;

  const products = quotationRequest.items || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-600" />
            产品-供应商分发选择器
          </DialogTitle>
          <DialogDescription>
            为每个产品选择供应商，系统将按供应商维度生成采购询价(XJ)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* QR信息 */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">采购需求编号</p>
                  <p className="font-semibold text-orange-600">{quotationRequest.requestNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">来源询价单</p>
                  <p className="font-semibold">{quotationRequest.sourceInquiryNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">产品数量</p>
                  <p className="font-semibold">{products.length} 个产品</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">区域</p>
                  <p className="font-semibold">{quotationRequest.region}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">待分配产品</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.unassignedProducts}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">已分配产品</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.assignedProducts}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">总产品数</p>
                    <p className="text-2xl font-bold text-purple-600">{statistics.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">将生成XJ</p>
                    <p className="text-2xl font-bold text-orange-600">{statistics.totalXJs}</p>
                  </div>
                  <Send className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 搜索供应商 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索供应商名称、编号或类别..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 产品-供应商矩阵表格 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold min-w-[200px] sticky left-0 bg-slate-50 z-10">
                      产品信息
                      <div className="text-xs font-normal text-slate-500 mt-0.5">
                        {products.length} 个产品
                      </div>
                    </th>
                    {sortedSuppliers.map((supplier) => {
                      const allSelected = products.every(product =>
                        (productSupplierMatrix[product.id] || []).includes(supplier.id)
                      );
                      const someSelected = products.some(product =>
                        (productSupplierMatrix[product.id] || []).includes(supplier.id)
                      );
                      
                      return (
                        <th key={supplier.id} className="p-3 min-w-[120px] border-l">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Building2 className="w-3 h-3" />
                                <span className="font-semibold">{supplier.name}</span>
                                {supplier.isPreferred && (
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                )}
                              </div>
                              <div className="text-xs font-normal text-slate-500">
                                {supplier.code}
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                <span className="text-xs">{supplier.rating}</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={allSelected ? "default" : "outline"}
                              className="h-7 text-xs w-full"
                              onClick={() => toggleAllProductsForSupplier(supplier.id)}
                            >
                              {allSelected ? '取消全选' : someSelected ? '全选' : '全选'}
                            </Button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const selectedSupplierIds = productSupplierMatrix[product.id] || [];
                    const allSelected = selectedSupplierIds.length === sortedSuppliers.length;
                    
                    return (
                      <tr key={product.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="p-3 sticky left-0 bg-inherit z-10 border-r">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 truncate">
                                {product.productName}
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5">
                                型号: {product.modelNo}
                              </div>
                              <div className="text-xs text-slate-600">
                                数量: {product.quantity} {product.unit}
                              </div>
                              {selectedSupplierIds.length > 0 && (
                                <Badge variant="outline" className="mt-1 text-xs bg-green-50 border-green-300 text-green-700">
                                  已选 {selectedSupplierIds.length} 个供应商
                                </Badge>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={allSelected ? "default" : "outline"}
                              className="h-7 text-xs flex-shrink-0"
                              onClick={() => toggleAllSuppliersForProduct(product.id)}
                            >
                              {allSelected ? '取消' : '全选'}
                            </Button>
                          </div>
                        </td>
                        {sortedSuppliers.map((supplier) => {
                          const isSelected = selectedSupplierIds.includes(supplier.id);
                          
                          return (
                            <td
                              key={supplier.id}
                              className={`p-3 text-center border-l cursor-pointer transition-colors ${
                                isSelected ? 'bg-orange-100' : 'hover:bg-slate-100'
                              }`}
                              onClick={() => toggleProductSupplier(product.id, supplier.id)}
                            >
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleProductSupplier(product.id, supplier.id)}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* XJ预览 */}
          {statistics.totalXJs > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">
                      将生成 {statistics.totalXJs} 个采购询价(XJ)
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(statistics.supplierGroups).map(([supplierId, group]) => (
                      <div key={supplierId} className="bg-white border border-green-200 rounded p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-slate-600" />
                              <span className="font-medium">{group.supplier.name}</span>
                            </div>
                            <div className="text-xs text-slate-600 ml-6">
                              包含 {group.products.length} 个产品：
                              {group.products.map(p => p.productName).join('、')}
                            </div>
                          </div>
                          <Badge className="bg-orange-500">1 XJ</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-600">
              {statistics.totalXJs > 0 ? (
                <span className="text-green-700 font-medium">
                  ✓ 准备发送 <strong className="text-orange-600">{statistics.totalXJs}</strong> 个采购询价(XJ)
                </span>
              ) : (
                <span className="text-slate-500">请至少为一个产品分配供应商</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={statistics.totalXJs === 0 || loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? '发送中...' : `发送询价 (${statistics.totalXJs})`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}