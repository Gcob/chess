<template>
  <div class="c-board" :style="boardStyle">
    <cSquare
      v-for="square in orderedSquares"
      :key="`${square.file}${square.rank}`"
      :square="square"
    />

    <div class="c-board__pieces">
      <cPiece
        v-for="p in placedPieces"
        :key="p.id"
        :col="p.col"
        :row="p.row"
        :color="p.color"
        :type="p.type"
        :animated="animated"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, ref} from 'vue'
import type {Board, PieceColor, SquareFile, SquareKey, SquareRank} from '@/types/chess'
import {getBoardPieces} from '@/engine/board'
import cSquare from './cSquare.vue'
import cPiece from './cPiece.vue'

const props = defineProps<{
  board: Board
  size?: number            // px — controls everything inside via the grid
  orientation?: PieceColor // which color sits at the bottom; defaults to white
}>()

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [1, 2, 3, 4, 5, 6, 7, 8]

const orientation = computed<PieceColor>(() => props.orientation ?? 'white')

// Rows go top → bottom, columns left → right, both flipped for a black-down board.
const orderedSquares = computed(() => {
  const ranks = orientation.value === 'white' ? [...RANKS].reverse() : RANKS
  const files = orientation.value === 'white' ? FILES : [...FILES].reverse()
  return ranks.flatMap(rank => files.map(file => props.board.squares[`${file}${rank}`]))
})

// Each board piece resolved to 0-based grid coordinates for the current orientation.
// coordsFor must mirror orderedSquares so the overlay lines up with the rendered grid.
//
// Sorted by id so the v-for keeps a STABLE DOM order regardless of board position.
// A move then only patches a piece's transform — if the DOM node were reordered instead,
// the browser would reset the in-flight CSS transition and the piece would teleport.
const placedPieces = computed(() =>
  getBoardPieces(props.board)
    .map(({piece, square}) => ({
      id: piece.id,
      color: piece.color,
      type: piece.type,
      ...coordsFor(square),
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
)

function coordsFor(square: SquareKey): { col: number; row: number } {
  const fileIndex = FILES.indexOf(square[0] as SquareFile)
  const rank = Number(square[1])
  return orientation.value === 'white'
    ? {col: fileIndex, row: 8 - rank}
    : {col: 7 - fileIndex, row: rank - 1}
}

// Pieces teleport into place on mount, then animate on subsequent moves.
const animated = ref(false)
onMounted(() => nextTick(() => {
  animated.value = true
}))

const boardStyle = computed(() => {
  const px = `${props.size ?? 560}px`
  return {width: px, height: px}
})
</script>

<style lang="scss">
.c-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  flex-shrink: 0;
  border-radius: $border-radius-sm;
  overflow: hidden;
  box-shadow: $shadow-xl;

  &__pieces {
    // overlay covering the whole grid; individual pieces position themselves
    position: absolute;
    inset: 0;
    pointer-events: none; // squares below stay clickable; drag arrives in phase 2
  }
}
</style>
