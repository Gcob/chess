<template>
  <NewGamePlayersSection ref="playersSection" :settings="settings" />
  <NewGameTimerSection :settings="settings" />
</template>

<script lang="ts" setup>
import {ref} from 'vue'
import NewGamePlayersSection from '@/components/parts/NewGamePlayersSection.vue'
import NewGameTimerSection from '@/components/parts/NewGameTimerSection.vue'
import type {NewGameSettings} from '@/stores/useNewGameStore'

// Strategy form for the 'local' mode: two players on one screen, optional clock.
// Every mode form honours the same contract: one `settings` DTO prop + an exposed `validate()`
// called by NewGameForm's start button. Multi-root on purpose — the sections land as direct
// flex children of the form, which spaces them like any other section.
defineProps<{ settings: NewGameSettings }>()

const playersSection = ref<InstanceType<typeof NewGamePlayersSection> | null>(null)

function validate(): boolean {
  return playersSection.value?.validate() ?? false
}

defineExpose({validate})
</script>
