<template>
  <div class="player-card" :class="{ 'is-active': isActive }">
    <div class="player-card__avatar">
      <PlayerAvatar v-if="player?.metas.image" :id="player.metas.image" />
    </div>

    <div class="player-card__info">
      <div class="player-card__name-row">
        <span class="player-card__name">{{ player?.metas.name }}</span>
        <span class="player-card__color">({{ colorLabel }})</span>
      </div>
      <div class="player-card__captured">
        <CapturedPieces :pieces="capturedPieces" />
        <span v-if="advantage !== 0" class="player-card__material">{{ advantageLabel }}</span>
      </div>
    </div>

    <div class="player-card__clock" v-if="hasClock">{{ clock }}</div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import type {GameView} from '@/composables/useGameView'
import type {PieceColor} from '@/types/chess'
import {materialDiff} from '@/engine/material'
import PlayerAvatar from '@/components/parts/PlayerAvatar.vue'
import CapturedPieces from '@/components/game/CapturedPieces.vue'

const props = defineProps<{ view: GameView; color: PieceColor }>()

const {t} = useI18n()

const player = computed(() => props.view.game?.players[props.color])
const isActive = computed(() => props.view.activeColor === props.color)
const colorLabel = computed(() => t(`newGame.players.${props.color}`))

// Derived once in useGameView from the move history — shared by both cards.
const capturedPieces = computed(() => props.view.captured[props.color])
const advantage = computed(() => materialDiff(props.view.captured, props.color))
const advantageLabel = computed(() => (advantage.value > 0 ? `+${advantage.value}` : String(advantage.value)))

// Static for now — shows the configured starting time. game.time is optional (untimed → dash);
// a real ticking clock comes with the timer.
const hasClock = computed(() => !!props.view.game?.time)
const clock = computed(() => {
  const time = props.view.game?.time
  if (!time) {
    return '—'
  }

  return `${time.minutes}:00`
})
</script>

<style lang="scss" scoped>
.player-card {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-2 $spacing-3;
  background: var(--bg-elevated);
  border: $border-width-base solid var(--border-color);
  border-radius: $border-radius-base;
  transition: border-color $transition-fast, background $transition-fast;

  @include breakpoint-down($breakpoint-lg) {
    gap: $spacing-2;
    padding: $spacing-1 $spacing-2;
  }

  &.is-active {
    border-color: var(--accent);
    background: var(--accent-subtle);
  }

  &__avatar {
    display: flex;
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;

    @include breakpoint-down($breakpoint-lg) {
      width: 2rem;
      height: 2rem;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    flex: 1;
    min-width: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    min-width: 0;

    @include breakpoint-down($breakpoint-lg) {
      gap: $spacing-1;
    }
  }

  &__name {
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    @include text-truncate;

    @include breakpoint-down($breakpoint-lg) {
      font-size: $font-size-sm;
    }
  }

  &__color {
    flex-shrink: 0;
    font-size: $font-size-xs;
    color: var(--text-muted);
  }

  &__captured {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    min-height: 1rem;

    @include breakpoint-down($breakpoint-lg) {
      gap: $spacing-1;
    }
  }

  &__material {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--text-muted);
  }

  &__clock {
    flex-shrink: 0;
    font-family: $font-family-mono;
    font-size: $font-size-lg;
    color: var(--text-primary);

    @include breakpoint-down($breakpoint-lg) {
      font-size: $font-size-base;
    }
  }
}
</style>
