<template>
  <div
    class="c-piece"
    :class="{ 'c-piece--animated': animated && !dragging, 'c-piece--moving': moving || dragging }"
    :style="style"
    @transitionstart="moving = true"
    @transitionend="moving = false"
    @transitioncancel="moving = false"
  >
    <img
      class="c-piece__img"
      :src="getPieceImage(color, type)"
      :alt="`${color} ${type}`"
      draggable="false"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import type {PieceColor, PieceType} from '@/types/chess'
import {useChessTheme} from '@/composables/useChessTheme'

// A piece is a square-sized sprite placed in absolute board coordinates.
// col/row are 0-based grid indices already resolved for the board orientation —
// cPiece knows nothing about files/ranks or which way the board faces.
// Moving it = changing col/row; the CSS transition animates the slide.
// animated=false makes the move instant (teleport) — used when the board mounts.
const props = withDefaults(defineProps<{
  col: number          // 0 = leftmost column, 7 = rightmost
  row: number          // 0 = top row, 7 = bottom row
  color: PieceColor
  type: PieceType
  animated: boolean
  dragging?: boolean   // following the cursor — overrides col/row, no transition
  dragX?: number       // px translate within the board (top-left origin), used while dragging
  dragY?: number
}>(), {
  dragging: false,
  dragX: 0,
  dragY: 0,
})

const {getPieceImage} = useChessTheme()

// Raised above the other pieces while sliding, so it passes over them, not under.
const moving = ref(false)

// While dragging, follow the cursor in px. Otherwise rest on a grid cell:
// % in translate is relative to the element's own size, and the element is one square
// wide (12.5% of the board), so col * 100% lands exactly on column `col`.
const style = computed(() => ({
  transform: props.dragging
    ? `translate(${props.dragX}px, ${props.dragY}px)`
    : `translate(${props.col * 100}%, ${props.row * 100}%)`,
}))
</script>

<style lang="scss">
.c-piece {
  position: absolute;
  top: 0;
  left: 0;
  width: 12.5%;   // one square
  height: 12.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;  // grabbable; the overlay itself stays click-through
  touch-action: none;    // let the pointer drag instead of scrolling on touch
  cursor: grab;
  will-change: transform;

  &--animated {
    transition: transform 0.2s ease;
  }

  &--moving {
    z-index: 1;        // above the resting pieces for the duration of the slide/drag
    cursor: grabbing;
  }

  &__img {
    width: 85%;
    height: 85%;
    object-fit: contain;
    user-select: none;
  }
}
</style>
