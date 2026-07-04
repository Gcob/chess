<template>
  <section class="players-section">
    <h2 class="c-h4">{{ $t('newGame.players.title') }}</h2>
    <div class="players-section__players">
      <div class="players-section__player">
        <span class="players-section__label">
          <span class="players-section__piece">♔</span>
          {{ $t('newGame.players.white') }}
        </span>
        <div class="players-section__identity">
          <button
            v-tippy="$t('newGame.players.chooseAvatar')"
            type="button"
            class="players-section__avatar-frame"
            :aria-label="$t('newGame.players.chooseAvatar')"
            @click="avatarPickerFor = 'white'"
          >
            <PlayerAvatar :id="settings.playerWhiteAvatar" />
          </button>
          <div class="players-section__name-row">
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
              class="players-section__dice"
              :aria-label="$t('newGame.players.randomName')"
              @click="generateName('white')"
            >
              <Dices :size="16" />
            </button>
          </div>
        </div>
        <span v-if="startAttempted && errors.playerWhiteName" class="players-section__error">
          {{ $t(`newGame.validation.${errors.playerWhiteName}`) }}
        </span>
      </div>

      <div class="players-section__player">
        <span class="players-section__label">
          <span class="players-section__piece">♚</span>
          {{ $t('newGame.players.black') }}
        </span>
        <div class="players-section__identity">
          <button
            v-tippy="$t('newGame.players.chooseAvatar')"
            type="button"
            class="players-section__avatar-frame"
            :aria-label="$t('newGame.players.chooseAvatar')"
            @click="avatarPickerFor = 'black'"
          >
            <PlayerAvatar :id="settings.playerBlackAvatar" />
          </button>
          <div class="players-section__name-row">
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
              class="players-section__dice"
              :aria-label="$t('newGame.players.randomName')"
              @click="generateName('black')"
            >
              <Dices :size="16" />
            </button>
          </div>
        </div>
        <span v-if="startAttempted && errors.playerBlackName" class="players-section__error">
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
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {Dices} from 'lucide-vue-next'
import {validateNewGamePlayers} from '@/validation/newGame'
import {randomPlayerName} from '@/utils/randomName'
import PlayerAvatar from '@/components/parts/PlayerAvatar.vue'
import AvatarPickerModal from '@/components/parts/AvatarPickerModal.vue'
import type {NewGameSettings} from '@/stores/useNewGameStore'

const props = defineProps<{ settings: NewGameSettings }>()

const {locale} = useI18n()

// Errors are always computed; shown only after a start attempt, then update live as the user fixes.
const startAttempted = ref(false)
const errors = computed(() =>
  validateNewGamePlayers({
    playerWhiteName: props.settings.playerWhiteName,
    playerBlackName: props.settings.playerBlackName,
    playerWhiteAvatar: props.settings.playerWhiteAvatar,
    playerBlackAvatar: props.settings.playerBlackAvatar,
  }),
)

// Called by the parent's start button; reveals errors and reports validity.
function validate(): boolean {
  startAttempted.value = true
  return Object.keys(errors.value).length === 0
}

defineExpose({validate})

// Fills a player's name with a random funny one, retrying so it never matches the other player.
function generateName(color: 'white' | 'black') {
  const other = color === 'white' ? props.settings.playerBlackName : props.settings.playerWhiteName
  let name = randomPlayerName(locale.value)
  for (let guard = 0; name.trim() === other.trim() && guard < 10; guard++) {
    name = randomPlayerName(locale.value)
  }

  if (color === 'white') {
    props.settings.playerWhiteName = name
  } else {
    props.settings.playerBlackName = name
  }
}

// Which player's avatar the modal is editing (null = closed).
const avatarPickerFor = ref<'white' | 'black' | null>(null)
const editingAvatar = computed(() =>
  avatarPickerFor.value === 'black' ? props.settings.playerBlackAvatar : props.settings.playerWhiteAvatar,
)
const otherAvatar = computed(() =>
  avatarPickerFor.value === 'black' ? props.settings.playerWhiteAvatar : props.settings.playerBlackAvatar,
)

function selectAvatar(id: string) {
  if (avatarPickerFor.value === 'white') {
    props.settings.playerWhiteAvatar = id
  } else if (avatarPickerFor.value === 'black') {
    props.settings.playerBlackAvatar = id
  }

  avatarPickerFor.value = null
}
</script>

<style lang="scss" scoped>
.players-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__players {
    display: flex;
    flex-direction: column;
    gap: $spacing-5;
  }

  &__player {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-3;

    .c-input.is-invalid {
      border-color: var(--danger);
    }
  }

  &__label {
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

  &__error {
    color: var(--danger);
    font-size: $font-size-sm;
  }
}
</style>
