import type {SquareKey} from '@/types/chess'

// ─── Dev scenarios ──────────────────────────────────────────────────────────────
// QA seed positions for the dev game mode: each scenario is a replayed move list — never a
// piece dump — so every seeded position is reachable and legal by construction (the moves go
// through the real engine). The scenarios spec replays each one; a typo screams in CI, not
// during a QA session.

export interface DevScenario {
  id: string
  name: string
  description: string
  moves: Array<[SquareKey, SquareKey]>
}

export const DEV_SCENARIOS: DevScenario[] = [
  {
    id: 'promotion-ready',
    name: 'Promotion ready',
    description: 'White pawn on b7 — capture a8 or c8 to promote.',
    moves: [
      ['e2', 'e4'], ['d7', 'd5'],
      ['e4', 'd5'], ['c7', 'c6'],
      ['d5', 'c6'], ['g8', 'f6'],
      ['c6', 'b7'], ['g7', 'g6'],
      ['g1', 'f3'], ['b8', 'c6']
    ],
  },
  {
    id: 'en-passant-ready',
    name: 'En passant ready',
    description: 'White pawn on e5 — play d7-d5 (or f7-f5), then capture en passant.',
    moves: [
      ['e2', 'e4'], ['a7', 'a6'],
      ['e4', 'e5'],
    ],
  },
  {
    id: 'castling-king-side',
    name: 'Castling — king side',
    description: 'Both king sides cleared — castle right away.',
    moves: [
      ['g1', 'f3'], ['g8', 'f6'],
      ['e2', 'e3'], ['e7', 'e6'],
      ['f1', 'e2'], ['f8', 'e7'],
    ],
  },
  {
    id: 'castling-queen-side',
    name: 'Castling — queen side',
    description: 'Both queen sides cleared — castle long right away.',
    moves: [
      ['d2', 'd4'], ['d7', 'd5'],
      ['c1', 'f4'], ['c8', 'f5'],
      ['b1', 'c3'], ['b8', 'c6'],
      ['d1', 'd2'], ['d8', 'd7'],
    ],
  },
]
