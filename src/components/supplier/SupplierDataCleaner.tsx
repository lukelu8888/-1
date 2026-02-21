import React from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

/**
 * 🧹 供应商数据清理工具
 * 清空所有测试数据，只保留真实业务流转数据
 */
export function SupplierDataCleaner() {
  const clearAllRFQData = () => {
    if (window.confirm('⚠️ 确定要清空所有询价数据吗？\n\n这将删除：\n- 所有询价单（RFQ）\n- 所有报价记录\n- 所有草稿\n\n此操作不可恢复！请确保已备份重要数据。')) {
      // 清空RFQ数据
      localStorage.removeItem('rfqs');
      
      toast.success('✅ 所有询价数据已清空', {
        description: '页面将在2秒后刷新，请重新从采购端发送询价'
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const showDataInfo = () => {
    const rfqsData = localStorage.getItem('rfqs');
    const rfqs = rfqsData ? JSON.parse(rfqsData) : [];
    
    console.log('📊 当前数据统计:');
    console.log(`  ├─ 询价单总数: ${rfqs.length}`);
    
    if (rfqs.length > 0) {
      console.log('  └─ 询价单列表:');
      rfqs.forEach((rfq: any, idx: number) => {
        console.log(`      ${idx + 1}. ${rfq.supplierRfqNo || rfq.rfqNumber || rfq.id}`);
        console.log(`         产品: ${rfq.productName}`);
        console.log(`         供应商: ${rfq.supplierName}`);
        console.log(`         状态: ${rfq.status}`);
        if (rfq.quotes?.length > 0) {
          console.log(`         报价数: ${rfq.quotes.length}`);
        }
      });
    }
    
    toast.info('数据统计信息已输出到控制台', {
      description: `共 ${rfqs.length} 条询价单`
    });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg shadow-2xl p-4 z-50 animate-pulse">
      <div className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
        <Trash2 className="w-5 h-5" />
        🧹 测试数据清理工具
      </div>
      <div className="flex flex-col gap-2">
        <Button
          onClick={showDataInfo}
          size="sm"
          variant="outline"
          className="text-xs h-8"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          查看当前数据
        </Button>
        <Button
          onClick={clearAllRFQData}
          size="sm"
          variant="destructive"
          className="text-xs h-8 bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          清空所有测试数据
        </Button>
      </div>
      <div className="text-[10px] text-gray-500 mt-2 text-center border-t pt-2">
        ⚠️ 点击上方按钮清空测试数据
      </div>
    </div>
  );
}