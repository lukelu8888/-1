import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Send, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  FileCheck,
  ArrowRight,
  User,
  Users,
  Building,
  Briefcase
} from 'lucide-react';

/**
 * 客户询价到合同流程可视化组件
 * 用于直观展示完整的B2B外贸业务流程
 */
export default function InquiryFlowVisualization() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📋 客户询价到合同业务流程
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            福建高盛达富建材有限公司 B2B外贸业务标准流程
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">5个阶段</Badge>
            <Badge className="bg-green-100 text-green-800 border-green-300">21个步骤</Badge>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">7个角色</Badge>
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">多级审批</Badge>
          </div>
        </div>

        {/* 阶段1: 询价阶段 */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="w-7 h-7" />
              阶段 1: 📋 询价阶段
            </h2>
            <p className="text-blue-100 mt-1">客户发起询价，内部协调获取成本底价</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-b-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StepCard
                number="1"
                title="客户发送询价单"
                role="Customer"
                icon={<User className="w-5 h-5" />}
                description="填写产品需求、数量、交期、收货地址"
                color="bg-blue-50 border-blue-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="2"
                title="系统自动分发"
                role="System"
                icon={<Send className="w-5 h-5" />}
                description="同时通知Admin财务和区域业务员"
                color="bg-gray-50 border-gray-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="3"
                title="业务员提醒财务"
                role="Regional Sales"
                icon={<Users className="w-5 h-5" />}
                description="注明紧急程度和客户背景"
                color="bg-green-50 border-green-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="4"
                title="财务生成工厂询价"
                role="Admin Finance"
                icon={<Briefcase className="w-5 h-5" />}
                description="选择供应商，设置响应截止日期"
                color="bg-orange-50 border-orange-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="5"
                title="工厂反馈询价"
                role="Supplier"
                icon={<Building className="w-5 h-5" />}
                description="提供单价、MOQ、交期、付款条件"
                color="bg-purple-50 border-purple-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="6"
                title="财务提供成本底价"
                role="Admin Finance"
                icon={<DollarSign className="w-5 h-5" />}
                description="计算成本底价和建议售价"
                color="bg-orange-50 border-orange-200"
              />
            </div>
          </div>
        </div>

        {/* 阶段2: 报价阶段 */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <DollarSign className="w-7 h-7" />
              阶段 2: 💰 报价阶段
            </h2>
            <p className="text-green-100 mt-1">区域业务员创建客户报价单</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-b-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepCard
                number="7"
                title="业务员创建报价单"
                role="Regional Sales"
                icon={<FileText className="w-5 h-5" />}
                description="基于成本底价，填写报价详情"
                color="bg-green-50 border-green-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="8"
                title="金额自动路由"
                role="System"
                icon={<ArrowRight className="w-5 h-5" />}
                description="<2万→经理 | ≥20万→总监"
                color="bg-yellow-50 border-yellow-300"
                highlight
              />
            </div>
          </div>
        </div>

        {/* 阶段3: 审批阶段 */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <CheckCircle className="w-7 h-7" />
              阶段 3: ✅ 审批阶段
            </h2>
            <p className="text-purple-100 mt-1">多级审批确保报价合理性</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-b-xl p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* 分支路由 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StepCard
                  number="9"
                  title="区域经理审核"
                  role="Regional Manager"
                  icon={<CheckCircle className="w-5 h-5" />}
                  description="< 20万美金订单审核"
                  color="bg-purple-50 border-purple-200"
                />
                <StepCard
                  number="10"
                  title="销售总监审核"
                  role="Sales Director"
                  icon={<CheckCircle className="w-5 h-5" />}
                  description="≥ 20万美金订单审核"
                  color="bg-red-50 border-red-200"
                />
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-1 h-8 bg-gray-300 mx-auto"></div>
                  <div className="text-gray-500 text-sm">汇总</div>
                  <div className="w-1 h-8 bg-gray-300 mx-auto"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StepCard
                  number="11"
                  title="审核结果反馈"
                  role="System"
                  icon={<MessageSquare className="w-5 h-5" />}
                  description="通知业务员审核结果"
                  color="bg-gray-50 border-gray-200"
                />
                <ArrowRightIcon />
                <StepCard
                  number="12"
                  title="查看不通过原因"
                  role="Regional Sales"
                  icon={<XCircle className="w-5 h-5" />}
                  description="修改后重新提交（如不通过）"
                  color="bg-red-50 border-red-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 阶段4: 客户反馈阶段 */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MessageSquare className="w-7 h-7" />
              阶段 4: 💬 客户反馈阶段
            </h2>
            <p className="text-orange-100 mt-1">提交报价给客户并处理反馈</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-b-xl p-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StepCard
                  number="13"
                  title="提交报价给客户"
                  role="Regional Sales"
                  icon={<Send className="w-5 h-5" />}
                  description="发送报价单PDF和说明邮件"
                  color="bg-green-50 border-green-200"
                />
                <ArrowRightIcon />
                <StepCard
                  number="14"
                  title="客户收到报价"
                  role="Customer"
                  icon={<FileText className="w-5 h-5" />}
                  description="通过Portal查看报价详情"
                  color="bg-blue-50 border-blue-200"
                />
                <ArrowRightIcon />
                <StepCard
                  number="15"
                  title="客户反馈"
                  role="Customer"
                  icon={<MessageSquare className="w-5 h-5" />}
                  description="同意 | 议价 | 拒绝"
                  color="bg-yellow-50 border-yellow-300"
                  highlight
                />
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-1 h-8 bg-gray-300 mx-auto"></div>
                  <div className="text-gray-500 text-sm">三分支路由</div>
                  <div className="w-1 h-8 bg-gray-300 mx-auto"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="text-center mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                    <p className="font-bold text-green-800 mt-1">客户同意</p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">→ 进入合同阶段</p>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="text-center mb-2">
                    <MessageSquare className="w-6 h-6 text-yellow-600 mx-auto" />
                    <p className="font-bold text-yellow-800 mt-1">客户议价</p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">→ 区域经理协商</p>
                </div>

                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="text-center mb-2">
                    <XCircle className="w-6 h-6 text-red-600 mx-auto" />
                    <p className="font-bold text-red-800 mt-1">客户拒绝</p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">→ 跟进了解原因</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 阶段5: 合同阶段 */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FileCheck className="w-7 h-7" />
              阶段 5: 📄 合同阶段
            </h2>
            <p className="text-pink-100 mt-1">生成销售合同并进行审核</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-b-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StepCard
                number="19"
                title="生成销售合同"
                role="Regional Sales"
                icon={<FileCheck className="w-5 h-5" />}
                description="基于报价单生成合同"
                color="bg-green-50 border-green-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="20"
                title="区域经理审核合同"
                role="Regional Manager"
                icon={<CheckCircle className="w-5 h-5" />}
                description="审核完整性、合规性、风险"
                color="bg-purple-50 border-purple-200"
              />
              <ArrowRightIcon />
              <StepCard
                number="21"
                title="合同审核通过"
                role="System"
                icon={<CheckCircle className="w-5 h-5" />}
                description="发送客户，通知各部门"
                color="bg-green-100 border-green-300"
                highlight
              />
            </div>
          </div>
        </div>

        {/* 关键决策点总结 */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🔀 关键决策点总结
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">💰 金额路由决策</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• {'<'} $20,000 → 区域经理审核</li>
                <li>• $20,000 - $199,999 → 区域经理审核</li>
                <li>• ≥ $200,000 → 销售总监审核</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">💬 客户反馈决策</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• ✅ 同意 → 生成合同</li>
                <li>• 💬 议价 → 区域经理协商</li>
                <li>• ❌ 拒绝 → 跟进原因</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 底部说明 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>📊 完整流程包含 5 个阶段、21 个步骤、7 个角色</p>
          <p className="mt-1">💡 在 WorkflowEditorPro 中点击"加载询价流程"按钮即可使用此流程</p>
        </div>
      </div>
    </div>
  );
}

// 步骤卡片组件
function StepCard({ 
  number, 
  title, 
  role, 
  icon, 
  description, 
  color,
  highlight = false
}: { 
  number: string;
  title: string;
  role: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${color} ${highlight ? 'border-2' : 'border'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3 mb-2">
        <Badge className="bg-white text-gray-800 border border-gray-300 font-bold">
          {number}
        </Badge>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
            {icon}
            <span>{role}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// 右箭头组件
function ArrowRightIcon() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <ArrowRight className="w-6 h-6 text-gray-400" />
    </div>
  );
}
