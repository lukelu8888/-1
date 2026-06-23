import type { MailThreadDetail } from './types'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildProjectAnchorFromMailThread(thread: MailThreadDetail) {
  const projectCode = thread.linkedProjectName?.trim() || `MAIL-${thread.id.slice(-4).toUpperCase()}`
  const anchorSlug = slugify(projectCode) || thread.id
  const projectId = `mail-project-${anchorSlug}`

  return {
    projectId,
    projectRevisionId: `${projectId}-rev-mail`,
    projectCode,
    projectName: thread.linkedProjectName?.trim() || thread.subject.trim(),
  }
}
