// ─── Primitives ──────────────────────────────────────────────────────────────

export type PieceColor = 'white' | 'black'
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type SquareColor = 'light' | 'dark'
export type SquareFile = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type SquareRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type SquareKey = `${SquareFile}${SquareRank}` // 'a1' | 'a2' | ... | 'h8' — all 64 squares
export type AccountStatus = 'active' | 'inactive' | 'banned'
export type GameStatus = 'waiting' | 'active' | 'finished'
// Full domain declared up front — the engine only produces the first three until auto endings land
export type GameEndReason =
  | 'resignation'
  | 'timeout'
  | 'draw-agreement'
  | 'checkmate'
  | 'stalemate'
  | 'fifty-move-rule'
  | 'threefold-repetition'
  | 'insufficient-material'
export type GameMode = 'local' | 'private-remote' | 'public-remote' | 'vs-bot'
export type Direction =
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'top-left'
export type CastlingSide = 'king-side' | 'queen-side'
export type MoveTypeId =
  | 'simple'
  | 'castling'
  | 'linear-forward'
  | 'linear-forward-double'
  | 'diagonal-forward-capture'
  | 'en-passant'
  | 'promotion'
  | 'diagonal'
  | 'linear'
  | 'l-shape'

// ─── Actors ──────────────────────────────────────────────────────────────────


// Create an InGamePlayer from an Account or AI
export interface Player {
  color: PieceColor
  isInCheck: boolean
  timer?: Timer
  metas: PlayerMetas
}

export interface PlayerMetas {
  name: string
  image?: string
  elo?: number
}

export interface Account extends PlayerMetas {
  email: string
  status: AccountStatus
}

export interface AI extends PlayerMetas {
  strategy: string
  description: string
}


// ─── Game setup ──────────────────────────────────────────────────────────────

export interface GameTime {
  minutes: number
  secondsIncrement: number
}

export interface GameType {
  name: string
  minSeconds: number | null
  maxSeconds: number | null
}

// Whether a clock is running is derived: status + activeColor + turnStartedAt.
// secondsRemaining is only settled when a move is played — display subtracts the elapsed turn time.
// Seconds are deliberately fractional (sub-second precision from ms timestamps); display rounds.
export interface Timer {
  secondsRemaining: number
  secondsIncrement: number
}

// ─── Board & pieces ──────────────────────────────────────────────────────────

export interface Piece {
  id: string                     // stable identity: short text + start square (e.g. 'Pe2', 'Ra1') — survives moves and promotion
  color: PieceColor
  type: PieceType
  value: number
  textRepresentation: {
    short: string // e.g. 'K', 'N'
    long: string  // e.g. 'King', 'Knight'
  }
  hasMoved: boolean              // required for castling rights and pawn double-advance eligibility
}

// Squares are nodes in a graph — each linked to up to 8 neighbors.
// A null neighbor means the square is at the board edge in that direction.
export interface Square {
  color: SquareColor
  file: SquareFile   // column: a–h
  rank: SquareRank   // row: 1–8
  piece: Piece | null
  neighbors: Record<Direction, Square | null> // Direction is an absolute direction; always from white's perspective
}

// Keyed by chess notation (e.g. 'e4') for O(1) lookup by position
export interface Board {
  squares: Record<SquareKey, Square>
}

// Flat projection of the board: a piece paired with the square it sits on.
// Used by the rendering layer to drive an absolute, animatable piece overlay.
export interface BoardPiece {
  piece: Piece
  square: SquareKey
}

// ─── Movement ────────────────────────────────────────────────────────────────

export interface Capture {
  capturedPiece: Piece
}

// Plain serializable data — SquareKeys instead of Square references (the board graph is circular).
// En passant context = the previous entry in Game.moves.
export interface Move {
  san: string // Standard Algebraic Notation — e.g. 'e4', 'Nf3', 'O-O', 'exd5', 'Qxh7#'
  color: PieceColor
  // What moved — the fifty-move clock and the full SAN (phase ⑤) both read it.
  pieceType: PieceType
  from: SquareKey
  to: SquareKey
  elapsedSeconds: number
  capture?: Capture
  castling?: CastlingSide // the rook's jump is derived from the side — never stored
}

// ─── Game ────────────────────────────────────────────────────────────────────

// winner null = draw
export interface GameResult {
  winner: PieceColor | null
  reason: GameEndReason
}

export interface Game {
  createdAt: Date
  startedAt: Date | null // null = not started
  status: GameStatus
  result: GameResult | null // set exactly when status becomes 'finished'
  mode: GameMode
  activeColor: PieceColor // whose turn it is — source of truth (aligns with FEN w/b)
  drawOffer: PieceColor | null // pending draw offer — playing a move declines it
  turnStartedAt: number | null // epoch ms — clock base; remaining time is computed, never ticked down
  time?: GameTime         // undefined = untimed game (local mode only)
  type: GameType
  players: { white: Player; black: Player }
  board: Board
  moves: Move[]
}

// ─── Session ─────────────────────────────────────────────────────────────────

// A self-contained, independent game instance managed by useGamesStore.
// id is a ULID — simulated on the frontend for local games, backend-assigned eventually.
export interface GameSession {
  id: string
  game: Game
}

// Payload sent to the backend to create a new game.
// Used by the factory as its primary input — ready for HTTP when the backend is wired up.
export interface CreateGamePayload {
  mode: GameMode
  players: {
    white: { name: string; avatar: string }
    black: { name: string; avatar: string }
  }
  time?: GameTime // undefined = untimed game
}
