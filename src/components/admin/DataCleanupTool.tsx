import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 数据清理工具 - 用于开发和测试
 * 清除所有业务流程的临时数据，保留用户登录状态和系统配置
 */

interface DataCategory {
  key: string;
  label: string;
  storageKeys: string[];
  description: string;
  color: string;
}

const dataCategories: DataCategory[] = [
  {
    key: 'ing',
    label: '询价单数据',
    storageKeys: ['cosun_inquiries'],
    description: '客户提交的所有询价单',
    color: 'text-blue-600'
  },
  {
    key: 'qt',
    label: '报价单数据',
    storageKeys: ['cosun_quotations'],
    description: '销售人员创建的所有报价单',
    color: 'text-purple-600'
  },
  {
    key: 'order',
    label: '销售订单数据',
    storageKeys: ['cosun_orders_'],
    description: '所有销售订单（包括各客户的订单）',
    color: 'text-green-600'
  },
  {
    key: 'qr',
    label: '采购需求数据',
    storageKeys: ['purchaseRequirements'],
    description: '从销售订单下推的采购需求',
    color: 'text-orange-600'
  },
  {
    key: 'xj',
    label: '采购询价管理数据',
    storageKeys: ['xjs', 'supplierXJs'],
    description: 'Admin端询价管理和供应商XJ数据（XJ系列）',
    color: 'text-cyan-600'
  },
  {
    key: 'supplier-quotation',
    label: '供应商报价数据',
    storageKeys: ['supplierQuotations'],
    description: '供应商提交的报价单（BJ系列）',
    color: 'text-violet-600'
  },
  {
    key: 'cg',
    label: '采购订单数据',
    storageKeys: ['purchaseOrders'],
    description: '向供应商下达的采购订单',
    color: 'text-red-600'
  },
  {
    key: 'finance',
    label: '财务数据',
    storageKeys: ['cosun_finance_records', 'cosun_payments'],
    description: '收款记录和财务数据',
    color: 'text-yellow-600'
  },
  {
    key: 'approval',
    label: '审批数据',
    storageKeys: ['cosun_approvals'],
    description: '所有审批流程和记录',
    color: 'text-indigo-600'
  },
  {
    key: 'notification',
    label: '通知数据',
    storageKeys: ['cosun_notifications'],
    description: '系统通知和消息',
    color: 'text-pink-600'
  },
  {
    key: 'cart',
    label: '购物车数据',
    storageKeys: ['cosun_cart'],
    description: '客户购物车中的产品',
    color: 'text-teal-600'
  }
];

export const DataCleanupTool: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupComplete, setCleanupComplete] = useState(false);

  // 切换分类选择
  const toggleCategory = (key: string) => {
    setSelectedCategories(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCategories.length === dataCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(dataCategories.map(c => c.key));
    }
  };

  // 执行清理
  const performCleanup = () => {
    setCleaning(true);
    
    try {
      let cleanedCount = 0;
      const selectedData = dataCategories.filter(c => selectedCategories.includes(c.key));
      
      selectedData.forEach(category => {
        category.storageKeys.forEach(storageKey => {
          // 🔥 特殊处理：订单数据使用前缀匹配
          if (storageKey.endsWith('_')) {
            // 清除所有以该前缀开头的key
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith(storageKey)) {
                localStorage.removeItem(key);
                cleanedCount++;
                console.log(`🗑️ 已清除: ${key}`);
              }
            });
          } else {
            // 直接清除指定key
            if (localStorage.getItem(storageKey)) {
              localStorage.removeItem(storageKey);
              cleanedCount++;
              console.log(`🗑️ 已清除: ${storageKey}`);
            }
          }
        });
      });

      console.log(`✅ 数据清理完成！共清除 ${cleanedCount} 项数据`);
      
      setCleanupComplete(true);
      setCleaning(false);

      toast.success('数据清理完成！', {
        description: `已清除 ${selectedCategories.length} 个类别的数据`,
        duration: 3000
      });

      // 3秒后自动刷新页面以重新加载Context
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ 清理失败:', error);
      toast.error('清理失败', {
        description: '请查看控制台了解详情',
        duration: 3000
      });
      setCleaning(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        清理测试数据
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              数据清理工具
            </DialogTitle>
            <DialogDescription>
              选择要清除的业务数据类别。此操作不可恢复，请谨慎操作！
              <br />
              <span className="text-green-600 font-medium">✓ 不会清除：用户登录状态、系统设置、语言配置</span>
            </DialogDescription>
          </DialogHeader>

          {!cleanupComplete ? (
            <>
              {/* 全选按钮 */}
              <div className="border-b pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="w-full"
                >
                  {selectedCategories.length === dataCategories.length ? '取消全选' : '全选'}
                </Button>
              </div>

              {/* 数据类别列表 */}
              <div className="space-y-2 py-2">
                {dataCategories.map(category => (
                  <Card
                    key={category.key}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedCategories.includes(category.key)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleCategory(category.key)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 复选框 */}
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.key)}
                          onChange={() => toggleCategory(category.key)}
                          className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                        />
                      </div>

                      {/* 信息 */}
                      <div className="flex-1">
                        <div className={`font-medium ${category.color}`}>
                          {category.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {category.description}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          存储键: {category.storageKeys.join(', ')}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={cleaning}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={performCleanup}
                  disabled={selectedCategories.length === 0 || cleaning}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {cleaning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      清理中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      确认清除 ({selectedCategories.length})
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            // 清理完成提示
            <div className="py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                清理完成！
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                页面将在2秒后自动刷新...
              </p>
              <div className="text-xs text-gray-500">
                已清除 {selectedCategories.length} 个类别的数据
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
