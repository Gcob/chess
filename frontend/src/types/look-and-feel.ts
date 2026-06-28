import type { PieceColor, PieceType } from './chess'

// ─── Primitives ──────────────────────────────────────────────────────────────

export type ImageFormat = 'svg' | 'png'

// All 12 piece images: 2 colors × 6 types
export type PieceImageSet = Record<PieceColor, Record<PieceType, string>>

// ─── Piece theme ─────────────────────────────────────────────────────────────

export interface PieceTheme {
  id: string
  name: string
  format: ImageFormat    // all images in this theme share the same format
  images: {
    board: PieceImageSet  // standard size — displayed on the board
    small?: PieceImageSet // compact size — captures & move notation
                          // falls back to board if absent
  }
}

// ─── Board theme ─────────────────────────────────────────────────────────────

export interface BoardTheme {
  id: string
  name: string
  lightSquare: string    // CSS background value: color, url(), gradient...
  darkSquare: string     // same — CSS drives everything, images handled via url()
}

// ─── useChessTheme contract (to implement) ───────────────────────────────────
//
// When useChessTheme() is created, it MUST expose a getPieceImage() helper:
//
//   const { getPieceImage } = useChessTheme()
//   getPieceImage(piece.color, piece.type, 'small') // → URL, fallback to 'board'
//
// The fallback logic (small → board) belongs in the composable, not in components.
// No component should ever reimplement this fallback itself.
