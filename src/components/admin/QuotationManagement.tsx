import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '../ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card } from '../ui/card';
import { 
  Search, Eye, Send, CheckCircle2, XCircle, Clock, DollarSign, 
  Package, Calendar, TrendingUp, Zap, ArrowRight, AlertCircle, FileText, Edit, Trash2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useOrders } from '../../contexts/OrderContext';
import { useQuotations } from '../../contexts/QuotationContext';
import { useInquiry } from '../../contexts/InquiryContext'; // 🔥 导入InquiryContext
import { sendNotificationToUser } from '../../contexts/NotificationContext'; // 🆕 导入通知功能
import { getCurrentUser } from '../../data/authorizedUsers'; // 🆕 获取当前用户信息
import EditQuotationDialog from './EditQuotationDialog';
import ViewQuotationDialog from './ViewQuotationDialog';
import NegotiationDialog from './NegotiationDialog';
import { CompactStatCard } from './CompactStatCard'; // 🎨 导入紧凑型统计卡片

// 报价接口
export interface Quotation {
  id: string;
  quotationNumber: string;
  inquiryId: string;
  inquiryNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  region?: string; // 🌍 区域属性（从询价继承）
  products: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specs: string;
    image?: string;
    sku?: string;
    productName?: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  quotationDate: string;
  status: 'draft' | 'sent' | 'confirmed' | 'rejected' | 'expired' | 'converted' | 'negotiating' | 'pending_supervisor' | 'pending_director' | 'approved'; // 🔥 添加审批状态
  notes: string;
  // 🔥 审批流程字段
  approvalFlow?: {
    requiresDirectorApproval: boolean;
    currentStep: 'supervisor' | 'director' | 'completed';
    steps: string[];
  };
  approvalHistory?: Array<{
    action: string;
    actor: string;
    actorRole: string;
    timestamp: string;
    notes: string;
    amount?: number;
    decision?: 'approved' | 'rejected';
  }>;
  approvalNotes?: string;
  confirmedDate?: string;
  confirmedBy?: string;
  // 🆕 B2B专业条款字段
  tradeTerms?: string;        // 贸易条款: FOB Xiamen, EXW Factory, CIF, CNF
  portOfLoading?: string;     // 装运港: Xiamen, Shanghai, etc.
  packing?: string;           // 包装方式: Export standard carton with wooden pallet
  warranty?: string;          // 质保条款: 12 months from delivery date
  inspection?: string;        // 检验标准: Seller's factory inspection
  // 🆕 客户反馈相关字段
  customerFeedback?: {
    status: 'accepted' | 'rejected' | 'negotiating'; // 客户反馈状态
    message?: string; // 客户反馈留言
    submittedAt: number; // 反馈提交时间
    submittedBy: string; // 反馈提交人邮箱
  };
  // 🆕 报价修订历史
  revisions?: {
    revisionNumber: number; // 修订版本号
    revisedAt: number; // 修订时间
    revisedBy: string; // 修订人
    reason: string; // 修订原因
    changes: string; // 变更说明
  }[];
  revisionNumber?: number; // 当前修订版本号，默认为1
}

interface QuotationManagementProps {
  selectedInquiry?: any | null;
  onQuotationSent?: (quotation: Quotation) => void;
  onQuotationConfirmed?: (quotation: Quotation) => void;
  onOrderCreated?: (quotation: Quotation, orderNumber: string) => void;
  onQuotationCreated?: () => void; // 报价创建完成后的回调
}

export default function QuotationManagement({ 
  selectedInquiry,
  onQuotationSent,
  onQuotationConfirmed,
  onOrderCreated,
  onQuotationCreated
}: QuotationManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<{ id: string; number: string } | null>(null);
  const [negotiationQuotation, setNegotiationQuotation] = useState<Quotation | null>(null);
  
  // 🎯 多维度筛选状态 (老板角色专用)
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  
  // 🔥 批量选择和删除状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const { addOrder, orders } = useOrders();
  const { addQuotation, quotations, updateQuotation, deleteQuotation } = useQuotations();
  const { inquiries, updateInquiryStatus } = useInquiry(); // 🔥 获取所有询价和更新状态方法

  // 🌍 Get current user region from localStorage
  const [currentUserRegion, setCurrentUserRegion] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // 🗺️ Region mapping: convert short codes to full names
  const regionCodeToFullName = (code: string | null): string | null => {
    if (!code) return null;
    const mapping: Record<string, string> = {
      'NA': 'North America',
      'SA': 'South America',
      'EA': 'Europe & Africa',
      'EMEA': 'Europe & Africa', // 兼容旧数据
      'all': 'all'
    };
    return mapping[code] || code;
  };

  useEffect(() => {
    const loadUserInfo = () => {
      const currentUserStr = localStorage.getItem('cosun_current_user');
      console.log('🔍 [QuotationManagement] localStorage中的current_user:', currentUserStr);
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          // Convert region code to full name
          const fullRegionName = regionCodeToFullName(currentUser.region);
          setCurrentUserRegion(fullRegionName);
          setCurrentUserRole(currentUser.userRole || currentUser.role || null);
          console.log('✅ [QuotationManagement] 当前用户区域代码:', currentUser.region);
          console.log('✅ [QuotationManagement] 转换后的完整区域名:', fullRegionName);
          console.log('✅ [QuotationManagement] 当前用户角色:', currentUser.userRole || currentUser.role);
          console.log('✅ [QuotationManagement] 当前用户:', currentUser.email);
          
          // 🔥 调试：打印所有报价相关的localStorage keys
          console.log('\n📊 [QuotationManagement] === localStorage报价数据调试 ===');
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('quotations_')) {
              const data = localStorage.getItem(key);
              if (data) {
                try {
                  const quotations = JSON.parse(data);
                  console.log(`  - ${key}: ${quotations.length} 条报价`);
                  quotations.forEach((q: any) => {
                    console.log(`    • ${q.quotationNumber} - 客户: ${q.customerEmail} - 区域: ${q.region}`);
                  });
                } catch (e) {
                  console.log(`  - ${key}: 解析失败`);
                }
              }
            }
          }
          console.log('='.repeat(60) + '\n');
        } catch (e) {
          console.error('❌ [QuotationManagement] Failed to parse current user:', e);
        }
      } else {
        console.error('❌ [QuotationManagement] localStorage中没有cosun_current_user');
      }
    };

    // Load on mount
    loadUserInfo();

    // Listen for user change events
    const handleUserChange = () => {
      console.log('🔄 [QuotationManagement] 检测到用户切换事件');
      loadUserInfo();
    };

    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('storage', handleUserChange);

    return () => {
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, []);

  // 从询价创建报价 - 使用 useCallback 避免依赖问题
  const handleCreateQuotation = useCallback((inquiry: any) => {
    console.log('🎯 QuotationManagement: handleCreateQuotation 被调用');
    console.log('📋 收到的询价对象:', inquiry);
    
    // 🔥 数据验证：检查关键字段
    const customerEmail = inquiry.userEmail || inquiry.buyerInfo?.email || inquiry.customerEmail;
    
    console.log('='.repeat(80));
    console.log('🔍 [报价创建调试] 开始创建报价');
    console.log('  - 询价单号:', inquiry.id);
    console.log('  - 客户邮箱 (inquiry.userEmail):', inquiry.userEmail);
    console.log('  - 客户邮箱 (inquiry.buyerInfo?.email):', inquiry.buyerInfo?.email);
    console.log('  - 客户邮箱 (inquiry.customerEmail):', inquiry.customerEmail);
    console.log('  - 最终客户邮箱 (customerEmail):', customerEmail);
    console.log('='.repeat(80));
    
    if (!customerEmail || customerEmail === 'N/A') {
      console.error('❌ 询价单缺少客户邮箱信息！');
      console.error('  - inquiry.userEmail:', inquiry.userEmail);
      console.error('  - inquiry.buyerInfo?.email:', inquiry.buyerInfo?.email);
      console.error('  - inquiry.customerEmail:', inquiry.customerEmail);
      
      toast.error('无法创建报价：询价单缺少客户邮箱信息', {
        description: '请先补充询价单的客户邮箱信息，或手动输入客户邮箱',
        duration: 5000
      });
      
      // 🔧 提供手动修复选项
      const manualEmail = prompt('请手动输入客户邮箱地址：');
      if (!manualEmail || !manualEmail.includes('@')) {
        toast.error('邮箱地址无效或未输入');
        return;
      }
      
      // 手动设置邮箱
      inquiry.userEmail = manualEmail;
      if (inquiry.buyerInfo) {
        inquiry.buyerInfo.email = manualEmail;
      } else {
        inquiry.buyerInfo = { email: manualEmail };
      }
      
      toast.success(`已设置客户邮箱为: ${manualEmail}`);
    }

    // 从询价编号提取区域代码
    const region = inquiry.id.split('-')[1] || 'NA'; // e.g., "RFQ-NA-251130-0001" -> "NA"
    console.log('🌍 从询价单号提取的区域代码:', region);
    
    // 检查是否已经为这个询价创建过报价（草稿或已发送状态）
    const existingQuotation = quotations.find(q => 
      q.inquiryId === inquiry.id && 
      (q.status === 'draft' || q.status === 'sent')
    );
    
    if (existingQuotation) {
      console.log('⚠️ 已存在报价，直接打开编辑:', existingQuotation);
      // 直接打开已存在的报价进行编辑
      setIsCreatingQuotation(true);
      setViewQuotation(existingQuotation);
      
      toast.info('该询价已有报价', {
        description: `报价编号: ${existingQuotation.quotationNumber}，继续编辑`,
        duration: 3000
      });
      
      return;
    }
    
    // 🗓️ 生成日期部分 (YYMMDD)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    
    // 🔢 生成序列号：统计今天同区域的报价数量
    // 🔥 修正：序列号应该是累计的，不应该每天重置
    const allRegionQuotations = quotations.filter(q => {
      const qRegion = q.quotationNumber.split('-')[1];
      return qRegion === region;
    });
    const sequence = String(allRegionQuotations.length + 1).padStart(4, '0');
    
    console.log(`📊 [生成报价编号] 区域=${region}, 历史报价数=${allRegionQuotations.length}, 新序列号=${sequence}`);
    
    // ✅ 生成区域化报价编号: QUO-{REGION}-YYMMDD-XXXX
    const quotationNumber = `QUO-${region}-${dateStr}-${sequence}`;
    
    const today = new Date().toISOString().split('T')[0];
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    
    // 创建新报价
    const newQuotation: Quotation = {
      id: `QUO-${Date.now()}`,
      quotationNumber: quotationNumber,
      inquiryId: inquiry.id,
      inquiryNumber: inquiry.id, // 🔥 使用 inquiry.id 而不是 inquiry.inquiryNumber
      customer: inquiry.buyerInfo?.companyName || inquiry.buyerInfo?.contactPerson || 'N/A',
      customerName: inquiry.buyerInfo?.companyName || inquiry.buyerInfo?.contactPerson || 'N/A',
      customerEmail: customerEmail, // 🔥 修复：优先使用inquiry.userEmail
      region: region, // 🌍 添加区域属性
      products: inquiry.products.map((p: any) => ({
        name: p.name || p.productName,
        productName: p.productName || p.name,
        sku: p.sku || 'N/A',
        quantity: p.quantity,
        unitPrice: p.unitPrice || 0,
        totalPrice: (p.unitPrice || 0) * p.quantity,
        specs: p.specs || '',
        image: p.image || ''
      })),
      subtotal: 0,
      discount: 0,
      tax: 0,
      totalAmount: 0,
      currency: 'USD',
      validUntil: validDate.toISOString().split('T')[0],
      paymentTerms: '30% T/T预付，70%见提单副本付款',
      deliveryTerms: 'FOB Shenzhen, 15-20个工作日',
      quotationDate: today,
      status: 'draft',
      notes: `基于询价 ${inquiry.id} 创建`
    };

    // 🐛 调试日志
    console.log('✅ 新报价已创建:', newQuotation);
    console.log('📧 客户邮箱:', newQuotation.customerEmail);
    console.log('📋 询价信息 - userEmail:', inquiry.userEmail);
    console.log('📋 询价信息 - buyerInfo:', inquiry.buyerInfo);
    console.log('🌍 报价区域:', region, '(从询价单号提取)');
    
    // 添加到Context
    addQuotation(newQuotation);
    
    // 打开编辑对话框
    setIsCreatingQuotation(true);
    setViewQuotation(newQuotation);
    
    toast.success('报价已创建！', {
      description: `报价编号: ${quotationNumber}，请补充价格信息`,
      duration: 3000
    });

    // 触发报价创建完成后的回调
    if (onQuotationCreated) {
      onQuotationCreated();
    }
  }, [quotations, addQuotation, onQuotationCreated]);

  // 监听selectedInquiry变化，自动创建报价
  useEffect(() => {
    if (selectedInquiry) {
      console.log('🎯 QuotationManagement: 接收到selectedInquiry:', selectedInquiry);
      console.log('📝 开始自动创建报价...');
      
      // 自动创建报价
      handleCreateQuotation(selectedInquiry);
    }
  }, [selectedInquiry, handleCreateQuotation]);

  // 统计数据
  const stats = {
    total: quotations.length,
    sent: quotations.filter(q => q.status === 'sent').length,
    confirmed: quotations.filter(q => q.status === 'confirmed').length,
    totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
  };

  // 🌍 Filter quotations by user region
  // 🔥 修复：只要用户有具体区域（不是'all'或null），就进行区域过滤
  // 无论角色是Sales_Rep、Regional_Manager还是普通业务员(admin + region)
  const shouldFilterByRegion = currentUserRegion && currentUserRegion !== 'all';
  
  const regionFilteredQuotations = shouldFilterByRegion
    ? quotations.filter(q => {
        // 🔥 修复：无论region字段是什么格式，都尝试转换
        // 1. 优先使用q.region字段
        // 2. 如果q.region是短代码（NA/SA/EA），转换为全称
        // 3. 如果q.region为空，从报价编号中提取
        let quotationRegion = q.region;
        
        // 如果region存在，尝试转换（可能是短代码）
        if (quotationRegion) {
          const converted = regionCodeToFullName(quotationRegion);
          quotationRegion = converted || quotationRegion; // 转换失败则保持原值
        } else {
          // region为空从报价编号中提取
          const regionCode = q.quotationNumber.split('-')[1];
          quotationRegion = regionCode ? regionCodeToFullName(regionCode) : null;
        }
        
        const matches = quotationRegion === currentUserRegion;
        console.log(`🔍 [报价区域过滤] 报价 ${q.quotationNumber}`);
        console.log(`  - 原始region字段: "${q.region}"`);
        console.log(`  - 转换后的区域: "${quotationRegion}"`);
        console.log(`  - 用户区域: "${currentUserRegion}"`);
        console.log(`  - 匹配结果: ${matches ? '✅ 通过' : '❌ 不通过'}`);
        return matches;
      })
    : quotations; // No region or 'all' region can see all quotations

  console.log(`📊 [区域过滤-报价] 总报价数: ${quotations.length} | 过滤后: ${regionFilteredQuotations.length} | 用户角色: ${currentUserRole} | 用户区域: ${currentUserRegion} | 需要过滤: ${shouldFilterByRegion ? '是' : '否'}`);
  
  // 🔥 额外调试：打印所有报价的详细信息
  console.log('🔍 [QuotationManagement] 所有报价列表:', quotations.map(q => ({
    quotationNumber: q.quotationNumber,
    region: q.region,
    customerEmail: q.customerEmail,
    status: q.status
  })));

  // 过滤报价
  const filteredQuotations = regionFilteredQuotations.filter(quotation => {
    const matchesSearch = (quotation.customerName || quotation.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quotation.quotationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quotation.status === filterStatus;
    
    // 🎯 多维度筛选
    const matchesRegion = filterRegion === 'all' || quotation.region === filterRegion;
    const matchesCustomer = filterCustomer === 'all' || quotation.customerName === filterCustomer || quotation.customer === filterCustomer;
    
    return matchesSearch && matchesFilter && matchesRegion && matchesCustomer;
  });
  
  // 🎯 从数据中提取唯一值用于筛选选项
  const uniqueCustomers = [...new Set(regionFilteredQuotations.map(q => q.customerName || q.customer).filter(Boolean))];

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: '待核价', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
      draft: { label: '草稿', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText },
      sent: { label: '已发送', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
      confirmed: { label: '已确认', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      rejected: { label: '已拒绝', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
      expired: { label: '已过期', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock },
      converted: { label: '已转订单', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
      negotiating: { label: '协商中', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle }
    };
    return configs[status as keyof typeof configs] || { label: status || '未知', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle };
  };

  // 模拟客户确认报价
  const handleSimulateCustomerConfirm = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return;

    updateQuotation(quotationId, {
      status: 'confirmed' as const,
      confirmedDate: new Date().toISOString().split('T')[0],
      confirmedBy: 'Customer'
    });

    toast.success('客户已确认报价！', {
      description: `可以将 ${quotation.quotationNumber} 下推生成订单`,
      duration: 5000
    });

    if (onQuotationConfirmed) {
      onQuotationConfirmed(quotation);
    }
  };

  // 下推生成订单
  const handleConvertToOrder = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) {
      toast.error('错误', { description: '找不到报价信息' });
      return;
    }

    console.log('🚀 ========================================');
    console.log('🚀 开始下推订单流程');
    console.log('🚀 ========================================');
    console.log('  - 报价单ID:', quotationId);
    console.log('  - 报价单号:', quotation.quotationNumber);
    console.log('  - 客户名称:', quotation.customerName);
    console.log('  - 客户邮箱:', quotation.customerEmail);
    console.log('  - 报价区域:', quotation.region);
    console.log('  - 报价金额:', quotation.totalAmount, quotation.currency);
    console.log('  - 产品数量:', quotation.products?.length || 0);

    // 🔥 验证customerEmail是否有效
    if (!quotation.customerEmail || quotation.customerEmail === 'N/A') {
      console.error('❌ customerEmail无效:', quotation.customerEmail);
      
      // 🔥 智能修复：尝试从客户名称生成一个有效的邮箱
      const generatedEmail = `${quotation.customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@customer.example.com`;
      console.log('🔧 [智能修复] 自动生成邮箱地址:', generatedEmail);
      
      // 更新报价单的customerEmail
      updateQuotation(quotationId, { customerEmail: generatedEmail });
      
      // 使用生成的邮箱继续创建订单
      quotation.customerEmail = generatedEmail;
      
      toast.warning('已自动修复客户邮箱', { 
        description: `原始邮箱无效，已自动生成: ${generatedEmail}` 
      });
    }

    // 🌍 从报价单号中提取区域代码 (QUO-NA-250121-0001 => NA)
    const region = quotation.quotationNumber.split('-')[1] || 'NA'; // 默认 NA
    
    console.log('  - 提取区域代码:', region);
    
    // 🗓️ 生成日期部分 (YYMMDD)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    
    // 🔢 生成序列号：统计今天同区域的订单数量
    // 🔥 修正：序列号应该是累计的，不应该每天重置
    const allRegionOrders = orders.filter(o => {
      const oRegion = o.orderNumber.split('-')[1];
      return oRegion === region;
    });
    const sequence = String(allRegionOrders.length + 1).padStart(4, '0');
    
    console.log(`📊 [生成订单编号] 区域=${region}, 历史订单数=${allRegionOrders.length}, 新序列号=${sequence}`);
    
    // ✅ 生成区域化订单编号: SC-{REGION}-YYMMDD-XXXX
    const orderNumber = `SC-${region}-${dateStr}-${sequence}`;
    
    const today = new Date().toISOString().split('T')[0];
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 45);
    
    // 🌍 区域代码映射到完整名称
    const regionMapping: Record<string, string> = {
      'NA': 'North America',
      'SA': 'South America',
      'EA': 'Europe & Africa',
      'EMEA': 'Europe & Africa'
    };
    const fullRegionName = regionMapping[region] || quotation.region || 'Other';
    
    console.log('🔄 [下推订单] 报价单数据:', {
      quotationNumber: quotation.quotationNumber,
      region: region,
      fullRegionName: fullRegionName,
      customerEmail: quotation.customerEmail,
      customerName: quotation.customerName
    });
    
    // 创建新订单
    const newOrder = {
      id: `SC-${Date.now()}`,
      orderNumber: orderNumber,
      customer: quotation.customerName,
      customerEmail: quotation.customerEmail,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      date: today,
      expectedDelivery: deliveryDate.toISOString().split('T')[0],
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
      status: 'Pending' as const,
      progress: 0,
      products: quotation.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice,
        specs: p.specs,
        produced: 0
      })),
      paymentStatus: 'Pending Payment',
      paymentTerms: quotation.paymentTerms,
      shippingMethod: 'Sea Freight',
      deliveryTerms: quotation.deliveryTerms,
      notes: quotation.notes,
      region: fullRegionName, // 🌍 传递完整区域名称
      createdFrom: 'quotation' as const,
      createdAt: new Date().toISOString()
    };

    console.log('✅ [下推订单] 新订单对象:', newOrder);
    console.log('  - 订单编号:', newOrder.orderNumber);
    console.log('  - 客户邮箱:', newOrder.customerEmail);
    console.log('  - 区域信息:', newOrder.region);

    // 添加订单
    console.log('🔄 [下推订单] 调用 addOrder...');
    try {
      addOrder(newOrder);
      console.log('✅ [下推订单] addOrder 调用成功');
    } catch (error) {
      console.error('❌ [下推订单] addOrder 调用失败:', error);
      toast.error('订单创建失败', { description: String(error) });
      return;
    }

    // 更新报价状态为已转订单
    console.log('🔄 [下推订单] 更新报价状态为 converted...');
    updateQuotation(quotationId, { status: 'converted' as const });

    console.log('🎉 [下推订单] 流程完成！');
    console.log('🚀 ========================================\n');

    toast.success('订单生成成功！', {
      description: `订单编号: ${orderNumber}，已添加到订单管理`,
      duration: 4000
    });

    if (onOrderCreated) {
      onOrderCreated(quotation, orderNumber);
    }
  };

  // 编辑草稿报价
  const handleEditDraft = (quotation: Quotation) => {
    setIsCreatingQuotation(true);
    setViewQuotation(quotation);
  };

  // 删除草稿报价
  const handleDeleteDraft = (quotationId: string, quotationNumber: string) => {
    setDeleteDialogOpen(true);
    setQuotationToDelete({ id: quotationId, number: quotationNumber });
  };

  const handleConfirmDelete = () => {
    if (quotationToDelete) {
      deleteQuotation(quotationToDelete.id);
      toast.success('报价已删除', {
        description: `删除报价 ${quotationToDelete.number}`,
        duration: 2000
      });
    }
    setDeleteDialogOpen(false);
    setQuotationToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuotationToDelete(null);
  };

  // 🔥 提交审核处理函数
  const handleSubmitForApproval = (quotation: Quotation) => {
    console.log('📤 提交报价审核:', quotation);
    
    // 判断审批流程
    const requiresDirectorApproval = quotation.totalAmount >= 20000;
    
    // 创建审批流程信息
    const approvalFlow = {
      requiresDirectorApproval,
      currentStep: 'supervisor' as const,
      steps: requiresDirectorApproval ? ['supervisor', 'director'] : ['supervisor']
    };
    
    // 创建审批历史
    const approvalHistory = [
      {
        action: 'submitted',
        actor: getCurrentUser()?.name || '业务员',
        actorRole: 'salesperson',
        timestamp: new Date().toISOString(),
        notes: quotation.approvalNotes || quotation.notes || '提交审核',
        amount: quotation.totalAmount
      }
    ];
    
    // 更新报价状态
    updateQuotation(quotation.id, {
      status: 'pending_supervisor' as any,
      approvalFlow,
      approvalHistory
    });
    
    // 显示审批流程提示
    const approvalMessage = requiresDirectorApproval
      ? `报价总额：$${quotation.totalAmount.toLocaleString()} (≥ $20,000)\n\n审批流程：\n1️⃣ 区域业务主管审核\n2️⃣ 销售总监审核\n\n两级审批全部通过后，您才能发送给客户。`
      : `报价总额：$${quotation.totalAmount.toLocaleString()} (< $20,000)\n\n审批流程：\n1️⃣ 区域业务主管审核\n\n主管审批通过后，您即可发送给客户。`;
    
    toast.success('报价已提交审核！', {
      description: approvalMessage,
      duration: 6000
    });
    
    console.log('✅ 报价审核提交成功:', {
      quotationNumber: quotation.quotationNumber,
      totalAmount: quotation.totalAmount,
      requiresDirectorApproval,
      approvalFlow,
      approvalHistory
    });
  };

  // 🔥 新增：申请复核处理函数（用于已发送/已确认的报价）
  const handleSubmitForReview = (quotation: Quotation) => {
    console.log('📤 申请报价复核:', quotation);
    
    // 判断复核流程
    const requiresDirectorReview = quotation.totalAmount >= 20000;
    
    // 创建复核流程信息
    const approvalFlow = {
      requiresDirectorApproval: requiresDirectorReview,
      currentStep: 'supervisor' as const,
      steps: requiresDirectorReview ? ['supervisor', 'director'] : ['supervisor']
    };
    
    // 创建复核历史
    const approvalHistory = [
      {
        action: 'review_requested',
        actor: getCurrentUser()?.name || '业务员',
        actorRole: 'salesperson',
        timestamp: new Date().toISOString(),
        notes: '申请复核已发送的报价',
        amount: quotation.totalAmount
      }
    ];
    
    // 更新报价状态为待复核
    updateQuotation(quotation.id, {
      status: 'pending_supervisor' as any,
      approvalFlow,
      approvalHistory
    });
    
    // 显示复核流程提示
    const reviewMessage = requiresDirectorReview
      ? `💰 报价金额：$${quotation.totalAmount.toLocaleString()} (≥ $20,000)\n\n📋 复核流程：\n1️⃣ 区域业务主管复核\n2️⃣ 销售总监复核\n\n✅ 双重复核通过后，报价将恢复为已发送状态。`
      : `💰 报价金额：$${quotation.totalAmount.toLocaleString()} (< $20,000)\n\n📋 复核流程：\n1️⃣ 区域业务主管复核\n\n✅ 主管复核通过后，报价将恢复为已发送状态。`;
    
    toast.success('✅ 复核申请已提交！', {
      description: reviewMessage,
      duration: 6000
    });
    
    console.log('✅ 报价复核申请成功:', {
      quotationNumber: quotation.quotationNumber,
      totalAmount: quotation.totalAmount,
      requiresDirectorReview,
      approvalFlow,
      approvalHistory
    });
  };

  // 🔥 批量删除处理函数
  const handleBulkDelete = () => {
    const visibleSelectedIds = Array.from(selectedIds).filter((id) =>
      filteredQuotations.some((quotation) => quotation.id === id),
    );

    if (visibleSelectedIds.length === 0) {
      toast.error('请先选择要删除的报价单');
      return;
    }

    if (window.confirm(`确认要删除选中的 ${visibleSelectedIds.length} 条报价单吗？此操作无法撤销！`)) {
      visibleSelectedIds.forEach(id => {
        deleteQuotation(id);
      });
      setSelectedIds(new Set());
      toast.success(`✅ 已成功删除 ${visibleSelectedIds.length} 条报价单`);
    }
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredQuotations.map(q => q.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 🔥 单选处理
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  // 计算全选状态
  const isAllSelected = filteredQuotations.length > 0 && selectedIds.size === filteredQuotations.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredQuotations.length;

  useEffect(() => {
    const visibleIds = new Set(filteredQuotations.map((quotation) => quotation.id));
    const nextSelected = new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id)));
    if (nextSelected.size !== selectedIds.size) {
      setSelectedIds(nextSelected);
    }
  }, [filteredQuotations, selectedIds]);

  return (
    <div className="space-y-4">
      {/* 🌍 Region Filter Info Banner - 已移除 */}

      {/* 统计卡片 */}
      {/* 🔒 只对非业务员角色显示统计卡片 */}
      {currentUserRole !== 'Sales_Rep' && (
        <div className="bg-white border border-gray-300 rounded print:hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide" style={{ fontSize: '14px' }}>报价统计</h3>
          </div>
          <div className="px-5 py-3 flex items-center gap-8" style={{ fontSize: '12px' }}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">总报价数:</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已发送:</span>
              <span className="font-semibold text-gray-900">{stats.sent}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已确认:</span>
              <span className="font-semibold text-orange-600">{stats.confirmed}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">成交率:</span>
              <span className="font-semibold text-gray-900">{stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">总金额:</span>
              <span className="font-semibold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      )}

      {/* 列表卡片 */}
      <Card className="border border-gray-200">
        {/* 搜索和筛选栏 */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-3 items-center">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="搜索报价单号、客户名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* 🔥 批量删除按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
              style={{ fontSize: '12px' }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              批量删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>

            {/* 状态筛选 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-white">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
                <SelectItem value="draft" style={{ fontSize: '12px' }}>草稿</SelectItem>
                <SelectItem value="sent" style={{ fontSize: '12px' }}>已发送</SelectItem>
                <SelectItem value="confirmed" style={{ fontSize: '12px' }}>已确认</SelectItem>
                <SelectItem value="rejected" style={{ fontSize: '12px' }}>已拒绝</SelectItem>
                <SelectItem value="converted" style={{ fontSize: '12px' }}>已转订单</SelectItem>
              </SelectContent>
            </Select>

            {/* 🎯 老板角色显示额外筛选维度 */}
            {(currentUserRole === 'Boss' || currentUserRole === 'CEO' || currentUserRole === 'Sales_Director') && (
              <>
                {/* 区域筛选 */}
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-[120px] h-9 text-xs bg-white">
                    <SelectValue placeholder="全部区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '12px' }}>全部区域</SelectItem>
                    <SelectItem value="North America" style={{ fontSize: '12px' }}>北美区域</SelectItem>
                    <SelectItem value="South America" style={{ fontSize: '12px' }}>南美区域</SelectItem>
                    <SelectItem value="Europe & Africa" style={{ fontSize: '12px' }}>欧非区域</SelectItem>
                    <SelectItem value="Other" style={{ fontSize: '12px' }}>其它区域</SelectItem>
                  </SelectContent>
                </Select>

                {/* 客户筛选 */}
                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                    <SelectValue placeholder="全部客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '12px' }}>全部客户</SelectItem>
                    {uniqueCustomers.slice(0, 30).map((customer) => (
                      <SelectItem key={customer} value={customer as string} style={{ fontSize: '12px' }}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs py-3 w-16">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4"
                    />
                    <span>#</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs">报价编号</TableHead>
                <TableHead className="text-xs">客户名称</TableHead>
                <TableHead className="text-xs">询价编号</TableHead>
                <TableHead className="text-xs">金额</TableHead>
                <TableHead className="text-xs">货币</TableHead>
                <TableHead className="text-xs">报价日期</TableHead>
                <TableHead className="text-xs">有效期至</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation, index) => (
                <TableRow 
                  key={quotation.id} 
                  className={`hover:bg-green-50/30 ${
                    quotation.customerFeedback?.status === 'negotiating' 
                      ? 'bg-amber-50/50 border-l-4 border-l-amber-500' 
                      : ''
                  }`}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(quotation.id)}
                        onCheckedChange={(checked) => handleSelectOne(quotation.id, checked as boolean)}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-500 text-xs">{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewQuotation(quotation)}
                        className="text-xs text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                      >
                        {quotation.quotationNumber}
                      </button>
                      {/* 🔥 客户反馈提示标识 */}
                      {quotation.customerFeedback?.status === 'negotiating' && (
                        <Badge className="h-4 px-1.5 text-[9px] bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                          💬 待处理
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{quotation.customerName}</TableCell>
                  <TableCell className="text-xs text-blue-600">{quotation.inquiryNumber}</TableCell>
                  <TableCell className="text-xs">${quotation.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{quotation.currency}</TableCell>
                  <TableCell className="text-xs text-gray-600">{quotation.quotationDate}</TableCell>
                  <TableCell className="text-xs text-gray-600">{quotation.validUntil}</TableCell>
                  <TableCell className="py-3">
                    <Badge className={`h-5 px-2 text-[10px] border ${getStatusConfig(quotation.status).color}`}>
                      {getStatusConfig(quotation.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* 🔥 优先显示：处理客户反馈按钮 */}
                      {quotation.customerFeedback?.status === 'negotiating' && (
                        <Button 
                          size="sm" 
                          className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => setEditQuotation(quotation)}
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                          处理反馈
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 px-3 text-xs" onClick={() => setViewQuotation(quotation)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        查看
                      </Button>
                      
                      {/* 🔥 新增：发送按钮 - 在审批通过（approved）状态下显示 */}
                      {quotation.status === 'approved' && (
                        <Button 
                          size="sm" 
                          className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            // 发送给客户
                            updateQuotation(quotation.id, { 
                              status: 'sent' as const,
                              customerStatus: 'sent' as const,
                              sentAt: new Date().toISOString()
                            });
                            
                            // 🔔 发送通知给客户
                            sendNotificationToUser(quotation.customerEmail, {
                              type: 'quotation_sent',
                              title: 'New Quotation Received',
                              message: `Your quotation ${quotation.quotationNumber} is ready. Total amount: ${quotation.currency} ${quotation.totalAmount.toLocaleString()}`,
                              relatedId: quotation.quotationNumber,
                              relatedType: 'quotation',
                              sender: getCurrentUser()?.email || 'admin@cosun.com',
                              metadata: {
                                quotationNumber: quotation.quotationNumber,
                                customerName: quotation.customerName,
                                totalAmount: quotation.totalAmount,
                                currency: quotation.currency,
                                validUntil: quotation.validUntil
                              }
                            });
                            
                            toast.success('报价已发送给客户！', {
                              description: `报价编号: ${quotation.quotationNumber}`,
                              duration: 2000
                            });
                            
                            console.log('✅ 报价已发送:', quotation.quotationNumber);
                          }}
                          title="发送报价给客户"
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          发送
                        </Button>
                      )}
                      
                      {/* 🔥 新增：申请复核按钮 - 在已发送或已确认状态下显示 */}
                      {(quotation.status === 'sent' || quotation.status === 'confirmed') && !quotation.customerFeedback && (
                        <Button 
                          size="sm" 
                          className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleSubmitForReview(quotation)}
                          title={quotation.totalAmount >= 20000 ? '金额≥$20,000，需主管+总监双重复核' : '金额<$20,000，只需主管复核'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          申请复核
                        </Button>
                      )}
                      
                      {quotation.status === 'sent' && !quotation.customerFeedback && (
                        <Button 
                          size="sm" 
                          className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleSimulateCustomerConfirm(quotation.id)}
                          title="模拟客户确认报价"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          模拟确认
                        </Button>
                      )}
                      {quotation.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleConvertToOrder(quotation.id)}
                        >
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          下推订单
                        </Button>
                      )}
                      {quotation.status === 'draft' && (
                        <>
                          <Button 
                            size="sm" 
                            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleEditDraft(quotation)}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleSubmitForApproval(quotation)}
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            提交审核
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteDraft(quotation.id, quotation.quotationNumber)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            删除
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 空状态 */}
        {filteredQuotations.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">暂无报价数据</p>
          </div>
        )}
      </Card>

      {/* 查看报价详情对话框 - 不在编辑状时显示 */}
      <ViewQuotationDialog
        open={viewQuotation !== null && !isCreatingQuotation}
        onClose={() => setViewQuotation(null)}
        quotation={viewQuotation}
        onConvertToOrder={handleConvertToOrder}
      />

      {/* 编辑报价对话框 */}
      <EditQuotationDialog
        open={isCreatingQuotation}
        onClose={() => {
          setIsCreatingQuotation(false);
          setViewQuotation(null); // 关闭时清空
        }}
        quotation={viewQuotation}
        onSave={(updatedQuotation) => {
          // 保存报价到 Context
          updateQuotation(updatedQuotation.id, updatedQuotation);
          
          // 关闭编辑对话框
          setIsCreatingQuotation(false);
          
          // 清空 viewQuotation，确保报价保存到列表中
          setViewQuotation(null);
          
          toast.success('报价已保存！', {
            description: `报价编号: ${updatedQuotation.quotationNumber}`,
            duration: 2000
          });
        }}
        onSend={(updatedQuotation) => {
          console.log('🔥 [QuotationManagement] 发送修改后的报价');
          console.log('  - 报价ID:', updatedQuotation.id);
          console.log('  - 客户反馈 (应该为空):', updatedQuotation.customerFeedback);
          console.log('  - 修订版本号:', (updatedQuotation.revisionNumber || 1) + 1);
          
          // 直接发送给客户，无需审核
          // 🔥 关键修复：清除之前的客户反馈，让客户能够重新响应
          updateQuotation(updatedQuotation.id, { 
            ...updatedQuotation, 
            status: 'sent' as const,
            customerFeedback: undefined, // 清除旧的反馈，让客户能重新选择
            // 记录修订历史
            revisions: [
              ...(updatedQuotation.revisions || []),
              {
                revisionNumber: (updatedQuotation.revisionNumber || 1) + 1,
                revisedAt: Date.now(),
                revisedBy: 'admin@cosun.com',
                reason: 'Admin modified quotation based on customer feedback'
              }
            ],
            revisionNumber: (updatedQuotation.revisionNumber || 1) + 1
          });
          
          console.log('✅ [QuotationManagement] 报价已更新到Context，customerFeedback已清除');
          
          // 🔥 更新询价单状态为"已报价"（quoted）
          updateInquiryStatus(updatedQuotation.inquiryId, 'quoted');
          console.log(`✅ [QuotationManagement] 询价单 ${updatedQuotation.inquiryId} 状态已更新为 "quoted"`);
          
          // 🔔 发送通知给客户
          sendNotificationToUser(updatedQuotation.customerEmail, {
            type: 'quotation_sent',
            title: 'New Quotation Received',
            message: `Your quotation ${updatedQuotation.quotationNumber} is ready. Total amount: ${updatedQuotation.currency} ${updatedQuotation.totalAmount.toLocaleString()}`,
            relatedId: updatedQuotation.quotationNumber,
            relatedType: 'quotation',
            sender: 'admin@cosun.com',
            metadata: {
              quotationNumber: updatedQuotation.quotationNumber,
              customerName: updatedQuotation.customerName,
              totalAmount: updatedQuotation.totalAmount,
              currency: updatedQuotation.currency,
              validUntil: updatedQuotation.validUntil
            }
          });
          
          // 关闭所有对话框
          setIsCreatingQuotation(false);
          setViewQuotation(null);
          
          toast.success('报价已发送！', {
            description: `报价编号: ${updatedQuotation.quotationNumber}`,
            duration: 2000
          });
          
          // 触发发送回调
          if (onQuotationSent) {
            onQuotationSent({ ...updatedQuotation, status: 'sent' as const });
          }
        }}
      />

      {/* 🔥 协商对话框 - 处理客户反馈 */}
      <NegotiationDialog
        open={editQuotation !== null}
        onClose={() => setEditQuotation(null)}
        quotation={editQuotation}
        onEditQuotation={(quotation) => {
          // 打开编辑报价对话框
          setViewQuotation(quotation);
          setIsCreatingQuotation(true);
          setEditQuotation(null);
        }}
        onSendRevision={async (quotation, responseMessage) => {
          // 清除客户反馈状态，保持报价为已发送状态
          updateQuotation(quotation.id, {
            customerFeedback: undefined, // 清除反馈
            status: 'sent' as const, // 重新设为已发送
            // 添加修订历史（如果需要）
            revisions: [
              ...(quotation.revisions || []),
              {
                revisionNumber: (quotation.revisionNumber || 1) + 1,
                revisedAt: Date.now(),
                revisedBy: 'admin@cosun.com',
                reason: '客户协商反馈',
                changes: responseMessage
              }
            ],
            revisionNumber: (quotation.revisionNumber || 1) + 1
          });
        }}
      />

      {/* 删除报价对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center pb-2">
            {/* Icon */}
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            
            <AlertDialogTitle className="text-center text-xl">
              确认删除报价
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-center pt-2 space-y-2">
              <span className="block text-gray-600">
                您正在删除报价
              </span>
              <span className="block text-lg font-semibold text-gray-900">
                {quotationToDelete?.number}
              </span>
              <span className="block text-red-600 text-sm pt-2">
                ⚠️ 此操作不可恢，请谨慎操作
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex gap-3 sm:gap-3">
            <AlertDialogCancel 
              onClick={handleCancelDelete}
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
