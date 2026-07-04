<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { Settings, Sun, Moon, Home } from 'lucide-vue-next'
import SettingsModal from '@/components/parts/SettingsModal.vue'

const { theme, toggle: toggleTheme } = useTheme()

const isSettingsOpen = ref(false)
</script>

<template>
  <div class="super-top-bar">
    <RouterLink to="/" class="super-top-bar__btn" :aria-label="$t('common.backHome')">
      <Home :size="14" />
    </RouterLink>

    <div class="super-top-bar__actions">
      <button class="super-top-bar__btn" @click="toggleTheme" :aria-label="$t('settings.toggleTheme')">
        <Sun v-if="theme === 'dark'" :size="14" />
        <Moon v-else :size="14" />
      </button>

      <button class="super-top-bar__btn" @click="isSettingsOpen = true" :aria-label="$t('settings.title')">
        <Settings :size="14" />
      </button>
    </div>

    <SettingsModal v-model="isSettingsOpen" />
  </div>
</template>

<style lang="scss" scoped>
.super-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $z-sticky;
  display: flex;
  justify-content: space-between;
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
    text-decoration: none;

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
}
</style>
