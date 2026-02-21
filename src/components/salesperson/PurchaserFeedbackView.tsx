/**
 * 🔥 采购反馈查看组件 - 业务员端
 * 
 * 功能：
 * 1. 展示采购员反馈的成本信息（脱敏，不含供应商信息）
 * 2. 展示采购员的专业建议
 * 3. 显示建议利润率和建议售价
 * 4. 提供"基于此成本创建客户报价"按钮
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Package, 
  TrendingUp,
  FileText,
  ShieldCheck,
  Info,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { PurchaseRequirement, PurchaserFeedback } from '../../contexts/PurchaseRequirementContext';

interface PurchaserFeedbackViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qr: PurchaseRequirement;
  onCreateQuotation: (qr: PurchaseRequirement, feedback: PurchaserFeedback) => void;
}

export function PurchaserFeedbackView({
  open,
  onOpenChange,
  qr,
  onCreateQuotation
}: PurchaserFeedbackViewProps) {
  
  const feedback = qr.purchaserFeedback;
  
  if (!feedback) {
    return null;
  }
  
  // 🔥 计算总成本和建议售价
  const totalCost = feedback.products.reduce((sum, p) => sum + p.amount, 0);
  const suggestedMargin = feedback.suggestedMargin || 30;
  const suggestedPrice = totalCost * (1 + suggestedMargin / 100);
  
  // 🔥 风险等级颜色
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  
  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low':
        return '🟢 低风险';
      case 'medium':
        return '🟡 中风险';
      case 'high':
        return '🔴 高风险';
      default:
        return '未知';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            采购反馈 - {qr.requirementNo}
          </DialogTitle>
          <DialogDescription>
            采购员 <span className="font-semibold text-orange-600">{feedback.feedbackBy}</span> 于{' '}
            <span className="font-semibold">{feedback.feedbackDate}</span> 已完成成本核价
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          
          {/* 🔥 权限隔离提示 */}
          <Alert className="bg-blue-50 border-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">权限保护说明</AlertTitle>
            <AlertDescription className="text-blue-700 text-sm">
              为保护公司资源，<strong>供应商名称、BJ单号、供应商联系方式已隐藏</strong>，您只能查看成本信息和采购建议。
            </AlertDescription>
          </Alert>
          
          {/* 🔥 成本信息汇总 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              成本信息汇总
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">总成本</div>
                <div className="text-2xl font-bold text-orange-600">
                  {feedback.products[0]?.currency || 'CNY'} {totalCost.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">建议利润率</div>
                <div className="text-2xl font-bold text-blue-600">
                  {suggestedMargin}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">建议总售价</div>
                <div className="text-2xl font-bold text-green-600">
                  {feedback.products[0]?.currency || 'CNY'} {suggestedPrice.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">风险评估</div>
                <div className="flex items-center justify-center">
                  <Badge className={getRiskBadgeColor(feedback.riskLevel) + ' text-base py-1 px-3'}>
                    {getRiskLabel(feedback.riskLevel)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* 🔥 产品成本明细表 */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              产品成本明细
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>产品名称</TableHead>
                    <TableHead>规格</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">成本单价</TableHead>
                    <TableHead className="text-right">成本总额</TableHead>
                    <TableHead className="text-center">MOQ</TableHead>
                    <TableHead className="text-center">交期</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.products.map((product, index) => (
                    <TableRow key={product.productId || index}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.specification || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.quantity.toLocaleString()} {product.unit}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {product.currency} {product.costPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {product.currency} {product.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="h-3 w-3 text-gray-500" />
                          <span>{product.moq?.toLocaleString() || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span>{product.leadTime || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* 汇总行 */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell colSpan={4} className="text-right">总计：</TableCell>
                    <TableCell className="text-right text-orange-600 text-lg">
                      {feedback.products[0]?.currency || 'CNY'} {totalCost.toLocaleString()}
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* 🔥 商务条款 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                付款方式
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                {feedback.paymentTerms || 'T/T 30% 定金，70% 发货前'}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                交货条款
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                {feedback.deliveryTerms || 'FOB 厦门'}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                包装要求
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                {feedback.packaging || '标准出口包装'}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                质保期
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                {feedback.warranty || '12个月'}
              </div>
            </div>
          </div>
          
          {/* 🔥 采购员专业建议 */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              采购员专业建议
            </h3>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {feedback.purchaserRemarks || '暂无建议'}
              </div>
            </div>
          </div>
          
          {/* 🔥 利润率建议 */}
          <Alert className={
            feedback.riskLevel === 'low' ? 'bg-green-50 border-green-200' :
            feedback.riskLevel === 'high' ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }>
            <TrendingUp className={`h-4 w-4 ${
              feedback.riskLevel === 'low' ? 'text-green-600' :
              feedback.riskLevel === 'high' ? 'text-red-600' :
              'text-yellow-600'
            }`} />
            <AlertTitle className={
              feedback.riskLevel === 'low' ? 'text-green-800' :
              feedback.riskLevel === 'high' ? 'text-red-800' :
              'text-yellow-800'
            }>
              定价策略建议
            </AlertTitle>
            <AlertDescription className={`text-sm ${
              feedback.riskLevel === 'low' ? 'text-green-700' :
              feedback.riskLevel === 'high' ? 'text-red-700' :
              'text-yellow-700'
            }`}>
              <div className="space-y-2">
                <div>
                  • <strong>建议利润率：{suggestedMargin}%</strong> - 基于成本 {totalCost.toLocaleString()} {feedback.products[0]?.currency}，
                  建议报价 <strong className="text-green-600">{suggestedPrice.toLocaleString()} {feedback.products[0]?.currency}</strong>
                </div>
                {feedback.riskLevel === 'low' && (
                  <div>
                    • 🟢 <strong>低风险订单</strong> - 供应商稳定可靠，质量有保障，可考虑适当降低利润率以提高竞争力（25%-30%）
                  </div>
                )}
                {feedback.riskLevel === 'medium' && (
                  <div>
                    • 🟡 <strong>中风险订单</strong> - 建议保持30%-35%利润率，以应对可能的成本波动和质量风险
                  </div>
                )}
                {feedback.riskLevel === 'high' && (
                  <div>
                    • 🔴 <strong>高风险订单</strong> - 建议提高利润率至35%-40%，并收取更高定金比例（40%-50%），或建议先小单测试
                  </div>
                )}
                <div>
                  • 💡 大单（数量超过MOQ的3倍）可在此基础上微调 ±3%-5%
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button 
            onClick={() => {
              onCreateQuotation(qr, feedback);
              onOpenChange(false);
            }}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <FileText className="h-4 w-4" />
            基于此成本创建客户报价
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
