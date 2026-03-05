/**
 * 🔥 智能采购反馈工具
 * 
 * 功能：自动从供应商报价单（BJ）提取数据，填充到采购需求（QR）的反馈模块
 * 链路追溯：QR → XJ → BJ
 */

import { PurchaseRequirement, PurchaserFeedback, PurchaserFeedbackProduct } from '../contexts/PurchaseRequirementContext';
import { RFQ } from '../contexts/XJContext';

interface SupplierQuotation {
  id: string;
  quotationNo: string; // BJ-251221-3762
  sourceXJ?: string; // 关联的XJ询价单号
  supplierName: string;
  supplierCompany?: string;
  currency: string;
  status: string;
  quotationDate: string;
  validUntil: string;
  items: Array<{
    id: string;
    productName: string;
    specification: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    currency: string;
    moq?: number;
    leadTime?: number;
    remarks?: string;
  }>;
  paymentTerms?: string;
  deliveryTerms?: string;
  packingTerms?: string;
  warrantyTerms?: string;
  generalRemarks?: string;
  supplierRemarks?: string;
}

/**
 * 🔥 自动从BJ提取数据，填充QR的采购反馈
 * @param qr 采购需求单
 * @param rfqs 所有XJ询价单列表
 * @param supplierQuotations 所有供应商报价单列表
 * @param currentUserName 当前采购员姓名
 * @returns 自动生成的采购反馈对象
 */
export function autoPopulateFeedbackFromBJ(
  qr: PurchaseRequirement,
  rfqs: XJ[],
  supplierQuotations: any[],
  currentUserName: string
): PurchaserFeedback | null {
  
  console.log('🔍 开始智能追溯链路：QR → XJ → BJ');
  console.log('  📋 QR编号:', qr.requirementNo);
  
  // 🔥 步骤1：找到关联的XJ（询价单）
  // 通过 sourceQRNumber 或 requirementNo 匹配
  const relatedXJs = rfqs.filter(xj => 
    xj.sourceQRNumber === qr.requirementNo || 
    xj.requirementNo === qr.requirementNo
  );
  
  console.log('  📤 找到关联的XJ数量:', relatedXJs.length);
  
  if (relatedXJs.length === 0) {
    console.warn('  ⚠️ 未找到关联的XJ询价单');
    return null;
  }
  
  // 🔥 步骤2：找到关联的BJ（供应商报价单）
  // 通过 XJ 的 supplierXjNo 匹配 BJ 的 sourceXJ
  const relatedBJs = supplierQuotations.filter(bj => {
    // BJ状态必须是已提交
    if (bj.status !== 'submitted') return false;
    
    // 匹配XJ编号
    return relatedXJs.some(xj => 
      bj.sourceXJ === xj.supplierXjNo || 
      bj.sourceXJ === xj.xjNumber
    );
  });
  
  console.log('  📥 找到关联的BJ数量:', relatedBJs.length);
  
  if (relatedBJs.length === 0) {
    console.warn('  ⚠️ 未找到已提交的BJ报价单');
    return null;
  }
  
  // 🔥 步骤3：如果有多个BJ，选择最优的（价格最低或最新）
  const selectedBJ = selectBestBJ(relatedBJs);
  
  console.log('  ✅ 选择的BJ:', selectedBJ.quotationNo);
  console.log('  📊 供应商:', selectedBJ.supplierName || selectedBJ.supplierCompany);
  
  // 🔥 步骤4：自动提取数据，构建采购反馈
  const feedback: PurchaserFeedback = {
    status: 'quoted',
    feedbackDate: new Date().toISOString().split('T')[0],
    feedbackBy: currentUserName,
    
    // 🔥 关联信息（仅采购员可见）
    linkedBJ: selectedBJ.quotationNo,
    linkedSupplier: selectedBJ.supplierName || selectedBJ.supplierCompany || '供应商',
    linkedXJ: selectedBJ.sourceXJ || relatedXJs[0]?.supplierXjNo,
    
    // 🔥 产品成本信息（自动提取）
    products: selectedBJ.items.map((bjItem: any) => {
      // 🔥 匹配QR中的产品（通过产品名称或型号）
      const qrItem = qr.items.find(item => 
        item.productName === bjItem.productName || 
        item.modelNo === bjItem.modelNo
      );
      
      const feedbackProduct: PurchaserFeedbackProduct = {
        productId: qrItem?.id || bjItem.id,
        productName: bjItem.productName,
        specification: bjItem.specification || '',
        quantity: bjItem.quantity,
        unit: bjItem.unit,
        costPrice: bjItem.unitPrice, // 🔥 核心：成本单价
        currency: bjItem.currency || selectedBJ.currency || 'CNY',
        amount: bjItem.amount || (bjItem.unitPrice * bjItem.quantity),
        moq: bjItem.moq,
        leadTime: bjItem.leadTime ? `${bjItem.leadTime}天` : undefined,
        remarks: bjItem.remarks
      };
      
      return feedbackProduct;
    }),
    
    // 🔥 商务条款（自动提取）
    paymentTerms: selectedBJ.paymentTerms || 'T/T 30% 定金，70% 发货前',
    deliveryTerms: selectedBJ.deliveryTerms || 'FOB 厦门',
    packaging: selectedBJ.packingTerms || '标准出口包装',
    warranty: selectedBJ.warrantyTerms || '12个月',
    
    // 🔥 采购员建议（默认模板，可手动修改）
    purchaserRemarks: generateDefaultRemarks(selectedBJ),
    
    // 🔥 成本分析（默认值，可手动修改）
    suggestedMargin: 30, // 默认建议30%利润率
    riskLevel: 'medium' // 默认中风险
  };
  
  console.log('  ✅ 智能反馈生成完成');
  console.log('  📊 产品数量:', feedback.products.length);
  console.log('  💰 总成本:', feedback.products.reduce((sum, p) => sum + p.amount, 0).toFixed(2), feedback.products[0]?.currency);
  
  return feedback;
}

/**
 * 🔥 选择最优的BJ（多个供应商报价时）
 * 策略：优先选择价格最低的，如果价格相同则选择最新的
 */
function selectBestBJ(bjs: any[]): any {
  if (bjs.length === 1) return bjs[0];
  
  // 计算每个BJ的总价
  const bjsWithTotal = bjs.map(bj => {
    const totalCost = bj.items.reduce((sum: number, item: any) => 
      sum + (item.amount || (item.unitPrice * item.quantity)), 
      0
    );
    return { bj, totalCost };
  });
  
  // 按总价升序排序，价格相同则按日期降序
  bjsWithTotal.sort((a, b) => {
    if (Math.abs(a.totalCost - b.totalCost) < 0.01) {
      // 价格相同，选择最新的
      return new Date(b.bj.quotationDate).getTime() - new Date(a.bj.quotationDate).getTime();
    }
    return a.totalCost - b.totalCost;
  });
  
  console.log('  🎯 多个BJ报价比较:');
  bjsWithTotal.forEach((item, index) => {
    console.log(`    ${index + 1}. ${item.bj.quotationNo} - ${item.bj.supplierName}: ${item.totalCost.toFixed(2)}`);
  });
  
  return bjsWithTotal[0].bj;
}

/**
 * 🔥 生成默认的采购员建议
 */
function generateDefaultRemarks(bj: any): string {
  const totalCost = bj.items.reduce((sum: number, item: any) => 
    sum + (item.amount || (item.unitPrice * item.quantity)), 
    0
  );
  
  const avgLeadTime = bj.items.reduce((sum: number, item: any) => 
    sum + (item.leadTime || 30), 
    0
  ) / bj.items.length;
  
  return `供应商报价已确认，总成本约 ${totalCost.toFixed(2)} ${bj.currency || 'CNY'}。

【供应能力】
- 交货周期：${Math.round(avgLeadTime)}天
- 付款方式：${bj.paymentTerms || 'T/T 30% 定金，70% 发货前'}
- 质保期：${bj.warrantyTerms || '12个月'}

【建议】
1. 建议销售加价30%-40%，确保合理利润空间
2. 该供应商${bj.supplierName ? `（${bj.supplierName}）` : ''}产能稳定，质量可靠
3. 大单（数量超过MOQ的3倍）可再议价5%-8%
4. 建议提前收取30%定金以锁定生产排期

如有特殊要求，请及时与采购部沟通。`;
}

/**
 * 🔥 验证反馈数据完整性
 */
export function validateFeedback(feedback: PurchaserFeedback): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!feedback.products || feedback.products.length === 0) {
    errors.push('产品列表不能为空');
  }
  
  feedback.products.forEach((product, index) => {
    if (!product.costPrice || product.costPrice <= 0) {
      errors.push(`产品 ${index + 1}（${product.productName}）的成本单价无效`);
    }
    if (!product.currency) {
      errors.push(`产品 ${index + 1}（${product.productName}）缺少货币信息`);
    }
  });
  
  if (!feedback.paymentTerms) {
    errors.push('付款方式不能为空');
  }
  
  if (!feedback.deliveryTerms) {
    errors.push('交货条款不能为空');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 🔥 计算建议售价（基于成本和利润率）
 */
export function calculateSuggestedPrice(
  costPrice: number,
  marginPercent: number
): number {
  return costPrice * (1 + marginPercent / 100);
}

/**
 * 🔥 格式化采购反馈为可读文本（用于展示）
 */
export function formatFeedbackSummary(feedback: PurchaserFeedback): string {
  const totalCost = feedback.products.reduce((sum, p) => sum + p.amount, 0);
  const currency = feedback.products[0]?.currency || 'CNY';
  
  return `
📊 采购反馈摘要
━━━━━━━━━━━━━━━━━━━━
反馈时间：${feedback.feedbackDate}
反馈人：${feedback.feedbackBy}
状态：${feedback.status === 'quoted' ? '✅ 已报价' : feedback.status === 'rejected' ? '❌ 已拒绝' : '⏳ 待反馈'}

💰 成本信息
总成本：${totalCost.toFixed(2)} ${currency}
产品数量：${feedback.products.length}

📦 商务条款
付款方式：${feedback.paymentTerms}
交货条款：${feedback.deliveryTerms}
包装方式：${feedback.packaging}
质保期：${feedback.warranty}

💡 采购建议
建议利润率：${feedback.suggestedMargin}%
风险评级：${feedback.riskLevel === 'low' ? '🟢 低风险' : feedback.riskLevel === 'high' ? '🔴 高风险' : '🟡 中风险'}

${feedback.purchaserRemarks}
━━━━━━━━━━━━━━━━━━━━
  `.trim();
}
