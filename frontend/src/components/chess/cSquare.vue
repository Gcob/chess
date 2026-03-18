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
import { computed } from 'vue'
import type { Square } from '@/types/chess'
import { useChessTheme } from '@/composables/useChessTheme'

const props = defineProps<{ square: Square }>()

const { boardTheme, getPieceImage } = useChessTheme()

const squareBackground = computed(() =>
  props.square.color === 'light' ? boardTheme.value.lightSquare : boardTheme.value.darkSquare,
)
</script>

<style lang="scss" scoped>
.c-square {
  display: flex;
  align-items: center;
  justify-content: center;

  &__piece {
    width: 85%;
    height: 85%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }
}
</style>
