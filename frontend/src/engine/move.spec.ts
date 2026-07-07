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

  it('stays permissive for pieces with unvalidated move types', () => {
    expect(canMove(freshBoard(), 'g1', 'h5')).toBe(true) // knight, not even an L-shape
  })
})

describe('canMove — pawn', () => {
  it('allows a single forward advance, both colors', () => {
    expect(canMove(freshBoard(), 'e2', 'e3')).toBe(true)
    expect(canMove(freshBoard(), 'e7', 'e6')).toBe(true)
  })

  it('allows a double advance from the start position, both colors', () => {
    expect(canMove(freshBoard(), 'e2', 'e4')).toBe(true)
    expect(canMove(freshBoard(), 'e7', 'e5')).toBe(true)
  })

  it('rejects a triple advance', () => {
    expect(canMove(freshBoard(), 'e2', 'e5')).toBe(false)
  })

  it('rejects a forward advance onto an occupied square', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'e3') // teleport a black pawn in front
    expect(canMove(board, 'e2', 'e3')).toBe(false)
  })

  it('rejects a double advance jumping over a piece', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'e3') // e3 occupied, e4 free
    expect(canMove(board, 'e2', 'e4')).toBe(false)
  })

  it('rejects a double advance onto an occupied landing square', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'e4') // e3 free, e4 occupied — no forward capture either
    expect(canMove(board, 'e2', 'e4')).toBe(false)
  })

  it('rejects a double advance once the pawn has moved', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'e3')
    expect(canMove(board, 'e3', 'e5')).toBe(false)
  })

  it('rejects backward and sideways moves', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'e4')
    expect(canMove(board, 'e4', 'e3')).toBe(false)
    expect(canMove(board, 'e4', 'd4')).toBe(false)
  })

  it('allows a diagonal capture of an enemy piece', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'd3') // black pawn within reach
    expect(canMove(board, 'e2', 'd3')).toBe(true)
  })

  it('rejects a diagonal move onto an empty square', () => {
    expect(canMove(freshBoard(), 'e2', 'd3')).toBe(false)
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
