<template>
  <div
    class="c-piece"
    :class="{ 'c-piece--animated': animated }"
    :style="style"
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
import {computed} from 'vue'
import type {PieceColor, PieceType} from '@/types/chess'
import {useChessTheme} from '@/composables/useChessTheme'

// A piece is a square-sized sprite placed in absolute board coordinates.
// col/row are 0-based grid indices already resolved for the board orientation —
// cPiece knows nothing about files/ranks or which way the board faces.
// Moving it = changing col/row; the CSS transition animates the slide.
// animated=false makes the move instant (teleport) — used when the board mounts.
const props = defineProps<{
  col: number          // 0 = leftmost column, 7 = rightmost
  row: number          // 0 = top row, 7 = bottom row
  color: PieceColor
  type: PieceType
  animated: boolean
}>()

const {getPieceImage} = useChessTheme()

// % in translate is relative to the element's own size; the element is one square
// wide (12.5% of the board), so col * 100% lands exactly on column `col`.
const style = computed(() => ({
  transform: `translate(${props.col * 100}%, ${props.row * 100}%)`,
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
  pointer-events: none; // drag handling comes in phase 2
  will-change: transform;

  &--animated {
    transition: transform 0.2s ease;
  }

  &__img {
    width: 85%;
    height: 85%;
    object-fit: contain;
    user-select: none;
  }
}
</style>
