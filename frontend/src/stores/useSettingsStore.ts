import {defineStore} from 'pinia'
import {ref, watch} from 'vue'
import {BoardThemes, PieceThemes} from '@/types/look-and-feel'
import type {BoardSize} from '@/types/look-and-feel'

export interface Settings {
  boardThemeId: BoardThemes
  pieceThemeId: PieceThemes
  boardSize: BoardSize
  highlightLastMove: boolean
  showLegalMoves: boolean
  // Local games on mobile (phone flat between the players): the pieces turn 180° on
  // themselves toward the player to move. Desktop never turns anything.
  autoFlipPieces: boolean
  // Unlocks the dev game mode (QA scenarios) in the new-game form — the setting IS the gate,
  // so the tooling also works against preview/prod builds.
  devMode: boolean
}

const STORAGE_KEY = 'settings'

const DEFAULTS: Settings = {
  boardThemeId: BoardThemes.Wood,
  pieceThemeId: PieceThemes.Classic,
  boardSize: 'normal',
  highlightLastMove: true,
  showLegalMoves: true,
  autoFlipPieces: true,
  devMode: false,
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
