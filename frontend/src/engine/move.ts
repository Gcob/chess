import type {
  Board as BoardDto,
  CastlingSide,
  Piece as PieceDto,
  PieceColor,
  SquareKey,
  SquareRank,
} from '@/types/chess'
import {Board, getBoardPieces} from './board'
import type {Piece} from './piece'
import type {Square} from './square'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// The movement patterns live in the MoveType hierarchy, the position questions in Board;
// this module owns the LEGALITY pipeline and the board mutation.

export function canMove(boardDto: BoardDto, from: SquareKey, to: SquareKey): boolean {
  return legalSquaresFrom(new Board(boardDto), from).some(square => square.key === to)
}

// Every legal destination of the piece sitting on `from` — the query the local aids consume.
export function legalDestinations(boardDto: BoardDto, from: SquareKey): SquareKey[] {
  return legalSquaresFrom(new Board(boardDto), from).map(square => square.key)
}

// Whether `color` still has a legal move anywhere — THE mate/stalemate question.
// One shared Board answers every piece, and the scan stops at the first piece with a
// destination: a living position exits almost immediately, the full sweep only happens
// in real endings.
export function hasAnyLegalMove(boardDto: BoardDto, color: PieceColor): boolean {
  const board = new Board(boardDto)
  return getBoardPieces(boardDto).some(({piece, square}) =>
    piece.color === color && legalSquaresFrom(board, square).length > 0,
  )
}

// Progressive restriction: raw geometry, then one legality filter per rule. Each filter
// guards its own relevance, so the pipeline holds for any piece — friendly captures and
// non-moves never survive the patterns themselves. ONE Board instance answers every
// question about the position, shared across the ~27 candidate squares.
function legalSquaresFrom(board: Board, from: SquareKey): Square[] {
  const departureSquare = board.square(from)
  const piece = departureSquare.piece
  if (!piece) {
    return []
  }

  const availableSquares = piece.availableSquares()
  const safeSquares = restrictToSafeKingSquares(board, piece, availableSquares)
  const castlingSafeSquares = restrictToSafeCastling(board, piece, departureSquare, safeSquares)
  const unpinnedSquares = restrictToPinRay(board, departureSquare, castlingSafeSquares)
  return restrictToCheckResponses(board, piece, unpinnedSquares)
}

// Applies a move in place. A DTO-level command: it mutates the plain data (through the
// store's reactive proxy). Castling moves two pieces — the rook goes first, then the king.
export function applyMove(board: BoardDto, from: SquareKey, to: SquareKey): void {
  const piece = board.squares[from].piece
  if (!piece) {
    return
  }

  const castlingSide = getCastlingSide(piece, from, to)
  if (castlingSide) {
    relocateCastlingRook(board, castlingSide, Number(from[1]) as SquareRank)
  }

  relocate(board, from, to)
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

// ─── Private legality filters ───────────────────────────────────────────────────
// Pure queries on the unmutated board — no move/undo simulation anywhere.

// Only the king answers to destination safety — a no-op for every other piece.
// Same progressive restriction as canMove: drop the attacked squares, then the x-rayed ones
// (the squares behind the king on a check ray, unattacked right now only because the king
// himself still blocks the ray — see Board.xRayExtensionSquares).
function restrictToSafeKingSquares(board: Board, piece: Piece, squares: Square[]): Square[] {
  if (piece.type !== 'king') {
    return squares
  }

  const enemyColor = piece.color === 'white' ? 'black' : 'white'
  const unattackedSquares = squares.filter(to => !board.isAttacked(to, enemyColor))
  const xRayedSquares = board.xRayExtensionSquares(piece.color)

  return unattackedSquares.filter(to => !xRayedSquares.includes(to))
}

// The castling-specific safety rules: the king may not castle out of check nor across an
// attacked square. The landing square is already covered by restrictToSafeKingSquares, and the
// rook's path is free to be attacked — only the king's own journey matters. A moved king lost
// its castling rights — the geometry already yields no castling destination for it, the guard
// just skips probing every destination for nothing.
function restrictToSafeCastling(board: Board, piece: Piece, from: Square, squares: Square[]): Square[] {
  if (piece.type !== 'king' || piece.hasMoved) {
    return squares
  }

  const enemyColor = piece.color === 'white' ? 'black' : 'white'
  return squares.filter(to => {
    const direction = castlingDirection(from, to)
    if (!direction) {
      return true
    }

    return !board.isAttacked(from, enemyColor)
      && !board.isAttacked(from.neighbor(direction)!, enemyColor)
  })
}

// A king landing two squares away is castling — the geometry produces no other two-square
// king destination. Null for every ordinary move.
function castlingDirection(from: Square, to: Square): 'left' | 'right' | null {
  for (const direction of ['left', 'right'] as const) {
    if (from.neighbor(direction)?.neighbor(direction) === to) {
      return direction
    }
  }

  return null
}

// A pinned piece may only move along the pin axis: toward the pinner (capturing it included)
// or back toward its own king — never off the ray.
function restrictToPinRay(board: Board, from: Square, squares: Square[]): Square[] {
  const pinRay = board.pinRayFor(from)
  if (!pinRay) {
    return squares
  }

  return squares.filter(square => pinRay.includes(square))
}

// Non-king answers to check: capture the checker or block its ray; nothing answers a double
// check. The king is exempt — it answers by moving to safety instead (restrictToSafeKingSquares).
function restrictToCheckResponses(board: Board, piece: Piece, squares: Square[]): Square[] {
  if (piece.type === 'king') {
    return squares
  }

  const responses = board.checkResponseSquares(piece.color)
  if (!responses) {
    return squares
  }

  return squares.filter(square => responses.includes(square))
}
