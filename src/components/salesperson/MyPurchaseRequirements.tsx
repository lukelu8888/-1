/**
 * 🔥 我的采购需求 - 业务员端
 * 
 * 功能：
 * 1. 查看自己创建的采购需求（QR）
 * 2. 查看采购员反馈的成本信息
 * 3. 基于采购反馈创建客户报价（QT）
 * 4. 跟踪采购进度
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Search, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { PurchaserFeedbackView } from './PurchaserFeedbackView';
import { CreateQuotationFromFeedback } from './CreateQuotationFromFeedback';
import { toast } from 'sonner@2.0.3';

export function MyPurchaseRequirements() {
  const { requirements } = usePurchaseRequirements();
  const currentUser = getCurrentUser();
  
  // 🔥 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'feedbacked'>('all');
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [showFeedbackView, setShowFeedbackView] = useState(false);
  const [showCreateQuotation, setShowCreateQuotation] = useState(false);
  
  // 🔥 筛选我的采购需求
  const myRequirements = useMemo(() => {
    return requirements.filter(qr => {
      // 只显示当前业务员创建的QR
      if (qr.createdBy !== currentUser?.name && qr.createdBy !== currentUser?.email) {
        return false;
      }
      
      // 状态筛选
      if (filterStatus === 'pending' && qr.purchaserFeedback) {
        return false;
      }
      if (filterStatus === 'feedbacked' && !qr.purchaserFeedback) {
        return false;
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          qr.requirementNo.toLowerCase().includes(term) ||
          qr.sourceInquiryNo?.toLowerCase().includes(term) ||
          qr.items.some(item => 
            item.productName.toLowerCase().includes(term) ||
            item.modelNo?.toLowerCase().includes(term)
          )
        );
      }
      
      return true;
    });
  }, [requirements, currentUser, filterStatus, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = myRequirements.length;
    const pending = myRequirements.filter(qr => !qr.purchaserFeedback).length;
    const feedbacked = myRequirements.filter(qr => qr.purchaserFeedback).length;
    
    return { total, pending, feedbacked };
  }, [myRequirements]);
  
  // 🔥 查看采购反馈
  const handleViewFeedback = (qr: any) => {
    if (!qr.purchaserFeedback) {
      toast.error('该采购需求尚未收到采购员反馈');
      return;
    }
    
    setSelectedQR(qr);
    setShowFeedbackView(true);
  };
  
  // 🔥 创建客户报价
  const handleCreateQuotation = (qr: any, feedback: any) => {
    setSelectedQR(qr);
    setShowCreateQuotation(true);
  };
  
  // 🔥 状态标识
  const getStatusBadge = (qr: any) => {
    if (qr.purchaserFeedback) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          已反馈
        </Badge>
      );
    }
    
    if (qr.status === 'allSubmitted' || qr.status === 'partialSubmitted') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          等待反馈
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        {qr.status === 'pending' ? '未询价' : '询价中'}
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      
      {/* 🔥 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">我的采购需求</h2>
          <p className="text-sm text-gray-600 mt-1">
            查看采购进度，接收采购员反馈，创建客户报价
          </p>
        </div>
      </div>
      
      {/* 🔥 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">总需求数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">等待反馈</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-orange-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已收到反馈</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.feedbacked}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-600 opacity-20" />
          </div>
        </div>
      </div>
      
      {/* 🔥 筛选和搜索 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="sr-only">搜索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索 QR 编号、INQ 编号、产品名称..."
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                全部 ({stats.total})
              </Button>
              <Button 
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                等待反馈 ({stats.pending})
              </Button>
              <Button 
                variant={filterStatus === 'feedbacked' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('feedbacked')}
              >
                已反馈 ({stats.feedbacked})
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔥 采购需求列表 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-40">QR编号</TableHead>
              <TableHead className="w-32">关联询价</TableHead>
              <TableHead className="w-24">区域</TableHead>
              <TableHead>产品信息</TableHead>
              <TableHead className="w-32 text-center">状态</TableHead>
              <TableHead className="w-32 text-center">反馈状态</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myRequirements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>暂无采购需求</p>
                  <p className="text-sm mt-1">在客户询价管理中下推 QR 即可在此查看</p>
                </TableCell>
              </TableRow>
            ) : (
              myRequirements.map((qr) => (
                <TableRow key={qr.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-semibold text-blue-600">
                    {qr.requirementNo}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {qr.sourceInquiryNo || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {qr.region || 'NA'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const items = Array.isArray(qr.items) ? qr.items : [];
                      const first = items[0];
                      const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                      const unit = first?.unit || '';
                      return (
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{first?.productName || 'N/A'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            共 {Math.max(items.length, 1)} 个产品 · {totalQty.toLocaleString()} {unit}
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(qr)}
                  </TableCell>
                  <TableCell className="text-center">
                    {qr.purchaserFeedback ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          已反馈
                        </div>
                        <div className="text-xs text-gray-500">
                          {qr.purchaserFeedback.feedbackDate}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          by {qr.purchaserFeedback.feedbackBy}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        等待中
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {qr.purchaserFeedback && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFeedback(qr)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            查看反馈
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleCreateQuotation(qr, qr.purchaserFeedback)}
                            className="gap-1 bg-orange-600 hover:bg-orange-700"
                          >
                            <FileText className="h-3 w-3" />
                            创建报价
                          </Button>
                        </>
                      )}
                      {!qr.purchaserFeedback && (
                        <div className="text-xs text-gray-500">
                          等待采购员反馈...
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 🔥 采购反馈查看对话框 */}
      {selectedQR && selectedQR.purchaserFeedback && (
        <PurchaserFeedbackView
          open={showFeedbackView}
          onOpenChange={setShowFeedbackView}
          qr={selectedQR}
          onCreateQuotation={(qr, feedback) => {
            setShowFeedbackView(false);
            handleCreateQuotation(qr, feedback);
          }}
        />
      )}
      
      {/* 🔥 创建客户报价对话框 */}
      {selectedQR && selectedQR.purchaserFeedback && (
        <CreateQuotationFromFeedback
          open={showCreateQuotation}
          onOpenChange={setShowCreateQuotation}
          qr={selectedQR}
          feedback={selectedQR.purchaserFeedback}
        />
      )}
      
    </div>
  );
}
