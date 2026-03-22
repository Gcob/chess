import type {
  Board,
  CreateGamePayload,
  GameSession,
  GameTime,
  GameType, Player,
  Piece,
  PieceColor,
  PieceType,
  Square,
  SquareColor,
  SquareFile,
  SquareKey,
  SquareRank,
  Timer,
} from '@/types/chess'
import type {NewGameSettings} from '@/stores/useNewGameStore'

// ─── Public API ──────────────────────────────────────────────────────────────

// Maps form settings to a backend-ready payload.
// This is the single source of truth for what gets sent to the backend.
export function toBackendPayload(settings: NewGameSettings): CreateGamePayload {
  return {
    mode: settings.mode,
    players: {
      white: {name: settings.playerWhiteName},
      black: {name: settings.playerBlackName},
    },
    time: settings.timerEnabled
      ? {minutes: settings.timerMinutes, secondsIncrement: settings.timerIncrement}
      : undefined,
  }
}

// Creates a self-contained GameSession from a payload and a store-assigned id.
// When the backend is wired up, the id will come from the backend response instead.
export function createGameSession(payload: CreateGamePayload, id: number): GameSession {
  const {time} = payload

  return {
    id,
    game: {
      createdAt: new Date(),
      startedAt: new Date(),
      status: 'waiting',
      mode: payload.mode,
      activeColor: 'white',
      time,
      type: resolveGameType(time),
      players: buildPlayers(payload),
      timers: time ? [buildTimer(time), buildTimer(time)] : undefined,
      board: createInitialBoard(),
      moves: [],
    },
  }
}

// ─── Board initialization ─────────────────────────────────────────────────────

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [1, 2, 3, 4, 5, 6, 7, 8]

// Standard starting position — [color, type] per square key
const INITIAL_SETUP: Partial<Record<SquareKey, [PieceColor, PieceType]>> = {
  a1: ['white', 'rook'], b1: ['white', 'knight'], c1: ['white', 'bishop'], d1: ['white', 'queen'],
  e1: ['white', 'king'], f1: ['white', 'bishop'], g1: ['white', 'knight'], h1: ['white', 'rook'],
  a2: ['white', 'pawn'], b2: ['white', 'pawn'], c2: ['white', 'pawn'], d2: ['white', 'pawn'],
  e2: ['white', 'pawn'], f2: ['white', 'pawn'], g2: ['white', 'pawn'], h2: ['white', 'pawn'],
  a7: ['black', 'pawn'], b7: ['black', 'pawn'], c7: ['black', 'pawn'], d7: ['black', 'pawn'],
  e7: ['black', 'pawn'], f7: ['black', 'pawn'], g7: ['black', 'pawn'], h7: ['black', 'pawn'],
  a8: ['black', 'rook'], b8: ['black', 'knight'], c8: ['black', 'bishop'], d8: ['black', 'queen'],
  e8: ['black', 'king'], f8: ['black', 'bishop'], g8: ['black', 'knight'], h8: ['black', 'rook'],
}

function createInitialBoard(): Board {
  const squares = {} as Record<SquareKey, Square>

  // Pass 1: create all 64 squares with no neighbors yet
  for (const file of FILES) {
    for (const rank of RANKS) {
      const key: SquareKey = `${file}${rank}`
      squares[key] = {
        file,
        rank,
        color: resolveSquareColor(file, rank),
        piece: null,
        neighbors: {
          'top': null, 'top-right': null, 'right': null, 'bottom-right': null,
          'bottom': null, 'bottom-left': null, 'left': null, 'top-left': null,
        },
      }
    }
  }

  // Pass 2: link each square to its neighbors
  for (const file of FILES) {
    for (const rank of RANKS) {
      const fi = FILES.indexOf(file)
      const ri = RANKS.indexOf(rank)
      const square = squares[`${file}${rank}`]

      const n = (f: number, r: number): Square | null => {
        if (f < 0 || f >= 8 || r < 0 || r >= 8) return null
        const key = `${FILES[f]}${RANKS[r]}` as SquareKey
        return squares[key]
      }

      square.neighbors = {
        'top': n(fi, ri + 1),
        'top-right': n(fi + 1, ri + 1),
        'right': n(fi + 1, ri),
        'bottom-right': n(fi + 1, ri - 1),
        'bottom': n(fi, ri - 1),
        'bottom-left': n(fi - 1, ri - 1),
        'left': n(fi - 1, ri),
        'top-left': n(fi - 1, ri + 1),
      }
    }
  }

  // Pass 3: place pieces in their starting positions
  for (const [key, setup] of Object.entries(INITIAL_SETUP) as [SquareKey, [PieceColor, PieceType]][]) {
    squares[key].piece = buildPiece(setup[0], setup[1])
  }

  return {squares}
}

// a1 is dark — (fileIndex + rank) odd = dark, even = light
function resolveSquareColor(file: SquareFile, rank: SquareRank): SquareColor {
  return (FILES.indexOf(file) + rank) % 2 === 1 ? 'dark' : 'light'
}

// ─── Piece construction ───────────────────────────────────────────────────────

const PIECE_DATA: Record<PieceType, { value: number; short: string; long: string }> = {
  king: {value: 0, short: 'K', long: 'King'}, // 0 = sentinel, king cannot be captured
  queen: {value: 9, short: 'Q', long: 'Queen'},
  rook: {value: 5, short: 'R', long: 'Rook'},
  bishop: {value: 3, short: 'B', long: 'Bishop'},
  knight: {value: 3, short: 'N', long: 'Knight'},
  pawn: {value: 1, short: 'P', long: 'Pawn'},
}

function buildPiece(color: PieceColor, type: PieceType): Piece {
  const {value, short, long} = PIECE_DATA[type]
  return {
    color,
    type,
    value,
    textRepresentation: {short, long},
    pinAbsoluteDirection: null,
    hasMoved: false,
    moveTypes: [],                      // populated when implementing move logic
  }
}

// ─── Internals ───────────────────────────────────────────────────────────────

function buildPlayers(payload: CreateGamePayload): { white: Player; black: Player } {
  return {
    white: {color: 'white', isInCheck: false, metas: {name: payload.players.white.name}},
    black: {color: 'black', isInCheck: false, metas: {name: payload.players.black.name}},
  }
}

function buildTimer(time: GameTime): Timer {
  return {
    isActive: false,
    secondsRemaining: time.minutes * 60,
    secondsIncrement: time.secondsIncrement,
  }
}

// Classic time control thresholds (FIDE — in total seconds)
function resolveGameType(time?: GameTime): GameType {
  if (!time) return {name: 'Untimed', minSeconds: 0, maxSeconds: 0}
  const total = time.minutes * 60
  if (total < 180) return {name: 'Bullet', minSeconds: 0, maxSeconds: 179}
  if (total < 600) return {name: 'Blitz', minSeconds: 180, maxSeconds: 599}
  if (total < 3600) return {name: 'Rapid', minSeconds: 600, maxSeconds: 3599}
  return {name: 'Classical', minSeconds: 3600, maxSeconds: Infinity}
}
