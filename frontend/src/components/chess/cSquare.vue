<template>
  <div class="c-square" :style="{ background: squareBackground }">
    <div
      v-for="highlight in highlights"
      :key="overlayKey(highlight)"
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
  // Cache-busting key for the hint overlays — cBoard passes the engaged piece's square.
  hintsKey?: string
}>(), {
  highlights: () => [],
  hintsKey: '',
})

const {boardTheme} = useChessTheme()

// Hints replay their pop-in when the engaged piece changes: keying them by hintsKey recreates
// the overlay, restarting the CSS animation even on a square that stays a legal destination.
// The veils (last-move, check…) keep a stable key — nothing to replay.
function overlayKey(highlight: SquareHighlight): string {
  return highlight.startsWith('legal-') ? `${highlight}-${props.hintsKey}` : highlight
}

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
    // They pop in with a quick fade + scale — the overlay div is born with the hint, so the
    // animation plays on mount and never touches the other highlights.
    &--legal-move,
    &--legal-capture {
      animation: c-square-hint-in 0.1s ease-out;
    }

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

@keyframes c-square-hint-in {
  from {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
</style>
