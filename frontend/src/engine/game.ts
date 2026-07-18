import type {CastlingSide, Game, GameResult, Move, Piece, PieceColor, SquareKey} from '@/types/chess'
import {canMove, applyMove, getCastlingSide, hasAnyLegalMove} from './move'
import {hasInsufficientMaterial, hasMatingMaterial} from './material'
import {findCheckers, getPlacement, placementSignature, type CastlingRights} from './board'

// ─── Game commands ─────────────────────────────────────────────────────────────
// Pure, Vue-agnostic functions mutating the Game DTO in place. Each command is guarded by the
// game status — a functional take on the State pattern: the status is data, the behaviour per
// status lives here. Illegal commands are no-ops.
//
// No clock runs here: time is computed from turnStartedAt (epoch ms) and only settled into
// the mover's timer when a move is played. `now` is injectable for tests and future sync.

// 50 full moves by each side — the rule counts half-moves.
const FIFTY_MOVE_LIMIT = 100

// Half-moves played since the last irreversible event (pawn move or capture), walked from the
// end of the history — the fifty-move clock is derived from the moves, never tracked apart.
export function halfmovesSinceProgress(game: Game): number {
  let count = 0
  for (let i = game.moves.length - 1; i >= 0; i--) {
    const move = game.moves[i]!
    if (move.pieceType === 'pawn' || move.capture) {
      break
    }

    count++
  }

  return count
}

// Threefold repetition: the current position (same pieces on the same squares, same side to
// move, same castling rights) already occurred twice before. Derived from the history — the
// current placement is walked BACKWARD through the quiet tail in a detached map, each undone
// half-move yielding an earlier signature. The walk stops at the first irreversible move:
// pawn moves and captures (material and structure only go one way) and castling (every earlier
// position still held the castling right, so none can match — the rook undo never happens).
// En-passant rights join the signature with the en passant step of phase ④.
export function isThreefoldRepetition(game: Game): boolean {
  const placement = getPlacement(game.board)
  let color = game.activeColor
  const lossIndexes = castlingLossIndexes(game.moves)
  const current = placementSignature(placement, color, castlingRightsAt(lossIndexes, game.moves.length))

  let occurrences = 1
  for (let i = game.moves.length - 1; i >= 0; i--) {
    const move = game.moves[i]!
    if (move.pieceType === 'pawn' || move.capture || move.castling) {
      break
    }

    placement.delete(move.to)
    placement.set(move.from, move.color[0] + move.pieceType)
    color = oppositeColor(color)
    if (placementSignature(placement, color, castlingRightsAt(lossIndexes, i)) === current && ++occurrences >= 3) {
      return true
    }
  }

  return false
}

// FEN-style castling rights, derived from the history like every other counter here: a right
// lives while its king and rook squares were never departed from — and never landed on, which
// only happens once the original tenant is gone or captured on the spot.
const CASTLING_RIGHTS = [
  {code: 'K', kingSquare: 'e1', rookSquare: 'h1'},
  {code: 'Q', kingSquare: 'e1', rookSquare: 'a1'},
  {code: 'k', kingSquare: 'e8', rookSquare: 'h8'},
  {code: 'q', kingSquare: 'e8', rookSquare: 'a8'},
] as const

// The move index at which each right dies — the first touch of its king or rook square.
// Infinity = the right still stands.
function castlingLossIndexes(moves: Move[]): number[] {
  return CASTLING_RIGHTS.map(({kingSquare, rookSquare}) => {
    const index = moves.findIndex(move =>
      move.from === kingSquare || move.to === kingSquare
      || move.from === rookSquare || move.to === rookSquare,
    )
    return index === -1 ? Infinity : index
  })
}

// The rights of the position sitting `depth` half-moves into the history.
function castlingRightsAt(lossIndexes: number[], depth: number): CastlingRights {
  const rights = CASTLING_RIGHTS
    .filter((_, index) => lossIndexes[index]! >= depth)
    .map(({code}) => code)
    .join('')

  // The filter walks CASTLING_RIGHTS in KQkq declaration order, so the join is always a
  // valid CastlingRights — the cast is the one place the string world meets the type.
  return (rights || '-') as CastlingRights
}

export function oppositeColor(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white'
}

export function startGame(game: Game, now: number = Date.now()): void {
  if (game.status !== 'waiting') {
    return
  }

  game.status = 'active'
  game.startedAt = new Date(now)
  game.turnStartedAt = now
}

// The first move of a waiting game starts it — but only once the move is known to be playable,
// so an invalid interaction never transitions the game out of 'waiting'.
export function makeMove(game: Game, from: SquareKey, to: SquareKey, now: number = Date.now()): void {
  if (game.status === 'finished') {
    return
  }

  const piece = game.board.squares[from].piece
  if (!piece || piece.color !== game.activeColor) {
    return
  }

  if (!canMove(game.board, from, to)) {
    return
  }

  if (game.status === 'waiting') {
    startGame(game, now)
  }

  // Moving on an expired clock is a timeout, not a move.
  const elapsedSeconds = elapsedSince(game, now)
  const timer = game.players[game.activeColor].timer
  if (timer && elapsedSeconds >= timer.secondsRemaining) {
    flagTimeout(game, game.activeColor)
    return
  }

  const captured = game.board.squares[to].piece
  applyMove(game.board, from, to)
  game.moves.push(buildMove(piece, captured, from, to, elapsedSeconds))

  // Display snapshot — the legality logic recomputes checkers on demand instead of reading this.
  game.players.white.isInCheck = findCheckers(game.board, 'white').length > 0
  game.players.black.isInCheck = findCheckers(game.board, 'black').length > 0

  if (timer) {
    timer.secondsRemaining += timer.secondsIncrement - elapsedSeconds
  }

  // Playing a move declines any pending draw offer.
  game.drawOffer = null
  game.activeColor = oppositeColor(game.activeColor)
  game.turnStartedAt = now

  // The move may have ended the game: no legal reply = checkmate (in check) or stalemate;
  // otherwise a dead position (no possible mate for anyone) is an automatic draw.
  if (!hasAnyLegalMove(game.board, game.activeColor)) {
    endGame(game, game.players[game.activeColor].isInCheck
      ? {winner: oppositeColor(game.activeColor), reason: 'checkmate'}
      : {winner: null, reason: 'stalemate'})
  } else if (hasInsufficientMaterial(game.board)) {
    endGame(game, {winner: null, reason: 'insufficient-material'})
  } else if (halfmovesSinceProgress(game) >= FIFTY_MOVE_LIMIT) {
    endGame(game, {winner: null, reason: 'fifty-move-rule'})
  } else if (isThreefoldRepetition(game)) {
    endGame(game, {winner: null, reason: 'threefold-repetition'})
  }
}

export function resign(game: Game, color: PieceColor): void {
  if (game.status === 'finished') {
    return
  }

  endGame(game, {winner: oppositeColor(color), reason: 'resignation'})
}

export function offerDraw(game: Game, color: PieceColor): void {
  if (game.status !== 'active' || game.drawOffer !== null) {
    return
  }

  game.drawOffer = color
}

export function acceptDraw(game: Game): void {
  if (game.status !== 'active' || game.drawOffer === null) {
    return
  }

  endGame(game, {winner: null, reason: 'draw-agreement'})
}

export function declineDraw(game: Game): void {
  if (game.status !== 'active') {
    return
  }

  game.drawOffer = null
}

export function flagTimeout(game: Game, color: PieceColor): void {
  if (game.status !== 'active') {
    return
  }

  const timer = game.players[color].timer
  if (!timer) {
    return
  }

  timer.secondsRemaining = 0

  // The flag rule (FIDE 6.9): the fallen flag only loses if the opponent could still mate —
  // a lone king (or a lone minor) facing the flag scores a draw, not a win.
  const opponent = oppositeColor(color)
  endGame(game, hasMatingMaterial(game.board, opponent)
    ? {winner: opponent, reason: 'timeout'}
    : {winner: null, reason: 'timeout'})
}

// Display helper: the settled time, minus the running turn time when color is on the move.
// null = untimed game. Never negative — the clock shows 0 while flagTimeout settles the game.
export function remainingSeconds(game: Game, color: PieceColor, now: number = Date.now()): number | null {
  const timer = game.players[color].timer
  if (!timer) {
    return null
  }

  const running = game.status === 'active' && game.activeColor === color
  const elapsed = running ? elapsedSince(game, now) : 0
  return Math.max(0, timer.secondsRemaining - elapsed)
}

// ─── Internals ─────────────────────────────────────────────────────────────────

function elapsedSince(game: Game, now: number): number {
  if (game.turnStartedAt === null) {
    return 0
  }

  return (now - game.turnStartedAt) / 1000
}

// Every finishing path settles result, drawOffer and turnStartedAt together with the status.
function endGame(game: Game, result: GameResult): void {
  game.status = 'finished'
  game.result = result
  game.drawOffer = null
  game.turnStartedAt = null
}

// Naive SAN — no disambiguation, no check/mate marks until the rules engine lands (see roadmap)
function buildSan(piece: Piece, captured: Piece | null, from: SquareKey, to: SquareKey, castling: CastlingSide | null): string {
  if (castling) {
    return castling === 'king-side' ? 'O-O' : 'O-O-O'
  }

  if (piece.type === 'pawn') {
    return captured ? `${from[0]}x${to}` : to
  }

  return `${piece.textRepresentation.short}${captured ? 'x' : ''}${to}`
}

function buildMove(
  piece: Piece,
  captured: Piece | null,
  from: SquareKey,
  to: SquareKey,
  elapsedSeconds: number,
): Move {
  const castling = getCastlingSide(piece, from, to)
  const move: Move = {
    san: buildSan(piece, captured, from, to, castling),
    color: piece.color,
    pieceType: piece.type,
    from,
    to,
    elapsedSeconds,
  }

  if (captured) {
    move.capture = {capturedPiece: captured}
  }

  if (castling) {
    move.castling = castling
  }

  return move
}
