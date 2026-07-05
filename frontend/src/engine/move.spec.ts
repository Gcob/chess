import {describe, it, expect} from 'vitest'
import {canMove, applyMove} from './move'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {Board, CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshBoard(): Board {
  return createGameSession(payload, 'test-id').game.board
}

describe('canMove', () => {
  it('rejects capturing your own piece', () => {
    expect(canMove(freshBoard(), 'a1', 'a2')).toBe(false) // white rook onto white pawn
  })

  it('allows capturing an enemy piece', () => {
    expect(canMove(freshBoard(), 'a1', 'a7')).toBe(true) // white rook onto black pawn
  })

  it('allows moving onto an empty square', () => {
    expect(canMove(freshBoard(), 'e2', 'e4')).toBe(true)
  })

  it('rejects an empty origin', () => {
    expect(canMove(freshBoard(), 'e4', 'e5')).toBe(false)
  })

  it('rejects a non-move (same square)', () => {
    expect(canMove(freshBoard(), 'e2', 'e2')).toBe(false)
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
