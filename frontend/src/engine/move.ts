import type {Board, Direction, MoveTypeId, Piece, PieceColor, PieceType, Square, SquareKey} from '@/types/chess'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// Rules are being filled in incrementally: each piece type declares its move types, and the
// engine produces the reachable squares for the ones it validates (VALIDATED_MOVE_TYPES).
// A piece holding a move type not yet validated keeps all its moves permitted for now.

// Move types the engine can produce squares for — grows as rules get implemented.
const VALIDATED_MOVE_TYPES: readonly MoveTypeId[] = [
  'linear-forward',
  'linear-forward-double',
  'diagonal-forward-capture',
  'linear',
  'diagonal',
  'l-shape',
]

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

  const moveTypes = getPieceMoveTypes(piece.type)
  const availableSquares = getAvailableSquares(departureSquare, piece, moveTypes)

  if (availableSquares.some(square => toSquareKey(square) === to)) {
    return true
  }

  return hasUnvalidatedMoveTypes(moveTypes)
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

// ─── Private move logic ───────────────────────────────────────────────────────────

function getPieceMoveTypes(pieceType: PieceType): MoveTypeId[] {
  switch (pieceType) {
    case 'king':
      return ['simple', 'castling']
    case 'pawn':
      // 'en-passant' joins in phase ④; promotion is an effect of a move, not a movement pattern
      return ['linear-forward', 'linear-forward-double', 'diagonal-forward-capture']
    case 'queen':
      return ['diagonal', 'linear']
    case 'rook':
      return ['linear']
    case 'bishop':
      return ['diagonal']
    case 'knight':
      return ['l-shape']
  }
}

function hasUnvalidatedMoveTypes(moveTypes: MoveTypeId[]): boolean {
  return moveTypes.some(type => !VALIDATED_MOVE_TYPES.includes(type))
}

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

const LINEAR_DIRECTIONS: readonly Direction[] = ['top', 'right', 'bottom', 'left']
const DIAGONAL_DIRECTIONS: readonly Direction[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left']

function getAvailableSquaresForLinear(from: Square, piece: Piece): Square[] {
  return LINEAR_DIRECTIONS.flatMap(direction => slideInDirection(from, piece, direction))
}

function getAvailableSquaresForDiagonal(from: Square, piece: Piece): Square[] {
  return DIAGONAL_DIRECTIONS.flatMap(direction => slideInDirection(from, piece, direction))
}

// The 8 knight jumps as neighbor paths: two steps in one direction, one step perpendicular.
const L_SHAPE_PATHS: readonly (readonly Direction[])[] = [
  ['top', 'top', 'left'],
  ['top', 'top', 'right'],
  ['right', 'right', 'top'],
  ['right', 'right', 'bottom'],
  ['bottom', 'bottom', 'right'],
  ['bottom', 'bottom', 'left'],
  ['left', 'left', 'bottom'],
  ['left', 'left', 'top'],
]

// The knight jumps: squares crossed along the path don't matter, only the landing square does.
function getAvailableSquaresForLShape(from: Square, piece: Piece): Square[] {
  return L_SHAPE_PATHS
    .map(path => walkPath(from, path))
    .filter((square): square is Square => !!square && square.piece?.color !== piece.color)
}

// Follows the neighbors graph along the given directions; null once the path leaves the board.
function walkPath(from: Square, path: readonly Direction[]): Square | null {
  let current: Square | null = from

  for (const direction of path) {
    current = current.neighbors[direction]
    if (!current) {
      return null
    }
  }

  return current
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

function toSquareKey(square: Square): SquareKey {
  return `${square.file}${square.rank}`
}
