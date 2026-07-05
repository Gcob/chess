<template>
  <div class="game-mobile">
    <GameInfo :view="view" />
    <PlayersPanel :view="view" />

    <div class="game-mobile__board">
      <GameBoardArea :view="view" fit="width" />
    </div>

    <GameActions :view="view" />
  </div>
</template>

<script lang="ts" setup>
import GameBoardArea from '@/components/game/GameBoardArea.vue'
import PlayersPanel from '@/components/game/PlayersPanel.vue'
import GameInfo from '@/components/game/GameInfo.vue'
import GameActions from '@/components/game/GameActions.vue'
import type {GameView} from '@/composables/useGameView'

defineProps<{ view: GameView }>()
</script>

<style lang="scss" scoped>
.game-mobile {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
  width: 100%;
  // Grows into whatever leftover height #game-page has (mirrors #game-page's own growth against
  // #app-main) — never shrinks below its natural content height, so short content still scrolls
  // normally instead of being squeezed.
  flex: 1 0 auto;

  // The one section that consumes leftover height: it grows to fill the space left after the
  // other sections' natural size. GameBoardArea's own height:100% needs a definite containing
  // block to resolve, which a flex-grown height isn't always treated as — so centering is done
  // here too, on the outer box, as the mechanism that actually works. On short content there's
  // no leftover space, so this just settles at the board's own height like the others.
  &__board {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 1 0 auto;
    min-height: 0;
  }
}
</style>
