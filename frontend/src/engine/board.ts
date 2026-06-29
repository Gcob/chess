import type {Board, BoardPiece, SquareKey} from '@/types/chess'

// ─── Pure board logic ──────────────────────────────────────────────────────────
// Vue-agnostic: plain data in, plain data out. Any code (components, tests,
// future AI/backend) can use this without importing Vue.

// Flattens the board into the list of occupied squares.
// The board stays the single source of truth — this is a derived view, not state.
export function getBoardPieces(board: Board): BoardPiece[] {
  const pieces: BoardPiece[] = []
  for (const [square, {piece}] of Object.entries(board.squares) as [SquareKey, Board['squares'][SquareKey]][]) {
    if (piece) pieces.push({piece, square})
  }
  return pieces
}
