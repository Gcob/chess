import {describe, it, expect} from 'vitest'
import {Chess} from 'chess.js'
import {makeMove} from './game'
import {legalDestinations} from './move'
import {getBoardPieces} from './board'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload, Game, SquareKey} from '@/types/chess'

// ─── Differential oracle ───────────────────────────────────────────────────────
// chess.js (devDependency ONLY — never shipped) plays referee: seeded random games are
// driven through OUR engine, mirrored into chess.js, and every position is compared piece
// by piece. Our specs remain the contract of OUR design; the oracle sweeps the positions
// nobody thinks to hand-write.
//
// Phase ④ gaps, excluded on purpose until those moves exist:
// - castling / en passant: chess.js moves carrying the k/q/e flags are filtered out
// - promotion: pawn pushes to the last rank are never played (the engines would diverge —
//   we keep a pawn, chess.js requires a piece choice)

const T0 = 1_700_000_000_000
const GAMES = 20
const MAX_PLIES = 80

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

// Deterministic PRNG — a failure replays identically from its seed.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Every [from, to] our engine allows for the side to move.
function ourMoves(game: Game): Array<[SquareKey, SquareKey]> {
  return getBoardPieces(game.board)
    .filter(({piece}) => piece.color === game.activeColor)
    .flatMap(({square}) => legalDestinations(game.board, square).map(to => [square, to] as [SquareKey, SquareKey]))
}

function isPromotionPush(game: Game, from: SquareKey, to: SquareKey): boolean {
  return game.board.squares[from].piece?.type === 'pawn' && (to[1] === '8' || to[1] === '1')
}

// Piece-by-piece comparison of the side to move, plus the check state.
function comparePosition(game: Game, oracle: Chess, context: string): void {
  const oracleMoves = oracle.moves({verbose: true}).filter(m => !/[kqe]/.test(m.flags))
  for (const {piece, square} of getBoardPieces(game.board)) {
    if (piece.color !== game.activeColor) {
      continue
    }

    const ours = [...new Set(legalDestinations(game.board, square))].sort()
    const theirs = [...new Set(oracleMoves.filter(m => m.from === square).map(m => m.to))].sort()
    expect(ours, `legal destinations of ${square} diverge — ${context}`).toEqual(theirs)
  }

  expect(game.players[game.activeColor].isInCheck, `check state diverges — ${context}`)
    .toBe(oracle.inCheck())
}

// Our automatic ending must be one chess.js recognizes on the same position.
function compareEnding(game: Game, oracle: Chess, context: string): void {
  const reason = game.result?.reason
  if (reason === 'checkmate') {
    expect(oracle.isCheckmate(), `we call mate, chess.js disagrees — ${context}`).toBe(true)
  } else if (reason === 'stalemate') {
    expect(oracle.isStalemate(), `we call stalemate, chess.js disagrees — ${context}`).toBe(true)
  } else if (reason === 'insufficient-material') {
    expect(oracle.isInsufficientMaterial(), `we call dead material, chess.js disagrees — ${context}`).toBe(true)
  } else if (reason === 'fifty-move-rule') {
    expect(oracle.isDraw(), `we call the fifty-move draw, chess.js disagrees — ${context}`).toBe(true)
  }
}

function playRandomGame(seed: number): void {
  const game = createGameSession(payload, 'oracle').game
  const oracle = new Chess()
  const rand = mulberry32(seed)
  const played: string[] = []

  for (let ply = 0; ply < MAX_PLIES; ply++) {
    const context = `seed ${seed}, after [${played.join(' ')}]`
    comparePosition(game, oracle, context)
    if (game.status === 'finished') {
      compareEnding(game, oracle, context)
      return
    }

    const candidates = ourMoves(game).filter(([from, to]) => !isPromotionPush(game, from, to))
    if (candidates.length === 0) {
      return // only promotion pushes left — phase ④ territory, stop here
    }

    const [from, to] = candidates[Math.floor(rand() * candidates.length)]!
    makeMove(game, from, to, T0)
    expect(game.moves.length, `our engine refused its own legal move ${from}-${to} — ${context}`)
      .toBe(played.length + 1)
    // Mirroring throws if chess.js disagrees the move is legal.
    expect(() => oracle.move({from, to}), `${from}-${to} legal for us, not for chess.js — ${context}`)
      .not.toThrow()
    played.push(`${from}${to}`)
  }
}

describe('engine vs chess.js — differential oracle', () => {
  for (let seed = 1; seed <= GAMES; seed++) {
    it(`agrees on every position of random game #${seed}`, () => {
      playRandomGame(seed)
    })
  }
})
