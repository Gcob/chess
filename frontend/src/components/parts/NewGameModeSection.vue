<template>
  <section class="mode-section">
    <h2 class="c-h4">{{ $t('newGame.mode.title') }}</h2>
    <div class="mode-section__modes">
      <button
        v-for="m in availableModes"
        :key="m.value"
        class="mode-section__card"
        :class="{ 'is-selected': settings.mode === m.value }"
        type="button"
        @click="settings.mode = m.value"
      >
        <div class="mode-section__icon">
          <component :is="m.icon" :size="22" />
        </div>
        <div class="mode-section__body">
          <span class="mode-section__title">{{ $t(m.titleKey) }}</span>
          <span class="mode-section__title mode-section__title--short">{{ $t(m.titleShortKey) }}</span>
          <span class="mode-section__desc">{{ $t(m.descKey) }}</span>
        </div>
      </button>
    </div>

    <!-- Mobile: the tiles drop their per-card description; the selected mode's shows once here. -->
    <p class="mode-section__selected-desc">{{ $t(selected.descKey) }}</p>
  </section>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {Users, Bot, Globe, Link, FlaskConical} from 'lucide-vue-next'
import type {Component} from 'vue'
import {useSettingsStore} from '@/stores/useSettingsStore'
import type {NewGameMode, NewGameSettings} from '@/stores/useNewGameStore'

const props = defineProps<{ settings: NewGameSettings }>()

interface ModeOption {
  value: NewGameMode
  icon: Component
  titleKey: string
  // Tile label on mobile, where the full title wouldn't fit.
  titleShortKey: string
  descKey: string
  available: boolean
}

const modes: ModeOption[] = [
  {value: 'local', icon: Users, titleKey: 'newGame.mode.local', titleShortKey: 'newGame.mode.localShort', descKey: 'newGame.mode.localDesc', available: true},
  {value: 'vs-bot', icon: Bot, titleKey: 'newGame.mode.ai', titleShortKey: 'newGame.mode.aiShort', descKey: 'newGame.mode.aiDesc', available: false},
  {value: 'public-remote', icon: Globe, titleKey: 'newGame.mode.onlineRandom', titleShortKey: 'newGame.mode.onlineRandomShort', descKey: 'newGame.mode.onlineRandomDesc', available: false},
  {value: 'private-remote', icon: Link, titleKey: 'newGame.mode.onlinePrivate', titleShortKey: 'newGame.mode.onlinePrivateShort', descKey: 'newGame.mode.onlinePrivateDesc', available: false},
  {value: 'dev', icon: FlaskConical, titleKey: 'newGame.mode.dev', titleShortKey: 'newGame.mode.devShort', descKey: 'newGame.mode.devDesc', available: true},
]

const settingsStore = useSettingsStore()

// Only playable modes reach the selector — an impossible choice is worse than an absent one.
// Shipping a mode = flipping its `available` flag; its entry above is already wired.
// The dev mode is additionally gated by the devMode setting (its only gate — works in prod builds).
const availableModes = computed(() =>
  modes.filter(m => m.available && (m.value !== 'dev' || settingsStore.settings.devMode)),
)

// A persisted 'dev' selection must not survive the setting being turned off.
if (props.settings.mode === 'dev' && !settingsStore.settings.devMode) {
  props.settings.mode = 'local'
}

const selected = computed(() => modes.find(m => m.value === props.settings.mode)!)
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

    &:hover {
      border-color: var(--accent);
      background: var(--bg-hover);
    }

    &.is-selected {
      border-color: var(--accent);
      background: var(--accent-subtle);
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

    &--short {
      display: none;
    }
  }

  &__desc {
    font-size: $font-size-xs;
    color: var(--text-muted);
    line-height: $line-height-base;
  }

  // The selected mode's description, shown once under the tile row — mobile only.
  &__selected-desc {
    display: none;
    margin: 0;
    font-size: $font-size-xs;
    color: var(--text-muted);
    line-height: $line-height-base;
    text-align: center;
  }

  // Mobile: the cards compact into one row of icon + short-title tiles, all visible at once —
  // the per-card description goes, the selected description line takes over below the row.
  // auto-fit keeps the row honest whatever the number of available modes.
  @include breakpoint-down($breakpoint-sm) {
    &__modes {
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
      gap: $spacing-2;
    }

    &__card {
      flex-direction: column;
      align-items: center;
      padding: $spacing-3 $spacing-1;
    }

    &__icon {
      margin-top: 0;
    }

    &__title {
      display: none;
      text-align: center;

      &--short {
        display: inline;
      }
    }

    &__desc {
      display: none;
    }

    &__selected-desc {
      display: block;
    }
  }
}
</style>
