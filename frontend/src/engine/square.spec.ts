import {describe, it, expect} from 'vitest'
import {Board} from './board'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshBoard(): Board {
  return new Board(createGameSession(payload, 'test-id').game.board)
}

describe('Square', () => {
  it('reads its identity through the DTO', () => {
    const square = freshBoard().square('e4')
    expect(square.key).toBe('e4')
    expect(square.file).toBe('e')
    expect(square.rank).toBe(4)
    expect(square.dto.file).toBe('e')
  })

  it('is the same instance on every access — reference equality holds', () => {
    const board = freshBoard()
    expect(board.square('e4')).toBe(board.square('e4'))
    expect(board.square('e4').neighbor('top')).toBe(board.square('e5'))
  })

  it('walks its neighbors, null at the board edge', () => {
    const board = freshBoard()
    expect(board.square('a1').neighbor('left')).toBeNull()
    expect(board.square('a1').neighbor('top-right')).toBe(board.square('b2'))
  })

  it('wraps its piece, bound to the square, and caches it', () => {
    const board = freshBoard()
    const e2 = board.square('e2')
    expect(e2.isEmpty).toBe(false)
    expect(e2.piece?.type).toBe('pawn')
    expect(e2.piece?.square).toBe(e2)
    expect(e2.piece).toBe(e2.piece)
    expect(board.square('e4').piece).toBeNull()
    expect(board.square('e4').isEmpty).toBe(true)
  })
})
