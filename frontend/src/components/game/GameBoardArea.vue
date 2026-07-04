<template>
  <div ref="areaRef" class="game-board-area">
    <cBoard
      v-if="view.game && boardSizePx > 0"
      :board="view.game.board"
      :orientation="view.orientation"
      :size="boardSizePx"
      @move="view.move"
    />
  </div>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import cBoard from '@/components/chess/cBoard.vue'
import type {GameView} from '@/composables/useGameView'

defineProps<{ view: GameView }>()

// Size the board to fit its zone (largest square that fits) so it never overflows → no page scroll.
// Measured from the container, not derived from the board, so there is no feedback loop.
// TODO: fold in view.boardSize (small/normal/large/full) with BoardSizeControl.
const areaRef = ref<HTMLElement | null>(null)
const boardSizePx = ref(0)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!areaRef.value) {
    return
  }

  observer = new ResizeObserver(entries => {
    const entry = entries[0]
    if (!entry) {
      return
    }

    const {width, height} = entry.contentRect
    boardSizePx.value = Math.floor(Math.min(width, height))
  })
  observer.observe(areaRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style lang="scss" scoped>
.game-board-area {
  // Fills the box the layout gives it (now definite in both layouts) and centers the board.
  // Padding gives the board room to breathe inside its zone.
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  padding: $spacing-6;
}
</style>
