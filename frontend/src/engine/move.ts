import type {Board, SquareKey} from '@/types/chess'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// Rules are being filled in incrementally. Everything not yet checked (piece movement
// patterns, turns, check…) is still permitted — for now only the basics below apply.

export function canMove(board: Board, from: SquareKey, to: SquareKey): boolean {
  const piece = board.squares[from].piece
  if (!piece) {
    return false
  }

  if (from === to) {
    return false
  }

  // Can't capture your own piece.
  const target = board.squares[to].piece
  if (target && target.color === piece.color) {
    return false
  }

  return true
}

// Applies a move in place. Overwriting the target square is how a capture happens.
export function applyMove(board: Board, from: SquareKey, to: SquareKey): void {
  const piece = board.squares[from].piece
  if (!piece) {
    return
  }

  board.squares[to].piece = piece
  board.squares[from].piece = null
  piece.hasMoved = true
}
