import type {
  Board as BoardDto,
  CastlingSide,
  Piece as PieceDto,
  PieceColor,
  PieceType,
  SquareKey,
  SquareRank,
} from '@/types/chess'
import {Board, getBoardPieces} from './board'
import {MoveLegality} from './moveLegality'
import {transformPiece} from './piece'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// The movement patterns live in the MoveType hierarchy, the position questions in Board and
// the legality pipeline in MoveLegality; this module owns the public queries and the board
// mutation.

// The queries all accept the position's en passant target (derived upstream from the history
// by enPassantTarget) — omitted, the position simply has no en passant to offer.
export function canMove(
  boardDto: BoardDto,
  from: SquareKey,
  to: SquareKey,
  enPassantTarget: SquareKey | null = null,
): boolean {
  const board = new Board(boardDto, enPassantTarget)
  return new MoveLegality(board, from).squares().some(square => square.key === to)
}

// Every legal destination of the piece sitting on `from` — the query the local aids consume.
export function legalDestinations(
  boardDto: BoardDto,
  from: SquareKey,
  enPassantTarget: SquareKey | null = null,
): SquareKey[] {
  const board = new Board(boardDto, enPassantTarget)
  return new MoveLegality(board, from).squares().map(square => square.key)
}

// Whether `color` still has a legal move anywhere — THE mate/stalemate question.
// ONE shared Board answers every piece, and the scan stops at the first piece with a
// destination: a living position exits almost immediately, the full sweep only happens
// in real endings.
export function hasAnyLegalMove(
  boardDto: BoardDto,
  color: PieceColor,
  enPassantTarget: SquareKey | null = null,
): boolean {
  const board = new Board(boardDto, enPassantTarget)
  return getBoardPieces(boardDto).some(({piece, square}) =>
    piece.color === color && new MoveLegality(board, square).squares().length > 0,
  )
}

// Applies a move in place. A DTO-level command: it mutates the plain data (through the
// store's reactive proxy). Castling moves two pieces — the rook goes first, then the king;
// a promotion transforms the landed pawn. Requiring a choice is makeMove's guard, not this
// mutation's — without one, the pawn simply lands as a pawn.
export function applyMove(board: BoardDto, from: SquareKey, to: SquareKey, promotion: PieceType | null = null): void {
  const piece = board.squares[from].piece
  if (!piece) {
    return
  }

  const castlingSide = getCastlingSide(piece, from, to)
  if (castlingSide) {
    relocateCastlingRook(board, castlingSide, Number(from[1]) as SquareRank)
  }

  const victimKey = enPassantVictimKey(board, piece, from, to)
  if (victimKey) {
    board.squares[victimKey].piece = null
  }

  const promoting = promotion !== null && isPromotionMove(piece, to)
  relocate(board, from, to)
  if (promoting) {
    transformPiece(piece, promotion)
  }
}

// A pawn landing on the last rank of its march promotes — the move's shape, not its legality.
export function isPromotionMove(piece: PieceDto, to: SquareKey): boolean {
  if (piece.type !== 'pawn') {
    return false
  }

  return piece.color === 'white' ? to[1] === '8' : to[1] === '1'
}

// What a pawn may become — kings and pawns are not on the menu (FIDE 3.7e).
const PROMOTION_CHOICES: readonly PieceType[] = ['queen', 'rook', 'bishop', 'knight']

export function isPromotionChoice(type: PieceType | null): type is PieceType {
  return type !== null && PROMOTION_CHOICES.includes(type)
}

// The square an en passant capture empties beside the landing, null for any other move —
// a pawn stepping one forward diagonal onto an EMPTY square with an enemy pawn beside is the
// only shape a legal en passant ever takes.
export function enPassantVictimKey(board: BoardDto, piece: PieceDto, from: SquareKey, to: SquareKey): SquareKey | null {
  if (piece.type !== 'pawn' || board.squares[to].piece) {
    return null
  }

  const fileShift = Math.abs(to.charCodeAt(0) - from.charCodeAt(0))
  const forward = piece.color === 'white' ? 1 : -1
  if (fileShift !== 1 || Number(to[1]) - Number(from[1]) !== forward) {
    return null
  }

  const victimKey = `${to[0]}${from[1]}` as SquareKey
  const victim = board.squares[victimKey].piece
  return victim?.type === 'pawn' && victim.color !== piece.color ? victimKey : null
}

// The castling side of a move, null for anything else — a king landing two files away on its
// own rank is castling, the only two-square king move the geometry ever produces.
export function getCastlingSide(piece: PieceDto, from: SquareKey, to: SquareKey): CastlingSide | null {
  if (piece.type !== 'king' || from[1] !== to[1]) {
    return null
  }

  const fileShift = to.charCodeAt(0) - from.charCodeAt(0)
  if (Math.abs(fileShift) !== 2) {
    return null
  }

  return fileShift > 0 ? 'king-side' : 'queen-side'
}

// The elementary relocation: overwriting the target square is how a capture happens, and the
// piece remembers it moved.
function relocate(board: BoardDto, from: SquareKey, to: SquareKey): void {
  const piece = board.squares[from].piece
  if (!piece) {
    return
  }

  board.squares[to].piece = piece
  board.squares[from].piece = null
  piece.hasMoved = true
}

// The rook's half of a castle: it jumps to the square the king crossed, on the king's rank.
function relocateCastlingRook(board: BoardDto, side: CastlingSide, rank: SquareRank): void {
  if (side === 'king-side') {
    relocate(board, `h${rank}` as SquareKey, `f${rank}` as SquareKey)
  } else {
    relocate(board, `a${rank}` as SquareKey, `d${rank}` as SquareKey)
  }
}
