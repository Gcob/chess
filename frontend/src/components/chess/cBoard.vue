<template>
  <div class="c-board">
    <cBoardFrame :orientation="orientation" :highlight-file="hoveredFile" :highlight-rank="hoveredRank">
      <div
        ref="areaEl"
        class="c-board__area"
        :style="areaStyle"
        @contextmenu.prevent
        @mouseleave="hoveredSquare = null"
      >
        <div class="c-board__grid">
          <cSquare
            v-for="square in orderedSquares"
            :key="`${square.file}${square.rank}`"
            :square="square"
            :highlights="highlightsFor(`${square.file}${square.rank}`)"
            :hints-key="hintFrom ?? ''"
            :show-code="isTouch && dropTarget === `${square.file}${square.rank}`"
            @click="activateSquare(`${square.file}${square.rank}`)"
            @mouseenter="hoveredSquare = `${square.file}${square.rank}`"
          />
        </div>

        <!-- Piece overlay: not clipped, so a dragged piece can overflow the board edge. -->
        <div class="c-board__pieces">
          <cPiece
            v-for="p in placedPieces"
            :key="p.id"
            :piece="p"
            :animation="animationFor(p)"
            :dragging="draggingId === p.id"
            :drag-x="draggingId === p.id ? dragX : 0"
            :drag-y="draggingId === p.id ? dragY : 0"
            :lifted="draggingId === p.id && isTouch"
            :popped="isTouch && draggingId !== p.id && dropTarget === p.square"
            @pointerdown="onPiecePointerDown($event, p)"
            @mouseenter="hoveredSquare = p.square"
          />
        </div>
      </div>
    </cBoardFrame>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import type {Board, PieceColor, SquareFile, SquareKey, SquareRank} from '@/types/chess'
import type {PieceAnimation, PlacedPiece, SquareHighlight} from '@/types/look-and-feel'
import type {GameView} from '@/composables/useGameView'
import {getBoardPieces} from '@/engine/board'
import {squareToCoords} from '@/utils/boardCoords'
import {usePieceDrag} from '@/composables/usePieceDrag'
import cSquare from './cSquare.vue'
import cPiece from './cPiece.vue'
import cBoardFrame from './cBoardFrame.vue'

// The view is the single DTO prop — board, orientation, policies (movableColor, lastMove) and
// the move command all come from it. Only `size` stays apart: it's measured by the parent's
// ResizeObserver, not a view concern. cBoard renders under the parent's v-if="view.game".
const props = defineProps<{
  view: GameView
  // px — controls everything inside via the grid
  size?: number
}>()

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [1, 2, 3, 4, 5, 6, 7, 8]

const board = computed<Board | null>(() => props.view.game?.board ?? null)
const orientation = computed<PieceColor>(() => props.view.orientation)

// Selected square for click-to-move. Any unrelated action clears it (drag start, rotation, a move).
const selected = ref<SquareKey | null>(null)

// Only movable pieces react to interaction — opponent pieces can't be grabbed or selected.
function isMovable(color: PieceColor): boolean {
  return props.view.movableColor === color
}

// Rows top → bottom, columns left → right, both flipped for a black-down board.
// Order must mirror squareToCoords so the piece overlay lines up with the grid.
const orderedSquares = computed(() => {
  const squares = board.value?.squares
  if (!squares) {
    return []
  }

  const ranks = orientation.value === 'white' ? [...RANKS].reverse() : RANKS
  const files = orientation.value === 'white' ? FILES : [...FILES].reverse()
  return ranks.flatMap(rank => files.map(file => squares[`${file}${rank}`]))
})

// Square under the mouse (set on hover); the frame highlights its file/rank.
const hoveredSquare = ref<SquareKey | null>(null)

// Each board piece resolved to grid coordinates for the current orientation.
// Sorted by id so the v-for keeps a STABLE DOM order regardless of board position —
// a move then only patches a piece's transform instead of reordering nodes, which would
// reset the in-flight CSS transition and make the piece teleport.
const placedPieces = computed<PlacedPiece[]>(() => {
  if (!board.value) {
    return []
  }

  return getBoardPieces(board.value)
    .map(({piece, square}) => ({
      id: piece.id,
      color: piece.color,
      type: piece.type,
      square,
      movable: isMovable(piece.color),
      ...squareToCoords(square, orientation.value),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
})

// ─── Drag and drop ─────────────────────────────────────────────────────────────

const areaEl = ref<HTMLElement | null>(null)

// Whether the last drag release actually played a move — decides snap vs snap-back below.
// Detected on the game state (a played move is recorded), never via legalTargets: that query
// is gated by the showLegalMoves setting, the legality of a drop is not.
let dropApplied = false

const {draggingId, dragX, dragY, dropTarget, dragFrom, isTouch, start} = usePieceDrag({
  boardEl: areaEl,
  orientation,
  onDrop: (from, to) => {
    selected.value = null
    const movesBefore = props.view.moves.length
    props.view.move(from, to)
    dropApplied = props.view.moves.length > movesBefore
  },
  onTap: activateSquare,
  onDragStart: () => {
    selected.value = null
  },
})

// Only movable pieces start a drag — an opponent piece ignores the pointer entirely.
function onPiecePointerDown(event: PointerEvent, piece: PlacedPiece) {
  if (!piece.movable) {
    return
  }

  start(event, piece.square, piece.id)
}

// Click-to-move: tap a movable piece to select, then tap a destination. Tapping the selected
// square clears it; tapping another friendly piece reselects; anything else attempts the move
// (the engine validates). Reached from a piece tap (onTap) and from an empty square click.
function activateSquare(square: SquareKey) {
  const squares = board.value?.squares
  if (!squares) {
    return
  }

  const current = selected.value
  const piece = squares[square].piece

  if (!current) {
    if (piece && isMovable(piece.color)) {
      selected.value = square
    }

    return
  }

  if (square === current) {
    selected.value = null
    return
  }

  const selectedPiece = squares[current].piece
  if (piece && selectedPiece && piece.color === selectedPiece.color) {
    selected.value = square
    return
  }

  props.view.move(current, square)
  selected.value = null
}

// A played drop snaps instantly — the piece is already under the cursor. Any other release
// (refused move, same square, off-board, cancelled drag) slides the piece back home.
watch(draggingId, (id, prev) => {
  if (prev && !id) {
    if (dropApplied) {
      teleportThenRestore()
    } else {
      snapBackThenRestore()
    }

    dropApplied = false
  }
})

// While dragging the mouse stops firing hover events, so keep the hovered square in sync with the
// live drop target. This also leaves it on the landing square once the drag ends (mouse is there).
watch(dropTarget, target => {
  if (target) {
    hoveredSquare.value = target
  }
})

// Coordinate highlight source: the live drop target while dragging (null off-board = no highlight),
// otherwise the hovered square.
const coordSquare = computed(() => (draggingId.value ? dropTarget.value : hoveredSquare.value))
const hoveredFile = computed<SquareFile | null>(() =>
  coordSquare.value ? (coordSquare.value[0] as SquareFile) : null,
)
const hoveredRank = computed<SquareRank | null>(() =>
  coordSquare.value ? (Number(coordSquare.value[1]) as SquareRank) : null,
)

// The piece the player is engaging with — grabbed (from the press, before the drag threshold)
// or selected for click-to-move. Its square carries the 'selected' veil, and its legal
// destinations get the hints (the view gates that query behind the showLegalMoves setting).
const hintFrom = computed(() => dragFrom.value ?? selected.value)
const legalTargets = computed<SquareKey[]>(() =>
  hintFrom.value ? props.view.legalTargets(hintFrom.value) : [],
)

// Combines the per-state sources into the highlights a given square should show.
// Add a new visual state = add its source here (drop-target, last-move, selected…).
function highlightsFor(square: SquareKey): SquareHighlight[] {
  const result: SquareHighlight[] = []
  const lastMove = props.view.lastMove
  if (lastMove && (lastMove.from === square || lastMove.to === square)) {
    result.push('last-move')
  }

  if (dropTarget.value === square) {
    result.push(isTouch.value ? 'drop-target-touch' : 'drop-target')
  }

  if (hintFrom.value === square) {
    result.push('selected')
  }

  if (props.view.checkSquares.includes(square)) {
    result.push('check')
  }

  if (legalTargets.value.includes(square)) {
    result.push(board.value?.squares[square].piece ? 'legal-capture' : 'legal-move')
  }

  return result
}

// ─── Animation gating ──────────────────────────────────────────────────────────

// Board-level animation mode. A move slides; mount, rotation and played drops teleport;
// a refused drop snaps back. Refined per piece below (the knight upgrades slide to hop).
const animation = ref<PieceAnimation>('none')
onMounted(() => nextTick(() => {
  animation.value = 'slide'
}))

// The hop class is safe to hold statically: its arc keyframe is gated by --moving in CSS,
// so it only plays while the knight actually slides.
function animationFor(piece: PlacedPiece): PieceAnimation {
  if (animation.value === 'slide' && piece.type === 'knight') {
    return 'hop'
  }

  return animation.value
}

// Renders one instant (no-transition) frame, then restores sliding — used by rotation and drops.
// Two rAFs are required: the no-transition frame must actually PAINT before we re-enable, otherwise
// the browser coalesces both renders and animates anyway (nextTick is only a microtask — no paint).
let restoreRaf = 0
function teleportThenRestore() {
  animation.value = 'none'
  cancelAnimationFrame(restoreRaf)
  restoreRaf = requestAnimationFrame(() => {
    restoreRaf = requestAnimationFrame(() => {
      animation.value = 'slide'
    })
  })
}

// Arms the snap-back easing for the released piece's return, then re-arms the normal slide
// once the transition had time to play out.
let snapBackTimer = 0
function snapBackThenRestore() {
  animation.value = 'snap-back'
  window.clearTimeout(snapBackTimer)
  snapBackTimer = window.setTimeout(() => {
    animation.value = 'slide'
  }, 250)
}

watch(orientation, () => {
  selected.value = null // a flip is an unrelated action — drop any selection
  teleportThenRestore()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(restoreRaf)
  window.clearTimeout(snapBackTimer)
})

const areaStyle = computed(() => {
  const px = `${props.size ?? 560}px`
  return {width: px, height: px}
})
</script>

<style lang="scss">
.c-board {
  flex-shrink: 0;

  &__area {
    // anchors the grid, the overlay, and the drag rect math
    position: relative;

    // Capped by viewport HEIGHT only, on both axes (so it stays 1:1). Mobile sizes the board from
    // width alone (see GameBoardArea's `fit` prop), which is already bounded by the real available
    // width — the only runaway case is landscape, where that width is generous but the viewport is
    // short. In portrait, svh is large so this never clamps and the board keeps matching the
    // player-cards' width.
    @include breakpoint-down($breakpoint-lg) {
      max-width: 75svh;
      max-height: 75svh;
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);

    // No overflow: hidden here — the popped touch tile and its code label must escape over
    // the frame on edge squares. The rounded board corners are carried by the four corner
    // cells instead (grid order: 1 = top-left, 8 = top-right, 57 = bottom-left, 64 = bottom-right).
    .c-square:nth-child(1) {
      border-radius: $border-radius-sm 0 0 0;
    }

    .c-square:nth-child(8) {
      border-radius: 0 $border-radius-sm 0 0;
    }

    .c-square:nth-child(57) {
      border-radius: 0 0 0 $border-radius-sm;
    }

    .c-square:nth-child(64) {
      border-radius: 0 0 $border-radius-sm 0;
    }
  }

  &__pieces {
    // overlay covering the grid; pieces position themselves and may overflow while dragged.
    // No z-index here: it would make the layer an atomic stacking context, and the popped
    // touch tile (z 2) could no longer slip between resting and elevated pieces — the
    // stacking is per piece (see cPiece --popped / --moving).
    position: absolute;
    inset: 0;
    // squares below stay clickable; pieces re-enable it themselves
    pointer-events: none;
  }
}
</style>
