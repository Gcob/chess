import type { PieceTheme } from '@/types/look-and-feel'

// File naming convention: {w|b}{K|Q|R|B|N|P}.svg
// wK = white king, bP = black pawn, etc.
const BASE = '/src/assets/themes/pieces/classic'

export const classicPieceTheme: PieceTheme = {
  id: 'classic',
  name: 'Classic',
  format: 'svg',
  images: {
    board: {
      white: {
        king:   `${BASE}/board/wK.svg`,
        queen:  `${BASE}/board/wQ.svg`,
        rook:   `${BASE}/board/wR.svg`,
        bishop: `${BASE}/board/wB.svg`,
        knight: `${BASE}/board/wN.svg`,
        pawn:   `${BASE}/board/wP.svg`,
      },
      black: {
        king:   `${BASE}/board/bK.svg`,
        queen:  `${BASE}/board/bQ.svg`,
        rook:   `${BASE}/board/bR.svg`,
        bishop: `${BASE}/board/bB.svg`,
        knight: `${BASE}/board/bN.svg`,
        pawn:   `${BASE}/board/bP.svg`,
      },
    },
    // small variant for captures & move notation
    // uncomment and populate when small assets are available
    // small: { white: { ... }, black: { ... } },
  },
}
