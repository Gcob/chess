import type {Board, Direction, MoveTypeId, Piece, PieceColor, PieceType, Square, SquareKey} from '@/types/chess'

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

  const moveTypes = getPieceMoveTypes(piece.type)
  const availableSquares = getAvailableSquares(departureSquare, piece, moveTypes)
  const legalSquares = restrictToPinRay(departureSquare, availableSquares)

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

// ─── Attack detection ──────────────────────────────────────────────────────────

// Squares holding a piece of the given color that attacks the given square. Looks outward FROM
// the square (the "super-piece" trick): a pattern walked from here can only land on a piece
// attacking back along that same pattern. Piece types stay out of the logic — the piece found is
// tested against the attack signatures of its own move types, so getPieceMoveTypes remains the
// single place knowing what a piece can do.
export function getAttackers(square: Square, byColor: PieceColor): Square[] {
  return [...rayAttackers(square, byColor), ...knightAttackers(square, byColor)]
}

// The enemy squares currently giving check to the given color's king. A legal position allows
// two checkers at most (double check, born from a discovery) — with two, only a king move can
// answer: no block or capture handles both.
export function findCheckers(board: Board, color: PieceColor): Square[] {
  const kingSquare = findKingSquare(board, color)
  if (!kingSquare) {
    return []
  }

  return getAttackers(kingSquare, color === 'white' ? 'black' : 'white')
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

const LINEAR_DIRECTIONS: readonly Direction[] = ['top', 'right', 'bottom', 'left']
const DIAGONAL_DIRECTIONS: readonly Direction[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left']
const ALL_DIRECTIONS: readonly Direction[] = [...LINEAR_DIRECTIONS, ...DIAGONAL_DIRECTIONS]

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  'top': 'bottom',
  'top-right': 'bottom-left',
  'right': 'left',
  'bottom-right': 'top-left',
  'bottom': 'top',
  'bottom-left': 'top-right',
  'left': 'right',
  'top-left': 'bottom-right',
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

// ─── Private attack logic ──────────────────────────────────────────────────────

// One scan per direction: the first piece met attacks back if one of its move types strikes
// along this direction at this distance.
function rayAttackers(square: Square, byColor: PieceColor): Square[] {
  const attackers: Square[] = []

  for (const direction of ALL_DIRECTIONS) {
    const hit = firstPieceInDirection(square, direction)

    if (!hit || hit.piece.color !== byColor) {
      continue
    }

    const attacks = getPieceMoveTypes(hit.piece.type)
      .some(type => attacksAlong(type, direction, hit.distance, byColor))

    if (attacks) {
      attackers.push(hit.square)
    }
  }

  return attackers
}

function knightAttackers(square: Square, byColor: PieceColor): Square[] {
  return L_SHAPE_PATHS
    .map(path => walkPath(square, path))
    .filter((found): found is Square => isAttackerWithMoveType(found, byColor, 'l-shape'))
}

// The attack signature of each move type — from the attacked square's point of view, `direction`
// points toward the attacker sitting `distance` squares away.
function attacksAlong(type: MoveTypeId, direction: Direction, distance: number, byColor: PieceColor): boolean {
  switch (type) {
    case 'linear':
    case 'diagonal':
      return slidesAlong(type, direction)
    case 'simple':
      return distance === 1
    case 'diagonal-forward-capture':
      return distance === 1 && isPawnAttackDirection(direction, byColor)
    // Own geometry, scanned by knightAttackers instead of rays.
    case 'l-shape':
      return false
    // Move types that can never capture threaten nothing. En passant adds no attacked square
    // either — its geometry is the pawn's usual forward diagonal (phase ④).
    case 'linear-forward':
    case 'linear-forward-double':
    case 'castling':
    case 'en-passant':
    case 'promotion':
      return false
  }
}

// Whether the move type is a slide running along this direction. Only slides matter for pins:
// pinning requires an attack that runs THROUGH the pinned piece to the king behind it.
function slidesAlong(type: MoveTypeId, direction: Direction): boolean {
  if (type === 'linear') {
    return LINEAR_DIRECTIONS.includes(direction)
  }

  return type === 'diagonal' && DIAGONAL_DIRECTIONS.includes(direction)
}

// A pawn attacks its two forward diagonals, so seen from the attacked square the pawn sits
// diagonally BACKWARD — toward the attacking color's side.
function isPawnAttackDirection(direction: Direction, byColor: PieceColor): boolean {
  return byColor === 'white'
    ? direction === 'bottom-left' || direction === 'bottom-right'
    : direction === 'top-left' || direction === 'top-right'
}

interface RayHit {
  square: Square
  piece: Piece
  distance: number
}

// Slides to the first piece met in that direction; null when only empty squares reach the edge.
function firstPieceInDirection(from: Square, direction: Direction): RayHit | null {
  let current = from.neighbors[direction]
  let distance = 1

  while (current) {
    if (current.piece) {
      return {square: current, piece: current.piece, distance}
    }

    current = current.neighbors[direction]
    distance++
  }

  return null
}

function isAttackerWithMoveType(square: Square | null, byColor: PieceColor, type: MoveTypeId): boolean {
  return !!square?.piece && square.piece.color === byColor && getPieceMoveTypes(square.piece.type).includes(type)
}

// ─── Private pin logic ─────────────────────────────────────────────────────────

// A pinned piece may only move along the pin axis: toward the pinner (capturing it included)
// or back toward its own king — never off the ray.
function restrictToPinRay(from: Square, squares: Square[]): Square[] {
  const pinDirection = getPinDirection(from)
  if (!pinDirection) {
    return squares
  }

  const ray = [
    ...raySquares(from, pinDirection),
    ...raySquares(from, OPPOSITE_DIRECTION[pinDirection]),
  ]
  return squares.filter(square => ray.includes(square))
}

// The absolute direction the pinning piece attacks from — null when not pinned. Fully local to
// the graph: pinned means the first piece one way is an enemy slider striking along the ray,
// and the first piece the opposite way is the own king.
function getPinDirection(square: Square): Direction | null {
  const piece = square.piece
  if (!piece) {
    return null
  }

  for (const direction of ALL_DIRECTIONS) {
    const attacker = firstPieceInDirection(square, direction)
    if (!attacker || attacker.piece.color === piece.color) {
      continue
    }

    const pins = getPieceMoveTypes(attacker.piece.type).some(type => slidesAlong(type, direction))
    if (!pins) {
      continue
    }

    const behind = firstPieceInDirection(square, OPPOSITE_DIRECTION[direction])
    if (behind && behind.piece.type === 'king' && behind.piece.color === piece.color) {
      return direction
    }
  }

  return null
}

// The squares from here up to the first piece met (inclusive) in that direction.
function raySquares(from: Square, direction: Direction): Square[] {
  const squares: Square[] = []
  let current = from.neighbors[direction]

  while (current) {
    squares.push(current)
    if (current.piece) {
      break
    }

    current = current.neighbors[direction]
  }

  return squares
}

export function findKingSquare(board: Board, color: PieceColor): Square | null {
  return Object.values(board.squares).find(
    square => square.piece?.type === 'king' && square.piece.color === color,
  ) ?? null
}

export function toSquareKey(square: Square): SquareKey {
  return `${square.file}${square.rank}`
}
