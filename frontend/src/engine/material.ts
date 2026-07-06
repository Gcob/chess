import type {Game, PieceColor, PieceType} from '@/types/chess'

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

// Derived from the move history — moves are the source of truth, nothing is tracked separately.
// Keyed by capturing color: the pieces are the opponent's, taken by that player.
export function getCapturedPieces(game: Game): CapturedByColor {
  const captured: CapturedByColor = {white: [], black: []}
  for (const move of game.moves) {
    if (move.capture) {
      const piece = move.capture.capturedPiece
      captured[move.color].push({color: piece.color, type: piece.type})
    }
  }

  return captured
}

function materialValue(pieces: CapturedPiece[]): number {
  return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0)
}

// Net material advantage for `color`: positive = ahead, negative = behind, 0 = even.
export function materialDiff(captured: CapturedByColor, color: PieceColor): number {
  const opponent = color === 'white' ? 'black' : 'white'
  return materialValue(captured[color]) - materialValue(captured[opponent])
}
