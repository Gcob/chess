import type { PieceTheme } from '@/types/look-and-feel'

// Served from public/ — paths are relative to the domain root
const BASE = '/themes/pieces/classic/board'

export const classicPieceTheme: PieceTheme = {
  id: 'classic',
  name: 'Classic',
  format: 'svg',
  images: {
    board: {
      white: {
        king:   `${BASE}/wK.svg`,
        queen:  `${BASE}/wQ.svg`,
        rook:   `${BASE}/wR.svg`,
        bishop: `${BASE}/wB.svg`,
        knight: `${BASE}/wN.svg`,
        pawn:   `${BASE}/wP.svg`,
      },
      black: {
        king:   `${BASE}/bK.svg`,
        queen:  `${BASE}/bQ.svg`,
        rook:   `${BASE}/bR.svg`,
        bishop: `${BASE}/bB.svg`,
        knight: `${BASE}/bN.svg`,
        pawn:   `${BASE}/bP.svg`,
      },
    },
  },
}
