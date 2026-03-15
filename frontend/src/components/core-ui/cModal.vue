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

function onOverlayClick() {
  if (props.closeOnOverlay) {
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

<template>
  <Transition name="c-modal">
    <div
      v-if="modelValue"
      class="c-modal"
    >
      <div class="c-modal__overlay" @click="onOverlayClick" />

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
            <X :size="16" />
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

<script lang="ts">
import { X } from 'lucide-vue-next'

export default {
  components: { X },
}
</script>

<style lang="scss" scoped>
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
    background-color: var(--overlay-bg);
    backdrop-filter: blur(var(--overlay-blur));
    cursor: pointer;
    transition: all $transition-base;
  }

  &__wrapper {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 90svh;
    background: var(--modal-bg);
    border-radius: $border-radius-base;
    box-shadow: var(--modal-shadow);
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
    border-bottom: $border-width-thin solid var(--border-color);
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: $border-radius-full;
    color: var(--text-muted);
    transition: all $transition-fast;

    &:hover {
      background-color: var(--bg-hover);
      color: var(--text-primary);
      transform: scale(1.1);
    }
  }

  &__content {
    flex: 1;
    padding: $spacing-4;
    overflow: auto;
    color: var(--text-secondary);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-top: $border-width-thin solid var(--border-color);
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
    backdrop-filter: blur(0);
  }
}

.c-modal-leave-to {
  .c-modal__wrapper {
    transform: translateY(2rem);
    opacity: 0;
  }

  .c-modal__overlay {
    background-color: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0);
  }
}
</style>
