export interface RoleCollaborationSection {
  key: string
  label: string
  roles: string[]
  count: number
}

const TASK_CENTER_ROLE_ORDER = [
  'Sales_Rep',
  'Procurement',
  'Procurement_Manager',
  'Finance',
  'Documentation_Officer',
  'QC',
  'Warehouse_Ops',
  'Order_Coordinator',
  'Customer',
  'Supplier',
  'Marketing_Ops',
  'CEO',
]

export type TaskCenterAccent = 'red' | 'orange' | 'blue' | 'green' | 'teal' | 'purple'

export interface TaskCenterSection<TItem> {
  key: string
  label: string
  accent?: TaskCenterAccent
  count: number
  items: TItem[]
}

export interface TaskCenterRiskItem {
  key: string
  label: string
  count: number
  tone?: 'default' | 'critical' | 'warning' | 'info' | 'success'
}

export type TaskCenterRiskTone = NonNullable<TaskCenterRiskItem['tone']>

export interface TaskCenterRiskOverview {
  total: number
  critical: number
  warning: number
  info: number
  success: number
  default: number
}

export interface TaskCenterDataBundle<TItem> {
  taskSections: TaskCenterSection<TItem>[]
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

export interface TaskCenterCompatFields<TItem> {
  taskCenter: TaskCenterDataBundle<TItem>
  taskSections: TaskCenterSection<TItem>[]
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

const TASK_CENTER_ACCENTS: TaskCenterAccent[] = ['red', 'orange', 'blue', 'green', 'teal', 'purple']
const TASK_CENTER_RISK_TONES: TaskCenterRiskTone[] = ['critical', 'warning', 'info', 'default', 'success']

function normalizeTaskCenterAccent(
  accent?: string,
  fallback: TaskCenterAccent = 'blue',
): TaskCenterAccent {
  if (accent && TASK_CENTER_ACCENTS.includes(accent as TaskCenterAccent)) {
    return accent as TaskCenterAccent
  }
  return fallback
}

function normalizeTaskCenterRiskTone(
  tone?: string,
  fallback: TaskCenterRiskTone = 'default',
): TaskCenterRiskTone {
  if (tone && TASK_CENTER_RISK_TONES.includes(tone as TaskCenterRiskTone)) {
    return tone as TaskCenterRiskTone
  }
  return fallback
}

export function finalizeTaskSections<TItem>(
  sections: TaskCenterSection<TItem>[],
  options?: {
    order?: string[]
    defaultAccent?: TaskCenterAccent
  },
): TaskCenterSection<TItem>[] {
  const orderMap = new Map((options?.order || []).map((key, index) => [key, index]))
  const defaultAccent = options?.defaultAccent || 'blue'

  return [...sections]
    .map((section) => ({
      ...section,
      accent: normalizeTaskCenterAccent(section.accent, defaultAccent),
    }))
    .sort((a, b) => {
      const aOrder = orderMap.get(a.key) ?? Number.MAX_SAFE_INTEGER
      const bOrder = orderMap.get(b.key) ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.count !== b.count) return b.count - a.count
      return a.label.localeCompare(b.label, 'zh-CN')
    })
}

export function buildTaskCenterRiskOverview(items: TaskCenterRiskItem[]): TaskCenterRiskOverview {
  return items.reduce<TaskCenterRiskOverview>((summary, item) => {
    const count = Number(item.count || 0)
    summary.total += count
    summary[item.tone || 'default'] += count
    return summary
  }, {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    success: 0,
    default: 0,
  })
}

export function buildTaskCenterRiskCountMap(
  items: TaskCenterRiskItem[],
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = Number(item.count || 0)
    return acc
  }, {})
}

export function buildTaskCenterSectionCountMap<TItem>(
  sections: TaskCenterSection<TItem>[],
): Record<string, number> {
  return sections.reduce<Record<string, number>>((acc, section) => {
    acc[section.key] = Number(section.count || 0)
    return acc
  }, {})
}

export function finalizeTaskCenterRiskItems(
  items: TaskCenterRiskItem[],
  options?: {
    order?: string[]
  },
): TaskCenterRiskItem[] {
  const orderMap = new Map((options?.order || []).map((key, index) => [key, index]))
  const toneOrderMap = new Map(TASK_CENTER_RISK_TONES.map((tone, index) => [tone, index]))

  return [...items]
    .map((item) => ({
      ...item,
      tone: normalizeTaskCenterRiskTone(item.tone),
    }))
    .sort((a, b) => {
      const aOrder = orderMap.get(a.key) ?? Number.MAX_SAFE_INTEGER
      const bOrder = orderMap.get(b.key) ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      const aToneOrder = toneOrderMap.get(a.tone || 'default') ?? Number.MAX_SAFE_INTEGER
      const bToneOrder = toneOrderMap.get(b.tone || 'default') ?? Number.MAX_SAFE_INTEGER
      if (aToneOrder !== bToneOrder) return aToneOrder - bToneOrder
      if (a.count !== b.count) return b.count - a.count
      return a.label.localeCompare(b.label, 'zh-CN')
    })
}

export function finalizeCollaborationSections(
  sections: RoleCollaborationSection[],
  options?: {
    order?: string[]
  },
): RoleCollaborationSection[] {
  const orderMap = new Map((options?.order || []).map((key, index) => [key, index]))
  const roleOrderMap = new Map(TASK_CENTER_ROLE_ORDER.map((role, index) => [role, index]))

  return sections
    .map((section) => ({
      ...section,
      roles: [...section.roles].sort((a, b) => {
        const aOrder = roleOrderMap.get(a) ?? Number.MAX_SAFE_INTEGER
        const bOrder = roleOrderMap.get(b) ?? Number.MAX_SAFE_INTEGER
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.localeCompare(b, 'en')
      }),
    }))
    .filter((section) => section.count > 0)
    .sort((a, b) => {
      const aOrder = orderMap.get(a.key) ?? Number.MAX_SAFE_INTEGER
      const bOrder = orderMap.get(b.key) ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.count !== b.count) return b.count - a.count
      return a.label.localeCompare(b.label, 'zh-CN')
    })
}

export function composeTaskCenterDataBundle<TItem>(input: {
  taskSections: TaskCenterSection<TItem>[]
  riskItems: TaskCenterRiskItem[]
  collaborationSections: RoleCollaborationSection[]
}): TaskCenterDataBundle<TItem> {
  return {
    taskSections: input.taskSections,
    riskItems: input.riskItems,
    riskOverview: buildTaskCenterRiskOverview(input.riskItems),
    collaborationSections: input.collaborationSections,
  }
}

export function buildTaskCenterCompatFields<TItem>(
  taskCenter: TaskCenterDataBundle<TItem>,
): TaskCenterCompatFields<TItem> {
  return {
    taskCenter,
    taskSections: taskCenter.taskSections,
    riskItems: taskCenter.riskItems,
    riskOverview: taskCenter.riskOverview,
    collaborationSections: taskCenter.collaborationSections,
  }
}
