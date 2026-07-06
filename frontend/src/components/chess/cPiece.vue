<template>
  <div
    class="c-piece"
    :class="[animationClass, { 'c-piece--moving': moving || dragging, 'c-piece--static': !piece.movable }]"
    :style="style"
    @transitionstart="moving = true"
    @transitionend="moving = false"
    @transitioncancel="moving = false"
  >
    <img
      class="c-piece__img"
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
}>(), {
  dragging: false,
  dragX: 0,
  dragY: 0,
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
  &--anim-slide {
    transition: transform 0.2s ease;
  }

  // DORMANT: defined so the vocabulary is complete, not routed to yet.
  // hop → knight arc (will need @keyframes once the engine reports move types);
  // snap-back → return after an illegal drop. Both fall back to a plain slide for now.
  &--anim-hop,
  &--anim-snap-back {
    transition: transform 0.2s ease;
  }

  &--moving {
    // above the resting pieces for the duration of the slide/drag
    z-index: 1;
    cursor: grabbing;
  }

  &--static {
    cursor: default;
    // let the pointer fall through to the square below — a tap on an opponent piece must still
    // reach cSquare's click-to-move logic (capture of a selected piece's target)
    pointer-events: none;
  }

  &__img {
    width: 85%;
    height: 85%;
    object-fit: contain;
    user-select: none;
  }
}
</style>
