<template>
  <NewGamePlayersSection ref="playersSection" :settings="settings" />
  <NewGameTimerSection :settings="settings" />

  <!-- Mobile only: on desktop the pieces never turn (both players face the same screen). -->
  <section v-if="isMobile" class="board-section">
    <h2 class="c-h4">{{ $t('newGame.board.title') }}</h2>
    <label class="c-label">
      <span>{{ $t('newGame.board.autoFlip') }}</span>
      <input type="checkbox" class="c-checkbox" v-model="settingsStore.settings.autoFlipPieces" />
    </label>
  </section>
</template>

<script lang="ts" setup>
import {ref} from 'vue'
import {useIsMobile} from '@/composables/useMediaQuery'
import {useSettingsStore} from '@/stores/useSettingsStore'
import NewGamePlayersSection from '@/components/parts/NewGamePlayersSection.vue'
import NewGameTimerSection from '@/components/parts/NewGameTimerSection.vue'
import type {NewGameSettings} from '@/stores/useNewGameStore'

// Strategy form for the 'local' mode: two players on one screen, optional clock.
// Every mode form honours the same contract: one `settings` DTO prop + an exposed `validate()`
// called by NewGameForm's start button. Multi-root on purpose — the sections land as direct
// flex children of the form, which spaces them like any other section.
defineProps<{ settings: NewGameSettings }>()

// The auto-flip toggle writes a per-viewer setting (it survives across games) — surfaced here
// because game setup is where the two players decide how the phone sits between them.
const settingsStore = useSettingsStore()
const isMobile = useIsMobile()

const playersSection = ref<InstanceType<typeof NewGamePlayersSection> | null>(null)

function validate(): boolean {
  return playersSection.value?.validate() ?? false
}

defineExpose({validate})
</script>

<style lang="scss" scoped>
.board-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
}
</style>
