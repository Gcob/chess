import type {BoardTheme} from '@/types/look-and-feel'
import {BoardThemes} from '@/types/look-and-feel'

export const boardThemes: Record<string, BoardTheme> = {
  [BoardThemes.Wood]: {
    id: BoardThemes.Wood,
    name: 'Wood',
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
  },
}
