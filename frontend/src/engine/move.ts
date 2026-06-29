import type {Board, SquareKey} from '@/types/chess'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// PLACEHOLDER: there are no chess rules yet — every move is allowed so the drag-and-drop
// feature can be exercised. Real validation (turns, legality, check…) replaces canMove later.

export function canMove(_board: Board, _from: SquareKey, _to: SquareKey): boolean {
  return true
}

// Applies a move in place. Overwriting the target square is how a capture happens.
export function applyMove(board: Board, from: SquareKey, to: SquareKey): void {
  const piece = board.squares[from].piece
  if (!piece) return
  board.squares[to].piece = piece
  board.squares[from].piece = null
  piece.hasMoved = true
}
