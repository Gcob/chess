import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

// Drives the browser's native beforeunload warning (refresh / close / external
// navigation). The dialog text is fixed by the browser — we only control whether
// it shows. A Set of keys lets independent features arm the guard without
// clobbering each other: the warning stays until the last key is released.
export const usePageLeaveGuard = defineStore('pageLeaveGuard', () => {
  const reasons = ref(new Set<string>())

  const shouldWarn = computed(() => reasons.value.size > 0)

  function guard(key: string) {
    reasons.value.add(key)
  }

  function release(key: string) {
    reasons.value.delete(key)
  }

  function handler(e: BeforeUnloadEvent) {
    if (!shouldWarn.value) return
    e.preventDefault()
    e.returnValue = '' // browsers ignore any custom message; presence is enough
  }

  // Attached once on first store instantiation. Pinia stores are lazy
  // singletons and this is a pure client SPA, so window is always available
  // and the listener lives for the app's lifetime.
  window.addEventListener('beforeunload', handler)

  return {shouldWarn, guard, release}
})
