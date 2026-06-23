import React, { useState } from 'react'
import { toast } from 'sonner@2.0.3'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { mailDispatchService } from '../../../lib/services/mailDispatchService'
import type { MailDispatchRecord } from './types'

const DEPARTMENT_OPTIONS = [
  { department: 'Sales', role: 'Sales_Rep', label: '销售待处理箱' },
  { department: 'Project', role: 'Sales_Director', label: '项目待处理箱' },
  { department: 'Procurement', role: 'Procurement', label: '采购待处理箱' },
  { department: 'Documentation', role: 'Documentation_Officer', label: '单证待处理箱' },
  { department: 'Finance', role: 'Finance', label: '财务待处理箱' },
]

export function MailDispatchPanel({
  threadId,
  dispatches,
  onChanged,
}: {
  threadId?: string
  dispatches: MailDispatchRecord[]
  onChanged: () => void
}) {
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState<string>('Sales')
  const [priority, setPriority] = useState<'normal' | 'high'>('normal')

  if (!threadId) {
    return null
  }

  function handleCreate() {
    const option = DEPARTMENT_OPTIONS.find((item) => item.department === selectedDepartmentKey)
    if (!option) return

    mailDispatchService.create(threadId, {
      dispatchType: 'to_department',
      assignedRole: option.role,
      assignedDepartment: option.department,
      priority,
    })
    onChanged()
    toast.success('已分发到待处理箱')
  }

  function handleStatusChange(dispatchId: string, status: MailDispatchRecord['status']) {
    mailDispatchService.updateStatus(dispatchId, status)
    onChanged()
    toast.success('分发状态已更新')
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-slate-900">分发与责任链面板</h4>
          <p className="mt-1 text-xs text-slate-500">第一阶段先支持部门待处理箱、签收和升级前的基本流转。</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[220px_180px_auto]">
          <Select value={selectedDepartmentKey} onValueChange={setSelectedDepartmentKey}>
            <SelectTrigger>
              <SelectValue placeholder="选择待处理箱" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENT_OPTIONS.map((item) => (
                <SelectItem key={item.department} value={item.department}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(value) => setPriority(value as 'normal' | 'high')}>
            <SelectTrigger>
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">正常</SelectItem>
              <SelectItem value="high">高优先级</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleCreate}>分发线程</Button>
        </div>

        <div className="space-y-2">
          {dispatches.length === 0 ? (
            <div className="text-sm text-slate-500">当前线程暂无分发记录。</div>
          ) : (
            dispatches.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{item.assignedDepartment} / {item.assignedRole}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      类型：{item.dispatchType} · 状态：{item.status} · 优先级：{item.priority}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'accepted')}>
                      签收
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'resolved')}>
                      已处理
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'escalated')}>
                      升级
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
