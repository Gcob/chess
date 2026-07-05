import type {Game, GameResult, Move, Piece, PieceColor, SquareKey} from '@/types/chess'
import {canMove, applyMove} from './move'

// ─── Game commands ─────────────────────────────────────────────────────────────
// Pure, Vue-agnostic functions mutating the Game DTO in place. Each command is guarded by the
// game status — a functional take on the State pattern: the status is data, the behaviour per
// status lives here. Illegal commands are no-ops.
//
// No clock runs here: time is computed from turnStartedAt (epoch ms) and only settled into
// the mover's timer when a move is played. `now` is injectable for tests and future sync.

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

  if (timer) {
    timer.secondsRemaining += timer.secondsIncrement - elapsedSeconds
  }

  // Playing a move declines any pending draw offer.
  game.drawOffer = null
  game.activeColor = oppositeColor(game.activeColor)
  game.turnStartedAt = now
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
  endGame(game, {winner: oppositeColor(color), reason: 'timeout'})
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
function buildSan(piece: Piece, captured: Piece | null, from: SquareKey, to: SquareKey): string {
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
  const move: Move = {
    san: buildSan(piece, captured, from, to),
    color: piece.color,
    from,
    to,
    elapsedSeconds,
  }

  if (captured) {
    move.capture = {capturedPiece: captured}
  }

  return move
}
