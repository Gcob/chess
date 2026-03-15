<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const locales = ['fr', 'en'] as const

function setLocale(lang: typeof locales[number]) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<template>
  <div class="super-top-bar">
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
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.super-top-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 $spacing-4;
  height: 32px;
  background-color: $color3;
  color: #fff;

  &__locale {
    display: flex;
    gap: $spacing-2;
  }

  &__locale-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    cursor: pointer;
    padding: $spacing-1 $spacing-2;
    border-radius: $border-radius-sm;
    transition: color $transition-fast;
    letter-spacing: 0.05em;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    &.is-active {
      color: #fff;
      font-weight: $font-weight-semibold;
    }
  }
}
</style>
