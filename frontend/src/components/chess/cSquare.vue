<template>
  <div class="c-square" :style="{ background: squareBackground }">
    <div
      v-for="highlight in highlights"
      :key="highlight"
      class="c-square__highlight"
      :class="`c-square__highlight--${highlight}`"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {Square} from '@/types/chess'
import type {SquareHighlight} from '@/types/look-and-feel'
import {useChessTheme} from '@/composables/useChessTheme'

// A square is the board background, a click/drop target, and a host for translucent
// highlight overlays. Pieces live in cBoard's absolute overlay so they can animate.
// Highlights are fixed to their cell, so they ride along on the square — no overlay layer.
const props = withDefaults(defineProps<{
  square: Square
  highlights?: SquareHighlight[]
}>(), {
  highlights: () => [],
})

const {boardTheme} = useChessTheme()

const squareBackground = computed(() =>
  props.square.color === 'light' ? boardTheme.value?.lightSquare : boardTheme.value?.darkSquare,
)
</script>

<style lang="scss">
.c-square {
  // fills its grid cell exactly — size is driven by cBoard
  position: relative;
  width: 100%;
  height: 100%;

  &__highlight {
    position: absolute;
    inset: 0;
    // never blocks clicks/drops
    pointer-events: none;

    &--drop-target {
      background: $square-highlight-drop-target;
    }

    &--last-move {
      background: $square-highlight-last-move;
    }

    &--selected {
      background: $square-highlight-selected;
    }

    &--check {
      background: $square-highlight-check;
    }

    // Legal destination hints are shapes, not veils, so they read over any square colour.
    // closest-side sizing keys the gradient to half the square, whatever the board size.
    &--legal-move {
      background: radial-gradient(circle closest-side,
        $square-highlight-legal 0 34%, transparent 35%);
    }

    &--legal-capture {
      background: radial-gradient(circle closest-side,
        transparent 0 76%, $square-highlight-legal 77% 97%, transparent 98%);
    }
  }
}
</style>
