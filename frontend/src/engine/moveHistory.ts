import type {Move, SquareKey} from '@/types/chess'
import type {CastlingRights} from './board'

// ─── Move history ───────────────────────────────────────────────────────────────
// The engine's MoveHistory: a behaviour wrapper around Game.moves — the single source of truth
// every history-derived right reads. Same hybrid boundary as Board: state lives in the DTO,
// behaviour lives here, instances live ≤ one position so the lazy caches can never go stale.
// History questions ONLY — anything needing the board stays with the caller.

// FEN-style castling rights: each right lives while its king and rook squares were never
// departed from — and never landed on, which only happens once the original tenant is gone or
// captured on the spot.
const CASTLING_RIGHTS = [
  {code: 'K', kingSquare: 'e1', rookSquare: 'h1'},
  {code: 'Q', kingSquare: 'e1', rookSquare: 'a1'},
  {code: 'k', kingSquare: 'e8', rookSquare: 'h8'},
  {code: 'q', kingSquare: 'e8', rookSquare: 'a8'},
] as const

export class MoveHistory {
  private lossIndexes?: number[]

  constructor(readonly moves: Move[]) {}

  get last(): Move | undefined {
    return this.moves[this.moves.length - 1]
  }

  // The en passant target of the current position — the square crossed by an immediately
  // preceding double push (FEN's ep field), null otherwise. The right expires by construction.
  enPassantTarget(): SquareKey | null {
    return doublePushTarget(this.last)
  }

  // Half-moves played since the last irreversible event (pawn move or capture), walked from
  // the end — the fifty-move clock is derived, never tracked apart.
  halfmovesSinceProgress(): number {
    let count = 0
    for (let i = this.moves.length - 1; i >= 0; i--) {
      const move = this.moves[i]!
      if (move.pieceType === 'pawn' || move.capture) {
        break
      }

      count++
    }

    return count
  }

  // The rights of the position sitting `depth` half-moves into the history.
  castlingRightsAt(depth: number): CastlingRights {
    this.lossIndexes ??= this.computeCastlingLossIndexes()
    const rights = CASTLING_RIGHTS
      .filter((_, index) => this.lossIndexes![index]! >= depth)
      .map(({code}) => code)
      .join('')

    // The filter walks CASTLING_RIGHTS in KQkq declaration order, so the join is always a
    // valid CastlingRights — the cast is the one place the string world meets the type.
    return (rights || '-') as CastlingRights
  }

  // The move index at which each right dies — the first touch of its king or rook square.
  // Infinity = the right still stands.
  private computeCastlingLossIndexes(): number[] {
    return CASTLING_RIGHTS.map(({kingSquare, rookSquare}) => {
      const index = this.moves.findIndex(move =>
        move.from === kingSquare || move.to === kingSquare
        || move.from === rookSquare || move.to === rookSquare,
      )
      return index === -1 ? Infinity : index
    })
  }
}

// The square a double push just crossed, null for any other move — the geometric heart of the
// en passant right, shared with the repetition walk (which prices one historical move at a time).
export function doublePushTarget(move: Move | undefined): SquareKey | null {
  if (!move || move.pieceType !== 'pawn') {
    return null
  }

  const fromRank = Number(move.from[1])
  const toRank = Number(move.to[1])
  if (Math.abs(toRank - fromRank) !== 2) {
    return null
  }

  return `${move.from[0]}${(fromRank + toRank) / 2}` as SquareKey
}
