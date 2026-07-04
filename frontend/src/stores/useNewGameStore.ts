import { defineStore } from 'pinia'
import { ref, watch, unref } from 'vue'
import type { GameMode } from '@/types/chess'
import { randomPlayerName } from '@/utils/randomName'
import i18n from '@/assets/i18n'

export interface NewGameSettings {
  mode: GameMode
  playerWhiteName: string
  playerBlackName: string
  timerEnabled: boolean
  timerMinutes: number
  timerIncrement: number
}

const STORAGE_KEY = 'new-game-settings'

// Fresh defaults: two distinct random names in the current UI language.
function makeDefaults(): NewGameSettings {
  // unref: i18n.global.locale is a ref at runtime (legacy:false) despite its plain-union type here.
  const locale = String(unref(i18n.global.locale))
  const playerWhiteName = randomPlayerName(locale)
  let playerBlackName = randomPlayerName(locale)
  for (let guard = 0; playerBlackName === playerWhiteName && guard < 10; guard++) {
    playerBlackName = randomPlayerName(locale)
  }

  return {
    mode: 'local',
    playerWhiteName,
    playerBlackName,
    timerEnabled: true,
    timerMinutes: 10,
    timerIncrement: 0,
  }
}

function loadFromStorage(): NewGameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...makeDefaults(), ...JSON.parse(stored) }
    }
  } catch {
    // corrupted data, ignore
  }
  return makeDefaults()
}

export const useNewGameStore = defineStore('new-game', () => {
  const settings = ref<NewGameSettings>(loadFromStorage())

  // Persist the first-run random defaults immediately, so they stay stable across reloads.
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  watch(settings, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function reset() {
    settings.value = makeDefaults()
  }

  return { settings, reset }
})
