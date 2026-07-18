import {computed, reactive} from 'vue'
import {useGameSession} from '@/composables/useGameSession'
import {useGameClock} from '@/composables/useGameClock'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {getCapturedPieces, type CapturedByColor} from '@/engine/material'
import {findKingSquare, toSquareKey} from '@/engine/board'
import {legalDestinations} from '@/engine/move'
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

  // Legal destinations of the piece on `from`, always — the query behind the touch drop pop.
  // Drop feedback is legality feedback, never gated by the hints setting.
  function dropTargets(from: SquareKey): SquareKey[] {
    const game = session.game.value
    return game ? legalDestinations(game.board, from) : []
  }

  // The same query behind the board's move hints, gated by a per-viewer setting (default on) —
  // empty hides the hints.
  function legalTargets(from: SquareKey): SquareKey[] {
    return settingsStore.settings.showLegalMoves ? dropTargets(from) : []
  }

  // Which color's pieces accept interaction (drag / click-to-move). Local mode: the player to
  // move; nobody once the game is over. Remote modes will pin this to the local player's color.
  const movableColor = computed<PieceColor | null>(() => {
    const game = session.game.value
    if (!game || game.status === 'finished') {
      return null
    }

    return game.activeColor
  })

  // From/to squares of the last played move, for the board highlight.
  // Gated by a per-viewer setting (default on) — null hides the highlight.
  const lastMove = computed<{ from: SquareKey; to: SquareKey } | null>(() => {
    if (!settingsStore.settings.highlightLastMove) {
      return null
    }

    const moves = session.moves.value
    const last = moves[moves.length - 1]
    return last ? {from: last.from, to: last.to} : null
  })

  // Squares of the kings currently in check — a rule indicator, never gated by a setting.
  // Legality guarantees at most the side to move is in check; scanning both colors stays as a net.
  const checkSquares = computed<SquareKey[]>(() => {
    const game = session.game.value
    if (!game) {
      return []
    }

    const squares: SquareKey[] = []
    for (const color of ['white', 'black'] as const) {
      const king = findKingSquare(game.board, color)
      if (game.players[color].isInCheck && king) {
        squares.push(toSquareKey(king))
      }
    }

    return squares
  })

  // Captures derived once from the move history — both player cards consume this.
  const captured = computed<CapturedByColor>(() =>
    session.game.value ? getCapturedPieces(session.game.value) : {white: [], black: []},
  )

  // Live remaining seconds per color (null = untimed) — ticks while the game is active,
  // flags the timeout at zero. One clock instance shared by both player cards.
  const clocks = useGameClock(session.game)

  // Pending draw offer (who offered) — drives the accept/decline UI in GameActions.
  const drawOffer = computed<PieceColor | null>(() => session.game.value?.drawOffer ?? null)

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
    lastMove,
    checkSquares,
    movableColor,
    captured,
    clocks,
    isGameOver: session.isGameOver,
    drawOffer,
    move,
    dropTargets,
    legalTargets,
    resign: session.resign,
    offerDraw: session.offerDraw,
    acceptDraw: session.acceptDraw,
    declineDraw: session.declineDraw,
  })
}

export type GameView = ReturnType<typeof useGameView>
