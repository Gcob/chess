import type {Board, SquareKey} from '@/types/chess'

// Strips a standard board down to the listed squares — sparse-position specs (endings, dead
// material) read better than twenty played moves. Reposition survivors with applyMove, the
// specs' teleporter.
export function keepOnly(board: Board, keep: SquareKey[]): void {
  for (const [key, square] of Object.entries(board.squares)) {
    if (!keep.includes(key as SquareKey)) {
      square.piece = null
    }
  }
}
