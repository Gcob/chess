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
  margin: $spacing-sm;
  padding: $spacing-3 $spacing-6;
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
    outline: 2px solid $color1;
    outline-offset: 2px;
  }

  // --- Variants ---

  &--main {
    color: #fff;
    background-color: $color1;

    &:hover:not(.c-button--disabled) {
      background-color: darken($color1, 8%);
    }

    &:active:not(.c-button--disabled) {
      background-color: darken($color1, 12%);
    }
  }

  &--sec {
    color: $color1;
    background-color: transparent;
    border-color: $color1;

    &:hover:not(.c-button--disabled) {
      color: #fff;
      background-color: $color1;
    }
  }

  &--ter {
    color: $color3;
    background-color:  rgba($color3, 0.04);

    &:hover:not(.c-button--disabled) {
      background-color: rgba($color3, 0.08);
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
