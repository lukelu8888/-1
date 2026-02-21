import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, DollarSign, User, Calendar, FileText, AlertCircle, TrendingUp, ArrowRight, MessageSquare, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

/**
 * 🎯 报价审批管理界面
 * 
 * 角色权限：
 * 1. 区域业务主管：审核所有报价（< $20,000直接批准，≥ $20,000需总监二次审核）
 * 2. 销售总监：审核 ≥ $20,000 的报价（由主管初审后流转）
 * 
 * 审批流程：
 * - 业务员提交 → 区域主管审核 
 *   - < $20,000：主管批准 → 完成（业务员可发送客户）
 *   - ≥ $20,000：主管批准 → 销售总监审核 → 完成
 * - 任何节点驳回 → 退回业务员整改
 */

interface QuoteApproval {
  quoteNo: string;
  requirementNo: string;
  salesperson: string;
  customerName: string;
  totalAmount: number;
  submittedAt: string;
  status: 'pending_supervisor' | 'pending_director' | 'approved' | 'rejected';
  
  approvalFlow: {
    requiresDirectorApproval: boolean;
    currentStep: 'supervisor' | 'director' | 'completed';
    steps: string[];
  };
  
  approvalHistory: Array<{
    action: string;
    actor: string;
    actorRole: string;
    timestamp: string;
    notes: string;
    amount?: number;
    decision?: 'approved' | 'rejected';
  }>;
  
  approvalNotes: string; // 业务员提交时的说明
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
    quotePrice: number;
    totalAmount: number;
  }>;
}

interface QuoteApprovalManagementProps {
  userRole: 'supervisor' | 'director'; // 当前用户角色
  userName: string; // 当前用户名称
}

// 模拟数据
const mockQuotes: QuoteApproval[] = [
  {
    quoteNo: 'QT-NA-251223-0001',
    requirementNo: 'QR-NA-251223-0001',
    salesperson: '张伟',
    customerName: 'ABC Building Supplies',
    totalAmount: 15800,
    submittedAt: '2025-12-23T10:30:00Z',
    status: 'pending_supervisor',
    approvalFlow: {
      requiresDirectorApproval: false,
      currentStep: 'supervisor',
      steps: ['supervisor']
    },
    approvalHistory: [
      {
        action: 'submitted',
        actor: '张伟 (业务员)',
        actorRole: 'salesperson',
        timestamp: '2025-12-23T10:30:00Z',
        notes: '首次合作客户，建议利润率20%，竞争对手报价预估$18000',
        amount: 15800
      }
    ],
    approvalNotes: '首次合作客户，建议利润率20%，竞争对手报价预估$18000',
    items: [
      { productName: 'Top Freezer Refrigerator 18 cu.ft', quantity: 100, unit: 'PCS', quotePrice: 158, totalAmount: 15800 }
    ]
  },
  {
    quoteNo: 'QT-NA-251223-0002',
    requirementNo: 'QR-NA-251222-0005',
    salesperson: '李明',
    customerName: 'HomeMax Retail Chain',
    totalAmount: 45600,
    submittedAt: '2025-12-23T09:15:00Z',
    status: 'pending_supervisor',
    approvalFlow: {
      requiresDirectorApproval: true,
      currentStep: 'supervisor',
      steps: ['supervisor', 'director']
    },
    approvalHistory: [
      {
        action: 'submitted',
        actor: '李明 (业务员)',
        actorRole: 'salesperson',
        timestamp: '2025-12-23T09:15:00Z',
        notes: '大客户，年采购预估$500,000，本次测试订单，利润率设定15%争取长期合作',
        amount: 45600
      }
    ],
    approvalNotes: '大客户，年采购预估$500,000，本次测试订单，利润率设定15%争取长期合作',
    items: [
      { productName: 'Top Freezer Refrigerator 18 cu.ft', quantity: 200, unit: 'PCS', quotePrice: 155, totalAmount: 31000 },
      { productName: 'Top Freezer Refrigerator 20 cu.ft', quantity: 100, unit: 'PCS', quotePrice: 146, totalAmount: 14600 }
    ]
  }
];

export default function QuoteApprovalManagement({ userRole, userName }: QuoteApprovalManagementProps) {
  const [quotes, setQuotes] = useState<QuoteApproval[]>(mockQuotes);
  const [selectedQuote, setSelectedQuote] = useState<QuoteApproval | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'approve' | 'reject' | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  
  // 根据角色过滤待审批报价
  const pendingQuotes = quotes.filter(q => {
    if (userRole === 'supervisor') {
      return q.status === 'pending_supervisor';
    } else if (userRole === 'director') {
      return q.status === 'pending_director';
    }
    return false;
  });
  
  // 已处理的报价
  const processedQuotes = quotes.filter(q => {
    return q.status === 'approved' || q.status === 'rejected';
  });
  
  // 提交审批决定
  const handleSubmitApproval = () => {
    if (!selectedQuote || !approvalDecision || !approvalComment.trim()) {
      alert('请填写审批意见！');
      return;
    }
    
    const updatedQuote = { ...selectedQuote };
    
    // 添加审批记录
    updatedQuote.approvalHistory.push({
      action: approvalDecision === 'approve' ? 'approved' : 'rejected',
      actor: `${userName} (${userRole === 'supervisor' ? '区域主管' : '销售总监'})`,
      actorRole: userRole,
      timestamp: new Date().toISOString(),
      notes: approvalComment,
      decision: approvalDecision
    });
    
    // 更新状态
    if (approvalDecision === 'approve') {
      // 批准
      if (userRole === 'supervisor') {
        if (updatedQuote.approvalFlow.requiresDirectorApproval) {
          // 需要总监审核，流转至总监
          updatedQuote.status = 'pending_director';
          updatedQuote.approvalFlow.currentStep = 'director';
        } else {
          // 不需要总监审核，直接完成
          updatedQuote.status = 'approved';
          updatedQuote.approvalFlow.currentStep = 'completed';
        }
      } else if (userRole === 'director') {
        // 总监批准，完成审批
        updatedQuote.status = 'approved';
        updatedQuote.approvalFlow.currentStep = 'completed';
      }
    } else {
      // 驳回
      updatedQuote.status = 'rejected';
    }
    
    // 更新列表
    setQuotes(prev => prev.map(q => q.quoteNo === updatedQuote.quoteNo ? updatedQuote : q));
    
    // 提示信息
    const message = approvalDecision === 'approve'
      ? (userRole === 'supervisor' && updatedQuote.approvalFlow.requiresDirectorApproval
        ? `✅ 已批准！报价已流转至销售总监审核。`
        : `✅ 审批通过！业务员 ${selectedQuote.salesperson} 现在可以发送给客户。`)
      : `❌ 已驳回！报价已退回业务员 ${selectedQuote.salesperson} 整改。`;
    
    alert(message);
    
    // 重置状态
    setSelectedQuote(null);
    setApprovalDecision(null);
    setApprovalComment('');
  };
  
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">报价审批管理</h1>
              <p className="text-sm text-slate-600 mt-1">
                当前角色：<strong className="text-orange-500">
                  {userRole === 'supervisor' ? '区域业务主管' : '销售总监'}
                </strong> ({userName})
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center bg-orange-100 px-4 py-2 rounded-lg">
                <div className="text-xs text-orange-600">待审批</div>
                <div className="text-2xl font-bold text-orange-600">{pendingQuotes.length}</div>
              </div>
              <div className="text-center bg-green-100 px-4 py-2 rounded-lg">
                <div className="text-xs text-green-600">已处理</div>
                <div className="text-2xl font-bold text-green-600">{processedQuotes.length}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 审批规则说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            审批规则
          </h3>
          <div className="text-xs text-blue-800 space-y-1">
            {userRole === 'supervisor' ? (
              <>
                <div>• 报价总额 <strong>&lt; $20,000</strong>：您批准后，业务员即可发送给客户</div>
                <div>• 报价总额 <strong>≥ $20,000</strong>：您批准后，还需<strong>销售总监</strong>审核</div>
                <div>• 驳回后，报价将退回业务员整改</div>
              </>
            ) : (
              <>
                <div>• 您只需审核报价总额 <strong>≥ $20,000</strong> 的报价（已由区域主管初审）</div>
                <div>• 批准后，业务员即可发送给客户</div>
                <div>• 驳回后，报价将退回业务员整改</div>
              </>
            )}
          </div>
        </div>
        
        {/* 待审批列表 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-5 py-3 border-b bg-gradient-to-r from-orange-50 to-white">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              待审批报价 ({pendingQuotes.length})
            </h2>
          </div>
          
          <div className="divide-y">
            {pendingQuotes.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无待审批报价</p>
              </div>
            ) : (
              pendingQuotes.map(quote => (
                <div key={quote.quoteNo} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-slate-900">{quote.quoteNo}</h3>
                        <Badge variant={quote.approvalFlow.requiresDirectorApproval ? 'destructive' : 'default'}>
                          {quote.approvalFlow.requiresDirectorApproval ? '两级审批' : '一级审批'}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          客户：<strong>{quote.customerName}</strong>
                        </span>
                        <span className="text-sm text-slate-500">
                          业务员：<strong>{quote.salesperson}</strong>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded px-3 py-2">
                          <div className="text-xs text-orange-600 mb-0.5">报价总额</div>
                          <div className="text-lg font-bold text-orange-600">${quote.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-50 rounded px-3 py-2">
                          <div className="text-xs text-slate-500 mb-0.5">产品数量</div>
                          <div className="text-base font-semibold text-slate-900">{quote.items.length} 种产品</div>
                        </div>
                        <div className="bg-slate-50 rounded px-3 py-2">
                          <div className="text-xs text-slate-500 mb-0.5">提交时间</div>
                          <div className="text-base font-semibold text-slate-900">
                            {new Date(quote.submittedAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded px-3 py-2">
                          <div className="text-xs text-slate-500 mb-0.5">需求单号</div>
                          <div className="text-base font-semibold text-slate-900">{quote.requirementNo}</div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                        <div className="text-xs font-medium text-yellow-800 mb-1">业务员提交说明：</div>
                        <div className="text-sm text-yellow-900">{quote.approvalNotes}</div>
                      </div>
                      
                      {/* 审批流程可视化 */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3" />
                          业务员提交
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                          quote.approvalFlow.currentStep === 'supervisor' 
                            ? 'bg-orange-100 text-orange-700 font-semibold' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {quote.approvalFlow.currentStep === 'supervisor' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          区域主管审核
                        </div>
                        {quote.approvalFlow.requiresDirectorApproval && (
                          <>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                              quote.approvalFlow.currentStep === 'director' 
                                ? 'bg-orange-100 text-orange-700 font-semibold' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {quote.approvalFlow.currentStep === 'director' ? (
                                <Clock className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3 opacity-50" />
                              )}
                              销售总监审核
                            </div>
                          </>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2 py-1 rounded">
                          <Clock className="w-3 h-3 opacity-50" />
                          发送客户
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setSelectedQuote(quote)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      审批
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 审批弹窗 */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* 弹窗头部 */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">审批报价单</h2>
                    <p className="text-sm text-orange-100 mt-1">{selectedQuote.quoteNo}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-orange-100">报价总额</div>
                    <div className="text-2xl font-bold">${selectedQuote.totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              {/* 弹窗内容 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">客户名称</div>
                    <div className="text-base font-semibold text-slate-900">{selectedQuote.customerName}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">业务员</div>
                    <div className="text-base font-semibold text-slate-900">{selectedQuote.salesperson}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">需求单号</div>
                    <div className="text-base font-semibold text-slate-900">{selectedQuote.requirementNo}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">提交时间</div>
                    <div className="text-base font-semibold text-slate-900">
                      {new Date(selectedQuote.submittedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                
                {/* 业务员说明 */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    业务员提交说明
                  </h3>
                  <div className="text-sm text-yellow-900 whitespace-pre-wrap">{selectedQuote.approvalNotes}</div>
                </div>
                
                {/* 产品清单 */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b">
                    <h3 className="text-sm font-semibold text-slate-900">产品清单</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left">产品名称</th>
                        <th className="px-4 py-2 text-right">数量</th>
                        <th className="px-4 py-2 text-right">单位</th>
                        <th className="px-4 py-2 text-right">单价 USD</th>
                        <th className="px-4 py-2 text-right">小计 USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedQuote.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{item.unit}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">${item.quotePrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600">${item.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-50 border-t-2 border-orange-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-900">总计：</td>
                        <td className="px-4 py-3 text-right text-xl font-bold text-orange-600">
                          ${selectedQuote.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* 审批决定 */}
                <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">审批决定</h3>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setApprovalDecision('approve')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        approvalDecision === 'approve'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-semibold">批准</div>
                    </button>
                    <button
                      onClick={() => setApprovalDecision('reject')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        approvalDecision === 'reject'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-red-300'
                      }`}
                    >
                      <XCircle className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-semibold">驳回</div>
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      审批意见 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder={approvalDecision === 'approve' 
                        ? '请填写批准意见（如：同意报价，注意交期、付款条件等）' 
                        : '请填写驳回原因（如：利润率过低、价格不合理、需重新核算等）'
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* 弹窗底部 */}
              <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedQuote(null);
                    setApprovalDecision(null);
                    setApprovalComment('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSubmitApproval}
                  disabled={!approvalDecision || !approvalComment.trim()}
                  className={`${
                    approvalDecision === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {approvalDecision === 'approve' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      确认批准
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      确认驳回
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
