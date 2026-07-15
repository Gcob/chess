import type { PieceColor, PieceType, SquareKey } from './chess'

// ─── Theme enums ─────────────────────────────────────────────────────────────

export enum BoardThemes {
  Wood = 'wood',
}

export enum PieceThemes {
  Classic = 'classic',
}

// ─── Primitives ──────────────────────────────────────────────────────────────

export type ImageFormat = 'svg' | 'png'

// Transient visual states a square can show, as translucent overlays. Pure UI —
// kept out of the domain Square (which stays a pure game-state node). Several can
// apply at once and stack. New states = add a value here, a colour, and a source.
// legal-move / legal-capture are shapes (dot / ring), not veils — legal destination hints.
// drop-target-touch is the touch variant of drop-target: an oversized ring readable around a thumb.
export type SquareHighlight =
  | 'drop-target' | 'drop-target-touch' | 'last-move' | 'selected' | 'check' | 'legal-move' | 'legal-capture'

// Board display size — a per-viewer preference. 'full' fills the available height; the others
// are fixed steps. Mapped to concrete pixels by the board area.
export type BoardSize = 'small' | 'normal' | 'large' | 'full'

// How a piece animates when it changes cell. Pure view vocabulary — the engine never
// knows about it; the render layer decides which one applies to a given move.
//   slide     — straight-line translate (covers both linear and diagonal moves)
//   none      — instant (board mount, rotation)
//   hop       — arc for the knight; DORMANT until the rules engine reports move types
//   snap-back — return after an illegal drop; DORMANT until move validation exists
export type PieceAnimation = 'slide' | 'none' | 'hop' | 'snap-back'

// A piece resolved to render coordinates for the current orientation — the flat projection
// cBoard hands to each cPiece as a single DTO prop.
export interface PlacedPiece {
  id: string
  color: PieceColor
  type: PieceType
  square: SquareKey
  // 0-based grid cell: col 0 = leftmost column, row 0 = top row
  col: number
  row: number
  // false = the piece ignores the pointer (opponent piece, game over)
  movable: boolean
}

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
