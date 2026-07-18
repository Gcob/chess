import type {Piece as PieceDto, PieceColor, PieceType} from '@/types/chess'
import type {Square} from './square'
import {getPieceMoveTypes, type MoveType} from './moveTypes'

// The piece vocabulary — value and text representation per type. Owned by the engine: piece
// construction (factory) and promotion (applyMove) both read it.
export const PIECE_DATA: Record<PieceType, { value: number; short: string; long: string }> = {
  king: {value: 0, short: 'K', long: 'King'}, // 0 = sentinel, king cannot be captured
  queen: {value: 9, short: 'Q', long: 'Queen'},
  rook: {value: 5, short: 'R', long: 'Rook'},
  bishop: {value: 3, short: 'B', long: 'Bishop'},
  knight: {value: 3, short: 'N', long: 'Knight'},
  pawn: {value: 1, short: 'P', long: 'Pawn'},
}

// Transforms a piece in place — promotion's effect. Identity survives by design: id (the
// stable Vue key — the same sprite node becomes the queen), color and hasMoved stay.
export function transformPiece(piece: PieceDto, type: PieceType): void {
  const {value, short, long} = PIECE_DATA[type]
  piece.type = type
  piece.value = value
  piece.textRepresentation = {short, long}
}

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
