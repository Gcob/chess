import type {Board, MoveTypeId, PieceColor, Square} from '@/types/chess'
import {Ray, ALL_DIRECTIONS, L_SHAPE_PATHS, walkPath, firstPieceInDirection} from './ray'
import {getPieceMoveTypes} from './moveTypes'
import {findKingSquare} from './board'

// ─── Position analysis ──────────────────────────────────────────────────────────
// The read-only analysis of ONE position. Born from a board, thrown away at the next move —
// its lazy caches can never go stale. Hybrid boundary: state 100% derived from the board,
// lifetime bounded to one position, never stored in the DTO or a store, no module state.
// Strictly interrogative: the rules live in the engine functions, this only answers questions.

export class PositionAnalysis {
  private allRays?: Ray[]

  constructor(private readonly board: Board) {}

  // Every ray of every slider on the board, both colors — anything whose move types slide,
  // so a promoted queen casts rays like the original one. Lazy: computed once per position.
  rays(): Ray[] {
    this.allRays ??= computeRays(this.board)
    return this.allRays
  }

  kingSquare(color: PieceColor): Square | null {
    return findKingSquare(this.board, color)
  }

  isAttacked(square: Square, byColor: PieceColor): boolean {
    return getAttackers(square, byColor).length > 0
  }

  // The enemy squares currently giving check to this color's king.
  checkers(color: PieceColor): Square[] {
    const kingSquare = this.kingSquare(color)
    if (!kingSquare) {
      return []
    }

    return getAttackers(kingSquare, enemyOf(color))
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
}

// ─── Public functional API ──────────────────────────────────────────────────────
// The engine's public surface stays functions on plain data; the classes above are its organs.

// Squares holding a piece of the given color that attacks the given square. Looks outward FROM
// the square (the "super-piece" trick): a pattern walked from here can only land on a piece
// attacking back along that same pattern. Piece types stay out of the logic — the piece found is
// tested against the attack signatures of its own move types, so getPieceMoveTypes remains the
// single place knowing what a piece can do.
export function getAttackers(square: Square, byColor: PieceColor): Square[] {
  return [...directionalAttackers(square, byColor), ...knightAttackers(square, byColor)]
}

// The enemy squares currently giving check to the given color's king. A legal position allows
// two checkers at most (double check, born from a discovery) — with two, only a king move can
// answer: no block or capture handles both.
export function findCheckers(board: Board, color: PieceColor): Square[] {
  return new PositionAnalysis(board).checkers(color)
}

// ─── Private attack logic ──────────────────────────────────────────────────────

function enemyOf(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white'
}

function computeRays(board: Board): Ray[] {
  const rays: Ray[] = []

  for (const square of Object.values(board.squares)) {
    const piece = square.piece
    if (!piece) {
      continue
    }

    const moveTypes = getPieceMoveTypes(piece.type)
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
function directionalAttackers(square: Square, byColor: PieceColor): Square[] {
  const attackers: Square[] = []

  for (const direction of ALL_DIRECTIONS) {
    const hit = firstPieceInDirection(square, direction)

    if (!hit || hit.piece.color !== byColor) {
      continue
    }

    const attacks = getPieceMoveTypes(hit.piece.type)
      .some(type => type.attacksAlong(direction, hit.distance, byColor))

    if (attacks) {
      attackers.push(hit.square)
    }
  }

  return attackers
}

function knightAttackers(square: Square, byColor: PieceColor): Square[] {
  return L_SHAPE_PATHS
    .map(path => walkPath(square, path))
    .filter((found): found is Square => isAttackerWithMoveType(found, byColor, 'l-shape'))
}

function isAttackerWithMoveType(square: Square | null, byColor: PieceColor, id: MoveTypeId): boolean {
  return !!square?.piece
    && square.piece.color === byColor
    && getPieceMoveTypes(square.piece.type).some(type => type.id === id)
}
