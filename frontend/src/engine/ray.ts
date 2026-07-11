import type {Direction} from '@/types/chess'
import type {Piece} from './piece'
import type {Square} from './square'

// ─── Board geometry & rays ──────────────────────────────────────────────────────
// The directional vocabulary of the board graph, its walkers, and the Ray value object.
// Everything operates on the engine wrappers and derives from the board — nothing is stored.

export const LINEAR_DIRECTIONS: readonly Direction[] = ['top', 'right', 'bottom', 'left']
export const DIAGONAL_DIRECTIONS: readonly Direction[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left']
export const ALL_DIRECTIONS: readonly Direction[] = [...LINEAR_DIRECTIONS, ...DIAGONAL_DIRECTIONS]

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  'top': 'bottom',
  'top-right': 'bottom-left',
  'right': 'left',
  'bottom-right': 'top-left',
  'bottom': 'top',
  'bottom-left': 'top-right',
  'left': 'right',
  'top-left': 'bottom-right',
}

// The 8 knight jumps as neighbor paths: two steps in one direction, one step perpendicular.
export const L_SHAPE_PATHS: readonly (readonly Direction[])[] = [
  ['top', 'top', 'left'],
  ['top', 'top', 'right'],
  ['right', 'right', 'top'],
  ['right', 'right', 'bottom'],
  ['bottom', 'bottom', 'right'],
  ['bottom', 'bottom', 'left'],
  ['left', 'left', 'bottom'],
  ['left', 'left', 'top'],
]

// Follows the neighbors graph along the given directions; null once the path leaves the board.
export function walkPath(from: Square, path: readonly Direction[]): Square | null {
  let current: Square | null = from

  for (const direction of path) {
    current = current.neighbor(direction)
    if (!current) {
      return null
    }
  }

  return current
}

export interface RayHit {
  square: Square
  piece: Piece
  distance: number
}

// Slides to the first piece met in that direction; null when only empty squares reach the edge.
export function firstPieceInDirection(from: Square, direction: Direction): RayHit | null {
  let current = from.neighbor(direction)
  let distance = 1

  while (current) {
    const piece = current.piece
    if (piece) {
      return {square: current, piece, distance}
    }

    current = current.neighbor(direction)
    distance++
  }

  return null
}

// A slider's line of sight: walked from its square in one direction to the board edge, THROUGH
// every piece met. One structure unifies the check ray (interpositions + x-ray extension), the
// pin (one friendly blocker before the king) and, come phase ④, the en passant discovery (two
// blockers leaving the same ray at once).
export class Ray {
  readonly attackerSquare: Square
  readonly direction: Direction
  // Every square past the attacker, in walking order, up to the board edge.
  readonly squares: Square[] = []
  // The occupied squares met along the way, in walking order.
  readonly blockers: Square[] = []

  constructor(attackerSquare: Square, direction: Direction) {
    this.attackerSquare = attackerSquare
    this.direction = direction

    let current = attackerSquare.neighbor(direction)
    while (current) {
      this.squares.push(current)
      if (!current.isEmpty) {
        this.blockers.push(current)
      }

      current = current.neighbor(direction)
    }
  }

  // The square is on the ray with no blocker strictly before it — a real attack, right now.
  attacksDirectly(square: Square): boolean {
    return this.seesThrough(square) && this.blockersBefore(square).length === 0
  }

  // The square is on the ray, pieces in between ignored.
  seesThrough(square: Square): boolean {
    return this.squares.includes(square)
  }

  // The occupied squares strictly between the attacker and the given square.
  blockersBefore(square: Square): Square[] {
    const limit = this.squares.indexOf(square)
    return this.blockers.filter(blocker => this.squares.indexOf(blocker) < limit)
  }

  // The squares strictly between the attacker and the given square.
  squaresBefore(square: Square): Square[] {
    return this.squares.slice(0, this.squares.indexOf(square))
  }

  // The next square past the given one on the ray — null at the board edge or off the ray.
  squareBeyond(square: Square): Square | null {
    const index = this.squares.indexOf(square)
    if (index === -1) {
      return null
    }

    return this.squares[index + 1] ?? null
  }
}
