// 🔥 潜在客户转化工作台 - 以客户视角为中心的服务优化系统
// Lead Conversion Workbench - Customer-Centric Service Optimization System

import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  TrendingUp, DollarSign, Users, Target, Clock, CheckCircle, XCircle,
  Star, Award, Shield, Zap, FileText, MessageSquare, Globe, Package,
  TrendingDown, AlertCircle, ThumbsUp, Eye, Heart, Handshake,
  Truck, CreditCard, Settings, BarChart3, PieChart, Activity,
  Filter, Search, RefreshCcw, X, Calendar, Phone, Mail, Video,
  Building2, ShoppingCart, Briefcase, UserCheck, Database, Plane
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Area
} from "recharts";
import { User } from "../../lib/rbac-config";

interface LeadConversionWorkbenchProps {
  user: User;
}

// 🎯 8维度客户信任因素（从采购商视角）
function getCustomerTrustFactors() {
  return {
    dimensions: [
      {
        id: 'professional',
        name: '专业能力',
        nameEn: 'Professional Competence',
        icon: Award,
        score: 85,
        maxScore: 100,
        weight: 15,
        color: 'blue',
        factors: [
          { name: '产品认证', status: '齐全', score: 95, detail: 'CE/UL/ISO9001/ISO14001', priority: 'high' },
          { name: '工厂审核', status: '优秀', score: 90, detail: 'BSCI A级/Sedex 4-Pillar', priority: 'high' },
          { name: '技术文档', status: '完整', score: 85, detail: '测试报告/CAD图纸/规格书', priority: 'medium' },
          { name: '成功案例', status: '良好', score: 80, detail: '15+知名客户案例', priority: 'medium' },
          { name: '行业经验', status: '丰富', score: 75, detail: '16年行业经验', priority: 'low' },
        ],
        recommendations: [
          '补充UL认证（北美市场必备）',
          '更新ISO27001信息安全认证',
          '制作英文版案例视频',
        ]
      },
      {
        id: 'response',
        name: '响应速度',
        nameEn: 'Response & Communication',
        icon: Zap,
        score: 92,
        maxScore: 100,
        weight: 12,
        color: 'orange',
        factors: [
          { name: '首次响应', status: '卓越', score: 98, detail: '平均12小时', priority: 'high' },
          { name: '邮件回复', status: '优秀', score: 95, detail: '24小时内95%', priority: 'high' },
          { name: '技术解答', status: '良好', score: 88, detail: '2工作日内', priority: 'medium' },
          { name: '多语言', status: '支持', score: 90, detail: '英语/西语/葡语', priority: 'medium' },
          { name: '沟通专业', status: '优秀', score: 92, detail: '客户满意度4.6/5', priority: 'low' },
        ],
        recommendations: [
          '建立24小时值班制度',
          '增加法语客服支持欧非市场',
          '引入AI智能客服',
        ]
      },
      {
        id: 'reliability',
        name: '供应链可靠性',
        nameEn: 'Supply Chain Reliability',
        icon: Truck,
        score: 78,
        maxScore: 100,
        weight: 18,
        color: 'green',
        factors: [
          { name: '交期兑现率', status: '良好', score: 82, detail: '82%准时交货', priority: 'high' },
          { name: '质量稳定性', status: '优秀', score: 90, detail: '不良率0.5%', priority: 'high' },
          { name: '库存管理', status: '一般', score: 70, detail: '常规品有库存', priority: 'medium' },
          { name: '紧急订单', status: '良好', score: 75, detail: '48小时响应', priority: 'medium' },
          { name: '供应链透明', status: '良好', score: 73, detail: '可追溯到原材料', priority: 'low' },
        ],
        recommendations: [
          '⚠️ 提升交期兑现率至90%+（关键指标）',
          '建立安全库存机制',
          '引入供应链可视化系统',
        ]
      },
      {
        id: 'pricing',
        name: '价格竞争力',
        nameEn: 'Price & Payment',
        icon: DollarSign,
        score: 88,
        maxScore: 100,
        weight: 14,
        color: 'purple',
        factors: [
          { name: '价格竞争力', status: '优秀', score: 90, detail: '比市场低8-12%', priority: 'high' },
          { name: '批量折扣', status: '良好', score: 85, detail: '阶梯式折扣政策', priority: 'medium' },
          { name: '付款条件', status: '灵活', score: 88, detail: 'T/T/L/C/30天OA', priority: 'high' },
          { name: '价格稳定', status: '优秀', score: 92, detail: '季度锁价承诺', priority: 'medium' },
          { name: '总成本优势', status: '良好', score: 85, detail: '含物流综合优势', priority: 'low' },
        ],
        recommendations: [
          '为A级客户提供60天OA',
          '推出年度合同价格保护',
          '优化物流成本降低5%',
        ]
      },
      {
        id: 'service',
        name: '客户服务',
        nameEn: 'Customer Service',
        icon: Heart,
        score: 90,
        maxScore: 100,
        weight: 13,
        color: 'pink',
        factors: [
          { name: '售前咨询', status: '专业', score: 92, detail: '专属客户经理', priority: 'high' },
          { name: '样品服务', status: '优秀', score: 95, detail: '3-5天免费样品', priority: 'high' },
          { name: '售后服务', status: '良好', score: 88, detail: '12个月质保', priority: 'medium' },
          { name: '投诉处理', status: '快速', score: 90, detail: '24小时响应', priority: 'medium' },
          { name: '长期合作', status: '意愿强', score: 85, detail: '客户留存率85%', priority: 'low' },
        ],
        recommendations: [
          '延长质保至18个月',
          '建立客户成功团队',
          '推出VIP客户计划',
        ]
      },
      {
        id: 'risk',
        name: '风险管理',
        nameEn: 'Risk Management',
        icon: Shield,
        score: 72,
        maxScore: 100,
        weight: 11,
        color: 'red',
        factors: [
          { name: '产品责任险', status: '已投保', score: 85, detail: '$2M保额', priority: 'high' },
          { name: '贸易信用险', status: '未投保', score: 0, detail: '未购买', priority: 'high' },
          { name: '质量保证金', status: '有制度', score: 80, detail: '5%保证金', priority: 'medium' },
          { name: '退换货政策', status: '清晰', score: 90, detail: '30天无忧退换', priority: 'medium' },
          { name: '合规文档', status: '齐全', score: 95, detail: 'MSDS/COO/CI', priority: 'low' },
        ],
        recommendations: [
          '⚠️ 购买贸易信用保险（客户要求）',
          '增加产品责任险保额至$5M',
          '完善质量追溯体系',
        ]
      },
      {
        id: 'innovation',
        name: '创新定制',
        nameEn: 'Innovation & Customization',
        icon: Star,
        score: 82,
        maxScore: 100,
        weight: 9,
        color: 'yellow',
        factors: [
          { name: 'ODM/OEM能力', status: '强', score: 90, detail: '完整ODM体系', priority: 'high' },
          { name: '新品开发', status: '快速', score: 85, detail: '30-45天', priority: 'medium' },
          { name: '定制化服务', status: '灵活', score: 80, detail: 'MOQ友好', priority: 'medium' },
          { name: '技术创新', status: '持续', score: 75, detail: '研发投入3%', priority: 'low' },
          { name: '设计支持', status: '良好', score: 80, detail: '免费设计服务', priority: 'low' },
        ],
        recommendations: [
          '建立快速打样通道（7-10天）',
          '增加研发投入至5%',
          '引入3D打印技术',
        ]
      },
      {
        id: 'digital',
        name: '数字化透明度',
        nameEn: 'Digital & Transparency',
        icon: Globe,
        score: 68,
        maxScore: 100,
        weight: 8,
        color: 'teal',
        factors: [
          { name: '订单追踪', status: '基础', score: 70, detail: '邮件更新', priority: 'high' },
          { name: '库存查询', status: '未开放', score: 0, detail: '需询问', priority: 'high' },
          { name: '文档管理', status: '一般', score: 75, detail: 'PDF发送', priority: 'medium' },
          { name: '视频工厂', status: '已有', score: 90, detail: '720度全景', priority: 'medium' },
          { name: '区块链溯源', status: '未实施', score: 0, detail: '计划中', priority: 'low' },
        ],
        recommendations: [
          '⚠️ 建立客户Portal系统（紧迫）',
          '实时库存查询系统',
          '数字化文档中心',
        ]
      },
    ],
    overallScore: 82,
    industryAverage: 75,
    topPerformer: 92,
  };
}

// 📊 潜在客户转化漏斗
function getConversionFunnel() {
  return {
    stages: [
      { stage: '潜在客户', count: 150, percentage: 100, conversion: 100, color: '#94a3b8', icon: Users },
      { stage: '初次接触', count: 120, percentage: 80, conversion: 80, color: '#60a5fa', icon: Phone },
      { stage: '需求确认', count: 85, percentage: 56.7, conversion: 70.8, color: '#34d399', icon: MessageSquare },
      { stage: '报价发送', count: 68, percentage: 45.3, conversion: 80, color: '#fbbf24', icon: FileText },
      { stage: '样品确认', count: 45, percentage: 30, conversion: 66.2, color: '#f97316', icon: Package },
      { stage: 'BANT认证', count: 32, percentage: 21.3, conversion: 71.1, color: '#a78bfa', icon: CheckCircle },
      { stage: '商务谈判', count: 25, percentage: 16.7, conversion: 78.1, color: '#ec4899', icon: Handshake },
      { stage: '成交客户', count: 18, percentage: 12, conversion: 72, color: '#22c55e', icon: Award },
    ],
    bottlenecks: [
      { stage: '样品确认→BANT认证', conversionRate: 71.1, issue: '样品质量/价格匹配度', severity: 'high' },
      { stage: '需求确认→报价发送', conversionRate: 70.8, issue: '响应速度/专业度', severity: 'medium' },
      { stage: '样品确认', conversionRate: 66.2, issue: '样品质量/周期', severity: 'medium' },
    ],
    monthlyTrend: [
      { month: '1月', leads: 120, converted: 10, rate: 8.3 },
      { month: '2月', leads: 135, converted: 12, rate: 8.9 },
      { month: '3月', leads: 142, converted: 15, rate: 10.6 },
      { month: '4月', leads: 128, converted: 14, rate: 10.9 },
      { month: '5月', leads: 155, converted: 18, rate: 11.6 },
      { month: '6月', leads: 150, converted: 18, rate: 12.0 },
    ]
  };
}

// 🎯 客户决策影响因素权重（采购商视角）
function getDecisionFactors() {
  return {
    byCustomerType: [
      {
        type: 'Retailer',
        label: '零售商',
        factors: [
          { factor: '价格竞争力', weight: 25, current: 90, target: 95 },
          { factor: '交期可靠性', weight: 20, current: 82, target: 90 },
          { factor: '产品质量', weight: 18, current: 90, target: 95 },
          { factor: '付款条件', weight: 15, current: 88, target: 90 },
          { factor: '响应速度', weight: 12, current: 92, target: 95 },
          { factor: '售后服务', weight: 10, current: 90, target: 92 },
        ]
      },
      {
        type: 'Importer',
        label: '进口商',
        factors: [
          { factor: '供应链稳定', weight: 22, current: 78, target: 88 },
          { factor: '质量认证', weight: 20, current: 85, target: 92 },
          { factor: '价格优势', weight: 18, current: 90, target: 92 },
          { factor: '定制能力', weight: 16, current: 82, target: 88 },
          { factor: '文档合规', weight: 14, current: 95, target: 98 },
          { factor: '长期合作', weight: 10, current: 85, target: 90 },
        ]
      },
      {
        type: 'Project Contractor',
        label: '项目承包商',
        factors: [
          { factor: '技术支持', weight: 25, current: 85, target: 92 },
          { factor: '定制化服务', weight: 22, current: 80, target: 88 },
          { factor: '交期承诺', weight: 20, current: 82, target: 90 },
          { factor: '项目经验', weight: 15, current: 75, target: 85 },
          { factor: '风险管理', weight: 12, current: 72, target: 85 },
          { factor: '价格', weight: 6, current: 88, target: 90 },
        ]
      },
    ],
    criticalSuccessFactors: [
      { factor: '首次响应<24小时', importance: 95, achievement: 98, status: 'excellent' },
      { factor: '样品周期<7天', importance: 92, achievement: 75, status: 'needs-improvement' },
      { factor: '交期兑现率>90%', importance: 98, achievement: 82, status: 'critical' },
      { factor: '质量不良率<1%', importance: 96, achievement: 95, status: 'excellent' },
      { factor: '价格竞争力Top 20%', importance: 88, achievement: 90, status: 'excellent' },
      { factor: '客户满意度>4.5/5', importance: 90, achievement: 92, status: 'excellent' },
    ]
  };
}

// 💡 转化提升行动建议
function getActionRecommendations() {
  return {
    immediate: [
      {
        priority: 'critical',
        category: '供应链可靠性',
        action: '提升交期兑现率至90%+',
        impact: 'high',
        effort: 'high',
        timeline: '30天',
        steps: [
          '1. 分析过去6个月延期订单根因',
          '2. 建立供应商评估与预警机制',
          '3. 增加关键物料安全库存',
          '4. 引入生产进度可视化系统',
        ],
        expectedROI: '+15%转化率',
      },
      {
        priority: 'high',
        category: '数字化能力',
        action: '建立客户Portal系统',
        impact: 'high',
        effort: 'medium',
        timeline: '60天',
        steps: [
          '1. 实时订单追踪功能',
          '2. 在线库存查询系统',
          '3. 文档下载中心',
          '4. 在线询价与报价',
        ],
        expectedROI: '+20%客户满意度',
      },
      {
        priority: 'high',
        category: '风险管理',
        action: '购买贸易信用保险',
        impact: 'medium',
        effort: 'low',
        timeline: '15天',
        steps: [
          '1. 联系中信保或Euler Hermes',
          '2. 评估年保费成本',
          '3. 选择合适保额与覆盖范围',
          '4. 在营销材料中突出',
        ],
        expectedROI: '+10%大客户信任',
      },
    ],
    shortTerm: [
      {
        priority: 'medium',
        category: '样品服务',
        action: '建立快速打样通道',
        impact: 'medium',
        effort: 'medium',
        timeline: '45天',
        steps: [
          '1. 设立专门打样团队',
          '2. 引入3D打印技术',
          '3. 优化打样流程至7天',
          '4. 提供快递追踪服务',
        ],
        expectedROI: '+12%样品转化率',
      },
      {
        priority: 'medium',
        category: '付款条件',
        action: 'A级客户60天OA',
        impact: 'high',
        effort: 'low',
        timeline: '30天',
        steps: [
          '1. 制定A级客户认定标准',
          '2. 评估资金成本与风险',
          '3. 设计信用额度管理',
          '4. 签订框架协议',
        ],
        expectedROI: '+25%大客户签约率',
      },
    ],
    longTerm: [
      {
        priority: 'low',
        category: '技术创新',
        action: '增加研发投入至5%',
        impact: 'high',
        effort: 'high',
        timeline: '180天',
        steps: [
          '1. 设立研发专项基金',
          '2. 引进技术人才',
          '3. 建立客户需求研发机制',
          '4. 每季度推出新品',
        ],
        expectedROI: '+30%产品竞争力',
      },
    ]
  };
}

// 📈 成功案例与最佳实践
function getBestPractices() {
  return [
    {
      title: '24小时响应制度 → 转化率提升18%',
      customer: 'BuildRight Corp (美国零售商)',
      challenge: '客户抱怨响应慢，竞争对手更快',
      solution: '建立24小时轮班制，承诺12小时首次响应',
      result: '客户满意度从3.8升至4.7，转化率+18%',
      keyTakeaway: '响应速度是建立信任的第一步',
    },
    {
      title: '供应链透明化 → 大客户签约',
      customer: 'HomeStyle Inc (英国进口商)',
      challenge: '客户要求供应链可追溯性',
      solution: '实施ERP系统，提供实时生产进度',
      result: '赢得年采购$500K的大单',
      keyTakeaway: '数字化是大客户的必备条件',
    },
    {
      title: '60天OA付款 → 战略合作',
      customer: 'Elite Supplies (加拿大承包商)',
      challenge: '客户现金流压力大',
      solution: '提供60天OA付款，年度框架协议',
      result: '客户采购量增长3倍，成为战略合作伙伴',
      keyTakeaway: '灵活付款条件是竞争优势',
    },
  ];
}

export function LeadConversionWorkbench({ user }: LeadConversionWorkbenchProps) {
  const trustFactors = getCustomerTrustFactors();
  const funnel = getConversionFunnel();
  const decisionFactors = getDecisionFactors();
  const actions = getActionRecommendations();
  const bestPractices = getBestPractices();

  return (
    <div className="space-y-3">
      {/* 🎯 工作台标题 - 台湾大厂风格 */}
      <div className="bg-white border border-[#E5E7EB] rounded p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">潜在客户转化工作台</h3>
            <p className="text-xs text-gray-500">Lead Conversion Workbench - 以客户视角优化服务</p>
          </div>
          <div className="text-right bg-[#FAFBFC] border border-[#E5E7EB] rounded px-4 py-2">
            <p className="text-xs text-gray-500">综合信任评分</p>
            <p className="text-2xl font-bold text-gray-900">{trustFactors.overallScore}</p>
            <p className="text-xs text-gray-500">行业平均: {trustFactors.industryAverage}</p>
          </div>
        </div>
      </div>

      {/* 📊 8维度客户信任因素雷达图 + 总览 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 雷达图 */}
        <Card className="p-3 border border-[#E5E7EB] rounded shadow-none bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">8维度信任评分（客户视角）</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={trustFactors.dimensions.map(d => ({ 
              dimension: d.name, 
              score: d.score, 
              industry: trustFactors.industryAverage,
              top: trustFactors.topPerformer 
            }))}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="我们" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="行业平均" dataKey="industry" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
              <Radar name="顶级供应商" dataKey="top" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* 8维度评分卡 */}
        <Card className="p-3 border border-[#E5E7EB] rounded shadow-none bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">8维度详细评分</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {trustFactors.dimensions.map((dim, idx) => {
              const Icon = dim.icon;
              const percentage = (dim.score / dim.maxScore) * 100;
              return (
                <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 text-${dim.color}-600`} />
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{dim.name}</p>
                        <p className="text-xs text-slate-500">{dim.nameEn}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{dim.score}</p>
                      <p className="text-xs text-slate-500">权重{dim.weight}%</p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                  {dim.score < 80 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ {dim.recommendations[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 🎯 转化漏斗分析 */}
      <Card className="p-3 border border-[#E5E7EB] rounded shadow-none bg-white">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">潜在客户转化漏斗</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={funnel.stages} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="stage" stroke="#64748b" tick={{ fontSize: 10 }} width={80} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="count" fill="#3b82f6" name="客户数" radius={[0, 4, 4, 0]} />
            <Line type="monotone" dataKey="conversion" stroke="#f97316" strokeWidth={2} name="转化率%" />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 瓶颈分析 */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-900 mb-2">🔍 转化瓶颈分析</p>
          <div className="grid grid-cols-3 gap-2">
            {funnel.bottlenecks.map((bottleneck, idx) => (
              <div key={idx} className={`p-2 rounded border ${
                bottleneck.severity === 'high' ? 'bg-red-50 border-red-300' :
                bottleneck.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                'bg-blue-50 border-blue-300'
              }`}>
                <p className="text-xs font-semibold text-slate-900">{bottleneck.stage}</p>
                <p className="text-lg font-bold text-orange-600">{bottleneck.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-slate-600">{bottleneck.issue}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 🎯 客户决策影响因素（按客户类型）*/}
      <Card className="p-3 border border-[#E5E7EB] rounded shadow-none bg-white">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">客户决策影响因素（按客户类型）</h3>
        <div className="grid grid-cols-3 gap-3">
          {decisionFactors.byCustomerType.map((type, idx) => (
            <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-2">{type.label}</h4>
              <div className="space-y-1.5">
                {type.factors.map((factor, fidx) => {
                  const gap = factor.target - factor.current;
                  return (
                    <div key={fidx}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-700">{factor.factor}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-slate-900">{factor.current}</span>
                          <span className="text-xs text-slate-500">→{factor.target}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Progress value={(factor.current / factor.target) * 100} className="h-1 flex-1" />
                        <span className="text-xs text-slate-500 w-10">权重{factor.weight}%</span>
                      </div>
                      {gap > 5 && (
                        <p className="text-xs text-orange-600 mt-0.5">差距 {gap}分</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 🎯 关键成功因素 */}
      <Card className="p-3 border border-[#E5E7EB] rounded shadow-none bg-white">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">关键成功因素（Critical Success Factors）</h3>
        <div className="grid grid-cols-3 gap-2">
          {decisionFactors.criticalSuccessFactors.map((csf, idx) => (
            <div key={idx} className={`p-2 rounded border ${
              csf.status === 'excellent' ? 'bg-green-50 border-green-300' :
              csf.status === 'needs-improvement' ? 'bg-yellow-50 border-yellow-300' :
              'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-900">{csf.factor}</p>
                {csf.status === 'excellent' ? (
                  <CheckCircle className="size-4 text-green-600" />
                ) : csf.status === 'critical' ? (
                  <AlertCircle className="size-4 text-red-600" />
                ) : (
                  <XCircle className="size-4 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">重要度: {csf.importance}</span>
                <span className={`font-bold ${
                  csf.status === 'excellent' ? 'text-green-600' :
                  csf.status === 'critical' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>达成: {csf.achievement}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 💡 转化提升行动建议 */}
      <Card className="p-3 border-2 border-[#F96302] rounded shadow-none bg-white">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">🚀 转化提升行动建议（Action Recommendations）</h3>
        
        {/* 立即执行 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-red-500 text-white text-xs h-5 px-2">立即执行</Badge>
            <p className="text-xs text-slate-600">高影响力，优先处理</p>
          </div>
          <div className="space-y-2">
            {actions.immediate.map((action, idx) => (
              <div key={idx} className="p-2.5 bg-red-50 rounded border border-red-300">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-600 text-white text-xs h-4 px-1.5">{action.priority.toUpperCase()}</Badge>
                      <span className="text-xs font-semibold text-slate-900">{action.action}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">分类: {action.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">预期ROI</p>
                    <p className="text-sm font-bold text-green-600">{action.expectedROI}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Target className="size-3 text-blue-600" />
                    <span className="text-slate-600">影响: {action.impact}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="size-3 text-purple-600" />
                    <span className="text-slate-600">难度: {action.effort}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-orange-600" />
                    <span className="text-slate-600">周期: {action.timeline}</span>
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-red-200">
                  <p className="text-xs font-semibold text-slate-900 mb-1">执行步骤:</p>
                  {action.steps.map((step, sidx) => (
                    <p key={sidx} className="text-xs text-slate-700">{step}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 短期优化 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-yellow-500 text-white text-xs h-5 px-2">短期优化</Badge>
            <p className="text-xs text-slate-600">30-60天内完成</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {actions.shortTerm.map((action, idx) => (
              <div key={idx} className="p-2 bg-yellow-50 rounded border border-yellow-300">
                <p className="text-xs font-semibold text-slate-900 mb-1">{action.action}</p>
                <p className="text-xs text-slate-600 mb-1">{action.category}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">周期: {action.timeline}</span>
                  <span className="font-bold text-green-600">{action.expectedROI}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 长期战略 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-500 text-white text-xs h-5 px-2">长期战略</Badge>
            <p className="text-xs text-slate-600">3-6个月规划</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {actions.longTerm.map((action, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900">{action.action}</p>
                    <p className="text-xs text-slate-600">{action.category} • {action.timeline}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">{action.expectedROI}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 📈 成功案例与最佳实践 */}
      <Card className="p-3 border border-[#E5E7EB] rounded shadow-none bg-white">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">📚 成功案例与最佳实践</h3>
        <div className="grid grid-cols-3 gap-3">
          {bestPractices.map((practice, idx) => (
            <div key={idx} className="p-2.5 bg-green-50 rounded border border-green-300">
              <h4 className="text-xs font-bold text-slate-900 mb-1">{practice.title}</h4>
              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="text-slate-600">客户: {practice.customer}</p>
                </div>
                <div>
                  <p className="text-slate-600">挑战:</p>
                  <p className="text-slate-900">{practice.challenge}</p>
                </div>
                <div>
                  <p className="text-slate-600">方案:</p>
                  <p className="text-slate-900">{practice.solution}</p>
                </div>
                <div className="pt-1.5 border-t border-green-200">
                  <p className="text-slate-600">结果:</p>
                  <p className="font-semibold text-green-700">{practice.result}</p>
                </div>
                <div className="bg-green-100 p-1.5 rounded">
                  <p className="text-green-800 font-semibold">💡 {practice.keyTakeaway}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
