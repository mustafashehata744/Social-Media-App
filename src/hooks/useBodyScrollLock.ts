import { useEffect } from 'react'

let locks = 0
let restore: (() => void) | undefined

// A fixed body also prevents background swipes on iOS. Share the lock so
// closing one overlay cannot unlock the page under another overlay.
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (locks++ === 0) {
      const { body, documentElement: html } = document
      const x = window.scrollX
      const y = window.scrollY
      const saved = {
        position: body.style.position, top: body.style.top,
        left: body.style.left, right: body.style.right,
        width: body.style.width, overflow: body.style.overflow,
      }
      const anchor = html.style.overflowAnchor
      body.style.position = 'fixed'
      body.style.top = `-${y}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      html.style.overflowAnchor = 'none'
      restore = () => {
        Object.assign(body.style, saved)
        html.style.overflowAnchor = anchor
        const behavior = html.style.scrollBehavior
        html.style.scrollBehavior = 'auto'
        window.scrollTo({ left: x, top: y, behavior: 'instant' })
        html.style.scrollBehavior = behavior
      }
    }
    return () => {
      if (--locks === 0) {
        restore?.()
        restore = undefined
      }
    }
  }, [active])
}
