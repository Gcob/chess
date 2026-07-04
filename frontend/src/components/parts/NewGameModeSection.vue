<template>
  <section class="mode-section">
    <h2 class="c-h4">{{ $t('newGame.mode.title') }}</h2>
    <div class="mode-section__modes">
      <button
        v-for="m in modes"
        :key="m.value"
        class="mode-section__card"
        :class="{ 'is-selected': settings.mode === m.value, 'is-disabled': !m.available }"
        :disabled="!m.available"
        type="button"
        @click="m.available && (settings.mode = m.value)"
      >
        <div class="mode-section__icon">
          <component :is="m.icon" :size="22" />
        </div>
        <div class="mode-section__body">
          <span class="mode-section__title">{{ $t(m.titleKey) }}</span>
          <span class="mode-section__desc">{{ $t(m.descKey) }}</span>
        </div>
        <span v-if="!m.available" class="mode-section__badge">
          {{ $t('newGame.mode.comingSoon') }}
        </span>
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import {Users, Bot, Globe, Link} from 'lucide-vue-next'
import type {Component} from 'vue'
import type {GameMode} from '@/types/chess'
import type {NewGameSettings} from '@/stores/useNewGameStore'

defineProps<{ settings: NewGameSettings }>()

interface ModeOption {
  value: GameMode
  icon: Component
  titleKey: string
  descKey: string
  available: boolean
}

const modes: ModeOption[] = [
  {value: 'local', icon: Users, titleKey: 'newGame.mode.local', descKey: 'newGame.mode.localDesc', available: true},
  {value: 'vs-bot', icon: Bot, titleKey: 'newGame.mode.ai', descKey: 'newGame.mode.aiDesc', available: false},
  {value: 'public-remote', icon: Globe, titleKey: 'newGame.mode.onlineRandom', descKey: 'newGame.mode.onlineRandomDesc', available: false},
  {value: 'private-remote', icon: Link, titleKey: 'newGame.mode.onlinePrivate', descKey: 'newGame.mode.onlinePrivateDesc', available: false},
]
</script>

<style lang="scss" scoped>
.mode-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__modes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-3;

    @include breakpoint-down($breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
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

  &__icon {
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  &__desc {
    font-size: $font-size-xs;
    color: var(--text-muted);
    line-height: $line-height-base;
  }

  &__badge {
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
}
</style>
