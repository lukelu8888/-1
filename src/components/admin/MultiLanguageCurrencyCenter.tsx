import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  Globe,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Plus,
  Edit,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Percent,
  Languages,
  MapPin,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface MultiLanguageCurrencyCenterProps {
  userRole?: string;
}

export default function MultiLanguageCurrencyCenter({ userRole = 'CEO' }: MultiLanguageCurrencyCenterProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showExchangeRateDetail, setShowExchangeRateDetail] = useState(false);
  const [showPricingStrategy, setShowPricingStrategy] = useState(false);

  // 🔥 多语言/多货币总览
  const overview = {
    supportedLanguages: 8,
    supportedCurrencies: 12,
    activeRegions: 3,
    totalRevenue: 15680000,
    exchangeRateVariance: 2.3,
    localizationRate: 96.5
  };

  // 🔥 支持的语言列表
  const supportedLanguages = [
    { code: 'en-US', name: '英语（美国）', coverage: 100, users: 45, revenue: 6800000, flag: '🇺🇸' },
    { code: 'en-GB', name: '英语（英国）', coverage: 100, users: 23, revenue: 3200000, flag: '🇬🇧' },
    { code: 'es-ES', name: '西班牙语', coverage: 98, users: 18, revenue: 2400000, flag: '🇪🇸' },
    { code: 'pt-BR', name: '葡萄牙语（巴西）', coverage: 95, users: 12, revenue: 1500000, flag: '🇧🇷' },
    { code: 'fr-FR', name: '法语', coverage: 97, users: 15, revenue: 1800000, flag: '🇫🇷' },
    { code: 'de-DE', name: '德语', coverage: 96, users: 10, revenue: 1200000, flag: '🇩🇪' },
    { code: 'zh-CN', name: '简体中文', coverage: 100, users: 8, revenue: 980000, flag: '🇨🇳' },
    { code: 'ar-SA', name: '阿拉伯语', coverage: 92, users: 6, revenue: 800000, flag: '🇸🇦' }
  ];

  // 🔥 支持的货币列表
  const supportedCurrencies = [
    { 
      code: 'USD', 
      name: '美元', 
      symbol: '$', 
      rate: 1.0000, 
      change: 0, 
      region: '北美',
      revenue: 8500000,
      flag: '🇺🇸'
    },
    { 
      code: 'EUR', 
      name: '欧元', 
      symbol: '€', 
      rate: 0.9250, 
      change: -0.8, 
      region: '欧洲',
      revenue: 4200000,
      flag: '🇪🇺'
    },
    { 
      code: 'GBP', 
      name: '英镑', 
      symbol: '£', 
      rate: 0.7920, 
      change: -1.2, 
      region: '欧洲',
      revenue: 2800000,
      flag: '🇬🇧'
    },
    { 
      code: 'BRL', 
      name: '巴西雷亚尔', 
      symbol: 'R$', 
      rate: 4.9500, 
      change: +2.3, 
      region: '南美',
      revenue: 1500000,
      flag: '🇧🇷'
    },
    { 
      code: 'CAD', 
      name: '加拿大元', 
      symbol: 'C$', 
      rate: 1.3600, 
      change: +0.5, 
      region: '北美',
      revenue: 1200000,
      flag: '🇨🇦'
    },
    { 
      code: 'MXN', 
      name: '墨西哥比索', 
      symbol: 'Mex$', 
      rate: 17.2500, 
      change: +1.8, 
      region: '北美',
      revenue: 980000,
      flag: '🇲🇽'
    }
  ];

  // 🔥 区域定价策略
  const regionalPricing = [
    {
      region: '北美',
      countries: ['美国', '加拿大', '墨西哥'],
      baseCurrency: 'USD',
      priceAdjustment: 0,
      competitiveIndex: 95,
      avgDiscount: 10,
      marketShare: 54.2
    },
    {
      region: '南美',
      countries: ['巴西', '阿根廷', '智利'],
      baseCurrency: 'USD',
      priceAdjustment: -8,
      competitiveIndex: 88,
      avgDiscount: 12,
      marketShare: 9.6
    },
    {
      region: '欧洲',
      countries: ['英国', '德国', '法国', '西班牙'],
      baseCurrency: 'EUR',
      priceAdjustment: +5,
      competitiveIndex: 92,
      avgDiscount: 8,
      marketShare: 36.2
    }
  ];

  // 🔥 汇率趋势（最近30天）
  const exchangeRateTrend = [
    { date: '11-01', EUR: 0.9320, GBP: 0.8010, BRL: 4.8200 },
    { date: '11-05', EUR: 0.9280, GBP: 0.7980, BRL: 4.8900 },
    { date: '11-10', EUR: 0.9250, GBP: 0.7950, BRL: 4.9200 },
    { date: '11-15', EUR: 0.9230, GBP: 0.7920, BRL: 4.9400 },
    { date: '11-20', EUR: 0.9240, GBP: 0.7910, BRL: 4.9500 },
    { date: '11-25', EUR: 0.9250, GBP: 0.7920, BRL: 4.9500 }
  ];

  // 🔥 区域收入分布
  const revenueByRegion = [
    { region: '北美', revenue: 8500000, percent: 54.2, growth: 15.3 },
    { region: '欧洲', revenue: 5680000, percent: 36.2, growth: 12.8 },
    { region: '南美', revenue: 1500000, percent: 9.6, growth: 22.5 }
  ];

  const formatCurrency = (value: number, currency: string = 'USD') => {
    const currencyData = supportedCurrencies.find(c => c.code === currency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleRefresh = () => {
    toast.success('汇率已更新', {
      description: '已同步最新汇率数据'
    });
  };

  const handleUpdatePricing = () => {
    toast.success('定价策略已更新', {
      description: '区域定价设置已保存'
    });
    setShowPricingStrategy(false);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3" style={{ fontSize: '24px', fontWeight: 700 }}>
            <Globe className="w-7 h-7 text-blue-600" />
            多语言/多货币管理中心
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
              Global
            </Badge>
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontSize: '14px' }}>
            Multi-Language & Currency Center · 区域化定价 · 汇率管理 · 本地化内容
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            更新汇率
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            导出报告
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowPricingStrategy(true)}
          >
            <Plus className="w-4 h-4" />
            新增区域
          </Button>
        </div>
      </div>

      {/* KPI总览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Languages className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">支持语言</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {overview.supportedLanguages}
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">支持货币</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {overview.supportedCurrencies}
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">活跃区域</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {overview.activeRegions}
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 gap-1">
              <TrendingUp className="w-3 h-3" />
              +14.2%
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">全球收入</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '20px' }}>
              {formatCurrency(overview.totalRevenue)}
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-orange-300">
              波动
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">汇率波动</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              ±{overview.exchangeRateVariance}%
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-teal-100 text-teal-700 border-teal-300">
              优秀
            </Badge>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">本地化率</p>
            <p className="text-slate-900 font-bold" style={{ fontSize: '24px' }}>
              {overview.localizationRate}%
            </p>
          </div>
        </Card>
      </div>

      {/* 支持的语言 */}
      <Card className="p-6">
        <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
          <Languages className="w-5 h-5 text-blue-600" />
          支持的语言
        </h3>
        <div className="space-y-3">
          {supportedLanguages.map((lang, index) => (
            <div key={lang.code} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{lang.name}</p>
                    <p className="text-xs text-slate-600">{lang.code}</p>
                  </div>
                </div>
                <Badge className={
                  lang.coverage >= 98 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : lang.coverage >= 95
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                }>
                  {lang.coverage}% 覆盖率
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-slate-600">活跃用户</p>
                  <p className="text-sm font-semibold text-slate-900">{lang.users}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-slate-600">收入贡献</p>
                  <p className="text-sm font-semibold text-blue-600">{formatCurrency(lang.revenue)}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-slate-600">占比</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {((lang.revenue / overview.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${lang.coverage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 支持的货币 + 汇率趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 支持的货币 */}
        <Card className="p-6">
          <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
            <DollarSign className="w-5 h-5 text-emerald-600" />
            支持的货币
          </h3>
          <div className="space-y-3">
            {supportedCurrencies.map((currency, index) => (
              <div key={currency.code} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currency.flag}</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{currency.name}</p>
                      <p className="text-xs text-slate-600">{currency.code} · {currency.region}</p>
                    </div>
                  </div>
                  <Badge className={
                    currency.change > 0
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : currency.change < 0
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }>
                    {currency.change > 0 ? '+' : ''}{currency.change}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">汇率</p>
                    <p className="text-sm font-semibold text-slate-900">{currency.symbol}{currency.rate.toFixed(4)}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">收入</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(currency.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 汇率趋势 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                <BarChart3 className="w-5 h-5 text-purple-600" />
                汇率趋势（vs USD）
              </h3>
              <p className="text-xs text-slate-500 mt-1">最近30天主要货币汇率变化</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={exchangeRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line 
                type="monotone" 
                dataKey="EUR" 
                name="欧元" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="GBP" 
                name="英镑" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="BRL" 
                name="雷亚尔" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-2">💡 汇率建议</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• EUR贬值0.8%，欧洲区产品竞争力提升</li>
              <li>• BRL升值2.3%，巴西市场成本增加，建议适当调价</li>
              <li>• 建议设置±3%汇率保护机制</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* 区域定价策略 + 区域收入 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 区域定价策略 */}
        <Card className="p-6">
          <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
            <Target className="w-5 h-5 text-indigo-600" />
            区域定价策略
          </h3>
          <div className="space-y-3">
            {regionalPricing.map((region, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{region.region}</p>
                    <p className="text-xs text-slate-600">{region.countries.join(' · ')}</p>
                  </div>
                  <Badge className={
                    region.priceAdjustment > 0
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : region.priceAdjustment < 0
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }>
                    {region.priceAdjustment > 0 ? '+' : ''}{region.priceAdjustment}% 调价
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">基准货币</p>
                    <p className="text-sm font-semibold text-slate-900">{region.baseCurrency}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">竞争指数</p>
                    <p className="text-sm font-semibold text-blue-600">{region.competitiveIndex}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">平均折扣</p>
                    <p className="text-sm font-semibold text-orange-600">{region.avgDiscount}%</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">市场份额</p>
                    <p className="text-sm font-semibold text-emerald-600">{region.marketShare}%</p>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full gap-1">
                  <Edit className="w-3 h-3" />
                  调整策略
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* 区域收入分布 */}
        <Card className="p-6">
          <h3 className="text-slate-900 font-semibold flex items-center gap-2 mb-4" style={{ fontSize: '16px' }}>
            <Activity className="w-5 h-5 text-emerald-600" />
            区域收入分布
          </h3>
          <div className="space-y-4">
            {revenueByRegion.map((region, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900">{region.region}</p>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{region.growth}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">收入</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(region.revenue)}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xs text-slate-600">占比</p>
                    <p className="text-lg font-bold text-slate-900">{region.percent}%</p>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-emerald-600 h-3 rounded-full transition-all" 
                    style={{ width: `${region.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-700 mb-2">💡 市场建议</p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• 南美市场增长最快(+22.5%)，建议加大投入</li>
              <li>• 北美市场占比54.2%，保持稳定增长</li>
              <li>• 欧洲市场竞争激烈，建议差异化定价</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* 弹窗：定价策略设置 */}
      <Dialog open={showPricingStrategy} onOpenChange={setShowPricingStrategy}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              区域定价策略设置
            </DialogTitle>
            <DialogDescription>
              为不同区域设置差异化定价策略
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="region">选择区域 *</Label>
                <Select>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north_america">北美</SelectItem>
                    <SelectItem value="south_america">南美</SelectItem>
                    <SelectItem value="europe">欧洲</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseCurrency">基准货币 *</Label>
                <Select>
                  <SelectTrigger id="baseCurrency">
                    <SelectValue placeholder="选择货币" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - 美元</SelectItem>
                    <SelectItem value="EUR">EUR - 欧元</SelectItem>
                    <SelectItem value="GBP">GBP - 英镑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="priceAdjustment">价格调整 (%)</Label>
                <Input 
                  id="priceAdjustment" 
                  type="number" 
                  placeholder="例如: -8 表示降价8%" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgDiscount">平均折扣 (%)</Label>
                <Input 
                  id="avgDiscount" 
                  type="number" 
                  placeholder="例如: 10" 
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">💡 定价建议</p>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>• 考虑当地购买力和竞争环境</li>
                <li>• 建议价格调整幅度在±15%以内</li>
                <li>• 定期review并根据市场反馈调整</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingStrategy(false)}>
              取消
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleUpdatePricing}
            >
              保存策略
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
