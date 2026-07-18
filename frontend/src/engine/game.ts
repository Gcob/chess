import type {CastlingSide, Game, GameResult, Move, Piece, PieceColor, PieceType, SquareKey} from '@/types/chess'
import {
  applyMove,
  canMove,
  enPassantVictimKey,
  getCastlingSide,
  hasAnyLegalMove,
  isPromotionChoice,
  isPromotionMove,
} from './move'
import {hasInsufficientMaterial, hasMatingMaterial} from './material'
import {findCheckers, getPlacement, placementSignature} from './board'
import {MoveHistory, doublePushTarget} from './moveHistory'
import {PIECE_DATA} from './piece'

// ─── Game commands ─────────────────────────────────────────────────────────────
// Pure, Vue-agnostic functions mutating the Game DTO in place. Each command is guarded by the
// game status — a functional take on the State pattern: the status is data, the behaviour per
// status lives here. Illegal commands are no-ops.
//
// No clock runs here: time is computed from turnStartedAt (epoch ms) and only settled into
// the mover's timer when a move is played. `now` is injectable for tests and future sync.

// 50 full moves by each side — the rule counts half-moves.
const FIFTY_MOVE_LIMIT = 100

// Thin façade — the public API stays functions on plain data, MoveHistory is the organ.
export function halfmovesSinceProgress(game: Game): number {
  return new MoveHistory(game.moves).halfmovesSinceProgress()
}

// Threefold repetition: the current position (same pieces on the same squares, same side to
// move, same castling and en passant rights) already occurred twice before. Derived from the
// history — the current placement is walked BACKWARD through the quiet tail in a detached map,
// each undone half-move yielding an earlier signature. The walk stops at the first irreversible
// move: pawn moves and captures (material and structure only go one way) and castling (every
// earlier position still held the castling right, so none can match — the rook undo never
// happens).
export function isThreefoldRepetition(game: Game): boolean {
  const placement = getPlacement(game.board)
  let color = game.activeColor
  const history = new MoveHistory(game.moves)
  const current = placementSignature(
    placement,
    color,
    history.castlingRightsAt(game.moves.length),
    enPassantSignature(placement, color, history.last)
  )

  let occurrences = 1
  for (let i = game.moves.length - 1; i >= 0; i--) {
    const move = game.moves[i]!
    if (move.pieceType === 'pawn' || move.capture || move.castling) {
      break
    }

    placement.delete(move.to)
    placement.set(move.from, move.color[0] + move.pieceType)
    color = oppositeColor(color)
    const signature = placementSignature(
      placement,
      color,
      history.castlingRightsAt(i),
      enPassantSignature(placement, color, game.moves[i - 1])
    )
    if (signature === current && ++occurrences >= 3) {
      return true
    }
  }

  return false
}

// The ep component of a position's signature: the target square, but only when a pawn of the
// side to move stands beside the pushed pawn — a right nobody could even pseudo-exercise never
// distinguishes positions (aligned with chess.js; FIDE 9.2 in spirit). Placement + history mix,
// so it lives here with the repetition rule, not in MoveHistory.
function enPassantSignature(
  placement: Map<SquareKey, string>,
  activeColor: PieceColor,
  lastMove: Move | undefined,
): SquareKey | '-' {
  const target = doublePushTarget(lastMove)
  if (!target) {
    return '-'
  }

  const landing = lastMove!.to
  const pawnCode = activeColor[0] + 'pawn'
  const capturable = [-1, 1].some(shift => {
    const beside = String.fromCharCode(landing.charCodeAt(0) + shift) + landing[1]
    return placement.get(beside as SquareKey) === pawnCode
  })

  return capturable ? target : '-'
}

// Thin façade — the public API stays functions on plain data, MoveHistory is the organ.
export function enPassantTarget(moves: Move[]): SquareKey | null {
  return new MoveHistory(moves).enPassantTarget()
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
export function makeMove(
  game: Game,
  from: SquareKey,
  to: SquareKey,
  now: number = Date.now(),
  promotion: PieceType | null = null,
): void {
  if (game.status === 'finished') {
    return
  }

  const piece = game.board.squares[from].piece
  if (!piece || piece.color !== game.activeColor) {
    return
  }

  if (!canMove(game.board, from, to, enPassantTarget(game.moves))) {
    return
  }

  // A promotion push without a valid choice is an incomplete command — never a silent queen:
  // the visible default lives in the UI setting, the engine only executes explicit choices.
  const promoting = isPromotionMove(piece, to)
  if (promoting && !isPromotionChoice(promotion)) {
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

  // The Move is built BEFORE the board mutates: a promotion transforms the piece in place,
  // and the record must keep the pawn's identity (pieceType feeds the fifty-move clock).
  const victimKey = enPassantVictimKey(game.board, piece, from, to)
  const captured = victimKey ? game.board.squares[victimKey].piece : game.board.squares[to].piece
  const move = buildMove(
    piece,
    captured,
    from,
    to,
    elapsedSeconds,
    victimKey !== null,
    promoting ? promotion : null,
  )
  applyMove(game.board, from, to, promotion)
  game.moves.push(move)

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
  // otherwise a dead position (no possible mate for anyone) is an automatic draw. The reply
  // may be an en passant — the just-played double push is the context.
  if (!hasAnyLegalMove(game.board, game.activeColor, enPassantTarget(game.moves))) {
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

// Replays a trusted move list through makeMove — scenario seeding today, refresh/persistence
// tomorrow. One shared `now` spends no clock time. A refused move throws: replayed data is
// developer or persisted data, a corruption must scream, never half-apply silently.
export function replayMoves(
  game: Game,
  moves: Array<[SquareKey, SquareKey, PieceType?]>,
  now: number = Date.now(),
): void {
  for (const [from, to, promotion] of moves) {
    const before = game.moves.length
    makeMove(game, from, to, now, promotion ?? null)
    if (game.moves.length === before) {
      throw new Error(`replayMoves: move ${before + 1} (${from}-${to}) was refused by the engine`)
    }
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
function buildSan(
  piece: Piece,
  captured: Piece | null,
  from: SquareKey,
  to: SquareKey,
  castling: CastlingSide | null,
  promotion: PieceType | null,
): string {
  if (castling) {
    return castling === 'king-side' ? 'O-O' : 'O-O-O'
  }

  if (piece.type === 'pawn') {
    const base = captured ? `${from[0]}x${to}` : to
    return promotion ? `${base}=${PIECE_DATA[promotion].short}` : base
  }

  return `${piece.textRepresentation.short}${captured ? 'x' : ''}${to}`
}

function buildMove(
  piece: Piece,
  captured: Piece | null,
  from: SquareKey,
  to: SquareKey,
  elapsedSeconds: number,
  enPassant: boolean,
  promotion: PieceType | null,
): Move {
  const castling = getCastlingSide(piece, from, to)
  const move: Move = {
    san: buildSan(piece, captured, from, to, castling, promotion),
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

  if (enPassant) {
    move.enPassant = true
  }

  if (promotion) {
    move.promotion = promotion
  }

  return move
}
