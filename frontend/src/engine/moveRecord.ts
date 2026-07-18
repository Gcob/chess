import type {
  Board as BoardDto,
  CastlingSide,
  Move,
  Piece as PieceDto,
  PieceType,
  SquareKey,
} from '@/types/chess'
import {enPassantVictimKey, getCastlingSide} from './move'
import {buildSan} from './san'

// ─── Move record ────────────────────────────────────────────────────────────────
// The move about to be played, read against the position it is played FROM: what it captures,
// whether it castles or takes en passant, how it is written — and the plain Move it becomes.
// Same hybrid boundary as Board: every read is derived, nothing is stored twice.
//
// Its answers are lazy, so the record only holds while the board is untouched — build the DTO
// BEFORE applying the move, exactly like a Board instance dies with its position.

export class MoveRecord {
  constructor(
    readonly board: BoardDto,
    readonly piece: PieceDto,
    readonly from: SquareKey,
    readonly to: SquareKey,
    readonly promotion: PieceType | null = null,
    readonly enPassantTarget: SquareKey | null = null,
  ) {}

  get castling(): CastlingSide | null {
    return getCastlingSide(this.piece, this.from, this.to)
  }

  // The square an en passant capture empties beside the landing — null for any other move.
  get enPassantVictim(): SquareKey | null {
    return enPassantVictimKey(this.board, this.piece, this.from, this.to)
  }

  // What this move takes: the piece on the landing square, or the one beside it en passant.
  get capturedPiece(): PieceDto | null {
    const victim = this.enPassantVictim
    return victim ? this.board.squares[victim].piece : this.board.squares[this.to].piece
  }

  get san(): string {
    return buildSan(this)
  }

  // The plain, serializable Move — the engine's public currency. The optional marks are only
  // set when they apply, so an ordinary move stays a minimal object.
  toDto(elapsedSeconds: number): Move {
    const move: Move = {
      san: this.san,
      color: this.piece.color,
      pieceType: this.piece.type,
      from: this.from,
      to: this.to,
      elapsedSeconds,
    }

    const captured = this.capturedPiece
    if (captured) {
      move.capture = {capturedPiece: captured}
    }

    if (this.castling) {
      move.castling = this.castling
    }

    if (this.enPassantVictim) {
      move.enPassant = true
    }

    if (this.promotion) {
      move.promotion = this.promotion
    }

    return move
  }
}
