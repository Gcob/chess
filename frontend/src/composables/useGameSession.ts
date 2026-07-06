import { computed } from 'vue'
import { useGamesStore } from '@/stores/useGamesStore'
import * as engine from '@/engine/game'
import type { Game, SquareKey } from '@/types/chess'

export function useGameSession(id: string) {
  const store = useGamesStore()

  const session = computed(() => store.get(id))
  const game = computed(() => session.value?.game)
  const board = computed(() => game.value?.board)
  const moves = computed(() => game.value?.moves ?? [])

  const whitePlayer = computed(() => game.value?.players.white)
  const blackPlayer = computed(() => game.value?.players.black)

  // activeColor is the source of truth — robust against move cancellation,
  // FEN resume, and spectator mode
  const currentPlayer = computed(() => {
    const g = game.value
    if (!g) return undefined
    return g.players[g.activeColor]
  })

  const isGameOver = computed(() => game.value?.status === 'finished')

  // All game commands go through the engine — guards (status, turn, legality) live there.
  // This only centralizes the "session still exists" check.
  function withGame(command: (g: Game) => void) {
    const g = game.value
    if (g) {
      command(g)
    }
  }

  function makeMove(from: SquareKey, to: SquareKey) {
    withGame(g => engine.makeMove(g, from, to))
  }

  // Local mode: the resigner is the player to move.
  function resign() {
    withGame(g => engine.resign(g, g.activeColor))
  }

  // Local mode: the offer comes from the player to move; the opponent answers
  // (accept/decline buttons, or simply playing a move — the engine declines it then).
  function offerDraw() {
    withGame(g => engine.offerDraw(g, g.activeColor))
  }

  function acceptDraw() {
    withGame(engine.acceptDraw)
  }

  function declineDraw() {
    withGame(engine.declineDraw)
  }

  return {
    session,
    game,
    board,
    moves,
    whitePlayer,
    blackPlayer,
    currentPlayer,
    isGameOver,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
  }
}
