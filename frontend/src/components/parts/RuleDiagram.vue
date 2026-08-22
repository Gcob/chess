<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import {createBoard, type PiecePlacement} from '@/composables/factories/gameFactory'
import {applyMove, legalDestinations} from '@/engine/move'
import {getBoardPieces} from '@/engine/board'
import {useChessTheme} from '@/composables/useChessTheme'
import {squareToCoords} from '@/utils/boardCoords'
import type {SquareKey} from '@/types/chess'

// A small, self-contained board that illustrates one rule. It runs the REAL engine: reachable
// squares come from legalDestinations and moves go through applyMove, so a diagram can never
// teach a rule the game does not actually play.
//
// Two shapes:
//   range    — `from` is given: highlight where that piece may go.
//   sequence — `moves` is given: play them on a loop (castling relocates the rook, en passant
//              clears the victim, promotion transforms the pawn — all of it applyMove's doing).
export interface RuleDiagramProps {
  setup: PiecePlacement
  from?: SquareKey
  moves?: [SquareKey, SquareKey][]
  // Promotion choice for the last move of a sequence, when it promotes.
  promoteTo?: 'queen' | 'rook' | 'bishop' | 'knight'
  // The en passant right the position implies — the engine never guesses it from placement.
  enPassantTarget?: SquareKey
  // Squares the diagram points at on its own, beyond what the engine computes: `threats` traces
  // a line of attack (the pin), `zone` shades an area of the board (the centre).
  threats?: SquareKey[]
  zone?: SquareKey[]
  label?: string
}

const props = defineProps<RuleDiagramProps>()

const {getPieceImage, boardTheme} = useChessTheme()

// The live board. Reactive so a played move re-renders the pieces, exactly like a real game.
const board = reactive(createBoard(props.setup))
const step = ref(0)

const CELLS = Array.from({length: 64}, (_, i) => ({
  col: i % 8,
  row: Math.floor(i / 8),
  // a1 dark: same parity rule as the real board.
  dark: (i % 8 + Math.floor(i / 8)) % 2 === 1,
}))

// Sorted by id, never by position: reordering the list mid-transition would teleport a sprite.
const pieces = computed(() =>
  getBoardPieces(board)
    .map(({piece, square}) => ({...squareToCoords(square, 'white'), piece, square}))
    .sort((a, b) => a.piece.id.localeCompare(b.piece.id)),
)

// Where the highlighted piece may legally go. Empty in sequence mode.
const targets = computed<SquareKey[]>(() =>
  props.from ? legalDestinations(board, props.from, props.enPassantTarget ?? null) : [],
)

type Mark = 'origin' | 'target' | 'capture' | 'threat' | 'zone'

const highlights = computed(() => {
  const marked = new Map<string, Mark>()

  // Authored marks go first: an engine-derived square always wins over them.
  for (const square of props.zone ?? []) {
    marked.set(square, 'zone')
  }
  for (const square of props.threats ?? []) {
    marked.set(square, 'threat')
  }

  if (props.from) {
    marked.set(props.from, 'origin')
    for (const target of targets.value) {
      marked.set(target, board.squares[target].piece ? 'capture' : 'target')
    }
  }

  // Sequence mode marks the squares of the move currently being played.
  const move = props.moves?.[step.value === 0 ? 0 : step.value - 1]
  if (move) {
    marked.set(move[0], 'origin')
    marked.set(move[1], 'target')
  }

  return marked
})

function highlightAt(col: number, row: number): string | undefined {
  for (const [square, kind] of highlights.value) {
    const coords = squareToCoords(square as SquareKey, 'white')
    if (coords.col === col && coords.row === row) {
      return kind
    }
  }
  return undefined
}

// ─── The loop ────────────────────────────────────────────────────────────────

const MOVE_DELAY = 1400
const RESET_DELAY = 2200

let timer: ReturnType<typeof setTimeout> | undefined

function resetBoard() {
  const fresh = createBoard(props.setup)
  for (const key of Object.keys(board.squares) as SquareKey[]) {
    board.squares[key].piece = fresh.squares[key].piece
  }
  step.value = 0
}

function tick() {
  const moves = props.moves
  if (!moves?.length) {
    return
  }

  if (step.value >= moves.length) {
    resetBoard()
    timer = setTimeout(tick, MOVE_DELAY)
    return
  }

  const [from, to] = moves[step.value]!
  const last = step.value === moves.length - 1
  applyMove(board, from, to, last ? (props.promoteTo ?? null) : null)
  step.value += 1

  timer = setTimeout(tick, step.value >= moves.length ? RESET_DELAY : MOVE_DELAY)
}

onMounted(() => {
  // A looping animation is decoration. Reduced motion gets the position with its squares
  // marked, which is still a complete illustration of the rule.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  if (props.moves?.length) {
    timer = setTimeout(tick, MOVE_DELAY)
  }
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure class="rule-diagram">
    <div
      class="rule-diagram__board"
      :style="{
        '--light-square': boardTheme?.lightSquare,
        '--dark-square': boardTheme?.darkSquare,
      }"
    >
      <div
        v-for="cell in CELLS"
        :key="`${cell.col}-${cell.row}`"
        class="rule-diagram__cell"
        :class="[
          cell.dark ? 'rule-diagram__cell--dark' : 'rule-diagram__cell--light',
          highlightAt(cell.col, cell.row) && `rule-diagram__cell--${highlightAt(cell.col, cell.row)}`,
        ]"
      />

      <img
        v-for="entry in pieces"
        :key="entry.piece.id"
        class="rule-diagram__piece"
        :src="getPieceImage(entry.piece.color, entry.piece.type)"
        :alt="entry.piece.textRepresentation.long"
        :style="{ transform: `translate(${entry.col * 100}%, ${entry.row * 100}%)` }"
      >
    </div>

    <figcaption v-if="label" class="rule-diagram__label">{{ label }}</figcaption>
  </figure>
</template>

<style lang="scss" scoped>
.rule-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-2;
  // Fill the track the layout hands us, but never grow past a readable board size. Both halves
  // matter: without the width, two diagrams side by side size to their content and come out
  // mismatched; without the cap, a diagram in a row swallows the whole line and squeezes the
  // text beside it into an unreadable column.
  width: 100%;
  max-width: $rule-diagram-size;
  margin: 0;

  &__board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    width: 100%;
    max-width: $rule-diagram-size;
    aspect-ratio: 1;
    border-radius: $border-radius-base;
    overflow: hidden;
  }

  &__cell {
    position: relative;

    &--light { background: var(--light-square); }
    &--dark { background: var(--dark-square); }

    // The veils reuse the board's own highlight vocabulary, so a reader who has played a game
    // recognises them without a legend.
    &--origin::after,
    &--target::after,
    &--capture::after,
    &--threat::after,
    &--zone::after {
      content: '';
      position: absolute;
      inset: 0;
    }

    &--origin::after { background: $square-highlight-selected; }
    &--target::after { background: $square-highlight-drop-target; }
    // Same red the board uses for a king in check — here it traces the line of attack.
    &--threat::after { background: $square-highlight-check; }
    &--zone::after { background: $square-highlight-last-move; }

    // A capture reads as a ring around the victim, never a veil that hides it.
    &--capture::after {
      inset: 6%;
      border: 0.18rem solid $square-highlight-drop-target;
      border-radius: $border-radius-full;
      background: none;
    }
  }

  &__piece {
    position: absolute;
    top: 0;
    left: 0;
    width: 12.5%;
    height: 12.5%;
    pointer-events: none;
    user-select: none;
    transition: transform $transition-base ease-in-out;
  }

  &__label {
    font-size: $font-size-xs;
    color: var(--text-muted);
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rule-diagram__piece {
    transition: none;
  }
}
</style>
