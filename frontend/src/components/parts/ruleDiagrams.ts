import {INITIAL_SETUP} from '@/composables/factories/gameFactory'
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

// A diagram shows ONE idea, so the positions carry nothing that is not part of it: no spare
// kings standing around to confuse a beginner. The engine answers legality on a kingless board
// just fine (see the spec) — it only looks for a king when a move could expose one.
export const PIECE_DIAGRAMS: Record<string, RuleDiagram> = {
  king: {
    setup: {e4: ['white', 'king']},
    from: 'e4',
  },
  queen: {
    setup: {d4: ['white', 'queen']},
    from: 'd4',
  },
  rook: {
    setup: {d4: ['white', 'rook']},
    from: 'd4',
  },
  bishop: {
    setup: {d4: ['white', 'bishop']},
    from: 'd4',
  },
  knight: {
    // The knight is the one piece that jumps: ringing it with its own pawns proves it.
    setup: {
      d4: ['white', 'knight'],
      c3: ['white', 'pawn'], d3: ['white', 'pawn'], e3: ['white', 'pawn'],
      c4: ['white', 'pawn'], e4: ['white', 'pawn'],
      c5: ['white', 'pawn'], d5: ['white', 'pawn'], e5: ['white', 'pawn'],
    },
    from: 'd4',
  },
  pawn: {
    // On its starting square (one or two forward) with an enemy to take diagonally.
    setup: {e2: ['white', 'pawn'], f3: ['black', 'pawn']},
    from: 'e2',
  },
}

// Check, and what it costs the king. The rook rakes the whole e-file, so the engine offers the
// king d1, d2, f1 and f2 — and pointedly NOT e2, which is still on the line. That absence is
// the lesson: fleeing along the line of attack is not an escape.
export const CHECK_DIAGRAM: RuleDiagram = {
  setup: {e1: ['white', 'king'], e8: ['black', 'rook']},
  from: 'e1',
  threats: ['e8', 'e7', 'e6', 'e5', 'e4', 'e3', 'e2'],
}

// The two endings a beginner keeps mixing up, plus the one that surprises everybody. In all
// three the engine, not the author, decides that the king has nowhere to go.
export const END_DIAGRAMS: Record<string, RuleDiagram> = {
  // Back-rank mate: the king is boxed in by its OWN pawns, and the rook sweeps the last rank.
  checkmate: {
    setup: {
      h8: ['black', 'king'], g7: ['black', 'pawn'], h7: ['black', 'pawn'],
      a8: ['white', 'rook'],
    },
    from: 'h8',
    threats: ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8'],
  },
  // Stalemate: every square around the king is covered, but the king itself is NOT attacked.
  // No legal move, no check — a draw, and a classic way to throw a won game away.
  stalemate: {
    setup: {a8: ['black', 'king'], c7: ['white', 'queen']},
    from: 'a8',
  },
  // King and bishop cannot force mate against a lone king, so the game stops there.
  insufficientMaterial: {
    setup: {a8: ['black', 'king'], c6: ['white', 'king'], f3: ['white', 'bishop']},
  },
}

export const SPECIAL_DIAGRAMS: Record<string, RuleDiagram> = {
  // Both castlings, because they do not look alike: the king travels two squares either way,
  // but the queen-side rook jumps three and lands on d1.
  castlingKingSide: {
    setup: {e1: ['white', 'king'], h1: ['white', 'rook']},
    moves: [['e1', 'g1']],
  },
  castlingQueenSide: {
    setup: {e1: ['white', 'king'], a1: ['white', 'rook']},
    moves: [['e1', 'c1']],
  },
  enPassant: {
    // Black pushes two squares past the white pawn; white takes it as if it had pushed one.
    setup: {e5: ['white', 'pawn'], d7: ['black', 'pawn']},
    moves: [['d7', 'd5'], ['e5', 'd6']],
  },
  promotion: {
    setup: {e7: ['white', 'pawn']},
    moves: [['e7', 'e8']],
    promoteTo: 'queen',
  },
}

export const TIP_DIAGRAMS: Record<string, RuleDiagram> = {
  // The blunder, played out: the knight steps onto a square a pawn already covers, and the pawn
  // simply takes it. Kept sparse on purpose — this is a principle, not an opening.
  blunder: {
    setup: {
      a1: ['white', 'king'], a8: ['black', 'king'],
      c3: ['white', 'knight'], e6: ['black', 'pawn'],
    },
    moves: [['c3', 'd5'], ['e6', 'd5']],
  },

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
  // A real opening, from the real starting position: white plants both centre pawns while black
  // pushes rook pawns that do nothing at all. The contrast IS the lesson.
  centre: {
    setup: INITIAL_SETUP,
    moves: [['e2', 'e4'], ['a7', 'a6'], ['d2', 'd4'], ['h7', 'h6']],
    zone: ['d4', 'd5', 'e4', 'e5'],
  },

  // Healthy development, in order: open a line for the bishop, knight out, bishop out — and the
  // squares those two vacate are exactly what makes the castling on move four legal.
  develop: {
    setup: INITIAL_SETUP,
    moves: [['e2', 'e4'], ['g1', 'f3'], ['f1', 'c4'], ['e1', 'g1']],
  },
}
