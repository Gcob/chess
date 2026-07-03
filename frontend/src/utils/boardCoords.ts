import type {PieceColor, SquareFile, SquareKey} from '@/types/chess'

// View-layer coordinate math: maps chess squares to 0-based grid cells for a given
// board orientation, and back. Pure functions — shared by the board renderer and the
// drag interaction so the two stay exact inverses of each other.

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// 0-based grid cell: col 0 = leftmost column, row 0 = top row.
export interface GridCoords {
  col: number
  row: number
}

// Square → grid cell. orientation is the color sitting at the bottom.
export function squareToCoords(square: SquareKey, orientation: PieceColor): GridCoords {
  const fileIndex = FILES.indexOf(square[0] as SquareFile)
  const rank = Number(square[1])
  return orientation === 'white'
    ? {col: fileIndex, row: 8 - rank}
    : {col: 7 - fileIndex, row: rank - 1}
}

// Grid cell → square; null when outside the 8×8 grid (e.g. dropped off-board).
export function coordsToSquare(col: number, row: number, orientation: PieceColor): SquareKey | null {
  if (col < 0 || col > 7 || row < 0 || row > 7) {
    return null
  }

  const fileIndex = orientation === 'white' ? col : 7 - col
  const rank = orientation === 'white' ? 8 - row : row + 1
  return `${FILES[fileIndex]}${rank}` as SquareKey
}
