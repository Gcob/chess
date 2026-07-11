import type {Board, Direction, MoveTypeId, Piece, PieceColor, Square, SquareKey} from '@/types/chess'
import {LINEAR_DIRECTIONS, DIAGONAL_DIRECTIONS, ALL_DIRECTIONS, L_SHAPE_PATHS, walkPath} from './ray'
import {getPieceMoveTypes} from './moveTypes'
import {toSquareKey} from './board'
import {PositionAnalysis} from './positionAnalysis'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// Rules are being filled in incrementally: each piece type declares its move types, and each
// move type has its own pattern function producing the reachable squares. Move types not yet
// implemented (see the roadmap) are stubs returning no squares.

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
  const availableSquares = getAvailableSquares(departureSquare, piece, moveTypes)
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

// ─── Private movement patterns ──────────────────────────────────────────────────

function getAvailableSquares(from: Square, piece: Piece, moveTypes: MoveTypeId[]): Square[] {
  const squares: Square[] = []

  for (const type of moveTypes) {
    switch (type) {
      case 'linear-forward':
        squares.push(...getAvailableSquaresForLinearForward(from, piece))
        break
      case 'linear-forward-double':
        squares.push(...getAvailableSquaresForLinearForwardDouble(from, piece))
        break
      case 'diagonal-forward-capture':
        squares.push(...getAvailableSquaresForDiagonalForwardCapture(from, piece))
        break
      case 'linear':
        squares.push(...getAvailableSquaresForLinear(from, piece))
        break
      case 'diagonal':
        squares.push(...getAvailableSquaresForDiagonal(from, piece))
        break
      case 'l-shape':
        squares.push(...getAvailableSquaresForLShape(from, piece))
        break
      case 'simple':
        squares.push(...getAvailableSquaresForSimple(from, piece))
        break
      case 'castling':
        squares.push(...getAvailableSquaresForCastling())
        break
    }
  }

  return squares
}

function getAvailableSquaresForLinearForward(from: Square, piece: Piece): Square[] {
  const next = forwardNeighbor(from, piece.color)

  if (!next || next.piece) {
    return []
  }

  return [next]
}

function getAvailableSquaresForLinearForwardDouble(from: Square, piece: Piece): Square[] {
  if (piece.hasMoved) {
    return []
  }

  // Both the crossed square and the landing square must be free — no jumping over pieces.
  const crossed = forwardNeighbor(from, piece.color)
  if (!crossed || crossed.piece) {
    return []
  }

  const landing = forwardNeighbor(crossed, piece.color)
  if (!landing || landing.piece) {
    return []
  }

  return [landing]
}

function getAvailableSquaresForLinear(from: Square, piece: Piece): Square[] {
  return LINEAR_DIRECTIONS.flatMap(direction => slideInDirection(from, piece, direction))
}

function getAvailableSquaresForDiagonal(from: Square, piece: Piece): Square[] {
  return DIAGONAL_DIRECTIONS.flatMap(direction => slideInDirection(from, piece, direction))
}

// One step in any of the 8 directions — the landing square must exist and not hold a friendly piece.
function getAvailableSquaresForSimple(from: Square, piece: Piece): Square[] {
  return ALL_DIRECTIONS
    .map(direction => from.neighbors[direction])
    .filter((square): square is Square => !!square && square.piece?.color !== piece.color)
}

// Castling comes in phase ④ of the roadmap — no reachable squares until then.
function getAvailableSquaresForCastling(): Square[] {
  return []
}

// The knight jumps: squares crossed along the path don't matter, only the landing square does.
function getAvailableSquaresForLShape(from: Square, piece: Piece): Square[] {
  return L_SHAPE_PATHS
    .map(path => walkPath(from, path))
    .filter((square): square is Square => !!square && square.piece?.color !== piece.color)
}

// Slides square by square until blocked: an enemy square is reachable (capture) and ends the
// slide, a friendly square ends it without being reachable.
function slideInDirection(from: Square, piece: Piece, direction: Direction): Square[] {
  const squares: Square[] = []
  let current = from.neighbors[direction]

  while (current) {
    if (current.piece) {
      if (current.piece.color !== piece.color) {
        squares.push(current)
      }
      break
    }

    squares.push(current)
    current = current.neighbors[direction]
  }

  return squares
}

function getAvailableSquaresForDiagonalForwardCapture(from: Square, piece: Piece): Square[] {
  const diagonals = piece.color === 'white'
    ? [from.neighbors['top-left'], from.neighbors['top-right']]
    : [from.neighbors['bottom-left'], from.neighbors['bottom-right']]

  return diagonals.filter(
    (square): square is Square => !!square?.piece && square.piece.color !== piece.color,
  )
}

// "Forward" is relative to the piece's color: white goes up the board, black goes down.
function forwardNeighbor(square: Square, color: PieceColor): Square | null {
  return color === 'white' ? square.neighbors.top : square.neighbors.bottom
}
