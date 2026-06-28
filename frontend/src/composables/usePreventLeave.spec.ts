import {describe, it, expect, beforeEach} from 'vitest'
import {defineComponent, nextTick, ref} from 'vue'
import type {MaybeRefOrGetter} from 'vue'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {usePreventLeave} from './usePreventLeave'
import {usePageLeaveGuard} from '@/stores/usePageLeaveGuard'

function mountWith(active: MaybeRefOrGetter<boolean>) {
  const Comp = defineComponent({
    setup() {
      usePreventLeave(active)
      return () => null
    },
  })
  return mount(Comp)
}

describe('usePreventLeave', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('arms the guard immediately when active is true', () => {
    mountWith(() => true)
    expect(usePageLeaveGuard().shouldWarn).toBe(true)
  })

  it('does not arm when active is false', () => {
    mountWith(() => false)
    expect(usePageLeaveGuard().shouldWarn).toBe(false)
  })

  it('reacts to condition changes', async () => {
    const active = ref(false)
    mountWith(active)
    const store = usePageLeaveGuard()
    expect(store.shouldWarn).toBe(false)

    active.value = true
    await nextTick()
    expect(store.shouldWarn).toBe(true)

    active.value = false
    await nextTick()
    expect(store.shouldWarn).toBe(false)
  })

  it('releases its key on unmount', () => {
    const wrapper = mountWith(() => true)
    const store = usePageLeaveGuard()
    expect(store.shouldWarn).toBe(true)

    wrapper.unmount()
    expect(store.shouldWarn).toBe(false)
  })

  it('keeps the warning if another guard remains after unmount', () => {
    const store = usePageLeaveGuard()
    store.guard('external')
    const wrapper = mountWith(() => true)

    wrapper.unmount()
    expect(store.shouldWarn).toBe(true)
  })
})
