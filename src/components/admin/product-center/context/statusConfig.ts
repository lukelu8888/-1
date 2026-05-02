import type {
  CampaignStatus,
  ProductStatus,
  PublishStatus,
  ReviewStatus,
} from './types';

export interface StatusLook {
  label: string;
  labelEn: string;
  className: string; // tailwind classes for badge
}

export const PRODUCT_STATUS_LOOK: Record<ProductStatus, StatusLook> = {
  draft: {
    label: '草稿',
    labelEn: 'Draft',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  active: {
    label: '正常',
    labelEn: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  disabled: {
    label: '停用',
    labelEn: 'Disabled',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  archived: {
    label: '归档',
    labelEn: 'Archived',
    className: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  },
};

export const REVIEW_STATUS_LOOK: Record<ReviewStatus, StatusLook> = {
  not_submitted: {
    label: '未提交',
    labelEn: 'Not Submitted',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  pending_review: {
    label: '待审核',
    labelEn: 'Pending Review',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  approved: {
    label: '已通过',
    labelEn: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  rejected: {
    label: '已拒绝',
    labelEn: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export const PUBLISH_STATUS_LOOK: Record<PublishStatus, StatusLook> = {
  not_published: {
    label: '未发布',
    labelEn: 'Not Published',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  scheduled: {
    label: '定时发布',
    labelEn: 'Scheduled',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  published: {
    label: '已发布',
    labelEn: 'Published',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  paused: {
    label: '已暂停',
    labelEn: 'Paused',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  unpublished: {
    label: '已下架',
    labelEn: 'Unpublished',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  archived: {
    label: '已归档',
    labelEn: 'Archived',
    className: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  },
};

export const CAMPAIGN_STATUS_LOOK: Record<CampaignStatus, StatusLook> = {
  no_campaign: {
    label: '无活动',
    labelEn: 'No Campaign',
    className: 'bg-slate-50 text-slate-500 border-slate-200',
  },
  scheduled: {
    label: '待开始',
    labelEn: 'Scheduled',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  active: {
    label: '活动中',
    labelEn: 'Active',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  paused: {
    label: '活动暂停',
    labelEn: 'Paused',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ended: {
    label: '已结束',
    labelEn: 'Ended',
    className: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  },
};

/**
 * State machine — defines which transitions are legal in the UI.
 * The server should enforce the same rules (we will replicate this in
 * Postgres triggers in Phase 4).
 */
export const PUBLISH_TRANSITIONS: Record<PublishStatus, PublishStatus[]> = {
  not_published: ['scheduled', 'published', 'archived'],
  scheduled: ['published', 'not_published', 'archived'],
  published: ['paused', 'unpublished', 'archived'],
  paused: ['published', 'unpublished', 'archived'],
  unpublished: ['published', 'archived'],
  archived: [], // terminal
};

export function canTransitionPublish(from: PublishStatus, to: PublishStatus): boolean {
  return PUBLISH_TRANSITIONS[from]?.includes(to) ?? false;
}
