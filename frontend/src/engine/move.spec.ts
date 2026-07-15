import {describe, it, expect} from 'vitest'
import {canMove, applyMove, legalDestinations} from './move'
import {getAttackers, findCheckers, findKingSquare, toSquareKey} from './board'
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

describe('canMove — pinned pieces', () => {
  it('freezes a bishop pinned on a file', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'c1', 'e2') // bishop shields the king
    applyMove(board, 'a8', 'e5') // black rook pins it
    expect(canMove(board, 'e2', 'd3')).toBe(false)
    expect(canMove(board, 'e2', 'f3')).toBe(false)
    expect(canMove(board, 'e2', 'g4')).toBe(false)
  })

  it('lets a pinned rook slide along the pin ray and capture the pinner', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a1', 'e4') // rook shields the king
    applyMove(board, 'a8', 'e6') // black rook pins it
    expect(canMove(board, 'e4', 'e5')).toBe(true) // toward the pinner
    expect(canMove(board, 'e4', 'e6')).toBe(true) // captures the pinner
    expect(canMove(board, 'e4', 'e3')).toBe(true) // back toward the king
    expect(canMove(board, 'e4', 'd4')).toBe(false) // off the ray
    expect(canMove(board, 'e4', 'h4')).toBe(false)
  })

  it('freezes a pinned knight entirely', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3')
    applyMove(board, 'g1', 'e4') // knight shields the king
    applyMove(board, 'a8', 'e6')
    expect(canMove(board, 'e4', 'd6')).toBe(false)
    expect(canMove(board, 'e4', 'f6')).toBe(false)
    expect(canMove(board, 'e4', 'c3')).toBe(false)
    expect(canMove(board, 'e4', 'g5')).toBe(false)
  })

  it('keeps a file-pinned pawn advancing but never capturing sideways', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'd3') // black pawn within capture reach
    applyMove(board, 'a8', 'e5') // black rook pins the e2 pawn
    expect(canMove(board, 'e2', 'e3')).toBe(true) // advances stay on the ray
    expect(canMove(board, 'e2', 'e4')).toBe(true)
    expect(canMove(board, 'e2', 'd3')).toBe(false) // capture would expose the king
  })

  it('lets a diagonally pinned pawn capture its pinner', () => {
    const board = freshBoard()
    applyMove(board, 'c8', 'c3') // black bishop pins the d2 pawn against e1
    expect(canMove(board, 'd2', 'd3')).toBe(false) // advance leaves the diagonal
    expect(canMove(board, 'd2', 'd4')).toBe(false)
    expect(canMove(board, 'd2', 'c3')).toBe(true) // capturing the pinner is on the ray
  })

  it('does not pin when another piece shields in between', () => {
    const board = freshBoard()
    applyMove(board, 'g1', 'e3') // knight between the rook and the e2 pawn
    applyMove(board, 'a8', 'e5')
    expect(canMove(board, 'e3', 'c4')).toBe(true) // the knight is not pinned (e2 pawn shields)
  })

  it('is not pinned by an aligned non-slider', () => {
    const board = freshBoard()
    applyMove(board, 'g1', 'f2') // knight aligned with its king on the e1–f2 diagonal
    applyMove(board, 'd7', 'g3') // black pawn attacks f2 from the same diagonal
    expect(canMove(board, 'f2', 'g4')).toBe(true) // a pawn never pins
  })

  it('never pins the king itself', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4') // king faces an enemy rook directly
    applyMove(board, 'a8', 'e6')
    expect(canMove(board, 'e4', 'd4')).toBe(true) // a genuine escape — off the ray, unattacked
  })
})

describe('canMove — check evasion', () => {
  it('rejects any move that ignores the check', () => {
    const board = freshBoard()
    applyMove(board, 'g8', 'f3') // black knight checks e1
    expect(canMove(board, 'a2', 'a3')).toBe(false)
    expect(canMove(board, 'e2', 'e3')).toBe(false) // no interposing against a knight
  })

  it('allows capturing the checking knight', () => {
    const board = freshBoard()
    applyMove(board, 'g8', 'f3') // black knight checks e1
    expect(canMove(board, 'g2', 'f3')).toBe(true)
  })

  it('allows interposing on a slider check ray', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a8', 'e5') // black rook checks e1
    expect(canMove(board, 'f1', 'e2')).toBe(true)
    expect(canMove(board, 'd1', 'e2')).toBe(true)
    expect(canMove(board, 'g1', 'e2')).toBe(true)
    expect(canMove(board, 'g1', 'f3')).toBe(false) // off the ray
    expect(canMove(board, 'b1', 'c3')).toBe(false)
  })

  it('allows interposing with a pawn double advance', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'h4') // king out in the open
    applyMove(board, 'a8', 'a4') // black rook checks along the 4th rank
    expect(canMove(board, 'e2', 'e4')).toBe(true)
    expect(canMove(board, 'g2', 'g4')).toBe(true)
    expect(canMove(board, 'e2', 'e3')).toBe(false) // short of the ray
  })

  it('never lets a pinned piece capture the checker', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'c1', 'e2') // white bishop shields the king…
    applyMove(board, 'a8', 'e6') // …and gets pinned by the black rook
    applyMove(board, 'g8', 'd3') // black knight checks e1, in the pinned bishop's reach
    expect(canMove(board, 'e2', 'd3')).toBe(false) // pin ∩ check response = nothing
    expect(canMove(board, 'c2', 'd3')).toBe(true) // the unpinned pawn captures instead
  })

  it('only lets the king answer a double check', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a8', 'e5') // black rook checks e1
    applyMove(board, 'g8', 'f3') // black knight checks e1 too
    board.squares['f2'].piece = null
    expect(canMove(board, 'd1', 'f3')).toBe(false) // capturing one checker is not enough
    expect(canMove(board, 'g2', 'f3')).toBe(false)
    expect(canMove(board, 'e1', 'e2')).toBe(false) // still on the rook's ray
    expect(canMove(board, 'e1', 'f2')).toBe(true)
  })

  it('answers an adjacent pawn check by capture only', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'd2') // black pawn checks e1
    expect(canMove(board, 'c1', 'd2')).toBe(true)
    expect(canMove(board, 'd1', 'd2')).toBe(true)
    expect(canMove(board, 'b1', 'd2')).toBe(true)
    expect(canMove(board, 'a2', 'a3')).toBe(false)
    expect(canMove(board, 'e1', 'd2')).toBe(false) // the queen defends d2 down the freed d-file
  })
})

describe('canMove — king safety', () => {
  it('rejects stepping onto an attacked square, check or not', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'a8', 'd5') // black rook holds the d-file and the 5th rank
    expect(canMove(board, 'e4', 'd4')).toBe(false)
    expect(canMove(board, 'e4', 'd3')).toBe(false)
    expect(canMove(board, 'e4', 'e5')).toBe(false)
    expect(canMove(board, 'e4', 'f4')).toBe(true)
    expect(canMove(board, 'e4', 'e3')).toBe(true)
    expect(canMove(board, 'e4', 'd5')).toBe(true) // the rook is undefended
  })

  it('rejects squares covered by an enemy pawn', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'd7', 'e5') // black pawn covers d4 and f4
    expect(canMove(board, 'e4', 'd4')).toBe(false)
    expect(canMove(board, 'e4', 'f4')).toBe(false)
    expect(canMove(board, 'e4', 'e5')).toBe(true) // the pawn itself is undefended
  })

  it('captures an adjacent checker only when it is undefended', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'a8', 'e5') // black rook checks e4 from next door
    expect(canMove(board, 'e4', 'e5')).toBe(true)

    applyMove(board, 'h8', 'e6') // the other rook now defends it
    expect(canMove(board, 'e4', 'e5')).toBe(false)
  })

  it('sees the defender standing behind the captured piece', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'b8', 'd5') // black knight in the king's reach
    board.squares['d7'].piece = null // the black queen now sees d5 down the d-file
    expect(canMove(board, 'e4', 'd5')).toBe(false)
    expect(canMove(board, 'e4', 'e3')).toBe(false) // the knight covers e3

    board.squares['d8'].piece = null // no defender left
    expect(canMove(board, 'e4', 'd5')).toBe(true)
  })

  it('rejects fleeing along the checking rook ray — the x-ray trap', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'a8', 'e6') // black rook checks e4
    expect(canMove(board, 'e4', 'e3')).toBe(false) // still on the ray once the king steps away
    expect(canMove(board, 'e4', 'e5')).toBe(false)
    expect(canMove(board, 'e4', 'd4')).toBe(true)
    expect(canMove(board, 'e4', 'f3')).toBe(true)
  })

  it('rejects fleeing along the checking bishop diagonal — the x-ray trap', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'c8', 'g6') // black bishop checks e4 through f5
    expect(canMove(board, 'e4', 'd3')).toBe(false) // still on the diagonal
    expect(canMove(board, 'e4', 'f5')).toBe(false)
    expect(canMove(board, 'e4', 'e3')).toBe(true)
  })

  it('handles a battery: only the lead slider matters', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'd8', 'e6') // black queen checks e4
    applyMove(board, 'a8', 'e7') // black rook stacked behind it
    expect(canMove(board, 'e4', 'e3')).toBe(false) // x-rayed by the lead queen
    expect(canMove(board, 'e4', 'd4')).toBe(true)
  })

  it('never steps next to the enemy king', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'e8', 'e6')
    expect(canMove(board, 'e4', 'e5')).toBe(false)
    expect(canMove(board, 'e4', 'd5')).toBe(false)
    expect(canMove(board, 'e4', 'd4')).toBe(true)
  })
})

// The full-set counterpart of canMove — same pipeline, so these specs assert complete
// destination sets instead of re-proving each rule square by square.
describe('legalDestinations', () => {
  it('returns nothing for an empty origin', () => {
    expect(legalDestinations(freshBoard(), 'e4')).toEqual([])
  })

  it('lists the full sets of the start position', () => {
    expect(legalDestinations(freshBoard(), 'e2').sort()).toEqual(['e3', 'e4'])
    expect(legalDestinations(freshBoard(), 'g1').sort()).toEqual(['f3', 'h3'])
    expect(legalDestinations(freshBoard(), 'a1')).toEqual([]) // boxed-in rook
  })

  it('restricts a pinned rook to the pin ray, capture of the pinner included', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a1', 'e4') // rook shields the king
    applyMove(board, 'a8', 'e6') // black rook pins it
    expect(legalDestinations(board, 'e4').sort()).toEqual(['e2', 'e3', 'e5', 'e6'])
  })

  it('lists only the answers to a knight check', () => {
    const board = freshBoard()
    applyMove(board, 'g8', 'f3') // black knight checks e1
    expect(legalDestinations(board, 'g2')).toEqual(['f3']) // capture only — no block possible
    expect(legalDestinations(board, 'a2')).toEqual([])
  })

  it('lists only the safe king square in a double check', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a8', 'e5') // rook check
    applyMove(board, 'g8', 'f3') // knight check on top
    board.squares['f2'].piece = null
    expect(legalDestinations(board, 'e1')).toEqual(['f2'])
    expect(legalDestinations(board, 'd1')).toEqual([]) // nothing else answers
    expect(legalDestinations(board, 'g2')).toEqual([])
  })
})

describe('getAttackers', () => {
  it('finds no attacker on a safe square', () => {
    const board = freshBoard()
    expect(getAttackers(board, 'e4', 'black')).toEqual([])
  })

  it('sees pawn attacks forward only, never straight ahead', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'e4')
    expect(getAttackers(board, 'd5', 'white')).toEqual([board.squares['e4']])
    expect(getAttackers(board, 'f5', 'white')).toEqual([board.squares['e4']])
    expect(getAttackers(board, 'e5', 'white')).toEqual([])
  })

  it('sees an adjacent enemy king', () => {
    const board = freshBoard()
    applyMove(board, 'e8', 'e3') // teleport the black king next to d3
    expect(getAttackers(board, 'd3', 'black')).toContain(board.squares['e3'])
  })
})

describe('findCheckers', () => {
  it('finds no check in the start position', () => {
    const board = freshBoard()
    expect(findCheckers(board, 'white')).toEqual([])
    expect(findCheckers(board, 'black')).toEqual([])
  })

  it('detects a rook check along an open file', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'd3') // open the e-file
    applyMove(board, 'a8', 'e5') // black rook facing the white king
    expect(findCheckers(board, 'white')).toEqual([board.squares['e5']])
  })

  it('ignores a blocked slider', () => {
    const board = freshBoard()
    applyMove(board, 'a8', 'e5') // the e2 pawn still shields the king
    expect(findCheckers(board, 'white')).toEqual([])
  })

  it('detects a queen check along an open diagonal', () => {
    const board = freshBoard()
    applyMove(board, 'f2', 'a3') // open the h4–e1 diagonal
    applyMove(board, 'd8', 'h4') // black queen on it
    expect(findCheckers(board, 'white')).toEqual([board.squares['h4']])
  })

  it('detects a knight check jumping over the pawns', () => {
    const board = freshBoard()
    applyMove(board, 'g8', 'f3')
    expect(findCheckers(board, 'white')).toEqual([board.squares['f3']])
  })

  it('detects a pawn check, color-aware', () => {
    const board = freshBoard()
    applyMove(board, 'd7', 'd2') // black pawn attacks downward → checks e1
    expect(findCheckers(board, 'white')).toEqual([board.squares['d2']])

    const other = freshBoard()
    applyMove(other, 'd2', 'd7') // white pawn attacks upward → checks e8
    expect(findCheckers(other, 'black')).toEqual([other.squares['d7']])
  })

  it('detects a double check', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a8', 'e5') // rook check
    applyMove(board, 'g8', 'f3') // knight check on top
    const checkers = findCheckers(board, 'white')
    expect(checkers).toHaveLength(2)
    expect(checkers).toContain(board.squares['e5'])
    expect(checkers).toContain(board.squares['f3'])
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

describe('findKingSquare', () => {
  it('finds each king on a fresh board', () => {
    const board = freshBoard()
    expect(toSquareKey(findKingSquare(board, 'white')!)).toBe('e1')
    expect(toSquareKey(findKingSquare(board, 'black')!)).toBe('e8')
  })

  it('follows the king when it moves', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e5')
    expect(toSquareKey(findKingSquare(board, 'white')!)).toBe('e5')
  })

  it('returns null when the king is absent', () => {
    const board = freshBoard()
    board.squares['e1'].piece = null
    expect(findKingSquare(board, 'white')).toBeNull()
  })
})
