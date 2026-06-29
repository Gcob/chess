import { computed } from 'vue'
import { useGamesStore } from '@/stores/useGamesStore'
import { canMove, applyMove } from '@/engine/move'
import type { SquareKey } from '@/types/chess'

export function useGameSession(id: number) {
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

  // Routes every move through the engine, even while its rules are a placeholder.
  // TODO: flip activeColor and record the Move/pgn once the rules engine lands.
  function makeMove(from: SquareKey, to: SquareKey) {
    const b = board.value
    if (!b || !canMove(b, from, to)) return
    applyMove(b, from, to)
  }

  // TODO: update game status and winner when player model supports it
  function resign() {
    const g = game.value
    if (!g) return
    g.status = 'finished'
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
  }
}
