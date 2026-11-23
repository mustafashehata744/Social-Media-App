import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, Undo2, X, XCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction) => {
    const id = ++counter
    setToasts((items) => [...items, { id, message, type, action }])
    window.setTimeout(() => dismiss(id), action ? 6500 : 3600)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])
  const icons = { success: CheckCircle2, error: XCircle, info: Info }
  const colors = {
    success: 'text-emerald-500', error: 'text-rose-500', info: 'text-primary',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-20 start-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2 md:bottom-6"
      >
        {toasts.map((item) => {
          const Icon = icons[item.type]
          return (
            <div key={item.id} role="status" className="pointer-events-auto flex animate-pop-in items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-pop">
              <Icon size={20} className={colors[item.type]} />
              <p className="flex-1 text-sm font-medium text-ink">{item.message}</p>
              {item.action && (
                <button
                  type="button"
                  onClick={() => { item.action?.onClick(); dismiss(item.id) }}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold text-primary transition hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Undo2 size={14} /> {item.action.label}
                </button>
              )}
              <button onClick={() => dismiss(item.id)} aria-label="إغلاق التنبيه" className="rounded-lg p-1 text-muted transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
