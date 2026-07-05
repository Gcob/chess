<template>
  <cModal
    :model-value="modelValue"
    size="sm"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>{{ $t('newGame.players.chooseAvatar') }}</template>

    <div class="avatar-picker">
      <button
        v-for="id in avatarIds"
        :key="id"
        v-tippy="$t(`avatars.${id}`)"
        type="button"
        class="avatar-picker__item"
        :class="{ 'is-selected': id === localId, 'is-disabled': id === taken }"
        :disabled="id === taken"
        :aria-label="$t(`avatars.${id}`)"
        @click="localId = id"
      >
        <PlayerAvatar :id="id" />
      </button>
    </div>

    <template #footer>
      <cButton variant="sec" @click="confirm(false)">{{ $t('newGame.players.avatarConfirm') }}</cButton>
      <cButton @click="confirm(true)">{{ $t('newGame.players.avatarConfirmWithName') }}</cButton>
    </template>
  </cModal>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'
import {AVATAR_IDS} from '@/themes/avatars'
import PlayerAvatar from '@/components/parts/PlayerAvatar.vue'

const props = defineProps<{
  modelValue: boolean
  selected: string      // the editing player's current avatar
  taken: string         // the other player's avatar — disabled to prevent duplicates
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string, withName: boolean]
}>()

const avatarIds = AVATAR_IDS

// Local (tentative) selection — committed only when a footer button is pressed.
const localId = ref(props.selected)
watch(
  () => props.modelValue,
  open => {
    if (open) {
      localId.value = props.selected
    }
  },
)

function confirm(withName: boolean) {
  emit('select', localId.value, withName)
}
</script>

<style lang="scss" scoped>
.avatar-picker {
  display: grid;
  // smaller, auto-fitting cells so the grid stays short (no modal scrollbar) and breathes
  grid-template-columns: repeat(auto-fill, minmax(3.25rem, 1fr));
  gap: $spacing-4;
  padding: $spacing-2;

  &__item {
    aspect-ratio: 1;
    padding: $spacing-2;
    background: var(--bg-elevated);
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover:not(.is-disabled) {
      border-color: var(--text-muted);
    }

    &.is-selected {
      border-color: var(--accent);
    }

    &.is-disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }
}
</style>
