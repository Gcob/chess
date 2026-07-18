import {ref, type Ref} from 'vue'
import type {PieceColor, SquareKey} from '@/types/chess'
import {coordsToSquare} from '@/utils/boardCoords'

// PointerEvent.buttons bitmask value for "only the primary (left) button held".
const PRIMARY_BUTTON = 1

// px the pointer must travel before a press becomes a drag rather than a tap.
const DRAG_THRESHOLD = 4

interface UsePieceDragOptions {
  // The grid element — its rect anchors all pointer math.
  boardEl: Ref<HTMLElement | null>
  orientation: Ref<PieceColor>
  // A real drag landed on a different square (target ≠ origin).
  onDrop: (from: SquareKey, to: SquareKey) => void
  // A press released without dragging — a click on the square.
  onTap?: (square: SquareKey) => void
  // A drag actually started moving (past the threshold).
  onDragStart?: () => void
}

// Pointer-based piece interaction. A press that stays put is a tap (→ onTap, for click-to-move);
// a press that moves past the threshold becomes a drag: the piece follows the cursor in pixels and
// the target square is resolved by arithmetic on the board rect (no DOM hit-testing), so it is
// robust to overlapping pieces and identical for mouse and touch.
export function usePieceDrag({boardEl, orientation, onDrop, onTap, onDragStart}: UsePieceDragOptions) {
  const draggingId = ref<string | null>(null)
  // px translate within the board (top-left origin), while dragging
  const dragX = ref(0)
  const dragY = ref(0)
  // Square under the cursor, for highlighting.
  const dropTarget = ref<SquareKey | null>(null)
  // Origin square of the current interaction — set on press, before the drag threshold,
  // so the move hints can show as soon as a piece is grabbed.
  const dragFrom = ref<SquareKey | null>(null)
  // Touch drags grow the sprite out of the thumb's shadow (CSS `--lifted`) and pop the
  // target square — this flag drives those styles; the drop math stays identical.
  const isTouch = ref(false)

  let pendingId: string | null = null
  let startX = 0
  let startY = 0
  let moved = false
  let rect: DOMRect | null = null
  let squareSize = 0

  function squareAt(clientX: number, clientY: number): SquareKey | null {
    if (!rect) {
      return null
    }

    const col = Math.floor((clientX - rect.left) / squareSize)
    const row = Math.floor((clientY - rect.top) / squareSize)
    return coordsToSquare(col, row, orientation.value)
  }

  function beginDrag() {
    moved = true
    draggingId.value = pendingId
    onDragStart?.()
  }

  function track(event: PointerEvent) {
    if (!rect) {
      return
    }

    // Any button other than the primary pressed mid-drag aborts (right-click cancel).
    // Detected here, not via mousedown: our pointerdown preventDefault suppresses the compat
    // mouse events, and pointerdown itself doesn't re-fire for a second button — but pointermove
    // keeps firing (including on a buttons change), and its bitmask reveals the extra button.
    if (event.buttons !== PRIMARY_BUTTON) {
      cancel()
      return
    }

    // Below the threshold it is still a potential tap: leave the piece resting.
    if (!moved) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) <= DRAG_THRESHOLD) {
        return
      }

      beginDrag()
    }

    // Center the piece under the cursor; translate is from the board's top-left.
    dragX.value = event.clientX - rect.left - squareSize / 2
    dragY.value = event.clientY - rect.top - squareSize / 2
    dropTarget.value = squareAt(event.clientX, event.clientY)
  }

  function detach() {
    window.removeEventListener('pointermove', track)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', cancel)
  }

  function end(event: PointerEvent) {
    const origin = dragFrom.value
    const wasDrag = moved
    const target = squareAt(event.clientX, event.clientY)
    detach()
    reset()
    if (!origin) {
      return
    }

    if (!wasDrag) {
      onTap?.(origin)
    } else if (target && target !== origin) {
      onDrop(origin, target)
    }
  }

  // Right-button press (or an interrupted pointer) aborts: piece back to origin, no move.
  // The board suppresses the context menu itself (@contextmenu.prevent).
  function cancel() {
    detach()
    reset()
  }

  function reset() {
    draggingId.value = null
    dropTarget.value = null
    dragFrom.value = null
    pendingId = null
    moved = false
    rect = null
  }

  // Call from a piece's pointerdown. square/id identify the grabbed piece.
  function start(event: PointerEvent, square: SquareKey, id: string) {
    const el = boardEl.value
    if (!el) {
      return
    }

    // Only the primary button starts an interaction; other buttons are reserved for cancelling.
    if (event.button !== 0) {
      return
    }

    rect = el.getBoundingClientRect()
    squareSize = rect.width / 8
    isTouch.value = event.pointerType === 'touch'
    dragFrom.value = square
    pendingId = id
    startX = event.clientX
    startY = event.clientY
    moved = false
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', cancel)
    // Avoid text/image selection while dragging.
    event.preventDefault()
  }

  return {draggingId, dragX, dragY, dropTarget, dragFrom, isTouch, start}
}
