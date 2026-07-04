<template>
  <div class="new-game-form">
    <NewGameModeSection :settings="settings" />
    <NewGamePlayersSection ref="playersSection" :settings="settings" />
    <NewGameTimerSection :settings="settings" />

    <div class="new-game-form__actions">
      <cButton variant="ter" :to="{ name: 'home' }">{{ $t('common.cancel') }}</cButton>
      <cButton @click="handleStart">{{ $t('newGame.startButton') }}</cButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {storeToRefs} from 'pinia'
import {useNewGameStore} from '@/stores/useNewGameStore'
import NewGameModeSection from '@/components/parts/NewGameModeSection.vue'
import NewGamePlayersSection from '@/components/parts/NewGamePlayersSection.vue'
import NewGameTimerSection from '@/components/parts/NewGameTimerSection.vue'

// The whole form is driven by one DTO — the reactive `settings` from the store. Each section
// receives it and reads/writes its own fields, so there is no prop/event drilling.
const store = useNewGameStore()
const {settings} = storeToRefs(store)

const emit = defineEmits<{ start: [] }>()

const playersSection = ref<InstanceType<typeof NewGamePlayersSection> | null>(null)

function handleStart() {
  if (playersSection.value?.validate()) {
    emit('start')
  }
}
</script>

<style lang="scss" scoped>
.new-game-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  width: 100%;
  max-width: 36rem;
  padding-bottom: $spacing-4;

  &__actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-3;
    padding: $spacing-4 0;
  }
}
</style>
