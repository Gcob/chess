import {defineStore} from 'pinia'
import {ref, watch} from 'vue'
import {BoardThemes, PieceThemes} from '@/types/look-and-feel'
import type {BoardSize} from '@/types/look-and-feel'

export interface Settings {
  boardThemeId: BoardThemes
  pieceThemeId: PieceThemes
  boardSize: BoardSize
}

const STORAGE_KEY = 'settings'

const DEFAULTS: Settings = {
  boardThemeId: BoardThemes.Wood,
  pieceThemeId: PieceThemes.Classic,
  boardSize: 'normal',
}

function loadFromStorage(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return {...DEFAULTS, ...JSON.parse(stored)}
    }
  } catch {
    // corrupted data, ignore
  }
  return {...DEFAULTS}
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadFromStorage())

  watch(settings, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, {deep: true})

  function reset() {
    settings.value = {...DEFAULTS}
  }

  return {settings, reset}
})
