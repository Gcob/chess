import type {Board, Piece, PieceColor, Square, SquareKey} from '@/types/chess'
import {getPieceMoveTypes} from './moveTypes'
import {toSquareKey} from './board'
import {PositionAnalysis} from './positionAnalysis'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// The movement patterns live in the MoveType hierarchy (moveTypes.ts); this module owns the
// LEGALITY pipeline and the board mutation. Move types not yet implemented (see the roadmap)
// are stubs reaching no squares.

export function canMove(board: Board, from: SquareKey, to: SquareKey): boolean {
  const departureSquare = board.squares[from]
  const piece = departureSquare.piece
  if (!piece) {
    return false
  }

  if (from === to) {
    return false
  }

  // Can't capture your own piece.
  const target = board.squares[to].piece
  if (target && target.color === piece.color) {
    return false
  }

  // Progressive restriction: raw geometry, then one legality filter per rule. Each filter
  // guards its own relevance, so the pipeline holds for any piece. One analysis of the
  // position answers every question.
  const analysis = new PositionAnalysis(board)
  const moveTypes = getPieceMoveTypes(piece.type)
  const availableSquares = moveTypes.flatMap(type => type.availableSquares(departureSquare, piece))
  const safeSquares = restrictToSafeKingSquares(analysis, piece, availableSquares)
  const unpinnedSquares = restrictToPinRay(analysis, departureSquare, safeSquares)
  const legalSquares = restrictToCheckResponses(analysis, piece, unpinnedSquares)

  return legalSquares.some(square => toSquareKey(square) === to)
}

// Applies a move in place. Overwriting the target square is how a capture happens.
export function applyMove(board: Board, from: SquareKey, to: SquareKey): void {
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
// himself still blocks the ray — see PositionAnalysis.xRayExtensionSquares).
function restrictToSafeKingSquares(analysis: PositionAnalysis, piece: Piece, squares: Square[]): Square[] {
  if (piece.type !== 'king') {
    return squares
  }

  const enemyColor: PieceColor = piece.color === 'white' ? 'black' : 'white'
  const unattackedSquares = squares.filter(to => !analysis.isAttacked(to, enemyColor))
  const xRayedSquares = analysis.xRayExtensionSquares(piece.color)

  return unattackedSquares.filter(to => !xRayedSquares.includes(to))
}

// A pinned piece may only move along the pin axis: toward the pinner (capturing it included)
// or back toward its own king — never off the ray.
function restrictToPinRay(analysis: PositionAnalysis, from: Square, squares: Square[]): Square[] {
  const pinRay = analysis.pinRayFor(from)
  if (!pinRay) {
    return squares
  }

  return squares.filter(square => pinRay.includes(square))
}

// Non-king answers to check: capture the checker or block its ray; nothing answers a double
// check. The king is exempt — it answers by moving to safety instead (restrictToSafeKingSquares).
function restrictToCheckResponses(analysis: PositionAnalysis, piece: Piece, squares: Square[]): Square[] {
  if (piece.type === 'king') {
    return squares
  }

  const responses = analysis.checkResponseSquares(piece.color)
  if (!responses) {
    return squares
  }

  return squares.filter(square => responses.includes(square))
}
