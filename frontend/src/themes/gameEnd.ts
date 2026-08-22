// One emoji per way a game can end — pure view vocabulary, next to the avatar glyphs.
// The domain only knows GameEndReason; nothing here ever reaches the Game DTO.

import type {GameEndReason} from '@/types/chess'

export const GAME_END_EMOJI: Record<GameEndReason, string> = {
  'checkmate': '⚔️',
  'resignation': '🏳️',
  'timeout': '⏱️',
  'draw-agreement': '🤝',
  // The king is frozen, not attacked — ice says "stuck" without saying "beaten".
  'stalemate': '🧊',
  'fifty-move-rule': '🐌',
  'threefold-repetition': '🔁',
  'insufficient-material': '🪶',
}
