// 💰 财务专员工作台 Pro - 大厂级专业财务看板
// 参考阿里、腾讯财务系统设计，紧凑布局，专业指标

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock, 
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Wallet,
  CreditCard, Receipt, FileText, PieChart, BarChart3, Activity,
  Users, Building2, Package, Truck, Calendar, Bell, Filter,
  Download, Upload, RefreshCw, Search, ChevronRight, CircleDot,
  AlertCircle, Info, Zap, Target, TrendingUpDown, ArrowRight,
  FileSpreadsheet, Send, Mail, Phone, History, Eye, Edit, Check, X
} from 'lucide-react';
import { AccountsReceivable } from '../finance/AccountsReceivable'; // 🔥 新增：应收账款管理组件

interface FinanceDashboardProProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function FinanceDashboardPro({ user }: FinanceDashboardProProps) {
  const [timeRange, setTimeRange] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');

  // 核心财务数据
  const financialData = {
    receivables: {
      total: 2847500,
      overdue: 387200,
      due7days: 256800,
      due30days: 892300,
      current: 1311200,
      overdueCount: 5,
      dueCount: 23,
      collectionRate: 87.5
    },
    payables: {
      total: 1523800,
      urgent: 186400,
      due7days: 342600,
      due30days: 994800,
      overdueCount: 2,
      dueCount: 12,
      paymentRate: 92.3
    },
    cashflow: {
      todayIn: 125600,
      todayOut: 86300,
      weekIn: 687400,
      weekOut: 423900,
      monthIn: 2845300,
      monthOut: 1876200,
      balance: 3567800
    },
    tasks: {
      pending: 18,
      urgent: 5,
      completed: 127,
      todayTarget: 12
    }
  };

  // 待办任务数据
  const pendingTasks = [
    { id: '1', type: 'collection', customer: 'Home Depot Inc.', amount: 125600, days: 15, priority: 'urgent', orderNo: 'SO-2024-1234' },
    { id: '2', type: 'collection', customer: 'ABC Hardware', amount: 87300, days: 8, priority: 'high', orderNo: 'SO-2024-1198' },
    { id: '3', type: 'payment', supplier: '深圳XX五金厂', amount: 86400, days: 3, priority: 'urgent', poNo: 'PO-2024-0845' },
    { id: '4', type: 'collection', customer: "Lowe's Companies", amount: 65200, days: 3, priority: 'medium', orderNo: 'SO-2024-1267' },
    { id: '5', type: 'payment', supplier: '东莞XX电器', amount: 54800, days: 5, priority: 'high', poNo: 'PO-2024-0892' },
    { id: '6', type: 'collection', customer: 'Euro Imports GmbH', amount: 48900, days: 12, priority: 'high', orderNo: 'SO-2024-1156' },
  ];

  // 账龄分析数据
  const agingData = {
    receivables: [
      { range: '未到期', amount: 1311200, percent: 46.1, color: 'bg-green-500' },
      { range: '1-7天', amount: 256800, percent: 9.0, color: 'bg-blue-500' },
      { range: '8-30天', amount: 892300, percent: 31.3, color: 'bg-yellow-500' },
      { range: '31-60天', amount: 287200, percent: 10.1, color: 'bg-orange-500' },
      { range: '60天以上', amount: 100000, percent: 3.5, color: 'bg-red-500' }
    ],
    payables: [
      { range: '未到期', amount: 994800, percent: 65.3, color: 'bg-green-500' },
      { range: '1-7天', amount: 342600, percent: 22.5, color: 'bg-blue-500' },
      { range: '8-30天', amount: 186400, percent: 12.2, color: 'bg-orange-500' }
    ]
  };

  // 今日资金流水
  const todayTransactions = [
    { id: '1', type: 'in', customer: 'Home Depot', amount: 45600, time: '14:23', method: '电汇', status: 'confirmed' },
    { id: '2', type: 'out', supplier: '深圳XX厂', amount: 32800, time: '11:45', method: '电汇', status: 'confirmed' },
    { id: '3', type: 'in', customer: 'ABC Hardware', amount: 28900, time: '10:12', method: '信用证', status: 'pending' },
    { id: '4', type: 'out', supplier: '东莞XX电器', amount: 18600, time: '09:30', method: '支票', status: 'confirmed' },
  ];

  return (
    <div className="space-y-3 p-3 bg-slate-50">
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1">财务专员工作台</h1>
            <p className="text-emerald-100 text-xs">
              欢迎回来，{user.name} | 实时财务监控 · 应收应付管理 · 资金流水追踪
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-400 h-8 text-xs"
            >
              <RefreshCw className="size-3.5 mr-1.5" />
              刷新数据
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-emerald-600 hover:bg-emerald-50 h-8 text-xs"
            >
              <Download className="size-3.5 mr-1.5" />
              导出报表
            </Button>
          </div>
        </div>
      </div>

      {/* 核心KPI指标 - 4列紧凑布局 */}
      <div className="grid grid-cols-4 gap-3">
        {/* 应收账款总额 */}
        <Card className="p-3 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                <Receipt className="size-3" />
                应收账款总额
              </p>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                ${(financialData.receivables.total / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs h-4 px-1 border-red-300 text-red-700">
                  逾期 ${(financialData.receivables.overdue / 1000).toFixed(1)}K
                </Badge>
                <Badge variant="outline" className="text-xs h-4 px-1 border-yellow-300 text-yellow-700">
                  {financialData.receivables.dueCount}笔待收
                </Badge>
              </div>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="size-5 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-600">回款率</span>
            <span className="font-bold text-green-600">{financialData.receivables.collectionRate}%</span>
          </div>
        </Card>

        {/* 应付账款总额 */}
        <Card className="p-3 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                <CreditCard className="size-3" />
                应付账款总额
              </p>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                ${(financialData.payables.total / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs h-4 px-1 border-red-300 text-red-700">
                  紧急 ${(financialData.payables.urgent / 1000).toFixed(1)}K
                </Badge>
                <Badge variant="outline" className="text-xs h-4 px-1 border-blue-300 text-blue-700">
                  {financialData.payables.dueCount}笔待付
                </Badge>
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="size-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-600">付款率</span>
            <span className="font-bold text-green-600">{financialData.payables.paymentRate}%</span>
          </div>
        </Card>

        {/* 今日资金流水 */}
        <Card className="p-3 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                <Wallet className="size-3" />
                今日资金流水
              </p>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                ${((financialData.cashflow.todayIn - financialData.cashflow.todayOut) / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs h-4 px-1 border-green-300 text-green-700">
                  ↑ ${(financialData.cashflow.todayIn / 1000).toFixed(1)}K
                </Badge>
                <Badge variant="outline" className="text-xs h-4 px-1 border-red-300 text-red-700">
                  ↓ ${(financialData.cashflow.todayOut / 1000).toFixed(1)}K
                </Badge>
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Activity className="size-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-600">账户余额</span>
            <span className="font-bold text-emerald-600">${(financialData.cashflow.balance / 1000).toFixed(1)}K</span>
          </div>
        </Card>

        {/* 待办任务 */}
        <Card className="p-3 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                <CheckCircle className="size-3" />
                今日待办任务
              </p>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {financialData.tasks.pending}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs h-4 px-1 border-red-300 text-red-700">
                  紧急 {financialData.tasks.urgent}
                </Badge>
                <Badge variant="outline" className="text-xs h-4 px-1 border-green-300 text-green-700">
                  已完成 {financialData.tasks.completed}
                </Badge>
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="size-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <Progress value={(financialData.tasks.completed / (financialData.tasks.completed + financialData.tasks.pending)) * 100} className="h-1.5" />
            <p className="text-xs text-slate-600 mt-1">完成率 {Math.round((financialData.tasks.completed / (financialData.tasks.completed + financialData.tasks.pending)) * 100)}%</p>
          </div>
        </Card>
      </div>

      {/* 主内容区域 - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full h-9">
          <TabsTrigger value="receivables" className="text-xs">
            <Receipt className="size-3.5 mr-1.5" />
            应收账款
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="size-3.5 mr-1.5" />
            工作概览
          </TabsTrigger>
          <TabsTrigger value="aging" className="text-xs">
            <PieChart className="size-3.5 mr-1.5" />
            账龄分析
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">
            <Activity className="size-3.5 mr-1.5" />
            资金流水
          </TabsTrigger>
          <TabsTrigger value="quick" className="text-xs">
            <Zap className="size-3.5 mr-1.5" />
            快捷操作
          </TabsTrigger>
        </TabsList>

        {/* 🔥 Tab 0: 应收账款管理 */}
        <TabsContent value="receivables" className="mt-3">
          <AccountsReceivable />
        </TabsContent>

        {/* Tab 1: 工作概览 */}
        <TabsContent value="overview" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* 待办任务列表 */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="size-4 text-orange-600" />
                  待办任务清单
                  <Badge className="bg-red-500 text-white text-xs h-4 px-1.5">
                    {financialData.tasks.urgent}紧急
                  </Badge>
                </h3>
                <Button variant="ghost" className="h-7 px-2 text-xs">
                  <Filter className="size-3 mr-1" />
                  筛选
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingTasks.map((task) => (
                  <Card key={task.id} className={`p-2.5 ${
                    task.priority === 'urgent' ? 'border-l-4 border-red-500 bg-red-50' :
                    task.priority === 'high' ? 'border-l-4 border-orange-500 bg-orange-50' :
                    'border-l-4 border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {task.type === 'collection' ? (
                            <Badge className="bg-orange-500 text-white text-xs h-4 px-1.5">应收</Badge>
                          ) : (
                            <Badge className="bg-blue-500 text-white text-xs h-4 px-1.5">应付</Badge>
                          )}
                          <span className="text-sm font-bold text-slate-900">
                            {task.type === 'collection' ? task.customer : task.supplier}
                          </span>
                          {task.priority === 'urgent' && (
                            <Badge className="bg-red-500 text-white text-xs h-4 px-1.5 flex items-center gap-1">
                              <AlertTriangle className="size-2.5" />
                              紧急
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="font-mono font-bold text-slate-900">
                            ${task.amount.toLocaleString()}
                          </span>
                          <span className="text-red-600">
                            {task.days > 0 ? `逾期${task.days}天` : `${Math.abs(task.days)}天到期`}
                          </span>
                          <span className="text-slate-500">
                            {task.type === 'collection' ? task.orderNo : task.poNo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <Eye className="size-3" />
                        </Button>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <Edit className="size-3" />
                        </Button>
                        <Button variant="ghost" className="h-6 w-6 p-0 text-green-600">
                          <Check className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* 本周资金趋势 */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUpDown className="size-4 text-blue-600" />
                  本周资金趋势
                </h3>
                <Button variant="ghost" className="h-7 px-2 text-xs">
                  查看详情
                </Button>
              </div>

              <div className="space-y-3">
                {/* 收入 */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <ArrowDownRight className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">本周收入</p>
                        <p className="text-lg font-bold text-green-700">
                          ${(financialData.cashflow.weekIn / 1000).toFixed(1)}K
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white text-xs">
                      ↑ 23.5%
                    </Badge>
                  </div>
                  <Progress value={75} className="h-2 bg-green-200" />
                </div>

                {/* 支出 */}
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">本周支出</p>
                        <p className="text-lg font-bold text-red-700">
                          ${(financialData.cashflow.weekOut / 1000).toFixed(1)}K
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-red-500 text-white text-xs">
                      ↑ 12.8%
                    </Badge>
                  </div>
                  <Progress value={45} className="h-2 bg-red-200" />
                </div>

                {/* 净现金流 */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Wallet className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">净现金流</p>
                        <p className="text-lg font-bold text-blue-700">
                          ${((financialData.cashflow.weekIn - financialData.cashflow.weekOut) / 1000).toFixed(1)}K
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500 text-white text-xs">
                      健康
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    现金流比率: {((financialData.cashflow.weekIn / financialData.cashflow.weekOut) * 100).toFixed(1)}%
                  </p>
                </div>

                {/* 财务健康指标 */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <p className="text-xs text-slate-600 mb-0.5">回款率</p>
                    <p className="text-sm font-bold text-green-600">{financialData.receivables.collectionRate}%</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <p className="text-xs text-slate-600 mb-0.5">付款率</p>
                    <p className="text-sm font-bold text-blue-600">{financialData.payables.paymentRate}%</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <p className="text-xs text-slate-600 mb-0.5">资金周转</p>
                    <p className="text-sm font-bold text-purple-600">18天</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: 账龄分析 */}
        <TabsContent value="aging" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* 应收账款账龄 */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="size-4 text-orange-600" />
                  应收账款账龄分析
                </h3>
                <span className="text-xs text-slate-600">
                  总计 ${(financialData.receivables.total / 1000).toFixed(1)}K
                </span>
              </div>

              <div className="space-y-2">
                {agingData.receivables.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.range}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          ${(item.amount / 1000).toFixed(1)}K
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.percent} className={`h-2 flex-1`} />
                      <div className={`w-3 h-3 rounded ${item.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="size-4 text-orange-600" />
                  <span className="text-sm font-bold text-orange-900">风险提示</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-700">
                  <li>• 逾期应收款 ${(financialData.receivables.overdue / 1000).toFixed(1)}K，涉及 {financialData.receivables.overdueCount} 个客户</li>
                  <li>• 30天以上账龄占比 {(agingData.receivables[3].percent + agingData.receivables[4].percent).toFixed(1)}%</li>
                  <li>• 建议加强催收力度，优化信用政策</li>
                </ul>
              </div>
            </Card>

            {/* 应付账款账龄 */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="size-4 text-blue-600" />
                  应付账款账龄分析
                </h3>
                <span className="text-xs text-slate-600">
                  总计 ${(financialData.payables.total / 1000).toFixed(1)}K
                </span>
              </div>

              <div className="space-y-2">
                {agingData.payables.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{item.range}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          ${(item.amount / 1000).toFixed(1)}K
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.percent} className={`h-2 flex-1`} />
                      <div className={`w-3 h-3 rounded ${item.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="size-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-900">付款提醒</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-700">
                  <li>• 7天内到期 ${(financialData.payables.due7days / 1000).toFixed(1)}K，涉及 {financialData.payables.dueCount} 家供应商</li>
                  <li>• 紧急付款 ${(financialData.payables.urgent / 1000).toFixed(1)}K</li>
                  <li>• 付款准时率 {financialData.payables.paymentRate}%，维护良好信用</li>
                </ul>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: 资金流水 */}
        <TabsContent value="transactions" className="space-y-3 mt-3">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="size-4 text-emerald-600" />
                今日资金流水记录
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-7 px-2 text-xs">
                  <Filter className="size-3 mr-1" />
                  筛选
                </Button>
                <Button variant="outline" className="h-7 px-2 text-xs">
                  <Download className="size-3 mr-1" />
                  导出
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {todayTransactions.map((tx) => (
                <Card key={tx.id} className={`p-3 ${
                  tx.type === 'in' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'in' ? (
                          <ArrowDownRight className={`size-5 ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <ArrowUpRight className={`size-5 ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">
                            {tx.type === 'in' ? tx.customer : tx.supplier}
                          </span>
                          <Badge className={tx.type === 'in' ? 'bg-green-500' : 'bg-red-500'}>
                            {tx.type === 'in' ? '收款' : '付款'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tx.method}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{tx.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        tx.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'in' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </span>
                      {tx.status === 'confirmed' ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="size-3 mr-1" />
                          已确认
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500 text-white">
                          <Clock className="size-3 mr-1" />
                          处理中
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 流水汇总 */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-xs text-slate-600 mb-1">今日收入</p>
                <p className="text-xl font-bold text-green-600">
                  +${(financialData.cashflow.todayIn / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                <p className="text-xs text-slate-600 mb-1">今日支出</p>
                <p className="text-xl font-bold text-red-600">
                  -${(financialData.cashflow.todayOut / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-slate-600 mb-1">净现金流</p>
                <p className="text-xl font-bold text-blue-600">
                  +${((financialData.cashflow.todayIn - financialData.cashflow.todayOut) / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4: 快捷操作 */}
        <TabsContent value="quick" className="space-y-3 mt-3">
          <div className="grid grid-cols-4 gap-3">
            {/* 收款操作 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Receipt className="size-6 text-green-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">登记收款</h4>
              <p className="text-xs text-center text-slate-600">快速登记客户付款</p>
            </Card>

            {/* 付款操作 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <CreditCard className="size-6 text-blue-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">供应商付款</h4>
              <p className="text-xs text-center text-slate-600">发起付款申请</p>
            </Card>

            {/* 对账操作 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <FileText className="size-6 text-purple-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">财务对账</h4>
              <p className="text-xs text-center text-slate-600">客户/供应商对账</p>
            </Card>

            {/* 发票管理 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <FileSpreadsheet className="size-6 text-orange-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">发票管理</h4>
              <p className="text-xs text-center text-slate-600">开具/核销发票</p>
            </Card>

            {/* 催款操作 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Bell className="size-6 text-red-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">催款提醒</h4>
              <p className="text-xs text-center text-slate-600">发送催款通知</p>
            </Card>

            {/* 报表导出 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Download className="size-6 text-teal-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">报表导出</h4>
              <p className="text-xs text-center text-slate-600">导出财务报表</p>
            </Card>

            {/* 银行对账 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Building2 className="size-6 text-indigo-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">银行对账</h4>
              <p className="text-xs text-center text-slate-600">银行流水核对</p>
            </Card>

            {/* 数据刷新 */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <RefreshCw className="size-6 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-center text-slate-900 mb-1">刷新数据</h4>
              <p className="text-xs text-center text-slate-600">同步最新财务数据</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}