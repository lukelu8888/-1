import React, { forwardRef } from 'react';
import { CustomerInquiryDocument, type CustomerInquiryData } from '../documents/templates/CustomerInquiryDocument';
import { A4PageContainer } from '../documents/A4PageContainer';
import { useUser } from '../../contexts/UserContext';
import { extractModelNo, extractSpecification } from '../../utils/productDataExtractor';

/**
 * 📋 客户端询价单视图 - 使用文档中心的专业模板
 * 
 * 功能：
 * 1. 将客户端的 inquiry 数据转换为文档模板格式
 * 2. 使用与文档中心相同的专业 A4 模板
 * 3. 支持预览和打印
 */

interface CustomerInquiryViewProps {
  inquiry: any;
  zoom?: number;
}

export const CustomerInquiryView = forwardRef<HTMLDivElement, CustomerInquiryViewProps>(
  ({ inquiry, zoom = 100 }, ref) => {
    const { user } = useUser();

    // 转换为文档模板数据格式
    const convertToDocumentData = (): CustomerInquiryData => {
      // 获取区域代码
      const getRegionCode = (region?: string): 'NA' | 'SA' | 'EU' => {
        if (!region) return 'NA';
        const r = region.toUpperCase();
        if (r.includes('NORTH') || r === 'NA') return 'NA';
        if (r.includes('SOUTH') || r === 'SA') return 'SA';
        return 'EU';
      };

      // 转换产品列表
      const products = (inquiry.products || []).map((product: any, index: number) => {
        // 🔥 优先使用 product.modelNo，如果没有再尝试其他字段
        let modelNo = product.modelNo || product.sku || product.productCode || product.id || '';
        
        // 智能提取 SKU（例如："appliances-refrigerators-french-door-ref-fd-001" => "FD-001"）
        if (modelNo && modelNo !== 'N/A' && !product.modelNo) {
          // 只有当 modelNo 来自 sku/productCode/id 时才做智能提取
          const segments = modelNo.split('-');
          if (segments.length >= 2) {
            const lastSegment = segments[segments.length - 1];
            const secondLastSegment = segments[segments.length - 2];
            
            if (/^[a-zA-Z0-9]+$/.test(lastSegment)) {
              if (secondLastSegment && secondLastSegment.length <= 4 && /^[a-zA-Z]+$/.test(secondLastSegment)) {
                modelNo = `${secondLastSegment.toUpperCase()}-${lastSegment}`;
              } else {
                modelNo = lastSegment;
              }
            }
          }
        }
        
        // 如果还没有 modelNo，使用 color 或生成序号
        if (!modelNo || modelNo === 'N/A') {
          modelNo = product.color || String(index + 1).padStart(4, '0');
        }

        return {
          no: index + 1,
          modelNo: modelNo,
          imageUrl: product.image || undefined,
          productName: product.productName || product.name || 'N/A',
          specification: extractSpecification(product.specification || product.specifications || product.specs || undefined),
          quantity: product.quantity || 0,
          unit: product.unit || 'pcs',
          targetPrice: product.targetPrice || product.unitPrice || product.price || undefined,
          currency: 'USD',
          description: product.description || undefined,
        };
      });

      // 构建客户信息
      const customer = {
        companyName: inquiry.buyerInfo?.companyName || 
                    inquiry.customerName || 
                    inquiry.customer?.company || 
                    user?.company || 
                    'N/A',
        contactPerson: inquiry.buyerInfo?.contactPerson || 
                      inquiry.customer?.name || 
                      inquiry.customerName || 
                      user?.name || 
                      'N/A',
        position: inquiry.buyerInfo?.position || 
                 inquiry.customer?.position || 
                 undefined,
        email: inquiry.buyerInfo?.email || 
              inquiry.customerEmail || 
              inquiry.customer?.email || 
              user?.email || 
              'N/A',
        phone: inquiry.buyerInfo?.phone || 
              inquiry.customerPhone || 
              inquiry.customer?.phone || 
              user?.phone || 
              undefined,
        address: inquiry.buyerInfo?.address || 
                inquiry.deliveryAddress || 
                user?.address || 
                undefined,
        country: inquiry.buyerInfo?.country || 
                inquiry.customer?.country || 
                'United States',
      };

      // 构建交易要求
      const requirements = inquiry.shippingInfo || inquiry.requirements ? {
        deliveryTime: inquiry.shippingInfo?.deliveryTime || 
                     inquiry.requirements?.deliveryTime || 
                     undefined,
        portOfDestination: inquiry.shippingInfo?.portOfDestination || 
                          inquiry.requirements?.portOfDestination || 
                          undefined,
        paymentTerms: inquiry.shippingInfo?.paymentTerms || 
                     inquiry.requirements?.paymentTerms || 
                     'T/T or L/C',
        tradeTerms: inquiry.shippingInfo?.tradeTerms || 
                   inquiry.requirements?.tradeTerms || 
                   'FOB / CIF',
        packingRequirements: inquiry.shippingInfo?.packingRequirements || 
                            inquiry.requirements?.packingRequirements || 
                            undefined,
        certifications: inquiry.requirements?.certifications || undefined,
        otherRequirements: inquiry.requirements?.otherRequirements || undefined,
      } : undefined;

      // 构建备注
      const remarks = inquiry.message || inquiry.remarks || inquiry.notes || undefined;

      return {
        inquiryNo: inquiry.id || inquiry.inquiryNumber || 'N/A',
        inquiryDate: inquiry.date || inquiry.inquiryDate || new Date().toISOString().split('T')[0],
        region: getRegionCode(inquiry.region),
        customer,
        products,
        requirements,
        remarks,
        // 后台字段（不显示在文档上）
        source: inquiry.source,
        assignedTo: inquiry.assignedTo,
        status: inquiry.status,
      };
    };

    const documentData = convertToDocumentData();

    return (
      <div 
        ref={ref}
        className="flex justify-center overflow-auto py-4"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out'
        }}
      >
        <A4PageContainer>
          <CustomerInquiryDocument data={documentData} />
        </A4PageContainer>
      </div>
    );
  }
);

CustomerInquiryView.displayName = 'CustomerInquiryView';