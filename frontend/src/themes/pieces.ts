import type {ImageFormat, PieceImageSet, PieceTheme} from '@/types/look-and-feel'
import {PieceThemes} from '@/types/look-and-feel'

// Assets are served from public/. Naming follows Lichess: {w|b}{K|Q|R|B|N|P}.{format}.
function pieceSet(base: string, format: ImageFormat): PieceImageSet {
  const url = (color: 'w' | 'b', piece: string) => `${base}/${color}${piece}.${format}`
  const side = (color: 'w' | 'b') => ({
    king: url(color, 'K'),
    queen: url(color, 'Q'),
    rook: url(color, 'R'),
    bishop: url(color, 'B'),
    knight: url(color, 'N'),
    pawn: url(color, 'P'),
  })
  return {white: side('w'), black: side('b')}
}

export const pieceThemes: Record<string, PieceTheme> = {
  [PieceThemes.Classic]: {
    id: PieceThemes.Classic,
    name: 'Classic',
    format: 'svg',
    images: {
      board: pieceSet('/themes/pieces/classic/board', 'svg'),
    },
  },
}
