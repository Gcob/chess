import {describe, it, expect} from 'vitest'
import {
  CHECK_DIAGRAM,
  END_DIAGRAMS,
  PIECE_DIAGRAMS,
  SPECIAL_DIAGRAMS,
  TIP_DIAGRAMS,
  type RuleDiagram,
} from './ruleDiagrams'
import {createBoard} from '@/composables/factories/gameFactory'
import {applyMove, legalDestinations} from '@/engine/move'
import {findCheckers} from '@/engine/board'
import type {SquareKey} from '@/types/chess'

// These specs are the point of deriving the diagrams from the engine: they assert that each
// position still demonstrates the rule it claims to. A diagram that quietly stops teaching its
// lesson breaks the build instead of teaching a beginner something false.

function destinations(diagram: RuleDiagram): SquareKey[] {
  const board = createBoard(diagram.setup)
  return legalDestinations(board, diagram.from!, diagram.enPassantTarget ?? null).sort()
}

describe('rule diagrams — each one shows a single idea', () => {
  // A diagram carries no spare pieces: an idle king standing in a corner is noise to a reader
  // who has never played. The opening diagrams are the exception — they ARE a full position.
  const SPARSE = {...PIECE_DIAGRAMS, ...SPECIAL_DIAGRAMS, ...END_DIAGRAMS, check: CHECK_DIAGRAM}

  it.each(Object.entries(SPARSE))('%s stays small enough to read', (_name, diagram) => {
    expect(Object.keys(diagram.setup).length).toBeLessThanOrEqual(9)
  })

  it('every piece diagram holds exactly the piece it explains, plus its context', () => {
    expect(Object.keys(PIECE_DIAGRAMS.queen!.setup)).toEqual(['d4'])
    expect(Object.keys(PIECE_DIAGRAMS.rook!.setup)).toEqual(['d4'])
    expect(Object.keys(PIECE_DIAGRAMS.bishop!.setup)).toEqual(['d4'])
    expect(Object.keys(PIECE_DIAGRAMS.king!.setup)).toEqual(['e4'])
  })
})

describe('check and endings — the engine decides, not the author', () => {
  it('a checked king may flee sideways but never along the line of attack', () => {
    const board = createBoard(CHECK_DIAGRAM.setup)
    const escapes = legalDestinations(board, 'e1')

    expect(findCheckers(board, 'white')).toHaveLength(1)
    expect(escapes.sort()).toEqual(['d1', 'd2', 'f1', 'f2'])
    // Staying on the file is not an escape, and the engine says so on its own.
    expect(escapes).not.toContain('e2')
  })

  it('the back-rank mate really is mate: in check, and no move at all', () => {
    const board = createBoard(END_DIAGRAMS.checkmate!.setup)

    expect(findCheckers(board, 'black')).toHaveLength(1)
    expect(legalDestinations(board, 'h8')).toEqual([])
  })

  it('the stalemate really is stalemate: no move, and NOT in check', () => {
    const board = createBoard(END_DIAGRAMS.stalemate!.setup)

    // This is the whole difference with the diagram above, and the one beginners miss.
    expect(findCheckers(board, 'black')).toEqual([])
    expect(legalDestinations(board, 'a8')).toEqual([])
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
  it('king-side castling drops the rook on f1', () => {
    const diagram = SPECIAL_DIAGRAMS.castlingKingSide!
    const board = createBoard(diagram.setup)
    applyMove(board, ...diagram.moves![0]!)

    expect(board.squares.g1.piece?.type).toBe('king')
    expect(board.squares.f1.piece?.type).toBe('rook')
    expect(board.squares.e1.piece).toBeNull()
    expect(board.squares.h1.piece).toBeNull()
  })

  it('queen-side castling sends the king to c1 and the rook all the way to d1', () => {
    const diagram = SPECIAL_DIAGRAMS.castlingQueenSide!
    const board = createBoard(diagram.setup)
    applyMove(board, ...diagram.moves![0]!)

    expect(board.squares.c1.piece?.type).toBe('king')
    expect(board.squares.d1.piece?.type).toBe('rook')
    expect(board.squares.a1.piece).toBeNull()
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

  it('all four tips carry a diagram', () => {
    for (const key of ['blunder', 'pin', 'centre', 'develop']) {
      expect(TIP_DIAGRAMS[key], key).toBeTruthy()
    }
  })

  it('the blunder is a legal move onto a covered square, then a legal capture', () => {
    const diagram = TIP_DIAGRAMS.blunder!
    const board = createBoard(diagram.setup)

    // The knight really may go there — it is a legal move, just a bad one.
    expect(legalDestinations(board, 'c3')).toContain('d5')

    applyMove(board, ...diagram.moves![0]!)
    // And the pawn really may take it.
    expect(legalDestinations(board, 'e6')).toContain('d5')

    applyMove(board, ...diagram.moves![1]!)
    expect(board.squares.d5.piece?.color).toBe('black')
  })

  it('the centre opening leaves white owning the middle and black nowhere', () => {
    const diagram = TIP_DIAGRAMS.centre!
    const board = createBoard(diagram.setup)
    for (const move of diagram.moves!) {
      applyMove(board, ...move)
    }

    expect(board.squares.e4.piece?.color).toBe('white')
    expect(board.squares.d4.piece?.color).toBe('white')
    // Black spent both moves on rook pawns, touching no central square.
    expect(board.squares.d5.piece).toBeNull()
    expect(board.squares.e5.piece).toBeNull()
  })

  it('the development sequence ends with the king actually castled', () => {
    const diagram = TIP_DIAGRAMS.develop!
    const board = createBoard(diagram.setup)
    for (const move of diagram.moves!) {
      applyMove(board, ...move)
    }

    expect(board.squares.f3.piece?.type).toBe('knight')
    expect(board.squares.c4.piece?.type).toBe('bishop')
    // Castling only became possible because those two pieces vacated f1 and g1.
    expect(board.squares.g1.piece?.type).toBe('king')
    expect(board.squares.f1.piece?.type).toBe('rook')
  })
})
