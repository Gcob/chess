<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { Settings, Sun, Moon } from 'lucide-vue-next'

const { locale } = useI18n()
const { theme, toggle: toggleTheme } = useTheme()

const locales = ['fr', 'en'] as const
const isSettingsOpen = ref(false)

function setLocale(lang: typeof locales[number]) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<template>
  <div class="super-top-bar">
    <div class="super-top-bar__actions">
      <button class="super-top-bar__btn" @click="toggleTheme" :aria-label="$t('settings.toggleTheme')">
        <Sun v-if="theme === 'dark'" :size="14" />
        <Moon v-else :size="14" />
      </button>

      <button class="super-top-bar__btn" @click="isSettingsOpen = true" :aria-label="$t('settings.title')">
        <Settings :size="14" />
      </button>

      <div class="super-top-bar__locale">
        <button
          v-for="lang in locales"
          :key="lang"
          class="super-top-bar__locale-btn"
          :class="{ 'is-active': locale === lang }"
          @click="setLocale(lang)"
        >
          {{ lang.toUpperCase() }}
        </button>
      </div>
    </div>

    <cModal v-model="isSettingsOpen" size="sm">
      <template #header>{{ $t('settings.title') }}</template>

      <div class="super-top-bar__settings">
        <label class="c-label">
          <span>{{ $t('settings.theme') }}</span>
          <select class="c-select" :value="theme" @change="toggleTheme">
            <option value="light">{{ $t('settings.themeLight') }}</option>
            <option value="dark">{{ $t('settings.themeDark') }}</option>
          </select>
        </label>

        <hr class="c-divider" />

        <label class="c-label">
          <span>{{ $t('settings.sound') }}</span>
          <input type="checkbox" class="c-checkbox" />
        </label>

        <label class="c-label">
          <span>{{ $t('settings.boardTheme') }}</span>
          <select class="c-select">
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="wood">Wood</option>
          </select>
        </label>

        <label class="c-label">
          <span>{{ $t('settings.pieceStyle') }}</span>
          <select class="c-select">
            <option value="standard">Standard</option>
            <option value="minimalist">Minimalist</option>
            <option value="pixel">Pixel</option>
          </select>
        </label>
      </div>

      <template #footer="{ close }">
        <cButton variant="ter" @click="close">{{ $t('common.close') }}</cButton>
      </template>
    </cModal>
  </div>
</template>

<style lang="scss" scoped>
.super-top-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 $spacing-4;
  height: 40px;
  background-color: var(--surface-topbar);
  transition: background-color $transition-base;

  @include breakpoint-down($breakpoint-sm) {
    height: 52px;
    padding: 0 $spacing-3;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-3;

    @include breakpoint-down($breakpoint-sm) {
      gap: $spacing-4;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--surface-topbar-text);
    padding: $spacing-1;
    border-radius: $border-radius-sm;
    transition: color $transition-fast;

    svg {
      width: 16px;
      height: 16px;

      @include breakpoint-down($breakpoint-sm) {
        width: 20px;
        height: 20px;
      }
    }

    &:hover {
      color: var(--surface-topbar-hover);
    }
  }

  &__locale {
    display: flex;
    gap: $spacing-1;
  }

  &__locale-btn {
    color: var(--surface-topbar-text);
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    padding: $spacing-1 $spacing-2;
    border-radius: $border-radius-sm;
    transition: color $transition-fast;
    letter-spacing: 0.05em;

    @include breakpoint-down($breakpoint-sm) {
      font-size: $font-size-base;
      padding: $spacing-1 $spacing-3;
    }

    &:hover {
      color: var(--surface-topbar-hover);
    }

    &.is-active {
      color: var(--surface-topbar-text-active);
      font-weight: $font-weight-semibold;
    }
  }

  &__settings {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }
}
</style>
