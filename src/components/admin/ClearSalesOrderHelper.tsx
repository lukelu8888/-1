/**
 * 🔥 清除销售订单数据助手
 * 用于清除指定业务员的所有销售订单数据（在制订单 + 历史订单）
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ClearSalesOrderHelper() {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const clearZhangWeiOrders = () => {
    if (!window.confirm('⚠️ 确定要清除业务员张伟的所有订单数据吗？\n\n这将删除：\n- 所有在制订单\n- 所有历史订单\n\n此操作不可恢复！')) {
      return;
    }

    setClearing(true);

    try {
      // 1. 获取所有销售订单
      const savedOrders = localStorage.getItem('salesOrders');
      let allOrders = [];
      
      if (savedOrders) {
        allOrders = JSON.parse(savedOrders);
        console.log('📋 当前总订单数:', allOrders.length);
      }

      // 2. 筛选出张伟的订单
      const zhangweiEmail = 'zhangwei@cosun.com';
      const zhangweiOrders = allOrders.filter((order: any) => 
        order.salesPerson === zhangweiEmail || 
        order.salesPersonEmail === zhangweiEmail
      );

      console.log('🔍 找到张伟的订单数:', zhangweiOrders.length);

      // 3. 保留其他业务员的订单
      const otherOrders = allOrders.filter((order: any) => 
        order.salesPerson !== zhangweiEmail && 
        order.salesPersonEmail !== zhangweiEmail
      );

      console.log('✅ 保留其他业务员的订单数:', otherOrders.length);

      // 4. 更新localStorage
      localStorage.setItem('salesOrders', JSON.stringify(otherOrders));

      console.log('💾 已更新localStorage');

      setCleared(true);
      toast.success(`✅ 成功清除张伟的 ${zhangweiOrders.length} 个订单！`, {
        description: '请刷新页面查看效果。',
        duration: 5000
      });

    } catch (error) {
      console.error('❌ 清除订单失败:', error);
      toast.error('清除失败，请查看控制台错误信息。');
    } finally {
      setClearing(false);
    }
  };

  const checkZhangWeiOrders = () => {
    try {
      const savedOrders = localStorage.getItem('salesOrders');
      
      if (!savedOrders) {
        toast.info('没有找到任何订单数据。');
        return;
      }

      const allOrders = JSON.parse(savedOrders);
      const zhangweiEmail = 'zhangwei@cosun.com';
      const zhangweiOrders = allOrders.filter((order: any) => 
        order.salesPerson === zhangweiEmail || 
        order.salesPersonEmail === zhangweiEmail
      );

      toast.info(`张伟当前有 ${zhangweiOrders.length} 个订单`, {
        description: `总订单数：${allOrders.length}`,
        duration: 3000
      });

      console.log('📊 订单统计:');
      console.log('  - 总订单数:', allOrders.length);
      console.log('  - 张伟的订单数:', zhangweiOrders.length);
      console.log('  - 张伟的订单详情:', zhangweiOrders);

    } catch (error) {
      console.error('❌ 查询订单失败:', error);
      toast.error('查询失败，请查看控制台错误信息。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-600" />
              清除销售订单数据
            </CardTitle>
            <CardDescription>
              清除业务员张伟的所有销售订单数据（在制订单 + 历史订单）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 警告提示 */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">⚠️ 警告</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    此操作将永久删除业务员张伟（zhangwei@cosun.com）的所有销售订单数据，包括：
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                    <li>所有在制订单（待处理、生产中等状态）</li>
                    <li>所有历史订单（已完成、已取消等状态）</li>
                  </ul>
                  <p className="text-sm text-yellow-700 mt-2 font-semibold">
                    此操作不可恢复，请谨慎操作！
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button
                onClick={checkZhangWeiOrders}
                variant="outline"
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                检查张伟的订单数量
              </Button>

              <Button
                onClick={clearZhangWeiOrders}
                variant="destructive"
                className="w-full"
                disabled={clearing || cleared}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearing ? '清除中...' : cleared ? '已清除' : '清除张伟的所有订单'}
              </Button>
            </div>

            {/* 成功提示 */}
            {cleared && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">✅ 清除成功</h3>
                    <p className="text-sm text-green-700 mt-1">
                      已成功清除张伟的所有订单数据。请刷新页面查看效果。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 刷新按钮 */}
            {cleared && (
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                刷新页面
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
