import type {Direction, Square as SquareDto, SquareKey} from '@/types/chess'
import type {Board} from './board'
import {Piece} from './piece'

// The engine's Square: a behaviour wrapper around the DTO square. No state of its own — every
// read goes through the plain data. Instances are cached by their Board, so reference equality
// holds within one position (the hybrid boundary: wrappers live and die with their Board).
export class Square {
  // undefined = not resolved yet; null = resolved, empty square
  private pieceWrapper: Piece | null | undefined

  constructor(
    readonly dto: SquareDto,
    readonly board: Board,
  ) {}

  get key(): SquareKey {
    return `${this.dto.file}${this.dto.rank}` as SquareKey
  }

  get file(): SquareDto['file'] {
    return this.dto.file
  }

  get rank(): SquareDto['rank'] {
    return this.dto.rank
  }

  get color(): SquareDto['color'] {
    return this.dto.color
  }

  get isEmpty(): boolean {
    return this.dto.piece === null
  }

  // The piece sitting here, wrapped and bound to this square. Cached lazily: occupancy is
  // frozen within a Board's lifetime (≤ one position), so the wrapper can never go stale.
  get piece(): Piece | null {
    if (this.pieceWrapper === undefined) {
      this.pieceWrapper = this.dto.piece ? new Piece(this.dto.piece, this) : null
    }

    return this.pieceWrapper
  }

  // Resolved through the Board's cache — the same key always yields the same instance.
  neighbor(direction: Direction): Square | null {
    const next = this.dto.neighbors[direction]
    return next ? this.board.square(`${next.file}${next.rank}`) : null
  }
}
