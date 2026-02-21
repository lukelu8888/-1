import React, { useState } from 'react';
import { UserCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import QuoteApprovalManagement from '../admin/QuoteApprovalManagement';

/**
 * 🎯 报价审批流程演示页面
 * 
 * 演示三个角色的审批流转：
 * 1. 业务员：创建报价并提交审核
 * 2. 区域主管：审批报价（< $20,000直接批准，≥ $20,000需总监审核）
 * 3. 销售总监：审批 ≥ $20,000 的报价
 */

export default function QuoteApprovalDemo() {
  const [currentRole, setCurrentRole] = useState<'salesperson' | 'supervisor' | 'director'>('supervisor');
  
  const roles = [
    { id: 'salesperson', name: '业务员', username: '张伟', color: 'bg-blue-500' },
    { id: 'supervisor', name: '区域主管', username: '李主管', color: 'bg-orange-500' },
    { id: 'director', name: '销售总监', username: '王总监', color: 'bg-purple-500' }
  ] as const;
  
  const currentUser = roles.find(r => r.id === currentRole);
  
  return (
    <div className="min-h-screen bg-slate-100">
      {/* 角色切换器 */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">报价审批流程演示</h1>
              <p className="text-sm text-slate-600 mt-1">
                模拟三个角色的审批流转：业务员 → 区域主管 → 销售总监
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-2">
              <span className="text-sm font-medium text-slate-600">切换角色：</span>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setCurrentRole(role.id as typeof currentRole)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentRole === role.id
                      ? `${role.color} text-white shadow-md`
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-xs font-medium">{role.name}</div>
                    <div className="text-xs opacity-80">{role.username}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 流程说明 */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                <span className="font-medium">1. 业务员创建报价</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2 py-1 rounded">
                <span className="font-medium">2. 区域主管审核</span>
              </div>
              <ArrowRight className="w-4 h-4 text-orange-400" />
              <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2 py-1 rounded">
                <span className="font-medium">3. 销售总监审核（≥$20k）</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400" />
              <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded">
                <span className="font-medium">4. 发送客户</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto">
        {currentRole === 'salesperson' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <UserCircle className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">业务员工作台</h2>
              <p className="text-sm text-slate-600 mb-6">
                作为业务员 <strong>{currentUser?.username}</strong>，您可以：
              </p>
              <ul className="text-sm text-left max-w-md mx-auto space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>创建报价单并提交审核</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>查看报价审批状态</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>根据审批意见整改报价</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>审批通过后发送给客户</span>
                </li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <div className="text-xs font-medium text-yellow-800 mb-1">💡 提示</div>
                <div className="text-xs text-yellow-900">
                  业务员界面尚未实现，请切换到<strong>区域主管</strong>或<strong>销售总监</strong>角色查看审批管理界面。
                  业务员创建报价的功能在"成本询报"模块中。
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentRole === 'supervisor' && (
          <QuoteApprovalManagement 
            userRole="supervisor" 
            userName={currentUser?.username || '李主管'} 
          />
        )}
        
        {currentRole === 'director' && (
          <QuoteApprovalManagement 
            userRole="director" 
            userName={currentUser?.username || '王总监'} 
          />
        )}
      </div>
    </div>
  );
}
