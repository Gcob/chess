<template>
  <div class="c-board-frame">
    <div class="c-board-frame__files c-board-frame__files--top">
      <span
        v-for="file in fileLabels"
        :key="`ft-${file}`"
        :class="{ 'c-board-frame__label--active': file === highlightFile }"
      >{{ file }}</span>
    </div>
    <div class="c-board-frame__ranks c-board-frame__ranks--left">
      <span
        v-for="rank in rankLabels"
        :key="`rl-${rank}`"
        :class="{ 'c-board-frame__label--active': rank === highlightRank }"
      >{{ rank }}</span>
    </div>

    <div class="c-board-frame__board">
      <slot />
    </div>

    <div class="c-board-frame__ranks c-board-frame__ranks--right">
      <span
        v-for="rank in rankLabels"
        :key="`rr-${rank}`"
        :class="{ 'c-board-frame__label--active': rank === highlightRank }"
      >{{ rank }}</span>
    </div>
    <div class="c-board-frame__files c-board-frame__files--bottom">
      <span
        v-for="file in fileLabels"
        :key="`fb-${file}`"
        :class="{ 'c-board-frame__label--active': file === highlightFile }"
      >{{ file }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {PieceColor, SquareFile, SquareRank} from '@/types/chess'

// Coordinate frame around a board. Purely presentational: it wraps the board (slot) and shows
// files/ranks on all four sides, ordered to match the orientation. Highlighting a hovered
// file/rank is the consumer's call — it just passes which ones are active.
const props = withDefaults(defineProps<{
  orientation: PieceColor
  highlightFile?: SquareFile | null
  highlightRank?: SquareRank | null
}>(), {
  highlightFile: null,
  highlightRank: null,
})

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [1, 2, 3, 4, 5, 6, 7, 8]

// Left→right and top→bottom order, mirroring the board grid for the current orientation.
const fileLabels = computed(() => (props.orientation === 'white' ? FILES : [...FILES].reverse()))
const rankLabels = computed(() => (props.orientation === 'white' ? [...RANKS].reverse() : RANKS))
</script>

<style lang="scss">
.c-board-frame {
  // coordinate gutters on all four sides; the board fills the middle cell
  --coord: 1.15rem;
  display: grid;
  grid-template-columns: var(--coord) auto var(--coord);
  grid-template-rows: var(--coord) auto var(--coord);
  grid-template-areas:
    '.    top    .'
    'left board  right'
    '.    bottom .';
  padding: $spacing-1;
  background: var(--bg-secondary);
  border: $border-width-base solid var(--border-color);
  border-radius: $border-radius-base;
  box-shadow: $shadow-xl;

  &__files,
  &__ranks {
    display: grid;
    place-items: center;
    font-size: 0.68rem;
    font-weight: $font-weight-semibold;
    line-height: 1;
    color: var(--text-muted);
    user-select: none;
  }

  &__files {
    grid-template-columns: repeat(8, 1fr);

    &--top {
      grid-area: top;
    }

    &--bottom {
      grid-area: bottom;
    }
  }

  &__ranks {
    grid-template-rows: repeat(8, 1fr);

    &--left {
      grid-area: left;
    }

    &--right {
      grid-area: right;
    }
  }

  &__files span,
  &__ranks span {
    transition: color $transition-fast;
  }

  // matches the hovered column/row — accent-hover adapts per theme (darker on light,
  // lighter on dark) for a readable contrast; bold makes it pop next to the muted labels.
  &__label--active {
    color: var(--accent-hover);
    font-weight: $font-weight-bold;
  }

  &__board {
    grid-area: board;
  }
}
</style>
