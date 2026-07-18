import type {
  Board as BoardDto,
  BoardPiece,
  PieceColor,
  Square as SquareDto,
  SquareKey,
} from '@/types/chess'
import {Square} from './square'
import {Ray, ALL_DIRECTIONS, L_SHAPE_PATHS, walkPath, firstPieceInDirection} from './ray'

// ─── Board ──────────────────────────────────────────────────────────────────────
// The engine's Board — the domain model's « Échiquier ». Born from a board DTO, thrown away at
// the next move: its lazy caches (wrappers, rays) can never go stale. Hybrid boundary: state
// lives in the DTO, behaviour lives here; wrappers, never a parallel model. Strictly
// interrogative — the rules live in the engine functions, this only answers questions.

export class Board {
  private readonly squareWrappers = new Map<SquareKey, Square>()
  private allRays?: Ray[]

  // The ep target is position context derived from the history by the caller (enPassantTarget)
  // — it rides on the Board because it lives and dies with the position, like the wrappers.
  constructor(
    readonly dto: BoardDto,
    private readonly enPassantTargetKey: SquareKey | null = null,
  ) {}

  enPassantTargetSquare(): Square | null {
    return this.enPassantTargetKey ? this.square(this.enPassantTargetKey) : null
  }

  // The same key always yields the same wrapper instance — reference equality holds.
  square(key: SquareKey): Square {
    let wrapper = this.squareWrappers.get(key)
    if (!wrapper) {
      wrapper = new Square(this.dto.squares[key], this)
      this.squareWrappers.set(key, wrapper)
    }

    return wrapper
  }

  squares(): Square[] {
    return (Object.keys(this.dto.squares) as SquareKey[]).map(key => this.square(key))
  }

  // Every ray of every slider on the board, both colors — anything whose move types slide,
  // so a promoted queen casts rays like the original one. Lazy: computed once per position.
  rays(): Ray[] {
    this.allRays ??= this.computeRays()
    return this.allRays
  }

  kingSquare(color: PieceColor): Square | null {
    return this.squares().find(
      square => square.piece?.type === 'king' && square.piece.color === color,
    ) ?? null
  }

  // Squares holding a piece of the given color that attacks the given square. Looks outward
  // FROM the square (the "super-piece" trick): a pattern walked from here can only land on a
  // piece attacking back along that same pattern. The piece found is tested against the attack
  // signatures of its own move types.
  attackers(square: Square, byColor: PieceColor): Square[] {
    return [...this.directionalAttackers(square, byColor), ...this.knightAttackers(square, byColor)]
  }

  isAttacked(square: Square, byColor: PieceColor): boolean {
    return this.attackers(square, byColor).length > 0
  }

  // The enemy squares currently giving check to this color's king.
  checkers(color: PieceColor): Square[] {
    const kingSquare = this.kingSquare(color)
    if (!kingSquare) {
      return []
    }

    return this.attackers(kingSquare, enemyOf(color))
  }

  // The enemy rays striking the king with nothing in between.
  checkRays(color: PieceColor): Ray[] {
    const kingSquare = this.kingSquare(color)
    if (!kingSquare) {
      return []
    }

    return this.rays().filter(ray =>
      ray.attackerSquare.piece?.color === enemyOf(color) && ray.attacksDirectly(kingSquare),
    )
  }

  // The squares a piece pinned on `square` may still occupy: the pinning ray's attacker→king
  // segment, capture of the pinner included. Null when not pinned. A pin is unique — the piece
  // and its king define a single line, so at most one enemy ray can match.
  pinRayFor(square: Square): Square[] | null {
    const piece = square.piece
    if (!piece || piece.type === 'king') {
      return null
    }

    const kingSquare = this.kingSquare(piece.color)
    if (!kingSquare) {
      return null
    }

    const pinningRay = this.rays().find(ray =>
      ray.attackerSquare.piece?.color === enemyOf(piece.color)
      && ray.seesThrough(kingSquare)
      && ray.blockersBefore(kingSquare).length === 1
      && ray.blockersBefore(kingSquare)[0] === square,
    )
    if (!pinningRay) {
      return null
    }

    return [pinningRay.attackerSquare, ...pinningRay.squaresBefore(kingSquare)]
  }

  // How a NON-king piece may answer the current check. Null = no check (no restriction);
  // [] = double check (nothing answers, only the king moves); one checker = capture it, or
  // block its ray — a knight or pawn casts no ray, so capturing it is the only answer.
  checkResponseSquares(color: PieceColor): Square[] | null {
    const checkers = this.checkers(color)
    if (checkers.length === 0) {
      return null
    }

    if (checkers.length > 1) {
      return []
    }

    const checkerSquare = checkers[0]!
    const kingSquare = this.kingSquare(color)!
    const checkRay = this.checkRays(color).find(ray => ray.attackerSquare === checkerSquare)
    if (!checkRay) {
      return [checkerSquare]
    }

    return [checkerSquare, ...checkRay.squaresBefore(kingSquare)]
  }

  // The x-ray trap behind the king. Example: a rook checks the king — the square behind him is
  // NOT attacked right now (the king himself blocks the ray), but the moment he steps there, it
  // is attacked again. Every check ray extends one square past the king; a fleeing king must be
  // denied those squares.
  xRayExtensionSquares(color: PieceColor): Square[] {
    const kingSquare = this.kingSquare(color)
    if (!kingSquare) {
      return []
    }

    return this.checkRays(color)
      .map(ray => ray.squareBeyond(kingSquare))
      .filter((square): square is Square => square !== null)
  }

  private computeRays(): Ray[] {
    const rays: Ray[] = []

    for (const square of this.squares()) {
      const piece = square.piece
      if (!piece) {
        continue
      }

      const moveTypes = piece.moveTypes()
      for (const direction of ALL_DIRECTIONS) {
        if (moveTypes.some(type => type.slidesAlong(direction))) {
          rays.push(new Ray(square, direction))
        }
      }
    }

    return rays
  }

  // One scan per direction: the first piece met attacks back if one of its move types strikes
  // along this direction at this distance — sliders at any range, king and pawn at distance 1.
  private directionalAttackers(square: Square, byColor: PieceColor): Square[] {
    const attackers: Square[] = []

    for (const direction of ALL_DIRECTIONS) {
      const hit = firstPieceInDirection(square, direction)

      if (!hit || hit.piece.color !== byColor) {
        continue
      }

      const attacks = hit.piece.moveTypes()
        .some(type => type.attacksAlong(direction, hit.distance, byColor))

      if (attacks) {
        attackers.push(hit.square)
      }
    }

    return attackers
  }

  private knightAttackers(square: Square, byColor: PieceColor): Square[] {
    return L_SHAPE_PATHS
      .map(path => walkPath(square, path))
      .filter((found): found is Square =>
        !!found?.piece
        && found.piece.color === byColor
        && found.piece.moveTypes().some(type => type.id === 'l-shape'),
      )
  }
}

function enemyOf(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white'
}

// ─── Public functional API ──────────────────────────────────────────────────────
// The engine's public surface stays functions on plain data; the classes are its organs.

// Flattens the board into the list of occupied squares.
// The board stays the single source of truth — this is a derived view, not state.
export function getBoardPieces(board: BoardDto): BoardPiece[] {
  const pieces: BoardPiece[] = []
  for (const [square, {piece}] of Object.entries(board.squares) as [SquareKey, BoardDto['squares'][SquareKey]][]) {
    if (piece) {
      pieces.push({piece, square})
    }
  }
  return pieces
}

// A board IS a position — these two answer its identity, the repetition question's foundation.
// The placement (what stands where) is exposed as a mutable map so the repetition walk can
// undo history on a detached copy without rebuilding boards; the signature stamps a placement
// plus the side to move, the castling rights and the en passant right (same placement, other
// trait or other rights = different position — both rights are the caller's business, derived
// from its history). A full string, never a numeric hash: a collision would be an undetectable
// phantom draw.
export function getPlacement(board: BoardDto): Map<SquareKey, string> {
  const placement = new Map<SquareKey, string>()
  for (const {piece, square} of getBoardPieces(board)) {
    placement.set(square, piece.color[0] + piece.type)
  }
  return placement
}

// The FEN-style castling-rights fragment of a signature: the standing rights in KQkq order,
// '-' when none survive. The template union rejects any stray string at compile time.
export type CastlingRights = Exclude<`${'K' | ''}${'Q' | ''}${'k' | ''}${'q' | ''}`, ''> | '-'

export function placementSignature(
  placement: Map<SquareKey, string>,
  activeColor: PieceColor,
  castlingRights: CastlingRights,
  enPassant: SquareKey | '-',
): string {
  return [...placement.entries()].map(([square, code]) => square + code).sort().join('|')
    + activeColor + castlingRights + enPassant
}

export function findKingSquare(board: BoardDto, color: PieceColor): SquareDto | null {
  return Object.values(board.squares).find(
    square => square.piece?.type === 'king' && square.piece.color === color,
  ) ?? null
}

export function toSquareKey(square: SquareDto): SquareKey {
  return `${square.file}${square.rank}` as SquareKey
}

// Squares holding a piece of the given color that attacks the given square.
export function getAttackers(board: BoardDto, square: SquareKey, byColor: PieceColor): SquareDto[] {
  const engineBoard = new Board(board)
  return engineBoard.attackers(engineBoard.square(square), byColor).map(attacker => attacker.dto)
}

// The enemy squares currently giving check to the given color's king. A legal position allows
// two checkers at most (double check, born from a discovery) — with two, only a king move can
// answer: no block or capture handles both.
export function findCheckers(board: BoardDto, color: PieceColor): SquareDto[] {
  return new Board(board).checkers(color).map(checker => checker.dto)
}
