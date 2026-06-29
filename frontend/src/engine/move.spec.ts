import {describe, it, expect} from 'vitest'
import {canMove, applyMove} from './move'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {Board, CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice'}, black: {name: 'Bob'}},
}

function freshBoard(): Board {
  return createGameSession(payload, 1).game.board
}

describe('canMove (placeholder)', () => {
  it('allows every move for now', () => {
    expect(canMove(freshBoard(), 'a1', 'h8')).toBe(true)
  })
})

describe('applyMove', () => {
  it('moves the piece and empties the origin', () => {
    const board = freshBoard()
    const pawn = board.squares['e2'].piece
    applyMove(board, 'e2', 'e4')
    expect(board.squares['e2'].piece).toBeNull()
    expect(board.squares['e4'].piece).toBe(pawn)
  })

  it('captures by overwriting the target square', () => {
    const board = freshBoard()
    const whiteRook = board.squares['a1'].piece
    applyMove(board, 'a1', 'a7') // grabs a black pawn
    expect(board.squares['a7'].piece).toBe(whiteRook)
  })

  it('flags the piece as moved, keeping its stable id', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'e4')
    expect(board.squares['e4'].piece?.hasMoved).toBe(true)
    expect(board.squares['e4'].piece?.id).toBe('Pe2')
  })

  it('does nothing when the origin is empty', () => {
    const board = freshBoard()
    applyMove(board, 'e4', 'e5')
    expect(board.squares['e5'].piece).toBeNull()
  })
})
