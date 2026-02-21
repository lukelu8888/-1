/**
 * 🔥 销售合同（SC）Context
 * 
 * 功能：
 * - 管理销售合同的创建、审批、签署流程
 * - 与QT报价单一对一关联
 * - 审批流程同QT：< $20,000 主管审批，≥ $20,000 主管+总监两级审批
 * - 支持电子签名
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { useApproval } from './ApprovalContext'; // 🔥 新增：监听审批状态
import { useOrders } from './OrderContext'; // 🔥 新增：同步订单到客户端，以及监听客户确认状态
import { apiFetchJson, getBackendUser } from '../api/backend-auth';
import { getCurrentUser } from '../utils/dataIsolation';

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
  region: 'NA' | 'SA' | 'EMEA';       // 区域
  
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
  const [contracts, setContracts] = useState<SalesContract[]>(() => {
    // 🔥 从localStorage加载数据
    console.log('🔍 [SalesContractProvider] 初始化，从localStorage加载数据...');
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesContracts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('  ✅ 从localStorage加载了', parsed.length, '个合同');
          console.log('  - 合同编号:', parsed.map((c: any) => c.contractNumber));
          return parsed;
        } catch (e) {
          console.error('Failed to parse salesContracts from localStorage:', e);
        }
      } else {
        console.log('  ⚠️ localStorage中没有salesContracts数据');
      }
    }
    return [];
  });
  
  // 🔥 获取审批Context（监听审批状态变化）
  const { requests: approvalRequests } = useApproval();
  
  // 🔥 获取订单Context（用于同步订单到客户端，以及监听客户确认状态）
  const { addOrder, orders: allOrders } = useOrders();

  // 🔥 从后端加载合同列表（用于“订单管理”列表接口化）
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const backendUser = getBackendUser();
        const currentUser = getCurrentUser();
        const asEmail =
          backendUser?.portal_role === 'admin' && currentUser?.email ? `?asEmail=${encodeURIComponent(currentUser.email)}` : '';
        const res = await apiFetchJson<{ contracts: SalesContract[] }>(`/api/sales-contracts${asEmail}`);
        if (!alive) return;
        if (Array.isArray(res?.contracts)) {
          // 避免“本地有数据但后端暂时为空”导致列表瞬间清空
          if (res.contracts.length > 0) {
            setContracts(res.contracts);
          }
          console.log('✅ [SalesContractProvider] 已从后端加载合同数量:', res.contracts.length);
        }
      } catch (e: any) {
        // 不阻断页面：后端不可用时继续使用本地数据
        console.warn('⚠️ [SalesContractProvider] 后端加载合同失败，将继续使用本地数据:', e?.message || e);
      }
    };

    // 首次加载 + 登录后（token变化）重试一次，避免Provider先于登录初始化导致401后不再刷新
    void load();
    const onAuthChanged = () => void load();
    try {
      window.addEventListener('authTokenChanged', onAuthChanged);
    } catch {
      // ignore
    }
    return () => {
      alive = false;
      try {
        window.removeEventListener('authTokenChanged', onAuthChanged);
      } catch {
        // ignore
      }
    };
  }, []);

  const refreshFromBackend = async (): Promise<void> => {
    const backendUser = getBackendUser();
    const currentUser = getCurrentUser();
    const asEmail =
      backendUser?.portal_role === 'admin' && currentUser?.email ? `?asEmail=${encodeURIComponent(currentUser.email)}` : '';
    const res = await apiFetchJson<{ contracts: SalesContract[] }>(`/api/sales-contracts${asEmail}`);
    if (Array.isArray(res?.contracts)) {
      setContracts(res.contracts);
      console.log('✅ [SalesContractProvider] refreshFromBackend contracts:', res.contracts.length);
    }
  };
  
  // 🔥 监听客户确认订单，同步更新销售合同状态
  useEffect(() => {
    console.log('🔍 [SalesContractSync-Customer] 订单状态变化，检查客户是否确认合同...');
    console.log('  - 订单数量:', allOrders.length);
    console.log('  - 销售合同数量:', contracts.length);
    
    let hasChanges = false;
    
    setContracts(prev => {
      const updated = prev.map(contract => {
        // 查找对应的订单（通过合同编号匹配订单编号）
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
      const updated = prev.map(contract => {
        // 查找对应的审批请求
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
  
  // 🔥 保存到localStorage
  React.useEffect(() => {
    console.log('🔍 [SalesContractProvider] contracts变化，保存到localStorage');
    console.log('  - 合同数量:', contracts.length);
    console.log('  - 合同编号:', contracts.map(c => c.contractNumber));
    if (typeof window !== 'undefined') {
      localStorage.setItem('salesContracts', JSON.stringify(contracts));
      console.log('  ✅ 已保存到localStorage');
    }
  }, [contracts]);
  
  // 🔥 生成合同编号
  const generateContractNumber = (region: string): string => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // 计算区域内今天的合同数量
    const todayContracts = contracts.filter(c => {
      const cRegion = c.contractNumber.split('-')[1];
      const cDate = c.contractNumber.split('-')[2];
      return cRegion === region && cDate === dateStr;
    });
    
    const sequence = String(todayContracts.length + 1).padStart(4, '0');
    return `SC-${region}-${dateStr}-${sequence}`;
  };
  
  // 🔥 创建销售合同
  const createContract = (contractData: Partial<SalesContract>): SalesContract => {
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
      region: contractData.region || 'NA',
      
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
    
    // 🔥 更新状态
    setContracts(prev => {
      const updated = [...prev, newContract];
      console.log('📦 [SalesContractContext] 更新contracts状态:');
      console.log('  - 更新前数量:', prev.length);
      console.log('  - 更新后数量:', updated.length);
      console.log('  - 所有合同编号:', updated.map(c => c.contractNumber));
      
      // 🔥 强制同步保存到localStorage（避免React状态异步更新问题）
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('salesContracts', JSON.stringify(updated));
          console.log('✅ [SalesContractContext] 已同步保存到localStorage');
          
          // 验证保存
          const saved = localStorage.getItem('salesContracts');
          if (saved) {
            const parsed = JSON.parse(saved);
            console.log('🔍 [SalesContractContext] 验证保存结果:');
            console.log('  - 保存的合同数量:', parsed.length);
            console.log('  - 保存的合同编号:', parsed.map((c: any) => c.contractNumber));
          }
        } catch (error) {
          console.error('❌ [SalesContractContext] localStorage保存失败:', error);
        }
      }
      
      return updated;
    });
    
    toast.success(`销售合同 ${newContract.contractNumber} 创建成功！`);

    // 🔥 同步落库（不改变现有createContract同步返回的调用方式）
    void (async () => {
      try {
        const res = await apiFetchJson<{ contract: SalesContract; message?: string }>('/api/sales-contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractUid: newContract.id,
            contractNumber: newContract.contractNumber,
            quotationNumber: newContract.quotationNumber,
            inquiryNumber: newContract.inquiryNumber || null,
            region: newContract.region,
            customerName: newContract.customerName,
            customerEmail: newContract.customerEmail,
            customerCompany: newContract.customerCompany,
            customerAddress: newContract.customerAddress || '',
            customerCountry: newContract.customerCountry || '',
            contactPerson: newContract.contactPerson || '',
            contactPhone: newContract.contactPhone || '',
            supervisor: newContract.supervisor || null,
            products: (newContract.products || []).map(p => ({
              productId: p.productId,
              productName: p.productName,
              specification: p.specification,
              hsCode: p.hsCode,
              quantity: p.quantity,
              unit: p.unit,
              unitPrice: p.unitPrice,
              amount: p.amount,
              deliveryTime: p.deliveryTime,
            })),
            totalAmount: newContract.totalAmount,
            currency: newContract.currency,
            tradeTerms: newContract.tradeTerms,
            paymentTerms: newContract.paymentTerms,
            depositPercentage: newContract.depositPercentage,
            depositAmount: newContract.depositAmount,
            balancePercentage: newContract.balancePercentage,
            balanceAmount: newContract.balanceAmount,
            deliveryTime: newContract.deliveryTime,
            portOfLoading: newContract.portOfLoading,
            portOfDestination: newContract.portOfDestination || '',
            packing: newContract.packing,
            remarks: newContract.remarks || null,
            attachments: newContract.attachments || [],
            approvalFlow: newContract.approvalFlow || null,
            approvalHistory: newContract.approvalHistory || [],
          }),
        });

        const serverContract = res?.contract;
        if (serverContract?.id) {
          setContracts(prev => prev.map(c => (c.id === newContract.id ? serverContract : c)));
          console.log('✅ [SalesContractContext] 已同步创建合同到后端:', serverContract.contractNumber);
        }
      } catch (e: any) {
        console.error('❌ [SalesContractContext] 同步创建合同到后端失败:', e?.message || e);
        toast.error(`合同落库失败：${e?.message || '请稍后重试'}`);
      }
    })();
    
    return newContract;
  };
  
  // 🔥 更新合同
  const updateContract = (id: string, updates: Partial<SalesContract>) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        const updated = { ...contract, ...updates, updatedAt: new Date().toISOString() };
        
        // 如果总金额变化，重新计算审批流程
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
    }));
    
    toast.success('合同已更新！');

    // 🔥 同步更新到后端（接口化订单管理列表）
    void (async () => {
      try {
        const payload: any = {};
        if (Object.prototype.hasOwnProperty.call(updates, 'status')) payload.status = (updates as any).status;
        if (Object.prototype.hasOwnProperty.call(updates, 'remarks')) payload.remarks = (updates as any).remarks;
        if (Object.prototype.hasOwnProperty.call(updates, 'approvalFlow')) payload.approvalFlow = (updates as any).approvalFlow;
        if (Object.prototype.hasOwnProperty.call(updates, 'approvalHistory')) payload.approvalHistory = (updates as any).approvalHistory;
        if (Object.prototype.hasOwnProperty.call(updates, 'approvalNotes')) payload.approvalNotes = (updates as any).approvalNotes;
        if (Object.prototype.hasOwnProperty.call(updates, 'rejectionReason')) payload.rejectionReason = (updates as any).rejectionReason;
        if (Object.prototype.hasOwnProperty.call(updates, 'sentToCustomerAt')) payload.sentToCustomerAt = (updates as any).sentToCustomerAt;
        if (Object.prototype.hasOwnProperty.call(updates, 'customerConfirmedAt')) payload.customerConfirmedAt = (updates as any).customerConfirmedAt;
        if (Object.prototype.hasOwnProperty.call(updates, 'purchaseOrderNumbers')) payload.purchaseOrderNumbers = (updates as any).purchaseOrderNumbers;
        if (Object.prototype.hasOwnProperty.call(updates, 'depositProof')) payload.depositProof = (updates as any).depositProof;
        if (Object.prototype.hasOwnProperty.call(updates, 'depositConfirmedBy')) payload.depositConfirmedBy = (updates as any).depositConfirmedBy;
        if (Object.prototype.hasOwnProperty.call(updates, 'depositConfirmedAt')) payload.depositConfirmedAt = (updates as any).depositConfirmedAt;
        if (Object.prototype.hasOwnProperty.call(updates, 'depositConfirmNotes')) payload.depositConfirmNotes = (updates as any).depositConfirmNotes;

        // 没有可同步字段就不请求
        if (Object.keys(payload).length === 0) return;

        const res = await apiFetchJson<{ contract: SalesContract }>('/api/sales-contracts/' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res?.contract?.id) {
          setContracts(prev => prev.map(c => (c.id === id ? res.contract : c)));
        }
      } catch (e: any) {
        console.warn('⚠️ [SalesContractContext] 同步更新合同到后端失败:', e?.message || e);
        toast.error(`合同同步失败：${e?.message || '请稍后重试'}`);
      }
    })();
  };
  
  // 🔥 删除合同
  const deleteContract = (id: string) => {
    // 先乐观删除
    setContracts(prev => prev.filter(c => c.id !== id));
    toast.success('合同已删除！');

    void (async () => {
      try {
        await apiFetchJson<{ message?: string }>('/api/sales-contracts/' + encodeURIComponent(id), {
          method: 'DELETE',
        });
      } catch (e: any) {
        console.warn('⚠️ [SalesContractContext] 后端删除失败，尝试重新拉取:', e?.message || e);
        toast.error(`后端删除失败：${e?.message || '请稍后重试'}`);
        try {
          const res = await apiFetchJson<{ contracts: SalesContract[] }>('/api/sales-contracts');
          if (Array.isArray(res?.contracts)) setContracts(res.contracts);
        } catch {
          // ignore
        }
      }
    })();
  };
  
  // 🔥 清空所有合同
  const clearAllContracts = () => {
    console.log('🔥 [clearAllContracts] 开始清空所有销售合同数据...');
    
    // 清空Context状态
    setContracts([]);
    console.log('  ✅ Context状态已重置为空数组');
    
    // 🔥 清空localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('salesContracts');
      console.log('  ✅ localStorage.salesContracts 已删除');
      
      // 🔥 额外：清空所有包含 'contract' 或 'sales' 的 localStorage 键（防止遗漏）
      const allKeys = Object.keys(localStorage);
      const contractKeys = allKeys.filter(key => 
        key.toLowerCase().includes('contract') || 
        key.toLowerCase().includes('sales')
      );
      
      if (contractKeys.length > 0) {
        console.log(`  - 发现 ${contractKeys.length} 个合同相关的键:`, contractKeys);
        contractKeys.forEach(key => {
          console.log(`    • 删除: ${key}`);
          localStorage.removeItem(key);
        });
      }
    }
    
    toast.success('✅ 所有销售合同已清空！');
    console.log('🔥 [clearAllContracts] 清空完成！');
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

    // 🔥 落库
    void (async () => {
      try {
        const res = await apiFetchJson<{ contract: SalesContract; message?: string }>(
          '/api/sales-contracts/' + encodeURIComponent(id) + '/submit-approval',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: notes || null }),
          }
        );
        if (res?.contract?.id) {
          setContracts(prev => prev.map(c => (c.id === id ? res.contract : c)));
        }
        toast.success('合同已提交审批！');
      } catch (e: any) {
        console.warn('⚠️ [SalesContractContext] 提交审批落库失败:', e?.message || e);
        toast.error(`提交审批失败：${e?.message || '请稍后重试'}`);
        // 失败后尝试刷新回滚到服务端状态
        try {
          await refreshFromBackend();
        } catch {
          // ignore
        }
      }
    })();
  };
  
  // 🔥 审批通过
  const approveContract = (id: string, approverRole: 'supervisor' | 'director', notes?: string) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === id) {
        const updated = { ...contract };
        
        // 添加审批历史
        updated.approvalHistory.push({
          action: 'approved',
          actor: approverRole === 'supervisor' ? '区域主管' : '销售总监',
          actorRole: approverRole,
          timestamp: new Date().toISOString(),
          notes
        });
        
        // 更新状态和审批流程
        if (approverRole === 'supervisor') {
          if (contract.approvalFlow.requiresDirectorApproval) {
            // 需要总监审批，流转到总监
            updated.status = 'pending_director';
            updated.approvalFlow.currentStep = 'director';
          } else {
            // 不需要总监审批，直接完成
            updated.status = 'approved';
            updated.approvalFlow.currentStep = 'completed';
            updated.approvedAt = new Date().toISOString();
          }
        } else if (approverRole === 'director') {
          // 总监审批通过，完成审批
          updated.status = 'approved';
          updated.approvalFlow.currentStep = 'completed';
          updated.approvedAt = new Date().toISOString();
        }
        
        return updated;
      }
      return contract;
    }));
    
    const contract = contracts.find(c => c.id === id);
    if (contract?.approvalFlow.requiresDirectorApproval && approverRole === 'supervisor') {
      toast.success('主管审批通过！合同已提交给销售总监审批。');
    } else {
      toast.success('合同审批通过！现在可以发送给客户了。');
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
  };
  
  // 🔥 发送给客户（先调后端接口落库，再刷新列表并同步订单到客户视角）
  const sendToCustomer = async (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract || contract.status !== 'approved') {
      toast.error('只能发送审批通过的合同！');
      return;
    }
    // 仅按合同状态判断是否已发送（改回“未发送”后可再次发送，不依赖订单列表）
    if (contract.sentToCustomerAt || contract.status === 'sent_to_customer' || contract.status === 'sent') {
      toast.warning('该合同已发送给客户！请勿重复操作。');
      return;
    }
    try {
      const res = await apiFetchJson<{ message: string; contract: SalesContract }>(
        `/api/sales-contracts/${encodeURIComponent(contract.id)}/send-to-customer`,
        { method: 'PATCH' }
      );
      if (!res?.contract) {
        toast.error(res?.message || '发送失败');
        return;
      }
      await refreshFromBackend();
      const orderData = {
        id: res.contract.id,
        orderNumber: res.contract.contractNumber,
        customer: res.contract.customerName,
        customerEmail: res.contract.customerEmail,
        quotationNumber: res.contract.quotationNumber,
        date: (res.contract.createdAt || '').split('T')[0],
        expectedDelivery: res.contract.deliveryTime,
        totalAmount: res.contract.totalAmount,
        currency: res.contract.currency,
        status: 'Pending',
        progress: 0,
        products: (res.contract.products || []).map((p: SalesContractProduct) => ({
          name: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalPrice: p.quantity * p.unitPrice,
          specs: p.specification || ''
        })),
        paymentStatus: 'Pending',
        paymentTerms: res.contract.paymentTerms,
        shippingMethod: res.contract.tradeTerms,
        deliveryTerms: res.contract.tradeTerms,
        region: res.contract.region,
        country: res.contract.customerCountry,
        deliveryAddress: res.contract.customerAddress,
        contactPerson: res.contract.contactPerson,
        phone: res.contract.contactPhone,
        createdFrom: 'sales_contract',
        createdAt: res.contract.createdAt,
        updatedAt: new Date().toISOString()
      };
      // 写入后端，客户在任意设备登录都能在 Active Orders 看到
      await apiFetchJson<{ order: unknown }>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          shippingMethod: orderData.shippingMethod || orderData.deliveryTerms,
          deliveryTerms: orderData.deliveryTerms || orderData.shippingMethod,
        }),
      });
      addOrder(orderData);
      toast.success('合同已发送给客户！客户可在 My Orders → Active Orders 查看。');
    } catch (e: any) {
      console.error('❌ [sendToCustomer]', e);
      toast.error(e?.message || '发送失败，请重试！');
    }
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