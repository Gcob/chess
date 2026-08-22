import type {PiecePlacement} from '@/composables/factories/gameFactory'
import type {SquareKey} from '@/types/chess'

// The positions behind the how-to-play diagrams. Data only: RuleDiagram feeds each one to the
// real engine, so what a reader sees is what the game actually allows. Kept in their own module
// so a spec can assert what every diagram teaches — a position that quietly stops demonstrating
// its rule (a piece moved, a king wandered into the line) fails the build instead of misleading.
//
// Every position carries BOTH kings: legality asks where the king stands, and a board without
// one is not a chess position.
export interface RuleDiagram {
  setup: PiecePlacement
  from?: SquareKey
  moves?: [SquareKey, SquareKey][]
  promoteTo?: 'queen' | 'rook' | 'bishop' | 'knight'
  enPassantTarget?: SquareKey
  threats?: SquareKey[]
  zone?: SquareKey[]
}

// Kings parked far from the action, so they never colour the answer.
const IDLE_KINGS: PiecePlacement = {h1: ['white', 'king'], a8: ['black', 'king']}

export const PIECE_DIAGRAMS: Record<string, RuleDiagram> = {
  king: {
    setup: {e4: ['white', 'king'], a8: ['black', 'king']},
    from: 'e4',
  },
  queen: {
    setup: {...IDLE_KINGS, d4: ['white', 'queen']},
    from: 'd4',
  },
  rook: {
    setup: {...IDLE_KINGS, d4: ['white', 'rook']},
    from: 'd4',
  },
  bishop: {
    setup: {...IDLE_KINGS, d4: ['white', 'bishop']},
    from: 'd4',
  },
  knight: {
    // The knight is the one piece that jumps: ringing it with its own pawns proves it.
    setup: {
      ...IDLE_KINGS,
      d4: ['white', 'knight'],
      c3: ['white', 'pawn'], d3: ['white', 'pawn'], e3: ['white', 'pawn'],
      c4: ['white', 'pawn'], e4: ['white', 'pawn'],
      c5: ['white', 'pawn'], d5: ['white', 'pawn'], e5: ['white', 'pawn'],
    },
    from: 'd4',
  },
  pawn: {
    // On its starting square (one or two forward) with an enemy to take diagonally.
    setup: {...IDLE_KINGS, e2: ['white', 'pawn'], f3: ['black', 'pawn']},
    from: 'e2',
  },
}

export const SPECIAL_DIAGRAMS: Record<string, RuleDiagram> = {
  castling: {
    setup: {e1: ['white', 'king'], h1: ['white', 'rook'], e8: ['black', 'king']},
    moves: [['e1', 'g1']],
  },
  enPassant: {
    // Black pushes two squares past the white pawn; white takes it as if it had pushed one.
    setup: {
      h1: ['white', 'king'], h8: ['black', 'king'],
      e5: ['white', 'pawn'], d7: ['black', 'pawn'],
    },
    moves: [['d7', 'd5'], ['e5', 'd6']],
  },
  promotion: {
    setup: {a1: ['white', 'king'], h4: ['black', 'king'], e7: ['white', 'pawn']},
    moves: [['e7', 'e8']],
    promoteTo: 'queen',
  },
}

export const TIP_DIAGRAMS: Record<string, RuleDiagram> = {
  // The absolute pin: the bishop on b4 aims through the knight straight at the king on e1, so
  // the knight has NOWHERE legal to go. The engine returns that empty list on its own — the red
  // line is only there to show the reader why.
  pin: {
    setup: {
      e1: ['white', 'king'], d2: ['white', 'knight'],
      b4: ['black', 'bishop'], e8: ['black', 'king'],
    },
    from: 'd2',
    threats: ['b4', 'c3', 'd2', 'e1'],
  },
  centre: {
    setup: {...IDLE_KINGS, e4: ['white', 'pawn'], d4: ['white', 'pawn']},
    zone: ['d4', 'd5', 'e4', 'e5'],
  },
}
