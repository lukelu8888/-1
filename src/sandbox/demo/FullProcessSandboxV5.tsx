// =============================================================================
// ⚠️  SANDBOX / DEMO FILE — NOT PART OF THE REAL ERP SYSTEM
// =============================================================================
//
// File    : FullProcessSandboxV5.tsx
// Location: src/sandbox/demo/
//
// PURPOSE
//   This file is a visual workflow sandbox used to illustrate the full
//   end-to-end B2B procurement process across 18 stages and 122 steps.
//   It is a standalone, self-contained UI demonstration with NO connection
//   to any real ERP business logic, backend services, or production database.
//
// WHAT THIS FILE IS
//   - A swimlane diagram renderer for workflow visualization
//   - A read-only interactive demo page accessible from the Admin sidebar
//   - A training / onboarding aid for understanding the overall process flow
//
// WHAT THIS FILE IS NOT
//   - NOT connected to any React business Context
//     (OrderContext, InquiryContext, SalesContractContext, etc.)
//   - NOT calling any Supabase table (zero supabase.from / supabase.rpc calls)
//   - NOT invoking any ERP service object
//     (contractService, orderService, approvalService, etc.)
//   - NOT emitting any ERP events (emitErpEvent is not called)
//   - NOT modifying any real business state or database records
//   - NOT a reference implementation for real ERP modules
//
// DATA
//   All step data is static mock data defined inline in this file.
//   The only external write is to localStorage with the key prefix
//   "fullProcessDemoV5_" to persist UI state (zoom, pan, pinned step).
//   initSupplierStore() and initCustomerSalesRepMapping() initialize
//   mock/test data in localStorage only — they do NOT write to Supabase.
//
// DO NOT
//   - Import this file from any real ERP business component or context
//   - Use this file as a template for real workflow or business logic
//   - Assume that data shown here reflects real database schema or API contracts
//
// =============================================================================
//
// Original demo content: Full Process Demo V5.2 — Swimlane Layout
// 18 stages, 122 steps, complete B2B procurement cycle visualization
// Last updated: 2026-01-01 V5.2 Complete
//
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  Plus,
  Trash2,
  Bell,
  FileText,
  Users,
  ArrowRight,
  Lock,
  Hash,
} from 'lucide-react';

// 导入通知语言工具函数
import { 
  generateNotificationMessage, 
  stepNotificationTitles
} from '../../lib/notification-language';

// 导入通知规则智能匹配系统
import {
  personnelList,
  getRecommendedRecipients,
  groupPersonnelByRegionAndRole,
  findPersonnelByName,
  getWorkloadLevel,
  getRecommendedSalesRep,
  getRecommendedRecipientsGrouped,
  getAllPersonnelWithSuppliers,
  groupPersonnelByRole,
  findPersonnelByNameWithSuppliers,
  type Personnel,
  type Region
} from '../../lib/notification-rules';

// 🔥 导入供应商库系统
import { initSupplierStore } from '../../lib/supplier-store';

// 🔥 导入客户-业务员关系库系统
import { 
  initCustomerSalesRepMapping,
  routeToSalesRep,
  getRecommendedRecipientsForStep1,
  getMappingSummary
} from '../../lib/customer-salesrep-mapping';

// 🔥 导入步骤1智能推荐组件
import { Step1SmartRecommendation } from '../../components/demo/Step1SmartRecommendation';

// 定义步骤接口
interface Step {
  id: number;
  role: string;
  stageId: number;
  stageName: string;
  title: string;
  action: string;
  time: string;
  nextStepId?: number;
  // 🔥 新增：状态信息
  status?: StepStatus;
  statusDetails?: StatusDetails;
  // 🔥 新增：表单编号
  documentNo?: string;
  documentType?: string; // 表单类型标识
}

// 🔥 步骤状态类型
interface StepStatus {
  type: 'draft' | 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'warning' | 'blocked' | 'partial';
  label: string;
  icon: string;
  color: string;
}

// 🔥 状态详情
interface StatusDetails {
  operator?: string;          // 操作人
  completedTime?: string;     // 完成时间
  progress?: number;          // 进度百分比（0-100）
  amount?: string;            // 金额
  quantity?: string;          // 数量
  location?: string;          // 位置（物流用）
  attachments?: string[];     // 附件
  remarks?: string;           // 备注
  // 🔥 新增：多维度业务字段状态
  fields?: StatusField[];     // 各个业务字段的状态
  // 🔥 新增：通知信息
  notification?: {
    message: string;          // 通知消息（中文）
    messageEn?: string;       // 通知消息（英文）
    notifier: string;         // 通知方
    notifierEn?: string;      // 通知方（英文）
    recipients?: string[];    // 接收方列表
    isSaved?: boolean;        // 🔥 是否已保存通知规则
    isRecommended?: boolean;  // 🔥 是否使用了智能推荐
  };
}

// 🔥 业务字段状态
interface StatusField {
  label: string;              // 字段名称（中文）
  labelEn?: string;           // 字段名称（英文）
  value: string;              // 字段值（中文）
  valueEn?: string;           // 字段值（英文）
  status?: 'pending' | 'completed' | 'uploaded' | 'waiting' | 'paid' | 'approved' | 'rejected' | 'processing' | 'confirmed';
  statusLabel?: string;       // 状态标签（中文）
  statusLabelEn?: string;     // 状态标签（英文）
  statusColor?: string;       // 状态颜色
  icon?: string;              // 字段图标
}

// 🔥 预定义状态配置
const statusConfig: Record<string, StepStatus> = {
  completed: { type: 'completed', label: '已完成', icon: '✅', color: '#10B981' },
  approved: { type: 'approved', label: '已批准', icon: '✓', color: '#22C55E' },
  in_progress: { type: 'in_progress', label: '进行中', icon: '⏳', color: '#F59E0B' },
  pending: { type: 'pending', label: '待处理', icon: '⏱️', color: '#6B7280' },
  rejected: { type: 'rejected', label: '已驳回', icon: '❌', color: '#EF4444' },
  warning: { type: 'warning', label: '需注意', icon: '⚠️', color: '#F97316' },
  blocked: { type: 'blocked', label: '已阻塞', icon: '🚫', color: '#DC2626' },
  draft: { type: 'draft', label: '草稿', icon: '📝', color: '#9CA3AF' },
  partial: { type: 'partial', label: '部分完成', icon: '◐', color: '#3B82F6' },
};

// 🔥 表单编号规则配置
const documentTypeConfig: Record<string, { 
  prefix: string; 
  name: string; 
  nameEn: string;
  color: string; 
  icon: string;
  category: 'sales' | 'procurement' | 'logistics' | 'customs' | 'finance';
  description: string;
}> = {
  'INQ': { prefix: 'INQ', name: '客户询价单', nameEn: 'Customer Inquiry', color: '#8B5CF6', icon: '📝', category: 'sales', description: '客户通过Portal提交的产品询价' },
  'QT': { prefix: 'QT', name: '报价单', nameEn: 'Quotation', color: '#10B981', icon: '💰', category: 'sales', description: '业务员向客户提供的正式报价' },
  'PI': { prefix: 'PI', name: '形式发票', nameEn: 'Proforma Invoice', color: '#06B6D4', icon: '📄', category: 'sales', description: '用于客户预付款的形式发票' },
  'SC': { prefix: 'SC', name: '销售合同', nameEn: 'Sales Contract', color: '#3B82F6', icon: '📋', category: 'sales', description: '与客户签订的外贸销售合同' },
  'CG': { prefix: 'CG', name: '采购合同', nameEn: 'Procurement Contract', color: '#F59E0B', icon: '📦', category: 'procurement', description: '与供应商签订的采购合同' },
  'PO': { prefix: 'PO', name: '采购订单', nameEn: 'Purchase Order', color: '#EAB308', icon: '🛒', category: 'procurement', description: '向供应商下达的采购订单' },
  'CI': { prefix: 'CI', name: '商业发票', nameEn: 'Commercial Invoice', color: '#14B8A6', icon: '💵', category: 'customs', description: '报关和结汇用的商业发票' },
  'PL': { prefix: 'PL', name: '装箱清单', nameEn: 'Packing List', color: '#0891B2', icon: '📦', category: 'logistics', description: '货物装箱明细清单' },
  'BL': { prefix: 'BL', name: '提单', nameEn: 'Bill of Lading', color: '#64748B', icon: '🚢', category: 'logistics', description: '货代签发的海运提单' },
  'CD': { prefix: 'CD', name: '报关单', nameEn: 'Customs Declaration', color: '#DC2626', icon: '🛂', category: 'customs', description: '海关申报单据' },
  'CO': { prefix: 'CO', name: '原产地证', nameEn: 'Certificate of Origin', color: '#22C55E', icon: '📜', category: 'customs', description: '商检机构出具的原产地证明' },
  'INS': { prefix: 'INS', name: '保险单', nameEn: 'Insurance Policy', color: '#F97316', icon: '🛡️', category: 'finance', description: '货运保险单据' },
};

// 🔥 区域代码映射（三大市场）
const regionCodeMap: Record<string, string> = {
  'NA': 'NA',   // North America 北美
  'SA': 'SA',   // South America 南美
  'EA': 'EA',   // Europe & Africa 欧非
  'DOM': 'DOM', // Domestic 国内
  'XMN': 'XMN', // Xiamen 厦门（报关港口）
  'GZ': 'GZ',   // Guangzhou 广州
  'SH': 'SH',   // Shanghai 上海
};

// 🔥 编号规则逻辑体系（完整业务逻辑）
/**
 * 编号格式：[类型前缀]-[区域/部门代码]-[年月]-[流水号]
 * 
 * 逻辑说明：
 * 1. 类型前缀（2-3位）：标识单据类型，符合国际惯例
 *    - INQ/QT/SC：销售类单据
 *    - CG：采购合同类单据
 *    - PO：采购订单
 *    - CI/PL/BL：物流类单据
 *    - CD/CO：报关类单据
 * 
 * 2. 区域/部门代码（2-3位）：业务归属和管理维度
 *    - NA/SA/EA：外销三大区域（对应Customer Portal）
 *    - DOM：国内采购（对应Supplier Portal）
 *    - XMN/GZ/SH：报关港口（厦门/广州/上海）
 * 
 * 3. 年月（4位）：单据创建年月，YYMM格式
 *    - 2412：2024年12月
 *    - 2512：2025年12月
 * 
 * 4. 流水号（4位）：按业务顺序递增，确保唯一性
 *    - 0001-9999：支持每年每月每区域9999笔业务
 * 
 * 示例：
 * - INQ-NA-2512-0001：2025年12月北美区域第1笔客户询价
 * - SC-NA-2512-0016：2025年12月北美区域第16笔销售合同
 * - CG-DOM-2512-0026：2025年12月国内采购第26笔采购合同
 * - CD-XMN-2512-0083：2025年12月厦门港第83笔报关单
 */
const generateDocumentNo = (
  documentType: string, 
  stepId: number, 
  region: string = 'NA', // 默认北美区域
  year: number = 2025    // 默认2025年
): string => {
  const config = documentTypeConfig[documentType];
  if (!config) return '';
  
  // 根据单据类别自动选择区域代码
  let regionCode = region;
  
  // 业务逻辑：根据单据类别自动分配区域
  if (config.category === 'procurement') {
    // 采购类单据 → 国内供应商
    regionCode = 'DOM';
  } else if (config.category === 'customs' && documentType === 'CD') {
    // 报关单 → 厦门港（福建高盛达位于福建）
    regionCode = 'XMN';
  } else if (config.category === 'logistics' && documentType === 'BL') {
    // 提单 → 厦门港
    regionCode = 'XMN';
  } else if (config.category === 'customs' && documentType === 'CO') {
    // 原产地证 → 厦门商检局
    regionCode = 'XMN';
  }
  
  // 流水号：基于stepId确保稳定性，4位数字
  const seq = String(stepId).padStart(4, '0');
  
  // 年份格式：YYMM（两位年份+两位月份）
  const yearMonth = `${String(year).slice(-2)}12`; // 2025 -> 2512
  
  // 完整编号：[类型]-[区域]-[年份]-[流水号]
  return `${config.prefix}-${regionCode}-${yearMonth}-${seq}`;
};

// 角色配置（14个核心角色）
const roles = [
  { id: 'customer', name: '客户', color: '#8B5CF6', icon: '👤' },
  { id: 'sales', name: '业务员', color: '#10B981', icon: '💼' },
  { id: 'regional_manager', name: '区域业务主管', color: '#06B6D4', icon: '👨‍💼' },
  { id: 'sales_director', name: '销售总监', color: '#EF4444', icon: '👔' },
  { id: 'procurement', name: '采购员', color: '#F59E0B', icon: '📦' },
  { id: 'supplier', name: '供应商', color: '#EAB308', icon: '🏭' },
  { id: 'finance', name: '财务专员', color: '#3B82F6', icon: '💰' },
  { id: 'finance_director', name: '财务总监', color: '#DC2626', icon: '💵' },
  { id: 'qc', name: '验货员', color: '#14B8A6', icon: '🔍' },
  { id: 'inspection', name: '商检机构', color: '#6B7280', icon: '📋' },
  { id: 'forwarder', name: '货代', color: '#0891B2', icon: '🚢' },
  { id: 'truck_company', name: '拖车公司', color: '#71717A', icon: '🚛' },
  { id: 'customs_broker', name: '报关行', color: '#64748B', icon: '📄' },
  { id: 'customs', name: '海关', color: '#DC2626', icon: '🛂' },
];

// 角色名称映射（14个核心角色）
const roleNameMap: Record<string, string> = {
  '客户': 'customer',
  '业务员': 'sales',
  '区域业务主管': 'regional_manager',
  '销售总监': 'sales_director',
  '采购员': 'procurement',
  '供应商': 'supplier',
  '财务专员': 'finance',
  '财务总监': 'finance_director',
  '验货员': 'qc',
  '商检机构': 'inspection',
  '货代': 'forwarder',
  '拖车公司': 'truck_company',
  '报关行': 'customs_broker',
  '海关': 'customs',
};

// 🔥 按角色分类的人员列表（用于通知选择器 - 14个核心角色）
const personnelByRole: Record<string, { name: string; nameEn: string; region?: string }[]> = {
  '客户': [
    { name: 'ABC Building Supplies', nameEn: 'ABC Building Supplies', region: 'NA' },
    { name: 'Brasil Construction Co.', nameEn: 'Brasil Construction Co.', region: 'SA' },
    { name: 'Europa Trading GmbH', nameEn: 'Europa Trading GmbH', region: 'EA' },
  ],
  '老板': [
    { name: '张明', nameEn: 'Zhang Ming' },
  ],
  '财务总监': [
    { name: '李华', nameEn: 'Li Hua' },
  ],
  '销售总监': [
    { name: '王强', nameEn: 'Wang Qiang' },
  ],
  '区域业务主管': [
    { name: '刘建国', nameEn: 'Liu Jianguo', region: 'NA' },
    { name: '陈明华', nameEn: 'Chen Minghua', region: 'SA' },
    { name: '赵国强', nameEn: 'Zhao Guoqiang', region: 'EA' },
  ],
  '业务员': [
    { name: '张伟', nameEn: 'Zhang Wei', region: 'NA' },
    { name: '李芳', nameEn: 'Li Fang', region: 'SA' },
    { name: '王芳', nameEn: 'Wang Fang', region: 'EA' },
  ],
  '财务': [
    { name: '赵敏', nameEn: 'Zhao Min' },
  ],
  '采购': [
    { name: '刘刚', nameEn: 'Liu Gang' },
  ],
  '运营专员': [
    { name: '李娜', nameEn: 'Li Na' },
  ],
  '系统管理员': [
    { name: '系统管理员', nameEn: 'System Admin' },
  ],
  '供应商': [
    { name: '福建XX建材', nameEn: 'Fujian XX Materials' },
    { name: '广东YY五金', nameEn: 'Guangdong YY Hardware' },
  ],
  '验货员': [
    { name: '吴师傅', nameEn: 'Wu Master' },
  ],
  '商检机构': [
    { name: '厦门商检局', nameEn: 'Xiamen CIQ' },
  ],
  '货代': [
    { name: '远航国际货运', nameEn: 'Yuanhang Freight' },
  ],
  '拖车公司': [
    { name: '顺通拖车', nameEn: 'Shuntong Trucking' },
  ],
  '报关行': [
    { name: '厦门报关行', nameEn: 'Xiamen Customs Broker' },
  ],
  '海关': [
    { name: '厦门海关', nameEn: 'Xiamen Customs' },
  ],
};

// 阶段配置（🔥 V5.2更新：18个阶段，122个步骤）
const stages = [
  { id: 1, name: '询价报价', color: '#3B82F6', stepCount: 16 },
  { id: 2, name: '销售合同', color: '#8B5CF6', stepCount: 11 },
  { id: 3, name: '采购合同', color: '#F59E0B', stepCount: 12 },
  { id: 4, name: '生产质检', color: '#10B981', stepCount: 9 },
  { id: 5, name: '验货完货', color: '#EF4444', stepCount: 4 },
  { id: 6, name: '尾款催收', color: '#EC4899', stepCount: 11 },
  { id: 7, name: '商检订舱', color: '#6366F1', stepCount: 10 },
  { id: 8, name: '拖车装柜', color: '#FBBF24', stepCount: 8 },
  { id: 9, name: '装柜报关', color: '#14B8A6', stepCount: 5 },
  { id: 10, name: '报关开船', color: '#A855F7', stepCount: 5 },
  { id: 11, name: '海运跟踪', color: '#14B8A6', stepCount: 5 },
  { id: 12, name: '到港清关', color: '#3B82F6', stepCount: 6 },
  { id: 13, name: '客户验货', color: '#F59E0B', stepCount: 4 },
  { id: 14, name: '海运追踪API', color: '#06B6D4', stepCount: 3 }, // 🔥 API物流追踪功能
  { id: 15, name: '开票归档', color: '#8B5CF6', stepCount: 3 },
  { id: 16, name: '到港清关II', color: '#10B981', stepCount: 3 },
  { id: 17, name: '清关单证', color: '#EC4899', stepCount: 2 },
  { id: 18, name: '清关反馈', color: '#22C55E', stepCount: 5 }, // 🎊 完整闭环
];

// 🔥 导出步骤数据供Enhanced版本使用
export const getAllSteps = (statusConfig: Record<string, StepStatus>): Step[] => [
    // 阶段1：询价报价（1-16）
    { 
      id: 1, role: '客户', stageId: 1, stageName: '询价报价', title: '发起询盘', action: '在后台发起询盘', time: '12-04 09:00', nextStepId: 2,
      documentType: 'INQ',
      documentNo: 'INQ-NA-2512-0001',
      status: statusConfig.completed,
      statusDetails: { 
        operator: 'ABC Building Supplies', 
        completedTime: '2025-12-04 09:00', 
        quantity: '5000件', 
        remarks: '紧急订单',
        leadTime: '45天',
        priority: '高优先级',
        fields: [
          { label: '序号', labelEn: 'Seq.#', value: '1', valueEn: '1', icon: '🔢' },
          { label: '型号', labelEn: 'Model No.', value: 'ES-2024', valueEn: 'ES-2024', icon: '🔖' },
          { label: '产品名称', labelEn: 'Item Name', value: '电气配件', valueEn: 'Electrical Accessories', icon: '🔌' },
          { label: '货物描述', labelEn: 'Description of Goods', value: '工业级电气开关配件', valueEn: 'Industrial Grade Electrical Switch Accessories', icon: '📝' },
          { label: '数量', labelEn: 'Quantity', value: '5000件', valueEn: '5000', icon: '📦' },
          { label: '单位', labelEn: 'Unit', value: '件', valueEn: 'pieces', icon: '📦' },
          { label: '单价', labelEn: 'Unit Price', value: '-', valueEn: 'TBD', icon: '💵' },
          { label: '金额', labelEn: 'Total Amount', value: '-', valueEn: 'TBD', icon: '💰' }
        ],
        notification: {
          message: '',
          messageEn: '',
          notifier: '', // 将自动使用operator
          recipients: [] // 空数组，等待用户选择通知人后自动推荐
        }
      }
    },
    { 
      id: 2, role: '业务员', stageId: 1, stageName: '询价报价', title: '收到询盘', action: '收到客户询盘', time: '12-04 09:15', nextStepId: 3,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '张伟', 
        completedTime: '2025-12-04 09:15', 
        remarks: '已分配给采购部',
        fields: [
          { label: '询盘审核', value: '已审核', status: 'completed', statusLabel: '已审核', statusColor: '#10B981', icon: '👀' },
          { label: '客户评级', value: 'A级客户', status: 'confirmed', statusLabel: '优质客户', statusColor: '#22C55E', icon: '⭐' },
          { label: '负责业务员', value: '张伟', icon: '💼' },
          { label: '分配状态', value: '已分配采购部', status: 'completed', statusLabel: '已分配', statusColor: '#10B981', icon: '✅' }
        ],
        notification: {
          message: '已通知采购员刘刚处理询价请求',
          messageEn: 'Procurement Officer Liu Gang has been notified to process the inquiry request.',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 3, role: '业务员', stageId: 1, stageName: '询价报价', title: '生成成本询报', action: '生成成本询报（QR）并下推给采购员', time: '12-04 09:30', nextStepId: 4,
      documentType: 'QR',
      documentNo: 'QR-NA-2512-0001',
      status: statusConfig.completed,
      statusDetails: { 
        operator: '张伟', 
        completedTime: '2025-12-04 09:30', 
        attachments: ['cost_inquiry_QR-NA-2512-0001.pdf'],
        fields: [
          { label: '成本询报单号', labelEn: 'Cost Inquiry No.', value: 'QR-NA-2512-0001', valueEn: 'QR-NA-2512-0001', icon: '📄' },
          { label: '询报状态', value: '已生成并下推', status: 'completed', statusLabel: '已下推', statusColor: '#10B981', icon: '📄' },
          { label: '产品需求', value: '电气配件 5000件', icon: '📦' },
          { label: '交期需求', value: '45天内', icon: '📅' },
          { label: '下推对象', value: '采购员刘刚', icon: '👤' }
        ],
        notification: {
          message: '已生成成本询报单QR-NA-2512-0001并下推给采购员刘刚',
          messageEn: 'Cost inquiry QR-NA-2512-0001 created and pushed to Procurement Officer Liu Gang.',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 4, role: '采购员', stageId: 1, stageName: '询价报价', title: '收到成本询报', action: '收到成本询报并准备生成采购询价单', time: '12-04 09:45', nextStepId: 5,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '刘刚', 
        completedTime: '2025-12-04 09:45',
        fields: [
          { label: '成本询报单号', value: 'QR-NA-2512-0001', icon: '📄' },
          { label: '接收状态', value: '已接收', status: 'completed', statusLabel: '已接收', statusColor: '#10B981', icon: '📬' },
          { label: '优先级', value: '高优先级', status: 'waiting', statusLabel: '紧急', statusColor: '#F97316', icon: '⚡' },
          { label: '下一步', value: '生成采购询价单（XJ）', icon: '📝' }
        ],
        notification: {
          message: '已接收成本询报QR-NA-2512-0001，准备生成采购询价单',
          notifier: '采购员刘刚'
        }
      }
    },
    { 
      id: 5, role: '采购员', stageId: 1, stageName: '询价报价', title: '生成采购询价单', action: '生成采购询价单（XJ）并发给供应商', time: '12-04 10:00', nextStepId: 6,
      documentType: 'XJ',
      documentNo: 'XJ-NA-2512-0001',
      status: statusConfig.completed,
      statusDetails: { 
        operator: '刘刚', 
        completedTime: '2025-12-04 10:00', 
        quantity: '5000件', 
        remarks: '已向3家供应商发送采购询价',
        fields: [
          { label: '采购询价单号', labelEn: 'Purchase Inquiry No.', value: 'XJ-NA-2512-0001', valueEn: 'XJ-NA-2512-0001', icon: '📄' },
          { label: '关联成本询报', value: 'QR-NA-2512-0001', icon: '🔗' },
          { label: '询价供应商数', value: '3家（福建XX、广东YY、浙江ZZ）', icon: '🏭' },
          { label: '询价数量', value: '5000件', icon: '📦' },
          { label: '发送状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '✅' }
        ],
        notification: {
          message: '已生成采购询价单XJ-NA-2512-0001，向福建XX等3家供应商发送询价请求',
          messageEn: 'Purchase inquiry XJ-NA-2512-0001 created. Inquiry requests sent to 3 suppliers including Fujian XX.',
          notifier: '采购员刘刚',
          notifierEn: 'Procurement Officer Liu Gang',
          recipients: ['供应商福建XX', '供应商广东YY', '供应商浙江ZZ']
        }
      }
    },
    { 
      id: 6, role: '供应商', stageId: 1, stageName: '询价报价', title: '收到采购询价单', action: '收到采购询价单（XJ）', time: '12-04 10:30', nextStepId: 7,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '福建XX制造有限公司', 
        completedTime: '2025-12-04 10:30',
        fields: [
          { label: '采购询价单号', value: 'XJ-NA-2512-0001', icon: '📄' },
          { label: '接收状态', value: '已接收', status: 'completed', statusLabel: '已接收', statusColor: '#10B981', icon: '📬' },
          { label: '产品类型', value: '电气配件', icon: '🔌' },
          { label: '数量', value: '5000件', icon: '📦' },
          { label: '下一步', value: '生成报价单（BJ）', icon: '📝' }
        ],
        notification: {
          message: '已收到采购询价单XJ-NA-2512-0001，正在准备报价单',
          messageEn: 'Purchase inquiry XJ-NA-2512-0001 received, preparing quotation.',
          notifier: '供应商福建XX',
          notifierEn: 'Supplier Fujian XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 7, role: '供应商', stageId: 1, stageName: '询价报价', title: '生成报价单', action: '生成报价单（BJ）并给采购员报价', time: '12-04 14:30', nextStepId: 8,
      documentType: 'BJ',
      documentNo: 'BJ-FJXX-2512-0001',
      status: statusConfig.completed,
      statusDetails: { 
        operator: '福建XX制造有限公司', 
        completedTime: '2025-12-04 14:30', 
        amount: '$8.50/件', 
        quantity: '5000件', 
        attachments: ['supplier_quotation_BJ-FJXX-2512-0001.pdf'],
        fields: [
          { label: '供应商报价单号', labelEn: 'Supplier Quote No.', value: 'BJ-FJXX-2512-0001', valueEn: 'BJ-FJXX-2512-0001', icon: '📄' },
          { label: '关联采购询价', value: 'XJ-NA-2512-0001', icon: '🔗' },
          { label: '报价状态', value: '已报价', status: 'completed', statusLabel: '已报价', statusColor: '#10B981', icon: '💵' },
          { label: '单价', value: '$8.50/件', icon: '💰' },
          { label: '总金额', value: '$42,500', icon: '💵' },
          { label: '交期', value: '15天', icon: '📅' },
          { label: '有效期', value: '30天', icon: '⏳' }
        ],
        notification: {
          message: '已生成报价单BJ-FJXX-2512-0001，向采购员提交报价$8.50/件',
          messageEn: 'Quotation BJ-FJXX-2512-0001 created. Quote of $8.50/piece submitted to procurement officer.',
          notifier: '供应商福建XX',
          notifierEn: 'Supplier Fujian XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 8, role: '采购员', stageId: 1, stageName: '询价报价', title: '收到供应商报价', action: '收到3家供应商报价单（BJ）', time: '12-04 14:45', nextStepId: 9,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '刘刚', 
        completedTime: '2025-12-04 14:45', 
        remarks: '已收到3家报价，择优福建XX制造',
        fields: [
          { label: '福建XX报价', value: 'BJ-FJXX-2512-0001：$8.50/件', status: 'approved', statusLabel: '最优', statusColor: '#22C55E', icon: '⭐' },
          { label: '广东YY报价', value: 'BJ-GDYY-2512-0001：$8.80/件', icon: '💰' },
          { label: '浙江ZZ报价', value: 'BJ-ZJZZ-2512-0001：$9.00/件', icon: '💰' },
          { label: '比价结果', value: '福建XX最优', status: 'approved', statusLabel: '已选择', statusColor: '#22C55E', icon: '✅' },
          { label: '供应商评级', value: 'A级（质量可靠）', status: 'confirmed', statusLabel: '优质', statusColor: '#22C55E', icon: '⭐' },
          { label: '下一步', value: '在QR表单上反馈成本价', icon: '📝' }
        ],
        notification: {
          message: '已完成3家供应商比价，选定福建XX制造（$8.50/件），准备在QR表单上反馈',
          notifier: '采购员刘刚',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 9, role: '采购员', stageId: 1, stageName: '询价报价', title: '在QR表单上反馈', action: '对比多家报价并在QR表单上反馈成本价和建议', time: '12-04 15:30', nextStepId: 10,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '刘刚', 
        completedTime: '2025-12-04 15:30', 
        amount: '$8.50/件', 
        remarks: '已在QR-NA-2512-0001表单上反馈',
        fields: [
          { label: '反馈载体', value: 'QR-NA-2512-0001成本询报表单', status: 'completed', statusLabel: '已反馈', statusColor: '#10B981', icon: '📄' },
          { label: '推荐供应商', value: '福建XX制造（A级）', status: 'approved', statusLabel: '推荐', statusColor: '#22C55E', icon: '⭐' },
          { label: '推荐成本价', value: '$8.50/件（含运费到仓）', icon: '💵' },
          { label: '备选供应商', value: '广东YY（$8.80/件）', icon: '💰' },
          { label: '生产周期', value: '15天', icon: '📅' },
          { label: '质量评估', value: '质量可靠，长期合作', icon: '✅' },
          { label: '采购建议', value: '价格合理，建议下单', icon: '💬' }
        ],
        notification: {
          message: '已在QR-NA-2512-0001表单上反馈：推荐福建XX制造，成本价$8.50/件，质量可靠',
          notifier: '采购员刘刚',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 10, role: '业务员', stageId: 1, stageName: '询价报价', title: '收到QR表单反馈', action: '收到QR表单上的成本价和建议', time: '12-04 15:45', nextStepId: 11,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '张伟', 
        completedTime: '2025-12-04 15:45', 
        amount: '$8.50/件',
        fields: [
          { label: 'QR成本询报单', value: 'QR-NA-2512-0001', icon: '📄' },
          { label: '采购员反馈', value: '已查看采购员刘刚的反馈', status: 'completed', statusLabel: '已查看', statusColor: '#10B981', icon: '👁️' },
          { label: '推荐供应商', value: '福建XX制造（A级）', icon: '⭐' },
          { label: '推荐成本价', value: '$8.50/件', status: 'confirmed', statusLabel: '已确认', statusColor: '#10B981', icon: '✅' },
          { label: '采购建议', value: '质量可靠，建议下单', icon: '💬' },
          { label: '目标售价', value: '$12.50/件（加价47%）', icon: '💰' },
          { label: '预计利润率', value: '47%', status: 'approved', statusLabel: '合理', statusColor: '#22C55E', icon: '📈' }
        ],
        notification: {
          message: '已从QR-NA-2512-0001表单收到采购员反馈：成本价$8.50/件，准备制作客户报价单',
          notifier: '业务员张伟'
        }
      }
    },
    { 
      id: 11, role: '业务员', stageId: 1, stageName: '询价报价', title: '填写报价', action: '填写给客户报价单', time: '12-04 16:30', nextStepId: 12,
      documentType: 'QT',
      documentNo: generateDocumentNo('QT', 11),
      status: statusConfig.completed,
      statusDetails: { 
        operator: '张伟', 
        completedTime: '2025-12-04 16:30', 
        amount: '$62,500', 
        quantity: '5000件', 
        remarks: '加价47%利润率，待销售总监审核',
        fields: [
          // 🔥 报价单产品明细（标准格式，与INQ对应）
          { label: '序号', labelEn: 'Seq.#', value: '1', valueEn: '1', icon: '🔢' },
          { label: '型号', labelEn: 'Model No.', value: 'ES-2024', valueEn: 'ES-2024', icon: '🔖' },
          { label: '产品名称', labelEn: 'Item Name', value: '电气配件', valueEn: 'Electrical Accessories', icon: '🔌' },
          { label: '货物描述', labelEn: 'Description of Goods', value: '工业级电气开关配件', valueEn: 'Industrial Grade Electrical Switch Accessories', icon: '📝' },
          { label: '数量', labelEn: 'Quantity', value: '5000', valueEn: '5000', icon: '📦' },
          { label: '单位', labelEn: 'Unit', value: '件', valueEn: 'pcs', icon: '📦' },
          { label: '单价', labelEn: 'Unit Price', value: '$12.50', valueEn: '$12.50', icon: '💵' },
          { label: '金额', labelEn: 'Total Amount', value: '$62,500', valueEn: '$62,500', icon: '💰' },
          // 🔥 订单级别属性（管理信息）
          { label: '有效期', labelEn: 'Validity', value: '30天', valueEn: '30 days', icon: '📅' },
          { label: '交货期', labelEn: 'Lead Time', value: '45天', valueEn: '45 days', icon: '🚚' },
          { label: '贸易条款', labelEn: 'Trade Terms', value: 'FOB厦门', valueEn: 'FOB Xiamen', icon: '🚢' }
        ],
        notification: {
          message: '已完成报价单草稿，提交销售总监审核',
          messageEn: 'Quotation draft completed, submitted to Sales Director for review',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: []
        }
      }
    },
    { 
      id: 12, role: '区域业务主管', stageId: 1, stageName: '询价报价', title: '区域主管审批报价', action: '审核报价（一审）', time: '12-04 17:00', nextStepId: 13,
      status: statusConfig.approved,
      statusDetails: { 
        operator: '刘建国', 
        completedTime: '2025-12-04 17:00', 
        amount: '$62,500',
        remarks: '价格合理，需总监二审',
        fields: [
          { label: '报价编号', value: 'QT-2025-001234', icon: '📄' },
          { label: '报价金额', value: '$62,500', icon: '💰' },
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '利润率评估', value: '47%合理', status: 'approved', statusLabel: '合格', statusColor: '#22C55E', icon: '📊' },
          { label: '审批意见', value: '价格合理，条款可接受', icon: '💬' },
          { label: '审批人', value: '北美区域主管 - 刘建国', icon: '👔' },
          { label: '审批时间', value: '2025-12-04 17:00', icon: '🕐' },
          { label: '下一步', value: '需销售总监二审（金额≥$20,000）', status: 'pending', statusLabel: '待二审', statusColor: '#F59E0B', icon: '⏭️' }
        ],
        notification: {
          message: '区域主管已审批报价单，金额$62,500≥$20,000，需销售总监二审',
          notifier: '区域主管刘建国',
          recipients: ['销售总监王强']
        }
      }
    },
    { 
      id: 13, role: '销售总监', stageId: 1, stageName: '询价报价', title: '销售总监审批报价', action: '审核报价（二审）', time: '12-04 20:00', nextStepId: 14,
      status: statusConfig.approved,
      statusDetails: {
        operator: '王强',
        completedTime: '2025-12-04 20:00',
        amount: '$62,500',
        fields: [
          { label: '报价编号', value: 'QT-2025-001234', icon: '📄' },
          { label: '报价金额', value: '$62,500', icon: '💰' },
          { label: '一审审批人', value: '刘建国（北美区域主管）', icon: '👤' },
          { label: '一审结果', value: '✅ 通过', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '一审意见', value: '价格合理，条款可接受', icon: '💬' },
          { label: '风险评估', value: '🟡 中等风险', icon: '⚠️' },
          { label: '客户信用', value: '⭐⭐⭐⭐ 优质客户', icon: '🏆' },
          { label: '利润率', value: '47% ✅', icon: '📊' },
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '审批意见', value: '大额报价，利润率合理，同意批准', icon: '💬' },
          { label: '审批人', value: '销售总监 - 王强', icon: '👔' },
          { label: '审批时间', value: '2025-12-04 20:00', icon: '🕐' }
        ],
        notification: {
          message: '销售总监已二审批准报价单，可以发送给客户',
          notifier: '销售总监王强',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 14, role: '业务员', stageId: 1, stageName: '询价报价', title: '收到审批反馈并发送报价', action: '收到总监审批通过，发送报价给客户', time: '12-04 20:30', nextStepId: 15,
      status: statusConfig.completed,
      statusDetails: { 
        operator: '张伟', 
        completedTime: '2025-12-04 20:30', 
        attachments: ['quotation_QT-NA-2512-0001.pdf'],
        fields: [
          { label: '审批结果', value: '✅ 销售总监已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '审批意见', value: '大额报价，利润率合理，同意批准', icon: '💬' },
          { label: '报价单号', value: 'QT-NA-2512-0001', icon: '📄' },
          { label: '发送状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '发送方式', value: '邮件+Portal', icon: '💌' },
          { label: '报价文件', value: 'quotation_QT-NA-2512-0001.pdf', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' }
        ],
        notification: {
          message: '收到销售总监审批通过，已向客户ABC Building Supplies发送报价单QT-NA-2512-0001',
          notifier: '业务员张伟',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 15, role: '客户', stageId: 1, stageName: '询价报价', title: '收到报价', action: '收到业务员报价', time: '12-05 09:00', nextStepId: 16,
      status: statusConfig.completed,
      statusDetails: { 
        operator: 'ABC Building Supplies', 
        completedTime: '2025-12-05 09:00',
        fields: [
          { label: '接收状态', labelEn: 'Receipt Status', value: '已收到', valueEn: 'Received', status: 'completed', statusLabel: '已收到', statusLabelEn: 'Received', statusColor: '#10B981', icon: '📬' },
          { label: '查看状态', labelEn: 'View Status', value: '已查看', valueEn: 'Viewed', status: 'completed', statusLabel: '已查看', statusLabelEn: 'Viewed', statusColor: '#10B981', icon: '👁️' },
          { label: '报价金额', labelEn: 'Quote Amount', value: '$62,500', valueEn: '$62,500', icon: '💰' }
        ],
        notification: {
          message: '报价单已成功送达客户',
          messageEn: 'Quotation successfully delivered',
          notifier: '系统自动通知',
          notifierEn: 'System Notification'
        }
      }
    },
    { 
      id: 16, role: '客户', stageId: 1, stageName: '询价报价', title: '客户反馈报价', action: '客户反馈报价（接受/拒绝/议价）', time: '12-05 10:00', nextStepId: 17,
      status: statusConfig.approved,
      statusDetails: { 
        operator: 'ABC Building Supplies', 
        completedTime: '2025-12-05 10:00', 
        amount: '$62,500', 
        remarks: '客户接受报价（3种选项：接受/拒绝/议价）',
        fields: [
          { label: '报价单号', labelEn: 'Quote No.', value: 'QT-NA-2512-0001', valueEn: 'QT-NA-2512-0001', icon: '📄' },
          { label: '报价金额', labelEn: 'Quote Amount', value: '$62,500', valueEn: '$62,500', icon: '💰' },
          { label: '客户反馈', labelEn: 'Customer Feedback', value: '✅ 接受报价', valueEn: '✅ Accept', status: 'approved', statusLabel: '已接受', statusLabelEn: 'Accepted', statusColor: '#22C55E', icon: '✅' },
          { label: '其他选项', labelEn: 'Other Options', value: '❌ 拒绝报价 / 💬 议价', valueEn: '❌ Reject / 💬 Negotiate', icon: '📋' },
          { label: '订单金额', labelEn: 'Order Amount', value: '$62,500（5000件 × $12.50）', valueEn: '$62,500 (5000 × $12.50)', icon: '💰' },
          { label: '客户备注', labelEn: 'Customer Note', value: '价格可接受，请尽快发送合同', valueEn: 'Price acceptable, please send contract ASAP', icon: '💬' }
        ],
        notification: {
          message: '客户已接受报价QT-NA-2512-0001（$62,500），请准备销售合同',
          messageEn: 'Customer accepted quotation QT-NA-2512-0001 ($62,500), please prepare sales contract',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    
    // 阶段2：销售合同（17-26）
    { 
      id: 17, role: '业务员', stageId: 2, stageName: '销售合同', title: '生成合同', action: '下推生成销售合同', time: '12-05 11:00', nextStepId: 18,
      documentType: 'SC',
      documentNo: generateDocumentNo('SC', 17),
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-05 11:00',
        amount: '$62,500',
        quantity: '5000件',
        remarks: '已生成销售合同，待销售总监审核',
        fields: [
          // 🔥 销售合同产品明细（标准格式，与INQ、QT对应）
          { label: '序号', labelEn: 'Seq.#', value: '1', valueEn: '1', icon: '🔢' },
          { label: '型号', labelEn: 'Model No.', value: 'ES-2024', valueEn: 'ES-2024', icon: '🔖' },
          { label: '产品名称', labelEn: 'Item Name', value: '电气配件', valueEn: 'Electrical Accessories', icon: '🔌' },
          { label: '货物描述', labelEn: 'Description of Goods', value: '工业级电气开关配件', valueEn: 'Industrial Grade Electrical Switch Accessories', icon: '📝' },
          { label: '数量', labelEn: 'Quantity', value: '5000', valueEn: '5000', icon: '📦' },
          { label: '单位', labelEn: 'Unit', value: '件', valueEn: 'pcs', icon: '📦' },
          { label: '单价', labelEn: 'Unit Price', value: '$12.50', valueEn: '$12.50', icon: '💵' },
          { label: '金额', labelEn: 'Total Amount', value: '$62,500', valueEn: '$62,500', icon: '💰' },
          // 🔥 合同级别属性（管理信息）
          { label: '贸易条款', labelEn: 'Trade Terms', value: 'FOB厦门', valueEn: 'FOB Xiamen', icon: '🚢' },
          { label: '付款方式', labelEn: 'Payment Terms', value: '30%定金+70%尾款', valueEn: '30% Deposit + 70% Balance', icon: '💳' },
          { label: '定金金额', labelEn: 'Deposit Amount', value: '$18,750', valueEn: '$18,750', icon: '💵' },
          { label: '尾款金额', labelEn: 'Balance Amount', value: '$43,750', valueEn: '$43,750', icon: '💵' },
          { label: '交货期', labelEn: 'Delivery Time', value: '45天', valueEn: '45 days', icon: '📅' }
        ],
        notification: {
          message: '已提交销售合同给销售总监王总审核',
          messageEn: 'Sales contract submitted to Sales Director Wang for review',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: []
        }
      }
    },
    { 
      id: 18, role: '区域业务主管', stageId: 2, stageName: '销售合同', title: '区域主管审批合同', action: '审核销售合同（一审）', time: '12-05 14:00', nextStepId: 19,
      status: statusConfig.approved,
      statusDetails: {
        operator: '刘建国',
        completedTime: '2025-12-05 14:00',
        amount: '$62,500',
        fields: [
          { label: '合同编号', value: 'SC-2025-001234', icon: '📄' },
          { label: '合同金额', value: '$62,500', icon: '💰' },
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '审核意见', value: '价格合理，条款可接受', icon: '💬' },
          { label: '审批人', value: '北美区域主管 - 刘建国', icon: '👔' },
          { label: '审批时间', value: '2025-12-05 14:00', icon: '🕐' },
          { label: '下一步', value: '需销售总监二审（金额≥$20,000）', status: 'pending', statusLabel: '待二审', statusColor: '#F59E0B', icon: '⏭️' }
        ],
        notification: {
          message: '区域主管已审批销售合同，金额$62,500≥$20,000，需销售总监二审',
          notifier: '区域主管刘建国',
          recipients: ['销售总监王强']
        }
      }
    },
    { 
      id: 19, role: '销售总监', stageId: 2, stageName: '销售合同', title: '销售总监审批合同', action: '审核销售合同（二审）', time: '12-05 17:00', nextStepId: 20,
      status: statusConfig.approved,
      statusDetails: {
        operator: '王强',
        completedTime: '2025-12-05 17:00',
        amount: '$62,500',
        fields: [
          { label: '合同编号', value: 'SC-2025-001234', icon: '📄' },
          { label: '合同金额', value: '$62,500', icon: '💰' },
          { label: '一审审批人', value: '刘建国（北美区域主管）', icon: '👤' },
          { label: '一审结果', value: '✅ 通过', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '一审意见', value: '价格合理，条款可接受', icon: '💬' },
          { label: '风险评估', value: '🟡 中等风险', icon: '⚠️' },
          { label: '客户信用', value: '⭐⭐⭐⭐ 优质客户', icon: '🏆' },
          { label: '利润率', value: '18.5% ✅', icon: '📊' },
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '审批意见', value: '大额合同，风险可控，同意批准', icon: '💬' },
          { label: '审批人', value: '销售总监 - 王强', icon: '👔' },
          { label: '审批时间', value: '2025-12-05 17:00', icon: '🕐' }
        ],
        notification: {
          message: '销售总监已二审批准合同，可以发送给客户',
          notifier: '销售总监王强',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 20, role: '业务员', stageId: 2, stageName: '销售合同', title: '发送合同', action: '发送销售合同给客户', time: '12-05 17:30', nextStepId: 21,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-05 14:30',
        attachments: ['Sales_Contract_SC-2025-001234.pdf'],
        fields: [
          { label: '发送状态', value: '已发送客户', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '发送方式', value: '邮件+Portal', icon: '💌' },
          { label: '合同文件', value: 'Sales_Contract_SC-2025-001234.pdf', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' }
        ],
        notification: {
          message: '已通过邮件和Portal向客户ABC Building Supplies发送销售合同',
          notifier: '业务员张伟',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 21, role: '客户', stageId: 2, stageName: '销售合同', title: '收到合同', action: '收到销售合同', time: '12-05 18:00', nextStepId: 22,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-05 15:00',
        fields: [
          { label: '接收状态', labelEn: 'Receipt Status', value: '已收到', valueEn: 'Contract Received', status: 'completed', statusLabel: '已收到', statusLabelEn: 'Received', statusColor: '#10B981', icon: '📬' },
          { label: '查看状态', labelEn: 'View Status', value: '已查看', valueEn: 'Viewed', status: 'completed', statusLabel: '已查看', statusLabelEn: 'Viewed', statusColor: '#10B981', icon: '👁️' },
          { label: '下载状态', labelEn: 'Download Status', value: '已下载', valueEn: 'Downloaded', status: 'completed', statusLabel: '已下载', statusLabelEn: 'Downloaded', statusColor: '#10B981', icon: '⬇️' }
        ],
        notification: {
          message: '销售合同已成功送达，等待客户审核确认',
          messageEn: 'Sales contract successfully delivered, awaiting customer review',
          notifier: '系统自动通知',
          notifierEn: 'System Auto-notification'
        }
      }
    },
    { 
      id: 22, role: '客户', stageId: 2, stageName: '销售合同', title: '客户确认合同', action: '确认合同并点击Approve', time: '12-05 19:00', nextStepId: 23,
      status: statusConfig.approved,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-05 16:00',
        fields: [
          { label: '销售合同号', labelEn: 'Contract No.', value: 'SC-NA-2512-0001', valueEn: 'SC-NA-2512-0001', icon: '📄' },
          { label: '合同审核', labelEn: 'Contract Review', value: '客户已批准', valueEn: 'Approved by Customer', status: 'approved', statusLabel: '已批准', statusLabelEn: 'Approved', statusColor: '#22C55E', icon: '✅' },
          { label: '电子签名', labelEn: 'E-Signature', value: '已签署', valueEn: 'Signed', status: 'completed', statusLabel: '已签署', statusLabelEn: 'Signed', statusColor: '#10B981', icon: '✍️' },
          { label: '签署IP地址', labelEn: 'Signature IP', value: '192.168.1.100 (USA)', valueEn: '192.168.1.100 (USA)', icon: '🌐' },
          { label: '合同生效', labelEn: 'Contract Status', value: '已生效', valueEn: 'Effective', status: 'approved', statusLabel: '已生效', statusLabelEn: 'Effective', statusColor: '#22C55E', icon: '📋' },
          { label: '下一步', labelEn: 'Next Step', value: '系统自动生成应收账款', valueEn: 'Auto-generate AR', icon: '💰' }
        ],
        notification: {
          message: '已批准并签署销售合同SC-NA-2512-0001，系统将自动生成应收账款',
          messageEn: 'Sales contract SC-NA-2512-0001 approved and signed, AR will be auto-generated',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟', '财务专员李会计']
        }
      }
    },
    { 
      id: 23, role: '系统自动', stageId: 2, stageName: '销售合同', title: '生成应收账款', action: '财务系统自动生成应收账款，业务员状态更新', time: '12-05 19:01', nextStepId: 24,
      status: statusConfig.completed,
      statusDetails: {
        operator: '系统自动',
        completedTime: '2025-12-05 19:01',
        amount: '$62,500',
        fields: [
          { label: '触发条件', value: '✅ 客户确认合同SC-NA-2512-0001', status: 'completed', statusLabel: '已触发', statusColor: '#10B981', icon: '🎯' },
          { label: '应收账款总额', value: '$62,500', icon: '💰' },
          { label: '定金应收', value: '$18,750（30%）', status: 'pending', statusLabel: '待收', statusColor: '#F59E0B', icon: '💵' },
          { label: '尾款应收', value: '$43,750（70%）', status: 'waiting', statusLabel: '等待', statusColor: '#94A3B8', icon: '💵' },
          { label: '应收账款状态', value: '等待定金', status: 'waiting', statusLabel: '等待定金', statusColor: '#F59E0B', icon: '⏳' },
          { label: '业务员订单状态', value: '客户确认订单等待付定金', status: 'waiting', statusLabel: '等待定金', statusColor: '#F59E0B', icon: '📋' },
          { label: '财务模块显示', value: '✅ 应收账款已出现', status: 'completed', statusLabel: '已出现', statusColor: '#10B981', icon: '📊' }
        ],
        notification: {
          message: '系统已自动生成应收账款：定金$18,750（30%）+ 尾款$43,750（70%），业务员状态：客户确认订单等待付定金',
          notifier: '财务系统',
          recipients: ['财务专员李会计', '业务员张伟']
        }
      }
    },
    { 
      id: 24, role: '客户', stageId: 2, stageName: '销售合同', title: '客户付定金', action: '客户付定金并上传水单（$18,750）', time: '12-06 10:00', nextStepId: 25,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-06 10:00',
        amount: '$18,750',
        fields: [
          { label: '订单状态', labelEn: 'Order Status', value: '定金已付', valueEn: 'Deposit Paid', status: 'paid', statusLabel: '定金已付', statusLabelEn: 'Paid', statusColor: '#22C55E', icon: '💳' },
          { label: '付款金额', labelEn: 'Payment Amount', value: '$18,750 (30%)', valueEn: '$18,750 (30%)', icon: '💰' },
          { label: '付款方式', labelEn: 'Payment Method', value: '电汇', valueEn: 'Wire Transfer', icon: '🏦' },
          { label: '付款水单', labelEn: 'Deposit Proof', value: '已上传', valueEn: 'Uploaded', status: 'uploaded', statusLabel: '已上传', statusLabelEn: 'Uploaded', statusColor: '#10B981', icon: '📎' },
          { label: '银行流水号', labelEn: 'Transaction ID', value: 'TXN-20251206-789456', valueEn: 'TXN-20251206-789456', icon: '🔢' },
          { label: '尾款状态', labelEn: 'Balance Status', value: '等待尾款', valueEn: 'Awaiting Balance', status: 'waiting', statusLabel: '等待尾款', statusLabelEn: 'Waiting', statusColor: '#F59E0B', icon: '⏳' }
        ],
        notification: {
          message: '已通知财务专员李会计核实定金到账',
          messageEn: 'Finance team notified to verify deposit receipt',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['财务专员李会计']
        }
      }
    },
    { 
      id: 25, role: '财务专员', stageId: 2, stageName: '销售合同', title: '应收账款模块显示水单', action: '财务在应收账款模块看到客户上传的水单', time: '12-06 10:15', nextStepId: 26,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-06 10:15',
        amount: '$18,750',
        fields: [
          { label: '应收账款单号', value: 'AR-SC-NA-2512-0001', icon: '📄' },
          { label: '关联销售合同', value: 'SC-NA-2512-0001', icon: '🔗' },
          { label: '应收账款显示', value: '✅ 水单已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' },
          { label: '客户上传时间', value: '2025-12-06 10:05', icon: '🕐' },
          { label: '水单文件', value: 'Deposit_Slip_TXN-20251206-789456.pdf', icon: '📎' },
          { label: '可操作', value: '✅ 可查看、可下载', status: 'completed', statusLabel: '可用', statusColor: '#10B981', icon: '👁️' },
          { label: '下一步', value: '核对银行到账情况', icon: '🔍' }
        ],
        notification: {
          message: '应收账款模块显示客户已上传定金水单，请核对银行到账情况',
          notifier: '财务系统',
          recipients: ['财务专员李会计']
        }
      }
    },
    { 
      id: 26, role: '财务专员', stageId: 2, stageName: '销售合同', title: '定金到账确认', action: '收到客户定金，核销处理', time: '12-06 12:00', nextStepId: 27,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-06 12:00',
        amount: '$18,750',
        fields: [
          { label: '水单核对', value: '✅ 已核对客户上传的水单', status: 'completed', statusLabel: '已核对', statusColor: '#10B981', icon: '🔍' },
          { label: '到账状态', value: '✅ 已到账', status: 'completed', statusLabel: '已到账', statusColor: '#22C55E', icon: '✅' },
          { label: '到账时间', value: '2025-12-06 12:00', icon: '🕐' },
          { label: '到账金额', value: '$18,750（30%定金）', icon: '💰' },
          { label: '收款账户', value: '中国银行 **** 1234', icon: '🏦' },
          { label: '核销状态', value: '待核销', status: 'pending', statusLabel: '待核销', statusColor: '#F59E0B', icon: '🔍' }
        ],
        notification: {
          message: '已收到客户定金$18,750并到账确认，正在进行核销处理',
          notifier: '财务专员李会计',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 27, role: '财务专员', stageId: 2, stageName: '销售合同', title: '上传收款凭证', action: '定金核销完成，上传收款凭证，客户端显示"定金收到"', time: '12-06 14:00', nextStepId: 28,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-06 14:00',
        attachments: ['Bank_Statement_20251206.pdf'],
        fields: [
          { label: '收款凭证', value: 'Bank_Statement_20251206.pdf', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' },
          { label: '核销状态', value: '✅ 已核销', status: 'completed', statusLabel: '已核销', statusColor: '#22C55E', icon: '✅' },
          { label: '记账状态', value: '✅ 已入账', status: 'completed', statusLabel: '已入账', statusColor: '#10B981', icon: '📚' },
          { label: '客户Portal状态', value: '✅ 显示"定金收到"', status: 'completed', statusLabel: '已更新', statusColor: '#10B981', icon: '📱' },
          { label: '客户可查看', value: '收款凭证Bank_Statement_20251206.pdf', icon: '👁️' },
          { label: '通知状态', value: '✅ 已通知业务员', status: 'completed', statusLabel: '已通知', statusColor: '#10B981', icon: '📢' },
          { label: '下一步', value: '业务员可启动采购流程', icon: '🚀' }
        ],
        notification: {
          message: '定金已核销完成并入账，客户Portal已显示"定金收到"，已通知业务员张伟可以启动采购流程',
          messageEn: 'Deposit verified and recorded. Customer Portal shows "Deposit Received". Sales Rep Zhang Wei notified to proceed with procurement.',
          notifier: '财务专员李会计',
          notifierEn: 'Finance Specialist Li Kuaiji',
          recipients: ['业务员张伟', '采购员刘刚', '客户ABC Building Supplies']
        }
      }
    },
    
    // 阶段3：采购合同（28-39）
    { 
      id: 28, role: '业务员', stageId: 3, stageName: '采购合同', title: '下推采购合同', action: '业务员下推生成采购合同', time: '12-06 15:00', nextStepId: 29,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-06 15:00',
        fields: [
          { label: '采购单状态', value: '已下推', status: 'completed', statusLabel: '已生成', statusColor: '#10B981', icon: '📄' },
          { label: '产品型号', value: 'ES-2024', icon: '🔖' },
          { label: '产品名称', value: '电气配件', icon: '🔌' },
          { label: '采购数量', value: '5000件', icon: '📦' },
          { label: '交期要求', value: '45天内', icon: '📅' },
          { label: '质量标准', value: '工业级', icon: '⭐' }
        ],
        notification: {
          message: '已下推采购流程给采购员刘刚',
          notifier: '业务员张伟',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 29, role: '采购员', stageId: 3, stageName: '采购合同', title: '收到CG采购订单', action: '采购员在采购订单模块看到CG开头的采购订单', time: '12-06 15:10', nextStepId: 30,
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-06 15:10',
        fields: [
          { label: '采购订单号', value: 'CG-NA-2512-0001', icon: '📄' },
          { label: '关联销售合同', value: 'SC-NA-2512-0001', icon: '🔗' },
          { label: '采购模块显示', value: '✅ CG订单已出现', status: 'completed', statusLabel: '已显示', statusColor: '#10B981', icon: '📋' },
          { label: '订单类型', value: 'CG采购请求', icon: '🏷️' },
          { label: '产品名称', value: '电气配件', icon: '🔌' },
          { label: '采购数量', value: '5000件', icon: '📦' },
          { label: '交期要求', value: '15天（供应商生产）', icon: '📅' },
          { label: '下一步', value: '检查采购合同并提交审核', icon: '🔍' }
        ],
        notification: {
          message: '采购订单模块已出现CG-NA-2512-0001采购请求，请检查并提交审核',
          notifier: '采购系统',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 30, role: '采购员', stageId: 3, stageName: '采购合同', title: '检查并提交采购合同', action: '采购员检查采购合同，提交采购主管审核', time: '12-06 16:00', nextStepId: 31,
      documentType: 'CG',
      documentNo: 'CG-NA-2512-0001',
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-06 16:00',
        amount: '$42,500',
        quantity: '5000件',
        remarks: '已生成采购合同，提交财务审核',
        fields: [
          // 🔥 采购合同产品明细（标准格式，与销售合同对应）
          { label: '序号', value: '1', icon: '🔢' },
          { label: '型号', value: 'ES-2024', icon: '🔖' },
          { label: '产品名称', value: '电气配件', icon: '🔌' },
          { label: '货物描述', value: '工业级电气开关配件', icon: '📝' },
          { label: '数量', value: '5000', icon: '📦' },
          { label: '单位', value: '件', icon: '📦' },
          { label: '单价', value: '$8.50', icon: '💵' },
          { label: '金额', value: '$42,500', icon: '💰' },
          // 🔥 合同级别属性（管理信息）
          { label: '供应商', value: '福建XX制造有限公司', icon: '🏭' },
          { label: '付款方式', value: '30%定金+70%尾款', icon: '💳' },
          { label: '定金金额', value: '$12,750', icon: '💵' },
          { label: '尾款金额', value: '$29,750', icon: '💵' },
          { label: '交货期', value: '15天', icon: '📅' },
          { label: '交货地点', value: '福建厦门工厂', icon: '📍' }
        ],
        notification: {
          message: '采购合同已生成，提交财务专员审核',
          notifier: '采购员刘刚',
          recipients: []
        }
      }
    },
    { 
      id: 31, role: '采购主管', stageId: 3, stageName: '采购合同', title: '采购主管审核', action: '采购主管审核采购合同（通过/拒绝）', time: '12-06 16:30', nextStepId: 32,
      status: statusConfig.approved,
      statusDetails: {
        operator: '采购主管王经理',
        completedTime: '2025-12-06 16:30',
        amount: '$42,500',
        fields: [
          { label: '采购合同号', value: 'CG-NA-2512-0001', icon: '📄' },
          { label: '采购金额', value: '$42,500', icon: '💰' },
          { label: '供应商', value: '福建XX制造（A级）', icon: '🏭' },
          { label: '审核结果', value: '✅ 通过', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '审核意见', value: '供应商可靠，价格合理，同意批准', icon: '💬' },
          { label: '审批人', value: '采购主管 - 王经理', icon: '👔' },
          { label: '审批时间', value: '2025-12-06 16:30', icon: '🕐' }
        ],
        notification: {
          message: '采购主管已审核通过采购合同CG-NA-2512-0001，采购员可以签章发送给供应商',
          notifier: '采购主管王经理',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 32, role: '采购员', stageId: 3, stageName: '采购合同', title: '签章合同给供应商', action: '采购员签章采购合同并发送给供应商', time: '12-06 17:00', nextStepId: 33,
      documentType: 'CG',
      documentNo: 'CG-NA-2512-0001',
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-06 17:00',
        fields: [
          { label: '盖章状态', value: '已盖章', status: 'completed', statusLabel: '已盖章', statusColor: '#10B981', icon: '🔖' },
          { label: '签字状态', value: '已签字', status: 'completed', statusLabel: '已签字', statusColor: '#10B981', icon: '✍️' },
          { label: '发送状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' }
        ],
        notification: {
          message: '已向供应商发送盖章签字的采购合同',
          notifier: '采购员刘刚',
          recipients: ['供应商福建XX']
        }
      }
    },
    { 
      id: 33, role: '供应商', stageId: 3, stageName: '采购合同', title: '收到合同', action: '收到采购员的采购合同', time: '12-07 09:00', nextStepId: 34,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-07 09:00',
        fields: [
          { label: '接收状态', value: '已收到', status: 'completed', statusLabel: '已收到', statusColor: '#10B981', icon: '📬' },
          { label: '合同审阅', value: '审阅中', status: 'processing', statusLabel: '审阅中', statusColor: '#F59E0B', icon: '👁️' },
          { label: '合同编号', value: 'CG-DOM-2512-0001', icon: '🔢' }
        ],
        notification: {
          message: '已收到采购合同，正在审阅',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 34, role: '供应商', stageId: 3, stageName: '采购合同', title: '回签合同', action: '回签采购合同并上传', time: '12-07 10:00', nextStepId: 35,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-07 10:00',
        fields: [
          { label: '回签状态', value: '已签署', status: 'completed', statusLabel: '已签署', statusColor: '#10B981', icon: '✍️' },
          { label: '盖章状态', value: '已盖章', status: 'completed', statusLabel: '已盖章', statusColor: '#10B981', icon: '🔖' },
          { label: '上传状态', value: '已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' },
          { label: '合同生效', value: '已生效', status: 'approved', statusLabel: '生效', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '供应商已回签合同，采购合同正式生效',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚', '财务专员李会计']
        }
      }
    },
    { 
      id: 35, role: '财务专员', stageId: 3, stageName: '采购合同', title: '收到通知', action: '收到供应商签约通知', time: '12-07 10:30', nextStepId: 36,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-07 10:30',
        fields: [
          { label: '通知状态', value: '已收到', status: 'completed', statusLabel: '已收到', statusColor: '#10B981', icon: '📬' },
          { label: '合同状态', value: '已生效', status: 'approved', statusLabel: '生效', statusColor: '#22C55E', icon: '✅' },
          { label: '付款准备', value: '准备付款申请', status: 'processing', statusLabel: '准备中', statusColor: '#F59E0B', icon: '💰' }
        ],
        notification: {
          message: '合同已生效，准备申请付款',
          notifier: '财务专员李会计'
        }
      }
    },
    { 
      id: 36, role: '财务专员', stageId: 3, stageName: '采购合同', title: '申请付款', action: '申请付款', time: '12-07 11:00', nextStepId: 37,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-07 11:00',
        fields: [
          { label: '申请状态', value: '已提交', status: 'completed', statusLabel: '已提交', statusColor: '#10B981', icon: '📄' },
          { label: '付款金额', value: '$12,750 (30%)', icon: '💰' },
          { label: '收款方', value: '福建XX制造', icon: '🏭' },
          { label: '审批状态', value: '待审核', status: 'pending', statusLabel: '待审批', statusColor: '#F59E0B', icon: '⏳' }
        ],
        notification: {
          message: '已提交采购定金付款申请$12,750给财务总监',
          notifier: '财务专员李会计',
          recipients: ['财务总监']
        }
      }
    },
    { 
      id: 37, role: '财务总监', stageId: 3, stageName: '采购合同', title: '审核付款', action: '审核付款申请', time: '12-07 14:00', nextStepId: 38,
      status: statusConfig.approved,
      statusDetails: {
        operator: '财务总监',
        completedTime: '2025-12-07 14:00',
        fields: [
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '付款金额', value: '$12,750', status: 'confirmed', statusLabel: '已确认', statusColor: '#10B981', icon: '💰' },
          { label: '审批意见', value: '合同有效，批准付款', icon: '💬' }
        ],
        notification: {
          message: '付款申请已审批通过，可以执行付款',
          notifier: '财务总监',
          recipients: ['财务专员李会计']
        }
      }
    },
    { 
      id: 38, role: '财务专员', stageId: 3, stageName: '采购合同', title: '付定金', action: '付定金（$12,750）', time: '12-07 15:00', nextStepId: 39,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-07 15:00',
        amount: '$12,750',
        fields: [
          { label: '付款状态', value: '已付款', status: 'completed', statusLabel: '已付款', statusColor: '#22C55E', icon: '💳' },
          { label: '付款金额', value: '$12,750 (30%)', icon: '💰' },
          { label: '付款方式', value: '电汇', icon: '🏦' },
          { label: '流水号', value: 'TXN-20251207-123456', icon: '🔢' }
        ],
        notification: {
          message: '已完成向供应商付款$12,750',
          notifier: '财务专员李会计',
          recipients: ['供应商福建XX', '采购员刘刚']
        }
      }
    },
    { 
      id: 39, role: '供应商', stageId: 3, stageName: '采购合同', title: '确认收款', action: '确认收到定金', time: '12-08 09:00', nextStepId: 40,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-08 09:00',
        amount: '$12,750',
        fields: [
          { label: '到账状态', value: '已到账', status: 'completed', statusLabel: '已到账', statusColor: '#22C55E', icon: '✅' },
          { label: '到账金额', value: '$12,750', icon: '💰' },
          { label: '到账时间', value: '2025-12-08 09:00', icon: '🕐' },
          { label: '生产准备', value: '可以开始生产', status: 'approved', statusLabel: '准备中', statusColor: '#10B981', icon: '🏭' }
        ],
        notification: {
          message: '定金已到账，准备安排产前样打样',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    
    // 阶段4：生产质检（40-50）
    { 
      id: 40, role: '供应商', stageId: 4, stageName: '产前样', title: '产前样打样', action: '产前样打样', time: '12-10 10:00', nextStepId: 41,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-10 10:00',
        fields: [
          { label: '打样状态', value: '已完成', status: 'completed', statusLabel: '已完成', statusColor: '#10B981', icon: '✅' },
          { label: '样品数量', value: '3个样品', icon: '📦' },
          { label: '样品照片', value: '已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📷' }
        ],
        notification: {
          message: '产前样已完成，请采购员确认封样',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 41, role: '采购员', stageId: 4, stageName: '产前样', title: '确认封样', action: '产前样确认签字和封样', time: '12-10 14:00', nextStepId: 42,
      status: statusConfig.approved,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-10 14:00',
        fields: [
          { label: '样品检查', value: '检查合格', status: 'approved', statusLabel: '合格', statusColor: '#22C55E', icon: '✅' },
          { label: '封样状态', value: '已封样', status: 'completed', statusLabel: '已封样', statusColor: '#10B981', icon: '🔖' },
          { label: '签字确认', value: '已签字', status: 'completed', statusLabel: '已签字', statusColor: '#10B981', icon: '✍️' }
        ],
        notification: {
          message: '样品已确认封样，供应商可以开始批量生产',
          notifier: '采购员刘刚',
          recipients: ['供应商福建XX']
        }
      }
    },
    { 
      id: 42, role: '供应商', stageId: 4, stageName: '生产中', title: '正式生产', action: '安排批量生产（15天）', time: '12-11 09:00', nextStepId: 43,
      status: statusConfig.in_progress,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-11 09:00',
        fields: [
          { label: '生产状态', value: '生产中', status: 'processing', statusLabel: '进行中', statusColor: '#3B82F6', icon: '🏭' },
          { label: '生产数量', value: '5000件', icon: '📦' },
          { label: '生产周期', value: '15天', icon: '📅' },
          { label: '预计完成', value: '12-26', icon: '🕐' }
        ],
        notification: {
          message: '已开始批量生产，预计12-26完成',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 43, role: '供应商', stageId: 4, stageName: '生产质检', title: '上传质检', action: '上传质检报告表单', time: '12-18 14:00', nextStepId: 44,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-18 14:00',
        fields: [
          { label: '质检报告', value: '已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' },
          { label: '检验日期', value: '2025-12-18', icon: '📅' },
          { label: '检验项目', value: '外观、尺寸、性能', icon: '🔍' },
          { label: '合格率', value: '99.8%', status: 'approved', statusLabel: '优秀', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '已上传质检报告，请QC审核',
          notifier: '供应商福建XX',
          recipients: ['验货员QC王师傅']
        }
      }
    },
    { 
      id: 44, role: '验货员', stageId: 4, stageName: '生产质检', title: '检查报告', action: 'QC检查质检报告', time: '12-18 16:00', nextStepId: 45,
      status: statusConfig.approved,
      statusDetails: {
        operator: 'QC王师傅',
        completedTime: '2025-12-18 16:00',
        fields: [
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '质检评级', value: 'A级', status: 'approved', statusLabel: '优秀', statusColor: '#22C55E', icon: '⭐' },
          { label: '备注', value: '质量符合要求', icon: '💬' }
        ],
        notification: {
          message: '质检报告已审核通过',
          notifier: '验货员QC王师傅',
          recipients: ['采购员刘刚', '供应商福建XX']
        }
      }
    },
    { 
      id: 45, role: '供应商', stageId: 4, stageName: '验货安排', title: '通知验货', action: '完货前一周通知验货', time: '12-20 10:00', nextStepId: 46,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-20 10:00',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '预计完货日期', value: '12-26', icon: '📅' },
          { label: '建议验货日期', value: '12-23', icon: '📅' },
          { label: '工厂地址', value: '福建省厦门市', icon: '📍' }
        ],
        notification: {
          message: '产品预计12-26完货，建议12-23安排验货',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 46, role: '采购员', stageId: 4, stageName: '验货安排', title: '收到通知', action: '收到验货通知', time: '12-20 10:30', nextStepId: 47,
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-20 10:30',
        fields: [
          { label: '通知接收', value: '已收到', status: 'completed', statusLabel: '已接收', statusColor: '#10B981', icon: '📬' },
          { label: '验货日期', value: '12-23', icon: '📅' },
          { label: '下一步', value: '下推给QC', icon: '➡️' }
        ],
        notification: {
          message: '已收到验货通知，准备安排QC',
          notifier: '采购员刘刚',
          recipients: []
        }
      }
    },
    { 
      id: 47, role: '采购员', stageId: 4, stageName: '验货安排', title: '下推验货', action: '下推验货通知单给QC', time: '12-20 11:00', nextStepId: 48,
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-20 11:00',
        fields: [
          { label: '通知单号', value: 'IN-20251220-001', icon: '📋' },
          { label: '验货日期', value: '12-23', icon: '📅' },
          { label: '验货地点', value: '福建省厦门市', icon: '📍' },
          { label: '产品数量', value: '5000件', icon: '📦' }
        ],
        notification: {
          message: '已下推验货通知单给QC，请安排验货',
          notifier: '采购员刘刚',
          recipients: ['验货员QC王师傅']
        }
      }
    },
    { 
      id: 48, role: '验货员', stageId: 4, stageName: '验货安排', title: '通知工厂', action: 'QC通知工厂验货日期', time: '12-20 14:00', nextStepId: 49,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'QC王师傅',
        completedTime: '2025-12-20 14:00',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '验货日期', value: '12-23 16:00', icon: '📅' },
          { label: '准备事项', value: '请准备样品及相关文件', icon: '📝' }
        ],
        notification: {
          message: 'QC将于12-23 16:00到厂验货，请做好准备',
          notifier: '验货员QC王师傅',
          recipients: ['供应商福建XX']
        }
      }
    },
    
    // 阶段5：验货完货（47-50）
    { 
      id: 49, role: '供应商', stageId: 5, stageName: '验货完货', title: '接受安排', action: '工厂接受验货安排', time: '12-20 15:00', nextStepId: 50,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-20 15:00',
        fields: [
          { label: '验货安排', value: '已接受', status: 'confirmed', statusLabel: '已确认', statusColor: '#10B981', icon: '✅' },
          { label: '验货时间', value: '12-23 16:00', icon: '📅' },
          { label: '准备情况', value: '准备就绪', status: 'approved', statusLabel: '就绪', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '工厂已接受验货安排，12-23 16:00准备就绪',
          notifier: '供应商福建XX',
          recipients: ['验货员QC王师傅', '采购员刘刚']
        }
      }
    },
    { 
      id: 50, role: '验货员', stageId: 5, stageName: '验货完货', title: '验货上传', action: 'QC验货并上传报告', time: '12-23 16:00', nextStepId: 51,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'QC王师傅',
        completedTime: '2025-12-23 16:00',
        fields: [
          { label: '验货结果', value: '合格', status: 'approved', statusLabel: '通过', statusColor: '#22C55E', icon: '✅' },
          { label: '抽检数量', value: '200件', icon: '📦' },
          { label: '合格率', value: '100%', status: 'approved', statusLabel: '优秀', statusColor: '#22C55E', icon: '⭐' },
          { label: '验货报告', value: '已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' }
        ],
        notification: {
          message: '验货通过，报告已上传',
          notifier: '验货员QC王师傅',
          recipients: ['采购员刘刚']
        }
      }
    },
    { 
      id: 51, role: '采购员', stageId: 5, stageName: '验货完货', title: '收到报告', action: '收到验货报告', time: '12-23 17:00', nextStepId: 52,
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-23 17:00',
        fields: [
          { label: '报告接收', value: '已收到', status: 'completed', statusLabel: '已接收', statusColor: '#10B981', icon: '📬' },
          { label: '验货结果', value: '合格', status: 'approved', statusLabel: '通过', statusColor: '#22C55E', icon: '✅' },
          { label: '下一步', value: '通知业务员', icon: '➡️' }
        ],
        notification: {
          message: '验货报告已收到，产品验收合格',
          notifier: '采购员刘刚',
          recipients: []
        }
      }
    },
    { 
      id: 52, role: '采购员', stageId: 5, stageName: '验货完货', title: '通知完货', action: '通知业务员完货信息', time: '12-23 17:30', nextStepId: 53,
      status: statusConfig.completed,
      statusDetails: {
        operator: '刘刚',
        completedTime: '2025-12-23 17:30',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '验货结果', value: '合格', status: 'approved', statusLabel: '通过', statusColor: '#22C55E', icon: '✅' },
          { label: '完货数量', value: '5000件', icon: '📦' },
          { label: '验货报告', value: '已附上', status: 'uploaded', statusLabel: '已附', statusColor: '#10B981', icon: '📎' }
        ],
        notification: {
          message: '产品验货合格，可通知客户完货',
          notifier: '采购员刘刚',
          recipients: ['业务员张伟']
        }
      }
    },
    
    // 阶段6：尾款催收（51-61）
    { 
      id: 53, role: '业务员', stageId: 6, stageName: '尾款催收', title: '收到完货通知', action: '收到验货通过通知', time: '12-23 17:45', nextStepId: 54,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-23 17:45',
        fields: [
          { label: '验货结果', value: '合格', status: 'approved', statusLabel: '通过', statusColor: '#22C55E', icon: '✅' },
          { label: '完货数量', value: '5000件', icon: '📦' },
          { label: '通知状态', value: '已接收', status: 'completed', statusLabel: '已接收', statusColor: '#10B981', icon: '📬' }
        ],
        notification: {
          message: '已收到验货通过通知，准备通知客户',
          notifier: '业务员张伟'
        }
      }
    },
    { 
      id: 54, role: '业务员', stageId: 6, stageName: '尾款催收', title: '通知客户完货', action: '通知客户完货', time: '12-23 18:00', nextStepId: 55,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-23 18:00',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '验货报告', value: '已附上', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' },
          { label: '完货数量', value: '5000件', icon: '📦' }
        ],
        notification: {
          message: '已通知客户完货，附验货报告',
          messageEn: 'Customer has been notified that goods are ready with inspection report attached.',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 55, role: '客户', stageId: 6, stageName: '尾款催收', title: '查看验货报告', action: '查看验货报告', time: '12-24 09:00', nextStepId: 56,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-24 09:00',
        fields: [
          { label: '报告查看', labelEn: 'Report Review', value: '已查看', valueEn: 'Reviewed', status: 'completed', statusLabel: '已查看', statusLabelEn: 'Reviewed', statusColor: '#10B981', icon: '👁️' },
          { label: '质检结果', labelEn: 'QC Result', value: '合格', valueEn: 'Passed', status: 'approved', statusLabel: '合格', statusLabelEn: 'Passed', statusColor: '#22C55E', icon: '✅' },
          { label: '验货数量', labelEn: 'Inspected Qty', value: '5000件', valueEn: '5000 pcs', icon: '📦' }
        ],
        notification: {
          message: '已查看验货报告，产品质量符合要求',
          messageEn: 'QC report reviewed, product quality meets requirements',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies'
        }
      }
    },
    { 
      id: 56, role: '业务员', stageId: 6, stageName: '尾款催收', title: '催收尾款', action: '发送尾款催款通知', time: '12-24 10:00', nextStepId: 57,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-24 10:00',
        amount: '$43,750',
        fields: [
          { label: '催款金额', value: '$43,750 (70%)', icon: '💰' },
          { label: '催款方式', value: '邮件+微信', icon: '📧' },
          { label: '催款理由', value: '验货合格，请付尾款', icon: '📝' },
          { label: '预期付款', value: '今日内', icon: '⏰' }
        ],
        notification: {
          message: '已发送尾款催款通知，金额$43,750',
          notifier: '业务员张伟',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 57, role: '客户', stageId: 6, stageName: '尾款催收', title: '付尾款', action: '付尾款（$43,750）', time: '12-24 14:00', nextStepId: 58,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-24 14:00',
        amount: '$43,750',
        fields: [
          { label: '付款状态', labelEn: 'Payment Status', value: '已付款', valueEn: 'Paid', status: 'completed', statusLabel: '已付款', statusLabelEn: 'Paid', statusColor: '#22C55E', icon: '💳' },
          { label: '付款金额', labelEn: 'Amount', value: '$43,750 (70%)', valueEn: '$43,750 (70%)', icon: '💰' },
          { label: '付款方式', labelEn: 'Method', value: '电汇', valueEn: 'Wire Transfer', icon: '🏦' },
          { label: '流水号', labelEn: 'Transaction ID', value: 'TXN-20251224-456789', valueEn: 'TXN-20251224-456789', icon: '🔢' }
        ],
        notification: {
          message: '已支付尾款$43,750，请确认收款',
          messageEn: 'Balance payment $43,750 completed, please confirm receipt',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['财务专员李会计']
        }
      }
    },
    { 
      id: 58, role: '财务专员', stageId: 6, stageName: '尾款催收', title: '确认收到尾款', action: '收到客户尾款', time: '12-24 16:00', nextStepId: 59,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-24 16:00',
        amount: '$43,750',
        fields: [
          { label: '到账状态', value: '已到账', status: 'completed', statusLabel: '已到账', statusColor: '#22C55E', icon: '✅' },
          { label: '到账金额', value: '$43,750', icon: '💰' },
          { label: '到账时间', value: '2025-12-24 16:00', icon: '🕐' }
        ],
        notification: {
          message: '客户尾款$43,750已到账',
          notifier: '财务专员李会计',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 59, role: '财务专员', stageId: 6, stageName: '尾款催收', title: '通知尾款到账', action: '上传收款凭证', time: '12-25 09:00', nextStepId: 60,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-25 09:00',
        fields: [
          { label: '收款凭证', value: '已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📎' },
          { label: '核销状态', value: '已核销', status: 'completed', statusLabel: '已核销', statusColor: '#22C55E', icon: '✅' },
          { label: '记账状态', value: '已入账', status: 'completed', statusLabel: '已入账', statusColor: '#10B981', icon: '📚' }
        ],
        notification: {
          message: '尾款已核销入账，可以支付供应商尾款',
          notifier: '财务专员李会计',
          recipients: ['业务员张伟', '采购员刘刚']
        }
      }
    },
    { 
      id: 60, role: '财务专员', stageId: 6, stageName: '尾款催收', title: '申请付供应商尾款', action: '申请付供应商尾款', time: '12-25 10:00', nextStepId: 61,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-25 10:00',
        amount: '$29,750',
        fields: [
          { label: '申请金额', value: '$29,750 (70%)', icon: '💰' },
          { label: '收款方', value: '供应商福建XX', icon: '🏢' },
          { label: '付款原因', value: '采购合同尾款', icon: '📋' },
          { label: '审批状态', value: '待审批', status: 'pending', statusLabel: '待审批', statusColor: '#F59E0B', icon: '⏳' }
        ],
        notification: {
          message: '已申请付供应商尾款$29,750，请审批',
          notifier: '财务专员李会计',
          recipients: ['财务总监']
        }
      }
    },
    { 
      id: 61, role: '财务总监', stageId: 6, stageName: '尾款催收', title: '审核尾款付款', action: '审核尾款付款申请', time: '12-25 11:00', nextStepId: 62,
      status: statusConfig.approved,
      statusDetails: {
        operator: '财务总监',
        completedTime: '2025-12-25 11:00',
        amount: '$29,750',
        fields: [
          { label: '审核结果', value: '已批准', status: 'approved', statusLabel: '已批准', statusColor: '#22C55E', icon: '✅' },
          { label: '付款金额', value: '$29,750', status: 'confirmed', statusLabel: '已确认', statusColor: '#10B981', icon: '💰' },
          { label: '审批意见', value: '客户尾款已到账，批准付款', icon: '💬' }
        ],
        notification: {
          message: '尾款付款申请已审批通过，可以执行付款',
          notifier: '财务总监',
          recipients: ['财务专员李会计']
        }
      }
    },
    { 
      id: 62, role: '财务专员', stageId: 6, stageName: '尾款催收', title: '付供应商尾款', action: '付尾款（$29,750）', time: '12-25 14:00', nextStepId: 63,
      status: statusConfig.completed,
      statusDetails: {
        operator: '李会计',
        completedTime: '2025-12-25 14:00',
        amount: '$29,750',
        fields: [
          { label: '付款状态', value: '已付款', status: 'completed', statusLabel: '已付款', statusColor: '#22C55E', icon: '💳' },
          { label: '付款金额', value: '$29,750 (70%)', icon: '💰' },
          { label: '付款方式', value: '电汇', icon: '🏦' },
          { label: '流水号', value: 'TXN-20251225-789012', icon: '🔢' }
        ],
        notification: {
          message: '已完成向供应商付尾款$29,750',
          notifier: '财务专员李会计',
          recipients: ['供应商福建XX', '采购员刘刚']
        }
      }
    },
    { 
      id: 63, role: '供应商', stageId: 6, stageName: '尾款催收', title: '确认收到尾款', action: '确认收到尾款', time: '12-25 16:00', nextStepId: 64,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-25 16:00',
        amount: '$29,750',
        fields: [
          { label: '到账状态', value: '已到账', status: 'completed', statusLabel: '已到账', statusColor: '#22C55E', icon: '✅' },
          { label: '到账金额', value: '$29,750', icon: '💰' },
          { label: '到账时间', value: '2025-12-25 16:00', icon: '🕐' },
          { label: '合同状态', value: '已完成', status: 'completed', statusLabel: '已完成', statusColor: '#22C55E', icon: '🎉' }
        ],
        notification: {
          message: '尾款已到账，感谢合作',
          notifier: '供应商福建XX',
          recipients: ['采购员刘刚']
        }
      }
    },
    
    // 阶段7：商检订舱（62-71）
    { 
      id: 64, role: '业务员', stageId: 7, stageName: '商检订舱', title: '询问订舱方式', action: '询问客户订舱方式', time: '12-25 16:30', nextStepId: 65,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-25 16:30',
        fields: [
          { label: '询问内容', value: 'FOB还是CIF', icon: '❓' },
          { label: '发送方式', value: '邮件', icon: '📧' },
          { label: '等待回复', value: '等待客户确认', status: 'pending', statusLabel: '等待中', statusColor: '#F59E0B', icon: '⏳' }
        ],
        notification: {
          message: '已询问客户订舱方式（FOB/CIF）',
          messageEn: 'Asked customer about shipping term preference (FOB/CIF)',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 65, role: '客户', stageId: 7, stageName: '商检订舱', title: '选择订舱方式', action: '客户选择CIF', time: '12-25 17:00', nextStepId: 66,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-25 17:00',
        fields: [
          { label: '订舱方式', labelEn: 'Shipping Term', value: 'CIF', valueEn: 'CIF', status: 'confirmed', statusLabel: '已确认', statusLabelEn: 'Confirmed', statusColor: '#10B981', icon: '🚢' },
          { label: '运费承担', labelEn: 'Freight', value: '卖方承担', valueEn: 'Seller Pays', icon: '💰' },
          { label: '保险', labelEn: 'Insurance', value: '卖方购买', valueEn: 'Seller Arranges', icon: '🛡️' }
        ],
        notification: {
          message: '客户选择CIF条款，卖方负责运费和保险',
          messageEn: 'Customer selected CIF term, seller arranges freight and insurance',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 66, role: '业务员', stageId: 7, stageName: '商检订舱', title: '检查是否需要商检', action: '检查产品是否需要商检', time: '12-25 17:30', nextStepId: 67,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-25 17:30',
        fields: [
          { label: 'HS编码', value: '8536.50.9000', icon: '🔖' },
          { label: '产品类别', value: '电气开关配件', icon: '🔌' },
          { label: '是否需要商检', value: '需要', status: 'confirmed', statusLabel: '需要', statusColor: '#F59E0B', icon: '✅' },
          { label: '目的国', value: '美国', icon: '🇺🇸' }
        ],
        notification: {
          message: '产品需要商检，准备联系商检机构',
          notifier: '业务员张伟',
          recipients: []
        }
      }
    },
    { 
      id: 67, role: '业务员', stageId: 7, stageName: '商检订舱', title: '安排商检', action: '联系商检机构', time: '12-26 09:00', nextStepId: 68,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-26 09:00',
        fields: [
          { label: '商检机构', value: '厦门商检局', icon: '🏢' },
          { label: '申请内容', value: '原产地证书', icon: '📜' },
          { label: '预计完成', value: '12-27', icon: '📅' },
          { label: '申请状态', value: '已提交', status: 'completed', statusLabel: '已提交', statusColor: '#10B981', icon: '✅' }
        ],
        notification: {
          message: '已联系厦门商检局，申请原产地证书',
          notifier: '业务员张伟',
          recipients: ['商检机构']
        }
      }
    },
    { 
      id: 68, role: '商检机构', stageId: 7, stageName: '商检订舱', title: '商检完成', action: '完成商检，出具证书', time: '12-27 14:00', nextStepId: 69,
      documentType: 'CO',
      documentNo: generateDocumentNo('CO', 64),
      status: statusConfig.completed,
      statusDetails: {
        operator: '厦门商检局',
        completedTime: '2025-12-27 14:00',
        amount: '$62,500',
        quantity: '5000件',
        remarks: '商检合格，已出具原产地证',
        fields: [
          // 🔥 原产地证货物明细（Certificate of Origin）
          { label: '序号', value: '1', icon: '🔢' },
          { label: '货物名称', value: '电气开关配件', icon: '🔌' },
          { label: '规格型号', value: 'ES-2024', icon: '📝' },
          { label: 'HS编码', value: '8536.50.9000', icon: '🔖' },
          { label: '数量', value: '5000件', icon: '📦' },
          { label: '原产国', value: '中国', icon: '🇨🇳' },
          { label: '原产地', value: '福建省厦门市', icon: '📍' },
          // 🔥 证书信息
          { label: '证书编号', value: generateDocumentNo('CO', 64), icon: '📜' },
          { label: '签发机关', value: '厦门商检局', icon: '🏢' },
          { label: '签发日期', value: '2025-12-27', icon: '📅' },
          { label: '目的国', value: '美国', icon: '🇺🇸' },
          { label: '检验结果', value: '合格', status: 'approved', statusLabel: '合格', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '商检完成，已出具原产地证书',
          notifier: '厦门商检局',
          recipients: []
        }
      }
    },
    { 
      id: 69, role: '业务员', stageId: 7, stageName: '商检订舱', title: '收到商检证书', action: '收到商检证书', time: '12-27 15:00', nextStepId: 70,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-27 15:00',
        fields: [
          { label: '证书类型', value: '原产地证书', icon: '📜' },
          { label: '证书编号', value: 'XM20251227001', icon: '🔢' },
          { label: '接收状态', value: '已收到', status: 'completed', statusLabel: '已收到', statusColor: '#10B981', icon: '📬' },
          { label: '下一步', value: '询问海运费', icon: '➡️' }
        ],
        notification: {
          message: '已收到商检证书，准备询问海运费',
          notifier: '业务员张伟',
          recipients: []
        }
      }
    },
    { 
      id: 70, role: '业务员', stageId: 7, stageName: '商检订舱', title: '询问海运费', action: '向货代询问海运费', time: '12-27 16:00', nextStepId: 71,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-27 16:00',
        fields: [
          { label: '起运港', value: '厦门', icon: '🏙️' },
          { label: '目的港', value: '洛杉矶', icon: '🏙️' },
          { label: '货物体积', value: '25CBM', icon: '📐' },
          { label: '询价状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' }
        ],
        notification: {
          message: '已向货代询问厦门-洛杉矶海运费',
          notifier: '业务员张伟',
          recipients: ['货代']
        }
      }
    },
    { 
      id: 71, role: '货代', stageId: 7, stageName: '商检订舱', title: '报海运费', action: '货代报海运费', time: '12-27 17:00', nextStepId: 72,
      status: statusConfig.completed,
      statusDetails: {
        operator: '货代公司',
        completedTime: '2025-12-27 17:00',
        amount: '$2,500',
        fields: [
          { label: '海运费', value: '$2,500', icon: '💰' },
          { label: '航线', value: '厦门-洛杉矶', icon: '🚢' },
          { label: '航程', value: '约25天', icon: '📅' },
          { label: '报价有效期', value: '3天', icon: '⏳' }
        ],
        notification: {
          message: '海运费报价：$2,500（厦门-洛杉矶）',
          notifier: '货代公司',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 72, role: '业务员', stageId: 7, stageName: '商检订舱', title: '转发海运费给客户', action: '转发海运费给客户', time: '12-27 17:30', nextStepId: 73,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-27 17:30',
        amount: '$2,500',
        fields: [
          { label: '海运费', value: '$2,500', icon: '💰' },
          { label: '航线', value: '厦门-洛杉矶', icon: '🚢' },
          { label: '转发状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '等待确认', value: '等待客户确认', status: 'pending', statusLabel: '等待中', statusColor: '#F59E0B', icon: '⏳' }
        ],
        notification: {
          message: '已转发海运费报价$2,500给客户',
          messageEn: 'Freight quotation $2,500 sent to customer',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 73, role: '客户', stageId: 7, stageName: '商检订舱', title: '确认海运费', action: '客户确认海运费', time: '12-28 09:00', nextStepId: 74,
      status: statusConfig.approved,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-12-28 09:00',
        fields: [
          { label: '海运费', labelEn: 'Freight Cost', value: '$2,500', valueEn: '$2,500', icon: '💰' },
          { label: '确认状态', labelEn: 'Confirmation', value: '已确认', valueEn: 'Confirmed', status: 'approved', statusLabel: '已确认', statusLabelEn: 'Confirmed', statusColor: '#22C55E', icon: '✅' },
          { label: '航线', labelEn: 'Route', value: '厦门-洛杉矶', valueEn: 'Xiamen-LA', icon: '🚢' }
        ],
        notification: {
          message: '客户已确认海运费$2,500',
          messageEn: 'Customer confirmed freight cost $2,500',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟', '货代']
        }
      }
    },
    
    // 阶段8：拖车装柜（72-79）
    { 
      id: 74, role: '业务员', stageId: 8, stageName: '拖车装柜', title: '正式订舱', action: '向货代正式订舱', time: '12-28 10:00', nextStepId: 75,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-28 10:00',
        fields: [
          { label: '订舱状态', value: '已提交', status: 'completed', statusLabel: '已提交', statusColor: '#10B981', icon: '✅' },
          { label: '目的港', value: '洛杉矶', icon: '🏙️' },
          { label: '货物体积', value: '25CBM', icon: '📐' },
          { label: '要求船期', value: '01-02前开船', icon: '📅' }
        ],
        notification: {
          message: '已向货代正式订舱，要求01-02前开船',
          notifier: '业务员张伟',
          recipients: ['货代']
        }
      }
    },
    { 
      id: 75, role: '货代', stageId: 8, stageName: '拖车装柜', title: '确认订舱', action: '确认订舱，提供船期', time: '12-28 14:00', nextStepId: 76,
      status: statusConfig.completed,
      statusDetails: {
        operator: '货代公司',
        completedTime: '2025-12-28 14:00',
        fields: [
          { label: '订舱确认', value: '已确认', status: 'confirmed', statusLabel: '已确认', statusColor: '#22C55E', icon: '✅' },
          { label: '船名', value: 'COSCO STAR', icon: '🚢' },
          { label: '航次', value: 'V202501', icon: '🔢' },
          { label: '开船日期', value: '01-02', icon: '📅' },
          { label: '截港时间', value: '12-30 18:00', icon: '⏰' }
        ],
        notification: {
          message: '订舱已确认，船名COSCO STAR，01-02开船',
          notifier: '货代公司',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 76, role: '业务员', stageId: 8, stageName: '拖车装柜', title: '安排拖车', action: '联系拖车公司', time: '12-28 15:00', nextStepId: 77,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-28 15:00',
        fields: [
          { label: '拖车公司', value: '厦门拖车公司', icon: '🚛' },
          { label: '工厂地址', value: '福建省厦门市', icon: '📍' },
          { label: '装柜时间', value: '12-30 09:00', icon: '📅' },
          { label: '联系状态', value: '已联系', status: 'completed', statusLabel: '已联系', statusColor: '#10B981', icon: '📞' }
        ],
        notification: {
          message: '已联系拖车公司，安排12-30到厂装柜',
          notifier: '业务员张伟',
          recipients: ['拖车公司']
        }
      }
    },
    { 
      id: 77, role: '拖车公司', stageId: 8, stageName: '拖车装柜', title: '确认拖车', action: '确认拖车安排', time: '12-28 16:00', nextStepId: 78,
      status: statusConfig.completed,
      statusDetails: {
        operator: '拖车公司',
        completedTime: '2025-12-28 16:00',
        fields: [
          { label: '确认状态', value: '已确认', status: 'confirmed', statusLabel: '已确认', statusColor: '#22C55E', icon: '✅' },
          { label: '司机', value: '张师傅', icon: '👨‍✈️' },
          { label: '车牌号', value: '闽D12345', icon: '🚛' },
          { label: '到厂时间', value: '12-30 09:00', icon: '📅' }
        ],
        notification: {
          message: '拖车已确认，司机张师傅12-30 09:00到厂',
          notifier: '拖车公司',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 78, role: '业务员', stageId: 8, stageName: '拖车装柜', title: '通知工厂装柜', action: '通知供应商准备装柜', time: '12-28 17:00', nextStepId: 79,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-28 17:00',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '装柜时间', value: '12-30 09:00', icon: '📅' },
          { label: '司机信息', value: '张师傅 闽D12345', icon: '🚛' },
          { label: '注意事项', value: '准备打包好的货物', icon: '📝' }
        ],
        notification: {
          message: '拖车12-30 09:00到厂，请准备装柜',
          notifier: '业务员张伟',
          recipients: ['供应商福建XX']
        }
      }
    },
    { 
      id: 79, role: '供应商', stageId: 8, stageName: '拖车装柜', title: '准备装柜', action: '准备货物，等待拖车', time: '12-29 10:00', nextStepId: 80,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-29 10:00',
        fields: [
          { label: '准备状态', value: '准备就绪', status: 'approved', statusLabel: '就绪', statusColor: '#22C55E', icon: '✅' },
          { label: '货物数量', value: '5000件/100箱', icon: '📦' },
          { label: '打包状态', value: '已打包', status: 'completed', statusLabel: '已完成', statusColor: '#10B981', icon: '📦' },
          { label: '等待拖车', value: '明天09:00', icon: '⏰' }
        ],
        notification: {
          message: '货物已准备就绪，等待明天拖车到厂',
          notifier: '供应商福建XX',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 80, role: '拖车公司', stageId: 8, stageName: '拖车装柜', title: '到工厂装柜', action: '司机到达工厂，配合装柜', time: '12-30 09:00', nextStepId: 81,
      status: statusConfig.completed,
      statusDetails: {
        operator: '拖车公司 - 司机张师傅',
        completedTime: '2025-12-30 09:00',
        fields: [
          { label: '到达状态', value: '已到达', status: 'completed', statusLabel: '已到达', statusColor: '#22C55E', icon: '✅' },
          { label: '司机姓名', value: '张师傅', icon: '👤' },
          { label: '车牌号', value: '闽D12345', icon: '🚛' },
          { label: '集装箱号', value: 'XMNU1234567', icon: '📦' },
          { label: '工厂地址', value: '福建省厦门市', icon: '📍' }
        ],
        notification: {
          message: '拖车已到达工厂，开始装柜作业',
          notifier: '拖车司机张师傅',
          recipients: ['供应商福建XX', '业务员张伟']
        }
      }
    },
    { 
      id: 81, role: '供应商', stageId: 8, stageName: '拖车装柜', title: '配合装柜', action: '配合装柜', time: '12-30 09:30', nextStepId: 82,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-30 09:30',
        fields: [
          { label: '装柜进度', value: '进行中', status: 'processing', statusLabel: '进行中', statusColor: '#3B82F6', icon: '⚙️' },
          { label: '已装数量', value: '约60%', icon: '📦' },
          { label: '预计完成', value: '12:00', icon: '⏰' }
        ],
        notification: {
          message: '正在配合装柜，预计12:00完成',
          notifier: '供应商福建XX',
          recipients: []
        }
      }
    },
    
    // 阶段9：装柜报关（80-84）
    { 
      id: 82, role: '供应商', stageId: 9, stageName: '装柜报关', title: '装柜完成', action: '装柜完成，封柜拍照', time: '12-30 12:00', nextStepId: 83,
      status: statusConfig.completed,
      statusDetails: {
        operator: '福建XX',
        completedTime: '2025-12-30 12:00',
        fields: [
          { label: '装柜状态', value: '已完成', status: 'completed', statusLabel: '已完成', statusColor: '#22C55E', icon: '✅' },
          { label: '集装箱号', value: 'XMNU1234567', icon: '📦' },
          { label: '封条号', value: 'SEAL789012', icon: '🔒' },
          { label: '装柜照片', value: '已上传', status: 'uploaded', statusLabel: '已上传', statusColor: '#10B981', icon: '📷' }
        ],
        notification: {
          message: '装柜完成并封柜，照片已上传',
          notifier: '供应商福建XX',
          recipients: ['业务员张伟', '拖车公司']
        }
      }
    },
    { 
      id: 83, role: '拖车公司', stageId: 9, stageName: '装柜报关', title: '运往港区', action: '司机运往厦门港港区', time: '12-30 12:30', nextStepId: 84,
      status: statusConfig.in_progress,
      statusDetails: {
        operator: '拖车公司 - 司机张师傅',
        completedTime: '2025-12-30 12:30',
        fields: [
          { label: '运输状态', value: '运输中', status: 'in_progress', statusLabel: '运输中', statusColor: '#3B82F6', icon: '🚛' },
          { label: '集装箱号', value: 'XMNU1234567', icon: '📦' },
          { label: '封条号', value: 'SEAL789012', icon: '🔒' },
          { label: '出发地', value: '福建省厦门市工厂', icon: '📍' },
          { label: '目的地', value: '厦门港港区', icon: '🏙️' },
          { label: '预计到达', value: '14:00', icon: '⏰' }
        ],
        notification: {
          message: '装柜完成，正在运往厦门港港区',
          notifier: '拖车司机张师傅',
          recipients: ['业务员张伟', '货代公司']
        }
      }
    },
    { 
      id: 84, role: '拖车公司', stageId: 9, stageName: '装柜报关', title: '到达港区', action: '司机到达厦门港港区', time: '12-30 14:00', nextStepId: 85,
      status: statusConfig.completed,
      statusDetails: {
        operator: '拖车公司 - 司机张师傅',
        completedTime: '2025-12-30 14:00',
      }
    },
    { 
      id: 85, role: '业务员', stageId: 9, stageName: '装柜报关', title: '准备报关资料', action: '准备报关资料（商业发票、装箱清单等）', time: '12-30 15:00', nextStepId: 86,
      documentType: 'CI',
      documentNo: generateDocumentNo('CI', 81),
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-30 15:00',
        amount: '$62,500',
        quantity: '5000件',
        remarks: '已制作商业发票和装箱清单，准备报关',
        fields: [
          // 🔥 商业发票产品明细（标准格式，用于报关和结汇）
          { label: '序号', labelEn: 'Seq.#', value: '1', valueEn: '1', icon: '🔢' },
          { label: '型号', labelEn: 'Model No.', value: 'ES-2024', valueEn: 'ES-2024', icon: '🔖' },
          { label: '产品名称', labelEn: 'Item Name', value: '电气配件', valueEn: 'Electrical Accessories', icon: '🔌' },
          { label: '货物描述', labelEn: 'Description of Goods', value: '工业级电气开关配件', valueEn: 'Industrial Grade Electrical Switch Accessories', icon: '📝' },
          { label: '数量', labelEn: 'Quantity', value: '5000', valueEn: '5000', icon: '📦' },
          { label: '单位', labelEn: 'Unit', value: '件', valueEn: 'pcs', icon: '📦' },
          { label: '单价', labelEn: 'Unit Price', value: '$12.50', valueEn: '$12.50', icon: '💵' },
          { label: '金额', labelEn: 'Total Amount', value: '$62,500', valueEn: '$62,500', icon: '💰' },
          // 🔥 装箱信息（装箱清单 - Packing List）
          { label: '总箱数', labelEn: 'Total Cartons', value: '100箱', valueEn: '100 ctns', icon: '📦' },
          { label: '总毛重', labelEn: 'Gross Weight', value: '2500kg', valueEn: '2500kg', icon: '⚖️' },
          { label: '总净重', labelEn: 'Net Weight', value: '2000kg', valueEn: '2000kg', icon: '⚖️' },
          { label: '总体积', labelEn: 'Total Volume', value: '25CBM', valueEn: '25CBM', icon: '📐' },
          // 🔥 报关文件清单
          { label: '商业发票编号', labelEn: 'CI No.', value: generateDocumentNo('CI', 81), valueEn: generateDocumentNo('CI', 81), status: 'completed', statusLabel: '已制作', statusLabelEn: 'Prepared', statusColor: '#10B981', icon: '💵' },
          { label: '装箱清单编号', labelEn: 'PL No.', value: generateDocumentNo('PL', 81), valueEn: generateDocumentNo('PL', 81), status: 'completed', statusLabel: '已制作', statusLabelEn: 'Prepared', statusColor: '#10B981', icon: '📦' }
        ],
        notification: {
          message: '已准备商业发票和装箱清单，提交报关行',
          messageEn: 'Commercial Invoice and Packing List prepared, submitted to customs broker',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: []
        }
      }
    },
    { 
      id: 86, role: '业务员', stageId: 9, stageName: '装柜报关', title: '提交报关', action: '向报关行提交报关资料', time: '12-30 15:30', nextStepId: 87,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-30 15:30',
        fields: [
          { label: '提交状态', value: '已提交', status: 'completed', statusLabel: '已提交', statusColor: '#10B981', icon: '✅' },
          { label: '商业发票', value: 'CI-20251230-001', icon: '📄' },
          { label: '装箱清单', value: 'PL-20251230-001', icon: '📦' },
          { label: '原产地证', value: 'CO-XM20251227001', icon: '📜' },
          { label: '报关行', value: '厦门报关行', icon: '🏢' }
        ],
        notification: {
          message: '报关资料已提交厦门报关行',
          notifier: '业务员张伟',
          recipients: ['报关行']
        }
      }
    },
    
    // 阶段10：报关开船（85-89）
    { 
      id: 87, role: '报关行', stageId: 10, stageName: '报关开船', title: '报关申报', action: '向海关申报', time: '12-30 16:00', nextStepId: 88,
      documentType: 'CD',
      documentNo: generateDocumentNo('CD', 83),
      status: statusConfig.completed,
      statusDetails: {
        operator: '厦门报关行',
        completedTime: '2025-12-30 16:00',
        amount: '$62,500',
        quantity: '5000件',
        remarks: '已向厦门海关提交报关申报',
        fields: [
          // 🔥 报关单货物明细（标准格式，用于海关申报）
          { label: '序号', value: '1', icon: '🔢' },
          { label: 'HS编码', value: '8536.50.9000', icon: '🔖' },
          { label: '货物名称', value: '电气开关配件', icon: '🔌' },
          { label: '规格型号', value: 'ES-2024 工业级', icon: '📝' },
          { label: '数量', value: '5000', icon: '📦' },
          { label: '单位', value: '件', icon: '📦' },
          { label: '单价', value: '$12.50', icon: '💵' },
          { label: '总价', value: '$62,500', icon: '💰' },
          // 🔥 报关信息
          { label: '报关口岸', value: '厦门海关', icon: '🛂' },
          { label: '贸易方式', value: '一般贸易', icon: '📋' },
          { label: '征免性质', value: '一般征税', icon: '💼' },
          { label: '运输方式', value: '海运', icon: '🚢' },
          { label: '目的国', value: '美国', icon: '🇺🇸' },
          { label: '集装箱号', value: 'XMNU1234567', icon: '📦' }
        ],
        notification: {
          message: '已向厦门海关提交报关申报，等待审核放行',
          notifier: '报关行',
          recipients: []
        }
      }
    },
    { 
      id: 88, role: '海关', stageId: 10, stageName: '报关开船', title: '审核放行', action: '审核报关单，放行', time: '12-30 18:00', nextStepId: 89,
      status: statusConfig.approved,
      statusDetails: {
        operator: '厦门海关',
        completedTime: '2025-12-30 18:00',
        fields: [
          { label: '审核结果', value: '放行', status: 'approved', statusLabel: '已放行', statusColor: '#22C55E', icon: '✅' },
          { label: '报关单号', value: 'CD-XM20251230001', icon: '📋' },
          { label: '放行时间', value: '2025-12-30 18:00', icon: '🕐' },
          { label: '备注', value: '单证齐全，准予放行', icon: '💬' }
        ],
        notification: {
          message: '报关审核通过，准予放行',
          notifier: '厦门海关',
          recipients: ['报关行']
        }
      }
    },
    { 
      id: 89, role: '报关行', stageId: 10, stageName: '报关开船', title: '通知放行', action: '通知业务员报关放行', time: '12-30 19:00', nextStepId: 90,
      status: statusConfig.completed,
      statusDetails: {
        operator: '厦门报关行',
        completedTime: '2025-12-30 19:00',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '放行时间', value: '12-30 18:00', icon: '🕐' },
          { label: '报关单号', value: 'CD-XM20251230001', icon: '📋' }
        ],
        notification: {
          message: '海关已放行，可以安排开船',
          notifier: '报关行',
          recipients: ['业务员张伟', '货代']
        }
      }
    },
    { 
      id: 90, role: '业务员', stageId: 10, stageName: '报关开船', title: '确认放行', action: '确认报关放行', time: '12-30 20:00', nextStepId: 91,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-12-30 20:00',
        fields: [
          { label: '放行确认', value: '已确认', status: 'confirmed', statusLabel: '已确认', statusColor: '#22C55E', icon: '✅' },
          { label: '报关单号', value: 'CD-XM20251230001', icon: '📋' },
          { label: '船期', value: '01-02开船', icon: '🚢' }
        ],
        notification: {
          message: '报关放行已确认，等待开船',
          notifier: '业务员张伟',
          recipients: []
        }
      }
    },
    { 
      id: 91, role: '货代', stageId: 10, stageName: '报关开船', title: '通知开船', action: '通知船已开航', time: '01-02 08:00', nextStepId: 92,
      status: statusConfig.completed,
      statusDetails: {
        operator: '货代公司',
        completedTime: '2025-01-02 08:00',
        fields: [
          { label: '开船状态', value: '已开航', status: 'completed', statusLabel: '已开航', statusColor: '#22C55E', icon: '🚢' },
          { label: '船名', value: 'COSCO STAR', icon: '🚢' },
          { label: '航次', value: 'V202501', icon: '🔢' },
          { label: '开船日期', value: '2025-01-02', icon: '📅' },
          { label: '预计到港', value: '2025-01-27', icon: '📅' }
        ],
        notification: {
          message: 'COSCO STAR已开航，预计01-27到达洛杉矶',
          notifier: '货代公司',
          recipients: ['业务员张伟']
        }
      }
    },
    
    // 阶段11：海运跟踪（90-94）
    { 
      id: 92, role: '业务员', stageId: 11, stageName: '海运跟踪', title: '通知客户船期', action: '通知客户船期和提单', time: '01-02 09:00', nextStepId: 93,
      documentType: 'BL',
      documentNo: generateDocumentNo('BL', 88),
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-01-02 09:00',
        amount: '$62,500',
        quantity: '5000件',
        remarks: '已通知客户船期和提单信息',
        fields: [
          // 🔥 提单货物明细（Bill of Lading）
          { label: '序号', labelEn: 'Seq.#', value: '1', valueEn: '1', icon: '🔢' },
          { label: '货物描述', labelEn: 'Description of Goods', value: '电气开关配件 ES-2024', valueEn: 'Electrical Switch Accessories ES-2024', icon: '📝' },
          { label: '件数', labelEn: 'Number of Packages', value: '100箱', valueEn: '100 ctns', icon: '📦' },
          { label: '毛重', labelEn: 'Gross Weight', value: '2500kg', valueEn: '2500kg', icon: '⚖️' },
          { label: '体积', labelEn: 'Measurement', value: '25CBM', valueEn: '25CBM', icon: '📐' },
          // 🔥 运输信息
          { label: '提单号', labelEn: 'B/L No.', value: generateDocumentNo('BL', 88), valueEn: generateDocumentNo('BL', 88), icon: '📄' },
          { label: '船名', labelEn: 'Vessel', value: 'COSCO STAR', valueEn: 'COSCO STAR', icon: '🚢' },
          { label: '航次', labelEn: 'Voyage', value: 'V202501', valueEn: 'V202501', icon: '🔢' },
          { label: '起运港', labelEn: 'Port of Loading', value: '厦门', valueEn: 'Xiamen', icon: '🏙️' },
          { label: '目的港', labelEn: 'Port of Discharge', value: '洛杉矶', valueEn: 'Los Angeles', icon: '🏙️' },
          { label: '开船日期', labelEn: 'ETD', value: '2025-01-02', valueEn: '2025-01-02', icon: '📅' },
          { label: '预计到港', labelEn: 'ETA', value: '2025-01-27', valueEn: '2025-01-27', icon: '📅' },
          { label: '集装箱号', labelEn: 'Container No.', value: 'XMNU1234567', valueEn: 'XMNU1234567', icon: '📦' }
        ],
        notification: {
          message: '已通知客户船期和提单信息',
          messageEn: 'Vessel schedule and B/L information sent to customer',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: []
        }
      }
    },
    { 
      id: 93, role: '客户', stageId: 11, stageName: '海运跟踪', title: '收到船期通知', action: '收到船期通知', time: '01-02 10:00', nextStepId: 94,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-01-02 10:00',
        fields: [
          { label: '船期通知', labelEn: 'Vessel Schedule', value: '已收到', valueEn: 'Received', status: 'completed', statusLabel: '已收到', statusLabelEn: 'Received', statusColor: '#10B981', icon: '📬' },
          { label: '开船日期', labelEn: 'ETD', value: '01-02', valueEn: '01-02', icon: '📅' },
          { label: '预计到港', labelEn: 'ETA', value: '01-27', valueEn: '01-27', icon: '🚢' },
          { label: '提单号', labelEn: 'B/L No.', value: 'XM20250102001', valueEn: 'XM20250102001', icon: '📄' }
        ],
        notification: {
          message: '已收到船期和提单信息',
          messageEn: 'Vessel schedule and B/L received',
          notifier: '系统自动通知',
          notifierEn: 'System Notification'
        }
      }
    },
    { 
      id: 94, role: '货代', stageId: 11, stageName: '海运跟踪', title: '催收海运费', action: '催收海运费', time: '01-03 09:00', nextStepId: 95,
      status: statusConfig.completed,
      statusDetails: {
        operator: '货代公司',
        completedTime: '2025-01-03 09:00',
        amount: '$2,500',
        fields: [
          { label: '催收金额', value: '$2,500', icon: '💰' },
          { label: '账单号', value: 'INV-20250103-001', icon: '📋' },
          { label: '付款期限', value: '3天内', icon: '⏰' },
          { label: '催收状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' }
        ],
        notification: {
          message: '海运费账单$2,500已发送，请尽快安排付款',
          notifier: '货代公司',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 95, role: '业务员', stageId: 11, stageName: '海运跟踪', title: '转发海运费账单', action: '转发海运费账单给客户', time: '01-03 10:00', nextStepId: 96,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-01-03 10:00',
        amount: '$2,500',
        fields: [
          { label: '账单金额', value: '$2,500', icon: '💰' },
          { label: '收款方', value: '货代公司', icon: '🏢' },
          { label: '付款期限', value: '3天内', icon: '⏰' },
          { label: '转发状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' }
        ],
        notification: {
          message: '海运费账单$2,500已转发给客户',
          messageEn: 'Freight invoice $2,500 forwarded to customer',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 96, role: '客户', stageId: 11, stageName: '海运跟踪', title: '支付海运费', action: '向货代支付海运费', time: '01-04 14:00', nextStepId: 97,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-01-04 14:00',
        amount: '$2,500',
        fields: [
          { label: '付款状态', labelEn: 'Payment Status', value: '已付款', valueEn: 'Paid', status: 'completed', statusLabel: '已付款', statusLabelEn: 'Paid', statusColor: '#22C55E', icon: '💳' },
          { label: '付款金额', labelEn: 'Amount', value: '$2,500', valueEn: '$2,500', icon: '💰' },
          { label: '付款方式', labelEn: 'Method', value: '电汇', valueEn: 'Wire Transfer', icon: '🏦' }
        ],
        notification: {
          message: '已支付海运费$2,500给货代',
          messageEn: 'Freight payment $2,500 completed',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['货代']
        }
      }
    },
    
    // 阶段12：到港清关（95-100）
    { 
      id: 97, role: '货代', stageId: 12, stageName: '到港清关', title: '确认收到海运费', action: '确认收到海运费', time: '01-05 09:00', nextStepId: 98,
      status: statusConfig.completed,
      statusDetails: {
        operator: '货代公司',
        completedTime: '2025-01-05 09:00',
        amount: '$2,500',
        fields: [
          { label: '到账状态', value: '已到账', status: 'completed', statusLabel: '已到账', statusColor: '#22C55E', icon: '✅' },
          { label: '到账金额', value: '$2,500', icon: '💰' },
          { label: '到账时间', value: '2025-01-05 09:00', icon: '🕐' }
        ],
        notification: {
          message: '海运费$2,500已到账',
          notifier: '货代公司',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 98, role: '业务员', stageId: 12, stageName: '到港清关', title: '在途跟踪', action: '跟踪船期', time: '01-15 10:00', nextStepId: 99,
      status: statusConfig.in_progress,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-01-15 10:00',
        fields: [
          { label: '船舶位置', value: '太平洋航行中', icon: '🌊' },
          { label: '预计到港', value: '01-27', icon: '📅' },
          { label: '航行进度', value: '约60%', status: 'processing', statusLabel: '航行中', statusColor: '#3B82F6', icon: '🚢' }
        ],
        notification: {
          message: '船舶航行正常，预计01-27到达洛杉矶',
          notifier: '业务员张伟',
          recipients: []
        }
      }
    },
    { 
      id: 99, role: '货代', stageId: 12, stageName: '到港清关', title: '到港通知', action: '通知船已到达', time: '01-27 06:00', nextStepId: 100,
      status: statusConfig.completed,
      statusDetails: {
        operator: '货代公司',
        completedTime: '2025-01-27 06:00',
        fields: [
          { label: '到港状态', value: '已到港', status: 'completed', statusLabel: '已到港', statusColor: '#22C55E', icon: '🚢' },
          { label: '到港时间', value: '2025-01-27 06:00', icon: '🕐' },
          { label: '港口', value: '洛杉矶港', icon: '🏙️' },
          { label: '提单号', value: 'XM20250102001', icon: '📄' }
        ],
        notification: {
          message: '船已到达洛杉矶港，可安排清关',
          notifier: '货代公司',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 100, role: '业务员', stageId: 12, stageName: '到港清关', title: '通知客户到港', action: '通知客户到港', time: '01-27 09:00', nextStepId: 101,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-01-27 09:00',
        fields: [
          { label: '通知状态', value: '已发送', status: 'completed', statusLabel: '已发送', statusColor: '#10B981', icon: '📧' },
          { label: '到港时间', value: '01-27 06:00', icon: '🕐' },
          { label: '港口', value: '洛杉矶港', icon: '🏙️' },
          { label: '提单号', value: 'XM20250102001', icon: '📄' }
        ],
        notification: {
          message: '货物已到达洛杉矶港，请安排清关',
          messageEn: 'Goods arrived at LA port, please arrange customs clearance',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 101, role: '客户', stageId: 12, stageName: '到港清关', title: '安排清关', action: '联系美国报关行', time: '01-27 10:00', nextStepId: 102,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-01-27 10:00',
        fields: [
          { label: '报关行', labelEn: 'Customs Broker', value: 'LA Customs Inc.', valueEn: 'LA Customs Inc.', icon: '🏢' },
          { label: '清关准备', labelEn: 'Clearance Prep', value: '准备中', valueEn: 'Preparing', status: 'processing', statusLabel: '准备中', statusLabelEn: 'Preparing', statusColor: '#F59E0B', icon: '📋' },
          { label: '预计清关', labelEn: 'Est. Clearance', value: '01-29', valueEn: '01-29', icon: '📅' }
        ],
        notification: {
          message: '已联系美国报关行安排清关',
          messageEn: 'US customs broker contacted for clearance arrangement',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies'
        }
      }
    },
    { 
      id: 102, role: '客户', stageId: 12, stageName: '到港清关', title: '清关完成', action: '美国海关放行', time: '01-29 14:00', nextStepId: 103,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-01-29 14:00',
        fields: [
          { label: '清关状态', labelEn: 'Clearance Status', value: '已放行', valueEn: 'Cleared', status: 'approved', statusLabel: '已放行', statusLabelEn: 'Released', statusColor: '#22C55E', icon: '✅' },
          { label: '清关时间', labelEn: 'Clearance Time', value: '01-29 14:00', valueEn: '01-29 14:00', icon: '🕐' },
          { label: '关税', labelEn: 'Duty', value: '$1,250', valueEn: '$1,250', icon: '💰' },
          { label: '提柜准备', labelEn: 'Pickup Ready', value: '可以提柜', valueEn: 'Ready', status: 'approved', statusLabel: '就绪', statusLabelEn: 'Ready', statusColor: '#10B981', icon: '🚛' }
        ],
        notification: {
          message: '海关已放行，可以安排提柜',
          messageEn: 'Customs cleared, ready for container pickup',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies'
        }
      }
    },
    
    // 阶段13：客户验货与销售反馈（101-104）
    { 
      id: 103, role: '客户', stageId: 13, stageName: '客户验货', title: '提柜运输', action: '安排拖车从港口提柜', time: '01-30 09:00', nextStepId: 104,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-01-30 09:00',
        fields: [
          { label: '提柜状态', labelEn: 'Pickup Status', value: '已提柜', valueEn: 'Picked up', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#10B981', icon: '✅' },
          { label: '拖车公司', labelEn: 'Trucking Company', value: 'ABC Logistics', valueEn: 'ABC Logistics', icon: '🚛' },
          { label: '运输状态', labelEn: 'Transit Status', value: '运输中', valueEn: 'In Transit', status: 'processing', statusLabel: '运输中', statusLabelEn: 'In Transit', statusColor: '#3B82F6', icon: '🚚' },
          { label: '预计到达', labelEn: 'ETA Warehouse', value: '01-30 14:00', valueEn: '01-30 14:00', icon: '📅' }
        ],
        notification: {
          message: '已从港口提柜，正在运往仓库',
          messageEn: 'Container picked up from port, in transit to warehouse',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies'
        }
      }
    },
    { 
      id: 104, role: '客户', stageId: 13, stageName: '客户验货', title: '开柜验货', action: '开柜验货并下推反馈', time: '01-30 14:00', nextStepId: 105,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-01-30 14:00',
        fields: [
          { label: '开柜状态', labelEn: 'Unloading Status', value: '已完成', valueEn: 'Completed', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#10B981', icon: '✅' },
          { label: '验货结果', labelEn: 'Inspection Result', value: '合格', valueEn: 'Passed', status: 'approved', statusLabel: '合格', statusLabelEn: 'Passed', statusColor: '#22C55E', icon: '✅' },
          { label: '实收数量', labelEn: 'Received Qty', value: '5000件', valueEn: '5000 pcs', icon: '📦' },
          { label: '产品质量', labelEn: 'Quality', value: '优良', valueEn: 'Excellent', status: 'approved', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '⭐' },
          { label: '下推状态', labelEn: 'Push Status', value: '已下推', valueEn: 'Pushed', status: 'completed', statusLabel: '已下推至反馈', statusLabelEn: 'Pushed to Feedback', statusColor: '#F97316', icon: '➡️' }
        ],
        notification: {
          message: '开柜验货完成，产品质量优良，已下推销售反馈阶段',
          messageEn: 'Container unloaded and inspected, product quality excellent, pushed to feedback stage',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 105, role: '客户', stageId: 13, stageName: '销售反馈', title: '销售反馈', action: '下推销售反馈给业务员', time: '02-15 10:00', nextStepId: 106,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2025-02-15 10:00',
        fields: [
          { label: '销售进度', labelEn: 'Sales Progress', value: '已售80%', valueEn: '80% Sold', status: 'approved', statusLabel: '良好', statusLabelEn: 'Good', statusColor: '#22C55E', icon: '📈' },
          { label: '客户反馈', labelEn: 'Customer Feedback', value: '非常满意', valueEn: 'Very Satisfied', status: 'approved', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '⭐' },
          { label: '复购意向', labelEn: 'Reorder Intent', value: '计划复购', valueEn: 'Planning Reorder', status: 'confirmed', statusLabel: '有意向', statusLabelEn: 'Interested', statusColor: '#10B981', icon: '🔄' },
          { label: '下单预计', labelEn: 'Next Order', value: '3月份', valueEn: 'March', icon: '📅' },
          { label: '下推状态', labelEn: 'Push Status', value: '已下推', valueEn: 'Pushed', status: 'completed', statusLabel: '已下推业务员', statusLabelEn: 'Pushed to Sales Rep', statusColor: '#F97316', icon: '➡️' }
        ],
        notification: {
          message: '客户销售进展良好，已下推反馈给业务员',
          messageEn: 'Sales progressing well, feedback pushed to sales rep',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 106, role: '业务员', stageId: 13, stageName: '销售反馈', title: '记录反馈', action: '记录客户反馈', time: '02-15 11:00', nextStepId: 107,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2025-02-15 11:00',
        fields: [
          { label: '反馈记录', value: '已记录', status: 'completed', statusLabel: '已完成', statusColor: '#10B981', icon: '✅' },
          { label: '客户满意度', value: '5星好评', status: 'approved', statusLabel: '优秀', statusColor: '#22C55E', icon: '⭐' },
          { label: '跟进计划', value: '3月初联系', icon: '📅' },
          { label: '订单状态', value: '已完成', status: 'completed', statusLabel: '圆满完成', statusColor: '#22C55E', icon: '🎉' }
        ],
        notification: {
          message: '客户反馈已记录，订单圆满完成！期待下次合作',
          notifier: '业务员张伟',
          recipients: ['销售总监王总', '采购员刘刚']
        }
      }
    },
    
    // 🆕 阶段14：海运跟踪（扩展步骤107-109）
    { 
      id: 107, role: '业务员', stageId: 14, stageName: '海运跟踪', title: '开启物流追踪', action: '在系统开启海运物流追踪', time: '01-02 10:00', nextStepId: 108,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2026-01-02 10:00',
        fields: [
          { label: '追踪状态', labelEn: 'Tracking Status', value: '已开启', valueEn: 'Enabled', status: 'completed', statusLabel: '已激活', statusLabelEn: 'Activated', statusColor: '#10B981', icon: '🛰️' },
          { label: '提单号', labelEn: 'B/L No.', value: 'COSU1234567890', valueEn: 'COSU1234567890', icon: '📄' },
          { label: '船名航次', labelEn: 'Vessel/Voyage', value: 'COSCO STAR V202501', valueEn: 'COSCO STAR V202501', icon: '🚢' },
          { label: '预计到港', labelEn: 'ETA', value: '01-27', valueEn: 'Jan 27', icon: '📅' },
          { label: 'API状态', labelEn: 'API Status', value: '已连接', valueEn: 'Connected', status: 'approved', statusLabel: '正常', statusLabelEn: 'Normal', statusColor: '#22C55E', icon: '🔗' },
          { label: '更新频率', labelEn: 'Update Frequency', value: '每6小时', valueEn: 'Every 6hrs', icon: '⏱️' }
        ],
        notification: {
          message: '已开启物流追踪，系统将自动更新船期信息',
          messageEn: 'Tracking enabled, system will auto-update vessel position',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 108, role: '系统', stageId: 14, stageName: '海运跟踪', title: 'API自动更新', action: '系统自动调用船公司API更新船期', time: '01-10 02:00', nextStepId: 109,
      status: statusConfig.completed,
      statusDetails: {
        operator: '自动任务',
        completedTime: '2026-01-10 02:00',
        fields: [
          { label: 'API调用', labelEn: 'API Call', value: '成功', valueEn: 'Success', status: 'completed', statusLabel: '成功', statusLabelEn: 'Success', statusColor: '#10B981', icon: '✅' },
          { label: '当前位置', labelEn: 'Current Position', value: '太平洋中部', valueEn: 'Central Pacific', status: 'inProgress', statusLabel: '航行中', statusLabelEn: 'In Transit', statusColor: '#3B82F6', icon: '🌊' },
          { label: '经纬度', labelEn: 'Coordinates', value: '35°N, 150°W', valueEn: '35°N, 150°W', icon: '📍' },
          { label: '航行进度', labelEn: 'Progress', value: '68%', valueEn: '68%', status: 'inProgress', statusLabel: '进行中', statusLabelEn: 'In Progress', statusColor: '#3B82F6', icon: '📊' },
          { label: '预计到港', labelEn: 'ETA', value: '01-27 06:00', valueEn: 'Jan 27 06:00', icon: '📅' },
          { label: '天气状况', labelEn: 'Weather', value: '良好', valueEn: 'Good', status: 'approved', statusLabel: '正常', statusLabelEn: 'Normal', statusColor: '#22C55E', icon: '🌤️' }
        ],
        notification: {
          message: '船期更新：当前位于太平洋中部，预计01-27到达洛杉矶港',
          messageEn: 'Update: Vessel in Central Pacific, ETA LA Port Jan 27',
          notifier: '系统自动任务',
          notifierEn: 'System Auto Task',
          recipients: ['业务员张伟', '客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 109, role: '业务员', stageId: 14, stageName: '海运跟踪', title: '船期异常预警', action: '系统检测到天气延误预警', time: '01-15 08:00', nextStepId: 110,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2026-01-15 08:00',
        fields: [
          { label: '预警类型', labelEn: 'Alert Type', value: '天气延误', valueEn: 'Weather Delay', status: 'warning', statusLabel: '预警', statusLabelEn: 'Warning', statusColor: '#F59E0B', icon: '⚠️' },
          { label: '影响程度', labelEn: 'Impact', value: '轻微延误', valueEn: 'Minor Delay', status: 'warning', statusLabel: '可控', statusLabelEn: 'Controllable', statusColor: '#F97316', icon: '📉' },
          { label: '预计延误', labelEn: 'Estimated Delay', value: '1-2天', valueEn: '1-2 days', icon: '⏰' },
          { label: '新预计到港', labelEn: 'New ETA', value: '01-28或01-29', valueEn: 'Jan 28-29', icon: '📅' },
          { label: '客户通知', labelEn: 'Customer Notified', value: '已通知', valueEn: 'Notified', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#10B981', icon: '📧' },
          { label: '应对措施', labelEn: 'Action', value: '持续监控', valueEn: 'Continue Monitoring', icon: '🔍' }
        ],
        notification: {
          message: '船期预警：因太平洋风浪，预计延误1-2天到港，已通知客户',
          messageEn: 'Alert: 1-2 days delay due to Pacific weather, customer notified',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies', '销售总监王总']
        }
      }
    },
    
    // 🆕 阶段15：开票归档（步骤110-112）
    { 
      id: 110, role: '业务员', stageId: 15, stageName: '开票归档', title: '申请开票', action: '向财务申请开具增值税发票', time: '01-20 10:00', nextStepId: 111,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2026-01-20 10:00',
        fields: [
          { label: '发票类型', labelEn: 'Invoice Type', value: '增值税专用发票', valueEn: 'VAT Special Invoice', icon: '🧾' },
          { label: '开票金额', labelEn: 'Invoice Amount', value: '$25,000.00', valueEn: '$25,000.00', icon: '💰' },
          { label: '购方名称', labelEn: 'Buyer', value: 'ABC Building Supplies', valueEn: 'ABC Building Supplies', icon: '🏢' },
          { label: '申请状态', labelEn: 'Status', value: '已提交', valueEn: 'Submitted', status: 'completed', statusLabel: '已提交', statusLabelEn: 'Submitted', statusColor: '#10B981', icon: '✅' },
          { label: '发票用途', labelEn: 'Purpose', value: '货款结算', valueEn: 'Payment Settlement', icon: '📋' },
          { label: '开票备注', labelEn: 'Remarks', value: '出口退税用', valueEn: 'For Export Tax Refund', icon: '📝' }
        ],
        notification: {
          message: '已向财务申请开具增值税发票，金额$25,000',
          messageEn: 'VAT invoice requested to finance dept, amount $25,000',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['财务赵敏']
        }
      }
    },
    { 
      id: 111, role: '财务', stageId: 15, stageName: '开票归档', title: '开具发票', action: '财务开具增值税发票', time: '01-20 14:00', nextStepId: 112,
      status: statusConfig.completed,
      statusDetails: {
        operator: '赵敏',
        completedTime: '2026-01-20 14:00',
        fields: [
          { label: '发票号码', labelEn: 'Invoice No.', value: 'INV-2026-0015', valueEn: 'INV-2026-0015', icon: '🔢' },
          { label: '开票日期', labelEn: 'Invoice Date', value: '2026-01-20', valueEn: '2026-01-20', icon: '📅' },
          { label: '发票金额', labelEn: 'Amount', value: '$25,000.00', valueEn: '$25,000.00', icon: '💰' },
          { label: '税额', labelEn: 'Tax', value: '$3,250.00', valueEn: '$3,250.00', icon: '📊' },
          { label: '价税合计', labelEn: 'Total', value: '$28,250.00', valueEn: '$28,250.00', icon: '💵' },
          { label: '开票状态', labelEn: 'Status', value: '已开具', valueEn: 'Issued', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '增值税发票已开具，发票号INV-2026-0015',
          messageEn: 'VAT invoice issued, No. INV-2026-0015',
          notifier: '财务赵敏',
          notifierEn: 'Finance Zhao Min',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 112, role: '财务', stageId: 15, stageName: '开票归档', title: '订单归档', action: '财务归档订单所有单据', time: '01-20 16:00', nextStepId: 113,
      status: statusConfig.completed,
      statusDetails: {
        operator: '赵敏',
        completedTime: '2026-01-20 16:00',
        fields: [
          { label: '归档编号', labelEn: 'Archive No.', value: 'AR-2026-NA-0015', valueEn: 'AR-2026-NA-0015', icon: '📁' },
          { label: '归档文件', labelEn: 'Files', value: '12份单据', valueEn: '12 Documents', icon: '📄' },
          { label: '销售合同', labelEn: 'Sales Contract', value: '已归档', valueEn: 'Archived', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#10B981', icon: '📝' },
          { label: '采购合同', labelEn: 'Purchase Contract', value: '已归档', valueEn: 'Archived', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#10B981', icon: '📝' },
          { label: '发票提单', labelEn: 'Invoice & B/L', value: '已归档', valueEn: 'Archived', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#10B981', icon: '📄' },
          { label: '归档状态', labelEn: 'Status', value: '归档完成', valueEn: 'Archived', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '订单所有单据已归档，编号AR-2026-NA-0015',
          messageEn: 'All documents archived, No. AR-2026-NA-0015',
          notifier: '财务赵敏',
          notifierEn: 'Finance Zhao Min',
          recipients: ['业务员张伟', '销售总监王总']
        }
      }
    },
    
    // 🆕 阶段16：到港清关（扩展步骤113-115）
    { 
      id: 113, role: '货代', stageId: 16, stageName: '到港清关', title: '确认船舶到港', action: '货代确认船舶已到达洛杉矶港', time: '01-28 06:00', nextStepId: 114,
      status: statusConfig.completed,
      statusDetails: {
        operator: '远航国际货运',
        completedTime: '2026-01-28 06:00',
        fields: [
          { label: '到港时间', labelEn: 'Arrival Time', value: '01-28 06:00', valueEn: 'Jan 28 06:00', icon: '📅' },
          { label: '到港港口', labelEn: 'Port', value: '洛杉矶港', valueEn: 'Port of LA', icon: '🏙️' },
          { label: '实际延误', labelEn: 'Actual Delay', value: '1天', valueEn: '1 day', status: 'warning', statusLabel: '轻微延误', statusLabelEn: 'Minor Delay', statusColor: '#F97316', icon: '⏰' },
          { label: '船舶状态', labelEn: 'Vessel Status', value: '已靠泊', valueEn: 'Berthed', status: 'completed', statusLabel: '已到港', statusLabelEn: 'Arrived', statusColor: '#22C55E', icon: '⚓' },
          { label: '卸货时间', labelEn: 'Discharge Time', value: '预计01-28下午', valueEn: 'Est. Jan 28 PM', icon: '🚛' },
          { label: '通知状态', labelEn: 'Notification', value: '已通知', valueEn: 'Notified', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#10B981', icon: '📧' }
        ],
        notification: {
          message: '船舶已到达洛杉矶港并靠泊，预计下午开始卸货',
          messageEn: 'Vessel arrived and berthed at LA Port, discharge expected PM',
          notifier: '货代远航国际货运',
          notifierEn: 'Freight Forwarder Yuanhang',
          recipients: ['业务员张伟', '客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 114, role: '业务员', stageId: 16, stageName: '到港清关', title: '通知客户到港', action: '通知客户货物已到港并提供清关资料', time: '01-28 09:00', nextStepId: 115,
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2026-01-28 09:00',
        fields: [
          { label: '通知方式', labelEn: 'Method', value: '邮件+电话', valueEn: 'Email+Phone', icon: '📞' },
          { label: '清关资料', labelEn: 'Customs Docs', value: '已发送', valueEn: 'Sent', status: 'completed', statusLabel: '已发送', statusLabelEn: 'Sent', statusColor: '#10B981', icon: '📧' },
          { label: '提单副本', labelEn: 'B/L Copy', value: '已提供', valueEn: 'Provided', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#22C55E', icon: '📄' },
          { label: '装箱清单', labelEn: 'Packing List', value: '已提供', valueEn: 'Provided', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#22C55E', icon: '📋' },
          { label: '商业发票', labelEn: 'Commercial Invoice', value: '已提供', valueEn: 'Provided', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#22C55E', icon: '🧾' },
          { label: '客户确认', labelEn: 'Customer Confirm', value: '已确认', valueEn: 'Confirmed', status: 'approved', statusLabel: '已收到', statusLabelEn: 'Received', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '已通知客户货物到港，并发送所有清关资料',
          messageEn: 'Customer notified of arrival with all customs documents',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['客户ABC Building Supplies']
        }
      }
    },
    { 
      id: 115, role: '客户', stageId: 16, stageName: '到港清关', title: '安排清关报关', action: '客户联系美国报关行安排清关', time: '01-28 10:00', nextStepId: 116,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2026-01-28 10:00',
        fields: [
          { label: '报关行', labelEn: 'Customs Broker', value: 'LA Customs Services', valueEn: 'LA Customs Services', icon: '🏢' },
          { label: '资料提交', labelEn: 'Docs Submitted', value: '已提交', valueEn: 'Submitted', status: 'completed', statusLabel: '已提交', statusLabelEn: 'Submitted', statusColor: '#10B981', icon: '📤' },
          { label: '清关费用', labelEn: 'Customs Fee', value: '$850', valueEn: '$850', icon: '💰' },
          { label: '预计清关', labelEn: 'Est. Clearance', value: '01-29', valueEn: 'Jan 29', icon: '📅' },
          { label: '报关状态', labelEn: 'Status', value: '进行中', valueEn: 'In Progress', status: 'inProgress', statusLabel: '进行中', statusLabelEn: 'In Progress', statusColor: '#3B82F6', icon: '⏳' }
        ],
        notification: {
          message: '已联系美国报关行，预计01-29完成清关',
          messageEn: 'US customs broker contacted, clearance expected Jan 29',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    
    // 🆕 阶段17：清关单证（步骤116-117）
    { 
      id: 116, role: '客户', stageId: 17, stageName: '清关单证', title: '补充清关单证', action: '向报关行补充ISF申报等单证', time: '01-28 14:00', nextStepId: 117,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2026-01-28 14:00',
        fields: [
          { label: 'ISF申报', labelEn: 'ISF Filing', value: '已提交', valueEn: 'Submitted', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#22C55E', icon: '📋' },
          { label: '原产地证', labelEn: 'C/O', value: '已提供', valueEn: 'Provided', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#10B981', icon: '📄' },
          { label: '质检报告', labelEn: 'Quality Report', value: '已提供', valueEn: 'Provided', status: 'completed', statusLabel: '✓', statusLabelEn: '✓', statusColor: '#10B981', icon: '✅' },
          { label: 'FDA认证', labelEn: 'FDA Certification', value: 'N/A', valueEn: 'N/A', icon: '🔖' },
          { label: '补充状态', labelEn: 'Status', value: '资料齐全', valueEn: 'Complete', status: 'approved', statusLabel: '资料齐全', statusLabelEn: 'Complete', statusColor: '#22C55E', icon: '✅' }
        ],
        notification: {
          message: '清关所需单证已全部补充完成',
          messageEn: 'All required customs documents completed',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 117, role: '客户', stageId: 17, stageName: '清关单证', title: '海关审核放行', action: '美国海关审核通过并放行', time: '01-29 14:00', nextStepId: 118,
      status: statusConfig.completed,
      statusDetails: {
        operator: '美国海关',
        completedTime: '2026-01-29 14:00',
        fields: [
          { label: '审核结果', labelEn: 'Review Result', value: '通过', valueEn: 'Approved', status: 'approved', statusLabel: '审核通过', statusLabelEn: 'Approved', statusColor: '#22C55E', icon: '✅' },
          { label: '放行时间', labelEn: 'Release Time', value: '01-29 14:00', valueEn: 'Jan 29 14:00', icon: '📅' },
          { label: '关税', labelEn: 'Customs Duty', value: '$1,250', valueEn: '$1,250', icon: '💰' },
          { label: '查验情况', labelEn: 'Inspection', value: '无需查验', valueEn: 'No Inspection', status: 'approved', statusLabel: '直接放行', statusLabelEn: 'Direct Release', statusColor: '#10B981', icon: '🚀' },
          { label: '放行状态', labelEn: 'Release Status', value: '已放行', valueEn: 'Released', status: 'completed', statusLabel: '清关完成', statusLabelEn: 'Cleared', statusColor: '#22C55E', icon: '🎉' }
        ],
        notification: {
          message: '美国海关审核通过，货物已放行，可安排提柜',
          messageEn: 'US Customs cleared, goods released, ready for pickup',
          notifier: '美国海关',
          notifierEn: 'US Customs',
          recipients: ['客户ABC Building Supplies', '业务员张伟']
        }
      }
    },
    
    // 🆕 阶段18：清关反馈（步骤118-122 - 完整闭环）
    { 
      id: 118, role: '客户', stageId: 18, stageName: '清关反馈', title: '提柜运输', action: '客户安排拖车从港口提柜运往仓库', time: '01-30 09:00', nextStepId: 119,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2026-01-30 09:00',
        fields: [
          { label: '拖车公司', labelEn: 'Trucking Co.', value: 'LA Express Trucking', valueEn: 'LA Express Trucking', icon: '🚛' },
          { label: '提柜时间', labelEn: 'Pickup Time', value: '01-30 09:00', valueEn: 'Jan 30 09:00', icon: '📅' },
          { label: '目的地', labelEn: 'Destination', value: '客户仓库', valueEn: 'Customer Warehouse', icon: '🏭' },
          { label: '运输距离', labelEn: 'Distance', value: '45英里', valueEn: '45 miles', icon: '📏' },
          { label: '预计到达', labelEn: 'ETA', value: '01-30 11:30', valueEn: 'Jan 30 11:30', icon: '⏰' },
          { label: '运输状态', labelEn: 'Status', value: '运输中', valueEn: 'In Transit', status: 'inProgress', statusLabel: '进行中', statusLabelEn: 'In Progress', statusColor: '#3B82F6', icon: '🚛' }
        ],
        notification: {
          message: '已安排拖车提柜，预计11:30到达仓库',
          messageEn: 'Trucking arranged, ETA warehouse 11:30',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 119, role: '客户', stageId: 18, stageName: '清关反馈', title: '到达仓库开柜', action: '货物到达仓库并开柜验货', time: '01-30 11:30', nextStepId: 120,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2026-01-30 11:30',
        fields: [
          { label: '到达时间', labelEn: 'Arrival Time', value: '01-30 11:30', valueEn: 'Jan 30 11:30', icon: '📅' },
          { label: '开柜时间', labelEn: 'Opening Time', value: '01-30 12:00', valueEn: 'Jan 30 12:00', icon: '⏰' },
          { label: '验货人员', labelEn: 'Inspector', value: 'John Smith', valueEn: 'John Smith', icon: '👨‍💼' },
          { label: '货物状态', labelEn: 'Condition', value: '完好无损', valueEn: 'Good Condition', status: 'approved', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '✅' },
          { label: '数量核对', labelEn: 'Qty Check', value: '5000件全收', valueEn: '5000 pcs Complete', status: 'completed', statusLabel: '准确', statusLabelEn: 'Accurate', statusColor: '#10B981', icon: '📦' },
          { label: '验货结果', labelEn: 'Result', value: '验收合格', valueEn: 'Accepted', status: 'approved', statusLabel: '合格', statusLabelEn: 'Qualified', statusColor: '#22C55E', icon: '🎉' }
        ],
        notification: {
          message: '货物已到达仓库并开柜验货，5000件全收无损',
          messageEn: 'Goods arrived and inspected, 5000 pcs complete and intact',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 120, role: '客户', stageId: 18, stageName: '清关反馈', title: '正式验收确认', action: '客户正式验收确认并签署验收单', time: '01-30 14:00', nextStepId: 121,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2026-01-30 14:00',
        fields: [
          { label: '验收单号', labelEn: 'Acceptance No.', value: 'ACC-2026-0015', valueEn: 'ACC-2026-0015', icon: '📋' },
          { label: '签署人', labelEn: 'Signatory', value: 'Michael Johnson', valueEn: 'Michael Johnson', icon: '✍️' },
          { label: '签署时间', labelEn: 'Sign Time', value: '01-30 14:00', valueEn: 'Jan 30 14:00', icon: '📅' },
          { label: '验收结果', labelEn: 'Result', value: '验收合格', valueEn: 'Qualified', status: 'approved', statusLabel: '合格', statusLabelEn: 'Qualified', statusColor: '#22C55E', icon: '✅' },
          { label: '质量评价', labelEn: 'Quality Rating', value: '5星优秀', valueEn: '5-Star Excellent', status: 'approved', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '⭐' },
          { label: '验收状态', labelEn: 'Status', value: '正式验收完成', valueEn: 'Officially Accepted', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#22C55E', icon: '🎉' }
        ],
        notification: {
          message: '客户正式验收确认，质量评价5星优秀',
          messageEn: 'Customer officially accepted, 5-star excellent rating',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟', '销售总监王总']
        }
      }
    },
    { 
      id: 121, role: '客户', stageId: 18, stageName: '清关反馈', title: '上架销售反馈', action: '客户开始上架销售并提供市场反馈', time: '02-05 10:00', nextStepId: 122,
      status: statusConfig.completed,
      statusDetails: {
        operator: 'ABC Building Supplies',
        completedTime: '2026-02-05 10:00',
        fields: [
          { label: '上架时间', labelEn: 'Listing Time', value: '02-01', valueEn: 'Feb 1', icon: '📅' },
          { label: '销售渠道', labelEn: 'Sales Channel', value: '线上+线下', valueEn: 'Online+Offline', icon: '🛒' },
          { label: '销售进度', labelEn: 'Sales Progress', value: '已售20%', valueEn: '20% Sold', status: 'inProgress', statusLabel: '良好', statusLabelEn: 'Good', statusColor: '#3B82F6', icon: '📈' },
          { label: '客户反馈', labelEn: 'Customer Feedback', value: '非常满意', valueEn: 'Very Satisfied', status: 'approved', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '⭐' },
          { label: '复购意向', labelEn: 'Reorder Intent', value: '强烈意向', valueEn: 'Strong Intent', status: 'confirmed', statusLabel: '有意向', statusLabelEn: 'Interested', statusColor: '#10B981', icon: '🔄' },
          { label: '预计复购', labelEn: 'Next Order', value: '3月份8000件', valueEn: 'March 8000pcs', icon: '📅' }
        ],
        notification: {
          message: '产品销售良好，客户满意度高，预计3月复购8000件',
          messageEn: 'Sales going well, high satisfaction, next order 8000pcs in March',
          notifier: '客户ABC Building Supplies',
          notifierEn: 'Customer ABC Building Supplies',
          recipients: ['业务员张伟']
        }
      }
    },
    { 
      id: 122, role: '业务员', stageId: 18, stageName: '清关反馈', title: '记录反馈并跟进', action: '业务员记录客户反馈并制定复购计划', time: '02-05 11:00',
      status: statusConfig.completed,
      statusDetails: {
        operator: '张伟',
        completedTime: '2026-02-05 11:00',
        fields: [
          { label: '反馈记录', labelEn: 'Feedback Record', value: '已记录', valueEn: 'Recorded', status: 'completed', statusLabel: '已完成', statusLabelEn: 'Completed', statusColor: '#10B981', icon: '✅' },
          { label: '客户满意度', labelEn: 'Satisfaction', value: '5星优秀', valueEn: '5-Star Excellent', status: 'approved', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '⭐' },
          { label: '订单评价', labelEn: 'Order Rating', value: '圆满成功', valueEn: 'Perfect Success', status: 'completed', statusLabel: '优秀', statusLabelEn: 'Excellent', statusColor: '#22C55E', icon: '🎉' },
          { label: '复购计划', labelEn: 'Reorder Plan', value: '3月联系', valueEn: 'Contact in March', status: 'pending', statusLabel: '计划中', statusLabelEn: 'Planned', statusColor: '#3B82F6', icon: '📅' },
          { label: '跟进提醒', labelEn: 'Follow-up', value: '已设置', valueEn: 'Set', status: 'completed', statusLabel: '已设置', statusLabelEn: 'Set', statusColor: '#10B981', icon: '🔔' },
          { label: '流程状态', labelEn: 'Process Status', value: '完整闭环', valueEn: 'Complete Loop', status: 'completed', statusLabel: '🎊 圆满完成', statusLabelEn: '🎊 Perfectly Completed', statusColor: '#22C55E', icon: '🎊' }
        ],
        notification: {
          message: '🎊 订单完整流程圆满完成！客户满意度5星，期待3月复购合作！',
          messageEn: '🎊 Complete order process finished perfectly! 5-star satisfaction, looking forward to March reorder!',
          notifier: '业务员张伟',
          notifierEn: 'Sales Rep Zhang Wei',
          recipients: ['销售总监王总', '采购员刘刚', '财务赵敏', '客户ABC Building Supplies']
        }
      }
    },
];

// 🔥 可拖拽字段组件
interface DraggableFieldProps {
  field: StatusField;
  index: number;
  isEditMode: boolean;
  pinnedStep: Step;
  updateStep: (id: number, updates: Partial<Step>) => void;
  getFieldText: (field: StatusField, role: string, key: 'label' | 'value' | 'statusLabel') => string;
  moveField: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  index,
  isEditMode,
  pinnedStep,
  updateStep,
  getFieldText,
  moveField,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 🔥 智能宽度计算：根据字段标签和值的长度决定宽度
  const calculateFieldWidth = () => {
    const label = getFieldText(field, pinnedStep.role, 'label').toLowerCase();
    const value = getFieldText(field, pinnedStep.role, 'value');
    
    // 超短字段：Seq.#, No., Unit 等
    const veryShortFields = ['seq', 'no.', 'unit', '#'];
    if (veryShortFields.some(keyword => label.includes(keyword) && label.length < 10)) {
      return 'min-w-[80px] max-w-[100px]';
    }
    
    // 短字段：Qty, Price, Amount 等
    const shortFields = ['qty', 'quantity', 'price', 'amount', 'model', 'unit price', 'total'];
    if (shortFields.some(keyword => label.includes(keyword))) {
      return 'min-w-[100px] max-w-[140px]';
    }
    
    // 中等字段：Date, Status 等
    const mediumFields = ['date', 'status', 'time', 'name', 'number', 'code'];
    if (mediumFields.some(keyword => label.includes(keyword))) {
      return 'min-w-[120px] max-w-[160px]';
    }
    
    // 长字段：Description, Remarks, Comments 等
    const longFields = ['description', 'remark', 'comment', 'note', 'specification'];
    if (longFields.some(keyword => label.includes(keyword)) || value.length > 50) {
      return 'min-w-[200px] max-w-[400px] flex-grow';
    }
    
    // 默认宽度
    return 'min-w-[120px] max-w-[180px]';
  };

  const [{ handlerId }, drop] = useDrop({
    accept: 'FIELD',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      moveField(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'FIELD',
    item: () => {
      return { index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const widthClass = calculateFieldWidth();

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`space-y-1 p-2 bg-white rounded border border-gray-200 hover:border-orange-300 transition-colors cursor-move ${widthClass} ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {isEditMode ? (
        <>
          {/* 字段名（可编辑） */}
          <Input
            value={field.label}
            onChange={(e) => {
              const newFields = [...(pinnedStep.statusDetails?.fields || [])];
              newFields[index] = { ...field, label: e.target.value };
              updateStep(pinnedStep.id, {
                statusDetails: { ...pinnedStep.statusDetails, fields: newFields },
              });
            }}
            className="text-xs h-6 border-gray-300 font-medium"
            placeholder="字段名"
          />
          {/* 字段值（可编辑） */}
          <Input
            value={field.value}
            onChange={(e) => {
              const newFields = [...(pinnedStep.statusDetails?.fields || [])];
              newFields[index] = { ...field, value: e.target.value };
              updateStep(pinnedStep.id, {
                statusDetails: { ...pinnedStep.statusDetails, fields: newFields },
              });
            }}
            className="text-xs h-6 border-gray-300"
            placeholder="字段值"
          />
          {/* 删除按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newFields = pinnedStep.statusDetails?.fields?.filter((_, i) => i !== index) || [];
              updateStep(pinnedStep.id, {
                statusDetails: { ...pinnedStep.statusDetails, fields: newFields },
              });
            }}
            className="text-red-600 hover:text-red-700 h-5 text-xs w-full"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            删除
          </Button>
        </>
      ) : (
        <>
          {/* 字段名（只读） - 仅显示文本，不显示图标 */}
          <label className="text-xs text-gray-500 font-medium truncate block">
            {getFieldText(field, pinnedStep.role, 'label')}
          </label>
          {/* 字段值（只读） */}
          <div className="text-xs font-medium text-gray-900 break-words">
            {getFieldText(field, pinnedStep.role, 'value')}
          </div>
          {/* 状态标签 */}
          {field.status && field.statusLabel && (
            <Badge
              className="text-xs px-1.5 py-0.5 h-auto"
              style={{
                backgroundColor: field.statusColor || '#3B82F6',
                color: '#FFFFFF',
              }}
            >
              {getFieldText(field, pinnedStep.role, 'statusLabel')}
            </Badge>
          )}
        </>
      )}
    </div>
  );
};

export function FullProcessSandboxV5() {
  // 🔥 初始化供应商库和客户-业务员关系库（仅在首次加载时执行）
  useEffect(() => {
    initSupplierStore();
    initCustomerSalesRepMapping();
    
    // 在控制台显示当前映射关系摘要
    console.log('📋 ' + getMappingSummary());
  }, []);

  // 使用导出的步骤数据函数
  const allSteps: Step[] = getAllSteps(statusConfig);

  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 🔥 从localStorage恢复全屏状态
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fullProcessDemoV5_isFullscreen');
      return saved === 'true';
    }
    return false;
  });
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 全屏模式的独立缩放和平移状态（默认放大1.2倍）- 从localStorage恢复
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fullProcessDemoV5_fullscreenZoom');
      return saved ? Number(saved) : 1.2;
    }
    return 1.2;
  });
  const [fullscreenPan, setFullscreenPan] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fullProcessDemoV5_fullscreenPan');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
  // 🔥 固定显示步骤详情状态（点击上下步时触发，点击其他地方时隐藏）
  // 🔥 从localStorage恢复弹窗状态
  const [pinnedStepId, setPinnedStepId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fullProcessDemoV5_pinnedStepId');
      return saved ? Number(saved) : null;
    }
    return null;
  });

  // 🔥 弹窗拖曳相关状态 - 从localStorage恢复位置
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fullProcessDemoV5_popupPosition');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [isPopupDragging, setIsPopupDragging] = useState(false);
  const [popupDragStart, setPopupDragStart] = useState({ x: 0, y: 0 });

  // 🔥 弹窗尺寸调整相关状态（调整为更大的默认尺寸，约占屏幕80-85%）
  const [popupSize, setPopupSize] = useState<{ width: number; height: number }>({ 
    width: Math.min(window.innerWidth * 0.85, 1600), 
    height: Math.min(window.innerHeight * 0.85, 950) 
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 🔥 新增：编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 🔥 从 localStorage 加载或初始化步骤数据
  const [editedSteps, setEditedSteps] = useState<Step[]>(() => {
    // 🔥 版本号 - 当数据结构变化时递增此版本号，强制重新加载
    const CURRENT_VERSION = '2.9_persist_ui_state'; // 刷新页面后保持弹窗、全屏等UI状态不变
    
    // 尝试从 localStorage 加载
    if (typeof window !== 'undefined') {
      const savedVersion = localStorage.getItem('fullProcessDemoV5_version');
      const saved = localStorage.getItem('fullProcessDemoV5_steps');
      
      // 如果版本不匹配，清除旧数据
      if (savedVersion !== CURRENT_VERSION) {
        console.log('数据版本不匹配，清除旧数据并重新加载');
        localStorage.removeItem('fullProcessDemoV5_steps');
        localStorage.setItem('fullProcessDemoV5_version', CURRENT_VERSION);
      } else if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('加载保存的数据失败:', e);
        }
      }
    }
    
    // 如果没有保存的数据，使用初始数据
    return allSteps.map(step => ({
      ...step,
      statusDetails: step.statusDetails ? {
        ...step.statusDetails,
        notification: step.statusDetails.notification ? {
          ...step.statusDetails.notification,
          notifier: step.statusDetails.notification.notifier || step.statusDetails.operator || '',
          recipients: step.statusDetails.notification.recipients || [], // 保留原有的recipients或设置为空
        } : undefined
      } : undefined
    }));
  });

  // 🔥 自动保存到 localStorage（每次 editedSteps 变化时）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fullProcessDemoV5_steps', JSON.stringify(editedSteps));
    }
  }, [editedSteps]);

  // 🔥 保存弹窗状态到localStorage（刷新页面后保持弹窗不变）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (pinnedStepId !== null) {
        localStorage.setItem('fullProcessDemoV5_pinnedStepId', String(pinnedStepId));
      } else {
        localStorage.removeItem('fullProcessDemoV5_pinnedStepId');
      }
    }
  }, [pinnedStepId]);

  // 🔥 保存弹窗位置到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (popupPosition !== null) {
        localStorage.setItem('fullProcessDemoV5_popupPosition', JSON.stringify(popupPosition));
      } else {
        localStorage.removeItem('fullProcessDemoV5_popupPosition');
      }
    }
  }, [popupPosition]);

  // 🔥 保存全屏状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fullProcessDemoV5_isFullscreen', String(isFullscreen));
    }
  }, [isFullscreen]);

  // 🔥 保存全屏缩放级别到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fullProcessDemoV5_fullscreenZoom', String(fullscreenZoom));
    }
  }, [fullscreenZoom]);

  // 🔥 保存全屏平移位置到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fullProcessDemoV5_fullscreenPan', JSON.stringify(fullscreenPan));
    }
  }, [fullscreenPan]);

  // 🔥 新增：模拟视角角色选择（用于演示不同角色看到的语言）
  const [viewerRole, setViewerRole] = useState<string>('业务员'); // 默认以业务员视角

  // 🔥 转换人员列表为按角色分组（使用新的带区域信息的人员列表 + 动态供应商）
  const groupedPersonnel = React.useMemo(() => {
    const allPersonnel = getAllPersonnelWithSuppliers(); // 🔥 获取包含动态供应商的完整人员列表
    const grouped: Record<string, Personnel[]> = {};
    allPersonnel.forEach(person => {
      if (!grouped[person.role]) {
        grouped[person.role] = [];
      }
      grouped[person.role].push(person);
    });
    return grouped;
  }, []); // 🔥 注意：供应商库从localStorage读取，首次渲染后不会变化

  // 🔥 更新步骤数据函数
  const updateStep = (stepId: number, updates: Partial<Step>) => {
    setEditedSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  // 🔥 移动字段位置函数（拖拽后自动保存）
  const moveField = (stepId: number, dragIndex: number, hoverIndex: number) => {
    setEditedSteps(prevSteps =>
      prevSteps.map(step => {
        if (step.id === stepId && step.statusDetails?.fields) {
          const newFields = [...step.statusDetails.fields];
          const draggedField = newFields[dragIndex];
          newFields.splice(dragIndex, 1);
          newFields.splice(hoverIndex, 0, draggedField);
          
          return {
            ...step,
            statusDetails: {
              ...step.statusDetails,
              fields: newFields,
            },
          };
        }
        return step;
      })
    );
  };

  // 🔥 获取上下游步骤
  const getUpstreamSteps = (stepId: number) => {
    return editedSteps.filter(s => s.nextStepId === stepId);
  };

  const getDownstreamSteps = (stepId: number) => {
    const step = editedSteps.find(s => s.id === stepId);
    return step?.nextStepId ? editedSteps.filter(s => s.id === step.nextStepId) : [];
  };

  // 🔥 判断是否为客户角色（客户端显示英文）
  const isCustomerRole = (role: string) => role === '客户';

  // 🔥 获取字段显示文本（根据步骤角色判断语言）
  // 核心原则：客户角色的步骤始终显示英文，其他角色显示中文
  const getFieldText = (field: StatusField, role: string, key: 'label' | 'value' | 'statusLabel') => {
    // 如果是客户角色的步骤，显示英文
    if (isCustomerRole(role)) {
      if (key === 'label') return field.labelEn || field.label;
      if (key === 'value') return field.valueEn || field.value;
      if (key === 'statusLabel') return field.statusLabelEn || field.statusLabel;
    }
    // 其他角色显示中文
    if (key === 'label') return field.label;
    if (key === 'value') return field.value;
    if (key === 'statusLabel') return field.statusLabel;
    return '';
  };

  // 🔥 获取通知显示文本（根据通知发送方、接收方和当前视角判断语言）
  // 规则：
  // 1. 客户发出的通知 → 接收人（其他角色）看英文
  // 2. 其他角色发给客户的通知 → 客户看英文
  // 3. 非客户之间互发的通知 → 都看中文
  const getNotificationText = (
    notification: { message: string; messageEn?: string; notifier: string; notifierEn?: string; recipients?: string[] },
    key: 'message' | 'notifier',
    stepRole?: string,  // 当前步骤的角色，用于辅助判断
    stepTitle?: string  // 🔥 新增：步骤标题，用于动态生成通知内容
  ) => {
    // 判断通知人是否是客户角色
    // 如果通知人字段包含客户相关信息，或者步骤角色是客户
    const isNotifierCustomer = isCustomerRole(notification.notifier) || (stepRole && isCustomerRole(stepRole));
    const isViewerCustomer = isCustomerRole(viewerRole);
    
    // 判断被通知人中是否有客户
    const hasCustomerRecipient = notification.recipients?.some(r => isCustomerRole(r)) || false;
    
    // 判断是否应该显示英文
    let shouldShowEnglish = false;
    
    // 规则1: 客户发出的通知 → 接收人（其他角色）看英文
    if (isNotifierCustomer && !isViewerCustomer) {
      shouldShowEnglish = true;
    }
    
    // 规则2: 其他角色发给客户的通知 → 客户看英文
    if (!isNotifierCustomer && isViewerCustomer) {
      shouldShowEnglish = true;
    }
    
    // 规则2补充: 其他角色发给客户的通知，如果被通知人中有客户，内部员工查看时也应该能看到对应的英文版本
    if (!isNotifierCustomer && hasCustomerRecipient && !isViewerCustomer) {
      // 内部员工查看发给客户的通知时，显示中文（这是给内部看的）
      shouldShowEnglish = false;
    }
    
    // 规则3: 客户之间互发（理论上不存在，但为了安全）
    if (isNotifierCustomer && isViewerCustomer) {
      shouldShowEnglish = true;
    }
    
    // 返回对应语言的文本
    if (key === 'message') {
      // 🔥 优先级1：如果用户已经输入了自定义内容，直接使用
      if (notification.message && notification.message.trim() !== '') {
        return shouldShowEnglish && notification.messageEn ? notification.messageEn : notification.message;
      }
      
      // 🔥 优先级2：动态生成通知内容（当没有自定义内容时）
      if (notification.recipients && notification.recipients.length > 0) {
        // 获取步骤对应的通知标题
        const notificationTitle = stepTitle && stepNotificationTitles[stepTitle];
        const titleText = shouldShowEnglish 
          ? notificationTitle?.en 
          : notificationTitle?.zh;
        
        // 动态生成通知内容
        return generateNotificationMessage(
          notification.notifier,
          notification.recipients,
          titleText,
          shouldShowEnglish ? 'en' : 'zh'
        );
      }
      
      // Fallback: 如果既没有自定义内容，也没有被通知人，返回空字符串
      return '';
    }
    
    if (key === 'notifier') {
      // 通知人名字根据语言返回对应版本
      if (shouldShowEnglish && notification.notifierEn) {
        return notification.notifierEn;
      }
      return notification.notifier;
    }
    
    return '';
  };

  // 🔥 渲染弹窗的辅助变量
  const pinnedStep = pinnedStepId ? editedSteps.find(s => s.id === pinnedStepId) : null;
  const pinnedRoleInfo = pinnedStep ? roles.find(r => r.name === pinnedStep.role) : null;
  const pinnedUpstreamSteps = pinnedStepId ? getUpstreamSteps(pinnedStepId) : [];
  const pinnedDownstreamSteps = pinnedStepId ? getDownstreamSteps(pinnedStepId) : [];
  const popupDefaultX = typeof window !== 'undefined' ? window.innerWidth / 2 - popupSize.width / 2 : 0;
  const popupDefaultY = typeof window !== 'undefined' ? window.innerHeight / 2 - popupSize.height / 2 : 0;
  const popupPosX = popupPosition?.x ?? popupDefaultX;
  const popupPosY = popupPosition?.y ?? popupDefaultY;

  // 自动播放
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 104) {
          setIsPlaying(false);
          return 104;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isPlaying]);
  
  // 🔥 全屏拖拽事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - fullscreenPan.x,
      y: e.clientY - fullscreenPan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isFullscreen) return;
    setFullscreenPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 重置全屏缩放和平移
  const resetFullscreenView = () => {
    setFullscreenZoom(1);
    setFullscreenPan({ x: 0, y: 0 });
  };

  // 🔥 弹窗拖曳事件处理
  const handlePopupMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopupDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePopupMouseMove = (e: React.MouseEvent) => {
    if (!isPopupDragging) return;
    e.preventDefault();
    setPopupPosition({
      x: e.clientX - popupDragStart.x,
      y: e.clientY - popupDragStart.y,
    });
  };

  const handlePopupMouseUp = () => {
    setIsPopupDragging(false);
  };

  // 监听全局鼠标事件（用于弹窗拖曳）
  useEffect(() => {
    if (isPopupDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        setPopupPosition({
          x: e.clientX - popupDragStart.x,
          y: e.clientY - popupDragStart.y,
        });
      };
      const handleGlobalMouseUp = () => {
        setIsPopupDragging(false);
      };
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isPopupDragging, popupDragStart]);

  // 🔥 新增：键盘快捷键支持（左右箭头切换步骤）
  useEffect(() => {
    if (!pinnedStepId) return; // 只有弹窗打开时才监听键盘
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 左箭头 - 上一步
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevStepId = pinnedStepId - 1;
        if (prevStepId >= 1) {
          setPinnedStepId(prevStepId);
          setCurrentStep(prevStepId);
        }
      }
      // 右箭头 - 下一步
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextStepId = pinnedStepId + 1;
        if (nextStepId <= 104) {
          setPinnedStepId(nextStepId);
          setCurrentStep(nextStepId);
        }
      }
      // Escape - 关闭弹窗
      else if (e.key === 'Escape') {
        e.preventDefault();
        setPinnedStepId(null);
        setPopupPosition(null);
        setIsEditMode(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pinnedStepId]);

  // 🔥 新增：Mac鼠标手势支持（左右滑动切换步骤）
  useEffect(() => {
    if (!pinnedStepId) return; // 只有弹窗打开时才监听滑动

    let lastSwipeTime = 0;
    const SWIPE_COOLDOWN = 300; // 防抖间隔（毫秒）
    const SWIPE_THRESHOLD = 30; // 滑动阈值，避免误触

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      
      // 防抖：如果距离上次滑动不到cooldown时间，则忽略
      if (now - lastSwipeTime < SWIPE_COOLDOWN) {
        return;
      }

      // 检测横向滑动（Mac触控板/Magic Mouse的左右滑动会触发deltaX）
      const deltaX = e.deltaX;
      
      // 向左滑动（deltaX < 0）- 上一步
      if (deltaX < -SWIPE_THRESHOLD) {
        e.preventDefault();
        const prevStepId = pinnedStepId - 1;
        if (prevStepId >= 1) {
          setPinnedStepId(prevStepId);
          setCurrentStep(prevStepId);
          lastSwipeTime = now;
        }
      }
      // 向右滑动（deltaX > 0）- 下一步
      else if (deltaX > SWIPE_THRESHOLD) {
        e.preventDefault();
        const nextStepId = pinnedStepId + 1;
        if (nextStepId <= 104) {
          setPinnedStepId(nextStepId);
          setCurrentStep(nextStepId);
          lastSwipeTime = now;
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [pinnedStepId]);

  // 🔥 弹窗尺寸调整事件处理
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: popupSize.width,
      height: popupSize.height,
    });
  };

  // 监听全局鼠标事件（用于弹窗尺寸调整）
  useEffect(() => {
    if (isResizing) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        setPopupSize({
          width: Math.max(300, resizeStart.width + deltaX), // 最小宽度300px
          height: Math.max(400, resizeStart.height + deltaY), // 最小高度400px
        });
      };
      const handleGlobalMouseUp = () => {
        setIsResizing(false);
      };
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isResizing, resizeStart]);

  // 计算步骤位置
  const getStepPosition = (step: Step): { x: number; y: number } => {
    const roleIndex = roles.findIndex(r => r.name === step.role);
    const stageIndex = step.stageId - 1;
    
    // 计算该阶段中的步骤序号
    const stepsInStage = allSteps.filter(s => s.stageId === step.stageId);
    const stepIndexInStage = stepsInStage.findIndex(s => s.id === step.id);
    
    // 🔥 列宽缩小30%：从200改为140
    const stageWidth = 140;
    // 🔥 角色行高：49 * 1.2 = 59（增加20%）
    const roleHeight = 59;
    
    // 🔥 修复：确保步骤均匀分布在阶段内，左右留白20px
    const stepsCount = stepsInStage.length;
    const padding = 20; // 阶段内左右留白
    const availableWidth = stageWidth - padding * 2; // 可用宽度 = 140 - 40 = 100
    const stepSpacing = availableWidth / (stepsCount + 1); // 均匀分布间距
    
    const x = 200 + stageIndex * stageWidth + padding + stepSpacing * (stepIndexInStage + 1);
    
    // 🔥 如果同一位置有多个步骤，在垂直方向上微调，避免完全重叠
    const stepsAtSamePosition = allSteps.filter(s => 
      s.stageId === step.stageId && s.role === step.role
    );
    const positionIndex = stepsAtSamePosition.findIndex(s => s.id === step.id);
    const verticalOffset = positionIndex * 6; // 每个步骤向下偏移6px，避免圆圈重叠
    
    const y = 120 + roleIndex * roleHeight + roleHeight / 2 + verticalOffset;
    
    return { x, y };
  };

  // 绘制连接线（支持聚焦高亮）
  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    
    editedSteps.forEach(step => {
      if (!step.nextStepId) return;
      if (step.id > currentStep) return; // 只显示当前步骤之前的连线
      
      const nextStep = editedSteps.find(s => s.id === step.nextStepId);
      if (!nextStep) return;
      
      const start = getStepPosition(step);
      const end = getStepPosition(nextStep);
      
      // 🔥 判断是否是聚焦步骤的上下游连线
      const isRelated = pinnedStepId && (
        step.id === pinnedStepId || 
        step.nextStepId === pinnedStepId ||
        (pinnedStepId && editedSteps.find(s => s.id === pinnedStepId)?.nextStepId === step.id)
      );
      
      // 🔥 判断是否是最后三步的连接线（102-103, 103-104）
      const isFinalSteps = (step.id === 102 && step.nextStepId === 103) || 
                          (step.id === 103 && step.nextStepId === 104);
      
      // 计算箭头方向
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      
      // 箭头大小
      const arrowSize = 8;
      const arrowX = end.x - Math.cos(angle) * 30;
      const arrowY = end.y - Math.sin(angle) * 30;
      
      // 🔥 优先显示聚焦高亮，其次显示所有已完成步骤的连线为橙色，最后三步强制橙色
      const isPassed = step.id < currentStep && nextStep.id <= currentStep; // 两端都已完成
      const isActive = step.id === currentStep - 1;
      const shouldHighlight = isRelated || isPassed || isFinalSteps;
      const lineColor = isRelated ? '#F97316' : (isPassed || isFinalSteps ? '#F97316' : '#CBD5E1');
      const lineWidth = isRelated ? 3 : (isPassed || isFinalSteps ? 2.5 : 2);
      const opacity = pinnedStepId && !isRelated ? 0.3 : 1;
      
      // 计算中点位置
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      lines.push(
        <g key={`line-${step.id}-to-${step.nextStepId}`}>
          {/* 连接线：分成两段，中间放箭头 */}
          <line
            x1={start.x}
            y1={start.y}
            x2={midX}
            y2={midY}
            stroke={lineColor}
            strokeWidth={lineWidth}
            className={shouldHighlight ? 'transition-all duration-300' : ''}
            opacity={opacity}
          />
          <line
            x1={midX}
            y1={midY}
            x2={end.x}
            y2={end.y}
            stroke={lineColor}
            strokeWidth={lineWidth}
            markerStart={`url(#arrowhead-mid-${shouldHighlight ? 'active' : 'normal'})`}
            className={shouldHighlight ? 'transition-all duration-300' : ''}
            opacity={opacity}
          />
        </g>
      );
    });
    
    return lines;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="cursor-pointer select-none"
              onDoubleClick={() => setIsFullscreen(true)}
              title="双击标题进入全屏模式"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🏊 全流程泳道图 V5
              </h1>
              <p className="text-gray-600">
                104个步骤 · 14个角色 · 13个阶段 · 箭头连接展示流程趋势
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                variant={isPlaying ? 'destructive' : 'default'}
                size="sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    播放
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                当前步骤: {currentStep} / 104
              </span>
              <span className="text-sm text-gray-600">
                {allSteps[currentStep - 1]?.title}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(currentStep / 104) * 100}%` }}
              />
            </div>
          </div>

          {/* 控制栏 */}
          <div className="flex items-center gap-4">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const newStep = Math.max(1, currentStep - 1);
                setCurrentStep(newStep);
                setPinnedStepId(newStep);
              }}
              variant="outline"
              size="sm"
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const newStep = Math.min(102, currentStep + 1);
                setCurrentStep(newStep);
                setPinnedStepId(newStep);
              }}
              variant="outline"
              size="sm"
              disabled={currentStep === 104}
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                variant="outline"
                size="sm"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                variant="outline"
                size="sm"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsFullscreen(true)}
                variant="outline"
                size="sm"
                title="全屏展示"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setZoomLevel(0.5)}
                variant="outline"
                size="sm"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 泳道图主体 */}
        <Card className="p-6 overflow-auto bg-white shadow-xl">
          <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
            <svg
              ref={svgRef}
              width="2300"
              height="995"
              className="border border-gray-200 rounded-lg"
              onClick={() => setPinnedStepId(null)}
            >
              {/* 定义箭头 */}
              <defs>
                <marker
                  id="arrowhead-normal"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#CBD5E1" />
                </marker>
                <marker
                  id="arrowhead-active"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#F97316" />
                </marker>
                {/* 中间箭头标记 */}
                <marker
                  id="arrowhead-mid-normal"
                  markerWidth="8"
                  markerHeight="8"
                  refX="4"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 2, 6 4, 0 6" fill="#CBD5E1" />
                </marker>
                <marker
                  id="arrowhead-mid-active"
                  markerWidth="8"
                  markerHeight="8"
                  refX="4"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 2, 6 4, 0 6" fill="#F97316" />
                </marker>
              </defs>

              {/* 背景 - 点击背景区域清除弹窗 */}
              <rect
                x="0"
                y="0"
                width="2300"
                height="995"
                fill="transparent"
                onClick={() => setPinnedStepId(null)}
                style={{ cursor: 'default' }}
              />

              {/* 阶段头部 */}
              {stages.map((stage, index) => (
                <g key={stage.id}>
                  <rect
                    x={200 + index * 140}
                    y={20}
                    width={140}
                    height={80}
                    fill={stage.color}
                    rx="8"
                    opacity="0.9"
                  />
                  <text
                    x={200 + index * 140 + 70}
                    y={50}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {stage.name}
                  </text>
                  <text
                    x={200 + index * 140 + 70}
                    y={75}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                  >
                    {stage.stepCount}步
                  </text>
                </g>
              ))}

              {/* 角色泳道 */}
              {roles.map((role, index) => (
                <g key={role.id}>
                  {/* 泳道背景 */}
                  <rect
                    x="0"
                    y={120 + index * 59}
                    width="2300"
                    height="59"
                    fill={index % 2 === 0 ? '#F8FAFC' : '#FFFFFF'}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  
                  {/* 角色标签 */}
                  <rect
                    x="10"
                    y={125 + index * 59}
                    width="170"
                    height="47"
                    fill={role.color}
                    rx="8"
                  />
                  <text
                    x="95"
                    y={151 + index * 59}
                    textAnchor="middle"
                    fill="white"
                    fontSize="16"
                    fontWeight="bold"
                  >
                    {role.icon} {role.name}
                  </text>
                </g>
              ))}

              {/* 连接线 */}
              {renderConnections()}

              {/* 步骤圆圈 */}
              {allSteps.map(step => {
                const pos = getStepPosition(step);
                const roleInfo = roles.find(r => r.name === step.role);
                const isActive = step.id === currentStep;
                const isPassed = step.id < currentStep;
                
                return (
                  <g key={step.id} className="group">
                    {/* 步骤圆圈 - 减少20% */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isActive ? 14.4 : 12.8}
                      fill={isActive ? '#F97316' : isPassed ? roleInfo?.color : '#E2E8F0'}
                      stroke={isActive ? '#FB923C' : '#CBD5E1'}
                      strokeWidth={isActive ? 2 : 1.2}
                      className={isActive ? 'animate-pulse cursor-pointer' : 'cursor-pointer'}
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡到SVG
                        setCurrentStep(step.id);
                        setPinnedStepId(step.id); // 点击圆圈时也固定显示弹窗
                      }}
                    />
                    {/* 🔥 状态指示外环 */}
                    {step.status && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isActive ? 18.4 : 16}
                        fill="none"
                        stroke={step.status.color}
                        strokeWidth="1.6"
                        strokeDasharray="2,2"
                        className="opacity-80"
                      />
                    )}
                    {/* 步骤编号 */}
                    <text
                      x={pos.x}
                      y={pos.y + 5}
                      textAnchor="middle"
                      fill={isActive || isPassed ? 'white' : '#64748B'}
                      fontSize={isActive ? '14' : '13'}
                      fontWeight="bold"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡到SVG
                        setCurrentStep(step.id);
                        setPinnedStepId(step.id); // 点击文字时也固定显示弹窗
                      }}
                    >
                      {step.id}
                    </text>
                    {/* 🔥 状态图标 - 显示在圆圈右上角 */}
                    {step.status && (
                      <text
                        x={pos.x + 10}
                        y={pos.y - 8}
                        textAnchor="middle"
                        fontSize="10"
                        className="pointer-events-none"
                      >
                        {step.status.icon}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        {/* 🔥 可拖动的浮动弹窗 - 只在固定显示时出现（增强版：带可编辑功能）*/}
        {pinnedStep && (
          <div
            style={{
              position: 'fixed',
              left: `${popupPosX}px`,
              top: `${popupPosY}px`,
                zIndex: 9999,
                cursor: isPopupDragging ? 'grabbing' : 'default',
              }}
              onMouseUp={handlePopupMouseUp}
            >
              <div 
                className="bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden relative"
                style={{ width: `${popupSize.width}px`, height: `${popupSize.height}px` }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 可拖动的标题栏 - 紧凑设计 */}
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 cursor-grab active:cursor-grabbing flex items-center justify-between select-none"
                  onMouseDown={handlePopupMouseDown}
                  title="按住拖动此标题栏可以移动弹窗位置"
                >
                  <div className="flex items-center gap-3 text-white">
                    {/* 🔥 新增：上一步按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const prevStepId = pinnedStepId! - 1;
                        if (prevStepId >= 1) {
                          setPinnedStepId(prevStepId);
                          setCurrentStep(prevStepId);
                        }
                      }}
                      disabled={pinnedStepId === 1}
                      className="text-white hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="上一步 (键盘: ← 或 Mac鼠标向左滑动)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: pinnedRoleInfo?.color }}
                    >
                      {pinnedStep.id}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{pinnedStep.role} - {pinnedStep.stageName}</span>
                      <span className="text-xs opacity-90">
                        {isEditMode ? '✏️ 编辑模式' : '👆 点击箭头 / ⌨️ 键盘 / 🖱️ 滑动鼠标 切换步骤'}
                      </span>
                    </div>
                    
                    {/* 🔥 新增：下一步按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStepId = pinnedStepId! + 1;
                        if (nextStepId <= 104) {
                          setPinnedStepId(nextStepId);
                          setCurrentStep(nextStepId);
                        }
                      }}
                      disabled={pinnedStepId === 104}
                      className="text-white hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="下一步 (键盘: → 或 Mac鼠标向右滑动)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 🔥 视角切换器 */}
                    <Select
                      value={viewerRole}
                      onValueChange={(value) => {
                        setViewerRole(value);
                      }}
                    >
                      <SelectTrigger 
                        className="h-8 w-32 text-xs text-white bg-white/10 border-white/30 hover:bg-white/20 focus:ring-white/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name} className="text-xs">
                            {role.icon} {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditMode) {
                          // 保存逻辑
                          console.log('保存步骤数据:', pinnedStep);
                        }
                        setIsEditMode(!isEditMode);
                      }}
                      className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      title={isEditMode ? '保存并退出编辑' : '进入编辑模式'}
                    >
                      {isEditMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedStepId(null);
                        setPopupPosition(null);
                        setPopupSize({ 
                          width: Math.min(window.innerWidth * 0.85, 1600), 
                          height: Math.min(window.innerHeight * 0.85, 950) 
                        }); // 重置弹窗尺寸为默认大尺寸
                        setIsEditMode(false);
                      }}
                      className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      title="关闭弹窗"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 弹窗内容 */}
                <div className="overflow-y-auto" style={{ height: `${popupSize.height - 55}px` }}>
                  {/* 状态栏 - 紧凑化：py-2.5 → py-1.5 */}
                  <div
                    className="px-4 py-1.5 border-b border-gray-200"
                    style={{ background: `linear-gradient(135deg, ${pinnedRoleInfo?.color}15 0%, ${pinnedRoleInfo?.color}05 100%)` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className="text-white text-xs"
                        style={{ backgroundColor: pinnedRoleInfo?.color }}
                      >
                        {pinnedStep.role}
                      </Badge>
                      {pinnedStep.status && (
                        <Badge
                          className="text-white text-xs"
                          style={{ backgroundColor: pinnedStep.status.color }}
                        >
                          {pinnedStep.status.icon} {pinnedStep.status.label}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {pinnedStep.time} • {pinnedStep.statusDetails?.operator || '-'}
                    </div>
                  </div>

                  <div className="p-3 space-y-3">{/* 紧凑化：p-4 space-y-4 → p-3 space-y-3 */}
                    {/* 基本信息 - 台湾大厂两列式布局 */}
                    <div>
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-orange-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <h4 className="font-semibold text-gray-900 text-sm">基本信息</h4>
                        </div>
                        {!isEditMode && (
                          <button
                            onClick={() => setIsEditMode(true)}
                            className="text-orange-600 hover:text-orange-700 text-xs flex items-center gap-1 px-2 py-1 hover:bg-orange-50 rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            编辑
                          </button>
                        )}
                      </div>
                      {/* 列式布局：标签在上，内容在下 - 所有标签在同一行 - 紧凑化 */}
                      <div className="px-2 py-1.5 bg-gray-50/50 rounded">{/* 紧凑化：px-3 py-2 → px-2 py-1.5 */}
                        {/* 列标题行 - 紧凑化 */}
                        <div className="grid grid-cols-4 gap-3 mb-1.5">{/* 紧凑化：gap-4 mb-2 → gap-3 mb-1.5 */}
                          <label className="text-xs text-gray-600 font-semibold">执行人</label>
                          <label className="text-xs text-gray-600 font-semibold">步骤名称</label>
                          <label className="text-xs text-gray-600 font-semibold">执行动作</label>
                          <label className="text-xs text-gray-600 font-semibold flex items-center gap-1">表单编号</label>
                        </div>
                        {/* 内容行 - 紧凑化 */}
                        <div className="grid grid-cols-4 gap-3">{/* 紧凑化：gap-4 → gap-3 */}
                        {/* 执行人列 - 紧凑化 */}
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-blue-600 py-1">{pinnedStep.role}</div>
                        </div>
                        
                        {/* 步骤名称列 - 紧凑化 */}
                        <div className="space-y-1">
                          {isEditMode ? (
                            <Input
                              value={pinnedStep.title}
                              onChange={(e) => updateStep(pinnedStep.id, { title: e.target.value })}
                              className="text-sm h-7 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900 py-1">{pinnedStep.title}</div>
                          )}
                        </div>
                        
                        {/* 执行动作列 - 紧凑化 */}
                        <div className="space-y-1">
                          {isEditMode ? (
                            <Textarea
                              value={pinnedStep.action}
                              onChange={(e) => updateStep(pinnedStep.id, { action: e.target.value })}
                              className="text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[50px]"
                              rows={2}
                            />
                          ) : (
                            <div className="text-sm text-gray-700 leading-snug py-1">{pinnedStep.action}</div>
                          )}
                        </div>
                        
                        {/* 表单编号列 - 紧凑化 */}
                        <div className="space-y-1">
                          {pinnedStep.documentType ? (
                            <div className="space-y-1 bg-amber-50/50 rounded border border-amber-200/50 p-1.5">
                              <Badge 
                                className="text-white text-xs px-1.5 py-0.5"
                                style={{ backgroundColor: documentTypeConfig[pinnedStep.documentType]?.color }}
                              >
                                {documentTypeConfig[pinnedStep.documentType]?.icon} {documentTypeConfig[pinnedStep.documentType]?.name}
                              </Badge>
                              <div className="text-sm font-mono font-medium text-gray-900">{pinnedStep.documentNo}</div>
                              <span className="text-xs text-amber-600">🔒 已锁定</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 py-1">-</div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>

                    {/* 表单字段编辑器 - 台湾大厂风格 - 紧凑化 */}
                    {pinnedStep.statusDetails?.fields && pinnedStep.statusDetails.fields.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-orange-200">{/* 紧凑化：mb-2 pb-1.5 → mb-1.5 pb-1 */}
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            <h4 className="font-semibold text-gray-900 text-sm">
                              表单字段
                            </h4>
                          </div>
                          {isEditMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newField: StatusField = {
                                  label: '新字段',
                                  value: '',
                                  icon: '📝',
                                };
                                updateStep(pinnedStep.id, {
                                  statusDetails: {
                                    ...pinnedStep.statusDetails,
                                    fields: [...(pinnedStep.statusDetails?.fields || []), newField],
                                  },
                                });
                              }}
                              className="text-orange-600 hover:text-orange-700 h-6 text-xs hover:bg-orange-50 px-2"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              添加
                            </Button>
                          )}
                        </div>
                        {/* 列式布局：字段名在上，字段值在下 - 横向展开，根据内容智能调整宽度 - 支持拖拽排序 - 紧凑化 */}
                        <DndProvider backend={HTML5Backend}>
                          <div className="flex flex-wrap gap-2 px-2 py-1.5 bg-gray-50/50 rounded">{/* 紧凑化：gap-3 px-3 py-2 → gap-2 px-2 py-1.5 */}
                            {pinnedStep.statusDetails.fields.map((field, index) => (
                              <DraggableField
                                key={index}
                                field={field}
                                index={index}
                                isEditMode={isEditMode}
                                pinnedStep={pinnedStep}
                                updateStep={updateStep}
                                getFieldText={getFieldText}
                                moveField={(dragIndex, hoverIndex) => moveField(pinnedStep.id, dragIndex, hoverIndex)}
                              />
                            ))}
                          </div>
                        </DndProvider>
                      </div>
                    )}

                    {/* 通知信息编辑器 - 紧凑化 */}
                    {pinnedStep.statusDetails?.notification && (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-orange-200">{/* 紧凑化：mb-2 pb-1.5 → mb-1.5 pb-1 */}
                          <Bell className="w-4 h-4 text-orange-600" />
                          <h4 className="font-semibold text-gray-900 text-sm">
                            通知信息
                          </h4>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 px-2 py-0.5">
                            🤖 系统自动触发
                          </Badge>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-200 rounded p-2">{/* 紧凑化：p-3 → p-2 */}
                          {/* 列标题行 - 紧凑化 */}
                          <div className="grid grid-cols-3 gap-3 mb-1.5">{/* 紧凑化：gap-4 mb-2 → gap-3 mb-1.5 */}
                            <label className="text-xs text-gray-600 font-semibold">
                              触发人
                            </label>
                            <label className="text-xs text-gray-600 font-semibold">
                              被通知人
                            </label>
                            <label className="text-xs text-gray-600 font-semibold">
                              通知内容
                            </label>
                          </div>
                          {/* 内容行 - 紧凑化 */}
                          <div className="grid grid-cols-3 gap-3">{/* 紧凑化：gap-4 → gap-3 */}
                            {/* 通知人列 - 多选复选框模式 */}
                            <div className="space-y-1">
                            {/* 已选通知人标签显示 */}
                            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 border border-dashed border-gray-300 rounded bg-gray-50">
                              {(() => {
                                const currentNotifiers = Array.isArray(pinnedStep.statusDetails.notification.notifier) 
                                  ? pinnedStep.statusDetails.notification.notifier 
                                  : (pinnedStep.statusDetails.notification.notifier ? [pinnedStep.statusDetails.notification.notifier] : []);
                                
                                if (currentNotifiers.length === 0) {
                                  return <span className="text-xs text-gray-400">暂无通知人</span>;
                                }
                                
                                return currentNotifiers.map((notifier, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="default"
                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white pl-2 pr-1 py-0.5 flex items-center gap-1"
                                  >
                                    <span>{notifier}</span>
                                    <button
                                      type="button"
                                      className="w-3.5 h-3.5 flex items-center justify-center cursor-pointer hover:bg-red-600 rounded-full transition-colors ml-0.5"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newNotifiers = currentNotifiers.filter((_, i) => i !== idx);
                                        updateStep(pinnedStep.id, {
                                          statusDetails: {
                                            ...pinnedStep.statusDetails,
                                            notification: {
                                              ...pinnedStep.statusDetails?.notification!,
                                              notifier: newNotifiers,
                                            },
                                          },
                                        });
                                      }}
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </Badge>
                                ));
                              })()}
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="text-xs h-7 w-full justify-start border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <Users className="w-3 h-3 mr-1.5" />
                                  {pinnedStep.statusDetails.notification.notifier 
                                    ? `已选 ${Array.isArray(pinnedStep.statusDetails.notification.notifier) ? pinnedStep.statusDetails.notification.notifier.length : 1} 人`
                                    : '选择触发人'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[500px] p-3 z-[9999]" align="start">
                                <div className="space-y-3">
                                  {/* 标题和全选/清空按钮 */}
                                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900">选择触发人</h4>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs h-6 px-2"
                                        onClick={() => {
                                          // 🔥 全选所有人员（包含动态供应商）
                                          const allPersons = getAllPersonnelWithSuppliers().map(p => p.displayName || p.name);
                                          updateStep(pinnedStep.id, {
                                            statusDetails: {
                                              ...pinnedStep.statusDetails,
                                              notification: {
                                                ...pinnedStep.statusDetails?.notification!,
                                                notifier: allPersons,
                                              },
                                            },
                                          });
                                        }}
                                      >
                                        全选
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs h-6 px-2"
                                        onClick={() => {
                                          // 清空选择
                                          updateStep(pinnedStep.id, {
                                            statusDetails: {
                                              ...pinnedStep.statusDetails,
                                              notification: {
                                                ...pinnedStep.statusDetails?.notification!,
                                                notifier: [],
                                              },
                                            },
                                          });
                                        }}
                                      >
                                        清空
                                      </Button>
                                    </div>
                                  </div>

                                  {/* 人员列表 - 2列网格布局 */}
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-[400px] overflow-y-auto">
                                    {Object.entries(groupedPersonnel).map(([roleName, persons]) => (
                                      <div key={roleName} className="space-y-1.5">
                                        {/* 角色标题 */}
                                        <div className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1.5 rounded sticky top-0 shadow-sm">
                                          {roles.find(r => r.name === roleName)?.icon} {roleName}
                                        </div>
                                        {/* 人员复选框列表 */}
                                        {persons.map((person) => {
                                          const personName = person.displayName || person.name;
                                          const currentNotifiers = Array.isArray(pinnedStep.statusDetails.notification.notifier) 
                                            ? pinnedStep.statusDetails.notification.notifier 
                                            : (pinnedStep.statusDetails.notification.notifier ? [pinnedStep.statusDetails.notification.notifier] : []);
                                          const isChecked = currentNotifiers.includes(personName);
                                          
                                          return (
                                            <div 
                                              key={personName}
                                              className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 rounded cursor-pointer"
                                              onClick={() => {
                                                const newNotifiers = isChecked
                                                  ? currentNotifiers.filter(r => r !== personName)
                                                  : [...currentNotifiers, personName];
                                                
                                                updateStep(pinnedStep.id, {
                                                  statusDetails: {
                                                    ...pinnedStep.statusDetails,
                                                    notification: {
                                                      ...pinnedStep.statusDetails?.notification!,
                                                      notifier: newNotifiers,
                                                    },
                                                  },
                                                });
                                              }}
                                            >
                                              <Checkbox 
                                                checked={isChecked}
                                                className="h-3.5 w-3.5"
                                              />
                                              <span className="text-xs text-gray-900">{personName}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>

                                  {/* 已选人员预览 */}
                                  {(() => {
                                    const currentNotifiers = Array.isArray(pinnedStep.statusDetails.notification.notifier) 
                                      ? pinnedStep.statusDetails.notification.notifier 
                                      : (pinnedStep.statusDetails.notification.notifier ? [pinnedStep.statusDetails.notification.notifier] : []);
                                    
                                    return currentNotifiers.length > 0 && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <div className="text-xs text-gray-600 mb-1.5">
                                          已选择 {currentNotifiers.length} 人：
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {currentNotifiers.map((notifier, idx) => (
                                            <Badge 
                                              key={idx} 
                                              variant="outline" 
                                              className="text-xs"
                                            >
                                              {notifier}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* 被通知人列 - 多选复选框模式 */}
                          <div className="space-y-1">
                            {/* 已选被通知人标签显示 */}
                            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 border border-dashed border-gray-300 rounded bg-gray-50">
                              {pinnedStep.statusDetails.notification.recipients && pinnedStep.statusDetails.notification.recipients.length > 0 ? (
                                pinnedStep.statusDetails.notification.recipients.map((recipient, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="default"
                                    className="text-xs bg-green-500 hover:bg-green-600 text-white pl-2 pr-1 py-0.5 flex items-center gap-1"
                                  >
                                    <span>{recipient}</span>
                                    <button
                                      type="button"
                                      className="w-3.5 h-3.5 flex items-center justify-center cursor-pointer hover:bg-red-600 rounded-full transition-colors ml-0.5"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const currentRecipients = pinnedStep.statusDetails?.notification?.recipients || [];
                                        const newRecipients = currentRecipients.filter((_, i) => i !== idx);
                                        updateStep(pinnedStep.id, {
                                          statusDetails: {
                                            ...pinnedStep.statusDetails,
                                            notification: {
                                              ...pinnedStep.statusDetails?.notification!,
                                              recipients: newRecipients,
                                            },
                                          },
                                        });
                                      }}
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">暂无被通知人</span>
                              )}
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="text-xs h-7 w-full justify-start border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <Users className="w-3 h-3 mr-1.5" />
                                  {pinnedStep.statusDetails.notification.recipients && pinnedStep.statusDetails.notification.recipients.length > 0 
                                    ? `已选 ${pinnedStep.statusDetails.notification.recipients.length} 人`
                                    : '选择被通知人'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[500px] p-3 z-[9999]" align="start">
                                <div className="space-y-3">
                                  {/* 标题和全选/清空按钮 */}
                                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-900">选择被通知人</h4>
                                      {pinnedStep.id === 1 && (() => {
                                        const currentNotifiers = pinnedStep.statusDetails?.notification?.notifier || [];
                                        if (currentNotifiers.length > 0) {
                                          const firstNotifier = personnelList.find(p => 
                                            (p.displayName || p.name) === currentNotifiers[0]
                                          );
                                          if (firstNotifier?.region) {
                                            return (
                                              <p className="text-xs text-blue-600 mt-0.5">
                                                🌍 仅显示{firstNotifier.displayName?.match(/\((.+?)\)/)?.[1] || ''}的业务员
                                              </p>
                                            );
                                          }
                                        }
                                        return null;
                                      })()}
                                    </div>
                                    <div className="flex gap-2">
                                      {/* 🔥 步骤1：添加快速分配按钮 */}
                                      {pinnedStep.id === 1 && (() => {
                                        const currentNotifiers = pinnedStep.statusDetails?.notification?.notifier || [];
                                        if (currentNotifiers.length > 0) {
                                          const firstNotifier = personnelList.find(p => 
                                            (p.displayName || p.name) === currentNotifiers[0]
                                          );
                                          if (firstNotifier?.region) {
                                            return (
                                              <Button
                                                size="sm"
                                                variant="default"
                                                className="text-xs h-6 px-2 bg-orange-500 hover:bg-orange-600 text-white"
                                                onClick={() => {
                                                  // 智能分配：选择负载最低的业务员
                                                  const { recommended, all } = getRecommendedSalesRep(firstNotifier.region as Region, 'least_load');
                                                  updateStep(pinnedStep.id, {
                                                    statusDetails: {
                                                      ...pinnedStep.statusDetails,
                                                      notification: {
                                                        ...pinnedStep.statusDetails?.notification!,
                                                        recipients: recommended,
                                                        isRecommended: true,
                                                      },
                                                    },
                                                  });
                                                }}
                                              >
                                                ⚡ 快速分配
                                              </Button>
                                            );
                                          }
                                        }
                                        return null;
                                      })()}
                                      
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs h-6 px-2"
                                        onClick={() => {
                                          // 🔥 区域匹配：步骤1需要根据通知人的区域过滤被通知人
                                          let filteredPersons: string[];
                                          
                                          if (pinnedStep.id === 1) {
                                            // 步骤1：客户询价，客户和业务员需要区域匹配
                                            const currentNotifiers = pinnedStep.statusDetails?.notification?.notifier || [];
                                            if (currentNotifiers.length > 0) {
                                              const firstNotifier = personnelList.find(p => 
                                                (p.displayName || p.name) === currentNotifiers[0]
                                              );
                                              const notifierRegion = firstNotifier?.region;
                                              
                                              filteredPersons = personnelList
                                                .filter(p => p.role === '业务员' && p.region === notifierRegion)
                                                .map(p => p.displayName || p.name);
                                            } else {
                                              filteredPersons = [];
                                            }
                                          } else {
                                            // 🔥 其他步骤：显示所有人员（包含动态供应商）
                                            filteredPersons = getAllPersonnelWithSuppliers().map(p => p.displayName || p.name);
                                          }
                                          
                                          updateStep(pinnedStep.id, {
                                            statusDetails: {
                                              ...pinnedStep.statusDetails,
                                              notification: {
                                                ...pinnedStep.statusDetails?.notification!,
                                                recipients: filteredPersons,
                                              },
                                            },
                                          });
                                        }}
                                      >
                                        全选
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs h-6 px-2"
                                        onClick={() => {
                                          // 清空选择
                                          updateStep(pinnedStep.id, {
                                            statusDetails: {
                                              ...pinnedStep.statusDetails,
                                              notification: {
                                                ...pinnedStep.statusDetails?.notification!,
                                                recipients: [],
                                              },
                                            },
                                          });
                                        }}
                                      >
                                        清空
                                      </Button>
                                    </div>
                                  </div>

                                  {/* 🔥 步骤1：智能推荐组件 */}
                                  {pinnedStep.id === 1 && (
                                    <Step1SmartRecommendation
                                      selectedCustomers={Array.isArray(pinnedStep.statusDetails.notification.notifier) 
                                        ? pinnedStep.statusDetails.notification.notifier 
                                        : (pinnedStep.statusDetails.notification.notifier ? [pinnedStep.statusDetails.notification.notifier] : [])}
                                      onRecipientsRecommend={(recipients) => {
                                        updateStep(pinnedStep.id, {
                                          statusDetails: {
                                            ...pinnedStep.statusDetails,
                                            notification: {
                                              ...pinnedStep.statusDetails?.notification!,
                                              recipients: recipients,
                                            },
                                          },
                                        });
                                      }}
                                    />
                                  )}

                                  {/* 人员列表 - 2列网格布局 */}
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-[400px] overflow-y-auto">
                                    {(() => {
                                      // 🔥 步骤1区域匹配过滤逻辑
                                      let filteredGroupedPersonnel = groupedPersonnel;
                                      
                                      if (pinnedStep.id === 1) {
                                        const currentNotifiers = pinnedStep.statusDetails?.notification?.notifier || [];
                                        
                                        if (currentNotifiers.length > 0) {
                                          const firstNotifier = personnelList.find(p => 
                                            (p.displayName || p.name) === currentNotifiers[0]
                                          );
                                          const notifierRegion = firstNotifier?.region;
                                          
                                          const filteredPersonnel = personnelList.filter(p => 
                                            p.role === '业务员' && p.region === notifierRegion
                                          );
                                          
                                          filteredGroupedPersonnel = {};
                                          filteredPersonnel.forEach(person => {
                                            if (!filteredGroupedPersonnel[person.role]) {
                                              filteredGroupedPersonnel[person.role] = [];
                                            }
                                            filteredGroupedPersonnel[person.role].push(person);
                                          });
                                        } else {
                                          return (
                                            <div className="col-span-2 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
                                              ⚠️ 请先选择通知人（客户），系统将根据客户所在区域自动匹配对应区域的业务员
                                            </div>
                                          );
                                        }
                                      }
                                      
                                      return Object.entries(filteredGroupedPersonnel).map(([roleName, persons]) => (
                                        <div key={roleName} className="space-y-1.5">
                                          {/* 角色标题 */}
                                          <div className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1.5 rounded sticky top-0 shadow-sm">
                                            {roles.find(r => r.name === roleName)?.icon} {roleName}
                                          </div>
                                          {/* 人员复选框列表 */}
                                          {persons.map((person) => {
                                            const personName = person.displayName || person.name;
                                            const isChecked = pinnedStep.statusDetails.notification.recipients?.includes(personName) || false;
                                          
                                          // 🔥 获取负载信息
                                            const workloadInfo = person.workload !== undefined ? getWorkloadLevel(person.workload) : null;
                                            
                                            return (
                                            <div 
                                              key={personName}
                                              className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 rounded cursor-pointer"
                                              onClick={() => {
                                                const currentRecipients = pinnedStep.statusDetails?.notification?.recipients || [];
                                                const newRecipients = isChecked
                                                  ? currentRecipients.filter(r => r !== personName)
                                                  : [...currentRecipients, personName];
                                                
                                                updateStep(pinnedStep.id, {
                                                  statusDetails: {
                                                    ...pinnedStep.statusDetails,
                                                    notification: {
                                                      ...pinnedStep.statusDetails?.notification!,
                                                      recipients: newRecipients,
                                                    },
                                                  },
                                                });
                                              }}
                                            >
                                              <Checkbox 
                                                checked={isChecked}
                                                className="h-3.5 w-3.5"
                                              />
                                              <div className="flex-1 flex items-center justify-between gap-2">
                                                <span className="text-xs text-gray-900">{personName}</span>
                                                {workloadInfo && (
                                                  <Badge 
                                                    variant="outline"
                                                    className="text-xs px-1.5 py-0 h-5"
                                                    style={{ 
                                                      backgroundColor: workloadInfo.bgColor,
                                                      color: workloadInfo.color,
                                                      borderColor: workloadInfo.color
                                                    }}
                                                  >
                                                    {workloadInfo.icon} {person.workload}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      ));
                                    })()}
                                  </div>

                                  {/* 已选人员预览 */}
                                  {pinnedStep.statusDetails.notification.recipients && pinnedStep.statusDetails.notification.recipients.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200">
                                      <div className="text-xs text-gray-600 mb-1.5">
                                        已选择 {pinnedStep.statusDetails.notification.recipients.length} 人：
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {pinnedStep.statusDetails.notification.recipients.map((recipient, idx) => (
                                          <Badge 
                                            key={idx} 
                                            variant="outline" 
                                            className="text-xs"
                                          >
                                            {recipient}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* 通知内容列 */}
                          <div className="space-y-1">
                            {isEditMode ? (
                              <Textarea
                                value={pinnedStep.statusDetails.notification.message}
                                onChange={(e) => {
                                  updateStep(pinnedStep.id, {
                                    statusDetails: {
                                      ...pinnedStep.statusDetails,
                                      notification: {
                                        ...pinnedStep.statusDetails?.notification!,
                                        message: e.target.value,
                                      },
                                    },
                                  });
                                }}
                                className="text-xs w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                rows={2}
                                placeholder="输入通知内容（中文）"
                              />
                            ) : (
                              <div className="text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded p-2">
                                {getNotificationText(pinnedStep.statusDetails.notification, 'message', pinnedStep.role, pinnedStep.title)}
                              </div>
                            )}
                          </div>
                          </div>

                          {/* 🔥 智能推荐和保存按钮 */}
                          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-blue-200">
                            {/* 智能推荐按钮 */}
                            {pinnedStep.statusDetails.notification.notifier && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 flex-1 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                                onClick={() => {
                                  const recommended = getRecommendedRecipients(pinnedStep.statusDetails.notification.notifier);
                                  if (recommended.length > 0) {
                                    updateStep(pinnedStep.id, {
                                      statusDetails: {
                                        ...pinnedStep.statusDetails,
                                        notification: {
                                          ...pinnedStep.statusDetails?.notification!,
                                          recipients: recommended,
                                          isRecommended: true,
                                          isSaved: false,
                                        },
                                      },
                                    });
                                  }
                                }}
                              >
                                <Bell className="w-3 h-3 mr-1" />
                                智能推荐
                              </Button>
                            )}

                            {/* 保存通知规则按钮 */}
                            <Button
                              size="sm"
                              variant={pinnedStep.statusDetails.notification.isSaved ? 'outline' : 'default'}
                              className={`text-xs h-7 flex-1 ${
                                pinnedStep.statusDetails.notification.isSaved
                                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                              }`}
                              onClick={() => {
                                updateStep(pinnedStep.id, {
                                  statusDetails: {
                                    ...pinnedStep.statusDetails,
                                    notification: {
                                      ...pinnedStep.statusDetails?.notification!,
                                      isSaved: true,
                                    },
                                  },
                                });
                              }}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              {pinnedStep.statusDetails.notification.isSaved 
                                ? '✓ 已保存'
                                : '保存规则'
                              }
                            </Button>
                          </div>

                          {/* 🔥 智能推荐提示 */}
                          {pinnedStep.statusDetails.notification.isRecommended && !pinnedStep.statusDetails.notification.isSaved && (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                              <Bell className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>
                                已根据区域自动推荐被通知人，点击"保存规则"确认。
                              </span>
                            </div>
                          )}

                          {/* 🔥 已保存提示 */}
                          {pinnedStep.statusDetails.notification.isSaved && (
                            <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                              <Save className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>
                                {isCustomerRole(viewerRole) 
                                  ? 'Notification rule saved. You can still modify it anytime.'
                                  : '通知规则已保存，您仍可随时修改。'
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 上下游关系展示 - 台湾大厂风格 - 紧凑化 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-orange-200">{/* 紧凑化：mb-2 pb-1.5 → mb-1.5 pb-1 */}
                        <Users className="w-4 h-4 text-orange-600" />
                        <h4 className="font-semibold text-gray-900 text-sm">流程关系</h4>
                      </div>
                      {/* 列式布局：上游、当前、下游 - 紧凑化 */}
                      <div className="px-2 py-1.5 bg-gray-50 bg-opacity-50 rounded">{/* 紧凑化：py-2 → py-1.5 */}
                        {/* 列标题行 - 紧凑化 */}
                        <div className="grid grid-cols-3 gap-2 mb-1.5">{/* 紧凑化：gap-3 mb-2 → gap-2 mb-1.5 */}
                          <label className="text-xs text-gray-600 font-semibold">⬆️ 上游步骤</label>
                          <label className="text-xs text-gray-600 font-semibold">📍 当前步骤</label>
                          <label className="text-xs text-gray-600 font-semibold">⬇️ 下游步骤</label>
                        </div>
                        {/* 内容行 - 紧凑化 */}
                        <div className="grid grid-cols-3 gap-2">{/* 紧凑化：gap-3 → gap-2 */}
                        {/* 上游步骤列 - 紧凑化 */}
                        <div className="space-y-1.5">{/* 紧凑化：space-y-2 → space-y-1.5 */}
                          {pinnedUpstreamSteps.length > 0 ? (
                            <div className="space-y-1 bg-purple-50 bg-opacity-30 p-1.5 rounded">
                              {pinnedUpstreamSteps.map((upStep) => {
                                const upRoleInfo = roles.find((r) => r.name === upStep.role);
                                return (
                                  <div
                                    key={upStep.id}
                                    className="flex items-center gap-2 py-1 px-1.5 bg-white border border-purple-200 rounded cursor-pointer hover:border-purple-400 hover:shadow-sm transition-all"
                                    onClick={() => {
                                      setPinnedStepId(upStep.id);
                                      setCurrentStep(upStep.id);
                                    }}
                                  >
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                      style={{ backgroundColor: upRoleInfo?.color }}
                                    >
                                      {upStep.id}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-gray-900 truncate leading-tight">{upStep.title}</div>
                                      <div className="text-xs text-gray-500 leading-tight">{upStep.role}</div>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 text-center py-2">无上游</div>
                          )}
                        </div>

                        {/* 当前步骤列 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-600 rounded shadow-sm w-full justify-center">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                                style={{ backgroundColor: pinnedRoleInfo?.color }}
                              >
                                {pinnedStep.id}
                              </div>
                              <span className="text-xs font-semibold text-white truncate">{pinnedStep.title}</span>
                            </div>
                          </div>
                        </div>

                        {/* 下游步骤列 */}
                        <div className="space-y-2">
                          {pinnedDownstreamSteps.length > 0 ? (
                            <div className="space-y-1 bg-green-50 bg-opacity-30 p-1.5 rounded">
                              {pinnedDownstreamSteps.map((downStep) => {
                                const downRoleInfo = roles.find((r) => r.name === downStep.role);
                                return (
                                  <div
                                    key={downStep.id}
                                    className="flex items-center gap-2 py-1 px-1.5 bg-white border border-green-200 rounded cursor-pointer hover:border-green-400 hover:shadow-sm transition-all"
                                    onClick={() => {
                                      setPinnedStepId(downStep.id);
                                      setCurrentStep(downStep.id);
                                    }}
                                  >
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                      style={{ backgroundColor: downRoleInfo?.color }}
                                    >
                                      {downStep.id}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-gray-900 truncate leading-tight">{downStep.title}</div>
                                      <div className="text-xs text-gray-500 leading-tight">{downStep.role}</div>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-green-400 flex-shrink-0" />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 text-center py-2">无下游</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 备注信息 - 台湾大厂风格 - 紧凑化 */}
                    {pinnedStep.statusDetails?.remarks && (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-orange-200">{/* 紧凑化：mb-2 pb-1.5 → mb-1.5 pb-1 */}
                          <FileText className="w-4 h-4 text-orange-600" />
                          <h4 className="font-semibold text-gray-900 text-sm">备注信息</h4>
                        </div>
                        {isEditMode ? (
                          <Textarea
                            value={pinnedStep.statusDetails.remarks}
                            onChange={(e) => {
                              updateStep(pinnedStep.id, {
                                statusDetails: {
                                  ...pinnedStep.statusDetails,
                                  remarks: e.target.value,
                                },
                              });
                            }}
                            className="text-xs border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            rows={2}
                          />
                        ) : (
                          <div className="text-xs text-gray-700 bg-yellow-50/50 border border-yellow-200 rounded p-1.5 leading-snug">{/* 紧凑化：p-2 → p-1.5 */}
                            {pinnedStep.statusDetails.remarks}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 编号规则说明 - 仅当有编号时显示 - 紧凑化 */}
                    {pinnedStep.documentType && (
                      <div className="mt-2 pt-2 border-t-2 border-orange-200">{/* 紧凑化：mt-3 pt-3 → mt-2 pt-2 */}
                        <div className="flex items-center gap-2 mb-1.5">{/* 紧凑化：mb-2 → mb-1.5 */}
                          <Hash className="w-4 h-4 text-orange-600" />
                          <h5 className="font-semibold text-gray-900 text-sm">📋 编号规则逻辑体系</h5>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-2 space-y-1.5">{/* 紧凑化：p-2.5 space-y-2 → p-2 space-y-1.5 */}
                          {/* 编号格式 - 紧凑化 */}
                          <div className="bg-white rounded p-1.5 border border-orange-200 space-y-0.5">{/* 紧凑化：p-2 space-y-1 → p-1.5 space-y-0.5 */}
                            <div className="flex items-start gap-2 text-xs mb-0.5">{/* 紧凑化：mb-1 → mb-0.5 */}
                              <span className="text-orange-600 font-semibold w-20 flex-shrink-0">编号格式:</span>
                              <span className="text-gray-900 font-mono font-bold">[类型]-[年份]-[区域]-[流水号]</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-gray-500 w-20 flex-shrink-0">当前编号:</span>
                              <span className="text-blue-700 font-mono font-bold">{pinnedStep.documentNo}</span>
                            </div>
                          </div>
                          
                          {/* 业务逻辑说明 - 紧凑化 */}
                          <div className="space-y-1">{/* 紧凑化：space-y-1.5 → space-y-1 */}
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-gray-600 font-semibold w-20 flex-shrink-0">1️⃣ 类型前缀:</span>
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">{documentTypeConfig[pinnedStep.documentType]?.prefix}</span>
                                <span className="text-gray-600"> - {documentTypeConfig[pinnedStep.documentType]?.name}</span>
                                <div className="text-gray-500 mt-0.5">{documentTypeConfig[pinnedStep.documentType]?.nameEn}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-gray-600 font-semibold w-20 flex-shrink-0">2️⃣ 区域代码:</span>
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">
                                  {pinnedStep.documentNo?.split('-')[1] || 'NA'}
                                </span>
                                <span className="text-gray-600"> - </span>
                                {(() => {
                                  const region = pinnedStep.documentNo?.split('-')[1] || 'NA';
                                  const regionMap: Record<string, string> = {
                                    'NA': '北美区域（North America）',
                                    'SA': '南美区域（South America）',
                                    'EA': '欧非区域（Europe & Africa）',
                                    'DOM': '国内供应商（Domestic）',
                                    'XMN': '厦门港口（Xiamen Port）',
                                    'GZ': '广州港口（Guangzhou）',
                                    'SH': '上海港口（Shanghai）'
                                  };
                                  return <span className="text-gray-600">{regionMap[region] || region}</span>;
                                })()}
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-gray-600 font-semibold w-20 flex-shrink-0">3️⃣ 年份维度:</span>
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">{pinnedStep.documentNo?.split('-')[2] || '2512'}</span>
                                <span className="text-gray-600"> - 单据创建年月（YYMM格式）</span>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-gray-600 font-semibold w-20 flex-shrink-0">4️⃣ 流水号:</span>
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">{pinnedStep.documentNo?.split('-')[3] || '0001'}</span>
                                <span className="text-gray-600"> - 4位数字（0001-9999），确保唯一性</span>
                              </div>
                            </div>
                          </div>

                          {/* 业务类别 */}
                          <div className="bg-white rounded p-2 border border-orange-200 mt-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-orange-600 font-semibold">业务类别:</span>
                              <Badge 
                                className="text-white text-xs"
                                style={{ backgroundColor: (() => { const colors = { sales: '#3B82F6', procurement: '#F59E0B', logistics: '#0891B2', customs: '#DC2626', finance: '#10B981' }; return colors[documentTypeConfig[pinnedStep.documentType]?.category || 'sales']; })() }}
                              >
                                {(() => { const labels: Record<string, string> = { sales: '💼 销售类', procurement: '📦 采购类', logistics: '🚢 物流类', customs: '🛂 报关类', finance: '💰 财务类' }; return labels[documentTypeConfig[pinnedStep.documentType]?.category || 'sales']; })()}
                              </Badge>
                              <span className="text-gray-600">{documentTypeConfig[pinnedStep.documentType]?.description}</span>
                            </div>
                          </div>

                          {/* 自动分配逻辑 */}
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                            <div className="text-xs text-blue-900">
                              <div className="font-semibold mb-1">🤖 智能区域分配逻辑：</div>
                              <div className="space-y-0.5 text-blue-700">
                                <div>• 销售类单据 → 客户所属区域（NA/SA/EA）</div>
                                <div>• 采购类单据 → 自动分配 DOM（国内供应商）</div>
                                <div>• 报关/物流单据 → 自动分配 XMN（厦门港）</div>
                                <div>• 原产地证 → 自动分配 XMN（厦门商检）</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 锁定提示 */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t-2 border-orange-300">
                            <Lock className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-amber-800 font-bold">🔒 编号规则已锁定 - 基于业务逻辑自动生成，刷新后保持不变</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 编辑模式底部操作栏 - 台湾大厂风格 */}
                {isEditMode && (
                  <div className="px-3 py-2 border-t-2 border-orange-200 bg-gradient-to-r from-orange-50 to-gray-50 flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setIsEditMode(false);
                        console.log('保存步骤数据:', step);
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white h-7 text-xs font-medium shadow-sm"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      💾 保存
                    </Button>
                    <Button
                      onClick={() => setIsEditMode(false)}
                      variant="outline"
                      className="flex-1 h-7 text-xs border-gray-300 hover:bg-gray-100"
                    >
                      ❌ 取消
                    </Button>
                  </div>
                )}



                {/* 🔥 右下角调整大小手柄 */}
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize group"
                  onMouseDown={handleResizeMouseDown}
                  title="拖动调整弹窗大小"
                  style={{ 
                    background: 'linear-gradient(135deg, transparent 50%, #9CA3AF 50%)',
                    borderBottomRightRadius: '0.5rem'
                  }}
                >
                  {/* 三条斜线图案 */}
                  <div className="absolute bottom-0.5 right-0.5 flex flex-col gap-0.5 items-end pointer-events-none">
                    <div className="w-1.5 h-0.5 bg-white rounded-full opacity-70 group-hover:opacity-100"></div>
                    <div className="w-2.5 h-0.5 bg-white rounded-full opacity-70 group-hover:opacity-100"></div>
                    <div className="w-3.5 h-0.5 bg-white rounded-full opacity-70 group-hover:opacity-100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 当前步骤详情 */}
        {currentStep > 0 && currentStep <= 104 && (
          <Card className="mt-6 p-6 bg-white shadow-xl">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    backgroundColor: roles.find(r => r.name === allSteps[currentStep - 1].role)?.color,
                  }}
                >
                  {currentStep}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    className="text-white"
                    style={{
                      backgroundColor: roles.find(r => r.name === allSteps[currentStep - 1].role)?.color,
                    }}
                  >
                    {allSteps[currentStep - 1].role}
                  </Badge>
                  <Badge variant="outline">
                    {allSteps[currentStep - 1].stageName}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {allSteps[currentStep - 1].time}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {allSteps[currentStep - 1].title}
                </h3>
                <p className="text-gray-700">
                  {allSteps[currentStep - 1].action}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* 🔥 全屏弹窗 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
          {/* 全屏头部控制栏 */}
          <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
            <div 
              className="flex items-center gap-4 cursor-pointer select-none"
              onDoubleClick={() => setIsFullscreen(false)}
              title="双击标题退出全屏模式"
            >
              <h2 className="text-xl font-bold text-white">
                🏊 全流程泳道图 - 全屏模式
              </h2>
              <div className="text-sm text-gray-400">
                当前步骤: {currentStep} / 104 - {allSteps[currentStep - 1]?.title}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  const newStep = Math.max(1, currentStep - 1);
                  setCurrentStep(newStep);
                  setPinnedStepId(newStep);
                }}
                variant="outline"
                size="sm"
                disabled={currentStep === 1}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  const newStep = Math.min(102, currentStep + 1);
                  setCurrentStep(newStep);
                  setPinnedStepId(newStep);
                }}
                variant="outline"
                size="sm"
                disabled={currentStep === 104}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {/* 🔥 全屏缩放控制 */}
              <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
                <Button
                  onClick={() => setFullscreenZoom(Math.max(0.5, fullscreenZoom - 0.1))}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-white min-w-16 text-center">
                  {Math.round(fullscreenZoom * 100)}%
                </span>
                <Button
                  onClick={() => setFullscreenZoom(Math.min(3, fullscreenZoom + 0.1))}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  onClick={resetFullscreenView}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  title="重置视图"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              
              {/* 🔥 重置数据按钮 */}
              <div className="border-l border-gray-700 pl-3">
                <Button
                  onClick={() => {
                    if (confirm('确定要重置所有数据吗？这将清除所有修改并恢复初始数据。')) {
                      localStorage.removeItem('fullProcessDemoV5_steps');
                      window.location.reload();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-white border-gray-700 hover:bg-red-600"
                  title="重置所有数据到初始状态"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  重置数据
                </Button>
              </div>

              <div className="border-l border-gray-700 pl-3">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant={isPlaying ? 'destructive' : 'default'}
                  size="sm"
                  className="bg-[#F96302] hover:bg-[#E55302]"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      播放
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                onClick={() => setIsFullscreen(false)}
                variant="outline"
                size="sm"
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                退出全屏
              </Button>
            </div>
          </div>

          {/* 全屏内容区域 */}
          <div 
            className="flex-1 overflow-hidden p-8" 
            ref={fullscreenContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex items-center justify-center min-h-full">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 2020 995"
                className="border border-gray-700 rounded-lg bg-white"
                style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)' }}
                onClick={() => setPinnedStepId(null)}
              >
                {/* 定义箭头 */}
                <defs>
                  <marker
                    id="arrowhead-normal-fs"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#CBD5E1" />
                  </marker>
                  <marker
                    id="arrowhead-active-fs"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#F97316" />
                  </marker>
                  {/* 中间箭头标记 */}
                  <marker
                    id="arrowhead-mid-normal"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 2, 6 4, 0 6" fill="#CBD5E1" />
                  </marker>
                  <marker
                    id="arrowhead-mid-active"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 2, 6 4, 0 6" fill="#F97316" />
                  </marker>
                </defs>

                {/* 🔥 主要内容组 - 应用缩放和平移 */}
                <g transform={`translate(${fullscreenPan.x / fullscreenZoom}, ${fullscreenPan.y / fullscreenZoom}) scale(${fullscreenZoom})`}>
                
                {/* 背景 - 点击背景区域清除弹窗 */}
                <rect
                  x="0"
                  y="0"
                  width="2020"
                  height="995"
                  fill="transparent"
                  onClick={() => setPinnedStepId(null)}
                  style={{ cursor: 'default' }}
                />
                
                {/* 阶段头部 */}
                {stages.map((stage, index) => (
                  <g key={stage.id}>
                    <rect
                      x={200 + index * 140}
                      y={20}
                      width={140}
                      height={80}
                      fill={stage.color}
                      rx="8"
                      opacity="0.9"
                    />
                    <text
                      x={200 + index * 140 + 70}
                      y={50}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {stage.name}
                    </text>
                    <text
                      x={200 + index * 140 + 70}
                      y={75}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                    >
                      {stage.stepCount}步
                    </text>
                  </g>
                ))}

                {/* 角色泳道 */}
                {roles.map((role, index) => (
                  <g key={role.id}>
                    <rect
                      x="0"
                      y={120 + index * 59}
                      width="2020"
                      height="59"
                      fill={index % 2 === 0 ? '#F8FAFC' : '#FFFFFF'}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                    <rect
                      x="10"
                      y={125 + index * 59}
                      width="170"
                      height="47"
                      fill={role.color}
                      rx="8"
                    />
                    <text
                      x="95"
                      y={151 + index * 59}
                      textAnchor="middle"
                      fill="white"
                      fontSize="16"
                      fontWeight="bold"
                    >
                      {role.icon} {role.name}
                    </text>
                  </g>
                ))}

                {/* 连接线 */}
                {renderConnections()}

                {/* 步骤圆圈 */}
                {allSteps.map(step => {
                  const pos = getStepPosition(step);
                  const roleInfo = roles.find(r => r.name === step.role);
                  const isActive = step.id === currentStep;
                  const isPassed = step.id < currentStep;
                  
                  return (
                    <g key={step.id} className="group">
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isActive ? 14.4 : 12.8}
                        fill={isActive ? '#F97316' : isPassed ? roleInfo?.color : '#E2E8F0'}
                        stroke={isActive ? '#FB923C' : '#CBD5E1'}
                        strokeWidth={isActive ? 2 : 1.2}
                        className={isActive ? 'animate-pulse cursor-pointer' : 'cursor-pointer'}
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡到SVG
                          setCurrentStep(step.id);
                          setPinnedStepId(step.id); // 点击圆圈时也固定显示弹窗
                        }}
                      />
                      {/* 🔥 状态指示外环 */}
                      {step.status && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isActive ? 18.4 : 16}
                          fill="none"
                          stroke={step.status.color}
                          strokeWidth="1.6"
                          strokeDasharray="2,2"
                          className="opacity-80"
                        />
                      )}
                      <text
                        x={pos.x}
                        y={pos.y + 5}
                        textAnchor="middle"
                        fill={isActive || isPassed ? 'white' : '#64748B'}
                        fontSize={isActive ? '14' : '13'}
                        fontWeight="bold"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡到SVG
                          setCurrentStep(step.id);
                          setPinnedStepId(step.id); // 点击文字时也固定显示弹窗
                        }}
                      >
                        {step.id}
                      </text>
                      {/* 🔥 状态图标 - 显示在圆圈右上角 */}
                      {step.status && (
                        <text
                          x={pos.x + 10}
                          y={pos.y - 8}
                          textAnchor="middle"
                          fontSize="10"
                          className="pointer-events-none"
                        >
                          {step.status.icon}
                        </text>
                      )}
                    </g>
                  );
                })}
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FullProcessSandboxV5;