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

describe('Piece', () => {
  it('reads its identity through the DTO', () => {
    const pawn = freshBoard().square('e2').piece!
    expect(pawn.id).toBe('Pe2')
    expect(pawn.color).toBe('white')
    expect(pawn.type).toBe('pawn')
    expect(pawn.hasMoved).toBe(false)
    expect(pawn.dto.id).toBe('Pe2')
  })

  it('exposes its move types', () => {
    const board = freshBoard()
    expect(board.square('e2').piece!.moveTypes().map(type => type.id))
      .toEqual(['linear-forward', 'linear-forward-double', 'diagonal-forward-capture'])
    expect(board.square('b1').piece!.moveTypes().map(type => type.id)).toEqual(['l-shape'])
  })

  it('derives its available squares — raw geometry, no legality', () => {
    const board = freshBoard()
    expect(board.square('e2').piece!.availableSquares().map(square => square.key).sort())
      .toEqual(['e3', 'e4'])
    expect(board.square('b1').piece!.availableSquares().map(square => square.key).sort())
      .toEqual(['a3', 'c3'])
    expect(board.square('a1').piece!.availableSquares()).toEqual([]) // boxed-in rook
  })
})
