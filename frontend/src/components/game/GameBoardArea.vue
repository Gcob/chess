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

const props = withDefaults(defineProps<{
  view: GameView
  // 'both' bounds the board by width AND height (desktop: fixed viewport-derived box).
  // 'width' bounds it by width alone — for layouts where height just follows content
  // (mobile: the frame's coordinate gutters add a bit more height than the board itself).
  fit?: 'both' | 'width'
}>(), {
  fit: 'both',
})

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
    boardSizePx.value = props.fit === 'width' ? Math.floor(width) : Math.floor(Math.min(width, height))
  })
  observer.observe(areaRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style lang="scss" scoped>
.game-board-area {
  // Fills the box the layout gives it (definite width always; definite height on desktop,
  // auto on mobile — see the `fit` prop) and centers the board. Padding gives it room to breathe.
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  padding: $spacing-6;

  // #game-page already has its own padding on mobile — no need to double it up here.
  @include breakpoint-down($breakpoint-lg) {
    padding: 0;
  }
}
</style>
