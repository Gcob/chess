<template>
  <div class="c-board" :style="boardStyle">
    <cSquare
      v-for="square in orderedSquares"
      :key="`${square.file}${square.rank}`"
      :square="square"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {Board, SquareFile, SquareRank} from '@/types/chess'
import cSquare from './cSquare.vue'

const props = defineProps<{
  board: Board
  size?: number // px — controls everything inside via the grid
}>()

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [8, 7, 6, 5, 4, 3, 2, 1] // top → bottom (white perspective)

const orderedSquares = computed(() =>
  RANKS.flatMap(rank => FILES.map(file => props.board.squares[`${file}${rank}`])),
)

const boardStyle = computed(() => {
  const px = `${props.size ?? 560}px`
  return {width: px, height: px}
})
</script>

<style lang="scss" >
.c-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  flex-shrink: 0;
  border-radius: $border-radius-sm;
  overflow: hidden;
  box-shadow: $shadow-xl;
}
</style>
