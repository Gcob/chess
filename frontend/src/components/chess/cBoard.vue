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
            :popped="draggingId !== p.id && touchDropSquare === p.square"
            :flipped="view.piecesFlipped"
            @pointerdown="onPiecePointerDown($event, p)"
            @mouseenter="hoveredSquare = p.square"
          />
        </div>

        <cPromotionPicker
          v-if="promotionPicker"
          :slots="promotionPicker.slots"
          :color="promotionPicker.color"
          :hovered="hoveredSlotPiece"
          :interactive="promotionPicker.interactive"
          :centered="promotionPicker.centered"
          :halo-radius="promotionPicker.halo"
          @pick="onPromotionPick"
          @cancel="pendingPromotion = null"
        />
      </div>
    </cBoardFrame>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import type {Board, PieceColor, PieceType, SquareFile, SquareKey, SquareRank} from '@/types/chess'
import type {PieceAnimation, PlacedPiece, SquareHighlight} from '@/types/look-and-feel'
import type {GameView} from '@/composables/useGameView'
import {getBoardPieces} from '@/engine/board'
import {squareToCoords} from '@/utils/boardCoords'
import {promotionSlotCenters, type PromotionSlot} from '@/utils/promotionLayout'
import {usePieceDrag} from '@/composables/usePieceDrag'
import {useIsMobile} from '@/composables/useMediaQuery'
import cSquare from './cSquare.vue'
import cPiece from './cPiece.vue'
import cBoardFrame from './cBoardFrame.vue'
import cPromotionPicker from './cPromotionPicker.vue'

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

    // A promotion ring is open: the release picks a slot, not a square — resolved on drag end.
    if (dragPromotion.value) {
      return
    }

    const movesBefore = props.view.moves.length
    if (props.view.needsPromotionChoice(from, to)) {
      // Touch has no ring to release into: the choice comes after the drop, as a pending move.
      if (isTouch.value) {
        pendingPromotion.value = {from, to}
        return
      }

      // Mouse dropped on the promotion square before the ring even opened — that IS the
      // pre-armed queen: one straight gesture, no dwelling, no extra click.
      props.view.move(from, to, 'queen')
    } else {
      props.view.move(from, to)
    }

    dropApplied = props.view.moves.length > movesBefore
  },
  onTap: activateSquare,
  onDragStart: () => {
    selected.value = null
    pendingPromotion.value = null
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

  // A promotion destination waits in the picker — the move only plays on a slot choice.
  if (props.view.needsPromotionChoice(current, square)) {
    pendingPromotion.value = {from: current, to: square}
    selected.value = null
    return
  }

  props.view.move(current, square)
  selected.value = null
}

// ─── Promotion picker ──────────────────────────────────────────────────────────
// Two gestures, one ring. Mouse drag: hovering a legal promotion square opens the ring — the
// queen sits pre-armed under the cursor and the RELEASE picks (a release outside every slot is
// an illegal drop, so the existing snap-back cancels for free). Click-to-move and touch drag:
// the move waits as pendingPromotion until a slot is tapped; anywhere else cancels.
const dragPromotion = ref<{from: SquareKey; anchor: SquareKey} | null>(null)
const pendingPromotion = ref<{from: SquareKey; to: SquareKey} | null>(null)
const isMobile = useIsMobile()

const promotionPicker = computed(() => {
  const anchored = dragPromotion.value
    ? {from: dragPromotion.value.from, to: dragPromotion.value.anchor, interactive: false}
    : pendingPromotion.value && {...pendingPromotion.value, interactive: true}

  if (!anchored) {
    return null
  }

  const {col, row} = squareToCoords(anchored.to, orientation.value)
  return {
    slots: promotionSlotCenters(col, row),
    color: board.value?.squares[anchored.from].piece?.color ?? 'white',
    interactive: anchored.interactive,
    centered: anchored.interactive && isMobile.value,
    // Drag mode shows its safe zone; pending mode has the backdrop instead.
    halo: anchored.interactive ? null : RING_HALO,
  }
})

// The halo's radius in grid units — drawn AND logical: what the player sees IS the safe zone.
// With the halo reaching the satellites' own centers, the zone (halo ∪ slots) is continuous:
// traveling from the queen to any slot never leaves it. Stepping out closes the ring.
const RING_HALO = 1

// Dwell time before the ring opens: with several promotion squares side by side, a diagonal
// travel sweeps across the middle one — the ring waits for the cursor to SETTLE, so crossing
// a square never counts as aiming at it.
const RING_OPEN_DELAY = 25

// The cursor in grid units — dragX/dragY hold the sprite's top-left, one half-square off the
// pointer. Still readable right after the drag ends (they never reset), which is exactly when
// the release needs them.
function cursorGrid(): {x: number; y: number} | null {
  const rect = areaEl.value?.getBoundingClientRect()
  if (!rect?.width) {
    return null
  }

  const squareSize = rect.width / 8
  return {
    x: (dragX.value + squareSize / 2) / squareSize,
    y: (dragY.value + squareSize / 2) / squareSize,
  }
}

// How close the cursor must be to a slot's center to be on it — the slot is one square wide.
const SLOT_HIT_RADIUS = 0.55

// The slot under the cursor. Slots overlap (the ring is tight), so two rules keep the pick
// unambiguous: the slot already holding the cursor keeps it (it is the one painted on top),
// and otherwise the TOPMOST candidate wins — last in paint order, never the one underneath.
const hoveredSlotPiece = ref<PieceType | null>(null)

function resolveHoveredSlot(): PieceType | null {
  const picker = promotionPicker.value
  const cursor = cursorGrid()
  if (!dragPromotion.value || !picker || !cursor) {
    return null
  }

  const holds = (slot: PromotionSlot) => Math.hypot(slot.x - cursor.x, slot.y - cursor.y) <= SLOT_HIT_RADIUS

  const current = picker.slots.find(slot => slot.piece === hoveredSlotPiece.value)
  if (current && holds(current)) {
    return current.piece
  }

  return [...picker.slots].reverse().find(holds)?.piece ?? null
}

watch([dragX, dragY, dragPromotion], () => {
  hoveredSlotPiece.value = resolveHoveredSlot()
})

// Distance from the cursor to the open ring's anchor, in grid units — null when no ring.
function distanceToAnchor(): number | null {
  const promotion = dragPromotion.value
  const cursor = cursorGrid()
  if (!promotion || !cursor) {
    return null
  }

  const {col, row} = squareToCoords(promotion.anchor, orientation.value)
  return Math.hypot(cursor.x - (col + 0.5), cursor.y - (row + 0.5))
}

// The safe selection zone: what the player SEES — the halo and the slots. Inside, the ring
// owns the gesture: no neighbouring promotion square can steal it. Stepping outside closes
// the picker, freeing the cursor to aim at another promotion square.
function isWithinSafeZone(): boolean {
  const distance = distanceToAnchor()
  return hoveredSlotPiece.value !== null || (distance !== null && distance <= RING_HALO)
}

// The ring waits for the cursor to settle on a promotion square: the timer is armed when the
// square is entered and left running while the cursor stays there, so a crossing never opens
// a ring but a pause does.
let ringOpenTimer = 0
let armedTarget: SquareKey | null = null

function armRing(from: SquareKey, target: SquareKey) {
  disarmRing()
  armedTarget = target
  ringOpenTimer = window.setTimeout(() => {
    armedTarget = null
    if (draggingId.value && dropTarget.value === target) {
      dragPromotion.value = {from, anchor: target}
    }
  }, RING_OPEN_DELAY)
}

function disarmRing() {
  window.clearTimeout(ringOpenTimer)
  armedTarget = null
}

// Mouse drag only — touch picks after the drop. Driven by the cursor itself, not just by
// square changes: the ring must let go the moment its safe zone is left, even when that
// happens without entering another square.
watch([dropTarget, dragX, dragY], () => {
  if (!draggingId.value || isTouch.value || !dragFrom.value) {
    return
  }

  if (dragPromotion.value) {
    // Inside its safe zone the open ring owns the gesture — nothing else may steal it.
    if (isWithinSafeZone()) {
      return
    }

    dragPromotion.value = null
    disarmRing()
  }

  const from = dragFrom.value
  const target = dropTarget.value
  if (!target) {
    disarmRing()
    return
  }

  if (target === armedTarget) {
    return
  }

  if (props.view.needsPromotionChoice(from, target)) {
    armRing(from, target)
  } else {
    disarmRing()
  }
})

function onPromotionPick(piece: PieceType) {
  const pending = pendingPromotion.value
  if (!pending) {
    return
  }

  pendingPromotion.value = null
  props.view.move(pending.from, pending.to, piece)
}

// A played drop snaps only the released piece instantly — it is already under the cursor,
// while anything riding along (the castling rook) keeps its slide. Any other release
// (refused move, same square, off-board, cancelled drag) slides the piece back home.
// A release with the promotion ring open resolves FIRST: the hovered slot is the choice
// (usePieceDrag never reports a drop on the origin square, which the ring may well cover —
// so the pick lives here, on the end of the drag, not in onDrop).
watch(draggingId, (id, prev) => {
  if (prev && !id) {
    disarmRing()
    const promotion = dragPromotion.value
    if (promotion) {
      const picked = hoveredSlotPiece.value
      if (picked) {
        const movesBefore = props.view.moves.length
        props.view.move(promotion.from, promotion.anchor, picked)
        dropApplied = props.view.moves.length > movesBefore
      }

      dragPromotion.value = null
    }

    if (dropApplied) {
      snapPieceThenRestore(prev)
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

// Coordinate highlight source: the live drop target while dragging (null off-board = no
// highlight), pinned on the anchor while the promotion ring is open, otherwise the hovered square.
const coordSquare = computed(() => {
  if (dragPromotion.value) {
    return dragPromotion.value.anchor
  }

  return draggingId.value ? dropTarget.value : hoveredSquare.value
})
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

// Legal destinations of the grabbed piece, ungated by the hints setting — the touch pop is
// legality feedback, not a hint: sliding a bishop must not grow every crossed square, even
// for a viewer who plays with the hints off.
const dragTargets = computed<SquareKey[]>(() =>
  dragFrom.value ? props.view.dropTargets(dragFrom.value) : [],
)

// The popped touch square: the live drop target, only when a drop would actually land there.
const touchDropSquare = computed<SquareKey | null>(() =>
  isTouch.value && dropTarget.value && dragTargets.value.includes(dropTarget.value)
    ? dropTarget.value
    : null,
)

// Combines the per-state sources into the highlights a given square should show.
// Add a new visual state = add its source here (drop-target, last-move, selected…).
function highlightsFor(square: SquareKey): SquareHighlight[] {
  const result: SquareHighlight[] = []
  const lastMove = props.view.lastMove
  if (lastMove && (lastMove.from === square || lastMove.to === square)) {
    result.push('last-move')
  }

  // Touch only acknowledges squares a drop could land on; the mouse veil follows the cursor —
  // silenced while the ring is open: the selection zone belongs to the picker, the board
  // beneath stops reacting.
  if (!dragPromotion.value && (isTouch.value ? touchDropSquare.value === square : dropTarget.value === square)) {
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

// Board-level animation mode. A move slides; mount and rotation teleport; a refused drop
// snaps back. Refined per piece below (the knight upgrades slide to hop, the dropped piece
// lands instantly on its own).
const animation = ref<PieceAnimation>('none')
onMounted(() => nextTick(() => {
  animation.value = 'slide'
}))

// The hop class is safe to hold statically: its arc keyframe is gated by --moving in CSS,
// so it only plays while the knight actually slides.
function animationFor(piece: PlacedPiece): PieceAnimation {
  if (piece.id === snappedPieceId.value) {
    return 'none'
  }

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

// Per-piece counterpart of teleportThenRestore: one instant painted frame for the dropped
// piece only — the rest of the board keeps its slide (a castling rook animates its jump).
const snappedPieceId = ref<string | null>(null)
let snapRaf = 0
function snapPieceThenRestore(pieceId: string) {
  snappedPieceId.value = pieceId
  cancelAnimationFrame(snapRaf)
  snapRaf = requestAnimationFrame(() => {
    snapRaf = requestAnimationFrame(() => {
      snappedPieceId.value = null
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
  pendingPromotion.value = null
  teleportThenRestore()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(restoreRaf)
  cancelAnimationFrame(snapRaf)
  window.clearTimeout(snapBackTimer)
  window.clearTimeout(ringOpenTimer)
})

const areaStyle = computed(() => {
  const px = `${props.size ?? 560}px`
  return {width: px, height: px}
})
</script>

<style lang="scss">
.c-board {
  flex-shrink: 0;
  // No long-press selection/callout (and their haptics) anywhere on the board — squares and
  // frame coordinates included. NEVER touchstart.prevent on squares: click-to-move relies on
  // the synthesized click; pieces alone get it (their logic is pointer-based, see cPiece).
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

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

    // No overflow: hidden here — the popped touch tile must escape over the frame on
    // edge squares. The rounded board corners are carried by the four corner
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
