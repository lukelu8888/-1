import React, { forwardRef } from 'react';
import { PurchaseRequirementDocument, type PurchaseRequirementDocumentData } from '../documents/templates/PurchaseRequirementDocument';
import { A4PageContainer } from '../documents/A4PageContainer';
import { useAuth } from '../../hooks/useAuth'; // 🔥 使用useAuth而不是useUser

/**
 * 📋 采购需求单视图 - 基于采购需求单模板
 * 
 * 功能：
 * 1. 展示采购需求单的完整内容
 * 2. 使用专业的采购需求单格式
 * 3. 显示客户信息、产品清单、业务部说明、采购部反馈
 */

interface PurchaseRequirementViewProps {
  requirement: any; // 采购需求单数据
  zoom?: number;
  onClose?: () => void; // 🔥 关闭弹窗的回调
}

export const PurchaseRequirementView = forwardRef<HTMLDivElement, PurchaseRequirementViewProps>(
  ({ requirement, zoom = 100, onClose }, ref) => {
    const { currentUser } = useAuth(); // 🔥 使用useAuth获取有role字段的用户对象

    // 🔥 调试日志
    console.log('🔍 [PurchaseRequirementView] requirement:', requirement?.requirementNo);
    if (requirement?.items && requirement.items.length > 0) {
      console.log('   - 第一个产品 modelNo:', requirement.items[0].modelNo);
      console.log('   - 第一个产品 specification:', requirement.items[0].specification);
    }

    if (!requirement) {
      return (
        <div className="bg-white p-8 text-center">
          <p className="text-gray-500">未找到采购需求单数据</p>
        </div>
      );
    }

    // 🔥 脱敏函数 - 隐藏供应商公司名称（仅业务员查看时）
    const desensitizeFeedback = (feedback: string): string => {
      // 🔥 增强调试 - 记录所有信息
      console.log('🔍 [脱敏函数调用]', {
        hasFeedback: !!feedback,
        feedbackLength: feedback?.length,
        userRole: currentUser?.role,
        userName: currentUser?.name,
        userEmail: currentUser?.email,
        shouldDesensitize: currentUser?.role === 'Sales_Rep' // 🔥 修正：角色值是Sales_Rep不是salesperson
      });

      // 🔥 修正：业务员角色是Sales_Rep，不是salesperson
      if (!feedback || currentUser?.role !== 'Sales_Rep') {
        console.log('⏭️ [跳过脱敏] 原因:', !feedback ? '无反馈内容' : `角色不是业务员，当前角色：${currentUser?.role}`);
        return feedback; // 采购员和管理员可以看到完整信息
      }

      console.log('🔒 [脱敏处理] 业务员查看，开始脱敏供应商信息');
      console.log('📝 [原始反馈内容]:', feedback.substring(0, 200) + '...');

      // 🔥 脱敏策略：将供应商公司名称替换为"供应商X"
      // 匹配模式：中文公司名称（通常包含"有限公司"、"股份有限公司"等）
      let desensitized = feedback;
      
      // 提取所有供应商公司名称
      const companyPattern = /([^，：。\n]+?(?:有限公司|股份有限公司|集团|公司|厂|工厂))/g;
      const companies = new Set<string>();
      let match;
      
      while ((match = companyPattern.exec(feedback)) !== null) {
        companies.add(match[1]);
      }

      console.log('📊 [匹配到的公司名称]:', Array.from(companies));

      // 为每个供应商分配编号并替换
      const companyArray = Array.from(companies);
      companyArray.forEach((company, index) => {
        const supplierLabel = `供应商${String.fromCharCode(65 + index)}`; // A, B, C...
        desensitized = desensitized.replace(new RegExp(company, 'g'), supplierLabel);
        console.log(`   - 替换: ${company} → ${supplierLabel}`);
      });

      console.log('✅ [脱敏完成] 结果预览:', desensitized.substring(0, 200) + '...');
      return desensitized;
    };

    // 转换为采购需求单文档模板数据格式
    const convertToDocumentData = (): PurchaseRequirementDocumentData => {
      // 🔥 检查是否有采购员反馈
      const hasPurchaserFeedback = requirement.purchaserFeedback && requirement.purchaserFeedback.products;
      
      console.log('🔍 [转换文档数据] 采购反馈状态:', {
        hasFeedback: hasPurchaserFeedback,
        feedbackProductsCount: requirement.purchaserFeedback?.products?.length,
        originalItemsCount: requirement.items?.length
      });
      
      // 🔥 转换产品清单 - 优先使用采购员反馈的价格
      const products = (requirement.items || []).map((item: any, index: number) => {
        // 🔥 查找对应的采购反馈产品（通过productId匹配）
        const feedbackProduct = hasPurchaserFeedback 
          ? requirement.purchaserFeedback.products.find((fp: any) => fp.productId === item.id)
          : null;
        
        if (feedbackProduct) {
          console.log(`  ✅ 产品 ${index + 1} 使用采购反馈价格:`, {
            productName: feedbackProduct.productName,
            costPrice: feedbackProduct.costPrice,
            currency: feedbackProduct.currency,
            originalTargetPrice: item.targetPrice
          });
        }
        
        return {
          no: index + 1,
          modelNo: item.modelNo || 'N/A',
          productName: item.productName || feedbackProduct?.productName || `Product ${index + 1}`,
          specification: feedbackProduct?.specification || item.specification || '-',
          quantity: feedbackProduct?.quantity || item.quantity || 0,
          unit: feedbackProduct?.unit || item.unit || 'PCS',
          // 🔥 优先使用采购反馈的成本价，否则使用目标价
          unitPrice: feedbackProduct?.costPrice || item.targetPrice || item.unitPrice || 0,
          currency: feedbackProduct?.currency || item.targetCurrency || 'USD', // 🔥 添加货币字段
          moq: feedbackProduct?.moq, // 🔥 添加MOQ
          leadTime: feedbackProduct?.leadTime, // 🔥 添加交货期
          imageUrl: item.imageUrl || '', // 🔥 同步产品图片
          remarks: feedbackProduct?.remarks || item.remarks || ''
        };
      });

      return {
        // 采购需求单基本信息
        requirementNo: requirement.requirementNo,
        requirementDate: requirement.createdDate || new Date().toISOString().split('T')[0],
        sourceInquiryNo: requirement.sourceInquiryNumber || '-',
        requiredResponseDate: requirement.requiredResponseDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requiredDeliveryDate: requirement.requiredDeliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // 客户信息
        customer: {
          companyName: requirement.customer?.companyName || 'N/A',
          contactPerson: requirement.customer?.contactPerson || 'N/A',
          email: requirement.customer?.email || 'N/A',
          phone: requirement.customer?.phone || 'N/A',
          address: requirement.customer?.address || 'N/A',
          region: requirement.region || requirement.customer?.region || 'North America'
        },
        
        // 产品清单
        products: products,
        
        // 客户需求要素
        customerRequirements: {
          deliveryTerms: requirement.deliveryTerms || '',
          paymentTerms: requirement.paymentTerms || '',
          qualityStandard: requirement.qualityStandard || '',
          packaging: requirement.packaging || '',
          specialRequirements: requirement.specialRequirements || ''
        },
        
        // 业务部说明
        salesDeptNotes: requirement.salesDeptNotes || requirement.notes || '',
        
        // 🔥 采购部反馈 - 从采购反馈中读取采购员建议
        purchaseDeptFeedback: desensitizeFeedback(requirement.purchaserFeedback?.purchaserRemarks || requirement.purchaseDeptFeedback || ''),
        
        urgency: requirement.urgency || 'medium',
        createdBy: requirement.createdBy || currentUser?.email || 'N/A'
      };
    };

    const documentData = convertToDocumentData();

    return (
      <div ref={ref}>
        <A4PageContainer zoom={zoom}>
          <PurchaseRequirementDocument data={documentData} />
        </A4PageContainer>
      </div>
    );
  }
);

PurchaseRequirementView.displayName = 'PurchaseRequirementView';