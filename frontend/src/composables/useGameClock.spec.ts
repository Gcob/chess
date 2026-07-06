import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {computed, effectScope} from 'vue'
import type {EffectScope} from 'vue'
import {useGameClock} from './useGameClock'
import {createGameSession} from '@/composables/factories/gameFactory'
import {startGame} from '@/engine/game'
import type {CreateGamePayload, Game} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function buildGame(withTime: boolean): Game {
  const withTimePayload = withTime ? {...payload, time: {minutes: 10, secondsIncrement: 5}} : payload
  return createGameSession(withTimePayload, 'test-id').game
}

describe('useGameClock', () => {
  let scope: EffectScope

  beforeEach(() => {
    vi.useFakeTimers()
    scope = effectScope()
  })

  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })

  function clockFor(game: Game) {
    return scope.run(() => useGameClock(computed(() => game)))!
  }

  it('returns null for an untimed game', () => {
    const game = buildGame(false)
    startGame(game)
    const clock = clockFor(game)
    expect(clock.white.value).toBeNull()
    expect(clock.black.value).toBeNull()
  })

  it('shows the configured time before the game starts', () => {
    const game = buildGame(true)
    const clock = clockFor(game)
    expect(clock.white.value).toBe(600)
    expect(clock.black.value).toBe(600)
  })

  it('ticks the active color down and leaves the opponent settled', () => {
    const game = buildGame(true)
    startGame(game)
    const clock = clockFor(game)

    vi.advanceTimersByTime(30_000)
    expect(clock.white.value).toBe(570)
    expect(clock.black.value).toBe(600)
  })

  it('flags the running clock at zero and finishes the game', () => {
    const game = buildGame(true)
    startGame(game)
    game.players.white.timer!.secondsRemaining = 2
    const clock = clockFor(game)

    vi.advanceTimersByTime(3_000)
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: 'black', reason: 'timeout'})
    expect(clock.white.value).toBe(0)
  })

  it('freezes both clocks once the game is finished', () => {
    const game = buildGame(true)
    startGame(game)
    game.players.white.timer!.secondsRemaining = 2
    const clock = clockFor(game)

    vi.advanceTimersByTime(60_000)
    // ticking stopped at the flag — the settled 0 doesn't keep drifting
    expect(clock.white.value).toBe(0)
    expect(clock.black.value).toBe(600)
  })
})
