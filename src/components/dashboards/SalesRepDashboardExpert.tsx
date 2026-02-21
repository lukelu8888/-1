// 🔥 业务员工作台 - 客户开发专家版（顶级背调+开发系统）
// Sales Representative Dashboard - Expert Edition with Due Diligence

import { 
  TrendingUp, DollarSign, Users, Package, AlertCircle,
  Calendar, Phone, MapPin, Download, Trophy, Bell, FileText, BarChart3,
  Star, Gift, Target, Search, Globe, Briefcase, UserPlus,
  Share2, Mail, MessageSquare, ExternalLink, Zap, Filter, Video,
  CheckCircle, XCircle, Clock, ShieldCheck, TrendingDown,
  Building2, CreditCard, Scale, Award, Eye, ThumbsUp, Activity,
  LineChart, PieChart, Database, FileSearch, UserCheck, Plane,
  ShoppingBag, Store, RefreshCcw, X
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  LineChart as RechartsLine, Line, BarChart, Bar, ComposedChart, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { User } from "../../lib/rbac-config";
import { useState } from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ActionPlaybookDialog } from "./ActionPlaybookDialog"; // 🔥 导入执行手册弹窗

interface SalesRepDashboardExpertProps {
  user: User;
}

// 📊 生成业务员个人数据
function getSalesRepData(userId: string, region: 'NA' | 'SA' | 'EMEA') {
  // 🔥 支持maria账号（与sales1是同一个人）
  if (userId === 'maria') userId = 'sales1';
  
  const repDatabase: Record<string, any> = {
    'sales1': {
      name: 'Maria Garcia', region: 'NA', avatar: '👩‍💼', revenue: 285000, target: 300000,
      orders: 22, customers: 18, newCustomers: 3, conversion: 32.5, commission: 14250,
      commissionRate: 5, rank: 1, teamSize: 8,
      // 客户开发数据
      developmentData: {
        totalLeads: 55,          // 总潜在客户
        activeLeads: 15,         // 活跃潜客
        qualifiedLeads: 8,       // 已认证潜客
        convertedLeads: 3,       // 本月转化
        conversionRate: 25.0,    // 转化率
        avgConversionDays: 28,   // 平均转化天数
        followUpsPending: 8,     // 待跟进
        dueDiligencePending: 5,  // 待背调
      },
      monthlyData: [
        { month: '1月', revenue: 42000, target: 50000, orders: 3, newLeads: 10, converted: 0, qualified: 2 },
        { month: '2月', revenue: 45000, target: 50000, orders: 4, newLeads: 9, converted: 1, qualified: 3 },
        { month: '3月', revenue: 48000, target: 50000, orders: 4, newLeads: 11, converted: 0, qualified: 2 },
        { month: '4月', revenue: 47000, target: 50000, orders: 3, newLeads: 8, converted: 1, qualified: 2 },
        { month: '5月', revenue: 51000, target: 50000, orders: 4, newLeads: 10, converted: 0, qualified: 3 },
        { month: '6月', revenue: 52000, target: 50000, orders: 4, newLeads: 7, converted: 1, qualified: 1 },
      ],
    },
    'sales2': {
      name: 'Ana Santos', region: 'SA', avatar: '👩‍💼', revenue: 238000, target: 250000,
      orders: 18, customers: 14, newCustomers: 2, conversion: 26.5, commission: 11900,
      commissionRate: 5, rank: 1, teamSize: 5,
      developmentData: {
        totalLeads: 42,
        activeLeads: 11,
        qualifiedLeads: 6,
        convertedLeads: 2,
        conversionRate: 22.0,
        avgConversionDays: 35,
        followUpsPending: 6,
        dueDiligencePending: 3,
      },
      monthlyData: [
        { month: '1月', revenue: 36000, target: 41667, orders: 3, newLeads: 8, converted: 0, qualified: 1 },
        { month: '2月', revenue: 38000, target: 41667, orders: 3, newLeads: 7, converted: 1, qualified: 2 },
        { month: '3月', revenue: 40000, target: 41667, orders: 3, newLeads: 8, converted: 0, qualified: 1 },
        { month: '4月', revenue: 39000, target: 41667, orders: 3, newLeads: 6, converted: 0, qualified: 1 },
        { month: '5月', revenue: 42000, target: 41667, orders: 3, newLeads: 7, converted: 1, qualified: 2 },
        { month: '6月', revenue: 43000, target: 41667, orders: 3, newLeads: 6, converted: 0, qualified: 1 },
      ],
    },
    'sales3': {
      name: 'Emma Thompson', region: 'EMEA', avatar: '👩‍💼', revenue: 268000, target: 280000,
      orders: 20, customers: 16, newCustomers: 3, conversion: 28.8, commission: 13400,
      commissionRate: 5, rank: 1, teamSize: 6,
      developmentData: {
        totalLeads: 48,
        activeLeads: 13,
        qualifiedLeads: 7,
        convertedLeads: 3,
        conversionRate: 24.5,
        avgConversionDays: 30,
        followUpsPending: 7,
        dueDiligencePending: 4,
      },
      monthlyData: [
        { month: '1月', revenue: 40000, target: 46667, orders: 3, newLeads: 9, converted: 0, qualified: 2 },
        { month: '2月', revenue: 43000, target: 46667, orders: 3, newLeads: 8, converted: 1, qualified: 2 },
        { month: '3月', revenue: 45000, target: 46667, orders: 3, newLeads: 9, converted: 1, qualified: 1 },
        { month: '4月', revenue: 44000, target: 46667, orders: 3, newLeads: 7, converted: 0, qualified: 2 },
        { month: '5月', revenue: 48000, target: 46667, orders: 4, newLeads: 8, converted: 1, qualified: 2 },
        { month: '6月', revenue: 48000, target: 46667, orders: 4, newLeads: 7, converted: 0, qualified: 1 },
      ],
    },
  };
  return repDatabase[userId] || repDatabase['sales1'];
}

// 🎯 客户来源/渠道数据（6大渠道）
function getCustomerSources(userId: string) {
  // 🔥 支持maria账号（与sales1是同一个人）
  if (userId === 'maria') userId = 'sales1';
  
  const sourceDatabase: Record<string, any> = {
    'sales1': {
      sources: [
        { channel: '社交媒体', subChannels: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Google Ads'], leads: 32, customers: 14, revenue: 285000, cost: 15500, roi: 1739, conversionRate: 43.8, avgDays: 24 },
        { channel: '老客户', subChannels: ['复购', '追加订单', '升级'], leads: 8, customers: 8, revenue: 156000, cost: 0, roi: 99999, conversionRate: 100.0, avgDays: 7 },
        { channel: '展会', subChannels: ['美国展', '巴西展', '德国展'], leads: 6, customers: 3, revenue: 98000, cost: 25000, roi: 292, conversionRate: 50.0, avgDays: 18 },
        { channel: '客户介绍', subChannels: ['战略客户', '普通客户'], leads: 5, customers: 4, revenue: 78000, cost: 0, roi: 99999, conversionRate: 80.0, avgDays: 12 },
        { channel: '海关数据', subChannels: ['Import Genius', 'Panjiva'], leads: 3, customers: 1, revenue: 45000, cost: 3600, roi: 1150, conversionRate: 33.3, avgDays: 35 },
        { channel: '其他', subChannels: ['冷邮件', '电话开发', '独立站'], leads: 1, customers: 0, revenue: 0, cost: 800, roi: 0, conversionRate: 0, avgDays: 0 },
      ],
      socialMediaBreakdown: [
        { channel: 'LinkedIn', leads: 8, customers: 3, revenue: 72000, conversionRate: 37.5 },
        { channel: 'Google Ads', leads: 10, customers: 4, revenue: 95000, conversionRate: 40.0 },
        { channel: 'Instagram', leads: 5, customers: 2, revenue: 42000, conversionRate: 40.0 },
        { channel: 'Facebook', leads: 4, customers: 2, revenue: 35000, conversionRate: 50.0 },
        { channel: 'TikTok', leads: 3, customers: 2, revenue: 28000, conversionRate: 66.7 },
        { channel: 'YouTube', leads: 2, customers: 1, revenue: 13000, conversionRate: 50.0 },
      ]
    },
    'sales2': {
      sources: [
        { channel: '社交媒体', subChannels: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Google Ads'], leads: 25, customers: 11, revenue: 238000, cost: 12200, roi: 1852, conversionRate: 44.0, avgDays: 26 },
        { channel: '老客户', subChannels: ['复购', '追加订单', '升级'], leads: 6, customers: 6, revenue: 125000, cost: 0, roi: 99999, conversionRate: 100.0, avgDays: 8 },
        { channel: '展会', subChannels: ['巴西展', '阿根廷展', '智利展'], leads: 5, customers: 2, revenue: 78000, cost: 20000, roi: 290, conversionRate: 40.0, avgDays: 22 },
        { channel: '客户介绍', subChannels: ['战略客户', '普通客户'], leads: 4, customers: 3, revenue: 62000, cost: 0, roi: 99999, conversionRate: 75.0, avgDays: 15 },
        { channel: '海关数据', subChannels: ['Import Genius', 'Panjiva'], leads: 2, customers: 1, revenue: 35000, cost: 2800, roi: 1150, conversionRate: 50.0, avgDays: 38 },
        { channel: '其他', subChannels: ['冷邮件', '电话开发', '独立站'], leads: 0, customers: 0, revenue: 0, cost: 600, roi: 0, conversionRate: 0, avgDays: 0 },
      ],
      socialMediaBreakdown: [
        { channel: 'LinkedIn', leads: 6, customers: 3, revenue: 58000, conversionRate: 50.0 },
        { channel: 'Google Ads', leads: 8, customers: 3, revenue: 72000, conversionRate: 37.5 },
        { channel: 'Instagram', leads: 4, customers: 2, revenue: 38000, conversionRate: 50.0 },
        { channel: 'Facebook', leads: 3, customers: 1, revenue: 28000, conversionRate: 33.3 },
        { channel: 'TikTok', leads: 3, customers: 1, revenue: 25000, conversionRate: 33.3 },
        { channel: 'YouTube', leads: 1, customers: 1, revenue: 17000, conversionRate: 100.0 },
      ]
    },
    'sales3': {
      sources: [
        { channel: '社交媒体', subChannels: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Google Ads'], leads: 28, customers: 13, revenue: 268000, cost: 14000, roi: 1814, conversionRate: 46.4, avgDays: 25 },
        { channel: '老客户', subChannels: ['复购', '追加订单', '升级'], leads: 7, customers: 7, revenue: 142000, cost: 0, roi: 99999, conversionRate: 100.0, avgDays: 7 },
        { channel: '展会', subChannels: ['德国展', '英国展', '法国展'], leads: 5, customers: 3, revenue: 88000, cost: 22000, roi: 300, conversionRate: 60.0, avgDays: 20 },
        { channel: '客户介绍', subChannels: ['战略客户', '普通客户'], leads: 4, customers: 4, revenue: 72000, cost: 0, roi: 99999, conversionRate: 100.0, avgDays: 10 },
        { channel: '海关数据', subChannels: ['Import Genius', 'Panjiva'], leads: 3, customers: 1, revenue: 42000, cost: 3200, roi: 1213, conversionRate: 33.3, avgDays: 32 },
        { channel: '其他', subChannels: ['冷邮件', '电话开发', '独立站'], leads: 1, customers: 0, revenue: 0, cost: 700, roi: 0, conversionRate: 0, avgDays: 0 },
      ],
      socialMediaBreakdown: [
        { channel: 'LinkedIn', leads: 7, customers: 4, revenue: 68000, conversionRate: 57.1 },
        { channel: 'Google Ads', leads: 9, customers: 4, revenue: 88000, conversionRate: 44.4 },
        { channel: 'Instagram', leads: 5, customers: 2, revenue: 45000, conversionRate: 40.0 },
        { channel: 'Facebook', leads: 3, customers: 1, revenue: 30000, conversionRate: 33.3 },
        { channel: 'TikTok', leads: 3, customers: 1, revenue: 22000, conversionRate: 33.3 },
        { channel: 'YouTube', leads: 1, customers: 1, revenue: 15000, conversionRate: 100.0 },
      ]
    },
  };
  return sourceDatabase[userId] || sourceDatabase['sales1'];
}

// 🔥 客户背调系统
function getCustomerDueDiligence(userId: string) {
  // 🔥 支持maria账号（与sales1是同一个人）
  if (userId === 'maria') userId = 'sales1';
  
  const ddDatabase: Record<string, any[]> = {
    'sales1': [
      {
        id: 'L001',
        company: 'BuildRight Corp',
        contact: 'John Smith',
        source: 'Google Ads',
        stage: '背调中',
        potential: 450000,
        // 背调维度
        dueDiligence: {
          // 1. 企业资质（25分）
          companyInfo: {
            score: 22,
            foundedYear: 2008,
            registeredCapital: '$5M',
            credit: 'A+',
            listed: false,
            verified: true,
          },
          // 2. 商业信誉（25分）
          reputation: {
            score: 20,
            paymentHistory: '优秀',
            creditRating: 'AA',
            lawsuits: 0,
            industryRank: 'Top 15%',
          },
          // 3. 业务能力（25分）
          businessCapacity: {
            score: 23,
            annualPurchase: '$2.5M',
            purchaseCycle: '月度',
            existingSuppliers: 5,
            decisionProcess: '采购部→财务→CEO',
          },
          // 4. 决策人分析（15分）
          decisionMakers: {
            score: 13,
            keyPerson: 'John Smith - Procurement Director',
            linkedinVerified: true,
            experience: '8年采购经验',
            influence: '高',
          },
          // 5. 海关数据（10分）
          customsData: {
            score: 8,
            importFrequency: '12次/年',
            avgOrderValue: '$180K',
            topSupplier: 'China 65%',
            trend: '增长15%',
          },
          // 总分
          totalScore: 86,
          healthGrade: 'A',
          riskLevel: '低',
          recommendation: '高优先级跟进',
        },
        nextAction: '发送定制方案',
        actionDeadline: '2天内',
        lastContact: '1天前',
      },
      {
        id: 'L002',
        company: 'Construction Materials Ltd',
        contact: 'Sarah Johnson',
        source: 'LinkedIn',
        stage: '背调完成',
        potential: 280000,
        dueDiligence: {
          companyInfo: { score: 18, foundedYear: 2015, registeredCapital: '$1.2M', credit: 'B+', listed: false, verified: true },
          reputation: { score: 16, paymentHistory: '良好', creditRating: 'A', lawsuits: 1, industryRank: 'Top 30%' },
          businessCapacity: { score: 19, annualPurchase: '$800K', purchaseCycle: '季度', existingSuppliers: 3, decisionProcess: '采购部→总经理' },
          decisionMakers: { score: 11, keyPerson: 'Sarah Johnson - Buyer', linkedinVerified: true, experience: '5年', influence: '中' },
          customsData: { score: 6, importFrequency: '4次/年', avgOrderValue: '$200K', topSupplier: 'China 45%', trend: '稳定' },
          totalScore: 70,
          healthGrade: 'B',
          riskLevel: '中',
          recommendation: '中等优先级',
        },
        nextAction: '需求确认会议',
        actionDeadline: '3天内',
        lastContact: '2天前',
      },
      {
        id: 'L003',
        company: 'Metro Builders',
        contact: 'David Lee',
        source: '展会',
        stage: '待背调',
        potential: 520000,
        dueDiligence: {
          companyInfo: { score: 0, foundedYear: 0, registeredCapital: '', credit: '', listed: false, verified: false },
          reputation: { score: 0, paymentHistory: '', creditRating: '', lawsuits: 0, industryRank: '' },
          businessCapacity: { score: 0, annualPurchase: '', purchaseCycle: '', existingSuppliers: 0, decisionProcess: '' },
          decisionMakers: { score: 0, keyPerson: '', linkedinVerified: false, experience: '', influence: '' },
          customsData: { score: 0, importFrequency: '', avgOrderValue: '', topSupplier: '', trend: '' },
          totalScore: 0,
          healthGrade: '未评估',
          riskLevel: '未知',
          recommendation: '立即启动背调',
        },
        nextAction: '⚠️ 启动背调',
        actionDeadline: '24小时内',
        lastContact: '3天前',
      },
      {
        id: 'L004',
        company: 'Hardware Plus Inc',
        contact: 'Mike Davis',
        source: '客户介绍',
        stage: '背调完成',
        potential: 680000,
        dueDiligence: {
          companyInfo: { score: 24, foundedYear: 2005, registeredCapital: '$8M', credit: 'A++', listed: true, verified: true },
          reputation: { score: 24, paymentHistory: '卓越', creditRating: 'AAA', lawsuits: 0, industryRank: 'Top 5%' },
          businessCapacity: { score: 25, annualPurchase: '$5M', purchaseCycle: '月度', existingSuppliers: 8, decisionProcess: '采购VP→CFO→CEO' },
          decisionMakers: { score: 15, keyPerson: 'Mike Davis - VP Procurement', linkedinVerified: true, experience: '12年', influence: '极高' },
          customsData: { score: 10, importFrequency: '24次/年', avgOrderValue: '$220K', topSupplier: 'China 75%', trend: '增长25%' },
          totalScore: 98,
          healthGrade: 'A+',
          riskLevel: '极低',
          recommendation: '战略客户，最高优先级',
        },
        nextAction: '高层会议',
        actionDeadline: '1天内',
        lastContact: '今天',
      },
      {
        id: 'L005',
        company: 'Small Hardware Store',
        contact: 'Tom Wilson',
        source: '海关数据',
        stage: '背调完成',
        potential: 85000,
        dueDiligence: {
          companyInfo: { score: 12, foundedYear: 2018, registeredCapital: '$200K', credit: 'C', listed: false, verified: true },
          reputation: { score: 10, paymentHistory: '一般', creditRating: 'B-', lawsuits: 2, industryRank: 'Top 60%' },
          businessCapacity: { score: 8, annualPurchase: '$300K', purchaseCycle: '不定期', existingSuppliers: 2, decisionProcess: '老板决策' },
          decisionMakers: { score: 6, keyPerson: 'Tom Wilson - Owner', linkedinVerified: false, experience: '3年', influence: '中' },
          customsData: { score: 4, importFrequency: '2次/年', avgOrderValue: '$150K', topSupplier: 'China 100%', trend: '下降10%' },
          totalScore: 40,
          healthGrade: 'D',
          riskLevel: '高',
          recommendation: '低优先级，建议预付款',
        },
        nextAction: '⚠️ 付款条件谈判',
        actionDeadline: '待定',
        lastContact: '1周前',
      },
    ],
    'sales2': [
      {
        id: 'L201',
        company: 'Construtora ABC',
        contact: 'Carlos Silva',
        source: 'Google Ads',
        stage: '背调通过',
        potential: 420000,
        dueDiligence: {
          companyInfo: { score: 20, foundedYear: 2010, registeredCapital: '$3M', credit: 'A', listed: false, verified: true },
          reputation: { score: 18, paymentHistory: '良好', creditRating: 'A', lawsuits: 0, industryRank: 'Top 20%' },
          businessCapacity: { score: 21, annualPurchase: '$1.8M', purchaseCycle: '月度', existingSuppliers: 4, decisionProcess: '采购部→财务→总经理' },
          decisionMakers: { score: 12, keyPerson: 'Carlos Silva - Procurement Manager', linkedinVerified: true, experience: '6年', influence: '高' },
          customsData: { score: 7, importFrequency: '10次/年', avgOrderValue: '$150K', topSupplier: 'China 60%', trend: '增长10%' },
          totalScore: 78,
          healthGrade: 'B+',
          riskLevel: '低',
          recommendation: '积极跟进',
        },
        nextAction: '发送详细报价',
        actionDeadline: '2天内',
        lastContact: '1天前',
      },
      {
        id: 'L202',
        company: 'Chile Construction',
        contact: 'Pedro Costa',
        source: '展会',
        stage: '背调中',
        potential: 580000,
        dueDiligence: {
          companyInfo: { score: 23, foundedYear: 2005, registeredCapital: '$8M', credit: 'A+', listed: true, verified: true },
          reputation: { score: 22, paymentHistory: '优秀', creditRating: 'AA', lawsuits: 0, industryRank: 'Top 10%' },
          businessCapacity: { score: 24, annualPurchase: '$3.2M', purchaseCycle: '月度', existingSuppliers: 6, decisionProcess: '采购委员会→董事会' },
          decisionMakers: { score: 14, keyPerson: 'Pedro Costa - VP Procurement', linkedinVerified: true, experience: '12年', influence: '高' },
          customsData: { score: 9, importFrequency: '15次/年', avgOrderValue: '$200K', topSupplier: 'China 70%', trend: '增长20%' },
          totalScore: 92,
          healthGrade: 'A+',
          riskLevel: '低',
          recommendation: '高优先级，长期合作潜力',
        },
        nextAction: '商务谈判',
        actionDeadline: '1天内',
        lastContact: '今天',
      },
    ],
    'sales3': [
      {
        id: 'L301',
        company: 'Deutsche Build AG',
        contact: 'Hans Mueller',
        source: 'Google Ads',
        stage: '背调通过',
        potential: 520000,
        dueDiligence: {
          companyInfo: { score: 24, foundedYear: 2000, registeredCapital: '$15M', credit: 'AA', listed: true, verified: true },
          reputation: { score: 23, paymentHistory: '优秀', creditRating: 'AA+', lawsuits: 0, industryRank: 'Top 5%' },
          businessCapacity: { score: 24, annualPurchase: '$4.5M', purchaseCycle: '月度', existingSuppliers: 8, decisionProcess: '采购部→质量部→董事会' },
          decisionMakers: { score: 14, keyPerson: 'Hans Mueller - Procurement Director', linkedinVerified: true, experience: '15年', influence: '高' },
          customsData: { score: 9, importFrequency: '18次/年', avgOrderValue: '$250K', topSupplier: 'China 55%', trend: '增长12%' },
          totalScore: 94,
          healthGrade: 'A+',
          riskLevel: '低',
          recommendation: '战略客户，高优先级',
        },
        nextAction: '定制报价',
        actionDeadline: '1天内',
        lastContact: '今天',
      },
      {
        id: 'L302',
        company: 'France Construction SA',
        contact: 'Pierre Dubois',
        source: '展会',
        stage: '背调中',
        potential: 720000,
        dueDiligence: {
          companyInfo: { score: 23, foundedYear: 2003, registeredCapital: '$12M', credit: 'A+', listed: true, verified: true },
          reputation: { score: 22, paymentHistory: '优秀', creditRating: 'AA', lawsuits: 0, industryRank: 'Top 8%' },
          businessCapacity: { score: 25, annualPurchase: '$5M', purchaseCycle: '月度', existingSuppliers: 7, decisionProcess: '采购委员会→质量委员会→CEO' },
          decisionMakers: { score: 15, keyPerson: 'Pierre Dubois - Chief Procurement Officer', linkedinVerified: true, experience: '18年', influence: '高' },
          customsData: { score: 10, importFrequency: '20次/年', avgOrderValue: '$300K', topSupplier: 'China 65%', trend: '增长18%' },
          totalScore: 95,
          healthGrade: 'A+',
          riskLevel: '低',
          recommendation: '顶级客户，最高优先级',
        },
        nextAction: '价格协商',
        actionDeadline: '今天',
        lastContact: '今天',
      },
    ],
  };
  return ddDatabase[userId] || ddDatabase['sales1'];
}

// 🎯 客户开发行动清单
function getActionTimeline(userId: string) {
  return [
    { timeframe: '24小时内', actions: ['首次回复询盘', 'LinkedIn添加', '初步信息搜集', '启动背调流程'], count: 3, priority: 'urgent' },
    { timeframe: '3天内', actions: ['完成背调报告', '需求确认会议', '初步方案制定', '样品准备'], count: 5, priority: 'high' },
    { timeframe: '7天内', actions: ['正式报价发送', '样品寄送', '视频会议', '客户拜访计划'], count: 4, priority: 'medium' },
    { timeframe: '14天内', actions: ['跟进报价反馈', '方案调整', '商务谈判', '推进决策'], count: 2, priority: 'normal' },
  ];
}

// 🏆 客户分级管理（ABC分类）
function getCustomerSegmentation(userId: string) {
  return {
    segments: [
      { tier: 'A级（战略）', count: 4, revenue: 185000, criteria: '年采购>$500K', color: 'green', percentage: 22 },
      { tier: 'B级（重点）', count: 6, revenue: 68000, criteria: '$100K-$500K', color: 'blue', percentage: 33 },
      { tier: 'C级（普通）', count: 8, revenue: 32000, criteria: '<$100K', color: 'slate', percentage: 45 },
    ],
    leads: [
      { tier: '高潜力', count: 5, score: '85-100', action: '立即跟进', color: 'orange' },
      { tier: '中潜力', count: 6, score: '60-84', action: '定期跟进', color: 'yellow' },
      { tier: '低潜力', count: 4, score: '<60', action: '观察培育', color: 'gray' },
    ]
  };
}

// 📊 BANT资格认证
function getBantQualification(userId: string) {
  // 🔥 支持maria账号（与sales1是同一个人）
  if (userId === 'maria') userId = 'sales1';
  
  const bantDatabase: Record<string, any[]> = {
    'sales1': [
      { 
        company: 'BuildRight Corp',
        budget: { status: 'confirmed', value: '$2.5M/年', score: 10 },
        authority: { status: 'verified', person: 'John Smith - Procurement Director', score: 10 },
        need: { status: 'high', description: '寻找新供应商以降低成本10%', score: 9 },
        timeline: { status: 'urgent', plan: '2个月内首单', score: 10 },
        totalScore: 39,
        qualified: true,
      },
      { 
        company: 'Construction Materials Ltd',
        budget: { status: 'confirmed', value: '$800K/年', score: 8 },
        authority: { status: 'partial', person: 'Sarah Johnson - Buyer (需总经理批准)', score: 6 },
        need: { status: 'medium', description: '现有供应商交期不稳定', score: 7 },
        timeline: { status: 'normal', plan: '3-4个月', score: 7 },
        totalScore: 28,
        qualified: true,
      },
      { 
        company: 'Small Hardware Store',
        budget: { status: 'unclear', value: '未确认', score: 3 },
        authority: { status: 'verified', person: 'Tom Wilson - Owner', score: 8 },
        need: { status: 'low', description: '价格敏感，不明确需求', score: 4 },
        timeline: { status: 'unclear', plan: '时间不确定', score: 3 },
        totalScore: 18,
        qualified: false,
      },
    ],
    'sales2': [
      { 
        company: 'Construtora ABC',
        budget: { status: 'confirmed', value: '$1.8M/年', score: 9 },
        authority: { status: 'verified', person: 'Carlos Silva - Procurement Manager', score: 9 },
        need: { status: 'high', description: '扩大采购渠道，降低成本12%', score: 9 },
        timeline: { status: 'urgent', plan: '6周内首单', score: 9 },
        totalScore: 36,
        qualified: true,
      },
      { 
        company: 'Chile Construction',
        budget: { status: 'confirmed', value: '$3.2M/年', score: 10 },
        authority: { status: 'verified', person: 'Pedro Costa - VP Procurement', score: 10 },
        need: { status: 'high', description: '战略合作伙伴，长期稳定供应', score: 10 },
        timeline: { status: 'urgent', plan: '1个月内首单', score: 10 },
        totalScore: 40,
        qualified: true,
      },
    ],
    'sales3': [
      { 
        company: 'Deutsche Build AG',
        budget: { status: 'confirmed', value: '$4.5M/年', score: 10 },
        authority: { status: 'verified', person: 'Hans Mueller - Procurement Director', score: 10 },
        need: { status: 'high', description: '多元化供应链，寻找优质中国供应商', score: 10 },
        timeline: { status: 'urgent', plan: '1个月内首单', score: 10 },
        totalScore: 40,
        qualified: true,
      },
      { 
        company: 'France Construction SA',
        budget: { status: 'confirmed', value: '$5M/年', score: 10 },
        authority: { status: 'verified', person: 'Pierre Dubois - CPO', score: 10 },
        need: { status: 'high', description: '战略级供应商，长期合作伙伴关系', score: 10 },
        timeline: { status: 'urgent', plan: '2周内首单', score: 10 },
        totalScore: 40,
        qualified: true,
      },
    ],
  };
  return bantDatabase[userId] || bantDatabase['sales1'];
}

// 🎯 客户类型业务指标（6种客户类型）
function getCustomerTypeMetrics(userId: string) {
  // 🔥 支持maria账号（与sales1是同一个人）
  if (userId === 'maria') userId = 'sales1';
  
  const metricsDatabase: Record<string, any> = {
    'sales1': {
      types: [
        { 
          type: 'Retailer', 
          label: '零售商', 
          icon: ShoppingBag,
          count: 6, 
          revenue: 125000, 
          avgOrderValue: 45000,
          orders: 15,
          growth: 18.5,
          businessTypes: ['产品采购'],
          topClients: ['ABC Trading Ltd.', 'BuildMart Co.'],
          conversionRate: 35.0,
          repeatRate: 85.0,
          color: 'blue'
        },
        { 
          type: 'Importer', 
          label: '进口商', 
          icon: Plane,
          count: 4, 
          revenue: 98000, 
          avgOrderValue: 62000,
          orders: 8,
          growth: 22.3,
          businessTypes: ['产品采购', '验货服务'],
          topClients: ['HomeStyle Inc.', 'Euro Construction Ltd'],
          conversionRate: 42.5,
          repeatRate: 90.0,
          color: 'green'
        },
        { 
          type: 'Wholesaler', 
          label: '批发商', 
          icon: Store,
          count: 5, 
          revenue: 85000, 
          avgOrderValue: 38000,
          orders: 12,
          growth: 15.2,
          businessTypes: ['产品采购'],
          topClients: ['BuildMart Co.', 'Pro Hardware LLC'],
          conversionRate: 38.0,
          repeatRate: 80.0,
          color: 'purple'
        },
        { 
          type: 'Project Contractor', 
          label: '项目承包商', 
          icon: Building2,
          count: 2, 
          revenue: 68000, 
          avgOrderValue: 85000,
          orders: 4,
          growth: 28.7,
          businessTypes: ['一站式项目', '产品采购'],
          topClients: ['Elite Supplies', 'Construction Plus'],
          conversionRate: 45.0,
          repeatRate: 75.0,
          color: 'orange'
        },
        { 
          type: 'Agent-Seeking Buyer', 
          label: '寻求代理买家', 
          icon: Briefcase,
          count: 1, 
          revenue: 12000, 
          avgOrderValue: 12000,
          orders: 1,
          growth: 0,
          businessTypes: ['代理服务'],
          topClients: ['Global Hardware Ltd.'],
          conversionRate: 20.0,
          repeatRate: 0,
          color: 'indigo'
        },
        { 
          type: 'Inspection Client', 
          label: '验货客户', 
          icon: UserCheck,
          count: 0, 
          revenue: 0, 
          avgOrderValue: 0,
          orders: 0,
          growth: 0,
          businessTypes: ['验货服务'],
          topClients: [],
          conversionRate: 0,
          repeatRate: 0,
          color: 'teal'
        },
      ],
      // 业务类型分布
      businessTypeDistribution: [
        { type: '产品采购', count: 17, revenue: 276000, percentage: 94.4 },
        { type: '验货服务', count: 4, revenue: 12000, percentage: 4.1 },
        { type: '一站式项目', count: 2, revenue: 68000, percentage: 23.3 },
        { type: '代理服务', count: 1, revenue: 12000, percentage: 4.1 },
      ]
    },
    'sales2': {
      types: [
        { 
          type: 'Retailer', 
          label: '零售商', 
          icon: ShoppingBag,
          count: 4, 
          revenue: 95000, 
          avgOrderValue: 38000,
          orders: 12,
          growth: 15.2,
          businessTypes: ['产品采购'],
          topClients: ['Mercado Sul', 'Brasil Shop'],
          conversionRate: 33.0,
          repeatRate: 83.0,
          color: 'blue'
        },
        { 
          type: 'Importer', 
          label: '进口商', 
          icon: Plane,
          count: 3, 
          revenue: 82000, 
          avgOrderValue: 55000,
          orders: 6,
          growth: 18.5,
          businessTypes: ['产品采购', '验货服务'],
          topClients: ['Chile Import Co.', 'Argentina Trade'],
          conversionRate: 37.5,
          repeatRate: 87.0,
          color: 'green'
        },
        { 
          type: 'Wholesaler', 
          label: '批发商', 
          icon: Store,
          count: 4, 
          revenue: 72000, 
          avgOrderValue: 32000,
          orders: 10,
          growth: 12.8,
          businessTypes: ['产品采购'],
          topClients: ['SA Wholesale', 'Brazil Dist'],
          conversionRate: 35.0,
          repeatRate: 78.0,
          color: 'purple'
        },
        { 
          type: 'Project Contractor', 
          label: '项目承包商', 
          icon: Building2,
          count: 2, 
          revenue: 58000, 
          avgOrderValue: 72000,
          orders: 3,
          growth: 25.0,
          businessTypes: ['一站式项目', '产品采购'],
          topClients: ['Construtora ABC', 'Chile Construction'],
          conversionRate: 40.0,
          repeatRate: 70.0,
          color: 'orange'
        },
        { 
          type: 'Agent-Seeking Buyer', 
          label: '寻求代理买家', 
          icon: Briefcase,
          count: 0, 
          revenue: 0, 
          avgOrderValue: 0,
          orders: 0,
          growth: 0,
          businessTypes: ['代理服务'],
          topClients: [],
          conversionRate: 0,
          repeatRate: 0,
          color: 'indigo'
        },
        { 
          type: 'Inspection Client', 
          label: '验货客户', 
          icon: UserCheck,
          count: 1, 
          revenue: 9000, 
          avgOrderValue: 9000,
          orders: 3,
          growth: 100,
          businessTypes: ['验货服务'],
          topClients: ['SA Quality Check'],
          conversionRate: 25.0,
          repeatRate: 100,
          color: 'teal'
        },
      ],
      businessTypeDistribution: [
        { type: '产品采购', count: 13, revenue: 205000, percentage: 86.1 },
        { type: '验货服务', count: 3, revenue: 9000, percentage: 3.8 },
        { type: '一站式项目', count: 2, revenue: 45000, percentage: 18.9 },
        { type: '代理服务', count: 0, revenue: 0, percentage: 0 },
      ]
    },
    'sales3': {
      types: [
        { 
          type: 'Retailer', 
          label: '零售商', 
          icon: ShoppingBag,
          count: 5, 
          revenue: 112000, 
          avgOrderValue: 42000,
          orders: 14,
          growth: 16.8,
          businessTypes: ['产品采购'],
          topClients: ['Deutsche Handel', 'UK Retail'],
          conversionRate: 38.0,
          repeatRate: 86.0,
          color: 'blue'
        },
        { 
          type: 'Importer', 
          label: '进口商', 
          icon: Plane,
          count: 4, 
          revenue: 96000, 
          avgOrderValue: 60000,
          orders: 7,
          growth: 20.2,
          businessTypes: ['产品采购', '验货服务'],
          topClients: ['France Import SA', 'Italia Trade'],
          conversionRate: 42.0,
          repeatRate: 90.0,
          color: 'green'
        },
        { 
          type: 'Wholesaler', 
          label: '批发商', 
          icon: Store,
          count: 5, 
          revenue: 88000, 
          avgOrderValue: 35000,
          orders: 11,
          growth: 14.5,
          businessTypes: ['产品采购'],
          topClients: ['EMEA Wholesale', 'Euro Distribution'],
          conversionRate: 36.0,
          repeatRate: 82.0,
          color: 'purple'
        },
        { 
          type: 'Project Contractor', 
          label: '项目承包商', 
          icon: Building2,
          count: 2, 
          revenue: 72000, 
          avgOrderValue: 90000,
          orders: 4,
          growth: 30.0,
          businessTypes: ['一站式项目', '产品采购'],
          topClients: ['Deutsche Build AG', 'France Construction SA'],
          conversionRate: 50.0,
          repeatRate: 75.0,
          color: 'orange'
        },
        { 
          type: 'Agent-Seeking Buyer', 
          label: '寻求代理买家', 
          icon: Briefcase,
          count: 1, 
          revenue: 8000, 
          avgOrderValue: 8000,
          orders: 1,
          growth: 0,
          businessTypes: ['代理服务'],
          topClients: ['UK Trading Ltd.'],
          conversionRate: 20.0,
          repeatRate: 0,
          color: 'indigo'
        },
        { 
          type: 'Inspection Client', 
          label: '验货客户', 
          icon: UserCheck,
          count: 1, 
          revenue: 10000, 
          avgOrderValue: 10000,
          orders: 3,
          growth: 100,
          businessTypes: ['验货服务'],
          topClients: ['EMEA Quality'],
          conversionRate: 30.0,
          repeatRate: 100,
          color: 'teal'
        },
      ],
      businessTypeDistribution: [
        { type: '产品采购', count: 15, revenue: 235000, percentage: 87.7 },
        { type: '验货服务', count: 3, revenue: 10000, percentage: 3.7 },
        { type: '一站式项目', count: 2, revenue: 55000, percentage: 20.5 },
        { type: '代理服务', count: 1, revenue: 8000, percentage: 3.0 },
      ]
    },
  };
  return metricsDatabase[userId] || metricsDatabase['sales1'];
}

export function SalesRepDashboardExpert({ user }: SalesRepDashboardExpertProps) {
  const region = user.region as 'NA' | 'SA' | 'EMEA';
  const repData = getSalesRepData(user.id, region);
  const sourceData = getCustomerSources(user.id);
  const ddData = getCustomerDueDiligence(user.id);
  const actionTimeline = getActionTimeline(user.id);
  const segmentation = getCustomerSegmentation(user.id);
  const bantData = getBantQualification(user.id);
  const customerTypeMetrics = getCustomerTypeMetrics(user.id);

  // 🎯 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('month'); // today, week, month, quarter, year, custom
  const [regionFilter, setRegionFilter] = useState('all'); // all, NA, SA, EMEA
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all'); // all, Retailer, Importer, etc.
  const [sourceFilter, setSourceFilter] = useState('all'); // all, 社交媒体, 老客户, etc.
  const [stageFilter, setStageFilter] = useState('all'); // all, 潜在客户, 背调中, 已认证, 成交客户
  const [scoreFilter, setScoreFilter] = useState('all'); // all, A(85-100), B(60-84), C(40-59), D(0-39)

  const completion = (repData.revenue / repData.target) * 100;
  const gap = repData.target - repData.revenue;

  // 计算渠道总数据
  const totalLeads = sourceData.sources.reduce((sum: number, s: any) => sum + s.leads, 0);
  const totalCustomers = sourceData.sources.reduce((sum: number, s: any) => sum + s.customers, 0);

  // 重置所有筛选
  const resetFilters = () => {
    setSearchTerm('');
    setTimeRange('month');
    setRegionFilter('all');
    setCustomerTypeFilter('all');
    setSourceFilter('all');
    setStageFilter('all');
    setScoreFilter('all');
  };

  // 计算活跃筛选数量
  const activeFilterCount = [
    searchTerm !== '',
    timeRange !== 'month',
    regionFilter !== 'all',
    customerTypeFilter !== 'all',
    sourceFilter !== 'all',
    stageFilter !== 'all',
    scoreFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-2.5 p-2.5 bg-slate-50">
      {/* 🎯 个人业绩横幅 */}
      <div className="rounded-lg p-3.5 bg-slate-800 text-white border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-slate-700 rounded flex items-center justify-center text-2xl border border-slate-600">
              {repData.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h1 className="text-white text-sm font-bold">{repData.name}</h1>
                <Badge className="bg-slate-700 text-slate-200 border-slate-600 text-xs h-4 px-1.5">客户开发专家</Badge>
                <Badge className="bg-orange-500 text-white text-xs font-semibold h-4 px-1.5">🏆#{repData.rank}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span>📍{region === 'NA' ? '北美' : region === 'SA' ? '南美' : '欧非'}</span>
                <span>•</span>
                <span>{repData.customers}客</span>
                <span>•</span>
                <span>{repData.developmentData.activeLeads}潜客</span>
                <span>•</span>
                <span>{repData.developmentData.dueDiligencePending}待背调</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 🚀 客户开发执行手册按钮 */}
            <ActionPlaybookDialog user={user} />
            
            <div className="text-right bg-slate-700 rounded px-3 py-2">
              <p className="text-xs text-slate-400">达成率</p>
              <p className="text-2xl font-bold text-white">{completion.toFixed(1)}%</p>
              <p className="text-xs text-slate-300">
                {completion >= 100 ? '超额完成' : `差${(gap / 1000).toFixed(0)}K`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 筛选搜索工具栏 */}
      <Card className="p-2.5 border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Filter className="size-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-900">筛选与搜索</h3>
            {activeFilterCount > 0 && (
              <Badge className="bg-orange-500 text-white text-xs h-4 px-1.5">
                {activeFilterCount}个筛选
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-xs h-6 px-2 text-slate-600 hover:text-slate-900"
            >
              <RefreshCcw className="size-3 mr-1" />
              重置筛选
            </Button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* 搜索框 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">搜索客户</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 size-3 text-slate-400" />
              <Input 
                placeholder="客户名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs border-slate-300"
              />
              {searchTerm && (
                <X 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 size-3 text-slate-400 cursor-pointer hover:text-slate-600"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
          </div>

          {/* 时间范围 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">时间范围</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-7 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today" className="text-xs">今日</SelectItem>
                <SelectItem value="week" className="text-xs">本周</SelectItem>
                <SelectItem value="month" className="text-xs">本月</SelectItem>
                <SelectItem value="quarter" className="text-xs">本季度</SelectItem>
                <SelectItem value="year" className="text-xs">本年度</SelectItem>
                <SelectItem value="custom" className="text-xs">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 区域筛选 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">区域</label>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部区域</SelectItem>
                <SelectItem value="NA" className="text-xs">北美</SelectItem>
                <SelectItem value="SA" className="text-xs">南美</SelectItem>
                <SelectItem value="EMEA" className="text-xs">欧非</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 客户类型 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">客户类型</label>
            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部类型</SelectItem>
                <SelectItem value="retailer" className="text-xs">🏪 建材零售商</SelectItem>
                <SelectItem value="project_contractor" className="text-xs">🏗️ 项目承包商</SelectItem>
                <SelectItem value="inspection_seeker" className="text-xs">🔍 验货客户</SelectItem>
                <SelectItem value="agency_seeker" className="text-xs">🤝 中国代理</SelectItem>
                <SelectItem value="local_manufacturer" className="text-xs">🏭 本土工厂</SelectItem>
                <SelectItem value="wholesaler" className="text-xs">📦 批发商</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 客户来源 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">客户来源</label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部来源</SelectItem>
                <SelectItem value="社交媒体" className="text-xs">社交媒体</SelectItem>
                <SelectItem value="老客户" className="text-xs">老客户</SelectItem>
                <SelectItem value="展会" className="text-xs">展会</SelectItem>
                <SelectItem value="客户介绍" className="text-xs">客户介绍</SelectItem>
                <SelectItem value="海关数据" className="text-xs">海关数据</SelectItem>
                <SelectItem value="其他" className="text-xs">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 客户阶段 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">客户阶段</label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部阶段</SelectItem>
                <SelectItem value="潜在客户" className="text-xs">潜在客户</SelectItem>
                <SelectItem value="待背调" className="text-xs">待背调</SelectItem>
                <SelectItem value="背调中" className="text-xs">背调中</SelectItem>
                <SelectItem value="背调完成" className="text-xs">背调完成</SelectItem>
                <SelectItem value="已认证" className="text-xs">已认证(BANT)</SelectItem>
                <SelectItem value="成交客户" className="text-xs">成交客户</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 评分等级 */}
          <div className="col-span-1">
            <label className="text-xs text-slate-600 mb-1 block">评分等级</label>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部等级</SelectItem>
                <SelectItem value="A" className="text-xs">A级(85-100分)</SelectItem>
                <SelectItem value="B" className="text-xs">B级(60-84分)</SelectItem>
                <SelectItem value="C" className="text-xs">C级(40-59分)</SelectItem>
                <SelectItem value="D" className="text-xs">D级(0-39分)</SelectItem>
                <SelectItem value="unscored" className="text-xs">未评分</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 筛选摘要 */}
        {activeFilterCount > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-600">当前筛选:</span>
              {searchTerm && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  搜索: {searchTerm}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {timeRange !== 'month' && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  时间: {timeRange === 'today' ? '今日' : timeRange === 'week' ? '本周' : timeRange === 'quarter' ? '本季度' : timeRange === 'year' ? '本年度' : '自定义'}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setTimeRange('month')} />
                </Badge>
              )}
              {regionFilter !== 'all' && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  区域: {regionFilter === 'NA' ? '北美' : regionFilter === 'SA' ? '南美' : '欧非'}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setRegionFilter('all')} />
                </Badge>
              )}
              {customerTypeFilter !== 'all' && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  类型: {customerTypeFilter}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setCustomerTypeFilter('all')} />
                </Badge>
              )}
              {sourceFilter !== 'all' && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  来源: {sourceFilter}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setSourceFilter('all')} />
                </Badge>
              )}
              {stageFilter !== 'all' && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  阶段: {stageFilter}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setStageFilter('all')} />
                </Badge>
              )}
              {scoreFilter !== 'all' && (
                <Badge variant="outline" className="text-xs h-5 px-1.5 border-slate-300">
                  等级: {scoreFilter}
                  <X className="size-3 ml-1 cursor-pointer" onClick={() => setScoreFilter('all')} />
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 📊 核心KPI - 8个 */}
      <div className="grid grid-cols-8 gap-2">
        {[
          { icon: DollarSign, label: '销售收入', value: `$${(repData.revenue / 1000).toFixed(0)}K`, sub: `${completion.toFixed(0)}%`, color: 'orange' },
          { icon: Package, label: '订单数', value: `${repData.orders}`, sub: `转化${repData.conversion}%`, color: 'blue' },
          { icon: Users, label: '客户数', value: `${repData.customers}`, sub: `新增${repData.newCustomers}`, color: 'green' },
          { icon: Target, label: '潜在客户', value: `${repData.developmentData.activeLeads}`, sub: `总计${repData.developmentData.totalLeads}`, color: 'purple', highlight: true },
          { icon: ShieldCheck, label: '已认证', value: `${repData.developmentData.qualifiedLeads}`, sub: 'BANT', color: 'teal', highlight: true },
          { icon: FileSearch, label: '待背调', value: `${repData.developmentData.dueDiligencePending}`, sub: '尽调中', color: 'rose', highlight: true },
          { icon: TrendingUp, label: '转化率', value: `${repData.developmentData.conversionRate}%`, sub: `${repData.developmentData.avgConversionDays}天`, color: 'indigo' },
          { icon: Gift, label: '预计佣金', value: `$${(repData.commission / 1000).toFixed(1)}K`, sub: `${repData.commissionRate}%`, color: 'pink' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className={`p-2 border-slate-300 bg-white hover:shadow-sm transition-shadow ${kpi.highlight ? 'ring-2 ring-orange-200' : ''}`}>
              <div className="flex items-start justify-between mb-1">
                <div className={`p-0.5 bg-${kpi.color}-100 rounded`}>
                  <Icon className={`size-3 text-${kpi.color}-600`} />
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-tight">{kpi.label}</p>
              <p className="text-base font-bold text-slate-900 my-0.5 leading-tight">{kpi.value}</p>
              <div className="text-xs text-slate-500">{kpi.sub}</div>
            </Card>
          );
        })}
      </div>

      {/* 📈 客户来源6大渠道 + 社媒细分 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* 客户来源6大渠道 */}
        <Card className="p-2.5 border-slate-300 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">客户来源分析（6大渠道）</h3>
              <p className="text-xs text-slate-500">Customer Acquisition Channels</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-4 px-1.5">
              {totalCustomers}个客户
            </Badge>
          </div>

          <div className="space-y-1 max-h-[240px] overflow-y-auto">
            {sourceData.sources.map((source: any, idx: number) => (
              <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-slate-900">{idx + 1}.</span>
                    <span className="text-xs font-semibold text-slate-900">{source.channel}</span>
                    <Badge className="bg-green-100 text-green-700 text-xs h-3.5 px-1">
                      转化{source.conversionRate.toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-orange-600">${(source.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-xs text-slate-600 mb-1">
                  <div>潜客:{source.leads}</div>
                  <div>成交:{source.customers}</div>
                  <div>成本:${(source.cost / 1000).toFixed(1)}K</div>
                  <div className="col-span-2">ROI:{source.roi > 10000 ? '∞' : source.roi + '%'}</div>
                  <div>周期:{source.avgDays || '-'}天</div>
                </div>
                <div className="text-xs text-slate-500">
                  细分: {source.subChannels.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 社交媒体6渠道细分 */}
        <Card className="p-2.5 border-slate-300 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">社交媒体细分</h3>
              <p className="text-xs text-slate-500">Social Media Breakdown</p>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs h-4 px-1.5">
              {sourceData.sources[0].customers}个客户
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sourceData.socialMediaBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="channel" stroke="#64748b" tick={{ fontSize: 9 }} width={70} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: '4px', padding: '4px 8px' }} />
              <Bar dataKey="revenue" fill="#f97316" name="收入" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-1 text-xs">
            <div className="text-center">
              <p className="text-slate-600">总潜客</p>
              <p className="font-bold text-blue-600">{sourceData.sources[0].leads}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-600">总成交</p>
              <p className="font-bold text-green-600">{sourceData.sources[0].customers}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-600">转化率</p>
              <p className="font-bold text-orange-600">{sourceData.sources[0].conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 🔍 客户背调系统（核心） */}
      <Card className="p-2.5 border-slate-300 bg-white border-2 border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="size-4 text-orange-600" />
              客户背调系统（Due Diligence）
            </h3>
            <p className="text-xs text-slate-500">5维度深度背调 - 企业资质/商业信誉/业务能力/决策人/海关数据</p>
          </div>
          <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs h-4 px-1.5">
            {ddData.length}个客户
          </Badge>
        </div>

        <div className="space-y-2">
          {ddData.map((dd: any) => (
            <div key={dd.id} className={`p-2.5 rounded border-2 transition-all ${
              dd.dueDiligence.totalScore >= 85 ? 'bg-green-50 border-green-300' :
              dd.dueDiligence.totalScore >= 60 ? 'bg-blue-50 border-blue-300' :
              dd.dueDiligence.totalScore >= 40 ? 'bg-yellow-50 border-yellow-300' :
              dd.dueDiligence.totalScore === 0 ? 'bg-red-50 border-red-300' :
              'bg-orange-50 border-orange-300'
            }`}>
              {/* 客户基本信息 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-900">{dd.company}</h4>
                    <Badge className={`text-xs h-4 px-1 ${
                      dd.dueDiligence.healthGrade === 'A+' || dd.dueDiligence.healthGrade === 'A' ? 'bg-green-500 text-white' :
                      dd.dueDiligence.healthGrade === 'B' ? 'bg-blue-500 text-white' :
                      dd.dueDiligence.healthGrade === 'D' ? 'bg-red-500 text-white' :
                      'bg-slate-500 text-white'
                    }`}>
                      {dd.dueDiligence.healthGrade}级
                    </Badge>
                    <Badge variant="outline" className="text-xs h-4 px-1 border-slate-300">
                      {dd.source}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>联系人: {dd.contact}</span>
                    <span>•</span>
                    <span>潜在价值: ${(dd.potential / 1000).toFixed(0)}K</span>
                    <span>•</span>
                    <span>阶段: {dd.stage}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    dd.dueDiligence.totalScore >= 85 ? 'text-green-600' :
                    dd.dueDiligence.totalScore >= 60 ? 'text-blue-600' :
                    dd.dueDiligence.totalScore >= 40 ? 'text-yellow-600' :
                    dd.dueDiligence.totalScore === 0 ? 'text-red-600' :
                    'text-orange-600'
                  }`}>
                    {dd.dueDiligence.totalScore}
                  </div>
                  <div className="text-xs text-slate-600">总分</div>
                </div>
              </div>

              {/* 5维度背调评分 */}
              {dd.dueDiligence.totalScore > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <div className="text-center p-1.5 bg-white rounded border border-slate-200">
                    <Building2 className="size-3.5 text-blue-600 mx-auto mb-0.5" />
                    <div className="text-xs font-bold text-slate-900">{dd.dueDiligence.companyInfo.score}/25</div>
                    <div className="text-xs text-slate-600">企业资质</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-slate-200">
                    <Award className="size-3.5 text-green-600 mx-auto mb-0.5" />
                    <div className="text-xs font-bold text-slate-900">{dd.dueDiligence.reputation.score}/25</div>
                    <div className="text-xs text-slate-600">商业信誉</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-slate-200">
                    <TrendingUp className="size-3.5 text-purple-600 mx-auto mb-0.5" />
                    <div className="text-xs font-bold text-slate-900">{dd.dueDiligence.businessCapacity.score}/25</div>
                    <div className="text-xs text-slate-600">业务能力</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-slate-200">
                    <UserCheck className="size-3.5 text-orange-600 mx-auto mb-0.5" />
                    <div className="text-xs font-bold text-slate-900">{dd.dueDiligence.decisionMakers.score}/15</div>
                    <div className="text-xs text-slate-600">决策人</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-slate-200">
                    <Database className="size-3.5 text-teal-600 mx-auto mb-0.5" />
                    <div className="text-xs font-bold text-slate-900">{dd.dueDiligence.customsData.score}/10</div>
                    <div className="text-xs text-slate-600">海关数据</div>
                  </div>
                </div>
              )}

              {/* 详细信息 */}
              {dd.dueDiligence.totalScore > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <p className="text-slate-600 mb-0.5">企业资质:</p>
                    <p className="text-slate-900">成立{dd.dueDiligence.companyInfo.foundedYear}年 • 信用{dd.dueDiligence.companyInfo.credit}</p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <p className="text-slate-600 mb-0.5">商业信誉:</p>
                    <p className="text-slate-900">付款{dd.dueDiligence.reputation.paymentHistory} • 评级{dd.dueDiligence.reputation.creditRating}</p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <p className="text-slate-600 mb-0.5">业务能力:</p>
                    <p className="text-slate-900">年采购{dd.dueDiligence.businessCapacity.annualPurchase} • {dd.dueDiligence.businessCapacity.purchaseCycle}</p>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <p className="text-slate-600 mb-0.5">海关数据:</p>
                    <p className="text-slate-900">{dd.dueDiligence.customsData.importFrequency} • 趋势{dd.dueDiligence.customsData.trend}</p>
                  </div>
                </div>
              )}

              {/* 风险评估和建议 */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs h-4 px-1.5 ${
                    dd.dueDiligence.riskLevel === '极低' || dd.dueDiligence.riskLevel === '低' ? 'bg-green-100 text-green-700 border-green-300' :
                    dd.dueDiligence.riskLevel === '中' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    dd.dueDiligence.riskLevel === '高' ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    风险: {dd.dueDiligence.riskLevel}
                  </Badge>
                  <span className="text-xs text-slate-600">{dd.dueDiligence.recommendation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs h-4 px-1.5 ${
                    dd.nextAction.includes('⚠️') ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-700 border-blue-300'
                  }`}>
                    {dd.nextAction}
                  </Badge>
                  <span className="text-xs text-slate-500">{dd.actionDeadline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-6 px-2 border-slate-300">
          <FileSearch className="size-3 mr-1" />
          查看全部背调报告
        </Button>
      </Card>

      {/* 🎯 BANT资格认证 + 客户分级 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* BANT资格认证 */}
        <Card className="p-2.5 border-slate-300 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">BANT资格认证</h3>
              <p className="text-xs text-slate-500">Budget/Authority/Need/Timeline</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs h-4 px-1.5">
              {bantData.filter((b: any) => b.qualified).length}个已认证
            </Badge>
          </div>

          <div className="space-y-1.5">
            {bantData.map((bant: any, idx: number) => (
              <div key={idx} className={`p-2 rounded border ${
                bant.qualified ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{bant.company}</span>
                    <Badge className={`text-xs h-3.5 px-1 ${
                      bant.qualified ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {bant.qualified ? '✓ 已认证' : '✗ 未通过'}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{bant.totalScore}/40</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div className="text-center p-1 bg-white rounded">
                    <div className="font-bold text-slate-900">{bant.budget.score}/10</div>
                    <div className="text-slate-600">预算</div>
                  </div>
                  <div className="text-center p-1 bg-white rounded">
                    <div className="font-bold text-slate-900">{bant.authority.score}/10</div>
                    <div className="text-slate-600">权限</div>
                  </div>
                  <div className="text-center p-1 bg-white rounded">
                    <div className="font-bold text-slate-900">{bant.need.score}/10</div>
                    <div className="text-slate-600">需求</div>
                  </div>
                  <div className="text-center p-1 bg-white rounded">
                    <div className="font-bold text-slate-900">{bant.timeline.score}/10</div>
                    <div className="text-slate-600">时间</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 客户分级管理 */}
        <Card className="p-2.5 border-slate-300 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">客户分级管理（ABC）</h3>
              <p className="text-xs text-slate-500">Customer Segmentation</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-2">
            <p className="text-xs font-semibold text-slate-700">现有客户</p>
            {segmentation.segments.map((seg: any, idx: number) => (
              <div key={idx} className={`p-2 rounded border bg-${seg.color}-50 border-${seg.color}-300`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{seg.tier}</span>
                    <Badge className={`text-xs h-3.5 px-1 bg-${seg.color}-100 text-${seg.color}-700 border-${seg.color}-300`}>
                      {seg.count}个
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-orange-600">${(seg.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{seg.criteria}</span>
                  <span>{seg.percentage}%占比</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700">潜在客户</p>
            {segmentation.leads.map((lead: any, idx: number) => (
              <div key={idx} className={`p-2 rounded border bg-${lead.color}-50 border-${lead.color}-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{lead.tier}</span>
                    <Badge className={`text-xs h-3.5 px-1 bg-${lead.color}-100 text-${lead.color}-700 border-${lead.color}-300`}>
                      {lead.count}个
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-600">{lead.action}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ⏰ 客户开发行动清单 */}
      <Card className="p-2.5 border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">客户开发行动清单</h3>
            <p className="text-xs text-slate-500">Development Action Timeline</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {actionTimeline.map((timeline: any, idx: number) => (
            <div key={idx} className={`p-2 rounded border ${
              timeline.priority === 'urgent' ? 'bg-red-50 border-red-300' :
              timeline.priority === 'high' ? 'bg-orange-50 border-orange-300' :
              timeline.priority === 'medium' ? 'bg-blue-50 border-blue-300' :
              'bg-slate-50 border-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <Clock className={`size-4 ${
                  timeline.priority === 'urgent' ? 'text-red-600' :
                  timeline.priority === 'high' ? 'text-orange-600' :
                  timeline.priority === 'medium' ? 'text-blue-600' :
                  'text-slate-600'
                }`} />
                <Badge className={`text-xs h-3.5 px-1 ${
                  timeline.priority === 'urgent' ? 'bg-red-500 text-white' :
                  timeline.priority === 'high' ? 'bg-orange-500 text-white' :
                  timeline.priority === 'medium' ? 'bg-blue-500 text-white' :
                  'bg-slate-500 text-white'
                }`}>
                  {timeline.count}项
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">{timeline.timeframe}</h4>
              <ul className="space-y-0.5 text-xs text-slate-600">
                {timeline.actions.map((action: string, aidx: number) => (
                  <li key={aidx} className="flex items-start gap-1">
                    <span className="text-orange-600">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 🎯 客户类型业务指标 */}
      <Card className="p-2.5 border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">客户类型业务指标</h3>
            <p className="text-xs text-slate-500">Customer Type Metrics</p>
          </div>
        </div>

        <div className="space-y-2">
          {customerTypeMetrics.types.map((type: any, idx: number) => (
            <div key={idx} className={`p-2 rounded border bg-${type.color}-50 border-${type.color}-300`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <type.icon className="size-3.5 text-${type.color}-600 mx-auto mb-0.5" />
                  <span className="text-xs font-semibold text-slate-900">{type.label}</span>
                  <Badge className={`text-xs h-3.5 px-1 bg-${type.color}-100 text-${type.color}-700 border-${type.color}-300`}>
                    {type.count}个
                  </Badge>
                </div>
                <span className="text-xs font-bold text-orange-600">${(type.revenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>平均订单值: ${(type.avgOrderValue / 1000).toFixed(0)}K</span>
                <span>订单数: {type.orders}</span>
                <span>增长: {type.growth.toFixed(1)}%</span>
                <span>转化率: {type.conversionRate.toFixed(1)}%</span>
                <span>复购率: {type.repeatRate.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                业务类型: {type.businessTypes.join(', ')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                主要客户: {type.topClients.join(', ')}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1 text-xs">
          <div className="text-center">
            <p className="text-slate-600">业务类型分布</p>
            {customerTypeMetrics.businessTypeDistribution.map((bt: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between mt-1">
                <span className="text-slate-900">{bt.type}</span>
                <span className="text-slate-600">{bt.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-slate-600">主要客户类型</p>
            {customerTypeMetrics.types.map((type: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between mt-1">
                <type.icon className="size-3.5 text-${type.color}-600 mx-auto mb-0.5" />
                <span className="text-slate-900">{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}