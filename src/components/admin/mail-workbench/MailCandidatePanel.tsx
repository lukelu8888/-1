import React, { useState } from 'react'
import { toast } from 'sonner@2.0.3'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { useInquiry } from '../../../contexts/InquiryContext'
import { useUser } from '../../../contexts/UserContext'
import { customerInquiryDraftService } from '../../../lib/supabaseService'
import { mailCandidateService } from '../../../lib/services/mailCandidateService'
import { mailConversionService } from '../../../lib/services/mailConversionService'
import { mailLinkService } from '../../../lib/services/mailLinkService'
import { mailThreadService } from '../../../lib/services/mailThreadService'
import { buildDirectOrderDraftFromMailThread } from './buildDirectOrderDraftFromMailThread'
import { buildDraftProductsFromMailThread } from './buildDraftProductsFromMailThread'
import { buildDocumentTaskFromMailThread } from './buildDocumentTaskFromMailThread'
import { buildExportServiceOrderFromMailThread } from './buildExportServiceOrderFromMailThread'
import { buildInquiryFromMailThread } from './buildInquiryFromMailThread'
import { buildProjectActionItemFromMailThread } from './buildProjectActionItemFromMailThread'
import { buildProjectAnchorFromMailThread } from './buildProjectAnchorFromMailThread'
import { buildProjectMeetingFromMailThread } from './buildProjectMeetingFromMailThread'
import { exportServiceMailBridgeLookup } from '../../../lib/services/export-service/exportServiceMailBridgeLookup'
import type { MailCandidateRecord, MailCandidateType, MailThreadDetail } from './types'

const CANDIDATE_OPTIONS: Array<{
  value: MailCandidateType
  label: string
  targetType: string
}> = [
  { value: 'ing', label: '转正式询价候选', targetType: 'ING' },
  { value: 'repeat_quote', label: '转翻单询价候选', targetType: 'quotation_draft' },
  { value: 'repeat_direct_order', label: '转翻单直下单候选', targetType: 'direct_order_draft' },
  { value: 'project_meeting', label: '转项目会议纪要候选', targetType: 'project_meeting' },
  { value: 'project_action_item', label: '转项目行动项候选', targetType: 'project_action_item' },
  { value: 'export_service_order', label: '转借抬头服务委托候选', targetType: 'export_service_order' },
  { value: 'document_task', label: '转单证任务候选', targetType: 'document_task' },
]

export function MailCandidatePanel({
  thread,
  candidates,
  onChanged,
}: {
  thread: MailThreadDetail | null
  candidates: MailCandidateRecord[]
  onChanged: () => void
}) {
  const { addInquiry } = useInquiry()
  const { generateInquiryNumber, user, userInfo } = useUser()
  const [candidateType, setCandidateType] = useState<MailCandidateType>('ing')
  const [summary, setSummary] = useState('')

  if (!thread) {
    return null
  }

  const threadId = thread.id

  function handleCreate() {
    const trimmed = summary.trim()
    if (!trimmed) {
      toast.error('请先填写候选对象摘要')
      return
    }

    const option = CANDIDATE_OPTIONS.find((item) => item.value === candidateType)
    if (!option) return

    mailCandidateService.create(threadId, candidateType, trimmed, option.targetType)
    setSummary('')
    onChanged()
    toast.success('候选业务对象已创建')
  }

  function handleStatusChange(candidateId: string, status: MailCandidateRecord['status']) {
    mailCandidateService.updateStatus(candidateId, status)
    onChanged()
    toast.success('候选对象状态已更新')
  }

  async function handleConvert(candidate: MailCandidateRecord) {
    if (candidate.candidateType === 'ing') {
      try {
        const inquiry = await buildInquiryFromMailThread({
          thread,
          candidate,
          authUser: user,
          userInfo,
          generateInquiryNumber,
        })
        const savedInquiry = await addInquiry(inquiry)
        mailLinkService.create(thread.id, 'ING', savedInquiry.inquiryNumber || savedInquiry.id, '已关联正式询价')
        mailCandidateService.markConverted(candidate.id, savedInquiry.id, user?.email)
        mailThreadService.updateStatus(thread.id, 'linked')
        onChanged()
        toast.success(`已创建正式询价：${savedInquiry.inquiryNumber || savedInquiry.id}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to inquiry:', error)
        toast.error('转正式询价失败，请稍后重试')
        return
      }
    }

    if (candidate.candidateType === 'repeat_quote') {
      try {
        const customerEmail = thread.latestSenderEmail?.trim().toLowerCase()
        if (!customerEmail) {
          toast.error('当前邮件缺少客户邮箱，无法生成翻单询价草稿')
          return
        }

        await customerInquiryDraftService.upsert({
          customerEmail,
          customerUserId: user?.id || null,
          companyId: null,
          regionCode: String(user?.region || 'NA').trim().toUpperCase(),
          products: buildDraftProductsFromMailThread(thread),
          draftType: 'repeat_quote',
          status: 'active',
        })

        mailLinkService.create(thread.id, 'quotation_draft', customerEmail, '已关联翻单询价草稿')
        mailCandidateService.markConverted(candidate.id, customerEmail, user?.email)
        mailThreadService.updateStatus(thread.id, 'linked')
        onChanged()
        toast.success(`已创建翻单询价草稿：${customerEmail}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to repeat quote draft:', error)
        toast.error('转翻单询价草稿失败，请稍后重试')
        return
      }
    }

    if (candidate.candidateType === 'export_service_order') {
      try {
        const serviceOrder = buildExportServiceOrderFromMailThread({ thread, candidate })
        mailLinkService.create(
          thread.id,
          'export_service_order',
          serviceOrder.serviceOrderNumber,
          '已关联借抬头服务委托单',
        )
        mailCandidateService.markConverted(candidate.id, serviceOrder.id, user?.email)
        mailThreadService.updateThread(thread.id, {
          status: 'linked',
          linkedOrderNumber: serviceOrder.serviceOrderNumber,
        })
        onChanged()
        toast.success(`已创建借抬头服务委托单：${serviceOrder.serviceOrderNumber}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to export service order:', error)
        toast.error('转借抬头服务委托单失败，请稍后重试')
        return
      }
    }

    if (candidate.candidateType === 'repeat_direct_order') {
      try {
        const directOrderDraft = buildDirectOrderDraftFromMailThread({ thread, candidate })
        mailLinkService.create(
          thread.id,
          'direct_order_draft',
          directOrderDraft.draftNumber,
          '已关联翻单直下单草稿',
        )
        mailCandidateService.markConverted(candidate.id, directOrderDraft.id, user?.email)
        mailThreadService.updateThread(thread.id, {
          status: 'linked',
          linkedOrderNumber: directOrderDraft.draftNumber,
        })
        onChanged()
        toast.success(`已创建翻单直下单草稿：${directOrderDraft.draftNumber}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to repeat direct order draft:', error)
        toast.error('转翻单直下单草稿失败，请稍后重试')
        return
      }
    }

    if (candidate.candidateType === 'project_meeting') {
      try {
        const projectAnchor = buildProjectAnchorFromMailThread(thread)
        const meeting = buildProjectMeetingFromMailThread({ thread, candidate })
        mailLinkService.create(
          thread.id,
          'project_meeting',
          meeting.id,
          '已关联项目会议纪要',
        )
        mailCandidateService.markConverted(candidate.id, meeting.id, user?.email)
        mailThreadService.updateThread(thread.id, {
          status: 'linked',
          linkedProjectName: projectAnchor.projectCode,
        })
        onChanged()
        toast.success(`已创建项目会议纪要：${meeting.meetingTitle}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to project meeting:', error)
        toast.error('转项目会议纪要失败，请稍后重试')
        return
      }
    }

    if (candidate.candidateType === 'project_action_item') {
      try {
        const projectAnchor = buildProjectAnchorFromMailThread(thread)
        const actionItem = buildProjectActionItemFromMailThread({ thread, candidate })
        mailLinkService.create(
          thread.id,
          'project_action_item',
          actionItem.id,
          '已关联项目行动项',
        )
        mailCandidateService.markConverted(candidate.id, actionItem.id, user?.email)
        mailThreadService.updateThread(thread.id, {
          status: 'linked',
          linkedProjectName: projectAnchor.projectCode,
        })
        onChanged()
        toast.success(`已创建项目行动项：${actionItem.title}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to project action item:', error)
        toast.error('转项目行动项失败，请稍后重试')
        return
      }
    }

    if (candidate.candidateType === 'document_task') {
      try {
        const documentTask = buildDocumentTaskFromMailThread({ thread, candidate })
        mailLinkService.create(
          thread.id,
          'document_task',
          documentTask.taskNumber,
          '已关联单证任务',
        )
        mailCandidateService.markConverted(candidate.id, documentTask.id, user?.email)
        mailThreadService.updateStatus(thread.id, 'linked')
        onChanged()
        toast.success(`已创建单证任务：${documentTask.taskNumber}`)
        return
      } catch (error) {
        console.error('Failed to convert mail candidate to document task:', error)
        toast.error('转单证任务失败，请稍后重试')
        return
      }
    }

    const result = mailConversionService.convertCandidate(candidate)
    onChanged()
    toast.success(`已挂接到 ${result.targetType}：${result.targetNumber}`)
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-slate-900">候选业务对象面板</h4>
          <p className="mt-1 text-xs text-slate-500">第一阶段先做候选确认，再按人工确认动作生成正式对象或轻量正式底座。</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
          <Select value={candidateType} onValueChange={(value) => setCandidateType(value as MailCandidateType)}>
            <SelectTrigger>
              <SelectValue placeholder="选择候选类型" />
            </SelectTrigger>
            <SelectContent>
              {CANDIDATE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="填写建议理由、来源判断或人工备注"
            className="min-h-24"
          />

          <Button onClick={handleCreate}>新增候选</Button>
        </div>

        <div className="space-y-2">
          {candidates.length === 0 ? (
            <div className="text-sm text-slate-500">当前线程暂无候选对象。</div>
          ) : (
            candidates.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{item.candidateType}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.candidateSummary}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      建议目标：{item.suggestedTargetObjectType} · 状态：{item.status}
                    </div>
                    {item.candidateType === 'export_service_order' ? (() => {
                      const linkedOrder = exportServiceMailBridgeLookup.getByCandidate(item)
                      if (!linkedOrder) return null
                      return (
                        <div className="mt-2 rounded-md bg-orange-50 px-2 py-2 text-xs text-orange-700">
                          正式委托：{linkedOrder.serviceOrderNumber} / 状态：{linkedOrder.serviceStatus}
                          <div className="mt-1 text-orange-600">
                            {linkedOrder.bridgeSummary || '桥接摘要待同步'}
                          </div>
                        </div>
                      )
                    })() : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'pending_confirmation')}>
                      待确认
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'confirmed')}>
                      确认
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConvert(item)}
                      disabled={!['confirmed', 'pending_confirmation'].includes(item.status)}
                    >
                      转正式对象
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'rejected')}>
                      驳回
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
