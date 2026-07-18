import {vi} from 'vitest'

// jsdom ships no matchMedia. The vitest setup file stubs a desktop (no-match) default so the
// composables built on useMediaQuery work in every spec; a spec simulates mobile by calling
// stubMatchMedia(true) BEFORE building its view/component (the query is read at call time).
export function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
}
