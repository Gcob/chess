<template>
  <div class="new-game-form">

    <!-- Section 1 — Game mode -->
    <section class="new-game-form__section">
      <h2 class="c-h4">{{ $t('newGame.mode.title') }}</h2>
      <div class="new-game-form__modes">
        <button
          v-for="m in modes"
          :key="m.value"
          class="new-game-form__mode-card"
          :class="{
            'is-selected': settings.mode === m.value,
            'is-disabled': !m.available,
          }"
          :disabled="!m.available"
          @click="m.available && (settings.mode = m.value)"
          type="button"
        >
          <div class="new-game-form__mode-icon">
            <component :is="m.icon" :size="22"/>
          </div>
          <div class="new-game-form__mode-body">
            <span class="new-game-form__mode-title">{{ $t(m.titleKey) }}</span>
            <span class="new-game-form__mode-desc">{{ $t(m.descKey) }}</span>
          </div>
          <span v-if="!m.available" class="new-game-form__mode-badge">
            {{ $t('newGame.mode.comingSoon') }}
          </span>
        </button>
      </div>
    </section>

    <!-- Section 2 — Players -->
    <section class="new-game-form__section">
      <h2 class="c-h4">{{ $t('newGame.players.title') }}</h2>
      <div class="new-game-form__players">
        <label class="c-label new-game-form__player">
          <span class="new-game-form__player-label">
            <span class="new-game-form__piece">♔</span>
            {{ $t('newGame.players.white') }}
          </span>
          <input
            class="c-input"
            type="text"
            v-model="settings.playerWhiteName"
            :placeholder="$t('newGame.players.whitePlaceholder')"
          />
        </label>
        <label class="c-label new-game-form__player">
          <span class="new-game-form__player-label">
            <span class="new-game-form__piece">♚</span>
            {{ $t('newGame.players.black') }}
          </span>
          <input
            class="c-input"
            type="text"
            v-model="settings.playerBlackName"
            :placeholder="$t('newGame.players.blackPlaceholder')"
          />
        </label>
      </div>
    </section>

    <!-- Section 3 — Timer -->
    <section class="new-game-form__section">
      <h2 class="c-h4">{{ $t('newGame.timer.title') }}</h2>
      <label class="c-label">
        <span>{{ $t('newGame.timer.enabled') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="settings.timerEnabled"/>
      </label>

      <div v-if="settings.timerEnabled" class="new-game-form__timer-fields">
        <label class="c-label">
          <span>{{ $t('newGame.timer.minutes') }}</span>
          <select class="c-select" v-model.number="settings.timerMinutes">
            <option v-for="m in timerMinuteOptions" :key="m" :value="m">
              {{ m }} {{ $t('newGame.timer.minutesSuffix') }}
            </option>
          </select>
        </label>
        <label class="c-label">
          <span>{{ $t('newGame.timer.increment') }}</span>
          <select class="c-select" v-model.number="settings.timerIncrement">
            <option v-for="s in timerIncrementOptions" :key="s" :value="s">
              {{ s }} {{ $t('newGame.timer.secondsSuffix') }}
            </option>
          </select>
        </label>
      </div>

      <p class="new-game-form__timer-summary c-text-sm c-text-muted">
        {{ timerSummary }}
      </p>
    </section>

    <!-- Section 4 — Actions -->
    <div class="new-game-form__actions">
      <cButton variant="ter" :to="{ name: 'home' }">{{ $t('common.cancel') }}</cButton>
      <cButton @click="$emit('start')">{{ $t('newGame.startButton') }}</cButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {Users, Bot, Globe, Link} from 'lucide-vue-next'
import {useNewGameStore} from '@/stores/useNewGameStore'
import type {GameMode} from '@/stores/useNewGameStore'
import type {Component} from 'vue'

const {t} = useI18n()
const store = useNewGameStore()
const {settings} = storeToRefs(store)

defineEmits<{ start: [] }>()

interface ModeOption {
  value: GameMode
  icon: Component
  titleKey: string
  descKey: string
  available: boolean
}

const modes: ModeOption[] = [
  {
    value: 'local',
    icon: Users,
    titleKey: 'newGame.mode.local',
    descKey: 'newGame.mode.localDesc',
    available: true
  },
  {
    value: 'ai',
    icon: Bot,
    titleKey: 'newGame.mode.ai',
    descKey: 'newGame.mode.aiDesc',
    available: false
  },
  {
    value: 'online-random',
    icon: Globe,
    titleKey: 'newGame.mode.onlineRandom',
    descKey: 'newGame.mode.onlineRandomDesc',
    available: false
  },
  {
    value: 'online-private',
    icon: Link,
    titleKey: 'newGame.mode.onlinePrivate',
    descKey: 'newGame.mode.onlinePrivateDesc',
    available: false
  },
]

const timerMinuteOptions = [1, 3, 5, 10, 15, 30, 60]
const timerIncrementOptions = [0, 1, 2, 3, 5, 10]

const timerSummary = computed(() => {
  if (!settings.value.timerEnabled) {
    return t('newGame.timer.summary.noLimit')
  }
  const min = settings.value.timerMinutes
  const inc = settings.value.timerIncrement
  if (inc === 0) {
    return t('newGame.timer.summary.noIncrement', {min})
  }
  return t('newGame.timer.summary.withIncrement', {min, inc})
})
</script>

<style lang="scss" scoped>
.new-game-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  width: 100%;
  max-width: 36rem;
  padding-bottom: $spacing-4;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  // --- Mode cards ---

  &__modes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-3;

    @include breakpoint-down($breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }

  &__mode-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    padding: $spacing-4;
    background: var(--bg-elevated);
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-base;
    cursor: pointer;
    text-align: left;
    transition: border-color $transition-fast, background $transition-fast;

    &:hover:not(.is-disabled) {
      border-color: var(--accent);
      background: var(--bg-hover);
    }

    &.is-selected {
      border-color: var(--accent);
      background: var(--accent-subtle);
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__mode-icon {
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__mode-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__mode-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  &__mode-desc {
    font-size: $font-size-xs;
    color: var(--text-muted);
    line-height: $line-height-base;
  }

  &__mode-badge {
    position: absolute;
    top: $spacing-2;
    right: $spacing-2;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border: $border-width-thin solid var(--border-color);
    border-radius: $border-radius-full;
    padding: 1px $spacing-2;
    white-space: nowrap;
  }

  // --- Players ---

  &__players {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__player {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-2;

    .c-input {
      width: 100%;
    }
  }

  &__player-label {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-weight: $font-weight-medium;
    color: var(--text-primary);
  }

  &__piece {
    font-size: $font-size-lg;
    line-height: 1;
  }

  // --- Timer ---

  &__timer-fields {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    padding: $spacing-4;
    background: var(--bg-secondary);
    border-radius: $border-radius-base;
    border: $border-width-thin solid var(--border-color);
  }

  &__timer-summary {
    margin: 0;
    font-style: italic;
  }

  // --- Actions ---

  &__actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-3;
    padding: $spacing-4 0;
  }
}
</style>
