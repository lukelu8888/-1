import React from 'react';
import { Button } from '../ui/button';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { toast } from 'sonner';

/**
 * 🔧 采购数据调试工具
 * 用于检查和修复采购需求数据
 */
export function ProcurementDataDebugger() {
  const { requirements } = useQuoteRequirements();

  const diagnoseData = () => {
    console.log('🔍 ========== 采购数据诊断开始 ==========');
    console.log(`📊 总需求数量: ${requirements.length}`);
    
    let issueCount = 0;
    
    requirements.forEach((req, index) => {
      console.log(`\n📋 需求 ${index + 1}:`);
      console.log(`  ├─ 需求编号: ${req.requirementNo}`);
      console.log(`  ├─ 来源单号: ${req.sourceRef || '❌ 缺失'}`);
      console.log(`  ├─ 区域: ${req.region || '❌ 缺失'}`);
      console.log(`  └─ 创建日期: ${req.createdDate}`);
      
      // 检查问题
      const issues = [];
      if (!req.sourceRef) issues.push('来源单号缺失');
      if (!req.region) issues.push('区域信息缺失');
      if (req.requirementNo === req.sourceRef) issues.push('需求编号和来源单号相同（应该不同）');
      
      if (issues.length > 0) {
        console.log(`  ⚠️  问题: ${issues.join(', ')}`);
        issueCount++;
      } else {
        console.log(`  ✅ 数据正常`);
      }
    });
    
    console.log(`\n📈 诊断结果:`);
    console.log(`  ├─ 正常数据: ${requirements.length - issueCount} 条`);
    console.log(`  └─ 问题数据: ${issueCount} 条`);
    console.log('🔍 ========== 诊断结束 ==========\n');
    
    if (issueCount > 0) {
      toast.warning(`发现 ${issueCount} 条问题数据，请查看控制台详情`, {
        description: '这些可能是旧测试数据，建议删除后重新测试'
      });
    } else {
      toast.success('✅ 所有数据正常！', {
        description: `共 ${requirements.length} 条采购需求`
      });
    }
  };

  const clearOldData = () => {
    if (window.confirm('⚠️ 确定要清除所有采购需求数据吗？\n\n这将删除所有采购需求，此操作不可恢复！\n\n建议：先做好数据备份。')) {
      localStorage.removeItem('purchaseRequirements');
      toast.success('已清除采购需求数据，请刷新页面');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-orange-500 rounded-lg shadow-lg p-3 z-50">
      <div className="text-xs font-bold text-orange-600 mb-2">🔧 数据调试工具</div>
      <div className="flex gap-2">
        <Button
          onClick={diagnoseData}
          size="sm"
          variant="outline"
          className="text-xs h-7"
        >
          🔍 诊断数据
        </Button>
        <Button
          onClick={clearOldData}
          size="sm"
          variant="destructive"
          className="text-xs h-7"
        >
          🗑️ 清除旧数据
        </Button>
      </div>
      <div className="text-[10px] text-gray-500 mt-2">
        需求数量: {requirements.length}
      </div>
    </div>
  );
}
