<template>
  <div class="c-board">
    <cSquare
      v-for="square in orderedSquares"
      :key="`${square.file}${square.rank}`"
      :square="square"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { Board, SquareFile, SquareRank } from '@/types/chess'
import cSquare from './cSquare.vue'

const props = defineProps<{ board: Board }>()

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [8, 7, 6, 5, 4, 3, 2, 1] // top → bottom (white perspective)

const orderedSquares = computed(() =>
  RANKS.flatMap(rank => FILES.map(file => props.board.squares[`${file}${rank}`])),
)
</script>

<style lang="scss" scoped>
.c-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  width: min(80vmin, 640px);
  aspect-ratio: 1;
  border-radius: $border-radius-sm;
  overflow: hidden;
  box-shadow: $shadow-xl;
}
</style>
