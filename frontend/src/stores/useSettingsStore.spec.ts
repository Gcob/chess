import {describe, it, expect, beforeEach} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {useSettingsStore} from './useSettingsStore'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('applies defaults when nothing is stored', () => {
    const store = useSettingsStore()
    expect(store.settings.highlightLastMove).toBe(true)
    expect(store.settings.showLegalMoves).toBe(true)
    expect(store.settings.boardSize).toBe('normal')
  })

  it('fills keys missing from older persisted settings with their defaults', () => {
    // settings saved before highlightLastMove and showLegalMoves existed
    localStorage.setItem('settings', JSON.stringify({boardSize: 'large'}))
    const store = useSettingsStore()
    expect(store.settings.boardSize).toBe('large')
    expect(store.settings.highlightLastMove).toBe(true)
    expect(store.settings.showLegalMoves).toBe(true)
  })

  it('falls back to defaults on corrupted storage', () => {
    localStorage.setItem('settings', '{not json')
    const store = useSettingsStore()
    expect(store.settings.highlightLastMove).toBe(true)
  })
})
