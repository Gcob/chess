import {computed, reactive} from 'vue'
import {useGameSession} from '@/composables/useGameSession'
import {useSettingsStore} from '@/stores/useSettingsStore'
import type {PieceColor, SquareKey} from '@/types/chess'

// The reactive DTO for the whole game view. GamePage builds it once and passes it as a single
// `:view` prop down to the layout and its sections — no prop/event drilling.
//
// Mode-dependent behaviour lives here in ONE place (the orientation policy for now). Only 'local'
// is implemented — other modes add their case here rather than scattering conditions in the UI.
export function useGameView(id: string) {
  const session = useGameSession(id)
  const settingsStore = useSettingsStore()

  const activeColor = computed<PieceColor>(() => session.game.value?.activeColor ?? 'white')

  // Local mode: the board follows the player to move (auto-flip). Others come later.
  const orientation = computed<PieceColor>(() => {
    if (session.game.value?.mode === 'local') {
      return activeColor.value
    }

    return 'white' // TODO: seed from the local player's colour for vs-bot / online
  })

  function move(from: SquareKey, to: SquareKey) {
    session.makeMove(from, to)
  }

  function proposeDraw() {
    // TODO: implement with the rules/flow engine
  }

  // Which color sits at the top / bottom of the board — the layout places each player accordingly.
  const bottomColor = computed<PieceColor>(() => orientation.value)
  const topColor = computed<PieceColor>(() => (orientation.value === 'white' ? 'black' : 'white'))

  return reactive({
    game: session.game,
    moves: session.moves,
    whitePlayer: session.whitePlayer,
    blackPlayer: session.blackPlayer,
    activeColor,
    orientation,
    topColor,
    bottomColor,
    boardSize: computed(() => settingsStore.settings.boardSize),
    isGameOver: session.isGameOver,
    move,
    resign: session.resign,
    proposeDraw,
  })
}

export type GameView = ReturnType<typeof useGameView>
