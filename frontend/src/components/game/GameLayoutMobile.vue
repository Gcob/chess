<template>
  <div class="game-mobile">
    <GameInfo :view="view" />
    <PlayersPanel :view="view" />

    <div class="game-mobile__board">
      <GameBoardArea :view="view" />
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

  // full-width square board; the page may scroll on mobile (that's fine)
  &__board {
    display: flex;
    width: 100%;
    aspect-ratio: 1;
    min-height: 0;
  }
}
</style>
