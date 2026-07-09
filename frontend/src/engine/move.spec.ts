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
    const board = freshBoard()
    applyMove(board, 'a2', 'a4') // open the rook's file
    applyMove(board, 'd7', 'a3') // enemy pawn within reach
    expect(canMove(board, 'a1', 'a3')).toBe(true) // white rook takes black pawn
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

describe('canMove — sliding pieces', () => {
  it('rejects a rook sliding through its own pawn from the start position', () => {
    expect(canMove(freshBoard(), 'a1', 'a3')).toBe(false)
    expect(canMove(freshBoard(), 'a1', 'a5')).toBe(false)
  })

  it('allows a rook to slide along open ranks and files', () => {
    const board = freshBoard()
    applyMove(board, 'a1', 'd4') // teleport the rook to the open center
    expect(canMove(board, 'd4', 'd6')).toBe(true)
    expect(canMove(board, 'd4', 'd3')).toBe(true)
    expect(canMove(board, 'd4', 'a4')).toBe(true)
    expect(canMove(board, 'd4', 'h4')).toBe(true)
  })

  it('lets a rook capture the first enemy piece but not slide past it', () => {
    const board = freshBoard()
    applyMove(board, 'a1', 'd4')
    expect(canMove(board, 'd4', 'd7')).toBe(true) // captures the black pawn
    expect(canMove(board, 'd4', 'd8')).toBe(false) // blocked behind it
  })

  it('rejects a rook sliding past a friendly piece', () => {
    const board = freshBoard()
    applyMove(board, 'a1', 'd4')
    expect(canMove(board, 'd4', 'd1')).toBe(false) // own pawn on d2
  })

  it('rejects a diagonal move for a rook', () => {
    const board = freshBoard()
    applyMove(board, 'a1', 'd4')
    expect(canMove(board, 'd4', 'f6')).toBe(false)
  })

  it('allows a bishop to slide diagonally and capture, but not jump past', () => {
    const board = freshBoard()
    applyMove(board, 'c1', 'e4') // teleport the bishop to the open center
    expect(canMove(board, 'e4', 'g6')).toBe(true)
    expect(canMove(board, 'e4', 'h7')).toBe(true) // captures the black pawn
    expect(canMove(board, 'e4', 'b7')).toBe(true) // captures the other one
    expect(canMove(board, 'e4', 'a8')).toBe(false) // blocked behind b7
  })

  it('rejects a straight move for a bishop', () => {
    const board = freshBoard()
    applyMove(board, 'c1', 'e4')
    expect(canMove(board, 'e4', 'e6')).toBe(false)
  })

  it('allows a queen to slide both ways, but never like a knight', () => {
    const board = freshBoard()
    applyMove(board, 'd1', 'e4') // teleport the queen to the open center
    expect(canMove(board, 'e4', 'e7')).toBe(true) // straight capture
    expect(canMove(board, 'e4', 'b4')).toBe(true) // open rank
    expect(canMove(board, 'e4', 'g6')).toBe(true) // open diagonal
    expect(canMove(board, 'e4', 'f6')).toBe(false) // knight-shaped move
  })
})

describe('canMove — knight', () => {
  it('allows the L jumps from the start position, over the pawns', () => {
    expect(canMove(freshBoard(), 'g1', 'f3')).toBe(true)
    expect(canMove(freshBoard(), 'g1', 'h3')).toBe(true)
    expect(canMove(freshBoard(), 'b8', 'c6')).toBe(true)
  })

  it('rejects anything that is not an L', () => {
    expect(canMove(freshBoard(), 'g1', 'g3')).toBe(false) // straight
    expect(canMove(freshBoard(), 'g1', 'h5')).toBe(false) // too far
    expect(canMove(freshBoard(), 'g1', 'e3')).toBe(false) // diagonal-ish
  })

  it('reaches all its L squares from the center, except friendly-occupied ones', () => {
    const board = freshBoard()
    applyMove(board, 'g1', 'e4') // teleport the knight to the open center
    expect(canMove(board, 'e4', 'd6')).toBe(true)
    expect(canMove(board, 'e4', 'f6')).toBe(true)
    expect(canMove(board, 'e4', 'c5')).toBe(true)
    expect(canMove(board, 'e4', 'g5')).toBe(true)
    expect(canMove(board, 'e4', 'c3')).toBe(true)
    expect(canMove(board, 'e4', 'g3')).toBe(true)
    expect(canMove(board, 'e4', 'd2')).toBe(false) // own pawn
    expect(canMove(board, 'e4', 'f2')).toBe(false) // own pawn
  })

  it('allows capturing an enemy piece on the landing square', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'f3') // enemy pawn within reach
    expect(canMove(board, 'g1', 'f3')).toBe(true)
  })

  it('handles the board edge without wrapping', () => {
    const board = freshBoard()
    applyMove(board, 'g1', 'a4') // teleport the knight to the edge
    expect(canMove(board, 'a4', 'b6')).toBe(true)
    expect(canMove(board, 'a4', 'c5')).toBe(true)
    expect(canMove(board, 'a4', 'c3')).toBe(true)
    expect(canMove(board, 'a4', 'b2')).toBe(false) // own pawn
  })
})

describe('canMove — king', () => {
  it('allows a single step in all 8 directions from the open center', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4') // teleport the king to the open center
    for (const to of ['d5', 'e5', 'f5', 'd4', 'f4', 'd3', 'e3', 'f3'] as const) {
      expect(canMove(board, 'e4', to)).toBe(true)
    }
  })

  it('allows capturing an adjacent enemy piece', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'd7', 'e5') // enemy pawn next to the king
    expect(canMove(board, 'e4', 'e5')).toBe(true)
  })

  it('rejects stepping onto a friendly piece', () => {
    expect(canMove(freshBoard(), 'e1', 'e2')).toBe(false)
  })

  it('rejects anything farther than one step', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    expect(canMove(board, 'e4', 'e6')).toBe(false) // two steps forward
    expect(canMove(board, 'e4', 'g6')).toBe(false) // two steps diagonally
    expect(canMove(board, 'e4', 'f6')).toBe(false) // knight-shaped move
  })

  // Castling is a stub until phase ④ — a two-square king move must not slip through.
  it('rejects castling for now', () => {
    const board = freshBoard()
    board.squares['f1'].piece = null
    board.squares['g1'].piece = null
    expect(canMove(board, 'e1', 'g1')).toBe(false)
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
