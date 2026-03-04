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
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Search, Building2, Mail, Phone, MapPin, Star, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useXJs } from '../../contexts/XJContext';

/**
 * 📋 下推采购询价（XJ）对话框
 * 
 * 功能：
 * 1. 从采购需求创建XJ（采购询价）
 * 2. 选择多个供应商
 * 3. 设置目标价格、期望交期等
 * 4. 一键推送给所有选中的供应商
 */

interface PurchaseRequirement {
  id: string;
  requirementNo: string;
  productName: string;
  modelNo: string;
  quantity: number;
  unit: string;
  requiredDate: string;
  sourceRef?: string;
}

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

interface PushToXJDialogProps {
  open: boolean;
  onClose: () => void;
  requirement: PurchaseRequirement | null;
}

// 🔥 模拟供应商数据（后续可以从Context或API获取）
const mockSuppliers: Supplier[] = [
  {
    id: 'sup_001',
    code: 'SUP-A-001',
    name: '深圳市华强电子有限公司',
    contact: '张经理',
    email: 'supplier_a@test.com',
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
    email: 'supplier_b@test.com',
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
    email: 'supplier_c@test.com',
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
    email: 'supplier_d@test.com',
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
    email: 'supplier_e@test.com',
    phone: '+86 760 8888 0005',
    address: '中山市古镇镇灯饰大道',
    category: ['电气', '照明', 'LED'],
    rating: 4.7,
    leadTime: '28天',
    moq: '800个',
    isPreferred: true
  }
];

export function PushToXJDialog({ open, onClose, requirement }: PushToXJDialogProps) {
  const { addRFQ } = useXJs();
  
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

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

  // 切换供应商选择
  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedSuppliers.length === sortedSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(sortedSuppliers.map(s => s.id));
    }
  };

  // 提交创建XJ(采购询价)
  const handleSubmit = () => {
    if (!requirement) return;
    
    if (selectedSuppliers.length === 0) {
      toast.error('请至少选择一个供应商');
      return;
    }

    setLoading(true);

    try {
      // 为每个选中的供应商创建XJ(采购询价)
      selectedSuppliers.forEach(supplierId => {
        const supplier = mockSuppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const xjNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        addRFQ({
          id: `rfq_${Date.now()}_${supplierId}`,
          xjNumber,
          
          // 🔥 产品信息（来自采购需求）
          productName: requirement.productName,
          modelNo: requirement.modelNo,
          quantity: requirement.quantity,
          unit: requirement.unit,
          
          // 🔥 供应商信息
          supplierCode: supplier.email,
          supplierName: supplier.name,
          supplierContact: supplier.contact,
          supplierEmail: supplier.email,
          
          // 🔥 询价参数
          targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
          expectedDate: expectedDate || requirement.requiredDate,
          
          // 🔥 关联信息
          requirementNo: requirement.requirementNo,
          sourceRef: requirement.sourceRef,
          
          // 🔥 状态信息
          status: 'pending',
          priority: 'medium',
          
          // 🔥 其他信息
          remarks: remarks || `来自采购需求 ${requirement.requirementNo}`,
          createdBy: 'admin@cosun.com',
          createdDate: new Date().toISOString().split('T')[0],
          dueDate: expectedDate || requirement.requiredDate,
          
          quotes: []
        });
      });

      toast.success(
        `✅ 询价已发送！`,
        {
          description: `已向 ${selectedSuppliers.length} 个供应商发送询价单`
        }
      );

      // 重置表单
      setSelectedSuppliers([]);
      setTargetPrice('');
      setExpectedDate('');
      setRemarks('');
      setSearchTerm('');
      
      onClose();
    } catch (error) {
      console.error('创建XJ失败:', error);
      toast.error('发送询价失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!requirement) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-600" />
            下推询价 - 选择供应商
          </DialogTitle>
          <DialogDescription>
            将采购需求推送给供应商，获取报价
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* 采购需求信息 */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">需求编号</p>
                  <p className="font-semibold text-orange-600">{requirement.requirementNo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">产品名称</p>
                  <p className="font-semibold">{requirement.productName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">型号</p>
                  <p className="font-semibold">{requirement.modelNo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">需求数量</p>
                  <p className="font-semibold">{requirement.quantity} {requirement.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 询价参数 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetPrice">目标价格（可选）</Label>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                placeholder="例如: 12.50"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
              <p className="text-xs text-slate-500">供应商可见，作为参考</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDate">期望交期</Label>
              <Input
                id="expectedDate"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
              <p className="text-xs text-slate-500">默认: {requirement.requiredDate}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">备注说明（可选）</Label>
            <Textarea
              id="remarks"
              placeholder="特殊要求、技术规格等..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>

          {/* 供应商选择 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">选择供应商 ({selectedSuppliers.length} 已选)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedSuppliers.length === sortedSuppliers.length ? '取消全选' : '全选'}
                </Button>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索供应商名称、编号或类别..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 供应商列表 */}
            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {sortedSuppliers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  未找到匹配的供应商
                </div>
              ) : (
                sortedSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                      selectedSuppliers.includes(supplier.id) ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                    }`}
                    onClick={() => toggleSupplier(supplier.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={() => toggleSupplier(supplier.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">{supplier.name}</span>
                          
                          {supplier.isPreferred && (
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                              首选
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                            <span className="text-sm font-medium">{supplier.rating}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {supplier.phone}
                          </div>
                          <div>交期: {supplier.leadTime}</div>
                          <div>MOQ: {supplier.moq}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {supplier.category.map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-600">
              {selectedSuppliers.length > 0 && (
                <span>已选择 <strong className="text-orange-600">{selectedSuppliers.length}</strong> 个供应商</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={selectedSuppliers.length === 0 || loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? '发送中...' : `发送询价 (${selectedSuppliers.length})`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
