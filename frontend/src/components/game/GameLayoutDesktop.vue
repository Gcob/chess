<template>
  <div ref="layoutRef" class="game-desktop">
    <div class="game-desktop__board" :style="{ width: `${boardBox}px`, height: `${boardBox}px` }">
      <GameBoardArea :view="view" />
    </div>

    <aside ref="sidebarRef" class="game-desktop__sidebar">
      <!-- Placeholders — filled section by section in the next steps. -->
      <div class="game-desktop__zone">Identités (à venir)</div>
      <div class="game-desktop__zone game-desktop__zone--sponge">Historique (à venir)</div>
      <div class="game-desktop__zone">Actions (à venir)</div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import GameBoardArea from '@/components/game/GameBoardArea.vue'
import type {GameView} from '@/composables/useGameView'

defineProps<{ view: GameView }>()

// The board is the largest square fitting BOTH the available height and the width left after the
// sidebar — so it shrinks on narrow windows AND sits right next to the sidebar (group centered).
const layoutRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)
const boardBox = ref(0)
let observer: ResizeObserver | null = null

function recompute() {
  const layout = layoutRef.value
  if (!layout) {
    return
  }

  const gap = parseFloat(getComputedStyle(layout).columnGap) || 0
  const sidebarWidth = sidebarRef.value?.offsetWidth ?? 0
  const availableWidth = layout.clientWidth - sidebarWidth - gap
  boardBox.value = Math.floor(Math.max(0, Math.min(layout.clientHeight, availableWidth)))
}

onMounted(() => {
  observer = new ResizeObserver(recompute)
  if (layoutRef.value) {
    observer.observe(layoutRef.value)
  }

  recompute()
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style lang="scss" scoped>
.game-desktop {
  display: flex;
  justify-content: center;
  gap: $spacing-4;
  flex: 1;
  min-height: 0;
  width: 100%;

  // Sized in JS to min(height, remaining width) → shrinks on narrow windows, stays next to the sidebar.
  // align-self center keeps it vertically centered when width-limited (sidebar still stretches full height).
  &__board {
    flex-shrink: 0;
    align-self: center;
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
