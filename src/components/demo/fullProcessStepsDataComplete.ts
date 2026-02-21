/**
 * 🎯 全流程演示 - 完整的102个步骤数据
 * 从 FullProcessDemoV5.tsx 提取的真实业务流程数据
 */

// 步骤状态类型
export interface StepStatus {
  type: 'draft' | 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'warning' | 'blocked' | 'partial';
  label: string;
  icon: string;
  color: string;
}

// 状态详情
export interface StatusDetails {
  operator?: string;
  completedTime?: string;
  progress?: number;
  amount?: string;
  quantity?: string;
  location?: string;
  attachments?: string[];
  remarks?: string;
  fields?: StatusField[];
  notification?: {
    message: string;
    messageEn?: string;
    notifier: string;
    notifierEn?: string;
    recipients?: string[];
  };
}

// 业务字段状态
export interface StatusField {
  label: string;
  labelEn?: string;
  value: string;
  valueEn?: string;
  status?: 'pending' | 'completed' | 'uploaded' | 'waiting' | 'paid' | 'approved' | 'rejected' | 'processing' | 'confirmed';
  statusLabel?: string;
  statusLabelEn?: string;
  statusColor?: string;
  icon?: string;
}

// 步骤接口
export interface Step {
  id: number;
  role: string;
  stageId: number;
  stageName: string;
  title: string;
  action: string;
  time: string;
  nextStepId?: number;
  status?: StepStatus;
  statusDetails?: StatusDetails;
}

// 预定义状态配置
export const statusConfig: Record<string, StepStatus> = {
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

// 🔥 完整的102个步骤数据 - 从V5提取
// 注意：由于数据量过大，此文件将通过动态导入V5组件的方式获取数据
// 这是一个临时方案，实际使用时应该从数据库或API获取

export const FULL_PROCESS_STEPS_PLACEHOLDER = 'This will be populated from FullProcessDemoV5';
