import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
Object.defineProperty(window, 'requestAnimationFrame', { value: (callback: FrameRequestCallback) => { callback(0); return 0 }, writable: true })
afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  document.body.className = ''
})
