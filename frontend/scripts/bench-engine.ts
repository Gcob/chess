import {mkdirSync, writeFileSync} from 'node:fs'
import {createGameSession} from '@/composables/factories/gameFactory'
import {Board as EngineBoard, getBoardPieces} from '@/engine/board'
import {enPassantTarget, oppositeColor, replayMoves} from '@/engine/game'
import {applyMove, hasAnyLegalMove, legalDestinations} from '@/engine/move'
import {MoveLegality} from '@/engine/moveLegality'
import {PIECE_DATA} from '@/engine/piece'
import type {Board, Game, Piece, PieceColor, PieceType, SquareKey} from '@/types/chess'
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

// ─── Perft (NPS) ───────────────────────────────────────────────────────────────
// Nodes-per-second via perft: enumerate every legal move, play it, recurse. The leaf count at a
// given depth is a universal constant — a mismatch means a legality bug, so perft doubles as the
// engine's correctness oracle. Uses only public engine entry points; recursion clones the board
// (the engine has no unmake), which is this engine's honest per-node cost.

interface PerftMove {
  from: SquareKey
  to: SquareKey
  promo: PieceType | null
}

const PROMO_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight']

// One shared Board per node answers every piece — mirrors hasAnyLegalMove. A promoting pawn move
// fans out into the four promotion choices, the way perft counts them.
function allLegalMoves(dto: Board, color: PieceColor, ep: SquareKey | null): PerftMove[] {
  const board = new EngineBoard(dto, ep)
  const moves: PerftMove[] = []
  for (const {piece, square} of getBoardPieces(dto)) {
    if (piece.color !== color) {
      continue
    }

    for (const dest of new MoveLegality(board, square).squares()) {
      const to = dest.key
      if (piece.type === 'pawn' && (to[1] === '8' || to[1] === '1')) {
        for (const promo of PROMO_PIECES) {
          moves.push({from: square, to, promo})
        }
      } else {
        moves.push({from: square, to, promo: null})
      }
    }
  }

  return moves
}

// The en passant target a move leaves behind: the square a double-pushed pawn skipped, else null.
function epAfter(dto: Board, from: SquareKey, to: SquareKey): SquareKey | null {
  if (dto.squares[from].piece?.type !== 'pawn' || Math.abs(Number(to[1]) - Number(from[1])) !== 2) {
    return null
  }

  return `${from[0]}${(Number(from[1]) + Number(to[1])) / 2}` as SquareKey
}

// Leaf count at `depth`. At depth 1 the moves ARE the leaves (no need to play them); deeper, each
// move is played on a fresh clone and recursed.
function perft(dto: Board, color: PieceColor, ep: SquareKey | null, depth: number): number {
  const moves = allLegalMoves(dto, color, ep)
  if (depth === 1) {
    return moves.length
  }

  let nodes = 0
  for (const move of moves) {
    const child = structuredClone(dto)
    const childEp = epAfter(dto, move.from, move.to)
    applyMove(child, move.from, move.to, move.promo)
    nodes += perft(child, oppositeColor(color), childEp, depth - 1)
  }

  return nodes
}

// ─── FEN fixtures ──────────────────────────────────────────────────────────────
// A hard-coded FEN loaded into a real board — enough FEN for perft, no general parser, no engine
// feature. Start from a fully-built board (its neighbor graph is position-independent), clear it,
// then place the FEN's pieces with hasMoved derived from the position and castling field.

const FEN_TYPES: Record<string, PieceType> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
}

// hasMoved drives castling rights and pawn double-advance. A pawn is unmoved on its home rank; a
// king/rook is unmoved when the matching castling letter sits on its standard square.
function hasMovedFromFen(type: PieceType, color: PieceColor, key: SquareKey, castling: string): boolean {
  if (type === 'pawn') {
    return key[1] !== (color === 'white' ? '2' : '7')
  }

  if (type === 'king') {
    const rights = color === 'white' ? 'KQ' : 'kq'
    const home = color === 'white' ? 'e1' : 'e8'
    return !(key === home && [...rights].some(c => castling.includes(c)))
  }

  if (type === 'rook') {
    const corner: Record<string, string> = {K: 'h1', Q: 'a1', k: 'h8', q: 'a8'}
    return !Object.entries(corner).some(([c, sq]) => sq === key && castling.includes(c))
  }

  return true
}

function fenPiece(ch: string, key: SquareKey, castling: string): Piece {
  const color: PieceColor = ch === ch.toUpperCase() ? 'white' : 'black'
  const type = FEN_TYPES[ch.toLowerCase()]!
  const {value, short, long} = PIECE_DATA[type]
  return {
    id: `${short}${key}`,
    color,
    type,
    value,
    textRepresentation: {short, long},
    hasMoved: hasMovedFromFen(type, color, key, castling),
  }
}

function boardFromFen(fen: string): {board: Board; color: PieceColor; ep: SquareKey | null} {
  const [placement, active, castling, epField] = fen.split(' ')
  const board = createGameSession(BENCH_PAYLOAD, 'bench').game.board
  for (const key of Object.keys(board.squares) as SquareKey[]) {
    board.squares[key].piece = null
  }

  const files = 'abcdefgh'
  const rows = placement!.split('/') // rank 8 first
  for (let r = 0; r < 8; r++) {
    const rank = 8 - r
    let file = 0
    for (const ch of rows[r]!) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch)
        continue
      }

      const key = `${files[file]}${rank}` as SquareKey
      board.squares[key].piece = fenPiece(ch, key, castling!)
      file++
    }
  }

  return {board, color: active === 'w' ? 'white' : 'black', ep: epField && epField !== '-' ? epField as SquareKey : null}
}

// ─── Perft runs ──────────────────────────────────────────────────────────────────
// Known leaf counts (index = depth). A divergence localizes the first buggy depth.
const START_PERFT = [0, 20, 400, 8_902, 197_281]
const KIWIPETE_FEN = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'
const KIWIPETE_PERFT = [0, 48, 2_039, 97_862, 4_085_603]
const PERFT_DEPTH = 4

interface PerftResult {
  label: string
  lines: string[]
}

function runPerft(label: string, dto: Board, color: PieceColor, ep: SquareKey | null, expected: number[]): PerftResult {
  console.log(`Running perft: ${label} (to depth ${PERFT_DEPTH})…`)
  const lines: string[] = []

  // Shallow depths validate cheaply and pinpoint the first divergence.
  for (let d = 1; d < PERFT_DEPTH; d++) {
    const got = perft(structuredClone(dto), color, ep, d)
    const ok = got === expected[d]
    lines.push(`- ${label} perft(${d}) = ${got.toLocaleString('en-US')} ${ok ? '✓' : `✗ (attendu ${expected[d]!.toLocaleString('en-US')})`}`)
  }

  // The target depth is the NPS run — timed once.
  const start = performance.now()
  const nodes = perft(structuredClone(dto), color, ep, PERFT_DEPTH)
  const seconds = (performance.now() - start) / 1000
  const ok = nodes === expected[PERFT_DEPTH]
  const nps = Math.round(nodes / seconds)
  lines.push(
    `- **${label} perft(${PERFT_DEPTH}) = ${nodes.toLocaleString('en-US')} ${ok ? '✓' : `✗ (attendu ${expected[PERFT_DEPTH]!.toLocaleString('en-US')})`}** — ` +
    `${seconds.toFixed(2)}s → **${nps.toLocaleString('en-US')} nps**`,
  )

  return {label, lines}
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

  // Perft / NPS — the headline engine-strength metric, with a built-in correctness check.
  const startPerft = runPerft('Position de départ', startBoard, 'white', null, START_PERFT)
  const kiwipete = boardFromFen(KIWIPETE_FEN)
  const kiwiPerft = runPerft('Kiwipete', kiwipete.board, kiwipete.color, kiwipete.ep, KIWIPETE_PERFT)

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
    '## Perft (NPS)',
    '',
    ...startPerft.lines,
    '',
    ...kiwiPerft.lines,
    '',
  ]

  mkdirSync('docs/perf', {recursive: true})
  const path = `docs/perf/engine-bench-${stamp(now)}.md`
  writeFileSync(path, lines.join('\n'))
  console.log(`Wrote ${path}`)
}

main()
