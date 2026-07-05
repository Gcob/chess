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

  // Full-width board; height follows content (the board is square, but its coordinate frame
  // adds a bit more — forcing aspect-ratio:1 here would clip it). The page may scroll (that's fine).
  &__board {
    display: flex;
    width: 100%;
  }
}
</style>
