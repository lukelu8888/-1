import type { FinanceManagementTabId } from '../types/financeV2';

/** 各模块在 Tab 下方的说明文案（与旧版子模块 FinancePageHeader 对齐，现由管理中心统一渲染） */
export const FINANCE_MODULE_TAB_CONTEXT: Record<
  FinanceManagementTabId,
  { heading: string; description: string }
> = {
  collection: {
    heading: '收款与核销',
    description: '收入侧 · 收款登记、应收匹配、核销状态跟踪（演示数据）',
  },
  receivables: {
    heading: '应收账款',
    description: '收入侧 · 应收台账、账龄与定金/余款回款状态（真实数据已启用）',
  },
  payment_intake: {
    heading: '付款录入中心',
    description: '支出侧 · 统一录入、识别、校对、付款记录沉淀与自动分发（演示）',
  },
  payment_request: {
    heading: '付款申请',
    description: '支出侧 · 申请、审批、出纳执行链路（演示）',
  },
  payables: {
    heading: '应付账款',
    description: '支出侧 · 应付台账、供应商/服务商账款与对外付款追踪（演示）',
  },
  invoice: {
    heading: '发票与税务',
    description: '收入侧 · 销项 / 进项 / 税务资料 / 合规文件包归档（演示）',
  },
  bank: {
    heading: '资金与银行',
    description: '资金侧 · 账户余额、银行流水、汇率与现金流预测摘要（演示）',
  },
  risk: {
    heading: '财务风控',
    description: '管理侧 · 风险事件、放单阻断与建议动作（演示）',
  },
  reports: {
    heading: '执行报表',
    description: '管理侧 · 利润分析、财务报表、执行报表目录与导出（演示）',
  },
};
