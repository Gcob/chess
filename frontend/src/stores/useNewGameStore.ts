import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { GameMode } from '@/types/chess'
import { randomIdentity } from '@/utils/randomName'
import { AVATAR_IDS } from '@/themes/avatars'

// The form's mode vocabulary — 'dev' is a FORM mode, not a domain GameMode: the game it
// creates is a genuine 'local' game whose history was pre-played (the DTO never knows).
export type NewGameMode = GameMode | 'dev'

export interface NewGameSettings {
  mode: NewGameMode
  playerWhiteName: string
  playerBlackName: string
  playerWhiteAvatar: string
  playerBlackAvatar: string
  timerEnabled: boolean
  timerMinutes: number
  timerIncrement: number
  // Dev mode: the QA scenario replayed into the new game (see src/dev/scenarios.ts).
  scenarioId: string | null
}

const STORAGE_KEY = 'new-game-settings'

// Fresh defaults: each player gets a random avatar and a matching funny name (distinct avatars).
function makeDefaults(): NewGameSettings {
  const white = randomIdentity()
  const black = randomIdentity(white.avatar)

  return {
    mode: 'local',
    playerWhiteName: white.name,
    playerBlackName: black.name,
    playerWhiteAvatar: white.avatar,
    playerBlackAvatar: black.avatar,
    timerEnabled: true,
    timerMinutes: 10,
    timerIncrement: 0,
    scenarioId: null,
  }
}

function loadFromStorage(): NewGameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const defaults = makeDefaults()
      const merged: NewGameSettings = { ...defaults, ...JSON.parse(stored) }

      // Drop avatar ids that no longer exist (e.g. after changing the avatar set).
      if (!AVATAR_IDS.includes(merged.playerWhiteAvatar)) {
        merged.playerWhiteAvatar = defaults.playerWhiteAvatar
      }
      if (!AVATAR_IDS.includes(merged.playerBlackAvatar)) {
        merged.playerBlackAvatar = defaults.playerBlackAvatar
      }

      return merged
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
