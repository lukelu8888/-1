/**
 * 🔥 销售合同（SC）Context
 * 
 * 功能：
 * - 管理销售合同的创建、审批、签署流程
 * - 与QT报价单一对一关联
 * - 审批流程同QT：< $20,000 主管审批，≥ $20,000 主管+总监两级审批
 * - 支持电子签名
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef as _useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { useApproval } from './ApprovalContext'; // 🔥 新增：监听审批状态
import { useOrders } from './OrderContext'; // 🔥 新增：同步订单到客户端，以及监听客户确认状态
import { getCurrentUser } from '../utils/dataIsolation';
import { addTombstones, filterNotDeleted, listTombstones, removeTombstones } from '../lib/erp-core/deletion-tombstone';
import { salesContractsDb, fromContractRow } from '../lib/supabase-db';
import { contractService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

// 🔥 销售合同产品接口
export interface SalesContractProduct {
  productId: string;
  productName: string;
  specification: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryTime?: string;
}

// 🔥 电子签名接口
export interface ElectronicSignature {
  signedBy: string;        // 签名人姓名
  signedByEmail: string;   // 签名人邮箱
  signedAt: string;        // 签名时间
  signatureData?: string;  // 签名数据（Base64图片）
  ipAddress?: string;      // IP地址
  userAgent?: string;      // 浏览器信息
}

// 🔥 审批流程接口
export interface ContractApprovalFlow {
  requiresDirectorApproval: boolean;  // 是否需要总监审批（≥$20,000）
  currentStep: 'supervisor' | 'director' | 'completed';
  steps: Array<'supervisor' | 'director'>;
}

// 🔥 审批历史记录
export interface ContractApprovalHistory {
  action: 'submitted' | 'approved' | 'rejected' | 'modified';
  actor: string;
  actorRole: 'salesperson' | 'supervisor' | 'director';
  timestamp: string;
  notes?: string;
  amount?: number;
}

// 🔥 销售合同接口
export interface SalesContract {
  // 基本信息
  id: string;                          // 合同ID
  contractNumber: string;              // 合同编号: SC-{REGION}-{YYMMDD}-{序号}
  quotationNumber: string;             // 关联的报价单号（QT）- 一对一
  inquiryNumber?: string;              // 原始询价单号（INQ）
  
  // 客户信息
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: string;
  customerCountry: string;
  contactPerson: string;
  contactPhone: string;
  
  // 业务信息
  salesPerson: string;                 // 业务员邮箱
  salesPersonName: string;             // 业务员姓名
  supervisor?: string;                 // 主管邮箱
  region: 'NA' | 'SA' | 'EA';       // 区域
  
  // 产品信息
  products: SalesContractProduct[];
  
  // 金额和条款
  totalAmount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  tradeTerms: string;                  // FOB/CIF/EXW等
  paymentTerms: string;                // 付款条款
  depositPercentage: number;           // 定金比例（默认30%）
  depositAmount: number;               // 定金金额
  balancePercentage: number;           // 余款比例（默认70%）
  balanceAmount: number;               // 余款金额
  deliveryTime: string;                // 交货期
  portOfLoading: string;               // 装运港
  portOfDestination: string;           // 目的港
  packing: string;                     // 包装要求
  
  // 🔥 状态流转（更新完整流程）
  status: 
    | 'draft'                    // 草稿
    | 'pending_supervisor'       // 待主管审批
    | 'pending_director'         // 待总监审批
    | 'approved'                 // 审批通过
    | 'rejected'                 // 审批驳回
    | 'sent'                     // 已发送给客户
    | 'customer_confirmed'       // 客户已确认
    | 'deposit_uploaded'         // 客户已上传定金凭证
    | 'deposit_confirmed'        // 财务已确认收到定金（可以生成PO）
    | 'po_generated'             // 已生成PO
    | 'production'               // 生产中
    | 'shipped'                  // 已发货
    | 'completed'                // 已完成
    | 'cancelled';               // 已取消
  
  // 审批流程
  approvalFlow: ContractApprovalFlow;
  approvalHistory: ContractApprovalHistory[];
  approvalNotes?: string;              // 提交审批说明
  rejectionReason?: string;            // 驳回原因
  
  // 🔥 定金管理
  depositProof?: {
    fileName: string;              // 凭证文件名
    fileUrl: string;               // 凭证URL（图片/PDF）
    uploadedBy: string;            // 上传人（客户邮箱）
    uploadedAt: string;            // 上传时间
  };
  depositConfirmedBy?: string;     // 财务确认人
  depositConfirmedAt?: string;     // 财务确认时间
  depositConfirmNotes?: string;    // 确认备注
  
  // 🔥 采购订单（PO）
  purchaseOrderNumbers?: string[];  // 关联的PO编号列表
  
  // 电子签名
  sellerSignature?: ElectronicSignature;   // 卖方签名（业务员或授权人）
  buyerSignature?: ElectronicSignature;    // 买方签名（客户）
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;                // 提交审批时间
  approvedAt?: string;                 // 审批通过时间
  sentToCustomerAt?: string;           // 发送给客户时间
  customerConfirmedAt?: string;        // 客户确认时间
  
  // 其他
  remarks?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
}

interface SalesContractContextType {
  contracts: SalesContract[];
  
  // CRUD操作
  createContract: (contractData: Partial<SalesContract>) => SalesContract;
  updateContract: (id: string, updates: Partial<SalesContract>) => void;
  deleteContract: (id: string) => void;
  getContractById: (id: string) => SalesContract | undefined;
  getContractByQuotationNumber: (quotationNumber: string) => SalesContract | undefined;
  getContractByContractNumber: (contractNumber: string) => SalesContract | undefined;
  clearAllContracts: () => void; // 🔥 清空所有合同
  
  // 业务流程
  submitForApproval: (id: string, notes?: string) => void;
  approveContract: (id: string, approverRole: 'supervisor' | 'director', notes?: string) => void;
  rejectContract: (id: string, reason: string, approverRole: 'supervisor' | 'director') => void;
  sendToCustomer: (id: string) => void;
  customerConfirmContract: (id: string, signature: ElectronicSignature) => void;
  customerRejectContract: (id: string, reason: string) => void;
  customerRequestChanges: (id: string, requestedChanges: string) => void;
  
  // 🔥 定金管理
  uploadDepositProof: (id: string, fileName: string, fileUrl: string, uploadedBy: string) => void;
  confirmDeposit: (id: string, confirmedBy: string, notes?: string) => void;
  
  // 🔥 采购订单生成
  generatePurchaseOrder: (id: string) => string[];  // 返回生成的PO编号列表
  
  // 电子签名
  addSellerSignature: (id: string, signature: ElectronicSignature) => void;
  addBuyerSignature: (id: string, signature: ElectronicSignature) => void;

  // 🔥 接口化：手动刷新（用于确保进入订单管理Tab时一定发起请求）
  refreshFromBackend: () => Promise<void>;
}

const SalesContractContext = createContext<SalesContractContextType | undefined>(undefined);

export function SalesContractProvider({ children }: { children: ReactNode }) {
  // 迁移历史 tombstone：将错误写入 order 域的合同删除标记迁移到 contract 域
  useEffect(() => {
    const legacy = listTombstones('order').filter((t) => t.reason === 'manual-delete-sales-contract');
    if (legacy.length === 0) return;
    addTombstones(
      'contract',
      legacy.map((t) => t.marker),
      { reason: 'manual-delete-sales-contract', deletedBy: 'migration' },
    );
    const removed = removeTombstones((t) => t.domain === 'order' && t.reason === 'manual-delete-sales-contract');
    if (removed > 0) {
      console.warn(`⚠️ [SalesContractContext] migrated ${removed} legacy contract tombstones`);
    }
  }, []);

  const filterDeletedContracts = (list: SalesContract[]): SalesContract[] =>
    filterNotDeleted('contract', list, (contract: any) => [
      String(contract?.id || ''),
      String(contract?.contractNumber || ''),
      String(contract?.quotationNumber || ''),
    ]);

  const clearingRef = React.useRef(false);


  const [contracts, setContracts] = useState<SalesContract[]>([]);
  
  // 🔥 获取审批Context（监听审批状态变化）
  const { requests: approvalRequests } = useApproval();
  
  // 🔥 获取订单Context（用于同步订单到客户端，以及监听客户确认状态）
  const { addOrder, orders: allOrders } = useOrders();

  // 🔥 从 Supabase 加载合同列表（Supabase-first）
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (clearingRef.current) return;
      try {
        const data = await contractService.getAll();
        if (!alive || clearingRef.current) return;
        if (Array.isArray(data) && data.length > 0) {
          const filtered = filterDeletedContracts(data as SalesContract[]);
          setContracts(filtered);
        }
      } catch (e: any) {
        console.warn('⚠️ [SalesContractProvider] Supabase 加载合同失败:', e?.message || e);
      }
    };

    void load();

    // 监听 Auth 状态变化，登录后重新加载
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') setContracts([]);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshFromBackend = React.useCallback(async (): Promise<void> => {
    if (clearingRef.current) return;
    try {
      const data = await contractService.getAll();
      if (clearingRef.current) return;
      if (Array.isArray(data) && data.length > 0) {
        const filtered = filterDeletedContracts(data as SalesContract[]);
        setContracts(filtered);
      }
    } catch (e: any) {
      console.warn('⚠️ [SalesContractProvider] refreshFromBackend 失败:', e?.message || e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 🔥 监听客户确认订单，同步更新销售合同状态
  useEffect(() => {
    console.log('🔍 [SalesContractSync-Customer] 订单状态变化，检查客户是否确认合同...');
    console.log('  - 订单数量:', allOrders.length);
    console.log('  - 销售合同数量:', contracts.length);
    
    let hasChanges = false;
    
    setContracts(prev => {
      if (clearingRef.current) return prev;
      const updated = prev.map(contract => {
        const order = allOrders.find(o => o.orderNumber === contract.contractNumber);
        
        if (!order) {
          return contract;
        }
        
        console.log(`  - 检查合同 ${contract.contractNumber}:`, {
          contractStatus: contract.status,
          orderStatus: order.status,
          customerFeedback: order.customerFeedback,
          depositPaymentProof: order.depositPaymentProof
        });
        
        // 🔥 如果客户已确认（Accept），更新合同状态
        if (order.customerFeedback?.status === 'accepted' && 
            contract.status !== 'customer_confirmed' &&
            (contract.status === 'sent' || contract.status === 'approved')) {  // 🔥 修复：允许从approved或sent状态同步
          
          console.log(`  ✅ 客户已确认合同 ${contract.contractNumber}，更新状态为 customer_confirmed`);
          hasChanges = true;
          
          return {
            ...contract,
            status: 'customer_confirmed',
            customerConfirmedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // 🔥 记录客户确认信息
            buyerSignature: {
              signedBy: order.customerFeedback.submittedBy || order.customerEmail || 'Customer',
              signedByEmail: order.customerEmail || '',
              signedAt: new Date(order.customerFeedback.submittedAt || Date.now()).toISOString(),
              signatureData: `Electronically confirmed by ${order.customerFeedback.submittedBy || 'customer'}`
            }
          };
        }
        
        // 🔥 如果客户已上传定金凭证，更新合同状态
        if (order.depositPaymentProof && 
            contract.status === 'customer_confirmed' &&
            !contract.depositProof) {  // 防止重复更新
          
          console.log(`  💰 客户已上传定金凭证 ${contract.contractNumber}，更新状态为 deposit_uploaded`);
          hasChanges = true;
          
          return {
            ...contract,
            status: 'deposit_uploaded',
            updatedAt: new Date().toISOString(),
            // 🔥 记录定金凭证信息
            depositProof: {
              fileName: order.depositPaymentProof.fileName || 'deposit-proof.pdf',
              fileUrl: order.depositPaymentProof.fileUrl || '',
              uploadedBy: order.depositPaymentProof.uploadedBy || order.customerEmail || 'Customer',
              uploadedAt: order.depositPaymentProof.uploadedAt
            }
          };
        }
        
        return contract;
      });
      
      if (hasChanges) {
        console.log('  ✅ 检测到客户确认或定金上传状态变化，更新contracts');
        return updated;
      } else {
        console.log('  - 没有客户确认或定金上传状态变化，保持原状');
        return prev;
      }
    });
  }, [allOrders]); // 🔥 监听订单变化
  
  // 🔥 监听审批状态变化，同步更新销售合同状态
  useEffect(() => {
    console.log('🔍 [SalesContractSync] 审批状态变化，检查是否需要同步...');
    console.log('  - 审批请求数量:', approvalRequests.length);
    console.log('  - 销售合同数量:', contracts.length);
    
    // 遍历所有销售合同类型的审批请求
    const salesContractApprovals = approvalRequests.filter(req => req.type === 'sales_contract');
    console.log('  - 销售合同审批请求:', salesContractApprovals.length);
    
    if (salesContractApprovals.length === 0) {
      console.log('  - 没有销售合同审批请求，无需同步');
      return;
    }
    
    let hasChanges = false;
    
    setContracts(prev => {
      if (clearingRef.current) return prev;
      const updated = prev.map(contract => {
        const approval = salesContractApprovals.find(req => req.relatedDocumentId === contract.contractNumber);
        
        if (!approval) {
          return contract;
        }
        
        console.log(`  - 检查合同 ${contract.contractNumber}:`, {
          contractStatus: contract.status,
          approvalStatus: approval.status,
          currentApproverRole: approval.currentApproverRole
        });
        
        // 🔥 根据审批状态同步合同状态
        let newStatus = contract.status;
        
        if (approval.status === 'pending') {
          // 待审批
          if (approval.currentApproverRole === 'Regional_Manager') {
            newStatus = 'pending_supervisor';
          } else if (approval.currentApproverRole === 'Sales_Director') {
            newStatus = 'pending_director';
          }
        } else if (approval.status === 'forwarded') {
          // 已转发给总监
          newStatus = 'pending_director';
        } else if (approval.status === 'approved') {
          // 审批通过
          newStatus = 'approved';
        } else if (approval.status === 'rejected') {
          // 审批驳回
          newStatus = 'rejected';
        }
        
        // 如果状态有变化，更新合同
        if (newStatus !== contract.status) {
          console.log(`  ✅ 更新合同 ${contract.contractNumber} 状态: ${contract.status} → ${newStatus}`);
          hasChanges = true;
          
          return {
            ...contract,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            ...(newStatus === 'approved' && { approvedAt: new Date().toISOString() })
          };
        }
        
        return contract;
      });
      
      if (hasChanges) {
        console.log('  ✅ 检测到状态变化，更新contracts');
        return updated;
      } else {
        console.log('  - 没有状态变化，保持原状');
        return prev;
      }
    });
  }, [approvalRequests]); // 监听审批请求变化
  
  // Supabase-first: 写操作直接调用 contractService.upsert，不再写 localStorage
  
  // 🔥 生成合同编号
  const normalizeContractRegionCode = (region: string): string => {
    const value = String(region || '').trim().toLowerCase();
    const compact = value.replace(/[\s_-]/g, '');
    if (compact === 'na' || compact === 'northamerica') return 'NA';
    if (compact === 'sa' || compact === 'southamerica') return 'SA';
    if (compact === 'ea' || compact === 'emea' || compact === 'europe&africa' || compact === 'europeafrica') return 'EA';
    return 'NA';
  };

  const generateContractNumber = (region: string): string => {
    const normalizedRegion = normalizeContractRegionCode(region);
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // 计算区域内今天的合同数量
    const todayContracts = contracts.filter(c => {
      const cRegion = c.contractNumber.split('-')[1];
      const cDate = c.contractNumber.split('-')[2];
      return cRegion === normalizedRegion && cDate === dateStr;
    });
    
    const sequence = String(todayContracts.length + 1).padStart(4, '0');
    return `SC-${normalizedRegion}-${dateStr}-${sequence}`;
  };
  
  // 🔥 创建销售合同
  const createContract = (contractData: Partial<SalesContract>): SalesContract => {
    clearingRef.current = false;
    const now = new Date().toISOString();
    
    // 计算金额
    const totalAmount = contractData.totalAmount || 0;
    const depositPercentage = contractData.depositPercentage || 30;
    const balancePercentage = contractData.balancePercentage || 70;
    const depositAmount = totalAmount * (depositPercentage / 100);
    const balanceAmount = totalAmount * (balancePercentage / 100);
    
    // 判断是否需要总监审批
    const requiresDirectorApproval = totalAmount >= 20000;
    
    const newContract: SalesContract = {
      id: `SC-${Date.now()}`,
      contractNumber: generateContractNumber(contractData.region || 'NA'),
      quotationNumber: contractData.quotationNumber || '',
      inquiryNumber: contractData.inquiryNumber,
      
      customerName: contractData.customerName || '',
      customerEmail: contractData.customerEmail || '',
      customerCompany: contractData.customerCompany || '',
      customerAddress: contractData.customerAddress || '',
      customerCountry: contractData.customerCountry || '',
      contactPerson: contractData.contactPerson || '',
      contactPhone: contractData.contactPhone || '',
      
      salesPerson: contractData.salesPerson || '',
      salesPersonName: contractData.salesPersonName || '',
      supervisor: contractData.supervisor,
      region: normalizeContractRegionCode(contractData.region || 'NA'),
      
      products: contractData.products || [],
      
      totalAmount,
      currency: contractData.currency || 'USD',
      tradeTerms: contractData.tradeTerms || 'FOB Xiamen',
      paymentTerms: contractData.paymentTerms || '30% T/T deposit, 70% before shipment',
      depositPercentage,
      depositAmount,
      balancePercentage,
      balanceAmount,
      deliveryTime: contractData.deliveryTime || '25-30 days after deposit received',
      portOfLoading: contractData.portOfLoading || 'Xiamen, China',
      portOfDestination: contractData.portOfDestination || '',
      packing: contractData.packing || 'Export standard carton',
      
      status: 'draft',
      
      approvalFlow: {
        requiresDirectorApproval,
        currentStep: 'supervisor',
        steps: requiresDirectorApproval ? ['supervisor', 'director'] : ['supervisor']
      },
      approvalHistory: [],
      
      createdAt: now,
      updatedAt: now,
      
      remarks: contractData.remarks,
      attachments: contractData.attachments || []
    };
    
    console.log('📝 [SalesContractContext] 创建新合同对象:', newContract);
    console.log('  - 合同编号:', newContract.contractNumber);
    console.log('  - 报价单号:', newContract.quotationNumber);
    console.log('  - 客户邮箱:', newContract.customerEmail);
    console.log('  - 合同总金额:', newContract.totalAmount);
    
    setContracts(prev => [...prev, newContract]);
    toast.success(`销售合同 ${newContract.contractNumber} 创建成功！`);

    // 持久化到 Supabase
    void contractService.upsert(newContract)
      .catch(e => console.warn('⚠️ [createContract] Supabase upsert 失败:', e?.message));
    
    return newContract;
  };
  
  // 🔥 更新合同
  const updateContract = (id: string, updates: Partial<SalesContract>) => {
    setContracts(prev => {
      const next = prev.map(contract => {
        if (contract.id === id) {
          const updated = { ...contract, ...updates, updatedAt: new Date().toISOString() };
          if (updates.totalAmount && updates.totalAmount !== contract.totalAmount) {
            const requiresDirectorApproval = updates.totalAmount >= 20000;
            updated.approvalFlow = {
              requiresDirectorApproval,
              currentStep: 'supervisor',
              steps: requiresDirectorApproval ? ['supervisor', 'director'] : ['supervisor']
            };
          }
          return updated;
        }
        return contract;
      });
      return next;
    });

    toast.success('合同已更新！');

    // 持久化到 Supabase
    const targetContract = contracts.find(c => c.id === id);
    if (targetContract) {
      void contractService.upsert({ ...targetContract, ...updates, updatedAt: new Date().toISOString() })
        .catch(e => console.warn('⚠️ [updateContract] Supabase upsert 失败:', e?.message));
    }
  };
  
  // 🔥 删除合同
  const deleteContract = (id: string) => {
    const target = contracts.find((c) => c.id === id);
    const markers = [
      String(id || ''),
      String(target?.contractNumber || ''),
      String(target?.quotationNumber || ''),
    ].filter(Boolean);
    if (markers.length > 0) {
      addTombstones('contract', markers, {
        reason: 'manual-delete-sales-contract',
        deletedBy: getCurrentUser()?.email || 'unknown',
      });
    }
    // 先乐观删除（并确保 tombstone 过滤生效）
    setContracts(prev => filterDeletedContracts(prev.filter(c => c.id !== id)));
    toast.success('合同已删除！');

    void contractService.delete(id)
      .catch(e => console.warn('⚠️ [deleteContract] Supabase 删除失败:', e?.message));
  };
  
  // 🔥 清空所有合同
  const clearAllContracts = () => {
    clearingRef.current = true;

    if (typeof window !== 'undefined') {
      localStorage.setItem('salesContracts', '[]');
      localStorage.setItem('salesContracts_cleared', Date.now().toString());
      const allKeys = Object.keys(localStorage);
      allKeys.filter(key => key.toLowerCase().includes('contract') && !key.includes('quotation') && key !== 'salesContracts_cleared')
        .forEach(key => localStorage.removeItem(key));
      localStorage.setItem('salesContracts', '[]');
    }

    setContracts([]);
    toast.success('All contracts cleared');
  };
  
  // 🔥 根据ID获取合同
  const getContractById = (id: string) => {
    return contracts.find(c => c.id === id);
  };
  
  // 🔥 根据报价单号获取合同
  const getContractByQuotationNumber = (quotationNumber: string) => {
    return contracts.find(c => c.quotationNumber === quotationNumber);
  };
  
  // 🔥 根据合同编号获取合同
  const getContractByContractNumber = (contractNumber: string) => {
    return contracts.find(c => c.contractNumber === contractNumber);
  };
  
  // 🔥 提交审批
  const submitForApproval = (id: string, notes?: string) => {
    // 先乐观更新 UI
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        const updated = { ...contract };
        updated.status = 'pending_supervisor';
        updated.submittedAt = new Date().toISOString();
        updated.approvalNotes = notes;
        updated.approvalHistory = [...(updated.approvalHistory || []), {
          action: 'submitted',
          actor: contract.salesPersonName,
          actorRole: 'salesperson',
          timestamp: new Date().toISOString(),
          notes,
          amount: contract.totalAmount
        }];
        return updated;
      }
      return contract;
    }));

    // 持久化到 Supabase
    const submittedContract = contracts.find(c => c.id === id);
    if (submittedContract) {
      void contractService.upsert({ ...submittedContract, status: 'pending_supervisor', submittedAt: new Date().toISOString() })
        .catch(e => console.warn('⚠️ [submitForApproval] Supabase upsert 失败:', e?.message));
    }
  };
  
  // 🔥 审批通过
  const approveContract = (id: string, approverRole: 'supervisor' | 'director', notes?: string) => {
    setContracts(prev => {
      const next = prev.map(contract => {
        if (contract.id === id) {
          const updated = { ...contract };
          updated.approvalHistory.push({
            action: 'approved',
            actor: approverRole === 'supervisor' ? '区域主管' : '销售总监',
            actorRole: approverRole,
            timestamp: new Date().toISOString(),
            notes
          });
          if (approverRole === 'supervisor') {
            if (contract.approvalFlow.requiresDirectorApproval) {
              updated.status = 'pending_director';
              updated.approvalFlow.currentStep = 'director';
            } else {
              updated.status = 'approved';
              updated.approvalFlow.currentStep = 'completed';
              updated.approvedAt = new Date().toISOString();
            }
          } else if (approverRole === 'director') {
            updated.status = 'approved';
            updated.approvalFlow.currentStep = 'completed';
            updated.approvedAt = new Date().toISOString();
          }
          return updated;
        }
        return contract;
      });
      return next;
    });

    const contract = contracts.find(c => c.id === id);
    if (contract?.approvalFlow.requiresDirectorApproval && approverRole === 'supervisor') {
      toast.success('主管审批通过！合同已提交给销售总监审批。');
    } else {
      toast.success('合同审批通过！现在可以发送给客户了。');
    }

    // 同步到 Supabase（静默）
    const updatedContract = contracts.find(c => c.id === id);
    if (updatedContract) {
      void contractService.upsert(updatedContract)
        .catch(e => console.warn('⚠️ [approveContract] Supabase 同步失败:', e?.message));
    }
  };
  
  // 🔥 审批驳回
  const rejectContract = (id: string, reason: string, approverRole: 'supervisor' | 'director') => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        const updated = { ...contract };
        updated.status = 'rejected';
        updated.rejectionReason = reason;
        
        // 添加审批历史
        updated.approvalHistory.push({
          action: 'rejected',
          actor: approverRole === 'supervisor' ? '区域主管' : '销售总监',
          actorRole: approverRole,
          timestamp: new Date().toISOString(),
          notes: reason
        });
        
        return updated;
      }
      return contract;
    }));
    
    toast.error('合同已被驳回，请修改后重新提交！');

    // 同步到 Supabase（静默）
    const rejectedContract = contracts.find(c => c.id === id);
    if (rejectedContract) {
      void contractService.upsert({ ...rejectedContract, status: 'rejected', rejectionReason: reason })
        .catch(e => console.warn('⚠️ [rejectContract] Supabase 同步失败:', e?.message));
    }
  };
  
  // 🔥 发送给客户（先调后端接口落库，再刷新列表并同步订单到客户视角）
  const sendToCustomer = async (id: string) => {
    const contract = contracts.find(c => c.id === id);
    console.log('📤 [sendToCustomer] 调用 id:', id);
    console.log('  找到合同:', contract ? contract.contractNumber : '❌未找到');
    console.log('  合同状态:', contract?.status, '| customerEmail:', JSON.stringify(contract?.customerEmail));
    if (!contract || contract.status !== 'approved') {
      console.error('❌ [sendToCustomer] 状态不是approved，实际:', contract?.status);
      toast.error('只能发送审批通过的合同！');
      return;
    }
    // 仅按合同状态判断是否已发送（改回“未发送”后可再次发送，不依赖订单列表）
    if (contract.sentToCustomerAt || contract.status === 'sent_to_customer' || contract.status === 'sent') {
      toast.warning('该合同已发送给客户！请勿重复操作。');
      return;
    }
    // 本地立即执行发送（确保 UI 响应），再异步同步后端
    const doLocalSend = async () => {
      const now = new Date().toISOString();

      // 🔥 确保 customerEmail 有效：从合同、关联报价单、localStorage 多重来源兜底
      const INVALID_EMAILS = new Set(['', 'N/A', 'n/a', 'undefined', 'null', 'customer@example.com']);
      const isValidEmail = (e?: string) => !!e && !INVALID_EMAILS.has(e) && e.includes('@');

      let resolvedCustomerEmail = isValidEmail(contract.customerEmail) ? contract.customerEmail : '';
      console.log(`🔍 [sendToCustomer] 合同customerEmail: "${contract.customerEmail}" → 有效: ${isValidEmail(contract.customerEmail)}`);

      if (!resolvedCustomerEmail) {
        // 方法1：从 Supabase sales_quotations 通过 quotationNumber 查找
        try {
          const { data: qtRows } = await supabase
            .from('sales_quotations')
            .select('customer_email')
            .or(`qt_number.eq.${contract.quotationNumber},id.eq.${contract.quotationNumber}`)
            .limit(1);
          const candidate = qtRows?.[0]?.customer_email;
          if (isValidEmail(candidate)) {
            resolvedCustomerEmail = candidate;
            console.log(`🔍 [sendToCustomer] 方法1 Supabase QT: ${resolvedCustomerEmail}`);
          }
        } catch { /* ignore */ }
      }

      if (!resolvedCustomerEmail) {
        // 方法2：从 Supabase inquiries 通过 inquiryNumber 查找
        try {
          const { data: inqRows } = await supabase
            .from('inquiries')
            .select('user_email, buyer_info')
            .or(`inquiry_number.eq.${contract.inquiryNumber},id.eq.${contract.inquiryNumber}`)
            .limit(1);
          const row = inqRows?.[0];
          const candidate = (row?.buyer_info as any)?.email || row?.user_email;
          if (isValidEmail(candidate)) {
            resolvedCustomerEmail = candidate;
            console.log(`🔍 [sendToCustomer] 方法2 Supabase INQ: ${resolvedCustomerEmail}`);
          }
        } catch { /* ignore */ }
      }

      console.log(`📧 [sendToCustomer] 最终使用客户邮箱: "${resolvedCustomerEmail}"`);

      // 更新合同状态（同时写入已解析的 customerEmail，防止后续操作丢失）
      setContracts(prev => prev.map(c =>
        c.id === contract.id
          ? { ...c, status: 'sent_to_customer' as const, sentToCustomerAt: now, updatedAt: now, customerEmail: resolvedCustomerEmail || c.customerEmail }
          : c
      ));

      // 构建订单数据
      const orderData = {
        id: contract.id,
        orderNumber: contract.contractNumber,
        customer: contract.customerName,
        customerEmail: resolvedCustomerEmail,
        quotationNumber: contract.quotationNumber,
        date: (contract.createdAt || now).split('T')[0],
        expectedDelivery: contract.deliveryTime,
        totalAmount: contract.totalAmount,
        currency: contract.currency,
        status: 'Pending',
        progress: 0,
        products: (contract.products || []).map((p: SalesContractProduct) => ({
          name: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalPrice: p.quantity * p.unitPrice,
          specs: p.specification || ''
        })),
        paymentStatus: 'Pending',
        paymentTerms: contract.paymentTerms,
        shippingMethod: contract.tradeTerms,
        deliveryTerms: contract.tradeTerms,
        region: contract.region,
        country: contract.customerCountry,
        deliveryAddress: contract.customerAddress,
        contactPerson: contract.contactPerson,
        phone: contract.contactPhone,
        createdFrom: 'sales_contract',
        createdAt: contract.createdAt,
        updatedAt: now,
      };

      // 1. 直接写入客户专属 localStorage key，确保客户切换登录后能读到
      if (resolvedCustomerEmail) {
        try {
          const customerKey = `orders_${resolvedCustomerEmail}`;
          const existing: any[] = JSON.parse(localStorage.getItem(customerKey) || '[]');
          const alreadyExists = existing.some((o: any) => o.orderNumber === orderData.orderNumber);
          if (!alreadyExists) {
            existing.unshift(orderData);
            localStorage.setItem(customerKey, JSON.stringify(existing));
            console.log(`✅ [sendToCustomer] 订单已写入 ${customerKey}，当前共 ${existing.length} 条`);
          } else {
            console.log(`ℹ️ [sendToCustomer] 订单 ${orderData.orderNumber} 已存在于 ${customerKey}`);
          }
        } catch (_e) {}
      } else {
        console.error('❌ [sendToCustomer] 无法解析客户邮箱，订单无法写入！合同数据:', contract);
      }

      // 2. 同时走 context addOrder（更新当前 React state）
      addOrder(orderData);

      // 3. 广播事件，触发客户端 OrderContext 重新加载
      window.dispatchEvent(new CustomEvent('ordersUpdated', {
        detail: { action: 'add', orderNumber: orderData.orderNumber, customerEmail: resolvedCustomerEmail }
      }));

      toast.success('合同已发送给客户！客户可在 My Orders → Active Orders 查看。');
    };

    // 直接走本地逻辑（Supabase-first：doLocalSend 内部查 Supabase 获取 email 并 upsert 合同）
    void doLocalSend();
  };
  
  // 🔥 客户确认合同
  const customerConfirmContract = (id: string, signature: ElectronicSignature) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'customer_confirmed',
          buyerSignature: signature,
          customerConfirmedAt: new Date().toISOString()
        };
      }
      return contract;
    }));
    
    toast.success('客户已确认合同！');
  };
  
  // 🔥 客户拒绝合同
  const customerRejectContract = (id: string, reason: string) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'customer_rejected',
          rejectionReason: reason
        };
      }
      return contract;
    }));
    
    toast.error('客户拒绝了合同！');
  };
  
  // 🔥 客户请求修改
  const customerRequestChanges = (id: string, requestedChanges: string) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'customer_requested_changes',
          remarks: `客户修改意见：${requestedChanges}\n\n${contract.remarks || ''}`
        };
      }
      return contract;
    }));
    
    toast.info('客户请求修改合同内容！');
  };
  
  // 🔥 添加卖方签名
  const addSellerSignature = (id: string, signature: ElectronicSignature) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          sellerSignature: signature
        };
      }
      return contract;
    }));
    
    toast.success('卖方签名已添加！');
  };
  
  // 🔥 添加买方签名
  const addBuyerSignature = (id: string, signature: ElectronicSignature) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          buyerSignature: signature
        };
      }
      return contract;
    }));
    
    toast.success('买方签名已添加！');
  };
  
  // 🔥 上传定金凭证
  const uploadDepositProof = (id: string, fileName: string, fileUrl: string, uploadedBy: string) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'deposit_uploaded',
          depositProof: {
            fileName,
            fileUrl,
            uploadedBy,
            uploadedAt: new Date().toISOString()
          }
        };
      }
      return contract;
    }));
    
    toast.success('定金凭证已上传！');
  };
  
  // 🔥 确认定金
  const confirmDeposit = (id: string, confirmedBy: string, notes?: string) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        return {
          ...contract,
          status: 'deposit_confirmed',
          depositConfirmedBy: confirmedBy,
          depositConfirmedAt: new Date().toISOString(),
          depositConfirmNotes: notes
        };
      }
      return contract;
    }));
    
    toast.success('定金已确认！现在可以生成采购订单了。');
  };
  
  // 🔥 生成采购订单
  const generatePurchaseOrder = (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (contract && contract.status === 'deposit_confirmed') {
      const poNumber = `PO-${contract.contractNumber}`;
      contract.purchaseOrderNumbers = [poNumber];
      
      setContracts(prev => prev.map(c => {
        if (c.id === id) {
          return contract;
        }
        return c;
      }));
      
      toast.success(`采购订单 ${poNumber} 已生成！`);
      return [poNumber];
    }
    
    toast.error('无法生成采购订单，请确认定金已收到。');
    return [];
  };
  
  const value: SalesContractContextType = {
    contracts,
    createContract,
    updateContract,
    deleteContract,
    getContractById,
    getContractByQuotationNumber,
    getContractByContractNumber,
    clearAllContracts, // 🔥 清空所有合同
    submitForApproval,
    approveContract,
    rejectContract,
    sendToCustomer,
    customerConfirmContract,
    customerRejectContract,
    customerRequestChanges,
    uploadDepositProof,
    confirmDeposit,
    generatePurchaseOrder,
    addSellerSignature,
    addBuyerSignature,
    refreshFromBackend
  };
  
  return (
    <SalesContractContext.Provider value={value}>
      {children}
    </SalesContractContext.Provider>
  );
}

export function useSalesContracts() {
  const context = useContext(SalesContractContext);
  if (context === undefined) {
    throw new Error('useSalesContracts must be used within a SalesContractProvider');
  }
  return context;
}
