import type {Piece as PieceDto, PieceColor, PieceType} from '@/types/chess'
import type {Square} from './square'
import {getPieceMoveTypes, type MoveType} from './moveTypes'

// The engine's Piece: a behaviour wrapper around the DTO piece, bound to the square it sits on.
// No state of its own — reads go through the plain data, so a mutation applied to the DTO
// (applyMove's hasMoved) is immediately visible through the wrapper.
export class Piece {
  constructor(
    readonly dto: PieceDto,
    readonly square: Square,
  ) {}

  get id(): string {
    return this.dto.id
  }

  get color(): PieceColor {
    return this.dto.color
  }

  get type(): PieceType {
    return this.dto.type
  }

  get hasMoved(): boolean {
    return this.dto.hasMoved
  }

  moveTypes(): MoveType[] {
    return getPieceMoveTypes(this.dto.type)
  }

  // Where this piece could go — raw geometry only, before any legality filter (canMove's job).
  availableSquares(): Square[] {
    return this.moveTypes().flatMap(type => type.availableSquares(this.square, this))
  }
}
