<script setup lang="ts">
import {Crown, Flag, Lightbulb, Swords, Target} from 'lucide-vue-next'
import RuleDiagram from '@/components/parts/RuleDiagram.vue'
import {PIECE_DIAGRAMS, SPECIAL_DIAGRAMS, TIP_DIAGRAMS} from '@/components/parts/ruleDiagrams'
import {PIECE_DATA} from '@/engine/piece'
import type {PieceType} from '@/types/chess'

// Piece order: the board's own hierarchy, king first.
const PIECES: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']

const SPECIALS = ['castling', 'enPassant', 'promotion'] as const

const WIN_REASONS = ['Checkmate', 'Resignation', 'Timeout'] as const
const DRAW_REASONS = ['Stalemate', 'Agreement', 'FiftyMove', 'Repetition', 'Material'] as const

// The values shown are read from the engine, never retyped — the same numbers that drive the
// material difference on the player cards.
const VALUES: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn']
</script>

<template>
  <div class="chess-rules">
    <p class="chess-rules__intro">{{ $t('chessRules.intro') }}</p>

    <cAccordion :title="$t('chessRules.objectiveTitle')" open>
      <template #icon><Target :size="18" /></template>
      <p>{{ $t('chessRules.objectiveText') }}</p>
      <p class="chess-rules__spaced">{{ $t('chessRules.setupText') }}</p>
    </cAccordion>

    <cAccordion :title="$t('chessRules.piecesTitle')">
      <template #icon><Crown :size="18" /></template>
      <p class="chess-rules__hint">{{ $t('chessRules.piecesIntro') }}</p>

      <div class="chess-rules__cards">
        <article v-for="piece in PIECES" :key="piece" class="chess-rules__card">
          <RuleDiagram v-bind="PIECE_DIAGRAMS[piece]!" />
          <div class="chess-rules__card-text">
            <h4 class="chess-rules__card-title">{{ $t(`chessRules.${piece}`) }}</h4>
            <p>{{ $t(`chessRules.${piece}Text`) }}</p>
          </div>
        </article>
      </div>
    </cAccordion>

    <cAccordion :title="$t('chessRules.valuesTitle')">
      <template #icon><span aria-hidden="true">⚖️</span></template>
      <p>{{ $t('chessRules.valuesText') }}</p>
      <ul class="chess-rules__values">
        <li v-for="piece in VALUES" :key="piece" class="chess-rules__value">
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
    </cAccordion>

    <cAccordion :title="$t('chessRules.specialTitle')">
      <template #icon><span aria-hidden="true">✨</span></template>
      <div class="chess-rules__cards">
        <article v-for="special in SPECIALS" :key="special" class="chess-rules__card">
          <RuleDiagram v-bind="SPECIAL_DIAGRAMS[special]!" />
          <div class="chess-rules__card-text">
            <h4 class="chess-rules__card-title">{{ $t(`chessRules.${special}`) }}</h4>
            <p>{{ $t(`chessRules.${special}Text`) }}</p>
          </div>
        </article>
      </div>
    </cAccordion>

    <cAccordion :title="$t('chessRules.tipsTitle')">
      <template #icon><Lightbulb :size="18" /></template>
      <p class="chess-rules__hint">{{ $t('chessRules.tipsIntro') }}</p>

      <div class="chess-rules__tip">
        <h4 class="chess-rules__card-title">{{ $t('chessRules.tipBlunder') }}</h4>
        <p>{{ $t('chessRules.tipBlunderText') }}</p>
      </div>

      <article class="chess-rules__card">
        <RuleDiagram v-bind="TIP_DIAGRAMS.pin!" />
        <div class="chess-rules__card-text">
          <h4 class="chess-rules__card-title">{{ $t('chessRules.tipPin') }}</h4>
          <p>{{ $t('chessRules.tipPinText') }}</p>
        </div>
      </article>

      <article class="chess-rules__card">
        <RuleDiagram v-bind="TIP_DIAGRAMS.centre!" />
        <div class="chess-rules__card-text">
          <h4 class="chess-rules__card-title">{{ $t('chessRules.tipCentre') }}</h4>
          <p>{{ $t('chessRules.tipCentreText') }}</p>
        </div>
      </article>

      <div class="chess-rules__tip">
        <h4 class="chess-rules__card-title">{{ $t('chessRules.tipDevelop') }}</h4>
        <p>{{ $t('chessRules.tipDevelopText') }}</p>
      </div>
    </cAccordion>

    <cAccordion :title="$t('chessRules.endTitle')">
      <template #icon><Flag :size="18" /></template>

      <h4 class="chess-rules__group">{{ $t('chessRules.endWinTitle') }}</h4>
      <dl class="chess-rules__endings">
        <template v-for="reason in WIN_REASONS" :key="reason">
          <dt>{{ $t(`chessRules.end${reason}`) }}</dt>
          <dd>{{ $t(`chessRules.end${reason}Text`) }}</dd>
        </template>
      </dl>

      <h4 class="chess-rules__group">{{ $t('chessRules.endDrawTitle') }}</h4>
      <dl class="chess-rules__endings">
        <template v-for="reason in DRAW_REASONS" :key="reason">
          <dt>{{ $t(`chessRules.end${reason}`) }}</dt>
          <dd>{{ $t(`chessRules.end${reason}Text`) }}</dd>
        </template>
      </dl>
    </cAccordion>
  </div>
</template>

<style lang="scss">
.chess-rules {
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

  // A diagram beside its text on a wide modal, stacked on a narrow one.
  &__cards {
    display: flex;
    flex-direction: column;
    gap: $spacing-6;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    align-items: center;

    @include md {
      flex-direction: row;
      align-items: flex-start;
      gap: $spacing-5;
    }
  }

  &__card-text {
    flex: 1;
    min-width: 0;
  }

  &__card-title {
    margin-bottom: $spacing-1;
    font-family: $font-family-display;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  &__tip {
    margin-bottom: $spacing-6;
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

  &__value {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-1 $spacing-3;
    border: $border-width-thin solid var(--border-color);
    border-radius: $border-radius-full;
    font-size: $font-size-sm;
  }

  &__value-name {
    color: var(--text-secondary);
  }

  &__value-number {
    font-family: $font-family-mono;
    font-weight: $font-weight-semibold;
    color: var(--accent);
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

  &__endings {
    dt {
      font-weight: $font-weight-semibold;
      color: var(--text-primary);
    }

    dd {
      margin: 0 0 $spacing-3;
    }
  }
}
</style>
