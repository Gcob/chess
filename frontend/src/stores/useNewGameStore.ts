import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { GameMode } from '@/types/chess'

export interface NewGameSettings {
  mode: GameMode
  playerWhiteName: string
  playerBlackName: string
  timerEnabled: boolean
  timerMinutes: number
  timerIncrement: number
}

const STORAGE_KEY = 'new-game-settings'

const DEFAULTS: NewGameSettings = {
  mode: 'local',
  playerWhiteName: 'Player 1',
  playerBlackName: 'Player 2',
  timerEnabled: true,
  timerMinutes: 10,
  timerIncrement: 0,
}

function loadFromStorage(): NewGameSettings {
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

export const useNewGameStore = defineStore('new-game', () => {
  const settings = ref<NewGameSettings>(loadFromStorage())

  watch(settings, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function reset() {
    settings.value = { ...DEFAULTS }
  }

  return { settings, reset }
})
