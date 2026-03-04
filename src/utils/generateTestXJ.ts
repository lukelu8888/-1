/**
 * 🔥 生成测试采购询价(XJ)数据 - 正确的多产品询价单结构
 * 
 * 正确的业务流程和编号：
 * 1️⃣ 客户提交询价 → INQ-xxx（客户询价单号）
 * 2️⃣ COSUN创建采购需求 → QR-xxx（采购需求编号 Quotation Request）
 * 3️⃣ COSUN发送采购询价 → XJ-xxx（采购询价单号）
 * 4️⃣ 供应商提交报价 → BJ-xxx（供应商报价单号）
 * 
 * 供应商端看到的关联关系：
 * - XJ-251219-0001（自己的询价单号）
 * - QR-NA-251219-1234（COSUN采购需求编号）
 * - BJ-251219-0001（自己的报价单号，报价后生成）
 * 
 * ⚠️ 注意：不存在RFQ-xxx编号！xjNumber字段存储的是QR-xxx
 */

import { RFQ, RFQProduct } from '../contexts/XJContext';
import { generateXJNumber } from './xjNumberGenerator'; // 🔥 导入XJ编号生成器

export function generateTestMultiProductRFQ(): RFQ[] {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const today = new Date().toISOString().split('T')[0];
  
  // 🔥 模拟产品列表
  const products: RFQProduct[] = [
    {
      id: 'prod_001',
      productName: 'Front Load Washer 5.0 cu.ft',
      modelNo: 'WM5000HVA',
      specification: '智能洗衣机，蒸汽清洁功能',
      quantity: 100,
      unit: 'pcs',
      targetPrice: 450,
      currency: 'USD'
    },
    {
      id: 'prod_002',
      productName: 'Front Load Washer 4.5 cu.ft',
      modelNo: 'WM4500HVA',
      specification: '节能型洗衣机',
      quantity: 100,
      unit: 'pcs',
      targetPrice: 380,
      currency: 'USD'
    },
    {
      id: 'prod_003',
      productName: 'Electric Dryer 7.4 cu.ft',
      modelNo: 'DLEX4000V',
      specification: '蒸汽烘干功能',
      quantity: 80,
      unit: 'pcs',
      targetPrice: 420,
      currency: 'USD'
    }
  ];

  const qrNumber = `QR-NA-${dateStr}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  const rfq: RFQ = {
    id: `rfq_${Date.now()}_test`,
    xjNumber: qrNumber, // ⚠️ 字段名保留兼容性，实际存储QR采购需求编号
    supplierXjNo: generateXJNumber(), // 🔥 采购询价单号（从0001开始递增）
    requirementNo: qrNumber, // 🔥 COSUN采购需求编号
    
    // 🔥 多产品数组（新字段）
    products: products,
    
    // 🔥 主产品信息（兼容旧字段，使用第一个产品）
    productName: products[0].productName,
    modelNo: products[0].modelNo,
    specification: products[0].specification,
    quantity: products[0].quantity,
    unit: products[0].unit,
    targetPrice: products[0].targetPrice,
    currency: products[0].currency,
    
    // 供应商信息
    supplierCode: 'dongguan-washer-001',
    supplierName: '东莞市华德电器有限公司',
    supplierContact: '李工',
    supplierEmail: 'supplier@dongguan-washer.com',
    
    // 询价信息
    expectedDate: '2025-01-15',
    quotationDeadline: '2024-12-25',
    
    // 状态
    status: 'pending',
    
    // 其他信息
    remarks: '请提供各产品的详细报价，包含包装方案和物流建议',
    createdBy: '采购员-张三',
    createdDate: today,
    
    // 关联信息
    requirementNo: qrNumber, // 🔥 COSUN采购需求编号
    sourceRef: 'SO-NA-001',
    customerName: 'Best Buy',
    customerRegion: 'NA'
  };

  return [rfq];
}

// 🔥 在浏览器控制台执行此函数生成测试数据
if (typeof window !== 'undefined') {
  (window as any).generateTestXJ = () => {
    const { useXJs } = require('../contexts/XJContext');
    const testRFQs = generateTestMultiProductRFQ();
    
    testRFQs.forEach(rfq => {
      const { addXJ } = useXJs();
      addXJ(rfq);
    });
    
    console.log('✅ 已生成测试XJ数据:', testRFQs.length);
  };
}
