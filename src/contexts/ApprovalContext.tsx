import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 🎯 审批类型
export type ApprovalType = 'quotation' | 'order' | 'payment' | 'contract' | 'sales_contract' | 'price_change';

// 🎯 审批状态
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'forwarded';

// 🎯 紧急程度
export type UrgencyLevel = 'high' | 'normal' | 'low';

// 🎯 审批操作
export type ApprovalAction = 'submitted' | 'approved' | 'rejected' | 'forwarded' | 'cancelled';

// 🎯 审批历史记录项
export interface ApprovalHistoryItem {
  id: string;
  approver: string; // 审批人邮箱
  approverName: string; // 审批人姓名
  approverRole: string; // 审批人角色
  action: ApprovalAction;
  comment: string; // 审批意见
  timestamp: string; // ISO时间戳
}

// 🎯 审批请求对象
export interface ApprovalRequest {
  id: string; // 审批请求ID (APR-xxx)
  type: ApprovalType; // 审批类型
  
  // 关联单据信息
  relatedDocumentId: string; // 关联单据号（如QT-NA-001）
  relatedDocumentType: string; // 单据类型描述（如"销售报价单"）
  relatedDocument: any; // 关联单据完整对象
  
  // 提交信息
  submittedBy: string; // 提交人邮箱
  submittedByName: string; // 提交人姓名
  submittedByRole: string; // 提交人角色
  submittedAt: string; // 提交时间 ISO
  region: string; // 业务区域
  
  // 审批流程
  currentApprover: string; // 当前审批人邮箱
  currentApproverRole: string; // 当前审批人角色
  nextApprover: string | null; // 下一审批人（如销售总监）
  nextApproverRole: string | null; // 下一审批人角色
  requiresDirectorApproval: boolean; // 是否需要总监审批
  
  // 状态
  status: ApprovalStatus;
  urgency: UrgencyLevel; // 紧急程度
  
  // 金额信息（重要：用于判断是否需要总监审批）
  amount: number;
  currency: string;
  
  // 客户信息（快速显示）
  customerName: string;
  customerEmail: string;
  
  // 产品信息摘要
  productSummary: string; // 如 "电气开关 x 500pcs 等 3 项产品"
  
  // 审批历史
  approvalHistory: ApprovalHistoryItem[];
  
  // 时限
  deadline: string; // 审批期限 ISO
  expiresIn: number; // 剩余小时数
}

interface ApprovalContextType {
  requests: ApprovalRequest[];
  addApprovalRequest: (request: Omit<ApprovalRequest, 'id' | 'approvalHistory'>) => ApprovalRequest;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
  getApprovalRequest: (id: string) => ApprovalRequest | undefined;
  
  // 按状态筛选
  getPendingApprovals: (approverEmail: string) => ApprovalRequest[];
  getApprovedApprovals: (approverEmail: string) => ApprovalRequest[];
  getRejectedApprovals: (approverEmail: string) => ApprovalRequest[];
  getMySubmitted: (submitterEmail: string) => ApprovalRequest[];
  
  // 审批操作
  approveRequest: (id: string, approver: string, approverName: string, approverRole: string, comment: string) => void;
  rejectRequest: (id: string, approver: string, approverName: string, approverRole: string, comment: string) => void;
  forwardRequest: (id: string, approver: string, approverName: string, approverRole: string, nextApprover: string, nextApproverRole: string, comment: string) => void;
  cancelRequest: (id: string) => void;
  
  // 按单据查询
  getApprovalByDocument: (documentId: string) => ApprovalRequest | undefined;
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

const STORAGE_KEY = 'cosun_approval_requests';

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('❌ Failed to parse approval requests:', e);
          return [];
        }
      }
    }
    return [];
  });

  // 持久化到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    }
  }, [requests]);

  // 📝 添加审批请求
  const addApprovalRequest = (request: Omit<ApprovalRequest, 'id' | 'approvalHistory'>): ApprovalRequest => {
    const newId = `APR-${Date.now()}`;
    const newRequest: ApprovalRequest = {
      ...request,
      id: newId,
      approvalHistory: [
        {
          id: `hist_${Date.now()}`,
          approver: request.submittedBy,
          approverName: request.submittedByName,
          approverRole: request.submittedByRole,
          action: 'submitted',
          comment: '提交审批',
          timestamp: new Date().toISOString(),
        }
      ],
    };
    
    setRequests(prev => [...prev, newRequest]);
    console.log('✅ [Approval] Created approval request:', newId, 'for document:', request.relatedDocumentId);
    return newRequest;
  };

  // 📝 更新审批请求
  const updateApprovalRequest = (id: string, updates: Partial<ApprovalRequest>) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  // 🔍 获取单个审批请求
  const getApprovalRequest = (id: string) => {
    return requests.find(req => req.id === id);
  };

  // 🔍 获取待我审批的请求
  const getPendingApprovals = (approverEmail: string) => {
    console.log('🔍 [Approval] getPendingApprovals 调用');
    console.log('  - 审批人邮箱:', approverEmail);
    console.log('  - 总请求数:', requests.length);
    
    const filtered = requests.filter(req => {
      // 🔥 修复：status为'pending'或'forwarded'都算待审批（forwarded是转发给下一审批人的状态）
      const isPending = req.status === 'pending' || req.status === 'forwarded';
      const isMyTurn = req.currentApprover === approverEmail;
      
      console.log(`  - 审批请求 ${req.id}:`, {
        relatedDocumentId: req.relatedDocumentId,
        status: req.status,
        currentApprover: req.currentApprover,
        isPending,
        isMyTurn,
        matched: isPending && isMyTurn
      });
      
      return isPending && isMyTurn;
    }).sort((a, b) => {
      // 按紧急程度和时间排序
      if (a.urgency !== b.urgency) {
        const urgencyOrder = { high: 0, normal: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    console.log('  ✅ 筛选结果:', filtered.length, '条待审批');
    return filtered;
  };

  // 🔍 获取我已审批的请求
  const getApprovedApprovals = (approverEmail: string) => {
    console.log('🔍 [Approval] getApprovedApprovals 调用');
    console.log('  - 审批人邮箱:', approverEmail);
    
    const filtered = requests.filter(req => {
      // 🔥 修复：需要检查审批历史，看该审批人是否批准过这个请求
      // 无论最终状态是 'approved' 还是 'forwarded'，只要该审批人批准过就显示
      const hasApproved = req.approvalHistory.some(h => 
        h.approver === approverEmail && (h.action === 'approved' || h.action === 'forwarded')
      );
      
      console.log(`  - 审批请求 ${req.id}:`, {
        relatedDocumentId: req.relatedDocumentId,
        status: req.status,
        hasApproved,
        approvalHistory: req.approvalHistory.map(h => ({
          approver: h.approver,
          action: h.action
        }))
      });
      
      return hasApproved;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    console.log('  ✅ 筛选结果:', filtered.length, '条已批准');
    return filtered;
  };

  // 🔍 获取我已驳回的请求
  const getRejectedApprovals = (approverEmail: string) => {
    return requests.filter(req => 
      req.status === 'rejected' &&
      req.approvalHistory.some(h => h.approver === approverEmail && h.action === 'rejected')
    ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  };

  // 🔍 获取我发起的请求
  const getMySubmitted = (submitterEmail: string) => {
    return requests.filter(req => req.submittedBy === submitterEmail)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  };

  // ✅ 批准审批
  const approveRequest = (
    id: string, 
    approver: string, 
    approverName: string, 
    approverRole: string,
    comment: string
  ) => {
    console.log('🔍 [Approval] approveRequest 调用:', {
      id,
      approver,
      approverName,
      approverRole,
      comment
    });
    
    setRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      
      console.log('  - 找到审批请求:', {
        relatedDocumentId: req.relatedDocumentId,
        currentStatus: req.status,
        currentApprover: req.currentApprover,
        currentApproverRole: req.currentApproverRole,
        requiresDirectorApproval: req.requiresDirectorApproval,
        nextApprover: req.nextApprover
      });
      
      const historyItem: ApprovalHistoryItem = {
        id: `hist_${Date.now()}`,
        approver,
        approverName,
        approverRole,
        action: 'approved',
        comment,
        timestamp: new Date().toISOString(),
      };
      
      // 🔥 判断是否需要转发给销售总监
      // 条件：需要总监审批 && 当前审批人不是总监（避免无限转发）
      console.log('🔍 [Approval] 审批条件判断:', {
        approverRole,
        requiresDirectorApproval: req.requiresDirectorApproval,
        nextApprover: req.nextApprover,
        willForward: req.requiresDirectorApproval && approverRole !== 'Sales_Director'
      });
      
      // 🔥 修复：销售总监批准时应该直接完成，不再检查nextApprover
      // 正确的判断逻辑：需要总监审批 && 当前批准人不是总监 = 主管批准，需转发
      if (req.requiresDirectorApproval && approverRole !== 'Sales_Director') {
        console.log('💰 [Approval] Amount ≥ $20,000, forwarding to director:', req.nextApprover);
        console.log('  - 主管批准，转发给总监');
        return {
          ...req,
          status: 'forwarded' as ApprovalStatus,
          currentApprover: req.nextApprover,
          currentApproverRole: req.nextApproverRole || 'Sales_Director',
          approvalHistory: [...req.approvalHistory, historyItem],
        };
      } else {
        // 🔥 如果是总监批准，或者不需要总监审批，直接完成审批
        console.log('✅ [Approval] Final approval:', {
          approverRole,
          isFinalApproval: true,
          reason: approverRole === 'Sales_Director' ? '总监最终批准' : '金额<$20k，主管直接批准'
        });
        return {
          ...req,
          status: 'approved' as ApprovalStatus,
          approvalHistory: [...req.approvalHistory, historyItem],
          // 🔥 修复：清除审批标志，避免已批准单据仍显示"需总监复审"标签
          requiresDirectorApproval: false,
          nextApprover: undefined,
          nextApproverRole: undefined
        };
      }
    }));
  };

  // ❌ 驳回审批
  const rejectRequest = (
    id: string, 
    approver: string, 
    approverName: string,
    approverRole: string, 
    comment: string
  ) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      
      const historyItem: ApprovalHistoryItem = {
        id: `hist_${Date.now()}`,
        approver,
        approverName,
        approverRole,
        action: 'rejected',
        comment,
        timestamp: new Date().toISOString(),
      };
      
      return {
        ...req,
        status: 'rejected' as ApprovalStatus,
        approvalHistory: [...req.approvalHistory, historyItem],
      };
    }));
  };

  // 📨 转交审批
  const forwardRequest = (
    id: string,
    approver: string,
    approverName: string,
    approverRole: string,
    nextApprover: string,
    nextApproverRole: string,
    comment: string
  ) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      
      const historyItem: ApprovalHistoryItem = {
        id: `hist_${Date.now()}`,
        approver,
        approverName,
        approverRole,
        action: 'forwarded',
        comment,
        timestamp: new Date().toISOString(),
      };
      
      return {
        ...req,
        status: 'forwarded' as ApprovalStatus,
        currentApprover: nextApprover,
        currentApproverRole: nextApproverRole,
        approvalHistory: [...req.approvalHistory, historyItem],
      };
    }));
  };

  // 🚫 取消审批
  const cancelRequest = (id: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'cancelled' as ApprovalStatus } : req
    ));
  };

  // 🔍 按单据查询审批请求
  const getApprovalByDocument = (documentId: string) => {
    return requests.find(req => req.relatedDocumentId === documentId);
  };

  const value: ApprovalContextType = {
    requests,
    addApprovalRequest,
    updateApprovalRequest,
    getApprovalRequest,
    getPendingApprovals,
    getApprovedApprovals,
    getRejectedApprovals,
    getMySubmitted,
    approveRequest,
    rejectRequest,
    forwardRequest,
    cancelRequest,
    getApprovalByDocument,
  };

  return (
    <ApprovalContext.Provider value={value}>
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApproval() {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApproval must be used within ApprovalProvider');
  }
  return context;
}