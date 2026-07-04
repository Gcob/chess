<template>
  <div class="game-info c-text-sm c-text-muted">
    <span>{{ timeControl }}</span>
    <span class="game-info__sep" aria-hidden="true">·</span>
    <span>{{ modeLabel }}</span>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
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
</script>

<style lang="scss" scoped>
.game-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: $spacing-2;

  &__sep {
    color: var(--border-color-strong);
  }
}
</style>
