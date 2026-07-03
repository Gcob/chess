<template>
  <div class="c-board">
    <div class="c-board__controls">
      <button
        type="button"
        class="c-board__rotate"
        :aria-label="$t('game.rotateBoard')"
        :title="$t('game.rotateBoard')"
        @click="rotate"
      >
        <RotateCw :size="18" />
      </button>
    </div>

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
            :col="p.col"
            :row="p.row"
            :color="p.color"
            :type="p.type"
            :animation="animation"
            :dragging="draggingId === p.id"
            :drag-x="draggingId === p.id ? dragX : 0"
            :drag-y="draggingId === p.id ? dragY : 0"
            @pointerdown="start($event, p.square, p.id)"
            @mouseenter="hoveredSquare = p.square"
          />
        </div>
      </div>
    </cBoardFrame>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {RotateCw} from 'lucide-vue-next'
import type {Board, PieceColor, SquareFile, SquareKey, SquareRank} from '@/types/chess'
import type {PieceAnimation, SquareHighlight} from '@/types/look-and-feel'
import {getBoardPieces} from '@/engine/board'
import {squareToCoords} from '@/utils/boardCoords'
import {usePieceDrag} from '@/composables/usePieceDrag'
import cSquare from './cSquare.vue'
import cPiece from './cPiece.vue'
import cBoardFrame from './cBoardFrame.vue'

const props = defineProps<{
  board: Board
  // px — controls everything inside via the grid
  size?: number
  // which color sits at the bottom; defaults to white (v-model)
  orientation?: PieceColor
}>()

const emit = defineEmits<{
  'update:orientation': [PieceColor]
  move: [from: SquareKey, to: SquareKey]
}>()

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [1, 2, 3, 4, 5, 6, 7, 8]

const orientation = computed<PieceColor>(() => props.orientation ?? 'white')

// Selected square for click-to-move. Any unrelated action clears it (drag start, rotation, a move).
const selected = ref<SquareKey | null>(null)

function rotate() {
  selected.value = null
  emit('update:orientation', orientation.value === 'white' ? 'black' : 'white')
}

// Rows top → bottom, columns left → right, both flipped for a black-down board.
// Order must mirror squareToCoords so the piece overlay lines up with the grid.
const orderedSquares = computed(() => {
  const ranks = orientation.value === 'white' ? [...RANKS].reverse() : RANKS
  const files = orientation.value === 'white' ? FILES : [...FILES].reverse()
  return ranks.flatMap(rank => files.map(file => props.board.squares[`${file}${rank}`]))
})

// Square under the mouse (set on hover); the frame highlights its file/rank.
const hoveredSquare = ref<SquareKey | null>(null)

// Each board piece resolved to grid coordinates for the current orientation.
// Sorted by id so the v-for keeps a STABLE DOM order regardless of board position —
// a move then only patches a piece's transform instead of reordering nodes, which would
// reset the in-flight CSS transition and make the piece teleport.
const placedPieces = computed(() =>
  getBoardPieces(props.board)
    .map(({piece, square}) => ({
      id: piece.id,
      color: piece.color,
      type: piece.type,
      square,
      ...squareToCoords(square, orientation.value),
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
)

// ─── Drag and drop ─────────────────────────────────────────────────────────────

const areaEl = ref<HTMLElement | null>(null)
const {draggingId, dragX, dragY, dropTarget, start} = usePieceDrag({
  boardEl: areaEl,
  orientation,
  onDrop: (from, to) => {
    selected.value = null
    emit('move', from, to)
  },
  onTap: activateSquare,
  onDragStart: () => {
    selected.value = null
  },
})

// Click-to-move: tap a piece to select, then tap a destination. Tapping the selected square
// clears it; tapping another friendly piece reselects; anything else attempts the move (the
// engine validates). Reached from a piece tap (onTap) and from an empty square click.
function activateSquare(square: SquareKey) {
  const current = selected.value
  const piece = props.board.squares[square].piece

  if (!current) {
    if (piece) {
      selected.value = square
    }

    return
  }

  if (square === current) {
    selected.value = null
    return
  }

  const selectedPiece = props.board.squares[current].piece
  if (piece && selectedPiece && piece.color === selectedPiece.color) {
    selected.value = square
    return
  }

  emit('move', current, square)
  selected.value = null
}

// Any drag release snaps instantly (the piece is already under the cursor) — valid drop to the
// target, or return to origin on an off-board/same-square release. No slide either way.
watch(draggingId, (id, prev) => {
  if (prev && !id) {
    teleportThenRestore()
  }
})

// Coordinate highlight source: while dragging the mouse stops firing hover events, so follow the
// live drop target instead; otherwise use the hovered square.
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
  if (dropTarget.value === square) {
    result.push('drop-target')
  }

  if (selected.value === square) {
    result.push('selected')
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
watch(orientation, teleportThenRestore)
onBeforeUnmount(() => cancelAnimationFrame(restoreRaf))

const areaStyle = computed(() => {
  const px = `${props.size ?? 560}px`
  return {width: px, height: px}
})
</script>

<style lang="scss">
.c-board {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
  flex-shrink: 0;

  &__controls {
    display: flex;
    justify-content: flex-end;
  }

  &__rotate {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-2;
    color: var(--text-secondary);
    background: transparent;
    border: $border-width-base solid var(--border-color-strong);
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
      border-color: var(--text-muted);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }

  &__area {
    // anchors the grid, the overlay, and the drag rect math
    position: relative;
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
