import type {Direction, MoveTypeId, PieceColor, PieceType} from '@/types/chess'
import {LINEAR_DIRECTIONS, DIAGONAL_DIRECTIONS} from './ray'

// ─── Move type capabilities ─────────────────────────────────────────────────────
// The single place knowing what each piece type can do. Every other engine module reasons on
// move types, never on piece types.

export function getPieceMoveTypes(pieceType: PieceType): MoveTypeId[] {
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

// The attack signature of each move type — from the attacked square's point of view, `direction`
// points toward the attacker sitting `distance` squares away.
export function attacksAlong(type: MoveTypeId, direction: Direction, distance: number, byColor: PieceColor): boolean {
  switch (type) {
    case 'linear':
    case 'diagonal':
      return slidesAlong(type, direction)
    case 'simple':
      return distance === 1
    case 'diagonal-forward-capture':
      return distance === 1 && isPawnAttackDirection(direction, byColor)
    // Own geometry, scanned by knight jumps instead of rays.
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

// Whether the move type is a slide running along this direction. Slides are what cast rays:
// checks through a line, pins, x-ray behind the king.
export function slidesAlong(type: MoveTypeId, direction: Direction): boolean {
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
