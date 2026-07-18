import { describe, it, expect } from 'vitest'
import { createGameSession, toBackendPayload } from './gameFactory'
import type { CreateGamePayload } from '@/types/chess'
import type { NewGameSettings } from '@/stores/useNewGameStore'

const basePayload: CreateGamePayload = {
  mode: 'local',
  players: {
    white: { name: 'Alice', avatar: 'circle' },
    black: { name: 'Bob', avatar: 'square' },
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
      playerWhiteAvatar: 'circle',
      playerBlackAvatar: 'square',
      timerEnabled: false,
      timerMinutes: 10,
      timerIncrement: 0,
      scenarioId: null,
    }
    const payload = toBackendPayload(settings)
    expect(payload.mode).toBe('local')
    expect(payload.players.white.name).toBe('Alice')
    expect(payload.players.black.name).toBe('Bob')
    expect(payload.players.white.avatar).toBe('circle')
    expect(payload.players.black.avatar).toBe('square')
    expect(payload.time).toBeUndefined()
  })

  it('trims player names', () => {
    const settings: NewGameSettings = {
      mode: 'local',
      playerWhiteName: '  Alice  ',
      playerBlackName: 'Bob ',
      playerWhiteAvatar: 'circle',
      playerBlackAvatar: 'square',
      timerEnabled: false,
      timerMinutes: 10,
      timerIncrement: 0,
      scenarioId: null,
    }
    const payload = toBackendPayload(settings)
    expect(payload.players.white.name).toBe('Alice')
    expect(payload.players.black.name).toBe('Bob')
  })

  it('includes time when timer is enabled', () => {
    const settings: NewGameSettings = {
      mode: 'local',
      playerWhiteName: 'Alice',
      playerBlackName: 'Bob',
      playerWhiteAvatar: 'circle',
      playerBlackAvatar: 'square',
      timerEnabled: true,
      timerMinutes: 10,
      timerIncrement: 5,
      scenarioId: null,
    }
    const payload = toBackendPayload(settings)
    expect(payload.time).toEqual({ minutes: 10, secondsIncrement: 5 })
  })
})

// Any ULID-shaped string works — the factory doesn't validate it
const TEST_ID = '01ARZ3NDEKTSV4RRFFQ69G5FAV'

describe('createGameSession', () => {
  it('assigns the given id', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.id).toBe(TEST_ID)
  })

  it('initializes end-of-game and clock fields empty', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.result).toBeNull()
    expect(session.game.drawOffer).toBeNull()
    expect(session.game.turnStartedAt).toBeNull()
    expect(session.game.startedAt).toBeNull()
  })

  it('initializes players with correct colors and names', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.players.white.color).toBe('white')
    expect(session.game.players.black.color).toBe('black')
    expect(session.game.players.white.metas.name).toBe('Alice')
    expect(session.game.players.black.metas.name).toBe('Bob')
  })

  it('carries the chosen avatar into player metas', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.players.white.metas.image).toBe('circle')
    expect(session.game.players.black.metas.image).toBe('square')
  })

  it('initializes players with isInCheck false', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.players.white.isInCheck).toBe(false)
    expect(session.game.players.black.isInCheck).toBe(false)
  })

  it('sets no timer when no time provided', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.players.white.timer).toBeUndefined()
    expect(session.game.players.black.timer).toBeUndefined()
  })

  it('sets timer on both players when time is provided', () => {
    const session = createGameSession(timedPayload, TEST_ID)
    expect(session.game.players.white.timer?.secondsRemaining).toBe(600)
    expect(session.game.players.black.timer?.secondsRemaining).toBe(600)
    expect(session.game.players.white.timer?.secondsIncrement).toBe(5)
  })

  it('gives each player an independent timer instance', () => {
    const session = createGameSession(timedPayload, TEST_ID)
    expect(session.game.players.white.timer).not.toBe(session.game.players.black.timer)
  })

  it('starts with white active and waiting status', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.activeColor).toBe('white')
    expect(session.game.status).toBe('waiting')
  })

  it('initializes board with 64 squares', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(Object.keys(session.game.board.squares)).toHaveLength(64)
  })

  it('starts with no moves', () => {
    const session = createGameSession(basePayload, TEST_ID)
    expect(session.game.moves).toHaveLength(0)
  })
})
