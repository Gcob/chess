import {computed} from 'vue'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {pieceThemes} from '@/assets/themes/pieces'
import {boardThemes} from '@/assets/themes/boards'
import type {PieceColor, PieceType} from '@/types/chess'

type PieceImageSize = 'board' | 'small'

const FALLBACK_PIECE_THEME_ID = 'classic'
const FALLBACK_BOARD_THEME_ID = 'green'

export function useChessTheme() {
  const {settings} = storeToRefs(useSettingsStore())

  const pieceTheme = computed(
    () => pieceThemes[settings.value.pieceThemeId] ?? pieceThemes[FALLBACK_PIECE_THEME_ID],
  )

  const boardTheme = computed(
    () => boardThemes[settings.value.boardThemeId] ?? boardThemes[FALLBACK_BOARD_THEME_ID],
  )

  // Single entry point for piece images — handles small → board fallback internally.
  // No component should ever reimplement this fallback.
  function getPieceImage(color: PieceColor, type: PieceType, size: PieceImageSize = 'board'): string {
    const theme = pieceTheme.value

    if (!theme) {
      throw new Error('Piece theme not found')
    }

    if (size === 'small' && theme.images.small) {
      return theme.images.small[color][type]
    }
    return theme.images.board[color][type]
  }

  return {
    pieceTheme,
    boardTheme,
    getPieceImage,
  }
}
