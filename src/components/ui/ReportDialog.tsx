import { useState } from 'react'
import { Flag } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { reportContent, reportReasons } from '@/services/moderation.service'
import type { ReportTarget } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  targetType: ReportTarget
  targetId: string
}

export default function ReportDialog({ open, onClose, targetType, targetId }: Props) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const reasons = reportReasons()
  const [reason, setReason] = useState(reasons[0])
  const [sending, setSending] = useState(false)

  async function submit() {
    if (!user) return
    setSending(true)
    try {
      await reportContent(user.id, targetType, targetId, reason)
      toast(t('شكرًا لبلاغك، هيتم مراجعته', 'Thanks for reporting. We will review it'))
      onClose()
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('إبلاغ عن محتوى', 'Report content')} size="sm">
      <p className="mb-3 text-sm leading-relaxed text-muted">{t('اختر السبب الأقرب', 'Choose the closest reason')}</p>
      <div className="space-y-2">
        {reasons.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 text-sm text-ink has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
            <input type="radio" name={`report-${targetType}-${targetId}`} checked={reason === item} onChange={() => setReason(item)} className="accent-primary" />
            {item}
          </label>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <button className="btn-outline flex-1" onClick={onClose}>{t('إلغاء', 'Cancel')}</button>
        <button className="btn-danger flex-1" disabled={sending} onClick={() => void submit()}><Flag size={15} /> {sending ? t('جارٍ الإرسال...', 'Sending...') : t('إرسال البلاغ', 'Submit report')}</button>
      </div>
    </Modal>
  )
}
