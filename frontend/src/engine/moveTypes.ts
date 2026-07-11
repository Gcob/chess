import type {Direction, MoveTypeId, PieceColor, PieceType} from '@/types/chess'
import type {Piece} from './piece'
import type {Square} from './square'
import {LINEAR_DIRECTIONS, DIAGONAL_DIRECTIONS, ALL_DIRECTIONS, L_SHAPE_PATHS, walkPath} from './ray'

// ─── Move types ─────────────────────────────────────────────────────────────────
// One class per move type — the domain model's « Type de Déplacement » hierarchy. Each subclass
// carries its movement pattern, its attack signature and its ray-casting ability, so no switch
// dispatches on move types anywhere else. Instances are stateless flyweights in a const
// registry: behaviour objects, not module state.

export abstract class MoveType {
  abstract readonly id: MoveTypeId

  // The reachable squares from here — raw geometry only, legality is canMove's pipeline business.
  abstract availableSquares(from: Square, piece: Piece): Square[]

  // The attack signature — from the attacked square's point of view, `direction` points toward
  // the attacker sitting `distance` squares away. Default: a move type that can never capture
  // threatens nothing.
  attacksAlong(_direction: Direction, _distance: number, _byColor: PieceColor): boolean {
    return false
  }

  // Whether this move type casts rays: checks through a line, pins, x-ray behind the king.
  slidesAlong(_direction: Direction): boolean {
    return false
  }
}

// One step in any of the 8 directions — the landing square must exist and not hold a friendly piece.
class SimpleMoveType extends MoveType {
  readonly id = 'simple' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    return ALL_DIRECTIONS
      .map(direction => from.neighbor(direction))
      .filter((square): square is Square => !!square && square.piece?.color !== piece.color)
  }

  override attacksAlong(_direction: Direction, distance: number): boolean {
    return distance === 1
  }
}

// Castling comes in phase ④ of the roadmap — no reachable squares until then.
class CastlingMoveType extends MoveType {
  readonly id = 'castling' as const

  availableSquares(): Square[] {
    return []
  }
}

class LinearMoveType extends MoveType {
  readonly id = 'linear' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    return LINEAR_DIRECTIONS.flatMap(direction => slideInDirection(from, piece, direction))
  }

  override attacksAlong(direction: Direction): boolean {
    return this.slidesAlong(direction)
  }

  override slidesAlong(direction: Direction): boolean {
    return LINEAR_DIRECTIONS.includes(direction)
  }
}

class DiagonalMoveType extends MoveType {
  readonly id = 'diagonal' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    return DIAGONAL_DIRECTIONS.flatMap(direction => slideInDirection(from, piece, direction))
  }

  override attacksAlong(direction: Direction): boolean {
    return this.slidesAlong(direction)
  }

  override slidesAlong(direction: Direction): boolean {
    return DIAGONAL_DIRECTIONS.includes(direction)
  }
}

// The knight jumps: squares crossed along the path don't matter, only the landing square does.
// Attack-wise it is scanned by knight jumps, never by rays — attacksAlong stays false.
class LShapeMoveType extends MoveType {
  readonly id = 'l-shape' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    return L_SHAPE_PATHS
      .map(path => walkPath(from, path))
      .filter((square): square is Square => !!square && square.piece?.color !== piece.color)
  }
}

class LinearForwardMoveType extends MoveType {
  readonly id = 'linear-forward' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    const next = forwardNeighbor(from, piece.color)
    if (!next || !next.isEmpty) {
      return []
    }

    return [next]
  }
}

class LinearForwardDoubleMoveType extends MoveType {
  readonly id = 'linear-forward-double' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    if (piece.hasMoved) {
      return []
    }

    // Both the crossed square and the landing square must be free — no jumping over pieces.
    const crossed = forwardNeighbor(from, piece.color)
    if (!crossed || !crossed.isEmpty) {
      return []
    }

    const landing = forwardNeighbor(crossed, piece.color)
    if (!landing || !landing.isEmpty) {
      return []
    }

    return [landing]
  }
}

class DiagonalForwardCaptureMoveType extends MoveType {
  readonly id = 'diagonal-forward-capture' as const

  availableSquares(from: Square, piece: Piece): Square[] {
    const diagonals = piece.color === 'white'
      ? [from.neighbor('top-left'), from.neighbor('top-right')]
      : [from.neighbor('bottom-left'), from.neighbor('bottom-right')]

    return diagonals.filter(
      (square): square is Square => !!square?.piece && square.piece.color !== piece.color,
    )
  }

  override attacksAlong(direction: Direction, distance: number, byColor: PieceColor): boolean {
    return distance === 1 && isPawnAttackDirection(direction, byColor)
  }
}

// En passant joins in phase ④ — its geometry is the pawn's usual forward diagonal, and it adds
// no attacked square.
class EnPassantMoveType extends MoveType {
  readonly id = 'en-passant' as const

  availableSquares(): Square[] {
    return []
  }
}

// Promotion is an effect of a move, not a movement pattern — modelled in phase ④.
class PromotionMoveType extends MoveType {
  readonly id = 'promotion' as const

  availableSquares(): Square[] {
    return []
  }
}

// Stateless flyweights — one shared instance per move type, exhaustiveness checked by the type.
export const MOVE_TYPES: Record<MoveTypeId, MoveType> = {
  'simple': new SimpleMoveType(),
  'castling': new CastlingMoveType(),
  'linear-forward': new LinearForwardMoveType(),
  'linear-forward-double': new LinearForwardDoubleMoveType(),
  'diagonal-forward-capture': new DiagonalForwardCaptureMoveType(),
  'en-passant': new EnPassantMoveType(),
  'promotion': new PromotionMoveType(),
  'diagonal': new DiagonalMoveType(),
  'linear': new LinearMoveType(),
  'l-shape': new LShapeMoveType(),
}

// The single place knowing what each piece type can do. Every other engine module reasons on
// move types, never on piece types.
export function getPieceMoveTypes(pieceType: PieceType): MoveType[] {
  switch (pieceType) {
    case 'king':
      return [MOVE_TYPES['simple'], MOVE_TYPES['castling']]
    case 'pawn':
      // 'en-passant' joins in phase ④
      return [MOVE_TYPES['linear-forward'], MOVE_TYPES['linear-forward-double'], MOVE_TYPES['diagonal-forward-capture']]
    case 'queen':
      return [MOVE_TYPES['diagonal'], MOVE_TYPES['linear']]
    case 'rook':
      return [MOVE_TYPES['linear']]
    case 'bishop':
      return [MOVE_TYPES['diagonal']]
    case 'knight':
      return [MOVE_TYPES['l-shape']]
  }
}

// ─── Shared pattern helpers ─────────────────────────────────────────────────────

// Slides square by square until blocked: an enemy square is reachable (capture) and ends the
// slide, a friendly square ends it without being reachable.
function slideInDirection(from: Square, piece: Piece, direction: Direction): Square[] {
  const squares: Square[] = []
  let current = from.neighbor(direction)

  while (current) {
    if (current.piece) {
      if (current.piece.color !== piece.color) {
        squares.push(current)
      }
      break
    }

    squares.push(current)
    current = current.neighbor(direction)
  }

  return squares
}

// "Forward" is relative to the piece's color: white goes up the board, black goes down.
function forwardNeighbor(square: Square, color: PieceColor): Square | null {
  return color === 'white' ? square.neighbor('top') : square.neighbor('bottom')
}

// A pawn attacks its two forward diagonals, so seen from the attacked square the pawn sits
// diagonally BACKWARD — toward the attacking color's side.
function isPawnAttackDirection(direction: Direction, byColor: PieceColor): boolean {
  return byColor === 'white'
    ? direction === 'bottom-left' || direction === 'bottom-right'
    : direction === 'top-left' || direction === 'top-right'
}
