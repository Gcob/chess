<template>
  <div class="game-desktop">
    <GameBoardArea class="game-desktop__board" :view="view" />

    <aside class="game-desktop__sidebar">
      <!-- Placeholders — filled section by section in the next steps. -->
      <div class="game-desktop__zone">Identités (à venir)</div>
      <div class="game-desktop__zone game-desktop__zone--sponge">Historique (à venir)</div>
      <div class="game-desktop__zone">Actions (à venir)</div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import GameBoardArea from '@/components/game/GameBoardArea.vue'
import type {GameView} from '@/composables/useGameView'

defineProps<{ view: GameView }>()
</script>

<style lang="scss" scoped>
.game-desktop {
  // gap + board padding = same 40px as the board's margins to the viewport edges
  // (#game-page padding $spacing-4 + board area padding $spacing-6), so all sides feel even.
  display: flex;
  gap: $spacing-4;
  flex: 1;
  min-height: 0;
  width: 100%;

  &__board {
    flex: 1;
    min-width: 0;
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
    flex-shrink: 0;
    min-height: 0;
    width: 25rem;
  }

  &__zone {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-4;
    color: var(--text-muted);
    border: $border-width-thin dashed var(--border-color-strong);
    border-radius: $border-radius-base;

    // sponge — takes the remaining height and scrolls internally instead of growing the page
    &--sponge {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  }
}
</style>
