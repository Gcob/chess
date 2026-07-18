<template>
  <div
    class="c-piece"
    :class="[animationClass, {
      'c-piece--moving': moving || dragging,
      'c-piece--static': !piece.movable,
      'c-piece--popped': popped,
    }]"
    @touchstart.prevent
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
// touchstart.prevent kills the native long-press recognizer (context menu + haptic) on
// Android; the drag is pointer-based, so no touch default is ever needed.
const props = withDefaults(defineProps<{
  piece: PlacedPiece
  animation: PieceAnimation
  // Following the cursor — overrides col/row and is always instant.
  dragging?: boolean
  // px translate within the board (top-left origin), used while dragging.
  dragX?: number
  dragY?: number
  // Touch drag: the sprite grows from its bottom-left corner, up-right out of the thumb's shadow.
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
  // no long-press callout (iOS save-image sheet and its haptic) nor selection on touch
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
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

  // Touch grab: the drag stays centered — the finger aims the square under it (the popped
  // drop target) — and the sprite doubles from its bottom-left corner, nudged further
  // up-right out of the thumb's shadow, with a slight playful tilt (« dans les airs »).
  // The translate is in the sprite's own (unscaled) size. Declared after --popped (the
  // dragged piece always keeps its growth); only the grow-in eases — see the sprite
  // transition note above.
  // The shadow renders before the transform, so its offsets are doubled on screen by the
  // scale — keep the values half of the intended look.
  &__img--lifted {
    transform: translate(0%, -100%) scale(2.25) rotate(10deg);
    transform-origin: bottom left;
    filter: drop-shadow(8px 12px 2px rgba(0, 0, 0, 0.35));
    transition: transform 0.15s ease-out, filter 0.15s ease-out;
    // The float rides on the INDIVIDUAL translate/rotate properties, which compose with the
    // pose above — the loop never interrupts the grow-in transition. Symmetric keyframes
    // (0% = 100%, ease-in-out both ways) make the infinite loop seamless.
    animation: c-piece-float 1.6s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

// A gentle airborne bob with a hint of pendulum sway (the origin sits at the pose's
// bottom-left corner). Values are pre-scale, like the pose's.
@keyframes c-piece-float {
  0%, 100% {
    translate: 0 0;
    rotate: -.5deg;
    scale: 1;
  }

  50% {
    translate: 0 -1%;
    rotate: .5deg;
    scale: 1.01;
  }
}

@keyframes c-piece-hop {
  50% {
    transform: translateY(-14%) scale(1.06);
  }
}
</style>
