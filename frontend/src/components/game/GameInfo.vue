<template>
  <div class="game-info c-text-sm c-text-muted">
    <div class="game-info__meta">
      <span>{{ timeControl }}</span>
      <span class="game-info__sep" aria-hidden="true">·</span>
      <span>{{ modeLabel }}</span>
    </div>
    <!-- Once the game is over the state line doubles as the way back into the celebration:
         the modal is dismissible, so the result must stay one click away. -->
    <button
      v-if="view.isGameOver"
      class="game-info__state game-info__state--button"
      @click="view.showResult()"
    >
      {{ stateLabel }}
      <Sparkles :size="13" />
    </button>
    <div v-else class="game-info__state">{{ stateLabel }}</div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {Sparkles} from 'lucide-vue-next'
import type {GameView} from '@/composables/useGameView'
import type {GameMode} from '@/types/chess'

const props = defineProps<{ view: GameView }>()

const {t} = useI18n()

// Compact time control, e.g. "5 min + 2 s", "5 min", or "no time limit".
const timeControl = computed(() => {
  const time = props.view.game?.time
  if (!time) {
    return t('newGame.timer.summary.noLimit')
  }

  const base = `${time.minutes} ${t('newGame.timer.minutesSuffix')}`
  if (time.secondsIncrement > 0) {
    return `${base} + ${time.secondsIncrement} ${t('newGame.timer.secondsSuffix')}`
  }

  return base
})

const MODE_KEY: Record<GameMode, string> = {
  'local': 'newGame.mode.local',
  'vs-bot': 'newGame.mode.ai',
  'public-remote': 'newGame.mode.onlineRandom',
  'private-remote': 'newGame.mode.onlinePrivate',
}

const modeLabel = computed(() => {
  const mode = props.view.game?.mode
  return mode ? t(MODE_KEY[mode]) : ''
})

// Compact game state: waiting / whose turn / final result ("White wins — resignation").
const stateLabel = computed(() => {
  const game = props.view.game
  if (!game) {
    return ''
  }

  if (game.status === 'waiting') {
    return t('game.state.waiting')
  }

  if (game.status === 'active') {
    return t(`game.state.turn.${game.activeColor}`)
  }

  if (!game.result) {
    return ''
  }

  const outcome = game.result.winner
    ? t(`game.state.win.${game.result.winner}`)
    : t('game.state.draw')

  return `${outcome}! ${t(`game.state.reason.${game.result.reason}`)}`
})
</script>

<style lang="scss" scoped>
.game-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-1;
  padding: $spacing-1;

  &__meta {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: $spacing-2;
  }

  &__sep {
    color: var(--border-color-strong);
  }

  // The one line that changes during play — slightly emphasized
  &__state {
    color: var(--text-secondary);
    font-weight: $font-weight-semibold;
  }

  &__state--button {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-1 $spacing-3;
    border-radius: $border-radius-full;
    color: var(--celebrate-gold);
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover {
      background-color: color-mix(in srgb, var(--celebrate-gold) 12%, transparent);
    }
  }
}
</style>
