import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Users, FileText, DollarSign, Package, TrendingUp, AlertCircle, ArrowRight, Calendar, Clock, Mail, CheckCircle, XCircle, ShoppingCart, UserCheck, BarChart3, PieChart, Globe, Bell, Edit, Send, Target, MessageSquare, TrendingDown, Image, Video, Upload, Plus, Eye, Trash2, Settings, Zap, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Card } from '../ui/card';
import { useAuth } from '../../hooks/useAuth'; // 🔥 导入useAuth

interface AdminOverviewProps {
  onNavigateToAPIDemo?: () => void;
}

export default function AdminOverview({ onNavigateToAPIDemo }: AdminOverviewProps) {
  const [emailTab, setEmailTab] = useState('sent');
  const [rankingType, setRankingType] = useState('department');
  const [selectedMonth, setSelectedMonth] = useState('11');
  const [productTab, setProductTab] = useState('list');

  // 🔥 获取当前用户
  const { currentUser } = useAuth();

  // 🔥 新增：导航到业务流程编辑器Pro
  const handleNavigateToWorkflowPro = () => {
    window.location.hash = 'workflow-editor-pro';
  };

  // 产品管理数据
  const products = [
    { 
      id: 'PRD-001', 
      name: 'Door Lock Set Premium', 
      category: '门锁系列',
      mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      images: 5,
      videos: 1,
      status: 'published',
      statusLabel: '已发布',
      views: 1245,
      updateTime: '2天前'
    },
    { 
      id: 'PRD-002', 
      name: 'Cabinet Hinges Deluxe', 
      category: '铰链系列',
      mainImage: 'https://images.unsplash.com/photo-1581858726788-75bc0f1a4e8c?w=400',
      images: 4,
      videos: 0,
      status: 'draft',
      statusLabel: '草稿',
      views: 0,
      updateTime: '1天前'
    },
    { 
      id: 'PRD-003', 
      name: 'Window Hardware Kit', 
      category: '窗户配件',
      mainImage: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400',
      images: 6,
      videos: 2,
      status: 'published',
      statusLabel: '已发布',
      views: 892,
      updateTime: '3天前'
    },
    { 
      id: 'PRD-004', 
      name: 'Sliding Door System', 
      category: '滑门系统',
      mainImage: 'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=400',
      images: 8,
      videos: 1,
      status: 'published',
      statusLabel: '已发布',
      views: 1567,
      updateTime: '5天前'
    },
  ];

  const getProductStatusColor = (status: string) => {
    const statusConfig: any = {
      published: 'bg-green-100 text-green-800 border-green-300',
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      offline: 'bg-red-100 text-red-800 border-red-300',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 🔥 业务流程编辑器Pro - 快速访问卡片（仅系统管理员可见） */}
      {currentUser?.role === 'Admin' && (
      <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex items-start gap-4">
          {/* 左侧图标 */}
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-8 h-8 text-white" />
          </div>

          {/* 中间内容 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                🔄 业务流程配置编辑器 Pro
              </h3>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                PRO版
              </Badge>
              <Badge variant="outline" className="border-green-500 text-green-700">
                完全可编辑
              </Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              可视化编辑业务流程，支持添加/修改/删除阶段和步骤，实时保存配置，导出多种格式文档。
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Edit className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-900">实时编辑</span>
                </div>
                <p className="text-xs text-gray-600">点击即可编辑步骤信息</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-semibold text-gray-900">自动保存</span>
                </div>
                <p className="text-xs text-gray-600">修改立即保存到配置</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-gray-900">多格式导出</span>
                </div>
                <p className="text-xs text-gray-600">JSON/文档/流程图</p>
              </div>
            </div>

            {/* 快速统计 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-xs">
                <span className="text-gray-600">当前配置：</span>
                <span className="font-semibold text-purple-700"> 7个阶段</span>
                <span className="text-gray-400"> · </span>
                <span className="font-semibold text-pink-700">26个步骤</span>
                <span className="text-gray-400"> · </span>
                <span className="font-semibold text-blue-700">7个角色</span>
              </div>
            </div>

            {/* CTA按钮 */}
            <Button 
              onClick={handleNavigateToWorkflowPro}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              打开业务流程编辑器 Pro
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* 右侧装饰 */}
          <div className="hidden lg:block flex-shrink-0 w-32">
            <div className="bg-white/80 rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-900 mb-2">✨ 新功能</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>✅ 拖拽排序</li>
                <li>✅ 实时预览</li>
                <li>✅ 版本管理</li>
                <li>✅ 一键导出</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* ========== 图片1：第一行 - 4个主要KPI指标 ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 初始客户数 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 w-12 h-12 rounded flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 mb-0.5" style={{ fontSize: '11px' }}>
                <TrendingUp className="w-3 h-3" />
                <span>+12</span>
              </div>
              <span className="text-gray-500" style={{ fontSize: '10px' }}>较上周</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>初始客户数</p>
            <p className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>1,206</p>
          </div>
        </div>

        {/* 货源跟踪数 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-purple-50 w-12 h-12 rounded flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 mb-0.5" style={{ fontSize: '11px' }}>
                <TrendingUp className="w-3 h-3" />
                <span>+45</span>
              </div>
              <span className="text-gray-500" style={{ fontSize: '10px' }}>较上周</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>货源跟踪数</p>
            <p className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>523</p>
          </div>
        </div>

        {/* 跟进客户数 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-green-50 w-12 h-12 rounded flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 mb-0.5" style={{ fontSize: '11px' }}>
                <TrendingUp className="w-3 h-3" />
                <span>+28</span>
              </div>
              <span className="text-gray-500" style={{ fontSize: '10px' }}>较上周</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>跟进客户数</p>
            <p className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>342</p>
          </div>
        </div>

        {/* 线索广发积数 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-orange-50 w-12 h-12 rounded flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 mb-0.5" style={{ fontSize: '11px' }}>
                <TrendingUp className="w-3 h-3" />
                <span>+156</span>
              </div>
              <span className="text-gray-500" style={{ fontSize: '10px' }}>较上周</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>线索广发积数</p>
            <p className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>8,456</p>
          </div>
        </div>
      </div>

      {/* ========== 图片1：第二行 - 8个次要指标横排 ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>待跟进客户数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>45</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>待出运客户数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>23</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>待修改报盘数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>12</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>待发送开发信数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>67</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>出单客户数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>89</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当周联系客户数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>156</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当周联系总数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>342</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当周建联系人数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>78</p>
        </div>
      </div>

      {/* ========== 图片1：第三行 - 4个其他指标 ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当月联系客户数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>456</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当月联系总数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>1,234</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当月建联系人数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>289</p>
        </div>
        <div className="bg-white border border-gray-200 rounded shadow-sm p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-gray-600 mb-1.5" style={{ fontSize: '11px', lineHeight: 1.3 }}>当月访问数</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>3,567</p>
        </div>
      </div>

      {/* ========== 图片1：主内容区 - 3列（申批待办+系统提醒 | 贸易监测 | 提醒小秘书）========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左列：申批待办 + 系统提醒 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          {/* 申批待办 */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>申批待办</h3>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200 hover:shadow cursor-pointer transition-all">
              <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 500 }}>报价审批</span>
              <Badge className="h-6 px-2.5 bg-red-500 text-white border-0" style={{ fontSize: '11px', fontWeight: 600 }}>3</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded border border-purple-200 hover:shadow cursor-pointer transition-all">
              <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 500 }}>订单审批</span>
              <Badge className="h-6 px-2.5 bg-red-500 text-white border-0" style={{ fontSize: '11px', fontWeight: 600 }}>5</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200 hover:shadow cursor-pointer transition-all">
              <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 500 }}>价格调整审批</span>
              <Badge className="h-6 px-2.5 bg-red-500 text-white border-0" style={{ fontSize: '11px', fontWeight: 600 }}>2</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200 hover:shadow cursor-pointer transition-all">
              <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 500 }}>客户认证审批</span>
              <Badge className="h-6 px-2.5 bg-red-500 text-white border-0" style={{ fontSize: '11px', fontWeight: 600 }}>1</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200 hover:shadow cursor-pointer transition-all">
              <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 500 }}>合同审批</span>
              <Badge className="h-6 px-2.5 bg-red-500 text-white border-0" style={{ fontSize: '11px', fontWeight: 600 }}>4</Badge>
            </div>
          </div>

          {/* 系统提醒 */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <h3 className="text-gray-900 mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>系统提醒</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px', lineHeight: 1.4 }}>您有3个报价即将到期，请及时跟进</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>2小时前</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px', lineHeight: 1.4 }}>客户ABC Trading回复了询价</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>5小时前</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <Package className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px', lineHeight: 1.4 }}>订单#ORD-2025-089待确认发货</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>1天前</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <Users className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px', lineHeight: 1.4 }}>5个客户超过7天未联系</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>1天前</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 中列：贸易监测 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>贸易监测</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded border border-blue-100">
              <p className="text-gray-600 mb-1" style={{ fontSize: '10px' }}>公司名称</p>
              <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>福建高盛达富建材有限公司</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                <p className="text-gray-600 mb-0.5" style={{ fontSize: '10px' }}>注册资本</p>
                <p className="text-gray-900" style={{ fontSize: '11px', fontWeight: 600 }}>500万人民币</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                <p className="text-gray-600 mb-0.5" style={{ fontSize: '10px' }}>经营范围</p>
                <p className="text-gray-900" style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.3 }}>建材批发、五金制品</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-green-50 rounded border border-green-200 text-center">
                <p className="text-gray-600 mb-1" style={{ fontSize: '10px' }}>年度贸易额</p>
                <p className="text-green-700" style={{ fontSize: '18px', fontWeight: 700 }}>$2.45M</p>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200 text-center">
                <p className="text-gray-600 mb-1" style={{ fontSize: '10px' }}>本月贸易额</p>
                <p className="text-blue-700" style={{ fontSize: '18px', fontWeight: 700 }}>$285K</p>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded border border-purple-200 text-center">
              <p className="text-gray-600 mb-1" style={{ fontSize: '10px' }}>同比增长</p>
              <p className="text-purple-700" style={{ fontSize: '28px', fontWeight: 700 }}>+15.3%</p>
            </div>
          </div>
        </div>

        {/* 右列：提醒小秘书 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>提醒小秘书</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-lg border border-blue-200">
              <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>客户总数</p>
              <p className="text-blue-700" style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1 }}>1,206</p>
              <p className="text-gray-500 mt-2" style={{ fontSize: '11px' }}>活跃客户 342 家</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-green-50 rounded border border-green-200 hover:bg-green-100 transition-colors">
                <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>今日新增客户</span>
                <span className="text-green-700" style={{ fontSize: '16px', fontWeight: 700 }}>8</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-yellow-50 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors">
                <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>待跟进客户</span>
                <span className="text-yellow-700" style={{ fontSize: '16px', fontWeight: 700 }}>45</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-red-50 rounded border border-red-200 hover:bg-red-100 transition-colors">
                <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>超期未联系</span>
                <span className="text-red-700" style={{ fontSize: '16px', fontWeight: 700 }}>12</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 图片2：第二组 - 3列（邮门排行 | 客户分布 | 活跃度）========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 邮门排行 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>邮门排行</h3>
            </div>
            <Tabs value={emailTab} onValueChange={setEmailTab} className="w-full">
              <TabsList className="h-8 w-full grid grid-cols-3 bg-gray-100">
                <TabsTrigger value="sent" className="h-7" style={{ fontSize: '11px' }}>发送数</TabsTrigger>
                <TabsTrigger value="opened" className="h-7" style={{ fontSize: '11px' }}>打开数</TabsTrigger>
                <TabsTrigger value="deals" className="h-7" style={{ fontSize: '11px' }}>成交数</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {emailTab === 'sent' && (
                <>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>1</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>张伟</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>456</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>92%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>2</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>李娜</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>423</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>89%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>3</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>王芳</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>398</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>91%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>4</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>刘强</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>376</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>87%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>5</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>陈静</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>352</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>90%</p>
                    </div>
                  </div>
                </>
              )}
              {emailTab === 'opened' && (
                <>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>1</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>李娜</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>389</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>95%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>2</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>张伟</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>367</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>93%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>3</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>王芳</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>345</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>92%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>4</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>陈静</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>328</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>91%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>5</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>刘强</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>312</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>88%</p>
                    </div>
                  </div>
                </>
              )}
              {emailTab === 'deals' && (
                <>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>1</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>王芳</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>23</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>6.8%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>2</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>张伟</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>21</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>6.2%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>3</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>李娜</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>19</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>5.9%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>4</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>陈静</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>17</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>5.5%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>5</span>
                      </div>
                      <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>刘强</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 700 }}>15</p>
                      <p className="text-green-600" style={{ fontSize: '10px', fontWeight: 600 }}>5.1%</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 客户分布 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>客户分布</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={[
                    { name: '北美', value: 456, percent: 37.8, color: '#3b82f6' },
                    { name: '欧洲', value: 389, percent: 32.3, color: '#8b5cf6' },
                    { name: '亚洲', value: 245, percent: 20.3, color: '#10b981' },
                    { name: '其他', value: 116, percent: 9.6, color: '#f59e0b' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent}%`}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>北美</span>
                </div>
                <span className="text-gray-900" style={{ fontSize: '11px', fontWeight: 700 }}>456</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                  <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>欧洲</span>
                </div>
                <span className="text-gray-900" style={{ fontSize: '11px', fontWeight: 700 }}>389</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>亚洲</span>
                </div>
                <span className="text-gray-900" style={{ fontSize: '11px', fontWeight: 700 }}>245</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 500 }}>其他</span>
                </div>
                <span className="text-gray-900" style={{ fontSize: '11px', fontWeight: 700 }}>116</span>
              </div>
            </div>
          </div>
        </div>

        {/* 活跃度 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>活跃度</h3>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: '10px' }}>按最近联系时间分布</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart 
                data={[
                  { period: '0-3天', count: 156 },
                  { period: '4-7天', count: 89 },
                  { period: '8-15天', count: 67 },
                  { period: '16-30天', count: 45 },
                  { period: '30天以上', count: 23 },
                ]} 
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="period" type="category" tick={{ fontSize: 10 }} width={65} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600" style={{ fontSize: '11px' }}>总活跃客户</span>
                <span className="text-blue-600" style={{ fontSize: '18px', fontWeight: 700 }}>380</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 图片3：月走势图 ========== */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>月走势图</h3>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: '10px' }}>询价、报价、订单数量趋势</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={[
                { month: '6月', inquiries: 234, quotations: 198, orders: 156 },
                { month: '7月', inquiries: 267, quotations: 223, orders: 178 },
                { month: '8月', inquiries: 298, quotations: 245, orders: 198 },
                { month: '9月', inquiries: 312, quotations: 267, orders: 212 },
                { month: '10月', inquiries: 345, quotations: 289, orders: 234 },
                { month: '11月', inquiries: 378, quotations: 312, orders: 256 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="inquiries" stroke="#3b82f6" strokeWidth={2.5} name="询价数" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="quotations" stroke="#8b5cf6" strokeWidth={2.5} name="报价数" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} name="订单数" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========== 图片3：关搜条件 + 日程待办 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 关搜条件 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>关搜条件</h3>
            <Button variant="outline" size="sm" className="h-7 px-3" style={{ fontSize: '11px' }}>
              <Edit className="w-3 h-3 mr-1" />
              管理
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-9" style={{ fontSize: '11px' }}>搜索条件</TableHead>
                  <TableHead className="h-9" style={{ fontSize: '11px' }}>目标地区</TableHead>
                  <TableHead className="h-9 text-right" style={{ fontSize: '11px' }}>客户数</TableHead>
                  <TableHead className="h-9 text-right" style={{ fontSize: '11px' }}>更新时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <span className="font-medium text-gray-900">建材进口商</span>
                  </TableCell>
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>北美</Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right" style={{ fontSize: '12px' }}>
                    <span className="font-semibold text-blue-600">234</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-gray-500" style={{ fontSize: '11px' }}>2天前</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <span className="font-medium text-gray-900">五金批发商</span>
                  </TableCell>
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>欧洲</Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right" style={{ fontSize: '12px' }}>
                    <span className="font-semibold text-blue-600">189</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-gray-500" style={{ fontSize: '11px' }}>3天前</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <span className="font-medium text-gray-900">门窗配件商</span>
                  </TableCell>
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>亚洲</Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right" style={{ fontSize: '12px' }}>
                    <span className="font-semibold text-blue-600">156</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-gray-500" style={{ fontSize: '11px' }}>5天前</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <span className="font-medium text-gray-900">建筑装饰商</span>
                  </TableCell>
                  <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                    <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>中东</Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right" style={{ fontSize: '12px' }}>
                    <span className="font-semibold text-blue-600">123</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-gray-500" style={{ fontSize: '11px' }}>1周前</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 日程待办 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>日程待办</h3>
            <Button variant="outline" size="sm" className="h-7 px-3" style={{ fontSize: '11px' }}>
              <Calendar className="w-3 h-3 mr-1" />
              查看日历
            </Button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded border border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center justify-center w-14 h-14 bg-white rounded flex-shrink-0 border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>今天</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>09:00</p>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>晨会 - 销售部周例会</p>
                  <div className="flex items-center gap-2">
                    <Badge className="h-5 px-2 bg-blue-100 text-blue-700 border-blue-300" style={{ fontSize: '10px' }}>即将开始</Badge>
                    <Clock className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded border border-purple-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center justify-center w-14 h-14 bg-white rounded flex-shrink-0 border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>今天</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>10:30</p>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>客户视频会议 - ABC Trading Ltd.</p>
                  <div className="flex items-center gap-2">
                    <Badge className="h-5 px-2 bg-purple-100 text-purple-700 border-purple-300" style={{ fontSize: '10px' }}>即将开始</Badge>
                    <Clock className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded border border-green-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center justify-center w-14 h-14 bg-white rounded flex-shrink-0 border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>今天</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>14:00</p>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>订单评审 - ORD-2025-089</p>
                  <div className="flex items-center gap-2">
                    <Badge className="h-5 px-2 bg-green-100 text-green-700 border-green-300" style={{ fontSize: '10px' }}>即将开始</Badge>
                    <Clock className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded border border-yellow-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center justify-center w-14 h-14 bg-white rounded flex-shrink-0 border border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500" style={{ fontSize: '9px' }}>今天</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>16:00</p>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>供应商对接 - 质量问题讨论</p>
                  <div className="flex items-center gap-2">
                    <Badge className="h-5 px-2 bg-yellow-100 text-yellow-700 border-yellow-300" style={{ fontSize: '10px' }}>即将开始</Badge>
                    <Clock className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 图片4：公司业绩进度 + 外汇牌价/世界时钟 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 公司业绩进度 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>公司业绩进度</h3>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: '10px' }}>2025年11月目标完成情况</p>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700" style={{ fontSize: '12px', fontWeight: 600 }}>美元业绩 (USD)</span>
                <span className="text-blue-700" style={{ fontSize: '12px', fontWeight: 700 }}>85%</span>
              </div>
              <Progress value={85} className="h-3 mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500" style={{ fontSize: '11px' }}>目标: $5.00M</span>
                <span className="text-blue-600" style={{ fontSize: '11px', fontWeight: 600 }}>已完成: $4.25M</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700" style={{ fontSize: '12px', fontWeight: 600 }}>人民币业绩 (CNY)</span>
                <span className="text-green-700" style={{ fontSize: '12px', fontWeight: 700 }}>78%</span>
              </div>
              <Progress value={78} className="h-3 mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500" style={{ fontSize: '11px' }}>目标: ¥3,200万</span>
                <span className="text-green-600" style={{ fontSize: '11px', fontWeight: 600 }}>已完成: ¥2,496万</span>
              </div>
            </div>
          </div>
        </div>

        {/* 外汇牌价/世界时钟 */}
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>外汇牌价/世界时钟</h3>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: '10px' }}>实时汇率与全球时间</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-gray-700" style={{ fontSize: '11px', fontWeight: 600 }}>今日汇率</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 600 }}>USD/CNY</span>
                    <span className="text-green-600" style={{ fontSize: '10px' }}>+0.12%</span>
                  </div>
                  <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>7.2345</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 600 }}>EUR/CNY</span>
                    <span className="text-red-600" style={{ fontSize: '10px' }}>-0.08%</span>
                  </div>
                  <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>7.8456</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 600 }}>GBP/CNY</span>
                    <span className="text-green-600" style={{ fontSize: '10px' }}>+0.25%</span>
                  </div>
                  <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>9.1234</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700" style={{ fontSize: '11px', fontWeight: 600 }}>JPY/CNY</span>
                    <span className="text-green-600" style={{ fontSize: '10px' }}>+0.03%</span>
                  </div>
                  <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>0.0489</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <p className="text-gray-700" style={{ fontSize: '11px', fontWeight: 600 }}>世界时钟</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-purple-50 rounded border border-blue-200 text-center">
                  <p className="text-gray-600 mb-0.5" style={{ fontSize: '10px' }}>🇨🇳 北京</p>
                  <p className="text-blue-700" style={{ fontSize: '16px', fontWeight: 700 }}>14:30</p>
                  <p className="text-gray-500" style={{ fontSize: '9px' }}>GMT+8</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-purple-50 rounded border border-blue-200 text-center">
                  <p className="text-gray-600 mb-0.5" style={{ fontSize: '10px' }}>🇺🇸 纽约</p>
                  <p className="text-blue-700" style={{ fontSize: '16px', fontWeight: 700 }}>01:30</p>
                  <p className="text-gray-500" style={{ fontSize: '9px' }}>GMT-5</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-purple-50 rounded border border-blue-200 text-center">
                  <p className="text-gray-600 mb-0.5" style={{ fontSize: '10px' }}>🇬🇧 伦敦</p>
                  <p className="text-blue-700" style={{ fontSize: '16px', fontWeight: 700 }}>06:30</p>
                  <p className="text-gray-500" style={{ fontSize: '9px' }}>GMT+0</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-purple-50 rounded border border-blue-200 text-center">
                  <p className="text-gray-600 mb-0.5" style={{ fontSize: '10px' }}>🇯🇵 东京</p>
                  <p className="text-blue-700" style={{ fontSize: '16px', fontWeight: 700 }}>15:30</p>
                  <p className="text-gray-500" style={{ fontSize: '9px' }}>GMT+9</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 图片4：业绩排行 ========== */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>业绩排行</h3>
            <div className="flex items-center gap-2">
              <Select value={rankingType} onValueChange={setRankingType}>
                <SelectTrigger className="h-7 w-24" style={{ fontSize: '11px' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department" style={{ fontSize: '11px' }}>部门</SelectItem>
                  <SelectItem value="personal" style={{ fontSize: '11px' }}>个人</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-7 w-28" style={{ fontSize: '11px' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11" style={{ fontSize: '11px' }}>2025年11月</SelectItem>
                  <SelectItem value="10" style={{ fontSize: '11px' }}>2025年10月</SelectItem>
                  <SelectItem value="09" style={{ fontSize: '11px' }}>2025年9月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-2.5">
            {rankingType === 'department' && (
              <>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-yellow-100 text-yellow-700">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>1</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>销售一部</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>12人团队</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$1,275K / $1,500K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>85%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={85} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 text-gray-700">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>2</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>销售二部</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>10人团队</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$972K / $1,200K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>81%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={81} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-100 text-orange-700">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>3</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>销售三部</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>8人团队</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$740K / $1,000K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>74%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={74} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gray-50 border-gray-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>4</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>电商部</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>6人团队</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$560K / $800K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>70%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={70} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gray-50 border-gray-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>5</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>外贸部</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>5人团队</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$325K / $500K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>65%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={65} className="h-2.5 flex-1" />
                  </div>
                </div>
              </>
            )}
            {rankingType === 'personal' && (
              <>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-yellow-100 text-yellow-700">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>1</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>张伟</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>销售一部</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$185K / $200K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>92.5%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={92.5} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 text-gray-700">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>2</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>李娜</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>销售二部</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$162K / $180K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>90%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={90} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-100 text-orange-700">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>3</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>王芳</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>销售一部</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$158K / $180K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>88%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={88} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gray-50 border-gray-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>4</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>刘强</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>销售三部</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$127K / $150K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>85%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={85} className="h-2.5 flex-1" />
                  </div>
                </div>
                <div className="p-3.5 rounded border transition-all hover:shadow-md bg-gray-50 border-gray-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>5</span>
                      </div>
                      <div>
                        <p className="text-gray-900 mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>陈静</p>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>电商部</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-0.5" style={{ fontSize: '11px' }}>$124K / $150K</p>
                      <p className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>83%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress value={83} className="h-2.5 flex-1" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========== 产品管理模块 ========== */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>产品管理</h3>
              <Badge className="h-5 px-2 bg-blue-100 text-blue-700 border-blue-300" style={{ fontSize: '10px' }}>
                {products.length} 个产品
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={productTab} onValueChange={setProductTab}>
                <TabsList className="h-8 bg-gray-100">
                  <TabsTrigger value="list" className="h-7 px-4" style={{ fontSize: '11px' }}>列表视图</TabsTrigger>
                  <TabsTrigger value="grid" className="h-7 px-4" style={{ fontSize: '11px' }}>网格视图</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button size="sm" className="h-7 px-3 bg-blue-600 hover:bg-blue-700" style={{ fontSize: '11px' }}>
                <Plus className="w-3 h-3 mr-1" />
                添加产品
              </Button>
            </div>
          </div>
        </div>

        {/* 列表视图 */}
        {productTab === 'list' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-9" style={{ fontSize: '11px' }}>产品信息</TableHead>
                  <TableHead className="h-9" style={{ fontSize: '11px' }}>分类</TableHead>
                  <TableHead className="h-9 text-center" style={{ fontSize: '11px' }}>图片</TableHead>
                  <TableHead className="h-9 text-center" style={{ fontSize: '11px' }}>视频</TableHead>
                  <TableHead className="h-9" style={{ fontSize: '11px' }}>状态</TableHead>
                  <TableHead className="h-9 text-right" style={{ fontSize: '11px' }}>浏览量</TableHead>
                  <TableHead className="h-9 text-right" style={{ fontSize: '11px' }}>更新时间</TableHead>
                  <TableHead className="h-9 text-center" style={{ fontSize: '11px' }}>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                          <ImageWithFallback 
                            src={product.mainImage} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-gray-900 mb-0.5" style={{ fontSize: '12px', fontWeight: 600 }}>{product.name}</p>
                          <p className="text-gray-500" style={{ fontSize: '11px' }}>{product.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                      <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Image className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>{product.images}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>{product.videos}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge className={`h-5 px-2 border ${getProductStatusColor(product.status)}`} style={{ fontSize: '11px' }}>
                        {product.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right" style={{ fontSize: '12px' }}>
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-900">{product.views.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-gray-500" style={{ fontSize: '11px' }}>
                      {product.updateTime}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Upload className="w-3 h-3 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 网格视图 */}
        {productTab === 'grid' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  {/* 产品主图 */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <ImageWithFallback 
                      src={product.mainImage} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={`h-5 px-2 border ${getProductStatusColor(product.status)}`} style={{ fontSize: '10px' }}>
                        {product.statusLabel}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" className="h-7 px-2.5 bg-white text-gray-900 hover:bg-gray-100" style={{ fontSize: '10px' }}>
                        <Upload className="w-3 h-3 mr-1" />
                        上传
                      </Button>
                      <Button size="sm" className="h-7 px-2.5 bg-white text-gray-900 hover:bg-gray-100" style={{ fontSize: '10px' }}>
                        <Eye className="w-3 h-3 mr-1" />
                        查看
                      </Button>
                    </div>
                  </div>
                  
                  {/* 产品信息 */}
                  <div className="p-3">
                    <div className="mb-2">
                      <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>{product.name}</p>
                      <p className="text-gray-500" style={{ fontSize: '10px' }}>{product.id}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                        {product.category}
                      </Badge>
                    </div>

                    {/* 媒体统计 */}
                    <div className="flex items-center gap-3 mb-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-gray-600" style={{ fontSize: '11px' }}>{product.images}张图</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-gray-600" style={{ fontSize: '11px' }}>{product.videos}个视频</span>
                      </div>
                    </div>

                    {/* 浏览量和时间 */}
                    <div className="flex items-center justify-between text-gray-500" style={{ fontSize: '10px' }}>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{product.views.toLocaleString()}</span>
                      </div>
                      <span>{product.updateTime}</span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="h-7 flex-1" style={{ fontSize: '10px' }}>
                        <Edit className="w-3 h-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 添加新产品卡片 */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-center aspect-square">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>添加新产品</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>上传产品图片和视频</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
