import type {PieceColor, PieceType} from '@/types/chess'

export interface CapturedPiece {
  color: PieceColor
  type: PieceType
}

export interface CapturedByColor {
  white: CapturedPiece[]
  black: CapturedPiece[]
}

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
}

// HARDCODED placeholder — will be derived from the board once capture tracking exists.
// Keyed by capturing color: the pieces are the opponent's, taken by that player.
export function getCapturedPieces(): CapturedByColor {
  return {
    white: [
      {color: 'black', type: 'pawn'},
      {color: 'black', type: 'pawn'},
      {color: 'black', type: 'knight'},
    ],
    black: [
      {color: 'white', type: 'pawn'},
      {color: 'white', type: 'bishop'},
    ],
  }
}

function materialValue(pieces: CapturedPiece[]): number {
  return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0)
}

// Net material advantage for `color`: positive = ahead, negative = behind, 0 = even.
export function materialDiff(captured: CapturedByColor, color: PieceColor): number {
  const opponent = color === 'white' ? 'black' : 'white'
  return materialValue(captured[color]) - materialValue(captured[opponent])
}
