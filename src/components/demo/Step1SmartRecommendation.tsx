/**
 * 📋 步骤1智能推荐组件
 * 
 * 功能：
 * - 显示客户-业务员映射关系
 * - 根据选中的触发人（客户）智能推荐被通知人（业务员）
 * - 支持动态路由模式（任意客户）
 * - 显示负载均衡信息
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Info, Sparkles, Users, TrendingDown } from 'lucide-react';
import type { Personnel, Region } from '../../lib/notification-rules';
import { 
  routeToSalesRep, 
  getSalesRepByCustomer,
  getAllMappings,
  type CustomerSalesRepMapping 
} from '../../lib/customer-salesrep-mapping';
import { getWorkloadLevel } from '../../lib/notification-rules';

interface Step1SmartRecommendationProps {
  selectedCustomers: string[];        // 已选择的触发人（客户）
  onRecipientsRecommend: (recipients: string[]) => void; // 推荐被通知人的回调
}

export function Step1SmartRecommendation({ 
  selectedCustomers, 
  onRecipientsRecommend 
}: Step1SmartRecommendationProps) {
  
  // 如果没有选择客户，显示动态路由说明
  if (selectedCustomers.length === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              🤖 智能路由模式
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                生产环境推荐
              </Badge>
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              未选择具体客户时，系统将在运行时自动检测并路由到对应业务员
            </p>
            
            {/* 工作流程说明 */}
            <div className="bg-white/60 backdrop-blur rounded p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-700 mb-1.5">⚙️ 自动工作流程：</div>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-semibold">1️⃣</span>
                  <span>客户X提交询价</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-semibold">2️⃣</span>
                  <span>系统查询：客户X → 对接业务员？</span>
                </div>
                <div className="flex items-start gap-2 pl-5">
                  <span className="text-green-600">✓</span>
                  <span>已有关系 → 通知对接业务员</span>
                </div>
                <div className="flex items-start gap-2 pl-5">
                  <span className="text-green-600">✓</span>
                  <span>没有关系 → 智能分配（同区域+负载最低）</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-semibold">3️⃣</span>
                  <span>自动通知相关业务员</span>
                </div>
              </div>
            </div>
            
            {/* 当前映射关系摘要 */}
            <CurrentMappingSummary />
          </div>
        </div>
      </div>
    );
  }
  
  // 获取选中客户的推荐业务员
  const recommendations = selectedCustomers.map(customerName => {
    const mapping = getAllMappings().find(m => 
      m.customerId === customerName || 
      m.customerName === customerName
    );
    
    // 这里简化处理，实际应该从personnelList查找客户信息
    let salesRep: Personnel | null = null;
    let region: Region = 'north_america';
    
    // 简化：根据客户名称推断区域
    if (customerName.includes('ABC')) region = 'north_america';
    else if (customerName.includes('Brasil')) region = 'south_america';
    else if (customerName.includes('Europa')) region = 'europe_africa';
    
    if (mapping) {
      // 有映射关系，返回对接业务员
      salesRep = {
        name: mapping.salesRepName,
        displayName: mapping.salesRepName,
        role: '业务员',
        region: mapping.customerRegion,
        email: mapping.salesRepEmail,
      };
    } else {
      // 没有映射关系，模拟智能分配
      salesRep = {
        name: '王建 (北美区)',
        displayName: '王建 (北美区)',
        role: '业务员',
        region: region,
        workload: 3,
        email: 'wangjian@gsd.com'
      };
    }
    
    return {
      customer: customerName,
      salesRep,
      mapping,
      isNewCustomer: !mapping
    };
  });
  
  // 推荐的业务员列表（去重）
  const recommendedRecipients = Array.from(
    new Set(recommendations.map(r => r.salesRep?.displayName || r.salesRep?.name).filter(Boolean))
  ) as string[];
  
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            🌟 智能推荐
            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
              已分析 {selectedCustomers.length} 个客户
            </Badge>
          </h4>
          
          {/* 推荐结果 */}
          <div className="space-y-2 mb-3">
            {recommendations.map(({ customer, salesRep, mapping, isNewCustomer }, index) => (
              <div 
                key={index}
                className="bg-white/80 backdrop-blur rounded p-3 border-l-4 border-orange-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">{customer}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-semibold text-orange-600">
                        {salesRep?.displayName || salesRep?.name}
                      </span>
                      {salesRep?.workload !== undefined && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            salesRep.workload <= 3 ? 'bg-green-50 text-green-700 border-green-300' :
                            salesRep.workload <= 6 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                            'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          {salesRep.workload <= 3 ? '🟢' : salesRep.workload <= 6 ? '🟡' : '🔴'} 
                          负载 {salesRep.workload}
                        </Badge>
                      )}
                    </div>
                    
                    {/* 映射信息 */}
                    <div className="text-xs text-gray-600">
                      {mapping ? (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-blue-600">📅</span>
                            分配时间：{mapping.assignedDate}
                          </span>
                          <span className="mx-2">|</span>
                          <span className="inline-flex items-center gap-1">
                            <span>{mapping.assignedBy === 'auto' ? '🤖' : '👤'}</span>
                            {mapping.assignedBy === 'auto' ? '自动分配' : '手动分配'}
                          </span>
                          {mapping.notes && (
                            <>
                              <span className="mx-2">|</span>
                              <span className="text-gray-500">{mapping.notes}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-orange-600 font-semibold">
                          ⚡ 新客户 - 将自动分配到负载最低的业务员
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 快速应用推荐 */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7"
              onClick={() => onRecipientsRecommend(recommendedRecipients)}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              应用推荐（{recommendedRecipients.length}人）
            </Button>
            <span className="text-xs text-gray-500">
              点击自动选中推荐的业务员
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 当前映射关系摘要（动态路由模式下显示）
 */
function CurrentMappingSummary() {
  const mappings = getAllMappings();
  
  if (mappings.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 bg-white/60 backdrop-blur rounded p-3">
      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        当前客户-业务员映射关系（{mappings.length}个）
      </div>
      <div className="space-y-1">
        {mappings.slice(0, 5).map((mapping, index) => (
          <div 
            key={index}
            className="text-xs text-gray-600 flex items-center gap-2 py-1 px-2 hover:bg-white/50 rounded"
          >
            <span className="flex-shrink-0 w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
              {index + 1}
            </span>
            <span className="flex-1 truncate">{mapping.customerName}</span>
            <span className="text-gray-400">→</span>
            <span className="font-semibold text-gray-900">{mapping.salesRepName}</span>
            <Badge variant="outline" className="text-xs">
              {mapping.assignedBy === 'auto' ? '🤖' : '👤'}
            </Badge>
          </div>
        ))}
        {mappings.length > 5 && (
          <div className="text-xs text-gray-500 text-center pt-1">
            ... 还有 {mappings.length - 5} 个映射关系
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 负载分布可视化组件（可选）
 */
export function WorkloadDistribution({ region }: { region: Region }) {
  // 这里可以展示该区域所有业务员的负载分布
  // 暂时简化处理
  return null;
}
