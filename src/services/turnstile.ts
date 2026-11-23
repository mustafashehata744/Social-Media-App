interface TurnstileAPI {
  render(container: HTMLElement, options: Record<string, unknown>): string
  remove(widget: string): void
}
declare global { interface Window { turnstile?: TurnstileAPI } }
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
let loading: Promise<void> | undefined
function loadWidget(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!loading) loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('تعذر تحميل تحقق الأمان. تحقق من الاتصال وحاول مرة أخرى.')) }
    document.head.append(script)
  })
  return loading
}
/** A fresh, single-use challenge is required for every inference. No provider key lives here. */
export async function getAIToken(): Promise<string> {
  if (!SITE_KEY) throw new Error('تحقق الأمان غير مُعدّ بعد.')
  await loadWidget()
  return new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog')
    dialog.dir = 'rtl'
    dialog.style.cssText = 'width:min(360px,calc(100vw - 24px));padding:20px;border:1px solid #ddd;border-radius:16px;background:#fff;color:#172033;z-index:2147483647'
    dialog.setAttribute('aria-label', 'تحقق الأمان للمساعد')
    const title = document.createElement('h2')
    title.textContent = 'تحقق سريع للمساعد'
    title.style.cssText = 'font-size:18px;margin:0 0 12px'
    const note = document.createElement('p')
    note.textContent = 'سيُرسل طلبك إلى Cloudflare لمعالجته بالذكاء الاصطناعي. لا ترسل معلومات حساسة. الاستخدام مجاني بحد يومي.'
    note.style.cssText = 'font-size:14px;line-height:1.7;margin:0 0 12px'
    const container = document.createElement('div')
    const cancel = document.createElement('button')
    cancel.textContent = 'إلغاء'
    cancel.style.cssText = 'margin-top:14px;padding:8px 20px;border:1px solid #ccd0d8;border-radius:8px;cursor:pointer'
    // Widget callbacks run after render returns.
    // eslint-disable-next-line prefer-const
    let widget: string | undefined
    let finished = false
    const finish = (token?: string, message = 'تم إلغاء طلب المساعد.') => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      if (widget) window.turnstile?.remove(widget)
      dialog.close()
      dialog.remove()
      if (token) resolve(token)
      else reject(new Error(message))
    }
    const timer = window.setTimeout(() => finish(undefined, 'انتهت مهلة تحقق الأمان. حاول مرة أخرى.'), 120000)
    cancel.onclick = () => finish()
    dialog.oncancel = (event) => { event.preventDefault(); finish() }
    dialog.append(title, note, container, cancel)
    document.body.append(dialog)
    dialog.showModal()
    widget = window.turnstile!.render(container, {
      sitekey: SITE_KEY, action: 'tawasol-ai', theme: 'light', size: 'flexible', language: 'ar',
      callback: (token: string) => finish(token),
      'error-callback': () => finish(undefined, 'تعذر تحقق الأمان. حاول مرة أخرى.'),
      'expired-callback': () => finish(undefined, 'انتهى تحقق الأمان. حاول مرة أخرى.'),
    })
  })
}
