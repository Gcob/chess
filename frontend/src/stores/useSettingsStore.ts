// src/stores/useSettingsStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Settings {
  sound: boolean
  boardTheme: 'classic' | 'modern' | 'wood'
  pieceStyle: 'standard' | 'minimalist' | 'pixel'
}

const STORAGE_KEY = 'settings'

const DEFAULTS: Settings = {
  sound: true,
  boardTheme: 'classic',
  pieceStyle: 'standard',
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
