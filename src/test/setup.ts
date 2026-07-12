import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
Object.defineProperty(window, 'requestAnimationFrame', { value: (callback: FrameRequestCallback) => { callback(0); return 0 }, writable: true })
Object.defineProperty(window, 'cancelAnimationFrame', { value: vi.fn(), writable: true })
Object.defineProperty(Element.prototype, 'scrollIntoView', { value: vi.fn(), writable: true })
afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  document.body.className = ''
})
