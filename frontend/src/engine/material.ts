import type {Board, Game, PieceColor, PieceType} from '@/types/chess'
import {getBoardPieces} from './board'

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

// Dead position: no sequence of legal moves can ever produce a checkmate — an automatic draw.
// Aligned with chess.js for the future differential oracle: king vs king, one lone minor, or
// bishops only (any count, either side) all roaming the same square colour — such bishops can
// never even check a king standing on the other colour. The classic bishop PAIR mates because
// it spans both colours, so it never matches here.
export function hasInsufficientMaterial(board: Board): boolean {
  const pieces = getBoardPieces(board).filter(({piece}) => piece.type !== 'king')
  if (pieces.some(({piece}) => piece.type === 'pawn' || piece.type === 'rook' || piece.type === 'queen')) {
    return false
  }

  // Only minors remain: none, or a single one, can't mate anybody.
  if (pieces.length <= 1) {
    return true
  }

  // Several minors: only the all-bishops-on-one-colour case stays dead — any knight in the
  // mix (or bishops on both colours) leaves a helpmate possible.
  if (pieces.some(({piece}) => piece.type === 'knight')) {
    return false
  }

  const squareColors = new Set(pieces.map(({square}) => board.squares[square].color))
  return squareColors.size === 1
}

function materialValue(pieces: CapturedPiece[]): number {
  return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0)
}

// Net material advantage for `color`: positive = ahead, negative = behind, 0 = even.
export function materialDiff(captured: CapturedByColor, color: PieceColor): number {
  const opponent = color === 'white' ? 'black' : 'white'
  return materialValue(captured[color]) - materialValue(captured[opponent])
}
