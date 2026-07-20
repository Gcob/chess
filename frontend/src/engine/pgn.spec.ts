import {describe, it, expect} from 'vitest'
import {buildMovetext, buildPgn} from './pgn'
import {replayMoves} from './game'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload, GameResult, Move} from '@/types/chess'

const T0 = 1_700_000_000_000

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function newGame() {
  return createGameSession(payload, 'test').game
}

// buildMovetext reads only `.san` — a cast keeps the wrapping tests focused on formatting.
function sanMoves(sans: string[]): Move[] {
  return sans.map(san => ({san} as Move))
}

describe('buildMovetext', () => {
  it('numbers each white move and appends the result token', () => {
    const game = newGame()
    replayMoves(game, [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3']], T0)
    expect(buildMovetext(game.moves, game.result)).toBe('1. e4 e5 2. Nf3 *')
  })

  it('emits just the result token for a game with no moves', () => {
    expect(buildMovetext([], null)).toBe('*')
  })

  it('uses the result token of a finished game', () => {
    const game = newGame()
    replayMoves(game, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']], T0)
    expect(game.result?.reason).toBe('checkmate')
    expect(buildMovetext(game.moves, game.result)).toBe('1. f3 e5 2. g4 Qh4# 0-1')
  })

  it('wraps lines at 80 columns, breaking only between tokens', () => {
    const text = buildMovetext(sanMoves(Array(40).fill('Nf3')), null)
    const lines = text.split('\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every(line => line.length <= 80)).toBe(true)
    // Collapsing the wraps must recover the exact single-line token stream.
    expect(text.split(/\s+/)).toEqual(text.replace(/\n/g, ' ').split(' '))
  })
})

describe('buildPgn headers', () => {
  it('emits the seven-tag roster with placeholders and our extras', () => {
    const game = newGame()
    game.createdAt = new Date(2026, 6, 19) // local July 19 2026
    game.time = {minutes: 10, secondsIncrement: 5}
    const pgn = buildPgn(game)
    expect(pgn).toContain('[Event "?"]')
    expect(pgn).toContain('[Site "?"]')
    expect(pgn).toContain('[Date "2026.07.19"]')
    expect(pgn).toContain('[Round "-"]')
    expect(pgn).toContain('[White "Alice"]')
    expect(pgn).toContain('[Black "Bob"]')
    expect(pgn).toContain('[Result "*"]')
    expect(pgn).toContain('[TimeControl "600+5"]')
    expect(pgn).not.toContain('Termination') // ongoing game omits it
  })

  it('marks an untimed game with a dash', () => {
    expect(buildPgn(newGame())).toContain('[TimeControl "-"]')
  })

  it('escapes quotes and backslashes in player names', () => {
    const game = newGame()
    game.players.white.metas.name = 'a"b\\c'
    expect(buildPgn(game)).toContain('[White "a\\"b\\\\c"]')
  })
})

describe('buildPgn result token', () => {
  const cases: Array<[GameResult | null, string]> = [
    [{winner: 'white', reason: 'checkmate'}, '1-0'],
    [{winner: 'black', reason: 'checkmate'}, '0-1'],
    [{winner: null, reason: 'stalemate'}, '1/2-1/2'],
    [null, '*'],
  ]
  it.each(cases)('renders %o as [Result "%s"]', (result, token) => {
    const game = newGame()
    game.result = result
    expect(buildPgn(game)).toContain(`[Result "${token}"]`)
  })
})

describe('buildPgn termination', () => {
  const cases: Array<[GameResult, string]> = [
    [{winner: 'white', reason: 'checkmate'}, 'White won by checkmate'],
    [{winner: 'black', reason: 'resignation'}, 'Black won by resignation'],
    [{winner: 'white', reason: 'timeout'}, 'White won on time'],
    [{winner: null, reason: 'timeout'}, 'Game drawn on time (insufficient material)'],
    [{winner: null, reason: 'stalemate'}, 'Game drawn by stalemate'],
    [{winner: null, reason: 'fifty-move-rule'}, 'Game drawn by fifty-move rule'],
    [{winner: null, reason: 'threefold-repetition'}, 'Game drawn by threefold repetition'],
    [{winner: null, reason: 'insufficient-material'}, 'Game drawn by insufficient material'],
    [{winner: null, reason: 'draw-agreement'}, 'Game drawn by agreement'],
  ]
  it.each(cases)('describes %o as [Termination "%s"]', (result, expected) => {
    const game = newGame()
    game.result = result
    expect(buildPgn(game)).toContain(`[Termination "${expected}"]`)
  })
})

describe('buildPgn full', () => {
  it('renders a full small game', () => {
    const game = newGame()
    game.createdAt = new Date(2026, 6, 19)
    replayMoves(game, [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6']], T0)
    expect(buildPgn(game)).toBe(
`[Event "?"]
[Site "?"]
[Date "2026.07.19"]
[Round "-"]
[White "Alice"]
[Black "Bob"]
[Result "*"]
[TimeControl "-"]

1. e4 e5 2. Nf3 Nc6 *
`)
  })
})
