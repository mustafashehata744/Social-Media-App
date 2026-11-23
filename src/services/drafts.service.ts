import { read, writeSilently } from '@/lib/storage'
import { KEYS, ensureDB } from './db'

type DraftMap = Record<string, string>

function drafts(): DraftMap {
  ensureDB()
  return read<DraftMap>(KEYS.drafts, {})
}

export function getDraft(key: string): string {
  return drafts()[key] ?? ''
}

export function saveDraft(key: string, value: string): void {
  const all = drafts()
  if (value.trim()) all[key] = value
  else delete all[key]
  writeSilently(KEYS.drafts, all)
}

export function clearDraft(key: string): void {
  const all = drafts()
  if (!(key in all)) return
  delete all[key]
  writeSilently(KEYS.drafts, all)
}
