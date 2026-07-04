import {onScopeDispose, ref, type Ref} from 'vue'

// Reactive matchMedia. Pure SPA, so window is always available.
export function useMediaQuery(query: string): Ref<boolean> {
  const mql = window.matchMedia(query)
  const matches = ref(mql.matches)

  function onChange(event: MediaQueryListEvent) {
    matches.value = event.matches
  }

  mql.addEventListener('change', onChange)
  onScopeDispose(() => {
    mql.removeEventListener('change', onChange)
  })

  return matches
}

// Below $breakpoint-lg (1024px) → stacked mobile/tablet layout.
export function useIsMobile(): Ref<boolean> {
  return useMediaQuery('(max-width: 1023px)')
}
