import {describe, it, expect, beforeEach, vi} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {usePageLeaveGuard} from './usePageLeaveGuard'

describe('usePageLeaveGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does not warn with no reasons', () => {
    const store = usePageLeaveGuard()
    expect(store.shouldWarn).toBe(false)
  })

  it('warns when a reason is added', () => {
    const store = usePageLeaveGuard()
    store.guard('a')
    expect(store.shouldWarn).toBe(true)
  })

  it('stops warning when the last reason is released', () => {
    const store = usePageLeaveGuard()
    store.guard('a')
    store.release('a')
    expect(store.shouldWarn).toBe(false)
  })

  it('keeps warning while any reason remains (independent keys)', () => {
    const store = usePageLeaveGuard()
    store.guard('a')
    store.guard('b')
    store.release('a')
    expect(store.shouldWarn).toBe(true)
    store.release('b')
    expect(store.shouldWarn).toBe(false)
  })

  it('is idempotent for the same key', () => {
    const store = usePageLeaveGuard()
    store.guard('a')
    store.guard('a')
    store.release('a')
    expect(store.shouldWarn).toBe(false)
  })

  it('calls preventDefault on beforeunload only while warning', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const store = usePageLeaveGuard()
    const handler = addSpy.mock.calls.find((c) => c[0] === 'beforeunload')?.[1] as EventListener

    const fire = () => {
      const e = new Event('beforeunload') as BeforeUnloadEvent
      const preventDefault = vi.spyOn(e, 'preventDefault')
      handler(e)
      return preventDefault
    }

    expect(fire()).not.toHaveBeenCalled()

    store.guard('a')
    expect(fire()).toHaveBeenCalled()
  })
})
