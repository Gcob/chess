import {onScopeDispose, toValue, watch} from 'vue'
import type {MaybeRefOrGetter} from 'vue'
import {usePageLeaveGuard} from '@/stores/usePageLeaveGuard'

let nextId = 0

// Arms the browser leave-warning while `active` is truthy. Each call owns a
// unique key and releases it automatically when the owning scope is disposed,
// so a component can wire this once and forget about cleanup.
export function usePreventLeave(active: MaybeRefOrGetter<boolean>) {
  const store = usePageLeaveGuard()
  const key = `prevent-leave-${nextId++}`

  watch(
    () => toValue(active),
    (on) => {
      if (on) store.guard(key)
      else store.release(key)
    },
    {immediate: true},
  )

  onScopeDispose(() => store.release(key))
}
