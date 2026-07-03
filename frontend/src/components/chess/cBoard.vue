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

    <div ref="areaEl" class="c-board__area" :style="areaStyle">
      <!-- Background grid: clipped to rounded corners. Squares carry their highlights. -->
      <div class="c-board__grid">
        <cSquare
          v-for="square in orderedSquares"
          :key="`${square.file}${square.rank}`"
          :square="square"
          :highlights="highlightsFor(`${square.file}${square.rank}`)"
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
        />
      </div>
    </div>
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

const props = defineProps<{
  board: Board
  size?: number            // px — controls everything inside via the grid
  orientation?: PieceColor // which color sits at the bottom; defaults to white (v-model)
}>()

const emit = defineEmits<{
  'update:orientation': [PieceColor]
  move: [from: SquareKey, to: SquareKey]
}>()

const FILES: SquareFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS: SquareRank[] = [1, 2, 3, 4, 5, 6, 7, 8]

const orientation = computed<PieceColor>(() => props.orientation ?? 'white')

function rotate() {
  emit('update:orientation', orientation.value === 'white' ? 'black' : 'white')
}

// Rows top → bottom, columns left → right, both flipped for a black-down board.
// Order must mirror squareToCoords so the piece overlay lines up with the grid.
const orderedSquares = computed(() => {
  const ranks = orientation.value === 'white' ? [...RANKS].reverse() : RANKS
  const files = orientation.value === 'white' ? FILES : [...FILES].reverse()
  return ranks.flatMap(rank => files.map(file => props.board.squares[`${file}${rank}`]))
})

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
  onDrop: (from, to) => emit('move', from, to),
})

// Any drag release snaps instantly (the piece is already under the cursor) — valid drop to the
// target, or return to origin on an off-board/same-square release. No slide either way.
watch(draggingId, (id, prev) => {
  if (prev && !id) teleportThenRestore()
})

// Combines the per-state sources into the highlights a given square should show.
// Add a new visual state = add its source here (drop-target, last-move, selected…).
function highlightsFor(square: SquareKey): SquareHighlight[] {
  const result: SquareHighlight[] = []
  if (dropTarget.value === square) result.push('drop-target')
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
    position: relative; // anchors the grid, the overlay, and the drag rect math
  }

  &__grid {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    border-radius: $border-radius-sm;
    overflow: hidden; // rounds the board corners
    box-shadow: $shadow-xl;
  }

  &__pieces {
    // overlay covering the grid; pieces position themselves and may overflow while dragged
    position: absolute;
    inset: 0;
    pointer-events: none; // squares below stay clickable; pieces re-enable it themselves
  }
}
</style>
