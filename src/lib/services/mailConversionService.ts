import { mailCandidateService } from './mailCandidateService'
import { mailLinkService } from './mailLinkService'
import { mailThreadService } from './mailThreadService'
import type { MailCandidateRecord } from '../../components/admin/mail-workbench/types'

function buildTargetNumber(candidate: MailCandidateRecord): string {
  const suffix = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  switch (candidate.candidateType) {
    case 'ing':
      return `ING-${suffix}`
    case 'repeat_quote':
      return `QT-DRAFT-${suffix}`
    case 'repeat_direct_order':
      return `DIRECT-${suffix}`
    case 'project_meeting':
      return `PM-${suffix}`
    case 'project_action_item':
      return `PA-${suffix}`
    case 'export_service_order':
      return `ESO-${suffix}`
    case 'document_task':
      return `DOC-${suffix}`
    default:
      return `OBJ-${suffix}`
  }
}

function buildLinkLabel(candidate: MailCandidateRecord): string {
  switch (candidate.candidateType) {
    case 'ing':
      return '已转正式询价'
    case 'repeat_quote':
      return '已转翻单询价草稿'
    case 'repeat_direct_order':
      return '已转翻单直下单草稿'
    case 'project_meeting':
      return '已转项目会议纪要'
    case 'project_action_item':
      return '已转项目行动项'
    case 'export_service_order':
      return '已转借抬头服务委托单'
    case 'document_task':
      return '已转单证任务'
    default:
      return '已挂接正式对象'
  }
}

export const mailConversionService = {
  convertCandidate(candidate: MailCandidateRecord) {
    const targetNumber = buildTargetNumber(candidate)
    const label = buildLinkLabel(candidate)

    mailLinkService.create(
      candidate.threadId,
      candidate.suggestedTargetObjectType,
      targetNumber,
      label,
    )
    mailCandidateService.updateStatus(candidate.id, 'converted')
    mailThreadService.updateStatus(candidate.threadId, 'linked')

    return {
      targetType: candidate.suggestedTargetObjectType,
      targetNumber,
      label,
    }
  },
}
