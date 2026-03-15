
<template>
  <Transition name="c-modal">
    <div
      v-if="modelValue"
      class="c-modal"
      @click="onOverlayClick"
    >
      <div class="c-modal__overlay" />

      <div
        ref="modalRef"
        class="c-modal__wrapper"
        :class="`c-modal__wrapper--${size}`"
        role="dialog"
        aria-modal="true"
      >
        <div v-if="$slots.header" class="c-modal__header">
          <div class="c-modal__header-content">
            <slot name="header" />
          </div>
          <button class="c-modal__close" @click="close" :aria-label="$t('common.close')">
            ✕
          </button>
        </div>

        <div class="c-modal__content">
          <slot />
        </div>

        <div v-if="$slots.footer" class="c-modal__footer">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref } from 'vue'

export interface CModalProps {
  modelValue: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
}

const props = withDefaults(defineProps<CModalProps>(), {
  size: 'md',
  closeOnOverlay: true,
  closeOnEsc: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalRef = ref<HTMLElement | null>(null)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick(e: MouseEvent) {
  if (props.closeOnOverlay && e.target === e.currentTarget) {
    close()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (props.closeOnEsc && e.key === 'Escape') {
    close()
  }
}

watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" >
.c-modal {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-4;

  &__overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.1);
    transition: background-color $transition-base;
  }

  &__wrapper {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 90svh;
    background: #fff;
    border-radius: $border-radius-base;
    box-shadow: $shadow-xl;
    transition: all $transition-base;

    &--sm { max-width: 28rem; }
    &--md { max-width: 36rem; }
    &--lg { max-width: 48rem; }
    &--xl { max-width: 64rem; }
    &--full {
      width: calc(100vw - #{$spacing-8});
      height: calc(100svh - #{$spacing-8});
      max-width: none;
      max-height: none;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-3 $spacing-4;
    border-bottom: $border-width-thin solid rgba($color3, 0.1);
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color3;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: $border-radius-full;
    font-size: $font-size-sm;
    color: rgba($color3, 0.5);
    transition: all $transition-fast;

    &:hover {
      background-color: rgba($color3, 0.06);
      color: $color3;
      transform: scale(1.1);
    }
  }

  &__content {
    flex: 1;
    padding: $spacing-4;
    overflow: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-top: $border-width-thin solid rgba($color3, 0.1);
  }
}

// --- Transitions ---

.c-modal-enter-active,
.c-modal-leave-active {
  transition: all $transition-base;

  .c-modal__wrapper {
    transition: all $transition-base;
  }

  .c-modal__overlay {
    transition: all $transition-base;
  }
}

.c-modal-enter-from {
  .c-modal__wrapper {
    transform: translateY(-2rem);
    opacity: 0;
  }

  .c-modal__overlay {
    background-color: rgba(0, 0, 0, 0);
  }
}

.c-modal-leave-to {
  .c-modal__wrapper {
    transform: translateY(2rem);
    opacity: 0;
  }

  .c-modal__overlay {
    background-color: rgba(0, 0, 0, 0);
  }
}
</style>
