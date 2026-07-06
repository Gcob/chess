import {computed, onScopeDispose, ref, watch} from 'vue'
import type {ComputedRef} from 'vue'
import type {Game, PieceColor} from '@/types/chess'
import {flagTimeout, remainingSeconds} from '@/engine/game'

// Thin reactive shell around the engine's timestamp-based clock. No time is counted here:
// remaining = engine computation from turnStartedAt. This only ticks a `now` ref while a timed
// game is active (so the display refreshes) and flags the timeout when the running clock hits 0.
// Robust to inactive tabs — a late tick still computes the true elapsed time.
const TICK_MS = 100 // fast enough for the tenths shown under time pressure, still cheap

export function useGameClock(game: ComputedRef<Game | undefined>) {
  const now = ref(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  const running = computed(() => {
    const g = game.value
    return !!g && g.status === 'active' && !!g.time
  })

  function tick() {
    now.value = Date.now()

    // Only the running clock can reach zero — the opponent's is settled.
    const g = game.value
    if (g && remainingSeconds(g, g.activeColor, now.value) === 0) {
      flagTimeout(g, g.activeColor)
    }
  }

  watch(running, active => {
    if (active) {
      now.value = Date.now()
      interval = setInterval(tick, TICK_MS)
    } else if (interval) {
      clearInterval(interval)
      interval = null
    }
  }, {immediate: true})

  onScopeDispose(() => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  })

  function remainingFor(color: PieceColor): number | null {
    const g = game.value
    if (!g) {
      return null
    }

    return remainingSeconds(g, color, now.value)
  }

  // null = untimed game. Only the color on the move ticks down; the other is settled.
  return {
    white: computed(() => remainingFor('white')),
    black: computed(() => remainingFor('black')),
  }
}
