import React, { useState } from 'react';
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
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Building2, Mail, Phone, Star, Send, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRFQs } from '../../contexts/RFQContext';

/**
 * 📋 从客户询价创建供应商RFQ对话框
 * 
 * 业务流程：
 * 1. 客户询价（Inquiry）→ 业务员接收
 * 2. 采购员基于客户询价，向多个供应商询价
 * 3. 每个产品可以向多个供应商询价
 * 4. 即使同一个产品，也要向不同供应商询价以获取最优价格
 * 
 * 例如：
 * - 客户询价单包含：产品A、产品B、产品C
 * - 产品A → 向供应商1、2、3询价（创建3个RFQ）
 * - 产品B → 向供应商4、5、6询价（创建3个RFQ）
 * - 产品C → 向供应商7、8、9询价（创建3个RFQ）
 * - 总共创建9个RFQ
 */

// 🔥 供应商接口
interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string[];
  rating: number;
  leadTime: string;
  moq: string;
  isPreferred: boolean;
}

// 🔥 客户询价单产品项
interface InquiryItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
  remarks?: string;
}

// 🔥 客户询价单接口
interface Inquiry {
  id: string;
  inquiryNumber: string;
  customerName: string;
  customerEmail: string;
  region: string;
  items: InquiryItem[];
  expectedDate: string;
  createdDate: string;
  assignedTo?: string;
}

interface CreateRFQFromInquiryDialogProps {
  open: boolean;
  onClose: () => void;
  inquiry: Inquiry | null;
}

// 🔥 模拟供应商数据（后续可以从Context或API获取）
const mockSuppliers: Supplier[] = [
  {
    id: 'sup_001',
    code: 'SUP-A-001',
    name: '深圳市华强电子有限公司',
    contact: '张经理',
    email: 'zhang', // 🔥 修改为匹配供应商测试账户
    phone: '+86 755 8888 0001',
    address: '深圳市福田区华强北路1号',
    category: ['电气', '照明'],
    rating: 4.8,
    leadTime: '30天',
    moq: '500个',
    isPreferred: true
  },
  {
    id: 'sup_002',
    code: 'SUP-B-001',
    name: '广州市优质五金制造厂',
    contact: '李总',
    email: 'supplier_b@test.com', // 🔥 已更新
    phone: '+86 20 8888 0002',
    address: '广州市番禺区工业园区',
    category: ['五金', '门窗配件'],
    rating: 4.6,
    leadTime: '25天',
    moq: '1000个',
    isPreferred: true
  },
  {
    id: 'sup_003',
    code: 'SUP-C-001',
    name: '东莞市精工卫浴科技公司',
    contact: '王经理',
    email: 'supplier_c@test.com', // 🔥 已更新
    phone: '+86 769 8888 0003',
    address: '东莞市长安镇科技园',
    category: ['卫浴', '水暖'],
    rating: 4.9,
    leadTime: '35天',
    moq: '300个',
    isPreferred: false
  },
  {
    id: 'sup_004',
    code: 'SUP-D-001',
    name: '佛山市安全劳保用品有限公司',
    contact: '陈主管',
    email: 'supplier_d@test.com', // 🔥 已更新
    phone: '+86 757 8888 0004',
    address: '佛山市南海区工业大道',
    category: ['劳保用品', '安全防护'],
    rating: 4.5,
    leadTime: '20天',
    moq: '2000个',
    isPreferred: false
  },
  {
    id: 'sup_005',
    code: 'SUP-E-001',
    name: '中山市照明电器制造厂',
    contact: '林总监',
    email: 'supplier_e@test.com', // 🔥 已更新
    phone: '+86 760 8888 0005',
    address: '中山市古镇镇灯饰大道',
    category: ['电气', '照明', 'LED'],
    rating: 4.7,
    leadTime: '28天',
    moq: '800个',
    isPreferred: true
  },
  {
    id: 'sup_006',
    code: 'SUP-F-001',
    name: '温州市五金配件集团',
    contact: '赵董',
    email: 'supplier_f@test.com', // 🔥 已更新
    phone: '+86 577 8888 0006',
    address: '温州市龙湾区工业园',
    category: ['五金', '门窗配件', '建材'],
    rating: 4.6,
    leadTime: '32天',
    moq: '600个',
    isPreferred: true
  },
  {
    id: 'sup_007',
    code: 'SUP-G-001',
    name: '宁波市电气设备公司',
    contact: '孙经理',
    email: 'supplier_g@test.com', // 🔥 已更新
    phone: '+86 574 8888 0007',
    address: '宁波市鄞州区科技园',
    category: ['电气', '开关插座'],
    rating: 4.4,
    leadTime: '27天',
    moq: '1500个',
    isPreferred: false
  },
  {
    id: 'sup_008',
    code: 'SUP-H-001',
    name: '杭州市智能家居有限公司',
    contact: '周总',
    email: 'supplier_h@test.com', // 🔥 已更新
    phone: '+86 571 8888 0008',
    address: '杭州市滨江区高新园区',
    category: ['电气', '智能设备'],
    rating: 4.9,
    leadTime: '35天',
    moq: '400个',
    isPreferred: true
  }
];

export function CreateRFQFromInquiryDialog({ open, onClose, inquiry }: CreateRFQFromInquiryDialogProps) {
  const { addRFQ } = useRFQs();
  
  // 🔥 每个产品对应的选中供应商
  // 数据结构：{ [productId]: [supplierId1, supplierId2, ...] }
  const [selectedSuppliersByProduct, setSelectedSuppliersByProduct] = useState<Record<string, string[]>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [quotationDeadline, setQuotationDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  // 过滤供应商
  const filteredSuppliers = mockSuppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 优先显示首选供应商
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    return b.rating - a.rating;
  });

  // 获取当前产品
  const currentProduct = inquiry?.items[currentProductIndex];

  // 切换供应商选择
  const toggleSupplier = (productId: string, supplierId: string) => {
    setSelectedSuppliersByProduct(prev => {
      const currentSelected = prev[productId] || [];
      const isSelected = currentSelected.includes(supplierId);
      
      return {
        ...prev,
        [productId]: isSelected
          ? currentSelected.filter(id => id !== supplierId)
          : [...currentSelected, supplierId]
      };
    });
  };

  // 全选/取消全选当前产品的供应商
  const toggleSelectAllForProduct = (productId: string) => {
    const currentSelected = selectedSuppliersByProduct[productId] || [];
    
    if (currentSelected.length === sortedSuppliers.length) {
      setSelectedSuppliersByProduct(prev => ({
        ...prev,
        [productId]: []
      }));
    } else {
      setSelectedSuppliersByProduct(prev => ({
        ...prev,
        [productId]: sortedSuppliers.map(s => s.id)
      }));
    }
  };

  // 计算总RFQ数量
  const totalRFQCount = Object.values(selectedSuppliersByProduct).reduce(
    (sum, suppliers) => sum + suppliers.length,
    0
  );

  // 提交创建RFQ
  const handleSubmit = () => {
    if (!inquiry) return;
    
    if (totalRFQCount === 0) {
      toast.error('请至少为一个产品选择一个供应商');
      return;
    }

    if (!quotationDeadline) {
      toast.error('请设置报价截止日期');
      return;
    }

    setLoading(true);

    try {
      let rfqCount = 0;

      // 🔥 为每个产品的每个供应商创建独立的RFQ
      inquiry.items.forEach(item => {
        const selectedSuppliers = selectedSuppliersByProduct[item.id] || [];
        
        selectedSuppliers.forEach(supplierId => {
          const supplier = mockSuppliers.find(s => s.id === supplierId);
          if (!supplier) return;

          const rfqNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          
          addRFQ({
            id: `rfq_${Date.now()}_${supplierId}_${item.id}`,
            rfqNumber,
            
            // 🔥 关联客户询价单
            sourceInquiryId: inquiry.id,
            sourceInquiryNumber: inquiry.inquiryNumber,
            customerName: inquiry.customerName,
            
            // 🔥 产品信息（单个产品）
            productName: item.productName,
            modelNo: item.modelNo,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            targetPrice: item.targetPrice,
            currency: item.currency,
            
            // 🔥 供应商信息（单个供应商）
            supplierCode: supplier.email,
            supplierName: supplier.name,
            supplierContact: supplier.contact,
            supplierEmail: supplier.email,
            
            // 🔥 询价参数
            expectedDate: inquiry.expectedDate,
            quotationDeadline: quotationDeadline,
            
            // 🔥 状态信息
            status: 'pending',
            priority: 'medium',
            
            // 🔥 其他信息
            remarks: item.remarks || `来自客户询价 ${inquiry.inquiryNumber}`,
            createdBy: 'procurement@cosun.com',
            createdDate: new Date().toISOString().split('T')[0],
            dueDate: quotationDeadline,
            
            quotes: []
          });

          rfqCount++;
        });
      });

      toast.success(
        `✅ 询价单已创建！`,
        {
          description: `已创建 ${rfqCount} 个供应商询价单（RFQ）`
        }
      );

      // 重置表单
      setSelectedSuppliersByProduct({});
      setQuotationDeadline('');
      setSearchTerm('');
      setCurrentProductIndex(0);
      
      onClose();
    } catch (error) {
      console.error('创建RFQ失败:', error);
      toast.error('创建询价单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!inquiry) return null;

  const currentSelectedSuppliers = selectedSuppliersByProduct[currentProduct?.id || ''] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-600" />
            创建供应商询价单 - 从客户询价
          </DialogTitle>
          <DialogDescription>
            为客户询价单的每个产品选择供应商，系统将自动创建对应的RFQ
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* 客户询价信息 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">客户询价号</p>
                  <p className="font-semibold text-blue-600">{inquiry.inquiryNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">客户名称</p>
                  <p className="font-semibold">{inquiry.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">区域</p>
                  <p className="font-semibold">{inquiry.region}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">产品数量</p>
                  <p className="font-semibold">{inquiry.items.length} 个产品</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 产品Tab切换 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">选择产品并指定供应商</Label>
              <div className="flex items-center gap-2">
                {inquiry.items.map((item, index) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant={currentProductIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentProductIndex(index)}
                    className={currentProductIndex === index ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    <Package className="w-3 h-3 mr-1" />
                    产品 {index + 1}
                    {selectedSuppliersByProduct[item.id]?.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        {selectedSuppliersByProduct[item.id].length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* 当前产品信息 */}
            {currentProduct && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    产品 {currentProductIndex + 1} - {currentProduct.productName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">型号</p>
                      <p className="font-semibold">{currentProduct.modelNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">数量</p>
                      <p className="font-semibold">{currentProduct.quantity} {currentProduct.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">目标价格</p>
                      <p className="font-semibold">
                        {currentProduct.targetPrice ? `${currentProduct.currency} ${currentProduct.targetPrice}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">已选供应商</p>
                      <p className="font-semibold text-orange-600">
                        {currentSelectedSuppliers.length} 个
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 供应商选择 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  选择供应商 ({currentSelectedSuppliers.length} 已选)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSelectAllForProduct(currentProduct?.id || '')}
                  >
                    {currentSelectedSuppliers.length === sortedSuppliers.length ? '取消全选' : '全选'}
                  </Button>
                </div>
              </div>

              {/* 搜索框和报价截止日期 */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="搜索供应商名称、编号或类别..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="quotationDeadline" className="whitespace-nowrap text-sm">
                    报价截止日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quotationDeadline"
                    type="date"
                    value={quotationDeadline}
                    onChange={(e) => setQuotationDeadline(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>

              {/* 供应商列表 */}
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {sortedSuppliers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    未找到匹配的供应商
                  </div>
                ) : (
                  sortedSuppliers.map((supplier) => {
                    const isSelected = currentSelectedSuppliers.includes(supplier.id);
                    
                    return (
                      <div
                        key={supplier.id}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                        }`}
                        onClick={() => toggleSupplier(currentProduct?.id || '', supplier.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSupplier(currentProduct?.id || '', supplier.id)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-sm text-slate-900 truncate">{supplier.name}</span>
                              
                              {supplier.isPreferred && (
                                <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 text-xs">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                                  首选
                                </Badge>
                              )}
                              
                              <div className="flex items-center gap-1 ml-auto">
                                <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                                <span className="text-xs font-medium">{supplier.rating}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-600 mb-2">
                              <div className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{supplier.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span>{supplier.phone}</span>
                              </div>
                              <div className="truncate">交期: {supplier.leadTime}</div>
                              <div className="truncate">MOQ: {supplier.moq}</div>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-wrap">
                              {supplier.category.map((cat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 创建预览 */}
          {totalRFQCount > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-green-600" />
                  创建预览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>将创建 <strong className="text-green-700">{totalRFQCount}</strong> 个供应商询价单（RFQ）：</p>
                  <ul className="space-y-1 ml-4">
                    {inquiry.items.map((item, index) => {
                      const count = selectedSuppliersByProduct[item.id]?.length || 0;
                      if (count === 0) return null;
                      
                      return (
                        <li key={item.id} className="text-slate-700">
                          • 产品{index + 1} "{item.productName}" → <strong>{count}</strong> 个供应商
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-600">
              {totalRFQCount > 0 && (
                <span>共 <strong className="text-orange-600">{totalRFQCount}</strong> 个RFQ</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={totalRFQCount === 0 || !quotationDeadline || loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? '创建中...' : `创建 ${totalRFQCount} 个RFQ`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}