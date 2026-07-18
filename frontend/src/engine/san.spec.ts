import {describe, it, expect} from 'vitest'
import {buildSan} from './san'
import {MoveRecord} from './moveRecord'
import {applyMove} from './move'
import {createGameSession} from '@/composables/factories/gameFactory'
import {keepOnly} from '@/test/board'
import type {Board, CreateGamePayload, PieceType, SquareKey} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

// A sparse board: the listed squares survive, everything else is swept away.
function board(keep: SquareKey[]): Board {
  const fresh = createGameSession(payload, 'san-test').game.board
  keepOnly(fresh, keep)
  return fresh
}

// Moves the surviving white queen onto several squares at once — under-promotion armies are
// the only way three queens ever share a board, and the DTO is plain data.
function placeQueens(position: Board, squares: SquareKey[]): void {
  const queen = position.squares['d1'].piece!
  position.squares['d1'].piece = null
  for (const square of squares) {
    position.squares[square].piece = {...queen, id: `Q${square}`}
  }
}

// The SAN of a move on this position — capture, castling and disambiguation are derived.
function san(
  position: Board,
  from: SquareKey,
  to: SquareKey,
  promotion: PieceType | null = null,
  enPassantTarget: SquareKey | null = null,
): string {
  return buildSan(
    new MoveRecord(position, position.squares[from].piece!, from, to, promotion, enPassantTarget),
  )
}

describe('buildSan — disambiguation', () => {
  it('names the departure file when two twins compete', () => {
    const position = board(['e1', 'e8', 'b1', 'g1'])
    applyMove(position, 'g1', 'f3') // knights on b1 and f3, both eyeing d2
    expect(san(position, 'b1', 'd2')).toBe('Nbd2')
    expect(san(position, 'f3', 'd2')).toBe('Nfd2')
  })

  it('falls back to the departure rank when the file is shared', () => {
    const position = board(['e1', 'e8', 'a1', 'h1'])
    applyMove(position, 'a1', 'e4') // rooks on e4 and e6, both eyeing e5
    applyMove(position, 'h1', 'e6')
    expect(san(position, 'e4', 'e5')).toBe('R4e5')
    expect(san(position, 'e6', 'e5')).toBe('R6e5')
  })

  it('spells the whole square when neither file nor rank is enough', () => {
    // Three queens eyeing e1: h4 shares its file with h1 and its rank with e4.
    const position = board(['a1', 'a8', 'd1'])
    placeQueens(position, ['h4', 'e4', 'h1'])
    expect(san(position, 'h4', 'e1')).toBe('Qh4e1')
  })

  it('stays silent when the only twin is pinned — legality, not geometry', () => {
    const position = board(['e1', 'a8', 'b1', 'g1', 'h8'])
    applyMove(position, 'g1', 'e3') // knight pinned against e1 by the rook below
    applyMove(position, 'h8', 'e8')
    applyMove(position, 'b1', 'b2') // the free twin, also eyeing c4
    expect(san(position, 'b2', 'c4')).toBe('Nc4')
  })

  it('keeps the capture cross after the disambiguation', () => {
    const position = board(['e1', 'e8', 'b1', 'g1', 'd7'])
    applyMove(position, 'g1', 'f3')
    applyMove(position, 'd7', 'd2') // an enemy pawn to take on d2
    expect(san(position, 'b1', 'd2')).toBe('Nbxd2')
  })

  it('never disambiguates a pawn or a king', () => {
    const position = board(['e1', 'e8', 'e2', 'g2', 'd7'])
    applyMove(position, 'd7', 'd3')
    expect(san(position, 'e2', 'e4')).toBe('e4')
    expect(san(position, 'e2', 'd3')).toBe('exd3')
    expect(san(position, 'e1', 'd1')).toBe('Kd1')
  })
})

describe('buildSan — special moves', () => {
  it('writes both castles', () => {
    const position = board(['e1', 'e8', 'a1', 'h1'])
    expect(san(position, 'e1', 'g1')).toBe('O-O')
    expect(san(position, 'e1', 'c1')).toBe('O-O-O')
  })

  it('writes en passant as a pawn capture', () => {
    const position = board(['e1', 'e8', 'e2', 'd7'])
    applyMove(position, 'e2', 'e5')
    applyMove(position, 'd7', 'd5')
    expect(san(position, 'e5', 'd6', null, 'd6')).toBe('exd6')
  })

  it('writes promotions, capture or not', () => {
    const position = board(['e1', 'e8', 'e2', 'b8'])
    applyMove(position, 'e2', 'a7')
    expect(san(position, 'a7', 'a8', 'queen')).toBe('a8=Q')
    expect(san(position, 'a7', 'b8', 'knight')).toBe('axb8=N')
  })
})
