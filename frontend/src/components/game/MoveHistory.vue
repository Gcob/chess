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

const props = defineProps<{ view: GameView }>()

interface Turn {
  number: number
  white: string
  black?: string
}

// Real history, paired by turn on move color — robust to a black start (future FEN resume).
const turns = computed(() => {
  const result: Turn[] = []
  for (const move of props.view.moves) {
    const last = result[result.length - 1]

    if (move.color === 'black' && last && last.black === undefined) {
      last.black = move.san
      continue
    }

    result.push({
      number: result.length + 1,
      white: move.color === 'white' ? move.san : '…',
      black: move.color === 'black' ? move.san : undefined,
    })
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
