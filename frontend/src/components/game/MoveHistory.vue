<template>
  <div class="move-history">
    <div class="move-history__header">{{ $t('game.history') }}</div>
    <ol class="move-history__list">
      <li v-for="turn in turns" :key="turn.number" class="move-history__turn">
        <span class="move-history__number">{{ turn.number }}.</span>
        <span class="move-history__move">{{ turn.white }}</span>
        <span class="move-history__move">{{ turn.black }}</span>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {GameView} from '@/composables/useGameView'

defineProps<{ view: GameView }>()

// HARDCODED placeholder — replaced by view.moves (SAN) once move recording exists.
const SAMPLE_SANS = [
  'e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7',
  'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8', 'd4', 'Nbd7',
  'Nbd2', 'Bb7', 'Bc2', 'Re8', 'Nf1', 'Bf8', 'Ng3', 'g6', 'a4', 'c5',
]

interface Turn {
  number: number
  white: string
  black?: string
}

const turns = computed(() => {
  const result: Turn[] = []
  for (let i = 0; i < SAMPLE_SANS.length; i += 2) {
    result.push({number: i / 2 + 1, white: SAMPLE_SANS[i]!, black: SAMPLE_SANS[i + 1]})
  }

  return result
})
</script>

<style lang="scss" scoped>
.move-history {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--bg-elevated);
  border: $border-width-base solid var(--border-color);
  border-radius: $border-radius-base;
  overflow: hidden;

  &__header {
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-secondary);
    border-bottom: $border-width-thin solid var(--border-color);
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__turn {
    display: grid;
    grid-template-columns: 2rem 1fr 1fr;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-1 $spacing-3;
    font-family: $font-family-mono;
    font-size: $font-size-sm;

    &:nth-child(odd) {
      background: var(--bg-secondary);
    }
  }

  &__number {
    color: var(--text-muted);
  }

  &__move {
    color: var(--text-primary);
  }
}
</style>
