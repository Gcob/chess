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
        :class="{ 'is-selected': id === selected, 'is-disabled': id === taken }"
        :disabled="id === taken"
        :aria-label="$t(`avatars.${id}`)"
        @click="choose(id)"
      >
        <PlayerAvatar :id="id" />
      </button>
    </div>
  </cModal>
</template>

<script lang="ts" setup>
import {AVATAR_IDS} from '@/themes/avatars'
import PlayerAvatar from '@/components/parts/PlayerAvatar.vue'

defineProps<{
  modelValue: boolean
  selected: string      // the editing player's current avatar
  taken: string         // the other player's avatar — disabled to prevent duplicates
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string]
}>()

const avatarIds = AVATAR_IDS

// Picking an avatar commits immediately and closes the modal — no separate confirm step.
// (Taken avatars are disabled, so this never fires for them.)
function choose(id: string) {
  emit('select', id)
  emit('update:modelValue', false)
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
