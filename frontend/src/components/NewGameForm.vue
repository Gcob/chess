<template>
  <div class="new-game-form">

    <!-- Section 1 — Game mode -->
    <section class="new-game-form__section">
      <h2 class="c-h4">{{ $t('newGame.mode.title') }}</h2>
      <div class="new-game-form__modes">
        <button
          v-for="m in modes"
          :key="m.value"
          class="new-game-form__mode-card"
          :class="{
            'is-selected': settings.mode === m.value,
            'is-disabled': !m.available,
          }"
          :disabled="!m.available"
          @click="m.available && (settings.mode = m.value)"
          type="button"
        >
          <div class="new-game-form__mode-icon">
            <component :is="m.icon" :size="22"/>
          </div>
          <div class="new-game-form__mode-body">
            <span class="new-game-form__mode-title">{{ $t(m.titleKey) }}</span>
            <span class="new-game-form__mode-desc">{{ $t(m.descKey) }}</span>
          </div>
          <span v-if="!m.available" class="new-game-form__mode-badge">
            {{ $t('newGame.mode.comingSoon') }}
          </span>
        </button>
      </div>
    </section>

    <!-- Section 2 — Players -->
    <section class="new-game-form__section">
      <h2 class="c-h4">{{ $t('newGame.players.title') }}</h2>
      <div class="new-game-form__players">
        <div class="new-game-form__player">
          <span class="new-game-form__player-label">
            <span class="new-game-form__piece">♔</span>
            {{ $t('newGame.players.white') }}
          </span>
          <div class="new-game-form__identity">
            <button
              v-tippy="$t('newGame.players.chooseAvatar')"
              type="button"
              class="new-game-form__avatar-frame"
              :aria-label="$t('newGame.players.chooseAvatar')"
              @click="avatarPickerFor = 'white'"
            >
              <PlayerAvatar :id="settings.playerWhiteAvatar" />
            </button>
            <div class="new-game-form__name-row">
              <input
                class="c-input"
                :class="{ 'is-invalid': startAttempted && errors.playerWhiteName }"
                type="text"
                v-model="settings.playerWhiteName"
                :aria-label="$t('newGame.players.white')"
                :placeholder="$t('newGame.players.whitePlaceholder')"
              />
              <button
                v-tippy="$t('newGame.players.randomName')"
                type="button"
                class="new-game-form__dice"
                :aria-label="$t('newGame.players.randomName')"
                @click="generateName('white')"
              >
                <Dices :size="16" />
              </button>
            </div>
          </div>
          <span v-if="startAttempted && errors.playerWhiteName" class="new-game-form__error">
            {{ $t(`newGame.validation.${errors.playerWhiteName}`) }}
          </span>
        </div>

        <div class="new-game-form__player">
          <span class="new-game-form__player-label">
            <span class="new-game-form__piece">♚</span>
            {{ $t('newGame.players.black') }}
          </span>
          <div class="new-game-form__identity">
            <button
              v-tippy="$t('newGame.players.chooseAvatar')"
              type="button"
              class="new-game-form__avatar-frame"
              :aria-label="$t('newGame.players.chooseAvatar')"
              @click="avatarPickerFor = 'black'"
            >
              <PlayerAvatar :id="settings.playerBlackAvatar" />
            </button>
            <div class="new-game-form__name-row">
              <input
                class="c-input"
                :class="{ 'is-invalid': startAttempted && errors.playerBlackName }"
                type="text"
                v-model="settings.playerBlackName"
                :aria-label="$t('newGame.players.black')"
                :placeholder="$t('newGame.players.blackPlaceholder')"
              />
              <button
                v-tippy="$t('newGame.players.randomName')"
                type="button"
                class="new-game-form__dice"
                :aria-label="$t('newGame.players.randomName')"
                @click="generateName('black')"
              >
                <Dices :size="16" />
              </button>
            </div>
          </div>
          <span v-if="startAttempted && errors.playerBlackName" class="new-game-form__error">
            {{ $t(`newGame.validation.${errors.playerBlackName}`) }}
          </span>
        </div>
      </div>

      <AvatarPickerModal
        :model-value="avatarPickerFor !== null"
        :selected="editingAvatar"
        :taken="otherAvatar"
        @update:model-value="(open) => !open && (avatarPickerFor = null)"
        @select="selectAvatar"
      />
    </section>

    <!-- Section 3 — Timer -->
    <section class="new-game-form__section">
      <h2 class="c-h4">{{ $t('newGame.timer.title') }}</h2>
      <label class="c-label">
        <span>{{ $t('newGame.timer.enabled') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="settings.timerEnabled"/>
      </label>

      <Transition
        name="timer-fields"
        @enter="onTimerEnter"
        @after-enter="onTimerAfterEnter"
        @before-leave="onTimerBeforeLeave"
        @leave="onTimerLeave"
      >
        <div v-if="settings.timerEnabled" class="new-game-form__timer-collapse">
          <div class="new-game-form__timer-fields">
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

      <p class="new-game-form__timer-summary c-text-sm c-text-muted">
        {{ timerSummary }}
      </p>
    </section>

    <!-- Section 4 — Actions -->
    <div class="new-game-form__actions">
      <cButton variant="ter" :to="{ name: 'home' }">{{ $t('common.cancel') }}</cButton>
      <cButton @click="handleStart">{{ $t('newGame.startButton') }}</cButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {Users, Bot, Globe, Link, Dices} from 'lucide-vue-next'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {validateNewGamePlayers} from '@/validation/newGame'
import {randomPlayerName} from '@/utils/randomName'
import PlayerAvatar from '@/components/parts/PlayerAvatar.vue'
import AvatarPickerModal from '@/components/parts/AvatarPickerModal.vue'
import type {GameMode} from '@/types/chess'
import type {Component} from 'vue'

const {t, locale} = useI18n()
const store = useNewGameStore()
const {settings} = storeToRefs(store)

const emit = defineEmits<{ start: [] }>()

// Errors are always computed; shown only after a start attempt, then update live as the user fixes.
const startAttempted = ref(false)
// Which player's avatar the modal is editing (null = closed).
const avatarPickerFor = ref<'white' | 'black' | null>(null)
const editingAvatar = computed(() =>
  avatarPickerFor.value === 'black' ? settings.value.playerBlackAvatar : settings.value.playerWhiteAvatar,
)
const otherAvatar = computed(() =>
  avatarPickerFor.value === 'black' ? settings.value.playerWhiteAvatar : settings.value.playerBlackAvatar,
)

function selectAvatar(id: string) {
  if (avatarPickerFor.value === 'white') {
    settings.value.playerWhiteAvatar = id
  } else if (avatarPickerFor.value === 'black') {
    settings.value.playerBlackAvatar = id
  }

  avatarPickerFor.value = null
}

const errors = computed(() =>
  validateNewGamePlayers({
    playerWhiteName: settings.value.playerWhiteName,
    playerBlackName: settings.value.playerBlackName,
    playerWhiteAvatar: settings.value.playerWhiteAvatar,
    playerBlackAvatar: settings.value.playerBlackAvatar,
  }),
)

function handleStart() {
  startAttempted.value = true
  if (Object.keys(errors.value).length === 0) {
    emit('start')
  }
}

// Fills a player's name with a random funny one, retrying so it never matches the other player.
function generateName(color: 'white' | 'black') {
  const other = color === 'white' ? settings.value.playerBlackName : settings.value.playerWhiteName
  let name = randomPlayerName(locale.value)
  for (let guard = 0; name.trim() === other.trim() && guard < 10; guard++) {
    name = randomPlayerName(locale.value)
  }

  if (color === 'white') {
    settings.value.playerWhiteName = name
  } else {
    settings.value.playerBlackName = name
  }
}

interface ModeOption {
  value: GameMode
  icon: Component
  titleKey: string
  descKey: string
  available: boolean
}

const modes: ModeOption[] = [
  {
    value: 'local',
    icon: Users,
    titleKey: 'newGame.mode.local',
    descKey: 'newGame.mode.localDesc',
    available: true
  },
  {
    value: 'vs-bot',
    icon: Bot,
    titleKey: 'newGame.mode.ai',
    descKey: 'newGame.mode.aiDesc',
    available: false
  },
  {
    value: 'public-remote',
    icon: Globe,
    titleKey: 'newGame.mode.onlineRandom',
    descKey: 'newGame.mode.onlineRandomDesc',
    available: false
  },
  {
    value: 'private-remote',
    icon: Link,
    titleKey: 'newGame.mode.onlinePrivate',
    descKey: 'newGame.mode.onlinePrivateDesc',
    available: false
  },
]

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
  if (!settings.value.timerEnabled) {
    return t('newGame.timer.summary.noLimit')
  }
  const min = settings.value.timerMinutes
  const inc = settings.value.timerIncrement
  if (inc === 0) {
    return t('newGame.timer.summary.noIncrement', {min})
  }
  return t('newGame.timer.summary.withIncrement', {min, inc})
})
</script>

<style lang="scss" scoped>
.new-game-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  width: 100%;
  max-width: 36rem;
  padding-bottom: $spacing-4;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  // --- Mode cards ---

  &__modes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-3;

    @include breakpoint-down($breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }

  &__mode-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    padding: $spacing-4;
    background: var(--bg-elevated);
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-base;
    cursor: pointer;
    text-align: left;
    transition: border-color $transition-fast, background $transition-fast;

    &:hover:not(.is-disabled) {
      border-color: var(--accent);
      background: var(--bg-hover);
    }

    &.is-selected {
      border-color: var(--accent);
      background: var(--accent-subtle);
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__mode-icon {
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__mode-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__mode-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  &__mode-desc {
    font-size: $font-size-xs;
    color: var(--text-muted);
    line-height: $line-height-base;
  }

  &__mode-badge {
    position: absolute;
    top: $spacing-2;
    right: $spacing-2;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border: $border-width-thin solid var(--border-color);
    border-radius: $border-radius-full;
    padding: 1px $spacing-2;
    white-space: nowrap;
  }

  // --- Players ---

  &__players {
    display: flex;
    flex-direction: column;
    gap: $spacing-5;
  }

  &__player {
    // was a .c-label (which provided display:flex) — now a plain div, so set it here,
    // otherwise the column gap collapses and the label sticks to the input.
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-3;

    .c-input.is-invalid {
      border-color: var(--danger);
    }
  }

  &__name-row {
    display: flex;
    flex: 1;
    gap: $spacing-2;
    min-width: 0;

    .c-input {
      flex: 1;
      min-width: 0;
    }
  }

  &__dice {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0 $spacing-3;
    color: var(--text-secondary);
    background: transparent;
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: var(--accent);
      border-color: var(--accent);
    }
  }

  &__identity {
    display: flex;
    align-items: stretch;
    gap: $spacing-2;
    width: 100%;
  }

  &__avatar-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2.75rem;
    padding: 5px;
    background: var(--bg-elevated);
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover {
      border-color: var(--accent);
    }
  }

  &__error {
    color: var(--danger);
    font-size: $font-size-sm;
  }

  &__player-label {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-weight: $font-weight-medium;
    color: var(--text-primary);
  }

  &__piece {
    font-size: $font-size-lg;
    line-height: 1;
  }

  // --- Timer ---

  &__timer-collapse {
    overflow: hidden;
  }

  &__timer-fields {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    padding: $spacing-4;
    background: var(--bg-secondary);
    border-radius: $border-radius-base;
    border: $border-width-thin solid var(--border-color);
  }

  &__timer-summary {
    margin: 0;
    font-style: italic;
  }

  // --- Actions ---

  &__actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-3;
    padding: $spacing-4 0;
  }
}

// --- Timer fields collapse transition ---

.timer-fields-enter-active,
.timer-fields-leave-active {
  transition: height $transition-base, opacity $transition-base;
}

.timer-fields-enter-from,
.timer-fields-leave-to {
  opacity: 0;
}
</style>
