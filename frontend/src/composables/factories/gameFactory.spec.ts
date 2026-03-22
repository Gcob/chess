import { describe, it, expect } from 'vitest'
import { createGameSession, toBackendPayload } from './gameFactory'
import type { CreateGamePayload } from '@/types/chess'
import type { NewGameSettings } from '@/stores/useNewGameStore'

const basePayload: CreateGamePayload = {
  mode: 'local',
  players: {
    white: { name: 'Alice' },
    black: { name: 'Bob' },
  },
}

const timedPayload: CreateGamePayload = {
  ...basePayload,
  time: { minutes: 10, secondsIncrement: 5 },
}

describe('toBackendPayload', () => {
  it('maps player names and mode', () => {
    const settings: NewGameSettings = {
      mode: 'local',
      playerWhiteName: 'Alice',
      playerBlackName: 'Bob',
      timerEnabled: false,
      timerMinutes: 10,
      timerIncrement: 0,
    }
    const payload = toBackendPayload(settings)
    expect(payload.mode).toBe('local')
    expect(payload.players.white.name).toBe('Alice')
    expect(payload.players.black.name).toBe('Bob')
    expect(payload.time).toBeUndefined()
  })

  it('includes time when timer is enabled', () => {
    const settings: NewGameSettings = {
      mode: 'local',
      playerWhiteName: 'Alice',
      playerBlackName: 'Bob',
      timerEnabled: true,
      timerMinutes: 10,
      timerIncrement: 5,
    }
    const payload = toBackendPayload(settings)
    expect(payload.time).toEqual({ minutes: 10, secondsIncrement: 5 })
  })
})

describe('createGameSession', () => {
  it('assigns the given id', () => {
    const session = createGameSession(basePayload, 42)
    expect(session.id).toBe(42)
  })

  it('initializes players with correct colors and names', () => {
    const session = createGameSession(basePayload, 1)
    expect(session.game.players.white.color).toBe('white')
    expect(session.game.players.black.color).toBe('black')
    expect(session.game.players.white.metas.name).toBe('Alice')
    expect(session.game.players.black.metas.name).toBe('Bob')
  })

  it('initializes players with isInCheck false', () => {
    const session = createGameSession(basePayload, 1)
    expect(session.game.players.white.isInCheck).toBe(false)
    expect(session.game.players.black.isInCheck).toBe(false)
  })

  it('sets no timer when no time provided', () => {
    const session = createGameSession(basePayload, 1)
    expect(session.game.players.white.timer).toBeUndefined()
    expect(session.game.players.black.timer).toBeUndefined()
  })

  it('sets timer on both players when time is provided', () => {
    const session = createGameSession(timedPayload, 1)
    expect(session.game.players.white.timer?.secondsRemaining).toBe(600)
    expect(session.game.players.black.timer?.secondsRemaining).toBe(600)
    expect(session.game.players.white.timer?.secondsIncrement).toBe(5)
  })

  it('starts with white active and waiting status', () => {
    const session = createGameSession(basePayload, 1)
    expect(session.game.activeColor).toBe('white')
    expect(session.game.status).toBe('waiting')
  })

  it('initializes board with 64 squares', () => {
    const session = createGameSession(basePayload, 1)
    expect(Object.keys(session.game.board.squares)).toHaveLength(64)
  })

  it('starts with no moves', () => {
    const session = createGameSession(basePayload, 1)
    expect(session.game.moves).toHaveLength(0)
  })
})
