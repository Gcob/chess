<template>
  <div class="new-game-form">
    <NewGameModeSection :settings="settings" />
    <component :is="modeForm" ref="modeFormRef" :settings="settings" />

    <div class="new-game-form__actions">
      <cButton variant="ter" :to="{ name: 'home' }">{{ $t('common.cancel') }}</cButton>
      <cButton @click="handleStart">{{ $t('newGame.startButton') }}</cButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, type Component} from 'vue'
import {storeToRefs} from 'pinia'
import {useNewGameStore, type NewGameMode} from '@/stores/useNewGameStore'
import NewGameModeSection from '@/components/parts/NewGameModeSection.vue'
import NewGameLocalForm from '@/components/parts/NewGameLocalForm.vue'
import NewGameDevForm from '@/components/parts/NewGameDevForm.vue'

// The whole form is driven by one DTO — the reactive `settings` from the store. The selected
// mode resolves the rest of the form (strategy pattern): one form component per mode, each
// honouring the same contract — a single `settings` prop + an exposed `validate()`. The map
// stays partial on purpose: an unavailable mode can't be selected.
const modeForms: Partial<Record<NewGameMode, Component>> = {
  local: NewGameLocalForm,
  dev: NewGameDevForm,
}

// The strategy contract, as the parent sees it.
interface ModeFormInstance {
  validate: () => boolean
}

const store = useNewGameStore()
const {settings} = storeToRefs(store)

const emit = defineEmits<{ start: [] }>()

const modeForm = computed(() => modeForms[settings.value.mode])
const modeFormRef = ref<ModeFormInstance | null>(null)

function handleStart() {
  if (modeFormRef.value?.validate()) {
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
