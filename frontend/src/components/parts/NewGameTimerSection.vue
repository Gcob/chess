<template>
  <section class="timer-section">
    <h2 class="c-h4">{{ $t('newGame.timer.title') }}</h2>
    <label class="c-label">
      <span>{{ $t('newGame.timer.enabled') }}</span>
      <input type="checkbox" class="c-checkbox" v-model="settings.timerEnabled" />
    </label>

    <Transition
      name="timer-fields"
      @enter="onTimerEnter"
      @after-enter="onTimerAfterEnter"
      @before-leave="onTimerBeforeLeave"
      @leave="onTimerLeave"
    >
      <div v-if="settings.timerEnabled" class="timer-section__collapse">
        <div class="timer-section__fields">
          <label class="c-label">
            <span>{{ $t('newGame.timer.minutes') }}</span>
            <select class="c-select" v-model.number="settings.timerMinutes">
              <option v-for="m in timerMinuteOptions" :key="m" :value="m">
                {{ m }} {{ $t('newGame.timer.minutesSuffix') }}
              </option>
            </select>
          </label>
          <label class="c-label">
            <span>{{ $t('newGame.timer.increment') }}</span>
            <select class="c-select" v-model.number="settings.timerIncrement">
              <option v-for="s in timerIncrementOptions" :key="s" :value="s">
                {{ s }} {{ $t('newGame.timer.secondsSuffix') }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </Transition>

    <p class="timer-section__summary c-text-sm c-text-muted">
      {{ timerSummary }}
    </p>
  </section>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import type {NewGameSettings} from '@/stores/useNewGameStore'

const props = defineProps<{ settings: NewGameSettings }>()

const {t} = useI18n()

const timerMinuteOptions = [1, 3, 5, 10, 15, 30, 60]
const timerIncrementOptions = [0, 1, 2, 3, 5, 10]

// Collapse animation driven by an explicit pixel height: smoother than
// animating grid-template-rows, which forces a janky per-frame relayout.
function onTimerEnter(el: Element) {
  const node = el as HTMLElement
  node.style.height = '0'
  void node.offsetHeight // force reflow so the transition picks up the change
  node.style.height = `${node.scrollHeight}px`
}

function onTimerAfterEnter(el: Element) {
  ;(el as HTMLElement).style.height = 'auto'
}

function onTimerBeforeLeave(el: Element) {
  const node = el as HTMLElement
  node.style.height = `${node.scrollHeight}px`
  void node.offsetHeight
}

function onTimerLeave(el: Element) {
  ;(el as HTMLElement).style.height = '0'
}

const timerSummary = computed(() => {
  if (!props.settings.timerEnabled) {
    return t('newGame.timer.summary.noLimit')
  }

  const min = props.settings.timerMinutes
  const inc = props.settings.timerIncrement
  if (inc === 0) {
    return t('newGame.timer.summary.noIncrement', {min})
  }

  return t('newGame.timer.summary.withIncrement', {min, inc})
})
</script>

<style lang="scss" scoped>
.timer-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__collapse {
    overflow: hidden;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    padding: $spacing-4;
    background: var(--bg-secondary);
    border-radius: $border-radius-base;
    border: $border-width-thin solid var(--border-color);
  }

  &__summary {
    margin: 0;
    font-style: italic;
  }
}

.timer-fields-enter-active,
.timer-fields-leave-active {
  transition: height $transition-base, opacity $transition-base;
}

.timer-fields-enter-from,
.timer-fields-leave-to {
  opacity: 0;
}
</style>
