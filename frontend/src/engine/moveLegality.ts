import type {SquareKey} from '@/types/chess'
import type {Board} from './board'
import type {Piece} from './piece'
import type {Square} from './square'

// ─── Legality pipeline ──────────────────────────────────────────────────────────
// The engine's answer to « where may the piece on this square go? » — one organ per question,
// same hybrid boundary as Board/MoveHistory: born on a position, thrown away with it, every
// read derived. Progressive restriction: raw geometry, then one filter per rule, each filter
// guarding its own relevance so the chain holds for any piece. Pure queries on the unmutated
// board — no move/undo simulation anywhere.

export class MoveLegality {
  private readonly from: Square
  private readonly piece: Piece | null

  constructor(
    private readonly board: Board,
    from: SquareKey,
  ) {
    this.from = board.square(from)
    this.piece = this.from.piece
  }

  squares(): Square[] {
    if (!this.piece) {
      return []
    }

    const availableSquares = this.piece.availableSquares()
    const safeSquares = this.restrictToSafeKingSquares(availableSquares)
    const castlingSafeSquares = this.restrictToSafeCastling(safeSquares)
    const unpinnedSquares = this.restrictToPinRay(castlingSafeSquares)
    const epSafeSquares = this.restrictToSafeEnPassant(unpinnedSquares)
    return this.restrictToCheckResponses(epSafeSquares)
  }

  // Only the king answers to destination safety — a no-op for every other piece.
  // Drop the attacked squares, then the x-rayed ones (the squares behind the king on a check
  // ray, unattacked right now only because the king himself still blocks the ray — see
  // Board.xRayExtensionSquares).
  private restrictToSafeKingSquares(squares: Square[]): Square[] {
    if (this.piece!.type !== 'king') {
      return squares
    }

    const unattackedSquares = squares.filter(to => !this.board.isAttacked(to, this.enemyColor))
    const xRayedSquares = this.board.xRayExtensionSquares(this.piece!.color)

    return unattackedSquares.filter(to => !xRayedSquares.includes(to))
  }

  // The castling-specific safety rules: the king may not castle out of check nor across an
  // attacked square. The landing square is already covered by restrictToSafeKingSquares, and
  // the rook's path is free to be attacked — only the king's own journey matters. A moved king
  // lost its castling rights — the geometry already yields no castling destination for it, the
  // guard just skips probing every destination for nothing.
  private restrictToSafeCastling(squares: Square[]): Square[] {
    if (this.piece!.type !== 'king' || this.piece!.hasMoved) {
      return squares
    }

    return squares.filter(to => {
      const direction = this.castlingDirection(to)
      if (!direction) {
        return true
      }

      return !this.board.isAttacked(this.from, this.enemyColor)
        && !this.board.isAttacked(this.from.neighbor(direction)!, this.enemyColor)
    })
  }

  // A pinned piece may only move along the pin axis: toward the pinner (capturing it included)
  // or back toward its own king — never off the ray.
  private restrictToPinRay(squares: Square[]): Square[] {
    const pinRay = this.board.pinRayFor(this.from)
    if (!pinRay) {
      return squares
    }

    return squares.filter(square => pinRay.includes(square))
  }

  // En passant is the one capture clearing TWO squares at once — the capturer's and the
  // victim's. The pin model (a single blocker) cannot see it, so the ep destination gets its
  // own exposure check: refused when an enemy ray to the king would lose its every blocker,
  // unless the landing square re-blocks the line.
  private restrictToSafeEnPassant(squares: Square[]): Square[] {
    const target = this.board.enPassantTargetSquare()
    if (this.piece!.type !== 'pawn' || !target || !squares.includes(target)) {
      return squares
    }

    const kingSquare = this.board.kingSquare(this.piece!.color)
    if (!kingSquare) {
      return squares
    }

    const victim = this.enPassantVictim()
    const exposed = this.board.rays().some(ray =>
      ray.attackerSquare.piece?.color !== this.piece!.color
      && ray.seesThrough(kingSquare)
      && !ray.squaresBefore(kingSquare).includes(target)
      && ray.blockersBefore(kingSquare).every(blocker => blocker === this.from || blocker === victim),
    )

    return exposed ? squares.filter(square => square !== target) : squares
  }

  // Non-king answers to check: capture the checker or block its ray; nothing answers a double
  // check. The king is exempt — it answers by moving to safety (restrictToSafeKingSquares).
  // One answer the square-based model misses: when the checker IS the en passant victim, the
  // capture lands beside it, on the target square.
  private restrictToCheckResponses(squares: Square[]): Square[] {
    if (this.piece!.type === 'king') {
      return squares
    }

    const responses = this.board.checkResponseSquares(this.piece!.color)
    if (!responses) {
      return squares
    }

    const epAnswer = this.enPassantVictimCapture()
    return squares.filter(square => responses.includes(square) || square === epAnswer)
  }

  // A king landing two squares away is castling — the geometry produces no other two-square
  // king destination. Null for every ordinary move.
  private castlingDirection(to: Square): 'left' | 'right' | null {
    for (const direction of ['left', 'right'] as const) {
      if (this.from.neighbor(direction)?.neighbor(direction) === to) {
        return direction
      }
    }

    return null
  }

  // The ep target when capturing there removes the single checker — null in any other situation.
  private enPassantVictimCapture(): Square | null {
    const target = this.board.enPassantTargetSquare()
    if (!target || this.piece!.type !== 'pawn') {
      return null
    }

    const checkers = this.board.checkers(this.piece!.color)
    return checkers.length === 1 && checkers[0] === this.enPassantVictim() ? target : null
  }

  // The enemy pawn an en passant capture removes: directly behind the target, beside the capturer.
  private enPassantVictim(): Square | null {
    const target = this.board.enPassantTargetSquare()
    if (!target) {
      return null
    }

    return target.neighbor(this.piece!.color === 'white' ? 'bottom' : 'top')
  }

  private get enemyColor(): 'white' | 'black' {
    return this.piece!.color === 'white' ? 'black' : 'white'
  }
}
