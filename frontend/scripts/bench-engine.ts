import {mkdirSync, writeFileSync} from 'node:fs'
import {createGameSession} from '@/composables/factories/gameFactory'
import {enPassantTarget, replayMoves} from '@/engine/game'
import {applyMove, hasAnyLegalMove, legalDestinations} from '@/engine/move'
import type {Board, Game, PieceColor, PieceType, SquareKey} from '@/types/chess'
import type {CreateGamePayload} from '@/types/chess'

const WARMUP = 1_000
const ITERATIONS = 5_000
const GAME_ITERATIONS = 200

// A local, untimed game — the neutral fixture every scenario is seeded from.
const BENCH_PAYLOAD: CreateGamePayload = {
  mode: 'local',
  players: {
    white: {name: 'White', avatar: ''},
    black: {name: 'Black', avatar: ''},
  },
}

interface Stat {
  label: string
  median: number
  p95: number
  iterations: number
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

// Nearest-rank percentile on an already-sorted ascending array.
function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[idx]!
}

function formatMs(ms: number): string {
  return `${ms.toFixed(ms < 0.1 ? 3 : 2)}ms`
}

// Warmup runs prime the JIT (untimed); then each iteration times fn() only — an optional setup
// (also untimed) refreshes mutable state between runs, e.g. a fresh board before a mutation.
function measure(
  label: string,
  fn: () => void,
  opts: {iterations?: number; setup?: () => void} = {},
): Stat {
  const iterations = opts.iterations ?? ITERATIONS
  for (let i = 0; i < WARMUP; i++) {
    opts.setup?.()
    fn()
  }

  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    opts.setup?.()
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }

  times.sort((a, b) => a - b)
  return {label, median: median(times), p95: percentile(times, 95), iterations}
}

// ─── Deterministic scenarios ─────────────────────────────────────────────────────
// Positions are reached by replaying coordinate move lists through the real engine — never a
// piece dump — so every seeded position is legal by construction.

type MoveList = Array<[SquareKey, SquareKey, PieceType?]>

// Active white queen on h5 after 1.e4 e5 2.Qh5 — open lines, a rich legalDestinations target.
const QUEEN_MOVES: MoveList = [['e2', 'e4'], ['e7', 'e5'], ['d1', 'h5']]

// Scholar's mate delivered: after 7 plies Black is checkmated — hasAnyLegalMove('black') must
// sweep every black piece before returning false (true worst case).
const MATE_MOVES: MoveList = [
  ['e2', 'e4'], ['e7', 'e5'],
  ['f1', 'c4'], ['b8', 'c6'],
  ['d1', 'h5'], ['g8', 'f6'],
  ['h5', 'f7'],
]

// The Opera Game (Morphy, 1858) — a real decisive game, no promotions, ending on 17.Rd8#.
// Its 33 plies drive the headline "full game" KPI through the real makeMove pipeline.
const OPERA_GAME: MoveList = [
  ['e2', 'e4'], ['e7', 'e5'],
  ['g1', 'f3'], ['d7', 'd6'],
  ['d2', 'd4'], ['c8', 'g4'],
  ['d4', 'e5'], ['g4', 'f3'],
  ['d1', 'f3'], ['d6', 'e5'],
  ['f1', 'c4'], ['g8', 'f6'],
  ['f3', 'b3'], ['d8', 'e7'],
  ['b1', 'c3'], ['c7', 'c6'],
  ['c1', 'g5'], ['b7', 'b5'],
  ['c3', 'b5'], ['c6', 'b5'],
  ['c4', 'b5'], ['b8', 'd7'],
  ['e1', 'c1'], ['a8', 'd8'],
  ['d1', 'd7'], ['d8', 'd7'],
  ['h1', 'd1'], ['e7', 'e6'],
  ['b5', 'd7'], ['f6', 'd7'],
  ['b3', 'b8'], ['d7', 'b8'],
  ['d1', 'd8'],
]

// Seeds a fresh game and replays a move list through the real engine, returning the reached
// position. replayMoves throws on any illegal move — a transcription typo screams here.
function positionAfter(moves: MoveList): Game {
  const {game} = createGameSession(BENCH_PAYLOAD, 'bench')
  replayMoves(game, moves)
  return game
}

// ─── Report ──────────────────────────────────────────────────────────────────────

function stamp(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}_${p(date.getMonth() + 1)}_${p(date.getDate())}-${p(date.getHours())}-${p(date.getMinutes())}`
}

function toRow(stat: Stat): string {
  const p95 = stat.p95 ? formatMs(stat.p95) : '—'
  return `| ${stat.label.padEnd(26)} | ${formatMs(stat.median).padStart(8)} | ${p95.padStart(8)} | ${String(stat.iterations).padStart(10)} |`
}

function main(): void {
  // Micro-benchmark positions (reached once, then queried in a hot loop).
  const queenPos = positionAfter(QUEEN_MOVES)
  const queenBoard = queenPos.board
  const queenEp = enPassantTarget(queenPos.moves)

  const matePos = positionAfter(MATE_MOVES)
  const mateBoard = matePos.board
  const mateEp = enPassantTarget(matePos.moves)

  // applyMove mutates: each iteration starts from a fresh clone (built in the untimed setup).
  const startBoard = createGameSession(BENCH_PAYLOAD, 'bench').game.board
  let mutableBoard: Board = startBoard

  // Headline: the full real per-move pipeline (makeMove) replayed on a fresh game each iteration.
  let gameFixture: Game
  const gameStat = measure('full game (33 plies)', () => replayMoves(gameFixture, OPERA_GAME), {
    iterations: GAME_ITERATIONS,
    setup: () => { gameFixture = createGameSession(BENCH_PAYLOAD, 'bench').game },
  })
  const perMove = gameStat.median / OPERA_GAME.length

  const stats: Stat[] = [
    measure('legalDestinations (queen)', () => legalDestinations(queenBoard, 'h5', queenEp)),
    measure('hasAnyLegalMove (alive)', () => hasAnyLegalMove(queenBoard, 'black' as PieceColor, queenEp)),
    measure('hasAnyLegalMove (mate)', () => hasAnyLegalMove(mateBoard, 'black' as PieceColor, mateEp)),
    measure('applyMove', () => applyMove(mutableBoard, 'e2', 'e4'), {
      setup: () => { mutableBoard = structuredClone(startBoard) },
    }),
  ]

  const now = new Date()
  const lines = [
    '# Engine Performance Baseline',
    '',
    `Generated: ${stamp(now)}`,
    `Node: ${process.version}`,
    '',
    '| Operation                  |   median |      p95 | iterations |',
    '|----------------------------|----------|----------|------------|',
    toRow(gameStat),
    `| ${'  └ per move (avg)'.padEnd(26)} | ${formatMs(perMove).padStart(8)} | ${'—'.padStart(8)} | ${''.padStart(10)} |`,
    ...stats.map(s => toRow(s)),
    '',
  ]

  mkdirSync('docs/perf', {recursive: true})
  const path = `docs/perf/engine-bench-${stamp(now)}.md`
  writeFileSync(path, lines.join('\n'))
  console.log(`Wrote ${path}`)
}

main()
