import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Settings {
  sound: boolean
  pieceThemeId: string  // references a PieceTheme id — independent from board
  boardThemeId: string  // references a BoardTheme id — independent from pieces
}

const STORAGE_KEY = 'settings'

const DEFAULTS: Settings = {
  sound: true,
  pieceThemeId: 'classic',
  boardThemeId: 'green',
}

function loadFromStorage(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULTS, ...JSON.parse(stored) }
    }
  } catch {
    // corrupted data, ignore
  }
  return { ...DEFAULTS }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadFromStorage())

  watch(settings, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function reset() {
    settings.value = { ...DEFAULTS }
  }

  return { settings, reset }
})
