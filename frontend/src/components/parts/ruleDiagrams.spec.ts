import {describe, it, expect} from 'vitest'
import {PIECE_DIAGRAMS, SPECIAL_DIAGRAMS, TIP_DIAGRAMS, type RuleDiagram} from './ruleDiagrams'
import {createBoard} from '@/composables/factories/gameFactory'
import {applyMove, legalDestinations} from '@/engine/move'
import {findKingSquare} from '@/engine/board'
import type {SquareKey} from '@/types/chess'

// These specs are the point of deriving the diagrams from the engine: they assert that each
// position still demonstrates the rule it claims to. A diagram that quietly stops teaching its
// lesson breaks the build instead of teaching a beginner something false.

function destinations(diagram: RuleDiagram): SquareKey[] {
  const board = createBoard(diagram.setup)
  return legalDestinations(board, diagram.from!, diagram.enPassantTarget ?? null).sort()
}

describe('rule diagrams — every position is a legal chess position', () => {
  const all = {...PIECE_DIAGRAMS, ...SPECIAL_DIAGRAMS, ...TIP_DIAGRAMS}

  it.each(Object.entries(all))('%s has both kings on the board', (_name, diagram) => {
    const board = createBoard(diagram.setup)
    expect(findKingSquare(board, 'white')).toBeTruthy()
    expect(findKingSquare(board, 'black')).toBeTruthy()
  })
})

describe('piece diagrams — the engine answers what the caption promises', () => {
  it('the king reaches its eight neighbours', () => {
    expect(destinations(PIECE_DIAGRAMS.king!)).toEqual(
      ['d3', 'd4', 'd5', 'e3', 'e5', 'f3', 'f4', 'f5'].sort(),
    )
  })

  it('the queen sweeps all eight directions — 27 squares from d4', () => {
    expect(destinations(PIECE_DIAGRAMS.queen!)).toHaveLength(27)
  })

  it('the rook covers its file and rank only — 14 squares from d4', () => {
    const squares = destinations(PIECE_DIAGRAMS.rook!)
    expect(squares).toHaveLength(14)
    expect(squares.every(square => square[0] === 'd' || square[1] === '4')).toBe(true)
  })

  it('the bishop stays on its own colour — 13 squares from d4', () => {
    const squares = destinations(PIECE_DIAGRAMS.bishop!)
    expect(squares).toHaveLength(13)
    // d4 is a dark square; every diagonal destination keeps that parity.
    const isDark = (square: SquareKey) =>
      ('abcdefgh'.indexOf(square[0]!) + Number(square[1])) % 2 === 1
    expect(squares.every(isDark)).toBe(true)
  })

  it('the knight jumps over the ring of friendly pawns boxing it in', () => {
    expect(destinations(PIECE_DIAGRAMS.knight!)).toEqual(
      ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'].sort(),
    )
  })

  it('the pawn steps one or two forward, and takes only diagonally', () => {
    expect(destinations(PIECE_DIAGRAMS.pawn!)).toEqual(['e3', 'e4', 'f3'].sort())
  })
})

describe('special move diagrams — applyMove does the whole special move', () => {
  it('castling relocates the rook along with the king', () => {
    const diagram = SPECIAL_DIAGRAMS.castling!
    const board = createBoard(diagram.setup)
    applyMove(board, ...diagram.moves![0]!)

    expect(board.squares.g1.piece?.type).toBe('king')
    expect(board.squares.f1.piece?.type).toBe('rook')
    expect(board.squares.e1.piece).toBeNull()
    expect(board.squares.h1.piece).toBeNull()
  })

  it('en passant clears the pawn that just double-pushed', () => {
    const diagram = SPECIAL_DIAGRAMS.enPassant!
    const board = createBoard(diagram.setup)
    for (const move of diagram.moves!) {
      applyMove(board, ...move)
    }

    expect(board.squares.d6.piece?.color).toBe('white')
    // The captured pawn stood beside the landing square, not on it.
    expect(board.squares.d5.piece).toBeNull()
  })

  it('the capture is legal for the engine too, not just for applyMove', () => {
    const diagram = SPECIAL_DIAGRAMS.enPassant!
    const board = createBoard(diagram.setup)
    applyMove(board, ...diagram.moves![0]!)

    expect(legalDestinations(board, 'e5', 'd6')).toContain('d6')
  })

  it('promotion turns the pawn into the chosen piece, keeping its identity', () => {
    const diagram = SPECIAL_DIAGRAMS.promotion!
    const board = createBoard(diagram.setup)
    const pawnId = board.squares.e7.piece!.id
    applyMove(board, ...diagram.moves![0]!, diagram.promoteTo!)

    expect(board.squares.e8.piece?.type).toBe('queen')
    expect(board.squares.e8.piece?.id).toBe(pawnId)
  })
})

describe('beginner tips', () => {
  it('the absolutely pinned knight has NO legal move at all', () => {
    expect(destinations(TIP_DIAGRAMS.pin!)).toEqual([])
  })

  it('the pin is what does it — the same knight moves freely once the bishop is gone', () => {
    const {setup} = TIP_DIAGRAMS.pin!
    const board = createBoard({...setup, b4: undefined})

    expect(legalDestinations(board, 'd2').length).toBeGreaterThan(0)
  })

  it('the red line traced for the reader is the real line of attack', () => {
    const diagram = TIP_DIAGRAMS.pin!
    // From the bishop, through the pinned piece, to the king it is aimed at.
    expect(diagram.threats).toEqual(['b4', 'c3', 'd2', 'e1'])
  })

  it('the centre diagram marks the four central squares', () => {
    expect(TIP_DIAGRAMS.centre!.zone).toEqual(['d4', 'd5', 'e4', 'e5'])
  })
})
