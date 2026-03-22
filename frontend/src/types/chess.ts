// ─── Primitives ──────────────────────────────────────────────────────────────

export type PieceColor = 'white' | 'black'
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type SquareColor = 'light' | 'dark'
export type SquareFile = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type SquareRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type SquareKey = `${SquareFile}${SquareRank}` // 'a1' | 'a2' | ... | 'h8' — all 64 squares
export type AccountStatus = 'active' | 'inactive' | 'banned'
export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished'
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

export interface Timer {
  isActive: boolean
  secondsRemaining: number
  secondsIncrement: number
}

// ─── Board & pieces ──────────────────────────────────────────────────────────

// conditions and effects are string identifiers — logic lives in composables
export interface MoveType {
  id: MoveTypeId
  conditions: string[]
  effects: string[]
}

export interface Piece {
  color: PieceColor
  type: PieceType
  value: number
  textRepresentation: {
    short: string // e.g. 'K', 'N'
    long: string  // e.g. 'King', 'Knight'
  }
  pinAbsoluteDirection: Direction | null // null = not pinned; direction = pinned from that direction
  hasMoved: boolean              // required for castling rights and pawn double-advance eligibility
  moveTypes: MoveType[]
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

// ─── Movement ────────────────────────────────────────────────────────────────

export interface Capture {
  capturedPiece: Piece
}

export interface Move {
  pgn: string // SAN — e.g. 'e4', 'Nf3', 'O-O', 'exd5', 'Qxh7#'
  elapsedSeconds: number
  fromSquare: Square
  toSquare: Square
  affectedPieces: Piece[]
  moveTypes: MoveType[]
  capture?: Capture
  previousMove?: Move // context required for en passant validation
}

// ─── Game ────────────────────────────────────────────────────────────────────

export interface Game {
  createdAt: Date
  startedAt: Date | null // null = not started
  status: GameStatus
  mode: GameMode
  activeColor: PieceColor // whose turn it is — source of truth (aligns with FEN w/b)
  time?: GameTime         // undefined = untimed game
  type: GameType
  players: { white: Player; black: Player }
  timers?: [Timer, Timer] // undefined = untimed game
  board: Board
  moves: Move[]
}

// ─── Session ─────────────────────────────────────────────────────────────────

// A self-contained, independent game instance managed by useGamesStore.
// id is a simple integer assigned by the store (eventually by the backend).
export interface GameSession {
  id: number
  game: Game
}

// Payload sent to the backend to create a new game.
// Used by the factory as its primary input — ready for HTTP when the backend is wired up.
export interface CreateGamePayload {
  mode: GameMode
  players: {
    white: { name: string }
    black: { name: string }
  }
  time?: GameTime // undefined = untimed game
}
