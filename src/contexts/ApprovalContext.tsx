import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { approvalRecordService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

// 🎯 审批类型
export type ApprovalType = 'qt' | 'order' | 'payment' | 'contract' | 'sales_contract' | 'price_change';

// 🎯 审批状态
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'forwarded';

// 🎯 紧急程度
export type UrgencyLevel = 'high' | 'normal' | 'low';

// 🎯 审批操作
export type ApprovalAction = 'submitted' | 'approved' | 'rejected' | 'forwarded' | 'cancelled';

// 🎯 审批历史记录项
export interface ApprovalHistoryItem {
  id: string;
  approver: string;
  approverName: string;
  approverRole: string;
  action: ApprovalAction;
  comment: string;
  timestamp: string;
}

// 🎯 审批请求对象
export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  relatedDocumentId: string;
  relatedDocumentType: string;
  relatedDocument: any;
  submittedBy: string;
  submittedByName: string;
  submittedByRole: string;
  submittedAt: string;
  region: string;
  currentApprover: string;
  currentApproverRole: string;
  nextApprover: string | null;
  nextApproverRole: string | null;
  requiresDirectorApproval: boolean;
  status: ApprovalStatus;
  urgency: UrgencyLevel;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  productSummary: string;
  approvalHistory: ApprovalHistoryItem[];
  deadline: string;
  expiresIn: number;
}

interface ApprovalContextType {
  requests: ApprovalRequest[];
  loading: boolean;
  addApprovalRequest: (request: Omit<ApprovalRequest, 'id' | 'approvalHistory'>) => Promise<ApprovalRequest>;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => Promise<void>;
  getApprovalRequest: (id: string) => ApprovalRequest | undefined;
  getPendingApprovals: (approverEmail: string) => ApprovalRequest[];
  getApprovedApprovals: (approverEmail: string) => ApprovalRequest[];
  getRejectedApprovals: (approverEmail: string) => ApprovalRequest[];
  getMySubmitted: (submitterEmail: string) => ApprovalRequest[];
  approveRequest: (id: string, approver: string, approverName: string, approverRole: string, comment: string) => Promise<void>;
  rejectRequest: (id: string, approver: string, approverName: string, approverRole: string, comment: string) => Promise<void>;
  forwardRequest: (id: string, approver: string, approverName: string, approverRole: string, nextApprover: string, nextApproverRole: string, comment: string) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  getApprovalByDocument: (documentId: string) => ApprovalRequest | undefined;
}

export const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFromSupabase = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const data = await approvalRecordService.getForApprover(session.user.email);
      if (data && Array.isArray(data)) {
        setRequests(data.filter(Boolean) as ApprovalRequest[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) void loadFromSupabase();
      else if (event === 'SIGNED_OUT') setRequests([]);
    });

    return () => { subscription.unsubscribe(); };
  }, [loadFromSupabase]);

  // Realtime：监听 approval_records 变化（任意审批者操作后实时更新）
  useEffect(() => {
    let email = '';
    supabase.auth.getSession().then(({ data: { session } }) => {
      email = session?.user?.email || '';
    });

    const channel = supabase
      .channel('approval_records_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_records' }, (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const updated = newRow as ApprovalRequest;
          setRequests(prev => {
            const exists = prev.find(r => r.id === updated.id);
            return exists
              ? prev.map(r => r.id === updated.id ? { ...r, ...updated } : r)
              : [updated, ...prev];
          });
        } else if (eventType === 'DELETE') {
          const deletedId = (oldRow as any)?.id;
          if (deletedId) setRequests(prev => prev.filter(r => r.id !== deletedId));
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  // 📝 添加审批请求
  const addApprovalRequest = async (request: Omit<ApprovalRequest, 'id' | 'approvalHistory'>): Promise<ApprovalRequest> => {
    const newRequest: ApprovalRequest = {
      ...request,
      id: crypto.randomUUID(),
      approvalHistory: [{
        id: crypto.randomUUID(),
        approver: request.submittedBy,
        approverName: request.submittedByName,
        approverRole: request.submittedByRole,
        action: 'submitted',
        comment: '提交审批',
        timestamp: new Date().toISOString(),
      }],
    };
    const saved = await approvalRecordService.upsert(newRequest);
    const result = (saved || newRequest) as ApprovalRequest;
    setRequests(prev => [result, ...prev]);
    return result;
  };

  // 📝 更新审批请求
  const updateApprovalRequest = async (id: string, updates: Partial<ApprovalRequest>) => {
    const current = requests.find(r => r.id === id);
    const merged = { ...current, ...updates } as ApprovalRequest;
    await approvalRecordService.upsert(merged);
    setRequests(prev => prev.map(r => r.id === id ? merged : r));
  };

  const getApprovalRequest = (id: string) => requests.find(r => r.id === id);

  const getPendingApprovals = (approverEmail: string) =>
    requests.filter(r =>
      (r.status === 'pending' || r.status === 'forwarded') &&
      r.currentApprover === approverEmail
    ).sort((a, b) => {
      const order = { high: 0, normal: 1, low: 2 };
      if (a.urgency !== b.urgency) return order[a.urgency] - order[b.urgency];
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const getApprovedApprovals = (approverEmail: string) =>
    requests.filter(r =>
      r.approvalHistory.some(h => h.approver === approverEmail && (h.action === 'approved' || h.action === 'forwarded'))
    ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const getRejectedApprovals = (approverEmail: string) =>
    requests.filter(r =>
      r.status === 'rejected' &&
      r.approvalHistory.some(h => h.approver === approverEmail && h.action === 'rejected')
    ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const getMySubmitted = (submitterEmail: string) =>
    requests.filter(r => r.submittedBy === submitterEmail)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // ✅ 批准审批（含金额≥$20k 两级流转逻辑）
  const approveRequest = async (id: string, approver: string, approverName: string, approverRole: string, comment: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    const historyItem: ApprovalHistoryItem = {
      id: crypto.randomUUID(),
      approver, approverName, approverRole,
      action: 'approved',
      comment,
      timestamp: new Date().toISOString(),
    };

    let updated: ApprovalRequest;
    if (req.requiresDirectorApproval && approverRole !== 'Sales_Director') {
      // 主管批准，转发给销售总监
      updated = {
        ...req,
        status: 'forwarded' as ApprovalStatus,
        currentApprover: req.nextApprover!,
        currentApproverRole: req.nextApproverRole || 'Sales_Director',
        approvalHistory: [...req.approvalHistory, historyItem],
      };
    } else {
      // 最终审批通过
      updated = {
        ...req,
        status: 'approved' as ApprovalStatus,
        requiresDirectorApproval: false,
        nextApprover: null,
        nextApproverRole: null,
        approvalHistory: [...req.approvalHistory, historyItem],
      };
    }
    await approvalRecordService.updateStatus(id, updated.status, updated.approvalHistory);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  // ❌ 驳回审批
  const rejectRequest = async (id: string, approver: string, approverName: string, approverRole: string, comment: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const historyItem: ApprovalHistoryItem = {
      id: crypto.randomUUID(),
      approver, approverName, approverRole,
      action: 'rejected', comment,
      timestamp: new Date().toISOString(),
    };
    const updated = { ...req, status: 'rejected' as ApprovalStatus, approvalHistory: [...req.approvalHistory, historyItem] };
    await approvalRecordService.updateStatus(id, 'rejected', updated.approvalHistory);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  // 📨 转交审批
  const forwardRequest = async (id: string, approver: string, approverName: string, approverRole: string, nextApprover: string, nextApproverRole: string, comment: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const historyItem: ApprovalHistoryItem = {
      id: crypto.randomUUID(),
      approver, approverName, approverRole,
      action: 'forwarded', comment,
      timestamp: new Date().toISOString(),
    };
    const updated = {
      ...req,
      status: 'forwarded' as ApprovalStatus,
      currentApprover: nextApprover,
      currentApproverRole: nextApproverRole,
      approvalHistory: [...req.approvalHistory, historyItem],
    };
    await approvalRecordService.updateStatus(id, 'forwarded', updated.approvalHistory);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  // 🚫 取消审批
  const cancelRequest = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, status: 'cancelled' as ApprovalStatus };
    await approvalRecordService.updateStatus(id, 'cancelled', req.approvalHistory);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const getApprovalByDocument = (documentId: string) =>
    requests.find(r => r.relatedDocumentId === documentId);

  return (
    <ApprovalContext.Provider value={{
      requests, loading,
      addApprovalRequest, updateApprovalRequest, getApprovalRequest,
      getPendingApprovals, getApprovedApprovals, getRejectedApprovals, getMySubmitted,
      approveRequest, rejectRequest, forwardRequest, cancelRequest,
      getApprovalByDocument,
    }}>
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApproval() {
  const context = useContext(ApprovalContext);
  if (!context) throw new Error('useApproval must be used within ApprovalProvider');
  return context;
}

export function useOptionalApproval() {
  return useContext(ApprovalContext);
}
