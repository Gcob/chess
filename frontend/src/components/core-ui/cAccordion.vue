<script setup lang="ts">
import {ref, useId} from 'vue'
import {ChevronDown} from 'lucide-vue-next'

export interface CAccordionProps {
  title: string
  // Whether the section starts expanded — uncontrolled from then on.
  open?: boolean
}

const props = withDefaults(defineProps<CAccordionProps>(), {
  open: false,
})

const emit = defineEmits<{ toggle: [open: boolean] }>()

const isOpen = ref(props.open)
const panelId = useId()

function toggle() {
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
}
</script>

<template>
  <section class="c-accordion" :class="{ 'c-accordion--open': isOpen }">
    <h3 class="c-accordion__heading">
      <button
        class="c-accordion__trigger"
        type="button"
        :aria-expanded="isOpen"
        :aria-controls="panelId"
        @click="toggle"
      >
        <span v-if="$slots.icon" class="c-accordion__icon"><slot name="icon" /></span>
        <span class="c-accordion__title">{{ title }}</span>
        <ChevronDown class="c-accordion__chevron" :size="18" />
      </button>
    </h3>

    <!-- Height animates through grid-template-rows 0fr → 1fr: no JS measuring, and it works
         whatever the content height turns out to be. The inner wrapper must keep overflow
         hidden, otherwise the content spills while the row is collapsed. -->
    <div :id="panelId" class="c-accordion__panel" role="region">
      <div class="c-accordion__panel-inner">
        <div class="c-accordion__content">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.c-accordion {
  border-bottom: $border-width-thin solid var(--border-color);

  &__heading {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
  }

  &__trigger {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    width: 100%;
    padding: $spacing-3 $spacing-1;
    font-family: $font-family-display;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover {
      color: var(--accent);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    font-size: $font-size-lg;
    line-height: 1;
  }

  &__title {
    flex: 1;
    min-width: 0;
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--text-muted);
    transition: transform $transition-base;
  }

  &--open &__chevron {
    transform: rotate(180deg);
  }

  &__panel {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows $transition-base;
  }

  &--open &__panel {
    grid-template-rows: 1fr;
  }

  &__panel-inner {
    overflow: hidden;
    // A collapsed row still lays out its content, so anything that escapes the row box (focus
    // rings, shadows) would show through — min-height 0 keeps the track honest.
    min-height: 0;
  }

  &__content {
    padding: 0 $spacing-1 $spacing-4;
  }
}

// The open/close travel is decoration; the state change itself must still be instant.
@media (prefers-reduced-motion: reduce) {
  .c-accordion {
    &__panel,
    &__chevron {
      transition: none;
    }
  }
}
</style>
