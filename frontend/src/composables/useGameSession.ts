import { computed } from 'vue'
import { useGamesStore } from '@/stores/useGamesStore'
import * as engine from '@/engine/game'
import type { SquareKey } from '@/types/chess'

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
  function makeMove(from: SquareKey, to: SquareKey) {
    const g = game.value
    if (!g) {
      return
    }

    engine.makeMove(g, from, to)
  }

  // Local mode: the resigner is the player to move.
  function resign() {
    const g = game.value
    if (!g) {
      return
    }

    engine.resign(g, g.activeColor)
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
