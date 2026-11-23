import type { BackgroundPreset } from '@/types'

export const BACKGROUNDS: Array<{
  id: BackgroundPreset
  label: string
  swatch: string
}> = [
  { id: 'default', label: 'افتراضي', swatch: 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800' },
  { id: 'aurora', label: 'شفق', swatch: 'bg-gradient-to-br from-sky-300 via-blue-400 to-violet-500' },
  { id: 'sunset', label: 'غروب', swatch: 'bg-gradient-to-br from-rose-300 via-orange-400 to-pink-500' },
  { id: 'mint', label: 'نعناع', swatch: 'bg-gradient-to-br from-emerald-300 via-teal-400 to-lime-400' },
  { id: 'night', label: 'ليل', swatch: 'bg-gradient-to-br from-indigo-700 via-violet-800 to-slate-900' },
]
