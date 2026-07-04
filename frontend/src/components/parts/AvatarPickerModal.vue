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
        type="button"
        class="avatar-picker__item"
        :class="{ 'is-selected': id === selected, 'is-disabled': id === taken }"
        :disabled="id === taken"
        @click="$emit('select', id)"
      >
        <PlayerAvatar :id="id" />
      </button>
    </div>

    <template #footer="{ close }">
      <cButton variant="ter" @click="close">{{ $t('common.close') }}</cButton>
    </template>
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

defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string]
}>()

const avatarIds = AVATAR_IDS
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
