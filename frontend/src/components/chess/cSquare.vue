<template>
  <div class="c-square" :style="{ background: squareBackground }">
    <img
      v-if="square.piece"
      class="c-square__piece"
      :src="getPieceImage(square.piece.color, square.piece.type)"
      :alt="`${square.piece.color} ${square.piece.type}`"
      draggable="false"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {Square} from '@/types/chess'
import {useChessTheme} from '@/composables/useChessTheme'

const props = defineProps<{ square: Square }>()

const {boardTheme, getPieceImage} = useChessTheme()

const squareBackground = computed(() =>
  props.square.color === 'light' ? boardTheme.value?.lightSquare : boardTheme.value?.darkSquare,
)
</script>

<style lang="scss">
.c-square {
  // fills its grid cell exactly — size is driven by cBoard
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &__piece {
    // percentage of the square so it scales with the board
    width: 85%;
    height: 85%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }
}
</style>
