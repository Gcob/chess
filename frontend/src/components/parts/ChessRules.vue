<script setup lang="ts">
import {Crown, Flag, Lightbulb, Swords, Target} from 'lucide-vue-next'
import RuleDiagram from '@/components/parts/RuleDiagram.vue'
import {
  CHECK_DIAGRAM,
  END_DIAGRAMS,
  PIECE_DIAGRAMS,
  SPECIAL_DIAGRAMS,
  TIP_DIAGRAMS,
} from '@/components/parts/ruleDiagrams'
import {PIECE_DATA} from '@/engine/piece'
import {useChessTheme} from '@/composables/useChessTheme'
import type {PieceType} from '@/types/chess'

// Piece order: the board's own hierarchy, king first.
const {getPieceImage} = useChessTheme()

const PIECES: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']

// Castling is handled on its own: the two sides look different enough to deserve a diagram each.
const SPECIALS = ['enPassant', 'promotion'] as const

const WIN_REASONS = ['Checkmate', 'Resignation', 'Timeout'] as const
const DRAW_REASONS = ['Stalemate', 'Agreement', 'FiftyMove', 'Repetition', 'Material'] as const

// Only the endings you can actually see on a board get one.
const END_DIAGRAM_FOR: Record<string, typeof END_DIAGRAMS[string] | undefined> = {
  Checkmate: END_DIAGRAMS.checkmate,
  Stalemate: END_DIAGRAMS.stalemate,
  Material: END_DIAGRAMS.insufficientMaterial,
}

// The values shown are read from the engine, never retyped — the same numbers that drive the
// material difference on the player cards.
const VALUES: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn']

// Ordered by what a beginner needs first. Blunders open, because they decide more games than
// anything else; the pin closes, because it is the only one that asks you to reason about a
// piece that cannot move — confusing before the basics are in place.
const TIPS = [
  {key: 'tipBlunder', diagram: TIP_DIAGRAMS.blunder},
  {key: 'tipCentre', diagram: TIP_DIAGRAMS.centre},
  {key: 'tipDevelop', diagram: TIP_DIAGRAMS.develop},
  {key: 'tipPin', diagram: TIP_DIAGRAMS.pin},
]
</script>

<template>
  <div class="chess-rules">
    <p class="chess-rules__intro">{{ $t('chessRules.intro') }}</p>

    <cAccordion :title="$t('chessRules.objectiveTitle')" open>
      <template #icon><Target :size="18" /></template>
      <p>{{ $t('chessRules.objectiveText') }}</p>

      <h4 class="chess-rules__group">{{ $t('chessRules.captureTitle') }}</h4>
      <p>{{ $t('chessRules.captureText') }}</p>

      <h4 class="chess-rules__group">{{ $t('chessRules.setupTitle') }}</h4>
      <p>{{ $t('chessRules.setupText') }}</p>
    </cAccordion>

    <cAccordion :title="$t('chessRules.piecesTitle')">
      <template #icon><Crown :size="18" /></template>
      <p class="chess-rules__hint">{{ $t('chessRules.piecesIntro') }}</p>

      <div class="chess-rules__cards">
        <article v-for="piece in PIECES" :key="piece" class="chess-rules__card">
          <h4 class="chess-rules__card-title chess-rules__card-title--piece">
            <img
              class="chess-rules__sprite"
              :src="getPieceImage('white', piece)"
              alt=""
              aria-hidden="true"
            >
            {{ $t(`chessRules.${piece}`) }}
          </h4>
          <RuleDiagram v-bind="PIECE_DIAGRAMS[piece]!" />
          <p class="chess-rules__card-body">{{ $t(`chessRules.${piece}Text`) }}</p>
        </article>
      </div>
    </cAccordion>

    <cAccordion :title="$t('chessRules.valuesTitle')">
      <template #icon><span aria-hidden="true">⚖️</span></template>
      <p>{{ $t('chessRules.valuesText') }}</p>
      <ul class="chess-rules__values">
        <li v-for="piece in VALUES" :key="piece" class="chess-rules__value">
          <img class="chess-rules__value-sprite" :src="getPieceImage('white', piece)" alt="" aria-hidden="true">
          <span class="chess-rules__value-name">{{ $t(`chessRules.${piece}`) }}</span>
          <span class="chess-rules__value-number">{{ PIECE_DATA[piece].value }}</span>
        </li>
      </ul>
      <p class="chess-rules__hint">{{ $t('chessRules.valuesKing') }}</p>
    </cAccordion>

    <cAccordion :title="$t('chessRules.checkTitle')">
      <template #icon><Swords :size="18" /></template>
      <p>{{ $t('chessRules.checkText') }}</p>
      <ol class="chess-rules__list">
        <li>{{ $t('chessRules.checkEscape1') }}</li>
        <li>{{ $t('chessRules.checkEscape2') }}</li>
        <li>{{ $t('chessRules.checkEscape3') }}</li>
      </ol>
      <p class="chess-rules__spaced">{{ $t('chessRules.checkNoEscape') }}</p>

      <RuleDiagram v-bind="CHECK_DIAGRAM" :label="$t('chessRules.checkDiagram')" class="chess-rules__solo" />
    </cAccordion>

    <cAccordion :title="$t('chessRules.specialTitle')">
      <template #icon><span aria-hidden="true">✨</span></template>
      <article class="chess-rules__castling">
        <h4 class="chess-rules__card-title">{{ $t('chessRules.castling') }}</h4>
        <p>{{ $t('chessRules.castlingText') }}</p>
        <div class="chess-rules__castling-pair">
          <RuleDiagram
            v-bind="SPECIAL_DIAGRAMS.castlingKingSide!"
            :label="$t('chessRules.castlingKingSide')"
          />
          <RuleDiagram
            v-bind="SPECIAL_DIAGRAMS.castlingQueenSide!"
            :label="$t('chessRules.castlingQueenSide')"
          />
        </div>
      </article>

      <div class="chess-rules__cards">
        <article v-for="special in SPECIALS" :key="special" class="chess-rules__card">
          <h4 class="chess-rules__card-title">{{ $t(`chessRules.${special}`) }}</h4>
          <RuleDiagram v-bind="SPECIAL_DIAGRAMS[special]!" />
          <p class="chess-rules__card-body">{{ $t(`chessRules.${special}Text`) }}</p>
        </article>
      </div>
    </cAccordion>

    <cAccordion :title="$t('chessRules.tipsTitle')">
      <template #icon><Lightbulb :size="18" /></template>
      <p class="chess-rules__hint">{{ $t('chessRules.tipsIntro') }}</p>

      <!-- One shape for all four, whether or not a tip carries a diagram: mixing two layouts
           was what made the indentation read as broken. -->
      <!-- Same card layout as the pieces (diagram left, prose right), plus a rank number: the
           tips are ordered, and the first one is the one that decides beginner games. -->
      <ul class="chess-rules__tips">
        <li v-for="tip in TIPS" :key="tip.key" class="chess-rules__card chess-rules__tip">
          <h4 class="chess-rules__card-title chess-rules__tip-title">
            {{ $t(`chessRules.${tip.key}`) }}
          </h4>
          <RuleDiagram v-if="tip.diagram" v-bind="tip.diagram" />
          <p class="chess-rules__card-body">{{ $t(`chessRules.${tip.key}Text`) }}</p>
        </li>
      </ul>
    </cAccordion>

    <cAccordion :title="$t('chessRules.endTitle')">
      <template #icon><Flag :size="18" /></template>

      <p>{{ $t('chessRules.endIntro') }}</p>

      <!-- Same card layout again. Only three of the eight endings carry a diagram: the other
           five (resignation, timeout, agreement, fifty moves, repetition) are decisions or
           counters, not positions — there is nothing on a board to point at. -->
      <h4 class="chess-rules__group">{{ $t('chessRules.endWinTitle') }}</h4>
      <ul class="chess-rules__endings">
        <li v-for="reason in WIN_REASONS" :key="reason" class="chess-rules__card">
          <h5 class="chess-rules__card-title">{{ $t(`chessRules.end${reason}`) }}</h5>
          <RuleDiagram v-if="END_DIAGRAM_FOR[reason]" v-bind="END_DIAGRAM_FOR[reason]!" />
          <p class="chess-rules__card-body">{{ $t(`chessRules.end${reason}Text`) }}</p>
        </li>
      </ul>

      <h4 class="chess-rules__group">{{ $t('chessRules.endDrawTitle') }}</h4>
      <ul class="chess-rules__endings">
        <li v-for="reason in DRAW_REASONS" :key="reason" class="chess-rules__card">
          <h5 class="chess-rules__card-title">{{ $t(`chessRules.end${reason}`) }}</h5>
          <RuleDiagram v-if="END_DIAGRAM_FOR[reason]" v-bind="END_DIAGRAM_FOR[reason]!" />
          <p class="chess-rules__card-body">{{ $t(`chessRules.end${reason}Text`) }}</p>
        </li>
      </ul>
    </cAccordion>
  </div>
</template>

<style lang="scss">
.chess-rules {
  // The sticky headings need an opaque fill that also reads as a step up from the modal surface.
  // Mixing the text colour in works in both themes at once: it darkens on white, lightens on
  // slate, because --text-primary flips with the theme.
  --accordion-heading-bg: #{color-mix(in srgb, var(--text-primary) 7%, var(--modal-bg))};
  // What sits behind the accordion — painted into the gap above each sticky heading, so that
  // gap is opaque instead of a window onto the scrolling content.
  --accordion-surface: var(--modal-bg);

  // The modal renders us flush (no padding on the scrolling box, so the sticky headings can pin
  // to its very top) — which makes the spacing ours to own.
  padding: $spacing-4;

  // The modal content is mono by default; long-form reading wants the body face.
  font-family: $font-family-base;
  color: var(--text-secondary);
  line-height: $line-height-relaxed;

  &__intro {
    margin-bottom: $spacing-4;
    font-size: $font-size-sm;
    color: var(--text-muted);
  }

  &__hint {
    margin-bottom: $spacing-4;
    font-size: $font-size-sm;
    color: var(--text-muted);
  }

  &__spaced {
    margin-top: $spacing-3;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: $spacing-6;
  }

  // Mobile reads in DOM order — title, diagram, then prose — because naming the thing before
  // showing it is what makes the diagram legible. Wide screens re-place the same three children
  // on a grid: board on the left spanning both rows, title and prose stacked on the right.
  // A grid (not a flex row) is what lets the title move across the layout without moving in the
  // DOM, so the reading order stays right on every screen.
  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-3;

    // The prose and the title span the full width on mobile; only the board is centred.
    > .chess-rules__card-title,
    > .chess-rules__card-body {
      align-self: stretch;
    }

    @include md {
      display: grid;
      // A DEFINITE first column: the diagram sizes itself with width:100%, which collapses to
      // zero inside an `auto` track (the track waits on the content, the content waits on the
      // track). The second track takes whatever is left.
      grid-template-columns: $rule-diagram-size 1fr;
      grid-template-rows: auto 1fr;
      align-items: start;
      column-gap: $spacing-5;
      row-gap: $spacing-1;

      .rule-diagram {
        grid-column: 1;
        grid-row: 1 / -1;
      }
    }
  }

  &__card-title {
    @include md {
      grid-column: 2;
      grid-row: 1;
    }
  }

  &__card-body {
    @include md {
      grid-column: 2;
      grid-row: 2;
    }
  }

  // A card with no diagram has nothing in the first column: collapse it so the text does not
  // sit behind a phantom gutter.
  &__card:not(:has(.rule-diagram)) {
    @include md {
      grid-template-columns: 1fr;

      .chess-rules__card-title,
      .chess-rules__card-body {
        grid-column: 1;
      }
    }
  }

  &__sprite {
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
  }

  &__card-title--piece {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-lg;
  }

  &__card-title {
    align-self: start;
    font-family: $font-family-display;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  &__tips {
    display: flex;
    flex-direction: column;
    gap: $spacing-6;
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: tip;
  }

  &__tip {
    counter-increment: tip;
  }

  // The rank rides with the title, inside the prose column — a plate floated beside the card
  // would collide with the diagram once the two sit side by side.
  &__tip-title {
    display: flex;
    align-items: center;
    gap: $spacing-2;

    &::before {
      content: counter(tip);
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: $border-radius-full;
      background: var(--accent-subtle);
      color: var(--accent);
      font-family: $font-family-mono;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      line-height: 1;
    }
  }

  &__list {
    margin: $spacing-3 0 0 $spacing-5;
    list-style: decimal;

    li {
      margin-bottom: $spacing-1;
    }
  }

  &__values {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2;
    margin: $spacing-3 0;
    list-style: none;
  }

  // Cards rather than chips, now that each one shows the piece itself.
  &__value {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-1;
    min-width: 5rem;
    padding: $spacing-3 $spacing-2;
    border: $border-width-thin solid var(--border-color);
    border-radius: $border-radius-base;
    font-size: $font-size-sm;
  }

  &__value-sprite {
    width: 3rem;
    height: 3rem;
  }

  &__value-name {
    color: var(--text-secondary);
  }

  &__value-number {
    font-family: $font-family-mono;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--accent);
  }

  // A diagram with no text beside it — centred, and not full width on a wide modal.
  &__solo {
    margin: $spacing-4 auto 0;
  }

  &__castling {
    margin-bottom: $spacing-6;
  }

  &__castling-pair {
    display: grid;
    grid-template-columns: 1fr;
    align-items: start;
    justify-items: center;
    gap: $spacing-4;
    margin-top: $spacing-4;

    @include md {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__endings {
    display: flex;
    flex-direction: column;
    gap: $spacing-6;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__group {
    margin: $spacing-5 0 $spacing-2;
    font-family: $font-family-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);

    &:first-child {
      margin-top: 0;
    }
  }


}
</style>
