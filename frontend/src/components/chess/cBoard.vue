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
            :animation="animation"
            :dragging="draggingId === p.id"
            :drag-x="draggingId === p.id ? dragX : 0"
            :drag-y="draggingId === p.id ? dragY : 0"
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
const {draggingId, dragX, dragY, dropTarget, start} = usePieceDrag({
  boardEl: areaEl,
  orientation,
  onDrop: (from, to) => {
    selected.value = null
    props.view.move(from, to)
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

// Any drag release snaps instantly (the piece is already under the cursor) — valid drop to the
// target, or return to origin on an off-board/same-square release. No slide either way.
watch(draggingId, (id, prev) => {
  if (prev && !id) {
    teleportThenRestore()
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

// Combines the per-state sources into the highlights a given square should show.
// Add a new visual state = add its source here (drop-target, last-move, selected…).
function highlightsFor(square: SquareKey): SquareHighlight[] {
  const result: SquareHighlight[] = []
  const lastMove = props.view.lastMove
  if (lastMove && (lastMove.from === square || lastMove.to === square)) {
    result.push('last-move')
  }

  if (dropTarget.value === square) {
    result.push('drop-target')
  }

  if (selected.value === square) {
    result.push('selected')
  }

  if (props.view.checkSquares.includes(square)) {
    result.push('check')
  }

  return result
}

// ─── Animation gating ──────────────────────────────────────────────────────────

// Board-level animation applied to every piece. A move slides; mount, rotation and drops teleport.
// (Per-piece animations like the knight 'hop' come with the rules engine.)
const animation = ref<PieceAnimation>('none')
onMounted(() => nextTick(() => {
  animation.value = 'slide'
}))

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
watch(orientation, () => {
  selected.value = null // a flip is an unrelated action — drop any selection
  teleportThenRestore()
})
onBeforeUnmount(() => cancelAnimationFrame(restoreRaf))

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
    // rounds the board corners
    border-radius: $border-radius-sm;
    overflow: hidden;
  }

  &__pieces {
    // overlay covering the grid; pieces position themselves and may overflow while dragged
    position: absolute;
    inset: 0;
    // squares below stay clickable; pieces re-enable it themselves
    pointer-events: none;
  }
}
</style>
