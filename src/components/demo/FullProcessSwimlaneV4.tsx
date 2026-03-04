/**
 * 🏊 全流程泳道图 V4 - 102步骤可视化
 * 
 * 采用泳道图（Swimlane Diagram）形式展示完整业务流程
 * 清晰呈现不同角色之间的协作和信息流转
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  EyeOff,
  ArrowRight,
  MessageSquare,
  FileText,
  Clock,
  User,
} from 'lucide-react';

// 定义步骤接口
interface Step {
  id: number;
  role: string;
  title: string;
  action: string;
  outputDoc: string;
  sentInfo: string;
  time: string;
  stageId: number;
  stageName: string;
  nextStepId?: number;
  branches?: string[];
}

// 定义角色接口
interface RoleInfo {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
}

export function FullProcessSwimlaneV4() {
  // 角色配置
  const roles: Record<string, RoleInfo> = {
    '客户': { name: '客户', color: '#8B5CF6', bgColor: '#F3E8FF', icon: '👤' },
    '业务员': { name: '业务员', color: '#10B981', bgColor: '#D1FAE5', icon: '💼' },
    '销售总监': { name: '销售总监', color: '#EF4444', bgColor: '#FEE2E2', icon: '👔' },
    '采购员': { name: '采购员', color: '#F59E0B', bgColor: '#FEF3C7', icon: '📦' },
    '供应商': { name: '供应商', color: '#EAB308', bgColor: '#FEF9C3', icon: '🏭' },
    '财务专员': { name: '财务专员', color: '#3B82F6', bgColor: '#DBEAFE', icon: '💰' },
    '财务总监': { name: '财务总监', color: '#DC2626', bgColor: '#FEE2E2', icon: '💵' },
    '验货员': { name: '验货员', color: '#14B8A6', bgColor: '#CCFBF1', icon: '🔍' },
    '商检机构': { name: '商检机构', color: '#6B7280', bgColor: '#F3F4F6', icon: '📋' },
    '货代': { name: '货代', color: '#06B6D4', bgColor: '#CFFAFE', icon: '🚢' },
    '拖车公司': { name: '拖车公司', color: '#71717A', bgColor: '#F4F4F5', icon: '🚛' },
    '拖车司机': { name: '拖车司机', color: '#737373', bgColor: '#F5F5F5', icon: '🚗' },
    '报关行': { name: '报关行', color: '#64748B', bgColor: '#F1F5F9', icon: '📄' },
    '海关': { name: '海关', color: '#DC2626', bgColor: '#FEE2E2', icon: '🛂' },
  };

  // 获取所有角色列表（按出现频率排序）
  const roleOrder = ['客户', '业务员', '销售总监', '采购员', '供应商', '财务专员', '财务总监', '验货员', '商检机构', '货代', '拖车公司', '拖车司机', '报关行', '海关'];

  // 完整的102个步骤数据（精简版）
  const allSteps: Step[] = [
    // 阶段1：询价报价（1-15）
    { id: 1, role: '客户', title: '发起询盘', action: '在后台发起询盘', outputDoc: '询盘单', sentInfo: 'Please quote', time: '12-04 09:00', stageId: 1, stageName: '询价报价', nextStepId: 2 },
    { id: 2, role: '业务员', title: '收到询盘', action: '收到客户询盘', outputDoc: '无', sentInfo: '无', time: '12-04 09:15', stageId: 1, stageName: '询价报价', nextStepId: 3 },
    { id: 3, role: '业务员', title: '下推询价', action: '下推生成采购询价单', outputDoc: '采购询价单', sentInfo: '请协助询价', time: '12-04 09:30', stageId: 1, stageName: '询价报价', nextStepId: 4 },
    { id: 4, role: '采购员', title: '收到请求', action: '收到业务员询价请求', outputDoc: '无', sentInfo: '正在处理', time: '12-04 09:45', stageId: 1, stageName: '询价报价', nextStepId: 5 },
    { id: 5, role: '采购员', title: '发送采购询价', action: '向供应商发出采购询价请求', outputDoc: '采购询价单', sentInfo: '请协助报价', time: '12-04 10:00', stageId: 1, stageName: '询价报价', nextStepId: 6 },
    { id: 6, role: '供应商', title: '收到询价', action: '收到采购员询价请求', outputDoc: '无', sentInfo: '已收到', time: '12-04 10:30', stageId: 1, stageName: '询价报价', nextStepId: 7 },
    { id: 7, role: '供应商', title: '向采购员报价', action: '向采购员报价（$8.50/件）', outputDoc: '供应商报价单', sentInfo: '报价已完成', time: '12-04 14:30', stageId: 1, stageName: '询价报价', nextStepId: 8 },
    { id: 8, role: '采购员', title: '收到报价', action: '收到供应商报价', outputDoc: '无', sentInfo: '报价已收到', time: '12-04 14:45', stageId: 1, stageName: '询价报价', nextStepId: 9 },
    { id: 9, role: '采购员', title: '提供成本价', action: '向业务员提供成本价', outputDoc: '内部报价回复', sentInfo: '建议报价30%', time: '12-04 15:30', stageId: 1, stageName: '询价报价', nextStepId: 10 },
    { id: 10, role: '业务员', title: '收到成本价', action: '收到产品成本价', outputDoc: '无', sentInfo: '感谢协助', time: '12-04 15:45', stageId: 1, stageName: '询价报价', nextStepId: 11 },
    { id: 11, role: '业务员', title: '填写报价', action: '填写给客户报价单（$12.50/件）', outputDoc: '客户报价单', sentInfo: '请审核报价', time: '12-04 16:30', stageId: 1, stageName: '询价报价', nextStepId: 12 },
    { id: 12, role: '销售总监', title: '审核报价', action: '审核报价', outputDoc: '报价审批单', sentInfo: '已反馈', time: '12-04 17:00', stageId: 1, stageName: '询价报价', nextStepId: 13, branches: ['✅通过→13', '❌拒绝→11'] },
    { id: 13, role: '业务员', title: '发送报价', action: '发送报价给客户', outputDoc: '无', sentInfo: 'Quotation completed', time: '12-04 17:30', stageId: 1, stageName: '询价报价', nextStepId: 14 },
    { id: 14, role: '客户', title: '收到报价', action: '收到业务员报价', outputDoc: '无', sentInfo: '无', time: '12-05 09:00', stageId: 1, stageName: '询价报价', nextStepId: 15 },
    { id: 15, role: '客户', title: '同意报价', action: '客户同意报价', outputDoc: '报价确认单', sentInfo: 'Please review', time: '12-05 10:00', stageId: 1, stageName: '询价报价', nextStepId: 16 },
    
    // 阶段2：销售合同（16-23）
    { id: 16, role: '业务员', title: '生成合同', action: '下推生成销售合同', outputDoc: '销售合同', sentInfo: '请审批合同', time: '12-05 11:00', stageId: 2, stageName: '销售合同', nextStepId: 17 },
    { id: 17, role: '销售总监', title: '审核合同', action: '审核销售合同', outputDoc: '合同审批单', sentInfo: '已审批', time: '12-05 14:00', stageId: 2, stageName: '销售合同', nextStepId: 18 },
    { id: 18, role: '业务员', title: '发送合同', action: '发送销售合同给客户', outputDoc: '无', sentInfo: 'Please sign', time: '12-05 14:30', stageId: 2, stageName: '销售合同', nextStepId: 19 },
    { id: 19, role: '客户', title: '收到合同', action: '收到销售合同', outputDoc: '无', sentInfo: '无', time: '12-05 15:00', stageId: 2, stageName: '销售合同', nextStepId: 20 },
    { id: 20, role: '客户', title: '确认合同', action: '确认合同点击Approve', outputDoc: '签订的合同', sentInfo: 'Contract signed', time: '12-05 16:00', stageId: 2, stageName: '销售合同', nextStepId: 21 },
    { id: 21, role: '客户', title: '付定金', action: '付定金（$18,750）', outputDoc: '客户付款凭证', sentInfo: 'Deposit paid', time: '12-06 10:00', stageId: 2, stageName: '销售合同', nextStepId: 22 },
    { id: 22, role: '财务专员', title: '收到定金', action: '收到客户定金', outputDoc: '无', sentInfo: '无', time: '12-06 12:00', stageId: 2, stageName: '销售合同', nextStepId: 23 },
    { id: 23, role: '财务专员', title: '确认收款', action: '上传收款凭证', outputDoc: '收款凭证', sentInfo: '定金到账', time: '12-06 14:00', stageId: 2, stageName: '销售合同', nextStepId: 24 },
    
    // 阶段3：采购合同（24-35）
    { id: 24, role: '业务员', title: '下推采购', action: '下推采购流程', outputDoc: '采购申请单', sentInfo: '请协助', time: '12-06 15:00', stageId: 3, stageName: '采购合同', nextStepId: 25 },
    { id: 25, role: '采购员', title: '收到请求', action: '收到业务员采购请求', outputDoc: '无', sentInfo: '已收到', time: '12-06 15:10', stageId: 3, stageName: '采购合同', nextStepId: 26 },
    { id: 26, role: '采购员', title: '生成采购合同', action: '生成采购合同', outputDoc: '采购合同', sentInfo: '请审批', time: '12-06 16:00', stageId: 3, stageName: '采购合同', nextStepId: 27 },
    { id: 27, role: '财务专员', title: '审核采购', action: '审核采购合同', outputDoc: '采购审批单', sentInfo: '已审核', time: '12-06 16:30', stageId: 3, stageName: '采购合同', nextStepId: 28 },
    { id: 28, role: '采购员', title: '提交合同', action: '提交盖章签字的采购合同', outputDoc: '无', sentInfo: '请回签', time: '12-06 17:00', stageId: 3, stageName: '采购合同', nextStepId: 29 },
    { id: 29, role: '供应商', title: '收到合同', action: '收到采购员的采购合同', outputDoc: '无', sentInfo: '查阅中', time: '12-07 09:00', stageId: 3, stageName: '采购合同', nextStepId: 30 },
    { id: 30, role: '供应商', title: '回签合同', action: '回签采购合同并上传', outputDoc: '已签署采购合同', sentInfo: '合同已回签', time: '12-07 10:00', stageId: 3, stageName: '采购合同', nextStepId: 31 },
    { id: 31, role: '财务专员', title: '收到通知', action: '收到供应商签约通知', outputDoc: '无', sentInfo: '已收到', time: '12-07 10:30', stageId: 3, stageName: '采购合同', nextStepId: 32 },
    { id: 32, role: '财务专员', title: '申请付款', action: '申请付款', outputDoc: '付款申请表单', sentInfo: '请审批', time: '12-07 11:00', stageId: 3, stageName: '采购合同', nextStepId: 33 },
    { id: 33, role: '财务总监', title: '审核付款', action: '审核付款申请', outputDoc: '付款审批单', sentInfo: '已审批', time: '12-07 14:00', stageId: 3, stageName: '采购合同', nextStepId: 34 },
    { id: 34, role: '财务专员', title: '付定金', action: '付定金（$12,750）', outputDoc: '付款水单', sentInfo: '定金已付', time: '12-07 15:00', stageId: 3, stageName: '采购合同', nextStepId: 35 },
    { id: 35, role: '供应商', title: '确认收款', action: '确认收到定金', outputDoc: '无', sentInfo: '准备生产', time: '12-08 09:00', stageId: 3, stageName: '采购合同', nextStepId: 36 },
    
    // 阶段4：生产质检（36-44）
    { id: 36, role: '供应商', title: '产前样打样', action: '产前样打样', outputDoc: '产前样', sentInfo: '产前样确认中', time: '12-10 10:00', stageId: 4, stageName: '生产质检', nextStepId: 37 },
    { id: 37, role: '采购员', title: '确认封样', action: '产前样确认签字和封样', outputDoc: '样品确认单', sentInfo: '已封样', time: '12-10 14:00', stageId: 4, stageName: '生产质检', nextStepId: 38 },
    { id: 38, role: '供应商', title: '正式生产', action: '安排批量生产（15天）', outputDoc: '无', sentInfo: '预计完货时间', time: '12-11 09:00', stageId: 4, stageName: '生产质检', nextStepId: 39 },
    { id: 39, role: '供应商', title: '上传质检', action: '上传质检报告表单', outputDoc: '质检报告', sentInfo: '请查看', time: '12-18 14:00', stageId: 4, stageName: '生产质检', nextStepId: 40 },
    { id: 40, role: '验货员', title: '检查报告', action: 'QC检查质检报告', outputDoc: '无', sentInfo: '已查阅', time: '12-18 16:00', stageId: 4, stageName: '生产质检', nextStepId: 41 },
    { id: 41, role: '供应商', title: '通知验货', action: '完货前一周通知验货', outputDoc: '无', sentInfo: '可安排验货', time: '12-20 10:00', stageId: 4, stageName: '生产质检', nextStepId: 42 },
    { id: 42, role: '采购员', title: '收到通知', action: '收到验货通知', outputDoc: '无', sentInfo: '无', time: '12-20 10:30', stageId: 4, stageName: '生产质检', nextStepId: 43 },
    { id: 43, role: '采购员', title: '下推验货', action: '下推验货通知单给QC', outputDoc: '验货通知单', sentInfo: '待验', time: '12-20 11:00', stageId: 4, stageName: '生产质检', nextStepId: 44 },
    { id: 44, role: '验货员', title: '通知工厂', action: 'QC通知工厂验货日期', outputDoc: '无', sentInfo: '验货时间', time: '12-20 14:00', stageId: 4, stageName: '生产质检', nextStepId: 45 },
    
    // 阶段5：验货完货（45-48）
    { id: 45, role: '供应商', title: '接受安排', action: '工厂接受验货安排', outputDoc: '无', sentInfo: '日期确认', time: '12-20 15:00', stageId: 5, stageName: '验货完货', nextStepId: 46 },
    { id: 46, role: '验货员', title: '验货上传', action: 'QC验货并上传报告', outputDoc: '验货报告', sentInfo: '验货已完成', time: '12-23 16:00', stageId: 5, stageName: '验货完货', nextStepId: 47 },
    { id: 47, role: '采购员', title: '收到报告', action: '收到验货报告', outputDoc: '无', sentInfo: '无', time: '12-23 17:00', stageId: 5, stageName: '验货完货', nextStepId: 48 },
    { id: 48, role: '采购员', title: '通知完货', action: '通知业务员完货信息', outputDoc: '无', sentInfo: '验货合格', time: '12-23 17:30', stageId: 5, stageName: '验货完货', nextStepId: 49 },
    
    // 阶段6：完货通知与尾款催收（49-59）
    { id: 49, role: '业务员', title: '收到完货通知', action: '收到验货通过通知', outputDoc: '无', sentInfo: '无', time: '12-23 17:45', stageId: 6, stageName: '尾款催收', nextStepId: 50 },
    { id: 50, role: '业务员', title: '通知客户完货', action: '通知客户完货', outputDoc: '无', sentInfo: 'Production completed', time: '12-23 18:00', stageId: 6, stageName: '尾款催收', nextStepId: 51 },
    { id: 51, role: '客户', title: '查看验货报告', action: '查看验货报告', outputDoc: '无', sentInfo: 'Report reviewed', time: '12-24 09:00', stageId: 6, stageName: '尾款催收', nextStepId: 52 },
    { id: 52, role: '业务员', title: '催收尾款', action: '发送尾款催款通知', outputDoc: '尾款催款单', sentInfo: 'Please pay balance', time: '12-24 10:00', stageId: 6, stageName: '尾款催收', nextStepId: 53 },
    { id: 53, role: '客户', title: '付尾款', action: '付尾款（$43,750）', outputDoc: '客户尾款付款凭证', sentInfo: 'Balance paid', time: '12-24 14:00', stageId: 6, stageName: '尾款催收', nextStepId: 54 },
    { id: 54, role: '财务专员', title: '确认收到尾款', action: '收到客户尾款', outputDoc: '无', sentInfo: '无', time: '12-24 16:00', stageId: 6, stageName: '尾款催收', nextStepId: 55 },
    { id: 55, role: '财务专员', title: '通知尾款到账', action: '上传收款凭证', outputDoc: '尾款收款凭证', sentInfo: '可安排出货', time: '12-25 09:00', stageId: 6, stageName: '尾款催收', nextStepId: 56 },
    { id: 56, role: '财务专员', title: '申请付供应商尾款', action: '申请付供应商尾款', outputDoc: '供应商尾款付款申请', sentInfo: '请审批', time: '12-25 10:00', stageId: 6, stageName: '尾款催收', nextStepId: 57 },
    { id: 57, role: '财务总监', title: '审核尾款付款', action: '审核尾款付款申请', outputDoc: '尾款付款审批单', sentInfo: '已审批', time: '12-25 11:00', stageId: 6, stageName: '尾款催收', nextStepId: 58 },
    { id: 58, role: '财务专员', title: '付供应商尾款', action: '付尾款（$29,750）', outputDoc: '尾款付款水单', sentInfo: '尾款已付', time: '12-25 14:00', stageId: 6, stageName: '尾款催收', nextStepId: 59 },
    { id: 59, role: '供应商', title: '确认收到尾款', action: '确认收到尾款', outputDoc: '无', sentInfo: '随时可出货', time: '12-25 16:00', stageId: 6, stageName: '尾款催收', nextStepId: 60 },
    
    // 阶段7：商检与订舱（60-69）
    { id: 60, role: '业务员', title: '询问订舱方式', action: '询问客户订舱方式', outputDoc: '无', sentInfo: 'FOB or CIF?', time: '12-25 16:30', stageId: 7, stageName: '商检订舱', nextStepId: 61 },
    { id: 61, role: '客户', title: '选择订舱方式', action: '客户选择CIF', outputDoc: '无', sentInfo: 'Please arrange CIF', time: '12-25 17:00', stageId: 7, stageName: '商检订舱', nextStepId: 62 },
    { id: 62, role: '业务员', title: '检查是否需要商检', action: '检查产品是否需要商检', outputDoc: '无', sentInfo: '无', time: '12-25 17:30', stageId: 7, stageName: '商检订舱', nextStepId: 63 },
    { id: 63, role: '业务员', title: '安排商检', action: '联系商检机构', outputDoc: '商检申请单', sentInfo: '请安排', time: '12-26 09:00', stageId: 7, stageName: '商检订舱', nextStepId: 64 },
    { id: 64, role: '商检机构', title: '商检完成', action: '完成商检，出具证书', outputDoc: '商检证书', sentInfo: '商检已完成', time: '12-27 14:00', stageId: 7, stageName: '商检订舱', nextStepId: 65 },
    { id: 65, role: '业务员', title: '收到商检证书', action: '收到商检证书', outputDoc: '无', sentInfo: '无', time: '12-27 15:00', stageId: 7, stageName: '商检订舱', nextStepId: 66 },
    { id: 66, role: '业务员', title: '询问海运费', action: '向货代询问海运费', outputDoc: '海运询价单', sentInfo: '请报价', time: '12-27 16:00', stageId: 7, stageName: '商检订舱', nextStepId: 67 },
    { id: 67, role: '货代', title: '报海运费', action: '货代报海运费', outputDoc: '海运报价单', sentInfo: '$2,800, 25天', time: '12-27 17:00', stageId: 7, stageName: '商检订舱', nextStepId: 68 },
    { id: 68, role: '业务员', title: '转发海运费给客户', action: '转发海运费给客户', outputDoc: '无', sentInfo: 'Ocean freight quote', time: '12-27 17:30', stageId: 7, stageName: '商检订舱', nextStepId: 69 },
    { id: 69, role: '客户', title: '确认海运费', action: '客户确认海运费', outputDoc: '无', sentInfo: 'Confirmed', time: '12-28 09:00', stageId: 7, stageName: '商检订舱', nextStepId: 70 },
    
    // 阶段8：订舱拖车装柜（70-77）
    { id: 70, role: '业务员', title: '正式订舱', action: '向货代正式订舱', outputDoc: '订舱单', sentInfo: '请订舱', time: '12-28 10:00', stageId: 8, stageName: '拖车装柜', nextStepId: 71 },
    { id: 71, role: '货代', title: '确认订舱', action: '确认订舱，提供船期', outputDoc: '订舱确认书', sentInfo: '订舱已确认', time: '12-28 14:00', stageId: 8, stageName: '拖车装柜', nextStepId: 72 },
    { id: 72, role: '业务员', title: '安排拖车', action: '联系拖车公司', outputDoc: '拖车单', sentInfo: '请安排拖车', time: '12-28 15:00', stageId: 8, stageName: '拖车装柜', nextStepId: 73 },
    { id: 73, role: '拖车公司', title: '确认拖车', action: '确认拖车安排', outputDoc: '拖车确认单', sentInfo: '拖车已安排', time: '12-28 16:00', stageId: 8, stageName: '拖车装柜', nextStepId: 74 },
    { id: 74, role: '业务员', title: '通知工厂装柜', action: '通知供应商准备装柜', outputDoc: '无', sentInfo: '请准备装柜', time: '12-28 17:00', stageId: 8, stageName: '拖车装柜', nextStepId: 75 },
    { id: 75, role: '供应商', title: '准备装柜', action: '准备货物，等待拖车', outputDoc: '无', sentInfo: '货物已准备好', time: '12-29 10:00', stageId: 8, stageName: '拖车装柜', nextStepId: 76 },
    { id: 76, role: '拖车司机', title: '到工厂装柜', action: '到达工厂，配合装柜', outputDoc: '无', sentInfo: '开始装柜', time: '12-30 09:00', stageId: 8, stageName: '拖车装柜', nextStepId: 77 },
    { id: 77, role: '供应商', title: '配合装柜', action: '配合装柜', outputDoc: '无', sentInfo: '无', time: '12-30 09:30', stageId: 8, stageName: '拖车装柜', nextStepId: 78 },
    
    // 阶段9：装柜完成与报关（78-82）
    { id: 78, role: '供应商', title: '装柜完成', action: '装柜完成，封柜拍照', outputDoc: '装柜照片、装箱单', sentInfo: '装柜完成', time: '12-30 12:00', stageId: 9, stageName: '装柜报关', nextStepId: 79 },
    { id: 79, role: '拖车司机', title: '运往港区', action: '运往厦门港港区', outputDoc: '无', sentInfo: '已出发', time: '12-30 12:30', stageId: 9, stageName: '装柜报关', nextStepId: 80 },
    { id: 80, role: '拖车司机', title: '到达港区', action: '到达厦门港港区', outputDoc: '无', sentInfo: '已到港区', time: '12-30 14:00', stageId: 9, stageName: '装柜报关', nextStepId: 81 },
    { id: 81, role: '业务员', title: '准备报关资料', action: '准备报关资料', outputDoc: '报关资料包', sentInfo: '无', time: '12-30 15:00', stageId: 9, stageName: '装柜报关', nextStepId: 82 },
    { id: 82, role: '业务员', title: '提交报关', action: '向报关行提交报关资料', outputDoc: '报关单', sentInfo: '请协助报关', time: '12-30 15:30', stageId: 9, stageName: '装柜报关', nextStepId: 83 },
    
    // 阶段10：报关放行与开船（83-87）
    { id: 83, role: '报关行', title: '报关申报', action: '向海关申报', outputDoc: '海关申报回执', sentInfo: '报关已申报', time: '12-30 16:00', stageId: 10, stageName: '报关开船', nextStepId: 84 },
    { id: 84, role: '海关', title: '审核放行', action: '审核报关单，放行', outputDoc: '海关放行单', sentInfo: '海关已放行', time: '12-30 18:00', stageId: 10, stageName: '报关开船', nextStepId: 85 },
    { id: 85, role: '报关行', title: '通知放行', action: '通知业务员报关放行', outputDoc: '无', sentInfo: '报关已放行', time: '12-30 19:00', stageId: 10, stageName: '报关开船', nextStepId: 86 },
    { id: 86, role: '业务员', title: '确认放行', action: '确认报关放行', outputDoc: '无', sentInfo: '无', time: '12-30 20:00', stageId: 10, stageName: '报关开船', nextStepId: 87 },
    { id: 87, role: '货代', title: '通知开船', action: '通知船已开航', outputDoc: '提单', sentInfo: '船已开航', time: '01-02 08:00', stageId: 10, stageName: '报关开船', nextStepId: 88 },
    
    // 阶段11：海运费支付与在途跟踪（88-92）
    { id: 88, role: '业务员', title: '通知客户船期', action: '通知客户船期和提单', outputDoc: '无', sentInfo: 'Shipment sailed', time: '01-02 09:00', stageId: 11, stageName: '海运跟踪', nextStepId: 89 },
    { id: 89, role: '客户', title: '收到船期通知', action: '收到船期通知', outputDoc: '无', sentInfo: 'Received', time: '01-02 10:00', stageId: 11, stageName: '海运跟踪', nextStepId: 90 },
    { id: 90, role: '货代', title: '催收海运费', action: '催收海运费', outputDoc: '海运费账单', sentInfo: '请支付海运费', time: '01-03 09:00', stageId: 11, stageName: '海运跟踪', nextStepId: 91 },
    { id: 91, role: '业务员', title: '转发海运费账单', action: '转发海运费账单给客户', outputDoc: '无', sentInfo: 'Please pay freight', time: '01-03 10:00', stageId: 11, stageName: '海运跟踪', nextStepId: 92 },
    { id: 92, role: '客户', title: '支付海运费', action: '向货代支付海运费', outputDoc: '海运费付款凭证', sentInfo: 'Freight paid', time: '01-04 14:00', stageId: 11, stageName: '海运跟踪', nextStepId: 93 },
    
    // 阶段12：在途跟踪与到港清关（93-98）
    { id: 93, role: '货代', title: '确认收到海运费', action: '确认收到海运费', outputDoc: '无', sentInfo: '已收到', time: '01-05 09:00', stageId: 12, stageName: '到港清关', nextStepId: 94 },
    { id: 94, role: '业务员', title: '在途跟踪', action: '跟踪船期', outputDoc: '无', sentInfo: 'On schedule', time: '01-15 10:00', stageId: 12, stageName: '到港清关', nextStepId: 95 },
    { id: 95, role: '货代', title: '到港通知', action: '通知船已到达', outputDoc: '到港通知', sentInfo: '船已到港', time: '01-27 06:00', stageId: 12, stageName: '到港清关', nextStepId: 96 },
    { id: 96, role: '业务员', title: '通知客户到港', action: '通知客户到港', outputDoc: '无', sentInfo: 'Arrived at port', time: '01-27 09:00', stageId: 12, stageName: '到港清关', nextStepId: 97 },
    { id: 97, role: '客户', title: '安排清关', action: '联系美国报关行', outputDoc: '美国进口报关单', sentInfo: 'Clearance in progress', time: '01-27 10:00', stageId: 12, stageName: '到港清关', nextStepId: 98 },
    { id: 98, role: '客户', title: '清关完成', action: '美国海关放行', outputDoc: '美国海关放行单', sentInfo: 'Cleared', time: '01-29 14:00', stageId: 12, stageName: '到港清关', nextStepId: 99 },
    
    // 阶段13：提柜验货与销售反馈（99-102）
    { id: 99, role: '客户', title: '提柜运输', action: '安排拖车从港口提柜', outputDoc: '无', sentInfo: 'Container picked up', time: '01-30 09:00', stageId: 13, stageName: '验货反馈', nextStepId: 100 },
    { id: 100, role: '客户', title: '开柜验货', action: '在仓库开柜验货', outputDoc: '客户验货报告', sentInfo: 'Goods received', time: '01-30 14:00', stageId: 13, stageName: '验货反馈', nextStepId: 101 },
    { id: 101, role: '客户', title: '销售反馈', action: '向业务员反馈销售情况', outputDoc: '客户销售反馈报告', sentInfo: 'Will reorder soon', time: '02-15 10:00', stageId: 13, stageName: '验货反馈', nextStepId: 102 },
    { id: 102, role: '业务员', title: '记录反馈', action: '记录客户反馈', outputDoc: '客户反馈记录', sentInfo: 'Thank you!', time: '02-15 11:00', stageId: 13, stageName: '验货反馈' },
  ];

  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // 获取所有阶段
  const stages = Array.from(new Set(allSteps.map(s => s.stageId))).map(id => ({
    id,
    name: allSteps.find(s => s.stageId === id)?.stageName || '',
    steps: allSteps.filter(s => s.stageId === id)
  }));

  // 过滤步骤
  const filteredSteps = selectedStage 
    ? allSteps.filter(s => s.stageId === selectedStage)
    : allSteps;

  // 缩放控制
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);

  // 导出为图片
  const handleExport = () => {
    alert('导出功能开发中...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🏊 全流程泳道图 V4
              </h1>
              <p className="text-gray-600">
                102个步骤 · 14个角色 · 13个阶段 · 清晰展示角色协作与信息流转
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                导出图片
              </Button>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* 阶段筛选 */}
            <select
              value={selectedStage || 'all'}
              onChange={(e) => setSelectedStage(e.target.value === 'all' ? null : Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有阶段（102步）</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  阶段{stage.id}：{stage.name}（{stage.steps.length}步）
                </option>
              ))}
            </select>

            {/* 缩放控制 */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <Button onClick={handleZoomOut} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
              <Button onClick={handleZoomIn} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button onClick={handleResetZoom} variant="ghost" size="sm" className="h-8 px-3">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* 详情切换 */}
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  隐藏详情
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  显示详情
                </>
              )}
            </Button>

            {/* 统计信息 */}
            <div className="ml-auto flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                📊 {filteredSteps.length} 个步骤
              </Badge>
              <Badge variant="outline" className="text-sm">
                👥 {roleOrder.length} 个角色
              </Badge>
            </div>
          </div>
        </div>

        {/* 泳道图主体 */}
        <Card className="p-6 overflow-auto bg-white shadow-xl">
          <div 
            style={{ 
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              minWidth: `${filteredSteps.length * 180}px`
            }}
          >
            {/* 时间轴 */}
            <div className="flex mb-4">
              <div className="w-40 flex-shrink-0"></div>
              <div className="flex gap-2">
                {filteredSteps.map((step) => (
                  <div
                    key={step.id}
                    className="w-40 flex-shrink-0 text-center"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                      步骤 {step.id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {step.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 泳道 */}
            {roleOrder.map((roleName) => {
              const role = roles[roleName];
              const roleSteps = filteredSteps.filter(s => s.role === roleName);
              
              if (roleSteps.length === 0) return null;

              return (
                <div key={roleName} className="flex mb-3 relative">
                  {/* 角色标签 */}
                  <div 
                    className="w-40 flex-shrink-0 pr-4 sticky left-0 z-10"
                    style={{ backgroundColor: role.bgColor }}
                  >
                    <div 
                      className="h-full rounded-lg p-4 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backgroundColor: role.color, color: 'white' }}
                    >
                      <div className="text-3xl mb-2">{role.icon}</div>
                      <div className="font-bold text-sm">{role.name}</div>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {roleSteps.length} 步
                      </Badge>
                    </div>
                  </div>

                  {/* 泳道区域 */}
                  <div 
                    className="flex-1 border-2 border-dashed rounded-lg p-2 relative"
                    style={{ 
                      borderColor: role.color + '40',
                      backgroundColor: role.bgColor + '20',
                      minHeight: '120px'
                    }}
                  >
                    <div className="flex gap-2">
                      {filteredSteps.map((step, index) => {
                        if (step.role !== roleName) {
                          // 空白占位
                          return (
                            <div key={step.id} className="w-40 flex-shrink-0"></div>
                          );
                        }

                        // 当前角色的步骤
                        return (
                          <div
                            key={step.id}
                            className="w-40 flex-shrink-0 relative group"
                          >
                            <Card 
                              className="p-3 h-full hover:shadow-2xl transition-all cursor-pointer border-2"
                              style={{ 
                                borderColor: role.color,
                                backgroundColor: 'white'
                              }}
                            >
                              {/* 步骤编号 */}
                              <div 
                                className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                                style={{ backgroundColor: role.color }}
                              >
                                {step.id}
                              </div>

                              {/* 步骤内容 */}
                              <div className="mt-2">
                                <h4 className="font-bold text-sm mb-2 line-clamp-2" style={{ color: role.color }}>
                                  {step.title}
                                </h4>
                                
                                {showDetails && (
                                  <>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {step.action}
                                    </p>
                                    
                                    {step.outputDoc && step.outputDoc !== '无' && (
                                      <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
                                        <FileText className="w-3 h-3" />
                                        <span className="line-clamp-1">{step.outputDoc}</span>
                                      </div>
                                    )}
                                    
                                    {step.sentInfo && step.sentInfo !== '无' && (
                                      <div className="flex items-center gap-1 text-xs text-green-600">
                                        <MessageSquare className="w-3 h-3" />
                                        <span className="line-clamp-1">{step.sentInfo}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* 箭头指示 */}
                              {step.nextStepId && (
                                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                                  <ArrowRight 
                                    className="w-6 h-6 text-blue-500 animate-pulse"
                                    strokeWidth={3}
                                  />
                                </div>
                              )}

                              {/* 分支标记 */}
                              {step.branches && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                  <Badge className="text-xs bg-yellow-500 text-white">
                                    分支
                                  </Badge>
                                </div>
                              )}
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 图例 */}
        <Card className="mt-6 p-6 bg-white shadow-xl">
          <h3 className="font-bold text-lg mb-4">图例说明</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-500" />
              <span className="text-sm">流程流转</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span className="text-sm">信息发送</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span className="text-sm">文档输出</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500 text-white text-xs">分支</Badge>
              <span className="text-sm">流程分支</span>
            </div>
          </div>
        </Card>

        {/* 角色统计 */}
        <Card className="mt-6 p-6 bg-white shadow-xl">
          <h3 className="font-bold text-lg mb-4">角色参与统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {roleOrder.map((roleName) => {
              const role = roles[roleName];
              const count = allSteps.filter(s => s.role === roleName).length;
              
              return (
                <div 
                  key={roleName}
                  className="p-4 rounded-lg border-2 text-center hover:shadow-lg transition-shadow"
                  style={{ 
                    borderColor: role.color,
                    backgroundColor: role.bgColor 
                  }}
                >
                  <div className="text-3xl mb-2">{role.icon}</div>
                  <div className="font-bold text-sm mb-1" style={{ color: role.color }}>
                    {role.name}
                  </div>
                  <Badge variant="secondary">{count} 步骤</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default FullProcessSwimlaneV4;
