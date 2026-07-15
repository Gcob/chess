<template>
  <div
    class="c-piece"
    :class="[animationClass, {
      'c-piece--moving': moving || dragging,
      'c-piece--static': !piece.movable,
      'c-piece--popped': popped,
    }]"
    :style="style"
    @transitionstart="moving = true"
    @transitionend="moving = false"
    @transitioncancel="moving = false"
  >
    <img
      class="c-piece__img"
      :class="{ 'c-piece__img--lifted': lifted, 'c-piece__img--popped': popped }"
      :src="getPieceImage(piece.color, piece.type)"
      :alt="`${piece.color} ${piece.type}`"
      draggable="false"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import type {PieceAnimation, PlacedPiece} from '@/types/look-and-feel'
import {useChessTheme} from '@/composables/useChessTheme'

// A piece is a square-sized sprite placed in absolute board coordinates.
// The PlacedPiece DTO carries identity, sprite and grid cell already resolved for the board
// orientation — cPiece knows nothing about files/ranks or which way the board faces.
// Moving it = changing col/row; a CSS transition animates the slide.
// animation='none' makes the move instant (teleport) — used at mount and on rotation.
const props = withDefaults(defineProps<{
  piece: PlacedPiece
  animation: PieceAnimation
  // Following the cursor — overrides col/row and is always instant.
  dragging?: boolean
  // px translate within the board (top-left origin), used while dragging.
  dragX?: number
  dragY?: number
  // Touch drag: the sprite rides one square above the pointer so the finger never hides it.
  lifted?: boolean
  // Touch drag: this piece stands on the popped target square and grows with it.
  popped?: boolean
}>(), {
  dragging: false,
  dragX: 0,
  dragY: 0,
  lifted: false,
  popped: false,
})

const {getPieceImage} = useChessTheme()

// Raised above the other pieces while sliding, so it passes over them, not under.
const moving = ref(false)

// A dragged piece must follow the cursor instantly, so it never carries an animation.
const animationClass = computed(() =>
  props.dragging || props.animation === 'none' ? '' : `c-piece--anim-${props.animation}`,
)

// While dragging, follow the cursor in px. Otherwise rest on a grid cell:
// % in translate is relative to the element's own size, and the element is one square
// wide (12.5% of the board), so col * 100% lands exactly on column `col`.
const style = computed(() => ({
  transform: props.dragging
    ? `translate(${props.dragX}px, ${props.dragY}px)`
    : `translate(${props.piece.col * 100}%, ${props.piece.row * 100}%)`,
}))
</script>

<style lang="scss">
.c-piece {
  position: absolute;
  top: 0;
  left: 0;
  // one square
  width: 12.5%;
  height: 12.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  // grabbable; the overlay itself stays click-through
  pointer-events: auto;
  // let the pointer drag instead of scrolling on touch
  touch-action: none;
  cursor: grab;
  will-change: transform;

  // Straight-line translate — covers linear AND diagonal moves identically.
  // hop shares the travel and adds the sprite arc below.
  &--anim-slide,
  &--anim-hop {
    transition: transform 0.2s ease;
  }

  // A refused drop slides home with a hint of overshoot — reads as « refusé ».
  &--anim-snap-back {
    transition: transform 0.22s cubic-bezier(0.2, 0.85, 0.3, 1.15);
  }

  // The knight's arc: while the piece slides (--moving), the sprite rises and falls on top of
  // the straight travel. Gated by --moving, so the keyframe never replays on idle re-renders.
  &--anim-hop.c-piece--moving .c-piece__img {
    animation: c-piece-hop 0.2s ease;
  }

  // Per-piece stacking over the popped touch target (its tile overlay sits at z-index 2,
  // above the resting pieces): the piece standing on the target rides above its tile, and
  // the dragged/sliding piece stays above everything.
  &--popped {
    z-index: 3;
  }

  &--moving {
    // above the resting pieces — and the popped tile — for the duration of the slide/drag
    z-index: 4;
    cursor: grabbing;
  }

  &--static {
    cursor: default;
    // let the pointer fall through to the square below — a tap on an opponent piece must still
    // reach cSquare's click-to-move logic (capture of a selected piece's target)
    pointer-events: none;
  }

  // No base transition on the sprite: entering a state animates only if that state carries
  // its own transition, and LEAVING any state is always instant — the popped grow/shrink
  // stays in lockstep with its tile, and a played drop or a flip never replays the lift at
  // the new cell (upward jump + animated descent = bounce).
  &__img {
    width: 85%;
    height: 85%;
    object-fit: contain;
    user-select: none;
  }

  // The piece standing on the popped touch target grows with its tile (inset -30% ≈ ×1.6),
  // instantly both ways — like the tile itself.
  &__img--popped {
    transform: scale(1.6);
  }

  // One square above the finger (the sprite is 85% of the square, so one square is
  // 100% / 0.85 of its own height) and doubled — a thumb-sized piece is unreadable.
  // Declared after --popped (the dragged piece always keeps its lift); only the glide UP
  // eases — see the sprite transition note above.
  &__img--lifted {
    transform: translateY(calc(-100% / 0.85)) scale(2);
    transition: transform 0.15s ease-out;
  }
}

@keyframes c-piece-hop {
  50% {
    transform: translateY(-14%) scale(1.06);
  }
}
</style>
