<template>
  <div class="game-mobile">
    <!-- Placeholders — mobile arrangement refined in the next steps. -->
    <div class="game-mobile__zone">Identités (à venir)</div>

    <div class="game-mobile__board">
      <GameBoardArea :view="view" />
    </div>

    <div class="game-mobile__zone">Actions (à venir)</div>
  </div>
</template>

<script lang="ts" setup>
import GameBoardArea from '@/components/game/GameBoardArea.vue'
import type {GameView} from '@/composables/useGameView'

defineProps<{ view: GameView }>()
</script>

<style lang="scss" scoped>
.game-mobile {
  display: flex;
  flex-direction: column;
  gap: $spacing-5;
  width: 100%;

  // full-width square board; the page may scroll on mobile (that's fine)
  &__board {
    display: flex;
    width: 100%;
    aspect-ratio: 1;
    min-height: 0;
  }

  &__zone {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-4;
    color: var(--text-muted);
    border: $border-width-thin dashed var(--border-color-strong);
    border-radius: $border-radius-base;
  }
}
</style>
