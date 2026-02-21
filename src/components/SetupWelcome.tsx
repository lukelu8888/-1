import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Database, Rocket, CheckCircle2, ArrowRight } from 'lucide-react';

interface SetupWelcomeProps {
  onStartSetup: () => void;
}

export default function SetupWelcome({ onStartSetup }: SetupWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-2xl border-2">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            欢迎使用福建高盛达富B2B外贸系统
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            COSUN Trading Platform - 连接全球，助力成长
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 三Portal架构 */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-blue-900">三Portal架构</h3>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                Customer、Admin、Supplier三大门户，角色权限分明
              </p>
            </div>
            
            <div className="bg-emerald-50 p-5 rounded-xl border-2 border-emerald-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-emerald-900">完整业务闭环</h3>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed">
                询价→报价→合同→应收→收款，全流程数字化
              </p>
            </div>
            
            <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-purple-900">多区域运营</h3>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed">
                北美、南美、欧非三大市场，多语言多货币
              </p>
            </div>
          </div>

          {/* 业务流程闭环说明 */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200">
            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <span>完整业务流程闭环</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-semibold text-orange-900 text-sm">客户发起询价</p>
                    <p className="text-xs text-orange-700">Customer Portal → 业务员接收</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-semibold text-orange-900 text-sm">采购向供应商询价</p>
                    <p className="text-xs text-orange-700">Admin Portal → Supplier Portal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-semibold text-orange-900 text-sm">供应商报价</p>
                    <p className="text-xs text-orange-700">Supplier Portal → 采购接收</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <p className="font-semibold text-orange-900 text-sm">财务核价</p>
                    <p className="text-xs text-orange-700">成本分析 + 利润率计算</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">业务员向客户报价</p>
                    <p className="text-xs text-emerald-700">Admin Portal → Customer Portal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">客户下单</p>
                    <p className="text-xs text-emerald-700">Customer Portal → 订单管理</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">采购下单给供应商</p>
                    <p className="text-xs text-emerald-700">Admin Portal → Supplier Portal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">供应商发货</p>
                    <p className="text-xs text-emerald-700">物流追踪 → 客户收货确认</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 开始设置 */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-8 rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Database className="w-7 h-7" />
              准备开始使用
            </h3>
            <p className="text-blue-50 mb-6 text-base">
              首次使用需要初始化数据库，系统将自动创建：
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="font-semibold mb-2">👥 角色账号</p>
                <ul className="space-y-1 text-sm text-blue-50">
                  <li>✅ 7个角色测试账号（CEO、CFO、销售主管、业务员、财务、采购、管理员）</li>
                  <li>✅ 3个测试客户账号</li>
                  <li>✅ 2个测试供应商账号</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="font-semibold mb-2">📊 业务数据</p>
                <ul className="space-y-1 text-sm text-blue-50">
                  <li>✅ 客户、订单、报价单示例</li>
                  <li>✅ 供应商、采购单示例</li>
                  <li>✅ 完整的业务流程数据结构</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={onStartSetup}
              size="lg"
              className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg h-16 shadow-2xl hover:shadow-xl transition-all"
            >
              <Rocket className="w-6 h-6 mr-3" />
              开始初始化数据库
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>

          {/* 底部提示 */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            ⏱️ 初始化过程约需2-3分钟，系统将创建完整的三Portal业务闭环测试数据
          </div>
        </CardContent>
      </Card>
    </div>
  );
}