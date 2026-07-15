import type {Board as BoardDto, SquareKey} from '@/types/chess'
import {Board} from './board'
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
// Phase ③ will loop it over every piece of a color (mate/stalemate = no destination anywhere).
export function legalDestinations(boardDto: BoardDto, from: SquareKey): SquareKey[] {
  return legalSquaresFrom(new Board(boardDto), from).map(square => square.key)
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
  const unpinnedSquares = restrictToPinRay(board, departureSquare, safeSquares)
  return restrictToCheckResponses(board, piece, unpinnedSquares)
}

// Applies a move in place. Overwriting the target square is how a capture happens.
// A DTO-level command: it mutates the plain data (through the store's reactive proxy).
export function applyMove(board: BoardDto, from: SquareKey, to: SquareKey): void {
  const piece = board.squares[from].piece
  if (!piece) {
    return
  }

  board.squares[to].piece = piece
  board.squares[from].piece = null
  piece.hasMoved = true
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
