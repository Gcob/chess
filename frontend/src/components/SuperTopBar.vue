<template>
  <div class="super-top-bar">
    <div class="super-top-bar__actions">
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
        <label class="super-top-bar__setting">
          <span>{{ $t('settings.sound') }}</span>
          <input type="checkbox" />
        </label>

        <label class="super-top-bar__setting">
          <span>{{ $t('settings.boardTheme') }}</span>
          <select>
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="wood">Wood</option>
          </select>
        </label>

        <label class="super-top-bar__setting">
          <span>{{ $t('settings.pieceStyle') }}</span>
          <select>
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

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Settings } from 'lucide-vue-next'

const { locale } = useI18n()

const locales = ['fr', 'en'] as const
const isSettingsOpen = ref(false)

function setLocale(lang: typeof locales[number]) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<style lang="scss">
.super-top-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 $spacing-4;
  height: 32px;
  background-color: $color3;
  color: #fff;

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: $spacing-1;
    border-radius: $border-radius-sm;
    transition: color $transition-fast;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }
  }

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

  &__settings {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-4;
    font-size: $font-size-sm;
    color: $color3;
    cursor: pointer;
  }
}
</style>
