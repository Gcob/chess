import {describe, it, expect} from 'vitest'
import {MoveHistory, doublePushTarget} from './moveHistory'
import {makeMove} from './game'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload, Game, SquareKey} from '@/types/chess'

const T0 = 1_700_000_000_000

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

// Real moves through the real engine — the history under test is the one the game writes.
function playedGame(moves: Array<[SquareKey, SquareKey]>): Game {
  const game = createGameSession(payload, 'test-id').game
  for (const [from, to] of moves) {
    makeMove(game, from, to, T0)
  }

  return game
}

describe('MoveHistory', () => {
  it('exposes the last move, undefined on an empty history', () => {
    expect(new MoveHistory([]).last).toBeUndefined()
    const game = playedGame([['e2', 'e4']])
    expect(new MoveHistory(game.moves).last).toMatchObject({from: 'e2', to: 'e4'})
  })

  it('derives the en passant target from the last move only', () => {
    const doublePush = playedGame([['e2', 'e4']])
    expect(new MoveHistory(doublePush.moves).enPassantTarget()).toBe('e3')

    const expired = playedGame([['e2', 'e4'], ['g8', 'f6']])
    expect(new MoveHistory(expired.moves).enPassantTarget()).toBeNull()
  })

  it('counts the half-moves since the last pawn move or capture', () => {
    const game = playedGame([['e2', 'e4'], ['g8', 'f6'], ['b1', 'c3']])
    expect(new MoveHistory(game.moves).halfmovesSinceProgress()).toBe(2)
  })

  it('prices the castling rights at any depth of the history', () => {
    const game = playedGame([['g1', 'f3'], ['g8', 'f6'], ['h1', 'g1']])
    const history = new MoveHistory(game.moves)
    expect(history.castlingRightsAt(0)).toBe('KQkq')
    expect(history.castlingRightsAt(2)).toBe('KQkq') // knights out — nothing touched
    expect(history.castlingRightsAt(3)).toBe('Qkq') // the h1 rook moved
  })

  it('loses both rights of a color once its king moves', () => {
    const game = playedGame([['e2', 'e3'], ['e7', 'e6'], ['e1', 'e2']])
    expect(new MoveHistory(game.moves).castlingRightsAt(3)).toBe('kq')
  })
})

describe('doublePushTarget', () => {
  it('yields the crossed square of a double push, null otherwise', () => {
    const game = playedGame([['e2', 'e4'], ['d7', 'd6']])
    expect(doublePushTarget(game.moves[0])).toBe('e3')
    expect(doublePushTarget(game.moves[1])).toBeNull() // single push
    expect(doublePushTarget(undefined)).toBeNull()
  })
})
