import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/tajawal/arabic-400.css'
import '@fontsource/tajawal/arabic-500.css'
import '@fontsource/tajawal/arabic-700.css'
import '@fontsource/tajawal/arabic-800.css'
import '@fontsource/tajawal/latin-400.css'
import '@fontsource/tajawal/latin-500.css'
import '@fontsource/tajawal/latin-700.css'
import '@fontsource/tajawal/latin-800.css'
import App from './App'
import './index.css'
import { ensureDB } from '@/services/db'

ensureDB()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // SW is optional in this frontend-only demo; ignore registration failures.
    })
  })
}
