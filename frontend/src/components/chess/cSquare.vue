<template>
  <div class="c-square" :style="{ background: squareBackground }">
    <div
      v-for="highlight in highlights"
      :key="overlayKey(highlight)"
      class="c-square__highlight"
      :class="[`c-square__highlight--${highlight}`, {'c-square__highlight--popped': isHintPopped(highlight)}]"
      :style="highlight === 'drop-target-touch' ? {background: squareBackground} : undefined"
    />
    <!-- purely visual echo of the coordinates — never announced during a drag -->
    <span v-if="showCode" class="c-square__drag-label" aria-hidden="true">{{ square.file }}{{ square.rank }}</span>
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
  // Touch drag: pins this square's code above the popped target tile.
  showCode?: boolean
}>(), {
  highlights: () => [],
  hintsKey: '',
  showCode: false,
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

// A hint sitting on the popped touch target grows with the tile and rides above it —
// otherwise the enlarged tile would hide the dot/ring it pops for.
function isHintPopped(highlight: SquareHighlight): boolean {
  return highlight.startsWith('legal-') && props.highlights.includes('drop-target-touch')
}
</script>

<style lang="scss">
.c-square {
  // fills its grid cell exactly — size is driven by cBoard
  position: relative;
  width: 100%;
  height: 100%;
  // sizes the drag label in container units (cqw)
  container-type: size;

  &__highlight {
    position: absolute;
    inset: 0;
    // never blocks clicks/drops
    pointer-events: none;
    // veils follow the rounding of the corner cells (0 everywhere else)
    border-radius: inherit;

    &--drop-target {
      background: $square-highlight-drop-target;
    }

    // Touch drag target: the destination square itself pops out of the board — an enlarged
    // copy in the square's own colour (inline background, mobile keyboard key-preview style),
    // floating on a shadow for a slight 3D lift. z-index 2 floats it above the RESTING pieces
    // too (a neighbour piece over the raised tile would break the illusion); the piece on the
    // target (z 3) and the dragged piece (z 4) re-elevate themselves — see cPiece.
    &--drop-target-touch {
      inset: -30%;
      z-index: 2;
      border-radius: 12%;
      // elevation tuned for the textured board — the generic $shadow-* are too faint here
      box-shadow: 0 6px 14px rgba(2, 6, 23, 0.35), 0 2px 4px rgba(2, 6, 23, 0.25);
    }

    // Hints on the popped target: same bounds and plane as the tile, painted after it in the
    // DOM, so the dot/ring shows on top of the enlarged square.
    &--popped {
      inset: -30%;
      z-index: 2;
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
        $square-highlight-legal 0 30%, transparent 30%);
    }

    &--legal-capture {
      background: radial-gradient(circle closest-side,
        transparent 0 76%, $square-highlight-legal 77% 97%, transparent 98%);
    }
  }

  // The destination code pinned above the popped tile during a touch drag — a discreet dark
  // pill, clear of the lifted sprite (whose top reaches ~35% above this square).
  &__drag-label {
    position: absolute;
    bottom: 140%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    padding: 3cqw 10cqw;
    font-size: 34cqw;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.75);
    border-radius: 10cqw;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }
}

@keyframes c-square-hint-in {
  from {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
</style>
