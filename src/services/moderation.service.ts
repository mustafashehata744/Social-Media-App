import { pick } from '@/lib/lang'
import { read, uid, write } from '@/lib/storage'
import { KEYS, ensureDB } from './db'
import { blockUser, isBlocked, isMuted, toggleMute, unblockUser } from './users.service'
import type { Report, ReportTarget } from '@/types'

const REASONS = [
  pick('محتوى غير لائق', 'Inappropriate content'),
  pick('مضايقة أو تنمّر', 'Harassment or bullying'),
  pick('معلومات مضللة', 'Misinformation'),
  pick('بريد عشوائي', 'Spam'),
] as const

export function reportReasons(): string[] {
  return [...REASONS]
}

export async function reportContent(
  reporterId: string,
  targetType: ReportTarget,
  targetId: string,
  reason: string,
): Promise<void> {
  ensureDB()
  const reports = read<Report[]>(KEYS.reports, [])
  if (reports.some((item) => item.reporterId === reporterId && item.targetType === targetType && item.targetId === targetId)) {
    throw new Error(pick('أبلغت عن هذا المحتوى من قبل', 'You have already reported this content'))
  }
  reports.push({
    id: uid('r'), reporterId, targetType, targetId,
    reason: reason.trim() || REASONS[0],
    createdAt: new Date().toISOString(),
  })
  write(KEYS.reports, reports)
}

export function hasReported(reporterId: string, targetType: ReportTarget, targetId: string): boolean {
  ensureDB()
  return read<Report[]>(KEYS.reports, [])
    .some((item) => item.reporterId === reporterId && item.targetType === targetType && item.targetId === targetId)
}

export function getMyReports(reporterId: string): Report[] {
  ensureDB()
  return read<Report[]>(KEYS.reports, [])
    .filter((item) => item.reporterId === reporterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export { blockUser, isBlocked, isMuted, toggleMute, unblockUser }
