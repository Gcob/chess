import type {
  Board,
  CreateGamePayload,
  GameSession,
  GameTime,
  GameType,
  Player,
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
      ? {minutes: settings.timerMinutes, increment: settings.timerIncrement}
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
      startedAt: new Date(),
      status: 'waiting',
      mode: payload.mode,
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
          'top': null,
          'top-right': null,
          'right': null,
          'bottom-right': null,
          'bottom': null,
          'bottom-left': null,
          'left': null,
          'top-left': null,
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

  return {squares}
}

// a1 is dark — (fileIndex + rank) odd = dark, even = light
function resolveSquareColor(file: SquareFile, rank: SquareRank): SquareColor {
  return (FILES.indexOf(file) + rank) % 2 === 1 ? 'dark' : 'light'
}

// ─── Internals ───────────────────────────────────────────────────────────────

function buildPlayers(payload: CreateGamePayload): [Player, Player] {
  return [
    {name: payload.players.white.name, elo: 0, image: '', color: 'white', isInCheck: false},
    {name: payload.players.black.name, elo: 0, image: '', color: 'black', isInCheck: false},
  ]
}

function buildTimer(time: GameTime): Timer {
  return {
    isActive: false,
    currentTime: time.minutes * 60,
    increment: time.increment,
  }
}

// Classic time control thresholds (FIDE — in total seconds)
function resolveGameType(time?: GameTime): GameType {
  if (!time) return {name: 'Untimed', minTime: 0, maxTime: 0}
  const total = time.minutes * 60
  if (total < 180) return {name: 'Bullet', minTime: 0, maxTime: 179}
  if (total < 600) return {name: 'Blitz', minTime: 180, maxTime: 599}
  if (total < 3600) return {name: 'Rapid', minTime: 600, maxTime: 3599}
  return {name: 'Classical', minTime: 3600, maxTime: Infinity}
}

