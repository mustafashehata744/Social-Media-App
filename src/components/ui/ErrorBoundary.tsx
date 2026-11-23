import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Tawasol UI error', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-5">
        <div className="card w-full max-w-md p-7 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle size={28} />
          </span>
          <h1 className="text-xl font-extrabold text-ink">تعذّر عرض الصفحة</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            حدث خطأ غير متوقع في الواجهة. بياناتك المحلية لم تُحذف؛ جرّب إعادة التحميل أولًا.
          </p>
          <details className="mt-4 rounded-xl bg-surface-2 p-3 text-start text-xs text-muted">
            <summary className="cursor-pointer font-bold">تفاصيل الخطأ</summary>
            <p dir="ltr" className="mt-2 break-words">{this.state.error.message}</p>
          </details>
          <div className="mt-5 flex gap-2">
            <button className="btn-outline flex-1" onClick={() => window.location.assign('/feed')}>الرئيسية</button>
            <button className="btn-primary flex-1" onClick={this.reset}><RefreshCw size={16} /> إعادة المحاولة</button>
          </div>
        </div>
      </div>
    )
  }
}
