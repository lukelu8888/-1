import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, DollarSign, TrendingUp, AlertCircle, Info, ChevronDown, ChevronUp, Save, Send, Sparkles, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Resizable } from 're-resizable';
import { toast } from 'sonner@2.0.3';

/**
 * 🎯 智能报价创建页面 - 外贸价格核算专家系统
 * 
 * 功能亮点：
 * 1. 多场景价格核算：美金供货价/不含税CNY/含税CNY（自动计算退税）
 * 2. 智能利润计算：基于成本+费用的利润率自动计算
 * 3. 多贸易术语：FOB/CFR/CIF自动换算
 * 4. 数据脱敏：采购信息二次加工，业务员重新编辑产品描述
 * 5. 审批流程：提交给主管/销售总监审核，支持备注说明
 * 
 * 价格计算公式：
 * - 美金供货价：FOB = 供货价USD + 国内费用USD + 利润
 * - 不含税CNY：先转USD，再计算FOB
 * - 含税CNY：含税价 → 不含税价 → 退税额 → 实际成本USD → FOB
 * - CFR/CIF：基于FOB加运费/保险
 */

// 供货价类型
type PriceType = 'usd' | 'cny_no_tax' | 'cny_with_tax';

// 贸易术语
type TradeTerms = 'FOB' | 'CFR' | 'CIF';

// 产品报价项
interface QuoteItem {
  id: string;
  // 🔥 业务员编辑的客户友好信息（脱离采购信息）
  productName: string;
  specification: string;
  modelNo: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  
  // 🔥 成本核算参数
  priceType: PriceType; // 供货单价类型
  supplierPrice: number; // 供货单价（原始价格）
  currency: 'USD' | 'CNY'; // 供货单价货币
  exchangeRate: number; // 汇率（CNY→USD，如7.2）
  taxRate: number; // 增值税率（如13%，输入13）
  exportRebateRate: number; // 出口退税率（如13%，输入13）
  domesticFeesCNY: number; // 🔥 国内费用CNY（包装、内陆运输、报关等）
  profitMargin: number; // 利润率（%，如20表示20%）
  
  // 🔥 贸易术语与运费
  tradeTerms: TradeTerms;
  freight: number; // 海运费USD（CFR/CIF需要）
  insuranceRate: number; // 保险费率（%，CIF需要，通常0.5%）
  
  // 🔥 计算结果（自动计算）
  costUSD: number; // 实际成本USD
  profitUSD: number; // 利润USD
  quotePrice: number; // 最终报价USD
  rebateAmountCNY: number; // 🔥 退税金额CNY
  
  remarks: string; // 产品备注
}

interface QuoteCreationIntelligentProps {
  requirementNo: string; // 采购需求单号（QR）
  requirement: any; // 采购需求单数据
  onClose: () => void;
  onSubmit?: (quoteData: any) => void;
}

export default function QuoteCreationIntelligent({
  requirementNo,
  requirement,
  onClose,
  onSubmit
}: QuoteCreationIntelligentProps) {
  // 报价基本信息
  const [quoteNo, setQuoteNo] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState(30);
  
  // 产品列表
  const [items, setItems] = useState<QuoteItem[]>([]);
  const latestItemsRef = React.useRef<QuoteItem[]>([]);
  
  // 展开/折叠产品计算详情
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // 🔥 退税公式提示显示状态
  const [showRebateTooltip, setShowRebateTooltip] = useState<string | null>(null);
  
  // 国内费用提示显示状态
  const [showDomesticFeesTooltip, setShowDomesticFeesTooltip] = useState<string | null>(null);
  
  // 审批备注
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // 全局默认设置
  const [globalDefaults, setGlobalDefaults] = useState({
    priceType: 'cny_with_tax' as PriceType, // 🔥 新增：供货价类型
    exchangeRate: 7.2,
    taxRate: 13,
    exportRebateRate: 13,
    profitMargin: 20,
    domesticFeesCNY: 0,
    tradeTerms: 'FOB' as TradeTerms,
    insuranceRate: 0.5
  });

  // 🔥 拖曳状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = React.useRef<HTMLDivElement>(null);
  
  // 🔥 尺寸调整状态
  const [size, setSize] = useState({ width: 1400, height: 850 });
  const [isResizing, setIsResizing] = useState(false);

  // 🔥 ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 🔥 拖曳处理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 🔥 只在头部区域允许拖曳
    if (!dragRef.current) return;
    
    const rect = dragRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // 阻止默认行为，防止文本选中
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const parentRect = dragRef.current.parentElement?.getBoundingClientRect();
      if (!parentRect) return;
      
      // 计算新位置，限制在视口内
      let newX = e.clientX - dragOffset.x - parentRect.left;
      let newY = e.clientY - dragOffset.y - parentRect.top;
      
      // 限制边界（确保弹窗不会拖出屏幕）
      const modalRect = dragRef.current.getBoundingClientRect();
      const maxX = parentRect.width - modalRect.width;
      const maxY = parentRect.height - modalRect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // 阻止文本选择
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // 🔥 核心算法：智能价格计算（移到前面，避免依赖问题）
  const toSafeNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizeItem = (item: QuoteItem): QuoteItem => {
    const exchangeRate = toSafeNumber(item.exchangeRate, 7.2);
    const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 7.2;

    return {
      ...item,
      supplierPrice: toSafeNumber(item.supplierPrice, 0),
      exchangeRate: safeExchangeRate,
      taxRate: toSafeNumber(item.taxRate, 0),
      exportRebateRate: toSafeNumber(item.exportRebateRate, 0),
      domesticFeesCNY: toSafeNumber(item.domesticFeesCNY, 0),
      profitMargin: toSafeNumber(item.profitMargin, 0),
      freight: toSafeNumber(item.freight, 0),
      insuranceRate: toSafeNumber(item.insuranceRate, 0),
      quantity: toSafeNumber(item.quantity, 0)
    };
  };

  const calculatePrice = React.useCallback((item: QuoteItem): QuoteItem => {
    const safeItem = normalizeItem(item);
    let costUSD = 0;
    let rebateAmountCNY = 0; // 🔥 退税金额CNY
    
    // 步骤1：计算实际成本USD
    if (safeItem.priceType === 'usd') {
      // 情况1：供货价已经是美金
      costUSD = safeItem.supplierPrice;
    } else if (safeItem.priceType === 'cny_no_tax') {
      // 情况2：供货价是不含税人民币
      costUSD = safeItem.supplierPrice / safeItem.exchangeRate;
    } else if (safeItem.priceType === 'cny_with_tax') {
      // 情况3：供货价是含税人民币（需计算退税）
      const taxRateDecimal = safeItem.taxRate / 100;
      const rebateRateDecimal = safeItem.exportRebateRate / 100;
      
      // 含税价 → 不含税价
      const priceNoTax = safeItem.supplierPrice / (1 + taxRateDecimal);
      
      // 退税额（CNY）
      rebateAmountCNY = priceNoTax * rebateRateDecimal;
      
      // 实际成本 = 含税价 - 退税额
      const actualCostCNY = safeItem.supplierPrice - rebateAmountCNY;
      
      // 转为USD
      costUSD = actualCostCNY / safeItem.exchangeRate;
    }
    
    // 步骤2：加上国内费用
    const totalCost = costUSD + safeItem.domesticFeesCNY / safeItem.exchangeRate;
    
    // 步骤3：计算利润
    const profitUSD = totalCost * (safeItem.profitMargin / 100);
    
    // 步骤4：计算FOB价
    const fobPrice = totalCost + profitUSD;
    
    // 步骤5：根据贸易术语计算最终报价
    let finalPrice = fobPrice;
    
    if (safeItem.tradeTerms === 'CFR') {
      finalPrice = fobPrice + safeItem.freight;
    } else if (safeItem.tradeTerms === 'CIF') {
      // CIF = (FOB + 运费) / (1 - 保险费率)
      const insuranceRateDecimal = safeItem.insuranceRate / 100;
      finalPrice = (fobPrice + safeItem.freight) / (1 - insuranceRateDecimal);
    }
    
    return {
      ...safeItem,
      costUSD: Number(costUSD.toFixed(4)),
      profitUSD: Number(profitUSD.toFixed(4)),
      quotePrice: Number(finalPrice.toFixed(4)),
      rebateAmountCNY: Number(rebateAmountCNY.toFixed(2)) // 🔥 存储退税金额
    };
  }, []);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  // 初始化：从采购需求单导入产品
  useEffect(() => {
    if (requirement && requirement.items) {
      console.log('🔥🔥🔥 [智能报价弹窗打开] requirement完整数据:', requirement);
      console.log('🔥🔥🔥 [智能报价弹窗打开] purchaserFeedback:', requirement.purchaserFeedback);
      
      // 🔥 判断是否是已有的报价单（编辑模式）还是新建报价单
      const isExistingQuotation = requirement.qtNumber !== undefined;
      
      if (isExistingQuotation) {
        // 🔥 编辑模式：从已有报价单加载数据
        setQuoteNo(requirement.qtNumber || '');
        setQuoteDate(requirement.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setValidityDays(30); // 可以从 validUntil 计算
        
        // 🔥 修复：编辑QT时，也应该从QR采购需求单中读取原始供货价，而不是从QT计算结果读取
        const existingItems: QuoteItem[] = requirement.items.map((item: any, index: number) => {
          // 查找采购反馈中的原始供货单价（与新建模式相同逻辑）
          const feedbackProduct = requirement.purchaserFeedback?.products?.find(
            (fp: any) => fp.productId === item.id
          );
          
          // 🔥 多重兼容：从多个可能的字段读取供货单价
          const supplierPrice = feedbackProduct?.costPrice 
            || feedbackProduct?.supplierPrice 
            || feedbackProduct?.price
            || item.supplierPrice
            || item.costPrice
            || item.targetPrice 
            || item.price
            || 0;
            
          const currency = feedbackProduct?.currency 
            || feedbackProduct?.priceType 
            || item.currency 
            || item.priceType
            || 'CNY';
          
          console.log(`🔍 [编辑QT-加载产品${index + 1}] ${item.productName}:`, {
            '已有QT的item': item,
            '采购反馈完整数据': requirement.purchaserFeedback,
            '匹配到的feedbackProduct': feedbackProduct,
            '最终供货单价': supplierPrice,
            '最终货币': currency,
            '尝试的字段': {
              'feedbackProduct?.costPrice': feedbackProduct?.costPrice,
              'feedbackProduct?.supplierPrice': feedbackProduct?.supplierPrice,
              'feedbackProduct?.price': feedbackProduct?.price,
              'item.supplierPrice': item.supplierPrice,
              'item.costPrice': item.costPrice,
              'item.targetPrice': item.targetPrice,
              'item.price': item.price
            }
          });
          
          const existingItem: QuoteItem = {
            id: item.id || `item-${index}`,
            productName: item.productName || '',
            specification: item.specification || '',
            modelNo: item.modelNo || '',
            quantity: item.quantity || 0,
            unit: item.unit || 'PCS',
            imageUrl: item.imageUrl,
            
            // 🔥 成本参数：从QR采购反馈读取，不是从QT计算结果读取
            priceType: currency === 'USD' ? 'usd' : 'cny_with_tax',
            supplierPrice: supplierPrice, // 🔥 原始供货单价
            currency: currency as 'USD' | 'CNY', // 🔥 原始货币
            exchangeRate: item.exchangeRate || globalDefaults.exchangeRate,
            taxRate: item.taxRate || globalDefaults.taxRate,
            exportRebateRate: item.exportRebateRate || globalDefaults.exportRebateRate,
            domesticFeesCNY: item.domesticFeesCNY || globalDefaults.domesticFeesCNY,
            profitMargin: item.profitMargin ?? globalDefaults.profitMargin,
            
            tradeTerms: (item.tradeTerms || globalDefaults.tradeTerms) as TradeTerms,
            freight: item.freight || 0,
            insuranceRate: item.insuranceRate || globalDefaults.insuranceRate,
            
            // 🔥 计算结果字段：初始化为0，让calculatePrice重新计算
            costUSD: 0,
            profitUSD: 0,
            quotePrice: 0,
            rebateAmountCNY: 0,
            
            remarks: item.remarks || ''
          };
          
          // 🔥 重新计算（基于原始供货价）
          return calculatePrice(existingItem);
        });
        
        setItems(existingItems);
      } else {
        // 🔥 新建模式：从采购需求单创建
        const region = requirement.region || 'NA';
        const date = new Date();
        const dateStr = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const newQuoteNo = `QT-${region}-${dateStr}-0001`;
        setQuoteNo(newQuoteNo);
        
        // 导入产品（从采购反馈中获取成本价）
        const initialItems: QuoteItem[] = requirement.items.map((item: any, index: number) => {
          // 查找采购反馈中的产品
          const feedbackProduct = requirement.purchaserFeedback?.products?.find(
            (fp: any) => fp.productId === item.id
          );
          
          console.log(`🔍 [初始化产品${index + 1}] ${item.productName}:`, {
            '原始item': item,
            '采购反馈': requirement.purchaserFeedback,
            '匹配到的feedbackProduct': feedbackProduct,
            '供货价': feedbackProduct?.costPrice || feedbackProduct?.supplierPrice || item.targetPrice || item.costPrice || 0
          });
          
          // 🔥 从采购反馈中读取供货价（多个字段兼容）
          const supplierPrice = feedbackProduct?.costPrice || feedbackProduct?.supplierPrice || item.targetPrice || item.costPrice || 0;
          const currency = feedbackProduct?.currency || item.currency || 'CNY';
          const supplierName = feedbackProduct?.supplierName || '供应商'; // 🔥 供应商名称（脱敏）
          
          const newItem: QuoteItem = {
            id: item.id || `item-${index}`,
            // 🔥 业务员需要重新编辑这些信息（客户友好版本）
            productName: item.productName || '',
            specification: item.specification || '',
            modelNo: item.modelNo || '',
            quantity: item.quantity || 0,
            unit: item.unit || 'PCS',
            imageUrl: item.imageUrl,
            
            // 🔥 成本参数（从采购反馈导入，供货价不可修改！）
            priceType: currency === 'USD' ? 'usd' : 'cny_with_tax',
            supplierPrice: supplierPrice,
            currency: currency as 'USD' | 'CNY',
            exchangeRate: globalDefaults.exchangeRate,
            taxRate: globalDefaults.taxRate,
            exportRebateRate: globalDefaults.exportRebateRate,
            domesticFeesCNY: globalDefaults.domesticFeesCNY,
            profitMargin: globalDefaults.profitMargin,
            
            tradeTerms: globalDefaults.tradeTerms,
            freight: 0,
            insuranceRate: globalDefaults.insuranceRate,
            
            // 计算结果
            costUSD: 0,
            profitUSD: 0,
            quotePrice: 0,
            rebateAmountCNY: 0, // 🔥 初始化退税金额为0
            
            remarks: ''
          };
          
          console.log(`✅ [初始化完成] ${item.productName}:`, {
            'supplierPrice': newItem.supplierPrice,
            'currency': newItem.currency,
            'priceType': newItem.priceType
          });
          
          // 🔥 立即计算价格
          return calculatePrice(newItem);
        });
        
        setItems(initialItems);
      }
    }
  }, [requirement, calculatePrice]);

  // 更新单个产品
  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          return calculatePrice(updated);
        }
        return item;
      })
    );
  };

  // 批量应用全局默认值
  const applyGlobalDefaults = () => {
    const sourceItems = latestItemsRef.current;
    const updatedItems = sourceItems.map(item => {
        const updated = {
          ...item,
          priceType: globalDefaults.priceType, // 🔥 新增：批量应用供货价类型
          exchangeRate: globalDefaults.exchangeRate,
          taxRate: globalDefaults.taxRate,
          exportRebateRate: globalDefaults.exportRebateRate,
          profitMargin: globalDefaults.profitMargin,
          domesticFeesCNY: globalDefaults.domesticFeesCNY,
          tradeTerms: globalDefaults.tradeTerms,
          insuranceRate: globalDefaults.insuranceRate
        };
        return calculatePrice(updated);
      });
    latestItemsRef.current = updatedItems;
    setItems(updatedItems);
    toast.success(`已批量应用全局默认值（利润率：${globalDefaults.profitMargin}%）`);
  };

  // 切换产品详情展开/折叠
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 提交报价（保存草稿）
  const handleSaveDraft = () => {
    const computedItems = latestItemsRef.current.map(item => calculatePrice(item));
    latestItemsRef.current = computedItems;
    setItems(computedItems);

    // 🔥 从采购需求单提取真实客户和区域信息
    const customerInfo = {
      region: requirement.region || 'NA', // 🔥 区域信息
      customerName: requirement.customerName || '',
      customerContact: requirement.customerContact || '',
      customerEmail: requirement.customerEmail || '',
      inquiryNo: requirement.inquiryNo || '' // 原始询价单号
    };
    
    // 🔥 计算真实的利润率
    const actualTotalCost = computedItems.reduce((sum, item) => 
      sum + (item.costUSD + item.domesticFeesCNY / item.exchangeRate) * item.quantity, 0
    );
    const actualTotalAmount = computedItems.reduce((sum, item) => 
      sum + item.quotePrice * item.quantity, 0
    );
    const actualTotalProfit = actualTotalAmount - actualTotalCost;
    const actualProfitMargin = actualTotalCost > 0 ? (actualTotalProfit / actualTotalCost) * 100 : 0;
    
    const quoteData = {
      quoteNo,
      qtNumber: quoteNo, // 🔥 兼容字段
      quoteDate,
      validityDays,
      requirementNo,
      qrNumber: requirementNo, // 🔥 关联的QR单号
      status: 'draft',
      
      // 🔥 真实的客户和区域信息
      ...customerInfo,
      
      // 🔥 产品信息（完整的核算数据）
      items: computedItems.map(item => ({
        id: item.id,
        productName: item.productName,
        specification: item.specification,
        modelNo: item.modelNo,
        quantity: item.quantity,
        unit: item.unit,
        imageUrl: item.imageUrl,
        
        // 🔥 成本核算参数
        priceType: item.priceType,
        supplierPrice: item.supplierPrice,
        currency: item.currency,
        exchangeRate: item.exchangeRate,
        taxRate: item.taxRate,
        exportRebateRate: item.exportRebateRate,
        domesticFeesCNY: item.domesticFeesCNY,
        profitMargin: item.profitMargin,
        
        // 🔥 贸易术语
        tradeTerms: item.tradeTerms,
        freight: item.freight,
        insuranceRate: item.insuranceRate,
        
        // 🔥 计算结果
        costUSD: item.costUSD,
        costPrice: item.costUSD, // 🔥 兼容字段
        profitUSD: item.profitUSD,
        profit: item.profitUSD, // 🔥 兼容字段
        quotePrice: item.quotePrice,
        salesPrice: item.quotePrice, // 🔥 兼容字段
        rebateAmountCNY: item.rebateAmountCNY,
        
        // 🔥 小计金额
        totalAmount: item.quotePrice * item.quantity,
        
        remarks: item.remarks
      })),
      
      // 🔥 真实的财务汇总数据
      totalCost: actualTotalCost, // 总成本
      totalProfit: actualTotalProfit, // 总利润
      profitMargin: actualProfitMargin, // 利润率
      totalAmount: actualTotalAmount, // 报价总额
      
      approvalNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 保存报价草稿:', quoteData);
    onSubmit?.(quoteData);
  };

  // 提交审核
  const handleSubmitForApproval = () => {
    if (!approvalNotes.trim()) {
      alert('请填写提交给上级的审批说明');
      return;
    }

    const computedItems = latestItemsRef.current.map(item => calculatePrice(item));
    latestItemsRef.current = computedItems;
    setItems(computedItems);
    
    // 🔥 从采购需求单提取真实客户和区域信息
    const customerInfo = {
      region: requirement.region || 'NA', // 🔥 区域信息
      customerName: requirement.customerName || '',
      customerContact: requirement.customerContact || '',
      customerEmail: requirement.customerEmail || '',
      inquiryNo: requirement.inquiryNo || '' // 原始询价单号
    };
    
    // 🔥 计算真实的利润率
    const actualTotalCost = computedItems.reduce((sum, item) => 
      sum + (item.costUSD + item.domesticFeesCNY / item.exchangeRate) * item.quantity, 0
    );
    const actualTotalAmount = computedItems.reduce((sum, item) => 
      sum + item.quotePrice * item.quantity, 0
    );
    const actualTotalProfit = actualTotalAmount - actualTotalCost;
    const actualProfitMargin = actualTotalCost > 0 ? (actualTotalProfit / actualTotalCost) * 100 : 0;
    
    // 🔥 判断审批流程
    const requiresDirectorApproval = actualTotalAmount >= 20000;
    
    const quoteData = {
      quoteNo,
      qtNumber: quoteNo, // 🔥 兼容字段
      quoteDate,
      validityDays,
      requirementNo,
      qrNumber: requirementNo, // 🔥 关联的QR单号
      status: 'pending_supervisor', // 🔥 第一步：待区域主管审核
      
      // 🔥 真实的客户和区域信息
      ...customerInfo,
      
      // 🔥 产品信息（完整的核算数据）
      items: computedItems.map(item => ({
        id: item.id,
        productName: item.productName,
        specification: item.specification,
        modelNo: item.modelNo,
        quantity: item.quantity,
        unit: item.unit,
        imageUrl: item.imageUrl,
        
        // 🔥 成本核算参数
        priceType: item.priceType,
        supplierPrice: item.supplierPrice,
        currency: item.currency,
        exchangeRate: item.exchangeRate,
        taxRate: item.taxRate,
        exportRebateRate: item.exportRebateRate,
        domesticFeesCNY: item.domesticFeesCNY,
        profitMargin: item.profitMargin,
        
        // 🔥 贸易术语
        tradeTerms: item.tradeTerms,
        freight: item.freight,
        insuranceRate: item.insuranceRate,
        
        // 🔥 计算结果
        costUSD: item.costUSD,
        costPrice: item.costUSD, // 🔥 兼容字段
        profitUSD: item.profitUSD,
        profit: item.profitUSD, // 🔥 兼容字段
        quotePrice: item.quotePrice,
        salesPrice: item.quotePrice, // 🔥 兼容字段
        rebateAmountCNY: item.rebateAmountCNY,
        
        // 🔥 小计金额
        totalAmount: item.quotePrice * item.quantity,
        
        remarks: item.remarks
      })),
      
      // 🔥 真实的财务汇总数据
      totalCost: actualTotalCost, // 总成本
      totalProfit: actualTotalProfit, // 总利润
      profitMargin: actualProfitMargin, // 利润率
      totalAmount: actualTotalAmount, // 报价总额
      
      approvalNotes,
      
      // 🔥 审批流程配置
      approvalFlow: {
        requiresDirectorApproval, // 是否需要销售总监审核
        currentStep: 'supervisor', // 当前审批节点：supervisor | director | completed
        steps: requiresDirectorApproval 
          ? ['supervisor', 'director'] // ≥2万美金：两级审核
          : ['supervisor'] // <2万美金：一级审核
      },
      
      // 🔥 审批记录（时间线）
      approvalHistory: [
        {
          action: 'submitted',
          actor: '张伟 (业务员)',
          actorRole: 'salesperson',
          timestamp: new Date().toISOString(),
          notes: approvalNotes,
          amount: actualTotalAmount
        }
      ],
      
      // 🔥 当前待审批人
      pendingApprovers: [
        {
          role: 'supervisor',
          name: '区域业务主管',
          required: true
        },
        ...(requiresDirectorApproval ? [{
          role: 'director',
          name: '销售总监',
          required: true
        }] : [])
      ],
      
      submittedAt: new Date().toISOString(),
      submittedBy: '张伟 (业务员)', // 实际应从登录用户获取
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📤 提交审核:', quoteData);
    
    // 🔥 金额判断提示
    const approvalMessage = requiresDirectorApproval
      ? `报价总额：$${actualTotalAmount.toFixed(2)} (≥ $20,000)\n\n审批流程：\n1️⃣ 区域业务主管审核\n2️⃣ 销售总监审核\n\n两级审批全部通过后，您才能发送给客户。`
      : `报价总额：$${actualTotalAmount.toFixed(2)} (< $20,000)\n\n审批流程：\n1️⃣ 区域业务主管审核\n\n主管审批通过后，您即可发送给客户。`;
    
    alert(`✅ 报价已成功提交审核！\n\n${approvalMessage}`);
    
    onSubmit?.(quoteData);
    onClose();
  };

  // 计算总金额（实时联动）
  const totalAmount = items.reduce((sum, item) => sum + item.quotePrice * item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.costUSD + item.domesticFeesCNY / item.exchangeRate) * item.quantity, 0);
  const totalProfit = totalAmount - totalCost;
  const overallMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  
  // 🔥 添加更新提示效果
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  // 🔥 监听items变化，触发更新提示
  React.useEffect(() => {
    if (items.length > 0) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [items]);

  // 🔥 使用 Portal 渲染到 body，避免被父容器遮挡
  const modalContent = (
    <>
      <style>{`
        /* 🔥 调整大小手柄样式 */
        .react-resizable-handle {
          background: transparent;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .react-resizable-handle:hover {
          opacity: 1;
        }
        .react-resizable-handle::before {
          content: '';
          position: absolute;
          background: rgba(249, 99, 2, 0.5);
          border-radius: 3px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(249, 99, 2, 0.3);
        }
        .react-resizable-handle:hover::before {
          background: rgba(249, 99, 2, 0.9);
          box-shadow: 0 4px 16px rgba(249, 99, 2, 0.5);
        }
        
        /* 边缘手柄 */
        .react-resizable-handle-right::before,
        .react-resizable-handle-left::before {
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 60px;
        }
        .react-resizable-handle-right::before {
          right: 0;
        }
        .react-resizable-handle-left::before {
          left: 0;
        }
        .react-resizable-handle-top::before,
        .react-resizable-handle-bottom::before {
          left: 50%;
          transform: translateX(-50%);
          height: 5px;
          width: 60px;
        }
        .react-resizable-handle-top::before {
          top: 0;
        }
        .react-resizable-handle-bottom::before {
          bottom: 0;
        }
        
        /* 角落手柄 - 更大更明显 */
        .react-resizable-handle-topRight::before,
        .react-resizable-handle-topLeft::before,
        .react-resizable-handle-bottomRight::before,
        .react-resizable-handle-bottomLeft::before {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }
        .react-resizable-handle-topRight::before {
          top: 4px;
          right: 4px;
        }
        .react-resizable-handle-topLeft::before {
          top: 4px;
          left: 4px;
        }
        .react-resizable-handle-bottomRight::before {
          bottom: 4px;
          right: 4px;
        }
        .react-resizable-handle-bottomLeft::before {
          bottom: 4px;
          left: 4px;
        }
        
        /* 右下角手柄特别处理 - 永久可见 */
        .react-resizable-handle-bottomRight {
          opacity: 0.6 !important;
        }
        .react-resizable-handle-bottomRight:hover {
          opacity: 1 !important;
        }
        .react-resizable-handle-bottomRight::after {
          content: '';
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 12px;
          height: 12px;
          background: 
            linear-gradient(135deg, transparent 50%, rgba(249, 99, 2, 0.4) 50%),
            linear-gradient(135deg, transparent 25%, rgba(249, 99, 2, 0.6) 25%);
          pointer-events: none;
        }
      `}</style>
      <div 
        className="fixed inset-0 bg-black/60 z-[9999] overflow-auto"
        onClick={(e) => {
          // 🔥 点击遮罩层关闭
          if (e.target === e.currentTarget) onClose();
        }}
      >
      {/* 🔥 居中容器 */}
      <div className="min-h-full flex items-center justify-center p-8">
        <Resizable
          size={{ width: size.width, height: size.height }}
          onResizeStart={() => setIsResizing(true)}
          onResize={(e, direction, ref, d) => {
            // 实时更新尺寸显示
            setSize({
              width: size.width + d.width,
              height: size.height + d.height,
            });
          }}
          onResizeStop={(e, direction, ref, d) => {
            setSize({
              width: size.width + d.width,
              height: size.height + d.height,
            });
            setIsResizing(false);
          }}
          minWidth={1000}
          minHeight={600}
          maxWidth={1920}
          maxHeight={1080}
          enable={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
          handleStyles={{
            right: { width: '12px', right: '-6px' },
            left: { width: '12px', left: '-6px' },
            top: { height: '12px', top: '-6px' },
            bottom: { height: '12px', bottom: '-6px' },
            topRight: { width: '20px', height: '20px', right: '-10px', top: '-10px' },
            topLeft: { width: '20px', height: '20px', left: '-10px', top: '-10px' },
            bottomRight: { width: '20px', height: '20px', right: '-10px', bottom: '-10px' },
            bottomLeft: { width: '20px', height: '20px', left: '-10px', bottom: '-10px' }
          }}
          handleClasses={{
            right: 'react-resizable-handle-right',
            left: 'react-resizable-handle-left',
            top: 'react-resizable-handle-top',
            bottom: 'react-resizable-handle-bottom',
            topRight: 'react-resizable-handle-topRight',
            topLeft: 'react-resizable-handle-topLeft',
            bottomRight: 'react-resizable-handle-bottomRight',
            bottomLeft: 'react-resizable-handle-bottomLeft'
          }}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full h-full overflow-hidden flex flex-col relative" 
            ref={dragRef}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'default'
            }}
          >
            {/* 🔥 调整大小时显示尺寸 */}
            {isResizing && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-2xl pointer-events-none">
                <div className="text-xs text-slate-300 text-center mb-1">窗口尺寸</div>
                <div className="text-lg font-bold text-center">{size.width} × {size.height}</div>
              </div>
            )}
          {/* 🎨 专业化头部 - 台湾大厂风格 */}
          <div 
            className="px-5 py-3 border-b bg-slate-700 text-white cursor-grab active:cursor-grabbing flex-shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-slate-600 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-slate-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">智能报价创建 - 财务核算系统</h2>
                  <p className="text-xs text-slate-300">
                    采购需求单：{requirementNo} | 报价单号：{quoteNo || '待生成'} | 
                    <span className="ml-1 opacity-60">{size.width}×{size.height}px</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-right mr-3 px-3 py-1 rounded transition-all duration-300 ${isUpdating ? 'bg-orange-500 ring-2 ring-orange-300' : 'bg-slate-600'}`}>
                  <div className={`text-xs ${isUpdating ? 'text-white' : 'text-slate-300'}`}>报价总额</div>
                  <div className={`text-lg font-bold transition-all duration-300 ${isUpdating ? 'text-white scale-110' : 'text-orange-400'}`}>${totalAmount.toFixed(2)}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="hover:bg-slate-600 text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* 🎨 主体内容 - 紧凑布局 */}
          <div className="flex-1 overflow-y-auto">
            {/* 🔥 顶部快捷配置栏 - ERP风格 */}
            <div className="sticky top-0 z-10 bg-slate-50 border-b px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* 报价基本信息 - 紧凑横向布局 */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={quoteNo}
                      onChange={(e) => setQuoteNo(e.target.value)}
                      className="w-40 px-2 py-1 border rounded text-sm font-semibold"
                      placeholder="报价单号"
                    />
                  </div>
                  <div className="w-px h-6 bg-slate-300" />
                  <input
                    type="date"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600">有效期:</span>
                    <input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded text-sm text-center"
                    />
                    <span className="text-xs text-slate-600">天</span>
                  </div>
                </div>

                {/* 全局配置 - 超紧凑设计 */}
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded border border-slate-300">
                  <Sparkles className="w-4 h-4 text-slate-600" />
                  <div className="flex items-center gap-2">
                    {/* 🔥 供货价类型 - 放在最前面 */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-600 font-semibold">供货单价:</span>
                      <select
                        value={globalDefaults.priceType}
                        onChange={(e) => setGlobalDefaults(prev => ({ ...prev, priceType: e.target.value as PriceType }))}
                        className="w-24 px-1.5 py-0.5 border rounded text-xs font-semibold bg-white"
                      >
                        <option value="usd">美金</option>
                        <option value="cny_no_tax">不含税CNY</option>
                        <option value="cny_with_tax">含税CNY</option>
                      </select>
                    </div>
                    
                    {/* 🔥 智能联动：只有CNY类型才显示汇率 */}
                    {globalDefaults.priceType !== 'usd' && (
                      <>
                        <div className="w-px h-4 bg-slate-300" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-600">汇率:</span>
                          <input
                            type="number"
                            step="0.01"
                            value={globalDefaults.exchangeRate}
                            onChange={(e) => setGlobalDefaults(prev => ({ ...prev, exchangeRate: Number(e.target.value) }))}
                            className="w-14 px-1.5 py-0.5 border rounded text-xs text-center font-semibold"
                          />
                        </div>
                      </>
                    )}
                    
                    {/* 🔥 智能联动：只有含税CNY才显示税率和退税 */}
                    {globalDefaults.priceType === 'cny_with_tax' && (
                      <>
                        <div className="w-px h-4 bg-slate-300" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-600">税率:</span>
                          <input
                            type="number"
                            value={globalDefaults.taxRate}
                            onChange={(e) => setGlobalDefaults(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                            className="w-12 px-1.5 py-0.5 border rounded text-xs text-center font-semibold"
                          />
                          <span className="text-xs text-slate-600">%</span>
                        </div>
                        <div className="w-px h-4 bg-slate-300" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-600">退税:</span>
                          <input
                            type="number"
                            value={globalDefaults.exportRebateRate}
                            onChange={(e) => setGlobalDefaults(prev => ({ ...prev, exportRebateRate: Number(e.target.value) }))}
                            className="w-12 px-1.5 py-0.5 border rounded text-xs text-center font-semibold"
                          />
                          <span className="text-xs text-slate-600">%</span>
                        </div>
                      </>
                    )}
                    
                    <div className="w-px h-4 bg-slate-300" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-600">利润:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={globalDefaults.profitMargin}
                        onChange={(e) => setGlobalDefaults(prev => ({ ...prev, profitMargin: Number(e.target.value) }))}
                        className="w-12 px-1.5 py-0.5 border rounded text-xs text-center font-semibold"
                        placeholder="20"
                        title="输入数字代表百分比，如输入20代表20%"
                      />
                      <span className="text-xs text-slate-600">%</span>
                    </div>
                    <Button onClick={applyGlobalDefaults} size="sm" className="bg-slate-600 hover:bg-slate-700 h-6 text-xs px-2 ml-1">
                      批量应用
                    </Button>
                    {isUpdating && (
                      <div className="ml-2 flex items-center gap-1 text-xs text-green-600 animate-pulse">
                        <Calculator className="w-3 h-3" />
                        <span>实时计算中...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 产品列表 */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  产品报价清单 ({items.length}项)
                </h3>
                <div className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded transition-all duration-300 ${isUpdating ? 'bg-green-50 scale-105 ring-2 ring-green-300' : 'bg-transparent'}`}>
                  <span className="text-slate-500">总成本: <strong className="text-slate-900 transition-all duration-300">${totalCost.toFixed(2)}</strong></span>
                  <div className="w-px h-4 bg-slate-300" />
                  <span className="text-slate-500">总利润: <strong className={`transition-all duration-300 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${totalProfit.toFixed(2)}</strong></span>
                  <div className="w-px h-4 bg-slate-300" />
                  <span className="text-slate-500">综合利润率: <strong className={`transition-all duration-300 ${overallMargin >= 15 ? 'text-green-600' : overallMargin >= 10 ? 'text-orange-600' : 'text-red-600'}`}>{overallMargin.toFixed(1)}%</strong></span>
                </div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* 🎨 产品头部 - 表格式紧凑设计 */}
                  <div className="bg-slate-50 px-3 py-2 flex items-center gap-3 border-b">
                    <span className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center font-bold text-sm text-slate-700">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, { productName: e.target.value })}
                      placeholder="产品名称"
                      className="flex-1 px-2 py-1 border rounded text-sm font-medium"
                    />
                    <input
                      type="text"
                      value={item.modelNo}
                      onChange={(e) => updateItem(item.id, { modelNo: e.target.value })}
                      placeholder="型号"
                      className="w-32 px-2 py-1 border rounded text-sm"
                    />
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        className="w-20 text-sm text-right border-none outline-none"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                        className="w-16 text-sm border-none outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-4 px-3 bg-slate-50 rounded border border-slate-200 transition-all duration-300">
                      <div className="text-center">
                        <div className="text-xs text-slate-500">单价</div>
                        <div className="text-sm font-bold text-slate-900 transition-all duration-300">${item.quotePrice.toFixed(2)}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-300" />
                      <div className="text-center">
                        <div className="text-xs text-slate-500">小计</div>
                        <div className="text-sm font-bold text-slate-900 transition-all duration-300">${(item.quotePrice * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                      title={expandedItems.has(item.id) ? '收起' : '展开详情'}
                    >
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* 🎨 产品详情 - 财务ERP风格 */}
                  {expandedItems.has(item.id) && (
                    <div className="bg-white p-3 space-y-3">
                      {/* 产品规格 - 黄色背景 */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">产品规格说明</label>
                        <textarea
                          value={item.specification}
                          onChange={(e) => updateItem(item.id, { specification: e.target.value })}
                          placeholder="填写客户友好的产品规格说明（如：Material: Premium Quality, Certification: CE, ISO, Warranty: 1 Year）"
                          rows={2}
                          className="w-full px-2 py-1.5 border-0 bg-transparent text-sm resize-none focus:outline-none focus:ring-0"
                        />
                      </div>

                      {/* 🔥 成本核算 - 专业财务表格 */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5" />
                          成本核算参数
                        </h4>
                        
                        {/* 第一行：供货价配置（紧凑单行布局） */}
                        <div className="flex items-end gap-3 mb-2">
                          <div className="flex-none w-28">
                            <label className="block text-xs text-slate-600 mb-1">
                              供货单价类型
                              <span className="text-green-500 ml-1" title="已解锁，可手动修改">🔓</span>
                            </label>
                            <select
                              value={item.priceType}
                              onChange={(e) => updateItem(item.id, { priceType: e.target.value as PriceType })}
                              className="w-full px-2 py-1.5 border rounded text-xs bg-white border-orange-300 focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="usd">美金</option>
                              <option value="cny_no_tax">不含税CNY</option>
                              <option value="cny_with_tax">含税CNY</option>
                            </select>
                          </div>
                          
                          <div className="flex-none w-20">
                            <label className="block text-xs text-slate-600 mb-1">
                              供货单价 
                              <span className="text-green-500 ml-1" title="已解锁，可手动修改">🔓</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.supplierPrice}
                              onChange={(e) => updateItem(item.id, { supplierPrice: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium bg-white border-orange-300 focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          {item.priceType !== 'usd' && (
                            <div className="flex-none w-20">
                              <label className="block text-xs text-slate-600 mb-1">汇率 CNY→USD</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.exchangeRate}
                                onChange={(e) => updateItem(item.id, { exchangeRate: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                              />
                            </div>
                          )}

                          {item.priceType === 'cny_with_tax' && (
                            <>
                              <div className="flex-none w-24">
                                <label className="block text-xs text-slate-600 mb-1">增值税率%</label>
                                <input
                                  type="number"
                                  value={item.taxRate}
                                  onChange={(e) => updateItem(item.id, { taxRate: Number(e.target.value) })}
                                  className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                                />
                              </div>
                              
                              <div className="flex-none w-24">
                                <label className="block text-xs text-slate-600 mb-1">出口退税%</label>
                                <input
                                  type="number"
                                  value={item.exportRebateRate}
                                  onChange={(e) => updateItem(item.id, { exportRebateRate: Number(e.target.value) })}
                                  className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                                />
                              </div>
                              
                              <div className="flex-none w-32">
                                <label className="block text-xs text-slate-600 mb-1 flex items-center gap-1">
                                  退税金额 CNY
                                  <div 
                                    className="relative"
                                    onMouseEnter={() => setShowRebateTooltip(item.id)}
                                    onMouseLeave={() => setShowRebateTooltip(null)}
                                  >
                                    <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                                    {showRebateTooltip === item.id && (
                                      <div className="absolute left-0 top-6 z-50 w-96 bg-slate-900 text-white text-xs rounded-lg shadow-2xl p-4 border border-slate-700">
                                        <div className="font-semibold text-blue-300 mb-3 text-sm">📐 退税金额计算公式</div>
                                        <div className="space-y-3 text-slate-200">
                                          <div className="bg-slate-800 rounded-lg p-2.5">
                                            <div className="text-yellow-300 font-medium mb-1.5">步骤1：计算不含税价</div>
                                            <div className="font-mono text-xs bg-slate-900 px-3 py-2 rounded">
                                              不含税价 = 含税价 ÷ (1 + 增值税率%)
                                            </div>
                                          </div>
                                          <div className="bg-slate-800 rounded-lg p-2.5">
                                            <div className="text-yellow-300 font-medium mb-1.5">步骤2：计算退税金额</div>
                                            <div className="font-mono text-xs bg-slate-900 px-3 py-2 rounded">
                                              退税金额 = 不含税价 × 出口退税率%
                                            </div>
                                          </div>
                                          <div className="border-t border-slate-700 pt-3">
                                            <div className="text-green-300 font-medium mb-2">💡 示例（含税价100元，税率13%，退税13%）</div>
                                            <div className="space-y-1.5 ml-2">
                                              <div className="flex items-center gap-2">
                                                <span className="text-slate-400">①</span>
                                                <span>不含税价 = 100 ÷ 1.13 = <span className="text-yellow-300 font-semibold">88.50元</span></span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-slate-400">②</span>
                                                <span>退税金额 = 88.50 × 13% = <span className="text-green-400 font-bold">11.50元</span></span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* 小三角箭头 */}
                                        <div className="absolute left-4 -top-1.5 w-3 h-3 bg-slate-900 border-l border-t border-slate-700 transform rotate-45"></div>
                                      </div>
                                    )}
                                  </div>
                                </label>
                                <div className="w-full px-2 py-1.5 border rounded text-xs text-right font-semibold bg-green-50 text-green-700 border-green-300">
                                  ¥{item.rebateAmountCNY.toFixed(2)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* 第二行：费用与利润 */}
                        <div className="flex items-end gap-3">
                          <div className="flex-none w-28">
                            <label className="block text-xs text-slate-600 mb-1 flex items-center gap-1">
                              国内费用 CNY
                              <div 
                                className="relative"
                                onMouseEnter={() => setShowDomesticFeesTooltip(item.id)}
                                onMouseLeave={() => setShowDomesticFeesTooltip(null)}
                              >
                                <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                                {showDomesticFeesTooltip === item.id && (
                                  <div className="absolute left-0 top-6 z-50 w-96 bg-slate-900 text-white text-xs rounded-lg shadow-2xl p-4 border border-slate-700">
                                    <div className="font-semibold text-blue-300 mb-3 text-sm">📦 国内费用说明</div>
                                    <div className="space-y-3 text-slate-200">
                                      <div className="bg-slate-800 rounded-lg p-2.5">
                                        <div className="text-yellow-300 font-medium mb-1.5">💡 定义</div>
                                        <div className="text-xs leading-relaxed">
                                          国内费用是指<span className="text-green-300 font-semibold">每个产品</span>需要分摊的国内段成本，<span className="text-red-300 font-semibold">不是</span>总费用！
                                        </div>
                                      </div>
                                      <div className="bg-slate-800 rounded-lg p-2.5">
                                        <div className="text-yellow-300 font-medium mb-1.5">📋 包含项目</div>
                                        <div className="space-y-1 ml-2">
                                          <div>• 包装费用（纸箱、木箱、托盘等）</div>
                                          <div>• 内陆运输费（工厂→港口）</div>
                                          <div>• 报关报检费</div>
                                          <div>• 仓储费、装卸费等</div>
                                        </div>
                                      </div>
                                      <div className="border-t border-slate-700 pt-3">
                                        <div className="text-green-300 font-medium mb-2">💡 计算示例</div>
                                        <div className="space-y-1.5 ml-2">
                                          <div className="flex items-start gap-2">
                                            <span className="text-slate-400">①</span>
                                            <span>订单数量：<span className="text-yellow-300 font-semibold">1000个</span></span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <span className="text-slate-400">②</span>
                                            <span>总包装费：<span className="text-yellow-300 font-semibold">2000元</span></span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <span className="text-slate-400">③</span>
                                            <span>总运输费：<span className="text-yellow-300 font-semibold">1500元</span></span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <span className="text-slate-400">④</span>
                                            <span>单件国内费用 = (2000+1500) ÷ 1000 = <span className="text-green-400 font-bold">3.5元/件</span></span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {/* 小三角箭头 */}
                                    <div className="absolute left-4 -top-1.5 w-3 h-3 bg-slate-900 border-l border-t border-slate-700 transform rotate-45"></div>
                                  </div>
                                )}
                              </div>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.domesticFeesCNY}
                              onChange={(e) => updateItem(item.id, { domesticFeesCNY: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                            />
                          </div>
                          
                          <div className="flex-none w-20">
                            <label className="block text-xs text-slate-600 mb-1">利润率 %</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.profitMargin}
                              onChange={(e) => updateItem(item.id, { profitMargin: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                              placeholder="20"
                              title="输入数字代表百分比，如输入20代表20%"
                            />
                          </div>
                          
                          <div className="flex-none w-24">
                            <label className="block text-xs text-slate-600 mb-1">贸易术语</label>
                            <select
                              value={item.tradeTerms}
                              onChange={(e) => updateItem(item.id, { tradeTerms: e.target.value as TradeTerms })}
                              className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                            >
                              <option value="FOB">FOB</option>
                              <option value="CFR">CFR</option>
                              <option value="CIF">CIF</option>
                            </select>
                          </div>
                          
                          {(item.tradeTerms === 'CFR' || item.tradeTerms === 'CIF') && (
                            <div className="flex-none w-24">
                              <label className="block text-xs text-slate-600 mb-1">海运费 USD</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.freight}
                                onChange={(e) => updateItem(item.id, { freight: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                              />
                            </div>
                          )}
                          
                          {item.tradeTerms === 'CIF' && (
                            <div className="flex-none w-24">
                              <label className="block text-xs text-slate-600 mb-1">保险费率 %</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.insuranceRate}
                                onChange={(e) => updateItem(item.id, { insuranceRate: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 border rounded text-xs text-right font-medium"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🔥 计算结果 - 财务报表风格 */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          价格计算结果
                        </h4>
                        <div className="grid grid-cols-6 gap-3">
                          <div className="text-center bg-white rounded px-2 py-1.5 border border-slate-200 transition-all duration-300">
                            <div className="text-xs text-slate-500 mb-0.5">成本 USD</div>
                            <div className="text-base font-bold text-slate-900">${item.costUSD.toFixed(2)}</div>
                          </div>
                          <div className="text-center bg-white rounded px-2 py-1.5 border border-slate-200 transition-all duration-300">
                            <div className="text-xs text-slate-500 mb-0.5">国内费用</div>
                            <div className="text-base font-bold text-slate-900">${(item.domesticFeesCNY / item.exchangeRate).toFixed(2)}</div>
                          </div>
                          <div className="text-center bg-white rounded px-2 py-1.5 border border-slate-200 transition-all duration-300">
                            <div className="text-xs text-slate-500 mb-0.5">利润</div>
                            <div className="text-base font-bold text-slate-900">${item.profitUSD.toFixed(2)}</div>
                          </div>
                          <div className="text-center bg-white rounded px-2 py-1.5 border border-slate-200 transition-all duration-300">
                            <div className="text-xs text-slate-500 mb-0.5">利润率</div>
                            <div className={`text-base font-bold transition-all duration-300 ${item.profitMargin >= 20 ? 'text-green-600' : item.profitMargin >= 15 ? 'text-orange-600' : 'text-red-600'}`}>{item.profitMargin}%</div>
                          </div>
                          <div className="text-center bg-orange-50 rounded px-2 py-1.5 border border-orange-200 transition-all duration-300">
                            <div className="text-xs text-slate-600 mb-0.5">单价 {item.tradeTerms}</div>
                            <div className="text-lg font-bold text-orange-600">${item.quotePrice.toFixed(2)}</div>
                          </div>
                          <div className="text-center bg-slate-100 rounded px-2 py-1.5 border border-slate-300 transition-all duration-300">
                            <div className="text-xs text-slate-600 mb-0.5">小计金额</div>
                            <div className="text-lg font-bold text-slate-900">${(item.quotePrice * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      {/* 备注 */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">产品备注</label>
                        <textarea
                          value={item.remarks}
                          onChange={(e) => updateItem(item.id, { remarks: e.target.value })}
                          placeholder="选填：产品特殊说明、交货要求等"
                          rows={2}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 审批备注 */}
            <div className="px-5 pb-4">
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-600" />
                  提交给上级的审批说明
                  <Badge variant="destructive" className="text-xs h-5">必填</Badge>
                </h3>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="请说明：&#10;1. 报价策略（定价逻辑、竞争对手情况）&#10;2. 客户背景（订单潜力、合作意向）&#10;3. 特殊考虑（交期紧急、数量大、首单等）&#10;4. 需要上级关注的风险点"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg resize-none text-sm"
                />
                <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>此备注将随报价单一起流转至：<strong>区域业务主管</strong> → <strong>销售总监</strong>审核</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🎨 底部操作栏 - 固定 */}
          <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-between shadow-lg relative">
            <div className="flex items-center gap-6">
              <div className="text-xs text-slate-600">
                成本 = <span className="text-slate-400">成本明细(QT)</span> + <span className="text-orange-500 font-semibold">增值部分(QT)</span> + <span className="text-slate-400">主管审核</span> + <span className="text-slate-400">总监审核</span> + <span className="text-slate-400">返还客户</span>
              </div>
              <div className="w-px h-8 bg-slate-300" />
              <div className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-300 ${isUpdating ? 'bg-green-50 scale-105 ring-2 ring-green-300' : 'bg-transparent'}`}>
                <div className="text-center">
                  <div className="text-xs text-slate-500">总成本</div>
                  <div className="text-sm font-bold text-slate-900 transition-all duration-300">${totalCost.toFixed(2)}</div>
                </div>
                <div className="w-px h-10 bg-slate-300" />
                <div className="text-center">
                  <div className="text-xs text-slate-500">总利润</div>
                  <div className={`text-sm font-bold transition-all duration-300 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${totalProfit.toFixed(2)}</div>
                </div>
                <div className="w-px h-10 bg-slate-300" />
                <div className="text-center">
                  <div className="text-xs text-slate-500">利润率</div>
                  <div className={`text-sm font-bold transition-all duration-300 ${overallMargin >= 15 ? 'text-green-600' : overallMargin >= 10 ? 'text-orange-500' : 'text-red-600'}`}>{overallMargin.toFixed(1)}%</div>
                </div>
              </div>
              {/* 🔥 按钮移到统计信息后面 */}
              <div className="w-px h-8 bg-slate-300" />
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} className="h-9">
                  取消
                </Button>
                <Button onClick={handleSaveDraft} className="bg-slate-500 hover:bg-slate-600 h-9">
                  <Save className="w-4 h-4 mr-1.5" />
                  保存草稿
                </Button>
                <Button onClick={handleSubmitForApproval} className="bg-orange-500 hover:bg-orange-600 h-9">
                  <Send className="w-4 h-4 mr-1.5" />
                  提交复核
                </Button>
              </div>
            </div>
          </div>
          </div>
        </Resizable>
      </div>
    </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
