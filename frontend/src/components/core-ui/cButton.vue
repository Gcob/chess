<template>
  <component
    :is="tag"
    v-bind="tagProps"
    class="c-button"
    :class="[
      `c-button--${variant}`,
      { 'c-button--disabled': disabled, 'c-button--loading': loading },
    ]"
  >
    <span v-if="loading" class="c-button__spinner" />
    <span class="c-button__content" :class="{ 'c-button__content--hidden': loading }">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export interface CButtonProps {
  variant?: 'main' | 'sec' | 'ter'
  to?: RouteLocationRaw
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<CButtonProps>(), {
  variant: 'main',
  disabled: false,
  loading: false,
})

const tag = computed(() => (props.to ? 'router-link' : 'button'))

const tagProps = computed(() => {
  if (props.to) {
    return { to: props.to }
  }
  return { type: 'button' as const, disabled: props.disabled || props.loading }
})
</script>

<style lang="scss" scoped>
.c-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  padding: $spacing-3 $spacing-6;
  font-family: $font-family-display;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  text-decoration: none;
  border: $border-width-base solid transparent;
  border-radius: $border-radius-base;
  cursor: pointer;
  user-select: none;
  transition: all $transition-fast;
  position: relative;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  // --- Variants ---

  &--main {
    color: var(--text-inverse);
    background-color: var(--accent);

    &:hover:not(.c-button--disabled) {
      background-color: var(--accent-hover);
    }

    &:active:not(.c-button--disabled) {
      background-color: var(--accent-active);
    }
  }

  &--sec {
    color: var(--accent);
    background-color: transparent;
    border-color: var(--accent);

    &:hover:not(.c-button--disabled) {
      color: var(--text-inverse);
      background-color: var(--accent);
    }
  }

  &--ter {
    color: var(--text-secondary);
    background-color: transparent;
    border-color: var(--border-color-strong);

    &:hover:not(.c-button--disabled) {
      color: var(--text-primary);
      background-color: var(--bg-hover);
      border-color: var(--text-muted);
    }
  }

  // --- States ---

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &--loading {
    cursor: wait;
  }

  // --- Children ---

  &__content {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;

    &--hidden {
      visibility: hidden;
    }
  }

  &__spinner {
    position: absolute;
    width: 1em;
    height: 1em;
    border: $border-width-base solid currentColor;
    border-right-color: transparent;
    border-radius: $border-radius-full;
    animation: spin 600ms linear infinite;
  }
}
</style>
