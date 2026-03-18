import { computed } from 'vue'
import { useGamesStore } from '@/stores/useGamesStore'

export function useGameSession(id: number) {
  const store = useGamesStore()

  const session = computed(() => store.get(id))
  const game = computed(() => session.value?.game)
  const board = computed(() => game.value?.board)
  const moves = computed(() => game.value?.moves ?? [])

  const whitePlayer = computed(() => game.value?.players[0])
  const blackPlayer = computed(() => game.value?.players[1])

  // activeColor is the source of truth — robust against move cancellation,
  // FEN resume, and spectator mode
  const currentPlayer = computed(() => {
    const g = game.value
    if (!g) return undefined
    return g.activeColor === 'white' ? g.players[0] : g.players[1]
  })

  const isGameOver = computed(() => game.value?.status === 'finished')

  // TODO: implement when the rules engine is in place
  function makeMove() {
    // validate move, update board, flip activeColor, update pgn
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
