/**
 * 🔥 报价数据迁移工具
 * 
 * 用途：将XJ(采购询价)中的quote转换成独立的BJ供应商报价单对象
 * 使用场景：供应商已经提交过报价，但系统还没有创建BJ对象
 */

export function migrateRFQQuotesToBJQuotations() {
  try {
    console.log('🚀 开始迁移XJ报价数据到BJ报价单...');
    
    // 1. 读取所有XJ
    const rfqsData = localStorage.getItem('rfqs');
    if (!rfqsData) {
      console.log('⚠️ 没有找到XJ数据');
      return { success: false, message: '没有找到XJ数据' };
    }
    
    const rfqs = JSON.parse(rfqsData);
    console.log(`📊 找到 ${rfqs.length} 个XJ`);
    
    // 2. 读取现有的BJ报价单
    const existingBJs = JSON.parse(localStorage.getItem('supplierQuotations') || '[]');
    console.log(`📊 现有BJ报价单: ${existingBJs.length} 个`);
    
    // 3. 遍历所有XJ，找到有报价的
    let migratedCount = 0;
    const newBJs: any[] = [];
    
    rfqs.forEach((rfq: any) => {
      // 检查是否有supplierQuotationNo（说明供应商已经提交报价）
      if (rfq.supplierQuotationNo && rfq.quotes && rfq.quotes.length > 0) {
        const quote = rfq.quotes[0]; // 取第一个报价
        
        // 检查是否已经存在对应的BJ
        const bjExists = existingBJs.some((bj: any) => bj.quotationNo === rfq.supplierQuotationNo);
        
        if (!bjExists) {
          console.log(`  ✅ 迁移: ${rfq.supplierQuotationNo} (XJ: ${rfq.supplierXjNo})`);
          
          // 创建BJ报价单对象
          const bjQuotation = {
            id: `bj_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            quotationNo: rfq.supplierQuotationNo,
            sourceXJ: rfq.supplierXjNo, // 关联XJ询价单号
            sourceQR: rfq.requirementNo, // 关联QR采购需求号
            sourceRFQId: rfq.id,
            customerName: rfq.customerName || 'COSUN',
            customerCompany: 'COSUN贸易',
            supplierCode: quote.supplierCode,
            supplierName: quote.supplierName,
            supplierCompany: quote.supplierName,
            supplierEmail: quote.supplierCode,
            quotationDate: quote.quotedDate || new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + (quote.validityDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currency: quote.currency || 'USD',
            totalAmount: quote.quotedPrice * (rfq.quantity || 0),
            paymentTerms: quote.paymentTerms,
            items: rfq.products?.map((p: any) => ({
              id: p.id || `item_${Date.now()}`,
              productName: p.productName,
              modelNo: p.modelNo || 'N/A',
              specification: p.specification,
              quantity: p.quantity,
              unit: p.unit || 'pcs',
              unitPrice: quote.quotedPrice,
              currency: quote.currency || 'USD',
              amount: quote.quotedPrice * p.quantity,
              leadTime: quote.leadTime,
              moq: quote.moq,
              remarks: quote.remarks
            })) || [{
              id: `item_${Date.now()}`,
              productName: rfq.productName,
              modelNo: rfq.modelNo || 'N/A',
              specification: rfq.specification,
              quantity: rfq.quantity,
              unit: rfq.unit || 'pcs',
              unitPrice: quote.quotedPrice,
              currency: quote.currency || 'USD',
              amount: quote.quotedPrice * rfq.quantity,
              leadTime: quote.leadTime,
              moq: quote.moq,
              remarks: quote.remarks
            }],
            status: 'submitted' as const,
            createdBy: quote.supplierCode,
            createdDate: quote.quotedDate || new Date().toISOString().split('T')[0],
            version: 1
          };
          
          newBJs.push(bjQuotation);
          migratedCount++;
        }
      }
    });
    
    // 4. 保存合并后的BJ报价单
    if (newBJs.length > 0) {
      const allBJs = [...existingBJs, ...newBJs];
      localStorage.setItem('supplierQuotations', JSON.stringify(allBJs));
      
      console.log(`✅ 迁移完成！创建了 ${migratedCount} 个BJ报价单`);
      console.log(`📊 总BJ报价单数: ${allBJs.length}`);
      
      return {
        success: true,
        message: `成功迁移 ${migratedCount} 个报价单`,
        migratedCount,
        totalBJs: allBJs.length
      };
    } else {
      console.log('ℹ️ 没有需要迁移的报价单');
      return {
        success: true,
        message: '没有需要迁移的报价单',
        migratedCount: 0,
        totalBJs: existingBJs.length
      };
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    return {
      success: false,
      message: `迁移失败: ${error}`,
      migratedCount: 0
    };
  }
}

/**
 * 🔥 查看迁移状态
 */
export function checkMigrationStatus() {
  const rfqs = JSON.parse(localStorage.getItem('rfqs') || '[]');
  const bjs = JSON.parse(localStorage.getItem('supplierQuotations') || '[]');
  
  const rfqsWithQuotes = rfqs.filter((rfq: any) => rfq.supplierQuotationNo && rfq.quotes);
  const unmatchedRFQs = rfqsWithQuotes.filter((rfq: any) => 
    !bjs.some((bj: any) => bj.quotationNo === rfq.supplierQuotationNo)
  );
  
  console.log('📊 迁移状态:');
  console.log(`  - 总XJ数: ${rfqs.length}`);
  console.log(`  - 有报价的XJ: ${rfqsWithQuotes.length}`);
  console.log(`  - 总BJ报价单: ${bjs.length}`);
  console.log(`  - 需要迁移的XJ: ${unmatchedRFQs.length}`);
  
  if (unmatchedRFQs.length > 0) {
    console.log('⚠️ 需要迁移的XJ:');
    unmatchedRFQs.forEach((rfq: any) => {
      console.log(`  - ${rfq.supplierQuotationNo} (XJ: ${rfq.supplierXjNo}, QR: ${rfq.requirementNo})`);
    });
  }
  
  return {
    totalRFQs: rfqs.length,
    rfqsWithQuotes: rfqsWithQuotes.length,
    totalBJs: bjs.length,
    unmatchedRFQs: unmatchedRFQs.length,
    needsMigration: unmatchedRFQs.length > 0
  };
}
