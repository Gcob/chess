import {ref, type Ref} from 'vue'
import type {PieceColor, SquareKey} from '@/types/chess'
import {coordsToSquare} from '@/utils/boardCoords'

interface UsePieceDragOptions {
  boardEl: Ref<HTMLElement | null> // the grid element — its rect anchors all pointer math
  orientation: Ref<PieceColor>
  onDrop: (from: SquareKey, to: SquareKey) => void // called only for a real move (target ≠ origin)
}

// Pointer-based piece dragging. The dragged piece follows the cursor in pixels;
// the target square is resolved by arithmetic on the board rect, not DOM hit-testing,
// so it is robust to overlapping pieces and works the same for mouse and touch.
export function usePieceDrag({boardEl, orientation, onDrop}: UsePieceDragOptions) {
  const draggingId = ref<string | null>(null) // piece.id currently dragged, or null
  const dragX = ref(0)                         // px translate within the board (top-left origin)
  const dragY = ref(0)
  const dropTarget = ref<SquareKey | null>(null) // square under the cursor, for highlighting

  let from: SquareKey | null = null
  let rect: DOMRect | null = null
  let squareSize = 0

  function squareAt(clientX: number, clientY: number): SquareKey | null {
    if (!rect) return null
    const col = Math.floor((clientX - rect.left) / squareSize)
    const row = Math.floor((clientY - rect.top) / squareSize)
    return coordsToSquare(col, row, orientation.value)
  }

  function track(event: PointerEvent) {
    if (!rect) return
    // Center the piece under the cursor; translate is from the board's top-left.
    dragX.value = event.clientX - rect.left - squareSize / 2
    dragY.value = event.clientY - rect.top - squareSize / 2
    dropTarget.value = squareAt(event.clientX, event.clientY)
  }

  function end(event: PointerEvent) {
    window.removeEventListener('pointermove', track)
    window.removeEventListener('pointerup', end)
    const target = squareAt(event.clientX, event.clientY)
    const origin = from
    reset()
    if (origin && target && target !== origin) onDrop(origin, target)
  }

  function reset() {
    draggingId.value = null
    dropTarget.value = null
    from = null
    rect = null
  }

  // Call from a piece's pointerdown. square/id identify the grabbed piece.
  function start(event: PointerEvent, square: SquareKey, id: string) {
    const el = boardEl.value
    if (!el) return
    rect = el.getBoundingClientRect()
    squareSize = rect.width / 8
    from = square
    draggingId.value = id
    track(event)
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerup', end)
    event.preventDefault() // avoid text/image selection while dragging
  }

  return {draggingId, dragX, dragY, dropTarget, start}
}
