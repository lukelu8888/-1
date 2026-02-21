// 🔥 处理删除采购订单 - 使用Context
const handleDeletePurchaseOrder = (po: PurchaseOrderType) => {
  const productSummary = po.items.length > 0 
    ? po.items[0].productName + (po.items.length > 1 ? ` 等${po.items.length}个产品` : '') 
    : '无产品';
  
  if (window.confirm(`确定要删除采购订单 \"${po.poNumber}\" 吗?\n\n供应商: ${po.supplierName}\n产品: ${productSummary}\n金额: ${po.currency} ${po.totalAmount.toLocaleString()}\n\n⚠️ 此操作不可恢复！`)) {
    deletePurchaseOrder(po.id);
    toast.success('采购订单已删除', {
      description: `${po.poNumber} - ${po.supplierName}`,
      duration: 3000
    });
  }
};
