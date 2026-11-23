import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Modal from './Modal'

vi.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ t: (ar: string) => ar }) }))

let root: Root
let host: HTMLDivElement
let scroll: ReturnType<typeof vi.fn>
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div')
  host.style.transform = 'translateY(0)'
  document.body.append(host)
  root = createRoot(host)
  scroll = vi.fn()
  vi.stubGlobal('scrollTo', scroll)
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 620 })
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
async function render(children: ReactNode) {
  await act(async () => root.render(children))
}

describe('Modal mobile regression', () => {
  it('portals outside animated/clipped feed ancestors and focuses without scrolling', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    await render(<Modal open onClose={() => {}} title="Test"><input /></Modal>)
    const dialog = document.querySelector('[role=dialog]')!
    expect(dialog.parentElement?.parentElement).toBe(document.body)
    expect(host.contains(dialog)).toBe(false)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-620px')
  })

  it('does not unlock or restore scroll when inline close callback changes during typing', async () => {
    await render(<Modal open onClose={() => {}} title="Test"><input defaultValue="a" /></Modal>)
    await render(<Modal open onClose={() => {}} title="Test"><input defaultValue="ab" /></Modal>)
    expect(scroll).not.toHaveBeenCalled()
    expect(document.body.style.position).toBe('fixed')
    await render(<Modal open={false} onClose={() => {}}>{null}</Modal>)
    expect(document.body.style.position).toBe('')
    expect(scroll).toHaveBeenCalledWith({ left: 0, top: 620, behavior: 'instant' })
  })

  it('keeps the page locked until the last overlay closes', async () => {
    const pair = (second: boolean) => <><Modal open onClose={() => {}}>{null}</Modal><Modal open={second} onClose={() => {}}>{null}</Modal></>
    await render(pair(true))
    await render(pair(false))
    expect(document.body.style.position).toBe('fixed')
    expect(scroll).not.toHaveBeenCalled()
    await render(null)
    expect(document.body.style.position).toBe('')
    expect(scroll).toHaveBeenCalledTimes(1)
  })
})
