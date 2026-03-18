import type { Board, CreateGamePayload, GameSession, GameTime, GameType, Player, Timer } from '@/types/chess'
import type { NewGameSettings } from '@/stores/useNewGameStore'

// ─── Public API ──────────────────────────────────────────────────────────────

// Maps form settings to a backend-ready payload.
// This is the single source of truth for what gets sent to the backend.
export function toBackendPayload(settings: NewGameSettings): CreateGamePayload {
  return {
    mode: settings.mode,
    players: {
      white: { name: settings.playerWhiteName },
      black: { name: settings.playerBlackName },
    },
    time: settings.timerEnabled
      ? { minutes: settings.timerMinutes, increment: settings.timerIncrement }
      : undefined,
  }
}

// Creates a self-contained GameSession from a payload and a store-assigned id.
// When the backend is wired up, the id will come from the backend response instead.
export function createGameSession(payload: CreateGamePayload, id: number): GameSession {
  const { time } = payload

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

// ─── Internals ───────────────────────────────────────────────────────────────

function buildPlayers(payload: CreateGamePayload): [Player, Player] {
  return [
    { name: payload.players.white.name, elo: 0, image: '', color: 'white', isInCheck: false },
    { name: payload.players.black.name, elo: 0, image: '', color: 'black', isInCheck: false },
  ]
}

function buildTimer(time: GameTime): Timer {
  return {
    isActive: false,
    currentTime: time.minutes * 60,
    increment: time.increment,
  }
}

// Classic time control thresholds (in seconds)
function resolveGameType(time?: GameTime): GameType {
  if (!time) return { name: 'Untimed', minTime: 0, maxTime: 0 }
  const total = time.minutes * 60
  if (total < 180)  return { name: 'Bullet',     minTime: 0,    maxTime: 179  }
  if (total < 600)  return { name: 'Blitz',      minTime: 180,  maxTime: 599  }
  if (total < 3600) return { name: 'Rapid',      minTime: 600,  maxTime: 3599 }
  return               { name: 'Classical',  minTime: 3600, maxTime: Infinity }
}

// TODO: implement full board initialization when tackling the pieces layer
function createInitialBoard(): Board {
  return { squares: [] }
}
